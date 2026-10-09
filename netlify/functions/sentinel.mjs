// Sentinel — the hourly watchdog.
//
// Every hour at :50 it looks at the things that fail silently: the key pages
// of the live site, Lemon Squeezy webhook deliveries, the signup rate, the
// scheduled jobs, the support SLA and the speaking flow. What it finds becomes
// a row in public.agent_incidents (migrations/2026-09-29-agent-incidents.sql),
// owned by one of the area agents, and — the first time only — a line in ONE
// digest email to the owner. The checks are pure functions in
// _shared/sentinelLib.mjs; this file fetches, records and mails.
//
// THE RULES IT KEEPS
//   - Claim before send. An incident is claimed with INSERT … ON CONFLICT (key)
//     DO NOTHING RETURNING; only rows this run inserted can be mailed, so a
//     repeated or concurrent run mails nothing twice. No claim, no digest.
//   - The one exception is the outage that already happened (the project was
//     paused on 2026-09-14): when the DB probe fails or the claim errors, the
//     ledger is unreachable, so the run sends ONE stateless fallback mail
//     instead — "[DM sentinel] Supabase unreachable — <first error line>" —
//     and no digest. It repeats every hour while the database stays down, on
//     purpose; SENTINEL_MUTE=db-down silences it, and the kill switch and the
//     OWNER_ALERT_EMAIL / RESEND_API_KEY fail-closed rules apply to it too.
//   - Never mail twice what another job already mails: renewal payment
//     failures (lemonsqueezy-webhook emails the owner) are recorded with
//     mailed_elsewhere = true and left out of the digest. The weekly-truth
//     numbers are never re-sent; only a missed weekly-truth RUN is an incident.
//   - Resolve only what was re-checked: an open incident is closed when its
//     check ran this hour and passed. A check whose reads failed passes nothing.
//   - Every list read is paged past PostgREST's 1,000-row cap (fetchAll), and
//     every count is a head:true count — never rows.length.
//   - A quiet day is not an outage. A ledger job (trial, activation, confirm,
//     course) is stale only if someone was due at its runs since its last
//     ledger row — asked of the job's OWN selection (DUE_READERS), so the
//     sentinel judges the queue the job mails. Unreadable → skipped, never an
//     incident. (2026-09-30: a drained nudge backlog read as a 78 h outage.)
//   - Not started is not stopped. The team's dead-man switch (team:heartbeat,
//     roadmap r17) reads the newest public.agent_heartbeats row: a missing or
//     empty table is skipped; only a heartbeat older than 8 h is an incident
//     (critical, owner supervisor).
//
// SHIPS OFF / FAILS CLOSED
//   SENTINEL_ENABLED must be exactly 'true' or the run no-ops.
//   OWNER_ALERT_EMAIL unset (or RESEND_API_KEY unset): incidents are recorded,
//   nothing is sent. Scheduler calls carry `next_run`; a manual run needs
//   ?secret=<CAMPAIGN_SECRET>. ?dry=1 runs every check and returns the incident
//   list without writing or mailing anything.
// Docs: docs/agents/production-agents.md ("Sentinel").
import { schedule } from '@netlify/functions';
import { supabase as serviceClient } from './_shared/supabase.mjs';
import { fetchAll, exactCount, counting } from './_shared/adminHttp.mjs';
import { SCHEDULED_JOBS } from './_shared/adminStatusLib.mjs';
import { OPEN_STATUSES } from './_shared/adminSupportLib.mjs';
import {
  KEY_PAGES, SENTINEL_THRESHOLDS, LEDGER_JOB_DUE, dayOf,
  checkPage, checkWebhooks, checkPaymentFailures, checkSignups, checkJobs,
  needsDueCheck, dueSpan, countDue, parseCanary,
  checkSpeakingCloseout, checkSupportSla, checkSpeakingFlows, checkDatabase,
  shouldResolve, parseMute, isMuted, selectForMail, renderDigest, renderDbDownAlert, DB_DOWN_CHECK_ID,
  checkHeartbeat, isMissingRelation,
} from './_shared/sentinelLib.mjs';
import { selectRecipients as trialRecipients, TRIAL_KINDS } from './trial-lifecycle.mjs';
import { selectCandidates as activationCandidates, WINDOWS as ACTIVATION_WINDOWS } from './activation-lifecycle.mjs';
import { selectCandidates as nudgeCandidates } from './confirmation-nudge.mjs';
import { selectRecipients as courseRecipients } from './course-reminder.mjs';

