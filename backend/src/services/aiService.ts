import { type Part } from "@google/genai";
import { env } from "../config/env.js";
import { generateContentWithModelFallback } from "../config/gemini.js";
import { getSupabaseAdmin } from "../config/supabase.js";
import {
  type BatchTriageItem,
  batchTriageResponseSchema,
  type GeneratedSurveyResult,
  type PreScreenResult,
  preScreenResponseSchema,
  type SurveyDiagnosticsResult,
  surveyDiagnosticsResponseSchema,
  surveyGeneratorResponseSchema,
  type TriageResult,
  triageResponseSchema,
} from "../schemas/aiSchemas.js";

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

export interface DocumentInput {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface StorageDocumentRef {
  bucket?: string;
  path: string;
  filename?: string;
  mimeType?: string;
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
  eventTitle: string;
  category?: string;
  organization?: string;
  venue?: string;
  objectives: string;
  questionCount?: number;
}

export interface SurveyResponseEntry {
  rating?: number;
  comment?: string;
  answers?: Record<string, string | number>;
}

export interface SurveyDiagnosticsInput {
  eventTitle: string;
  organization?: string;
  eventDate?: string;
  averageRating?: number;
  totalResponses?: number;
  responses: SurveyResponseEntry[];
}

function normalizeMimeType(mimeType: string | undefined, filename: string): string {
  const cleaned = (mimeType || "").split(";")[0].trim().toLowerCase();
  if (cleaned === "image/jpg") return "image/jpeg";
  if (ALLOWED_MIME_TYPES.has(cleaned)) return cleaned;

  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";

  throw new Error(
    `Unsupported file type for "${filename}". Supported types: application/pdf, image/png, image/jpeg.`
  );
}

export async function downloadFromSupabaseStorage(
  ref: StorageDocumentRef
): Promise<DocumentInput> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error(
      "Supabase Storage retrieval requested, but SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured in backend/.env."
    );
  }

  const bucket = ref.bucket || env.supabaseStorageBucket;
  const { data, error } = await supabase.storage.from(bucket).download(ref.path);

  if (error || !data) {
    throw new Error(
      `Failed to retrieve "${ref.path}" from Supabase Storage bucket "${bucket}": ${error?.message || "Empty file"}`
    );
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = ref.filename || ref.path.split("/").pop() || "document";
  const mimeType = normalizeMimeType(ref.mimeType || data.type, filename);

  return { filename, mimeType, buffer };
}

