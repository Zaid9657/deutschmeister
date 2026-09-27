// SCHEMA §1 text types and §3 common types, plus the task/block types that units, lane
// packs, Plateaus, closing blocks and Modelltest modules share (SCHEMA §8).
import { define, obj, map, arr, gen, union, ifHas } from '../schema.mjs';

define('LText', { de: 'de', en: 'en', 'tr?': 'str', 'ar?': 'str' });
define('EnText', { en: 'en', 'tr?': 'str', 'ar?': 'str' });

export const ERROR_TAG =
  'enum(v2-inv|verb-final|satzklammer|case-np|case-pp|gender-article|adj-ending|perfekt-aux-participle|connector-position|n-dekl|reflexive|register|spelling-meaning)';
define('ErrorTag', ERROR_TAG);

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
  'textRef?': 'ref(text)',
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
  'errorTag?': 'ErrorTag',
  // SCHEMA writes `errorTags`, `banks` and `reviewerConfirmed` as `[T]*` without `?`, but most
  // items of the §15 fixture omit them and §15.6 requires SCH-01 to pass there, so all three are
  // transcribed as optional (an absent list = an empty list).
  'errorTags?': '[ErrorTag]*',
  'difficulty?': 'int[1..5]',
  'banks?': '[enum(einstufung|plateau|mehr-ueben|repair)]*',
  origin: 'enum(agent|generator)',
  'reviewerConfirmed?': '[str]*',
});

// §3.2 GeneratorSpec
define('GeneratorSpec', {
  generator: 'enum(dictation.fromInput|numbers.dictation|lex.glossMatch|lex.glossTyped|lex.articlePlural|perception.pairs|perception.intonation)',
  count: 'int[1..3]',
  source: '[ref(line) | ref(lexicon) | str]*',
  'voices?': 'int[1..6]',
});

// §3.3 Line and the file-level Extras
define('Line', {
  id: 're(line)',
  speaker: 'ref(cast) | ref(extra) | enum(ansage|radio|durchsage|pruefer)',
  de: 'de',
  en: 'en',
  'say?': 'str',
  seconds: gen('num'),
});
define('Extras', map('re(extra)', {
  role: 'de',
  gender: 'enum(f|m|d)',
  'age?': 'int',
  voice: 'ref(voice)',
  'rate?': 'str',
  'variety?': 'enum(D|A|CH)',
}));

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

// §3.5 Asset (images and documents)
define('Asset', obj({
  id: 're(asset)',
  kind: 'enum(image|document)',
  altDe: 'de',
  'altEn?': 'en',
  depicts: 'enum(fictional-person|real-person|real-place|object|document|scene)',
  source: 'enum(generated|licensed|own)',
  licence: { name: 'str', 'holder?': 'str', 'url?': 'url', 'attribution?': 'str', 'coversDepiction?': 'bool' },
  'prompt?': 'str',
  status: 'enum(planned|produced|approved)',
  // generated (.build/ only)
  url: gen('url'),
  width: gen('int'),
  height: gen('int'),
  bytes: gen('int'),
}, {
  refine(a, emit) {
    if (a.source === 'generated' && a.prompt === undefined) emit('', 'missing required field "prompt" (required when source is generated)');
  },
}));

const gloss = { token: 'str', gloss: 'EnText' };
define('Glosses', arr(gloss, '{0..3}'));

// §3.6 ExamText — the source texts an exam block refers to (step or file level)
define('ExamText', {
  id: 're(text)',
  kind: 'enum(audio|text|ad|sign|form|image|document)',
  'title?': 'de',
  'lines?': '[Line]',
  'text?': 'de',
  'assetRef?': 'ref(asset)',
  glosses: 'Glosses',
});

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
  textRefs: '[ref(text)]',
  'choices?': arr({ key: 'str', 'de?': 'de', 'textRef?': 'ref(text)', 'imageRef?': 'ref(asset)' }, '*'),
  'noMatchKey?': 'str',
  items: '[Item]',
  'answerSheet?': 'bool',
});

// §8 SpeakingTask = SpeakingPart & SpeakingCommon | { parts: [SpeakingPart]{2..3} } & SpeakingCommon
const SPEAKING_MODE = 'enum(cards-ask|cards-request|group|get-to-know|monologue|plan-together|discuss|photo|feedback-question|mediate)';
define('Card', union('de', obj({ 'de?': 'de', imageRef: 'ref(asset)' })));
const speakingPart = {
  template: 'ref(template)',
  mode: SPEAKING_MODE,
  profile: 'ref(rubric)',
  prepMinutes: 'int',
  'prepAtHome?': 'bool',
  instructionsDe: 'de',
  'situationDe?': 'de',
  'cards?': { learner: '[Card]*', partner: '[Card]*' },
  'photos?': { learner: 'ref(asset)', 'partner?': 'ref(asset)' },
  'slides?': '[de]{5}',
  'stimulus?': { kind: 'enum(text|quotes|calendar)', 'de?': 'de', items: '[de]*' },
  'partnerData?': { kind: 'enum(calendar|notes|card)', 'de?': 'de', items: '[de]*' },
  'topicChoice?': { from: 'int', pick: 'int', topics: '[de]' },
  // SCHEMA writes `keyPoints: [de]*` without `?`; the §15 speaking task omits it (it is required
  // for mode 'mediate' only), so it is optional here and required for 'mediate' by the refine.
  'keyPoints?': '[de]*',
  'seconds?': '[int, int]',
  'turns?': '[int, int]',
  moves: '[enum(vorschlagen|reagieren|widersprechen|einigen|verteilen)]*',
  'planningRound?': { minutes: 'int', moves: '[str]' },
};
const refinePart = (p, emit) => {
  if (p.mode === 'mediate' && (!Array.isArray(p.keyPoints) || p.keyPoints.length === 0)) {
    emit('', 'missing required field "keyPoints" (required for mode mediate)');
  }
};
define('SpeakingPart', obj(speakingPart, { refine: refinePart }));
const speakingCommon = {
  bankKey: 're(BANK_KEY)',
  lane: 'ref(lane)',
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
};
define('SpeakingTask', ifHas(
  'parts',
  obj({ parts: '[SpeakingPart]{2..3}', ...speakingCommon }),
  obj({ ...speakingPart, ...speakingCommon }, { refine: refinePart }),
));

// §8 WritingTask
define('WritingTask', obj({
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
  leitpunkte: arr({ id: 'str', de: 'de', cues: '[str]' }, '*'),
  'choose?': { from: 'int', pick: 'int' },
  'form?': {
    fields: arr({ id: 'str', labelDe: 'de', answer: 'str', accepted: '[str]', 'exact?': 'enum(number|name)' }),
    documents: '[ref(asset)]*',
  },
  'wordBand?': '[int, int]',
  'wordBandLearning?': '[int, int]',
  'minSubmitWords?': 'int',
  checklist: '[de]',
  modelText: 'de',
  'originLabelDe?': 'de',
}, {
  refine(t, emit) {
    // `wordBand … minSubmitWords: required unless form`; a writing (non-form) task has Leitpunkte
    if (t.form === undefined) {
      for (const k of ['wordBand', 'minSubmitWords']) if (t[k] === undefined) emit('', `missing required field "${k}" (required unless form)`);
      if (Array.isArray(t.leitpunkte) && t.leitpunkte.length === 0) emit('leitpunkte', 'a writing task without form has at least one Leitpunkt');
    }
  },
}));

// §8 strategy card (PruefungStep, lane pack ls4 slot)
define('StrategyCard', { template: 'ref(template)', de: 'de', en: 'en' });
