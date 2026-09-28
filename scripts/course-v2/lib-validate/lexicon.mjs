// Lexicon helpers (SCHEMA §6): the surface forms of an entry, and token ↔ lemma matching for the
// LEX rules. Deterministic and deliberately conservative: an inflection is GENERATED from the
// entry's own fields (plural, feminine, verb_forms, separable) plus the regular German paradigms,
// never guessed by stripping a token, so „Anrufer" is known only because the entry says so.
//
// What a lemma licenses (rule-smith 2026-09-27, BLUEPRINT §9.1 LEX-01/LEX-03):
//   VERB  present (all persons; the 2sg/3sg stem change from verb_forms), imperative (incl. hilf/lies),
//         Präteritum (verb_forms.praet, else the strong-verb table of strong-verbs.mjs and the regular
//         weak forms), Konjunktiv II (umlauted Präteritum:
//         käme, hätte, könnte, würde …, every person ending), Partizip II (verb_forms.perfekt, else ge…t)
//         incl. its adjective endings, Partizip I (+d), zu-infinitive; a separable verb also with its
//         prefix split off („kommt … mit") and rejoined in a subordinate clause („stattfindet", „ankam").
//   NOUN  singular + case endings, the plural field (+n in the dative), the feminine pair (+nen).
//   ADJ/ADV  the six adjective endings on the positive, comparative (-er, umlauted where the adjective
//         umlauts: älter, kürzer) and superlative (-st/-est), the irregulars (gut/besser/best, viel/mehr/meist,
//         gern/lieber/liebst, hoch/höher/höchst, nah/näher/nächst), -el/-er stems (dunkle, teure).
// Number words (cardinals 0–999 999 in their spelled forms, ordinals with every ending, -ens adverbs)
// and the closed core list of `core-lexicon.mjs` are known from A1.1 on.
// Proper names (SCHEMA §4.9, `registries/names.json`) are known from their `level` on, each with its
// genitive -s and adjectival -er form (Leipzigs, Leipziger, Cospudener); an adjective inside a
// multi-word name also takes its endings (die Sächsische Schweiz → in der Sächsischen Schweiz).

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokens, FUNCTION_WORDS } from './text.mjs';
import { LEVELS, positionOf, parseUnitId, unitPosition } from './ids.mjs';
import { CORE_FIXED, CORE_ENTRIES, NUMBER_WORDS } from './core-lexicon.mjs';
import { strongPraet } from './strong-verbs.mjs';

const lc = (s) => String(s ?? '').toLowerCase().trim();
const words = (s) => lc(s).split(/\s+/).filter(Boolean);
const arr = (x) => (Array.isArray(x) ? x : []);
/** Separable particles that are known words on their own (they stand alone at the clause end). */
const PARTICLES = ['zurück', 'zusammen', 'weiter', 'vorbei', 'kennen', 'statt', 'fest', 'fern', 'teil', 'weg', 'los', 'vor', 'nach', 'mit', 'ein', 'aus', 'auf', 'an', 'ab', 'zu', 'her', 'hin', 'um', 'durch', 'bei'];
/** Prefixes recognised on a separable entry whose 3sg does not show the split (longest first). */
const SEPARABLE_PREFIXES = ['zurück', 'zusammen', 'weiter', 'vorbei', 'kennen', 'statt', 'fest', 'fern', 'teil', 'weg', 'los', 'vor', 'nach', 'mit', 'ein', 'aus', 'auf', 'an', 'ab', 'zu', 'her', 'hin', 'um', 'durch', 'bei', 'dar', 'fort', 'heraus', 'herein', 'hinaus', 'hinein', 'herunter', 'hinunter', 'hoch', 'nieder', 'wieder', 'entgegen', 'gegenüber', 'bereit', 'frei', 'klar', 'richtig', 'schief', 'sauber', 'übrig', 'voran', 'voraus'].sort((a, b) => b.length - a.length);
const INSEPARABLE_RE = /^(?:be|ver|er|ent|emp|zer|miss|ge)/;
const ADJ_ENDINGS = ['', 'e', 'en', 'er', 'es', 'em'];

/** Words of a German text a learner reads, lower-cased (numbers dropped). */
export const readTokens = (text) => tokens(text).filter((t) => !/^\d/.test(t.text));

