import { useEffect, useRef, useState } from 'react';
import AudioButton, { useV2Playback } from './AudioButton.jsx';
import GameButton from './GameButton.jsx';
import StepScreen from './StepScreen.jsx';
import { SayButton } from './WordList.jsx';
import { canPlay } from './content.js';
import { nounParts } from './kapitel.js';
import { useV2Strings } from './strings.js';

const LABEL = 'text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted';
const CARD = 'flex flex-col items-center rounded-[1.5rem] border-2 border-b-4 border-game-line bg-white px-5 pb-7 pt-6 text-center';

/**
 * Speak one German text once when a card appears — only where the browser can play it at all
 * (a recording, or speech synthesis); never throws, never blocks. The short delay lets the card
 * land first, and cancelling it on unmount keeps a quickly skipped card silent; a word already
 * speaking stops with its card (useV2Playback, CRITIC-01).
 */
export function useAutoPlay(unitId, id, text) {
  const playback = useV2Playback(`${unitId}|${id}`);
  useEffect(() => {
    if (!text || !id || !canPlay(unitId, id)) return undefined;
    const timer = setTimeout(() => { playback.line(unitId, { id, de: text }); }, 250);
    return () => clearTimeout(timer);
  }, [unitId, id, text, playback]);
}

/**
 * A deck of cards, one per screen: the position, the step's progress bar fed after every card
 * (`onProgress(i / total)`, like ItemRun), and `onDone()` once, after the last card's „Weiter".
 */
function useDeck(total, onDone, onProgress) {
  const [i, setI] = useState(0);
  const finished = useRef(false);
  const sink = useRef(onProgress);
  sink.current = onProgress;
  useEffect(() => {
    if (typeof sink.current === 'function') sink.current(total ? Math.min(1, i / total) : 1);
  }, [i, total]);
  const next = () => {
    if (i + 1 < total) { setI(i + 1); return; }
    if (finished.current) return;
    finished.current = true;
    if (typeof onDone === 'function') onDone();
  };
  return [i, next];
}

/**
 * „Neue Wörter" as flashcards, one word per screen (owner feedback 2026-09-30: the whole list on
 * one screen was "intimidating and too much"): the word big — the article in the neutral muted ink
 * before it (never a kasus colour: an article on a word card names no case), the plural small under
 * it — its voice once when the card appears, the English meaning, the example sentence with its own
 * speaker key, a small „3 / 8", and one „Weiter" in the bottom bar. The whole list stays one tap
 * deep on the Kapitel page and in /course/:level/wortschatz (WordList).
 */
export default function WordCards({ words, unitId = null, onDone, onProgress = null }) {
  const [lang, t] = useV2Strings();
  const list = Array.isArray(words) ? words.filter(Boolean) : [];
  const [i, next] = useDeck(list.length, onDone, onProgress);
  const w = list[i] || null;
  const p = nounParts(w);
  const uid = unitId || (w && w.unit) || null;
  useAutoPlay(uid, w && w.id, p.say);
  if (!w) return null;
  const plural = p.note === 'pl'
    ? t('card.pluralOnly')
    : p.note === 'sg'
      ? t('card.singularOnly')
      : w.pos === 'NOUN' && w.plural ? t('card.plural', { p: `die ${w.plural}` }) : null;
  const counter = { n: i + 1, total: list.length, label: t('card.wordOf', { n: i + 1, total: list.length }) };
  return (
    <StepScreen title={t('card.newWord')} counter={counter} action={<GameButton onClick={next}>{t('item.next')}</GameButton>}>
      <p className="sr-only" aria-live="polite">{`${counter.label}: ${p.say}${w.gloss ? ` – ${w.gloss}` : ''}`}</p>
      <div key={w.id} className="motion-safe:animate-pop-in" data-word-card={w.id}>
        <div className={CARD}>
          <AudioButton unitId={uid} line={{ id: w.id, de: p.say }} iconOnly size="lg" ariaLabel={t('kap.hear', { w: p.say })} />
          <p className="mt-4 text-[2.25rem] leading-tight text-game-text [hyphens:auto]" lang="de">
            {p.article && <span className="font-bold text-game-muted">{p.article} </span>}
            <span className="font-extrabold">{p.lemma}</span>
          </p>
          {plural && <p className="mt-1 text-[0.9375rem] font-bold text-game-muted">{plural}</p>}
          {w.gloss && <p className="mt-4 text-[1.1875rem] font-extrabold leading-snug text-course-ink" lang="en">{w.gloss}</p>}
        </div>
        {w.example && (
          <div className="mt-4 flex items-start gap-3 rounded-[1.25rem] bg-course-wash p-4">
            <SayButton unitId={uid} id={`${w.id}-ex`} text={w.example} label={t('card.hearExample')} />
            <div className="min-w-0">
              <p className={LABEL}>{t('card.example')}</p>
              <p className="mt-0.5 text-[1.125rem] font-semibold leading-snug text-game-text" lang="de">{w.example}</p>
              {w.exampleEn && lang !== 'de' && <p className="mt-1 text-[0.875rem] leading-snug text-game-muted" lang="en">{w.exampleEn}</p>}
            </div>
          </div>
        )}
      </div>
    </StepScreen>
  );
}

/**
 * The Redemittel of a Sprache step, one phrase per screen, the same way: the phrase big with its
 * voice once, what it is for (German chrome) or its English (English chrome), a counter, „Weiter".
 */
export function PhraseCards({ phrases, unitId = null, onDone, onProgress = null }) {
  const [lang, t] = useV2Strings();
  const list = Array.isArray(phrases) ? phrases.filter((r) => r && r.de) : [];
  const [i, next] = useDeck(list.length, onDone, onProgress);
  const r = list[i] || null;
  useAutoPlay(unitId, r && r.id, r && r.de);
  if (!r) return null;
  const counter = { n: i + 1, total: list.length, label: t('card.phraseOf', { n: i + 1, total: list.length }) };
  const meaning = lang === 'de' ? r.function : r.en;
  return (
    <StepScreen title={t('card.phrases')} counter={counter} action={<GameButton onClick={next}>{t('item.next')}</GameButton>}>
      <p className="sr-only" aria-live="polite">{`${counter.label}: ${r.de}`}</p>
      <div key={r.id} className="motion-safe:animate-pop-in" data-phrase-card={r.id}>
        <div className={CARD}>
          <AudioButton unitId={unitId} line={{ id: r.id, de: r.de }} iconOnly size="lg" ariaLabel={t('kap.hear', { w: r.de })} />
          <p className="mt-4 text-[1.625rem] font-extrabold leading-snug text-game-text [hyphens:auto]" lang="de">{r.de}</p>
          {meaning && <p className="mt-4 text-[1.0625rem] font-bold leading-snug text-course-ink" lang={lang === 'de' ? 'de' : 'en'}>{meaning}</p>}
        </div>
      </div>
    </StepScreen>
  );
}
