import { Worker, Job } from 'bullmq'
import fs from 'node:fs/promises'
import path from 'node:path'
import pdf from 'pdf-parse'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import OpenAI from 'openai'
import { PrismaClient } from '@smartscholar/db'

const prisma = new PrismaClient()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const ragWorker = new Worker(
  'document-processing',
  async (job: Job) => {
    const { documentId, filePath } = job.data
    const absolutePath = path.join(__dirname, '../../../', filePath)

    try {
      // 0. Update status to processing
      await prisma.document.update({
        where: { id: documentId },
        data: { processingStatus: 'processing' }
      })

      // 1. Extract text from PDF
      const dataBuffer = await fs.readFile(absolutePath)
      const data = await pdf(dataBuffer)
      const text = data.text

      // 2. Chunk text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 50
      })
      const chunks = await splitter.splitText(text)

      // 3. Generate embeddings and store
      for (let i = 0; i < chunks.length; i++) {
        const content = chunks[i]
        const embeddingRes = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: content
        })
        const embedding = embeddingRes.data[0].embedding

        // Prisma 6 doesn't support vector types directly yet in all ways, 
        // so we use raw SQL for the embedding column
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

      // 4. Update document status
      await prisma.document.update({
        where: { id: documentId },
        data: { processingStatus: 'ready' }
      })

      console.log(`Document ${documentId} processed successfully`)
    } catch (error) {
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
