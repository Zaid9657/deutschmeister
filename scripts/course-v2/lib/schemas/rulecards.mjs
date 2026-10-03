// SCHEMA §7 — `content/course-v2/<level>/rule-cards.json` (`course-v2/rulecards@1`).
import { obj, arr } from '../schema.mjs';

export const ruleCardsSchema = obj({
  $schema: "'course-v2/rulecards@1'",
  level: 're(LEVEL)',
  cards: arr({
    id: 're(rulecard)',
    spine: 'ref(spine)',
    depth: 'int[1..3]',
    modelSentence: 'de',
    de: 'de', // ≤ 60 words (A1) / ≤ 80 (A2+) — GRM-05 in the validator
    en: 'en',
    'table?': '[[str]]', // paradigm; kasus colours only where a case is named
    caseMarks: arr({ token: 'str', kasus: 'enum(nominativ|akkusativ|dativ|genitiv)' }, '*'),
  }),
});
