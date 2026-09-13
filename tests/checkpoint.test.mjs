// Guard suite for the checkpoint builder and the spaced-review ladder
// (docs/course-standard-2026-09-12.md §3; docs/course-factory/a11-rebuild/CONTRACT.md).
//
// What each pin defends:
//
//   1. THE SHAPE OF A CHECKPOINT — 20 items in exactly 5/4/6/3/2. The standard
//      mirrors the Goethe/telc section split; a checkpoint that quietly drifts
//      to "whatever the pool had" is no longer an exam rehearsal, which is the
//      only reason it exists.
//   2. DETERMINISM — the same seed must build the same test, in every runtime.
//      Without it "Nochmal" could hand a learner an easier paper, and no test
//      here could pin anything.
//   3. THE PASS RULE — 60 % overall AND no scored section below 40 %. Both
//      halves matter: a learner who aces Sprachbausteine and hears nothing has
//      not passed, and that is the whole point of the second clause.
//   3b. SPRECHEN IS SCORED BY THE RUN, NOT THE BUILD (plan P3). Every read-aloud
//      CAN be scored (score-readaloud aligns the transcript word by word), so
//      the section enters the overall and the 40 % rule — but only when every
//      item of it actually came back from a microphone. One self-confirm and the
//      whole section drops out again, because half a Sprechen score is not a
//      Sprechen score, and a number we cannot defend is worse than none.
//   3c. AUDIO ITEMS SAY WHERE THEIR SOUND COMES FROM. Hören and Sprechen items
//      carry lektionId + lineKey so playLine() can use the recording from the
//      audio manifest and fall back to the synthesiser only where there is
//      none. Without those fields every checkpoint is the robot voice forever.
//   4. THE 70/30 DRAW — once earlier chapters exist, the pool-drawn items must
//      interleave them. Spacing is the single strongest effect in the research
//      memo (g = 0.74); a chapter-only checkpoint throws it away.
//   4b. THE LESEN SECTION TESTS READING (DaF review #5). Two things are pinned:
//      the truth values are DRAWN, so the four checkpoints do not all answer
//      R–F–R–F (a learner who saw checkpoint 1 scored 4/4 in 2–4 blind), and a
//      "falsch" statement is the SAME text with one detail changed, not a line
//      quoted from another Lektion — string recognition was all the old
//      generator asked for.
//      A falsified word must also stand where a word can be swapped at all: in
//      a real NP slot (article/possessive/demonstrative), or it is a bare noun
//      welded to its verb (Fußball spielen) and the swap breaks the sentence
//      instead of falsifying it. When a window yields nothing the builder falls
//      back — adverb pair, then another window — so the section is never short.
//   4c. THE SCHREIBEN SECTION IS THE COURSE'S OWN WRITING (DaF review #5): the
//      chapter's real, AI-graded task plus two drills from DIFFERENT Lektionen,
//      and no invented `register` label on a sentence-building item.
//   5. REMEDIATION TARGETING — the set after a failure must be about the topics
//      that were actually missed, and must never repeat an item just seen.
//   6. THE LADDER — 1/4/7/14/60/180 with lapse → step 0. These are the numbers
//      the schedule is made of; ladder.js is the only place they are computed.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildCheckpoint,
  scoreCheckpoint,
  remediationSet,
  isItemCorrect,
  SECTION_COUNTS,
  SECTION_ORDER,
  CHECKPOINT_ITEM_COUNT,
  POOL_ITEMS_TOTAL,
  POOL_ITEMS_EARLIER,
  isTyped,
  topicsOf,
  chapterLektionen,
  earlierLektionen,
  itemIsScored,
  isMicResult,
  isWritingResult,
  SPRECHEN_PASS_PCT,
  WRITING_PASS_PCT,
  chapterWritingTask,
  isNextLevelPreview,
} from '../src/lib/checkpoint/buildCheckpoint.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { knownUpTo, untaughtTokens, namesOf } from '../src/lib/checkpoint/lexis.js';
import { courseWritingTasks } from '../src/data/writingTasks.js';
import { nextDue, LADDER_DAYS, MAX_STEP, wordCardKey, patternCardKey, sentenceCardKey, parseCardKey } from '../src/lib/review/ladder.js';
import { CURRICULUM_FIXTURE, CURRICULUM_FIXTURE_6 } from './fixtures/curriculum-fixture.js';

const POOL = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));

// The four real checkpoints, built once: several pins below read all 80 items.
const ALL_CHECKPOINTS = CURRICULUM_A11.checkpoints.map((cp) => ({
  cp,
  items: buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool: POOL }),
}));

const cp1 = CURRICULUM_FIXTURE.checkpoints[0];
const cp2of6 = CURRICULUM_FIXTURE_6.checkpoints[1];

const build = (curriculum, checkpoint, seed) =>
  buildCheckpoint({ curriculum, checkpoint, pool: POOL, seed });

// ── 1. shape ────────────────────────────────────────────────────────────────

test('a checkpoint is 20 items in the 5/4/6/3/2 section split', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  assert.equal(items.length, CHECKPOINT_ITEM_COUNT);
  for (const section of SECTION_ORDER) {
    assert.equal(
      items.filter((i) => i.section === section).length,
      SECTION_COUNTS[section],
      `${section} must hold exactly ${SECTION_COUNTS[section]} items`,
    );
  }
  assert.equal(Object.values(SECTION_COUNTS).reduce((a, b) => a + b, 0), CHECKPOINT_ITEM_COUNT);
});

test('all four real checkpoints ship the full 5/4/6/3/2 split, never a short section', () => {
  // The fixture pins the shape in the abstract; this pins it on the four papers
  // a learner actually sits. Lesen is the section that can go short — a window
  // whose lines carry no falsifiable detail used to drop the item silently, and
  // the builder must fall back (adverb pair, then another window) instead.
  for (const { cp, items } of ALL_CHECKPOINTS) {
    assert.equal(items.length, CHECKPOINT_ITEM_COUNT, `${cp.id} must be 20 items`);
    for (const section of SECTION_ORDER) {
      assert.equal(
        items.filter((i) => i.section === section).length,
        SECTION_COUNTS[section],
        `${cp.id}: ${section} must hold exactly ${SECTION_COUNTS[section]} items`,
      );
    }
  }
});

test('Hören is 3 dictations of dialogue lines plus 2 word-choice items with 3 distractors', () => {
  const items = build(CURRICULUM_FIXTURE, cp1).filter((i) => i.section === 'hoeren');
  const dictations = items.filter((i) => i.kind === 'dictation');
  const choices = items.filter((i) => i.kind === 'wordChoice');
  assert.equal(dictations.length, 3);
  assert.equal(choices.length, 2);

  const lines = new Set(
    chapterLektionen(CURRICULUM_FIXTURE, cp1).flatMap((l) => l.dialog.lines.map((line) => line.de)),
  );
  for (const d of dictations) {
    assert.ok(lines.has(d.answer), 'a dictation must be an actual dialogue line of the chapter');
    assert.equal(d.mode, 'typed');
    assert.equal(d.audioText, d.answer);
  }
  const wortfeld = new Set(chapterLektionen(CURRICULUM_FIXTURE, cp1).flatMap((l) => l.wortfeld.map((w) => w.de)));
  for (const c of choices) {
    assert.equal(c.options.length, 4, 'correct word + 3 distractors');
    assert.ok(c.options.includes(c.answer));
    for (const option of c.options) assert.ok(wortfeld.has(option), 'distractors come from the Wortfeld');
  }
});

test('Lesen items carry a 2–3 line text and a richtig/falsch statement, two of each', () => {
  const items = build(CURRICULUM_FIXTURE, cp1).filter((i) => i.section === 'lesen');
  assert.equal(items.length, 4);
  for (const item of items) {
    assert.deepEqual(item.options, ['Richtig', 'Falsch']);
    assert.ok(item.text && item.text.split(' ').length > 3, 'a Lesen item shows a text');
    assert.ok(['Richtig', 'Falsch'].includes(item.answer));
    assert.equal(item.hint, null, 'the hint named the Lektion, which is half the answer');
  }
  assert.equal(items.filter((i) => i.answer === 'Richtig').length, 2);
  assert.equal(items.filter((i) => i.answer === 'Falsch').length, 2);
  // A "falsch" statement must not be quoting a line of its own text.
  for (const item of items.filter((i) => i.answer === 'Falsch')) {
    const quoted = item.promptDe.slice(item.promptDe.indexOf('„') + 1, item.promptDe.lastIndexOf('“'));
    assert.ok(!item.text.includes(quoted.split(': ').slice(1).join(': ')), 'a falsch statement is false by construction');
  }
});

