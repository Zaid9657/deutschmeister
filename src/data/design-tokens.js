// DeutschMeister design tokens — the single source for colour, type, spacing,
// DEPTH and MOTION.
//
// DUPLICATED between the SPA and the Astro site (byte-identical, enforced by
// scripts/check-duplicates.mjs), for the same reason as pricing.js and
// marketing.js: two packages, two node_modules trees, no safe cross-import.
// Both tailwind configs import this file, so a token added here reaches every
// surface on both sides.
//
// WHERE THIS CAME FROM. v1 (2026-08) unified four unrelated colour stories
// into one flat, hairline-ruled system. v2 (2026-09, the "Playful Depth"
// renovation, docs/design-renovation-2026-09-01.md) keeps that system's colour
// discipline and rebuilds its PHYSICALITY: the site read as a beautiful
// reference book, and the person it serves — someone with an exam date and
// visa/job stakes — needs it to feel like a coach, not a card catalogue.
// Buttons are now chunky and physically press down, cards are soft extruded
// clay, progress celebrates. The depth grammar lives here so it stays one
// grammar.
//
// ---------------------------------------------------------------------------
// THE THREE RULES. These are load-bearing, not taste. Breaking one makes the
// system decorative again, which is what it replaced.
// ---------------------------------------------------------------------------
//
// 1. COLOUR MEANS CASE. The four `kasus` colours below are the ones Sentence
//    X-Ray already uses to mark Nominativ, Akkusativ, Dativ and Genitiv
//    (src/pages/SentenceXRay.jsx, CASE_STYLES). They may appear ONLY where a
//    grammatical case is named or demonstrated. Never as a section fill, never
//    on a CTA, never because a card needed livening up. The payoff is that a
//    learner meets the same colour language on the pricing page and inside the
//    analyser, and learns it twice. The `accent` candy palette exists so this
//    rule survives a playful design: when a surface needs energy, it takes an
//    accent, never a case colour. (Accent hues are chosen to be UNCONFUSABLE
//    with the four case hues — no blue, no red-orange, no true green, no
//    blue-purple.)
//
// 2. ONE PRIMARY. `siegel` teal is the only interactive colour — buttons,
//    links, focus rings, selected states. `gold` belongs to the seal itself and
//    to at most one "recommended" marker per page. The accents are ENERGY, not
//    interaction: chips, badges, streak flames, progress fills, confetti — a
//    candy-coloured CTA is out of system (exception: one celebration moment
//    may use `himbeer`, because a completed goal has earned it).
//
// 3. DEPTH MEANS "YOU CAN PRESS THIS". v1 said "no resting shadows" and it
//    made the site honest but inert; v2 overturns it DELIBERATELY. The new
//    rule: elevation is an affordance. Interactive things (buttons, clickable
//    cards) rest raised — a hard bottom edge plus a soft ambient shadow, like
//    a key on a keyboard — and physically depress when pressed. Reference
//    material (tables, prose, rules of grammar) stays FLAT: hairlines and
//    aligned columns, the declension table's native form. A shadow on
//    something that cannot be pressed is a lie; a flat button is a missed
//    invitation. Both are bugs now.
//
// Type note: the display face is Fraunces (optical-size axis, enough spine for
// long German compounds); the data face is a system mono stack for level codes
// (A2.1), case labels (AKK) and prices — figures are data, not prose.

/** The ground and the ink. Cool near-white, and a near-black with a faint teal cast. */
export const color = {
  paper: '#FCFCFA',
  paperSunk: '#F4F6F5', // recessed panels, table header rows
  ink: '#14201D',
  graphite: '#5A6360', // secondary text — AA on paper at body sizes
  rule: '#E2E7E5', // hairlines, table rules, card borders
  edge: '#D8DFDB', // the hard bottom edge of a resting white/paper surface
  white: '#FFFFFF',

  // Primary. Sampled from the Meister-Siegel gradient in src/components/Logo.jsx.
  siegel: '#0F766E',
  siegelLift: '#0D9488', // the gradient's far stop; hover
  siegelDeep: '#0B5A54', // press, and text-on-paper when the link must darken
  siegelWash: '#E6F2F0', // selected rows, quiet fills
  siegelEdge: '#07423D', // the bottom edge under a siegel button face

  // The seal's dot. Rule 2: the seal, and at most one marker per page.
  gold: '#FBBF24',
};

