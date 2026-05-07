import { FastifyPluginAsync } from 'fastify'

const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)

  // Get leaderboard
  fastify.get('/', async (request) => {
    return fastify.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        points: true,
        avatarUrl: true,
        badges: {
          include: { badge: true }
        }
      },
      orderBy: { points: 'desc' },
      take: 50
    })
  })

  // Get user rank and badges
  fastify.get('/me', async (request) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        points: true,
        badges: {
          include: { badge: true }
        }
      }
    })

    const rank = await fastify.prisma.user.count({
      where: { points: { gt: user?.points || 0 } }
    })

    return { ...user, rank: rank + 1 }
  })
}

export default leaderboardRoutes
