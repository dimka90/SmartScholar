import { FastifyPluginAsync } from 'fastify'
import { Role, Difficulty } from '@smartscholar/db'
import { z } from 'zod'
import { createProviderInstance } from '../../lib/ai'
import { documentQueue } from '../../lib/queue'

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)
  fastify.addHook('preHandler', fastify.requireRole([Role.ADMIN]))

  // Helper to log admin actions
  async function log(userId: string, action: string, metadata: Record<string, unknown> = {}) {
    await fastify.prisma.activityLog.create({
      data: { userId, action, metadata: metadata as any }
    })
  }

  // ── Departments ──

  fastify.post('/departments', async (request, reply) => {
    const schema = z.object({
      name: z.string(),
      code: z.string(),
      description: z.string().optional()
    })
    const data = schema.parse(request.body)
    const dept = await fastify.prisma.department.create({ data })
    await log(request.user.id, 'CREATE_DEPARTMENT', { departmentId: dept.id, code: dept.code })
    return dept
  })

  fastify.put('/departments/:id', async (request) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      name: z.string().optional(),
      code: z.string().optional(),
      description: z.string().optional()
    })
    const data = schema.parse(request.body)
    const dept = await fastify.prisma.department.update({ where: { id }, data })
    await log(request.user.id, 'UPDATE_DEPARTMENT', { departmentId: id })
    return dept
  })

  fastify.delete('/departments/:id', async (request) => {
    const { id } = request.params as { id: string }
    await fastify.prisma.department.update({
      where: { id },
      data: { isActive: false }
    })
    await log(request.user.id, 'DELETE_DEPARTMENT', { departmentId: id })
    return { message: 'Department deleted' }
  })

  // ── Courses ──

  fastify.post('/courses', async (request) => {
    const schema = z.object({
      name: z.string(),
      code: z.string(),
      level: z.number(),
      semester: z.number(),
      departmentId: z.string()
    })
    const data = schema.parse(request.body)
    const course = await fastify.prisma.course.create({ data })
    await log(request.user.id, 'CREATE_COURSE', { courseId: course.id, code: course.code })
    return course
  })

  fastify.put('/courses/:id', async (request) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      name: z.string().optional(),
      code: z.string().optional(),
      level: z.number().optional(),
      semester: z.number().optional(),
      departmentId: z.string().optional()
    })
    const data = schema.parse(request.body)
    const course = await fastify.prisma.course.update({ where: { id }, data })
    await log(request.user.id, 'UPDATE_COURSE', { courseId: id })
    return course
  })

  fastify.delete('/courses/:id', async (request) => {
    const { id } = request.params as { id: string }
    await fastify.prisma.course.update({
      where: { id },
      data: { isActive: false }
    })
    await log(request.user.id, 'DELETE_COURSE', { courseId: id })
    return { message: 'Course deleted' }
  })

  // ── Forum Moderation ──

  fastify.get('/forum/flagged', async () => {
    return fastify.prisma.forumPost.findMany({
      where: { isFlagged: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, code: true, name: true } },
        _count: { select: { replies: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
  })

  fastify.put('/forum/posts/:id/approve', async (request) => {
    const { id } = request.params as { id: string }
    const post = await fastify.prisma.forumPost.update({
      where: { id },
      data: { isApproved: true, isFlagged: false }
    })
    await log(request.user.id, 'APPROVE_FORUM_POST', { postId: id })
    return post
  })

  fastify.put('/forum/posts/:id/unflag', async (request) => {
    const { id } = request.params as { id: string }
    const post = await fastify.prisma.forumPost.update({
      where: { id },
      data: { isFlagged: false }
    })
    await log(request.user.id, 'UNFLAG_FORUM_POST', { postId: id })
    return post
  })

  fastify.delete('/forum/posts/:id', async (request) => {
    const { id } = request.params as { id: string }
    await fastify.prisma.forumPost.delete({ where: { id } })
    await log(request.user.id, 'DELETE_FORUM_POST', { postId: id })
    return { message: 'Post deleted' }
  })

  // ── Notification Broadcast ──

  fastify.post('/notifications/broadcast', async (request) => {
    const schema = z.object({
      type: z.string(),
      title: z.string(),
      body: z.string()
    })
    const { type, title, body } = schema.parse(request.body)

    const students = await fastify.prisma.user.findMany({
      where: { role: Role.STUDENT },
      select: { id: true }
    })

    await fastify.prisma.notification.createMany({
      data: students.map(s => ({
        userId: s.id,
        type,
        title,
        body
      }))
    })

    await log(request.user.id, 'BROADCAST_NOTIFICATION', { type, title })
    return { message: `Notification sent to ${students.length} students` }
  })

  // ── Analytics ──

  fastify.get('/analytics/overview', async () => {
    const [totalStudents, totalAdmins, totalDocuments, totalCourses, totalForumPosts, totalExamSessions] =
      await Promise.all([
        fastify.prisma.user.count({ where: { role: Role.STUDENT } }),
        fastify.prisma.user.count({ where: { role: Role.ADMIN } }),
        fastify.prisma.document.count(),
        fastify.prisma.course.count({ where: { isActive: true } }),
        fastify.prisma.forumPost.count(),
        fastify.prisma.examSession.count()
      ])

    return {
      totalStudents,
      totalAdmins,
      totalDocuments,
      totalCourses,
      totalForumPosts,
      totalExamSessions
    }
  })

  fastify.get('/analytics/courses', async () => {
    const courses = await fastify.prisma.course.findMany({
      where: { isActive: true },
      include: {
        department: { select: { name: true } },
        _count: { select: { documents: true, examSessions: true, forumPosts: true } }
      }
    })

    const data = await Promise.all(
      courses.map(async (course) => {
        const sessions = await fastify.prisma.examSession.findMany({
          where: { courseId: course.id, completedAt: { not: null } },
          select: { score: true, totalQuestions: true }
        })

        const avgScore = sessions.length
          ? Math.round(sessions.reduce((sum: number, s: any) => sum + (s.score / s.totalQuestions), 0) / sessions.length * 100)
          : null

        return {
          id: course.id,
          name: course.name,
          code: course.code,
          level: course.level,
          department: course.department.name,
          documents: course._count.documents,
          examSessions: course._count.examSessions,
          forumPosts: course._count.forumPosts,
          averageScore: avgScore
        }
      })
    )

    return data
  })

  // ── Activity Logs ──

  fastify.get('/activity-logs', async (request) => {
    const { page = '1', limit = '50' } = request.query as any
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const [logs, total] = await Promise.all([
      fastify.prisma.activityLog.findMany({
        skip,
        take,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      fastify.prisma.activityLog.count()
    ])

    return { logs, total, page: parseInt(page), totalPages: Math.ceil(total / take) }
  })

  // ── User Management ──

  fastify.get('/users', async (request) => {
    const { page = '1', limit = '50', role, search } = request.query as any
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where: any = {}
    if (role) where.role = role
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [users, total] = await Promise.all([
      fastify.prisma.user.findMany({
        skip,
        take,
        where,
        select: {
          id: true, name: true, email: true, role: true, points: true, isActive: true, createdAt: true,
          _count: { select: { forumPosts: true, examSessions: true, uploadedDocuments: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      fastify.prisma.user.count({ where })
    ])

    return { users, total, page: parseInt(page), totalPages: Math.ceil(total / take) }
  })

  fastify.put('/users/:id/role', async (request) => {
    const { id } = request.params as { id: string }
    const schema = z.object({ role: z.nativeEnum(Role) })
    const { role } = schema.parse(request.body)

    const user = await fastify.prisma.user.update({ where: { id }, data: { role } })
    await log(request.user.id, 'CHANGE_USER_ROLE', { userId: id, newRole: role })
    return user
  })

  fastify.put('/users/:id/suspend', async (request, reply) => {
    const { id } = request.params as { id: string }
    const user = await fastify.prisma.user.findUnique({ where: { id }, select: { isActive: true } })
    if (!user) return reply.status(404).send({ message: 'User not found' })

    const updated = await fastify.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    })
    await log(request.user.id, user.isActive ? 'SUSPEND_USER' : 'UNSUSPEND_USER', { userId: id })
    return updated
  })

  // ── Exam Question Review ──

  fastify.get('/questions', async (request) => {
    const { page = '1', limit = '50', courseId, difficulty } = request.query as any
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where: any = {}
    if (courseId) where.courseId = courseId
    if (difficulty) where.difficulty = difficulty

    const [questions, total] = await Promise.all([
      fastify.prisma.extractedQuestion.findMany({
        skip, take, where,
        include: { course: { select: { code: true, name: true } }, document: { select: { title: true } } },
        orderBy: { id: 'desc' }
      }),
      fastify.prisma.extractedQuestion.count({ where })
    ])

    return { questions, total, page: parseInt(page), totalPages: Math.ceil(total / take) }
  })

  fastify.put('/questions/:id', async (request) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      question: z.string().optional(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string().optional(),
      explanation: z.string().optional(),
      difficulty: z.nativeEnum(Difficulty).optional()
    })
    const data = schema.parse(request.body)
    const q = await fastify.prisma.extractedQuestion.update({ where: { id }, data })
    await log(request.user.id, 'UPDATE_QUESTION', { questionId: id })
    return q
  })

  fastify.delete('/questions/:id', async (request) => {
    const { id } = request.params as { id: string }
    await fastify.prisma.extractedQuestion.delete({ where: { id } })
    await log(request.user.id, 'DELETE_QUESTION', { questionId: id })
    return { message: 'Question deleted' }
  })

  // ── Badge Management ──

  fastify.get('/badges', async () => {
    return fastify.prisma.badge.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' }
    })
  })

  fastify.post('/badges', async (request) => {
    const schema = z.object({
      name: z.string(),
      description: z.string(),
      iconUrl: z.string(),
      criteria: z.any()
    })
    const { name, description, iconUrl, criteria } = schema.parse(request.body)
    const badge = await fastify.prisma.badge.create({
      data: { name, description, iconUrl, criteria }
    })
    await log(request.user.id, 'CREATE_BADGE', { badgeId: badge.id, name })
    return badge
  })

  fastify.put('/badges/:id', async (request) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      iconUrl: z.string().optional(),
      criteria: z.any().optional()
    })
    const data = schema.parse(request.body)
    const badge = await fastify.prisma.badge.update({ where: { id }, data })
    await log(request.user.id, 'UPDATE_BADGE', { badgeId: id })
    return badge
  })

  fastify.delete('/badges/:id', async (request) => {
    const { id } = request.params as { id: string }
    await fastify.prisma.badge.delete({ where: { id } })
    await log(request.user.id, 'DELETE_BADGE', { badgeId: id })
    return { message: 'Badge deleted' }
  })

  fastify.get('/badges/:id/users', async (request) => {
    const { id } = request.params as { id: string }
    const badgeUsers = await fastify.prisma.userBadge.findMany({
      where: { badgeId: id },
      include: { user: { select: { id: true, name: true, email: true, points: true } } },
      orderBy: { awardedAt: 'desc' }
    })
    return badgeUsers
  })

  fastify.post('/badges/:id/award', async (request, reply) => {
    const { id } = request.params as { id: string }
    const schema = z.object({ userId: z.string() })
    const { userId } = schema.parse(request.body)

    const existing = await fastify.prisma.userBadge.findFirst({
      where: { userId, badgeId: id }
    })
    if (existing) return reply.status(409).send({ message: 'User already has this badge' })

    const award = await fastify.prisma.userBadge.create({
      data: { userId, badgeId: id }
    })
    await log(request.user.id, 'AWARD_BADGE', { badgeId: id, userId })
    return award
  })

  fastify.delete('/badges/:id/users/:userId', async (request) => {
    const { id, userId } = request.params as { id: string; userId: string }
    const record = await fastify.prisma.userBadge.findFirst({ where: { badgeId: id, userId } })
    if (!record) return
    await fastify.prisma.userBadge.delete({ where: { id: record.id } })
    await log(request.user.id, 'REVOKE_BADGE', { badgeId: id, userId })
    return { message: 'Badge revoked' }
  })

  // ── System Health ──

  fastify.get('/system/health', async () => {
    const [
      pendingDocuments,
      processingDocuments,
      failedDocuments,
      totalUsers,
      totalNotifications,
      totalQuestions
    ] = await Promise.all([
      fastify.prisma.document.count({ where: { processingStatus: 'pending' } }),
      fastify.prisma.document.count({ where: { processingStatus: 'processing' } }),
      fastify.prisma.document.count({ where: { processingStatus: 'failed' } }),
      fastify.prisma.user.count(),
      fastify.prisma.notification.count(),
      fastify.prisma.extractedQuestion.count()
    ])

    return {
      documents: { pending: pendingDocuments, processing: processingDocuments, failed: failedDocuments },
      totalUsers,
      totalNotifications,
      totalQuestions
    }
  })

  // ── Data Export ──

  fastify.get('/export/:entity', async (request, reply) => {
    const { entity } = request.params as { entity: string }

    let rows: any[] = []
    let headers: string[] = []

    switch (entity) {
      case 'users': {
        const users = await fastify.prisma.user.findMany({
          select: { name: true, email: true, role: true, points: true, isActive: true, createdAt: true }
        })
        headers = ['Name', 'Email', 'Role', 'Points', 'Active', 'Created At']
        rows = users.map(u => [u.name, u.email, u.role, u.points, u.isActive, u.createdAt.toISOString()])
        break
      }
      case 'courses': {
        const courses = await fastify.prisma.course.findMany({
          where: { isActive: true },
          include: { department: { select: { name: true } } }
        })
        headers = ['Code', 'Name', 'Level', 'Semester', 'Department']
        rows = courses.map(c => [c.code, c.name, c.level, c.semester, c.department.name])
        break
      }
      case 'departments': {
        const depts = await fastify.prisma.department.findMany({
          where: { isActive: true }
        })
        headers = ['Code', 'Name', 'Description']
        rows = depts.map(d => [d.code, d.name, d.description || ''])
        break
      }
      case 'documents': {
        const docs = await fastify.prisma.document.findMany({
          where: { isActive: true },
          include: { course: { select: { code: true } }, uploadedBy: { select: { name: true } } }
        })
        headers = ['Title', 'Type', 'Course', 'Uploaded By', 'Status', 'Created At']
        rows = docs.map(d => [d.title, d.type, d.course.code, d.uploadedBy.name, d.processingStatus, d.createdAt.toISOString()])
        break
      }
      default:
        return reply.status(400).send({ message: 'Invalid entity. Valid: users, courses, departments, documents' })
    }

    const csv = [headers.join(','), ...rows.map((r: any[]) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')

    reply.header('Content-Type', 'text/csv')
    reply.header('Content-Disposition', `attachment; filename="${entity}-export.csv"`)
    return reply.send(csv)
  })

  // ── Document Reprocess ──

  fastify.post('/documents/:id/reprocess', async (request, reply) => {
    const { id } = request.params as { id: string }
    const doc = await fastify.prisma.document.findUnique({
      where: { id },
      select: { id: true, filePath: true, title: true }
    })
    if (!doc) return reply.status(404).send({ message: 'Document not found' })

    await fastify.prisma.document.update({
      where: { id },
      data: { processingStatus: 'pending' }
    })

    await documentQueue.add('process', { documentId: doc.id, filePath: doc.filePath })
    await log(request.user.id, 'REPROCESS_DOCUMENT', { documentId: id })
    return { message: `Reprocessing "${doc.title}"` }
  })

  // ── AI Provider Management ──

  fastify.get('/providers', async () => {
    return fastify.prisma.aiProvider.findMany({ orderBy: { createdAt: 'desc' } })
  })

  fastify.post('/providers', async (request) => {
    const schema = z.object({
      name: z.string(),
      provider: z.enum(['openai', 'anthropic', 'google', 'groq', 'togetherai']),
      apiKey: z.string(),
      baseUrl: z.string().optional(),
      chatModel: z.string(),
      embedModel: z.string().optional()
    })
    const data = schema.parse(request.body)
    const provider = await fastify.prisma.aiProvider.create({ data })
    await log(request.user.id, 'CREATE_AI_PROVIDER', { providerId: provider.id, name: provider.name })
    // If this is the first provider, activate it automatically
    const count = await fastify.prisma.aiProvider.count()
    if (count === 1) {
      const update: any = { isActive: true, isEmbedProvider: true }
      await fastify.prisma.aiProvider.update({ where: { id: provider.id }, data: update })
      provider.isActive = true; provider.isEmbedProvider = true
    }
    return provider
  })

  fastify.put('/providers/:id', async (request) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      name: z.string().optional(),
      provider: z.enum(['openai', 'anthropic', 'google', 'groq', 'togetherai']).optional(),
      apiKey: z.string().optional(),
      baseUrl: z.string().optional().nullable(),
      chatModel: z.string().optional(),
      embedModel: z.string().optional().nullable()
    })
    const data = schema.parse(request.body)
    const provider = await fastify.prisma.aiProvider.update({ where: { id }, data })
    await log(request.user.id, 'UPDATE_AI_PROVIDER', { providerId: id })
    return provider
  })

  fastify.delete('/providers/:id', async (request) => {
    const { id } = request.params as { id: string }
    const provider = await fastify.prisma.aiProvider.findUnique({ where: { id }, select: { isActive: true } })
    await fastify.prisma.aiProvider.delete({ where: { id } })
    await log(request.user.id, 'DELETE_AI_PROVIDER', { providerId: id })
    return { message: 'Provider deleted' }
  })

  fastify.get('/providers/:id/set-active', async (request) => {
    const { id } = request.params as { id: string }
    // Deactivate all, activate the target
    await fastify.prisma.aiProvider.updateMany({ data: { isActive: false } })
    const provider = await fastify.prisma.aiProvider.update({ where: { id }, data: { isActive: true } })
    await log(request.user.id, 'SET_ACTIVE_AI_PROVIDER', { providerId: id, name: provider.name })
    return provider
  })

  fastify.get('/providers/:id/test', async (request, reply) => {
    const { id } = request.params as { id: string }
    const record = await fastify.prisma.aiProvider.findUnique({ where: { id } })
    if (!record) return reply.status(404).send({ message: 'Provider not found' })

    const instance = createProviderInstance({
      id: record.id,
      name: record.name,
      provider: record.provider as any,
      apiKey: record.apiKey,
      baseUrl: record.baseUrl,
      chatModel: record.chatModel,
      embedModel: record.embedModel
    })

    try {
      const result = await instance.chat('You are a test assistant. Reply with one word: ok', [{ role: 'user', content: 'Reply with one word.' }])
      return { success: true, response: result }
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err?.message || String(err) })
    }
  })

  fastify.get('/providers/:id/set-embed', async (request) => {
    const { id } = request.params as { id: string }
    await fastify.prisma.aiProvider.updateMany({ data: { isEmbedProvider: false } })
    const provider = await fastify.prisma.aiProvider.update({ where: { id }, data: { isEmbedProvider: true } })
    await log(request.user.id, 'SET_EMBED_AI_PROVIDER', { providerId: id, name: provider.name })
    return provider
  })
}

export default adminRoutes
