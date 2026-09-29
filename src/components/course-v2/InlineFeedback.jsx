import { Check, X, AlertTriangle, Eye } from 'lucide-react';
import { RESULT } from './grade.js';
import { useV2Strings, ltext } from './strings.js';

// Full literal class strings per tone (Tailwind JIT). Text + icon + colour, never colour
// alone: right is the game green, wrong the game crimson (design-tokens.js courseGame), the
// typo and the one-retry notice the aprikose accent, a reveal neutral — never a kasus colour.
const TONE = {
  [RESULT.CORRECT]: { Icon: Check, key: 'fb.correct', cls: 'border-game-right bg-game-right-wash text-game-right-ink' },
  [RESULT.TYPO]: { Icon: AlertTriangle, key: 'fb.typo', cls: 'border-accent-aprikose bg-accent-aprikose-wash text-accent-aprikose-ink' },
  [RESULT.WRONG]: { Icon: X, key: 'fb.wrong', cls: 'border-game-wrong bg-game-wrong-wash text-game-wrong-ink' },
  revealed: { Icon: Eye, key: 'fb.revealed', cls: 'border-game-line bg-white text-game-text' },
  retry: { Icon: AlertTriangle, key: null, cls: 'border-accent-aprikose bg-accent-aprikose-wash text-accent-aprikose-ink' },
};

/**
 * The in-flow feedback panel: used where one screen holds several items (an exam block
 * in Lernmodus, the Lektions-Check list) and for the one-retry notice of a typo. The
 * one-item-per-screen flow uses the bottom sheet (FeedbackSheetV2) instead.
 */
export default function InlineFeedback({ result, revealed = false, retry = false, message = null, expected = null, explanation = null, className = '' }) {
  const [lang, t] = useV2Strings();
  const tone = retry ? TONE.retry : revealed ? TONE.revealed : (TONE[result] || TONE[RESULT.WRONG]);
  const { Icon } = tone;
  const ex = ltext(explanation, lang);
  return (
    <div className={`mt-3 rounded-2xl border-2 p-3.5 ${tone.cls} ${className}`} role="status" aria-live="polite">
      <p className="flex items-start gap-2 text-[1rem] font-extrabold">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={3} aria-hidden="true" />
        <span>{message || (tone.key ? t(tone.key) : '')}</span>
      </p>
      {!retry && result !== RESULT.CORRECT && expected && (
        <p className="mt-1.5 text-[0.9375rem] font-bold">
          {t('fb.rightIs')} <strong className="font-extrabold" lang="de">{expected}</strong>
        </p>
      )}
      {!retry && ex.main && <p className="mt-1.5 text-[0.9375rem] font-semibold leading-relaxed">{ex.main}</p>}
      {!retry && ex.other && <p className="mt-1 text-[0.8125rem] leading-relaxed opacity-80">{ex.other}</p>}
    </div>
  );
}
