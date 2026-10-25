// The placement test's question bank (src/data/levelTestQuestions.json) is
// content: every item must have exactly one correct option, and the key must not
// give itself away by where it sits.
//
// What this closes (review 2026-10-25, C-163/C-164). One item was keyed to an
// answer its own stem rules out (B2-011: neuter „Das _____" keyed to feminine
// „Durchführung"), seven offered a second correct answer (a present-passive slot
// that also took „wurde", an imperative that also took the ihr form, „von"/„bei"
// both fitting a dative slot, „senden" beside „zusenden", „Bemühung" beside
// „Bemühungen"), one stem was a calque („Es hat 100 Jahre"), and the stored keys
// sat at A/B/C/D 20/39/18/3 — 12 of the 20 B2 items on B.
//
// A machine cannot judge German, so each CLASS of defect found in review is
// closed by a rule a machine can check, and every rule runs over every item: a
// new item is held to them too. Each rule also proves it is not vacuous by
// counting the items it judged.
//   1. shape — four distinct options, one key, gaps match option parts, and the
//      explanation names the key;
//   2. a noun slot after a determiner offers exactly one noun form that agrees
//      with it (gender, number, case);
//   3. a werden-passive slot offers the present and the Präteritum form of the
//      same person only when the stem carries a tense cue;
//   4. an imperative names who is addressed;
//   5. an item that tests the case a preposition takes is decidable by case;
//   6. a separable verb's bare base verb is never a distractor (it fits the
//      same frame);
//   7. no calques in stems (age with „haben");
//   8. the stored key is balanced across the four positions in every band and
//      sub-level. What a learner sees is shuffled per draw on top of this
//      (tests/placement-draw.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BANK = JSON.parse(readFileSync(join(ROOT, 'src/data/levelTestQuestions.json'), 'utf8')).questions;

const GAP = /_{3,}/g;
const gapCount = (q) => (q.question.match(GAP) || []).length;
const parts = (option) => option.split(' / ').map((p) => p.trim());
const key = (q) => q.options[q.correctIndex];
const distractors = (q) => q.options.filter((_, i) => i !== q.correctIndex);
/** The word right before / after the first gap ('' when the gap opens or ends the stem). */
const wordBeforeGap = (q) => (q.question.split(GAP)[0].match(/([A-Za-zÄÖÜäöüß]+)\s*$/) || [])[1] || '';
const wordAfterGap = (q) => (q.question.split(GAP)[1] || '').match(/^\s*([A-Za-zÄÖÜäöüß]+)/)?.[1] || '';

// ── determiners and noun forms: slot = gender.case (m, f, n, pl × nom, acc, dat, gen) ──
const DEFINITE = {
  der: ['m.nom', 'f.gen', 'f.dat', 'pl.gen'],
  die: ['f.nom', 'f.acc', 'pl.nom', 'pl.acc'],
  das: ['n.nom', 'n.acc'],
  des: ['m.gen', 'n.gen'],
  dem: ['m.dat', 'n.dat'],
  den: ['m.acc', 'pl.dat'],
};
const EIN_ENDINGS = {
  '': ['m.nom', 'n.nom', 'n.acc'],
  e: ['f.nom', 'f.acc', 'pl.nom', 'pl.acc'],
  er: ['f.gen', 'f.dat', 'pl.gen'],
  es: ['m.gen', 'n.gen'],
  em: ['m.dat', 'n.dat'],
  en: ['m.acc', 'pl.dat'],
};
const EIN_STEMS = ['kein', 'mein', 'dein', 'sein', 'ihr', 'unser', 'ein'];

function determinerSlots(word) {
  const w = String(word).toLowerCase();
  if (DEFINITE[w]) return DEFINITE[w];
  for (const stem of EIN_STEMS) {
    if (!w.startsWith(stem) || !(w.slice(stem.length) in EIN_ENDINGS)) continue;
    const slots = EIN_ENDINGS[w.slice(stem.length)];
    // „ein" has no plural; kein and the possessives do.
    return stem === 'ein' ? slots.filter((s) => !s.startsWith('pl.')) : slots;
  }
  return null;
}

