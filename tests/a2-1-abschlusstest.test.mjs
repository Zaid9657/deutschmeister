// Guard suite for the Abschlusstest A2.1 module (src/data/courseTests/
// abschlusstestA21.js) — Course Factory Wave 4, PR D2. Ported from the
// author's validation harness: mirrors the course-test assertions in
// tests/exams.test.mjs plus the A2.1 level constraint the content was written
// under (no Genitiv, no Präteritum of full verbs, no reflexives, no Nebensätze,
// ≤14 words per sentence, a/b/c Lesen items in the Goethe-A2 shape), the
// solvability of every Lesen item from its own text, and a meaning-level
// de-duplication of the Schreiben scenarios against the live writing bank.
// The harness's provenance checks against the authoring-time listening dump
// are not carried: the live exercise has carried 23 questions since PR C
// (#85), which is exactly why the part's questionMax exists.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { EXAM_TRACKS, examTrackByKey } from '../src/data/examTracks.js';
import { countScorableItems } from '../src/data/mockExams/index.js';
import { scoreObjectiveSections } from '../src/services/examScoring.js';
import { selectListeningQuestions } from '../src/data/courseTests/listeningQuestions.js';
import { isLevelFree } from '../src/config/freeTier.js';
import { bandCourseForLevel } from '../src/data/pricing.js';
import { abschlusstestA21 } from '../src/data/courseTests/abschlusstestA21.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mock = abschlusstestA21;
const ct = {
  key: mock.examKey,
  slug: 'abschlusstest-a2-1',
  nameDe: 'Abschlusstest A2.1',
  level: mock.courseLevel,
  formatOf: mock.formatOf,
  mock,
};

const words = (s) => String(s).split(/\s+/).filter(Boolean).length;
const MONTHS =
  'Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember';
/**
 * Split into sentences WITHOUT breaking after an ordinal date — round 1's
 * splitter measured "Seit dem 1. September gibt es …" as two sentences, so
 * the 14-word ceiling silently under-counted any sentence carrying a date.
 * Ordinal+month pairs are glued with a non-breaking space before the split
 * and restored after, which leaves a real sentence that ENDS in a number
 * (". Raum 12. Der alte Raum …") splitting normally.
 */
const sentences = (s) =>
  String(s)
    .replace(new RegExp(`(\\d+)\\.\\s+(${MONTHS})`, 'g'), '$1.\u00A0$2')
    .split('\n')
    .flatMap((line) => line.split(/(?<=[.?!])\s+/))
    .map((x) => x.replace(/\u00A0/g, ' ').trim())
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
    }
  }
  return out;
}

const joined = allStrings().map((x) => x.s).join('\n');

/** Collapse whitespace so a quote wrapped across comment lines still matches. */
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();

/**
 * The module's leading comment block with the `//` markers stripped and all
 * whitespace collapsed. Round 1's fabricated #6 quote survived because the
 * harness checked four hand-picked quotes against exact list membership;
 * this makes the whole header machine-checkable.
 */
function headerText() {
  const src = readFileSync(join(root, 'src/data/courseTests/abschlusstestA21.js'), 'utf8');
  const head = src.slice(0, src.indexOf('export const abschlusstestA21'));
  return flat(
    head
      .split('\n')
      .map((l) => l.replace(/^\s*\/\/ ?/, ''))
      .join(' ')
  );
}

// ── 1. identity, registry boundary, gate ─────────────────────────────────

test('identity fields and the COURSE_TESTS boundary', () => {
  assert.equal(mock.examKey, 'a2_1_abschluss');
  assert.equal(mock.courseLevel, 'a2.1');
  assert.equal(mock.formatOf, 'goethe_a2');
  assert.equal(mock.title, 'Abschlusstest A2.1 (Kurzversion)');
  assert.match(mock.title, /Kurzversion/, 'shortened sets must say so in the title');
  assert.equal(mock.passPercent, 60);
  assert.ok(mock.passPercent >= 50 && mock.passPercent <= 100);
  assert.match(ct.level, /^[ab][12]\.[12]$/, 'level must be a lowercase sublevel');
  assert.match(ct.slug, /^[a-z0-9-]+$/);
  assert.match(ct.key, /^[a-z0-9_]+$/);

  const examKeys = new Set(EXAM_TRACKS.map((t) => t.key));
  assert.ok(!examKeys.has(ct.key), `course test key ${ct.key} collides with an EXAM_TRACKS key`);
});

