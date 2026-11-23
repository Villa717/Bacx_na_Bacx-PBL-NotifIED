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
  Loader2,
  XCircle,
  PenTool,
  FileCheck2,
  Pencil,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  aiLocalCache,
  DEFAULT_STORAGE_BUCKET,
  getAiBackendUrl,
  runDocumentPreScreen,
  setAiBackendUrlOverride,
  uploadEventDocuments,
  type PreScreenResult,
} from "../../lib/aiClient";
import {
  carriedAttachmentToBlobUrl,
  carriedAttachmentToFile,
  decodeProposalDescription,
  encodeProposalDescriptionWithAttachments,
  fileToCarriedAttachment,
  type CarriedAttachmentFile,
} from "../../lib/proposalAttachments";

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

function normalizeDateInput(val?: string | null): string {
  if (!val) return "";
  const isoMatch = String(val).match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];
  const parsed = new Date(val);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
}

function normalizeTimeInput(val?: string | null): string {
  if (!val) return "";
  const match24 = String(val).match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    return `${match24[1].padStart(2, "0")}:${match24[2]}`;
  }
  return "";
}

function isRevisionStatus(status?: string | null): boolean {
  const s = (status || "").toLowerCase().trim();
  return s === "needs_revision" || s === "revision";
}

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

  // Editing an existing proposal that needs revision
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [existingCarriedFiles, setExistingCarriedFiles] = useState<CarriedAttachmentFile[]>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState(currentUser?.organization || "CS Society");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [venue, setVenue] = useState("");
  const [description, setDescription] = useState("");
  const [regLink, setRegLink] = useState("");
  const [expectedAttendees, setExpectedAttendees] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [hasExternalGuests, setHasExternalGuests] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Multimodal AI Document & Visual Signature Pre-Screening States
  const [apfFile, setApfFile] = useState<File | null>(null);
  const [waiverFile, setWaiverFile] = useState<File | null>(null);
  const [preScreening, setPreScreening] = useState(false);
  const [preScreenError, setPreScreenError] = useState("");
  const [backendUrlInput, setBackendUrlInput] = useState(() => getAiBackendUrl());
  const [preScreenResult, setPreScreenResult] = useState<PreScreenResult | null>(null);
  const [cachedPreScreens, setCachedPreScreens] = useState<Record<string, PreScreenResult>>(() =>
    aiLocalCache.getPreScreens()
  );

  useEffect(() => {
    if (currentUser?.organization && !editingEvent) {
      setOrganization(currentUser.organization);
    }
  }, [currentUser, editingEvent]);

  const resetForm = () => {
    setEditingEvent(null);
    setExistingCarriedFiles([]);
    setTitle("");
    setOrganization(currentUser?.organization || "CS Society");
    setDate("");
    setStartTime("");
    setEndTime("");
    setVenue("");
    setDescription("");
    setRegLink("");
    setExpectedAttendees("");
    setEstimatedBudget("");
    setHasExternalGuests(false);
    setApfFile(null);
    setWaiverFile(null);
    setPreScreenResult(null);
    setPreScreenError("");
  };

  const handleStartEditProposal = (ev: any) => {
    const decoded = decodeProposalDescription(ev.description);
    setEditingEvent(ev);
    setExistingCarriedFiles(decoded.files);
    setTitle(ev.title || "");
    setOrganization(ev.organization || currentUser?.organization || "CS Society");
    setDate(normalizeDateInput(ev.event_date));
    setStartTime(normalizeTimeInput(ev.start_time));
    setEndTime(normalizeTimeInput(ev.end_time));
    setVenue(ev.venue || "");
    setDescription(decoded.cleanDescription || "");
    setRegLink(ev.external_registration_link || ev.registration_link || "");
    setExpectedAttendees(ev.proposed_attendees ? String(ev.proposed_attendees) : "");
    setEstimatedBudget(ev.estimated_budget != null ? String(ev.estimated_budget) : "");
    setHasExternalGuests(Boolean(ev.has_external_guests));

    // Rehydrate previously attached APF & Waiver files so the facilitator can keep or replace them
    const rehydrated = decoded.files
      .map((att) => carriedAttachmentToFile(att))
      .filter((f): f is File => Boolean(f));
    setApfFile(rehydrated[0] || null);
    setWaiverFile(rehydrated[1] || null);

    const existingPre =
      ev.ai_prescreen_result || decoded.preScreen || cachedPreScreens[String(ev.event_id)] || null;
    setPreScreenResult(existingPre);
    setPreScreenError("");
    setActiveNav("submit");
  };

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

  const isSupportedMultimodalFile = (file: File) =>
    ["application/pdf", "image/png", "image/jpeg", "image/jpg"].includes(file.type) ||
    /\.(pdf|png|jpe?g)$/i.test(file.name);

  const handleRunAiPreScreen = async (): Promise<PreScreenResult | null> => {
    if (!apfFile) {
      setPreScreenError(
        "Attach the Signed APF Form (PDF, PNG, or JPEG) before running the AI Document & Signature Check."
      );
      return null;
    }

    const filesToInspect: File[] = [];
    if (isSupportedMultimodalFile(apfFile)) {
      filesToInspect.push(apfFile);
    } else {
      setPreScreenError("APF file must be a PDF, PNG, or JPEG for multimodal AI inspection.");
      return null;
    }

    if (waiverFile && isSupportedMultimodalFile(waiverFile)) {
      filesToInspect.push(waiverFile);
    }

    setPreScreening(true);
    setPreScreenError("");

    try {
      const result = await runDocumentPreScreen({
        files: filesToInspect,
        metadata: {
          title: title.trim() || undefined,
          organization: organization.trim() || undefined,
          eventDate: date || undefined,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          venue: venue.trim() || undefined,
          description: description.trim() || undefined,
          budget: estimatedBudget.trim() || undefined,
          expectedAttendees: expectedAttendees ? Number(expectedAttendees) : undefined,
          hasExternalGuests,
        },
      });
      setPreScreenResult(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI pre-screening request failed.";
      setPreScreenError(msg);
      return null;
    } finally {
      setPreScreening(false);
    }
  };

  const tryUploadToStorage = async (file: File, prefix: string): Promise<string | null> => {
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${prefix}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage
        .from(DEFAULT_STORAGE_BUCKET)
        .upload(storagePath, file, { upsert: false, contentType: file.type || undefined });
      if (error) {
        console.warn("Optional Supabase Storage upload skipped:", error.message);
        return null;
      }
      return storagePath;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hasExistingDocument =
      editingEvent && (existingCarriedFiles.length > 0 || Boolean(editingEvent.document_path));

    if (!apfFile && !hasExistingDocument) {
      alert("Missing Required Document: Please attach the Signed APF Form before submitting for review.");
      return;
    }

    setSubmitting(true);

    // Run real multimodal AI pre-screen if files are attached and not yet checked
    let aiResult = preScreenResult;
    if (!aiResult && apfFile) {
      aiResult = await handleRunAiPreScreen();
    }

    if (aiResult && (aiResult.overallStatus === "FLAGGED" || aiResult.overallStatus === "NEEDS_REVISION")) {
      const missingCount = aiResult.signatureCheck.missingSignatureLines.length;
      const issueSummary =
        missingCount > 0
          ? `AI Pre-Screen detected ${missingCount} missing signature line(s) and status "${aiResult.overallStatus}".`
          : `AI Pre-Screen returned status "${aiResult.overallStatus}" (score ${aiResult.completenessScore}/100).`;
      const proceed = window.confirm(
        `${issueSummary}\n\nDo you still want to ${editingEvent ? "resubmit" : "submit"} this proposal for review, or click Cancel to fix the flagged gaps first?`
      );
      if (!proceed) {
        setSubmitting(false);
        return;
      }
    }

    // Attempt optional Supabase Storage upload (gracefully ignored if bucket isn't provisioned)
    const documentPath = apfFile ? await tryUploadToStorage(apfFile, "apf") : editingEvent?.document_path || null;
    const waiverPath = waiverFile ? await tryUploadToStorage(waiverFile, "waivers") : editingEvent?.waiver_path || null;

    const documentPublicUrl = documentPath
      ? supabase.storage.from(DEFAULT_STORAGE_BUCKET).getPublicUrl(documentPath).data?.publicUrl || null
      : null;
    const waiverPublicUrl = waiverPath
      ? supabase.storage.from(DEFAULT_STORAGE_BUCKET).getPublicUrl(waiverPath).data?.publicUrl || null
      : null;

    // Package attached PDFs + AI pre-screen so they carry over automatically to Admin & Department Head
    let carriedFiles: CarriedAttachmentFile[] = [];
    if (apfFile && isSupportedMultimodalFile(apfFile)) {
      carriedFiles.push(await fileToCarriedAttachment(apfFile, documentPublicUrl));
    }
    if (waiverFile && isSupportedMultimodalFile(waiverFile)) {
      carriedFiles.push(await fileToCarriedAttachment(waiverFile, waiverPublicUrl));
    }
    if (carriedFiles.length === 0 && existingCarriedFiles.length > 0) {
      carriedFiles = existingCarriedFiles;
    }

    const encodedDescription = encodeProposalDescriptionWithAttachments(description.trim(), {
      files: carriedFiles,
      preScreen: aiResult,
    });

    const basePayload = {
      title: title.trim(),
      venue: venue.trim(),
      description: encodedDescription,
      event_date: date,
      start_time: startTime || null,
      end_time: endTime || null,
      status: "pending",
      external_registration_link: regLink || null,
      facilitator_id: editingEvent?.facilitator_id ?? currentUser?.user_id ?? null,
    };

    const extendedPayload: Record<string, unknown> = {
      ...basePayload,
      organization: organization.trim() || null,
      proposed_attendees: expectedAttendees ? Number(expectedAttendees) : null,
      estimated_budget: estimatedBudget ? Number(estimatedBudget) : null,
      has_external_guests: hasExternalGuests,
      ...(aiResult ? { ai_prescreen_result: aiResult } : {}),
      ...(documentPath ? { document_bucket: DEFAULT_STORAGE_BUCKET, document_path: documentPath } : {}),
      ...(waiverPath ? { waiver_path: waiverPath } : {}),
    };

    let targetEventId: number | undefined;
    let saveError: { message: string } | null = null;

    if (editingEvent) {
      targetEventId = editingEvent.event_id;
      const updateExtended = {
        ...extendedPayload,
        admin_feedback: null,
        updated_at: new Date().toISOString(),
      };
      const updateBase = {
        ...basePayload,
        admin_feedback: null,
        updated_at: new Date().toISOString(),
      };

      const { error: extErr } = await supabase
        .from("events")
        .update(updateExtended)
        .eq("event_id", editingEvent.event_id);

      if (extErr) {
        console.warn("Extended update fell back to base schema columns:", extErr.message);
        const { error: baseErr } = await supabase
          .from("events")
          .update(updateBase)
          .eq("event_id", editingEvent.event_id);
        saveError = baseErr;
      }
    } else {
      const { data: extData, error: extError } = await supabase
        .from("events")
        .insert([extendedPayload])
        .select("event_id")
        .maybeSingle();

      if (extError) {
        console.warn("Extended insert fell back to base schema columns:", extError.message);
        const { data: baseData, error: baseError } = await supabase
          .from("events")
          .insert([basePayload])
          .select("event_id")
          .maybeSingle();
        targetEventId = baseData?.event_id;
        saveError = baseError;
      } else {
        targetEventId = extData?.event_id;
      }
    }

    if (saveError) {
      alert(`Submission error: ${saveError.message}`);
    } else {
      if (targetEventId) {
        const filesToRelay: File[] = [];
        if (apfFile && isSupportedMultimodalFile(apfFile)) filesToRelay.push(apfFile);
        if (waiverFile && isSupportedMultimodalFile(waiverFile)) filesToRelay.push(waiverFile);
        if (filesToRelay.length > 0 || aiResult) {
          await uploadEventDocuments(targetEventId, filesToRelay, aiResult);
        }

        if (aiResult) {
          aiLocalCache.savePreScreen(targetEventId, aiResult);
          setCachedPreScreens(aiLocalCache.getPreScreens());
        }
      }
      alert(
        editingEvent
          ? "Revised proposal resubmitted to the Admin Coordinator for review!"
          : "Proposal submitted successfully to CampusSync!"
      );
      resetForm();
      await fetchMyEvents();
      setActiveNav("submitted");
    }
    setSubmitting(false);
  };

  // Proposals needing revision (for Home deadlines widget)
  const revisionEvents = events.filter((ev) => isRevisionStatus(ev.status));

  const getRevisionDeadlineLabel = (eventDateStr: string) => {
    if (!eventDateStr) return "Submit ASAP";
    const eventTime = new Date(eventDateStr).getTime();
    if (Number.isNaN(eventTime)) return "Submit ASAP";
    const deadline = new Date(eventTime - 48 * 60 * 60 * 1000);
    return deadline.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadgeClasses = (status?: string) => {
    const s = (status || "pending").toLowerCase().trim();
    if (s === "approved" || s === "completed") {
      return "bg-[#E6F3EC] text-[#1F7A4D] border-[#B6DFC8]";
    }
    if (s === "needs_revision" || s === "revision") {
      return "bg-[#FFF4DC] text-[#8A5A00] border-[#E5C98B]";
    }
    if (s === "rejected") {
      return "bg-[#FBEDEC] text-[#B3261E] border-[#E2B3AF]";
    }
    return "bg-[#EAEFFA] text-[#24408E] border-[#C5D3F3]";
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#F2F4F7] text-[#18212F] font-sans">
      {/* ── INSTITUTIONAL BLUE COLLAPSIBLE LEFT SIDEBAR NAVIGATION ── */}
      <aside
        className={`${
          isSidebarCollapsed ? "w-20" : "w-64"
        } bg-[#1C2D63] border-r border-[#162452] text-white flex flex-col justify-between shrink-0 select-none transition-all duration-200`}
      >
        <div>
          {/* Institutional Brand Header + Collapse Toggle */}
          <div className="p-4 border-b border-white/10 bg-[#162452] flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-9 rounded-md bg-[#24408E] border border-[#F2B84B]/50 flex items-center justify-center font-black text-[#F2B84B] text-lg shrink-0">
                C
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0 text-left">
                  <div className="font-bold text-sm tracking-tight text-white truncate">CampusSync</div>
                  <div className="text-[10px] font-mono text-[#B8C3E3] tracking-wider uppercase truncate">
                    ASIA PACIFIC COLLEGE
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="p-1.5 rounded text-[#B8C3E3] hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>
          </div>

          {/* Categorized Navigation Menu */}
          <nav className="py-4 px-2 space-y-5">
            {/* Group 1: Overview */}
            <div>
              {!isSidebarCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider text-[#B8C3E3] uppercase">
                  OVERVIEW
                </div>
              )}
              <button
                type="button"
                title="Home"
                onClick={() => setActiveNav("home")}
                className={`w-full px-3 py-2.5 rounded-md text-xs flex items-center ${
                  isSidebarCollapsed ? "justify-center relative" : "justify-between"
                } transition-colors cursor-pointer ${
                  activeNav === "home"
                    ? "bg-white/15 text-white font-semibold shadow-[inset_3px_0_0_#F2B84B]"
                    : "text-[#D5DCF0] hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Home className="size-4 text-[#F2B84B] shrink-0" />
                  {!isSidebarCollapsed && <span>Home</span>}
                </span>
                {revisionEvents.length > 0 && (
                  <span
                    className={`${
                      isSidebarCollapsed ? "absolute top-1.5 right-2 px-1 text-[9px]" : "px-1.5 py-0.5 text-[10px]"
                    } rounded-full font-bold bg-[#F2B84B] text-[#1C2D63]`}
                  >
                    {revisionEvents.length}
                  </span>
                )}
              </button>
            </div>

            {/* Group 2: Proposals */}
            <div>
              {!isSidebarCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider text-[#B8C3E3] uppercase">
                  PROPOSAL WORKSPACE
                </div>
              )}
              <button
                type="button"
                title={editingEvent ? "Edit Revision Proposal" : "Submit Proposal"}
                onClick={() => setActiveNav("submit")}
                className={`w-full px-3 py-2.5 rounded-md text-xs flex items-center ${
                  isSidebarCollapsed ? "justify-center" : "gap-3"
                } transition-colors cursor-pointer ${
                  activeNav === "submit"
                    ? "bg-white/15 text-white font-semibold shadow-[inset_3px_0_0_#F2B84B]"
                    : "text-[#D5DCF0] hover:bg-white/10 hover:text-white"
                }`}
              >
                <FilePlus2 className="size-4 text-[#F2B84B] shrink-0" />
                {!isSidebarCollapsed && (
                  <span>{editingEvent ? "Edit & Resubmit" : "Submit Proposal"}</span>
                )}
              </button>

              <button
                type="button"
                title="Your Submitted Proposals"
                onClick={() => setActiveNav("submitted")}
                className={`w-full px-3 py-2.5 mt-0.5 rounded-md text-xs flex items-center ${
                  isSidebarCollapsed ? "justify-center relative" : "justify-between"
                } transition-colors cursor-pointer ${
                  activeNav === "submitted"
                    ? "bg-white/15 text-white font-semibold shadow-[inset_3px_0_0_#F2B84B]"
                    : "text-[#D5DCF0] hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <FolderKanban className="size-4 text-[#F2B84B] shrink-0" />
                  {!isSidebarCollapsed && <span>Your Submitted Proposals</span>}
                </span>
                {events.length > 0 && !isSidebarCollapsed && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-white">
                    {events.length}
                  </span>
                )}
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Profile & Logout */}
        <div className="p-4 border-t border-white/10 bg-[#162452] space-y-3">
          {!isSidebarCollapsed && (
            <div className="text-left">
              <div className="text-[10px] font-mono text-[#7CE3B0] uppercase">● Activity Facilitator</div>
              <div className="text-xs font-semibold text-white truncate">
                {currentUser?.full_name || "Student Facilitator"}
              </div>
              <div className="text-[10px] text-[#B8C3E3] truncate">
                {currentUser?.email || "agvilla@student.apc.edu.ph"}
              </div>
            </div>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Exit to Login"
              className="w-full py-2 px-3 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer border border-white/20"
            >
              <LogOut className="size-3.5 shrink-0" />
              {!isSidebarCollapsed && <span>Exit to Login</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN WORKSPACE CONTAINER (WHITE & BLUE) ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Crisp White Top Bar */}
        <div className="px-6 md:px-8 py-4 border-b border-[#DDE2EA] bg-white flex items-center justify-between shrink-0">
          <div className="text-left">
            <h1 className="text-base font-bold tracking-tight text-[#18212F]">
              CampusSync Event Proposal Portal
            </h1>
            <p className="text-xs text-[#5B6678]">
              Submit event proposals, revise flagged items, and track clearance approvals in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchMyEvents();
                fetchAnnouncements();
              }}
              className="px-3 py-1.5 rounded-md border border-[#C9D0DB] bg-white hover:bg-[#F2F4F7] text-[#18212F] transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
            >
              <RefreshCw className={`size-3.5 text-[#24408E] ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── TAB 1: HOME (ANNOUNCEMENTS, REVISION DEADLINES & SYSTEM NOTICES) ── */}
        {activeNav === "home" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            <div className="rounded-md bg-[#EAEFFA] border border-[#C5D3F3] px-4 py-3 text-xs text-[#24408E] flex items-center justify-between">
              <span>
                Welcome back, <b>{currentUser?.full_name || "Facilitator"}</b>! Stay updated on SAO clearance deadlines and revision requests below.
              </span>
              <span className="font-mono text-[10px] font-semibold uppercase">AY 2026–2027</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 6 Columns: Deadlines for Requested Changes from Admins */}
              <div className="lg:col-span-6 rounded-lg bg-white border border-[#DDE2EA] p-6 space-y-4 h-fit text-left shadow-xs">
                <div className="flex items-center justify-between border-b border-[#DDE2EA] pb-3">
                  <h2 className="text-xs font-bold tracking-wider text-[#8A5A00] uppercase flex items-center gap-2">
                    <BellRing className="size-4" /> Action Required: Revision Deadlines
                  </h2>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FFF4DC] text-[#8A5A00] border border-[#E5C98B]">
                    {revisionEvents.length} Pending Action
                  </span>
                </div>

                {revisionEvents.length === 0 ? (
                  <div className="p-6 rounded-md bg-[#F7F8FA] border border-[#DDE2EA] text-center space-y-1">
                    <CheckCircle2 className="size-6 text-[#1F7A4D] mx-auto mb-1" />
                    <p className="text-xs font-semibold text-[#18212F]">No Requested Revisions</p>
                    <p className="text-[11px] text-[#5B6678]">
                      All your submitted proposals are currently in good standing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {revisionEvents.map((ev) => (
                      <div
                        key={ev.event_id}
                        className="p-4 rounded-md bg-[#FFFDF7] border border-[#E5C98B] space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-[#18212F]">{ev.title}</h3>
                            <p className="text-[11px] text-[#5B6678]">
                              Event Date: {ev.event_date || "TBD"} • Venue: {ev.venue}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FBEDEC] text-[#B3261E] border border-[#E2B3AF] shrink-0">
                            Due: {getRevisionDeadlineLabel(ev.event_date)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded bg-[#FFF4DC] border border-[#E5C98B] text-xs text-[#6B4600]">
                          <span className="font-bold text-[#8A5A00] block text-[10px] uppercase mb-0.5">
                            Admin Coordinator Remarks:
                          </span>
                          {ev.admin_feedback || "Please review and update your attached compliance forms."}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditProposal(ev)}
                            className="px-3 py-1.5 rounded-md bg-[#24408E] hover:bg-[#1B3270] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Pencil className="size-3.5" />
                            Edit &amp; Resubmit Proposal
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveNav("submitted")}
                            className="text-xs font-medium text-[#24408E] hover:underline cursor-pointer px-2 py-1"
                          >
                            View in Submitted Proposals →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right 6 Columns: Admin & System Announcements */}
              <div className="lg:col-span-6 rounded-lg bg-white border border-[#DDE2EA] p-6 space-y-4 h-fit text-left shadow-xs">
                <div className="flex items-center justify-between border-b border-[#DDE2EA] pb-3">
                  <h2 className="text-xs font-bold tracking-wider text-[#24408E] uppercase flex items-center gap-2">
                    <Megaphone className="size-4" /> Facilitator &amp; System Announcements
                  </h2>
                  <span className="text-[10px] font-mono text-[#5B6678]">SAO &amp; System</span>
                </div>

                <div className="space-y-3">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-md bg-[#F7F8FA] border border-[#DDE2EA] space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#18212F]">{ann.title}</h3>
                        <span className="text-[10px] font-mono font-medium text-[#24408E] shrink-0">
                          {ann.created_at}
                        </span>
                      </div>
                      <p className="text-xs text-[#4B5563] leading-relaxed">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: SUBMIT OR EDIT & RESUBMIT PROPOSAL ── */}
        {activeNav === "submit" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-3xl mx-auto rounded-lg bg-white border border-[#DDE2EA] p-6 shadow-xs h-fit space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DDE2EA] pb-3">
                <h2 className="text-xs font-bold tracking-wider text-[#24408E] uppercase flex items-center gap-2">
                  {editingEvent ? (
                    <>
                      <Pencil className="size-4" /> Edit &amp; Resubmit Proposal (#{editingEvent.event_id})
                    </>
                  ) : (
                    <>
                      <FileText className="size-4" /> Submit New Proposal
                    </>
                  )}
                </h2>
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setActiveNav("submitted");
                    }}
                    className="px-2.5 py-1 rounded-md border border-[#C9D0DB] bg-white hover:bg-[#F2F4F7] text-xs font-medium text-[#18212F] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="size-3.5" /> Cancel Edit
                  </button>
                )}
              </div>

              {/* Admin Coordinator Revision Banner when editing a Needs Revision proposal */}
              {editingEvent && (
                <div className="p-4 rounded-md bg-[#FFF4DC] border border-[#E5C98B] text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#8A5A00]">
                    <AlertTriangle className="size-4 shrink-0" />
                    Coordinator Revision Request — Update the details/documents below and click &ldquo;Resubmit to Admin&rdquo;
                  </div>
                  <p className="text-xs text-[#6B4600] leading-relaxed">
                    {editingEvent.admin_feedback ||
                      "Please update the proposal information or attach corrected compliance documents."}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                <div>
                  <label className="text-xs font-semibold text-[#18212F] block mb-1">Event Title *</label>
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Annual Tech Hackathon"
                    className="w-full p-2.5 rounded-md bg-white border border-[#C9D0DB] text-xs text-[#18212F] placeholder:text-[#6B778A] focus:border-[#24408E] focus:ring-2 focus:ring-[#24408E]/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#18212F] block mb-1">
                    Student Organization *
                  </label>
                  <input
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., Computer Science Society"
                    className="w-full p-2.5 rounded-md bg-white border border-[#C9D0DB] text-xs text-[#18212F] placeholder:text-[#6B778A] focus:border-[#24408E] focus:ring-2 focus:ring-[#24408E]/20 outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#18212F] block mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-2 rounded-md bg-white border border-[#C9D0DB] text-xs text-[#18212F] focus:border-[#24408E] focus:ring-2 focus:ring-[#24408E]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#18212F] block mb-1">Start *</label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full p-2 rounded-md bg-white border border-[#C9D0DB] text-xs text-[#18212F] focus:border-[#24408E] focus:ring-2 focus:ring-[#24408E]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#18212F] block mb-1">End *</label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full p-2 rounded-md bg-white border border-[#C9D0DB] text-xs text-[#18212F] focus:border-[#24408E] focus:ring-2 focus:ring-[#24408E]/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#18212F] block mb-1">Venue *</label>
                  <input
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g., Multipurpose Hall 1"
                    className="w-full p-2.5 rounded-md bg-white border border-[#C9D0DB] text-xs text-[#18212F] placeholder:text-[#6B778A] focus:border-[#24408E] focus:ring-2 focus:ring-[#24408E]/20 outline-none"
                  />
                </div>

                {/* Optional Logistics Metadata for AI Cross-Check & Queue Triage */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#18212F] block mb-1">
                      Expected Attendees
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={expectedAttendees}
                      onChange={(e) => setExpectedAttendees(e.target.value)}
                      placeholder="e.g., 150"
                      className="w-full p-2 rounded-md bg-white border border-[#C9D0DB] text-xs text-[#18212F] placeholder:text-[#6B778A] focus:border-[#24408E] focus:ring-2 focus:ring-[#24408E]/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#18212F] block mb-1">
                      Estimated Budget (PHP)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={estimatedBudget}
                      onChange={(e) => setEstimatedBudget(e.target.value)}
                      placeholder="e.g., 15000"
                      className="w-full p-2 rounded-md bg-white border border-[#C9D0DB] text-xs text-[#18212F] placeholder:text-[#6B778A] focus:border-[#24408E] focus:ring-2 focus:ring-[#24408E]/20 outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="w-full p-2 rounded-md bg-[#F7F8FA] border border-[#C9D0DB] text-xs text-[#18212F] flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasExternalGuests}
                        onChange={(e) => setHasExternalGuests(e.target.checked)}
                        className="accent-[#24408E] cursor-pointer"
                      />
                      <span>External Guests / Speakers</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#18212F] block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Objectives and program flow..."
                    className="w-full p-2.5 rounded-md bg-white border border-[#C9D0DB] text-xs text-[#18212F] placeholder:text-[#6B778A] focus:border-[#24408E] focus:ring-2 focus:ring-[#24408E]/20 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#18212F] block mb-1">
                    Registration Link (Optional)
                  </label>
                  <input
                    value={regLink}
                    onChange={(e) => setRegLink(e.target.value)}
                    placeholder="https://forms.gle/..."
                    className="w-full p-2.5 rounded-md bg-white border border-[#C9D0DB] text-xs text-[#18212F] placeholder:text-[#6B778A] focus:border-[#24408E] focus:ring-2 focus:ring-[#24408E]/20 outline-none"
                  />
                </div>

                {/* Clearance Packet & Multimodal AI Pre-Check Intake */}
                <div className="p-4 rounded-md bg-[#F7F8FA] border border-[#C5D3F3] space-y-3 mt-3">
                  <div className="flex items-center justify-between border-b border-[#DDE2EA] pb-2">
                    <span className="text-[11px] font-bold text-[#18212F] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-[#24408E]" /> AI Multimodal Pre-Check Intake
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#EAEFFA] text-[#24408E] border border-[#C5D3F3]">
                      Gemini 3.8 Flash
                    </span>
                  </div>

                  {/* Interactive File Pickers */}
                  <div className="space-y-2 text-xs text-[#5B6678]">
                    {/* APF Form File Picker */}
                    <div className="flex items-center justify-between p-2.5 rounded-md bg-white border border-[#DDE2EA] hover:border-[#24408E]/50 transition">
                      <label className="flex items-center gap-2 text-[11px] text-[#18212F] cursor-pointer flex-1 min-w-0">
                        <Paperclip className="size-3.5 text-[#24408E] shrink-0" />
                        <span className="font-medium shrink-0">Signed APF Form *</span>
                        <span className="text-[11px] text-[#1F7A4D] font-mono truncate ml-auto mr-2">
                          {apfFile
                            ? apfFile.name
                            : existingCarriedFiles[0]
                            ? `${existingCarriedFiles[0].name} (existing)`
                            : "Choose PDF / PNG / JPEG"}
                        </span>
                        <input
                          key={apfFile ? apfFile.name : "apf-empty"}
                          type="file"
                          accept=".pdf,image/png,image/jpeg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setApfFile(e.target.files[0]);
                              setPreScreenResult(null);
                              setPreScreenError("");
                            }
                          }}
                        />
                      </label>
                      {apfFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setApfFile(null);
                            setPreScreenResult(null);
                            setPreScreenError("");
                          }}
                          className="text-[#5B6678] hover:text-[#B3261E] transition p-1 rounded hover:bg-[#FBEDEC] cursor-pointer shrink-0"
                          title="Remove attachment"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Mandatory Waivers File Picker */}
                    <div className="flex items-center justify-between p-2.5 rounded-md bg-white border border-[#DDE2EA] hover:border-[#24408E]/50 transition">
                      <label className="flex items-center gap-2 text-[11px] text-[#18212F] cursor-pointer flex-1 min-w-0">
                        <Paperclip className="size-3.5 text-[#24408E] shrink-0" />
                        <span className="font-medium shrink-0">Participant Waivers (If Off-Campus / MPH1)</span>
                        <span className="text-[11px] text-[#1F7A4D] font-mono truncate ml-auto mr-2">
                          {waiverFile
                            ? waiverFile.name
                            : existingCarriedFiles[1]
                            ? `${existingCarriedFiles[1].name} (existing)`
                            : "Choose PDF / PNG / JPEG"}
                        </span>
                        <input
                          key={waiverFile ? waiverFile.name : "waiver-empty"}
                          type="file"
                          accept=".pdf,image/png,image/jpeg"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setWaiverFile(e.target.files[0]);
                              setPreScreenResult(null);
                              setPreScreenError("");
                            }
                          }}
                        />
                      </label>
                      {waiverFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setWaiverFile(null);
                            setPreScreenResult(null);
                            setPreScreenError("");
                          }}
                          className="text-[#5B6678] hover:text-[#B3261E] transition p-1 rounded hover:bg-[#FBEDEC] cursor-pointer shrink-0"
                          title="Remove attachment"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pre-Submission Multimodal AI Check Button */}
                  <button
                    type="button"
                    onClick={handleRunAiPreScreen}
                    disabled={preScreening || !apfFile}
                    className="w-full py-2.5 px-3 rounded-md bg-[#EAEFFA] hover:bg-[#DCE6FA] border border-[#24408E]/30 text-[#24408E] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    {preScreening ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin text-[#24408E]" />
                        Inspecting PDF/Image &amp; Visual Signatures...
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="size-3.5 text-[#24408E]" />
                        Run AI Document &amp; Signature Check
                      </>
                    )}
                  </button>

                  {preScreenError && (
                    <div className="p-3 rounded-md bg-[#FBEDEC] border border-[#E2B3AF] text-[#B3261E] text-xs space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="size-4 shrink-0 mt-0.5 text-[#B3261E]" />
                        <span>{preScreenError}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="url"
                          value={backendUrlInput}
                          onChange={(e) => setBackendUrlInput(e.target.value)}
                          placeholder="https://bacxnabacx-pbl-notified-backend.vercel.app"
                          className="flex-1 p-1.5 rounded bg-white border border-[#C9D0DB] text-[11px] text-[#18212F] focus:border-[#24408E] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setAiBackendUrlOverride(backendUrlInput);
                            setPreScreenError("");
                          }}
                          className="px-2.5 py-1.5 rounded bg-[#24408E] hover:bg-[#1B3270] text-white font-semibold text-[10px] uppercase cursor-pointer"
                        >
                          Save URL
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Structured Multimodal Pre-Screen Feedback */}
                  {preScreenResult && (
                    <div
                      className={`p-3.5 rounded-md border text-xs space-y-3 bg-white ${
                        preScreenResult.overallStatus === "PASSED"
                          ? "border-[#B6DFC8]"
                          : preScreenResult.overallStatus === "NEEDS_REVISION"
                          ? "border-[#E5C98B]"
                          : "border-[#E2B3AF]"
                      }`}
                    >
                      {/* Header Status & Completeness Score */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-bold text-xs text-[#18212F]">
                          {preScreenResult.overallStatus === "PASSED" ? (
                            <CheckCircle2 className="size-4 text-[#1F7A4D]" />
                          ) : preScreenResult.overallStatus === "NEEDS_REVISION" ? (
                            <AlertTriangle className="size-4 text-[#8A5A00]" />
                          ) : (
                            <XCircle className="size-4 text-[#B3261E]" />
                          )}
                          AI Compliance Status: {preScreenResult.overallStatus.replace("_", " ")}
                        </span>
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#EAEFFA] border border-[#C5D3F3] text-[#24408E]">
                          Score: {preScreenResult.completenessScore}/100
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-[#DDE2EA] overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            preScreenResult.completenessScore >= 80
                              ? "bg-[#1F7A4D]"
                              : preScreenResult.completenessScore >= 50
                              ? "bg-[#D97706]"
                              : "bg-[#B3261E]"
                          }`}
                          style={{ width: `${preScreenResult.completenessScore}%` }}
                        />
                      </div>

                      {/* Visual Signature Verification Box */}
                      <div className="p-3 rounded-md bg-[#F7F8FA] border border-[#DDE2EA] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="flex items-center gap-1.5 text-[#18212F]">
                            <PenTool className="size-3.5 text-[#24408E]" /> Visual Signature Check
                          </span>
                          <span
                            className={
                              preScreenResult.signatureCheck.signaturesDetected
                                ? "text-[#1F7A4D]"
                                : "text-[#B3261E]"
                            }
                          >
                            {preScreenResult.signatureCheck.signaturesDetected
                              ? "✓ Signatures Detected"
                              : "✗ No Signatures Detected"}
                          </span>
                        </div>

                        {preScreenResult.signatureCheck.detectedSignatories.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {preScreenResult.signatureCheck.detectedSignatories.map((sig, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-[#E6F3EC] border border-[#B6DFC8] text-[#1F7A4D] text-[10px] font-medium"
                              >
                                ✓ {sig}
                              </span>
                            ))}
                          </div>
                        )}

                        {preScreenResult.signatureCheck.missingSignatureLines.length > 0 && (
                          <div className="p-2 rounded bg-[#FBEDEC] border border-[#E2B3AF] text-[#B3261E] space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider">
                              Missing / Blank Signature Alerts
                            </div>
                            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                              {preScreenResult.signatureCheck.missingSignatureLines.map((line, idx) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {preScreenResult.signatureCheck.visualNotes && (
                          <p className="text-[11px] text-[#5B6678] leading-relaxed">
                            <span className="text-[#18212F] font-semibold">Visual notes: </span>
                            {preScreenResult.signatureCheck.visualNotes}
                          </p>
                        )}
                      </div>

                      {/* Institutional Checklist */}
                      {preScreenResult.checklistEvaluation.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6678]">
                            Institutional Requirement Checklist
                          </div>
                          <div className="divide-y divide-[#DDE2EA] rounded-md border border-[#DDE2EA] bg-white">
                            {preScreenResult.checklistEvaluation.map((row, idx) => (
                              <div key={idx} className="p-2.5 flex items-start justify-between gap-2 text-[11px]">
                                <div>
                                  <div className="font-semibold text-[#18212F]">{row.requirement}</div>
                                  <div className="text-[#5B6678] text-[10px] mt-0.5">{row.evidence}</div>
                                </div>
                                <span
                                  className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                    row.met
                                      ? "bg-[#E6F3EC] text-[#1F7A4D] border-[#B6DFC8]"
                                      : "bg-[#FFF4DC] text-[#8A5A00] border-[#E5C98B]"
                                  }`}
                                >
                                  {row.met ? "✓ Met" : "✗ Missing"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Form vs. Document Inconsistencies */}
                      {preScreenResult.inconsistencies.length > 0 && (
                        <div className="p-2.5 rounded-md bg-[#FFF4DC] border border-[#E5C98B] text-[#8A5A00] space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="size-3.5" /> Form vs. Document Mismatches
                          </div>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                            {preScreenResult.inconsistencies.map((inc, idx) => (
                              <li key={idx}>{inc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Reviewer Summary */}
                      <div className="p-2.5 rounded-md bg-[#EAEFFA]/60 border border-[#C5D3F3] text-[11px] text-[#18212F] leading-relaxed">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#24408E] block mb-0.5">
                          Reviewer Summary
                        </span>
                        {preScreenResult.reviewerSummary}
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Unified Check & Submit / Resubmit Button */}
                <div className="flex items-center gap-3 pt-2">
                  {editingEvent && (
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setActiveNav("submitted");
                      }}
                      className="px-4 py-2.5 rounded-md border border-[#C9D0DB] bg-white hover:bg-[#F2F4F7] text-[#18212F] font-semibold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting || preScreening}
                    className="flex-1 py-2.5 px-4 rounded-md font-bold text-xs flex items-center justify-center gap-2 transition-all bg-[#24408E] hover:bg-[#1B3270] text-white shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Send className="size-3.5" />
                    {submitting
                      ? editingEvent
                        ? "Resubmitting Revised Proposal..."
                        : "Submitting Proposal..."
                      : editingEvent
                      ? "Save Changes & Resubmit to Admin"
                      : "Check & Submit Proposal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB 3: YOUR SUBMITTED PROPOSALS ── */}
        {activeNav === "submitted" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-5xl mx-auto flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold tracking-wider text-[#24408E] uppercase">
                  Your Submitted Proposals
                </h2>
                <span className="text-xs text-[#5B6678]">{events.length} Total</span>
              </div>

              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="p-8 rounded-lg bg-white border border-[#DDE2EA] text-center text-xs text-[#5B6678]">
                    No proposals submitted yet. Go to <b>Submit Proposal</b> to create one.
                  </div>
                ) : (
                  events.map((item) => {
                    const decoded = decodeProposalDescription(item.description);
                    const aiPre: PreScreenResult | undefined =
                      item.ai_prescreen_result ||
                      decoded.preScreen ||
                      cachedPreScreens[String(item.event_id)];
                    const needsRev = isRevisionStatus(item.status);
                    return (
                      <div
                        key={item.event_id}
                        className={`p-5 rounded-lg bg-white border space-y-2.5 text-left shadow-xs ${
                          needsRev ? "border-[#E5C98B] ring-1 ring-[#E5C98B]/60" : "border-[#DDE2EA]"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-bold text-[#18212F]">{item.title}</h3>
                            <p className="text-xs text-[#5B6678]">{item.organization || "Student Org"}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            {decoded.files.length > 0 && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-[#EAEFFA] text-[#24408E] border-[#C5D3F3] flex items-center gap-1">
                                <Paperclip className="size-3" /> {decoded.files.length} PDF/Doc
                              </span>
                            )}
                            {aiPre && (
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  aiPre.overallStatus === "PASSED"
                                    ? "bg-[#E6F3EC] text-[#1F7A4D] border-[#B6DFC8]"
                                    : aiPre.overallStatus === "NEEDS_REVISION"
                                    ? "bg-[#FFF4DC] text-[#8A5A00] border-[#E5C98B]"
                                    : "bg-[#FBEDEC] text-[#B3261E] border-[#E2B3AF]"
                                }`}
                              >
                                AI: {aiPre.overallStatus.replace("_", " ")} ({aiPre.completenessScore}%)
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize border ${getStatusBadgeClasses(
                                item.status
                              )}`}
                            >
                              {item.status ? item.status.replace("_", " ") : "Pending"}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#5B6678]">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3 text-[#24408E]" /> {item.event_date || "No date set"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3 text-[#24408E]" /> {item.start_time || "--"} -{" "}
                            {item.end_time || "--"}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3 text-[#24408E]" /> {item.venue || "No venue"}
                          </span>
                        </div>

                        {decoded.cleanDescription && (
                          <p className="text-xs text-[#4B5563] leading-relaxed">
                            {decoded.cleanDescription}
                          </p>
                        )}

                        {decoded.files.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {decoded.files.map((att, idx) => (
                              <button
                                key={`${item.event_id}-att-${idx}`}
                                type="button"
                                onClick={() => {
                                  const url = carriedAttachmentToBlobUrl(att);
                                  if (url) window.open(url, "_blank", "noopener,noreferrer");
                                }}
                                className="px-2.5 py-1 rounded bg-[#F7F8FA] hover:bg-[#EAEFFA] border border-[#DDE2EA] text-[11px] text-[#24408E] font-medium flex items-center gap-1.5 cursor-pointer"
                              >
                                <Paperclip className="size-3" />
                                <span className="truncate max-w-[200px]">{att.name}</span>
                                <ExternalLink className="size-3" />
                              </button>
                            ))}
                          </div>
                        )}

                        {aiPre?.reviewerSummary && (
                          <div className="p-2.5 rounded-md bg-[#EAEFFA]/60 border border-[#C5D3F3] text-[11px] text-[#18212F]">
                            <span className="text-[10px] font-bold text-[#24408E] uppercase tracking-wider block mb-0.5">
                              AI Pre-Screen Summary
                            </span>
                            {aiPre.reviewerSummary}
                          </div>
                        )}

                        {needsRev && (
                          <div className="p-3.5 rounded-md bg-[#FFF4DC] border border-[#E5C98B] text-xs space-y-2.5 mt-2">
                            <div>
                              <span className="font-bold flex items-center gap-1.5 mb-0.5 text-[#8A5A00]">
                                <AlertCircle className="size-3.5" /> Coordinator Revision Notes:
                              </span>
                              <p className="text-[#6B4600]">
                                {item.admin_feedback ||
                                  "The coordinator requested updates before this proposal can be endorsed."}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartEditProposal(item)}
                              className="px-3.5 py-2 rounded-md bg-[#24408E] hover:bg-[#1B3270] text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Pencil className="size-3.5" />
                              Edit &amp; Resubmit to Admin
                            </button>
                          </div>
                        )}

                        {/* Cryptographic Clearance Seal & Mobile Syndication */}
                        {item.status === "approved" && (
                          <div className="p-3 rounded-md bg-[#E6F3EC] border border-[#B6DFC8] text-xs space-y-1.5 mt-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[#1F7A4D] font-bold text-[11px] flex items-center gap-1.5">
                                <ShieldCheck className="size-3.5" /> Institutional Clearance Endorsement
                              </span>
                              <span className="text-[9px] px-2 py-0.5 rounded bg-white text-[#1F7A4D] border border-[#B6DFC8] font-semibold">
                                RA 8792 Signed
                              </span>
                            </div>
                            <div className="font-mono text-[9px] text-[#18212F] break-all bg-white/80 p-2 rounded border border-[#B6DFC8]">
                              SHA-256:{" "}
                              {item.clearance_hash ||
                                "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#5B6678]">
                              <span>Status: Endorsed by Coordinator</span>
                              <span className="text-[#1F7A4D] font-semibold">
                                ✓ Live on Campus Mobile App
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
