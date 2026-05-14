import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)

  // Create session
  fastify.post('/sessions', async (request) => {
    const schema = z.object({
      courseId: z.string(),
      title: z.string()
    })
    const { courseId, title } = schema.parse(request.body)
    return fastify.prisma.chatSession.create({
      data: { userId: request.user.id, courseId, title }
    })
  })

  // List sessions
  fastify.get('/sessions', async (request) => {
    return fastify.prisma.chatSession.findMany({
      where: { userId: request.user.id },
      orderBy: { createdAt: 'desc' }
    })
  })

  // Get messages for a session
  fastify.get('/sessions/:id/messages', async (request, reply) => {
    const { id: sessionId } = request.params as { id: string }

    const session = await fastify.prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { userId: true }
    })

    if (!session || session.userId !== request.user.id) {
      return reply.status(404).send({ message: 'Session not found' })
    }

    return fastify.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    })
  })

  // Send message and get AI response (RAG + Streaming)
  fastify.post('/sessions/:id/messages', async (request, reply) => {
    const { id: sessionId } = request.params as { id: string }
    const { content } = request.body as { content: string }

    const session = await fastify.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { course: true }
    })

    if (!session || session.userId !== request.user.id) {
      return reply.status(404).send({ message: 'Session not found' })
    }

    // 1. Save user message
    await fastify.prisma.chatMessage.create({
      data: { sessionId, role: 'user', content }
    })

    // 2. Embed query and vector search
    let context = ''
    try {
      const embedding = await fastify.ai.embed(content)

      const chunks: any[] = await fastify.prisma.$queryRaw`
        SELECT c."content", c."documentId", c."chunkIndex",
               1 - (c."embedding" <=> ${embedding}::vector) as similarity
        FROM "DocumentChunk" c
        JOIN "Document" d ON c."documentId" = d."id"
        WHERE d."courseId" = ${session.courseId}
        AND 1 - (c."embedding" <=> ${embedding}::vector) > 0.75
        ORDER BY similarity DESC
        LIMIT 5
      `

      if (chunks.length > 0) {
        context = chunks.map((c: any) => c.content).join('\n\n')
      }
    } catch {
      // Embedding failed — proceed without context
    }

    // 3. Call AI for grounded response (Streaming)
    const stream = await fastify.ai.chatStream(
      `You are an academic assistant for PLASU students.
      Use the following context to answer the user's question.
      If the answer is not in the context or no context is provided,
      say "I could not find an answer to this in the uploaded materials."
      
      Context:
      ${context || 'No relevant context found.'}`,
      [{ role: 'user', content }]
    )

    reply.hijack()
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Credentials': 'true'
    })

    let fullAnswer = ''
    try {
      for await (const text of stream) {
        fullAnswer += text
        reply.raw.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    } catch (err: any) {
      reply.raw.write(`data: ${JSON.stringify({ error: err?.message || 'Stream failed' })}\n\n`)
    }

    // 4. Save assistant message
    await fastify.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: fullAnswer,
        sourcesUsed: context ? [{ contextLength: context.length }] : []
      }
    })

    reply.raw.end()
  })
}

export default chatRoutes
