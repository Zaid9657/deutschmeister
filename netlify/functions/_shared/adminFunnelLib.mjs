// Admin panel — pure funnel, cohort and coverage arithmetic.
// Every stage is a strict subset of the previous one, computed by explicit
// intersection; the order violations are PUBLISHED, never clamped away.

export function buildFunnelStages({ cohortIds, trackChosenIds, onboardedIds, startedIds, countedIds }) {
  const s1 = new Set(cohortIds);
  const s2 = new Set([...s1].filter((id) => trackChosenIds.has(id)));
  const s3 = new Set([...s2].filter((id) => onboardedIds.has(id)));
  const s4 = new Set([...s3].filter((id) => startedIds.has(id)));
  const s5 = new Set([...s4].filter((id) => countedIds.has(id)));
  const inCohort = (id) => s1.has(id);
  return {
    steps: [
      { step: 'Registriert', count: s1.size, available: true },
      { step: 'Prüfung/Stufe gewählt', count: s2.size, available: true, definition: 'exam_track gesetzt' },
      { step: 'Onboarding abgeschlossen', count: s3.size, available: true, definition: 'onboarding_completed_at gesetzt' },
      { step: 'Erste Nutzung', count: s4.size, available: true, definition: 'irgendeine Aktivität (Grammatik, Hören, Lesen, Sprechen, Lektion)' },
      { step: 'Gezählte Nutzung', count: s5.size, available: true, definition: 'Grammatik-Thema begonnen ODER Sprechsitzung abgeschlossen ODER Lektion abgeschlossen' },
      { step: 'Zahlung erfolgreich', count: null, available: false, reason: 'Zahlungen tragen keine Registrierungs-Kohorte; siehe Umsatz.' },
    ],
    orderViolations: {
      nutzungOhneOnboarding: [...startedIds].filter((id) => inCohort(id) && !s3.has(id)).length,
      gezaehltOhneStart: [...countedIds].filter((id) => inCohort(id) && !startedIds.has(id)).length,
    },
  };
}

/** Monday-anchored ISO week key for a date. */
export function weekKey(date) {
  const d = new Date(date);
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

/**
 * Retention cohorts: for each of the last N Monday-anchored registration
 * weeks, how many registered and how many were active in week 1..K after.
 * `activityByUser` maps user id → sorted array of activity timestamps (ms).
 */
export function retentionCohorts({ users, activityByUser, weeks = 8, horizon = 4, now = Date.now() }) {
  const cohorts = new Map();
  for (const u of users) {
    const wk = weekKey(u.created_at);
    const c = cohorts.get(wk) || { week: wk, registered: 0, active: Array(horizon).fill(0) };
    c.registered += 1;
    const reg = Date.parse(u.created_at);
    const acts = activityByUser.get(u.id) || [];
    for (let k = 1; k <= horizon; k++) {
      const from = reg + (k - 1) * 7 * 86400000;
      const to = reg + k * 7 * 86400000;
      if (to > now) break; // the week has not elapsed — not a failure
      if (acts.some((t) => t >= from && t < to)) c.active[k - 1] += 1;
    }
    cohorts.set(wk, c);
  }
  return [...cohorts.values()].sort((a, b) => (a.week < b.week ? 1 : -1)).slice(0, weeks).map((c) => ({
    ...c,
    elapsedWeeks: Math.max(0, Math.min(horizon, Math.floor((now - Date.parse(c.week)) / (7 * 86400000)) - 1)),
  }));
}

/**
 * Evaluation coverage for speaking: the whole waterfall.
 * sessions: [{ session_token, status, completed_at }], evals: [{ session_token, score, total_score }].
 * Only COMPLETED sessions are eligible; evals deduplicated per session
 * (first row wins); an eval with no usable score is excluded from the
 * average and reported, never zeroed.
 */
export function reconcileCoverage(sessions, evals) {
  const eligibleTokens = new Set(sessions.filter((s) => s.status === 'completed').map((s) => s.session_token));
  const seen = new Set();
  let duplicateRows = 0;
  let unusableRows = 0;
  const ratios = [];
  const evaluated = new Set();
  for (const e of evals) {
    if (!e.session_token) continue;
    if (seen.has(e.session_token)) {
      duplicateRows += 1;
      continue;
    }
    seen.add(e.session_token);
    if (!eligibleTokens.has(e.session_token)) continue; // an eval for a session not in scope
    evaluated.add(e.session_token);
    const raw = e.total_score ?? e.score;
    if (raw === null || raw === undefined || !Number.isFinite(Number(raw))) {
      unusableRows += 1;
      continue;
    }
    ratios.push(Math.max(0, Math.min(1, Number(raw) / 100)));
  }
  const total = sessions.length;
  const eligible = eligibleTokens.size;
  return {
    rows: evals.length,
    dedupedRows: seen.size,
    duplicateRows,
    unusableRows,
    total,
    eligible,
    notEligible: total - eligible,
    evaluatedSessions: evaluated.size,
    missingEvaluation: eligible - evaluated.size,
    coverage: eligible > 0 ? evaluated.size / eligible : null,
    avgScore: ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null,
    scoreSample: ratios.length,
  };
}

/** Nearest-rank percentile: returns a value that actually occurred. Empty → null. */
export function percentile(values, p) {
  const v = values.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const rank = Math.max(1, Math.ceil((p / 100) * v.length));
  return v[rank - 1];
}

export function durationStats(rows, { startKey = 'started_at', endKey = 'completed_at', durationKey = 'duration_seconds' } = {}) {
  const sample = [];
  let running = 0;
  for (const r of rows) {
    if (r[durationKey] != null && Number.isFinite(Number(r[durationKey])) && Number(r[durationKey]) > 0) {
      sample.push(Number(r[durationKey]));
    } else if (r[startKey] && r[endKey]) {
      const d = (Date.parse(r[endKey]) - Date.parse(r[startKey])) / 1000;
      if (Number.isFinite(d) && d >= 0) sample.push(d);
    } else {
      running += 1;
    }
  }
  return {
    sample: sample.length,
    running,
    p25: percentile(sample, 25),
    median: percentile(sample, 50),
    p75: percentile(sample, 75),
    max: sample.length ? Math.max(...sample) : null,
  };
}

/** Seeded daily buckets for a window: a quiet day is a 0 on the axis, not a missing point. */
export function seriesFor(rows, from, to, dateKey = 'created_at') {
  const start = new Date(from);
  const end = new Date(to);
  const days = [];
  for (let d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push({ day: d.toISOString().slice(0, 10), count: 0 });
  }
  const index = new Map(days.map((d) => [d.day, d]));
  for (const r of rows) {
    const slot = index.get(String(r[dateKey] || '').slice(0, 10));
    if (slot) slot.count += 1;
  }
  return days;
}

/** Ten fixed 10-point buckets for a 0–100 distribution. */
export function bucketPercentages(values) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({ from: i * 10, to: i * 10 + 10, count: 0 }));
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    const i = Math.min(9, Math.max(0, Math.floor(v / 10)));
    buckets[i].count += 1;
  }
  return buckets;
}

/** Window helpers: inclusive start, exclusive end, plus the previous window of equal length. ONE clock. */
export function windowFor(range, now = new Date()) {
  const days = { '7d': 7, '30d': 30, '90d': 90 }[range] || 30;
  const to = new Date(now);
  const from = new Date(to.getTime() - days * 86400000);
  const previousTo = new Date(from);
  const previousFrom = new Date(previousTo.getTime() - days * 86400000);
  return { days, from: from.toISOString(), to: to.toISOString(), previousFrom: previousFrom.toISOString(), previousTo: previousTo.toISOString() };
}