/**
 * The four German cases, as already taught by Sentence X-Ray. Rule 1 governs
 * every use. `ink` is the accessible text colour on that case's `wash`.
 */
export const kasus = {
  nominativ: { line: '#378ADD', wash: '#E6F1FB', ink: '#0C447C', abbr: 'NOM' },
  akkusativ: { line: '#D85A30', wash: '#FAECE7', ink: '#712B13', abbr: 'AKK' },
  dativ: { line: '#1D9E75', wash: '#E1F5EE', ink: '#085041', abbr: 'DAT' },
  genitiv: { line: '#7F77DD', wash: '#EEEDFE', ink: '#3C3489', abbr: 'GEN' },
};

/**
 * The candy accents — v2's energy palette. Rule 2: energy, never interaction;
 * rule 1: never where a case is named. German names on purpose: they can never
 * collide with a Tailwind palette name (the brand suite bans `amber-`, `rose-`
 * and friends as substrings in the chrome, and `bg-accent-himbeer` contains
 * none of them), and they read as brand, not as stock.
 *
 * Hue discipline: pink, peach and lime — deliberately distant from the four
 * kasus hues (blue / red-orange / green / blue-purple), from siegel teal and
 * from gold. `ink` is the accessible text colour on that accent's `wash`;
 * `edge` sits under a raised chip of that accent (rule 3).
 */
export const accent = {
  himbeer: { bright: '#EC4E88', wash: '#FDECF3', ink: '#8C1D4C', edge: '#C22B63' },
  aprikose: { bright: '#FF9E57', wash: '#FFF0E4', ink: '#8A4516', edge: '#E07B2E' },
  limette: { bright: '#7BC943', wash: '#F1FAE6', ink: '#3E6B15', edge: '#5DA52A' },
};

/**
 * The data-visualisation palette — the admin panel's chart, delta and status
 * colours (docs/admin-panel.md). Wong's colourblind-safe set, NOT plain
 * red/green: red-green is the most common colour vision deficiency, so a tile
 * whose only signal is its colour is blank for part of the audience. Colour
 * here only ever REINFORCES the arrow and the sign a delta already carries —
 * it never carries meaning alone. `error` is the one true red in the admin
 * area and is reserved for system faults, so "revenue fell" (`neg`) and "the
 * webhook broke" (`error`) never look the same. Rule 1 still holds: none of
 * these may mark a grammatical case, and none may appear on a learner-facing
 * surface — they are for operators reading numbers.
 */
export const viz = {
  pos: '#009E73', // growth / positive
  neg: '#D55E00', // decline / negative — vermillion, not red
  series1: '#0072B2', // primary data series
  series2: '#E69F00', // secondary data series
  warn: '#B7791F', // needs attention (past due, desync)
  error: '#C0362C', // system fault ONLY
};

/**
 * Font stacks. The two brand faces are self-hosted (`fontFaces` below); each
 * is followed by its metric-matched fallback, so the swap from fallback to
 * brand face does not reflow the page.
 */
export const font = {
  display: "'Fraunces', 'Fraunces Fallback', 'Fraunces Fallback Times', 'Iowan Old Style', Georgia, serif",
  body: "'Nunito Sans', 'Nunito Sans Fallback', system-ui, -apple-system, 'Segoe UI', sans-serif",
  data: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
};

