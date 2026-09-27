// SCHEMA §4.5 — rubric profiles `registries/rubrics/{writing,speaking}/<id>.json` (`course-v2/rubric@1`).
//
// SCHEMA §4.5 gained `method`, `examMax`, `criteria[].scoredBy`, `criteria[].descriptors`, `bands` and
// `errorPolicy` on 2026-09-27 (Prüferin W2). They are transcribed here as OPTIONAL while the lane agents
// migrate their profiles one by one (tb1 first); make them required once every profile carries them.
// The refine below already enforces what the grader relies on whenever the fields are present.
import { obj, arr, map } from '../schema.mjs';

const ERROR_TAG = 'enum(v2-inv|verb-final|satzklammer|case-np|case-pp|gender-article|adj-ending|perfekt-aux-participle|connector-position|n-dekl|reflexive|register|spelling-meaning)';

export const rubricSchema = obj({
  $schema: "'course-v2/rubric@1'",
  id: 're(rubric)',
  kind: 'enum(writing|speaking)',
  lane: 'ref(lane) | null',
  'method?': 'enum(ai|deterministic)',
  max: 'num',
  'examMax?': 'num',
  criteria: arr(obj({
    id: 'str',
    label: 'de',
    'per?': 'enum(task|leitpunkt|turn|part)',
    levels: '[num]',
    'weight?': 'num',
    'scoredBy?': 'enum(ai|deterministic|notAutoScored)',
    'descriptors?': arr({ points: 'num', de: 'de' }, '*'),
  })),
  'bands?': arr({ label: 'str', min: 'num', max: 'num' }, '*'),
  'errorPolicy?': map('enum(a1|a2|b1|b2)', map(ERROR_TAG, 'enum(flag|score)')),
  zeroRules: '[str]*', // ids of pure functions in netlify/functions/_shared/rubrics/rules.mjs (EXM-08)
  capRules: '[str]*',
  spelling: 'enum(scored|only-if-meaning-suffers|not-scored)',
  feedbackLanguage: '[enum(de-a1|de-a2|de|en)]',
  modelId: 'str | null', // pinned; null for method: deterministic; any change re-runs CAL-01/02
  splitVerified: 'bool',
  calibration: { status: 'enum(pending|anchors-pass|human-pass|not-applicable)', rangeBands: 'num' },
  source: 'url',
}, {
  refine(p, emit) {
    const crit = Array.isArray(p.criteria) ? p.criteria : [];
    crit.forEach((c, i) => {
      if (!c || typeof c !== 'object') return;
      if (c.scoredBy !== 'notAutoScored' && Array.isArray(c.descriptors) && c.descriptors.length && Array.isArray(c.levels)) {
        const pts = c.descriptors.map((d) => d?.points);
        const missing = c.levels.filter((l) => !pts.includes(l));
        if (missing.length) emit(`criteria[${i}].descriptors`, `no descriptor for level(s) ${missing.join(', ')}`);
      }
      if (c.scoredBy === 'ai' && p.method === 'ai' && !Array.isArray(c.descriptors)) {
        emit(`criteria[${i}].descriptors`, 'required when scoredBy is ai');
      }
      if (/^(au|aussprache)$/i.test(String(c.id || '')) && c.scoredBy && c.scoredBy !== 'notAutoScored') {
        emit(`criteria[${i}].scoredBy`, 'Aussprache/Intonation is always notAutoScored (BLUEPRINT §4.4)');
      }
    });
    if (p.method === 'deterministic' && p.modelId !== null && p.modelId !== 'deterministic') emit('modelId', 'method deterministic takes modelId null');
    if (p.method === 'ai' && (p.modelId === null || p.modelId === 'deterministic')) emit('modelId', 'method ai needs a pinned model');
    if (Number.isFinite(p.examMax) && Number.isFinite(p.max) && p.examMax < p.max) emit('examMax', `examMax ${p.examMax} is below max ${p.max}`);
  },
});
