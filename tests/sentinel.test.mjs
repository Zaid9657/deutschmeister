// Guard suite for the hourly sentinel (netlify/functions/sentinel.mjs,
// _shared/sentinelLib.mjs, migrations/2026-09-29-agent-incidents.sql).
//
//   1. Each check is a pure function over fetched data and flags exactly what
//      it should: a good page passes; a 404, an empty <title>, two <h1>, an
//      empty body, a broken app shell each fire; a webhook backlog fires but a
//      recovered or too-young failure does not; the signup drop honours both
//      thresholds and the ≥3 average guard; an SLA breach fires only while
//      unanswered; a gated-off or evidence-less job is skipped, never guessed.
//   2. Thresholds are READ, not hard-coded: moving one flips the boundary case
//      (a cheap mutation check), and the values are pinned.
//   3. The run end to end against an in-memory database and fetch: claim
//      before send (a second run mails nothing), mailed_elsewhere and
//      SENTINEL_MUTE suppression, the kill switch, OWNER_ALERT_EMAIL fail-closed,
//      no claim → no digest, dry mode writes nothing, and resolution only by a
//      check that ran. Supabase unreachable (a failed probe or claim) sends ONE
//      stateless fallback mail per run instead, under the same switch, mute
//      (db-down) and fail-closed rules.
//   4. The migration is service-role only and idempotent, its CHECK lists equal
//      the JS lists, and the schedule is declared identically in netlify.toml.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  OWNER_AGENTS, SEVERITIES, SENTINEL_THRESHOLDS, KEY_PAGES,
  inspectHtml, checkPage, checkWebhooks, checkPaymentFailures, checkSignups, checkJobs,
  checkSpeakingCloseout, checkSupportSla, checkSpeakingFlows, checkDatabase,
  shouldResolve, parseMute, selectForMail, renderDigest,
} from '../netlify/functions/_shared/sentinelLib.mjs';
import { SCHEDULED_JOBS, isJobKind, jobStaleness } from '../netlify/functions/_shared/adminStatusLib.mjs';
import { runSentinel } from '../netlify/functions/sentinel.mjs';
// §5: a quiet day is not an outage.
import { LEDGER_JOB_DUE, dailyRunTimes, dueSpan, needsDueCheck, countDue, parseCanary } from '../netlify/functions/_shared/sentinelLib.mjs';
import { DUE_READERS } from '../netlify/functions/sentinel.mjs';
import { selectRecipients as trialRecipients } from '../netlify/functions/trial-lifecycle.mjs';
import { selectCandidates as activationCandidates } from '../netlify/functions/activation-lifecycle.mjs';
import { selectCandidates as nudgeCandidates } from '../netlify/functions/confirmation-nudge.mjs';
import { windowHoursFor, WINDOW_HOURS } from '../netlify/functions/course-reminder.mjs';
// §6: the team's dead-man switch.
import { checkHeartbeat, isMissingRelation, HEARTBEAT_THRESHOLD_HOURS, TEAM_SESSION_ID } from '../netlify/functions/_shared/sentinelLib.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const NOW = new Date('2026-09-29T10:50:00Z');
const DAY = '2026-09-29';
const ago = (h, from = NOW) => new Date(from.getTime() - h * 3600000).toISOString();
const page = (path) => KEY_PAGES.find((p) => p.path === path);

// ─── HTML fixtures ───────────────────────────────────────────────────────────

const PROSE = 'Das Verb sein ist das wichtigste Verb im Deutschen. '.repeat(8); // ~400 chars
const astroHtml = ({ title = 'Das Verb sein | DeutschMeister', h1s = ['Das Verb „sein“'], body = PROSE } = {}) => `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><title>${title}</title></head>
<body><header><nav>Grammatik Kurse Preise Leitfäden Prüfungen Anmelden Registrieren Hilfe</nav></header>
<!-- <h1>a comment is not a heading</h1> -->
<main id="main" class="pt-16">${h1s.map((h) => `<h1 class="x">${h}</h1>`).join('')}<p>${body}</p></main>
<footer>Impressum Datenschutz Kontakt Über uns FAQ Vergleich Leitfaden Podcasts Hören Lesen</footer></body></html>`;
const prerenderedHtml = ({ root = `<h1>Häufige Fragen</h1><p>${PROSE}</p>` } = {}) => `<!doctype html>
<html lang="de"><head><title>FAQ | DeutschMeister</title><script type="module" crossorigin src="/assets/index-abc.js"></script></head>
<body><div id="root">${root}</div><noscript><h1>DeutschMeister</h1><p>${PROSE}</p></noscript></body></html>`;
const shellHtml = ({ root = true, module = true } = {}) => `<!doctype html>
<html lang="en"><head><title>Learn German Grammar A1–B2 | DeutschMeister</title>
${module ? '<script type="module" crossorigin src="/assets/index-abc.js"></script>' : '<script src="/consent.js" defer></script>'}</head>
<body>${root ? '<div id="root"></div>' : '<div id="app"></div>'}<noscript><h1>DeutschMeister</h1><p>${PROSE}</p></noscript></body></html>`;

const goodHtmlFor = (p) => (p.kind === 'spa' ? shellHtml() : p.kind === 'prerendered' ? prerenderedHtml() : astroHtml());

// ─── 1. checks ───────────────────────────────────────────────────────────────

test('inspectHtml ignores comments and the crawler <noscript> block', () => {
  const info = inspectHtml(astroHtml());
  assert.equal(info.title, 'Das Verb sein | DeutschMeister');
  assert.equal(info.h1Count, 1, 'the commented-out <h1> does not count');
  assert.ok(info.bodyChars >= 250, `main text measured, got ${info.bodyChars}`);
  const shell = inspectHtml(shellHtml());
  assert.equal(shell.h1Count, 0, 'the noscript <h1> does not count');
  assert.equal(shell.bodyChars, 0, 'the noscript prose does not make an empty shell look full');
  assert.ok(shell.hasRoot && shell.hasModule);
});

test('a good page passes every sub-check and fires nothing', () => {
  for (const p of KEY_PAGES) {
    const r = checkPage(p, { status: 200, html: goodHtmlFor(p) }, NOW);
    assert.deepEqual(r.incidents, [], p.path);
    const subs = p.kind === 'spa' ? ['status', 'title', 'shell'] : ['status', 'title', 'h1', 'body'];
    assert.deepEqual(r.passing, subs.map((s) => `page:${p.path}:${s}`), p.path);
  }
});

test('a 404 (or a failed fetch) is one status incident with a stable per-day key', () => {
  const r = checkPage(page('/pricing/'), { status: 404, html: '' }, NOW);
  assert.equal(r.incidents.length, 1);
  const [i] = r.incidents;
  assert.equal(i.key, `page:/pricing/:status:${DAY}`);
  assert.equal(i.check_id, 'page:/pricing/:status');
  assert.equal(i.owner_agent, 'website');
  assert.equal(i.severity, 'critical', '/pricing/ is a money page');
  assert.match(i.title, /HTTP 404/);
  assert.ok(i.hint.length > 10);
  assert.deepEqual(r.passing, [], 'nothing else was evaluated, so nothing may be resolved');

  const grammar = checkPage(page('/grammar/a1.1/verb-sein/'), { error: 'timeout after 8000 ms' }, NOW);
  assert.equal(grammar.incidents[0].severity, 'high');
  assert.equal(grammar.incidents[0].owner_agent, 'seo', 'grammar content pages belong to seo');
  assert.match(grammar.incidents[0].title, /fetch failed/);
  assert.equal(grammar.incidents[0].detail.status, 0);
});

test('missing title, two h1, and an empty body each fire their own incident', () => {
  const noTitle = checkPage(page('/'), { status: 200, html: astroHtml({ title: '  ' }) }, NOW);
  assert.deepEqual(noTitle.incidents.map((i) => i.key), [`page:/:title:${DAY}`]);

  const twoH1 = checkPage(page('/leitfaden/telc-b1/'), { status: 200, html: astroHtml({ h1s: ['A', 'B'] }) }, NOW);
  assert.deepEqual(twoH1.incidents.map((i) => i.check_id), ['page:/leitfaden/telc-b1/:h1']);
  assert.equal(twoH1.incidents[0].detail.h1Count, 2);
  assert.equal(twoH1.incidents[0].owner_agent, 'seo');

  const emptyAstro = checkPage(page('/vergleich/'), { status: 200, html: astroHtml({ body: '' }) }, NOW);
  assert.deepEqual(emptyAstro.incidents.map((i) => i.check_id), ['page:/vergleich/:body'], 'header + footer around an empty <main> is empty');

  const emptyPrerender = checkPage(page('/faq/'), { status: 200, html: prerenderedHtml({ root: '<h1>FAQ</h1>' }) }, NOW);
  assert.deepEqual(emptyPrerender.incidents.map((i) => i.check_id), ['page:/faq/:body']);
  assert.equal(emptyPrerender.incidents[0].severity, 'high');
  assert.ok(emptyPrerender.passing.includes('page:/faq/:h1'));
});

test('the SPA shell skips the h1 and body rules but must be a shell', () => {
  const ok = checkPage(page('/support'), { status: 200, html: shellHtml() }, NOW);
  assert.deepEqual(ok.incidents, []);
  const broken = checkPage(page('/support'), { status: 200, html: shellHtml({ root: false }) }, NOW);
  assert.deepEqual(broken.incidents.map((i) => i.check_id), ['page:/support:shell']);
  const noModule = checkPage(page('/support'), { status: 200, html: shellHtml({ module: false }) }, NOW);
  assert.deepEqual(noModule.incidents.map((i) => i.check_id), ['page:/support:shell']);
});

test('the key-page list covers the pages the brief names, with valid owners and the three slash cases', () => {
  const paths = KEY_PAGES.map((p) => p.path);
  for (const p of ['/', '/pricing/', '/grammar/', '/courses/', '/leitfaden/', '/vergleich/', '/level-test/', '/faq/', '/support']) {
    assert.ok(paths.includes(p), p);
  }
  assert.ok(paths.some((p) => /^\/grammar\/a\d\.\d\/[a-z-]+\/$/.test(p)), 'one grammar lesson');
  assert.ok(paths.some((p) => /^\/leitfaden\/[a-z0-9-]+\/$/.test(p)), 'one guide');
  for (const p of KEY_PAGES) {
    assert.ok(OWNER_AGENTS.includes(p.owner), p.path);
    assert.equal(p.path.endsWith('/'), p.kind !== 'spa', `${p.path}: Astro and prerendered routes end in /, SPA rewrites do not`);
  }
  // The grammar lesson must be one the build produces.
  const cache = JSON.parse(read('grammar-content-cache.json'));
  const [, , level, slug] = paths.find((p) => p.startsWith('/grammar/a')).split('/');
  assert.ok(cache.topics.some((t) => t.slug === slug && t.sub_level.toLowerCase() === level), `${level}/${slug} is not in the grammar cache`);
  assert.ok(read('astro-site/src/data/guides/index.js').includes("'telc-b1'") || read('astro-site/src/data/guides/index.js').includes('telc-b1'));
});

