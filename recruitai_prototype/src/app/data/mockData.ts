export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  appliedDate: string;
  cvScore: number;
  codingScore: number;
  communicationScore: number;
  overallScore: number;
  status: 'shortlisted' | 'under_review' | 'rejected' | 'hired';
  stage: 'CV Received' | 'CV Parsed' | 'Interview Done' | 'Ranked';
  skills: string[];
  education: { year: string; degree: string; institution: string }[];
  experience: { year: string; title: string; company: string; desc: string }[];
}

export const candidates: Candidate[] = [
  {
    id: '1',
    name: 'Hamza Tariq',
    email: 'hamza.tariq@email.com',
    phone: '+92 300 1234567',
    role: 'Senior Frontend Engineer',
    appliedDate: '2026-02-10',
    cvScore: 91,
    codingScore: 88,
    communicationScore: 94,
    overallScore: 91,
    status: 'shortlisted',
    stage: 'Ranked',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'CSS', 'Jest', 'Figma', 'Webpack'],
    education: [
      { year: '2017', degree: 'B.Sc. Computer Science', institution: 'LUMS' },
    ],
    experience: [
      { year: '2021–Present', title: 'Senior Frontend Engineer', company: 'Careem', desc: 'Led UI architecture for dashboard products, mentored 4 junior engineers.' },
      { year: '2018–2021', title: 'Frontend Developer', company: 'Systems Limited', desc: 'Built reusable component library used across 12 product teams.' },
    ],
  },
  {
    id: '2',
    name: 'Ayesha Noor',
    email: 'ayesha.noor@email.com',
    phone: '+92 321 9876543',
    role: 'Backend Engineer',
    appliedDate: '2026-02-11',
    cvScore: 85,
    codingScore: 92,
    communicationScore: 78,
    overallScore: 86,
    status: 'shortlisted',
    stage: 'Ranked',
    skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'REST API'],
    education: [
      { year: '2018', degree: 'M.Sc. Software Engineering', institution: 'NUST Islamabad' },
    ],
    experience: [
      { year: '2020–Present', title: 'Backend Engineer', company: 'Daraz', desc: 'Designed microservices handling 10M+ requests/day. Reduced API latency by 40%.' },
      { year: '2018–2020', title: 'Software Engineer', company: 'NetSol Technologies', desc: 'Developed data pipeline infrastructure for enterprise clients.' },
    ],
  },
  {
    id: '3',
    name: 'Bilal Raza',
    email: 'bilal.raza@email.com',
    phone: '+92 333 3459012',
    role: 'Full Stack Developer',
    appliedDate: '2026-02-12',
    cvScore: 79,
    codingScore: 83,
    communicationScore: 87,
    overallScore: 83,
    status: 'under_review',
    stage: 'Interview Done',
    skills: ['Vue.js', 'Laravel', 'MySQL', 'PHP', 'Docker', 'Tailwind CSS', 'Git', 'Linux'],
    education: [
      { year: '2019', degree: 'B.Tech Information Technology', institution: 'FAST-NUCES' },
    ],
    experience: [
      { year: '2022–Present', title: 'Full Stack Developer', company: 'Sada-E-Watan', desc: 'Built merchant onboarding portal serving 50K+ businesses.' },
      { year: '2019–2022', title: 'Junior Developer', company: 'Techlogix', desc: 'Maintained CRM integrations and REST APIs.' },
    ],
  },
  {
    id: '4',
    name: 'Fatima Malik',
    email: 'fatima.malik@email.com',
    phone: '+92 344 4567890',
    role: 'Senior Frontend Engineer',
    appliedDate: '2026-02-13',
    cvScore: 74,
    codingScore: 70,
    communicationScore: 81,
    overallScore: 75,
    status: 'under_review',
    stage: 'CV Parsed',
    skills: ['JavaScript', 'React', 'SCSS', 'Webpack', 'Babel', 'REST API', 'Agile', 'Jira'],
    education: [
      { year: '2016', degree: 'B.Sc. Computer Engineering', institution: 'UET Lahore' },
    ],
    experience: [
      { year: '2020–Present', title: 'Frontend Engineer', company: 'Foodpanda Pakistan', desc: 'Developed streaming UI components for the main web app.' },
    ],
  },
  {
    id: '5',
    name: 'Usman Qureshi',
    email: 'usman.qureshi@email.com',
    phone: '+92 355 5678901',
    role: 'DevOps Engineer',
    appliedDate: '2026-02-14',
    cvScore: 68,
    codingScore: 75,
    communicationScore: 72,
    overallScore: 71,
    status: 'under_review',
    stage: 'Interview Done',
    skills: ['AWS', 'Terraform', 'Ansible', 'Jenkins', 'Kubernetes', 'Prometheus', 'Bash', 'Python'],
    education: [
      { year: '2020', degree: 'B.Sc. Information Systems', institution: 'IBA Karachi' },
    ],
    experience: [
      { year: '2022–Present', title: 'DevOps Engineer', company: 'Jazz Digital', desc: 'Managed CI/CD pipelines and infrastructure-as-code for 20+ microservices.' },
    ],
  },
  {
    id: '6',
    name: 'Zara Ahmed',
    email: 'zara.ahmed@email.com',
    phone: '+92 366 6782345',
    role: 'Backend Engineer',
    appliedDate: '2026-02-15',
    cvScore: 88,
    codingScore: 76,
    communicationScore: 65,
    overallScore: 78,
    status: 'under_review',
    stage: 'Ranked',
    skills: ['Java', 'Spring Boot', 'Kafka', 'MongoDB', 'Elasticsearch', 'Microservices', 'Maven', 'JUnit'],
    education: [
      { year: '2016', degree: 'M.Sc. Computer Science', institution: 'COMSATS University' },
    ],
    experience: [
      { year: '2019–Present', title: 'Senior Java Engineer', company: 'HBL Digital', desc: 'Architected event-driven systems processing 5M messages/day.' },
    ],
  },
  {
    id: '7',
    name: 'Saad Hussain',
    email: 'saad.hussain@email.com',
    phone: '+92 377 7893456',
    role: 'Full Stack Developer',
    appliedDate: '2026-02-16',
    cvScore: 55,
    codingScore: 60,
    communicationScore: 58,
    overallScore: 58,
    status: 'rejected',
    stage: 'CV Received',
    skills: ['HTML', 'CSS', 'JavaScript', 'Bootstrap', 'jQuery', 'PHP', 'MySQL'],
    education: [
      { year: '2021', degree: 'B.Sc. Web Development', institution: 'Virtual University' },
    ],
    experience: [
      { year: '2021–Present', title: 'Junior Web Developer', company: 'Freelance', desc: 'Developed small business websites and WordPress customizations.' },
    ],
  },
  {
    id: '8',
    name: 'Hira Baig',
    email: 'hira.baig@email.com',
    phone: '+92 388 8904567',
    role: 'Senior Frontend Engineer',
    appliedDate: '2026-02-17',
    cvScore: 82,
    codingScore: 89,
    communicationScore: 90,
    overallScore: 87,
    status: 'shortlisted',
    stage: 'Ranked',
    skills: ['React', 'Next.js', 'TypeScript', 'Redux', 'Testing Library', 'Storybook', 'WCAG', 'Performance'],
    education: [
      { year: '2018', degree: 'B.E. Computer Science', institution: 'GIK Institute' },
    ],
    experience: [
      { year: '2021–Present', title: 'Frontend Engineer', company: 'Arbisoft', desc: 'Built core editor features used by 10M+ designers worldwide.' },
      { year: '2018–2021', title: 'UI Engineer', company: 'Tkxel', desc: 'Created analytics dashboards and reporting tools.' },
    ],
  },
  {
    id: '9',
    name: 'Omar Farooq',
    email: 'omar.farooq@email.com',
    phone: '+92 311 2345678',
    role: 'Backend Engineer',
    appliedDate: '2026-02-18',
    cvScore: 80,
    codingScore: 84,
    communicationScore: 76,
    overallScore: 80,
    status: 'shortlisted',
    stage: 'Ranked',
    skills: ['Node.js', 'Express', 'MongoDB', 'Redis', 'GraphQL', 'Docker', 'AWS', 'TypeScript'],
    education: [
      { year: '2017', degree: 'B.Sc. Software Engineering', institution: 'Bahria University' },
    ],
    experience: [
      { year: '2020–Present', title: 'Backend Engineer', company: 'Airlift Technologies', desc: 'Built scalable backend for last-mile delivery logistics platform.' },
    ],
  },
  {
    id: '10',
    name: 'Maham Siddiqui',
    email: 'maham.siddiqui@email.com',
    phone: '+92 322 3456789',
    role: 'Full Stack Developer',
    appliedDate: '2026-02-19',
    cvScore: 77,
    codingScore: 81,
    communicationScore: 83,
    overallScore: 80,
    status: 'under_review',
    stage: 'Interview Done',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'Tailwind CSS', 'REST API', 'Jest', 'Git'],
    education: [
      { year: '2019', degree: 'B.Sc. Computer Science', institution: 'Habib University' },
    ],
    experience: [
      { year: '2021–Present', title: 'Full Stack Developer', company: 'Bykea', desc: 'Developed end-to-end features for ride-hailing and payments platform.' },
    ],
  },
];

