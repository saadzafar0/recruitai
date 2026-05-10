import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Link2, Loader2, Mail, Phone, Upload, User } from 'lucide-react'
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
  const [jobTitle, setJobTitle] = useState<string>('Loading job details...')
  const [cvFile, setCvFile] = useState<File | null>(null)

  useEffect(() => {
    if (initialJobId) {
      fetch('/api/v1/public/jobs')
        .then(res => res.json())
        .then(data => {
          const job = data.jobs?.find((j: any) => j.id === initialJobId)
          if (job) {
            setJobTitle(job.title)
          } else {
            setJobTitle('Job Posting')
          }
        })
        .catch(err => {
          console.error('Failed to fetch job title', err)
          setJobTitle('Job Posting')
        })
    } else {
      setJobTitle('Job Posting')
    }
  }, [initialJobId])

  const [cvUploading, setCvUploading] = useState(false)
  const [uploadedCv, setUploadedCv] = useState<{ url: string; key: string; fileName: string } | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedApplicationId, setSubmittedApplicationId] = useState('')

  const isSuccess = submittedApplicationId.length > 0

  const updateField = (key: keyof ApplyFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleUploadCV = async () => {
    if (!cvFile) return
    
    setCvUploading(true)
    setError('')
    
    try {
      console.info('[ApplyForm] Ingesting CV', {
        fileName: cvFile.name,
        fileSize: cvFile.size,
      })
      
      const uploadResult = await uploadCV(cvFile)
      
      if (!uploadResult.success || !uploadResult.url) {
        const uploadError = uploadResult.error || 'CV ingestion failed.'
        setError(uploadError)
        showError(uploadError)
      } else {
        setUploadedCv({
          url: uploadResult.url,
          key: uploadResult.key || '',
          fileName: uploadResult.fileName || cvFile.name,
        })
        showSuccess('CV ingested and queued for parsing.')
      }
    } catch (err) {
      console.error('[ApplyForm] CV ingestion error', err)
      setError('An unexpected error occurred during CV ingestion.')
    } finally {
      setCvUploading(false)
    }
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
      let cvFileUrl = uploadedCv?.url
      let cvFileName = uploadedCv?.fileName
      let cvFileKey = uploadedCv?.key

      if (!cvFileUrl && cvFile) {
        console.info('[ApplyForm] Uploading CV on submission', {
          fileName: cvFile.name,
        })
        const uploadResult = await uploadCV(cvFile)
        if (!uploadResult.success || !uploadResult.url) {
          const uploadError = uploadResult.error || 'CV upload failed.'
          setError(uploadError)
          showError(uploadError)
          setSubmitting(false)
          return
        }
        cvFileUrl = uploadResult.url
        cvFileName = uploadResult.fileName
        cvFileKey = uploadResult.key
      }

      console.info('[ApplyForm] Submitting application payload', {
        job_id: normalizeUuidInput(form.jobId),
        email: form.email.trim(),
        hasCoverLetter: Boolean(form.coverLetter.trim()),
        hasCvFileUrl: Boolean(cvFileUrl),
        hasCvFileKey: Boolean(cvFileKey),
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
        cv_file_key: cvFileKey,
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
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-accent-bg-faint text-accent-purple border border-accent-bg-medium uppercase tracking-wider">
              Applying for
            </span>
            <span className="text-xs text-text-secondary font-mono">
              ID: {initialJobId?.slice(0, 8)}...
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            {jobTitle}
          </h1>
          <p className="text-sm text-text-secondary">
            Complete this form to apply for this role. Fields marked with * are required.
          </p>
        </div>

        <div className="rounded-lg border p-6 bg-theme-card border-theme-border shadow-theme-card transition-colors">
          <AuthError message={error} />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Job ID is now handled automatically */}
            <input type="hidden" value={form.jobId} name="jobId" />

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

            <div className="rounded-lg border p-5 bg-theme-input border-theme-border shadow-sm">
              <label className="block text-sm font-medium text-text-secondary mb-3">
                Upload CV (PDF, DOC, DOCX, PNG, JPG/JPEG, WEBP, BMP, TIFF — max 10MB)
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="relative flex-1 w-full">
                  <input
                    type="file"
                    id="cv-upload"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.tif"
                    onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="cv-upload"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium rounded border border-theme-border-input bg-theme-card text-text-primary hover:border-accent-purple transition-all cursor-pointer shadow-sm"
                  >
                    <FileText size={16} className="text-accent-purple" />
                    {cvFile ? cvFile.name : 'Select CV File'}
                  </label>
                </div>
                
                <button
                  type="button"
                  onClick={handleUploadCV}
                  disabled={!cvFile || cvUploading || !!uploadedCv}
                  className="whitespace-nowrap px-6 py-2.5 text-sm font-semibold text-white rounded bg-accent-purple hover:bg-accent-purple-hover disabled:bg-disabled disabled:cursor-not-allowed transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  {cvUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {uploadedCv ? 'CV Ingested' : cvUploading ? 'Ingesting...' : 'Ingest CV'}
                </button>
              </div>
              
              {uploadedCv && (
                <div className="mt-3 flex items-center gap-2 text-xs text-success bg-success-bg border border-success/20 px-3 py-2 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Successfully ingested: {uploadedCv.fileName}
                </div>
              )}
              
              {!uploadedCv && !cvUploading && (
                <p className="mt-2 text-[0.7rem] text-text-secondary flex items-center gap-1.5 opacity-70">
                  <Upload size={10} />
                  Choose a file and click "Ingest CV" to process your background automatically.
                </p>
              )}
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
