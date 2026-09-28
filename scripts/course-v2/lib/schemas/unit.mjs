// SCHEMA §8 — the unit file `content/course-v2/<level>/units/uNN.json` (`course-v2/unit@1`), with
// the stage schema of §8.1: a unit declares the role that last completed its run (`stage`:
// spec → S → I → T) and is checked against what that role must have written — sections of a later
// role are ABSENT before it, required from it on.
import './common.mjs';
import { define, obj, arr, gen, oneOfBy, union, map, absent, stripAbsent } from '../schema.mjs';

export const STAGES = ['spec', 'S', 'I', 'T'];
const RANK = { spec: 0, S: 1, I: 2, T: 3 };
const WRITER = { S: 'S „Szene & Text"', I: 'I „Items"', T: 'T „Prüfungsaufgaben"' };

define('UnitSpec', obj({
  situation: 'de',
  handlungsfeld: '[str]',
  canDos: '[ref(cando)]{3..5}',
  grammar: { new: '[ref(spine)]{0..2}', chunk: '[ref(spine)]{0..1}', review: '[ref(spine)]*' },
  lexiconBlocks: arr({ title: 'de', lemmas: '[ref(lexicon)]{6..20}' }, '{3..4}'),
  textTypes: '[ref(texttype)]',
  lanes: {
    primary: 'ref(lane)',
    pruefungsfokus: arr(obj({
      template: 'ref(template)',
      length: 'enum(full|reduced|mini)',
      modeDefault: 'enum(lern|pruefung)',
      slot: 'enum(ls4|sprechen|schreiben|input)', // exactly one slot (EXM-11)
      'step?': 'ref(step)', // required when slot = 'input'
    }, {
      refine(p, emit) {
        if (p.slot === 'input' && p.step === undefined) emit('', 'missing required field "step" (required when slot is input)');
        if (p.slot !== undefined && p.slot !== 'input' && p.step !== undefined) emit('step', 'only a slot-input entry names a step');
      },
    }), '{2..4}'),
    spur: map('str', '[ref(template)]'),
  },
  lehrwerk: '[str]*',
  deviation: union(obj({ reason: 'str' }), 'null'),
  cast: '[ref(cast)]',
  fokusPlan: arr({ kind: 'enum(daz|daf|beruf)', title: 'de', hf: 'str' }, '*'),
  source: { 'w2Draft?': 'str' },
}));

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

define('Fokus', {
  id: 're(fokus)',
  kind: 'enum(daz|daf|beruf)',
  title: 'de',
  'hf?': 'str',
  bodyDe: 'de',
  bodyEn: 'en',
  // words the card uses before their unit, as on the Folge (a1.1-u12 r2 F08 / r3 F05)
  'glosses?': 'Glosses',
  factRefs: '[ref(fact)]*',
  minutes: 'int',
  optional: 'true',
});

define('Redemittel', { id: 're(rm)', de: 'de', en: 'en', function: 'de', 'forTemplate?': 'ref(template)' });

// ── the stage gate ──────────────────────────────────────────────────────────────────────
/**
 * A field written by role `from`: at an earlier stage it must be absent; from `from` on it is
 * required (or optional, when `optional`).
 */
function gate(stage, from, schema, { optional = false } = {}) {
  if (RANK[stage] < RANK[from]) return { key: 'absent', node: absent(`at stage ${stage} (written from stage ${from} by ${WRITER[from]}; SCHEMA §8.1)`) };
  return { key: optional ? 'optional' : 'required', node: schema };
}
/** Build an object shape whose fields carry stage gates: { name: [from, schema, opts?] | schema }. */
function staged(stage, spec, options) {
  const shape = {};
  for (const [name, v] of Object.entries(spec)) {
    if (Array.isArray(v) && STAGES.includes(v[0])) {
      const g = gate(stage, v[0], v[1], v[2]);
      shape[g.key === 'optional' ? `${name}?` : name] = g.node;
    } else {
      shape[name] = v;
    }
  }
  return obj(shape, options);
}

