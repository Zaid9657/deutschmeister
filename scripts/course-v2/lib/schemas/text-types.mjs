// SCHEMA §4.7 — text types `registries/text-types.json`. SCHEMA gives the file no $schema; an
// optional literal `$schema: 'course-v2/text-types@1'` is accepted so the file can name itself.
import { obj, arr, map } from '../schema.mjs';

export const textTypesSchema = obj({
  '$schema?': "'course-v2/text-types@1'",
  types: arr({
    id: 're(texttype)',
    label: 'de',
    parts: '[enum(betreff|anrede|gruss|einleitung|schluss|datum|unterschrift)]*',
    lengthByLevel: map('re(LEVEL)', '[int, int]'),
  }),
});
