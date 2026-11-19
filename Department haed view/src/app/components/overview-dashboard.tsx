import { useState } from 'react';
import {
  ClipboardList, CheckCircle2, BookOpen, Users,
  ChevronLeft, ChevronRight, TrendingUp,
} from 'lucide-react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, format, isSameDay, addMonths, subMonths,
} from 'date-fns';

const DEMO_TODAY = new Date(2026, 7, 23);

const calendarEvents = [
  { date: new Date(2026, 7, 17), label: 'APC Foundation Day', color: '#FDB813' },
  { date: new Date(2026, 7, 22), label: 'Innovation Summit 2026', color: '#4A90D9' },
  { date: new Date(2026, 7, 28), label: 'Career Fair Spring', color: '#F59E0B' },
  { date: new Date(2026, 8, 3), label: 'SWA Computation Workshop', color: '#22C55E' },
  { date: new Date(2026, 8, 12), label: 'Sports Fest 2026', color: '#A78BFA' },
];

const recentActivity = [
  { id: 1, event: 'Hackathon 2026', action: 'Approved', actor: 'K. Salvana', time: '10:32 AM', date: 'Aug 23' },
  { id: 2, event: 'Cultural Night Showcase', action: 'Published', actor: 'K. Salvana', time: '9:15 AM', date: 'Aug 23' },
  { id: 3, event: 'Career Fair Spring', action: 'Revision Requested', actor: 'K. Salvana', time: '4:45 PM', date: 'Aug 22' },
  { id: 4, event: 'Innovation Summit 2026', action: 'Submitted', actor: 'CS Society', time: '2:20 PM', date: 'Aug 21' },
  { id: 5, event: 'Alumni Homecoming Night', action: 'Approved', actor: 'K. Salvana', time: '11:00 AM', date: 'Aug 20' },
  { id: 6, event: 'Coding Bootcamp: Python', action: 'Rejected', actor: 'K. Salvana', time: '3:30 PM', date: 'Aug 19' },
  { id: 7, event: 'APC Sports Fest 2026', action: 'Submitted', actor: 'Athletics Club', time: '1:15 PM', date: 'Aug 18' },
  { id: 8, event: 'Business Case Seminar', action: 'Approved', actor: 'K. Salvana', time: '9:00 AM', date: 'Aug 17' },
  { id: 9, event: 'SWA Workshop', action: 'Submitted', actor: 'SWA Office', time: '3:00 PM', date: 'Aug 16' },
  { id: 10, event: 'Engineering Expo 2026', action: 'Approved', actor: 'K. Salvana', time: '11:45 AM', date: 'Aug 15' },
];

const metrics = [
  {
    label: 'Pending Queue',
    value: '12',
    sub: 'proposals awaiting review',
    icon: ClipboardList,
    color: '#FDB813',
    trend: '+3 today',
    trendUp: false,
  },
  {
    label: 'Approved Events',
    value: '45',
    sub: 'scheduled this term',
    icon: CheckCircle2,
    color: '#22C55E',
    trend: '+8 this month',
    trendUp: true,
  },
  {
    label: 'Narrative Reports',
    value: '28',
    sub: 'submitted & complete',
    icon: BookOpen,
    color: '#4A90D9',
    trend: '4 pending submission',
    trendUp: true,
  },
  {
    label: 'Active Orgs',
    value: '34',
    sub: 'student orgs & facilitators',
    icon: Users,
    color: '#A78BFA',
    trend: '+2 registered',
    trendUp: true,
  },
];

function actionStyle(action: string) {
  switch (action) {
    case 'Approved': return 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20';
    case 'Published': return 'bg-[#4A90D9]/10 text-[#4A90D9] border border-[#4A90D9]/20';
    case 'Submitted': return 'bg-[#8D99AE]/10 text-[#8D99AE] border border-[#8D99AE]/20';
    case 'Revision Requested': return 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20';
    case 'Rejected': return 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20';
    default: return 'bg-white/5 text-white/60 border border-white/10';
  }
}

