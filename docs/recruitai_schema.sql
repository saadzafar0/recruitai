-- =============================================================================
--  RecruitAI — Complete Supabase Database Schema
--  Group 11 · NUCES FAST Lahore · Applied HCI
-- =============================================================================
--  Run this script once inside the Supabase SQL Editor (or via psql).
--  Order matters — dependencies are respected throughout.
--  Row-Level Security (RLS) policies are defined at the bottom of each section.
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- for fuzzy skill/name search

-- =============================================================================
--  SECTION 0 · CUSTOM TYPES (ENUMS)
-- =============================================================================

CREATE TYPE user_role AS ENUM (
  'applicant',       -- job seeker
  'recruiter',       -- HR / talent acquisition
  'interviewer',     -- technical interviewer
  'hr_ops',          -- HR operations / IT / compliance
  'admin'            -- platform super-admin
);

CREATE TYPE application_status AS ENUM (
  'draft',                  -- applicant started but not submitted
  'submitted',              -- submitted, awaiting CV parse
  'cv_screening',           -- CV being parsed / scored
  'cv_rejected',            -- rejected at CV stage
  'voice_interview',        -- invited to / in voice interview
  'voice_rejected',         -- rejected after voice interview
  'coding_assessment',      -- invited to / in coding round
  'coding_rejected',        -- rejected after coding round
  'system_design',          -- invited to / in system design round
  'system_design_rejected', -- rejected after system design
  'hr_review',              -- passed AI stages, awaiting HR review
  'shortlisted',            -- HR shortlisted for human interview
  'human_interview',        -- booked for human interview
  'offer_pending',          -- offer being prepared
  'offer_extended',         -- offer sent
  'offer_accepted',         -- candidate accepted
  'offer_declined',         -- candidate declined
  'hired',                  -- hired and onboarded
  'withdrawn'               -- candidate withdrew
);

CREATE TYPE interview_session_status AS ENUM (
  'scheduled', 'in_progress', 'completed', 'expired', 'cancelled'
);

CREATE TYPE coding_language AS ENUM (
  'python', 'javascript', 'typescript', 'java', 'cpp', 'c',
  'go', 'rust', 'kotlin', 'swift', 'php', 'ruby', 'csharp', 'scala'
);

CREATE TYPE difficulty AS ENUM ('easy', 'medium', 'hard');

CREATE TYPE submission_verdict AS ENUM (
  'accepted', 'wrong_answer', 'time_limit_exceeded',
  'memory_limit_exceeded', 'runtime_error', 'compilation_error', 'pending'
);

CREATE TYPE notification_type AS ENUM (
  'application_update', 'interview_invite', 'assessment_invite',
  'score_ready', 'offer', 'feedback_available', 'reminder',
  'system', 'ats_sync'
);

CREATE TYPE audit_action AS ENUM (
  'create', 'update', 'delete', 'view', 'login', 'logout',
  'score_generate', 'shortlist', 'data_export', 'data_delete'
);

CREATE TYPE fairness_flag AS ENUM ('none', 'low', 'medium', 'high');

-- =============================================================================
--  SECTION 1 · ORGANIZATIONS & USERS
-- =============================================================================

-- 1.1 Organizations (companies using the platform)
CREATE TABLE organizations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,             -- e.g. "nuces-fast"
  logo_url            TEXT,
  website_url         TEXT,
  industry            TEXT,
  size_range          TEXT,                             -- "1-10", "50-200", etc.
  country             TEXT DEFAULT 'PK',
  city                TEXT,
  ats_provider        TEXT,                             -- "greenhouse", "lever", etc.
  is_verified         BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 User Profiles (extends Supabase auth.users)
--     One row per auth user. Role-specific info lives in sub-tables.
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                user_role NOT NULL DEFAULT 'applicant',
  organization_id     UUID REFERENCES organizations(id) ON DELETE SET NULL,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT,
  avatar_url          TEXT,
  timezone            TEXT DEFAULT 'Asia/Karachi',
  preferred_language  TEXT DEFAULT 'en',
  linkedin_url        TEXT,
  github_url          TEXT,
  portfolio_url       TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  last_seen_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Organization Members (recruiters / interviewers linked to orgs)
CREATE TABLE organization_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role            user_role NOT NULL,
  department      TEXT,
  job_title       TEXT,
  permissions     JSONB DEFAULT '{}',   -- granular permission overrides
  invited_by      UUID REFERENCES profiles(id),
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- =============================================================================
--  SECTION 2 · JOB POSTINGS
-- =============================================================================

-- 2.1 Job Postings
CREATE TABLE job_postings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by            UUID NOT NULL REFERENCES profiles(id),
  title                 TEXT NOT NULL,
  slug                  TEXT,
  description           TEXT NOT NULL,
  responsibilities      TEXT,
  requirements          TEXT,
  benefits              TEXT,
  employment_type       TEXT DEFAULT 'full_time', -- full_time / part_time / internship / contract
  work_mode             TEXT DEFAULT 'onsite',    -- onsite / remote / hybrid
  location              TEXT,
  experience_min_years  NUMERIC(4,1) DEFAULT 0,
  experience_max_years  NUMERIC(4,1),
  salary_min            NUMERIC(12,2),
  salary_max            NUMERIC(12,2),
  salary_currency       TEXT DEFAULT 'PKR',
  application_deadline  DATE,
  openings_count        INT DEFAULT 1,
  -- AI assessment configuration
  cv_parsing_enabled    BOOLEAN DEFAULT TRUE,
  voice_interview_enabled    BOOLEAN DEFAULT TRUE,
  coding_assessment_enabled  BOOLEAN DEFAULT TRUE,
  system_design_enabled      BOOLEAN DEFAULT FALSE,
  -- Pipeline weights (must sum to 100)
  weight_cv             NUMERIC(5,2) DEFAULT 25,
  weight_voice          NUMERIC(5,2) DEFAULT 35,
  weight_coding         NUMERIC(5,2) DEFAULT 30,
  weight_system_design  NUMERIC(5,2) DEFAULT 10,
  -- Status
  status                TEXT DEFAULT 'draft',  -- draft / published / paused / closed
  published_at          TIMESTAMPTZ,
  closed_at             TIMESTAMPTZ,
  ats_job_id            TEXT,                   -- external ATS job ID
  views_count           INT DEFAULT 0,
  applications_count    INT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Required Skills per Job
