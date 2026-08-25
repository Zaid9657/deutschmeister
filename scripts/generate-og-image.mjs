// Generate public/og-image.png (1200x630) from the design tokens and the
// claims data layer — never from hardcoded pixels.
//
// Why this exists: the previous og-image predated the current identity. It
// showed a "DM" monogram in a generic sans inside a German-flag ring on navy
// with amber accents — the retired palette tests/brand.test.mjs bans in code,
// surviving in the one place no scanner looks. Its "64 Topics · 8 Levels" were
// hardcoded pixels, invisible to tests/claims.test.mjs.
//
// This script rebuilds the card from src/data/design-tokens.js (colours, the
// Meister-Siegel seal as rendered by Layout.astro and Logo.jsx) and
// src/data/marketing.js (the counts), so both stay derived. Fonts: Fraunces
// and Nunito Sans must be installed system-side (fontconfig) for librsvg —
// see docs/seo-routines/claude-seo.md for the offline recipe.
//
//   node scripts/generate-og-image.mjs [out.png]
import sharp from 'sharp';
import { color } from '../src/data/design-tokens.js';
import { GRAMMAR_TOPIC_COUNT, LEVEL_COUNT, FREE_LEVEL_LABEL } from '../src/data/marketing.js';

const out = process.argv[2] || 'public/og-image.png';
const { paper, ink, graphite, siegel, siegelLift, siegelDeep, rule } = color;
const gold = '#FBBF24'; // the seal's gold dot, as in Layout.astro / Logo.jsx

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="seal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${siegel}"/>
      <stop offset="1" stop-color="${siegelLift}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="${paper}"/>
  <!-- hairline structure, not shadows -->
  <rect x="0" y="0" width="1200" height="6" fill="${siegel}"/>
  <line x1="80" y1="500" x2="1120" y2="500" stroke="${rule}" stroke-width="2"/>

  <!-- the Meister-Siegel, as in Layout.astro -->
  <g transform="translate(80,155)">
    <circle cx="110" cy="110" r="110" fill="url(#seal)"/>
    <circle cx="110" cy="110" r="94" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="4" stroke-dasharray="5 14"/>
    <circle cx="110" cy="24" r="12" fill="${gold}"/>
    <text x="110" y="156" text-anchor="middle" font-family="Fraunces" font-weight="700" font-size="124" fill="#ffffff">M</text>
  </g>

  <g transform="translate(360,0)">
    <text x="0" y="245" font-family="Fraunces" font-weight="700" font-size="84" fill="${ink}">DeutschMeister</text>
    <text x="0" y="316" font-family="Nunito Sans" font-weight="600" font-size="40" fill="${graphite}">Learn German grammar, listening</text>
    <text x="0" y="370" font-family="Nunito Sans" font-weight="600" font-size="40" fill="${graphite}">and speaking — A1 to B2</text>
    <text x="0" y="446" font-family="Nunito Sans" font-weight="700" font-size="34" fill="${siegelDeep}">${GRAMMAR_TOPIC_COUNT} grammar topics · ${LEVEL_COUNT} levels · ${FREE_LEVEL_LABEL} free</text>
  </g>
  <text x="80" y="560" font-family="Nunito Sans" font-weight="600" font-size="30" fill="${graphite}">deutsch-meister.de</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ palette: true }).toFile(out);
const meta = await sharp(out).metadata();
console.log(`${out}: ${meta.width}x${meta.height}, ${(await import('node:fs')).statSync(out).size} bytes`);
