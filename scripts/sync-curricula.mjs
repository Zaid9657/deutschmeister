#!/usr/bin/env node
// Copies src/data/curricula/*.js → astro-site/src/data/curricula/*.js.
//
// The curriculum modules are one of the pairs registered in
// scripts/check-duplicates.mjs (see CONTRACT.md). While the SPA-side
// src/data/curricula/a11.js is still being authored, the two trees will
// drift on every edit — run this script after each change to the SPA side,
// and again once the author is done, or `npm run check:duplicates` (and CI)
// will fail with a DRIFT error.
//
// Usage: node scripts/sync-curricula.mjs
import { readdirSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const srcDir = join(root, 'src/data/curricula');
const destDir = join(root, 'astro-site/src/data/curricula');

mkdirSync(destDir, { recursive: true });

const files = readdirSync(srcDir).filter((f) => f.endsWith('.js'));
for (const f of files) {
  copyFileSync(join(srcDir, f), join(destDir, f));
  console.log(`synced ${f}`);
}
console.log(`Synced ${files.length} file(s) from src/data/curricula/ to astro-site/src/data/curricula/.`);
