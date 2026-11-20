import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { curriculumPath } from '../src/data/curricula/index.js';
import { RESULT } from '../src/lib/lesson/check.js';
import { alignTranscript } from '../src/lib/lesson/readaloud.js';
import { buildLesson } from '../src/lib/lesson/buildLesson.js';
import { STRINGS as T } from '../src/lib/lesson/strings.js';
import { canDoShown, checkTurns, chosenWord, courseLexicon, modelAnswer, nextAfter, partsToRepeat, spokenShown, spokenTarget, typedResult, writtenOnly } from '../src/lib/lesson/finalCheck.js';
import { guidedCheckVocabulary } from '../scripts/validate-curriculum.mjs';

const withCheck = CURRICULUM_A11.lektionen.filter((l) => l.guided?.check);
const [l1, l2, l3] = CURRICULUM_A11.lektionen;
const retakes = (check) => Math.max(1, ...check.turns.map((t) => t.variants?.length || t.spell?.length || 1));
// A sitting as the player builds it: the check carries the level's lexicon (buildGuided).
const lexicon = courseLexicon(CURRICULUM_A11);
const sitting = (l, r = 0) => checkTurns({ ...l.guided.check, lexicon }, r);

test('every final check covers each can-do and names a part to repeat for it', () => {
  assert.ok(withCheck.includes(l1));
  for (const l of withCheck) {
    const { turns, repeat } = l.guided.check;
    l.canDo.forEach((_, i) => {
      assert.ok(turns.some((t) => t.canDo === i), `${l.id} can-do ${i + 1} has no turn`);
      const parts = [].concat(repeat[i] || []);
      assert.ok(parts.length && parts.every((p) => p.en && p.de), `${l.id} can-do ${i + 1} has no part to repeat`);
    });
    for (let r = 0; r < retakes(l.guided.check); r += 1) {
      assert.ok(sitting(l, r).every((t) => t.taskEn && t.taskDe && t.accepted?.length && typeof t.accepted[0] === 'string'), `${l.id} retake ${r}`);
    }
  }
  const stage = buildLesson({ curriculum: CURRICULUM_A11, lektion: l2, pool: [] }).stages.find((s) => s.kind === 'check');
  assert.equal(typeof stage.check.lexicon.has, 'function', 'the player hands the check the level’s words');
});

test('each check names its own partner, opening and passed line, with no Lektion 1 wording left in the stage', () => {
  for (const l of withCheck) {
    const { partner, open, passed } = l.guided.check;
    assert.ok(l.dialog.lines.some((line) => line.speaker === partner), `${l.id}: the partner speaks in the scene`);
    for (const line of [open, passed]) {
      for (const lang of ['en', 'de']) assert.ok(line?.[lang]?.trim() && !/TODO/.test(line[lang]), `${l.id} ${lang}`);
    }
  }
  const stage = readFileSync('src/components/lesson/CheckStage.jsx', 'utf8');
  assert.doesNotMatch(stage, /Frau Kaya/);
  assert.match(stage, /\{partner\}/);
  for (const lang of ['en', 'de']) {
    assert.equal(T[lang]['otter.check.open'], undefined, 'the opening belongs to each Lektion');
    assert.equal(T[lang]['otter.check.passed'], undefined, '“all four skills” was true of Lektion 1 only');
    assert.doesNotMatch(T[lang]['otter.check.notYet'], /Lektion \{next\}/, 'the next step is named, never computed as nr + 1');
  }
});

test('Lektion 1 keeps its partner and its two otter lines word for word', () => {
  const { partner, open, passed } = l1.guided.check;
  assert.equal(partner, 'Frau Kaya');
  assert.equal(open.en, 'This time, you’ll speak with Frau Kaya using your own name. Take your time.');
  assert.equal(open.de, 'Diesmal sprechen Sie mit Frau Kaya unter Ihrem eigenen Namen. Nehmen Sie sich Zeit.');
  assert.equal(passed.en, 'You’ve used all four skills in this conversation. That’s something to be proud of.');
  assert.equal(passed.de, 'Sie haben in diesem Gespräch alle vier Fähigkeiten gezeigt. Darauf können Sie stolz sein.');
});

