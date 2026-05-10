'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, Search, Settings } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ThemeToggle, ThemeToggleMobile } from '@/components/ui/theme-toggle'
import CandidateAssessmentSection from '@/components/candidate/CandidateAssessmentSection'
import { useCandidateSummary } from '@/hooks/useCandidateSummary'

export default function UserPage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const { showSuccess, showError } = useToast()
  const { summary, loading: summaryLoading } = useCandidateSummary()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && user.role === 'recruiter') {
      router.push('/recruiter')
    }
  }, [loading, user, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      showSuccess('Signed out successfully')
    } catch {
      showError('Could not complete server sign out, but your local session was cleared.')
    } finally {
      router.replace('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-bg transition-colors">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-accent-purple border-t-transparent animate-spin" />
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role === 'recruiter') return null

  const appliedJobs = summary?.appliedJobs ?? 0
  const inProgress = summary?.inProgress ?? 0
  const completed = summary?.completed ?? 0
  const hasAppliedJobs = appliedJobs > 0

  return (
    <div className="min-h-screen bg-theme-bg transition-colors">
      <header className="border-b bg-theme-input border-theme-border transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-accent-purple">
              <span className="text-white text-sm font-semibold">R</span>
            </div>
            <span className="text-lg font-semibold text-text-primary">RecruitAI</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggleMobile className="sm:hidden" />
            <ThemeToggle className="hidden sm:flex" />
            <button className="p-2 rounded cursor-pointer text-text-secondary hover:text-accent-purple transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-accent-purple cursor-pointer">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-[1.5rem] font-semibold mb-1 text-text-primary">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-sm text-text-secondary">
            Track your applications and assessments.
          </p>
        </div>

        <div className="rounded-lg p-5 border mb-8 bg-theme-card border-theme-border shadow-theme-card transition-colors">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[0.9375rem] font-semibold text-text-primary">Your Progress</h2>
              <p className="text-sm text-text-secondary mt-1">
                {summaryLoading ? 'Fetching your latest stats...' : 'Keep your momentum going.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/candidate/jobs')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium bg-accent-purple text-white hover:bg-accent-purple-hover transition-colors cursor-pointer"
            >
              <Search size={16} />
              Search jobs
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <StatCard label="Applied jobs" value={appliedJobs} />
            <StatCard label="In progress" value={inProgress} />
            <StatCard label="Completed" value={completed} />
          </div>
        </div>

        {hasAppliedJobs ? (
          <div className="mb-8">
            <CandidateAssessmentSection />
          </div>
        ) : (
          <div className="rounded-lg p-5 border mb-8 bg-theme-card border-theme-border shadow-theme-card transition-colors">
            <h2 className="text-[0.9375rem] font-semibold text-text-primary mb-1">No active applications yet</h2>
            <p className="text-sm text-text-secondary">
              Apply to a role to unlock the voice interview, coding round, and system design tasks.
            </p>
          </div>
        )}

        <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[0.9375rem] font-semibold text-text-primary mb-1">Account</h2>
              <p className="text-sm text-text-secondary">Manage your session and settings.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-2 rounded text-sm bg-theme-input border border-theme-border text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <Settings size={16} />
                Settings
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-3 py-2 rounded text-sm bg-accent-red/10 border border-accent-red/30 text-accent-red hover:bg-accent-red/15 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-theme-input border-theme-border px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="text-2xl font-semibold text-text-primary mt-1">{value}</p>
    </div>
  )
}
