import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Home, ListOrdered } from 'lucide-react';
import { SkillIcon } from '../SkillIcon.jsx';

// The learn screen's bottom tab bar (Duolingo's): four equal tabs, an icon above a small
// label, the active one in the course colour. „Lernen" is this page (aria-current; a tap
// scrolls back to the current step), „Kursplan" opens the course plan as a full-screen
// sheet (#kursplan — the back button closes it), „Grammatik" and „Wörter" open the level's
// reference pages (pathModel.referenceLinks). The textbook stays one tap deep, never on
// the path itself. `lifted`: a signed-in learner below lg also has the app's BottomNav
// (fixed, h-16) — this bar then sits on top of it rather than under it.

const TAB = 'flex min-h-[3.75rem] w-full flex-col items-center justify-center gap-0.5 px-1 pb-1.5 pt-2 text-[0.75rem] font-black leading-none';
const ICON_BOX = 'flex h-8 w-12 items-center justify-center rounded-xl border-2';
const ON = `${ICON_BOX} border-course-soft bg-course-wash text-course-ink`;
const OFF = `${ICON_BOX} border-transparent text-game-muted`;

const TabBar = forwardRef(function TabBar({ links = [], kursplanOpen = false, onLernen, onKursplan, lifted = false }, kursplanRef) {
  const grammatik = links.find((l) => l.key === 'grammatik');
  const woerter = links.find((l) => l.key === 'wortschatz');
  return (
    <nav
      aria-label="Kurs"
      data-tab-bar
      className={`fixed inset-x-0 z-40 border-t-2 border-game-line bg-white ${
        lifted ? 'bottom-16 lg:bottom-0' : 'bottom-0 pb-[env(safe-area-inset-bottom)]'
      }`}
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        <li>
          <button type="button" onClick={onLernen} aria-current="page" className={`${TAB} text-course-ink`}>
            <span className={ON} aria-hidden="true"><Home className="h-5 w-5" strokeWidth={2.6} /></span>
            Lernen
          </button>
        </li>
        <li>
          <button
            ref={kursplanRef}
            type="button"
            onClick={onKursplan}
            aria-haspopup="dialog"
            aria-expanded={kursplanOpen}
            className={`${TAB} ${kursplanOpen ? 'text-course-ink' : 'text-game-muted hover:text-course-ink'}`}
          >
            <span className={kursplanOpen ? ON : OFF} aria-hidden="true"><ListOrdered className="h-5 w-5" strokeWidth={2.6} /></span>
            Kursplan
          </button>
        </li>
        {grammatik && (
          <li>
            <Link to={grammatik.href} className={`${TAB} text-game-muted hover:text-course-ink`}>
              <span className={OFF} aria-hidden="true"><SkillIcon skill="grammatik" className="h-5 w-5" /></span>
              Grammatik
            </Link>
          </li>
        )}
        {woerter && (
          <li>
            <Link to={woerter.href} className={`${TAB} text-game-muted hover:text-course-ink`}>
              <span className={OFF} aria-hidden="true"><SkillIcon skill="wortschatz" className="h-5 w-5" /></span>
              Wörter
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
});

export default TabBar;
