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


INSERT INTO coding_problems (
  title,
  slug,
  description,
  difficulty,
  topic_tags,
  supported_languages,
  time_limit_ms,
  memory_limit_mb,
  max_score,
  sample_input,
  sample_output,
  explanation,
  optimal_complexity,
  editorial_notes
)
VALUES
(
  'Two Sum',
  'two-sum',
  'Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to the target.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice.\n\nReturn the answer in any order.',
  'easy',
  ARRAY['Arrays', 'Hash Map'],
ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  1000,
  128,
  100,
  'nums = [2,7,11,15], target = 9',
  '[0,1]',
  'The numbers 2 and 7 add up to 9.',
  'O(n)',
  'Tests understanding of hash maps and array traversal.'
),
(
  'Valid Parentheses',
  'valid-parentheses',
  'Given a string containing just the characters (), {}, and [], determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets are closed by the same type of brackets.\n2. Open brackets are closed in the correct order.\n3. Every closing bracket has a corresponding opening bracket.',
  'easy',
  ARRAY['Stack', 'Strings'],
ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  1000,
  128,
  100,
  's = "({[]})"',
  'true',
  'All brackets are properly nested and matched.',
  'O(n)',
  'Good beginner problem for stack implementation.'
),
(
  'Merge Intervals',
  'merge-intervals',
  'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return an array of the non-overlapping intervals.',
  'medium',
  ARRAY['Sorting', 'Intervals', 'Arrays'],
ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  1500,
  256,
  150,
  'intervals = [[1,3],[2,6],[8,10],[15,18]]',
  '[[1,6],[8,10],[15,18]]',
  'Intervals [1,3] and [2,6] overlap and are merged.',
  'O(n log n)',
  'Evaluates sorting and greedy merging logic.'
),
(
  'Longest Substring Without Repeating Characters',
  'longest-substring-without-repeating-characters',
  'Given a string s, find the length of the longest substring without repeating characters.',
  'medium',
  ARRAY['Sliding Window', 'Strings', 'Hash Map'],
ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  1500,
  256,
  150,
  's = "abcabcbb"',
  '3',
  'The answer is "abc", with length 3.',
  'O(n)',
  'Tests sliding window optimization.'
),
(
  'Binary Tree Level Order Traversal',
  'binary-tree-level-order-traversal',
  'Given the root of a binary tree, return the level order traversal of its nodes values from left to right, level by level.',
  'medium',
  ARRAY['Trees', 'Breadth First Search', 'Queues'],
ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  2000,
  256,
  175,
  'root = [3,9,20,null,null,15,7]',
  '[[3],[9,20],[15,7]]',
  'Nodes are traversed level by level using BFS.',
  'O(n)',
  'Checks understanding of queue-based BFS traversal.'
),
(
  'Product of Array Except Self',
  'product-of-array-except-self',
  'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\n\nYou must solve it without using division and in O(n) time.',
  'medium',
  ARRAY['Arrays', 'Prefix Sum'],
ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  1500,
  256,
  175,
  'nums = [1,2,3,4]',
  '[24,12,8,6]',
  'Each position stores the product of all elements before and after it.',
  'O(n)',
  'Tests prefix and suffix product optimization.'
),
(
  'Detect Cycle in Linked List',
  'detect-cycle-in-linked-list',
  'Given the head of a linked list, determine if the linked list has a cycle in it.\n\nReturn true if there is a cycle, otherwise return false.',
  'medium',
  ARRAY['Linked List', 'Two Pointers'],
ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  1500,
  256,
  150,
  'head = [3,2,0,-4], pos = 1',
  'true',
  'The tail connects back to the node at index 1.',
  'O(n)',
  'Classic Floyd cycle detection problem.'
),
(
  'Coin Change',
  'coin-change',
  'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\n\nReturn the fewest number of coins needed to make up that amount. If it is not possible, return -1.',
  'medium',
  ARRAY['Dynamic Programming'],
ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  2000,
  256,
  200,
  'coins = [1,2,5], amount = 11',
  '3',
  '11 can be formed using 5 + 5 + 1.',
  'O(amount * n)',
  'Tests bottom-up dynamic programming.'
),
(
  'Top K Frequent Elements',
  'top-k-frequent-elements',
  'Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.',
  'medium',
  ARRAY['Heap', 'Hash Map', 'Sorting'],
ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  2000,
  256,
  175,
  'nums = [1,1,1,2,2,3], k = 2',
  '[1,2]',
  '1 appears 3 times and 2 appears 2 times.',
  'O(n log k)',
  'Can be solved with heaps or bucket sort.'
),
(
  'Number of Islands',
  'number-of-islands',
  'Given an m x n 2D binary grid grid which represents a map of 1s (land) and 0s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
  'medium',
  ARRAY['Graphs', 'Depth First Search', 'Breadth First Search'],
ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  2500,
  256,
  200,
  'grid = [["1","1","0","0"],["1","1","0","0"],["0","0","1","0"],["0","0","0","1"]]',
  '3',
  'There are three disconnected groups of land cells.',
  'O(m * n)',
  'Useful for evaluating graph traversal on grids.'
),
(
  'LRU Cache',
  'lru-cache',
  'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRUCache class with get and put operations in O(1) average time complexity.',
  'hard',
  ARRAY['Design', 'Hash Map', 'Linked List'],
  ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  3000,
  512,
  300,
  'capacity = 2\nput(1,1)\nput(2,2)\nget(1)\nput(3,3)\nget(2)',
  '[1,-1]',
  'After inserting key 3, key 2 is evicted because it is least recently used.',
  'O(1)',
  'Tests system design thinking and custom data structures.'
),
(
  'Word Ladder',
  'word-ladder',
  'A transformation sequence from word beginWord to word endWord using a dictionary wordList is a sequence of words such that:\n1. Only one letter can be changed at a time.\n2. Each transformed word must exist in wordList.\n\nReturn the length of the shortest transformation sequence.',
  'hard',
  ARRAY['Graphs', 'Breadth First Search', 'Strings'],
  ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  3000,
  512,
  300,
  'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]',
  '5',
  'One shortest sequence is hit -> hot -> dot -> dog -> cog.',
  'O(N * M^2)',
  'Strong graph traversal and optimization problem.'
),
(
  'Trapping Rain Water',
  'trapping-rain-water',
  'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
  'hard',
  ARRAY['Two Pointers', 'Arrays', 'Dynamic Programming'],
  ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  2500,
  256,
  250,
  'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
  '6',
  'The elevation map can trap 6 units of rain water.',
  'O(n)',
  'Can be solved with prefix max arrays or two pointers.'
),
(
  'Course Schedule',
  'course-schedule',
  'There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [a, b] indicates that you must take course b before course a.\n\nReturn true if you can finish all courses.',
  'medium',
  ARRAY['Graphs', 'Topological Sort'],
  ARRAY['javascript', 'python', 'cpp', 'java']::coding_language[],
  2500,
  256,
  200,
  'numCourses = 2, prerequisites = [[1,0]]',
  'true',
  'Course 0 can be taken before course 1, so all courses can be completed.',
  'O(V + E)',
  'Tests cycle detection in directed graphs.'
);
