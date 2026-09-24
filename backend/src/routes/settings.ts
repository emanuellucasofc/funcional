import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin } from '../middlewares/auth'

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [authenticate] }, async (request, reply) => {
    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' },
    })
    return reply.send({ settings })
  })

  app.put('/', { preHandler: [requireAdmin] }, async (request, reply) => {
    const schema = z.object({
      companyName: z.string().optional(),
      companyPhone: z.string().optional().nullable(),
      companyEmail: z.string().email().optional().nullable(),
      warningAbsences: z.number().min(1).optional(),
      alertAbsences: z.number().min(1).optional(),
      criticalAbsences: z.number().min(1).optional(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) return reply.status(400).send({ error: 'Dados inválidos' })

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: result.data,
      create: { id: 'default', ...result.data },
    })
    return reply.send({ settings })
  })
}
