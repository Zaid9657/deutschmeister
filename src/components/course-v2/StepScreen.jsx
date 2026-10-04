import { StickyAction } from './GameParts.jsx';

/**
 * One screen inside a Lernschritt (owner feedback 2026-09-30: "make it in duolingo style and for
 * everything to be step for step"): ONE short, friendly instruction as its heading („Neues Wort",
 * „Hören Sie zu", „Grammatik-Tipp"), an optional small counter („3 / 8") beside it, the one thing
 * the screen shows, and its one action in the bottom bar (StickyAction) — the same place as the
 * „Prüfen" of an item screen, so the button never jumps around. The page leaves room under the
 * content for the bar on a phone.
 *
 *   title     the instruction (an h2: the step's sr-only h1 names the section above it)
 *   counter   { n, total, label } — shown as „n / total", read as `label` („Wort 3 von 8")
 *   aside     small icon buttons at the heading's right (translation, listen to all)
 *   action    the bottom bar's content: one GameButton (a QuietButton may sit under it)
 */
export default function StepScreen({ title, counter = null, aside = null, action = null, children, className = '' }) {
  return (
    <div className={`${action ? 'pb-32 sm:pb-0' : ''} ${className}`}>
      {(title || counter || aside) && (
        <div className="flex items-start justify-between gap-3">
          {title && <h2 className="min-w-0 text-[1.5rem] font-extrabold leading-tight text-game-text [hyphens:auto] sm:text-[1.625rem]">{title}</h2>}
          {(counter || aside) && (
            <div className="flex shrink-0 items-center gap-2">
              {aside}
              {counter && (
                <p className="mt-1.5 rounded-full bg-course-wash px-2.5 py-0.5 text-[0.875rem] font-extrabold tabular-nums text-course-ink">
                  <span aria-hidden="true">{counter.n} / {counter.total}</span>
                  <span className="sr-only">{counter.label}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
      <div className={title || counter || aside ? 'mt-5' : ''}>{children}</div>
      {action && <StickyAction>{action}</StickyAction>}
    </div>
  );
}

/** A small square icon key beside a screen's heading (translation on/off, listen to all): ≥ 44 px, quiet. */
export function IconKey({ label, pressed, onClick, disabled = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={typeof pressed === 'boolean' ? pressed : undefined}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 ${
        pressed ? 'border-course bg-course-wash text-course-ink' : 'border-game-line bg-white text-game-muted'
      } hover:bg-course-wash hover:text-course-ink disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
