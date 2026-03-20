/**
 * useOrganization Hook
 * Manages organization state and operations for recruiters
 */

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { Organization, OrganizationCreate, OrganizationUpdate } from '@/types/organization'

let organizationCache: Organization | null = null
let hasOrganizationCache = false

export interface UseOrganizationReturn {
  organization: Organization | null
  loading: boolean
  error: string | null
  hasOrganization: boolean
  fetchOrganization: () => Promise<void>
  createOrganization: (data: OrganizationCreate) => Promise<Organization | null>
  updateOrganization: (data: OrganizationUpdate) => Promise<Organization | null>
  deleteOrganization: () => Promise<boolean>
}

export function useOrganization(): UseOrganizationReturn {
  const { session } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(hasOrganizationCache ? organizationCache : null)
  const [loading, setLoading] = useState(!hasOrganizationCache)
  const [error, setError] = useState<string | null>(null)

  const getAuthHeaders = useCallback(() => {
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    }
  }, [session])

  const fetchOrganization = useCallback(async () => {
    setLoading(!hasOrganizationCache)
    setError(null)

    try {
      const response = await fetch('/api/v1/organization', {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch organization')
      }

      const data = await response.json()
      setOrganization(data)
      organizationCache = data
      hasOrganizationCache = true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch organization'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  const createOrganization = useCallback(async (data: OrganizationCreate): Promise<Organization | null> => {
    setError(null)

    try {
      const response = await fetch('/api/v1/organization', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create organization')
      }

      const newOrg: Organization = await response.json()
      setOrganization(newOrg)
      organizationCache = newOrg
      hasOrganizationCache = true
      return newOrg
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create organization'
      setError(message)
      return null
    }
  }, [getAuthHeaders])

  const updateOrganization = useCallback(async (data: OrganizationUpdate): Promise<Organization | null> => {
    if (!organization) {
      setError('No organization to update')
      return null
    }

    setError(null)

    try {
      const response = await fetch(`/api/v1/organization/${organization.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update organization')
      }

      const updatedOrg: Organization = await response.json()
      setOrganization(updatedOrg)
      organizationCache = updatedOrg
      hasOrganizationCache = true
      return updatedOrg
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update organization'
      setError(message)
      return null
    }
  }, [organization, getAuthHeaders])

  const deleteOrganization = useCallback(async (): Promise<boolean> => {
    if (!organization) {
      setError('No organization to delete')
      return false
    }

    setError(null)

    try {
      const response = await fetch(`/api/v1/organization/${organization.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete organization')
      }

      setOrganization(null)
      organizationCache = null
      hasOrganizationCache = true
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete organization'
      setError(message)
      return false
    }
  }, [organization, getAuthHeaders])

  // Auto-fetch on mount if session is available
  useEffect(() => {
    if (session?.access_token) {
      fetchOrganization()
    }
  }, [session?.access_token]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    organization,
    loading,
    error,
    hasOrganization: !!organization,
    fetchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  }
}
