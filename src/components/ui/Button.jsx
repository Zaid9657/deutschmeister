import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/** Shared action control. Flat surfaces, explicit borders, and transform-only press feedback. */

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-clay min-h-11 px-5 py-2.5 text-sm font-bold ' +
  'transition-transform duration-feedback ease-out-strong select-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0';

const PRESS = 'active:translate-y-px';

const VARIANTS = {
  coral: `border border-transparent bg-coral-accessible text-white hover:brightness-105 ${PRESS}`,
  primary: `border border-transparent bg-siegel text-white hover:bg-siegel-lift ${PRESS}`,
  secondary: `border border-rule bg-white text-ink hover:border-siegel hover:text-siegel-deep ${PRESS}`,
  ghost: 'text-graphite hover:bg-siegel-wash hover:text-siegel-deep',
  celebrate: `bg-siegel text-white hover:brightness-105 ${PRESS}`,
  // "Die Linie" keys (design-tokens.js, the section at the end). Since the v4
  // türkis palette `linie` and `primary` are the same colour family (one action
  // colour again); `ink` stays for the rare dark key.
  ink: `bg-ink text-white hover:bg-graphite ${PRESS}`,
  linie: `bg-linie text-linie-ink hover:bg-linie-deep ${PRESS}`,
  // The secondary key on a nacht ground (Layout.astro `dm-key-ghost-nacht`):
  // an outline, flat like `ghost`, whose rule lights up in the line's yellow.
  ghostNacht: 'border-[1.5px] border-nacht-rule bg-transparent text-nacht-text hover:border-linie',
};

// `shape="pill"`: the chrome's keys (the Astro bar's `dm-key` is a pill).
// Swapped IN the base string rather than appended as a class: rounded-pill and
// rounded-clay are both single-property utilities, and which one wins is decided
// by their order in the emitted CSS, never by their order in className. Today
// pill happens to be emitted after clay, so an appended class worked by luck of
// ordering; the same trap is why `size="sm"` loses its padding to BASE's px-5
// py-2.5 (checked against dist/ on 2026-10-04).
const SHAPES = { circle: 'rounded-full', clay: 'rounded-xl', pill: 'rounded-pill' };

const SIZES = {
  sm: 'px-3.5 py-1.5 text-[0.8125rem]',
  md: '', // BASE already carries the default
  lg: 'px-7 py-3.5 text-base',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', shape = 'clay', shimmer = false, to, href, type = 'button', className = '', children, ...rest },
  ref,
) {
  // `shimmer`: the periodic highlight sweep (index.css .btn-shimmer) — for
  // the ONE primary action on a screen, never on every button.
  const classes = [
    BASE.replace('rounded-clay', SHAPES[shape] ?? SHAPES.clay),
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? '',
    shimmer ? 'btn-shimmer relative overflow-hidden' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // A link cannot be disabled: `disabled` on an <a> is ignored, so the "disabled" Continue on the
  // course home stayed clickable and looked enabled (the disabled: styles never matched). While a
  // `to` is disabled it renders as a disabled <button> — same look, really inert.
  if (to && rest.disabled) {
    return (
      <button ref={ref} type="button" className={classes} {...rest}>
        {children}
      </button>
    );
  }

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button ref={ref} type={type} className={classes} {...rest}>
      {children}
    </button>
  );
});

export default Button;
