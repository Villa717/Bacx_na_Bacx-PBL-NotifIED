import { GoogleGenAI, type GenerateContentParameters, type GenerateContentResponse } from "@google/genai";
import { env } from "./env.js";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!env.geminiApiKey) {
    throw new Error(
      "AI service is not configured on the backend server. Please configure GEMINI_API_KEY."
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }
  return client;
}

export const GEMINI_MODEL = env.geminiModel;
export const GEMINI_FALLBACK_MODELS = env.geminiFallbackModels;

function isFallbackableModelError(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  if (status === 404 || status === 503 || status === 429) {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("NOT_FOUND") ||
    msg.includes("404") ||
    msg.includes("no longer available") ||
    msg.includes("not found for API version") ||
    msg.includes("503") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED")
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
      if (isFallbackableModelError(err)) {
        console.warn(`[Gemini] Model "${model}" unavailable/busy, trying next fallback model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("The AI service is temporarily unavailable. Please retry shortly.");
}
