import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'astro-site/src/pages/grammar/[level]/[slug].astro'), 'utf8');

test('every grammar topic starts with an honest, data-derived summary', () => {
  assert.match(source, /const quickSummary = topic\?\.description_en/);
  assert.match(source, /id="summary"/);
  assert.match(source, /Lesson at a glance/);
  assert.match(source, /rules\.length/);
  assert.match(source, /examples\.length/);
  assert.match(source, /exercises\.length/);
});

test('the topic template builds a conditional table of contents with real anchors', () => {
  for (const id of ['summary', 'introduction', 'rules', 'examples', 'practice', 'questions']) {
    assert.match(source, new RegExp(`href: '#${id}'`));
    assert.match(source, new RegExp(`id="${id}"`));
  }
  assert.match(source, /aria-labelledby="contents-h"/);
});

test('practice is available early and examples connect directly to Sentence X-Ray', () => {
  assert.match(source, /href="#practice"[^>]*>Jump to practice</);
  assert.match(source, /const xrayHref/);
  assert.match(source, /\/analyze\/\?s=\$\{encodeURIComponent\(ex\.sentence_de\)\}/);
  assert.match(source, /Examine this sentence in Sentence X-Ray/);
});
