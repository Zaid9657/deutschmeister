// ITM-01 — the answer follows from the German prompt: every quality.js exclusion reason and
// repair predicate (src/data/lessonPools/quality.js), applied to the item in its compiled pool
// shape (SCHEMA §3.1), plus the v2 shape checks that make a task answerable at all.
//
// quality.js was written for the live A1.1 pool (typed gaps and MC practice). Two predicates are
// about TYPED answers and are not applied to choice items, whose options carry the answer space
// (a key visible among options is SOL-03's text-blind probe, not a deterministic rule): answer
// in prompt, negation without cue. A sentence-building item whose tiles are exactly the words of
// its answer is determined by its tiles, so the thin-cue-list reason (meta-prompt) does not apply.
// The level-scoped reasons (ordinal, month, untaught form) encode the LIVE A1.1 syllabus; the v2
// ceiling is GRM-04/LEX-03, so they are not applied. An item that answers from its block's choice
// set (zuordnen, insert, word-bank cloze: the answer is a KEY, SCHEMA §3.6) has no German answer
// form, and its promptDe is a situation or „Lücke N" whose task is the block instruction; only the
// language-of-prompt reasons apply to it (the fit of each key is SOL-02's, not a string rule).
//
// Rail extensions (rule-smith 2026-09-27; every one a class the u04 reviews found on ≥ 2 rounds or
// levels — the German prompt, not promptEn, must decide the key):
//   - a practice, Check or proof choice item whose key (or its digits) stands verbatim in the stem
//     while no distractor does gives itself away (a1.1-u04 r1 F06; input and structured-input items
//     quote their line on purpose);
//   - a cue promptEn names — „the polite form of können", „(können)", „as a word", „starts with …" —
//     stands in promptDe too (a1.2-u04 r1 F08, b2.2-u04 r1 F12);
//   - a typed gap whose key is an ordinal word says „Wort" in promptDe, accepts the digit form, or
//     carries exact: "number" (the checker then accepts „4." for „vierte") (a1.2-u04 r1 F10);
//   - a typed gap without options whose key is a noun, an adjective, or a sentence adverb at the
//     start of the sentence carries a German cue — a bracketed base form or choice, „= …", „→", the
//     first letters — because another word of the same class fits the frame (b1.1-u04 r1 F05 / r2 F01,
//     b1.2-u04 r1 F12, b2.2-u04 r1 F12, a2.1-u04 r1). A sentence adverb at the start blocks („___ habe
//     ich keine Antwort bekommen." → Trotzdem, Leider, Noch …); an open noun or adjective gap is an
//     ADVISORY — the sentence around it may decide it („Die Leitung ist ___. Bitte rufen Sie später
//     an." → besetzt, SCHEMA §15), which only a reader or the solver gate can judge;
//   - a first-letter cue with underscores shows exactly the missing letters (b2.2-u04 r1 F12);
//   - a typed gap whose key begins with a preposition has that preposition in promptDe
//     (a2.2-u04 r2 F04: „Emre wartet ___ Brücke" → „an der", „auf der", „vor der" all fit);
//   - an error_correction item names what to correct (a1.1-u04 r5 F01, the §9.4 fifth-round remedy; the
//     same class as b2.2-u04 r1 F14 / r2 F04 and a2.2-u04 r1 F05, all MAJOR). When its errorTag (or
//     errorTags[0]) is an article or case tag (gender-article, case-np, case-pp), a word-order tag
//     (v2-inv, verb-final, connector-position, satzklammer), or it has no tag, promptDe names the corrected
//     category outside the quoted sentence — „den Artikel", „die Endung", „das Pronomen" for the article
//     tags; „die Wortstellung", „die Position" for the order tags; any of these or „die Verbform" without
//     a tag — unless the item accepts its alternative corrections, each with acceptedWhy. A bare
//     „Korrigieren Sie:" admits every other correct correction (deleting the article, deleting the
//     connector for a verb-first clause) and the grader rejects it. Blocker. The SCHEMA §15 worked example
//     trips it once (a2.1-u07-ls3-p10, verb-final, „Correct the word order." only in promptEn, and
//     „Melden Sie sich bis zehn Uhr, ist …" is a correct second correction); §15.6 records it;
//   - deleting the article is a correction too (the orchestrator's addendum to r5 F01: u04 keys a deletion
//     under „Korrigieren Sie den Artikel" in ls3-p10 and ls3-r04). When the key only swaps one article
//     („eine Brot" → „ein Brot") and the article-less sentence is German by the unit's own evidence — the
//     noun is singular-only (mass) in the lexicon, is a plural form, or the unit writes the same verb +
//     bare noun elsewhere („Wir brauchen Brot und Käse.") — the deletion is accepted with acceptedWhy, or
//     the prompt asks for a category deletion cannot satisfy („die Endung"). Blocker.
//
// Third round (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c):
//   - „die Verneinung" / „die Negation" names a category for an untagged correction (a1.1-u06 r1 F01);
//   - an order-family error correction with a declarative key accepts every order ITM-09's enumerator
//     (lib-validate/orders.mjs, on the key's constituents) derives — the learner who fronts another phrase
//     is graded wrong otherwise — unless promptDe fixes the first position (a1.1-u02 r2 F01 / r3 F08).
//     Blocker. An item that carries authored `tiles` (SCHEMA §3.1) is enumerated by ITM-09 on those tiles;
//     the chunker covers the rest;
//   - promptEn restricting the answer class of a typed gap („the city", „(country)", „which language")
//     is carried by promptDe („Stadt", „(Land)", „Sprache") — another class fits the frame and is graded
//     wrong otherwise (a1.1-u01 r1 F04). Blocker;
//   - a typed gap cued by a determiner with a plural form („(der)", „(mein)", „(kein)") before a noun whose
//     plural equals its singular („Schlüssel", „Drucker") accepts the plural determiner or fixes the number
//     in promptDe; an error correction planting the article of such a noun accepts the plural article
//     (a1.1-u06 r1 F04 / r3 F04: „Olena sucht ___ Schlüssel. (der)" — „die" is German). Blocker;
//   - advisories: a gist item whose key's content words all stand in its step or input title (u06 r1 F07); an
//     input item's explanation quoting ≥ 4 consecutive words of the line that holds a later item's key
//     (u06 r2 F03); the calque „Was spricht …?" (sprechen with an interrogative „was" and no „Sprache",
//     u02 r1 F05).

