import { Job, QueueEvents, UnrecoverableError, Worker } from 'bullmq'
import IORedis, { type RedisOptions } from 'ioredis'
import {
	parseCandidateCvWithLlm,
	type CvParserProvider,
} from '../services/geminiParser'
import {
	downloadCvFromS3,
	InvalidS3LocationError,
} from '../services/s3Downloader'
import {
	extractRawCvText,
	UnsupportedDocumentTypeError,
} from '../services/textExtractor'
import { updateCandidateProfileFromCvParse } from '../services/candidateProfileUpdater'

export const CV_PROCESSING_QUEUE_NAME = 'cv-processing'

export interface CvProcessingJobData {
	candidateProfileId: string
	applicantId?: string
	applicationId?: string
	cvFileUrl: string
	cvFileName?: string
	s3Key?: string
	providerHint?: CvParserProvider
}

export interface CvProcessingJobResult {
	candidateProfileId: string
	providerUsed: CvParserProvider
	extractedSkillsCount: number
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

function requireJobField(value: string | undefined, fieldName: string): string {
	if (!value || !value.trim()) {
		throw new UnrecoverableError(`Missing required field in cv-processing job data: ${fieldName}`)
	}

	return value.trim()
}

async function processCvJob(job: Job<CvProcessingJobData>): Promise<CvProcessingJobResult> {
	const candidateProfileId = requireJobField(job.data.candidateProfileId, 'candidateProfileId')
	const cvFileUrl = requireJobField(job.data.cvFileUrl, 'cvFileUrl')

	console.info(
		`[cv-parser-worker] Processing job ${job.id || 'unknown'} for candidate profile ${candidateProfileId}`,
	)

	try {
		const downloadedCv = await downloadCvFromS3({
			cvFileUrl,
			s3Key: job.data.s3Key,
		})

		const rawCvText = await extractRawCvText(downloadedCv)

		const parseResult = await parseCandidateCvWithLlm(rawCvText, job.data.providerHint)

		await updateCandidateProfileFromCvParse({
			candidateProfileId,
			applicantId: job.data.applicantId,
			applicationId: job.data.applicationId,
			cvFileUrl,
			cvFileName: job.data.cvFileName,
			rawCvText,
			parsed: parseResult.parsed,
			providerUsed: parseResult.providerUsed,
		})

		return {
			candidateProfileId,
			providerUsed: parseResult.providerUsed,
			extractedSkillsCount: parseResult.parsed.topTechnicalSkills.length,
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)

		if (
			error instanceof InvalidS3LocationError ||
			error instanceof UnsupportedDocumentTypeError
		) {
			throw new UnrecoverableError(errorMessage)
		}

		console.warn(
			`[cv-parser-worker] Retryable error for job ${job.id || 'unknown'}: ${errorMessage}`,
		)

		throw error
	}
}

const workerConnection = createRedisConnection()
const eventsConnection = createRedisConnection()

const concurrencyRaw = Number(process.env.CV_PARSER_CONCURRENCY || '2')
const concurrency = Number.isFinite(concurrencyRaw) && concurrencyRaw > 0 ? concurrencyRaw : 2

export const cvParserWorker = new Worker<CvProcessingJobData, CvProcessingJobResult>(
	CV_PROCESSING_QUEUE_NAME,
	processCvJob,
	{
		connection: workerConnection,
		concurrency,
		maxStalledCount: 3,
	},
)

export const cvProcessingQueueEvents = new QueueEvents(CV_PROCESSING_QUEUE_NAME, {
	connection: eventsConnection,
})

cvParserWorker.on('completed', (job: Job<CvProcessingJobData>, result: CvProcessingJobResult) => {
	console.info(
		`[cv-parser-worker] Job ${job.id || 'unknown'} completed. profile=${result.candidateProfileId}, provider=${result.providerUsed}`,
	)
})

cvParserWorker.on('failed', (job: Job<CvProcessingJobData> | undefined, error: Error) => {
	const attemptsMade = job?.attemptsMade || 0
	const maxAttempts = job?.opts?.attempts || 1
	const isFinalFailure = attemptsMade >= maxAttempts

	console.error(
		`[cv-parser-worker] Job ${job?.id || 'unknown'} failed on attempt ${attemptsMade}/${maxAttempts}: ${error.message}`,
	)

	if (isFinalFailure) {
		console.error(
			`[cv-parser-worker] Job ${job?.id || 'unknown'} exhausted all retry attempts and is now permanently failed.`,
		)
	}
})

cvParserWorker.on('error', (error: Error) => {
	console.error('[cv-parser-worker] Worker runtime error', error)
})

export async function shutdownCvParserWorker(): Promise<void> {
	await Promise.allSettled([
		cvParserWorker.close(),
		cvProcessingQueueEvents.close(),
		workerConnection.quit(),
		eventsConnection.quit(),
	])
}

