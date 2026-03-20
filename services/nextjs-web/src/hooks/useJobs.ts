/**
 * useJobs Hook
 * Manages job posting state, CRUD operations, and real-time updates
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import type {
  JobPosting,
  JobPostingCreate,
  JobPostingUpdate,
  JobPostingsResponse,
  JobStatus,
  EmploymentType,
  WorkMode,
} from '@/types/job'

export interface UseJobsFilters {
  search?: string
  status?: JobStatus | JobStatus[]
  employment_type?: EmploymentType
  work_mode?: WorkMode
  created_after?: string
  created_before?: string
}

export interface UseJobsSort {
  field: 'title' | 'status' | 'created_at' | 'application_deadline' | 'updated_at'
  direction: 'asc' | 'desc'
}

export interface UseJobsOptions {
  page?: number
  limit?: number
  filters?: UseJobsFilters
  sort?: UseJobsSort
}

export interface UseJobsReturn {
  jobs: JobPosting[]
  total: number
  page: number
  limit: number
  totalPages: number
  loading: boolean
  error: string | null
  fetchJobs: (options?: UseJobsOptions) => Promise<void>
  createJob: (data: JobPostingCreate) => Promise<JobPosting | null>
  updateJob: (data: JobPostingUpdate) => Promise<JobPosting | null>
  deleteJob: (id: string) => Promise<boolean>
  updateJobStatus: (id: string, status: JobStatus) => Promise<JobPosting | null>
  getJob: (id: string) => Promise<JobPosting | null>
  refreshJobs: () => Promise<void>
}

interface JobsCacheEntry {
  jobs: JobPosting[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const jobsCache = new Map<string, JobsCacheEntry>()

function buildJobsCacheKey(options?: UseJobsOptions): string {
  return JSON.stringify({
    page: options?.page ?? 1,
    limit: options?.limit ?? 10,
    filters: {
      search: options?.filters?.search ?? '',
      status: options?.filters?.status ?? '',
      employment_type: options?.filters?.employment_type ?? '',
      work_mode: options?.filters?.work_mode ?? '',
      created_after: options?.filters?.created_after ?? '',
      created_before: options?.filters?.created_before ?? '',
    },
    sort: {
      field: options?.sort?.field ?? '',
      direction: options?.sort?.direction ?? '',
    },
  })
}

export function useJobs(initialOptions?: UseJobsOptions): UseJobsReturn {
  const { session } = useAuth()
  const initialCacheKey = buildJobsCacheKey(initialOptions)
  const initialCached = jobsCache.get(initialCacheKey)
  const [jobs, setJobs] = useState<JobPosting[]>(initialCached?.jobs || [])
  const [total, setTotal] = useState(initialCached?.total || 0)
  const [page, setPage] = useState(initialCached?.page || initialOptions?.page || 1)
  const [limit, setLimit] = useState(initialCached?.limit || initialOptions?.limit || 10)
  const [totalPages, setTotalPages] = useState(initialCached?.totalPages || 0)
  const [loading, setLoading] = useState(!initialCached)
  const [error, setError] = useState<string | null>(null)
  const [currentOptions, setCurrentOptions] = useState<UseJobsOptions>(initialOptions || {})

  const getAuthHeaders = useCallback(() => {
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    }
  }, [session])

  const fetchJobs = useCallback(async (options?: UseJobsOptions) => {
    const opts = { ...currentOptions, ...options }
    const cacheKey = buildJobsCacheKey(opts)
    const cachedEntry = jobsCache.get(cacheKey)

    setLoading(!cachedEntry)
    setError(null)
    setCurrentOptions(opts)

    try {
      const params = new URLSearchParams()
      if (opts.page) params.set('page', String(opts.page))
      if (opts.limit) params.set('limit', String(opts.limit))
      if (opts.filters?.search) params.set('search', opts.filters.search)
      if (opts.filters?.status) {
        const statuses = Array.isArray(opts.filters.status) ? opts.filters.status : [opts.filters.status]
        statuses.forEach(s => params.append('status', s))
      }
      if (opts.filters?.employment_type) params.set('employment_type', opts.filters.employment_type)
      if (opts.filters?.work_mode) params.set('work_mode', opts.filters.work_mode)
      if (opts.filters?.created_after) params.set('created_after', opts.filters.created_after)
      if (opts.filters?.created_before) params.set('created_before', opts.filters.created_before)
      if (opts.sort?.field) params.set('sort_field', opts.sort.field)
      if (opts.sort?.direction) params.set('sort_direction', opts.sort.direction)

      const response = await fetch(`/api/v1/jobs?${params.toString()}`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch jobs')
      }

      const data: JobPostingsResponse = await response.json()
      setJobs(data.jobs)
      setTotal(data.total)
      setPage(data.page)
      setLimit(data.limit)
      setTotalPages(data.totalPages)

      jobsCache.set(cacheKey, {
        jobs: data.jobs,
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch jobs'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [currentOptions, getAuthHeaders])

  const refreshJobs = useCallback(async () => {
    await fetchJobs(currentOptions)
  }, [fetchJobs, currentOptions])

  const createJob = useCallback(async (data: JobPostingCreate): Promise<JobPosting | null> => {
    try {
      const response = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create job')
      }

      const newJob: JobPosting = await response.json()

      // Add to local state immediately (optimistic update)
      setJobs(prev => [newJob, ...prev])
      setTotal(prev => prev + 1)

      return newJob
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create job'
      setError(message)
      return null
    }
  }, [getAuthHeaders])

  const updateJob = useCallback(async (data: JobPostingUpdate): Promise<JobPosting | null> => {
    try {
      const response = await fetch(`/api/v1/jobs/${data.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update job')
      }

      const updatedJob: JobPosting = await response.json()

      // Update local state immediately (optimistic update)
      setJobs(prev => prev.map(job => job.id === data.id ? updatedJob : job))

      return updatedJob
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update job'
      setError(message)
      return null
    }
  }, [getAuthHeaders])

  const updateJobStatus = useCallback(async (id: string, status: JobStatus): Promise<JobPosting | null> => {
    return updateJob({ id, status })
  }, [updateJob])

  const deleteJob = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/v1/jobs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete job')
      }

      // Remove from local state immediately (optimistic update)
      setJobs(prev => prev.filter(job => job.id !== id))
      setTotal(prev => prev - 1)

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete job'
      setError(message)
      return false
    }
  }, [getAuthHeaders])

  const getJob = useCallback(async (id: string): Promise<JobPosting | null> => {
    try {
      const response = await fetch(`/api/v1/jobs/${id}`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch job')
      }

      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch job'
      setError(message)
      return null
    }
  }, [getAuthHeaders])

  // Auto-fetch on mount if session is available
  useEffect(() => {
    if (session?.access_token) {
      fetchJobs(initialOptions)
    }
  }, [session?.access_token]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    jobs,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    updateJobStatus,
    getJob,
    refreshJobs,
  }
}
