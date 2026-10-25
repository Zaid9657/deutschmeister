// The vocabulary trainer session (src/components/vocab/SrsTrainer.jsx) and the
// "In den Trainer" door on the level page (src/pages/LevelPage.jsx).
//
// What each pin defends:
//
//   1. ONE GRADE AT A TIME, SAVED BEFORE IT COUNTS — a double tap graded the same
//      card twice and dropped the next card unseen; a failed write (supabase-js
//      resolves a network failure as { error }) still removed the card and
//      counted it, so "N Wörter wiederholt!" could celebrate nothing saved. The
//      headline counts distinct words, not "Nochmal" repeats.
//   2. THE END OF A BATCH IS NOT THE END OF THE DECK — the 20-card batch ran out
//      into "Nichts mehr fällig — komm morgen wieder" with hundreds still due.
//      The deck is counted again; more due → "Weiter üben"; only a freshly read
//      zero says "nothing due", and a failed read never does.
//   3. A TAB RETURN IS NOT A NEW SESSION — reload was keyed on the auth user
//      OBJECT, replaced on every tab return and token refresh, so the session
//      restarted and lost its "Nochmal" cards.
//   4. THE PLANS' REVIEW DAYS LAND ON SOMETHING — four paid plans sent learners
//      to "deine Karteikarten aus Woche N" on an empty deck; the titles promise
//      due cards now, and the empty deck offers a one-click start from a level
//      the learner may open.
//   5. THE LEVEL PAGE SAYS WHAT HAPPENED — "Im Trainer ✓" showed after a failed
//      add and stayed on for every other category; it now leads to a first review.
//
// The component is exercised the way tests/listening-attempt-regressions.test.mjs
// exercises AudioPlayer: its hooks-and-handlers section (everything before the
// first early return) runs in a VM with stand-in hooks and services.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

import { GRADES, queueAfterGrade, review } from '../src/services/srsScheduler.js';
import { FREE_LEVELS, isLevelFree } from '../src/config/freeTier.js';
import { PROGRAM as A11_PROGRAM } from '../src/data/programs/a11Phase.js';
import { PROGRAM as A12_PROGRAM } from '../src/data/programs/a12Phase.js';
import { PROGRAM as A21_PROGRAM } from '../src/data/programs/a21Phase.js';
import { PROGRAM as A22_PROGRAM } from '../src/data/programs/a22Phase.js';
import { PROGRAM as GA2_PROGRAM } from '../src/data/programs/goetheA2Kurs.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const trainerSource = read('src/components/vocab/SrsTrainer.jsx');

