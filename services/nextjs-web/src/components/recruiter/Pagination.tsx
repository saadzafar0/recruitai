/**
 * Pagination Component
 * Pagination controls for tables
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const startItem = (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []

    if (totalPages <= 7) {
      // Show all pages if 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show first, last, and pages around current
      if (page <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages)
      }
    }

    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Info text */}
      <p className="text-sm text-text-secondary">
        Showing <span className="font-medium text-text-primary">{startItem}</span> to{' '}
        <span className="font-medium text-text-primary">{endItem}</span> of{' '}
        <span className="font-medium text-text-primary">{total}</span> results
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-theme-border text-text-secondary
            hover:bg-theme-elevated hover:text-text-primary
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
            transition-colors cursor-pointer"
          title="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((pageNum, idx) => (
          pageNum === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-text-secondary">
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`
                min-w-[32px] h-8 px-2 text-sm rounded-lg border transition-colors cursor-pointer
                ${page === pageNum
                  ? 'bg-accent-purple border-accent-purple text-white'
                  : 'border-theme-border text-text-secondary hover:bg-theme-elevated hover:text-text-primary'
                }
              `}
            >
              {pageNum}
            </button>
          )
        ))}

        {/* Next button */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-theme-border text-text-secondary
            hover:bg-theme-elevated hover:text-text-primary
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
            transition-colors cursor-pointer"
          title="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

/**
 * PaginationMobile Component
 * Simplified pagination for mobile
 */
export function PaginationMobile({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-sm rounded border border-theme-border text-text-secondary
          hover:bg-theme-elevated
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors cursor-pointer"
      >
        Previous
      </button>

      <span className="text-sm text-text-secondary">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-sm rounded border border-theme-border text-text-secondary
          hover:bg-theme-elevated
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors cursor-pointer"
      >
        Next
      </button>
    </div>
  )
}