function stepSchemas(stage) {
  const atLeast = (s) => RANK[stage] >= RANK[s];
  const situation = (kind) => staged(stage, {
    id: 're(STEP)',
    kind: `'${kind}'`,
    title: 'de',
    // TextStep = SituationStep with kind 'text', structure: null and modelSentence optional
    structure: kind === 'text' ? 'null' : 'ref(spine) | null',
    [kind === 'text' ? 'modelSentence?' : 'modelSentence']: 'de',
    ruleCard: 'ref(rulecard)',
    warmup: { draw: '6', 'contrastWith?': 'ref(spine)' },
    input: 'Input',
    'texts?': '[ExamText]*', // only where this input carries an exam block (slot 'input')
    // inputItems: [Item]{5}, replaced by examBlock on a slot-'input' step (refine below)
    inputItems: ['I', '[Item]{5}', { optional: true }],
    examBlock: ['T', 'ExamBlock', { optional: true }],
    structuredInput: ['I', kind === 'text' ? '[Item]{0..4}' : '[Item]{4}', { optional: kind === 'text' }],
    pool: ['I', 'Pool'],
    reserve: ['I', '[Item]{4..6}'],
    microOutput: ['T', 'MicroOutput'],
    'aussprache?': staged(stage, {
      focus: 'de',
      perception: ['I', '[Item]{4} | GeneratorSpec'],
      readAloud: { lineDe: 'de' },
    }),
    endLine: 'de',
  }, {
    refine(s, emit) {
      if (!atLeast('I')) return;
      const slotted = Array.isArray(s.texts) && s.texts.length > 0;
      if (!slotted && s.inputItems === undefined) emit('', 'missing required field "inputItems" (a step without an exam block has 5 input items)');
      if (atLeast('T') && slotted && s.examBlock === undefined) emit('', 'missing required field "examBlock" (a step with exam texts carries its slot-input block from stage T)');
    },
  });
  return {
    situation: situation('situation'),
    text: situation('text'),
    sprache: staged(stage, {
      id: 're(STEP)',
      kind: "'sprache'",
      ruleTable: { rows: '[[str]]', blanks: '[[int, int]]' },
      ruleCard: 'ref(rulecard)',
      pool: ['I', 'Pool'],
      reserve: ['I', '[Item]{4..6}'],
      cloze: ['I', '[Item]*'],
      redemittelFor: '[ref(template)]',
      endLine: 'de',
    }),
    pruefung: staged(stage, {
      id: 're(STEP)',
      kind: "'pruefung'",
      texts: '[ExamText]*',
      blocks: ['T', '[ExamBlock]{1..2}'],
      strategyCards: ['T', '[StrategyCard]'],
    }),
    sprechen: staged(stage, { id: 're(STEP)', kind: "'sprechen'", task: ['T', 'SpeakingTask'] }),
    schreiben: staged(stage, { id: 're(STEP)', kind: "'schreiben'", task: ['T', 'WritingTask'] }),
    ueberarbeiten: staged(stage, { id: 're(STEP)', kind: "'ueberarbeiten'", of: ['T', 'ref(bank)'], endLine: 'de' }),
    check: obj({ id: 're(STEP)', kind: "'check'", endLine: 'de' }),
  };
}

const checkSchema = obj({
  lines: '[Line]*',
  items: '[Item]{7..9}',
  earlierDraw: { count: 'int[3..5]', from: 'enum(previous-3|etappe|all-previous)', pool: "'reserve'" },
  proofItems: '[Item]{0..5}',
  // microOutput: the learner's own micro-output proves the can-do (a1.1-u02 r1 F03 / r2 F05 / r3 F05); a
  // format check here (re(mo)), ALL-02 resolves it against the unit's micro-outputs
  proofs: arr({ canDo: 'ref(cando)', 'item?': 'ref(item)', 'aufgabe?': 'enum(sprechen|schreiben)', 'microOutput?': 're(mo)' }, '{3..5}'),
  'rueckschau?': '[ref(rulecard)]{1..3}', // B skeleton only (required there; the validator knows the skeleton)
  'portrait?': { factRef: 'ref(fact)', de: 'de', en: 'en', 'assetRef?': 'ref(asset)' },
  testOutThreshold: 'num',
  cumulativeShare: 'num',
});