const ALLOWED_ORIGINS = ['https://deutsch-meister.de', 'https://www.deutsch-meister.de'];
const FROM_ADDRESS = 'DeutschMeister Sentinel <zaid@deutsch-meister.de>';
const PAGE_TIMEOUT_MS = 8000;
const HOUR = 3600000;

function corsHeaders(event) {
  const origin = event?.headers?.origin || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  };
}

// ─── fetching ────────────────────────────────────────────────────────────────

async function fetchPage(fetchImpl, siteUrl, page) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PAGE_TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${siteUrl}${page.path}`, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'DeutschMeister-Sentinel/1.0 (+https://deutsch-meister.de)' },
    });
    return { status: res.status, html: res.status === 200 ? await res.text() : '' };
  } catch (e) {
    return { error: e?.name === 'AbortError' ? `timeout after ${PAGE_TIMEOUT_MS} ms` : e?.message || String(e) };
  } finally {
    clearTimeout(timer);
  }
}

async function latestLedger(db, job) {
  if (!job.ledger) {
    const { data, error } = await db.from('weekly_metrics').select('measured_at').order('measured_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error(`weekly_metrics: ${error.message}`);
    return data?.measured_at ?? null;
  }
  const query = job.ledger.eq
    ? db.from('lifecycle_emails').select('sent_at').eq('kind', job.ledger.eq)
    : db.from('lifecycle_emails').select('sent_at').like('kind', `${job.ledger.prefix}%`);
  const { data, error } = await query.order('sent_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(`lifecycle_emails: ${error.message}`);
  return data?.sent_at ?? null;
}

const eachKind = async (kinds, read) => Object.fromEntries(await Promise.all(kinds.map(async (k) => [k, await read(k)])));

/**
 * Who each ledger job would have mailed at the runs in `span` — the job's OWN
 * selection (the one its handler calls with no span), so there is one
 * definition of "who is due" and the sentinel cannot drift from the mailer.
 * `canary`: the job honours LIFECYCLE_TEST_RECIPIENTS, so while it is set only
 * listed addresses count. A ledger job in SCHEDULED_JOBS without a reader here
 * is skipped as ambiguous, never judged (tests/sentinel.test.mjs pins the set).
 */
export const DUE_READERS = Object.freeze({
  'job-trial': { canary: false, read: (db, span) => eachKind(TRIAL_KINDS, (k) => trialRecipients(k, { client: db, span })) },
  'job-activation': { canary: true, read: (db, span) => eachKind(Object.keys(ACTIVATION_WINDOWS), (k) => activationCandidates(k, { client: db, span })) },
  'job-confirm': { canary: true, read: (db, span) => eachKind(['confirm_nudge'], () => nudgeCandidates(db, { span, limit: Infinity })) },
  'job-course': { canary: true, read: (db, span, now) => eachKind(['course_reminder'], () => courseRecipients({ client: db, span, now: now.getTime() })) },
});

function withTimeout(promise, ms, what) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${what} timed out after ${ms} ms`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Who was due at a stale ledger job's runs since `last`. Never throws: a failed read is { count: null, reason }. */
async function measureDue(db, job, last, now, env) {
  const span = dueSpan(job, last, now);
  if (!span) return { count: null, reason: `${job.fn} has no daily schedule to replay (${job.cron || 'none'})` };
  if (span.runs === 0) return { count: 0, byKind: {}, ...span };
  const reader = DUE_READERS[job.id];
  if (!reader) return { count: null, reason: `no eligibility reader for ${job.fn}` };
  try {
    const byKind = await withTimeout(reader.read(db, { first: span.first, last: span.last }, now), LEDGER_JOB_DUE.timeoutMs, `${job.fn} eligibility read`);
    return { ...countDue(byKind, { canary: reader.canary ? parseCanary(env.LIFECYCLE_TEST_RECIPIENTS) : null }), ...span };
  } catch (e) {
    console.error(`[sentinel] eligibility read for ${job.fn} failed:`, e.message);
    return { count: null, reason: e.message };
  }
}

/**
 * The team's newest heartbeat: max(created_at) of public.agent_heartbeats (the
 * created_at DESC index). { last } — null when the table is empty — or
 * { missing: true } when the table does not exist; both are "not started" to
 * checkHeartbeat. Any other error throws, so the check is skipped as "could not
 * run" and resolves nothing.
 */
async function latestHeartbeat(db) {
  const { data, error } = await db.from('agent_heartbeats').select('created_at').order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) {
    if (isMissingRelation(error)) return { missing: true };
    throw new Error(`agent_heartbeats: ${error.message}`);
  }
  return { last: data?.created_at ?? null };
}

