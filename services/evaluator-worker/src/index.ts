import './config/loadEnv'
import { Worker } from 'bullmq'
import IORedis, { type RedisOptions } from 'ioredis'

/**
 * System design / LLM evaluation queue (BullMQ consumer).
 * Placeholder: completes jobs with a no-op result until real scoring is implemented.
 * Queue name must match producers when they are added to nextjs-web.
 */
export const SYSTEM_DESIGN_QUEUE_NAME =
  process.env.EVALUATOR_QUEUE_NAME || 'system-design-evaluation'

function createRedisConnection(): IORedis {
  const redisUrl =
    process.env.REDIS_URL ||
    process.env.REDIS_CONNECTION_STRING ||
    process.env.REDIS_URI

  if (redisUrl) {
    return new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  }

  const parsedPort = Number(process.env.REDIS_PORT || '6379')
  const useTls = (process.env.REDIS_TLS || '').toLowerCase() === 'true'
  const options: RedisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number.isFinite(parsedPort) ? parsedPort : 6379,
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(useTls ? { tls: {} } : {}),
  }
  return new IORedis(options)
}

const connection = createRedisConnection()

export const evaluatorWorker = new Worker(
  SYSTEM_DESIGN_QUEUE_NAME,
  async (job) => {
    console.info(
      `[evaluator-worker] Received job ${job.id} (placeholder — implement LLM evaluation)`,
    )
    return { ok: true, placeholder: true, jobName: job.name }
  },
  { connection, concurrency: 1 },
)

evaluatorWorker.on('failed', (job, err) => {
  console.error(
    `[evaluator-worker] Job ${job?.id} failed: ${err?.message || err}`,
  )
})

let shuttingDown = false
async function shutdown(): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true
  await evaluatorWorker.close()
  await connection.quit()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())

void evaluatorWorker
  .waitUntilReady()
  .then(() => {
    console.info(
      `[evaluator-worker] Listening on queue "${SYSTEM_DESIGN_QUEUE_NAME}"`,
    )
  })
  .catch((err) => {
    console.error('[evaluator-worker] Failed to start', err)
    process.exit(1)
  })
