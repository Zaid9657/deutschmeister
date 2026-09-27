// SCHEMA §6 — `content/course-v2/<level>/lexicon.json` (`course-v2/lexicon@1`).
import { obj, arr } from '../schema.mjs';

export const lexiconSchema = obj({
  $schema: "'course-v2/lexicon@1'",
  level: 're(LEVEL)',
  entries: arr({
    id: 're(lexicon)',
    lemma: 'de',
    pos: 'enum(NOUN|VERB|ADJ|ADV|PREP|CONJ|PRON|DET|NUM|PHRASE|INTJ)',
    'article?': 'enum(der|die|das)',
    'plural?': 'str | null',
    'plural_kind?': 'enum(regular|singular-only|plural-only)',
    'feminine?': 'str', // one entry for the pair, as Goethe counts
    'verb_forms?': { '2sg?': 'str', '3sg': 'str', 'praet?': 'str', 'perfekt?': 'str' }, // 2sg where the stem vowel changes
    'separable?': 'bool',
    'reflexive?': 'enum(akk|dat)',
    'rection?': 'str',
    'variety?': 'enum(D|A|CH)',
    role: 'enum(productive|receptive)',
    unit: 'ref(unit)',
    block: 'int[1..4]',
    list_ref: 're(LIST_REF)', // 'A1'|'A2'|'B1'|'derived:<head>'|'compound:<a+b>'|'off-list:<reason>'|'freq:<band>'
    'freq_rank?': 'int',
    gloss: 'EnText',
    example: 'de',
    'exampleEn?': 'en',
    wordId: 'null', // set at integration (one SQL lemma match); null in authoring (LEX-07)
  }),
  promotions: arr({ lemma: 'ref(lexicon)', from: "'receptive'", to: "'productive'", unit: 'ref(unit)' }, '*'),
});
