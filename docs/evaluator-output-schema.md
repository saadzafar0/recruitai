# Evaluator Worker — Output Schema (v1)

**Owner:** Muhammad Qatada (Sprint 3)
**Service:** [services/evaluator-worker/](../services/evaluator-worker/)
**JSON Schema:** [schemas/evaluate.v1.json](../schemas/evaluate.v1.json)

This document defines the contract produced by the `evaluator-worker` so that
Hamza's aggregated scoring algorithm in
[services/nextjs-web/src/lib/scoring.ts](../services/nextjs-web/src/lib/scoring.ts)
can consume voice-interview and system-design results without integration
issues.

---

## 1. What the evaluator worker produces

For every completed interview round the worker writes **two things**:

1. **A row in the round-specific summary table** (`voice_interview_scores` /
   `system_design_scores`).
2. **The 0-100 round score** on the `applications` row
   (`applications.voice_score` / `applications.system_design_score`).

Both come from a single LLM-evaluated payload. That payload is the
**evaluator output object** described below.

The worker also re-emits the same object as the BullMQ job result, so any
downstream consumer (the nextjs-web `aggregateScores` function, dashboards,
audit log, future webhook fan-out) can read it without re-querying Supabase.

---

## 2. Common fields

| Field                  | Type                              | Notes                                                                                |
|------------------------|-----------------------------------|--------------------------------------------------------------------------------------|
| `kind`                 | `"voice_interview" \| "system_design"` | Discriminator. Tells the consumer which sub-shape to expect.                    |
| `applicationId`        | UUID                              | `applications.id` — the row Hamza's aggregator looks up.                             |
| `totalScore`           | number `0..100`                   | Written to `applications.<round>_score`. Use this for the weighted composite.        |
| `scores`               | object of dimension scores `0..10` | Each dimension matches a `score_*` column on the response/session table.            |
| `summary`              | string                            | 2-4 sentence narrative for the recruiter dashboard.                                  |
| `strengths`            | array of strings (max 8)          | Mirrors `*_scores.strengths`.                                                        |
| `weaknesses`           | array of strings (max 8)          | Mirrors `*_scores.weaknesses`.                                                       |
| `recommendation`       | enum                              | `strong_pass` \| `pass` \| `borderline` \| `fail`. Mirrors `*_scores.recommendation`. |
| `providerUsed`         | `"gemini" \| "grok"`              | Which LLM scored it (Gemini primary, Grok fallback).                                 |
| `scoringModelVersion`  | string                            | e.g. `"evaluator-worker@1.0.0+gemini-2.5-flash"`. Stored so re-scoring is auditable. |
| `scoredAt`             | ISO-8601 string                   | When the worker finished scoring.                                                    |

### Score normalization rule

`totalScore` (0-100) is **always** computed as the unweighted average of the
five dimension scores multiplied by 10:

```
totalScore = round( mean(score_1..score_5) * 10, 2 )
```

This keeps the LLM-derived score deterministic given the dimension scores.
Dimension weights are **not** the evaluator's concern — Hamza's aggregator
applies the per-job weights (`weight_voice`, `weight_system_design`) when it
computes `composite_score`.

---

## 3. Voice-interview shape (`kind: "voice_interview"`)

Source data: [interview_sessions.full_transcript](../docs/recruitai_schema.sql) (single end-of-call
Vapi transcript — there are no per-question transcripts for v1 because Vapi
returns one combined artifact).

```jsonc
{
  "kind": "voice_interview",
  "applicationId": "8d3f...-uuid",
  "sessionId":     "7c12...-uuid",          // interview_sessions.id
  "vapiCallId":    "call_abc123",           // null for sessions inserted manually
  "transcriptHash": "sha256-of-transcript", // detect re-scores of the same transcript
  "scores": {
    "relevance":     7.5,   // 0-10  — answers were on-topic
    "clarity":       6.0,   // 0-10  — easy to follow
    "depth":         5.5,   // 0-10  — went past surface-level
    "communication": 7.0,   // 0-10  — pacing, structure, vocabulary
    "confidence":    6.5    // 0-10  — assertive, low filler-word density
  },
  "totalScore": 65.00,                       // mean(scores)*10, rounded to 2dp
  "summary": "Candidate gave on-topic answers and demonstrated solid fundamentals...",
  "strengths":  ["Concrete examples from past work", "Clear explanation of ownership"],
  "weaknesses": ["Limited depth on system-level concerns", "Used filler words frequently"],
  "recommendation": "pass",
  "providerUsed": "gemini",
  "scoringModelVersion": "evaluator-worker@1.0.0+gemini-2.5-flash",
  "scoredAt": "2026-05-04T11:32:08.214Z"
}
```

### Side-effects in Supabase

| Table                    | Columns written                                                                                                                |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `voice_interview_scores` | `session_id`, `application_id`, `avg_relevance`, `avg_clarity`, `avg_depth`, `avg_communication`, `avg_confidence`, `total_score`, `ai_summary`, `strengths`, `weaknesses`, `recommendation`, `scoring_model_version`, `scored_at` |
| `applications`           | `voice_score = totalScore`                                                                                                     |

