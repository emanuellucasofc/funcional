import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middlewares/auth'

export async function alertRoutes(app: FastifyInstance) {
  // GET /alerts
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const schema = z.object({
      isRead: z.enum(['true', 'false']).optional(),
      month: z.coerce.number().optional(),
      year: z.coerce.number().optional(),
    })

    const query = schema.safeParse(request.query)
    if (!query.success) return reply.status(400).send({ error: 'Parâmetros inválidos' })

    const where: any = {}
    if (query.data.isRead !== undefined) where.isRead = query.data.isRead === 'true'
    if (query.data.month) where.month = query.data.month
    if (query.data.year) where.year = query.data.year

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { id: true, name: true },
          include: {
            studentClasses: {
              include: { class: { select: { dayOfWeek: true, startTime: true } } },
            },
          } as any,
        },
      },
    })

    return reply.send({ alerts })
  })

  // GET /alerts/count
  app.get('/count', { preHandler: [authenticate] }, async (request, reply) => {
    const count = await prisma.alert.count({ where: { isRead: false } })
    return reply.send({ count })
  })

  // PATCH /alerts/:id/read
  app.patch('/:id/read', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const alert = await prisma.alert.update({ where: { id }, data: { isRead: true } })
    return reply.send({ alert })
  })

  // PATCH /alerts/read-all
  app.patch('/read-all', { preHandler: [authenticate] }, async (request, reply) => {
    await prisma.alert.updateMany({ where: { isRead: false }, data: { isRead: true } })
    return reply.send({ message: 'Todos os alertas marcados como lidos.' })
  })
}
