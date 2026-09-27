// Model pins, feedback language and the fixed result labels for course v2 grading.
//
// Rubric profiles themselves live ONLY in the registry
// (content/course-v2/registries/rubrics/**, compiled into
// netlify/functions/_shared/course-v2/rubrics.json by
// scripts/course-v2/compile-rubrics.mjs). Nothing here defaults a profile: an
// uncompiled profile makes the grader refuse, it never invents a scale.

const GERMAN_VARIANTS = ['de-a1', 'de-a2', 'de'];

/** The level profile's feedback language (BLUEPRINT §4.2 step 3: A1–A2 simple German + English twin; B1+ German). */
export function levelFeedbackLanguage(level) {
  const band = typeof level === 'string' ? level.slice(0, 2).toLowerCase() : '';
  if (band === 'a1') return ['de-a1', 'en'];
  if (band === 'a2') return ['de-a2', 'en'];
  return ['de'];
}

/**
 * The feedback language of one grading. A profile that names ONE German variant
 * (ga2-s2: de-a2 + en) is used as written; a profile that serves several levels
 * names several (course-micro: de-a1, de-a2, de, en) — then the level picks its
 * variant, and the English twin stays only at A levels (BLUEPRINT §4.2 step 3).
 */
export function feedbackLanguageFor(profile, level) {
  const listed = Array.isArray(profile?.feedbackLanguage) ? profile.feedbackLanguage : [];
  if (listed.filter((l) => GERMAN_VARIANTS.includes(l)).length === 1) return listed;
  const byLevel = levelFeedbackLanguage(level);
  return listed.length && !listed.includes('en') ? byLevel.filter((l) => l !== 'en') : byLevel;
}

// Model pins. A profile's `modelId` is either a literal model id or a `config:`
// alias resolved here; changing a mapping is a CAL re-run (SCHEMA §4.5). The ids
// are the ones the live functions already use (evaluate-writing / evaluate-speaking:
// Sonnet 4.6; the speaking partner: Haiku 4.5).
export const MODEL_CONFIG = {
  'config:writing-full': 'claude-sonnet-4-6',
  'config:speaking-full': 'claude-sonnet-4-6',
  'config:micro': 'claude-haiku-4-5-20251001',
  'config:micro-sp': 'claude-haiku-4-5-20251001',
};

/** The concrete model id for a profile, or null for `deterministic` profiles (no model call). */
export function modelFor(profile) {
  const id = profile?.modelId;
  if (!id || id === 'deterministic') return null;
  if (MODEL_CONFIG[id]) return MODEL_CONFIG[id];
  if (id.startsWith('config:')) return MODEL_CONFIG[profile.kind === 'speaking' ? 'config:speaking-full' : 'config:writing-full'];
  return id; // a literal, pinned model id
}

/** The fixed labels every graded v2 surface carries (BLUEPRINT §1.6 rule 3, §4.5). */
export const SCORE_LABEL_DE = 'automatisierte Übungsbewertung';
export const SCORE_NOTICE_DE =
  'Automatische KI-Auswertung — keine Korrektur durch eine Lehrkraft, kein Prüfungsergebnis. Richtwert.';