export const recentActivity = [
  { name: 'Hamza Tariq', role: 'Senior Frontend Engineer', stage: 'Ranked', score: 91, date: '2026-02-28' },
  { name: 'Hira Baig', role: 'Senior Frontend Engineer', stage: 'Interview Done', score: 87, date: '2026-02-27' },
  { name: 'Ayesha Noor', role: 'Backend Engineer', stage: 'Ranked', score: 86, date: '2026-02-27' },
  { name: 'Bilal Raza', role: 'Full Stack Developer', stage: 'Interview Done', score: 83, date: '2026-02-26' },
  { name: 'Zara Ahmed', role: 'Backend Engineer', stage: 'CV Parsed', score: 78, date: '2026-02-26' },
];

export const interviewTranscript = [
  { id: 1, speaker: 'AI', text: 'Welcome to your technical interview. Can you start by walking me through your most complex project?', quality: null },
  { id: 2, speaker: 'Candidate', text: 'Absolutely. At Careem, I led the complete redesign of our dashboard analytics system. We had to handle real-time data for over 2 million merchants, which required careful state management and WebSocket integration.', quality: 'high' },
  { id: 3, speaker: 'AI', text: 'That sounds impressive. How did you handle performance bottlenecks with that many concurrent connections?', quality: null },
  { id: 4, speaker: 'Candidate', text: 'We implemented a virtualized list rendering approach using React Window, and we batched WebSocket updates to prevent excessive re-renders. We also used Redis on the backend for caching frequently requested data.', quality: 'high' },
  { id: 5, speaker: 'AI', text: 'How do you approach code reviews and maintaining code quality in a team environment?', quality: null },
  { id: 6, speaker: 'Candidate', text: 'I believe in constructive reviews. I focus on the why behind suggestions rather than just pointing out issues. We use automated linting and Prettier, so reviews can focus on architecture rather than formatting.', quality: 'high' },
  { id: 7, speaker: 'AI', text: 'Tell me about a time you disagreed with a technical decision made by your team lead.', quality: null },
  { id: 8, speaker: 'Candidate', text: 'Well, there was a time we were choosing between REST and GraphQL. I kind of thought, um, GraphQL would be better but I wasn\'t totally sure how to articulate all the reasons clearly at the time.', quality: 'medium' },
  { id: 9, speaker: 'AI', text: 'How did that situation resolve?', quality: null },
  { id: 10, speaker: 'Candidate', text: 'We ended up going with REST but adding a BFF layer. In retrospect, it was the right call for our use case since we had strict rate limiting requirements that GraphQL would have complicated.', quality: 'high' },
  { id: 11, speaker: 'AI', text: 'Describe your experience with accessibility in frontend development.', quality: null },
  { id: 12, speaker: 'Candidate', text: 'I\'ve worked extensively with WCAG 2.1 AA standards. I\'m familiar with ARIA attributes and I regularly test with screen readers like NVDA and VoiceOver. Accessibility is something I integrate from the design phase, not as an afterthought.', quality: 'high' },
];

