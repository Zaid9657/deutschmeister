// File kinds of content/course-v2 and how a file is matched to its schema.
//
// A file is matched by its `$schema` literal; the registry files SCHEMA §4.7 writes without one
// (text-types.json, detectors.json, voices.json, style.json, casts/*.json) are matched by path.
import path from 'node:path';
import { candoSchema } from './cando.mjs';
import { spineSchema } from './spine.mjs';
import { laneSchema } from './lane.mjs';
import { familiesSchema } from './families.mjs';
import { rubricSchema } from './rubric.mjs';
import { levelsSchema } from './levels.mjs';
import { textTypesSchema } from './text-types.mjs';
import { detectorsSchema } from './detectors.mjs';
import { castsSchema } from './casts.mjs';
import { courseSchema } from './course.mjs';
import { lexiconSchema } from './lexicon.mjs';
import { ruleCardsSchema } from './rulecards.mjs';
import { unitSchema, UNIT_SCHEMAS } from './unit.mjs';
import { lanePackSchema } from './lanepack.mjs';
import { plateauSchema, plateauLanePackSchema, closingSchema, mockModuleSchema } from './plateau.mjs';
import { voicesSchema, styleSchema, lemmasSchema } from './registries.mjs';
import { anchorSchema, qaSchema } from './qa.mjs';
import { stubsSchema } from './stubs.mjs';

export const KINDS = {
  cando: { schemaId: 'course-v2/cando@1', schema: candoSchema },
  spine: { schemaId: 'course-v2/spine@1', schema: spineSchema },
  lane: { schemaId: 'course-v2/lane@1', schema: laneSchema },
  families: { schemaId: 'course-v2/families@1', schema: familiesSchema },
  rubric: { schemaId: 'course-v2/rubric@1', schema: rubricSchema },
  levels: { schemaId: 'course-v2/levels@1', schema: levelsSchema },
  texttypes: { schemaId: 'course-v2/text-types@1', schema: textTypesSchema, fileName: 'text-types.json' },
  detectors: { schemaId: 'course-v2/detectors@1', schema: detectorsSchema, fileName: 'detectors.json' },
  casts: { schemaId: 'course-v2/casts@1', schema: castsSchema, dirName: 'casts' },
  voices: { schemaId: 'course-v2/voices@1', schema: voicesSchema, fileName: 'voices.json' },
  style: { schemaId: 'course-v2/style@1', schema: styleSchema, fileName: 'style.json' },
  lemmas: { schemaId: 'course-v2/lemmas@1', schema: lemmasSchema },
  course: { schemaId: 'course-v2/course@1', schema: courseSchema },
  lexicon: { schemaId: 'course-v2/lexicon@1', schema: lexiconSchema },
  rulecards: { schemaId: 'course-v2/rulecards@1', schema: ruleCardsSchema },
  unit: { schemaId: 'course-v2/unit@1', schema: unitSchema },
  lanepack: { schemaId: 'course-v2/lanepack@1', schema: lanePackSchema },
  plateau: { schemaId: 'course-v2/plateau@1', schema: plateauSchema },
  plateaulanepack: { schemaId: 'course-v2/plateaulanepack@1', schema: plateauLanePackSchema },
  closing: { schemaId: 'course-v2/closing@1', schema: closingSchema },
  mockmodule: { schemaId: 'course-v2/mockmodule@1', schema: mockModuleSchema },
  anchor: { schemaId: 'course-v2/anchor@1', schema: anchorSchema },
  qa: { schemaId: 'course-v2/qa@1', schema: qaSchema },
  stubs: { schemaId: 'course-v2/stubs@1', schema: stubsSchema },
};

const BY_SCHEMA_ID = new Map(Object.entries(KINDS).map(([kind, k]) => [k.schemaId, kind]));

/**
 * The kind of a parsed file, or { error } when it cannot be matched.
 * `file` is used only for the three registries SCHEMA gives no $schema.
 */
export function kindOf(doc, file = '') {
  if (Array.isArray(doc)) {
    return { error: 'a course-v2 file must be a JSON object, got an array (SCHEMA §0: one unit per file — units/uNN.json with "stage": "spec" for a spec-only unit)' };
  }
  if (doc === null || typeof doc !== 'object') {
    return { error: 'a course-v2 file must be a JSON object' };
  }
  if (Object.prototype.hasOwnProperty.call(doc, '$schema')) {
    const kind = BY_SCHEMA_ID.get(doc.$schema);
    if (!kind) return { error: `unknown $schema ${JSON.stringify(doc.$schema)} (known: ${[...BY_SCHEMA_ID.keys()].join(', ')})` };
    return { kind };
  }
  const base = path.basename(file);
  const dir = path.basename(path.dirname(file));
  for (const [kind, k] of Object.entries(KINDS)) {
    if (k.fileName && base === k.fileName) return { kind };
    if (k.dirName && dir === k.dirName) return { kind };
  }
  return { error: 'missing $schema (only text-types.json, detectors.json, voices.json, style.json and casts/*.json may omit it)' };
}

/**
 * The schema that applies to this document. A unit is checked against the stage schema of its
 * declared `stage` (SCHEMA §8.1); a unit with no valid stage is checked at T, the full shape.
 */
export function schemaFor(kind, doc, { stage } = {}) {
  const k = KINDS[kind];
  if (kind === 'unit') {
    const s = stage || (doc && typeof doc.stage === 'string' ? doc.stage : null);
    return UNIT_SCHEMAS[s] || UNIT_SCHEMAS.T;
  }
  return k.schema;
}
