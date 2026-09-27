// Construction detectors (BLUEPRINT §9.3, GRM-04) — the engine that runs
// `content/course-v2/registries/detectors.json`.
//
// A detector answers one question about one sentence: "is construction X used here?". It never
// knows WHEN X is taught — that is read from the grammar spine (`points[].detectors` + `intro`),
// the rule `src/data/curricula/constructions.js` established: the introducing unit is never typed
// into a detector, so moving a spine point moves the guard with it.
//
// Precision is declared per detector and honoured per hit:
//   exact      — deterministic and (measured on its own examples) free of false positives;
//                GRM-04 blocks on it.
//   heuristic  — shape-based; routes to review (advisory).
//   advisory   — known to be noisy; advisory only.
// A lexicon-driven detector that has to fall back to word shape (the lexicon does not know the
// form) marks that hit `fallback: true` and it is treated as heuristic.
//
// Methods (the `method` field) and their `spec`:
//   token    tokens[] | phrases[] (lower-case), clauseInitial?, requireVerbFinal?, notQuestion?,
//            notPrecededBy[]?, notFollowedBy[]?, followedByCapital?, caseSensitive?
//   pattern  regex, flags?, group?, skip? (regex on the match), skipSentence?, requireVerbFinal?, notQuestion?
//   clause   kind: pair | subordinate | relative | aux-final | imperative (see the functions below)
//   lexicon  kind: participle-aux | praeteritum | reflexive | zu-infinitive | n-declension | stem-vowel-change
// Every spec may carry whitelist[] (lower-case phrases inside which hits are ignored) and
// examples { hit[], miss[], lexicon[]? } which the test suite runs.

import { tokens, sentences, clauses, endsVerbFinal, isQuestion, FUNCTION_WORDS, AUX_MODAL_FORMS } from './text.mjs';

const arr = (x) => (Array.isArray(x) ? x : []);
const lc = (s) => String(s ?? '').toLowerCase();

// ── lexicon environment ───────────────────────────────────────────────────────────────────

/**
 * What the lexicon-driven detectors need, derived from lexicon entries (SCHEMA §6). With no
 * entries, `available` is false and every lexicon detector runs on its shape fallback only.
 */
export function buildLexEnv(entries = []) {
  const env = {
    available: false,
    participles: new Map(), // participle → { aux: 'hat'|'ist', lemma }
    praet: new Set(),
    infinitives: new Set(),
    zuInfix: new Set(),
    reflexiveStems: new Map(), // stem → 'akk'|'dat'
    verbStems: new Set(),
    weakNouns: new Set(),
    vowelChange: new Set(), // 2sg/3sg present forms whose stem vowel differs from the infinitive's
    adjectives: new Set(), // ADJ lemmas: a participle with its own ADJ entry („beschädigt") is predicative after sein
  };
  for (const e of arr(entries)) {
    if (!e || typeof e !== 'object') continue;
    const lemma = lc(e.lemma).trim();
    if (!lemma) continue;
    env.available = true;
    if (e.pos === 'VERB') {
      const inf = lemma.replace(/^sich\s+/, '').split(/\s+/).pop();
      env.infinitives.add(inf);
      const stem = inf.replace(/(?:en|n)$/, '');
      env.verbStems.add(stem);
      const vf = e.verb_forms || {};
      const perfekt = lc(vf.perfekt).trim().split(/\s+/).filter(Boolean);
      if (perfekt.length >= 2) {
        const aux = perfekt[0] === 'ist' ? 'ist' : 'hat';
        env.participles.set(perfekt[perfekt.length - 1], { aux, lemma });
      }
      const praet = lc(vf.praet).trim().split(/\s+/).filter(Boolean);
      if (praet.length) env.praet.add(praet[0]);
      const third = lc(vf['3sg']).trim().split(/\s+/).filter(Boolean);
      const second = lc(vf['2sg']).trim().split(/\s+/).filter(Boolean);
      const simpleStem = inf.replace(/(?:en|n)$/, '');
      for (const f of [third[0], second[0]]) {
        if (f && stemVowelChanged(simpleStem, f)) env.vowelChange.add(f);
      }
      let prefix = null;
      if (e.separable && third.length >= 2) prefix = third[third.length - 1];
      if (prefix && inf.startsWith(prefix)) {
        env.zuInfix.add(`${prefix}zu${inf.slice(prefix.length)}`);
        env.verbStems.add(stem.slice(prefix.length));
      }
      if (e.reflexive) {
        const s = prefix && stem.startsWith(prefix) ? stem.slice(prefix.length) : stem;
        env.reflexiveStems.set(s, e.reflexive);
      }
    }
    if (e.pos === 'ADJ') env.adjectives.add(lemma);
    if (e.pos === 'NOUN' && e.article === 'der' && typeof e.plural === 'string') {
      const pl = lc(e.plural);
      if ((pl === `${lemma}n` || pl === `${lemma}en`) && /(?:e|ant|ent|ist|at|oge|graf|soph|nom)$/.test(lemma)) env.weakNouns.add(lemma);
    }
  }
  return env;
}

/** The first vowel group of a word ('sprech' → 'e', 'schlaf' → 'a', 'lies' → 'ie'). */
const firstVowel = (w) => (String(w).match(/(?:ie|ei|au|eu|äu|[aeiouäöü])/) || [])[0] || '';

/**
 * Does a finite present form carry a changed stem vowel against its infinitive stem (e → i/ie,
 * a → ä, au → äu, o → ö)? `fährt` against `fahr` yes, `macht` against `mach` no. The separable
 * prefix of a 3sg like „fährt ab" is already split off by the caller.
 */
