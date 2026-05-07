import { FastifyPluginAsync } from 'fastify'

const lecturerRoutes: FastifyPluginAsync = async (fastify) => {
  // Only lecturers and admins can access these
  fastify.addHook('preHandler', fastify.authorize(['LECTURER', 'ADMIN']))

  // Get lecturer's assigned courses with student stats
  fastify.get('/courses', async (request) => {
    // In a real app, we'd filter by lecturerId. For now, show all courses
    return fastify.prisma.course.findMany({
      include: {
        _count: { select: { documents: true, exams: true } },
        department: { select: { name: true } }
      }
    })
  })

  // Get performance overview for a course
  fastify.get('/courses/:id/performance', async (request) => {
    const { id: courseId } = request.params as { id: string }
    
    const sessions = await fastify.prisma.examSession.findMany({
      where: { courseId, completedAt: { not: null } },
      select: { score: true, totalQuestions: true, createdAt: true }
    })

    const avgScore = sessions.length > 0 
      ? sessions.reduce((acc: number, s: any) => acc + (s.score / s.totalQuestions), 0) / sessions.length
      : 0

    return {
      totalAttempts: sessions.length,
      averageScore: Math.round(avgScore * 100),
      recentActivity: sessions.slice(0, 10)
    }
  })
}

export default lecturerRoutes