const quotedStatement = (item) =>
  item.promptDe.slice(item.promptDe.indexOf('„') + 1, item.promptDe.lastIndexOf('“')).split(': ').slice(1).join(': ');

test('the Lesen answer key is drawn, not the same R–F–R–F in every checkpoint', () => {
  // The real curriculum, because this is a claim about the four checkpoints a
  // learner actually sits — the fixture has one.
  const orders = CURRICULUM_A11.checkpoints.map((cp) =>
    buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool: POOL })
      .filter((i) => i.section === 'lesen')
      .map((i) => i.answer)
      .join('-'),
  );
  assert.equal(orders.length, 4);
  for (const order of orders) {
    assert.equal(order.split('-').filter((a) => a === 'Richtig').length, 2, 'still two richtig');
    assert.equal(order.split('-').filter((a) => a === 'Falsch').length, 2, 'and two falsch');
  }
  assert.ok(new Set(orders).size >= 2, `all four checkpoints share one answer key: ${orders.join(' | ')}`);
});

test('a falsch statement is this text with ONE detail changed, not another Lektion', () => {
  for (const cp of CURRICULUM_A11.checkpoints) {
    const chapterLines = new Set(
      chapterLektionen(CURRICULUM_A11, cp).flatMap((l) => l.dialog.lines.map((line) => line.de)),
    );
    const items = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool: POOL })
      .filter((i) => i.section === 'lesen');
    for (const item of items.filter((i) => i.answer === 'Falsch')) {
      const statement = quotedStatement(item);
      assert.ok(!chapterLines.has(statement), 'a falsch statement is not a real line of any Lektion');
      // It derives from a line of ITS OWN text, with exactly ONE word changed —
      // the explanation names the line, and the line is in the text.
      assert.match(item.explanationDe, /Im Text steht/, 'the explanation shows what the text really says');
      const source = item.explanationDe.slice(item.explanationDe.indexOf('„') + 1, item.explanationDe.indexOf('“'));
      assert.ok(item.text.includes(source), `${cp.id}: the falsified line must be IN this text`);
      const words = statement.split(' ');
      const other = source.split(' ');
      assert.equal(other.length, words.length, `${cp.id}: one detail changed, not the sentence`);
      assert.equal(
        words.filter((w, i) => w !== other[i]).length,
        1,
        `${cp.id}: exactly one word differs — ${statement} vs ${source}`,
      );
    }
  }
});

// ── 4d. A FALSE STATEMENT IS FALSE, NOT BROKEN (DaF review #6, MAJOR 7) ─────
//
// The falsifier replaces exactly one detail of a line of the same text. It had
// no congruence bar: any capitalised word of the dialogues could be swapped for
// any other, and checkpoint 3 shipped the L9 football line with `Woche` replaced
// by **Frühstück** — a neuter noun under a feminine `jede`. In the graded Lesen
// section that hands the answer over through the FORM instead of the content,
// and shows the learner a wrong form on the way. The replacement must now share
// the class of the word it replaces: a noun its ARTICLE (from the Wortfeld,
// where `article` and `plural` already live), a weekday a weekday, a name a
// name — and a number word inside a digit group (a phone number, read digit by
// digit) only a SINGLE-DIGIT number word, because „Siebzehn vier zwei“ is not a
// changed detail but a number nobody can dictate.

const NUMBER_WORDS_TEST = [
  'null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
  'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn',
  'neunzehn', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig',
  'neunzig', 'hundert',
];
const WEEKDAYS_TEST = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const isDigitWord = (w) => NUMBER_WORDS_TEST.slice(0, 10).includes(w.toLowerCase());

// ── and the SEMANTIC half of the same rule (DaF review #7, MAJOR 2) ─────────
//
// The article bar is morphological only, so checkpoint 3 shipped „Spielst du
// jede **Kellinerin** Fußball?“ against „… jede **Woche** Fußball?“: `die Woche`
// and `die Kellnerin` share their article, the swap is impeccable German — and
// the sentence is broken rather than false, so the learner solves the graded
// Lesen item through meaning instead of through the text. `jede Woche` is an
// adverbial accusative: the noun stands there as a time unit, not as a thing,
// and the Wortfeld (`article`, `plural`) cannot see that. So the word LEFT of
// the change decides: after a quantifier (jede/jeden/jedes/jeder/alle/allen)
// nothing may be swapped at all, and after a deictic (diese/diesen/…) only
// within the semantic class — time for time, thing for thing.
const QUANTIFIER_DET_TEST = ['jede', 'jeden', 'jedes', 'jeder', 'alle', 'allen'];
const DEICTIC_DET_TEST = ['diese', 'diesen', 'dieses', 'dieser', 'diesem'];
const TIME_NOUNS_TEST = [
  'Woche', 'Wochen', 'Wochenende', 'Wochenenden', 'Tag', 'Tage', 'Monat', 'Monate',
  'Jahr', 'Jahre', 'Stunde', 'Stunden', 'Minute', 'Minuten', 'Morgen', 'Vormittag',
  'Mittag', 'Nachmittag', 'Abend', 'Abende', 'Nacht', 'Nächte', 'Uhrzeit', 'Zeit',
];
const semanticClassTest = (w) =>
  (TIME_NOUNS_TEST.includes(w) || WEEKDAYS_TEST.includes(w) ? 'zeit' : 'ding');

// ── and the POSITIONAL half (the residual of round 8) ───────────────────────
//
// The article bar and the quantifier bar both look at a noun and the word to
// its left, and neither of them can see a noun that has no determiner at all.
// So checkpoint 3 still shipped „Spielst … jede Woche **Durst**?“ against
// „… jede Woche **Fußball**?“: `Fußball` is the bare object of the idiom
// *Fußball spielen*, `Durst` the bare object of *Durst haben*, both `der`, so
// every congruence check passes and the result is not a false statement about
// the text but no German sentence at all. A bare noun in German is almost
// always welded to its verb, and the Wortfeld carries no valency data — so the
// rule is positional: the vocab branch may only swap a noun that stands in a
// REAL NP SLOT, immediately preceded by an article, a possessive or a
// demonstrative.
//
// That makes a window able to run out of swappable tokens, and a Lesen section
// is 4 items on every checkpoint. The builder therefore falls back — to a
// place/time adverb pair, and then to another window of the chapter — before it
// would ever ship a short section. This pin allows exactly those two extra
// sources and nothing else.
const NP_DET_RE_TEST = /^(?:der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|kein|keine|keinen|keinem|keiner|keines|d?ein|d?eine|d?einen|d?einem|d?einer|d?eines|sein|seine|seinen|seinem|seiner|seines|ihr|ihre|ihren|ihrem|ihrer|ihres|unser|unsere|unseren|unserem|unserer|unseres|euer|eure|euren|eurem|eurer|eures|dieser|diese|diesen|diesem|dieses)$/i;

/** The documented adverb fallback table, as ADVERB_SWAPS in the builder. */
const ADVERB_SWAPS_TEST = new Map([
  ['heute', ['morgen']],
  ['morgen', ['heute']],
  ['hier', ['da', 'dort']],
  ['da', ['hier']],
  ['dort', ['hier']],
  ['links', ['rechts']],
  ['rechts', ['links']],
  ['früh', ['spät']],
  ['spät', ['früh']],
  ['morgens', ['abends']],
  ['abends', ['morgens']],
]);

/** The chapter's nouns with their gender, exactly as buildCheckpoint reads them. */
function genderMap(chapter) {
  const map = new Map();
  for (const l of chapter) {
    for (const w of l.wortfeld || []) {
      if (!w.article) continue;
      const word = String(w.word || w.de || '').trim();
      if (word && !/\s/.test(word)) map.set(word, String(w.article));
      const plural = String(w.plural || '').trim();
      if (plural && plural !== '—' && !/\s/.test(plural)) map.set(plural, 'plural');
    }
  }
  return map;
}

