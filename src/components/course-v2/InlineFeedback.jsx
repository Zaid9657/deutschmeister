import { Check, X, AlertTriangle, Eye } from 'lucide-react';
import { RESULT } from './grade.js';
import { useV2Strings, ltext } from './strings.js';

// Full literal class strings per tone (Tailwind JIT). Text + icon + colour, never colour
// alone; the same three tones as the legacy FeedbackSheet, never a kasus colour.
const TONE = {
  [RESULT.CORRECT]: { Icon: Check, key: 'fb.correct', cls: 'border-siegel bg-siegel-wash text-siegel-deep' },
  [RESULT.TYPO]: { Icon: AlertTriangle, key: 'fb.typo', cls: 'border-accent-aprikose bg-accent-aprikose-wash text-accent-aprikose-ink' },
  [RESULT.WRONG]: { Icon: X, key: 'fb.wrong', cls: 'border-accent-himbeer bg-accent-himbeer-wash text-accent-himbeer-ink' },
  revealed: { Icon: Eye, key: 'fb.revealed', cls: 'border-rule bg-paper-sunk text-ink' },
  retry: { Icon: AlertTriangle, key: null, cls: 'border-accent-aprikose bg-accent-aprikose-wash text-accent-aprikose-ink' },
};

/**
 * The in-flow feedback panel: used where one screen holds several items (an exam block
 * in Lernmodus, the Lektions-Check list) and for the one-retry notice of a typo. The
 * one-item-per-screen flow uses the legacy bottom sheet (FeedbackSheet) instead.
 */
export default function InlineFeedback({ result, revealed = false, retry = false, message = null, expected = null, explanation = null, className = '' }) {
  const [lang, t] = useV2Strings();
  const tone = retry ? TONE.retry : revealed ? TONE.revealed : (TONE[result] || TONE[RESULT.WRONG]);
  const { Icon } = tone;
  const ex = ltext(explanation, lang);
  return (
    <div className={`mt-3 rounded-clay border p-3 ${tone.cls} ${className}`} role="status" aria-live="polite">
      <p className="flex items-start gap-2 text-[0.9375rem] font-bold">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{message || (tone.key ? t(tone.key) : '')}</span>
      </p>
      {!retry && result !== RESULT.CORRECT && expected && (
        <p className="mt-1.5 text-[0.9375rem]">
          {t('fb.solution')} <strong className="font-bold" lang="de">{expected}</strong>
        </p>
      )}
      {!retry && ex.main && <p className="mt-1.5 text-[0.875rem] leading-relaxed opacity-90">{ex.main}</p>}
      {!retry && ex.other && <p className="mt-1 text-[0.8125rem] leading-relaxed opacity-75">{ex.other}</p>}
    </div>
  );
}
