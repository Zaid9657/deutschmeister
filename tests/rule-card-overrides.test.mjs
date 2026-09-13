// Guard suite for scripts/rule-card-overrides.mjs.
//
// The override file replaces generated rule cards WHOLE: the builder merges each
// entry over the card of the same slug, so a missing key does not fall through to
// the generated value, it disappears from the text
// `netlify/functions/explain-answer.mjs` puts in the prompt. That is the failure
// this suite exists for — it compares the shape of every override against the
// COMMITTED netlify/functions/_shared/ruleCards.mjs, which is the generated
// artefact the override has to stand in for.
//
// The content rules come from the second DaF review
// (docs/course-factory/a11-rebuild/REVIEW-daf-2-2026-09-12.md §D):
//   * no sound comparison to English ("sounds like", "like English") — that
//     framing is what the review rejected on `alphabet-pronunciation`, and the
//     item pool was already cleaned of it;
//   * no percentage sign — the unsourced genus split on `nouns-gender` is a
//     measure-before-you-claim violation, so the character is banned outright;
//   * no ordinal number anywhere on `time-and-dates` — the course defers the
//     date with ordinals to A1.2 in writing, and the generated card was the only
//     place in the repo that taught it anyway. Naming the deferral ("Das Datum
//     mit Ordnungszahlen kommt erst in A1.2") is allowed; an ordinal FORM is not;
//   * at most 120 German words in the main rule, because the card is read by a
//     learner who has just failed an item. The English support line is excluded
//     from that count — it is deliberately English, one line per card, and
//     required to exist so the L1 support is consistent rather than accidental.

import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import OVERRIDES, { RULE_CARD_OVERRIDE_SLUGS } from '../scripts/rule-card-overrides.mjs';
import { RULE_CARDS } from '../netlify/functions/_shared/ruleCards.mjs';

const MAX_GERMAN_WORDS = 120;
const ENGLISH_LINE = /^English:/;

const germanWords = (content) =>
  content
    .split('\n')
    .filter((line) => !ENGLISH_LINE.test(line.trim()))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean);

const sortedKeys = (obj) => Object.keys(obj).sort();

test('the exported slug list matches the override map', () => {
  assert.deepEqual(RULE_CARD_OVERRIDE_SLUGS, Object.keys(OVERRIDES));
  assert.ok(RULE_CARD_OVERRIDE_SLUGS.length > 0, 'no overrides declared');
});

test('every override replaces a slug that the generated cards actually carry', () => {
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(RULE_CARDS, slug),
      `${slug} is not a generated rule card — an override for it would never be merged`,
    );
    assert.equal(slug, slug.toLowerCase(), `${slug} must be lowercase: ruleCard() lowercases the lookup`);
  }
});

test('every override has exactly the keys of the generated card it replaces', () => {
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    assert.deepEqual(
      sortedKeys(OVERRIDES[slug]),
      sortedKeys(RULE_CARDS[slug]),
      `${slug}: override keys diverge from the generated card`,
    );
  }
});

test('commonMistakes entries have the generated mistake shape', () => {
  const shape = ['correct', 'explanationDe', 'wrong'];
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    const mistakes = OVERRIDES[slug].commonMistakes;
    assert.ok(Array.isArray(mistakes), `${slug}: commonMistakes must be an array`);
    for (const [i, mistake] of mistakes.entries()) {
      assert.deepEqual(sortedKeys(mistake), shape, `${slug}: commonMistakes[${i}] has the wrong keys`);
      for (const key of shape) {
        assert.ok(mistake[key].trim().length > 0, `${slug}: commonMistakes[${i}].${key} is empty`);
      }
    }
  }
});

test('titleDe and content are non-empty German strings', () => {
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    const card = OVERRIDES[slug];
    assert.equal(typeof card.titleDe, 'string');
    assert.equal(typeof card.content, 'string');
    assert.ok(card.titleDe.trim().length > 0, `${slug}: titleDe is empty`);
    assert.ok(card.content.trim().length > 0, `${slug}: content is empty`);
  }
});

test('the main rule stays under the German word budget', () => {
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    const words = germanWords(OVERRIDES[slug].content);
    assert.ok(
      words.length <= MAX_GERMAN_WORDS,
      `${slug}: ${words.length} German words in content, budget is ${MAX_GERMAN_WORDS}`,
    );
  }
});

