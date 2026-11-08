// DeutschMeister · OPEN HOUSE · 2026-11-08
// Canonical visual system, shared byte-for-byte with Astro. Compatibility names
// (siegel / linie / nacht / clay) keep existing consumers on the same system.
// Warm editorial space, plum actions, orange punctuation, lilac product stages.
// Case colours and legacy exercise themes retain their pedagogical meaning.
export const color = {
  paper: '#FFF9F0', paperSunk: '#F3EBDD', ink: '#2D2034', graphite: '#615165',
  rule: '#DDD2DE', edge: '#CDBDCE', white: '#FFFFFF',
  siegel: '#653C73', siegelLift: '#512D5E', siegelDeep: '#4D285A',
  siegelWash: '#EDE3F2', siegelEdge: '#3D2047', gold: '#F8BC63',
  orange: '#E8915B', orangeWash: '#FCE5CF', orangeInk: '#85401E',
  lilac: '#D9C6EE', lilacWash: '#F3EDF9', plum: '#2D2034',
};
export const kasus = {
  nominativ: { line: '#378ADD', wash: '#E6F1FB', ink: '#0C447C', abbr: 'NOM' },
  akkusativ: { line: '#D85A30', wash: '#FAECE7', ink: '#712B13', abbr: 'AKK' },
  dativ: { line: '#1D9E75', wash: '#E1F5EE', ink: '#085041', abbr: 'DAT' },
  genitiv: { line: '#7F77DD', wash: '#EEEDFE', ink: '#3C3489', abbr: 'GEN' },
};
export const accent = {
  himbeer: { bright: '#C65C83', wash: '#FAE8EF', ink: '#812C4D', edge: '#A74065' },
  aprikose: { bright: color.orange, wash: color.orangeWash, ink: color.orangeInk, edge: '#C97543' },
  limette: { bright: '#BCCB83', wash: '#EFF1DD', ink: '#4A562B', edge: '#8D9D57' },
};
export const viz = { pos: '#009E73', neg: '#D55E00', series1: '#0072B2', series2: '#E69F00', warn: '#B7791F', error: '#C0362C' };
export const font = {
  display: "'Meister Serif', 'Meister Serif Fallback', Georgia, serif",
  body: "'Meister Sans', 'Meister Sans Fallback', Arial, sans-serif",
  data: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};
