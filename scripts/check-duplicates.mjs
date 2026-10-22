// The comparison data is intentionally duplicated between the SPA and the
// Astro site (a cross-package import would be fragile with two separate
// node_modules trees). This check fails CI when the copies drift.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHARED_FILES } from './shared-files.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function checkSharedFiles(root = ROOT) {
  return SHARED_FILES.map(([source, destination]) => ({
    source,
    destination,
    identical: readFileSync(join(root, source)).equals(readFileSync(join(root, destination))),
  }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const results = checkSharedFiles();
  for (const { source, destination, identical } of results) {
    if (identical) console.log(`OK: ${source} === ${destination}`);
    else console.error(`DRIFT: ${source} and ${destination} are no longer identical — sync them.`);
  }
  process.exitCode = results.some(({ identical }) => !identical) ? 1 : 0;
}
