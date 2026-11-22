/// <reference types="vite/client" />

export const AI_BACKEND_URL = (
  import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:4000"
).replace(/\/$/, "");

export const DEFAULT_STORAGE_BUCKET = "proposal-documents";

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

// ============================================================================
// HTTP Helpers
// ============================================================================

async function handleApiResponse<T>(res: Response): Promise<T> {
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON response
  }
  if (!res.ok) {
    throw new Error(
      payload?.error ||
        `AI backend error (${res.status}). Ensure the backend server is running at ${AI_BACKEND_URL}.`
    );
  }
  return payload as T;
}

export async function runDocumentPreScreen(params: {
  files?: File[];
  storageDocuments?: Array<{ bucket?: string; path: string }>;
  metadata: ProposalFormMetadata;
  eventId?: number;
}): Promise<PreScreenResult> {
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

    const res = await fetch(`${AI_BACKEND_URL}/api/ai/prescreen`, {
      method: "POST",
      body: formData,
    });
    return handleApiResponse<PreScreenResult>(res);
  }

  const res = await fetch(`${AI_BACKEND_URL}/api/ai/prescreen`, {
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
  const res = await fetch(`${AI_BACKEND_URL}/api/ai/triage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proposal),
  });
  return handleApiResponse<TriageResult>(res);
}

export async function runBatchProposalTriage(
  proposals: Array<TriageProposalInput & { eventId: number }>
): Promise<BatchTriageItem[]> {
  const res = await fetch(`${AI_BACKEND_URL}/api/ai/triage`, {
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
  const res = await fetch(`${AI_BACKEND_URL}/api/ai/surveys/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleApiResponse<GeneratedSurveyResult>(res);
}

export async function analyzeAiSurveyFeedback(
  input: SurveyDiagnosticsInput
): Promise<SurveyDiagnosticsResult> {
  const res = await fetch(`${AI_BACKEND_URL}/api/ai/surveys/analyze`, {
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
