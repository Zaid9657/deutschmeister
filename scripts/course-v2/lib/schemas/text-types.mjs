// SCHEMA §4.7 — text types `registries/text-types.json`. SCHEMA gives the file no $schema; an
// optional literal `$schema: 'course-v2/text-types@1'` is accepted so the file can name itself.
//
// `lengthByLevel` (amended 2026-09-27, RAILS §7 item 9): per level `{ input: [int, int], writing?:
// [int, int] }` in words — `input` bounds a course input of this text type (capped at TXT-03),
// `writing` is the editor's recommended band for a learner text of this type; absent means the type
// is input only at that level. Exam texts follow their Teil template's `textWords` (TXT-02), never
// this band. The W2 DaF-progression review (docs/course-v2/reviews/w2/daf-progression.json) asked
// for the split and for the semantics in the file's `notes`, hence the optional `notes`.
import { obj, arr, map } from '../schema.mjs';

const BAND = '[int, int]';

export const textTypesSchema = obj({
  '$schema?': "'course-v2/text-types@1'",
  'notes?': '[str]',
  types: arr(obj({
    id: 're(texttype)',
    label: 'de',
    parts: '[enum(betreff|anrede|gruss|einleitung|schluss|datum|unterschrift)]*',
    lengthByLevel: map('re(LEVEL)', obj({ input: BAND, 'writing?': BAND }, {
      refine(b, emit) {
        for (const k of ['input', 'writing']) {
          const v = b[k];
          if (Array.isArray(v) && v.length === 2 && Number.isInteger(v[0]) && Number.isInteger(v[1]) && (v[0] < 0 || v[0] > v[1])) {
            emit(k, `band [${v[0]}, ${v[1]}] must satisfy 0 ≤ min ≤ max`);
          }
        }
      },
    })),
  })),
});
