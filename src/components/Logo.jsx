/**
 * DeutschMeister brand mark — the Meister-Siegel seal + two-tone wordmark.
 * Extracted from the approved dashboard design so the dashboard top bar and
 * the site nav share one source of truth. The same seal is inlined in the
 * static site chrome (astro-site/src/layouts/Layout.astro) — keep them in sync.
 *
 * Props:
 *   size        — seal diameter in px (default 38); wordmark scales with it
 *   showWordmark — render the "DeutschMeister" wordmark beside the seal (default true)
 *   wordmarkTone — "default" on light surfaces or "inverse" on dark surfaces
 *   face        — "display" (Fraunces, the dashboard top bar) or "chrome": the site
 *                 bar and footer, set like the Astro chrome on every library page
 *                 (Layout.astro `sign-label` under data-sign="off" = the body face
 *                 at 650), so the wordmark does not change face between the two
 *                 front ends. The app never loads the sign face (art direction,
 *                 owner decision 4).
 *   wordmarkClassName — extra classes on the wordmark only (the site bar hides it
 *                 below `sm` while the free-course key needs the room)
 *   to          — wrap in a link to this path (default '/'); pass null for a bare mark.
 *                 Renders a full-page <a>, not a router Link: "/" and "/pricing" are
 *                 served by the static Astro pages, which client-side routing would
 *                 bypass (showing the divergent SPA versions instead).
 *   className   — extra classes on the wrapper
 */
import { color, font } from '../data/design-tokens.js';

export default function Logo({
  size = 38,
  showWordmark = true,
  wordmarkTone = 'default',
  face = 'display',
  wordmarkClassName = '',
  to = '/',
  className = '',
}) {
  const chrome = face === 'chrome';
  // display: ~18px at size 38. chrome: the Astro bar's 19px (nav) and 17px (footer).
  const wordSize = chrome ? (size >= 36 ? 19 : 17) : Math.round(size * 0.47);

  const mark = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        role="img"
        aria-label="DeutschMeister"
      >
        <path d="M5 5h38v29H27L15 43v-9H5V5Z" fill={color.siegel} />
        <path d="M13 26V14l7 8 7-8v12m0-12 8 12V14" stroke={color.paper} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showWordmark && (
        <span
          className={`${chrome ? 'font-body font-bold' : 'dm-display font-semibold'} ${wordmarkTone === 'inverse' ? 'text-white' : 'text-ink'} ${wordmarkClassName}`}
          style={{ fontFamily: font.body, fontSize: `${wordSize}px`, letterSpacing: chrome ? '0' : '-0.01em' }}
        >
          Deutsch<span className={wordmarkTone === 'inverse' ? 'text-siegel-wash' : 'text-siegel-deep'}>Meister</span>
        </span>
      )}
    </span>
  );

  if (to === null) return mark;
  return (
    <a href={to} className="inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-siegel focus-visible:ring-offset-2">
      {mark}
    </a>
  );
}
