// The top-level directories the Astro build emits, derived from its own pages/
// directory rather than listed anywhere.
//
// `trailingSlash: 'always'` means every top-level page becomes
// `<name>/index.html`, so a sub-directory (grammar/, leitfaden/, vergleich/,
// pruefung/) or a bare `.astro` file (pricing, privacy, impressum,
// telc-b1-komplettvorbereitung) each maps to exactly one output directory.
// index.astro and 404.astro are the two exceptions — they emit files at the
// root and are handled separately by the build.
//
// This lives in its own module for one reason: scripts/build-site.mjs copies
// and asserts these directories, and tests/exams.test.mjs needs to check that a
// new segment is actually covered. Both now read the SAME function, so the test
// cannot pass against a list the build does not use. Before this, the equivalent
// guarantee was a `cp -r …` literal in netlify.toml's build command that the
// test string-matched — which stopped meaning anything the moment the command
// became `node scripts/build-site.mjs`.
//
// The CI workflow still hand-lists these copies in its own steps, so ci.yml
// keeps a literal check of its own; that duplication is real and the test says so.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT_PAGES = ['index.astro', '404.astro'];

export const astroRoutes = (root) =>
  readdirSync(join(root, 'astro-site', 'src', 'pages'), { withFileTypes: true })
    .filter((e) => e.isDirectory() || (e.name.endsWith('.astro') && !ROOT_PAGES.includes(e.name)))
    .map((e) => e.name.replace(/\.astro$/, ''))
    .sort();