test('a falsch statement changes ONE word for a word of the same class — article, weekday, name, digit', () => {
  let checked = 0;
  for (const { cp, items } of ALL_CHECKPOINTS) {
    const chapter = chapterLektionen(CURRICULUM_A11, cp);
    const genders = genderMap(chapter);
    const names = new Set(
      chapter.flatMap((l) => (l.dialog?.lines || []).flatMap((line) => String(line.speaker || '').split(/\s+/)))
        .filter((part) => part.length >= 3 && /^[A-ZÄÖÜ]/.test(part) && !['Herr', 'Frau'].includes(part)),
    );
    for (const item of items.filter((i) => i.section === 'lesen' && i.answer === 'Falsch')) {
      const statement = quotedStatement(item);
      const source = item.explanationDe.slice(item.explanationDe.indexOf('„') + 1, item.explanationDe.indexOf('“'));
      const changed = statement.split(' ');
      const original = source.split(' ');
      assert.equal(changed.length, original.length, `${cp.id} ${item.id}: one word, not the sentence`);
      const diff = changed.map((w, i) => [original[i], w]).filter(([a, b]) => a !== b);
      assert.equal(diff.length, 1, `${cp.id} ${item.id}: exactly one word differs`);
      const [rawFrom, rawTo] = diff[0].map((w) => w.replace(/[.,!?„“]/g, ''));
      const from = rawFrom;
      const to = rawTo;
      checked += 1;

      if (NUMBER_WORDS_TEST.includes(from.toLowerCase())) {
        assert.ok(NUMBER_WORDS_TEST.includes(to.toLowerCase()), `${item.id}: a number is replaced by a number`);
        // A digit group is two or more number words in a row — the phone number.
        const words = original.map((w) => w.replace(/[.,!?„“]/g, ''));
        const at = words.findIndex((w) => w === from);
        const neighbourIsNumber = [at - 1, at + 1]
          .some((j) => words[j] && NUMBER_WORDS_TEST.includes(words[j].toLowerCase()));
        if (neighbourIsNumber) {
          assert.ok(isDigitWord(to), `${item.id}: inside a phone number only single digits may be swapped, got "${to}"`);
        } else {
          assert.ok(!['eins', 'null'].includes(to.toLowerCase()), `${item.id}: "${to} Euro" is broken, not false`);
        }
        continue;
      }
      if (WEEKDAYS_TEST.includes(from)) {
        assert.ok(WEEKDAYS_TEST.includes(to), `${item.id}: a weekday is replaced by a weekday`);
        continue;
      }
      if (names.has(from)) {
        assert.ok(names.has(to), `${item.id}: a name is replaced by a name of this chapter`);
        continue;
      }
      if (/^\d+$/.test(from)) {
        assert.match(to, /^\d+$/, `${item.id}: a figure is replaced by a figure`);
        continue;
      }
      if (ADVERB_SWAPS_TEST.has(from)) {
        assert.ok(
          ADVERB_SWAPS_TEST.get(from).includes(to),
          `${item.id}: „${from}“ may only become its documented opposite, got „${to}“`,
        );
        continue;
      }
      assert.ok(genders.has(from), `${item.id}: "${from}" is not a Wortfeld noun of the chapter`);
      assert.equal(
        genders.get(to),
        genders.get(from),
        `${item.id}: „${from}“ (${genders.get(from)}) replaced by „${to}“ (${genders.get(to)}) — the article must match`,
      );
      // The determiner the swapped noun stands under, read off the SOURCE line.
      const at = original.findIndex((w) => w.replace(/[.,!?„“]/g, '') === from);
      const det = String(at > 0 ? original[at - 1].replace(/[.,!?„“]/g, '') : '').toLowerCase();
      assert.ok(
        !QUANTIFIER_DET_TEST.includes(det),
        `${item.id}: „${det} ${from}“ is a quantity/time expression — „${det} ${to}“ is broken, not false`,
      );
      // …and the noun must stand in a real NP slot in the first place: a bare
      // noun is the object of an idiom (Fußball spielen), never a free slot.
      assert.ok(
        NP_DET_RE_TEST.test(det),
        `${item.id}: „${from}“ is a bare noun here („${det} ${from}“) — swapping it breaks the sentence instead of falsifying it`,
      );
      if (DEICTIC_DET_TEST.includes(det)) {
        assert.equal(
          semanticClassTest(to),
          semanticClassTest(from),
          `${item.id}: „${det} ${from}“ (${semanticClassTest(from)}) may only become a ${semanticClassTest(from)} noun, got „${to}“`,
        );
      }
    }
  }
  assert.ok(checked >= 8, `two falsch statements per checkpoint, got ${checked}`);
});

// ── 4e. NO UNTAUGHT LEXIS IN A GRADED TEST (DaF review #6, MAJOR 8) ─────────
//
// `dd86dc8a` shipped as `a1.1-cp2-schreiben-1` — „Schreiben Sie den Satz:
// [Honig / ist / gut]“, first of three items in the GRADED Schreiben section of
// a chapter about a Flohmarkt, a Klassenzimmer and a Büro. `Honig` is in no
// Wortfeld of the course and its explanation adds `König`. Eleven of the 80
// items carried lexis like it. The draw now sorts taught-first
// (buildCheckpoint's untaughtAt), measured with the validator's own RULE 11
// machinery, and this is the number that has to stay 0.
//
// WHAT IS MEASURED. The lexis an item OWNS: for a pool item its prompt (minus
// the bracketed cue and the closed Sie-Aufgabenformel), answer and accepted —
// the exact fields RULE 11 reads. The builder's own instruction chrome
// („Hören Sie zu und schreiben Sie den Satz.“) and the fixed Richtig/Falsch
// labels are not item lexis, and the graded writing task is the chapter's own
// task from src/data/writingTasks.js — the checkpoint has no second candidate
// to pick for it, so its text is that bank's rule, not this draw's.

const quotedSpan = (s) => {
  const a = s.indexOf('„'); const b = s.lastIndexOf('“');
  return a >= 0 && b > a ? s.slice(a + 1, b) : '';
};

/** The texts whose lexis the item itself is responsible for (see above). */
function ownLexis(item) {
  if (item.poolItemId) {
    return [item.promptDe, item.answer, ...item.accepted].filter((t) => typeof t === 'string');
  }
  if (item.type === 'graded_writing') return [];
  if (item.section === 'lesen') return [quotedSpan(item.promptDe)].filter(Boolean);
  return [item.audioText, typeof item.answer === 'string' ? item.answer : null].filter(Boolean);
}

test('no checkpoint item asks for lexis the course has not taught by the end of its chapter', () => {
  const names = namesOf(CURRICULUM_A11.level);
  const offenders = [];
  for (const { cp, items } of ALL_CHECKPOINTS) {
    const known = knownUpTo(CURRICULUM_A11, cp.afterLektion);
    assert.ok(known && known.size > 100, 'the level must have lexis tables');
    for (const item of items) {
      const texts = ownLexis(item);
      if (!texts.length) continue;
      const tokens = untaughtTokens({ questionDe: texts[0], accepted: texts.slice(1) }, known, names);
      if (tokens.length) offenders.push(`${cp.id} ${item.id} [${item.poolItemId || '—'}]: ${tokens.join(', ')} — ${texts[0]}`);
    }
  }
  assert.deepEqual(offenders, [], `untaught lexis in a graded checkpoint:\n${offenders.join('\n')}`);
});

test('the Honig item is not drawn into checkpoint 2 (or any other) any more', () => {
  const HONIG = 'dd86dc8a-49b8-5d48-8a6a-2606fd90b0fd';
  const drawn = ALL_CHECKPOINTS.flatMap(({ items }) => items.map((i) => i.poolItemId));
  assert.ok(!drawn.includes(HONIG), 'dd86dc8a („[Honig / ist / gut]“) must not be a checkpoint item');
  const honig = POOL.items.find((i) => i.id === HONIG);
  if (honig) {
    const known = knownUpTo(CURRICULUM_A11, CURRICULUM_A11.checkpoints[1].afterLektion);
    assert.ok(
      untaughtTokens(honig, known, namesOf(CURRICULUM_A11.level)).length > 0,
      'and it is excluded for the reason claimed: its lexis is untaught at the end of chapter 2',
    );
  }
});

// ── 4f. NO NEXT-LEVEL PREVIEW IN A GRADED TEST (DaF review #7, BLOCKER 3) ───
//
// `03bd1113` shipped as `a1.1-cp4-bausteine-4` — „Hast du ___ Schlüssel?
// (du — Vorschau Akkusativ)“ → `deinen`, one of six Sprachbausteine in the
// GRADED closing checkpoint, on a STRICT_TOPIC with no typo tolerance, and its
// own explanation reads „Vorschau auf den Akkusativ (A1.2)“. L12's notice
// teaches `dein Bruder` and the rule card says the -e comes only before
// feminines and plurals, so `dein` — the answer the course taught — is marked
// wrong in the final test. Its twin `64680d9b` („Ich habe ___ Bruder gern.“ →
// `meinen`) sits in the same pool, so this is a class, not an instance.
//
// The builder-side rule (no item may demand a form no notice and no rule card
// introduces) lands in the pool build; this is the belt-and-braces at the
// checkpoint's own pool door, and this test is the number that has to stay 0.
const NEXT_LEVEL_RE_TEST = /Vorschau|A1\.2|kommt in A1/i;

