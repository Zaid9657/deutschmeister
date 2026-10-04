import { Link } from 'react-router-dom';

// The course theme's chunky action (design-tokens.js "THE COURSE THEME"): the live
// palette's primary with a hard bottom edge, heavy uppercase label at ≥ 19 px (white
// on every course primary is ≥ 3:1, i.e. large-text AA). Pressing drops the face by
// the edge's height. The app-wide Button (src/components/ui/Button.jsx) stays the
// button everywhere else; on the course surfaces the theme's primary is the one
// interactive colour, and this is its button.
//
//   tone 'course' — bg-course on the page ground (the default)
//   tone 'white'  — white on a coloured card; its label takes the card's `--hue-edge`
//                   when one is set, else the palette's ink

const BASE =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-clay px-6 py-3 text-center ' +
  'text-[1.1875rem] font-black uppercase leading-tight tracking-wide transition-transform duration-100 ' +
  'active:translate-y-[5px] active:shadow-none';

const TONES = {
  course: 'bg-course text-white shadow-course hover:brightness-105',
  white: 'bg-white text-[color:var(--hue-edge,var(--c-ink))] shadow-[0_4px_0_rgba(0,0,0,0.2)] hover:bg-course-wash',
};

export default function GameButton({ to, onClick, tone = 'course', className = '', children, ...rest }) {
  const classes = `${BASE} ${TONES[tone] || TONES.course} ${className}`;
  if (to) {
    return <Link to={to} className={classes} {...rest}>{children}</Link>;
  }
  return <button type="button" onClick={onClick} className={classes} {...rest}>{children}</button>;
}