test('the closing line names what really comes next on the course path, so Lektion 12 never points to a Lektion 13', () => {
  const path = curriculumPath(CURRICULUM_A11);
  for (const l of CURRICULUM_A11.lektionen) {
    const after = path[path.findIndex((p) => p.kind === 'lektion' && p.nr === l.nr) + 1];
    const next = nextAfter(CURRICULUM_A11, l);
    assert.equal(next.kind, after.kind === 'leveltest' ? 'test' : after.kind, `Lektion ${l.nr}`);
    if (next.nr !== undefined) assert.equal(next.nr, after.nr, `Lektion ${l.nr}`);
    assert.ok(T.en[`check.next.${next.kind}`] && T.de[`check.next.${next.kind}`]);
  }
  assert.deepEqual(nextAfter(CURRICULUM_A11, l1), { kind: 'lektion', nr: 2 });
  assert.deepEqual(nextAfter(CURRICULUM_A11, l3), { kind: 'checkpoint', nr: 1 });
  assert.deepEqual(nextAfter(CURRICULUM_A11, CURRICULUM_A11.lektionen[11]), { kind: 'checkpoint', nr: 4 });
  assert.ok(T.en['otter.check.notYet'].replace('{next}', T.en['check.next.lektion'].replace('{nr}', 2)).endsWith('go on to Lektion 2.'), 'Lektion 1 reads as before');
  assert.ok(T.de['otter.check.notYet'].replace('{next}', T.de['check.next.lektion'].replace('{nr}', 2)).endsWith('oder mit Lektion 2 weitermachen.'));
  const stage = buildLesson({ curriculum: CURRICULUM_A11, lektion: l3, pool: [] }).stages.find((s) => s.kind === 'check');
  assert.deepEqual(stage.next, { kind: 'checkpoint', nr: 1 });
});

test('a retake spells a different name, with its letters in words as well as sound', () => {
  const [a, b] = [0, 1].map((r) => checkTurns(l1.guided.check, r).find((t) => t.spell));
  assert.notEqual(a.accepted[0], b.accepted[0]);
  assert.equal(a.spoken, 'V-O-G-E-L.');
  assert.equal(a.letterNames, 'Vau – O – Ge – E – El');
});

test('a retake is not the same paper: every turn with variants changes, and Lektion 1 is as it was', () => {
  for (const l of withCheck) {
    l.guided.check.turns.forEach((turn, i) => {
      if (!turn.variants) return;
      const [a, b] = [0, 1].map((r) => checkTurns(l.guided.check, r)[i]);
      assert.notDeepEqual(a, b, `${l.id} turn ${i + 1}`);
    });
  }
  assert.ok(l1.guided.check.turns.every((t) => !t.variants));
  assert.deepEqual(checkTurns(l1.guided.check, 0).filter((t) => !t.spell), l1.guided.check.turns.filter((t) => !t.spell));
  const [first, second] = [0, 1].map((r) => checkTurns(l2.guided.check, r).find((t) => t.listen));
  assert.equal(first.accepted[0], '0421 3618');
  assert.notEqual(first.accepted[0], second.accepted[0]);
  // Lektion 3: the person in the photo and every pronoun after it change together (sie, then er).
  const [she, he] = [0, 1].map((r) => checkTurns(l3.guided.check, r));
  assert.match(she[1].cue.de, /^Ist sie /);
  assert.match(he[1].cue.de, /^Ist er /);
});

test('typed answers: letters decide the spelling, an own name needs an opening, a case slip is a typo', () => {
  const turns = checkTurns(l1.guided.check, 0);
  const [greet, name, spell, answer, ask] = turns;
  assert.equal(typedResult(spell, 'vogel'), RESULT.CORRECT);
  assert.equal(typedResult(spell, 'V-O-G-E-L'), RESULT.CORRECT);
  assert.equal(typedResult(spell, 'Fogel'), RESULT.WRONG);
  assert.equal(typedResult(name, 'Ich heisse Zaid'), RESULT.CORRECT);
  assert.equal(typedResult(name, 'Mein Name ist Lea.'), RESULT.CORRECT);
  assert.equal(typedResult(name, 'Ich bin'), RESULT.WRONG);
  assert.equal(typedResult(greet, 'guten tag'), RESULT.TYPO);
  assert.equal(typedResult(answer, 'Mir geht es gut, danke'), RESULT.CORRECT);
  assert.equal(typedResult(ask, 'Wie geht es dir?'), RESULT.WRONG);
  assert.equal(modelAnswer(name), 'Ich heiße …');
});

