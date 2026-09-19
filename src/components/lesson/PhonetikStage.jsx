import { useState } from 'react';
import { Check, Volume2 } from 'lucide-react';
import StageShell from './StageShell.jsx';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { playLine, phonetikSpeechText } from '../../lib/lesson/speech.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/**
 * One Phonetik item ("HAL-lo", "Te-le-FON", a question item with a rising
 * arrow) split into syllables on its hyphens, the CAPITALISED syllable
 * emphasised. Non-syllable items (a whole short sentence like "um ACHT Uhr")
 * have no hyphen, so the split is a no-op and the item renders as one run of text with its
 * capitalised word(s) bold — the same rule, just nothing to join back with a
 * hyphen.
 */
export function renderSyllables(item) {
  return String(item || '')
    .split(/(\s+)/)
    .map((chunk, ci) => {
      if (/^\s+$/.test(chunk)) return chunk;
      const parts = chunk.split('-');
      return parts.map((part, pi) => {
        const stressed = part.length > 0 && part === part.toUpperCase() && part !== part.toLowerCase();
        const node = stressed ? <strong key={`${ci}-${pi}`}>{part}</strong> : <span key={`${ci}-${pi}`}>{part}</span>;
        return pi < parts.length - 1 ? [node, '-'] : node;
      });
    });
}

/**
 * Stage 3 (shared with `notice`) — Phonetik. Every Lektion's `phonetik`
 * ({ focus, items }) drilled one card per item: the syllable-split display
 * text, a play button that speaks the NORMALISED text (hyphens closed,
 * arrows dropped — `phonetikSpeechText`, moved to speech.js so this and
 * scripts/generate-course-audio.mjs share one implementation) through a
 * recorded `phonetik-<i>` clip when the manifest has one, and a "Say it
 * after the voice" self-confirm toggle. There is no grading here — Phonetik
 * is ear training, not a graded item, so the toggle is a plain checkmark the
 * learner sets for themselves.
 */
export default function PhonetikStage({ stage, lektionId, onBack, onDone }) {
  const [lang] = useLessonLang();
  const phonetik = stage?.phonetik || {};
  const items = phonetik.items || [];
  const [said, setSaid] = useState(() => new Set());

  const play = (item, i) => playLine(lektionId, `phonetik-${i}`, phonetikSpeechText(item));
  const toggleSaid = (i) => setSaid((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  return (
    <StageShell
      variant="input"
      eyebrow={t('stage.phonetik.eyebrow', lang)}
      title={t('stage.phonetik.title', lang)}
      onBack={onBack}
      primaryLabel={t('action.next', lang)}
      onPrimary={onDone}
    >
      {phonetik.focus && (
        <div className="mb-5">
          <p className="font-display text-xl text-ink" lang="de">{phonetik.focus}</p>
          <p className="mt-1 text-sm text-graphite">{t('phonetik.listenFor', lang)}</p>
        </div>
      )}
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={`${item}-${i}`}>
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="font-display text-xl text-ink" lang="de">{renderSyllables(item)}</p>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => play(item, i)} aria-label={t('action.listen', lang)}>
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant={said.has(i) ? 'primary' : 'secondary'}
                  onClick={() => toggleSaid(i)}
                  aria-pressed={said.has(i)}
                >
                  <Check className="h-4 w-4" aria-hidden="true" /> {said.has(i) ? t('phonetik.said', lang) : t('phonetik.sayAfter', lang)}
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </StageShell>
  );
}