export function stemVowelChanged(stem, form) {
  const a = firstVowel(stem.replace(/^(?:ab|an|auf|aus|ein|mit|vor|zu|zurück|weg|fern|los|nach|her|hin|um|bei|dar)(?=[^aeiouäöü]*[aeiouäöü])/, ''));
  const b = firstVowel(form.replace(/^(?:ab|an|auf|aus|ein|mit|vor|zu|zurück|weg|fern|los|nach|her|hin|um|bei|dar)(?=[^aeiouäöü]*[aeiouäöü])/, ''));
  if (!a || !b || a === b) return false;
  return (a === 'e' && (b === 'i' || b === 'ie')) || (a === 'a' && b === 'ä') || (a === 'au' && b === 'äu') || (a === 'o' && b === 'ö');
}

export const EMPTY_ENV = buildLexEnv([]);

// ── helpers ───────────────────────────────────────────────────────────────────────────────

const SUBJECT_PRONOUNS = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'man']);
const DETERMINERS = new Set(`der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner keines
mein meine meinen meinem meiner meines dein deine deinen deinem deiner deines sein seine seinen seinem seiner seines
ihr ihre ihren ihrem ihrer ihres unser unsere unseren unserem unserer unseres euer eure euren eurem eurer eures
dieser diese dieses diesen diesem jeder jede jedes jeden jedem`.split(/\s+/));
const PARTICIPLE_SHAPE = /^(?:ge[a-zäöüß]{2,}(?:t|en)|(?:ab|an|auf|aus|ein|mit|nach|vor|zu|zurück|weg|los|fest|fern|her|hin|um|durch|weiter|kennen)ge[a-zäöüß]{2,}(?:t|en)|[a-zäöüß]{3,}iert|(?:be|ver|er|ent|zer|emp|miss|über|unter|hinter)[a-zäöüß]{2,}(?:t|en))$/;
const INFINITIVE_SHAPE = /^[a-zäöüß]{3,}(?:en|ern|eln)$/;
const TRAILING_OK = new Set([...AUX_MODAL_FORMS, 'sein', 'haben', 'werden', 'worden', 'gewesen', 'geworden', 'lassen', 'können', 'müssen', 'sollen', 'wollen', 'dürfen']);

/** Char ranges of whitelisted phrases in a sentence. */
function whitelistRanges(sentence, whitelist) {
  const s = lc(sentence);
  const out = [];
  for (const phrase of arr(whitelist)) {
    const p = lc(phrase);
    if (!p) continue;
    let i = s.indexOf(p);
    while (i >= 0) {
      const before = i === 0 ? ' ' : s[i - 1];
      const after = i + p.length >= s.length ? ' ' : s[i + p.length];
      if (!/[a-zäöüß]/.test(before) && !/[a-zäöüß]/.test(after)) out.push([i, i + p.length]);
      i = s.indexOf(p, i + 1);
    }
  }
  return out;
}

const inRanges = (index, length, ranges) => ranges.some(([a, b]) => index >= a && index + length <= b);

/** Clause spans of a sentence with their char offset. */
function clauseSpans(sentence) {
  const out = [];
  let offset = 0;
  let sep = null; // the separator before the clause: ',' ';' ':' '(' … or null at the start
  const parts = String(sentence).split(/([,;:()–—]|\s-\s)/);
  for (const part of parts) {
    if (/^([,;:()–—]|\s-\s)$/.test(part)) sep = part.trim() || '-';
    else if (part.trim()) {
      const lead = part.length - part.trimStart().length;
      out.push({ text: part.trim(), start: offset + lead, sep });
    }
    offset += part.length;
  }
  return out;
}

function clauseAt(sentence, index) {
  for (const c of clauseSpans(sentence)) if (index >= c.start && index < c.start + c.text.length) return c;
  return { text: String(sentence), start: 0 };
}

const isCapitalMidSentence = (tok, i) => i > 0 && /^[A-ZÄÖÜ]/.test(tok.text);

// ── methods ───────────────────────────────────────────────────────────────────────────────

function runToken(det, sentence) {
  const spec = det.spec || {};
  const toks = tokens(sentence);
  const hits = [];
  const want = new Set(arr(spec.tokens).map((t) => (spec.caseSensitive ? t : lc(t))));
  const phrases = arr(spec.phrases).map((p) => (Array.isArray(p) ? p : String(p).split(/\s+/)).map(lc));
  for (let i = 0; i < toks.length; i += 1) {
    const t = toks[i];
    const w = spec.caseSensitive ? t.text : t.lower;
    let len = 0;
    if (want.has(w)) len = 1;
    else {
      for (const ph of phrases) {
        if (ph.every((p, k) => toks[i + k] && toks[i + k].lower === p)) {
          len = ph.length;
          break;
        }
      }
    }
    if (!len) continue;
    if (spec.notPrecededBy && i > 0 && arr(spec.notPrecededBy).map(lc).includes(toks[i - 1].lower)) continue;
    if (spec.notFollowedBy && toks[i + len] && arr(spec.notFollowedBy).map(lc).includes(toks[i + len].lower)) continue;
    if (spec.followedByCapital && !(toks[i + len] && /^[A-ZÄÖÜ]/.test(toks[i + len].text))) continue;
    if (spec.notQuestion && isQuestion(sentence)) continue;
    const clause = clauseAt(sentence, t.index);
    if (spec.clauseInitial) {
      const first = tokens(clause.text)[0];
      const firstIsConj = first && ['und', 'oder', 'aber'].includes(first.lower);
      const firstIdx = clause.start + (first ? first.index : 0);
      const second = tokens(clause.text)[1];
      const okAfterConj = firstIsConj && second && clause.start + second.index === t.index;
      if (firstIdx !== t.index && !okAfterConj) continue;
    }
    if (spec.requireVerbFinal && !endsVerbFinal(sentence.slice(t.index, clause.start + clause.text.length))) continue;
    const end = toks[i + len - 1];
    hits.push({ index: t.index, match: sentence.slice(t.index, end.index + end.text.length) });
  }
  return hits;
}

