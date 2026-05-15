import fp from 'fastify-plugin'
import { PrismaClient } from '@smartscholar/db'
import { createProviderInstance, AiProviderConfig, AiProviderInstance } from '../lib/ai'
import OpenAI from 'openai'

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
      // 1. Keyword-based pre-filter (fast, no API call)
      const keywords = ['kill', 'harm', 'attack', 'bomb', 'terrorist', 'suicide', 'abuse', 'hate', 'racist', 'slur']
      const lower = text.toLowerCase()
      const hasFlaggedKeyword = keywords.some(k => lower.includes(k))
      if (hasFlaggedKeyword) return true

      // 2. Try OpenAI moderation via env var
      if (process.env.OPENAI_API_KEY) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000)
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 5000 })
          const response = await openai.moderations.create({ input: text })
          clearTimeout(timeout)
          return response.results[0].flagged
        } catch {
          // API key may be rate-limited; fall through
        }
      }

      return false
    }
  }

  fastify.decorate('ai', provider)
})
