import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { RecruiterCandidateDetail } from '@/types/recruiterCandidateDetail'

interface UseRecruiterCandidateReturn {
  candidate: RecruiterCandidateDetail | null
  loading: boolean
  error: string | null
  refreshCandidate: () => Promise<void>
}

export function useRecruiterCandidate(candidateId: string): UseRecruiterCandidateReturn {
  const { session, user } = useAuth()
  const [candidate, setCandidate] = useState<RecruiterCandidateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCandidate = useCallback(async () => {
    if (!session?.access_token || !candidateId) {
      setLoading(false)
      return
    }

    if (!user || (user.role !== 'recruiter' && user.role !== 'admin')) {
      setCandidate(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/recruiter/candidates/${candidateId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch candidate')
      }

      const data = await response.json()
      setCandidate(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch candidate'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [candidateId, session?.access_token, user])

  useEffect(() => {
    if (session?.access_token && candidateId) {
      fetchCandidate()
    }
  }, [candidateId, fetchCandidate, session?.access_token])

  return {
    candidate,
    loading,
    error,
    refreshCandidate: fetchCandidate,
  }
}