/** Leading quotation marks, brackets and blanks before a quoted sentence („Wer …, soll …“). */
const LEADING_QUOTES_RE = /^[\s„“”"»«‚‘’'(]+/u;

function runPattern(det, sentence) {
  const spec = det.spec || {};
  if (!spec.regex) return [];
  if (spec.skipSentence && new RegExp(spec.skipSentence, 'iu').test(sentence)) return [];
  if (spec.notQuestion && isQuestion(sentence)) return [];
  const re = new RegExp(spec.regex, spec.flags || 'gu');
  const flagsG = re.flags.includes('g') ? re : new RegExp(re.source, `${re.flags}g`);
  // a ^-anchored detector reads the sentence behind its opening quote (review b1.1-u04 r1 F08:
  // „„Wer ein kaputtes Gerät hat, soll …“" never reached det.relativsatz-wer)
  const offset = spec.regex.startsWith('^') ? (sentence.match(LEADING_QUOTES_RE) || [''])[0].length : 0;
  const body = sentence.slice(offset);
  const skipWords = new Set(arr(spec.skipWords).map(lc));
  const notFollowedBy = new Set(arr(spec.notFollowedBy).map(lc));
  const notPrecededBy = new Set(arr(spec.notPrecededBy).map(lc));
  const toks = notFollowedBy.size || notPrecededBy.size ? tokens(sentence) : [];
  const hits = [];
  for (const m of body.matchAll(flagsG)) {
    const g = spec.group || 0;
    const text = m[g] ?? m[0];
    const index = offset + m.index + (g ? m[0].indexOf(text) : 0);
    if (spec.skip && new RegExp(spec.skip, 'iu').test(text)) continue;
    if (spec.skipAlso && new RegExp(spec.skipAlso, 'iu').test(text)) continue;
    if (skipWords.has(lc(text))) continue;
    if (toks.length) {
      const end = offset + m.index + m[0].length;
      const next = toks.find((t) => t.index >= end);
      const prev = [...toks].reverse().find((t) => t.index + t.text.length <= index);
      if (next && notFollowedBy.has(next.lower)) continue;
      if (prev && notPrecededBy.has(prev.lower)) continue;
    }
    if (spec.requireVerbFinal) {
      const clause = clauseAt(sentence, index);
      if (!endsVerbFinal(sentence.slice(index, clause.start + clause.text.length))) continue;
    }
    hits.push({ index, match: text });
  }
  return hits;
}

/** Two-part connectors: every [first, second] pair, first before second, in one sentence. */
function clausePair(det, sentence) {
  const s = lc(sentence);
  const hits = [];
  const find = (phrase, from) => {
    const p = lc(phrase);
    const re = new RegExp(`(?<![a-zäöüß])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}(?![a-zäöüß])`, 'u');
    const m = re.exec(s.slice(from));
    return m ? from + m.index : -1;
  };
  for (const [first, second] of arr(det.spec?.pairs)) {
    const a = find(first, 0);
    if (a < 0) continue;
    const b = find(second, a + lc(first).length);
    if (b < 0) continue;
    hits.push({ index: a, match: `${sentence.slice(a, a + first.length)} … ${sentence.slice(b, b + second.length)}` });
  }
  return hits;
}

/** An ambiguous subordinator: clause-initial token, subject next, verb-final clause. */
function clauseSubordinate(det, sentence) {
  const spec = det.spec || {};
  const want = new Set(arr(spec.tokens).map(lc));
  const hits = [];
  if (spec.notQuestion && isQuestion(sentence)) return hits;
  const spans = clauseSpans(sentence);
  for (let ci = 0; ci < spans.length; ci += 1) {
    const c = spans[ci];
    if (spec.notFirstClause && ci === 0) continue;
    const toks = tokens(c.text);
    let k = 0;
    if (toks[0] && ['und', 'oder', 'aber', 'erst', 'nur', 'schon', 'gerade', 'genau'].includes(toks[0].lower) && toks.length > 1) k = 1;
    const t = toks[k];
    if (!t || !want.has(t.lower)) continue;
    const next = toks[k + 1];
    if (!next) continue;
    const subjectLike = SUBJECT_PRONOUNS.has(next.lower) || DETERMINERS.has(next.lower) || /^[A-ZÄÖÜ]/.test(next.text);
    if (spec.requireSubject !== false && !subjectLike) continue;
    if (next && arr(spec.notFollowedBy).map(lc).includes(next.lower)) continue;
    if (!endsVerbFinal(c.text.slice(t.index))) continue;
    if (toks.length - k < (spec.minTokens || 3)) continue;
    // a main clause after a fronted phrase has its finite verb inside („Während der Fahrt habe ich geschlafen")
    if (spec.noMidFinite && toks.slice(k + 1, -1).some((x) => AUX_MODAL_FORMS.has(x.lower))) continue;
    hits.push({ index: c.start + t.index, match: c.text.slice(t.index) });
  }
  return hits;
}

/** A relative clause: (comma) (preposition) d-pronoun … verb-final. */
function clauseRelative(det, sentence) {
  const spec = det.spec || {};
  const pronouns = new Set(arr(spec.pronouns).map(lc)); // after a preposition
  const bare = new Set(arr(spec.barePronouns).map(lc)); // without one
  const preps = new Set(arr(spec.prepositions).map(lc));
  const hits = [];
  const spans = clauseSpans(sentence);
  for (let ci = 0; ci < spans.length; ci += 1) {
    const c = spans[ci];
    if (ci === 0 && spec.requireComma !== false) continue; // a relative clause follows its head
    if (spec.requireComma !== false && c.sep !== ',') continue; // „…: über die Familie sprechen" is no relative clause
    const toks = tokens(c.text);
    let k = 0;
    if (toks[0] && preps.has(toks[0].lower) && toks[1] && pronouns.has(toks[1].lower)) k = 1;
    else if (!(toks[0] && bare.has(toks[0].lower))) continue;
    const t = toks[k];
    if (!t) continue;
    // „…, die Kollegin kommt" is a main clause: a pronoun directly followed by a noun is an article
    const next = toks[k + 1];
    if (next && /^[A-ZÄÖÜ]/.test(next.text) && !arr(spec.allowCapitalNext).includes(t.lower)) {
      if (!['dessen', 'deren'].includes(t.lower)) continue;
    }
    if (!endsVerbFinal(c.text)) continue;
    if (toks.length - k < 3) continue;
    // in a relative clause the finite verb is last: „was hast du gemacht?" is a question
    if (next && AUX_MODAL_FORMS.has(next.lower)) continue;
    // the head: the clause before ends in a noun (capitalised) or a pronoun like alles/das/etwas
    const prev = tokens(spans[ci - 1]?.text || '');
    const head = prev[prev.length - 1];
    const HEAD_PRONOUNS = ['alles', 'das', 'etwas', 'nichts', 'vieles', 'einzige', 'beste', 'erste', 'letzte', 'wenig', 'manches'];
    if (spec.requireNounHead !== false && head && !/^[A-ZÄÖÜ]/.test(head.text) && !HEAD_PRONOUNS.includes(head.lower)) continue;
    if (spec.requireNounHead !== false && head && (head.text === 'Sie' || SUBJECT_PRONOUNS.has(head.lower)) && !HEAD_PRONOUNS.includes(head.lower)) continue;
    hits.push({ index: c.start + (toks[0]?.index || 0), match: c.text });
  }
  return hits;
}

const isParticiple = (w, env) => env.participles.has(w) || PARTICIPLE_SHAPE.test(w);
const isInfinitive = (w, env) => (env.available && env.infinitives.has(w)) || (INFINITIVE_SHAPE.test(w) && !w.startsWith('ge'));

/**
 * Auxiliary + clause-final non-finite form. spec.aux: finite forms; spec.final:
 *   infinitive                  (Futur I: „wird … kommen")
 *   participle                  (Passiv: „wird … geprüft")
 *   participle+werden           (Passiv mit Modalverb: „muss … geprüft werden")
 *   participle+aux              (Futur II: „wird … geschlafen haben")
 *   participle+zu+aux           (Infinitiv Perfekt/Passiv: „… bestanden zu haben")
 *   infinitive+infinitive       (lassen / Doppelinfinitiv: „reparieren lassen")
 */
function clauseAuxFinal(det, sentence, env) {
  const spec = det.spec || {};
  const aux = new Set(arr(spec.aux).map(lc));
  const hits = [];
  if (spec.notQuestion && isQuestion(sentence)) return hits;
  for (const c of clauseSpans(sentence)) {
    const toks = tokens(c.text).filter((t) => !/^\d/.test(t.text));
    if (toks.length < 2) continue;
    const auxIdx = aux.size ? toks.findIndex((t) => aux.has(t.lower)) : 0;
    if (auxIdx < 0) continue;
    const words = toks.map((t) => t.lower);
    const last = words[words.length - 1];
    const prev = words[words.length - 2];
    const prev2 = words[words.length - 3];
    let ok = false;
    let fallback = false;
    const lastIsCap = /^[A-ZÄÖÜ]/.test(toks[toks.length - 1].text);
    switch (spec.final) {
      case 'infinitive': {
        const inf = (w) => isInfinitive(w, env) && !env.participles.has(w) && !PARTICIPLE_SHAPE.test(w) && !aux.has(w);
        ok = !lastIsCap && toks.length - 1 > auxIdx && !aux.has(last) && inf(last);
        let w = last;
        if (!ok && aux.has(last) && toks.length >= 3 && prev && inf(prev) && !/^[A-ZÄÖÜ]/.test(toks[toks.length - 2].text)) {
          ok = true; // subordinate order: „…, dass es morgen regnen wird"
          w = prev;
        }
        fallback = ok && !(env.available && env.infinitives.has(w));
        break;
      }
      case 'participle': {
        const part = (w) => isParticiple(w, env) && !(env.available && env.infinitives.has(w) && !env.participles.has(w));
        ok = !lastIsCap && toks.length - 1 > auxIdx && part(last);
        let w = last;
        if (!ok && aux.has(last) && toks.length >= 3 && prev && part(prev)) {
          ok = true; // subordinate order: „…, dass der Antrag geprüft wird"
          w = prev;
        }
        fallback = ok && !env.participles.has(w);
        break;
      }
      case 'participle+werden':
        ok = last === 'werden' && prev && isParticiple(prev, env);
        if (!ok && aux.has(last) && prev === 'werden' && prev2 && isParticiple(prev2, env)) ok = true; // „…, weil sie geprüft werden muss"
        fallback = ok && !env.participles.has(last === 'werden' ? prev : prev2);
        break;
      case 'participle+aux':
        ok = (last === 'haben' || last === 'sein') && prev && isParticiple(prev, env) && toks.length - 2 > auxIdx;
        fallback = ok && !env.participles.has(prev);
        break;
      case 'participle+zu+aux':
        ok = ['haben', 'sein', 'werden'].includes(last) && prev === 'zu' && prev2 && isParticiple(prev2, env);
        fallback = ok && !env.participles.has(prev2);
        break;
      case 'infinitive+infinitive':
        ok = aux.has(last) ? false : (arr(spec.finalWords).map(lc).includes(last) && prev && isInfinitive(prev, env));
        if (!ok && aux.has(last) && arr(spec.finalWords).map(lc).includes(prev) && prev2 && isInfinitive(prev2, env)) ok = true;
        fallback = ok;
        break;
      default:
        ok = false;
    }
    if (ok) hits.push({ index: c.start + toks[auxIdx].index, match: c.text.slice(toks[auxIdx].index), fallback });
  }
  return hits;
}

const NOT_IMPERATIVE = new Set(`hallo tschüss tschüs danke prima super toll schade achtung oh ach na ja nein freut
viel viele gute guten herzlich herzlichen willkommen bis alles liebe lieber hilfe stopp moment
bitte vorsicht klar genau richtig falsch okay ok los schnell weiter`.split(/\s+/));

/** Imperative: Sie-form („Gehen Sie …!") or du/ihr-form („Kauf bitte Milch!", „Beeil dich!"). */
function clauseImperative(det, sentence, env) {
  const spec = det.spec || {};
  if (isQuestion(sentence)) return [];
  let toks = tokens(sentence);
  if (toks[0] && toks[0].lower === 'bitte') toks = toks.slice(1);
  const first = toks[0];
  const second = toks[1];
  if (!first) return [];
  // „300 Gramm, bitte." opens with a number, not a verb (review a1.1-u04 r2 F11)
  if (!/^\p{L}/u.test(first.text)) return [];
  const w = first.lower;
  if (FUNCTION_WORDS.has(w) && !['sei', 'seid', 'hab', 'habt', 'werd'].includes(w)) return [];
  if (NOT_IMPERATIVE.has(w)) return [];
  if (spec.person === 'sie') {
    if (!second || second.text !== 'Sie') return [];
    if (!/(?:en|ern|eln|n)$/.test(w) && w !== 'seien') return [];
    return [{ index: first.index, match: `${first.text} Sie`, fallback: !(env.available && env.infinitives.has(w)) }];
  }
  // du / ihr
  if (second && (SUBJECT_PRONOUNS.has(second.lower) || second.text === 'Sie')) return [];
  if (/en$/.test(w) && w !== 'seien') return [];
  // „Vorname, Nachname …": a list or an address, not an imperative
  if (/^\s*[A-Za-zÄÖÜäöüß]+\s*,/.test(sentence.replace(/^\s*bitte\s*,?\s*/i, ''))) return [];
  const endsBang = /!\s*[“”"»]?\s*$/.test(sentence.trim());
  const hasBitte = /\bbitte\b/i.test(sentence);
  const reflexNext = second && ['dich', 'euch', 'mir', 'dir', 'uns', 'mich'].includes(second.lower);
  if (!endsBang && !hasBitte) return [];
  const stem = w.replace(/(?:e|t)$/, '');
  const known = env.available && (env.verbStems.has(w) || env.verbStems.has(stem));
  if (!known && !reflexNext && !hasBitte && !['sei', 'seid'].includes(w)) return [];
  return [{ index: first.index, match: first.text, fallback: !known }];
}

/**
 * Participles that, after a form of sein, are lexicalised state adjectives and never a Perfekt or a
 * Zustandspassiv: „im Preis enthalten", „das Amt ist geöffnet/geschlossen", „bin verheiratet",
 * „sind verletzt", „ist gebrochen" (orchestrator 2026-09-27; reviews a1.2-u04 r1 F27, a2.2-u04
 * r2 F16 / r3 F11). Small and closed on purpose — a participle with its own ADJ lexicon entry
 * („beschädigt", review b1.1-u04 r1 F17) is exempt through the lexicon instead.
 */
export const LEXICALISED_STATES = Object.freeze(['enthalten', 'geöffnet', 'geschlossen', 'verheiratet', 'geschieden', 'verletzt', 'gebrochen']);
const LEXICALISED_STATE_SET = new Set(LEXICALISED_STATES);
const SEIN_FORMS_RE = /^(?:bin|bist|ist|sind|seid|war|warst|waren|wart|wäre|wärst|wären|wärt)$/;
const COORDINATORS = new Set(['und', 'oder', 'aber', 'sondern']);

/**
 * A clause's tokens cut at a coordinator that opens a conjunct with its own finite auxiliary
 * („Sie ist ausgerutscht | und hat sich am Fuß verletzt"): each conjunct pairs its own auxiliary
 * with its own participle (review a2.2-u04 r2 F16). „Ich habe Brot und Käse gekauft" stays whole.
 */
function conjuncts(toks) {
  const out = [];
  let from = 0;
  for (let i = 1; i < toks.length; i += 1) {
    if (!COORDINATORS.has(toks[i].lower)) continue;
    if (!toks.slice(i + 1).some((t) => AUX_MODAL_FORMS.has(t.lower))) continue;
    out.push(toks.slice(from, i));
    from = i + 1;
  }
  out.push(toks.slice(from));
  return out.filter((x) => x.length);
}

/** Aux + participle in one clause (Perfekt, Plusquamperfekt, KII Vergangenheit, Zustandspassiv). */
function lexParticipleAux(det, sentence, env) {
  const spec = det.spec || {};
  const auxForms = new Set(arr(spec.auxForms).map(lc));
  const hits = [];
  for (const c of clauseSpans(sentence)) {
    for (const toks of conjuncts(tokens(c.text).filter((t) => !/^\d/.test(t.text)))) {
      const words = toks.map((t) => t.lower);
      const auxIdx = words.findIndex((w) => auxForms.has(w));
      if (auxIdx < 0) continue;
      for (let i = 0; i < toks.length; i += 1) {
        if (i === auxIdx) continue;
        const w = words[i];
        if (/^\p{Lu}/u.test(toks[i].text) && i > 0) continue;
        const known = env.participles.get(w);
        const shape = PARTICIPLE_SHAPE.test(w) && !env.infinitives.has(w);
        if (!known && !shape) continue;
        // the participle closes the clause (only auxiliaries/infinitives may follow it)
        if (!words.slice(i + 1).every((x) => TRAILING_OK.has(x))) continue;
        if (words[i - 1] === 'zu') continue; // „… etwas zu erzählen": a zu-infinitive, not a participle
        if (spec.requireKnown && !known) continue;
        const auxIsSein = SEIN_FORMS_RE.test(words[auxIdx]);
        // sein + a lexicalised state or an adjective of the lexicon is a predicative adjective
        if (auxIsSein && (LEXICALISED_STATE_SET.has(w) || env.adjectives.has(w))) continue;
        // which auxiliary the participle's verb takes: 'hat' or 'ist'
        let want = null;
        if (spec.participleAux === 'haben') want = 'hat';
        else if (spec.participleAux === 'sein') want = 'ist';
        else if (spec.participleAux === 'match-aux') want = /^(?:hat|hät|hab)/.test(words[auxIdx]) ? 'hat' : 'ist';
        // 'any' is a Perfekt with either auxiliary — but with ITS auxiliary: „ist … enthalten"
        // (hat enthalten) is no Perfekt (the exact det.perfekt-trennbar-untrennbar blocked it)
        else if (spec.participleAux === 'any' && known) want = auxIsSein ? 'ist' : 'hat';
        if (want && known && known.aux !== want) continue;
        // without a lexicon a sein-reading cannot be told from an adjective („ist geschlossen", „bin verheiratet")
        if ((want === 'ist' || auxIsSein) && !known && !spec.guessSein) continue;
        if (spec.shape === 'trennbar-untrennbar' && !/^(?:[a-zäöüß]+ge[a-zäöüß]+(?:t|en)|(?:be|ver|er|ent|zer|emp|miss|über|unter|hinter)[a-zäöüß]+(?:t|en)|[a-zäöüß]+iert)$/.test(w)) continue;
        if (spec.shape === 'trennbar-untrennbar' && /^ge/.test(w) && !/iert$/.test(w)) continue;
        hits.push({ index: c.start + toks[auxIdx].index, match: `${toks[auxIdx].text} … ${toks[i].text}`, fallback: !known });
        break;
      }
    }
  }
  return hits;
}

/** Präteritum of full verbs: lexicon `verb_forms.praet` ∪ the detector's closed list, every person. */
function lexPraeteritum(det, sentence, env) {
  const spec = det.spec || {};
  const exclude = new Set(arr(spec.exclude).map(lc));
  const base = new Set([...arr(spec.forms).map(lc), ...env.praet]);
  const forms = new Map();
  for (const b of base) {
    if (!b || exclude.has(b)) continue;
    const persons = b.endsWith('te') ? [b, `${b}st`, `${b}n`, `${b}t`] : [b, `${b}st`, `${b}en`, `${b}t`];
    for (const p of persons) if (!exclude.has(p)) forms.set(p, env.praet.has(b));
  }
  const hits = [];
  const toks = tokens(sentence);
  toks.forEach((t, i) => {
    if (isCapitalMidSentence(t, i)) return;
    if (forms.has(t.lower)) hits.push({ index: t.index, match: t.text, fallback: false });
  });
  return hits;
}

/**
 * Present-tense stem-vowel change in the 2nd/3rd person singular (du sprichst, er liest, sie fährt):
 * a closed list of the frequent strong verbs ∪ the lexicon's verb_forms.2sg/3sg where they differ
 * from the infinitive stem. `exclude` removes forms another spine point owns (hat, wird, weiß, the
 * modal verbs). Capitalised forms mid-sentence are nouns or names and never hit.
 */
function lexStemVowel(det, sentence, env) {
  const spec = det.spec || {};
  const exclude = new Set(arr(spec.exclude).map(lc));
  const forms = new Map();
  for (const f of arr(spec.forms).map(lc)) if (f && !exclude.has(f)) forms.set(f, false);
  for (const f of env.vowelChange) if (!exclude.has(f)) forms.set(f, false);
  const unless = spec.unlessInClause || {}; // { form: [tokens] }: „gibt" is the es-gibt chunk when „es" is in its clause
  const hits = [];
  tokens(sentence).forEach((t, i) => {
    if (isCapitalMidSentence(t, i) || !forms.has(t.lower)) return;
    const guard = arr(unless[t.lower]);
    if (guard.length) {
      const words = new Set(tokens(clauseAt(sentence, t.index).text).map((x) => x.lower));
      if (guard.some((w) => words.has(w))) return;
    }
    hits.push({ index: t.index, match: t.text, fallback: false });
  });
  return hits;
}

/** Reflexive pronoun agreeing with the subject in one clause (or `sich`, or a reflexive imperative). */
function lexReflexive(det, sentence, env) {
  const spec = det.spec || {};
  const pairs = spec.pairs || {};
  const hits = [];
  for (const c of clauseSpans(sentence)) {
    const toks = tokens(c.text);
    const words = toks.map((t) => t.lower);
    if (spec.sich) {
      const i = words.indexOf('sich');
      if (i >= 0) {
        hits.push({ index: c.start + toks[i].index, match: toks[i].text, fallback: false });
        continue;
      }
    }
    let found = false;
    for (const [subject, pronouns] of Object.entries(pairs)) {
      const s = words.indexOf(subject);
      if (s < 0) continue;
      const r = words.findIndex((w, k) => k !== s && arr(pronouns).includes(w));
      if (r < 0) continue;
      // „Ihr Name" / „ihr" as a possessive: the subject must not be followed by a noun
      if (subject === 'ihr' && toks[s + 1] && /^[A-ZÄÖÜ]/.test(toks[s + 1].text)) continue;
      if (subject === 'ihr' && toks[s].text === 'Ihr') continue;
      hits.push({ index: c.start + toks[r].index, match: `${toks[s].text} … ${toks[r].text}`, fallback: false });
      found = true;
      break;
    }
    if (found) continue;
    // imperative without a subject: „Beeil dich!", „Setz dich!", „Meldet euch!"
    const imperativePron = spec.imperativePronouns ? new Set(arr(spec.imperativePronouns)) : null;
    if (imperativePron && toks.length >= 2 && imperativePron.has(words[1]) && !SUBJECT_PRONOUNS.has(words[1])) {
      const w = words[0];
      const stem = w.replace(/(?:e|t)$/, '');
      const known = env.reflexiveStems.has(w) || env.reflexiveStems.has(stem);
      if (known) hits.push({ index: c.start + toks[0].index, match: `${toks[0].text} ${toks[1].text}`, fallback: false });
    }
  }
  return hits;
}

/** zu + infinitive at the clause end, or the -zu- infix of a separable verb. */
function lexZuInfinitive(det, sentence, env) {
  const spec = det.spec || {};
  const hits = [];
  const infixFallback = new RegExp(spec.infixRegex || '^(?:an|auf|aus|ein|mit|ab|vor|zurück|nach|weg|los|fern|kennen|statt|teil|her|hin|fest|weiter|zusammen)zu[a-zäöüß]{3,}(?:en|ern|eln)$', 'u');
  for (const c of clauseSpans(sentence)) {
    const toks = tokens(c.text).filter((t) => !/^\d/.test(t.text));
    const words = toks.map((t) => t.lower);
    for (let i = 0; i < toks.length; i += 1) {
      const w = words[i];
      const tail = words.slice(i + 1);
      const closes = tail.every((x) => TRAILING_OK.has(x));
      if (w === 'zu' && toks[i + 1] && !/^[A-ZÄÖÜ]/.test(toks[i + 1].text)) {
        const inf = words[i + 1];
        if (!words.slice(i + 2).every((x) => TRAILING_OK.has(x))) continue;
        const known = env.available && env.infinitives.has(inf);
        if (known || (INFINITIVE_SHAPE.test(inf) && !arr(spec.notInfinitive).map(lc).includes(inf))) {
          hits.push({ index: c.start + toks[i].index, match: `zu ${toks[i + 1].text}`, fallback: !known });
          break;
        }
      } else if (closes && (env.zuInfix.has(w) || infixFallback.test(w))) {
        hits.push({ index: c.start + toks[i].index, match: toks[i].text, fallback: !env.zuInfix.has(w) });
        break;
      }
    }
  }
  return hits;
}

/** n-Deklination: a weak masculine noun with -n/-en after an oblique determiner. */
function lexNDeclension(det, sentence, env) {
  const spec = det.spec || {};
  const nouns = new Set([...arr(spec.nouns).map(lc), ...env.weakNouns]);
  const dets = new Set(arr(spec.determiners).map(lc));
  const hits = [];
  const toks = tokens(sentence);
  for (let i = 1; i < toks.length; i += 1) {
    const t = toks[i];
    if (!/^[A-ZÄÖÜ]/.test(t.text)) continue;
    const w = t.lower;
    const base = w.endsWith('en') && nouns.has(w.slice(0, -2)) ? w.slice(0, -2) : w.endsWith('n') && nouns.has(w.slice(0, -1)) ? w.slice(0, -1) : null;
    if (!base) continue;
    // a determiner right before, or one adjective between
    const d1 = toks[i - 1]?.lower;
    const d2 = toks[i - 2]?.lower;
    if (dets.has(d1) || (d2 && dets.has(d2) && /(?:en|em)$/.test(d1 || ''))) {
      hits.push({ index: t.index, match: t.text, fallback: !env.weakNouns.has(base) && !arr(spec.nouns).map(lc).includes(base) });
    }
  }
  return hits;
}

const SEPARABLE_DEFAULT = ['an', 'auf', 'aus', 'ein', 'mit', 'ab', 'zu', 'los', 'weg', 'vor', 'zurück', 'nach', 'her', 'hin', 'fern', 'fest', 'weiter', 'kennen', 'statt', 'teil', 'vorbei', 'zusammen'];
const FINITE_VERB_RE = /^[a-zäöüß]{2,}(?:e|st|t|en|et)$/;
const COPULA = new Set(['bin', 'bist', 'ist', 'sind', 'seid', 'war', 'warst', 'waren', 'wart', 'wäre', 'wären']);

/**
 * Satzklammer of a separable verb (src/data/curricula/constructions.js, generalised): the clause
 * ends in a separable prefix and carries, before it, a token shaped like a finite verb that is not
 * the copula („Die Tür ist zu." is a predicate, not a clamp).
 */
function clauseSeparableBracket(det, sentence) {
  const spec = det.spec || {};
  const prefixes = new Set(arr(spec.prefixes).length ? arr(spec.prefixes).map(lc) : SEPARABLE_DEFAULT);
  const hits = [];
  for (const c of clauseSpans(sentence)) {
    const toks = tokens(c.text).filter((t) => !/^\d/.test(t.text));
    if (toks.length < 3) continue;
    const last = toks[toks.length - 1];
    if (!prefixes.has(last.lower) || /^[A-ZÄÖÜ]/.test(last.text)) continue;
    const finite = toks.slice(0, -1).some((t, i) => {
      const w = i === 0 ? t.lower : t.text;
      const low = t.lower;
      return FINITE_VERB_RE.test(w) && !FUNCTION_WORDS.has(low) && !COPULA.has(low);
    });
    if (!finite) continue;
    if (toks.slice(0, -1).some((t) => COPULA.has(t.lower)) && spec.copulaBlocks !== false) continue;
    hits.push({ index: c.start + last.index, match: c.text });
  }
  return hits;
}

const CLAUSE_KINDS = {
  'separable-bracket': clauseSeparableBracket,
  pair: clausePair,
  subordinate: clauseSubordinate,
  relative: clauseRelative,
  'aux-final': clauseAuxFinal,
  imperative: clauseImperative,
};
const LEXICON_KINDS = {
  'participle-aux': lexParticipleAux,
  praeteritum: lexPraeteritum,
  reflexive: lexReflexive,
  'zu-infinitive': lexZuInfinitive,
  'n-declension': lexNDeclension,
  'stem-vowel-change': lexStemVowel,
};

/** Is this detector definition runnable by this engine? Returns an error string or null. */
export function detectorProblem(det) {
  if (!det || typeof det !== 'object') return 'not an object';
  if (!/^det\.[a-z0-9-]+$/.test(String(det.id || ''))) return 'id must match det.<slug>';
  if (!['exact', 'heuristic', 'advisory'].includes(det.precision)) return 'precision must be exact|heuristic|advisory';
  const spec = det.spec || {};
  switch (det.method) {
    case 'token': return arr(spec.tokens).length || arr(spec.phrases).length ? null : 'token detector without tokens/phrases';
    case 'pattern':
      try {
        new RegExp(spec.regex, spec.flags || 'gu');
        return spec.regex ? null : 'pattern detector without regex';
      } catch (e) {
        return `bad regex: ${e.message}`;
      }
    case 'clause': return CLAUSE_KINDS[spec.kind] ? null : `unknown clause kind ${spec.kind}`;
    case 'lexicon': return LEXICON_KINDS[spec.kind] ? null : `unknown lexicon kind ${spec.kind}`;
    default: return `unknown method ${det.method}`;
  }
}

/**
 * Spec additions the rails apply to registry detectors until `detectors.json` carries them
 * (review-driven, 2026-09-27; each entry names its finding). Arrays are appended to the registry's,
 * scalars fill only an unset field. The registry owner folds an entry into detectors.json and deletes
 * it here; tests pin every entry's hit/miss sentences.
 */
export const DETECTOR_OVERLAYS = Object.freeze({
  // „Am Samstag arbeite ich." / „Den Bus brauche ich." / „Probleme habe ich" are 1sg indicative
  // (a2.1-u04 r1/r2 F11, a2.2-u04 r1 F09, b1.1-u04 r1 F17, b1.2-u04 r1 F26)
  'det.konjunktiv1': { notFollowedBy: ['ich'] },
  // „noch mal" (= again) and „mal wieder" are no modal particles (b1.1-u04 r1 F17)
  'det.modalpartikeln': { notPrecededBy: ['noch'], notFollowedBy: ['wieder'] },
  // a determiner or possessive after the preposition is no adjective: „für eine Wanderung",
  // „auf unser Boot" (a1.1-u04 r2 F11, a2.2-u04 r2 F16 / r3 F11)
  'det.adjektiv-endung-nullartikel': { skipWords: ['eine', 'keine', 'unser', 'euer', 'jede', 'diese', 'jene', 'welche', 'manche', 'solche', 'dieser', 'jener', 'solcher', 'mancher', 'welcher'] },
  // „ein bisschen" is a quantifier, not article + adjective (a1.1-u04 r1 F24)
  'det.adjektiv-endung-unbestimmt': { skipWords: ['bisschen'] },
  'det.unbestimmter-artikel': { skipAlso: '^(?:ein|eine)\\s+(?:bisschen|paar|wenig)\\b' },
});

const overlaid = new WeakMap();

/** The detector with its DETECTOR_OVERLAYS entry applied (the registry object is never changed). */
export function withOverlay(det) {
  const extra = det && DETECTOR_OVERLAYS[det.id];
  if (!extra) return det;
  if (overlaid.has(det)) return overlaid.get(det);
  const spec = { ...(det.spec || {}) };
  for (const [k, v] of Object.entries(extra)) {
    if (Array.isArray(v)) spec[k] = [...arr(spec[k]), ...v];
    else if (spec[k] === undefined) spec[k] = v;
  }
  const out = { ...det, spec };
  overlaid.set(det, out);
  return out;
}

/** Hits of one detector in one sentence: [{ detector, precision, index, match, fallback }]. */
export function detectInSentence(registryDet, sentence, env = EMPTY_ENV) {
  if (detectorProblem(registryDet)) return [];
  const det = withOverlay(registryDet);
  const spec = det.spec || {};
  let raw;
  if (det.method === 'token') raw = runToken(det, sentence);
  else if (det.method === 'pattern') raw = runPattern(det, sentence);
  else if (det.method === 'clause') raw = CLAUSE_KINDS[spec.kind](det, sentence, env);
  else raw = LEXICON_KINDS[spec.kind](det, sentence, env);
  const ranges = whitelistRanges(sentence, spec.whitelist);
  return raw
    .filter((h) => !inRanges(h.index, Math.max(1, String(h.match).split(' … ')[0].length), ranges))
    .map((h) => ({
      detector: det.id,
      precision: h.fallback && det.precision === 'exact' ? 'heuristic' : det.precision,
      index: h.index,
      match: h.match,
      fallback: Boolean(h.fallback),
    }));
}

/** Hits of one detector in a text (split into sentences). */
export function detectInText(det, text, env = EMPTY_ENV) {
  const out = [];
  for (const s of sentences(text)) for (const h of detectInSentence(det, s, env)) out.push({ ...h, sentence: s });
  return out;
}

/** Hits of every detector in a text. */
export function detectAll(detectors, text, env = EMPTY_ENV) {
  const out = [];
  for (const det of arr(detectors)) out.push(...detectInText(det, text, env));
  return out;
}

export { clauses };
