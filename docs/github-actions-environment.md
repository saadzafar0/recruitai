# GitHub Actions → EC2 environment variables

On each deploy, [`deploy-ec2.yml`](../.github/workflows/deploy-ec2.yml) writes **`/app/.env`** on the target instance from **two multiline repository secrets**, then runs `docker compose pull` / `up`.

| GitHub secret | Where it is written | Used by |
|---------------|---------------------|---------|
| **`EC2_WEB_ENV_FILE`** | Web EC2: **`/app/.env`** → `web` service | Next.js |
| **`EC2_WORKERS_ENV_FILE`** | Workers EC2: **`/app/.env`** → `executor`, `evaluator`, `cv-parser` | All three workers (one shared file) |

Create each secret in **Settings → Secrets and variables → Actions → New repository secret**. Paste the **entire** `.env` text (same format as `KEY=value` lines, one per line).

**Non-sensitive tuning** (model names, queue names, URLs without secrets) can live in those files too, or you can move them to **Variables** later and concatenate in the workflow—this doc lists names only; use **Secrets** for anything sensitive.

---

## A. `EC2_WEB_ENV_FILE` (web / Next.js)

Reference: [`services/nextjs-web/.env.example`](../services/nextjs-web/.env.example)

| Variable | Secret? | Notes |
|----------|---------|--------|
| **`NODE_ENV`** | optional | e.g. `production` |
| **`HOSTNAME`** | optional | e.g. `0.0.0.0` |
| **`NEXT_PUBLIC_SUPABASE_URL`** | variable OK | Public; still often in Secrets |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | **secret** | Public anon key |
| **`SUPABASE_SERVICE_ROLE_KEY`** | **secret** | Server-side |
| **`REDIS_URL`** | **secret** if password in URL | Or use `REDIS_HOST` + … below |
| **`REDIS_CONNECTION_STRING`** | **secret** | Alternate to `REDIS_URL` |
| **`REDIS_URI`** | **secret** | Alternate |
| **`REDIS_HOST`** | var | If not using `REDIS_URL` |
| **`REDIS_PORT`** | var | |
| **`REDIS_DB`** | var | |
| **`REDIS_USERNAME`** | **secret** | If required |
| **`REDIS_PASSWORD`** | **secret** | If required |
| **`REDIS_TLS`** | var | `true` / `false` |
| **`AWS_ACCESS_KEY_ID`** | **secret** | |
| **`AWS_SECRET_ACCESS_KEY`** | **secret** | |
| **`AWS_REGION`** | var | |
| **`S3_BUCKET_NAME`** | var | |
| **`NEXT_PUBLIC_VAPI_ASSISTANT_ID`** | var | |
| **`NEXT_PUBLIC_VAPI_PUBLIC_KEY`** | var | |
| **`VAPI_WEBHOOK_SECRET`** | **secret** | Required in production for webhook auth |
| **`JUDGE0_URL`** | var | Optional for web test routes |
| **`JUDGE0_API_TOKEN`** | **secret** | If Judge0 requires auth |
| **`JUDGE0_TEST_LANGUAGE_ID`** | var | Optional |
| **`JUDGE0_DEFAULT_LANGUAGE_ID`** | var | Optional |

**Note:** `NEXT_PUBLIC_*` in the **browser** still reflect whatever was used at **`docker build`** (CI uses Dockerfile placeholders). Server APIs on EC2 use the values from **`EC2_WEB_ENV_FILE`**. To align the client bundle with production, rebuild the web image with real `NEXT_PUBLIC_*` build args or build from a context that includes them.

---

## B. `EC2_WORKERS_ENV_FILE` (workers host — one file, three containers)

Merge the variables needed by **executor**, **evaluator**, and **cv-parser** into a **single** `.env` (same keys as running all three locally with one env file). References:

- [`services/executor-worker/.env.example`](../services/executor-worker/.env.example)
- [`services/evaluator-worker/.env.example`](../services/evaluator-worker/.env.example)
- [`services/cv-parser-worker/.env.example`](../services/cv-parser-worker/.env.example)

### Shared (Redis / Supabase)

| Variable | Secret? | Notes |
|----------|---------|--------|
| **`REDIS_URL`** | **secret** if needed | Same logical Redis as web |
| **`REDIS_CONNECTION_STRING`** / **`REDIS_URI`** | **secret** | Alternates |
| **`REDIS_HOST`** | var | |
| **`REDIS_PORT`** | var | |
| **`REDIS_DB`** | var | |
| **`REDIS_USERNAME`** | **secret** | |
| **`REDIS_PASSWORD`** | **secret** | |
| **`REDIS_TLS`** | var | |
| **`SUPABASE_URL`** | var | |
| **`NEXT_PUBLIC_SUPABASE_URL`** | var | Optional fallback in workers |
| **`SUPABASE_SERVICE_ROLE_KEY`** | **secret** | |