test('own answers: the learner fills the gap, the words around it are graded like every answer in the course', () => {
  const [origin, home, job, ask, phone, number] = sitting(l2);
  assert.equal(typedResult(origin, 'Ich komme aus Syrien.'), RESULT.CORRECT);
  assert.equal(typedResult(origin, 'Ich komme aus dem Irak.'), RESULT.CORRECT);
  assert.equal(typedResult(origin, 'Ich kome aus Syrien'), RESULT.TYPO, 'a slip in the frame is a typo, as anywhere');
  assert.equal(typedResult(origin, 'Ich kommen aus Syrien.'), RESULT.WRONG, 'an ending is never a typo');
  assert.equal(typedResult(origin, 'Ich komme aus'), RESULT.WRONG, 'the gap needs the learner’s own words');
  assert.equal(typedResult(home, 'Ich wohne Bremen.'), RESULT.WRONG);
  assert.equal(typedResult(home, 'Mein Wohnort ist Hamburg.'), RESULT.CORRECT);
  assert.equal(typedResult(home, 'Ich wohne in und.'), RESULT.WRONG, 'a gap of small words names no place');
  assert.equal(typedResult(job, 'Ich bin Krankenpfleger.'), RESULT.CORRECT, 'a job the course never teaches is the learner’s own');
  assert.equal(typedResult(job, 'Ich bin Kellner.'), RESULT.CORRECT, 'a job a later Lektion teaches');
  assert.equal(typedResult(job, 'Ich bin eine Studentin.'), RESULT.CORRECT, 'German, though the course teaches it without an article');
  assert.equal(typedResult(job, 'Ich bin Student in Bremen.'), RESULT.CORRECT);
  assert.equal(typedResult(job, 'Ich bin eine Lehrer.'), RESULT.WRONG, 'the article agrees with a job the course teaches');
  for (const notAJob of ['Ich bin ledig.', 'Ich bin müde.', 'Ich bin arbeiten.', 'Ich bin aus Syrien.', 'Ich bin Lehrer Bremen.']) assert.equal(typedResult(job, notAJob), RESULT.WRONG, notAJob);
  assert.equal(typedResult(origin, 'Ich komme aus in Bremen.'), RESULT.WRONG);
  assert.equal(typedResult(origin, 'Ich komme aus der Türkei.'), RESULT.CORRECT);
  assert.equal(typedResult(origin, 'Ich komme aus die Deutschland.'), RESULT.WRONG, 'a place after „aus" takes the dative');
  assert.equal(typedResult(home, 'Ich wohne in der Bremen.'), RESULT.WRONG, 'a place the course names has no article');
  assert.equal(typedResult(job, 'Ich bin Lehrer Student.'), RESULT.WRONG, 'one job');
  assert.equal(typedResult(origin, 'Ich komme aus Marokko und wohne in Bremen.'), RESULT.CORRECT, 'the scene’s own line');
  assert.equal(typedResult(home, 'ich wohne in essen'), RESULT.TYPO, 'Essen is a city, and the small „ich" a case slip');
  assert.equal(typedResult(ask, 'Und was sind Sie von Beruf?'), RESULT.CORRECT, 'a reply may open with „Und"');
  assert.equal(typedResult(ask, 'Sind Sie Lehrer?'), RESULT.CORRECT);
  assert.equal(typedResult(ask, 'Was bist du von Beruf?'), RESULT.WRONG, 'Sie at the counter');
  assert.equal(typedResult(ask, 'Herr Weber, welchen Beruf haben Sie?'), RESULT.CORRECT, 'a reply may name the person it is said to');
  assert.equal(typedResult(number, 'Telefonnummer: 0421 3618'), RESULT.CORRECT, 'a label before the right number');
  assert.equal(typedResult(phone, 'Meine Telefonnummer ist null eins sieben sechs.'), RESULT.CORRECT);
  assert.equal(typedResult(phone, 'Meine Telefonnummer ist ٠١٧٦ ٢٣٤٥٦٧'), RESULT.CORRECT, 'Arabic-Indic digits are digits');
  assert.equal(typedResult(phone, 'Meine Telefonnummer ist Bremen.'), RESULT.WRONG);
  assert.equal(typedResult(number, '0421-3618'), RESULT.CORRECT);
  assert.equal(typedResult(number, '٠٤٢١٣٦١٨'), RESULT.CORRECT);
  assert.equal(typedResult(number, '0421 3619'), RESULT.WRONG);
  assert.equal(modelAnswer(origin), 'Ich komme aus Marokko.', 'after a miss, a complete example');
  const [photo, age, origin3, languages, own, askLena] = sitting(l3);
  assert.equal(typedResult(photo, 'Das ist meine Mutter.'), RESULT.CORRECT);
  assert.equal(typedResult(photo, 'Sie ist meine Schwester.'), RESULT.CORRECT);
  assert.equal(typedResult(photo, 'Das ist meine Muter.'), RESULT.TYPO, 'one slip in the chosen word');
  assert.equal(typedResult(photo, 'Das ist meine Schwestern.'), RESULT.WRONG, 'a plural is a form, not a slip');
  assert.equal(typedResult(photo, 'Das ist mein Mutter.'), RESULT.WRONG);
  assert.equal(typedResult(photo, 'Das ist meine Bruder.'), RESULT.WRONG, 'a choice gap takes only its choices');
  assert.equal(typedResult(photo, 'Das ist meine Mutter Fatima.'), RESULT.CORRECT, 'a name may follow the choice');
  assert.equal(typedResult(photo, 'Das ist meine Mutter sind.'), RESULT.WRONG, 'nothing else may');
  assert.equal(typedResult(age, 'Sie ist noch jung.'), RESULT.CORRECT);
  assert.equal(typedResult(age, 'Meine Mutter ist 45 Jahre alt.'), RESULT.CORRECT, 'the family noun may stand for the pronoun');
  assert.equal(typedResult(age, 'Er ist alt.'), RESULT.WRONG, 'the pronoun follows the noun');
  assert.equal(typedResult(age, 'Sie hat fünfzig Jahre.'), RESULT.WRONG);
  assert.equal(typedResult(origin3, 'Meine Mutter kommt aus Syrien.'), RESULT.CORRECT);
  assert.equal(typedResult(origin3, 'Meine Mutter kommen aus Syrien.'), RESULT.WRONG);
  assert.equal(typedResult(languages, 'Sie spricht Kurdisch und Arabisch.'), RESULT.CORRECT);
  assert.equal(typedResult(languages, 'Sie sprecht Arabisch.'), RESULT.WRONG);
  assert.equal(typedResult(languages, 'Sie spricht Brot.'), RESULT.WRONG, 'a course word that is no language');
  assert.equal(typedResult(languages, 'Sie spricht gut Deutsch.'), RESULT.CORRECT);
  assert.equal(typedResult(own, 'Ich spreche Deutsch und Marokko.'), RESULT.WRONG, 'every language listed is a language');
  assert.equal(typedResult(own, 'Ich spreche kein Deutsch.'), RESULT.WRONG, 'at least one language is spoken');
  assert.equal(typedResult(own, 'Ich spreche Arabisch und kein Englisch.'), RESULT.CORRECT);
  assert.equal(typedResult(age, 'Sie ist ein Jahr alt.'), RESULT.CORRECT);
  assert.equal(typedResult(age, 'Sie ist 1 Jahre alt.'), RESULT.WRONG, '„Jahre alt" is two or more');
  assert.equal(typedResult(own, 'Ich spreche Arabisch und ein bisschen Deutsch.'), RESULT.CORRECT);
  assert.equal(typedResult(own, 'Ich spricht Arabisch.'), RESULT.WRONG);
  assert.equal(typedResult(askLena, 'Und woher kommen deine Eltern?'), RESULT.CORRECT);
  assert.equal(typedResult(askLena, 'Woher sind deine Eltern?'), RESULT.CORRECT);
  assert.equal(typedResult(askLena, 'Woher kommen Ihre Eltern?'), RESULT.WRONG, 'Lena is a fellow learner: du');
});