function unitShape(stage) {
  const steps = stepSchemas(stage);
  const Step = oneOfBy('kind', steps, { label: 'Step' });
  return staged(stage, {
    $schema: "'course-v2/unit@1'",
    id: 're(UNIT)',
    level: 're(LEVEL)',
    nr: 'int[1..12]',
    etappe: 'int[1..4]',
    version: 'int',
    status: 'enum(draft|review|approved)',
    reviewedIn: 'str | null',
    stage: 'enum(spec|S|I|T)', // selects this schema (schemaFor); an invalid or missing stage is checked at T
    title: { de: 'de', canDo: 'de' },
    spec: 'UnitSpec',
    start: ['S', staged(stage, {
      lernziele: '[ref(cando)]{3..5}',
      pruefungsfokusChips: '[ref(template)]',
      'recapDe?': 'de',
      // glosses (optional, S): a word the Folge introduces before its unit glosses it (a1.1-u04 r5 F03)
      folge: staged(stage, { title: 'de', lines: '[Line]{2..12}', 'glosses?': 'Glosses', gistItem: ['I', 'Item'] }),
      'auftakt?': staged(stage, { 'assetRef?': 'ref(asset)', promptDe: 'de', microOutput: ['T', 'MicroOutput'] }),
      testOut: { offered: 'bool' },
    })],
    steps: ['S', union(arr(Step, '{7}'), arr(Step, '{8}'))],
    check: ['I', checkSchema],
    redemittel: ['S', '[Redemittel]{2..8}'],
    // cliffhangerEn / glosses: the cliffhanger's English twin and the words it uses before their unit
    // (a1.1-u01 r1 F08 / r2 F09); castIn: SCHEMA §8 (who enters the story here)
    story: ['S', { beat: 'de', cliffhanger: 'de', 'cliffhangerEn?': 'en', 'glosses?': 'Glosses', castIn: '[ref(cast)]' }],
    fokus: ['S', '[Fokus]{0..2}'],
    facts: ['S', '[Fact]*'],
    extras: ['S', 'Extras', { optional: true }],
    assets: ['S', '[Asset]*'],
    // generated (.build/ only)
    minutesPlanned: gen('object'),
    reviewCards: gen('[str]'),
    contentHash: gen('str'),
  }, { refine: refineUnit });
}

function refineUnit(u, emit) {
  if (typeof u.id === 'string' && typeof u.level === 'string' && !u.id.startsWith(`${u.level}-u`)) {
    emit('id', `unit id "${u.id}" does not belong to level "${u.level}"`);
  }
  if (typeof u.id === 'string' && Number.isInteger(u.nr) && !u.id.endsWith(`-u${String(u.nr).padStart(2, '0')}`)) {
    emit('nr', `nr ${u.nr} does not match unit id "${u.id}"`);
  }
}

/** The unit schema at each stage; a file with no valid `stage` is checked at T (the full shape). */
export const UNIT_SCHEMAS = Object.fromEntries(STAGES.map((s) => [s, unitShape(s)]));
export const unitSchema = UNIT_SCHEMAS.T;

/**
 * A copy of a unit reduced to what `stage` may contain (§8.1): every section a later role writes
 * is removed, and `stage` is set. Used by tests (§15.6: SCH-01 passes on the fixture stripped to its
 * S fields) and by anyone re-running a role from an earlier state.
 */
export function stripToStage(unit, stage) {
  if (!UNIT_SCHEMAS[stage]) throw new Error(`unknown stage ${stage} (${STAGES.join('|')})`);
  return { ...stripAbsent(UNIT_SCHEMAS[stage], unit), stage };
}
