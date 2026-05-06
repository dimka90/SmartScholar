import { Queue } from 'bullmq'

export const documentQueue = new Queue('document-processing', {
  connection: {
    url: process.env.REDIS_URL || 'redis://localhost:6381'
  }
})
