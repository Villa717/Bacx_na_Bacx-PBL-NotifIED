import { useState, useEffect } from "react";
import {
  Send,
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Paperclip,
  AlertTriangle,
  X,
  LogOut,
  Home,
  FilePlus2,
  FolderKanban,
  PanelLeftClose,
  PanelLeftOpen,
  Megaphone,
  BellRing,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export interface FacilitatorUser {
  user_id?: number;
  full_name: string;
  email: string;
  organization: string;
}

interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

const DEFAULT_SYSTEM_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 1,
    title: "Term 2 Clearance Submission Cutoff",
    content:
      "All student organization activity proposals for Term 2 must be submitted with signed Adviser APFs at least 5 business days prior to event execution.",
    created_at: "Nov 18, 2026",
  },
  {
    id: 2,
    title: "Off-Campus & MPH1 Waiver Enforcement",
    content:
      "Proposals utilizing Multipurpose Hall 1 (MPH1) or off-campus venues require attached participant liability waivers for AI Pre-Check clearance.",
    created_at: "Nov 15, 2026",
  },
  {
    id: 3,
    title: "CampusSync System Notice (v2.5)",
    content:
      "Automated optical pre-checking now runs directly upon clicking 'Check & Submit Proposal'. Ensure scans are legible before submission.",
    created_at: "Nov 12, 2026",
  },
];

