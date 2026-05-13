import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { RecruiterCodingRoundItem } from '@/types/recruiterCodingRound'

interface UseRecruiterCodingRoundsReturn {
  rounds: RecruiterCodingRoundItem[]
  loading: boolean
  error: string | null
  refreshRounds: () => Promise<void>
}

export function useRecruiterCodingRounds(): UseRecruiterCodingRoundsReturn {
  const { session, user } = useAuth()
  const [rounds, setRounds] = useState<RecruiterCodingRoundItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRounds = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    if (!user || (user.role !== 'recruiter' && user.role !== 'admin')) {
      setRounds([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/recruiter/coding-round', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch coding rounds')
      }

      const data = await response.json()
      setRounds(data.rounds || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch coding rounds'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, user])

  useEffect(() => {
    if (session?.access_token) {
      fetchRounds()
    }
  }, [fetchRounds, session?.access_token])

  return {
    rounds,
    loading,
    error,
    refreshRounds: fetchRounds,
  }
}
