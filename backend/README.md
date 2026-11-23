# CampusSync Multimodal AI Backend (`gemini-3.8-flash`)

Express + TypeScript service wrapping Google's `@google/genai` SDK (`gemini-3.8-flash` with automatic Flash fallback) with strict JSON Structured Outputs (`responseSchema`) for CampusSync's automated event clearance workflow.

## Setup

1. Copy `.env.example` to `.env` and set your **server-side** credentials:
   ```bash
   cp .env.example .env
   ```
   - `GEMINI_API_KEY` *(required)* — Never place this in any frontend `.env` file.
   - `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` *(optional)* — Needed only for server-side Supabase Storage document retrieval and optional persistence to `public.events` AI JSONB columns.

2. Install dependencies and start the server:
   ```bash
   npm install
   npm run dev
   ```
   The API listens on `http://localhost:4000` by default.

3. *(Optional)* Run `supabase-ai-migration.sql` in the Supabase SQL Editor if you want to persist AI results (`ai_audit_status`, `ai_prescreen_result`, `ai_triage_result`, `ai_survey_draft`, `ai_feedback_analysis`) and uploaded documents (`proposal-documents` Storage bucket) in dedicated columns. If omitted, the portals carry documents and AI audit reports seamlessly through the existing `events` table.

## Endpoints

| Method | Path | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service status, active model, and credential readiness |
| `POST` | `/api/ai/prescreen` | Automated multimodal PDF/PNG/JPEG executive summary, signature & consistency audit (accepts `multipart/form-data`, Supabase Storage `{ bucket, path }`, or Supabase Storage URLs) |
| `POST` | `/api/ai/triage` | Single or batch (`{ proposals: [...] }`) dynamic `P1`/`P2`/`P3` priority queue triage |
| `POST` | `/api/ai/surveys/generate` | AI-assisted post-event student evaluation questionnaire generator |
| `POST` | `/api/ai/surveys/analyze` | Post-event survey sentiment score & executive diagnostics synthesis |

## Frontend Configuration

Each frontend app (`Facilitator view/`, `Admin view/`, `Department haed view/`) connects via `src/lib/aiClient.ts` using `VITE_AI_API_URL`.
