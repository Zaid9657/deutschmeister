// SCHEMA §4.6 — level profiles `registries/level-profiles.json` (`course-v2/levels@1`).
import { obj, arr } from '../schema.mjs';

const STEP_KIND = 'enum(situation|text|sprache|pruefung|sprechen|schreiben|ueberarbeiten|check)';

export const levelsSchema = obj({
  $schema: "'course-v2/levels@1'",
  levels: arr({
    level: 're(LEVEL)',
    band: 'str',
    skeleton: 'enum(A|B)',
    steps: `[${STEP_KIND}]`,
    // `{ [stepKind]: int, reviewPerDay: int }`
    minutes: {
      'situation?': 'int', 'text?': 'int', 'sprache?': 'int', 'pruefung?': 'int', 'sprechen?': 'int',
      'schreiben?': 'int', 'ueberarbeiten?': 'int', 'check?': 'int', reviewPerDay: 'int',
    },
    sentence: { meanWordsMax: 'num', maxWords: 'int', 'subordinateClausesMax?': 'int' },
    lexis: { newPerUnit: '[int, int]', productiveShare: 'num', offListMax: 'num', coverageMin: 'num' },
    review: { budgetMinutes: 'int', secondsPerReview: 'int', firstReviewCeiling: 'int' },
    pool: { size: '16', served: '12', generatedMax: 'num', mix: 'object' },
    microOutput: { seconds: '[int, int]', words: '[int, int]' },
    ruleCardMaxWords: 'int',
    partnerSupport: 'str',
    feedbackLanguage: '[str]',
  }),
}, {
  refine(doc, emit) {
    if (!Array.isArray(doc.levels)) return;
    doc.levels.forEach((l, i) => {
      if (!l || !Array.isArray(l.steps) || !l.minutes || typeof l.minutes !== 'object') return;
      const want = l.skeleton === 'A' ? 7 : l.skeleton === 'B' ? 8 : null;
      if (want && l.steps.length !== want) emit(`levels[${i}].steps`, `skeleton ${l.skeleton} has ${want} steps, got ${l.steps.length}`);
      for (const kind of new Set(l.steps)) {
        if (typeof kind === 'string' && l.minutes[kind] === undefined) emit(`levels[${i}].minutes`, `missing minutes for step kind "${kind}"`);
      }
    });
  },
});
