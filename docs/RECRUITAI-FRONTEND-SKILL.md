---
name: recruitai-frontend
description: >
  Master design system, layout rules, color tokens, responsiveness, interaction patterns,
  and full navigation flow for the RecruitAI frontend. Use this skill whenever building,
  modifying, extending, or reviewing ANY page or component in the RecruitAI project —
  recruiter dashboard, candidate flow, public pages, modals, tables, forms, or new features.
  This skill must be consulted before writing any JSX/TSX, Tailwind class, or inline style
  for RecruitAI. It is the single source of truth for consistency across all AI agents.
---

# RecruitAI Frontend Skill

> **Always read this file first** before generating any RecruitAI component, page, or feature.
> It encodes the full prototype's color system, layout rules, spacing system, component
> patterns, responsiveness strategy, and complete navigation/user flow.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 with TypeScript |
| Routing | `react-router` (v7, `createBrowserRouter`) |
| Styling | Tailwind CSS v4 + inline `style={}` for color tokens |
| Animations | CSS `transition: all 0.2s ease` (no Framer Motion) |
| Icons | `lucide-react` — line icons only, no filled colorful icons |
| Font | `Inter` (400, 500, 600, 700) via Google Fonts |
| Build | Vite + `postcss.config.mjs` |
| UI Primitives | shadcn/ui component library (in `src/app/components/ui/`) |

---

## 2. Color System — "Midnight Slate"

**Rule**: All colors are applied via inline `style={}` props — NOT Tailwind color utilities like `bg-purple-600`. Tailwind is used only for layout, spacing, and sizing utilities. Colors live in CSS variables (defined in `theme.css`) and are referenced in inline styles.

### 2.1 CSS Variables (`src/styles/theme.css`)

```css
--background:        #0F1117;   /* main page/app background */
--card:              #171921;   /* cards, panels, modals, dropdowns */
--secondary:         #1D202A;   /* alternate surface, icon bg, table header */
--sidebar:           #0B0D13;   /* sidebar nav background */
--header:            #13151D;   /* top navigation bars, input background */
--primary:           #7C6AEF;   /* buttons, links, active states, logo bg */
--primary-hover:     #9585F5;   /* button hover, secondary accent */
--foreground:        #E2E4EB;   /* headings, titles, main body text */
--muted-foreground:  #7E8494;   /* descriptions, labels, muted text */
--disabled:          #565B6B;   /* disabled states, placeholder hints */
--border:            rgba(255,255,255,0.06);  /* card borders, dividers */
--input-border:      rgba(255,255,255,0.08);  /* form input borders */
--hover-border:      rgba(255,255,255,0.12);  /* border on hover */
--success:           #3ECF8E;   /* pass, high score ≥80, completed */
--success-bg:        rgba(62,207,142,0.08);
--warning:           #E5A93B;   /* medium score 65–79, pending */
--warning-bg:        rgba(229,169,59,0.08);
--error:             #EF6B6B;   /* fail, low score <65, rejected */
--error-bg:          rgba(239,107,107,0.08);
--error-border:      rgba(239,107,107,0.2);
--accent-bg-faint:   rgba(124,106,239,0.10);  /* badge bg, faint highlights */
--accent-bg-medium:  rgba(124,106,239,0.15);  /* active nav item bg */
--overlay:           rgba(0,0,0,0.6);          /* modal/dialog backdrop */
```

### 2.2 Semantic Score Colors

Always use this function (or equivalent) for any score display:

```ts
function getScoreColor(score: number): string {
  if (score >= 80) return '#3ECF8E';   // success — green
  if (score >= 65) return '#E5A93B';   // warning — amber
  return '#EF6B6B';                    // error — red
}
```

Score colors apply to: text values, progress bar fills, badge text. Never fill a whole cell or card background based on score — only text/border/bar fill.

### 2.3 Status Badge Pattern