test('a short message: each part in a sentence of its own, any order, with an optional greeting and a real date', () => {
  const message = sitting(l2)[6];
  assert.ok(message.parts && writtenOnly(message));
  assert.equal(typedResult(message, 'Ich heiße Zaid. Ich bin am 3.5.1998 geboren.'), RESULT.CORRECT);
  assert.equal(typedResult(message, 'Guten Tag, ich heiße Zaid Ahmad. Am 12.8.1990 bin ich geboren. Viele Grüße, Zaid'), RESULT.CORRECT);
  assert.equal(typedResult(message, 'Mein Geburtsdatum ist der 7.2.2001. Mein Name ist Lea.'), RESULT.CORRECT);
  assert.equal(typedResult(message, 'Ich heiße Zaid, ich bin am 3.5.1990 geboren.'), RESULT.CORRECT);
  assert.equal(typedResult(message, 'Ich heiße Ali und bin am 3.5.1998 geboren.'), RESULT.CORRECT, 'two clauses joined by „und"');
  assert.equal(typedResult(message, 'Ich heiße Ali. Ich wohne in Bremen. Ich bin am 3.5.1998 geboren.'), RESULT.CORRECT, 'more true details may stand in it');
  assert.equal(typedResult(message, 'Ich heiße Ali. Ich bin 1998 geboren.'), RESULT.WRONG, 'the task asks for day, month and year');
  assert.equal(typedResult(message, 'Ich heiße Ana. Ich bin Marokkanerin. Ich bin am 3.5.1998 geboren.'), RESULT.CORRECT, 'the nationality the Lektion teaches');
  assert.equal(typedResult(message, 'Ich heiße Ali. Ich bin müde. Ich bin am 3.5.1998 geboren.'), RESULT.WRONG);
  assert.equal(typedResult(message, 'Ich bin am 3.5.1998 geboren.'), RESULT.WRONG, 'the name is missing');
  assert.equal(typedResult(message, 'Ich heiße Zaid. Ich bin am 1998 geboren.'), RESULT.WRONG, '„am" takes a day');
  assert.equal(typedResult(message, 'Ich heiße Zaid. Ich bin am 31.13.1998 geboren.'), RESULT.WRONG, 'no thirteenth month');
  assert.equal(typedResult(message, 'Ich heiße Zaid. Ich bin in Syrien geboren.'), RESULT.WRONG);
  assert.equal(modelAnswer(message), 'Guten Tag! Ich heiße Ana Chakiri. Ich bin am 3.5.1998 geboren.');
});

