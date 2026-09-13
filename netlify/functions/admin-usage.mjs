// Admin panel — usage analytics (speaking sessions, grammar topics).
//
// Three decisions determine every number here:
//   1. The population is speaking_sessions — written server-side the moment
//      a session starts (speaking-session.mjs), so it is the earliest,
//      unconditional record. speaking_evaluations is read for scores, never
//      as a denominator.
//   2. "Completed" is READ (status = completed), never re-derived from a
//      duration.
//   3. Scores are the evaluator's 0–100 total; an average needs ≥ 3 samples.
// Transcripts (speaking_messages) sit behind usage.transcripts and BOTH
// outcomes are audited.
import { adminEndpoint, badRequest, notFound, fetchAll, rate, deployDiagnostics } from './_shared/adminHttp.mjs';
import { writeAudit } from './_shared/adminRbac.mjs';
import { hasCapability, maskRef } from './_shared/adminRbacLib.mjs';
import { applyLevelFilter, normalizeLevel } from './_shared/adminLevels.mjs';
import { windowFor, durationStats, seriesFor, bucketPercentages, reconcileCoverage } from './_shared/adminFunnelLib.mjs';
import { classifyFailure, groupErrors, secondSessionWithin7Days, rollup, MIN_SAMPLE } from './_shared/adminUsageLib.mjs';
import { METRICS } from './_shared/adminMetricNames.mjs';

const inWindow = (iso, w) => { const t = Date.parse(iso); return Number.isFinite(t) && t >= Date.parse(w.from) && t < Date.parse(w.to); };

