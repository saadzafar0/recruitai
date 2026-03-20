# RecruitAI — Color Scheme (Midnight Slate)

A dark, professional palette designed for clarity and visual hierarchy without the typical "AI neon" look.

---

## Backgrounds

| Role                  | Hex / Value                    | Usage                                      |
|-----------------------|--------------------------------|--------------------------------------------|
| Page Background       | `#0F1117`                      | Main page/app background                   |
| Card / Surface        | `#171921`                      | Cards, panels, modals, dropdowns           |
| Surface Elevated      | `#1D202A`                      | Alternate surface, icon backgrounds, fills |
| Sidebar               | `#0B0D13`                      | Sidebar navigation background              |
| Header / Top Bar      | `#13151D`                      | Top navigation bar, candidate header       |
| Input Background      | `#13151D`                      | Form inputs, selects, textareas            |
| Input Focused         | `#171921`                      | Input background on focus                  |

## Text

| Role                  | Hex        | Usage                                      |
|-----------------------|------------|--------------------------------------------|
| Primary Text          | `#E2E4EB`  | Headings, titles, main body text           |
| Secondary Text        | `#7E8494`  | Descriptions, labels, muted text           |
| Muted / Disabled      | `#565B6B`  | Disabled states, placeholder hints         |

## Brand / Accent

| Role                  | Hex        | Usage                                      |
|-----------------------|------------|--------------------------------------------|
| Primary Accent        | `#7C6AEF`  | Buttons, links, active states, logo bg     |
| Primary Hover         | `#9585F5`  | Button hover, secondary accent             |
| Light Accent BG       | `rgba(124,106,239,0.1)`  | Badge backgrounds, faint highlights |
| Medium Accent BG      | `rgba(124,106,239,0.15)` | Active nav item background          |

## Semantic Colors

| Role                  | Hex / Value                     | Usage                              |
|-----------------------|---------------------------------|------------------------------------|
| Success               | `#3ECF8E`                       | Pass, high score, completed        |
| Success BG            | `rgba(62,207,142,0.08)`         | Success badge/card background      |
| Warning               | `#E5A93B`                       | Medium score, pending, caution     |
| Warning BG            | `rgba(229,169,59,0.08)`         | Warning badge/card background      |
| Error / Destructive   | `#EF6B6B`                       | Fail, low score, rejected, errors  |
| Error BG              | `rgba(239,107,107,0.08)`        | Error badge/card background        |
| Error Border          | `rgba(239,107,107,0.2)`         | Error message borders              |

## Borders & Dividers

| Role                  | Value                           | Usage                              |
|-----------------------|---------------------------------|------------------------------------|
| Default Border        | `rgba(255,255,255,0.06)`        | Card borders, dividers, separators |
| Input Border          | `rgba(255,255,255,0.08)`        | Form input borders                 |
| Hover Border          | `rgba(255,255,255,0.12)`        | Border on hover interactions       |
| Focus Border          | `#7C6AEF`                       | Input/element focus ring           |

## Shadows

| Role                  | Value                           | Usage                              |
|-----------------------|---------------------------------|------------------------------------|
| Card Shadow           | `0 1px 3px rgba(0,0,0,0.3)`    | Cards, panels                      |
| Elevated Shadow       | `0 2px 8px rgba(0,0,0,0.25)`   | Modals, popovers                   |
| Accent Glow           | `0 0 0 2px #9585F5`            | Avatar/button focus ring           |

## Code Editor

| Role                  | Hex        | Usage                              |
|-----------------------|------------|------------------------------------|
| Editor Background     | `#0D1017`  | Code editor panel                  |
| Editor Border         | `#1A1D27`  | Editor panel border                |
| Line Number BG        | `#0A0D14`  | Line number gutter                 |
| Line Numbers          | `#3D4250`  | Line number text                   |
| Code Text             | `#D4D8E4`  | Default code text                  |
| Console BG            | `#080A10`  | Console/output background          |
| Console Text          | `#8A8F9E`  | Default console output             |
| Console Pass          | `#3ECF8E`  | Test pass output                   |

## Chart / Dashboard

| Role                  | Hex        | Usage                              |
|-----------------------|------------|--------------------------------------------|
| Chart Primary         | `#7C6AEF`  | Primary data series                |
| Chart Secondary       | `#9585F5`  | Secondary data series              |
| Chart Funnel Mid      | `#6366A0`  | Funnel middle segment              |
| Chart Funnel Light    | `#8485B0`  | Funnel light segment               |
| Chart Green           | `#3ECF8E`  | Success/positive data              |
| Chart Amber           | `#E5A93B`  | Warning/medium data                |
| Chart Red             | `#EF6B6B`  | Error/negative data                |

## Modal Backdrops

| Value                           | Usage                              |
|---------------------------------|------------------------------------|
| `rgba(0,0,0,0.6)`              | Modal/dialog backdrop overlay      |

---

## Design Principles

1. **Dark-first**: Every surface uses a dark tone; text is light
2. **Muted accents**: Indigo purple (`#7C6AEF`) — confident but not flashy
3. **Semantic clarity**: Green/amber/red consistently indicate score tiers
4. **Subtle borders**: Translucent white borders blend without harsh lines
5. **Smooth transitions**: All interactive elements have `0.2s ease` transitions
6. **Custom scrollbars**: Thin, dark-themed scrollbars match the overall aesthetic
