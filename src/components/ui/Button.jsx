import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * The one button in the app.
 *
 * WHY THIS EXISTS. Before it, the primary CTA was the string
 * `bg-gradient-to-r from-amber-500 to-rose-500 …` copy-pasted into twenty-odd
 * files — the retired brand, unreachable by any single edit. The classes below
 * are the same treatment the rebuilt public pages already use
 * (astro-site/src/pages/pricing.astro), so the app and the marketing site now
 * render one button rather than two.
 *
 * Rules it enforces (src/data/design-tokens.js):
 *   - `siegel` is the only interactive colour. There is no amber variant and
 *     no gold variant; gold belongs to the seal.
 *   - Flat fills. No gradients — a gradient CTA is what this replaced.
 *   - No resting shadow. Lift on hover only.
 *
 * Renders whichever element the props imply:
 *   <Button to="/signup">      → react-router <Link>
 *   <Button href="https://…">  → <a>
 *   <Button onClick={…}>       → <button type="button">
 */

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const VARIANTS = {
  primary: 'bg-siegel text-white hover:bg-siegel-lift active:bg-siegel-deep',
  secondary: 'border border-ink text-ink hover:bg-ink hover:text-paper',
  ghost: 'text-graphite hover:bg-siegel-wash hover:text-siegel-deep',
};

const SIZES = {
  sm: 'px-3.5 py-1.5 text-[0.8125rem]',
  md: '', // BASE already carries the default
  lg: 'px-6 py-3 text-base',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', to, href, type = 'button', className = '', children, ...rest },
  ref,
) {
  const classes = [BASE, VARIANTS[variant] ?? VARIANTS.primary, SIZES[size] ?? '', className]
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
