import fp from 'fastify-plugin'
import fastifyMultipart from '@fastify/multipart'

export default fp(async (fastify) => {
  fastify.register(fastifyMultipart, {
    limits: {
      fieldNameSize: 100, // Max field name size in bytes
      fieldSize: 1024 * 10, // 10KB
      fields: 10,         // Max number of non-file fields
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 1            // Max number of file fields
    }
  })
})