const OPEN = 'const SrsTrainer = () => {';
const hooksAndHandlers = trainerSource.slice(trainerSource.indexOf(OPEN) + OPEN.length, trainerSource.indexOf('  if (!user) return null;'));
const helperSource = [
  trainerSource.match(/const isWordId = [^\n]+\n/)?.[0] ?? '',
  trainerSource.match(/function starterLevel\([\s\S]*?\n\}\n/)?.[0] ?? '',
].join('\n');
// Names the harness hands back; a name the component lacks comes back undefined, so each test
// fails on its own assertion rather than the whole suite failing to load.
const expose = (names) => names.map((n) => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(', ');

const card = (id, extra = {}) => ({ word_id: id, ease: 2.5, interval_days: 3, reps: 2, lapses: 0, words: { german: id }, ...extra });
const settle = () => new Promise((resolve) => setImmediate(resolve));

function trainerHarness({ services, user = { id: 'u1' }, profile = null, hasLevelAccess = () => false } = {}) {
  const states = [];
  const refs = [];
  let deps = [];
  let stateCursor = 0;
  let refCursor = 0;
  const context = {
    currentUser: user,
    useAuth: () => ({ user: context.currentUser }),
    useSubscription: () => ({ profile, hasLevelAccess }),
    useState(initial) {
      const index = stateCursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useRef(initial) {
      const index = refCursor++;
      if (!(index in refs)) refs[index] = { current: initial };
      return refs[index];
    },
    useCallback: (fn, callbackDeps) => { deps.push(callbackDeps); return fn; },
    useEffect: () => {},
    GRADES,
    queueAfterGrade,
    FREE_LEVELS,
    isLevelFree,
    ...services,
  };
  const render = runInNewContext(
    `(function () {
      ${helperSource}
      return function render() {
        ${hooksAndHandlers}
        return { ${expose(['grade', 'reload', 'addStarterWords', 'addLevel', 'card', 'setRevealed', 'starterLevel'])},
          state: { ${expose(['queue', 'counts', 'revealed', 'savedWords', 'loading', 'batchEnd', 'saving', 'saveFailed', 'adding', 'addFailed'])} } };
      };
    })()`,
    context,
  );
  return {
    render() {
      stateCursor = 0;
      refCursor = 0;
      deps = [];
      return render();
    },
    get callbackDeps() { return deps; },
    setUser(next) { context.currentUser = next; },
  };
}

/** Services whose answers a test scripts; every call is logged. */
function scriptedServices({ cards = [], counts = [{ total: 3, due: 3, ok: true }], record } = {}) {
  const log = { dueCards: 0, counts: 0, reviews: [], words: [], enqueued: [] };
  const countQueue = [...counts];
  return {
    log,
    services: {
      fetchDueCards: async () => { log.dueCards += 1; return cards.map((c) => ({ ...c })); },
      fetchDeckCounts: async () => { log.counts += 1; return countQueue.length > 1 ? countQueue.shift() : countQueue[0]; },
      recordReview: (userId, c, g) => {
        log.reviews.push([c.word_id, g]);
        return record ? record(c, g) : Promise.resolve(review(c, g));
      },
      fetchWordsForLevel: async (level) => {
        log.words.push(level);
        return [{ id: '0f3b2c1d-1111-4222-8333-944455566677' }, { id: 'word-7' }, { id: '1a2b3c4d-aaaa-4bbb-8ccc-ddddeeeeffff' }];
      },
      enqueueWords: async (userId, ids) => { log.enqueued.push(ids); return ids.length; },
    },
  };
}

// ── 1. one grade at a time, saved before it counts ──────────────────────

test('a double tap grades the visible card once and never drops the next card unseen', async () => {
  let release;
  const { services, log } = scriptedServices({
    cards: [card('A'), card('B'), card('C')],
    record: (c, g) => new Promise((resolve) => { release = () => resolve(review(c, g)); }),
  });
  const h = trainerHarness({ services });
  await h.render().reload();
  let view = h.render();
  // Both taps land before React re-renders: the same closure, the same front card.
  const first = view.grade(GRADES.GOOD);
  const second = view.grade(GRADES.GOOD);
  await second;
  assert.deepEqual(log.reviews, [['A', GRADES.GOOD]], 'one write while a grade is in flight');
  assert.equal(h.render().state.saving, true, 'the grade chips are disabled while saving');
  release();
  await first;
  // A tap that lands after the save but before React re-renders still comes from the render that
  // showed A — it must not grade A twice (nor B unseen).
  await view.grade(GRADES.EASY);
  assert.deepEqual(log.reviews, [['A', GRADES.GOOD]], 'a stale tap is ignored');
  view = h.render();
  assert.deepEqual(view.state.queue.map((c) => c.word_id), ['B', 'C'], 'B is still next');
  assert.equal(view.state.saving, false);
  assert.equal(view.state.savedWords.size, 1);
  assert.match(trainerSource, /onClick=\{\(\) => grade\(b\.grade\)\}\s*disabled=\{saving\}/, 'the chips are disabled while a grade is saved');
});

test('a grade that was not saved keeps the card at the front, says so, and counts nothing', async () => {
  const { services, log } = scriptedServices({ cards: [card('A'), card('B')], record: async () => null });
  const h = trainerHarness({ services });
  await h.render().reload();
  let view = h.render();
  view.setRevealed(true);
  view = h.render();
  await view.grade(GRADES.GOOD);
  view = h.render();
  assert.deepEqual(view.state.queue.map((c) => c.word_id), ['A', 'B']);
  assert.equal(view.state.saveFailed, true);
  assert.equal(view.state.revealed, true, 'still revealed, so the learner can grade it again');
  assert.equal(view.state.savedWords.size, 0);
  assert.equal(log.counts, 1, 'no end-of-batch count either');
  assert.match(trainerSource, /saveFailed && \([\s\S]{0,200}Nicht gespeichert — bitte nochmal versuchen\./);
});

test('"Nochmal" re-queues the saved lapse, and the headline counts distinct words', async () => {
  const { services, log } = scriptedServices({ cards: [card('A', { interval_days: 20 }), card('B')], counts: [{ total: 2, due: 2, ok: true }, { total: 2, due: 0, ok: true }] });
  const h = trainerHarness({ services });
  await h.render().reload();
  await h.render().grade(GRADES.AGAIN);
  let view = h.render();
  assert.deepEqual(view.state.queue.map((c) => c.word_id), ['B', 'A']);
  assert.equal(view.state.queue[1].lapses, 1, 'the re-queued card carries the saved lapse');
  assert.equal(view.state.queue[1].interval_days, 0);
  await h.render().grade(GRADES.GOOD); // B
  await h.render().grade(GRADES.GOOD); // A again
  view = h.render();
  assert.deepEqual(log.reviews, [['A', GRADES.AGAIN], ['B', GRADES.GOOD], ['A', GRADES.GOOD]]);
  assert.equal(view.state.savedWords.size, 2, 'two words, not three grades');
  assert.match(trainerSource, /const savedHeadline = `\$\{savedCount\} \$\{savedCount === 1 \? 'Wort' : 'Wörter'\} wiederholt!`;/);
});

// ── 2. the end of a batch is not the end of the deck ────────────────────

test('when the batch runs out the deck is counted again: more due → "Weiter üben" loads the next batch', async () => {
  const { services, log } = scriptedServices({
    cards: [card('A')],
    counts: [{ total: 339, due: 339, ok: true }, { total: 339, due: 319, ok: true }],
  });
  const h = trainerHarness({ services });
  await h.render().reload();
  await h.render().grade(GRADES.GOOD);
  let view = h.render();
  assert.equal(view.card, undefined);
  assert.equal(log.counts, 2, 'counted again at the end of the batch');
  assert.equal(view.state.batchEnd, 'done');
  assert.equal(view.state.counts.due, 319);
  // That state renders the next-batch door, wired to reload, not the "nothing due" line.
  const moreDue = trainerSource.slice(trainerSource.indexOf('if (counts.due > 0) {'), trainerSource.indexOf('// A freshly read zero'));
  assert.match(moreDue, /batchEnd === 'done'[\s\S]*detail=\{`Noch \$\{counts\.due\} fällig /);
  assert.match(moreDue, /nextLabel="Weiter üben"\s*onNext=\{reload\}/);
  assert.doesNotMatch(moreDue, /Nichts mehr fällig/);
  await view.reload();
  assert.equal(log.dueCards, 2, '"Weiter üben" fetches the next batch');
  assert.equal(h.render().state.batchEnd, null);
});

test('"Nichts mehr fällig" only for a freshly read zero — never for a failed count', async () => {
  const zero = scriptedServices({ cards: [card('A')], counts: [{ total: 30, due: 1, ok: true }, { total: 30, due: 0, ok: true }] });
  const h = trainerHarness({ services: zero.services });
  await h.render().reload();
  await h.render().grade(GRADES.EASY);
  assert.deepEqual(h.render().state.counts, { total: 30, due: 0, ok: true });

  const failed = scriptedServices({ cards: [card('A')], counts: [{ total: 30, due: 1, ok: true }, { total: 0, due: 0, ok: false }] });
  const g = trainerHarness({ services: failed.services });
  await g.render().reload();
  await g.render().grade(GRADES.GOOD);
  assert.equal(g.render().state.counts.ok, false);

  const noCard = trainerSource.slice(trainerSource.indexOf('  if (!card) {'), trainerSource.indexOf('  return (\n    <Card raised'));
  const nothingDue = noCard.indexOf('Nichts mehr fällig');
  assert.ok(nothingDue > noCard.indexOf('if (!counts.ok) {'), 'a failed read is handled before any "nothing due"');
  assert.ok(nothingDue > noCard.indexOf('if (counts.due > 0) {'), 'and so is a deck with more due');
  assert.ok(nothingDue > noCard.indexOf("batchEnd === 'checking'"), 'and the re-count still running');
  assert.equal((trainerSource.match(/Nichts mehr fällig — komm morgen wieder/g) || []).length, 1, 'one place says it');
});

// ── 3. a tab return is not a new session ────────────────────────────────

test('reload is keyed on the user id, so a replaced auth user object does not restart the session', async () => {
  const { services } = scriptedServices({ cards: [card('A')] });
  const h = trainerHarness({ services, user: { id: 'u1', email: 'a@example.com' } });
  h.render();
  const before = h.callbackDeps[0];
  h.setUser({ id: 'u1', email: 'a@example.com' }); // auth-js hands over a fresh object on every tab return
  h.render();
  const after = h.callbackDeps[0];
  assert.equal(before.length, after.length);
  before.forEach((dep, i) => assert.ok(Object.is(dep, after[i]), 'same memo key → React keeps the session'));
  h.setUser({ id: 'u2' });
  h.render();
  assert.ok(!Object.is(h.callbackDeps[0][0], before[0]), 'a different account still reloads');
  assert.match(trainerSource, /const reload = useCallback\(async \(\) => \{[\s\S]*?\}, \[userId\]\);/);
});

test('a reload never opens the next card on its answer side', async () => {
  const { services } = scriptedServices({ cards: [card('A'), card('B')] });
  const h = trainerHarness({ services });
  await h.render().reload();
  h.render().setRevealed(true);
  await h.render().reload();
  assert.equal(h.render().state.revealed, false);
});

// ── 4. the plans' review days land on something ─────────────────────────

test('no plan item promises the flashcards "aus Woche N" (the trainer has no notion of weeks)', () => {
  for (const program of [A11_PROGRAM, A12_PROGRAM, A21_PROGRAM, A22_PROGRAM, GA2_PROGRAM]) {
    const items = program.weeks.flatMap((w) => w.days.flatMap((d) => d.items));
    for (const item of items) assert.doesNotMatch(item.title, /Karteikarten aus Woche/, `${program.key} ${item.id}: ${item.title}`);
    for (const item of items.filter((i) => i.href === '/vocabulary')) {
      assert.doesNotMatch(item.title, /\bWoche\b/, `${program.key} ${item.id}: a trainer visit cannot promise one week's cards`);
    }
  }
  const trainerDays = [A12_PROGRAM, A21_PROGRAM, A22_PROGRAM, GA2_PROGRAM]
    .flatMap((p) => p.weeks.flatMap((w) => w.days.flatMap((d) => d.items)))
    .filter((i) => i.href === '/vocabulary');
  assert.equal(trainerDays.length, 16, 'four trainer days in each of the four plans');
  for (const item of trainerDays) assert.equal(item.title, 'Wortschatz-Wiederholung: fällige Karteikarten');
});

test('an empty deck offers the learner\'s own level in one click, and never a level they may not open', async () => {
  const { services, log } = scriptedServices({ cards: [], counts: [{ total: 0, due: 0, ok: true }] });
  const h = trainerHarness({ services });
  await h.render().reload();
  const view = h.render();
  assert.equal(view.addLevel, 'a1.1', 'no placement → the free level');
  await view.addStarterWords();
  assert.deepEqual(log.words, ['a1.1']);
  assert.deepEqual(log.enqueued, [['0f3b2c1d-1111-4222-8333-944455566677', '1a2b3c4d-aaaa-4bbb-8ccc-ddddeeeeffff']], 'only real word ids');
  assert.equal(log.dueCards, 2, 'the deck is loaded again once the words are in');

  const { starterLevel } = view;
  assert.equal(starterLevel('B1.1', (l) => l === 'b1.1'), 'b1.1', 'a placed level the learner may open');
  assert.equal(starterLevel('B1.1', () => false), 'a1.1', 'no access → never the locked level');
  assert.equal(starterLevel('a1', () => true), 'a1.1', "'a1' is the column default, not a placement");
  assert.equal(starterLevel('A1.1', () => false), 'a1.1');
  assert.equal(starterLevel(null, undefined), 'a1.1');

  const failing = scriptedServices({ cards: [], counts: [{ total: 0, due: 0, ok: true }] });
  failing.services.enqueueWords = async () => 0;
  const g = trainerHarness({ services: failing.services });
  await g.render().reload();
  await g.render().addStarterWords();
  assert.equal(g.render().state.addFailed, true, 'a failed add says so');
  assert.equal(failing.log.dueCards, 1);

  const empty = trainerSource.slice(trainerSource.indexOf('if (counts.total === 0) {'), trainerSource.indexOf('if (counts.due > 0) {'));
  assert.match(empty, /onClick=\{addStarterWords\}/);
  assert.match(empty, /`Wörter aus \$\{addLevel\.toUpperCase\(\)\} hinzufügen`/);
});

test('the revealed card can be heard: the recording, else the computer voice, labelled as such', () => {
  const back = trainerSource.slice(trainerSource.indexOf('{revealed && ('), trainerSource.indexOf('<div className="mt-5">'));
  assert.match(back, /onClick=\{\(\) => playWord\(word\.audio_url, displayGerman\(word\.article, word\.german\)\)\}/);
  assert.match(back, /aria-label="Aussprache anhören"/);
  assert.match(back, /\{!word\.audio_url && \([\s\S]*Computerstimme/);
  assert.match(trainerSource, /import \{ playWord \} from '\.\.\/\.\.\/lib\/lesson\/speech\.js';/);
  assert.doesNotMatch(trainerSource, /0\/1,935 words have audio/, 'the stale "no audio" comment is gone');
});

// ── 5. the level page says what happened ────────────────────────────────

const levelSource = read('src/pages/LevelPage.jsx');

function levelAddHarness({ enqueue }) {
  const start = levelSource.indexOf('  const [trainerAddState, setTrainerAddState]');
  const end = levelSource.indexOf('\n  };\n', start) + '\n  };\n'.length;
  const states = [];
  const refs = [];
  let stateCursor = 0;
  let refCursor = 0;
  const context = {
    useState(initial) {
      const index = stateCursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (value) => { states[index] = value; }];
    },
    useRef(initial) {
      const index = refCursor++;
      if (!(index in refs)) refs[index] = { current: initial };
      return refs[index];
    },
    enqueueWords: enqueue,
    user: { id: 'u1' },
    level: 'a1.1',
    selectedCategory: 'Colors',
    filteredVocabulary: [{ id: '0f3b2c1d-1111-4222-8333-944455566677' }, { id: 'word-3' }],
  };
  const render = runInNewContext(`(function render() { ${levelSource.slice(start, end)} return { ${expose(['handleAddToTrainer', 'trainerAddTarget'])} }; })`, context);
  return {
    context,
    render() { stateCursor = 0; refCursor = 0; return render(); },
    get state() { return states[0]; },
  };
}

test('"Im Trainer ✓" only after the words were saved; a failed add says so', async () => {
  const failed = levelAddHarness({ enqueue: async () => 0 });
  await failed.render().handleAddToTrainer();
  assert.equal(failed.state, 'error');
  const saved = levelAddHarness({ enqueue: async (userId, ids) => ids.length });
  await saved.render().handleAddToTrainer();
  assert.equal(saved.state, 'added');
  assert.match(levelSource, /trainerAddState === 'error'\s*\?\s*'Nicht hinzugefügt — nochmal versuchen'/);
});

test('the success label belongs to the words it added: another category or level starts fresh', async () => {
  // The reset runs on every category or level change …
  assert.match(levelSource, /useEffect\(\(\) => \{\s*trainerAddTarget\.current = null;\s*setTrainerAddState\('idle'\);\s*\}, \[selectedCategory, level\]\);/);
  // … and an add still in flight when the learner moves on cannot paint "Im Trainer ✓" on the new list.
  let finish;
  const h = levelAddHarness({ enqueue: () => new Promise((resolve) => { finish = resolve; }) });
  const pending = h.render().handleAddToTrainer();
  await settle();
  h.render().trainerAddTarget.current = null; // what the reset effect does
  finish(2);
  await pending;
  assert.equal(h.state, 'adding', 'the stale add did not mark the new category as added');
});

test('a successful add leads straight to the first review', () => {
  assert.match(levelSource, /\{trainerAddState === 'added' && \(\s*<Link to="\/vocabulary"[^>]*>\s*Jetzt üben →\s*<\/Link>/);
  const vocabItems = A11_PROGRAM.weeks.flatMap((w) => w.days.flatMap((d) => d.items)).filter((i) => i.href === '/level/a1.1');
  assert.ok(vocabItems.length >= 18);
  for (const item of vocabItems) assert.match(item.title, /— hinzufügen und gleich üben$/);
});
