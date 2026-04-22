import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Briefcase, FileText, Link2, Loader2, Mail, Phone, Upload, User } from 'lucide-react'
import { ThemeToggleMobile } from '@/components/ui/theme-toggle'
import { AuthError } from '@/components/auth'
import { useToast } from '@/context/ToastContext'
import { submitApplication } from '@/lib/applications'
import { uploadCV } from '@/lib/uploads'

interface CandidateApplyFormProps {
  initialJobId?: string
}

interface ApplyFormState {
  jobId: string
  email: string
  firstName: string
  lastName: string
  phone: string
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
  coverLetter: string
}

const initialFormState: ApplyFormState = {
  jobId: '',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  coverLetter: '',
}

function isValidUrlOrEmpty(value: string): boolean {
  if (!value.trim()) {
    return true
  }

  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function normalizeUuidInput(value: string): string {
  return value.trim().replace(/^['"{\s]+|['"}\s]+$/g, '')
}

export function CandidateApplyForm({ initialJobId = '' }: CandidateApplyFormProps) {
  const router = useRouter()
  const { showSuccess, showError } = useToast()

  const [form, setForm] = useState<ApplyFormState>({
    ...initialFormState,
    jobId: initialJobId,
  })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedApplicationId, setSubmittedApplicationId] = useState('')

  const isSuccess = submittedApplicationId.length > 0

  const selectedFileLabel = useMemo(() => {
    if (!cvFile) {
      return 'No CV selected yet (optional)'
    }
    const sizeMb = (cvFile.size / (1024 * 1024)).toFixed(2)
    return `${cvFile.name} (${sizeMb} MB)`
  }, [cvFile])

  const updateField = (key: keyof ApplyFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = (): string => {
    const jobId = normalizeUuidInput(form.jobId)
    const firstName = form.firstName.trim()
    const lastName = form.lastName.trim()
    const email = form.email.trim()

    if (!jobId) {
      return 'Job UUID is required.'
    }

    if (!isValidUuid(jobId)) {
      return 'Job ID must be a valid UUID.'
    }

    if (!firstName) {
      return 'First name is required.'
    }

    if (!lastName) {
      return 'Last name is required.'
    }

    if (!email) {
      return 'Email is required.'
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return 'Email must be a valid email address.'
    }

    if (!isValidUrlOrEmpty(form.linkedinUrl)) {
      return 'LinkedIn URL must be a valid URL.'
    }

    if (!isValidUrlOrEmpty(form.githubUrl)) {
      return 'GitHub URL must be a valid URL.'
    }

    if (!isValidUrlOrEmpty(form.portfolioUrl)) {
      return 'Portfolio URL must be a valid URL.'
    }

    return ''
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    console.info('[ApplyForm] Submit clicked', {
      jobIdPreview: form.jobId.trim().slice(0, 8),
      hasFirstName: Boolean(form.firstName.trim()),
      hasLastName: Boolean(form.lastName.trim()),
      hasEmail: Boolean(form.email.trim()),
      hasCV: Boolean(cvFile),
    })

    const validationError = validate()
    if (validationError) {
      console.warn('[ApplyForm] Client validation failed', {
        validationError,
        formSnapshot: {
          jobId: form.jobId,
          normalizedJobId: normalizeUuidInput(form.jobId),
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
        },
      })
      setError(validationError)
      return
    }

    setSubmitting(true)

    try {
      let cvFileUrl: string | undefined
      let cvFileName: string | undefined

      if (cvFile) {
        console.info('[ApplyForm] Uploading CV', {
          fileName: cvFile.name,
          fileType: cvFile.type,
          fileSize: cvFile.size,
        })
        const uploadResult = await uploadCV(cvFile)
        if (!uploadResult.success || !uploadResult.url) {
          const uploadError = uploadResult.error || 'CV upload failed.'
          console.error('[ApplyForm] CV upload failed', {
            uploadError,
            uploadResult,
          })
          setError(uploadError)
          showError(uploadError)
          setSubmitting(false)
          return
        }

        console.info('[ApplyForm] CV upload succeeded', {
          uploadedFileName: uploadResult.fileName,
          uploadedKey: uploadResult.key,
        })
        cvFileUrl = uploadResult.url
        cvFileName = uploadResult.fileName
      }

      console.info('[ApplyForm] Submitting application payload', {
        job_id: normalizeUuidInput(form.jobId),
        email: form.email.trim(),
        hasCoverLetter: Boolean(form.coverLetter.trim()),
        hasCvFileUrl: Boolean(cvFileUrl),
      })

      const result = await submitApplication({
        job_id: normalizeUuidInput(form.jobId),
        email: form.email.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        linkedin_url: form.linkedinUrl.trim() || undefined,
        github_url: form.githubUrl.trim() || undefined,
        portfolio_url: form.portfolioUrl.trim() || undefined,
        cover_letter: form.coverLetter.trim() || undefined,
        cv_file_url: cvFileUrl,
        cv_file_name: cvFileName,
      })

      if (!result.success || !result.data) {
        const submitError = result.error || 'Application submission failed.'
        console.error('[ApplyForm] Application submission failed', {
          submitError,
          result,
        })
        setError(submitError)
        showError(submitError)
        setSubmitting(false)
        return
      }

      console.info('[ApplyForm] Application submitted successfully', {
        applicationId: result.data.application_id,
        profileId: result.data.profile_id,
      })
      setSubmittedApplicationId(result.data.application_id)
      showSuccess('Application submitted successfully!')
    } catch (submissionError) {
      const fallback = submissionError instanceof Error
        ? submissionError.message
        : 'Something went wrong while submitting your application.'
      console.error('[ApplyForm] Unexpected submission exception', submissionError)
      setError(fallback)
      showError(fallback)
    } finally {
      setSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-theme-bg transition-colors">
        <header className="border-b bg-theme-input border-theme-border transition-colors">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center bg-accent-purple">
                <span className="text-white text-sm font-semibold">R</span>
              </div>
              <span className="text-lg font-semibold text-text-primary">RecruitAI</span>
            </div>
            <ThemeToggleMobile />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="rounded-lg border p-6 sm:p-8 bg-theme-card border-theme-border shadow-theme-card">
            <h1 className="text-xl sm:text-2xl font-semibold text-text-primary mb-2">
              Application Submitted
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              Your application was received successfully. Keep this reference for tracking.
            </p>

            <div className="rounded-lg border px-4 py-3 bg-theme-input border-theme-border mb-6">
              <p className="text-xs text-text-secondary mb-1">Application Reference</p>
              <p className="text-sm font-medium text-accent-purple break-all">{submittedApplicationId}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="px-5 py-2.5 text-sm font-medium text-white rounded bg-accent-purple hover:bg-accent-purple-hover transition-colors cursor-pointer"
              >
                Back to Homepage
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedApplicationId('')
                  setForm({
                    ...initialFormState,
                    jobId: initialJobId,
                    email: form.email,
                    firstName: form.firstName,
                    lastName: form.lastName,
                  })
                  setCvFile(null)
                }}
                className="px-5 py-2.5 text-sm rounded border border-theme-border text-text-secondary hover:bg-theme-input transition-colors cursor-pointer"
              >
                Submit Another Application
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-theme-bg transition-colors">
      <header className="border-b bg-theme-input border-theme-border transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-accent-purple">
              <span className="text-white text-sm font-semibold">R</span>
            </div>
            <span className="text-lg font-semibold text-text-primary">RecruitAI</span>
          </div>
          <ThemeToggleMobile />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            Candidate Application Form
          </h1>
          <p className="text-sm text-text-secondary">
            Complete this form to apply for a job posting. Fields marked with * are required.
          </p>
        </div>

        <div className="rounded-lg border p-6 bg-theme-card border-theme-border shadow-theme-card transition-colors">
          <AuthError message={error} />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Job ID *
              </label>
              <div className="relative">
                <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                <input
                  type="text"
                  value={form.jobId}
                  onChange={(e) => updateField('jobId', e.target.value)}
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded border outline-none bg-theme-input text-text-primary border-theme-border-input focus:border-accent-purple focus:bg-theme-card placeholder:text-text-secondary/50 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  First Name *
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="First name"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded border outline-none bg-theme-input text-text-primary border-theme-border-input focus:border-accent-purple focus:bg-theme-card placeholder:text-text-secondary/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Last Name *
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Last name"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded border outline-none bg-theme-input text-text-primary border-theme-border-input focus:border-accent-purple focus:bg-theme-card placeholder:text-text-secondary/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Email *
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded border outline-none bg-theme-input text-text-primary border-theme-border-input focus:border-accent-purple focus:bg-theme-card placeholder:text-text-secondary/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Phone
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+92 3xx xxxxxxx"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded border outline-none bg-theme-input text-text-primary border-theme-border-input focus:border-accent-purple focus:bg-theme-card placeholder:text-text-secondary/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  LinkedIn URL
                </label>
                <div className="relative">
                  <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                  <input
                    type="url"
                    value={form.linkedinUrl}
                    onChange={(e) => updateField('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded border outline-none bg-theme-input text-text-primary border-theme-border-input focus:border-accent-purple focus:bg-theme-card placeholder:text-text-secondary/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  GitHub URL
                </label>
                <div className="relative">
                  <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                  <input
                    type="url"
                    value={form.githubUrl}
                    onChange={(e) => updateField('githubUrl', e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded border outline-none bg-theme-input text-text-primary border-theme-border-input focus:border-accent-purple focus:bg-theme-card placeholder:text-text-secondary/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Portfolio URL
                </label>
                <div className="relative">
                  <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                  <input
                    type="url"
                    value={form.portfolioUrl}
                    onChange={(e) => updateField('portfolioUrl', e.target.value)}
                    placeholder="https://your-portfolio.com"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded border outline-none bg-theme-input text-text-primary border-theme-border-input focus:border-accent-purple focus:bg-theme-card placeholder:text-text-secondary/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Cover Letter
              </label>
              <div className="relative">
                <FileText size={15} className="absolute left-3 top-3 text-text-secondary/50" />
                <textarea
                  value={form.coverLetter}
                  onChange={(e) => updateField('coverLetter', e.target.value)}
                  rows={5}
                  placeholder="Tell us why you are a strong fit for this role..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded border outline-none bg-theme-input text-text-primary border-theme-border-input focus:border-accent-purple focus:bg-theme-card placeholder:text-text-secondary/50 transition-colors resize-y"
                />
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-theme-input border-theme-border">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Upload CV (PDF, DOC, DOCX, PNG, JPG, JPEG — max 10MB)
              </label>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:text-white file:bg-accent-purple hover:file:bg-accent-purple-hover file:cursor-pointer cursor-pointer"
                />
                <div className="inline-flex items-center gap-2 text-xs text-text-secondary">
                  <Upload size={13} className="text-accent-purple" />
                  <span className="break-all">{selectedFileLabel}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-sm text-white rounded cursor-pointer flex items-center justify-center gap-2 bg-accent-purple hover:bg-accent-purple-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-accent-purple transition-colors"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
