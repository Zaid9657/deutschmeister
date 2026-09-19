import { color, accent } from '../../data/design-tokens.js';
import { A11_ART } from '../../data/curricula/a11.art.js';

// Flat-vector situation scenes, one per A1.1 Lektion — the Wave 2 placeholder
// art (docs/design/a11-art-style.md, BLOCKED on downloading the AI-generated
// bytes). Every fill is imported from design-tokens.js: no hex literal, no
// grammatical-case colour (rule 1: colour means grammatical case, never decoration).
// Landscape 16:10, paper ground, reduced-motion safe (nothing here animates).
// When the owner's Higgsfield run lands, `A11_ART.situations[id].src`/
// `srcSmall` get filled and this component renders an `<img>` instead — see
// the branch below.

const INK = color.ink;
const TEAL = color.siegel;
const APRICOT = accent.aprikose.bright;
const LIME = accent.limette.bright;
const SUNK = color.paperSunk;

/** Every Lektion id this component can draw a scene for. */
export const SITUATION_IDS = [
  'a1.1-l01', 'a1.1-l02', 'a1.1-l03', 'a1.1-l04', 'a1.1-l05', 'a1.1-l06',
  'a1.1-l07', 'a1.1-l08', 'a1.1-l09', 'a1.1-l10', 'a1.1-l11', 'a1.1-l12',
];

