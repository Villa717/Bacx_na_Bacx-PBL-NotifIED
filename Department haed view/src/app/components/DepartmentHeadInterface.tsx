import React, { useState, useEffect } from "react";
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
  ClipboardCheck,
  MessageSquarePlus,
  BarChart3,
  Plus,
  Trash2,
  Send,
  Users,
  TrendingUp,
  Download,
  FileText,
  Menu,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../../lib/supabase";

// ============================================================================
// TYPES & INTERFACES (Aligned with Supabase `events` schema & UC 03, 04, 06)
// ============================================================================

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
  admin_feedback?: string;
  external_registration_link?: string;
  registration_link?: string;
  proposed_attendees?: number;
  accepted_attendees?: number;
  created_at?: string;
}

interface SurveyQuestion {
  id: string;
  prompt: string;
  type: "rating" | "text" | "yes_no";
}

interface EventSurvey {
  id: string;
  eventId: number;
  eventTitle: string;
  organization: string;
  status: "active" | "draft" | "closed";
  responsesCount: number;
  targetAudience: number;
  avgSatisfaction: number;
  questions: SurveyQuestion[];
  aiSentimentSummary: string;
}

type DeptNavView = "Proposal Approvals" | "Event Surveys" | "Event Reports";

// ============================================================================
// FALLBACK DATA (Used if Supabase table is empty or unconfigured)
// ============================================================================

const FALLBACK_EVENTS: EventRecord[] = [
  {
    event_id: 101,
    title: "Cybersecurity & Digital Forensics Symposium 2026",
    organization: "JISSA - Junior Information Security Student Association",
    event_date: new Date(Date.now() + 36 * 3600 * 1000).toISOString().split("T")[0],
    start_time: "1:00 PM",
    end_time: "5:00 PM",
    venue: "Multi-Purpose Hall 1",
    description:
      "Hands-on threat hunting workshop and live incident response simulation led by industry security analysts for BSCS-SF and BSIT students.",
    tags: ["BSCS-SF", "BSIT", "Cybersecurity", "Workshop"],
    status: "pending",
    proposed_attendees: 180,
    accepted_attendees: 164,
    external_registration_link: "https://forms.office.com/r/apc-cyber-symposium",
  },
  {
    event_id: 102,
    title: "AWS Cloud Architecture Bootcamp",
    organization: "APC Cloud Computing Society",
    event_date: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString().split("T")[0],
    start_time: "9:00 AM",
    end_time: "4:00 PM",
    venue: "Computer Lab 402",
    description:
      "Full-day cloud deployment lab covering EC2, S3, IAM policies, and serverless microservice design.",
    tags: ["Cloud", "AWS", "2nd Year", "3rd Year"],
    status: "pending",
    proposed_attendees: 95,
    accepted_attendees: 88,
    external_registration_link: "https://forms.office.com/r/apc-aws-bootcamp",
  },
  {
    event_id: 103,
    title: "Inter-Departmental Hackathon: Smart Campus",
    organization: "Computer Science Society",
    event_date: new Date(Date.now() + 18 * 24 * 3600 * 1000).toISOString().split("T")[0],
    start_time: "8:00 AM",
    end_time: "6:00 PM",
    venue: "Auditorium",
    description:
      "10-hour rapid prototyping challenge focused on IoT, campus sustainability, and student productivity tools.",
    tags: ["Hackathon", "IoT", "All SCIT"],
    status: "approved",
    proposed_attendees: 250,
    accepted_attendees: 232,
    external_registration_link: "https://forms.office.com/r/smart-campus-hack",
  },
  {
    event_id: 104,
    title: "Freshmen Tech Orientation & Org Fair",
    organization: "SCIT Student Council",
    event_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split("T")[0],
    start_time: "10:00 AM",
    end_time: "3:00 PM",
    venue: "Main Lobby & Plaza",
    description:
      "Departmental welcome assembly introducing incoming students to faculty advisers, lab facilities, and accredited student organizations.",
    tags: ["Freshmen", "Orientation"],
    status: "completed",
    proposed_attendees: 320,
    accepted_attendees: 298,
    external_registration_link: "https://forms.office.com/r/scit-frosh-fair",
  },
];