```tsx
const statusConfig = {
  shortlisted:  { label: 'Shortlisted',  color: '#7C6AEF', bg: '#1D202A' },
  under_review: { label: 'Under Review', color: '#E5A93B', bg: 'rgba(229,169,59,0.08)' },
  rejected:     { label: 'Rejected',     color: '#EF6B6B', bg: 'rgba(239,107,107,0.08)' },
  hired:        { label: 'Hired',        color: '#3ECF8E', bg: 'rgba(62,207,142,0.08)' },
  advanced:     { label: 'Advanced',     color: '#3ECF8E', bg: 'rgba(62,207,142,0.08)' },
  not_started:  { label: 'Not Started',  color: '#7E8494', bg: '#1D202A' },
  in_progress:  { label: 'In Progress',  color: '#E5A93B', bg: 'rgba(229,169,59,0.08)' },
  completed:    { label: 'Completed',    color: '#3ECF8E', bg: 'rgba(62,207,142,0.08)' },
};

// Render:
<span className="text-xs px-2 py-0.5 rounded"
  style={{ color: s.color, backgroundColor: s.bg }}>
  {s.label}
</span>
```

### 2.4 Chart / Dashboard Colors

```
Primary series:   #7C6AEF
Secondary series: #9585F5
Funnel mid:       #6366A0
Funnel light:     #8485B0
Positive data:    #3ECF8E
Warning data:     #E5A93B
Negative data:    #EF6B6B
```

### 2.5 Code Editor Colors

```
Editor bg:      #0D1017
Editor border:  #1A1D27
Line number bg: #0A0D14
Line numbers:   #3D4250
Code text:      #D4D8E4
Console bg:     #080A10
Console text:   #8A8F9E
Console pass:   #3ECF8E
```

---

## 3. Typography

- **Font family**: `Inter`, system-ui, -apple-system, sans-serif
- **Base size**: 16px (`--font-size: 16px`)
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- Use `fontWeight: 600` for headings, `fontWeight: 500` for labels/buttons, `fontWeight: 400` for body

### Typography Scale

| Element | Size | Weight | Color |
|---|---|---|---|
| Page title (h1) | `1.375rem` | 600 | `#E2E4EB` |
| Section heading (h2) | `0.9375rem` | 600 | `#E2E4EB` |
| Card title (h3) | `0.9375rem` | 600 | `#E2E4EB` |
| Body / table cell | `0.875rem` (text-sm) | 400 | `#E2E4EB` |
| Secondary text | `0.875rem` | 400 | `#7E8494` |
| Labels / captions | `0.75rem` (text-xs) | 400–500 | `#7E8494` |
| Buttons | `0.875rem` | 500 | `#FFFFFF` or `#E2E4EB` |
| Hero headline | `clamp(1.5rem, 5vw, 2.5rem)` | 600 | `#E2E4EB` |

**Never use color alone** to create visual hierarchy — combine weight + size + color.

---

## 4. Spacing & Layout System

### 4.1 Page Wrapper Pattern

All recruiter dashboard pages use:
```tsx
<div className="p-4 sm:p-6 max-w-6xl">
```
- `p-4` on mobile, `p-6` on sm+ screens
- `max-w-6xl` caps content width for readability on wide screens
- No `max-w` on full-width tables/IDE screens

Candidate pages use:
```tsx
<div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
```

### 4.2 Section Spacing

- Between page title and first section: `mb-6`
- Between sections/cards: `mb-6` or `gap-4`/`gap-6` in grids
- Inner card padding: `p-5` or `p-6` (use `px-6 py-4` for card headers with borders)
- Input label to input: `mb-1.5`
- Form field spacing: `space-y-4`
- KPI card internal spacing: `mb-3` between top and value

### 4.3 Border Radius

All cards, inputs, buttons use `rounded-lg` (= `0.625rem`). Modals use `rounded-xl`. Avatar circles use `rounded-full`.

### 4.4 Shadows

```
Card:     boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
Elevated: boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
Focus:    boxShadow: '0 0 0 2px #9585F5'
```

---

## 5. Component Patterns

### 5.1 Cards

```tsx
<div
  className="rounded-lg p-6 border transition-colors"
  style={{
    backgroundColor: '#171921',
    borderColor: 'rgba(255,255,255,0.06)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  }}
>
```

**KPI cards** additionally use `borderTop: '3px solid #7C6AEF'` as accent.

**Hover state on clickable cards:**
```tsx
onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
```

### 5.2 Buttons

**Primary (filled):**
```tsx
<button
  className="px-5 py-2.5 text-sm text-white rounded transition-colors cursor-pointer"
  style={{ backgroundColor: '#7C6AEF' }}
  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#9585F5'; }}
  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#7C6AEF'; }}
>
```

