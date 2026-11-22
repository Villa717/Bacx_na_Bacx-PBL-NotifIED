import { Menu, Bell } from 'lucide-react';
import type { NavView } from '../App';

interface MobileHeaderProps {
  onMenuClick: () => void;
  activeView: NavView;
}

export function MobileHeader({ onMenuClick, activeView }: MobileHeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-[#090F1F]/95 backdrop-blur-md border-b border-white/[0.04] px-4 py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#8D99AE] hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="font-serif text-base font-semibold text-white">Notifi</span>
              <span className="font-serif text-base font-bold text-[#FDB813]">ED</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xs text-[#8D99AE] hidden sm:block">{activeView}</p>
          <button className="w-9 h-9 flex items-center justify-center rounded-xl text-[#8D99AE] hover:text-white hover:bg-white/5 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FDB813] rounded-full" />
          </button>
        </div>
      </div>
    </header>
  );
}
