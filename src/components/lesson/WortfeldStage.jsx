import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Volume2, Mic, Cpu } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import StageShell from './StageShell.jsx';
import SituationScene from '../illustrations/SituationScene.jsx';
import { playWord } from '../../lib/lesson/speech.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { WORTFELD_ICONS, WORTFELD_ICON_FALLBACK } from '../../data/curricula/a11.meta.js';
import { CURRICULUM_A11 } from '../../data/curricula/a11.js';

/**
 * Stage 2b — the new words as picture cards: icon, article, plural, English
 * (behind a flip), audio.
 *
 * NOTE ON COLOUR. The design tokens name colours for the four grammatical
 * CASES and nothing else (design-tokens.js rule 1: "colour means case"), so
 * grammatical GENDER is rendered neutrally here — the article is spelled out
 * in a quiet chip instead of being encoded in a hue. Inventing der/die/das
 * colours would either collide with the case palette or add hexes outside the
 * token file; both are out of system. The article is text, and text is
 * unambiguous. Same rule for the icon circle: it is always `siegel`/
 * `siegel-wash`, never per-word colour — the icon is a memory hook, not a
 * category code.
 *
 * `words` carries the curriculum's own fields; anything fetched from the
 * `words` table (audio_url above all) is merged in by the player as `db`.
 * Every card flips independently (tap or Enter/Space on the card body) to
 * show its English side; "Show all English" is the way out for a learner
 * scanning the whole set, same shape as DialogStage's "Show all lines".
 * Flipped state is never colour-only: a text "EN" tag travels with it.
 *
 * The scene banner is `SituationScene` (src/components/illustrations/) keyed
 * by Lektion id — it renders the manifest's photo once `a11.art.js` carries
 * one, and a flat-vector placeholder until then (see that component's
 * header). `stage.words` alone carries no Lektion id by the time it reaches
 * this stage (buildLesson.js's wortfeld stage object has none, and the one
 * caller — LessonPlayerPage.jsx — does not pass a `lektionId` prop to this
 * stage the way it does for every sibling stage), so `lektionIdFromWords`
 * recovers it here, from the one file this component already reads for
 * everything else: it matches this stage's first word against each
 * Lektion's own `wortfeld[0]`, which is unique per Lektion in this course.
 */

/** Best-effort recovery of the Lektion id from Wortfeld content alone — see the note above. */
function lektionIdFromWords(words) {
  const first = words && words[0] && (words[0].de || words[0].word);
  if (!first) return null;
  const found = CURRICULUM_A11.lektionen.find((l) => {
    const w0 = l.wortfeld && l.wortfeld[0];
    return w0 && (w0.de || w0.word) === first;
  });
  return found ? found.id : null;
}

function iconFor(word) {
  const name = (word && WORTFELD_ICONS[word]) || WORTFELD_ICON_FALLBACK;
  return LucideIcons[name] || LucideIcons[WORTFELD_ICON_FALLBACK];
}

