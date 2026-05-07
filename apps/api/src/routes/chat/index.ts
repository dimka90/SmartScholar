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

  // Send message and get RAG response
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

    // 1. Embed query
    const embeddingRes = await fastify.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content
    })
    const embedding = embeddingRes.data[0].embedding

    // 2. Vector search (pgvector)
    // We search for chunks in the same course
    const chunks: any[] = await fastify.prisma.$queryRaw`
      SELECT c."content", c."documentId", c."chunkIndex", 1 - (c."embedding" <=> ${embedding}::vector) as similarity
      FROM "DocumentChunk" c
      JOIN "Document" d ON c."documentId" = d."id"
      WHERE d."courseId" = ${session.courseId}
      AND 1 - (c."embedding" <=> ${embedding}::vector) > 0.75
      ORDER BY similarity DESC
      LIMIT 5
    `

    if (chunks.length === 0) {
      const msg = await fastify.prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'assistant',
          content: 'I could not find an answer to this in the uploaded materials.'
        }
      })
      return msg
    }

    const context = chunks.map(c => c.content).join('\n\n')

    // 3. Call OpenAI for grounded response (Streaming)
    const stream = await fastify.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an academic assistant for PLASU students. 
          Use the following context to answer the user's question. 
          If the answer is not in the context, say "I could not find an answer to this in the uploaded materials."
          
          Context:
          ${context}`
        },
        { role: 'user', content }
      ],
      stream: true
    })

    reply.raw.setHeader('Content-Type', 'text/event-stream')
    reply.raw.setHeader('Cache-Control', 'no-cache')
    reply.raw.setHeader('Connection', 'keep-alive')

    let fullAnswer = ''
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || ''
      fullAnswer += text
      reply.raw.write(`data: ${JSON.stringify({ text })}\n\n`)
    }

    // 4. Save messages
    await fastify.prisma.chatMessage.create({
      data: { sessionId, role: 'user', content }
    })

    await fastify.prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: fullAnswer,
        sourcesUsed: chunks.map(c => ({ documentId: c.documentId, chunkIndex: c.chunkIndex }))
      }
    })

    reply.raw.end()
    return reply // Required to prevent Fastify from trying to send another response
  })
}

export default chatRoutes
