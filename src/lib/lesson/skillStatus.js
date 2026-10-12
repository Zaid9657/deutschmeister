// What the recap may say about each skill — exactly what was measured, never more.
//
// One Gold used to stand for the whole Lektion although it is computed from the
// practice items alone: a guest could skip speaking, hand in writing that only a
// mechanical checklist looked at, and still see "Gold". Gold stays a PRACTICE
// achievement (mastery.js), and every other skill gets its own line with one of
// these states:
//
//   practice   'scored'          first-pass right / total (mastery.js)
//   listening  'heard'           every dictation answered after hearing it
//              'partly-read'     some lines were read as text instead (audio failed
//                                or the learner chose the text) — not evidence of
//                                listening
//              'none'            no dictation in this run
//   speaking   'recognised'      speech recognition ran on at least one line: it
//                                reports the share of words it understood — a rough
//                                clarity signal, NOT a pronunciation grade
//              'self-confirmed'  the learner said they read the lines aloud; nothing
//                                was measured
//              'skipped'
//   writing    'assessed'        the AI graded it on the four exam criteria
//              'self-checked'    only the checklist looked at it (signed out, AI
//                                unreachable or the daily limit) — not assessed
//              'skipped'
//
// "Not assessed" is never shown as a fail: an unavailable grader is our gap, not
// the learner's.

/** speakingSummary(lines, results) → the run's speaking report. */
export function speakingSummary(lineCount, results = {}) {
  const done = Object.values(results).filter(Boolean);
  const scored = done.filter((r) => r.usedMic && typeof r.pct === 'number');
  if (!done.length) return { state: 'skipped', lines: lineCount };
  if (scored.length) {
    const pct = scored.reduce((s, r) => s + r.pct, 0) / scored.length;
    return { state: 'recognised', lines: lineCount, scoredLines: scored.length, pct };
  }
  return { state: 'self-confirmed', lines: lineCount };
}

/** writingSummary(r) → the run's writing report, from GradedWriting's result. */
export function writingSummary(r) {
  if (!r) return { state: 'skipped' };
  if (r.scored && typeof r.pct === 'number') return { state: 'assessed', pct: r.pct };
  return { state: 'self-checked', limitReached: !!r.limitReached };
}

/** listeningSummary(attempts) → heard vs. read, over the first-pass dictations. */
export function listeningSummary(attempts = []) {
  const dictations = attempts.filter((a) => a && a.stage === 'dictation' && a.pass !== 'retry');
  if (!dictations.length) return { state: 'none', heard: 0, read: 0 };
  const read = dictations.filter((a) => a.listened === false).length;
  return { state: read ? 'partly-read' : 'heard', heard: dictations.length - read, read };
}

/**
 * The four lines the recap renders, in order. `skills` is what the speaking
 * and writing stages reported this run (absent = never reached = skipped).
 */
export function skillLines({ score, attempts = [], skills = {} }) {
  return [
    { skill: 'practice', state: 'scored', correct: score.correct, total: score.total },
    { skill: 'listening', ...listeningSummary(attempts) },
    { skill: 'speaking', ...(skills.speaking || { state: 'skipped' }) },
    { skill: 'writing', ...(skills.writing || { state: 'skipped' }) },
  ];
}
