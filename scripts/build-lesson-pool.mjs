#!/usr/bin/env node
// Builds src/data/lessonPools/<level>.json from grammar-content-cache.json:
// the level's grammar exercises, keyed by topic slug, trimmed to what the
// lesson engine needs. Re-run after refreshing the cache. Usage:
//   node scripts/build-lesson-pool.mjs a1.1
//
// TWO THINGS HAPPEN HERE BESIDES THE COPY, both from the DaF review of
// 2026-09-12 (docs/course-factory/a11-rebuild/REVIEW-daf-2026-09-12.md):
//
//   1. QUALITY FILTER. The grammar bank predates the situational curriculum and
//      carries items a course cannot show a paying learner: English respellings
//      ("Es klingt wie HOY-tuh"), multiple-choice items whose correct answer is
//      an English explanation, and fill-in items that expect `kein/keine` from a
//      prompt with no negation cue (so the correct answer is marked wrong). The
//      rules live in src/data/lessonPools/quality.js so the engine and the tests
//      can apply the same ones; this script prints what it dropped and why.
//
//   2. HAND-AUTHORED EXTRA ITEMS. src/data/lessonPools/<level>.extra.json holds
//      the situational items the legacy bank simply does not have — the review
//      measured Lektion 10 (Bahnhof) drawing ZERO items that mention a word from
//      its own Wortfeld, and Lektion 12 (Fest) two. They are merged here and run
//      through the SAME quality rules; a failing extra item stops the build
//      rather than shipping, because nothing else would ever look at that file.
//
//   3. RULE CARDS. netlify/functions/_shared/ruleCards.mjs is generated from the
//      same cache: topic slug → the grammar rule text that grounds
//      netlify/functions/explain-answer.mjs. Generated here so the card the model
//      is grounded in and the pool the item comes from can never drift apart.
//      ONE FILE FOR EVERY LEVEL, not one per level: explain-answer.mjs imports a
//      single RULE_CARDS map keyed by slug, and a slug belongs to exactly one
//      sub_level, so a per-level file would only move the merge into the
//      function. A run therefore READS the committed file, merges the cards of
//      the level it is building over what is there, and writes the union back in
//      slug order — idempotent (re-running a1.1 reproduces the file byte for
//      byte) and order-free (a1.1 then a1.2 gives the same file as a1.2 then
//      a1.1). `RULE_CARD_LEVELS` records which levels have been built into it.
//
//   3b. RULE CARD OVERRIDES. scripts/rule-card-overrides.mjs, when it exists,
//      may replace a generated card wholesale: the cache is a snapshot of
//      `grammar_rules`, and the second DaF review found two A1.1 cards factually
//      wrong (`alphabet-pronunciation` names no German letter name; `time-and-dates`
//      is a number table that teaches the A1.2 ordinal rule). Until the rows
//      themselves are fixed the override file is the shortest correct path, and it
//      is optional on purpose — no file, no behaviour change.
//
//   4. ALPHABET SUPPLEMENT (a1.1 only). Filtering leaves the topic
//      `alphabet-pronunciation` EMPTY — all 15 of its bank items were English
//      sound questions or respellings, and that topic is the whole of Lektion 1,
//      the free lesson. So the buchstabieren items are generated here from the
//      curriculum's own Wortfeld (Lektion 1 and 2, the two Lektionen that draw
//      the topic): spell-out dictation, a missing letter, an orthography repair
//      and a spelling multiple choice — German prompt, German answer, words the
//      learner met in the dialogue. The curriculum module is read ONLY; re-run
//      this script after its Wortfeld changes, or the supplement drifts.
//
//   5. VERB-CUE REPAIR (REVIEW #3 BLOCKER 1). 58 typed items of the bank name
//      their verb ONLY in the English gloss — "Ich ___ viel." with `questionEn:
//      'I ___ a lot. (verb: arbeiten, ich)'` — so `lerne`, correct German from
//      the item's own Lektion, comes back wrong and writes a Konjugation tag
//      into the learner's error profile. The rule that catches the class lives
//      in quality.js; dropping all 58 would take `present-tense-regular` and
//      `separable-verbs-intro` below a Lektion's worth of items, so the cue is
//      REPAIRED first: it is appended to the German prompt ("Ich ___ viel.
//      (arbeiten)"), with the person only where German needs it to be
//      unambiguous (Sie = Plural/Singular/formal). `answer` and `accepted` are
//      never touched — the repair adds information to the prompt, it does not
//      change what counts as right. Whatever still fails afterwards is dropped.
//
//   5b. ARTICLE-CUE REPAIR (REVIEW #4 BLOCKER 2). The same shape, one part of
//      speech on: 42 typed items read "___ Tafel ist grün." and accept `Die`
//      alone, while "Eine Tafel ist grün." — faultless German from the same
//      Lektion's Wortfeld — comes back wrong with an Artikel tag. They sit in
//      Lektionen 4, 5 and 6, three consecutive PRIMARY series, so dropping them
//      is not on the table either. Repaired the same way: the task formula is
//      appended to the German prompt, "___ Tafel ist grün. (bestimmter
//      Artikel)", and `answer`/`accepted` are never touched. The repair runs on
//      the hand-written extras too — they pass through the same gate — and it is
//      idempotent: a prompt that already carries a bracket is left alone.
//
//   5c. THE SAME REPAIR, ASKED AS A QUESTION (REVIEW #5 BLOCKER 1). Round 4's
//      rule listened for `type === 'fill_blank'`, so three sentence-building
//      items of the same class survived it — "Schreiben Sie den Satz: [Honig /
//      ist / gut]" accepts only "Der Honig ist gut.", while "Honig ist gut." is
//      faultless German and comes back tagged VERBSTELLUNG. Two of the three are
//      Schreiben tasks of the GRADED Checkpoint 2. The predicate now reads the
//      FORM (an article in front of a noun in the expected sentence that the cue
//      list does not carry), and this script appends "(mit bestimmtem Artikel)"
//      rather than writing the article into the list, which would give the
//      gender away. Idempotent: the appended formula is what makes the item pass.
//
//   5d. NOT REPAIRED, ON PURPOSE (REVIEW #5 BLOCKER 2). `cue-answer-mismatch` —
//      a prompt that says "(bestimmter Artikel)" whose answer key wants
//      "das Heft" — has two plausible fixes (change the formula, or change the
//      key) and a build step may not pick one: that is authorship. Such an item
//      is excluded, and a hand-written EXTRA that trips it stops the build with
//      its id, which is what running the extras through the same gate is for.
//
//   6. REGISTER (REVIEW #3 MAJOR). The hand-written items siezen, the legacy
//      bank duzt: 39 du-imperatives against 30 Sie-forms in the shipped pool,
//      three of them in the drawn seven of the FREE Lektion 1, next to a
//      "Füllen Sie … aus". For an adult exam course that is a break on the first
//      screen. Normalised here rather than by hand, on the kept bank items, the
//      generated supplement and the hand-authored extras alike.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  filterPool, REASON, REASONS, isUsableItem, exclusionReason, parseVerbCue,
  articleAnswerKind, ARTICLE_CUE, missingSentenceArticle, SENTENCE_ARTICLE_CUE,
  isPoliteFormItem, minimalArticleCorrection,
} from '../src/data/lessonPools/quality.js';

