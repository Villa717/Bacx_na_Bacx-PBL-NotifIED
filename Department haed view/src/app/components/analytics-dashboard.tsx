import { useState } from 'react';
import { Lightbulb, Search, FileBarChart2, Users, TrendingUp, AlertCircle, ChevronDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';

const eventData = [
  {
    event: 'APC Foundation Day',
    shortName: 'Foundation Day',
    totalRegistrations: 160,
    actualAttendance: 142,
    participationRate: 88.75,
    aiInsight: '88.75% Participation Rate (142 attendees / 160 registrations) for APC Foundation Day. Exceeds the 75% engagement threshold by 13.75 points. Strongly recommend replicating this event format next term — particularly the multi-channel QR code distribution in high-traffic campus zones, which was identified as a key conversion driver.',
  },
  {
    event: 'Tech Talks Series',
    shortName: 'Tech Talks',
    totalRegistrations: 98,
    actualAttendance: 82,
    participationRate: 83.67,
    aiInsight: '83.67% Participation Rate (82 attendees / 98 registrations) for Tech Talks Series. Above benchmark with solid engagement. To push toward 90%, consider sending reminder notifications 48 hours before the event, and expand promotion to off-department student channels.',
  },
  {
    event: 'Career Fair Spring',
    shortName: 'Career Fair',
    totalRegistrations: 195,
    actualAttendance: 178,
    participationRate: 91.28,
    aiInsight: '91.28% Participation Rate (178 attendees / 195 registrations) for Career Fair Spring — highest across all events this term. The multi-channel strategy with industry partner co-promotion drove exceptional conversion. Strongly recommend using this as the benchmark model for future campus-wide initiatives.',
  },
  {
    event: 'APC Sports Fest',
    shortName: 'Sports Fest',
    totalRegistrations: 124,
    actualAttendance: 103,
    participationRate: 83.06,
    aiInsight: '83.06% Participation Rate (103 attendees / 124 registrations) for APC Sports Fest. Healthy engagement above the 75% threshold. Opportunity: extend the promotional window from 5 to 10 days and add video content to drive stronger initial interest. A collaboration with sports clubs for organic reach is recommended.',
  },
];

const auditLog = [
  { id: 1, event: 'Hackathon 2026', action: 'Approved', coordinator: 'K. Salvana', date: '2026-08-23', time: '10:32 AM' },
  { id: 2, event: 'Cultural Night Showcase', action: 'Published', coordinator: 'K. Salvana', date: '2026-08-23', time: '9:15 AM' },
  { id: 3, event: 'Career Fair Spring', action: 'Revision Requested', coordinator: 'K. Salvana', date: '2026-08-22', time: '4:45 PM' },
  { id: 4, event: 'Innovation Summit 2026', action: 'Submitted', coordinator: 'CS Society', date: '2026-08-21', time: '2:20 PM' },
  { id: 5, event: 'Alumni Homecoming Night', action: 'Approved', coordinator: 'K. Salvana', date: '2026-08-20', time: '11:00 AM' },
  { id: 6, event: 'Coding Bootcamp: Python', action: 'Rejected', coordinator: 'K. Salvana', date: '2026-08-19', time: '3:30 PM' },
  { id: 7, event: 'APC Sports Fest 2026', action: 'Submitted', coordinator: 'Athletics Club', date: '2026-08-18', time: '1:15 PM' },
  { id: 8, event: 'Business Case Seminar', action: 'Approved', coordinator: 'K. Salvana', date: '2026-08-17', time: '9:00 AM' },
  { id: 9, event: 'Engineering Expo 2026', action: 'Approved', coordinator: 'K. Salvana', date: '2026-08-15', time: '11:45 AM' },
  { id: 10, event: 'SWA Workshop Sept.', action: 'Submitted', coordinator: 'SWA Office', date: '2026-08-14', time: '3:00 PM' },
];

function auditBadge(action: string) {
  switch (action) {
    case 'Approved': return 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20';
    case 'Published': return 'bg-[#4A90D9]/10 text-[#4A90D9] border border-[#4A90D9]/20';
    case 'Submitted': return 'bg-[#8D99AE]/10 text-[#8D99AE] border border-[#8D99AE]/20';
    case 'Revision Requested': return 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20';
    case 'Rejected': return 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20';
    default: return 'bg-white/5 text-white/60 border border-white/10';
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B132B] border border-white/10 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-semibold text-white mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-[#8D99AE]">{p.name}:</span>
          <span className="text-white font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function ParticipationGauge({ rate }: { rate: number }) {
  const clampedRate = Math.min(100, Math.max(0, rate));
  const angle = (clampedRate / 100) * 180;
  const r = 52;
  const cx = 70;
  const cy = 70;
  const startX = cx - r;
  const startY = cy;
  const endAngle = (angle - 180) * (Math.PI / 180);
  const endX = cx + r * Math.cos(endAngle);
  const endY = cy + r * Math.sin(endAngle);
  const largeArcFlag = angle > 180 ? 1 : 0;

  return (
    <svg viewBox="0 0 140 80" className="w-full max-w-[160px]">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY}`}
        fill="none" stroke="#FDB813" strokeWidth="10" strokeLinecap="round"
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="Inter">
        {rate.toFixed(1)}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#8D99AE" fontSize="7" fontFamily="Inter">
        Participation Rate
      </text>
      <text x={cx - r + 4} y={cy + 16} fill="#8D99AE" fontSize="7" fontFamily="Inter">0%</text>
      <text x={cx + r - 12} y={cy + 16} fill="#8D99AE" fontSize="7" fontFamily="Inter">100%</text>
    </svg>
  );
}

export function AnalyticsDashboard() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [auditSearch, setAuditSearch] = useState('');

  const selectedData = eventData.find(e => e.event === selectedEvent);
  const filteredAudit = auditLog.filter(
    e =>
      e.event.toLowerCase().includes(auditSearch.toLowerCase()) ||
      e.action.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const hasData = selectedData != null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div>
          <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-white">Institutional Analytics</h2>
          <p className="text-sm text-[#8D99AE] mt-1">Performance metrics & on-premises engagement insights</p>
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Dual bar chart */}
          <div className="lg:col-span-2 bg-[#1C2541] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-serif text-base font-semibold text-white">
                Registrations vs. Actual Attendance
              </h3>
              {selectedEvent && (
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-xs text-[#8D99AE] hover:text-white transition-colors"
                >
                  Clear selection
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#8D99AE] mb-5">Click a bar group to view AI insight</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={eventData}
                barGap={4}
                onClick={data => data?.activeLabel && setSelectedEvent(data.activeLabel)}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="shortName"
                  stroke="#8D99AE"
                  tick={{ fontSize: 11, fill: '#8D99AE' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#8D99AE"
                  tick={{ fontSize: 11, fill: '#8D99AE' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 220]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#8D99AE', paddingTop: 12 }}
                />
                <Bar dataKey="totalRegistrations" name="Total Registrations" fill="#4A90D9" radius={[4, 4, 0, 0]}>
                  {eventData.map(e => (
                    <Cell
                      key={e.event}
                      fill={selectedEvent === e.event ? '#4A90D9' : selectedEvent ? '#4A90D9' + '55' : '#4A90D9'}
                    />
                  ))}
                </Bar>
                <Bar dataKey="actualAttendance" name="Actual Attendance" fill="#FDB813" radius={[4, 4, 0, 0]}>
                  {eventData.map(e => (
                    <Cell
                      key={e.event}
                      fill={selectedEvent === e.event ? '#FDB813' : selectedEvent ? '#FDB813' + '55' : '#FDB813'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Participation rate */}
          <div className="bg-[#1C2541] rounded-2xl border border-white/5 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#FDB813]" />
              <h3 className="font-serif text-base font-semibold text-white">Participation Rate</h3>
            </div>
            <p className="text-[11px] text-[#8D99AE] mb-4">Attendance ÷ Registrations × 100</p>

            {hasData ? (
              <div className="flex flex-col items-center flex-1 justify-center gap-3">
                <ParticipationGauge rate={selectedData!.participationRate} />
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">{selectedData!.event}</p>
                  <p className="text-xs text-[#8D99AE] mt-1">
                    {selectedData!.actualAttendance} / {selectedData!.totalRegistrations} attended
                  </p>
                  <div className={`mt-2 text-xs font-semibold px-3 py-1 rounded-full inline-block
                    ${selectedData!.participationRate >= 75
                      ? 'bg-[#22C55E]/10 text-[#22C55E]'
                      : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                    }`}>
                    {selectedData!.participationRate >= 75 ? '✓ Above 75% threshold' : '⚠ Below 75% threshold'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                  <FileBarChart2 className="w-6 h-6 text-[#8D99AE]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/60">No event selected</p>
                  <p className="text-xs text-[#8D99AE] mt-1 leading-relaxed max-w-[160px] mx-auto">
                    Click on an event in the chart to calculate its participation rate.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Insight card */}
        {hasData ? (
          <div className="bg-[#162035] rounded-2xl border border-[#FDB813]/20 p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FDB813]/10 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-[#FDB813]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <h3 className="font-serif text-base font-semibold text-white">AI Operational Insight</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4A90D9]/15 text-[#4A90D9] border border-[#4A90D9]/20 uppercase tracking-wider">
                    Deterministic
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FDB813]/15 text-[#FDB813] border border-[#FDB813]/20">
                    {selectedData!.event}
                  </span>
                </div>
                <p className="text-sm text-[#8D99AE] leading-relaxed">{selectedData!.aiInsight}</p>
                <div className="mt-4 grid sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Registrations', value: selectedData!.totalRegistrations, color: '#4A90D9' },
                    { label: 'Actual Attendance', value: selectedData!.actualAttendance, color: '#FDB813' },
                    { label: 'Participation Rate', value: `${selectedData!.participationRate}%`, color: '#22C55E' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] text-[#8D99AE]/70 uppercase tracking-wider mb-1">{label}</p>
                      <p className="text-xl font-bold" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#162035] rounded-2xl border border-white/5 p-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-[#8D99AE]" />
            </div>
            <h3 className="font-serif text-base font-semibold text-white mb-2">Insufficient Narrative Data</h3>
            <p className="text-sm text-[#8D99AE] max-w-md leading-relaxed">
              Complete event narrative reports must be submitted by Facilitators to calculate engagement insights. Select an event from the chart above once reports are available, or click any bar to view existing analytics.
            </p>
          </div>
        )}

        {/* Audit log */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-serif text-xl font-semibold text-white">Historical Audit Log</h3>
              <p className="text-xs text-[#8D99AE] mt-0.5">{filteredAudit.length} entries</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8D99AE]" />
              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="Search events or actions..."
                className="w-full sm:w-64 bg-[#1C2541] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#8D99AE]/60 focus:outline-none focus:ring-1 focus:ring-[#FDB813]/40 transition-all"
              />
            </div>
          </div>

          <div className="bg-[#1C2541] rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#162035] border-b border-white/5">
                    {['Event', 'Action', 'Coordinator', 'Timestamp'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[#8D99AE]/60">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredAudit.map(entry => (
                    <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-sm text-white font-medium">{entry.event}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${auditBadge(entry.action)}`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-[#8D99AE]">{entry.coordinator}</td>
                      <td className="px-5 py-3 text-sm text-[#8D99AE]">{entry.date} · {entry.time}</td>
                    </tr>
                  ))}
                  {filteredAudit.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-[#8D99AE]">
                        No results match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