// ---------------------------------------------------------------------------
// SELF-HOSTED FACES. Both front ends used to fetch these from
// fonts.googleapis.com: two extra origins (DNS + TLS each) before the first
// font byte, ~98 KB of each static page's ~144 KB, and a late swap from an
// unmatched fallback that shifted the hero (CLS 0.11–0.18 on the pricing,
// guide and grammar pages; docs/SCORECARD.md work order #9, 2026-09-27).
//
// The woff2 files in public/fonts/ are byte-for-byte what Google served for
// the old css2 URLs (Fraunces v38 variable opsz+wght, Nunito Sans v19
// variable wght, Nunito Sans italic 400), cut to the `latin` and `latin-ext`
// subsets — nothing on either site uses Cyrillic or Vietnamese. SIL OFL 1.1:
// the copyright and licence URL travel in each file's name table. A new
// version gets a new filename (the version is in it), which is what lets
// netlify.toml cache /fonts/* as immutable.
//
// Both tailwind configs add `fontFaces` to their base layer, so the @font-face
// rules ship inside each front end's own stylesheet; the SPA adds
// `fontFacesItalic` too (it always loaded the true italic, the Astro pages
// never did). `fontPreloads` are the files every page needs above the fold —
// index.html and Layout.astro preload exactly these (tests/web-performance).
//
// The fallbacks are the other half of the fix. Each names local fonts that
// share one set of metrics and scales them to the brand face, so the text
// wraps the same before and after the swap. size-adjust was MEASURED on the
// site's own headings and paragraphs (Chromium, 2026-09-27), not taken from a
// metrics table — Fraunces is variable, and a table's default instance is not
// the weight the site sets: Fraunces 600 vs Georgia Bold (via its metric twin
// Gelasio) 0.917–0.919, vs Noto Serif Bold 0.919–0.920, vs Times New Roman
// Bold (via Liberation Serif) 1.09–1.11; Nunito Sans 400 vs Arial/Roboto
// 1.01–1.02, 600–700 vs Arial Bold 0.99–1.02. The overrides are the brand
// face's own vertical metrics (Fraunces ascent 0.978 / descent 0.255, Nunito
// Sans 1.011 / 0.353, no line gap) divided by that size-adjust.
// ---------------------------------------------------------------------------

const UNICODE_LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const UNICODE_LATIN_EXT =
  'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';

const webFace = (family, file, weight, unicodeRange, fontStyle = 'normal') => ({
  '@font-face': {
    fontFamily: `'${family}'`,
    fontStyle,
    // Fraunces 500–700 and Nunito Sans 300–700 are the ranges the old css2
    // URLs declared, so a weight outside them clamps exactly as it did.
    fontWeight: weight,
    fontDisplay: 'swap',
    src: `url('/fonts/${file}.woff2') format('woff2')`,
    unicodeRange,
  },
});

const fallbackFace = (family, weight, locals, sizeAdjust, ascent, descent) => ({
  '@font-face': {
    fontFamily: `'${family}'`,
    fontWeight: weight,
    src: locals.map((name) => `local('${name}')`).join(', '),
    sizeAdjust,
    ascentOverride: ascent,
    descentOverride: descent,
    lineGapOverride: '0%',
  },
});

export const fontFaces = [
  webFace('Fraunces', 'fraunces-v38-latin', '500 700', UNICODE_LATIN),
  webFace('Fraunces', 'fraunces-v38-latin-ext', '500 700', UNICODE_LATIN_EXT),
  webFace('Nunito Sans', 'nunito-sans-v19-latin', '300 700', UNICODE_LATIN),
  webFace('Nunito Sans', 'nunito-sans-v19-latin-ext', '300 700', UNICODE_LATIN_EXT),
  // The site sets Fraunces at 500–700 only, so its fallbacks are the BOLD
  // cuts at every weight — closer to 600 than a regular, and never synthetic.
  fallbackFace(
    'Fraunces Fallback',
    '100 900',
    ['Georgia Bold', 'Georgia-Bold', 'Noto Serif Bold', 'NotoSerif-Bold'],
    '91.8%', '106.54%', '27.78%',
  ),
  fallbackFace(
    'Fraunces Fallback Times',
    '100 900',
    ['Times New Roman Bold', 'TimesNewRomanPS-BoldMT', 'Liberation Serif Bold', 'LiberationSerif-Bold', 'Tinos Bold', 'Tinos-Bold'],
    '109.5%', '89.32%', '23.29%',
  ),
  fallbackFace(
    'Nunito Sans Fallback',
    '100 500',
    ['Arial', 'ArialMT', 'Liberation Sans', 'LiberationSans', 'Arimo', 'Arimo-Regular', 'Roboto', 'Roboto-Regular'],
    '101.5%', '99.61%', '34.78%',
  ),
  fallbackFace(
    'Nunito Sans Fallback',
    '600 900',
    ['Arial Bold', 'Arial-BoldMT', 'Liberation Sans Bold', 'LiberationSans-Bold', 'Arimo Bold', 'Arimo-Bold', 'Roboto Bold', 'Roboto-Bold'],
    '100%', '101.1%', '35.3%',
  ),
];

