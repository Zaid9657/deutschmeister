import { Check, X } from 'lucide-react';

/**
 * One selectable answer option — the tap target every choice item of the course
 * renders (multiple choice, a/b/c, richtig/falsch, ja/nein, Zuordnung, Hören-Auswahl).
 *
 * State is never colour alone (BLUEPRINT §7.1, §7.2): every non-idle state carries an
 * icon, and the result states also carry a visually hidden word for screen readers.
 * The tones are the shared ones — `siegel` for the interactive selection and the
 * correct result, `himbeer` for a wrong pick — never a kasus colour (those name a
 * grammatical case, src/data/design-tokens.js rule 1).
 *
 *   state: 'idle' | 'selected' | 'correct' | 'wrong' | 'solution' | 'muted'
 *
 * Full literal class strings per state (Tailwind's JIT reads the source text; a class
 * assembled at runtime never reaches the CSS). ≥ 44 px tall, full width on phones.
 */
const STATE = {
  idle: 'border-rule bg-white text-ink shadow-raise hover:border-siegel active:translate-y-1 active:shadow-none',
  selected: 'border-siegel bg-siegel text-white shadow-raise-siegel',
  correct: 'border-siegel bg-siegel-wash text-siegel-deep',
  wrong: 'border-accent-himbeer bg-accent-himbeer-wash text-accent-himbeer-ink',
  solution: 'border-siegel border-dashed bg-white text-siegel-deep',
  muted: 'border-rule bg-white text-graphite opacity-70',
};

const SR = { correct: 'richtig', wrong: 'falsch', solution: 'Lösung', selected: 'ausgewählt' };

export default function ChoiceTile({
  state = 'idle',
  disabled = false,
  onClick,
  lang,
  keyLabel = null,
  className = '',
  children,
  ...rest
}) {
  const icon = state === 'wrong'
    ? <X className="h-4 w-4 shrink-0" aria-hidden="true" />
    : (state === 'selected' || state === 'correct' || state === 'solution')
      ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
      : null;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={state === 'selected'}
      lang={lang}
      className={
        'flex min-h-11 w-full items-center justify-between gap-3 rounded-clay border px-4 py-2.5 text-left text-[0.9375rem] font-bold ' +
        'transition-all duration-100 ease-snap motion-reduce:transition-none disabled:cursor-default ' +
        `${STATE[state] || STATE.idle} ${className}`
      }
      {...rest}
    >
      <span className="flex min-w-0 items-baseline gap-2">
        {keyLabel && <span className="font-data text-[0.75rem] uppercase opacity-80">{keyLabel}</span>}
        <span className="min-w-0">{children}</span>
      </span>
      {icon}
      {SR[state] && <span className="sr-only">{SR[state]}</span>}
    </button>
  );
}
