'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import type { JobPosting } from '@/types/job'

type PublicJob = Pick<JobPosting, 'id' | 'title' | 'employment_type' | 'work_mode' | 'location' | 'application_deadline' | 'description' | 'responsibilities' | 'requirements' | 'benefits'> & {
  organization_name?: string | null
}

function JobCard({ job }: { job: PublicJob }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="rounded-lg border bg-theme-card border-theme-border shadow-theme-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.18)] mb-4 overflow-hidden">
      <div 
        className="p-5 cursor-pointer flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between transition-colors hover:bg-[rgba(255,255,255,0.03)]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="text-[0.9375rem] font-semibold text-text-primary">{job.title}</h3>
          <p className="text-sm text-text-secondary mt-1">
            {job.organization_name || 'RecruitAI'}
            {job.location ? ` · ${job.location}` : ''}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs px-2.5 py-1 rounded border border-theme-border text-text-secondary bg-theme-input">
              {job.employment_type || 'Flexible'}
            </span>
            <span className="text-xs px-2.5 py-1 rounded border border-theme-border text-text-secondary bg-theme-input">
              {job.work_mode || 'Onsite'}
            </span>
          </div>
        </div>
        <div className="text-sm text-text-secondary">
          {job.application_deadline
            ? `Deadline: ${new Date(job.application_deadline).toLocaleDateString()}`
            : 'No deadline'}
        </div>
      </div>

      {isOpen && (
        <div className="px-5 py-5 border-t border-theme-border bg-theme-card">
          <div className="space-y-4 text-sm text-text-secondary">
            {job.description && (
              <div>
                <h4 className="font-semibold text-text-primary mb-1">Description</h4>
                <p className="whitespace-pre-wrap">{job.description}</p>
              </div>
            )}
            {job.responsibilities && (
              <div>
                <h4 className="font-semibold text-text-primary mb-1">Responsibilities</h4>
                <p className="whitespace-pre-wrap">{job.responsibilities}</p>
              </div>
            )}
            {job.requirements && (
              <div>
                <h4 className="font-semibold text-text-primary mb-1">Requirements</h4>
                <p className="whitespace-pre-wrap">{job.requirements}</p>
              </div>
            )}
            {job.benefits && (
              <div>
                <h4 className="font-semibold text-text-primary mb-1">Benefits</h4>
                <p className="whitespace-pre-wrap">{job.benefits}</p>
              </div>
            )}
            {!(job.description || job.responsibilities || job.requirements || job.benefits) && (
              <p>No additional details provided.</p>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/candidate/apply?jobId=${job.id}`)
              }}
              className="px-5 py-2.5 text-sm text-white rounded transition-colors cursor-pointer bg-accent-purple hover:bg-accent-purple-hover font-medium"
            >
              Apply Now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface JobsResponse {
  jobs: PublicJob[]
}

export default function CandidateJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<PublicJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchJobs = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/v1/public/jobs', { cache: 'no-store' })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to fetch jobs')
        }

        const data: JobsResponse = await response.json()
        if (isMounted) {
          setJobs(data.jobs)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch jobs'
        if (isMounted) {
          setError(message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchJobs()

    return () => {
      isMounted = false
    }
  }, [])

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="rounded-lg border border-theme-border bg-theme-card px-4 py-6 text-sm text-text-secondary">
          Loading jobs...
        </div>
      )
    }

    if (error) {
      return (
        <div className="rounded-lg border border-theme-border bg-theme-card px-4 py-6 text-sm text-text-secondary">
          {error}
        </div>
      )
    }

    if (jobs.length === 0) {
      return (
        <div className="rounded-lg border border-theme-border bg-theme-card px-4 py-6 text-sm text-text-secondary">
          No open roles yet. Check back soon.
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    )
  }, [error, jobs, loading])

  return (
    <div className="min-h-screen bg-theme-bg transition-colors">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[1.5rem] font-semibold text-text-primary">Open Roles</h1>
            <p className="text-sm text-text-secondary mt-1">
              Browse the latest opportunities and apply when you are ready.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/candidate')}
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>

        {content}
      </main>
    </div>
  )
}
