import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { showTrialReturn, hideReturnBanner, loadSavedWork, returnOffer, returnDismissed, dismissReturn, RETURN_DISMISS_MS, freeReturnOption } from '../src/lib/trialReturn.js';
import { savedWork } from '../src/lib/trialSavedWork.js';
import { PLANS, deEur, LEVEL_COURSES } from '../src/data/pricing.js';
import { CURRICULA } from '../src/data/curricula/index.js';
import { FREE_COURSE_HREF } from '../src/data/offers.js';

const now = Date.parse('2026-11-01T12:00:00Z');
const eligible = { userId: 'a', profile: { trial_ends_at: new Date(now).toISOString(), is_subscribed: false }, purchases: [], subscription: null, loading: false, billingVerified: true, subscribed: false };
test('only a verified nonbuyer whose real trial ended sees the return surface', () => {
  assert.equal(showTrialReturn(eligible, now), true);
  for (const patch of [{ userId: null }, { profile: null }, { purchases: null }, { purchases: [{ status: 'active' }] }, { loading: true }, { billingVerified: false }, { subscribed: true }, { subscription: { lemonsqueezy_subscription_id: '1', status: 'past_due' } }]) {
    assert.equal(showTrialReturn({ ...eligible, ...patch }, now), false, JSON.stringify(patch));
  }
  for (const patch of [{ trial_ends_at: null }, { trial_ends_at: 'bad' }, { trial_ends_at: new Date(now + 1).toISOString() }, { is_subscribed: true }, { subscription_tier: 'pro' }]) {
    assert.equal(showTrialReturn({ ...eligible, profile: { ...eligible.profile, ...patch } }, now), false);
  }
});
test('banner is absent on all billing routes; expiry card has its own seven-day per-account dismissal', () => {
  for (const path of ['/subscription', '/subscription/', '/subscription/success', '/pricing/']) assert.ok(hideReturnBanner(path));
  assert.equal(hideReturnBanner('/course/a1.1'), false);
  const values = new Map();
  globalThis.window = { localStorage: { getItem: (k) => values.get(k) ?? null, setItem: (k, v) => values.set(k, v) } };
  dismissReturn('a', now);
  assert.equal(returnDismissed('a', now + RETURN_DISMISS_MS - 1), true);
  assert.equal(returnDismissed('a', now + RETURN_DISMISS_MS), false);
  assert.equal(returnDismissed('b', now), false);
  assert.equal(returnDismissed('a', now - 1), false);
  globalThis.window = { get localStorage() { throw new Error('blocked'); } };
  assert.equal(dismissReturn('a', now), false);
  assert.equal(returnDismissed('a', now), false);
  delete globalThis.window;
});
test('saved work uses actual recognized rows and dates, never invented completions', () => {
  const lesson = CURRICULA['a1.1'].lektionen[2];
  const task = savedWork({ lessons: [{ level: 'A1.1', lektion_id: lesson.id, status: 'started', updated_at: new Date(now).toISOString() }] });
  assert.ok(task.label.includes(lesson.title));
  assert.equal(task.detail, 'Begonnen');
  assert.equal(task.href, '/course/a1.1');
  assert.equal(savedWork({ lessons: [{ level: 'a1.1', lektion_id: 'made-up', updated_at: new Date(now).toISOString() }] }), null);
  const grammar = savedWork({ grammar: [{ last_accessed: new Date(now).toISOString(), grammar_topics: { sub_level: 'B1.1', slug: 'konjunktiv', title_de: 'Konjunktiv' } }] });
  assert.equal(grammar.external, true, 'Astro grammar requires a full load');
  assert.equal(grammar.href, '/grammar/b1.1/konjunktiv/');
  assert.equal(savedWork(), null);
});
test('saved work reads are user scoped, bounded, and a failed read is not an empty history', async () => {
  let reads = 0;
  const client = { from() { return { select() { return this; }, eq(col, value) { assert.equal(col, 'user_id'); assert.equal(value, 'a'); return this; }, order() { return this; }, limit(n) { assert.equal(n, 10); reads++; return { data: [] }; } }; } };
  assert.equal(await loadSavedWork(client, 'a'), null);
  assert.equal(reads, 3);
  client.from = () => ({ select() { return this; }, eq() { return this; }, order() { return this; }, limit() { return { error: { message: 'offline' } }; } });
  await assert.rejects(loadSavedWork(client, 'a'), /unavailable/);
});
test('only a configured live course is offered; prices and free door come from canonical data', () => {
  assert.ok(returnOffer('b1.1').label.includes(deEur(PLANS.monthly.price)));
  assert.ok(returnOffer('a1.2', { course_a1_2: { variantId: 'configured' } }).label.includes(deEur(LEVEL_COURSES.course_a1_2.price)));
  assert.ok(returnOffer('b1.1', { course_b1_1: { variantId: 'configured' } }).label.startsWith('Pro'));
  assert.equal(freeReturnOption.href, FREE_COURSE_HREF);
  const card = readFileSync(new URL('../src/components/TrialReturnCard.jsx', import.meta.url), 'utf8');
  assert.match(card, /work\?\.userId === userId/);
  assert.match(card, /current = false/);
  assert.match(card, /href=\{offer.href\}/, 'offer anchor scrolls natively, including on the subscription page');
  assert.doesNotMatch(card, /countdown|setInterval|\bdu\b|\bdein\b/i);
});
