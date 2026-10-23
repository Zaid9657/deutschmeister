// "Kann ich": what a learner has practised to do in German, from what the course already records
// (Wave 1 item 7, 2026-10-14). The course home used to lead with XP — the minutes of finished
// nodes, i.e. activity. This shows the course's own can-do lines instead:
//
//   open   the Lektion is not finished yet;
//   shown  the Lektion is finished: its tasks asked for exactly these things;
//   again  the checkpoint that closes the Lektion's chapter is passed as well — a later check with
//          new tasks (a retake is a new paper). It checks the CHAPTER, not every line one by one,
//          and the copy says so.
//
// No new storage: both facts are path nodes the course home already loads. How much help a run
// needed is not stored per Lektion yet (lesson_progress has no column for it) — that waits for the
// owner-applied migration batch, with FSRS.
import { courseMetaFor } from './meta.js';

// ponytail: an id is `<lektionId>#<n>`, the line's place in `lektion.canDo`; give the entries
// explicit ids if can-dos are ever reordered, or stored evidence would point at the wrong line.
export const canDoId = (lektionId, i) => `${lektionId}#${i + 1}`;

/** The checkpoint that closes a Lektion's chapter: the first one at or after it. */
export const checkpointFor = (curriculum, nr) =>
  [...(curriculum.checkpoints || [])].sort((a, b) => a.afterLektion - b.afterLektion).find((cp) => cp.afterLektion >= nr) || null;

/** A Lektion's can-do lines in the chrome language. English exists for A1.1 only (its meta module). */
export function canDoLines(lektion, lang = 'en', curriculum = lektion.id?.split('-l')[0]) {
  const en = lang === 'de' ? null : courseMetaFor(curriculum)?.lektionIntro?.[lektion.id]?.canDoEn;
  return (lektion.canDo || []).map((de, i) => en?.[i] || de);
}

/** Every can-do of the level in course order, with its state; `done` is the set of finished path node ids. */
export function canDoList(curriculum, done = new Set()) {
  return curriculum.lektionen.flatMap((l) => {
    const cp = checkpointFor(curriculum, l.nr);
    const state = !done.has(l.id) ? 'open' : cp && done.has(cp.id) ? 'again' : 'shown';
    const en = canDoLines(l, 'en', curriculum);
    return (l.canDo || []).map((de, i) => ({ id: canDoId(l.id, i), lektionId: l.id, nr: l.nr, de, en: en[i], state }));
  });
}
