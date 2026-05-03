import IORedis, { type RedisOptions } from 'ioredis'

/**
 * Mirrors the connection precedence used by services/cv-parser-worker and
 * services/nextjs-web/lib/bull.ts so all queues land on the same Redis.
 */
export function createRedisConnection(): IORedis {
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
