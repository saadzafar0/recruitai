'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { useJobs } from '@/hooks/useJobs'
import type { JobPosting } from '@/types/job'

interface RecentActivity {
  id: string
  type: 'job_created' | 'job_published' | 'job_closed' | 'job_updated'
  jobTitle: string
  date: string
}

export default function RecruiterDashboard() {
  const router = useRouter()
  const { jobs, loading: jobsLoading, total: totalJobs } = useJobs({ limit: 5 })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    if (jobs.length > 0) {
      const activities: RecentActivity[] = jobs.slice(0, 5).map((job) => ({
        id: job.id,
        type:
          job.status === 'published'
            ? 'job_published'
            : job.status === 'closed'
              ? 'job_closed'
              : 'job_created',
        jobTitle: job.title,
        date: formatDate(job.updated_at || job.created_at),
      }))
      setRecentActivity(activities)
    }
  }, [jobs])

  const activeJobs = jobs.filter((j) => j.status === 'published').length
  const closedJobs = jobs.filter((j) => j.status === 'closed').length

  const renderJobCard = (job: JobPosting) => (
    <div
      key={job.id}
      className="p-4 mb-4 rounded-lg border bg-theme-card hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
      onClick={() => router.push(`/recruiter/jobs/${job.id}`)}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{job.title}</h3>
          <p className="text-sm text-text-secondary">
            Deadline: {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary">Recruiter Dashboard</h1>
          <p className="text-sm mt-0.5 text-text-secondary">Overview of your job postings and activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border bg-theme-card">
          <h3 className="text-lg font-semibold text-text-primary">Total Jobs</h3>
          <p className="text-2xl font-bold text-accent-purple">{totalJobs}</p>
        </div>
        <div className="p-4 rounded-lg border bg-theme-card">
          <h3 className="text-lg font-semibold text-text-primary">Active Jobs</h3>
          <p className="text-2xl font-bold text-accent-purple">{activeJobs}</p>
        </div>
        <div className="p-4 rounded-lg border bg-theme-card">
          <h3 className="text-lg font-semibold text-text-primary">Closed Jobs</h3>
          <p className="text-2xl font-bold text-accent-purple">{closedJobs}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-theme-card border-theme-border shadow-theme-card transition-colors">
        <div className="px-5 py-4 border-b border-theme-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[0.9375rem] font-semibold text-text-primary">
                Recent Activity
              </h2>
              <p className="text-sm mt-0.5 text-text-secondary">
                Last updates to your job postings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/recruiter/jobs')}
              className="inline-flex items-center gap-2 text-sm font-medium text-accent-purple hover:underline cursor-pointer"
            >
              View all jobs
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full">
            <thead className="bg-theme-input">
              <tr>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wide text-text-secondary">Event</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wide text-text-secondary">Job</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wide text-text-secondary">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-sm text-text-secondary" colSpan={3}>
                    {jobsLoading ? 'Loading activity...' : 'No recent activity yet.'}
                  </td>
                </tr>
              ) : (
                recentActivity.map((a) => (
                  <tr key={a.id} className="border-t border-theme-border">
                    <td className="px-5 py-4 text-sm text-text-primary">{formatActivity(a.type)}</td>
                    <td className="px-5 py-4 text-sm text-text-secondary">{a.jobTitle}</td>
                    <td className="px-5 py-4 text-sm text-text-secondary">{a.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function formatActivity(type: RecentActivity['type']) {
  switch (type) {
    case 'job_published':
      return 'Job published'
    case 'job_closed':
      return 'Job closed'
    case 'job_updated':
      return 'Job updated'
    case 'job_created':
    default:
      return 'Job created'
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

