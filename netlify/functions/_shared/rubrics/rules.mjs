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
//                       situationMissed, leitpunkteUnconnected, ownAspect },
//                       leitpunkte: [{ id, covered, sentences }] }
//            criteria — null before the model call, else the scored criteria
//                       [{ id, levels, values }] (levels descending)
//   effect = { reasonDe, reasonEn, zeroTask?: true, zero?: [criterionId],
//              cap?: { [criterionId]: maxLevelValue } }
// "crit1"/"crit2" of a telc profile are its FIRST and SECOND criterion by
// position (Aufgabenbewältigung, Kommunikative Gestaltung), because telc numbers
// its criteria I–III. The ids are the ones the rubric registry
// (content/course-v2/registries/rubrics/**) names; lanes/tb1.json and
// lanes/tb2.json record the readings behind the telc caps.
// The reason texts are our own wording (no official scale text is quoted).

// ── deterministic text signals ─────────────────────────────────────────────────
const ANREDE_RE = /^(liebe[rsn]?|hallo|hi|hey|sehr geehrte[rsn]?|guten\s+(tag|morgen|abend)|grüß\s+gott|servus|moin)\b/i;
const GRUSS_RE = /(grüße|gruß|grüßen|bis\s+bald|bis\s+dann|bis\s+später|bis\s+morgen|tschüss|tschüs|ciao|mach['’]s\s+gut|alles\s+gute|herzlich|\blg\b|\bvg\b|\bmfg\b)/i;
const BETREFF_RE = /^\s*betreff\s*:/im;
const DU_FORMS = new Set(['du', 'dich', 'dir', 'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deines', 'euch', 'euer', 'eure', 'euren', 'eurem', 'eurer']);
const SIE_FORMS = new Set(['Sie', 'Ihnen', 'Ihr', 'Ihre', 'Ihren', 'Ihrem', 'Ihrer', 'Ihres']);

const INFORMAL_CLOSE_RE = /(tschüss|tschüs|ciao|\bhdl\b|\blg\b|mach['’]s\s+gut|bis\s+dann)/i;

/** The address form a task asks for: `address`, else derived from `register`; null when neither says. */
export function expectedAddress(task) {
  if (task?.address === 'Sie' || task?.address === 'du') return task.address;
  if (task?.register === 'formell' || task?.register === 'halbformell') return 'Sie';
  if (task?.register === 'informell') return 'du';
  return null;
}

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
  // The WRONG register (telc criterion II): the text holds one address form, but not the one
  // the task asks for — from `address`, else from `register` (halbformell/formell ⇒ Sie,
  // informell ⇒ du) — or it closes a Sie letter with a greeting only friends use.
  const expected = expectedAddress(task);
  const informalClose = contentLines.slice(-3).some((l) => INFORMAL_CLOSE_RE.test(l));
  const registerWrong = expected === 'Sie'
    ? (duMarkers > 0 && sieMarkers === 0) || informalClose
    : expected === 'du' ? sieMarkers > 0 && duMarkers === 0 : false;

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
    registerWrong,
    ichWirShare,
  };
}

// ── helpers ────────────────────────────────────────────────────────────────────
const lowerBoundOf = (task) => {
  const band = task?.wordBand || task?.words;
  return Array.isArray(band) && Number.isFinite(band[0]) && band[0] > 0 ? band[0] : null;
};
const nthCriterion = (profile, n) => profile?.criteria?.[n] ?? null;
const sortedLevels = (c) => [...new Set((c?.levels || []).filter(Number.isFinite))].sort((a, b) => b - a);
/** The value of the n-th best level (0 = A), clamped to the lowest level. */
const nthLevel = (c, n) => {
  const lv = sortedLevels(c);
  return lv.length ? lv[Math.max(0, Math.min(n, lv.length - 1))] : 0;
};
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const flag = (ctx, name) => ctx?.ai?.flags?.[name] === true;
const allAtFloor = (c) => {
  const floor = Math.min(...c.levels);
  return Array.isArray(c.values) && c.values.length > 0 && c.values.every((v) => v <= floor);
};
const fmt = (n) => String(n).replace('.', ',');

/** Why a text's register fails telc criterion II, or null: mixed first, then wrong. */
function registerFinding(signals) {
  if (signals.registerMixed || signals.addressDrift) return { de: 'Du und Sie sind gemischt oder passen nicht zur Aufgabe.', en: 'du and Sie are mixed or do not fit the task.' };
  if (signals.registerWrong) return { de: 'Das Register passt nicht zur Aufgabe (Anrede oder Gruß).', en: 'The register does not fit the task (address or closing).' };
  return null;
}

/** A cap effect on the n-th criterion of the profile at its k-th best level (0 = A). */
function capNth(ctx, n, k, reasonDe, reasonEn) {
  const c = nthCriterion(ctx.profile, n);
  if (!c) return null;
  const cap = nthLevel(c, k);
  const letter = LETTERS[Math.min(k, sortedLevels(c).length - 1)] || '';
  return {
    cap: { [c.id]: cap },
    reasonDe: `${reasonDe} Nach der Bewertungsregel von telc sind auf Kriterium ${['I', 'II', 'III'][n] || n + 1} dann höchstens ${fmt(cap)} Punkte (${letter}) möglich.`,
    reasonEn: `${reasonEn} Under telc's scoring rule criterion ${['I', 'II', 'III'][n] || n + 1} can then reach at most ${cap} points (${letter}).`,
  };
}

/**
 * Criterion I of telc by the number of Leitpunkte handled (model output, rule ours):
 * `needed` = the points the task asks for (choose.pick, else all of them); each one
 * missing drops one level (B1: 4 = A, 3 = B, 2 = C, 1 or 0 = D; B2: 3 = A, 2 = B,
 * 1 = C, 0 = D — an own aspect may stand in for one point at B2).
 */
function leitpunktCountCap(ctx, { ownAspect = false, developedOnly = false } = {}) {
  const lps = ctx?.ai?.leitpunkte;
  const total = Array.isArray(ctx.task?.leitpunkte) ? ctx.task.leitpunkte.length : 0;
  if (!Array.isArray(lps) || !total) return null;
  const pick = Number(ctx.task?.choose?.pick);
  const needed = Number.isInteger(pick) && pick > 0 ? Math.min(pick, total) : total;
  const counted = lps.filter((l) => l?.covered === true && (!developedOnly || Number(l.sentences) > 1)).length
    + (ownAspect && flag(ctx, 'ownAspect') ? 1 : 0);
  const missing = Math.max(0, needed - Math.min(counted, needed));
  if (!missing) return null;
  return { missing, counted: Math.min(counted, needed), needed };
}

// ── the rules ──────────────────────────────────────────────────────────────────
export const RULES = {
  // Goethe (A1–B2 by the same rule): under half the required words → E → 0 for the task.
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
  // telc B1/B2: „Thema verfehlt“ → D on every criterion.
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
  // telc B1/B2: „Situierung verfehlt“ → D on criterion I only.
  'telc-situation-missed-d-crit1': {
    kind: 'cap',
    fn(ctx) {
      if (!flag(ctx, 'situationMissed')) return null;
      return capNth(ctx, 0, 9, 'Die Situation der Aufgabe ist verfehlt.', 'The situation of the task is missed.');
    },
  },
  // telc B1: criterion I follows the number of the four Leitpunkte handled.
  'telc-b1-crit1-by-leitpunkt-count': {
    kind: 'cap',
    fn(ctx) {
      const r = leitpunktCountCap(ctx);
      if (!r) return null;
      return capNth(ctx, 0, r.missing, `Bearbeitet: ${r.counted} von ${r.needed} Leitpunkten.`, `Handled: ${r.counted} of ${r.needed} points.`);
    },
  },
  // telc B2: criterion I follows the number of points handled (three, or two plus an own aspect).
  'telc-b2-crit1-by-leitpunkt-count': {
    kind: 'cap',
    fn(ctx) {
      const r = leitpunktCountCap(ctx, { ownAspect: true });
      if (!r) return null;
      return capNth(ctx, 0, r.missing, `Bearbeitet: ${r.counted} von ${r.needed} Punkten.`, `Handled: ${r.counted} of ${r.needed} points.`);
    },
  },
  // telc B2: a point counts only when it is treated in more than one sentence (Satzgefüge).
  'telc-b2-crit1-leitpunkt-more-than-one-sentence': {
    kind: 'cap',
    fn(ctx) {
      const r = leitpunktCountCap(ctx, { ownAspect: true, developedOnly: true });
      if (!r) return null;
      return capNth(
        ctx, 0, r.missing,
        `Ausführlicher als ein Satz behandelt: ${r.counted} von ${r.needed} Punkten.`,
        `Treated in more than one sentence: ${r.counted} of ${r.needed} points.`,
      );
    },
  },
  // telc B1: no A on criterion II when the e-mail's Anrede or Gruß is missing (the Betreff
  // is only a pre-check hint at B1 — lanes/tb1.json, open question 2).
  'telc-b1-no-a-crit2-textsorte-missing': {
    kind: 'cap',
    fn(ctx) {
      const missing = [];
      if (!ctx.signals.hasAnrede) missing.push('Anrede');
      if (!ctx.signals.hasGruss) missing.push('Grußformel');
      if (!missing.length) return null;
      return capNth(ctx, 1, 1, `Es fehlt: ${missing.join(', ')}.`, `Missing: ${missing.join(', ')}.`);
    },
  },
  // telc B1: no A on criterion II with du and Sie mixed.
  'telc-b1-no-a-crit2-register-mixed': {
    kind: 'cap',
    fn(ctx) {
      if (!ctx.signals.registerMixed && !ctx.signals.addressDrift) return null;
      return capNth(ctx, 1, 1, 'Du und Sie sind gemischt.', 'du and Sie are mixed.');
    },
  },
  // telc B1, the Prüferin's reading (W2, 2026-09-27): no A on criterion II when the register is
  // wrong for the task or du and Sie are mixed. Ready for lanes/tb1 to switch to; the older
  // id above stays while tb1-sa.json still names it.
  'telc-b1-no-a-crit2-register-wrong-or-mixed': {
    kind: 'cap',
    fn(ctx) {
      const r = registerFinding(ctx.signals);
      return r ? capNth(ctx, 1, 1, r.de, r.en) : null;
    },
  },
  // telc B1: no A on criterion II when the Leitpunkte stand unconnected (model judgement).
  'telc-b1-no-a-crit2-leitpunkte-unconnected': {
    kind: 'cap',
    fn(ctx) {
      if (!flag(ctx, 'leitpunkteUnconnected')) return null;
      return capNth(ctx, 1, 1, 'Die Punkte stehen ohne Verbindung nebeneinander.', 'The points are listed without connection.');
    },
  },
  // telc B1: no A on criterion II when most sentences start with „Ich“ or „Wir“.
  'telc-b1-no-a-crit2-ich-wir-starts': {
    kind: 'cap',
    fn(ctx) {
      if (ctx.signals.bodySentenceCount < 3 || ctx.signals.ichWirShare <= 0.5) return null;
      return capNth(ctx, 1, 1, 'Die meisten Sätze beginnen mit „Ich“ oder „Wir“.', 'Most sentences start with Ich or Wir.');
    },
  },
  // telc B2: no A on criterion II when Betreff, Anrede or Schlussformel is missing
  // (the stricter reading of UT-B2 p. 43 — lanes/tb2.json, open question 5).
  'telc-b2-no-a-crit2-textsorte-missing': {
    kind: 'cap',
    fn(ctx) {
      const missing = [];
      if (!ctx.signals.hasBetreff) missing.push('Betreff');
      if (!ctx.signals.hasAnrede) missing.push('Anrede');
      if (!ctx.signals.hasGruss) missing.push('Schlussformel');
      if (!missing.length) return null;
      return capNth(ctx, 1, 1, `Es fehlt: ${missing.join(', ')}.`, `Missing: ${missing.join(', ')}.`);
    },
  },
  // telc B2: no B on criterion II when the register is wrong for the task or du and Sie are
  // mixed (Prüferin W2, 2026-09-27: the official cap names both; memo 03 §2).
  'telc-b2-no-b-crit2-register-wrong-or-mixed': {
    kind: 'cap',
    fn(ctx) {
      const r = registerFinding(ctx.signals);
      return r ? capNth(ctx, 1, 2, r.de, r.en) : null;
    },
  },
  // telc B2: no B on criterion II when the points are listed linearly without logical connection.
  'telc-b2-no-b-crit2-leitpunkte-unconnected': {
    kind: 'cap',
    fn(ctx) {
      if (!flag(ctx, 'leitpunkteUnconnected')) return null;
      return capNth(ctx, 1, 2, 'Die Punkte stehen ohne logische Verbindung nacheinander.', 'The points are listed without logical connection.');
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
