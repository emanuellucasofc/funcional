import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'

import { authRoutes } from './routes/auth'
import { studentRoutes } from './routes/students'
import { classRoutes } from './routes/classes'
import { attendanceRoutes } from './routes/attendance'
import { frequencyRoutes } from './routes/frequency'
import { alertRoutes } from './routes/alerts'
import { reportRoutes } from './routes/reports'
import { settingsRoutes } from './routes/settings'
import { userRoutes } from './routes/users'
import { calendarRoutes } from './routes/calendar'
import { auditRoutes } from './routes/audit'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
})

async function bootstrap() {
  // CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  // Rate limiting
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  })

  // JWT
  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'default-secret-change-in-production',
  })

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // Routes
  app.register(authRoutes, { prefix: '/auth' })
  app.register(studentRoutes, { prefix: '/students' })
  app.register(classRoutes, { prefix: '/classes' })
  app.register(attendanceRoutes, { prefix: '/attendance' })
  app.register(frequencyRoutes, { prefix: '/frequency' })
  app.register(alertRoutes, { prefix: '/alerts' })
  app.register(reportRoutes, { prefix: '/reports' })
  app.register(settingsRoutes, { prefix: '/settings' })
  app.register(userRoutes, { prefix: '/users' })
  app.register(calendarRoutes, { prefix: '/calendar' })
  app.register(auditRoutes, { prefix: '/audit-logs' })

  // Global error handler
  app.setErrorHandler((error: any, request, reply) => {
    app.log.error(error)
    if (error.validation) {
      return reply.status(400).send({ error: 'Dados inválidos', details: error.validation })
    }
    reply.status(error.statusCode ?? 500).send({
      error: error.message ?? 'Erro interno do servidor.',
    })
  })

  const port = parseInt(process.env.PORT ?? '3001')
  const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'

  await app.listen({ port, host })
  console.log(`🚀 Server running at http://${host}:${port}`)
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
