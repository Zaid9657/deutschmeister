// Guard suite for src/data/courseTests/abschlusstestA22.js (Course Factory Wave 5, PR
// D2a) — mirrors tests/a2-1-abschlusstest.test.mjs's harness (which in turn
// mirrors the course-test assertions in tests/exams.test.mjs), adapted for
// the A2.2 level constraint (docs/course-factory/wave5/level-a2.2.md — reflexive verbs,
// coordinating/subordinating conjunctions, comparative/superlative and
// simple past are now PRODUCTIVE; würde/könnte/hätte/wäre/möchte are now
// productive too; the sentence cap rises to 16 words) and for the `matching`
// Lesen part this module adds. This file lives OUTSIDE the repo (the repo is
// read-only for this task) so every repo import below uses an absolute path
// rather than a relative one — Node's ESM loader resolves an absolute
// specifier as a filesystem path directly, verified against this sandbox's
// Node before this file was written.
//
// NOT carried from the A2.1 harness: the header-quote-provenance check
// (headerText() diffing every quoted run against the source) and the
// round-1-specific regression tests (the fabricated #6 quote, the Sportverein
// keyword collision) — those defended specific PAST defects in a sibling
// file and have no analogue here. The `tests/exams.test.mjs` course-test
// loop does not yet handle `matching` parts (see this module's header,
// integration dependency 4) — this harness imports the module directly, not
// through COURSE_TESTS, so that repo-side gap does not block it here.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

import { EXAM_TRACKS, examTrackByKey } from '../src/data/examTracks.js';
import { countScorableItems } from '../src/data/mockExams/index.js';
import { scoreObjectiveSections } from '../src/services/examScoring.js';
import { selectListeningQuestions } from '../src/data/courseTests/listeningQuestions.js';
import { isLevelFree } from '../src/config/freeTier.js';
import { bandCourseForLevel } from '../src/data/pricing.js';
import { abschlusstestA22 } from '../src/data/courseTests/abschlusstestA22.js';
import { A2_GRAMMAR_BANS } from './helpers/a2Bans.mjs';

const mock = abschlusstestA22;
const ct = {
  key: mock.examKey,
  slug: 'abschlusstest-a2-2',
  nameDe: 'Abschlusstest A2.2',
  level: mock.courseLevel,
  formatOf: mock.formatOf,
  mock,
};

const words = (s) => String(s).split(/\s+/).filter(Boolean).length;

/** Split into sentences; newlines and .?! all count as boundaries. */
const sentences = (s) =>
  String(s)
    .split('\n')
    .flatMap((line) => line.split(/(?<=[.?!])\s+/))
    .map((x) => x.trim())
    .filter(Boolean);

/** Every learner-facing German string in the module, labelled by origin. */
function allStrings(includeAdmin = true) {
  const out = [];
  const push = (where, s) => {
    if (s) out.push({ where, s: String(s) });
  };
  push('title', mock.title);
  if (includeAdmin) push('intro', mock.intro);
  for (const sec of mock.sections) {
    push(`${sec.key}.title`, sec.title);
    if (includeAdmin) push(`${sec.key}.instructions`, sec.instructions);
    for (const p of sec.parts) {
      push(`${p.key}.label`, p.label);
      push(`${p.key}.text`, p.text);
      push(`${p.key}.task`, p.task);
      for (const [i, c] of (p.criteria || []).entries()) push(`${p.key}.criteria[${i}]`, c);
      for (const it of p.items || []) {
        push(`${it.id}.prompt`, it.prompt);
        for (const o of it.options) push(`${it.id}.option.${o.key}`, o.label);
      }
      for (const o of p.options || []) push(`${p.key}.option.${o.key}`, o.label);
      for (const t of p.texts || []) push(`${p.key}.text.${t.id}`, t.text);
    }
  }
  return out;
}

const joined = allStrings().map((x) => x.s).join('\n');

// ── 1. identity, registry boundary, gate ─────────────────────────────────

test('identity fields and the COURSE_TESTS boundary', () => {
  assert.equal(mock.examKey, 'a2_2_abschluss');
  assert.equal(mock.courseLevel, 'a2.2');
  assert.equal(mock.formatOf, 'goethe_a2');
  assert.equal(mock.title, 'Abschlusstest A2.2 (Kurzversion)');
  assert.match(mock.title, /Kurzversion/, 'shortened sets must say so in the title');
  assert.equal(mock.passPercent, 60);
  assert.ok(mock.passPercent >= 50 && mock.passPercent <= 100);
  assert.match(ct.level, /^[ab][12]\.[12]$/, 'level must be a lowercase sublevel');
  assert.match(ct.slug, /^[a-z0-9-]+$/);
  assert.match(ct.key, /^[a-z0-9_]+$/);

  const examKeys = new Set(EXAM_TRACKS.map((t) => t.key));
  assert.ok(!examKeys.has(ct.key), `course test key ${ct.key} collides with an EXAM_TRACKS key`);
});

test('formatOf goethe_a2 already resolves live (no ordering dependency left)', () => {
  const track = examTrackByKey('goethe_a2');
  assert.ok(track, 'goethe_a2 must already exist in EXAM_TRACKS — verified live 2026-09-06');
  assert.equal(track.key, 'goethe_a2');
  assert.equal(track.slug, 'goethe-a2');
});

