'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Briefcase, Users, Award, TrendingUp } from 'lucide-react'

export default function MockDashboard() {
  const router = useRouter()

  const stats = [
    { label: 'Active Openings', value: '5', icon: Briefcase, color: 'text-accent-purple' },
    { label: 'Candidates Scored', value: '148', icon: Users, color: 'text-accent-purple' },
    { label: 'Top Talents (Score ≥ 80)', value: '18', icon: Award, color: 'text-accent-purple' },
    { label: 'Evaluation Speed', value: '2.4 hrs', icon: TrendingUp, color: 'text-accent-purple' },
  ]

  const activeJobs = [
    { id: '1', title: 'Senior Systems Engineer', applicants: 42, publishedAt: 'June 12, 2026' },
    { id: '2', title: 'Frontend Architect', applicants: 28, publishedAt: 'June 14, 2026' },
    { id: '3', title: 'DevOps Platform Engineer', applicants: 19, publishedAt: 'June 15, 2026' },
    { id: '4', title: 'Data Infrastructure Engineer', applicants: 31, publishedAt: 'June 10, 2026' },
  ]

  const recentActivity = [
    {
      id: 'adrian-sterling',
      candidateName: 'Adrian Sterling',
      action: 'completed Voice Interview simulation',
      score: 78,
      time: '12 minutes ago'
    },
    {
      id: 'elena-rostova',
      candidateName: 'Elena Rostova',
      action: 'completed Coding assessment suite',
      score: 95,
      time: '45 minutes ago'
    },
    {
      id: 'marcus-vance',
      candidateName: 'Marcus Vance',
      action: 'completed CV extraction and parsing',
      score: 85,
      time: '2 hours ago'
    },
    {
      id: 'devon-lane',
      candidateName: 'Devon Lane',
      action: 'completed Systems Architecture interview',
      score: 64,
      time: '4 hours ago'
    }
  ]

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary">
            Recruiter Dashboard
          </h1>
          <p className="text-sm mt-0.5 text-text-secondary">
            Overview of your job postings and activity.
          </p>
        </div>
        <button
          onClick={() => router.push('/recruiter/mock/candidates')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded bg-accent-purple hover:bg-accent-purple-hover text-white transition-all cursor-pointer shadow-theme-card"
        >
          View Leaderboard
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-lg border bg-theme-card border-theme-border shadow-theme-card transition-colors">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm text-text-secondary font-medium">{label}</span>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Job Postings */}
        <div className="lg:col-span-1 rounded-lg border bg-theme-card border-theme-border shadow-theme-card flex flex-col">
          <div className="px-5 py-4 border-b border-theme-border flex items-center justify-between">
            <h2 className="text-[0.9375rem] font-semibold text-text-primary">Active Openings</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-theme-input border border-theme-border text-text-secondary">
              5 Total
            </span>
          </div>
          <div className="p-4 flex-1 space-y-3">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded border border-theme-border bg-theme-bg hover:border-accent-purple transition-all cursor-pointer flex flex-col gap-1"
                onClick={() => router.push('/recruiter/mock/candidates')}
              >
                <h3 className="text-sm font-semibold text-text-primary">{job.title}</h3>
                <div className="flex justify-between items-center text-xs text-text-secondary">
                  <span>{job.applicants} Applicants</span>
                  <span>{job.publishedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-lg border bg-theme-card border-theme-border shadow-theme-card flex flex-col">
          <div className="px-5 py-4 border-b border-theme-border flex items-center justify-between">
            <div>
              <h2 className="text-[0.9375rem] font-semibold text-text-primary">Live Candidate Feed</h2>
              <p className="text-xs text-text-secondary mt-0.5">Real-time status updates from active assessment runs.</p>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-theme-input">
                <tr>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wide text-text-secondary">Candidate</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-wide text-text-secondary">Activity</th>
                  <th className="text-center px-5 py-3 text-xs uppercase tracking-wide text-text-secondary">Score</th>
                  <th className="text-right px-5 py-3 text-xs uppercase tracking-wide text-text-secondary">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity) => (
                  <tr
                    key={activity.id}
                    className="border-t border-theme-border hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => router.push(`/recruiter/mock/candidate/${activity.id}`)}
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-text-primary">{activity.candidateName}</td>
                    <td className="px-5 py-4 text-sm text-text-secondary">{activity.action}</td>
                    <td className="px-5 py-4 text-sm text-center">
                      <span className={`font-semibold ${activity.score >= 80 ? 'text-accent-teal' : activity.score >= 65 ? 'text-text-primary' : 'text-accent-red'}`}>
                        {activity.score}/100
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-right text-text-secondary">{activity.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