/**
 * Run every check. A check whose reads throw is reported in `skipped` and
 * contributes no incident and no `passing` — its open incidents stay open.
 */
export async function runChecks({ db, fetchImpl, env, now }) {
  const nowMs = now.getTime();
  const iso = (ms) => new Date(ms).toISOString();
  const siteUrl = String(env.SITE_URL || 'https://deutsch-meister.de').replace(/\/+$/, '');
  const T = SENTINEL_THRESHOLDS;
  const results = [];
  const skipped = [];
  let dbError = null; // set when the reachability probe fails — the ledger is presumed unreachable

  const run = async (name, fn) => {
    try {
      const r = await fn();
      results.push(r);
      if (r.skipped) skipped.push(...r.skipped);
    } catch (e) {
      console.error(`[sentinel] check ${name} could not run:`, e.message);
      skipped.push({ check: name, reason: `could not run: ${e.message}` });
    }
  };

  await Promise.all([
    // a. key pages
    ...KEY_PAGES.map((page) => run(`page:${page.path}`, async () => checkPage(page, await fetchPage(fetchImpl, siteUrl, page), now))),

    // f(db). one count round trip — the reachability probe, and the signup numerator
    run('db+signups', async () => {
      const t0 = Date.now();
      let last24;
      try {
        last24 = await exactCount(() => counting(db, 'profiles').gte('created_at', iso(nowMs - 24 * HOUR)));
      } catch (e) {
        dbError = e?.message || String(e);
        throw e;
      }
      const latency = Date.now() - t0;
      const prior7 = await exactCount(() => counting(db, 'profiles').gte('created_at', iso(nowMs - 8 * 24 * HOUR)).lt('created_at', iso(nowMs - 24 * HOUR)));
      const db1 = checkDatabase(latency, now);
      // c. signup drop
      const s = checkSignups({ last24, prior7 }, now);
      return { incidents: [...db1.incidents, ...s.incidents], passing: [...db1.passing, ...s.passing] };
    }),

    // b. payment webhooks (+ renewal failures, logged only)
    run('webhooks', async () => {
      const rows = await fetchAll(() => db.from('webhook_logs')
        .select('id, event_type, processed, error, created_at, data_id:payload->data->>id')
        .gte('created_at', iso(nowMs - T.webhookWindowHours * HOUR))
        .order('created_at', { ascending: true }));
      return checkWebhooks(rows, now);
    }),
    run('payment-failed', async () => {
      const rows = await fetchAll(() => db.from('payment_failures')
        .select('id, lemonsqueezy_event_id, lemonsqueezy_subscription_id, failed_at')
        .gte('failed_at', iso(nowMs - 24 * HOUR))
        .order('failed_at', { ascending: true }));
      return checkPaymentFailures(rows);
    }),

    // d. scheduled jobs (adminStatusLib's list and thresholds) + speaking-closeout by its effect.
    // A stale ledger job is judged only with who was due (measureDue).
    run('jobs', async () => {
      const evidence = await Promise.all(SCHEDULED_JOBS.map(async (job) => {
        const last = await latestLedger(db, job);
        if (!needsDueCheck(job, last, now, env)) return { job, last };
        return { job, last, due: await measureDue(db, job, last, now, env) };
      }));
      return checkJobs(evidence, now, env);
    }),
    run('job-speaking-closeout', async () => {
      const active = await fetchAll(() => db.from('speaking_sessions')
        .select('session_token, status, started_at, planned_minutes')
        .eq('status', 'active')
        .order('started_at', { ascending: true }));
      return checkSpeakingCloseout(active, now);
    }),

    // e. support SLA
    run('support-sla', async () => {
      const tickets = await fetchAll(() => db.from('support_tickets')
        .select('id, reference, status, priority, sla_due_at, first_response_at')
        .in('status', [...OPEN_STATUSES])
        .order('created_at', { ascending: true }));
      return checkSupportSla(tickets, now);
    }),

    // f. broken flows: speaking in the last 24 h
    run('flow:speaking', async () => {
      const sessions = await fetchAll(() => db.from('speaking_sessions')
        .select('session_token, status, mode, user_turns, evaluated, created_at')
        .gte('created_at', iso(nowMs - 24 * HOUR))
        .order('created_at', { ascending: true }));
      const tokens = sessions.map((s) => s.session_token).filter(Boolean);
      const evals = tokens.length
        ? await fetchAll(() => db.from('speaking_evaluations').select('session_token, score, total_score').in('session_token', tokens).order('created_at', { ascending: true }))
        : [];
      return checkSpeakingFlows(sessions, evals, now);
    }),

    // g. the team's dead-man switch (roadmap r17): no heartbeat for 8 h → critical, owner supervisor
    run('team:heartbeat', async () => checkHeartbeat(await latestHeartbeat(db), now)),
  ]);

  return {
    incidents: results.flatMap((r) => r.incidents),
    passing: results.flatMap((r) => r.passing),
    skipped,
    dbError,
  };
}

