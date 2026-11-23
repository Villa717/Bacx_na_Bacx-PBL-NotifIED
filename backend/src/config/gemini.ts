import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";
import { env } from "./env.js";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!env.geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the backend server. Add it to backend/.env before calling AI endpoints."
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return client;
}

export const GEMINI_MODEL = env.geminiModel;
export const GEMINI_FALLBACK_MODELS = env.geminiFallbackModels;

function isModelUnavailableError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("NOT_FOUND") ||
    msg.includes("404") ||
    msg.includes("no longer available") ||
    msg.includes("not found for API version")
  );
}

export async function generateContentWithModelFallback(
  params: Omit<GenerateContentParameters, "model">
): Promise<{ response: GenerateContentResponse; modelUsed: string }> {
  const ai = getGeminiClient();
  let lastError: unknown;

  for (const model of GEMINI_FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        ...params,
        model,
      });
      return { response, modelUsed: model };
    } catch (err) {
      lastError = err;
      if (isModelUnavailableError(err)) {
        console.warn(`[Gemini] Model "${model}" unavailable, trying next fallback model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No configured Gemini Flash model succeeded for this API key.");
}
