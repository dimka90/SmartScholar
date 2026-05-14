import { Worker, Job } from 'bullmq'
import fs from 'node:fs/promises'
import path from 'node:path'
import { PDFParse } from 'pdf-parse'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import OpenAI from 'openai'
import { PrismaClient } from '@smartscholar/db'

const prisma = new PrismaClient()

async function getEmbeddingClient() {
  // 1. Try dedicated embedding provider (isEmbedProvider = true)
  const embedProv = await prisma.aiProvider.findFirst({ where: { isEmbedProvider: true } })
  if (embedProv?.embedModel) {
    return { client: new OpenAI({ apiKey: embedProv.apiKey, baseURL: embedProv.baseUrl || undefined }), model: embedProv.embedModel }
  }

  // 2. Fall back to env var
  if (process.env.OPENAI_API_KEY) {
    return { client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }), model: 'text-embedding-3-small' }
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

      const { client: openai, model: embedModel } = await getEmbeddingClient()

      for (let i = 0; i < chunks.length; i++) {
        const content = chunks[i]
        const embeddingRes = await openai.embeddings.create({
          model: embedModel,
          input: content
        })
        const embedding = embeddingRes.data[0].embedding

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