test('the gate this file claims in its header is the gate the code computes', () => {
  assert.equal(isLevelFree('a2.2'), false, 'a2.2 must not be a free level, or the gate note is wrong');
  assert.equal(bandCourseForLevel('a2.2')?.key, 'course_a2_2', 'the A2.2 course must unlock a2.2');
});

// ── 2. shape guards adapted from tests/exams.test.mjs ────────────────────

test('shape/content guards pass, perfect sheet = 100%, empty sheet = 0%', () => {
  const perfect = {};
  for (const section of mock.sections) {
    assert.ok(Number.isInteger(section.minutes) && section.minutes > 0, `${section.key}: minutes`);
    assert.ok(section.instructions, `${section.key}: instructions`);
    for (const part of section.parts) {
      if (part.type === 'mc-group') {
        assert.ok(part.items.length > 0);
        for (const item of part.items) {
          assert.ok(item.options.some((o) => o.key === item.answer), `${item.id}: answer not among options`);
          const optKeys = item.options.map((o) => o.key);
          assert.equal(new Set(optKeys).size, optKeys.length, `${item.id}: duplicate option keys`);
          perfect[item.id] = item.answer;
        }
      } else if (part.type === 'matching') {
        const optionKeys = new Set(part.options.map((o) => o.key));
        for (const t of part.texts) {
          const ans = part.answers[t.id];
          assert.ok(optionKeys.has(ans), `${part.key}: answer for ${t.id} is not an option`);
          perfect[`${part.key}:${t.id}`] = ans;
        }
        assert.ok(part.options.length > part.texts.length, `${part.key}: no distractor headings`);
      } else if (part.type === 'listening') {
        assert.match(part.level, /^[AB][12]\.[12]$/, `${part.key}: listening level must be the DB uppercase form`);
        assert.ok(
          Number.isInteger(part.exerciseNumber) && part.exerciseNumber >= 1 && part.exerciseNumber <= 6,
          `${part.key}: exerciseNumber out of range`
        );
        assert.ok(
          Number.isInteger(part.questionMax) && part.questionMax > 0,
          `${part.key}: a course-test listening part needs a numeric questionMax`
        );
      } else if (part.type === 'writing') {
        assert.ok(part.task && part.criteria?.length >= 3, `${part.key}: writing needs a task + criteria`);
      } else {
        assert.fail(`${part.key}: unexpected part type ${part.type} for a course test`);
      }
    }
  }
  const result = scoreObjectiveSections(mock, perfect);
  assert.equal(result.score, result.maxScore, 'perfect sheet does not score 100%');
  assert.equal(result.maxScore, countScorableItems(mock), 'scorer and counter disagree');
  assert.equal(result.maxScore, 10, 'the objective (Lesen) item count must be 10');
  assert.equal(scoreObjectiveSections(mock, {}).score, 0);
});

test('every part key and item/text id is unique', () => {
  const keys = new Set();
  const ids = new Set();
  for (const section of mock.sections) {
    for (const part of section.parts) {
      assert.ok(!keys.has(part.key), `duplicate part key ${part.key}`);
      keys.add(part.key);
      for (const item of part.items || []) {
        assert.ok(!ids.has(item.id), `duplicate item id ${item.id}`);
        ids.add(item.id);
      }
      for (const t of part.texts || []) {
        assert.ok(!ids.has(t.id), `duplicate text id ${t.id}`);
        ids.add(t.id);
      }
    }
  }
});

// ── 3. section layout, item counts, timings ──────────────────────────────

test('sections: hoeren 15 + lesen 20 + schreiben 20 = 55 minutes', () => {
  assert.deepEqual(mock.sections.map((s) => s.key), ['hoeren', 'lesen', 'schreiben']);
  const byKey = Object.fromEntries(mock.sections.map((s) => [s.key, s]));
  assert.equal(byKey.hoeren.minutes, 15);
  assert.equal(byKey.lesen.minutes, 20);
  assert.equal(byKey.schreiben.minutes, 20);
  assert.equal(mock.sections.reduce((n, s) => n + s.minutes, 0), 55);
});

test('Hören: exactly one listening part, A2.2 #2, capped at 10 questions, one play', () => {
  const hoeren = mock.sections.find((s) => s.key === 'hoeren');
  assert.equal(hoeren.parts.length, 1);
  const p = hoeren.parts[0];
  assert.equal(p.type, 'listening');
  assert.equal(p.level, 'A2.2');
  assert.equal(p.exerciseNumber, 2);
  assert.equal(p.questionMax, 10);
  assert.equal(p.exerciseId, '7cde74a6-30e4-403c-a34f-38cab5e5993f');
  // 8:06 of audio against a hard 15-minute timer: one play fits, two (16:12) do not.
  assert.equal(p.playsAllowed, 1, 'the Hören part must cap itself at one play');

  const runSrc = readFileSync(`${root}/src/pages/Modelltest/ModelltestRun.jsx`, 'utf8');
  assert.match(runSrc, /const playsAllowed = part\.playsAllowed \?\? PLAYS_ALLOWED;/, 'ModelltestRun.jsx must resolve the per-part play cap');
  assert.match(runSrc, /const PLAYS_ALLOWED = 2;/, 'the default cap the part overrides still reads 2');

  // The cap must actually bite if the exercise is later expanded the way
  // every A1 exercise was in Wave 2/3 (10 -> 23 questions).
  const fake = Array.from({ length: 23 }, (_, i) => ({ id: `q${i + 1}`, question_number: i + 1 }));
  assert.equal(selectListeningQuestions(fake, p).length, 10);
});

