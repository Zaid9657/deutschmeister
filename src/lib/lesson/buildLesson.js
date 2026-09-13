// The lesson engine's builder: curriculum data + exercise pool → the ordered
// list of stages the player walks through (docs/course-standard-2026-09-12.md
// §3, shapes in docs/course-factory/a11-rebuild/CONTRACT.md).
//
// Pure and deterministic on purpose. The 7 controlled-practice items are drawn
// with a seeded PRNG keyed on (level, lektion nr, attempt), so tests can pin
// exactly which items a learner gets, a retry gives a DIFFERENT seven, and the
// page can rebuild the same lesson after a reload without storing the picks.
// The seed alone never made that true — DaF review #9 MAJOR 1 measured attempt 2
// repeating 62 of attempt 1's 84 items — so attempt n also EXCLUDES what the
// attempts before it drew (rule 7), and the attempt number itself is derived
// from the learner's own progress (`attemptFromCompletions`), not held at 1.
//
// SELECTION IS PLANNED FOR THE WHOLE LEVEL AT ONCE (`planPractice`), not per
// call. The DaF review of 2026-09-12 measured what a per-call draw produced:
// `das Mädchen` drilled in five of twelve Lektionen, eight items repeated
// verbatim in a later Lektion, the Lektion's OWN grammar point in the minority
// in L5 and L8, and not one item in 84 containing a word from the Lektion's
// Wortfeld other than by accident. None of that is visible from inside a single
// Lektion, so the plan walks the Lektionen in order and carries what has been
// used — see planPractice for the five rules it enforces.
import { isUsableItem, drillsSlug } from '../../data/lessonPools/quality.js';

