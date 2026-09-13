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

/** The worst REAL check; 'unknown' never outranks a real state. All unknown → 'unknown'. */
export function overallState(checks) {
  const real = checks.filter((c) => c.state !== 'unknown');
  if (real.length === 0) return 'unknown';
  return real.reduce((worst, c) => (RANK[c.state] > RANK[worst] ? c.state : worst), 'operational');
}
