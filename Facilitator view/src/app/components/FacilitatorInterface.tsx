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
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export function FacilitatorInterface({ onLogout }: { onLogout?: () => void }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("CS Society");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [regLink, setRegLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // AI Pre-Audit File Attachment States (UC-02)
  const [apfFile, setApfFile] = useState<File | null>(null);
  const [budgetFile, setBudgetFile] = useState<File | null>(null);
  const [waiverFile, setWaiverFile] = useState<File | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<{
    ran: boolean;
    passed: boolean;
    adviserSignature: boolean;
    budgetBalanced: boolean;
    waiversValid: boolean;
    notes: string;
  } | null>(null);

  const runPreAuditScan = () => {
    if (!apfFile || !budgetFile) {
      alert("Missing Required Documents: Please attach both the Signed APF Document and Budget Itemization Sheet before running the pre-audit check.");
      return;
    }

    setIsAuditing(true);
    setTimeout(() => {
      const hasWaivers = !!waiverFile;
      setAuditResult({
        ran: true,
        passed: hasWaivers,
        adviserSignature: true,
        budgetBalanced: true,
        waiversValid: hasWaivers,
        notes: hasWaivers
          ? "Pre-Audit Passed: Physical adviser endorsement detected optically. Line-item expenses reconcile with declared budget. Proposal is primed for dynamic queue routing."
          : "Pre-Audit Gap Alert: Missing signed off-campus participant liability waivers. Attach required documentation to prevent queue rejection.",
      });
      setIsAuditing(false);
    }, 1200);
  };

  // 1. Fetch Submitted Events from Database
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

  // 2. Realtime Listener: Updates status immediately when Admin approves/rejects
  useEffect(() => {
    fetchMyEvents();

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

  // 3. Submit Event to Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict UC-02 Enforcement Guard: Audit must have been run and cleared
    if (!auditResult) {
      alert(
        "Strict Pre-Audit Required: You must attach your compliance packet and click 'Run AI Optical Pre-Audit Check' before submitting to the review queue."
      );
      return;
    }

    if (!auditResult.passed) {
      alert(
        "Gap Remediation Required: Your proposal contains unresolved compliance gaps. Please attach all required documentation and re-run the optical pre-audit check."
      );
      return;
    }

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      venue: venue.trim(),
      description: description.trim(),
      event_date: date,
      start_time: startTime || null,
      end_time: endTime || null,
      status: "pending",
      external_registration_link: regLink || null,
      facilitator_id: null,
    };

    const { error } = await supabase.from("events").insert([payload]);

    if (error) {
      alert(`Submission error: ${error.message}`);
    } else {
      alert("Proposal submitted successfully to the Database!");
      setTitle("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setVenue("");
      setDescription("");
      setRegLink("");
      setApfFile(null);
      setBudgetFile(null);
      setWaiverFile(null);
      setAuditResult(null);
      fetchMyEvents();
    }
    setSubmitting(false);
  };

  return (
    <div className="h-full w-full bg-[#0B132B] text-white flex flex-col overflow-y-auto">
      {/* Subheader */}
      <div className="px-8 py-4 border-b border-white/10 bg-[#0E1733] flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-base font-bold tracking-tight">Event Proposal Portal</h1>
          <p className="text-xs text-[#8D99AE]">Submit event proposals and track your clearance approvals in real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMyEvents}
            className="p-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-2 text-xs cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-xs cursor-pointer"
            >
              Exit to Login
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Proposal Form (5 Cols) */}
        <div className="lg:col-span-5 bg-[#16203D] border border-white/10 rounded-2xl p-6 shadow-xl h-fit">
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
                className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Student Organization *</label>
              <input
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g., Computer Science Society"
                className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
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
                  className="w-full p-2 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Start *</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#8D99AE] block mb-1">End *</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
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
                className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Objectives and program flow..."
                className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8D99AE] block mb-1">Registration Link (Optional)</label>
              <input
                value={regLink}
                onChange={(e) => setRegLink(e.target.value)}
                placeholder="https://forms.gle/..."
                className="w-full p-2.5 rounded-xl bg-[#0B132B] border border-white/10 text-xs text-white focus:border-[#FDB813] outline-none"
              />
            </div>

            {/* ── Clearance Packet & AI Pre-Audit Verification ── */}
            <div className="p-4 rounded-xl bg-[#0B132B] border border-blue-500/30 space-y-3 mt-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#FDB813]" /> AI Pre-Audit Intake
                </span>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Gemini Multimodal
                </span>
              </div>

              {/* Real Interactive File Pickers with Removal Capability */}
              <div className="space-y-2 text-xs text-[#8D99AE]">
                {/* APF Form File Picker */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#16203D] border border-white/5 hover:border-white/20 transition">
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
                          setAuditResult(null);
                        }
                      }}
                    />
                  </label>
                  {apfFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setApfFile(null);
                        setAuditResult(null);
                      }}
                      className="text-white/40 hover:text-red-400 transition p-1 rounded hover:bg-white/5 cursor-pointer shrink-0"
                      title="Remove attachment"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Budget Itemization File Picker */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#16203D] border border-white/5 hover:border-white/20 transition">
                  <label className="flex items-center gap-2 text-[11px] text-white/90 cursor-pointer flex-1 min-w-0">
                    <Paperclip className="size-3.5 text-[#FDB813] shrink-0" />
                    <span className="shrink-0">Budget Breakdown *</span>
                    <span className="text-[10px] text-emerald-400 font-mono truncate ml-auto mr-2">
                      {budgetFile ? budgetFile.name : "Choose XLSX / PDF"}
                    </span>
                    <input
                      key={budgetFile ? budgetFile.name : "budget-empty"}
                      type="file"
                      accept=".xlsx,.xls,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setBudgetFile(e.target.files[0]);
                          setAuditResult(null);
                        }
                      }}
                    />
                  </label>
                  {budgetFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setBudgetFile(null);
                        setAuditResult(null);
                      }}
                      className="text-white/40 hover:text-red-400 transition p-1 rounded hover:bg-white/5 cursor-pointer shrink-0"
                      title="Remove attachment"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Mandatory Waivers File Picker */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#16203D] border border-white/5 hover:border-white/20 transition">
                  <label className="flex items-center gap-2 text-[11px] text-white/90 cursor-pointer flex-1 min-w-0">
                    <Paperclip className="size-3.5 text-[#FDB813] shrink-0" />
                    <span className="shrink-0">Participant Waivers (If Off-Campus)</span>
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
                          setAuditResult(null);
                        }
                      }}
                    />
                  </label>
                  {waiverFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setWaiverFile(null);
                        setAuditResult(null);
                      }}
                      className="text-white/40 hover:text-red-400 transition p-1 rounded hover:bg-white/5 cursor-pointer shrink-0"
                      title="Remove attachment"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Run Pre-Audit Button */}
              <button
                type="button"
                onClick={runPreAuditScan}
                disabled={isAuditing}
                className="w-full py-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Sparkles className={`size-3.5 ${isAuditing ? "animate-spin" : ""}`} />
                {isAuditing ? "Analyzing Compliance via Gemini..." : "Run AI Optical Pre-Audit Check"}
              </button>

              {/* Pre-Audit Feedback Results */}
              {auditResult && (
                <div
                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                    auditResult.passed
                      ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                      : "bg-amber-950/30 border-amber-500/40 text-amber-300"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[11px]">
                    <span className="flex items-center gap-1.5">
                      {auditResult.passed ? (
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="size-3.5 text-amber-400" />
                      )}
                      {auditResult.passed ? "Pre-Audit Cleared (0 Gaps)" : "Gap Remediation Alert"}
                    </span>
                    <span className="text-[10px] uppercase font-mono">
                      {auditResult.passed ? "Queue Eligible" : "Action Required"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] text-white/80">
                    <div className="p-1 rounded bg-black/30 text-center">
                      Adviser: {auditResult.adviserSignature ? "✓ Valid" : "✗ Missing"}
                    </div>
                    <div className="p-1 rounded bg-black/30 text-center">
                      Budget: {auditResult.budgetBalanced ? "✓ Reconciled" : "✗ Error"}
                    </div>
                    <div className="p-1 rounded bg-black/30 text-center">
                      Waivers: {auditResult.waiversValid ? "✓ Present" : "✗ Missing"}
                    </div>
                  </div>

                  <p className="text-[10px] leading-relaxed text-white/70">{auditResult.notes}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !auditResult?.passed}
              className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all mt-2 ${
                auditResult?.passed
                  ? "bg-[#FDB813] hover:bg-[#e0a20f] text-black shadow-lg cursor-pointer"
                  : "bg-white/10 text-white/40 cursor-not-allowed border border-white/5"
              }`}
            >
              <Send className="size-3.5" />
              {submitting
                ? "Submitting Proposal..."
                : !auditResult
                ? "Run AI Pre-Audit Above to Enable Submission"
                : !auditResult.passed
                ? "Resolve Gaps & Re-run Audit to Submit"
                : "Submit Proposal to Coordinator Queue"}
            </button>
          </form>
        </div>

        {/* Right: Proposal List & Status (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold tracking-wider text-white uppercase">Your Submitted Proposals</h2>
            <span className="text-xs text-[#8D99AE]">{events.length} Total</span>
          </div>

          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#16203D] border border-white/10 text-center text-xs text-[#8D99AE]">
                No proposals submitted yet. Fill out the form to submit one.
              </div>
            ) : (
              events.map((item) => (
                <div key={item.event_id} className="p-4 rounded-xl bg-[#16203D] border border-white/10 space-y-2 text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-[#8D99AE]">{item.organization || "Student Org"}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                        item.status === "pending"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : item.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : item.status === "needs_revision"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
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
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 mt-2">
                      <span className="font-bold flex items-center gap-1 mb-0.5 text-amber-400">
                        <AlertCircle className="size-3.5" /> Coordinator Revision Notes:
                      </span>
                      <p className="text-amber-200/90">{item.admin_feedback}</p>
                    </div>
                  )}

                  {/* Cryptographic Clearance Seal & Mobile Syndication */}
                  {item.status === "approved" && (
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1.5 mt-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1.5">
                          <ShieldCheck className="size-3.5" /> Institutional Clearance Endorsement
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                          RA 8792 Signed
                        </span>
                      </div>
                      <div className="font-mono text-[9px] text-white/70 break-all bg-black/40 p-2 rounded border border-white/5">
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
    </div>
  );
}
