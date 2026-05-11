Here is the updated Markdown with the `regcred` task removed:

## 🏃 Sprint 2 — Microservices, Vapi & CV Pipeline

**Saad Zafar:**
* Set up GitHub Actions CI/CD — use **`deploy-ec2.yml`** (Docker Hub → two EC2); legacy **`deploy-eks-deprecated.yml`** for manual EKS-era image builds only
* Write all 4 Kubernetes deployment + service manifests (`nextjs-web.yaml`, `executor-worker.yaml`, `evaluator-worker.yaml`, `cv-parser-worker.yaml`)
* Create Kubernetes secrets for all environment variables (Supabase, Vapi, Gemini, Judge0 keys)
* Build the `api/v1/webhooks/vapi.ts` endpoint — receive the Vapi call-end payload, extract the transcript, and save it to the correct candidate record in Supabase

**Bilal Kashif:**
* Build the `VapiInterviewRoom` component using the `@vapi-ai/web` SDK — handle microphone permissions and start/stop call logic
* Build the `interview/[id].tsx` page with three sections: Voice Interview, Coding Round, and System Design — this is the main candidate-facing interview page

**Mohammad Hamza Iqbal:**
* Wire the S3 upload utility into the candidate apply flow so CV PDFs are uploaded to S3 on form submission
* Build the `api/v1/submissions` route — receives code submissions from the frontend and pushes a job onto the BullMQ queue

**Muhammad Qatada:**
* Refine and finalize the Vapi assistant system prompt — technical interviewer persona, dynamic question flow, and fallback behaviors
* Set up BullMQ connection logic (`lib/bull.ts`) and configure Redis so queues are ready to accept jobs
* Build the `cv-parser-worker` — pull PDF from S3, extract text, send to Gemini, parse into structured JSON, save result to Supabase

---

## 🏃 Sprint 3 — Execution, Grading & Live Traffic

**Saad Zafar:**
* Configure the EKS Ingress Controller and AWS ALB to route public internet traffic to the Next.js service
* Build the `executor-worker` — pull a code job from the BullMQ queue, send it to the Judge0 API, receive the result, and update Supabase with pass/fail and test output
* Build the `api/v1/webhooks/judge0.ts` endpoint — receives async execution results back from Judge0 and updates the submission record in Supabase

**Bilal Kashif:**
* Embed Monaco Editor inside the coding section of `interview/[id].tsx` and wire the submit button to post to `api/v1/submissions`
* Build the System Design submission UI inside `interview/[id].tsx` — a text area for architecture explanation plus a submit button
* Build out the Recruiter Dashboard page to display candidate rankings, parsed CV data, and per-section scores

**Mohammad Hamza Iqbal:**
* Write the aggregated scoring algorithm — once CV parsing, voice interview grading, and code execution are all complete for a candidate, calculate the final weighted score and update their rank in Supabase
* Perform end-to-end testing of the full candidate flow: apply → voice interview → coding round → system design → score appears on dashboard
* Bug fixes across all API routes

**Muhammad Qatada:**
* Build the `evaluator-worker` — pull completed Vapi transcripts and system design answers from Supabase, send them to Gemini/Grok for grading, and write the structured score back to Supabase
* Define and document the JSON output schema for the evaluator so Hamza's scoring algorithm can consume it without integration issues