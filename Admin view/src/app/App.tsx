import { useState, useEffect } from "react";
import {
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Inbox,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
  Home,
  ClipboardCheck,
  BarChart3,
  Users,
  Megaphone,
  Send,
  ShieldCheck,
  Search,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  AlertTriangle,
  XCircle,
  PenTool,
  FileCheck2,
  Upload,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Brain,
  Save,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  aiLocalCache,
  analyzeAiSurveyFeedback,
  generateAiSurvey,
  runBatchProposalTriage,
  runDocumentPreScreen,
  runProposalTriage,
  type GeneratedQuestionType,
  type GeneratedSurveyQuestion,
  type GeneratedSurveyResult,
  type PreScreenResult,
  type SurveyDiagnosticsResult,
  type SurveyResponseEntry,
  type TriageResult,
} from "../lib/aiClient";
import adminBg from "../assets/admin-bg.jpeg";

// Designated prototype coordinator credentials (or accept any valid @apc.edu.ph staff/admin email)
const VALID_ADMIN_EMAIL = "coordinator@apc.edu.ph";
const VALID_ADMIN_PASSWORD = "adminpassword123";

export interface EventRecord {
  event_id: number;
  title: string;
  organization?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  description: string;
  tags?: string[];
  status: "pending" | "approved" | "revision" | "needs_revision" | "completed" | "rejected";
  urgency_tier?: "P1" | "P2" | "P3";
  clearance_hash?: string;
  admin_feedback?: string;
  external_registration_link?: string;
  registration_link?: string;
  has_qr_code?: boolean;
  qr_code_url?: string;
  proposed_attendees?: number;
  accepted_attendees?: number;
  estimated_budget?: number;
  has_external_guests?: boolean;
  document_bucket?: string;
  document_path?: string;
  waiver_path?: string;
  ai_prescreen_result?: PreScreenResult;
  ai_triage_result?: TriageResult;
  ai_survey_draft?: GeneratedSurveyResult;
  ai_feedback_analysis?: SurveyDiagnosticsResult;
  created_at?: string;
}

interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  audience: string;
  created_at: string;
}

export interface FacilitatorAccount {
  id: string;
  full_name: string;
  email: string;
  organization: string;
  role: string;
  status: "Active" | "Inactive";
  last_active: string;
}

const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 1,
    title: "Term 2 Clearance Submission Cutoff",
    content:
      "All student organization activity proposals for Term 2 must be submitted with signed Adviser APFs at least 5 business days prior to event execution.",
    audience: "All Facilitators",
    created_at: "Nov 18, 2026",
  },
  {
    id: 2,
    title: "Off-Campus & MPH1 Waiver Enforcement",
    content:
      "Proposals utilizing Multipurpose Hall 1 (MPH1) or off-campus venues require attached participant liability waivers for AI Pre-Check clearance.",
    audience: "All Facilitators",
    created_at: "Nov 15, 2026",
  },
];