// ─── recording ───────────────────────────────────────────────────────────────

/**
 * Claim, touch, resolve. Returns the incidents THIS run inserted — the only
 * ones that may be mailed. Throws when the claim fails, so nothing is mailed.
 */
export async function recordIncidents(db, incidents, passing, now) {
  const nowIso = now.toISOString();
  const keys = incidents.map((i) => i.key);

  // Rows that already exist for this run's keys (open or resolved earlier today).
  const existing = keys.length
    ? await fetchAll(() => db.from('agent_incidents').select('id, key, seen_count').in('key', keys).order('key', { ascending: true }))
    : [];
  const known = new Map(existing.map((r) => [r.key, r]));

  // Claim: INSERT … ON CONFLICT (key) DO NOTHING RETURNING id, key.
  let claimedKeys = new Set();
  const fresh = incidents.filter((i) => !known.has(i.key));
  if (fresh.length) {
    const { data, error } = await db.from('agent_incidents')
      .upsert(fresh.map((i) => ({
        key: i.key,
        check_id: i.check_id,
        owner_agent: i.owner_agent,
        severity: i.severity,
        title: i.title,
        detail: { ...i.detail, what_to_check: i.hint },
        first_seen_at: nowIso,
        last_seen_at: nowIso,
        seen_count: 1,
        mailed_elsewhere: i.mailed_elsewhere,
      })), { onConflict: 'key', ignoreDuplicates: true })
      .select('id, key');
    if (error) throw new Error(`claim failed (migration applied?): ${error.message}`);
    claimedKeys = new Set((data || []).map((r) => r.key));
  }

  // Repeats: seen again this hour — bump the counters, reopen if it had been resolved.
  let touched = 0;
  for (const row of existing) {
    const { error } = await db.from('agent_incidents')
      .update({ last_seen_at: nowIso, seen_count: Number(row.seen_count || 0) + 1, resolved_at: null })
      .eq('id', row.id);
    if (error) console.error('[sentinel] touch failed:', row.key, error.message);
    else touched += 1;
  }

  // Resolve: open incidents whose check ran this hour and passed.
  const open = await fetchAll(() => db.from('agent_incidents').select('id, check_id').is('resolved_at', null).order('first_seen_at', { ascending: true }));
  const firing = new Set(incidents.map((i) => i.check_id));
  const toResolve = open.filter((r) => shouldResolve(r, passing, firing)).map((r) => r.id);
  if (toResolve.length) {
    const { error } = await db.from('agent_incidents').update({ resolved_at: nowIso }).in('id', toResolve);
    if (error) console.error('[sentinel] resolve failed:', error.message);
  }

  return { claimed: incidents.filter((i) => claimedKeys.has(i.key)), touched, resolved: toResolve.length };
}

/**
 * The stateless fallback: Supabase (and with it the ledger) is unreachable, so
 * nothing can be claimed. ONE short mail per run — hourly repeats while it
 * stays down are intended — under the same kill switch, mute (`db-down`) and
 * OWNER_ALERT_EMAIL / RESEND_API_KEY fail-closed rules as the digest.
 */
async function sendDbDownFallback(fetchImpl, env, error, now) {
  if (isMuted({ check_id: DB_DOWN_CHECK_ID }, parseMute(env.SENTINEL_MUTE))) {
    console.error('[sentinel] Supabase unreachable — fallback muted by SENTINEL_MUTE:', error);
    return { fallbackMailed: false, fallbackMuted: true };
  }
  const to = String(env.OWNER_ALERT_EMAIL || '').trim();
  if (!to || !env.RESEND_API_KEY) {
    console.error(`[sentinel] Supabase unreachable and ${!to ? 'OWNER_ALERT_EMAIL' : 'RESEND_API_KEY'} not set — not mailed:`, error);
    return { fallbackMailed: false };
  }
  const { subject, text } = renderDbDownAlert(error, now);
  const sent = await sendDigest(fetchImpl, { resendKey: env.RESEND_API_KEY, to, subject, text });
  return { fallbackMailed: sent };
}

