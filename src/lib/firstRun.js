// The first-run decision (work order #6, docs/SCORECARD.md §3): what ONE thing
// a signed-in learner with no lesson activity is asked to do. Pure, so
// tests/first-run.test.mjs pins it without React; the dashboard's first-run
// card and the onboarding exit both read it.
//
// WHY. Measured 2026-09-27 on the September cohort: 147 signups, 95 confirmed,
// 84 finished onboarding, 15 ever touched a lesson (a user_grammar_progress or
// lesson_progress row). 44 confirmed accounts did nothing at all; 29 more used
// speaking or X-Ray but never a lesson. The onboarding's primary button
// was a 15–20 minute placement test (26 took it, 5 of those then did a lesson);
// its "first lesson" button sent an exam-B1 picker to a B1.1 grammar page; and
// the dashboard behind it offered four primary buttons and a dozen cards. The
// rebuilt A1.1 course — the free front door — was not on the path at all.
//
// THE RULE (one primary action, everything else secondary):
//   * any lesson activity, or activity unknown (a failed read) → null: the
//     ordinary dashboard. Never show "start here" to someone who has started.
//   * a known exam choice → its first writing task, or its Kurzversion when
//     no writing bank exists and hasLevelAccess opens the mock. The ordinary
//     course/placement decision stays available as the alternative.
//   * placed by the level test (profiles.current_level is a sub-level — the
//     column's 'a1' default is NOT a placement) above the free level → the
//     first grammar lesson of the placed level when hasLevelAccess opens it,
//     else the free course home (CurriculumHomePage opens every Lektion for a
//     learner placed above it).
//   * said "I already know some German" in onboarding and not yet placed → the
//     placement test; Lektion 1 is the alternative.
//   * everyone else → Lektion 1 of the free course; the placement test is the
//     alternative. hasLevelAccess decides — A1.1 is free today, and if it ever
//     stops being free the fallback is the (public) placement test, never a
//     lock.
import { FREE_COURSE_LEVEL, FREE_COURSE_HOME } from './courseEntry.js';
import { LEVEL_ORDER } from '../config/levels.js';
import { getTopicsForLevel } from '../data/grammarTopics.js';
import { examTrackByKey } from '../data/examTracks.js';
import { writingTasksForExam } from '../data/writingTasks.js';

/** Lektion 1 of the free course — an SPA route, no trailing slash (CLAUDE.md case 3). */
export const FIRST_LESSON_HREF = `/course/${FREE_COURSE_LEVEL}/l/1`;
/** The placement test is a prerendered SPA route — trailing slash (case 2). */
export const PLACEMENT_HREF = '/level-test/';

/**
 * The onboarding answer "how much German do you know", kept in the auth
 * user's user_metadata under STARTING_POINT_KEY (no column, no migration; a UX
 * preference, never an entitlement). Only SOME is written: NEW is the default,
 * so saying nothing and saying "new" route the same way.
 */
export const STARTING_POINT_KEY = 'starting_point';
export const STARTING_POINTS = Object.freeze({ NEW: 'new', SOME: 'some' });

/**
 * profiles.current_level → the placed sub-level ('b1.1'), or null when the
 * learner was never placed. The DB writes 'B1.1' (UPPERCASE); the column
 * default is 'a1', which is a band, not a placement.
 */
export const placedSublevel = (currentLevel) => {
  const upper = String(currentLevel || '').trim().toUpperCase();
  return LEVEL_ORDER.includes(upper) ? upper.toLowerCase() : null;
};

const lesson = () => ({ kind: 'lesson', level: FREE_COURSE_LEVEL, href: FIRST_LESSON_HREF, fullLoad: false });
const placement = () => ({ kind: 'placement', href: PLACEMENT_HREF, fullLoad: false });

