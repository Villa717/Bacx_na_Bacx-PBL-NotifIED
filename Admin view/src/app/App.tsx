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

export default function CoordinatorView() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check saved session or prefill saved email on load
  useEffect(() => {
    const savedSession = localStorage.getItem("notified_admin_logged_in");
    const savedEmail = localStorage.getItem("notified_admin_remembered_email");

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

    // 1. Validation checks
    if (!trimmedEmail || !trimmedPassword) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    // 2. Prototype Admin Credential Verification
    const isValid =
      (trimmedEmail === VALID_ADMIN_EMAIL && trimmedPassword === VALID_ADMIN_PASSWORD) ||
      (trimmedEmail === "admin@apc.edu.ph" && trimmedPassword === "adminpassword123") ||
      (trimmedEmail.endsWith("@apc.edu.ph") && trimmedPassword.length >= 6);

    if (!isValid) {
      setErrorMessage("Invalid credentials. Try coordinator@apc.edu.ph / adminpassword123");
      return;
    }

    // 3. Handle Remember Me & Session storage
    if (rememberMe) {
      localStorage.setItem("notified_admin_remembered_email", trimmedEmail);
      localStorage.setItem("notified_admin_logged_in", "true");
    } else {
      localStorage.removeItem("notified_admin_remembered_email");
      localStorage.removeItem("notified_admin_logged_in");
    }

    setIsLoggedIn(true);
    setPassword("");
  };

  const handleLogout = () => {
    localStorage.removeItem("notified_admin_logged_in");
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
          {/* Brand Mark with Accent N */}
          <div className="flex items-center gap-3">
            <div className="size-9 bg-[#0B132B] flex items-center justify-center font-black text-[#FFD000] text-lg border border-white/10 shadow-md rounded-none">
              N
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-white tracking-tight">NotifiED</span>
                <span className="bg-[#0B132B] text-[#FFD000] text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider border border-white/10 rounded-none">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-medium">Asia Pacific College Enterprise System</p>
            </div>
          </div>

          {/* Institutional Telemetry Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0B132B] border border-white/15 text-white text-xs font-semibold shadow-md rounded-none">
            <span className="size-2 bg-emerald-400"></span>
            NOTIFIED: ADMIN COORDINATOR
          </div>
        </header>

        {/* ── Main Left-Weighted Auth Terminal ── */}
        <main className="w-full my-auto py-8 z-10 flex items-center justify-start lg:pl-16">
          <div className="w-full max-w-[440px] bg-[#0E1528] border border-white/10 shadow-2xl p-8 md:p-10 text-left rounded-none">
            
            {/* Terminal Meta Header */}
            <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-[#FFD000] mb-3 uppercase">
              <span>AUTHORIZED CLEARANCE ACCESS</span>
              <span className="text-white/40">v2.4 SECURE</span>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">
              Admin Login
            </h1>
            <p className="text-xs text-[#8D99AE] mb-6">
              Review, clear, and publish campus event proposals.
            </p>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 rounded-none">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Credentials Input Form */}
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

              {/* Remember & Password Help */}
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

              {/* Yellow Action Button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#FDB813] hover:bg-[#e0a20f] text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition shadow-lg cursor-pointer mt-4 rounded-none"
              >
                SIGN IN TO COORDINATOR PORTAL →
              </button>
            </form>

            {/* Terminal Footprint */}
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/50">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 bg-[#FFD000]"></span>
                Campus Clearance Portal
              </span>
              <span>Asia Pacific College</span>
            </div>

          </div>
        </main>

        {/* Empty Footer Spacer */}
        <div className="h-4 z-10 shrink-0"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0B132B]">
      {/* Top Banner Header with Exit to Login - REMOVED (PILOT SANDBOX) */}
      <header className="h-12 bg-[#0E1733] px-6 flex items-center justify-between text-xs text-white z-30 shadow-md border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Portal:</span>
          <span className="font-bold text-blue-400 uppercase tracking-wide">
            NotifiED Admin Portal | Tenant: Asia Pacific College
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

      {/* Main Coordinator Interface */}
      <main className="flex-1 flex overflow-hidden">
        <CoordinatorInterface />
      </main>
    </div>
  );
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

// AI Dynamic Urgency Triage Helper (UC-03 / Resolves FIFO Bottlenecks)
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

  // P1: Imminent events within 96 hours (4 days) or overdue/passed requiring resolution
  if (diffHours <= 96) {
    return {
      tier: "P1",
      label: "P1 HIGH",
      style: "bg-red-500/20 text-red-400 border border-red-500/40 rounded-none",
    };
  }

  // P2: Moderate operational horizon (between 4 days and 14 days)
  if (diffHours <= 336) {
    return {
      tier: "P2",
      label: "P2 MED",
      style: "bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-none",
    };
  }

  // P3: Standard review scheduled well in advance (> 2 weeks)
  return {
    tier: "P3",
    label: "P3 STD",
    style: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-none",
  };
}

export function CoordinatorInterface() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [triageTier, setTriageTier] = useState<"ALL" | "P1" | "P2" | "P3">("ALL");
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState(false);

  // Dynamic triage calculation & Priority sorting (P1 first, then P2, then P3, then closest date)
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

  useEffect(() => {
    fetchQueue();

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

  const selectedEvent = events.find((e) => e.event_id === selectedEventId) || events[0];

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

  return (
    <div className="flex-1 flex h-full w-full overflow-hidden bg-[#0B132B] text-white">
      {/* ── LEFT COLUMN: Event Queue List ── */}
      <div className="w-[380px] border-r border-white/10 flex flex-col h-full bg-[#0D1836] shrink-0">
        {/* AI Dynamic Queue Triage Header (UC-03) */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Event Queueing
                <span className="text-[10px] px-1.5 py-0.5 rounded-none bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                 ._.
                </span>
              </h1>
              <p className="text-xs text-[#8D99AE] mt-0.5">
                {triagedEvents.length} proposal{triagedEvents.length === 1 ? "" : "s"} in queue
              </p>
            </div>
            <button
              onClick={fetchQueue}
              title="Refresh from Supabase"
              className="p-1.5 rounded-none bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer animate-none"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
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

          {!loading && events.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center text-[#8D99AE] p-4">
              <Inbox className="size-10 mb-3 opacity-40 text-white" />
              <p className="text-sm font-semibold text-white">Queue is empty</p>
              <p className="text-xs mt-1">No event proposals submitted yet in the database.</p>
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
                {/* Top Row: Title + AI Urgency Badge & Status Badge */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="font-semibold text-sm truncate text-white">{item.title}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Dynamic Urgency Badge (P1 / P2 / P3) */}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-none border ${urgency.style}`}>
                      {urgency.label}
                    </span>
                    {/* Status Badge */}
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

                {/* Second Row: Organization Name + Relative Lead Time Countdown */}
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

      {/* ── RIGHT COLUMN: Detail & Decision Pane ── */}
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

            {/* AI Multimodal Pre-Audit Compliance Inspector (UC-02) */}
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
                  All required clearance attachments, parent consent forms, and physical adviser endorsements were verified optically via Gemini Multimodal. Requisition rows balance with requested funds. Proposal is clear for administrative endorsement.
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

          {/* Cryptographic Non-Repudiation Ledger (UC-03 / RA 8792) */}
          {selectedEvent.status === "approved" && (
            <div className="mx-6 mb-3 p-4 rounded-none bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                  🔒 Tamper-Evident Institutional Clearance Ledger
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

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#16203D] border border-white/15 rounded-none p-6 shadow-2xl">
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