export const fontFacesItalic = [
  webFace('Nunito Sans', 'nunito-sans-v19-italic-latin', '400', UNICODE_LATIN, 'italic'),
  webFace('Nunito Sans', 'nunito-sans-v19-italic-latin-ext', '400', UNICODE_LATIN_EXT, 'italic'),
];

/** Above-the-fold on every page: the display face and the upright body face, latin subset. */
export const fontPreloads = ['/fonts/fraunces-v38-latin.woff2', '/fonts/nunito-sans-v19-latin.woff2'];

/**
 * Named type roles, each with its mobile step-down. Roles, not a raw scale:
 * a caller picks "this is a section heading", not "this is 30px", so the
 * mobile behaviour travels with the decision instead of being re-guessed.
 * Sizes are rem strings so they compose with Tailwind's arbitrary values.
 */
export const type = {
  hero: { size: '3.5rem', mobile: '2.25rem', weight: 640, tracking: '-0.025em', leading: 1.02, family: 'display' },
  section: { size: '2.125rem', mobile: '1.5625rem', weight: 620, tracking: '-0.018em', leading: 1.12, family: 'display' },
  cardTitle: { size: '1.125rem', mobile: '1.0625rem', weight: 700, tracking: '-0.005em', leading: 1.3, family: 'body' },
  lead: { size: '1.1875rem', mobile: '1.0625rem', weight: 400, tracking: '0', leading: 1.6, family: 'body' },
  body: { size: '1rem', mobile: '0.9375rem', weight: 400, tracking: '0', leading: 1.65, family: 'body' },
  small: { size: '0.875rem', mobile: '0.875rem', weight: 400, tracking: '0', leading: 1.5, family: 'body' },
  // Uppercase + letterspacing is permitted HERE AND NOWHERE ELSE. If a heading
  // wants to shout, it is a label or it is not shouting.
  label: { size: '0.6875rem', mobile: '0.6875rem', weight: 700, tracking: '0.13em', leading: 1.2, family: 'data' },
  // Figures: prices, level codes, counts. Tabular so columns align.
  data: { size: '0.8125rem', mobile: '0.8125rem', weight: 500, tracking: '0.02em', leading: 1.4, family: 'data' },
};