**Secondary (outlined):**
```tsx
<button
  className="px-5 py-2 text-sm rounded border transition-colors cursor-pointer"
  style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#7E8494' }}
  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1D202A'; }}
  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
>
```

**Destructive (reject):**
```tsx
style={{ backgroundColor: '#EF6B6B', color: '#fff' }}
onMouseEnter: backgroundColor → '#FF8080'
```

**Disabled:**
```tsx
disabled={true}
className="... disabled:cursor-not-allowed disabled:opacity-60"
```

**Full-width action button** (inside cards/forms):
```tsx
className="w-full py-2.5 text-sm text-white rounded transition-colors cursor-pointer"
```

### 5.3 Form Inputs

```tsx
<input
  className="w-full px-3 py-2.5 text-sm rounded border outline-none"
  style={{
    backgroundColor: '#13151D',
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#E2E4EB',
  }}
  onFocus={e => {
    e.target.style.borderColor = '#7C6AEF';
    e.target.style.backgroundColor = '#171921';
  }}
  onBlur={e => {
    e.target.style.borderColor = 'rgba(255,255,255,0.08)';
    e.target.style.backgroundColor = '#13151D';
  }}
/>
```

**Select dropdowns** use the same background/border style. Always add `appearance-none` and a `<ChevronDown>` icon overlay (size 13, color `#7E8494`, `pointer-events-none`, `absolute right-2 top-1/2 -translate-y-1/2`).

**Labels:**
```tsx
<label className="block text-sm mb-1.5" style={{ color: '#7E8494', fontWeight: 500 }}>
```

### 5.4 Tables

```tsx
// Container (with horizontal scroll for mobile)
<div className="rounded-lg border overflow-hidden"
  style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
  <div className="overflow-x-auto">
    <table className="w-full min-w-[600px]">
      <thead>
        <tr style={{ backgroundColor: '#1D202A' }}>
          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
            style={{ color: '#7E8494' }}>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-t transition-colors cursor-pointer"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; }}>
          <td className="px-4 sm:px-6 py-3.5">
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

- Table headers: `text-xs uppercase tracking-wider` in `#7E8494` on `#1D202A` background
- Table rows: `py-3.5` padding, hover `rgba(255,255,255,0.04)` bg
- Always use `overflow-x-auto` with `min-w-[600px]` on the table for mobile

### 5.5 Avatar / Initials

```tsx
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Render:
<div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
  style={{ backgroundColor: '#7C6AEF' }}>
  {getInitials(name)}
</div>
```

Clickable avatars get hover ring: `onMouseEnter: boxShadow = '0 0 0 2px #9585F5'`

### 5.6 Score Bars

```tsx
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm" style={{ color: '#7E8494' }}>{label}</span>
        <span className="text-sm font-semibold" style={{ color: getScoreColor(value) }}>
          {value}/100
        </span>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: '#1D202A' }}>
        <div className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: '#9585F5' }} />
      </div>
    </div>
  );
}
```

### 5.7 Collapsible Sections

```tsx
function CollapsibleSection({ title, score, summary }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border rounded-lg overflow-hidden"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <button className="w-full flex items-center justify-between px-5 py-3.5 transition-colors cursor-pointer"
        style={{ backgroundColor: '#171921' }}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#171921'; }}>
        <span className="text-sm font-medium" style={{ color: '#E2E4EB' }}>{title}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: getScoreColor(score) }}>{score}/100</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>
      {open && (
        <div className="px-5 py-4 border-t"
          style={{ backgroundColor: '#171921', borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#7E8494' }}>{summary}</p>
        </div>
      )}
    </div>
  );
}
```

### 5.8 Confirmation Modal

```tsx
// Backdrop: fixed inset-0 z-50 flex items-center justify-center px-4
// style: backgroundColor: 'rgba(0,0,0,0.6)'
// Modal: rounded-xl shadow-xl w-full max-w-md p-6 relative
// style: backgroundColor: '#171921', border: '1px solid rgba(255,255,255,0.06)'
// Has X close button at top-right, title, message, and 2 action buttons (right-aligned)
```

### 5.9 Error / Alert Banners

```tsx
<div className="mb-4 px-3 py-2.5 rounded text-sm border"
  style={{
    backgroundColor: 'rgba(239,107,107,0.08)',
    borderColor: 'rgba(239,107,107,0.2)',
    color: '#EF6B6B',
  }}>
  {errorMessage}
</div>
```