/**
 * @param {object} args
 * @param {boolean|null|undefined} args.hasLessonActivity  any user_grammar_progress / lesson_progress row;
 *                                                         null/undefined = unknown (not first-run)
 * @param {string|null|undefined} args.startingPoint       user_metadata.starting_point ('new' | 'some')
 * @param {string|null|undefined} args.currentLevel        profiles.current_level ('B1.1', 'a1', …)
 * @param {string|null|undefined} args.examTrack           profiles.exam_track
 * @param {(level: string) => boolean} [args.hasLevelAccess] SubscriptionContext.hasLevelAccess
 * @returns {null | { kind: string, href: string, fullLoad: boolean, level?: string, topic?: object,
 *                    alternative: null | { kind: string, href: string, fullLoad: boolean } }}
 */
export function firstRunAction(args = {}) {
  const fallback = courseFirstRunAction(args);
  if (!fallback) return null;
  const { examTrack, hasLevelAccess } = args;
  const track = examTrackByKey(examTrack);
  if (!track) return fallback;

  const task = writingTasksForExam(track.key)[0];
  // The writing editor renders for signed-in learners, but exam feedback
  // needs trial/paid access. Use the band's top sublevel for both task types,
  // matching ExamSubscriptionGuard and avoiding the always-free A1.1 gate.
  const gateLevel = track.sublevels[track.sublevels.length - 1];
  const examOpen = typeof hasLevelAccess === 'function' && hasLevelAccess(gateLevel);
  if (!examOpen || (!task && !track.hasMock)) return fallback;

  const { alternative: _alternative, ...alternative } = fallback;
  return {
    kind: task ? 'writing' : 'mock',
    examName: track.nameDe,
    href: task ? `/schreiben/${track.slug}?task=${encodeURIComponent(task.taskKey)}` : `/modelltest/${track.slug}`,
    fullLoad: false,
    alternative,
  };
}

function courseFirstRunAction({ hasLessonActivity, startingPoint, currentLevel, hasLevelAccess }) {
  if (hasLessonActivity !== false) return null;
  const may = (level) => typeof hasLevelAccess !== 'function' || hasLevelAccess(level);
  const freeOpen = may(FREE_COURSE_LEVEL);
  const placed = placedSublevel(currentLevel);

  if (placed && placed !== FREE_COURSE_LEVEL) {
    const topic = getTopicsForLevel(placed)[0];
    if (topic && may(placed)) {
      // Grammar is Astro-served: a full-load link, trailing-slash class 1.
      return { kind: 'placed', level: placed, topic, href: `/grammar/${placed}/${topic.slug}/`, fullLoad: true, alternative: null };
    }
    if (freeOpen) return { kind: 'course', level: FREE_COURSE_LEVEL, href: FREE_COURSE_HOME, fullLoad: false, alternative: null };
    return { ...placement(), alternative: null };
  }

  if (!placed && startingPoint === STARTING_POINTS.SOME) {
    return { ...placement(), alternative: freeOpen ? lesson() : null };
  }
  if (freeOpen) return { ...lesson(), alternative: placed ? null : placement() };
  return { ...placement(), alternative: null };
}

/**
 * Where the onboarding exits go (useOnboarding.completeOnboarding). The
 * exam choice takes priority on the two learning exits. Other exits retain
 * their existing destinations, including skipping straight to the dashboard.
 */
export const onboardingExitPath = (exitPath, { examTrack, currentLevel, hasLevelAccess } = {}) => {
  if (exitPath === 'first-lesson' || exitPath === 'level-test') {
    const action = firstRunAction({
      hasLessonActivity: false,
      startingPoint: exitPath === 'level-test' ? STARTING_POINTS.SOME : STARTING_POINTS.NEW,
      currentLevel,
      examTrack,
      hasLevelAccess,
    });
    if (action.kind === 'writing' || action.kind === 'mock') return action.href;
  }
  if (exitPath === 'first-lesson') return FIRST_LESSON_HREF;
  if (exitPath === 'level-test') return '/level-test';
  return '/dashboard';
};
