import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
	throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) for executor-worker')
}

if (!supabaseServiceRoleKey) {
	throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for executor-worker')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
	realtime: {
		transport: ws,
	},
})
