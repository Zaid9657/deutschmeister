import { ChevronDown } from 'lucide-react';
import CastAvatar from './CastAvatar.jsx';
import GameButton, { QuietButton } from './GameButton.jsx';
import { SpeechBubble, StickyAction } from './GameParts.jsx';
import { ReferenceShelf, TocRow } from './KapitelParts.jsx';
import { laneLabel, teilLabel } from './content.js';
import { useV2Strings } from './strings.js';
import { SKILL_LABEL } from '../../lib/course-v2/curriculum.js';

// How a Kapitel opens (round 3, owner 2026-09-30: "it looks intimidating and too much … make it in
// duolingo style and for everything to be step for step"). Duolingo on the surface, the textbook one
// tap deep:
//
//   StoryScreen — ONE thing on the screen: the narrator, big, with one speech bubble, one small line
//     naming the Kapitel, ONE big button in the thumb zone and at most one quiet text button under it.
//     It opens a fresh unit (the story's opening, „Los geht's", the test-out as the quiet button) and
//     it welcomes a returning learner („Willkommen zurück!", „Weiter", „Kapitel im Überblick").
//   UnitIntro (default) — THE GUIDE: the textbook Kapitel page of round 2, now opt-in behind
//     `?view=guide` (the home's book button, the welcome-back link, the recap). Nothing on it asks
//     anything of the learner, and nothing competes with its one button at the very end.

const SECTION_H = 'text-[0.8125rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';

/**
 * One screen, one thing (the fresh unit's story, the welcome-back).
 *
 *   heading       the small line above the bubble („Kapitel 1 · Hallo, ich bin Priya") — the screen's h1
 *   narrator      the cast name (story.js narratorOf)
 *   bubble        the bubble's main line (German content: the story's opening) — `bubbleLang` says its language
 *   bubbleEn      its English twin, shown only in English chrome
 *   bubbleNote    a second, smaller line (the welcome-back's „Weiter geht's mit Teil B: …")
 *   primaryLabel / onPrimary   the one big button
 *   quietLabel / onQuiet       the one quiet text button under it (optional)
 */
export function StoryScreen({
  id,
  heading,
  narrator,
  bubble,
  bubbleLang = 'de',
  bubbleEn = null,
  bubbleNote = null,
  primaryLabel,
  onPrimary,
  quietLabel = null,
  onQuiet = null,
}) {
  const [lang] = useV2Strings();
  const headingId = `${id}-heading`;
  return (
    <section
      className="flex min-h-[calc(100dvh-7.5rem)] flex-col items-center justify-center pb-40 text-center sm:min-h-0 sm:pb-0 sm:pt-8"
      aria-labelledby={headingId}
      data-step-id={id}
    >
      <h1 id={headingId} className="max-w-md text-[0.875rem] font-extrabold uppercase tracking-[0.08em] text-game-muted">{heading}</h1>
      <SpeechBubble tail="down" className="mt-4 w-full max-w-md motion-safe:animate-pop-in">
        <p className="text-[1.3125rem] font-extrabold leading-snug text-game-text" lang={bubbleLang}>{bubble}</p>
        {bubbleEn && lang !== 'de' && <p className="mt-2 text-[0.9375rem] font-semibold leading-snug text-game-muted" lang="en">{bubbleEn}</p>}
        {bubbleNote && <p className="mt-2 text-[1.0625rem] font-bold leading-snug text-game-muted">{bubbleNote}</p>}
      </SpeechBubble>
      <CastAvatar name={narrator} size={140} className="mt-6 shrink-0 motion-safe:animate-pop-in" />
      <StickyAction>
        <GameButton onClick={onPrimary}>{primaryLabel}</GameButton>
        {onQuiet && quietLabel && <QuietButton onClick={onQuiet}>{quietLabel}</QuietButton>}
      </StickyAction>
    </section>
  );
}

/**
 * THE GUIDE — the Kapitel page, like opening the book at the chapter (round 2: "a CURRICULUM like the
 * books … CHAPTERS, and in each chapter multiple things to learn"), reached only through `?view=guide`.
 * The player's GuideTopBar sits above it (the X, „Kapitel 1 im Überblick"). Top to bottom, spaced out:
 *
 *   the title and one quiet line (level · Modul · parts · minutes);
 *   the can-dos (`goals`: the player's own panel, ticked once proven — it owns the proof reading);
 *   INHALT — Einstieg · Folge n, then A / B / C (input, grammar, skills, tasks, minutes),
 *     Prüfungstraining, Sprechen (mit KI), Schreiben (mit KI-Korrektur — or „Formular" where the
 *     Aufgabe is a form checked without the KI), Kapiteltest: every row opens
 *     its part; the Prüfungsfokus folded in one small line;
 *   ZUM NACHSCHLAGEN — Grammatik, Wortschatz, Redemittel, each closed until tapped (round 2 opened
 *     all three on a finished chapter: a 7 000 px page);
 *   at the very end, ONE button („Kapitel starten" / „Weiter mit Teil B") — never sticky, nothing
 *     competes with the page — and the test-out as a quiet text button while the Lernschritte are open.
 *
 * Props: title, meta, goals (a node), rows (kapitel.js tocRows), intro ({ nr, title, state } — the
 * Einstieg row), onOpenRow(index), onOpenIntro, cards, wordGroups, redemittel, referenceOpen (false), examFocus,
 * lane, level, unitId, primaryLabel, onPrimary, onTestOut.
 */
