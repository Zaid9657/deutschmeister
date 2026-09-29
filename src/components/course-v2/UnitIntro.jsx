import { ChevronDown } from 'lucide-react';
import CastAvatar from './CastAvatar.jsx';
import GameButton, { QuietButton } from './GameButton.jsx';
import { SpeechBubble, StickyAction, XpIcon } from './GameParts.jsx';
import { ReferenceShelf, TocRow } from './KapitelParts.jsx';
import { laneLabel, teilLabel } from './content.js';
import { useV2Strings } from './strings.js';
import { SKILL_LABEL } from '../../lib/course-v2/curriculum.js';

const EYEBROW = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';

/**
 * THE KAPITEL PAGE — the unit's front page, like opening the book at the chapter (owner feedback
 * 2026-09-29: "I want it to be a CURRICULUM like the books … CHAPTERS, and in each chapter multiple
 * things to learn"). It opens a unit fresh and it is the resume screen; nothing on it asks anything
 * of the learner. Top to bottom:
 *
 *   „KAPITEL 1" + title; the narrator with the story teaser (fresh) or „welcome back" (resume);
 *   „In diesem Kapitel lernen Sie" — the can-dos, ticked once proven;
 *   INHALT — the table of contents: Einstieg · Folge n, then A / B / C (input, grammar, skills,
 *   tasks, minutes), Prüfungstraining, Sprechen (mit KI), Schreiben (mit KI-Korrektur), Kapiteltest
 *   — every row opens its part; the Prüfungsfokus folded in a small line;
 *   ZUM NACHSCHLAGEN — Grammatik, Wortschatz, Redemittel (closed, open on a finished chapter);
 *   ONE primary („Kapitel starten" / „Weiter mit Teil B"); „Test machen und überspringen" (the
 *   test-out) as a quiet text button.
 *
 * Props: eyebrow, title, narrator, bubble (+ bubbleEn, bubbleNote), goals ([string] or
 * [{ text, done }]), stepCount, perStepMinutes (or totalMinutes), xp, examFocus, onStart,
 * onTestOut, primaryLabel, and for the chapter: nr, level, unitId, lane, rows (kapitel.js tocRows),
 * intro ({ nr, title, state } — the Einstieg row), onOpenRow(index), onOpenIntro, cards,
 * wordGroups, redemittel, referenceOpen.
 */
