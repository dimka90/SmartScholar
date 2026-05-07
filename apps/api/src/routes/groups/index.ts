import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const groupRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)

  // Create study group
  fastify.post('/', async (request) => {
    const schema = z.object({
      name: z.string(),
      courseId: z.string()
    })
    const { name, courseId } = schema.parse(request.body)
    
    return fastify.prisma.studyGroup.create({
      data: {
        name,
        courseId,
        createdById: request.user.id,
        members: { connect: { id: request.user.id } }
      }
    })
  })

  // List all study groups
  fastify.get('/', async (request) => {
    const { courseId } = request.query as any
    return fastify.prisma.studyGroup.findMany({
      where: { courseId: courseId || undefined },
      include: { 
        course: { select: { code: true } }, 
        _count: { select: { members: true } },
        creator: { select: { name: true } }
      }
    })
  })

  // Join a group
  fastify.post('/:id/join', async (request) => {
    const { id } = request.params as { id: string }
    return fastify.prisma.studyGroup.update({
      where: { id },
      data: {
        members: { connect: { id: request.user.id } }
      }
    })
  })

  // Get group messages
  fastify.get('/:id/messages', async (request) => {
    const { id: groupId } = request.params as { id: string }
    return fastify.prisma.groupMessage.findMany({
      where: { groupId },
      include: { user: { select: { name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' }
    })
  })

  // Send message to group
  fastify.post('/:id/messages', async (request, reply) => {
    const { id: groupId } = request.params as { id: string }
    const { content } = request.body as { content: string }

    const isMember = await fastify.prisma.studyGroup.findFirst({
      where: { id: groupId, members: { some: { id: request.user.id } } }
    })

    if (!isMember) return reply.status(403).send({ message: 'Not a member of this group' })

    return fastify.prisma.groupMessage.create({
      data: {
        groupId,
        userId: request.user.id,
        content
      }
    })
  })
}

export default groupRoutes