/** Umlaut the last a/o/u (au → äu) of a stem: kam → käm, hatt → hätt, wurd → würd. */
export function umlaut(stem) {
  const s = String(stem);
  const au = s.lastIndexOf('au');
  const m = [...s.matchAll(/[aou]/g)].pop();
  if (!m) return s;
  if (au >= 0 && au === m.index - 1 && s[m.index] === 'u') return `${s.slice(0, au)}äu${s.slice(au + 2)}`;
  const map = { a: 'ä', o: 'ö', u: 'ü' };
  return `${s.slice(0, m.index)}${map[m[0]]}${s.slice(m.index + 1)}`;
}

const withEndings = (add, stem, endings = ADJ_ENDINGS) => { for (const e of endings) add(`${stem}${e}`); };

/** Adjectives that umlaut in the comparative/superlative (closed, Duden list of the common ones). */
const UMLAUT_COMPARISON = new Set(['alt', 'arm', 'dumm', 'grob', 'groß', 'gesund', 'hart', 'jung', 'kalt', 'klug', 'krank', 'kurz', 'lang', 'nass', 'oft', 'rot', 'scharf', 'schmal', 'schwach', 'schwarz', 'stark', 'warm']);
const IRREGULAR_COMPARISON = {
  gut: ['besser', 'best'], viel: ['mehr', 'meist'], gern: ['lieber', 'liebst'], gerne: ['lieber', 'liebst'],
  hoch: ['höher', 'höchst', 'hoh'], nah: ['näher', 'nächst'], groß: ['größer', 'größt'], bald: ['eher', 'ehest'],
};

function adjectiveForms(lemma, add) {
  const w = lemma;
  withEndings(add, w);
  // -el/-er/-en stems drop their e before an ending: dunkel → dunkle, teuer → teure, trocken → trockne
  const syncope = /[^aeiouäöü](?:el|er)$/.test(w) || /euer$/.test(w) ? `${w.slice(0, -2)}${w.slice(-1)}` : null;
  if (syncope) for (const e of ['e', 'en', 'er', 'es', 'em']) add(`${syncope}${e}`);
  if (w.endsWith('e')) for (const e of ['n', 'r', 's', 'm']) add(`${w}${e}`);
  const irr = IRREGULAR_COMPARISON[w];
  const comp = irr ? [irr[0]] : [syncope ? `${syncope}er` : w.endsWith('e') ? `${w}r` : `${w}er`];
  const sup = irr ? [irr[1]] : [/(?:[dtsßzx]|sch)$/.test(w) && !/(?:end|isch)$/.test(w) ? `${w}est` : `${w}st`];
  if (!irr && UMLAUT_COMPARISON.has(w)) {
    const u = umlaut(w);
    comp.push(`${u}er`);
    sup.push(/(?:[dtsßz]|sch)$/.test(w) ? `${u}est` : `${u}st`);
  }
  if (irr && irr[2]) withEndings(add, irr[2]); // hohe, hohen …
  for (const c of comp) withEndings(add, c);
  for (const s of sup) withEndings(add, s);
  // „am schnellsten"
  for (const s of sup) add(`${s}en`);
}

/**
 * The finite and non-finite forms of a verb entry, added through `add`; returns its separable prefix (or null).
 */