test('each card carries exactly one short English support line', () => {
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    const lines = OVERRIDES[slug].content.split('\n').map((l) => l.trim());
    const english = lines.filter((l) => ENGLISH_LINE.test(l));
    assert.equal(english.length, 1, `${slug}: expected one "English:" support line, found ${english.length}`);
    assert.ok(
      english[0].split(/\s+/).length <= 25,
      `${slug}: the English support line is a line, not a paragraph`,
    );
  }
});

test('no card compares German sounds to English', () => {
  const banned = [/sounds?\s+like/i, /like\s+English/i, /English\s+(Example|Sound)/i, /klingt\s+wie/i];
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    const card = OVERRIDES[slug];
    const haystack = [
      card.titleDe,
      card.content,
      ...card.commonMistakes.flatMap((m) => [m.wrong, m.correct, m.explanationDe]),
    ].join('\n');
    for (const pattern of banned) {
      assert.ok(!pattern.test(haystack), `${slug}: banned sound comparison ${pattern}`);
    }
  }
});

test('no card states a percentage', () => {
  for (const slug of RULE_CARD_OVERRIDE_SLUGS) {
    const card = OVERRIDES[slug];
    const haystack = [
      card.titleDe,
      card.content,
      ...card.commonMistakes.flatMap((m) => [m.wrong, m.correct, m.explanationDe]),
    ].join('\n');
    assert.ok(!haystack.includes('%'), `${slug}: a percentage has no source on an A1 rule card`);
    assert.ok(!/\bProzent\b/i.test(haystack), `${slug}: a percentage has no source on an A1 rule card`);
  }
});

test('nouns-gender teaches the gender-predicting endings instead of a share table', () => {
  const card = OVERRIDES['nouns-gender'];
  for (const ending of ['-ung', '-heit', '-keit', '-schaft', '-chen', '-lein', '-er']) {
    assert.ok(card.content.includes(ending), `nouns-gender: the ${ending} rule is missing`);
  }
});

test('time-and-dates carries the clock but no ordinal form', () => {
  const card = OVERRIDES['time-and-dates'];
  const haystack = [
    card.titleDe,
    card.content,
    ...card.commonMistakes.flatMap((m) => [m.wrong, m.correct, m.explanationDe]),
  ].join('\n');

  // Ordinal WORD forms (am fünften Mai) and ordinal DIGIT forms (am 5. Mai).
  const ordinalWord =
    /\b(erst|zweit|dritt|viert|fünft|sechst|siebt|acht|neunt|zehnt|elft|zwölft|zwanzigst|dreißigst)(e|en|er|es|em)\b/i;
  // A standalone "5." — the leading (^|\s) keeps clock times like 9:30. out of it.
  const ordinalDigit = /(?:^|\s)\d{1,2}\.(?=\s|$)/m;
  assert.ok(!ordinalWord.test(haystack), 'time-and-dates must not teach an ordinal form (A1.2)');
  assert.ok(!ordinalDigit.test(haystack), 'time-and-dates must not teach an ordinal date (A1.2)');

  // …but it must say the deferral out loud, and it must be about the clock.
  assert.match(card.content, /A1\.2/, 'time-and-dates must name the A1.2 deferral');
  assert.match(card.content, /acht Uhr dreißig/, 'time-and-dates must carry the official time');
  assert.match(card.content, /halb neun/, 'time-and-dates must carry the everyday time');
  assert.match(card.content, /Viertel nach/, 'time-and-dates must carry Viertel nach');
  assert.match(card.content, /Viertel vor/, 'time-and-dates must carry Viertel vor');
  for (const preposition of [/\bum\b/, /\bam\b/, /\bim\b/]) {
    assert.match(card.content, preposition, `time-and-dates must explain ${preposition}`);
  }

  const mistakes = card.commonMistakes.map((m) => `${m.wrong} ${m.correct} ${m.explanationDe}`).join('\n');
  assert.match(mistakes, /halb neun = 8:30, nicht 9:30/, 'the halb-neun mistake is pinned by the review');
  assert.match(mistakes, /um Montag → am Montag/, 'the um/am mistake is pinned by the review');
});