async function sendDigest(fetchImpl, { resendKey, to, subject, text }) {
  try {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, text }),
    });
    if (!res.ok) console.error(`[sentinel] Resend ${res.status}:`, (await res.text()).slice(0, 300));
    return res.ok;
  } catch (e) {
    console.error('[sentinel] email threw:', e.message);
    return false;
  }
}

// ─── handler ─────────────────────────────────────────────────────────────────

/** The whole run, with every dependency injectable (tests pass a fake db and fetch). */
export async function runSentinel({ event = {}, env = process.env, db = serviceClient, fetchImpl = globalThis.fetch, now = new Date() } = {}) {
  const headers = corsHeaders(event);
  const reply = (statusCode, body) => ({ statusCode, headers, body: JSON.stringify(body) });
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  if (env.SENTINEL_ENABLED !== 'true') {
    console.log('[sentinel] SENTINEL_ENABLED is not "true" — doing nothing.');
    return reply(200, { enabled: false });
  }
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !db) return reply(500, { error: 'SUPABASE_SERVICE_ROLE_KEY not set' });

  const qs = event.queryStringParameters || {};
  let bodyPayload = {};
  try { bodyPayload = JSON.parse(event.body || '{}'); } catch { /* ignore */ }
  const isScheduled = typeof bodyPayload?.next_run === 'string';
  const secretOk = Boolean(env.CAMPAIGN_SECRET) && qs.secret === env.CAMPAIGN_SECRET;
  if (!isScheduled && !secretOk) {
    console.warn('[sentinel] rejected unauthenticated invocation');
    return reply(401, { error: 'Unauthorized' });
  }
  const dry = qs.dry === '1';

  const { incidents, passing, skipped, dbError } = await runChecks({ db, fetchImpl, env, now });
  const summary = incidents.map((i) => ({ key: i.key, owner_agent: i.owner_agent, severity: i.severity, title: i.title, mailed_elsewhere: i.mailed_elsewhere }));

  if (dry) return reply(200, { enabled: true, dry: true, day: dayOf(now), incidents: summary, passing, skipped, dbError });

  // The probe failed: the ledger is unreachable, so no claim and no digest —
  // only the stateless fallback.
  if (dbError) {
    const fb = await sendDbDownFallback(fetchImpl, env, dbError, now);
    return reply(500, { enabled: true, dbDown: true, error: dbError, ...fb, incidents: summary, skipped });
  }

  let recorded;
  try {
    recorded = await recordIncidents(db, incidents, passing, now);
  } catch (e) {
    // No claim, no digest. The claim failing is the ledger being unreachable
    // (or not migrated): send the fallback instead.
    console.error('[sentinel] recording failed — no digest:', e.message);
    const fb = await sendDbDownFallback(fetchImpl, env, e.message, now);
    return reply(500, { enabled: true, dbDown: true, error: e.message, ...fb, incidents: summary, skipped });
  }

  const { mail, mailedElsewhere, muted } = selectForMail(recorded.claimed, parseMute(env.SENTINEL_MUTE));
  const out = {
    enabled: true, day: dayOf(now), found: incidents.length, claimed: recorded.claimed.length,
    touched: recorded.touched, resolved: recorded.resolved, mailedElsewhere: mailedElsewhere.length,
    muted: muted.length, emailed: 0, skipped,
  };

  if (mail.length === 0) return reply(200, out);
  const to = String(env.OWNER_ALERT_EMAIL || '').trim();
  if (!to || !env.RESEND_API_KEY) {
    console.error(`[sentinel] ${!to ? 'OWNER_ALERT_EMAIL' : 'RESEND_API_KEY'} not set — ${mail.length} incident(s) recorded, not mailed`);
    return reply(200, { ...out, notMailed: mail.length });
  }

  const { subject, text } = renderDigest(mail, now, { siteUrl: env.SITE_URL || 'https://deutsch-meister.de', muted: muted.length });
  const sent = await sendDigest(fetchImpl, { resendKey: env.RESEND_API_KEY, to, subject, text });
  if (sent) {
    const { error } = await db.from('agent_incidents').update({ notified_at: now.toISOString() }).in('key', mail.map((i) => i.key));
    if (error) console.error('[sentinel] notified_at update failed:', error.message);
  }
  console.log('[sentinel]', JSON.stringify({ ...out, skipped: skipped.length, emailed: sent ? mail.length : 0 }));
  return reply(200, { ...out, emailed: sent ? mail.length : 0 });
}

// A literal on purpose: Netlify reads the cron out of this call statically.
// Mirrored in netlify.toml ([functions."sentinel"]); this wrapper is authoritative.
export const handler = schedule('50 * * * *', (event) => runSentinel({ event }));
