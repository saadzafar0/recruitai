'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import SettingsForm from '@/components/settings/SettingsForm'

export default function CandidateSettingsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
    else if (!loading && user?.role === 'recruiter') router.push('/recruiter')
  }, [loading, user, router])

  if (loading || !user || user.role === 'recruiter') return null

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
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-[1.5rem] font-semibold text-text-primary">Settings</h1>
          <p className="text-sm text-text-secondary mt-1">Manage your profile, security, and preferences.</p>
        </div>
        <SettingsForm
          backHref="/candidate"
          onSignOut={() => router.replace('/login')}
        />
      </main>
    </div>
  )
}
