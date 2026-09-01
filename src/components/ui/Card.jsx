/**
 * The one card in the app.
 *
 * Rule 3 of src/data/design-tokens.js (v2): depth is an affordance.
 *   - `interactive` — a clickable clay card: rests raised on its edge
 *     (`shadow-raise`), floats up a little on hover, and physically depresses
 *     on press, same grammar as the Button.
 *   - `raised` — featured but not clickable: rests raised, does not respond.
 *     Use sparingly; a raised card that ignores the pointer is almost a lie.
 *   - default — reference material: paper, a `rule` hairline, FLAT. The
 *     declension table's native form. Tables and prose stay here.
 * `tone="sunk"` is the recessed panel for quiet secondary content.
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
  raised = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'rounded-clay border border-rule',
    TONES[tone] ?? TONES.paper,
    interactive
      ? 'shadow-raise transition-all duration-150 ease-snap hover:-translate-y-0.5 hover:shadow-raise-lg active:translate-y-1 active:shadow-none'
      : raised
        ? 'shadow-raise'
        : '',
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
