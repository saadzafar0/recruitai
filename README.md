# 🚀 RecruitAI

[cite_start]RecruitAI is an automated recruitment and candidate evaluation system designed to streamline the hiring process using artificial intelligence[cite: 6]. [cite_start]By reducing manual screening efforts and bias, the platform improves efficiency, consistency, and accuracy in candidate selection[cite: 9].

## ✨ Features

* [cite_start]**🗣️ Voice-Based Interviews:** Conducts automated voice interviews using Vapi for sub-500ms real-time conversational AI, allowing candidates to respond to dynamically generated questions[cite: 11, 12].
* [cite_start]**💻 Coding Assessment Round:** Evaluates candidates' programming skills through problem-solving tasks[cite: 14, 15]. [cite_start]Submissions are automatically compiled, executed, and assessed via a sandboxed Judge0 environment[cite: 16].
* [cite_start]**🏗️ System Design Evaluation:** Assesses candidates on system design concepts, evaluating their understanding of scalability and architecture using LLMs[cite: 17, 18, 19].
* [cite_start]**📄 CV Parsing:** Automatically parses candidate resumes from PDF uploads to extract structured information such as skills, education, experience, and projects[cite: 20, 21].
* [cite_start]**📊 Automated Scoring & Ranking:** Assigns an objective overall score to each candidate based on interview performance, coding results, system design evaluation, and resume analysis[cite: 23, 24, 25].

## 🛠️ Tech Stack

* **Package Manager:** pnpm
* **Frontend & Core API:** Next.js
* **Database & Auth:** Supabase (PostgreSQL)
* **Voice Orchestration:** Vapi (Real-time STT/TTS)
* **AI / LLM:** Gemini / Grok (BYOM via Vapi, CV Parsing, System Design Evaluation)
* **Code Execution:** Judge0
* **Background Jobs:** BullMQ + Redis
* **File Storage:** Amazon S3 (CVs and Portfolios)
* **Infrastructure:** AWS EKS (Kubernetes)
* **Container Registry:** Docker Hub
* **CI/CD:** GitHub Actions

## 📂 Architecture & Folder Structure

RecruitAI is structured as a monorepo utilizing a microservices architecture to ensure the heavy AI and code execution tasks do not block the main web thread.

```text
recruitai/
├── .github/workflows/          # CI/CD pipelines (GitHub Actions -> Docker Hub -> EKS)
├── schemas/                    # Shared JSON schemas for queue payloads
├── services/
│   ├── nextjs-web/             # Core Next.js frontend and Vapi/Supabase webhooks
│   ├── executor-worker/        # BullMQ worker for Judge0 code execution
│   ├── evaluator-worker/       # BullMQ worker for heavy LLM reasoning (System Design)
│   └── cv-parser-worker/       # BullMQ worker for extracting data from S3 PDFs
├── infra/kubernetes/           # EKS deployment, service, and ingress manifests
└── docker-compose.yml          # Local multi-container development environment