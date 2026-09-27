// SCHEMA §10 — Plateaus (`course-v2/plateau@1`), closing blocks (`course-v2/closing@1`) and
// Modelltest modules (`course-v2/mockmodule@1`).
import './common.mjs';
import { obj, union } from '../schema.mjs';

const Part = union('ExamBlock', 'WritingTask', 'SpeakingTask');

export const plateauSchema = obj({
  $schema: "'course-v2/plateau@1'",
  id: 're(plateau)',
  level: 're(LEVEL)',
  after: 'ref(unit)',
  review: { draw: '20', currentShare: '0.65' }, // compiled from unit reserves
  examTeile: '[ExamBlock]{1..5}', // one per module in the lane; full length in .2
  productive: union('WritingTask', 'SpeakingTask'),
  reward: {
    'lesemagazin?': { title: 'de', text: 'de', items: '[Item]{3..5}' },
    'hoermagazin?': { title: 'de', lines: '[Line]', items: '[Item]{3..5}' },
    'scene?': { lines: '[Line]' },
    'projekt?': { promptDe: 'de', microOutput: 'MicroOutput' },
  },
});

// closing/halbtest-<lane>.json (.1) · closing/diagnose-<lane>.json (.2, free)
export const closingSchema = obj({
  $schema: "'course-v2/closing@1'",
  id: 'str',
  level: 're(LEVEL)',
  lane: 'ref(lane)',
  kind: 'enum(halbtest|diagnose)',
  mode: 'enum(lern|pruefung)',
  parts: [Part],
});

// mocks/<lane>/<form>/<module>.json (.2 only; deferred while .2 courses reuse src/data/mockExams/*)
export const mockModuleSchema = obj({
  $schema: "'course-v2/mockmodule@1'",
  id: 'str',
  level: 're(LEVEL)',
  lane: 'ref(lane)',
  form: 'enum(a|b|c)',
  module: 'enum(hoeren|lesen|sprachbausteine|schreiben|sprechen)',
  minutes: 'int',
  parts: [Part],
  'answerSheet?': 'bool',
});
