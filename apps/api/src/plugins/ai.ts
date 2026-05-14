import fp from 'fastify-plugin'
import { PrismaClient } from '@smartscholar/db'
import { createProviderInstance, AiProviderConfig, AiProviderInstance } from '../lib/ai'

let cachedProvider: { config: AiProviderConfig; instance: AiProviderInstance } | null = null
let cachedEmbedProvider: { config: AiProviderConfig; instance: AiProviderInstance } | null = null
let lastFetch = 0
let lastEmbedFetch = 0
const CACHE_TTL = 30_000

async function getActiveProvider(prisma: PrismaClient) {
  const now = Date.now()
  if (cachedProvider && now - lastFetch < CACHE_TTL) return cachedProvider

  const record = await prisma.aiProvider.findFirst({ where: { isActive: true } })
  if (!record) { cachedProvider = null; lastFetch = now; return null }

  const config: AiProviderConfig = {
    id: record.id, name: record.name, provider: record.provider as any,
    apiKey: record.apiKey, baseUrl: record.baseUrl, chatModel: record.chatModel, embedModel: record.embedModel
  }
  cachedProvider = { config, instance: createProviderInstance(config) }
  lastFetch = now
  return cachedProvider
}

async function getActiveEmbedProvider(prisma: PrismaClient) {
  const now = Date.now()
  if (cachedEmbedProvider && now - lastEmbedFetch < CACHE_TTL) return cachedEmbedProvider

  const record = await prisma.aiProvider.findFirst({ where: { isEmbedProvider: true } })
  if (!record) return null

  const config: AiProviderConfig = {
    id: record.id, name: record.name, provider: record.provider as any,
    apiKey: record.apiKey, baseUrl: record.baseUrl, chatModel: record.chatModel, embedModel: record.embedModel
  }
  cachedEmbedProvider = { config, instance: createProviderInstance(config) }
  lastEmbedFetch = now
  return cachedEmbedProvider
}

declare module 'fastify' {
  interface FastifyInstance {
    ai: {
      getProvider(): Promise<{ config: AiProviderConfig; instance: AiProviderInstance } | null>
      chat(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>, responseFormat?: 'json_object' | 'text'): Promise<string>
      chatStream(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<AsyncGenerator<string>>
      embed(text: string): Promise<number[]>
      moderate(text: string): Promise<boolean>
    }
  }
}

export default fp(async (fastify) => {
  const provider = {
    getProvider: () => getActiveProvider(fastify.prisma),

    async chat(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>, responseFormat?: 'json_object' | 'text') {
      const active = await getActiveProvider(fastify.prisma)
      if (!active) throw new Error('No active AI provider configured')
      return active.instance.chat(system, messages, responseFormat)
    },

    async chatStream(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
      const active = await getActiveProvider(fastify.prisma)
      if (!active) throw new Error('No active AI provider configured')
      return active.instance.chatStream(system, messages)
    },

    async embed(text: string) {
      const embedProv = await getActiveEmbedProvider(fastify.prisma)
      if (embedProv) return embedProv.instance.embed(text)
      throw new Error('No embedding provider configured. Set a provider with isEmbedProvider=true and an embedModel.')
    },

    async moderate(text: string) {
      const active = await getActiveProvider(fastify.prisma)
      if (!active) throw new Error('No active AI provider configured')
      return active.instance.moderate(text)
    }
  }

  fastify.decorate('ai', provider)
})
