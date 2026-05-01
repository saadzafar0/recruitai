'use client'

/**
 * Organization Page
 * Manage organization details for recruiters
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Globe, MapPin, Users, Save, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { useOrganization } from '@/hooks/useOrganization'
import { useToast } from '@/context/ToastContext'
import { INDUSTRIES, SIZE_RANGES } from '@/types/organization'
import type { OrganizationCreate, OrganizationUpdate } from '@/types/organization'

export default function OrganizationPage() {
  const router = useRouter()
  const { organization, loading, error, hasOrganization, createOrganization, updateOrganization } = useOrganization()
  const { showSuccess, showError } = useToast()

  const [formData, setFormData] = useState<OrganizationCreate>({
    name: '',
    website_url: '',
    industry: '',
    size_range: '',
    country: 'PK',
    city: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        website_url: organization.website_url || '',
        industry: organization.industry || '',
        size_range: organization.size_range || '',
        country: organization.country || 'PK',
        city: organization.city || '',
      })
    }
  }, [organization])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      showError('Organization name is required')
      return
    }

    setSaving(true)

    try {
      if (hasOrganization) {
        const result = await updateOrganization({
          id: organization!.id,
          ...formData,
        } as OrganizationUpdate)
        if (result) {
          showSuccess('Organization updated successfully')
        }
      } else {
        const result = await createOrganization(formData)
        if (result) {
          showSuccess('Organization created successfully')
        }
      }
    } catch {
      showError('Failed to save organization')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-accent-purple border-t-transparent animate-spin" />
            <p className="text-sm text-text-secondary">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <button
        onClick={() => router.push('/recruiter')}
        className="sm:hidden flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <button
        onClick={() => router.push('/recruiter')}
        className="hidden sm:flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        Go to Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary flex items-center gap-2">
          <Building2 size={24} className="text-accent-purple" />
          {hasOrganization ? 'Organization Settings' : 'Create Organization'}
        </h1>
        <p className="text-sm mt-1 text-text-secondary">
          {hasOrganization
            ? 'Manage your organization details and settings.'
            : 'Set up your organization to start posting jobs.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-lg border border-accent-red/30 bg-accent-red/10">
          <AlertCircle size={18} className="text-accent-red flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-accent-red">Error</p>
            <p className="text-xs text-accent-red/80">{error}</p>
          </div>
        </div>
      )}

      {!hasOrganization && (
        <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-lg border border-accent-purple/30 bg-accent-purple/10">
          <Building2 size={18} className="text-accent-purple flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-accent-purple">Organization Required</p>
            <p className="text-xs text-accent-purple/80">
              You need to create an organization before you can post jobs. Fill in the details below to get started.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg border bg-theme-card border-theme-border shadow-theme-card transition-colors p-5">
          <p className="text-[0.9375rem] font-semibold text-text-primary mb-4">Organization Details</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Organization Name">
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm rounded border border-theme-border bg-theme-input text-text-primary outline-none"
                placeholder="Acme Inc."
              />
            </Field>

            <Field label="Website">
              <input
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm rounded border border-theme-border bg-theme-input text-text-primary outline-none"
                placeholder="https://company.com"
              />
            </Field>

            <Field label="Industry">
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm rounded border border-theme-border bg-theme-input text-text-primary outline-none"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Company Size">
              <select
                name="size_range"
                value={formData.size_range}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm rounded border border-theme-border bg-theme-input text-text-primary outline-none"
              >
                <option value="">Select size</option>
                {SIZE_RANGES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Country">
              <input
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm rounded border border-theme-border bg-theme-input text-text-primary outline-none"
                placeholder="PK"
              />
            </Field>

            <Field label="City">
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm rounded border border-theme-border bg-theme-input text-text-primary outline-none"
                placeholder="Lahore"
              />
            </Field>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded text-sm font-medium bg-accent-purple text-white hover:bg-accent-purple-hover transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm mb-1.5 text-text-secondary font-medium">{label}</span>
      {children}
    </label>
  )
}
