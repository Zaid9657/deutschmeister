// Measures DaF review #3 (A1.2) BLOCKER 1 for a level: does the answer key reject correct German the
// GERMAN prompt allows? For every item the draw serves (both attempts) and every checkpoint item, it
// builds the alternatives a teacher accepts for the item's family and runs each through the real
// checker, exactly as PracticeItem.jsx calls it. One line per rejected alternative; exit 1 when any.
//
//   node scripts/a12-determinacy.mjs [level]
//
// The families (each a class the review measured, never an id):
//   - a du-imperative of a regular verb, with and without -e („Mach / Mache den Fernseher aus!");
//   - a contraction whose cue spells out its two words („(an + dem)") without asking for the short form;
//   - „Sie ___ … (nehmen, sie)" with a singular key — sie is also they, Sie also the formal you;
//   - a multiple choice among different modal verbs with no meaning named in the German prompt;
//   - a sentence whose key opens with a place phrase („Am Platz ist die Haltestelle.") or ends with a
//     für-phrase („Ich kaufe die Jacke für meine Oma."): the other order is the same sentence.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { checkAnswer, checkOptionsFor, isChoiceItem, RESULT } from '../src/lib/lesson/check.js';
import { planPractice, poolItems } from '../src/lib/lesson/buildLesson.js';
import { buildCheckpoint, paperSeed } from '../src/lib/checkpoint/buildCheckpoint.js';
import { anyCurriculumFor } from '../src/data/curricula/index.js';
import { levelSpec } from './validate-curriculum.mjs';

const MODAL_LEMMA = {
  kann: 'können', kannst: 'können', können: 'können', könnt: 'können',
  muss: 'müssen', musst: 'müssen', müssen: 'müssen', müsst: 'müssen',
  darf: 'dürfen', darfst: 'dürfen', dürfen: 'dürfen', dürft: 'dürfen',
  soll: 'sollen', sollst: 'sollen', sollen: 'sollen', sollt: 'sollen',
  will: 'wollen', willst: 'wollen', wollen: 'wollen', wollt: 'wollen',
  möchte: 'mögen', möchtest: 'mögen', möchten: 'mögen', möchtet: 'mögen',
};
const PAIR_CUE_RE = /\(((?:an|in|zu|von|bei) \+ (?:dem|der|das))\)/;
const STEM_CHANGE_IMPERATIVE_RE = /^(?:iss|nimm|gib|lies|sieh|hilf|sprich|triff|vergiss|wirf|brich|tritt|miss|lass)$/i;
const E_REQUIRED_RE = /(?:t|d|chn|ffn|tm|gn|dm)e$/i;
const strip = (s) => String(s || '').replace(/[.!?]+$/, '').trim();
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/*
 * WORD ORDER, READ OFF THE KEY (DaF review #4, A1.2 BLOCKER 1). Review #3's generator knew two
 * shapes (a place phrase first, a für-phrase last); review #4 found the same class in every other
 * shape — „Sie gehen dann an der Ecke links.", „Mit dem Bus fahren wir bei Regen.", „Die Kartoffel
 * habe ich gekauft.", „Meine Mutter kocht heute das Essen.". A German statement may open with its
 * subject or with any one other constituent, the verb staying second; so the alternatives of a key
 * are: its subject first (when something else opens it), and each other phrase first (when the
 * subject opens it). Statements only — no question, no imperative, no second clause.
 */
const SUBJECT_PRONOUN_RE = /^(?:ich|du|er|sie|es|wir|ihr|Sie|man)$/;
const NOMINATIVE_DET_RE = /^(?:der|die|das|ein|eine|kein|keine|mein|meine|dein|deine|sein|seine|ihr|ihre|unser|unsere)$/i;
const ANY_DET_RE = /^(?:der|die|das|den|dem|ein|eine|einen|einem|einer|kein|keine|keinen|mein|meine|meinen|meinem|meiner|dein|deine|deinen|sein|seine|seinen|ihr|ihre|ihren|unser|unsere|unseren)$/i;
const PREPOSITION_RE = /^(?:in|an|auf|mit|bei|nach|zu|zum|zur|im|am|ins|um|für|ohne|durch|aus|von|vom|seit|vor|hinter|neben|über|unter|gegen)$/i;
const OPENING_ADVERB_RE = /^(?:heute|morgen|dann|danach|zuerst|jetzt|bald|gestern|später|abends|morgens|hier|dort|da)$/i;
const isNoun = (t) => /^[A-ZÄÖÜ][a-zäöüß]+$/.test(t || '');

