import { SCENE_PHASES, sceneStep } from './buildGuided.js';

/** Ordered, content-free measurement labels; scene items are visible steps too. */
export const stageSteps = (stages) => stages.flatMap((s) => s.kind === 'scene'
  ? s.chunks.flatMap((_, i) => SCENE_PHASES.map((__, phase) => sceneStep(i * SCENE_PHASES.length + phase)))
  : [s.key]);

/** One writer per client. A missing owner-applied column disables only this telemetry until reload. */
export function createStageReachWriter(client) {
  let columnsMissing = false;
  let pending = Promise.resolve();
  const rowsSeen = new Set();
  return function recordStageReach(userId, { level, lektionId, step, steps = [] }) {
    const reachedAt = new Date().toISOString();
    const write = async () => {
      const at = steps.indexOf(step);
      if (!userId || !lektionId || columnsMissing || at < 0 || !steps.every((s) => /^[a-z0-9:-]+$/.test(s))) return false;
      try {
        // A guest can sign in at the saved pause. That resumed run proves Start was pressed,
        // but has no account row yet. Ignore duplicates so completed/better runs stay intact.
        const rowKey = `${userId}:${level}:${lektionId}`;
        if (!rowsSeen.has(rowKey)) {
          const { error } = await client.from('lesson_progress').upsert(
            { user_id: userId, level: String(level).toLowerCase(), lektion_id: lektionId, status: 'started', updated_at: reachedAt },
            { onConflict: 'user_id,lektion_id', ignoreDuplicates: true },
          );
          if (error) return false;
          rowsSeen.add(rowKey);
        }
        // Atomic conditional UPDATE: back, reload, another tab or a repeat can never move the
        // furthest step backwards or change its timestamp. Never alters status/accuracy.
        const earlier = steps.slice(0, at);
        const filter = `furthest_stage.is.null${earlier.length ? `,furthest_stage.in.(${earlier.join(',')})` : ''}`;
        const { error } = await client.from('lesson_progress')
          .update({ furthest_stage: step, furthest_at: reachedAt })
          .eq('user_id', userId).eq('level', String(level).toLowerCase()).eq('lektion_id', lektionId)
          .or(filter);
        if (error && ['42703', 'PGRST204'].includes(error.code) && /furthest_(stage|at)/.test(error.message || '')) columnsMissing = true;
        return !error;
      } catch {
        return false; // No UI error, timer, outbox or retry; the lesson always continues.
      }
    };
    // A fast sequence of steps before the first missing-column response still makes ONE
    // failing request; queued steps see the disabled flag. Network failures are never retried.
    pending = pending.then(write);
    return pending;
  };
}
