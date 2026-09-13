import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';
import StageShell from './StageShell.jsx';
import { playWord } from '../../lib/lesson/speech.js';

/**
 * Stage 2b — the new words as cards: article, plural, English, audio.
 *
 * NOTE ON COLOUR. The design tokens name colours for the four grammatical
 * CASES and nothing else (design-tokens.js rule 1: "colour means case"), so
 * grammatical GENDER is rendered neutrally here — the article is spelled out
 * in a quiet chip instead of being encoded in a hue. Inventing der/die/das
 * colours would either collide with the case palette or add hexes outside the
 * token file; both are out of system. The article is text, and text is
 * unambiguous.
 *
 * `words` carries the curriculum's own fields; anything fetched from the
 * `words` table (audio_url above all) is merged in by the player as `db`.
 */
export default function WortfeldStage({ stage, onBack, onDone }) {
  const [open, setOpen] = useState(() => new Set());
  const words = stage.words || [];

  const toggle = (i) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });

  return (
    <StageShell
      eyebrow="Schritt 2 · Wortfeld"
      title={`${words.length} neue Wörter`}
      lead="Tippen Sie auf eine Karte für die Übersetzung, auf den Lautsprecher zum Hören."
      onBack={onBack}
      primaryLabel="Weiter"
      onPrimary={onDone}
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {words.map((w, i) => {
          const article = w.article || (w.db && w.db.article) || '';
          const plural = w.plural || (w.db && w.db.plural) || '';
          const audioUrl = (w.db && w.db.audioUrl) || w.audioUrl || '';
          const spoken = w.de || w.word || '';
          return (
            <li key={`${spoken}-${i}`}>
              <Card interactive as="div" className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => toggle(i)} className="min-w-0 flex-1 text-left" aria-expanded={open.has(i)}>
                    <p className="truncate font-display text-[1.0625rem] font-semibold text-ink">{spoken}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {article && <Chip tone="quiet">{article}</Chip>}
                      {plural && <span className="font-data text-[0.6875rem] text-graphite">Pl. {plural}</span>}
                    </div>
                    <p className={`mt-2 text-[0.875rem] leading-snug ${open.has(i) ? 'text-graphite' : 'text-transparent'}`}>
                      {open.has(i) ? w.en || (w.db && w.db.english) || '' : '—'}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => playWord(audioUrl, spoken)}
                    aria-label={`${spoken} anhören`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel hover:bg-siegel hover:text-white"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </StageShell>
  );
}
