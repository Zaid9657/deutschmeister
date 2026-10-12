// The levels that have a guided course, in ladder order — split out of ./index.js so the app chrome
// (Navbar, BottomNav → src/lib/courseEntry.js) can ask "is there a course?" without pulling every
// 28-day program into the entry chunk (≈170 KB of source, measured 2026-10-06).
// tests/course-player.test.mjs pins this list against the keys of COURSES.
export const COURSE_LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2'];
