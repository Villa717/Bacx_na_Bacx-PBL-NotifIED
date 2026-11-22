-- Optional, non-destructive Supabase schema migration for CampusSync Multimodal AI integration.
-- The frontend and backend gracefully fall back to local state if these columns or bucket are not yet present.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS ai_prescreen_result jsonb,
  ADD COLUMN IF NOT EXISTS ai_triage_result jsonb,
  ADD COLUMN IF NOT EXISTS ai_survey_draft jsonb,
  ADD COLUMN IF NOT EXISTS ai_feedback_analysis jsonb,
  ADD COLUMN IF NOT EXISTS document_bucket text,
  ADD COLUMN IF NOT EXISTS document_path text,
  ADD COLUMN IF NOT EXISTS waiver_path text,
  ADD COLUMN IF NOT EXISTS estimated_budget numeric,
  ADD COLUMN IF NOT EXISTS has_external_guests boolean DEFAULT false;

-- Optional Storage bucket for uploaded APF & waiver clearance documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-documents', 'proposal-documents', false)
ON CONFLICT (id) DO NOTHING;
