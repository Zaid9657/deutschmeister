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
//
// Knowing that an area exists is not knowing what is inside it (review of
// c3714ff1): listening has a transcript with English lines and reading has a
// "Show translation" toggle, and FACTS describes neither. So a question about
// something inside an area escalates to a person (rule 1), the model never says
// whether it exists, and validateReply blocks a reply that names an area and
// says something there is "not available" (code area-denied).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SEO_ROUTES } from '../src/data/seoRoutes.js';
import * as catalog from '../netlify/functions/_shared/supportCatalog.mjs';
import {
  buildFacts, buildPrompt, isAllowedUrl, libraryHas, libraryNames, SYSTEM_PROMPT,
  validateReply, composeReply, areaNamedIn,
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

// The prompt lines that speak about the areas (they all name FACTS.library.areas).
const areaLines = () => SYSTEM_PROMPT.split('\n').filter((l) => l.includes('FACTS.library.areas'));

test('the prompt: a listed area exists; anything inside it goes to a person, never "not available"', () => {
  const lines = areaLines();
  assert.ok(lines.length >= 1, 'the prompt points at FACTS.library.areas');
  const exists = lines.find((l) => /never say an area is not available/.test(l));
  assert.ok(exists, 'an area is never called unavailable');
  assert.match(exists, /rule 8 does not apply to areas/, 'rule 8 ("say it is not available yet") is not the route for areas');
  assert.match(exists, /FACTS describes nothing inside an area/);
  assert.match(exists, /never say whether it exists/, 'no claim either way about a part of an area');
  assert.match(exists, /set "escalate" to "needs-human"/, 'a question about a part of an area escalates (rule 1)');
  for (const l of lines) {
    assert.doesNotMatch(l, /not available yet/, `an area line must not instruct "not available yet": ${l}`);
    assert.doesNotMatch(l, /content_request/, 'an area question is escalated, not filed as missing content');
  }
});

test('the prompt: a listed area says nothing about access; access comes from levels_open_now or escalates', () => {
  const access = areaLines().find((l) => /says nothing about access/.test(l));
  assert.ok(access, 'one line says the area list is not an access statement');
  assert.match(access, /never tell a customer they can open an area or a level because it is listed/);
  assert.match(access, /FACTS\.customer\.levels_open_now/);
  assert.match(access, /set "escalate" to "needs-human"/);
  // The field the line names must exist in FACTS.
  const facts = buildFacts({ ticket: TICKET, profile: { current_level: 'A1.1' }, now: T0 });
  assert.ok(Array.isArray(facts.customer.levels_open_now));
});

const reply = (body, language = 'en') => composeReply(body, language);
const codesOf = (text, language = 'en') => validateReply(text, { language }).map((p) => p.code);

test('validateReply blocks a reply that names a listed area and says something there is not available', () => {
  const url = (r) => catalog.areaUrl(r);
  const denials = [
    // the 2026-10-04 draft, verbatim from our own side
    ['en', 'Hello,\n\nThank you for your suggestion. A podcast feature is not currently available on DeutschMeister, so this is not something we can confirm or provide at this time.'],
    // area affirmed, a part denied in a sentence of its own
    ['en', `Hello,\n\nOur podcasts are here: ${url('/podcasts')} . English transcripts are not available yet.`],
    ['en', `Hello,\n\nYou can practise reading at ${url('/reading')} . We don't offer translations of the texts.`],
    ['en', 'Hello,\n\nThe listening exercises do not include a transcript at the moment, I am afraid.'],
    ['en', 'Hello,\n\nSentence X-Ray is unavailable for longer texts.'],
    ['de', 'Guten Tag,\n\nleider ist eine Podcast-Funktion derzeit nicht verfügbar.'],
    ['de', 'Guten Tag,\n\nim Hörverstehen gibt es noch keine englischen Transkripte.'],
    ['de', 'Guten Tag,\n\nfür das Leseverstehen bieten wir derzeit keine Übersetzung an.'],
    ['de', `Guten Tag,\n\nden Einstufungstest finden Sie hier: ${url('/level-test')} . Eine Sprechprüfung ist dort nicht enthalten.`],
  ];
  for (const [lang, body] of denials) {
    assert.ok(codesOf(reply(body, lang), lang).includes('area-denied'), `not flagged: ${body}`);
  }
});

test('validateReply lets an area through when nothing is denied, and a rule-8 reply without an area', () => {
  const ok = [
    ['en', `Hello,\n\nOur podcasts for learners are here: ${catalog.areaUrl('/podcasts')} . Each episode is graded by level.`],
    ['de', `Guten Tag,\n\nzum Leseverstehen geht es hier: ${catalog.areaUrl('/reading')} . Dort wählen Sie Ihre Stufe.`],
    // rule 8 without an area: still allowed
    ['en', 'Hello,\n\nC1 is not available yet on DeutschMeister. The highest level today is B2.2.'],
    ['de', 'Guten Tag,\n\nTestDaF bieten wir derzeit nicht an. Die Prüfungen, auf die wir vorbereiten, finden Sie auf unserer Prüfungsseite.'],
  ];
  for (const [lang, body] of ok) {
    assert.deepEqual(codesOf(reply(body, lang), lang), [], `wrongly blocked: ${body}`);
  }
  // Word starts only: "spreading" is not "reading"; the disclosure and signature name no area.
  assert.equal(areaNamedIn('Spreading the word is not available.'), null);
  assert.equal(areaNamedIn(reply('Hello,\n\nThank you for writing to us.')), null);
  // The documented trade-off: a rule-8 reply that ALSO points to an area is blocked; the owner answers it.
  assert.ok(codesOf(reply(`Hello,\n\nC1 is not available yet. Meanwhile, try ${catalog.areaUrl('/listening')} .`)).includes('area-denied'));
});

test('area names stay out of libraryNames(), so a wanted part of an area is never mistaken for library content', () => {
  // libraryNames() matches by substring: with "podcast" in it, a content request
  // "podcast-with-english-transcript" would count as already in the library.
  const names = libraryNames([]);
  assert.equal(libraryHas('podcast-with-english-transcript', names), false);
  assert.equal(libraryHas('reading-texts-with-audio', names), false);
});
