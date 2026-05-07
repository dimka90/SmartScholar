import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const forumRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)

  // Create post
  fastify.post('/posts', async (request, reply) => {
    const schema = z.object({
      courseId: z.string(),
      title: z.string(),
      content: z.string(),
      tags: z.array(z.string()).optional()
    })

    const { courseId, title, content, tags } = schema.parse(request.body)

    // AI Moderation
    let isFlagged = false
    try {
      const moderation = await fastify.openai.moderations.create({ input: `${title}\n${content}` })
      isFlagged = moderation.results[0].flagged
    } catch (err) {
      fastify.log.error('OpenAI moderation failed', err)
      // Default to unflagged if moderation API fails
    }

    const post = await fastify.prisma.$transaction(async (tx) => {
      const newPost = await tx.forumPost.create({
        data: {
          userId: request.user.id,
          courseId,
          title,
          content,
          tags: tags || [],
          isFlagged,
          isApproved: !isFlagged
        }
      })

      await tx.user.update({
        where: { id: request.user.id },
        data: { points: { increment: 5 } }
      })

      return newPost
    })

    return post
  })

  // List posts
  fastify.get('/posts', async (request) => {
    const { courseId, tags } = request.query as any
    return fastify.prisma.forumPost.findMany({
      where: {
        courseId: courseId || undefined,
        tags: tags ? { hasSome: tags.split(',') } : undefined,
        isApproved: true
      },
      include: { user: { select: { name: true, avatarUrl: true } }, _count: { select: { replies: true } } },
      orderBy: { createdAt: 'desc' }
    })
  })

  // Get post with replies
  fastify.get('/posts/:id', async (request) => {
    const { id } = request.params as { id: string }
    return fastify.prisma.forumPost.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, avatarUrl: true } },
        replies: {
          include: { user: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    })
  })

  // Reply to post
  fastify.post('/posts/:id/replies', async (request) => {
    const { id: postId } = request.params as { id: string }
    const { content } = request.body as { content: string }

    return fastify.prisma.$transaction(async (tx) => {
      const reply = await tx.forumReply.create({
        data: {
          postId,
          userId: request.user.id,
          content
        }
      })

      await tx.user.update({
        where: { id: request.user.id },
        data: { points: { increment: 2 } }
      })

      return reply
    })
  })

  // Get Leaderboard
  fastify.get('/leaderboard', async () => {
    return fastify.prisma.user.findMany({
      orderBy: { points: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        points: true
      }
    })
  })
}

export default forumRoutes
