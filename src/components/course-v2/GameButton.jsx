import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * The course player's one chunky button (design-tokens.js "THE COURSE THEME": the
 * palette's `primary` is the interactive colour on the course surfaces). The face rests
 * on a hard 5 px edge (`shadow-course`, `shadow-game-right` …) and pressing drops it onto
 * that edge — a direct response to the pointer, not an animation.
 *
 *   variant  primary | right | wrong | secondary
 *   size     lg (full width, the screen's one primary action) | md (auto width)
 *   caps     false for a long label that names something („Weiter bei Schritt 3: …")
 *
 * Disabled is its own look (grey face, grey edge), never just a faded primary — the
 * learner reads „not yet" before reading the label. Full literal class strings only
 * (Tailwind JIT). Labels are 19 px bold so white on every palette primary is large text.
 * Renders a react-router <Link> with `to`, else a <button type="button">.
 */
const BASE =
  'inline-flex select-none items-center justify-center gap-2 rounded-2xl text-center font-body font-extrabold ' +
  'transition-[transform,box-shadow,background-color,filter] duration-100 ease-snap motion-reduce:transition-none';
const CAPS = 'uppercase tracking-[0.06em]';

const SIZES = {
  lg: 'min-h-[3.25rem] w-full px-5 py-3 text-[1.1875rem]',
  md: 'min-h-12 px-5 py-2.5 text-[1rem]',
};

const PRESS = 'active:translate-y-[5px] active:shadow-none';

const VARIANTS = {
  primary: `bg-course text-white shadow-course hover:brightness-105 ${PRESS}`,
  right: `bg-game-right text-white shadow-game-right hover:brightness-105 ${PRESS}`,
  wrong: `bg-game-wrong text-white shadow-game-wrong hover:brightness-105 ${PRESS}`,
  secondary: `border-2 border-game-line bg-white text-course-ink shadow-game-line hover:bg-course-wash ${PRESS}`,
};

const DISABLED = 'cursor-not-allowed bg-game-locked text-game-locked-icon shadow-game-locked';

const GameButton = forwardRef(function GameButton(
  { variant = 'primary', size = 'lg', caps = true, to, type = 'button', disabled = false, className = '', children, ...rest },
  ref,
) {
  const classes = [BASE, caps ? CAPS : '', SIZES[size] || SIZES.lg, disabled ? DISABLED : VARIANTS[variant] || VARIANTS.primary, className]
    .filter(Boolean)
    .join(' ');
  if (to && !disabled) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type} disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  );
});

export default GameButton;

/** A quiet text action under the primary (a skip, a „Lösung zeigen"): ≥ 44 px, never a second primary. */
export function QuietButton({ className = '', children, ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2 font-body text-[0.9375rem] font-extrabold text-game-muted hover:bg-course-wash hover:text-course-ink ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
