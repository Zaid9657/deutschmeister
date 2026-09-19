import { color, accent } from '../../data/design-tokens.js';
import { A11_META } from '../../data/curricula/a11.meta.js';
import { A11_ART } from '../../data/curricula/a11.art.js';

// Flat-vector busts for the A1.1 cast — the Wave 2 placeholder art
// (docs/design/a11-art-style.md, BLOCKED on downloading the AI-generated
// bytes; see that file's status note). Every fill below is imported from
// design-tokens.js: nothing here is a hex literal (tests/course-art.test.mjs
// greps for `#`) and nothing here uses the four grammatical-case colours —
// design-tokens.js rule 1 reserves them for naming a case, never for
// decoration. When the owner's Higgsfield run lands (docs/owner-prompts.md,
// "Generate the A1.1 course art"), `A11_ART.characters[name].src`/`srcSmall`
// get filled and this component renders an `<img>` instead of these shapes —
// see the branch below.
//
// Eight distinct silhouettes, one accessory each (drawing decisions only,
// never a course fact — see the cast table in docs/design/a11-art-style.md):
// Ana (earrings), Frau Kaya (bun), Herr Weber (glasses), Lena (collar),
// Frau Wolf (scarf), Tim (beard), Paul (tie), Herr Schmidt (cap).

const SKIN = {
  warm: accent.aprikose.bright,
  light: accent.aprikose.wash,
  golden: color.gold,
  deep: color.graphite,
};

const HAIR = {
  dark: color.ink,
  grey: color.graphite,
  blonde: color.gold,
  deepTeal: color.siegelDeep,
};

const GARMENT = {
  teal: color.siegel,
  apricot: accent.aprikose.bright,
  white: color.white,
  lime: accent.limette.bright,
};

const CAST = {
  Ana: { skin: SKIN.warm, hair: HAIR.dark, hairStyle: 'wavy', garment: GARMENT.teal, accessory: 'earrings' },
  'Frau Kaya': { skin: SKIN.light, hair: HAIR.dark, hairStyle: 'bun', garment: GARMENT.apricot, accessory: 'none' },
  'Herr Weber': { skin: SKIN.light, hair: HAIR.grey, hairStyle: 'short', garment: GARMENT.white, accessory: 'glasses' },
  Lena: { skin: SKIN.light, hair: HAIR.blonde, hairStyle: 'short', garment: GARMENT.lime, accessory: 'collar' },
  'Frau Wolf': { skin: SKIN.light, hair: HAIR.grey, hairStyle: 'tied', garment: GARMENT.apricot, accessory: 'scarf' },
  Tim: { skin: SKIN.warm, hair: HAIR.dark, hairStyle: 'curly', garment: GARMENT.teal, accessory: 'beard' },
  Paul: { skin: SKIN.light, hair: HAIR.dark, hairStyle: 'short', garment: GARMENT.white, accessory: 'tie' },
  'Herr Schmidt': { skin: SKIN.deep, hair: HAIR.dark, hairStyle: 'short', garment: GARMENT.teal, accessory: 'cap' },
};

const ROLE_EN = Object.fromEntries((A11_META.characters || []).map((c) => [c.name, c.roleEn]));

/** Every name this component can draw. Exported so the manifest and the test can pin coverage. */
export const CHARACTER_NAMES = Object.keys(CAST);

function Shoulders({ fill }) {
  return <path d="M18,100 Q18,60 50,56 Q82,60 82,100 Z" fill={fill} />;
}

function Neck({ fill }) {
  return <rect x="43" y="48" width="14" height="14" fill={fill} />;
}

function Head({ fill }) {
  return <circle cx="50" cy="37" r="19" fill={fill} />;
}

function Face() {
  return (
    <>
      <circle cx="43" cy="37" r="1.6" fill={color.ink} />
      <circle cx="57" cy="37" r="1.6" fill={color.ink} />
      <path d="M44,45 Q50,48 56,45" stroke={color.ink} strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </>
  );
}

