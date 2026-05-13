import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { RecruiterCodingRoundDetail } from '@/types/recruiterCodingRoundDetail'

interface UseRecruiterCodingRoundDetailReturn {
  detail: RecruiterCodingRoundDetail | null
  loading: boolean
  error: string | null
  refreshDetail: () => Promise<void>
}

export function useRecruiterCodingRoundDetail(candidateId: string): UseRecruiterCodingRoundDetailReturn {
  const { session, user } = useAuth()
  const [detail, setDetail] = useState<RecruiterCodingRoundDetail | null>(null)
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
      const response = await fetch(`/api/v1/recruiter/coding-round/${candidateId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch coding assessment')
      }

      const data = await response.json()
      setDetail(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch coding assessment'
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
