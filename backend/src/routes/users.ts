import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { requireAdmin } from '../middlewares/auth'

export async function userRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [requireAdmin] }, async (request, reply) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { name: 'asc' },
    })
    return reply.send({ users })
  })

  app.post('/', { preHandler: [requireAdmin] }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(['ADMIN', 'INSTRUCTOR']).default('INSTRUCTOR'),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) return reply.status(400).send({ error: 'Dados inválidos', details: result.error.flatten() })

    const existing = await prisma.user.findUnique({ where: { email: result.data.email } })
    if (existing) return reply.status(409).send({ error: 'E-mail já cadastrado.' })

    const passwordHash = await bcrypt.hash(result.data.password, 12)
    const user = await prisma.user.create({
      data: { name: result.data.name, email: result.data.email, passwordHash, role: result.data.role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    return reply.status(201).send({ user })
  })

  app.put('/:id', { preHandler: [requireAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      name: z.string().min(2).optional(),
      role: z.enum(['ADMIN', 'INSTRUCTOR']).optional(),
      isActive: z.boolean().optional(),
      password: z.string().min(6).optional(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) return reply.status(400).send({ error: 'Dados inválidos' })

    const { password, ...data } = result.data
    const updateData: any = { ...data }
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })
    return reply.send({ user })
  })
}
