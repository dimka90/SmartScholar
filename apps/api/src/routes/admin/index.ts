import { FastifyPluginAsync } from 'fastify'
import { Role } from '@smartscholar/db'
import { z } from 'zod'

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.authenticate)
  fastify.addHook('preHandler', fastify.requireRole([Role.ADMIN]))

  // Departments
  fastify.post('/departments', async (request, reply) => {
    const schema = z.object({
      name: z.string(),
      code: z.string(),
      description: z.string().optional()
    })
    const data = schema.parse(request.body)
    const dept = await fastify.prisma.department.create({ data })
    return dept
  })

  fastify.put('/departments/:id', async (request) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      name: z.string().optional(),
      code: z.string().optional(),
      description: z.string().optional()
    })
    const data = schema.parse(request.body)
    return fastify.prisma.department.update({ where: { id }, data })
  })

  fastify.delete('/departments/:id', async (request) => {
    const { id } = request.params as { id: string }
    return fastify.prisma.department.delete({ where: { id } })
  })

  // Courses
  fastify.post('/courses', async (request) => {
    const schema = z.object({
      name: z.string(),
      code: z.string(),
      level: z.number(),
      semester: z.number(),
      departmentId: z.string()
    })
    const data = schema.parse(request.body)
    return fastify.prisma.course.create({ data })
  })

  fastify.put('/courses/:id', async (request) => {
    const { id } = request.params as { id: string }
    const schema = z.object({
      name: z.string().optional(),
      code: z.string().optional(),
      level: z.number().optional(),
      semester: z.number().optional(),
      departmentId: z.string().optional()
    })
    const data = schema.parse(request.body)
    return fastify.prisma.course.update({ where: { id }, data })
  })

  fastify.delete('/courses/:id', async (request) => {
    const { id } = request.params as { id: string }
    return fastify.prisma.course.delete({ where: { id } })
  })
}

export default adminRoutes
