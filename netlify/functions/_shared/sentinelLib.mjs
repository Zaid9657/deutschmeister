// Sentinel — the hourly watchdog, pure half.
//
// Every check here is a function over data the handler already fetched
// (netlify/functions/sentinel.mjs): no network, no database, no clock of its
// own. Each returns { incidents, passing }:
//
//   incidents  what is wrong now. Every incident carries a stable `key` (the
//              claim: one row, one mail, per problem — per day where the
//              problem is a state, per row where it is an event), a `check_id`
//              naming the problem without the day, an `owner_agent` from
//              OWNER_AGENTS, a severity, a title, a detail object and a one-line
//              `hint` — what to check first.
//   passing    check_ids this run EVALUATED and found healthy. Only these may
//              resolve an open incident. A check that could not run (a failed
//              query, a sample too small to judge) passes nothing, so an outage
//              of the sentinel's own reads never reads as "all clear". An entry
//              ending in ':' covers every check_id with that prefix.
//
// Thresholds are named, dated and passed in (SENTINEL_THRESHOLDS), so the tests
// can prove each check reads its threshold instead of a literal.

import { THRESHOLDS, judge, jobStaleness } from './adminStatusLib.mjs';
import { slaState, ticketReference } from './adminSupportLib.mjs';
import { classifyFailure } from './adminUsageLib.mjs';
import { reconcileCoverage } from './adminFunnelLib.mjs';
import { isStale } from './speakingCloseout.mjs';

/** Who acts on an incident. Mirrors the CHECK in migrations/2026-09-29-agent-incidents.sql (test-pinned). */
export const OWNER_AGENTS = Object.freeze([
  'revenue', 'conversion', 'product', 'acquisition', 'seo', 'content',
  'retention', 'support', 'website', 'webperf', 'security', 'supervisor',
]);
export const SEVERITIES = Object.freeze(['critical', 'high', 'medium', 'low']);

export const SENTINEL_THRESHOLDS = Object.freeze({
  // scripts/check-built-html.mjs MIN_BODY_CHARS: below this a page has no reason to be indexed.
  minBodyChars: 250,
  // A failed webhook row younger than this may still be retried by Lemon Squeezy.
  webhookGraceMinutes: 15,
  webhookWindowHours: 48,
  // Signups: last 24 h against the daily average of the 7 days before them.
  signupDropRatio: 0.4,
  signupMinDailyAvg: 3,
  // Speaking: the zero-turn share was 53 % over 30 days before the 2026-09-27
  // fix (migrations/2026-09-27-speaking-zero-turn-closeout.sql); half is the defect state.
  zeroTurnRatio: 0.5,
  minSpeakingSessions: 5,
  // speaking-closeout runs hourly at :20; a session this long past its deadline was missed.
  closeoutMissedMinutes: 90,
});

/** The pages the sentinel fetches. kind: astro | prerendered (exactly one h1, a real body) | spa (a shell). */
export const KEY_PAGES = Object.freeze([
  { path: '/', kind: 'astro', owner: 'website', critical: true },
  { path: '/pricing/', kind: 'astro', owner: 'website', critical: true },
  { path: '/grammar/', kind: 'astro', owner: 'seo' },
  // A1.1's second topic; in grammar-content-cache.json, public/llms-full.txt and the sitemap.
  { path: '/grammar/a1.1/verb-sein/', kind: 'astro', owner: 'seo' },
  { path: '/courses/', kind: 'astro', owner: 'website' },
  { path: '/leitfaden/', kind: 'astro', owner: 'seo' },
  { path: '/leitfaden/telc-b1/', kind: 'astro', owner: 'seo' },
  { path: '/vergleich/', kind: 'astro', owner: 'seo' },
  { path: '/level-test/', kind: 'prerendered', owner: 'website' },
  { path: '/faq/', kind: 'prerendered', owner: 'website' },
  // No prerender, no trailing slash: a netlify.toml rewrite onto the app shell.
  { path: '/support', kind: 'spa', owner: 'website' },
]);