test('no checkpoint item names a next-level preview in its prompt, hint or explanation', () => {
  for (const { cp, items } of ALL_CHECKPOINTS) {
    for (const item of items) {
      const text = [item.promptDe, item.hint, item.explanationDe].filter(Boolean).join(' ');
      assert.ok(
        !NEXT_LEVEL_RE_TEST.test(text),
        `${cp.id} ${item.id} (pool ${item.poolItemId}): a graded checkpoint may not test a form the course defers — „${text}“`,
      );
    }
  }
});

test('the deinen/meinen preview twins are not drawable by any checkpoint', () => {
  const TWINS = ['03bd1113-6ab0-589d-b0d6-12f03d5c1952', '64680d9b'];
  const drawn = ALL_CHECKPOINTS.flatMap(({ items }) => items.map((i) => i.poolItemId).filter(Boolean));
  for (const twin of TWINS) {
    assert.ok(!drawn.some((id) => id.startsWith(twin)), `${twin} must not be a checkpoint item`);
  }
  // And for the reason claimed: the pool still holds it, the gate rejects it.
  const previews = POOL.items.filter(isNextLevelPreview);
  for (const item of previews) {
    assert.ok(!drawn.includes(item.id), `${item.id} calls itself a preview and must stay out`);
  }
});

test('Sprachbausteine is 6 pool items with at least 4 typed; Schreiben is 3 production items', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  const bausteine = items.filter((i) => i.section === 'bausteine');
  assert.equal(bausteine.length, 6);
  assert.ok(bausteine.every((i) => i.poolItemId), 'Sprachbausteine come from the pool');
  assert.ok(bausteine.filter((i) => i.mode === 'typed').length >= 4, 'at least 4 typed');

  const schreiben = items.filter((i) => i.section === 'schreiben');
  assert.equal(schreiben.length, 3);
  // The fixture curriculum carries no schreiben.taskKey, so there is no graded
  // task to mount and the section is three drills — the fallback path.
  assert.ok(schreiben.every((i) => i.mode === 'typed'), 'Schreiben is production, never chips');
  const poolById = new Map(POOL.items.map((p) => [p.id, p]));
  assert.ok(schreiben.every((i) => isTyped(poolById.get(i.poolItemId))), 'and typed in the pool too');
  assert.ok(schreiben.every((i) => i.register === null), 'a drill has no Textsorte — the label was invented');
});

test('Schreiben drills come from different Lektionen of the chapter, never one topic three times', () => {
  for (const [curriculum, checkpoint] of [[CURRICULUM_FIXTURE, cp1], [CURRICULUM_FIXTURE_6, cp2of6]]) {
    const schreiben = build(curriculum, checkpoint).filter((i) => i.section === 'schreiben');
    const topics = new Set(schreiben.map((i) => i.topic));
    assert.ok(topics.size >= 3, `Schreiben must span at least 3 topics, got ${[...topics].join(', ')}`);
  }
  for (const cp of CURRICULUM_A11.checkpoints) {
    const schreiben = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool: POOL })
      .filter((i) => i.section === 'schreiben');
    assert.equal(schreiben.length, SECTION_COUNTS.schreiben);
    const topics = new Set(schreiben.map((i) => i.topic));
    assert.ok(topics.size >= 3, `${cp.id}: Schreiben must span at least 3 topics, got ${[...topics].join(', ')}`);
    const slugs = new Set(chapterLektionen(CURRICULUM_A11, cp).map((l) => l.primarySlug));
    for (const drill of schreiben.filter((i) => i.kind !== 'gradedWriting')) {
      assert.equal(drill.register, null, 'no invented Textsorte on a drill item');
      assert.ok(slugs.has(drill.topic), `${drill.topic} is not a primarySlug of the chapter`);
    }
  }
});

test('every checkpoint carries the chapter\'s real writing task, AI-graded and optional', () => {
  const bankKeys = new Set(courseWritingTasks(CURRICULUM_A11.level).map((t) => t.taskKey));
  for (const cp of CURRICULUM_A11.checkpoints) {
    const chapter = chapterLektionen(CURRICULUM_A11, cp);
    const expected = [...chapter].reverse().find((l) => l?.schreiben?.taskKey).schreiben.taskKey;
    const item = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool: POOL })
      .find((i) => i.kind === 'gradedWriting');
    assert.ok(item, `${cp.id} must mount a real writing task`);
    assert.equal(item.section, 'schreiben');
    assert.equal(item.task.taskKey, expected, 'the task is the chapter\'s LAST Lektion');
    assert.ok(bankKeys.has(item.task.taskKey), 'and evaluate-writing must know the key');
    assert.equal(item.task.examKey, 'goethe_a1');
    assert.ok(item.promptDe && item.promptDe.length > 20, 'the prompt is the bank prompt');
    assert.equal(item.register, chapterWritingTask(chapter, CURRICULUM_A11.level).schreiben.kind, 'a REAL register');
    assert.equal(item.scored, false);
    assert.equal(item.scorable, true);
    assert.equal(item.optional, true, 'no grader verdict = not attempted, never a failed section');
  }
});

test('the writing task scores as one Schreiben item, and leaves the section when it was not graded', () => {
  const cp = CURRICULUM_A11.checkpoints[0];
  const items = buildCheckpoint({ curriculum: CURRICULUM_A11, checkpoint: cp, pool: POOL });
  const writing = items.find((i) => i.kind === 'gradedWriting');
  const base = answerAll(items, { correctFor: () => true });

  // Graded and passed: three Schreiben items, all correct.
  const passed = scoreCheckpoint(items, { ...base, [writing.id]: { graded: true, pct: 0.8 } });
  assert.equal(passed.sections.schreiben.total, 3);
  assert.equal(passed.sections.schreiben.correct, 3);

  // Graded and failed: still three, one wrong, and tagged as a writing miss.
  const failed = scoreCheckpoint(items, { ...base, [writing.id]: { graded: true, pct: 0.2 } });
  assert.equal(failed.sections.schreiben.total, 3);
  assert.equal(failed.sections.schreiben.correct, 2);
  assert.equal(failed.errorTags.Schreiben, 1);

  // Signed out / over the allowance / offline: GradedWriting falls back to its
  // form check and the page sends no verdict. The task is NOT attempted — the
  // section scores over its two drills instead of failing on an item the
  // learner could not have passed.
  const ungraded = scoreCheckpoint(items, { ...base, [writing.id]: null });
  assert.equal(ungraded.sections.schreiben.total, 2);
  assert.equal(ungraded.sections.schreiben.scored, true);
  assert.equal(ungraded.sections.schreiben.pct, 100);
  assert.equal(ungraded.passed, true);

  assert.equal(WRITING_PASS_PCT, 0.6);
  assert.equal(isItemCorrect(writing, { graded: true, pct: 0.6 }), true);
  assert.equal(isItemCorrect(writing, { graded: true, pct: 0.59 }), false);
  assert.equal(isWritingResult({ graded: true, pct: 0.5 }), true);
  assert.equal(isWritingResult({ pct: 0.5 }), false);
  assert.equal(isWritingResult(true), false);
});

test('Sprechen is 2 read-alouds of real dialogue lines, scorable but not yet scored', () => {
  const items = build(CURRICULUM_FIXTURE, cp1).filter((i) => i.section === 'sprechen');
  assert.equal(items.length, 2);
  for (const item of items) {
    assert.equal(item.scored, false, 'nothing is scored until a mic result arrives');
    assert.equal(item.scorable, true, 'but the microphone CAN score it');
    assert.equal(item.mode, 'confirm');
    assert.ok(item.audioText);
    assert.ok(item.lektionId, 'playLine needs the Lektion the line belongs to');
    assert.match(item.lineKey, /^line-\d+$/, 'and the manifest key of the line');
  }
});

test('Hören items carry the audio manifest keys playLine needs', () => {
  const items = build(CURRICULUM_FIXTURE, cp1).filter((i) => i.section === 'hoeren');
  for (const item of items.filter((i) => i.kind === 'dictation')) {
    assert.ok(item.lektionId, 'a dictation names its Lektion');
    assert.match(item.lineKey, /^line-\d+$/);
  }
  for (const item of items.filter((i) => i.kind === 'wordChoice')) {
    assert.ok(item.lektionId);
    assert.equal(item.lineKey, null, 'a single word has no line recording — it synthesises');
  }
});

test('no pool item appears twice in one checkpoint', () => {
  const drawn = build(CURRICULUM_FIXTURE, cp1).map((i) => i.poolItemId).filter(Boolean);
  assert.equal(new Set(drawn).size, drawn.length);
});

// ── 2. determinism ──────────────────────────────────────────────────────────

test('the same seed builds the same checkpoint; a different seed does not', () => {
  const a = build(CURRICULUM_FIXTURE, cp1, 'seed-a');
  const b = build(CURRICULUM_FIXTURE, cp1, 'seed-a');
  assert.deepEqual(a, b);
  const c = build(CURRICULUM_FIXTURE, cp1, 'seed-b');
  assert.notDeepEqual(a.map((i) => i.answer), c.map((i) => i.answer));
});