/** 4px grid. Named so spacing decisions are legible in review. */
export const space = { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2.5rem', xxl: '4rem' };

export const layout = { maxWidth: '68rem', prose: '38rem', gutter: '1.25rem' };

/**
 * Radius: generous on things you press, square on things you read.
 * `clay` is v2's chunky card/button radius — a NEW name, because wiring the
 * token sm/md/lg/xl values into Tailwind would collide with its own defaults
 * and silently reshape every `rounded-lg` in the app (see the borderRadius
 * comment in either tailwind config). `pill` has no default to collide with.
 */
export const radius = { none: '0', sm: '0.375rem', md: '0.625rem', lg: '1rem', clay: '1.25rem', pill: '999px' };

/**
 * Rule 3: depth is an affordance. The raised states pair a HARD bottom edge
 * (the extrusion — reads as "this has a side, you can push it") with a SOFT
 * ambient shadow (reads as "it floats a little"). Pressing removes the edge
 * and translates the face down by the same distance — the press travel below
 * — so the button physically depresses instead of just tinting.
 *
 * Edge colours: `color.edge` under white/paper faces, `color.siegelEdge`
 * under siegel faces, `accent.*.edge` under accent chips.
 */
export const depth = {
  press: '4px', // how far a pressed surface travels down; matches the edge height
  pressSm: '2px',
};

/** Shadows. hover/overlay are v1's lift pair; raise/raiseLg are v2's resting extrusions. */
export const shadow = {
  raise: `0 4px 0 0 ${color.edge}, 0 10px 22px -12px rgba(20, 32, 29, 0.16)`,
  raiseLg: `0 6px 0 0 ${color.edge}, 0 20px 44px -18px rgba(20, 32, 29, 0.2)`,
  raiseSiegel: `0 4px 0 0 ${color.siegelEdge}`,
  raiseHimbeer: `0 4px 0 0 ${accent.himbeer.edge}`,
  raiseAprikose: `0 4px 0 0 ${accent.aprikose.edge}`,
  raiseLimette: `0 4px 0 0 ${accent.limette.edge}`,
  hover: '0 6px 20px -8px rgba(20, 32, 29, 0.18)',
  overlay: '0 16px 48px -12px rgba(20, 32, 29, 0.26)',
};

/**
 * Motion: bouncy springs, tiny durations, and ALWAYS behind
 * `prefers-reduced-motion` (both global stylesheets carry the gate — an
 * exam-stressed learner gets to turn the bounce off at the OS level and the
 * whole system respects it).
 */
export const motion = {
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // overshoots: pops, badges, cards arriving
  snap: 'cubic-bezier(0.2, 0, 0, 1)', // decisive settle: presses, toggles
  duration: { press: '90ms', pop: '260ms', enter: '420ms' },
};

/**
 * Flattened for Tailwind's `theme.extend.colors`. Both tailwind configs spread
 * this, so `bg-paper`, `text-ink`, `border-rule`, `bg-kasus-dativ-wash`,
 * `bg-accent-himbeer` and friends exist on the SPA and the Astro site without
 * either config restating a hex value.
 */
export const tailwindColors = {
  paper: color.paper,
  'paper-sunk': color.paperSunk,
  ink: color.ink,
  graphite: color.graphite,
  rule: color.rule,
  edge: color.edge,
  siegel: { DEFAULT: color.siegel, lift: color.siegelLift, deep: color.siegelDeep, wash: color.siegelWash, edge: color.siegelEdge },
  gold: color.gold,
  kasus: Object.fromEntries(
    Object.entries(kasus).map(([name, v]) => [name, { DEFAULT: v.line, wash: v.wash, ink: v.ink }]),
  ),
  accent: Object.fromEntries(
    Object.entries(accent).map(([name, v]) => [name, { DEFAULT: v.bright, wash: v.wash, ink: v.ink, edge: v.edge }]),
  ),
  // `bg-viz-pos`, `text-viz-error` … — the admin panel's data colours.
  viz: { ...viz },
};

/** Both configs spread this into theme.extend.boxShadow. */
export const tailwindBoxShadow = {
  raise: shadow.raise,
  'raise-lg': shadow.raiseLg,
  'raise-siegel': shadow.raiseSiegel,
  'raise-himbeer': shadow.raiseHimbeer,
  'raise-aprikose': shadow.raiseAprikose,
  'raise-limette': shadow.raiseLimette,
  hover: shadow.hover,
  overlay: shadow.overlay,
};

/** Both configs spread this into theme.extend.transitionTimingFunction. */
export const tailwindEasing = {
  spring: motion.spring,
  snap: motion.snap,
};

export const tailwindFontFamily = {
  display: ['Fraunces', 'Fraunces Fallback', 'Fraunces Fallback Times', 'Iowan Old Style', 'Georgia', 'serif'],
  body: ['Nunito Sans', 'Nunito Sans Fallback', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  data: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
};

// ===========================================================================
// v3 — "DIE LINIE · DEUTSCH, IN BEWEGUNG" (2026-10-04)
// docs/redesign-2026-10/art-direction.md holds the why; this holds the values.
//
// The marketing site and the commerce screens become a German transit line:
// the CEFR ladder is a line of eight stations, A1.1 the free first stop, each
// paid level a one-time ticket. The section is ADDITIVE on purpose — nothing
// above changes value, so every existing screen, the lesson player and the
// course theme keep rendering exactly as before; a surface opts in by using
// these classes. Placed at the end of the file so it never shares a hunk with
// the course theme's edits.
//
// RULE 2, AMENDED. `siegel` stays the action colour on LIGHT grounds (paper,
// white). On a `nacht` ground the action colour is `linie` with `linie.ink`
// text. Signal yellow on paper is ~1.4:1, so `linie` is NEVER text and never a
// meaningful line on a light ground — there it may only fill a shape that has
// ink text or an ink outline on it (a station dot, the ticket stub).
// RULE 1 still binds: linie is yellow — distinct from all four kasus hues —
// and is never used to mark a case.
// ===========================================================================

/** The line itself: signal yellow, as on German wayfinding signs. */
export const linie = {
  DEFAULT: '#FFD23F',
  deep: '#E0AE00', // hover/press on nacht; the line's shadow side
  edge: '#B98C00', // the hard bottom edge under a linie face (rule 3)
  wash: '#FFF6D6', // a quiet highlight behind ink text on a light ground
  ink: '#2B2100', // text on a linie face (11:1, AAA)
};

/** The night grounds: hero, the line section, the final decision. */
export const nacht = {
  DEFAULT: '#0E1513',
  raised: '#17211E', // cards and the ticket on nacht
  sunk: '#08100E', // the track bed under the line
  rule: '#2C3833', // hairlines on nacht
  text: '#F4F2EC', // body text on nacht (≥ 15:1)
  muted: '#A9B3AE', // secondary text on nacht and nacht.raised (≥ 7:1)
};

/**
 * Motion v3 — three tiers, strong curves (adopted from emilkowalski/skills
 * `emil-design-eng`): feedback answers a press, a control transition changes a
 * state, a signature moment explains something (the train advancing, the line
 * drawing). Only transform, opacity and clip-path move. Never ease-in on UI.
 * Reduced motion keeps opacity/colour and drops movement.
 */
export const motionLinie = {
  ease: {
    out: 'cubic-bezier(0.23, 1, 0.32, 1)', // enter/exit, presses
    inOut: 'cubic-bezier(0.77, 0, 0.175, 1)', // on-screen movement (the train)
    drawer: 'cubic-bezier(0.32, 0.72, 0, 1)', // the mobile menu sheet
  },
  duration: { feedback: '140ms', control: '220ms', section: '420ms', signature: '800ms' },
  stagger: '60ms',
};

/**
 * Breakpoints the redesign is checked at (360, 390, 768, 1280, 1440 px). They
 * DOCUMENT the QA matrix; Tailwind's own screens (sm 640, md 768, lg 1024,
 * xl 1280, 2xl 1536) stay unchanged so no existing layout moves.
 */
export const qaWidths = [360, 390, 768, 1280, 1440];

/**
 * The SIGN face: Archivo (Omnibus-Type, SIL OFL 1.1), variable wght 400–900 ×
 * wdth 62–100 — subset to latin/latin-ext and instanced to that axis range
 * from @fontsource-variable/archivo 5.3.0 (Google Fonts v25). The copyright and
 * OFL notice travel in each file's name table; the build recipe (fontTools
 * subset + instancer) is in docs/redesign-2026-10/art-direction.md. Signs are set in Archivo (marketing
 * pages, the station line, buttons, the commerce screens); the LIBRARY stays in
 * Fraunces/Nunito (grammar, guides, the lesson player).
 *
 * Fallbacks were MEASURED in Chromium 141 (2026-10-04) against Liberation Sans
 * (Arial's metric twin) over six of the site's own lines: Archivo 400 = 0.986×,
 * 500 = 1.001×, 600 vs Arial Bold = 0.954×, 700 = 0.985×, 800 = 1.032×; the
 * condensed display (wdth 72–80, wght 700–850) = 0.796–0.817× Arial Bold. The
 * fallback faces are split by font-stretch, so a condensed headline swaps from
 * a narrowed Arial Bold and a normal-width label from a full-width one. Archivo's
 * vertical metrics: ascent 0.878, descent 0.210, no line gap (UPM 1000).
 */
const archivoFace = (file, unicodeRange) => ({
  '@font-face': {
    fontFamily: "'Archivo'",
    fontStyle: 'normal',
    fontWeight: '400 900',
    fontStretch: '62% 100%',
    fontDisplay: 'swap',
    src: `url('/fonts/${file}.woff2') format('woff2')`,
    unicodeRange,
  },
});
const archivoFallback = (weight, stretch, locals, sizeAdjust, ascent, descent) => ({
  '@font-face': {
    fontFamily: "'Archivo Fallback'",
    fontWeight: weight,
    fontStretch: stretch,
    src: locals.map((name) => `local('${name}')`).join(', '),
    sizeAdjust,
    ascentOverride: ascent,
    descentOverride: descent,
    lineGapOverride: '0%',
  },
});
const ARIAL = ['Arial', 'ArialMT', 'Liberation Sans', 'LiberationSans', 'Arimo', 'Arimo-Regular', 'Roboto', 'Roboto-Regular'];
const ARIAL_BOLD = ['Arial Bold', 'Arial-BoldMT', 'Liberation Sans Bold', 'LiberationSans-Bold', 'Arimo Bold', 'Arimo-Bold', 'Roboto Bold', 'Roboto-Bold'];

export const signFontFaces = [
  archivoFace('archivo-v25-latin', UNICODE_LATIN),
  archivoFace('archivo-v25-latin-ext', UNICODE_LATIN_EXT),
  // Normal width: 0.986–1.001× Arial (400–500), 0.954–1.032× Arial Bold (600–900).
  archivoFallback('100 500', '88% 100%', ARIAL, '99%', '88.69%', '21.21%'),
  archivoFallback('600 900', '88% 100%', ARIAL_BOLD, '99%', '88.69%', '21.21%'),
  // Condensed display: 0.796–0.817× Arial Bold.
  archivoFallback('100 900', '62% 87%', ARIAL_BOLD, '80%', '109.75%', '26.25%'),
];

/** The sign face's above-the-fold file — preloaded only on the pages that set signs in the first screen. */
export const signFontPreloads = ['/fonts/archivo-v25-latin.woff2'];

/** Spread into both tailwind configs: `font-sign`. */
export const tailwindSignFont = {
  sign: ['Archivo', 'Archivo Fallback', 'Arial', 'Helvetica Neue', 'sans-serif'],
};

/** Spread into both tailwind configs: `bg-linie`, `text-linie-ink`, `bg-nacht-raised`, `text-nacht-muted` … */
export const tailwindLinieColors = {
  linie: { ...linie },
  nacht: { ...nacht },
};

/** Spread into both tailwind configs' boxShadow: the linie key's extrusion and the ticket's lift. */
export const tailwindLinieShadow = {
  'raise-linie': `0 4px 0 0 ${linie.edge}`,
  'raise-nacht': `0 4px 0 0 ${nacht.sunk}`,
  ticket: `0 2px 0 0 ${color.edge}, 0 30px 60px -30px rgba(14, 21, 19, 0.45)`,
};

/** Spread into both tailwind configs: `ease-out-strong`, `ease-in-out-strong`, `ease-drawer`. */
export const tailwindLinieEasing = {
  'out-strong': motionLinie.ease.out,
  'in-out-strong': motionLinie.ease.inOut,
  drawer: motionLinie.ease.drawer,
};

/** Spread into both tailwind configs' transitionDuration: `duration-feedback` … `duration-signature`. */
export const tailwindLinieDuration = { ...motionLinie.duration };
