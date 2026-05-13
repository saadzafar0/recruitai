export interface RecruiterCandidateProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
}

export interface RecruiterCandidateProfileData {
  id: string
  applicant_id: string
  headline: string | null
  summary: string | null
  total_experience_months: number | null
  highest_degree: string | null
  university: string | null
  graduation_year: number | null
  skills_raw: string[] | null
  cv_file_url: string | null
  cv_file_name: string | null
  cv_parsed_at: string | null
}

export interface RecruiterCandidateSkill {
  id: string
  skill_name: string
  proficiency: string | null
  years_used: number | null
}

export interface RecruiterCandidateEducation {
  id: string
  institution: string
  degree: string | null
  field_of_study: string | null
  gpa: number | null
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
}

export interface RecruiterCandidateExperience {
  id: string
  company: string
  title: string
  location: string | null
  employment_type: string | null
  start_date: string | null
  end_date: string | null
  is_current: boolean | null
  description: string | null
}

export interface RecruiterCandidateApplication {
  id: string
  status: string
  created_at: string
  cv_score: number | null
  voice_score: number | null
  coding_score: number | null
  system_design_score: number | null
  composite_score: number | null
  job: {
    id: string
    title: string
    organization: {
      name: string | null
    } | null
  } | null
}

export interface RecruiterCandidateDetail {
  profile: RecruiterCandidateProfile
  candidateProfile: RecruiterCandidateProfileData | null
  skills: RecruiterCandidateSkill[]
  education: RecruiterCandidateEducation[]
  experience: RecruiterCandidateExperience[]
  application: RecruiterCandidateApplication | null
}
