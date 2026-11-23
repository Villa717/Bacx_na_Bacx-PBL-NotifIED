import dotenv from "dotenv";

dotenv.config();

const rawCorsOrigins =
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:3000";

const RETIRED_MODELS = new Set([
  "gemini-2.5-flash",
  "models/gemini-2.5-flash",
  "gemini-2.5-pro",
  "models/gemini-2.5-pro",
  "gemini-2.0-flash",
  "models/gemini-2.0-flash",
]);

function resolvePrimaryGeminiModel(): string {
  const configured = (process.env.GEMINI_MODEL || "").trim().replace(/^models\//, "");
  if (!configured || RETIRED_MODELS.has(configured) || RETIRED_MODELS.has(`models/${configured}`)) {
    return "gemini-3.8-flash";
  }
  return configured;
}

const primaryGeminiModel = resolvePrimaryGeminiModel();

export const env = {
  port: Number(process.env.PORT || 4000),
  corsOrigins: rawCorsOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: primaryGeminiModel,
  geminiFallbackModels: [
    primaryGeminiModel,
    "gemini-3.8-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
  ].filter((m, idx, arr) => Boolean(m) && arr.indexOf(m) === idx),
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || "proposal-documents",
};