const level = (process.argv[2] || 'a1.1').toLowerCase();
const cache = JSON.parse(readFileSync(new URL('../grammar-content-cache.json', import.meta.url), 'utf8'));
const topics = cache.topics.filter((t) => t.sub_level === level.toUpperCase());
const byId = new Map(topics.map((t) => [t.id, t]));
const raw = cache.exercises
  .filter((e) => byId.has(e.topic_id))
  .map((e) => ({
    id: e.id,
    topic: byId.get(e.topic_id).slug,
    type: e.exercise_type,
    stage: e.stage,
    difficulty: e.difficulty ?? 1,
    order: e.order_index ?? 0,
    questionDe: e.question_de,
    questionEn: e.question_en,
    options: Array.isArray(e.options) && e.options.length ? e.options : null,
    answer: e.correct_answer,
    accepted: Array.isArray(e.acceptable_answers) ? e.acceptable_answers : [],
    explanationDe: e.explanation_de || e.why_correct_de || '',
    hint: e.hint || null,
  }));

// ── REVIEW #3 BLOCKER 1: pull the verb cue into the German prompt ───────────
//
// The gloss says "(verb: arbeiten, ich)" and the German prompt says nothing, so
// the item accepts one verb out of a dozen that fit. The repair appends the
// infinitive — and, only where the German is genuinely ambiguous, the reading
// the answer assumes: `Sie` is she, they and the formal you at once, and the
// prefix-only items ask for the Vorsilbe rather than the finite verb.
function repairVerbCue(item) {
  // Only an item the cue is the ONLY thing wrong with: repairing the prompt of
  // an item that is dropped for another reason would put it in the report as a
  // fix when it is not one.
  if (exclusionReason(item, { level }) !== REASON.VERB_CUE_ONLY_IN_GLOSS) return null;
  const cue = parseVerbCue(item.questionEn);
  if (!cue || !cue.infinitive) return null;
  const person = cue.person || '';
  const subjectIsSie = /(^|[^a-zäöüß])sie([^a-zäöüß]|$)/i.test(String(item.questionDe || ''));
  let extra = '';
  if (cue.flag === 'prefix only') extra = ', nur die Vorsilbe';
  else if (subjectIsSie && /they|plural/i.test(person)) extra = ', Plural';
  else if (subjectIsSie && /she|singular/i.test(person)) extra = ', Singular';
  else if (cue.flag === 'formal question' || /formal|(^|[^a-z])Sie([^a-z]|$)/.test(person)) extra = ', Sie';
  const before = item.questionDe;
  item.questionDe = `${String(item.questionDe).trim()} (${cue.infinitive}${extra})`;
  return { id: item.id, topic: item.topic, before, after: item.questionDe };
}

const repaired = raw.map(repairVerbCue).filter(Boolean);

// ── REVIEW #4 BLOCKER 2: name the article family in the German prompt ───────
//
// Same pattern as repairVerbCue, and the same promise: the prompt gains
// information, the answer key does not change. Idempotent by construction — an
// item whose prompt already carries a bracket is not in the class at all, so a
// cue the item author wrote by hand is left exactly as written.
// REVIEW #5 BLOCKER 1 extends it by FORM, not by type: a sentence-building item
// whose expected sentence carries an article in front of a noun that the German
// cue list does not contain — "Schreiben Sie den Satz: [Honig / ist / gut]" →
// "Der Honig ist gut." — gets the task formula appended in the Dativ form
// ("(mit bestimmtem Artikel)"), because the alternative, writing the article
// INTO the cue list ("[der Honig / ist / gut]"), hands the learner the gender
// the item exists to test. `answer`/`accepted` stay untouched here too: after
// the repair the prompt demands what the key always required, which is the only
// direction a build step may close such a gap in.
function repairArticleCue(item) {
  if (exclusionReason(item, { level }) !== REASON.ARTICLE_CUE_ONLY_IN_GLOSS) return null;
  const sentenceKind = missingSentenceArticle(item);
  const kind = sentenceKind || articleAnswerKind(item);
  if (!kind) return null;
  const cue = sentenceKind ? SENTENCE_ARTICLE_CUE[kind] : ARTICLE_CUE[kind];
  const before = item.questionDe;
  item.questionDe = `${String(item.questionDe).trim()} ${cue}`;
  return { id: item.id, topic: item.topic, kind, shape: sentenceKind ? 'sentence' : 'gap', before, after: item.questionDe };
}

const articleRepaired = raw.map(repairArticleCue).filter(Boolean);