test('no other mock or course test already uses A2.2 listening exercise #2', () => {
  for (const f of [
    'mockExams/goetheA1.js',
    'mockExams/goetheB1.js',
    'mockExams/telcB1.js',
    'mockExams/telcB2.js',
    'mockExams/dtz.js',
    'courseTests/abschlusstestA11.js',
    'courseTests/abschlusstestA12.js',
    'courseTests/abschlusstestA21.js',
  ]) {
    const body = readFileSync(`${root}/src/data/${f}`, 'utf8');
    assert.ok(
      !/level:\s*'A2\.2',\s*\n\s*exerciseNumber:\s*2\b/.test(body) && !/exerciseNumber:\s*2,\s*\n[^]*?A2\.2/.test(body),
      `${f} already uses A2.2 exercise #2`
    );
  }
});

test('Lesen: lesen-2 (mc-group, 5 a/b/c items) + lesen-4 (matching, 5 situations) = 10 items', () => {
  const lesen = mock.sections.find((s) => s.key === 'lesen');
  assert.deepEqual(lesen.parts.map((p) => p.key), ['lesen-2', 'lesen-4']);

  const l2 = lesen.parts.find((p) => p.key === 'lesen-2');
  assert.equal(l2.type, 'mc-group');
  assert.ok(l2.text);
  assert.equal(l2.items.length, 5);
  for (const it of l2.items) {
    assert.deepEqual(it.options.map((o) => o.key), ['a', 'b', 'c'], `${it.id}: must be a/b/c`);
    assert.ok(it.prompt.endsWith('?'), `${it.id}: an a/b/c item must ask a question`);
  }

  const l4 = lesen.parts.find((p) => p.key === 'lesen-4');
  assert.equal(l4.type, 'matching');
  assert.equal(l4.texts.length, 5, 'Teil 4 needs five situations');
  const optionKeys = l4.options.map((o) => o.key);
  assert.deepEqual(optionKeys.slice(0, 6), ['a', 'b', 'c', 'd', 'e', 'f'], 'six lettered Anzeigen a-f');
  assert.equal(optionKeys.at(-1), 'x');
  assert.equal(l4.options.find((o) => o.key === 'x').label, 'Keine Anzeige passt.');

  assert.equal(l2.items.length + l4.texts.length, 10);

  // No Richtig/Falsch anywhere. Scoped to the mc-group's own item option
  // keys — lesen-4 legitimately has an option keyed 'f' (Anzeige f), which
  // a blanket "[rf]" scan over the whole module would misfire on.
  for (const it of l2.items) {
    assert.deepEqual(it.options.map((o) => o.key), ['a', 'b', 'c'], `${it.id}: r/f keys not allowed`);
  }
  const full = JSON.stringify(mock);
  assert.ok(!/Richtig|Falsch|richtig oder falsch/.test(full), 'no Richtig/Falsch wording may remain');
});

test('lesen-2: a/b/c key spread uses all three letters, none more than twice, no adjacent repeat', () => {
  const l2 = mock.sections.find((s) => s.key === 'lesen').parts.find((p) => p.key === 'lesen-2');
  const keyStr = l2.items.map((i) => i.answer).join('');
  assert.equal(keyStr.length, 5);
  assert.equal(new Set(keyStr).size, 3, `all three letters must be used: ${keyStr}`);
  for (const letter of 'abc') {
    const n = [...keyStr].filter((c) => c === letter).length;
    assert.ok(n >= 1 && n <= 2, `letter ${letter} used ${n} times: ${keyStr}`);
  }
  assert.ok(!/(.)\1/.test(keyStr), `no two adjacent items may share an answer: ${keyStr}`);
});

test('lesen-4 matching guards: answers reference real options, all five distinct, exactly one x', () => {
  const l4 = mock.sections.find((s) => s.key === 'lesen').parts.find((p) => p.key === 'lesen-4');
  const optionKeys = new Set(l4.options.map((o) => o.key));
  const answerValues = l4.texts.map((t) => l4.answers[t.id]);
  assert.equal(answerValues.length, 5);
  for (const v of answerValues) assert.ok(optionKeys.has(v), `answer ${v} is not a real option key`);
  assert.equal(new Set(answerValues).size, 5, `all five answers must be distinct: ${answerValues.join(',')}`);
  assert.equal(answerValues.filter((v) => v === 'x').length, 1, 'exactly one situation must resolve to x');
  // Two ads are pure distractors, matched by no situation — real Teil-4 shape.
  const usedLetters = new Set(answerValues.filter((v) => v !== 'x'));
  const adLetters = new Set(l4.options.filter((o) => o.key !== 'x').map((o) => o.key));
  assert.equal(adLetters.size - usedLetters.size, 2, 'exactly two Anzeigen must be unmatched distractors');
});

