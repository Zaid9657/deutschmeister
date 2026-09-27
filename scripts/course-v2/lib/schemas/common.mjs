// SCHEMA §1 text types and §3 common types, plus the task/block types that units, lane
// packs, Plateaus, closing blocks and Modelltest modules share (SCHEMA §8).
import { define, obj, map, arr, gen } from '../schema.mjs';

define('LText', { de: 'de', en: 'en', 'tr?': 'str', 'ar?': 'str' });
define('EnText', { en: 'en', 'tr?': 'str', 'ar?': 'str' });

// §3.1 Item
define('Item', {
  id: 're(item)',
  type: 'enum(fill_blank|multiple_choice|error_correction|sentence_building|match|listen_select|dictation|read_aloud|richtig_falsch|ja_nein|abc|zuordnen|cloze|notes|form_fill|insert)',
  role: 'enum(gist|detail|structured|practice|perception|check|proof|exam)',
  topic: 'ref(spine) | ref(lexicon) | enum(hoeren|lesen|redemittel|aussprache)',
  promptDe: 'de',
  'promptEn?': 'en',
  'options?': '[str]{2..3}',
  'tiles?': '[str]{2..8}',
  'pairs?': '[[str, str]]{3..6}',
  'audioLineRef?': 'ref(line)',
  'textRef?': 'str',
  answer: 'str',
  accepted: '[str]',
  'acceptedWhy?': map('str', 'de'),
  'caseSensitive?': 'bool',
  'exact?': 'enum(number|name)',
  'noMatch?': 'bool',
  'intentionalError?': 'bool',
  'perceptionOnly?': 'bool',
  explanation: 'LText',
  'hint?': 'LText',
  'errorTag?': 'enum(v2-inv|verb-final|satzklammer|case-np|case-pp|gender-article|adj-ending|perfekt-aux-participle|connector-position|n-dekl|reflexive|register|spelling-meaning)',
  origin: 'enum(agent|generator)',
  // SCHEMA writes `reviewerConfirmed: [str]*` without `?`, but no item of the §15 fixture
  // carries it and §15.6 requires SCH-01 to pass there, so it is transcribed as optional.
  'reviewerConfirmed?': '[str]*',
});

// §3.2 GeneratorSpec
define('GeneratorSpec', {
  generator: 'enum(dictation.fromInput|numbers.dictation|lex.glossMatch|lex.glossTyped|lex.articlePlural|perception.pairs|perception.intonation)',
  count: 'int[1..3]',
  source: '[ref(line) | ref(lexicon) | str]*',
  'voices?': 'int[1..6]',
});

// §3.3 Line
define('Line', {
  id: 're(line)',
  speaker: 'ref(cast) | enum(ansage|radio|durchsage|pruefer)',
  de: 'de',
  en: 'en',
  'say?': 'str',
  seconds: gen('num'),
});

// §3.4 Fact
define('Fact', {
  id: 're(fact)',
  claimDe: 'de',
  claimEn: 'en',
  sources: '[url]',
  factsCheckedOn: 'date',
  currentAsOf: 'date',
  exceptions: '[LText]*',
  verification: 'enum(verified|partial|pending)',
  'notes?': 'str',
});

const gloss = { token: 'str', gloss: 'EnText' };
define('Glosses', arr(gloss, '{0..3}'));

// §8 MicroOutput
define('MicroOutput', obj({
  id: 're(mo)',
  bankKey: 're(BANK_KEY)',
  mode: 'enum(spoken|written)',
  profile: 'enum(course-micro|course-micro-sp)',
  'situationDe?': 'de',
  promptDe: 'de',
  promptEn: 'en',
  planSeconds: 'int',
  'seconds?': '[int, int]',
  'words?': '[int, int]',
  targets: '[ref(spine)]',
  register: 'enum(du|Sie)',
}));

// §8 ExamBlock
define('ExamBlock', {
  id: 're(block)',
  template: 'ref(template)',
  lane: 'ref(lane)',
  length: 'enum(full|reduced|mini)',
  scaffolded: 'bool',
  modeDefault: 'enum(lern|pruefung)',
  instructionsDe: 'de',
  texts: arr({
    id: 'str',
    kind: 'enum(audio|text|ad|sign|form)',
    'title?': 'de',
    'lines?': '[Line]',
    'text?': 'de',
    glosses: 'Glosses',
  }),
  items: '[Item]',
  'answerSheet?': 'bool',
});

// §8 SpeakingTask
define('SpeakingTask', {
  bankKey: 're(BANK_KEY)',
  lane: 'ref(lane)',
  template: 'ref(template)',
  mode: 'enum(cards-ask|cards-request|group|monologue|plan-together|discuss|photo|feedback-question|mediate)',
  profile: 'ref(rubric)',
  prepMinutes: 'int',
  instructionsDe: 'de',
  'situationDe?': 'de',
  'cards?': { learner: '[de]*', partner: '[de]*' },
  'slides?': '[de]{5}',
  moves: '[enum(vorschlagen|reagieren|widersprechen|einigen|verteilen)]*',
  'planningRound?': { minutes: 'int', moves: '[str]' },
  aiRole: {
    name: 'str',
    personaDe: 'de',
    register: 'enum(du|Sie)',
    support: 'enum(slow-wordbank|repeat-on-request|clarify|learner-leads|examiner|interrupts)',
  },
  openingLine: 'de',
  hintWords: '[str]{0..8}',
  modelTurns: arr({ speaker: 'enum(learner|partner)', de: 'de' }),
  'originLabelDe?': 'de',
});

// §8 WritingTask
define('WritingTask', {
  bankKey: 're(BANK_KEY)',
  lane: 'ref(lane)',
  template: 'ref(template)',
  examKey: 'str',
  profile: 'ref(rubric)',
  register: 'enum(informell|halbformell|formell)',
  address: 'enum(du|Sie)',
  title: 'de',
  situationDe: 'de',
  taskDe: 'de',
  leitpunkte: arr({ id: 'str', de: 'de', cues: '[str]' }),
  'choose?': { from: 'int', pick: 'int' },
  wordBand: '[int, int]',
  'wordBandLearning?': '[int, int]',
  minSubmitWords: 'int',
  checklist: '[de]',
  modelText: 'de',
  'originLabelDe?': 'de',
});

// §8 strategy card (PruefungStep, lane pack ls4 slot)
define('StrategyCard', { template: 'ref(template)', de: 'de', en: 'en' });