test('the default seed is the checkpoint id, so a reload rebuilds the same test', () => {
  assert.deepEqual(build(CURRICULUM_FIXTURE, cp1), build(CURRICULUM_FIXTURE, cp1, cp1.id));
});

// ── 3. the pass rule ────────────────────────────────────────────────────────

const answerAll = (items, { correctFor }) => {
  const answers = {};
  for (const item of items) {
    // The writing task answers with a grader verdict (that is the only thing
    // that counts as an answer there); everything else confirm-mode taps "done".
    if (item.kind === 'gradedWriting') answers[item.id] = { graded: true, pct: correctFor(item) ? 1 : 0 };
    else if (item.mode === 'confirm') answers[item.id] = true;
    else answers[item.id] = correctFor(item) ? item.answer : 'völlig falsch';
  }
  return answers;
};

test('everything right passes; everything wrong fails', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  const perfect = scoreCheckpoint(items, answerAll(items, { correctFor: () => true }));
  assert.equal(perfect.overall, 100);
  assert.equal(perfect.passed, true);
  assert.equal(perfect.total, 18, 'the 2 Sprechen items are outside the scored total');

  const nothing = scoreCheckpoint(items, answerAll(items, { correctFor: () => false }));
  assert.equal(nothing.overall, 0);
  assert.equal(nothing.passed, false);
  assert.ok(Object.values(nothing.errorTags).reduce((a, b) => a + b, 0) > 0, 'misses are tagged');
});

test('60 % overall is not enough when one scored section is below 40 %', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  // Every section right except Hören (0/5) → 13/18 = 72 % overall, Hören 0 %.
  const answers = answerAll(items, { correctFor: (item) => item.section !== 'hoeren' });
  const result = scoreCheckpoint(items, answers);
  assert.ok(result.overall >= 60, 'the overall bar is cleared');
  assert.equal(result.sections.hoeren.pct, 0);
  assert.equal(result.passed, false, 'and it still fails — the 40 % clause is what does it');
});

test('a section at exactly 40 % and an overall at exactly 60 % pass', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  // Hören 2/5 = 40 %, everything else right → 15/18 = 83 %.
  let hoeren = 0;
  const answers = answerAll(items, {
    correctFor: (item) => (item.section === 'hoeren' ? (hoeren += 1) <= 2 : true),
  });
  const result = scoreCheckpoint(items, answers);
  assert.equal(result.sections.hoeren.pct, 40);
  assert.equal(result.passed, true);
});

test('Sprechen is required but never decides the result', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  const answers = answerAll(items, { correctFor: () => true });
  for (const item of items.filter((i) => i.section === 'sprechen')) delete answers[item.id];
  const result = scoreCheckpoint(items, answers);
  assert.equal(result.sections.sprechen.correct, 0);
  assert.equal(result.sections.sprechen.scored, false);
  assert.equal(result.overall, 100);
  assert.equal(result.passed, true);
});

test('a mic-scored Sprechen section counts — into the overall AND the 40 % rule', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  const sprechen = items.filter((i) => i.section === 'sprechen');

  // Everything right, both read-alouds recorded and understood.
  const good = answerAll(items, { correctFor: () => true });
  for (const item of sprechen) good[item.id] = { usedMic: true, pct: 0.9 };
  const passed = scoreCheckpoint(items, good);
  assert.equal(passed.sections.sprechen.scored, true, 'a mic result promotes the section');
  assert.equal(passed.total, 20, 'and all 20 items are now scored');
  assert.equal(passed.sections.sprechen.pct, 100);
  assert.equal(passed.passed, true);

  // Understood too little: below the threshold the item is simply wrong.
  const weak = answerAll(items, { correctFor: () => true });
  for (const item of sprechen) weak[item.id] = { usedMic: true, pct: 0.2 };
  const weakResult = scoreCheckpoint(items, weak);
  assert.equal(weakResult.sections.sprechen.scored, true);
  assert.equal(weakResult.sections.sprechen.correct, 0);
  assert.equal(weakResult.passed, false, 'Sprechen at 0 % trips the 40 % clause');
  assert.equal(weakResult.errorTags.Aussprache, 2, 'and the misses are tagged as the function tags them');
});

test('the Sprechen threshold is 60 % word recognition, and it is a boundary', () => {
  const item = build(CURRICULUM_FIXTURE, cp1).find((i) => i.section === 'sprechen');
  assert.equal(SPRECHEN_PASS_PCT, 0.6);
  assert.equal(isItemCorrect(item, { usedMic: true, pct: 0.6 }), true);
  assert.equal(isItemCorrect(item, { usedMic: true, pct: 0.59 }), false);
});

test('one self-confirm anywhere in Sprechen keeps the whole section out of the score', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  const sprechen = items.filter((i) => i.section === 'sprechen');
  const answers = answerAll(items, { correctFor: () => true });
  answers[sprechen[0].id] = { usedMic: true, pct: 0.95 };
  answers[sprechen[1].id] = true; // no microphone — the honest fallback
  const result = scoreCheckpoint(items, answers);
  assert.equal(result.sections.sprechen.scored, false);
  assert.equal(result.total, 18, 'half a Sprechen score is not a Sprechen score');
  assert.equal(result.sections.sprechen.correct, 2, 'both are still reported as done');
  assert.equal(result.passed, true);
});

test('a mic result is recognised only with the flag AND a numeric percentage', () => {
  assert.equal(isMicResult({ usedMic: true, pct: 0.5 }), true);
  assert.equal(isMicResult({ usedMic: false, pct: 0.5 }), false);
  assert.equal(isMicResult({ usedMic: true }), false);
  assert.equal(isMicResult(true), false);
  assert.equal(isMicResult(null), false);

  const built = build(CURRICULUM_FIXTURE, cp1);
  const sprechenItem = built.find((i) => i.section === 'sprechen');
  const typedItem = built.find((i) => i.section === 'bausteine');
  assert.equal(itemIsScored(sprechenItem, true), false);
  assert.equal(itemIsScored(sprechenItem, { usedMic: true, pct: 0 }), true);
  assert.equal(itemIsScored(typedItem, undefined), true, 'a typed item is scored regardless');
});

test('a one-letter slip on a strict grammar topic is still wrong', () => {
  // STRICT_TOPIC is the topics where the ending IS the answer — articles,
  // possessives, pronouns, plural (narrowed by REVIEW #2 §E, which found the old
  // pattern disabling the typo allowance for whole typed sentences on nine of the
  // twelve Lektionen). A verb topic now gets the Levenshtein allowance back.
  const strict = { topic: 'definite-articles', mode: 'typed', accepted: ['die Tür'], answer: 'die Tür', scored: true };
  assert.equal(isItemCorrect(strict, 'die Tür'), true);
  assert.equal(isItemCorrect(strict, 'die Türr'), false);
  const loose = { topic: 'verb-sein', mode: 'typed', accepted: ['du bist'], answer: 'du bist', scored: true };
  assert.equal(isItemCorrect(loose, 'du bistt'), true, 'one slip in a verb form is spelling');
});

// ── 3d. grading parity with the lesson (REVIEW #4 BLOCKER 3 + spelled-out) ──
//
// isItemCorrect (checkpoint) and gradeTypedReview (review) must grade exactly
// like PracticeItem.jsx: caseSensitive: isCaseTask(item), so the polite `Ihr`
// answered lowercase is wrong everywhere, and a spelled-out answer is correct
// however its letters are separated, everywhere.

test('the polite Ihr answered lowercase is wrong in the checkpoint, not a forgiven typo', () => {
  // check.js: isCaseTask(item) is the item's OWN `caseSensitive === true` and
  // nothing else — the polite-possessive regex that used to infer it was removed
  // because it hit items whose explanation taught the lowercase answer. The
  // checkpoint must carry the pool item's flag through fromPoolItem, which is
  // what this pins.
  const politeItem = {
    topic: 'possessive-articles',
    mode: 'typed',
    answer: 'Ihr',
    accepted: ['Ihr'],
    caseSensitive: true,
    scored: true,
  };
  assert.equal(isItemCorrect(politeItem, 'ihr'), false, 'caseSensitive must come from isCaseTask, not just STRICT_TOPIC');
  assert.equal(isItemCorrect(politeItem, 'Ihr'), true);

  // An explicit caseSensitive:true pool item (independent of the topic regex)
  // must behave the same way once it reaches a checkpoint item.
  const flagged = {
    topic: 'some-other-topic',
    mode: 'typed',
    answer: 'Berlin',
    accepted: ['Berlin'],
    caseSensitive: true,
    scored: true,
  };
  assert.equal(isItemCorrect(flagged, 'berlin'), false);
});