const face = (family, file, weight) => ({ '@font-face': {
  fontFamily: `'${family}'`, fontStyle: 'normal', fontWeight: weight,
  fontDisplay: 'swap', src: `url('/fonts/${file}.woff') format('woff')`,
} });
const fallback = (family, locals, adjust, ascent, descent, weight = '100 500') => ({ '@font-face': {
  fontFamily: `'${family} Fallback'`, src: locals.map((local) => `local('${local}')`).join(', '), fontWeight: weight,
  sizeAdjust: adjust, ascentOverride: ascent, descentOverride: descent, lineGapOverride: '0%',
} });
// Locally packaged OFL European subsets: Meister Serif from Caladea,
// Meister Sans from Carlito; modified fonts use new names (Carlito is reserved). Carlito is
// metrically compatible with Calibri; Caladea with Cambria. Arial/Georgia
// fallbacks are calibrated over the new public copy using Pillow font advances
// against Liberation Serif/Sans (metric twins of Times New Roman/Arial), with
// source hhea metrics. Browser CLS still requires viewport verification.
export const fontFaces = [
  face('Meister Serif', 'meister-serif-v1-regular', '400 500'), face('Meister Serif', 'meister-serif-v1-bold', '600 900'),
  face('Meister Sans', 'meister-sans-v1-regular', '100 500'), face('Meister Sans', 'meister-sans-v1-bold', '600 900'),
  fallback('Meister Serif', ['Times New Roman', 'Liberation Serif'], '99.6%', '90.36%', '25.1%'),
  fallback('Meister Serif', ['Times New Roman Bold', 'Liberation Serif Bold'], '103.18%', '87.23%', '24.23%', '600 900'),
  fallback('Meister Sans', ['Arial', 'Liberation Sans'], '91.08%', '104.54%', '29.49%'),
  fallback('Meister Sans', ['Arial Bold', 'Liberation Sans Bold'], '86.88%', '109.6%', '30.92%', '600 900'),
];
export const fontFacesItalic = [];
export const fontPreloads = ['/fonts/meister-serif-v1-regular.woff', '/fonts/meister-sans-v1-regular.woff', '/fonts/meister-sans-v1-bold.woff'];
// Sign now uses the same body face: no third family or extra font request.
export const signFontFaces = [];
export const signFontPreloads = ['/fonts/meister-sans-v1-bold.woff'];
export const type = {
  masthead: { size: '6rem', mobile: '3.5rem', weight: 400, tracking: '-0.045em', leading: .99, family: 'display' },
  editorial: { size: '4.75rem', mobile: '3rem', weight: 400, tracking: '-0.035em', leading: 1.03, family: 'display' },
  hero: { size: '4rem', mobile: '2.75rem', weight: 400, tracking: '-0.035em', leading: 1.06, family: 'display' },
  section: { size: '3rem', mobile: '2.125rem', weight: 400, tracking: '-0.025em', leading: 1.1, family: 'display' },
  cardTitle: { size: '1.5rem', mobile: '1.25rem', weight: 700, tracking: '-0.015em', leading: 1.25, family: 'body' },
  lead: { size: '1.25rem', mobile: '1.125rem', weight: 400, tracking: '0', leading: 1.55, family: 'body' },
  body: { size: '1.0625rem', mobile: '1rem', weight: 400, tracking: '0', leading: 1.6, family: 'body' },
  small: { size: '.875rem', mobile: '.875rem', weight: 400, tracking: '0', leading: 1.5, family: 'body' },
  label: { size: '.75rem', mobile: '.75rem', weight: 700, tracking: '.08em', leading: 1.3, family: 'body' },
  data: { size: '.8125rem', mobile: '.8125rem', weight: 500, tracking: '0', leading: 1.4, family: 'data' },
};
export const space = { xs: '.375rem', sm: '.75rem', md: '1.25rem', lg: '2rem', xl: '3.5rem', xxl: '6rem' };
export const layout = { maxWidth: '76rem', prose: '42rem', gutter: '1.5rem' };
export const radius = { none: '0', sm: '.375rem', md: '.75rem', lg: '1.5rem', clay: '1.5rem', control: '.75rem', window: '1.5rem', pill: '999px' };
export const depth = { press: '2px', pressSm: '1px' };
export const shadow = {
  raise: '0 8px 24px -16px rgba(48,35,55,.22)',
  raiseLg: '0 24px 64px -32px rgba(48,35,55,.3)',
  raiseSiegel: '0 6px 16px -8px rgba(48,35,55,.32)',
  raiseHimbeer: '0 8px 24px -16px rgba(48,35,55,.22)',
  raiseAprikose: '0 8px 24px -16px rgba(48,35,55,.22)',
  raiseLimette: '0 8px 24px -16px rgba(48,35,55,.22)',
  hover: '0 12px 32px -16px rgba(48,35,55,.25)',
  overlay: '0 24px 64px -24px rgba(48,35,55,.3)',
};
export const motion = { spring: 'cubic-bezier(0.22, 1, 0.36, 1)', snap: 'cubic-bezier(0.2, 0, 0, 1)', duration: { press: '120ms', pop: '200ms', enter: '480ms' } };
export const linie = { DEFAULT: color.siegel, deep: color.siegelLift, edge: color.siegelEdge, wash: color.siegelWash, ink: color.white };
// Compatibility ground stays light; the new footer explicitly uses plum.
export const nacht = { DEFAULT: color.lilacWash, raised: color.white, sunk: color.lilac, rule: color.rule, text: color.ink, muted: color.graphite };
export const motionLinie = { ease: { out: motion.spring, inOut: 'cubic-bezier(0.65, 0, 0.35, 1)', drawer: 'cubic-bezier(0.32, 0.72, 0, 1)' }, duration: { feedback: '120ms', control: '200ms', section: '480ms', signature: '720ms' }, stagger: '50ms' };
export const qaWidths = [360, 390, 768, 1280, 1440];
export const tailwindColors = {
  paper: color.paper, 'paper-sunk': color.paperSunk, ink: color.ink, graphite: color.graphite,
  rule: color.rule, edge: color.edge, plum: color.plum, lilac: color.lilac, 'lilac-wash': color.lilacWash,
  orange: color.orange, 'orange-wash': color.orangeWash, 'orange-ink': color.orangeInk,
  siegel: { DEFAULT: color.siegel, lift: color.siegelLift, deep: color.siegelDeep, wash: color.siegelWash, edge: color.siegelEdge }, gold: color.gold,
  kasus: Object.fromEntries(Object.entries(kasus).map(([n,v]) => [n, { DEFAULT: v.line, wash: v.wash, ink: v.ink }])),
  accent: Object.fromEntries(Object.entries(accent).map(([n,v]) => [n, { DEFAULT: v.bright, wash: v.wash, ink: v.ink, edge: v.edge }])), viz: { ...viz },
};
export const tailwindBoxShadow = { raise: shadow.raise, 'raise-lg': shadow.raiseLg, 'raise-siegel': shadow.raiseSiegel, 'raise-himbeer': shadow.raiseHimbeer, 'raise-aprikose': shadow.raiseAprikose, 'raise-limette': shadow.raiseLimette, hover: shadow.hover, overlay: shadow.overlay };
export const tailwindEasing = { spring: motion.spring, snap: motion.snap };
export const tailwindFontFamily = {
  display: ['Meister Serif', 'Meister Serif Fallback', 'Georgia', 'serif'],
  body: ['Meister Sans', 'Meister Sans Fallback', 'Arial', 'sans-serif'],
  data: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
};
export const tailwindSignFont = { sign: tailwindFontFamily.body };
export const tailwindLinieColors = { linie: { ...linie }, nacht: { ...nacht } };
export const tailwindLinieShadow = { 'raise-linie': shadow.raiseSiegel, 'raise-nacht': shadow.raise, ticket: shadow.raiseLg };
export const tailwindLinieEasing = { 'out-strong': motionLinie.ease.out, 'in-out-strong': motionLinie.ease.inOut, drawer: motionLinie.ease.drawer };
export const tailwindLinieDuration = { ...motionLinie.duration };
export const legacyLevelColors = {
'a1-1': { primary: '#F4B99A', secondary: '#D9A8B4', accent: '#41B3A3', background: '#FDF8F5', surface: '#FFFFFF', text: '#2D3436', muted: '#636E72' },
'a1-2': { primary: '#E8A87C', secondary: '#C38D9E', accent: '#41B3A3', background: '#FDF6F0', surface: '#FFFFFF', text: '#2D3436', muted: '#636E72' },
'a2-1': { primary: '#7BAF8E', secondary: '#A8D4AC', accent: '#D4A574', background: '#F7FAF8', surface: '#FFFFFF', text: '#1E3A2F', muted: '#4A6B5D' },
'a2-2': { primary: '#5B8A72', secondary: '#8FB996', accent: '#D4A574', background: '#F5F9F6', surface: '#FFFFFF', text: '#1E3A2F', muted: '#4A6B5D' },
'b1-1': { primary: '#5A7A9A', secondary: '#B0D4E8', accent: '#EE6C4D', background: '#F2F6F9', surface: '#FFFFFF', text: '#1B2838', muted: '#5C7A99' },
'b1-2': { primary: '#3D5A80', secondary: '#98C1D9', accent: '#EE6C4D', background: '#F0F4F8', surface: '#FFFFFF', text: '#1B2838', muted: '#5C7A99' },
'b2-1': { primary: '#8A7AAF', secondary: '#BDB0D9', accent: '#E8B4BC', background: '#F9F7FB', surface: '#FFFFFF', text: '#2D2640', muted: '#7A6F8F' },
'b2-2': { primary: '#6B5B95', secondary: '#9D8EC1', accent: '#E8B4BC', background: '#F8F6FA', surface: '#FFFFFF', text: '#2D2640', muted: '#7A6F8F' },
};


export const tailwindTypeSizes = Object.fromEntries(Object.entries(type).flatMap(([name, role]) => [
  [`dm-${name}`, [role.mobile, { lineHeight: String(role.leading), letterSpacing: role.tracking, fontWeight: String(role.weight) }]],
  [`dm-${name}-wide`, [role.size, { lineHeight: String(role.leading), letterSpacing: role.tracking, fontWeight: String(role.weight) }]],
]));

// Pass 3 explicitly excludes email templates/functions. Their existing visual
// contract remains pinned until a separate authorised transactional redesign.
export const transactionalColor = {
  siegel: '#0A8276', siegelLift: '#0A7468', siegelWash: '#E3F6F3', gold: '#FBBF24',
  ink: '#14201D', graphite: '#5A6360', rule: '#E2E7E5', paper: '#FCFCFA', white: '#FFFFFF',
};
