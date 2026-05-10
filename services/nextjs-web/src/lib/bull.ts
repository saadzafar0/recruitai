import { Queue } from 'bullmq'
import IORedis, { type RedisOptions } from 'ioredis'

export const CV_PROCESSING_QUEUE_NAME = 'cv-processing'
export const CODE_SUBMISSIONS_QUEUE_NAME = 'code-submissions'
export const VOICE_EVALUATION_QUEUE_NAME = 'voice-interview-evaluation'
export const SYSTEM_DESIGN_EVALUATION_QUEUE_NAME = 'system-design-evaluation'

export interface SubmissionJobPayload {
	application_id: string
	code: string
	language: string
	test_cases?: unknown
	time_limit?: number
}

type BullResources = {
	connection: IORedis
	cvProcessingQueue: Queue
	codeSubmissionsQueue: Queue<SubmissionJobPayload>
	voiceEvaluationQueue: Queue
	systemDesignEvaluationQueue: Queue
}

type GlobalWithBullResources = typeof globalThis & {
	__recruitAiBullResources__?: BullResources
}

function createRedisConnection(): IORedis {
	// Prefer full connection string environment variables
	const redisUrl =
		process.env.REDIS_URL ||
		process.env.REDIS_CONNECTION_STRING ||
		process.env.REDIS_URI

	if (redisUrl) {
		return new IORedis(redisUrl, {
			maxRetriesPerRequest: null,
			enableReadyCheck: false,
			lazyConnect: true,
		})
	}

	// If no connection string provided, require explicit host/port via env.
	const host = process.env.REDIS_HOST
	const portEnv = process.env.REDIS_PORT

	if (!host || !portEnv) {
		throw new Error(
			'No Redis connection configured. Set REDIS_URL or REDIS_HOST and REDIS_PORT in your .env.local',
		)
	}

	const parsedPort = Number(portEnv)
	const parsedDb = Number(process.env.REDIS_DB || '0')
	const useTls = (process.env.REDIS_TLS || '').toLowerCase() === 'true'

	const options: RedisOptions = {
		host,
		port: Number.isFinite(parsedPort) ? parsedPort : undefined,
		db: Number.isFinite(parsedDb) ? parsedDb : undefined,
		username: process.env.REDIS_USERNAME || undefined,
		password: process.env.REDIS_PASSWORD || undefined,
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
		lazyConnect: true,
		...(useTls ? { tls: {} } : {}),
	}

	return new IORedis(options)
}

function createBullResources(): BullResources {
	const connection = createRedisConnection()

	return {
		connection,
		cvProcessingQueue: new Queue(CV_PROCESSING_QUEUE_NAME, { connection }),
		codeSubmissionsQueue: new Queue<SubmissionJobPayload>(CODE_SUBMISSIONS_QUEUE_NAME, { connection }),
		voiceEvaluationQueue: new Queue(VOICE_EVALUATION_QUEUE_NAME, { connection }),
		systemDesignEvaluationQueue: new Queue(SYSTEM_DESIGN_EVALUATION_QUEUE_NAME, { connection }),
	}
}

const globalWithBullResources = globalThis as GlobalWithBullResources

const bullResources =
	globalWithBullResources.__recruitAiBullResources__ || createBullResources()

if (process.env.NODE_ENV !== 'production') {
	globalWithBullResources.__recruitAiBullResources__ = bullResources
}

export const redisConnection = bullResources.connection
export const cvProcessingQueue = bullResources.cvProcessingQueue
export const codeSubmissionsQueue = bullResources.codeSubmissionsQueue
export const voiceEvaluationQueue = bullResources.voiceEvaluationQueue
export const systemDesignEvaluationQueue = bullResources.systemDesignEvaluationQueue

export async function addSubmissionJob(payload: SubmissionJobPayload): Promise<string> {
	const job = await codeSubmissionsQueue.add('submission', payload, {
		attempts: 3,
		backoff: { type: 'exponential', delay: 1000 },
	})
	return job.id!
}