// ── 3e. ONE GRADER: the OPTIONS COME FROM THE ITEM (REVIEW #6 BLOCKER 3) ────
//
// Round 5 asked for `caseSensitive` to reach all three grading sites and it did
// — but `dictation` was still whatever the call site decided, and
// `isItemCorrect()` never passed it. `a1.1-cp2-hoeren-1` is the phone number
// „Null vier zwei – drei drei acht eins.“: in the lesson every separator form
// graded `correct` (normalizeDictation folds dashes and digit grouping, because
// a dash is unhearable), in the checkpoint only the Halbgeviertstrich did — a
// character a phone keyboard does not have.
//
// So this pins the CLASS, not the instance: for every item of all four
// checkpoints, `isItemCorrect` must agree with `checkAnswer(…,
// checkOptionsFor(item))`. There is no option list in this test on purpose —
// which rules apply to an answer is a decision the ITEM carries.

test('isItemCorrect grades exactly like checkAnswer(…, checkOptionsFor(item)), on all 80 items', () => {
  for (const { cp, items } of ALL_CHECKPOINTS) {
    for (const item of items) {
      if (item.mode === 'confirm') continue;            // read-aloud / graded writing: no typed answer
      const answers = [
        ...item.accepted.filter((a) => typeof a === 'string'),
        ...item.accepted.filter((a) => typeof a === 'string').flatMap((a) => [
          a.toLowerCase(), a.replace(/[\u2010-\u2015]/g, '-'), a.replace(/\s*[\u2010-\u2015]\s*/g, ' '),
          a.replace(/[.!?]$/, ''), `${a} `, a.replace(/e\b/, 'a'),
        ]),
        ...(item.options || []),
      ];
      for (const answer of answers) {
        const expected = checkAnswer(String(answer), item.accepted, checkOptionsFor(item)).result !== RESULT.WRONG;
        assert.equal(
          isItemCorrect(item, answer),
          expected,
          `${cp.id} ${item.id}: "${answer}" grades differently in the checkpoint than in the lesson`,
        );
      }
    }
  }
});

test('a dictated phone number is right in the checkpoint however the learner separated it', () => {
  // The measured item of REVIEW #6 BLOCKER 3. Found by shape, not by id, so the
  // pin survives a reshuffle: the dictation whose answer carries a separator.
  const dictations = ALL_CHECKPOINTS.flatMap(({ items }) => items).filter((i) => i.kind === 'dictation');
  assert.ok(dictations.length >= 12, 'three dictations per checkpoint');
  const withSeparator = dictations.filter((i) => /[\u2010-\u2015]/.test(i.answer));
  assert.ok(withSeparator.length >= 1, 'the phone-number dictation must still be in a checkpoint');
  for (const item of withSeparator) {
    assert.equal(isItemCorrect(item, item.answer), true);
    assert.equal(isItemCorrect(item, item.answer.replace(/[\u2010-\u2015]/g, '-')), true, 'a plain hyphen is the same answer');
    assert.equal(isItemCorrect(item, item.answer.replace(/\s*[\u2010-\u2015]\s*/g, ' ')), true, 'and so is no separator at all');
  }
});

test('a spelled-out answer is correct in the checkpoint however the letters are separated', () => {
  const spelled = {
    topic: 'spelling',
    mode: 'typed',
    answer: 'H-A-L-L-O',
    accepted: ['H-A-L-L-O'],
    scored: true,
  };
  assert.equal(isItemCorrect(spelled, 'HALLO'), true);
  assert.equal(isItemCorrect(spelled, 'H A L L O'), true);
});

test('gradeTypedReview (the review page grading helper) matches the checkpoint on the same two cases', async () => {
  const { gradeTypedReview } = await import('../src/lib/checkpoint/reviewGrading.js');

  // A possessive-articles review card whose accepted answer is the polite Ihr.
  // The card carries the flag (reviewService.buildCardIndex copies it off the
  // curriculum entry and ReviewPage passes it), exactly as a lesson item does.
  const ihrCard = gradeTypedReview('pattern:possessive-articles', ['Ihr'], 'ihr', { caseSensitive: true });
  assert.equal(ihrCard.ok, false, 'lowercase ihr must not be counted correct in the review helper either');
  assert.equal(gradeTypedReview('pattern:possessive-articles', ['Ihr'], 'Ihr', { caseSensitive: true }).ok, true);

  // A spelled-out sentence/word card.
  assert.equal(gradeTypedReview('sentence:l1:0', ['H-A-L-L-O'], 'HALLO').ok, true);
  assert.equal(gradeTypedReview('sentence:l1:0', ['H-A-L-L-O'], 'H A L L O').ok, true);
});

test('a review card whose answer IS the polite form is case-checked, even though the curriculum carries no flag', async () => {
  // REVIEW #6 BLOCKER 1, the review-card half. `isCaseTask(item)` is the item's
  // own `caseSensitive === true` and nothing else — and
  // `grep -c caseSensitive src/data/curricula/a11.js` is 0, so copying the flag
  // off the curriculum entry (as buildCardIndex did) left EVERY review card
  // case-blind while the same form is graded strictly in the lesson and the
  // checkpoint. The flag is now derived with the pool build's own predicate.
  const { buildCardIndex } = await import('../src/services/reviewService.js');
  const { gradeTypedReview } = await import('../src/lib/checkpoint/reviewGrading.js');
  const { politeCaseItem } = await import('../src/data/lessonPools/quality.js');

  const index = buildCardIndex({
    level: 'a1.1',
    lektionen: [{
      nr: 1,
      id: 'x-l01',
      practiceRule: { topics: ['possessive-articles'] },
      notice: { title: 'Höflichkeitsform', bodyDe: '…', examples: ['Das ist Ihr Name.', 'Hier ist Ihre Adresse.'] },
      wortfeld: [
        { de: 'Sie', word: 'Sie', article: null, plural: null, en: 'you (formal)' },
        { de: 'die Tasche', word: 'Tasche', article: 'die', plural: 'Taschen', en: 'bag' },
      ],
      dialog: { lines: [{ speaker: 'Ana', de: 'Guten Tag.', en: 'Hello.' }] },
    }],
  });

  const politeKey = patternCardKey('possessive-articles');
  const polite = index.get(politeKey);
  assert.equal(polite.caseSensitive, true, 'a card whose examples are the polite Ihr is a case task');
  assert.equal(gradeTypedReview(politeKey, polite.accepted, 'Das ist ihr Name.', { caseSensitive: polite.caseSensitive }).ok, false);
  assert.equal(gradeTypedReview(politeKey, polite.accepted, 'Das ist Ihr Name.', { caseSensitive: polite.caseSensitive }).ok, true);

  const sieKey = wordCardKey({ de: 'Sie', word: 'Sie' });
  const sie = index.get(sieKey);
  assert.equal(sie.caseSensitive, true, 'the formal Sie is a case task wherever it is reviewed');
  assert.equal(gradeTypedReview(sieKey, sie.accepted, 'sie', { caseSensitive: sie.caseSensitive }).ok, false);

  // …and a word that is NOT a polite form keeps its one forgiven case slip.
  const tasche = index.get(wordCardKey({ de: 'die Tasche', word: 'Tasche' }));
  assert.equal(tasche.caseSensitive, false, 'a plain noun is not a case task');

  // Derived, not retyped: the card uses the same predicate as the pool build.
  assert.equal(politeCaseItem({ accepted: polite.accepted }), true);
});

// ── 4. the 70/30 draw ───────────────────────────────────────────────────────

test('checkpoint 1 has no earlier chapter, so every pool item is from this chapter', () => {
  const drawn = build(CURRICULUM_FIXTURE, cp1).filter((i) => i.poolItemId);
  assert.equal(drawn.length, POOL_ITEMS_TOTAL);
  assert.ok(drawn.every((i) => i.source === 'chapter'));
});

test('checkpoint 2 draws 70 % from its own chapter and 30 % from earlier ones', () => {
  const items = build(CURRICULUM_FIXTURE_6, cp2of6);
  const drawn = items.filter((i) => i.poolItemId);
  assert.equal(drawn.length, POOL_ITEMS_TOTAL);
  assert.equal(drawn.filter((i) => i.source === 'earlier').length, POOL_ITEMS_EARLIER);
  assert.equal(drawn.filter((i) => i.source === 'chapter').length, POOL_ITEMS_TOTAL - POOL_ITEMS_EARLIER);
  assert.ok(drawn.filter((i) => i.source === 'chapter').length / drawn.length >= 0.7);

  const chapterTopics = topicsOf(chapterLektionen(CURRICULUM_FIXTURE_6, cp2of6));
  const earlierTopics = topicsOf(earlierLektionen(CURRICULUM_FIXTURE_6, cp2of6));
  for (const item of drawn) {
    const expected = item.source === 'earlier' ? earlierTopics : chapterTopics;
    assert.ok(expected.includes(item.topic), `${item.topic} must come from the ${item.source} topics`);
  }
});

