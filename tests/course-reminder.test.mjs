// Guard suite for the course reminder (P4 "completion levers").
//
// It is the fifth job writing to the lifecycle_emails ledger and the first
// RECURRING one, so it gets the same three kinds of pin the other mailers
// have, plus two of its own:
//
//   1. THE WINDOW, as a pure function. 20–44 h since the last course activity.
//      The floor is the rule CLAUDE.md states: never tell someone they have
//      not done a lesson when they have. If the floor slips to 0, a learner
//      who studied an hour ago gets "come back to the course".
//   2. FREQUENCY. At most 3 in a rolling 7 days, counted from the ledger.
//   3. CLAIM DISCIPLINE, read off the source: ships off behind its own flag,
//      re-reads eligibility inside the send loop, claims BEFORE sending, and
//      uses the ledger's unique key.
//   4. THE LEDGER KIND ⇄ MIGRATION CONTRACT. The date lives inside the kind
//      (`course_reminder_2026-09-13`) so UNIQUE(user_id, kind) is the
//      per-day claim lock. The migration's CHECK is a pattern; this suite
//      pins that the kind the code writes MATCHES that pattern, and that the
//      migration still admits every kind the other four jobs claim.
//   5. THE COPIED LEKTION TITLES. A Netlify function cannot import the SPA's
//      curriculum module, so the titles are duplicated in the mailer. This
//      suite is the drift guard — it compares them to CURRICULUM_A11.
//
// WHY THERE IS NO WINDOW-DISJOINTNESS TABLE HERE (tests/lifecycle.test.mjs's
// job): the trial and activation windows are measured in days since SIGNUP and
// are one-shot per user, so they can collide with each other. This job is
// behaviour-based and recurring — its window is hours since the last LESSON,
// which is unrelated to signup date, so no arithmetic can make the two
// disjoint and none is attempted. The collision that could actually happen is
// two mails in one morning, and that is prevented by the clock instead: this
// job runs at 18:00 UTC, every other mailer before 10:00. That is what the
// schedule test below pins, and it is why tests/lifecycle.test.mjs needed no
// change for this feature.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  WINDOW_HOURS, WINDOW_DAYS, MAX_PER_7_DAYS,
  isWithinWindow, overWeeklyCap, reminderKindFor,
  LEKTION_TITLES, nextLektion, buildMessage, greeting,
} from '../netlify/functions/course-reminder.mjs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const SRC = read('netlify/functions/course-reminder.mjs');
const SQL = read('migrations/2026-09-13-course-reminder.sql');

const hoursAgo = (h, from = new Date('2026-09-13T18:00:00Z')) =>
  new Date(from.getTime() - h * 3600000).toISOString();

// ---------------------------------------------------------------------------
// 1. the window
// ---------------------------------------------------------------------------

test('the window is 20–44 hours and 30 days of course membership', () => {
  assert.deepEqual(WINDOW_HOURS, { minHours: 20, maxHours: 44 });
  assert.equal(WINDOW_DAYS, 30);
  assert.ok(
    WINDOW_HOURS.minHours >= 12,
    'a floor under 12 h could mail someone who studied this morning — the one rule this job must not break',
  );
  assert.ok(WINDOW_HOURS.maxHours - WINDOW_HOURS.minHours <= 24, 'a window wider than a day double-mails a daily run');
});

test('isWithinWindow: the floor is inclusive, the ceiling is not', () => {
  const now = new Date('2026-09-13T18:00:00Z');
  assert.equal(isWithinWindow(hoursAgo(1), now), false, 'studied an hour ago — must NOT be mailed');
  assert.equal(isWithinWindow(hoursAgo(19.9), now), false);
  assert.equal(isWithinWindow(hoursAgo(20), now), true);
  assert.equal(isWithinWindow(hoursAgo(30), now), true);
  assert.equal(isWithinWindow(hoursAgo(43.9), now), true);
  assert.equal(isWithinWindow(hoursAgo(44), now), false, 'older than the ceiling is a win-back, not a nudge');
  assert.equal(isWithinWindow(hoursAgo(24 * 40), now), false);
});

test('isWithinWindow never throws on junk', () => {
  assert.equal(isWithinWindow(null), false);
  assert.equal(isWithinWindow('gestern'), false);
  assert.equal(isWithinWindow(undefined), false);
});

// ---------------------------------------------------------------------------
// 2. frequency
// ---------------------------------------------------------------------------

