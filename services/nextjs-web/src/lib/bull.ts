import { Queue } from 'bullmq'
import { redis } from './redis'

export interface SubmissionJobPayload {
  application_id: string
  code: string
  language: string
  test_cases?: unknown
  time_limit?: number
}

export const SubmissionQueue = new Queue<SubmissionJobPayload>('submissions', {
  connection: redis.duplicate(),
})

export async function addSubmissionJob(payload: SubmissionJobPayload): Promise<string> {
  const job = await SubmissionQueue.add('submission', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  })
  return job.id!
}
