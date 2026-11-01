// In-memory stages only. The caller supplies analytics.track, whose existing
// consent gate drops events before consent; nothing is persisted or queued.
const STEPS = new Set(['permission', 'session', 'microphone_check', 'playback', 'ready', 'recording', 'request', 'reply']);
const RESULTS = new Set(['started', 'passed', 'failed', 'timeout', 'no_speech', 'retry', 'stopped', 'completed']);
export function createFirstTurnTracker(emit, surface = 'speaking') {
  let step = 'permission';
  let finished = false;
  return {
    mark(next, result = 'started') {
      if (finished || !STEPS.has(next) || !RESULTS.has(result)) return;
      step = next;
      emit('speaking_first_turn', { surface: surface === 'placement' ? 'placement' : 'speaking', step, result });
      if (result === 'completed' || result === 'stopped') finished = true;
    },
    stop() { this.mark(step, 'stopped'); },
  };
}
