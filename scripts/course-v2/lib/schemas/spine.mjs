// SCHEMA §4.2 — grammar spine `registries/grammar-spine.json` (`course-v2/spine@1`).
import { obj, arr } from '../schema.mjs';

export const spineSchema = obj({
  $schema: "'course-v2/spine@1'",
  points: arr({
    id: 're(spine)',
    label: 'de',
    intro: { receptive: 'ref(unit)', 'productive?': 'ref(unit)' },
    'chunkFrom?': 'ref(unit)',
    detectors: '[ref(detector)]*',
    'contrast?': 'ref(spine)',
    errorTags: '[str]*',
    lehrwerk: '[str]',
    consensus: 'enum(strong|majority|split|single)',
    ruleCards: '[ref(rulecard)]',
    inventory: '[enum(gz-a1|gz-a2)]*',
  }),
});