test('webhooks: an unrecovered failure past the grace period fires; a young or recovered one does not', () => {
  const rows = [
    { id: 11, event_type: 'order_created', processed: false, error: 'insert failed', created_at: ago(2), data_id: '900' },
    { id: 12, event_type: 'subscription_updated', processed: false, error: 'boom', created_at: ago(0.1), data_id: '901' }, // 6 min old
    { id: 13, event_type: 'order_created', processed: false, error: 'x', created_at: ago(5), data_id: '902' },
    { id: 14, event_type: 'order_created', processed: true, error: null, created_at: ago(4), data_id: '902' }, // retry recovered 13
    { id: 15, event_type: 'order_created', processed: true, error: null, created_at: ago(1), data_id: '903' },
  ];
  const r = checkWebhooks(rows, NOW);
  assert.deepEqual(r.incidents.map((i) => i.key), ['webhook:11']);
  assert.equal(r.incidents[0].owner_agent, 'revenue');
  assert.equal(r.incidents[0].severity, 'high');
  assert.equal(r.incidents[0].mailed_elsewhere, false, 'a processing failure is NOT the payment-failed mail');
  assert.deepEqual(r.passing, ['webhook:13'], 'only a recovered failure may be resolved');
  // grace mutation: with no grace the 6-minute-old failure fires too
  const noGrace = checkWebhooks(rows, NOW, { ...SENTINEL_THRESHOLDS, webhookGraceMinutes: 0 });
  assert.deepEqual(noGrace.incidents.map((i) => i.key), ['webhook:11', 'webhook:12']);
});

test('renewal payment failures are logged as mailed elsewhere, never resolved by absence', () => {
  const r = checkPaymentFailures([{ id: 'p1', lemonsqueezy_event_id: 'evt_9', lemonsqueezy_subscription_id: 'sub_3', failed_at: ago(3) }]);
  assert.equal(r.incidents[0].key, 'payment-failed:evt_9');
  assert.equal(r.incidents[0].mailed_elsewhere, true);
  assert.deepEqual(r.passing, []);
});

test('signup drop: < 40 % of the 7-day average with an average ≥ 3, or zero in 24 h', () => {
  const keys = (last24, prior7, T) => checkSignups({ last24, prior7 }, NOW, T).incidents.map((i) => i.key);
  // average 5/day → the line is 2.0
  assert.deepEqual(keys(1, 35), [`signups:drop:${DAY}`]);
  assert.deepEqual(keys(2, 35), [], 'exactly 40 % is not a drop (strict <)');
  // the ≥ 3 guard: average exactly 3 counts, 20/7 = 2.86 does not
  assert.deepEqual(keys(1, 21), [`signups:drop:${DAY}`]);
  assert.deepEqual(keys(1, 20), [], 'a baseline under 3/day is too small to judge a drop');
  // zero is always an incident, even on a tiny or empty baseline
  assert.deepEqual(keys(0, 35), [`signups:zero:${DAY}`], 'zero wins over drop: one incident, not two');
  assert.deepEqual(keys(0, 0), [`signups:zero:${DAY}`]);
  const zero = checkSignups({ last24: 0, prior7: 35 }, NOW).incidents[0];
  assert.equal(zero.severity, 'high');
  assert.equal(zero.owner_agent, 'acquisition');
  assert.equal(zero.detail.dailyAvg, 5);
  assert.deepEqual(checkSignups({ last24: 5, prior7: 35 }, NOW).passing, ['signups']);
  // mutations: the thresholds are read, not hard-coded
  assert.deepEqual(keys(1, 35, { ...SENTINEL_THRESHOLDS, signupDropRatio: 0.2 }), [], 'ratio 0.2 → line 1.0, 1 is not below');
  assert.deepEqual(keys(2, 35, { ...SENTINEL_THRESHOLDS, signupDropRatio: 0.5 }), [`signups:drop:${DAY}`]);
  assert.deepEqual(keys(1, 21, { ...SENTINEL_THRESHOLDS, signupMinDailyAvg: 4 }), []);
});

test('the thresholds are pinned (a change is a decision, not a drive-by)', () => {
  assert.deepEqual({ ...SENTINEL_THRESHOLDS }, {
    minBodyChars: 250,
    webhookGraceMinutes: 15,
    webhookWindowHours: 48,
    signupDropRatio: 0.4,
    signupMinDailyAvg: 3,
    zeroTurnRatio: 0.5,
    minSpeakingSessions: 5,
    closeoutMissedMinutes: 90,
  });
  const src = read('scripts/check-built-html.mjs');
  assert.match(src, new RegExp(`MIN_BODY_CHARS = ${SENTINEL_THRESHOLDS.minBodyChars};`), 'same body floor as the build check');
  // body floor mutation: a 250-char floor flags 200 chars; a 150 floor does not
  const html = astroHtml({ body: 'x'.repeat(200) });
  assert.equal(checkPage(page('/'), { status: 200, html }, NOW).incidents.length, 1);
  assert.equal(checkPage(page('/'), { status: 200, html }, NOW, { ...SENTINEL_THRESHOLDS, minBodyChars: 150 }).incidents.length, 0);
});

test('support SLA: a breached, unanswered ticket fires; answered or on-track ones do not', () => {
  const tickets = [
    { id: 't-1', reference: 'DM-AAAA0001', status: 'new', priority: 'high', sla_due_at: ago(1), first_response_at: null },
    { id: 't-2', reference: 'DM-AAAA0002', status: 'open', priority: 'normal', sla_due_at: ago(3), first_response_at: ago(10) },
    { id: 't-3', reference: 'DM-AAAA0003', status: 'open', priority: 'normal', sla_due_at: ago(-5), first_response_at: null },
    { id: 't-4', reference: 'DM-AAAA0004', status: 'waiting_user', priority: 'low', sla_due_at: ago(30), first_response_at: null },
  ];
  const r = checkSupportSla(tickets, NOW);
  assert.deepEqual(r.incidents.map((i) => i.key), [`support-sla:t-1:${DAY}`, `support-sla:t-4:${DAY}`]);
  assert.deepEqual(r.incidents.map((i) => i.severity), ['high', 'medium']);
  assert.ok(r.incidents.every((i) => i.owner_agent === 'support'));
  assert.match(r.incidents[0].hint, /DM-AAAA0001/);
  assert.deepEqual(r.passing, ['support-sla:'], 'every open ticket was read, so the family can resolve');
});

test('scheduled jobs reuse adminStatusLib: gated-off and evidence-less jobs are skipped, stale ones fire', () => {
  const byId = Object.fromEntries(SCHEDULED_JOBS.map((j) => [j.id, j]));
  assert.ok(isJobKind(byId['job-trial'], 'trial_d3') && !isJobKind(byId['job-trial'], 'activation_d1'));
  assert.ok(isJobKind(byId['job-confirm'], 'confirm_nudge') && !isJobKind(byId['job-confirm'], 'confirm_nudge_x'));
  assert.equal(jobStaleness(byId['job-trial'], ago(31), NOW).state, 'degraded');

  const env = { LIFECYCLE_ACTIVATION_ENABLED: 'true', CONFIRM_NUDGE_ENABLED: 'false' };
  const evidence = [
    { job: byId['job-trial'], last: ago(31) }, // one missed run
    { job: byId['job-activation'], last: ago(60) }, // two missed runs
    { job: byId['job-confirm'], last: ago(500) }, // gated off
    { job: byId['job-course'], last: null }, // gate unset → skipped before evidence
    { job: byId['job-weekly'], last: ago(9 * 24) },
  ];
  const r = checkJobs(evidence, NOW, env);
  assert.deepEqual(r.incidents.map((i) => [i.key, i.owner_agent, i.severity]), [
    [`job-trial:stale:${DAY}`, 'retention', 'medium'],
    [`job-activation:stale:${DAY}`, 'retention', 'high'],
    [`job-weekly:stale:${DAY}`, 'website', 'medium'],
  ]);
  assert.deepEqual(r.skipped.map((s) => s.check), ['job-confirm', 'job-course']);
  assert.match(r.skipped[0].reason, /gated off/);

  const none = checkJobs([{ job: byId['job-trial'], last: null }], NOW, {});
  assert.deepEqual(none.incidents, []);
  assert.deepEqual(none.passing, [], 'no evidence is not a pass');
  assert.match(none.skipped[0].reason, /No evidence/);
  assert.deepEqual(checkJobs([{ job: byId['job-trial'], last: ago(2) }], NOW, {}).passing, ['job-trial']);
});

test('speaking-closeout is watched by its effect, with the closeout’s own staleness rule', () => {
  const fresh = { session_token: 'a', status: 'active', started_at: ago(0.5), planned_minutes: 10 };
  const late = { session_token: 'b', status: 'active', started_at: ago(3), planned_minutes: 10 }; // deadline 2h48m ago
  const edge = { session_token: 'c', status: 'active', started_at: ago(1.5), planned_minutes: 10 }; // deadline 78 min ago
  assert.deepEqual(checkSpeakingCloseout([fresh, edge], NOW).passing, ['job-speaking-closeout']);
  const r = checkSpeakingCloseout([fresh, late, edge], NOW);
  assert.equal(r.incidents.length, 1);
  assert.equal(r.incidents[0].detail.count, 1);
  assert.equal(r.incidents[0].owner_agent, 'product');
  assert.equal(checkSpeakingCloseout([edge], NOW, { ...SENTINEL_THRESHOLDS, closeoutMissedMinutes: 60 }).incidents.length, 1, 'the grace is read');
});

test('speaking flows: judged only with ≥ 5 sessions; zero-turn share and evaluation coverage', () => {
  const s = (i, status, turns, mode = 'free') => ({ session_token: `s${i}`, status, mode, user_turns: turns, evaluated: status === 'completed', created_at: ago(2) });
  const four = [s(1, 'cancelled', 0), s(2, 'cancelled', 0), s(3, 'cancelled', 0), s(4, 'completed', 5)];
  const small = checkSpeakingFlows(four, [], NOW);
  assert.deepEqual(small.incidents, []);
  assert.deepEqual(small.passing, []);
  assert.deepEqual(small.skipped.map((x) => x.check), ['flow:speaking-zero-turn', 'flow:eval-coverage']);

  const bad = [...four, s(5, 'completed', 0), s(6, 'completed', 4), s(7, 'active', 0), s(8, 'cancelled', 0, 'placement')];
  // ended, non-placement: 1–6 → zero-turn: 1,2,3 (cancelled) + 5 (completed, 0 turns) = 4 of 6
  const evals = [{ session_token: 's4', score: 80 }, { session_token: 's6', score: 70 }, { session_token: 's5', score: 10 }];
  const r = checkSpeakingFlows(bad, evals, NOW);
  assert.deepEqual(r.incidents.map((i) => i.check_id), ['flow:speaking-zero-turn']);
  assert.equal(r.incidents[0].detail.zeroTurn, 4);
  assert.equal(r.incidents[0].detail.ended, 6);
  assert.deepEqual(r.skipped.map((x) => x.check), ['flow:eval-coverage'], '3 completed sessions is below the floor');

  const good = [1, 2, 3, 4, 5].map((i) => s(i, 'completed', 3)).concat([s(6, 'cancelled', 0)]);
  const g = checkSpeakingFlows(good, [1, 2, 3, 4, 5].map((i) => ({ session_token: `s${i}`, score: 70 })), NOW);
  assert.deepEqual(g.incidents, []);
  assert.deepEqual(g.passing, ['flow:speaking-zero-turn', 'flow:eval-coverage']);

  const unevaluated = checkSpeakingFlows(good, [{ session_token: 's1', score: 70 }], NOW);
  assert.deepEqual(unevaluated.incidents.map((i) => [i.check_id, i.severity]), [['flow:eval-coverage', 'high']], '1 of 5 = 0.2 is critical');
  // ratio mutation: at 0.7 the 4-of-6 share (0.67) no longer fires
  assert.deepEqual(checkSpeakingFlows(bad, evals, NOW, { ...SENTINEL_THRESHOLDS, zeroTurnRatio: 0.7 }).incidents, []);
});