/** Slots a single capitalised noun form can fill, from its suffix; null when the form does not say. */
function nounSlots(option) {
  if (!/^[A-ZÄÖÜ][a-zäöüß]+$/.test(option)) return null;
  const all = (g) => ['nom', 'acc', 'dat', 'gen'].map((c) => `${g}.${c}`);
  if (/(ungen|heiten|keiten|schaften|ionen|täten)$/.test(option)) return all('pl');
  if (/(ung|heit|keit|schaft|ion|tät)$/.test(option)) return all('f');
  if (/ens$/.test(option)) return ['n.gen']; // a nominalised infinitive, genitive: des Bemühens
  if (/en$/.test(option)) return ['n.nom', 'n.acc', 'n.dat']; // a nominalised infinitive: das Durchführen
  return null;
}

const PREPOSITION_CASES = {
  für: ['acc'], durch: ['acc'], gegen: ['acc'], ohne: ['acc'], um: ['acc'], bis: ['acc'],
  aus: ['dat'], bei: ['dat'], mit: ['dat'], nach: ['dat'], seit: ['dat'], von: ['dat'], zu: ['dat'],
  gegenüber: ['dat'], ab: ['dat'], außer: ['dat'],
  an: ['acc', 'dat'], auf: ['acc', 'dat'], hinter: ['acc', 'dat'], in: ['acc', 'dat'], neben: ['acc', 'dat'],
  über: ['acc', 'dat'], unter: ['acc', 'dat'], vor: ['acc', 'dat'], zwischen: ['acc', 'dat'],
  wegen: ['gen'], trotz: ['gen'], während: ['gen'], statt: ['gen'], anstatt: ['gen'], aufgrund: ['gen'],
  infolge: ['gen'], innerhalb: ['gen'], außerhalb: ['gen'],
};

// Present / Präteritum forms of werden, per person.
const WERDEN_PAIRS = [['werde', 'wurde'], ['wirst', 'wurdest'], ['wird', 'wurde'], ['werden', 'wurden'], ['werdet', 'wurdet']];
// A word that fixes the tense (past, present or future), or a passive frame that does
// (… gelöst worden: Perfekt; … gebaut werden: future / modal).
const TENSE_CUE = /\b(gestern|vorgestern|letzte[nmrs]?|vorige[nmrs]?|früher|damals|morgen|übermorgen|nächste[nmrs]?|bald|jetzt|momentan|zurzeit|heutzutage)\b|\bim Moment\b|\b(worden|werden)\s*[.!?]?\s*$/i;

const SEPARABLE_PREFIXES = ['ab', 'an', 'auf', 'aus', 'bei', 'ein', 'fest', 'fort', 'her', 'hin', 'los', 'mit', 'nach', 'vor', 'weg', 'weiter', 'zu', 'zurück', 'zusammen'];

// ── 1. shape ────────────────────────────────────────────────────────────────

test('every item has four distinct options and exactly one key in range', () => {
  const failures = [];
  const ids = new Set();
  for (const q of BANK) {
    if (ids.has(q.id)) failures.push(`${q.id}: duplicate id`);
    ids.add(q.id);
    if (!Array.isArray(q.options) || q.options.length !== 4) { failures.push(`${q.id}: needs exactly four options`); continue; }
    if (q.options.some((o) => typeof o !== 'string' || !o.trim())) failures.push(`${q.id}: an empty option`);
    const normalised = q.options.map((o) => String(o).trim().replace(/\s+/g, ' '));
    if (new Set(normalised).size !== normalised.length) failures.push(`${q.id}: two options read the same`);
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) failures.push(`${q.id}: correctIndex ${q.correctIndex} is not an option`);
  }
  assert.equal(BANK.length, 80);
  assert.deepEqual(failures, [], failures.join('\n'));
});

test('gap items: every option fills every gap; reading items carry their passage', () => {
  const failures = [];
  for (const q of BANK) {
    if (q.type === 'reading') {
      if (!q.passage || gapCount(q) !== 0) failures.push(`${q.id}: a reading item asks about its passage, without a gap`);
      continue;
    }
    const gaps = gapCount(q);
    if (gaps === 0) failures.push(`${q.id}: no gap to fill`);
    for (const option of q.options) {
      if (parts(option).length !== gaps) failures.push(`${q.id}: "${option}" fills ${parts(option).length} of ${gaps} gaps`);
    }
  }
  assert.deepEqual(failures, [], failures.join('\n'));
});

