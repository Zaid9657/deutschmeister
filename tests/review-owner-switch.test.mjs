// A review grade belongs to the deck it was made on (2026-10-25 cross-check, REG LOW). Account A graded
// the last card of a batch while the request was pending; B signed in through another tab and B's deck
// loaded; A's late continuation then set B's index from A's old one, so B's three unanswered cards showed
// the finished-batch screen. Two rules close it: the session mounts per settled owner (a new account is
// a new session), and a grade or batch-end count that resolves after the deck changed is dropped. The
// A→B sequence below runs the page's own deck effect, grade and finish in ONE mount — the case the
// owner key alone would not cover (another level, the next round) — so the guard itself is measured.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseCardKey } from '../src/services/reviewService.js';

const PAGE = readFileSync(new URL('../src/pages/lesson/ReviewPage.jsx', import.meta.url), 'utf8');

function slice(start, endMarker) {
  const from = PAGE.indexOf(start);
  assert.ok(from >= 0, `the page has: ${start}`);
  const to = PAGE.indexOf(endMarker, from);
  assert.ok(to > from, `…ending at ${endMarker}`);
  return PAGE.slice(from, to);
}

const deckEffect = () => {
  const at = PAGE.indexOf('fetchDueCards(user.id, curriculum.level, 12)');
  const start = PAGE.lastIndexOf('useEffect(', at) + 'useEffect('.length;
  return PAGE.slice(start, PAGE.indexOf('}, [user, curriculum, cardIndex, batch]);', start) + 1);
};
const gradeSource = () => slice('const grade = async (correct) => {', '\n  };\n').slice('const grade = '.length) + '\n  }';
const finishSource = () => slice('const finish = useCallback(', '}, [user, curriculum]);').slice('const finish = useCallback('.length) + '}';

const decks = {
  A: ['pattern:a1', 'pattern:a2', 'pattern:a3', 'pattern:a4'].map((card_key) => ({ card_key })),
  B: ['pattern:b1', 'pattern:b2', 'pattern:b3'].map((card_key) => ({ card_key })),
};
const settle = () => new Promise((resolve) => setTimeout(resolve, 10));

test('A→B: a grade A made before B\'s deck loaded never moves B\'s deck, nor fetches A\'s batch end into it', async () => {
  let releaseA;
  const fetched = [];
  const ctx = vm.createContext({
    curriculum: { level: 'a1.1' }, batch: 0, cards: null, index: 0, nextDueAt: null, stillDue: 0,
    cardIndex: new Map([...decks.A, ...decks.B].map((row) => [row.card_key, {}])),
    deck: { current: 0 },
    UUID: /^$/, parseCardKey, Map, Promise,
    fetchDueCards: async (userId) => decks[userId],
    fetchNextDueAt: async (userId) => { fetched.push(['nextDue', userId]); return `${userId}-next`; },
    fetchReviewCounts: async (userId) => { fetched.push(['counts', userId]); return { due: 9 }; },
    fetchWordsByIds: async () => new Map(),
    gradeCard: (userId) => (userId === 'A' ? new Promise((resolve) => { releaseA = resolve; }) : Promise.resolve(true)),
  });
  for (const name of ['cards', 'index', 'nextDueAt', 'stillDue', 'wordAudio']) {
    ctx[`set${name[0].toUpperCase()}${name.slice(1)}`] = (v) => { ctx[name] = v; };
  }
  ctx.finish = vm.runInContext(`(${finishSource()})`, ctx);
  const grade = vm.runInContext(`(${gradeSource()})`, ctx);
  const loadDeck = () => vm.runInContext(`(${deckEffect()})()`, ctx);

  // A's deck, A on the last card, A grades it — the save is still pending.
  ctx.user = { id: 'A' };
  loadDeck();
  await settle();
  assert.deepEqual(ctx.cards, decks.A);
  ctx.index = 3;
  ctx.card = ctx.cards[3];
  const pending = grade(true);
  // B signs in elsewhere; B's deck loads.
  ctx.user = { id: 'B' };
  loadDeck();
  await settle();
  assert.deepEqual([ctx.cards, ctx.index], [decks.B, 0], 'B\'s deck, at its first card');
  // A's save finally answers.
  releaseA(true);
  await pending;
  await settle();
  assert.equal(ctx.index, 0, 'B\'s three cards are still unanswered — no finished-batch screen');
  assert.deepEqual(fetched, [], 'A\'s batch end is not fetched into B\'s session');
  assert.equal(ctx.nextDueAt, null);
  // B's own grades still move B's deck.
  ctx.card = ctx.cards[0];
  await grade(true);
  assert.equal(ctx.index, 1);
});

test('the review session mounts after auth settles, keyed by its owner, and holds every piece of deck state', () => {
  const wrapper = PAGE.slice(PAGE.indexOf('export default function ReviewPage('), PAGE.indexOf('function ReviewSession('));
  assert.match(wrapper, /const \{ user, loading \} = useAuth\(\);/);
  assert.match(wrapper, /if \(loading\) \{\s*return \(/, 'nothing of a deck renders before the owner is known');
  assert.match(wrapper, /return <ReviewSession key=\{user\?\.id \|\| 'guest'\} \/>;/, 'a new owner is a new session');
  assert.doesNotMatch(wrapper, /useState\(|useEffect\(|fetchDueCards\(|gradeCard\(/, 'the wrapper holds no deck');
  const session = PAGE.slice(PAGE.indexOf('function ReviewSession('));
  for (const state of ['cards', 'index', 'nextDueAt', 'stillDue', 'batch', 'wordAudio']) {
    assert.match(session, new RegExp(`const \\[${state}, set\\w+\\] = useState\\(`), `${state} lives in the keyed session`);
  }
});
