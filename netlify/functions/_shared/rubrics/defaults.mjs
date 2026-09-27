// Built-in rubric profiles and model pins for course v2 grading.
//
// Only the two DESIGN profiles live here — `course-micro` (written micro-output,
// SCHEMA §15.1, BLUEPRINT §4.3: Aufgabe erfüllt 2/1/0 · Zielstruktur benutzt 1/0 ·
// verständlich 2/1/0 = 5, Richtwert) and its spoken twin `course-micro-sp`. They
// are not exam scales, so a copy here cannot misstate an exam; the registry
// (content/course-v2/registries/rubrics/**) wins as soon as it carries them.
// Exam profiles (ga2-s2, tb1-sa, …) are NEVER defaulted: an uncompiled exam
// profile makes the grader refuse, it does not invent a scale.

export const BUILTIN_PROFILES = {
  'course-micro': {
    $schema: 'course-v2/rubric@1',
    id: 'course-micro',
    kind: 'writing',
    lane: null,
    max: 5,
    criteria: [
      { id: 'task', label: 'Aufgabe erfüllt', per: 'task', levels: [2, 1, 0] },
      { id: 'target', label: 'Zielstruktur benutzt', per: 'task', levels: [1, 0] },
      { id: 'clear', label: 'verständlich', per: 'task', levels: [2, 1, 0] },
    ],
    zeroRules: [],
    capRules: [],
    spelling: 'only-if-meaning-suffers',
    feedbackLanguage: ['de-a2', 'en'], // replaced by the level's language, see feedbackLanguageFor()
    modelId: 'config:micro',
    splitVerified: true,
    calibration: { status: 'pending', rangeBands: 1 },
    source: 'https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf',
    origin: 'builtin',
  },
  'course-micro-sp': {
    $schema: 'course-v2/rubric@1',
    id: 'course-micro-sp',
    kind: 'speaking',
    lane: null,
    max: 5,
    criteria: [
      { id: 'task', label: 'Aufgabe erfüllt', per: 'task', levels: [2, 1, 0] },
      { id: 'target', label: 'Zielstruktur benutzt', per: 'task', levels: [1, 0] },
      { id: 'clear', label: 'verständlich', per: 'task', levels: [2, 1, 0] },
    ],
    zeroRules: [],
    capRules: [],
    spelling: 'not-scored',
    feedbackLanguage: ['de-a2', 'en'],
    modelId: 'config:micro',
    splitVerified: true,
    calibration: { status: 'pending', rangeBands: 1 },
    source: 'https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf',
    origin: 'builtin',
  },
};

/** Profiles whose feedback language follows the LEVEL, not the profile (they serve every level). */
const LEVEL_NEUTRAL_PROFILES = new Set(['course-micro', 'course-micro-sp']);

/** The level profile's feedback language (BLUEPRINT §4.2 step 3: A1–A2 simple German + English twin; B1+ German). */
export function levelFeedbackLanguage(level) {
  const band = typeof level === 'string' ? level.slice(0, 2).toLowerCase() : '';
  if (band === 'a1') return ['de-a1', 'en'];
  if (band === 'a2') return ['de-a2', 'en'];
  return ['de'];
}

export function feedbackLanguageFor(profile, level) {
  if (!profile || LEVEL_NEUTRAL_PROFILES.has(profile.id) || !Array.isArray(profile.feedbackLanguage) || !profile.feedbackLanguage.length) {
    return levelFeedbackLanguage(level);
  }
  return profile.feedbackLanguage;
}

// Model pins. A profile's `modelId` is either a literal model id or a `config:`
// alias resolved here; changing a mapping is a CAL re-run (SCHEMA §4.5). The ids
// are the ones the live functions already use (evaluate-writing / evaluate-speaking:
// Sonnet 4.6; the speaking partner: Haiku 4.5).
export const MODEL_CONFIG = {
  'config:writing-full': 'claude-sonnet-4-6',
  'config:speaking-full': 'claude-sonnet-4-6',
  'config:micro': 'claude-haiku-4-5-20251001',
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