function CalendarWidget() {
  const [month, setMonth] = useState(new Date(2026, 7, 1));
  const start = startOfMonth(month);
  const days = eachDayOfInterval({ start, end: endOfMonth(month) });
  const offset = getDay(start);
  const monthKey = format(month, 'yyyy-MM');
  const visibleEvents = calendarEvents.filter(e => format(e.date, 'yyyy-MM') === monthKey);

  return (
    <div className="bg-[#1C2541] rounded-2xl border border-white/5 p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-base font-semibold text-white">{format(month, 'MMMM yyyy')}</h3>
        <div className="flex gap-1">
          {[
            { icon: ChevronLeft, fn: () => setMonth(subMonths(month, 1)) },
            { icon: ChevronRight, fn: () => setMonth(addMonths(month, 1)) },
          ].map(({ icon: Icon, fn }, i) => (
            <button
              key={i}
              onClick={fn}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8D99AE] hover:text-white hover:bg-white/5 transition-colors"
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-[#8D99AE]/60 uppercase tracking-wide py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
        {days.map(day => {
          const isToday = isSameDay(day, DEMO_TODAY);
          const ev = calendarEvents.find(e => isSameDay(e.date, day));
          return (
            <div key={format(day, 'yyyyMMdd')} className="flex flex-col items-center py-0.5">
              <div className={`
                w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-colors
                ${isToday
                  ? 'bg-[#FDB813] text-[#0B132B] font-bold shadow-[0_0_12px_rgba(253,184,19,0.4)]'
                  : ev
                    ? 'text-white'
                    : 'text-[#8D99AE] hover:text-white'
                }
              `}>
                {format(day, 'd')}
              </div>
              {ev && (
                <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: ev.color }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Event list */}
      <div className="border-t border-white/5 pt-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8D99AE]/50">
          Scheduled This Month
        </p>
        {visibleEvents.length === 0 ? (
          <p className="text-xs text-[#8D99AE]">No events scheduled this month.</p>
        ) : (
          visibleEvents.map((ev, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{ev.label}</p>
                <p className="text-[11px] text-[#8D99AE]">{format(ev.date, 'EEEE, MMM d')}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function OverviewDashboard() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
        {/* Page header */}
        <div>
          <h2 className="font-serif text-2xl lg:text-3xl font-semibold text-white">Overview Dashboard</h2>
          <p className="text-sm text-[#8D99AE] mt-1">
            {format(DEMO_TODAY, "EEEE, MMMM d, yyyy")} &mdash; SAO Admin Coordinator Portal
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {metrics.map(({ label, value, sub, icon: Icon, color, trend, trendUp }) => (
            <div
              key={label}
              className="bg-[#1C2541] rounded-2xl border border-white/5 p-5 flex flex-col gap-4 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}18` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className={`flex items-center gap-1 text-[11px] font-medium ${trendUp ? 'text-[#22C55E]' : 'text-[#F59E0B]'}`}>
                  <TrendingUp className={`w-3 h-3 ${!trendUp ? 'rotate-180' : ''}`} />
                  {trend}
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">{value}</div>
                <div className="text-[11px] text-[#8D99AE] mt-0.5 leading-tight">{label}</div>
                <div className="text-[10px] text-[#8D99AE]/60 mt-0.5">{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar + Activity split */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <CalendarWidget />
          </div>

          {/* Activity feed */}
          <div className="lg:col-span-2">
            <div className="bg-[#1C2541] rounded-2xl border border-white/5 flex flex-col" style={{ maxHeight: 480 }}>
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <h3 className="font-serif text-base font-semibold text-white">Recent Activity</h3>
                <span className="text-[11px] text-[#8D99AE] bg-white/5 px-2 py-1 rounded-full">
                  {recentActivity.length} entries
                </span>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-white/[0.04]">
                {recentActivity.map(({ id, event, action, actor, time, date }) => (
                  <div key={id} className="px-5 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-xs font-medium text-white leading-snug flex-1 min-w-0 truncate">{event}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${actionStyle(action)}`}>
                        {action}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#8D99AE]">
                      <span>{actor}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-[#8D99AE]/40 flex-shrink-0" />
                      <span>{date}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-[#8D99AE]/40 flex-shrink-0" />
                      <span>{time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