function parseJsonResponse<T>(rawText: string | undefined, context: string): T {
  if (!rawText) {
    throw new Error(`Gemini returned an empty response for ${context}.`);
  }
  try {
    return JSON.parse(rawText) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse structured JSON from Gemini for ${context}: ${(err as Error).message}`
    );
  }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function computeDaysUntilEvent(eventDate?: string, explicitDays?: number): number | null {
  if (typeof explicitDays === "number" && Number.isFinite(explicitDays)) {
    return Math.round(explicitDays);
  }
  if (!eventDate) return null;
  const target = new Date(eventDate).getTime();
  if (Number.isNaN(target)) return null;
  return Math.round((target - Date.now()) / (1000 * 60 * 60 * 24));
}

// ============================================================================
// 1. Multimodal Document & Visual Signature Pre-Screening
// ============================================================================

export async function preScreenDocuments(
  documents: DocumentInput[],
  metadata: ProposalFormMetadata
): Promise<PreScreenResult> {
  if (!documents.length) {
    throw new Error("At least one PDF or scanned image document is required for pre-screening.");
  }

  const fileParts: Part[] = documents.map((doc) => {
    const mimeType = normalizeMimeType(doc.mimeType, doc.filename);
    return {
      inlineData: {
        mimeType,
        data: doc.buffer.toString("base64"),
      },
    };
  });

  const metadataSummary = JSON.stringify(
    {
      title: metadata.title || null,
      organization: metadata.organization || null,
      eventDate: metadata.eventDate || null,
      startTime: metadata.startTime || null,
      endTime: metadata.endTime || null,
      venue: metadata.venue || null,
      budget: metadata.budget ?? null,
      expectedAttendees: metadata.expectedAttendees ?? null,
      hasExternalGuests: metadata.hasExternalGuests ?? null,
      description: metadata.description || null,
      attachedFiles: documents.map((d) => ({ filename: d.filename, mimeType: d.mimeType })),
    },
    null,
    2
  );

  const promptText = `You are CampusSync's Multimodal Academic Event Clearance Auditor.
Visually and textually inspect the attached event proposal document(s) (Activity Proposal Form / APF, endorsement sheets, budget tables, and/or participant waivers) and cross-check them against the submitted form metadata.

Submitted Proposal Form Metadata:
${metadataSummary}

Evaluation Instructions:
1. Visual Signature & Stamp Inspection:
   - Visually inspect every signature line and endorsement block in the document(s).
   - Distinguish actual handwritten/digital signatures or official stamps from blank lines or typed names with no signature mark.
   - Report detected signatories/roles in signatureCheck.detectedSignatories, and list blank/unsigned/missing lines in signatureCheck.missingSignatureLines.
   - Note scan quality, blurriness, cut-off pages, or suspicious visual anomalies in signatureCheck.visualNotes.
2. Institutional Checklist Evaluation:
   - Evaluate at minimum: (a) Adviser Endorsement & Signature, (b) Department Head / Dean Endorsement Slot, (c) Itemized Budget / Financial Plan, (d) Event Objectives & Program Flow, and (e) Participant Liability Waivers (mandatory if off-campus, external venue, or MPH1; mark met with clear note if not required for low-risk on-campus rooms).
3. Form-vs-Document Cross-Check (inconsistencies):
   - Flag any discrepancy between the submitted form metadata (title, eventDate, startTime/endTime, venue, budget, organization) and the actual content inside the attached document(s). If a form field was left blank, note only real conflicts rather than speculating.
4. Scoring & Status:
   - completenessScore: integer 0-100.
   - overallStatus:
     - "PASSED" if signatures, core requirements, and metadata align cleanly.
     - "NEEDS_REVISION" if minor/fixable items, missing signatures, or metadata mismatches exist.
     - "FLAGGED" if critical endorsements are completely blank/unreadable, documents are unrelated to the event, or major contradictions/anomalies exist.
5. reviewerSummary:
   - Write a concise, objective 2-3 sentence summary for Admin Coordinators and Department Heads.`;

  const { response } = await generateContentWithModelFallback({
    contents: [
      {
        role: "user",
        parts: [{ text: promptText }, ...fileParts],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: preScreenResponseSchema,
    },
  });

  const parsed = parseJsonResponse<PreScreenResult>(response.text, "document pre-screening");
  return {
    ...parsed,
    completenessScore: clamp(parsed.completenessScore, 0, 100),
    signatureCheck: {
      signaturesDetected: Boolean(parsed.signatureCheck?.signaturesDetected),
      detectedSignatories: parsed.signatureCheck?.detectedSignatories || [],
      missingSignatureLines: parsed.signatureCheck?.missingSignatureLines || [],
      visualNotes: parsed.signatureCheck?.visualNotes || "",
    },
    checklistEvaluation: parsed.checklistEvaluation || [],
    inconsistencies: parsed.inconsistencies || [],
    reviewerSummary: parsed.reviewerSummary || "",
  };
}

// ============================================================================
// 2. Dynamic Priority Queue Triage
// ============================================================================

export async function triageProposal(proposal: TriageProposalInput): Promise<TriageResult> {
  const daysUntilEvent = computeDaysUntilEvent(proposal.eventDate, proposal.daysUntilEvent);

  const payload = {
    title: proposal.title,
    organization: proposal.organization || "Student Organization",
    eventDate: proposal.eventDate || null,
    daysUntilEvent,
    venue: proposal.venue || "Unspecified",
    expectedCrowdSize: proposal.expectedCrowdSize ?? null,
    budget: proposal.budget ?? null,
    hasExternalGuests: proposal.hasExternalGuests ?? false,
    tags: proposal.tags || [],
    description: proposal.description || "",
  };

  const promptText = `You are CampusSync's Dynamic Priority Queue Triage Engine for university event clearance.
Evaluate the pending event proposal below and assign a clearance priority tier.

Proposal Data:
${JSON.stringify(payload, null, 2)}

Triage Policy:
- P1 (Urgent / High-Complexity): Event is within <= 4 days (daysUntilEvent <= 4), OR involves high logistical/safety risk (large crowd >= 150, off-campus/external venue, external VIP/guests, high budget, or complex multi-room/overnight operations) with tight lead time (<= 10 days).
- P2 (Standard): Moderate lead time (5-14 days) or standard campus events (workshops, labs, seminars, 50-150 attendees) without acute urgency.
- P3 (Advance / Low-Risk): Ample lead time (> 14 days) AND low logistical complexity (small meetings, internal orientations, low budget, no external guests).
- complexityScore: integer 1 (simple meeting) to 10 (large multi-stakeholder/external event).
- riskFlags: concise, specific logistical, scheduling, venue, budget, or external guest risks.
- rationale: crisp 1-2 sentence explanation justifying the assigned tier.`;

  const { response } = await generateContentWithModelFallback({
    contents: promptText,
    config: {
      responseMimeType: "application/json",
      responseSchema: triageResponseSchema,
    },
  });

  const parsed = parseJsonResponse<TriageResult>(response.text, "proposal triage");
  return {
    priorityTier: parsed.priorityTier,
    complexityScore: clamp(parsed.complexityScore, 1, 10),
    riskFlags: parsed.riskFlags || [],
    rationale: parsed.rationale || "",
  };
}

export async function triageProposalBatch(
  proposals: Array<TriageProposalInput & { eventId: number }>
): Promise<BatchTriageItem[]> {
  if (!proposals.length) return [];

  const normalized = proposals.map((p) => ({
    eventId: p.eventId,
    title: p.title,
    organization: p.organization || "Student Organization",
    eventDate: p.eventDate || null,
    daysUntilEvent: computeDaysUntilEvent(p.eventDate, p.daysUntilEvent),
    venue: p.venue || "Unspecified",
    expectedCrowdSize: p.expectedCrowdSize ?? null,
    budget: p.budget ?? null,
    hasExternalGuests: p.hasExternalGuests ?? false,
    tags: p.tags || [],
    description: p.description || "",
  }));

  const promptText = `You are CampusSync's Dynamic Priority Queue Triage Engine for university event clearance.
Evaluate every event proposal in the JSON array below and return one triage result per eventId.

Proposals:
${JSON.stringify(normalized, null, 2)}

Triage Policy:
- P1 (Urgent / High-Complexity): Event is within <= 4 days (daysUntilEvent <= 4), OR involves high logistical/safety risk (large crowd >= 150, off-campus/external venue, external VIP/guests, high budget, or complex operations) with tight lead time (<= 10 days).
- P2 (Standard): Moderate lead time (5-14 days) or standard campus events (50-150 attendees, moderate logistics).
- P3 (Advance / Low-Risk): Ample lead time (> 14 days) AND low logistical complexity.
- complexityScore: integer 1-10.
- riskFlags: specific logistical, safety, compliance, or scheduling risks.
- rationale: concise 1-2 sentence justification per event.`;

  const { response } = await generateContentWithModelFallback({
    contents: promptText,
    config: {
      responseMimeType: "application/json",
      responseSchema: batchTriageResponseSchema,
    },
  });

  const parsed = parseJsonResponse<{ results: BatchTriageItem[] }>(
    response.text,
    "batch proposal triage"
  );

  return (parsed.results || []).map((item) => ({
    eventId: item.eventId,
    priorityTier: item.priorityTier,
    complexityScore: clamp(item.complexityScore, 1, 10),
    riskFlags: item.riskFlags || [],
    rationale: item.rationale || "",
  }));
}

// ============================================================================
// 3. AI-Assisted Post-Event Survey Generator
// ============================================================================

export async function generatePostEventSurvey(
  input: SurveyGeneratorInput
): Promise<GeneratedSurveyResult> {
  const count = clamp(input.questionCount ?? 6, 4, 10);

  const promptText = `You are CampusSync's Academic Event Evaluation Designer.
Generate a tailored, high-signal post-event student evaluation questionnaire based on the event details below.

Event Details:
${JSON.stringify(
  {
    eventTitle: input.eventTitle,
    category: input.category || "Academic / Student Organization Event",
    organization: input.organization || "Student Organization",
    venue: input.venue || "Campus Venue",
    objectives: input.objectives,
    targetQuestionCount: count,
  },
  null,
  2
)}

Requirements:
- Generate exactly ${count} focused, non-redundant questions tailored specifically to this event's topic, category, and objectives.
- Include a balanced mix of "rating_1_to_5", "multiple_choice", and "open_text" questions (at least one of each).
- For "multiple_choice" questions, provide 3 to 5 clear options in the "options" array.
- For "rating_1_to_5" and "open_text" questions, return an empty array [] for "options".
- Use clean sequential IDs like "q1", "q2", ...
- Keep wording concise, formal, and student-friendly.`;

  const { response } = await generateContentWithModelFallback({
    contents: promptText,
    config: {
      responseMimeType: "application/json",
      responseSchema: surveyGeneratorResponseSchema,
    },
  });

  const parsed = parseJsonResponse<GeneratedSurveyResult>(
    response.text,
    "post-event survey generation"
  );

  return {
    surveyTitle: parsed.surveyTitle || `${input.eventTitle} — Post-Event Evaluation`,
    description: parsed.description || "",
    questions: (parsed.questions || []).map((q, idx) => ({
      id: q.id || `q${idx + 1}`,
      text: q.text,
      type: q.type,
      required: Boolean(q.required),
      options: q.type === "multiple_choice" ? q.options || [] : [],
    })),
  };
}

// ============================================================================
// 4. Post-Event Survey Sentiment & Diagnostics Synthesis
// ============================================================================

export async function analyzeSurveyFeedback(
  input: SurveyDiagnosticsInput
): Promise<SurveyDiagnosticsResult> {
  if (!input.responses || input.responses.length === 0) {
    throw new Error("At least one survey response is required to run feedback diagnostics.");
  }

  const promptText = `You are CampusSync's Institutional Event Quality & Sentiment Analyst.
Analyze the post-event student survey responses below and synthesize an executive diagnostic report for Admin Coordinators and Department Heads.

Event Context & Collected Responses:
${JSON.stringify(
  {
    eventTitle: input.eventTitle,
    organization: input.organization || "Student Organization",
    eventDate: input.eventDate || null,
    reportedAverageRating: input.averageRating ?? null,
    totalResponsesCount: input.totalResponses ?? input.responses.length,
    sampleResponses: input.responses,
  },
  null,
  2
)}

Analysis Instructions:
- Determine overallSentiment ("Positive", "Mixed", or "Negative") grounded strictly in the provided ratings and comments.
- Compute sentimentScore as an integer 0-100 reflecting overall attendee satisfaction.
- Identify concrete keyStrengths, areasForImprovement, and actionableRecommendations (specific to operations, pacing, venue/tech, and academic value).
- Write executiveSummary as a formal, concise paragraph (3-4 sentences) ready for a Department Head / SAO governance report.`;

  const { response } = await generateContentWithModelFallback({
    contents: promptText,
    config: {
      responseMimeType: "application/json",
      responseSchema: surveyDiagnosticsResponseSchema,
    },
  });

  const parsed = parseJsonResponse<SurveyDiagnosticsResult>(
    response.text,
    "survey sentiment diagnostics"
  );

  return {
    overallSentiment: parsed.overallSentiment,
    sentimentScore: clamp(parsed.sentimentScore, 0, 100),
    keyStrengths: parsed.keyStrengths || [],
    areasForImprovement: parsed.areasForImprovement || [],
    actionableRecommendations: parsed.actionableRecommendations || [],
    executiveSummary: parsed.executiveSummary || "",
  };
}
