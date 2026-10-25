// A signed-out checkpoint pass is "Saved on this device" only when the browser stored it (2026-10-25
// cross-check of LSN-02, REG MEDIUM). When localStorage refuses the write — QuotaExceededError from a
// full or blocked store — localProgress keeps the course store in this tab's memory, so the course
// home and a sign-in from this tab still have the pass (B3 #6). guestPassKept read that memory too, so
// the result card said "Saved on this device" with no retry, and the pass was gone after a reload.
// The kept check now reads the browser's storage itself, and a refused save is a failed save with a
// retry. The storage below behaves like a browser's: a write past its quota throws QuotaExceededError.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { LOCAL_KEY, clearLocalProgress, localDoneIds } from '../src/lib/course/localProgress.js';
import { fetchAttemptState, guestPassKept, recordAttempt } from '../src/services/checkpointService.js';
import { t } from '../src/lib/lesson/strings.js';

const PAGE = readFileSync(new URL('../src/pages/lesson/CheckpointPage.jsx', import.meta.url), 'utf8');
const STAMP = '2026-10-21T18:30:00.000Z';
const CP = 'a1.1-cp1';
const PAPER = { level: 'a1.1', checkpointId: CP, items: [], answers: {}, result: { passed: true, overall: 75 }, stamp: STAMP };
const ROOM_FOR_THE_ATTEMPT_COUNT_ONLY = 100;

/** localStorage with a quota, as browsers have: a write that does not fit throws QuotaExceededError. */
function quotaStorage(quota) {
  const values = new Map();
  let limit = quota;
  const used = (except) => [...values].reduce((n, [k, v]) => (k === except ? n : n + k.length + v.length), 0);
  globalThis.window = { localStorage: {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => {
      const text = String(value);
      if (used(key) + key.length + text.length > limit) {
        throw new DOMException(`Setting the value of '${key}' exceeded the quota.`, 'QuotaExceededError');
      }
      values.set(key, text);
    },
    removeItem: (key) => { values.delete(key); },
  } };
  clearLocalProgress();
  return { values, setQuota: (n) => { limit = n; } };
}

/** The attempts this device counted for the checkpoint (the advisory 3-per-8-hours limit). */
const countedAttempts = (values) => (JSON.parse(values.get('dm_checkpoint_attempts') || '{}')[CP] || []).length;

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('a guest pass the browser refused to store is not kept on this device; once stored, it is', async () => {
  const store = quotaStorage(ROOM_FOR_THE_ATTEMPT_COUNT_ONLY);
  assert.equal(await recordAttempt(null, PAPER), false, 'nothing reached an account');
  assert.equal(store.values.has(LOCAL_KEY), false, 'the course store did not fit: QuotaExceededError');
  assert.equal(countedAttempts(store.values), 1, 'the attempt itself was counted');
  assert.equal(guestPassKept('a1.1', CP), false, 'a pass held in memory only is gone after a reload');
  assert.equal(guestPassKept('a1.1', CP, STAMP), false);
  assert.equal(localDoneIds('a1.1').has(CP), true, 'this tab still has it, for the course home and a sign-in from here');
  // Space freed, the same paper again (a retry, so no second attempt): stored now, and kept.
  store.setQuota(Infinity);
  assert.equal(await recordAttempt(null, { ...PAPER, retry: true }), false);
  assert.equal(guestPassKept('a1.1', CP, STAMP), true);
  assert.deepEqual(JSON.parse(store.values.get(LOCAL_KEY)).checkpoints[CP], { passedAt: STAMP, accuracy: 0.75, stamp: STAMP });
  assert.equal(countedAttempts(store.values), 1, 'the retry counted no second attempt');
});

test('an earlier stored pass does not stand in for this paper, and no storage at all keeps nothing', async () => {
  const store = quotaStorage(Infinity);
  await recordAttempt(null, PAPER);
  assert.equal(guestPassKept('a1.1', CP, STAMP), true);
  store.setQuota(0);
  const later = '2026-10-22T09:00:00.000Z';
  await recordAttempt(null, { ...PAPER, result: { passed: true, overall: 90 }, stamp: later });
  assert.equal(guestPassKept('a1.1', CP, later), false, 'this paper was refused');
  assert.equal(guestPassKept('a1.1', CP), true, 'the earlier pass is still stored');
  assert.equal(JSON.parse(store.values.get(LOCAL_KEY)).checkpoints[CP].stamp, STAMP);
  assert.equal(guestPassKept('a1.2', CP), false, 'another level is not this pass');
  // Storage the browser will not even open (cookies blocked): the getter throws.
  globalThis.window = { get localStorage() { throw new DOMException('The operation is insecure.', 'SecurityError'); } };
  clearLocalProgress();
  assert.equal(await recordAttempt(null, PAPER), false);
  assert.equal(localDoneIds('a1.1').has(CP), true, 'held in memory');
  assert.equal(guestPassKept('a1.1', CP, STAMP), false, 'but not kept on this device');
});

