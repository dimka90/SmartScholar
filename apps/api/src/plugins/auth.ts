import { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { Role } from '@prisma/client'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireRole: (roles: Role[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; role: Role }
    user: { id: string; role: Role }
  }
}

export default fp(async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.decorate('requireRole', (roles: Role[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user
      if (!user || !roles.includes(user.role)) {
        return reply.status(403).send({ message: 'Forbidden: Insufficient permissions' })
      }
    }
  })
})
