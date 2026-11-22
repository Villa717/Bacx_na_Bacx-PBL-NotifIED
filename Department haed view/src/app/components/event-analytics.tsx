import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Eye, MousePointerClick } from 'lucide-react';

const eventData = [
  {
    name: 'Cybersecurity Forensics Meetup',
    views: 3245,
    registrations: 187,
    engagement: 64.2,
    attendees: 142,
    ctr: 38.5,
  },
  {
    name: 'SWA Calculation Workshop',
    views: 2876,
    registrations: 234,
    engagement: 72.8,
    attendees: 198,
    ctr: 45.2,
  },
  {
    name: 'APC RAMS Basketball Open',
    views: 5432,
    registrations: 456,
    engagement: 81.5,
    attendees: 412,
    ctr: 52.8,
  },
  {
    name: 'Hackathon 2026',
    views: 4567,
    registrations: 289,
    engagement: 76.3,
    attendees: 245,
    ctr: 48.1,
  },
  {
    name: 'APC Sports Fest',
    views: 6834,
    registrations: 678,
    engagement: 88.7,
    attendees: 623,
    ctr: 61.4,
  },
];

const chartData = eventData.map((event) => ({
  name: event.name.split(' ')[0],
  Views: event.views,
  Registrations: event.registrations,
  Attendees: event.attendees,
}));

export function EventAnalytics() {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl text-[#E8EBE9] mb-2">Event Analytics</h2>
        <p className="text-[#9BA5A1]">Performance metrics across all events</p>
      </div>

      <div className="bg-[#284139] rounded-lg p-6 border border-[rgba(40,65,57,0.5)] mb-6">
        <h3 className="text-lg text-[#E8EBE9] mb-4">Event Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(40,65,57,0.3)" />
            <XAxis dataKey="name" stroke="#9BA5A1" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9BA5A1" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#284139',
                border: '1px solid rgba(40,65,57,0.5)',
                borderRadius: '8px',
                color: '#E8EBE9',
              }}
            />
            <Bar dataKey="Views" fill="#BB6830" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Registrations" fill="#4A9D7F" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Attendees" fill="#6DB399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-4">
        {eventData.map((event, index) => (
          <div
            key={index}
            className="bg-[#284139] rounded-lg p-6 border border-[rgba(40,65,57,0.5)]"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl text-[#E8EBE9] mb-1">{event.name}</h3>
                <div className="flex items-center gap-2 text-[#4A9D7F] text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>{event.engagement}% engagement rate</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#1F2D2A] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-[#BB6830]" />
                  <span className="text-xs text-[#9BA5A1]">Views</span>
                </div>
                <div className="text-2xl text-[#E8EBE9]">{event.views.toLocaleString()}</div>
              </div>

              <div className="bg-[#1F2D2A] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-[#BB6830]" />
                  <span className="text-xs text-[#9BA5A1]">Registrations</span>
                </div>
                <div className="text-2xl text-[#E8EBE9]">{event.registrations}</div>
              </div>

              <div className="bg-[#1F2D2A] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-[#BB6830]" />
                  <span className="text-xs text-[#9BA5A1]">Attendees</span>
                </div>
                <div className="text-2xl text-[#E8EBE9]">{event.attendees}</div>
              </div>

              <div className="bg-[#1F2D2A] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointerClick className="w-4 h-4 text-[#BB6830]" />
                  <span className="text-xs text-[#9BA5A1]">CTR</span>
                </div>
                <div className="text-2xl text-[#E8EBE9]">{event.ctr}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
