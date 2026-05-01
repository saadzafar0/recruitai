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
  JobsTable,
  JobsTableMobile,
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
  const { organization, loading: orgLoading, hasOrganization } = useOrganization()
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
  } = useJobs({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    filters: {
      search: debouncedSearch || undefined,
      status: filters.status || undefined,
      employment_type: filters.employment_type || undefined,
      work_mode: filters.work_mode || undefined,
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
      },
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    })
  }, [currentPage, debouncedSearch, filters.status, filters.employment_type, filters.work_mode, sortField, sortDirection]) // eslint-disable-line react-hooks/exhaustive-deps

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
          setModalOpen(false)
          setEditingJob(null)
        }
      } else {
        const created = await createJob(data)
        if (created) {
          showSuccess('Job created successfully')
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
    } else {
      showError('Failed to delete job')
    }
  }

  const handlePublishToggle = async (id: string, status: JobStatus) => {
    const updated = await updateJobStatus(id, status)
    if (updated) {
      showSuccess('Status updated')
    } else {
      showError('Failed to update status')
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary">Job Postings</h1>
          <p className="text-sm mt-0.5 text-text-secondary">Create, publish, and manage your jobs.</p>
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

      <div className="hidden sm:block">
        <JobsTable
          jobs={jobs}
          loading={loading}
          error={error}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onDelete={handleDeleteJob}
          onRowClick={handleEditJob}
          onStatusChange={handlePublishToggle}
        />
      </div>

      <div className="sm:hidden">
        <JobsTableMobile
          jobs={jobs}
          loading={loading}
          error={error}
          onDelete={handleDeleteJob}
          onRowClick={handleEditJob}
          onStatusChange={handlePublishToggle}
        />
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