test('database latency is judged by the Monitoring threshold', () => {
  assert.deepEqual(checkDatabase(120, NOW).passing, ['db:latency']);
  assert.equal(checkDatabase(2500, NOW).incidents[0].severity, 'medium');
  assert.equal(checkDatabase(9000, NOW).incidents[0].severity, 'high');
  assert.deepEqual(checkDatabase(null, NOW), { incidents: [], passing: [] });
});

test('resolution needs a passing check; mute and mailed_elsewhere keep incidents out of the mail', () => {
  const firing = new Set(['page:/:title']);
  assert.equal(shouldResolve({ check_id: 'page:/:status' }, ['page:/:status'], firing), true);
  assert.equal(shouldResolve({ check_id: 'page:/:title' }, ['page:/:title'], firing), false, 'still firing');
  assert.equal(shouldResolve({ check_id: 'page:/:h1' }, ['page:/:status'], firing), false, 'not evaluated this run');
  assert.equal(shouldResolve({ check_id: 'support-sla:t-9' }, ['support-sla:'], firing), true, 'family prefix');
  assert.equal(shouldResolve({ check_id: null }, ['support-sla:'], firing), false);

  const mute = parseMute(' signups , page:/faq/ ,');
  assert.deepEqual(mute, ['signups', 'page:/faq/']);
  const a = { check_id: 'signups', mailed_elsewhere: false };
  const b = { check_id: 'page:/faq/:body', mailed_elsewhere: false };
  const c = { check_id: 'payment-failed:e', mailed_elsewhere: true };
  const d = { check_id: 'webhook:1', mailed_elsewhere: false };
  const sel = selectForMail([a, b, c, d], mute);
  assert.deepEqual(sel.mail, [d]);
  assert.deepEqual(sel.muted, [a, b]);
  assert.deepEqual(sel.mailedElsewhere, [c]);
});

test('the digest groups by owner, worst first, one "what to check" line each', () => {
  const inc = (owner, severity, title) => ({ owner_agent: owner, severity, title, hint: `check ${title}` });
  const { subject, text } = renderDigest([inc('seo', 'medium', 'T1'), inc('revenue', 'high', 'W1'), inc('seo', 'critical', 'T2')], NOW, { muted: 2 });
  assert.equal(subject, 'Sentinel: 3 new incidents (2 critical/high) — critical');
  const revenue = text.indexOf('== revenue (1)');
  const seo = text.indexOf('== seo (2)');
  assert.ok(revenue > 0 && seo > revenue, 'owners in OWNER_AGENTS order');
  assert.ok(text.indexOf('[critical] T2') < text.indexOf('[medium] T1'), 'worst first inside a group');
  assert.match(text, /what to check: check W1/);
  assert.match(text, /2 further incident\(s\) recorded but muted/);
});

// ─── 3. the run, end to end ──────────────────────────────────────────────────

/**
 * An in-memory stand-in for the supabase-js builder — exactly the chain shapes sentinel.mjs uses,
 * plus auth.admin.listUsers (`authUsers`) and rpc (`rpc`: { name: (args) => rows }) for the
 * lifecycle jobs' own selections, which the sentinel calls to learn who was due.
 */
function fakeDb(seed, { fail = [], failMessage = null, authUsers = [], rpc = {} } = {}) {
  const tables = JSON.parse(JSON.stringify(seed));
  const writes = [];
  let seq = 0;
  const likeRe = (p) => new RegExp(`^${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')}$`);
  class Q {
    constructor(name) { Object.assign(this, { name, op: 'select', filters: [], sort: null, max: null, from: 0, to: null, single: false, head: false }); }
    select(_cols, opts) { if (this.op === 'select' && opts?.head) this.head = true; this.returning = true; return this; }
    update(patch) { this.op = 'update'; this.patch = patch; return this; }
    upsert(rows, opts) { this.op = 'upsert'; this.rows = [].concat(rows); this.opts = opts; return this; }
    eq(k, v) { this.filters.push((r) => r[k] === v); return this; }
    gte(k, v) { this.filters.push((r) => r[k] >= v); return this; }
    lt(k, v) { this.filters.push((r) => r[k] < v); return this; }
    in(k, vs) { this.filters.push((r) => vs.includes(r[k])); return this; }
    is(k, v) { this.filters.push((r) => (v === null ? r[k] == null : r[k] === v)); return this; }
    like(k, p) { const re = likeRe(p); this.filters.push((r) => re.test(String(r[k] ?? ''))); return this; }
    order(k, { ascending = true } = {}) { this.sort = { k, ascending }; return this; }
    limit(n) { this.max = n; return this; }
    range(a, b) { this.from = a; this.to = b; return this; }
    maybeSingle() { this.single = true; return this; }
    then(res, rej) { return Promise.resolve().then(() => this.run()).then(res, rej); }
    run() {
      if (fail === '*' || fail.includes(this.name)) return { data: null, count: null, error: { message: failMessage ?? `relation "public.${this.name}" does not exist` } };
      const rows = (tables[this.name] ||= []);
      const hit = (r) => this.filters.every((f) => f(r));
      if (this.op === 'upsert') {
        const k = this.opts?.onConflict;
        const inserted = [];
        for (const row of this.rows) {
          if (k && rows.some((r) => r[k] === row[k])) continue; // ON CONFLICT DO NOTHING
          const withId = { id: `inc-${++seq}`, notified_at: null, resolved_at: null, ...row };
          rows.push(withId);
          inserted.push({ ...withId });
        }
        writes.push({ table: this.name, op: 'upsert', n: inserted.length });
        return { data: this.returning ? inserted : null, error: null };
      }
      if (this.op === 'update') {
        const matched = rows.filter(hit);
        matched.forEach((r) => Object.assign(r, this.patch));
        writes.push({ table: this.name, op: 'update', n: matched.length, patch: this.patch });
        return { data: null, error: null };
      }
      let out = rows.filter(hit);
      if (this.head) return { data: null, count: out.length, error: null };
      if (this.sort) {
        const { k, ascending } = this.sort;
        out = [...out].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0) * (ascending ? 1 : -1));
      }
      if (this.max !== null) out = out.slice(0, this.max);
      if (this.to !== null) out = out.slice(this.from, this.to + 1);
      out = out.map((r) => ({ ...r }));
      if (this.single) return { data: out[0] ?? null, error: null };
      return { data: out, error: null };
    }
  }
  const calls = { listUsers: 0, rpc: [] };
  return {
    from: (name) => new Q(name),
    rpc: async (name, args) => {
      calls.rpc.push({ name, args });
      if (fail === '*' || fail.includes(`rpc:${name}`) || !rpc[name]) return { data: null, error: { message: `function public.${name} does not exist` } };
      return { data: rpc[name](args), error: null };
    },
    auth: {
      admin: {
        listUsers: async ({ page = 1, perPage = 50 } = {}) => {
          calls.listUsers += 1;
          if (fail === '*' || fail.includes('auth')) return { data: null, error: { message: failMessage ?? 'auth unavailable' } };
          return { data: { users: authUsers.slice((page - 1) * perPage, page * perPage) }, error: null };
        },
      },
    },
    tables,
    writes,
    calls,
  };
}

/** A world in which every check passes. */
function healthyWorld() {
  const profiles = [];
  for (let d = 0; d < 8; d += 1) for (let k = 0; k < 5; k += 1) profiles.push({ id: `u${d}-${k}`, created_at: ago(d * 24 + 1 + k) });
  const sessions = [1, 2, 3, 4, 5].map((i) => ({ session_token: `s${i}`, status: 'completed', mode: 'free', user_turns: 4, evaluated: true, created_at: ago(3), started_at: ago(3), planned_minutes: 10 }));
  return {
    profiles,
    webhook_logs: [{ id: 1, event_type: 'order_created', processed: true, error: null, created_at: ago(5), data_id: '1' }],
    payment_failures: [],
    lifecycle_emails: [
      { id: 'l1', user_id: 'u', kind: 'trial_d3', sent_at: ago(2.8) },
      { id: 'l2', user_id: 'u', kind: 'activation_d1', sent_at: ago(1.3) },
      { id: 'l3', user_id: 'u', kind: 'confirm_nudge', sent_at: ago(0.3) },
      { id: 'l4', user_id: 'u', kind: 'course_reminder_2026-09-28', sent_at: ago(16.8) },
    ],
    weekly_metrics: [{ id: 'w1', measured_at: ago(28.8), metrics: {} }],
    support_tickets: [{ id: 't-1', reference: 'DM-T1', status: 'open', priority: 'normal', sla_due_at: ago(-20), first_response_at: null, created_at: ago(28) }],
    speaking_sessions: sessions,
    speaking_evaluations: sessions.map((s) => ({ session_token: s.session_token, score: 75, created_at: ago(2.9) })),
    agent_incidents: [],
    // The team is awake: the 09:50 supervisor wake wrote its heartbeat.
    agent_heartbeats: [{ id: 1, agent: 'orchestrator', wake: '2026-09-29 09:50 supervisor', note: null, created_at: ago(0.8) }],
  };
}

const ENV = {
  SENTINEL_ENABLED: 'true',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  CAMPAIGN_SECRET: 'test-campaign-secret',
  OWNER_ALERT_EMAIL: 'owner@example.test',
  RESEND_API_KEY: 'test-resend-key',
  LIFECYCLE_ACTIVATION_ENABLED: 'true',
  CONFIRM_NUDGE_ENABLED: 'true',
  COURSE_REMINDER_ENABLED: 'true',
};
const SCHEDULED = { httpMethod: 'POST', body: JSON.stringify({ next_run: '2026-09-29T11:50:00Z' }) };

/** Fake fetch: the site pages (overridable per path) and the Resend API. */
function fakeFetch(overrides = {}) {
  const mails = [];
  const hits = [];
  const fn = async (url, opts = {}) => {
    hits.push(url);
    if (url === 'https://api.resend.com/emails') {
      mails.push(JSON.parse(opts.body));
      return { ok: true, status: 200, text: async () => '{"id":"m1"}' };
    }
    const path = new URL(url).pathname;
    const o = overrides[path];
    if (o instanceof Error) throw o;
    const p = page(path);
    const status = o?.status ?? 200;
    const html = o?.html ?? goodHtmlFor(p);
    return { ok: status < 400, status, text: async () => html };
  };
  return Object.assign(fn, { mails, hits });
}

const run = (db, fetchImpl, { env = ENV, event = SCHEDULED, now = NOW } = {}) => runSentinel({ event, env, db, fetchImpl, now });
const body = (res) => JSON.parse(res.body);

