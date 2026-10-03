import { useEffect, useRef } from 'react';
import { Check, X, AlertTriangle, Eye } from 'lucide-react';
import GameButton from './GameButton.jsx';
import { XpIcon } from './GameParts.jsx';
import { RESULT } from './grade.js';
import { useV2Strings } from './strings.js';

// Full literal class strings per tone (Tailwind JIT). Right is always the game green and
// wrong always the game crimson (design-tokens.js courseGame) — never a kasus colour; the
// typo keeps the aprikose accent and a reveal is neutral. Correctness is TEXT + ICON +
// COLOUR, never colour alone.
const TONE = {
  right: {
    Icon: Check,
    sheet: 'border-game-right bg-game-right-wash text-game-right-ink',
    icon: 'text-game-right',
    button: 'right',
  },
  typo: {
    Icon: AlertTriangle,
    sheet: 'border-accent-aprikose bg-accent-aprikose-wash text-accent-aprikose-ink',
    icon: 'text-accent-aprikose-edge',
    button: 'primary',
  },
  wrong: {
    Icon: X,
    sheet: 'border-game-wrong bg-game-wrong-wash text-game-wrong-ink',
    icon: 'text-game-wrong',
    button: 'wrong',
  },
  revealed: {
    Icon: Eye,
    sheet: 'border-game-line bg-white text-game-text',
    icon: 'text-game-muted',
    button: 'primary',
  },
};

const PRAISE = ['fb.praise1', 'fb.praise2', 'fb.praise3', 'fb.praise4'];

/** The praise word for a right answer: varied, but the same item always gets the same word. */
export function praiseKey(seed) {
  let h = 0;
  for (const ch of String(seed || '')) h = (Math.imul(h, 31) + ch.charCodeAt(0)) | 0;
  return PRAISE[Math.abs(h) % PRAISE.length];
}

/** Which tone a resolved item shows. */
export function toneOf(result, revealed) {
  if (revealed) return 'revealed';
  if (result === RESULT.CORRECT) return 'right';
  if (result === RESULT.TYPO) return 'typo';
  return 'wrong';
}

/**
 * The feedback after „Prüfen", as a bottom sheet (the Duolingo pattern): fixed to the viewport
 * bottom on a phone, a card in flow from `sm` up. It carries the screen's ONE action — „Weiter"
 * after a right answer, „Verstanden" after a miss — and nothing to dismiss it.
 *
 *   right     „Super!" (Klasse!/Richtig!/Genau!, seeded by the item) and the XP pill
 *   typo      right with a small slip: the right form, the XP after a retry
 *   wrong     „Fast!", „Richtig ist: …", the item's explanation, and — when the run asks it
 *             again — „Diese Aufgabe kommt gleich noch einmal."
 *   revealed  the solution the learner asked to see (neutral, never the wrong red)
 *
 * The button takes focus when the sheet opens, so Enter moves on; the sheet is a polite live
 * region, so a screen reader hears the verdict. Slides up on mount, still under
 * prefers-reduced-motion.
 */
export default function FeedbackSheetV2({ result, revealed = false, expected = null, explanation = null, otherExplanation = null, xp = 0, seed = '', repeat = null, onContinue }) {
  const [, t] = useV2Strings();
  const button = useRef(null);
  // focusing also scrolls the in-flow card (sm and up) into view; the phone sheet is fixed
  useEffect(() => {
    if (button.current) button.current.focus();
  }, []);
  if (!result && !revealed) return null;
  const toneKey = toneOf(result, revealed);
  const tone = TONE[toneKey];
  const { Icon } = tone;
  const title = toneKey === 'right' ? t(praiseKey(seed)) : toneKey === 'typo' ? t('fb.typo') : toneKey === 'wrong' ? t('fb.almost') : t('fb.revealed');
  const missed = toneKey === 'wrong' || toneKey === 'revealed';
  return (
    <div
      className={
        'fixed inset-x-0 bottom-0 z-50 border-t-2 px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] ' +
        'animate-feedback-sheet motion-reduce:animate-none ' +
        `sm:static sm:z-auto sm:mt-8 sm:rounded-[1.25rem] sm:border-2 sm:border-b-4 sm:p-5 ${tone.sheet}`
      }
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
            <Icon className={`h-6 w-6 ${tone.icon}`} strokeWidth={3.2} aria-hidden="true" />
          </span>
          <p className="text-[1.5rem] font-extrabold leading-tight">{title}</p>
          {xp > 0 && (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-[0.9375rem] font-extrabold text-game-xp-ink motion-safe:animate-pop-in">
              <XpIcon size={16} /> {t('game.xp', { n: xp })}
            </span>
          )}
        </div>
        {toneKey !== 'right' && expected && (
          <p className="text-[1.0625rem] font-extrabold">
            {t('fb.rightIs')} <span lang="de">{expected}</span>
          </p>
        )}
        {explanation && <p className="text-[1rem] font-semibold leading-relaxed">{explanation}</p>}
        {/* full ink, no opacity: faded, the wrong ink on its wash fell to 4.32:1 (audit A11Y-04); the smaller size subordinates it */}
        {otherExplanation && <p className="text-[0.875rem] leading-relaxed">{otherExplanation}</p>}
        {missed && repeat && (
          <p className="text-[0.9375rem] font-extrabold">{t(repeat === 'similar' ? 'fb.repeatSimilar' : 'fb.repeatSame')}</p>
        )}
        <GameButton ref={button} variant={tone.button} onClick={onContinue} className="mt-1.5">
          {missed ? t('fb.gotIt') : t('item.next')}
        </GameButton>
      </div>
    </div>
  );
}
