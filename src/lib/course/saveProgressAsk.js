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
// THE RULE. A signed-out learner sees the ask once per Lektion, on the screen
// right after their first checked answer (the first item `check.js` decided,
// i.e. the first `onResult` the player records), and again on the recap (the
// existing card). It never blocks the lesson: "Continue without saving" goes on
// to the screen the learner was heading to, and either answer settles the ask
// for that Lektion on this browser. A signed-in learner never sees it.
//
// WHERE IT LEADS. /signup with an on-site door tag (docs/tracking-links.md,
// "On-site doors"): `ref` names the door, so it lands in
// profiles.acquisition_last_source; `utm_medium=onsite` keeps it out of the
// channel shares; `utm_content` names the level and Lektion. It is a plain
// href, NOT a router <Link>: public/attribution.js records a ref only on a page
// load (the X-Ray and level-test doors do the same). The learner's place
// survives the confirmation e-mail, which opens /login in a new tab, in two
// halves: the PATH through src/lib/returnPath.js (postAuthPath returns to it),
// the RUN through runState's hand-off. Finished Lektionen were already safe:
// src/lib/course/localProgress.js merges them on the first signed-in render.
import { safeGet, safeSet } from '../../utils/safeStorage.js';
import { setReturnPath } from '../returnPath.js';
import { handOffRun } from '../lesson/runState.js';

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
 * `firstAnswerAt` is the position ({ stageIndex, itemIndex }) where the first
 * answer of this run was checked; `at` is the position on screen now. The ask
 * waits while the feedback for that answer is still showing (same position)
 * and appears on the next screen. Never on the recap, which has its own card.
 */
export function saveAskDue({ signedOut, preview = false, settled, firstAnswerAt, at, stageKind }) {
  if (!signedOut || preview || settled || !firstAnswerAt || !at) return false;
  if (stageKind === 'recap') return false;
  return firstAnswerAt.stageIndex !== at.stageIndex || firstAnswerAt.itemIndex !== at.itemIndex;
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
 * Before the ask's signup door navigates: remember where to come back to and,
 * mid-Lektion, hand the run to the tab the confirmation e-mail opens.
 */
export function rememberPlace({ level, lektionId = null, lektionNr = null }) {
  if (lektionId && lektionNr) {
    setReturnPath(lektionPath(level, lektionNr));
    handOffRun(level, lektionId);
  } else {
    setReturnPath(coursePath(level));
  }
}
