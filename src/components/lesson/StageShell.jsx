import { ArrowLeft } from 'lucide-react';
import Button from '../ui/Button.jsx';

/**
 * One stage = one screen (standard §4). The shell owns the three constants of
 * that screen: the eyebrow that says where you are, the content, and ONE
 * primary action pinned at the bottom. Back is always allowed — a locked-in
 * exercise is a reason to close the tab.
 */
export default function StageShell({
  eyebrow,
  title,
  lead,
  onBack,
  primaryLabel = 'Weiter',
  onPrimary,
  primaryDisabled = false,
  secondary = null,
  children,
}) {
  return (
    <section className="flex min-h-[60vh] flex-col">
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
            <ArrowLeft className="h-4 w-4" /> Zurück
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3 sm:justify-end">
          {secondary}
          {onPrimary && (
            <Button onClick={onPrimary} size="lg" disabled={primaryDisabled} className="w-full sm:w-auto">
              {primaryLabel}
            </Button>
          )}
        </div>
      </footer>
    </section>
  );
}
