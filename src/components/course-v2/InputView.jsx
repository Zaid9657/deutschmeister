import { useEffect, useMemo, useState } from 'react';
import { Languages, Eye, EyeOff, Headphones } from 'lucide-react';
import AudioButton from './AudioButton.jsx';
import { canPlay, speakerName } from './content.js';
import { useV2Strings } from './strings.js';

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
const TOGGLE = 'inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-game-line bg-white px-3 py-1.5 text-[0.875rem] font-extrabold text-game-muted hover:bg-course-wash hover:text-course-ink';
const STRIP = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;
const clean = (s) => String(s || '').replace(STRIP, '').toLowerCase();

/**
 * Tap-a-word gloss for one German line. Only the tokens the unit glosses (Input.glosses /
 * ExamText.glosses, ≤ 3 per input, SCHEMA §8) are tappable — dotted underline, ≥ 44 px
 * touch height, one popover open at a time (the owner holds `open`). Multi-word glosses
 * match phrase-first.
 */
export function GlossText({ text, glosses, open, setOpen, idPrefix, lang }) {
  const paragraphs = String(text || '').split('\n');
  if (paragraphs.length > 1) {
    return paragraphs.map((p, i) => (
      <span key={i}>
        {i > 0 && <br />}
        <GlossLine text={p} glosses={glosses} open={open} setOpen={setOpen} idPrefix={`${idPrefix}-p${i}`} lang={lang} />
      </span>
    ));
  }
  return <GlossLine text={text} glosses={glosses} open={open} setOpen={setOpen} idPrefix={idPrefix} lang={lang} />;
}

function GlossLine({ text, glosses, open, setOpen, idPrefix, lang }) {
  const lexicon = useMemo(() => (glosses || [])
    .map((g) => ({ tokens: String(g.token || '').split(/\s+/).map(clean).filter(Boolean), gloss: g.gloss || {}, token: g.token }))
    .filter((g) => g.tokens.length)
    .sort((a, b) => b.tokens.length - a.tokens.length), [glosses]);

  const raw = String(text || '').split(/\s+/).filter(Boolean);
  if (!lexicon.length) return <>{text}</>;
  const cleaned = raw.map(clean);
  const segs = [];
  let i = 0;
  while (i < raw.length) {
    const hit = lexicon.find((g) => g.tokens.every((tok, k) => cleaned[i + k] === tok));
    if (hit) { segs.push({ gloss: hit, text: raw.slice(i, i + hit.tokens.length).join(' ') }); i += hit.tokens.length; }
    else { segs.push({ text: raw[i] }); i += 1; }
  }
  return segs.map((s, n) => {
    if (!s.gloss) return <span key={n}>{n > 0 ? ' ' : ''}{s.text}</span>;
    const gid = `${idPrefix}-${n}`;
    const isOpen = open === gid;
    const g = s.gloss.gloss;
    const extra = lang === 'de' ? null : (g.tr || g.ar || null);
    return (
      <span key={n} className="relative">
        {n > 0 ? ' ' : ''}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(isOpen ? null : gid); }}
          aria-expanded={isOpen}
          aria-describedby={isOpen ? `${gid}-pop` : undefined}
          className="-my-2.5 inline-flex min-h-11 items-center px-0.5 py-2.5 underline decoration-dotted decoration-2 underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-course"
        >
          {s.text}
        </button>
        {isOpen && (
          <span
            id={`${gid}-pop`}
            role="tooltip"
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full z-10 mt-1 block w-max max-w-[15rem] rounded-xl border-2 border-game-line bg-white p-2.5 text-left shadow-game-line"
          >
            <span className="block text-[0.9375rem] font-extrabold text-game-text" lang="de">{s.gloss.token}</span>
            <span className="block text-[0.8125rem] font-semibold leading-snug text-game-muted">{g.en}</span>
            {extra && <span className="block text-[0.8125rem] font-semibold leading-snug text-game-muted">{extra}</span>}
          </span>
        )}
      </span>
    );
  });
}

/** Closes the one open gloss on Escape or a tap anywhere else. */
export function useGlossPopover() {
  const [open, setOpen] = useState(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    const onClick = () => setOpen(null);
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [open]);
  return [open, setOpen];
}

