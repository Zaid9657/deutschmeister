import { AUTH_CONTINUITY_ENABLED } from './authContinuityFlag.js';
import { EXAM_TRACKS } from '../data/examTracks.js';
import { writingTasksForExam } from '../data/writingTasks.js';
import { safeGetJSON, safeSetJSON, safeRemove } from '../utils/safeStorage.js';

// Where a signed-out learner was when the course sent them to sign in or up (course v2's
// SignInPrompt, owner decision 2026-10-01). LoginPage honours `state.from`, but a learner who goes
// on to /signup loses that state, and the confirmation e-mail opens /login in a fresh tab — so the
// step is remembered here for three days and postAuthPath (buyIntent.js) returns to it after a
// pending checkout. Only a course path is honoured (no open redirect); the course pages clear it
// once they load with a user, next to the progress merge (mergeLocal.js).
//
// The A1.1 lesson player's save-progress ask (owner decision 2026-10-06, "move the signup ask
// after the first exercise") writes it too: the course home `/course/<level>` from the recap card,
// the Lektion `/course/<level>/l/<nr>` from the ask after the first answer
// (src/lib/course/saveProgressAsk.js). This file is the one that course v2 (PR #149) adds, with
// those two shapes added to RETURN_PATH; the rest is byte-identical, so the merge is one line.
const RETURN_KEY = 'dm_return_to';
const RETURN_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const RETURN_PATH = /^\/course\/[a-z][0-9]\.[0-9](\/(v2|u\/[0-9]{1,2}|p\/[0-9]|abschluss|l\/[0-9]{1,2}))?(\?s=[0-9]{1,2})?$/;

export const isCourseReturnPath = (path) => RETURN_PATH.test(String(path || ''));

// Exact route/task identities from the content registries, never a prefix or
// arbitrary query. The expanded auth return contract is owner-gated.
export const isExamReturnPath = (path) => {
  if (typeof path !== 'string') return false;
  return EXAM_TRACKS.some((track) => (
    (track.hasMock && path === `/modelltest/${track.slug}`)
    || writingTasksForExam(track.key).some((task) => path === `/schreiben/${track.slug}?task=${encodeURIComponent(task.taskKey)}`)
  ));
};
export const isSafeReturnPath = (path, enabled = AUTH_CONTINUITY_ENABLED) =>
  isCourseReturnPath(path) || (enabled && isExamReturnPath(path));

export const setReturnPath = (path, now = Date.now(), enabled = AUTH_CONTINUITY_ENABLED) => {
  if (isSafeReturnPath(path, enabled)) safeSetJSON(RETURN_KEY, { path, at: now });
};

export const peekReturnPath = (now = Date.now(), enabled = AUTH_CONTINUITY_ENABLED) => {
  const v = safeGetJSON(RETURN_KEY, null);
  if (!v || !isSafeReturnPath(v.path, enabled) || !(Number(v.at) > 0) || now - Number(v.at) > RETURN_TTL_MS) return null;
  return v.path;
};

export const clearReturnPath = () => safeRemove(RETURN_KEY);
