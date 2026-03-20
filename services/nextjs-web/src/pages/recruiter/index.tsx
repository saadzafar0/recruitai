/**
 * Recruiter Dashboard Page
 * Main dashboard for recruiters showing KPI cards and recent activity
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Briefcase, Users, Mic, Award, ArrowRight } from 'lucide-react'
import { RecruiterLayout } from '@/components/layout'
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

  // Generate recent activity from jobs (last 5 jobs modified)
  useEffect(() => {
    if (jobs.length > 0) {
      const activities: RecentActivity[] = jobs.slice(0, 5).map(job => ({
        id: job.id,
        type: job.status === 'published' ? 'job_published' : job.status === 'closed' ? 'job_closed' : 'job_created',
        jobTitle: job.title,
        date: formatDate(job.updated_at || job.created_at),
      }))
      setRecentActivity(activities)
    }
  }, [jobs])

  // Count active (published) jobs
  const activeJobs = jobs.filter(j => j.status === 'published').length

  // KPI Cards data
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
    <RecruiterLayout title="Dashboard">
      <div className="p-4 sm:p-6 max-w-6xl">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary">
            Recruitment Overview
          </h1>
          <p className="text-sm mt-0.5 text-text-secondary">
            Here&apos;s what&apos;s happening with your hiring pipeline.
          </p>
        </div>

        {/* KPI Cards */}
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
              <p className="text-xs text-accent-green">
                {change}
              </p>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border bg-theme-card border-theme-border shadow-theme-card">
          <div className="px-4 sm:px-6 py-4 border-b border-theme-border flex items-center justify-between">
            <h2 className="text-[0.9375rem] font-semibold text-text-primary">
              Recent Activity
            </h2>
            <Link
              href="/recruiter/jobs"
              className="text-xs flex items-center gap-1 text-accent-purple hover:text-accent-purple-hover transition-colors cursor-pointer"
            >
              View All Jobs
              <ArrowRight size={12} />
            </Link>
          </div>

          {jobsLoading && recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 mx-auto rounded-full border-2 border-accent-purple border-t-transparent animate-spin" />
              <p className="text-sm text-text-secondary mt-3">Loading...</p>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase size={32} className="mx-auto text-text-secondary/40 mb-3" />
              <p className="text-sm text-text-secondary mb-4">
                No recent activity yet.
              </p>
              <Link
                href="/recruiter/jobs"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white rounded bg-accent-purple hover:bg-accent-purple-hover transition-colors cursor-pointer"
              >
                Create Your First Job
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-theme-elevated">
                    {['Activity', 'Job Title', 'Date'].map(h => (
                      <th
                        key={h}
                        className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((activity, i) => (
                    <tr
                      key={activity.id + i}
                      className="border-t border-theme-border hover:bg-theme-elevated/50 transition-colors cursor-pointer"
                      onClick={() => router.push('/recruiter/jobs')}
                    >
                      <td className="px-4 sm:px-6 py-3.5">
                        <span className={`
                          text-xs px-2 py-1 rounded border border-theme-border
                          ${activity.type === 'job_published' ? 'text-accent-green' :
                            activity.type === 'job_closed' ? 'text-accent-red' :
                            'text-text-secondary'}
                        `}>
                          {getActivityLabel(activity.type)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-sm font-medium text-text-primary">
                        {activity.jobTitle}
                      </td>
                      <td className="px-4 sm:px-6 py-3.5 text-sm text-text-secondary/60">
                        {activity.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RecruiterLayout>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function getActivityLabel(type: RecentActivity['type']): string {
  switch (type) {
    case 'job_created': return 'Job Created'
    case 'job_published': return 'Job Published'
    case 'job_closed': return 'Job Closed'
    case 'job_updated': return 'Job Updated'
    default: return 'Activity'
  }
}
