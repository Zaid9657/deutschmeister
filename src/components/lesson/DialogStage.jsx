import { useEffect, useMemo, useState } from 'react';
import { Play, Languages, Mic, Cpu, ListEnd } from 'lucide-react';
import Card from '../ui/Card.jsx';
import StageShell from './StageShell.jsx';
import CharacterAvatar from '../illustrations/CharacterAvatar.jsx';
import { audioFor, playLine, speechAvailable } from '../../lib/lesson/speech.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { buildLexicon, glossTokens, parseLektionId } from '../../lib/lesson/gloss.js';

/**
 * Stage 2a — Input. The dialogue arrives line by line: you reveal the next
 * line, you can play any line, and once a line is on screen it STAYS on screen
 * (CONTRACT.md: sound is never the only channel). The English gloss is a
 * toggle, off by default, so the German is read first. Line by line is the
 * default; "Show all lines" (by the line counter) is the way out for a
 * learner who is re-reading — nine taps for ten lines was the friction the
 * walkthrough measured. Once every line is on screen the primary reads
 * "Continue" either way. Every label here is `t()` from the lesson string
 * table (English chrome by default, Deutsch-Modus on the toggle); the lines
 * themselves are German content.
 *
 * Audio is the recording when scripts/generate-course-audio.mjs has rendered
 * the line (manifest src/data/curricula/<level>.audio.js, key `line-<i>`) and
 * `window.speechSynthesis` otherwise. The learner is told which one they are
 * getting — see AudioSourceBadge.
 */

/**
 * "Recording" vs "Computer voice" (Deutsch-Modus: „Aufnahme" / „Computerstimme"),
 * honest until the whole level is recorded
 * (plan P1). Word AND icon, never colour alone — and it is a label, not a
 * control, so it carries no interactive colour (design tokens: one interactive
 * colour, `siegel`). Exported because the dictation and pretest screens show
 * exactly the same badge; all three are one component on purpose.
 */
export function AudioSourceBadge({ recorded, className = '' }) {
  const Icon = recorded ? Mic : Cpu;
  const [lang] = useLessonLang();
  return (
    <span
      className={`inline-flex items-center gap-1 font-data text-[0.625rem] font-bold uppercase tracking-[0.11em] text-graphite ${className}`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {t(recorded ? 'audio.recorded' : 'audio.synthetic', lang)}
    </span>
  );
}

/**
 * Tap-word gloss: one German dialogue line rendered as tokens, where a token
 * (or a matched multi-word phrase) known from the Wortfeld of this or an
 * earlier Lektion becomes a tappable gloss. Only one popover is open across
 * the whole stage at a time (`openGloss`/`setOpenGloss`, lifted to the parent
 * so a tap on line 3 closes line 1's popover); Escape and a tap outside close
 * it, both wired once in the parent via a document listener.
 */
function GlossLine({ line, lineIndex, lexicon, lang, openGloss, setOpenGloss }) {
  const segments = useMemo(() => glossTokens(line, lexicon), [line, lexicon]);
  return (
    <p className="mt-1 text-[1.0625rem] leading-relaxed text-ink" lang="de">
      {segments.map((seg, i) => {
        if (seg.type !== 'gloss') {
          return <span key={i}>{i > 0 ? ' ' : ''}{seg.text}</span>;
        }
        const glossId = `gloss-${lineIndex}-${i}`;
        const popoverId = `${glossId}-popover`;
        const isOpen = openGloss === glossId;
        const { entry } = seg;
        return (
          <span key={i} className="relative">
            {i > 0 ? ' ' : ''}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenGloss(isOpen ? null : glossId);
              }}
              aria-describedby={isOpen ? popoverId : undefined}
              aria-expanded={isOpen}
              className="inline-flex min-h-11 items-center px-0.5 py-2.5 -my-2.5 underline decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-siegel"
            >
              {seg.text}
            </button>
            {isOpen && (
              <span
                id={popoverId}
                role="tooltip"
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full z-10 mt-1 block w-max max-w-[15rem] rounded-clay border border-rule bg-white p-2.5 text-left shadow-md transition-opacity duration-100 ease-snap motion-reduce:transition-none"
              >
                <span className="block font-display text-[0.9375rem] font-semibold text-ink" lang="de">{entry.de}</span>
                <span className="block text-[0.8125rem] leading-snug text-graphite">{entry.en}</span>
                {entry.plural && (
                  <span className="block text-[0.75rem] text-graphite">
                    {t('wortfeld.plural', lang)} {entry.plural}
                  </span>
                )}
              </span>
            )}
          </span>
        );
      })}
    </p>
  );
}