test('formatOf goethe_a2 is the PR D1 dependency, not a typo', () => {
  const track = examTrackByKey('goethe_a2');
  if (track) {
    // D1 has landed — then the repo guard's own assertion must hold.
    assert.equal(track.key, 'goethe_a2');
    assert.equal(track.slug, 'goethe-a2');
  } else {
    // D1 has NOT landed. Registering this module now would fail
    // tests/exams.test.mjs's "formatOf resolves to a real EXAM_TRACKS key".
    assert.deepEqual(
      EXAM_TRACKS.map((t) => t.key).sort(),
      ['dtz', 'goethe_a1', 'goethe_b1', 'telc_b1', 'telc_b2'],
      'EXAM_TRACKS changed — re-check the goethe_a2 dependency'
    );
  }
});

test('the gate this file claims in its header is the gate the code computes', () => {
  assert.equal(isLevelFree('a2.1'), false, 'a2.1 must not be a free level, or the gate note is wrong');
  assert.equal(bandCourseForLevel('a2.1')?.key, 'course_a2_1', 'the A2.1 course must unlock a2.1');
});

// ── 2. shape guards from tests/exams.test.mjs ────────────────────────────

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

test('every part key and item id is unique', () => {
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

test('Hören: exactly one listening part, capped at 10 questions', () => {
  const hoeren = mock.sections.find((s) => s.key === 'hoeren');
  assert.equal(hoeren.parts.length, 1);
  const p = hoeren.parts[0];
  assert.equal(p.type, 'listening');
  assert.equal(p.level, 'A2.1');
  assert.equal(p.exerciseNumber, 4);
  assert.equal(p.questionMax, 10);
  assert.equal(p.exerciseId, 'fbd6e61e-b9a8-4a6d-bdff-ad3366b95a50');
  // 8:38 of audio against a hard 15-minute timer: one play fits, two do not.
  assert.equal(p.playsAllowed, 1, 'the Hören part must cap itself at one play');
  // The field only means something if the runner reads it: MockListeningPart
  // resolves `part.playsAllowed ?? PLAYS_ALLOWED` for both the play guard and
  // the "Noch …× abspielbar" label (PR D2 added that line; the default stays 2
  // for every mock that does not set the field).
  const runSrc = readFileSync(join(root, 'src/pages/Modelltest/ModelltestRun.jsx'), 'utf8');
  assert.match(runSrc, /const playsAllowed = part\.playsAllowed \?\? PLAYS_ALLOWED;/, 'ModelltestRun.jsx must resolve the per-part play cap');
  assert.match(runSrc, /const PLAYS_ALLOWED = 2;/, 'the default cap the part overrides still reads 2');

  // The cap must actually bite if the exercise is later expanded the way
  // every A1 exercise was in Wave 2/3 (10 -> 23 questions).
  const fake = Array.from({ length: 23 }, (_, i) => ({ id: `q${i + 1}`, question_number: i + 1 }));
  assert.equal(selectListeningQuestions(fake, p).length, 10);
});

test('no other mock or course test already uses an A2.1 listening exercise', () => {
  // The Hören part reuses live course audio (A2.1 #4); it must not be one a
  // learner has already answered inside another mock.
  for (const f of ['mockExams/goetheA1.js', 'mockExams/goetheB1.js', 'mockExams/telcB1.js', 'mockExams/telcB2.js', 'mockExams/dtz.js', 'courseTests/abschlusstestA11.js', 'courseTests/abschlusstestA12.js']) {
    const body = readFileSync(join(root, 'src/data', f), 'utf8');
    assert.ok(!/level:\s*'A2\.1'/.test(body), `${f} already uses an A2.1 listening exercise`);
  }
});

test('Lesen: two parts, 5 + 5 = 10 items, every item three-option a/b/c', () => {
  const lesen = mock.sections.find((s) => s.key === 'lesen');
  assert.deepEqual(lesen.parts.map((p) => p.key), ['lesen-1', 'lesen-3']);
  assert.ok(lesen.parts.every((p) => p.type === 'mc-group' && p.text));

  const t1 = lesen.parts.find((p) => p.key === 'lesen-1').items;
  const t3 = lesen.parts.find((p) => p.key === 'lesen-3').items;
  assert.equal(t1.length, 5);
  assert.equal(t3.length, 5);
  assert.equal(t1.length + t3.length, 10);

  // Coordinator ruling 2026-09-06: Richtig/Falsch is the A1 shape; the real
  // Goethe A2 Lesen Teil 1 is a question with three answers. No r/f item may
  // survive anywhere in this module.
  for (const it of [...t1, ...t3]) {
    assert.deepEqual(it.options.map((o) => o.key), ['a', 'b', 'c'], `${it.id}: must be a/b/c`);
    assert.ok(it.prompt.endsWith('?'), `${it.id}: an a/b/c item must ask a question`);
  }
  const full = JSON.stringify(mock);
  assert.ok(!/"key":"[rf]"/.test(full), 'no Richtig/Falsch option keys may remain');
  assert.ok(!/Richtig|Falsch|richtig oder falsch/.test(full), 'no Richtig/Falsch wording may remain');
});

test('a/b/c key spread: both parts use all three letters, none more than twice', () => {
  const lesen = mock.sections.find((s) => s.key === 'lesen');
  for (const part of lesen.parts) {
    const keyStr = part.items.map((i) => i.answer).join('');
    assert.equal(keyStr.length, 5, `${part.key}: five items`);
    assert.equal(new Set(keyStr).size, 3, `${part.key}: all three letters must be used: ${keyStr}`);
    for (const letter of 'abc') {
      const n = [...keyStr].filter((c) => c === letter).length;
      assert.ok(n >= 1 && n <= 2, `${part.key}: letter ${letter} used ${n} times: ${keyStr}`);
    }
    assert.ok(!/(.)\1/.test(keyStr), `${part.key}: no two adjacent items may share an answer: ${keyStr}`);
  }
  assert.equal(lesen.parts.find((p) => p.key === 'lesen-1').items.map((i) => i.answer).join(''), 'bcbac');
  assert.equal(lesen.parts.find((p) => p.key === 'lesen-3').items.map((i) => i.answer).join(''), 'abcab');
});

test('the two Lesen answer keys are distinct patterns, not one key twice', () => {
  const lesen = mock.sections.find((s) => s.key === 'lesen');
  const [k1, k3] = lesen.parts.map((p) => p.items.map((i) => i.answer).join(''));
  assert.notEqual(k1, k3, 'both Lesen parts share the same answer key');
  const combined = k1 + k3;
  assert.ok(!/(.)\1\1/.test(combined), `run of three identical answers across the section: ${combined}`);
  for (const letter of 'abc') {
    const n = [...combined].filter((c) => c === letter).length;
    assert.ok(n >= 3 && n <= 4, `letter ${letter} is ${n}/10 of the Lesen key — too skewed`);
  }
});

test('Schreiben: two writing parts (SMS + halbformelle E-Mail) with word ranges and >=3 criteria', () => {
  const schreiben = mock.sections.find((s) => s.key === 'schreiben');
  assert.deepEqual(schreiben.parts.map((p) => p.key), ['schreiben-1', 'schreiben-2']);
  const [sms, mail] = schreiben.parts;
  assert.ok(schreiben.parts.every((p) => p.type === 'writing'));
  assert.match(sms.label, /SMS/);
  assert.match(sms.task, /20 bis 40 Wörter/, 'Teil 1 must state the 20-40 word range');
  assert.match(mail.label, /E-Mail/);
  assert.match(mail.task, /30 bis 60 Wörter/, 'Teil 2 must state the 30-60 word range');
  for (const p of schreiben.parts) {
    assert.ok(p.criteria.length >= 3, `${p.key}: at least three self-check criteria`);
    assert.match(p.task, /drei Punkte/, `${p.key}: three Leitpunkte must be named`);
    // three Leitpunkte = three question/imperative prompts after "drei Punkte:"
    const leit = p.task.split('drei Punkte:')[1] || '';
    assert.equal(sentences(leit).length, 3, `${p.key}: expected exactly three Leitpunkte`);
    assert.ok(p.criteria.some((c) => /Anrede/.test(c)), `${p.key}: criteria must mention Anrede/Gruß`);
    assert.ok(p.criteria.some((c) => /-Form/.test(c)), `${p.key}: criteria must mention the register`);
    assert.ok(p.criteria.some((c) => /versteht/.test(c)), `${p.key}: criteria must mention Verständlichkeit`);
  }
  assert.match(sms.criteria.join(' '), /du-Form/);
  assert.match(mail.criteria.join(' '), /Sie-Form/);
});

test('Lesen text lengths: Teil 1 110-130 words, Teil 3 100-120 words', () => {
  const lesen = mock.sections.find((s) => s.key === 'lesen');
  const t1 = words(lesen.parts.find((p) => p.key === 'lesen-1').text);
  const t3 = words(lesen.parts.find((p) => p.key === 'lesen-3').text);
  assert.ok(t1 >= 110 && t1 <= 130, `Teil 1 text is ${t1} words, expected 110-130`);
  assert.ok(t3 >= 100 && t3 <= 120, `Teil 3 text is ${t3} words, expected 100-120`);
});

// ── 4. the A2.1 level constraint (S/wave4/level-a2.1.md) ─────────────────

test('no sentence in any German string exceeds 14 words', () => {
  const offenders = [];
  for (const { where, s } of allStrings()) {
    for (const sen of sentences(s)) {
      const n = words(sen.replace(/[„“"]/g, ''));
      if (n > 14) offenders.push({ where, n, sen });
    }
  }
  assert.deepEqual(offenders, [], `sentences over 14 words: ${JSON.stringify(offenders, null, 2)}`);
});

test('no banned A2.1 grammar in any authored string', () => {
  const BANS = [
    // Genitiv is a blocking defect at A2.1 and the level file grants no
    // carve-out for the intro or the instructions, so these run over EVERY
    // string. Round 1's single `des|eines + capital` rule could not see
    // "deines A2.1-Kurses", "den Aufbau der Prüfung" or the partitive
    // "60 Prozent der Aufgaben"; all three shipped and all three are gone.
    [/\b(des|eines)\s+\p{Lu}/u, 'Genitiv (des/eines + noun) — use von + Dativ'],
    [/\b(des|eines|deines|meines|seines|ihres|unseres|eures|dessen|deren)\b/, 'Genitiv determiner — use von + Dativ'],
    [/\b(Prozent|Hälfte|Anfang|Ende|Beginn|Teil|Teile|Rest)\s+(der|des)\b/, 'partitive Genitiv — use von + Dativ'],
    [/\b(Aufbau|Ergebnis|Länge|Preis|Name|Titel|Adresse|Nummer)\s+(der|des)\b/, 'Genitiv after a head noun — use von + Dativ'],
    [/\p{Lu}[\p{L}-]*(?:kurs|test|jahr|tag)es\b/u, '-es Genitiv of a masculine/neuter noun'],
    [/\b(ging|kam|sagte|machte|fuhr|sah|gab|fand|nahm|blieb|stand|wurde|kaufte|arbeitete)\b/, 'Präteritum of a full verb'],
    [/\b(werde|wirst|wird|werden|werdet)\b/, 'Futur or Passiv with werden'],
    [/\bsich\b/, 'reflexive pronoun (production banned at A2.1)'],
    [/\b(weil|dass|obwohl|wenn|ob|damit|falls|während)\b/, 'Nebensatz conjunction (A2.2 or B1)'],
    [/,\s*(der|die|das|welcher|welche|welches)\s/, 'relative clause'],
    [/\bum\s+[^.?!]{0,60}\szu\s+\p{Ll}+en\b/u, 'um ... zu'],
    [/\bam\s+(besten|meisten|schönsten|größten|wenigsten)\b/, 'Superlativ (only "am liebsten" is allowed)'],
    [/\b\p{Ll}+er\s+als\b/u, 'Komparativ with als in production'],
    [/\b(wäre|wären|hätte|hätten|würde|würden|würdest|könnte|könnten|müsste|sollte|sollten|dürfte)\b/, 'Konjunktiv II beyond the allowed chunks'],
    [/[şıçğăâîĭ]/i, 'character not on a German keyboard'],
    [/\b(the|and|your|please|week|month|room)\b/i, 'English inside a German field'],
    [/Das Tool prüft|automatisch bewertet|automatisch korrigiert/, 'claims an automated check that does not exist'],
    [/\/modelltest\//, 'raw route path printed to the learner'],
    [/garantiert bestehst|bestehst du garantiert|Bestehensgarantie|sicher bestehen|100\s?% Erfolg/i, 'outcome promise'],
    // exactly the OFFICIAL regex from tests/exams.test.mjs
    [/(offiziell(e|es)? (telc|goethe|dtz|prüfungs))(?!.*kein)|original[- ]?(telc|goethe)[- ]?(aufgaben|material|prüfung)|von (telc|goethe) zertifiziert/i, 'official-material claim'],
  ];
  const offenders = [];
  for (const { where, s } of allStrings()) {
    // Same exemption tests/exams.test.mjs grants itself: the disclaimer's own
    // phrasing "kein offizielles Prüfungsmaterial" is the allowed negation,
    // not an official-material claim.
    const body = s.replace(/kein offizielles Prüfungsmaterial/g, '');
    for (const [re, why] of BANS) {
      const m = body.match(re);
      if (m) offenders.push({ where, why, hit: m[0] });
    }
  }
  assert.deepEqual(offenders, [], `banned grammar/claims: ${JSON.stringify(offenders, null, 2)}`);
});

test('the honesty contract is actually in the intro', () => {
  assert.match(mock.intro, /kein offizielles Prüfungsmaterial/);
  assert.match(mock.intro, /Richtwert/);
  assert.match(mock.intro, /keine offizielle Bewertung/);
  assert.match(mock.intro, /Goethe-Zertifikat A2/);
  assert.match(mock.intro, /ab 60 von 100 Punkten/, 'the pass line uses the repo house phrasing from writingTasks.js');
  assert.match(mock.intro, /von deinem A2\.1-Kurs/, 'Genitiv-free ownership phrasing');
  assert.ok(!/Aufgaben\./.test(mock.intro), 'the pass rule must not be stated as a share of Aufgaben (D1 verifies points)');
  assert.ok(
    !/die gleichen Prüfungsteile/.test(mock.intro),
    'round 3 claimed the same Prüfungsteile as the real exam — false at 3 of 4'
  );
  // The intro must count the parts this module actually ships and name them.
  assert.match(mock.intro, /Er trainiert drei Teile vom Goethe-Zertifikat A2/);
  const titles = mock.sections.map((sec) => sec.title);
  assert.deepEqual(titles, ['Hören', 'Lesen', 'Schreiben']);
  assert.match(mock.intro, new RegExp(`${titles[0]}, ${titles[1]} und ${titles[2]}`));
  assert.equal(titles.length, 3, 'the intro says three parts — the module must have three');
  assert.match(mock.intro, /Sprechen trainierst du im Speaking-Missions-Trainer, nicht hier\./, 'the missing fourth part must be disclosed');
  assert.match(mock.intro, /A2\.2/, 'the intro must hand the learner on to A2.2');
  assert.match(mock.intro, /halbe Länge/);
});

test('every attributive adjective sits after an article — no strong (null-article) endings', () => {
  // Collect article/preposition-contraction + adjective + noun triples and
  // compare against the exact inventory the header claims. Any new one has
  // to be added here on purpose, which is what stops a strong ending from
  // sliding in unnoticed.
  // Article alternatives are spelled with both cases on purpose: an /i/ flag
  // would make \p{Ll} match capitals too and turn every "Der Kaffee ist" into
  // a false positive.
  const pattern =
    /\b(?:[Dd](?:er|ie|as|en|em)|[Ee]ine?[nmr]?|[Kk]eine?[nmr]?|[Uu]nsere?|[IiAa]m|[Bb]eim|[Zz]u[mr]|[Vv]om)\s+(\p{Ll}+(?:e|er|es|en|em))\s+(\p{Lu}[\p{L}-]+)/gu;
  const found = [];
  for (const { s } of allStrings()) {
    for (const m of s.matchAll(pattern)) found.push(m[0]);
  }
  // Every entry below was checked by hand for its case/gender ending:
  //   der/die/das + -e (Nom) / -en (Akk masc, Dat) — weak;
  //   ein/kein + -er (Nom masc) / -es (Nom+Akk neut) / -e (Nom+Akk fem) /
  //   -en (Akk masc) — mixed. Nothing here is a strong (null-article) ending.
  const expected = [
    'Der neue Nachbarschaftstreff', // lesen-1 text, Nom masc, der + -e
    'Der große Raum', //               lesen-1 text, Nom masc
    'ein kleines Abendessen', //       lesen-1 text, Akk neut, ein + -es
    'Der alte Raum', //                lesen-3 text, Nom masc
    'im ersten Stock', //              lesen-3 text, Dat masc, dem + -en
    'Der neue Raum', //                lesen-3 text, Nom masc
    'Im letzten Jahr', //              lesen-3 text, Dat neut
    'eine kurze Antwort', //           lesen-3 text, Akk fem, eine + -e
    'einen neuen Raum', //             l3-1 prompt, Akk masc, einen + -en
    'Der alte Raum', //                l3-1 option a
    'Der alte Raum', //                l3-1 option b
    'Der alte Raum', //                l3-1 option c
    'der neue Raum', //                l3-2 prompt, Nom masc
    'Im ersten Stock', //              l3-2 option a
    'eine neue Adresse', //            l3-5 option c, Akk fem
    'die halbe Länge', //              intro, Akk fem, die + -e
    'kein offizielles Prüfungsmaterial', // intro, Nom neut, kein + -es
    'keine offizielle Bewertung', //   intro, Nom fem, keine + -e
    'die richtige Antwort', //         lesen instructions, Akk fem
  ];


  assert.deepEqual(found.slice().sort(), expected.slice().sort(), `article+adjective+noun inventory drifted:\n${JSON.stringify(found, null, 2)}`);

  // The only null-article adjective+noun pairs allowed are frozen chunks.
  const frozen = /\b(Guten Tag|Guten Morgen|Guten Abend|Viele Grüße|Liebe Grüße|Schönes Wochenende|Guten Appetit)\b/g;
  const stripped = joined.replace(frozen, ' ');
  const strong = [...stripped.matchAll(/(^|[.!?:]\s|\n)(\p{Lu}\p{Ll}+(?:er|es))\s+(\p{Lu}[\p{L}-]+)/gu)].map((m) => `${m[2]} ${m[3]}`);
  assert.deepEqual(strong, [], `possible strong (null-article) adjective endings: ${JSON.stringify(strong)}`);
});

test('this wave\'s four new A2.1 topics each appear on purpose in the Lesen texts', () => {
  const lesenText = mock.sections
    .find((s) => s.key === 'lesen')
    .parts.map((p) => p.text)
    .join('\n');

  // 9 adjective-endings-intro: after der AND after ein
  assert.match(lesenText, /Der (neue|große|alte) \p{Lu}/u, 'no adjective after a definite article');
  assert.match(lesenText, /\bein (kleines|guter|neues) \p{Lu}/u, 'no adjective after ein/eine');
  // 10 pronouns-accusative-dative: a dative and an accusative object pronoun
  assert.match(lesenText, /\b(mir|Ihnen)\b/, 'no dative object pronoun');
  assert.match(lesenText, /Rufen Sie sie\b/, 'no accusative object pronoun');
  // 11 modal-verbs-past
  assert.match(lesenText, /\bkonnte\b/, 'konnte missing');
  assert.match(lesenText, /\bmussten\b/, 'musste/mussten missing');
  assert.match(lesenText, /\bwollten\b/, 'wollte/wollten missing');
  // 12 temporal-prepositions: seit / vor / ab / von...bis / um / am / gegen
  for (const [re, name] of [
    [/\bSeit dem\b/, 'seit + Dativ'],
    [/\bVor einem Jahr\b/, 'vor + Dativ'],
    [/\bAb (Oktober|dem)\b/, 'ab'],
    [/\bvon Montag bis Freitag\b/, 'von ... bis'],
    [/\bum 18 Uhr\b/, 'um + Uhrzeit'],
    [/\bAm (Mittwoch|Samstag)\b/, 'am + Wochentag'],
    [/\bgegen 16 Uhr\b/, 'gegen + Uhrzeit'],
    [/\bbis Freitag\b/, 'bis + articleless day'],
  ]) {
    assert.match(lesenText, re, `temporal preposition missing: ${name}`);
  }
});

// ── 5. solvability ───────────────────────────────────────────────────────

test('every Lesen item is decidable from its own text (key facts are present)', () => {
  const lesen = mock.sections.find((s) => s.key === 'lesen');
  const t1 = lesen.parts.find((p) => p.key === 'lesen-1').text;
  const t3 = lesen.parts.find((p) => p.key === 'lesen-3').text;

  // Teil 1 — the sentence that carries each correct answer.
  assert.match(t1, /Der Treff ist von Montag bis Freitag von 15 bis 20 Uhr geöffnet/); // l1-1 b
  assert.match(t1, /Der Treff gehört einem Verein/, 'l1-4 needs an antecedent for der Verein');
  assert.match(t1, /Am Mittwoch beginnt um 18 Uhr das Sprachcafé/); //               l1-2 c
  assert.match(t1, /Der Kaffee ist kostenlos/); //                                    l1-3 b
  assert.match(t1, /konnte der Verein nur einen Raum in der Schule nutzen/); //       l1-4 a
  assert.match(t1, /wollten schon lange einen Treffpunkt haben/, 'Präteritum modal must carry its Satzklammer');
  assert.match(t1, /Ab Oktober gibt es auch einen Computerkurs/); //                  l1-5 c
  // Sunday never appears, so "Von Montag bis Freitag" is decidable, and no
  // stray day/time/price contradicts the five keys.
  assert.ok(!/Sonntag|Dienstag|Donnerstag/.test(t1));

  // Every Teil-1 distractor must be a detail the TEXT names (elimination has
  // to be done from the text, not from plausibility) while being the wrong
  // answer to its own question.
  const t1Items = lesen.parts.find((p) => p.key === 'lesen-1').items;
  const distractorAnchors = {
    'l1-1': ['Mittwoch', 'Freitag'],
    'l1-2': ['15 ', '16 Uhr'],
    'l1-3': ['Abendessen', 'Computerkurs'],
    'l1-4': ['Gartenstraße', 'Erdgeschoss'],
    'l1-5': ['Sprachcafé', 'Abendessen'],
  };
  for (const it of t1Items) {
    for (const anchor of distractorAnchors[it.id]) {
      assert.ok(t1.includes(anchor), `${it.id}: distractor anchor "${anchor}" is not in the text`);
    }
    assert.equal(it.options.length, 3);
  }
  // The kostenlos item turns on the Kaffee sentence alone: neither distractor
  // may be called kostenlos anywhere in the text.
  assert.ok(!/Abendessen ist kostenlos|Computerkurs ist kostenlos/.test(t1));

  // Teil 3 — each correct option is supported, each distractor is not.
  assert.match(t3, /Der alte Raum im ersten Stock ist zu klein/); // l3-1 a
  assert.ok(!/teuer|laut/.test(t3), 'l3-1 distractors must not be supported by the text');
  assert.match(t3, /Der neue Raum liegt im Erdgeschoss/); // l3-2 b
  assert.match(t3, /montags von 18 bis 20 Uhr/); // l3-3 c
  assert.match(t3, /acht Euro pro Person/); // l3-4 a
  assert.ok(!/Achtzehn Euro|18 Euro/.test(t3));
  assert.match(t3, /Bitte geben Sie mir das Geld bis Freitag/); // l3-5 b (Geld)
  assert.match(t3, /Schreiben Sie mir bitte bis Freitag eine kurze Antwort/); // l3-5 b (Antwort)
  assert.ok(!/Adresse/.test(t3), 'l3-5 distractor c must not be supported');
});

// ── 6. the header must not invent quotes (round-1 blocking finding) ──────

test('the header does not quote the fabricated round-1 #6 line, and does quote the real one', () => {
  const src = headerText();
  assert.ok(
    !src.includes('Bitte beachten Sie, dass während des Films'),
    'round-1 stitched "Bitte beachten Sie, dass" onto the Kino sentence — that line is not in the source'
  );
  assert.ok(src.includes('Wir weisen darauf hin, dass während des Films Handys ausgeschaltet sein müssen.'));
});

// ── 7. the Genitiv ban is not decorative ────────────────────────────────

test('the widened Genitiv regexes catch every phrasing round 1 shipped', () => {
  // Re-declared here rather than exported so this test fails loudly if the
  // ban list above is edited without re-checking what it still catches.
  const GEN = [
    /\b(des|eines)\s+\p{Lu}/u,
    /\b(des|eines|deines|meines|seines|ihres|unseres|eures|dessen|deren)\b/,
    /\b(Prozent|Hälfte|Anfang|Ende|Beginn|Teil|Teile|Rest)\s+(der|des)\b/,
    /\b(Aufbau|Ergebnis|Länge|Preis|Name|Titel|Adresse|Nummer)\s+(der|des)\b/,
    /\p{Lu}[\p{L}-]*(?:kurs|test|jahr|tag)es\b/u,
  ];
  const hits = (s) => GEN.some((re) => re.test(s));
  for (const bad of [
    'Das ist der Abschlusstest deines A2.1-Kurses.',
    'Er hat den Aufbau der Prüfung Goethe-Zertifikat A2.',
    'Wie in der Prüfung bestehst du ab 60 Prozent der Aufgaben.',
    'Wie hoch war das Fieber des Patienten?',
    'Am Ende des Jahres.',
  ]) {
    assert.ok(hits(bad), `Genitiv ban does not catch: ${bad}`);
  }
  // …and does not fire on the Dativ/Nominativ phrasings that replaced them.
  for (const good of [
    'Das ist der Abschlusstest von deinem A2.1-Kurs.',
    'Er hat die gleichen Prüfungsteile wie das Goethe-Zertifikat A2.',
    'Wie in der Prüfung bestehst du ab 60 Prozent von den Punkten.',
    'Der neue Raum liegt im Erdgeschoss neben dem Büro.',
    'Seit dem 1. September gibt es den Nachbarschaftstreff in der Gartenstraße.',
    'Teil 1 und Teil 3: Lies den Text und die E-Mail.',
  ]) {
    assert.ok(!hits(good), `Genitiv ban false-positives on: ${good}`);
  }
});

// ── 8. Schreiben scenarios ──────────────────────────────────────────────

test('exactly one cancellation scenario, and none of PR D1s three writing topics', () => {
  const [sms, mail] = mock.sections.find((s) => s.key === 'schreiben').parts;
  const cancels = (p) => /kann(st|)\s+nicht\s+kommen|absagen|nicht zur Party kommen/.test(p.task);
  assert.equal(cancels(sms), true, 'the SMS is the cancellation');
  assert.equal(cancels(mail), false, 'a second cancellation would be the third copy of one scenario in this repo');

  // S/wave4/exam-brief.md §4 gives D1's writing bank "Kursanmeldung /
  // Termin beim Amt / Nachbarn um Hilfe bitten". This file must not sit on
  // the one it names outright.
  assert.ok(!/\bAmt\b/.test(JSON.stringify(mock)), 'Termin beim Amt belongs to PR D1s writing bank');

  // schreiben-1's Leitpunkt must ask what its own scenario sets up: the
  // scenario says the learner cannot come, so the reason must stay open
  // rather than presupposing a lack of time.
  assert.match(sms.task, /Du kannst nicht zur Party kommen\./);
  assert.match(sms.task, /Warum kommst du nicht\?/);
  assert.ok(!/Warum hast du keine Zeit\?/.test(sms.task), 'round 3 presupposed the reason');
});

// ── 9. scenario de-duplication by MEANING, not by characters ────────────
//
// Round 3 swapped schreiben-2 off one live duplicate and onto another: a
// Sportverein course enquiry whose three Leitpunkte are
// mitteilung-info-sprachkurs's (which course / when / what price) with the
// institution and the person-form changed. The verbatim-sentence comparison
// could not see it, because the live bank is written in the du-form and the
// task here is in the Sie-form. So both sides are stemmed to content-word
// sets first, and the check runs on those.

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

/** Lowercase, de-punctuate, drop stopwords, and crop one German inflection. */
const stem = (w) => {
  for (const suf of ['en', 'st', 'et', 'e', 't']) {
    if (w.endsWith(suf) && w.length - suf.length >= 4) return w.slice(0, -suf.length);
  }
  return w;
};
const deUmlaut = (w) => w.replace(/[äöü]/g, (c) => ({ ä: 'a', ö: 'o', ü: 'u' })[c]);
const STOP_STEMS = new Set([...STOP, ...[...STOP].map(stem), ...[...STOP].map((w) => stem(deUmlaut(w)))]);

/** Lowercase, de-punctuate, crop one German inflection, THEN drop stopwords. */
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
  const { WRITING_TASKS } = await import('../src/data/writingTasks.js');
  return WRITING_TASKS;
}

/**
 * How many live tasks use a keyword at all. A word shared with the bank is
 * only evidence of a copied Leitpunkt when it is rare there: "komm" appears
 * all over an A1 message bank and means nothing, "preis" or "blume" pin one
 * task. Round 3's collision was a SINGLE shared word ("preis" against
 * mitteilung-info-sprachkurs) — so a naive "two shared words" rule would
 * have missed it, and a naive Jaccard rule flags every "wann … kommt".
 */
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
    // …and the scenario line itself must not be a live task's scenario.
    const scenarioKw = keywords(part.task.split('drei Punkte:')[0]);
    for (const t of tasks) {
      const o = overlap(scenarioKw, keywords(t.task));
      if (o.jaccard >= 0.35) offenders.push({ part: part.key, scenario: true, taskKey: t.taskKey, shared: o.shared });
    }
  }
  assert.deepEqual(offenders, [], `Schreiben scenarios overlap the live bank:\n${JSON.stringify(offenders, null, 2)}`);
});

test('that meaning check actually fires on the round-3 Sportverein wording', async () => {
  const tasks = await liveTasks();
  const isDistinctive = distinctiveness(tasks);
  // Verbatim it matches nothing in the bank — which is why round 3 passed.
  const round3 =
    'Sie möchten im Sportverein einen Kurs machen. Schreiben Sie eine E-Mail (30 bis 60 Wörter) an den ' +
    'Verein. Nennen Sie diese drei Punkte: Welchen Kurs möchten Sie machen? Wann haben Sie Zeit? ' +
    'Fragen Sie nach dem Preis.';
  const live = readFileSync(join(root, 'src/data/writingTasks.js'), 'utf8');
  for (const sentence of sentences(round3)) {
    assert.ok(!live.includes(sentence), 'the round-3 wording was verbatim-clean — that is the blind spot');
  }
  // By meaning it is not clean: at least one Leitpunkt collides.
  const leit = sentences(round3.split('drei Punkte:')[1]);
  const hits = [];
  for (const mine of leit) {
    for (const t of tasks) {
      for (const theirs of t.leitpunkte) {
        const o = overlap(keywords(mine), keywords(theirs));
        if (o.n >= 2 || (o.n === 1 && o.jaccard >= 0.5 && isDistinctive(o.shared[0]))) {
          hits.push({ mine, theirs, taskKey: t.taskKey, shared: o.shared });
        }
      }
    }
  }
  assert.ok(hits.length > 0, 'the keyword check must catch what the verbatim check missed');
  assert.ok(
    hits.some((h) => h.taskKey === 'mitteilung-info-sprachkurs'),
    `expected the collision with mitteilung-info-sprachkurs, got ${JSON.stringify(hits)}`
  );
});

test('l3-3s weakest distractor is a time, not a room number', () => {
  const l33 = mock.sections
    .find((s) => s.key === 'lesen')
    .parts.find((p) => p.key === 'lesen-3')
    .items.find((i) => i.id === 'l3-3');
  for (const o of l33.options) assert.match(o.label, /^Um \d{1,2} Uhr\.$/, `${o.key}: every option must be a time`);
  assert.ok(!l33.options.some((o) => /Um 12 Uhr/.test(o.label)), '12 anchored only to "Raum 12" — a category error, not a choice');
});
