/** Open House surface: rounded windows, warm grounds and deliberate elevation. */

const TONES = {
  paper: 'bg-white',
  sunk: 'bg-paper-sunk',
  wash: 'bg-siegel-wash',
  lilac: 'bg-lilac-wash',
  peach: 'bg-orange-wash',
  himbeer: 'bg-accent-himbeer-wash',
  aprikose: 'bg-accent-aprikose-wash',
  limette: 'bg-accent-limette-wash',
};

export default function Card({
  as: Tag = 'div',
  tone = 'paper',
  edge: _edge,
  interactive = false,
  elevation = 'surface',
  raised: _raised,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'rounded-window border border-rule',
    elevation === 'flat' ? '' : elevation === 'floating' ? 'shadow-raise-lg' : 'shadow-raise',
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
