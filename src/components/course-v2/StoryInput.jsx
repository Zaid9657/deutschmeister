import { useEffect, useMemo, useRef, useState } from 'react';
import { Languages, Play, Volume2 } from 'lucide-react';
import { SourceBadge } from './AudioButton.jsx';
import CastAvatar from './CastAvatar.jsx';
import GameButton from './GameButton.jsx';
import { SpeechBubble } from './GameParts.jsx';
import { GlossText, useGlossPopover } from './InputView.jsx';
import StepScreen, { IconKey } from './StepScreen.jsx';
import { canPlay, playV2Line, playV2Lines, recordedLine, speakerName } from './content.js';
import { inputPhases, lineLabel, readingChunks } from './steps.js';
import { useV2Strings } from './strings.js';

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
// room kept under a new line for the bottom bar, and over it for the sticky top bar (px)
const BAR_ROOM = 150;
const TOP_ROOM = 90;
const reducedMotion = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The input of a Situation / Text Lernschritt (SCHEMA §8 `Input`) the way Duolingo Stories tells
 * one (owner feedback 2026-09-30: "for everything to be step for step"): nothing arrives all at
 * once. Its phases (steps.js inputPhases), each one screen:
 *
 *   text     a reading text — or a mixed input's document (the flyer, the ad, the chat opener the
 *            conversation is about) — revealed chunk by chunk (steps.js readingChunks: a paragraph
 *            is never split; a text of ≤ 60 words is one chunk)
 *   listen   the unaided listen, kept from InputView: the transcript stays hidden until the whole
 *            recording has been started once („Weiter" waits for it). Sound is never the only
 *            channel — when the browser cannot play the lines at all there is no listen phase and
 *            the transcript comes at once.
 *   lines    the transcript, one line per „Weiter": the speaker's CastAvatar (an unknown name gets
 *            its initial) and a bubble with the German line (tap-glosses as everywhere); the new
 *            line speaks once as it appears, every line keeps its own speaker key, the earlier ones
 *            stay above and the page follows the newest.
 *
 * English is a small toggle, off by default, so the German is read first; „Alles anhören" plays
 * the whole recording again. `onProgress(0..1)` moves the step's bar per beat; `onDone()` once,
 * after the last beat's „Weiter". `onHeard()` (optional) once, after the first full listen.
 * InputView (the whole input on one screen) stays for the Start's Folge and the reward pieces.
 */
