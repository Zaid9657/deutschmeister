// Pure scoring for mock-exam attempts — no React, no Supabase, unit-tested
// (tests/exams.test.mjs). The answers object is keyed the way the runner
// stores it:
//   matching item:  answers[`${part.key}:${text.id}`] = optionKey
//   mc-group item:  answers[item.id] = optionKey
//   cloze gap:      answers[gap.id] = optionKey
//   listening item: answers[`listening:${part.key}:${question.id}`] = value
//                   (listening keys are scored by the runner against the DB
//                   questions and passed in via listeningResults)

/** Score the statically-keyed sections of a mock against an answers map. */
export function scoreObjectiveSections(mock, answers) {
  const sectionScores = {};
  let score = 0;
  let maxScore = 0;

  for (const section of mock.sections) {
    let sDone = 0;
    let sMax = 0;
    for (const part of section.parts) {
      if (part.type === 'matching') {
        for (const t of part.texts) {
          sMax += 1;
          if (answers[`${part.key}:${t.id}`] === part.answers[t.id]) sDone += 1;
        }
      } else if (part.type === 'mc-group') {
        for (const item of part.items) {
          sMax += 1;
          if (answers[item.id] === item.answer) sDone += 1;
        }
      } else if (part.type === 'cloze') {
        for (const gap of part.gaps) {
          sMax += 1;
          if (answers[gap.id] === gap.answer) sDone += 1;
        }
      }
      // listening + writing are handled outside this pure pass
    }
    if (sMax > 0) {
      sectionScores[section.key] = { score: sDone, max: sMax };
      score += sDone;
      maxScore += sMax;
    }
  }
  return { score, maxScore, sectionScores };
}

/**
 * Score the listening parts of a mock against the answer keys loaded for them.
 * `keysByPart` = { [part.key]: [{ id, correct }] }. Every listening part of the mock must
 * have its keys: a part without them is `complete: false` and named in `missing` — the
 * runner must load them before scoring. (Before 2026-10-07 the keys existed only for parts
 * that had been ON SCREEN, so an attempt resumed after the Hören section scored listening
 * as 0 of 0 and a reading-only result could pass — Codex review.)
 */
export function scoreListeningAnswers(mock, keysByPart = {}, answers = {}) {
  const parts = (mock.sections || []).flatMap((s) => s.parts || []).filter((p) => p.type === 'listening');
  const missing = parts.filter((p) => !Array.isArray(keysByPart[p.key]) || !keysByPart[p.key].length).map((p) => p.key);
  let score = 0;
  let max = 0;
  for (const p of parts) {
    for (const item of keysByPart[p.key] || []) {
      max += 1;
      if (answers[`listening:${p.key}:${item.id}`] === item.correct) score += 1;
    }
  }
  return { complete: missing.length === 0, missing, score, max };
}

/**
 * Merge runtime listening results ({ score, max }) into an objective result.
 * Kept separate so the pure part stays testable without DB fixtures.
 */
export function mergeListeningResult(objective, listening) {
  if (!listening || !listening.max) return objective;
  return {
    score: objective.score + listening.score,
    maxScore: objective.maxScore + listening.max,
    sectionScores: {
      ...objective.sectionScores,
      hoeren: { score: listening.score, max: listening.max },
    },
  };
}

/** Percentage + band verdict. Richtwert only — the UI must label it so. */
export function verdictFor(percent, passPercent) {
  if (percent >= passPercent + 15) return 'solide'; // comfortably above the line
  if (percent >= passPercent) return 'knapp'; // above, but without buffer
  return 'nicht-bereit'; // below the documented threshold
}
