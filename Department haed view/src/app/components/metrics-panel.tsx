import { Eye, Bookmark, MousePointerClick, TrendingUp } from 'lucide-react';
import * as Progress from '@radix-ui/react-progress';

const metrics = [
  {
    id: 1,
    label: 'Event Views',
    value: 2847,
    change: '+12%',
    changeLabel: 'from last week',
    progress: 68,
    icon: Eye,
  },
  {
    id: 2,
    label: 'Saves & Bookmarks',
    value: 1234,
    change: '+8%',
    changeLabel: 'from last week',
    progress: 45,
    icon: Bookmark,
  },
  {
    id: 3,
    label: 'Click-Through Rate',
    value: '43.5%',
    change: '+5.2%',
    changeLabel: 'from last week',
    progress: 87,
    icon: MousePointerClick,
  },
];

export function MetricsPanel() {
  return (
    <div className="w-full lg:w-96 bg-[#0F1514] lg:border-l border-[rgba(40,65,57,0.3)] p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg sm:text-xl text-[#E8EBE9] mb-1">Digital Engagement</h2>
        <p className="text-xs sm:text-sm text-[#9BA5A1]">Real-time analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.id}
              className="bg-[#284139] rounded-lg p-4 sm:p-5 border border-[rgba(40,65,57,0.5)]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-4 h-4 text-[#BB6830] flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-[#9BA5A1] truncate">{metric.label}</span>
                </div>
                <div className="flex items-center gap-1 text-[#4A9D7F] flex-shrink-0 ml-2">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs">{metric.change}</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-2xl sm:text-3xl text-[#E8EBE9] mb-1">
                  {typeof metric.value === 'number'
                    ? metric.value.toLocaleString()
                    : metric.value}
                </div>
                <p className="text-xs text-[#9BA5A1]">{metric.changeLabel}</p>
              </div>

              <Progress.Root
                className="relative overflow-hidden bg-[#1F2D2A] rounded-full h-1"
                value={metric.progress}
              >
                <Progress.Indicator
                  className="w-full h-full bg-[#BB6830] transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(-${100 - metric.progress}%)` }}
                />
              </Progress.Root>
            </div>
          );
        })}
      </div>

      <div className="mt-6 sm:mt-8 bg-[#284139] rounded-lg p-4 sm:p-5 border border-[rgba(40,65,57,0.5)]">
        <h3 className="text-sm text-[#E8EBE9] mb-3">Engagement Trend</h3>
        <div className="flex items-end gap-1 h-20 sm:h-24">
          {[45, 52, 48, 63, 58, 71, 68].map((height, index) => (
            <div
              key={index}
              className="flex-1 bg-[#BB6830] rounded-t"
              style={{ height: `${height}%`, opacity: index === 6 ? 1 : 0.6 }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-[#9BA5A1]">Mon</span>
          <span className="text-xs text-[#9BA5A1]">Sun</span>
        </div>
      </div>
    </div>
  );
}
