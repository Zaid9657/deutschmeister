/** 32-bit string hash (FNV-1a with a final mix, so texts that differ in one letter land far apart). */
function hash(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * The options of a choice in an order that says nothing about the answer. Seeded by the question's own
 * id, so a retake, a resume and a re-render show the same order. The guided match and the listening
 * sounds listed their options in the order of the questions: the answer to question 2 was always the
 * second option (browser walk 2026-11-25, 48 of 48 match questions).
 */
export const optionOrder = (options, seed) => [...options].sort((a, b) => hash(`${seed}|${a}`) - hash(`${seed}|${b}`));
