// DeutschMeister design tokens — the single source for colour, type and spacing.
//
// DUPLICATED between the SPA and the Astro site (byte-identical, enforced by
// scripts/check-duplicates.mjs), for the same reason as pricing.js and
// marketing.js: two packages, two node_modules trees, no safe cross-import.
// Both tailwind configs import this file, so a token added here reaches every
// surface on both sides.
//
// WHERE THIS CAME FROM. Before this file the site ran four unrelated colour
// stories at once: the teal/gold Meister-Siegel in the chrome, eight per-CEFR
// palettes that no chrome surface actually used, a blue dark-theme pricing page
// that was the only dark page on the site, and the retired amber-to-rose "D"
// brand still sitting on the primary CTAs, in every email template and in the
// cookie banner. The identity below is not a fifth story — it is built from
// what the product already owns.
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
//    analyser, and learns it twice.
//
// 2. ONE PRIMARY. `siegel` teal is the only interactive colour — buttons,
//    links, focus rings, selected states. `gold` belongs to the seal itself and
//    to at most one "recommended" marker per page. A gold CTA is out of system.
//
// 3. STRUCTURE COMES FROM RULES, NOT SHADOWS. German grammar's native artifact
//    is the declension table: hairlines and aligned columns. Use `rule` borders
//    and alignment to build structure. Shadows belong only on things that
//    actually lift — hover, overlays — never at rest.
//
// Type note: the display face is Fraunces, not the Cormorant Garamond this site
// used to set headlines in. Both were already being loaded; Cormorant is the
// default "elegant serif" that lands on every project, while Fraunces has an
// optical-size axis and enough spine to carry long German compounds at display
// sizes. The data face is a system mono stack, used for level codes (A2.1),
// case labels (AKK) and prices — figures are data, not prose, and marking them
// as such is information, not decoration.

/** The ground and the ink. Cool near-white, and a near-black with a faint teal cast. */
export const color = {
  paper: '#FCFCFA',
  paperSunk: '#F4F6F5', // recessed panels, table header rows
  ink: '#14201D',
  graphite: '#5A6360', // secondary text — AA on paper at body sizes
  rule: '#E2E7E5', // hairlines, table rules, card borders
  white: '#FFFFFF',

  // Primary. Sampled from the Meister-Siegel gradient in src/components/Logo.jsx.
  siegel: '#0F766E',
  siegelLift: '#0D9488', // the gradient's far stop; hover
  siegelDeep: '#0B5A54', // press, and text-on-paper when the link must darken
  siegelWash: '#E6F2F0', // selected rows, quiet fills

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
  hero: { size: '3.25rem', mobile: '2.125rem', weight: 600, tracking: '-0.022em', leading: 1.05, family: 'display' },
  section: { size: '2rem', mobile: '1.5rem', weight: 600, tracking: '-0.015em', leading: 1.15, family: 'display' },
  cardTitle: { size: '1.125rem', mobile: '1.0625rem', weight: 600, tracking: '-0.005em', leading: 1.3, family: 'body' },
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

/** Radius: generous on things you click, square on things you read. */
export const radius = { none: '0', sm: '0.375rem', md: '0.625rem', lg: '1rem', pill: '999px' };

/** Rule 3: shadows are for lift, so there is no resting shadow in this list. */
export const shadow = {
  hover: '0 6px 20px -8px rgba(20, 32, 29, 0.18)',
  overlay: '0 16px 48px -12px rgba(20, 32, 29, 0.26)',
};

/**
 * Flattened for Tailwind's `theme.extend.colors`. Both tailwind configs spread
 * this, so `bg-paper`, `text-ink`, `border-rule`, `bg-kasus-dativ-wash` and
 * friends exist on the SPA and the Astro site without either config restating a
 * hex value.
 */
export const tailwindColors = {
  paper: color.paper,
  'paper-sunk': color.paperSunk,
  ink: color.ink,
  graphite: color.graphite,
  rule: color.rule,
  siegel: { DEFAULT: color.siegel, lift: color.siegelLift, deep: color.siegelDeep, wash: color.siegelWash },
  gold: color.gold,
  kasus: Object.fromEntries(
    Object.entries(kasus).map(([name, v]) => [name, { DEFAULT: v.line, wash: v.wash, ink: v.ink }]),
  ),
};

export const tailwindFontFamily = {
  display: ['Fraunces', 'Iowan Old Style', 'Georgia', 'serif'],
  body: ['Nunito Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
  data: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
};
