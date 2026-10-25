import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { nextStep, canOpenLevel, selectRecipients, passesFinalTest } from '../netlify/functions/course-reminder.mjs';

const SQL = readFileSync(new URL('../migrations/2026-10-22-course-reminder-checkpoints.sql', import.meta.url), 'utf8')
  .replace(/--[^\n]*/g, '');

test('course reminders extract lesson numbers without casting checkpoint ids', () => {
  const extraction = SQL.match(/max\(substring\(lp\.lektion_id from '([^']+)'\)::int\)/);
  assert.ok(extraction, 'numeric extraction must return NULL for ids that are not numbered lessons');
  const pattern = new RegExp(extraction[1]);
  for (const [id, nr] of [['a1.1-l1', '1'], ['a1.1-l12', '12'], ['a1.1-cp1', null], ['a1.1-cp4', null], ['a1.1-l3-other', null]]) {
    assert.equal(pattern.exec(id)?.[1] ?? null, nr, id);
  }
  assert.doesNotMatch(SQL, /regexp_replace\(lp\.lektion_id/);
});

test('course reminders reject malformed or oversized learner-controlled lesson numbers before casting', () => {
  const extraction = SQL.match(/max\(substring\(lp\.lektion_id from '([^']+)'\)::int\)/);
  assert.ok(extraction);
  const pattern = new RegExp(extraction[1]);
  for (const id of ['a1.1-l2147483648', 'a1.1-l' + '9'.repeat(300), 'a1.1-l1234', 'a1.1-l-1', 'a1.1-l1.5', 'a1.1-l', 'a1.1-cp1']) {
    assert.equal(pattern.exec(id)?.[1] ?? null, null, id);
  }
  for (const nr of ['1', '12', '123']) assert.equal(pattern.exec(`a1.1-l${nr}`)?.[1], nr);
});

test('course reminders count only completed lessons and retain checkpoint activity', () => {
  assert.match(SQL, /count\(\*\) FILTER\s*\(\s*WHERE lp\.status IN \('complete', 'gold'\) AND lp\.lektion_id ~ '-l\[0-9\]\{1,3\}\$'\s*\)::int AS done_count/);
  const progress = SQL.slice(SQL.indexOf('WITH prog AS ('), SQL.indexOf('att AS ('));
  assert.match(progress, /max\(lp\.updated_at\) AS last_progress_at/);
  const where = progress.slice(progress.indexOf('FROM public.lesson_progress lp'));
  assert.doesNotMatch(where, /lektion_id|status/, 'checkpoint rows must remain in the activity aggregation');
  assert.match(SQL, /greatest\(p\.last_progress_at, coalesce\(a\.last_attempt_at, p\.last_progress_at\)\)/);
});

test('the checkpoint-safe reminder replacement preserves the RPC contract and service-only access', () => {
  assert.match(SQL, /CREATE OR REPLACE FUNCTION public\.course_reminder_candidates/);
  assert.match(SQL, /p_min_hours\s+int DEFAULT 20/);
  assert.match(SQL, /p_max_hours\s+int DEFAULT 44/);
  assert.match(SQL, /p_window_days\s+int DEFAULT 30/);
  assert.match(SQL, /SECURITY DEFINER\s+SET search_path = public/);
  assert.match(SQL, /REVOKE ALL ON FUNCTION public\.course_reminder_candidates\(int, int, int\) FROM PUBLIC, anon, authenticated/);
  assert.match(SQL, /GRANT EXECUTE ON FUNCTION public\.course_reminder_candidates\(int, int, int\) TO service_role/);
});

// ---------------------------------------------------------------------------
// The step the mail names (review 2026-10-25: C-034, C-137, C-154, X-028, X-096)
// ---------------------------------------------------------------------------
//
// The SQL's next_lektion_nr is "highest Lektion finished in 30 days + 1" and
// ignores checkpoints. The mail therefore named Lektion 4 at every chapter end
// (the course home locks it until Checkpoint 1), "Lektion 12" after Lektion 12
// was finished, "Lektion 1" to a learner whose L1-L3 were older than 30 days,
// and sent learners who lost A1.2 access a link to a lock. The mailer now reads
// the learner's own progress (all of it) and access, in JS (the SQL stays as
// applied). After Lektion 12 and Checkpoint 4 the course path still ends with
// the Abschlusstest (curricula/index.js curriculumPath), so the reminder names
// it until the course's own record says it was passed. Synthetic ids and
// addresses only.

const done = (level, ids) => ids.map((id) => ({ lektion_id: `${level}-${id}`, status: 'complete' }));
const lektionen = (n) => Array.from({ length: n }, (_, i) => `l${String(i + 1).padStart(2, '0')}`);
const ALL_A11 = [...lektionen(12), 'cp1', 'cp2', 'cp3', 'cp4'];
const FINAL_A11 = { kind: 'finaltest', title: 'Abschlusstest A1.1', slug: 'abschlusstest-a1-1' };

test('nextStep: the open checkpoint, else the next Lektion, else the final test, and complete only once it is passed', () => {
  assert.deepEqual(nextStep('a1.1', done('a1.1', lektionen(3))), { kind: 'checkpoint', nr: 1, title: 'Checkpoint 1: Lektion 1–3' });
  assert.deepEqual(nextStep('a1.1', done('a1.1', [...lektionen(3), 'cp1'])), { kind: 'lektion', nr: 4, title: 'Auf dem Flohmarkt' });
  assert.deepEqual(nextStep('a1.1', done('a1.1', [...lektionen(12), 'cp1', 'cp2', 'cp3'])), { kind: 'checkpoint', nr: 4, title: 'Checkpoint 4: Lektion 10–12' });
  // The path's last node: the course home calls the course complete only with it.
  assert.deepEqual(nextStep('a1.1', done('a1.1', ALL_A11)), FINAL_A11);
  assert.deepEqual(nextStep('a1.1', done('a1.1', ALL_A11), { finalTestPassed: true }), { kind: 'complete' });
  assert.deepEqual(nextStep('a1.2', done('a1.2', [...lektionen(12), 'cp1', 'cp2', 'cp3', 'cp4'])), { kind: 'finaltest', title: 'Abschlusstest A1.2', slug: 'abschlusstest-a1-2' });
  assert.deepEqual(nextStep('a1.1', done('a1.1', [...lektionen(3), 'cp1']), { finalTestPassed: true }), { kind: 'lektion', nr: 4, title: 'Auf dem Flohmarkt' }, 'a passed final test does not skip an open Lektion');
  assert.deepEqual(nextStep('a1.2', done('a1.2', lektionen(4))), { kind: 'lektion', nr: 5, title: 'Pläne für das Wochenende' });
  assert.deepEqual(nextStep('a1.1', []), { kind: 'lektion', nr: 1, title: 'Hallo, ich bin …' });
  // Only finished rows of this level count; a started Lektion is not done.
  assert.deepEqual(nextStep('a1.1', [{ lektion_id: 'a1.1-l04', status: 'started' }, ...done('a1.2', lektionen(6))]), { kind: 'lektion', nr: 1, title: 'Hallo, ich bin …' });
  assert.deepEqual(nextStep('a1.1', [{ lektion_id: 'a1.1-l02', status: 'gold' }]), { kind: 'lektion', nr: 3, title: 'Meine Familie' }, 'gold is finished too: the step after the highest finished Lektion');
  // The SQL's number is a floor: the same table over 30 days.
  assert.deepEqual(nextStep('a1.1', [], { floorNr: 5 }), { kind: 'lektion', nr: 5, title: 'Im Klassenzimmer' });
  // A number the course never writes counts as the last Lektion, no further.
  assert.deepEqual(nextStep('a1.1', done('a1.1', ['l99', 'cp4'])), FINAL_A11);
  assert.deepEqual(nextStep('a1.1', done('a1.1', ['l99', 'cp4']), { finalTestPassed: true }), { kind: 'complete' });
  assert.equal(nextStep('b1.1', done('b1.1', ['l01'])), null, 'a level without tables names nothing');
});

test('passesFinalTest is the course home\'s repair rule: a completed attempt at or above the pass mark', () => {
  assert.equal(passesFinalTest({ status: 'completed', score: 60, max_score: 100 }, 60), true, 'knapp passes');
  assert.equal(passesFinalTest({ status: 'completed', score: 90, max_score: 100 }, 60), true, 'solide passes');
  assert.equal(passesFinalTest({ status: 'completed', score: 59.4, max_score: 100 }, 60), false, 'nicht-bereit');
  assert.equal(passesFinalTest({ status: 'completed', score: 119, max_score: 200 }, 60), true, 'rounded like verdictFor: 59.5 → 60');
  assert.equal(passesFinalTest({ status: 'in_progress', score: 100, max_score: 100 }, 60), false, 'an unfinished attempt is no pass');
  assert.equal(passesFinalTest({ status: 'completed', score: 5, max_score: 0 }, 60), false);
  assert.equal(passesFinalTest(null, 60), false);
});

test('canOpenLevel mirrors SubscriptionContext.hasLevelAccess', () => {
  const now = Date.parse('2026-10-25T18:00:00Z');
  const future = '2026-11-01T00:00:00Z';
  const past = '2026-10-01T00:00:00Z';
  assert.equal(canOpenLevel('a1.1', {}, now), true, 'A1.1 is free');
  assert.equal(canOpenLevel('a1.2', {}, now), false);
  assert.equal(canOpenLevel('a1.2', { profile: { trial_started_at: past, trial_ends_at: future, is_subscribed: false } }, now), true, 'live trial');
  assert.equal(canOpenLevel('a1.2', { profile: { trial_started_at: past, trial_ends_at: past } }, now), false, 'ended trial');
  assert.equal(canOpenLevel('a1.2', { profile: { trial_started_at: past, trial_ends_at: future, is_subscribed: true } }, now), false, 'checkTrialStatus: a subscribed flag is not a trial');
  assert.equal(canOpenLevel('a1.2', { subscription: { status: 'cancelled', subscription_end: future } }, now), true, 'paid period, cancelled but running');
  assert.equal(canOpenLevel('a1.2', { subscription: { status: 'expired', subscription_end: future } }, now), false);
  assert.equal(canOpenLevel('a1.2', { subscription: { status: 'active', subscription_end: past } }, now), false, 'an expired comp grant opens nothing');
  assert.equal(canOpenLevel('b1.1', { purchases: [{ status: 'active', product_key: 'course_a2_1', access_until: future }] }, now), true, 'an included Pro window opens every level');
  assert.equal(canOpenLevel('a1.2', { purchases: [{ status: 'active', product_key: 'course_a1_2', access_until: past }] }, now), true, 'the bought course is lifetime');
  assert.equal(canOpenLevel('a1.2', { purchases: [{ status: 'active', product_key: 'course_a1', access_until: null }] }, now), true, 'a legacy band key still unlocks its levels');
  assert.equal(canOpenLevel('a1.2', { purchases: [{ status: 'refunded', product_key: 'course_a1_2', access_until: future }] }, now), false);
  assert.equal(canOpenLevel('a1.2', { purchases: [{ status: 'active', product_key: 'course_a2_1', access_until: past }] }, now), false, 'another level\'s course');
});

const NOW = Date.parse('2026-10-25T18:00:00Z');
const IDLE = new Date(NOW - 22 * 3600000).toISOString();
const FUTURE = '2026-11-30T00:00:00.000Z';
const PAST = '2026-10-01T00:00:00.000Z';

/** The reads selectRecipients makes, over in-memory tables. `fail` names a table whose read errors. */
function reminderDb({ candidates, progress = [], profiles = [], subscriptions = [], purchases = [], programProgress = [], examAttempts = [], fail = null }) {
  const tables = { lesson_progress: progress, profiles, subscriptions, purchases, program_progress: programProgress, exam_attempts: examAttempts, lifecycle_emails: [] };
  const users = candidates.map((c) => ({ id: c.user_id, email: `${c.user_id}@example.test`, email_confirmed_at: PAST }));
  const reads = [];
  class Q {
    constructor(name) { Object.assign(this, { name, rows: [...(tables[name] || [])], lo: 0, hi: Infinity }); reads.push(name); }
    select() { return this; }
    eq(k, v) { this.rows = this.rows.filter((r) => r[k] === v); return this; }
    in(k, vs) { this.rows = this.rows.filter((r) => vs.includes(r[k])); return this; }
    gte(k, v) { this.rows = this.rows.filter((r) => r[k] >= v); return this; }
    like(k, p) { const pre = p.replace(/%$/, ''); this.rows = this.rows.filter((r) => String(r[k]).startsWith(pre)); return this; }
    order() { return this; }
    range(a, b) { this.lo = a; this.hi = b; return this; }
    then(res, rej) {
      const out = this.name === fail ? { data: null, error: { message: `${this.name} unavailable` } } : { data: this.rows.slice(this.lo, this.hi + 1), error: null };
      return Promise.resolve(out).then(res, rej);
    }
  }
  return {
    reads,
    rpc: async () => ({ data: candidates, error: null }),
    from: (name) => new Q(name),
    auth: { admin: { listUsers: async ({ page = 1 } = {}) => ({ data: { users: page === 1 ? users : [] }, error: null }) } },
  };
}

const candidate = (user_id, level, next_lektion_nr) => ({ user_id, level, last_activity_at: IDLE, done_count: 0, next_lektion_nr, email_opted_out: false });
const rowsFor = (user_id, level, ids, status = 'complete') => ids.map((id) => ({ user_id, lektion_id: `${level}-${id}`, status }));

test('selection names the step each learner can open, and skips the finished and the locked out', async () => {
  const db = reminderDb({
    candidates: [
      candidate('done12', 'a1.1', 13), // L1-L12 done, Checkpoint 4 open (the SQL said 13, the mail said "Lektion 12")
      candidate('finished', 'a1.1', 13), // every Lektion and checkpoint done; the Abschlusstest is the last step
      candidate('cp1open', 'a1.1', 4), // L1-L3 done, Checkpoint 1 open (the mail said "Lektion 4", which is locked)
      candidate('returning', 'a1.1', 1), // L1-L3 + CP1 done long ago, L4 opened today (the 30-day SQL said 1)
      candidate('lapsedA12', 'a1.2', 2), // trial over, nothing bought: /course/a1.2 is a lock
      candidate('boughtA12', 'a1.2', 2),
      candidate('legacyA12', 'a1.2', 2),
      candidate('trialA12', 'a1.2', 2),
      candidate('proA12', 'a1.2', 2),
      candidate('grantLapsedA12', 'a1.2', 2), // a comp grant past its end, profile flag still set
    ],
    progress: [
      ...rowsFor('done12', 'a1.1', [...lektionen(12), 'cp1', 'cp2', 'cp3']),
      ...rowsFor('finished', 'a1.1', [...lektionen(12), 'cp1', 'cp2', 'cp3', 'cp4']),
      ...rowsFor('cp1open', 'a1.1', lektionen(3)),
      ...rowsFor('returning', 'a1.1', [...lektionen(3), 'cp1']),
      ...rowsFor('returning', 'a1.1', ['l04'], 'started'),
      ...['lapsedA12', 'boughtA12', 'legacyA12', 'trialA12', 'proA12', 'grantLapsedA12'].flatMap((id) => rowsFor(id, 'a1.2', ['l01'])),
    ],
    profiles: [
      { id: 'lapsedA12', trial_started_at: PAST, trial_ends_at: PAST, is_subscribed: false },
      { id: 'boughtA12', trial_started_at: PAST, trial_ends_at: PAST, is_subscribed: false },
      { id: 'legacyA12', trial_started_at: PAST, trial_ends_at: PAST, is_subscribed: false },
      { id: 'trialA12', trial_started_at: PAST, trial_ends_at: FUTURE, is_subscribed: false },
      { id: 'proA12', trial_started_at: PAST, trial_ends_at: PAST, is_subscribed: true },
      { id: 'grantLapsedA12', trial_started_at: PAST, trial_ends_at: PAST, is_subscribed: true },
    ],
    subscriptions: [
      { user_id: 'proA12', status: 'active', subscription_end: FUTURE },
      { user_id: 'grantLapsedA12', status: 'active', subscription_end: PAST },
    ],
    purchases: [
      { user_id: 'boughtA12', product_key: 'course_a1_2', status: 'active', access_until: PAST },
      { user_id: 'legacyA12', product_key: 'course_a1', status: 'active', access_until: null },
      { user_id: 'lapsedA12', product_key: 'course_a1_2', status: 'refunded', access_until: FUTURE },
    ],
  });
  const got = Object.fromEntries((await selectRecipients({ client: db, now: NOW })).map((r) => [r.id, { nextNr: r.nextNr, checkpointNr: r.checkpointNr, finalTest: r.finalTest }]));
  assert.deepEqual(got, {
    done12: { nextNr: null, checkpointNr: 4, finalTest: false },
    finished: { nextNr: null, checkpointNr: null, finalTest: true },
    cp1open: { nextNr: null, checkpointNr: 1, finalTest: false },
    returning: { nextNr: 4, checkpointNr: null, finalTest: false },
    boughtA12: { nextNr: 2, checkpointNr: null, finalTest: false },
    legacyA12: { nextNr: 2, checkpointNr: null, finalTest: false },
    trialA12: { nextNr: 2, checkpointNr: null, finalTest: false },
    proA12: { nextNr: 2, checkpointNr: null, finalTest: false },
  });
  // A1.1 is free, so only the A1.2 learners' access is read.
  assert.ok(db.reads.includes('purchases') && db.reads.includes('subscriptions') && db.reads.includes('profiles'));
});

test('after Lektion 12 and Checkpoint 4 the reminder names the Abschlusstest until the course records it as passed', async () => {
  const atFinal = (id, level = 'a1.1') => rowsFor(id, level, [...lektionen(12), 'cp1', 'cp2', 'cp3', 'cp4']);
  const db = reminderDb({
    candidates: ['open', 'node', 'lostNode', 'failed', 'otherProgram', 'otherTest', 'a12open', 'a12passed'].map((id) => candidate(id, id.startsWith('a12') ? 'a1.2' : 'a1.1', 13)),
    progress: [
      ...['open', 'node', 'lostNode', 'failed', 'otherProgram', 'otherTest'].flatMap((id) => atFinal(id)),
      ...atFinal('a12open', 'a1.2'), ...atFinal('a12passed', 'a1.2'),
    ],
    programProgress: [
      // The result screen ticks the path's last node (lessonService.js completeLevelTest).
      { user_id: 'node', program_key: 'a11_course', item_id: 'a1.1-leveltest' },
      { user_id: 'a12passed', program_key: 'a12_course', item_id: 'a1.2-leveltest' },
      // Another level's node is not this course's.
      { user_id: 'otherProgram', program_key: 'a12_course', item_id: 'a1.2-leveltest' },
    ],
    examAttempts: [
      // The tick was lost but the pass is saved: the course home completes the node from it (levelTestReconcile.js).
      { user_id: 'lostNode', exam_key: 'a1_1_abschluss', status: 'completed', score: 42, max_score: 60 },
      { user_id: 'failed', exam_key: 'a1_1_abschluss', status: 'completed', score: 30, max_score: 60 },
      { user_id: 'otherTest', exam_key: 'goethe_a1', status: 'completed', score: 60, max_score: 60 },
    ],
    profiles: ['a12open', 'a12passed'].map((id) => ({ id, trial_started_at: PAST, trial_ends_at: FUTURE, is_subscribed: false })),
  });
  const out = await selectRecipients({ client: db, now: NOW });
  assert.deepEqual(out.map((r) => [r.id, r.finalTest, r.nextNr, r.checkpointNr]).sort(), [
    ['a12open', true, null, null],
    ['failed', true, null, null],
    ['open', true, null, null],
    ['otherProgram', true, null, null],
    ['otherTest', true, null, null],
  ], 'only a passed final test (node or saved passing attempt) completes the course');
  // The final-test record is read only for learners who reached that step.
  const early = reminderDb({ candidates: [candidate('early', 'a1.1', 2)], progress: rowsFor('early', 'a1.1', ['l01']) });
  await selectRecipients({ client: early, now: NOW });
  assert.ok(!early.reads.includes('program_progress') && !early.reads.includes('exam_attempts'));
  // A failed read of that record sends nothing: "you have not done it" may be false.
  for (const fail of ['program_progress', 'exam_attempts']) {
    const broken = reminderDb({ candidates: [candidate('open', 'a1.1', 13)], progress: atFinal('open'), fail });
    await assert.rejects(selectRecipients({ client: broken, now: NOW }), /final-test (node|attempt) read failed/, fail);
  }
});

test('an all-A1.1 selection reads no access rows, and a failed step or access read sends nothing', async () => {
  const freeOnly = reminderDb({ candidates: [candidate('a', 'a1.1', 2)], progress: rowsFor('a', 'a1.1', ['l01']) });
  assert.deepEqual((await selectRecipients({ client: freeOnly, now: NOW })).map((r) => [r.id, r.nextNr]), [['a', 2]]);
  assert.ok(!freeOnly.reads.includes('purchases'), 'A1.1 is free: no access read');
  for (const fail of ['lesson_progress', 'purchases']) {
    const db = reminderDb({ candidates: [candidate('b', 'a1.2', 2)], fail });
    await assert.rejects(selectRecipients({ client: db, now: NOW }), /read failed/, `${fail}: a guess at a Lektion or a lock is worse than no mail`);
  }
});
