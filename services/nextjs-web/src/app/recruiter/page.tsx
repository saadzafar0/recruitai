'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Briefcase, Users, Mic, Award, ArrowRight } from 'lucide-react'
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

  const kpiCards = [
    {
      label: 'Active Job Postings',
      value: String(activeJobs),
      icon: Briefcase,
      change: `${totalJobs} total`,
      href: '/recruiter/jobs',
      active: true,
    },
    {
      label: 'Total Applicants',
      value: '—',
      icon: Users,
      change: 'Coming soon',
      href: '#',
      active: false,
    },
    {
      label: 'Interviews Completed',
      value: '—',
      icon: Mic,
      change: 'Coming soon',
      href: '#',
      active: false,
    },
    {
      label: 'Candidates Ranked',
      value: '—',
      icon: Award,
      change: 'Coming soon',
      href: '#',
      active: false,
    },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary">
          Recruitment Overview
        </h1>
        <p className="text-sm mt-0.5 text-text-secondary">
          Here&apos;s what&apos;s happening with your hiring pipeline.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {kpiCards.map(({ label, value, icon: Icon, change, href, active }) => (
          <Link
            key={label}
            href={active ? href : '#'}
            className={`
              rounded-lg p-4 sm:p-5 border border-t-[3px] border-t-accent-purple
              bg-theme-card border-theme-border shadow-theme-card
              transition-all duration-200 ease-out
              hover:shadow-lg hover:-translate-y-[2px]
              hover:bg-accent-purple/5 dark:hover:bg-accent-purple/10
              ${active ? 'cursor-pointer' : 'cursor-default opacity-75'}
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs mb-1 text-text-secondary">{label}</p>
                <p className="text-2xl sm:text-3xl font-semibold text-text-primary leading-none">
                  {jobsLoading && active && jobs.length === 0 ? '...' : value}
                </p>
              </div>
              <div className="w-9 h-9 rounded flex items-center justify-center bg-theme-elevated">
                <Icon size={16} className="text-accent-purple" />
              </div>
            </div>
            <p className="text-xs text-accent-green">{change}</p>
          </Link>
        ))}
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
