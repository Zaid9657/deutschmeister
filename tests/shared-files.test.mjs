import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SHARED_FILES } from '../scripts/shared-files.mjs';
import { syncShared } from '../scripts/sync-shared.mjs';
import { syncCurricula } from '../scripts/sync-curricula.mjs';
import { checkSharedFiles } from '../scripts/check-duplicates.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CURRICULA = SHARED_FILES.filter(([source]) => source.startsWith('src/data/curricula/'));

function fixture(t) {
  mkdirSync(join(ROOT, '.cache'), { recursive: true });
  const root = mkdtempSync(join(ROOT, '.cache/shared-files-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [source] of SHARED_FILES) {
    mkdirSync(dirname(join(root, source)), { recursive: true });
    writeFileSync(join(root, source), `// ${source}\n`);
  }
  // An added SPA module is not automatically an intentional Astro copy.
  for (const name of ['a11.art.js', 'a11.meta.js', 'future.js']) {
    writeFileSync(join(root, 'src/data/curricula', name), '// SPA only\n');
  }
  return root;
}

test('shared sync writes only manifest destinations and preserves bytes', (t) => {
  const root = fixture(t);
  const [source] = SHARED_FILES[0];
  writeFileSync(join(root, source), Buffer.from([0xef, 0xbb, 0xbf, 0x2f, 0x2f, 0x0d, 0x0a]));
  assert.equal(syncShared({ root }), SHARED_FILES.length);
  for (const [from, to] of SHARED_FILES) {
    assert.deepEqual(readFileSync(join(root, to)), readFileSync(join(root, from)), to);
  }
  const generated = ['astro-site', 'netlify'].flatMap((dir) =>
    readdirSync(join(root, dir), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name).slice(root.length + 1)));
  assert.deepEqual(generated.sort(), SHARED_FILES.map(([, to]) => to).sort());
});

test('curriculum compatibility sync excludes unused and new SPA-only files', (t) => {
  const root = fixture(t);
  assert.equal(syncCurricula(root), CURRICULA.length);
  assert.deepEqual(readdirSync(join(root, 'astro-site/src/data/curricula')).sort(),
    CURRICULA.map(([, destination]) => destination.split('/').at(-1)).sort());
  assert.equal(existsSync(join(root, 'netlify')), false);
});

test('duplicate checker consumes the same manifest and detects byte drift', (t) => {
  const root = fixture(t);
  syncShared({ root });
  assert.equal(checkSharedFiles(root).length, SHARED_FILES.length);
  assert.ok(checkSharedFiles(root).every(({ identical }) => identical));
  for (const [source, destination] of SHARED_FILES) {
    writeFileSync(join(root, source), Buffer.from([0xff]));
    writeFileSync(join(root, destination), Buffer.from([0xfe]));
  }
  const results = checkSharedFiles(root);
  assert.deepEqual(results.map(({ source, destination }) => [source, destination]), SHARED_FILES);
  assert.ok(results.every(({ identical }) => !identical));
});
