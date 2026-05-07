import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'

export default fp(async (fastify) => {
  // 1. Helmet for security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: process.env.NODE_ENV === 'production'
  })

  // 2. CORS configuration
  await fastify.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || true,
    credentials: true
  })

  // 3. Rate limiting (General)
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute'
  })

  // 4. Stricter Rate Limiting for Auth
  fastify.addHook('onRoute', (routeOptions) => {
    if (routeOptions.url?.includes('/auth/login') || routeOptions.url?.includes('/auth/register')) {
      routeOptions.config = {
        ...routeOptions.config,
        rateLimit: {
          max: 5,
          timeWindow: '1 minute'
        }
      }
    }
  })

  // 4. Custom Error Handler for Zod/Validation
  fastify.setErrorHandler((error: any, request, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: error.validation
      })
    }
    
    // Log error
    fastify.log.error(error)
    
    reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name || 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
    })
  })
})
