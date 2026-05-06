import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'

export default fp(async (fastify) => {
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'supersecret',
    cookie: {
      cookieName: 'refreshToken',
      signed: false
    },
    sign: {
      expiresIn: '15m'
    }
  })

  fastify.register(fastifyCookie)
})
