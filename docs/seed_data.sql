-- =============================================================================
--  RecruitAI — Seed Data for Testing
--  Run this after the main schema has been applied
-- =============================================================================

DO $$
DECLARE
    v_org_id UUID := 'a0000000-0000-0000-0000-000000000001'::uuid;
    v_recruiter_id UUID := 'a0000000-0000-0000-0000-000000000010'::uuid;
    v_applicant1_id UUID := 'a0000000-0000-0000-0000-000000000020'::uuid;
    v_applicant2_id UUID := 'a0000000-0000-0000-0000-000000000021'::uuid;
    v_applicant3_id UUID := 'a0000000-0000-0000-0000-000000000022'::uuid;
    v_applicant4_id UUID := 'a0000000-0000-0000-0000-000000000023'::uuid;
    v_job_id UUID := 'a0000000-0000-0000-0000-000000000100'::uuid;
    -- Candidate profile IDs (different from applicant IDs)
    v_cp1_id UUID := 'b0000000-0000-0000-0000-000000000020'::uuid;
    v_cp2_id UUID := 'b0000000-0000-0000-0000-000000000021'::uuid;
    v_cp3_id UUID := 'b0000000-0000-0000-0000-000000000022'::uuid;
    v_cp4_id UUID := 'b0000000-0000-0000-0000-000000000023'::uuid;
