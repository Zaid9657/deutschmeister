// Guard suite for the unattended Sentence X-Ray link render (2026-10-09).
//
// From 01:00 UTC on 2026-10-09 a renderer with a browser user agent walked the
// grammar-example links to /analyze/?s=… : 17 of 18 anonymous analyses that
// night were verbatim grammar_examples, each with a fresh anonymous id and IP,
// no referrer and no attribution, and each one a paid model call. The crawler
// gate (tests/xray.test.mjs) only sees self-declared crawlers. The rule here:
// an anonymous link render with no sign of a person, of a sentence WE published
// on a grammar page, is asked for a press of Analyze instead of being run.
//
// The handler runs for real against a fake Supabase and a fake model endpoint
// on globalThis.fetch. Any other network call fails the test, so this file can
// never reach production (the URL and key below are fakes).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { xraySource } from '../src/lib/xray.js';
import { cleanSource } from '../netlify/functions/_shared/xraySource.mjs';
import {
  isUnattendedLinkSource, isPublishedGrammarExample, UNATTENDED_RESPONSE,
} from '../netlify/functions/_shared/xrayUnattended.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

// The handler and its shared clients read their env at import (node --test runs
// each file in its own process, so nothing else sees this).
process.env.SUPABASE_URL = 'http://supabase.test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-role-key-for-tests';
process.env.ANTHROPIC_API_KEY = 'fake-anthropic-key-for-tests';
for (const k of ['IP_HASH_SALT', 'UNSUB_SECRET', 'CAMPAIGN_SECRET', 'XRAY_MODEL']) delete process.env[k];

const GRAMMAR_EXAMPLE = 'Ich helfe dem Kollegen.';
const NOT_OURS = 'Morgen fahre ich mit dem Zug nach Hamburg.';
const PUBLISHED = new Set([GRAMMAR_EXAMPLE, 'Der Hund schläft im Garten.']);
const SIGNED_IN_TOKEN = 'fake-user-jwt';
const CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

let calls = [];
let lookupFails = false;
const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...extra } });

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const method = (init.method || 'GET').toUpperCase();
  const call = { host: url.host, path: url.pathname, method };
  calls.push(call);
  if (url.host === 'api.anthropic.com' && url.pathname === '/v1/messages') {
    return json({ content: [{ type: 'text', text: '{"words":[],"insight":null,"fullTranslation":"x"}' }] });
  }
  if (url.host === 'supabase.test') {
    if (url.pathname === '/auth/v1/user') {
      const auth = new Headers(init.headers).get('authorization') || '';
      return auth === `Bearer ${SIGNED_IN_TOKEN}`
        ? json({ id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated' })
        : json({ message: 'invalid JWT' }, 401);
    }
    if (url.pathname === '/rest/v1/grammar_examples') {
      if (lookupFails) return json({ message: 'boom' }, 500);
      const eq = url.searchParams.get('sentence_de') || '';
      const hit = eq.startsWith('eq.') && PUBLISHED.has(eq.slice(3));
      return new Response(null, { status: 200, headers: { 'content-range': hit ? '0-0/1' : '*/0' } });
    }
    if (url.pathname === '/rest/v1/xray_usage') {
      if (method === 'POST') return json({ id: 'usage-row-1' }, 201);
      if (method === 'DELETE') return new Response(null, { status: 204 });
      return new Response(null, { status: 200, headers: { 'content-range': '*/0' } });
    }
    if (url.pathname === '/rest/v1/profiles') return json([]);
  }
  throw new Error(`unexpected network call from a test: ${method} ${url.href}`);
};

async function analyze({ source, sentence = GRAMMAR_EXAMPLE, token = null }) {
  calls = [];
  const logs = [];
  const savedLog = console.log;
  console.log = (...args) => logs.push(args.join(' '));
  try {
    const { handler } = await import('../netlify/functions/analyze-sentence.mjs');
    const res = await handler({
      httpMethod: 'POST',
      headers: {
        origin: 'https://deutsch-meister.de',
        'user-agent': CHROME,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ sentence, anonymousId: token ? null : `fresh-render-id-${Math.random().toString(36).slice(2)}`, source }),
    });
    const count = (pred) => calls.filter(pred).length;
    return {
      res,
      body: JSON.parse(res.body),
      logs,
      model: count((c) => c.host === 'api.anthropic.com'),
      lookups: count((c) => c.path === '/rest/v1/grammar_examples'),
      meter: count((c) => c.path === '/rest/v1/xray_usage'),
      verifiedJwt: count((c) => c.path === '/auth/v1/user'),
    };
  } finally {
    console.log = savedLog;
  }
}

// What the SPA really sends (src/lib/xray.js), for each kind of arrival.
const sent = {
  unattended: xraySource({ referrer: '', attribution: null, entry: 'link' }),
  fromGrammarPage: xraySource({ referrer: 'https://deutsch-meister.de/grammar/a1.1/akkusativ/', attribution: null, entry: 'link' }),
  pressedAnalyze: xraySource({ referrer: '', attribution: null, entry: 'typed' }),
  attributed: xraySource({ referrer: '', attribution: { first: { source: 'email' }, last: { source: 'email' } }, entry: 'link' }),
  fromGoogle: xraySource({ referrer: 'https://www.google.com/', attribution: { first: { source: 'google' } }, entry: 'link' }),
};

