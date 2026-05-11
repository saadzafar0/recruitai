import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { createRedisConnection } from './redisConnection'
import { supabaseAdmin } from './supabase'
import {
	VOICE_EVALUATION_QUEUE_NAME,
	type VoiceEvaluationJobData,
} from '../jobs/evaluateVoiceInterview'
import {
	SYSTEM_DESIGN_QUEUE_NAME,
	type SystemDesignEvaluationJobData,
} from '../jobs/evaluateSystemDesign'

/**
 * Polls Supabase for unscored interview sessions and system-design responses
 * and enqueues evaluator jobs for them. Lets the worker stay useful before the
 * Vapi webhook (Saad/Sprint 2 final wiring) and the system-design submit
 * endpoint (Bilal/Sprint 3) are wired up to enqueue directly.
 *
 * Idempotency: every job ID encodes the session/response id, so BullMQ dedupes
 * within the queue. The score-writers also upsert on UNIQUE keys.
 */

interface UnscoredVoiceRow {
	id: string
	application_id: string
}

interface UnscoredDesignRow {
	id: string
	assessment_id: string
	system_design_assessments: { application_id: string } | { application_id: string }[] | null
}

function getIntervalMs(): number {
	const raw = Number(process.env.EVALUATOR_SWEEPER_INTERVAL_MS || '60000')
	return Number.isFinite(raw) ? raw : 60000
}

function getBatchSize(): number {
	const raw = Number(process.env.EVALUATOR_SWEEPER_BATCH_SIZE || '10')
	return Number.isFinite(raw) && raw > 0 ? raw : 10
}

async function findUnscoredVoiceSessions(limit: number): Promise<UnscoredVoiceRow[]> {
	// Sessions whose status reached 'completed' but have no row in voice_interview_scores yet.
	const { data: scored } = await supabaseAdmin
		.from('voice_interview_scores')
		.select('session_id')

	const scoredIds = new Set<string>(
		(scored || [])
			.map((r: { session_id?: string }) => r.session_id)
			.filter((id): id is string => Boolean(id)),
	)

	const { data, error } = await supabaseAdmin
		.from('interview_sessions')
		.select('id, application_id, full_transcript, status')
		.eq('status', 'completed')
		.not('full_transcript', 'is', null)
		.limit(limit * 4)

	if (error) {
		console.warn(`[evaluator-worker:sweeper] voice query failed: ${error.message}`)
		return []
	}

	type VoiceSessionRow = { id: string; application_id: string; full_transcript: string | null }

	return (data || [])
		.filter((row: VoiceSessionRow) => {
			return (
				!scoredIds.has(row.id) &&
				(row.full_transcript || '').trim().length > 0
			)
		})
		.slice(0, limit)
		.map((row: VoiceSessionRow) => ({ id: row.id, application_id: row.application_id }))
}

async function findUnscoredDesignResponses(limit: number): Promise<UnscoredDesignRow[]> {
	const { data, error } = await supabaseAdmin
		.from('system_design_responses')
		.select('id, assessment_id, written_response, transcript, system_design_assessments!inner(application_id)')
		.is('scored_at', null)
		.limit(limit * 2)

	if (error) {
		console.warn(`[evaluator-worker:sweeper] design query failed: ${error.message}`)
		return []
	}

	type DesignResponseRow = {
		id: string
		assessment_id: string
		written_response: string | null
		transcript: string | null
		system_design_assessments: UnscoredDesignRow['system_design_assessments']
	}

	return (data || [])
		.filter((row: DesignResponseRow) => {
			return (row.written_response || row.transcript || '').trim().length > 0
		})
		.slice(0, limit) as UnscoredDesignRow[]
}

function pickApplicationId(row: UnscoredDesignRow): string | null {
	const assoc = row.system_design_assessments
	if (!assoc) return null
	if (Array.isArray(assoc)) {
		return assoc[0]?.application_id || null
	}
	return assoc.application_id || null
}

interface SweeperHandles {
	close: () => Promise<void>
}

export function startEvaluatorSweeper(): SweeperHandles {
	const intervalMs = getIntervalMs()

	if (intervalMs <= 0) {
		console.info('[evaluator-worker:sweeper] disabled (EVALUATOR_SWEEPER_INTERVAL_MS=0)')
		return {
			close: async () => {
				/* noop */
			},
		}
	}

	const connection: IORedis = createRedisConnection()
	const voiceQueue = new Queue<VoiceEvaluationJobData>(VOICE_EVALUATION_QUEUE_NAME, { connection })
	const designQueue = new Queue<SystemDesignEvaluationJobData>(SYSTEM_DESIGN_QUEUE_NAME, { connection })

	let timer: NodeJS.Timeout | undefined
	let isRunning = false
	let isClosing = false

	async function runOnce(): Promise<void> {
		if (isRunning || isClosing) return
		isRunning = true
		try {
			const batchSize = getBatchSize()

			const voiceRows = await findUnscoredVoiceSessions(batchSize)
			for (const row of voiceRows) {
				const jobId = `voice:${row.id}`
				await voiceQueue.add(
					'voice-evaluation',
					{ applicationId: row.application_id, sessionId: row.id },
					{
						jobId,
						attempts: 3,
						backoff: { type: 'exponential', delay: 2000 },
						removeOnComplete: { count: 100 },
						removeOnFail: { count: 100 },
					},
				)
			}

			const designRows = await findUnscoredDesignResponses(batchSize)
			for (const row of designRows) {
				const applicationId = pickApplicationId(row)
				if (!applicationId) continue
				const jobId = `design:${row.id}`
				await designQueue.add(
					'system-design-evaluation',
					{
						applicationId,
						assessmentId: row.assessment_id,
						responseId: row.id,
					},
					{
						jobId,
						attempts: 3,
						backoff: { type: 'exponential', delay: 2000 },
						removeOnComplete: { count: 100 },
						removeOnFail: { count: 100 },
					},
				)
			}

			if (voiceRows.length || designRows.length) {
				console.info(
					`[evaluator-worker:sweeper] enqueued voice=${voiceRows.length} design=${designRows.length}`,
				)
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err)
			console.error(`[evaluator-worker:sweeper] run failed: ${message}`)
		} finally {
			isRunning = false
		}
	}

	timer = setInterval(() => {
		void runOnce()
	}, intervalMs)

	// Run once on startup so we don't wait a full interval to pick up the backlog.
	setTimeout(() => {
		void runOnce()
	}, 5000).unref()

	console.info(`[evaluator-worker:sweeper] enabled — interval=${intervalMs}ms batchSize=${getBatchSize()}`)

	return {
		close: async () => {
			isClosing = true
			if (timer) clearInterval(timer)
			await Promise.allSettled([
				voiceQueue.close(),
				designQueue.close(),
				connection.quit(),
			])
		},
	}
}