test("lesen-2 text is 70-100 words, lesen-4 every Anzeige is 20-30 words", () => {
  const lesen = mock.sections.find((s) => s.key === 'lesen');
  const l2words = words(lesen.parts.find((p) => p.key === 'lesen-2').text);
  assert.ok(l2words >= 70 && l2words <= 100, `Teil 2 board is ${l2words} words, expected 70-100`);

  const l4 = lesen.parts.find((p) => p.key === 'lesen-4');
  for (const o of l4.options) {
    if (o.key === 'x') continue;
    const n = words(o.label);
    assert.ok(n >= 20 && n <= 30, `Anzeige ${o.key} is ${n} words, expected 20-30`);
  }
});

test('Schreiben: SMS (20-30 Wörter) + halbformelle E-Mail (30-40 Wörter), >=3 criteria each', () => {
  const schreiben = mock.sections.find((s) => s.key === 'schreiben');
  assert.deepEqual(schreiben.parts.map((p) => p.key), ['schreiben-1', 'schreiben-2']);
  const [sms, mail] = schreiben.parts;
  assert.ok(schreiben.parts.every((p) => p.type === 'writing'));
  assert.match(sms.label, /SMS/);
  assert.match(sms.task, /20 bis 30 Wörter/, 'Teil 1 must state the 20-30 word range');
  assert.match(mail.label, /E-Mail/);
  assert.match(mail.task, /30 bis 40 Wörter/, 'Teil 2 must state the 30-40 word range');
  for (const p of schreiben.parts) {
    assert.ok(p.criteria.length >= 3, `${p.key}: at least three self-check criteria`);
    assert.match(p.task, /drei Punkte:/, `${p.key}: three Leitpunkte must be named`);
    const leit = p.task.split('drei Punkte:')[1] || '';
    assert.equal(sentences(leit).length, 3, `${p.key}: expected exactly three Leitpunkte`);
    assert.ok(p.criteria.some((c) => /Anrede/.test(c)), `${p.key}: criteria must mention Anrede/Gruß`);
    assert.ok(p.criteria.some((c) => /-Form/.test(c)), `${p.key}: criteria must mention the register`);
    assert.ok(p.criteria.some((c) => /versteht/.test(c)), `${p.key}: criteria must mention Verständlichkeit`);
  }
  assert.match(sms.criteria.join(' '), /du-Form/);
  assert.match(mail.criteria.join(' '), /Sie-Form/);
});

// ── 4. the A2.2 level constraint (docs/course-factory/wave5/level-a2.2.md) ─────────────────

