import { useState } from 'react';
import { ChevronDown, Volume2 } from 'lucide-react';
import { canPlay, playV2Line } from './content.js';
import { nounParts } from './kapitel.js';
import { useV2Strings } from './strings.js';

/**
 * A small speaker key that speaks one German text (the recording when the level's audio manifest
 * has one under `id`, else the browser voice). Quiet on purpose: a word list shows dozens of them,
 * so it is a white key with the palette's ink, not the chunky primary.
 */
export function SayButton({ unitId, id, text, label }) {
  if (!text || !canPlay(unitId, id)) return null;
  return (
    <button
      type="button"
      onClick={() => playV2Line(unitId, { id, de: text })}
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-game-line bg-white text-course-ink hover:bg-course-wash active:translate-y-px motion-reduce:transform-none"
    >
      <Volume2 className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

/**
 * One word the way a Lehrwerk's Lernwortschatz prints it — „die Sprachschule, -n", „die Stadt, ¨-e",
 * „die Eltern (nur Pl.)" — with the English gloss under it. The article is set in the neutral muted
 * ink, never a kasus colour (colour means case; an article in a word list names no case). A tap on
 * the word opens its example sentence.
 */
export function WordRow({ word, unitId, idPrefix = 'w' }) {
  const [lang, t] = useV2Strings();
  const [open, setOpen] = useState(false);
  const p = nounParts(word);
  const exId = `${idPrefix}-${String(word.id).replace(/[^a-z0-9-]/gi, '-')}-ex`;
  const hasExample = Boolean(word.example);
  const face = (
    <span className="min-w-0">
      <span className="block text-[1.0625rem] leading-snug text-game-text" lang="de">
        {p.article && <span className="font-bold text-game-muted">{p.article} </span>}
        <span className="font-extrabold">{p.lemma}</span>
        {p.plural && <span className="font-bold text-game-muted">, {p.plural}</span>}
        {p.note && <span className="text-[0.8125rem] font-bold text-game-muted"> ({t(p.note === 'sg' ? 'kap.sg' : 'kap.pl')})</span>}
      </span>
      {word.gloss && <span className="block text-[0.875rem] font-semibold leading-snug text-game-muted" lang="en">{word.gloss}</span>}
    </span>
  );
  return (
    <li className="flex items-start gap-3 border-t-2 border-game-line py-2 first:border-t-0 first:pt-0 last:pb-0">
      <SayButton unitId={unitId || word.unit} id={word.id} text={p.say} label={t('kap.hear', { w: p.say })} />
      <div className="min-w-0 flex-1">
        {hasExample ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={exId}
            className="flex min-h-11 w-full items-start justify-between gap-2 rounded-lg text-left hover:bg-course-wash"
          >
            {face}
            <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-game-muted transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        ) : (
          <div className="flex min-h-11 items-start">{face}</div>
        )}
        {hasExample && open && (
          <div id={exId} className="mt-1 rounded-xl bg-course-wash px-3 py-2">
            <p className="text-[1rem] font-semibold leading-snug text-game-text" lang="de">{word.example}</p>
            {word.exampleEn && lang !== 'de' && <p className="mt-0.5 text-[0.8125rem] leading-snug text-game-muted" lang="en">{word.exampleEn}</p>}
          </div>
        )}
      </div>
    </li>
  );
}

/** A list of words (WordRow each). */
export default function WordList({ words, unitId = null, idPrefix = 'w', className = '' }) {
  if (!Array.isArray(words) || !words.length) return null;
  return (
    <ul className={className}>
      {words.map((w) => <WordRow key={w.id} word={w} unitId={unitId} idPrefix={idPrefix} />)}
    </ul>
  );
}
