import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export interface Application {
  id: string
  status: string
  created_at: string
  job: {
    id: string
    title: string
    organization: {
      name: string
    }
  }
}

export interface UseCandidateApplicationsReturn {
  applications: Application[]
  loading: boolean
  error: string | null
  refreshApplications: () => Promise<void>
}

export function useCandidateApplications(): UseCandidateApplicationsReturn {
  const { session } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchApplications = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/candidate/applications', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch applications')
      }

      const data = await response.json()
      setApplications(data.applications || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch applications'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (session?.access_token) {
      fetchApplications()
    }
  }, [fetchApplications, session?.access_token])

  return {
    applications,
    loading,
    error,
    refreshApplications: fetchApplications,
  }
}
