import { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { Role } from '@smartscholar/db'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireRole: (roles: Role[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authorize: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
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
    const authHeader = request.headers.authorization
    if (!authHeader) {
      return reply.status(401).send({ message: 'Missing Authorization header' })
    }
    try {
      await request.jwtVerify()
    } catch (err: any) {
      console.error('JWT Verification Error:', err?.message || err)
      return reply.status(401).send({ message: 'Invalid or expired token' })
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

  fastify.decorate('authorize', (roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      await fastify.authenticate(request, reply)
      if (!roles.includes(request.user.role)) {
        return reply.status(403).send({ message: 'Forbidden' })
      }
    }
  })
})
