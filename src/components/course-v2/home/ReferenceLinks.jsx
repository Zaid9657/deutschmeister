import { Link } from 'react-router-dom';
import { SkillIcon } from '../SkillIcon.jsx';

// The level's two reference pages (pathModel.js referenceLinks), as chunky secondary
// tiles: „Grammatik-Übersicht" (/course/<level>/grammatik) and „Wortliste · N Wörter"
// (/course/<level>/wortschatz). Shown under the daily-goal card and in the plan — a
// textbook's grammar appendix and word list, one tap away.
export default function ReferenceLinks({ links = [], className = '' }) {
  if (!links.length) return null;
  return (
    <ul className={`grid grid-cols-2 gap-2.5 ${className}`}>
      {links.map((l) => (
        <li key={l.key}>
          <Link
            to={l.href}
            aria-label={l.label}
            className="flex h-full min-h-16 items-center gap-2.5 rounded-2xl border-2 border-b-4 border-game-line bg-white p-3 transition-transform duration-100 hover:bg-course-wash active:translate-y-0.5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-course-wash" aria-hidden="true">
              <SkillIcon skill={l.skill} className="h-5 w-5 text-course-ink" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.9375rem] font-black leading-tight [hyphens:auto]" lang="de">{l.title}</span>
              <span className="mt-0.5 block text-sm font-bold leading-snug text-game-muted">{l.detail}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
