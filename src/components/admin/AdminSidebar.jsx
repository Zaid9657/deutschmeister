// The dark rail. Collapse state lives in the shell (survives navigation) and
// is seeded EXPANDED, never from viewport width. A `null` badge count (the
// count failed) renders NO badge — never a zero.
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, Activity, BookOpen, LifeBuoy, Megaphone, FileText,
  HeartPulse, ScrollText, Settings, ChevronLeft, ChevronRight, ArrowLeft,
} from 'lucide-react';
import Logo from '../Logo';

export const ADMIN_NAV = [
  { label: 'Übersicht', href: '/admin', Icon: LayoutDashboard, ready: true, capability: null },
  { label: 'Nutzer', href: '/admin/users', Icon: Users, ready: true, capability: 'directory.read' },
  { label: 'Abonnements', href: '/admin/operations', Icon: CreditCard, ready: true, badgeKey: 'payments', capability: 'finance.read' },
  { label: 'Nutzung', href: '/admin/usage', Icon: Activity, ready: true, capability: 'usage.read' },
  { label: 'Lerninhalte', href: '/admin/content', Icon: BookOpen, ready: true, capability: 'content.read' },
  { label: 'Support', href: '/admin/support', Icon: LifeBuoy, ready: true, badgeKey: 'support', capability: 'support.read' },
  { label: 'Marketing', href: '/admin/marketing', Icon: Megaphone, ready: true, capability: 'marketing.read' },
  { label: 'Berichte', href: '/admin/reports', Icon: FileText, ready: true, capability: 'reports.read' },
  { label: 'Systemstatus', href: '/admin/monitoring', Icon: HeartPulse, ready: true, capability: 'status.read' },
  { label: 'Prüfprotokoll', href: '/admin/audit', Icon: ScrollText, ready: true, capability: 'audit.read' },
  { label: 'Einstellungen', href: '/admin/settings', Icon: Settings, ready: true, capability: 'settings.read' },
];

export default function AdminSidebar({ collapsed, onToggle, badges = {}, can }) {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Admin-Navigation"
      className={`hidden shrink-0 flex-col bg-ink text-white/80 transition-[width] duration-150 lg:flex ${collapsed ? 'w-[4.5rem]' : 'w-[15.5rem]'}`}
    >
      <div className={`flex items-center gap-3 border-b border-white/10 px-4 py-4 ${collapsed ? 'justify-center px-0' : ''}`}>
        <Logo size={28} showWordmark={false} to="/admin" />
        {collapsed ? null : (
          <div className="min-w-0">
            <div className="truncate font-display text-base font-semibold text-white">Deutsch Meister</div>
            <div className="text-[0.625rem] font-bold uppercase tracking-[0.13em] text-white/50">Admin</div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {ADMIN_NAV.map(({ label, href, Icon, ready, badgeKey, capability }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
          const allowed = !capability || (can ? can(capability) : true);
          const count = badgeKey ? badges[badgeKey] : null;
          const showBadge = typeof count === 'number' && count > 0;
          const disabled = !ready || !allowed;
          const title = !ready ? `${label} — noch nicht verfügbar` : !allowed ? `${label} — keine Berechtigung` : label;
          return (
            <NavLink
              key={href}
              to={href}
              end={href === '/admin'}
              aria-disabled={disabled}
              aria-current={active ? 'page' : undefined}
              title={title}
              onClick={(e) => disabled && e.preventDefault()}
              className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active ? 'bg-white/10 font-semibold text-white' : 'hover:bg-white/5'
              } ${disabled ? 'cursor-not-allowed opacity-40' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <span className="relative">
                <Icon size={18} aria-hidden="true" />
                {showBadge && collapsed ? <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-viz-error" /> : null}
              </span>
              {collapsed ? null : <span className="min-w-0 flex-1 truncate">{label}</span>}
              {showBadge && !collapsed ? (
                <span className="min-w-[1.25rem] rounded-full bg-viz-error px-1.5 py-0.5 text-center text-[0.6875rem] font-bold text-white">{count}</span>
              ) : null}
            </NavLink>
          );
        })}
      </div>

      <div className="border-t border-white/10 p-2">
        <NavLink to="/dashboard" className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-xs hover:bg-white/5 ${collapsed ? 'justify-center px-0' : ''}`}>
          <ArrowLeft size={16} aria-hidden="true" />
          {collapsed ? null : 'Zur App'}
        </NavLink>
        <button
          type="button"
          onClick={onToggle}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs hover:bg-white/5 ${collapsed ? 'justify-center px-0' : ''}`}
          aria-label={collapsed ? 'Menü ausklappen' : 'Menü einklappen'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {collapsed ? null : 'Menü einklappen'}
        </button>
      </div>
    </nav>
  );
}

/**
 * Below the lg breakpoint the rail would eat the phone; the same registry
 * renders as a horizontally scrolling icon strip under the app navbar. Same
 * badge rule: a null count renders no badge.
 */
export function AdminMobileNav({ badges = {}, can }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Admin-Navigation (mobil)" className="flex gap-1 overflow-x-auto border-b border-white/10 bg-ink px-2 py-1.5 lg:hidden">
      {ADMIN_NAV.map(({ label, href, Icon, ready, badgeKey, capability }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
        const allowed = !capability || (can ? can(capability) : true);
        const count = badgeKey ? badges[badgeKey] : null;
        const showBadge = typeof count === 'number' && count > 0;
        const disabled = !ready || !allowed;
        return (
          <NavLink
            key={href}
            to={href}
            end={href === '/admin'}
            aria-disabled={disabled}
            aria-label={label}
            title={label}
            onClick={(e) => disabled && e.preventDefault()}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${active ? 'bg-white/10 font-semibold text-white' : 'text-white/75'} ${disabled ? 'opacity-40' : ''}`}
          >
            <Icon size={16} aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
            {showBadge ? <span className="ml-0.5 rounded-full bg-viz-error px-1.5 text-[0.625rem] font-bold text-white">{count}</span> : null}
          </NavLink>
        );
      })}
    </nav>
  );
}