export const codeSnippet = `def two_sum(nums: list[int], target: int) -> list[int]:
    """
    Given an array of integers nums and an integer target,
    return indices of the two numbers such that they add up to target.
    
    Time complexity: O(n)
    Space complexity: O(n)
    """
    seen = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        
        if complement in seen:
            return [seen[complement], i]
        
        seen[num] = i
    
    return []  # No solution found


# Test cases
print(two_sum([2, 7, 11, 15], 9))  # Expected: [0, 1]
print(two_sum([3, 2, 4], 6))       # Expected: [1, 2]
print(two_sum([3, 3], 6))          # Expected: [0, 1]
`;

export const systemDesignResponse = `I would design this URL shortener system to handle 100M daily requests with the following architecture:

**Write Path (URL Shortening):**
The client sends a POST request to an API Gateway, which routes to a fleet of stateless Application Servers. Each server generates a unique short code using Base62 encoding of a distributed sequence ID (sourced from a dedicated ID Generator service to avoid collisions). The mapping is persisted to a Primary SQL Database (PostgreSQL) and simultaneously written to a Redis cache for immediate read availability.

**Read Path (URL Expansion):**
A CDN layer sits at the edge, caching hot URLs. Cache hit rate is expected to be ~80% given the Zipf distribution of URL access patterns. On cache miss, the request falls through to a Redis cluster, then to read replicas of the database. The final HTTP 301/302 redirect is returned to the client.

**Scalability Decisions:**
- Horizontal scaling of application servers behind a Load Balancer
- Database sharding by short_code prefix for write scalability  
- Separate read replicas to handle the 100:1 read/write ratio
- Rate limiting at the API Gateway to prevent abuse

**Data Retention:**
URLs expire after 2 years by default. A background cleanup job runs nightly to purge expired entries.`;