test('after the photo, the check talks about the person the learner chose, not the other one', () => {
  const [photo] = sitting(l3);
  assert.equal(chosenWord(photo, 'Das ist meine Schwester.'), 'Schwester');
  assert.equal(chosenWord(photo, 'Das ist mein Vater.'), null, 'a wrong answer chooses nobody');
  const after = checkTurns({ ...l3.guided.check, lexicon }, 0, { chosen: 'Schwester' });
  assert.equal(typedResult(after[2], 'Meine Schwester kommt aus Syrien.'), RESULT.CORRECT);
  assert.equal(typedResult(after[2], 'Meine Mutter kommt aus Syrien.'), RESULT.WRONG, 'that is someone else');
  assert.equal(typedResult(after[2], 'Sie kommt aus Syrien.'), RESULT.CORRECT);
  const stage = readFileSync('src/components/lesson/CheckStage.jsx', 'utf8');
  assert.match(stage, /checkTurns\(stage\.check, retake, \{ chosen \}\)/);
});

test('only a measured, recognised spoken try counts; "I said it" never does', () => {
  assert.equal(spokenShown({ pct: 1, attempts: 1 }), true);
  assert.equal(spokenShown({ pct: 0.5, attempts: 1 }), false);
  assert.equal(spokenShown({ pct: 1, attempts: 1, selfConfirmed: true }), false);
  assert.equal(spokenShown({ pct: null, attempts: 0, usedMic: false, selfConfirmed: true }), false);
});

