-- Vapi end-of-call-report: store full transcript and de-dupe by Vapi call id
ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS full_transcript TEXT,
  ADD COLUMN IF NOT EXISTS vapi_call_id TEXT;

COMMENT ON COLUMN interview_sessions.full_transcript IS 'Full conversation transcript from Vapi (e.g. end-of-call-report artifact).';
COMMENT ON COLUMN interview_sessions.vapi_call_id IS 'Vapi Call.id for idempotency; unique when set.';

CREATE UNIQUE INDEX IF NOT EXISTS interview_sessions_vapi_call_id_unique
  ON interview_sessions (vapi_call_id)
  WHERE vapi_call_id IS NOT NULL;