export default function CoordinatorView() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedSession = localStorage.getItem("campussync_admin_logged_in");
    const savedEmail = localStorage.getItem("campussync_admin_remembered_email");

    if (savedSession === "true") {
      setIsLoggedIn(true);
    }
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    const isValid =
      (trimmedEmail === VALID_ADMIN_EMAIL && trimmedPassword === VALID_ADMIN_PASSWORD) ||
      (trimmedEmail === "admin@apc.edu.ph" && trimmedPassword === "adminpassword123") ||
      (trimmedEmail.endsWith("@apc.edu.ph") && trimmedPassword.length >= 6);

    if (!isValid) {
      setErrorMessage("Invalid credentials. Try coordinator@apc.edu.ph / adminpassword123");
      return;
    }

    if (rememberMe) {
      localStorage.setItem("campussync_admin_remembered_email", trimmedEmail);
      localStorage.setItem("campussync_admin_logged_in", "true");
    } else {
      localStorage.removeItem("campussync_admin_remembered_email");
      localStorage.removeItem("campussync_admin_logged_in");
    }

    setIsLoggedIn(true);
    setPassword("");
  };

  const handleLogout = () => {
    localStorage.removeItem("campussync_admin_logged_in");
    setIsLoggedIn(false);
    setPassword("");
    setErrorMessage("");
  };

  if (!isLoggedIn) {
    return (
      <div
        className="min-h-screen w-full relative flex flex-col justify-between p-6 md:p-10 font-sans text-white bg-[#D97706] bg-cover bg-center overflow-x-hidden"
        style={{ backgroundImage: `url(${adminBg})` }}
      >
        {/* ── Top Header Navigation ── */}
        <header className="w-full flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-[#0B132B] flex items-center justify-center font-black text-[#FFD000] text-lg border border-white/10 shadow-md rounded-none">
              C
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">CampusSync</span>
                <span className="bg-[#0B132B] text-[#FFD000] text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider border border-white/10 rounded-none">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-medium">Asia Pacific College Enterprise System</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0B132B] border border-white/15 text-white text-xs font-semibold shadow-md rounded-none">
            <span className="size-2 bg-emerald-400"></span>
            CAMPUSSYNC: ADMIN COORDINATOR
          </div>
        </header>

        {/* ── Main Left-Weighted Auth Terminal ── */}
        <main className="w-full my-auto py-8 z-10 flex items-center justify-start lg:pl-16">
          <div className="w-full max-w-[440px] bg-[#0E1528] border border-white/10 shadow-2xl p-8 md:p-10 text-left rounded-none">
            <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-[#FFD000] mb-3 uppercase">
              <span>AUTHORIZED CLEARANCE ACCESS</span>
              <span className="text-white/40">v2.5 SECURE</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
              Admin Login
            </h1>
            <p className="text-xs text-[#8D99AE] mb-6">
              Review, clear, and publish campus event proposals.
            </p>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 rounded-none">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono tracking-wider text-slate-300 uppercase block mb-1.5">
                  INSTITUTIONAL EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coordinator@apc.edu.ph"
                  className="w-full px-3.5 py-2.5 bg-[#080D1A] border border-white/15 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFD000] transition rounded-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono tracking-wider text-slate-300 uppercase block mb-1.5">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-[#080D1A] border border-white/15 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#FFD000] transition rounded-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="bg-[#080D1A] border-white/20 text-[#FFD000] focus:ring-0 cursor-pointer rounded-none"
                  />
                  Remember Me
                </label>
                <span className="text-[#FFD000] hover:underline cursor-pointer text-xs">
                  Forgot Password?
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FDB813] hover:bg-[#e0a20f] text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition shadow-lg cursor-pointer mt-4 rounded-none"
              >
                SIGN IN TO COORDINATOR PORTAL →
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/50">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 bg-[#FFD000]"></span>
                Campus Clearance Portal
              </span>
              <span>Asia Pacific College</span>
            </div>
          </div>
        </main>

        <div className="h-4 z-10 shrink-0"></div>
      </div>
    );
  }

  return <CoordinatorInterface onLogout={handleLogout} coordinatorEmail={email || VALID_ADMIN_EMAIL} />;
}

function getLeadTimeBadge(dateStr: string) {
  if (!dateStr) return { text: "No date", isUrgent: false };
  const target = new Date(dateStr).getTime();
  const now = new Date().getTime();
  const diffHours = Math.round((target - now) / (1000 * 60 * 60));

  if (diffHours <= 0) return { text: "Passed", isUrgent: false };
  if (diffHours <= 48) return { text: `🔴 In ${diffHours}h`, isUrgent: true };
  if (diffHours <= 96) return { text: `🟡 In ${Math.round(diffHours / 24)}d`, isUrgent: true };
  return { text: `🟢 In ${Math.round(diffHours / 24)}d`, isUrgent: false };
}

function getTierBadgeMeta(tier: "P1" | "P2" | "P3"): {
  tier: "P1" | "P2" | "P3";
  label: string;
  style: string;
} {
  if (tier === "P1") {
    return {
      tier: "P1",
      label: "P1 HIGH",
      style: "bg-red-500/20 text-red-400 border border-red-500/40 rounded-none",
    };
  }
  if (tier === "P2") {
    return {
      tier: "P2",
      label: "P2 MED",
      style: "bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-none",
    };
  }
  return {
    tier: "P3",
    label: "P3 STD",
    style: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-none",
  };
}

function computeDynamicUrgency(dateStr: string | null): {
  tier: "P1" | "P2" | "P3";
  label: string;
  style: string;
} {
  if (!dateStr) return getTierBadgeMeta("P3");

  const target = new Date(dateStr).getTime();
  const now = new Date().getTime();
  const diffHours = (target - now) / (1000 * 60 * 60);

  if (diffHours <= 96) return getTierBadgeMeta("P1");
  if (diffHours <= 336) return getTierBadgeMeta("P2");
  return getTierBadgeMeta("P3");
}

function getDefaultSurveyResponses(eventTitle: string): SurveyResponseEntry[] {
  return [
    {
      rating: 5,
      comment: `The ${eventTitle} session was well-organized and the speakers gave practical examples we can apply in our coursework.`,
    },
    {
      rating: 4,
      comment:
        "Very engaging program overall, though registration check-in took a bit longer than expected during the first 15 minutes.",
    },
    {
      rating: 5,
      comment:
        "Loved the interactive Q&A and peer collaboration segments. Would definitely attend a follow-up workshop.",
    },
    {
      rating: 3,
      comment:
        "Good content, but the audio in the back rows was slightly muffled and we ran out of time for hands-on troubleshooting.",
    },
  ];
}

export function CoordinatorInterface({
  onLogout,
  coordinatorEmail = VALID_ADMIN_EMAIL,
}: {
  onLogout?: () => void;
  coordinatorEmail?: string;
}) {
  // Always lands on Home upon logging in
  const [activeNav, setActiveNav] = useState<"home" | "approvals" | "surveys" | "accounts">("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [triageTier, setTriageTier] = useState<"ALL" | "P1" | "P2" | "P3">("ALL");
  const [reviewFilter, setReviewFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  // Home / Announcements States
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(DEFAULT_ANNOUNCEMENTS);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  // Account Management States (Empty until Facilitator View signup/persistence is connected)
  const [facilitatorAccounts, setFacilitatorAccounts] = useState<FacilitatorAccount[]>([]);
  const [accountSearch, setAccountSearch] = useState("");

  // ── AI Feature 1: Multimodal Document & Signature Pre-Screening State ──
  const [preScreenMap, setPreScreenMap] = useState<Record<string, PreScreenResult>>(() =>
    aiLocalCache.getPreScreens()
  );
  const [preScreenLoading, setPreScreenLoading] = useState(false);
  const [preScreenError, setPreScreenError] = useState("");

  // ── AI Feature 2: Dynamic Priority Queue Triage State ──
  const [triageMap, setTriageMap] = useState<Record<string, TriageResult>>(() =>
    aiLocalCache.getTriages()
  );
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageError, setTriageError] = useState("");
  const [expandedTriageIds, setExpandedTriageIds] = useState<Record<number, boolean>>({});

  // ── AI Feature 3: Post-Event Survey Generator State ──
  const [surveyTargetEventId, setSurveyTargetEventId] = useState<number | "">("");
  const [surveyCategory, setSurveyCategory] = useState("Academic Seminar / Workshop");
  const [surveyObjectives, setSurveyObjectives] = useState("");
  const [generatingSurvey, setGeneratingSurvey] = useState(false);
  const [surveyGenError, setSurveyGenError] = useState("");
  const [activeSurveyDraft, setActiveSurveyDraft] = useState<GeneratedSurveyResult | null>(null);
  const [savedSurveyDrafts, setSavedSurveyDrafts] = useState<
    Record<string, GeneratedSurveyResult>
  >(() => aiLocalCache.getSurveyDrafts());
  const [surveySaveMessage, setSurveySaveMessage] = useState("");

  // ── AI Feature 4: Post-Event Survey Sentiment & Diagnostics State ──
  const [feedbackResponsesByEvent, setFeedbackResponsesByEvent] = useState<
    Record<number, SurveyResponseEntry[]>
  >({});
  const [feedbackAnalysisMap, setFeedbackAnalysisMap] = useState<
    Record<string, SurveyDiagnosticsResult>
  >(() => aiLocalCache.getFeedbackAnalyses());
  const [analyzingEventId, setAnalyzingEventId] = useState<number | null>(null);
  const [feedbackError, setFeedbackError] = useState("");
  const [expandedFeedbackEventId, setExpandedFeedbackEventId] = useState<number | null>(null);
  const [newFeedbackRating, setNewFeedbackRating] = useState(5);
  const [newFeedbackComment, setNewFeedbackComment] = useState("");

  const getEventTriage = (ev: EventRecord): TriageResult | undefined =>
    ev.ai_triage_result || triageMap[String(ev.event_id)];

  const getEventPreScreen = (ev: EventRecord): PreScreenResult | undefined =>
    ev.ai_prescreen_result || preScreenMap[String(ev.event_id)];

  const [dbError, setDbError] = useState("");

  const normalizedStatus = (status?: string) => (status || "pending").toLowerCase().trim();

  const pendingReviewEvents = events.filter((e) => {
    const s = normalizedStatus(e.status);
    return s === "pending" || s === "needs_revision" || s === "revision";
  });
  const approvedEvents = events.filter((e) => {
    const s = normalizedStatus(e.status);
    return s === "approved" || s === "completed";
  });
  const p1UrgentCount = pendingReviewEvents.filter((e) => {
    const aiTriage = getEventTriage(e);
    const tier = aiTriage?.priorityTier || e.urgency_tier || computeDynamicUrgency(e.event_date).tier;
    return tier === "P1";
  }).length;

  const baseEventsList = reviewFilter === "PENDING" ? pendingReviewEvents : events;

  const triagedEvents = baseEventsList
    .map((item) => {
      const aiTriage = getEventTriage(item);
      const effectiveTier =
        aiTriage?.priorityTier || item.urgency_tier || computeDynamicUrgency(item.event_date).tier;
      return {
        ...item,
        aiTriage,
        calculatedUrgency: getTierBadgeMeta(effectiveTier),
      };
    })
    .filter((item) => {
      if (triageTier === "ALL") return true;
      return item.calculatedUrgency.tier === triageTier;
    })
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3 };
      const diffPriority =
        priorityOrder[a.calculatedUrgency.tier] - priorityOrder[b.calculatedUrgency.tier];
      if (diffPriority !== 0) return diffPriority;
      const compDiff = (b.aiTriage?.complexityScore || 0) - (a.aiTriage?.complexityScore || 0);
      if (compDiff !== 0) return compDiff;
      const timeA = a.event_date ? new Date(a.event_date).getTime() : Number.MAX_SAFE_INTEGER;
      const timeB = b.event_date ? new Date(b.event_date).getTime() : Number.MAX_SAFE_INTEGER;
      return (Number.isNaN(timeA) ? Number.MAX_SAFE_INTEGER : timeA) -
        (Number.isNaN(timeB) ? Number.MAX_SAFE_INTEGER : timeB);
    });

  const fetchQueue = async () => {
    setLoading(true);
    setDbError("");
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_id", { ascending: false });

      if (error) {
        console.error("Error fetching queue from Supabase:", error.message);
        setDbError(`Supabase sync error: ${error.message}`);
      } else if (data) {
        setEvents(data as EventRecord[]);
        if (data.length > 0 && !selectedEventId) {
          setSelectedEventId(data[0].event_id);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not reach Supabase.";
      console.error("Error fetching queue from Supabase:", msg);
      setDbError(`Supabase connection failed: ${msg}`);
    }
    setLoading(false);
  };

  // Sync live registered facilitator accounts once Facilitator Portal creates users
  const fetchFacilitatorAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role_id", 1);

      if (!error && data && data.length > 0) {
        const mapped: FacilitatorAccount[] = data.map((u: any) => ({
          id: `FAC-${String(u.user_id).padStart(3, "0")}`,
          full_name: u.full_name,
          email: u.email,
          organization: u.organization || "Student Organization",
          role: "Activity Facilitator",
          status: "Active",
          last_active: "Registered",
        }));
        setFacilitatorAccounts(mapped);
      } else {
        setFacilitatorAccounts([]);
      }
    } catch (err) {
      console.error("Error fetching facilitator accounts:", err);
      setFacilitatorAccounts([]);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("announcement_id", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: AnnouncementItem[] = data.map((a: any) => ({
          id: a.announcement_id,
          title: a.title,
          content: a.content,
          audience: a.target_audience || "All Facilitators",
          created_at: a.published_at
            ? new Date(a.published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Recent",
        }));
        setAnnouncements([...mapped, ...DEFAULT_ANNOUNCEMENTS]);
      }
    } catch {
      // Fall back to default announcements
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchFacilitatorAccounts();
    fetchAnnouncements();

    const channel = supabase
      .channel("events-queue-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const selectedEvent =
    triagedEvents.find((e) => e.event_id === selectedEventId) ||
    events.find((e) => e.event_id === selectedEventId) ||
    triagedEvents[0];

  const selectedPreScreen = selectedEvent ? getEventPreScreen(selectedEvent) : undefined;
  const selectedTriage = selectedEvent ? getEventTriage(selectedEvent) : undefined;

  const persistOptionalEventColumns = async (
    eventId: number,
    fields: Record<string, unknown>
  ) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("event_id", eventId);
      if (error) {
        console.warn("Optional Supabase AI column update skipped:", error.message);
      }
    } catch {
      // Gracefully fall back to local state/cache
    }
  };

  // ── AI Handler 1: On-Demand Multimodal Document Inspection (Upload or Supabase Storage) ──
  const handleInspectProposalDocument = async (ev: EventRecord, file?: File) => {
    setPreScreenLoading(true);
    setPreScreenError("");

    try {
      const storageDocuments =
        !file && ev.document_path
          ? [
              { bucket: ev.document_bucket, path: ev.document_path },
              ...(ev.waiver_path ? [{ bucket: ev.document_bucket, path: ev.waiver_path }] : []),
            ]
          : [];

      const result = await runDocumentPreScreen({
        files: file ? [file] : [],
        storageDocuments,
        eventId: ev.event_id,
        metadata: {
          title: ev.title,
          organization: ev.organization,
          eventDate: ev.event_date,
          startTime: ev.start_time,
          endTime: ev.end_time,
          venue: ev.venue,
          description: ev.description,
          budget: ev.estimated_budget,
          expectedAttendees: ev.proposed_attendees,
          hasExternalGuests: ev.has_external_guests,
        },
      });

      aiLocalCache.savePreScreen(ev.event_id, result);
      setPreScreenMap((prev) => ({ ...prev, [String(ev.event_id)]: result }));
      await persistOptionalEventColumns(ev.event_id, { ai_prescreen_result: result });
    } catch (err) {
      setPreScreenError(err instanceof Error ? err.message : "Failed to run AI document inspection.");
    } finally {
      setPreScreenLoading(false);
    }
  };

  // ── AI Handler 2: Dynamic Priority Queue Triage (Batch & Single) ──
  const handleRunBatchTriage = async () => {
    const targets = baseEventsList;
    if (targets.length === 0) return;
    setTriageLoading(true);
    setTriageError("");

    try {
      const results = await runBatchProposalTriage(
        targets.map((ev) => ({
          eventId: ev.event_id,
          title: ev.title,
          organization: ev.organization,
          eventDate: ev.event_date,
          venue: ev.venue,
          description: ev.description,
          expectedCrowdSize: ev.proposed_attendees,
          budget: ev.estimated_budget,
          hasExternalGuests: ev.has_external_guests,
          tags: ev.tags,
        }))
      );

      const nextMap = { ...triageMap };
      for (const item of results) {
        const triageObj: TriageResult = {
          priorityTier: item.priorityTier,
          complexityScore: item.complexityScore,
          riskFlags: item.riskFlags,
          rationale: item.rationale,
        };
        nextMap[String(item.eventId)] = triageObj;
        aiLocalCache.saveTriage(item.eventId, triageObj);
        void persistOptionalEventColumns(item.eventId, {
          urgency_tier: item.priorityTier,
          ai_triage_result: triageObj,
        });
      }
      setTriageMap(nextMap);
    } catch (err) {
      setTriageError(err instanceof Error ? err.message : "AI Queue Triage failed.");
    } finally {
      setTriageLoading(false);
    }
  };

  const handleRunSingleTriage = async (ev: EventRecord) => {
    setTriageLoading(true);
    setTriageError("");
    try {
      const result = await runProposalTriage({
        eventId: ev.event_id,
        title: ev.title,
        organization: ev.organization,
        eventDate: ev.event_date,
        venue: ev.venue,
        description: ev.description,
        expectedCrowdSize: ev.proposed_attendees,
        budget: ev.estimated_budget,
        hasExternalGuests: ev.has_external_guests,
        tags: ev.tags,
      });
      aiLocalCache.saveTriage(ev.event_id, result);
      setTriageMap((prev) => ({ ...prev, [String(ev.event_id)]: result }));
      await persistOptionalEventColumns(ev.event_id, {
        urgency_tier: result.priorityTier,
        ai_triage_result: result,
      });
    } catch (err) {
      setTriageError(err instanceof Error ? err.message : "AI Triage failed.");
    } finally {
      setTriageLoading(false);
    }
  };

  // ── AI Handler 3: Generate Post-Event Survey with AI ──
  const handleGenerateSurveyWithAi = async () => {
    const targetEv =
      events.find((e) => e.event_id === surveyTargetEventId) ||
      approvedEvents[0] ||
      events[0];

    const eventTitle = targetEv?.title || "Campus Academic Symposium";
    const objectives =
      surveyObjectives.trim() ||
      targetEv?.description ||
      `Evaluate student learning outcomes, logistics, and speaker effectiveness for ${eventTitle}.`;

    setGeneratingSurvey(true);
    setSurveyGenError("");
    setSurveySaveMessage("");

    try {
      const result = await generateAiSurvey({
        eventId: targetEv?.event_id,
        eventTitle,
        category: surveyCategory,
        organization: targetEv?.organization,
        venue: targetEv?.venue,
        objectives,
      });
      setActiveSurveyDraft(result);
    } catch (err) {
      setSurveyGenError(err instanceof Error ? err.message : "Failed to generate survey with AI.");
    } finally {
      setGeneratingSurvey(false);
    }
  };

  const handleSaveSurveyDraft = async () => {
    if (!activeSurveyDraft) return;
    const targetEv =
      events.find((e) => e.event_id === surveyTargetEventId) ||
      approvedEvents[0] ||
      events[0];
    const key = targetEv ? String(targetEv.event_id) : "custom-draft";
    aiLocalCache.saveSurveyDraft(key, activeSurveyDraft);
    setSavedSurveyDrafts((prev) => ({ ...prev, [key]: activeSurveyDraft }));
    if (targetEv) {
      await persistOptionalEventColumns(targetEv.event_id, {
        ai_survey_draft: activeSurveyDraft,
      });
    }
    setSurveySaveMessage("Survey saved and ready for deployment.");
  };

  const updateDraftQuestion = (
    qId: string,
    patch: Partial<GeneratedSurveyQuestion>
  ) => {
    setActiveSurveyDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)),
      };
    });
  };

  const addDraftQuestion = () => {
    setActiveSurveyDraft((prev) => {
      const base: GeneratedSurveyResult = prev || {
        surveyTitle: "Post-Event Student Evaluation",
        description: "Please share your feedback to help improve future campus events.",
        questions: [],
      };
      const nextId = `q${base.questions.length + 1}_${Date.now().toString(36).slice(-3)}`;
      return {
        ...base,
        questions: [
          ...base.questions,
          {
            id: nextId,
            text: "How satisfied were you with the overall event experience?",
            type: "rating_1_to_5",
            required: true,
            options: [],
          },
        ],
      };
    });
  };

  const removeDraftQuestion = (qId: string) => {
    setActiveSurveyDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.filter((q) => q.id !== qId),
      };
    });
  };

  // ── AI Handler 4: Post-Event Feedback Sentiment & Diagnostics ──
  const getResponsesForEvent = (ev: EventRecord): SurveyResponseEntry[] =>
    feedbackResponsesByEvent[ev.event_id] || getDefaultSurveyResponses(ev.title);

  const handleAddFeedbackResponse = (ev: EventRecord) => {
    if (!newFeedbackComment.trim()) return;
    const current = getResponsesForEvent(ev);
    setFeedbackResponsesByEvent((prev) => ({
      ...prev,
      [ev.event_id]: [
        { rating: newFeedbackRating, comment: newFeedbackComment.trim() },
        ...current,
      ],
    }));
    setNewFeedbackComment("");
    setNewFeedbackRating(5);
  };

  const handleAnalyzeFeedbackWithAi = async (ev: EventRecord) => {
    const responses = getResponsesForEvent(ev);
    const rated = responses.filter((r) => typeof r.rating === "number");
    const avgRating =
      rated.length > 0
        ? Number((rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length).toFixed(2))
        : undefined;

    setAnalyzingEventId(ev.event_id);
    setExpandedFeedbackEventId(ev.event_id);
    setFeedbackError("");

    try {
      const result = await analyzeAiSurveyFeedback({
        eventId: ev.event_id,
        eventTitle: ev.title,
        organization: ev.organization,
        eventDate: ev.event_date,
        averageRating: avgRating,
        totalResponses: responses.length,
        responses,
      });
      aiLocalCache.saveFeedbackAnalysis(ev.event_id, result);
      setFeedbackAnalysisMap((prev) => ({ ...prev, [String(ev.event_id)]: result }));
      await persistOptionalEventColumns(ev.event_id, { ai_feedback_analysis: result });
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : "AI feedback analysis failed.");
    } finally {
      setAnalyzingEventId(null);
    }
  };

  const handleUpdateStatus = async (
    status: "approved" | "rejected" | "revision",
    feedback?: string
  ) => {
    if (!selectedEvent) return;
    setActionLoading(true);

    const dbStatus = status === "revision" ? "needs_revision" : status;

    const { error } = await supabase
      .from("events")
      .update({
        status: dbStatus,
        admin_feedback: feedback || null,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", selectedEvent.event_id);

    if (error) {
      console.error(`Failed to update status to ${status}:`, error.message);
      alert(`Could not submit: ${error.message}`);
    } else {
      setShowRevisionModal(false);
      setRevisionFeedback("");
      await fetchQueue();
    }
    setActionLoading(false);
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    const newItem: AnnouncementItem = {
      id: Date.now(),
      title: annTitle.trim(),
      content: annContent.trim(),
      audience: "All Facilitators",
      created_at: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };

    await supabase.from("announcements").insert([
      {
        title: newItem.title,
        content: newItem.content,
        target_audience: "facilitators",
      },
    ]);

    setAnnouncements([newItem, ...announcements]);
    setAnnTitle("");
    setAnnContent("");
  };

  const filteredFacilitators = facilitatorAccounts.filter(
    (acc) =>
      acc.full_name.toLowerCase().includes(accountSearch.toLowerCase()) ||
      acc.email.toLowerCase().includes(accountSearch.toLowerCase()) ||
      acc.organization.toLowerCase().includes(accountSearch.toLowerCase())
  );

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#0B132B] text-white font-sans">
      {/* ── RAMS-STYLE COLLAPSIBLE LEFT SIDEBAR NAVIGATION ── */}
      <aside
        className={`${
          isSidebarCollapsed ? "w-20" : "w-64"
        } bg-[#181D24] border-r border-white/10 flex flex-col justify-between shrink-0 select-none transition-all duration-200`}
      >
        <div>
          {/* Institutional Brand Header + Collapse Toggle */}
          <div className="p-4 border-b border-white/10 bg-[#12161C] flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 bg-[#0B132B] border border-[#FDB813]/40 flex items-center justify-center font-black text-[#FDB813] text-lg shrink-0 rounded-none">
                C
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0 text-left">
                  <div className="font-black text-sm tracking-tight text-white truncate">CampusSync</div>
                  <div className="text-[10px] font-mono text-[#FDB813] tracking-wider uppercase truncate">
                    ASIA PACIFIC COLLEGE
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="p-1.5 text-slate-400 hover:text-[#FDB813] hover:bg-white/5 transition cursor-pointer shrink-0"
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          </div>

          {/* Categorized Menu */}
          <nav className="py-4 space-y-5">
            <div>
              {!isSidebarCollapsed && (
                <div className="px-4 mb-1.5 text-[10px] font-bold tracking-wider text-[#FDB813] uppercase">
                  OVERVIEW
                </div>
              )}
              <button
                type="button"
                title="Home"
                onClick={() => setActiveNav("home")}
                className={`w-full px-4 py-2.5 text-xs flex items-center ${
                  isSidebarCollapsed ? "justify-center" : "gap-3"
                } transition-colors cursor-pointer ${
                  activeNav === "home"
                    ? "bg-white/10 text-white font-bold border-l-4 border-[#FDB813]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                }`}
              >
                <Home className="size-4 text-[#FDB813] shrink-0" />
                {!isSidebarCollapsed && <span>Home</span>}
              </button>
            </div>

            <div>
              {!isSidebarCollapsed && (
                <div className="px-4 mb-1.5 text-[10px] font-bold tracking-wider text-[#FDB813] uppercase">
                  CLEARANCE WORKFLOW
                </div>
              )}
              <button
                type="button"
                title="Pending Approvals"
                onClick={() => setActiveNav("approvals")}
                className={`w-full px-4 py-2.5 text-xs flex items-center ${
                  isSidebarCollapsed ? "justify-center relative" : "justify-between"
                } transition-colors cursor-pointer ${
                  activeNav === "approvals"
                    ? "bg-white/10 text-white font-bold border-l-4 border-[#FDB813]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                }`}
              >
                <span className="flex items-center gap-3">
                  <ClipboardCheck className="size-4 text-[#FDB813] shrink-0" />
                  {!isSidebarCollapsed && <span>Pending Approvals</span>}
                </span>
                {pendingReviewEvents.length > 0 && (
                  <span
                    className={`${
                      isSidebarCollapsed ? "absolute top-1.5 right-2 px-1 text-[9px]" : "px-1.5 py-0.5 text-[10px]"
                    } font-bold bg-[#FDB813] text-black`}
                  >
                    {pendingReviewEvents.length}
                  </span>
                )}
              </button>
            </div>

            <div>
              {!isSidebarCollapsed && (
                <div className="px-4 mb-1.5 text-[10px] font-bold tracking-wider text-[#FDB813] uppercase">
                  GOVERNANCE & ANALYTICS
                </div>
              )}
              <button
                type="button"
                title="Surveys"
                onClick={() => setActiveNav("surveys")}
                className={`w-full px-4 py-2.5 text-xs flex items-center ${
                  isSidebarCollapsed ? "justify-center" : "gap-3"
                } transition-colors cursor-pointer ${
                  activeNav === "surveys"
                    ? "bg-white/10 text-white font-bold border-l-4 border-[#FDB813]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                }`}
              >
                <BarChart3 className="size-4 text-[#FDB813] shrink-0" />
                {!isSidebarCollapsed && <span>Surveys</span>}
              </button>

              <button
                type="button"
                title="Account Management"
                onClick={() => setActiveNav("accounts")}
                className={`w-full px-4 py-2.5 text-xs flex items-center ${
                  isSidebarCollapsed ? "justify-center" : "gap-3"
                } transition-colors cursor-pointer ${
                  activeNav === "accounts"
                    ? "bg-white/10 text-white font-bold border-l-4 border-[#FDB813]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                }`}
              >
                <Users className="size-4 text-[#FDB813] shrink-0" />
                {!isSidebarCollapsed && <span>Account Management</span>}
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Profile & Logout */}
        <div className="p-4 border-t border-white/10 bg-[#12161C] space-y-3">
          {!isSidebarCollapsed && (
            <div className="text-left">
              <div className="text-[10px] font-mono text-emerald-400 uppercase">● Clearance Authority</div>
              <div className="text-xs font-semibold text-white truncate">{coordinatorEmail}</div>
            </div>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Exit to Login"
              className="w-full py-2 px-3 rounded-none bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="size-3.5 shrink-0" />
              {!isSidebarCollapsed && <span>Exit to Login</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Banner Header */}
        <header className="h-12 bg-[#0E1733] px-6 flex items-center justify-between text-xs text-white z-30 shadow-md border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Portal:</span>
            <span className="font-bold text-blue-400 uppercase tracking-wide">
              CampusSync Admin Portal | Tenant: Asia Pacific College
            </span>
          </div>
          <button
            onClick={() => {
              fetchQueue();
              fetchFacilitatorAccounts();
              fetchAnnouncements();
            }}
            className="px-3 py-1 rounded-none bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 flex items-center gap-1.5 cursor-pointer transition"
          >
            <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
            Sync Queue
          </button>
        </header>

        {dbError && (
          <div className="px-6 py-2 bg-red-950/60 border-b border-red-500/40 text-xs text-red-300 flex items-center justify-between gap-2 shrink-0">
            <span className="flex items-center gap-2">
              <AlertCircle className="size-3.5 shrink-0 text-red-400" />
              {dbError}
            </span>
            <button
              type="button"
              onClick={() => fetchQueue()}
              className="underline text-red-200 hover:text-white cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── TAB 1: HOME ── */}
        {activeNav === "home" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="bg-emerald-600/20 border border-emerald-500/40 px-4 py-2.5 text-xs text-emerald-300 flex items-center justify-between">
              <span>
                Welcome, <b>Admin Coordinator</b>. CampusSync governance services are active for AY 2026–2027.
              </span>
              <span className="font-mono text-[10px] uppercase">RA 8792 & RA 10173 Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-[#16203D] border border-white/10 rounded-none">
                <p className="text-[11px] font-mono text-[#8D99AE] uppercase">Pending Review</p>
                <p className="text-3xl font-black text-white mt-1">{pendingReviewEvents.length}</p>
                <p className="text-[11px] text-blue-400 mt-1">Awaiting clearance action</p>
              </div>
              <div className="p-5 bg-[#16203D] border border-red-500/30 rounded-none">
                <p className="text-[11px] font-mono text-[#8D99AE] uppercase">P1 High Urgency</p>
                <p className="text-3xl font-black text-red-400 mt-1">{p1UrgentCount}</p>
                <p className="text-[11px] text-red-300/80 mt-1">Within 96 hours lead time</p>
              </div>
              <div className="p-5 bg-[#16203D] border border-emerald-500/30 rounded-none">
                <p className="text-[11px] font-mono text-[#8D99AE] uppercase">Approved Events</p>
                <p className="text-3xl font-black text-emerald-400 mt-1">{approvedEvents.length}</p>
                <p className="text-[11px] text-emerald-300/80 mt-1">SHA-256 sealed & live</p>
              </div>
              <div className="p-5 bg-[#16203D] border border-white/10 rounded-none">
                <p className="text-[11px] font-mono text-[#8D99AE] uppercase">Active Facilitators</p>
                <p className="text-3xl font-black text-[#FDB813] mt-1">{facilitatorAccounts.length}</p>
                <p className="text-[11px] text-slate-300 mt-1">Synced from Facilitator Portal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-[#16203D] border border-white/10 p-6 h-fit rounded-none">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#FDB813] mb-4 flex items-center gap-2">
                  <Megaphone className="size-4" /> Broadcast Facilitator Announcement (UC-05)
                </h2>
                <form onSubmit={handlePublishAnnouncement} className="space-y-3 text-left">
                  <div>
                    <label className="text-xs text-[#8D99AE] block mb-1">Announcement Title *</label>
                    <input
                      required
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="e.g., Term 2 Proposal Submission Cutoff"
                      className="w-full p-2.5 bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none rounded-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8D99AE] block mb-1">Bulletin Message *</label>
                    <textarea
                      rows={4}
                      required
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="Enter clearance guidelines, cutoffs, or system notices..."
                      className="w-full p-2.5 bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none resize-none rounded-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#FDB813] hover:bg-[#e0a20f] text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition rounded-none"
                  >
                    <Send className="size-3.5" /> Publish Announcement
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 bg-[#16203D] border border-white/10 p-6 text-left rounded-none">
                <h2 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
                  Active Institutional Announcements
                </h2>
                <div className="space-y-3">
                  {announcements.map((item) => (
                    <div key={item.id} className="p-4 bg-[#0B132B] border border-white/10 space-y-1.5 rounded-none">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">{item.title}</h3>
                        <span className="text-[10px] font-mono text-[#FDB813]">{item.created_at}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{item.content}</p>
                      <div className="text-[10px] text-emerald-400 pt-1">✓ Target: {item.audience}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: PENDING APPROVALS (EVENT QUEUEING & REVIEW) ── */}
        {activeNav === "approvals" && (
          <div className="flex-1 flex h-full w-full overflow-hidden bg-[#0B132B] text-white">
            {/* LEFT COLUMN: Event Queue List */}
            <div className="w-[390px] border-r border-white/10 flex flex-col h-full bg-[#0D1836] shrink-0">
              <div className="p-4 border-b border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                      Pending Approvals
                    </h1>
                    <p className="text-xs text-[#8D99AE] mt-0.5">
                      {triagedEvents.length} proposal{triagedEvents.length === 1 ? "" : "s"} sorted by priority
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-[#090F24] p-1 border border-white/10 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setReviewFilter("PENDING")}
                      className={`px-2 py-1 font-semibold cursor-pointer ${
                        reviewFilter === "PENDING" ? "bg-[#FDB813] text-black" : "text-slate-400"
                      }`}
                    >
                      Pending ({pendingReviewEvents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewFilter("ALL")}
                      className={`px-2 py-1 font-semibold cursor-pointer ${
                        reviewFilter === "ALL" ? "bg-[#FDB813] text-black" : "text-slate-400"
                      }`}
                    >
                      All ({events.length})
                    </button>
                  </div>
                </div>

                {/* Dynamic AI Priority Triage Action */}
                <button
                  type="button"
                  onClick={handleRunBatchTriage}
                  disabled={triageLoading || baseEventsList.length === 0}
                  className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-45"
                >
                  {triageLoading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-[#FDB813]" />
                      Running AI Priority Queue Triage...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5 text-[#FDB813]" />
                      Run AI Priority Queue Triage
                    </>
                  )}
                </button>

                {triageError && (
                  <div className="p-2 bg-red-950/30 border border-red-500/40 text-[11px] text-red-300 flex items-start gap-1.5">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5 text-red-400" />
                    <span>{triageError}</span>
                  </div>
                )}

                {/* Urgency Filter Tabs */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-[#090F24] rounded-none border border-white/5 text-[11px]">
                  {(["ALL", "P1", "P2", "P3"] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setTriageTier(tier)}
                      className={`py-1 rounded-none font-semibold transition text-center cursor-pointer ${
                        triageTier === tier
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-[#8D99AE] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading && events.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-[#8D99AE]">
                    <RefreshCw className="size-6 animate-spin mb-2 text-[#4A90D9]" />
                    <p className="text-xs">Connecting to Supabase...</p>
                  </div>
                )}

                {!loading && triagedEvents.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-center text-[#8D99AE] p-4">
                    <Inbox className="size-10 mb-3 opacity-40 text-white" />
                    <p className="text-sm font-semibold text-white">Queue is empty</p>
                    <p className="text-xs mt-1">No proposals match the current filter.</p>
                  </div>
                )}

                {triagedEvents.map((item) => {
                  const isSelected = selectedEvent?.event_id === item.event_id;
                  const leadTime = getLeadTimeBadge(item.event_date);
                  const urgency = item.calculatedUrgency;
                  const aiTriage = item.aiTriage;
                  const isRationaleOpen = Boolean(expandedTriageIds[item.event_id]);

                  return (
                    <div
                      key={item.event_id}
                      onClick={() => setSelectedEventId(item.event_id)}
                      className={`p-4 rounded-none border transition-all cursor-pointer text-left ${
                        isSelected
                          ? "bg-[#1C2541] border-[#FDB813] shadow-md"
                          : "bg-[#16203D] border-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm truncate text-white">{item.title}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            title={
                              aiTriage
                                ? `AI Triage (${aiTriage.priorityTier}, Complexity ${aiTriage.complexityScore}/10): ${aiTriage.rationale}`
                                : "Lead-time estimate (run AI Triage for full risk evaluation)"
                            }
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-none border ${urgency.style}`}
                          >
                            {aiTriage ? `${aiTriage.priorityTier} · C${aiTriage.complexityScore}` : urgency.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-none capitalize ${
                              item.status === "pending"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : item.status === "approved"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : item.status === "revision" || item.status === "needs_revision"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {item.status ? item.status.replace("_", " ") : "pending"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#8D99AE] mb-2">
                        <span className="truncate">{item.organization || "Student Org"}</span>
                        <span className="text-[10px] font-semibold text-white/80 shrink-0">
                          {leadTime.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-white/60 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3 text-[#FDB813]" /> {item.event_date || "No date set"}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="size-3 text-[#FDB813]" /> {item.venue || "No venue"}
                        </span>
                      </div>

                      {aiTriage && (
                        <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTriageIds((prev) => ({
                                ...prev,
                                [item.event_id]: !prev[item.event_id],
                              }));
                            }}
                            className="w-full flex items-center justify-between text-[10px] font-semibold text-[#FDB813] hover:text-amber-300 cursor-pointer"
                          >
                            <span className="flex items-center gap-1">
                              <Sparkles className="size-3" /> AI Triage Rationale (Complexity {aiTriage.complexityScore}/10)
                            </span>
                            {isRationaleOpen ? (
                              <ChevronUp className="size-3" />
                            ) : (
                              <ChevronDown className="size-3" />
                            )}
                          </button>

                          {isRationaleOpen && (
                            <div className="p-2 bg-[#090F24] border border-white/10 text-[11px] space-y-1.5">
                              <p className="text-slate-200 leading-relaxed">{aiTriage.rationale}</p>
                              {aiTriage.riskFlags.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {aiTriage.riskFlags.map((flag, i) => (
                                    <span
                                      key={i}
                                      className="px-1.5 py-0.5 bg-red-500/15 border border-red-500/30 text-red-300 text-[9px]"
                                    >
                                      ⚑ {flag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {!aiTriage && (item.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(item.tags || []).slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-none bg-white/5 text-[10px] text-white/70 border border-white/5"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Detail & Decision Pane */}
            {selectedEvent ? (
              <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0B132B] text-left">
                <div className="p-7 border-b border-white/10 bg-[#0E1733] flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5 mb-1">
                      <h2 className="text-2xl font-bold tracking-tight text-white">
                        {selectedEvent.title}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-none text-xs font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {selectedEvent.status ? selectedEvent.status.replace("_", " ") : "pending"}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[11px] font-bold border ${
                          getTierBadgeMeta(
                            selectedTriage?.priorityTier ||
                              selectedEvent.urgency_tier ||
                              computeDynamicUrgency(selectedEvent.event_date).tier
                          ).style
                        }`}
                      >
                        {selectedTriage
                          ? `${selectedTriage.priorityTier} · Complexity ${selectedTriage.complexityScore}/10`
                          : computeDynamicUrgency(selectedEvent.event_date).label}
                      </span>
                    </div>
                    <p className="text-sm text-[#8D99AE]">{selectedEvent.organization || "Student Org"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRunSingleTriage(selectedEvent)}
                    disabled={triageLoading}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-[#FDB813] flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    {triageLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                    AI Triage
                  </button>
                </div>

                <div className="p-7 space-y-6 flex-1">
                  {/* AI Triage Rationale & Risk Flags Banner */}
                  {selectedTriage && (
                    <div className="p-4 bg-[#16203D] border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#FDB813] uppercase tracking-wider flex items-center gap-1.5">
                          <Brain className="size-3.5" /> Dynamic AI Priority Triage ({selectedTriage.priorityTier})
                        </span>
                        <span className="font-mono text-[11px] text-slate-300">
                          Complexity Score: <b className="text-white">{selectedTriage.complexityScore}/10</b>
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{selectedTriage.rationale}</p>
                      {selectedTriage.riskFlags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {selectedTriage.riskFlags.map((flag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-medium"
                            >
                              ⚑ {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-[#8D99AE] uppercase tracking-wider mb-3">
                      Event Logistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-[#16203D] rounded-none border border-white/5">
                        <p className="text-xs text-[#8D99AE] mb-1 flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-[#FDB813]" /> Date
                        </p>
                        <p className="text-sm font-semibold">{selectedEvent.event_date || "No date set"}</p>
                      </div>
                      <div className="p-4 bg-[#16203D] rounded-none border border-white/5">
                        <p className="text-xs text-[#8D99AE] mb-1 flex items-center gap-1.5">
                          <Clock className="size-3.5 text-[#FDB813]" /> Schedule
                        </p>
                        <p className="text-sm font-semibold">
                          {selectedEvent.start_time || "--"} – {selectedEvent.end_time || "--"}
                        </p>
                      </div>
                      <div className="p-4 bg-[#16203D] rounded-none border border-white/5">
                        <p className="text-xs text-[#8D99AE] mb-1 flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-[#FDB813]" /> Venue
                        </p>
                        <p className="text-sm font-semibold truncate">{selectedEvent.venue || "No venue"}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Multimodal Pre-Check Compliance Inspector (Gemini 2.5 Flash) */}
                  <div className="bg-[#16203D] border border-blue-500/30 rounded-none p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="size-4 text-[#FDB813]" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                          Multimodal AI Document & Signature Pre-Screening
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedEvent.document_path && (
                          <button
                            type="button"
                            disabled={preScreenLoading}
                            onClick={() => handleInspectProposalDocument(selectedEvent)}
                            className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-[11px] font-semibold text-blue-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-45"
                          >
                            {preScreenLoading ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Sparkles className="size-3 text-[#FDB813]" />
                            )}
                            Re-Inspect Stored PDF
                          </button>
                        )}
                        <label className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-semibold text-white flex items-center gap-1.5 cursor-pointer">
                          <Upload className="size-3 text-[#FDB813]" />
                          {preScreenLoading ? "Inspecting..." : "Inspect PDF/Image"}
                          <input
                            type="file"
                            accept=".pdf,image/png,image/jpeg"
                            className="hidden"
                            disabled={preScreenLoading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                void handleInspectProposalDocument(selectedEvent, file);
                              }
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {preScreenError && (
                      <div className="p-3 bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
                        <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-400" />
                        <span>{preScreenError}</span>
                      </div>
                    )}

                    {selectedPreScreen ? (
                      <div className="space-y-3.5 text-xs">
                        {/* Status + Completeness Score */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#0D1836] border border-white/10">
                          <div className="flex items-center gap-2">
                            {selectedPreScreen.overallStatus === "PASSED" ? (
                              <CheckCircle2 className="size-4 text-emerald-400" />
                            ) : selectedPreScreen.overallStatus === "NEEDS_REVISION" ? (
                              <AlertTriangle className="size-4 text-amber-400" />
                            ) : (
                              <XCircle className="size-4 text-red-400" />
                            )}
                            <span className="font-bold text-white">
                              Status: {selectedPreScreen.overallStatus.replace("_", " ")}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#FDB813]">
                            Completeness: {selectedPreScreen.completenessScore}/100
                          </span>
                        </div>

                        {/* Signature Verification */}
                        <div className="p-3.5 bg-[#0D1836] border border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                              <PenTool className="size-3.5 text-[#FDB813]" /> Visual Signature Verification
                            </span>
                            <span
                              className={`text-[11px] font-bold ${
                                selectedPreScreen.signatureCheck.signaturesDetected
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {selectedPreScreen.signatureCheck.signaturesDetected
                                ? "✓ Signatures Visually Detected"
                                : "✗ No Signatures Detected"}
                            </span>
                          </div>

                          {selectedPreScreen.signatureCheck.detectedSignatories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {selectedPreScreen.signatureCheck.detectedSignatories.map((sig, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px]"
                                >
                                  ✓ {sig}
                                </span>
                              ))}
                            </div>
                          )}

                          {selectedPreScreen.signatureCheck.missingSignatureLines.length > 0 && (
                            <div className="p-2.5 bg-red-500/15 border border-red-500/40 text-red-200 space-y-1">
                              <div className="text-[10px] font-bold uppercase text-red-300">
                                Missing / Blank Signature Lines
                              </div>
                              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                                {selectedPreScreen.signatureCheck.missingSignatureLines.map((line, i) => (
                                  <li key={i}>{line}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {selectedPreScreen.signatureCheck.visualNotes && (
                            <p className="text-[11px] text-slate-300">
                              <span className="text-slate-400 font-semibold">Visual notes: </span>
                              {selectedPreScreen.signatureCheck.visualNotes}
                            </p>
                          )}
                        </div>

                        {/* Checklist Evaluation */}
                        {selectedPreScreen.checklistEvaluation.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {selectedPreScreen.checklistEvaluation.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-[#0D1836] border border-white/5 flex flex-col gap-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-semibold text-white">
                                    {item.requirement}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold shrink-0 ${
                                      item.met ? "text-emerald-400" : "text-amber-400"
                                    }`}
                                  >
                                    {item.met ? "✓ Met" : "✗ Gap"}
                                  </span>
                                </div>
                                <span className="text-[10px] text-[#8D99AE] leading-relaxed">
                                  {item.evidence}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Flagged Inconsistencies */}
                        {selectedPreScreen.inconsistencies.length > 0 && (
                          <div className="p-3 bg-amber-500/15 border border-amber-500/40 text-amber-200 space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                              <AlertTriangle className="size-3.5" /> Flagged Form vs. Document Inconsistencies
                            </div>
                            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                              {selectedPreScreen.inconsistencies.map((inc, idx) => (
                                <li key={idx}>{inc}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Reviewer Summary */}
                        <div className="p-3.5 bg-[#090F24] border border-white/5 space-y-1">
                          <div className="text-[10px] font-bold text-[#FDB813] uppercase tracking-wider">
                            AI Reviewer Summary
                          </div>
                          <p className="text-white/85 leading-relaxed text-[11px]">
                            {selectedPreScreen.reviewerSummary}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-[#090F24] border border-white/5 text-xs text-[#8D99AE] space-y-1">
                        <p className="text-white font-semibold">No AI pre-screening result recorded yet.</p>
                        <p>
                          Upload the submitted APF/waiver PDF or scanned image above (or run it from the Facilitator Portal) to verify signatures, institutional requirements, and metadata consistency with Gemini 2.5 Flash.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[#8D99AE] uppercase tracking-wider mb-2">
                      Proposal Description
                    </h3>
                    <div className="p-4 bg-[#16203D] rounded-none border border-white/5 text-sm leading-relaxed text-white/90">
                      {selectedEvent.description || "No description provided."}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[#8D99AE] uppercase tracking-wider mb-3">
                      Promotional Assets
                    </h3>
                    <div className="p-4 bg-[#16203D] rounded-none border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-[#8D99AE] mb-0.5">Registration Link</p>
                        <p className="text-sm font-medium text-white truncate max-w-md">
                          {selectedEvent.external_registration_link ||
                            selectedEvent.registration_link ||
                            "No external link provided"}
                        </p>
                      </div>
                      {(selectedEvent.external_registration_link || selectedEvent.registration_link) && (
                        <a
                          href={selectedEvent.external_registration_link || selectedEvent.registration_link}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-none text-white text-xs flex items-center gap-1.5 transition-colors"
                        >
                          Open <ExternalLink className="size-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cryptographic Non-Repudiation Ledger (UC-03 / RA 8792) */}
                {selectedEvent.status === "approved" && (
                  <div className="mx-6 mb-3 p-4 rounded-none bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5" /> Tamper-Evident Institutional Clearance Ledger
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-none bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        RA 8792 Compliant
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-white/80 break-all bg-black/40 p-2.5 rounded-none border border-white/5">
                      SHA-256: {selectedEvent.clearance_hash || "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#8D99AE] pt-0.5">
                      <span>Cleared by: Institutional Coordinator Authority</span>
                      <span className="text-emerald-400 font-medium">✓ Syndicated to Events Mobile App</span>
                    </div>
                  </div>
                )}

                {/* Fixed Decision Footer Actions */}
                <div className="p-5 border-t border-white/10 bg-[#0E1733] flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-none border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setShowRevisionModal(true)}
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-none border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Needs Revision
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("approved")}
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-none bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <CheckCircle2 className="size-4" />
                    ✓ Endorse & Sign (SHA-256)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-[#8D99AE] text-sm">
                Select an event from the left queue to view details.
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: SURVEYS & POST-EVENT EVALUATIONS (UC-04 & UC-06) ── */}
        {activeNav === "surveys" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 text-left">
            <div className="border-b border-white/10 pb-4">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="size-4 text-[#FDB813]" /> Post-Event Evaluation Surveys & AI Diagnostics
              </h1>
              <p className="text-xs text-[#8D99AE] mt-0.5">
                Generate tailored student questionnaires with Gemini 2.5 Flash and synthesize executive sentiment diagnostics from post-event feedback.
              </p>
            </div>

            {/* ── SECTION A: AI-ASSISTED POST-EVENT SURVEY GENERATOR ── */}
            <div className="bg-[#16203D] border border-blue-500/30 p-6 space-y-5 rounded-none">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#FDB813] flex items-center gap-2">
                    <Sparkles className="size-4" /> AI-Assisted Post-Event Survey Generator
                  </h2>
                  <p className="text-[11px] text-[#8D99AE] mt-0.5">
                    Select an event, refine objectives, and generate an editable student evaluation questionnaire.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Gemini 2.5 Flash
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#8D99AE] block mb-1">Target Event</label>
                  <select
                    value={surveyTargetEventId || (approvedEvents[0]?.event_id ?? events[0]?.event_id ?? "")}
                    onChange={(e) => {
                      const nextId = Number(e.target.value);
                      setSurveyTargetEventId(nextId);
                      const found = events.find((ev) => ev.event_id === nextId);
                      if (found?.description && !surveyObjectives.trim()) {
                        setSurveyObjectives(found.description);
                      }
                      const existingDraft =
                        found?.ai_survey_draft || savedSurveyDrafts[String(nextId)];
                      if (existingDraft) {
                        setActiveSurveyDraft(existingDraft);
                      }
                    }}
                    className="w-full p-2.5 bg-[#0B132B] border border-white/15 text-xs text-white focus:border-[#FDB813] outline-none rounded-none"
                  >
                    {events.length === 0 ? (
                      <option value="">Default Sample Event</option>
                    ) : (
                      events.map((ev) => (
                        <option key={ev.event_id} value={ev.event_id}>
                          {ev.title} ({ev.status})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#8D99AE] block mb-1">Event Category</label>
                  <select
                    value={surveyCategory}
                    onChange={(e) => setSurveyCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#0B132B] border border-white/15 text-xs text-white focus:border-[#FDB813] outline-none rounded-none"
                  >
                    <option value="Academic Seminar / Workshop">Academic Seminar / Workshop</option>
                    <option value="Hackathon / Technical Competition">Hackathon / Technical Competition</option>
                    <option value="Student Orientation / Assembly">Student Orientation / Assembly</option>
                    <option value="Cultural / Org Fair">Cultural / Org Fair</option>
                    <option value="Community Outreach / Off-Campus">Community Outreach / Off-Campus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#8D99AE] block mb-1">
                  Event Objectives & Focus Areas (Optional — defaults to proposal description)
                </label>
                <textarea
                  rows={2}
                  value={surveyObjectives}
                  onChange={(e) => setSurveyObjectives(e.target.value)}
                  placeholder="e.g., Measure technical skill acquisition, venue & Wi-Fi reliability, mentor effectiveness, and suggestions for next term..."
                  className="w-full p-2.5 bg-[#0B132B] border border-white/15 text-xs text-white focus:border-[#FDB813] outline-none resize-none rounded-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateSurveyWithAi}
                  disabled={generatingSurvey}
                  className="px-5 py-2.5 bg-[#FDB813] hover:bg-[#e0a20f] text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  {generatingSurvey ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      Generate Survey with AI
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={addDraftQuestion}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="size-3.5 text-[#FDB813]" /> Add Custom Question
                </button>
              </div>

              {surveyGenError && (
                <div className="p-3 bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{surveyGenError}</span>
                </div>
              )}

              {/* Editable AI-Generated Questionnaire */}
              {activeSurveyDraft && (
                <div className="p-5 bg-[#0B132B] border border-white/10 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[#8D99AE] block mb-1">
                        Survey Title (Editable)
                      </label>
                      <input
                        value={activeSurveyDraft.surveyTitle}
                        onChange={(e) =>
                          setActiveSurveyDraft({ ...activeSurveyDraft, surveyTitle: e.target.value })
                        }
                        className="w-full p-2 bg-[#16203D] border border-white/15 text-xs font-semibold text-white focus:border-[#FDB813] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[#8D99AE] block mb-1">
                        Respondent Instructions (Editable)
                      </label>
                      <input
                        value={activeSurveyDraft.description}
                        onChange={(e) =>
                          setActiveSurveyDraft({ ...activeSurveyDraft, description: e.target.value })
                        }
                        className="w-full p-2 bg-[#16203D] border border-white/15 text-xs text-slate-200 focus:border-[#FDB813] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="text-[10px] font-mono uppercase text-[#FDB813]">
                      Editable Questions ({activeSurveyDraft.questions.length})
                    </div>
                    {activeSurveyDraft.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-3.5 bg-[#16203D] border border-white/10 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono text-[#FDB813] font-bold">
                            Q{idx + 1}
                          </span>
                          <input
                            value={q.text}
                            onChange={(e) => updateDraftQuestion(q.id, { text: e.target.value })}
                            className="flex-1 min-w-[220px] p-1.5 bg-[#0B132B] border border-white/15 text-xs text-white focus:border-[#FDB813] outline-none"
                          />
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const nextType = e.target.value as GeneratedQuestionType;
                              updateDraftQuestion(q.id, {
                                type: nextType,
                                options:
                                  nextType === "multiple_choice" && q.options.length === 0
                                    ? ["Very Satisfied", "Satisfied", "Neutral", "Needs Improvement"]
                                    : nextType === "multiple_choice"
                                    ? q.options
                                    : [],
                              });
                            }}
                            className="p-1.5 bg-[#0B132B] border border-white/15 text-[11px] text-white outline-none"
                          >
                            <option value="rating_1_to_5">1–5 Rating</option>
                            <option value="multiple_choice">Multiple Choice</option>
                            <option value="open_text">Open Text</option>
                          </select>
                          <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) =>
                                updateDraftQuestion(q.id, { required: e.target.checked })
                              }
                              className="accent-[#FDB813]"
                            />
                            Required
                          </label>
                          <button
                            type="button"
                            onClick={() => removeDraftQuestion(q.id)}
                            title="Remove question"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        {q.type === "multiple_choice" && (
                          <div className="pl-6 space-y-1">
                            <label className="text-[10px] text-[#8D99AE] block">
                              Options (comma-separated)
                            </label>
                            <input
                              value={q.options.join(", ")}
                              onChange={(e) =>
                                updateDraftQuestion(q.id, {
                                  options: e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              className="w-full p-1.5 bg-[#0B132B] border border-white/10 text-[11px] text-slate-200 focus:border-[#FDB813] outline-none"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-xs text-emerald-400">{surveySaveMessage}</span>
                    <button
                      type="button"
                      onClick={handleSaveSurveyDraft}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="size-3.5" /> Save Survey Questionnaire
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION B: POST-EVENT FEEDBACK SENTIMENT & DIAGNOSTICS SYNTHESIS ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Brain className="size-4 text-[#FDB813]" /> Event Surveys & AI Feedback Diagnostics
                </h2>
                <span className="text-[11px] text-[#8D99AE]">
                  {approvedEvents.length} approved event{approvedEvents.length === 1 ? "" : "s"}
                </span>
              </div>

              {feedbackError && (
                <div className="p-3 bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{feedbackError}</span>
                </div>
              )}

              {(approvedEvents.length > 0 ? approvedEvents : events).length === 0 ? (
                <div className="p-10 bg-[#16203D] border border-white/10 text-center text-xs text-[#8D99AE]">
                  No events available yet for post-event feedback analysis.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5">
                  {(approvedEvents.length > 0 ? approvedEvents : events).map((ev) => {
                    const responses = getResponsesForEvent(ev);
                    const rated = responses.filter((r) => typeof r.rating === "number");
                    const avgRating =
                      rated.length > 0
                        ? (rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length).toFixed(1)
                        : "–";
                    const analysis =
                      ev.ai_feedback_analysis || feedbackAnalysisMap[String(ev.event_id)];
                    const savedDraft = ev.ai_survey_draft || savedSurveyDrafts[String(ev.event_id)];
                    const isExpanded = expandedFeedbackEventId === ev.event_id;
                    const isAnalyzing = analyzingEventId === ev.event_id;

                    return (
                      <div
                        key={ev.event_id}
                        className="p-5 bg-[#16203D] border border-white/10 space-y-4 rounded-none"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white">{ev.title}</h3>
                              {savedDraft && (
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-semibold">
                                  {savedDraft.questions.length} AI Questions Saved
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#8D99AE]">
                              {ev.organization || "Student Org"} • {ev.event_date || "No date"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedFeedbackEventId(isExpanded ? null : ev.event_id)
                              }
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-slate-200 cursor-pointer"
                            >
                              {isExpanded ? "Hide Responses" : `View / Add Responses (${responses.length})`}
                            </button>
                            <button
                              type="button"
                              disabled={isAnalyzing}
                              onClick={() => handleAnalyzeFeedbackWithAi(ev)}
                              className="px-3.5 py-1.5 bg-[#FDB813] hover:bg-[#e0a20f] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isAnalyzing ? (
                                <>
                                  <Loader2 className="size-3.5 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="size-3.5" />
                                  Analyze Feedback with AI
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                          <div className="p-2.5 bg-[#0B132B]">
                            <div className="text-[10px] text-[#8D99AE]">Collected Responses</div>
                            <div className="text-sm font-bold text-white">{responses.length}</div>
                          </div>
                          <div className="p-2.5 bg-[#0B132B]">
                            <div className="text-[10px] text-[#8D99AE]">Avg Rating</div>
                            <div className="text-sm font-bold text-[#FDB813]">{avgRating} / 5.0</div>
                          </div>
                          <div className="p-2.5 bg-[#0B132B]">
                            <div className="text-[10px] text-[#8D99AE]">AI Sentiment</div>
                            <div
                              className={`text-sm font-bold ${
                                analysis
                                  ? analysis.overallSentiment === "Positive"
                                    ? "text-emerald-400"
                                    : analysis.overallSentiment === "Mixed"
                                    ? "text-amber-400"
                                    : "text-red-400"
                                  : "text-slate-400"
                              }`}
                            >
                              {analysis
                                ? `${analysis.overallSentiment} (${analysis.sentimentScore}/100)`
                                : "Not Analyzed"}
                            </div>
                          </div>
                        </div>

                        {/* Collapsible Raw Survey Responses Input/Viewer */}
                        {isExpanded && (
                          <div className="p-4 bg-[#0B132B] border border-white/10 space-y-3">
                            <div className="text-[10px] font-mono uppercase text-[#FDB813]">
                              Attendee Responses Analyzed by AI
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <select
                                value={newFeedbackRating}
                                onChange={(e) => setNewFeedbackRating(Number(e.target.value))}
                                className="p-2 bg-[#16203D] border border-white/15 text-xs text-white outline-none"
                              >
                                {[5, 4, 3, 2, 1].map((r) => (
                                  <option key={r} value={r}>
                                    {r} ★
                                  </option>
                                ))}
                              </select>
                              <input
                                value={newFeedbackComment}
                                onChange={(e) => setNewFeedbackComment(e.target.value)}
                                placeholder="Add a real student feedback response to include in AI analysis..."
                                className="flex-1 min-w-[200px] p-2 bg-[#16203D] border border-white/15 text-xs text-white focus:border-[#FDB813] outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddFeedbackResponse(ev)}
                                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
                              >
                                Add
                              </button>
                            </div>
                            <div className="space-y-1.5 max-h-44 overflow-y-auto">
                              {responses.map((r, i) => (
                                <div
                                  key={i}
                                  className="p-2 bg-[#16203D] border border-white/5 text-[11px] flex items-start justify-between gap-3"
                                >
                                  <span className="text-slate-200">{r.comment}</span>
                                  <span className="text-[#FDB813] font-mono shrink-0">
                                    {r.rating ?? "–"}/5
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Structured AI Sentiment & Executive Diagnostics Panel */}
                        {analysis && (
                          <div className="p-4 bg-[#090F24] border border-blue-500/30 space-y-3.5 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                <Sparkles className="size-3.5 text-[#FDB813]" /> AI Executive Sentiment Diagnostics
                              </span>
                              <span
                                className={`px-2 py-0.5 text-[11px] font-bold border ${
                                  analysis.overallSentiment === "Positive"
                                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    : analysis.overallSentiment === "Mixed"
                                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                    : "bg-red-500/15 text-red-300 border-red-500/30"
                                }`}
                              >
                                {analysis.overallSentiment} · Score {analysis.sentimentScore}/100
                              </span>
                            </div>

                            <div className="p-3 bg-[#16203D] border border-white/5">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-[#FDB813] mb-1">
                                Executive Summary
                              </div>
                              <p className="text-slate-200 leading-relaxed">
                                {analysis.executiveSummary}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="p-3 bg-[#16203D] border border-emerald-500/25 space-y-1.5">
                                <div className="text-[10px] font-bold uppercase text-emerald-400">
                                  Key Strengths
                                </div>
                                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-200">
                                  {analysis.keyStrengths.map((s, idx) => (
                                    <li key={idx}>{s}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="p-3 bg-[#16203D] border border-amber-500/25 space-y-1.5">
                                <div className="text-[10px] font-bold uppercase text-amber-400">
                                  Areas for Improvement
                                </div>
                                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-200">
                                  {analysis.areasForImprovement.map((s, idx) => (
                                    <li key={idx}>{s}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="p-3 bg-[#16203D] border border-blue-500/25 space-y-1.5">
                                <div className="text-[10px] font-bold uppercase text-blue-300">
                                  Actionable Recommendations
                                </div>
                                <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-200">
                                  {analysis.actionableRecommendations.map((s, idx) => (
                                    <li key={idx}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: ACCOUNT MANAGEMENT (CONNECTED TO FACILITATOR PORTAL USERS) ── */}
        {activeNav === "accounts" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 text-left">
              <div>
                <h1 className="text-lg font-bold text-white">Account Management — Facilitator Registry</h1>
                <p className="text-xs text-[#8D99AE] mt-0.5">
                  Displays permanent student facilitator accounts registered through the Facilitator Portal.
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Search facilitator or org..."
                  className="w-full pl-8 pr-3 py-2 bg-[#16203D] border border-white/15 text-xs text-white focus:border-[#FDB813] outline-none rounded-none"
                />
              </div>
            </div>

            {filteredFacilitators.length === 0 ? (
              <div className="p-12 bg-[#16203D] border border-white/10 text-center space-y-2 rounded-none">
                <Users className="size-10 mx-auto text-slate-500 opacity-60 mb-2" />
                <p className="text-sm font-bold text-white">No Registered Facilitator Accounts Yet</p>
                <p className="text-xs text-[#8D99AE] max-w-md mx-auto">
                  Facilitator accounts will appear here automatically once users register and sign in via the updated Facilitator Portal.
                </p>
              </div>
            ) : (
              <div className="bg-[#16203D] border border-white/10 overflow-x-auto rounded-none">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0E1733] border-b border-white/10 text-[10px] font-mono text-[#FDB813] uppercase">
                      <th className="p-3.5">Account ID</th>
                      <th className="p-3.5">Facilitator Name</th>
                      <th className="p-3.5">Institutional Email</th>
                      <th className="p-3.5">Organization</th>
                      <th className="p-3.5">Activity</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredFacilitators.map((acc) => (
                      <tr key={acc.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 font-mono text-slate-400">{acc.id}</td>
                        <td className="p-3.5 font-semibold text-white">{acc.full_name}</td>
                        <td className="p-3.5 text-slate-300">{acc.email}</td>
                        <td className="p-3.5 text-[#FDB813] font-medium">{acc.organization}</td>
                        <td className="p-3.5 text-slate-400">{acc.last_active}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            ● {acc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#16203D] border border-white/15 rounded-none p-6 shadow-2xl text-left">
            <h3 className="text-base font-bold text-white mb-2">Request Revisions</h3>
            <p className="text-xs text-[#8D99AE] mb-4">
              Enter the feedback or document corrections required by the SAO Office:
            </p>
            <textarea
              rows={4}
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              placeholder="e.g., Please update the schedule and attach the endorsed APF with adviser signature..."
              className="w-full p-3 rounded-none bg-[#0B132B] border border-white/10 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#FDB813] resize-none mb-4"
            />
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 rounded-none text-xs text-[#8D99AE] hover:text-white border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus("revision", revisionFeedback)}
                disabled={!revisionFeedback.trim() || actionLoading}
                className="px-5 py-2 rounded-none text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-40 cursor-pointer"
              >
                Send Revision Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
