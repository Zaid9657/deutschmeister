#!/usr/bin/env node
// Copy only the intentional package-local twins registered in shared-files.mjs.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHARED_FILES } from './shared-files.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function syncShared({ root = ROOT, curriculaOnly = false } = {}) {
  const files = curriculaOnly
    ? SHARED_FILES.filter(([source]) => source.startsWith('src/data/curricula/'))
    : SHARED_FILES;
  for (const [source, destination] of files) {
    mkdirSync(dirname(join(root, destination)), { recursive: true });
    copyFileSync(join(root, source), join(root, destination));
  }
  return files.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Synced ${syncShared()} shared file(s).`);
}
