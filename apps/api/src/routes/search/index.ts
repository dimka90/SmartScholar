import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)

  fastify.get('/', {
    schema: {
      querystring: z.object({
        q: z.string().min(2)
      })
    }
  }, async (request) => {
    const { q } = request.query as { q: string }

    const [documents, posts] = await Promise.all([
      fastify.prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { course: { code: { contains: q, mode: 'insensitive' } } }
          ]
        },
        include: { course: { select: { code: true } } },
        take: 10
      }),
      fastify.prisma.forumPost.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } }
          ]
        },
        include: { user: { select: { name: true } } },
        take: 10
      })
    ])

    return {
      documents: documents.map((d: any) => ({ ...d, type: 'DOCUMENT' })),
      posts: posts.map((p: any) => ({ ...p, type: 'FORUM_POST' }))
    }
  })
}

export default searchRoutes
