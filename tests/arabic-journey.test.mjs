// The narrow defects fixed because they blocked the Arabic pilot journey
// (docs/arabic/README.md §6). Each is a behaviour that was wrong for EVERY
// language; the Arabic work only made it visible.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const pool = JSON.parse(read('src/data/lessonPools/a11.json'));

const { requeueFor } = await import('../src/lib/lesson/requeue.js');
const { firstAttemptAccuracy, keepBest } = await import('../src/lib/lesson/mastery.js');
const { poolItems } = await import('../src/lib/lesson/buildLesson.js');

test('G1 requeue: a replacement is never an item of a later Lektion (minLektion ≤ the Lektion played)', () => {
  const items = poolItems(pool);
  // A topic whose slice holds items stamped for later Lektionen.
  const topic = [...new Set(items.map((i) => i.topic))].find((tp) => {
    const s = items.filter((i) => i.topic === tp);
    return s.some((i) => Number(i.minLektion) <= 1) && s.some((i) => Number(i.minLektion) > 3);
  });
  assert.ok(topic, 'fixture: a topic spanning early and late Lektionen');
  const missed = items.filter((i) => i.topic === topic && Number(i.minLektion) <= 1).slice(0, 4);
  for (let round = 0; round < 5; round += 1) {
    const used = missed.map((m) => m.id);
    for (const pick of requeueFor(missed, pool, used, { maxLektion: 1 })) {
      assert.ok(!(Number(pick.minLektion) > 1), `${pick.id} (minLektion ${pick.minLektion}) reached Lektion 1's requeue`);
    }
  }
  // Without the bound the old behaviour stands (callers outside the player).
  assert.ok(requeueFor(missed, pool, missed.map((m) => m.id)).length > 0);
  assert.match(read('src/pages/lesson/LessonPlayerPage.jsx'), /requeueFor\(misses, pool, used, \{ maxLektion: lektion\.nr \}\)/);
});

test('G4 accuracy: requeue variants and transcript-supported answers are not first-try evidence', () => {
  const attempts = [
    { itemId: 'a', stage: 'practice', correct: true },
    { itemId: 'b', stage: 'practice', correct: false },
    { itemId: 'c', stage: 'requeue', correct: true },
    { itemId: 'd', stage: 'requeue', correct: false },
    { itemId: 'e', stage: 'derived', correct: true, support: 'transcript' },
  ];
  assert.equal(firstAttemptAccuracy(attempts), 0.5, 'only a and b count');
  assert.equal(firstAttemptAccuracy([{ itemId: 'x', stage: 'requeue', correct: true }]), 0);
});

test('G5 progress is never written down: a weaker repeat keeps gold and the best accuracy', () => {
  assert.deepEqual(keepBest({ status: 'gold', accuracy: 0.9 }, { status: 'complete', accuracy: 0.6 }), { status: 'gold', accuracy: 0.9 });
  assert.deepEqual(keepBest({ status: 'complete', accuracy: 0.5 }, { status: 'gold', accuracy: 0.85 }), { status: 'gold', accuracy: 0.85 });
  assert.deepEqual(keepBest(null, { status: 'complete', accuracy: 0.4 }), { status: 'complete', accuracy: 0.4 });
  assert.deepEqual(keepBest({ status: 'started', accuracy: null }, { status: 'complete', accuracy: 0.7 }), { status: 'complete', accuracy: 0.7 });
  const svc = read('src/services/lessonService.js');
  assert.match(svc, /const best = keepBest\(prev, \{ status, accuracy \}\);/);
  assert.match(svc, /status: best\.status,\s*\n\s*accuracy: best\.accuracy,/);
});

test('G2 matching tiles are named by their visible words, never by a pairing number', () => {
  const src = read('src/components/lesson/MatchItem.jsx');
  assert.doesNotMatch(src, /pairIndex \+ 1/, 'a numbered label gives the answer away (3 goes with 3)');
  assert.doesNotMatch(src, /match\.(german|english)Label/);
  assert.match(src, /aria-live="polite"/, 'selection, matches and misses are announced in words');
  for (const k of ['match.selected', 'match.matchedAnnounce', 'match.missAnnounce']) assert.ok(src.includes(`'${k}'`), k);
});

test('G2b derived match pairs carry the word id, so the meaning column speaks the chrome language', async () => {
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  const { derivedItems } = await import('../src/lib/lesson/buildLesson.js');
  const { default: SIDECAR } = await import('../src/data/curricula/a11.ar.js');
  for (const id of ['a1.1-l01', 'a1.1-l02', 'a1.1-l03']) {
    const lektion = CURRICULUM_A11.lektionen.find((l) => l.id === id);
    for (const attempt of [1, 2, 3]) {
      const match = derivedItems(lektion, attempt).find((i) => i.type === 'match');
      if (!match) continue;
      for (const pair of match.pairs) {
        assert.ok(pair.wordId, `${id}/${attempt}: «${pair.de}» has no wordId`);
        assert.ok(SIDECAR.entries[`word.${pair.wordId}`]?.ar, `${id}/${attempt}: «${pair.de}» has no Arabic meaning`);
      }
    }
  }
});

test('G3 the recap says WHEN review starts truthfully (cards are due now; a guest has none yet)', () => {
  const recap = read('src/components/lesson/RecapStage.jsx');
  assert.doesNotMatch(recap, /nextReviewDate\(\)/, 'no invented "tomorrow" date');
  assert.match(recap, /t\(user \? 'recap\.reviewNow' : 'recap\.reviewAfterSave', lang\)/);
  assert.match(read('src/services/reviewService.js'), /step: 0, due_at: new Date\(\)\.toISOString\(\)/, 'the seed this copy describes');
});

