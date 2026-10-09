// The /faq/ page answers the podcast question a real customer asked.
//
// Why this exists (2026-10-07): one of the first two in-app tickets (2026-10-04)
// asked for English transcripts on the podcasts. The queued AI draft told the
// customer DeutschMeister had no podcast feature; the owner stopped it and
// answered by hand two days later. The production agent learned that the area
// exists in #190 (tests/support-areas.test.mjs). This file covers the other
// verified source: src/data/faqContent.js is what the /faq/ page renders and one
// of the four files the Gmail support desk may draft from (PROTOCOL v4.5), and it
// had no podcast answer at all.
//
// Measured 2026-10-07 (read-only SQL): 14 podcast episodes are published, and
// transcript_de and transcript_en are empty on all 14. So the answer says the
// podcasts exist and that they have no transcripts. It carries no episode count
// and no level range: the site-wide "24 episodes, A1 to B2" against 14 published
// (A1.1-B1.1) is an open owner decision, and a count retyped here would drift.
//
// The transcript rule is stated over every /faq/ answer, not only the new one:
// the claim "podcasts come with transcripts" has been removed from three surfaces
// since 2026-08-16 (tests/claims.test.mjs, scripts/check-built-html.mjs).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { FAQ_CATEGORIES, faqPageJsonLd } from '../src/data/faqContent.js';
import { SEO_ROUTES } from '../src/data/seoRoutes.js';

const ITEMS = FAQ_CATEGORIES.flatMap((c) => c.items);
const PODCAST = /podcast/i;
const TRANSCRIPT = /transcript|transkript/i;
// A sentence that mentions a transcript must say there is none.
const NEGATION = /\b(no|not|none|neither|nor|without|nicht|kein\w*|ohne)\b/i;

const sentences = (text) => String(text).split(/(?<=[.!?])\s+/).filter(Boolean);

test('the FAQ has one podcast answer, and it points to the prerendered /podcasts/ page', () => {
  const podcastItems = ITEMS.filter((i) => PODCAST.test(i.q));
  assert.equal(podcastItems.length, 1, `expected exactly one /faq/ question about podcasts, found ${podcastItems.length}`);
  const [item] = podcastItems;

  // The page the answer names must be a public route the site serves.
  assert.ok(SEO_ROUTES['/podcasts'], "SEO_ROUTES no longer has '/podcasts': update the FAQ answer with the route");
  // Prerendered SPA routes canonicalise to the slash form (CLAUDE.md, trailing slashes case 2).
  assert.match(item.a, /deutsch-meister\.de\/podcasts\/(?=[\s).,]|$)/, 'the answer names deutsch-meister.de/podcasts/ with its trailing slash');
  assert.match(item.a, /^Yes\b/, 'the answer opens by saying the podcasts exist (the AI draft denied them)');
});

test('the podcast answer says the episodes have no transcripts', () => {
  const [item] = ITEMS.filter((i) => PODCAST.test(i.q));
  const about = sentences(item.a).filter((s) => TRANSCRIPT.test(s));
  assert.ok(about.length >= 1, 'the customer asked about transcripts: the answer must address them');
  for (const s of about) assert.match(s, NEGATION, `"${s}" mentions transcripts without saying there are none`);
});

test('no /faq/ answer claims a podcast transcript', () => {
  for (const { q, a } of ITEMS) {
    for (const s of sentences(a)) {
      if (TRANSCRIPT.test(s)) assert.match(s, NEGATION, `${q}: "${s}" mentions transcripts without negating them`);
    }
  }
});

test('no /faq/ answer carries a phrase the built-HTML check bans', () => {
  // Read the real list from scripts/check-built-html.mjs (comments stripped), so a
  // banned shape fails here before it fails the build.
  const src = readFileSync(new URL('../scripts/check-built-html.mjs', import.meta.url), 'utf8');
  const block = src.match(/const BANNED_LITERALS = \[([\s\S]*?)\n\];/);
  assert.ok(block, 'BANNED_LITERALS not found in scripts/check-built-html.mjs');
  const code = block[1].split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  const banned = [...code.matchAll(/'([^']+)'/g)].map((m) => m[1].toLowerCase());
  assert.ok(banned.includes('with transcript'), 'the banned list was read (it bans "with transcript")');
  for (const { q, a } of ITEMS) {
    for (const literal of banned) assert.ok(!a.toLowerCase().includes(literal), `${q}: contains the banned literal "${literal}"`);
  }
});

test('the podcast answer quotes no episode count or level', () => {
  const [item] = ITEMS.filter((i) => PODCAST.test(i.q));
  assert.doesNotMatch(item.a, /\d/, 'no digits: the episode count and level range are an open owner decision (24 claimed, 14 published)');
});

test('the FAQPage JSON-LD carries the podcast question', () => {
  const names = faqPageJsonLd().mainEntity.map((e) => e.name);
  assert.ok(names.some((n) => PODCAST.test(n)), 'faqPageJsonLd() lists the podcast question');
});
