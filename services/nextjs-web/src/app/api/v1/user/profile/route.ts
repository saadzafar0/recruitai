import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ALLOWED_FIELDS = new Set([
  'first_name', 'last_name', 'phone', 'linkedin_url', 'github_url', 'portfolio_url', 'avatar_url',
])

export async function PUT(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  for (const key of Object.keys(body)) {
    if (ALLOWED_FIELDS.has(key)) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  updates['updated_at'] = new Date().toISOString()

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, first_name, last_name, role, phone, avatar_url, organization_id, linkedin_url, github_url, portfolio_url')
    .eq('id', user.id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: 'Profile updated but failed to fetch' }, { status: 200 })
  }

  return NextResponse.json({ profile })
}
