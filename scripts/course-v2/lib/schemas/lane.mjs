// SCHEMA §4.3 — lane profile `registries/lanes/<lane>.json` (`course-v2/lane@1`) and TeilTemplate.
import { define, obj, map } from '../schema.mjs';

const MODULE = 'enum(hoeren|lesen|sprachbausteine|schreiben|sprechen)';

define('TeilTemplate', obj({
  id: 're(template)',
  module: 'str',
  family: 'ref(family)',
  task: 'enum(abc|richtig_falsch|ja_nein|zuordnen|cloze|notes|form_fill|insert|writing|speaking)',
  'items?': 'int',
  'options?': 'int',
  'noMatch?': 'enum(X|0|x)',
  'plays?': 'int[1..2]',
  'readingSeconds?': 'int',
  'minutes?': 'num',
  textType: 'ref(texttype)',
  'textWords?': '[int, int]',
  // SCHEMA writes `textWordsSource: enum(…)` without `?`; the §15.1 ga2 excerpt omits it on
  // the writing and speaking templates, which have no textWords. Transcribed as: required
  // exactly when textWords is present (refine below).
  'textWordsSource?': 'enum(official-sample|design)',
  'words?': { 'target?': 'int', 'min?': 'int', 'max?': 'int' },
  'leitpunkte?': 'int',
  'choose?': { from: 'int', pick: 'int' },
  'register?': 'enum(informell|halbformell|formell)',
  'interaction?': 'enum(cards-ask|cards-request|group|monologue|plan-together|discuss|photo|feedback-question|mediate)',
  'prepMinutes?': 'int',
  'rubric?': 'ref(rubric)',
  points: 'num',
  scaffoldAllowedIn: '[re(LEVEL)]*',
  transfersTo: '[ref(template)]*',
  source: 'str',
  stand: 'date',
}, {
  refine(t, emit) {
    if (t.textWords !== undefined && t.textWordsSource === undefined) {
      emit('', 'missing required field "textWordsSource" (required with textWords)');
    }
  },
}));

export const laneSchema = obj({
  $schema: "'course-v2/lane@1'",
  id: 'enum(sd1|ga2|ta2|tb1|dtz|gb1|tb2|gb2|oza1|dtb2)',
  name: 'str',
  level: 'enum(A1|A2|B1|B2)',
  examKey: 'enum(goethe_a1|goethe_a2|telc_a2|telc_b1|dtz|goethe_b1|telc_b2|goethe_b2|osd_za1|dtb_b2)',
  providers: '[str]',
  stand: 'date',
  sources: '[url]',
  access: { gate: 'enum(none|integrationskurs)', 'labelDe?': 'de' },
  modules: map(MODULE, {
    minutes: 'num',
    teile: '[str]',
    'prepMinutes?': 'int',
    'format?': 'enum(group|pair|individual)',
  }),
  writtenBlock: { minutes: 'int', breaks: 'bool' },
  teile: map('str', 'TeilTemplate'),
  blueprint: { modules: map(MODULE, '[str]'), totalMinutes: 'int', answerSheetStep: 'bool' },
  scale: { kind: 'enum(raw|scaled)', 'rawToScore?': 'num', max: 'num', parts: 'object' },
  passRule: 'str', // id of the pure function in src/services/examRules/<lane>.js
  openQuestions: '[str]*',
}, {
  refine(lane, emit) {
    if (!lane.teile || typeof lane.teile !== 'object' || typeof lane.id !== 'string') return;
    for (const [teil, t] of Object.entries(lane.teile)) {
      if (t && typeof t.id === 'string' && t.id !== `${lane.id}.${teil}`) {
        emit(`teile.${teil}.id`, `template id "${t.id}" must be "${lane.id}.${teil}"`);
      }
    }
  },
});