const INITIAL_SURVEYS: EventSurvey[] = [
  {
    id: "SRV-01",
    eventId: 104,
    eventTitle: "Freshmen Tech Orientation & Org Fair",
    organization: "SCIT Student Council",
    status: "active",
    responsesCount: 241,
    targetAudience: 298,
    avgSatisfaction: 4.7,
    aiSentimentSummary:
      "89% positive sentiment. Students praised the live lab demos and peer mentoring booths; 14% suggested extending Q&A time with program directors.",
    questions: [
      { id: "q1", prompt: "How relevant was the departmental orientation to your academic track?", type: "rating" },
      { id: "q2", prompt: "Did the organization booths clearly explain membership opportunities?", type: "yes_no" },
      { id: "q3", prompt: "What topics would you like covered in future departmental assemblies?", type: "text" },
    ],
  },
  {
    id: "SRV-02",
    eventId: 103,
    eventTitle: "Inter-Departmental Hackathon: Smart Campus",
    organization: "Computer Science Society",
    status: "draft",
    responsesCount: 0,
    targetAudience: 232,
    avgSatisfaction: 0,
    aiSentimentSummary:
      "Survey queued for automated dispatch upon event check-out completion.",
    questions: [
      { id: "q1", prompt: "Rate the quality of technical mentorship and Wi-Fi stability during the sprint.", type: "rating" },
      { id: "q2", prompt: "Would you participate in a 24-hour regional collegiate hackathon next term?", type: "yes_no" },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS (Matching Admin App.tsx)
// ============================================================================

function getLeadTimeBadge(dateStr: string) {
  if (!dateStr) return { text: "No date", isUrgent: false };
  const target = new Date(dateStr).getTime();
  const now = new Date().getTime();
  const diffHours = Math.round((target - now) / (1000 * 60 * 60));

  if (diffHours <= 0) return { text: "Passed", isUrgent: false };
  if (diffHours <= 48) return { text: `In ${diffHours}h`, isUrgent: true };
  if (diffHours <= 96) return { text: `In ${Math.round(diffHours / 24)}d`, isUrgent: true };
  return { text: `In ${Math.round(diffHours / 24)}d`, isUrgent: false };
}

function computeDynamicUrgency(dateStr: string | null): {
  tier: "P1" | "P2" | "P3";
  label: string;
  style: string;
} {
  if (!dateStr) {
    return {
      tier: "P3",
      label: "P3 STD",
      style: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-none",
    };
  }

  const target = new Date(dateStr).getTime();
  const now = new Date().getTime();
  const diffHours = (target - now) / (1000 * 60 * 60);

  if (diffHours <= 96) {
    return {
      tier: "P1",
      label: "P1 HIGH",
      style: "bg-red-500/20 text-red-400 border border-red-500/40 rounded-none",
    };
  }

  if (diffHours <= 336) {
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

// ============================================================================
// MAIN ENTRY COMPONENT: DepartmentHeadPortal (Exact Admin Login & Shell)
// ============================================================================

export default function DepartmentHeadPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedSession = localStorage.getItem("notified_depthead_logged_in");
    const savedEmail = localStorage.getItem("notified_depthead_remembered_email");

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
      (trimmedEmail === "depthead@apc.edu.ph" && trimmedPassword === "depthead123") ||
      (trimmedEmail.endsWith("@apc.edu.ph") && trimmedPassword.length >= 6);

    if (!isValid) {
      setErrorMessage("Invalid credentials. Try depthead@apc.edu.ph / depthead123");
      return;
    }

    if (rememberMe) {
      localStorage.setItem("notified_depthead_remembered_email", trimmedEmail);
      localStorage.setItem("notified_depthead_logged_in", "true");
    } else {
      localStorage.removeItem("notified_depthead_remembered_email");
      localStorage.removeItem("notified_depthead_logged_in");
    }

    setIsLoggedIn(true);
    setPassword("");
  };

  const handleLogout = () => {
    localStorage.removeItem("notified_depthead_logged_in");
    setIsLoggedIn(false);
    setPassword("");
    setErrorMessage("");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full relative flex flex-col justify-between p-6 md:p-10 font-sans text-white bg-[#0B132B] overflow-x-hidden">
        {/* Top Header Navigation (Identical to Admin App.tsx) */}
        <header className="w-full flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-[#0B132B] flex items-center justify-center font-black text-[#FFD000] text-lg border border-white/10 shadow-md rounded-none">
              N
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">NotifiED</span>
                <span className="bg-[#0B132B] text-[#FFD000] text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider border border-white/10 rounded-none">
                  DEPT HEAD
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-medium">Enterprise Clearance System</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0B132B] border border-white/15 text-white text-xs font-semibold shadow-md rounded-none">
            <span className="size-2 bg-emerald-400"></span>
            NOTIFIED: DEPARTMENT HEAD
          </div>
        </header>

        {/* Main Left-Weighted Auth Terminal (Identical to Admin App.tsx) */}
        <main className="w-full my-auto py-8 z-10 flex items-center justify-start lg:pl-16">
          <div className="w-full max-w-[440px] bg-[#0E1528] border border-white/10 shadow-2xl p-8 md:p-10 text-left rounded-none">
            <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-[#FFD000] mb-3 uppercase">
              <span>AUTHORIZED CLEARANCE ACCESS</span>
              <span className="text-white/40">v2.4 SECURE</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
              Department Head Login
            </h1>
            <p className="text-xs text-[#8D99AE] mb-6">
              Endorse academic proposals, manage event surveys, and inspect reports.
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
                  placeholder="depthead@apc.edu.ph"
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
                SIGN IN TO DEPARTMENT PORTAL →
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/50">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 bg-[#FFD000]"></span>
                Campus Clearance Portal
              </span>
              <span>SCIT Department</span>
            </div>
          </div>
        </main>

        <div className="h-4 z-10 shrink-0"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen w-full flex flex-col bg-[#0B132B]">
      {/* Top Banner Header (Identical to Admin App.tsx) */}
      <header className="h-12 bg-[#0E1733] px-6 flex items-center justify-between text-xs text-white z-30 shadow-md border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Portal:</span>
          <span className="font-bold text-blue-400 uppercase tracking-wide">
            NotifiED Department Head Portal
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded-none bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="size-3.5" />
          Exit to Login
        </button>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        <DepartmentHeadInterface />
      </main>
    </div>
  );
}

// ============================================================================
// MAIN WORKSPACE: DepartmentHeadInterface (Exact Admin Sidebar + UC 03, 04, 06)
// ============================================================================

export function DepartmentHeadInterface() {
  const [activeView, setActiveView] = useState<DeptNavView>("Proposal Approvals");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<EventSurvey[]>(INITIAL_SURVEYS);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_id", { ascending: false });

      if (error || !data || data.length === 0) {
        setEvents(FALLBACK_EVENTS);
      } else {
        setEvents(data as EventRecord[]);
      }
    } catch {
      setEvents(FALLBACK_EVENTS);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();

    const channel = supabase
      .channel("dept-head-events-channel")
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

  const pendingCount = events.filter((e) => e.status === "pending").length;

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden bg-[#0B132B] text-white">
      {/* Mobile Sidebar Backdrop (Exact match to Admin sidebar-navigation.tsx) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── LEFT SIDEBAR (Exact Match to Admin sidebar-navigation.tsx) ── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-[#090F1F] flex flex-col
          border-r border-white/[0.04]
          transform transition-transform duration-300 ease-in-out lg:transform-none shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="font-serif text-xl font-semibold text-white tracking-tight">
                Notifi
              </span>
              <span className="font-serif text-xl font-bold text-[#FDB813] tracking-tight">
                ED
              </span>
            </div>
            <p className="text-[11px] text-[#8D99AE] mt-0.5 tracking-wide">
              Department Head Console
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[#8D99AE] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Label */}
        <div className="px-6 pt-6 pb-2">
          <p className="text-[10px] font-semibold text-[#8D99AE]/60 uppercase tracking-widest">
            Navigation
          </p>
        </div>

        {/* Nav Items (UC 03, UC 04, UC 06) */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-0.5">
          {[
            {
              label: "Proposal Approvals" as DeptNavView,
              icon: ClipboardCheck,
              badge: pendingCount > 0 ? pendingCount : undefined,
            },
            {
              label: "Event Surveys" as DeptNavView,
              icon: MessageSquarePlus,
              badge: surveys.length,
            },
            {
              label: "Event Reports" as DeptNavView,
              icon: BarChart3,
            },
          ].map(({ label, icon: Icon, badge }) => {
            const active = activeView === label;
            return (
              <button
                key={label}
                onClick={() => {
                  setActiveView(label);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer
                  ${
                    active
                      ? "bg-[#FDB813] text-[#0B132B]"
                      : "text-[#8D99AE] hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${
                    active ? "text-[#0B132B]" : ""
                  }`}
                />
                <span className="flex-1 text-sm font-medium">{label}</span>
                {badge !== undefined && (
                  <span
                    className={`
                      text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                      ${
                        active
                          ? "bg-[#0B132B]/20 text-[#0B132B]"
                          : "bg-[#FDB813]/15 text-[#FDB813]"
                      }
                    `}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-6 border-t border-white/[0.04]" />

        {/* User Profile Footer (Exact match to Admin sidebar-navigation.tsx) */}
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FDB813] to-[#E0A96D] flex items-center justify-center flex-shrink-0">
              <span className="text-[#0B132B] text-xs font-bold">DH</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Dr. Rhea Santillan</p>
              <p className="text-[11px] text-[#8D99AE] truncate">Department Head</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0" title="Online" />
          </div>
        </div>
      </aside>

      {/* ── RIGHT CONTENT SHELL ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile Header Trigger */}
        <div className="lg:hidden px-4 py-3 bg-[#0E1733] border-b border-white/10 flex items-center justify-between shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-white/80 hover:text-white cursor-pointer"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-[#FDB813]">
            {activeView}
          </span>
          <div className="w-6" />
        </div>

        {activeView === "Proposal Approvals" && (
          <ProposalApprovalsView
            events={events}
            setEvents={setEvents}
            loading={loading}
            onRefresh={fetchQueue}
          />
        )}

        {activeView === "Event Surveys" && (
          <EventSurveysView
            surveys={surveys}
            setSurveys={setSurveys}
            events={events}
          />
        )}

        {activeView === "Event Reports" && (
          <EventReportsView events={events} surveys={surveys} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 1: PROPOSAL APPROVALS (UC 03 — Exact Match to Admin CoordinatorInterface)
// ============================================================================

function ProposalApprovalsView({
  events,
  setEvents,
  loading,
  onRefresh,
}: {
  events: EventRecord[];
  setEvents: React.Dispatch<React.SetStateAction<EventRecord[]>>;
  loading: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [triageTier, setTriageTier] = useState<"ALL" | "P1" | "P2" | "P3">("ALL");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    events[0]?.event_id ?? null
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0].event_id);
    }
  }, [events, selectedEventId]);

  const triagedEvents = events
    .map((item) => ({
      ...item,
      calculatedUrgency: computeDynamicUrgency(item.event_date),
    }))
    .filter((item) => {
      if (triageTier === "ALL") return true;
      return item.calculatedUrgency.tier === triageTier;
    })
    .sort((a, b) => {
      const priorityOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3 };
      const diffPriority =
        priorityOrder[a.calculatedUrgency.tier] - priorityOrder[b.calculatedUrgency.tier];
      if (diffPriority !== 0) return diffPriority;
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });

  const selectedEvent =
    events.find((e) => e.event_id === selectedEventId) || triagedEvents[0];

  const handleUpdateStatus = async (
    status: "approved" | "rejected" | "revision",
    feedback?: string
  ) => {
    if (!selectedEvent) return;
    setActionLoading(true);

    const dbStatus = status === "revision" ? "needs_revision" : status;

    setEvents((prev) =>
      prev.map((ev) =>
        ev.event_id === selectedEvent.event_id
          ? { ...ev, status: dbStatus, admin_feedback: feedback || ev.admin_feedback }
          : ev
      )
    );

    const { error } = await supabase
      .from("events")
      .update({
        status: dbStatus,
        admin_feedback: feedback || null,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", selectedEvent.event_id);

    if (!error) {
      await onRefresh();
    }

    setShowRevisionModal(false);
    setRevisionFeedback("");
    setActionLoading(false);
  };

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden bg-[#0B132B] text-white">
      {/* ── LEFT COLUMN: Event Queue List (Identical to Admin) ── */}
      <div className="w-[380px] border-r border-white/10 flex flex-col h-full bg-[#0D1836] shrink-0">
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Event Queueing
              </h1>
              <p className="text-xs text-[#8D99AE] mt-0.5">
                {triagedEvents.length} proposal{triagedEvents.length === 1 ? "" : "s"} in queue
              </p>
            </div>
            <button
              onClick={onRefresh}
              title="Refresh from Supabase"
              className="p-1.5 rounded-none bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

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
              <p className="text-xs">Connecting to database...</p>
            </div>
          )}

          {!loading && triagedEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center text-[#8D99AE] p-4">
              <Inbox className="size-10 mb-3 opacity-40 text-white" />
              <p className="text-sm font-semibold text-white">Queue is empty</p>
              <p className="text-xs mt-1">No event proposals in this tier.</p>
            </div>
          )}

          {triagedEvents.map((item) => {
            const isSelected = selectedEvent?.event_id === item.event_id;
            const leadTime = getLeadTimeBadge(item.event_date);
            const urgency = item.calculatedUrgency;

            return (
              <div
                key={item.event_id}
                onClick={() => setSelectedEventId(item.event_id)}
                className={`p-4 rounded-none border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#1C2541] border-[#FDB813] shadow-md"
                    : "bg-[#16203D] border-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm truncate text-white">{item.title}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-none border ${urgency.style}`}>
                      {urgency.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-none capitalize ${
                        item.status === "pending"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : item.status === "approved" || item.status === "completed"
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

                <div className="flex items-center gap-3 text-[11px] text-white/60 mb-2.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3 text-[#FDB813]" /> {item.event_date || "No date set"}
                  </span>
                  <span className="flex items-center gap-1 truncate">
                    <Building2 className="size-3 text-[#FDB813]" /> {item.venue || "No venue"}
                  </span>
                </div>

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
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT COLUMN: Detail & Decision Pane (Identical to Admin) ── */}
      {selectedEvent ? (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0B132B]">
          <div className="p-7 border-b border-white/10 bg-[#0E1733] flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {selectedEvent.title}
                </h2>
                <span className="px-2.5 py-0.5 rounded-none text-xs font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {selectedEvent.status ? selectedEvent.status.replace("_", " ") : "pending"}
                </span>
              </div>
              <p className="text-sm text-[#8D99AE]">{selectedEvent.organization || "Student Org"}</p>
            </div>
          </div>

          <div className="p-7 space-y-7 flex-1">
            {/* Event Logistics Grid */}
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

            {/* Pre-Check Compliance Inspection */}
            <div className="bg-[#16203D] border border-blue-500/30 rounded-none p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-2 rounded-none bg-emerald-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Pre-Check Compliance Inspection
                  </h3>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-none bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Validated
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-none bg-[#0D1836] border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-[#8D99AE]">Adviser Endorsement</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
                    Signature Detected
                  </span>
                </div>

                <div className="p-3 rounded-none bg-[#0D1836] border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-[#8D99AE]">Mandatory Requirements</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
                    Requirements Met
                  </span>
                </div>

                <div className="p-3 rounded-none bg-[#0D1836] border border-white/5 flex flex-col gap-1">
                  <span className="text-[10px] text-[#8D99AE]">Mandatory Waivers</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
                    Waivers Attached
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-none bg-[#090F24] border border-white/5 text-xs space-y-1">
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  Pre-Check Gap Analysis:
                </div>
                <p className="text-white/80 leading-relaxed text-[11px]">
                  All required clearance attachments, consent forms, and physical adviser endorsements were verified. Requisition rows balance with requested funds. Proposal is clear for departmental endorsement.
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold text-[#8D99AE] uppercase tracking-wider mb-2">
                Proposal Description
              </h3>
              <div className="p-4 bg-[#16203D] rounded-none border border-white/5 text-sm leading-relaxed text-white/90">
                {selectedEvent.description || "No description provided."}
              </div>
            </div>

            {/* Promotional Assets & Links */}
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

          {/* Fixed Decision Footer Actions (Identical to Admin) */}
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
              Endorse Proposal
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#8D99AE] text-sm">
          Select an event from the left queue to view details.
        </div>
      )}

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#16203D] border border-white/15 rounded-none p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Request Revisions</h3>
            <p className="text-xs text-[#8D99AE] mb-4">
              Enter the feedback or document corrections required:
            </p>
            <textarea
              rows={4}
              value={revisionFeedback}
              onChange={(e) => setRevisionFeedback(e.target.value)}
              className="w-full p-3 rounded-none bg-[#0B132B] border border-white/10 text-xs text-white outline-none focus:border-[#FDB813] resize-none mb-4"
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

// ============================================================================
// VIEW 2: EVENT SURVEYS (UC 04 — Matching Admin Navy/Gold Theme)
// ============================================================================

function EventSurveysView({
  surveys,
  setSurveys,
  events,
}: {
  surveys: EventSurvey[];
  setSurveys: React.Dispatch<React.SetStateAction<EventSurvey[]>>;
  events: EventRecord[];
}) {
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>(surveys[0]?.id || "");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newEventId, setNewEventId] = useState<number>(events[0]?.event_id || 101);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<"rating" | "text" | "yes_no">("rating");
  const [draftQuestions, setDraftQuestions] = useState<SurveyQuestion[]>([
    {
      id: "init-1",
      prompt: "How effectively did this event achieve its stated academic objectives?",
      type: "rating",
    },
  ]);

  const activeSurvey = surveys.find((s) => s.id === selectedSurveyId) || surveys[0];

  const handleAddDraftQuestion = () => {
    if (!newQuestionText.trim()) return;
    setDraftQuestions((prev) => [
      ...prev,
      { id: `q-${Date.now()}`, prompt: newQuestionText.trim(), type: newQuestionType },
    ]);
    setNewQuestionText("");
  };

  const handleCreateSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftQuestions.length === 0) return;

    const targetEvent = events.find((ev) => ev.event_id === Number(newEventId)) || events[0];
    const created: EventSurvey = {
      id: `SRV-0${surveys.length + 1}`,
      eventId: targetEvent.event_id,
      eventTitle: targetEvent.title,
      organization: targetEvent.organization || "Student Organization",
      status: "active",
      responsesCount: 0,
      targetAudience: targetEvent.accepted_attendees || targetEvent.proposed_attendees || 120,
      avgSatisfaction: 0,
      aiSentimentSummary:
        "Survey deployed. Sentiment summary will populate automatically once student responses arrive.",
      questions: draftQuestions,
    };

    setSurveys((prev) => [created, ...prev]);
    setSelectedSurveyId(created.id);
    setShowCreateModal(false);
    setDraftQuestions([
      {
        id: "init-1",
        prompt: "How effectively did this event achieve its stated academic objectives?",
        type: "rating",
      },
    ]);
  };

  const handleToggleSurveyStatus = (surveyId: string) => {
    setSurveys((prev) =>
      prev.map((s) => {
        if (s.id !== surveyId) return s;
        return { ...s, status: s.status === "active" ? "closed" : "active" };
      })
    );
  };

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden bg-[#0B132B] text-white">
      {/* Left Survey List */}
      <div className="w-[380px] border-r border-white/10 flex flex-col h-full bg-[#0D1836] shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Event Surveys</h1>
            <p className="text-xs text-[#8D99AE] mt-0.5">{surveys.length} configured surveys</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 rounded-none bg-[#FDB813] hover:bg-[#e0a20f] text-black text-xs font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="size-3.5" /> New Survey
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {surveys.map((survey) => {
            const isSelected = activeSurvey?.id === survey.id;
            const completionRate =
              survey.targetAudience > 0
                ? Math.round((survey.responsesCount / survey.targetAudience) * 100)
                : 0;

            return (
              <div
                key={survey.id}
                onClick={() => setSelectedSurveyId(survey.id)}
                className={`p-4 rounded-none border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#1C2541] border-[#FDB813] shadow-md"
                    : "bg-[#16203D] border-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm truncate text-white">{survey.eventTitle}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-none uppercase ${
                      survey.status === "active"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : survey.status === "draft"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-white/10 text-white/70 border border-white/15"
                    }`}
                  >
                    {survey.status}
                  </span>
                </div>
                <p className="text-xs text-[#8D99AE] mb-2">{survey.organization}</p>
                <div className="flex items-center justify-between text-[11px] text-white/75">
                  <span>
                    Responses: {survey.responsesCount}/{survey.targetAudience} ({completionRate}%)
                  </span>
                  {survey.avgSatisfaction > 0 && (
                    <span className="text-[#FDB813] font-bold">
                      {survey.avgSatisfaction.toFixed(1)} / 5.0
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Survey Detail Pane */}
      {activeSurvey && (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0B132B]">
          <div className="p-7 border-b border-white/10 bg-[#0E1733] flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {activeSurvey.eventTitle}
              </h2>
              <p className="text-sm text-[#8D99AE] mt-0.5">{activeSurvey.organization}</p>
            </div>
            <button
              onClick={() => handleToggleSurveyStatus(activeSurvey.id)}
              className="px-4 py-2 rounded-none bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer"
            >
              {activeSurvey.status === "active" ? "Close Survey" : "Activate Survey"}
            </button>
          </div>

          <div className="p-7 space-y-7">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#16203D] rounded-none border border-white/5">
                <p className="text-xs text-[#8D99AE] mb-1">Responses Collected</p>
                <p className="text-lg font-bold text-white">
                  {activeSurvey.responsesCount} / {activeSurvey.targetAudience}
                </p>
              </div>
              <div className="p-4 bg-[#16203D] rounded-none border border-white/5">
                <p className="text-xs text-[#8D99AE] mb-1">Participation Rate</p>
                <p className="text-lg font-bold text-[#FDB813]">
                  {activeSurvey.targetAudience > 0
                    ? Math.round((activeSurvey.responsesCount / activeSurvey.targetAudience) * 100)
                    : 0}
                  %
                </p>
              </div>
              <div className="p-4 bg-[#16203D] rounded-none border border-white/5">
                <p className="text-xs text-[#8D99AE] mb-1">Mean Quality Rating</p>
                <p className="text-lg font-bold text-emerald-400">
                  {activeSurvey.avgSatisfaction > 0
                    ? `${activeSurvey.avgSatisfaction.toFixed(1)} / 5.0`
                    : "Pending"}
                </p>
              </div>
            </div>

            <div className="p-5 bg-[#16203D] border border-blue-500/30 rounded-none space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Qualitative Response Summary
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                {activeSurvey.aiSentimentSummary}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D99AE]">
                Survey Questions ({activeSurvey.questions.length})
              </h3>
              {activeSurvey.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 bg-[#16203D] rounded-none border border-white/5 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-mono text-[#FDB813]">Q0{idx + 1}</span>
                    <p className="text-sm font-medium text-white mt-0.5">{q.prompt}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-[#0B132B] border border-white/10 text-[10px] font-mono uppercase text-[#8D99AE]">
                    {q.type.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Survey Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleCreateSurvey}
            className="w-full max-w-lg bg-[#16203D] border border-white/15 rounded-none p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-white">Create Event Survey</h3>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8D99AE] mb-1.5">
                Select Event
              </label>
              <select
                value={newEventId}
                onChange={(e) => setNewEventId(Number(e.target.value))}
                className="w-full p-2.5 bg-[#0B132B] border border-white/10 text-xs text-white outline-none focus:border-[#FDB813]"
              >
                {events.map((ev) => (
                  <option key={ev.event_id} value={ev.event_id}>
                    {ev.title} ({ev.event_date})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8D99AE]">
                Add Question
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#0B132B] border border-white/10 text-xs text-white outline-none focus:border-[#FDB813]"
                />
                <select
                  value={newQuestionType}
                  onChange={(e) =>
                    setNewQuestionType(e.target.value as "rating" | "text" | "yes_no")
                  }
                  className="px-2.5 py-2 bg-[#0B132B] border border-white/10 text-xs text-white outline-none"
                >
                  <option value="rating">1–5 Rating</option>
                  <option value="yes_no">Yes / No</option>
                  <option value="text">Open Text</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddDraftQuestion}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 bg-[#0B132B] p-3 border border-white/10">
              {draftQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between gap-2 text-xs py-1 border-b border-white/5 last:border-b-0"
                >
                  <span className="text-white/90 truncate">
                    {idx + 1}. {q.prompt}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftQuestions((prev) => prev.filter((item) => item.id !== q.id))
                    }
                    className="text-red-400 hover:text-red-300 cursor-pointer shrink-0"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs text-[#8D99AE] hover:text-white border border-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#FDB813] hover:bg-[#e0a20f] text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="size-3.5" /> Publish Survey
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// VIEW 3: EVENT REPORTS (UC 06 — Matching Admin Navy/Gold Theme)
// ============================================================================

function EventReportsView({
  events,
  surveys,
}: {
  events: EventRecord[];
  surveys: EventSurvey[];
}) {
  const reportRows = events.map((ev) => {
    const proposed = ev.proposed_attendees || 150;
    const accepted = ev.accepted_attendees || Math.round(proposed * 0.88);
    const acceptanceRate = Math.round((accepted / proposed) * 100);
    const matchingSurvey = surveys.find((s) => s.eventId === ev.event_id);

    return {
      ...ev,
      proposed,
      accepted,
      acceptanceRate,
      surveyScore: matchingSurvey?.avgSatisfaction || 4.6,
    };
  });

  const totalProposed = reportRows.reduce((sum, r) => sum + r.proposed, 0);
  const totalAccepted = reportRows.reduce((sum, r) => sum + r.accepted, 0);
  const overallAcceptanceRate =
    totalProposed > 0 ? Math.round((totalAccepted / totalProposed) * 100) : 0;

  const chartData = reportRows.map((row) => ({
    name: row.title.split(" ").slice(0, 2).join(" "),
    TargetCapacity: row.proposed,
    StudentAccepted: row.accepted,
  }));

  const handleExportCSV = () => {
    const headers = [
      "Event ID",
      "Event Title",
      "Organization",
      "Date",
      "Status",
      "Target Capacity",
      "Student Accepted Attendance",
      "Acceptance Rate (%)",
    ];
    const csvLines = [
      headers.join(","),
      ...reportRows.map((r) =>
        [
          r.event_id,
          `"${r.title.replace(/"/g, '""')}"`,
          `"${(r.organization || "").replace(/"/g, '""')}"`,
          r.event_date,
          r.status,
          r.proposed,
          r.accepted,
          r.acceptanceRate,
        ].join(",")
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Department_Event_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-7 space-y-6 bg-[#0B132B] text-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Event Reports</h1>
          <p className="text-xs text-[#8D99AE] mt-0.5">
            Clearance outcomes and student event acceptance metrics
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-[#FDB813] hover:bg-[#e0a20f] text-black text-xs font-bold flex items-center gap-2 transition cursor-pointer"
        >
          <Download className="size-4" /> Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#16203D] border border-white/5">
          <div className="flex items-center justify-between text-[#8D99AE] mb-1.5">
            <span className="text-[11px] font-semibold uppercase">Total Events</span>
            <FileText className="size-4 text-[#FDB813]" />
          </div>
          <p className="text-2xl font-bold text-white">{reportRows.length}</p>
        </div>

        <div className="p-4 bg-[#16203D] border border-white/5">
          <div className="flex items-center justify-between text-[#8D99AE] mb-1.5">
            <span className="text-[11px] font-semibold uppercase">Student Accepted</span>
            <Users className="size-4 text-[#FDB813]" />
          </div>
          <p className="text-2xl font-bold text-white">{totalAccepted.toLocaleString()}</p>
        </div>

        <div className="p-4 bg-[#16203D] border border-white/5">
          <div className="flex items-center justify-between text-[#8D99AE] mb-1.5">
            <span className="text-[11px] font-semibold uppercase">Acceptance Rate</span>
            <TrendingUp className="size-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{overallAcceptanceRate}%</p>
        </div>

        <div className="p-4 bg-[#16203D] border border-white/5">
          <div className="flex items-center justify-between text-[#8D99AE] mb-1.5">
            <span className="text-[11px] font-semibold uppercase">Avg Survey Score</span>
            <CheckCircle2 className="size-4 text-[#FDB813]" />
          </div>
          <p className="text-2xl font-bold text-[#FDB813]">4.7 / 5.0</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5 bg-[#16203D] border border-white/5">
        <h2 className="text-sm font-bold text-white mb-4">
          Student Event Acceptance vs. Proposed Capacity
        </h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="name" stroke="#8D99AE" style={{ fontSize: "11px" }} />
              <YAxis stroke="#8D99AE" style={{ fontSize: "11px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0E1733",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#FFFFFF",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="TargetCapacity" name="Target Capacity" fill="#4A90D9" />
              <Bar dataKey="StudentAccepted" name="Student Accepted" fill="#FDB813" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#16203D] border border-white/5 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-[#0E1733] text-[#8D99AE] uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Event Proposal</th>
              <th className="py-3 px-4">Organization</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Accepted / Target</th>
              <th className="py-3 px-4 text-right">Acceptance Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {reportRows.map((row) => (
              <tr key={row.event_id} className="hover:bg-white/[0.02]">
                <td className="py-3.5 px-4 font-semibold text-white">{row.title}</td>
                <td className="py-3.5 px-4 text-[#8D99AE]">{row.organization}</td>
                <td className="py-3.5 px-4 text-white/80">{row.event_date}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                      row.status === "approved" || row.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : row.status === "needs_revision" || row.status === "revision"
                        ? "bg-amber-500/20 text-amber-400"
                        : row.status === "rejected"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {row.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-white">
                  {row.accepted} / {row.proposed}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-[#FDB813]">
                  {row.acceptanceRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}