/**
 * Job Posting Types
 * Types for job posting API and frontend
 */

export type JobStatus = 'draft' | 'published' | 'paused' | 'closed'

export type EmploymentType = 'full_time' | 'part_time' | 'internship' | 'contract'

export type WorkMode = 'onsite' | 'remote' | 'hybrid'

export interface JobPosting {
  id: string
  organization_id: string
  created_by: string
  title: string
  slug?: string
  description: string
  responsibilities?: string
  requirements?: string
  benefits?: string
  employment_type: EmploymentType
  work_mode: WorkMode
  location?: string
  experience_min_years: number
  experience_max_years?: number
  salary_min?: number
  salary_max?: number
  salary_currency: string
  application_deadline?: string
  openings_count: number
  cv_parsing_enabled: boolean
  voice_interview_enabled: boolean
  coding_assessment_enabled: boolean
  system_design_enabled: boolean
  weight_cv: number
  weight_voice: number
  weight_coding: number
  weight_system_design: number
  status: JobStatus
  published_at?: string
  closed_at?: string
  created_at: string
  updated_at: string
  // Computed/joined fields
  skills?: string[]
  applications_count?: number
}

export interface JobPostingCreate {
  title: string
  description: string
  responsibilities?: string
  requirements?: string
  benefits?: string
  employment_type?: EmploymentType
  work_mode?: WorkMode
  location?: string
  experience_min_years?: number
  experience_max_years?: number
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  application_deadline?: string
  openings_count?: number
  cv_parsing_enabled?: boolean
  voice_interview_enabled?: boolean
  coding_assessment_enabled?: boolean
  system_design_enabled?: boolean
  weight_cv?: number
  weight_voice?: number
  weight_coding?: number
  weight_system_design?: number
  status?: JobStatus
  skills?: string[]
}

export interface JobPostingUpdate extends Partial<JobPostingCreate> {
  id: string
  published_at?: string
  closed_at?: string
}

export interface JobPostingsFilter {
  status?: JobStatus | JobStatus[]
  search?: string
  employment_type?: EmploymentType
  work_mode?: WorkMode
  created_after?: string
  created_before?: string
}

export interface JobPostingsSort {
  field: 'title' | 'status' | 'created_at' | 'applications_count' | 'application_deadline'
  direction: 'asc' | 'desc'
}

export interface JobPostingsQuery {
  filter?: JobPostingsFilter
  sort?: JobPostingsSort
  page?: number
  limit?: number
}

export interface JobPostingsResponse {
  jobs: JobPosting[]
  total: number
  page: number
  limit: number
  totalPages: number
}
