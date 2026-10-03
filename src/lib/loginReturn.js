// Where /login sends a learner back to once they are signed in.
//
// WHY. Every door to /login hands over the page it came from as `state.from`,
// a router Location (ProtectedRoute, the guards, the level lock, /speaking/).
// LoginPage read only `from.pathname`, so the query and the hash were lost on
// the way back. Where that bites: the A1.1 lesson player sends a signed-out
// learner to /speaking/?level=a1.1&mission=3 (SpeakingStage, RecapStage); one
// who logged in from there came back to a bare /speaking/, without the mission
// (product agent, headless Chromium on e6cd630, 2026-10-03).
//
// `state.from` is set by the app's own navigation, never by a URL, but it is
// still a destination: only a same-origin path is honoured. A value that does
// not start with exactly one "/" (an absolute URL, "//host", "/\host"), or that
// carries a control character (a URL parser drops tabs and newlines, so
// "/\n/host" would become "//host"), returns null and LoginPage falls back to
// postAuthPath() as before.

/** C0 controls and DEL: a URL parser drops some of them and none belongs in a path. */
const hasControl = (s) => Array.from(s).some((c) => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f);

/**
 * The path a login door handed over, with its query and hash.
 * @param {{ pathname?: unknown, search?: unknown, hash?: unknown }|null|undefined} from  location.state.from
 * @returns {string|null} a same-origin path, or null when there is none to return to
 */
export function returnPath(from) {
  const pathname = from?.pathname;
  if (typeof pathname !== 'string' || !/^\/(?![/\\])/.test(pathname)) return null;
  const search = typeof from.search === 'string' && from.search.startsWith('?') ? from.search : '';
  const hash = typeof from.hash === 'string' && from.hash.startsWith('#') ? from.hash : '';
  const path = pathname + search + hash;
  return hasControl(path) ? null : path;
}
