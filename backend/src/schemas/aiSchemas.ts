import { Type, type Schema } from "@google/genai";

// ============================================================================
// 1. Multimodal Document & Visual Signature Pre-Screening
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

export interface ExecutiveEventSummary {
  headline: string;
  overview: string;
  keyHighlights: string[];
}

export interface PreScreenResult {
  auditStatus: "COMPLETE" | "DEFECTIVE";
  verdictMessage: string;
  eventSummary: ExecutiveEventSummary;
  overallStatus: "PASSED" | "NEEDS_REVISION" | "FLAGGED";
  completenessScore: number;
  missingFiles: string[];
  missingFields: string[];
  signatureCheck: SignatureCheckResult;
  checklistEvaluation: ChecklistEvaluationItem[];
  inconsistencies: string[];
  reviewerSummary: string;
}

export const preScreenResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    auditStatus: {
      type: Type.STRING,
      enum: ["COMPLETE", "DEFECTIVE"],
      description:
        "COMPLETE ONLY when all mandatory files are attached, all required signatures are visibly present, all required sections are filled, and zero inconsistencies exist between the form and attached files. Otherwise DEFECTIVE.",
    },
    verdictMessage: {
      type: Type.STRING,
      description:
        "Clear, concise 1-sentence readiness verdict for the Admin Coordinator (e.g., confirming everything is complete and signed, or summarizing the key defects found).",
    },
    eventSummary: {
      type: Type.OBJECT,
      properties: {
        headline: {
          type: Type.STRING,
          description:
            "Short Jira-style 1-line executive headline capturing what the event is and who is organizing it.",
        },
        overview: {
          type: Type.STRING,
          description:
            "Clear 2-3 sentence Jira-style executive summary synthesizing both the submitted proposal details and the contents of all attached documents so an Admin Coordinator understands the entire event at a glance.",
        },
        keyHighlights: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            "3 to 6 crisp, scannable bullet points extracted from the proposal and attached files covering event purpose, schedule, venue, target audience/logistics, and budget highlights.",
        },
      },
      required: ["headline", "overview", "keyHighlights"],
    },
    overallStatus: {
      type: Type.STRING,
      enum: ["PASSED", "NEEDS_REVISION", "FLAGGED"],
      description:
        "PASSED if auditStatus is COMPLETE; NEEDS_REVISION for fixable gaps/missing signatures/mismatches; FLAGGED for severe anomalies, blank/unreadable endorsements, or unrelated documents.",
    },
    completenessScore: {
      type: Type.INTEGER,
      description: "Overall compliance and completeness score from 0 to 100.",
    },
    missingFiles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "List of missing mandatory documents (e.g., 'Signed Activity Proposal Form (APF)', 'Participant Liability Waivers (required for off-campus / MPH1 venue)'). Empty array if all required files are attached.",
    },
    missingFields: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "List of required document or proposal sections that are blank, incomplete, or omitted (e.g., 'Itemized Budget Breakdown', 'Program Flow / Schedule'). Empty array if complete.",
    },
    signatureCheck: {
      type: Type.OBJECT,
      properties: {
        signaturesDetected: {
          type: Type.BOOLEAN,
          description: "Whether at least one handwritten/digital signature or official stamp is visually detected.",
        },
        detectedSignatories: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of visually detected signatories and their roles (e.g. 'Organization Adviser - Prof. Cruz').",
        },
        missingSignatureLines: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of signature lines or endorsement blocks that appear blank, unsigned, or missing.",
        },
        visualNotes: {
          type: Type.STRING,
          description: "Concise visual notes on scan legibility, stamp clarity, cropping, or visual anomalies.",
        },
      },
      required: [
        "signaturesDetected",
        "detectedSignatories",
        "missingSignatureLines",
        "visualNotes",
      ],
    },
    checklistEvaluation: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          requirement: {
            type: Type.STRING,
            description: "Institutional requirement evaluated (e.g., Adviser Endorsement, Department Head Slot, Itemized Budget, Event Objectives, Participant Waivers).",
          },
          met: {
            type: Type.BOOLEAN,
            description: "Whether the requirement is satisfied based on the document.",
          },
          evidence: {
            type: Type.STRING,
            description: "Brief factual evidence cited from the document.",
          },
        },
        required: ["requirement", "met", "evidence"],
      },
      description: "Evaluation of institutional clearance checklist items.",
    },
    inconsistencies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "List of discrepancies between submitted proposal form metadata (title, date, time, venue, organizer, budget, attendee count) and the attached PDF/image contents. Empty array if completely consistent.",
    },
    reviewerSummary: {
      type: Type.STRING,
      description: "Concise 2-3 sentence summary for Admin Coordinators and Department Heads.",
    },
  },
  required: [
    "auditStatus",
    "verdictMessage",
    "eventSummary",
    "overallStatus",
    "completenessScore",
    "missingFiles",
    "missingFields",
    "signatureCheck",
    "checklistEvaluation",
    "inconsistencies",
    "reviewerSummary",
  ],
};