The worker upserts on `voice_interview_scores.session_id` (UNIQUE), so
re-scoring is idempotent.

---

## 4. System-design shape (`kind: "system_design"`)

Source data: [system_design_responses](../docs/recruitai_schema.sql) (`written_response`,
`transcript`, `diagram_url`). The evaluator scores the **most recent** response
per assessment.

```jsonc
{
  "kind": "system_design",
  "applicationId": "8d3f...-uuid",
  "assessmentId":  "f9aa...-uuid",         // system_design_assessments.id
  "responseId":    "1a2b...-uuid",         // system_design_responses.id
  "problemId":     "9988...-uuid",         // system_design_responses.problem_id
  "scores": {
    "requirements":  7.0,   // 0-10 — captured functional + non-functional requirements
    "scalability":   6.0,   // 0-10 — addressed throughput, growth, partitioning
    "architecture":  6.5,   // 0-10 — sensible component / data-store choices
    "trade_offs":    5.0,   // 0-10 — articulated trade-offs and alternatives
    "communication": 7.0    // 0-10 — clarity of the written explanation
  },
  "totalScore": 63.00,
  "summary": "Candidate produced a workable design that covers core requirements but...",
  "strengths":  ["Identified caching layer early", "Clear sequence of operations"],
  "weaknesses": ["Did not discuss failure modes", "No data-partitioning strategy"],
  "recommendation": "borderline",
  "providerUsed": "gemini",
  "scoringModelVersion": "evaluator-worker@1.0.0+gemini-2.5-flash",
  "scoredAt": "2026-05-04T11:35:11.001Z"
}
```

### Side-effects in Supabase

| Table                       | Columns written                                                                                                                                                  |
|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `system_design_responses`   | `score_requirements`, `score_scalability`, `score_architecture`, `score_trade_offs`, `score_communication`, `total_score`, `ai_feedback`, `scored_at`            |
| `system_design_scores`      | `assessment_id`, `application_id`, `total_score`, `avg_*`, `ai_summary`, `strengths`, `weaknesses`, `recommendation`, `scored_at`                                |
| `applications`              | `system_design_score = totalScore`                                                                                                                               |

The worker upserts on `system_design_scores.assessment_id` (UNIQUE).

---

## 5. How the aggregator (Hamza) consumes this

`aggregateScores(applicationId)` in
[services/nextjs-web/src/lib/scoring.ts](../services/nextjs-web/src/lib/scoring.ts) only reads the
`applications` row:

```ts
const { data: application } = await supabaseAdmin
  .from('applications')
  .select('id, job_id, cv_score, voice_score, coding_score, system_design_score, status')
  .eq('id', applicationId)
  .single()
```

So the **only contract Hamza depends on** is:

1. `applications.voice_score` is a `NUMERIC(5,2)` in `[0, 100]` once voice
   evaluation is complete.
2. `applications.system_design_score` is a `NUMERIC(5,2)` in `[0, 100]` once
   system-design evaluation is complete.
3. Both columns stay `NULL` until the evaluator has written them — that lets
   `areAllStageScoresPresent()` correctly return `false` for in-flight
   applications.

Everything else (the dimension breakdown, summaries, strengths/weaknesses) is
for the recruiter dashboard, not the aggregator. The aggregator is therefore
isolated from any future change to the LLM rubric — only `totalScore` matters
to it.

---

## 6. BullMQ queues

| Queue name                     | Producer                                          | Job payload                                                                                              |
|--------------------------------|---------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| `voice-interview-evaluation`   | `api/v1/webhooks/vapi.ts` (Saad — Sprint 2)       | `{ applicationId: string, sessionId?: string }`                                                          |
| `system-design-evaluation`     | system-design submit endpoint (Bilal — Sprint 3)  | `{ applicationId: string, assessmentId?: string, responseId?: string }`                                  |

Producers may omit the inner ids; the worker resolves them from
`applications.id` when needed. Until those producers are wired up, an internal
**sweeper** (`EVALUATOR_SWEEPER_INTERVAL_MS`) periodically picks up:

* `interview_sessions` rows where `status = 'completed'` and
  `voice_interview_scores` has no row yet, and
* `system_design_responses` rows where `scored_at IS NULL`.

This keeps the worker useful end-to-end even before Sprint 3 enqueue calls
land.

---

## 7. LLM JSON contract (internal)

Both Gemini and Grok are instructed to emit **only** this minimal shape; the
worker normalizes it into the public output above.

```json
{
  "scores": {
    "<dimension>": 0..10,
    "...": "..."
  },
  "summary": "string",
  "strengths":  ["..."],
  "weaknesses": ["..."],
  "recommendation": "strong_pass | pass | borderline | fail"
}
```

`totalScore` is computed by the worker (not the LLM) so we have a single,
deterministic formula across providers.
