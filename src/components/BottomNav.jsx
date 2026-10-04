import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Headphones, GraduationCap, BookMarked, User, Route } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { fetchDeckCounts } from '../services/srsService';
import { courseHomeFor } from '../lib/courseEntry.js';
import { chromeFor } from '../lib/chrome.js';

// Mobile bottom navigation (renovation Phase 4b) — the app previously offered
// phones only a hamburger accordion of 12+ links. Thumb-reach tabs for
// signed-in users; hidden on desktop and for anonymous visitors (they get the
// marketing nav). Prüfung is Astro-served, hence the full-load <a>.
//
// Wave 0 (the free A1.1 front door): the Home tab pointed at /dashboard for
// everyone, and /dashboard sits behind SubscriptionGuard — so a free learner's
// Home tab was a paywall, and no tab reached the guided course at all. Now:
//   * Kurs → the learner's course home (src/lib/courseEntry.js: their placement
//     level when it has a course they may open, else the free /course/a1.1);
//   * Home → /dashboard only when the subscription/trial opens it; a free
//     learner's Home IS the course, so for them the two tabs collapse into one
//     (five tabs), and a Pro/trial learner gets six.
//
// v3 "Die Linie": the bar stands on the night ground, like the footer it sits
// under and the Astro menu sheet. The current tab is the lit stop: the line's
// yellow, as label and as a bar along its top edge (12.8:1 on nacht; yellow is
// never text on paper). The in-flow spacer takes the footer's ground on routes
// that render the footer, so no paper band shows under it on a phone.
const buildTabs = ({ hasAccess, courseHome }) => {
  const course = { key: 'course', label: 'Kurs', href: courseHome, Icon: Route };
  const home = { key: 'home', label: 'Home', href: '/dashboard', Icon: LayoutDashboard };
  return [
    ...(hasAccess ? [home, course] : [course]),
    { key: 'practice', label: 'Üben', href: '/listening/', Icon: Headphones },
    { key: 'exams', label: 'Prüfung', href: '/pruefung/', Icon: GraduationCap, fullLoad: true },
    { key: 'words', label: 'Wörter', href: '/vocabulary', Icon: BookMarked },
    { key: 'profile', label: 'Profil', href: '/profile', Icon: User },
  ];
};

const BottomNav = () => {
  const { user } = useAuth();
  const { hasAccess, hasLevelAccess, profile } = useSubscription();
  const { pathname } = useLocation();
  const [dueCount, setDueCount] = useState(0);

  // Due-card badge on the Wörter tab — the in-app reason to come back today.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetchDeckCounts(user.id).then(({ due }) => { if (alive) setDueCount(due); });
    return () => { alive = false; };
  }, [user, pathname]);

  if (!user) return null;

  const tabs = buildTabs({ hasAccess, courseHome: courseHomeFor({ level: profile?.current_level, hasLevelAccess }) });

  // chromeFor 'full' is exactly the routes App.jsx gives the (night) Footer.
  const spacer = chromeFor(pathname) === 'full' ? 'bg-nacht' : '';

  return (
    <>
    {/* In-flow spacer so the fixed bar never covers page-end content */}
    <div className={`h-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden ${spacer}`} aria-hidden="true" />
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-nacht-rule bg-nacht/95 pb-[env(safe-area-inset-bottom)] text-nacht-muted backdrop-blur-md"
      data-ground="nacht"
      aria-label="App navigation"
    >
      <div className={tabs.length === 6 ? 'grid grid-cols-6' : 'grid grid-cols-5'}>
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href.replace(/\/$/, '')}/`);
          const cls = `relative flex flex-col items-center gap-0.5 py-2.5 text-[0.6875rem] font-semibold transition-colors ${
            active ? 'text-linie' : 'hover:text-nacht-text'
          }`;
          const inner = (
            <>
              {active && <span className="absolute inset-x-3 top-0 h-[3px] rounded-b-pill bg-linie" aria-hidden="true" />}
              <span className="relative">
                <tab.Icon size={20} strokeWidth={active ? 2.4 : 2} />
                {tab.key === 'words' && dueCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-linie text-linie-ink text-[0.625rem] font-bold flex items-center justify-center">
                    {dueCount > 99 ? '99+' : dueCount}
                  </span>
                )}
              </span>
              {tab.label}
            </>
          );
          return tab.fullLoad ? (
            <a key={tab.key} href={tab.href} className={cls} aria-current={active ? 'page' : undefined}>{inner}</a>
          ) : (
            <Link key={tab.key} to={tab.href} className={cls} aria-current={active ? 'page' : undefined}>{inner}</Link>
          );
        })}
      </div>
    </nav>
    </>
  );
};

export default BottomNav;
