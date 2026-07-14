import { Link } from 'react-router-dom';

/**
 * DeutschMeister brand mark — the Meister-Siegel seal + two-tone wordmark.
 * Extracted from the approved dashboard design so the dashboard top bar and
 * the site nav share one source of truth.
 *
 * Props:
 *   size        — seal diameter in px (default 38); wordmark scales with it
 *   showWordmark — render the "DeutschMeister" wordmark beside the seal (default true)
 *   to          — wrap in a Link to this path (default '/'); pass null for a bare mark
 *   className   — extra classes on the wrapper
 */
export default function Logo({ size = 38, showWordmark = true, to = '/', className = '' }) {
  // Unique gradient id per instance so multiple logos on a page don't collide.
  const gid = `dmSeal-${size}-${showWordmark ? 'w' : 'n'}`;
  const wordSize = Math.round(size * 0.47); // ~18px at size 38

  const mark = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="DeutschMeister"
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0F766E" />
            <stop offset="1" stopColor="#0D9488" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill={`url(#${gid})`} />
        <circle
          cx="32"
          cy="32"
          r="26"
          fill="none"
          stroke="rgba(255,255,255,.35)"
          strokeWidth="1.2"
          strokeDasharray="1.5 4"
        />
        <circle cx="32" cy="8.5" r="3.4" fill="#FBBF24" />
        <text
          x="32"
          y="45"
          textAnchor="middle"
          fontFamily="Fraunces, Georgia, serif"
          fontWeight="700"
          fontSize="34"
          fill="#fff"
        >
          M
        </text>
      </svg>
      {showWordmark && (
        <span
          className="dm-display font-semibold text-slate-800"
          style={{ fontSize: `${wordSize}px`, letterSpacing: '-0.01em' }}
        >
          Deutsch<span style={{ color: '#0D9488' }}>Meister</span>
        </span>
      )}
    </span>
  );

  if (to === null) return mark;
  return (
    <Link to={to} className="inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2">
      {mark}
    </Link>
  );
}
