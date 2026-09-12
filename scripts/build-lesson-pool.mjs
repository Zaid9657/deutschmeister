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
//   2. ALPHABET SUPPLEMENT (a1.1 only). Filtering leaves the topic
//      `alphabet-pronunciation` EMPTY — all 15 of its bank items were English
//      sound questions or respellings, and that topic is the whole of Lektion 1,
//      the free lesson. So the buchstabieren items are generated here from the
//      curriculum's own Wortfeld (Lektion 1 and 2, the two Lektionen that draw
//      the topic): spell-out dictation, a missing letter, an orthography repair
//      and a spelling multiple choice — German prompt, German answer, words the
//      learner met in the dialogue. The curriculum module is read ONLY; re-run
//      this script after its Wortfeld changes, or the supplement drifts.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { filterPool, REASONS, isUsableItem } from '../src/data/lessonPools/quality.js';

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

const { kept, excluded, counts } = filterPool(raw);

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
      questionDe: `Buchstabiert: ${spellOut(word)}. Schreib das Wort: ___`,
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
      questionDe: `Buchstabiert: ${spellOut(e.word)}. Schreib das Wort mit Artikel: ___`,
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

const items = [...kept, ...supplement].sort(
  (a, b) => a.topic.localeCompare(b.topic) || a.stage - b.stage || a.order - b.order,
);

const out = { level, builtFrom: cache.dumpedAt, count: items.length, items };
const target = new URL(`../src/data/lessonPools/${level.replace('.', '')}.json`, import.meta.url);
writeFileSync(target, JSON.stringify(out, null, 1) + '\n');

// ── what got dropped, and what the topics look like afterwards ───────────────
const byReason = Object.entries(counts).filter(([, n]) => n > 0);
console.log(`${level}: ${raw.length} in cache → ${kept.length} kept + ${supplement.length} generated = ${items.length}`);
console.log(`excluded ${excluded.length}:`);
for (const reason of REASONS) {
  const n = counts[reason] || 0;
  if (n) console.log(`  ${String(n).padStart(3)}  ${reason}`);
}
if (!byReason.length) console.log('  (nothing)');
const perTopic = new Map();
for (const it of items) perTopic.set(it.topic, (perTopic.get(it.topic) || 0) + 1);
console.log('items per topic:');
for (const [topic, n] of [...perTopic].sort()) console.log(`  ${String(n).padStart(3)}  ${topic}`);
console.log(`→ ${target.pathname}`);
