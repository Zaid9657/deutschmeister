import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, ChevronRight, MessagesSquare } from 'lucide-react';
import RuleCardView from './RuleCardView.jsx';
import WordList, { SayButton } from './WordList.jsx';
import { SkillIcon } from './SkillIcon.jsx';
import { useV2Strings } from './strings.js';
import { SKILL_LABEL } from '../../lib/course-v2/curriculum.js';

// The parts of the Kapitel page — since round 3 the opt-in guide (UnitIntro.jsx, `?view=guide`): a row
// of the table of contents and the back matter — Grammatik, Wortschatz, Redemittel — as the Lehrwerke
// print them at the end of a chapter.

const EYEBROW = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
// a section heading of the guide (UnitIntro.jsx uses the same)
const SECTION_H = 'text-[0.8125rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';

/**
 * The other skills of a TOC entry as ONE quiet line („Wortschatz · Üben · Sprechen") — spans, not a
 * list: the row is one tap target. Round 3 made them plain text (they were bordered chips with icons,
 * four to a row), so the guide reads calm.
 */
function SkillTags({ skills, lang }) {
  if (!skills.length) return null;
  return (
    <span className="mt-1.5 block text-[0.8125rem] font-bold leading-snug text-game-muted">
      {skills.map((k) => (SKILL_LABEL[k] && SKILL_LABEL[k][lang === 'de' ? 'de' : 'en']) || k).join(' · ')}
    </span>
  );
}

/**
 * One entry of the table of contents: a badge (the section letter A/B/C, or the skill icon of
 * Prüfungstraining, Sprechen, Schreiben, Kapiteltest, Einstieg), the title, what the section works
 * on (lines: „Hören: Im Kurs: Wie heißen Sie?", „Grammatik: Präsens"), the other skills in one quiet line,
 * tasks and minutes, and its state — done ✓, current („Jetzt"), open ›. The whole row is ONE
 * button (its label is the title plus the state for screen readers); nothing inside it is a list
 * or another control.
 */
export function TocRow({ letter = null, icon = null, eyebrow = null, title, lines = [], skills = [], meta = null, state = 'open', onOpen, lang }) {
  const [, t] = useV2Strings();
  const done = state === 'done';
  const current = state === 'current';
  return (
    <li className="border-t-2 border-game-line first:border-t-0">
      <button
        type="button"
        onClick={onOpen}
        aria-current={current ? 'step' : undefined}
        className={`flex min-h-14 w-full items-start gap-3 px-3.5 py-3.5 text-left transition-colors duration-100 hover:bg-course-wash motion-reduce:transition-none sm:px-4 ${current ? 'bg-course-wash' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-[1.3125rem] font-extrabold ${
            done ? 'border-game-right bg-game-right-wash text-game-right-ink' : current ? 'border-course-edge bg-course text-white' : 'border-game-line bg-white text-course-ink'
          }`}
        >
          {letter || <SkillIcon skill={icon} className="h-5 w-5" />}
        </span>
        <span className="min-w-0 flex-1">
          {eyebrow && <span className={`block ${EYEBROW}`}>{eyebrow}</span>}
          <span className="block text-[1.0625rem] font-extrabold leading-snug text-game-text [hyphens:auto]" lang="de">{title}</span>
          {lines.map((l) => (
            <span key={`${l.skill}-${l.text}`} className="mt-1 flex items-start gap-1.5 text-[0.875rem] font-semibold leading-snug text-game-muted">
              <SkillIcon skill={l.skill} className="mt-0.5 h-4 w-4 shrink-0 text-course-ink" />
              <span className="min-w-0">
                {l.label && <span className="font-extrabold text-game-text">{l.label}: </span>}
                <span lang="de">{l.text}</span>
              </span>
            </span>
          ))}
          <SkillTags skills={skills} lang={lang} />
          {meta && <span className="mt-0.5 block text-[0.8125rem] font-bold text-game-muted">{meta}</span>}
          {(done || current) && <span className="sr-only"> ({done ? t('player.doneMark') : t('kap.now')})</span>}
        </span>
        <span className="flex min-h-11 shrink-0 items-center" aria-hidden="true">
          {done ? (
            <Check className="h-6 w-6 rounded-full bg-game-right p-1 text-white" strokeWidth={3.5} />
          ) : current ? (
            <span className="rounded-lg bg-course-ink px-2 py-1 text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-white">{t('kap.now')}</span>
          ) : (
            <ChevronRight className="h-5 w-5 text-game-muted" />
          )}
        </span>
      </button>
    </li>
  );
}