function Hair({ style, fill }) {
  switch (style) {
    case 'wavy':
      return <path d="M28,42 Q25,14 50,13 Q75,14 72,42 Q75,58 65,62 L65,40 Q65,22 50,20 Q35,22 35,40 L35,62 Q25,58 28,42 Z" fill={fill} />;
    case 'bun':
      return (
        <>
          <path d="M29,34 Q29,15 50,15 Q71,15 71,34 L71,29 Q71,19 50,19 Q29,19 29,29 Z" fill={fill} />
          <circle cx="50" cy="12" r="6" fill={fill} />
        </>
      );
    case 'tied':
      return (
        <>
          <path d="M29,32 Q29,15 50,15 Q71,15 71,32 L71,28 Q71,18 50,18 Q29,18 29,28 Z" fill={fill} />
          <circle cx="50" cy="60" r="5" fill={fill} />
        </>
      );
    case 'curly':
      return (
        <g fill={fill}>
          <circle cx="33" cy="24" r="6.5" />
          <circle cx="44" cy="17" r="7" />
          <circle cx="56" cy="17" r="7" />
          <circle cx="67" cy="24" r="6.5" />
        </g>
      );
    case 'short':
    default:
      return <path d="M29,30 Q29,15 50,14 Q71,15 71,30 Q71,22 50,20 Q29,22 29,30 Z" fill={fill} />;
  }
}

function Accessory({ kind, cast }) {
  switch (kind) {
    case 'glasses':
      return (
        <g stroke={color.ink} strokeWidth="1.6" fill="none">
          <circle cx="43" cy="37" r="5.5" />
          <circle cx="57" cy="37" r="5.5" />
          <line x1="48.5" y1="37" x2="51.5" y2="37" />
        </g>
      );
    case 'earrings':
      return (
        <g fill={color.gold}>
          <circle cx="31.5" cy="40" r="1.6" />
          <circle cx="68.5" cy="40" r="1.6" />
        </g>
      );
    case 'beard':
      return <path d="M35,42 Q50,57 65,42 L65,49 Q50,60 35,49 Z" fill={cast.hair} />;
    case 'tie':
      return <path d="M47,52 L53,52 L55,61 L50,68 L45,61 Z" fill={color.ink} />;
    case 'collar':
      return <path d="M39,58 L50,67 L61,58 L58,54 L50,60 L42,54 Z" fill={color.white} />;
    case 'scarf':
      return <path d="M28,54 Q50,64 72,54 L72,60 Q50,70 28,60 Z" fill={accent.aprikose.wash} stroke={accent.aprikose.edge} strokeWidth="1" />;
    case 'cap':
      return (
        <>
          <path d="M29,28 Q29,13 50,13 Q71,13 71,28 L71,32 L29,32 Z" fill={cast.hair} />
          <rect x="29" y="30" width="20" height="4" rx="1.5" fill={cast.hair} />
        </>
      );
    default:
      return null;
  }
}

/**
 * One SVG bust per A1.1 cast member. Renders the owner's photo once
 * `A11_ART.characters[name].src` is filled (see the manifest header); until
 * then, this flat-vector placeholder.
 */
export default function CharacterAvatar({ name, size = 40, className = '' }) {
  const cast = CAST[name];
  const roleEn = ROLE_EN[name] || '';
  const label = roleEn ? `${name}, ${roleEn}` : name || 'Course character';
  const art = A11_ART.characters?.[name];

  if (art?.src) {
    return (
      <img
        src={art.src}
        loading="lazy"
        width={size}
        height={size}
        alt={art.alt || label}
        className={className}
        style={{ borderRadius: '50%', objectFit: 'cover' }}
      />
    );
  }

  if (!cast) return null;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={className}
    >
      <circle cx="50" cy="50" r="50" fill={color.paperSunk} />
      <Shoulders fill={cast.garment} />
      <Hair style={cast.hairStyle} fill={cast.hair} />
      <Neck fill={cast.skin} />
      <Head fill={cast.skin} />
      <Face />
      <Accessory kind={cast.accessory} cast={cast} />
    </svg>
  );
}
