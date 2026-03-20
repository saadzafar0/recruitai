/**
 * Organization Types
 * TypeScript definitions for organization-related data structures
 */

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  website_url?: string | null
  industry?: string | null
  size_range?: string | null
  country?: string | null
  city?: string | null
  ats_provider?: string | null
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationCreate {
  name: string
  slug?: string // Will be auto-generated from name if not provided
  logo_url?: string
  website_url?: string
  industry?: string
  size_range?: string
  country?: string
  city?: string
}

export interface OrganizationUpdate {
  id: string
  name?: string
  slug?: string
  logo_url?: string | null
  website_url?: string | null
  industry?: string | null
  size_range?: string | null
  country?: string | null
  city?: string | null
}

// Industry options
export const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Media & Entertainment',
  'Real Estate',
  'Transportation',
  'Energy',
  'Telecommunications',
  'Government',
  'Non-Profit',
  'Other',
] as const

// Company size options
export const SIZE_RANGES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+',
] as const

export type Industry = typeof INDUSTRIES[number]
export type SizeRange = typeof SIZE_RANGES[number]
