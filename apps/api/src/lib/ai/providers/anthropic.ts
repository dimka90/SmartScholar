export interface AnthropicProviderConfig {
  apiKey: string
  baseUrl?: string
  chatModel: string
}

export function createAnthropicProvider(config: AnthropicProviderConfig) {
  const baseUrl = config.baseUrl || 'https://api.anthropic.com'

  return {
    async chat(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>, responseFormat?: 'json_object' | 'text') {
      const body: any = {
        model: config.chatModel,
        max_tokens: 4096,
        system,
        messages
      }

      if (responseFormat === 'json_object') {
        body.messages.push({
          role: 'assistant',
          content: 'You MUST respond with valid JSON only.'
        })
      }

      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      return data.content?.[0]?.text || ''
    },

    async chatStream(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
      const body: any = {
        model: config.chatModel,
        max_tokens: 4096,
        system,
        messages,
        stream: true
      }

      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Anthropic API error: ${err}`)
      }

      const reader = res.body!.getReader()

      const decoder = new TextDecoder()

      async function* generate() {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
          for (const line of lines) {
            try {
              const json = JSON.parse(line.slice(6))
              if (json.type === 'content_block_delta' && json.delta?.text) {
                yield json.delta.text
              }
            } catch { /* skip malformed chunks */ }
          }
        }
      }

      return generate()
    },

    embed(_text: string) {
      throw new Error('Anthropic does not provide an embedding API. Use OpenAI for embeddings.')
    },

    moderate(_text: string) {
      throw new Error('Anthropic does not provide a moderation API. Use OpenAI for moderation.')
    }
  }
}