test('a healthy world produces no incident, writes nothing to claim and mails nothing', async () => {
  const db = fakeDb(healthyWorld());
  const f = fakeFetch();
  const res = await run(db, f);
  assert.equal(res.statusCode, 200);
  const b = body(res);
  assert.equal(b.found, 0, JSON.stringify(b));
  assert.equal(f.mails.length, 0);
  assert.equal(db.tables.agent_incidents.length, 0);
  assert.equal(f.hits.filter((u) => u.startsWith('https://deutsch-meister.de/')).length, KEY_PAGES.length, 'every key page fetched from SITE_URL’s default');
  assert.deepEqual(b.skipped, []);
});

test('claim before send: one digest for new incidents, nothing on the second run, mailed_elsewhere never mailed', async () => {
  const world = healthyWorld();
  world.webhook_logs.push({ id: 77, event_type: 'order_created', processed: false, error: 'purchases insert failed', created_at: ago(1), data_id: '555' });
  world.payment_failures.push({ id: 'pf1', lemonsqueezy_event_id: 'evt_1', lemonsqueezy_subscription_id: 'sub_1', failed_at: ago(2) });
  const db = fakeDb(world);
  const f = fakeFetch({ '/pricing/': { status: 500, html: '' } });

  const first = body(await run(db, f));
  assert.equal(first.claimed, 3);
  assert.equal(first.mailedElsewhere, 1);
  assert.equal(first.emailed, 2);
  assert.equal(f.mails.length, 1, 'ONE digest per run');
  const [mail] = f.mails;
  assert.deepEqual(mail.to, ['owner@example.test']);
  assert.match(mail.from, /Sentinel/);
  assert.match(mail.text, /== revenue \(1\)[\s\S]*webhook order_created failed/);
  assert.match(mail.text, /== website \(1\)[\s\S]*\/pricing\/ answers HTTP 500/);
  assert.doesNotMatch(mail.text, /Renewal payment failed/, 'lemonsqueezy-webhook already mailed it');

  const rows = Object.fromEntries(db.tables.agent_incidents.map((r) => [r.key, r]));
  assert.ok(rows[`page:/pricing/:status:${DAY}`].notified_at, 'mailed rows are stamped');
  assert.ok(rows['webhook:77'].notified_at);
  assert.equal(rows['payment-failed:evt_1'].mailed_elsewhere, true);
  assert.equal(rows['payment-failed:evt_1'].notified_at, null);
  assert.equal(rows['webhook:77'].detail.what_to_check.length > 10, true);

  const second = body(await run(db, f, { now: new Date(NOW.getTime() + 3600000) }));
  assert.equal(second.claimed, 0);
  assert.equal(second.touched, 3);
  assert.equal(f.mails.length, 1, 'the same problems on the next run mail nothing');
  const again = db.tables.agent_incidents.find((r) => r.key === `page:/pricing/:status:${DAY}`);
  assert.equal(again.seen_count, 2);
  assert.equal(db.tables.agent_incidents.length, 3, 'no duplicate rows');
});

test('a fixed page resolves its incident; a check that could not run resolves nothing', async () => {
  const world = healthyWorld();
  world.support_tickets.push({ id: 't-9', reference: 'DM-T9', status: 'new', priority: 'urgent', sla_due_at: ago(2), first_response_at: null, created_at: ago(6) });
  const db = fakeDb(world);
  const broken = fakeFetch({ '/faq/': { html: prerenderedHtml({ root: '<h1>FAQ</h1>' }) } });
  const first = body(await run(db, broken));
  assert.equal(first.claimed, 2, JSON.stringify(first));
  const key = (k) => db.tables.agent_incidents.find((r) => r.key === k);
  assert.ok(key(`page:/faq/:body:${DAY}`));
  assert.ok(key(`support-sla:t-9:${DAY}`));

  // The ticket gets answered; the faq page is fixed; but the support read fails this hour.
  world.support_tickets[1].first_response_at = ago(0.5);
  const flaky = fakeDb({ ...world, agent_incidents: db.tables.agent_incidents }, { fail: ['support_tickets'] });
  const second = body(await run(flaky, fakeFetch(), { now: new Date(NOW.getTime() + 3600000) }));
  const k2 = (k) => flaky.tables.agent_incidents.find((r) => r.key === k);
  assert.ok(k2(`page:/faq/:body:${DAY}`).resolved_at, 'the page check ran and passed');
  assert.equal(k2(`support-sla:t-9:${DAY}`).resolved_at, null, 'the SLA check did not run, so its incident stays open');
  assert.ok(second.skipped.some((s) => s.check === 'support-sla' && /could not run/.test(s.reason)));

  // Next hour the read works again and the ticket is answered → resolved.
  const healthy = fakeDb({ ...world, agent_incidents: flaky.tables.agent_incidents });
  await run(healthy, fakeFetch(), { now: new Date(NOW.getTime() + 2 * 3600000) });
  assert.ok(healthy.tables.agent_incidents.find((r) => r.key === `support-sla:t-9:${DAY}`).resolved_at);
});

test('kill switch: anything but SENTINEL_ENABLED=true is a no-op that touches nothing', async () => {
  for (const value of [undefined, '', 'false', 'TRUE', '1']) {
    const db = fakeDb(healthyWorld());
    const f = fakeFetch({ '/': { status: 500 } });
    const res = await run(db, f, { env: { ...ENV, SENTINEL_ENABLED: value } });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(body(res), { enabled: false });
    assert.equal(f.hits.length, 0, `${value}: nothing fetched`);
    assert.equal(db.writes.length, 0);
  }
});

test('OWNER_ALERT_EMAIL or RESEND_API_KEY unset: incidents are recorded, nothing is sent', async () => {
  for (const missing of ['OWNER_ALERT_EMAIL', 'RESEND_API_KEY']) {
    const db = fakeDb(healthyWorld());
    const f = fakeFetch({ '/': { status: 503 } });
    const env = { ...ENV };
    delete env[missing];
    const b = body(await run(db, f, { env }));
    assert.equal(b.claimed, 1, missing);
    assert.equal(b.notMailed, 1, missing);
    assert.equal(f.mails.length, 0, `${missing}: fail closed`);
    assert.equal(db.tables.agent_incidents[0].notified_at, null);
  }
});

// ─── Supabase unreachable: the stateless fallback ────────────────────────────

const OUTAGE = 'TypeError: fetch failed\n    at node:internal/deps/undici (the project is paused)';
const isFallback = (m) => m.subject.startsWith('[DM sentinel] Supabase unreachable — ');

test('a failed DB probe sends exactly one fallback mail and no digest', async () => {
  const db = fakeDb(healthyWorld(), { fail: '*', failMessage: OUTAGE });
  const f = fakeFetch({ '/pricing/': { status: 500 } }); // a real page incident in the same run
  const res = await run(db, f);
  assert.equal(res.statusCode, 500);
  const b = body(res);
  assert.equal(b.dbDown, true);
  assert.equal(b.fallbackMailed, true);
  assert.equal(f.mails.length, 1, 'ONE mail: the fallback, not a digest');
  const [mail] = f.mails;
  assert.equal(mail.subject, '[DM sentinel] Supabase unreachable — TypeError: fetch failed', 'first error line only');
  assert.deepEqual(mail.to, ['owner@example.test']);
  assert.match(mail.text, /check get_project status; restore_project if INACTIVE/);
  assert.doesNotMatch(mail.text, /pricing/, 'no digest content');
  assert.equal(db.writes.length, 0, 'nothing claimed: the ledger is the database');
  // Stateless on purpose: the next hour, still down, mails again.
  await run(db, f, { now: new Date(NOW.getTime() + 3600000) });
  assert.equal(f.mails.length, 2);
  assert.ok(f.mails.every(isFallback));
});

test('a failed claim (ledger unreachable or unmigrated) sends the fallback, never the digest', async () => {
  const db = fakeDb(healthyWorld(), { fail: ['agent_incidents'] });
  const f = fakeFetch({ '/': { status: 500 } });
  const res = await run(db, f);
  assert.equal(res.statusCode, 500);
  assert.match(body(res).error, /agent_incidents/);
  assert.equal(f.mails.length, 1);
  assert.ok(isFallback(f.mails[0]));
  assert.match(f.mails[0].subject, /relation "public\.agent_incidents" does not exist/);
  assert.match(f.mails[0].text, /2026-09-29-agent-incidents\.sql/);
  assert.doesNotMatch(f.mails[0].text, /answers HTTP 500/, 'no incident is mailed without its claim');
});

test('a healthy DB sends no fallback', async () => {
  const db = fakeDb(healthyWorld());
  const f = fakeFetch({ '/courses/': { status: 404 } });
  const b = body(await run(db, f));
  assert.equal(b.dbDown, undefined);
  assert.equal(f.mails.length, 1);
  assert.ok(!isFallback(f.mails[0]), 'the digest, not the fallback');
});

test('the fallback honours SENTINEL_MUTE=db-down, the recipient fail-closed rules, the kill switch and dry mode', async () => {
  const down = () => fakeDb(healthyWorld(), { fail: '*', failMessage: OUTAGE });

  const muted = fakeFetch();
  const m = body(await run(down(), muted, { env: { ...ENV, SENTINEL_MUTE: 'signups,db-down' } }));
  assert.equal(m.fallbackMuted, true);
  assert.equal(muted.mails.length, 0, 'muted db-down sends nothing');

  for (const missing of ['OWNER_ALERT_EMAIL', 'RESEND_API_KEY']) {
    const f = fakeFetch();
    const env = { ...ENV };
    delete env[missing];
    const b = body(await run(down(), f, { env }));
    assert.equal(b.fallbackMailed, false, missing);
    assert.equal(f.mails.length, 0, `${missing} unset: fail closed`);
  }

  const off = fakeFetch();
  assert.deepEqual(body(await run(down(), off, { env: { ...ENV, SENTINEL_ENABLED: 'false' } })), { enabled: false });
  assert.equal(off.mails.length, 0);

  const dry = fakeFetch();
  const d = body(await run(down(), dry, { event: { httpMethod: 'GET', queryStringParameters: { secret: ENV.CAMPAIGN_SECRET, dry: '1' } } }));
  assert.equal(d.dry, true);
  assert.equal(d.dbError, OUTAGE, 'dry mode reports the outage');
  assert.equal(dry.mails.length, 0, 'dry mode sends nothing');
});

test('renderDbDownAlert: first non-empty line, bounded subject, one-line hint', async () => {
  const { renderDbDownAlert } = await import('../netlify/functions/_shared/sentinelLib.mjs');
  const { subject, text } = renderDbDownAlert(`\n  ${'x'.repeat(300)}\nsecond line`, NOW);
  assert.equal(subject, `[DM sentinel] Supabase unreachable — ${'x'.repeat(120)}`);
  assert.doesNotMatch(text, /second line/);
  assert.equal(text.split('\n').filter((l) => /get_project/.test(l)).length, 1);
  assert.match(renderDbDownAlert(null, NOW).subject, /unknown error$/);
});