import { walkItems, walkLines, walkProduction } from '../lib-validate/walk.mjs';
import { stripQuoted } from '../lib-validate/metalanguage.mjs';
import { norm, tokens } from '../lib-validate/text.mjs';
import { compiledItem, CHOICE_TYPES, arr, isObj, blocker, advisory } from '../lib-validate/helpers.mjs';
import { cumulativeLexicon } from '../lib-validate/context.mjs';
import { entryForms } from '../lib-validate/lexicon.mjs';
import { SENTENCE_ADVERBS, constituents, missingOrders, fixesFirstTile, tilesBuildKey } from '../lib-validate/orders.mjs';

const { ordinalValue } = await import('../../../src/lib/lesson/check.js');

export const id = 'ITM-01';
export const title = 'The answer follows from the German prompt (quality.js reasons + v2 task shape)';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

let Q = null;
let qError = null;
try {
  Q = await import('../../../src/data/lessonPools/quality.js');
} catch (e) {
  qError = e.message;
}

const tileWords = (item) => arr(item.tiles).flatMap((t) => tokens(t).map((x) => x.lower)).sort().join(' ');
const answerWords = (s) => tokens(s).map((x) => x.lower).sort().join(' ');
const EXACTNESS_RE = /\b(?:jede|jeder|jedes)\s+(?:Ziffer|Buchstabe|Zahl|Zeichen|Stelle)\b/i;

/** The quality.js predicates in exclusionReason's order: [reason, applies(item, compiled) → bool]. */
function predicates() {
  if (!Q) return [];
  const R = Q.REASON || {};
  const list = [];
  const add = (reason, fn) => { if (reason && typeof fn === 'function') list.push([reason, fn]); };
  add(R.ENGLISH_RESPELLING, (it, c) => {
    const all = [c.questionDe, c.answer, ...arr(c.accepted), ...arr(c.options)].join(' · ');
    return (Q.SOUNDS_LIKE_RE && Q.SOUNDS_LIKE_RE.test(c.questionDe)) || (Q.RESPELLING_RE && Q.RESPELLING_RE.test(all));
  });
  add(R.ENGLISH_PROMPT, (it, c) => Q.hasEnglish && Q.hasEnglish(c.questionDe));
  add(R.ENGLISH_ANSWER, (it, c) => Q.hasEnglish && [c.answer, ...arr(c.accepted), ...arr(c.options)].some((x) => Q.hasEnglish(x)));
  add(R.NEGATION_WITHOUT_CUE, (it, c) => !CHOICE_TYPES.has(it.type) && Q.NEGATION_ANSWER_RE && Q.NEGATION_CUE_RE
    && Q.NEGATION_ANSWER_RE.test([c.answer, ...arr(c.accepted)].join(' ')) && !Q.NEGATION_CUE_RE.test(c.questionDe));
  add(R.ANSWER_IN_PROMPT, (it, c) => !CHOICE_TYPES.has(it.type) && Q.answerInPrompt && Q.answerInPrompt(c));
  add(R.META_PROMPT, (it, c) => {
    if (it.type === 'sentence_building' && arr(it.tiles).length && tileWords(it) === answerWords(it.answer)) return false;
    return Q.isMetaPrompt && Q.isMetaPrompt(c);
  });
  add(R.VERB_CUE_ONLY_IN_GLOSS, (it, c) => Q.verbCueOnlyInGloss && Q.verbCueOnlyInGloss(c));
  add(R.STATEMENT_NO_TASK, (it, c) => Q.statementNoTask && Q.statementNoTask(c));
  add(R.ARTICLE_CUE_ONLY_IN_GLOSS, (it, c) => Q.articleCueOnlyInGloss && Q.articleCueOnlyInGloss(c));
  add(R.CUE_ANSWER_MISMATCH, (it, c) => Q.cueAnswerMismatch && Q.cueAnswerMismatch(c));
  add(R.METALINGUISTIC_PROMPT, (it, c) => Q.metalinguisticPrompt && Q.metalinguisticPrompt(c));
  add(R.AMBIGUOUS_CORRECTION, (it, c) => Q.ambiguousCorrection && Q.ambiguousCorrection(c));
  add(R.UNCONDITIONED_RULE, (it, c) => Q.unconditionedRule && Q.unconditionedRule(c));
  add(R.AMBIGUOUS_AGREEMENT, (it, c) => Q.agreementAmbiguity && Q.agreementAmbiguity(c));
  add(R.AMBIGUOUS_GENDER_PAIR, (it, c) => Q.genderPairAmbiguity && Q.genderPairAmbiguity(c, {}));
  return list;
}

