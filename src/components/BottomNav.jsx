import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Headphones, GraduationCap, BookMarked, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Mobile bottom navigation (renovation Phase 4b) — the app previously offered
// phones only a hamburger accordion of 12+ links. Five thumb-reach tabs for
// signed-in users; hidden on desktop and for anonymous visitors (they get the
// marketing nav). Prüfung is Astro-served, hence the full-load <a>.
const TABS = [
  { key: 'home', label: 'Home', href: '/dashboard', Icon: LayoutDashboard },
  { key: 'practice', label: 'Üben', href: '/listening/', Icon: Headphones },
  { key: 'exams', label: 'Prüfung', href: '/pruefung/', Icon: GraduationCap, fullLoad: true },
  { key: 'words', label: 'Wörter', href: '/vocabulary', Icon: BookMarked },
  { key: 'profile', label: 'Profil', href: '/profile', Icon: User },
];

const BottomNav = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;

  return (
    <>
    {/* In-flow spacer so the fixed bar never covers page-end content */}
    <div className="h-16 lg:hidden" aria-hidden="true" />
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-paper/95 backdrop-blur-md border-t border-rule"
      aria-label="App navigation"
    >
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href.replace(/\/$/, '')}/`);
          const cls = `flex flex-col items-center gap-0.5 py-2.5 text-[0.6875rem] font-semibold transition-colors ${
            active ? 'text-siegel' : 'text-graphite hover:text-ink'
          }`;
          const inner = (
            <>
              <tab.Icon size={20} strokeWidth={active ? 2.4 : 2} />
              {tab.label}
            </>
          );
          return tab.fullLoad ? (
            <a key={tab.key} href={tab.href} className={cls}>{inner}</a>
          ) : (
            <Link key={tab.key} to={tab.href} className={cls}>{inner}</Link>
          );
        })}
      </div>
    </nav>
    </>
  );
};

export default BottomNav;
