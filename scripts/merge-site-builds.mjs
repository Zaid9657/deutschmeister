#!/usr/bin/env node
// Merge Astro's static output into the Vite SPA output exactly once, for both
// Netlify and CI. Discovering Astro page directories prevents a new static
// route from building successfully but disappearing from the deploy package.

import { cpSync, existsSync, readdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const spaDist = join(root, 'dist');
const astroDist = join(root, 'astro-site', 'dist');
const spaIndex = join(spaDist, 'index.html');
const appShell = join(spaDist, 'app.html');

if (!existsSync(spaDist) || !existsSync(astroDist)) {
  throw new Error('Both dist/ and astro-site/dist/ must exist before merging.');
}

// Netlify reaches this script directly after the SPA build; CI carves the
// shell out in an earlier, independently useful step. Support both paths.
if (!existsSync(appShell)) {
  if (!existsSync(spaIndex)) throw new Error('SPA index.html is missing.');
  renameSync(spaIndex, appShell);
}

const copiedDirectories = [];
for (const entry of readdirSync(astroDist, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  cpSync(join(astroDist, entry.name), join(spaDist, entry.name), {
    recursive: true,
    force: true,
  });
  copiedDirectories.push(entry.name);
}

for (const file of ['index.html', '404.html', 'sitemap-0.xml']) {
  const source = join(astroDist, file);
  if (!existsSync(source)) throw new Error(`Astro build is missing ${file}.`);
  cpSync(source, join(spaDist, file), { force: true });
}

console.log(`Merged ${copiedDirectories.length} Astro directories: ${copiedDirectories.sort().join(', ')}`);