// ── REVIEW #6 BLOCKER 2: accept the minimal correction as well ──────────────
//
// „Ein Schere ist hier." → `Die Schere ist hier.` quotes a sentence with ONE
// error (the genus of the indefinite article) and accepts only an answer that
// also swaps the article FAMILY, which the German prompt never asks for. The
// minimal, complete correction — `Eine Schere ist hier.` — came back wrong.
//
// The repair is the same promise as the two above, from the other side: the
// answer key GAINS a reading, it never loses one. Both spellings the pool uses
// (with and without the closing period) are added, because `accepted` lists in
// this pool carry both and the engine compares strings. Where the counterpart
// is not computable — `ein` is `der` or `das`, and picking a gender is
// authorship — nothing is written and the gate drops the item.
const ambiguousRepaired = [];
const ambiguousUnrepairable = [];
function repairAmbiguousCorrection(item) {
  if (exclusionReason(item, { level }) !== REASON.AMBIGUOUS_CORRECTION) return;
  const minimal = minimalArticleCorrection(item);
  if (!minimal) {
    ambiguousUnrepairable.push({ id: item.id, topic: item.topic, answer: item.answer });
    return;
  }
  const added = [minimal, minimal.replace(/[.!?]+$/, '')]
    .filter((a) => a && ![item.answer, ...(item.accepted || [])].includes(a));
  if (!added.length) return;
  item.accepted = [...new Set([...(item.accepted || []), ...added])];
  ambiguousRepaired.push({ id: item.id, topic: item.topic, added });
}

raw.forEach(repairAmbiguousCorrection);

const { kept, excluded, counts } = filterPool(raw, { level });

/**
 * Widened `accepted` lists for legacy bank items, id → the full list.
 *
 * REVIEW #2 §L8 MAJOR: "Es ist ___. (18:20, umgangssprachlich)" accepted the one
 * string `zwanzig nach sechs`, so `sechs Uhr zwanzig` — the official form the
 * Lektion's own notice teaches — came back wrong. The cache is a snapshot of the
 * database, so the widening lives here rather than in a11.json, which is
 * generated. An id that no longer survives the filter is reported, not silently
 * ignored: a stale entry here would otherwise outlive the item it is about.
 */
const ACCEPTED_EXTRAS_BY_LEVEL = {
  'a1.1': {
    '827c155d-7b87-53a3-b047-d53ab532f296': ['zwanzig nach sechs', 'sechs Uhr zwanzig', 'zwanzig nach 6'],
  },
};

/** The widenings for the level being built — an id is only ever in one level. */
const ACCEPTED_EXTRAS = ACCEPTED_EXTRAS_BY_LEVEL[level] || {};

const acceptedApplied = [];
for (const [id, accepted] of Object.entries(ACCEPTED_EXTRAS)) {
  const item = kept.find((k) => k.id === id);
  if (!item) continue;
  item.accepted = [...new Set([item.answer, ...accepted])];
  acceptedApplied.push(id);
}

// ── the generated buchstabieren items ───────────────────────────────────────

/** Stable id for a generated item: uuid-shaped, derived from its key. */
function generatedId(key) {
  const h = createHash('sha1').update(`deutsch-meister/lesson-pool/${key}`).digest('hex');
  return [h.slice(0, 8), h.slice(8, 12), `5${h.slice(13, 16)}`, `8${h.slice(17, 20)}`, h.slice(20, 32)].join('-');
}

// ß has no uppercase in German spelling drills — toUpperCase() would turn it
// into SS and the item would then teach the wrong spelling.
const spellOut = (word) => word.split('').map((c) => (c === 'ß' ? 'ß' : c.toUpperCase())).join('-');

/** The ASCII transliteration a learner types when the umlaut key is missing. */
const flatten = (word) =>
  word.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss');

/**
 * Deterministic wrong spellings: umlaut/ß lost, a doubled letter lost, two
 * letters swapped, the penultimate letter dropped — the four mistakes a
 * beginner's dictation actually makes. A candidate that loses its last vowel
 * (Gruß → Grß) is thrown away: an obviously impossible word is not a distractor.
 */
function misspellings(word) {
  const plausible = (c) => c !== word && c.length >= 3 && /[aeiouäöü]/i.test(c);
  const chars = word.split('');
  const i = Math.floor(chars.length / 2);
  if (chars.length > 3) [chars[i - 1], chars[i]] = [chars[i], chars[i - 1]];
  const candidates = [
    flatten(word),
    word.replace(/(.)\1/, '$1'),
    chars.join(''),
    word.slice(0, -2) + word.slice(-1),
  ];
  return [...new Set(candidates.filter(plausible))].slice(0, 3);
}

/**
 * The German letter NAMES a beginner has to be able to say on the phone —
 * exactly the pairs the Lektion-1 notice card warns about (E/I, G/J, V/W, Y, ß).
 */
const LETTER_NAMES = [
  { letter: 'ß', name: 'Eszett', accepted: ['Eszett', 'eszett', 'scharfes S', 'scharfes s'] },
  { letter: 'Y', name: 'Ypsilon', accepted: ['Ypsilon', 'ypsilon'] },
  { letter: 'J', name: 'Jot', accepted: ['Jot', 'jot', 'Jott', 'jott'] },
  { letter: 'V', name: 'Vau', accepted: ['Vau', 'vau'] },
  { letter: 'Z', name: 'Zett', accepted: ['Zett', 'zett'] },
];

const ALPHABET_TOPIC = 'alphabet-pronunciation';

/**
 * The engine's answer comparison treats ä/ae, ö/oe, ü/ue and ß/ss as the same
 * string (src/utils/answerMatch.js), so an item may never hinge on that
 * difference: "Gruss" and "Gruß" are one answer, and a distractor spelled the
 * ASCII way would be marked correct.
 */
const sameAnswer = (a, b) =>
  a.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss') ===
  b.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');

