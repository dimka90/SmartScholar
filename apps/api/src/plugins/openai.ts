import fp from 'fastify-plugin'
import OpenAI from 'openai'

declare module 'fastify' {
  interface FastifyInstance {
    openai: OpenAI
  }
}

export default fp(async (fastify) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })

  fastify.decorate('openai', openai)
})
