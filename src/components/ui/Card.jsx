/** Shared surface. Legacy raised/edge props remain accepted; all resting cards use a hairline. */

const TONES = {
  paper: 'bg-white',
  sunk: 'bg-paper-sunk',
  wash: 'bg-siegel-wash',
  himbeer: 'bg-accent-himbeer-wash',
  aprikose: 'bg-accent-aprikose-wash',
  limette: 'bg-accent-limette-wash',
};

export default function Card({
  as: Tag = 'div',
  tone = 'paper',
  edge: _edge,
  interactive = false,
  raised: _raised,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'rounded-xl border border-rule',
    TONES[tone] ?? TONES.paper,
    interactive ? 'transition-transform duration-feedback ease-out-strong hover:border-siegel active:translate-y-px' : '',
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
