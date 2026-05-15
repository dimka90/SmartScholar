import { Worker, Job } from 'bullmq'
import fs from 'node:fs/promises'
import path from 'node:path'
import { PDFParse } from 'pdf-parse'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { PrismaClient } from '@smartscholar/db'
import { createProviderInstance, AiProviderConfig } from './ai'

const prisma = new PrismaClient()

async function getEmbeddingClient() {
  // 1. Try dedicated embedding provider
  const embedProv = await prisma.aiProvider.findFirst({ where: { isEmbedProvider: true } })
  if (embedProv) {
    const config: AiProviderConfig = {
      id: embedProv.id, name: embedProv.name, provider: embedProv.provider as any,
      apiKey: embedProv.apiKey, baseUrl: embedProv.baseUrl,
      chatModel: embedProv.chatModel, embedModel: embedProv.embedModel
    }
    const instance = createProviderInstance(config)
    return instance
  }

  // 2. Fall back to env var with OpenAI
  if (process.env.OPENAI_API_KEY) {
    const config: AiProviderConfig = {
      id: 'env', name: 'Env Embed', provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY, baseUrl: null,
      chatModel: 'gpt-4o', embedModel: 'text-embedding-3-small'
    }
    return createProviderInstance(config)
  }

  throw new Error('No embedding provider configured. Set an AI provider with isEmbedProvider=true and an embedModel.')
}

export const ragWorker = new Worker(
  'document-processing',
  async (job: Job) => {
    const { documentId, filePath } = job.data
    const absolutePath = path.join(__dirname, '../../', filePath)

    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { processingStatus: 'processing' }
      })

      const dataBuffer = await fs.readFile(absolutePath)
      const parser = new PDFParse({ data: dataBuffer })
      const info = await parser.getText()
      const text = info.text

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50
      })
      const chunks = await splitter.splitText(text)

      const embedder = await getEmbeddingClient()

      for (let i = 0; i < chunks.length; i++) {
        const content = chunks[i]
        const embedding = await embedder.embed(content)

        await prisma.$executeRaw`
          INSERT INTO "DocumentChunk" ("id", "documentId", "content", "chunkIndex", "embedding")
          VALUES (
            gen_random_uuid()::text,
            ${documentId},
            ${content},
            ${i},
            ${embedding}::vector
          )
        `
      }

      await prisma.document.update({
        where: { id: documentId },
        data: { processingStatus: 'ready' }
      })

      console.log(`Document ${documentId} processed successfully`)
    } catch (error: any) {
      await prisma.document.update({
        where: { id: documentId },
        data: { processingStatus: 'failed' }
      })
      console.error(`Error processing document ${documentId}:`, error)
      throw error
    }
  },
  {
    connection: {
      url: process.env.REDIS_URL || 'redis://localhost:6381'
    }
  }
)
