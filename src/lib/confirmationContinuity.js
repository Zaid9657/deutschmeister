import { AUTH_CONTINUITY_ENABLED } from './authContinuityFlag.js';
import { isSafeReturnPath } from './returnPath.js';
import { COURSES, PLANS, LEVEL_COURSES } from '../data/pricing.js';
import { EXAM_TRACKS } from '../data/examTracks.js';

// A URL is only navigation intent, never proof of email verification or access.
// No address, token, arbitrary URL, or learner text belongs in this parameter.
export function safeConfirmationDestination(path, enabled = AUTH_CONTINUITY_ENABLED) {
  if (!enabled || typeof path !== 'string') return null;
  if (isSafeReturnPath(path, true)) return path;
  const product = /^\/subscription\?buy=([a-z0-9_]+)$/.exec(path)?.[1];
  return product && (Object.prototype.hasOwnProperty.call(COURSES, product) || Object.prototype.hasOwnProperty.call(PLANS, product) || Object.prototype.hasOwnProperty.call(LEVEL_COURSES, product)) ? path : null;
}

export function confirmationReturnFromSearch(search, enabled = AUTH_CONTINUITY_ENABLED) {
  if (!enabled) return null;
  const values = new URLSearchParams(search).getAll('continue');
  return values.length === 1 ? safeConfirmationDestination(values[0], true) : null;
}

export function authEntryPath(entry, destination, enabled = AUTH_CONTINUITY_ENABLED) {
  // Entry is our own caller's fixed auth page, never an arbitrary destination.
  if (!['/login', '/signup', '/verify-email'].includes(entry)) return '/login';
  const safe = safeConfirmationDestination(destination, enabled);
  return safe ? `${entry}?continue=${encodeURIComponent(safe)}` : entry;
}

export const confirmationEmailRedirect = (origin, destination, enabled = AUTH_CONTINUITY_ENABLED) =>
  `${origin}${authEntryPath('/login', destination, enabled)}`;

export function confirmationDestinationLabel(path) {
  for (const track of EXAM_TRACKS) {
    if (path === `/modelltest/${track.slug}`) return `${track.nameDe} – Kurztest öffnen`;
    if (path?.startsWith(`/schreiben/${track.slug}?task=`) && isSafeReturnPath(path, true)) return `${track.nameDe} – Schreibaufgabe öffnen`;
  }
  if (isSafeReturnPath(path) && path?.startsWith('/course/')) {
    const [, level, lesson] = /^\/course\/([^/?,]+)(?:\/l\/(\d+))?/.exec(path);
    return `Kurs ${level.toUpperCase()}${lesson ? ` – Lektion ${lesson}` : ''} öffnen`;
  }
  if (safeConfirmationDestination(path, true)?.startsWith('/subscription?buy=')) return 'Zur gewählten Kaufoption';
  return null;
}
