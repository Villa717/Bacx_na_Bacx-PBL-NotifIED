import { Router, type Request, type Response } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { getSupabaseAdmin, persistOptionalEventFields } from "../config/supabase.js";
import { type PreScreenResult } from "../schemas/aiSchemas.js";
import {
  ALLOWED_MIME_TYPES,
  analyzeSurveyFeedback,
  downloadFromSupabaseStorage,
  generatePostEventSurvey,
  preScreenDocuments,
  triageProposal,
  triageProposalBatch,
  type DocumentInput,
  type ProposalFormMetadata,
  type StorageDocumentRef,
} from "../services/aiService.js";

const router = Router();

interface StoredEventAttachments {
  documents: DocumentInput[];
  preScreenResult?: PreScreenResult;
  updatedAt: string;
}

// Lightweight in-memory attachment relay for cross-portal PDF testing when Supabase Storage bucket isn't provisioned yet
const eventAttachmentStore = new Map<number, StoredEventAttachments>();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB per file
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    const normalized = file.mimetype === "image/jpg" ? "image/jpeg" : file.mimetype;
    if (ALLOWED_MIME_TYPES.has(normalized)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file format (${file.mimetype}). Please upload a PDF, PNG, or JPEG file.`
        )
      );
    }
  },
});

function parseMetadataField(raw: unknown): ProposalFormMetadata {
  if (!raw) return {};
  if (typeof raw === "object") return raw as ProposalFormMetadata;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ProposalFormMetadata;
    } catch {
      return {};
    }
  }
  return {};
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

/**
 * POST /api/ai/events/:eventId/documents
 * Stores Facilitator-uploaded PDF/image attachments (and optional PreScreenResult) so Admin & Dept Head portals can view and inspect them.
 */
router.post(
  "/events/:eventId/documents",
  upload.any(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const eventId = parseOptionalNumber(req.params.eventId);
      if (!eventId) {
        res.status(400).json({ error: "Valid numeric eventId is required." });
        return;
      }

      const uploadedFiles = Array.isArray(req.files) ? req.files : [];
      const docs: DocumentInput[] = uploadedFiles.map((file) => ({
        filename: file.originalname,
        mimeType: file.mimetype === "image/jpg" ? "image/jpeg" : file.mimetype,
        buffer: file.buffer,
      }));

      let preScreenResult: PreScreenResult | undefined;
      if (req.body?.preScreenResult) {
        try {
          preScreenResult =
            typeof req.body.preScreenResult === "string"
              ? (JSON.parse(req.body.preScreenResult) as PreScreenResult)
              : (req.body.preScreenResult as PreScreenResult);
        } catch {
          // Ignore malformed JSON
        }
      }

      const existing = eventAttachmentStore.get(eventId);
      const mergedDocs = docs.length > 0 ? docs : existing?.documents || [];
      const mergedPreScreen = preScreenResult ?? existing?.preScreenResult;

      eventAttachmentStore.set(eventId, {
        documents: mergedDocs,
        preScreenResult: mergedPreScreen,
        updatedAt: new Date().toISOString(),
      });

      // Optionally mirror to Supabase Storage if server credentials are configured
      const supabase = getSupabaseAdmin();
      const uploadedPaths: string[] = [];
      if (supabase && docs.length > 0) {
        for (const doc of docs) {
          const safeName = doc.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `events/${eventId}/${Date.now()}_${safeName}`;
          const { error } = await supabase.storage
            .from(env.supabaseStorageBucket)
            .upload(path, doc.buffer, { contentType: doc.mimeType, upsert: true });
          if (!error) uploadedPaths.push(path);
        }
        if (uploadedPaths.length > 0) {
          await persistOptionalEventFields(eventId, {
            document_bucket: env.supabaseStorageBucket,
            document_path: uploadedPaths[0],
            ...(uploadedPaths[1] ? { waiver_path: uploadedPaths[1] } : {}),
            ...(mergedPreScreen ? { ai_prescreen_result: mergedPreScreen } : {}),
          });
        }
      }

      res.json({
        eventId,
        documents: mergedDocs.map((d, index) => ({
          index,
          filename: d.filename,
          mimeType: d.mimeType,
          size: d.buffer.length,
          downloadPath: `/api/ai/events/${eventId}/documents/${index}`,
        })),
        preScreenResult: mergedPreScreen ?? null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to store event documents";
      res.status(400).json({ error: message });
    }
  }
);

/**
 * GET /api/ai/events/:eventId/documents
 * Lists stored PDF/image attachments and any cached PreScreenResult for a proposal.
 */
router.get("/events/:eventId/documents", (req: Request, res: Response): void => {
  const eventId = parseOptionalNumber(req.params.eventId);
  if (!eventId) {
    res.status(400).json({ error: "Valid numeric eventId is required." });
    return;
  }

  const record = eventAttachmentStore.get(eventId);
  if (!record) {
    res.json({ eventId, documents: [], preScreenResult: null });
    return;
  }

  res.json({
    eventId,
    documents: record.documents.map((d, index) => ({
      index,
      filename: d.filename,
      mimeType: d.mimeType,
      size: d.buffer.length,
      downloadPath: `/api/ai/events/${eventId}/documents/${index}`,
    })),
    preScreenResult: record.preScreenResult ?? null,
    updatedAt: record.updatedAt,
  });
});

/**
 * GET /api/ai/events/:eventId/documents/:index
 * Streams a stored PDF/image inline so reviewers can view it in a new tab.
 */
router.get("/events/:eventId/documents/:index", (req: Request, res: Response): void => {
  const eventId = parseOptionalNumber(req.params.eventId);
  const index = parseOptionalNumber(req.params.index);
  if (!eventId || index === undefined) {
    res.status(400).json({ error: "Valid eventId and document index are required." });
    return;
  }

  const record = eventAttachmentStore.get(eventId);
  const doc = record?.documents[index];
  if (!doc) {
    res.status(404).json({ error: "Attached document not found." });
    return;
  }

  res.setHeader("Content-Type", doc.mimeType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${doc.filename.replace(/"/g, "")}"`
  );
  res.send(doc.buffer);
});

