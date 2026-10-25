import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const ARCHIVE = path.join(ROOT, 'docs/archive');
// Hashes captured before relocation: these files record history, not current setup.
const originals = JSON.parse(readFileSync(new URL('./fixtures/legacy-archive-sha256.json', import.meta.url), 'utf8'));

test('legacy SQL and August audits live in the archive with their original bytes', () => {
  assert.deepEqual(readdirSync(ROOT).filter((file) => file.endsWith('.sql')), []);
  for (const [file, hash] of Object.entries(originals)) {
    assert.ok(!existsSync(path.join(ROOT, path.basename(file))), `${file}: root copy must be removed`);
    const bytes = readFileSync(path.join(ARCHIVE, file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, file);
  }
  assert.match(readFileSync(path.join(ARCHIVE, 'README.md'), 'utf8'), /historical|superseded/i);
  assert.match(readFileSync(path.join(ARCHIVE, 'README.md'), 'utf8'), /do not re-run/i);
});

test('incoming Markdown links to relocated records resolve at their new locations', () => {
  const moved = new Set(Object.keys(originals).map((file) => path.basename(file)));
  const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith('.md') ? [file] : [];
  });
  let links = 0;
  for (const file of [path.join(ROOT, 'CLAUDE.md'), path.join(ROOT, 'README.md'), ...walk(path.join(ROOT, 'docs')), path.join(ROOT, 'migrations/README.md')]) {
    for (const [, href] of readFileSync(file, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
      if (/^(?:https?:|#)/.test(href)) continue;
      const target = href.split('#')[0].replace(/:\d+$/, '');
      if (!moved.has(path.basename(target))) continue;
      links++;
      assert.ok(existsSync(path.resolve(path.dirname(file), target)), `${path.relative(ROOT, file)}: ${href}`);
    }
  }
  assert.ok(links >= 3, 'the archive index must link to all three audits');
});
