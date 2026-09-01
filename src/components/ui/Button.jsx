import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * The one button in the app.
 *
 * WHY THIS EXISTS. Before it, the primary CTA was a left-to-right amber-to-rose
 * gradient copy-pasted into twenty-odd files — the retired brand, unreachable
 * by any single edit. (The class name is spelled out nowhere in this file on
 * purpose: Tailwind's scanner does not parse comments, so quoting it here was
 * enough to keep emitting the rule into the built CSS.) v2 ("Playful Depth", design-tokens.js rule 3)
 * makes it PHYSICAL: the face rests on a hard 4px edge (`shadow-raise-*`) and
 * pressing translates it down onto that edge, like a key on a keyboard. The
 * press is a direct response to the pointer, not an animation, so it is not
 * gated behind prefers-reduced-motion.
 *
 * Rules it enforces (src/data/design-tokens.js):
 *   - `siegel` is the only interactive colour (rule 2). The one exception rule
 *     2 itself grants: `celebrate`, for the single moment a completed goal has
 *     earned — never for an ordinary CTA.
 *   - Depth means "you can press this" (rule 3): every solid variant rests
 *     raised and depresses on :active. `ghost` stays flat because it reads as
 *     a link, and links do not extrude.
 *
 * Renders whichever element the props imply:
 *   <Button to="/signup">      → react-router <Link>
 *   <Button href="https://…">  → <a>
 *   <Button onClick={…}>       → <button type="button">
 */

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-clay px-5 py-2.5 text-sm font-bold ' +
  'transition-all duration-100 ease-snap select-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0';

const PRESS = 'active:translate-y-1 active:shadow-none';

const VARIANTS = {
  primary: `bg-siegel text-white shadow-raise-siegel hover:bg-siegel-lift ${PRESS}`,
  secondary: `border border-rule bg-white text-ink shadow-raise hover:border-siegel hover:text-siegel-deep ${PRESS}`,
  ghost: 'text-graphite hover:bg-siegel-wash hover:text-siegel-deep',
  celebrate: `bg-accent-himbeer text-white shadow-raise-himbeer hover:brightness-105 ${PRESS}`,
};

const SIZES = {
  sm: 'px-3.5 py-1.5 text-[0.8125rem]',
  md: '', // BASE already carries the default
  lg: 'px-7 py-3.5 text-base',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', shimmer = false, to, href, type = 'button', className = '', children, ...rest },
  ref,
) {
  // `shimmer`: the periodic highlight sweep (index.css .btn-shimmer) — for
  // the ONE primary action on a screen, never on every button.
  const classes = [
    BASE,
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? '',
    shimmer ? 'btn-shimmer relative overflow-hidden' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

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
