/**
 * useOrganization Hook
 * Manages recruiter organizations list and CRUD operations
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import type { Organization, OrganizationCreate, OrganizationUpdate } from '@/types/organization'

export interface UseOrganizationReturn {
  organization: Organization | null
  organizations: Organization[]
  loading: boolean
  error: string | null
  hasOrganization: boolean
  fetchOrganizations: () => Promise<void>
  createOrganization: (data: OrganizationCreate) => Promise<Organization | null>
  updateOrganization: (data: OrganizationUpdate) => Promise<Organization | null>
  deleteOrganization: () => Promise<boolean>
}

export function useOrganization(): UseOrganizationReturn {
  const { session } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const organization = useMemo(() => organizations[0] || null, [organizations])

  const getAuthHeaders = useCallback(() => {
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    }
  }, [session])

  const fetchOrganizations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/organization/list', {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch organization')
      }

      const data: Organization[] = await response.json()
      setOrganizations(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch organizations'
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
      setOrganizations((prev) => [newOrg, ...prev.filter((org) => org.id !== newOrg.id)])
      return newOrg
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create organization'
      setError(message)
      return null
    }
  }, [getAuthHeaders])

  const updateOrganization = useCallback(async (data: OrganizationUpdate): Promise<Organization | null> => {
    setError(null)

    try {
      const response = await fetch(`/api/v1/organization/${data.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update organization')
      }

      const updatedOrg: Organization = await response.json()
      setOrganizations((prev) => prev.map((org) => (org.id === updatedOrg.id ? updatedOrg : org)))
      return updatedOrg
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update organization'
      setError(message)
      return null
    }
  }, [organization, getAuthHeaders])

  const deleteOrganization = useCallback(async (): Promise<boolean> => {
    setError(null)

    try {
      const targetId = organization?.id
      if (!targetId) {
        setError('No organization to delete')
        return false
      }

      const response = await fetch(`/api/v1/organization/${targetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete organization')
      }

      setOrganizations((prev) => prev.filter((org) => org.id !== targetId))
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
      fetchOrganizations()
    }
  }, [session?.access_token]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    organization,
    loading,
    error,
    organizations,
    hasOrganization: organizations.length > 0,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  }
}
