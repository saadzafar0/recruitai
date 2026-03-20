/**
 * ConfirmationModal Component
 * Reusable confirmation dialog for destructive and non-destructive actions
 */

import { AlertTriangle, X } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  action: string
  entity: string
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  destructive?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export function ConfirmationModal({
  isOpen,
  action,
  entity,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  loading = false,
  destructive = true,
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  if (!isOpen) return null

  const normalizedAction = action.trim().toLowerCase()
  const computedTitle = title || `${normalizedAction.charAt(0).toUpperCase()}${normalizedAction.slice(1)} ${entity}`
  const computedMessage = message || `Are you sure you want to ${normalizedAction} this ${entity}?`
  const computedConfirmLabel = confirmLabel || `${normalizedAction.charAt(0).toUpperCase()}${normalizedAction.slice(1)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60">
      <div className="w-full max-w-md rounded-xl border bg-theme-card border-theme-border shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          aria-label="Close confirmation modal"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 mb-4 pr-8">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-accent-red/10 text-accent-red flex-shrink-0">
            <AlertTriangle size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">{computedTitle}</h3>
            <p className="text-sm text-text-secondary mt-1">{computedMessage}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-theme-border text-text-secondary hover:text-text-primary hover:bg-theme-elevated disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer ${
              destructive
                ? 'bg-accent-red hover:bg-red-500'
                : 'bg-accent-purple hover:bg-accent-purple-hover'
            }`}
          >
            {computedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
