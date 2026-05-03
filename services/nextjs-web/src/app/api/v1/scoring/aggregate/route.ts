import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aggregateScores } from '@/lib/scoring'

const AggregateSchema = z.object({
	application_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
	let body: unknown
	try {
		body = await request.json()
	} catch {
		return NextResponse.json(
			{ success: false, error: 'Invalid JSON body' },
			{ status: 400 },
		)
	}

	const parsed = AggregateSchema.safeParse(body)
	if (!parsed.success) {
		return NextResponse.json(
			{ success: false, error: 'Validation error', details: parsed.error.errors },
			{ status: 400 },
		)
	}

	const result = await aggregateScores(parsed.data.application_id)

	if (!result.success) {
		const status = result.error?.includes('not found') ? 404
			: result.error?.includes('Cannot score') ? 400
			: 500
		return NextResponse.json(
			{ success: false, error: result.error },
			{ status },
		)
	}

	return NextResponse.json({
		success: true,
		data: {
			application_id: parsed.data.application_id,
			composite_score: result.composite_score,
			rank: result.rank,
			recommendation_tier: result.recommendation_tier,
			scores_complete: result.scores_complete,
		},
	})
}
