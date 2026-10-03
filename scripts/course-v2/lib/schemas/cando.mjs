// SCHEMA §4.1 — can-do registry `registries/cando/<band>.json` (`course-v2/cando@1`).
import { obj, arr } from '../schema.mjs';

export const candoSchema = obj({
  $schema: "'course-v2/cando@1'",
  band: 'enum(a1|a2|b1|b2)',
  items: arr({
    id: 're(cando)',
    de: 'de', // our own ich-Form wording, never verbatim CEFR/Goethe text
    // the line the learner reads on Start („Lernziele") and Check („Das kann ich"): no „Ich kann" frame,
    // only words and constructions known at the first unit that shows it (a1.1-u06 r2/r3 F01, u11 r3 F02)
    'learnerDe?': 'de',
    halfLevel: 're(LEVEL)',
    band: 'enum(A1|A2|A2+|B1|B1+|B2|B2+)',
    mode: 'enum(receptive-spoken|receptive-written|productive-spoken|productive-written|interaction-spoken|interaction-written|mediation)',
    source: '[str]',
    hf: '[enum(1|2|3|4|5|6|7|8|9|10|11|12|A|B|C|D|E)]',
    online: 'bool',
    mediation: 'bool',
  }),
}, {
  refine(doc, emit) {
    if (!Array.isArray(doc.items)) return;
    doc.items.forEach((it, i) => {
      if (it && typeof it.id === 'string' && typeof doc.band === 'string' && !it.id.startsWith(`cd.${doc.band}.`)) {
        emit(`items[${i}].id`, `can-do "${it.id}" is not in band "${doc.band}"`);
      }
    });
  },
});
