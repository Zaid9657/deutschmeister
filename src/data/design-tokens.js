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

/** Font stacks. Every face here is already loaded by the shell — no new requests. */
export const font = {
  display: "'Fraunces', 'Iowan Old Style', Georgia, serif",
  body: "'Nunito Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  data: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
};

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
  display: ['Fraunces', 'Iowan Old Style', 'Georgia', 'serif'],
  body: ['Nunito Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  data: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
};