function alphabetItems(curriculum) {
  const lektionen = (curriculum.lektionen || []).filter((l) =>
    ((l.practiceRule && l.practiceRule.topics) || []).includes(ALPHABET_TOPIC),
  );
  const seen = new Set();
  const entries = [];
  for (const l of lektionen) {
    for (const w of l.wortfeld || []) {
      const word = String(w.word || '').trim();
      if (!/^[A-Za-zÄÖÜäöüß]{4,16}$/.test(word) || seen.has(word.toLowerCase())) continue;
      seen.add(word.toLowerCase());
      entries.push({ word, article: w.article || null, en: w.en || '' });
    }
  }
  const words = entries.map((e) => e.word);

  const items = [];
  const push = (kind, key, fields) => {
    items.push({
      id: generatedId(`${level}/${ALPHABET_TOPIC}/${kind}/${key}`),
      topic: ALPHABET_TOPIC,
      type: fields.options ? 'multiple_choice' : 'fill_blank',
      stage: 4,
      difficulty: 1,
      order: items.length + 1,
      generated: 'buchstabieren aus dem Wortfeld (scripts/build-lesson-pool.mjs)',
      ...fields,
    });
  };

  // 1. spell-out dictation — typed, the core Lektion-1 skill
  const spelled = new Set(words.slice(0, 12));
  for (const word of spelled) {
    push('spell-out', word, {
      questionDe: `Lesen Sie die Buchstaben: ${spellOut(word)}. Schreiben Sie das Wort: ___`,
      questionEn: 'Spelled out letter by letter. Write the word.',
      options: null,
      answer: word,
      accepted: [word],
      explanationDe: `Buchstabe für Buchstabe: ${spellOut(word)} = ${word}.`,
      hint: `${word.length} Buchstaben.`,
    });
  }

  // 2. the letter names — typed, and the item Lektion 1 cannot do without:
  //    on the phone a learner says the NAME of the letter, not its sound.
  for (const { letter, name, accepted } of LETTER_NAMES) {
    push('letter-name', letter, {
      questionDe: `Wie heißt der Buchstabe ${letter} auf Deutsch? ___`,
      questionEn: 'What is this letter called in German?',
      options: null,
      answer: name,
      accepted,
      explanationDe: `Der Buchstabe ${letter} heißt ${name}.`,
      hint: 'Der Name des Buchstaben, nicht der Laut.',
    });
  }

  // 3. spelled out and written WITH its article — the form-filling version of
  //    the same skill, and the one place where a slip is visible to the engine.
  //    Words already used by template 1 are skipped so the two stems differ.
  for (const e of entries.filter((x) => x.article && !spelled.has(x.word)).slice(0, 5)) {
    push('spell-out-article', e.word, {
      questionDe: `Lesen Sie die Buchstaben: ${spellOut(e.word)}. Schreiben Sie das Wort mit Artikel: ___`,
      questionEn: 'Write the word with its article.',
      options: null,
      answer: `${e.article} ${e.word}`,
      accepted: [`${e.article} ${e.word}`],
      explanationDe: `${e.article} ${e.word} — ${spellOut(e.word)}.`,
      hint: 'der, die oder das?',
    });
  }

  // 4. spelling multiple choice — recognition, at most two per Lektion anyway
  for (const word of words.slice(0, 16).filter((_, i) => i % 4 === 2)) {
    const wrong = misspellings(word).filter((w) => !sameAnswer(w, word));
    if (wrong.length < 2) continue;
    push('spelling-mc', word, {
      questionDe: 'Welche Schreibweise ist richtig?',
      questionEn: 'Which spelling is correct?',
      options: [word, ...wrong].sort((a, b) => a.localeCompare(b, 'de')),
      answer: word,
      accepted: [word],
      explanationDe: `${word} — ${spellOut(word)}.`,
      hint: 'Achte auf Doppelbuchstaben, Umlaute und ß.',
    });
  }

  return items;
}

let supplement = [];
if (level === 'a1.1') {
  const { CURRICULUM_A11 } = await import('../src/data/curricula/a11.js');
  supplement = alphabetItems(CURRICULUM_A11);
  const leaked = supplement.filter((it) => !isUsableItem(it));
  if (leaked.length) {
    console.error(`generated items fail the quality rules: ${leaked.map((l) => l.id).join(', ')}`);
    process.exit(1);
  }
}

// ── the rule cards for netlify/functions/_shared/ruleCards.mjs ──────────────
//
// One card per topic of THIS level: the German-facing text of the topic's first
// real rule (the `introduction` at order_index -1 is a marketing hook, not a
// rule) plus its common mistakes. `explain-answer.mjs` puts the card in the
// system prompt so the model explains the course's own rule rather than an
// invented one. Generated, never hand-edited — the whole point is that the card
// and the item come out of the same cache in the same run.
const RULE_CARDS_TARGET = new URL('../netlify/functions/_shared/ruleCards.mjs', import.meta.url);
const CARD_MAX_CHARS = 1200;

/** German first: a card is grounding for a German answer, not a translation. */
const germanFirst = (obj, ...keys) => {
  for (const k of keys) if (typeof obj[k] === 'string' && obj[k].trim()) return obj[k].trim();
  return '';
};

/** The rule's content object → plain text. Tables become one row per line. */
function flattenContent(content) {
  if (!content || typeof content !== 'object') return String(content || '').trim();
  const parts = [];
  const push = (v) => { if (typeof v === 'string' && v.trim()) parts.push(v.trim()); };
  push(germanFirst(content, 'description_de', 'content_de', 'description_en', 'content_en', 'intro_en'));
  if (Array.isArray(content.headers) && Array.isArray(content.rows)) {
    push(content.headers.join(' | '));
    for (const row of content.rows) push(Array.isArray(row) ? row.join(' | ') : String(row));
  }
  for (const step of content.steps || []) {
    push(typeof step === 'string' ? step : germanFirst(step, 'text_de', 'title_de', 'text_en', 'title_en'));
  }
  for (const group of content.groups || []) {
    push(typeof group === 'string' ? group : [group.title_de || group.title_en, (group.items || []).join(', ')].filter(Boolean).join(': '));
  }
  for (const point of content.points || []) push(typeof point === 'string' ? point : germanFirst(point, 'text_de', 'text_en'));
  for (const para of content.paragraphs_en || []) push(para);
  return parts.join('\n').slice(0, CARD_MAX_CHARS);
}