export default function DialogStage({ stage, lektionId, onBack, onDone }) {
  const lines = (stage.dialog && stage.dialog.lines) || [];
  const id = lektionId || stage.lektionId || null;
  const [shown, setShown] = useState(1);
  const [gloss, setGloss] = useState(false);
  const [played, setPlayed] = useState(() => new Set());
  const [openGloss, setOpenGloss] = useState(null);
  const [lang] = useLessonLang();
  const allShown = shown >= lines.length;

  const parsed = useMemo(() => parseLektionId(id), [id]);
  const lexicon = useMemo(
    () => (parsed ? buildLexicon(parsed.level, parsed.nr) : []),
    [parsed],
  );

  // Escape and a tap outside any popover close it — one popover open at a
  // time, wired once for the whole stage rather than per line.
  useEffect(() => {
    if (!openGloss) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpenGloss(null); };
    const onClick = () => setOpenGloss(null);
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [openGloss]);

  const play = (i, text) => {
    setPlayed((prev) => new Set(prev).add(i));
    playLine(id, `line-${i}`, text);
  };

  return (
    <StageShell
      eyebrow={t('stage.input.eyebrow', lang)}
      title={stage.dialog?.title || t('stage.input.title', lang)}
      lead={stage.dialog?.setting}
      onBack={onBack}
      primaryLabel={allShown ? t('action.next', lang) : t('action.nextLine', lang)}
      onPrimary={allShown ? onDone : () => setShown((n) => Math.min(n + 1, lines.length))}
      secondary={
        <button
          type="button"
          onClick={() => setGloss((g) => !g)}
          aria-pressed={gloss}
          className="inline-flex items-center gap-1.5 rounded-pill border border-rule bg-white px-3 py-1.5 text-[0.8125rem] font-bold text-graphite hover:border-siegel hover:text-siegel-deep"
        >
          <Languages className="h-4 w-4" /> {t(gloss ? 'dialog.glossOff' : 'dialog.glossOn', lang)}
        </button>
      }
    >
      <ol className="space-y-3">
        {lines.slice(0, shown).map((l, i) => {
          const recorded = !!audioFor(id, `line-${i}`);
          return (
            <li key={`${l.speaker}-${i}`}>
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => play(i, l.de)}
                    disabled={!recorded && !speechAvailable()}
                    aria-label={t('dialog.playLine', lang, { speaker: l.speaker })}
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel transition-transform duration-100 ease-snap hover:bg-siegel hover:text-white active:translate-y-0.5 disabled:opacity-40 motion-reduce:transition-none"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="shrink-0 overflow-hidden rounded-full bg-siegel-wash" aria-hidden="true">
                        <CharacterAvatar name={l.speaker} size={32} />
                      </span>
                      <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{l.speaker}</p>
                      <AudioSourceBadge recorded={recorded} />
                    </div>
                    <GlossLine
                      line={l.de}
                      lineIndex={i}
                      lexicon={lexicon}
                      lang={lang}
                      openGloss={openGloss}
                      setOpenGloss={setOpenGloss}
                    />
                    {gloss && <p className="mt-1 text-[0.875rem] leading-relaxed text-graphite">{l.en}</p>}
                    {played.has(i) && !recorded && !speechAvailable() && (
                      <p className="mt-1 text-[0.75rem] text-graphite">{t('dialog.noSpeech', lang)}</p>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
      {!allShown && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-data text-[0.75rem] text-graphite">
            {t('dialog.lineOf', lang, { n: shown, total: lines.length })}
          </p>
          {/* The secondary control sits by the counter, not in the footer: a
              third footer control wraps its label at phone width. */}
          <button
            type="button"
            onClick={() => setShown(lines.length)}
            className="inline-flex items-center gap-1.5 rounded-pill border border-rule bg-white px-3 py-1.5 text-[0.8125rem] font-bold text-graphite hover:border-siegel hover:text-siegel-deep"
          >
            <ListEnd className="h-4 w-4" aria-hidden="true" /> {t('action.showAllLines', lang)}
          </button>
        </div>
      )}
    </StageShell>
  );
}
