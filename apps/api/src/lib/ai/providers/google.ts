export interface GoogleProviderConfig {
  apiKey: string
  baseUrl?: string
  chatModel: string
  embedModel?: string
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

export function createGoogleProvider(config: GoogleProviderConfig) {
  const baseUrl = config.baseUrl || GEMINI_BASE
  const embedModel = config.embedModel || 'gemini-embedding-2'
  const chatModel = config.chatModel || 'gemini-2.0-flash'

  async function request(path: string, body: any, stream = false) {
    const url = `${baseUrl}${path}${stream ? '' : ''}`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gemini API error (${res.status}): ${err}`)
    }
    return res
  }

  return {
    async chat(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>, responseFormat?: 'json_object' | 'text') {
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))

      const body: any = {
        contents,
        systemInstruction: { parts: [{ text: system }] },
        generationConfig: {}
      }

      if (responseFormat === 'json_object') {
        body.generationConfig.responseMimeType = 'application/json'
      }

      const res = await request(`/models/${chatModel}:generateContent`, body)
      const data = await res.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    },

    async chatStream(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))

      const body: any = {
        contents,
        systemInstruction: { parts: [{ text: system }] }
      }

      const res = await request(`/models/${chatModel}:streamGenerateContent?alt=sse`, body)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      async function* generate() {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const json = JSON.parse(line.slice(6))
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) yield text
            } catch { /* skip malformed */ }
          }
        }
      }

      return generate()
    },

    async embed(text: string) {
      const res = await request(`/models/${embedModel}:embedContent`, {
        content: { parts: [{ text }] }
      })
      const data = await res.json()
      return data.embedding?.values || []
    },

    moderate(_text: string) {
      throw new Error('Gemini does not provide a moderation API. Use OpenAI for moderation.')
    }
  }
}
