'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { ToastContainer, ToastType } from '@/components/ui/toast'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const showSuccess = useCallback((message: string) => {
    showToast('success', message)
  }, [showToast])

  const showError = useCallback((message: string) => {
    showToast('error', message)
  }, [showToast])

  const showInfo = useCallback((message: string) => {
    showToast('info', message)
  }, [showToast])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