test('the explanation names the key it explains (a wrong key cannot hide behind a right explanation)', () => {
  const failures = [];
  for (const q of BANK.filter((item) => item.type !== 'reading')) {
    const explanation = q.explanation.toLowerCase();
    for (const part of parts(key(q)).filter((p) => p !== '-')) {
      if (!explanation.includes(part.toLowerCase())) failures.push(`${q.id}: the explanation never names "${part}"`);
    }
  }
  assert.deepEqual(failures, [], failures.join('\n'));
});

// ── 2. noun slots ───────────────────────────────────────────────────────────

test('a noun slot after a determiner offers exactly one noun form that agrees with it — the key', () => {
  const failures = [];
  let judged = 0;
  for (const q of BANK) {
    const slots = determinerSlots(wordBeforeGap(q));
    if (!slots) continue;
    const nouns = q.options.filter((o) => nounSlots(o));
    if (nouns.length < 2) continue;
    judged += 1;
    const agreeing = q.options.filter((o) => nounSlots(o)?.some((s) => slots.includes(s)));
    if (agreeing.length !== 1 || agreeing[0] !== key(q)) {
      failures.push(`${q.id}: „${wordBeforeGap(q)} _____" agrees with [${agreeing.join(', ')}], key is "${key(q)}"`);
    }
  }
  assert.ok(judged >= 3, `the nominalisation items were not judged (${judged})`);
  assert.deepEqual(failures, [], failures.join('\n'));
});

test('the noun-slot rule reads gender, number and case the way German does', () => {
  // The defect it was written for, and its fix.
  assert.ok(!nounSlots('Durchführung').some((s) => determinerSlots('Das').includes(s)), 'das Durchführung is wrong');
  assert.ok(nounSlots('Durchführen').some((s) => determinerSlots('Das').includes(s)), 'das Durchführen is a noun');
  assert.ok(nounSlots('Durchführung').some((s) => determinerSlots('Die').includes(s)));
  assert.ok(nounSlots('Bemühung').some((s) => determinerSlots('seiner').includes(s)), 'trotz seiner Bemühung is grammatical');
  assert.ok(nounSlots('Bemühungen').some((s) => determinerSlots('seiner').includes(s)));
  assert.ok(!nounSlots('Bemühens').some((s) => determinerSlots('seiner').includes(s)), 'des Bemühens takes seines');
  assert.ok(nounSlots('Bemühens').some((s) => determinerSlots('seines').includes(s)));
  assert.equal(nounSlots('durchgeführt'), null, 'a participle is not a noun form');
  assert.equal(determinerSlots('viel'), null);
  assert.deepEqual(determinerSlots('eine'), ['f.nom', 'f.acc'], '„ein" has no plural');
});

// ── 3. werden-passive slots ─────────────────────────────────────────────────

test('a passive slot offers present and Präteritum werden of one person only with a tense cue', () => {
  const failures = [];
  let judged = 0;
  for (const q of BANK.filter((item) => /passive/.test(item.topic))) {
    judged += 1;
    const offered = new Set(q.options.map((o) => o.toLowerCase()));
    const both = WERDEN_PAIRS.filter(([now, then]) => offered.has(now) && offered.has(then));
    if (both.length && !TENSE_CUE.test(q.question)) {
      failures.push(`${q.id}: „${q.question}" takes both ${both.map((p) => p.join('/')).join(', ')} — add a tense cue or make one form disagree with the subject`);
    }
  }
  assert.ok(judged >= 5, `the passive items were not judged (${judged})`);
  assert.deepEqual(failures, [], failures.join('\n'));
});

test('the tense cues fix the tense; „gerade" does not (wurde gerade repariert = was just repaired)', () => {
  for (const s of ['Das Gebäude _____ letztes Jahr renoviert.', 'Die Brücke _____ nächstes Jahr gebaut werden.', 'Das Problem _____ bereits gelöst worden.', 'Das Auto _____ im Moment repariert.']) {
    assert.ok(TENSE_CUE.test(s), s);
  }
  for (const s of ['Das Auto _____ gerade repariert.', 'In Deutschland _____ viel Bier getrunken.', 'Die E-Mails _____ jeden Tag gelesen.']) {
    assert.ok(!TENSE_CUE.test(s), s);
  }
});

// ── 4. imperatives ──────────────────────────────────────────────────────────

