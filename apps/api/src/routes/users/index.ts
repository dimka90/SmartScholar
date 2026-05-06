import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'

const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)

  // Get current user
  fastify.get('/me', async (request) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, points: true }
    })
    return user
  })

  // Update password
  fastify.put('/me/password', async (request, reply) => {
    const passwordSchema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6)
    })

    const { currentPassword, newPassword } = passwordSchema.parse(request.body)

    const user = await fastify.prisma.user.findUnique({ where: { id: request.user.id } })
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return reply.status(401).send({ message: 'Invalid current password' })
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    })

    return { message: 'Password updated successfully' }
  })
}

export default userRoutes