CREATE TABLE job_skills (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  skill_name      TEXT NOT NULL,
  is_mandatory    BOOLEAN DEFAULT FALSE,
  proficiency     TEXT DEFAULT 'intermediate',  -- beginner/intermediate/expert
  weight          NUMERIC(5,2) DEFAULT 1.0,
  UNIQUE(job_id, skill_name)
);

-- 2.3 Job Tags (e.g. "AI", "Backend", "Remote-friendly")
CREATE TABLE job_tags (
  id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id  UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  tag     TEXT NOT NULL,
  UNIQUE(job_id, tag)
);

-- =============================================================================
--  SECTION 3 · APPLICATIONS
-- =============================================================================

-- 3.1 Core Application Record
CREATE TABLE applications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id                UUID NOT NULL REFERENCES job_postings(id) ON DELETE RESTRICT,
  applicant_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status                application_status DEFAULT 'draft',
  -- Scores (0–100, populated as stages complete)
  cv_score              NUMERIC(5,2),
  voice_score           NUMERIC(5,2),
  coding_score          NUMERIC(5,2),
  system_design_score   NUMERIC(5,2),
  composite_score       NUMERIC(5,2),          -- weighted composite
  rank                  INT,                   -- rank within this job's applicant pool
  -- HR fields
  shortlisted_by        UUID REFERENCES profiles(id),
  shortlisted_at        TIMESTAMPTZ,
  hr_notes              TEXT,
  rejection_reason      TEXT,
  offer_sent_at         TIMESTAMPTZ,
  offer_expires_at      TIMESTAMPTZ,
  -- Fairness
  fairness_flag         fairness_flag DEFAULT 'none',
  fairness_notes        TEXT,
  -- Metadata
  cover_letter          TEXT,
  referral_source       TEXT,
  ats_application_id    TEXT,
  submitted_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

-- 3.2 Application Pipeline Audit Log
--     Every status transition is logged here for compliance.
CREATE TABLE application_status_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status     application_status,
  to_status       application_status NOT NULL,
  changed_by      UUID REFERENCES profiles(id),  -- NULL = AI transition
  reason          TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
--  SECTION 4 · CV / RESUME PARSING
-- =============================================================================