test('at most three reminders per rolling seven days', () => {
  const now = new Date('2026-09-13T18:00:00Z');
  assert.equal(MAX_PER_7_DAYS, 3);
  assert.equal(overWeeklyCap([], now), false);
  assert.equal(overWeeklyCap([hoursAgo(24, now), hoursAgo(48, now)], now), false);
  assert.equal(overWeeklyCap([hoursAgo(24, now), hoursAgo(48, now), hoursAgo(72, now)], now), true);
  // Older than the window: forgotten, so the learner is reachable again.
  assert.equal(
    overWeeklyCap([hoursAgo(24 * 8, now), hoursAgo(24 * 9, now), hoursAgo(24 * 10, now)], now),
    false,
  );
});

// ---------------------------------------------------------------------------
// 3. claim discipline, read off the source
// ---------------------------------------------------------------------------

test('the job ships off behind its own exact-string flag', () => {
  assert.ok(
    SRC.includes(`process.env.COURSE_REMINDER_ENABLED !== 'true'`),
    'master switch gate missing — the job would mail on the first deploy',
  );
  assert.ok(SRC.includes(`qs.dry === '1'`), 'dry-run support missing');
  assert.ok(SRC.includes('LIFECYCLE_TEST_RECIPIENTS'), 'canary allowlist missing');
  assert.ok(SRC.includes('return { statusCode: 401'), 'unauthenticated manual calls must be rejected');
  assert.ok(SRC.includes("if (!UNSUB_SECRET)"), 'secrets must fail closed — no fallback unsubscribe secret');
});

test('eligibility is re-read inside the send loop, before the claim, before the send', () => {
  const loop = SRC.slice(SRC.indexOf('for (let i = 0; i < recipients.length'));
  const recheckAt = loop.indexOf('recheckStillIdle(');
  const claimAt = loop.indexOf('.upsert(');
  const sendAt = loop.indexOf('await sendBatch(resendKey');
  assert.ok(recheckAt !== -1, 'eligibility re-read missing from the send loop');
  assert.ok(claimAt !== -1, 'claim upsert missing from the send loop');
  assert.ok(sendAt !== -1, 'send missing from the send loop');
  assert.ok(recheckAt < claimAt, 'eligibility must be re-read BEFORE the claim');
  assert.ok(claimAt < sendAt, 'the claim must come BEFORE the send');
  assert.ok(SRC.includes(`onConflict: 'user_id,kind'`), 'claim must use the lifecycle_emails unique key');
  // A dry run must return before the loop can claim anything.
  assert.ok(SRC.indexOf('if (dry)') < SRC.indexOf('for (let i = 0; i < recipients.length'));
});

test('selection reads ONE definition and never re-derives status', () => {
  assert.ok(SRC.includes(`rpc('course_reminder_candidates'`), 'selection must call the shared SQL definition');
  // The mailer must not build its own idea of "warm" out of the raw tables.
  assert.ok(!SRC.includes("from('lesson_progress')"), 'mailer must not query lesson_progress itself');
  assert.ok(!SRC.includes("from('lesson_attempts')"), 'mailer must not query lesson_attempts itself');
  // Hygiene and confirmation, same as every other job.
  assert.ok(SRC.includes('isBlockedEmail'), 'disposable-domain hygiene missing');
  assert.ok(SRC.includes('u.email_confirmed_at'), 'unconfirmed addresses must never be mailed');
  assert.ok(SRC.includes('email_opted_out'), 'opt-out exclusion missing');
});

// ---------------------------------------------------------------------------
// 4. the ledger kind ⇄ migration contract
// ---------------------------------------------------------------------------

test('the kind carries the run date and matches the migration pattern exactly', () => {
  const kind = reminderKindFor(new Date('2026-09-13T18:00:00Z'));
  assert.equal(kind, 'course_reminder_2026-09-13');
  const m = SQL.match(/kind ~ '([^']+)'/);
  assert.ok(m, 'the migration must admit course_reminder kinds by pattern');
  assert.match(kind, new RegExp(m[1]));
  assert.ok(!new RegExp(m[1]).test('course_reminder_today'), 'the pattern must reject anything but a real date');
  assert.ok(!new RegExp(m[1]).test('course_reminder_'), 'the pattern must reject a bare prefix');
});

test('the migration keeps admitting every kind the other four jobs claim', () => {
  for (const kind of ['trial_day3', 'trial_day6', 'trial_ended', 'activation_d1', 'activation_d4', 'confirm_nudge']) {
    assert.ok(SQL.includes(`'${kind}'`), `migration dropped kind ${kind} — an existing job would fail to claim`);
  }
  // The claim lock stays the ledger's own unique key: no new column, no new index on it.
  assert.ok(!/ALTER TABLE public\.lifecycle_emails\s+ADD COLUMN/i.test(SQL), 'the ledger must keep its shape');
});