export default function UnitIntro({
  eyebrow,
  title,
  narrator,
  bubble,
  bubbleEn = null,
  bubbleNote = null,
  goals,
  stepCount,
  perStepMinutes = 0,
  totalMinutes = 0,
  xp,
  examFocus = [],
  onStart,
  onTestOut = null,
  primaryLabel = null,
  nr = null,
  level = null,
  unitId = null,
  lane = null,
  rows = [],
  intro = null,
  onOpenRow = null,
  onOpenIntro = null,
  cards = [],
  wordGroups = null,
  redemittel = [],
  referenceOpen = false,
}) {
  const [lang, t] = useV2Strings();
  const L = (k) => (SKILL_LABEL[k] ? SKILL_LABEL[k][lang === 'de' ? 'de' : 'en'] : k);
  const goalList = (goals || []).map((g) => (typeof g === 'string' ? { text: g, done: false } : g));
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
      schreiben: { icon: 'schreiben', title: t('kap.schreiben') },
      ueberarbeiten: { icon: 'schreiben', title: t('kap.ueberarbeiten') },
      check: { icon: 'test', title: t('kap.test') },
    }[r.kind] || { icon: r.skills[0] || 'ueben', title: r.title || '' };
    const lines = r.kind === 'check' ? [{ skill: 'test', label: null, text: t('kap.testLine', { n: goalList.length }) }] : examLine;
    return { icon: named.icon, title: named.title, lines, skills: [], meta: minutesLine(r.minutes) };
  };

  const minutes = totalMinutes || (stepCount && perStepMinutes ? stepCount * perStepMinutes : 0);
  const chapter = rows.length > 0;

  return (
    <div className="pb-44 sm:pb-0">
      <header className="flex items-center gap-3.5">
        {nr != null && (
          <span className="flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-2xl bg-course text-white shadow-course" aria-hidden="true">
            <span className="text-[0.625rem] font-extrabold uppercase tracking-[0.1em]">{t('kap.chapter')}</span>
            <span className="text-[2rem] font-extrabold leading-none tabular-nums">{nr}</span>
          </span>
        )}
        <div className="min-w-0">
          <p className={EYEBROW}>{nr != null ? <><span className="sr-only">{t('player.unit', { n: nr })} · </span>{eyebrow}</> : eyebrow}</p>
          {title && <h1 className="mt-0.5 text-[1.625rem] font-extrabold leading-tight text-game-text [hyphens:auto] sm:text-[2rem]" lang="de">{title}</h1>}
        </div>
      </header>

      {(bubble || bubbleNote) && (
        <div className="mt-5 flex items-end gap-3">
          <CastAvatar name={narrator} size={84} className="shrink-0 motion-safe:animate-pop-in" />
          <SpeechBubble tail="left" className="min-w-0 flex-1">
            {bubble && <p className="text-[1.0625rem] font-bold leading-relaxed text-game-text" lang="de">{bubble}</p>}
            {bubbleEn && lang !== 'de' && <p className="mt-1.5 text-[0.875rem] font-semibold leading-snug text-game-muted" lang="en">{bubbleEn}</p>}
            {bubbleNote && <p className="mt-0.5 text-[0.9375rem] font-semibold text-game-muted">{bubbleNote}</p>}
          </SpeechBubble>
        </div>
      )}

      {goalList.length > 0 && (
        <section className="mt-5 rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-4 sm:p-5" aria-labelledby="unit-intro-goals">
          <h2 id="unit-intro-goals" className={EYEBROW}>{chapter ? t('kap.goals') : t('start.today')}</h2>
          <ul className="mt-3 space-y-2.5">
            {goalList.map((g) => (
              <li key={g.text} className="flex items-start gap-2.5 text-[1.0625rem] font-bold leading-snug text-game-text" lang="de">
                {g.done ? (
                  <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-game-right text-[0.75rem] font-extrabold text-white">✓</span>
                ) : (
                  <span aria-hidden="true" className="mt-[0.45rem] h-2.5 w-2.5 shrink-0 rounded-full bg-course" />
                )}
                <span>{g.text}{g.done && <span className="sr-only" lang={lang}> ({t('player.doneMark')})</span>}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.9375rem] font-extrabold text-game-muted">
        {stepCount > 0 && <span>{chapter ? t('kap.parts', { n: stepCount }) : t('start.steps', { n: stepCount })}</span>}
        {minutes > 0 && <><span aria-hidden="true">·</span><span>{t('kap.minutes', { n: minutes })}</span></>}
        {xp > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-game-xp-ink"><XpIcon size={16} /> {t('game.xp', { n: xp })}</span>
          </>
        )}
      </p>

      {chapter && (
        <section className="mt-6" aria-labelledby="unit-intro-contents">
          <h2 id="unit-intro-contents" className={EYEBROW}>{t('kap.contents')}</h2>
          <ol className="mt-2.5 overflow-hidden rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white">
            {intro && (
              <TocRow
                icon="hoeren"
                eyebrow={t('kap.intro')}
                title={`${t('kap.episode', { n: intro.nr })}${intro.title ? `: ${intro.title}` : ''}`}
                lines={[{ skill: 'hoeren', label: null, text: t('kap.introLine') }]}
                state={intro.state || 'open'}
                onOpen={onOpenIntro || onStart}
                lang={lang}
              />
            )}
            {rows.map((r) => (
              <TocRow key={r.id} {...rowProps(r)} state={r.state} onOpen={() => onOpenRow && onOpenRow(r.index)} lang={lang} />
            ))}
          </ol>
        </section>
      )}

      {examFocus.length > 0 && (
        <details className="group mt-4 rounded-2xl border-2 border-game-line bg-white px-4 py-2">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-[0.875rem] font-extrabold text-game-muted [&::-webkit-details-marker]:hidden">
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

      {chapter && (
        <ReferenceShelf
          level={level}
          unitId={unitId}
          cards={cards}
          wordGroups={wordGroups}
          redemittel={redemittel}
          defaultOpen={referenceOpen}
        />
      )}

      <StickyAction>
        <GameButton onClick={onStart}>{primaryLabel || t('start.begin')}</GameButton>
        {onTestOut && <QuietButton onClick={onTestOut}>{t('start.skipTest')}</QuietButton>}
      </StickyAction>
    </div>
  );
}