function WordCard({ w, lang, flipped, onToggle }) {
  const article = w.article || (w.db && w.db.article) || '';
  const plural = w.plural || (w.db && w.db.plural) || '';
  const audioUrl = (w.db && w.db.audioUrl) || w.audioUrl || '';
  const spoken = w.de || w.word || '';
  const english = w.en || (w.db && w.db.english) || '';
  const Icon = iconFor(w.word || w.de);

  return (
    <Card interactive as="div" className="flex h-full flex-col items-center gap-2.5 p-3.5 text-center">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={flipped}
        aria-label={flipped ? t('wortfeld.flipHint', lang, { word: spoken }) : spoken}
        className="flex min-h-11 w-full flex-1 flex-col items-center gap-2 rounded-clay outline-none focus-visible:ring-2 focus-visible:ring-siegel"
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel transition-transform duration-150 ease-snap motion-reduce:transition-none"
          aria-hidden="true"
        >
          <Icon className="h-6 w-6" />
        </span>

        {flipped ? (
          <>
            <Chip tone="quiet">{t('wortfeld.en', lang)}</Chip>
            <p className="text-[0.9375rem] leading-snug text-ink">{english}</p>
          </>
        ) : (
          <>
            <p className="truncate font-display text-[1.0625rem] font-semibold text-ink" lang="de">
              {spoken}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {article && <Chip tone="quiet">{article}</Chip>}
              {plural && (
                <span className="font-data text-[0.6875rem] text-graphite">
                  {t('wortfeld.plural', lang)} {plural}
                </span>
              )}
            </div>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={() => playWord(audioUrl, spoken)}
        aria-label={t('wortfeld.listen', lang, { word: spoken })}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel transition-colors duration-100 hover:bg-siegel hover:text-white motion-reduce:transition-none"
      >
        <Volume2 className="h-4 w-4" />
      </button>
    </Card>
  );
}

/**
 * ONE badge for the whole stage, in the header, instead of the same
 * "Computer voice"/"Recording" badge repeated on all 20 cards — the
 * per-card speaker button still plays each word, this just states once
 * whether the set is recorded, synthetic, or a mix. Word AND icon, never
 * colour alone, same rule as the per-card badge it replaces.
 */
function WortfeldAudioBadge({ words, lang }) {
  const total = words.length;
  if (total === 0) return null;
  const recordedCount = words.reduce((n, w) => {
    const audioUrl = (w.db && w.db.audioUrl) || w.audioUrl || '';
    return n + (audioUrl ? 1 : 0);
  }, 0);
  const state = recordedCount === 0 ? 'synthetic' : recordedCount === total ? 'recorded' : 'mixed';
  const key = state === 'synthetic' ? 'wortfeld.audioBadge.computer' : state === 'recorded' ? 'wortfeld.audioBadge.recordings' : 'wortfeld.audioBadge.mixed';

  return (
    <span className="inline-flex items-center gap-1 font-data text-[0.6875rem] font-bold uppercase tracking-[0.11em] text-graphite">
      {state !== 'synthetic' && <Mic className="h-3 w-3" aria-hidden="true" />}
      {state !== 'recorded' && <Cpu className="h-3 w-3" aria-hidden="true" />}
      {t(key, lang)}
    </span>
  );
}

export default function WortfeldStage({ stage, lektionId, onBack, onDone }) {
  const [open, setOpen] = useState(() => new Set());
  const [allOpen, setAllOpen] = useState(false);
  const words = stage.words || [];
  const [lang] = useLessonLang();
  const id = lektionId || stage.lektionId || lektionIdFromWords(words);

  const toggle = (i) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  const toggleAll = () => {
    setAllOpen((prev) => {
      const next = !prev;
      setOpen(next ? new Set(words.map((_, i) => i)) : new Set());
      return next;
    });
  };

  return (
    <StageShell
      eyebrow={t('stage.wortfeld.eyebrow', lang)}
      title={t('stage.wortfeld.title', lang, { n: words.length })}
      lead={t('stage.wortfeld.lead', lang)}
      onBack={onBack}
      primaryLabel={t('action.next', lang)}
      onPrimary={onDone}
    >
      {id && (
        <SituationScene lektionId={id} className="mb-4 h-32 w-full rounded-clay border border-rule object-cover sm:h-40" />
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <WortfeldAudioBadge words={words} lang={lang} />
        <button
          type="button"
          onClick={toggleAll}
          aria-pressed={allOpen}
          className="min-h-11 rounded-clay px-2 text-sm font-bold text-siegel-deep hover:underline"
        >
          {t(allOpen ? 'wortfeld.hideAllEnglish' : 'wortfeld.showAllEnglish', lang)}
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {words.map((w, i) => {
          const spoken = w.de || w.word || '';
          return (
            <li key={`${spoken}-${i}`}>
              <WordCard w={w} lang={lang} flipped={open.has(i)} onToggle={() => toggle(i)} />
            </li>
          );
        })}
      </ul>
    </StageShell>
  );
}
