/// <reference types="vite/client" />

const ENV_BACKEND_URL = (import.meta.env.VITE_AI_BACKEND_URL || "").trim().replace(/\/$/, "");
const BACKEND_URL_OVERRIDE_KEY = "campussync_ai_backend_url";

export const DEFAULT_STORAGE_BUCKET = "proposal-documents";

function isLocalhostHost(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function getAiBackendUrl(): string {
  if (ENV_BACKEND_URL) return ENV_BACKEND_URL;
  try {
    const saved = localStorage.getItem(BACKEND_URL_OVERRIDE_KEY)?.trim().replace(/\/$/, "");
    if (saved) return saved;
  } catch {
    // Ignore storage access errors
  }
  return isLocalhostHost() ? "http://localhost:4000" : "";
}

export function setAiBackendUrlOverride(url: string): string {
  const cleaned = url.trim().replace(/\/$/, "");
  try {
    if (cleaned) {
      localStorage.setItem(BACKEND_URL_OVERRIDE_KEY, cleaned);
    } else {
      localStorage.removeItem(BACKEND_URL_OVERRIDE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
  return getAiBackendUrl();
}

export function isAiBackendConfigured(): boolean {
  return Boolean(getAiBackendUrl());
}

function requireAiBackendUrl(): string {
  const baseUrl = getAiBackendUrl();
  if (!baseUrl) {
    throw new Error(
      "AI Backend URL is not configured for this deployed site. Deploy the backend/ folder (with GEMINI_API_KEY) and set VITE_AI_BACKEND_URL in Vercel, or paste your backend URL below."
    );
  }
  return baseUrl;
}

// ============================================================================
// Shared AI Types (matching backend/src/schemas/aiSchemas.ts)
// ============================================================================

export interface SignatureCheckResult {
  signaturesDetected: boolean;
  detectedSignatories: string[];
  missingSignatureLines: string[];
  visualNotes: string;
}

export interface ChecklistEvaluationItem {
  requirement: string;
  met: boolean;
  evidence: string;
}

export interface PreScreenResult {
  overallStatus: "PASSED" | "NEEDS_REVISION" | "FLAGGED";
  completenessScore: number;
  signatureCheck: SignatureCheckResult;
  checklistEvaluation: ChecklistEvaluationItem[];
  inconsistencies: string[];
  reviewerSummary: string;
  _meta?: {
    inspectedFiles?: Array<{ filename: string; mimeType: string }>;
    persisted?: boolean;
  };
}

export interface TriageResult {
  priorityTier: "P1" | "P2" | "P3";
  complexityScore: number;
  riskFlags: string[];
  rationale: string;
}

export interface BatchTriageItem extends TriageResult {
  eventId: number;
}

export type GeneratedQuestionType = "rating_1_to_5" | "multiple_choice" | "open_text";

export interface GeneratedSurveyQuestion {
  id: string;
  text: string;
  type: GeneratedQuestionType;
  required: boolean;
  options: string[];
}

export interface GeneratedSurveyResult {
  surveyTitle: string;
  description: string;
  questions: GeneratedSurveyQuestion[];
}

export interface SurveyResponseEntry {
  rating?: number;
  comment?: string;
  answers?: Record<string, string | number>;
}

export interface SurveyDiagnosticsResult {
  overallSentiment: "Positive" | "Mixed" | "Negative";
  sentimentScore: number;
  keyStrengths: string[];
  areasForImprovement: string[];
  actionableRecommendations: string[];
  executiveSummary: string;
}

export interface ProposalFormMetadata {
  title?: string;
  organization?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  description?: string;
  budget?: string | number;
  expectedAttendees?: number;
  hasExternalGuests?: boolean;
}

export interface TriageProposalInput {
  eventId?: number;
  title: string;
  organization?: string;
  eventDate?: string;
  daysUntilEvent?: number;
  venue?: string;
  description?: string;
  expectedCrowdSize?: number;
  budget?: number | string;
  hasExternalGuests?: boolean;
  tags?: string[];
}

export interface SurveyGeneratorInput {
  eventId?: number;
  eventTitle: string;
  category?: string;
  organization?: string;
  venue?: string;
  objectives: string;
  questionCount?: number;
}

export interface SurveyDiagnosticsInput {
  eventId?: number;
  eventTitle: string;
  organization?: string;
  eventDate?: string;
  averageRating?: number;
  totalResponses?: number;
  responses: SurveyResponseEntry[];
}

export interface StoredEventDocumentMeta {
  index: number;
  filename: string;
  mimeType: string;
  size: number;
  downloadPath: string;
  downloadUrl: string;
}

export interface EventDocumentsPayload {
  eventId: number;
  documents: StoredEventDocumentMeta[];
  preScreenResult: PreScreenResult | null;
}

// ============================================================================
// HTTP Helpers
// ============================================================================

async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error(
      `Could not reach the AI backend at ${getAiBackendUrl()}. Verify that backend/ is deployed and running, CORS allows this domain, and VITE_AI_BACKEND_URL is set correctly.`
    );
  }
}

async function handleApiResponse<T>(res: Response): Promise<T> {
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON response
  }
  if (!res.ok) {
    if (res.status === 413) {
      throw new Error(
        "Uploaded file exceeds the serverless payload limit (4.5 MB on Vercel). Please compress the PDF or upload a smaller scan."
      );
    }
    throw new Error(
      payload?.error ||
        `AI backend error (${res.status}) at ${getAiBackendUrl()}. Check that GEMINI_API_KEY is set on the backend.`
    );
  }
  return payload as T;
}

export async function uploadEventDocuments(
  eventId: number,
  files: File[],
  preScreenResult?: PreScreenResult | null
): Promise<EventDocumentsPayload | null> {
  const baseUrl = getAiBackendUrl();
  if (!baseUrl || (files.length === 0 && !preScreenResult)) return null;

  try {
    const formData = new FormData();
    files.forEach((f) => formData.append("documents", f));
    if (preScreenResult) {
      formData.append("preScreenResult", JSON.stringify(preScreenResult));
    }

    const res = await fetch(`${baseUrl}/api/ai/events/${eventId}/documents`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      eventId: data.eventId,
      documents: (data.documents || []).map((d: any) => ({
        ...d,
        downloadUrl: `${baseUrl}${d.downloadPath}`,
      })),
      preScreenResult: data.preScreenResult ?? null,
    };
  } catch {
    return null;
  }
}

export async function fetchEventDocuments(
  eventId: number
): Promise<EventDocumentsPayload | null> {
  const baseUrl = getAiBackendUrl();
  if (!baseUrl) return null;

  try {
    const res = await fetch(`${baseUrl}/api/ai/events/${eventId}/documents`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      eventId: data.eventId,
      documents: (data.documents || []).map((d: any) => ({
        ...d,
        downloadUrl: `${baseUrl}${d.downloadPath}`,
      })),
      preScreenResult: data.preScreenResult ?? null,
    };
  } catch {
    return null;
  }
}

export async function runDocumentPreScreen(params: {
  files?: File[];
  storageDocuments?: Array<{ bucket?: string; path: string }>;
  metadata: ProposalFormMetadata;
  eventId?: number;
}): Promise<PreScreenResult> {
  const baseUrl = requireAiBackendUrl();
  const { files = [], storageDocuments = [], metadata, eventId } = params;

  if (files.length > 0) {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("documents", file);
    });
    formData.append("metadata", JSON.stringify(metadata));
    if (storageDocuments.length > 0) {
      formData.append("storageDocuments", JSON.stringify(storageDocuments));
    }
    if (eventId !== undefined) {
      formData.append("eventId", String(eventId));
    }

    const res = await safeFetch(`${baseUrl}/api/ai/prescreen`, {
      method: "POST",
      body: formData,
    });
    return handleApiResponse<PreScreenResult>(res);
  }

  const res = await safeFetch(`${baseUrl}/api/ai/prescreen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documents: storageDocuments,
      metadata,
      eventId,
    }),
  });
  return handleApiResponse<PreScreenResult>(res);
}

export async function runProposalTriage(
  proposal: TriageProposalInput
): Promise<TriageResult> {
  const baseUrl = requireAiBackendUrl();
  const res = await safeFetch(`${baseUrl}/api/ai/triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proposal),
  });
  return handleApiResponse<TriageResult>(res);
}

