import { LayoutDashboard, ClipboardCheck, BarChart3, Settings, X } from 'lucide-react';
import type { NavView } from '../App';

const navItems: { label: NavView; icon: typeof LayoutDashboard; badge?: number }[] = [
  { label: 'Overview Dashboard', icon: LayoutDashboard },
  { label: 'Paper Approval Queue', icon: ClipboardCheck, badge: 12 },
  { label: 'Institutional Analytics', icon: BarChart3 },
  { label: 'System Settings', icon: Settings },
];

interface SidebarProps {
  activeView: NavView;
  onNavigate: (view: NavView) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarNavigation({ activeView, onNavigate, isOpen, onClose }: SidebarProps) {
  const handleNav = (view: NavView) => { onNavigate(view); onClose(); };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-[#090F1F] flex flex-col
        border-r border-white/[0.04]
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand header */}
        <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="font-serif text-xl font-semibold text-white tracking-tight">Notifi</span>
              <span className="font-serif text-xl font-bold text-[#FDB813] tracking-tight">ED</span>
            </div>
            <p className="text-[11px] text-[#8D99AE] mt-0.5 tracking-wide">Asia Pacific College</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[#8D99AE] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation label */}
        <div className="px-6 pt-6 pb-2">
          <p className="text-[10px] font-semibold text-[#8D99AE]/60 uppercase tracking-widest">Navigation</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-0.5">
          {navItems.map(({ label, icon: Icon, badge }) => {
            const active = activeView === label;
            return (
              <button
                key={label}
                onClick={() => handleNav(label)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150
                  ${active
                    ? 'bg-[#FDB813] text-[#0B132B]'
                    : 'text-[#8D99AE] hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-[#0B132B]' : ''}`} />
                <span className="flex-1 text-sm font-medium">{label}</span>
                {badge && (
                  <span className={`
                    text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                    ${active ? 'bg-[#0B132B]/20 text-[#0B132B]' : 'bg-[#FDB813]/15 text-[#FDB813]'}
                  `}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-6 border-t border-white/[0.04]" />

        {/* User profile footer */}
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FDB813] to-[#E0A96D] flex items-center justify-center flex-shrink-0">
              <span className="text-[#0B132B] text-xs font-bold">KS</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Kamille Salvana</p>
              <p className="text-[11px] text-[#8D99AE] truncate">SAO Admin Coordinator</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0" title="Online" />
          </div>
        </div>
      </aside>
    </>
  );
}
