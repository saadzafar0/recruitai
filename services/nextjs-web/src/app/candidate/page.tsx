'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Bell, Camera, CheckCircle, Code2, Globe, Layout, LogOut, LucideIcon, Mic, Settings } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ThemeToggle, ThemeToggleMobile } from '@/components/ui/theme-toggle'

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

  const voiceStatus: UserTaskStatus = 'not_started'
  const codingStatus: UserTaskStatus = 'not_started'
  const designStatus: UserTaskStatus = 'not_started'

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
            Applied for: <span className="font-medium text-text-primary">Senior Frontend Engineer</span>
          </p>
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <AssessmentCard
            title="Voice Interview"
            icon={Mic}
            status={voiceStatus}
            disabled={!micAvailable}
            disabledReason="Microphone not detected"
            onClick={() => router.push('/interview/voice')}
          />
          <AssessmentCard
            title="Coding Test"
            icon={Code2}
            status={codingStatus}
            onClick={() => router.push('/interview/coding')}
          />
          <AssessmentCard
            title="System Design"
            icon={Layout}
            status={designStatus}
            onClick={() => router.push('/interview/design')}
          />
        </div>

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

function HardwareStatus({
  icon: Icon,
  label,
  ok,
}: {
  icon: LucideIcon
  label: string
  ok: boolean
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-theme-border bg-theme-input transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded flex items-center justify-center bg-theme-elevated">
          <Icon size={18} className="text-accent-purple" />
        </div>
        <span className="text-sm text-text-primary">{label}</span>
      </div>

      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle size={16} className="text-accent-green" />
        ) : (
          <AlertCircle size={16} className="text-accent-red" />
        )}
        <span className={`text-xs ${ok ? 'text-accent-green' : 'text-accent-red'}`}>
          {ok ? 'OK' : 'Not available'}
        </span>
      </div>
    </div>
  )
}

function AssessmentCard({
  title,
  icon: Icon,
  status,
  disabled,
  disabledReason,
  onClick,
}: {
  title: string
  icon: LucideIcon
  status: UserTaskStatus
  disabled?: boolean
  disabledReason?: string
  onClick: () => void
}) {
  const config = {
    not_started: {
      badge: 'Not started',
      badgeClass: 'bg-theme-input text-text-secondary',
      buttonClass: 'bg-accent-purple text-white hover:bg-accent-purple-hover',
      buttonLabel: 'Begin',
    },
    in_progress: {
      badge: 'In progress',
      badgeClass: 'bg-accent-yellow/10 text-accent-yellow',
      buttonClass: 'bg-accent-purple text-white hover:bg-accent-purple-hover',
      buttonLabel: 'Continue',
    },
    completed: {
      badge: 'Completed',
      badgeClass: 'bg-accent-green/10 text-accent-green',
      buttonClass: 'bg-theme-input text-text-secondary border border-theme-border',
      buttonLabel: 'View',
    },
  }[status]

  return (
    <div className="rounded-lg border bg-theme-card border-theme-border shadow-theme-card transition-colors p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
          <span className={`inline-flex text-xs px-2 py-0.5 rounded ${config.badgeClass}`}>
            {disabled ? disabledReason || 'Disabled' : config.badge}
          </span>
        </div>
        <div className="w-10 h-10 rounded flex items-center justify-center bg-theme-elevated">
          <Icon size={18} className="text-accent-purple" />
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`w-full py-2.5 text-sm font-medium rounded transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${config.buttonClass}`}
      >
        {config.buttonLabel}
      </button>
    </div>
  )
}
