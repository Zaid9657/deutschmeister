import { castTones as T, courseHues as H } from '../../data/design-tokens.js';

// Flat busts of the A1 cast for the course's game screens (the path, the unit
// intro, the step celebration). Every fill comes from design-tokens.js; nothing
// here is a kasus colour. A name the component does not know gets a coloured
// initial instead of a wrong face.

const HAIR = {
  long: 'M11 34c0-13 5.5-22 13-22s13 9 13 22v6H11z',
  bob: 'M13 32c0-12 4.5-19 11-19s11 7 11 19v4H13z',
};
const FRINGE = {
  side: 'M14.5 24c1.5-6.5 5.2-9.5 9.5-9.5s8 3 9.5 9.5c-3.6-2.8-6.4-3.8-9.5-3.8s-5.9 1-9.5 3.8z',
  swept: 'M14.5 23c2-6 5.5-8.5 9.5-8.5s7.5 2.5 9.5 8.5c-4-1-7-3.5-9-5.5-2 2-5.5 4.5-10 5.5z',
  short: 'M14.8 23.5c.6-6 4.4-9.3 9.2-9.3s8.6 3.3 9.2 9.3c-2.2-2.6-5.2-3.6-9.2-3.6s-7 1-9.2 3.6z',
  curly: 'M14.6 23.8c-.4-6.6 3.8-10.3 9.4-10.3s9.8 3.7 9.4 10.3c-1.6-3-3.6-4.2-5.2-4.2-1.4 1.4-3 1.8-4.2 1.8s-3.2-.8-4.2-1.8c-1.6 0-3.6 1.2-5.2 4.2z',
  bun: 'M14.8 23.5c.6-6 4.4-9.3 9.2-9.3s8.6 3.3 9.2 9.3c-2.2-2.6-5.2-3.6-9.2-3.6s-7 1-9.2 3.6zM24 6.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z',
};

const CAST = {
  Priya: { skin: T.skinBrown, hair: T.hairBlack, back: HAIR.long, fringe: FRINGE.side, shirt: H.beere.bright },
  Olena: { skin: T.skinLight, hair: T.hairBlond, back: HAIR.bob, fringe: FRINGE.swept, shirt: H.tuerkis.bright },
  Bilal: { skin: T.skinDeep, hair: T.hairDark, fringe: FRINGE.short, shirt: H.orange.bright, beard: true },
  Emre: { skin: T.skinTan, hair: T.hairBrown, fringe: FRINGE.curly, shirt: H.gruen.bright, glasses: true },
  'Frau Schulz': { skin: T.skinRose, hair: T.hairGrey, fringe: FRINGE.bun, shirt: H.tuerkis.edge, glasses: true },
};

export const CAST_NAMES = Object.keys(CAST);

export default function CastAvatar({ name, size = 48, className = '', decorative = false }) {
  const c = CAST[name];
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name };
  if (!c) {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" className={className} {...a11y}>
        <circle cx="24" cy="24" r="24" fill={T.backdrop} />
        <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="800" fill={T.mouth}>{String(name || '?').charAt(0)}</text>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} {...a11y}>
      <circle cx="24" cy="24" r="24" fill={T.backdrop} />
      {c.back && <path d={c.back} fill={c.hair} />}
      <path d="M12 48c0-8 5-12.5 12-12.5S36 40 36 48z" fill={c.shirt} />
      <rect x="21" y="31" width="6" height="6" rx="2" fill={c.skin} />
      <circle cx="24" cy="25" r="9.5" fill={c.skin} />
      <path d={c.fringe} fill={c.hair} />
      {c.beard && <path d="M15.5 27c.8 5 4.2 7.6 8.5 7.6s7.7-2.6 8.5-7.6c-1.6 2-2.8 2.4-4 2.4h-9c-1.2 0-2.4-.4-4-2.4z" fill={c.hair} />}
      {c.glasses && (
        <g fill="none" stroke={T.mouth} strokeWidth="1.2">
          <circle cx="20.6" cy="25.6" r="3" />
          <circle cx="27.4" cy="25.6" r="3" />
        </g>
      )}
      <circle cx="20.6" cy="25.6" r="1.2" fill={T.mouth} />
      <circle cx="27.4" cy="25.6" r="1.2" fill={T.mouth} />
      {!c.beard && <path d="M20.8 29.2c1.9 1.8 4.5 1.8 6.4 0" stroke={T.mouth} strokeWidth="1.5" fill="none" strokeLinecap="round" />}
    </svg>
  );
}