/** One collapsible back-matter panel (closed by default, open on a finished chapter). */
function RefPanel({ icon, title, count, defaultOpen = false, flush = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          className="flex min-h-14 w-full items-center gap-3 rounded-[1.1rem] px-4 py-3 text-left hover:bg-course-wash"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-course-wash text-course-ink" aria-hidden="true">{icon}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[1.0625rem] font-extrabold text-game-text">{title}</span>
            {count && <span className="block text-[0.8125rem] font-bold text-game-muted">{count}</span>}
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-game-muted transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </h3>
      {open && <div id={id} className={`border-t-2 border-game-line ${flush ? 'p-2 sm:p-4' : 'p-4'}`}>{children}</div>}
    </section>
  );
}

/**
 * The Kapitel's back matter: Grammatik (this chapter's rule cards as Grammatik boxes), Wortschatz
 * (its words from words.json, grouped like the unit spec's lexicon blocks), Redemittel (German
 * phrase, what it does, the English). Plus the links to the whole level's reference pages.
 *
 *   cards       [{ card, title }]
 *   wordGroups  [{ title, words }] — null while the word list loads
 *   redemittel  the unit's Redemittel
 */
export function ReferenceShelf({ level, unitId, cards = [], wordGroups = null, redemittel = [], defaultOpen = false }) {
  const [lang, t] = useV2Strings();
  const L = (k) => (SKILL_LABEL[k] ? SKILL_LABEL[k][lang === 'de' ? 'de' : 'en'] : k);
  const wordCount = (wordGroups || []).reduce((n, g) => n + g.words.length, 0);
  const lvl = String(level || '').toLowerCase();
  const LVL = lvl.toUpperCase();
  return (
    <section className="mt-10" aria-labelledby={`${unitId}-reference`}>
      <h2 id={`${unitId}-reference`} className={SECTION_H}>{t('kap.reference')}</h2>
      <div className="mt-3 space-y-3">
        {cards.length > 0 && (
          <RefPanel icon={<SkillIcon skill="grammatik" className="h-5 w-5" />} title={L('grammatik')} count={t('kap.rules', { n: cards.length })} defaultOpen={defaultOpen} flush>
            <div className="space-y-4">
              {cards.map(({ card, title }) => <RuleCardView key={card.id} card={card} title={title} />)}
            </div>
            <Link to={`/course/${lvl}/grammatik`} className="mx-2 mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-1 text-[0.9375rem] font-extrabold text-course-ink hover:underline">
              {t('kap.allGrammar', { level: LVL })} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </RefPanel>
        )}
        <RefPanel
          icon={<SkillIcon skill="wortschatz" className="h-5 w-5" />}
          title={L('wortschatz')}
          count={wordGroups === null ? t('kap.loadingWords') : wordCount ? t('kap.wordCount', { n: wordCount }) : null}
          defaultOpen={defaultOpen}
        >
          {wordGroups === null && <p className="text-[0.9375rem] font-semibold text-game-muted">{t('kap.loadingWords')}</p>}
          {wordGroups && !wordCount && <p className="text-[0.9375rem] font-semibold text-game-muted">{t('kap.noWords')}</p>}
          <div className="space-y-5">
            {(wordGroups || []).map((g, i) => (
              <div key={g.title || `rest-${i}`}>
                <h4 className="mb-2 text-[0.8125rem] font-extrabold uppercase tracking-[0.08em] text-course-ink" lang={g.title ? 'de' : undefined}>{g.title || t('kap.moreWords')}</h4>
                <WordList words={g.words} unitId={unitId} idPrefix={`${unitId}-w${i}`} />
              </div>
            ))}
          </div>
          {wordCount > 0 && (
            <Link to={`/course/${lvl}/wortschatz`} className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-1 text-[0.9375rem] font-extrabold text-course-ink hover:underline">
              {t('kap.allWords', { level: LVL })} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </RefPanel>
        {redemittel.length > 0 && (
          <RefPanel icon={<MessagesSquare className="h-5 w-5" />} title={t('seg.redemittel')} count={t('kap.phrases', { n: redemittel.length })} defaultOpen={defaultOpen}>
            <ul>
              {redemittel.map((r) => (
                <li key={r.id} className="flex items-start gap-3 border-t-2 border-game-line py-2.5 first:border-t-0 first:pt-0 last:pb-0">
                  <SayButton unitId={unitId} id={r.id} text={r.de} label={t('kap.hear', { w: r.de })} />
                  <div className="min-w-0">
                    <p className="text-[1.0625rem] font-extrabold leading-snug text-game-text" lang="de">{r.de}</p>
                    {r.function && <p className="text-[0.875rem] font-semibold leading-snug text-course-ink" lang="de">{r.function}</p>}
                    {r.en && lang !== 'de' && <p className="text-[0.8125rem] leading-snug text-game-muted" lang="en">{r.en}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </RefPanel>
        )}
      </div>
    </section>
  );
}