export default function UnitIntro({
  title,
  meta = null,
  goals = null,
  rows = [],
  intro = null,
  onOpenRow = null,
  onOpenIntro = null,
  cards = [],
  wordGroups = null,
  redemittel = [],
  referenceOpen = false,
  examFocus = [],
  lane = null,
  level = null,
  unitId = null,
  primaryLabel,
  onPrimary,
  onTestOut = null,
  goalCount = 0,
}) {
  const [lang, t] = useV2Strings();
  const L = (k) => (SKILL_LABEL[k] ? SKILL_LABEL[k][lang === 'de' ? 'de' : 'en'] : k);
  const laneName = lane ? laneLabel(lane) : null;
  const minutesLine = (n) => (n ? t('kap.minutes', { n }) : null);

  // what a row of the table of contents says about its part
  const rowProps = (r) => {
    const teile = (r.teile || []).map((tpl) => teilLabel(tpl)).join(' · ');
    const examLine = teile ? [{ skill: 'pruefung', label: laneName, text: teile }] : [];
    const meta = [r.items ? t('kap.tasks', { n: r.items }) : null, minutesLine(r.minutes)].filter(Boolean).join(' · ') || null;
    if (r.letter) {
      const inputSkill = r.input && r.input.kind === 'text' ? 'lesen' : 'hoeren';
      const lines = [];
      if (r.input && r.input.title) lines.push({ skill: inputSkill, label: L(inputSkill), text: r.input.title });
      if (r.grammar && r.grammar.short) lines.push({ skill: 'grammatik', label: L('grammatik'), text: r.grammar.short });
      const shown = new Set(lines.map((l) => l.skill));
      return { letter: r.letter, title: r.title || t('kap.part', { l: r.letter }), lines, skills: r.skills.filter((k) => !shown.has(k)), meta };
    }
    const named = {
      pruefung: { icon: 'pruefung', title: t('kap.pruefung') },
      sprechen: { icon: 'sprechen', title: t('kap.sprechen') },
      // a form to fill is checked without the KI (kapitel.js tocRows `form`): its row says so
      schreiben: { icon: 'schreiben', title: t(r.form ? 'kap.schreibenForm' : 'kap.schreiben') },
      ueberarbeiten: { icon: 'schreiben', title: t('kap.ueberarbeiten') },
      check: { icon: 'test', title: t('kap.test') },
    }[r.kind] || { icon: r.skills[0] || 'ueben', title: r.title || '' };
    const lines = r.kind === 'check' ? [{ skill: 'test', label: null, text: t('kap.testLine', { n: goalCount }) }] : examLine;
    return { icon: named.icon, title: named.title, lines, skills: [], meta: minutesLine(r.minutes) };
  };

  return (
    <article className="pb-16 pt-4" aria-labelledby="kapitel-guide-title">
      <header>
        <h1 id="kapitel-guide-title" className="text-[1.75rem] font-extrabold leading-tight text-game-text [hyphens:auto] sm:text-[2rem]" lang="de">{title}</h1>
        {meta && <p className="mt-1.5 text-[0.9375rem] font-bold text-game-muted">{meta}</p>}
      </header>

      {goals && <div className="mt-8">{goals}</div>}

      {rows.length > 0 && (
        <section className="mt-10" aria-labelledby="kapitel-guide-contents">
          <h2 id="kapitel-guide-contents" className={SECTION_H}>{t('kap.contents')}</h2>
          <ol className="mt-3 overflow-hidden rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white">
            {intro && (
              <TocRow
                icon="hoeren"
                eyebrow={t('kap.intro')}
                title={`${t('kap.episode', { n: intro.nr })}${intro.title ? `: ${intro.title}` : ''}`}
                lines={[{ skill: 'hoeren', label: null, text: t('kap.introLine') }]}
                state={intro.state || 'open'}
                onOpen={onOpenIntro}
                lang={lang}
              />
            )}
            {rows.map((r) => (
              <TocRow key={r.id} {...rowProps(r)} state={r.state} onOpen={() => onOpenRow && onOpenRow(r.index)} lang={lang} />
            ))}
          </ol>
          {examFocus.length > 0 && (
            <details className="group mt-3 rounded-2xl border-2 border-game-line bg-white px-4 py-1.5">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-[0.9375rem] font-extrabold text-game-muted [&::-webkit-details-marker]:hidden">
                <span>{t('start.examFocus')}: {examFocus.length}</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
              </summary>
              <ul className="flex flex-wrap gap-2 pb-2 pt-1">
                {examFocus.map((label) => (
                  <li key={label} className="rounded-lg bg-course-wash px-2.5 py-1 text-[0.8125rem] font-bold text-course-ink" lang="de">{label}</li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {rows.length > 0 && (
        <ReferenceShelf
          level={level}
          unitId={unitId}
          cards={cards}
          wordGroups={wordGroups}
          redemittel={redemittel}
          defaultOpen={referenceOpen}
        />
      )}

      <div className="mx-auto mt-12 flex max-w-md flex-col items-stretch gap-2">
        <GameButton onClick={onPrimary}>{primaryLabel}</GameButton>
        {onTestOut && <QuietButton onClick={onTestOut}>{t('flow.testOut')}</QuietButton>}
      </div>
    </article>
  );
}