test('alphabet-pronunciation names the German letters', () => {
  const card = OVERRIDES['alphabet-pronunciation'];
  const names = [
    'A a',
    'B be',
    'C ce',
    'Q ku',
    'V Vau',
    'X ix',
    'Y Ypsilon',
    'Z Zett',
    'Ä a-Umlaut',
    'Ö o-Umlaut',
    'Ü u-Umlaut',
    'ß Eszett',
  ];
  for (const name of names) {
    assert.ok(card.content.includes(name), `alphabet-pronunciation: letter name "${name}" is missing`);
  }

  // Review #3 BLOCKER 3: the first version of this card spelled the names as
  // sound respellings ("C tse", "X iks", "Z tset"). A letter NAME is a word, not
  // a pronunciation hint, and the Lektion-1 items accept only the word.
  assert.ok(
    !/\b(tse|tset|iks)\b/.test(card.content),
    'alphabet-pronunciation: a sound respelling is back in the letter table',
  );
  assert.ok(!card.content.includes('Y ypsilon'), 'alphabet-pronunciation: Ypsilon is a name, capitalised');
  assert.ok(!card.content.includes('V vau'), 'alphabet-pronunciation: Vau is a name, capitalised');
  assert.match(card.content, /Wie schreibt man das\?/, 'the card must show how to ask for a spelling');
  assert.match(card.content, /A-N-A/, 'the card must show a spelled-out name');

  // 4–6 spelling examples drawn from the Lektion 1/2 Wortfeld.
  const examples = ['Chakiri', 'Ana', 'Tschüss', 'Entschuldigung', 'Vorname'];
  const present = examples.filter((word) => card.content.includes(word));
  assert.ok(present.length >= 4, `alphabet-pronunciation: only ${present.length} Lektion examples`);
  assert.ok(present.length <= 6, 'alphabet-pronunciation: keep the example list short');
});

// Review #3 BLOCKER 3: the card and the items of the SAME free Lektion disagreed
// on the letter names — the card taught "Z tset", the item accepted only "Zett",
// so a learner who read the explanation and followed it was marked wrong. This
// reads the shipped pools and pins the agreement rather than a hand-typed list.
const poolItems = (file) => {
  const parsed = JSON.parse(readFileSync(new URL(`../src/data/lessonPools/${file}`, import.meta.url), 'utf8'));
  return Array.isArray(parsed) ? parsed : parsed.items || [];
};

const LETTER_ITEM_RE = /Buchstabe\s+(\S+)\s+(?:auf Deutsch\?|heißt)/;

test('alphabet-pronunciation agrees with the letter names the Lektion 1 items accept', () => {
  const card = OVERRIDES['alphabet-pronunciation'];
  const items = [...poolItems('a11.json'), ...poolItems('a11.extra.json')].filter(
    (item) => item.topic === 'alphabet-pronunciation' && LETTER_ITEM_RE.test(item.questionDe || ''),
  );
  assert.ok(items.length > 0, 'no letter-name items found — the pin would be vacuous');

  for (const item of items) {
    const letter = LETTER_ITEM_RE.exec(item.questionDe)[1];
    const pair = `${letter} ${item.answer}`;
    assert.ok(
      card.content.includes(pair),
      `alphabet-pronunciation: item ${item.id} accepts "${item.answer}" for ${letter}, the card does not say "${pair}"`,
    );
  }

  const zMistake = card.commonMistakes.find((m) => /Buchstabe Z/.test(m.correct));
  assert.ok(zMistake, 'alphabet-pronunciation: the Z mistake is pinned by review #3');
  assert.match(zMistake.correct, /Zett/, 'the Z mistake must give the name the item accepts');
  assert.ok(
    !/tset/.test(`${zMistake.wrong} ${zMistake.correct} ${zMistake.explanationDe}`),
    'the Z mistake must not offer the respelling as an answer',
  );
});

// Review #3 MAJOR 1: "-er bei Personen → der" is refuted by the course itself —
// die Mutter, die Schwester and die Tochter are taught in Lektion 3.
test('nouns-gender does not claim -er marks every person noun as masculine', () => {
  const card = OVERRIDES['nouns-gender'];
  assert.ok(!/-er bei Personen/.test(card.content), 'nouns-gender: the refuted -er rule is back');
  for (const exception of ['die Mutter', 'die Schwester']) {
    assert.ok(card.content.includes(exception), `nouns-gender: the L3 counter-example ${exception} is missing`);
  }
  const mistakes = card.commonMistakes.map((m) => `${m.wrong} ${m.correct} ${m.explanationDe}`).join('\n');
  assert.ok(
    !/Personen auf -er sind der-Wörter/.test(mistakes),
    'nouns-gender: commonMistakes still teaches the refuted -er rule',
  );
});

