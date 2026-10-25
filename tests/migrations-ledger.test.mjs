import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIRECTORY = path.join(ROOT, 'migrations');
const ledger = readFileSync(path.join(DIRECTORY, 'README.md'), 'utf8');
const rows = [...ledger.matchAll(/^\| `([^`]+\.(?:sql|md))`[^|]*\|([^|]*)\|([^|]*)\|$/gm)];

test('the hand-applied ledger does not prescribe replaying unknown production history', () => {
  assert.match(ledger, /ledger is not a replay order/);
  assert.match(ledger, /status unverified” does not mean pending/);
  assert.doesNotMatch(ledger, /Apply each file[\s\S]*?in filename order/);
});

test('every migration SQL file has exactly one ledger row, with no nonexistent files', () => {
  const actual = readdirSync(DIRECTORY).filter((file) => file.endsWith('.sql')).sort();
  const listed = rows.map((row) => row[1]).filter((file) => file.endsWith('.sql')).sort();
  assert.deepEqual(listed, actual);
  for (const [, file, description, status] of rows) {
    assert.ok(existsSync(path.join(DIRECTORY, file)), `${file}: ledger target must exist`);
    assert.ok(description.trim(), `${file}: explain the change`);
    assert.ok(status.trim(), `${file}: record application status`);
  }
});

test('retroactively catalogued migrations keep application status explicit and unverified', () => {
  for (const file of [
    '2026-09-04-a1-grammar-fixes.sql',
    '2026-09-05-a1-1-new-topics.sql',
    '2026-09-05-sd1-sprechen-missions.sql',
    '2026-09-12-lesson-engine.sql',
    '2026-09-13-a1-1-course-words.sql',
    '2026-09-13-course-reminder.sql',
    '2026-09-19-course-funnel.sql',
  ]) {
    const row = rows.find((entry) => entry[1] === file);
    assert.ok(row, `${file}: missing ledger row`);
    assert.match(row[3], /application status unverified/i, file);
  }
});
