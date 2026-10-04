// SCHEMA §4.7 (voices, style sheet) and §4.8 (global lemma registry). voices.json and style.json
// carry no $schema in SCHEMA and are matched by file name; an optional literal $schema is accepted.
import { obj, map, arr } from '../schema.mjs';

// registries/voices.json (story architect) — defines ref(voice)
export const voicesSchema = obj({
  '$schema?': "'course-v2/voices@1'",
  voices: map('re(voice)', {
    gender: 'enum(f|m|d)',
    locale: 'enum(de-DE|de-AT|de-CH)',
    ageBand: 'enum(young|adult|older)',
  }),
});

// registries/style.json (level-profile agent; read by LNG-02 allowlists, `accepted` generators, pre-checks)
export const styleSchema = obj({
  '$schema?': "'course-v2/style@1'",
  time: { running: 'str', accept: '[str]' },
  quotes: { primary: 'str', secondary: 'str' },
  duInLetters: 'enum(lower|upper)',
  gender: 'enum(pair|neutral-participle)',
  sz: { D: 'str', A: 'str', CH: 'str' },
  phone: 'str',
  price: 'str',
  date: '[str]',
});

// registries/lemmas.json (written only by scripts/course-v2/lex/register.mjs) — defines ref(lexicon)
export const lemmasSchema = obj({
  $schema: "'course-v2/lemmas@1'",
  lemmas: map('re(lexicon)', {
    lemma: 'de',
    pos: 'str',
    'homograph?': 'int',
    allocatedTo: 're(LEVEL)',
    role: 'enum(productive|receptive)',
    promotedAt: arr({ level: 're(LEVEL)', unit: 'ref(unit)' }, '*'),
  }),
});
