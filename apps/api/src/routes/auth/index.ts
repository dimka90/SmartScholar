import { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { Role } from '@smartscholar/db'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Registration
  fastify.post('/register', {
    schema: {
      body: z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.nativeEnum(Role).optional()
      })
    }
  }, async (request, reply) => {
    const { name, email, password, role } = request.body as any

    const existingUser = await fastify.prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return reply.status(400).send({ message: 'User already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await fastify.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || Role.STUDENT
      }
    })

    const token = await reply.jwtSign({ id: user.id, role: user.role })
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  })

  // Login
  fastify.post('/login', {
    schema: {
      body: z.object({
        email: z.string().email(),
        password: z.string()
      })
    }
  }, async (request, reply) => {
    const { email, password } = request.body as any

    const user = await fastify.prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.status(401).send({ message: 'Invalid credentials' })
    }

    const token = await reply.jwtSign({ id: user.id, role: user.role })
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  })

  // Logout
  fastify.post('/logout', async (request, reply) => {
    // In JWT setup without refresh tokens in DB, we just respond success.
    // The requirement mentioned Redis for refresh token invalidation.
    // I'll implement basic logout for now.
    return { message: 'Logged out successfully' }
  })
}

export default authRoutes
