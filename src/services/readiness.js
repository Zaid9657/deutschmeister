// Pure "Du bist bereit" readiness check from a learner's exam-attempt
// history — no React, no Supabase, unit-tested (tests/readiness.test.mjs).
// Both ModelltestResult.jsx (the course-test / exam-track result screen)
// and DashboardPage.jsx (the exam goal card) read from here, so "ready"
// means exactly one thing everywhere it is shown.
//
// "Ready" = the learner's last two COMPLETED attempts (for one exam/course
// key) both cleared `threshold` (default 70%) — a Richtwert trend line,
// never a pass promise. One or zero completed attempts is never "ready".

/**
 * @param {Array<{status:string, score:number, max_score:number, started_at?:string, completed_at?:string}>} attempts
 * @param {number} threshold fraction, e.g. 0.7 for 70%
 * @returns {{ ready: boolean, lastTwo: Array<{score:number, maxScore:number, pct:number}>, trend: 'up'|'down'|'flat'|null }}
 */
export function readinessFromAttempts(attempts, threshold = 0.7) {
  const completed = (attempts || [])
    .filter((a) => a && a.status === 'completed' && a.max_score)
    .slice()
    .sort((a, b) => new Date(b.completed_at || b.started_at) - new Date(a.completed_at || a.started_at));

  // Newest first: lastTwo[0] is the most recent completed attempt.
  const lastTwo = completed.slice(0, 2).map((a) => ({
    score: a.score,
    maxScore: a.max_score,
    pct: Math.round((a.score / a.max_score) * 100),
  }));

  const ready = lastTwo.length === 2 && lastTwo.every((a) => a.maxScore > 0 && a.score / a.maxScore >= threshold);

  let trend = null;
  if (lastTwo.length === 2) {
    const [recent, prior] = lastTwo;
    trend = recent.pct === prior.pct ? 'flat' : recent.pct > prior.pct ? 'up' : 'down';
  }

  return { ready, lastTwo, trend };
}
