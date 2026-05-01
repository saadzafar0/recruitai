/**
 * JobsTable Component
 * Interactive table for displaying job postings with sorting and inline actions
 */

import { useState } from 'react'
import { ChevronUp, ChevronDown, Trash2, MoreVertical } from 'lucide-react'
import { JobStatusBadge } from './JobStatusBadge'
import { ConfirmationModal } from '@/components/common/ConfirmationModal'
import type { JobPosting, JobStatus } from '@/types/job'

export type SortField = 'title' | 'status' | 'created_at' | 'application_deadline'
export type SortDirection = 'asc' | 'desc'

interface JobsTableProps {
  jobs: JobPosting[]
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
  onRowClick: (job: JobPosting) => void
  onStatusChange: (id: string, status: JobStatus) => void
  onDelete: (id: string) => void | Promise<void>
  loading?: boolean
  error?: string | null
}

interface ColumnDef {
  key: SortField | 'actions'
  label: string
  sortable: boolean
  className?: string
  hideOnMobile?: boolean
}

const columns: ColumnDef[] = [
  { key: 'title', label: 'Job Title', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'application_deadline', label: 'Deadline', sortable: true, hideOnMobile: true },
  { key: 'created_at', label: 'Created', sortable: true, hideOnMobile: true },
  { key: 'actions', label: '', sortable: false, className: 'w-16' },
]

export function JobsTable({
  jobs,
  sortField,
  sortDirection,
  onSort,
  onRowClick,
  onStatusChange,
  onDelete,
  loading,
  error,
}: JobsTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<JobPosting | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleSort = (field: SortField) => {
    onSort(field)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDeadline = (dateStr?: string) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return <span className="text-accent-red">Expired</span>
    }
    if (diffDays === 0) {
      return <span className="text-amber-500">Today</span>
    }
    if (diffDays <= 7) {
      return <span className="text-amber-500">{diffDays} days</span>
    }

    return formatDate(dateStr)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    try {
      setDeleteLoading(true)
      await onDelete(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading && jobs.length === 0) {
    return (
      <div className="rounded-lg border bg-theme-card border-theme-border">
        <div className="p-12 text-center">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-accent-purple border-t-transparent animate-spin" />
          <p className="text-sm text-text-secondary mt-4">Loading jobs...</p>
        </div>
      </div>
    )
  }

  if (error && jobs.length === 0) {
    return (
      <div className="rounded-lg border bg-theme-card border-theme-border">
        <div className="p-10 text-center">
          <p className="text-sm font-medium text-accent-red">Failed to load jobs</p>
          <p className="text-xs text-accent-red/80 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border bg-theme-card border-theme-border">
        <div className="p-12 text-center">
          <p className="text-sm text-text-secondary">No job postings found.</p>
          <p className="text-xs text-text-secondary/60 mt-1">
            Create your first job posting to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-theme-card border-theme-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-theme-elevated">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`
                    px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary
                    ${col.className || ''}
                    ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}
                    ${col.sortable ? 'cursor-pointer hover:text-accent-purple transition-colors' : ''}
                  `}
                  onClick={() => col.sortable && col.key !== 'actions' && handleSort(col.key as SortField)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable && col.key !== 'actions' && (
                      <SortIndicator
                        active={sortField === col.key}
                        direction={sortDirection}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className={`
                  border-t border-theme-border cursor-pointer
                  transition-all duration-200 ease-out
                  hover:bg-accent-purple/5 hover:shadow-sm hover:-translate-y-[1px]
                  dark:hover:bg-accent-purple/10
                  ${hoveredRow === job.id ? 'bg-accent-purple/5 shadow-sm -translate-y-[1px] dark:bg-accent-purple/10' : ''}
                `}
                onMouseEnter={() => setHoveredRow(job.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onRowClick(job)}
              >
                {/* Title */}
                <td className="px-4 sm:px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-text-primary truncate max-w-[200px] sm:max-w-none">
                      {job.title}
                    </p>
                    {job.location && (
                      <p className="text-xs text-text-secondary/60 mt-0.5">
                        {job.location}
                      </p>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 sm:px-6 py-4">
                  <JobStatusBadge
                    status={job.status}
                    editable
                    onChange={(status) => onStatusChange(job.id, status)}
                  />
                </td>

                {/* Deadline */}
                <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary hidden sm:table-cell">
                  {formatDeadline(job.application_deadline)}
                </td>

                {/* Created */}
                <td className="px-4 sm:px-6 py-4 text-sm text-text-secondary/60 hidden sm:table-cell">
                  {formatDate(job.created_at)}
                </td>

                {/* Actions */}
                <td className="px-4 sm:px-6 py-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(job)
                    }}
                    className="p-2 rounded text-text-secondary hover:text-accent-red hover:bg-accent-red/10 transition-colors cursor-pointer"
                    title="Delete job"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        action="delete"
        entity="job posting"
        title="Delete Job Posting"
        message={deleteTarget ? `Are you sure you want to delete \"${deleteTarget.title}\"?` : undefined}
        confirmLabel="Delete"
        loading={deleteLoading}
        destructive
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

function SortIndicator({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <div className="flex flex-col">
      <ChevronUp
        size={10}
        className={`
          -mb-1
          ${active && direction === 'asc' ? 'text-accent-purple' : 'text-text-secondary/30'}
        `}
      />
      <ChevronDown
        size={10}
        className={`
          ${active && direction === 'desc' ? 'text-accent-purple' : 'text-text-secondary/30'}
        `}
      />
    </div>
  )
}

/**
 * JobsTableMobile Component
 * Card-based view for mobile devices
 */
export function JobsTableMobile({
  jobs,
  onRowClick,
  onStatusChange,
  onDelete,
  loading,
  error,
}: Omit<JobsTableProps, 'sortField' | 'sortDirection' | 'onSort'>) {
  const [deleteTarget, setDeleteTarget] = useState<JobPosting | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    try {
      setDeleteLoading(true)
      await onDelete(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading && jobs.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-accent-purple border-t-transparent animate-spin" />
        <p className="text-sm text-text-secondary mt-3">Loading...</p>
      </div>
    )
  }

  if (error && jobs.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-medium text-accent-red">Failed to load jobs</p>
        <p className="text-xs text-accent-red/80 mt-2">{error}</p>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-text-secondary">No job postings found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="rounded-lg border p-4 bg-theme-card border-theme-border cursor-pointer
            transition-all duration-200 ease-out
            active:scale-[0.99] hover:shadow-md hover:-translate-y-[2px]
            hover:bg-accent-purple/5 dark:hover:bg-accent-purple/10"
          onClick={() => onRowClick(job)}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {job.title}
              </p>
              {job.location && (
                <p className="text-xs text-text-secondary/60 mt-0.5">
                  {job.location}
                </p>
              )}
            </div>
            <JobStatusBadge
              status={job.status}
              editable
              onChange={(status) => onStatusChange(job.id, status)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary/60">
              Created {formatDateShort(job.created_at)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(job)
              }}
              className="p-1.5 rounded text-text-secondary hover:text-accent-red transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      <ConfirmationModal
        isOpen={!!deleteTarget}
        action="delete"
        entity="job posting"
        title="Delete Job Posting"
        message={deleteTarget ? `Are you sure you want to delete \"${deleteTarget.title}\"?` : undefined}
        confirmLabel="Delete"
        loading={deleteLoading}
        destructive
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
