import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { SystemDesignProblem } from '@/types/systemDesignProblem'

interface SystemDesignProblemsResponse {
  success: boolean
  data?: {
    systemDesignProblems: SystemDesignProblem[]
  }
  error?: string
}

export interface UseSystemDesignProblemsReturn {
  systemDesignProblems: SystemDesignProblem[]
  activeProblem: SystemDesignProblem | null
  loading: boolean
  error: string | null
  refreshProblems: () => Promise<void>
}

export function useSystemDesignProblems(applicationId: string): UseSystemDesignProblemsReturn {
  const { session } = useAuth()
  const [systemDesignProblems, setSystemDesignProblems] = useState<SystemDesignProblem[]>([])
  const [activeProblem, setActiveProblem] = useState<SystemDesignProblem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pickRandomProblem = useCallback((problems: SystemDesignProblem[]) => {
    if (problems.length === 0) return null
    const index = Math.floor(Math.random() * problems.length)
    return problems[index] ?? null
  }, [])

  const getAuthHeaders = useCallback(() => {
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    }
  }, [session?.access_token])

  const fetchProblems = useCallback(async () => {
    if (!session?.access_token || !applicationId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/candidate/system-design-problems?applicationId=${applicationId}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch system design problems')
      }

      const data: SystemDesignProblemsResponse = await response.json()
      const problems = data.data?.systemDesignProblems || []
      setSystemDesignProblems(problems)
      setActiveProblem(pickRandomProblem(problems))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch system design problems'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [applicationId, getAuthHeaders, pickRandomProblem, session?.access_token])

  useEffect(() => {
    if (session?.access_token && applicationId) {
      fetchProblems()
    }
  }, [applicationId, fetchProblems, session?.access_token])

  return {
    systemDesignProblems,
    activeProblem,
    loading,
    error,
    refreshProblems: fetchProblems,
  }
}
