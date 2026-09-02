/**
 * The one chip/badge in the app.
 *
 * Three families, one shape:
 *   - `label`  — the data-face uppercase label (level codes, section eyebrows)
 *   - `accent` — energy: streak, new, due counts (tokens rule 2: never a CTA)
 *   - `kasus`  — a grammatical case, and ONLY where that case is named
 *                (tokens rule 1). The abbr is rendered for you.
 * `raised` puts it on an edge (for chips you can press — grade buttons,
 * answer options); pass onClick and it becomes a <button>.
 */

const TONES = {
  label: 'bg-siegel-wash text-siegel-deep',
  ink: 'bg-ink text-paper',
  quiet: 'border border-rule bg-white text-graphite',
  himbeer: 'bg-accent-himbeer-wash text-accent-himbeer-ink',
  aprikose: 'bg-accent-aprikose-wash text-accent-aprikose-ink',
  limette: 'bg-accent-limette-wash text-accent-limette-ink',
  nominativ: 'border border-kasus-nominativ bg-kasus-nominativ-wash text-kasus-nominativ-ink',
  akkusativ: 'border border-kasus-akkusativ bg-kasus-akkusativ-wash text-kasus-akkusativ-ink',
  dativ: 'border border-kasus-dativ bg-kasus-dativ-wash text-kasus-dativ-ink',
  genitiv: 'border border-kasus-genitiv bg-kasus-genitiv-wash text-kasus-genitiv-ink',
};

const KASUS_ABBR = { nominativ: 'NOM', akkusativ: 'AKK', dativ: 'DAT', genitiv: 'GEN' };

const RAISED_EDGE = {
  himbeer: 'shadow-raise-himbeer',
  aprikose: 'shadow-raise-aprikose',
  limette: 'shadow-raise-limette',
};

export default function Chip({
  tone = 'label',
  size = 'sm',
  raised = false,
  onClick,
  className = '',
  children,
  ...rest
}) {
  const isKasus = tone in KASUS_ABBR;
  const classes = [
    'inline-flex items-center gap-1.5 rounded-pill font-bold select-none',
    size === 'sm' ? 'px-2.5 py-1 font-data text-[0.6875rem] uppercase tracking-[0.13em]' : 'px-3.5 py-1.5 text-sm',
    TONES[tone] ?? TONES.label,
    raised
      ? `${RAISED_EDGE[tone] ?? 'shadow-raise'} transition-all duration-100 ease-snap active:translate-y-1 active:shadow-none`
      : '',
    onClick ? 'cursor-pointer' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      {children}
      {isKasus && <span className="font-data text-[0.625rem] tracking-[0.13em] opacity-70">{KASUS_ABBR[tone]}</span>}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} {...rest}>
        {body}
      </button>
    );
  }
  return (
    <span className={classes} {...rest}>
      {body}
    </span>
  );
}
