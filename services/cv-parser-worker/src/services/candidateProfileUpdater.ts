import type { CvParserProvider, ParsedCandidateCvData } from './geminiParser'
import { supabaseAdmin } from './supabase'

export interface CandidateProfileUpdateInput {
  candidateProfileId: string
  applicantId?: string
  applicationId?: string
  cvFileUrl: string
  cvFileName?: string
  rawCvText: string
  parsed: ParsedCandidateCvData
  providerUsed: CvParserProvider
}

function splitFullName(fullName: string): { firstName?: string; lastName?: string } {
  const normalized = fullName.trim().replace(/\s+/g, ' ')
  if (!normalized) {
    return {}
  }

  const parts = normalized.split(' ')
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

export async function updateCandidateProfileFromCvParse(
  input: CandidateProfileUpdateInput,
): Promise<void> {
  const parseVersionRaw = Number(process.env.CV_PARSER_VERSION || '1')
  const parseVersion = Number.isFinite(parseVersionRaw) ? parseVersionRaw : 1

  const { error: candidateProfileError } = await supabaseAdmin
    .from('candidate_profiles')
    .update({
      headline: input.parsed.name || null,
      summary: input.parsed.summary,
      raw_cv_text: input.rawCvText,
      cv_file_url: input.cvFileUrl,
      cv_file_name: input.cvFileName || null,
      cv_parsed_at: new Date().toISOString(),
      parse_version: parseVersion,
      skills_raw: input.parsed.topTechnicalSkills,
    })
    .eq('id', input.candidateProfileId)

  if (candidateProfileError) {
    throw new Error(`Failed to update candidate_profiles: ${candidateProfileError.message}`)
  }

  const { error: deleteSkillsError } = await supabaseAdmin
    .from('candidate_skills')
    .delete()
    .eq('profile_id', input.candidateProfileId)
    .eq('source', 'cv')

  if (deleteSkillsError) {
    throw new Error(`Failed to reset candidate_skills: ${deleteSkillsError.message}`)
  }

  if (input.parsed.topTechnicalSkills.length > 0) {
    const skillRows = input.parsed.topTechnicalSkills.map((skill) => ({
      profile_id: input.candidateProfileId,
      skill_name: skill,
      category: 'technical',
      source: 'cv',
    }))

    const { error: insertSkillsError } = await supabaseAdmin
      .from('candidate_skills')
      .insert(skillRows)

    if (insertSkillsError) {
      throw new Error(`Failed to insert candidate_skills: ${insertSkillsError.message}`)
    }
  }

  if (input.applicantId) {
    const { firstName, lastName } = splitFullName(input.parsed.name)
    const profilePatch: Record<string, string> = {}

    if (firstName) {
      profilePatch.first_name = firstName
    }

    if (lastName) {
      profilePatch.last_name = lastName
    }

    if (input.parsed.email) {
      profilePatch.email = input.parsed.email
    }

    if (Object.keys(profilePatch).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profilePatch)
        .eq('id', input.applicantId)

      if (profileError) {
        console.warn(
          `[cv-parser-worker] Unable to update profile identity snapshot for applicant ${input.applicantId}: ${profileError.message}`,
        )
      }
    }
  }

  if (input.applicationId) {
    const { error: applicationStatusError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'cv_screening',
      })
      .eq('id', input.applicationId)

    if (applicationStatusError) {
      console.warn(
        `[cv-parser-worker] Unable to update application status to cv_screening for ${input.applicationId}: ${applicationStatusError.message}`,
      )
    }
  }

  console.info(
    `[cv-parser-worker] Updated candidate profile ${input.candidateProfileId} with provider ${input.providerUsed}`,
  )
}