/**
 * POST /api/ai/prescreen
 * Supports:
 *  - multipart/form-data: `documents` (1..5 files) or `document`/`apfFile`/`waiverFile` + JSON `metadata` or individual form fields
 *  - application/json: `{ bucket, path }` or `{ documents: [{ bucket, path }] }` or `{ eventId }` (uses stored event docs) + `metadata`
 */
router.post(
  "/prescreen",
  upload.any(),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const documents: DocumentInput[] = [];

      // 1. Direct multipart uploads from browser
      const uploadedFiles = Array.isArray(req.files) ? req.files : [];
      for (const file of uploadedFiles) {
        documents.push({
          filename: file.originalname,
          mimeType: file.mimetype === "image/jpg" ? "image/jpeg" : file.mimetype,
          buffer: file.buffer,
        });
      }

      // 2. Supabase Storage references (bucket + path)
      const body = req.body || {};
      const storageRefs: StorageDocumentRef[] = [];

      if (body.path && typeof body.path === "string") {
        storageRefs.push({
          bucket: typeof body.bucket === "string" ? body.bucket : undefined,
          path: body.path,
        });
      }

      if (body.storageDocuments) {
        const parsedRefs =
          typeof body.storageDocuments === "string"
            ? JSON.parse(body.storageDocuments)
            : body.storageDocuments;
        if (Array.isArray(parsedRefs)) {
          for (const ref of parsedRefs) {
            if (ref?.path) storageRefs.push(ref);
          }
        }
      } else if (Array.isArray(body.documents)) {
        for (const ref of body.documents) {
          if (ref?.path) storageRefs.push(ref);
        }
      }

      for (const ref of storageRefs) {
        const downloaded = await downloadFromSupabaseStorage(ref);
        documents.push(downloaded);
      }

      const eventId = parseOptionalNumber(body.eventId ?? body.event_id);

      // 3. Fallback to backend attachment store if eventId already has uploaded documents
      if (documents.length === 0 && eventId) {
        const stored = eventAttachmentStore.get(eventId);
        if (stored && stored.documents.length > 0) {
          documents.push(...stored.documents);
        }
      }

      if (documents.length === 0) {
        res.status(400).json({
          error:
            "No documents provided. Upload at least one PDF/PNG/JPEG file or specify a Supabase Storage bucket + path.",
        });
        return;
      }

      const parsedMeta = parseMetadataField(body.metadata);
      const metadata: ProposalFormMetadata = {
        title: parsedMeta.title ?? body.title,
        organization: parsedMeta.organization ?? body.organization,
        eventDate: parsedMeta.eventDate ?? body.eventDate ?? body.event_date,
        startTime: parsedMeta.startTime ?? body.startTime ?? body.start_time,
        endTime: parsedMeta.endTime ?? body.endTime ?? body.end_time,
        venue: parsedMeta.venue ?? body.venue,
        description: parsedMeta.description ?? body.description,
        budget: parsedMeta.budget ?? body.budget ?? body.estimated_budget,
        expectedAttendees:
          parsedMeta.expectedAttendees ??
          parseOptionalNumber(body.expectedAttendees ?? body.proposed_attendees),
        hasExternalGuests:
          parsedMeta.hasExternalGuests ??
          (body.hasExternalGuests === "true" || body.hasExternalGuests === true),
      };

      const { modelUsed, ...result } = await preScreenDocuments(documents, metadata);

      if (eventId) {
        eventAttachmentStore.set(eventId, {
          documents,
          preScreenResult: result,
          updatedAt: new Date().toISOString(),
        });
      }

      const persisted = await persistOptionalEventFields(eventId, {
        ai_prescreen_result: result,
      });

      res.json({
        ...result,
        _meta: {
          modelUsed,
          inspectedFiles: documents.map((d) => ({
            filename: d.filename,
            mimeType: d.mimeType,
          })),
          persisted,
        },
      });
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Automated AI audit failed.";
      const isUpstreamBusy =
        rawMessage.includes("503") ||
        rawMessage.includes("UNAVAILABLE") ||
        rawMessage.includes("high demand") ||
        rawMessage.includes("429");
      const friendlyMessage = isUpstreamBusy
        ? "The AI auditing service is experiencing high demand. Please retry in a moment."
        : rawMessage.startsWith("{")
        ? "The AI auditing service could not process this request. Please retry shortly."
        : rawMessage;
      const statusCode =
        rawMessage.includes("GEMINI_API_KEY") || rawMessage.includes("SUPABASE_") || isUpstreamBusy
          ? 503
          : 400;
      console.error("[/api/ai/prescreen]", err);
      res.status(statusCode).json({ error: friendlyMessage });
    }
  }
);

