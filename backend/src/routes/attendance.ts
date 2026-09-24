import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth'
import { generateAlertsForStudent } from '../utils/alerts'

const DAY_MAP: Record<number, string> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
}

export async function attendanceRoutes(app: FastifyInstance) {
  // GET /attendance/date/:date — chamada de um dia (YYYY-MM-DD)
  app.get('/date/:date', { preHandler: [authenticate] }, async (request, reply) => {
    const { date } = request.params as { date: string }
    const dateObj = new Date(date + 'T00:00:00.000Z')
    const dayOfWeek = DAY_MAP[dateObj.getUTCDay()]

    // Get classes for this day
    const classes = await prisma.class.findMany({
      where: { dayOfWeek: dayOfWeek as any, isActive: true },
      orderBy: { startTime: 'asc' },
      include: {
        studentClasses: {
          where: { student: { status: 'ACTIVE' } },
          include: {
            student: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    })

    // Get existing attendance records for this date
    const attendances = await prisma.attendance.findMany({
      where: { date: dateObj },
      select: { studentId: true, classId: true, status: true, id: true },
    })

    const attendanceMap: Record<string, any> = {}
    for (const a of attendances) {
      attendanceMap[`${a.studentId}-${a.classId}`] = a
    }

    const result = classes.map((cls) => ({
      ...cls,
      students: cls.studentClasses.map((sc) => ({
        ...sc.student,
        attendance: attendanceMap[`${sc.student.id}-${cls.id}`] ?? null,
      })),
      studentClasses: undefined,
    }))

    return reply.send({ date, dayOfWeek, classes: result })
  })

  // POST /attendance — register single attendance
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      studentId: z.string(),
      classId: z.string(),
      date: z.string(), // YYYY-MM-DD
      status: z.enum(['PRESENT', 'ABSENT']),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: result.error.flatten() })
    }

    const payload = request.user as any
    const { studentId, classId, date, status } = result.data
    const dateObj = new Date(date + 'T00:00:00.000Z')

    const attendance = await prisma.attendance.upsert({
      where: { studentId_classId_date: { studentId, classId, date: dateObj } },
      update: { status, markedBy: payload.userId, markedAt: new Date() },
      create: { studentId, classId, date: dateObj, status, markedBy: payload.userId },
    })

    // Generate alerts after marking attendance
    const month = dateObj.getUTCMonth() + 1
    const year = dateObj.getUTCFullYear()
    await generateAlertsForStudent(studentId, month, year)

    return reply.status(201).send({ attendance })
  })

  // POST /attendance/batch — register multiple at once
  app.post('/batch', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      classId: z.string(),
      date: z.string(),
      records: z.array(z.object({
        studentId: z.string(),
        status: z.enum(['PRESENT', 'ABSENT']),
      })),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: result.error.flatten() })
    }

    const payload = request.user as any
    const { classId, date, records } = result.data
    const dateObj = new Date(date + 'T00:00:00.000Z')

    const results = await Promise.all(
      records.map(({ studentId, status }) =>
        prisma.attendance.upsert({
          where: { studentId_classId_date: { studentId, classId, date: dateObj } },
          update: { status, markedBy: payload.userId, markedAt: new Date() },
          create: { studentId, classId, date: dateObj, status, markedBy: payload.userId },
        })
      )
    )

    // Generate alerts for all students
    const month = dateObj.getUTCMonth() + 1
    const year = dateObj.getUTCFullYear()
    await Promise.all(
      records.map(({ studentId }) => generateAlertsForStudent(studentId, month, year))
    )

    return reply.status(201).send({ count: results.length, attendances: results })
  })
}