-- 4.1 Candidate Profile (structured CV data — parsed from uploaded resume)
CREATE TABLE candidate_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  -- Personal snapshot from CV (may differ from profile)
  headline              TEXT,                 -- e.g. "Full-Stack Developer | 3 YOE"
  summary               TEXT,
  raw_cv_text           TEXT,                 -- raw extracted text
  cv_file_url           TEXT,                 -- S3 URL (or file storage URL)
  cv_file_name          TEXT,
  cv_parsed_at          TIMESTAMPTZ,
  parse_version         INT DEFAULT 1,        -- parser model version
  -- Aggregate signals
  total_experience_months INT DEFAULT 0,
  highest_degree        TEXT,
  gpa                   NUMERIC(4,2),
  university            TEXT,
  graduation_year       INT,
  -- Skills extracted (also stored relationally in candidate_skills)
  skills_raw            TEXT[],               -- flat array for quick search
  languages_spoken      TEXT[],
  -- Quality signals for scoring
  cv_completeness_score NUMERIC(5,2),         -- 0–100, how complete the CV is
  keyword_match_score   NUMERIC(5,2),         -- against job description
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Education History
CREATE TABLE candidate_education (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  institution     TEXT NOT NULL,
  degree          TEXT,                -- BS, MS, PhD, etc.
  field_of_study  TEXT,
  gpa             NUMERIC(4,2),
  start_date      DATE,
  end_date        DATE,
  is_current      BOOLEAN DEFAULT FALSE,
  achievements    TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 Work Experience
CREATE TABLE candidate_experience (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  company         TEXT NOT NULL,
  title           TEXT NOT NULL,
  location        TEXT,
  employment_type TEXT,
  start_date      DATE,
  end_date        DATE,
  is_current      BOOLEAN DEFAULT FALSE,
  description     TEXT,
  achievements    TEXT[],
  skills_used     TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4.4 Skills (structured, normalized)
CREATE TABLE candidate_skills (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  skill_name      TEXT NOT NULL,
  category        TEXT,                -- e.g. "language", "framework", "tool", "soft"
  proficiency     TEXT,                -- beginner / intermediate / expert
  years_used      NUMERIC(4,1),
  is_verified     BOOLEAN DEFAULT FALSE,  -- verified via coding/voice performance
  source          TEXT DEFAULT 'cv',      -- cv / assessment / interview
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, skill_name)
);

-- 4.5 Projects
CREATE TABLE candidate_projects (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  tech_stack      TEXT[],
  url             TEXT,
  repo_url        TEXT,
  start_date      DATE,
  end_date        DATE,
  is_ongoing      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4.6 Certifications
CREATE TABLE candidate_certifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  issuer          TEXT,
  issue_date      DATE,
  expiry_date     DATE,
  credential_url  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
--  SECTION 5 · VOICE-BASED INTERVIEW
-- =============================================================================

-- 5.1 Question Bank
CREATE TABLE interview_questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL = global
  category        TEXT NOT NULL,  -- behavioral / technical / hr / culture-fit
  sub_category    TEXT,           -- e.g. "problem-solving", "leadership"
  difficulty      difficulty DEFAULT 'medium',
  question_text   TEXT NOT NULL,
  follow_up_prompts TEXT[],       -- adaptive follow-up questions the AI may ask
  ideal_answer_notes TEXT,        -- rubric notes for scoring
  max_duration_seconds INT DEFAULT 120,
  is_active       BOOLEAN DEFAULT TRUE,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5.2 Job–Question Mapping (which questions to ask for a job)
CREATE TABLE job_interview_questions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  UNIQUE(job_id, question_id)
);

-- 5.3 Interview Sessions (one per application's voice round)
CREATE TABLE interview_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  session_token       TEXT UNIQUE,             -- shareable secure link token
  status              interview_session_status DEFAULT 'scheduled',
  scheduled_at        TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,             -- link expiry
  duration_seconds    INT,                     -- actual elapsed time
  invite_sent_at      TIMESTAMPTZ,
  reminder_sent_at    TIMESTAMPTZ,
  device_info         JSONB DEFAULT '{}',      -- browser, OS, mic quality
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 5.4 Interview Responses (one per question per session)
CREATE TABLE interview_responses (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id          UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id         UUID NOT NULL REFERENCES interview_questions(id),
  order_index         INT NOT NULL,
  audio_duration_seconds INT,
  transcript          TEXT,                    -- speech-to-text output
  transcript_confidence NUMERIC(5,4),          -- STT confidence score 0–1
  word_count          INT,
  filler_word_count   INT,                     -- "um", "uh" etc.
  -- AI Dimension Scores (each 0–10)
  score_relevance     NUMERIC(4,2),
  score_clarity       NUMERIC(4,2),
  score_depth         NUMERIC(4,2),
  score_communication NUMERIC(4,2),
  score_confidence    NUMERIC(4,2),
  ai_feedback         TEXT,                    -- per-question AI feedback
  processing_status   TEXT DEFAULT 'pending',  -- pending / processing / done / failed
  processed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 5.5 Voice Interview Score Summary (per session)
CREATE TABLE voice_interview_scores (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id              UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE UNIQUE,
  application_id          UUID NOT NULL REFERENCES applications(id),
  -- Dimension averages (0–10)
  avg_relevance           NUMERIC(4,2),
  avg_clarity             NUMERIC(4,2),
  avg_depth               NUMERIC(4,2),
  avg_communication       NUMERIC(4,2),
  avg_confidence          NUMERIC(4,2),
  -- Composite
  total_score             NUMERIC(5,2),        -- 0–100
  scoring_model_version   TEXT,
  ai_summary              TEXT,                -- narrative summary for HR
  strengths               TEXT[],
  weaknesses              TEXT[],
  recommendation          TEXT,                -- "strong_pass" / "pass" / "borderline" / "fail"
  scored_at               TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by_human       BOOLEAN DEFAULT FALSE,
  human_reviewer_id       UUID REFERENCES profiles(id),
  human_review_notes      TEXT,
  human_review_at         TIMESTAMPTZ
);

-- =============================================================================
--  SECTION 6 · CODING ASSESSMENT
-- =============================================================================

-- 6.1 Coding Problem Bank
CREATE TABLE coding_problems (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  slug                TEXT UNIQUE,
  description         TEXT NOT NULL,          -- Markdown with problem statement
  difficulty          difficulty NOT NULL,
  topic_tags          TEXT[],                 -- DSA / DP / Graph / etc.
  supported_languages coding_language[],
  time_limit_ms       INT DEFAULT 2000,
  memory_limit_mb     INT DEFAULT 256,
  max_score           INT DEFAULT 100,
  -- Sample I/O shown to candidate
  sample_input        TEXT,
  sample_output       TEXT,
  explanation         TEXT,
  -- Internal hints for AI scoring
  optimal_complexity  TEXT,                   -- e.g. "O(n log n)"
  editorial_notes     TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  is_plagiarism_check_enabled BOOLEAN DEFAULT TRUE,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 Test Cases (hidden, used for evaluation)
CREATE TABLE coding_test_cases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id      UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
  input           TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample       BOOLEAN DEFAULT FALSE,
  is_hidden       BOOLEAN DEFAULT TRUE,
  weight          NUMERIC(5,2) DEFAULT 1.0,   -- weighted scoring per test case
  explanation     TEXT,
  order_index     INT NOT NULL
);

-- 6.3 Job–Problem Mapping
CREATE TABLE job_coding_problems (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  problem_id  UUID NOT NULL REFERENCES coding_problems(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  UNIQUE(job_id, problem_id)
);

-- 6.4 Coding Assessment Instance (one per application's coding round)
CREATE TABLE coding_assessments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id        UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  session_token         TEXT UNIQUE,
  status                TEXT DEFAULT 'scheduled',  -- scheduled / in_progress / submitted / expired / scored
  scheduled_at          TIMESTAMPTZ,
  started_at            TIMESTAMPTZ,
  submitted_at          TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ,
  time_allowed_minutes  INT DEFAULT 90,
  time_used_minutes     INT,
  invite_sent_at        TIMESTAMPTZ,
  device_info           JSONB DEFAULT '{}',
  environment_snapshot  JSONB DEFAULT '{}',        -- browser, tab-switch count, etc.
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 6.5 Code Submissions (one per problem per assessment)
CREATE TABLE coding_submissions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id       UUID NOT NULL REFERENCES coding_assessments(id) ON DELETE CASCADE,
  problem_id          UUID NOT NULL REFERENCES coding_problems(id),
  attempt_number      INT DEFAULT 1,
  language            coding_language NOT NULL,
  source_code         TEXT NOT NULL,
  -- Auto-grading results
  verdict             submission_verdict DEFAULT 'pending',
  test_cases_total    INT,
  test_cases_passed   INT,
  test_cases_failed   INT,
  runtime_ms          INT,
  memory_used_mb      NUMERIC(8,2),
  -- AI quality analysis (beyond correctness)
  score_correctness   NUMERIC(5,2),            -- 0–100 based on test pass rate
  score_efficiency    NUMERIC(5,2),            -- time/space complexity analysis
  score_code_quality  NUMERIC(5,2),            -- readability, naming, structure
  score_best_practices NUMERIC(5,2),           -- language-specific patterns
  ai_feedback         TEXT,                    -- per-submission narrative feedback
  plagiarism_score    NUMERIC(5,2),            -- 0 = unique, 100 = exact match
  plagiarism_flag     BOOLEAN DEFAULT FALSE,
  total_score         NUMERIC(5,2),
  is_final            BOOLEAN DEFAULT FALSE,   -- TRUE for the submission that counts
  submitted_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 6.6 Test Case Execution Results
CREATE TABLE coding_test_results (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id   UUID NOT NULL REFERENCES coding_submissions(id) ON DELETE CASCADE,
  test_case_id    UUID NOT NULL REFERENCES coding_test_cases(id),
  passed          BOOLEAN NOT NULL,
  actual_output   TEXT,
  error_message   TEXT
);

-- 6.7 Coding Assessment Score Summary
CREATE TABLE coding_assessment_scores (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id           UUID NOT NULL REFERENCES coding_assessments(id) ON DELETE CASCADE UNIQUE,
  application_id          UUID NOT NULL REFERENCES applications(id),
  total_score             NUMERIC(5,2),            -- 0–100 composite
  problems_attempted      INT DEFAULT 0,
  problems_solved         INT DEFAULT 0,
  avg_correctness         NUMERIC(5,2),
  avg_efficiency          NUMERIC(5,2),
  avg_code_quality        NUMERIC(5,2),
  avg_best_practices      NUMERIC(5,2),
  plagiarism_detected     BOOLEAN DEFAULT FALSE,
  ai_summary              TEXT,
  strengths               TEXT[],
  weaknesses              TEXT[],
  recommendation          TEXT,
  scored_at               TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by_human       BOOLEAN DEFAULT FALSE,
  human_reviewer_id       UUID REFERENCES profiles(id),
  human_review_notes      TEXT,
  human_review_at         TIMESTAMPTZ
);

-- =============================================================================
--  SECTION 7 · SYSTEM DESIGN EVALUATION
-- =============================================================================

-- 7.1 System Design Problem Bank
CREATE TABLE system_design_problems (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  scenario            TEXT NOT NULL,            -- e.g. "Design a URL shortener"
  context             TEXT,                     -- background, constraints given to candidate
  difficulty          difficulty NOT NULL,
  topic_tags          TEXT[],                   -- scalability / databases / caching / etc.
  time_limit_minutes  INT DEFAULT 45,
  evaluation_rubric   JSONB NOT NULL DEFAULT '{}',  -- structured rubric for AI scoring
  is_active           BOOLEAN DEFAULT TRUE,
  created_by          UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 7.2 Job–System Design Mapping
CREATE TABLE job_system_design_problems (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  problem_id  UUID NOT NULL REFERENCES system_design_problems(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  UNIQUE(job_id, problem_id)
);

-- 7.3 System Design Assessment Instance
CREATE TABLE system_design_assessments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  session_token   TEXT UNIQUE,
  status          TEXT DEFAULT 'scheduled',
  scheduled_at    TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  invite_sent_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 7.4 System Design Responses (one per problem per assessment)
CREATE TABLE system_design_responses (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id         UUID NOT NULL REFERENCES system_design_assessments(id) ON DELETE CASCADE,
  problem_id            UUID NOT NULL REFERENCES system_design_problems(id),
  -- Candidate's response (voice, text, or both)
  audio_url             TEXT,                    -- S3 URL (or file storage URL)
  transcript            TEXT,
  diagram_url           TEXT,                    -- drawn diagram upload
  written_response      TEXT,
  duration_seconds      INT,
  -- AI Dimension Scores (0–10)
  score_requirements    NUMERIC(4,2),            -- understood the requirements
  score_scalability     NUMERIC(4,2),            -- addressed scale
  score_architecture    NUMERIC(4,2),            -- component choices
  score_trade_offs      NUMERIC(4,2),            -- articulated trade-offs
  score_communication   NUMERIC(4,2),            -- clarity of explanation
  ai_feedback           TEXT,
  total_score           NUMERIC(5,2),
  scored_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 7.5 System Design Score Summary
CREATE TABLE system_design_scores (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id         UUID NOT NULL REFERENCES system_design_assessments(id) ON DELETE CASCADE UNIQUE,
  application_id        UUID NOT NULL REFERENCES applications(id),
  total_score           NUMERIC(5,2),
  avg_requirements      NUMERIC(4,2),
  avg_scalability       NUMERIC(4,2),
  avg_architecture      NUMERIC(4,2),
  avg_trade_offs        NUMERIC(4,2),
  avg_communication     NUMERIC(4,2),
  ai_summary            TEXT,
  strengths             TEXT[],
  weaknesses            TEXT[],
  recommendation        TEXT,
  scored_at             TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by_human     BOOLEAN DEFAULT FALSE,
  human_reviewer_id     UUID REFERENCES profiles(id),
  human_review_notes    TEXT,
  human_review_at       TIMESTAMPTZ
);

-- =============================================================================
--  SECTION 8 · COMPOSITE SCORING & RANKING
-- =============================================================================

-- 8.1 Composite Score Card (full transparent breakdown per application)
--     This is what HR sees on the dashboard — the main "score card".
CREATE TABLE candidate_score_cards (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id            UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  -- Stage scores (0–100)
  cv_score                  NUMERIC(5,2),
  cv_completeness           NUMERIC(5,2),
  cv_keyword_match          NUMERIC(5,2),
  cv_experience_relevance   NUMERIC(5,2),
  voice_interview_score     NUMERIC(5,2),
  coding_score              NUMERIC(5,2),
  system_design_score       NUMERIC(5,2),
  -- Weighted composite
  composite_score           NUMERIC(5,2) NOT NULL,
  -- Ranking within this job pool
  rank                      INT,
  percentile                NUMERIC(5,2),         -- e.g. 92.5 = top 7.5%
  -- Flags
  is_recommended            BOOLEAN DEFAULT FALSE,
  recommendation_tier       TEXT,                 -- "strong_yes" / "yes" / "maybe" / "no"
  -- Transparency fields (required by EU AI Act / user research)
  score_explanation         TEXT,                 -- plain English rationale
  score_breakdown_json      JSONB,                -- full machine-readable breakdown
  flags                     JSONB DEFAULT '[]',   -- any alerts (plagiarism, low confidence, etc.)
  scored_at                 TIMESTAMPTZ DEFAULT NOW(),
  last_recalculated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 8.2 Ranking Snapshots (for rank history as new applicants come in)
CREATE TABLE ranking_snapshots (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id            UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  snapshot_at       TIMESTAMPTZ DEFAULT NOW(),
  total_applicants  INT,
  ranked_applicants INT,
  top_score         NUMERIC(5,2),
  avg_score         NUMERIC(5,2),
  median_score      NUMERIC(5,2),
  rankings          JSONB NOT NULL  -- [{application_id, rank, score}, ...]
);

-- =============================================================================
--  SECTION 9 · HR REVIEW & DECISIONS
-- =============================================================================

-- 9.1 Shortlists (HR creates named shortlists for a job)
CREATE TABLE shortlists (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id          UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  name            TEXT NOT NULL DEFAULT 'Shortlist',
  description     TEXT,
  is_final        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 9.2 Shortlist Members
CREATE TABLE shortlist_candidates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shortlist_id    UUID NOT NULL REFERENCES shortlists(id) ON DELETE CASCADE,
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  added_by        UUID REFERENCES profiles(id),
  added_at        TIMESTAMPTZ DEFAULT NOW(),
  hr_notes        TEXT,
  order_index     INT,
  UNIQUE(shortlist_id, application_id)
);

-- 9.3 Human Interview Schedule
CREATE TABLE human_interviews (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  interviewer_id      UUID NOT NULL REFERENCES profiles(id),
  scheduled_at        TIMESTAMPTZ NOT NULL,
  duration_minutes    INT DEFAULT 60,
  meeting_url         TEXT,
  meeting_platform    TEXT,                       -- zoom / teams / google-meet / in-person
  interview_type      TEXT DEFAULT 'technical',   -- technical / hr / culture-fit / final
  status              TEXT DEFAULT 'scheduled',   -- scheduled / completed / no-show / cancelled
  notes_before        TEXT,                       -- interviewer notes before the call
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 9.4 Interviewer Feedback (post-human-interview)
CREATE TABLE interviewer_feedback (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  human_interview_id  UUID NOT NULL REFERENCES human_interviews(id) ON DELETE CASCADE,
  submitted_by        UUID NOT NULL REFERENCES profiles(id),
  -- Scored dimensions (1–5)
  rating_technical    INT CHECK (rating_technical BETWEEN 1 AND 5),
  rating_communication INT CHECK (rating_communication BETWEEN 1 AND 5),
  rating_culture_fit  INT CHECK (rating_culture_fit BETWEEN 1 AND 5),
  rating_problem_solving INT CHECK (rating_problem_solving BETWEEN 1 AND 5),
  overall_rating      INT CHECK (overall_rating BETWEEN 1 AND 5),
  strengths           TEXT,
  weaknesses          TEXT,
  notes               TEXT,
  recommendation      TEXT,                 -- "hire" / "no-hire" / "move-forward" / "hold"
  submitted_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 9.5 Final Hiring Decisions
CREATE TABLE hiring_decisions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE UNIQUE,
  decided_by          UUID NOT NULL REFERENCES profiles(id),
  decision            TEXT NOT NULL,        -- "hire" / "reject" / "hold"
  reason              TEXT,
  offer_details       JSONB DEFAULT '{}',   -- salary, start date, role title, etc.
  decided_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
--  SECTION 10 · CANDIDATE FEEDBACK (Transparency)
-- =============================================================================

-- 10.1 Candidate-Facing Feedback
--      Post-assessment feedback shown to the candidate (required per user research)
CREATE TABLE candidate_feedback (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  stage               TEXT NOT NULL,         -- cv / voice / coding / system_design / final
  overall_message     TEXT NOT NULL,         -- main feedback paragraph
  strengths           TEXT[],
  areas_to_improve    TEXT[],
  resources           JSONB DEFAULT '[]',    -- [{title, url}] learning resources
  score_shown         BOOLEAN DEFAULT TRUE,  -- whether score is disclosed
  is_released         BOOLEAN DEFAULT FALSE, -- HR must approve release
  released_by         UUID REFERENCES profiles(id),
  released_at         TIMESTAMPTZ,
  viewed_by_candidate BOOLEAN DEFAULT FALSE,
  viewed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
--  SECTION 11 · NOTIFICATIONS
-- =============================================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  action_url      TEXT,                  -- deep link
  metadata        JSONB DEFAULT '{}',
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  is_email_sent   BOOLEAN DEFAULT FALSE,
  email_sent_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  email_enabled   BOOLEAN DEFAULT TRUE,
  in_app_enabled  BOOLEAN DEFAULT TRUE,
  -- Per-event granularity
  preferences     JSONB DEFAULT '{
    "application_update": {"email": true,  "in_app": true},
    "interview_invite":   {"email": true,  "in_app": true},
    "assessment_invite":  {"email": true,  "in_app": true},
    "score_ready":        {"email": true,  "in_app": true},
    "feedback_available": {"email": true,  "in_app": true},
    "offer":              {"email": true,  "in_app": true},
    "reminder":           {"email": true,  "in_app": true}
  }',
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
--  SECTION 12 · ATS INTEGRATION
-- =============================================================================

CREATE TABLE ats_integrations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  provider            TEXT NOT NULL,          -- greenhouse / lever / workday / bamboohr / custom
  base_url            TEXT,
  api_key_encrypted   TEXT,                   -- store encrypted; decrypt server-side
  webhook_secret      TEXT,
  sync_enabled        BOOLEAN DEFAULT TRUE,
  sync_interval_mins  INT DEFAULT 60,
  field_mapping       JSONB DEFAULT '{}',     -- RecruitAI field → ATS field
  last_synced_at      TIMESTAMPTZ,
  sync_status         TEXT DEFAULT 'idle',    -- idle / syncing / error
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ats_sync_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id  UUID NOT NULL REFERENCES ats_integrations(id) ON DELETE CASCADE,
  direction       TEXT NOT NULL,          -- push / pull
  entity_type     TEXT NOT NULL,          -- job / application / candidate
  entity_id       UUID,
  ats_entity_id   TEXT,
  status          TEXT NOT NULL,          -- success / failed / partial
  records_synced  INT DEFAULT 0,
  error_message   TEXT,
  payload         JSONB DEFAULT '{}',
  synced_at       TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
--  SECTION 13 · COMPLIANCE & AUDIT
-- =============================================================================

-- 13.1 Full Audit Log (immutable — no UPDATE/DELETE)
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id        UUID REFERENCES profiles(id),   -- NULL = system/AI
  actor_role      user_role,
  action          audit_action NOT NULL,
  entity_type     TEXT NOT NULL,                   -- table name
  entity_id       UUID,
  organization_id UUID REFERENCES organizations(id),
  ip_address      INET,
  user_agent      TEXT,
  changes         JSONB DEFAULT '{}',              -- {field: {from, to}}
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
-- Audit logs should never be mutated — enforce via RLS (no UPDATE/DELETE)

-- 13.2 Data Deletion Requests (GDPR / compliance)
CREATE TABLE data_deletion_requests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id        UUID NOT NULL REFERENCES profiles(id),
  reason              TEXT,
  scope               TEXT NOT NULL,    -- "cv_only" / "all_assessments" / "full_account"
  status              TEXT DEFAULT 'pending',  -- pending / in_progress / completed / rejected
  requested_at        TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by         UUID REFERENCES profiles(id),
  reviewed_at         TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  rejection_reason    TEXT,
  deleted_entities    JSONB DEFAULT '[]'       -- list of what was deleted
);

-- 13.3 Consent Records
CREATE TABLE consent_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type    TEXT NOT NULL,              -- data_processing / ai_interview / audio_recording
  consented       BOOLEAN NOT NULL,
  version         TEXT NOT NULL,              -- policy version
  ip_address      INET,
  consented_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
--  SECTION 14 · PLATFORM ANALYTICS
-- =============================================================================

-- 14.1 Platform Usage Metrics (aggregated, no PII)
CREATE TABLE daily_metrics (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID REFERENCES organizations(id) ON DELETE CASCADE,
  metric_date         DATE NOT NULL,
  new_applications    INT DEFAULT 0,
  completed_interviews INT DEFAULT 0,
  completed_codings   INT DEFAULT 0,
  offers_extended     INT DEFAULT 0,
  hires_made          INT DEFAULT 0,
  avg_composite_score NUMERIC(5,2),
  avg_time_to_score_hours NUMERIC(6,2),
  UNIQUE(organization_id, metric_date)
);

-- =============================================================================
--  SECTION 15 · INDEXES
-- =============================================================================

-- Applications
CREATE INDEX idx_applications_job        ON applications(job_id);
CREATE INDEX idx_applications_applicant  ON applications(applicant_id);
CREATE INDEX idx_applications_status     ON applications(status);
CREATE INDEX idx_applications_score      ON applications(composite_score DESC NULLS LAST);

-- Job postings
CREATE INDEX idx_job_postings_org        ON job_postings(organization_id);
CREATE INDEX idx_job_postings_status     ON job_postings(status);
CREATE INDEX idx_job_postings_created    ON job_postings(created_at DESC);

-- Full-text search on job titles and descriptions
CREATE INDEX idx_job_postings_fts        ON job_postings
  USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Candidate skills fuzzy search
CREATE INDEX idx_candidate_skills_trgm   ON candidate_skills
  USING gin(skill_name gin_trgm_ops);

-- Interview sessions
CREATE INDEX idx_interview_sessions_app  ON interview_sessions(application_id);
CREATE INDEX idx_interview_sessions_tok  ON interview_sessions(session_token);

-- Coding assessments
CREATE INDEX idx_coding_assessments_app  ON coding_assessments(application_id);
CREATE INDEX idx_coding_submissions_ass  ON coding_submissions(assessment_id, problem_id);

-- Notifications
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read, created_at DESC);

-- Audit log
CREATE INDEX idx_audit_logs_actor        ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity       ON audit_logs(entity_type, entity_id);

-- Score cards
CREATE INDEX idx_score_cards_job         ON candidate_score_cards(application_id);

-- Profiles
CREATE INDEX idx_profiles_org            ON profiles(organization_id);
CREATE INDEX idx_profiles_role           ON profiles(role);

-- =============================================================================
--  SECTION 16 · HELPER FUNCTIONS
-- =============================================================================

-- 16.1 Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organizations','profiles','organization_members',
    'job_postings','interview_questions','interview_sessions',
    'coding_problems','coding_assessments',
    'system_design_problems','system_design_assessments',
    'shortlists','human_interviews','ats_integrations',
    'candidate_profiles','notification_preferences'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
       t, t
    );
  END LOOP;
END $$;

-- 16.2 Recalculate composite score after each stage scores
CREATE OR REPLACE FUNCTION recalculate_composite_score(p_application_id UUID)
RETURNS VOID AS $$
DECLARE
  v_app       applications%ROWTYPE;
  v_job       job_postings%ROWTYPE;
  v_composite NUMERIC(5,2);
BEGIN
  SELECT * INTO v_app FROM applications WHERE id = p_application_id;
  SELECT * INTO v_job FROM job_postings WHERE id = v_app.job_id;

  -- Weighted composite (only include stages that are enabled and scored)
  v_composite :=
    COALESCE(v_app.cv_score,           0) * v_job.weight_cv           / 100.0 +
    COALESCE(v_app.voice_score,        0) * v_job.weight_voice        / 100.0 +
    COALESCE(v_app.coding_score,       0) * v_job.weight_coding       / 100.0 +
    COALESCE(v_app.system_design_score,0) * v_job.weight_system_design / 100.0;

  UPDATE applications
  SET composite_score = v_composite, updated_at = NOW()
  WHERE id = p_application_id;

  -- Mirror to score card
  UPDATE candidate_score_cards
  SET composite_score = v_composite, last_recalculated_at = NOW()
  WHERE application_id = p_application_id;
END;
$$ LANGUAGE plpgsql;

-- 16.3 Compute rank within a job posting
CREATE OR REPLACE FUNCTION refresh_job_rankings(p_job_id UUID)
RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY composite_score DESC NULLS LAST) AS rk,
      PERCENT_RANK() OVER (ORDER BY composite_score DESC NULLS LAST) * 100 AS pct
    FROM applications
    WHERE job_id = p_job_id
      AND status NOT IN ('draft', 'withdrawn')
      AND composite_score IS NOT NULL
  )
  UPDATE applications a
  SET rank = r.rk
  FROM ranked r
  WHERE a.id = r.id;

  UPDATE candidate_score_cards sc
  SET
    rank       = a.rank,
    percentile = ROUND(
      (1.0 - (a.rank::NUMERIC / NULLIF(
        (SELECT COUNT(*) FROM applications
         WHERE job_id = p_job_id AND composite_score IS NOT NULL), 0)
      )) * 100, 2
    )
  FROM applications a
  WHERE sc.application_id = a.id
    AND a.job_id = p_job_id;
END;
$$ LANGUAGE plpgsql;

-- 16.4 Log application status changes automatically
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO application_status_log(application_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_application_status_log
AFTER UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION log_application_status_change();

-- 16.5 Increment job application count
CREATE OR REPLACE FUNCTION increment_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
    UPDATE job_postings SET applications_count = applications_count + 1
    WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_applications_count
AFTER UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION increment_job_applications_count();

-- =============================================================================
--  SECTION 17 · ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on every table
ALTER TABLE organizations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills                ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_tags                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_education       ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_experience      ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_skills          ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_certifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_responses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_interview_scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_problems           ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_assessments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_assessment_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_design_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_design_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_design_scores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_score_cards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlists                ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlist_candidates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_interviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviewer_feedback      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring_decisions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_feedback        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_integrations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_sync_log              ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's organization
CREATE OR REPLACE FUNCTION current_user_org()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── PROFILES ──────────────────────────────────────────────────────────────────
CREATE POLICY "Profiles: own row"
  ON profiles FOR ALL
  USING (id = auth.uid());

CREATE POLICY "Profiles: org members can view colleagues"
  ON profiles FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = current_user_org()
  );

-- ── JOB POSTINGS ──────────────────────────────────────────────────────────────
CREATE POLICY "Jobs: public can view published"
  ON job_postings FOR SELECT
  USING (status = 'published');

CREATE POLICY "Jobs: org members can view all"
  ON job_postings FOR SELECT
  USING (organization_id = current_user_org());

CREATE POLICY "Jobs: recruiters can insert/update"
  ON job_postings FOR ALL
  USING (
    organization_id = current_user_org()
    AND current_user_role() IN ('recruiter', 'hr_ops', 'admin')
  );

-- ── APPLICATIONS ──────────────────────────────────────────────────────────────
CREATE POLICY "Applications: applicant sees own"
  ON applications FOR ALL
  USING (
    applicant_id = auth.uid()
    AND current_user_role() = 'applicant'
  );

CREATE POLICY "Applications: org can see applications to their jobs"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_postings jp
      WHERE jp.id = applications.job_id
        AND jp.organization_id = current_user_org()
    )
  );

CREATE POLICY "Applications: recruiter/hr can update status"
  ON applications FOR UPDATE
  USING (
    current_user_role() IN ('recruiter', 'hr_ops', 'admin')
    AND EXISTS (
      SELECT 1 FROM job_postings jp
      WHERE jp.id = applications.job_id
        AND jp.organization_id = current_user_org()
    )
  );

-- ── CANDIDATE DATA ────────────────────────────────────────────────────────────
CREATE POLICY "CV: owner sees own"
  ON candidate_profiles FOR ALL
  USING (applicant_id = auth.uid());

CREATE POLICY "CV: org recruiters can view"
  ON candidate_profiles FOR SELECT
  USING (
    current_user_role() IN ('recruiter', 'hr_ops', 'interviewer', 'admin')
    AND EXISTS (
      SELECT 1 FROM applications a
      JOIN job_postings jp ON jp.id = a.job_id
      WHERE a.applicant_id = candidate_profiles.applicant_id
        AND jp.organization_id = current_user_org()
    )
  );

-- Apply same recruiter-view logic to sub-tables (simplified with same pattern)
CREATE POLICY "Edu: owner" ON candidate_education FOR ALL
  USING (profile_id IN (SELECT id FROM candidate_profiles WHERE applicant_id = auth.uid()));

CREATE POLICY "Exp: owner" ON candidate_experience FOR ALL
  USING (profile_id IN (SELECT id FROM candidate_profiles WHERE applicant_id = auth.uid()));

CREATE POLICY "Skills: owner" ON candidate_skills FOR ALL
  USING (profile_id IN (SELECT id FROM candidate_profiles WHERE applicant_id = auth.uid()));

-- ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
CREATE POLICY "Notifications: own only"
  ON notifications FOR ALL
  USING (recipient_id = auth.uid());

-- ── AUDIT LOGS — READ ONLY ───────────────────────────────────────────────────
CREATE POLICY "Audit: hr_ops and admin can view"
  ON audit_logs FOR SELECT
  USING (current_user_role() IN ('hr_ops', 'admin'));

-- No UPDATE or DELETE policy — audit logs are immutable

-- ── DELETION REQUESTS ─────────────────────────────────────────────────────────
CREATE POLICY "Deletion: own request"
  ON data_deletion_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Deletion: own view"
  ON data_deletion_requests FOR SELECT
  USING (requester_id = auth.uid() OR current_user_role() IN ('hr_ops', 'admin'));

-- ── SCORE CARDS ───────────────────────────────────────────────────────────────
CREATE POLICY "Score cards: applicant sees own"
  ON candidate_score_cards FOR SELECT
  USING (
    application_id IN (
      SELECT id FROM applications WHERE applicant_id = auth.uid()
    )
  );

CREATE POLICY "Score cards: org recruiters see all"
  ON candidate_score_cards FOR SELECT
  USING (
    current_user_role() IN ('recruiter', 'hr_ops', 'interviewer', 'admin')
    AND application_id IN (
      SELECT a.id FROM applications a
      JOIN job_postings jp ON jp.id = a.job_id
      WHERE jp.organization_id = current_user_org()
    )
  );

-- ── CONSENT RECORDS ───────────────────────────────────────────────────────────
CREATE POLICY "Consent: own only"
  ON consent_records FOR ALL
  USING (user_id = auth.uid());

-- ── ATS INTEGRATIONS ──────────────────────────────────────────────────────────
CREATE POLICY "ATS: org hr_ops/admin only"
  ON ats_integrations FOR ALL
  USING (
    organization_id = current_user_org()
    AND current_user_role() IN ('hr_ops', 'admin')
  );

-- =============================================================================
--  SECTION 18 · SEED DATA (optional starter data)
-- =============================================================================

-- Global interview question starters
INSERT INTO interview_questions (category, sub_category, difficulty, question_text, max_duration_seconds)
VALUES
  ('behavioral','problem-solving','medium',
   'Tell me about a time you faced a technical challenge you had never seen before. How did you approach it?',120),
  ('behavioral','teamwork','easy',
   'Describe a situation where you had to collaborate with a difficult teammate. What was the outcome?',90),
  ('technical','fundamentals','easy',
   'Explain the difference between a stack and a queue. Give a real-world use case for each.',90),
  ('technical','system-concepts','medium',
   'What is the difference between horizontal and vertical scaling? When would you choose one over the other?',120),
  ('hr','motivation','easy',
   'What motivated you to apply for this role specifically?',60),
  ('hr','self-assessment','medium',
   'What is your biggest technical weakness right now, and what are you doing to address it?',90),
  ('culture-fit','values','easy',
   'Describe your ideal working environment and team culture.',60);

-- Sample system design problem
INSERT INTO system_design_problems (title, scenario, context, difficulty, topic_tags, time_limit_minutes, evaluation_rubric)
VALUES (
  'Design a URL Shortener',
  'Design a scalable URL shortening service similar to bit.ly.',
  'The system should handle 100M URLs shortened per day, support custom aliases, track click analytics, and have 99.99% uptime.',
  'medium',
  ARRAY['scalability','databases','caching','api-design'],
  45,
  '{
    "requirements_clarification": "Did the candidate ask about scale, read/write ratio, analytics depth?",
    "core_components": "Load balancer, app servers, DB, cache, analytics queue",
    "data_model": "URL mapping table design, ID generation strategy (base62)",
    "scalability": "Sharding strategy, cache eviction policy, CDN usage",
    "trade_offs": "Consistency vs availability, SQL vs NoSQL choice rationale"
  }'
);
