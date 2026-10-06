import { useState } from 'react';
import Chip from '../ui/Chip.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { supportKeys } from '../../lib/lesson/support.js';
import { useSupport } from './SupportText.jsx';

/**
 * One flip card: front = German (with an article chip when the word has
 * one), back = English. Tap or Enter/Space flips it. The flipped state is
 * announced through text (aria-live region below), never through colour
 * alone — a card with no article chip and a card mid-flip must both still
 * read correctly to a screen reader and to someone who cannot see colour.
 */
function WordCard({ word, level }) {
  const [flipped, setFlipped] = useState(false);
  const [lang] = useLessonLang();
  const support = useSupport(level);
  const de = word.de || word.word || '';
  // The article is its own chip, so the card shows the bare noun (`de` already
  // carries the article — "der | der Gruß" was printed twice).
  const headword = word.article && word.word ? word.word : de;
  const meaning = support(word.wordId ? supportKeys.word(word.wordId) : null, { en: word.en || '' });
  const label = flipped ? `${de}: ${meaning.text}` : de;

  return (
    <button
      type="button"
      onClick={() => setFlipped((v) => !v)}
      aria-pressed={flipped}
      aria-label={`${label} — ${t(flipped ? 'words.showGerman' : 'words.showEnglish', lang)}`}
      className="flex min-h-[5.5rem] w-full flex-col items-start justify-center gap-1 rounded-clay border border-rule bg-white p-3 text-start shadow-raise transition-all duration-150 ease-snap hover:-translate-y-0.5 hover:shadow-raise-lg active:translate-y-1 active:shadow-none"
    >
      {flipped ? (
        <>
          <span className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite">{t('words.showGerman', lang)}</span>
          <span className="text-[0.9375rem] font-bold leading-snug text-ink" lang={meaning.lang} dir={meaning.lang === 'ar' ? 'rtl' : 'ltr'}>{meaning.text || '—'}</span>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5" dir="ltr">
            {word.article && <Chip tone="label" size="sm"><span lang="de">{word.article}</span></Chip>}
            <span className="text-[0.9375rem] font-bold leading-snug text-ink" lang="de">{headword}</span>
          </div>
          <span className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite">{t('words.showEnglish', lang)}</span>
        </>
      )}
    </button>
  );
}

/**
 * The recap's Wortfeld review: every word of the Lektion as a flip card.
 * Pure display — no mastery data attaches (that lives in the SRS review
 * deck), just "here is what you just learned, look again before you go".
 */
export default function WordsLearnedCards({ words, level = null }) {
  const [lang] = useLessonLang();
  const list = words || [];
  if (!list.length) return null;

  return (
    <div>
      <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{t('words.tapToFlip', lang)}</p>
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {list.map((w, i) => (
          <li key={w.wordId || w.de || i}>
            <WordCard word={w} level={level} />
          </li>
        ))}
      </ul>
    </div>
  );
}