// ============================================================================
// 2. Dynamic Priority Queue Triage
// ============================================================================

export interface TriageResult {
  priorityTier: "P1" | "P2" | "P3";
  complexityScore: number;
  riskFlags: string[];
  rationale: string;
}

export const triageResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    priorityTier: {
      type: Type.STRING,
      enum: ["P1", "P2", "P3"],
      description:
        "P1 for Urgent / High-Complexity proposals requiring immediate review; P2 for Standard priority; P3 for Advance / Low-Risk proposals.",
    },
    complexityScore: {
      type: Type.INTEGER,
      description: "Logistical and governance complexity score from 1 (low) to 10 (very high).",
    },
    riskFlags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Specific logistical, safety, budget, external guest, or lead-time risks identified.",
    },
    rationale: {
      type: Type.STRING,
      description: "Brief 1-2 sentence explanation justifying the assigned priority tier.",
    },
  },
  required: ["priorityTier", "complexityScore", "riskFlags", "rationale"],
};

export interface BatchTriageItem extends TriageResult {
  eventId: number;
}

export const batchTriageResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          eventId: {
            type: Type.INTEGER,
            description: "The event_id matching the input proposal.",
          },
          priorityTier: {
            type: Type.STRING,
            enum: ["P1", "P2", "P3"],
          },
          complexityScore: {
            type: Type.INTEGER,
          },
          riskFlags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          rationale: {
            type: Type.STRING,
          },
        },
        required: ["eventId", "priorityTier", "complexityScore", "riskFlags", "rationale"],
      },
    },
  },
  required: ["results"],
};

// ============================================================================
// 3. AI-Assisted Post-Event Survey Generator
// ============================================================================

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

export const surveyGeneratorResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    surveyTitle: {
      type: Type.STRING,
      description: "Concise, formal post-event evaluation survey title.",
    },
    description: {
      type: Type.STRING,
      description: "Brief 1-2 sentence instruction/introduction shown to student respondents.",
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "Unique short question identifier (e.g. 'q1', 'q2').",
          },
          text: {
            type: Type.STRING,
            description: "Clear evaluation question tailored to the event's objectives and category.",
          },
          type: {
            type: Type.STRING,
            enum: ["rating_1_to_5", "multiple_choice", "open_text"],
          },
          required: {
            type: Type.BOOLEAN,
          },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              "Answer choices for multiple_choice questions (3-5 concise options). Empty array for rating_1_to_5 and open_text.",
          },
        },
        required: ["id", "text", "type", "required", "options"],
      },
      description: "5 to 8 balanced post-event evaluation questions mixing ratings, multiple choice, and open-ended feedback.",
    },
  },
  required: ["surveyTitle", "description", "questions"],
};

// ============================================================================
// 4. Post-Event Survey Sentiment & Diagnostics Synthesis
// ============================================================================

export interface SurveyDiagnosticsResult {
  overallSentiment: "Positive" | "Mixed" | "Negative";
  sentimentScore: number;
  keyStrengths: string[];
  areasForImprovement: string[];
  actionableRecommendations: string[];
  executiveSummary: string;
}

export const surveyDiagnosticsResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallSentiment: {
      type: Type.STRING,
      enum: ["Positive", "Mixed", "Negative"],
    },
    sentimentScore: {
      type: Type.INTEGER,
      description: "Aggregate attendee sentiment score from 0 (very negative) to 100 (very positive).",
    },
    keyStrengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 concise bullet points highlighting the strongest aspects praised by attendees.",
    },
    areasForImprovement: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2-5 concise bullet points identifying pain points, logistics issues, or content gaps.",
    },
    actionableRecommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 concrete, practical recommendations for the organizing committee and SAO/Department Head.",
    },
    executiveSummary: {
      type: Type.STRING,
      description: "Concise, formal 3-4 sentence executive diagnostic paragraph suitable for institutional governance reports.",
    },
  },
  required: [
    "overallSentiment",
    "sentimentScore",
    "keyStrengths",
    "areasForImprovement",
    "actionableRecommendations",
    "executiveSummary",
  ],
};
