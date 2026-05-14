import OpenAI from 'openai'

export interface OpenAIProviderConfig {
  apiKey: string
  baseUrl?: string
  chatModel: string
  embedModel?: string
}

export function createOpenAIProvider(config: OpenAIProviderConfig) {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || undefined
  })

  return {
    async chat(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>, responseFormat?: 'json_object' | 'text') {
      const response = await client.chat.completions.create({
        model: config.chatModel,
        messages: [{ role: 'system', content: system }, ...messages],
        response_format: responseFormat === 'json_object' ? { type: 'json_object' } : undefined
      })
      return response.choices[0].message.content || ''
    },

    async chatStream(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
      const stream = await client.chat.completions.create({
        model: config.chatModel,
        messages: [{ role: 'system', content: system }, ...messages],
        stream: true
      })

      async function* generate() {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) yield text
        }
      }

      return generate()
    },

    async embed(text: string) {
      const response = await client.embeddings.create({
        model: config.embedModel || 'text-embedding-3-small',
        input: text
      })
      return response.data[0].embedding
    },

    async moderate(text: string) {
      const response = await client.moderations.create({ input: text })
      return response.results[0].flagged
    }
  }
}
