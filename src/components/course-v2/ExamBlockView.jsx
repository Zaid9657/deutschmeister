import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, FileText, Lightbulb } from 'lucide-react';
import AudioButton from './AudioButton.jsx';
import GameButton from './GameButton.jsx';
import { StickyAction } from './GameParts.jsx';
import ItemView from './ItemView.jsx';
import { laneLabel, playsFor, speakerName } from './content.js';
import { bodyOf, examProgress, examScreens, gapExcerpt, isListening, strategyBody, textReaders } from './examSteps.js';
import { useV2Strings } from './strings.js';

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
const CARD = 'rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-4';
// a folded text's disclosure: the whole row is the button, ≥ 44 px
const FOLD = 'flex min-h-11 w-full items-center gap-2 rounded-xl text-left hover:bg-course-wash';
// an unfolded shared text scrolls inside its card, so the question below never moves out of reach
const PANEL = 'mt-3 max-h-[40vh] overflow-y-auto rounded-xl border-2 border-game-line bg-course-ground p-3';

/**
 * An exam text with its `⟦NN⟧` gaps drawn as numbered gaps; `target` (the task's gap) in the
 * course colour, the others neutral. Each gap is read as „Lücke 3".
 */
function GapText({ text, target = null }) {
  const [, t] = useV2Strings();
  const parts = String(text || '').split(/⟦(\d{2})⟧/);
  return parts.map((p, i) => {
    if (i % 2 === 0) return <span key={i}>{p}</span>;
    const n = Number(p);
    const on = target != null && n === target;
    return (
      <span
        key={i}
        className={`mx-0.5 inline-flex min-w-[2.5rem] justify-center rounded-lg px-1.5 font-extrabold tabular-nums ${
          on ? 'border-2 border-course bg-course-wash text-course-ink' : 'border-2 border-game-line text-game-muted'
        }`}
      >
        <span aria-hidden="true">{n}</span>
        <span className="sr-only">{t('item.gap', { n })}</span>
      </span>
    );
  });
}

/** A written exam text (a message, an ad, a sign) in full, with its choice key („a") when it has one. */
function TextCard({ text, keyLabel = null }) {
  return (
    <div className={CARD} lang="de">
      {(keyLabel || text.title) && (
        <div className="flex items-baseline gap-2">
          {keyLabel && <span className="shrink-0 rounded-lg bg-course-wash px-2 py-0.5 text-[0.875rem] font-extrabold text-course-ink">{keyLabel}</span>}
          {text.title && <p className="min-w-0 text-[1.0625rem] font-extrabold leading-snug text-game-text">{text.title}</p>}
        </div>
      )}
      {text.text && (
        <p className="mt-1.5 whitespace-pre-line text-[1rem] leading-relaxed text-game-text [hyphens:auto]">
          <GapText text={bodyOf(text)} />
        </p>
      )}
    </div>
  );
}

