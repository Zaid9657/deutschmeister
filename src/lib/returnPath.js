import { safeGetJSON, safeSetJSON, safeRemove } from '../utils/safeStorage.js';

// Where a signed-out learner was when the course sent them to sign in or up (course v2's
// SignInPrompt, owner decision 2026-10-01). LoginPage honours `state.from`, but a learner who goes
// on to /signup loses that state, and the confirmation e-mail opens /login in a fresh tab — so the
// step is remembered here for three days and postAuthPath (buyIntent.js) returns to it after a
// pending checkout. Only a course-v2 path is honoured (no open redirect); the course pages clear it
// once they load with a user, next to the progress merge (mergeLocal.js).
const RETURN_KEY = 'dm_return_to';
const RETURN_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const RETURN_PATH = /^\/course\/[a-z][0-9]\.[0-9]\/(v2|u\/[0-9]{1,2}|p\/[0-9]|abschluss)(\?s=[0-9]{1,2})?$/;

export const isCourseReturnPath = (path) => RETURN_PATH.test(String(path || ''));

export const setReturnPath = (path, now = Date.now()) => {
  if (isCourseReturnPath(path)) safeSetJSON(RETURN_KEY, { path, at: now });
};

export const peekReturnPath = (now = Date.now()) => {
  const v = safeGetJSON(RETURN_KEY, null);
  if (!v || !isCourseReturnPath(v.path) || !(Number(v.at) > 0) || now - Number(v.at) > RETURN_TTL_MS) return null;
  return v.path;
};

export const clearReturnPath = () => safeRemove(RETURN_KEY);