function verbForms(e, add) {
  const lemma = lc(e.lemma);
  const inf = lemma.replace(/^sich\s+/, '').split(/\s+/).pop();
  const third = words(e.verb_forms?.['3sg']);
  let prefix = null;
  if (e.separable) {
    prefix = third.length >= 2 ? third[third.length - 1] : SEPARABLE_PREFIXES.find((p) => inf.startsWith(p) && inf.length > p.length + 2) || null;
  }
  const base = prefix && inf.startsWith(prefix) ? inf.slice(prefix.length) : inf;
  const stem = base.replace(/(?:en|n)$/, '');
  const e2 = /[dt]$|[^aeiouäöülrh][mn]$/.test(stem) ? 'e' : '';
  const finite = new Set();
  const fin = (w) => { if (w) { finite.add(w); add(w); } };
  // present, imperative, infinitive
  for (const w of [`${stem}e`, `${stem}${e2}st`, `${stem}${e2}t`, `${stem}en`, stem, `${stem}n`]) fin(w);
  if (/el$/.test(stem)) fin(`${stem.slice(0, -2)}le`); // sammle
  add(base);
  const third0 = third[0];
  if (third0) {
    fin(third0);
    const du = lc(words(e.verb_forms?.['2sg'])[0]) || (third0.endsWith('st') ? third0 : third0.endsWith('t') ? `${third0.slice(0, -1)}st` : null);
    fin(du);
    // imperative singular of an e → i/ie verb: hilft → hilf, liest → lies, nimmt → nimm, isst → iss
    const fstem = third0.replace(/t$/, '');
    if (fstem !== stem && /i/.test(fstem) && /e/.test(stem) && !/[äöü]/.test(fstem)) fin(fstem);
  }
  const w2 = words(e.verb_forms?.['2sg']);
  if (w2[0]) fin(w2[0]);
  // Präteritum (the finite word of verb_forms.praet: „kam mit" → kam, „meldete sich" → meldete)
  const own = words(e.verb_forms?.praet)[0] || null;
  const praet = own || strongPraet(base);
  let pRoot = null;
  if (praet) {
    if (praet.endsWith('te')) {
      pRoot = praet.slice(0, -1);
      for (const w of [praet, `${praet}st`, `${praet}n`, `${praet}t`]) fin(w);
    } else {
      pRoot = praet.endsWith('e') ? praet.slice(0, -1) : praet; // wurde → wurd
      for (const w of [praet, `${pRoot}st`, `${pRoot}est`, `${pRoot}en`, `${pRoot}t`, `${pRoot}et`]) fin(w);
    }
  }
  if (!own) {
    // the regular weak Präteritum when the entry does not say otherwise (also beside a table match:
    // a weak verb that ends in a strong simplex, beantragen, keeps its beantragte)
    const weak = `${stem}${e2}t`;
    if (!pRoot) pRoot = weak;
    for (const w of [`${weak}e`, `${weak}en`, `${weak}est`, `${weak}et`]) fin(w);
  }
  // Konjunktiv II: the Präteritum root, umlauted for strong and mixed verbs (käme, hätte, könnte, würde)
  if (praet) {
    const weak = praet.endsWith('te');
    const roots = new Set([pRoot]);
    // a regular weak verb keeps its Präteritum (sagte); strong, mixed and modal verbs umlaut (hätte, könnte, brächte)
    if (!weak || pRoot !== `${stem}${e2}t`) roots.add(umlaut(pRoot));
    for (const r of roots) for (const en of ['e', 'est', 'st', 'en', 'et', 't']) fin(`${r}${en}`);
  }
  // Partizip II (+ adjective endings: „die geplante Reise"), Partizip I (+d)
  const perf = words(e.verb_forms?.perfekt);
  const p2 = perf.length ? perf[perf.length - 1] : (/ieren$/.test(base) || INSEPARABLE_RE.test(base) ? `${prefix || ''}${stem}${e2}t` : `${prefix || ''}ge${stem}${e2}t`);
  withEndings(add, p2);
  withEndings(add, `${base}d`);
  if (prefix) {
    withEndings(add, `${prefix}${base}d`);
    add(inf);
    add(`${prefix}zu${base}`);
    // subordinate clause: the prefix rejoins every finite form (stattfindet, ankam, mitkäme)
    for (const f of finite) add(`${prefix}${f}`);
  }
  return prefix;
}

/**
 * Surface forms of one entry. Returns { forms: Set, prefix: string|null } — `prefix` is the
 * separable prefix whose finite forms appear split („richtet … aus").
 */
