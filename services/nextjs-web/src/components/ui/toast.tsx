'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps {
  id: string
  type: ToastType
  message: string
  onClose: (id: string) => void
  duration?: number
}

const toastStyles: Record<ToastType, { icon: typeof CheckCircle; className: string }> = {
  success: {
    icon: CheckCircle,
    className: 'text-accent-green border-accent-green/20',
  },
  error: {
    icon: AlertCircle,
    className: 'text-accent-red border-accent-red/20',
  },
  info: {
    icon: Info,
    className: 'text-accent-purple border-accent-purple/20',
  },
}

export function Toast({ id, type, message, onClose, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const config = toastStyles[type]
  const Icon = config.icon

  useEffect(() => {
    const enterTimer = setTimeout(() => setIsVisible(true), 10)
    const dismissTimer = setTimeout(() => handleClose(), duration)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(dismissTimer)
    }
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => onClose(id), 300)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border max-w-sm',
        'bg-theme-card shadow-theme-elevated',
        'transition-all duration-300 ease-out',
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        config.className
      )}
    >
      <Icon size={18} className="flex-shrink-0" />
      <p className="text-sm flex-1 text-text-primary">{message}</p>
      <button
        onClick={handleClose}
        className="p-1 rounded cursor-pointer text-text-secondary hover:text-text-primary transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export interface ToastContainerProps {
  toasts: Array<{ id: string; type: ToastType; message: string }>
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 flex flex-col gap-3',
        toasts.length > 0 ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  )
}