/** Tiny seeded PRNG (mulberry32, public domain). 32-bit state, uniform [0,1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable 32-bit hash of the (level, nr, attempt) triple — the practice seed. */
export function seedFor(level, nr, attempt = 1) {
  const key = `${String(level || '').toLowerCase()}|${nr}|${attempt}`;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A pool file (`{ items: [...] }`) or a bare array — both are accepted. */
export const poolItems = (pool) => (Array.isArray(pool) ? pool : (pool && pool.items) || []);

/**
 * Typed production vs recognition (CONTRACT.md, "Pool items"):
 * a fill_blank WITH options is a chip/recognition item; WITHOUT it is typed.
 */
export const isTypedItem = (it) =>
  it.type === 'sentence_building' ||
  it.type === 'error_correction' ||
  (it.type === 'fill_blank' && !(it.options && it.options.length));

export const isMultipleChoice = (it) => it.type === 'multiple_choice';

export const PRACTICE_SIZE = 7;
export const MAX_MULTIPLE_CHOICE = 2;
/** The Lektion's own grammar point must supply at least this many of the seven. */
export const PRIMARY_MIN = 4;
/**
 * THE SITUATION FLOOR (DaF review #12 MAJOR 4, the half of round 11's MAJOR 1
 * that was never written). `relevanceScore` has ranked the draw by the Lektion's
 * own Wortfeld since round 9 — and a sort key is not a floor. Measured on the
 * shipped pool before this rule: L7 („Freizeit und Hobbys") served attempt 3
 * with TWO of seven items containing a word of its own Wortfeld — Tschüss,
 * Berlin, a baby and a brother — while every cap reported green and
 * `relaxUsed` was 0, because nothing asked. A learner repeating a Lektion meets
 * the third draw, and the third draw is where he finds out whether the product
 * is a situation or a grammar bank.
 *
 * The floor is the same 4 of 7 as `PRIMARY_MIN` for the same reason: a majority
 * of the seven has to be about the thing the Lektion is about. It is a FILL
 * PASS, not a cap — `pickPracticeItems` seats situational items before the
 * general fill, at whatever relaxation stage it has already reached, and it
 * never takes a seat `PRIMARY_MIN` still needs. So the floor can never cost the
 * grammar share, a cap, or a shorter block; a Lektion that misses it is a
 * CONTENT finding (add items to its Wortfeld), which is what the test prints.
 */
export const SITUATION_MIN = 4;
/** No lemma (Mädchen, Uhr, Auto …) may carry more than this many items in one Lektion. */
export const MAX_SAME_LEMMA = 2;
/** At most this many items whose answer lemma was already an answer in the Lektion before. */
export const MAX_CARRIED_LEMMA = 1;
/**
 * Second diversity axis: no ANSWER KEY may carry more than this many items in
 * one Lektion (DaF review #6). `MAX_SAME_LEMMA` reads `itemLemmas`, which runs
 * through `LEMMA_STOPWORDS` — and that list holds every article and possessive,
 * on purpose, so that "Schreiben Sie den Satz" items do not all look like the
 * same lexis. In the three Lektionen whose primary grammar IS the determiner
 * (L5 definite, L6 indefinite, L12 possessive) the lemma cap is therefore blind
 * to exactly the thing that has to vary: L12 gave five of seven items to `mein`
 * in BOTH attempts and never drew one of the three polite `Ihr` items the
 * Lektion exists to rehearse. The cap below counts what the item makes the
 * learner PRODUCE, function words included, so `Mein` × 5 cannot happen again.
 */
export const MAX_SAME_ANSWER_KEY = 2;
/**
 * Third diversity axis, one step coarser than `answerKey`: no TASK SHAPE may
 * carry more than this many items in one Lektion (DaF review #7 MAJOR 5).
 * `answerKey` compares what the learner produces, so it reads two error
 * corrections that differ only in their noun — "Ich bin eine Lehrerin." and
 * "Ich bin eine Verkäuferin.", both answered by deleting the article — as two
 * different items, and L6 drew both, in both attempts, out of seven. They are
 * the same exercise with a different profession: same prompt skeleton, same
 * rule, an answer that differs in one word. `taskShape` collapses exactly that:
 * one per Lektion, so the second seat goes to a different kind of task.
 */
export const MAX_SAME_TASK_SHAPE = 1;
/**
 * How many seeded tie-break orders the draw tries before it starts relaxing a
 * cap. The greedy pass takes the highest-ranked item that fits, which can walk
 * into a corner even when a seven under every cap exists — measured in L4,
 * which holds 20 usable items in 12 distinct task shapes and still needed the
 * lemma cap relaxed on the first order. A retry is free and deterministic; a
 * relaxed cap is a worse lesson.
 */
export const PICK_RETRIES = 8;
/**
 * How many DISTINCT draws one Lektion offers before the cycle starts over.
 * Measured on the shipped a1.1 pool with the prior-attempt filter of rule 7:
 * attempt 1→2 and 2→3 share at most two of seven items in every Lektion, while
 * a fourth draw would have to repeat — L8's whole topic slice is 19 usable
 * items, i.e. two and a half sevens. So the attempt number a learner's progress
 * derives cycles 1 → 2 → 3 → 1 rather than growing without bound.
 */
export const ATTEMPT_CYCLE = 3;

/**
 * The attempt number for a learner who has FINISHED this Lektion `completed`
 * times — the one thing `LessonPlayerPage` may not invent. It used to hold
 * `useState(1)` with no setter, so the repeat that the standard makes the
 * remediation path replayed the identical seven for ever (DaF review #9
 * MAJOR 1). Derived, never stored: no schema column, just the count of
 * completed runs the progress tables already carry.
 */
export const attemptFromCompletions = (completed, cycle = ATTEMPT_CYCLE) => {
  const n = Number.isFinite(Number(completed)) && Number(completed) > 0 ? Math.floor(Number(completed)) : 0;
  const span = Math.max(1, Math.floor(cycle) || 1);
  return 1 + (n % span);
};
/** Weights for situational relevance: the Lektion's own Wortfeld vs. an earlier one's. */
export const OWN_TERM_WEIGHT = 3;
export const EARLIER_TERM_WEIGHT = 1;

/**
 * Words that carry no situation: articles, pronouns, sein/haben, the prompt
 * boilerplate of the exercise bank ("Schreib den Satz richtig", "Welcher
 * Artikel passt?") and the grammar meta-vocabulary. They are ignored both when
 * scoring relevance and when counting how often a lemma is drilled — without
 * this, every "Schreib das Wort" item would look like the same lemma.
 */
export const LEMMA_STOPWORDS = new Set([
  // Artikel, Pronomen, Determinative
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'kein', 'keine', 'keinen', 'keinem', 'keiner', 'mein', 'meine', 'meinen', 'meinem', 'meiner',
  'dein', 'deine', 'deinen', 'deinem', 'deiner', 'sein', 'seine', 'seinen', 'seinem', 'seiner',
  'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'unser', 'unsere', 'unseren', 'euer', 'eure',
  'ich', 'sie', 'wir', 'man', 'mich', 'dich', 'ihn', 'uns', 'euch', 'mir', 'dir', 'ihm', 'ihnen',
  // sein und haben
  'bin', 'bist', 'ist', 'sind', 'seid', 'habe', 'hast', 'hat', 'haben', 'habt',
  // Fragewörter und kleine Wörter
  'was', 'wie', 'wer', 'wen', 'wem', 'wann', 'wohin', 'woher', 'warum', 'welche', 'welcher',
  'welches', 'und', 'oder', 'aber', 'auch', 'nicht', 'noch', 'schon', 'sehr', 'nur', 'dann',
  'hier', 'aus', 'auf', 'mit', 'für', 'von', 'zum', 'zur', 'ins', 'ans', 'vom', 'beim',
  // Aufgabenformeln des Übungspools. Only the words that carry NO information
  // about what an item drills belong here: "Artikel", "Präposition",
  // "umgangssprachlich", "Satz", "Fehler" and "Frage" are deliberately absent,
  // because they mark a template — and capping a template at MAX_SAME_LEMMA is
  // exactly what stops a Lektion turning into four times "Es ist ___ (2:45)".
  'schreib', 'schreibe', 'schreibweise', 'wort', 'wörter', 'richtig', 'falsch',
  'buchstabiert', 'finde', 'ergänze', 'setze', 'wähle', 'bedeutet', 'heißt',
  'sagt', 'sagen', 'macht', 'gut', 'neu', 'alt',
  // The Sie-forms of the same formulas. REVIEW #3 asked for the whole pool to
  // address an adult learner in the Sie-register, and scripts/build-lesson-pool.mjs
  // now rewrites "Schreib …" to "Schreiben Sie …" at build time. Without these
  // the rewritten task words would count as content lemmas, MAX_SAME_LEMMA would
  // cap the templates at two, and a Lektion built on them would come out thin —
  // the stoplist has to follow the register, not the other way round.
  'schreiben', 'bilden', 'bilde', 'korrigieren', 'korrigiere', 'ergänzen',
  'setzen', 'wählen', 'finden', 'hören', 'antworten', 'antworte',
]);

const tokens = (text) =>
  String(text || '')
    .toLowerCase()
    .split(/[^a-zäöüß]+/)
    .filter((w) => w.length > 2);

/** The words of a text that actually name something — the stoplist removed. */
export const contentLemmas = (text) => new Set(tokens(text).filter((w) => !LEMMA_STOPWORDS.has(w)));

/**
 * The bracketed instruction a prompt prints after its sentence — „(bestimmter
 * Artikel)", „(der, die oder das?)", „(14:30, offiziell)". It is the TASK, not
 * the content, and `taskShape` has read it as one category since DaF review #10.
 */
const stripInstruction = (text) => String(text || '').replace(/\([^()]*\)/g, ' ');

/**
 * Everything the item talks about: prompt AND answer (Mädchen usually sits in
 * the prompt) — but NOT the bracketed instruction.
 *
 * DaF review #11 MAJOR 1 measured what counting the bracket cost. `bestimmter`
 * and `artikel` are not content words, they are the cue „(bestimmter Artikel)",
 * and `MAX_SAME_LEMMA` therefore allowed the Lektion two of them: of the 17
 * `definite-articles` items L5 may serve, THIRTEEN carry exactly that bracket,
 * so from the third one on the Lektion's own grammar was locked out — not
 * because the pool is empty but because the instruction was counted as lexis.
 * L5 filled the gap from Lektion 4's flea market (attempt 2 and 3: 2 of 7 on its
 * own slug, five items of Rucksack/Regal/Tasche) and reported `complete: false`
 * while every cap „held". The two guards have to read the bracket the same way,
 * and `taskShape` already collapses it to `zzmark…` before the mask — so the
 * lemma cap ignores it entirely rather than chasing its wording word by word.
 */
export const itemLemmas = (item) =>
  contentLemmas(`${stripInstruction(item && item.questionDe)} ${(item && item.answer) || ''}`);

/** Only what the item makes the learner produce — used for the carry-over rule. */
export const answerLemmas = (item) => contentLemmas(item.answer || '');

/** Lower-cased, punctuation-free words of a text — used for function-word answers. */
const flat = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-zäöüß]+/g, ' ')
    .trim();

/**
 * What the item makes the learner PRODUCE, as one comparable key: the content
 * lemmas of the answer when it has any, and otherwise — an answer that is ONLY
 * function words, i.e. `Mein`, `Ihr`, `eine` — the bare first word of the
 * answer. Sorted, so two items asking for the same sentence in a different
 * order count as one key. `Mein` and `mein` are the same key by construction.
 */
export const answerKey = (item) => {
  const lemmas = answerLemmas(item);
  if (lemmas.size) return [...lemmas].sort().join(' ');
  return flat(item && item.answer).split(' ')[0] || '';
};

/**
 * THE SIXTH DIVERSITY AXIS: does the seven print its own solutions?
 *
 * DaF review #11 MAJOR 2 measured 17 pairs in 11 of the 36 blocks where one
 * item's answer stood, word for word, in another item's prompt of the same
 * seven — worst a MUTUAL pair in L1 attempt 2 („Lesen Sie die Buchstaben:
 * W-I-L-L-K-O-M-M-E-N …" → `Willkommen` beside „Wie buchstabiert man
 * Willkommen?" → `W-I-L-L-K-O-M-M-E-N`: two task shapes, one piece of
 * information) and the L11 pair „Kommst du am Freitag ___? (mitkommen)" beside
 * the word bag whose solution is that very sentence. The engine had five axes
 * (lemma, answer key, task shape, carry-over, prior attempt) and not one that
 * asked whether the learner had already been shown the answer.
 *
 * `answerWords` is what the item makes the learner WRITE, function words and
 * one- and two-letter fragments dropped — so „Nach Donnerstag kommt ___." may
 * still sit beside an item that produces a whole sentence containing
 * `Donnerstag`, and only an item whose ENTIRE production is already printed is
 * refused. `promptWords` drops the bracketed cue, because „(mitkommen)" names
 * the task rather than giving the sentence away, and matches whole tokens: a
 * `gearbeitet` in the prompt does not leak the answer `arbeite`.
 */
