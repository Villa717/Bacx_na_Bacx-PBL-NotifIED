import { useState } from 'react';
import { Calendar, Users, MapPin, Clock, CheckCircle2 } from 'lucide-react';

const initialEvents = [
  {
    id: 1,
    title: 'APC Foundation Day',
    organization: 'Tech-savvy college orgs',
    date: 'June 15, 2026',
    time: '9:00 AM - 5:00 PM',
    location: 'Main Campus Auditorium',
    attendees: 450,
  },
  {
    id: 2,
    title: 'Innovation Summit 2026',
    organization: 'Computer Science Society',
    date: 'June 22, 2026',
    time: '1:00 PM - 6:00 PM',
    location: 'Innovation Hub',
    attendees: 200,
  },
  {
    id: 3,
    title: 'Career Fair Spring',
    organization: 'Career Development Office',
    date: 'June 28, 2026',
    time: '10:00 AM - 4:00 PM',
    location: 'Multi-Purpose Hall',
    attendees: 600,
  },
];

export function ApprovalQueue() {
  const [events, setEvents] = useState(initialEvents);
  const [approvedEvents, setApprovedEvents] = useState<number[]>([]);

  const handleApprove = (eventId: number) => {
    setApprovedEvents([...approvedEvents, eventId]);
    setTimeout(() => {
      setEvents(events.filter((e) => e.id !== eventId));
      setApprovedEvents(approvedEvents.filter((id) => id !== eventId));
    }, 2000);
  };

  const handleReject = (eventId: number) => {
    setEvents(events.filter((e) => e.id !== eventId));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="mb-6 lg:mb-8">
        <h2 className="text-2xl sm:text-3xl text-[#D4C5A0] mb-2">Pending Event Approvals</h2>
        <p className="text-sm sm:text-base text-[#A89B7E]">{events.length} submissions awaiting review</p>
      </div>

      <div className="space-y-4">
        {events.map((event) => {
          const isApproved = approvedEvents.includes(event.id);
          return (
            <div
              key={event.id}
              className={`bg-[#284139] rounded-lg p-4 sm:p-6 border border-[rgba(40,65,57,0.5)] transition-all ${
                isApproved ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl text-[#D4C5A0] mb-1 break-words">{event.title}</h3>
                  <div className="flex items-center gap-2 text-[#A89B7E] text-sm">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{event.organization}</span>
                  </div>
                </div>
                {isApproved ? (
                  <div className="flex items-center gap-2 text-[#8FA968] bg-[#1F2D2A] px-4 py-2 rounded-lg self-start">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">Approved</span>
                  </div>
                ) : (
                  <div className="flex gap-2 sm:gap-3 self-start">
                    <button
                      onClick={() => handleApprove(event.id)}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-[#BB6830] text-white rounded-lg hover:bg-[#A55A29] transition-colors text-sm sm:text-base"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(event.id)}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 border-2 border-[#A89B7E] text-[#A89B7E] rounded-lg hover:border-[#D4C5A0] hover:text-[#D4C5A0] transition-colors text-sm sm:text-base"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 text-[#A89B7E] text-sm">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2 text-[#A89B7E] text-sm">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2 text-[#A89B7E] text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[rgba(40,65,57,0.5)]">
                <div className="flex items-center gap-2 text-[#A89B7E] text-sm">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>Expected Attendance: {event.attendees.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
