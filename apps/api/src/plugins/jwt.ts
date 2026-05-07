import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'

export default fp(async (fastify) => {
  console.log('JWT Secret (first 5 chars):', process.env.JWT_SECRET?.slice(0, 5))
  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'supersecret',
    cookie: {
      cookieName: 'refreshToken',
      signed: false
    },
    sign: {
      expiresIn: '1d'
    }
  })

  fastify.register(fastifyCookie)
})