test('an imperative names who is addressed (du, ihr and Sie all take an imperative)', () => {
  const failures = [];
  let judged = 0;
  for (const q of BANK.filter((item) => /!\s*$/.test(item.question))) {
    judged += 1;
    const cue = /^[A-ZÄÖÜ][a-zäöüß]+,\s/.test(q.question) || /\((du|ihr|Sie)\)/.test(q.question) || /\bSie\b/.test(q.question);
    if (!cue) failures.push(`${q.id}: „${q.question}" — name the person (Lena, …) or mark (du)/(ihr)/(Sie)`);
  }
  assert.ok(judged >= 1, 'no imperative item was judged');
  assert.deepEqual(failures, [], failures.join('\n'));
});

// ── 5. case prepositions ────────────────────────────────────────────────────

test('an item that tests the case a preposition takes is decidable by case alone', () => {
  const failures = [];
  let judged = 0;
  for (const q of BANK.filter((item) => /(dative|accusative|genitive)/.test(item.topic))) {
    if (!q.options.every((o) => PREPOSITION_CASES[o.toLowerCase()])) continue;
    judged += 1;
    const slots = determinerSlots(wordAfterGap(q));
    if (!slots) { failures.push(`${q.id}: no case-marked determiner after the gap`); continue; }
    const cases = new Set(slots.map((s) => s.split('.')[1]));
    const governing = q.options.filter((o) => PREPOSITION_CASES[o.toLowerCase()].some((c) => cases.has(c)));
    if (governing.length !== 1 || governing[0] !== key(q)) {
      failures.push(`${q.id}: „_____ ${wordAfterGap(q)}" is governed by [${governing.join(', ')}], key is "${key(q)}"`);
    }
  }
  assert.ok(judged >= 2, `the preposition items were not judged (${judged})`);
  assert.deepEqual(failures, [], failures.join('\n'));
});

// ── 6. separable verbs ──────────────────────────────────────────────────────

test("a separable verb's bare base verb is never a distractor", () => {
  const failures = [];
  let judged = 0;
  for (const q of BANK) {
    const k = key(q).toLowerCase();
    if (/[\s/]/.test(k)) continue;
    const prefix = SEPARABLE_PREFIXES.find((p) => k.startsWith(p) && k.length - p.length >= 4);
    if (!prefix) continue;
    judged += 1;
    for (const d of distractors(q)) {
      if (d.toLowerCase() === k.slice(prefix.length)) failures.push(`${q.id}: "${d}" fits the same frame as "${key(q)}"`);
    }
  }
  assert.ok(judged >= 2, `no separable-verb key was judged (${judged})`);
  assert.deepEqual(failures, [], failures.join('\n'));
});

// ── 7. calques ──────────────────────────────────────────────────────────────

test('no stem gives an age with „haben" (German: … ist 100 Jahre alt)', () => {
  const AGE_WITH_HABEN = /\b(habe|hast|hat|haben|habt)\s+(\d+|_{3,})\s+Jahre\b(?!\s+alt\b)/;
  assert.ok(AGE_WITH_HABEN.test('Das Haus ist alt. Es hat 100 Jahre.'), 'the pattern finds the calque it was written for');
  const failures = BANK.filter((q) => AGE_WITH_HABEN.test(q.question)).map((q) => `${q.id}: „${q.question}"`);
  assert.deepEqual(failures, [], failures.join('\n'));
});

// ── 8. the stored key ───────────────────────────────────────────────────────

test('the stored key is balanced across A–D in every band and every sub-level', () => {
  const failures = [];
  const groups = new Map();
  for (const q of BANK) {
    for (const g of [`band ${q.level}`, `sub-level ${q.sublevel}`, 'bank']) {
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(q.correctIndex);
    }
  }
  for (const [name, keys] of groups) {
    const counts = [0, 1, 2, 3].map((i) => keys.filter((k) => k === i).length);
    const lo = Math.floor(keys.length / 4);
    const hi = Math.ceil(keys.length / 4);
    if (counts.some((c) => c < lo || c > hi)) failures.push(`${name}: A/B/C/D hold ${counts.join('/')} of ${keys.length} keys`);
  }
  assert.equal(groups.size, 4 + 8 + 1);
  assert.deepEqual(failures, [], failures.join('\n'));
});
