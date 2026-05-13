'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, MapPin, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import type { JobPosting } from '@/types/job'

type PublicJob = Pick<JobPosting, 'id' | 'title' | 'employment_type' | 'work_mode' | 'location' | 'application_deadline' | 'description' | 'responsibilities' | 'requirements' | 'benefits' | 'status'> & {
  organization_name?: string | null
  created_at?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
}

function splitPoints(text: string): string[] {
  return text
    .split(/\n/)
    .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter(Boolean)
}

function formatSalary(job: PublicJob): string | null {
  if (!job.salary_min && !job.salary_max) return null
  const currency = job.salary_currency || 'PKR'
  const fmt = (n: number) => n.toLocaleString()
  if (job.salary_min && job.salary_max) return `${currency} ${fmt(job.salary_min)} – ${fmt(job.salary_max)}`
  if (job.salary_min) return `From ${currency} ${fmt(job.salary_min)}`
  return `Up to ${currency} ${fmt(job.salary_max!)}`
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

function JobCard({ job }: { job: PublicJob }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const snippet = job.description
    ? job.description.length > 280
      ? job.description.slice(0, 280) + '...'
      : job.description
    : null

  const salary = formatSalary(job)

  const reqPoints = job.requirements ? splitPoints(job.requirements) : []

  return (
    <div className="rounded-lg border bg-theme-card border-theme-border shadow-theme-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.18)] mb-4 overflow-hidden">
      <div
        className="p-5 cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.03)]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-[0.9375rem] font-semibold text-text-primary">{job.title}</h3>
            <div className="flex flex-wrap items-center mt-1.5 text-sm text-text-secondary gap-y-1">
              {job.organization_name && (
                <span className="inline-flex items-center gap-1 mr-2">
                  <Building2 size={14} className="shrink-0" />
                  {job.organization_name}
                </span>
              )}
              {job.location && (
                <span className="inline-flex items-center gap-1 mr-2">
                  <MapPin size={14} className="shrink-0" />
                  {job.location}
                </span>
              )}
              {salary && (
                <span className="font-medium text-text-primary mr-2">{salary}</span>
              )}
              {job.created_at && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} className="shrink-0" />
                  {timeAgo(job.created_at)}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded border border-theme-border text-text-secondary bg-theme-input">
                {job.employment_type || 'Flexible'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded border border-theme-border text-text-secondary bg-theme-input">
                {job.work_mode || 'Onsite'}
              </span>
              {job.application_deadline && (
                <span className="text-xs px-2.5 py-1 rounded border border-theme-border text-text-secondary bg-theme-input">
                  Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                </span>
              )}
            </div>
            {!isOpen && (
              <div className="mt-3">
                {snippet && (
                  <p className="text-sm text-text-secondary/70 leading-relaxed">{snippet}</p>
                )}
                {reqPoints.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {reqPoints.slice(0, 3).map((point, i) => (
                      <span key={i} className="text-xs text-text-secondary">
                        {point.length > 45 ? point.slice(0, 45) + '...' : point}{i < Math.min(reqPoints.length, 3) - 1 ? ' ·' : ''}
                      </span>
                    ))}
                    {reqPoints.length > 3 && (
                      <span className="text-xs text-text-secondary/50">+{reqPoints.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 sm:mt-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/candidate/apply?jobId=${job.id}`)
              }}
              className="px-4 py-2 text-sm text-white rounded transition-colors cursor-pointer bg-accent-purple hover:bg-accent-purple-hover font-medium"
            >
              Apply
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(!isOpen)
              }}
              className="px-3 py-2 text-sm rounded transition-colors cursor-pointer border border-theme-border text-text-secondary hover:text-text-primary hover:border-accent-purple inline-flex items-center gap-1"
            >
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {isOpen ? 'Hide' : 'Details'}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="px-5 py-5 border-t border-theme-border bg-theme-card">
          <div className="space-y-5">
            {job.description && (
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">Description</h4>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{job.description}</p>
              </div>
            )}
            {salary && (
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">Compensation</h4>
                <p className="text-sm text-text-secondary font-medium">{salary}</p>
              </div>
            )}
            {job.responsibilities && (
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">Responsibilities</h4>
                <ul className="space-y-1.5">
                  {splitPoints(job.responsibilities).map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-accent-purple shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {job.requirements && (
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">Requirements</h4>
                <ul className="space-y-1.5">
                  {splitPoints(job.requirements).map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-accent-purple shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {job.benefits && (
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-2 uppercase tracking-wide">Benefits</h4>
                <ul className="space-y-1.5">
                  {splitPoints(job.benefits).map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-accent-purple shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!(job.description || job.responsibilities || job.requirements || job.benefits) && (
              <p className="text-sm text-text-secondary">No additional details provided.</p>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-theme-border/50 flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/candidate/apply?jobId=${job.id}`)
              }}
              className="px-6 py-2.5 text-sm text-white rounded-lg transition-colors cursor-pointer bg-accent-purple hover:bg-accent-purple-hover font-semibold shadow-md"
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
          setJobs(data.jobs.filter((job) => job.status === 'published')) // Ensure only published jobs are shown
          console.log('Fetched jobs:', data.jobs) // Debug log to verify data structure
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
