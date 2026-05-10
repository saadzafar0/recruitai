/**
 * JobModal Component
 * Modal for creating and editing job postings
 */

import { useState, useEffect } from 'react'
import { X, Plus, Loader2 } from 'lucide-react'
import type { JobPosting, JobPostingCreate, JobStatus, EmploymentType, WorkMode } from '@/types/job'

interface JobModalProps {
  isOpen: boolean
  job?: JobPosting | null
  onClose: () => void
  onSave: (data: JobPostingCreate) => Promise<void>
  loading?: boolean
}

const employmentOptions: { value: EmploymentType; label: string }[] = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const workModeOptions: { value: WorkMode; label: string }[] = [
  { value: 'onsite', label: 'Onsite' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

const statusOptions: { value: JobStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
]

const initialFormState: JobPostingCreate = {
  title: '',
  description: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
  employment_type: 'full_time',
  work_mode: 'onsite',
  location: '',
  experience_min_years: 0,
  experience_max_years: undefined,
  salary_min: undefined,
  salary_max: undefined,
  salary_currency: 'PKR',
  application_deadline: '',
  openings_count: 1,
  cv_parsing_enabled: true,
  voice_interview_enabled: true,
  coding_assessment_enabled: true,
  system_design_enabled: false,
  weight_cv: 25,
  weight_voice: 35,
  weight_coding: 30,
  weight_system_design: 10,
  status: 'draft',
  skills: [],
}

export function JobModal({ isOpen, job, onClose, onSave, loading }: JobModalProps) {
  const [form, setForm] = useState<JobPostingCreate>(initialFormState)
  const [skillInput, setSkillInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!job

  // Populate form when editing
  useEffect(() => {
    if (job) {
      setForm({
        title: job.title,
        description: job.description,
        responsibilities: job.responsibilities || '',
        requirements: job.requirements || '',
        benefits: job.benefits || '',
        employment_type: job.employment_type,
        work_mode: job.work_mode,
        location: job.location || '',
        experience_min_years: job.experience_min_years,
        experience_max_years: job.experience_max_years,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        salary_currency: job.salary_currency || 'PKR',
        application_deadline: job.application_deadline?.split('T')[0] || '',
        openings_count: job.openings_count,
        cv_parsing_enabled: job.cv_parsing_enabled ?? true,
        voice_interview_enabled: job.voice_interview_enabled ?? true,
        coding_assessment_enabled: job.coding_assessment_enabled ?? true,
        system_design_enabled: job.system_design_enabled ?? false,
        weight_cv: job.weight_cv ?? 25,
        weight_voice: job.weight_voice ?? 35,
        weight_coding: job.weight_coding ?? 30,
        weight_system_design: job.weight_system_design ?? 10,
        status: job.status,
        skills: job.skills || [],
      })
    } else {
      setForm(initialFormState)
    }
    setErrors({})
    setSkillInput('')
  }, [job, isOpen])

  const updateField = <K extends keyof JobPostingCreate>(
    key: K,
    value: JobPostingCreate[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const addSkill = () => {
    if (skillInput.trim() && !form.skills?.includes(skillInput.trim())) {
      updateField('skills', [...(form.skills || []), skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    updateField('skills', form.skills?.filter((s) => s !== skill) || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const newErrors: Record<string, string> = {}
    if (!form.title.trim()) newErrors.title = 'Title is required'
    if (!form.description.trim()) newErrors.description = 'Description is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    await onSave(form)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg border bg-theme-card border-theme-border shadow-theme-elevated">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border">
          <h2 className="text-lg font-semibold text-text-primary">
            {isEditing ? 'Edit Job Posting' : 'Create Job Posting'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded text-text-secondary hover:text-text-primary hover:bg-theme-elevated transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-130px)]">
          <div className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className={`w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                  bg-theme-input text-text-primary
                  focus:border-accent-purple focus:bg-theme-card
                  placeholder:text-text-secondary/50
                  transition-colors
                  ${errors.title ? 'border-accent-red' : 'border-theme-border-input'}
                `}
              />
              {errors.title && (
                <p className="text-xs text-accent-red mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe the role and responsibilities..."
                rows={4}
                className={`w-full px-3 py-2.5 text-sm rounded-lg border outline-none resize-none
                  bg-theme-input text-text-primary
                  focus:border-accent-purple focus:bg-theme-card
                  placeholder:text-text-secondary/50
                  transition-colors
                  ${errors.description ? 'border-accent-red' : 'border-theme-border-input'}
                `}
              />
              {errors.description && (
                <p className="text-xs text-accent-red mt-1">{errors.description}</p>
              )}
            </div>

            {/* Two column layout for smaller fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Employment Type */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Employment Type
                </label>
                <select
                  value={form.employment_type}
                  onChange={(e) => updateField('employment_type', e.target.value as EmploymentType)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none appearance-none cursor-pointer
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                >
                  {employmentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Work Mode */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Work Mode
                </label>
                <select
                  value={form.work_mode}
                  onChange={(e) => updateField('work_mode', e.target.value as WorkMode)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none appearance-none cursor-pointer
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                >
                  {workModeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  placeholder="e.g. Lahore, Pakistan"
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    placeholder:text-text-secondary/50
                    transition-colors"
                />
              </div>

              {/* Experience Min */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Min Experience (years)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.experience_min_years}
                  onChange={(e) => updateField('experience_min_years', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                />
              </div>

              {/* Experience Max */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Max Experience (years)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={form.experience_max_years ?? ''}
                  onChange={(e) => updateField('experience_max_years', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                />
              </div>

              {/* Application Deadline */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Application Deadline
                </label>
                <input
                  type="date"
                  value={form.application_deadline}
                  onChange={(e) => updateField('application_deadline', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value as JobStatus)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none appearance-none cursor-pointer
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Openings */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Number of Openings
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.openings_count}
                  onChange={(e) => updateField('openings_count', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                />
              </div>

              {/* Salary Min */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Salary Min
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.salary_min ?? ''}
                  onChange={(e) => updateField('salary_min', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                />
              </div>

              {/* Salary Max */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Salary Max
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.salary_max ?? ''}
                  onChange={(e) => updateField('salary_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                />
              </div>

              {/* Salary Currency */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Salary Currency
                </label>
                <input
                  type="text"
                  value={form.salary_currency}
                  onChange={(e) => updateField('salary_currency', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                />
              </div>
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Responsibilities
              </label>
              <textarea
                value={form.responsibilities}
                onChange={(e) => updateField('responsibilities', e.target.value)}
                placeholder="Outline key responsibilities..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none resize-none
                  bg-theme-input text-text-primary border-theme-border-input
                  focus:border-accent-purple focus:bg-theme-card
                  placeholder:text-text-secondary/50
                  transition-colors"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Required Skills
              </label>
              <div className="flex flex-wrap gap-2 p-2 rounded-lg border min-h-[42px] bg-theme-input border-theme-border-input">
                {form.skills?.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded border bg-theme-card border-theme-border text-text-secondary"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-text-secondary/60 hover:text-accent-red transition-colors cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Add skill, press Enter..."
                  className="flex-1 min-w-[120px] px-1 text-sm outline-none bg-transparent text-text-primary placeholder:text-text-secondary/50"
                />
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Requirements
              </label>
              <textarea
                value={form.requirements}
                onChange={(e) => updateField('requirements', e.target.value)}
                placeholder="List the requirements for this role..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none resize-none
                  bg-theme-input text-text-primary border-theme-border-input
                  focus:border-accent-purple focus:bg-theme-card
                  placeholder:text-text-secondary/50
                  transition-colors"
              />
            </div>

            {/* Benefits */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Benefits
              </label>
              <textarea
                value={form.benefits}
                onChange={(e) => updateField('benefits', e.target.value)}
                placeholder="List benefits and perks..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none resize-none
                  bg-theme-input text-text-primary border-theme-border-input
                  focus:border-accent-purple focus:bg-theme-card
                  placeholder:text-text-secondary/50
                  transition-colors"
              />
            </div>

            {/* Assessment Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-theme-input border-theme-border-input">
                <span className="text-sm text-text-secondary">CV Parsing</span>
                <input
                  type="checkbox"
                  checked={!!form.cv_parsing_enabled}
                  onChange={(e) => updateField('cv_parsing_enabled', e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-theme-input border-theme-border-input">
                <span className="text-sm text-text-secondary">Voice Interview</span>
                <input
                  type="checkbox"
                  checked={!!form.voice_interview_enabled}
                  onChange={(e) => updateField('voice_interview_enabled', e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-theme-input border-theme-border-input">
                <span className="text-sm text-text-secondary">Coding Assessment</span>
                <input
                  type="checkbox"
                  checked={!!form.coding_assessment_enabled}
                  onChange={(e) => updateField('coding_assessment_enabled', e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between px-3 py-2.5 rounded-lg border bg-theme-input border-theme-border-input">
                <span className="text-sm text-text-secondary">System Design</span>
                <input
                  type="checkbox"
                  checked={!!form.system_design_enabled}
                  onChange={(e) => updateField('system_design_enabled', e.target.checked)}
                />
              </label>
            </div>

            {/* Weights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Weight CV</label>
                <input
                  type="number"
                  min={0}
                  value={form.weight_cv ?? 0}
                  onChange={(e) => updateField('weight_cv', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Weight Voice</label>
                <input
                  type="number"
                  min={0}
                  value={form.weight_voice ?? 0}
                  onChange={(e) => updateField('weight_voice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Weight Coding</label>
                <input
                  type="number"
                  min={0}
                  value={form.weight_coding ?? 0}
                  onChange={(e) => updateField('weight_coding', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Weight System Design</label>
                <input
                  type="number"
                  min={0}
                  value={form.weight_system_design ?? 0}
                  onChange={(e) => updateField('weight_system_design', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none
                    bg-theme-input text-text-primary border-theme-border-input
                    focus:border-accent-purple focus:bg-theme-card
                    transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-theme-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-theme-border text-text-secondary hover:bg-theme-elevated transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white rounded-lg bg-accent-purple hover:bg-accent-purple-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {isEditing ? 'Save Changes' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