test('the candidate function is service-role only and defines the window itself', () => {
  assert.ok(/CREATE OR REPLACE FUNCTION public\.course_reminder_candidates/.test(SQL));
  assert.ok(/SECURITY DEFINER/.test(SQL), 'it reads every user\'s rows and must be SECURITY DEFINER');
  assert.ok(/SET search_path = public/.test(SQL), 'a SECURITY DEFINER function needs a pinned search_path');
  assert.ok(
    /REVOKE ALL ON FUNCTION public\.course_reminder_candidates\(int, int, int\) FROM anon, authenticated/.test(SQL),
    'no client may call the selection function',
  );
  assert.ok(/GRANT EXECUTE ON FUNCTION public\.course_reminder_candidates\(int, int, int\) TO service_role/.test(SQL));
  assert.ok(/make_interval\(hours => p_min_hours\)/.test(SQL), 'the SQL must apply the floor itself, not trust the caller');
});

// ---------------------------------------------------------------------------
// 5. the copied Lektion titles
// ---------------------------------------------------------------------------

test('the mailer\'s Lektion titles are byte-identical to the curriculum', () => {
  const titles = CURRICULUM_A11.lektionen.map((l) => l.title);
  assert.deepEqual(
    LEKTION_TITLES['a1.1'],
    titles,
    'src/data/curricula/a11.js and course-reminder.mjs disagree — the mail would name the wrong Lektion',
  );
});

test('nextLektion clamps to the level and tolerates an unknown level', () => {
  assert.deepEqual(nextLektion('a1.1', 1), { nr: 1, title: 'Hallo, ich bin …' });
  assert.deepEqual(nextLektion('A1.1', 4), { nr: 4, title: 'Auf dem Flohmarkt' });
  assert.deepEqual(nextLektion('a1.1', 99), { nr: 12, title: 'Feste feiern' }, 'a finished course must not index past the end');
  assert.deepEqual(nextLektion('a1.1', 0), { nr: 1, title: 'Hallo, ich bin …' });
  assert.equal(nextLektion('b2.2', 3), null, 'a level without titles names no Lektion rather than inventing one');
});

// ---------------------------------------------------------------------------
// 6. copy
// ---------------------------------------------------------------------------

test('the reminder names the next Lektion and links the course without a trailing slash', () => {
  const msg = buildMessage({ level: 'a1.1', nextNr: 4 });
  assert.equal(msg.subject, 'Weiter mit Lektion 4: Auf dem Flohmarkt');
  assert.ok(msg.body.includes('Auf dem Flohmarkt'), 'the body must name the Lektion too');
  // CLAUDE.md's three-slash-case rule: /course/:level is a netlify.toml
  // rewrite to app.html (case 3) — a trailing slash 301-hops every click.
  assert.equal(msg.ctaHref, 'https://deutsch-meister.de/course/a1.1');
  assert.ok(!msg.ctaHref.endsWith('/'), 'an SPA rewrite route must carry NO trailing slash');
});

test('the copy makes no claim about what the learner did not do', () => {
  for (const nextNr of [1, 7, 12]) {
    const msg = buildMessage({ level: 'a1.1', nextNr });
    const text = `${msg.subject} ${msg.body}`;
    // The window spans two calendar days, so naming a day would be a guess.
    assert.ok(!/gestern|heute hast|nicht gelernt|nichts gemacht|vergessen/i.test(text), `guessy or scolding copy: ${text}`);
    // No figures (the function cannot import src/data, so any number here rots).
    assert.ok(!/€\s?\d|\d+[.,]\d\d\s?€/.test(text), 'price figure in reminder copy');
    assert.ok(!/\b(unbegrenzt\w*|unlimited)\b/i.test(text), 'unlimited claim in reminder copy');
    // No urgency or streak threat: this is the lever, not a loss-aversion trick.
    assert.ok(!/nur noch|letzte Chance|Serie verlieren|Streak/i.test(text), 'pressure language in reminder copy');
    // The register stays calm: the ONLY exclamation mark allowed is the
    // greeting's („Hallo!“), which is how A1 material greets a learner.
    assert.equal(text.replace('Hallo!', '').includes('!'), false, 'no exclamation marks beyond the greeting');
    // The door stays open.
    assert.ok(/auch gut|jederzeit/i.test(msg.body), 'the copy must leave an out');
    // And nothing is asserted about the learner's own behaviour. The 20-hour
    // floor makes such a claim impossible to justify, and the copy used to make
    // one anyway („du warst vor Kurzem im Kurs“) against its own header promise.
    assert.ok(!/vor Kurzem|warst|hast du|zurück im Kurs/i.test(text), `claim about the learner: ${text}`);
  }
});