/** How many tokens the constituent at `i` spans, and what it is. */
function constituentAt(tokens, i) {
  const t = tokens[i];
  if (!t) return null;
  if (PREPOSITION_RE.test(t) && tokens[i + 1]) {
    if (ANY_DET_RE.test(tokens[i + 1]) && isNoun(tokens[i + 2])) return { length: 3, kind: 'phrase' };
    if (isNoun(tokens[i + 1])) return { length: 2, kind: 'phrase' };
    return null;
  }
  if (ANY_DET_RE.test(t) && isNoun(tokens[i + 1])) return { length: 2, kind: NOMINATIVE_DET_RE.test(t) ? 'np' : 'object' };
  if (SUBJECT_PRONOUN_RE.test(t) || (i === 0 && SUBJECT_PRONOUN_RE.test(lowerFirst(t)))) return { length: 1, kind: 'pronoun' };
  if (OPENING_ADVERB_RE.test(t)) return { length: 1, kind: 'phrase' };
  if (isNoun(t) && i > 0) return { length: 1, kind: 'np' };
  return null;
}

/** The finite copula forms after which a bare noun is a predicate, not an object. */
const COPULA_FORMS = new Set(['ist', 'sind', 'bin', 'bist', 'seid', 'war', 'waren', 'bleibt', 'bleiben', 'wird', 'werden', 'heißt', 'heißen']);

/** The other word orders of a statement key, each a correct German sentence. */
export function wordOrderAlternatives(key) {
  const raw = String(key || '').trim();
  // A second main clause after „, denn / aber / sondern / oder / und" keeps its place; the FIRST
  // clause has the free Vorfeld („Eine Tablette nehme ich, denn mein Kopf tut weh.", DaF review #6,
  // B1 — the old early return gave such keys no alternatives and their prompts no opening cue).
  const coordinated = raw.match(/^([^,]+), ((?:denn|aber|sondern|oder|und) .+[.!])$/);
  if (coordinated) {
    return wordOrderAlternatives(`${coordinated[1]}.`).map((first) => `${first.replace(/\.$/, '')}, ${coordinated[2]}`);
  }
  if (!/\.$/.test(raw) || /[,;:?!]/.test(raw.slice(0, -1)) || /\b(?:und|oder|aber|weil|dass|wenn)\b/.test(raw)) return [];
  const tokens = strip(raw).split(/\s+/);
  // A sentence-initial function word is written small once it moves; a noun or a name is not.
  const movedFront = (words) => (words[0] === 'Sie' || isNoun(words[0]) && !SUBJECT_PRONOUN_RE.test(lowerFirst(words[0])) && !ANY_DET_RE.test(words[0]) && !PREPOSITION_RE.test(words[0]) && !OPENING_ADVERB_RE.test(words[0])
    ? words : [lowerFirst(words[0]), ...words.slice(1)]);
  const opensWithSubjectPronoun = SUBJECT_PRONOUN_RE.test(lowerFirst(tokens[0])) || tokens[0] === 'Sie';
  const first = opensWithSubjectPronoun ? { length: 1, kind: 'pronoun' }
    : constituentAt(tokens, 0) || (isNoun(tokens[0]) ? { length: 1, kind: 'np' } : null);
  if (!first) return [];
  const verb = tokens[first.length];
  if (!verb || /^[A-ZÄÖÜ]/.test(verb) || PREPOSITION_RE.test(verb) || ANY_DET_RE.test(verb)) return [];
  const opening = tokens.slice(0, first.length);
  // Who is the subject? Whatever follows the verb when that is a pronoun or a nominative phrase;
  // otherwise the opening itself.
  const after = constituentAt(tokens, first.length + 1);
  const subjectAfterVerb = after && (after.kind === 'pronoun' || (after.kind === 'np' && ANY_DET_RE.test(tokens[first.length + 1])));
  const out = [];
  if (!subjectAfterVerb) {
    // The subject opens: each other phrase may open instead, the subject then follows the verb.
    const rest = tokens.slice(first.length + 1);
    for (let j = 0; j < rest.length; j += 1) {
      // A bare noun right after a full verb is its object („Ana hat Milch getrunken." → „Milch hat
      // Ana getrunken.", DaF review #6, B1); after a copula it is the predicate and stays.
      const bareObject = isNoun(rest[j]) && j < rest.length - 1 && !COPULA_FORMS.has(verb) ? { length: 1, kind: 'object' } : null;
      const c = constituentAt(rest, j) || bareObject;
      if (!c || (c.kind !== 'phrase' && c.kind !== 'object')) continue;
      const fronted = rest.slice(j, j + c.length);
      const remainder = [...rest.slice(0, j), ...rest.slice(j + c.length)];
      out.push(`${upperFirst(fronted.join(' '))} ${verb} ${movedFront(opening).join(' ')}${remainder.length ? ` ${remainder.join(' ')}` : ''}.`);
      j += c.length - 1;
    }
  } else {
    // Something else opens: the subject may open instead, the opening then follows the verb.
    const subject = tokens.slice(first.length + 1, first.length + 1 + after.length);
    const rest = tokens.slice(first.length + 1 + after.length);
    out.push(`${upperFirst(subject.join(' '))} ${verb} ${movedFront(opening).join(' ')}${rest.length ? ` ${rest.join(' ')}` : ''}.`);
  }
  return out;
}

