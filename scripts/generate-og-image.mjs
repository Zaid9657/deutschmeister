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
// Deriving the pixels was not enough: the card was generated at 64 topics and
// still said so at 84 (until 2026-10-25), because nothing re-ran the script.
// So the claim line it draws is also written into the PNG as a tEXt chunk, and
// tests/claims.test.mjs holds that stamp to marketing.js the way
// tests/llms.test.mjs holds the catalogue: a count change without a
// regeneration fails `npm test`. (Rasterising in the test would need the brand
// fonts installed; reading the stamp needs nothing.)
//
//   node scripts/generate-og-image.mjs [out.png]
import { writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { color } from '../src/data/design-tokens.js';
import { GRAMMAR_TOPIC_COUNT, LEVEL_COUNT, FREE_LEVEL_LABEL } from '../src/data/marketing.js';

/** The one claim line the card draws, and the stamp it carries. */
export const OG_CLAIM = `${GRAMMAR_TOPIC_COUNT} grammar topics · ${LEVEL_COUNT} levels · ${FREE_LEVEL_LABEL} free`;
/** The tEXt keyword of that stamp (a standard PNG keyword). */
export const OG_CLAIM_KEYWORD = 'Description';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

/** Every tEXt chunk of a PNG, as { keyword: text } (Latin-1, per the PNG spec). */
export function pngTextChunks(png) {
  const out = {};
  for (let at = 8; at + 8 <= png.length; ) {
    const length = png.readUInt32BE(at);
    const type = png.toString('latin1', at + 4, at + 8);
    if (type === 'tEXt') {
      const data = png.subarray(at + 8, at + 8 + length);
      const nul = data.indexOf(0);
      out[data.toString('latin1', 0, nul)] = data.toString('latin1', nul + 1);
    }
    if (type === 'IEND') break;
    at += 12 + length;
  }
  return out;
}

/** The PNG with one tEXt chunk added before IEND. */
export function withTextChunk(png, keyword, text) {
  const data = Buffer.concat([Buffer.from(keyword, 'latin1'), Buffer.from([0]), Buffer.from(text, 'latin1')]);
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write('tEXt', 4, 'latin1');
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length);
  const iend = png.length - 12; // IEND is always the last, empty chunk
  if (png.toString('latin1', iend + 4, iend + 8) !== 'IEND') throw new Error('not a complete PNG');
  return Buffer.concat([png.subarray(0, iend), chunk, png.subarray(iend)]);
}

function renderSvg() {
  const { paper, ink, graphite, siegel, siegelLift, siegelDeep, rule } = color;
  const gold = '#FBBF24'; // the seal's gold dot, as in Layout.astro / Logo.jsx
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
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
    <text x="0" y="446" font-family="Nunito Sans" font-weight="700" font-size="34" fill="${siegelDeep}">${OG_CLAIM}</text>
  </g>
  <text x="80" y="560" font-family="Nunito Sans" font-weight="600" font-size="30" fill="${graphite}">deutsch-meister.de</text>
</svg>`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { default: sharp } = await import('sharp');
  const out = process.argv[2] || 'public/og-image.png';
  const png = await sharp(Buffer.from(renderSvg())).png({ palette: true }).toBuffer();
  writeFileSync(out, withTextChunk(png, OG_CLAIM_KEYWORD, OG_CLAIM));
  const meta = await sharp(out).metadata();
  console.log(`${out}: ${meta.width}x${meta.height}, ${statSync(out).size} bytes, stamped "${OG_CLAIM}"`);
}
