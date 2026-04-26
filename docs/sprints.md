# 🏃 RecruitAI Sprint Plan

---

## Sprint 1 — Foundation & Infrastructure  
**Week 1**

> **Goal:** Scaffold the monorepo, provision the cloud resources, and establish the local development environment.

| Assignee | Tasks |
|----------|-------|
| **Saad Zafar** | • Set up the GitHub Actions workflow (`deploy-eks.yml`) to build the 4 Docker images and push them to Docker Hub.<br>• Provision the base AWS EKS cluster and node groups. |
| **Bilal Kashif** | • Initialize the Next.js application inside the monorepo.<br>• Build the base UI layouts, navigation, and the Recruiter Dashboard skeleton. |
| **Mohammad Hamza Iqbal** | • Set up the Supabase project, establishing database schemas for Candidates, Interviews, and Code Submissions.<br>• Configure the AWS S3 bucket and write the Next.js API utility function for secure file uploads. |
| **Muhammad Qatada** | • Write the `docker-compose.yml` to spin up Next.js, Redis, and empty shells for the background workers locally.<br>• Initialize the BullMQ connection logic (`lib/bull.ts`) so the queues are ready to accept jobs. |

---

## Sprint 2 — The Vapi Split & Data Ingestion  
**Week 2**

> **Goal:** Integrate the core conversational AI, connect the Google Forms intake, and start parsing data.

| Assignee | Tasks |
|----------|-------|
| **Saad Zafar** *(Vapi Backend & K8s)* | • Write the Kubernetes deployment and service manifests for all 4 microservices and use public Docker Hub images (no `imagePullSecrets` required) or a pull secret for private registries.<br>• **Vapi:** Build the `api/v1/webhooks/vapi.ts` endpoint. This secure webhook will receive the call-end payload from Vapi, extract the conversation transcript, and save it directly to the correct candidate's Supabase record. |
| **Bilal Kashif** *(Vapi Frontend)* | • **Vapi:** Integrate the `@vapi-ai/web` SDK. Build the VapiInterviewRoom UI component, handle browser microphone permissions, and implement the start/stop call logic. |
| **Mohammad Hamza Iqbal** | • Write the Google Apps Script and the Next.js webhook (`api/v1/intake/google-form.ts`) to automatically create a candidate profile in Supabase when an application is submitted. |
| **Muhammad Qatada** *(Vapi AI & CV Parsing)* | • **Vapi:** Design and configure the Vapi Assistant's system prompt to act as an expert technical interviewer (setting the tone, questions, and fallback behaviors).<br>• Build the cv-parser-worker logic: pull the PDF from S3, extract text, and use Gemini to parse skills/education into structured JSON. |

---

## Sprint 3 — Evaluation, Execution & Polish  
**Week 3**

> **Goal:** Implement the coding execution environment, finalize AI grading, aggregate the scores, and route live traffic.

| Assignee | Tasks |
|----------|-------|
| **Saad Zafar** | • Configure the EKS Ingress Controller and AWS Application Load Balancer (ALB) to route public internet traffic to the Next.js service.<br>• **Judge0:** Build the executor-worker logic. It will pull submitted code from Redis, send it to the Judge0 API to be compiled/run, and update Supabase with the pass/fail results. |
| **Bilal Kashif** | • Build the CodeEditor UI component (using Monaco Editor) for the candidate's coding round.<br>• Flesh out the Recruiter Dashboard UI to display the live candidate rankings and parsed CV data. |
| **Mohammad Hamza Iqbal** | • Write the "Aggregated Scoring" algorithm. Once the CV, Interview, and Code execution are done, calculate the final weighted score and update the candidate's overall rank in Supabase.<br>• Perform comprehensive end-to-end testing and bug fixing on the API routes. |
| **Muhammad Qatada** | • Build the evaluator-worker. Pass the completed Vapi interview transcripts and system design answers to Gemini/Grok to grade the candidate's technical communication and architecture knowledge. |