BEGIN
    -- 1. Insert Organization
    INSERT INTO organizations (id, name, slug, logo_url, website_url, industry, size_range, country, city, is_verified)
    VALUES (
        v_org_id, 'TechCorp Pakistan', 'techcorp-pk',
        'https://example.com/logos/techcorp.png', 'https://techcorp.pk',
        'Technology', '50-200', 'PK', 'Lahore', TRUE
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. Create Auth Users
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud, confirmation_token, recovery_token,
        email_change_token_new, email_change
    ) VALUES
    (v_recruiter_id, '00000000-0000-0000-0000-000000000000'::uuid, 'recruiter@techcorp.pk',
     '$2a$10$X9jVwZ5QK9n8MxYrT3pWzOqK2sL7vH4cF8dE6gB1iN0aP5mQ3rS2u',
     NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ali Hassan"}',
     FALSE, 'authenticated', 'authenticated', '', '', '', ''),
    (v_applicant1_id, '00000000-0000-0000-0000-000000000000'::uuid, 'ahmed.developer@gmail.com',
     '$2a$10$X9jVwZ5QK9n8MxYrT3pWzOqK2sL7vH4cF8dE6gB1iN0aP5mQ3rS2u',
     NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Muhammad Ahmed"}',
     FALSE, 'authenticated', 'authenticated', '', '', '', ''),
    (v_applicant2_id, '00000000-0000-0000-0000-000000000000'::uuid, 'sara.khan@hotmail.com',
     '$2a$10$X9jVwZ5QK9n8MxYrT3pWzOqK2sL7vH4cF8dE6gB1iN0aP5mQ3rS2u',
     NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sara Khan"}',
     FALSE, 'authenticated', 'authenticated', '', '', '', ''),
    (v_applicant3_id, '00000000-0000-0000-0000-000000000000'::uuid, 'usman.ali@outlook.com',
     '$2a$10$X9jVwZ5QK9n8MxYrT3pWzOqK2sL7vH4cF8dE6gB1iN0aP5mQ3rS2u',
     NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Usman Ali"}',
     FALSE, 'authenticated', 'authenticated', '', '', '', ''),
    (v_applicant4_id, '00000000-0000-0000-0000-000000000000'::uuid, 'fatima.zahra@yahoo.com',
     '$2a$10$X9jVwZ5QK9n8MxYrT3pWzOqK2sL7vH4cF8dE6gB1iN0aP5mQ3rS2u',
     NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fatima Zahra"}',
     FALSE, 'authenticated', 'authenticated', '', '', '', '')
    ON CONFLICT (id) DO NOTHING;

    -- 3. Insert Profiles
    INSERT INTO profiles (id, role, organization_id, first_name, last_name, email, phone, timezone)
    VALUES (v_recruiter_id, 'recruiter', v_org_id, 'Ali', 'Hassan',
            'recruiter@techcorp.pk', '+92-300-1234567', 'Asia/Karachi')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO profiles (id, role, first_name, last_name, email, phone, timezone, linkedin_url, github_url, portfolio_url)
    VALUES
    (v_applicant1_id, 'applicant', 'Muhammad', 'Ahmed', 'ahmed.developer@gmail.com',
     '+92-301-1111111', 'Asia/Karachi', 'https://linkedin.com/in/muhammadahmed',
     'https://github.com/mahmed-dev', 'https://mahmed.dev'),
    (v_applicant2_id, 'applicant', 'Sara', 'Khan', 'sara.khan@hotmail.com',
     '+92-302-2222222', 'Asia/Karachi', 'https://linkedin.com/in/sarakhan',
     'https://github.com/sarakhan', NULL),
    (v_applicant3_id, 'applicant', 'Usman', 'Ali', 'usman.ali@outlook.com',
     '+92-303-3333333', 'Asia/Karachi', 'https://linkedin.com/in/usmanali',
     'https://github.com/usmanali-dev', 'https://usmanali.github.io'),
    (v_applicant4_id, 'applicant', 'Fatima', 'Zahra', 'fatima.zahra@yahoo.com',
     '+92-304-4444444', 'Asia/Karachi', 'https://linkedin.com/in/fatimazahra',
     'https://github.com/fatimazahra', NULL)
    ON CONFLICT (id) DO NOTHING;

    -- 4. Insert Job Posting
    INSERT INTO job_postings (
        id, organization_id, created_by, title, slug, description,
        responsibilities, requirements, benefits, employment_type,
        work_mode, location, experience_min_years, experience_max_years,
        salary_min, salary_max, salary_currency, application_deadline,
        openings_count, status, published_at
    ) VALUES (
        v_job_id, v_org_id, v_recruiter_id,
        'Senior Full-Stack Developer', 'senior-fullstack-developer',
        'We are looking for an experienced Full-Stack Developer to join our team.',
        'Design and develop scalable web applications. Collaborate with teams.',
        '3+ years experience. React, Node.js, TypeScript proficiency.',
        'Competitive salary. Health insurance. Remote flexibility.',
        'full_time', 'hybrid', 'Lahore, Pakistan', 3.0, 6.0,
        250000.00, 450000.00, 'PKR', '2026-04-30',
        2, 'published', NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- 5. Insert Job Skills
    INSERT INTO job_skills (job_id, skill_name, is_mandatory, proficiency, weight) VALUES
    (v_job_id, 'React', TRUE, 'expert', 2.0),
    (v_job_id, 'Node.js', TRUE, 'expert', 2.0),
    (v_job_id, 'TypeScript', TRUE, 'intermediate', 1.5),
    (v_job_id, 'PostgreSQL', TRUE, 'intermediate', 1.5),
    (v_job_id, 'AWS', FALSE, 'intermediate', 1.0),
    (v_job_id, 'Docker', FALSE, 'beginner', 0.5),
    (v_job_id, 'Git', TRUE, 'intermediate', 1.0)
    ON CONFLICT (job_id, skill_name) DO NOTHING;

    -- 6. Insert Job Tags
    INSERT INTO job_tags (job_id, tag) VALUES
    (v_job_id, 'Remote-Friendly'),
    (v_job_id, 'Senior-Level'),
    (v_job_id, 'Full-Stack'),
    (v_job_id, 'Startup')
    ON CONFLICT (job_id, tag) DO NOTHING;

    -- 7. Insert Candidate Profiles (with explicit IDs for FK reference)
    INSERT INTO candidate_profiles (
        id, applicant_id, headline, summary, total_experience_months,
        highest_degree, gpa, university, graduation_year, skills_raw, cv_completeness_score
    ) VALUES
    (v_cp1_id, v_applicant1_id, 'Full-Stack Developer | 4 YOE', 'Experienced full-stack developer.', 48,
     'BS', 3.45, 'FAST-NUCES Lahore', 2021,
     ARRAY['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'], 85.0),
    (v_cp2_id, v_applicant2_id, 'Software Engineer | MERN Stack', 'MERN stack specialist.', 36,
     'BS', 3.67, 'LUMS', 2022,
     ARRAY['JavaScript', 'React', 'MongoDB', 'Node.js'], 78.0),
    (v_cp3_id, v_applicant3_id, 'Backend Developer | 5 YOE', 'Python and Node.js expert.', 60,
     'MS', 3.80, 'NUST Islamabad', 2020,
     ARRAY['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS'], 92.0),
    (v_cp4_id, v_applicant4_id, 'Junior Developer | CS Graduate', 'Recent graduate eager to learn.', 12,
     'BS', 3.21, 'PUCIT Lahore', 2025,
     ARRAY['React', 'JavaScript', 'HTML', 'CSS', 'Git'], 65.0)
    ON CONFLICT (applicant_id) DO NOTHING;

    -- 8. Insert Candidate Skills (using candidate_profile IDs)
    INSERT INTO candidate_skills (profile_id, skill_name, category, proficiency, years_used, source) VALUES
    (v_cp1_id, 'React', 'framework', 'expert', 3.5, 'cv'),
    (v_cp1_id, 'Node.js', 'framework', 'expert', 3.0, 'cv'),
    (v_cp1_id, 'TypeScript', 'language', 'intermediate', 2.5, 'cv'),
    (v_cp1_id, 'PostgreSQL', 'database', 'intermediate', 3.0, 'cv'),
    (v_cp2_id, 'React', 'framework', 'intermediate', 2.5, 'cv'),
    (v_cp2_id, 'JavaScript', 'language', 'expert', 3.0, 'cv'),
    (v_cp2_id, 'MongoDB', 'database', 'intermediate', 2.0, 'cv'),
    (v_cp3_id, 'Python', 'language', 'expert', 5.0, 'cv'),
    (v_cp3_id, 'Django', 'framework', 'expert', 4.0, 'cv'),
    (v_cp3_id, 'PostgreSQL', 'database', 'expert', 4.5, 'cv'),
    (v_cp4_id, 'React', 'framework', 'beginner', 1.0, 'cv'),
    (v_cp4_id, 'JavaScript', 'language', 'intermediate', 1.5, 'cv')
    ON CONFLICT (profile_id, skill_name) DO NOTHING;

    -- 9. Insert Applications
    INSERT INTO applications (id, job_id, applicant_id, status, submitted_at) VALUES
    ('a0000000-0000-0000-0000-000000000200'::uuid, v_job_id, v_applicant1_id, 'cv_screening', NOW() - INTERVAL '2 days'),
    ('a0000000-0000-0000-0000-000000000201'::uuid, v_job_id, v_applicant2_id, 'submitted', NOW() - INTERVAL '1 day'),
    ('a0000000-0000-0000-0000-000000000202'::uuid, v_job_id, v_applicant3_id, 'voice_interview', NOW() - INTERVAL '5 days'),
    ('a0000000-0000-0000-0000-000000000203'::uuid, v_job_id, v_applicant4_id, 'draft', NULL)
    ON CONFLICT (job_id, applicant_id) DO NOTHING;

    RAISE NOTICE 'Seed data inserted successfully!';
END $$;
