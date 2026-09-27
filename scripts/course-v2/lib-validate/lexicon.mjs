// Lexicon helpers (SCHEMA §6): the surface forms of an entry, and token ↔ lemma matching for the
// LEX rules. Deterministic and deliberately conservative: an inflection is generated from the
// entry's own fields (plural, feminine, verb_forms) plus regular endings, never guessed from a
// stem prefix, so „Anrufer" never counts as „Anruf".

import { tokens, FUNCTION_WORDS } from './text.mjs';
import { LEVELS, positionOf, parseUnitId } from './ids.mjs';

const lc = (s) => String(s ?? '').toLowerCase().trim();
const lastWord = (s) => lc(s).split(/\s+/).filter(Boolean).pop() || '';
const SEPARABLE_PREFIXES = ['zurück', 'zusammen', 'weiter', 'vorbei', 'kennen', 'statt', 'fest', 'fern', 'teil', 'weg', 'los', 'vor', 'nach', 'mit', 'ein', 'aus', 'auf', 'an', 'ab', 'zu', 'her', 'hin', 'um', 'durch', 'bei'];

/** Words of a German text a learner reads, lower-cased (numbers dropped). */
export const readTokens = (text) => tokens(text).filter((t) => !/^\d/.test(t.text));

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
    const inf = lemma.replace(/^sich\s+/, '').split(/\s+/).pop();
    const third = lc(e.verb_forms?.['3sg']).split(/\s+/).filter(Boolean);
    if (e.separable) {
      prefix = third.length >= 2 ? third[third.length - 1] : SEPARABLE_PREFIXES.find((p) => inf.startsWith(p) && inf.length > p.length + 2) || null;
    }
    const base = prefix && inf.startsWith(prefix) ? inf.slice(prefix.length) : inf;
    const stem = base.replace(/(?:en|n)$/, '');
    const e2 = /[dt]$|[^aeiouäöülrh][mn]$/.test(stem) ? 'e' : '';
    for (const w of [base, `${stem}e`, `${stem}${e2}st`, `${stem}${e2}t`, `${stem}en`, stem, `${stem}n`]) add(w);
    if (prefix) {
      add(inf);
      add(`${prefix}zu${base}`);
    }
    if (third.length) {
      const fin = third[0];
      add(fin);
      if (fin.endsWith('t')) add(`${fin.slice(0, -1)}st`); // fährt → fährst, nimmt → nimmst
    }
    const perf = lc(e.verb_forms?.perfekt).split(/\s+/).filter(Boolean);
    if (perf.length) add(perf[perf.length - 1]);
    const praet = lastWord(e.verb_forms?.praet);
    if (praet) {
      const b = praet;
      for (const w of b.endsWith('te') ? [b, `${b}st`, `${b}n`, `${b}t`] : [b, `${b}st`, `${b}en`, `${b}t`]) add(w);
    }
    // regular weak Präteritum and participle, when the entry does not say otherwise
    if (!praet) for (const w of [`${stem}${e2}te`, `${stem}${e2}ten`, `${stem}${e2}test`]) add(w);
    if (!perf.length && !/^(?:be|ver|er|ent|zer|emp|miss|ge)/.test(base)) add(`ge${stem}${e2}t`);
    if (!perf.length && /ieren$/.test(base)) add(`${stem}t`);
  } else if (pos === 'NOUN') {
    const w = lemma.replace(/^(der|die|das)\s+/, '');
    add(w);
    for (const suf of ['s', 'es', 'n', 'en', 'e', 'er']) add(`${w}${suf}`);
    if (typeof e.plural === 'string') {
      const pl = lc(e.plural).replace(/^die\s+/, '');
      add(pl);
      add(`${pl}n`);
    }
    if (typeof e.feminine === 'string') {
      const f = lc(e.feminine).replace(/^die\s+/, '');
      add(f);
      add(`${f}nen`);
    }
  } else if (pos === 'ADJ' || pos === 'ADV') {
    const w = lemma;
    add(w);
    for (const suf of ['e', 'en', 'er', 'es', 'em', 'ere', 'eren', 'erer', 'eres', 'erem', 'ste', 'sten', 'ster', 'stes', 'stem', 'este', 'esten']) add(`${w}${suf}`);
    if (w.endsWith('e')) for (const suf of ['n', 'r', 's', 'm']) add(`${w}${suf}`);
  } else {
    for (const t of lemma.split(/\s+/)) add(t);
  }
  return { forms, prefix };
}

/**
 * The known-token set at a course position: lexicon entries of every earlier level and of this
 * level's units ≤ nr, function words, cast names and the separable prefixes.
 */
export function knownForms(ctx, level, nr) {
  const known = new Set(FUNCTION_WORDS);
  for (const p of SEPARABLE_PREFIXES) known.add(p);
  const here = positionOf(level, nr);
  for (const l of LEVELS.slice(0, LEVELS.indexOf(level) + 1)) {
    for (const e of ctx.levels.get(l)?.lexicon?.entries || []) {
      const u = parseUnitId(e?.unit);
      const p = u ? positionOf(u.level, u.nr) : null;
      if (p !== null && here !== null && p > here) continue;
      for (const f of entryForms(e).forms) known.add(f);
    }
  }
  for (const [, { member }] of ctx.registries.casts?.members || []) {
    for (const t of readTokens(`${member?.name || ''} ${member?.from || ''}`)) known.add(t.lower);
  }
  return known;
}

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