/** [{ wrong, correct, explanationDe }] — at most three, the ones a card can carry. */
function mistakesFor(rules) {
  for (const r of rules) {
    if (!Array.isArray(r.common_mistakes) || !r.common_mistakes.length) continue;
    return r.common_mistakes.slice(0, 3).map((m) => ({
      wrong: String(m.wrong || ''),
      correct: String(m.correct || ''),
      explanationDe: String(m.explanation_de || m.explanation_en || ''),
    }));
  }
  return [];
}

/**
 * scripts/rule-card-overrides.mjs → { [slug]: card }, or {} when absent. Kept
 * as a dynamic import so the file is genuinely optional.
 */
async function ruleCardOverrides() {
  const url = new URL('./rule-card-overrides.mjs', import.meta.url);
  if (!existsSync(url)) return {};
  const mod = await import(url.href);
  const overrides = mod.default || {};
  console.log(`rule-card overrides: ${Object.keys(overrides).length} card(s) from ${url.pathname}`);
  return overrides;
}

/**
 * The cards already committed, plus the levels they were generated from. A fresh
 * checkout always has a file (a1.1's); a missing or unreadable one is not fatal —
 * the run simply rebuilds what it can, i.e. this level.
 */
async function committedRuleCards() {
  if (!existsSync(RULE_CARDS_TARGET)) return { cards: {}, levels: [] };
  try {
    const mod = await import(`${RULE_CARDS_TARGET.href}?t=${Date.now()}`);
    return {
      cards: { ...(mod.RULE_CARDS || {}) },
      levels: Array.isArray(mod.RULE_CARD_LEVELS) ? [...mod.RULE_CARD_LEVELS] : ['a1.1'],
    };
  } catch (err) {
    console.error(`could not read the committed rule cards (${err.message}) — rebuilding from this level only`);
    return { cards: {}, levels: [] };
  }
}

async function writeRuleCards() {
  const cards = {};
  for (const topic of [...topics].sort((a, b) => a.slug.localeCompare(b.slug))) {
    const rules = (cache.rules || [])
      .filter((r) => r.topic_id === topic.id)
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    // Which rule grounds the card: a table of the actual forms beats prose, and
    // German prose beats the English explainer — the answer is written in German
    // for an A1 learner, so English-only grounding is the weakest option.
    const real = rules.filter((r) => (r.order_index ?? 0) >= 0 && flattenContent(r.content).length >= 40);
    const rank = (r) => {
      const c = r.content || {};
      const german = Boolean(c.description_de || c.content_de);
      const table = Array.isArray(c.rows) && c.rows.length;
      if (german && table) return 0;
      if (table) return 1;
      if (german) return 2;
      return 3;
    };
    const chosen = [...real].sort((a, b) => rank(a) - rank(b) || (a.order_index ?? 0) - (b.order_index ?? 0))[0] || rules[0];
    if (!chosen) continue;
    cards[topic.slug] = {
      titleDe: chosen.title_de || topic.title_de || topic.slug,
      content: flattenContent(chosen.content),
      commonMistakes: mistakesFor(rules),
    };
  }
  for (const [slug, card] of Object.entries(await ruleCardOverrides())) {
    if (cards[slug]) cards[slug] = { ...cards[slug], ...card };
  }
  // The union with what is committed: this level's cards win for their own
  // slugs, every other level's cards are carried through untouched, and the
  // result is written in slug order so the file does not depend on the order the
  // levels were built in.
  const { cards: committed, levels: builtLevels } = await committedRuleCards();
  const merged = { ...committed, ...cards };
  const ordered = Object.fromEntries(Object.keys(merged).sort().map((slug) => [slug, merged[slug]]));
  const levels = [...new Set([...builtLevels, level])].sort();
  const header = [
    '// GENERATED by scripts/build-lesson-pool.mjs — do not edit by hand.',
    `// Source: grammar-content-cache.json (dumpedAt ${cache.dumpedAt}), sub_level(s) ${levels.map((l) => l.toUpperCase()).join(', ')}.`,
    '// One card per grammar topic: the course\'s own rule text, used by',
    '// netlify/functions/explain-answer.mjs to ground the "Erklär mir das" answer.',
    '// One map for every level — a slug belongs to one sub_level, so the builder',
    '// merges the level it runs for over the committed cards and writes both back.',
    `// Re-run \`node scripts/build-lesson-pool.mjs <level>\` (${levels.join(', ')}) after refreshing the cache.`,
    '',
    `export const RULE_CARDS = ${JSON.stringify(ordered, null, 2)};`,
    '',
    '/** The levels whose topics have been generated into the map above. */',
    `export const RULE_CARD_LEVELS = ${JSON.stringify(levels)};`,
    '',
    '/** The card for a topic slug, or null when the topic has none. */',
    'export function ruleCard(slug) {',
    '  return RULE_CARDS[String(slug || \'\').toLowerCase()] || null;',
    '}',
    '',
    '/** The card as the plain text block the prompt carries. */',
    'export function ruleCardText(slug) {',
    '  const card = ruleCard(slug);',
    '  if (!card) return \'\';',
    '  const mistakes = (card.commonMistakes || [])',
    '    .map((m) => `Falsch: ${m.wrong} — Richtig: ${m.correct}. ${m.explanationDe}`)',
    '    .join(\'\\n\');',
    '  return [`Regel: ${card.titleDe}`, card.content, mistakes].filter(Boolean).join(\'\\n\');',
    '}',
    '',
  ].join('\n');
  writeFileSync(RULE_CARDS_TARGET, header);
  console.log(`→ ${RULE_CARDS_TARGET.pathname} (${Object.keys(ordered).length} rule cards for ${levels.join(', ')}` +
    `, ${Object.keys(cards).length} from ${level})`);
}

