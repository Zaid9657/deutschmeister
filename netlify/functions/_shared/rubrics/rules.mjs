// Deterministic zero and cap rules for course v2 grading (BLUEPRINT §4.2 step 2,
// SCHEMA §4.5 zeroRules/capRules, gate EXM-08).
//
// A rubric profile names its rules by id (`"zeroRules": ["goethe-e-under-half-words"]`);
// every id a profile may use is a key of RULES below, and
// scripts/course-v2/compile-rubrics.mjs refuses a profile that names an id this
// file does not define. The rules run on the SERVER, after the model has
// answered, on the model's per-criterion levels: the model returns levels, never
// a total, and cannot switch a rule off. Rules that need no model judgement
// (word count, Betreff/Anrede/Gruß, du/Sie drift) also run BEFORE the model is
// called — a text that a zero rule already decides costs no model call.
//
// Every function here is pure: (ctx) → null | effect.
//   ctx    = { text, task, profile, signals, ai, criteria, fields }
//            ai       — null before the model call, else { flags: { topicMissed,
//                       situationMissed, leitpunkteUnconnected } }
//            criteria — null before the model call, else the scored criteria
//                       [{ id, levels, values }] (levels descending)
//   effect = { reasonDe, reasonEn, zeroTask?: true, zero?: [criterionId],
//              cap?: { [criterionId]: maxLevelValue } }
// "Criterion II" of a telc profile is its SECOND criterion (Kommunikative
// Gestaltung), by position, because telc numbers its criteria I–III.
// The reason texts are our own wording (no official scale text is quoted).

