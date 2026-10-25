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
//   5. THE COPIED COURSE TABLES. A Netlify function cannot import the SPA's
//      curriculum modules, so the Lektion titles and the checkpoints are
//      duplicated in the mailer. This suite is the drift guard — it compares
//      both tables to every live curriculum in CURRICULA (A1.2 since
//      2026-10-25; until then A1.2 learners got the generic mail).
//   6. THE COPY: the next step only, never a claim about the learner, A1
//      German, and Sie (course mail speaks Sie, CLAUDE.md; the reminder said du
//      until 2026-10-25). The button opens the step it names, tagged
//      (docs/tracking-links.md), and the unsubscribe page answers in German.
//      tests/course-reminder-checkpoints.test.mjs holds the step selection.
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
  LEKTION_TITLES, CHECKPOINT_AFTER, nextLektion, checkpointFor, buildMessage, greeting,
  reminderItem, FOOTER_HREF,
} from '../netlify/functions/course-reminder.mjs';
import { CURRICULA } from '../src/data/curricula/index.js';

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
  // Since 2026-10-25 it reads lesson_progress for ONE thing, the step to name
  // (which Lektionen and checkpoints are done, all time): one read, ids and
  // status only. No timestamp is selected, so no activity window can be built
  // here; who is due stays the SQL's answer.
  const reads = [...SRC.matchAll(/\.from\('lesson_progress'\)\s*\.select\('([^']*)'\)/g)];
  assert.equal((SRC.match(/from\('lesson_progress'\)/g) || []).length, 1, 'one lesson_progress read, for the step only');
  assert.equal(reads.length, 1, 'the lesson_progress read must name its columns');
  assert.deepEqual(reads[0][1].split(',').map((c) => c.trim()).sort(), ['lektion_id', 'status', 'user_id'], 'the step read selects ids and status, never a timestamp');
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

test('the mailer\'s Lektion titles are byte-identical to every live curriculum', () => {
  assert.deepEqual(Object.keys(LEKTION_TITLES).sort(), Object.keys(CURRICULA).sort(), 'a live level without titles here gets the generic mail');
  for (const [level, curriculum] of Object.entries(CURRICULA)) {
    assert.deepEqual(
      LEKTION_TITLES[level],
      curriculum.lektionen.map((l) => l.title),
      `src/data/curricula (${level}) and course-reminder.mjs disagree — the mail would name the wrong Lektion`,
    );
  }
});

test('the mailer\'s checkpoints are the curriculum\'s: number, the Lektion that closes the chapter, title', () => {
  assert.deepEqual(Object.keys(CHECKPOINT_AFTER).sort(), Object.keys(CURRICULA).sort());
  for (const [level, curriculum] of Object.entries(CURRICULA)) {
    assert.deepEqual(
      CHECKPOINT_AFTER[level],
      curriculum.checkpoints.map(({ nr, afterLektion, title }) => ({ nr, afterLektion, title })),
      `${level}: the mail would name the wrong checkpoint, or a Lektion the course home still locks`,
    );
  }
  assert.deepEqual(checkpointFor('a1.2', 2), { nr: 2, afterLektion: 6, title: 'Checkpoint 2: Lektion 4–6', fromLektion: 4 });
  assert.equal(checkpointFor('a1.1', 9), null);
});

test('nextLektion names a Lektion of the level, never one past the end, and tolerates an unknown level', () => {
  assert.deepEqual(nextLektion('a1.1', 1), { nr: 1, title: 'Hallo, ich bin …' });
  assert.deepEqual(nextLektion('A1.1', 4), { nr: 4, title: 'Auf dem Flohmarkt' });
  assert.deepEqual(nextLektion('a1.2', 5), { nr: 5, title: 'Pläne für das Wochenende' });
  // Until 2026-10-25, 13 was clamped to 12: "Weiter mit Lektion 12" to a learner who had finished it.
  assert.equal(nextLektion('a1.1', 13), null, 'a finished course names no Lektion');
  assert.equal(nextLektion('a1.1', 99), null);
  assert.deepEqual(nextLektion('a1.1', 0), { nr: 1, title: 'Hallo, ich bin …' });
  assert.equal(nextLektion('b2.2', 3), null, 'a level without titles names no Lektion rather than inventing one');
});

// ---------------------------------------------------------------------------
// 6. copy
// ---------------------------------------------------------------------------

const TAGS = 'utm_source=email&utm_medium=lifecycle&utm_campaign=course-reminder';

test('the reminder names the next Lektion and its button opens that Lektion, tagged, without a trailing slash', () => {
  const msg = buildMessage({ level: 'a1.1', nextNr: 4 });
  assert.equal(msg.subject, 'Weiter mit Lektion 4: Auf dem Flohmarkt');
  assert.ok(msg.body.includes('Auf dem Flohmarkt'), 'the body must name the Lektion too');
  assert.equal(msg.ctaLabel, 'Lektion 4 öffnen →');
  // The button names a Lektion, so it opens that Lektion (it opened the course
  // home until 2026-10-25). CLAUDE.md's three-slash-case rule: /course/... is a
  // netlify.toml rewrite to app.html (case 3) — no trailing slash.
  assert.equal(msg.ctaHref, `https://deutsch-meister.de/course/a1.1/l/4?${TAGS}&utm_content=cta`);
  assert.ok(!new URL(msg.ctaHref).pathname.endsWith('/'), 'an SPA rewrite route must carry NO trailing slash');
});

test('an open checkpoint is named and linked as the course home names and links it', () => {
  const msg = buildMessage({ level: 'a1.1', checkpointNr: 1 });
  assert.equal(msg.subject, 'Weiter mit Checkpoint 1: Lektion 1–3');
  assert.equal(msg.ctaLabel, 'Checkpoint 1 öffnen →');
  assert.equal(msg.ctaHref, `https://deutsch-meister.de/course/a1.1/checkpoint/1?${TAGS}&utm_content=cta`);
  assert.ok(msg.body.includes('Er wiederholt Lektion 1 bis 3.'), msg.body);
  assert.ok(!/Lektion 4/.test(`${msg.subject} ${msg.body}`), 'never the Lektion the course home still locks');
});

test('the footer link is tagged; the unsubscribe link asks for the German page and is the List-Unsubscribe header', () => {
  process.env.UNSUB_SECRET = process.env.UNSUB_SECRET || 'test-only-unsub-secret';
  assert.equal(FOOTER_HREF, `https://deutsch-meister.de/?${TAGS}&utm_content=footer`);
  const id = '00000000-0000-4000-8000-000000000001';
  const item = reminderItem({ id, email: 'learner@example.test', level: 'a1.1', nextNr: 4 });
  const hrefs = [...item.html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  assert.ok(hrefs.includes(FOOTER_HREF));
  const unsub = hrefs.find((h) => h.includes('/.netlify/functions/unsubscribe'));
  assert.match(unsub, /&lang=de$/);
  assert.equal(item.headers['List-Unsubscribe'], `<${unsub}>`);
  assert.equal(item.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
  assert.match(item.html, />E-Mails von DeutschMeister abbestellen</, 'the link says what it stops: every DeutschMeister mail, not just these');
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
    // greeting's („Guten Tag!“), which is how A1 material greets a learner.
    assert.equal(text.replace(greeting(null), '').includes('!'), false, 'no exclamation marks beyond the greeting');
    // The door stays open.
    assert.ok(/auch gut|jederzeit/i.test(msg.body), 'the copy must leave an out');
    // And nothing is asserted about the learner's own behaviour. The 20-hour
    // floor makes such a claim impossible to justify, and the copy used to make
    // one anyway („du warst vor Kurzem im Kurs“) against its own header promise.
    assert.ok(!/vor Kurzem|warst|hast du|zurück im Kurs/i.test(text), `claim about the learner: ${text}`);
  }
});

test('the reminder speaks Sie: „Guten Tag!“, never du, dich, dir or dein (CLAUDE.md, course mail)', () => {
  assert.equal(greeting('Ana'), 'Guten Tag, Ana!');
  assert.equal(greeting('Ana Chakiri'), 'Guten Tag, Ana!', 'only the first name');
  assert.equal(greeting('  '), 'Guten Tag!');
  assert.equal(greeting(null), 'Guten Tag!');
  assert.equal(greeting(undefined), 'Guten Tag!');
  const named = buildMessage({ level: 'a1.1', nextNr: 4, vorname: 'Ana' });
  assert.ok(named.body.includes('Guten Tag, Ana! Sie lernen Deutsch — sehr gut.'), named.body);
  const anon = buildMessage({ level: 'a1.1', nextNr: 4 });
  assert.ok(anon.body.includes('Guten Tag! Sie lernen Deutsch — sehr gut.'), anon.body);
  // Every shape the mail can take: a Lektion, a checkpoint, a level with no tables.
  const shapes = [
    ...[1, 4, 12].map((nextNr) => ({ level: 'a1.1', nextNr })),
    { level: 'a1.2', nextNr: 7, vorname: 'Ana' },
    { level: 'a1.1', checkpointNr: 4 },
    { level: 'b1.1' },
  ];
  for (const shape of shapes) {
    const msg = buildMessage(shape);
    const text = `${msg.subject} ${msg.ctaLabel} ${msg.body}`.replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(text, /\b(du|Du|dich|Dich|dir|Dir|dein\w*|Dein\w*)\b/, `du in reminder copy: ${text}`);
    assert.match(text, /Sie können jederzeit aufhören\./, 'the door stays open, in Sie');
  }
});

test('the German is A1, not B1 — the level every recipient is at', () => {
  // Owner-approved rewrite, DaF review 2026-09-12 §F. The three constructions
  // below are what made the old copy B1; none may come back.
  for (const shape of [1, 4, 12].map((nextNr) => ({ level: 'a1.1', nextNr })).concat([{ level: 'a1.1', checkpointNr: 2 }, { level: 'b1.1' }])) {
    const body = buildMessage(shape).body;
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

test('a level with no titles, or no step at all, still produces a sendable message naming nothing', () => {
  const msg = buildMessage({ level: 'b1.1', nextNr: 2 });
  assert.equal(msg.subject, 'Weiter im Kurs B1.1');
  assert.equal(msg.ctaHref, `https://deutsch-meister.de/course/b1.1?${TAGS}&utm_content=cta`);
  assert.ok(!/Lektion \d/.test(msg.subject));
  // A finished A1.1 never reads "Weiter mit Lektion 12" again (the 13 → 12 clamp).
  for (const msg2 of [buildMessage({ level: 'a1.1', nextNr: 13 }), buildMessage({ level: 'a1.1' })]) {
    assert.equal(msg2.subject, 'Weiter im Kurs A1.1');
    assert.ok(!/Lektion \d/.test(`${msg2.subject} ${msg2.ctaLabel} ${msg2.body}`), msg2.body);
  }
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