// ── the hand-authored extra items ───────────────────────────────────────────
const extraUrl = new URL(`../src/data/lessonPools/${level.replace('.', '')}.extra.json`, import.meta.url);
let extra = [];
if (existsSync(extraUrl)) {
  const parsed = JSON.parse(readFileSync(extraUrl, 'utf8'));
  extra = Array.isArray(parsed) ? parsed : parsed.items || [];
  // REVIEW #4 BLOCKER 2: the extras go through the same gate, so they get the
  // same repair — and because the repair skips any prompt that already carries
  // a bracket, an item whose author wrote the cue by hand is untouched.
  for (const r of extra.map(repairArticleCue).filter(Boolean)) articleRepaired.push(r);
  // REVIEW #6 BLOCKER 2, same order and for the same reason: the extras face
  // the same gate, so they get the same repair first.
  extra.forEach(repairAmbiguousCorrection);
  // The same rules as the bank, applied to hand-written items on purpose: the
  // point of the filter is that NO item reaches a learner unchecked.
  const failing = extra.map((it) => [it, exclusionReason(it, { level })]).filter(([, r]) => r);
  if (failing.length) {
    console.error(`${extraUrl.pathname}: ${failing.length} item(s) fail the quality rules:`);
    for (const [it, reason] of failing) console.error(`  ${it.id}  ${reason}`);
    process.exit(1);
  }
  const clash = extra.filter((it) => kept.some((k) => k.id === it.id));
  if (clash.length) {
    console.error(`${extraUrl.pathname}: id already in the cache: ${clash.map((c) => c.id).join(', ')}`);
    process.exit(1);
  }
  const dupes = extra.map((it) => it.id).filter((id, i, all) => all.indexOf(id) !== i);
  if (dupes.length) {
    console.error(`${extraUrl.pathname}: duplicate ids: ${[...new Set(dupes)].join(', ')}`);
    process.exit(1);
  }
}

// ── REVIEW #4 MAJOR: `accepted` from one source, not one item at a time ─────
//
// The review measured `accepted` contradicting itself INSIDE a Lektion:
// `extra-a11-l10-01` ("___ der Zug nach Österreich?") takes Fährt/Geht/Kommt,
// `extra-a11-l10-06` ("___ du morgen mit dem Bus?") takes Fährt/Kommt but marks
// `Gehst` wrong — the round-2 fix was made for one id and stayed an island.
//
// Deliberately NARROW. A blanket "fahren ≈ gehen ≈ kommen" is not true German
// (`Ich gehe nach Berlin` is not `Ich fahre nach Berlin`), so the table is only
// applied where the item HAS ALREADY DECIDED that the frame takes more than one
// verb: its own `accepted` lists two or more distinct lemmas of the group, or
// its id stands in the map below. Everything else keeps the answer key its
// author wrote — including `extra-a11-l10-07`, whose prompt names `(fahren)`.
const EQUIVALENT_VERBS = { fahren: ['gehen', 'kommen'] };

/** The finite forms of the group's head verb → the suffix the others take. */
const FAHREN_FORMS = { fahre: 'e', fährst: 'st', fährt: 't', fahren: 'en', fahrt: 't' };
const VERB_STEMS = { gehen: 'geh', kommen: 'komm' };

/** Ids that opt in explicitly, id → the group head. Empty is the honest state. */
const EQUIVALENT_VERB_IDS = {};

/**
 * REVIEW #6 MAJOR 10. The group is per LEMMA; German equivalence is per FRAME.
 * `extra-a11-l10-06` ("___ du morgen mit dem Bus?") had `Gehst` in its accepted
 * list and a green tick on a sentence that is not German: one fährt or kommt
 * mit dem Bus, one does not gehen with it — the contrast A1 learners with a
 * romance or slavic first language miss most often. A lemma is not added when
 * its blocker matches the German prompt.
 */
const PP_BLOCKS = { gehen: /\bmit (dem|der) \w+/i };

const lower = (t) => String(t || '').trim().toLowerCase();
const capitalise = (w) => w.charAt(0).toUpperCase() + w.slice(1);

// `groupLemma()` — "which lemma of the group does this accepted form belong
// to?" — is gone with the heuristic it served (REVIEW #6 MAJOR 10): counting
// the lemmas an item already allows was the guess about authorial intent that
// let `Gehst du morgen mit dem Bus?` through.

const verbWidened = [];
const HEAD = 'fahren';
function widenEquivalentVerbs(item) {
  const head = HEAD;
  const suffix = FAHREN_FORMS[lower(item.answer)];
  if (!suffix) return;
  const accepted = [...new Set([item.answer, ...(item.accepted || [])])];
  const optedIn = EQUIVALENT_VERB_IDS[item.id] === head;
  // REVIEW #6 MAJOR 10: the heuristic "the item already allows two lemmas, so
  // its author meant the frame to be open" is a guess about intent, and it was
  // wrong — `extra-a11-l10-06` allowed `fahren` and `kommen` because those two
  // fit, and the table then added `gehen`, which does not. Only an explicit
  // opt-in decides now, and the map above being empty is the honest state.
  if (!optedIn) return;
  const added = [];
  for (const lemma of EQUIVALENT_VERBS[head]) {
    if (PP_BLOCKS[lemma] && PP_BLOCKS[lemma].test(String(item.questionDe || ''))) continue;
    const form = VERB_STEMS[lemma] + suffix;
    // Both cases, because a gap at position 1 is written with a capital and the
    // same form mid-sentence is not — the engine folds case, the list documents.
    for (const variant of [capitalise(form), form]) {
      if (accepted.includes(variant)) continue;
      accepted.push(variant);
      added.push(variant);
    }
  }
  if (!added.length) return;
  item.accepted = accepted;
  verbWidened.push({ id: item.id, added });
}

