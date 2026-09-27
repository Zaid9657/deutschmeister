// SCHEMA §11 — calibration anchors (`course-v2/anchor@1`) and model-gate results (`course-v2/qa@1`).
// Both are deferred in lean execution; the schemas exist so any such file is still checked.
import { obj, map } from '../schema.mjs';

// content/course-v2/anchors/<profile>/<id>.json — our own texts only; official samples live in private/
export const anchorSchema = obj({
  $schema: "'course-v2/anchor@1'",
  id: 'str',
  profile: 'ref(rubric)',
  task: 'ref(bank)',
  'text?': 'de',
  'transcript?': 'de',
  errorHeavy: 'bool',
  expected: map('str', 'num'),
  'humanRatingRef?': 'str', // key into the private human-rating store
  verifiedBy: 'enum(examiner|merlin|none)', // CAL-01 counts only anchors with verifiedBy ≠ 'none'
  'merlinRef?': 'str', // key into private/merlin/ (evaluation data, never shipped)
  author: 'str',
});

// content/course-v2/qa/<level>/<fileId>.<gate>.json — written by pipeline runners only
export const qaSchema = obj({
  $schema: "'course-v2/qa@1'",
  file: 'str',
  contentHash: 'str',
  gate: 'enum(SOL-01|SOL-02|SOL-03|CAL-01|CAL-02|LGL-05|LEX-06)',
  modelIds: '[str]',
  ranAt: 'date',
  results: '[object]',
  summary: { pass: 'bool', counts: 'object' },
});
