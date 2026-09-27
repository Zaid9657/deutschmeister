// SCHEMA §9 — lane pack `units/uNN.lane-<lane>.json` (`course-v2/lanepack@1`). Secondary lanes are
// deferred (lean execution 2026-09-27); the schema exists so a pack, when one is written, is checked.
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
    'ls4?': { mode: 'enum(replace|add)', blocks: '[ExamBlock]', strategyCards: '[StrategyCard]' },
    'sprechen?': 'SpeakingTask',
    'schreiben?': 'WritingTask',
  },
  originLabels: { 'sprechen?': 'de', 'schreiben?': 'de' },
  // generated
  contentHash: gen('str'),
});