test('G6 the article chip is not printed twice (der | der Gruß)', () => {
  for (const f of ['src/components/lesson/WortfeldStage.jsx', 'src/components/lesson/WordsLearnedCards.jsx']) {
    assert.match(read(f), /article && \w+\.word \? \w+\.word :/, `${f} shows the bare noun beside the article chip`);
  }
});

test('a reload between Check and Continue does not log a second attempt for the same item', () => {
  const src = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.match(src, /prev\.some\(\(a\) => a\.itemId === item\.id && a\.stage === stageName\)/);
});

test('lesson_completed is reported once per run, however often the recap mounts', async () => {
  const store = new Map();
  globalThis.window = { sessionStorage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) } };
  const { claimRunCompletion, newRunId, packRun, unpackRun } = await import(`../src/lib/lesson/runState.js?x=${Math.random()}`);
  const id = newRunId();
  assert.equal(claimRunCompletion(id), true);
  assert.equal(claimRunCompletion(id), false, 'second mount of the same run');
  assert.equal(claimRunCompletion(newRunId()), true, 'a new run counts again');
  const now = Date.now();
  const packed = packRun({ stageKey: 'practice', runId: id }, now);
  assert.equal(unpackRun(packed, now).runId, id, 'the run id survives a reload');
  delete globalThis.window;
});

test('an auth error is explained in Arabic by its code; an unknown one keeps the server words, marked', async () => {
  const { arabicAuthError } = await import('../src/locales/useArabic.js');
  const ta = (k) => `<${k}>`;
  assert.deepEqual(arabicAuthError(ta, { code: 'invalid_credentials', message: 'Invalid login credentials' }), { text: '<account.errors.invalid_credentials>', english: null });
  assert.deepEqual(arabicAuthError(ta, { message: 'Invalid login credentials' }), { text: '<account.errors.invalid_credentials>', english: null });
  assert.deepEqual(arabicAuthError(ta, { code: 'passwords_mismatch' }), { text: '<account.passwordsDontMatch>', english: null });
  assert.deepEqual(arabicAuthError(ta, { message: 'Something odd' }), { text: '<account.serverError>', english: 'Something odd' });
  assert.equal(arabicAuthError(null, { code: 'x' }), null, 'English screens are untouched');
});

test('German answer fields stay German: lang="de", left-to-right, umlaut keys that insert at the caret', async () => {
  for (const f of ['src/components/lesson/PracticeItem.jsx', 'src/components/lesson/DictationItem.jsx']) {
    const src = read(f);
    assert.match(src, /lang="de"\s*\n\s*dir="ltr"/, `${f}: the answer input`);
    assert.match(src, /<GermanKeys /, `${f}: the ä ö ü ß keys`);
  }
  assert.match(read('src/components/lesson/WordOrderItem.jsx'), /dir="ltr" lang="de"/, 'German is built left to right in every language');
  const keys = read('src/components/lesson/GermanKeys.jsx');
  assert.match(keys, /export const GERMAN_KEYS = \['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'\];/);
  assert.match(keys, /onMouseDown=\{\(e\) => e\.preventDefault\(\)\}/, 'the caret stays in the field');
  // insertAtCaret is plain arithmetic; re-derive it from the source line.
  const fn = new Function('input', 'value', 'ch', keys.slice(keys.indexOf('const v = String'), keys.indexOf('}\n\n/**', keys.indexOf('const v = String'))));
  assert.equal(fn({ selectionStart: 1, selectionEnd: 1 }, 'Mdchen', 'ä'), 'Mädchen');
  assert.equal(fn(null, 'Gr', 'ü'), 'Grü');
});

test('audio failure offers a retry, then the text as READING support — never counted as listening', () => {
  const trouble = read('src/components/lesson/AudioTrouble.jsx');
  assert.match(trouble, /audio\.cantHear/);
  assert.match(trouble, /audio\.showTranscript/);
  for (const f of ['src/components/lesson/ListenSelectItem.jsx', 'src/components/lesson/DictationItem.jsx']) {
    assert.match(read(f), /\.\.\.\(transcript \? \{ support: 'transcript' \} : \{\}\)/, `${f} flags transcript answers`);
  }
  assert.match(read('src/components/lesson/RecapStage.jsx'), /recap\.transcriptNote/);
});

test('read-aloud feedback says what it measures: recognised words, not pronunciation', () => {
  const line = read('src/components/lesson/ReadAloudLine.jsx');
  assert.match(line, /speaking\.recognitionNote/);
  const meta = read('src/data/curricula/a11.meta.js');
  assert.doesNotMatch(meta, /scores your pronunciation/, 'the course home no longer claims pronunciation scoring');
});

test('a failed account save is not lost: the run is kept locally and the recap says so', () => {
  const src = read('src/pages/lesson/LessonPlayerPage.jsx');
  assert.match(src, /setSaveState\('local'\)/);
  assert.match(src, /recordLocalLesson\(\{ level: curriculum\.level, lektionId: lektion\.id, status, accuracy, attempts \}\);\n\s*setSaveState\('local'\)/);
});

test('the explanation function speaks Arabic with the same grounding, quota and auth', () => {
  const fn = read('netlify/functions/explain-answer.mjs');
  assert.match(fn, /const LANGS = new Set\(\['en', 'de', 'ar'\]\);/);
  assert.match(fn, /ar: 'أنت معلّم ودود/);
  assert.match(fn, /EXPLAIN_DAILY_LIMIT = 40/);
  assert.match(read('src/components/lesson/ExplainAnswer.jsx'), /const \[lang\] = useState\(currentLang\);/, 'a language switch never spends a second call');
});
