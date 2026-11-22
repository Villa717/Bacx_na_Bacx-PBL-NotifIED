import { GoogleGenAI } from "@google/genai";
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
