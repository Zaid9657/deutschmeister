// The support agent must know every public area the site has.
//
// Why this exists (2026-10-06): the first real in-app tickets arrived on
// 2026-10-04. One asked for English transcripts on the podcasts, and the queued
// AI draft told the customer that "a podcast feature is not currently available
// on DeutschMeister". /podcasts/ is live. The model had followed its rules: the
// catalogue it is given (FACTS.library) named levels, exams, guides and grammar,
// but no practice area at all, and prompt rule 8 tells it to call anything
// outside FACTS.library "not available yet".
//
// The class is "an area the site serves is missing from the agent's facts", so
// the rule is stated over the registry, not over a list: every route in
// src/data/seoRoutes.js (the prerendered public SPA routes) must be reachable
// through the catalogue, either as a practice area or as a link, and each area
// carries its registry title verbatim (synced copy, same doctrine as GUIDES).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SEO_ROUTES } from '../src/data/seoRoutes.js';
import * as catalog from '../netlify/functions/_shared/supportCatalog.mjs';
import {
  buildFacts, buildPrompt, isAllowedUrl, libraryHas, libraryNames, SYSTEM_PROMPT,
} from '../netlify/functions/_shared/supportAgentLib.mjs';

const T0 = new Date('2026-10-06T07:00:00Z');
const TICKET = { reference: 'DM-TEST0001', subject: 'Podcast', category: 'other', created_at: '2026-10-04T22:29:27Z' };
const canonical = (route) => `${catalog.SITE}${route}/`;

test('every public route the site prerenders is reachable through the support catalogue', () => {
  assert.ok(Array.isArray(catalog.PRACTICE_AREAS), 'supportCatalog.mjs exports PRACTICE_AREAS');
  const reachable = new Set([
    ...catalog.PRACTICE_AREAS.map((a) => catalog.areaUrl(a.route)),
    ...Object.values(catalog.SITE_LINKS),
  ]);
  for (const route of Object.keys(SEO_ROUTES)) {
    assert.ok(reachable.has(canonical(route)), `${route}/ is a public page the agent's facts never mention`);
  }
});

test('each practice area is a registry route and carries its registry title verbatim', () => {
  assert.ok(catalog.PRACTICE_AREAS.length > 0);
  const seen = new Set();
  for (const a of catalog.PRACTICE_AREAS) {
    assert.ok(SEO_ROUTES[a.route], `${a.route} is not in src/data/seoRoutes.js`);
    assert.equal(a.title, SEO_ROUTES[a.route].title, `PRACTICE_AREAS ${a.route} title drifted from seoRoutes.js`);
    assert.equal(catalog.areaUrl(a.route), canonical(a.route), 'case-2 route: canonical trailing-slash form');
    assert.ok(!seen.has(a.route), `${a.route} listed twice`);
    seen.add(a.route);
  }
  assert.ok(seen.has('/podcasts'), 'the area the 2026-10-04 draft denied');
});

test('FACTS.library.areas names every area with a link the validator lets through', () => {
  const facts = buildFacts({ ticket: TICKET, now: T0 });
  assert.deepEqual(
    facts.library.areas,
    catalog.PRACTICE_AREAS.map((a) => ({ name: a.title, url: catalog.areaUrl(a.route) })),
  );
  for (const { url } of facts.library.areas) assert.equal(isAllowedUrl(url), true, url);
  for (const u of Object.values(facts.links)) assert.equal(isAllowedUrl(u), true, u);
  const { user } = buildPrompt({ facts, ticket: TICKET, thread: [] });
  assert.ok(user.includes(`${catalog.SITE}/podcasts/`), 'the model sees the podcast area');
});

test('the prompt says a listed area exists and only the missing part of it is unavailable', () => {
  assert.ok(SYSTEM_PROMPT.includes('FACTS.library.areas'), 'the prompt points at the areas');
  assert.match(SYSTEM_PROMPT, /never say (?:that )?it is not available/);
  assert.match(SYSTEM_PROMPT, /that part is not available yet/);
});

test('something missing INSIDE an area is still filed as a content request', () => {
  // The area names must not join libraryNames(): its substring match would then
  // treat "podcast-with-english-transcript" as already in the library and the
  // owner would never hear that transcripts are wanted.
  const names = libraryNames([]);
  assert.equal(libraryHas('podcast-with-english-transcript', names), false);
  assert.equal(libraryHas('reading-texts-with-audio', names), false);
});