test('a spoken answer is graded like a typed one: own words are no extra words, and a wrong answer never passes', () => {
  const name = checkTurns(l1.guided.check, 0)[1];
  const said = (text, turn) => ({ ...alignTranscript(spokenTarget(turn), text), attempts: 1, usedMic: true, transcript: text });
  assert.equal(said('Ich heiße Zaid', name).pct, 0.67, 'by the plain measure a name can never pass');
  assert.equal(spokenShown(said('Ich heiße Zaid', name), name), true);
  assert.equal(spokenShown(said('Ich heiße', name), name), false, 'an opening alone has no name');
  const [origin, , job, ask] = sitting(l2);
  assert.equal(spokenTarget(origin), 'Ich komme aus');
  assert.equal(spokenShown(said('Ich komme aus Syrien', origin), origin), true);
  assert.equal(spokenShown(said('Ich bin Lehrerin', job), job), true);
  assert.equal(spokenShown(said('Ich bin verheiratet', job), job), false, 'the DaF review’s case: no job, though „Ich bin" was heard');
  assert.equal(spokenShown(said('Was ist Ihr Beruf', ask), ask), true, 'another accepted answer counts, not only the first');
  assert.equal(said('Was Sie von Beruf', ask).pct, 0.8);
  assert.equal(spokenShown(said('Was Sie von Beruf', ask), ask), false, 'four of five words is no question: the transcript decides');
  const photo = sitting(l3)[0];
  assert.equal(spokenShown(said('Das ist meine Vater', photo), photo), false);
  const greet = checkTurns(l1.guided.check, 0)[0];
  assert.equal(spokenShown(said('Guten Tag', greet), greet), true, 'Lektion 1’s fixed answers count as they did');
  const { transcript: _t, ...noTranscript } = said('Ich heiße Zaid', name);
  assert.equal(spokenShown(noTranscript, name), true, 'without a transcript an own answer counts by its opening');
});

test('spelling, a heard number and a written message are written, never spoken', () => {
  for (const l of withCheck) {
    for (const t of sitting(l)) assert.equal(writtenOnly(t), Boolean(t.spell || t.listen || t.write || t.parts), `${l.id}`);
  }
  assert.deepEqual(sitting(l2).filter(writtenOnly).map((t) => (t.listen ? 'listen' : 'message')), ['listen', 'message']);
  const stage = readFileSync('src/components/lesson/CheckStage.jsx', 'utf8');
  assert.match(stage, /canSpeak && !writtenOnly\(turn\)/);
});

test('a can-do may send the learner to more than one part, and each part is named once', () => {
  const { repeat } = l3.guided.check;
  assert.deepEqual(partsToRepeat(repeat, [false, true, true, false], 'en'), ['Part 1: the scene', 'Part 2: er, sie, es']);
  assert.deepEqual(partsToRepeat(l1.guided.check.repeat, [true, true, false, true], 'de'), ['Teil 2: das Alphabet']);
});

test('a check speaks and models only German the learner has met (RULE 35), and the rule catches an untaught word', () => {
  assert.deepEqual(guidedCheckVocabulary(CURRICULUM_A11), []);
  const planted = structuredClone(CURRICULUM_A11);
  planted.lektionen[1].guided.check.turns[0].cue.de = 'Wie spät ist es?';
  assert.ok(guidedCheckVocabulary(planted).some((f) => f.startsWith('L2:') && f.includes('spät')));
});

test('a can-do is shown only when every one of its turns was shown', () => {
  const turns = checkTurns(l1.guided.check, 0);
  const all = turns.map(() => 'shown');
  assert.deepEqual(canDoShown(turns, all, 4), [true, true, true, true]);
  const farewellMissed = [...all.slice(0, -1), 'missed'];
  assert.deepEqual(canDoShown(turns, farewellMissed, 4), [false, true, true, true]);
});
