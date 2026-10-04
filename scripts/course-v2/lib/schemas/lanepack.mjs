// SCHEMA §9 — lane pack `units/uNN.lane-<lane>.json` (`course-v2/lanepack@1`). Secondary lanes are
// deferred (lean execution 2026-09-27); the schema exists so a pack, when one is written, is checked.
// A lane pack is written in one run by its Spur author and has no stages (the full shape applies).
import './common.mjs';
import { obj, gen } from '../schema.mjs';

export const lanePackSchema = obj({
  $schema: "'course-v2/lanepack@1'",
  unit: 'ref(unit)',
  lane: 'ref(lane)',
  version: 'int',
  status: 'enum(draft|review|approved)',
  reviewedIn: 'str | null',
  slots: {
    'ls4?': { mode: 'enum(replace|add)', texts: '[ExamText]*', blocks: '[ExamBlock]', strategyCards: '[StrategyCard]' },
    'input?': { step: 'ref(step)', texts: '[ExamText]*', examBlock: 'ExamBlock' },
    'sprechen?': 'SpeakingTask',
    'schreiben?': 'WritingTask',
  },
  originLabels: { 'sprechen?': 'de', 'schreiben?': 'de' },
  'extras?': 'Extras',
  assets: '[Asset]*',
  // generated
  contentHash: gen('str'),
});
