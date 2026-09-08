// THE course registry — one entry per sub-level that ships as a guided course
// (enrol → lesson 1 → … → final test → completion). Each entry binds a level to
// its 28-day program (the sequence of lessons), its final test and the level
// that follows. The player (src/pages/Course*.jsx) is generic over this table;
// adding a level = adding a program module and one row here.
//
// Why the programs: they already order every lesson, exercise, reading,
// listening, mission and test of the level into 28 days with minutes, and
// progress per item lives in program_progress (see services/programProgress).
// The course player is that sequence with enrolment, locking, a lesson screen
// and completion on top — nothing is re-authored.
import { PROGRAM as A11, PROGRAM_KEY as A11_KEY } from '../programs/a11Phase.js';
import { PROGRAM as A12, PROGRAM_KEY as A12_KEY } from '../programs/a12Phase.js';
import { PROGRAM as A21, PROGRAM_KEY as A21_KEY } from '../programs/a21Phase.js';
import { PROGRAM as A22, PROGRAM_KEY as A22_KEY } from '../programs/a22Phase.js';

export const COURSES = {
  'a1.1': { level: 'a1.1', code: 'A1.1', program: A11, programKey: A11_KEY, testSlug: 'abschlusstest-a1-1', testFormat: 'Start Deutsch 1', next: 'a1.2' },
  'a1.2': { level: 'a1.2', code: 'A1.2', program: A12, programKey: A12_KEY, testSlug: 'abschlusstest-a1-2', testFormat: 'Start Deutsch 1', next: 'a2.1' },
  'a2.1': { level: 'a2.1', code: 'A2.1', program: A21, programKey: A21_KEY, testSlug: 'abschlusstest-a2-1', testFormat: 'Goethe-Zertifikat A2', next: 'a2.2' },
  'a2.2': { level: 'a2.2', code: 'A2.2', program: A22, programKey: A22_KEY, testSlug: 'abschlusstest-a2-2', testFormat: 'Goethe-Zertifikat A2', next: 'b1.1' },
};

/** The course for a level (lowercase or uppercase), or null when the level has no guided course yet. */
export const courseFor = (level) => COURSES[String(level || '').toLowerCase()] || null;

/** Levels that have a guided course, in ladder order. */
export const COURSE_LEVELS = Object.keys(COURSES);