/** The disclosure row of a folded text: icon, name, „Text anzeigen"/„ausblenden", chevron. */
function FoldButton({ open, controls, label, name, onToggle }) {
  return (
    <button type="button" aria-expanded={open} aria-controls={controls} onClick={onToggle} className={FOLD}>
      <FileText className="h-5 w-5 shrink-0 text-course-ink" aria-hidden="true" />
      {name && <span className="min-w-0 flex-1 truncate text-[1rem] font-extrabold text-game-text" lang="de">{name}</span>}
      <span className={`${name ? 'shrink-0' : 'flex-1'} text-[0.9375rem] font-extrabold text-course-ink`}>{label}</span>
      <ChevronDown className={`h-5 w-5 shrink-0 text-course-ink ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
    </button>
  );
}

/**
 * A shared text on a task screen. The learner read it on its own screen before the first task
 * that needs it; here it is what the task needs of it — the sentence of a gap (`excerpt`) — or
 * folded to its name (`ref`). Unfolded, it scrolls inside its card.
 */
function SharedText({ text, gap = null, open, onToggle }) {
  const [, t] = useV2Strings();
  const panelId = useId();
  const body = bodyOf(text);
  const cut = gap != null ? gapExcerpt(body, gap) : null;
  const whole = (
    <div id={panelId} hidden={!open} className={PANEL} role="region" aria-label={text.title || undefined} tabIndex={open ? 0 : -1} lang="de">
      {cut && text.title && <p className="font-extrabold text-game-text">{text.title}</p>}
      <p className="whitespace-pre-line text-[1rem] leading-relaxed text-game-text [hyphens:auto]"><GapText text={body} target={gap} /></p>
    </div>
  );
  if (cut) {
    return (
      <div className={CARD}>
        {text.title && <p className={LABEL} lang="de">{text.title}</p>}
        <p className="mt-1.5 whitespace-pre-line text-[1.0625rem] leading-relaxed text-game-text [hyphens:auto]" lang="de">
          {cut.before && <span aria-hidden="true">… </span>}
          <GapText text={cut.text} target={gap} />
          {cut.after && <span aria-hidden="true"> …</span>}
        </p>
        <div className="mt-2 border-t-2 border-game-line pt-1">
          <FoldButton open={open} controls={panelId} label={t(open ? 'exam.hideWhole' : 'exam.showWhole')} onToggle={onToggle} />
        </div>
        {whole}
      </div>
    );
  }
  return (
    <div className="rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white px-3 py-1.5">
      <FoldButton open={open} controls={panelId} name={text.title} label={t(open ? 'exam.hideText' : 'exam.showText')} onToggle={onToggle} />
      {whole}
    </div>
  );
}

/** The texts a task's choices name (a set of ads a–f), folded on the task screen. */
function ChoiceTexts({ texts, keys, open, onToggle }) {
  const [, t] = useV2Strings();
  const panelId = useId();
  const ks = texts.map((x) => keys[x.id]).filter(Boolean);
  return (
    <div className="rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white px-3 py-1.5">
      <FoldButton
        open={open}
        controls={panelId}
        label={t(open ? 'exam.hideChoices' : 'exam.showChoices', { from: ks[0] || '', to: ks[ks.length - 1] || '' })}
        onToggle={onToggle}
      />
      <div id={panelId} hidden={!open} className={`${PANEL} space-y-3`} role="region" aria-label={t('exam.choices')} tabIndex={open ? 0 : -1} lang="de">
        {texts.map((x) => (
          <div key={x.id}>
            <p className="flex items-baseline gap-2">
              {keys[x.id] && <span className="shrink-0 rounded-lg bg-course-wash px-2 py-0.5 text-[0.875rem] font-extrabold text-course-ink">{keys[x.id]}</span>}
              {x.title && <span className="font-extrabold text-game-text">{x.title}</span>}
            </p>
            {x.text && <p className="mt-1 whitespace-pre-line text-[0.9375rem] leading-relaxed text-game-text">{bodyOf(x)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * One listening text: the play control with the lane's play count (the intro says it once: „In der
 * Prüfung hören Sie jeden Text 2×."), and the transcript only after
 * the items that depend on it are answered (BLUEPRINT §7.3 S4: „transcript after submission").
 * After that the replay is free — the counted plays are the exam's, the learning afterwards is
 * not. The plays used live in the block (`used`), so a text two tasks share keeps one count.
 */
function ListeningText({ text, unitId, plays, used, onPlayed, answered, names }) {
  const [, t] = useV2Strings();
  const lines = text.lines || [];
  const left = plays == null || answered ? null : Math.max(0, plays - used);
  return (
    <div className={CARD}>
      {text.title && <p className="text-[1.0625rem] font-extrabold text-game-text" lang="de">{text.title}</p>}
      <div className={text.title ? 'mt-2' : ''}>
        <AudioButton unitId={unitId} lines={lines} playsLeft={left} onPlayed={onPlayed} />
      </div>
      {answered ? (
        <div className="mt-3 border-t-2 border-game-line pt-3">
          <p className={LABEL}>{t('exam.transcript')}</p>
          <ul className="mt-1.5 space-y-1">
            {lines.map((l) => (
              <li key={l.id} className="text-[1rem] leading-relaxed text-game-text" lang="de">
                <span className="text-[0.875rem] font-extrabold text-game-muted">{speakerName(l.speaker, names)}: </span>{l.de}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-2 text-[0.875rem] font-semibold leading-snug text-game-muted">{t('exam.transcriptAfter')}</p>
      )}
    </div>
  );
}

/**
 * An exam block in Lernmodus (SCHEMA §8 ExamBlock; BLUEPRINT §3.6, §7.3 S4) as a run of small
 * screens, one thing per screen like the rest of the course (owner feedback 2026-09-30: "it looks
 * intimidating and too much … make it in duolingo style and for everything to be step for step").
 * The screens are examSteps.examScreens':
 *
 *   intro  the instruction, a „Tipp" card (the strategy; its English twin only in the English
 *          chrome and only behind „Show in English"), „6 Aufgaben · Lernmodus", START
 *   read   a text several tasks share, read once before the first of them („Lesen Sie zuerst …")
 *   task   „3 / 6", the task's material above its question — the audio with the lane's play count
 *          (ga2.h1: 2×, ga2.h2: 1× …) and the transcript once answered, a short text in full, the
 *          gap's sentence of a shared text, or the shared text folded — then the item itself
 *          (ItemView: „Prüfen" in the bottom bar, the feedback sheet, CONTINUE to the next task)
 *
 * Every screen's one action sits in the bottom bar (StickyAction, ItemView's own for a task). The
 * host names the Teil above it (StepView's heading, the Plateau's section header). The block has
 * one mode, the Lernmodus: feedback after every answer (`modeDefault` is not read yet — there is
 * no Prüfungsmodus to keep).
 *
 * `onDone({ blockId, correct, total })` once, after the last task's CONTINUE.
 * `onAttempt(payload)` per item (the ItemView contract payload, `stepId` stamped).
 * `onProgress(fraction)` (optional) — how far through the block the learner is, 0..1, for the
 * player's progress bar (the way ItemRun reports).
 */
export default function ExamBlockView({ block, unitId, stepId, level, texts = null, strategy = null, lines = null, names = null, onAttempt, onDone, onProgress = null }) {
  const [lang, t] = useV2Strings();
  const screens = useMemo(() => examScreens(block, texts), [block, texts]);
  const readers = useMemo(() => textReaders(block, texts), [block, texts]);
  // the item as ItemView draws it: its text is drawn above it here, never a second time under the question
  const shown = useMemo(() => new Map((block?.items || []).map((it) => [it.id, it.textRef ? { ...it, textRef: undefined } : it])), [block]);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState({}); // itemId → correct
  const [used, setUsed] = useState({}); // textId → counted plays
  const [open, setOpen] = useState({}); // disclosure → unfolded (kept from task to task)
  const tally = useRef({});
  const reported = useRef(false);
  const enId = useId();
  const plays = playsFor(block);
  const total = (block?.items || []).length;

  const sink = useRef(onProgress);
  sink.current = onProgress;
  useEffect(() => {
    if (typeof sink.current === 'function') sink.current(examProgress(pos, screens.length));
  }, [pos, screens.length]);
  // every screen opens at its top (a read screen leaves the page scrolled down)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pos]);

  if (!block) return null;

  const onItem = (payload) => {
    tally.current[payload.itemId] = !!payload.correct;
    setAnswers((prev) => ({ ...prev, [payload.itemId]: payload.correct }));
    if (typeof onAttempt === 'function') onAttempt({ ...payload, stepId });
  };

  const finish = () => {
    if (reported.current) return;
    reported.current = true;
    const correct = Object.values(tally.current).filter(Boolean).length;
    if (typeof onDone === 'function') onDone({ blockId: block.id, correct, total });
  };

  const next = () => {
    if (pos + 1 < screens.length) setPos(pos + 1);
    else finish();
  };

  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const answeredAll = (ids) => ids.length > 0 && ids.every((id) => id in answers);
  const listening = (x) => (
    <ListeningText
      key={x.id}
      text={x}
      unitId={unitId}
      plays={plays}
      used={used[x.id] || 0}
      onPlayed={() => setUsed((u) => ({ ...u, [x.id]: (u[x.id] || 0) + 1 }))}
      answered={answeredAll(readers.get(x.id) || (block.items || []).map((i) => i.id))}
      names={names}
    />
  );

  const screen = screens[pos] || screens[0];

  // ── intro: what this Teil asks, one tip, START ─────────────────────────────────────
  if (screen.kind === 'intro') {
    const tip = strategy && strategy.de ? strategyBody(strategy.de) : null;
    const en = strategy && strategy.en && lang !== 'de' ? strategyBody(strategy.en) : null;
    const size = block.length === 'mini' ? t('exam.mini') : block.length && block.length !== 'full' ? t('exam.reduced') : null;
    const facts = [
      block.lane ? laneLabel(block.lane) : null,
      total === 1 ? t('exam.countOne') : t('exam.count', { n: total }),
      size,
      t('exam.lern'),
    ].filter(Boolean).join(' · ');
    return (
      <section className="pb-32 sm:pb-0" data-exam-screen="intro">
        <div className="motion-safe:animate-pop-in">
          {block.instructionsDe && (
            <p className="text-[1.1875rem] font-extrabold leading-snug text-game-text [hyphens:auto]" lang="de">{block.instructionsDe}</p>
          )}
          {tip && (
            <div className={`mt-5 ${CARD}`}>
              <p className="inline-flex items-center gap-1.5 rounded-lg bg-course-wash px-2.5 py-1 text-[0.875rem] font-extrabold text-course-ink">
                <Lightbulb className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" /> {t('exam.tip')}
              </p>
              <p className="mt-3 text-[1.0625rem] font-semibold leading-relaxed text-game-text [hyphens:auto]" lang="de">{tip}</p>
              {en && (
                <>
                  <button
                    type="button"
                    aria-expanded={!!open.en}
                    aria-controls={enId}
                    onClick={() => toggle('en')}
                    className="-ml-2 mt-1 inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-[0.9375rem] font-extrabold text-course-ink hover:bg-course-wash"
                  >
                    {t(open.en ? 'exam.hideEn' : 'exam.showEn')}
                    <ChevronDown className={`h-4 w-4 ${open.en ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  <p id={enId} hidden={!open.en} className="text-[0.9375rem] leading-relaxed text-game-muted" lang="en">{en}</p>
                </>
              )}
            </div>
          )}
          <p className="mt-4 text-[0.9375rem] font-semibold text-game-muted">{facts}</p>
          {plays != null && <p className="mt-1 text-[0.9375rem] font-semibold text-game-muted">{t('exam.playsRule', { n: plays })}</p>}
        </div>
        <StickyAction>
          <GameButton onClick={next}>{t('exam.start')}</GameButton>
        </StickyAction>
      </section>
    );
  }

  // ── read: a shared text, once, before the first task that needs it ─────────────────────
  if (screen.kind === 'read') {
    return (
      <section key={`read-${pos}`} className="pb-32 sm:pb-0" data-exam-screen="read">
        <div className="motion-safe:animate-pop-in">
          <p className="text-[1.1875rem] font-extrabold leading-snug text-game-text">{t(screen.texts.length === 1 ? 'exam.readFirst' : 'exam.readAll')}</p>
          <div className="mt-5 space-y-3">
            {screen.texts.map((x) => (isListening(x) ? listening(x) : <TextCard key={x.id} text={x} keyLabel={screen.keys[x.id] || null} />))}
          </div>
          {screen.bank.length > 0 && (
            <div className="mt-5">
              <p className={LABEL}>{t('exam.choices')}</p>
              <ul className="mt-2 flex flex-wrap gap-2" lang="de">
                {screen.bank.map((c) => (
                  <li key={c.key} className="rounded-xl border-2 border-game-line bg-white px-3 py-1.5 text-[1rem] font-bold text-game-text">
                    <span className="mr-1.5 font-extrabold text-game-muted">{c.key}</span>{c.de}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <StickyAction>
          <GameButton onClick={next}>{t('item.next')}</GameButton>
        </StickyAction>
      </section>
    );
  }

  // ── task: 3 / 6, its material, its question ──────────────────────────────────────────
  const { item, n, text: x, show, gap, choiceTexts, keys } = screen;
  let material = null;
  if (show === 'listen') material = listening(x);
  else if (show === 'full') material = <TextCard text={x} />;
  else if (show === 'excerpt' || show === 'ref') {
    // a folded text stays open from task to task once the learner opened it (they check it for each
    // statement); a gap's whole text is an occasional look — each task starts at its excerpt
    const fold = show === 'ref' ? x.id : `${x.id}#${item.id}`;
    material = <SharedText text={x} gap={gap} open={!!open[fold]} onToggle={() => toggle(fold)} />;
  }

  return (
    <section key={item.id} data-exam-screen="task" data-exam-task={n}>
      {/* the pop-in's transform would hold ItemView's fixed bottom bar and sheet: it wraps the material only */}
      <div className="motion-safe:animate-pop-in">
        <p className="mb-3 inline-flex rounded-full bg-course-wash px-2.5 py-0.5 text-[0.875rem] font-extrabold tabular-nums text-course-ink">
          <span aria-hidden="true">{n} / {total}</span>
          <span className="sr-only">{t('item.of', { n, total })}</span>
        </p>
        {choiceTexts.length > 0 && (
          <div className="mb-3">
            <ChoiceTexts texts={choiceTexts} keys={keys} open={!!open.choices} onToggle={() => toggle('choices')} />
          </div>
        )}
        {material && <div className="mb-2">{material}</div>}
      </div>
      <ItemView
        key={item.id}
        item={shown.get(item.id) || item}
        level={level}
        stepId={stepId}
        unitId={unitId}
        lines={lines}
        block={block}
        texts={texts}
        names={names}
        onResult={onItem}
        onNext={next}
      />
    </section>
  );
}