### Executor-only

| Variable | Secret? | Notes |
|----------|---------|--------|
| **`JUDGE0_URL`** | var | |
| **`JUDGE0_API_TOKEN`** | **secret** | |
| **`JUDGE0_CALLBACK_URL`** | var | Optional |
| **`EXECUTOR_QUEUE_NAME`** | var | Default `code-submissions` |
| **`EXECUTOR_CONCURRENCY`** | var | |
| **`EXECUTOR_POLL_INTERVAL_MS`** | var | |
| **`EXECUTOR_POLL_MAX_ATTEMPTS`** | var | |
| **`EXECUTOR_SUBMISSION_TIMEOUT_MS`** | var | |

### Evaluator-only

| Variable | Secret? | Notes |
|----------|---------|--------|
| **`EVALUATOR_VOICE_QUEUE_NAME`** | var | Default `voice-interview-evaluation` |
| **`EVALUATOR_DESIGN_QUEUE_NAME`** | var | Default `system-design-evaluation` |
| **`EVALUATOR_CONCURRENCY`** | var | |
| **`EVALUATOR_PROVIDER`** | var | e.g. `gemini` |
| **`EVALUATOR_FALLBACK_PROVIDER`** | var | e.g. `grok` |
| **`EVALUATOR_DISABLE_FALLBACK`** | var | `true` / `false` |
| **`EVALUATOR_TIMEOUT_MS`** | var | |
| **`EVALUATOR_MAX_TEXT_CHARS`** | var | |
| **`EVALUATOR_MODEL_VERSION`** | var | |
| **`EVALUATOR_SWEEPER_INTERVAL_MS`** | var | `0` disables |
| **`EVALUATOR_SWEEPER_BATCH_SIZE`** | var | |
| **`GEMINI_API_KEY`** | **secret** | |
| **`GEMINI_MODEL`** | var | |
| **`GROK_API_KEY`** / **`XAI_API_KEY`** | **secret** | |
| **`GROK_MODEL`** | var | |

### CV parser–only

| Variable | Secret? | Notes |
|----------|---------|--------|
| **`AWS_REGION`** | var | |
| **`AWS_ACCESS_KEY_ID`** | **secret** | |
| **`AWS_SECRET_ACCESS_KEY`** | **secret** | |
| **`S3_BUCKET_NAME`** | var | |
| **`CV_PARSER_CONCURRENCY`** | var | |
| **`CV_PARSER_VERSION`** | var | |
| **`CV_PARSER_TIMEOUT_MS`** | var | |
| **`CV_PARSER_PROVIDER`** | var | |
| **`CV_PARSER_FALLBACK_PROVIDER`** | var | |
| **`CV_PARSER_DISABLE_FALLBACK`** | var | |
| **`CV_PARSER_MAX_TEXT_CHARS`** | var | |
| **`GEMINI_API_KEY`** | **secret** | Same name as evaluator if shared |
| **`GEMINI_MODEL`** | var | |
| **`GROK_API_KEY`** / **`XAI_API_KEY`** | **secret** | |
| **`GROK_MODEL`** | var | |

### Shared: scoring callback

| Variable | Secret? | Notes |
|----------|---------|--------|
| **`SCORING_API_URL`** | var | e.g. `http://<web-private-ip>:80/api/v1/scoring/aggregate` |

---

## C. Other GitHub settings (not `.env` file contents)

| Name | Type | Purpose |
|------|------|---------|
| `DOCKERHUB_USERNAME` | **Variable** | Image namespace |
| `DOCKERHUB_TOKEN` | **Secret** | Push images |
| `WEB_EC2_IP` | **Secret** | Web host |
| `WORKERS_EC2_IP` | **Secret** | Workers host |
| `SSH_KEY` | **Secret** | PEM private key |
| `EC2_SSH_USER` | **Variable** (optional) | Default `ec2-user` |

---

## Minimum viable sets

**Web:** `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`, `AWS_*`, `S3_BUCKET_NAME`, and Vapi + `VAPI_WEBHOOK_SECRET` in production.

**Workers:** `REDIS_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JUDGE0_*` (executor), LLM keys (evaluator + cv-parser), `AWS_*` + `S3_*` (cv-parser), `SCORING_API_URL`.

Add optional/tuning keys when you need non-default queues, concurrency, or sweeper behavior.
