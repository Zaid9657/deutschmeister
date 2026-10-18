// Guard suite for the course pages' ticket, "der Fahrschein" (scroll-craft build 2,
// docs/scrollcraft/builds/course-ticket/BRIEF.md), read from the template source:
//
//   1. Only a level a visitor can start or buy carries a ticket; Im Bau levels sell nothing.
//   2. Every stamp on the ticket has a part of the page to stamp it: a matching id (the
//      ticket's link target) and data-stamp (what the script watches).
//   3. The contents column beside the ticket (704px at 1280px) still holds the syllabus table
//      without a sideways scroll.
//   4. The bottom bar never shows beside the course return bar.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../astro-site/src/pages/courses/[level].astro', import.meta.url), 'utf8');

test('only a level with a door rides: Im Bau levels carry no ticket', () => {
  assert.match(page, /const rides = !course\?\.comingSoon;/);
  assert.match(page, /\{rides && \(\s*<!-- The Fahrschein/);
  assert.match(page, /data-fahrschein-root=\{rides \? '' : undefined\}/);
});

test('every stamp has the part of the page it stamps', () => {
  const ids = [...page.matchAll(/\{ id: '([a-z]+)', de: '/g)].map((m) => m[1]);
  assert.ok(ids.length >= 6, `the stamps list is read (${ids.length})`);
  for (const id of ids) {
    assert.match(page, new RegExp(`id="stamp-${id}"[^>]*data-stamp="${id}"`), `stamp ${id} has no target`);
  }
});

test('the syllabus table fits the column beside the ticket', () => {
  const minW = Number(page.match(/<table class="[^"]*min-w-\[(\d+)px\]/)[1]);
  assert.match(page, /xl:grid-cols-\[minmax\(0,1fr\)_15rem\] xl:gap-10/, 'the column math below assumes this grid');
  // max-w-5xl (1024) - px-5 (2 x 20) - the ticket (240) - the gap (40) = 704
  assert.ok(minW <= 704, `table min-width ${minW}px is wider than the 704px column`);
});

test('the bottom bar steps aside for the course return bar', () => {
  assert.match(page, /!document\.querySelector\('\[data-course-return-bar\]'\)/);
});
