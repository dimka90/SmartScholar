import { FastifyPluginAsync } from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Role, DocumentType } from '@smartscholar/db'
import { documentQueue } from '../../lib/queue'

const documentRoutes: FastifyPluginAsync = async (fastify) => {
  // ── All routes below require authentication via preHandler ──
  // Note: The /:id/file route lives in file.ts, registered at the app level with no auth.
  fastify.addHook('preHandler', fastify.authenticate)

  // Upload document
  fastify.post('/upload', async (request, reply) => {
    const data = await request.file()
    if (!data) return reply.status(400).send({ message: 'No file uploaded' })

    if (data.mimetype !== 'application/pdf') {
      return reply.status(400).send({ message: 'Only PDF files are allowed' })
    }

    const fields = data.fields as any
    const title = fields.title?.value
    const courseId = fields.courseId?.value
    const type = fields.type?.value as DocumentType

    if (!title || !courseId || !type) {
      return reply.status(400).send({ message: 'Missing required fields' })
    }

    const fileName = `${Date.now()}-${data.filename}`
    const filePath = path.join('uploads', fileName)
    const absolutePath = path.join(__dirname, '../../../', filePath)

    await pipeline(data.file, fs.createWriteStream(absolutePath))

    const document = await fastify.prisma.document.create({
      data: {
        title,
        type,
        courseId,
        uploadedById: request.user.id,
        filePath,
        fileSize: 0, // Should calculate from stream if possible
        mimeType: data.mimetype
      }
    })

    await documentQueue.add('process', {
      documentId: document.id,
      filePath: document.filePath
    })
    
    return document
  })

  // List documents
  fastify.get('/', async (request) => {
    const { courseId, type, tags } = request.query as any
    return fastify.prisma.document.findMany({
      where: {
        courseId: courseId || undefined,
        type: type || undefined,
        tags: tags ? { hasSome: tags.split(',') } : undefined,
        isActive: true
      },
      include: { course: true, uploadedBy: { select: { name: true } } }
    })
  })

  // Get single document
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const document = await fastify.prisma.document.findUnique({
      where: { id },
      include: { 
        course: { select: { code: true, name: true } }, 
        uploadedBy: { select: { name: true } } 
      }
    })
    if (!document) return reply.status(404).send({ message: 'Document not found' })
    return document
  })


  // Summarize document

  // Summarize document
  fastify.post('/:id/summarize', async (request, reply) => {
    const { id } = request.params as { id: string }

    const document = await fastify.prisma.document.findUnique({
      where: { id },
      include: { chunks: { orderBy: { chunkIndex: 'asc' }, take: 10 } } // Take first 10 chunks for summary
    })

    if (!document) return reply.status(404).send({ message: 'Document not found' })
    if (document.summaryCache) return document.summaryCache

    const context = document.chunks.map((c: any) => c.content).join('\n\n')

    const response = await fastify.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Generate a structured academic summary for this document. 
          Return JSON format: { "overview": "...", "keyConcepts": ["...", "..."], "examTopics": ["...", "..."] }`
        },
        { role: 'user', content: context }
      ],
      response_format: { type: 'json_object' }
    })

    const summary = JSON.parse(response.choices[0].message.content || '{}')

    await fastify.prisma.document.update({
      where: { id },
      data: { summaryCache: summary }
    })

    return summary
  })

  // Delete document (soft delete)
  fastify.delete('/:id', async (request) => {
    const { id } = request.params as { id: string }
    return fastify.prisma.document.update({
      where: { id },
      data: { isActive: false }
    })
  })
}

export default documentRoutes
