import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import Chip from '../ui/Chip.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { safeGet, safeSet } from '../../utils/safeStorage.js';

const SOUND_KEY = 'dm_lesson_sound';

/**
 * Pure. The combo counts consecutive FIRST-TRY corrects across practice AND
 * dictation items in one lesson run — any miss resets it to zero, any correct
 * (including a forgiven typo, which is still "got it right") extends it by
 * one. Extracted so the rule is one tested function, not logic re-derived at
 * the one call site that updates it (LessonPlayerPage.jsx).
 */
export function nextCombo(combo, correct) {
  return correct ? combo + 1 : 0;
}

// A tiny two-tone tick, entirely optional (default OFF) — not a chime, not a
// jingle. Built lazily so no AudioContext exists before the first user
// gesture unlocks it (browsers refuse to start one before that).
let ctx = null;
function tick() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch { /* best-effort only — a missing AudioContext never blocks the lesson */ }
}

/**
 * "{n} in a row", shown once the streak reaches 3 (Wave 2, 2026-09-19) — next
 * to the progress bar, never as a new score. No XP, no confetti: the count
 * itself is the reward (design-tokens.js rule 2 — accents are energy, never a
 * new mechanic bolted on top of one). Sound is OFF by default, behind a tiny
 * mute toggle stored in `dm_lesson_sound`.
 */
export default function ComboChip({ combo, className = '' }) {
  const [lang] = useLessonLang();
  const [muted, setMuted] = useState(() => safeGet(SOUND_KEY) !== 'on');
  const prev = useRef(combo);

  useEffect(() => {
    if (combo > prev.current && combo >= 3 && !muted) tick();
    prev.current = combo;
  }, [combo, muted]);

  if (combo < 3) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Chip tone="limette">{t('combo.streak', lang, { n: combo })}</Chip>
      <button
        type="button"
        onClick={() => {
          const unmute = muted;
          setMuted(!unmute);
          safeSet(SOUND_KEY, unmute ? 'on' : 'off');
          if (unmute) tick();
        }}
        aria-label={t(muted ? 'combo.soundOn' : 'combo.soundOff', lang)}
        className="text-graphite hover:text-siegel-deep"
      >
        {muted ? <VolumeX className="h-3.5 w-3.5" aria-hidden="true" /> : <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
    </span>
  );
}
