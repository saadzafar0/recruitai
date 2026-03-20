/**
 * Job Postings Page
 * Main page for managing job postings with table, filters, search, and modals
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Plus, Building2, ArrowRight, ArrowLeft } from 'lucide-react'
import { RecruiterLayout } from '@/components/layout'
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

  // Debounced search
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

  // Refetch when filters/sort/page changes
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

  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }, [sortField])

  const handleFilterChange = useCallback((newFilters: JobsFiltersState) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters)
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleRowClick = useCallback((job: JobPosting) => {
    setEditingJob(job)
    setModalOpen(true)
  }, [])

  const handleStatusChange = useCallback(async (id: string, status: JobStatus) => {
    const result = await updateJobStatus(id, status)
    if (result) {
      showSuccess(`Job status updated to ${status}`)
    } else {
      showError('Failed to update job status')
    }
  }, [updateJobStatus, showSuccess, showError])

  const handleDelete = useCallback(async (id: string) => {
    const success = await deleteJob(id)
    if (success) {
      showSuccess('Job posting deleted')
    } else {
      showError('Failed to delete job posting')
    }
  }, [deleteJob, showSuccess, showError])

  const handleOpenCreateModal = useCallback(() => {
    setEditingJob(null)
    setModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setEditingJob(null)
  }, [])

  const handleSaveJob = useCallback(async (data: JobPostingCreate) => {
    setSaving(true)
    try {
      if (editingJob) {
        const result = await updateJob({ id: editingJob.id, ...data })
        if (result) {
          showSuccess('Job posting updated')
          handleCloseModal()
        } else {
          showError('Failed to update job posting')
        }
      } else {
        const result = await createJob(data)
        if (result) {
          showSuccess('Job posting created')
          handleCloseModal()
        } else {
          showError('Failed to create job posting')
        }
      }
    } finally {
      setSaving(false)
    }
  }, [editingJob, createJob, updateJob, showSuccess, showError, handleCloseModal])

  return (
    <RecruiterLayout title="Job Postings">
      <div className="p-4 sm:p-6 max-w-6xl">
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

        {/* Loading state for organization check */}
        {orgLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-accent-purple border-t-transparent animate-spin" />
              <p className="text-sm text-text-secondary">Loading...</p>
            </div>
          </div>
        ) : !hasOrganization ? (
          /* No Organization State */
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-accent-purple/10">
              <Building2 size={32} className="text-accent-purple" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">
              Organization Required
            </h2>
            <p className="text-sm text-text-secondary max-w-md mb-6">
              You need to create an organization before you can post jobs.
              Set up your organization profile to get started.
            </p>
            <button
              onClick={() => router.push('/recruiter/organization')}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg bg-accent-purple hover:bg-accent-purple-hover transition-colors cursor-pointer"
            >
              Create Organization
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* Main Content - Jobs Management */
          <>
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl sm:text-[1.375rem] font-semibold text-text-primary">
                  Job Postings
                </h1>
                <p className="text-sm mt-0.5 text-text-secondary">
                  Manage your job postings and track applicants.
                </p>
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg bg-accent-purple hover:bg-accent-purple-hover transition-colors cursor-pointer"
              >
                <Plus size={16} />
                <span>Post New Job</span>
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-4 rounded-lg border border-accent-red/30 bg-accent-red/10">
                <p className="text-sm text-accent-red">{error}</p>
              </div>
            )}

            {/* Desktop Filters */}
            <div className="hidden sm:block mb-6">
              <JobsFilters
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
              />
            </div>

            {/* Mobile Filters */}
            <div className="sm:hidden mb-4">
              <JobsFiltersMobile
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
              />
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block">
              <JobsTable
                jobs={jobs}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onRowClick={handleRowClick}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                loading={loading}
              />
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={handlePageChange}
              />
            </div>

            {/* Mobile Table */}
            <div className="sm:hidden">
              <JobsTableMobile
                jobs={jobs}
                onRowClick={handleRowClick}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                loading={loading}
              />
              <PaginationMobile
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={handlePageChange}
              />
            </div>

            {/* Job Modal */}
            <JobModal
              isOpen={modalOpen}
              job={editingJob}
              onClose={handleCloseModal}
              onSave={handleSaveJob}
              loading={saving}
            />
          </>
        )}
      </div>
    </RecruiterLayout>
  )
}
