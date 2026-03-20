Design a complete, high-fidelity web application for RecruitAI — an AI-powered automated recruitment platform. The design must cover every screen listed below, with all navigation and flows fully connected. This is a single deliverable, not a series of screens.

Visual Identity & Design Rules

Color palette: Deep Navy #1A202C for sidebar/nav backgrounds, Action Blue #2B6CB0 for primary buttons and active states, #F7FAFC for page backgrounds, white #FFFFFF for cards. Use green #38A169 for high scores/success, amber #D69E2E for medium, red #E53E3E for low scores.
Typography: Inter or Roboto, clean and readable. Use font weight and size hierarchy — not color — to create emphasis.
No gradients anywhere. Use flat, solid colors only. No glassmorphism, no frosted glass, no glow effects. The design must look professional and enterprise-grade, not like an AI-generated concept.
Layout: Sidebar navigation (fixed, left side, navy background) with a content area on the right. Card-based modular layout. Generous white space inside cards. Subtle #E2E8F0 borders and very light box-shadow only — nothing decorative.
Icons: Simple line icons (Lucide or Feather style). No filled colorful icons.
All screens share the same sidebar, header bar, and card style for full visual consistency.


SCREEN 1 — Homepage (Public, before login)
A clean marketing landing page. Includes: a top navigation bar with the RecruitAI logo on the left and "Log In" + "Sign Up" buttons on the right. A hero section with a one-line headline, a two-line subheadline, and two CTA buttons ("Get Started" filled, "See How It Works" outlined). Below the hero: three feature highlight cards (Voice Interviews, Coding Assessments, CV Parsing). A simple footer with copyright. No animations described, no gradients, flat and clean.

SCREEN 2 — Login Page
Centered card on a light gray background. RecruitAI logo at the top of the card. Email and password fields. A "Role" selector (dropdown or toggle) with two options: Recruiter and Candidate — this determines where the user is redirected after login. A primary "Log In" button. A link to Sign Up. Keep it minimal, no illustrations.
Login routing rule: If role = Recruiter → go to Screen 4 (Recruiter Dashboard). If role = Candidate → go to Screen 9 (Assessment Lobby).

SCREEN 3 — Sign Up Page
Same card layout as login. Fields: Full Name, Email, Password, Confirm Password, Role selector (Recruiter / Candidate). Primary "Create Account" button. Link back to Log In.

SCREENS 4–8: RECRUITER FLOW
The sidebar for all recruiter screens contains: Dashboard, Candidates, Interviews, Assessments, Settings. Active item highlighted with Action Blue left border and subtle background. User avatar and name at the bottom of the sidebar.
SCREEN 4 — Main Recruitment Overview (Recruiter Dashboard)
Top row: four KPI stat cards showing — Active Job Postings, Total Applicants, Interviews Completed, Candidates Ranked. Each card has a number, a label, and a small neutral icon. No color fills on the cards, just a top border accent in Action Blue.
Below: a horizontal recruitment funnel visualization (not a pie chart) — showing count at each stage: CV Received → CV Parsed → Interview Done → Ranked. Use simple horizontal bars or a stepped funnel shape, flat colors only.
Below that: a "Recent Activity" table showing the last 5 candidate actions with columns: Name, Job Role, Stage, Score, Date.

