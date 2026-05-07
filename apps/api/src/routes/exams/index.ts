import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const examRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)

  // Trigger question extraction (Lecturer/Admin)
  fastify.post('/extract-questions', async (request, reply) => {
    const { documentId } = request.body as { documentId: string }
    const doc = await fastify.prisma.document.findUnique({
      where: { id: documentId },
      include: { chunks: { take: 15 } }
    })

    if (!doc) return reply.status(404).send({ message: 'Document not found' })

    const context = doc.chunks.map(c => c.content).join('\n\n')

    const response = await fastify.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Extract 5 multiple-choice questions from this academic text. 
          Return JSON format: { "questions": [ { "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": "...", "explanation": "..." } ] }`
        },
        { role: 'user', content: context }
      ],
      response_format: { type: 'json_object' }
    })

    const { questions } = JSON.parse(response.choices[0].message.content || '{"questions":[]}')

    for (const q of questions) {
      await fastify.prisma.extractedQuestion.create({
        data: {
          documentId,
          courseId: doc.courseId,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        }
      })
    }

    return { message: `${questions.length} questions extracted` }
  })

  // Start exam session
  fastify.post('/sessions', async (request) => {
    const { courseId } = request.body as { courseId: string }
    const questions = await fastify.prisma.extractedQuestion.findMany({
      where: { courseId },
      take: 10
    })

    return fastify.prisma.examSession.create({
      data: {
        userId: request.user.id,
        courseId,
        questions: questions as any,
        totalQuestions: questions.length,
        answers: {}
      }
    })
  })

  // Submit exam session
  fastify.post('/sessions/:id/submit', async (request) => {
    const { id } = request.params as { id: string }
    const { answers } = request.body as { answers: Record<string, string> }

    const session = await fastify.prisma.examSession.findUnique({
      where: { id }
    })

    if (!session) throw new Error('Session not found')

    let score = 0
    const questions = session.questions as any[]
    
    questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        score++
      }
    })

    return fastify.prisma.examSession.update({
      where: { id },
      data: {
        answers: answers as any,
        score,
        completedAt: new Date()
      }
    })
  })
}

export default examRoutes
