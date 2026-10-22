#!/usr/bin/env node
// Compatibility command: sync only the curriculum twins in the shared manifest.
// Usage: node scripts/sync-curricula.mjs
import { syncShared } from './sync-shared.mjs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function syncCurricula(root) {
  return syncShared({ root, curriculaOnly: true });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Synced ${syncCurricula()} curriculum file(s).`);
}
