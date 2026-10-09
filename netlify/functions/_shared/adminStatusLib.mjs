// Admin panel — system status, pure: the check contract and the overall state.
// A status is DERIVED from a measurement against a printed threshold, never
// declared; `unknown` is a first-class state that never outranks a real one.

export const THRESHOLDS = Object.freeze({
  // Measured 2026-09-13: a Supabase round trip from Netlify is ~80–300 ms.
  dbLatencyMs: { degraded: 2000, critical: 5000, direction: 'asc' },
  // Measured: webhook_logs.processed=false rows in 7 days = 0 in the last weekly run.
  webhookFailures24h: { degraded: 1, critical: 5, direction: 'asc' },
  // Daily jobs run once a day (07:00, 08:00, 09:30, 18:00 UTC): 30 h = one missed run, 54 h = two.
  dailyJobStaleHours: { degraded: 30, critical: 54, direction: 'asc' },
  // Weekly job (Monday 06:00 UTC): 8 days = one missed run.
  weeklyJobStaleHours: { degraded: 8 * 24, critical: 15 * 24, direction: 'asc' },
  // Measured 2026-09-13 cockpit: speaking evaluation coverage 0.875 over 8 eligible sessions.
  evalCoverage: { degraded: 0.5, critical: 0.2, direction: 'desc' },
  // Open support tickets past their SLA due date.
  slaBreaches: { degraded: 1, critical: 5, direction: 'asc' },
  // Lemon Squeezy dunning: payment_failures rows in 7 days.
  paymentFailures7d: { degraded: 3, critical: 10, direction: 'asc' },
});

export const STATES = Object.freeze(['operational', 'degraded', 'critical', 'unknown']);
export const STATE_LABELS = Object.freeze({ operational: 'Betriebsbereit', degraded: 'Beeinträchtigt', critical: 'Kritisch', unknown: 'Nicht instrumentiert' });
const RANK = { operational: 0, degraded: 1, critical: 2 };

export function judge(value, threshold) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return 'unknown';
  const v = Number(value);
  if (threshold.direction === 'desc') {
    if (v <= threshold.critical) return 'critical';
    if (v <= threshold.degraded) return 'degraded';
    return 'operational';
  }
  if (v >= threshold.critical) return 'critical';
  if (v >= threshold.degraded) return 'degraded';
  return 'operational';
}

/** Every check returns the value, the threshold that judged it, the query behind it, and where to act. */
export function check(id, label, { value, thresholdKey, reason, detail, action, unit }) {
  const threshold = thresholdKey ? THRESHOLDS[thresholdKey] : null;
  const state = threshold ? judge(value, threshold) : value === null || value === undefined ? 'unknown' : 'operational';
  return { id, label, state, value, unit: unit ?? null, threshold: threshold ? { degraded: threshold.degraded, critical: threshold.critical, direction: threshold.direction } : null, reason: reason ?? null, detail: detail ?? null, action: action ?? null };
}

export function notInstrumented(id, label, reason, unblock) {
  return { id, label, state: 'unknown', value: null, unit: null, threshold: null, reason, unblock, detail: null, action: null };
}

/**
 * The scheduled jobs whose runs leave evidence in the database, and where.
 * ONE list, read by admin-status (the Monitoring screen) and by the hourly
 * sentinel, so the two can never disagree about what counts as a run.
 *
 *   ledger  lifecycle_emails.kind — `prefix` (trial_…) or `eq` (confirm_nudge);
 *           absent for the weekly job, whose evidence is weekly_metrics.measured_at
 *   gate    the env var that must be 'true' for the job to do anything at all;
 *           a gated-off job leaves no evidence by design
 *   cron    the job's schedule, the literal in its own schedule('…') call
 *           (tests/sentinel.test.mjs compares them). The sentinel uses it to
 *           find the runs a quiet ledger job had to answer for.
 *
 * daily-sentence and speaking-closeout write no ledger, so they are not here:
 * a missing row would say nothing about them. The sentinel watches
 * speaking-closeout through its effect instead (stale 'active' sessions).
 */
export const SCHEDULED_JOBS = Object.freeze([
  { id: 'job-trial', fn: 'trial-lifecycle', label: 'Trial-Lifecycle (08:00 UTC)', cadence: 'daily', cron: '0 8 * * *', ledger: { prefix: 'trial_' }, gate: null, caveat: 'Nur sichtbar, wenn an dem Tag jemand fällig war — ein ruhiger Tag sieht aus wie ein Ausfall.' },
  { id: 'job-activation', fn: 'activation-lifecycle', label: 'Activation-Lifecycle (09:30 UTC)', cadence: 'daily', cron: '30 9 * * *', ledger: { prefix: 'activation_' }, gate: 'LIFECYCLE_ACTIVATION_ENABLED', caveat: 'Wie oben; zusätzlich no-op ohne LIFECYCLE_ACTIVATION_ENABLED=true.' },
  { id: 'job-confirm', fn: 'confirmation-nudge', label: 'Bestätigungs-Erinnerung (10:30 UTC)', cadence: 'daily', cron: '30 10 * * *', ledger: { eq: 'confirm_nudge' }, gate: 'CONFIRM_NUDGE_ENABLED', caveat: 'Wie oben; no-op ohne CONFIRM_NUDGE_ENABLED=true.' },
  { id: 'job-course', fn: 'course-reminder', label: 'Kurs-Erinnerung (18:00 UTC)', cadence: 'daily', cron: '0 18 * * *', ledger: { prefix: 'course_reminder_' }, gate: 'COURSE_REMINDER_ENABLED', caveat: 'Wie oben; no-op ohne COURSE_REMINDER_ENABLED=true.' },
  { id: 'job-weekly', fn: 'weekly-truth', label: 'Wöchentliche Messung (Montag 06:00 UTC)', cadence: 'weekly', cron: '0 6 * * 1', ledger: null, gate: null, caveat: 'Schreibt IMMER eine Zeile — ein fehlender Lauf ist ein echter Ausfall.' },
]);

/** Does this lifecycle_emails.kind count as a run of `job`? */
export function isJobKind(job, kind) {
  if (!job.ledger || typeof kind !== 'string') return false;
  if (job.ledger.eq) return kind === job.ledger.eq;
  return kind.startsWith(job.ledger.prefix);
}

/** Hours since the job's last evidence, judged against its cadence threshold. No evidence → null/'unknown'. */
export function jobStaleness(job, lastIso, now = new Date()) {
  const t = lastIso ? Date.parse(lastIso) : NaN;
  if (!Number.isFinite(t)) return { hours: null, state: 'unknown', thresholdKey: null };
  const thresholdKey = job.cadence === 'weekly' ? 'weeklyJobStaleHours' : 'dailyJobStaleHours';
  const hours = Math.round((new Date(now).getTime() - t) / 3600000);
  return { hours, state: judge(hours, THRESHOLDS[thresholdKey]), thresholdKey };
}

/** The worst REAL check; 'unknown' never outranks a real state. All unknown → 'unknown'. */
export function overallState(checks) {
  const real = checks.filter((c) => c.state !== 'unknown');
  if (real.length === 0) return 'unknown';
  return real.reduce((worst, c) => (RANK[c.state] > RANK[worst] ? c.state : worst), 'operational');
}
