/**
 * The one card in the app.
 *
 * Rule 3 of src/data/design-tokens.js: structure comes from hairline rules and
 * alignment, not from resting shadows — German grammar's native artifact is the
 * declension table. So a card is paper, a `rule` border, and nothing else at
 * rest. `interactive` adds the hover lift; `tone="sunk"` is the recessed panel
 * used for quiet secondary content.
 */

const TONES = {
  paper: 'bg-white',
  sunk: 'bg-paper-sunk',
  wash: 'bg-siegel-wash',
};

export default function Card({
  as: Tag = 'div',
  tone = 'paper',
  interactive = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'rounded-lg border border-rule',
    TONES[tone] ?? TONES.paper,
    interactive ? 'transition-shadow hover:shadow-hover' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
