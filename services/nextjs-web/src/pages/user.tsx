/**
 * User Page
 * Landing page for authenticated users - redirects recruiters to their dashboard
 * or shows user dashboard for applicants
 */

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AlertCircle, Bell, Camera, CheckCircle, Code2, Globe, Layout, LogOut, LucideIcon, Mic, Settings } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ThemeToggle, ThemeToggleMobile } from '@/components/ui/theme-toggle'
import { useState } from 'react'

type UserTaskStatus = 'not_started' | 'in_progress' | 'completed'

export default function UserPage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const { showSuccess, showError } = useToast()
  const [micAvailable, setMicAvailable] = useState(true)

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

  const voiceStatus: UserTaskStatus = 'not_started'
  const codingStatus: UserTaskStatus = 'not_started'
  const designStatus: UserTaskStatus = 'not_started'

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-[1.5rem] font-semibold mb-1 text-text-primary">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-sm text-text-secondary">
            Applied for: <span className="font-medium text-text-primary">Senior Frontend Engineer</span>
          </p>
        </div>

        {/* System Check */}
        <div className="rounded-lg p-5 border mb-8 bg-theme-card border-theme-border shadow-theme-card transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[0.9375rem] font-semibold text-text-primary">System Check</h2>
            <button
              onClick={() => setMicAvailable((current) => !current)}
              className="text-xs underline cursor-pointer transition-colors text-text-secondary hover:text-accent-purple"
            >
              Toggle mic (demo)
            </button>
          </div>

          <div className="space-y-2">
            <HardwareStatus icon={Mic} label="Microphone" ok={micAvailable} />
            <HardwareStatus icon={Globe} label="Browser Compatibility" ok={true} />
            <HardwareStatus icon={Camera} label="Camera" ok={true} />
          </div>
        </div>

        {/* Assessment Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <UserTaskPanel
            icon={Mic}
            title="Voice Interview"
            duration="20 minutes"
            status={voiceStatus}
            disabled={!micAvailable}
            disabledReason="Microphone access required."
            onBegin={() => router.push('/interview/voice')}
          />
          <UserTaskPanel
            icon={Code2}
            title="Coding Test"
            duration="45 minutes"
            status={codingStatus}
            onBegin={() => router.push('/interview/coding')}
          />
          <UserTaskPanel
            icon={Layout}
            title="System Design"
            duration="30 minutes"
            status={designStatus}
            onBegin={() => router.push('/interview/design')}
          />
        </div>

        <div className="flex items-start gap-3 px-4 py-3.5 rounded-lg border text-sm mb-8 border-theme-border bg-theme-card text-text-secondary">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-accent-purple" />
          Your results will be reviewed by the recruiter within 48 hours. You will receive an email
          notification once a decision has been made.
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

interface HardwareStatusProps {
  icon: LucideIcon
  label: string
  ok: boolean
}

function HardwareStatus({ icon: Icon, label, ok }: HardwareStatusProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-background border-theme-border">
      <Icon size={15} className={ok ? 'text-accent-green' : 'text-accent-red'} />
      <span className="text-sm text-text-secondary">{label}</span>
      <span
        className={`ml-auto text-xs px-2 py-0.5 rounded ${
          ok ? 'text-accent-green bg-accent-green/10' : 'text-accent-red bg-accent-red/10'
        }`}
      >
        {ok ? 'Ready' : 'Not Available'}
      </span>
    </div>
  )
}

interface UserTaskPanelProps {
  icon: LucideIcon
  title: string
  duration: string
  status: UserTaskStatus
  disabled?: boolean
  disabledReason?: string
  onBegin: () => void
}

function UserTaskPanel({ icon: Icon, title, duration, status, disabled, disabledReason, onBegin }: UserTaskPanelProps) {
  const statusStyles: Record<UserTaskStatus, { label: string; badgeClass: string }> = {
    not_started: {
      label: 'Not Started',
      badgeClass: 'bg-theme-input text-text-secondary',
    },
    in_progress: {
      label: 'In Progress',
      badgeClass: 'bg-amber-500/15 text-amber-300',
    },
    completed: {
      label: 'Completed',
      badgeClass: 'bg-accent-green/15 text-accent-green',
    },
  }

  return (
    <div className="rounded-lg p-6 border flex flex-col bg-theme-card border-theme-border shadow-theme-card transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded flex items-center justify-center bg-secondary">
          <Icon size={18} className="text-accent-purple" />
        </div>
        {status === 'completed' ? (
          <CheckCircle size={18} className="text-accent-green" />
        ) : (
          <span className={`text-xs px-2 py-1 rounded ${statusStyles[status].badgeClass}`}>
            {statusStyles[status].label}
          </span>
        )}
      </div>

      <h4 className="text-sm font-semibold mb-1 text-text-primary">{title}</h4>
      <p className="text-xs mb-5 text-text-secondary">Est. {duration}</p>

      {status === 'completed' ? (
        <div className="mt-auto flex items-center gap-2 text-sm text-accent-green">
          <CheckCircle size={14} />
          Submitted
        </div>
      ) : (
        <div className="mt-auto">
          <button
            onClick={onBegin}
            disabled={disabled}
            className="w-full py-2.5 text-sm text-white rounded transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer bg-accent-purple hover:bg-accent-purple/90"
          >
            Begin
          </button>
          {disabled && disabledReason && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-accent-red">
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
              {disabledReason}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
