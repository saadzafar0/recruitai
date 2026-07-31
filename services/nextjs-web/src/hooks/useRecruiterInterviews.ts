import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { RecruiterInterviewItem } from '@/types/recruiterInterview'

interface UseRecruiterInterviewsReturn {
  interviews: RecruiterInterviewItem[]
  loading: boolean
  error: string | null
  refreshInterviews: () => Promise<void>
}

export function useRecruiterInterviews(): UseRecruiterInterviewsReturn {
  const { session, user } = useAuth()
  const [interviews, setInterviews] = useState<RecruiterInterviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInterviews = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    if (!user || (user.role !== 'recruiter' )) {
      setInterviews([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/recruiter/interviews', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch interviews')
      }

      const data = await response.json()
      setInterviews(data.interviews || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch interviews'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, user])

  useEffect(() => {
    if (session?.access_token) {
      fetchInterviews()
    }
  }, [fetchInterviews, session?.access_token])

  return {
    interviews,
    loading,
    error,
    refreshInterviews: fetchInterviews,
  }
}
