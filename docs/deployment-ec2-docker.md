# RecruitAI deployment: two EC2s + Docker Compose

This document is the **current** deployment plan: **GitHub → GitHub Actions → Docker Hub → two AWS EC2 instances**. It replaces the older **Kubernetes / EKS** approach (see [infra/kubernetes-deprecated](../infra/kubernetes-deprecated/README.md)).

---

## Overview

| Piece | Role |
|--------|------|
| **EC2 #1** (`t3.small`) | Runs **Next.js** only. **Port 80 → 3000**. Public A record to this instance’s IP. |
| **EC2 #2** (`t3.medium`) | Runs **executor**, **evaluator**, **cv-parser** only. No inbound public app traffic. |
| **Redis** | **Hosted outside** (ElastiCache, Redis Cloud, Upstash, etc.). Use the **same** **`REDIS_URL`** on web and workers. No Redis container in Compose. |
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

**CI / EC2 layout:** The workflow **[`.github/workflows/deploy-ec2.yml`](.github/workflows/deploy-ec2.yml)** on every deploy (1) ensures **`/app`** exists and is owned by the SSH user, (2) writes **`/app/docker-compose.yml`** from **`DOCKERHUB_USERNAME`** plus the fixed service names above, (3) uploads **`EC2_WEB_ENV_FILE`** / **`EC2_WORKERS_ENV_FILE`** as **`web.env`** / **`workers.env`**, then renames to **`/app/.env`**, (4) runs **`docker compose pull`** / **`up`**. You do not need to create **`/app`** or copy **`docker-compose.yml`** by hand on new instances. Full env checklist: **[`docs/github-actions-environment.md`](github-actions-environment.md)**.

**Local:** Use **`services/<name>/.env`** and root **`docker-compose.yml`** as today.

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

### Deploy & registry

| Name | Type | Purpose |
|------|------|---------|
| `DOCKERHUB_USERNAME` | Variable (recommended) or secret | Docker Hub user/org namespace |
| `DOCKERHUB_TOKEN` | Secret | Docker Hub access token |
| `WEB_EC2_IP` | Secret | Public IP or DNS of **web** EC2 (SSH/SCP) |
| `WORKERS_EC2_IP` | Secret | Public IP or DNS of **workers** EC2 |
| `SSH_KEY` | Secret | Private key for the EC2 key pair (PEM) |
| `EC2_WEB_ENV_FILE` | Secret | **Multiline** contents of **`/app/.env`** on the web host (see below) |
| `EC2_WORKERS_ENV_FILE` | Secret | **Multiline** **`/app/.env`** for workers (executor + evaluator + cv-parser) |

Optional repository **variable** `EC2_SSH_USER` (default **`ec2-user`**) if you use **Ubuntu** AMIs (`ubuntu`).

### What to put in `EC2_WEB_ENV_FILE` / `EC2_WORKERS_ENV_FILE`

Same `KEY=value` lines as a normal **`.env`** file. Full per-variable list (required vs optional, executor/evaluator/cv-parser keys): **[`github-actions-environment.md`](github-actions-environment.md)**.

On each deploy, Actions **overwrites** **`/app/.env`** and **`/app/docker-compose.yml`**, then **`docker compose pull`** / **`up`**. Edit secrets in GitHub if you need to change runtime env or image namespace; avoid relying on manual edits on the server.

---

## 3. EC2 provisioning (both instances)

One-time on each instance (example for Amazon Linux):

- Install **Docker** and the **Docker Compose** plugin (or standalone `docker-compose`).
- Open **SSH** from your IP (and **80** on the web instance if you serve HTTP). No need to pre-create **`/app`** or **`docker-compose.yml`**; the deploy workflow does that.

Optional: IAM role or static keys on the **web** host for **S3**; workers need S3/LLM credentials as in **[`github-actions-environment.md`](github-actions-environment.md)**.

---

## 4. EC2 #1 — Web (`docker-compose.yml`)

The workflow writes **`/app/docker-compose.yml`** for you. It matches this shape (**`your-org`** comes from **`DOCKERHUB_USERNAME`**):

```yaml
services:
  web:
    image: your-org/recruitai-nextjs-web:latest
    ports:
      - "80:3000"
    env_file: .env
    restart: always
```

Configuration is supplied by **`env_file`** pointing at **`/app/.env`**, populated from the **`EC2_WEB_ENV_FILE`** secret each deploy.

Replace placeholders in **`.env`**. **Redis** is external: use the same **`REDIS_URL`** on web and workers (**`rediss://...`** if TLS). Ensure **EC2 #1** (and workers) can reach Redis (security groups / VPC).

```env
NODE_ENV=production
HOSTNAME=0.0.0.0

# NEXT_PUBLIC_* in this file apply at runtime for server code. Client bundles from CI images
# use build-time placeholders unless you rebuild the image with real --build-arg values.
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_VAPI_ASSISTANT_ID=...
NEXT_PUBLIC_VAPI_PUBLIC_KEY=...

# Server-only
SUPABASE_SERVICE_ROLE_KEY=...
REDIS_URL=rediss://default:password@your-redis.example.cache.amazonaws.com:6379
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

## 5. EC2 #2 — Workers (`docker-compose.yml`)

The workflow writes **`/app/docker-compose.yml`** on the workers host. It matches this shape. **Redis is hosted outside**—set **`REDIS_URL`** in **`EC2_WORKERS_ENV_FILE`** (same logical Redis as the web host).

```yaml
services:
  executor:
    image: your-org/recruitai-executor-worker:latest
    env_file: .env
    restart: always

  evaluator:
    image: your-org/recruitai-evaluator-worker:latest
    env_file: .env
    restart: always

  cv-parser:
    image: your-org/recruitai-cv-parser-worker:latest
    env_file: .env
    restart: always
