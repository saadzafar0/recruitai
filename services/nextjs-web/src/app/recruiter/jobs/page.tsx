'use client'

/**
 * Job Postings Page
 * Main page for managing job postings with table, filters, search, and modals
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Building2, ArrowRight, ArrowLeft } from 'lucide-react'
import {
  JobsFilters,
  JobsFiltersMobile,
  JobModal,
  Pagination,
  PaginationMobile,
  type JobsFiltersState,
  type SortField,
  type SortDirection,
} from '@/components/recruiter'
import { useJobs } from '@/hooks/useJobs'
import { useOrganization } from '@/hooks/useOrganization'
import { useToast } from '@/context/ToastContext'
import type { JobPosting, JobPostingCreate, JobStatus } from '@/types/job'

const ITEMS_PER_PAGE = 10

const initialFilters: JobsFiltersState = {
  search: '',
  status: '',
  employment_type: '',
  work_mode: '',
}

export default function JobsPage() {
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const { organizations, organization, loading: orgLoading, hasOrganization } = useOrganization()
  const [filters, setFilters] = useState<JobsFiltersState>(initialFilters)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null)
  const [saving, setSaving] = useState(false)

  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.search])

  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null)

  const {
    jobs,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    updateJobStatus,
    refreshJobs,
  } = useJobs({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    filters: {
      search: debouncedSearch || undefined,
      status: filters.status || undefined,
      employment_type: filters.employment_type || undefined,
      work_mode: filters.work_mode || undefined,
      organization_id: selectedOrganizationId || undefined,
    },
    sort: {
      field: sortField,
      direction: sortDirection,
    },
  })

  useEffect(() => {
    fetchJobs({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      filters: {
        search: debouncedSearch || undefined,
        status: filters.status || undefined,
        employment_type: filters.employment_type || undefined,
        work_mode: filters.work_mode || undefined,
        organization_id: selectedOrganizationId || undefined,
      },
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    })
  }, [currentPage, debouncedSearch, filters.status, filters.employment_type, filters.work_mode, sortField, sortDirection, selectedOrganizationId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDirection('desc')
      }
      setCurrentPage(1)
    },
    [sortField],
  )

  const handleFilterChange = useCallback((newFilters: JobsFiltersState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters)
    setCurrentPage(1)
  }, [])

  const handleCreateJob = () => {
    if (!hasOrganization && !orgLoading) {
      showError('Please create an organization first')
      router.push('/recruiter/organization')
      return
    }

    if (!selectedOrganizationId) {
      showError('Select an organization before creating a job')
      return
    }

    setEditingJob(null)
    setModalOpen(true)
  }

  const handleEditJob = (job: JobPosting) => {
    setEditingJob(job)
    setModalOpen(true)
  }

  const handleSaveJob = async (data: JobPostingCreate) => {
    setSaving(true)
    try {
      if (editingJob) {
        const updated = await updateJob({ id: editingJob.id, ...data })
        if (updated) {
          showSuccess('Job updated successfully')
          await refreshJobs()
          setModalOpen(false)
          setEditingJob(null)
        }
      } else {
        const created = await createJob({
          ...data,
          organization_id: selectedOrganizationId || organization?.id,
        })
        if (created) {
          showSuccess('Job created successfully')
          await refreshJobs()
          setModalOpen(false)
        }
      }
    } catch {
      showError('Failed to save job')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteJob = async (id: string) => {
    const ok = await deleteJob(id)
    if (ok) {
      showSuccess('Job deleted')
      await refreshJobs()
    } else {
      showError('Failed to delete job')
    }
  }

  const handlePublishToggle = async (id: string, status: JobStatus) => {
    const updated = await updateJobStatus(id, status)
    if (updated) {
      showSuccess('Status updated')
      await refreshJobs()
    } else {
      showError('Failed to update status')
    }
  }

  const handleOrganizationChange = (orgId: string | null) => {
    setSelectedOrganizationId(orgId)
    setCurrentPage(1)
  }

  const renderJobBar = (job: JobPosting) => (
    <div
      key={job.id}
      className="p-4 mb-4 rounded-lg border bg-theme-card hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
      onClick={() => handleEditJob(job)}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{job.title}</h3>
          <p className="text-sm text-text-secondary">
            Applicants: {job.applications_count ?? 0} | Views: {job.views_count ?? 0}
          </p>
        </div>
        <p className="text-sm text-text-secondary">
          Deadline: {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'N/A'}
        </p>
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary">Job Postings</h1>
          <p className="text-sm mt-0.5 text-text-secondary">Create, publish, and manage your jobs.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="min-w-[220px]">
            <label className="block text-xs font-medium text-text-secondary mb-1">Organization</label>
            <select
              value={selectedOrganizationId || 'all'}
              onChange={(e) => handleOrganizationChange(e.target.value === 'all' ? null : e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none appearance-none cursor-pointer bg-theme-input text-text-primary border-theme-border-input focus:border-accent-purple focus:bg-theme-card transition-colors"
              disabled={!hasOrganization}
            >
              <option value="all">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleCreateJob}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium bg-accent-purple text-white hover:bg-accent-purple-hover transition-colors cursor-pointer"
          >
            <Plus size={16} />
            New Job
          </button>
        </div>
      </div>

      {!hasOrganization && !orgLoading && (
        <div className="mb-6 flex items-start justify-between gap-4 px-5 py-4 rounded-lg border border-accent-purple/30 bg-accent-purple/10">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-theme-elevated">
              <Building2 size={18} className="text-accent-purple" />
            </div>
            <div>
              <p className="text-sm font-semibold text-accent-purple">Organization required</p>
              <p className="text-sm text-accent-purple/80">
                Create your organization before posting jobs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/recruiter/organization')}
            className="inline-flex items-center gap-2 text-sm font-medium text-accent-purple hover:underline cursor-pointer"
          >
            Go to Organization
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      <div className="hidden sm:block">
        <JobsFilters
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </div>

      <div className="sm:hidden">
        <JobsFiltersMobile
          filters={filters}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="rounded-lg border border-theme-border bg-theme-card px-4 py-6 text-sm text-text-secondary">
            Loading jobs...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-theme-border bg-theme-card px-4 py-6 text-sm text-text-secondary">
            Failed to load jobs.
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-lg border border-theme-border bg-theme-card px-4 py-6 text-sm text-text-secondary">
            No jobs match the current filters.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(renderJobBar)}
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setCurrentPage}
        />
      </div>

      <div className="sm:hidden">
        <PaginationMobile
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setCurrentPage}
        />
      </div>

      <JobModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingJob(null)
        }}
        onSave={handleSaveJob}
        job={editingJob}
        loading={saving}
      />

      <button
        type="button"
        onClick={() => router.push('/recruiter')}
        className="mt-8 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>
    </div>
  )
}