test('a checkpoint only ever uses its own chapter for Hören, Lesen and Sprechen', () => {
  const chapterLines = new Set(
    chapterLektionen(CURRICULUM_FIXTURE_6, cp2of6).flatMap((l) => l.dialog.lines.map((line) => line.de)),
  );
  const generated = build(CURRICULUM_FIXTURE_6, cp2of6).filter((i) => ['hoeren', 'sprechen'].includes(i.section) && i.kind !== 'wordChoice');
  for (const item of generated) assert.ok(chapterLines.has(item.audioText), 'spoken/heard material is this chapter only');
});

// ── 5. remediation ──────────────────────────────────────────────────────────

test('remediation is 10 fresh items aimed at the topics that were missed', () => {
  const items = build(CURRICULUM_FIXTURE_6, cp2of6);
  // Miss only the Sprachbausteine; get everything else right.
  const answers = answerAll(items, { correctFor: (item) => item.section !== 'bausteine' });
  const set = remediationSet(items, answers, POOL);
  assert.equal(set.length, 10);

  const seen = new Set(items.map((i) => i.poolItemId).filter(Boolean));
  for (const item of set) assert.ok(!seen.has(item.poolItemId), 'a miss returns as a DIFFERENT item');

  const missedTopics = new Set(items.filter((i) => i.section === 'bausteine').map((i) => i.topic));
  const targeted = set.filter((i) => missedTopics.has(i.topic));
  assert.ok(targeted.length >= 6, 'the set is about what went wrong, not a random refill');
  assert.equal(set.every((i) => i.section === 'remediation'), true);
  assert.ok(set[0].errorTags && Object.keys(set[0].errorTags).length > 0, 'it carries the error tags it answers');
});

test('remediation is deterministic and ignores topics the pool cannot serve', () => {
  const items = build(CURRICULUM_FIXTURE, cp1);
  const answers = answerAll(items, { correctFor: () => false });
  const a = remediationSet(items, answers, POOL);
  const b = remediationSet(items, answers, POOL);
  assert.deepEqual(a.map((i) => i.poolItemId), b.map((i) => i.poolItemId));
  const poolTopics = new Set(POOL.items.map((i) => i.topic));
  for (const item of a) assert.ok(poolTopics.has(item.topic));
});

// ── 6. the review ladder ────────────────────────────────────────────────────

test('the ladder walks 1, 4, 7, 14, 60, 180 days and then stays at 180', () => {
  assert.deepEqual(LADDER_DAYS, [1, 4, 7, 14, 60, 180]);
  let step = 0;
  const walked = [];
  for (let i = 0; i < 8; i += 1) {
    const next = nextDue(step, true);
    walked.push(next.dueInDays);
    step = next.step;
  }
  assert.deepEqual(walked, [1, 4, 7, 14, 60, 180, 180, 180]);
  assert.equal(step, MAX_STEP);
});

test('a lapse drops the card to step 0 and back to tomorrow', () => {
  const lapse = nextDue(4, false);
  assert.equal(lapse.step, 0);
  assert.equal(lapse.dueInDays, 1);
  assert.equal(lapse.lapsed, true);
  // …and the next correct answer starts the ladder again, not where it was.
  assert.equal(nextDue(lapse.step, true).dueInDays, 1);
});

test('dueAt is the interval measured from now', () => {
  const now = new Date('2026-09-12T09:00:00.000Z');
  assert.equal(nextDue(1, true, now).dueAt.toISOString(), '2026-09-16T09:00:00.000Z');
});

test('card keys round-trip and name their kind', () => {
  assert.equal(wordCardKey({ wordId: 'abc', de: 'der Name' }), 'word:abc');
  assert.equal(wordCardKey({ de: 'der Name' }), 'word:der Name');
  assert.equal(patternCardKey('verb-sein'), 'pattern:verb-sein');
  assert.equal(sentenceCardKey('a1.1-l01', 3), 'sentence:a1.1-l01:3');
  assert.deepEqual(parseCardKey('sentence:a1.1-l01:3'), { kind: 'sentence', lektionId: 'a1.1-l01', lineIdx: 3, ref: 'a1.1-l01:3' });
  assert.equal(parseCardKey('nonsense:x'), null);
});

// ── persistence wiring ──────────────────────────────────────────────────────

