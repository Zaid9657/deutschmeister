// Generated public marks; canonical values live only in the tokens.
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { color } from '../src/data/design-tokens.js';
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="10" fill="${color.paper}"/><path d="M5 5h38v29H27L15 43v-9H5V5Z" fill="${color.siegel}"/><path d="M13 26V14l7 8 7-8v12m0-12 8 12V14" stroke="${color.paper}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
await writeFile(new URL('../public/favicon.svg', import.meta.url), mark);

for (const size of [192, 512]) {
  await sharp(Buffer.from(mark)).resize(size, size).png().toFile(new URL(`../public/icon-${size}.png`, import.meta.url).pathname);
  await sharp(Buffer.from(mark)).resize(size, size).webp({ quality: 90 }).toFile(new URL(`../public/icon-${size}.webp`, import.meta.url).pathname);
}
