I need you to make the following changes to the existing RecruitAI prototype. Apply every change carefully across all screens for full consistency.

1. Complete Recolor — New Color Scheme
Replace the entire color scheme across every single screen with this new palette. Do not leave any old colors behind:

#1D1128 — Darkest purple. Use this for the sidebar background, top navigation bars, and footer. Previously this was Deep Navy #1A202C.
#5941A9 — Rich purple. Use this for all primary buttons, active sidebar items, links, and key interactive elements. Previously this was Action Blue #2B6CB0.
#6D72C3 — Medium periwinkle. Use this for hover states on buttons, secondary accents, score bar fills, progress indicators, and chart colors. Previously used for lighter blue accents.
#514F59 — Muted dark gray-purple. Use this for body text, secondary labels, table text, and subtitle text. Previously this was standard gray text.
#E5D4ED — Soft lavender. Use this for page backgrounds, card backgrounds, input field backgrounds, and any surface that was previously light gray #F7FAFC or white. Cards can remain white #FFFFFF but with a subtle #E5D4ED border.

Make sure the sidebar is #1D1128, primary action buttons are #5941A9, hover states shift to #6D72C3, text is #514F59, and backgrounds/surfaces are #E5D4ED. Keep green #38A169, amber #D69E2E, and red #E53E3E only for score indicators and status badges — do not replace those.

2. Hover Effects and Pointer Cursor on All Clickable Elements
For every button, link, table row, card, sidebar item, tab, toggle, icon button, and any other clickable element across all screens:

Change the cursor to a pointer on hover.
Add a visible hover state: buttons should shift background color from #5941A9 to #6D72C3. Outlined buttons should fill lightly with #E5D4ED. Sidebar items should show a left accent border in #6D72C3 with a slightly lighter background. Table rows should show a subtle #E5D4ED background highlight on hover. Clickable cards should show a slight border color change to #6D72C3 on hover.
The hover transition should feel smooth and immediate — no delays.


3. View CV Button for Each Candidate (Recruiter Side)
On the Candidate Ranking Leaderboard screen (where the recruiter sees the full table of all candidates), add a "View CV" button for each candidate row, alongside the existing "View Profile" button. Clicking "View CV" navigates the recruiter to a dedicated CV Viewer page for that candidate. This CV Viewer page should display the candidate's CV in a clean, readable format — showing their name, contact info, education timeline, work experience timeline, skills as plain outlined tags, and any projects listed. Add a back button at the top left labeled "← Back to Candidates." Style the CV Viewer page consistently with the rest of the recruiter dashboard (same sidebar, same header, same color scheme).

4. Candidate CV Upload and View (Candidate Side)
On the Candidate's own profile/account page (accessible by clicking their avatar), add a CV section. It should include:

An "Upload CV" button that opens a file picker (accepts PDF and DOCX). After upload, show the file name and upload date with a green "Uploaded" badge.
A "View My CV" button that opens the uploaded CV in the same clean CV Viewer format described above.
If no CV has been uploaded yet, show a placeholder message: "No CV uploaded yet. Upload your CV so recruiters can review it." with the Upload button prominently below.


5. Clickable User Avatar — Navigates to Profile Page
The user avatar or logo that appears beside the logout button (present on every screen for both Recruiter and Candidate) must be made fully clickable. Clicking it should navigate to the current user's own profile/about page. For the Recruiter, this page shows their name, role (Recruiter), email, company, and account settings. For the Candidate, this page shows their name, role (Candidate), email, applied position, and their CV section (as described in Change 4). Add a pointer cursor and a subtle hover ring effect in #6D72C3 around the avatar to indicate it is clickable.

6. "Proceed to Next Round" and "Reject" Buttons — Confirmation Dialog
On the Detailed Candidate Profile page (the recruiter's view of an individual candidate), the "Proceed to Next Round" and "Reject" buttons currently do nothing. Fix this by adding a confirmation dialog modal for each:

Clicking "Proceed to Next Round" opens a modal that says: "Move [Candidate Name] to the next round?" with two buttons — "Confirm" (filled #5941A9) and "Cancel" (outlined). On confirming, close the modal and change the candidate's status badge on this page to "Advanced" in green.
Clicking "Reject" opens a modal that says: "Are you sure you want to reject [Candidate Name]? This action cannot be undone." with two buttons — "Yes, Reject" (filled red #E53E3E) and "Cancel" (outlined). On confirming, close the modal and change the candidate's status badge to "Rejected" in red.

The modal should appear centered on screen with a dark semi-transparent overlay behind it. Style it consistently with the rest of the design.

7. Rename All Candidates to Pakistani Names
Replace every candidate name shown anywhere in the recruiter's view — in the leaderboard table, candidate profile pages, interview playback screens, assessment screens, recent activity tables, and anywhere else a candidate name appears — with realistic Pakistani names. Use these names consistently: Hamza Tariq, Ayesha Noor, Bilal Raza, Fatima Malik, Usman Qureshi, Zara Ahmed, Saad Hussain, Hira Baig, Omar Farooq, Maham Siddiqui. Make sure the same name refers to the same candidate across all screens — do not mix them up.

8. "See How It Works" Button — Scroll to Section on Homepage
On the Homepage, the "See How It Works" button currently navigates to the login page. Change this behavior: clicking it should smoothly scroll down to a section on the same homepage that explains the RecruitAI flow.
If this section does not already exist, add it to the homepage just before the footer. The section should be titled "How RecruitAI Works" and contain four steps displayed as a horizontal step-by-step flow with numbered icons and short descriptions:

Step 1 — Post a Job: Recruiter creates a job posting and sets assessment weights.
Step 2 — Candidates Apply & Assess: Applicants complete the voice interview, coding test, and system design challenge.
Step 3 — AI Evaluates: RecruitAI automatically scores CVs, code, and communication.
Step 4 — Ranked Results: Recruiters receive a ranked leaderboard and review detailed profiles.

Style this section with a #E5D4ED background, #1D1128 heading text, step numbers in #5941A9, and step descriptions in #514F59. The "See How It Works" button on the hero section should anchor-link to this section and trigger a smooth scroll.

Apply all 8 changes fully and consistently across the entire prototype. Do not alter anything else — layout, screen structure, content, and existing functionality should remain exactly as they are.