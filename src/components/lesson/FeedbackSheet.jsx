import { Check, AlertTriangle, X, Sparkles } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { OtherLanguage, inline } from './NoticeStage.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { RESULT } from '../../lib/lesson/check.js';

// Full literal class strings per tone — never built by template concatenation
// (design-tokens.js: Tailwind's JIT scanner reads raw source text, so a class
// name assembled at runtime never reaches the built CSS).
const TONE = {
  [RESULT.CORRECT]: {
    Icon: Check,
    key: 'feedback.correct',
    className: 'border-siegel bg-siegel-wash text-siegel-deep sm:shadow-raise-siegel',
  },
  [RESULT.TYPO]: {
    Icon: AlertTriangle,
    key: 'feedback.typo',
    className: 'border-accent-aprikose bg-accent-aprikose-wash text-accent-aprikose-ink sm:shadow-raise-aprikose',
  },
  [RESULT.WRONG]: {
    Icon: X,
    key: 'feedback.wrong',
    className: 'border-accent-himbeer bg-accent-himbeer-wash text-accent-himbeer-ink sm:shadow-raise-himbeer',
  },
};

/**
 * The post-"Check" feedback, as a bottom sheet (Wave 2, 2026-09-19).
 *
 * Correctness stays TEXT + ICON + COLOUR, never colour alone, and the three
 * tones are the existing `Chip`/`Card` accents (limette-adjacent siegel for
 * correct, aprikose for typo, himbeer for wrong) — never the four kasus
 * colours (those mean a grammatical case, design-tokens.js rule 1) and never
 * the retired amber/rose CTA gradient.
 *
 * Fixed to the viewport bottom on mobile (thumb reach, one glance without
 * scrolling past the item), an ordinary card in flow at >=sm, where pinning a
 * sheet over the screen just hides more of it for no reason. It carries the
 * ONE primary action for this screen — "Continue" — and nothing to dismiss
 * it: standard §4 is one action per screen, so there is deliberately no close
 * control, and Escape/outside-tap do nothing (there is nothing to cancel back
 * to; the only way off this screen is Continue).
 *
 * Motion: slides up on mount (`.animate-feedback-sheet`, src/index.css) and
 * sits still under prefers-reduced-motion, both via the site-wide
 * `@media (prefers-reduced-motion: reduce)` gate and the `motion-reduce:`
 * class here as a second line of defence (src/lib/motion.js's own pattern).
 */
export default function FeedbackSheet({ result, expected, hint, explanation, otherExplanation, onExplain, onContinue, primaryLabel }) {
  const [lang] = useLessonLang();
  if (!result) return null;
  const { Icon, key, className } = TONE[result] || TONE[RESULT.WRONG];
  return (
    <div
      className={
        `fixed inset-x-0 bottom-0 z-40 animate-feedback-sheet motion-reduce:animate-none border-t p-4 ` +
        `pb-[calc(1rem+env(safe-area-inset-bottom))] sm:static sm:z-auto sm:mt-4 sm:rounded-clay sm:border ` +
        `${className}`
      }
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-2xl">
        <p className="flex items-center gap-2 font-bold">
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {t(key, lang)}
        </p>
        {result !== RESULT.CORRECT && expected && (
          <p className="mt-2 text-[0.9375rem]">
            {t('feedback.correctIs', lang)} <strong className="font-bold" lang="de">{expected}</strong>
          </p>
        )}
        {hint && <p className="mt-2 text-[0.9375rem] font-bold">{hint}</p>}
        {explanation && <p className="mt-2 text-[0.875rem] leading-relaxed opacity-90">{inline(explanation)}</p>}
        {otherExplanation && <OtherLanguage text={otherExplanation} lang={lang} className="mt-2" />}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {onExplain && (
            <button
              type="button"
              onClick={onExplain}
              className="inline-flex items-center gap-1.5 rounded-pill border border-current bg-white/60 px-3 py-1.5 text-[0.8125rem] font-bold"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" /> {t('feedback.explain', lang)}
            </button>
          )}
          <Button onClick={onContinue} size="lg" className="w-full sm:ml-auto sm:w-auto">
            {primaryLabel || t('action.next', lang)}
          </Button>
        </div>
      </div>
    </div>
  );
}
