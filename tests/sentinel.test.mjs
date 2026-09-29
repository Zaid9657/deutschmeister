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
//      no claim → no mail, dry mode writes nothing, and resolution only by a
//      check that ran.
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

/** An in-memory stand-in for the supabase-js builder — exactly the chain shapes sentinel.mjs uses. */
function fakeDb(seed, { fail = [] } = {}) {
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
      if (fail.includes(this.name)) return { data: null, count: null, error: { message: `relation "public.${this.name}" does not exist` } };
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
  return { from: (name) => new Q(name), tables, writes };
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

test('no claim, no mail: an unapplied migration (claim error) sends nothing', async () => {
  const db = fakeDb(healthyWorld(), { fail: ['agent_incidents'] });
  const f = fakeFetch({ '/': { status: 500 } });
  const res = await run(db, f);
  assert.equal(res.statusCode, 500);
  assert.match(body(res).error, /agent_incidents|claim failed/);
  assert.equal(f.mails.length, 0);
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
