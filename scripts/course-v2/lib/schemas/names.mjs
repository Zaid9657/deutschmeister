// SCHEMA §4.9 — proper-name registry `registries/names.json` (`course-v2/names@1`).
// Places, people, organisations, brands and events that are not cast members. LEX-01/LEX-03 count a
// listed name — with its genitive -s and adjectival -er forms — as known from its `level` on
// (lib-validate/lexicon.mjs nameForms). Matched by $schema or, without one, by file name.
import { obj, arr } from '../schema.mjs';

export const namesSchema = obj({
  '$schema?': "'course-v2/names@1'",
  version: '1',
  names: arr({
    form: 'de', // the name as it is written: „Leipzig", „Cospudener See", „Stiftung Warentest"
    kind: 'enum(place|person|org|brand|event)',
    level: 're(LEVEL)', // the first level whose texts may use it
    'note?': 'str',
  }, '*'),
}, {
  refine(doc, emit) {
    if (!Array.isArray(doc.names)) return;
    const seen = new Map();
    doc.names.forEach((n, i) => {
      const k = typeof n?.form === 'string' ? n.form.trim().toLowerCase() : null;
      if (!k) return;
      if (seen.has(k)) emit(`names[${i}].form`, `name "${n.form}" is listed twice (first at names[${seen.get(k)}])`);
      else seen.set(k, i);
    });
  },
});
