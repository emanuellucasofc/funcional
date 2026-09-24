import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth'

const TRAINING_DAYS = ['MONDAY', 'WEDNESDAY', 'FRIDAY']

export async function calendarRoutes(app: FastifyInstance) {
  // GET /calendar/:year/:month
  app.get('/:year/:month', { preHandler: [authenticate] }, async (request, reply) => {
    const { year, month } = request.params as { year: string; month: string }
    const y = parseInt(year)
    const m = parseInt(month)

    const startDate = new Date(y, m - 1, 1)
    const endDate = new Date(y, m, 0)

    // Get all attendance records for the month
    const attendances = await prisma.attendance.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      select: { date: true, status: true, classId: true },
    })

    // Get total active students per class to determine "complete" status
    const classes = await prisma.class.findMany({
      where: { isActive: true, dayOfWeek: { in: TRAINING_DAYS as any } },
      include: { _count: { select: { studentClasses: { where: { student: { status: 'ACTIVE' } } } } } },
    })

    // Build daily status
    const dayMap: Record<string, { total: number; marked: number; status: string }> = {}

    // Mark training days
    const current = new Date(startDate)
    while (current <= endDate) {
      const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][current.getDay()]
      if (TRAINING_DAYS.includes(dayOfWeek)) {
        const key = current.toISOString().split('T')[0]
        const totalStudents = classes.filter(c => c.dayOfWeek === dayOfWeek).reduce((sum, c) => sum + c._count.studentClasses, 0)
        const markedCount = attendances.filter(a => a.date.toISOString().split('T')[0] === key).length
        
        let status = 'PENDING'
        if (current > new Date()) status = 'FUTURE'
        else if (markedCount === 0) status = 'PENDING'
        else if (markedCount < totalStudents) status = 'PARTIAL'
        else status = 'COMPLETE'
        
        dayMap[key] = { total: totalStudents, marked: markedCount, status }
      }
      current.setDate(current.getDate() + 1)
    }

    return reply.send({ year: y, month: m, days: dayMap })
  })
}