export async function runBatchProposalTriage(
  proposals: Array<TriageProposalInput & { eventId: number }>
): Promise<BatchTriageItem[]> {
  const baseUrl = requireAiBackendUrl();
  const res = await safeFetch(`${baseUrl}/api/ai/triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposals }),
  });
  const data = await handleApiResponse<{ results: BatchTriageItem[] }>(res);
  return data.results || [];
}

export async function generateAiSurvey(
  input: SurveyGeneratorInput
): Promise<GeneratedSurveyResult> {
  const baseUrl = requireAiBackendUrl();
  const res = await safeFetch(`${baseUrl}/api/ai/surveys/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleApiResponse<GeneratedSurveyResult>(res);
}

export async function analyzeAiSurveyFeedback(
  input: SurveyDiagnosticsInput
): Promise<SurveyDiagnosticsResult> {
  const baseUrl = requireAiBackendUrl();
  const res = await safeFetch(`${baseUrl}/api/ai/surveys/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleApiResponse<SurveyDiagnosticsResult>(res);
}

// ============================================================================
// Graceful Local Cache Fallback (when optional Supabase JSONB columns don't exist)
// ============================================================================

function readCacheMap<T>(storageKey: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Record<string, T>) : {};
  } catch {
    return {};
  }
}

function writeCacheEntry<T>(storageKey: string, id: string | number, value: T): void {
  try {
    const existing = readCacheMap<T>(storageKey);
    existing[String(id)] = value;
    localStorage.setItem(storageKey, JSON.stringify(existing));
  } catch {
    // Ignore storage quota errors
  }
}

const CACHE_KEYS = {
  prescreen: "campussync_ai_prescreen_cache",
  triage: "campussync_ai_triage_cache",
  surveyDraft: "campussync_ai_survey_draft_cache",
  feedbackAnalysis: "campussync_ai_feedback_analysis_cache",
};

export const aiLocalCache = {
  getPreScreens: () => readCacheMap<PreScreenResult>(CACHE_KEYS.prescreen),
  savePreScreen: (eventId: number | string, result: PreScreenResult) =>
    writeCacheEntry(CACHE_KEYS.prescreen, eventId, result),

  getTriages: () => readCacheMap<TriageResult>(CACHE_KEYS.triage),
  saveTriage: (eventId: number | string, result: TriageResult) =>
    writeCacheEntry(CACHE_KEYS.triage, eventId, result),

  getSurveyDrafts: () => readCacheMap<GeneratedSurveyResult>(CACHE_KEYS.surveyDraft),
  saveSurveyDraft: (eventId: number | string, result: GeneratedSurveyResult) =>
    writeCacheEntry(CACHE_KEYS.surveyDraft, eventId, result),

  getFeedbackAnalyses: () =>
    readCacheMap<SurveyDiagnosticsResult>(CACHE_KEYS.feedbackAnalysis),
  saveFeedbackAnalysis: (eventId: number | string, result: SurveyDiagnosticsResult) =>
    writeCacheEntry(CACHE_KEYS.feedbackAnalysis, eventId, result),
};
