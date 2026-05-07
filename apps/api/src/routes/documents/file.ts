import { FastifyPluginAsync } from 'fastify'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Public route - no auth preHandler - serves PDF files from disk.
 * Token is passed in the query string so it works inside <iframe> tags.
 * File: routes/documents/file.ts → registered at /api/documents/:id/file
 */
const documentFileRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:id/file', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { token } = request.query as { token?: string }

    if (!token) {
      return reply.status(401).send({ message: 'Token query parameter is required' })
    }

    // Manually verify the JWT from the query string (bypasses cookie-based jwtVerify)
    let decoded: any
    try {
      decoded = fastify.jwt.verify(token)
    } catch (err: any) {
      return reply.status(401).send({ message: 'Invalid or expired token', error: err.message })
    }

    const document = await fastify.prisma.document.findUnique({
      where: { id }
    })

    if (!document) return reply.status(404).send({ message: 'Document not found' })

    const absolutePath = path.join(__dirname, '../../../', document.filePath)
    if (!fs.existsSync(absolutePath)) {
      return reply.status(404).send({ message: 'File not found on disk' })
    }

    const stream = fs.createReadStream(absolutePath)
    return reply.type('application/pdf').send(stream)
  })
}

export default documentFileRoute
