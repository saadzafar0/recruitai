import { Queue } from 'bullmq'
import IORedis, { type RedisOptions } from 'ioredis'

export const CV_PROCESSING_QUEUE_NAME = 'cv-processing'
export const CODE_SUBMISSIONS_QUEUE_NAME = 'code-submissions'

type BullResources = {
	connection: IORedis
	cvProcessingQueue: Queue
	codeSubmissionsQueue: Queue
}

type GlobalWithBullResources = typeof globalThis & {
	__recruitAiBullResources__?: BullResources
}

function createRedisConnection(): IORedis {
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

	const parsedPort = Number(process.env.REDIS_PORT || '6379')
	const parsedDb = Number(process.env.REDIS_DB || '0')
	const useTls = (process.env.REDIS_TLS || '').toLowerCase() === 'true'

	const options: RedisOptions = {
		host: process.env.REDIS_HOST || '127.0.0.1',
		port: Number.isFinite(parsedPort) ? parsedPort : 6379,
		db: Number.isFinite(parsedDb) ? parsedDb : 0,
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
		codeSubmissionsQueue: new Queue(CODE_SUBMISSIONS_QUEUE_NAME, { connection }),
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