const PREPOSITIONS = new Set('an am ans auf aufs aus bei beim bis durch für gegen gegenüber hinter in im ins mit nach neben ohne seit über um unter von vom vor zu zum zur zwischen trotz wegen während'.split(' '));
/** A German cue in a prompt: a bracket, „= …", an arrow, first letters („B…", „Re___"), a word-class name. */
const CUE_RE = /[(=→]|\p{L}(?:…|\.{3}|_{2,})|\b(?:Nomen|Verb|Adjektiv|Gegenteil|beginnt mit|Anfang)\b/u;
const WORD_CUE_RE = /\bWort\b|\bWörter|\bausgeschrieben|\bBuchstaben/i;
const hasWord = (text, word) => new RegExp(`(?:^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^\\p{L}])`, 'iu').test(text);

/** Lower-case form → the POS its lexicon entries give it, over the cumulative lexicon of a level. */
function posIndex(ctx, level, cache) {
  if (cache.has(level)) return cache.get(level);
  const m = new Map();
  for (const e of cumulativeLexicon(ctx, level)) {
    if (!isObj(e) || !e.pos) continue;
    for (const f of entryForms(e).forms) {
      if (!m.has(f)) m.set(f, new Set());
      m.get(f).add(e.pos);
    }
  }
  cache.set(level, m);
  return m;
}

/** The rail-extension findings of one item (see the header). */
function cueFindings(doc, item, path, where, pos) {
  const out = [];
  const id = item.id;
  const de = String(item.promptDe || '');
  const en = String(item.promptEn || '');
  const key = String(item.answer ?? '').trim();
  const accepted = [key, ...arr(item.accepted).map(String)];
  const typed = item.type === 'fill_blank' && !arr(item.options).length;
  // the key given away by the stem
  if (['pool', 'reserve', 'check', 'proof'].includes(where) && arr(item.options).length >= 3 && key) {
    const distractors = arr(item.options).map(String).filter((o) => norm(o) !== norm(key));
    const digits = (x) => x.replace(/\D+/g, '');
    const stemNumbers = new Set((de.match(/\d+(?:[.,:]\d+)*/g) || []).map(digits));
    const inStem = (x) => (digits(x).length >= 2 ? stemNumbers.has(digits(x)) : norm(x).length >= 3 && hasWord(norm(de), norm(x)));
    // a1.1-u04 r1 F06: „the digits 1,19 appear in the stem and in exactly one option" — a flyer with the
    // other prices as options is fine, the key alone copied from the stem is not
    if (inStem(key) && !distractors.some(inStem)) out.push(blocker(doc, `${path}.promptDe`, `the key „${key}" stands in the stem and no distractor does — the item answers itself`, id));
  }
  // a cue only promptEn gives
  // „the polite form of können": the RELATION is the cue — promptDe carries it as a cue (in brackets,
  // after „von/zu/aus", before an arrow, dash or colon: „der Kellner – die ___"), not merely the word in
  // its sentence („Können Sie …? Höflicher: ___")
  const relCues = [...en.matchAll(/\b(?:polite form|form|plural|past|participle|noun|verb|opposite|comparative|superlative) (?:of|from) (?:the |a |an )?["„“']?(\p{L}+)(?=["“”']?\s*(?:$|[.,;:)!?]))/giu)].map((m) => m[1]);
  // a quoted or bracketed word in promptEn only points at a word: promptDe must contain it
  const wordCues = [...en.matchAll(/\(([\p{L}-]+)\)|[„“"]([\p{L}-]+)[“”"]/gu)].map((m) => m[1] || m[2]);
  const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cued = (w) => new RegExp(`\\([^)]*${esc(w)}[^)]*\\)|(?:von|zu|aus)\\s+[„"]?${esc(w)}|${esc(w)}[“"]?\\s*(?:→|[–—:])`, 'iu').test(de);
  const german = (w) => w.length >= 3 && (pos.has(w.toLowerCase()) || /[äöüß]/i.test(w));
  for (const w of new Set(relCues)) {
    if (german(w) && !cued(w)) out.push(blocker(doc, `${path}.promptDe`, `promptEn names „${w}" as the cue, promptDe does not („(${w})") — the German prompt must carry the cue`, id));
  }
  for (const w of new Set(wordCues)) {
    if (german(w) && !hasWord(de, w)) out.push(blocker(doc, `${path}.promptDe`, `promptEn names „${w}", promptDe does not — the German prompt must carry the cue`, id));
  }
  if (/\b(?:as an? (?:ordinal )?word|in words|written out|spell(?:ed)? out)\b/i.test(en) && !WORD_CUE_RE.test(de)) out.push(blocker(doc, `${path}.promptDe`, 'promptEn asks for a word, promptDe does not („in Wörtern", „als Wort")', id));
  const starts = en.match(/\bstarts? with ["„“']?(\p{L}+)/iu);
  if (starts && !de.toLowerCase().includes(starts[1].toLowerCase())) out.push(blocker(doc, `${path}.promptDe`, `promptEn gives the first letters „${starts[1]}", promptDe does not`, id));
  if (!typed || !key) return out;
  // comprehension items (input, structured, exam) are decided by their text; the rest by the prompt
  const lexicalSlot = where === 'pool' || where === 'reserve' || where === 'check';
  // an ordinal word as the key
  if (key.split(/\s+/).some((w) => ordinalValue(w.replace(/[^\p{L}]/gu, '')) !== null) && !accepted.some((a) => /\d/.test(a)) && item.exact !== 'number' && !WORD_CUE_RE.test(de)) {
    out.push(blocker(doc, `${path}.accepted`, `the key „${key}" is an ordinal word: say „Wort" in promptDe, accept the digit form, or set exact: "number" (the checker then takes „4." for „vierte")`, id));
  }
  // first letters with underscores: exactly the missing letters
  for (const m of de.matchAll(/(\p{L}+)(_{2,})/gu)) {
    const [, head, gaps] = m;
    const target = accepted.find((a) => !/\s/.test(a.trim()) && a.toLowerCase().startsWith(head.toLowerCase()));
    if (target && head.length + gaps.length !== target.replace(/[^\p{L}]/gu, '').length) out.push(blocker(doc, `${path}.promptDe`, `„${head}${gaps}" shows ${head.length + gaps.length} letters, the key „${target}" has ${target.replace(/[^\p{L}]/gu, '').length}`, id));
  }
  if (CUE_RE.test(de.replace(/_{2,}/g, (g, i) => (i > 0 && /\p{L}/u.test(de[i - 1]) ? g : ' ')))) return out;
  const words = key.replace(/[.,!?;:„“"]/g, '').split(/\s+/).filter(Boolean);
  // a preposition the prompt does not give (a phrase „an der" or a contraction „zum"; a bare „auf" is a
  // verb's rection, which the verb decides; a gap right after a preposition „gegenüber ___" is framed)
  const gapAt = de.search(/_{2,}/);
  const wordBefore = (gapAt > 0 ? de.slice(0, gapAt).trim().split(/\s+/).pop() : '') || '';
  const phrase = words.length >= 2 || /^(?:zum|zur|am|im|ins|ans|beim|vom|aufs)$/i.test(words[0] || '');
  if (lexicalSlot && phrase && PREPOSITIONS.has(words[0].toLowerCase()) && !PREPOSITIONS.has(wordBefore.toLowerCase()) && !hasWord(de, words[0]) && !/Präposition/i.test(de)) {
    out.push(blocker(doc, `${path}.promptDe`, `the key „${key}" begins with the preposition „${words[0]}", which promptDe does not give — another preposition fits the frame; cue it („(${words[0]})")`, id));
    return out;
  }
  if (words.length !== 1 || !lexicalSlot) return out;
  // synonyms already accepted, or a prompt that defines the word („…: Das ist eine ___.") decide it
  if (new Set(accepted.map((a) => norm(a))).size >= 2) return out;
  if (/:\s*[^:]*_{2,}|\bheißt\b|\bnennt man\b/.test(de)) return out;
  // an open lexical gap: noun, adjective, or sentence adverb at the start
  const w = words[0];
  const before = gapAt > 0 ? de.slice(0, gapAt) : '';
  const initial = !before.trim() || /[.!?:„“"]\s*$/.test(before.trim());
  const cls = pos.get(w.toLowerCase()) || new Set();
  const noun = (cls.has('NOUN') || (/^\p{Lu}/u.test(w) && !initial)) && !/^\p{Lu}/u.test(w) === false;
  const adj = cls.has('ADJ') && !cls.has('VERB');
  const sadv = initial && SENTENCE_ADVERBS.has(w.toLowerCase());
  if (sadv) out.push(blocker(doc, `${path}.promptDe`, `open sentence-adverb gap at the start („${key}") without a German cue — another connector fits; add the choice in brackets („(trotzdem / deshalb)") or the first letters`, id));
  else if (noun || adj) out.push(advisory(doc, `${path}.promptDe`, `open ${noun ? 'noun' : 'adjective'} gap („${key}") without a German cue — if another word of its class fits the frame, add a bracketed base form, „= …", or the first letters`, id));
  return out;
}

// ── error_correction: the prompt names what to correct (a1.1-u04 r5 F01) ─────────────────────────
const ARTICLE_TAGS = new Set(['gender-article', 'case-np', 'case-pp']);
const ORDER_TAGS = new Set(['v2-inv', 'verb-final', 'connector-position', 'satzklammer']);
// haben or sein (a1.1-u12 r1 F02): the correction names the auxiliary („haben oder sein?", „das Hilfsverb")
const AUX_CATEGORY_RE = /\b(?:haben oder sein|sein oder haben|Hilfsverb|Perfekt|Partizip)\b/u;
const ARTICLE_CATEGORY_RE = /\b(?:Artikel|Artikeln|Endung|Endungen|Kasus|Pronomen|Präposition|Form|Wortform|Nomen)\b/u;
const ORDER_CATEGORY_RE = /\b(?:Wortstellung|Satzstellung|Stellung|Stelle|Position|Reihenfolge|Verbposition|Satzbau|Satzklammer)\b/u;
const VERB_CATEGORY_RE = /\b(?:Verbform|Verb|Verben|Konjugation|Verneinung|Negation)\b/u;
const ARTICLES = new Set(['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines']);

/** The category family an error_correction item must name, or null when the rail does not apply. */
export function correctionFamily(item) {
  const tag = item?.errorTag || arr(item?.errorTags)[0] || null;
  if (!tag) return 'any';
  if (ARTICLE_TAGS.has(tag)) return 'article';
  if (ORDER_TAGS.has(tag)) return 'order';
  if (tag === 'perfekt-aux-participle') return 'aux';
  return null;
}

/** Does promptDe (outside its quoted sentence) name a correction category of `family`? */
export function namesCategory(promptDe, family) {
  const frame = stripQuoted(promptDe);
  if (family === 'article') return ARTICLE_CATEGORY_RE.test(frame);
  if (family === 'order') return ORDER_CATEGORY_RE.test(frame);
  if (family === 'aux') return AUX_CATEGORY_RE.test(frame) || VERB_CATEGORY_RE.test(frame);
  return ARTICLE_CATEGORY_RE.test(frame) || ORDER_CATEGORY_RE.test(frame) || VERB_CATEGORY_RE.test(frame);
}

/** Every alternative correction is accepted with acceptedWhy (≥ 1 alternative besides the key). */
function alternativesExplained(item) {
  const key = norm(item.answer);
  const alts = [...new Set(arr(item.accepted).map(String).filter((a) => norm(a) !== key))];
  const why = isObj(item.acceptedWhy) ? item.acceptedWhy : {};
  return alts.length > 0 && alts.every((a) => typeof why[a] === 'string' && why[a].trim());
}

const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean);
const bare = (w) => w.replace(/^[„“"‚‘(]+|[.,!?;:“”"‘)]+$/g, '');

/**
 * The article-deletion alternative of an error_correction item whose key swaps one article: the quoted
 * sentence without that article, and the noun after it. null when the key is no one-article swap.
 */
export function deletionAlternative(item) {
  const m = String(item?.promptDe || '').match(/[„"‚]([^“"‘]+)[“"‘]/);
  if (!m) return null;
  const src = words(m[1]);
  const key = words(item.answer);
  if (src.length !== key.length || src.length < 3) return null;
  const diff = src.map((w, i) => (bare(w).toLowerCase() !== bare(key[i]).toLowerCase() ? i : -1)).filter((i) => i >= 0);
  if (diff.length !== 1) return null;
  const i = diff[0];
  const a = bare(src[i]).toLowerCase();
  const b = bare(key[i]).toLowerCase();
  if (!ARTICLES.has(a) || !ARTICLES.has(b) || i === 0 || i + 1 >= src.length) return null;
  const noun = bare(src[i + 1]);
  if (!/^\p{Lu}/u.test(noun)) return null;
  const out = [...key.slice(0, i), ...key.slice(i + 1)].join(' ');
  return { sentence: out, noun, before: bare(src[i - 1]), article: b };
}

/** Is the bare noun German in this frame, by the lexicon or by the unit's own sentences? → reason | null. */
function bareNounEvidence(alt, lexIndex, unitText) {
  const e = lexIndex.get(alt.noun.toLowerCase());
  if (e?.plural_kind === 'singular-only') return `${e.id} is singular-only (a mass noun)`;
  if (e && typeof e.plural === 'string' && e.plural.replace(/^die\s+/i, '').toLowerCase() === alt.noun.toLowerCase() && e.plural.toLowerCase() !== String(e.lemma).toLowerCase()) return `„${alt.noun}" is the plural of ${e.id}`;
  const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[^\\p{L}])${esc(alt.before)}\\s+${esc(alt.noun)}(?:[^\\p{L}]|$)`, 'iu');
  const hit = unitText.find((t) => re.test(t));
  return hit ? `the unit writes „${alt.before} ${alt.noun}" without an article („${hit.slice(0, 60)}")` : null;
}

function correctionFindings(ctx, doc, lexIndex) {
  const out = [];
  let unitText = null;
  for (const { item, path } of walkItems(doc)) {
    if (!isObj(item) || item.type !== 'error_correction') continue;
    const family = correctionFamily(item);
    if (!family) continue;
    const named = namesCategory(item.promptDe, family);
    const explained = alternativesExplained(item);
    if (!named && !explained) {
      const want = family === 'article' ? '„den Artikel", „die Endung", „das Pronomen"' : family === 'order' ? '„die Wortstellung", „die Position des Verbs"' : family === 'aux' ? '„haben oder sein?", „das Hilfsverb"' : '„den Artikel", „die Endung", „die Wortstellung", „die Verbform"';
      out.push(blocker(doc, `${path}.promptDe`, `error correction (${item.errorTag || arr(item.errorTags)[0] || 'no errorTag'}) with a bare prompt: name what to correct (${want}) outside the quoted sentence, or accept every other correct correction with acceptedWhy — „Korrigieren Sie:" alone admits corrections the grader rejects`, item.id));
    }
    if (family === 'aux') continue;
    if (family === 'order') {
      // every order the enumerator derives from the key's constituents (a1.1-u02 r2 F01 / r3 F08)
      const key = String(item.answer || '').trim();
      // one declarative sentence only (a key of two sentences is out of the enumerator's reach)
      if (!key || /[?]\s*$/.test(key) || key.includes(',') || /[.!?]\s+\S/.test(key) || fixesFirstTile(item) || /\bPosition\s+1\b|\bam Anfang\b|\bVerb vorn\b/i.test(stripQuoted(item.promptDe))) continue;
      // authored `tiles` (SCHEMA §3.1, 2026-09-28: the constituents of the corrected sentence, never rendered)
      // are ITM-09's to enumerate; the chunker stands in only where they are absent or do not build the key
      if (tilesBuildKey(item)) continue;
      const owed = missingOrders({ tiles: constituents(key), answer: key, accepted: arr(item.accepted), promptDe: item.promptDe });
      if (owed.length) out.push(blocker(doc, `${path}.accepted`, `word-order correction: German also allows ${owed.slice(0, 3).map((o) => `„${o.order}" (${o.why})`).join('; ')}${owed.length > 3 ? ` … (+${owed.length - 3})` : ''} — accept it (acceptedWhy), or fix the first position in promptDe („Beginnen Sie mit …")`, item.id));
      continue;
    }
    // deleting the article: only a category deletion cannot satisfy rules it out
    if (/\bEndung(?:en)?\b|\bKasus\b|\bPronomen\b/u.test(stripQuoted(item.promptDe))) continue;
    const alt = deletionAlternative(item);
    if (!alt) continue;
    if (arr(item.accepted).some((a) => norm(a) === norm(alt.sentence))) continue;
    if (unitText === null) {
      unitText = [];
      for (const { line } of walkLines(doc)) if (isObj(line) && line.de) unitText.push(String(line.de));
      for (const p of walkProduction(doc)) unitText.push(p.de);
    }
    const own = new Set([item.answer, ...arr(item.accepted)].map((x) => norm(x)));
    const evidence = bareNounEvidence(alt, lexIndex, unitText.filter((t) => !own.has(norm(t))));
    if (evidence) out.push(blocker(doc, `${path}.accepted`, `deleting the article is also a correct correction: „${alt.sentence}" (${evidence}) — accept it with acceptedWhy, or ask for a category a deletion cannot satisfy („Korrigieren Sie die Endung: …")`, item.id));
  }
  return out;
}

// ── the third round (RAILS §3.1c) ─────────────────────────────────────────────────────────────────

/** promptEn words that restrict the answer class → the German words that carry the same restriction. */
// the German side accepts the class word or a frame that restricts the gap as well („kosten ___ Euro",
// „um ___", „spricht … und ___", „heißt ___")
const ANSWER_CLASSES = [
  [/city|town/, /Stadt|Ort|Wohnort/], [/country/, /Land/], [/first name/, /Vorname/], [/(?:surname|family name|last name)/, /Familienname|Nachname/],
  [/name/, /Name|heißt|heiße|heißen/], [/language/, /Sprach|sprich|sprech/], [/street/, /Straße/], [/(?:job|profession|occupation)/, /Beruf|arbeitet als|ist von Beruf/],
  [/(?:weekday|day of the week)/, /Tag|Wochentag/], [/month/, /Monat/], [/(?:time|what time)/, /Uhr|Uhrzeit|wann|\bum\s+_{2,}/i], [/price/, /Preis|kost|Euro|€/],
  [/(?:phone number|telephone number)/, /Telefon|Handy|Nummer/], [/(?:postcode|postal code|zip)/, /Postleitzahl|PLZ/], [/drink/, /Getränk|trink/], [/food|dish/, /Essen|Gericht|ess|isst/],
];
/** An English restriction of the answer: „(city)", „the city:", „which city", „write the country". */
const CLASS_CUE_RE = /\((?:the |a |your )?([a-z ]{3,20})\)|\b(?:which|what)\s+([a-z ]{3,20}?)(?=\s+(?:is|does|do|did|has|are|was|comes?|lives?)\b|\?)|\b(?:write|type|give|name|enter)\s+(?:the|a|an|your)\s+([a-z ]{3,20}?)(?=[.:,)!?]|$)|^(?:the|a|an|your)\s+([a-z ]{3,20}?)\s*[:?]/i;

export function answerClassCue(promptEn) {
  const m = String(promptEn || '').match(CLASS_CUE_RE);
  if (!m) return null;
  const phrase = (m[1] || m[2] || m[3] || m[4] || '').trim().toLowerCase();
  const hit = ANSWER_CLASSES.find(([en]) => en.test(phrase));
  return hit ? { phrase, de: hit[1] } : null;
}

const PLURAL_CUE_DETERMINERS = new Set(['der', 'die', 'das', 'den', 'mein', 'meine', 'dein', 'deine', 'kein', 'keine', 'ihr', 'ihre', 'sein', 'seine', 'unser', 'unsere']);
const PLURAL_OF = { der: 'die', den: 'die', das: 'die', dem: 'den', ein: null, einen: null, mein: 'meine', meinen: 'meine', dein: 'deine', deinen: 'deine', kein: 'keine', keinen: 'keine', ihr: 'ihre', ihren: 'ihre', sein: 'seine', seinen: 'seine', unser: 'unsere', unseren: 'unsere' };
/** Words in promptDe that fix the number: a numeral, „ein/einen", „Singular/Plural", „alle", „viele". */
const NUMBER_FIXED_RE = /\b(?:Singular|Plural|ein|eine|einen|einem|zwei|drei|vier|fünf|alle|viele|nur einen?|beide)\b|\b\d+\b/iu;
const SINGULAR_VERB_RE = /^(?:ist|hat|war|kostet|liegt|steht|fehlt|gehört|passt|kommt|geht|funktioniert|braucht)$/;

/** The third-round findings of one item (see the header). */
function thirdRoundFindings(doc, item, path, where, nouns, step, list, index) {
  const out = [];
  const de = String(item.promptDe || '');
  const en = String(item.promptEn || '');
  const accepted = [item.answer, ...arr(item.accepted)].map((x) => String(x ?? ''));
  const typed = item.type === 'fill_blank' && !arr(item.options).length;
  // the answer class promptEn restricts (u01 r1 F04)
  if (typed) {
    const cue = answerClassCue(en);
    // a name class („the name") is carried by the frame itself as a rule („bei ___ melden" wants a person):
    // advisory; a place, language, job, day … class that the frame leaves open is graded wrong: blocker
    const sev = cue && /name/.test(cue.phrase) ? advisory : blocker;
    if (cue && !cue.de.test(de)) out.push(sev(doc, `${path}.promptDe`, `promptEn restricts the answer to „${cue.phrase}", promptDe does not (${cue.de.source.split('|').slice(0, 3).map((w) => `„${w.replace(/\\[bs]|[()+{}_,2]/g, '')}"`).join(' / ')}) — another answer fits the German frame and is graded wrong`, item.id));
  }
  // a plural-capable determiner cue before a noun whose plural equals its singular (u06 r1 F04 / r3 F04)
  if (typed) {
    const gap = de.search(/_{2,}/);
    const cueM = de.match(/\((der|die|das|mein|dein|kein|ihr|Ihr|sein|unser)\)/u);
    if (gap >= 0 && cueM) {
      const after = de.slice(gap).replace(/^_+\s*/, '');
      const noun = (after.match(/^(\p{Lu}\p{Ll}+)/u) || [])[1];
      const e = noun ? nouns.get(noun.toLowerCase()) : null;
      const same = e && typeof e.plural === 'string' && e.plural.replace(/^die\s+/i, '').toLowerCase() === String(e.lemma).replace(/^(?:der|die|das)\s+/i, '').toLowerCase();
      const next = (after.match(/^\p{Lu}\p{Ll}+\s+(\p{L}+)/u) || [])[1] || '';
      const keyDet = String(item.answer || '').trim().toLowerCase();
      const plural = Object.prototype.hasOwnProperty.call(PLURAL_OF, keyDet) ? PLURAL_OF[keyDet] : null;
      if (same && plural && PLURAL_CUE_DETERMINERS.has(cueM[1].toLowerCase()) && !SINGULAR_VERB_RE.test(next) && !NUMBER_FIXED_RE.test(stripQuoted(de).replace(/\([^)]*\)/g, ' '))
        && !accepted.some((a) => a.trim().toLowerCase() === plural)) {
        out.push(blocker(doc, `${path}.accepted`, `„${noun}" has the same form in the plural (${e.id}: die ${e.plural}), and nothing in promptDe fixes the number — „${plural}" is German too; accept it (acceptedWhy) or fix the number („ein …", „(Singular)")`, item.id));
      }
    }
  }
  if (item.type === 'error_correction') {
    // the planted article of a same-form-plural noun: the plural article is a correction too
    const alt = deletionAlternative(item);
    const e = alt ? nouns.get(alt.noun.toLowerCase()) : null;
    const same = e && typeof e.plural === 'string' && e.plural.replace(/^die\s+/i, '').toLowerCase() === String(e.lemma).replace(/^(?:der|die|das)\s+/i, '').toLowerCase();
    const plural = alt && Object.prototype.hasOwnProperty.call(PLURAL_OF, alt.article) ? PLURAL_OF[alt.article] : null;
    if (same && plural && !NUMBER_FIXED_RE.test(stripQuoted(de))) {
      const m = de.match(/[„"‚]([^“"‘]+)[“"‘]/);
      const verbNext = m ? (String(item.answer).split(/\s+/)[String(item.answer).split(/\s+/).findIndex((w) => w.replace(/[.,!?]/g, '') === alt.noun) + 1] || '') : '';
      const withPlural = String(item.answer).replace(new RegExp(`(^|\\s)${alt.article}(\\s+${alt.noun})`, 'i'), `$1${plural}$2`);
      if (!SINGULAR_VERB_RE.test(verbNext.replace(/[.,!?]/g, '')) && withPlural !== String(item.answer) && !accepted.some((a) => norm(a) === norm(withPlural))) {
        out.push(blocker(doc, `${path}.accepted`, `„${alt.noun}" has the same form in the plural (${e.id}): „${withPlural}" is a correct correction too — accept it with acceptedWhy`, item.id));
      }
    }
  }
  // a bracketed cue that IS the key (case aside) hands the answer over (a1.1-u11 r2 F02a) — ADVISORY
  if (typed) {
    for (const m of de.matchAll(/\(([^)]+)\)/g)) {
      if (norm(m[1]) && norm(m[1]) === norm(item.answer)) out.push(advisory(doc, `${path}.promptDe`, `the bracketed cue „${m[1]}" is the key itself — the item asks the learner to copy it`, item.id));
    }
  }
  // a tense item whose quoted stimulus and question share the time word (a1.1-u11 r3 F03) — ADVISORY
  if (where === 'structured' && /^g\.(?:perfekt|praeteritum)/.test(String(item.topic || ''))) {
    const TIME = /\b(?:heute|gestern|vorgestern|jetzt|morgen|letzte Woche|letzten \p{L}+|am (?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Wochenende))\b/giu;
    const q = de.match(/[„"‚]([^“"‘]+)[“"‘]/);
    if (q) {
      const inQuote = new Set((q[1].match(TIME) || []).map((x) => x.toLowerCase()));
      const rest = stripQuoted(de);
      const shared = (rest.match(TIME) || []).filter((x) => inQuote.has(x.toLowerCase()));
      if (shared.length) out.push(advisory(doc, `${path}.promptDe`, `the stimulus and the question share the time word „${shared[0]}" — the tense can be matched, not understood`, item.id));
    }
  }
  // a gist item answered by its own step or input title (u06 r1 F07)
  if ((where === 'gist' || item.role === 'gist') && step) {
    const titles = `${step.title || ''} ${step.input?.title || ''}`;
    const tset = new Set(tokens(titles).map((t) => t.lower));
    const content = tokens(String(item.answer || '')).map((t) => t.lower).filter((w) => w.length > 3);
    if (content.length && content.every((w) => tset.has(w))) out.push(advisory(doc, `${path}.answer`, `the gist key „${item.answer}" stands in the step/input title („${titles.trim()}") — the title answers the item`, item.id));
  }
  // an input item's explanation quoting the line of a later item's key (u06 r2 F03)
  if (where === 'input' && list && step?.input) {
    const expl = tokens(String(item.explanation?.de || '')).map((t) => t.lower);
    for (const later of list.slice(index + 1)) {
      const key = norm(later?.answer);
      if (!key) continue;
      const line = arr(step.input.lines).find((l) => norm(l?.de).includes(key));
      if (!line) continue;
      const lw = tokens(line.de).map((t) => t.lower);
      const quotes = lw.some((_, k) => k + 4 <= lw.length && expl.join(' ').includes(lw.slice(k, k + 4).join(' ')));
      if (quotes) {
        out.push(advisory(doc, `${path}.explanation.de`, `the explanation quotes ≥ 4 words of line ${line.id}, which holds the key of the later item ${later.id} („${later.answer}")`, item.id));
        break;
      }
    }
  }
  return out;
}

/** The calque „Was spricht …?" (sprechen + interrogative „was", no „Sprache" in the clause, u02 r1 F05). */
export const calqueWasSprechen = (text) => String(text || '').split(/[.!;]/).some((c) => /^\s*[„"]?Was\s+(?:sprich|sprech)\p{L}*\b/u.test(c) && !/Sprache/u.test(c));

/** bare lower-case noun (singular and plural) → its lexicon entry, over the cumulative lexicon. */
function nounIndex(ctx, level, cache) {
  const key = `nouns|${level}`;
  if (cache.has(key)) return cache.get(key);
  const m = new Map();
  for (const e of cumulativeLexicon(ctx, level)) {
    if (!isObj(e) || e.pos !== 'NOUN' || !e.lemma) continue;
    const sg = String(e.lemma).replace(/^(?:der|die|das)\s+/i, '').toLowerCase();
    if (!m.has(sg)) m.set(sg, e);
    if (typeof e.plural === 'string') {
      const pl = e.plural.replace(/^die\s+/i, '').toLowerCase();
      if (!m.has(pl)) m.set(pl, e);
    }
  }
  cache.set(key, m);
  return m;
}

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  if (!Q) notes.push(`quality.js not importable (${qError}); only the v2 task-shape checks ran`);
  const preds = predicates();
  const posCache = new Map();
  let n = 0;
  for (const doc of docs) {
    const pos = posIndex(ctx, doc.level, posCache);
    findings.push(...correctionFindings(ctx, doc, nounIndex(ctx, doc.level, posCache)));
    const nouns = nounIndex(ctx, doc.level, posCache);
    for (const { item, path, where, block, texts, step } of walkItems(doc)) {
      if (!isObj(item)) continue;
      n += 1;
      const id = item.id;
      const list = where === 'input' && step ? arr(step.inputItems) : null;
      findings.push(...thirdRoundFindings(doc, item, path, where, nouns, step, list, list ? list.indexOf(item) : -1));
      for (const [k, v] of [['promptDe', item.promptDe], ...arr(item.options).map((o, i) => [`options[${i}]`, o])]) {
        if (calqueWasSprechen(v)) findings.push(advisory(doc, `${path}.${k}`, `„${String(v).slice(0, 60)}" — „Was spricht …?" is a calque; ask „Welche Sprache(n) spricht …?" or „Was sagt …?"`, id));
      }
      const prompt = String(item.promptDe || '');
      // v2 task shape: the German prompt carries the task
      if (!prompt.trim()) findings.push(blocker(doc, `${path}.promptDe`, 'no German prompt', id));
      else if (item.promptEn && norm(item.promptEn) === norm(prompt)) findings.push(blocker(doc, `${path}.promptDe`, 'the German prompt repeats the English gloss', id));
      if (item.type === 'fill_blank' && !/_{2,}|…/.test(prompt)) findings.push(blocker(doc, `${path}.promptDe`, 'typed gap item without a gap (___) in its German prompt', id));
      if (item.type === 'error_correction') {
        if (!/[„"“‚].+[“"”‘]/.test(prompt)) findings.push(blocker(doc, `${path}.promptDe`, 'error correction without the quoted sentence to correct', id));
        if (!item.intentionalError) findings.push(blocker(doc, `${path}.intentionalError`, 'error-correction source sentence not marked intentionalError', id));
      }
      if (item.type === 'sentence_building' && arr(item.tiles).length < 2) findings.push(blocker(doc, `${path}.tiles`, 'sentence building without its tiles', id));
      if (item.type === 'dictation' && !item.audioLineRef) findings.push(blocker(doc, `${path}.audioLineRef`, 'dictation without the line it dictates (audioLineRef)', id));
      const blockTexts = arr(texts).map((x) => x.text);
      const choiceBlock = arr(block?.choices).length > 0;
      if (where === 'exam' && !item.textRef && !choiceBlock && blockTexts.length > 1) findings.push(blocker(doc, `${path}.textRef`, 'exam item of a multi-text block without textRef', id));
      if (where === 'exam' && item.textRef && !blockTexts.some((t) => t?.id === item.textRef)) findings.push(blocker(doc, `${path}.textRef`, `textRef "${item.textRef}" is not a text of its block`, id));
      if (CHOICE_TYPES.has(item.type) && !arr(item.options).length && item.type !== 'zuordnen' && item.type !== 'match') {
        findings.push(blocker(doc, `${path}.options`, `${item.type} item without options`, id));
      }
      if (!item.intentionalError || item.type !== 'error_correction') findings.push(...cueFindings(doc, item, path, where, pos));
      // quality.js
      const c = compiledItem(item);
      const keyAnswer = choiceBlock && where === 'exam';
      for (const [reason, applies] of preds) {
        if (keyAnswer && reason !== Q.REASON.ENGLISH_PROMPT && reason !== Q.REASON.ENGLISH_RESPELLING) continue;
        let hit = false;
        try {
          hit = Boolean(applies(item, c));
        } catch {
          hit = false;
        }
        if (!hit) continue;
        if (reason === Q.REASON.UNCONDITIONED_RULE) {
          const s = Q.unconditionedRuleSentence ? Q.unconditionedRuleSentence(c) : null;
          if (s && EXACTNESS_RE.test(s.sentence)) {
            findings.push(advisory(doc, `${path}.explanation`, `quality.js unconditioned-rule on an exactness statement („${s.sentence}") — a statement about the checker, not a grammar rule`, id));
            continue;
          }
          findings.push(blocker(doc, `${path}.explanation`, `quality.js ${reason}${s ? `: „${s.sentence}"` : ''}`, id));
          continue;
        }
        findings.push(blocker(doc, path, `quality.js ${reason}`, id));
      }
    }
  }
  return n ? { findings, notes } : { findings, skipped: 'no authored items in the target yet' };
}