// ── deterministic text signals ─────────────────────────────────────────────────
const ANREDE_RE = /^(liebe[rsn]?|hallo|hi|hey|sehr geehrte[rsn]?|guten\s+(tag|morgen|abend)|grüß\s+gott|servus|moin)\b/i;
const GRUSS_RE = /(grüße|gruß|grüßen|bis\s+bald|bis\s+dann|bis\s+später|bis\s+morgen|tschüss|tschüs|ciao|mach['’]s\s+gut|alles\s+gute|herzlich|\blg\b|\bvg\b|\bmfg\b)/i;
const BETREFF_RE = /^\s*betreff\s*:/im;
const DU_FORMS = new Set(['du', 'dich', 'dir', 'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deines', 'euch', 'euer', 'eure', 'euren', 'eurem', 'eurer']);
const SIE_FORMS = new Set(['Sie', 'Ihnen', 'Ihr', 'Ihre', 'Ihren', 'Ihrem', 'Ihrer', 'Ihres']);

const tokensOf = (s) => s.split(/\s+/).map((t) => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')).filter(Boolean);

/** Word count the way the pre-check counts it: whitespace tokens that carry a letter or digit. */
export function countWords(text) {
  return String(text ?? '').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** The deterministic features the rules read. Pure and cheap (< 1 ms on an exam text). */
export function textSignals(text, task = {}) {
  const clean = String(text ?? '').replace(/\r\n?/g, '\n');
  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  const sentences = clean
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => /\p{L}/u.test(s));

  const contentLines = lines.filter((l) => !BETREFF_RE.test(l));
  const hasAnrede = contentLines.length > 0 && ANREDE_RE.test(contentLines[0]);
  const hasGruss = contentLines.slice(-3).some((l) => GRUSS_RE.test(l));
  const hasBetreff = BETREFF_RE.test(clean);

  let duMarkers = 0;
  let sieMarkers = 0;
  for (const s of sentences) {
    const toks = tokensOf(s);
    toks.forEach((t, i) => {
      if (DU_FORMS.has(t.toLowerCase())) duMarkers += 1;
      // Sentence-initial „Sie“ may be „sie“ (she/they); only mid-sentence capitals, and „Ihnen“ anywhere, count.
      if (SIE_FORMS.has(t) && (i > 0 || t === 'Ihnen')) sieMarkers += 1;
    });
  }
  const registerMixed = duMarkers > 0 && sieMarkers > 0;
  const addressDrift =
    (task?.address === 'Sie' && duMarkers > 0) || (task?.address === 'du' && sieMarkers > 0);

  const body = sentences.filter((s) => !ANREDE_RE.test(s) && !GRUSS_RE.test(s) && !BETREFF_RE.test(s));
  const ichWir = body.filter((s) => /^(ich|wir)$/i.test(tokensOf(s)[0] || '')).length;
  const ichWirShare = body.length ? ichWir / body.length : 0;

  return {
    wordCount: countWords(clean),
    sentenceCount: sentences.length,
    bodySentenceCount: body.length,
    hasAnrede,
    hasGruss,
    hasBetreff,
    duMarkers,
    sieMarkers,
    registerMixed,
    addressDrift,
    ichWirShare,
  };
}

// ── helpers ────────────────────────────────────────────────────────────────────
const lowerBoundOf = (task) => {
  const band = task?.wordBand || task?.words;
  return Array.isArray(band) && Number.isFinite(band[0]) && band[0] > 0 ? band[0] : null;
};
const secondCriterion = (profile) => profile?.criteria?.[1] ?? null;
const sortedLevels = (c) => [...new Set((c?.levels || []).filter(Number.isFinite))].sort((a, b) => b - a);
/** The value of the n-th best level (0 = A), clamped to the lowest level. */
const nthLevel = (c, n) => {
  const lv = sortedLevels(c);
  return lv.length ? lv[Math.min(n, lv.length - 1)] : 0;
};
const flag = (ctx, name) => ctx?.ai?.flags?.[name] === true;
const allAtFloor = (c) => {
  const floor = Math.min(...c.levels);
  return Array.isArray(c.values) && c.values.length > 0 && c.values.every((v) => v <= floor);
};
const fmt = (n) => String(n).replace('.', ',');

// ── the rules ──────────────────────────────────────────────────────────────────
export const RULES = {
  // Goethe A2 (and A1/B1/B2 by the same rule): under half the required words → E → 0 for the task.
  'goethe-e-under-half-words': {
    kind: 'zero',
    fn(ctx) {
      const lower = lowerBoundOf(ctx.task);
      if (!lower || ctx.signals.wordCount >= lower * 0.5) return null;
      return {
        zeroTask: true,
        reasonDe: `Nach der Bewertungsregel von Goethe bekäme dieser Text 0 Punkte: weniger als die Hälfte der Wörter (${ctx.signals.wordCount} von mindestens ${lower}).`,
        reasonEn: `Under Goethe's scoring rule this text would get 0 points: fewer than half the required words (${ctx.signals.wordCount} of at least ${lower}).`,
      };
    },
  },
  // Goethe: topic missed → E → 0 for the task. The model judges „missed“; the consequence is fixed here.
  'goethe-e-topic-missed': {
    kind: 'zero',
    fn(ctx) {
      if (!flag(ctx, 'topicMissed')) return null;
      return {
        zeroTask: true,
        reasonDe: 'Nach der Bewertungsregel von Goethe bekäme dieser Text 0 Punkte: Das Thema der Aufgabe ist verfehlt.',
        reasonEn: "Under Goethe's scoring rule this text would get 0 points: it misses the topic of the task.",
      };
    },
  },
  // Goethe: E (the lowest level) in Aufgabenerfüllung zeroes the task. Per Teil for
  // multi-part profiles ('t2-af' at 0 zeroes every 't2-*' criterion).
  'goethe-af-e-zeroes-task': {
    kind: 'zero',
    fn(ctx) {
      if (!Array.isArray(ctx.criteria)) return null;
      const zero = [];
      let zeroTask = false;
      for (const c of ctx.criteria) {
        if (!allAtFloor(c)) continue;
        if (c.id === 'af') zeroTask = true;
        const m = c.id.match(/^(.+)-af$/);
        if (m) zero.push(...ctx.criteria.filter((o) => o.id.startsWith(`${m[1]}-`)).map((o) => o.id));
      }
      if (!zeroTask && !zero.length) return null;
      return {
        ...(zeroTask ? { zeroTask: true } : { zero: [...new Set(zero)] }),
        reasonDe: 'Nach der Bewertungsregel von Goethe zählt die Aufgabe 0 Punkte, wenn die Aufgabenerfüllung mit 0 bewertet ist.',
        reasonEn: "Under Goethe's scoring rule the task counts 0 points when task fulfilment is rated 0.",
      };
    },
  },
  // Forms (sd1-s1): a field whose key is a number, time or date counts only when exact.
  'form-number-exact': {
    kind: 'zero',
    fn(ctx) {
      if (!Array.isArray(ctx.fields)) return null;
      const norm = (s) => String(s ?? '').replace(/\s+/g, '').toLowerCase();
      const wrong = ctx.fields
        .filter((f) => /\d/.test(String(f.expected ?? '')) && norm(f.given) !== norm(f.expected))
        .map((f) => f.criterion);
      if (!wrong.length) return null;
      return {
        zero: wrong,
        reasonDe: 'Zahlen, Uhrzeiten und Daten zählen nur, wenn sie genau stimmen.',
        reasonEn: 'Numbers, times and dates count only when they are exact.',
      };
    },
  },
  // telc: „Thema verfehlt“ → D on every criterion.
  'telc-topic-missed-d-all': {
    kind: 'zero',
    fn(ctx) {
      if (!flag(ctx, 'topicMissed')) return null;
      return {
        zeroTask: true,
        reasonDe: 'Nach der Bewertungsregel von telc gibt es bei verfehltem Thema auf allen Kriterien D (0 Punkte).',
        reasonEn: "Under telc's scoring rule a missed topic gives D (0 points) on every criterion.",
      };
    },
  },
  // telc: „Situierung verfehlt“ → D on criterion I only.
  'telc-situation-missed-d-on-i': {
    kind: 'zero',
    fn(ctx) {
      const first = ctx.profile?.criteria?.[0];
      if (!first || !flag(ctx, 'situationMissed')) return null;
      return {
        zero: [first.id],
        reasonDe: 'Nach der Bewertungsregel von telc gibt es bei verfehlter Situation auf Kriterium I D (0 Punkte).',
        reasonEn: "Under telc's scoring rule a missed situation gives D (0 points) on criterion I.",
      };
    },
  },
  // telc B2: no A on criterion II without Betreff, Anrede and Schlussformel.
  'telc-b2-no-a-on-ii-without-form': {
    kind: 'cap',
    fn(ctx) {
      const ii = secondCriterion(ctx.profile);
      if (!ii) return null;
      const missing = [];
      if (!ctx.signals.hasBetreff) missing.push('Betreff');
      if (!ctx.signals.hasAnrede) missing.push('Anrede');
      if (!ctx.signals.hasGruss) missing.push('Schlussformel');
      if (!missing.length) return null;
      const cap = nthLevel(ii, 1);
      return {
        cap: { [ii.id]: cap },
        reasonDe: `Es fehlt: ${missing.join(', ')}. Nach der Bewertungsregel von telc sind auf Kriterium II dann höchstens ${fmt(cap)} Punkte möglich.`,
        reasonEn: `Missing: ${missing.join(', ')}. Under telc's scoring rule criterion II can then reach at most ${cap} points.`,
      };
    },
  },
  // telc B1: no A on criterion II with mixed register, unconnected Leitpunkte or mostly Ich/Wir sentence starts.
  'telc-b1-no-a-on-ii': {
    kind: 'cap',
    fn(ctx) {
      const ii = secondCriterion(ctx.profile);
      if (!ii) return null;
      const why = [];
      if (ctx.signals.registerMixed || ctx.signals.addressDrift) why.push('Du und Sie gemischt');
      if (ctx.signals.bodySentenceCount >= 3 && ctx.signals.ichWirShare > 0.5) why.push('die meisten Sätze beginnen mit „Ich“ oder „Wir“');
      if (flag(ctx, 'leitpunkteUnconnected')) why.push('die Punkte stehen ohne Verbindung nebeneinander');
      if (!why.length) return null;
      const cap = nthLevel(ii, 1);
      return {
        cap: { [ii.id]: cap },
        reasonDe: `${why.join('; ')}. Nach der Bewertungsregel von telc sind auf Kriterium II dann höchstens ${fmt(cap)} Punkte möglich.`,
        reasonEn: `Register mixed, mostly Ich/Wir sentence starts or unconnected points. Under telc's scoring rule criterion II can then reach at most ${cap} points.`,
      };
    },
  },
  // telc B2: no B on criterion II when the Leitpunkte are listed without connection or the register is wrong.
  'telc-b2-no-b-on-ii-linear-or-register': {
    kind: 'cap',
    fn(ctx) {
      const ii = secondCriterion(ctx.profile);
      if (!ii) return null;
      const why = [];
      if (ctx.signals.registerMixed || ctx.signals.addressDrift) why.push('Du und Sie gemischt');
      if (flag(ctx, 'leitpunkteUnconnected')) why.push('die Punkte stehen ohne Verbindung nebeneinander');
      if (!why.length) return null;
      const cap = nthLevel(ii, 2);
      return {
        cap: { [ii.id]: cap },
        reasonDe: `${why.join('; ')}. Nach der Bewertungsregel von telc sind auf Kriterium II dann höchstens ${fmt(cap)} Punkte möglich.`,
        reasonEn: `Register mixed or points listed without connection. Under telc's scoring rule criterion II can then reach at most ${cap} points.`,
      };
    },
  },
};

export const RULE_IDS = Object.keys(RULES);

/** Rule ids a profile names that this file does not define (a profile with any is not gradable). */
export function unknownRuleIds(profile) {
  const ids = [...(profile?.zeroRules || []), ...(profile?.capRules || [])];
  return ids.filter((id) => !RULES[id]);
}

/** Run a profile's rules. Returns the fired rules in order: caps first, then zeros. */
export function evaluateRules(profile, ctx) {
  const fired = [];
  for (const id of [...(profile?.capRules || []), ...(profile?.zeroRules || [])]) {
    const rule = RULES[id];
    if (!rule) continue;
    const effect = rule.fn({ ...ctx, profile });
    if (effect) fired.push({ id, kind: rule.kind, ...effect });
  }
  return fired;
}

/** True when a fired rule set already decides the whole task at 0 (no model call needed). */
export const decidesZero = (fired) => fired.some((f) => f.zeroTask);

/** The value a level list snaps a number to: the nearest level, ties to the LOWER level. */
export function snapToLevel(levels, value) {
  const lv = [...new Set(levels.filter(Number.isFinite))].sort((a, b) => a - b);
  if (!lv.length || !Number.isFinite(value)) return null;
  let best = lv[0];
  for (const l of lv) if (Math.abs(l - value) < Math.abs(best - value)) best = l;
  return best;
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Apply fired rules to scored criteria. Caps first (a value above the cap drops to
 * the best level at or below it), then zeros (the lowest level). Returns new
 * criteria objects with points recomputed; the input is not mutated.
 */
export function applyRuleEffects(criteria, fired) {
  const out = criteria.map((c) => ({ ...c, values: [...c.values] }));
  const byId = new Map(out.map((c) => [c.id, c]));
  for (const f of fired) {
    if (!f.cap) continue;
    for (const [id, capValue] of Object.entries(f.cap)) {
      const c = byId.get(id);
      if (!c) continue;
      const allowed = c.levels.filter((l) => l <= capValue);
      const ceiling = allowed.length ? Math.max(...allowed) : Math.min(...c.levels);
      const next = c.values.map((v) => Math.min(v, ceiling));
      if (next.some((v, i) => v !== c.values[i])) c.cappedBy = f.id;
      c.values = next;
    }
  }
  for (const f of fired) {
    const ids = f.zeroTask ? out.map((c) => c.id) : f.zero || [];
    for (const id of ids) {
      const c = byId.get(id);
      if (!c) continue;
      const floor = Math.min(...c.levels);
      const next = c.values.map(() => floor);
      if (next.some((v, i) => v !== c.values[i])) c.zeroedBy = f.id;
      c.values = next;
    }
  }
  for (const c of out) c.points = round2(c.values.reduce((s, v) => s + v, 0) * c.weight);
  return out;
}
