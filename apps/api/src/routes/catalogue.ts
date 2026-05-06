import { FastifyPluginAsync } from 'fastify'

const catalogueRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)

  fastify.get('/departments', async () => {
    return fastify.prisma.department.findMany({
      include: { _count: { select: { courses: true } } }
    })
  })

  fastify.get('/courses', async (request) => {
    const { departmentId, level, semester } = request.query as any
    return fastify.prisma.course.findMany({
      where: {
        departmentId: departmentId || undefined,
        level: level ? parseInt(level) : undefined,
        semester: semester ? parseInt(semester) : undefined
      },
      include: { department: true }
    })
  })
}

export default catalogueRoutes
