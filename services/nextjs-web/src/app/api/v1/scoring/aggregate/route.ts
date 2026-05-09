import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { aggregateScores } from '@/lib/scoring'

const AggregateSchema = z.object({
	application_id: z.string().uuid(),
})

export async function POST(request: NextRequest) {
	if (!supabaseAdmin) {
		return NextResponse.json(
			{ success: false, error: 'Server configuration error' },
			{ status: 500 },
		)
	}

	// Auth check
	const authHeader = request.headers.get('authorization')
	if (!authHeader?.startsWith('Bearer ')) {
		return NextResponse.json(
			{ success: false, error: 'Unauthorized' },
			{ status: 401 },
		)
	}

	const token = authHeader.split(' ')[1]

	const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
	if (authError || !user) {
		return NextResponse.json(
			{ success: false, error: 'Invalid token' },
			{ status: 401 },
		)
	}

	const { data: profile, error: profileError } = await supabaseAdmin
		.from('profiles')
		.select('id, role')
		.eq('id', user.id)
		.single()

	if (profileError || !profile) {
		return NextResponse.json(
			{ success: false, error: 'Profile not found' },
			{ status: 403 },
		)
	}

	if (profile.role !== 'recruiter' && profile.role !== 'admin') {
		return NextResponse.json(
			{ success: false, error: 'Only recruiters can trigger scoring' },
			{ status: 403 },
		)
	}

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
