import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar, Clock, MapPin, CheckCircle2, FileText,
  Send, ChevronRight, AlertCircle, QrCode, Building2
} from "lucide-react";

type Screen = "submit" | "myEvents";
type Step = 1 | 2 | 3 | 4;

const VENUES = [
  "Main Campus Auditorium",
  "Multi-purpose Hall",
  "Innovation Hub, Building C",
  "Lab 501, Computer Studies",
  "Library Conference Room",
  "Gymnasium",
  "Room 301, Academic Building",
  "Virtual / MS Teams"
];

const AVAILABLE_TAGS = [
  "IT Department", "Computer Science", "All Students", "Freshmen",
  "Career", "Leadership", "Academic Support", "Seminar", "Workshop"
];

export function FacilitatorInterface() {
  const [screen, setScreen] = useState<Screen>("submit");
  const [step, setStep] = useState<Step>(1);

  // Step 1: Details
  const [title, setTitle] = useState("");
  const [organization] = useState("IT Student Council");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [venue, setVenue] = useState(VENUES[0]);
  const [attendees, setAttendees] = useState(150);
  const [selectedTags, setSelectedTags] = useState<string[]>(["IT Department", "All Students"]);
  const [description, setDescription] = useState("");

  // Step 2: Digital Assets
  const [regLink, setRegLink] = useState("");
  const [qrFileName, setQrFileName] = useState("");

  // Step 3: Clearances
  const [apfFileName, setApfFileName] = useState("");
  const [requiresBudget, setRequiresBudget] = useState<boolean>(false);
  const [financeFileName, setFinanceFileName] = useState("");
  const [borrowsEquipment, setBorrowsEquipment] = useState<boolean>(true);
  const [itroFileName, setItroFileName] = useState("");

  const [myEvents, setMyEvents] = useState<any[]>(() => {
    const stored = localStorage.getItem("notified_shared_events");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return [];
  });

  const toggleTag = (t: string) => {
    setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const step1Valid = title.trim() && date && venue && description.trim();
  const step2Valid = regLink.trim() && qrFileName;
  const step3Valid = apfFileName && (!requiresBudget || financeFileName) && (!borrowsEquipment || itroFileName);

  const handleSubmitProposal = () => {
    const newProposal = {
      id: Date.now(),
      title,
      organization,
      date: new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      time: `${startTime} – ${endTime}`,
      venue,
      proposedAttendees: Number(attendees) || 100,
      tags: selectedTags,
      urgencyLevel: "medium",
      daysUntil: Math.max(1, Math.round((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      registrationLink: regLink,
      hasQrCode: !!qrFileName,
      description,
      documents: {
        apf: {
          status: apfFileName ? "verified" : "missing",
          filename: apfFileName || "APF_Submission.pdf"
        },
        itro: {
          status: borrowsEquipment ? (itroFileName ? "verified" : "pending") : "verified",
          filename: itroFileName || "ITRO_Equipment_Clearance.pdf"
        },
        finance: {
          status: requiresBudget ? (financeFileName ? "verified" : "pending") : "verified",
          filename: financeFileName || "Finance_Requisition.pdf"
        }
      },
      conflicts: []
    };

    const current = localStorage.getItem("notified_shared_events");
    const parsed = current ? JSON.parse(current) : [];
    const updated = [newProposal, ...parsed];
    localStorage.setItem("notified_shared_events", JSON.stringify(updated));

    setMyEvents(updated);
    toast.success(`Proposal "${title}" submitted to Admin Coordinator Queue!`);

    // Reset wizard
    setTitle("");
    setDate("");
    setDescription("");
    setRegLink("");
    setQrFileName("");
    setApfFileName("");
    setFinanceFileName("");
    setItroFileName("");
    setStep(1);
    setScreen("myEvents");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B132B] text-white overflow-hidden w-full">
      {/* Facilitator Sub-header navigation */}
      <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-[#111C3D] flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScreen("submit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              screen === "submit" ? "bg-[#4A90D9] text-white" : "text-white/60 hover:text-white"
            }`}
          >
            Submit Proposal
          </button>
          <button
            onClick={() => {
              const stored = localStorage.getItem("notified_shared_events");
              if (stored) setMyEvents(JSON.parse(stored));
              setScreen("myEvents");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              screen === "myEvents" ? "bg-[#4A90D9] text-white" : "text-white/60 hover:text-white"
            }`}
          >
            My Submissions ({myEvents.length})
          </button>
        </div>

        <div className="text-xs text-[#8D99AE] flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <span>Organization: <strong className="text-white">{organization}</strong></span>
        </div>
      </div>

      {/* Screen 1: Submit Wizard */}
      {screen === "submit" && (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <div className="w-full max-w-2xl">
            {/* Steps */}
            <div className="grid grid-cols-4 gap-2 mb-8">
              {[
                { n: 1, label: "Logistics" },
                { n: 2, label: "Assets" },
                { n: 3, label: "Clearances" },
                { n: 4, label: "Review" }
              ].map(s => (
                <div
                  key={s.n}
                  onClick={() => s.n < step && setStep(s.n as Step)}
                  className={`border-t-2 pt-2 text-left cursor-pointer transition-all ${
                    step === s.n
                      ? "border-[#4A90D9] text-[#4A90D9]"
                      : step > s.n
                      ? "border-[#22C55E] text-[#22C55E]"
                      : "border-white/10 text-white/40"
                  }`}
                >
                  <p className="text-[10px] uppercase font-bold tracking-wider">Step {s.n}</p>
                  <p className="text-xs font-medium truncate">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Step 1: Details & Logistics */}
            {step === 1 && (
              <div className="bg-[#1C2541] border border-white/10 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Event Details & Logistics</h3>

                <div>
                  <label className="text-xs text-white/70 block mb-1">Event Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Cybersecurity Career Expo 2026"
                    className="w-full bg-[#0B132B] border border-white/15 rounded-lg px-3.5 py-2 text-sm text-white outline-none focus:border-[#4A90D9]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-white/70 block mb-1">Target Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-[#0B132B] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#4A90D9]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/70 block mb-1">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full bg-[#0B132B] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#4A90D9]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/70 block mb-1">End Time</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full bg-[#0B132B] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#4A90D9]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/70 block mb-1">Venue Assignment *</label>
                    <select
                      value={venue}
                      onChange={e => setVenue(e.target.value)}
                      className="w-full bg-[#0B132B] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#4A90D9]"
                    >
                      {VENUES.map(v => (
                        <option key={v} value={v} className="bg-[#1C2541]">{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/70 block mb-1">Expected Attendees</label>
                    <input
                      type="number"
                      value={attendees}
                      onChange={e => setAttendees(Number(e.target.value))}
                      className="w-full bg-[#0B132B] border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#4A90D9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-1.5">Tags & Classification</label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TAGS.map(t => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => toggleTag(t)}
                        className={`text-xs px-2.5 py-1 rounded-md transition-all ${
                          selectedTags.includes(t)
                            ? "bg-[#4A90D9] text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-1">Event Description & Objective *</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe program goals, key resource speakers, and target audience..."
                    className="w-full bg-[#0B132B] border border-white/15 rounded-lg p-3 text-sm text-white outline-none focus:border-[#4A90D9]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    disabled={!step1Valid}
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1.5 bg-[#4A90D9] text-white text-xs px-4 py-2 rounded-lg font-medium disabled:opacity-40"
                  >
                    Next: Assets <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Digital Assets */}
            {step === 2 && (
              <div className="bg-[#1C2541] border border-white/10 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Digital Assets & Registration</h3>

                <div>
                  <label className="text-xs text-white/70 block mb-1">Registration Link *</label>
                  <input
                    type="url"
                    value={regLink}
                    onChange={e => setRegLink(e.target.value)}
                    placeholder="https://forms.office.com/r/sample"
                    className="w-full bg-[#0B132B] border border-white/15 rounded-lg px-3.5 py-2 text-sm text-white outline-none focus:border-[#4A90D9]"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70 block mb-1">Promotional QR Code / Poster *</label>
                  <div
                    onClick={() => setQrFileName("Event_Promo_QR.png")}
                    className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-[#4A90D9] transition-colors"
                  >
                    <QrCode className="w-8 h-8 text-[#4A90D9] mx-auto mb-2" />
                    {qrFileName ? (
                      <p className="text-xs text-[#22C55E] font-medium">Selected: {qrFileName}</p>
                    ) : (
                      <>
                        <p className="text-xs text-white/80">Click to upload QR Code or promotional asset</p>
                        <p className="text-[10px] text-[#8D99AE] mt-1">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button onClick={() => setStep(1)} className="text-xs text-white/60 hover:text-white px-3 py-2">
                    Back
                  </button>
                  <button
                    disabled={!step2Valid}
                    onClick={() => setStep(3)}
                    className="flex items-center gap-1.5 bg-[#4A90D9] text-white text-xs px-4 py-2 rounded-lg font-medium disabled:opacity-40"
                  >
                    Next: Clearances <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Clearances */}
            {step === 3 && (
              <div className="bg-[#1C2541] border border-white/10 rounded-xl p-6 space-y-5">
                <h3 className="text-lg font-semibold text-white">Compliance & Clearances</h3>

                <div className="p-3.5 bg-[#0B132B] border border-white/10 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-white">Activity Proposal Form (APF) *</p>
                    <p className="text-[11px] text-[#8D99AE]">Standard student activity clearance document</p>
                  </div>
                  <button
                    onClick={() => setApfFileName("Signed_APF_Form.pdf")}
                    className={`text-xs px-3 py-1.5 rounded font-medium ${
                      apfFileName ? "bg-[#22C55E]/20 text-[#22C55E]" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {apfFileName ? "Uploaded ✓" : "Attach PDF"}
                  </button>
                </div>

                <div className="p-3.5 bg-[#0B132B] border border-white/10 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white">Budget Requisition Required?</p>
                      <p className="text-[11px] text-[#8D99AE]">Finance office budget approval document</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={requiresBudget}
                      onChange={e => setRequiresBudget(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </div>
                  {requiresBudget && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-white/70">{financeFileName || "Budget clearance pending"}</span>
                      <button
                        onClick={() => setFinanceFileName("Finance_Budget_Requisition.pdf")}
                        className="text-xs bg-white/10 px-3 py-1 rounded text-white hover:bg-white/20"
                      >
                        {financeFileName ? "Uploaded ✓" : "Upload Finance Form"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-[#0B132B] border border-white/10 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white">Equipment / Venue Clearance (ITRO/BMO)</p>
                      <p className="text-[11px] text-[#8D99AE]">Microphones, projector, stage audio routing</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={borrowsEquipment}
                      onChange={e => setBorrowsEquipment(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                  </div>
                  {borrowsEquipment && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-white/70">{itroFileName || "ITRO clearance pending"}</span>
                      <button
                        onClick={() => setItroFileName("ITRO_Equipment_Clearance.pdf")}
                        className="text-xs bg-white/10 px-3 py-1 rounded text-white hover:bg-white/20"
                      >
                        {itroFileName ? "Uploaded ✓" : "Upload ITRO Form"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-between">
                  <button onClick={() => setStep(2)} className="text-xs text-white/60 hover:text-white px-3 py-2">
                    Back
                  </button>
                  <button
                    disabled={!step3Valid}
                    onClick={() => setStep(4)}
                    className="flex items-center gap-1.5 bg-[#4A90D9] text-white text-xs px-4 py-2 rounded-lg font-medium disabled:opacity-40"
                  >
                    Next: Review <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Review and Submit */}
            {step === 4 && (
              <div className="bg-[#1C2541] border border-white/10 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Review Proposal Submission</h3>
                <p className="text-xs text-[#8D99AE]">Verify your logistical packet before submitting to the Admin Approval Queue.</p>

                <div className="bg-[#0B132B] p-4 rounded-lg space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">Title:</span>
                    <strong className="text-white">{title}</strong>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">Date & Time:</span>
                    <span className="text-white">{date} ({startTime} – {endTime})</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">Venue:</span>
                    <span className="text-white">{venue}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/60">Registration:</span>
                    <span className="text-[#4A90D9] underline truncate max-w-[200px]">{regLink}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Clearance Packet:</span>
                    <span className="text-[#22C55E]">All mandatory forms ready</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button onClick={() => setStep(3)} className="text-xs text-white/60 hover:text-white px-3 py-2">
                    Back
                  </button>
                  <button
                    onClick={handleSubmitProposal}
                    className="flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#1ea34d] text-white text-xs px-5 py-2.5 rounded-lg font-semibold transition-colors"
                  >
                    <Send className="w-4 h-4" /> Submit to Approval Queue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen 2: My Submissions Tracker */}
      {screen === "myEvents" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Event Proposals Submitted</h3>
              <button
                onClick={() => setScreen("submit")}
                className="text-xs bg-[#4A90D9] text-white px-3 py-1.5 rounded-lg font-medium"
              >
                + New Proposal
              </button>
            </div>

            {myEvents.length === 0 ? (
              <div className="bg-[#1C2541] border border-white/10 rounded-xl p-8 text-center">
                <AlertCircle className="w-8 h-8 text-white/40 mx-auto mb-2" />
                <p className="text-sm text-white/80">No proposals submitted yet</p>
                <p className="text-xs text-[#8D99AE] mt-1">Submit your first event proposal to enter the approval pipeline.</p>
              </div>
            ) : (
              myEvents.map((ev: any) => (
                <div
                  key={ev.id}
                  className="bg-[#1C2541] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white">{ev.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#8D99AE]">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {ev.date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {ev.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {ev.venue}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] font-medium border border-[#F59E0B]/20">
                      Pending Admin Review
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}