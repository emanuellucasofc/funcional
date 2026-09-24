import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth'

export async function reportRoutes(app: FastifyInstance) {
  // GET /reports/frequency?startDate=&endDate=&studentId=&classId=
  app.get('/frequency', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      studentId: z.string().optional(),
      classId: z.string().optional(),
      dayOfWeek: z.string().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
    })

    const query = schema.safeParse(request.query)
    if (!query.success) return reply.status(400).send({ error: 'Parâmetros inválidos' })

    const { startDate, endDate, studentId, classId, status } = query.data
    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    const studentWhere: any = {}
    if (status) studentWhere.status = status
    if (studentId) studentWhere.id = studentId

    const students = await prisma.student.findMany({
      where: studentWhere,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, status: true },
    })

    const report = await Promise.all(
      students.map(async (s) => {
        const attendanceWhere: any = {
          studentId: s.id,
          ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
          ...(classId && { classId }),
        }

        const [presences, absences] = await Promise.all([
          prisma.attendance.count({ where: { ...attendanceWhere, status: 'PRESENT' } }),
          prisma.attendance.count({ where: { ...attendanceWhere, status: 'ABSENT' } }),
        ])

        const total = presences + absences
        const percentage = total > 0 ? Math.round((presences / total) * 1000) / 10 : 0

        return { ...s, presences, absences, total, percentage }
      })
    )

    return reply.send({ report })
  })

  // GET /reports/absences?month=&year=
  app.get('/absences', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      month: z.coerce.number().optional(),
      year: z.coerce.number().optional(),
      limit: z.coerce.number().default(20),
    })

    const query = schema.safeParse(request.query)
    if (!query.success) return reply.status(400).send({ error: 'Parâmetros inválidos' })

    const now = new Date()
    const month = query.data.month ?? (now.getMonth() + 1)
    const year = query.data.year ?? now.getFullYear()

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const grouped = await prisma.attendance.groupBy({
      by: ['studentId'],
      where: { status: 'ABSENT', date: { gte: startDate, lte: endDate } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: query.data.limit,
    })

    const studentIds = grouped.map((g) => g.studentId)
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, name: true, status: true },
    })

    const studentMap = Object.fromEntries(students.map((s) => [s.id, s]))
    const report = grouped.map((g) => ({
      student: studentMap[g.studentId],
      absences: g._count.id,
    }))

    return reply.send({ month, year, report })
  })

  // GET /reports/by-class?month=&year=
  app.get('/by-class', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      month: z.coerce.number().optional(),
      year: z.coerce.number().optional(),
    })
    const query = schema.safeParse(request.query)
    if (!query.success) return reply.status(400).send({ error: 'Parâmetros inválidos' })

    const now = new Date()
    const month = query.data.month ?? (now.getMonth() + 1)
    const year = query.data.year ?? now.getFullYear()
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const classes = await prisma.class.findMany({ where: { isActive: true }, orderBy: { startTime: 'asc' } })

    const report = await Promise.all(
      classes.map(async (cls) => {
        const [present, absent] = await Promise.all([
          prisma.attendance.count({ where: { classId: cls.id, status: 'PRESENT', date: { gte: startDate, lte: endDate } } }),
          prisma.attendance.count({ where: { classId: cls.id, status: 'ABSENT', date: { gte: startDate, lte: endDate } } }),
        ])
        const total = present + absent
        return { class: cls, present, absent, total, percentage: total > 0 ? Math.round((present / total) * 100) : 0 }
      })
    )

    return reply.send({ report })
  })
}