SCREEN 5 — Candidate Ranking Leaderboard
Full-width data table. Columns: Rank (#), Candidate Name + avatar initials, Applied Role, CV Score, Coding Score, Communication Score, Overall Score, Status badge, Action button ("View Profile").
Score columns use colored text only (green/amber/red) based on value — no colored cells or backgrounds.
Above the table: filter bar with dropdowns for Job Role, Skills (from CV parsing), and Round (Coding / Voice / All). A search box for candidate name.
Overall Score column is sortable and sorted descending by default.

SCREEN 6 — Detailed Candidate Profile
Two-column layout. Left column (35% width): candidate photo placeholder (initials avatar), name, email, phone, applied role, application date. Below that: parsed CV skills shown as plain text tags (flat, outlined, no colored chips). Education and experience listed as a simple timeline.
Right column (65% width): four score summary cards at the top (CV Match, Coding, Communication, Overall) using circular progress indicators or simple bar indicators — flat, no gradients. Below: three collapsible sections — "Interview Summary", "Coding Assessment Summary", "System Design Summary" — each showing a 2–3 line AI-generated text summary and a score. At the bottom: two action buttons — "Proceed to Next Round" (filled blue) and "Reject" (outlined red).

SCREEN 7 — Interview Analytics & Playback
Top section: audio player bar (waveform visualization, play/pause, seek, timestamp) — flat design, navy and blue colors only.
Below: two-column layout. Left side: full AI-generated transcript as a scrollable text area. Individual transcript lines that scored high on Communication Clarity are highlighted with a subtle left border in green. Lines flagged as weak or off-topic have an amber left border. No background color fills on transcript lines.
Right side: three horizontal bar charts showing — Clarity Score over time, Relevance Score over time, Confidence Score over time. These are simple flat bars, navy/blue palette.
Below the charts: AI insight summary paragraph in a bordered card.

SCREEN 8 — Technical Assessment Deep-Dive
Full-width split screen, 50/50. Left panel: code editor view (dark background #1E2A3A, monospace font, syntax-highlighted code, line numbers). Panel header shows: language badge, "Submitted 2h ago". No run button — this is a review view.
Right panel: white background. Header shows candidate name and problem title. Below: three score rows — Correctness, Efficiency, Coding Standards — each shown as a label, a flat horizontal bar, and a percentage. Below each bar: one-line AI comment in gray italic text. At the bottom: a text area showing the AI's full written evaluation in a bordered card.

SCREEN 8B — System Design Review
Single column layout within the content area. At the top: the scenario question in a bordered callout card (left blue border, light background). Below: the candidate's written response in a scrollable text panel. On the right side (or below on smaller widths): AI feedback broken into three labeled sections — Scalability Understanding, Architecture Clarity, Design Principles — each with a flat score bar and 2–3 lines of AI commentary. At the bottom: an overall AI verdict card with a score badge.

SCREENS 9–13: CANDIDATE FLOW
The candidate view has a simplified top navigation bar only (no sidebar). Shows: RecruitAI logo left, candidate name and avatar right, and a progress indicator in the center showing which stage they are on.
SCREEN 9 — Assessment Lobby
Personalized welcome: "Welcome back, [Name]" heading. Below: the job role they applied for in a subtitle. A hardware check row showing three status indicators: Microphone (green checkmark or red X), Browser Compatibility, Camera (if needed) — shown as icon + label + status badge.
Below: three task cards in a row — Voice Interview, Coding Test, System Design. Each card shows: task name, estimated duration, a status badge (Not Started / In Progress / Completed), and a "Begin" button. Completed tasks show a green checkmark and are non-clickable.
At the bottom: a timeline note — "Your results will be reviewed by the recruiter within 48 hours."
Important: If microphone check fails, the Voice Interview card shows the Begin button as disabled with a tooltip "Microphone access required." The candidate can still proceed to Coding Test and System Design without microphone access.

SCREEN 10 — AI Voice Interview Interface
Full-screen, distraction-free. Clean white background. Center of screen: a circular AI avatar indicator (flat navy circle with a simple microphone icon or soundwave — no gradients, no glow). Below it: the current interview question displayed in large readable text inside a bordered card. Below the question card: candidate response area — a live transcript text box that fills in as they speak (or a text input as fallback if mic is unavailable).
At the bottom: a large "Push to Talk" button (navy, flat). When recording: button turns red labeled "Recording… Release to Submit." When processing: a simple loading spinner. A small progress indicator at the top — "Question 3 of 7."
Top right: a "Having issues?" link that shows a modal with the option to switch to text-based responses.

SCREEN 11 — Integrated Coding Environment (IDE)
Three-panel layout. Left panel (30%): problem statement — title, difficulty badge (Easy/Medium/Hard using green/amber/red text), full problem description, and example test cases. Scrollable.
Center panel (50%): code editor — dark background, syntax highlighting, line numbers, language selector dropdown at the top, and a "Run Code" button. Below the editor: console output area (dark background, monospace font) showing stdout and errors.
Right panel (20%): test case results — each test case shown as a row with a pass/fail icon and expected vs. actual output. At the bottom of this panel: a "Submit Solution" primary button.
Top bar shows: problem title, timer counting down, candidate name.

SCREEN 12 — System Design Workspace
Two-section layout. Top section: the scenario question in a bordered callout card with a left blue accent border. Below it: two tabs — "Written Response" and "Diagram." Written Response tab shows a large text area with placeholder guidance text. Diagram tab shows a simplified drag-and-drop canvas with basic shapes (Server, Database, Load Balancer, Client) as draggable blocks connected by arrows — minimal and functional.
Bottom bar: word count indicator and a "Submit Response" primary button.

SCREEN 13 — Submission Confirmation
Centered layout. A large flat checkmark icon in green. Heading: "All done! Your assessment has been submitted." Subheading: "Here's what happens next." Below: a three-step numbered timeline — (1) AI evaluates your responses, (2) Recruiter reviews your ranking, (3) You'll hear back within 48 hours. At the bottom: a "Return to Home" outlined button.

SCREENS 14–15: SETTINGS
SCREEN 14 — Job Posting & Assessment Creator
A form-based screen. Fields: Job Title, Department, Required Skills (tag input), Assessment Weights section (three sliders or number inputs for CV Score weight %, Coding Score weight %, Voice Score weight % — must total 100%). Below: a question bank section where the recruiter can add/remove predefined interview questions. A "Save & Publish" primary button.
SCREEN 15 — CV Parsing Ruleset Configuration
A table of keyword rules. Each row: Skill/Keyword, Department, Weight/Priority, Active toggle. An "Add New Rule" button at the top right. Clean table, no colored rows.

Navigation & Connections — Connect all screens as follows:
Homepage → Log In button → Screen 2. Homepage → Sign Up → Screen 3. Login (Recruiter role) → Screen 4. Login (Candidate role) → Screen 9. Recruiter sidebar: Dashboard → Screen 4, Candidates → Screen 5, clicking a candidate row → Screen 6, from Screen 6 clicking "Interview" tab → Screen 7, clicking "Assessment" tab → Screen 8, Settings → Screen 14 and 15. Candidate flow: Screen 9 → Begin Voice Interview → Screen 10 → complete → back to Screen 9. Screen 9 → Begin Coding Test → Screen 11 → submit → back to Screen 9. Screen 9 → Begin System Design → Screen 12 → submit → Screen 13.

Final instruction: Every screen must be fully designed, not a wireframe or placeholder. Use realistic dummy data throughout (candidate names, scores, code snippets, transcript text). All screens must share the same design system — same font sizes, same card style, same button styles, same color usage. The result should feel like a single cohesive product, not a collection of individual screens.