'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import SettingsForm from '@/components/settings/SettingsForm'

export default function RecruiterSettingsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user || user.role !== 'recruiter') return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[1.5rem] font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your profile, security, and preferences.</p>
      </div>
      <SettingsForm
        backHref="/recruiter"
        onSignOut={() => router.replace('/login')}
      />
    </div>
  )
}
