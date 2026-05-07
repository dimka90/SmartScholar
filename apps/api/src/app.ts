import { FastifyPluginAsync } from 'fastify'
import path from 'node:path'
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload'
import documentFileRoute from './routes/documents/file'

export type AppOptions = {
  // Place your custom options here
} & Partial<AutoloadPluginOptions>

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // This loads all plugins defined in plugins
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    options: opts
  })

  // Public routes (no auth) — must be registered BEFORE the autoload routes
  // so they are outside the authenticated route scopes
  fastify.register(documentFileRoute, { prefix: '/api/documents' })

  // This loads all plugins defined in routes
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: { ...opts, prefix: '/api' }
  })
}

export default app
export { app }
