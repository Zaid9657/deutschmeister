import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import CourseTheme from './CourseTheme.jsx';
import { SkillIcon } from './SkillIcon.jsx';
import { useV2Strings } from './strings.js';
import { SKILL_LABEL } from '../../lib/course-v2/curriculum.js';
import { v2Paths } from '../../lib/course-v2/ids.js';

/** The level reference pages' paths (routes in src/App.jsx, inside the netlify.toml /course/* rewrite). */
export const referencePaths = {
  grammatik: (level) => `/course/${String(level || '').toLowerCase()}/grammatik`,
  wortschatz: (level) => `/course/${String(level || '').toLowerCase()}/wortschatz`,
};

/**
 * The frame of the two level reference pages — the book's back matter for the whole level
 * (/course/:level/grammatik, /course/:level/wortschatz). The course theme, and a sticky top bar in
 * the player's manner: the X back to the course home, and the two pages as tabs, the open one
 * marked (aria-current). Then the page's h1 and lead.
 */
export default function ReferenceShell({ level, page, title, lead = null, children }) {
  const [lang, t] = useV2Strings();
  const tab = (key, skill) => {
    const current = page === key;
    return (
      <Link
        to={referencePaths[key](level)}
        aria-current={current ? 'page' : undefined}
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 px-3 text-[0.9375rem] font-extrabold ${
          current ? 'border-course bg-course-wash text-course-ink' : 'border-game-line bg-white text-game-muted hover:bg-course-wash hover:text-course-ink'
        }`}
      >
        <SkillIcon skill={skill} className="h-4 w-4" />
        {SKILL_LABEL[skill][lang === 'de' ? 'de' : 'en']}
      </Link>
    );
  };
  return (
    <CourseTheme>
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <div className="sticky top-0 z-30 -mx-4 mb-5 border-b-2 border-game-line bg-course-ground px-4 pb-2.5 pt-3 sm:pt-5">
          <nav className="flex items-center gap-2" aria-label={title}>
            <Link
              to={v2Paths.home(level)}
              aria-label={t('player.home')}
              className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-game-locked-icon hover:bg-course-wash hover:text-game-muted"
            >
              <X className="h-7 w-7" strokeWidth={2.8} aria-hidden="true" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-wrap justify-end gap-2">
              {tab('grammatik', 'grammatik')}
              {tab('wortschatz', 'wortschatz')}
            </div>
          </nav>
        </div>
        <header className="mb-5">
          <h1 className="text-[1.625rem] font-extrabold leading-tight text-game-text sm:text-[2rem]">{title}</h1>
          {lead && <p className="mt-1.5 text-[1rem] font-semibold leading-snug text-game-muted">{lead}</p>}
        </header>
        {children}
      </div>
    </CourseTheme>
  );
}

/** The chapter jump list of a reference page: one square key per Kapitel, to its section's anchor. */
export function ChapterJump({ chapters, idPrefix = 'kapitel' }) {
  const [, t] = useV2Strings();
  const list = (chapters || []).filter((c) => c && c.nr != null);
  if (list.length < 2) return null;
  return (
    <nav className="mb-6" aria-label={t('ref.jump')}>
      <p className="mb-2 text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted" aria-hidden="true">{t('ref.jump')}</p>
      <ul className="flex flex-wrap gap-2">
        {list.map((c) => (
          <li key={c.nr}>
            <a
              href={`#${idPrefix}-${c.nr}`}
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border-2 border-b-4 border-game-line bg-white px-2 text-[1rem] font-extrabold tabular-nums text-course-ink hover:bg-course-wash"
            >
              <span className="sr-only">{t('player.unit', { n: c.nr })}</span>
              <span aria-hidden="true">{c.nr}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
