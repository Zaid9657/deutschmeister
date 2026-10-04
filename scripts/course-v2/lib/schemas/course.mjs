// SCHEMA §5 — `content/course-v2/<level>/course.json` (`course-v2/course@1`).
import { obj, arr, map, gen, lit, union } from '../schema.mjs';

const canon = (x) => JSON.stringify(x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x);

// SCHEMA §5: the closing entry of `completion.course.required` by course kind.
export const CLOSING = {
  dot1: { kind: 'halbtest', lane: 'learner', status: 'submitted' },
  dot2: { kind: 'modelltest', form: 'a', lane: 'learner', status: 'submitted' },
};

export const courseSchema = obj({
  $schema: "'course-v2/course@1'",
  level: 're(LEVEL)',
  kind: 'enum(dot1|dot2)',
  priceKey: 'str | null', // 'course_a2_1'; null for a1.1
  title: 'LText',
  'honestyLineDe?': 'de', // required for .1 courses (refine)
  // The course home's plan screen (owner decision 2026-09-29: the learner sees the whole plan
  // first): the promise line, what the learner can do after the level, one name per Etappe.
  'showcase?': { promiseDe: 'de', outcomesDe: '[de]', etappenDe: '[de]{4}' },
  lanes: { primary: 'ref(lane)', secondary: '[ref(lane)]*', later: '[ref(lane)]*', live: '[ref(lane)]' },
  units: '[ref(unit)]{12}',
  etappen: arr({ nr: 'int[1..4]', units: '[ref(unit)]{3}', closedBy: union('ref(plateau)', "'closing'") }, '{4}'),
  plateaus: '[str]{3}',
  closing: {
    'halbtest?': map('re(lane)', 'str'),
    'diagnose?': map('re(lane)', 'str'),
    'modelltests?': map('re(lane)', '[str]'),
    wiederholungsplan: 'bool',
  },
  completion: {
    lernschritt: { finishedWhen: "'all-items-answered'" },
    aufgabe: { submittedWhen: { writingMinShareOfLowerBound: '0.5', formAllFieldsNonEmpty: 'true', speakingMinSeconds: '20', cardModeMinTurns: '2' } },
    unit: { completeWhen: lit(['lernschritte-finished-or-tested-out', 'aufgaben-submitted']), testOutThreshold: '0.8' },
    course: {
      // [unit ×12, plateau ×3, CLOSING] — CLOSING depends on `kind` (refine below)
      required: '[object]{3}',
      neverRequired: lit(['score', 'fokus', 'mehr-ueben', 'extensive', 'diagnose', 'modelltest:b', 'modelltest:c']),
    },
  },
  review: {
    ladderDays: '[int]',
    examCapShare: 'num',
    budgetMinutes: 'int',
    firstReviewCeiling: 'int',
    secondsPerReview: 'int',
    graduateAfterDays: '60',
    examCriticalKinds: lit(['teil', 'sentence']),
    carryOverMinutes: 'num',
  },
  pace: {
    leicht: { unitsPerWeek: '0.5', learningDays: '3' },
    standard: { unitsPerWeek: '1', learningDays: '4' },
    intensiv: { unitsPerWeek: '2', learningDays: '6' },
  },
  targets: { newWords: '[int, int]', productiveShare: 'num', aufgaben: 'int', microOutputs: 'int' },
  einstufung: {
    fromUnits: lit([4, 8, 12]),
    itemsPerUnit: '4',
    itemTypes: "'deterministic'",
    routing: { testOutMin: '0.8', recommendDot2Min: '0.8' },
  },
  // generated (.build/course.facts.json only) below this line
  minutesPlanned: gen('object'),
  reviewMinutesByPace: gen('object'),
  minutesMeasured: gen('object | null'),
  counts: gen('object'),
  contentHash: gen('str'),
}, {
  refine(c, emit) {
    const required = c.completion?.course?.required;
    if (Array.isArray(required) && required.length === 3 && (c.kind === 'dot1' || c.kind === 'dot2')) {
      const want = [
        { kind: 'unit', status: 'complete', count: 12 },
        { kind: 'plateau', status: 'submitted', count: 3 },
        CLOSING[c.kind],
      ];
      required.forEach((r, i) => {
        if (canon(r) !== canon(want[i])) {
          emit(`completion.course.required[${i}]`, `expected ${JSON.stringify(want[i])} (SCHEMA §5, ${c.kind}), got ${JSON.stringify(r)}`);
        }
      });
    }
    if (c.kind === 'dot1' && c.honestyLineDe === undefined) emit('', 'missing required field "honestyLineDe" (required for .1 courses)');
    if (typeof c.level === 'string' && typeof c.kind === 'string') {
      const want = c.level.endsWith('.1') ? 'dot1' : 'dot2';
      if (c.kind !== want) emit('kind', `level ${c.level} is a ${want} course, got "${c.kind}"`);
    }
    if (Array.isArray(c.units) && typeof c.level === 'string') {
      c.units.forEach((u, i) => {
        if (typeof u === 'string' && !u.startsWith(`${c.level}-u`)) emit(`units[${i}]`, `unit "${u}" is not a ${c.level} unit`);
      });
    }
  },
});
