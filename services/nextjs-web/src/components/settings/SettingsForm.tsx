'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { ThemeTogglePill } from '@/components/ui/theme-toggle'
import { Save, Eye, EyeOff, ArrowLeft, LogOut } from 'lucide-react'

interface SettingsFormProps {
  backHref: string
  onSignOut: () => void
}

export default function SettingsForm({ backHref, onSignOut }: SettingsFormProps) {
  const { user, session, signOut } = useAuth()
  const { showSuccess, showError } = useToast()

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [phone, setPhone] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [github, setGithub] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [saving, setSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  const handleSaveProfile = async () => {
    if (!session?.access_token) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          linkedin_url: linkedin || null,
          github_url: github || null,
          portfolio_url: portfolio || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showError(data.error || 'Failed to update profile')
        return
      }
      showSuccess('Profile updated successfully')
    } catch {
      showError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!session?.access_token) return
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters')
      return
    }
    setChangingPassword(true)
    try {
      const res = await fetch('/api/v1/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        showError(data.error || 'Failed to change password')
        return
      }
      showSuccess('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      showError('Something went wrong')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      showSuccess('Signed out successfully')
    } catch {
      showError('Could not complete sign out')
    } finally {
      onSignOut()
    }
  }

  const inputClass = 'w-full px-3.5 py-2.5 text-sm rounded-lg border outline-none bg-theme-input text-text-primary border-theme-border focus:border-accent-purple focus:ring-2 focus:ring-accent-purple/20 transition-all'

  return (
    <div className="space-y-6 max-w-2xl">
      <a href={backHref} className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft size={16} />
        Back
      </a>

      {/* Profile Section */}
      <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card">
        <h2 className="text-[0.9375rem] font-semibold text-text-primary mb-4">Profile</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">First Name</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Last Name</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
            <input type="email" value={user?.email ?? ''} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" className={inputClass} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">LinkedIn</label>
              <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">GitHub</label>
              <input type="url" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Portfolio</label>
            <input type="url" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://your-portfolio.com" className={inputClass} />
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleSaveProfile} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-accent-purple text-white hover:bg-accent-purple-hover transition-colors cursor-pointer disabled:opacity-50">
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card">
        <h2 className="text-[0.9375rem] font-semibold text-text-primary mb-4">Security</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Current Password</label>
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">New Password</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleChangePassword} disabled={changingPassword} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-accent-purple text-white hover:bg-accent-purple-hover transition-colors cursor-pointer disabled:opacity-50">
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card">
        <h2 className="text-[0.9375rem] font-semibold text-text-primary mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-primary">Theme</p>
            <p className="text-xs text-text-secondary mt-0.5">Toggle between light and dark mode</p>
          </div>
          <ThemeTogglePill />
        </div>
      </div>

      {/* Account Section */}
      <div className="rounded-lg p-5 border bg-theme-card border-theme-border shadow-theme-card">
        <h2 className="text-[0.9375rem] font-semibold text-text-primary mb-4">Account</h2>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm bg-accent-red/10 border border-accent-red/30 text-accent-red hover:bg-accent-red/15 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )
}