// ---------------------------------------------------------------------------
// The rule, on the source the SPA really sends and the server really keeps
// ---------------------------------------------------------------------------

test('only a link render with no referrer and no attribution reads as unattended', () => {
  assert.equal(isUnattendedLinkSource(cleanSource(sent.unattended)), true);
  for (const [name, source] of Object.entries(sent)) {
    if (name === 'unattended') continue;
    assert.equal(isUnattendedLinkSource(cleanSource(source)), false, `${name} must not read as unattended`);
  }
  // An old bundle sends no source, and junk is dropped by the sanitiser: never matched.
  assert.equal(isUnattendedLinkSource(null), false);
  assert.equal(isUnattendedLinkSource(cleanSource(undefined)), false);
  assert.equal(isUnattendedLinkSource(cleanSource({ entry: 'link' })), false, 'a missing referrer label is not "none"');
  assert.equal(isUnattendedLinkSource({ entry: 'link', ref: 'none', first: null, last: null, ua: 'browser' }), true);
});

test('the grammar-example lookup fails open', async () => {
  assert.equal(await isPublishedGrammarExample(null, GRAMMAR_EXAMPLE), false, 'no client');
  const throwing = { from() { throw new Error('network down'); } };
  const savedError = console.error;
  console.error = () => {};
  try {
    assert.equal(await isPublishedGrammarExample(throwing, GRAMMAR_EXAMPLE), false, 'a throwing client');
  } finally {
    console.error = savedError;
  }
  assert.equal(await isPublishedGrammarExample({ from() { throw new Error('must not be asked'); } }, '   '), false, 'a blank sentence');
});

// ---------------------------------------------------------------------------
// The handler
// ---------------------------------------------------------------------------

test('the 2026-10-09 render (no referrer, no attribution, our grammar example) is asked for a press, before the meter and the model', async () => {
  const r = await analyze({ source: sent.unattended });
  assert.equal(r.res.statusCode, UNATTENDED_RESPONSE.statusCode);
  assert.equal(r.body.code, 'unattended');
  assert.equal(r.model, 0, 'a paid model call was made for an unattended render');
  assert.equal(r.meter, 0, 'the refusal touched the usage meter');
  assert.equal(r.lookups, 1);
  assert.ok(r.logs.some((l) => l.startsWith('[xray] unattended link render refused')), 'the refusal must stay visible in the function log');
});

test('pressing Analyze runs that same sentence, without a lookup', async () => {
  const r = await analyze({ source: sent.pressedAnalyze });
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.model, 1);
  assert.equal(r.lookups, 0);
});

test('a person who clicked the link on our grammar page still gets the auto-run', async () => {
  const r = await analyze({ source: sent.fromGrammarPage });
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.model, 1);
  assert.equal(r.lookups, 0);
});

test('a no-referrer link of a sentence we did not publish on a grammar page still runs (the daily e-mail, a shared sentence)', async () => {
  const r = await analyze({ source: sent.unattended, sentence: NOT_OURS });
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.lookups, 1);
  assert.equal(r.model, 1);
});

test('a browser that carries an attribution touch, or a referrer from elsewhere, still runs', async () => {
  for (const source of [sent.attributed, sent.fromGoogle]) {
    const r = await analyze({ source });
    assert.equal(r.res.statusCode, 200);
    assert.equal(r.lookups, 0);
    assert.equal(r.model, 1);
  }
});

test('a signed-in learner is never asked, whatever the source', async () => {
  const r = await analyze({ source: sent.unattended, token: SIGNED_IN_TOKEN });
  assert.equal(r.verifiedJwt, 1, 'the request must have gone through the signed-in path');
  assert.equal(r.res.statusCode, 200);
  assert.equal(r.lookups, 0);
  assert.equal(r.model, 1);
});

test('a failing lookup runs the analysis rather than refusing a person', async () => {
  lookupFails = true;
  const savedError = console.error;
  console.error = () => {};
  try {
    const r = await analyze({ source: sent.unattended });
    assert.equal(r.lookups, 1, 'the lookup must have run and failed, not been skipped');
    assert.equal(r.res.statusCode, 200);
    assert.equal(r.model, 1);
  } finally {
    lookupFails = false;
    console.error = savedError;
  }
});

// ---------------------------------------------------------------------------
// What a person sees
// ---------------------------------------------------------------------------

test('the page shows the answer as written, and its words name the real button', () => {
  const page = read('src/pages/SentenceXRay.jsx');
  // failureMessage hands a 4xx error text straight to the error line.
  assert.match(page, /return data\?\.error \|\| 'Analysis failed\. Please try again\.';/);
  // The button the message tells a person to press.
  assert.match(page, /<Scan size=\{15\} \/>\s*Analyze\s*</);
  assert.match(UNATTENDED_RESPONSE.body.error, /\bPress Analyze\b/);
  // The ?s= link still pre-fills the sentence, so the press is one click.
  assert.match(page, /useState\(\(\) => searchParams\.get\('s'\) \?\? ''\)/);
  // The press must arrive as 'typed', which the rule never matches: if the
  // button ever passed the prefill's 'link' through, every no-referrer arrival
  // would be refused on every press.
  assert.match(page, /const analyze = async \(text, entry = 'typed'\) =>/);
  assert.match(page, /onClick=\{\(\) => analyze\(\)\}/);
});
