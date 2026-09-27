// Course v2 switches (docs/course-v2/BLUEPRINT.md §1.5, docs/course-v2/ENTITLEMENT.md).
// Owner: the E1-1 player-core agent (routes + player); the entitlement track reads it.
//
// COURSE_V2_LIVE — levels whose /course/:level renders the v2 course instead of the
// legacy one. Empty until a level's v2 content is finished and reviewed; the v2
// preview routes (/course/:level/v2, /course/:level/u/:nr, /course/:level/p/:nr)
// work regardless whenever compiled v2 content exists for the level. Read by
// src/components/LevelSubscriptionGuard.jsx (which access question a route asks)
// and, once a level is listed, by the /course/:level route switch.
//
// V2_TRIAL_PRO_OPENS_PAID — whether an active trial or Pro subscription also opens
// the paid v2 levels (owner decision D1, pending; the blueprint recommends false).
// Keep it a plain boolean literal: tests/course-v2-entitlement.test.mjs compares it
// with the server copy in netlify/functions/_shared/courseV2Config.mjs, and the two
// must be flipped together.
//
// V2_DEFAULT_PACE — the pace preset (course.json `pace`) the course home's plan line
// uses until the learner has chosen one in learner_goals.

export const COURSE_V2_LIVE = [];

export const V2_TRIAL_PRO_OPENS_PAID = false;

export const V2_DEFAULT_PACE = 'standard';

/** Is /course/:level itself the v2 course? */
export const isCourseV2Live = (level) => COURSE_V2_LIVE.includes(String(level || '').toLowerCase());
