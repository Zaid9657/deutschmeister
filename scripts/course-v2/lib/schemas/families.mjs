// SCHEMA §4.4 — families and transfer map `registries/families.json` (`course-v2/families@1`).
import { obj, arr } from '../schema.mjs';

export const familiesSchema = obj({
  $schema: "'course-v2/families@1'",
  families: arr({ id: 're(family)', label: 'str', skill: 'de', templates: '[ref(template)]' }),
});
