// File kinds of content/course-v2 and how a file is matched to its schema.
//
// A file is matched by its `$schema` literal; the three registry files SCHEMA §4.7 writes
// without one (text-types.json, detectors.json, casts/*.json) are matched by path.
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
import { unitSchema, unitDraftSchema, STAGED_SECTIONS } from './unit.mjs';
import { lanePackSchema } from './lanepack.mjs';
import { plateauSchema, closingSchema, mockModuleSchema } from './plateau.mjs';
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
  course: { schemaId: 'course-v2/course@1', schema: courseSchema },
  lexicon: { schemaId: 'course-v2/lexicon@1', schema: lexiconSchema },
  rulecards: { schemaId: 'course-v2/rulecards@1', schema: ruleCardsSchema },
  unit: { schemaId: 'course-v2/unit@1', schema: unitSchema, draftSchema: unitDraftSchema },
  lanepack: { schemaId: 'course-v2/lanepack@1', schema: lanePackSchema },
  plateau: { schemaId: 'course-v2/plateau@1', schema: plateauSchema },
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
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
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
  return { error: 'missing $schema (only text-types.json, detectors.json and casts/*.json may omit it)' };
}

/** The schema that applies to this document: a draft unit may lack its staged sections. */
export function schemaFor(kind, doc) {
  const k = KINDS[kind];
  if (kind === 'unit' && doc && doc.status === 'draft' && STAGED_SECTIONS.some((s) => !(s in doc))) return k.draftSchema;
  return k.schema;
}
