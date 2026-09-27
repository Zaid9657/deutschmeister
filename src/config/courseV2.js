// Course v2 switches (docs/course-v2/BLUEPRINT.md §1.5, docs/course-v2/ENTITLEMENT.md).
//
// COURSE_V2_LIVE — levels whose /course/:level renders the v2 course instead of the
// legacy one. Empty until a level's v2 content is finished and reviewed; the v2
// preview routes (/course/:level/v2, /u/:nr, /p/:nr) work regardless.
//
// V2_TRIAL_PRO_OPENS_PAID — whether an active trial or Pro subscription also opens
// the paid v2 levels (owner decision D1, pending; the blueprint recommends false).
// Keep it a plain boolean literal: tests/course-v2-entitlement.test.mjs compares it
// with the server copy in netlify/functions/_shared/courseV2Config.mjs, and the two
// must be flipped together.
//
// Created by the E1 integration pass so the SPA builds; the routes agent owns it.

export const COURSE_V2_LIVE = [];

export const V2_TRIAL_PRO_OPENS_PAID = false;