test('SENTINEL_MUTE records a check but keeps it out of the mail', async () => {
  const db = fakeDb(healthyWorld());
  const f = fakeFetch({ '/faq/': { status: 404 }, '/courses/': { status: 404 } });
  const b = body(await run(db, f, { env: { ...ENV, SENTINEL_MUTE: 'page:/faq/' } }));
  assert.equal(b.claimed, 2);
  assert.equal(b.muted, 1);
  assert.equal(f.mails.length, 1);
  assert.match(f.mails[0].text, /\/courses\//);
  assert.doesNotMatch(f.mails[0].text, /\/faq\/ answers/);
});

test('dry mode runs every check and returns the incidents, but writes and mails nothing', async () => {
  const db = fakeDb(healthyWorld());
  const f = fakeFetch({ '/grammar/': { status: 404 } });
  const res = await run(db, f, { event: { httpMethod: 'GET', queryStringParameters: { secret: ENV.CAMPAIGN_SECRET, dry: '1' } } });
  const b = body(res);
  assert.equal(b.dry, true);
  assert.deepEqual(b.incidents.map((i) => i.key), [`page:/grammar/:status:${DAY}`]);
  assert.equal(b.incidents[0].owner_agent, 'seo');
  assert.equal(db.writes.length, 0, 'no claim, no touch, no resolve');
  assert.equal(db.tables.agent_incidents.length, 0);
  assert.equal(f.mails.length, 0);
});

test('manual calls need the campaign secret; OPTIONS answers the CORS preflight', async () => {
  const db = fakeDb(healthyWorld());
  const f = fakeFetch();
  const denied = await run(db, f, { event: { httpMethod: 'GET', queryStringParameters: { secret: 'wrong' } } });
  assert.equal(denied.statusCode, 401);
  const noSecret = await run(db, f, { env: { ...ENV, CAMPAIGN_SECRET: undefined }, event: { httpMethod: 'GET', queryStringParameters: { secret: '' } } });
  assert.equal(noSecret.statusCode, 401, 'an unset secret never matches an empty one');
  assert.equal(f.hits.length, 0);
  const pre = await run(db, f, { event: { httpMethod: 'OPTIONS', headers: { origin: 'https://www.deutsch-meister.de' } } });
  assert.equal(pre.statusCode, 200);
  assert.equal(pre.headers['Access-Control-Allow-Origin'], 'https://www.deutsch-meister.de');
  const missingKey = await run(db, f, { env: { ...ENV, SUPABASE_SERVICE_ROLE_KEY: '' } });
  assert.equal(missingKey.statusCode, 500);
});

test('every list read is paged past the 1,000-row cap and counts are head:true', () => {
  const src = read('netlify/functions/sentinel.mjs');
  const froms = [...src.matchAll(/db\.from\('(\w+)'\)/g)].length;
  assert.ok(froms >= 12, `expected the sentinel's reads, saw ${froms}`);
  // Every list read of a table that can grow goes through fetchAll (which pages with .range()).
  for (const t of ['webhook_logs', 'payment_failures', 'speaking_sessions', 'support_tickets', 'speaking_evaluations']) {
    assert.match(src, new RegExp(`fetchAll\\(\\(\\) => db\\.from\\('${t}'\\)`), `${t} must be read with fetchAll`);
  }
  assert.match(src, /exactCount\(\(\) => counting\(db, 'profiles'\)/, 'signups are counted, never listed');
  assert.doesNotMatch(src, /\.length\s*[<>=]=?\s*1000/, 'no rows.length population logic');
});

// ─── 4. migration + schedule ─────────────────────────────────────────────────

test('agent_incidents is service-role only, idempotent, and its CHECK lists equal the JS lists', () => {
  const sql = read('migrations/2026-09-29-agent-incidents.sql');
  const code = sql.replace(/--[^\n]*/g, ' ');
  assert.match(code, /CREATE TABLE IF NOT EXISTS public\.agent_incidents/);
  assert.match(code, /ALTER TABLE public\.agent_incidents ENABLE ROW LEVEL SECURITY;/);
  assert.doesNotMatch(code, /CREATE POLICY/i, 'no client policy may exist');
  assert.match(code, /REVOKE ALL ON TABLE public\.agent_incidents FROM PUBLIC, anon, authenticated;/);
  assert.match(code, /GRANT ALL ON TABLE public\.agent_incidents TO service_role;/);
  assert.doesNotMatch(code, /GRANT[^;]*\b(anon|authenticated)\b/i);
  assert.match(code, /ADD CONSTRAINT agent_incidents_key_key UNIQUE \(key\)/, 'the claim needs a unique key');
  assert.match(code, /key text NOT NULL/);
  assert.match(code, /owner_agent text NOT NULL/);
  assert.match(code, /mailed_elsewhere boolean NOT NULL DEFAULT false/);
  // idempotent: every ADD CONSTRAINT is preceded by its DROP … IF EXISTS
  for (const m of code.matchAll(/ADD CONSTRAINT (\w+)/g)) {
    assert.ok(code.includes(`DROP CONSTRAINT IF EXISTS ${m[1]};`), `${m[1]} must be dropped first`);
  }
  assert.doesNotMatch(code, /CREATE INDEX (?!IF NOT EXISTS)/);
  const list = (name) => [...new RegExp(`${name} IN \\(([^)]*)\\)`).exec(code)[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
  assert.deepEqual(list('owner_agent'), [...OWNER_AGENTS]);
  assert.deepEqual(list('severity'), [...SEVERITIES]);
  assert.match(code, /^\s*BEGIN;/m);
  assert.match(code, /COMMIT;\s*$/);
});

test('every incident a check can produce uses a known owner and severity', () => {
  const all = [
    ...checkPage(page('/'), { status: 500 }, NOW).incidents,
    ...checkWebhooks([{ id: 1, processed: false, created_at: ago(1) }], NOW).incidents,
    ...checkPaymentFailures([{ id: 'x' }]).incidents,
    ...checkSignups({ last24: 0, prior7: 0 }, NOW).incidents,
    ...checkJobs(SCHEDULED_JOBS.map((job) => ({ job, last: ago(24 * 20) })), NOW, ENV).incidents,
    ...checkSupportSla([{ id: 't', status: 'new', sla_due_at: ago(1) }], NOW).incidents,
    ...checkSpeakingCloseout([{ status: 'active', started_at: ago(5), planned_minutes: 5 }], NOW).incidents,
    ...checkDatabase(9000, NOW).incidents,
  ];
  assert.ok(all.length >= 12);
  for (const i of all) {
    assert.ok(OWNER_AGENTS.includes(i.owner_agent), i.key);
    assert.ok(SEVERITIES.includes(i.severity), i.key);
    assert.ok(i.key && i.check_id && i.title && i.hint, i.key);
    assert.ok(i.key.startsWith(i.check_id), `${i.key}: the key names its check`);
  }
});

test('the hourly schedule is declared identically in the function and netlify.toml', () => {
  const fn = read('netlify/functions/sentinel.mjs');
  const m = fn.match(/schedule\('([^']+)'/);
  assert.ok(m, 'schedule() wrapper missing');
  assert.match(m[1], /^\d{1,2} \* \* \* \*$/, 'hourly');
  const t = read('netlify.toml').match(/\[functions\."sentinel"\]\s*\n\s*schedule = "([^"]+)"/);
  assert.ok(t, 'netlify.toml has no sentinel schedule');
  assert.equal(m[1], t[1]);
  assert.notEqual(m[1].split(' ')[0], '20', 'not on speaking-closeout’s minute');
});

test('admin-status reads the same job list as the sentinel', () => {
  const src = read('netlify/functions/admin-status.mjs');
  assert.match(src, /for \(const j of SCHEDULED_JOBS\)/);
  assert.match(src, /jobStaleness\(j, last, now\)/);
  assert.doesNotMatch(src, /k\.startsWith\('trial_'\)/, 'the list lives in adminStatusLib only');
});

// ─── 5. ledger jobs: a quiet day is not an outage ───────────────────────────
//
// 2026-09-30, the sentinel's first live run: "confirmation-nudge has left no
// evidence for 78 h" (HIGH). The job ran daily; its backlog had drained on
// 09-27 and nobody was eligible. A ledger job is now stale only if someone was
// due at one of its runs since its last ledger row — asked of the job's OWN
// selection over those runs.
//
// The world below is NOW = 2026-09-29 10:50 UTC with every ledger job stale:
//   trial      (08:00) last row 50 h ago → runs 09-28 08:00, 09-29 08:00
//   activation (09:30) last row 60 h ago → runs 09-27, 09-28, 09-29 09:30
//   confirm    (10:30) last row 78 h ago → runs 09-26 … 09-29 10:30 (production's case)
//   course     (18:00) last row 40 h ago → run 09-28 18:00

const JOB = Object.fromEntries(SCHEDULED_JOBS.map((j) => [j.id, j]));
const at = (iso) => new Date(iso).toISOString();
const authUser = (id, { confirmedAt = null, createdAt = '2026-06-01T00:00:00Z', email = `${id}@learner.test` } = {}) => ({
  id, email, email_confirmed_at: confirmedAt ? at(confirmedAt) : null, created_at: at(createdAt), app_metadata: { provider: 'email' },
});
const hoursBefore = (iso, h) => new Date(Date.parse(iso) - h * 3600000).toISOString();

/** Course learners, and the SQL function's window test on them (course_reminder_candidates, NOW as now()). */
const courseRpc = (learners) => ({
  course_reminder_candidates: ({ p_min_hours, p_max_hours }) => learners.filter((l) => {
    const age = (NOW.getTime() - Date.parse(l.last_activity_at)) / 3600000;
    return age >= p_min_hours && age < p_max_hours;
  }),
});

/**
 * Every ledger job stale; `due` adds exactly one recipient each job's own
 * selection says was due at one of its runs. The quiet world holds the traps:
 * people the job would pick if it ran NOW, but who were not due at any run.
 */
function ledgerWorld({ due = false } = {}) {
  const w = healthyWorld();
  w.lifecycle_emails = [
    { id: 'l1', user_id: 'old-trial', kind: 'trial_day3', sent_at: ago(50) },
    { id: 'l2', user_id: 'old-act', kind: 'activation_d1', sent_at: ago(60) },
    { id: 'l3', user_id: 'nudged', kind: 'confirm_nudge', sent_at: ago(78) },
    { id: 'l4', user_id: 'old-learner', kind: 'course_reminder_2026-09-27', sent_at: ago(40) },
  ];
  const authUsers = [
    // confirm: already nudged; turned two days old at 10:40, after the 10:30 run; 100 days old.
    authUser('nudged', { createdAt: '2026-08-30T00:00:00Z' }),
    authUser('fresh', { createdAt: '2026-09-27T10:40:00Z' }),
    authUser('ancient', { createdAt: '2026-06-21T00:00:00Z' }),
    // trial: day 3 opened 09-29 09:00, after the 08:00 run.
    authUser('late3', { confirmedAt: '2026-09-26T09:05:00Z', createdAt: '2026-09-26T09:00:00Z' }),
    // activation: d1 due at the 09-29 09:30 run, but confirmed only at 10:00.
    authUser('lateconfirm', { confirmedAt: '2026-09-29T10:00:00Z', createdAt: '2026-09-27T20:00:00Z' }),
    // course: studied 09-28 14:00, four hours before the 18:00 run.
    authUser('yesterday', { confirmedAt: '2026-09-01T00:00:00Z' }),
  ];
  w.profiles.push({ id: 'late3', trial_started_at: '2026-09-26T09:00:00.000Z', trial_ends_at: '2026-10-03T09:00:00.000Z', is_subscribed: false, email_daily_sentence: true });
  w.lifecycle_customer_state = [
    { user_id: 'lateconfirm', registered_at: '2026-09-27T20:00:00.000Z', status: 'new', has_lesson_activity: false, email_opted_out: false, is_subscribed: false },
  ];
  const learners = [{ user_id: 'yesterday', level: 'a1.1', last_activity_at: '2026-09-28T14:00:00.000Z', next_lektion_nr: 3, email_opted_out: false }];

  if (due) {
    authUsers.push(
      authUser('d3', { confirmedAt: '2026-09-25T12:05:00Z', createdAt: '2026-09-25T12:00:00Z' }),
      authUser('a1', { confirmedAt: '2026-09-27T08:05:00Z', createdAt: '2026-09-27T08:00:00Z' }),
      authUser('unconfirmed', { createdAt: '2026-09-26T12:00:00Z' }),
      authUser('c1', { confirmedAt: '2026-09-01T00:00:00Z' }),
    );
    // day 3 of this trial fell on the 09-29 08:00 run
    w.profiles.push({ id: 'd3', trial_started_at: '2026-09-25T12:00:00.000Z', trial_ends_at: '2026-10-02T12:00:00.000Z', is_subscribed: false, email_daily_sentence: true });
    // d1 fell on the 09-28 09:30 run
    w.lifecycle_customer_state.push({ user_id: 'a1', registered_at: '2026-09-27T08:00:00.000Z', status: 'new', has_lesson_activity: false, email_opted_out: false, is_subscribed: false });
    // 22 h before the 09-28 18:00 run
    learners.push({ user_id: 'c1', level: 'a1.1', last_activity_at: hoursBefore('2026-09-28T18:00:00Z', 22), next_lektion_nr: 2, email_opted_out: false });
    // ('unconfirmed' was 2 d 22 h old at the 09-29 10:30 run and was never nudged)
  }
  return { world: w, opts: { authUsers, rpc: courseRpc(learners) } };
}

const LEDGER_IDS = ['job-trial', 'job-activation', 'job-confirm', 'job-course'];
const dryEvent = { httpMethod: 'GET', queryStringParameters: { secret: ENV.CAMPAIGN_SECRET, dry: '1' } };

test('the runs a stale job answers for: after its last row, within the lookback, past the grace', () => {
  // production's case: last nudge 78 h before a 10:50 run → four 10:30 runs
  const s = dueSpan(JOB['job-confirm'], ago(78), NOW);
  assert.deepEqual({ ...s, first: at(s.first), last: at(s.last) }, { first: '2026-09-26T10:30:00.000Z', last: '2026-09-29T10:30:00.000Z', runs: 4 });
  // the run that wrote the last row is not one it has to answer for
  const one = dueSpan(JOB['job-trial'], '2026-09-28T08:00:04Z', NOW);
  assert.equal(at(one.first), '2026-09-29T08:00:00.000Z');
  assert.equal(one.runs, 1);
  // grace: at 10:40 the 10:30 run is not judged yet
  assert.equal(at(dueSpan(JOB['job-confirm'], ago(78), new Date('2026-09-29T10:40:00Z')).last), '2026-09-28T10:30:00.000Z');
  // lookback: a row 60 days old answers for a week of runs, not sixty
  assert.equal(dueSpan(JOB['job-course'], ago(60 * 24), NOW).runs, LEDGER_JOB_DUE.lookbackDays);
  // weekly and malformed crons are not replayed
  assert.equal(dueSpan(JOB['job-weekly'], ago(9 * 24), NOW), null);
  assert.equal(dailyRunTimes('*/5 * * * *', 0, 1e12), null);
  assert.deepEqual(dailyRunTimes('0 18 * * *', Date.parse('2026-09-28T18:00:00Z'), Date.parse('2026-09-29T17:59:00Z')), [], 'strictly after `since`');
  assert.deepEqual({ ...LEDGER_JOB_DUE }, { lookbackDays: 7, runGraceMinutes: 20, timeoutMs: 10000 });
});

test('SCHEDULED_JOBS carries each job’s own schedule literal, and every ledger job has an eligibility reader', () => {
  for (const job of SCHEDULED_JOBS) {
    const m = read(`netlify/functions/${job.fn}.mjs`).match(/schedule\('([^']+)'/);
    assert.ok(m, `${job.fn}: no schedule() literal`);
    assert.equal(job.cron, m[1], `${job.id}: the sentinel would replay the wrong runs`);
  }
  assert.deepEqual(Object.keys(DUE_READERS).sort(), SCHEDULED_JOBS.filter((j) => j.ledger).map((j) => j.id).sort());
  for (const [id, reader] of Object.entries(DUE_READERS)) {
    const src = read(`netlify/functions/${JOB[id].fn}.mjs`);
    assert.equal(reader.canary, src.includes('LIFECYCLE_TEST_RECIPIENTS'), `${id}: canary flag must match whether the job honours the allowlist`);
  }
});

test('needsDueCheck: only a stale, enabled ledger job pays for an eligibility read', () => {
  const env = { CONFIRM_NUDGE_ENABLED: 'true' };
  assert.equal(needsDueCheck(JOB['job-confirm'], ago(78), NOW, env), true);
  assert.equal(needsDueCheck(JOB['job-confirm'], ago(2), NOW, env), false, 'fresh');
  assert.equal(needsDueCheck(JOB['job-confirm'], null, NOW, env), false, 'no evidence at all is skipped as before');
  assert.equal(needsDueCheck(JOB['job-confirm'], ago(78), NOW, {}), false, 'gated off');
  assert.equal(needsDueCheck(JOB['job-weekly'], ago(9 * 24), NOW, env), false, 'weekly has no ledger');
  assert.deepEqual(countDue({ a: [{ email: 'x@y.test' }, { email: 'Z@y.test' }], b: [] }, { canary: parseCanary(' z@y.test ,') }), { count: 1, byKind: { a: 1, b: 0 } });
  assert.deepEqual(countDue({ a: [{ email: 'x@y.test' }] }), { count: 1, byKind: { a: 1 } });
});

test('a quiet ledger job — nobody due, old evidence — passes instead of firing', () => {
  const env = { CONFIRM_NUDGE_ENABLED: 'true' };
  const due = { count: 0, byKind: { confirm_nudge: 0 }, first: Date.parse('2026-09-26T10:30:00Z'), last: Date.parse('2026-09-29T10:30:00Z'), runs: 4 };
  const r = checkJobs([{ job: JOB['job-confirm'], last: ago(78), due }], NOW, env);
  assert.deepEqual(r.incidents, [], 'the 2026-09-30 false alarm');
  assert.deepEqual(r.passing, ['job-confirm'], 'it ran and nobody was due: that resolves an open false alarm');
  assert.deepEqual(r.skipped, []);
});

test('a due ledger job — someone due, old evidence — fires as before, with the eligible count', () => {
  const env = { CONFIRM_NUDGE_ENABLED: 'true' };
  const due = { count: 3, byKind: { confirm_nudge: 3 }, first: Date.parse('2026-09-26T10:30:00Z'), last: Date.parse('2026-09-29T10:30:00Z'), runs: 4 };
  const r = checkJobs([{ job: JOB['job-confirm'], last: ago(78), due }], NOW, env);
  assert.equal(r.incidents.length, 1);
  const [i] = r.incidents;
  assert.equal(i.key, `job-confirm:stale:${DAY}`, 'same key as before');
  assert.equal(i.check_id, 'job-confirm');
  assert.equal(i.owner_agent, 'retention');
  assert.equal(i.severity, 'high', '78 h is past the critical threshold');
  assert.equal(i.detail.eligible, 3);
  assert.deepEqual(i.detail.eligibleByKind, { confirm_nudge: 3 });
  assert.deepEqual(i.detail.dueRuns, { first: '2026-09-26T10:30:00.000Z', last: '2026-09-29T10:30:00.000Z', count: 4 });
  assert.equal(i.detail.hours, 78);
  assert.match(i.title, /^confirmation-nudge has left no evidence for 78 h while 3 recipient\(s\) were due$/);
  assert.deepEqual(r.passing, []);
  // one missed run with one learner due → medium, as before
  const course = checkJobs([{ job: JOB['job-course'], last: ago(40), due: { count: 1, byKind: { course_reminder: 1 }, first: 1, last: 1, runs: 1 } }], NOW, { COURSE_REMINDER_ENABLED: 'true' });
  assert.deepEqual(course.incidents.map((x) => [x.key, x.severity]), [[`job-course:stale:${DAY}`, 'medium']]);
});

test('an unreadable eligibility is quiet-day ambiguity: skipped, never an incident, never a pass', () => {
  const env = { LIFECYCLE_ACTIVATION_ENABLED: 'true' };
  for (const due of [{ count: null, reason: 'listUsers: auth unavailable' }, {}, null]) {
    const r = checkJobs([{ job: JOB['job-activation'], last: ago(60), due }], NOW, env);
    assert.deepEqual(r.incidents, [], JSON.stringify(due));
    assert.deepEqual(r.passing, [], 'a check that could not judge resolves nothing');
    assert.equal(r.skipped.length, 1);
    assert.match(r.skipped[0].reason, /^quiet-day ambiguity: activation-lifecycle has left no evidence for 60 h/);
  }
});

test('a gated-off job is still skipped, whoever was due', () => {
  const r = checkJobs([{ job: JOB['job-confirm'], last: ago(500), due: { count: 9, byKind: { confirm_nudge: 9 } } }], NOW, { CONFIRM_NUDGE_ENABLED: 'false' });
  assert.deepEqual(r.incidents, []);
  assert.deepEqual(r.passing, []);
  assert.deepEqual(r.skipped.map((s) => s.check), ['job-confirm']);
  assert.match(r.skipped[0].reason, /gated off/);
});

test('weekly-truth is unchanged: a missed weekly run fires, whatever else is measured', () => {
  const stale = checkJobs([{ job: JOB['job-weekly'], last: ago(9 * 24), due: { count: 0, byKind: {} } }], NOW, {});
  assert.deepEqual(stale.incidents.map((i) => [i.key, i.owner_agent, i.severity]), [[`job-weekly:stale:${DAY}`, 'website', 'medium']]);
  assert.equal(stale.incidents[0].title, 'weekly-truth has left no evidence for 216 h');
  assert.equal(stale.incidents[0].detail.eligible, undefined, 'no eligibility for a job that always writes');
  assert.equal(checkJobs([{ job: JOB['job-weekly'], last: ago(16 * 24) }], NOW, {}).incidents[0].severity, 'high');
  assert.deepEqual(checkJobs([{ job: JOB['job-weekly'], last: ago(28.8) }], NOW, {}).passing, ['job-weekly']);
});

test('each job’s own selection, asked about past runs, counts only who was due at them', async () => {
  const span = (a, b) => ({ first: Date.parse(a), last: Date.parse(b) });
  const quiet = ledgerWorld();
  const qdb = fakeDb(quiet.world, quiet.opts);
  // Each would pick its trap if it ran NOW (the old "due now" reading); none was due at a run.
  assert.deepEqual(await trialRecipients('trial_day3', { client: qdb, span: span('2026-09-28T08:00:00Z', '2026-09-29T08:00:00Z') }), []);
  assert.deepEqual(await activationCandidates('activation_d1', { client: qdb, span: span('2026-09-27T09:30:00Z', '2026-09-29T09:30:00Z') }), [], 'confirmed after the run that would have picked them');
  assert.deepEqual(await nudgeCandidates(qdb, { span: span('2026-09-26T10:30:00Z', '2026-09-29T10:30:00Z'), limit: Infinity }), [], 'already nudged, too young at the run, or too old');

  const due = ledgerWorld({ due: true });
  const ddb = fakeDb(due.world, due.opts);
  assert.deepEqual(await trialRecipients('trial_day3', { client: ddb, span: span('2026-09-28T08:00:00Z', '2026-09-29T08:00:00Z') }), [{ id: 'd3', email: 'd3@learner.test' }]);
  assert.deepEqual(await activationCandidates('activation_d1', { client: ddb, span: span('2026-09-27T09:30:00Z', '2026-09-29T09:30:00Z') }), [{ id: 'a1', email: 'a1@learner.test' }]);
  assert.deepEqual((await nudgeCandidates(ddb, { span: span('2026-09-26T10:30:00Z', '2026-09-29T10:30:00Z'), limit: Infinity })).map((r) => r.id), ['unconfirmed']);

  // The course window, rounded inward: no span is today's run exactly.
  assert.deepEqual(windowHoursFor(null), WINDOW_HOURS);
  const one = Date.parse('2026-09-28T18:00:00Z');
  assert.deepEqual(windowHoursFor({ first: one, last: one }, NOW.getTime()), { minHours: 37, maxHours: 60 }, '16.8 h after the run: floor rounds up, ceiling down');
});

test('a failed ledger read stops a selection: "nobody mailed yet" would mean mailing twice', async () => {
  const { world, opts } = ledgerWorld({ due: true });
  const db = fakeDb(world, { ...opts, fail: ['lifecycle_emails'] });
  const s = { first: Date.parse('2026-09-26T10:30:00Z'), last: Date.parse('2026-09-29T10:30:00Z') };
  await assert.rejects(trialRecipients('trial_day3', { client: db, span: s }), /ledger read failed/);
  await assert.rejects(activationCandidates('activation_d1', { client: db, span: s }), /ledger read failed/);
  await assert.rejects(nudgeCandidates(db, { span: s }), /ledger read failed/);
});

test('end to end, production’s case: every ledger job quiet for days, nobody due → no incident, the false alarm resolves', async () => {
  const { world, opts } = ledgerWorld();
  // the row the 2026-09-30 run opened, still open
  world.agent_incidents.push({ id: 'inc-0', key: `job-confirm:stale:${DAY}`, check_id: 'job-confirm', owner_agent: 'retention', severity: 'high', title: 'confirmation-nudge has left no evidence for 78 h', detail: {}, first_seen_at: ago(1), last_seen_at: ago(1), seen_count: 1, resolved_at: null, notified_at: ago(1) });
  const db = fakeDb(world, opts);
  const f = fakeFetch();
  const b = body(await run(db, f));
  assert.equal(b.found, 0, JSON.stringify(b));
  assert.equal(b.claimed, 0);
  assert.deepEqual(b.skipped, []);
  assert.equal(f.mails.length, 0, 'no false HIGH mail');
  assert.ok(db.tables.agent_incidents.find((r) => r.key === `job-confirm:stale:${DAY}`).resolved_at, 'the check ran and nobody was due: resolved');
  assert.equal(db.calls.rpc.length, 1, 'course-reminder was asked through its own SQL definition');

  const again = ledgerWorld();
  const dry = body(await run(fakeDb(again.world, again.opts), fakeFetch(), { event: dryEvent }));
  for (const id of LEDGER_IDS) assert.ok(dry.passing.includes(id), `${id} passes on a quiet day`);
});

test('end to end: someone due at each job’s runs and no ledger row → one incident per job, count in detail', async () => {
  const { world, opts } = ledgerWorld({ due: true });
  const db = fakeDb(world, opts);
  const f = fakeFetch();
  const b = body(await run(db, f));
  assert.equal(b.claimed, 4, JSON.stringify(b));
  const rows = Object.fromEntries(db.tables.agent_incidents.map((r) => [r.check_id, r]));
  assert.deepEqual(LEDGER_IDS.map((id) => [id, rows[id]?.severity, rows[id]?.detail.eligible]), [
    ['job-trial', 'medium', 1],
    ['job-activation', 'high', 1],
    ['job-confirm', 'high', 1],
    ['job-course', 'medium', 1],
  ]);
  assert.deepEqual(rows['job-trial'].detail.eligibleByKind, { trial_day3: 1, trial_day6: 0, trial_ended: 0 });
  assert.equal(rows['job-confirm'].key, `job-confirm:stale:${DAY}`);
  assert.equal(f.mails.length, 1);
  assert.match(f.mails[0].text, /confirmation-nudge has left no evidence for 78 h while 1 recipient\(s\) were due/);
  assert.match(f.mails[0].text, /== retention \(4\)/);
});

test('end to end: the canary allowlist, the gate, an unreadable queue and weekly-truth', async () => {
  // Canary: while LIFECYCLE_TEST_RECIPIENTS is set, activation, confirm and course mail only
  // listed addresses, so only those were due; trial ignores it.
  const canary = ledgerWorld({ due: true });
  const c = body(await run(fakeDb(canary.world, canary.opts), fakeFetch(), { event: dryEvent, env: { ...ENV, LIFECYCLE_TEST_RECIPIENTS: 'owner@example.test' } }));
  assert.deepEqual(c.incidents.map((i) => i.key), [`job-trial:stale:${DAY}`]);

  // Gated off: skipped as before, and its queue is not even read.
  const gated = ledgerWorld({ due: true });
  const gdb = fakeDb(gated.world, gated.opts);
  const g = body(await run(gdb, fakeFetch(), { event: dryEvent, env: { ...ENV, COURSE_REMINDER_ENABLED: 'false' } }));
  assert.ok(!g.incidents.some((i) => i.key.startsWith('job-course')));
  assert.match(g.skipped.find((s) => s.check === 'job-course').reason, /gated off/);
  assert.equal(gdb.calls.rpc.length, 0, 'a gated-off job’s queue is not read');

  // Unreadable: the course SQL function errors → quiet-day ambiguity, not an incident; the rest still judged.
  const broken = ledgerWorld({ due: true });
  const bdb = fakeDb(broken.world, { ...broken.opts, rpc: {} });
  const u = body(await run(bdb, fakeFetch(), { event: dryEvent }));
  assert.ok(!u.incidents.some((i) => i.key.startsWith('job-course')));
  assert.match(u.skipped.find((s) => s.check === 'job-course').reason, /^quiet-day ambiguity: .*course_reminder_candidates failed/);
  assert.equal(u.incidents.length, 3);

  // Weekly: a missed weekly-truth run still fires, eligibility or not.
  const weekly = ledgerWorld();
  weekly.world.weekly_metrics = [{ id: 'w1', measured_at: ago(9 * 24), metrics: {} }];
  const w = body(await run(fakeDb(weekly.world, weekly.opts), fakeFetch(), { event: dryEvent }));
  assert.deepEqual(w.incidents.map((i) => [i.key, i.owner_agent, i.severity]), [[`job-weekly:stale:${DAY}`, 'website', 'medium']]);
});

// ─── 6. the team's dead-man switch (roadmap r17) ────────────────────────────
//
// The agent team runs inside one orchestrating session; every scheduled wake
// writes a public.agent_heartbeats row at its START and another at its END (a
// wake that dies midway still leaves its start row). The sentinel reads
// max(created_at): a missing or empty table is "not started" (skipped, never an
// incident, never a pass); a newest row older than 8 h is one critical incident
// for the supervisor that names the session and says what to do.

const HB = 'team:heartbeat';
const heartbeatWorld = (rows) => ({ ...healthyWorld(), agent_heartbeats: rows });
const beat = (hoursAgo, from = NOW) => ({ id: Math.round(hoursAgo * 100), agent: 'orchestrator', wake: 'test wake', note: null, created_at: ago(hoursAgo, from) });

test('heartbeat: a missing table is skipped — never an incident, never a pass', async () => {
  const r = checkHeartbeat({ missing: true }, NOW);
  assert.deepEqual(r.incidents, []);
  assert.deepEqual(r.passing, [], 'a check that could not judge resolves nothing');
  assert.deepEqual(r.skipped.map((s) => s.check), [HB]);
  assert.match(r.skipped[0].reason, /does not exist/);

  // What "missing" looks like on the wire: PostgREST 12+ (PGRST205) and bare Postgres (42P01).
  assert.equal(isMissingRelation({ code: 'PGRST205', message: "Could not find the table 'public.agent_heartbeats' in the schema cache" }), true);
  assert.equal(isMissingRelation({ code: '42P01', message: 'relation "public.agent_heartbeats" does not exist' }), true);
  assert.equal(isMissingRelation({ message: 'relation "public.agent_heartbeats" does not exist' }), true);
  // Anything else is not "missing": it throws and is skipped as could-not-run.
  assert.equal(isMissingRelation({ code: '42501', message: 'permission denied for table agent_heartbeats' }), false);
  assert.equal(isMissingRelation({ code: '42703', message: 'column agent_heartbeats.at does not exist' }), false);
  assert.equal(isMissingRelation({ message: 'TypeError: fetch failed' }), false);
  assert.equal(isMissingRelation(null), false);

  // End to end: the table's read answers "does not exist" → skipped, no claim, no mail, no db-down fallback.
  for (const failMessage of [undefined, "Could not find the table 'public.agent_heartbeats' in the schema cache"]) {
    const db = fakeDb(healthyWorld(), { fail: ['agent_heartbeats'], failMessage });
    const f = fakeFetch();
    const res = await run(db, f);
    const b = body(res);
    assert.equal(res.statusCode, 200, failMessage);
    assert.equal(b.found, 0);
    assert.equal(b.dbDown, undefined, 'a missing heartbeat table is not a database outage');
    assert.equal(f.mails.length, 0);
    assert.deepEqual(b.skipped.map((s) => s.check), [HB]);
    assert.match(b.skipped[0].reason, /does not exist .*not started/);
  }
});

test('heartbeat: an empty table (max(created_at) is null) is skipped — the first run after the migration mails nothing', async () => {
  for (const latest of [{ last: null }, { last: undefined }, {}, null]) {
    const r = checkHeartbeat(latest, NOW);
    assert.deepEqual(r.incidents, [], JSON.stringify(latest));
    assert.deepEqual(r.passing, []);
    assert.match(r.skipped[0].reason, /is empty/);
  }
  const db = fakeDb(heartbeatWorld([]));
  const f = fakeFetch();
  const b = body(await run(db, f));
  assert.equal(b.found, 0, JSON.stringify(b));
  assert.equal(f.mails.length, 0, 'no false "team is down" before the first wake writes');
  assert.deepEqual(b.skipped.map((s) => s.check), [HB]);
  assert.equal(db.tables.agent_incidents.length, 0);
});

test('heartbeat: a fresh row passes, up to and including exactly 8 h old', () => {
  for (const h of [0, 0.8, 5, 7.99, HEARTBEAT_THRESHOLD_HOURS]) {
    const r = checkHeartbeat({ last: ago(h) }, NOW);
    assert.deepEqual(r.incidents, [], `${h} h`);
    assert.deepEqual(r.passing, [HB], `${h} h`);
  }
  // A clock a little ahead on the writer's side is not an outage either.
  assert.deepEqual(checkHeartbeat({ last: ago(-0.1) }, NOW).passing, [HB]);
});

test('heartbeat: a row older than 8 h is one critical incident for the supervisor that names the session', () => {
  const last = ago(9.25);
  const r = checkHeartbeat({ last }, NOW);
  assert.deepEqual(r.passing, []);
  assert.equal(r.incidents.length, 1);
  const [i] = r.incidents;
  assert.equal(i.key, `${HB}:stale:${DAY}`, 'a state: claimed (and mailed) once per day while it lasts');
  assert.equal(i.check_id, HB);
  assert.equal(i.owner_agent, 'supervisor');
  assert.equal(i.severity, 'critical');
  assert.ok(OWNER_AGENTS.includes(i.owner_agent) && SEVERITIES.includes(i.severity));
  assert.ok(i.key.startsWith(i.check_id));
  assert.equal(TEAM_SESSION_ID, 'session_01Lh7GLuWHzpzXnkZTU46YyT');
  assert.match(i.title, /session_01Lh7GLuWHzpzXnkZTU46YyT has written no heartbeat for 9\.2 h/);
  assert.match(i.title, /stopped waking/);
  assert.match(i.hint, /^Open the session session_01Lh7GLuWHzpzXnkZTU46YyT .*or check the Routines/);
  assert.deepEqual(
    { last: i.detail.last, hours: i.detail.hours, thresholdHours: i.detail.thresholdHours, session: i.detail.session },
    { last, hours: 9.2, thresholdHours: 8, session: 'session_01Lh7GLuWHzpzXnkZTU46YyT' },
  );
  assert.match(i.detail.action, /Open the session .* or check the Routines/);
  assert.equal(i.mailed_elsewhere, false, 'nothing else mails this: the digest must');
  // The boundary reads the threshold, not a literal.
  assert.equal(checkHeartbeat({ last: ago(8 + 1 / 60) }, NOW).incidents.length, 1, 'one minute past 8 h fires');
  assert.equal(checkHeartbeat({ last: ago(9.25) }, NOW, 10).incidents.length, 0, 'a 10 h threshold lets 9.25 h pass');
});

test('heartbeat: the hint states the start-and-end rule — a row at the START and at the END of every scheduled wake — and reads the threshold', () => {
  // The operating rule since 2026-10-02 (changes/2026-10-02-website-heartbeat-check):
  // the start row keeps the 8 h switch honest when a wake dies midway, so a
  // silence means no wake started. The hint must not teach the old "one row at
  // the end" rule to whoever reads the owner's mail.
  const [i] = checkHeartbeat({ last: ago(9.25) }, NOW).incidents;
  assert.equal(
    i.hint,
    'Open the session session_01Lh7GLuWHzpzXnkZTU46YyT on claude.ai/code (unarchive it if archived), or check the Routines that wake it (docs/scorecard-routine.md). '
      + 'Every scheduled wake writes an agent_heartbeats row at its start and another at its end, so 8 h with no row means no wake even started.',
  );
  assert.doesNotMatch(i.hint, /\bends with\b|\bone agent_heartbeats row\b/i, 'the pre-2026-10-02 wording ("each wake ends with one row") is gone');
  // The number in the hint is the threshold the check judged by, never a literal.
  const [ten] = checkHeartbeat({ last: ago(11) }, NOW, 10).incidents;
  assert.match(ten.hint, /, so 10 h with no row means no wake even started\.$/);
  // Copy only: the title, the action, the key, the owner and the severity are what they were.
  assert.match(i.title, /^The agent team has stopped waking: the orchestrating session session_01Lh7GLuWHzpzXnkZTU46YyT has written no heartbeat for 9\.2 h$/);
  assert.equal(i.detail.action, 'Open the session session_01Lh7GLuWHzpzXnkZTU46YyT on claude.ai/code (unarchive it if it is archived), or check the Routines that wake it.');
  assert.deepEqual([i.key, i.owner_agent, i.severity, i.detail.thresholdHours], [`${HB}:stale:${DAY}`, 'supervisor', 'critical', HEARTBEAT_THRESHOLD_HOURS]);
  // The owner's mail carries the whole hint on one line.
  assert.ok(renderDigest([i], NOW).text.includes(`    what to check: ${i.hint}\n`));
  // The section comment above checkHeartbeat says the same, and no longer the old rule.
  const src = read('netlify/functions/_shared/sentinelLib.mjs');
  const section = src.slice(src.indexOf("// ─── g. the team's dead-man switch"), src.indexOf('export function checkHeartbeat')).replace(/\n\/\/ ?/g, ' ');
  assert.match(section, /every scheduled wake writes a row to public\.agent_heartbeats at its START and another at its END/);
  assert.match(section, /a wake that dies midway still proves the team woke/);
  assert.doesNotMatch(section, /every wake ends by writing one row/);
});

test('heartbeat end to end: a stale row mails one critical digest line, a fresh one resolves it, and an unreadable table resolves nothing', async () => {
  const world = heartbeatWorld([beat(30), beat(9.25)]);
  const db = fakeDb(world);
  const f = fakeFetch();
  const first = body(await run(db, f));
  assert.equal(first.claimed, 1, JSON.stringify(first));
  assert.equal(f.mails.length, 1);
  assert.match(f.mails[0].subject, /1 new incident \(1 critical\/high\) — critical/);
  assert.match(f.mails[0].text, /== supervisor \(1\)\n\[critical\] The agent team has stopped waking: the orchestrating session session_01Lh7GLuWHzpzXnkZTU46YyT/);
  assert.match(f.mails[0].text, /what to check: Open the session session_01Lh7GLuWHzpzXnkZTU46YyT/);
  const row = () => db.tables.agent_incidents.find((r) => r.key === `${HB}:stale:${DAY}`);
  assert.equal(row().owner_agent, 'supervisor');
  assert.ok(row().notified_at);

  // An hour later the read fails for another reason (not "missing"): could not run → stays open, no mail.
  const later = new Date(NOW.getTime() + 3600000);
  const flaky = fakeDb({ ...world, agent_incidents: db.tables.agent_incidents }, { fail: ['agent_heartbeats'], failMessage: 'permission denied for table agent_heartbeats' });
  const second = body(await run(flaky, f, { now: later }));
  assert.ok(second.skipped.some((s) => s.check === HB && /could not run: agent_heartbeats: permission denied/.test(s.reason)));
  assert.equal(flaky.tables.agent_incidents.find((r) => r.key === `${HB}:stale:${DAY}`).resolved_at, null);
  assert.equal(f.mails.length, 1);

  // The session wakes again and writes a heartbeat: the next run resolves the incident and mails nothing.
  const awake = fakeDb({ ...world, agent_heartbeats: [...world.agent_heartbeats, beat(0.2, later)], agent_incidents: flaky.tables.agent_incidents });
  const third = body(await run(awake, f, { now: new Date(later.getTime() + 3600000) }));
  assert.equal(third.resolved, 1, JSON.stringify(third));
  assert.ok(awake.tables.agent_incidents.find((r) => r.key === `${HB}:stale:${DAY}`).resolved_at);
  assert.equal(f.mails.length, 1, 'recovery is not mailed');
});

test('heartbeat: the read is max(created_at) of agent_heartbeats, newest first, one row', () => {
  const src = read('netlify/functions/sentinel.mjs');
  assert.match(src, /db\.from\('agent_heartbeats'\)\.select\('created_at'\)\.order\('created_at', \{ ascending: false \}\)\.limit\(1\)\.maybeSingle\(\)/);
  assert.match(src, /run\('team:heartbeat', async \(\) => checkHeartbeat\(await latestHeartbeat\(db\), now\)\)/);
  // The live table has id, agent, wake, note, created_at — no `at`, no `status` (roadmap r17 spec drift).
  const schema = JSON.parse(read('tests/fixtures/db-schema.json'));
  assert.deepEqual(schema.tables.agent_heartbeats, ['agent', 'created_at', 'id', 'note', 'wake']);
});

// The UTC times the orchestrating session is woken and writes its start and end
// heartbeats (roadmap r17, orchestrator decision 2026-10-01 19:59): the heartbeat-only
// Routine at 00:50 and the supervisor at 05:50, 09:50, 12:50, 15:50 and 19:50.
// Move or drop a Routine → update this list; the test then says whether 8 h
// still holds. Before the 00:50 wake existed the overnight hole was 10 h
// (19:50 → 05:50), and an 8 h check would have paged the owner every night.
const ORCHESTRATOR_WAKES_UTC = ['00:50', '05:50', '09:50', '12:50', '15:50', '19:50'];

test('THRESHOLD_HOURS (8) is strictly above the longest scheduled gap between orchestrator wakes (5 h)', () => {
  const minutes = ORCHESTRATOR_WAKES_UTC.map((t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; });
  assert.deepEqual([...minutes].sort((a, b) => a - b), minutes, 'keep the wake list in time order');
  // Gaps around the clock, including the overnight wrap 19:50 → 00:50.
  const gaps = minutes.map((m, i) => (i + 1 < minutes.length ? minutes[i + 1] - m : minutes[0] + 1440 - m));
  assert.equal(gaps.reduce((a, b) => a + b, 0), 1440, 'the gaps cover the whole day');
  const longestHours = Math.max(...gaps) / 60;
  assert.equal(longestHours, 5, '00:50 → 05:50 and 19:50 → 00:50');
  assert.equal(HEARTBEAT_THRESHOLD_HOURS, 8, 'PROTOCOL v3 "Staying alive": 8 hours');
  assert.ok(HEARTBEAT_THRESHOLD_HOURS > longestHours, `an ${HEARTBEAT_THRESHOLD_HOURS} h threshold must exceed the ${longestHours} h gap or it pages the owner on schedule`);

  // Replay three days of that schedule: every wake writes its heartbeat 10 min in,
  // the sentinel runs every hour at :50 — not one run may fire.
  const day0 = Date.parse('2026-10-02T00:00:00Z');
  const beats = [];
  for (let d = -1; d < 3; d += 1) for (const m of minutes) beats.push(day0 + d * 86400000 + (m + 10) * 60000);
  for (let t = day0 + 50 * 60000; t < day0 + 3 * 86400000; t += 3600000) {
    const last = Math.max(...beats.filter((b) => b <= t));
    const r = checkHeartbeat({ last: new Date(last).toISOString() }, new Date(t));
    assert.deepEqual(r.incidents, [], `sentinel run ${new Date(t).toISOString()} saw a heartbeat ${((t - last) / 3600000).toFixed(2)} h old`);
  }
});
