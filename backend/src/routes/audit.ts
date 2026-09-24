import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAdmin } from '../middlewares/auth'

export async function auditRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [requireAdmin] }, async (request, reply) => {
    const schema = z.object({
      entity: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
    })
    const query = schema.safeParse(request.query)
    if (!query.success) return reply.status(400).send({ error: 'Parâmetros inválidos' })

    const { entity, page, limit } = query.data
    const skip = (page - 1) * limit
    const where: any = {}
    if (entity) where.entity = entity

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ])

    return reply.send({ logs, total, page, limit })
  })
}
