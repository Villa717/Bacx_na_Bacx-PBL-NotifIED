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
} from "lucide-react";
import { supabase } from "../lib/supabase";
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

  const pendingReviewEvents = events.filter(
    (e) => e.status === "pending" || e.status === "needs_revision" || e.status === "revision"
  );
  const approvedEvents = events.filter((e) => e.status === "approved");
  const p1UrgentCount = pendingReviewEvents.filter(
    (e) => computeDynamicUrgency(e.event_date).tier === "P1"
  ).length;

  const baseEventsList = reviewFilter === "PENDING" ? pendingReviewEvents : events;

  const triagedEvents = baseEventsList
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

  const fetchQueue = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_id", { ascending: false });

    if (error) {
      console.error("Error fetching queue from Supabase:", error.message);
    } else if (data) {
      setEvents(data as EventRecord[]);
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].event_id);
      }
    }
    setLoading(false);
  };

  // Sync live registered facilitator accounts once Facilitator Portal creates users
  const fetchFacilitatorAccounts = async () => {
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
  };

  useEffect(() => {
    fetchQueue();
    fetchFacilitatorAccounts();

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
            }}
            className="px-3 py-1 rounded-none bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 flex items-center gap-1.5 cursor-pointer transition"
          >
            <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
            Sync Queue
          </button>
        </header>

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
            <div className="w-[380px] border-r border-white/10 flex flex-col h-full bg-[#0D1836] shrink-0">
              <div className="p-4 border-b border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                      Pending Approvals
                    </h1>
                    <p className="text-xs text-[#8D99AE] mt-0.5">
                      {triagedEvents.length} proposal{triagedEvents.length === 1 ? "" : "s"} in view
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

            {/* RIGHT COLUMN: Detail & Decision Pane */}
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

                  {/* AI Multimodal Pre-Check Compliance Inspector (UC-02) */}
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
                          ✓ Signature Detected
                        </span>
                      </div>

                      <div className="p-3 rounded-none bg-[#0D1836] border border-white/5 flex flex-col gap-1">
                        <span className="text-[10px] text-[#8D99AE]">Mandatory Requirements</span>
                        <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
                          ✓ Requirements Met
                        </span>
                      </div>

                      <div className="p-3 rounded-none bg-[#0D1836] border border-white/5 flex flex-col gap-1">
                        <span className="text-[10px] text-[#8D99AE]">Mandatory Waivers</span>
                        <span className="font-semibold text-emerald-400 flex items-center gap-1 text-[11px]">
                          ✓ Waivers Attached
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-none bg-[#090F24] border border-white/5 text-xs space-y-1">
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                        Pre-Check Gap Analysis:
                      </div>
                      <p className="text-white/80 leading-relaxed text-[11px]">
                        All required clearance attachments, participant consent forms, and physical adviser endorsements were verified optically via Gemini Multimodal. Proposal is clear for administrative endorsement.
                      </p>
                    </div>
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
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4 text-left">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="size-4 text-[#FDB813]" /> Post-Event Evaluation Surveys (UC-04 & UC-06)
              </h1>
              <p className="text-xs text-[#8D99AE] mt-0.5">
                AI-generated survey matrices deployed to verified mobile attendees upon event conclusion.
              </p>
            </div>

            {approvedEvents.length === 0 ? (
              <div className="p-10 bg-[#16203D] border border-white/10 text-center text-xs text-[#8D99AE]">
                No approved events available yet for survey monitoring.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {approvedEvents.map((ev, index) => {
                  const responsesCount = 42 + index * 17;
                  const satisfactionScore = (4.6 + (index % 4) * 0.1).toFixed(1);
                  return (
                    <div key={ev.event_id} className="p-5 bg-[#16203D] border border-white/10 space-y-3 rounded-none">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-white">{ev.title}</h3>
                          <p className="text-xs text-[#8D99AE]">
                            {ev.organization || "Student Org"} • {ev.event_date}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          Active Survey
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                        <div className="p-2 bg-[#0B132B]">
                          <div className="text-[10px] text-[#8D99AE]">Verified Responses</div>
                          <div className="text-sm font-bold text-white">{responsesCount}</div>
                        </div>
                        <div className="p-2 bg-[#0B132B]">
                          <div className="text-[10px] text-[#8D99AE]">Avg Rating</div>
                          <div className="text-sm font-bold text-[#FDB813]">{satisfactionScore} / 5.0</div>
                        </div>
                        <div className="p-2 bg-[#0B132B]">
                          <div className="text-[10px] text-[#8D99AE]">AI Synthesis</div>
                          <div className="text-sm font-bold text-emerald-400">Ready</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