// ── The page's own save handler ─────────────────────────────────────────────────────────────────
/** CheckpointPage's `save` callback, run against the real service and the storage above. */
function pageSave(result = PAPER.result) {
  const start = PAGE.indexOf('const save = useCallback(') + 'const save = useCallback('.length;
  const deps = /\}, \[user, (?:owner, )?checkpoint, level\]\);/.exec(PAGE.slice(start));
  const end = deps ? start + deps.index : -1;
  assert.ok(start > 'const save = useCallback('.length && end > start, 'the page has its save callback');
  const states = [];
  const context = vm.createContext({
    user: null,
    owner: null,
    sending: { current: new Set() },
    unsaved: { current: false },
    keepFinishedPaper: () => assert.fail('a guest paper is not kept in the account store'),
    dropFinishedPaper: () => assert.fail('a guest paper is not kept in the account store'),
    level: 'a1.1',
    checkpoint: { id: CP },
    saveRef: { current: { args: { level: 'a1.1', checkpointId: CP, items: [], answers: {}, result }, stamp: STAMP } },
    recordAttempt,
    guestPassKept,
    fetchAttemptState,
    setSaveState: (state) => states.push(state),
    setAttempts: () => {},
  });
  return { save: vm.runInContext(`(${PAGE.slice(start, end + 1)})`, context), states };
}

test('the result card: a refused guest save is a failed save with a retry, never "Saved on this device"', async () => {
  const store = quotaStorage(ROOM_FOR_THE_ATTEMPT_COUNT_ONLY);
  const { save, states } = pageSave();
  save();
  await settle();
  assert.deepEqual(states, ['localFailed'], 'the pass is in memory only: it must not be called saved on this device');
  assert.equal(store.values.has(LOCAL_KEY), false);
  // The card's retry, once there is room: now it is saved on this device.
  store.setQuota(Infinity);
  save(true);
  await settle();
  assert.deepEqual(states, ['localFailed', 'local']);
  assert.equal(JSON.parse(store.values.get(LOCAL_KEY)).checkpoints[CP].stamp, STAMP);
  assert.equal(countedAttempts(store.values), 1, 'the retry is not a second attempt');
  // A paper that did not pass has nothing to keep, so it says nothing either way.
  quotaStorage(ROOM_FOR_THE_ATTEMPT_COUNT_ONLY);
  const failed = pageSave({ passed: false, overall: 40 });
  failed.save();
  await settle();
  assert.deepEqual(failed.states, []);
});

const DU_TOKENS = /\b(du|Du|dir|Dir|dich|Dich|dein|Dein|deine[mnrs]?|Deine[mnrs]?|kannst|musst|hast|willst|machst|hörst|schreibst|Schreib|Tippe|Lies|Hör|Sprich|Melde|Probier|bestätige|Versuch es)\b/;

test('the refused save is said in words with the retry beside it, in Sie, and "Saved on this device" has one source', () => {
  const open = PAGE.indexOf('<p className="mt-4 text-sm text-graphite" role="status">');
  const status = PAGE.slice(open, PAGE.indexOf('</p>', open));
  assert.match(status, /\{saveState === 'failed' \|\| saveState === 'localFailed' \? \(/, 'both failed saves share the retry line');
  assert.match(status, /saveState === 'failed' \? t\('checkpoint\.saveFailed', lang\) : LOCAL_SAVE_FAILED\[lang\] \|\| LOCAL_SAVE_FAILED\.en/);
  assert.match(status, /onClick=\{\(\) => save\(true\)\}>\s*\{t\('sync\.retry', lang\)\}/);
  assert.doesNotMatch(PAGE, /setSaveState\('local'\)/, 'never set without the stored-pass check');
  assert.equal(PAGE.split("? 'local' : 'localFailed'").length, 2, 'one place decides it');
  assert.ok(PAGE.includes("setSaveState(guestPassKept(level, checkpoint.id, job.stamp) ? 'local' : 'localFailed')"));
  const at = PAGE.indexOf('const LOCAL_SAVE_FAILED = ') + 'const LOCAL_SAVE_FAILED = '.length;
  const copy = vm.runInNewContext(`(${PAGE.slice(at, PAGE.indexOf('};', at) + 1)})`);
  assert.match(copy.de, /\bIhr\b[\s\S]*\bLassen Sie\b[\s\S]*\bversuchen Sie\b/, 'German chrome says Sie');
  assert.doesNotMatch(copy.de, DU_TOKENS);
  for (const lang of ['en', 'de']) {
    assert.ok(copy[lang].trim().length > 0, lang);
    assert.notEqual(copy[lang], t('sync.local', lang), 'a refused save never reads as a kept one');
  }
});
