import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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
    const moderation = await openai.moderations.create({ input: `${title}\n${content}` })
    const isFlagged = moderation.results[0].flagged

    const post = await fastify.prisma.forumPost.create({
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

    return fastify.prisma.forumReply.create({
      data: {
        postId,
        userId: request.user.id,
        content
      }
    })
  })
}

export default forumRoutes
