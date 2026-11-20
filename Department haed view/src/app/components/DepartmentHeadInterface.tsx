import React, { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Eye, EyeOff, Menu, Plus, RefreshCw, Trash2, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "../../lib/supabase";

// Point this at your published privacy notice (the sign-up form collects name and email).
const PRIVACY_URL = "/privacy";

// ============================================================================
// TYPES
// ============================================================================

export interface Precheck {
  adviser_signature: boolean;
  requirements_met: boolean;
  waivers_attached: boolean;
  notes?: string;
}

export interface EventRecord {
  event_id: number;
  title: string;
  organization?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  description: string;
  status: "pending" | "approved" | "revision" | "needs_revision" | "completed" | "rejected";
  admin_feedback?: string;
  external_registration_link?: string;
  registration_link?: string;
  proposed_attendees?: number;
  accepted_attendees?: number;
  precheck?: Precheck; // render only when the backend supplies a real result
}

type QuestionType = "rating" | "text" | "yes_no";

interface SurveyQuestion {
  id: string;
  prompt: string;
  type: QuestionType;
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
  summary?: string;
  questions: SurveyQuestion[];
}

interface DeptHeadUser {
  fullName: string;
  department: string;
  email: string;
}

type DeptNavView = "Proposal Approvals" | "Event Surveys" | "Event Reports";

// ============================================================================
// DESIGN TOKENS (one blue for actions; green/amber/red are reserved for status)
//   canvas #F2F4F7 · surface #FFF · ink #18212F · muted #5B6678 · line #DDE2EA
//   primary #24408E  · endorsed #1F7A4D · revision #8A5A00 · rejected #B3261E
// All text pairs below meet WCAG AA (4.5:1) on their backgrounds.
// ============================================================================

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24408E]/40";
const focusRingLight =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
const btn = `inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
const btnPrimary = `${btn} bg-[#24408E] text-white hover:bg-[#1B3270]`;
const btnOutline = `${btn} border border-[#C9D0DB] bg-white text-[#18212F] hover:bg-[#F2F4F7]`;
const btnDanger = `${btn} border border-[#E2B3AF] bg-white text-[#B3261E] hover:bg-[#FBEDEC]`;
const input = `w-full rounded-md border border-[#C9D0DB] bg-white px-3 py-2 text-sm text-[#18212F] placeholder:text-[#6B778A] focus-visible:border-[#24408E] ${focusRing}`;

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-[#EAEFFA] text-[#24408E]" },
  approved: { label: "Endorsed", cls: "bg-[#E6F3EC] text-[#1F7A4D]" },
  completed: { label: "Completed", cls: "bg-[#E6F3EC] text-[#1F7A4D]" },
  revision: { label: "Needs revision", cls: "bg-[#FFF4DC] text-[#8A5A00]" },
  needs_revision: { label: "Needs revision", cls: "bg-[#FFF4DC] text-[#8A5A00]" },
  rejected: { label: "Rejected", cls: "bg-[#FBEDEC] text-[#B3261E]" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.pending;
  return (
    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
  );
}

// ============================================================================
// SAMPLE DATA (shown only when the database is unreachable or empty)
// ============================================================================

const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().split("T")[0];

const SAMPLE_EVENTS: EventRecord[] = [
  {
    event_id: 101,
    title: "Cybersecurity & Digital Forensics Symposium 2026",
    organization: "Junior Information Security Student Association",
    event_date: inDays(2),
    start_time: "1:00 PM",
    end_time: "5:00 PM",
    venue: "Multi-Purpose Hall 1",
    description:
      "Hands-on threat hunting workshop and live incident response simulation for computing students.",
    status: "pending",
    proposed_attendees: 180,
    accepted_attendees: 164,
    external_registration_link: "https://forms.office.com/r/campussync-cyber-symposium",
    precheck: {
      adviser_signature: true,
      requirements_met: true,
      waivers_attached: false,
      notes: "Waiver forms were not found in the submitted packet.",
    },
  },
  {
    event_id: 102,
    title: "Cloud Architecture & DevOps Bootcamp",
    organization: "Campus Cloud Computing Society",
    event_date: inDays(6),
    start_time: "9:00 AM",
    end_time: "4:00 PM",
    venue: "Computer Lab 402",
    description:
      "Full-day lab covering compute instances, storage, IAM policies, and microservice design.",
    status: "pending",
    proposed_attendees: 95,
    accepted_attendees: 88,
    precheck: { adviser_signature: true, requirements_met: true, waivers_attached: true },
  },
  {
    event_id: 103,
    title: "Inter-Departmental Hackathon: Smart Campus",
    organization: "Computer Science Society",
    event_date: inDays(18),
    start_time: "8:00 AM",
    end_time: "6:00 PM",
    venue: "Main Auditorium",
    description: "Ten-hour prototyping challenge on IoT, sustainability, and student productivity tools.",
    status: "approved",
    proposed_attendees: 250,
    accepted_attendees: 232,
  },
  {
    event_id: 104,
    title: "Freshmen Tech Orientation & Org Fair",
    organization: "Department Student Council",
    event_date: inDays(-5),
    start_time: "10:00 AM",
    end_time: "3:00 PM",
    venue: "Main Lobby & Plaza",
    description: "Welcome assembly introducing incoming students to advisers, labs, and student organizations.",
    status: "completed",
    proposed_attendees: 320,
    accepted_attendees: 298,
  },
];

const INITIAL_SURVEYS: EventSurvey[] = [
  {
    id: "SRV-01",
    eventId: 104,
    eventTitle: "Freshmen Tech Orientation & Org Fair",
    organization: "Department Student Council",
    status: "active",
    responsesCount: 241,
    targetAudience: 298,
    avgSatisfaction: 4.7,
    summary:
      "Students praised the live lab demos and peer mentoring booths; some asked for more Q&A time with faculty.",
    questions: [
      { id: "q1", prompt: "How relevant was the orientation to your academic track?", type: "rating" },
      { id: "q2", prompt: "Did the organization booths clearly explain how to join?", type: "yes_no" },
      { id: "q3", prompt: "What topics should future assemblies cover?", type: "text" },
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
    questions: [
      { id: "q1", prompt: "Rate the technical mentorship and network stability.", type: "rating" },
      { id: "q2", prompt: "Would you join a 24-hour regional hackathon next term?", type: "yes_no" },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

const hoursUntil = (d?: string) => (d ? (new Date(d).getTime() - Date.now()) / 36e5 : null);

function urgencyOf(d?: string): { tier: "P1" | "P2" | "P3"; label: string; color: string } {
  const h = hoursUntil(d);
  if (h !== null && h <= 72) return { tier: "P1", label: "P1 High", color: "text-[#B3261E]" };
  if (h !== null && h <= 336) return { tier: "P2", label: "P2 Medium", color: "text-[#8A5A00]" };
  return { tier: "P3", label: "P3 Standard", color: "text-[#5B6678]" };
}

function leadTime(d?: string) {
  const h = hoursUntil(d);
  if (h === null) return "No date";
  if (h <= 0) return "Passed";
  return h <= 48 ? `In ${Math.round(h)}h` : `In ${Math.round(h / 24)}d`;
}

const formatDate = (d?: string) =>
  d
    ? new Date(`${d}T00:00:00`).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : "No date set";

const nameFromEmail = (email: string) =>
  (email.split("@")[0] || "Department Head").replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DH";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const KEYS = {
  session: "campussync_depthead_logged_in",
  user: "campussync_depthead_user",
  email: "campussync_depthead_remembered_email",
  accounts: "campussync_depthead_accounts",
};

function readAccounts(): Record<string, DeptHeadUser> {
  try {
    return JSON.parse(localStorage.getItem(KEYS.accounts) || "{}");
  } catch {
    return {};
  }
}

// ============================================================================
// SHARED UI
// ============================================================================

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#18212F]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#18212F]/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="mb-4 font-serif text-lg font-semibold text-[#18212F]">{title}</h2>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// PORTAL: sign in / create account
// ============================================================================

// ============================================================================
// SKELETONS (shown only on the first load, while there is nothing to display yet)
// ============================================================================

function Skel({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded bg-[#DDE2EA] motion-reduce:animate-none ${className}`}
    />
  );
}

function QueueSkeleton() {
  const titleWidths = ["w-3/5", "w-4/5", "w-2/3", "w-1/2", "w-3/4"];
  return (
    <>
      <li className="sr-only">Loading proposals…</li>
      {titleWidths.map((w, i) => (
        <li key={i} aria-hidden="true" className="border-b border-[#DDE2EA] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <Skel className={`h-4 ${w}`} />
            <Skel className="h-5 w-16" />
          </div>
          <Skel className="mt-2 h-3 w-2/5" />
          <div className="mt-3 flex justify-between">
            <Skel className="h-3 w-20" />
            <Skel className="h-3 w-24" />
          </div>
        </li>
      ))}
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex-1 space-y-8 p-6 md:p-8" aria-busy="true">
      <p className="sr-only" role="status">
        Loading proposal details…
      </p>
      <div className="space-y-3">
        <Skel className="h-7 w-2/3" />
        <Skel className="h-4 w-1/3" />
      </div>
      <div className="grid grid-cols-1 gap-4 border-y border-[#DDE2EA] py-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skel className="h-3 w-12" />
            <Skel className="h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skel className="h-4 w-20" />
        <Skel className="h-28 w-full" />
      </div>
      <div className="max-w-prose space-y-2">
        <Skel className="h-4 w-24" />
        <Skel className="h-3 w-full" />
        <Skel className="h-3 w-5/6" />
        <Skel className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="flex-1 space-y-8 overflow-y-auto p-6 md:p-8" aria-busy="true">
      <p className="sr-only" role="status">
        Loading reports…
      </p>
      <Skel className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 border-y border-[#DDE2EA] py-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skel className="h-3 w-20" />
            <Skel className="h-7 w-16" />
          </div>
        ))}
      </div>
      <Skel className="h-64 w-full" />
      <div className="divide-y divide-[#DDE2EA] rounded-md border border-[#DDE2EA] bg-white">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex-1 space-y-2">
              <Skel className="h-4 w-1/2" />
              <Skel className="h-3 w-1/4" />
            </div>
            <Skel className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DepartmentHeadPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [currentUser, setCurrentUser] = useState<DeptHeadUser>({
    fullName: "",
    department: "Department Head",
    email: "",
  });
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const savedUserRaw = localStorage.getItem(KEYS.user);
    const savedEmail = localStorage.getItem(KEYS.email);
    if (savedUserRaw) {
      try {
        setCurrentUser(JSON.parse(savedUserRaw) as DeptHeadUser);
        if (localStorage.getItem(KEYS.session) === "true") setIsLoggedIn(true);
      } catch {
        /* ignore corrupt data */
      }
    }
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const finishLogin = (user: DeptHeadUser) => {
    setCurrentUser(user);
    localStorage.setItem(KEYS.user, JSON.stringify(user));
    if (rememberMe) {
      localStorage.setItem(KEYS.email, user.email);
      localStorage.setItem(KEYS.session, "true");
    } else {
      localStorage.removeItem(KEYS.email);
      localStorage.removeItem(KEYS.session);
    }
    setIsLoggedIn(true);
    setPassword("");
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const mail = email.trim().toLowerCase();
    const pass = password.trim();

    if (!mail || !pass) return setErrorMessage("Enter your email address and password.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return setErrorMessage("Enter a valid email address.");
    if (pass.length < 6) return setErrorMessage("Password must be at least 6 characters.");

    if (authMode === "signup") {
      if (!fullName.trim() || !department.trim())
        return setErrorMessage("Enter your full name and department.");
      if (!consent) return setErrorMessage("Please accept the privacy notice to create an account.");
      const user: DeptHeadUser = { fullName: fullName.trim(), department: department.trim(), email: mail };
      localStorage.setItem(KEYS.accounts, JSON.stringify({ ...readAccounts(), [mail]: user }));
      return finishLogin(user);
    }

    finishLogin(
      readAccounts()[mail] ?? { fullName: nameFromEmail(mail), department: "Department Head", email: mail }
    );
  };

  const handleLogout = () => {
    localStorage.removeItem(KEYS.session);
    setIsLoggedIn(false);
    setPassword("");
    setErrorMessage("");
  };

  if (isLoggedIn) {
    return (
      <div className="h-screen w-full bg-[#F2F4F7] font-sans text-[#18212F]">
        <DepartmentHeadInterface currentUser={currentUser} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F4F7] p-6 font-sans text-[#18212F]">
      <div className="w-full max-w-sm">
        <p className="mb-5 font-serif text-2xl font-semibold">CampusSync</p>
        <div className="rounded-lg border border-[#DDE2EA] border-t-4 border-t-[#24408E] bg-white p-6">
          <div role="tablist" className="mb-5 flex gap-5 border-b border-[#DDE2EA]">
            {(["signin", "signup"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={authMode === mode}
                onClick={() => {
                  setAuthMode(mode);
                  setErrorMessage("");
                }}
                className={`-mb-px border-b-2 pb-2 text-sm font-medium cursor-pointer ${focusRing} ${
                  authMode === mode
                    ? "border-[#24408E] text-[#24408E]"
                    : "border-transparent text-[#5B6678] hover:text-[#18212F]"
                }`}
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {errorMessage && (
            <p role="alert" className="mb-4 rounded-md bg-[#FBEDEC] px-3 py-2 text-sm text-[#B3261E]">
              {errorMessage}
            </p>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === "signup" && (
              <>
                <Field id="full-name" label="Full name">
                  <input
                    id="full-name"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={input}
                  />
                </Field>
                <Field id="department" label="Department">
                  <input
                    id="department"
                    required
                    autoComplete="organization-title"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={input}
                  />
                </Field>
              </>
            )}

            <Field id="email" label="Email address">
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
              />
            </Field>

            <Field id="password" label="Password">
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${input} pr-10`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5B6678] hover:text-[#18212F] cursor-pointer ${focusRing}`}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            <label className="flex items-center gap-2 text-sm text-[#18212F] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 accent-[#24408E]"
              />
              Keep me signed in on this device
            </label>

            {authMode === "signup" && (
              <label className="flex items-start gap-2 text-sm text-[#18212F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 size-4 accent-[#24408E]"
                />
                <span>
                  I agree to the{" "}
                  <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="text-[#24408E] underline">
                    privacy notice
                  </a>{" "}
                  for how my name and email are used.
                </span>
              </label>
            )}

            <button type="submit" className={`${btnPrimary} w-full`}>
              {authMode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WORKSPACE
// ============================================================================

export function DepartmentHeadInterface({
  currentUser,
  onLogout,
}: {
  currentUser?: DeptHeadUser;
  onLogout?: () => void;
}) {
  const [activeView, setActiveView] = useState<DeptNavView>("Proposal Approvals");
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop
  const openSidebar = () => {
    setSidebarOpen(true);
    setCollapsed(false);
  };
  const closeSidebar = () => {
    setSidebarOpen(false);
    setCollapsed(true);
  };
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingSample, setUsingSample] = useState(false);
  const [surveys, setSurveys] = useState<EventSurvey[]>(INITIAL_SURVEYS);

  const displayName = currentUser?.fullName?.trim() || "Department Head";
  const displayDept = currentUser?.department?.trim() || "Academic Department";

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_id", { ascending: false });
      if (error || !data || data.length === 0) {
        setEvents(SAMPLE_EVENTS);
        setUsingSample(true);
      } else {
        setEvents(data as EventRecord[]);
        setUsingSample(false);
      }
    } catch {
      setEvents(SAMPLE_EVENTS);
      setUsingSample(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
    const channel = supabase
      .channel("campussync-depthead-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => fetchQueue())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pendingCount = events.filter((e) => e.status === "pending").length;
  const nav: { label: DeptNavView; badge?: number }[] = [
    { label: "Proposal Approvals", badge: pendingCount || undefined },
    { label: "Event Surveys" },
    { label: "Event Reports" },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-[#18212F]/50 lg:hidden" onClick={closeSidebar} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 shrink-0 flex-col bg-[#1C2D63] text-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:hidden" : ""}`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <span className="flex items-center gap-2 font-serif text-xl font-semibold">
            <span className="size-2.5 rounded-sm bg-[#F2B84B]" aria-hidden="true" />
            CampusSync
          </span>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={closeSidebar}
            className={`rounded p-1.5 text-[#B8C3E3] hover:bg-white/10 hover:text-white cursor-pointer ${focusRingLight}`}
          >
            <X className="size-4" />
          </button>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-0.5 px-2">
          {nav.map(({ label, badge }) => {
            const active = activeView === label;
            return (
              <button
                key={label}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  setActiveView(label);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm cursor-pointer ${focusRingLight} ${
                  active
                    ? "bg-white/10 font-medium text-white shadow-[inset_3px_0_0_#F2B84B]"
                    : "text-[#D5DCF0] hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
                {badge !== undefined && (
                  <span className="rounded-full bg-[#F2B84B] px-1.5 text-xs font-semibold text-[#1C2D63]">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
              {initialsOf(displayName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-[#B8C3E3]">{displayDept}</p>
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className={`${btn.replace(focusRing, "")} mt-3 w-full border border-white/25 text-white hover:bg-white/10 ${focusRingLight}`}
            >
              Sign out
            </button>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div
          className={`flex items-center gap-3 border-b border-[#DDE2EA] bg-white px-4 py-3 ${
            collapsed ? "" : "lg:hidden"
          }`}
        >
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={openSidebar}
            className={`rounded p-1.5 text-[#24408E] hover:bg-[#EAEFFA] cursor-pointer ${focusRing}`}
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-medium">{activeView}</span>
        </div>

        {activeView === "Proposal Approvals" && (
          <ProposalApprovalsView
            events={events}
            setEvents={setEvents}
            loading={loading}
            usingSample={usingSample}
            onRefresh={fetchQueue}
          />
        )}
        {activeView === "Event Surveys" && (
          <EventSurveysView surveys={surveys} setSurveys={setSurveys} events={events} />
        )}
        {activeView === "Event Reports" && <EventReportsView events={events} surveys={surveys} loading={loading} />}
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 1: PROPOSAL APPROVALS
// ============================================================================

type Tier = "ALL" | "P1" | "P2" | "P3";

function ProposalApprovalsView({
  events,
  setEvents,
  loading,
  usingSample,
  onRefresh,
}: {
  events: EventRecord[];
  setEvents: React.Dispatch<React.SetStateAction<EventRecord[]>>;
  loading: boolean;
  usingSample: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [tier, setTier] = useState<Tier>("ALL");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<null | "revision" | "reject">(null);
  const [note, setNote] = useState("");

  const queue = useMemo(
    () =>
      events
        .map((e) => ({ ...e, u: urgencyOf(e.event_date) }))
        .filter((e) => tier === "ALL" || e.u.tier === tier)
        .sort(
          (a, b) =>
            Number(b.status === "pending") - Number(a.status === "pending") ||
            a.u.tier.localeCompare(b.u.tier) ||
            new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        ),
    [events, tier]
  );

  const selected = queue.find((e) => e.event_id === selectedId) ?? queue[0] ?? null;
  const link = selected?.external_registration_link || selected?.registration_link;
  const pc = selected?.precheck;

  const decide = async (status: "approved" | "rejected" | "needs_revision", feedback?: string) => {
    if (!selected) return;
    setSaving(true);
    setError("");
    const id = selected.event_id;
    const previous = events;

    setEvents((prev) =>
      prev.map((e) =>
        e.event_id === id ? { ...e, status, admin_feedback: feedback || e.admin_feedback } : e
      )
    );

    if (!usingSample) {
      const { error: dbError } = await supabase
        .from("events")
        .update({ status, admin_feedback: feedback || null, updated_at: new Date().toISOString() })
        .eq("event_id", id);
      if (dbError) {
        setEvents(previous);
        setError("The decision could not be saved. Please try again.");
        setSaving(false);
        return;
      }
      await onRefresh();
    }

    setDialog(null);
    setNote("");
    setSaving(false);
  };

  const errorLine = error && (
    <p role="alert" className="text-sm text-[#B3261E]">
      {error}
    </p>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <section
        aria-label="Proposal queue"
        className="flex shrink-0 flex-col border-b border-[#DDE2EA] bg-white max-md:max-h-60 md:w-80 md:border-b-0 md:border-r"
      >
        <div className="space-y-3 border-b border-[#DDE2EA] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-lg font-semibold">Proposals</h1>
              <p className="text-xs text-[#5B6678]">
                {queue.length} shown
              </p>
            </div>
            <button
              type="button"
              aria-label="Refresh proposals"
              onClick={onRefresh}
              className={`rounded p-1.5 text-[#5B6678] hover:bg-[#F2F4F7] cursor-pointer ${focusRing}`}
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex gap-1" role="group" aria-label="Filter by urgency">
            {(["ALL", "P1", "P2", "P3"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tier === t}
                onClick={() => setTier(t)}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium cursor-pointer ${focusRing} ${
                  tier === t ? "bg-[#24408E] text-white" : "text-[#5B6678] hover:bg-[#F2F4F7]"
                }`}
              >
                {t === "ALL" ? "All" : t}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto" aria-busy={loading && events.length === 0}>
          {queue.length === 0 &&
            (loading && events.length === 0 ? (
              <QueueSkeleton />
            ) : (
              <li className="p-6 text-center text-sm text-[#5B6678]">No proposals in this view.</li>
            ))}
          {queue.map((item) => {
            const isSel = selected?.event_id === item.event_id;
            return (
              <li key={item.event_id}>
                <button
                  type="button"
                  aria-current={isSel}
                  onClick={() => setSelectedId(item.event_id)}
                  className={`w-full border-b border-[#DDE2EA] px-4 py-3 text-left cursor-pointer ${focusRing} ${
                    isSel ? "bg-[#EAEFFA] shadow-[inset_3px_0_0_#24408E]" : "hover:bg-[#F7F8FA]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug">{item.title}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#5B6678]">{item.organization}</p>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-[#5B6678]">
                    <span>{formatDate(item.event_date)}</span>
                    {item.status === "pending" && (
                      <span>
                        <span className={`font-medium ${item.u.color}`}>{item.u.label}</span>{" "}
                        {leadTime(item.event_date)}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {selected ? (
        <article className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex-1 space-y-8 p-6 md:p-8">
            <header>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-2xl font-semibold">{selected.title}</h2>
                <StatusBadge status={selected.status} />
              </div>
              <p className="mt-1 text-sm text-[#5B6678]">{selected.organization}</p>
            </header>

            <dl className="grid grid-cols-1 gap-4 border-y border-[#DDE2EA] py-4 sm:grid-cols-3">
              {[
                ["Date", formatDate(selected.event_date)],
                ["Time", `${selected.start_time || "–"} to ${selected.end_time || "–"}`],
                ["Venue", selected.venue || "No venue"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-[#5B6678]">{k}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Pre-check</h3>
              {pc ? (
                <>
                  <ul className="divide-y divide-[#DDE2EA] rounded-md border border-[#DDE2EA] bg-white text-sm">
                    {[
                      ["Adviser endorsement", pc.adviser_signature, "Signature detected", "Signature not detected"],
                      ["Mandatory requirements", pc.requirements_met, "Requirements met", "Requirements incomplete"],
                      ["Waivers", pc.waivers_attached, "Waivers attached", "Waivers missing"],
                    ].map(([label, ok, yes, no]) => (
                      <li key={label as string} className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-[#5B6678]">{label as string}</span>
                        <span className={`font-medium ${ok ? "text-[#1F7A4D]" : "text-[#8A5A00]"}`}>
                          {ok ? (yes as string) : (no as string)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {pc.notes && <p className="mt-2 text-sm text-[#5B6678]">{pc.notes}</p>}
                </>
              ) : (
                <p className="text-sm text-[#5B6678]">No pre-check result is recorded for this proposal.</p>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Description</h3>
              <p className="max-w-prose text-sm leading-relaxed">
                {selected.description || "No description provided."}
              </p>
            </section>

            {link && (
              <section>
                <h3 className="mb-2 text-sm font-semibold">Registration link</h3>
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1.5 break-all text-sm text-[#24408E] underline ${focusRing}`}
                >
                  {link}
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </section>
            )}

            {selected.status !== "pending" && selected.admin_feedback && (
              <section>
                <h3 className="mb-2 text-sm font-semibold">Feedback sent</h3>
                <p className="max-w-prose text-sm">{selected.admin_feedback}</p>
              </section>
            )}
          </div>

          {selected.status === "pending" && (
            <footer className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-[#DDE2EA] bg-white px-6 py-4">
              {!dialog && errorLine}
              <button type="button" disabled={saving} onClick={() => setDialog("reject")} className={btnDanger}>
                Reject
              </button>
              <button type="button" disabled={saving} onClick={() => setDialog("revision")} className={btnOutline}>
                Request revision
              </button>
              <button type="button" disabled={saving} onClick={() => decide("approved")} className={btnPrimary}>
                Endorse proposal
              </button>
            </footer>
          )}
        </article>
      ) : loading && events.length === 0 ? (
        <DetailSkeleton />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-[#5B6678]">
          Select a proposal to review it.
        </div>
      )}

      {dialog && (
        <Modal
          title={dialog === "revision" ? "Request revision" : "Reject proposal"}
          onClose={() => setDialog(null)}
        >
          <Field
            id="decision-note"
            label={dialog === "revision" ? "What needs to change?" : "Reason (optional)"}
          >
            <textarea
              id="decision-note"
              rows={4}
              autoFocus
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${input} resize-none`}
            />
          </Field>
          <div className="mt-3">{errorLine}</div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setDialog(null)} className={btnOutline}>
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || (dialog === "revision" && !note.trim())}
              onClick={() =>
                decide(dialog === "revision" ? "needs_revision" : "rejected", note.trim() || undefined)
              }
              className={dialog === "revision" ? btnPrimary : `${btn} bg-[#B3261E] text-white hover:bg-[#8F1E18]`}
            >
              {dialog === "revision" ? "Send request" : "Reject proposal"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================================
// VIEW 2: EVENT SURVEYS
// ============================================================================

const DEFAULT_QUESTION: SurveyQuestion = {
  id: "init-1",
  prompt: "How well did this event meet its stated objectives?",
  type: "rating",
};

function EventSurveysView({
  surveys,
  setSurveys,
  events,
}: {
  surveys: EventSurvey[];
  setSurveys: React.Dispatch<React.SetStateAction<EventSurvey[]>>;
  events: EventRecord[];
}) {
  const [selectedId, setSelectedId] = useState(surveys[0]?.id ?? "");
  const [creating, setCreating] = useState(false);
  const [eventId, setEventId] = useState<number | null>(null);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState<QuestionType>("rating");
  const [draft, setDraft] = useState<SurveyQuestion[]>([DEFAULT_QUESTION]);

  const active = surveys.find((s) => s.id === selectedId) ?? surveys[0];
  const chosenEvent = events.find((e) => e.event_id === eventId) ?? events[0];
  const rate = (s: EventSurvey) =>
    s.targetAudience > 0 ? `${Math.round((s.responsesCount / s.targetAudience) * 100)}%` : "–";

  const addQuestion = () => {
    if (!qText.trim()) return;
    setDraft((prev) => [...prev, { id: `q-${Date.now()}`, prompt: qText.trim(), type: qType }]);
    setQText("");
  };

  const createSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenEvent || draft.length === 0) return;
    const created: EventSurvey = {
      id: `SRV-${Date.now().toString(36)}`,
      eventId: chosenEvent.event_id,
      eventTitle: chosenEvent.title,
      organization: chosenEvent.organization || "Student organization",
      status: "active",
      responsesCount: 0,
      targetAudience: chosenEvent.accepted_attendees ?? chosenEvent.proposed_attendees ?? 0,
      avgSatisfaction: 0,
      questions: draft,
    };
    setSurveys((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setCreating(false);
    setDraft([DEFAULT_QUESTION]);
  };

  const toggleStatus = (id: string) =>
    setSurveys((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === "active" ? "closed" : "active" } : s))
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <section
        aria-label="Surveys"
        className="flex shrink-0 flex-col border-b border-[#DDE2EA] bg-white max-md:max-h-60 md:w-80 md:border-b-0 md:border-r"
      >
        <div className="flex items-center justify-between border-b border-[#DDE2EA] p-4">
          <h1 className="font-serif text-lg font-semibold">Surveys</h1>
          <button
            type="button"
            disabled={events.length === 0}
            onClick={() => setCreating(true)}
            className={btnPrimary}
          >
            <Plus className="size-4" aria-hidden="true" /> New survey
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {surveys.length === 0 && (
            <li className="p-6 text-center text-sm text-[#5B6678]">No surveys yet.</li>
          )}
          {surveys.map((s) => {
            const isSel = active?.id === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={isSel}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full border-b border-[#DDE2EA] px-4 py-3 text-left cursor-pointer ${focusRing} ${
                    isSel ? "bg-[#EAEFFA] shadow-[inset_3px_0_0_#24408E]" : "hover:bg-[#F7F8FA]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug">{s.eventTitle}</span>
                    <span className="shrink-0 text-xs font-medium capitalize text-[#5B6678]">{s.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#5B6678]">
                    {s.responsesCount} of {s.targetAudience} responded ({rate(s)})
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {active ? (
        <article className="min-w-0 flex-1 space-y-8 overflow-y-auto p-6 md:p-8">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-semibold">{active.eventTitle}</h2>
              <p className="mt-1 text-sm text-[#5B6678]">{active.organization}</p>
            </div>
            <button type="button" onClick={() => toggleStatus(active.id)} className={btnOutline}>
              {active.status === "active" ? "Close survey" : "Activate survey"}
            </button>
          </header>

          <dl className="grid grid-cols-3 gap-4 border-y border-[#DDE2EA] py-4">
            {[
              ["Responses", `${active.responsesCount} / ${active.targetAudience}`],
              ["Participation", rate(active)],
              ["Mean rating", active.avgSatisfaction > 0 ? `${active.avgSatisfaction.toFixed(1)} / 5` : "–"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-[#5B6678]">{k}</dt>
                <dd className="mt-0.5 text-xl font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          {active.responsesCount > 0 && active.summary && (
            <section>
              <h3 className="mb-2 text-sm font-semibold">Response summary</h3>
              <p className="max-w-prose text-sm leading-relaxed">{active.summary}</p>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold">Questions</h3>
            <ol className="divide-y divide-[#DDE2EA] rounded-md border border-[#DDE2EA] bg-white">
              {active.questions.map((q, i) => (
                <li key={q.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                  <span>
                    <span className="mr-2 text-[#5B6678]">{i + 1}.</span>
                    {q.prompt}
                  </span>
                  <span className="shrink-0 text-xs text-[#5B6678]">
                    {{ rating: "1–5 rating", yes_no: "Yes / No", text: "Open text" }[q.type]}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </article>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-[#5B6678]">
          Create a survey to get started.
        </div>
      )}

      {creating && (
        <Modal title="New survey" onClose={() => setCreating(false)}>
          <form onSubmit={createSurvey} className="space-y-4">
            <Field id="survey-event" label="Event">
              <select
                id="survey-event"
                value={chosenEvent?.event_id ?? ""}
                onChange={(e) => setEventId(Number(e.target.value))}
                className={input}
              >
                {events.map((ev) => (
                  <option key={ev.event_id} value={ev.event_id}>
                    {ev.title} ({formatDate(ev.event_date)})
                  </option>
                ))}
              </select>
            </Field>

            <div>
              <label htmlFor="survey-question" className="mb-1.5 block text-sm font-medium">
                Add a question
              </label>
              <div className="flex gap-2">
                <input
                  id="survey-question"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addQuestion();
                    }
                  }}
                  className={`${input} flex-1`}
                />
                <select
                  aria-label="Question type"
                  value={qType}
                  onChange={(e) => setQType(e.target.value as QuestionType)}
                  className={`${input} w-auto`}
                >
                  <option value="rating">1–5 rating</option>
                  <option value="yes_no">Yes / No</option>
                  <option value="text">Open text</option>
                </select>
                <button type="button" onClick={addQuestion} className={btnOutline}>
                  Add
                </button>
              </div>
            </div>

            <ol className="max-h-40 divide-y divide-[#DDE2EA] overflow-y-auto rounded-md border border-[#DDE2EA]">
              {draft.map((q, i) => (
                <li key={q.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="truncate">
                    {i + 1}. {q.prompt}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove question ${i + 1}`}
                    onClick={() => setDraft((prev) => prev.filter((x) => x.id !== q.id))}
                    className={`rounded p-1 text-[#B3261E] hover:bg-[#FBEDEC] cursor-pointer ${focusRing}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ol>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreating(false)} className={btnOutline}>
                Cancel
              </button>
              <button type="submit" disabled={draft.length === 0} className={btnPrimary}>
                Publish survey
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================================
// VIEW 3: EVENT REPORTS (only real numbers; missing data shows as "–")
// ============================================================================

function EventReportsView({
  events,
  surveys,
  loading,
}: {
  events: EventRecord[];
  surveys: EventSurvey[];
  loading: boolean;
}) {
  if (loading && events.length === 0) return <ReportsSkeleton />;

  const rows = events.map((ev) => {
    const target = ev.proposed_attendees ?? null;
    const accepted = ev.accepted_attendees ?? null;
    return {
      ...ev,
      target,
      accepted,
      rate: target && accepted !== null ? Math.round((accepted / target) * 100) : null,
    };
  });

  const complete = rows.filter((r) => r.target && r.accepted !== null);
  const totalTarget = complete.reduce((s, r) => s + (r.target ?? 0), 0);
  const totalAccepted = complete.reduce((s, r) => s + (r.accepted ?? 0), 0);
  const overallRate = totalTarget > 0 ? `${Math.round((totalAccepted / totalTarget) * 100)}%` : "–";

  const rated = surveys.filter((s) => s.responsesCount > 0 && s.avgSatisfaction > 0);
  const avgScore = rated.length
    ? `${(rated.reduce((s, x) => s + x.avgSatisfaction, 0) / rated.length).toFixed(1)} / 5`
    : "–";

  const chartData = complete.map((r) => ({
    name: r.title.split(" ").slice(0, 2).join(" "),
    Target: r.target,
    Accepted: r.accepted,
  }));

  const exportCsv = () => {
    const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      ["Event ID", "Title", "Organization", "Date", "Status", "Target capacity", "Accepted", "Acceptance rate (%)"]
        .map(esc)
        .join(","),
      ...rows.map((r) =>
        [r.event_id, r.title, r.organization ?? "", r.event_date, r.status, r.target, r.accepted, r.rate]
          .map(esc)
          .join(",")
      ),
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `CampusSync_Event_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 space-y-8 overflow-y-auto p-6 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-2xl font-semibold">Event reports</h1>
        <button type="button" onClick={exportCsv} className={btnOutline}>
          <Download className="size-4" aria-hidden="true" /> Export CSV
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-4 border-y border-[#DDE2EA] py-4 lg:grid-cols-4">
        {[
          ["Events", String(rows.length)],
          ["Accepted", totalAccepted.toLocaleString()],
          ["Acceptance rate", overallRate],
          ["Mean survey rating", avgScore],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-[#5B6678]">{k}</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-[#24408E]">{v}</dd>
          </div>
        ))}
      </dl>

      {chartData.length > 0 && (
        <section aria-label="Accepted attendees compared with target capacity">
          <h2 className="mb-3 text-sm font-semibold">Accepted vs. target capacity</h2>
          <div className="h-64 w-full rounded-md border border-[#DDE2EA] bg-white p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE2EA" vertical={false} />
                <XAxis dataKey="name" stroke="#5B6678" tick={{ fontSize: 12 }} />
                <YAxis stroke="#5B6678" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ border: "1px solid #DDE2EA", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Target" fill="#8A97AD" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Accepted" fill="#24408E" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="overflow-x-auto rounded-md border border-[#DDE2EA] bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#DDE2EA] text-xs text-[#5B6678]">
              <th scope="col" className="px-4 py-3 font-medium">Event</th>
              <th scope="col" className="px-4 py-3 font-medium">Date</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Accepted / target</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DDE2EA]">
            {rows.map((r) => (
              <tr key={r.event_id}>
                <td className="px-4 py-3">
                  <span className="font-medium">{r.title}</span>
                  <span className="block text-xs text-[#5B6678]">{r.organization}</span>
                </td>
                <td className="px-4 py-3 text-[#5B6678]">{formatDate(r.event_date)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {r.accepted ?? "–"} / {r.target ?? "–"}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {r.rate !== null ? `${r.rate}%` : "–"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}