export const answerWords = (item) => {
  const words = String((item && item.answer) || '')
    .toLowerCase()
    .replace(/[^a-zäöüß0-9-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const content = words.filter((w) => w.length > 2 && !LEMMA_STOPWORDS.has(w));
  if (content.length) return new Set(content);
  // An answer that is ONLY a function word still leaks when it is printed —
  // „Der Chef braucht ___ Computer." → `einen` beside „Korrigieren Sie: «Ich
  // brauche einen Pause.»" was one of the review's measured pairs. `answerKey`
  // falls back to the bare first word for exactly this case. Four letters is
  // the floor: `die`, `der` and `das` stand in half the prompts of the course,
  // and refusing every item that produces one of them would empty the three
  // Lektionen whose grammar IS the article.
  return new Set(words.length === 1 && words[0].length >= 4 ? words : []);
};

/** The words a prompt PRINTS — the bracketed instruction removed, whole tokens. */
export const promptWords = (item) =>
  new Set(
    stripInstruction(item && item.questionDe)
      .toLowerCase()
      .replace(/[^a-zäöüß0-9-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean),
  );

/**
 * True when `solved`'s whole production is already printed in `prints`'s prompt
 * — i.e. a learner reading `prints` has been handed the answer to `solved`. The
 * accepted variants count too: any form the checker would take is an answer.
 */
export const leaksAnswer = (solved, prints) => {
  const printed = [...promptWords(prints)];
  if (!printed.length) return false;
  // One word is printed when the prompt shows it or an inflection of it:
  // „[der Chef / brauchen / ein / Telefon]" prints the answer „Ich brauche ein
  // Telefon." The stem has to be long enough to mean something — `termHits`
  // uses the same four-letter floor — so `ge|arbeitet` does not swallow
  // `arbeite`, which is a different form the learner still has to produce.
  const shows = (w) =>
    printed.some((t) => t === w || (w.length >= 4 && t.startsWith(w)) || (t.length >= 4 && w.startsWith(t)));
  const forms = [solved && solved.answer, ...((solved && solved.accepted) || [])];
  return forms.some((form) => {
    const words = answerWords({ answer: form });
    return words.size > 0 && [...words].every(shows);
  });
};

/** Quotation marks the pool uses around the sentence an item works on. */
const QUOTED = /[„“”"»]([^„“”"»«]+)[“”"«]/;
/**
 * The prompt without the exercise bank's task formula: the quoted sentence when
 * the prompt quotes one, else what follows the instruction's colon. Two items
 * can be the same exercise under different wrappers — "Korrigieren Sie: „Ich
 * bin eine Verkäuferin.“" and "Finden Sie den Fehler und schreiben Sie den
 * Satz richtig: „Ich bin eine Lehrerin.“" — and the shape has to see through
 * the wrapper, or it compares formulas instead of tasks.
 */
export const bare = (text) => {
  const s = String(text || '').trim();
  const quoted = s.match(QUOTED);
  if (quoted && quoted[1].trim()) return quoted[1];
  const formula = s.match(
    /^[^:()]*\b(?:bilden|bilde|schreiben|schreib|schreibe|korrigieren|korrigiere|ergänzen|ergänze|finden|finde|setzen|setze|wählen|wähle|antworten|antworte|buchstabieren|buchstabiere|lesen|lies|hören)\b[^:()]*:\s*(.+)$/i,
  );
  return formula ? formula[1] : s;
};

/** Lower-cased words of a text with the gap (`___`) kept as its own token. */
const withGaps = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/_+/g, ' _ ')
    .replace(/[^a-zäöüß_]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

/**
 * Words that belong to the TASK rather than to its content: the bracketed
 * instruction the pool prints after the sentence ("(der, die oder das?)",
 * "(formell)", "(Artikel)"). They stay in the skeleton because two items that
 * ask different questions about the same frame really are two tasks. Every
 * other word is content and is masked — see `taskShape`.
 *
 * Since DaF review #10 MAJOR 1 the BRACKET itself no longer reaches the mask:
 * `TASK_MARKS` collapses it to one category first, so these words only matter
 * where the pool writes the instruction without brackets.
 */
export const TASK_WORDS = new Set([
  'artikel', 'präposition', 'plural', 'singular', 'satz', 'frage', 'antwort', 'fehler',
  'formell', 'informell', 'offiziell', 'höflich', 'höfliche', 'umgangssprachlich',
  'uhrzeit', 'zahl', 'zahlen', 'verb', 'nomen',
]);

/**
 * The CLOSED set of instruction categories a bracketed cue can carry, read off
 * the shipped pool (79 distinct brackets on 2026-09-13) rather than invented.
 *
 * DaF review #10 MAJOR 1(b) measured what the un-normalised bracket cost: the
 * six new L10 items `extra-a11-l10-17` … `-22` are ONE task — a scrambled word
 * list turned into a yes/no question — and differed in nothing but the wording
 * of their cue („(Das Verb steht zuerst.)", „(Das Verb steht vorn.)", „(Die
 * Stimme steigt am Ende.)", „(Zuerst das Verb, dann das Subjekt.)"). Because
 * `TASK_WORDS` and `LEMMA_STOPWORDS` left those words in the skeleton, the
 * guard counted six task shapes and L10 drew five of the six into one seven,
 * twice. A rewording is not a new exercise, so the wording never reaches the
 * key: the whole bracket becomes its category, and a bracket that fits no
 * category becomes the same generic mark as every other unclassified one.
 *
 * Order matters — the first match wins, so the more specific cue is listed
 * first („(14:30, offiziell)" is a clock task, „(Sie, Höflichkeitsform)" a
 * register task, „(sie, Plural)" a person cue and „(sein, Plural)" a verb-form
 * cue).
 */
export const TASK_MARKS = [
  // „(der, die oder das?)" — which gender does this noun have?
  { key: 'genus', re: /der\s*,\s*die\s+oder\s+das/i },
  // „(bestimmter Artikel)", „(unbestimmter Artikel)", „(mit bestimmtem Artikel)"
  { key: 'artikel', re: /artikel/i },
  // „(Verb auf Position 1)", „(Das Verb steht vorn.)", „(die Satzmelodie steigt)",
  // „(Antwort: ja oder nein)" — all of them: make it a yes/no question.
  {
    key: 'verbzuerst',
    re: /verb\s+(?:steht|zuerst|vorn|auf\s+position)|zuerst\s+das\s+verb|mit\s+dem\s+verb|satzmelodie|stimme\s+steigt|ja\s+oder\s+nein/i,
  },
  // „(14:30, offiziell)", „(2:45, umgangssprachlich)", „(8.30)", „(Präposition für Tageszeit)"
  { key: 'uhrzeit', re: /\d{1,2}\s*[:.]\s*\d{2}|uhrzeit|tageszeit|umgangssprachlich|offiziell/i },
  // „(höflich mit Sie)", „(Sie, Höflichkeitsform)", „(…, förmlich, …)"
  { key: 'register', re: /höflich|formell|förmlich|höflichkeitsform/i },
  // „(7)", „(10)" — write the number word.
  { key: 'zahl', re: /^\s*\d+\s*$/ },
  // „(ich)", „(du)", „(sie, Plural)" — conjugate for this person.
  { key: 'person', re: /^\s*(?:ich|du|er|sie|es|wir|ihr)\b/i },
  // „(sein)", „(haben)", „(aufstehen, nur die Vorsilbe)" — an infinitive cue.
  { key: 'verbform', re: /^\s*[a-zäöüß]{2,}e?n\b/ },
  // „(Plural)", „(Singular)", „(zwei Wörter)" — how many / which form.
  { key: 'anzahl', re: /plural|singular|einzahl|mehrzahl|zwei\s+wörter|vorsilbe/i },
];
/** The mark a bracket that fits no category gets: one for all of them. */
export const GENERIC_TASK_MARK = 'zzmarkx';
/** The category of one bracketed instruction, as a single skeleton token. */
export const instructionMark = (inner) =>
  `zzmark${(TASK_MARKS.find((m) => m.re.test(String(inner || ''))) || {}).key || 'x'}`;

/**
 * A spelled-out word — „T-S-C-H-Ü-S-S", „B-U-C-H-S-T-A-B-I-E-R-E-N" — as ONE
 * token. DaF review #10 MAJOR 1(a): every letter used to enter the skeleton as
 * its own `·`, so the LENGTH of the answer word decided whether two „Lesen Sie
 * die Buchstaben: …. Schreiben Sie das Wort: ___" items were the same task.
 * L1's third attempt served five letter-for-letter identical prompts while the
 * cap reported seven distinct shapes.
 */
const SPELLED_RE = /(?:^|\s)\p{L}(?:-\p{L})+(?=[\s.,!?;:]|$)/gu;
/**
 * A scrambled word list — „[fahren / der Bus / nach Deutschland]" — masked by
 * its LENGTH CLASS only (DaF review #10 MAJOR 1(c)). Which words are in the
 * bag is content; that the learner has to order a bag of words is the task.
 */
const WORD_LIST_RE = /\[[^\]]*\]/g;
const listMark = (chunk) => (String(chunk).split('/').length >= 4 ? 'zzlistelang' : 'zzlistekurz');

/**
 * Placeholders `taskShape` injects. They are lowercase letter strings so that
 * `withGaps` carries them through, and they survive the content mask because
 * they ARE the shape.
 */
const SHAPE_TOKEN_RE = /^zz(?:mark[a-zäöüß]*|liste(?:kurz|lang)|buchstaben)$/;

/**
 * Content words that sit in `LEMMA_STOPWORDS` for the LEMMA cap's sake but are
 * content as far as the FRAME is concerned. `alt`, `gut` and `neu` are there so
 * that „Schreiben Sie den Satz richtig" items do not all count as one lemma —
 * and DaF review #10 MAJOR 1(c) measured the side effect: „___ Uhr ist alt."
 * and „___ Rucksack ist teuer." came out as two frames, because `alt` survived
 * into the skeleton and `teuer` did not. Adjectives are content. The lemma cap
 * keeps its stoplist; the shape mask subtracts this set from it.
 */
export const SHAPE_CONTENT_WORDS = new Set(['gut', 'neu', 'alt']);

/**
 * The item's TASK as one comparable key: its type plus the skeleton of its bare
 * prompt — the gap where it stands, the function words that make the frame, the
 * task formula, and a `·` for every CONTENT word.
 *
 * The mask used to be bound to word LENGTH (six letters, plus -in derivations),
 * and DaF review #9 MAJOR 2 measured what that cost: `uhr`, `stuhl`, `preis`,
 * `bild`, `buch` are shorter, so "___ Uhr ist alt. (der, die oder das?)" and
 * "___ Stuhl ist alt. (der, die oder das?)" were two different "task shapes"
 * and `MAX_SAME_TASK_SHAPE` bound in NONE of the 24 blocks — L4 drew four items
 * of one frame in both attempts while the guard reported seven distinct shapes.
 * The mask is bound to WORD CLASS instead: a token survives only if it is the
 * gap, a `LEMMA_STOPWORDS` function word, or a `TASK_WORDS` instruction word.
 *
 * DaF review #10 MAJOR 1 closed the three ways a rewording could still buy a
 * second seat, all three BEFORE the word mask runs:
 *   (a) a spelled-letter sequence is one token, not one per letter;
 *   (b) a bracketed instruction is its `TASK_MARKS` CATEGORY, not its wording,
 *       and an unclassified bracket is the generic mark;
 *   (c) a scrambled word list is its length class, not its words.
 * Plus `SHAPE_CONTENT_WORDS`: an adjective is content even when the lemma
 * stoplist holds it. So two items are one shape whenever a learner would say
 * „that is the same exercise again".
 */
export const taskShape = (item) => {
  const marks = [];
  const text = bare(item && item.questionDe)
    .replace(/\(([^()]*)\)/g, (_, inner) => {
      marks.push(instructionMark(inner));
      return ` ${marks[marks.length - 1]} `;
    })
    .replace(SPELLED_RE, ' zzbuchstaben ')
    .replace(WORD_LIST_RE, (chunk) => ` ${listMark(chunk)} `);
  const skeleton = withGaps(text)
    .split(' ')
    .map((w) => {
      if (w === '_' || SHAPE_TOKEN_RE.test(w)) return w;
      if (SHAPE_CONTENT_WORDS.has(w)) return '·';
      return LEMMA_STOPWORDS.has(w) || TASK_WORDS.has(w) ? w : '·';
    })
    .join(' ');
  return `${(item && item.type) || ''}:${skeleton}`;
};

/** The situational vocabulary of one Lektion, as lemmas. */
export function wortfeldTerms(lektion) {
  const out = new Set();
  for (const w of (lektion && lektion.wortfeld) || []) {
    for (const t of contentLemmas(`${w.word || ''} ${w.de || ''}`)) out.add(t);
  }
  return out;
}

/** A term hits a token when one is the other, or a prefix of it (Wortfeld vs. inflection). */
const termHits = (term, toks) =>
  toks.some((t) => t === term || (term.length >= 4 && t.startsWith(term)) || (t.length >= 4 && term.startsWith(t)));

/**
 * How situational an item is for this Lektion: every Wortfeld word of the
 * Lektion that turns up in the prompt or answer counts triple, every word from
 * an EARLIER Lektion counts once (revision is welcome, it is just worth less).
 */
export function relevanceScore(item, ownTerms, earlierTerms) {
  const toks = tokens(`${item.questionDe || ''} ${item.answer || ''}`);
  let score = 0;
  for (const term of ownTerms || []) if (termHits(term, toks)) score += OWN_TERM_WEIGHT;
  for (const term of earlierTerms || []) {
    if ((ownTerms && ownTerms.has && ownTerms.has(term)) || !termHits(term, toks)) continue;
    score += EARLIER_TERM_WEIGHT;
  }
  return score;
}

/** Order-independent per-item jitter, so ties break deterministically per seed. */
function jitter(seed, id) {
  let h = (seed >>> 0) ^ 2166136261;
  const key = String(id);
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function seededShuffle(list, rng) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The 7 controlled-practice items for ONE Lektion.
 *
 * Guarantees, in this order of priority:
 *   1. `PRIMARY_MIN` (4) items from the Lektion's own grammar point, whenever
 *      that topic can supply them — the review found L5 drawing 2 of 7 and L8
 *      drawing 2 of 7 on their own primary slug;
 *   2. at least `rule.typedMin` typed items and at most two multiple_choice;
 *   3. seven items in total, all from `rule.topics`;
 *   4. one item for every answer key in `rule.mustCover` the pool can supply;
 *   5. no lemma more than `MAX_SAME_LEMMA` times, no answer key more than
 *      `MAX_SAME_ANSWER_KEY` times, no task shape more than
 *      `MAX_SAME_TASK_SHAPE` time, at most `MAX_CARRIED_LEMMA` item repeating an
 *      answer lemma of the Lektion before, and NO item whose whole production is
 *      already printed in a sibling's prompt (`leaksAnswer`, DaF review #11
 *      MAJOR 2 — an exercise that solves another one is an exercise given away);
 *   6. within each topic, the most situational items first (relevanceScore),
 *      and at least `SITUATION_MIN` (4) of the seven carrying a word of the
 *      Lektion's OWN Wortfeld whenever the eligible slice holds that many —
 *      a fill pass under the caps, never a relaxation of its own (DaF review
 *      #12 MAJOR 4: L7 attempt 3 served 2 of 7 from „Freizeit und Hobbys“);
 *   7. none of the items this Lektion's EARLIER attempts drew (`priorAttemptIds`),
 *      while the topic slice can still fill seven without them — the repeat is
 *      the standard's remediation path, and DaF review #9 MAJOR 1 measured the
 *      seed alone giving attempt 2 sixty-two of attempt 1's eighty-four items.
 *
 * `options` is what only the LEVEL knows — pass nothing and it behaves like a
 * standalone draw (still filtered, still deterministic):
 *   { lektionNr, primarySlug, ownTerms, earlierTerms, usedIds, previousAnswerLemmas,
 *     priorAttemptIds }
 *
 * `lektionNr` drives the one filter that is never relaxed: an item may only be
 * drawn at or after its `minLektion` stamp (see below).
 *
 * When the topic slice is too small the result is simply shorter rather than
 * padded with off-topic items — a short pool is a content bug, not something to
 * paper over. The caps of 5 are relaxed before the seven are given up on — the
 * carry-over first, then the lemma and answer-key caps, then the items the
 * EARLIER ATTEMPTS of this Lektion already showed (`priorAttemptIds`, rule 7),
 * then the task-shape cap, because it is the coarsest and the one a learner
 * notices most — and the LEAK cap dead last, after everything else, because a
 * seven that prints its own answers is worse than a repeated task shape. A draw
 * that reaches that stage is a POOL finding, and `relaxUsed` says so.
 */
export function pickPracticeItems(pool, rule, seed, options = {}) {
  const topicList = (rule && rule.topics) || [];
  const topics = new Set(topicList);
  const typedMin = Math.max(0, (rule && rule.typedMin) || 0);
  // RULE 11b IS A FILTER, NOT A RATCHET (round 10). `minLektion` is stamped on every pool item by
  // `scripts/build-lesson-pool.mjs` with the validator's own per-Lektion lexicon: it is the first
  // Lektion by which the course has taught every German word of the item. An item drawn before that
  // shows the learner a word he has not met — „Welche Schreibweise ist richtig?“ in L1, `Kaffee`
  // and `kocht` in L4 — which no edit to the item can repair, because the item is fine and the
  // Lektion was wrong. So it is a HARD filter, applied before the caps and never relaxed by the
  // fallback passes below: a Vorgriff is worse than a short block. `minLektion: null` means the
  // course never teaches all of the item's words, so no Lektion may serve it.
  // Items with no stamp at all (a hand-built pool in a test) are left alone — only a stamped item
  // can be filtered, or every unit test would have to know the lexicon.
  const servableHere = (it) =>
    !Object.prototype.hasOwnProperty.call(it, 'minLektion') ||
    (Number.isInteger(it.minLektion) && (!Number.isInteger(options.lektionNr) || it.minLektion <= options.lektionNr));
  const usable = poolItems(pool).filter((it) => topics.has(it.topic) && isUsableItem(it) && servableHere(it));
  if (!usable.length) return [];

  const primarySlug = options.primarySlug || topicList[0];
  const ownTerms = options.ownTerms || new Set();
  const earlierTerms = options.earlierTerms || new Set();
  const usedIds = options.usedIds || new Set();
  const carriedLemmas = options.previousAnswerLemmas || new Set();
  const priorIds = options.priorAttemptIds || new Set();

  // Cross-Lektion dedup, per topic: while this topic still has items no earlier
  // Lektion has shown, only those are eligible. A topic that is exhausted falls
  // back to its full slice rather than leaving the block short.
  // The answer keys `mustCover` reserves a seat for, normalised once.
  // `mustCover` lists the answer STRING the Lektion exists to rehearse, and `answerKey` is
  // case-blind by construction (`Mein` and `mein` are one key). For L12 those are two different
  // forms — the polite `Ihr` is the whole point of the Lektion — and on attempt 3 the cover pass
  // filled the seat with `ihr` (the plural possessive), because the prior-attempt filter had put
  // the three polite items out of reach and a case-variant shares their key (DaF review #10
  // MAJOR 2, measured once the guard walked attempt 3). So the raw string travels with the key and
  // an item whose answer IS that string is preferred over one that merely shares its key.
  const coverKeys = [];
  for (const raw of (rule && rule.mustCover) || []) {
    const key = answerKey({ answer: raw });
    if (key && !coverKeys.some((c) => c.key === key)) coverKeys.push({ raw: String(raw).trim(), key });
  }

  const eligible = [];
  for (const topic of topics) {
    const all = usable.filter((it) => it.topic === topic);
    const fresh = all.filter((it) => !usedIds.has(it.id));
    eligible.push(...(fresh.length ? fresh : all));
  }

  // ONE PASS of the greedy draw, under a given tie-break salt. The salt only
  // reorders items the relevance score cannot separate, so pass 0 is exactly
  // the draw as it was — but it lets the caller RETRY instead of relaxing a cap.
  // That matters since DaF review #9 MAJOR 2 bound `MAX_SAME_TASK_SHAPE` to the
  // word class: L4 has 20 usable items in 12 distinct shapes, a seven under
  // every cap exists, and the first greedy order simply walked into a corner and
  // relaxed the lemma cap to get out of it. Relaxation is for a pool that CANNOT
  // fill seven, not for an unlucky order.
  const runPass = (salt, seatSituation = true) => {
    const passSeed = (seed + Math.imul(salt, 0x9e3779b1)) >>> 0;
    const ranked = eligible
      .map((it) => ({
        it,
        score: relevanceScore(it, ownTerms, earlierTerms),
        key: jitter(passSeed, it.id),
      }))
      .sort((a, b) => b.score - a.score || a.key - b.key || String(a.it.id).localeCompare(String(b.it.id)))
      .map((r) => r.it);

    const chosen = new Map();
    const lemmaCount = new Map();
    const answerKeyCount = new Map();
    const taskShapeCount = new Map();
    let mc = 0;
    let typed = 0;
    let carried = 0;
    let relaxUsed = 0;

    const carriesOver = (it) => [...answerLemmas(it)].some((l) => carriedLemmas.has(l));

    const fits = (it, relax) => {
      if (chosen.has(it.id) || chosen.size >= PRACTICE_SIZE) return false;
      if (isMultipleChoice(it) && mc >= MAX_MULTIPLE_CHOICE) return false;
      if (!relax.lemma) {
        for (const l of itemLemmas(it)) if ((lemmaCount.get(l) || 0) >= MAX_SAME_LEMMA) return false;
      }
      if (!relax.answerKey) {
        const k = answerKey(it);
        if (k && (answerKeyCount.get(k) || 0) >= MAX_SAME_ANSWER_KEY) return false;
      }
      if (!relax.taskShape) {
        const shape = taskShape(it);
        if (shape && (taskShapeCount.get(shape) || 0) >= MAX_SAME_TASK_SHAPE) return false;
      }
      if (!relax.leak) {
        for (const seated of chosen.values()) {
          if (leaksAnswer(it, seated) || leaksAnswer(seated, it)) return false;
        }
      }
      if (!relax.carried && carried >= MAX_CARRIED_LEMMA && carriesOver(it)) return false;
      if (!relax.prior && priorIds.has(it.id)) return false;
      return true;
    };

    const take = (it, stage = 0) => {
      chosen.set(it.id, it);
      relaxUsed = Math.max(relaxUsed, stage);
      if (isMultipleChoice(it)) mc += 1;
      if (isTypedItem(it)) typed += 1;
      if (carriesOver(it)) carried += 1;
      for (const l of itemLemmas(it)) lemmaCount.set(l, (lemmaCount.get(l) || 0) + 1);
      const k = answerKey(it);
      if (k) answerKeyCount.set(k, (answerKeyCount.get(k) || 0) + 1);
      const shape = taskShape(it);
      if (shape) taskShapeCount.set(shape, (taskShapeCount.get(shape) || 0) + 1);
    };

    // The cover pass (DaF review #6 MAJOR 6, second half). `MAX_SAME_ANSWER_KEY`
    // is a CEILING on repetition and a ceiling cannot reserve a seat: L12 holds 38
    // usable possessive items, the three polite `Ihr` ones score no higher than a
    // dozen others, so which of them lands in the seven was decided by the seeded
    // jitter — and on attempt 1 none of them did. `practiceRule.mustCover` lists
    // the answer keys the Lektion EXISTS to rehearse (L12: the polite `Ihr`, the
    // form Schreiben Teil 2 and Sprechen Teil 3 are graded on; L8: `halb` and the
    // official `vierzehn Uhr dreißig`); one usable item per key is taken first,
    // typed and on the primary slug for preference, under the same caps as every
    // other pick. A key the pool cannot supply is a no-op — the draw is never
    // padded with something off-topic to satisfy it.
    for (const { raw, key } of coverKeys) {
      if (chosen.size >= PRACTICE_SIZE) break;
      const all = ranked.filter((it) => answerKey(it) === key);
      const exact = all.filter((it) => String(it.answer || '').trim() === raw);
      const candidates = [...exact, ...all.filter((it) => !exact.includes(it))];
      const preferred = [
        ...candidates.filter((it) => it.topic === primarySlug && isTypedItem(it)),
        ...candidates.filter((it) => it.topic === primarySlug),
        ...candidates.filter(isTypedItem),
        ...candidates,
      ];
      // A key an earlier attempt already covered is still a key this attempt
      // must cover: the prior-attempt filter is tried first and given up for the
      // cover pass alone, so `mustCover` never goes unmet because of rule 7.
      //
      // And the NAMED form is tried before any case-variant of it, prior filter and all. L12's
      // key is `Ihr`; the pool also holds `ihr` (the plural possessive), which shares the key —
      // so on attempt 3, with the two polite items prior-excluded, the seat reserved for the
      // Höflichkeitsform went to the lowercase form and the Lektion's own exam point was not
      // practised at all. A repeated `Ihr` item is the smaller price, and it is the exception
      // `mustCover` exists to make.
      const isExact = (it) => exact.includes(it);
      const pick = preferred.find((it) => isExact(it) && fits(it, {}))
        || preferred.find((it) => isExact(it) && fits(it, { prior: true }))
        || preferred.find((it) => fits(it, {}))
        || preferred.find((it) => fits(it, { prior: true }));
      if (pick) take(pick);
    }

    const primaryCount = () => [...chosen.values()].filter((it) => it.topic === primarySlug).length;
    const primaryTarget = Math.min(
      PRIMARY_MIN,
      PRACTICE_SIZE,
      ranked.filter((it) => it.topic === primarySlug).length,
    );

    // THE SITUATION FLOOR (`SITUATION_MIN`). „Situational" is measured against
    // the Lektion's OWN Wortfeld only — `relevanceScore` with an empty set of
    // earlier terms — because an item that revises Lektion 3's vocabulary is
    // revision, not this Lektion's scene.
    const isSituational = (it) => relevanceScore(it, ownTerms, new Set()) > 0;
    const situationCount = () => [...chosen.values()].filter(isSituational).length;
    const situationTarget = Math.min(
      SITUATION_MIN,
      PRACTICE_SIZE,
      ranked.filter(isSituational).length,
    );
    /** Seats `PRIMARY_MIN` still needs — the situation fill may never take them. */
    const primaryReserve = () => Math.max(0, primaryTarget - primaryCount());

    const fill = (list, relax, stop, stage) => {
      for (const it of list) {
        if (stop()) break;
        if (fits(it, relax)) take(it, stage);
      }
    };

    // The shape cap is given up LAST: a Lektion that cannot otherwise fill seven
    // takes a repeated task shape rather than coming out short, but only after
    // the lemma, carry-over, answer-key and prior-attempt filters have gone.
    const LADDER = [
      {},
      { carried: true },
      { lemma: true, carried: true, answerKey: true },
      { lemma: true, carried: true, answerKey: true, prior: true },
      { lemma: true, carried: true, answerKey: true, prior: true, taskShape: true },
      { lemma: true, carried: true, answerKey: true, prior: true, taskShape: true, leak: true },
    ];
    for (let stage = 0; stage < LADDER.length; stage += 1) {
      const relax = LADDER[stage];
      // 1. the primary slug's share, REAL producers and typed items first. The
      //    slug on an item is a routing label; `drillsSlug` reads what the item
      //    makes the learner produce. Attempt 1 used to take whichever labelled
      //    items ranked highest, which left attempt 2 — which may not repeat
      //    them — with the labelled non-producers: L3, L7, L10 and L11 fell under
      //    PRIMARY_MIN on the second draw although every one of them holds ten
      //    or more real producers on its own slug.
      const primary = ranked.filter((it) => it.topic === primarySlug);
      const real = primary.filter((it) => drillsSlug(it, primarySlug));
      const rest = primary.filter((it) => !drillsSlug(it, primarySlug));
      fill(real.filter(isTypedItem), relax, () => primaryCount() >= primaryTarget, stage);
      fill(real, relax, () => primaryCount() >= primaryTarget, stage);
      fill(rest.filter(isTypedItem), relax, () => primaryCount() >= primaryTarget, stage);
      fill(rest, relax, () => primaryCount() >= primaryTarget, stage);
      // 2. the typed floor across all topics
      fill(ranked.filter(isTypedItem), relax, () => typed >= typedMin || chosen.size >= PRACTICE_SIZE, stage);
      // 2b. THE SITUATION FLOOR: before the block is filled with whatever ranks
      //     next, seats go to items that carry a word of THIS Lektion's Wortfeld
      //     — the ones on its own slug first, since those pay both floors. It
      //     runs under the stage's own relaxation (it never relaxes anything of
      //     its own) and stops short of the seats `PRIMARY_MIN` still needs, so
      //     it can cost neither a cap nor the grammar share nor the seventh item.
      const stopSituation = () =>
        !seatSituation
        || situationCount() >= situationTarget
        || chosen.size >= PRACTICE_SIZE - primaryReserve();
      const situational = ranked.filter(isSituational);
      fill(situational.filter((it) => it.topic === primarySlug), relax, stopSituation, stage);
      fill(situational, relax, stopSituation, stage);
      // 3. fill up to seven
      fill(ranked, relax, () => chosen.size >= PRACTICE_SIZE, stage);
      if (chosen.size >= PRACTICE_SIZE && primaryCount() >= primaryTarget && typed >= Math.min(typedMin, PRACTICE_SIZE)) break;
    }

    const complete = chosen.size >= PRACTICE_SIZE
      && primaryCount() >= primaryTarget
      && typed >= Math.min(typedMin, PRACTICE_SIZE);
    // The situation share is REPORTED, never a reason to climb the ladder: a
    // block that misses it is short of situational ITEMS, and relaxing a lemma
    // or leak cap would not add one.
    return {
      chosen,
      relaxUsed,
      complete,
      size: chosen.size,
      situation: situationCount(),
      situationTarget,
    };
  };

  let best = null;
  for (let salt = 0; salt < PICK_RETRIES; salt += 1) {
    let pass = runPass(salt);
    // THE SITUATION FLOOR NEVER OUTRANKS THE GRAMMAR SHARE. Reserving the seats
    // `PRIMARY_MIN` still needs is not enough on its own: a situational item also
    // spends lemma, answer-key and task-shape budget, and a primary item that
    // needed that budget can then no longer be seated. So a pass that misses
    // `complete` is simply drawn AGAIN without the situation fill, and the
    // complete seven wins. It costs nothing at `SITUATION_MIN = 4` — all 36
    // blocks of the shipped pool are complete either way — and it is there
    // because the pressure is real: calibrating against a trial floor of 5 put
    // L2 attempt 3 at three of seven on `verb-sein`. (That one this fallback
    // could NOT repair, because the loss was carried in from attempt 2, whose
    // draw had spent one more `verb-sein` item — which is how the floor of 5 was
    // measured to be a content shortage rather than an engine setting.)
    if (!pass.complete && pass.situationTarget > 0) {
      const withoutSituation = runPass(salt, false);
      if (withoutSituation.complete) pass = withoutSituation;
    }
    // Rank: a complete seven first, then the least relaxation, then the most
    // items — and only then, between draws that are equal in all three, the one
    // that is most about the Lektion's own situation. The order is what keeps
    // `SITUATION_MIN` from ever buying itself a cap or a missing seventh item.
    // Measured on the shipped a1.1 pool of 2026-09-13 this last key and the
    // situation clause in the break below change not one of the 36 blocks — the
    // fill pass already reaches the floor everywhere, and removing THAT is what
    // drops L7 attempt 3 back to 2 of 7 (the mutation in
    // `tests/lesson-engine.test.mjs`). They are the safety valve for the next
    // pool: a draw that cannot reach the floor keeps looking through the
    // remaining salts instead of stopping at the first complete seven.
    const better = !best
      || (pass.complete && !best.complete)
      || (pass.complete === best.complete && pass.relaxUsed < best.relaxUsed)
      || (pass.complete === best.complete && pass.relaxUsed === best.relaxUsed && pass.size > best.size)
      || (pass.complete === best.complete && pass.relaxUsed === best.relaxUsed && pass.size === best.size
        && pass.situation > best.situation);
    if (better) best = pass;
    if (best.complete && best.relaxUsed === 0 && best.situation >= best.situationTarget) break;
  }
  const chosen = best.chosen;

  // WHAT THE DRAW HAD TO GIVE UP, for whoever asks. `relaxUsed` is the ladder
  // stage the best pass needed: 0 means every cap held, ≥ 2 means the eligible
  // slice held no legal seven under the lemma and answer-key caps after
  // PICK_RETRIES orders — a CONTENT shortage, not an unlucky draw, and the only
  // honest way to tell the two apart from outside the engine.
  if (options.report && typeof options.report === 'object') {
    options.report.relaxUsed = best.relaxUsed;
    options.report.complete = best.complete;
    options.report.eligible = eligible.length;
    // What `MAX_OFF_PRIMARY_BLOCKS` could not see: how much of the seven is
    // about the Lektion's own scene (DaF review #12 MAJOR 4).
    options.report.situationCount = best.situation;
    options.report.situationTarget = best.situationTarget;
    options.report.situationComplete = best.situation >= Math.min(SITUATION_MIN, best.situationTarget);
  }

  // Present them in a seeded order so typed and recognition interleave.
  return seededShuffle([...chosen.values()], mulberry32(seed));
}

const planCache = new WeakMap();
const planReports = new WeakMap();

/**
 * The per-Lektion draw report of a plan `planPractice` returned:
 * Map<nr, { relaxUsed, complete, eligible, situationCount, situationTarget,
 * situationComplete }>. Guards read it to tell „this
 * Lektion breaks a cap because the engine picked badly“ from „…because its
 * eligible slice cannot honour every cap at once“ — after the `minLektion`
 * filter of round 10, L4 is the second kind and no reshuffle can fix it.
 */
export const practiceReport = (plan) => planReports.get(plan) || new Map();

/**
 * planPractice(curriculum, pool, attempt) → Map<lektion.nr, items[]>
 *
 * The whole level in one deterministic pass. Walking the Lektionen in order is
 * what makes the two cross-Lektion rules possible at all: an item drawn by
 * Lektion 3 is off the table for Lektion 7 while that topic still has unseen
 * items, and a Lektion may carry over at most one answer lemma from the one
 * before it. `buildLesson` reads the plan rather than drawing on its own, so a
 * single lesson and the whole course always agree.
 *
 * Memoised per (curriculum, pool, attempt): the plan is pure, and the player
 * rebuilds a lesson on every render.
 */
export function planPractice(curriculum, pool, attempt = 1) {
  const level = (curriculum && curriculum.level) || 'a1.1';
  let byPool = planCache.get(curriculum || {});
  if (curriculum && !byPool) {
    byPool = new WeakMap();
    planCache.set(curriculum, byPool);
  }
  const poolKey = pool && typeof pool === 'object' ? pool : null;
  let byAttempt = byPool && poolKey ? byPool.get(poolKey) : null;
  if (byPool && poolKey && !byAttempt) {
    byAttempt = new Map();
    byPool.set(poolKey, byAttempt);
  }
  if (byAttempt && byAttempt.has(attempt)) return byAttempt.get(attempt);

  // What the earlier attempts of each Lektion already showed. The seed alone
  // does not make a second draw a second draw — DaF review #9 MAJOR 1 measured
  // 62 of 84 items repeating between attempt 1 and 2, all seven in L2 and L8 —
  // so every attempt above 1 is planned against the union of the attempts
  // before it, which `pickPracticeItems` excludes until it has to relax.
  const priorByNr = new Map();
  for (let earlier = 1; earlier < attempt; earlier += 1) {
    for (const [nr, items] of planPractice(curriculum, pool, earlier)) {
      const seen = priorByNr.get(nr) || new Set();
      for (const it of items) seen.add(it.id);
      priorByNr.set(nr, seen);
    }
  }

  const lektionen = [...((curriculum && curriculum.lektionen) || [])].sort((a, b) => a.nr - b.nr);
  const plan = new Map();
  const usedIds = new Set();
  const earlierTerms = new Set();
  let previousAnswerLemmas = new Set();

  const reports = new Map();
  for (const lektion of lektionen) {
    const ownTerms = wortfeldTerms(lektion);
    const report = {};
    reports.set(lektion.nr, report);
    const items = pickPracticeItems(
      pool,
      lektion.practiceRule || { topics: [], typedMin: 0 },
      seedFor(level, lektion.nr, attempt),
      {
        lektionNr: lektion.nr,
        primarySlug: lektion.primarySlug || ((lektion.practiceRule || {}).topics || [])[0],
        ownTerms,
        earlierTerms: new Set(earlierTerms),
        usedIds: new Set(usedIds),
        previousAnswerLemmas,
        priorAttemptIds: priorByNr.get(lektion.nr) || new Set(),
        report,
      },
    );
    plan.set(lektion.nr, items);
    for (const it of items) usedIds.add(it.id);
    previousAnswerLemmas = new Set(items.flatMap((it) => [...answerLemmas(it)]));
    for (const t of ownTerms) earlierTerms.add(t);
  }

  planReports.set(plan, reports);
  if (byAttempt) byAttempt.set(attempt, plan);
  return plan;
}

const line = (dialog, i) => {
  const l = dialog && dialog.lines && dialog.lines[i];
  return l ? { ...l, index: i } : null;
};

/**
 * buildLesson({ curriculum, lektion, pool, dueCards, attempt }) → stage list.
 *
 * `nr` is the standard's stage number (0–8); `key` is unique per screen group,
 * because stage 2 (Input) is two screens — the dialogue, then the Wortfeld.
 * Stages with nothing to show (no due cards, no Hören slot) are left out
 * entirely rather than rendered empty.
 */
export function buildLesson({ curriculum, lektion, pool, dueCards = [], attempt = 1 }) {
  if (!lektion) return { stages: [], seed: 0, attempt };
  const level = (curriculum && curriculum.level) || 'a1.1';
  const seed = seedFor(level, lektion.nr, attempt);
  const stages = [];

  if (dueCards && dueCards.length) {
    stages.push({ nr: 0, key: 'warmup', kind: 'warmup', title: 'Wiederholung', cards: dueCards.slice(0, 4) });
  }
  if (lektion.pretest) {
    stages.push({ nr: 1, key: 'pretest', kind: 'pretest', title: 'Vorher probieren', pretest: lektion.pretest });
  }
  if (lektion.dialog) {
    stages.push({ nr: 2, key: 'dialog', kind: 'dialog', title: lektion.dialog.title || 'Dialog', dialog: lektion.dialog });
  }
  if (lektion.wortfeld && lektion.wortfeld.length) {
    stages.push({ nr: 2, key: 'wortfeld', kind: 'wortfeld', title: 'Wortfeld', words: lektion.wortfeld });
  }
  if (lektion.notice) {
    stages.push({ nr: 3, key: 'notice', kind: 'notice', title: lektion.notice.title || 'Grammatik', notice: lektion.notice });
  }

  // The plan owns the draw (cross-Lektion dedup); a Lektion the curriculum does
  // not list — the dev preview screen — falls back to a standalone draw.
  const plan = planPractice(curriculum, pool, attempt);
  const practice = plan.get(lektion.nr)
    || pickPracticeItems(pool, lektion.practiceRule || { topics: [], typedMin: 0 }, seed, {
      primarySlug: lektion.primarySlug,
      ownTerms: wortfeldTerms(lektion),
    });
  if (practice.length) {
    stages.push({ nr: 4, key: 'practice', kind: 'practice', title: 'Üben', items: practice });
  }

  const hoeren = lektion.hoeren;
  if (hoeren && hoeren.kind === 'dictation' && hoeren.lines && hoeren.lines.length) {
    const lines = hoeren.lines.map((i) => line(lektion.dialog, i)).filter(Boolean);
    if (lines.length) stages.push({ nr: 4, key: 'dictation', kind: 'dictation', title: 'Hören und schreiben', lines });
  }

  const sprechen = lektion.sprechen;
  if (sprechen && ((sprechen.readAloud && sprechen.readAloud.length) || sprechen.open)) {
    stages.push({
      nr: 5,
      key: 'speaking',
      kind: 'speaking',
      title: 'Sprechen',
      readAloud: (sprechen.readAloud || []).map((i) => line(lektion.dialog, i)).filter(Boolean),
      open: sprechen.open || null,
    });
  }

  if (lektion.schreiben) {
    stages.push({ nr: 6, key: 'writing', kind: 'writing', title: 'Schreiben', schreiben: lektion.schreiben });
  }

  // Filled in by the player once the misses are known (stage 7 in the standard).
  stages.push({ nr: 7, key: 'requeue', kind: 'requeue', title: 'Noch einmal', items: [] });
  stages.push({
    nr: 8,
    key: 'recap',
    kind: 'recap',
    title: 'Geschafft',
    wordCount: (lektion.wortfeld || []).length,
    grammar: (lektion.notice && lektion.notice.title) || lektion.primarySlug || '',
  });

  return { stages, seed, attempt, level, lektionId: lektion.id, nr: lektion.nr };
}

export default buildLesson;