export const handler = adminEndpoint(
  { capabilityFor: (b) => (b.view === 'transcript' ? 'usage.transcripts' : 'usage.read') },
  async ({ body, supabase, auth, event, requestId }) => {
    const now = new Date();
    const view = String(body.view || 'overview');
    const range = ['7d', '30d', '90d'].includes(body.range) ? body.range : '30d';
    const level = normalizeLevel(body.level);
    const w = windowFor(range, now);

    if (view === 'transcript') {
      const token = String(body.sessionToken || '');
      if (!token) throw badRequest('sessionToken fehlt.');
      const { data: s } = await supabase.from('speaking_sessions').select('id, user_id, session_token, level, mode, status, created_at').eq('session_token', token).maybeSingle();
      if (!s) {
        await writeAudit(supabase, { actorId: auth.userId, actorRole: auth.role, action: 'usage.transcript.denied', targetType: 'speaking_session', targetId: token, outcome: 'denied', errorMessage: 'not found', source: event.path });
        throw notFound('Sitzung nicht gefunden.');
      }
      const messages = await fetchAll(() => supabase.from('speaking_messages').select('role, content, created_at').eq('session_token', token).order('created_at', { ascending: true }));
      await writeAudit(supabase, { actorId: auth.userId, actorRole: auth.role, action: 'usage.transcript.read', targetType: 'speaking_session', targetId: s.id, reason: String(body.reason || '') || null, outcome: 'success', source: event.path, after: { messages: messages.length, user_id: s.user_id } });
      return { session: { ...s, session_token: maskRef(s.session_token), token }, messages, generatedAt: now.toISOString() };
    }

    if (!hasCapability(auth.role, 'usage.read')) throw badRequest('usage.read fehlt.');

    const sessionsAll = await fetchAll(() => applyLevelFilter(supabase.from('speaking_sessions').select('id, user_id, session_token, level, mode, status, duration_seconds, user_turns, evaluated, passed, planned_minutes, cost_cents, mission_id, started_at, completed_at, created_at').order('created_at', { ascending: false }), 'speaking_sessions', level));
    const sessions = sessionsAll.filter((s) => inWindow(s.created_at, w));
    const tokens = sessions.map((s) => s.session_token).filter(Boolean);
    const evals = tokens.length ? await fetchAll(() => supabase.from('speaking_evaluations').select('session_token, score, total_score, pronunciation_score, grammar_score, vocabulary_score, fluency_score, comprehension_score, created_at').in('session_token', tokens)) : [];
    const scoreBy = new Map();
    for (const e of evals) if (!scoreBy.has(e.session_token)) scoreBy.set(e.session_token, e);
    const scoreOf = (s) => { const e = scoreBy.get(s.session_token); const v = e ? (e.total_score ?? e.score) : null; return v == null ? null : Number(v); };

    if (view === 'directory') {
      const page = Math.max(1, Number(body.page) || 1);
      const pageSize = 50;
      const rows = sessions.slice((page - 1) * pageSize, page * pageSize).map((s) => ({
        id: s.id, token: maskRef(s.session_token), sessionToken: s.session_token, userId: s.user_id, level: s.level, mode: s.mode, status: s.status,
        durationSeconds: s.duration_seconds, userTurns: s.user_turns, evaluated: s.evaluated, passed: s.passed, score: scoreOf(s), createdAt: s.created_at, completedAt: s.completed_at,
        failure: classifyFailure(s, now.getTime()),
      }));
      return { rows, page, pageSize, total: sessions.length, totalIsExact: true, range, level: level || 'all', generatedAt: now.toISOString() };
    }

    if (view === 'detail') {
      const s = sessions.find((x) => x.id === body.sessionId) || sessionsAll.find((x) => x.id === body.sessionId);
      if (!s) throw notFound('Sitzung nicht gefunden.');
      const e = scoreBy.get(s.session_token) || null;
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', s.user_id).maybeSingle();
      return { session: { ...s, session_token: undefined, token: maskRef(s.session_token), sessionToken: s.session_token, email: profile?.email ?? null, failure: classifyFailure(s, now.getTime()) }, evaluation: e, transcriptPermitted: hasCapability(auth.role, 'usage.transcripts'), generatedAt: now.toISOString() };
    }

    // overview + quality + failures in one payload (small population)
    const completed = sessions.filter((s) => s.status === 'completed');
    const coverage = reconcileCoverage(sessions, evals);
    const scores = completed.map(scoreOf).filter((v) => v !== null);
    const byLevel = rollup(sessions, (s) => (s.level === 'placement' ? null : s.level), { scoreOf, completedOf: (s) => s.status === 'completed' });
    const byMode = rollup(sessions, (s) => s.mode || null, { scoreOf, completedOf: (s) => s.status === 'completed' });
    const missions = await fetchAll(() => supabase.from('speaking_missions').select('id, level, title_de'));
    const missionTitle = new Map(missions.map((m) => [m.id, `${m.level} · ${m.title_de}`]));
    const byMission = rollup(sessions.filter((s) => s.mode === 'mission'), (s) => (s.mission_id ? missionTitle.get(s.mission_id) || s.mission_id : null), { scoreOf, completedOf: (s) => s.status === 'completed' });
    const failures = sessions.map((s) => ({ s, f: classifyFailure(s, now.getTime()) })).filter((x) => x.f);
    const failureKinds = {};
    for (const { f } of failures) {
      failureKinds[f.kind] = failureKinds[f.kind] || { label: f.label, count: 0 };
      failureKinds[f.kind].count += 1;
    }
    const retention = secondSessionWithin7Days(sessionsAll.filter((s) => s.status === 'completed' && s.mode !== 'placement').map((s) => ({ user_id: s.user_id, created_at: s.created_at })), now.getTime());

    // grammar topics in the window (level-filtered via the topic's sub_level)
    const topics = await fetchAll(() => supabase.from('grammar_topics').select('id, sub_level, slug, title_de'));
    const topicOf = new Map(topics.map((t) => [t.id, t]));
    const grammarAll = await fetchAll(() => supabase.from('user_grammar_progress').select('user_id, topic_id, is_completed, score, stars, attempts, last_accessed, created_at'));
    const grammar = grammarAll.filter((g) => inWindow(g.last_accessed || g.created_at, w) && (!level || String(topicOf.get(g.topic_id)?.sub_level || '').toLowerCase() === level));
    const byTopic = rollup(grammar, (g) => { const t = topicOf.get(g.topic_id); return t ? `${t.sub_level} · ${t.title_de}` : null; }, { scoreOf: (g) => g.score, completedOf: (g) => g.is_completed });
    const webhookErrors = await fetchAll(() => supabase.from('webhook_logs').select('id, event_type, error, created_at').eq('processed', false).gte('created_at', w.from).lt('created_at', w.to));

    return {
      range, level: level || 'all', ...w, timezone: 'UTC', metrics: METRICS,
      levelFilterApplies: ['speaking', 'grammar'], levelFilterExcluded: ['errors.webhooks', 'retention'],
      speaking: {
        started: sessions.length,
        completed: completed.length,
        completedRate: rate(completed.length, sessions.length),
        cancelled: sessions.filter((s) => s.status === 'cancelled').length,
        running: sessions.filter((s) => s.status === 'active').length,
        users: new Set(sessions.map((s) => s.user_id)).size,
        durations: durationStats(completed),
        series: seriesFor(sessions, w.from, w.to),
        coverage,
        scoreBuckets: bucketPercentages(scores),
        scoreSample: scores.length,
        byLevel, byMode, byMission,
        costCents: sessions.reduce((a, s) => a + (Number(s.cost_cents) || 0), 0),
      },
      grammar: { rows: grammar.length, users: new Set(grammar.map((g) => g.user_id)).size, completed: grammar.filter((g) => g.is_completed).length, byTopic, minSample: MIN_SAMPLE },
      failures: { kinds: failureKinds, total: failures.length, samples: failures.slice(0, 20).map(({ s, f }) => ({ id: s.id, token: maskRef(s.session_token), level: s.level, mode: s.mode, status: s.status, createdAt: s.created_at, kind: f.kind, label: f.label })) },
      errors: { webhooks: groupErrors(webhookErrors).map((g) => ({ ...g, samples: g.samples.map((r) => ({ id: r.id, eventType: r.event_type, createdAt: r.created_at, error: r.error })) })) },
      retention,
      minSample: MIN_SAMPLE,
      generatedAt: now.toISOString(),
      diagnostics: { requestId, ...deployDiagnostics(), appliedFilters: { range, level: level || 'all' } },
    };
  },
);
