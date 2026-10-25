// The grammar topic map exists in two places: src/data/grammarTopics.js (the
// SPA's level pages, dashboard "next topic", and the links into the Astro
// lessons) and the database (rendered by Astro; snapshotted in
// grammar-content-cache.json for CI). They drifted silently: on 2026-09-03
// seven SPA slugs no longer existed in the DB, so the level page linked to
// 404s, and the A1.1 reorder had to be applied in both. This pins slug AND
// order per level against the committed cache.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { grammarTopics } from '../src/data/grammarTopics.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = JSON.parse(readFileSync(join(ROOT, 'grammar-content-cache.json'), 'utf8'));

test('the SPA topic map matches the database snapshot in slug and order, every level', () => {
  const failures = [];
  for (const level of Object.keys(grammarTopics)) {
    const code = grammarTopics[level].map((t) => t.slug);
    const db = cache.topics
      .filter((t) => String(t.sub_level).toLowerCase() === level)
      .sort((a, b) => a.topic_order - b.topic_order)
      .map((t) => t.slug);
    if (code.join(',') !== db.join(',')) failures.push(`${level}\n  code:  ${code.join(', ')}\n  cache: ${db.join(', ')}`);
    const orders = grammarTopics[level].map((t) => t.order);
    assert.deepEqual(orders, orders.map((_, i) => i + 1), `${level}: order numbers must be 1..n in array order`);
  }
  assert.deepEqual(failures, [], `topic map drifted from the database:\n${failures.join('\n')}`);
});

// C-193: loadUserGrammarProgress keys a progress row `${level}-gt${topic_order}`
// (src/services/grammarService.js). The A1.1 ids kept their pre-reorder numbers
// after 2026-09-03, so a passed Nouns & Gender (order 1) ticked Alphabet
// (id gt1) on the dashboard path. `order` is pinned to the DB above, so the id
// rule closes the class for every level.
test('every topic id is `${level}-gt${order}`, the key a progress row is filed under', () => {
  const failures = [];
  for (const [level, topics] of Object.entries(grammarTopics)) {
    for (const t of topics) if (t.id !== `${level}-gt${t.order}`) failures.push(`${t.id} is ${level} topic ${t.order} (${t.slug})`);
  }
  assert.deepEqual(failures, [], failures.join('\n'));
});

test('a progress row for a DB topic lands on the static topic with the same slug', () => {
  const byId = new Map(Object.values(grammarTopics).flat().map((t) => [t.id, t]));
  let checked = 0;
  for (const row of cache.topics) {
    const level = String(row.sub_level).toLowerCase();
    if (!grammarTopics[level]) continue;
    const key = `${level}-gt${row.topic_order}`; // grammarService.loadUserGrammarProgress
    assert.equal(byId.get(key)?.slug, row.slug, `${key}: progress for ${row.slug} would tick ${byId.get(key)?.slug}`);
    checked += 1;
  }
  assert.ok(checked >= 80, `${checked} topics checked`);
  assert.match(readFileSync(join(ROOT, 'src/services/grammarService.js'), 'utf8'), /const legacyId = `\$\{appLevel\}-gt\$\{topic_order\}`;/);
});

test('A1.1 opens with a payoff, not the alphabet', () => {
  // Measured 2026-09-03: 35 of 69 one-and-done learners quit on the alphabet
  // lesson, which was lesson 1. Lesson 1 is now der/die/das.
  assert.equal(grammarTopics['a1.1'][0].slug, 'nouns-gender');
  assert.notEqual(grammarTopics['a1.1'][0].slug, 'alphabet-pronunciation');
});
