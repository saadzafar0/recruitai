/**
 * Organization Page
 * Manage organization details for recruiters
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Building2, Globe, MapPin, Users, Save, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { RecruiterLayout } from '@/components/layout'
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

  // Populate form when organization data is loaded
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
    setFormData(prev => ({ ...prev, [name]: value }))
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
    } catch (err) {
      showError('Failed to save organization')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <RecruiterLayout title="Organization">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-accent-purple border-t-transparent animate-spin" />
            <p className="text-sm text-text-secondary">Loading...</p>
          </div>
        </div>
      </RecruiterLayout>
    )
  }

  return (
    <RecruiterLayout title="Organization">
      <div className="p-4 sm:p-6 max-w-3xl">
        {/* Mobile Back Button */}
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

        {/* Page header */}
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

        {/* Error display */}
        {error && (
          <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-lg border border-accent-red/30 bg-accent-red/10">
            <AlertCircle size={18} className="text-accent-red flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-accent-red">Error</p>
              <p className="text-xs text-accent-red/80">{error}</p>
            </div>
          </div>
        )}

        {/* Info banner for new organizations */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border bg-theme-card border-theme-border shadow-theme-card p-4 sm:p-6 space-y-5">
            {/* Organization Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1.5">
                Organization Name <span className="text-accent-red">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Acme Corporation"
                className="w-full px-3 py-2 rounded-lg border bg-theme-input border-theme-border text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent-purple transition-colors"
                required
              />
            </div>

            {/* Website URL */}
            <div>
              <label htmlFor="website_url" className="block text-sm font-medium text-text-primary mb-1.5">
                Website URL
              </label>
              <div className="relative">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="url"
                  id="website_url"
                  name="website_url"
                  value={formData.website_url}
                  onChange={handleChange}
                  placeholder="https://www.example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border bg-theme-input border-theme-border text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent-purple transition-colors"
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-text-primary mb-1.5">
                Industry
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border bg-theme-input border-theme-border text-text-primary focus:outline-none focus:border-accent-purple transition-colors cursor-pointer"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            {/* Company Size */}
            <div>
              <label htmlFor="size_range" className="block text-sm font-medium text-text-primary mb-1.5">
                Company Size
              </label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <select
                  id="size_range"
                  name="size_range"
                  value={formData.size_range}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border bg-theme-input border-theme-border text-text-primary focus:outline-none focus:border-accent-purple transition-colors cursor-pointer"
                >
                  <option value="">Select size</option>
                  {SIZE_RANGES.map(size => (
                    <option key={size} value={size}>{size} employees</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-text-primary mb-1.5">
                  City
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g., Lahore"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border bg-theme-input border-theme-border text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent-purple transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-text-primary mb-1.5">
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border bg-theme-input border-theme-border text-text-primary focus:outline-none focus:border-accent-purple transition-colors cursor-pointer"
                >
                  <option value="PK">Pakistan</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg bg-accent-purple hover:bg-accent-purple-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {hasOrganization ? 'Save Changes' : 'Create Organization'}
                </>
              )}
            </button>

            {hasOrganization && (
              <button
                type="button"
                onClick={() => router.push('/recruiter/jobs')}
                className="px-6 py-2.5 text-sm font-medium rounded-lg border border-theme-border text-text-secondary hover:text-text-primary hover:bg-theme-elevated transition-colors cursor-pointer"
              >
                Go to Job Postings
              </button>
            )}
          </div>
        </form>

        {/* Organization Info (shown when organization exists) */}
        {hasOrganization && organization && (
          <div className="mt-8 rounded-lg border bg-theme-card border-theme-border shadow-theme-card p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Organization Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-text-secondary">Organization ID</dt>
                <dd className="text-text-primary font-mono text-xs mt-1 break-all">{organization.id}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Slug</dt>
                <dd className="text-text-primary font-mono text-xs mt-1">{organization.slug}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Created</dt>
                <dd className="text-text-primary mt-1">
                  {new Date(organization.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">Verified</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    organization.is_verified
                      ? 'bg-accent-green/10 text-accent-green'
                      : 'bg-text-secondary/10 text-text-secondary'
                  }`}>
                    {organization.is_verified ? 'Verified' : 'Not Verified'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </RecruiterLayout>
  )
}
