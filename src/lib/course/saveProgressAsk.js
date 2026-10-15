// The save-progress ask: WHEN a signed-out learner is asked to create an
// account, and where that account round trip leads.
//
// Owner decision 2026-10-06 ("yes, move the signup ask after the first
// exercise"). Since the 10-04 redesign a signed-out visitor starts A1.1 at
// /course/a1.1 without an account, and the only ask was the card on the recap,
// i.e. after a WHOLE Lektion of twelve stages. No account had ever finished an
// A1.1 Lektion (0 of 10 Lektion-1 starts on 2026-10-06), and signups had been
// 0 for 30 hours. The first checked answer is practice item 1, after the
// intro, pretest, dialogue, Wortfeld, notice and Aussprache screens.
//
// THE RULE (since 2026-10-09, see saveAskDue). A signed-out learner sees the ask
// once per Lektion, in place of the pause screen after the first finished part,
// and again on the recap (the existing card). It never blocks the lesson:
// "Continue without saving" goes on to the next part, and either answer settles
// the ask for that Lektion on this browser. A signed-in learner never sees it.
//
// WHERE IT LEADS. /signup with an on-site door tag (docs/tracking-links.md,
// "On-site doors"): `ref` names the door, so it lands in
// profiles.acquisition_last_source; `utm_medium=onsite` keeps it out of the
// channel shares; `utm_content` names the level and Lektion. It is a plain
// href, NOT a router <Link>: public/attribution.js records a ref only on a page
// load (the X-Ray and level-test doors do the same). The learner's place
// survives the confirmation e-mail, which opens /login in a new tab, in two
// halves: the PATH through src/lib/returnPath.js (postAuthPath returns to it),
// the RUN through runState itself: the snapshot is in localStorage, so the new tab reads it,
// and a signed-in read falls back to the guest run (runState.readRun). Finished Lektionen were already safe:
// src/lib/course/localProgress.js merges them on the first signed-in render.
import { safeGet, safeSet } from '../../utils/safeStorage.js';
import { setReturnPath } from '../returnPath.js';

/** The two doors, as they appear in acquisition_last_source. */
export const SAVE_PROGRESS_DOORS = Object.freeze({
  first: 'save-progress-first',
  recap: 'save-progress-recap',
});

export const SAVE_ASK_KEY_PREFIX = 'dm_save_ask:';

export const saveAskKey = (level, lektionId) => `${SAVE_ASK_KEY_PREFIX}${String(level || '').toLowerCase()}:${lektionId}`;

/** True once the learner answered the ask in this Lektion (either button), on this browser. */
export const isAskSettled = (level, lektionId) => safeGet(saveAskKey(level, lektionId)) !== null;

export const settleAsk = (level, lektionId, now = Date.now()) => safeSet(saveAskKey(level, lektionId), String(now));

/**
 * Whether the player shows the ask in place of the current screen.
 *
 * Owner decision 2026-10-09 (after the Codex learner-value review), replacing „after the first
 * checked answer" of 2026-10-06, which interrupted after a single answer, right or wrong: the ask
 * comes once something is worth saving — at the end of the first finished PART of the Lektion
 * (`partDone`, src/lib/lesson/sessions.js; in L1 that part ends with the learner's own
 * introduction). Never on the recap, which has its own card.
 */
export function saveAskDue({ signedOut, preview = false, settled, partDone, stageKind }) {
  if (!signedOut || preview || settled) return false;
  if (stageKind === 'recap') return false;
  return Number(partDone) >= 1;
}

/** The Lektion URL the lesson player resumes on (CLAUDE.md case 3: no trailing slash). */
export const lektionPath = (level, nr) => `/course/${String(level || '').toLowerCase()}/l/${nr}`;

/** The course home a finished Lektion returns to. */
export const coursePath = (level) => `/course/${String(level || '').toLowerCase()}`;

/** The signup door of the ask: `door` is 'first' or 'recap'. */
export function saveProgressSignupHref({ door, level, lektionNr = null }) {
  const params = new URLSearchParams({ ref: SAVE_PROGRESS_DOORS[door] || SAVE_PROGRESS_DOORS.first, utm_medium: 'onsite' });
  const lv = String(level || '').toLowerCase();
  if (lv) params.set('utm_content', lektionNr ? `${lv}-l${lektionNr}` : lv);
  return `/signup?${params}`;
}

/**
 * Before the ask's signup door navigates: remember where to come back to — the
 * Lektion mid-run, else the course home. The run itself needs no hand-off: it is
 * in localStorage, which the tab the confirmation e-mail opens shares.
 * `now` is a seam for tests, like the rest of the chain (setReturnPath).
 */
export function rememberPlace({ level, lektionId = null, lektionNr = null }, now = Date.now()) {
  if (lektionId && lektionNr) {
    setReturnPath(lektionPath(level, lektionNr), now);
  } else {
    setReturnPath(coursePath(level), now);
  }
}
