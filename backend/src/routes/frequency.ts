import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth'

export async function frequencyRoutes(app: FastifyInstance) {
  // GET /frequency/student/:id?month=9&year=2026
  app.get('/student/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      month: z.coerce.number().min(1).max(12).optional(),
      year: z.coerce.number().optional(),
    })

    const query = schema.safeParse(request.query)
    if (!query.success) return reply.status(400).send({ error: 'Parâmetros inválidos' })

    const now = new Date()
    const month = query.data.month ?? (now.getMonth() + 1)
    const year = query.data.year ?? now.getFullYear()

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const [presences, absences, history] = await Promise.all([
      prisma.attendance.count({
        where: { studentId: id, status: 'PRESENT', date: { gte: startDate, lte: endDate } },
      }),
      prisma.attendance.count({
        where: { studentId: id, status: 'ABSENT', date: { gte: startDate, lte: endDate } },
      }),
      prisma.attendance.findMany({
        where: { studentId: id, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'desc' },
        include: { class: { select: { name: true, dayOfWeek: true, startTime: true, endTime: true } } },
      }),
    ])

    const total = presences + absences
    const percentage = total > 0 ? Math.round((presences / total) * 100) : 0

    return reply.send({ month, year, presences, absences, total, percentage, history })
  })

  // GET /frequency/monthly?month=9&year=2026
  app.get('/monthly', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      month: z.coerce.number().min(1).max(12).optional(),
      year: z.coerce.number().optional(),
    })

    const query = schema.safeParse(request.query)
    if (!query.success) return reply.status(400).send({ error: 'Parâmetros inválidos' })

    const now = new Date()
    const month = query.data.month ?? (now.getMonth() + 1)
    const year = query.data.year ?? now.getFullYear()
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const [totalPresent, totalAbsent, activeStudents] = await Promise.all([
      prisma.attendance.count({ where: { status: 'PRESENT', date: { gte: startDate, lte: endDate } } }),
      prisma.attendance.count({ where: { status: 'ABSENT', date: { gte: startDate, lte: endDate } } }),
      prisma.student.count({ where: { status: 'ACTIVE' } }),
    ])

    const total = totalPresent + totalAbsent
    const percentage = total > 0 ? Math.round((totalPresent / total) * 100) : 0

    // Daily breakdown for the month
    const dailyData = await prisma.attendance.groupBy({
      by: ['date', 'status'],
      where: { date: { gte: startDate, lte: endDate } },
      _count: { id: true },
      orderBy: { date: 'asc' },
    })

    const dailyMap: Record<string, { present: number; absent: number }> = {}
    for (const d of dailyData) {
      const key = d.date.toISOString().split('T')[0]
      if (!dailyMap[key]) dailyMap[key] = { present: 0, absent: 0 }
      if (d.status === 'PRESENT') dailyMap[key].present = d._count.id
      else dailyMap[key].absent = d._count.id
    }

    return reply.send({
      month,
      year,
      totalPresent,
      totalAbsent,
      total,
      percentage,
      activeStudents,
      dailyBreakdown: dailyMap,
    })
  })
}