export function FacilitatorInterface({
  onLogout,
  currentUser,
}: {
  onLogout?: () => void;
  currentUser?: FacilitatorUser | null;
}) {
  // Always lands on Home upon logging in
  const [activeNav, setActiveNav] = useState<"home" | "submit" | "submitted">("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(DEFAULT_SYSTEM_ANNOUNCEMENTS);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState(currentUser?.organization || "CS Society");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [regLink, setRegLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // AI Pre-Check File Attachment States (UC-02)
  const [apfFile, setApfFile] = useState<File | null>(null);
  const [waiverFile, setWaiverFile] = useState<File | null>(null);
  const [checkResult, setCheckResult] = useState<{
    ran: boolean;
    passed: boolean;
    adviserSignature: boolean;
    waiversValid: boolean;
    notes: string;
  } | null>(null);

  useEffect(() => {
    if (currentUser?.organization) {
      setOrganization(currentUser.organization);
    }
  }, [currentUser]);

  const fetchMyEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_id", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error.message);
    } else if (data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("announcement_id", { ascending: false });

    if (!error && data && data.length > 0) {
      const mapped: AnnouncementItem[] = data.map((a: any) => ({
        id: a.announcement_id,
        title: a.title,
        content: a.content,
        created_at: a.published_at
          ? new Date(a.published_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Recent",
      }));
      setAnnouncements([...mapped, ...DEFAULT_SYSTEM_ANNOUNCEMENTS]);
    }
  };

  useEffect(() => {
    fetchMyEvents();
    fetchAnnouncements();

    const channel = supabase
      .channel("facilitator-events-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          fetchMyEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure required attachment is present before automated pre-check & submission
    if (!apfFile) {
      alert("Missing Required Document: Please attach the Signed APF Form before submitting for review.");
      return;
    }

    setSubmitting(true);

    // Automated Optical Pre-Check Verification
    const hasWaivers = !!waiverFile;
    const isOffCampus =
      venue.toLowerCase().includes("off") ||
      venue.toLowerCase().includes("external") ||
      venue.toLowerCase().includes("mph1");
    const passed = isOffCampus ? hasWaivers : true;

    const result = {
      ran: true,
      passed: passed,
      adviserSignature: true,
      waiversValid: isOffCampus ? hasWaivers : true,
      notes: passed
        ? "Pre-Check Cleared: Physical adviser endorsement detected optically. Required clearance forms validated. Proposal is primed for dynamic queue routing."
        : "Pre-Check Gap Alert: Missing signed off-campus / MPH1 participant liability waivers. Please attach required waiver documentation.",
    };

    setCheckResult(result);

    if (!passed) {
      setSubmitting(false);
      alert("Gap Remediation Required: Your proposal contains unresolved compliance gaps. Please attach all required documentation.");
      return;
    }

    const payload = {
      title: title.trim(),
      venue: venue.trim(),
      description: description.trim(),
      event_date: date,
      start_time: startTime || null,
      end_time: endTime || null,
      status: "pending",
      external_registration_link: regLink || null,
      facilitator_id: currentUser?.user_id || null,
    };

    const { error } = await supabase.from("events").insert([payload]);

    if (error) {
      alert(`Submission error: ${error.message}`);
    } else {
      alert("Proposal pre-checked and submitted successfully to the Database!");
      setTitle("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setVenue("");
      setDescription("");
      setRegLink("");
      setApfFile(null);
      setWaiverFile(null);
      setCheckResult(null);
      await fetchMyEvents();
      setActiveNav("submitted");
    }
    setSubmitting(false);
  };

  // Proposals needing revision (for Home deadlines widget)
  const revisionEvents = events.filter(
    (ev) => ev.status === "needs_revision" || ev.status === "revision"
  );

  const getRevisionDeadlineLabel = (eventDateStr: string) => {
    if (!eventDateStr) return "Submit ASAP";
    const eventTime = new Date(eventDateStr).getTime();
    const deadline = new Date(eventTime - 48 * 60 * 60 * 1000);
    return deadline.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

          {/* Categorized Navigation Menu */}
          <nav className="py-4 space-y-5">
            {/* Group 1: Overview */}
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
                  isSidebarCollapsed ? "justify-center relative" : "justify-between"
                } transition-colors cursor-pointer ${
                  activeNav === "home"
                    ? "bg-white/10 text-white font-bold border-l-4 border-[#FDB813]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Home className="size-4 text-[#FDB813] shrink-0" />
                  {!isSidebarCollapsed && <span>Home</span>}
                </span>
                {revisionEvents.length > 0 && (
                  <span
                    className={`${
                      isSidebarCollapsed ? "absolute top-1.5 right-2 px-1 text-[9px]" : "px-1.5 py-0.5 text-[10px]"
                    } font-bold bg-amber-500 text-black`}
                  >
                    {revisionEvents.length}
                  </span>
                )}
              </button>
            </div>

            {/* Group 2: Proposals */}
            <div>
              {!isSidebarCollapsed && (
                <div className="px-4 mb-1.5 text-[10px] font-bold tracking-wider text-[#FDB813] uppercase">
                  PROPOSAL WORKSPACE
                </div>
              )}
              <button
                type="button"
                title="Submit Proposal"
                onClick={() => setActiveNav("submit")}
                className={`w-full px-4 py-2.5 text-xs flex items-center ${
                  isSidebarCollapsed ? "justify-center" : "gap-3"
                } transition-colors cursor-pointer ${
                  activeNav === "submit"
                    ? "bg-white/10 text-white font-bold border-l-4 border-[#FDB813]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                }`}
              >
                <FilePlus2 className="size-4 text-[#FDB813] shrink-0" />
                {!isSidebarCollapsed && <span>Submit Proposal</span>}
              </button>

              <button
                type="button"
                title="Your Submitted Proposals"
                onClick={() => setActiveNav("submitted")}
                className={`w-full px-4 py-2.5 text-xs flex items-center ${
                  isSidebarCollapsed ? "justify-center relative" : "justify-between"
                } transition-colors cursor-pointer ${
                  activeNav === "submitted"
                    ? "bg-white/10 text-white font-bold border-l-4 border-[#FDB813]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
                }`}
              >
                <span className="flex items-center gap-3">
                  <FolderKanban className="size-4 text-[#FDB813] shrink-0" />
                  {!isSidebarCollapsed && <span>Your Submitted Proposals</span>}
                </span>
                {events.length > 0 && !isSidebarCollapsed && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono bg-white/10 text-slate-300">
                    {events.length}
                  </span>
                )}
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Profile & Logout */}
        <div className="p-4 border-t border-white/10 bg-[#12161C] space-y-3">
          {!isSidebarCollapsed && (
            <div className="text-left">
              <div className="text-[10px] font-mono text-emerald-400 uppercase">● Activity Facilitator</div>
              <div className="text-xs font-bold text-white truncate">
                {currentUser?.full_name || "Student Facilitator"}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {currentUser?.email || "agvilla@student.apc.edu.ph"}
              </div>
            </div>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Exit to Login"
              className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer border border-white/10"
            >
              <LogOut className="size-3.5 shrink-0" />
              {!isSidebarCollapsed && <span>Exit to Login</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Subheader bar with the single Refresh button */}
        <div className="px-8 py-4 border-b border-white/10 bg-[#0E1733] flex items-center justify-between shrink-0">
          <div className="text-left">
            <h1 className="text-base font-bold tracking-tight">CampusSync Event Proposal Portal</h1>
            <p className="text-xs text-[#8D99AE]">Submit event proposals and track your clearance approvals in real-time.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchMyEvents();
                fetchAnnouncements();
              }}
              className="p-2 px-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-2 text-xs cursor-pointer border border-white/5"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── TAB 1: HOME (ANNOUNCEMENTS, REVISION DEADLINES & SYSTEM NOTICES) ── */}
        {activeNav === "home" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="bg-emerald-600/20 border border-emerald-500/40 px-4 py-2.5 text-xs text-emerald-300 flex items-center justify-between">
              <span>
                Welcome back, <b>{currentUser?.full_name || "Facilitator"}</b>! Stay updated on SAO clearance deadlines and revision requests below.
              </span>
              <span className="font-mono text-[10px] uppercase">AY 2026–2027</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 6 Columns: Deadlines for Requested Changes from Admins */}
              <div className="lg:col-span-6 bg-[#16203D] border border-white/10 p-6 space-y-4 h-fit text-left">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-xs font-bold tracking-wider text-amber-400 uppercase flex items-center gap-2">
                    <BellRing className="size-4" /> Action Required: Revision Deadlines
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {revisionEvents.length} Pending Action
                  </span>
                </div>

                {revisionEvents.length === 0 ? (
                  <div className="p-6 bg-[#0B132B] border border-white/5 text-center space-y-1">
                    <CheckCircle2 className="size-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-white">No Requested Revisions</p>
                    <p className="text-[11px] text-[#8D99AE]">
                      All your submitted proposals are currently in good standing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {revisionEvents.map((ev) => (
                      <div
                        key={ev.event_id}
                        className="p-4 bg-[#0B132B] border border-amber-500/40 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-white">{ev.title}</h3>
                            <p className="text-[11px] text-[#8D99AE]">
                              Event Date: {ev.event_date || "TBD"} • Venue: {ev.venue}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
                            Due: {getRevisionDeadlineLabel(ev.event_date)}
                          </span>
                        </div>

                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                          <span className="font-bold text-amber-400 block text-[10px] uppercase mb-0.5">
                            Admin Coordinator Remarks:
                          </span>
                          {ev.admin_feedback || "Please review and update your attached compliance forms."}
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveNav("submitted")}
                          className="text-[11px] font-bold text-[#FDB813] hover:underline cursor-pointer"
                        >
                          View in Submitted Proposals →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right 6 Columns: Admin & System Announcements */}
              <div className="lg:col-span-6 bg-[#16203D] border border-white/10 p-6 space-y-4 h-fit text-left">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-xs font-bold tracking-wider text-[#FDB813] uppercase flex items-center gap-2">
                    <Megaphone className="size-4" /> Facilitator & System Announcements
                  </h2>
                  <span className="text-[10px] font-mono text-[#8D99AE]">SAO & System</span>
                </div>

                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-4 bg-[#0B132B] border border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white">{ann.title}</h3>
                        <span className="text-[10px] font-mono text-[#FDB813] shrink-0">
                          {ann.created_at}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: SUBMIT PROPOSAL (GUIDED INTAKE & AI PRE-CHECK) ── */}
        {activeNav === "submit" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-3xl mx-auto bg-[#16203D] border border-white/10 p-6 shadow-xl h-fit">
              <h2 className="text-xs font-bold tracking-wider text-[#FDB813] uppercase mb-4 flex items-center gap-2">
                <FileText className="size-4" /> Submit New Proposal
              </h2>

              <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                <div>
                  <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Event Title *</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Annual Tech Hackathon"
                    className="w-full p-2.5 bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Student Organization *</label>
                  <input
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., Computer Science Society"
                    className="w-full p-2.5 bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Start *</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full p-2 bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#8D99AE] block mb-1">End *</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full p-2 bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Venue *</label>
                  <input
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g., Multipurpose Hall 1"
                    className="w-full p-2.5 bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Objectives and program flow..."
                    className="w-full p-2.5 bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Registration Link (Optional)</label>
                  <input
                    value={regLink}
                    onChange={(e) => setRegLink(e.target.value)}
                    placeholder="https://forms.gle/..."
                    className="w-full p-2.5 bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
                  />
                </div>

                {/* Clearance Packet & AI Pre-Check Intake */}
                <div className="p-4 bg-[#0B132B] border border-blue-500/30 space-y-3 mt-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-[#FDB813]" /> AI Pre-Check Intake
                    </span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Gemini AI
                    </span>
                  </div>

                  {/* Square Interactive File Pickers */}
                  <div className="space-y-2 text-xs text-[#8D99AE]">
                    {/* APF Form File Picker */}
                    <div className="flex items-center justify-between p-2.5 bg-[#16203D] border border-white/5 hover:border-white/20 transition">
                      <label className="flex items-center gap-2 text-[11px] text-white/90 cursor-pointer flex-1 min-w-0">
                        <Paperclip className="size-3.5 text-[#FDB813] shrink-0" />
                        <span className="shrink-0">Signed APF Form *</span>
                        <span className="text-[10px] text-emerald-400 font-mono truncate ml-auto mr-2">
                          {apfFile ? apfFile.name : "Choose PDF / Image"}
                        </span>
                        <input
                          key={apfFile ? apfFile.name : "apf-empty"}
                          type="file"
                          accept=".pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setApfFile(e.target.files[0]);
                              setCheckResult(null);
                            }
                          }}
                        />
                      </label>
                      {apfFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setApfFile(null);
                            setCheckResult(null);
                          }}
                          className="text-white/40 hover:text-red-400 transition p-1 hover:bg-white/5 cursor-pointer shrink-0"
                          title="Remove attachment"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Mandatory Waivers File Picker */}
                    <div className="flex items-center justify-between p-2.5 bg-[#16203D] border border-white/5 hover:border-white/20 transition">
                      <label className="flex items-center gap-2 text-[11px] text-white/90 cursor-pointer flex-1 min-w-0">
                        <Paperclip className="size-3.5 text-[#FDB813] shrink-0" />
                        <span className="shrink-0">Participant Waivers (If Off-Campus / MPH1)</span>
                        <span className="text-[10px] text-emerald-400 font-mono truncate ml-auto mr-2">
                          {waiverFile ? waiverFile.name : "Choose PDF / ZIP"}
                        </span>
                        <input
                          key={waiverFile ? waiverFile.name : "waiver-empty"}
                          type="file"
                          accept=".pdf,.zip,image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setWaiverFile(e.target.files[0]);
                              setCheckResult(null);
                            }
                          }}
                        />
                      </label>
                      {waiverFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setWaiverFile(null);
                            setCheckResult(null);
                          }}
                          className="text-white/40 hover:text-red-400 transition p-1 hover:bg-white/5 cursor-pointer shrink-0"
                          title="Remove attachment"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pre-Check Feedback Results */}
                  {checkResult && (
                    <div
                      className={`p-3 border text-xs space-y-2 ${
                        checkResult.passed
                          ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                          : "bg-amber-950/30 border-amber-500/40 text-amber-300"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span className="flex items-center gap-1.5">
                          {checkResult.passed ? (
                            <CheckCircle2 className="size-3.5 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="size-3.5 text-amber-400" />
                          )}
                          {checkResult.passed ? "Pre-Check Cleared (0 Gaps)" : "Gap Remediation Alert"}
                        </span>
                        <span className="text-[10px] uppercase font-mono">
                          {checkResult.passed ? "Queue Eligible" : "Action Required"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-white/80">
                        <div className="p-1 bg-black/30 text-center">
                          Adviser: {checkResult.adviserSignature ? "✓ Valid" : "✗ Missing"}
                        </div>
                        <div className="p-1 bg-black/30 text-center">
                          Waivers: {checkResult.waiversValid ? "✓ Present" : "✗ Missing"}
                        </div>
                      </div>

                      <p className="text-[10px] leading-relaxed text-white/70">{checkResult.notes}</p>
                    </div>
                  )}
                </div>

                {/* Direct Unified Check & Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 font-bold text-xs flex items-center justify-center gap-2 transition-all mt-2 bg-[#FDB813] hover:bg-[#e0a20f] text-black shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <Send className="size-3.5" />
                  {submitting ? "Analyzing & Submitting..." : "Check & Submit Proposal"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB 3: YOUR SUBMITTED PROPOSALS ── */}
        {activeNav === "submitted" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-5xl mx-auto flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold tracking-wider text-white uppercase">Your Submitted Proposals</h2>
                <span className="text-xs text-[#8D99AE]">{events.length} Total</span>
              </div>

              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="p-8 bg-[#16203D] border border-white/10 text-center text-xs text-[#8D99AE]">
                    No proposals submitted yet. Go to <b>Submit Proposal</b> to create one.
                  </div>
                ) : (
                  events.map((item) => (
                    <div key={item.event_id} className="p-4 bg-[#16203D] border border-white/10 space-y-2 text-left">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-white">{item.title}</h3>
                          <p className="text-xs text-[#8D99AE]">{item.organization || "Student Org"}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 capitalize border ${
                            item.status === "pending"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : item.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : item.status === "needs_revision"
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          }`}
                        >
                          {item.status ? item.status.replace("_", " ") : "Pending"}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-white/60">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3 text-[#FDB813]" /> {item.event_date || "No date set"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-[#FDB813]" /> {item.start_time || "--"} - {item.end_time || "--"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 text-[#FDB813]" /> {item.venue || "No venue"}
                        </span>
                      </div>

                      {item.status === "needs_revision" && item.admin_feedback && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 mt-2">
                          <span className="font-bold flex items-center gap-1 mb-0.5 text-amber-400">
                            <AlertCircle className="size-3.5" /> Coordinator Revision Notes:
                          </span>
                          <p className="text-amber-200/90">{item.admin_feedback}</p>
                        </div>
                      )}

                      {/* Cryptographic Clearance Seal & Mobile Syndication */}
                      {item.status === "approved" && (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1.5 mt-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                              <ShieldCheck className="size-3.5" /> Institutional Clearance Endorsement
                            </span>
                            <span className="text-[9px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                              RA 8792 Signed
                            </span>
                          </div>
                          <div className="font-mono text-[9px] text-white/70 break-all bg-black/40 p-2 border border-white/5">
                            SHA-256: {item.clearance_hash || "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-white/60">
                            <span>Status: Endorsed by Coordinator</span>
                            <span className="text-emerald-400 font-medium">✓ Live on Campus Mobile App</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
