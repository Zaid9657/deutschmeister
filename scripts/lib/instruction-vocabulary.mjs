import { buildSetStage } from '../../src/lib/lesson/taughtSet.js';
import { CURRICULUM_A11 } from '../../src/data/curricula/a11.js';
/** Metalanguage already used by course instructions, never licensed in produced answers. */
export const instructionVocabulary = new Set(CURRICULUM_A11.lektionen.flatMap((l) => [
  l.pretest?.promptDe, l.schreiben?.taskDe, l.sprechen?.open?.promptDe,
  ...(l.guided?.sets || []).flatMap((s) => buildSetStage(s).steps.filter((step) => step.item).map((step) => step.item.promptDe)),
  ...(l.guided?.chunks || []).map((c) => c.meaning?.promptDe),
  ...(l.guided?.read?.questions || []).map((q) => q.promptDe),
]).filter(Boolean).flatMap((s) => s.match(/\p{L}+/gu) || []).map((w) => w.toLowerCase()));
