// Course pages are built at /courses/<level with a dash>/ (levelToSlug), yet
// everyone writes a level with its dot. On 2026-11-01 the Telegram welcome post
// linked /courses/a1.1/ and every subscriber who tapped it got a 404. Each
// dotted spelling must 301 to the page that exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ALL_LEVELS } from '../src/data/pricing.js';
import { levelToSlug } from '../src/data/courseContents.js';

const toml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');

test('every dotted /courses/<level> URL redirects to the built dashed page', () => {
  for (const level of ALL_LEVELS) {
    const re = new RegExp(`from = "/courses/${level.replace('.', '\\.')}"\\s*\\n\\s*to = "/courses/${levelToSlug(level)}/"\\s*\\n\\s*status = 301`);
    assert.match(toml, re, `no 301 from /courses/${level} to /courses/${levelToSlug(level)}/`);
  }
});