/**
 * POST /api/ai/triage
 * Accepts either:
 *  - Single proposal object `{ title, eventDate, daysUntilEvent, expectedCrowdSize, budget, hasExternalGuests, venue, description, eventId? }`
 *  - Batch payload `{ proposals: [{ eventId, title, ... }] }`
 */
router.post("/triage", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body || {};

    if (Array.isArray(body.proposals)) {
      if (body.proposals.length === 0) {
        res.status(400).json({ error: "proposals array must contain at least one proposal." });
        return;
      }

      const results = await triageProposalBatch(body.proposals);

      await Promise.all(
        results.map((item) =>
          persistOptionalEventFields(item.eventId, {
            urgency_tier: item.priorityTier,
            ai_triage_result: {
              priorityTier: item.priorityTier,
              complexityScore: item.complexityScore,
              riskFlags: item.riskFlags,
              rationale: item.rationale,
            },
          })
        )
      );

      res.json({ results });
      return;
    }

    if (!body.title || typeof body.title !== "string") {
      res.status(400).json({ error: "Proposal title is required for triage." });
      return;
    }

    const result = await triageProposal({
      eventId: parseOptionalNumber(body.eventId ?? body.event_id),
      title: body.title,
      organization: body.organization,
      eventDate: body.eventDate ?? body.event_date,
      daysUntilEvent: parseOptionalNumber(body.daysUntilEvent),
      venue: body.venue,
      description: body.description,
      expectedCrowdSize: parseOptionalNumber(
        body.expectedCrowdSize ?? body.expectedAttendees ?? body.proposed_attendees
      ),
      budget: body.budget ?? body.estimated_budget,
      hasExternalGuests: Boolean(body.hasExternalGuests ?? body.has_external_guests),
      tags: Array.isArray(body.tags) ? body.tags : undefined,
    });

    const eventId = parseOptionalNumber(body.eventId ?? body.event_id);
    await persistOptionalEventFields(eventId, {
      urgency_tier: result.priorityTier,
      ai_triage_result: result,
    });

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Triage evaluation failed";
    const statusCode = message.includes("GEMINI_API_KEY") ? 503 : 400;
    console.error("[/api/ai/triage]", err);
    res.status(statusCode).json({ error: message });
  }
});

/**
 * POST /api/ai/surveys/generate
 */
router.post("/surveys/generate", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body || {};
    const eventTitle = (body.eventTitle || body.title || "").trim();
    const objectives = (body.objectives || body.description || "").trim();

    if (!eventTitle) {
      res.status(400).json({ error: "eventTitle is required to generate a survey." });
      return;
    }

    const result = await generatePostEventSurvey({
      eventTitle,
      category: body.category,
      organization: body.organization,
      venue: body.venue,
      objectives: objectives || `Evaluate attendee experience and learning outcomes for ${eventTitle}.`,
      questionCount: parseOptionalNumber(body.questionCount),
    });

    const eventId = parseOptionalNumber(body.eventId ?? body.event_id);
    await persistOptionalEventFields(eventId, {
      ai_survey_draft: result,
    });

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Survey generation failed";
    const statusCode = message.includes("GEMINI_API_KEY") ? 503 : 400;
    console.error("[/api/ai/surveys/generate]", err);
    res.status(statusCode).json({ error: message });
  }
});

/**
 * POST /api/ai/surveys/analyze
 */
router.post("/surveys/analyze", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body || {};
    const eventTitle = (body.eventTitle || body.title || "").trim();
    const responses = Array.isArray(body.responses) ? body.responses : [];

    if (!eventTitle) {
      res.status(400).json({ error: "eventTitle is required to analyze feedback." });
      return;
    }
    if (responses.length === 0) {
      res.status(400).json({ error: "At least one survey response is required for analysis." });
      return;
    }

    const result = await analyzeSurveyFeedback({
      eventTitle,
      organization: body.organization,
      eventDate: body.eventDate ?? body.event_date,
      averageRating: parseOptionalNumber(body.averageRating),
      totalResponses: parseOptionalNumber(body.totalResponses),
      responses,
    });

    const eventId = parseOptionalNumber(body.eventId ?? body.event_id);
    await persistOptionalEventFields(eventId, {
      ai_feedback_analysis: result,
    });

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Feedback analysis failed";
    const statusCode = message.includes("GEMINI_API_KEY") ? 503 : 400;
    console.error("[/api/ai/surveys/analyze]", err);
    res.status(statusCode).json({ error: message });
  }
});

export default router;
