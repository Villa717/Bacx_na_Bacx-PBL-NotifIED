import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { env } from "./config/env.js";
import { GEMINI_MODEL } from "./config/gemini.js";
import { getSupabaseAdmin } from "./config/supabase.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.corsOrigins.includes("*") || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      // Allow any localhost dev port for multi-app local Vite development
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
        return;
      }
      // Allow Vercel preview & production deployments for testing
      if (origin.startsWith("https://") && origin.endsWith(".vercel.app")) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "campussync-ai-backend",
    model: GEMINI_MODEL,
    geminiConfigured: Boolean(env.geminiApiKey),
    endpoints: [
      "GET /api/health",
      "POST /api/ai/prescreen",
      "POST /api/ai/triage",
      "POST /api/ai/surveys/generate",
      "POST /api/ai/surveys/analyze",
    ],
  });
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "campussync-ai-backend",
    model: GEMINI_MODEL,
    geminiConfigured: Boolean(env.geminiApiKey),
    supabaseStorageConfigured: Boolean(getSupabaseAdmin()),
  });
});

app.use("/api/ai", aiRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    res.status(400).json({ error: `File upload error: ${err.message}` });
    return;
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message });
});

if (!process.env.VERCEL) {
  app.listen(env.port, () => {
    console.log(
      `[CampusSync AI Backend] Listening on http://localhost:${env.port} (model: ${GEMINI_MODEL})`
    );
    if (!env.geminiApiKey) {
      console.warn(
        "[CampusSync AI Backend] Warning: GEMINI_API_KEY is not set. Copy backend/.env.example to backend/.env and add your key."
      );
    }
  });
}

export default app;
