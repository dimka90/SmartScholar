import { createOpenAIProvider } from './providers/openai'
import { createAnthropicProvider } from './providers/anthropic'

export type ProviderType = 'openai' | 'anthropic' | 'google' | 'groq' | 'togetherai'

export interface AiProviderConfig {
  id: string
  name: string
  provider: ProviderType
  apiKey: string
  baseUrl: string | null
  chatModel: string
  embedModel: string | null
}

export interface AiProviderInstance {
  chat(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>, responseFormat?: 'json_object' | 'text'): Promise<string>
  chatStream(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<AsyncGenerator<string>>
  embed(text: string): Promise<number[]>
  moderate(text: string): Promise<boolean>
}

export function createProviderInstance(config: AiProviderConfig): AiProviderInstance {
  switch (config.provider) {
    case 'openai':
      return createOpenAIProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || undefined,
        chatModel: config.chatModel,
        embedModel: config.embedModel || undefined
      })
    case 'anthropic':
      return createAnthropicProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || undefined,
        chatModel: config.chatModel
      })
    case 'google':
    case 'groq':
    case 'togetherai':
      return createOpenAIProvider({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl || undefined,
        chatModel: config.chatModel,
        embedModel: config.embedModel || undefined
      })
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`)
  }
}