/** 2026-09-29 — the UTC day that makes a state-like key re-mail once per day while it persists. */
export const dayOf = (now) => new Date(now).toISOString().slice(0, 10);

const incident = ({ key, checkId, owner, severity, title, detail = {}, hint, mailedElsewhere = false }) => ({
  key,
  check_id: checkId,
  owner_agent: owner,
  severity,
  title,
  detail,
  hint,
  mailed_elsewhere: mailedElsewhere,
});

const ok = (passing = []) => ({ incidents: [], passing });

// ─── a. key pages ────────────────────────────────────────────────────────────

const stripComments = (html) => html.replace(/<!--[\s\S]*?-->/g, ' ');
const stripNoscript = (html) => html.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

/** Visible text, the way scripts/check-built-html.mjs measures it: no scripts, styles, crawler block or tags. */
export function visibleText(html) {
  return decode(String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Title, h1 count and body text length of a served page — comments and <noscript> excluded. */
export function inspectHtml(html) {
  const structural = stripNoscript(stripComments(String(html || '')));
  const titleMatch = structural.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decode(titleMatch[1]).trim() : '';
  const h1Count = [...structural.matchAll(/<h1[\s>]/gi)].length;
  // <main> when the page has one (Astro's Layout), so a full header and footer
  // around an empty article still read as empty; otherwise the whole <body>
  // (the prerendered SPA routes inject their copy into #root).
  const main = structural.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const body = structural.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyChars = visibleText(main ? main[1] : body ? body[1] : structural).length;
  const hasRoot = /<div[^>]+id=["']root["']/i.test(structural);
  const hasModule = /<script[^>]+type=["']module["'][^>]*\ssrc=|<script[^>]+src=[^>]+type=["']module["']/i.test(structural);
  return { title, h1Count, bodyChars, hasRoot, hasModule };
}

/**
 * One key page. `res` = { status, html } from the fetch, or { error } when the
 * fetch itself failed (DNS, TLS, timeout) — reported as status 0.
 */
export function checkPage(page, res, now, T = SENTINEL_THRESHOLDS) {
  const day = dayOf(now);
  const id = (sub) => `page:${page.path}:${sub}`;
  const status = res?.error ? 0 : Number(res?.status ?? 0);
  if (status !== 200) {
    return {
      incidents: [incident({
        key: `${id('status')}:${day}`,
        checkId: id('status'),
        owner: page.owner,
        severity: page.critical ? 'critical' : 'high',
        title: `${page.path} answers ${status === 0 ? 'nothing (fetch failed)' : `HTTP ${status}`}`,
        detail: { path: page.path, status, error: res?.error ? String(res.error).slice(0, 200) : null },
        hint: `Netlify: is the latest deploy published, and does netlify.toml still route ${page.path}? Open it in a browser.`,
      })],
      passing: [],
    };
  }

  const info = inspectHtml(res.html);
  const incidents = [];
  const passing = [id('status')];
  const add = (sub, severity, title, hint, detail = {}) => incidents.push(incident({
    key: `${id(sub)}:${day}`, checkId: id(sub), owner: page.owner, severity, title, detail: { path: page.path, ...detail }, hint,
  }));

  if (!info.title) add('title', 'medium', `${page.path} has an empty <title>`, 'The page head in the build (scripts/check-built-html.mjs catches this on dist/).');
  else passing.push(id('title'));

  if (page.kind === 'spa') {
    if (!info.hasRoot || !info.hasModule) {
      add('shell', 'high', `${page.path} is not the app shell (no #root or no module script)`, 'dist/app.html in the last deploy and the netlify.toml rewrite for this route.', { hasRoot: info.hasRoot, hasModule: info.hasModule });
    } else passing.push(id('shell'));
    return { incidents, passing };
  }

  if (info.h1Count !== 1) {
    add('h1', 'medium', `${page.path} has ${info.h1Count} <h1> elements, expected 1`, page.kind === 'prerendered' ? 'scripts/prerender-spa-routes.mjs output for this route.' : 'The Astro page/layout for this route.', { h1Count: info.h1Count });
  } else passing.push(id('h1'));

  if (info.bodyChars < T.minBodyChars) {
    add('body', 'high', `${page.path} renders an empty body (${info.bodyChars} chars of text)`, page.kind === 'prerendered' ? 'The prerender step (scripts/prerender-spa-routes.mjs) in the last Netlify build log.' : 'The Astro build log: did the Supabase content fetch fall back or fail?', { bodyChars: info.bodyChars, min: T.minBodyChars });
  } else passing.push(id('body'));

  return { incidents, passing };
}

// ─── b. payment webhooks ─────────────────────────────────────────────────────

const failedRow = (r) => r.processed === false || (r.error !== null && r.error !== undefined && r.error !== '');

/**
 * Lemon Squeezy deliveries that failed and were not recovered. rows:
 * webhook_logs in the window, { id, event_type, processed, error, created_at,
 * data_id } (data_id = payload->data->>id). A failure is RECOVERED when a
 * later row for the same event (type + data id) was processed cleanly — the
 * Lemon Squeezy retry or a manual replay. A failure younger than the grace
 * period is left alone: the retry may still land.
 */
export function checkWebhooks(rows, now, T = SENTINEL_THRESHOLDS) {
  const nowMs = new Date(now).getTime();
  const graceCut = nowMs - T.webhookGraceMinutes * 60000;
  const okLater = (f) => rows.some((r) => !failedRow(r) && r.event_type === f.event_type && f.data_id && r.data_id === f.data_id && Date.parse(r.created_at) > Date.parse(f.created_at));
  const incidents = [];
  const passing = [];
  for (const f of rows.filter(failedRow)) {
    const checkId = `webhook:${f.id}`;
    if (okLater(f)) { passing.push(checkId); continue; }
    if (Date.parse(f.created_at) > graceCut) continue;
    incidents.push(incident({
      key: checkId,
      checkId,
      owner: 'revenue',
      severity: 'high',
      title: `Lemon Squeezy webhook ${f.event_type || 'unknown'} failed and was not recovered`,
      detail: { webhook_log_id: f.id, event_type: f.event_type ?? null, data_id: f.data_id ?? null, created_at: f.created_at, error: f.error ? String(f.error).slice(0, 300) : null },
      hint: 'webhook_logs.error for this row and /admin/operations?tab=webhooks; after the fix, replay the event in Lemon Squeezy.',
    }));
  }
  return { incidents, passing };
}

/**
 * Renewal payment failures. lemonsqueezy-webhook's handlePaymentFailed already
 * emails the owner (once per subscription per 7 days), so these are LOGGED,
 * never mailed again (mailed_elsewhere). Events, not states: nothing resolves them.
 */
export function checkPaymentFailures(rows) {
  return {
    incidents: rows.map((p) => incident({
      key: `payment-failed:${p.lemonsqueezy_event_id || p.id}`,
      checkId: `payment-failed:${p.lemonsqueezy_event_id || p.id}`,
      owner: 'revenue',
      severity: 'medium',
      title: `Renewal payment failed (subscription ${p.lemonsqueezy_subscription_id ?? 'unknown'})`,
      detail: { payment_failure_id: p.id, subscription: p.lemonsqueezy_subscription_id ?? null, failed_at: p.failed_at ?? null },
      hint: 'Already mailed by lemonsqueezy-webhook. /admin/operations?tab=failed.',
      mailedElsewhere: true,
    })),
    passing: [],
  };
}

// ─── c. signup drop ──────────────────────────────────────────────────────────

/**
 * last24: profiles created in the last 24 h. prior7: profiles created in the
 * 7 days BEFORE those 24 h (the baseline must not contain the drop it judges).
 * Zero signups in a day is always an incident; a drop below the ratio only
 * when the baseline is large enough to mean something.
 */
export function checkSignups({ last24, prior7 }, now, T = SENTINEL_THRESHOLDS) {
  const day = dayOf(now);
  const avg = Number(prior7) / 7;
  const detail = { last24h: Number(last24), prior7d: Number(prior7), dailyAvg: Math.round(avg * 100) / 100, ratio: T.signupDropRatio, minAvg: T.signupMinDailyAvg };
  if (Number(last24) === 0) {
    return {
      incidents: [incident({
        key: `signups:zero:${day}`, checkId: 'signups', owner: 'acquisition', severity: 'high',
        title: `No signups in the last 24 h (7-day average ${detail.dailyAvg}/day)`,
        detail,
        hint: 'Try a signup end to end; Supabase auth logs; the handle_new_user() trigger (profiles are written by it).',
      })],
      passing: [],
    };
  }
  if (avg >= T.signupMinDailyAvg && Number(last24) < T.signupDropRatio * avg) {
    return {
      incidents: [incident({
        key: `signups:drop:${day}`, checkId: 'signups', owner: 'acquisition', severity: 'medium',
        title: `Signups fell to ${last24} in 24 h (7-day average ${detail.dailyAvg}/day)`,
        detail,
        hint: 'profiles.acquisition_source for the last days, PostHog signup funnel, and what shipped in the last deploy.',
      })],
      passing: [],
    };
  }
  return ok(['signups']);
}

// ─── d. scheduled jobs ───────────────────────────────────────────────────────

/**
 * evidence: [{ job, last }] with `job` from adminStatusLib.SCHEDULED_JOBS and
 * `last` its latest ledger timestamp (or null). Staleness is judged by
 * adminStatusLib.jobStaleness against the Monitoring screen's thresholds.
 * A gated-off job and a job with no evidence are SKIPPED with a reason —
 * never guessed at.
 */
export function checkJobs(evidence, now, env = {}) {
  const day = dayOf(now);
  const incidents = [];
  const passing = [];
  const skipped = [];
  for (const { job, last } of evidence) {
    if (job.gate && env[job.gate] !== 'true') {
      skipped.push({ check: job.id, reason: `${job.fn} is gated off (${job.gate} is not "true") — no evidence expected.` });
      continue;
    }
    const { hours, state, thresholdKey } = jobStaleness(job, last, now);
    if (state === 'unknown') {
      skipped.push({ check: job.id, reason: `No evidence for ${job.fn} in the database. ${job.caveat}` });
      continue;
    }
    if (state === 'operational') { passing.push(job.id); continue; }
    incidents.push(incident({
      key: `${job.id}:stale:${day}`,
      checkId: job.id,
      owner: job.cadence === 'weekly' ? 'website' : 'retention',
      severity: state === 'critical' ? 'high' : 'medium',
      title: `${job.fn} has left no evidence for ${hours} h`,
      detail: { job: job.fn, last, hours, threshold: THRESHOLDS[thresholdKey], caveat: job.caveat },
      hint: `Netlify function log for ${job.fn}${job.gate ? ` and the ${job.gate} env var` : ''}; Supabase project status.`,
    }));
  }
  return { incidents, passing, skipped };
}

/**
 * speaking-closeout (hourly, :20) writes no ledger; its evidence is that no
 * 'active' session outlives its deadline by long. activeSessions: every
 * speaking_sessions row with status 'active' ({ session_token, status,
 * started_at, planned_minutes }). Staleness is speakingCloseout.isStale — the
 * closeout's own rule — moved back by the grace this check allows.
 */
export function checkSpeakingCloseout(activeSessions, now, T = SENTINEL_THRESHOLDS) {
  const cutoff = new Date(now).getTime() - T.closeoutMissedMinutes * 60000;
  const missed = activeSessions.filter((s) => isStale(s, cutoff));
  if (missed.length === 0) return ok(['job-speaking-closeout']);
  return {
    incidents: [incident({
      key: `job-speaking-closeout:stale:${dayOf(now)}`,
      checkId: 'job-speaking-closeout',
      owner: 'product',
      severity: 'medium',
      title: `${missed.length} speaking session(s) still 'active' ${T.closeoutMissedMinutes} min past their deadline`,
      detail: { count: missed.length, oldestStartedAt: missed.map((s) => s.started_at).sort()[0] ?? null },
      hint: 'Netlify function log for speaking-closeout (hourly at :20); the allowance of these learners is still reserved.',
    })],
    passing: [],
  };
}

// ─── e. support SLA ──────────────────────────────────────────────────────────

/** tickets: every ticket in an open status. One incident per breached, unanswered ticket per day. */
export function checkSupportSla(tickets, now) {
  const day = dayOf(now);
  const incidents = tickets
    .filter((t) => !t.first_response_at && slaState(t, new Date(now)) === 'breached')
    .map((t) => {
      const ref = t.reference || ticketReference(t.id);
      return incident({
        key: `support-sla:${t.id}:${day}`,
        checkId: `support-sla:${t.id}`,
        owner: 'support',
        severity: ['urgent', 'high'].includes(t.priority) ? 'high' : 'medium',
        title: `Ticket ${ref} (${t.priority || 'normal'}) is past its SLA with no first response`,
        detail: { ticket_id: t.id, reference: ref, priority: t.priority ?? null, status: t.status ?? null, sla_due_at: t.sla_due_at },
        hint: `/admin/support — answer ${ref}.`,
      });
    });
  // The read covered every open ticket, so any SLA incident not firing now was answered or closed.
  return { incidents, passing: ['support-sla:'] };
}

// ─── f. broken flows ─────────────────────────────────────────────────────────

/**
 * Speaking in the last 24 h. sessions: { session_token, status, mode,
 * user_turns, evaluated, created_at }; evals: speaking_evaluations for those
 * tokens. Zero-turn share uses adminUsageLib.classifyFailure (cancelled = no
 * learner turn since 2026-09-27; completed with 0 turns = no speech), over
 * ENDED sessions; evaluation coverage uses adminFunnelLib.reconcileCoverage
 * against adminStatusLib's evalCoverage threshold. Each is judged only with
 * at least minSpeakingSessions in its denominator.
 */
export function checkSpeakingFlows(sessions, evals, now, T = SENTINEL_THRESHOLDS) {
  const day = dayOf(now);
  const nowMs = new Date(now).getTime();
  const incidents = [];
  const passing = [];
  const skipped = [];

  const ended = sessions.filter((s) => s.status !== 'active' && s.mode !== 'placement');
  if (ended.length >= T.minSpeakingSessions) {
    const zero = ended.filter((s) => ['cancelled', 'no_speech'].includes(classifyFailure(s, nowMs)?.kind)).length;
    const ratio = zero / ended.length;
    if (ratio >= T.zeroTurnRatio) {
      incidents.push(incident({
        key: `flow:speaking-zero-turn:${day}`, checkId: 'flow:speaking-zero-turn', owner: 'product', severity: 'high',
        title: `${zero} of ${ended.length} speaking sessions in 24 h ended with no learner turn (${Math.round(ratio * 100)} %)`,
        detail: { zeroTurn: zero, ended: ended.length, ratio: Math.round(ratio * 1000) / 1000, threshold: T.zeroTurnRatio },
        hint: '/admin/usage?tab=quality; speaking-turn function log; the microphone permission step before a session starts.',
      }));
    } else passing.push('flow:speaking-zero-turn');
  } else {
    skipped.push({ check: 'flow:speaking-zero-turn', reason: `${ended.length} ended session(s) in 24 h — fewer than ${T.minSpeakingSessions}, not judged.` });
  }

  const cov = reconcileCoverage(sessions, evals);
  if (cov.eligible >= T.minSpeakingSessions) {
    const state = judge(cov.coverage, THRESHOLDS.evalCoverage);
    if (state === 'operational') passing.push('flow:eval-coverage');
    else {
      incidents.push(incident({
        key: `flow:eval-coverage:${day}`, checkId: 'flow:eval-coverage', owner: 'product', severity: state === 'critical' ? 'high' : 'medium',
        title: `Only ${cov.evaluatedSessions} of ${cov.eligible} completed speaking sessions in 24 h were evaluated`,
        detail: { evaluated: cov.evaluatedSessions, eligible: cov.eligible, coverage: Math.round(cov.coverage * 1000) / 1000, threshold: THRESHOLDS.evalCoverage },
        hint: 'evaluate-speaking function log (Anthropic errors, timeouts); /admin/usage?tab=quality.',
      }));
    }
  } else {
    skipped.push({ check: 'flow:eval-coverage', reason: `${cov.eligible} completed session(s) in 24 h — fewer than ${T.minSpeakingSessions}, not judged.` });
  }
  return { incidents, passing, skipped };
}

/** One count round trip, judged against the Monitoring screen's dbLatencyMs threshold. */
export function checkDatabase(latencyMs, now) {
  const state = judge(latencyMs, THRESHOLDS.dbLatencyMs);
  if (state === 'operational') return ok(['db:latency']);
  if (state === 'unknown') return ok();
  return {
    incidents: [incident({
      key: `db:latency:${dayOf(now)}`, checkId: 'db:latency', owner: 'product', severity: state === 'critical' ? 'high' : 'medium',
      title: `Supabase answered a count in ${latencyMs} ms`,
      detail: { latencyMs, threshold: THRESHOLDS.dbLatencyMs },
      hint: 'Supabase project status (get_project), advisors and slow queries.',
    })],
    passing: [],
  };
}

// ─── lifecycle planning ──────────────────────────────────────────────────────

/** Is an open incident row cleared by this run? Only a check that ran and passed can clear it. */
export function shouldResolve(row, passing, firingCheckIds) {
  if (!row?.check_id || firingCheckIds.has(row.check_id)) return false;
  return passing.some((p) => (p.endsWith(':') ? row.check_id.startsWith(p) : row.check_id === p));
}

/** SENTINEL_MUTE="signups,page:/faq/" — comma-separated check_id prefixes that are recorded but never mailed. */
export function parseMute(value) {
  return String(value || '').split(',').map((s) => s.trim()).filter(Boolean);
}
export const isMuted = (inc, mute) => mute.some((m) => inc.check_id === m || inc.check_id.startsWith(m));

/** Which newly claimed incidents go into the digest, and why the rest do not. */
export function selectForMail(claimed, mute) {
  const mail = [];
  const mailedElsewhere = [];
  const muted = [];
  for (const inc of claimed) {
    if (inc.mailed_elsewhere) mailedElsewhere.push(inc);
    else if (isMuted(inc, mute)) muted.push(inc);
    else mail.push(inc);
  }
  return { mail, mailedElsewhere, muted };
}

// ─── digest ──────────────────────────────────────────────────────────────────

const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

/** One plain-text email: newly claimed incidents only, grouped by owner_agent, worst first. */
export function renderDigest(incidents, now, { siteUrl = 'https://deutsch-meister.de', muted = 0 } = {}) {
  const sorted = [...incidents].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  const worst = sorted[0]?.severity ?? 'low';
  const bad = sorted.filter((i) => i.severity === 'critical' || i.severity === 'high').length;
  const subject = `Sentinel: ${incidents.length} new incident${incidents.length === 1 ? '' : 's'}${bad ? ` (${bad} critical/high)` : ''} — ${worst}`;
  const lines = [`DeutschMeister sentinel — ${new Date(now).toISOString().slice(0, 16).replace('T', ' ')} UTC (${siteUrl})`, ''];
  for (const owner of OWNER_AGENTS) {
    const mine = sorted.filter((i) => i.owner_agent === owner);
    if (mine.length === 0) continue;
    lines.push(`== ${owner} (${mine.length})`);
    for (const i of mine) {
      lines.push(`[${i.severity}] ${i.title}`);
      lines.push(`    what to check: ${i.hint}`);
    }
    lines.push('');
  }
  if (muted > 0) lines.push(`${muted} further incident(s) recorded but muted by SENTINEL_MUTE.`);
  lines.push('Each problem is mailed once (per day while it persists). Every run is recorded in public.agent_incidents.');
  lines.push('Silence one check: add its check_id prefix to SENTINEL_MUTE. Stop the sentinel: SENTINEL_ENABLED=false. See docs/agents/production-agents.md.');
  return { subject, text: lines.join('\n') };
}
