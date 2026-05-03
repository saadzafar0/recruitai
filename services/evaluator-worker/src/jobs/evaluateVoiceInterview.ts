import { Job, QueueEvents, UnrecoverableError, Worker } from 'bullmq'
import IORedis from 'ioredis'
import { createRedisConnection } from '../services/redisConnection'
import { supabaseAdmin } from '../services/supabase'
import { evaluateWithLlm } from '../services/llmEvaluator'
import {
	persistVoiceEvaluation,
	type VoiceEvaluationOutput,
} from '../services/voiceScoreUpdater'

export const VOICE_EVALUATION_QUEUE_NAME =
	process.env.EVALUATOR_VOICE_QUEUE_NAME || 'voice-interview-evaluation'

export interface VoiceEvaluationJobData {
	applicationId: string
	sessionId?: string
}

function requireString(value: unknown, name: string): string {
	if (typeof value !== 'string' || !value.trim()) {
		throw new UnrecoverableError(`Missing required field "${name}" on voice-evaluation job`)
	}
	return value.trim()
}

interface InterviewSessionRow {
	id: string
	application_id: string
	full_transcript: string | null
	vapi_call_id: string | null
	status: string | null
}

async function loadSession(applicationId: string, sessionId?: string): Promise<InterviewSessionRow> {
	const baseQuery = supabaseAdmin
		.from('interview_sessions')
		.select('id, application_id, full_transcript, vapi_call_id, status')
		.eq('application_id', applicationId)

	const { data, error } = sessionId
		? await baseQuery.eq('id', sessionId).maybeSingle()
		: await baseQuery.maybeSingle()

	if (error) {
		throw new Error(`Failed to load interview_sessions: ${error.message}`)
	}
	if (!data) {
		throw new UnrecoverableError(
			`No interview_sessions row found for applicationId=${applicationId}${sessionId ? ` sessionId=${sessionId}` : ''}`,
		)
	}
	return data as InterviewSessionRow
}

async function loadJobContext(applicationId: string): Promise<string[]> {
	const { data: appRow } = await supabaseAdmin
		.from('applications')
		.select('id, job_id')
		.eq('id', applicationId)
		.maybeSingle()

	const jobId = (appRow as { job_id?: string } | null)?.job_id
	if (!jobId) return []

	const { data: jobRow } = await supabaseAdmin
		.from('job_postings')
		.select('title, description, requirements')
		.eq('id', jobId)
		.maybeSingle()

	if (!jobRow) return []
	const j = jobRow as { title?: string; description?: string; requirements?: string }

	const lines: string[] = []
	if (j.title) lines.push(`Job title: ${j.title}`)
	if (j.requirements) lines.push(`Job requirements:\n${j.requirements}`)
	else if (j.description) lines.push(`Job description:\n${j.description}`)
	return lines
}

async function processVoiceJob(
	job: Job<VoiceEvaluationJobData>,
): Promise<VoiceEvaluationOutput> {
	const applicationId = requireString(job.data.applicationId, 'applicationId')
	const sessionIdHint = typeof job.data.sessionId === 'string' ? job.data.sessionId : undefined

	console.info(
		`[evaluator-worker] Processing voice evaluation job ${job.id || 'unknown'} for application ${applicationId}`,
	)

	const session = await loadSession(applicationId, sessionIdHint)

	const transcript = session.full_transcript?.trim() || ''
	if (!transcript) {
		throw new UnrecoverableError(
			`interview_sessions.full_transcript is empty for session ${session.id} — cannot score`,
		)
	}

	const contextLines = await loadJobContext(applicationId)

	const evaluation = await evaluateWithLlm({
		kind: 'voice_interview',
		primaryText: transcript,
		contextLines,
	})

	return persistVoiceEvaluation({
		applicationId,
		sessionId: session.id,
		vapiCallId: session.vapi_call_id,
		transcript,
		evaluation,
	})
}

interface VoiceWorkerHandles {
	worker: Worker<VoiceEvaluationJobData, VoiceEvaluationOutput>
	queueEvents: QueueEvents
	close: () => Promise<void>
}

function getConcurrency(): number {
	const raw = Number(process.env.EVALUATOR_CONCURRENCY || '2')
	return Number.isFinite(raw) && raw > 0 ? raw : 2
}

export function startVoiceEvaluationWorker(): VoiceWorkerHandles {
	const workerConnection: IORedis = createRedisConnection()
	const eventsConnection: IORedis = createRedisConnection()

	const worker = new Worker<VoiceEvaluationJobData, VoiceEvaluationOutput>(
		VOICE_EVALUATION_QUEUE_NAME,
		processVoiceJob,
		{
			connection: workerConnection,
			concurrency: getConcurrency(),
			maxStalledCount: 3,
		},
	)

	const queueEvents = new QueueEvents(VOICE_EVALUATION_QUEUE_NAME, {
		connection: eventsConnection,
	})

	worker.on('completed', (job, result) => {
		console.info(
			`[evaluator-worker] Voice job ${job.id || 'unknown'} completed. application=${result.applicationId} total=${result.totalScore}`,
		)
	})

	worker.on('failed', (job, error) => {
		const attemptsMade = job?.attemptsMade || 0
		const maxAttempts = job?.opts?.attempts || 1
		console.error(
			`[evaluator-worker] Voice job ${job?.id || 'unknown'} failed on attempt ${attemptsMade}/${maxAttempts}: ${error.message}`,
		)
	})

	worker.on('error', (error) => {
		console.error('[evaluator-worker] Voice worker runtime error', error)
	})

	return {
		worker,
		queueEvents,
		close: async () => {
			await Promise.allSettled([
				worker.close(),
				queueEvents.close(),
				workerConnection.quit(),
				eventsConnection.quit(),
			])
		},
	}
}
