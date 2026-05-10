import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { CodingProblem } from '@/types/codingProblem'

interface CodingProblemsResponse {
	success: boolean
	data?: {
		codingProblems: CodingProblem[]
	}
	error?: string
}

export interface UseCodingProblemsReturn {
	codingProblems: CodingProblem[]
	activeProblem: CodingProblem | null
	loading: boolean
	error: string | null
	refreshCodingProblems: () => Promise<void>
}

export function useCodingProblems(): UseCodingProblemsReturn {
	const { session } = useAuth()
	const [codingProblems, setCodingProblems] = useState<CodingProblem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const activeProblem = useMemo(() => codingProblems[0] ?? null, [codingProblems])

	const getAuthHeaders = useCallback(() => {
		if (!session?.access_token) {
			throw new Error('Not authenticated')
		}

		return {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${session.access_token}`,
		}
	}, [session?.access_token])

	const fetchCodingProblems = useCallback(async () => {
		if (!session?.access_token) {
			console.log('[useCodingProblems] No session token, skipping fetch');
			setLoading(false)
			return
		}

		setLoading(true)
		setError(null)
		console.log('[useCodingProblems] Fetching coding problems from API...')

		try {
			const response = await fetch('/api/v1/coding-problems', {
				headers: getAuthHeaders(),
				cache: 'no-store',
			})

			if (!response.ok) {
				const data = await response.json()
				console.error('[useCodingProblems] API error:', data)
				throw new Error(data.error || 'Failed to fetch coding problems')
			}

			const data: CodingProblemsResponse = await response.json()
			const problems = data.data?.codingProblems || []
			console.log('[useCodingProblems] Fetched problems:', {
				count: problems.length,
				problems: problems.map(p => ({ id: p.id, title: p.title })),
			})
			setCodingProblems(problems);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to fetch coding problems'	
				console.error('[useCodingProblems] Error fetching problems:', message);
			setError(message)
		} finally {
			setLoading(false)
		}
	}, [getAuthHeaders, session?.access_token])

	useEffect(() => {
		if (session?.access_token) {
			fetchCodingProblems()
		}
	}, [fetchCodingProblems, session?.access_token])

	return {
		codingProblems,
		activeProblem,
		loading,
		error,
		refreshCodingProblems: fetchCodingProblems,
	}
}