```

Use **`env_file: .env`** so each container receives **`/app/.env`**, populated from **`EC2_WORKERS_ENV_FILE`** each deploy.

```env
NODE_ENV=production
REDIS_URL=rediss://default:password@your-redis.example.cache.amazonaws.com:6379

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

- **`REDIS_URL`**: must match the **web** server’s queue endpoint (same logical DB, e.g. **`/0`**).
- **`SCORING_API_URL`**: must be reachable from **EC2 #2** (use **private IP** of the web box on the same VPC, or a tunnel). Today’s `aggregate` route may expect a **recruiter JWT**; using **`INTERNAL_API_SECRET`** end-to-end may require a small API change—plan verification after deploy.

**Security group — EC2 #2**

| Port | Source | Reason |
|------|--------|--------|
| 22 | Your IP | SSH |
| — | No **6379** inbound | Redis is **not** on this instance |
| — | No public HTTP | Workers are outbound-only |

Allow **EC2 #1** and **EC2 #2** to reach your **managed Redis** (security group / ACL on the Redis service—often **6379** or your vendor’s TLS URL in **`REDIS_URL`**).

---

## 6. Network summary

- **Web + workers → Redis**: outbound to your **hosted** Redis (**`REDIS_URL`**). Both EC2s need network access (VPC + security groups / managed Redis ACL).
- **Workers → Web**: HTTP **`SCORING_API_URL`** (private IP, port **80**).
- **All → Supabase, S3, Judge0, LLM APIs**: outbound HTTPS (and Judge0 as configured).

---

## 7. CI/CD flow (every merge to `main` / `master` or tag / manual run)

1. **Build** four images from **`services/*`** and **push** to Docker Hub (`:latest` + SHA tags as configured).
2. **Web EC2:** prepare **`docker-compose.yml`** + **`web.env`** on the runner → **SSH** `mkdir` / **`chown`** **`/app`** → **SCP** both files → **SSH** rename env to **`.env`**, **`docker compose pull web`**, **`docker compose up -d --remove-orphans web`**.
3. **Workers EC2:** same pattern with workers **`docker-compose.yml`**, **`workers.env`**, and **`executor`**, **`evaluator`**, **`cv-parser`**.

Implementation: **`.github/workflows/deploy-ec2.yml`**.

---

## 7a. Ordered checklist (first time and ongoing)

**AWS (once per instance)**

1. Launch **EC2 #1** (web) and **EC2 #2** (workers); attach security groups (web: **22**, **80**; workers: **22**; both: outbound as in sections 4–6).
2. Install Docker + Compose plugin; ensure **`ec2-user`** (or **`ubuntu`**) can run **`docker`** (e.g. group membership or **`sudo`** as you prefer—if deploy uses **`sudo docker`**, adjust the workflow SSH scripts accordingly; current scripts use **`docker`** without **`sudo`**).

**GitHub (once)**

3. Create repo **variable** **`DOCKERHUB_USERNAME`** and **secret** **`DOCKERHUB_TOKEN`**; create the four Docker Hub repositories.
4. Add **secrets** **`WEB_EC2_IP`**, **`WORKERS_EC2_IP`**, **`SSH_KEY`**, **`EC2_WEB_ENV_FILE`**, **`EC2_WORKERS_ENV_FILE`** (multiline **`.env`** bodies). Optional **variable** **`EC2_SSH_USER`**.

**Deploy (repeat)**

5. Push to **`main`** / **`master`** (or run **workflow_dispatch**). First run **creates** **`/app`**, **`docker-compose.yml`**, and **`.env`** on each host and starts containers. Later runs **refresh** images and overwrite **`.env`** / compose from GitHub.

---

## 8. Cost rough order (USD/month)

| Resource | Approx. |
|----------|---------|
| EC2 `t3.small` (web) | ~$15 |
| EC2 `t3.medium` (workers) | ~$30 |
| Docker Hub (free tier limits) | $0 |
| GitHub Actions (within free tier) | $0 |
| **Total** | **~$45/mo** (excluding data transfer and **managed Redis**) |

---

## 9. Deprecated: Kubernetes / EKS

- **Folder:** [infra/kubernetes-deprecated](../infra/kubernetes-deprecated) — historical manifests only (**ALB Ingress**, **Deployments**, **ConfigMaps** / **Secrets** for EKS). Not used for the two-EC2 plan.

---

## 10. Checklist before go-live

- [ ] **Hosted Redis** reachable from **web and workers**; same **`REDIS_URL`** and DB index (e.g. **`/0`**).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` and S3 credentials present where required.
- [ ] Judge0 URL/token match your executor environment.
- [ ] Evaluator and CV parser have LLM keys set.
- [ ] `SCORING_API_URL` uses private IP or internal DNS; confirm aggregate auth behavior.
- [ ] **HTTPS:** this minimal plan exposes **HTTP on port 80**. Add **nginx + Certbot** on EC2 #1 or terminate TLS at a future load balancer if you need HTTPS.
