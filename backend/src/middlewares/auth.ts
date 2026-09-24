import { FastifyRequest, FastifyReply } from 'fastify'

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({ error: 'Não autenticado. Faça login para continuar.' })
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply)
  const user = request.user as any
  if (user?.role !== 'ADMIN') {
    reply.status(403).send({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' })
  }
}