export function entryForms(e) {
  const forms = new Set();
  let prefix = null;
  const lemma = lc(e?.lemma);
  if (!lemma) return { forms, prefix };
  const add = (w) => { if (w) forms.add(lc(w)); };
  const pos = e.pos;
  if (pos === 'VERB') {
    prefix = verbForms(e, add);
  } else if (pos === 'NOUN') {
    const w = lemma.replace(/^(der|die|das)\s+/, '');
    add(w);
    for (const suf of ['s', 'es', 'n', 'en', 'e', 'er']) add(`${w}${suf}`);
    if (w.endsWith('e')) add(`${w}r`); // nominalised adjective: ein Beschäftigter
    // the plural and every further correct plural (SCHEMA §6 pluralVariants, 2026-09-28: „Balkons")
    for (const p of [e.plural, ...(Array.isArray(e.pluralVariants) ? e.pluralVariants : [])]) {
      if (typeof p !== 'string') continue;
      const pl = lc(p).replace(/^die\s+/, '');
      add(pl);
      if (!/[ns]$/.test(pl)) add(`${pl}n`);
    }
    if (typeof e.feminine === 'string') {
      const f = lc(e.feminine).replace(/^die\s+/, '');
      add(f);
      add(`${f}nen`);
    }
  } else if (pos === 'ADJ' || pos === 'ADV') {
    adjectiveForms(lemma, add);
  } else {
    for (const t of lemma.split(/\s+/)) {
      add(t.replace(/[^a-zäöüß-]/g, ''));
      // an apostrophe phrase contributes its parts: „Wie geht’s?" → gehts, geht (review a1.1-u03 r1 F01 /
      // r2 F09 / r3 F10 — LEX-01 read „geht" as lx.gehen, a1.1-u07, on the phrase's own screens)
      const parts = t.split(/['’‘`´]/).map((x) => x.replace(/[^a-zäöüß-]/g, ''));
      if (parts.length > 1) for (const x of parts) if (x.length > 1) add(x);
    }
  }
  return { forms, prefix };
}

/** Add an entry's forms to a known set; a separable verb's particle is known with it („kommt … mit"). */
function addEntry(set, e) {
  const { forms, prefix } = entryForms(e);
  for (const f of forms) set.add(f);
  if (prefix) set.add(prefix);
}

let coreCache = null;
/**
 * The always-known floor: FUNCTION_WORDS, the separable particles and the number words (`always`),
 * plus the core lemmas of core-lexicon.mjs with their forms (`lemmas`: [{ key, forms }]).
 */
export function coreForms() {
  if (coreCache) return coreCache;
  const always = new Set([...FUNCTION_WORDS, ...PARTICLES, ...NUMBER_WORDS]);
  const lemmas = CORE_FIXED.map((x) => ({ key: lc(x.lemma), forms: x.forms.map(lc) }));
  for (const e of CORE_ENTRIES) {
    const s = new Set();
    addEntry(s, e);
    lemmas.push({ key: lc(e.lemma).replace(/^(der|die|das)\s+/, ''), forms: [...s] });
  }
  coreCache = { always, lemmas };
  return coreCache;
}

const allocCache = new WeakMap();
/** bare lemma (lower-case) → the earliest course position any lexicon allocates it to. */
function allocatedAt(ctx) {
  if (allocCache.has(ctx)) return allocCache.get(ctx);
  const m = new Map();
  for (const l of LEVELS) {
    for (const e of ctx.levels.get(l)?.lexicon?.entries || []) {
      const u = parseUnitId(e?.unit);
      const p = u ? positionOf(u.level, u.nr) : null;
      if (p === null) continue;
      const k = lc(e?.lemma).replace(/^(der|die|das)\s+/, '');
      if (!m.has(k) || m.get(k) > p) m.set(k, p);
    }
  }
  allocCache.set(ctx, m);
  return m;
}

/**
 * The surface forms of one proper name ({ form }): every token of the name, its genitive -s and its
 * adjectival -er form (Leipzig → Leipzigs, Leipziger; Cospuden → Cospudener). In a multi-word name a
 * token ending in -e is an adjective and takes its endings (Sächsische → Sächsischen). Irregular
 * derivations (München → Münchner) are names of their own. Returns [{ base, forms }] per token.
 */
export function nameForms(name) {
  const toks = readTokens(name?.form).map((t) => t.lower);
  return toks.map((base) => {
    const forms = new Set([base, `${base}s`, `${base}er`]);
    if (toks.length > 1 && /[^aeiouäöü]e$/.test(base)) for (const e of ['n', 'r', 's', 'm']) forms.add(`${base}${e}`);
    return { base, forms: [...forms] };
  });
}

const namesCache = new WeakMap();
/**
 * The proper-name registry (SCHEMA §4.9): `ctx.registries.names` when a loader supplies it (an array
 * or the file's object), else `registries/names.json` under the content root. [] when there is none.
 */
export function namesOf(ctx) {
  if (!ctx || typeof ctx !== 'object') return [];
  if (namesCache.has(ctx)) return namesCache.get(ctx);
  let data = ctx.registries?.names ?? null;
  if (data === null && ctx.root) {
    const file = join(ctx.root, 'registries', 'names.json');
    try {
      data = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
    } catch {
      data = null; // a broken file is the checker's finding (SCH-01), not a crash here
    }
  }
  const list = arr(Array.isArray(data) ? data : data?.names).filter((n) => n && typeof n.form === 'string' && LEVELS.includes(n.level));
  namesCache.set(ctx, list);
  return list;
}

/**
 * The known-token set at a course position: function words, particles, number words; the core list
 * (except a lemma some lexicon allocates to a LATER unit — the lexicon outranks the core); lexicon
 * entries of every earlier level and of this level's units ≤ nr, every inflected form; cast names, origins and languages;
 * the proper names of registries/names.json whose level is ≤ this level (again except a token some
 * lexicon allocates to a later unit: „Schweiz" is taught at a1.1-u12, the name list cannot bring it forward).
 */
export function knownForms(ctx, level, nr) {
  const { always, lemmas } = coreForms();
  const known = new Set(always);
  const here = positionOf(level, nr);
  const alloc = allocatedAt(ctx);
  for (const { key, forms } of lemmas) {
    const at = alloc.get(key);
    if (at !== undefined && here !== null && at > here) continue;
    for (const f of forms) known.add(f);
  }
  for (const l of LEVELS.slice(0, LEVELS.indexOf(level) + 1)) {
    for (const e of ctx.levels.get(l)?.lexicon?.entries || []) {
      const u = parseUnitId(e?.unit);
      const p = u ? positionOf(u.level, u.nr) : null;
      if (p !== null && here !== null && p > here) continue;
      addEntry(known, e);
    }
  }
  for (const [, { member }] of ctx.registries.casts?.members || []) {
    // name, origin and the member's own languages (review a1.1-u01 r2 F08, u02 r2 F07 / r3 F06, u05 r3 F02:
    // „Ich spreche Malayalam, Englisch und ein bisschen Deutsch." is Priya's line, not an unknown lemma)
    for (const t of readTokens(`${member?.name || ''} ${member?.from || ''} ${arr(member?.languages).join(' ')}`)) known.add(t.lower);
    // a cast member's name also in the genitive: „Priyas Praktikum", „Arjuns WG"
    for (const t of readTokens(member?.name || '')) known.add(`${t.lower}s`);
  }
  const rank = LEVELS.indexOf(level);
  for (const name of namesOf(ctx)) {
    if (LEVELS.indexOf(name.level) > rank) continue;
    for (const { base, forms } of nameForms(name)) {
      const at = alloc.get(base);
      if (at !== undefined && here !== null && at > here) continue;
      for (const f of forms) known.add(f);
    }
  }
  return known;
}

/** The tokens of a spine label's examples: what follows its first colon and what stands in brackets. */
function labelExamples(label) {
  const s = String(label || '');
  const parts = [];
  const colon = s.indexOf(':');
  if (colon >= 0) parts.push(s.slice(colon + 1));
  for (const m of s.matchAll(/\(([^)]*)\)/g)) parts.push(m[1]);
  return parts.join(' ');
}

/**
 * Forms LICENSED at a unit by the grammar it teaches (BLUEPRINT §9.1): the example forms of every
 * spine point the unit names (spec.grammar new/chunk/review) and of every spine point introduced
 * (receptively, productively or as a chunk) at or before the unit — the spine label's examples and
 * the point's rule cards (model sentence, paradigm table below its header row, caseMarks tokens).
 * The explanatory prose of a card is metalanguage and licenses nothing, and a form of a lemma some
 * lexicon allocates to a later unit is not licensed before that unit.
 * Returns { forms: Set, points: [ids] }.
 */
export function licensedForms(ctx, unitData) {
  const forms = new Set();
  const spine = ctx.registries.spine?.byId;
  const ids = new Set();
  const g = unitData?.spec?.grammar || {};
  for (const k of ['new', 'chunk', 'review']) for (const p of arr(g[k])) ids.add(p);
  const here = unitPosition(unitData?.id);
  if (spine && here !== null) {
    for (const [pid, { point }] of spine) {
      const pos = [point?.intro?.receptive, point?.intro?.productive, point?.chunkFrom].map(unitPosition).filter((x) => x !== null);
      if (pos.length && Math.min(...pos) <= here) ids.add(pid);
    }
  }
  const cards = [];
  for (const slot of ctx.levels.values()) for (const c of arr(slot.ruleCards?.cards)) cards.push(c);
  // the lexicon outranks a card, as it outranks the core: a word some lexicon allocates to a later unit
  // („Montag" on an A1.1-U1 Präsens card, allocated to U7) is not licensed before that unit
  const later = new Set();
  if (here !== null) {
    const alloc = allocatedAt(ctx);
    for (const l of LEVELS) {
      for (const e of ctx.levels.get(l)?.lexicon?.entries || []) {
        const at = alloc.get(lc(e?.lemma).replace(/^(der|die|das)\s+/, ''));
        if (at !== undefined && at > here) for (const f of entryForms(e).forms) later.add(f);
      }
    }
  }
  const add = (text) => { for (const t of readTokens(text)) if (!later.has(t.lower)) forms.add(t.lower); };
  for (const pid of ids) {
    const point = spine?.get(pid)?.point;
    if (point) add(labelExamples(point.label));
    const cardIds = new Set(arr(point?.ruleCards));
    for (const c of cards) {
      if (!c || (c.spine !== pid && !cardIds.has(c.id))) continue;
      add(c.modelSentence);
      arr(c.table).slice(1).forEach((row) => arr(row).forEach((cell) => add(cell)));
      arr(c.caseMarks).forEach((m) => add(m?.token));
    }
  }
  return { forms, points: [...ids] };
}

/** Is this token known? A one-letter token is an option key or a list label („c", „X"), never a lemma. */
export const isKnown = (lower, known) => lower.length === 1 || known.has(lower);

/**
 * Is the cumulative lexicon complete up to (level, nr)? Every earlier level has a lexicon, and
 * this level's lexicon allocates entries to every unit 1..nr.
 */
export function lexiconComplete(ctx, level, nr) {
  const idx = LEVELS.indexOf(level);
  for (const l of LEVELS.slice(0, idx)) if (!ctx.levels.get(l)?.lexicon) return { complete: false, why: `no lexicon for ${l}` };
  const lx = ctx.levels.get(level)?.lexicon;
  if (!lx) return { complete: false, why: `no lexicon for ${level}` };
  const units = new Set(lx.entries.map((e) => parseUnitId(e?.unit)?.nr).filter(Boolean));
  for (let u = 1; u <= nr; u += 1) if (!units.has(u)) return { complete: false, why: `${level} lexicon has no entries for unit ${u}` };
  return { complete: true, why: null };
}

/**
 * Occurrences of an entry in a text (token matches; a split separable form counts once when its
 * prefix stands later in the same sentence; a noun also counts as the head of a compound).
 */
export function countOccurrences(entry, text, cache = new Map()) {
  if (!cache.has(entry.id)) cache.set(entry.id, entryForms(entry));
  const { forms, prefix } = cache.get(entry.id);
  // a compound exposes its head noun: „Teambesprechung" counts for „Besprechung"
  const heads = entry.pos === 'NOUN' ? [...forms].filter((f) => f.length >= 4) : [];
  let n = 0;
  const sents = String(text || '').split(/(?<=[.!?…\n])\s+/);
  for (const s of sents) {
    const raw = readTokens(s);
    const toks = raw.map((t) => t.lower);
    for (let i = 0; i < toks.length; i += 1) {
      const w = toks[i];
      if (!forms.has(w)) {
        if (heads.length && /^[A-ZÄÖÜ]/.test(raw[i].text) && heads.some((h) => w.length - h.length >= 3 && w.endsWith(h))) n += 1;
        continue;
      }
      if (prefix && !w.startsWith(prefix) && !w.includes(`${prefix}zu`)) {
        // a finite form without its prefix: only the separable verb when the prefix follows
        if (!toks.slice(i + 1).includes(prefix)) continue;
      }
      n += 1;
    }
  }
  return n;
}
