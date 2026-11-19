import { Send, Users, Bell, MessageSquare } from 'lucide-react';

const audienceSegments = [
  { name: 'All Students', count: 3842, active: true },
  { name: 'Computer Science', count: 876, active: false },
  { name: 'Engineering', count: 1234, active: false },
  { name: 'Business Administration', count: 945, active: false },
  { name: 'Event Organizers', count: 187, active: false },
];

export function BroadcastingTools() {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl text-[#E8EBE9] mb-2">Audience Broadcasting Tools</h2>
        <p className="text-[#9BA5A1]">Send notifications and announcements</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#284139] rounded-lg p-6 border border-[rgba(40,65,57,0.5)]">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#BB6830]" />
            <h3 className="text-lg text-[#E8EBE9]">Select Audience</h3>
          </div>

          <div className="space-y-2">
            {audienceSegments.map((segment) => (
              <label
                key={segment.name}
                className="flex items-center justify-between p-3 bg-[#1F2D2A] rounded-lg cursor-pointer hover:bg-[#253630] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked={segment.active}
                    className="w-4 h-4 accent-[#BB6830]"
                  />
                  <span className="text-[#E8EBE9] text-sm">{segment.name}</span>
                </div>
                <span className="text-[#9BA5A1] text-xs">
                  {segment.count.toLocaleString()} users
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-[#284139] rounded-lg p-6 border border-[rgba(40,65,57,0.5)]">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-[#BB6830]" />
            <h3 className="text-lg text-[#E8EBE9]">Compose Message</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#9BA5A1] mb-2">Title</label>
              <input
                type="text"
                placeholder="Announcement title"
                className="w-full bg-[#1F2D2A] text-[#E8EBE9] px-4 py-2 rounded-lg border border-[rgba(40,65,57,0.5)] focus:border-[#BB6830] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9BA5A1] mb-2">Message</label>
              <textarea
                rows={6}
                placeholder="Write your message here..."
                className="w-full bg-[#1F2D2A] text-[#E8EBE9] px-4 py-2 rounded-lg border border-[rgba(40,65,57,0.5)] focus:border-[#BB6830] focus:outline-none resize-none"
              />
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-[#BB6830] text-white px-6 py-3 rounded-lg hover:bg-[#A55A29] transition-colors">
              <Send className="w-4 h-4" />
              <span>Send Broadcast</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-[#284139] rounded-lg p-6 border border-[rgba(40,65,57,0.5)]">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-[#BB6830]" />
          <h3 className="text-lg text-[#E8EBE9]">Recent Broadcasts</h3>
        </div>

        <div className="space-y-3">
          {[
            { title: 'APC Foundation Day Registration Open', sent: '2 hours ago', recipients: 3842 },
            { title: 'Hackathon 2026 Reminder', sent: '1 day ago', recipients: 876 },
            { title: 'Sports Fest Schedule Update', sent: '2 days ago', recipients: 3842 },
          ].map((broadcast, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-[#1F2D2A] rounded-lg"
            >
              <div>
                <div className="text-[#E8EBE9] text-sm font-medium">{broadcast.title}</div>
                <div className="text-[#9BA5A1] text-xs mt-1">
                  Sent to {broadcast.recipients.toLocaleString()} users
                </div>
              </div>
              <div className="text-[#9BA5A1] text-xs">{broadcast.sent}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
