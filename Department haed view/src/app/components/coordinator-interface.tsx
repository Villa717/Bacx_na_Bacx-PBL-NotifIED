import { supabase } from "../../lib/supabase";
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertTriangle, Calendar, MapPin, Users, Clock, ExternalLink,
  QrCode, FileText, CheckCircle2, XCircle, Clock3, Download, Eye,
  ChevronRight, ArrowLeft, Edit3, Send,
} from 'lucide-react';

type DocStatus = 'verified' | 'pending' | 'missing';
type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';
type ActionState = 'idle' | 'revision' | 'reject';

interface EventDoc { status: DocStatus; filename: string }
interface PendingEvent {
  id: number;
  title: string;
  organization: string;
  date: string;
  time: string;
  venue: string;
  proposedAttendees: number;
  tags: string[];
  urgencyLevel: UrgencyLevel;
  daysUntil: number;
  registrationLink: string;
  hasQrCode: boolean;
  description: string;
  documents: { apf: EventDoc; itro: EventDoc; finance: EventDoc };
  conflicts: string[];
}

const INITIAL_EVENTS: PendingEvent[] = [
  {
    id: 1,
    title: 'APC Foundation Day',
    organization: 'IT Student Council',
    date: 'August 17, 2026',
    time: '9:00 AM – 5:00 PM',
    venue: 'Main Campus Auditorium',
    proposedAttendees: 450,
    tags: ['IT Department', 'All Students', 'Faculty'],
    urgencyLevel: 'critical',
    daysUntil: 5,
    registrationLink: 'https://go.apc.edu.ph/foundation-day-2026',
    hasQrCode: true,
    description: 'Annual celebration featuring departmental showcases, keynote speakers, and cultural performances for the entire IT community.',
    documents: {
      apf: { status: 'verified', filename: 'APF_Foundation_Day_2026.pdf' },
      itro: { status: 'verified', filename: 'ITRO_Equipment_Request.pdf' },
      finance: { status: 'pending', filename: 'Finance_Requisition_Draft.pdf' },
    },
    conflicts: [],
  },
  {
    id: 2,
    title: 'Innovation Summit 2026',
    organization: 'Computer Science Society',
    date: 'August 22, 2026',
    time: '1:00 PM – 6:00 PM',
    venue: 'Innovation Hub, Building C',
    proposedAttendees: 200,
    tags: ['Computer Science', '2nd Year', '3rd Year'],
    urgencyLevel: 'high',
    daysUntil: 10,
    registrationLink: 'https://go.apc.edu.ph/innovation-summit',
    hasQrCode: true,
    description: 'AI and machine learning showcase with student research presentations and industry guest speakers.',
    documents: {
      apf: { status: 'verified', filename: 'APF_InnovationSummit.pdf' },
      itro: { status: 'verified', filename: 'ITRO_InnovationSummit.pdf' },
      finance: { status: 'verified', filename: 'Finance_InnovationSummit.pdf' },
    },
    conflicts: ['Venue conflict: Sports Training scheduled in Building C on Aug 22, 3:00–5:00 PM'],
  },
  {
    id: 3,
    title: 'Career Fair Spring 2026',
    organization: 'Career Development Office',
    date: 'August 28, 2026',
    time: '10:00 AM – 4:00 PM',
    venue: '',
    proposedAttendees: 600,
    tags: ['All Students', 'All Programs', 'Industry Partners'],
    urgencyLevel: 'medium',
    daysUntil: 16,
    registrationLink: '',
    hasQrCode: false,
    description: 'Campus-wide career fair with 40+ industry partners across IT, Business, and Engineering sectors.',
    documents: {
      apf: { status: 'missing', filename: '' },
      itro: { status: 'missing', filename: '' },
      finance: { status: 'missing', filename: '' },
    },
    conflicts: [],
  },
  {
    id: 4,
    title: 'SWA Computation Workshop',
    organization: 'Student Welfare Association',
    date: 'September 3, 2026',
    time: '2:00 PM – 5:00 PM',
    venue: 'Room 301, Academic Building',
    proposedAttendees: 80,
    tags: ['All Students', 'Academic Support'],
    urgencyLevel: 'low',
    daysUntil: 22,
    registrationLink: 'https://go.apc.edu.ph/swa-workshop',
    hasQrCode: true,
    description: 'Workshop on SWA computation procedures, scholarship applications, and financial aid documentation.',
    documents: {
      apf: { status: 'verified', filename: 'APF_SWA_Workshop.pdf' },
      itro: { status: 'verified', filename: 'ITRO_SWA_Room.pdf' },
      finance: { status: 'pending', filename: 'Finance_SWA_Draft.pdf' },
    },
    conflicts: [],
  },
];

