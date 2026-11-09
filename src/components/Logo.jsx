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

export default function Logo({
  size = 38,
  showWordmark = true,
  wordmarkTone = 'default',
  face = 'display',
  wordmarkClassName = '',
  to = '/',
  className = '',
}) {
  const mark = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="c4-brand-mark" aria-hidden={showWordmark ? true : undefined} role={!showWordmark ? 'img' : undefined} aria-label={!showWordmark ? 'DeutschMeister' : undefined} style={{ width: size, height: size }}>DM</span>
      {showWordmark && (
        <span
          className={`${face === 'chrome' ? 'font-body font-extrabold' : 'dm-display font-semibold'} ${wordmarkTone === 'inverse' ? 'text-white' : 'text-ink'} ${wordmarkClassName}`}
          style={{ fontSize: `${size >= 36 ? 20 : 18}px`, letterSpacing: '-0.02em' }}
        >
          DeutschMeister
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