/*
 * THE MIDDLE FIELD (DaF review #5, A1.2 BLOCKER 1). A named opening fixes the Vorfeld, not the rest:
 * „Ana kauft den Kuchen im Geschäft." = „Ana kauft im Geschäft den Kuchen.", „Machen Sie bitte das
 * Fenster zu!" = „Machen Sie das Fenster bitte zu!", „Dann gehen Sie an der Ecke links." = „Dann gehen
 * Sie links an der Ecke.". The phrases between the finite verb (with a subject pronoun right after it)
 * and the sentence-final part (a separable prefix, an infinitive, a participle) may stand in any order,
 * within the limits a teacher keeps: a personal pronoun stays first, the subject stays where it is,
 * nothing moves in a sentence with a negation (its place is its meaning) or a second clause, and at
 * most three phrases move.
 */
const MIDDLE_PRONOUN_RE = /^(?:mich|dich|ihn|es|uns|euch|mir|dir|ihm|ihr|Ihnen|sich)$/;
const BRACKET_PARTICLE_RE = /^(?:zu|an|auf|aus|ein|mit|ab|nach|vor|weg|zurück|fern|los|her|hin)$/;
const NONFINITE_RE = /^(?:ge[a-zäöüß]{2,}(?:t|en)|[a-zäöüß]{3,}en|[a-zäöüß]+iert|bezahlt|besucht|verstanden|verkauft|erzählt|vergessen)$/;
const MIDDLE_ADVERB_RE = /^(?:bitte|gern|gerne|heute|morgen|gestern|jetzt|bald|oft|manchmal|immer|schon|noch|auch|dann|danach|zuerst|später|hier|dort|da|links|rechts|geradeaus|früh|spät|lange|wieder|sehr|schnell|langsam)$/i;

function middleConstituents(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length;) {
    if (MIDDLE_PRONOUN_RE.test(tokens[i])) { out.push({ words: [tokens[i]], pronoun: true }); i += 1; continue; }
    const c = constituentAt(tokens, i);
    if (c && c.kind !== 'pronoun') { out.push({ words: tokens.slice(i, i + c.length) }); i += c.length; continue; }
    if (MIDDLE_ADVERB_RE.test(tokens[i]) || isNoun(tokens[i])) { out.push({ words: [tokens[i]] }); i += 1; continue; }
    return null; // a word the segmenter cannot place: no guess
  }
  return out;
}

