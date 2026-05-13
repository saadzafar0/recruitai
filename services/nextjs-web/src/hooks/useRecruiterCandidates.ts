import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { RecruiterCandidate } from '@/types/recruiterCandidate'

interface UseRecruiterCandidatesReturn {
  candidates: RecruiterCandidate[]
  loading: boolean
  error: string | null
  refreshCandidates: () => Promise<void>
}

export function useRecruiterCandidates(): UseRecruiterCandidatesReturn {
  const { session, user } = useAuth()
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCandidates = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    if (!user || (user.role !== 'recruiter' && user.role !== 'admin')) {
      setCandidates([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/recruiter/candidates', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch candidates')
      }

      const data = await response.json()
      setCandidates(data.candidates || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch candidates'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, user])

  useEffect(() => {
    if (session?.access_token) {
      fetchCandidates()
    }
  }, [fetchCandidates, session?.access_token])

  return {
    candidates,
    loading,
    error,
    refreshCandidates: fetchCandidates,
  }
}
