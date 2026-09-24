import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin } from '../middlewares/auth'
import { createAuditLog } from '../utils/audit'

export async function studentRoutes(app: FastifyInstance) {
  // GET /students
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      name: z.string().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
      classId: z.string().optional(),
      dayOfWeek: z.string().optional(),
      startTime: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
    })

    const query = schema.safeParse(request.query)
    if (!query.success) {
      return reply.status(400).send({ error: 'ParÃ¢metros invÃ¡lidos' })
    }

    const { name, status, classId, page, limit } = query.data
    const skip = (page - 1) * limit

    const where: any = {}
    if (name) where.name = { contains: name, mode: 'insensitive' }
    if (status) where.status = status
    if (classId) {
      where.studentClasses = { some: { classId } }
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          studentClasses: {
            include: {
              class: { select: { id: true, name: true, dayOfWeek: true, startTime: true, endTime: true } },
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ])

    return reply.send({ students, total, page, limit })
  })

  // GET /students/:id
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        studentClasses: {
          include: {
            class: true,
          },
        },
      },
    })

    if (!student) return reply.status(404).send({ error: 'Aluno nÃ£o encontrado.' })
    return reply.send({ student })
  })

  // POST /students
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(2),
      cpf: z.string().optional().nullable(),
      birthDate: z.string().optional().nullable(),
      age: z.number().optional().nullable(),
      phone: z.string().optional().nullable(),
      emergencyContact: z.string().optional().nullable(),
      email: z.string().email().or(z.literal('')).optional().nullable(),
      address: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      education: z.string().optional().nullable(),
      weight: z.number().optional().nullable(),
      height: z.number().optional().nullable(),
      hasHealthIssues: z.boolean().optional(),
      healthIssuesDetails: z.string().optional().nullable(),
      enrollmentDate: z.string().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).default('ACTIVE'),
      notes: z.string().optional().nullable(),
      classIds: z.array(z.string()).optional(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados invÃ¡lidos', details: result.error.flatten() })
    }

    const { classIds, birthDate, enrollmentDate, ...data } = result.data

    const student = await prisma.student.create({
      data: {
        ...data,
        birthDate: birthDate ? new Date(birthDate) : null,
        enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : undefined,
        studentClasses: classIds
          ? { create: classIds.map((classId) => ({ classId })) }
          : undefined,
      },
      include: {
        studentClasses: { include: { class: true } },
      },
    })

    const payload = request.user as any
    await createAuditLog({
      userId: payload.userId,
      action: 'CREATE',
      entity: 'Student',
      entityId: student.id,
      newValue: { name: student.name, status: student.status },
    })

    return reply.status(201).send({ student })
  })

  // PUT /students/:id
  app.put('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const schema = z.object({
      name: z.string().min(2).optional(),
      cpf: z.string().optional().nullable(),
      birthDate: z.string().optional().nullable(),
      age: z.number().optional().nullable(),
      phone: z.string().optional().nullable(),
      emergencyContact: z.string().optional().nullable(),
      email: z.string().email().or(z.literal('')).optional().nullable(),
      address: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      education: z.string().optional().nullable(),
      weight: z.number().optional().nullable(),
      height: z.number().optional().nullable(),
      hasHealthIssues: z.boolean().optional(),
      healthIssuesDetails: z.string().optional().nullable(),
      status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']).optional(),
      notes: z.string().optional().nullable(),
      classIds: z.array(z.string()).optional(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Dados invÃ¡lidos', details: result.error.flatten() })
    }

    const existing = await prisma.student.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ error: 'Aluno nÃ£o encontrado.' })

    const { classIds, birthDate, ...data } = result.data

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...data,
        birthDate: birthDate ? new Date(birthDate) : null,
        ...(classIds !== undefined && {
          studentClasses: {
            deleteMany: {},
            create: classIds.map((classId) => ({ classId })),
          },
        }),
      },
      include: {
        studentClasses: { include: { class: true } },
      },
    })

    const payload = request.user as any
    await createAuditLog({
      userId: payload.userId,
      action: 'UPDATE',
      entity: 'Student',
      entityId: id,
      oldValue: { name: existing.name, status: existing.status },
      newValue: { name: student.name, status: student.status },
    })

    return reply.send({ student })
  })

  // PATCH /students/:id/status
  app.patch('/:id/status', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED']),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'Status invÃ¡lido' })
    }

    const existing = await prisma.student.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ error: 'Aluno nÃ£o encontrado.' })

    const student = await prisma.student.update({
      where: { id },
      data: { status: result.data.status },
    })

    const payload = request.user as any
    await createAuditLog({
      userId: payload.userId,
      action: 'STATUS_CHANGE',
      entity: 'Student',
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status: student.status },
    })

    return reply.send({ student })
  })

  // DELETE /students/:id
  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const existing = await prisma.student.findUnique({ where: { id } })
    if (!existing) return reply.status(404).send({ error: 'Aluno não encontrado.' })
    
    // We could hard delete or soft delete. Let's do a soft delete or change status to INACTIVE.
    // Given the user wants to 'delete', it's usually better to actually delete or just set status INACTIVE.
    // Let's perform a hard delete, cascading relations if needed.
    
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { studentId: id } }),
      prisma.alert.deleteMany({ where: { studentId: id } }),
      prisma.studentClass.deleteMany({ where: { studentId: id } }),
      prisma.student.delete({ where: { id } })
    ])
    
    const payload = request.user as any
    await createAuditLog({
      userId: payload.userId,
      action: 'DELETE',
      entity: 'Student',
      entityId: id,
      oldValue: { name: existing.name },
    })

    return reply.send({ message: 'Aluno removido com sucesso.' })
  })
}

