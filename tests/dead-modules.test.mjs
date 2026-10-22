import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);

test('retired modules and unused Astro curriculum copies stay removed', () => {
  const retired = [
    'src/components/StatsBar.jsx',
    'src/components/illustrations/index.jsx',
    'src/pages/admin/AdminPending.jsx',
    'src/pages/lesson/LessonPreviewPage.jsx',
    'astro-site/src/lib/planState.js',
    'astro-site/src/data/curricula/a11.art.js',
    'astro-site/src/data/curricula/a11.meta.js',
  ];
  for (const path of retired) assert.equal(existsSync(new URL(path, ROOT)), false, path);
});

test('the lesson chrome guard has no exception for the retired preview', () => {
  const source = readFileSync(fileURLToPath(new URL('tests/course-player.test.mjs', ROOT)), 'utf8');
  assert.doesNotMatch(source, /LessonPreviewPage/);
});