export const jobPostings = [
  { id: '1', title: 'Senior Frontend Engineer', department: 'Engineering', applicants: 47, posted: '2026-02-01', status: 'active' },
  { id: '2', title: 'Backend Engineer', department: 'Engineering', applicants: 32, posted: '2026-02-05', status: 'active' },
  { id: '3', title: 'DevOps Engineer', department: 'Infrastructure', applicants: 19, posted: '2026-02-10', status: 'active' },
  { id: '4', title: 'Product Manager', department: 'Product', applicants: 61, posted: '2026-01-20', status: 'paused' },
];

export const cvKeywordRules = [
  { id: '1', skill: 'React', department: 'Frontend Engineering', weight: 'High', active: true },
  { id: '2', skill: 'TypeScript', department: 'Frontend Engineering', weight: 'High', active: true },
  { id: '3', skill: 'Python', department: 'Backend Engineering', weight: 'High', active: true },
  { id: '4', skill: 'Kubernetes', department: 'DevOps', weight: 'High', active: true },
  { id: '5', skill: 'PostgreSQL', department: 'Backend Engineering', weight: 'Medium', active: true },
  { id: '6', skill: 'AWS', department: 'Infrastructure', weight: 'Medium', active: true },
  { id: '7', skill: 'Docker', department: 'DevOps', weight: 'Medium', active: true },
  { id: '8', skill: 'GraphQL', department: 'Frontend Engineering', weight: 'Low', active: false },
  { id: '9', skill: 'Redux', department: 'Frontend Engineering', weight: 'Low', active: true },
  { id: '10', skill: 'Terraform', department: 'DevOps', weight: 'Medium', active: false },
];