// Each scene: at most 12 flat shapes, matching the setting one line names —
// never German text (the style doc bans lettering in generated art; the same
// rule holds here: shapes only, no numerals, no glyphs).
const SCENES = {
  // L01 — hostel reception: counter + bell
  'a1.1-l01': () => (
    <>
      <rect x="10" y="58" width="140" height="32" rx="4" fill={SUNK} />
      <rect x="10" y="58" width="140" height="6" fill={TEAL} />
      <circle cx="118" cy="68" r="6" fill={APRICOT} />
      <rect x="116" y="74" width="4" height="6" fill={INK} />
      <rect x="30" y="30" width="18" height="28" rx="2" fill={color.white} stroke={color.rule} strokeWidth="1" />
      <circle cx="90" cy="24" r="10" fill={APRICOT} />
    </>
  ),
  // L02 — public office counter: blank form + pen
  'a1.1-l02': () => (
    <>
      <rect x="10" y="50" width="140" height="40" rx="4" fill={SUNK} />
      <rect x="60" y="30" width="40" height="26" rx="2" fill={color.white} />
      <rect x="66" y="38" width="28" height="2.5" fill={SUNK} />
      <rect x="66" y="44" width="28" height="2.5" fill={SUNK} />
      <rect x="66" y="50" width="16" height="2.5" fill={SUNK} />
      <path d="M96,34 L104,26" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <rect x="20" y="62" width="10" height="20" rx="2" fill={TEAL} />
    </>
  ),
  // L03 — photo frame on a table
  'a1.1-l03': () => (
    <>
      <rect x="12" y="70" width="136" height="20" fill={SUNK} />
      <rect x="55" y="30" width="50" height="38" rx="3" fill={color.white} stroke={TEAL} strokeWidth="2" />
      <circle cx="70" cy="48" r="6" fill={APRICOT} />
      <circle cx="86" cy="48" r="6" fill={LIME} />
      <circle cx="78" cy="58" r="5" fill={APRICOT} />
      <circle cx="24" cy="76" r="6" fill={color.white} />
      <circle cx="136" cy="76" r="6" fill={color.white} />
    </>
  ),
  // L04 — flea-market stall: table + chair
  'a1.1-l04': () => (
    <>
      <path d="M10,30 L150,30 L140,20 L20,20 Z" fill={APRICOT} />
      <rect x="20" y="55" width="120" height="30" rx="2" fill={SUNK} />
      <rect x="30" y="58" width="24" height="18" fill={color.white} />
      <path d="M100,58 L124,58 L120,80 L104,80 Z" fill={color.white} />
      <rect x="66" y="88" width="16" height="4" fill={INK} />
      <rect x="66" y="70" width="16" height="18" fill={LIME} />
    </>
  ),
  // L05 — classroom desk: board + pencils
  'a1.1-l05': () => (
    <>
      <rect x="14" y="16" width="132" height="34" rx="3" fill={SUNK} />
      <rect x="16" y="70" width="128" height="16" rx="3" fill={color.white} />
      <rect x="30" y="74" width="18" height="3" fill={LIME} />
      <rect x="52" y="74" width="18" height="3" fill={APRICOT} />
      <rect x="74" y="74" width="18" height="3" fill={TEAL} />
      <path d="M110,86 L114,72 L118,86 Z" fill={INK} />
      <path d="M124,86 L128,72 L132,86 Z" fill={TEAL} />
    </>
  ),
  // L06 — office desk: computer + phone
  'a1.1-l06': () => (
    <>
      <rect x="12" y="66" width="136" height="24" rx="3" fill={SUNK} />
      <rect x="60" y="30" width="44" height="30" rx="2" fill={color.white} stroke={INK} strokeWidth="1.5" />
      <rect x="76" y="60" width="12" height="6" fill={SUNK} />
      <rect x="20" y="46" width="16" height="20" rx="2" fill={TEAL} />
      <circle cx="130" cy="50" r="10" fill={APRICOT} />
    </>
  ),
  // L07 — free time: bicycle + guitar
  'a1.1-l07': () => (
    <>
      <circle cx="34" cy="72" r="14" fill="none" stroke={TEAL} strokeWidth="3" />
      <circle cx="70" cy="72" r="14" fill="none" stroke={TEAL} strokeWidth="3" />
      <path d="M34,72 L52,72 L70,72 M52,72 L58,50 L44,50" fill="none" stroke={TEAL} strokeWidth="3" strokeLinecap="round" />
      <path d="M112,30 Q104,50 112,70 Q120,86 108,90 Q98,86 104,68 Q98,48 110,32 Z" fill={APRICOT} />
      <rect x="108" y="20" width="4" height="18" fill={INK} />
    </>
  ),
  // L08 — appointments: wall clock + calendar
  'a1.1-l08': () => (
    <>
      <circle cx="46" cy="42" r="22" fill={color.white} stroke={TEAL} strokeWidth="3" />
      <path d="M46,42 L46,28 M46,42 L56,46" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <rect x="90" y="20" width="56" height="48" rx="3" fill={color.white} stroke={SUNK} strokeWidth="1.5" />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={96 + (i % 3) * 16} y={30 + Math.floor(i / 3) * 12} width="10" height="8" fill={i === 4 ? TEAL : SUNK} />
      ))}
    </>
  ),
  // L09 — café: cup + cake
  'a1.1-l09': () => (
    <>
      <rect x="14" y="70" width="132" height="20" rx="10" fill={SUNK} />
      <path d="M50,55 L50,72 L70,72 L70,55 Z" fill={color.white} />
      <path d="M70,58 Q80,58 78,66 Q74,68 70,66 Z" fill="none" stroke={INK} strokeWidth="2" />
      <path d="M50,55 Q60,48 70,55 Z" fill={APRICOT} />
      <path d="M95,60 L120,60 L118,72 L97,72 Z" fill={APRICOT} />
      <rect x="95" y="56" width="25" height="6" rx="2" fill={LIME} />
    </>
  ),
  // L10 — train station: train + platform sign
  'a1.1-l10': () => (
    <>
      <rect x="10" y="84" width="140" height="6" fill={SUNK} />
      <rect x="18" y="42" width="90" height="34" rx="6" fill={TEAL} />
      <rect x="28" y="52" width="16" height="14" rx="2" fill={color.white} />
      <rect x="52" y="52" width="16" height="14" rx="2" fill={color.white} />
      <rect x="76" y="52" width="16" height="14" rx="2" fill={color.white} />
      <circle cx="34" cy="80" r="5" fill={INK} />
      <circle cx="92" cy="80" r="5" fill={INK} />
      <rect x="122" y="22" width="26" height="40" rx="2" fill={color.white} stroke={SUNK} strokeWidth="1.5" />
      <rect x="128" y="30" width="14" height="3" fill={SUNK} />
      <rect x="128" y="38" width="14" height="3" fill={SUNK} />
      <rect x="128" y="46" width="14" height="3" fill={SUNK} />
    </>
  ),
  // L11 — daily routine: alarm clock + coffee + bag
  'a1.1-l11': () => (
    <>
      <circle cx="34" cy="46" r="18" fill={color.white} stroke={APRICOT} strokeWidth="3" />
      <path d="M34,46 L34,34 M34,46 L42,50" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="30" r="3" fill={APRICOT} />
      <circle cx="48" cy="30" r="3" fill={APRICOT} />
      <path d="M78,58 L78,74 L96,74 L96,58 Z" fill={color.white} />
      <path d="M96,60 Q104,60 102,68 Q98,70 96,68 Z" fill="none" stroke={INK} strokeWidth="2" />
      <path d="M120,50 L142,50 L138,86 L124,86 Z" fill={TEAL} />
      <path d="M126,50 Q131,40 136,50" fill="none" stroke={INK} strokeWidth="2.5" />
    </>
  ),
  // L12 — birthday: cake with candles + envelope
  'a1.1-l12': () => (
    <>
      <rect x="30" y="66" width="50" height="20" rx="3" fill={APRICOT} />
      <rect x="30" y="58" width="50" height="10" rx="2" fill={LIME} />
      <rect x="42" y="48" width="3" height="12" fill={INK} />
      <rect x="55" y="48" width="3" height="12" fill={INK} />
      <rect x="68" y="48" width="3" height="12" fill={INK} />
      <circle cx="43.5" cy="46" r="2" fill={APRICOT} />
      <circle cx="56.5" cy="46" r="2" fill={APRICOT} />
      <circle cx="69.5" cy="46" r="2" fill={APRICOT} />
      <path d="M104,52 L142,52 L142,76 L104,76 Z" fill={color.white} stroke={SUNK} strokeWidth="1.5" />
      <path d="M104,52 L123,66 L142,52" fill="none" stroke={TEAL} strokeWidth="2" />
    </>
  ),
};

/**
 * One flat-vector scene per Lektion, 16:10 landscape. Renders the owner's
 * photo once `A11_ART.situations[lektionId].src` is filled; until then, this
 * placeholder. `srcSmall`/`src` follow the manifest's contract (see its
 * header): a `<img loading="lazy">` when present, the inline SVG otherwise.
 */
export default function SituationScene({ lektionId, className = '' }) {
  const entry = A11_ART.situations?.[lektionId];
  const alt = entry?.alt || '';

  if (entry?.srcSmall || entry?.src) {
    return (
      <img
        src={entry.srcSmall || entry.src}
        loading="lazy"
        width={640}
        height={400}
        alt={alt}
        className={className}
      />
    );
  }

  const Scene = SCENES[lektionId];
  if (!Scene) return null;

  return (
    <svg viewBox="0 0 160 100" role="img" aria-label={alt || 'Course situation illustration'} className={className}>
      <rect x="0" y="0" width="160" height="100" fill={color.paper} />
      <Scene />
    </svg>
  );
}
