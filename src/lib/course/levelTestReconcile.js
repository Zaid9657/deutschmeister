// A passed course final test that never reached the course path (2026-10-07, Codex review).
//
// The result screen writes the final-test node once (ModelltestResult.jsx). If that write fails —
// a dropped connection, a closed tab — the pass is saved in exam_attempts but the path stays one
// step short and the certificate stays locked, with nothing that would ever retry it. The course
// home therefore reconciles: when the final test is the ONLY open node, it looks for a passing,
// completed attempt of THIS course's test and completes the node from it.
//
// The exam modules are imported on demand: the course home needs them only in that one state.
import { levelTestNodeId } from '../../data/curricula/index.js';

const defaultDeps = async () => {
  const [{ resolveModelltest }, { listAttempts }, { verdictFor }, { completeLevelTest }] = await Promise.all([
    import('../../data/modelltest.js'),
    import('../../services/examService.js'),
    import('../../services/examScoring.js'),
    import('../../services/lessonService.js'),
  ]);
  return { resolveModelltest, listAttempts, verdictFor, completeLevelTest };
};

/** The final test is the one open node of the path: every other node is done. */
export const onlyFinalTestOpen = (path, done, curriculum) => {
  const node = levelTestNodeId(curriculum);
  return !done.has(node) && path.every((n) => n.id === node || done.has(n.id));
};

/**
 * Complete the final-test node from a saved passing attempt. Resolves true when the node was written.
 * `deps` is a seam for tests only.
 */
export async function reconcileLevelTest(userId, curriculum, deps = null) {
  if (!userId || !curriculum || !curriculum.testSlug) return false;
  const d = deps || (await defaultDeps());
  const resolved = d.resolveModelltest(curriculum.testSlug);
  if (!resolved || !resolved.mock) return false;
  const attempts = (await d.listAttempts(userId, resolved.key)) || [];
  const passed = attempts.some((a) => a && a.status === 'completed' && a.max_score
    && d.verdictFor(Math.round((a.score / a.max_score) * 100), resolved.mock.passPercent) !== 'nicht-bereit');
  if (!passed) return false;
  return (await d.completeLevelTest(userId, curriculum.level, levelTestNodeId(curriculum))) === true;
}
