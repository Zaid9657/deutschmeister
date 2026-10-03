// SCHEMA §10 — Plateaus (`course-v2/plateau@1`), a secondary lane's Plateau Teile
// (`course-v2/plateaulanepack@1`), closing blocks (`course-v2/closing@1`) and Modelltest modules
// (`course-v2/mockmodule@1`).
import './common.mjs';
import { obj, arr, union } from '../schema.mjs';

const Part = union('ExamBlock', 'WritingTask', 'SpeakingTask');
const Productive = union('WritingTask', 'SpeakingTask');
const idMatches = (re, what) => (doc, emit) => {
  if (typeof doc.id === 'string' && !re.test(doc.id)) emit('id', `${what}, got "${doc.id}"`);
};

// plateaus/pN.json — the primary lane's Plateau
export const plateauSchema = obj({
  $schema: "'course-v2/plateau@1'",
  id: 're(ASSESS)',
  level: 're(LEVEL)',
  after: 'ref(unit)',
  lane: 'ref(lane)',
  review: { draw: '20', currentShare: '0.65', from: "'reserve'" }, // drawn from unit reserves by the compiler
  texts: '[ExamText]*',
  // one entry per module of the lane (Hören, Lesen, Schreiben, Sprechen; + Sprachbausteine for telc)
  examTeile: arr(Part, '{4..5}'),
  productive: Productive,
  reward: {
    'lesemagazin?': { title: 'de', text: 'de', items: '[Item]{3..5}' },
    'hoermagazin?': { title: 'de', lines: '[Line]', items: '[Item]{3..5}' },
    'scene?': { lines: '[Line]' },
    'projekt?': { promptDe: 'de', microOutput: 'MicroOutput' },
  },
  'extras?': 'Extras',
  assets: '[Asset]*',
}, { refine: idMatches(/-p[1-3]$/, 'a Plateau id is LEVEL-pN') });

// plateaus/pN.lane-<lane>.json — a secondary lane's Plateau Teile (built with its pack)
export const plateauLanePackSchema = obj({
  $schema: "'course-v2/plateaulanepack@1'",
  plateau: 're(ASSESS)',
  lane: 'ref(lane)',
  version: 'int',
  status: 'enum(draft|review|approved)',
  reviewedIn: 'str | null',
  texts: '[ExamText]*',
  examTeile: arr(Part, '{4..5}'),
  'productive?': Productive, // absent → the primary task with its origin label (.1 only)
  'extras?': 'Extras',
  assets: '[Asset]*',
}, {
  refine(doc, emit) {
    if (typeof doc.plateau === 'string' && !/-p[1-3]$/.test(doc.plateau)) emit('plateau', `a Plateau id is LEVEL-pN, got "${doc.plateau}"`);
  },
});

// closing/halbtest-<lane>.json (.1) · closing/diagnose-<lane>.json (.2, free)
export const closingSchema = obj({
  $schema: "'course-v2/closing@1'",
  id: 're(ASSESS)',
  level: 're(LEVEL)',
  lane: 'ref(lane)',
  kind: 'enum(halbtest|diagnose)',
  mode: 'enum(lern|pruefung)',
  texts: '[ExamText]*',
  parts: arr(Part),
  'extras?': 'Extras',
  assets: '[Asset]*',
}, {
  refine(doc, emit) {
    const want = doc.kind === 'halbtest' ? '-ht-' : doc.kind === 'diagnose' ? '-dx-' : null;
    if (want && typeof doc.id === 'string' && !doc.id.includes(want)) emit('id', `a ${doc.kind} id is LEVEL${want}<lane>, got "${doc.id}"`);
  },
});

// mocks/<lane>/<form>/<module>.json (.2 only; deferred while .2 courses reuse src/data/mockExams/*)
export const mockModuleSchema = obj({
  $schema: "'course-v2/mockmodule@1'",
  id: 're(MODULE)',
  level: 're(LEVEL)',
  lane: 'ref(lane)',
  form: 'enum(a|b|c)',
  module: 'enum(hoeren|lesen|sprachbausteine|schreiben|sprechen)',
  minutes: 'int',
  texts: '[ExamText]*',
  parts: arr(Part),
  'answerSheet?': 'bool',
  'extras?': 'Extras',
  assets: '[Asset]*',
});
