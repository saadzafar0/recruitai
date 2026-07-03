'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Mic, 
  Code2, 
  Layout, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  Camera,
  type LucideIcon 
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ThemeToggle, ThemeToggleMobile } from '@/components/ui/theme-toggle'

type UserTaskStatus = 'not_started' | 'in_progress' | 'completed'

export default function AssessmentLobbyPage() {
  const router = useRouter()
  const params = useParams<{ applicationId: string }>()
  const applicationId = params?.applicationId || ''
  const { user, loading: authLoading, session } = useAuth()
  const { showError, showSuccess } = useToast()
  
  const [micAvailable, setMicAvailable] = useState(true)
  const [jobTitle, setJobTitle] = useState<string>('Loading...')
  const [orgName, setOrgName] = useState<string>('')
  const [designStatus, setDesignStatus] = useState<UserTaskStatus>('not_started')
  const [voiceStatus, setVoiceStatus] = useState<UserTaskStatus>('not_started')
  const [codingStatus, setCodingStatus] = useState<UserTaskStatus>('not_started')
  const [concluding, setConcluding] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (applicationId && session?.access_token) {
      // Fetch application details to show job title
      fetch(`/api/v1/candidate/applications`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        const app = data.applications?.find((a: any) => a.id === applicationId)
        if (app) {
          setJobTitle(app.job.title)
          setOrgName(app.job.organization.name)
        }
      })
      .catch(err => {
        console.error('Failed to fetch job details', err)
      })
    }
  }, [applicationId, session?.access_token])

  useEffect(() => {
    if (!applicationId || !session?.access_token) return

    fetch(`/api/v1/candidate/system-design-status?applicationId=${applicationId}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.status) {
          setDesignStatus(data.data.status)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch system design status', err)
      })
  }, [applicationId, session?.access_token])

  useEffect(() => {
    if (!applicationId || !session?.access_token) return

    fetch(`/api/v1/candidate/voice-status?applicationId=${applicationId}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.status) {
          setVoiceStatus(data.data.status)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch voice status', err)
      })

    fetch(`/api/v1/candidate/coding-status?applicationId=${applicationId}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.status) {
          setCodingStatus(data.data.status)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch coding status', err)
      })
  }, [applicationId, session?.access_token])

  if (authLoading) return null

  const handleConcludeAssessments = async () => {
    if (!applicationId) {
      showError('Missing application id. Please refresh and try again.')
      return
    }

    if (!session?.access_token) {
      showError('You need to be signed in to conclude assessments.')
      return
    }

    try {
      setConcluding(true)
      const response = await fetch('/api/v1/candidate/coding-finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ application_id: applicationId }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to conclude assessments')
      }1

      showSuccess('Assessments concluded successfully.')
      router.push('/candidate')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to conclude assessments'
      showError(message)
    } finally {
      setConcluding(false)
    }
  }

  return (
    <div className="min-h-screen bg-theme-bg transition-colors">
      <header className="border-b bg-theme-input border-theme-border transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push('/candidate')}
              className="p-1.5 rounded hover:bg-theme-elevated transition-colors text-text-secondary mr-2"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-8 h-8 rounded flex items-center justify-center bg-accent-purple">
              <span className="text-white text-sm font-semibold">R</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-text-primary leading-tight">RecruitAI</p>
              <p className="text-[0.7rem] text-text-secondary leading-tight">Assessment Lobby</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle className="hidden sm:flex" />
            <div className="h-8 w-px bg-theme-border hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-text-primary">{user?.firstName} {user?.lastName}</p>
                <p className="text-[0.65rem] text-text-secondary">Candidate</p>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold bg-accent-purple">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded bg-accent-purple/10 text-accent-purple border border-accent-purple/20 uppercase tracking-widest">
              Active Assessment
            </span>
            <span className="text-[0.65rem] text-text-secondary font-mono">APP_ID: {applicationId?.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mb-1">
            {jobTitle}
          </h1>
          <p className="text-sm text-text-secondary flex items-center gap-1.5">
            <Globe size={14} className="opacity-50" />
            {orgName || 'Loading organization...'}
          </p>
        </div>

        <section className="space-y-8">
          <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[0.9375rem] font-semibold text-text-primary">System Check</h2>
              <button
                onClick={() => setMicAvailable((current) => !current)}
                className="text-[0.7rem] text-accent-purple hover:underline cursor-pointer"
              >
                Re-scan hardware
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <HardwareStatus icon={Mic} label="Microphone" ok={micAvailable} />
              <HardwareStatus icon={Globe} label="Browser" ok={true} />
              <HardwareStatus icon={Camera} label="Camera" ok={true} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AssessmentCard
              title="Voice Interview"
              icon={Mic}
              description="A 10-minute conversational round to assess your soft skills and role fit."
              status={voiceStatus}
              disabled={!micAvailable}
              onClick={() => router.push(`/interview/voice?applicationId=${applicationId}`)}
            />
            <AssessmentCard
              title="Coding Test"
              icon={Code2}
              description="Solve technical problems to demonstrate your algorithmic thinking."
              status={codingStatus}
              onClick={() => router.push(`/candidate/${applicationId}/assessment/coding-round`)}
            />
            <AssessmentCard
              title="System Design"
              icon={Layout}
              description="Architect a scalable solution based on a given complex scenario."
              status={designStatus}
              onClick={() => router.push(`/candidate/${applicationId}/assessment/system-design`)}
            />
          </div>

          <div className="rounded-lg p-6 border border-theme-border bg-theme-input/50 text-center">
            <p className="text-xs text-text-secondary max-w-lg mx-auto">
              Your progress is saved automatically. You can complete these rounds in any order, 
              but we recommend starting with the Voice Interview.
            </p>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleConcludeAssessments}
              disabled={concluding}
              className="px-5 py-2.5 text-sm font-semibold rounded bg-accent-purple text-white hover:bg-accent-purple-hover transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {concluding ? 'Concluding...' : 'Conclude Assessments'}
            </button>
          </div>
        </section>
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
        <Icon size={16} className={ok ? 'text-accent-purple' : 'text-accent-red'} />
        <span className="text-[0.8rem] text-text-primary">{label}</span>
      </div>
      {ok ? (
        <CheckCircle size={14} className="text-success" />
      ) : (
        <AlertCircle size={14} className="text-error" />
      )}
    </div>
  )
}

function AssessmentCard({
  title,
  icon: Icon,
  description,
  status,
  disabled,
  onClick,
}: {
  title: string
  icon: LucideIcon
  description: string
  status: UserTaskStatus
  disabled?: boolean
  onClick: () => void
}) {
  const config = {
    not_started: {
      badge: 'Not started',
      badgeClass: 'bg-theme-input text-text-secondary',
      buttonClass: 'bg-accent-purple text-white hover:bg-accent-purple-hover shadow-lg shadow-accent-purple/20',
      buttonLabel: 'Start Round',
    },
    in_progress: {
      badge: 'In progress',
      badgeClass: 'bg-warning-bg text-warning',
      buttonClass: 'bg-accent-purple text-white hover:bg-accent-purple-hover',
      buttonLabel: 'Continue',
    },
    completed: {
      badge: 'Completed',
      badgeClass: 'bg-success-bg text-success',
      buttonClass: 'bg-theme-input text-text-secondary border border-theme-border',
      buttonLabel: 'View Results',
    },
  }[status]

  return (
    <div className="rounded-lg border bg-theme-card border-theme-border shadow-theme-card transition-all hover:border-hover-border p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-theme-elevated">
          <Icon size={20} className="text-accent-purple" />
        </div>
        <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${config.badgeClass}`}>
          {config.badge}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed mb-6 flex-1">
        {description}
      </p>

      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`w-full py-2.5 text-xs font-bold rounded transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2 ${config.buttonClass}`}
      >
        {config.buttonLabel}
      </button>
    </div>
  )
}