export default function StoryInput({ input, unitId, names = null, onDone, onProgress = null, onHeard = null }) {
  const [lang, t] = useV2Strings();
  const lines = useMemo(() => (Array.isArray(input && input.lines) ? input.lines.filter((l) => l && l.id) : []), [input]);
  const playable = lines.length > 0 && canPlay(unitId, lines[0].id);
  // fixed when the input opens: a voice list arriving later must never reshape the screens
  const [phases] = useState(() => inputPhases(input, { playable }));
  const reading = useMemo(() => readingChunks(input && input.text), [input]);
  const [phase, setPhase] = useState(0);
  const [shown, setShown] = useState(1);
  const [heard, setHeard] = useState(false);
  const [english, setEnglish] = useState(false);
  const [open, setOpen] = useGlossPopover();
  const glosses = (input && input.glosses) || [];
  const newest = useRef(null);
  const finished = useRef(false);
  const sink = useRef(onProgress);
  sink.current = onProgress;

  const kind = phases[phase] || null;
  const beatsOf = (k) => (k === 'text' ? reading.chunks.length : k === 'lines' ? lines.length : 1);
  const total = phases.reduce((s, k) => s + beatsOf(k), 0);
  const position = phases.slice(0, phase).reduce((s, k) => s + beatsOf(k), 0) + Math.max(0, shown - 1);

  useEffect(() => {
    if (typeof sink.current === 'function') sink.current(total ? Math.min(1, position / total) : 1);
  }, [position, total]);

  // the page follows the story: a new phase starts at the top; a new beat is brought up above the
  // bottom bar (BAR_ROOM), never past the sticky top bar (TOP_ROOM)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.scrollTo !== 'function') return;
    if (shown <= 1) { window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    const el = newest.current;
    if (!el || typeof el.getBoundingClientRect !== 'function') return;
    const rect = el.getBoundingClientRect();
    const down = Math.min(rect.bottom + BAR_ROOM - window.innerHeight, rect.top - TOP_ROOM);
    if (down > 0) window.scrollTo({ top: window.scrollY + down, behavior: reducedMotion() ? 'instant' : 'smooth' });
  }, [phase, shown]);

  // a new line speaks once as it appears (only where it can be played at all)
  useEffect(() => {
    if (kind !== 'lines') return undefined;
    const line = lines[shown - 1];
    if (!line || !canPlay(unitId, line.id)) return undefined;
    const timer = setTimeout(() => { playV2Line(unitId, line); }, 200);
    return () => clearTimeout(timer);
  }, [kind, shown, lines, unitId]);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    if (typeof onDone === 'function') onDone();
  };
  const next = () => {
    if (kind && kind !== 'listen' && shown < beatsOf(kind)) { setShown(shown + 1); return; }
    if (phase + 1 < phases.length) { setPhase(phase + 1); setShown(1); setOpen(null); return; }
    finish();
  };
  // the whole recording; the learner started it, so the transcript may open (whether or not
  // the browser then managed to speak — the text is never withheld because sound failed)
  const listenAll = (rate) => {
    playV2Lines(unitId, lines, rate ? { rate } : undefined);
    if (!heard) {
      setHeard(true);
      if (typeof onHeard === 'function') onHeard();
    }
  };

  const nextButton = (
    <GameButton onClick={next} disabled={kind === 'listen' && !heard}>{t('item.next')}</GameButton>
  );
  const englishKey = (
    <IconKey label={english ? t('input.translationOff') : t('input.translationOn')} pressed={english} onClick={() => setEnglish((e) => !e)}>
      <Languages className="h-5 w-5" aria-hidden="true" />
    </IconKey>
  );
  const glossHint = glosses.length > 0 && <p className="-mt-2 mb-4 text-[0.875rem] font-semibold text-game-muted">{t('input.glossHint')}</p>;

  if (!kind) return <StepScreen action={nextButton}>{null}</StepScreen>;

  if (kind === 'listen') {
    const speakers = [...new Set(lines.map((l) => speakerName(l.speaker, names)).filter(Boolean))].slice(0, 4);
    return (
      <StepScreen title={t('card.listen')} action={nextButton}>
        <p className="text-[1.0625rem] font-semibold leading-snug text-game-muted">{t('card.listenLead')}</p>
        <div className="mt-6 flex flex-col items-center rounded-[1.5rem] border-2 border-b-4 border-game-line bg-white px-5 pb-6 pt-6 text-center">
          {speakers.length > 0 && (
            <div className="flex -space-x-3" aria-hidden="true">
              {speakers.map((name) => <CastAvatar key={name} name={name} size={56} decorative className="rounded-full ring-4 ring-white" />)}
            </div>
          )}
          {input.title && <p className="mt-3 text-[1.125rem] font-extrabold leading-snug text-game-text" lang="de">{input.title}</p>}
          <button
            type="button"
            onClick={() => listenAll()}
            className="mt-6 flex flex-col items-center gap-2 rounded-2xl px-3 py-1 outline-none focus-visible:ring-2 focus-visible:ring-course"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-course text-white shadow-course transition-[transform,box-shadow] duration-100 ease-snap hover:brightness-105 active:translate-y-[5px] active:shadow-none motion-reduce:transition-none">
              <Volume2 className="h-10 w-10" strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="text-[1rem] font-extrabold text-course-ink">{heard ? t('audio.playAgain') : t('audio.play')}</span>
          </button>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => listenAll(0.8)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-game-line bg-white px-3 py-1.5 text-[0.9375rem] font-extrabold text-course-ink hover:bg-course-wash"
            >
              <Play className="h-4 w-4" aria-hidden="true" /> {t('audio.slow')}
            </button>
            <SourceBadge recorded={recordedLine(unitId, lines[0].id)} />
          </div>
        </div>
      </StepScreen>
    );
  }

  if (kind === 'text') {
    const all = shown >= reading.chunks.length;
    const hasEnglish = reading.chunks.some((c) => c.en) || (reading.en && all);
    return (
      <StepScreen title={t('card.read')} aside={hasEnglish ? englishKey : null} action={nextButton}>
        {glossHint}
        <div className="rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-4 sm:p-5">
          {input.title && <p className="text-[0.875rem] font-extrabold leading-snug text-game-muted" lang="de">{input.title}</p>}
          {reading.chunks.slice(0, shown).map((c, k) => (
            <div
              key={k}
              ref={k === shown - 1 ? newest : undefined}
              className={`${k || input.title ? 'mt-3' : ''} ${k > 0 && k === shown - 1 ? 'motion-safe:animate-pop-in' : ''}`}
              data-chunk={k}
            >
              <p className="text-[1.0625rem] font-semibold leading-relaxed text-game-text" lang="de">
                {c.de.split('\n').map((para, j) => {
                  const cut = lineLabel(para);
                  const gloss = (text, part) => <GlossText text={text} glosses={glosses} open={open} setOpen={setOpen} idPrefix={`g-c${k}-${j}${part}`} lang={lang} />;
                  if (!para.trim()) return <span key={j} className="block h-3" aria-hidden="true" />;
                  return (
                    <span key={j} className="block">
                      {cut ? <><strong className="font-extrabold">{gloss(`${cut.label}:`, 'l')}</strong> {gloss(cut.rest, 'r')}</> : gloss(para, '')}
                    </span>
                  );
                })}
              </p>
              {english && c.en && <p className="mt-1.5 whitespace-pre-line text-[0.875rem] leading-relaxed text-game-muted" lang="en">{c.en}</p>}
            </div>
          ))}
        </div>
        {english && all && reading.en && <p className="mt-3 whitespace-pre-line text-[0.875rem] leading-relaxed text-game-muted" lang="en">{reading.en}</p>}
      </StepScreen>
    );
  }

  // the transcript, line by line
  const title = phases.includes('listen') ? t('card.readAlong') : playable ? t('card.listen') : t('card.read');
  const anyEnglish = lines.some((l) => l.en);
  return (
    <StepScreen
      title={title}
      aside={(
        <>
          {anyEnglish && englishKey}
          {playable && (
            <IconKey label={t('card.listenAll')} onClick={() => listenAll()}>
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            </IconKey>
          )}
        </>
      )}
      action={nextButton}
    >
      {glossHint}
      <ol className="space-y-3.5" aria-live="polite">
        {lines.slice(0, shown).map((l, k) => {
          const name = speakerName(l.speaker, names);
          const isNew = k === shown - 1;
          return (
            <li
              key={l.id}
              ref={isNew ? newest : undefined}
              className={`flex items-end gap-2.5 ${isNew ? 'motion-safe:animate-pop-in' : ''}`}
              data-line-id={l.id}
            >
              <CastAvatar name={name} size={44} decorative className="mb-1 shrink-0" />
              <SpeechBubble tail="left" className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`${LABEL} pt-0.5`}>{name}</p>
                  {playable && (
                    <button
                      type="button"
                      onClick={() => playV2Line(unitId, l)}
                      aria-label={`${t('audio.play')}: ${name}`}
                      className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-course-ink hover:bg-course-wash active:translate-y-px motion-reduce:transform-none"
                    >
                      <Volume2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p className={`${playable ? '-mt-3' : 'mt-0.5'} text-[1.125rem] font-semibold leading-snug text-game-text`} lang="de">
                  <GlossText text={l.de} glosses={glosses} open={open} setOpen={setOpen} idPrefix={`g-${l.id}`} lang={lang} />
                </p>
                {english && l.en && <p className="mt-1 text-[0.875rem] leading-snug text-game-muted" lang="en">{l.en}</p>}
              </SpeechBubble>
            </li>
          );
        })}
      </ol>
    </StepScreen>
  );
}
