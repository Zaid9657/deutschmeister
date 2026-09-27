// SCHEMA §4.7 — construction detectors `registries/detectors.json` (owned by E0-4). No $schema
// in SCHEMA; an optional literal `$schema: 'course-v2/detectors@1'` is accepted.
import { obj, arr } from '../schema.mjs';

export const detectorsSchema = obj({
  '$schema?': "'course-v2/detectors@1'",
  detectors: arr({
    id: 're(detector)',
    construction: 'str',
    precision: 'enum(exact|heuristic|advisory)',
    method: 'enum(token|pattern|lexicon|clause)',
    spec: 'object',
  }),
});