test('yes-no-questions names the written-question rule and admits the spoken form', () => {
  const first = OVERRIDES['yes-no-questions'].commonMistakes[0];
  assert.match(
    first.explanationDe,
    /In der geschriebenen Frage steht das Verb auf Platz 1/,
    'commonMistakes[0] must state the written rule in those words',
  );
  assert.match(
    first.explanationDe,
    /[Gg]esprochen/,
    'commonMistakes[0] must acknowledge the spoken intonation question',
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW #4 (docs/course-factory/a11-rebuild/REVIEW-daf-4-2026-09-12.md, MAJOR 1
// and MAJOR 2). Round 3 overrode the four cards the review had named and left
// eight standing, seven of them the half-English pre-rebuild tables — the exact
// mechanism this repo has been rebuked for four rounds running: the finding is
// closed for the instances that were listed and stays open as a class. These
// four tests close it as a class: they run over EVERY A1.1 slug that the
// curriculum marks primary, so a thirteenth Lektion or a re-generated card
// cannot quietly arrive without an override that meets the same bar.
//
//   (a) every card carries at least two commonMistakes — `definite-articles`
//       shipped with an empty array, i.e. half the card was missing for L5;
//   (b) no English outside the single `English:` support line, measured with
//       `hasEnglish()` from src/data/lessonPools/quality.js — the same predicate
//       that gates the exercise pool, so card and item are held to one rule;
//   (c) no du-register anywhere (review #4 MAJOR 2: tasks and explanations use
//       Sie or impersonal `man`; only the dialogue duzt);
//   (d) every example noun stands in the Wortfeld the course has taught BY that
//       Lektion — the review's "die Karten reden über einen anderen Kurs".

import { CURRICULUM_A11, DIALOG_NAMES } from '../src/data/curricula/a11.js';
import { hasEnglish } from '../src/data/lessonPools/quality.js';

/** The twelve A1.1 slugs, each in the Lektion where the curriculum makes it primary. */
const PRIMARY_LEKTION = new Map(CURRICULUM_A11.lektionen.map((l) => [l.primarySlug, l.nr]));
const A11_SLUGS = [...PRIMARY_LEKTION.keys()];

const cardOf = (slug) => OVERRIDES[slug];
const contentLines = (card) => card.content.split('\n').map((l) => l.trim()).filter(Boolean);
const germanLines = (card) => contentLines(card).filter((l) => !ENGLISH_LINE.test(l));
const mistakeFields = (card) => card.commonMistakes.flatMap((m) => [m.wrong, m.correct, m.explanationDe]);

test('every A1.1 slug that a Lektion makes primary carries an override', () => {
  assert.equal(A11_SLUGS.length, 12, 'A1.1 has twelve Lektionen, each with one primary slug');
  const missing = A11_SLUGS.filter((slug) => !Object.prototype.hasOwnProperty.call(OVERRIDES, slug));
  assert.deepEqual(
    missing,
    [],
    `these primary slugs still ship the generated pre-rebuild card: ${missing.join(', ')}`,
  );
});

// (a)
test('every A1.1 card carries at least two commonMistakes', () => {
  for (const slug of A11_SLUGS) {
    const mistakes = cardOf(slug).commonMistakes;
    assert.ok(
      mistakes.length >= 2,
      `${slug}: ${mistakes.length} commonMistakes — half the card is missing for Lektion ${PRIMARY_LEKTION.get(slug)}`,
    );
  }
});

// (b)
// ONE collision, and it is not English: the German NAME of the letter W is
// *we*, and `ENGLISH_MARKERS` lists `we` as the English pronoun. The L1 card has
// to spell the letter names out (that is the whole finding it answers), so the
// name is removed before the English check rather than the check being skipped.
const LETTER_NAME_COLLISION = /\bwe\b/gi;
const withoutLetterNames = (text) => String(text).replace(LETTER_NAME_COLLISION, ' ');

test('no A1.1 card carries English outside its one English: support line', () => {
  for (const slug of A11_SLUGS) {
    const card = cardOf(slug);
    for (const line of germanLines(card)) {
      assert.ok(!hasEnglish(withoutLetterNames(line)), `${slug}: English in a German content line — "${line}"`);
    }
    assert.ok(!hasEnglish(card.titleDe), `${slug}: English in titleDe — "${card.titleDe}"`);
    for (const [i, field] of mistakeFields(card).entries()) {
      assert.ok(
        !hasEnglish(withoutLetterNames(field)),
        `${slug}: English in commonMistakes field ${i} — "${field}"`,
      );
    }
  }
});

// (c) ── du-register.
//
// The banned forms are the ones review #4 quoted plus the du-imperatives the
// pool normaliser already removes. ONE exemption, deliberately narrow and
// mechanical: a PARADIGM LINE — a line that names the persons, i.e. one
// carrying both `ich` and `du` as standalone words ("ich bin, du bist, er ist",
// "mein Geschenk (ich), dein Bruder (du)"). There `du` and `dein` are the
// grammar being taught, not an address to the reader; anywhere else they are
// the register bug. Nothing weaker is allowed: a bare "Du bist müde." or
// "Antworte mit einem Satz" carries no `ich` and therefore fails.
const DU_REGISTER_RE = /\b(du|dir|dich|dein\w*|sagst|lerne|antworte|tippe|kannst)\b/i;
const isParadigmLine = (text) => /\bich\b/i.test(text) && /\bdu\b/i.test(text);

test('no A1.1 card duzt outside a paradigm listing', () => {
  for (const slug of A11_SLUGS) {
    const card = cardOf(slug);
    const checked = [
      ['titleDe', card.titleDe],
      ...germanLines(card).map((line, i) => [`content line ${i + 1}`, line]),
      ...mistakeFields(card).map((field, i) => [`commonMistakes field ${i}`, field]),
    ];
    for (const [where, text] of checked) {
      if (isParadigmLine(text)) continue;
      const hit = DU_REGISTER_RE.exec(text);
      assert.equal(
        hit,
        null,
        `${slug} ${where}: du-register "${hit && hit[0]}" outside a paradigm line — "${text}"`,
      );
    }
  }
});

// (d) ── example nouns against the cumulative Wortfeld.
//
// HOW A NOUN IS FOUND. German capitalises nouns, so a capitalised token that is
// NOT at the start of a sentence is a noun. "Start of a sentence" resets at the
// beginning of a line and after `.`, `?`, `!`, `:` or `—` — the colon matters
// because these cards are written as "Frage: Wie schreibt man das?".
//
// HOW IT IS MATCHED. Against the `word` values of every Wortfeld entry of
// Lektion 1 … N, split into single words (so "Guten Tag" yields Tag and
// "Gäste einladen" yields Gäste). A token counts as covered when a Wortfeld form
// is a PREFIX of it (Buchstabe → Buchstaben, Heft → Hefte) or a SUFFIX of it
// (German compounds are head-final: Artikel → Possessivartikel). Umlaut plurals
// are deliberately NOT resolved — write "die Hefte", not "die Bücher", and the
// card stays inside the lexis it can point at.
//
// Everything a card may legitimately name beyond that lexis is listed below, by
// kind, and every list is closed. The four additions this round had to make are
// marked ADDED.
const META_NOUNS = [
  // grammar vocabulary — the card talks about German, so it needs these words
  'Artikel', 'Nomen', 'Verb', 'Satz', 'Satzende', 'Frage', 'Antwort', 'Aussage', 'Endung',
  'Plural', 'Singular', 'Buchstabe', 'Name', 'Uhr', 'Uhrzeit', 'Wort', 'Form', 'Formen',
  'Person', 'Pronomen', 'Genus', 'Stamm', 'Vokal', 'Infinitiv', 'Akkusativ', 'Regel',
  'Verneinung', 'Vorsilbe', 'Position', 'Beispiel', 'Gruppe', 'Anrede', 'Kurzantwort',
  'Wortfolge', 'Subjekt', 'Stimme', 'Sonderfall', 'Bedeutung', 'Ordnungszahl', 'Fehler',
  // ADDED 2026-09-13: the clock card needs the units it teaches, and neither is a
  // Wortfeld entry of L8 (the Wortfeld carries Uhrzeit, halb, Viertel nach/vor).
  'Stunde', 'Minute',
  // ADDED 2026-09-13: "Die Sache ist schon bekannt" is what definite-articles
  // teaches; L5's Wortfeld names the objects, not the word for a thing.
  'Sache',
  // ADDED 2026-09-13: L11 teaches the Satzklammer by name in its notice.
  'Satzklammer',
  // ADDED 2026-09-13: the words the cards use to talk about a sentence and about
  // the course itself — "das Verb steht auf Platz 1" is the wording review #3
  // pinned, "die Vorsilbe steht am Ende" is L11's notice, and a card may say
  // what happens "in Übungen".
  'Platz', 'Ende', 'Übung',
  // ADDED 2026-09-13: Ja and Nein quoted as words ("nicht nur Ja plus Verb").
  'Ja', 'Nein',
];

/** Letter NAMES, which the L1 card must spell out — they are names, not lexis. */
const LETTER_NAMES = ['Jot', 'Vau', 'We', 'Ypsilon', 'Zett', 'Eszett', 'Umlaut', 'Zed'];

/** The polite Sie/Ihr paradigm, capitalised by rule rather than by word class. */
const POLITE_FORMS = ['Sie', 'Ihr', 'Ihre', 'Ihren', 'Ihrem', 'Ihnen'];

/** Proper nouns: people and places. Reuses the curriculum's own list. */
const PROPER_NAMES = [...DIALOG_NAMES, 'Marokko', 'Schweiz', 'Meier'];

/**
 * The nouns-gender card demonstrates gender-PREDICTING ENDINGS. An ending is
 * shown on words that carry it, and A1.1's Wortfeld happens to contain exactly
 * one (-ung: die Entschuldigung). These five are the -heit/-keit/-schaft/-chen/
 * -lein demonstrations; they are the card's subject matter, not its situation.
 */
const GENDER_ENDING_EXAMPLES = ['Freiheit', 'Möglichkeit', 'Freundschaft', 'Mädchen', 'Brötchen'];

/**
 * Wortfeld words a card needs BEFORE the Lektion that teaches them. Kept to the
 * one case that exists: `im` governs month names, so the L8 clock card cannot
 * state its own rule without naming a month, and A1.1 teaches Monat and Mai in
 * L12. Anything added here is a card reaching outside its own course-so-far and
 * must be argued, not assumed.
 */
const EARLY_USE = { 'time-and-dates': ['Monat', 'Mai', 'Datum'] };

const ALWAYS_ALLOWED = [...META_NOUNS, ...LETTER_NAMES, ...POLITE_FORMS, ...PROPER_NAMES, ...GENDER_ENDING_EXAMPLES];

const splitWords = (text) => String(text).split(/[^A-Za-zÄÖÜäöüß]+/).filter(Boolean);

/** Every Wortfeld word of Lektion 1 … nr, lowercased and split into single words. */
const cumulativeWortfeld = (nr) => {
  const forms = new Set();
  for (const lektion of CURRICULUM_A11.lektionen) {
    if (lektion.nr > nr) continue;
    for (const entry of lektion.wortfeld) {
      for (const word of splitWords(entry.word)) forms.add(word.toLowerCase());
    }
  }
  return [...forms].filter((w) => w.length >= 3);
};

/** Capitalised tokens that are not sentence-initial — i.e. the nouns of the text. */
const nounTokens = (text) => {
  const found = [];
  let atSentenceStart = true;
  for (const token of String(text).split(/\s+/)) {
    const bare = token.replace(/^[^A-Za-zÄÖÜäöüß]+/, '').replace(/[^A-Za-zÄÖÜäöüß]+$/, '');
    if (bare && !atSentenceStart && /^[A-ZÄÖÜ][a-zäöüß]+$/.test(bare)) found.push(bare);
    if (bare) atSentenceStart = false;
    if (/[.?!:—]$/.test(token)) atSentenceStart = true;
  }
  return found;
};

test('every example noun stands in the Wortfeld the course has taught by that Lektion', () => {
  for (const slug of A11_SLUGS) {
    const nr = PRIMARY_LEKTION.get(slug);
    const forms = cumulativeWortfeld(nr);
    const allowed = new Set([...ALWAYS_ALLOWED, ...(EARLY_USE[slug] || [])].map((w) => w.toLowerCase()));
    // Prefix/suffix matching applies to the allow-lists too: "Name" covers
    // "Namen", "Artikel" covers "Possessivartikel".
    const covered = (token) => {
      const low = token.toLowerCase();
      return [...allowed, ...forms].some((form) => low === form || low.startsWith(form) || low.endsWith(form));
    };

    const card = cardOf(slug);
    const offenders = [...new Set(
      [...germanLines(card), ...mistakeFields(card)].flatMap(nounTokens).filter((t) => !covered(t)),
    )];
    assert.deepEqual(
      offenders,
      [],
      `${slug} (Lektion ${nr}): nouns outside the Wortfeld taught by Lektion ${nr}: ${offenders.join(', ')}`,
    );
  }
});
