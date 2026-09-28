// SCHEMA §4.7 — cast bible `casts/series.json` + `casts/<band>.json`. No $schema in SCHEMA; an
// optional literal `$schema: 'course-v2/casts@1'` is accepted.
import { obj, arr, map } from '../schema.mjs';

export const castsSchema = obj({
  '$schema?': "'course-v2/casts@1'",
  members: map('re(cast)', {
    name: 'str',
    'age?': 'int',
    'from?': 'str',
    languages: '[str]*',
    role: 'de',
    'exam?': { lane: 'ref(lane)', arc: 'de' },
    voice: { azure: 'str', rate: 'str' },
    bands: '[str]',
    // the persona data units state, so every unit states the same (a1.1-u02 r1 F16 … u12 r1 F06): a phone
    // number as written, and each address with the unit it holds from (and until, when it changes)
    'contact?': {
      'phone?': 'str',
      'addresses?': arr({ de: 'de', from: 'ref(unit)', 'until?': 'ref(unit)', 'note?': 'str' }, '*'),
    },
  }),
  relations: arr({ a: 'ref(cast)', b: 'ref(cast)', address: 'enum(du|Sie)', 'since?': 'ref(unit)' }),
  // casts/series.json only: every cross-course beat (from = a course's U12, to = the next course's U01)
  'beats?': arr({ from: 'ref(unit)', to: 'ref(unit)', cliffhanger: 'de', resolution: 'de', recapDe: 'de' }, '*'),
});