const urgencyConfig: Record<UrgencyLevel, { label: string; color: string; border: string }> = {
  critical: { label: 'Urgent', color: '#EF4444', border: 'border-l-[#EF4444]' },
  high: { label: 'High', color: '#F59E0B', border: 'border-l-[#F59E0B]' },
  medium: { label: 'Normal', color: '#4A90D9', border: 'border-l-[#4A90D9]' },
  low: { label: 'Low', color: '#8D99AE', border: 'border-l-[#8D99AE]' },
};

function DocStatusIndicator({ status }: { status: DocStatus }) {
  if (status === 'verified') return (
    <span className="flex items-center gap-1 text-[11px] text-[#22C55E] font-medium">
      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
    </span>
  );
  if (status === 'pending') return (
    <span className="flex items-center gap-1 text-[11px] text-[#F59E0B] font-medium">
      <Clock3 className="w-3.5 h-3.5" /> Pending Signature
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[11px] text-[#EF4444] font-medium">
      <XCircle className="w-3.5 h-3.5" /> Not Submitted
    </span>
  );
}

function canApprove(event: PendingEvent): boolean {
  const allDocs = Object.values(event.documents).every(d => d.status === 'verified');
  return allDocs && event.conflicts.length === 0 && !!event.venue && !!event.registrationLink;
}

function missingItems(event: PendingEvent): string[] {
  const items: string[] = [];
  if (!event.venue) items.push('Venue not specified');
  if (!event.registrationLink) items.push('Registration link missing');
  if (!event.hasQrCode) items.push('Promotional QR code not uploaded');
  Object.entries(event.documents).forEach(([key, doc]) => {
    if (doc.status === 'missing') {
      const labels: Record<string, string> = { apf: 'APF Form', itro: 'ITRO Equipment Form', finance: 'Finance Requisition' };
      items.push(`${labels[key]} not submitted`);
    }
  });
  return items;
}

export function CoordinatorInterface() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [feedbackText, setFeedbackText] = useState('');
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const selected = events.find(e => e.id === selectedId);
  const urg = selected ? urgencyConfig[selected.urgencyLevel] : null;

  const selectEvent = (id: number) => {
    setSelectedId(id);
    setActionState('idle');
    setFeedbackText('');
    setShowMobileDetail(true);
  };

  const handleApprove = () => {
    if (!selected) return;
    setEvents(ev => ev.filter(e => e.id !== selected.id));
    toast.success(`"${selected.title}" approved successfully.`, {
      description: 'QR code generation has been initiated.',
    });
    setSelectedId(null);
    setShowMobileDetail(false);
  };

  const handleSubmitRevision = () => {
    if (!feedbackText.trim()) { toast.error('Please provide revision feedback.'); return; }
    toast.warning(`Revision requested for "${selected?.title}".`, { description: feedbackText });
    setActionState('idle');
    setFeedbackText('');
  };

  const handleConfirmReject = () => {
    if (!feedbackText.trim()) { toast.error('A rejection reason is required.'); return; }
    if (!selected) return;
    setEvents(ev => ev.filter(e => e.id !== selected.id));
    toast.error(`"${selected.title}" has been rejected.`);
    setSelectedId(null);
    setShowMobileDetail(false);
    setFeedbackText('');
  };

  const goBack = () => { setShowMobileDetail(false); setSelectedId(null); setActionState('idle'); };

  const missing = selected ? missingItems(selected) : [];
  const approveEnabled = selected ? canApprove(selected) : false;

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full min-h-0">
      {/* ── Left pane: Queue list ── */}
      <div className={`
        flex flex-col border-r border-white/10
        w-full lg:w-[420px] xl:w-[460px] lg:flex-shrink-0 bg-[#0E172F]
        ${showMobileDetail ? 'hidden lg:flex' : 'flex'}
      `}>
        <div className="px-5 py-4 border-b border-white/5 flex-shrink-0">
          <h2 className="font-serif text-xl font-semibold text-white">Paper Approval Queue</h2>
          <p className="text-xs text-[#8D99AE] mt-0.5">{events.length} proposals awaiting review</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {events.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <CheckCircle2 className="w-10 h-10 text-[#22C55E] mb-3 opacity-40" />
              <p className="text-sm font-medium text-white/60">Queue cleared</p>
              <p className="text-xs text-[#8D99AE] mt-1">All proposals have been reviewed.</p>
            </div>
          )}
          {events.map(event => {
            const cfg = urgencyConfig[event.urgencyLevel];
            const isSelected = selectedId === event.id;
            return (
              <button
                key={event.id}
                onClick={() => selectEvent(event.id)}
                className={`
                  w-full text-left rounded-xl border-l-4 p-4 transition-all duration-150
                  ${isSelected
                    ? 'bg-[#FDB813]/10 border-l-[#FDB813] border border-[#FDB813]/30'
                    : `bg-[#1C2541] ${cfg.border} border border-white/5 hover:border-white/10`
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{event.title}</p>
                    <p className="text-xs text-[#8D99AE] mt-0.5">{event.organization}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${cfg.color}18`, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-colors ${isSelected ? 'text-[#FDB813]' : 'text-[#8D99AE]'}`} />
                  </div>
                </div>

                {event.conflicts.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-2 text-[#F59E0B]">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <p className="text-[10px]">Conflict detected</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1 text-[11px] text-[#8D99AE]">
                    <Calendar className="w-3 h-3" />{event.date}
                  </span>
                  {event.venue && (
                    <span className="flex items-center gap-1 text-[11px] text-[#8D99AE]">
                      <MapPin className="w-3 h-3" />{event.venue.split(',')[0]}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {event.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#8D99AE]">{tag}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right pane: Document inspector ── */}
      <div className={`
        flex-1 flex flex-col overflow-hidden w-full h-full bg-[#0B132B]
        ${!showMobileDetail && !selected ? 'hidden lg:flex' : 'flex'}
      `}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-[#8D99AE]" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-white mb-2">Document Inspector</h3>
            <p className="text-sm text-[#8D99AE] max-w-xs leading-relaxed">
              Select a proposal from the queue to review its documents, assets, and clearance forms.
            </p>
          </div>
        ) : (
          <>
            {/* Inspector header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={goBack}
                className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[#8D99AE] hover:text-white hover:bg-white/5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif text-lg font-semibold text-white truncate">{selected.title}</h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: `${urg!.color}18`, color: urg!.color }}
                  >
                    {urg!.label}
                    {selected.urgencyLevel === 'critical' && ` · ${selected.daysUntil}d`}
                  </span>
                </div>
                <p className="text-xs text-[#8D99AE] mt-0.5">{selected.organization}</p>
              </div>
            </div>

            {/* Scrollable inspector body */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Conflict warning */}
                {selected.conflicts.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#F59E0B]/8 border border-[#F59E0B]/20 flex gap-3">
                    <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#F59E0B]">Scheduling Conflict Detected</p>
                      <p className="text-xs text-[#F59E0B]/80 mt-0.5">{selected.conflicts[0]}</p>
                    </div>
                  </div>
                )}

                {/* Missing items warning */}
                {missing.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#EF4444]/8 border border-[#EF4444]/20 flex gap-3">
                    <XCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#EF4444]">Incomplete Submission</p>
                      <ul className="mt-1.5 space-y-0.5">
                        {missing.map((item, i) => (
                          <li key={i} className="text-xs text-[#EF4444]/80">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Event details */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8D99AE]/60 mb-3">Event Details</p>
                  <div className="bg-[#162035] rounded-xl border border-white/5 p-4 space-y-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      {[
                        { icon: Calendar, text: selected.date },
                        { icon: Clock, text: selected.time },
                        { icon: MapPin, text: selected.venue || '—' },
                      ].map(({ icon: Icon, text }, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-[#8D99AE]">
                          <Icon className="w-3.5 h-3.5 text-[#FDB813] flex-shrink-0" />
                          <span className={!selected.venue && i === 2 ? 'text-[#EF4444]' : ''}>{text}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#8D99AE] pt-2 border-t border-white/5">
                      <Users className="w-3.5 h-3.5 text-[#FDB813] flex-shrink-0" />
                      <span>Expected: <span className="text-white font-medium">{selected.proposedAttendees.toLocaleString()} attendees</span></span>
                    </div>
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-xs text-[#8D99AE] leading-relaxed">{selected.description}</p>
                    </div>
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] text-[#8D99AE]/60 mb-2">Demographic Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.tags.map(tag => (
                          <span key={tag} className="text-[11px] px-2.5 py-1 rounded-full bg-[#FDB813]/10 text-[#FDB813] border border-[#FDB813]/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promotional assets */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8D99AE]/60 mb-3">Promotional Assets</p>
                  <div className="bg-[#162035] rounded-xl border border-white/5 p-4 flex gap-4 items-start">
                    {/* QR preview */}
                    <div className="flex-shrink-0">
                      <p className="text-[10px] text-[#8D99AE]/60 mb-2">QR Code</p>
                      {selected.hasQrCode ? (
                        <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center shadow-lg">
                          <QrCode className="w-12 h-12 text-[#0B132B]" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg border border-dashed border-[#EF4444]/40 flex items-center justify-center">
                          <XCircle className="w-6 h-6 text-[#EF4444]/50" />
                        </div>
                      )}
                    </div>
                    {/* Registration link */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[#8D99AE]/60 mb-2">Registration Link</p>
                      {selected.registrationLink ? (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                          <p className="text-xs text-[#4A90D9] truncate flex-1">{selected.registrationLink}</p>
                          <a href={selected.registrationLink} target="_blank" rel="noopener noreferrer"
                            className="w-6 h-6 flex items-center justify-center rounded text-[#8D99AE] hover:text-white transition-colors flex-shrink-0">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#EF4444]/5 border border-[#EF4444]/20">
                          <XCircle className="w-3.5 h-3.5 text-[#EF4444] flex-shrink-0" />
                          <p className="text-xs text-[#EF4444]">No registration link provided</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* PDF clearance attachments */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8D99AE]/60 mb-3">PDF Clearance Attachments</p>
                  <div className="bg-[#162035] rounded-xl border border-white/5 divide-y divide-white/[0.04]">
                    {[
                      { key: 'apf', label: 'APF Form', sub: 'Adviser Signed', doc: selected.documents.apf },
                      { key: 'itro', label: 'ITRO Equipment Form', sub: 'Equipment / AV Request', doc: selected.documents.itro },
                      { key: 'finance', label: 'Finance Requisition Form', sub: 'Budget Clearance', doc: selected.documents.finance },
                    ].map(({ label, sub, doc }) => (
                      <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            doc.status === 'verified' ? 'bg-[#22C55E]/10' :
                            doc.status === 'pending' ? 'bg-[#F59E0B]/10' : 'bg-[#EF4444]/10'
                          }`}>
                            <FileText className={`w-4 h-4 ${
                              doc.status === 'verified' ? 'text-[#22C55E]' :
                              doc.status === 'pending' ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white">{label}</p>
                            <p className="text-[10px] text-[#8D99AE]">{sub}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <DocStatusIndicator status={doc.status} />
                          {doc.status !== 'missing' && (
                            <div className="flex gap-1">
                              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8D99AE] hover:text-white hover:bg-white/5 transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8D99AE] hover:text-white hover:bg-white/5 transition-colors">
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inline feedback areas */}
                {actionState === 'revision' && (
                  <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-[#F59E0B]" />
                      <p className="text-sm font-semibold text-[#F59E0B]">Revision Feedback</p>
                    </div>
                    <textarea
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder="Describe what changes are required before this event can be approved..."
                      rows={3}
                      className="w-full bg-[#162035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#8D99AE]/60 resize-none focus:outline-none focus:ring-1 focus:ring-[#F59E0B]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSubmitRevision}
                        className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-[#0B132B] rounded-lg text-sm font-semibold hover:bg-[#E8900A] transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Feedback
                      </button>
                      <button onClick={() => setActionState('idle')} className="px-4 py-2 text-sm text-[#8D99AE] hover:text-white transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {actionState === 'reject' && (
                  <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-[#EF4444]" />
                      <p className="text-sm font-semibold text-[#EF4444]">Rejection Reason <span className="text-[#EF4444]/60">(required)</span></p>
                    </div>
                    <textarea
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      placeholder="Provide a mandatory rejection reason that will be sent to the submitting organization..."
                      rows={3}
                      className="w-full bg-[#162035] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#8D99AE]/60 resize-none focus:outline-none focus:ring-1 focus:ring-[#EF4444]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmReject}
                        className="flex items-center gap-2 px-4 py-2 bg-[#EF4444] text-white rounded-lg text-sm font-semibold hover:bg-[#DC2626] transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Confirm Rejection
                      </button>
                      <button onClick={() => setActionState('idle')} className="px-4 py-2 text-sm text-[#8D99AE] hover:text-white transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky action bar */}
            {actionState === 'idle' && (
              <div className="flex-shrink-0 px-6 py-4 border-t border-white/5 bg-[#162035]/60 backdrop-blur-sm">
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={!approveEnabled}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                      bg-[#22C55E] text-white hover:bg-[#16A34A]
                      disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Approve Event
                  </button>
                  <button
                    onClick={() => { setActionState('revision'); setFeedbackText(''); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#F59E0B] text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
                  >
                    Needs Revision
                  </button>
                  <button
                    onClick={() => { setActionState('reject'); setFeedbackText(''); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                  >
                    Reject
                  </button>
                </div>
                {!approveEnabled && missing.length > 0 && (
                  <p className="text-[11px] text-[#8D99AE] mt-2 text-center">
                    Resolve {missing.length} issue{missing.length !== 1 ? 's' : ''} before approving
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