test('no sentence in any German string exceeds 16 words', () => {
  const offenders = [];
  for (const { where, s } of allStrings()) {
    for (const sen of sentences(s)) {
      const n = words(sen.replace(/[„“"]/g, ''));
      if (n > 16) offenders.push({ where, n, sen });
    }
  }
  assert.deepEqual(offenders, [], `sentences over 16 words: ${JSON.stringify(offenders, null, 2)}`);
});

test('no banned A2.2 grammar in any authored string', () => {
  const BANS = [
    ...A2_GRAMMAR_BANS,
    [/[şıçğăâîĭ]/i, 'character not on a German keyboard'],
    [/\b(the|and|your|please|week|month|room)\b/i, 'English inside a German field'],
    [/Das Tool prüft|automatisch bewertet|automatisch korrigiert/, 'claims an automated check that does not exist'],
    [/\/modelltest\//, 'raw route path printed to the learner'],
    [/garantiert bestehst|bestehst du garantiert|Bestehensgarantie|sicher bestehen|100\s?% Erfolg/i, 'outcome promise'],
    [/(offiziell(e|es)? (telc|goethe|dtz|prüfungs))(?!.*kein)|original[- ]?(telc|goethe)[- ]?(aufgaben|material|prüfung)|von (telc|goethe) zertifiziert/i, 'official-material claim'],
  ];
  const offenders = [];
  for (const { where, s } of allStrings()) {
    const body = s.replace(/kein offizielles Prüfungsmaterial/g, '');
    for (const [re, why] of BANS) {
      const m = body.match(re);
      if (m) offenders.push({ where, why, hit: m[0] });
    }
  }
  assert.deepEqual(offenders, [], `banned grammar/claims: ${JSON.stringify(offenders, null, 2)}`);
});

// Round 3, blocking finding B1: round 2's own rewrite of Anzeige f shipped
// "Offener Singabend jeden Mittwoch im Gemeindehaus." — a SINGULAR
// null-article adjective+noun (the "kalter Kaffee" pattern), banned
// everywhere except the frozen chunks per the level file and the
// 2026-09-06 ruling that the receptive exemption covers PLURALS only. No
// rule in this harness caught it, so a green 22/22 said nothing about this
// class. Ported from abschlusstestA21.js's own "every attributive adjective
// sits after an article" check: a capitalised adjective ending in the
// strong singular markers -er (masc. nom.) or -es (neut. nom./acc.),
// sitting right after a sentence boundary or line start with NO article or
// preposition-contraction before it, followed by a capitalised noun. Strong
// PLURAL endings are "-e" (alte Volkslieder, große Firmen), which this
// pattern does not match at all — plurals are exempt by construction, not
// by an exception list, matching the ruling.
// [ \t]+ (not \s+) between the candidate adjective and the candidate noun:
// this module's lesen-2 board is a colon-labelled line list ("Kursraum 2:
// Pilates\nAlle Kurse..."), and a bare \s+ crosses the newline to falsely
// pair the class name "Pilates" (which happens to end in "-es") with "Alle",
// the next BOARD LINE's leading word — not an adjective+noun pair at all.
// Restricting to same-line whitespace keeps the real "kalter Kaffee" case
// (space-separated on one line) while dropping that board-format artefact.
const NULL_ARTICLE_STRONG = /(^|[.!?:]\s|\n)(\p{Lu}\p{Ll}+(?:er|es))[ \t]+(\p{Lu}[\p{L}-]+)/gu;
const FROZEN_CHUNK_ADJ_NOUN = /\b(Guten Tag|Guten Morgen|Guten Abend|Viele Grüße|Liebe Grüße|Schönes Wochenende|Guten Appetit)\b/g;

test('no singular null-article adjective ending (the "kalter Kaffee" pattern) in any string', () => {
  const stripped = joined.replace(FROZEN_CHUNK_ADJ_NOUN, ' ');
  const hits = [...stripped.matchAll(NULL_ARTICLE_STRONG)].map((m) => `${m[2]} ${m[3]}`);
  assert.deepEqual(hits, [], `singular null-article adjective+noun found: ${JSON.stringify(hits)}`);
});

test('injection proof: the null-article rule actually catches "Neuer Wochenmarkt"', () => {
  // A planted string, never part of the module — proves the regex above is
  // live and would fail the previous test if this exact class reappeared
  // (this is precisely the D1 sibling's own round-2 headline example).
  const planted = 'Neuer Wochenmarkt in der Stadt. Alte Volkslieder sind schön.';
  const hits = [...planted.matchAll(NULL_ARTICLE_STRONG)].map((m) => `${m[2]} ${m[3]}`);
  assert.deepEqual(hits, ['Neuer Wochenmarkt'], 'the rule must catch the singular strong-ending case and NOT flag the plural sentence next to it');
});

test('the honesty contract is actually in the intro', () => {
  assert.match(mock.intro, /kein offizielles Prüfungsmaterial/);
  assert.match(mock.intro, /Richtwert/);
  assert.match(mock.intro, /keine offizielle Bewertung/);
  assert.match(mock.intro, /Goethe-Zertifikat A2/);
  assert.match(mock.intro, /ab 60 von 100 Punkten/, 'the pass line uses the repo house phrasing');
  assert.match(mock.intro, /von deinem A2\.2-Kurs/, 'Genitiv-free ownership phrasing');
  assert.ok(!/Aufgaben\./.test(mock.intro), 'the pass rule must not be stated as a share of Aufgaben');
  const titles = mock.sections.map((sec) => sec.title);
  assert.deepEqual(titles, ['Hören', 'Lesen', 'Schreiben']);
  assert.match(mock.intro, new RegExp(`${titles[0]}, ${titles[1]} und ${titles[2]}`));
  assert.match(mock.intro, /Er trainiert drei Teile vom Goethe-Zertifikat A2/);
  assert.match(mock.intro, /Sprechen trainierst du im Speaking-Missions-Trainer, nicht hier\./, 'the missing fourth part must be disclosed');
  assert.ok(!/\/modelltest\//.test(mock.intro), 'no raw route path in the intro');
  assert.match(mock.intro, /halbe Länge/);
});

test("all twelve A2.2 topics appear on purpose across the Lesen texts, topics 9-12 at most twice each", () => {
  const lesen = mock.sections.find((s) => s.key === 'lesen');
  const lesenText = [
    lesen.parts.find((p) => p.key === 'lesen-2').text,
    ...lesen.parts.find((p) => p.key === 'lesen-4').options.filter((o) => o.key !== 'x').map((o) => o.label),
    ...lesen.parts.find((p) => p.key === 'lesen-4').texts.map((t) => t.text),
  ].join('\n');

  const topics = {
    'reflexive-verbs': /melden Sie sich\b.*\ban\b/,
    'simple-past-sein-haben': /\b(es gab|gab es)\b/,
    'coordinating-conjunctions': /kostenlos,\s*aber\b/,
    'subordinating-conjunctions': /\b(wenn|weil|dass|ob)\b/,
    'subordinate-word-order': /Wenn Sie zum ersten Mal kommen, melden Sie sich/,
    comparative: /\b\p{Ll}+er als\b/u,
    superlative: /\b[Aa]m liebsten\b/,
    'future-tense': /\bwird\b[^.?!]*\bdauern\b/,
    'konjunktiv-ii-polite (9)': /\bkönnten\b/,
    'verbs-with-prepositions-intro (10)': /interessiere mich für\b/,
    'indirect-questions-intro (11)': /,\s*ob\s+[^,]*\bsind\b/,
    // Round 2: moved from ad c ("Lust, neue Leute kennenzulernen") to ad a
    // ("Zeit, am Samstagvormittag vorbeizukommen") when ad c was rewritten
    // for the finding-11 direction fix. Same anchor verb family (Zeit haben
    // + zu-Infinitiv), different Anzeige.
    'infinitive-with-zu-intro (12)': /Zeit,\s*am Samstagvormittag vorbeizukommen/,
  };
  for (const [name, re] of Object.entries(topics)) {
    assert.match(lesenText, re, `topic missing or unrecognisable: ${name}`);
  }

  // Cap: topics 9-12 at most twice each across the Lesen texts.
  const newTopicCounts = {
    'konjunktiv-ii-polite': (lesenText.match(/\b(würde|würden|könnte|könnten|hätte|hätten|wäre|wären)\b/g) || []).length,
    'verbs-with-prepositions-intro': (lesenText.match(/\b(interessiere|interessierst|interessiert)\s+(mich|dich|sich|uns|euch)\s+für\b|\bfreu(e|st|t)\s+(mich|dich|sich|uns|euch)\s+(auf|über)\b|\bwarte(st|t)?\s+auf\b/g) || []).length,
    'indirect-questions-intro': (lesenText.match(/,\s*ob\s/g) || []).length,
    // Matches both a free-standing "zu + Infinitiv" and a separable verb
    // with zu infixed before the stem (e.g. "vorbeizukommen").
    'infinitive-with-zu-intro': (lesenText.match(/\bZeit,\s*[^.?!]*(?:\bzu\s+\p{Ll}+en\b|\b\p{Ll}+zu\p{Ll}+en\b)/gu) || []).length,
  };
  for (const [name, n] of Object.entries(newTopicCounts)) {
    assert.ok(n >= 1 && n <= 2, `${name}: expected 1-2 occurrences, found ${n}`);
  }
});

// ── 5. solvability ───────────────────────────────────────────────────────

test('every lesen-2 item is decidable from the board text (key facts present)', () => {
  const l2 = mock.sections.find((s) => s.key === 'lesen').parts.find((p) => p.key === 'lesen-2');
  const t = l2.text;
  assert.match(t, /Donnerstag, 17 Uhr, Schwimmbad: Wassergymnastik/); // l2-1 a
  assert.match(t, /melden Sie sich bitte an der Rezeption an/); //      l2-2 b
  assert.match(t, /Für Wassergymnastik brauchen Sie auch einen Badeanzug/); // l2-3 c
  assert.match(t, /Freitag, 18 Uhr, Kursraum 1: Boxtraining/); //       l2-4 b
  assert.match(t, /aber Gäste zahlen 5 Euro/); //                       l2-5 c
  // Every distractor a learner could confuse an item with is itself a
  // detail the board names (elimination happens from the text).
  assert.match(t, /Montag, 8 Uhr, Kursraum 1: Rückenfit/); // l2-1 distractor b
  assert.match(t, /Montag, 18 Uhr, Kursraum 2: Bauch-Beine-Po/); // l2-4 distractor a
  assert.match(t, /Samstag, 10 Uhr, Kursraum 2: Pilates/); // l2-4 distractor c
});

// Round 2, finding 12: the original version of this test checked keyword
// PRESENCE/ABSENCE only — never that the matched ad OFFERS what the
// situation NEEDS. That is exactly how round 1's inverted ad e ("Ich suche
// Hilfe beim Umzug" matched against a situation that also needs help)
// passed 21/21. This version adds an explicit offer/need DIRECTION check on
// every situation whose own wording states a need ("brauchst", "suchst",
// "möchtest"), on top of the keyword anchors.
test('every lesen-4 situation matches exactly one option by both keyword and offer/need direction', () => {
  const l4 = mock.sections.find((s) => s.key === 'lesen').parts.find((p) => p.key === 'lesen-4');
  const byKey = Object.fromEntries(l4.options.map((o) => [o.key, o.label]));
  const byId = Object.fromEntries(l4.texts.map((t) => [t.id, t.text]));

  // A situation phrased as a NEED must match an ad phrased as an OFFER
  // (first-person "ich helfe" / "ich biete an" / "bietet ... an"), never one
  // phrased as its own need ("ich suche" as the ad's main verb). This is the
  // exact shape of finding 1: a "brauchst Hilfe" situation must not resolve
  // to a "suche Hilfe" ad.
  const isOffer = (label) => /\b(ich helfe|ich biete|bietet)\b/i.test(label);

  // s1: wants to learn piano, never had lessons -> b (a school/teacher OFFERS lessons).
  assert.match(byId.s1, /Klavier/);
  assert.match(byKey.b, /Klavierunterricht/, 's1 -> b needs a piano-lesson ad');
  assert.ok(isOffer(byKey.b), 's1 -> b must be phrased as an offer of lessons, not a request for them');
  assert.ok(!/Klavier|Instrument/.test(byKey.a) && !/Klavier|Instrument/.test(byKey.f), 's1 must not also match a or f');

  // s2: "brauchst Hilfe mit den Kartons" (a NEED) -> e must OFFER, not need, help.
  assert.match(byId.s2, /brauchst Hilfe/);
  assert.match(byKey.e, /Umzug/, 's2 -> e needs a moving-help ad');
  assert.ok(isOffer(byKey.e), 's2 -> e must offer help with the move (the situation already needs it — two needy parties do not match)');
  assert.ok(!/\bich suche\b.*\bHilfe\b/i.test(byKey.e), 's2 -> e must not itself ask for help');
  assert.ok(!/Umzug|Kartons/.test(byKey.d), 's2 must not also match the babysitting ad d');

  // s3: wants a group to sing with -> f (an open sing-along, framed as an event, not a needy recruitment ad).
  assert.match(byId.s3, /singen/i);
  assert.match(byKey.f, /Singabend|singen/i, 's3 -> f needs a singing ad');
  assert.ok(!/singen|Chor|Sängerinnen/i.test(byKey.a) && !/singen|Chor|Sängerinnen/i.test(byKey.b), 's3 must not also match a or b');

  // s4: wants to improve Spanish by meeting a native speaker -> c, where the
  // AD WRITER states native Spanish origin (grounds "Muttersprachler" in the
  // ad itself, not just in the situation).
  assert.match(byId.s4, /Muttersprachler/);
  assert.match(byKey.c, /komme aus Spanien/, 's4 -> c must ground "Muttersprachler" by having the ad-writer state Spanish origin');
  assert.match(byKey.c, /interessiere mich für Sprachen|Deutsch-Üben/, 's4 -> c must offer a language exchange');

  // s5: wants a cheap apartment near the station -> x. No option may offer
  // housing at all.
  assert.match(byId.s5, /Wohnung/);
  for (const [key, label] of Object.entries(byKey)) {
    if (key === 'x') continue;
    assert.ok(!/Wohnung zu vermieten|Wohnung mieten|Miete:/.test(label), `${key}: must not accidentally satisfy s5 (Wohnung)`);
  }

  // General direction guard: for every situation whose OWN text states a
  // need (brauchst/suchst/möchtest ... Hilfe|Unterricht|jemanden), its
  // matched ad (when not x) must read as an offer, not a second need.
  for (const t of l4.texts) {
    const ans = l4.answers[t.id];
    if (ans === 'x') continue;
    const situationNeedsHelp = /\bbrauchst\b.*\bHilfe\b/i.test(t.text);
    if (situationNeedsHelp) {
      assert.ok(isOffer(byKey[ans]), `${t.id}: situation states a need for help; its matched ad ${ans} must be phrased as an offer`);
    }
  }
});

// Round 3, minor 4: this is a hand-maintained blacklist of the sibling PRs'
// most distinctive NOUNS — it catches a reused domain or a repeated term,
// but it cannot catch a PARAPHRASE built from ordinary words. Round 2's
// Anzeige b closed with "Die Anmeldung ist online oder telefonisch
// möglich." — no blacklisted noun, so this test passed, but the sentence
// stitched together PR C's board close and PR C's own Anzeige c close (see
// the de-duplication note above the `lesen-4` part object). Found by a
// human line-by-line re-read of PR C's Teil-4 lesson (content/reading/a2-lessons.json), not by
// this test; fixed by removing the sentence. Left here as a known
// limitation rather than a false sense of coverage.
test('lesen-4 Anzeigen a/b/c/d/e/f duplicate neither the Goethe-A2 mock (src/data/mockExams/goetheA2.js) nor PR C\'s Teil-4 lesson', () => {
  const l4 = mock.sections.find((s) => s.key === 'lesen').parts.find((p) => p.key === 'lesen-4');
  const full = l4.options.map((o) => o.label).join('\n');
  // Distinctive nouns/phrases from the two sibling PRs' ad sets. None of
  // these may appear in this module's own Anzeigen — a shared everyday word
  // (Euro, Stunde) is not distinctive enough to matter; these are.
  const D1_AND_PRC_TERMS = [
    'Gitarrenunterricht',
    'Katze', // D1's Katzensitting ad
    'Nachhilfe',
    'Kleiderschrank',
    'Wandergruppe',
    'Freizeitmannschaft',
    'Second-Hand-Kindersachen-Basar', // this module's OWN round-1 draft, which was PR C's Flohmarkt ad in disguise
    'Flohmarkt',
    'Tandempartner', // round-1's own flagged non-transparent word, also gone
    'Pfarrheim',
  ];
  for (const term of D1_AND_PRC_TERMS) {
    assert.ok(!full.includes(term), `lesen-4 Anzeigen must not reuse the term "${term}" from a sibling PR`);
  }
});

// ── 6. Schreiben scenario de-duplication by MEANING ──────────────────────
//
// Ported from tests/a2-1-abschlusstest.test.mjs's keyword-overlap check
// (stem both sides, drop stopwords, flag >=2 shared content words or one
// RARE shared word) run against the LIVE src/data/writingTasks.js.

const STOP = new Set(
  ('du sie ihr ihre ihren ihrem er es ihm ihn wir uns man mir mich dir dich sich ' +
    'der die das den dem des ein eine einen einem einer kein keine mein meine deine deinen deinem dein ' +
    'und oder aber auch noch nur schon ganz sehr etwa circa ca bitte gern leider ' +
    'an in im am auf aus bei mit nach von vor zu zur zum für ohne um über unter neben zwischen seit bis ab ' +
    'ist sind war hast hat haben wird werden soll sollen kann kannst konnen muss musst mussen ' +
    'was wann wo wie warum welche welchen welches wer dass ob wenn weil ' +
    'sag sagen nenn nennen frag fragen schreib schreiben beschreib beschreiben erklar erklaren bitt bitten ' +
    'wort worter nachricht mail email sms text punkt punkte teil zwei drei ' +
    'nicht nichts kommen komme kommst kommt gehen geht machen macht mache heute morgen ' +
    'sein habe wollen mochte mochten konnen brauche jedem beispiel zeile feld felder')
    .split(/\s+/)
);

const stem = (w) => {
  for (const suf of ['en', 'st', 'et', 'e', 't']) {
    if (w.endsWith(suf) && w.length - suf.length >= 4) return w.slice(0, -suf.length);
  }
  return w;
};
const deUmlaut = (w) => w.replace(/[äöü]/g, (c) => ({ ä: 'a', ö: 'o', ü: 'u' })[c]);
const STOP_STEMS = new Set([...STOP, ...[...STOP].map(stem), ...[...STOP].map((w) => stem(deUmlaut(w)))]);

function keywords(s) {
  return new Set(
    String(s)
      .toLowerCase()
      .replace(/[^\p{L}\s-]/gu, ' ')
      .split(/\s+/)
      .map((w) => w.replace(/-/g, ''))
      .filter((w) => w.length > 2)
      .map(stem)
      .filter((w) => w.length > 2 && !STOP_STEMS.has(w) && !STOP_STEMS.has(deUmlaut(w)))
  );
}

const overlap = (a, b) => {
  const inter = [...a].filter((x) => b.has(x));
  return { n: inter.length, shared: inter, jaccard: inter.length / new Set([...a, ...b]).size };
};

async function liveTasks() {
  const { WRITING_TASKS } = await import(`${root}/src/data/writingTasks.js`);
  return WRITING_TASKS;
}

function distinctiveness(tasks) {
  const df = new Map();
  for (const t of tasks) {
    for (const kw of keywords([t.task, ...t.leitpunkte].join(' '))) {
      df.set(kw, (df.get(kw) || 0) + 1);
    }
  }
  return (kw) => (df.get(kw) || 0) <= 2;
}

test('no Schreiben Leitpunkt reproduces a live writing task by meaning', async () => {
  const tasks = await liveTasks();
  const isDistinctive = distinctiveness(tasks);
  const parts = mock.sections.find((s) => s.key === 'schreiben').parts;

  const offenders = [];
  for (const part of parts) {
    const leit = sentences((part.task.split('drei Punkte:')[1] || '').trim());
    assert.equal(leit.length, 3, `${part.key}: expected exactly three Leitpunkte`);
    for (const mine of leit) {
      const mineKw = keywords(mine);
      for (const t of tasks) {
        for (const theirs of t.leitpunkte) {
          const o = overlap(mineKw, keywords(theirs));
          const flagged = o.n >= 2 || (o.n === 1 && o.jaccard >= 0.5 && isDistinctive(o.shared[0]));
          if (flagged) {
            offenders.push({ part: part.key, mine, theirs, taskKey: t.taskKey, shared: o.shared });
          }
        }
      }
    }
    const scenarioKw = keywords(part.task.split('drei Punkte:')[0]);
    for (const t of tasks) {
      const o = overlap(scenarioKw, keywords(t.task));
      if (o.jaccard >= 0.35) offenders.push({ part: part.key, scenario: true, taskKey: t.taskKey, shared: o.shared });
    }
  }
  assert.deepEqual(offenders, [], `Schreiben scenarios overlap the live bank:\n${JSON.stringify(offenders, null, 2)}`);
});

test('no A2.1/goethe_a1 course-test or mock writing scenario is reproduced either', () => {
  // The live bank check above only covers src/data/writingTasks.js. This
  // repo's Schreiben-scenario collisions have also come from SIBLING mocks
  // and course tests that are not in that bank at all (abschlusstestA21.js,
  // dtz.js's Hausverwaltung message) — grep them directly for the domain
  // words this module's own two scenarios must not land on.
  const siblingFiles = [
    'src/data/courseTests/abschlusstestA21.js', // SMS-Geburtstag-Absage, E-Mail-Nachbarin-Paket
    'src/data/mockExams/dtz.js', // Hausverwaltung
  ];
  for (const f of siblingFiles) {
    const body = readFileSync(`${root}/${f}`, 'utf8');
    assert.ok(!/Physiotherapiepraxis|Rückenschmerzen/.test(body), `${f} unexpectedly already uses this module's own scenario`);
  }
  // And this module must not use A21's or dtz's scenario words either.
  assert.ok(!/Geburtstag|Hausverwaltung|Paket für Sie/.test(joined), 'this module must not reuse a sibling scenario');
});