// The clock the same way: "Viertel nach acht" and "acht Uhr fünfzehn" are the
// same time, and the Lektion-8 rule card teaches both — but the second is the
// OFFICIAL form, so an item that asks for the colloquial one BY NAME
// ("umgangssprachlich") must not silently accept it.
const HOURS = ['zwölf', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
const QUARTER_RE = /^Viertel (nach|vor) (\w+)$/i;

const timeWidened = [];
function widenEquivalentTime(item) {
  const m = QUARTER_RE.exec(String(item.answer || '').trim());
  if (!m) return;
  if (/umgangssprachlich/i.test(String(item.questionDe || ''))) return;
  const hour = HOURS.indexOf(lower(m[2]) === 'ein' ? 'eins' : lower(m[2]));
  if (hour < 1) return;
  const official = /^nach$/i.test(m[1])
    ? `${HOURS[hour]} Uhr fünfzehn`
    : `${HOURS[hour - 1]} Uhr fünfundvierzig`;
  const accepted = [item.answer, ...(item.accepted || [])];
  if (accepted.some((a) => lower(a) === lower(official))) return;
  item.accepted = [...new Set([...accepted, official])];
  timeWidened.push({ id: item.id, added: official });
}

for (const item of [...kept, ...supplement, ...extra]) {
  widenEquivalentVerbs(item);
  widenEquivalentTime(item);
}

// ── the rule cards the explain-answer function is grounded in ────────────────
await writeRuleCards();

// ── REVIEW #3 MAJOR: one register, and it is the Sie-register ───────────────
//
// The bank duzt ("Schreib den Satz: …"), the 116 hand-written items siezen
// ("Bilden Sie den Satz: …"), and the shipped pool put both in the drawn seven
// of the free Lektion 1. The rewrite is unanchored and whole-word, so a formula
// in the middle of a prompt travels with its own text ("Finde den Fehler und
// schreib den Satz richtig" → "Finden Sie den Fehler und schreiben Sie den Satz
// richtig") and a sentence-initial one keeps its capital. `Buchstabiert:` is
// in the table for a different reason (REVIEW #4 MAJOR): it is not a register
// slip but a factual one. The player renders text — PracticeItem.jsx plays no
// audio — so the learner READS the letters that already stand in the prompt;
// "Buchstabiert:" claims a listening act that does not happen, in the same line
// as "Schreiben Sie das Wort". The truthful label is "Lesen Sie die
// Buchstaben:", which also keeps the `/Buchstab/` mark the L1 spelling items
// are identified by.
const BUCHSTABIERT_RE = /^Buchstabiert:\s*/;
const BUCHSTABIERT_TO = 'Lesen Sie die Buchstaben: ';

const REGISTER = [
  [/\bschreibe?\b/gi, 'schreiben Sie'],
  [/\bbilde\b/gi, 'bilden Sie'],
  [/\bergänze\b/gi, 'ergänzen Sie'],
  [/\bkorrigiere\b/gi, 'korrigieren Sie'],
  [/\bsetze\b/gi, 'setzen Sie'],
  [/\bwähle\b/gi, 'wählen Sie'],
  [/\bfinde\b/gi, 'finden Sie'],
  [/\bantworte\b/gi, 'antworten Sie'],
];

/** Sentence-initial (or prompt-initial) words keep their capital letter. */
const recapitalise = (text) =>
  text.replace(/(^|[.!?:„"“]\s*|→\s*)([a-zäöüß])/g, (_, lead, ch) => lead + ch.toUpperCase());

const buchstabiertRewrites = [];

function normaliseRegister(item) {
  const before = String(item.questionDe || '');
  let after = before;
  if (BUCHSTABIERT_RE.test(after)) {
    after = after.replace(BUCHSTABIERT_RE, BUCHSTABIERT_TO);
    buchstabiertRewrites.push({ id: item.id, before, after });
  }
  for (const [re, to] of REGISTER) after = after.replace(re, to);
  if (after === before) return null;
  item.questionDe = recapitalise(after);
  return { id: item.id, before, after: item.questionDe };
}

const normalised = [...kept, ...supplement, ...extra].map(normaliseRegister).filter(Boolean);

// ── REVIEW #6 BLOCKER 1: derive the polite-form case flag ───────────────────
//
// Round 5 set `caseSensitive: true` on the three items it had found by hand,
// and round 6 measured what a list costs: two items of exactly the same shape
// never got it, so `Frau Müller, ___ sind sehr freundlich.` counted `sie` as a
// typo — i.e. as CORRECT — while the identical `Frau Kaya, sprechen ___
// Englisch?` marked it wrong. Two of the unflagged ones are items of the GRADED
// Checkpoint 4, whose own rule card says the polite Ihr is "immer mit großem I".
//
// So the flag is DERIVED from the answer key here and the hand entry is kept as
// an override (`=== true ||`), never as a veto: an author may flag an item the
// predicate does not see — `extra-a11-l12-16`, whose polite Ihr is the FIRST
// word of the corrected sentence — but may not unflag one it does.
//
// Runs last, after the widening passes: `politeCaseItem` reads `accepted`.
//
// The override for a BANK item, id → why. A cache item cannot carry a hand
// flag — the cache is a snapshot of the database — so this map is where one
// lives, and it stays as short as EXCLUDE_IDS: one entry, the one the review
// measured. `c473031c` is `a1.1-cp4-bausteine-1` of the GRADED Checkpoint 4,
// and `isItemCorrect(item, 'Sind sie Frau Meier?')` came back true. The
// derived predicate does not reach it on purpose (its sentence clause is
// narrowed to the possessive, so a word-order item does not become wholly
// wrong over one capital), which is exactly what an override is for.
const CASE_SENSITIVE_IDS_BY_LEVEL = {
  'a1.1': {
    'c473031c-a540-5e7a-95a9-9a1fa803bff0': 'polite Sie in a graded Checkpoint-4 Frage (REVIEW #6 BLOCKER 1)',
  },
};
const CASE_SENSITIVE_IDS = CASE_SENSITIVE_IDS_BY_LEVEL[level] || {};

const caseDerived = [];
const caseHandFlagged = [];
const caseOverridden = [];
for (const item of [...kept, ...supplement, ...extra]) {
  if (Object.prototype.hasOwnProperty.call(CASE_SENSITIVE_IDS, item.id) && item.caseSensitive !== true) {
    item.caseSensitive = true;
    caseOverridden.push(item.id);
  }
  const hand = item.caseSensitive === true;
  const derived = isPoliteFormItem(item);
  if (hand) caseHandFlagged.push(item.id);
  else if (derived) caseDerived.push({ id: item.id, topic: item.topic, answer: item.answer });
  if (hand || derived) item.caseSensitive = true;
}

const items = [...kept, ...supplement, ...extra].sort(
  (a, b) => a.topic.localeCompare(b.topic) || a.stage - b.stage || a.order - b.order,
);

const out = { level, builtFrom: cache.dumpedAt, count: items.length, items };
const target = new URL(`../src/data/lessonPools/${level.replace('.', '')}.json`, import.meta.url);
writeFileSync(target, JSON.stringify(out, null, 1) + '\n');

// ── what got dropped, and what the topics look like afterwards ───────────────
const byReason = Object.entries(counts).filter(([, n]) => n > 0);
console.log(`${level}: ${raw.length} in cache → ${kept.length} kept + ${supplement.length} generated + ${extra.length} hand-authored = ${items.length}`);
console.log(`excluded ${excluded.length}:`);
for (const reason of REASONS) {
  const n = counts[reason] || 0;
  if (!n) continue;
  console.log(`  ${String(n).padStart(3)}  ${reason}`);
  // The drop list is the point of the filter, so it is readable: a rule that
  // throws away a good item has to be visible in this output, not in a count.
  for (const ex of excluded.filter((e) => e.reason === reason)) {
    console.log(`       ${ex.id.slice(0, 8)} ${ex.topic} · ${String(ex.questionDe || '').replace(/\s+/g, ' ').slice(0, 64)} → ${ex.answer}`);
  }
}
if (!byReason.length) console.log('  (nothing)');
console.log(`repaired verb cues (REVIEW #3 BLOCKER 1): ${repaired.length}`);
for (const r of repaired) console.log(`       ${r.id.slice(0, 8)} ${r.topic} · ${r.after}`);
const stillFailing = excluded.filter((e) => e.reason === 'verb-cue-only-in-gloss');
if (stillFailing.length) console.log(`  still verb-cue-only after the repair: ${stillFailing.length}`);
console.log(`repaired article cues (REVIEW #4 BLOCKER 2 · #5 BLOCKER 1): ${articleRepaired.length}` +
  ` (bestimmt ${articleRepaired.filter((r) => r.kind === 'definite').length}` +
  ` · unbestimmt ${articleRepaired.filter((r) => r.kind === 'indefinite').length}` +
  ` · davon Satzbau ${articleRepaired.filter((r) => r.shape === 'sentence').length})`);
for (const r of articleRepaired) console.log(`       ${String(r.id).slice(0, 8)} ${r.topic} · ${r.after}`);
const stillArticle = excluded.filter((e) => e.reason === REASON.ARTICLE_CUE_ONLY_IN_GLOSS);
if (stillArticle.length) console.log(`  still article-cue-only after the repair: ${stillArticle.length}`);
console.log(`Buchstabiert → Lesen Sie die Buchstaben (REVIEW #4 MAJOR): ${buchstabiertRewrites.length}`);
console.log(`register normalisations (Sie-Form): ${normalised.length}`);
for (const r of normalised) console.log(`       ${String(r.id).slice(0, 8)} · ${r.after}`);
if (acceptedApplied.length) console.log(`widened accepted on ${acceptedApplied.length}: ${acceptedApplied.map((i) => i.slice(0, 8)).join(', ')}`);
console.log(`equivalent-verb widenings (REVIEW #4 MAJOR): ${verbWidened.length}`);
for (const r of verbWidened) console.log(`       ${r.id} + ${r.added.join(', ')}`);
console.log(`ambiguous corrections repaired (REVIEW #6 BLOCKER 2): ${ambiguousRepaired.length}` +
  ` · not computable, dropped: ${ambiguousUnrepairable.length}`);
for (const r of ambiguousRepaired) console.log(`       ${r.id} + ${r.added.join(', ')}`);
for (const r of ambiguousUnrepairable) console.log(`       DROPPED ${r.id} · ${r.answer}`);
console.log(`polite-form caseSensitive (REVIEW #6 BLOCKER 1): ${caseDerived.length} derived` +
  ` + ${caseHandFlagged.length} hand-flagged (of them ${caseOverridden.length} by id here)`);
for (const r of caseDerived) console.log(`       ${r.id} ${r.topic} → ${r.answer}`);
console.log(`equivalent-time widenings (REVIEW #4 MAJOR): ${timeWidened.length}`);
for (const r of timeWidened) console.log(`       ${r.id} + ${r.added}`);
const staleAccepted = Object.keys(ACCEPTED_EXTRAS).filter((id) => !acceptedApplied.includes(id));
if (staleAccepted.length) console.log(`ACCEPTED_EXTRAS ids no longer in the pool: ${staleAccepted.join(', ')}`);
const perTopic = new Map();
for (const it of items) perTopic.set(it.topic, (perTopic.get(it.topic) || 0) + 1);
console.log('items per topic:');
for (const [topic, n] of [...perTopic].sort()) console.log(`  ${String(n).padStart(3)}  ${topic}`);
console.log(`→ ${target.pathname}`);