/**
 * The input of a Situation / Text Lernschritt (SCHEMA §8 `Input`, BLUEPRINT §3.3 segment 2):
 * a dialogue or monologue (lines with a voice), a reading text, or both.
 *
 * Listen first: with `transcriptAfterUnaidedListen` the German lines stay hidden until the
 * learner has played the whole input once — then the transcript opens and stays open, each
 * line with its own play button. Sound is never the only channel: when the browser cannot
 * play the audio at all, the transcript is shown at once. English is a toggle, off by
 * default, so the German is read first. `onHeard` fires once after the first full play.
 */
export default function InputView({ input, unitId, names = null, onHeard }) {
  const [lang, t] = useV2Strings();
  const lines = Array.isArray(input?.lines) ? input.lines : [];
  const hasAudio = lines.length > 0;
  const playable = hasAudio && canPlay(unitId, lines[0].id);
  const gate = hasAudio && input?.transcriptAfterUnaidedListen !== false && playable;
  const [heard, setHeard] = useState(false);
  const [showText, setShowText] = useState(!gate);
  const [english, setEnglish] = useState(false);
  const [open, setOpen] = useGlossPopover();
  const glosses = input?.glosses || [];

  const onPlayedAll = () => {
    if (!heard) {
      setHeard(true);
      setShowText(true);
      if (typeof onHeard === 'function') onHeard();
    }
  };

  return (
    <div>
      {input?.title && <h2 className="text-[1.375rem] font-extrabold leading-tight text-game-text sm:text-[1.5rem]" lang="de">{input.title}</h2>}

      {hasAudio && (
        <div className="mt-4 rounded-[1.25rem] border-2 border-b-4 border-course bg-course-wash p-4">
          <p className="flex items-start gap-2 text-[1rem] font-bold text-course-ink">
            <Headphones className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{gate && !heard ? t('input.listenFirst') : t('audio.playAgain')}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <AudioButton unitId={unitId} lines={lines} label={heard ? t('audio.playAgain') : t('audio.play')} onPlayed={onPlayedAll} />
            <AudioButton unitId={unitId} lines={lines} label={t('audio.slow')} rate={0.8} size="sm" onPlayed={onPlayedAll} />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {hasAudio && (heard || !gate) && (
          <button
            type="button"
            onClick={() => setShowText((s) => !s)}
            aria-pressed={showText}
            className={TOGGLE}
          >
            {showText ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            {showText ? t('input.hideText') : t('input.showText')}
          </button>
        )}
        {(showText || input?.text) && (
          <button
            type="button"
            onClick={() => setEnglish((e) => !e)}
            aria-pressed={english}
            className={TOGGLE}
          >
            <Languages className="h-4 w-4" aria-hidden="true" /> {english ? t('input.translationOff') : t('input.translationOn')}
          </button>
        )}
      </div>

      {hasAudio && showText && (
        <ol className="mt-4 space-y-2.5">
          {lines.map((l) => (
            <li key={l.id}>
              <div className="flex items-start gap-3 rounded-[1.25rem] border-2 border-game-line bg-white p-3">
                <AudioButton unitId={unitId} line={l} iconOnly ariaLabel={`${t('audio.play')}: ${speakerName(l.speaker, names)}`} />
                <div className="min-w-0">
                  <p className={LABEL}>{speakerName(l.speaker, names)}</p>
                  <p className="mt-0.5 text-[1.125rem] font-semibold leading-relaxed text-game-text" lang="de">
                    <GlossText text={l.de} glosses={glosses} open={open} setOpen={setOpen} idPrefix={`g-${l.id}`} lang={lang} />
                  </p>
                  {english && l.en && <p className="mt-1 text-[0.875rem] leading-relaxed text-game-muted">{l.en}</p>}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {input?.text && (
        <div className="mt-4 rounded-[1.25rem] border-2 border-game-line bg-white p-4">
          {!hasAudio && <p className={LABEL}>{t('input.readFirst')}</p>}
          <p className="mt-1 whitespace-pre-line text-[1.125rem] font-semibold leading-relaxed text-game-text" lang="de">
            <GlossText text={input.text.de} glosses={glosses} open={open} setOpen={setOpen} idPrefix="g-text" lang={lang} />
          </p>
          {english && input.text.en && <p className="mt-2 whitespace-pre-line text-[0.875rem] leading-relaxed text-game-muted">{input.text.en}</p>}
        </div>
      )}

      {glosses.length > 0 && (showText || input?.text) && <p className="mt-3 text-[0.875rem] font-semibold text-game-muted">{t('input.glossHint')}</p>}
    </div>
  );
}
