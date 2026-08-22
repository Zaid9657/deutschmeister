// The comparison data is intentionally duplicated between the SPA and the
// Astro site (a cross-package import would be fragile with two separate
// node_modules trees). This check fails CI when the copies drift.
import { readFileSync } from 'node:fs';

const PAIRS = [
  ['src/data/competitorComparisons.js', 'astro-site/src/data/competitorComparisons.js'],
  // What the checkout charges, and what the copy claims. Both sides render
  // prices and limits; a drift here puts two different numbers in front of the
  // same buyer. See the header of src/data/marketing.js.
  ['src/data/pricing.js', 'astro-site/src/data/pricing.js'],
  ['src/data/marketing.js', 'astro-site/src/data/marketing.js'],
  // The design system. Both tailwind configs import this, so a drift here puts
  // two different palettes on the two halves of the same site.
  ['src/data/design-tokens.js', 'astro-site/src/data/design-tokens.js'],
];

let failed = false;
for (const [a, b] of PAIRS) {
  const contentA = readFileSync(a, 'utf8');
  const contentB = readFileSync(b, 'utf8');
  if (contentA !== contentB) {
    console.error(`DRIFT: ${a} and ${b} are no longer identical — sync them.`);
    failed = true;
  } else {
    console.log(`OK: ${a} === ${b}`);
  }
}

process.exit(failed ? 1 : 0);
