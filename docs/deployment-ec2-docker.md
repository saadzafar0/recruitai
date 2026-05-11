# RecruitAI deployment: two EC2s + Docker Compose

This document is the **current** deployment plan: **GitHub → GitHub Actions → Docker Hub → two AWS EC2 instances**. It replaces the older **Kubernetes / EKS** approach (see [infra/kubernetes-deprecated](../infra/kubernetes-deprecated/README.md)).

---

## Overview

| Piece | Role |
|--------|------|
| **EC2 #1** (`t3.small`) | Runs **Next.js** only. **Port 80 → 3000**. Public A record to this instance’s IP. |
| **EC2 #2** (`t3.medium`) | Runs **executor**, **evaluator**, **cv-parser** workers + **Redis** (or use **ElastiCache** instead of container Redis). No inbound public app traffic. |
| **Redis** | BullMQ queue backend. Simplest: **Redis container on EC2 #2**. Alternative: **AWS ElastiCache**; then drop the `redis` service from workers Compose and set `REDIS_URL` to ElastiCache. |
| **CI/CD** | **GitHub Actions** build/push images to **Docker Hub**, then **SSH** to each EC2 and `docker compose pull && up -d`. |

**Not used in this plan:** Application Load Balancer (ALB), EKS, in-repo Kubernetes manifests (kept only under `infra/kubernetes-deprecated` for reference).

---

## Repository layout vs Docker build contexts

Dockerfiles live under **`services/`** (not `apps/`):

| Service | Build context (repo path) | Example image name on Docker Hub |
|---------|---------------------------|----------------------------------|
| Web | `services/nextjs-web` | `{namespace}/recruitai-nextjs-web` |
| Executor | `services/executor-worker` | `{namespace}/recruitai-executor-worker` |
| Evaluator | `services/evaluator-worker` | `{namespace}/recruitai-evaluator-worker` |
| CV parser | `services/cv-parser-worker` | `{namespace}/recruitai-cv-parser-worker` |

Use the same image names in **`docker-compose.yml`** on each server as you push from CI.



The legacy EKS-focused workflow is **`deploy-eks-deprecated.yml`** (`workflow_dispatch` only).

---

## 1. Docker Hub

Create four repositories (names must match what you use in Compose and Actions):

- `{your-org}/recruitai-nextjs-web`
- `{your-org}/recruitai-executor-worker`
- `{your-org}/recruitai-evaluator-worker`
- `{your-org}/recruitai-cv-parser-worker`

Generate a **Docker Hub access token** for CI (`DOCKERHUB_TOKEN`).

---

## 2. GitHub secrets and variables

| Name | Type | Purpose |
|------|------|---------|
| `DOCKERHUB_USERNAME` | Variable (recommended) or secret | Docker Hub user/org namespace |
| `DOCKERHUB_TOKEN` | Secret | Docker Hub access token |
| `WEB_EC2_IP` | Secret | Public IP or DNS of **web** EC2 (SSH target) |
| `WORKERS_EC2_IP` | Secret | Public IP or DNS of **workers** EC2 (SSH target) |
| `SSH_KEY` | Secret | Private key for the EC2 key pair (PEM) |

Adjust username in workflows if you use **`ubuntu`** instead of **`ec2-user`** (Amazon Linux).

---

## 3. EC2 provisioning (both instances)

One-time on each instance (example for Amazon Linux):

- Install Docker and Docker Compose plugin (or standalone `docker-compose`).
- Create **`/app`** with `docker-compose.yml` and **`.env`** (see below).
- Ensure IAM role or static keys on the **web** host if the Next.js app talks to **S3**; workers need S3/LLM as appropriate.

---

## 4. EC2 #1 — Web (`docker-compose.yml`)

Place under **`/app/docker-compose.yml`:**

```yaml
services:
  web:
    image: your-org/recruitai-nextjs-web:latest
    ports:
      - "80:3000"
    env_file: .env
    restart: always
```

### Web **`/app/.env`** (illustrative)

Replace placeholders and use the **private IP** of EC2 #2 for Redis if Redis runs there.

```env
NODE_ENV=production
HOSTNAME=0.0.0.0

# Public (baked at build time is ideal; override only if image was built with matching values)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_VAPI_ASSISTANT_ID=...
NEXT_PUBLIC_VAPI_PUBLIC_KEY=...

# Server-only
SUPABASE_SERVICE_ROLE_KEY=...
REDIS_URL=redis://WORKERS_EC2_PRIVATE_IP:6379
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
JUDGE0_URL=...
JUDGE0_API_TOKEN=...

# Optional: shared secret if you add internal-only scoring routes (not wired in all code paths today)
INTERNAL_API_SECRET=your-random-secret
```

