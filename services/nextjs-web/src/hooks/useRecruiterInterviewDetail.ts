import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { RecruiterInterviewDetail } from '@/types/recruiterInterviewDetail'

interface UseRecruiterInterviewDetailReturn {
  detail: RecruiterInterviewDetail | null
  loading: boolean
  error: string | null
  refreshDetail: () => Promise<void>
}

export function useRecruiterInterviewDetail(candidateId: string): UseRecruiterInterviewDetailReturn {
  const { session, user } = useAuth()
  const [detail, setDetail] = useState<RecruiterInterviewDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!session?.access_token || !candidateId) {
      setLoading(false)
      return
    }

    if (!user || (user.role !== 'recruiter' && user.role !== 'admin')) {
      setDetail(null)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/recruiter/interviews/${candidateId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch interview detail')
      }

      const data = await response.json()
      setDetail(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch interview detail'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [candidateId, session?.access_token, user])

  useEffect(() => {
    if (session?.access_token && candidateId) {
      fetchDetail()
    }
  }, [candidateId, fetchDetail, session?.access_token])

  return {
    detail,
    loading,
    error,
    refreshDetail: fetchDetail,
  }
}
