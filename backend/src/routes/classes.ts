import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth'
import { createAuditLog } from '../utils/audit'

export async function classRoutes(app: FastifyInstance) {
  // GET /classes
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const classes = await prisma.class.findMany({
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
      include: {
        _count: { select: { studentClasses: { where: { student: { status: 'ACTIVE' } } } } },
      },
    })
    return reply.send({ classes })
  })

  // GET /classes/:id
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const cls = await prisma.class.findUnique({
      where: { id },
      include: {
        studentClasses: {
          include: {
            student: { select: { id: true, name: true, phone: true, status: true } },
          },
          where: { student: { status: 'ACTIVE' } },
        },
      },
    })
    if (!cls) return reply.status(404).send({ error: 'Turma não encontrada.' })
    return reply.send({ class: cls })
  })

  // POST /classes
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(2),
      dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
      startTime: z.string(),
      endTime: z.string(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: result.error.flatten() })
    }

    const cls = await prisma.class.create({ data: result.data })

    const payload = request.user as any
    await createAuditLog({
      userId: payload.userId,
      action: 'CREATE',
      entity: 'Class',
      entityId: cls.id,
      newValue: { name: cls.name, dayOfWeek: cls.dayOfWeek },
    })

    return reply.status(201).send({ class: cls })
  })

  // PUT /classes/:id
  app.put('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      name: z.string().min(2).optional(),
      dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']).optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      isActive: z.boolean().optional(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados inválidos' })
    }

    const cls = await prisma.class.update({ where: { id }, data: result.data })
    return reply.send({ class: cls })
  })

  // DELETE /classes/:id
  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    await prisma.class.update({ where: { id }, data: { isActive: false } })
    return reply.send({ message: 'Turma desativada com sucesso.' })
  })

  // POST /classes/:id/students
  app.post('/:id/students', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({ studentId: z.string() })
    const result = schema.safeParse(request.body)
    if (!result.success) return reply.status(400).send({ error: 'Dados inválidos' })

    const sc = await prisma.studentClass.create({
      data: { studentId: result.data.studentId, classId: id },
    })
    return reply.status(201).send({ studentClass: sc })
  })

  // DELETE /classes/:id/students/:studentId
  app.delete('/:id/students/:studentId', { preHandler: [authenticate] }, async (request, reply) => {
    const { id, studentId } = request.params as { id: string; studentId: string }
    await prisma.studentClass.deleteMany({ where: { classId: id, studentId } })
    return reply.send({ message: 'Aluno removido da turma.' })
  })
}
