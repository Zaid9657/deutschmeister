// Mock-exam registry — practice sets in exam style, keyed by examTracks keys.
// One set at launch (telc B1); the other tracks follow as pure data modules
// on the same rails (the runner and scorer are exam-agnostic).
//
// The honesty contract lives in each module's header and in
// src/data/examTracks.js MOCK_DISCLAIMER_DE — every surface that renders a
// mock must render the disclaimer (pinned by tests/exams.test.mjs).

// The .js extension matters: imported by tests under plain Node ESM.
import { telcB1Mock } from './telcB1.js';

export const MOCK_EXAMS = {
  telc_b1: telcB1Mock,
};

export const mockForExamKey = (examKey) => MOCK_EXAMS[examKey] || null;

/** Objective (auto-scored) item count of a mock — the scoring denominator. */
export function countScorableItems(mock) {
  let n = 0;
  for (const section of mock.sections) {
    for (const part of section.parts) {
      if (part.type === 'matching') n += part.texts.length;
      else if (part.type === 'mc-group') n += part.items.length;
      else if (part.type === 'cloze') n += part.gaps.length;
      // listening items are counted at runtime (questions come from the DB);
      // writing is never auto-scored.
    }
  }
  return n;
}
