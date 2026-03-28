/**
 * User Page
 * Landing page for authenticated users - redirects recruiters to their dashboard
 * or shows candidate dashboard for applicants
 */

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { LogOut, User, Briefcase, FileText, Settings, Bell, LucideIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ThemeToggle, ThemeToggleMobile } from '@/components/ui/theme-toggle'
import { MockInterviewCard } from '@/components/mock-interview'

export default function UserPage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (!loading && user && user.role === 'recruiter') {
      // Redirect recruiters to their dedicated dashboard
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
      await router.replace('/login')
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

  // Don't render if not logged in or if recruiter (will redirect)
  if (!user || user.role === 'recruiter') return null

  const displayRole = 'Candidate'

  return (
    <div className="min-h-screen bg-theme-bg transition-colors">
      {/* Header */}
      <header className="border-b bg-theme-input border-theme-border transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-accent-purple">
              <span className="text-white text-sm font-semibold">R</span>
            </div>
            <span className="text-lg font-semibold text-text-primary">RecruitAI</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme toggle - mobile version (visible on small screens) */}
            <ThemeToggleMobile className="sm:hidden" />
            {/* Theme toggle - desktop version (hidden on small screens) */}
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2 text-text-primary">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-sm text-text-secondary">
            You are logged in as a <span className="text-accent-purple">{displayRole}</span>
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-lg border p-6 mb-6 bg-theme-card border-theme-border shadow-theme-card transition-colors">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold bg-accent-purple flex-shrink-0">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold mb-1 text-text-primary">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm mb-3 text-text-secondary">{user.email}</p>
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded bg-accent-purple/10 text-accent-purple">
                <User size={12} />
                {displayRole}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <h3 className="text-sm font-semibold mb-4 text-text-primary">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <QuickActionCard icon={FileText} title="My Applications" description="View your job applications" />
          <QuickActionCard icon={Briefcase} title="Browse Jobs" description="Find new opportunities" />
          <QuickActionCard icon={User} title="My Profile" description="Update your profile and CV" />
        </div>

        {/* Mock Interview Section */}
        <h3 className="text-sm font-semibold mb-4 text-text-primary">Practice & Prepare</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <MockInterviewCard onBegin={() => router.push('/candidate/mock-interview')} />
        </div>

        {/* Settings & Sign Out */}
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm rounded border cursor-pointer border-theme-border text-text-secondary hover:bg-theme-card transition-colors">
            <Settings size={14} />
            Settings
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded border cursor-pointer border-accent-red/20 text-accent-red hover:bg-accent-red/10 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </main>
    </div>
  )
}

interface QuickActionCardProps {
  icon: LucideIcon
  title: string
  description: string
}

function QuickActionCard({ icon: Icon, title, description }: QuickActionCardProps) {
  return (
    <div className="rounded-lg border p-5 cursor-pointer bg-theme-card border-theme-border shadow-theme-card
      transition-all duration-200 ease-out
      hover:shadow-lg hover:-translate-y-[2px]
      hover:bg-accent-purple/5 dark:hover:bg-accent-purple/10"
    >
      <div className="w-10 h-10 rounded flex items-center justify-center mb-3 bg-accent-purple/10">
        <Icon size={18} className="text-accent-purple" />
      </div>
      <h4 className="text-sm font-semibold mb-1 text-text-primary">{title}</h4>
      <p className="text-xs text-text-secondary">{description}</p>
    </div>
  )
}
