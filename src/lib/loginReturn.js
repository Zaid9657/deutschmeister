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
// postAuthPath() as before. A backslash anywhere is refused too: a browser
// reads it as "/", so "/.\\host" would normalise to the pathname "//host", and
// whatever survives is checked once more the way a browser resolves it.

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
  if (pathname.includes('\\')) return null;
  const path = pathname + search + hash;
  if (hasControl(path)) return null;
  // Resolved as a browser would (dot segments folded): never a "//" pathname.
  return new URL(path, 'https://return.invalid').pathname.startsWith('//') ? null : path;
}

// ── ?next= — the doors that cannot hand over router state ──────────────────
//
// The static pages' "Log in" links (the Astro nav, the grammar exercise lock)
// are plain links to the SPA, so they pass the page as `/login?next=<path>`.
// A query is anyone's to write, so it is honoured only for the learning pages
// those doors sit on, checked the way returnPath checks state.from and then
// once more as a browser resolves it ("/grammar/../admin" is not a grammar page).
// The grammar lessons and the course catalogue are Astro pages the SPA has no
// route for: those are left with a full page load (needsFullLoad).
const NEXT_PREFIXES = ['/grammar/', '/courses/', '/course/'];
const STATIC_PREFIXES = ['/grammar/', '/courses/'];

/**
 * The page a `?next=` names, when it is one a login door may return to.
 * @param {unknown} next  the raw `next` query value
 * @returns {string|null}
 */
export function nextPath(next) {
  if (typeof next !== 'string') return null;
  const parts = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(next);
  if (!parts) return null;
  const path = returnPath({ pathname: parts[1], search: parts[2] || '', hash: parts[3] || '' });
  if (!path) return null;
  const resolved = new URL(path, 'https://return.invalid').pathname;
  return NEXT_PREFIXES.some((prefix) => resolved.startsWith(prefix)) ? path : null;
}

/** Whether a return path is served by the Astro build (no SPA route: a full page load). */
export const needsFullLoad = (path) => STATIC_PREFIXES.some((prefix) => String(path || '').startsWith(prefix));

// ── What an auth e-mail link came back with ─────────────────────────────────
//
// GoTrue appends a failed link's error to the redirect URL, in the hash for
// this client's implicit flow (`#error=access_denied&error_code=otp_expired&
// error_description=…`) and in the query for the PKCE flow. supabase-js leaves
// it there (it clears only a successful link's tokens), and nothing read it:
// an expired confirmation link showed the password form, an expired reset link
// showed a reset form that then changed the password of whichever account was
// already signed in.

/**
 * @param {{ search?: unknown, hash?: unknown }|null|undefined} location
 * @returns {{ error: string|null, code: string|null, description: string|null }|null}
 */
export function authLinkError(location) {
  for (const part of [location?.hash, location?.search]) {
    if (typeof part !== 'string' || part.length < 2) continue;
    const params = new URLSearchParams(part.slice(1));
    const error = params.get('error');
    const code = params.get('error_code');
    const description = params.get('error_description');
    if (error || code || description) return { error, code, description };
  }
  return null;
}

/** An expired or already-used link: what a fresh e-mail fixes. */
export const isExpiredLink = (linkError) => Boolean(linkError) && (linkError.code === 'otp_expired' || linkError.error === 'access_denied');