// checkpointService.js imports the browser Supabase client, so it cannot be
// imported here; its wiring is pinned by reading it, the way claims.test.mjs
// pins the Netlify functions. Three facts must hold or the course home's
// percentage, the attempt limit and the ledger all silently stop working.
test('checkpointService writes the three ledgers the contract names', () => {
  const src = readFileSync(new URL('../src/services/checkpointService.js', import.meta.url), 'utf8');
  assert.match(src, /_course`/, 'program_progress key is derived from the level');
  assert.match(src, /\.replace\(\/\\\.\/g, ''\)/, 'a1.1 → a11, every dot removed');
  assert.match(src, /from\('lesson_attempts'\)/);
  assert.match(src, /from\('lesson_progress'\)/);
  assert.match(src, /stage: 'checkpoint'/);
  assert.match(src, /ATTEMPT_LIMIT = 3/);
  assert.match(src, /ATTEMPT_WINDOW_HOURS = 8/);
});

test('reviewService seeds and grades through the ladder, fail-soft', () => {
  const src = readFileSync(new URL('../src/services/reviewService.js', import.meta.url), 'utf8');
  assert.match(src, /export async function seedCardsForLektion/, 'the integration hook the lesson engine calls');
  assert.match(src, /from\('review_cards'\)|const TABLE = 'review_cards'/);
  assert.match(src, /ignoreDuplicates: true/, 'seeding never resets a card that has earned its interval');
  assert.ok(!/throw /.test(src), 'review writes never throw into a lesson');
});

test('the review_cards migration carries own-row RLS and the checkpoint marker', () => {
  const sql = readFileSync(new URL('../migrations/2026-09-12-lesson-engine.sql', import.meta.url), 'utf8');
  assert.match(sql, /checkpoint agent section/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.review_cards/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  for (const verb of ['select', 'insert', 'update', 'delete']) {
    assert.match(sql, new RegExp(`review_cards_${verb}_own`), `own-row ${verb} policy`);
  }
  assert.match(sql, /CHECK \(kind IN \('word', 'pattern', 'sentence'\)\)/);
});

// ── register (DaF review #5, MAJOR "CheckpointPage.jsx:169/429 …") ───────────
//
// The lesson chrome sieze; the two screens beside it duzed. tests/course-player.test.mjs
// greps every src/pages/lesson/*.jsx for du-forms — this is the same guard kept
// next to the builder, because the checkpoint's own generated prompts
// ("Hören Sie zu und schreiben Sie den Satz.") are written HERE, not in the page,
// and a du-form reintroduced in either place puts two Anreden on one screen.
const DU_TOKENS = /\b(du|Du|dir|Dir|dich|Dich|dein|Dein|deine[mnrs]?|Deine[mnrs]?|kannst|musst|hast|willst|machst|hörst|schreibst|Schreib|Tippe|Lies|Hör|Sprich|Melde|Probier|bestätige|Versuch es)\b/;

test('the checkpoint and review screens (and the prompts the builder writes) sieze', () => {
  const offenders = [];
  for (const file of [
    'src/pages/lesson/CheckpointPage.jsx',
    'src/pages/lesson/ReviewPage.jsx',
    'src/lib/checkpoint/buildCheckpoint.js',
    'src/lib/checkpoint/reviewGrading.js',
  ]) {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    src.split('\n').forEach((line, i) => {
      if (DU_TOKENS.test(line)) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
    });
  }
  assert.deepEqual(offenders, [], `du-register on the checkpoint/review screens:\n${offenders.join('\n')}`);
});

test('the four strings DaF review #5 named now address the learner as Sie', () => {
  const checkpoint = readFileSync(new URL('../src/pages/lesson/CheckpointPage.jsx', import.meta.url), 'utf8');
  const review = readFileSync(new URL('../src/pages/lesson/ReviewPage.jsx', import.meta.url), 'utf8');
  assert.ok(checkpoint.includes('Bewertet — Verständlichkeit zählt in Ihr Sprechen-Ergebnis.'));
  assert.ok(checkpoint.includes('im Format Ihrer Prüfung'));
  assert.ok(review.includes('Melden Sie sich an, damit Ihre Wiederholungen gespeichert werden.'));
  assert.ok(review.includes('Neue Karten kommen, sobald Sie eine Lektion abschließen.'));
});

// ── 7. NO LINE TWICE IN ONE PAPER (DaF review #8, MAJOR 2) ──────────────────
//
// buildCheckpoint kept `usedPoolIds` and nothing else, so Hören, Lesen and
// Sprechen drew independently from the same pot of dialogue lines: in the
// GRADED checkpoint 4 one L11 line stood three times in one test — as the first
// dictation, as the second read-aloud and verbatim inside the Lesen text of
// `a1.1-cp4-lesen-2`. Nine such overlaps over the four papers; checkpoint 3
// built two of its four Lesen items from ONE window, both keyed `Richtig`; and
// the pool item `0ef58eff` sat in checkpoint 1 AND checkpoint 3.
//
// Pinned as a class over all four built checkpoints, not as a list of ids: the
// builder now carries `usedLineKeys` through the three skill sections in draw
// order and re-derives the pool ids the earlier checkpoints spent.

/** The chapter lines a Lesen text prints, found in the text the learner reads. */
const linesInText = (text, chapter) =>
  chapter.flatMap((l) => (l.dialog?.lines || []).map((line) => line.de)).filter((de) => text.includes(de));

test('no dialogue line is used twice across the sections of one checkpoint', () => {
  for (const { cp, items } of ALL_CHECKPOINTS) {
    const chapter = chapterLektionen(CURRICULUM_A11, cp);
    const spoken = items.filter((i) => i.kind === 'dictation' || i.kind === 'readAloud').map((i) => i.answer);
    assert.equal(
      new Set(spoken).size,
      spoken.length,
      `${cp.id}: a line is both dictated and read aloud — ${spoken.join(' | ')}`,
    );

    const read = items.filter((i) => i.section === 'lesen').flatMap((i) => linesInText(i.text, chapter));
    const all = [...spoken, ...read];
    assert.equal(
      new Set(all).size,
      all.length,
      `${cp.id}: a line the learner types or speaks also stands in a Lesen text of the same paper — `
        + `${all.filter((v, i, a) => a.indexOf(v) !== i).join(' | ')}`,
    );
  }
});

test('no two Lesen items of one checkpoint are built from the same window', () => {
  for (const { cp, items } of ALL_CHECKPOINTS) {
    const chapter = chapterLektionen(CURRICULUM_A11, cp);
    const lesen = items.filter((i) => i.section === 'lesen');
    assert.equal(lesen.length, SECTION_COUNTS.lesen, `${cp.id}: the fallback must keep Lesen at four items`);
    const texts = lesen.map((i) => i.text);
    assert.equal(new Set(texts).size, texts.length, `${cp.id}: two Lesen items print the same text`);
    // Stronger than "not the same text": two windows may not even share a line,
    // or the second item is answerable from the first one's paragraph.
    for (let a = 0; a < lesen.length; a += 1) {
      for (let b = a + 1; b < lesen.length; b += 1) {
        const shared = linesInText(lesen[a].text, chapter).filter((de) => lesen[b].text.includes(de));
        assert.deepEqual(shared, [], `${cp.id}: ${lesen[a].id} and ${lesen[b].id} overlap on ${shared.join(' | ')}`);
      }
    }
  }
});

test('a pool item appears in at most one checkpoint of the level', () => {
  const drawn = ALL_CHECKPOINTS.flatMap(({ items }) => items.map((i) => i.poolItemId).filter(Boolean));
  const twice = drawn.filter((v, i, a) => a.indexOf(v) !== i);
  assert.deepEqual(twice, [], `these pool items are drawn by two checkpoints: ${twice.join(', ')}`);
  assert.equal(drawn.length, ALL_CHECKPOINTS.length * POOL_ITEMS_TOTAL - 4, 'nine pool draws per paper minus the graded writing task');
});

// ── 8. ONE POLITENESS PREDICATE, EVERY SURFACE (DaF review #8, MAJOR 5) ─────
//
// `caseFlag()` took a `{ sentence: true }` option that only the sentence-card
// call site passed, so the identical dialogue line was graded two ways inside
// one course („Was sind Sie von Beruf?": wrong as `sentence:a1.1-l02:6`,
// forgiven as `pattern:verb-sein`), and the checkpoint dictations carried no
// flag at all, so the graded checkpoint 1 accepted „gut. wie geht es ihnen?"
// while `extra-a11-l01-06` grades `ihnen` wrong.
//
// The rule: the ANSWER TEXT decides, never the call site. `politeCaseItem` is
// the one predicate — the pool build stamps items with it, buildCardIndex flags
// cards with it, buildCheckpoint derives its dictations' `caseSensitive` from
// it — and this walks all three surfaces with it. An explicit
// `caseSensitive: true` in the pool data stays a documented override, and the
// list of overrides is asserted here too so it cannot grow quietly.
const POLITE_OVERRIDES = ['extra-a11-l12-16'];

test('the lowercase answer is wrong exactly where the polite predicate fires — cards, pool and checkpoints', async () => {
  const { buildCardIndex } = await import('../src/services/reviewService.js');
  const { gradeTypedReview } = await import('../src/lib/checkpoint/reviewGrading.js');
  const { politeCaseItem } = await import('../src/data/lessonPools/quality.js');

  // The predicate reads everything the ITEM says about its own task (a pool
  // item's prompt and explanation can veto — „Mutter = weiblich → sie."), so a
  // pool-drawn checkpoint item is judged on the pool row it came from, not on
  // the reshaped copy.
  const byId = new Map(POOL.items.map((i) => [i.id, i]));
  const strict = (answer, accepted) => politeCaseItem({ answer, accepted });
  let fired = 0;

  // (a) every review card of A1.1.
  for (const [key, card] of buildCardIndex(CURRICULUM_A11)) {
    const accepted = (card.accepted || []).filter((a) => typeof a === 'string');
    if (!accepted.length) continue;
    const want = strict(accepted[0], accepted);
    assert.equal(card.caseSensitive, want, `${key}: the card flag must be the predicate's verdict on its own answer`);
    if (!want) continue;
    fired += 1;
    const { ok } = gradeTypedReview(key, accepted, accepted[0].toLowerCase(), { caseSensitive: card.caseSensitive });
    assert.equal(ok, false, `${key}: the lowercase form of "${accepted[0]}" must grade wrong`);
  }

  // (b) every item of the built pool.
  for (const item of POOL.items) {
    const accepted = [item.answer, ...(item.accepted || [])].filter((a) => typeof a === 'string' && a.trim());
    if (!accepted.length) continue;
    const want = politeCaseItem(item);
    if (item.caseSensitive === true && !want) {
      assert.ok(POLITE_OVERRIDES.includes(item.id), `${item.id} is case-strict without the predicate and is not a documented override`);
      continue;
    }
    assert.equal(item.caseSensitive === true, want, `${item.id}: pool flag and predicate disagree on "${accepted[0]}"`);
    if (!want) continue;
    fired += 1;
    const result = checkAnswer(accepted[0].toLowerCase(), accepted, checkOptionsFor(item)).result;
    assert.equal(result, RESULT.WRONG, `${item.id}: the lowercase form of "${accepted[0]}" must grade wrong`);
  }

  // (c) every item of all four checkpoints, typed or spoken.
  for (const { cp, items } of ALL_CHECKPOINTS) {
    for (const item of items) {
      const accepted = (item.accepted || []).filter((a) => typeof a === 'string' && a.trim());
      if (!accepted.length) continue;
      const origin = item.poolItemId ? byId.get(item.poolItemId) : null;
      const want = origin
        ? politeCaseItem(origin) || POLITE_OVERRIDES.includes(item.poolItemId)
        : strict(accepted[0], accepted);
      assert.equal(item.caseSensitive === true, want, `${cp.id} ${item.id}: flag and predicate disagree on "${accepted[0]}"`);
      if (!want || item.mode === 'confirm') continue;
      fired += 1;
      assert.equal(isItemCorrect(item, accepted[0].toLowerCase()), false,
        `${cp.id} ${item.id}: the lowercase form of "${accepted[0]}" must be wrong in a graded test`);
    }
  }

  assert.ok(fired >= 10, `only ${fired} polite answers measured — the predicate stopped reaching the surfaces`);
});

test('the hand-set case overrides in the pool are exactly the documented ones', async () => {
  const { politeCaseItem } = await import('../src/data/lessonPools/quality.js');
  const overrides = POOL.items
    .filter((i) => i.caseSensitive === true && !politeCaseItem(i))
    .map((i) => i.id);
  assert.deepEqual(overrides.sort(), [...POLITE_OVERRIDES].sort(),
    'an override is a decision someone has to defend in writing — add it to POLITE_OVERRIDES with a reason or drop the flag');
});
