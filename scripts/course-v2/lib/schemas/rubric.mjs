// SCHEMA §4.5 — rubric profiles `registries/rubrics/{writing,speaking}/<id>.json` (`course-v2/rubric@1`).
import { obj, arr } from '../schema.mjs';

export const rubricSchema = obj({
  $schema: "'course-v2/rubric@1'",
  id: 're(rubric)',
  kind: 'enum(writing|speaking)',
  lane: 'ref(lane) | null',
  max: 'num',
  criteria: arr({ id: 'str', label: 'de', 'per?': 'enum(task|leitpunkt|turn|part)', levels: '[num]', 'weight?': 'num' }),
  zeroRules: '[str]*', // ids of pure functions in netlify/functions/_shared/rubrics/rules.mjs (EXM-08)
  capRules: '[str]*',
  spelling: 'enum(scored|only-if-meaning-suffers|not-scored)',
  feedbackLanguage: '[enum(de-a1|de-a2|de|en)]',
  modelId: 'str', // pinned; any change re-runs CAL-01/02
  splitVerified: 'bool',
  calibration: { status: 'enum(pending|anchors-pass|human-pass)', rangeBands: 'num' },
  source: 'url',
});