const orderings = (list) => (list.length <= 1 ? [list]
  : list.flatMap((x, i) => orderings([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [x, ...rest])));

/** The other orders of a key's middle field, each the same German sentence. */
export function middleFieldOrders(key) {
  const raw = String(key || '').trim();
  const end = raw.slice(-1);
  if (!/[.!]/.test(end) || /[,;:?]/.test(raw.slice(0, -1)) || /\b(?:und|oder|aber|denn|weil|dass|wenn|nicht|nie|kein\w*)\b/i.test(raw)) return [];
  const tokens = strip(raw).split(/\s+/);
  let head;
  if (end === '!') {
    head = tokens[1] === 'Sie' ? 2 : 1;
  } else {
    const opensWithSubject = SUBJECT_PRONOUN_RE.test(lowerFirst(tokens[0])) || tokens[0] === 'Sie';
    const first = opensWithSubject ? { length: 1, kind: 'pronoun' }
      : constituentAt(tokens, 0) || (isNoun(tokens[0]) ? { length: 1, kind: 'np' } : null);
    if (!first) return [];
    head = first.length + 1;
    if (first.kind !== 'pronoun' && first.kind !== 'np') {
      // Something else opens: only a subject pronoun right after the verb keeps the subject in place.
      if (!(SUBJECT_PRONOUN_RE.test(tokens[head] || '') || tokens[head] === 'Sie')) return [];
      head += 1;
    }
  }
  let tail = tokens.length;
  const last = tokens[tail - 1];
  if (tail - head > 1 && (BRACKET_PARTICLE_RE.test(last) || NONFINITE_RE.test(last))) tail -= 1;
  const parts = middleConstituents(tokens.slice(head, tail));
  if (!parts) return [];
  const pronouns = parts.filter((p) => p.pronoun);
  const movable = parts.filter((p) => !p.pronoun);
  if (movable.length < 2 || movable.length > 3) return [];
  const out = new Set();
  for (const order of orderings(movable)) {
    const words = [...tokens.slice(0, head), ...pronouns.flatMap((p) => p.words), ...order.flatMap((p) => p.words), ...tokens.slice(tail)];
    const text = `${words.join(' ')}${end}`;
    if (text !== raw) out.add(text);
  }
  return [...out];
}

/** The opening a statement key's prompt has to name, or null when the order is not free. */
/** The phrase a statement key opens with — its Vorfeld — whether or not another opening is free. */
export const vorfeldOf = (key) => {
  const tokens = strip(key).split(/\s+/);
  const first = constituentAt(tokens, 0) || { length: 1 };
  return tokens.slice(0, first.length).join(' ');
};
export const openingOf = (key) => (wordOrderAlternatives(key).length ? vorfeldOf(key) : null);
// The opening cue, with the further places a task may name after a semicolon (review #9).
const OPENING_CUE_RE = /\(Beginnen Sie mit „([^“"]+)[“"](?:;[^)]*)?\)/;

/** Whether an answer opens with the phrase its task names („Wir …" for „Beginnen Sie mit „Wir“"). */
export const opensWith = (answer, opening) => {
  const a = String(answer || '').trim().toLowerCase();
  const o = String(opening || '').trim().toLowerCase();
  return a === o || a.startsWith(`${o} `) || a.startsWith(`${o},`);
};

const NEG_PARTICLE_RE = /^(?:nicht|nie)$/i;
const COORDINATOR_RE = /^(?:und|aber|oder|denn|sondern)$/i;
/**
 * DaF review #9 (A1.2) B1: „nicht"/„nie" has two grammatical places when its clause holds another
 * middle-field phrase („Ich fahre nicht ohne meinen Bruder." / „Ich fahre ohne meinen Bruder nicht.")
 * — or two readings („Wir kaufen nicht das Auto." negates the car only). So the German task names the
 * place; null when there is one place only (a final predicative: „ist nicht schön", „schläft nicht
 * gut"). For a STATEMENT key; the harness never guesses a place of its own.
 */
export function negationPlaceCue(key) {
  if (!/\.$/.test(String(key || '').trim())) return null;
  for (const clause of strip(key).split(/,\s+/)) {
    const t = clause.split(/\s+/);
    const n = t.findIndex((w) => NEG_PARTICLE_RE.test(w));
    if (n < 0) continue;
    const from = COORDINATOR_RE.test(t[0]) ? 1 : 0;
    let start = from + (constituentAt(t, from) || { length: 1 }).length + 1;
    if (SUBJECT_PRONOUN_RE.test(t[start] || '') || t[start] === 'Sie') start += 1;
    let end = t.length;
    if (end - start > 1 && (BRACKET_PARTICLE_RE.test(t[end - 1]) || NONFINITE_RE.test(t[end - 1]))) end -= 1;
    const others = t.slice(start, end).filter((_, i) => i + start !== n);
    if (!others.length || (others.length === 1 && n === end - 2 && /^[a-zäöüß]+$/.test(others[0]))) return null;
    return n === t.length - 1 ? `„${t[n]}“ steht am Satzende` : `„${t[n]}“ steht vor „${t[n + 1]}“`;
  }
  return null;
}

/**
 * DaF review #9 (A1.2) B1: a later MAIN clause opens freely too („…, aber früh ist Tim gegangen."), so
 * the task names its opening as well. Each is { after: the conjunction or null for a bare comma,
 * opening }; a comma inside one clause (a list: „Brot, Milch und Käse") is no clause and gives none.
 */
export function laterOpenings(key) {
  if (!/\.$/.test(String(key || '').trim())) return [];
  return strip(key).split(/,\s+/).slice(1).flatMap((clause) => {
    const t = clause.split(/\s+/);
    const after = COORDINATOR_RE.test(t[0]) ? t[0] : null;
    const rest = after ? t.slice(1) : t;
    const length = (constituentAt(rest, 0) || { length: 1 }).length;
    const verb = rest[length] || '';
    if (!/^[a-zäöüß]+$/.test(verb) || COORDINATOR_RE.test(verb) || rest.length < length + 2) return [];
    return [{ after, opening: rest.slice(0, length).join(' ') }];
  });
}

/** A du-imperative gap that opens its clause and carries no pronoun yet: „___ ihn bitte! (holen, du)". */
export const GAP_IMPERATIVE_RE = /(?:^|[.!?]\s+|,\s+)___\s+(?!du\b)[^!?.]*!/;
const DU_CUE_RE = /\([a-zäöüß]+en, du\)/;

/**
 * Alternatives a teacher accepts for this item, by family. Each is { text, why }. `wide` adds the
 * families of DaF review #4 — the free word order, the imperative gap with and without -e, and
 * „bitte" at the front — for a level that has opted in (A1.2); A1.1's own word-order rules are the
 * ones its 23 reviews settled (frontableOrders, missingOpeningCue).
 */
export function alternatives(item, { wide = false } = {}) {
  const out = [];
  // A checkpoint item carries its prompt as promptDe: read it, or its cue (Beginnen Sie mit …) is unseen.
  const q = String(item.questionDe || item.promptDe || '');
  const key = String(item.answer || '').trim();
  // du-imperative ±e — and, for a sentence task, with its emphatic pronoun („Mach du den Fernseher aus!")
  const imp = item.topic === 'imperative' && key.match(/^([A-ZÄÖÜ][a-zäöüß]+)((?:\s+[^!]*)?)!$/);
  if (wide && imp && (item.type === 'sentence_building' || item.type === 'error_correction') && !/^\s*(?:Sie|ihr|wir|du)\b/.test(imp[2]) && !/t$/.test(imp[1])) {
    out.push({ text: `${imp[1]} du${imp[2]}!`, why: 'du-imperative with its emphatic pronoun' });
  }
  if (imp && !/^\s*(?:Sie|ihr|wir)\b/.test(imp[2]) && !STEM_CHANGE_IMPERATIVE_RE.test(imp[1]) && !/t$/.test(imp[1])) {
    const other = /e$/.test(imp[1]) ? (E_REQUIRED_RE.test(imp[1]) ? null : imp[1].slice(0, -1)) : `${imp[1]}e`;
    if (other) out.push({ text: `${other}${imp[2]}!`, why: 'du-imperative ±e' });
  }
  // a cue that spells out the contraction's two words, without asking for the short form
  const pair = q.match(PAIR_CUE_RE);
  if (pair && !/kurzform/i.test(q) && /^(?:am|im|zum|zur|vom|beim|ins|ans)$/i.test(key)) {
    out.push({ text: pair[1].replace(' + ', ' '), why: 'the cue says the two words' });
  }
  // sie = she or they
  const sie = q.match(/^Sie ___.*\(([a-zäöüß]+en), sie\)/);
  if (sie && /t$/.test(key)) out.push({ text: sie[1], why: 'sie = they / Sie formal' });
  // different modal verbs, no meaning named
  if (item.type === 'multiple_choice' && Array.isArray(item.options) && MODAL_LEMMA[key.toLowerCase()]) {
    const lemmas = new Set(item.options.map((o) => MODAL_LEMMA[strip(o).toLowerCase()]).filter(Boolean));
    const named = /\((?:können|müssen|dürfen|sollen|wollen|mögen|möchten)\)/.test(q);
    if (lemmas.size > 1 && !named) {
      for (const o of item.options) {
        const lemma = MODAL_LEMMA[strip(o).toLowerCase()];
        if (lemma && lemma !== MODAL_LEMMA[key.toLowerCase()]) out.push({ text: strip(o), why: 'another modal verb fits; the prompt names no meaning' });
      }
    }
  }
  // word order: a place phrase or a für-phrase can open the sentence or follow the verb
  if (item.type === 'sentence_building' && !/\(Beginnen Sie mit /.test(q) && !/\bfrage\b/i.test(q)) {
    const placeFirst = strip(key).match(/^((?:Am|Im|Auf dem|Auf der|In der|In dem|Neben der|Neben dem|An der|Vor dem|Vor der) \S+) (ist|sind|steht|stehen|liegt|liegen) (.+)$/);
    if (placeFirst) out.push({ text: `${upperFirst(placeFirst[3])} ${placeFirst[2]} ${lowerFirst(placeFirst[1])}.`, why: 'subject-first order' });
    const fuerLast = strip(key).match(/^(\S+) (\S+) (.+) (für (?:mein|dein|sein|ihr|unser|euer|den|die|das|einen|eine|ein)\S* \S+)$/);
    if (fuerLast) out.push({ text: `${upperFirst(fuerLast[4])} ${fuerLast[2]} ${lowerFirst(fuerLast[1])} ${fuerLast[3]}.`, why: 'für-phrase first' });
  }
  if (!wide) return out;
  const known = new Set(out.map((a) => a.text));
  const add = (text, why) => { if (!known.has(text)) { known.add(text); out.push({ text, why }); } };
  // Any statement whose prompt does not name its opening: every other order is the same sentence.
  if ((item.type === 'sentence_building' || item.type === 'error_correction') && !OPENING_CUE_RE.test(q)) {
    for (const text of wordOrderAlternatives(key)) add(text, 'another word order');
  }
  // The middle field: a named opening fixes only the Vorfeld (DaF review #5).
  if (item.type === 'sentence_building' || item.type === 'error_correction') {
    for (const text of middleFieldOrders(key)) add(text, 'another middle-field order');
  }
  // „___ kostet …?" asks for a price: „Was" and „Wie viel" are both German.
  if (/___ kosten?\b/.test(q) && /^(?:Was|Wie viel)$/.test(key)) add(key === 'Was' ? 'Wie viel' : 'Was', 'Was/Wie viel kostet');
  // A du-imperative in a gap: „Hol" and „Hole" are both the imperative.
  if (item.type === 'fill_blank' && DU_CUE_RE.test(q) && /^[A-Za-zäöüß]+$/.test(key) && !STEM_CHANGE_IMPERATIVE_RE.test(key) && !/t$/i.test(key)) {
    const other = /e$/.test(key) ? (E_REQUIRED_RE.test(key) ? null : key.slice(0, -1)) : `${key}e`;
    if (other) add(other, 'du-imperative ±e (gap)');
  }
  // …and with its emphatic pronoun, as in a sentence: „Hol du ihn bitte!" (DaF review #9, B1).
  if (item.type === 'fill_blank' && DU_CUE_RE.test(q) && /^[A-Za-zäöüß]+$/.test(key) && GAP_IMPERATIVE_RE.test(q)) {
    add(`${key} du`, 'du-imperative with its emphatic pronoun (gap)');
  }
  // A request with „bitte": it may open the sentence.
  const bitte = key.match(/^([A-ZÄÖÜ][a-zäöüß]+)(.*?) bitte(.*)!$/);
  if ((item.type === 'sentence_building' || item.type === 'error_correction') && bitte) {
    add(`Bitte ${lowerFirst(bitte[1])}${bitte[2]}${bitte[3]}!`.replace(/\s+/g, ' '), 'bitte first');
  }
  return out;
}

/**
 * Every served item of a level: both practice attempts and every checkpoint paper a learner can sit —
 * the three rounds of an attempt window (paperSeed), each item keyed by its paper, so two rounds of
 * one item id are two items (DaF review #4: the harness rebuilt the default and a numeric seed and
 * let one variant overwrite the other).
 */
export function servedItems(level, poolFile = new URL(`../src/data/lessonPools/${level.replace('.', '')}.json`, import.meta.url)) {
  const curriculum = anyCurriculumFor(level);
  const pool = JSON.parse(readFileSync(poolFile, 'utf8'));
  const out = new Map();
  for (const attempt of [1, 2]) for (const [nr, items] of planPractice(curriculum, pool, attempt)) for (const it of items) out.set(`L${nr}#${it.id}`, { ...it, where: `L${nr}` });
  for (const checkpoint of curriculum.checkpoints || []) {
    for (let round = 0; round < 3; round += 1) {
      for (const it of buildCheckpoint({ curriculum, checkpoint, pool, seed: paperSeed(checkpoint, round) })) {
        if (it.answer) out.set(`${checkpoint.id}/${round}#${it.id}`, { ...it, where: `${checkpoint.id}/${round}` });
      }
    }
  }
  return { items: [...out.values()], poolSize: poolItems(pool).length };
}

/** The rejected alternatives of a level. */
export function rejectedAlternatives(level, poolFile) {
  const rejected = [];
  const wide = Boolean(levelSpec(level)?.determinacyRepairs);
  for (const item of servedItems(level, poolFile).items) {
    const accepted = item.accepted?.length ? item.accepted : [item.answer];
    for (const alt of alternatives({ ...item, questionDe: item.questionDe || item.promptDe }, { wide })) {
      // A choice item is answered by picking: an alternative it does not print cannot be given.
      if (isChoiceItem(item) && !(item.options || []).includes(alt.text)) continue;
      const r = checkAnswer(alt.text, accepted, checkOptionsFor(item));
      if (r.result !== RESULT.CORRECT && r.result !== RESULT.TYPO) rejected.push({ where: item.where, id: item.id, why: alt.why, q: item.questionDe || item.promptDe, key: item.answer, alt: alt.text, result: r.result });
    }
  }
  return rejected;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const level = process.argv[2] || 'a1.2';
  const rejected = rejectedAlternatives(level);
  for (const r of rejected) console.log(`${r.where} ${r.id} [${r.why}] ${JSON.stringify(String(r.q ?? '')).slice(0, 90)} key=${JSON.stringify(r.key)} alt=${JSON.stringify(r.alt)} → ${r.result}`);
  console.log(`${level}: ${servedItems(level).items.length} served items, ${rejected.length} correct alternatives rejected`);
  process.exit(rejected.length ? 1 : 0);
}
