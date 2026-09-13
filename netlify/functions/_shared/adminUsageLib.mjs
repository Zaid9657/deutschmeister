// Admin panel — usage analytics rules, pure.

/**
 * Failure classification for a speaking session. `null` means "records no
 * technical fault" — which is NOT the same as "went well".
 *   cancelled                       → the learner or the client ended it early
 *   active and older than 2 h       → abandoned: never completed, never cancelled
 *   completed, 0 user turns         → no speech reached the server
 *   completed, not evaluated        → the evaluator never ran
 */
export function classifyFailure(s, now = Date.now()) {
  if (s.status === 'cancelled') return { kind: 'cancelled', label: 'Abgebrochen' };
  if (s.status === 'active' && s.created_at && now - Date.parse(s.created_at) > 2 * 3600000) return { kind: 'abandoned', label: 'Verwaist (nie beendet)' };
  if (s.status === 'completed' && (s.user_turns === 0 || s.user_turns === null) && s.mode !== 'placement') return { kind: 'no_speech', label: 'Keine Sprache empfangen' };
  if (s.status === 'completed' && s.evaluated === false) return { kind: 'not_evaluated', label: 'Nicht bewertet' };
  return null;
}

/** Normalise away everything that differs per occurrence so two spellings of one fault are one group. */
export function fingerprint(detail) {
  return String(detail || '')
    .toLowerCase()
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<id>')
    .replace(/\b\d{3,}\b/g, '<n>')
    .replace(/"[^"]*"/g, '<v>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

/** Group rows by fingerprint of `detailKey`, at most 20 samples per group. */
export function groupErrors(rows, detailKey = 'error') {
  const groups = new Map();
  for (const r of rows) {
    const key = fingerprint(r[detailKey]);
    if (!key) continue;
    const g = groups.get(key) || { fingerprint: key, count: 0, firstSeen: r.created_at, lastSeen: r.created_at, samples: [], kinds: new Set() };
    g.count += 1;
    if (r.created_at < g.firstSeen) g.firstSeen = r.created_at;
    if (r.created_at > g.lastSeen) g.lastSeen = r.created_at;
    if (g.samples.length < 20) g.samples.push(r);
    if (r.event_type) g.kinds.add(r.event_type);
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => ({ ...g, kinds: [...g.kinds] })).sort((a, b) => b.count - a.count);
}

/**
 * The share of users whose SECOND qualifying session happened within 7 days
 * of their first. Users whose first session is younger than 7 days are
 * excluded (tooRecent), not counted as failures.
 * sessions: [{ user_id, created_at }] already filtered to qualifying ones.
 */
export function secondSessionWithin7Days(sessions, now = Date.now()) {
  const byUser = new Map();
  for (const s of sessions) (byUser.get(s.user_id) || byUser.set(s.user_id, []).get(s.user_id)).push(Date.parse(s.created_at));
  let eligible = 0;
  let retained = 0;
  let tooRecent = 0;
  for (const times of byUser.values()) {
    times.sort((a, b) => a - b);
    const first = times[0];
    if (now - first < 7 * 86400000) { tooRecent += 1; continue; }
    eligible += 1;
    if (times.length > 1 && times[1] - first <= 7 * 86400000) retained += 1;
  }
  return { eligible, retained, tooRecent, rate: eligible > 0 ? retained / eligible : null };
}

export const MIN_SAMPLE = 3;

/** Per-key rollup (level, topic, mission): starts, completed, completionRate (null when 0 starts), avg score with a minimum sample. */
export function rollup(rows, keyOf, { scoreOf = (r) => r.score, completedOf = (r) => r.completed } = {}) {
  const groups = new Map();
  let unattributed = 0;
  for (const r of rows) {
    const k = keyOf(r);
    if (k === null || k === undefined || k === '') { unattributed += 1; continue; }
    const g = groups.get(k) || { key: k, starts: 0, completed: 0, scores: [] };
    g.starts += 1;
    if (completedOf(r)) g.completed += 1;
    const sc = scoreOf(r);
    if (sc !== null && sc !== undefined && Number.isFinite(Number(sc))) g.scores.push(Number(sc));
    groups.set(k, g);
  }
  const out = [...groups.values()].map((g) => ({
    key: g.key,
    starts: g.starts,
    completed: g.completed,
    completionRate: g.starts > 0 ? g.completed / g.starts : null,
    scoreSample: g.scores.length,
    averageScore: g.scores.length >= MIN_SAMPLE ? g.scores.reduce((a, b) => a + b, 0) / g.scores.length : null,
    belowMinimumSample: g.scores.length < MIN_SAMPLE,
  }));
  return { rows: out.sort((a, b) => b.starts - a.starts), unattributed };
}
