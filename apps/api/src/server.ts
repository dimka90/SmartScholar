import * as dotenv from 'dotenv'
import path from 'node:path'
dotenv.config({ path: path.join(__dirname, '../../../.env') })
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod'
import app from './app'
import './lib/rag-worker'

const server = Fastify({
  logger: true
}).withTypeProvider<ZodTypeProvider>()

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.register(app)

const start = async () => {
  try {
    await server.listen({ port: 4000, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
