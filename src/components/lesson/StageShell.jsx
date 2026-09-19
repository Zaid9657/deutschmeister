import { ArrowLeft } from 'lucide-react';
import Button from '../ui/Button.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

// Wave 2 (2026-09-19): a background wash per stage kind, so ten screens in a
// row don't read as one undifferentiated white card. Token classes only —
// `wash` for input-like stages (dialogue, notice), `paper` (default) for a
// plain white card, `sunk` for the recessed panel a recap/summary reads well
// on. Never a new colour: these are the same tones Card.jsx already carries.
const VARIANTS = {
  input: 'bg-siegel-wash',
  practice: '',
  speaking: 'bg-siegel-wash',
  writing: '',
  recap: 'bg-paper-sunk',
};

/**
 * One stage = one screen (standard §4). The shell owns the three constants of
 * that screen: the eyebrow that says where you are, the content, and ONE
 * primary action pinned at the bottom. Back is always allowed — a locked-in
 * exercise is a reason to close the tab. Its two fixed labels (Back, and the
 * default primary) come from the lesson string table in the chrome language.
 *
 * `variant` changes only the background wash and eyebrow tone (design-tokens
 * rule 2: energy is a wash, never a new interactive colour) — callers that
 * pass nothing keep today's plain paper look.
 */
export default function StageShell({
  eyebrow,
  title,
  lead,
  onBack,
  primaryLabel = null,
  onPrimary,
  primaryDisabled = false,
  secondary = null,
  variant = null,
  children,
}) {
  const [lang] = useLessonLang();
  const wash = VARIANTS[variant] || '';
  return (
    <section className={`flex min-h-[60vh] flex-col ${wash ? `-mx-4 rounded-clay px-4 pt-4 sm:-mx-6 sm:px-6 ${wash}` : ''}`}>
      <header className="mb-5">
        {eyebrow && (
          <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">{eyebrow}</p>
        )}
        {title && (
          <h1 className="mt-2 font-display text-[1.375rem] font-semibold leading-tight tracking-[-0.018em] sm:text-[1.75rem]">
            {title}
          </h1>
        )}
        {lead && <p className="mt-2 text-[0.9375rem] leading-relaxed text-graphite">{lead}</p>}
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-8 flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 self-start text-sm font-bold text-graphite hover:text-siegel-deep"
          >
            <ArrowLeft className="h-4 w-4" /> {t('shell.back', lang)}
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3 sm:justify-end">
          {secondary}
          {onPrimary && (
            <Button onClick={onPrimary} size="lg" disabled={primaryDisabled} className="w-full sm:w-auto">
              {primaryLabel || t('action.next', lang)}
            </Button>
          )}
        </div>
      </footer>
    </section>
  );
}