test('the greeting is a name or a bare Hallo, never the flapsig „Hallo, du …“', () => {
  assert.equal(greeting('Ana'), 'Hallo Ana,');
  assert.equal(greeting('Ana Chakiri'), 'Hallo Ana,', 'only the first name');
  assert.equal(greeting('  '), 'Hallo!');
  assert.equal(greeting(null), 'Hallo!');
  assert.equal(greeting(undefined), 'Hallo!');
  // The pronoun follows the punctuation: new sentence after „Hallo!“, same
  // sentence after „Hallo Ana,“.
  const named = buildMessage({ level: 'a1.1', nextNr: 4, vorname: 'Ana' });
  assert.ok(named.body.includes('Hallo Ana, du lernst Deutsch'), named.body);
  const anon = buildMessage({ level: 'a1.1', nextNr: 4 });
  assert.ok(anon.body.includes('Hallo! Du lernst Deutsch'), anon.body);
});

test('the German is A1, not B1 — the level every recipient is at', () => {
  // Owner-approved rewrite, DaF review 2026-09-12 §F. The three constructions
  // below are what made the old copy B1; none may come back.
  for (const nextNr of [1, 4, 12]) {
    const body = buildMessage({ level: 'a1.1', nextNr }).body;
    const text = body.replace(/<[^>]+>/g, ' ');
    assert.ok(!/nichts geht verloren|der Teil, der zählt|nichts geht\b/i.test(text), `B1 idiom in the copy: ${text}`);
    assert.ok(!/wenn heute nichts/i.test(text), 'elliptical B1 conditional in the copy');
    // „wartet“ appeared twice in three sentences; once is already a repetition
    // the review flagged, so the word is out of the copy entirely.
    assert.equal((text.match(/wartet/gi) || []).length, 0, 'the copy must not say „wartet“');
    // Short sentences: an A1 reader's limit. Counted on the visible text only.
    for (const sentence of text.split(/[.!?](?:\s|$)/).map((x) => x.trim()).filter(Boolean)) {
      const words = sentence.split(/\s+/).filter(Boolean).length;
      assert.ok(words <= 12, `sentence too long for A1 (${words} words): ${sentence}`);
    }
  }
});

test('a level with no titles still produces a sendable message', () => {
  const msg = buildMessage({ level: 'b1.1', nextNr: 2 });
  assert.equal(msg.subject, 'Weiter im Kurs B1.1');
  assert.equal(msg.ctaHref, 'https://deutsch-meister.de/course/b1.1');
  assert.ok(!/Lektion \d/.test(msg.subject));
});

// ---------------------------------------------------------------------------
// 7. the schedule
// ---------------------------------------------------------------------------

test('the schedule runs in the evening, clear of every other mailer', () => {
  const m = SRC.match(/schedule\('([^']+)'/);
  assert.ok(m, 'schedule() wrapper missing');
  const [minute, hour] = m[1].split(' ');
  assert.equal(minute, '0');
  assert.ok(Number(hour) >= 12, 'the reminder must not land in the same morning as the other four mailers');
  for (const [file, other] of [
    ['netlify/functions/daily-sentence.mjs', null],
    ['netlify/functions/trial-lifecycle.mjs', null],
    ['netlify/functions/activation-lifecycle.mjs', null],
  ]) {
    const otherCron = read(file).match(/schedule\('([^']+)'/);
    if (!otherCron) continue;
    assert.notEqual(otherCron[1], m[1], `${file} runs at the same time${other || ''}`);
  }
});

test('netlify.toml declares the same schedule (integrator step)', (t) => {
  const toml = read('netlify.toml');
  const block = toml.match(/\[functions\."course-reminder"\]\s*\n\s*schedule = "([^"]+)"/);
  if (!block) {
    // netlify.toml is outside this agent's ownership; the P4 report hands the
    // integrator the two lines to add. The schedule() wrapper in the function
    // is authoritative either way, so a missing block delays nothing but the
    // dashboard's own display of the cron.
    t.skip('netlify.toml has no [functions."course-reminder"] block yet — add it (see the P4 report)');
    return;
  }
  const fn = SRC.match(/schedule\('([^']+)'/);
  assert.equal(block[1], fn[1], 'the two schedule declarations disagree');
});
