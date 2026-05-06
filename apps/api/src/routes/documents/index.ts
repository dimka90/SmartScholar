import { FastifyPluginAsync } from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Role, DocumentType } from '@smartscholar/db'

const documentRoutes: FastifyPluginAsync = async (fastify) => {
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

    // TODO: Enqueue RAG processing job (BullMQ)
    
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
