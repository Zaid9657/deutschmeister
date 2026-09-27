// SCHEMA §8 — the unit file `content/course-v2/<level>/units/uNN.json` (`course-v2/unit@1`).
import './common.mjs';
import { define, obj, arr, gen, oneOfBy, union, map } from '../schema.mjs';

define('UnitSpec', {
  situation: 'de',
  handlungsfeld: '[str]',
  canDos: '[ref(cando)]{3..5}',
  grammar: { new: '[ref(spine)]{0..2}', chunk: '[ref(spine)]{0..1}', review: '[ref(spine)]*' },
  lexiconBlocks: arr({ title: 'de', lemmas: '[ref(lexicon)]{6..10}' }, '{3..4}'),
  textTypes: '[ref(texttype)]',
  lanes: {
    primary: 'ref(lane)',
    pruefungsfokus: arr({ template: 'ref(template)', length: 'enum(full|reduced|mini)', modeDefault: 'enum(lern|pruefung)' }, '{2..4}'),
    spur: map('str', '[ref(template)]'),
  },
  lehrwerk: '[str]*',
  deviation: union(obj({ reason: 'str' }), 'null'),
  cast: '[ref(cast)]',
  source: { 'w2Draft?': 'str' },
});

define('Start', {
  lernziele: '[ref(cando)]{3..5}',
  pruefungsfokusChips: '[ref(template)]',
  folge: { title: 'de', lines: '[Line]{2..12}', gistItem: 'Item' },
  'auftakt?': { photoAlt: 'de', promptDe: 'de', microOutput: 'MicroOutput' },
  testOut: { offered: 'bool' },
});

define('Input', {
  kind: 'enum(dialog|monolog|text|mixed)',
  title: 'de',
  textType: 'ref(texttype)',
  'lines?': '[Line]{1..14}',
  'text?': { de: 'de', 'en?': 'en' },
  glosses: 'Glosses',
  transcriptAfterUnaidedListen: 'bool',
});

define('Pool', { items: '[Item]{9..16}', generators: '[GeneratorSpec]*' });

const situationShape = (kind) => ({
  id: 're(STEP)',
  kind: `'${kind}'`,
  title: 'de',
  // TextStep = SituationStep with kind 'text', structure: null and modelSentence optional
  structure: kind === 'text' ? 'null' : 'ref(spine) | null',
  [kind === 'text' ? 'modelSentence?' : 'modelSentence']: 'de',
  ruleCard: 'ref(rulecard)',
  warmup: { draw: '6', 'contrastWith?': 'ref(spine)' },
  input: 'Input',
  inputItems: '[Item]{5}',
  structuredInput: '[Item]{4}',
  pool: 'Pool',
  microOutput: 'MicroOutput',
  'aussprache?': { focus: 'de', perception: '[Item]{4} | GeneratorSpec', readAloud: { lineDe: 'de' } },
  endLine: 'de',
});

define('SituationStep', situationShape('situation'));
define('TextStep', situationShape('text'));
define('SpracheStep', {
  id: 're(STEP)',
  kind: "'sprache'",
  ruleTable: { rows: '[[str]]', blanks: '[[int, int]]' },
  ruleCard: 'ref(rulecard)',
  pool: 'Pool',
  cloze: '[Item]*',
  redemittelFor: '[ref(template)]',
  endLine: 'de',
});
define('PruefungStep', {
  id: 're(STEP)',
  kind: "'pruefung'",
  blocks: '[ExamBlock]{1..2}',
  strategyCards: '[StrategyCard]',
});
define('SprechenStep', { id: 're(STEP)', kind: "'sprechen'", task: 'SpeakingTask' });
define('SchreibenStep', { id: 're(STEP)', kind: "'schreiben'", task: 'WritingTask' });
define('UeberarbeitenStep', { id: 're(STEP)', kind: "'ueberarbeiten'", of: 'ref(bank)', endLine: 'de' });
define('CheckStep', { id: 're(STEP)', kind: "'check'", endLine: 'de' });

define('Step', oneOfBy('kind', {
  situation: 'SituationStep',
  text: 'TextStep',
  sprache: 'SpracheStep',
  pruefung: 'PruefungStep',
  sprechen: 'SprechenStep',
  schreiben: 'SchreibenStep',
  ueberarbeiten: 'UeberarbeitenStep',
  check: 'CheckStep',
}));

define('Check', {
  lines: '[Line]*',
  items: '[Item]{7..9}',
  earlier: arr({ ref: 'ref(item)' }, '{3..5}'),
  proofItems: '[Item]{0..5}',
  proofs: arr({ canDo: 'ref(cando)', 'item?': 'ref(item)', 'aufgabe?': 'enum(sprechen|schreiben)' }, '{3..5}'),
  testOutThreshold: 'num',
  cumulativeShare: 'num',
});

define('Fokus', {
  id: 're(fokus)',
  kind: 'enum(daz|daf|beruf)',
  title: 'de',
  bodyDe: 'de',
  bodyEn: 'en',
  factRefs: '[ref(fact)]*',
  minutes: 'int',
  optional: 'true',
});

define('Redemittel', { id: 're(rm)', de: 'de', en: 'en', function: 'de', 'forTemplate?': 'ref(template)' });

// Sections a lease holder adds after the curriculum agent's `spec` (BLUEPRINT §10.8: spec → S → I → T).
export const STAGED_SECTIONS = ['start', 'steps', 'check', 'redemittel', 'story', 'fokus', 'facts'];

function unitShape({ draft }) {
  const staged = (key) => (draft ? `${key}?` : key);
  return {
    $schema: "'course-v2/unit@1'",
    id: 're(UNIT)',
    level: 're(LEVEL)',
    nr: 'int[1..12]',
    etappe: 'int[1..4]',
    version: 'int',
    status: 'enum(draft|review|approved)',
    reviewedIn: 'str | null',
    title: { de: 'de', canDo: 'de' },
    spec: 'UnitSpec',
    [staged('start')]: 'Start',
    [staged('steps')]: '[Step]{7} | [Step]{8}',
    [staged('check')]: 'Check',
    [staged('redemittel')]: '[Redemittel]{2..8}',
    [staged('story')]: { beat: 'de', cliffhanger: 'de', castIn: '[ref(cast)]' },
    [staged('fokus')]: '[Fokus]{0..2}',
    [staged('facts')]: '[Fact]*',
    // generated
    minutesPlanned: gen('object'),
    reviewCards: gen('[str]'),
    contentHash: gen('str'),
  };
}

function refineUnit(u, emit) {
  if (typeof u.id === 'string' && typeof u.level === 'string' && !u.id.startsWith(`${u.level}-u`)) {
    emit('id', `unit id "${u.id}" does not belong to level "${u.level}"`);
  }
  if (typeof u.id === 'string' && Number.isInteger(u.nr) && !u.id.endsWith(`-u${String(u.nr).padStart(2, '0')}`)) {
    emit('nr', `nr ${u.nr} does not match unit id "${u.id}"`);
  }
}

/** The complete unit (status review/approved, and any draft that already has all sections). */
export const unitSchema = obj(unitShape({ draft: false }), { refine: refineUnit });
/**
 * A `status: 'draft'` unit may lack the staged sections (a spec-only file from the curriculum
 * agent); every section that IS present is checked in full.
 */
export const unitDraftSchema = obj(unitShape({ draft: true }), { refine: refineUnit });