### 5.10 Skill Tags

```tsx
<span className="text-xs px-2.5 py-1 rounded border"
  style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#7E8494', backgroundColor: '#1D202A' }}>
  React
</span>
```

### 5.11 Hardware / Status Indicators

```tsx
<div className="flex items-center gap-3 px-4 py-3 rounded-lg border"
  style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: '#171921' }}>
  <Icon size={15} style={{ color: ok ? '#3ECF8E' : '#EF6B6B' }} />
  <span className="text-sm" style={{ color: '#7E8494' }}>{label}</span>
  <span className="ml-auto text-xs px-2 py-0.5 rounded"
    style={{ color: ok ? '#3ECF8E' : '#EF6B6B', backgroundColor: ok ? 'rgba(62,207,142,0.08)' : 'rgba(239,107,107,0.08)' }}>
    {ok ? '✓ Ready' : '✗ Not Available'}
  </span>
</div>
```

---

## 6. Layout Architecture

### 6.1 Recruiter Layout (`RecruiterLayout.tsx`)

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (w-60, bg #0B0D13)   │  Header (h-14)      │
│  ─────────────────────────    │  bg #13151D          │
│  Logo block (px-6 py-5)       ├─────────────────────┤
│  Nav items (px-3 py-4)        │                      │
│  User block (bottom, px-3)    │  <Outlet /> (main)   │
│                               │  overflow-y-auto     │
└─────────────────────────────────────────────────────┘
```

- Root: `flex h-screen overflow-hidden` with `backgroundColor: '#0F1117'`
- Sidebar: `fixed inset-y-0 left-0 z-50 w-60` on mobile; `relative lg:flex-shrink-0` on desktop
- Mobile: sidebar slides in from left (`translate-x-0` / `-translate-x-full`), overlay backdrop `rgba(0,0,0,0.6)` behind it
- Header: always visible, `h-14`, contains hamburger (mobile only) + Bell icon + Avatar

**Sidebar nav item active state:**
```tsx
// Active: left border + subtle purple bg
style={{ borderColor: '#7C6AEF', backgroundColor: 'rgba(124,106,239,0.15)' }}
className="border-l-2 pl-2.5 text-white"

// Hover (inactive):
onMouseEnter: backgroundColor='rgba(124,106,239,0.1)', color='#E2E4EB', borderLeft='2px solid #7C6AEF', paddingLeft='10px'
onMouseLeave: clear all overrides
```

**Logo block:**
```tsx
// Purple square icon (w-8 h-8, bg #7C6AEF) with 'R' + "RecruitAI" text
```

### 6.2 Candidate Layout (`CandidateLayout.tsx`)

- No sidebar — top-only navigation bar (`h-14`, `bg: '#13151D'`)
- Content area: `max-w-6xl mx-auto px-4 sm:px-6`
- Center of header: stage progress indicator (only shown during active assessment stages, hidden on lobby/confirmation/profile)

**Progress indicator:**
```tsx
// 3 stages: Voice Interview → Coding Test → System Design
// Each stage: circle (w-5 h-5 rounded-full) + label (hidden md:inline)
// Active: bg #7C6AEF, color white
// Completed: bg #3ECF8E, color white
// Upcoming: bg #1D202A, color #7E8494, opacity 0.6
// Connector: w-6 h-px, bg rgba(255,255,255,0.1)
// Hidden on sm: (only desktop shows labels, sm shows circles)
```

### 6.3 Public Pages (Homepage, Login, SignUp)

- Full viewport, `backgroundColor: '#0F1117'`
- Header: `max-w-6xl mx-auto px-4 sm:px-6 h-16`
- Centered card for login/signup: `w-full max-w-sm`, `px-5 sm:px-8 py-8 sm:py-10`
- Homepage hero: `max-w-3xl text-center mx-auto`

---

## 7. Responsiveness Strategy

### Breakpoints (Tailwind defaults)
- `sm`: 640px — most layout shifts happen here
- `lg`: 1024px — sidebar becomes persistent (no hamburger)

### Grid Layouts

| Content | Mobile | sm+ | lg+ |
|---|---|---|---|
| KPI cards | `grid-cols-2` | `grid-cols-2` | `grid-cols-4` |
| Feature cards (homepage) | `grid-cols-1` | `grid-cols-3` | `grid-cols-3` |
| Candidate profile | `flex-col` | `flex-col` | `flex-row` (35/65 split) |
| Assessment tasks | `grid-cols-1` | `grid-cols-3` | `grid-cols-3` |
| Settings form | `w-full` | `max-w-2xl` | `max-w-2xl` |
| Step flow (How it works) | `grid-cols-1` | `grid-cols-2` | `grid-cols-4` |

### Text Responsiveness
- Hero headline: `clamp(1.5rem, 5vw, 2.5rem)`
- KPI values: `text-2xl sm:text-3xl`
- Padding: always `p-4 sm:p-6` or `px-4 sm:px-6`
- Gap: `gap-3 sm:gap-4`

### Tables on Mobile
- Always wrap `<table>` in `<div className="overflow-x-auto">` 
- Set `min-w-[600px]` on the table itself
- Cell padding: `px-4 sm:px-6`

### Navigation on Mobile
- Recruiter: hamburger button in header triggers `sidebarOpen` state, overlay closes sidebar on click
- Candidate: progress indicator labels hidden on `< md`; only circle numbers show on `sm`
- Sidebar overlay: `className="fixed inset-0 z-40 lg:hidden"`

### Hidden Elements
- Logo text label: `hidden sm:inline` for candidate header
- Table columns: for very narrow screens consider `hidden sm:table-cell` on less critical columns
- Page subtitle below heading: always visible
- Filter bars: `flex-wrap` so filters stack on mobile

---

## 8. Interaction & Animation Rules

- **Transition on all interactive elements**: `transition: all 0.2s ease` (set globally on `a, button, input, select, textarea`)
- **Cursor**: all clickable elements must have `cursor-pointer`
- **Hover effects** (implement via onMouseEnter/Leave inline, not Tailwind hover:):
  - Buttons: shift `backgroundColor` from primary to hover shade
  - Table rows: `rgba(255,255,255,0.04)` background
  - Sidebar items: see §6.1
  - Clickable cards: border lightens to `rgba(255,255,255,0.12)`
  - Icon buttons (Bell, LogOut, etc.): color shifts from `#7E8494` to `#7C6AEF`
  - Avatars: `boxShadow = '0 0 0 2px #9585F5'`
- **Input focus**: border → `#7C6AEF`, background → `#171921`
- **No heavy animations**: no keyframe animations, no slide-ins on page transitions — only subtle hover/focus transitions

### Custom Scrollbar (global)
```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
```

---

## 9. Application Routes & Navigation Flow

```
/                           → Homepage (public)
/login                      → Login (role selector → routes below)
/signup                     → SignUp

RECRUITER FLOW (/recruiter/*) — RecruiterLayout wrapper
├── /recruiter              → Dashboard (KPI + Funnel + Recent Activity)
├── /recruiter/candidates   → Candidate Leaderboard table
├── /recruiter/candidates/:id         → Candidate Profile (scores + collapsibles)
├── /recruiter/candidates/:id/interview   → Interview Analytics (transcript + charts)
├── /recruiter/candidates/:id/assessment  → Assessment Deep-Dive (code review)
├── /recruiter/candidates/:id/system-design → System Design Review
├── /recruiter/candidates/:id/cv      → CV Viewer
├── /recruiter/profile      → Recruiter Profile page
├── /recruiter/interviews   → All Interviews list
├── /recruiter/assessments  → All Assessments list
└── /recruiter/settings     → Settings (Job Posting + CV Parsing tabs)

CANDIDATE FLOW (/candidate/*) — CandidateLayout + CandidateContext wrapper
├── /candidate              → Assessment Lobby (hardware check + task cards)
├── /candidate/voice-interview  → AI Voice Interview (push-to-talk + transcript)
├── /candidate/coding-test      → IDE (problem + editor + console + test results)
├── /candidate/system-design    → System Design (written + diagram tabs)
├── /candidate/confirmation     → Submission Confirmation
└── /candidate/profile          → Candidate Profile (CV upload + personal info)
```

### Login Routing Logic
```ts
if (role === 'recruiter') navigate('/recruiter');
else navigate('/candidate');
```

### Inter-page Navigation
- Clicking a candidate row in `/recruiter/candidates` → `/recruiter/candidates/:id`
- Tabs on candidate profile (`/recruiter/candidates/:id`) → navigate to `/interview`, `/assessment`, `/system-design`, `/cv` sub-routes
- Back buttons always use `navigate(-1)` or hardcoded parent path
- Assessment tasks in lobby → navigate to respective assessment route, on complete → back to `/candidate`
- Final task complete → `/candidate/confirmation`

---

## 10. Page-by-Page Reference

### Homepage
- Announcement badge: inline-flex, border, `rgba(124,106,239,0.1)` bg, `#7C6AEF` text, `CheckCircle` icon
- CTA row: `flex flex-wrap gap-3 sm:gap-4 justify-center`
- Feature cards: icon in `#1D202A` square, title in `#E2E4EB`, description in `#7E8494`
- "How RecruitAI Works" section: 4-step horizontal flow, numbered circles in `#7C6AEF`, step title in `#E2E4EB`, description in `#7E8494`
- Footer: border-top `rgba(255,255,255,0.06)`, `#7E8494` text

### Login / SignUp
- Centered card (`max-w-sm`), `#171921` bg, subtle box shadow
- Role selector: two buttons acting as a toggle (`recruiter` / `candidate`), active state uses `#7C6AEF` bg
- Error banner uses error color pattern (see §5.9)
- Form submit on `onSubmit` (prevent default)

### Recruiter Dashboard
- Page heading + subtitle pattern used on every recruiter page
- KPI cards: `grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4`
- Funnel: horizontal bars, label (w-24 sm:w-36), bar (flex-1), percentage (w-10 text-right)
- Recent Activity table: wrapped in card, `overflow-x-auto`, sortable

### Candidate Leaderboard (`Candidates.tsx`)
- Filter bar: `flex flex-wrap gap-3`, search + role dropdown + round dropdown
- Table columns: Rank, Name+avatar, Role, CV/Coding/Communication/Overall scores, Status badge, View Profile + View CV buttons
- Overall Score column sortable (asc/desc toggle with `ChevronUp/Down/ChevronsUpDown` icons)

### Candidate Profile (`CandidateProfile.tsx`)
- Two-column on lg: `flex flex-col lg:flex-row gap-6`
- Left (35%): avatar, personal info, skills tags, timeline
- Right (65%): 4 score summary cards + 3 collapsible sections + action buttons
- Action buttons at bottom: "Proceed to Next Round" (primary) + "Reject" (destructive outlined) each open a ConfirmModal

### Interview Analytics
- Audio player bar at top (flat, nav-colored controls)
- Two-column: transcript (scrollable, with green/amber left borders on highlighted lines) + score charts
- Charts: horizontal bars in navy/purple palette

### Assessment Deep-Dive
- 50/50 split: code editor panel (dark, `#0D1017`) left + review panel (white/dark) right
- Code panel: language badge, submission time, line numbers, syntax-highlighted code (no run button)
- Review panel: score rows (label + bar + %) + AI written evaluation card

### System Design Review
- Single column: scenario callout card (left border `#7C6AEF`, `rgba(124,106,239,0.1)` bg) + candidate response + AI feedback sections + verdict card

### Assessment Lobby
- Welcome heading + subtitle (job role)
- Hardware check row: `flex flex-col sm:flex-row gap-3`
- Task cards: `grid grid-cols-1 sm:grid-cols-3 gap-4`
- Each task card: top-border accent, icon, status badge, begin button (disabled if mic missing for voice task)
- Bottom note: 48hr timeline, muted text

### Voice Interview
- Full-screen distraction-free: centered layout, dark bg
- Center: circular pulsing indicator + question card + transcript area
- Bottom: Push-to-Talk button (navy → red when recording)
- State machine: `idle → recording → processing → done`
- Top-right: "Having issues?" link → modal with text-mode fallback

### Coding Test (IDE)
- 3-panel: left 30% (problem), center 50% (editor), right 20% (test results)
- Problem panel: title, difficulty badge (green/amber/red text), description, examples
- Editor panel: `#0D1017` bg, language selector, Run Code button, console output below
- Test panel: pass/fail rows + Submit Solution button
- Top bar: problem title + countdown timer + candidate name

### System Design
- Scenario callout card + 2 tabs (Written / Diagram)
- Written tab: large textarea with placeholder
- Diagram tab: simple drag-drop canvas (Server, DB, Load Balancer, Client shapes)
- Bottom bar: word count + Submit Response

### Confirmation Page
- Centered: large green checkmark icon + heading + subtitle + 3-step timeline + Return button

### Settings
- Two tabs: "Job Posting" and "CV Parsing Rules"
- Job Posting: Job Details card + Assessment Weights card (3 sliders, must total 100%) + Question Bank card
- CV Parsing: table of keyword rules (Skill, Department, Weight, Active toggle) + Add New Rule button

### CV Viewer
- Back button: `← Back to Candidates`
- Sections: Name/contact header, Skills tags, Education timeline, Experience timeline, Projects
- Same sidebar/header as rest of recruiter dashboard

### Profile Pages (Recruiter + Candidate)
- Recruiter profile: name, role, email, company, account settings
- Candidate profile: name, role, email, applied position + CV section (upload/view)
- CV section states: empty (show upload CTA) or uploaded (show filename + date + green badge + View My CV button)

---

## 11. Candidate Names (Mock Data)

Use these Pakistani names consistently across ALL recruiter-side screens. Same name = same candidate everywhere:

| ID | Name |
|---|---|
| 1 | Hamza Tariq |
| 2 | Ayesha Noor |
| 3 | Bilal Raza |
| 4 | Fatima Malik |
| 5 | Usman Qureshi |
| 6 | Zara Ahmed |
| 7 | Saad Hussain |
| 8 | Hira Baig |
| 9 | Omar Farooq |
| 10 | Maham Siddiqui |

---

## 12. Context & State Management

- `AuthContext`: provides `user` (`{ name, email, role }`) and `login()` / `logout()` functions. Consumed on every layout and page that needs user info.
- `CandidateContext`: (`CandidateProvider` wraps all `/candidate/*` routes) tracks task completion status: `voiceStatus`, `codingStatus`, `systemDesignStatus` — each `'not_started' | 'in_progress' | 'completed'`. Lobby reads this to render task card states and lock/unlock begin buttons.

---

## 13. New Features / Extensions — Rules

When adding screens, features, or components beyond the prototype:

1. **Always use the Midnight Slate palette** — no new accent colors unless they fit semantic roles (success/warning/error)
2. **Match card anatomy** — same `#171921` bg, same border, same shadow
3. **Match interaction patterns** — onMouseEnter/Leave inline, `transition-colors`, `cursor-pointer`
4. **Add to routes** — update `routes.tsx` and the relevant layout's nav items if it's a top-level page
5. **Responsive by default** — all new layouts start mobile-first, test `p-4 sm:p-6`, `grid-cols-1 sm:grid-cols-N`, `overflow-x-auto` on tables
6. **Icons** — Lucide only, line style, `size={14–18}` for inline, `size={18–22}` for card icons
7. **No gradients, no glassmorphism, no glow** — keep the professional, flat-dark aesthetic
8. **Modal overlays** — always `fixed inset-0 z-50`, `rgba(0,0,0,0.6)` backdrop, `max-w-md` card
9. **New nav items** — add to `navItems` array in `RecruiterLayout.tsx` with Lucide icon + route
10. **Form validation** — show inline error banners (§5.9), never silent failures

---

## 14. Checklist Before Submitting Any Component

- [ ] All colors use hex values or `rgba()` — no Tailwind color utilities
- [ ] All interactive elements have `cursor-pointer` and hover state (onMouseEnter/Leave)
- [ ] Inputs have `onFocus` border color change to `#7C6AEF`
- [ ] Responsive: tested at 375px (mobile), 640px (sm), 1024px (lg)
- [ ] Tables wrapped in `overflow-x-auto` with `min-w-[NNNpx]`
- [ ] Page content wrapped in `p-4 sm:p-6`
- [ ] Card shadow, border, and `#171921` background applied
- [ ] Score colors use `getScoreColor()` (≥80 green, ≥65 amber, <65 red)
- [ ] Status badges use correct `statusConfig` color + bg pairs
- [ ] Candidate names match the Pakistani names list (§11)
- [ ] Modal has overlay backdrop, X close button, and Cancel + Confirm actions
- [ ] `transition-colors` or `transition: all 0.2s ease` on all interactive elements