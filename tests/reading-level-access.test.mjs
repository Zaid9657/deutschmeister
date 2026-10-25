import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const row = { id: 'paid-lesson', level: 'b2.1', content_de: 'Paid lesson text' };

function readingService(ignoreFilters = false) {
  const filters = [];
  const query = {
    select() { return this; },
    eq(column, value) { filters.push([column, value]); return this; },
    async single() {
      return { data: ignoreFilters || filters.every(([column, value]) => row[column] === value) ? row : null, error: null };
    },
  };
  const source = read('../src/services/readingService.js')
    .replace(/^import[^\n]+\n/gm, '').replace(/export async function /g, 'async function ');
  return { filters, get: vm.runInNewContext(source + '\ngetReadingLessonById;', {
    supabase: { from: () => query }, console,
  }) };
}

test('a free reading URL cannot fetch a paid lesson by its ID', async () => {
  const { get, filters } = readingService();
  assert.equal(await get('paid-lesson', 'a1.1'), null);
  assert.deepEqual(filters, [['id', 'paid-lesson'], ['level', 'a1.1']]);
});

test('reading lookups require a route level and normalize it for the database', async () => {
  const { get } = readingService();
  assert.equal(await get('paid-lesson'), null);
  const lesson = await get('paid-lesson', 'B2.1');
  assert.equal(lesson.level, 'b2.1');
  assert.equal(lesson.contentDe, row.content_de);
});

test('a mismatched reading row is rejected even if a backend returns it', async () => {
  const { get } = readingService(true);
  assert.equal(await get('paid-lesson', 'a1.1'), null);
});

test('the reading page binds data to the route and checks the fetched lesson level', () => {
  const source = read('../src/pages/ReadingLessonPage.jsx');
  assert.match(source, /getReadingLessonById\(lessonId, level\)/);
  assert.match(source, /result\?\.key === routeKey \? result\.lesson : null/);
  assert.match(source, /if \(!lesson \|\| lesson\.level !== level\)/);
  assert.match(source, /<LevelSubscriptionGuard level=\{lesson\.level\}>/);
});