**DNS:** Point your domain’s **A record** at EC2 #1’s **public** IP.

**Security group — EC2 #1**

| Port | Source | Reason |
|------|--------|--------|
| 80 | `0.0.0.0/0` | HTTP |
| 22 | Your IP | SSH |

---

## 5. EC2 #2 — Workers + Redis (`docker-compose.yml`)

```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: always
    volumes:
      - redis-data:/data

  executor:
    image: your-org/recruitai-executor-worker:latest
    env_file: .env
    restart: always
    depends_on:
      - redis

  evaluator:
    image: your-org/recruitai-evaluator-worker:latest
    env_file: .env
    restart: always
    depends_on:
      - redis

  cv-parser:
    image: your-org/recruitai-cv-parser-worker:latest
    env_file: .env
    restart: always
    depends_on:
      - redis

volumes:
  redis-data: {}
```

### Workers **`/app/.env`** (illustrative)

```env
NODE_ENV=production
REDIS_URL=redis://localhost:6379

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

JUDGE0_URL=...
JUDGE0_API_TOKEN=...

GEMINI_API_KEY=...
GROK_API_KEY=...
XAI_API_KEY=...

AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...

# Workers call back into the Next.js aggregate scoring route over private network
SCORING_API_URL=http://WEB_EC2_PRIVATE_IP:80/api/v1/scoring/aggregate

INTERNAL_API_SECRET=your-random-secret
```

**Notes**

- **`SCORING_API_URL`**: must be reachable from **EC2 #2** (use **private IP** of the web box on the same VPC, or a tunnel). Today’s `aggregate` route may expect a **recruiter JWT**; using **`INTERNAL_API_SECRET`** end-to-end may require a small API change—plan verification after deploy.
- If you use **ElastiCache**, remove the `redis` service, tighten security groups to ElastiCache only, and set **`REDIS_URL`** on **both** EC2s to the ElastiCache connection string.

**Security group — EC2 #2**

| Port | Source | Reason |
|------|--------|--------|
| 6379 | EC2 #1 **private IP** / VPC CIDR | Redis from web (BullMQ) |
| 22 | Your IP | SSH |
| — | No public HTTP | Workers are outbound-only |

---

## 6. Network summary

- **Web → Redis**: TCP **6379** on workers host (private IP).
- **Workers → Web**: HTTP **`SCORING_API_URL`** (private IP, port **80**).
- **All → Supabase, S3, Judge0, LLM APIs**: outbound HTTPS (and Judge0 as configured).

---

## 7. CI/CD flow (every merge to `main`)

1. **Build** four images from **`services/*`** and **push** to Docker Hub (`:latest` + SHA tags as configured).
2. **SSH** to **web** EC2 → `cd /app && docker compose pull && docker compose up -d --remove-orphans`.
3. **SSH** to **workers** EC2 → same command (pulls worker images + keeps Redis).

Implementation: **`.github/workflows/deploy-ec2.yml`**.

---

## 8. Cost rough order (USD/month)

| Resource | Approx. |
|----------|---------|
| EC2 `t3.small` (web) | ~$15 |
| EC2 `t3.medium` (workers) | ~$30 |
| Docker Hub (free tier limits) | $0 |
| GitHub Actions (within free tier) | $0 |
| **Total** | **~$45/mo** (excluding data transfer, ElastiCache if used) |

---

## 9. Deprecated: Kubernetes / EKS

- **Folder:** [infra/kubernetes-deprecated](../infra/kubernetes-deprecated) — historical manifests only (**ALB Ingress**, **Deployments**, **ConfigMaps** / **Secrets** for EKS).
- **Workflow:** `.github/workflows/deploy-eks-deprecated.yml` — **deprecated**; use **`deploy-ec2.yml`** for routine deploys. The EKS workflow remains available as **`workflow_dispatch`** for legacy image-only builds if needed.

---

## 10. Checklist before go-live

- [ ] Redis reachable from web EC2 (security group + correct `REDIS_URL`).
- [ ] All workers use same Redis DB index as web (e.g. `/0`).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and S3 credentials present where required.
- [ ] Judge0 URL/token match your executor environment.
- [ ] Evaluator and CV parser have LLM keys set.
- [ ] `SCORING_API_URL` uses private IP or internal DNS; confirm aggregate auth behavior.
- [ ] **HTTPS:** this minimal plan exposes **HTTP on port 80**. Add **nginx + Certbot** on EC2 #1 or terminate TLS at a future load balancer if you need HTTPS.
