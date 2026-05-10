import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export interface CandidateSummary {
  appliedJobs: number
  inProgress: number
  completed: number
}

export interface UseCandidateSummaryReturn {
  summary: CandidateSummary | null
  loading: boolean
  error: string | null
  refreshSummary: () => Promise<void>
}

export function useCandidateSummary(): UseCandidateSummaryReturn {
  const { session } = useAuth()
  const [summary, setSummary] = useState<CandidateSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const getAuthHeaders = useCallback(() => {
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    }
  }, [session])

  const fetchSummary = useCallback(async () => {
    if (!session?.access_token) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/candidate/summary', {
        headers: getAuthHeaders(),
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch summary')
      }

      const data: CandidateSummary = await response.json()
      setSummary(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch summary'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, session?.access_token])

  useEffect(() => {
    if (session?.access_token) {
      fetchSummary()
    }
  }, [fetchSummary, session?.access_token])

  return {
    summary,
    loading,
    error,
    refreshSummary: fetchSummary,
  }
}
