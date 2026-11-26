import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { requiresVerbFirst } from '../src/lib/lesson/taskMeaning.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { curriculumPath } from '../src/data/curricula/index.js';
import { RESULT, numberWordsToDigits } from '../src/lib/lesson/check.js';
import { alignTranscript } from '../src/lib/lesson/readaloud.js';
import { buildLesson } from '../src/lib/lesson/buildLesson.js';
import { STRINGS as T } from '../src/lib/lesson/strings.js';
import { BEYOND, untaughtIn, canDoShown, faultHintKey, checkTurns, chosenWord, courseLexicon, modelAnswer, nextAfter, optionalPieces, partsToRepeat, sequenceFault, spokenShown, spokenTarget, typedResult, verifiedResult, verifiedRule, writtenOnly, wrongReason } from '../src/lib/lesson/finalCheck.js';
import { guidedCheckVocabulary } from '../scripts/validate-curriculum.mjs';

const withCheck = CURRICULUM_A11.lektionen.filter((l) => l.guided?.check);
const [l1, l2, l3] = CURRICULUM_A11.lektionen;
const retakes = (check) => Math.max(1, ...check.turns.map((t) => t.variants?.length || t.spell?.length || 1));
// A sitting as the player builds it: the check carries the level's lexicon (buildGuided).
const lexicon = courseLexicon(CURRICULUM_A11);
const sitting = (l, r = 0) => checkTurns({ ...l.guided.check, lexicon }, r);
// A wrong answer is never verified: WRONG where its fault is certain, BEYOND where the check cannot be sure
// (`certainFault`, 2026-11-25: WRONG by the older fault rules also hit 22 % of 4,400 correct answers).
const refused = (turn, answer) => { const r = typedResult(turn, answer); return r === BEYOND ? RESULT.WRONG : r; };

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
      assert.ok(sitting(l, r).every((t) => t.taskEn && t.taskDe && t.accepted?.length && typeof (t.accepted[0]?.frame ?? t.accepted[0]) === 'string' && typeof modelAnswer(t) === 'string'), `${l.id} retake ${r}`);
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
  // Loop round 4 (Codex, 2026-11-26): the line no longer claims „all four skills“; it names what the learner did.
  assert.equal(passed.en, 'You’ve had a conversation in German and written down a spelled-out name. Well done!');
  assert.equal(passed.de, 'Sie haben ein Gespräch auf Deutsch geführt und einen buchstabierten Namen aufgeschrieben. Gut gemacht!');
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
  assert.ok(T.en['otter.check.notYet'].replace('{next}', T.en['check.next.lektion'].replace('{nr}', 2)).endsWith('go on to Lesson 2.'), 'Lektion 1 reads as before, in the English of the course (lesson)');
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
  assert.equal(first.accepted[0], '0421 3618001');
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
  for (const notAJob of ['Ich bin ledig.', 'Ich bin müde.', 'Ich bin arbeiten.', 'Ich bin aus Syrien.', 'Ich bin Lehrer Bremen.']) assert.equal(refused(job, notAJob), RESULT.WRONG, notAJob);
  assert.equal(refused(origin, 'Ich komme aus in Bremen.'), RESULT.WRONG);
  assert.equal(typedResult(origin, 'Ich komme aus der Türkei.'), RESULT.CORRECT);
  assert.equal(typedResult(origin, 'Ich komme aus die Deutschland.'), RESULT.WRONG, 'a place after „aus" takes the dative');
  assert.equal(typedResult(home, 'Ich wohne in der Bremen.'), RESULT.WRONG, 'a place the course names has no article');
  assert.equal(refused(job, 'Ich bin Lehrer Student.'), RESULT.WRONG, 'one job');
  assert.equal(typedResult(origin, 'Ich komme aus Marokko und wohne in Bremen.'), RESULT.CORRECT, 'the scene’s own line'); // 2026-11-25: every scene line passes its own question
  assert.equal(typedResult(home, 'ich wohne in essen'), RESULT.TYPO, 'Essen is a city, and the small „ich" a case slip');
  assert.equal(typedResult(ask, 'Und was sind Sie von Beruf?'), RESULT.CORRECT, 'a reply may open with „Und"'); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  assert.equal(typedResult(ask, 'Sind Sie Lehrer?'), RESULT.CORRECT);
  assert.equal(typedResult(ask, 'Was bist du von Beruf?'), RESULT.WRONG, 'Sie at the counter');
  assert.equal(typedResult(ask, 'Herr Weber, welchen Beruf haben Sie?'), RESULT.CORRECT, 'a reply may name the person it is said to');
  assert.equal(typedResult(number, 'Telefonnummer: 0421 3618001'), RESULT.CORRECT, 'a label before the right number');
  assert.equal(typedResult(phone, 'Meine Telefonnummer ist null eins sieben sechs.'), RESULT.CORRECT);
  assert.equal(typedResult(phone, 'Meine Telefonnummer ist ٠١٧٦ ٢٣٤٥٦٧'), RESULT.CORRECT, 'Arabic-Indic digits are digits');
  assert.equal(typedResult(phone, 'Meine Telefonnummer ist Bremen.'), RESULT.WRONG);
  assert.equal(typedResult(number, '0421-3618001'), RESULT.CORRECT);
  assert.equal(typedResult(number, '٠٤٢١٣٦١٨٠٠١'), RESULT.CORRECT);
  assert.equal(typedResult(number, '0421 3618002'), RESULT.WRONG);
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
  assert.equal(refused(languages, 'Sie sprecht Arabisch.'), RESULT.WRONG);
  assert.equal(typedResult(languages, 'Sie spricht Brot.'), RESULT.WRONG, 'a course word that is no language');
  assert.equal(typedResult(languages, 'Sie spricht gut Deutsch.'), RESULT.CORRECT);
  assert.equal(refused(own, 'Ich spreche Deutsch und Marokko.'), RESULT.WRONG, 'every language listed is a language');
  assert.equal(refused(own, 'Ich spreche kein Deutsch.'), RESULT.WRONG, 'at least one language is spoken');
  assert.equal(typedResult(own, 'Ich spreche Arabisch und kein Englisch.'), RESULT.CORRECT);
  assert.equal(typedResult(age, 'Sie ist ein Jahr alt.'), RESULT.CORRECT);
  assert.equal(typedResult(age, 'Sie ist 1 Jahre alt.'), RESULT.WRONG, '„Jahre alt" is two or more');
  assert.equal(typedResult(own, 'Ich spreche Arabisch und ein bisschen Deutsch.'), RESULT.CORRECT);
  assert.equal(typedResult(own, 'Ich spricht Arabisch.'), RESULT.WRONG);
  assert.equal(typedResult(askLena, 'Und woher kommen deine Eltern?'), RESULT.CORRECT); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
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
  assert.equal(refused(message, 'Ich heiße Ali. Ich bin müde. Ich bin am 3.5.1998 geboren.'), RESULT.WRONG);
  assert.equal(refused(message, 'Ich bin am 3.5.1998 geboren.'), RESULT.WRONG, 'the name is missing');
  assert.equal(typedResult(message, 'Ich heiße Zaid. Ich bin am 1998 geboren.'), RESULT.WRONG, '„am" takes a day');
  assert.equal(typedResult(message, 'Ich heiße Zaid. Ich bin am 31.13.1998 geboren.'), RESULT.WRONG, 'no thirteenth month');
  assert.equal(typedResult(message, 'Ich heiße Zaid. Ich bin in Syrien geboren.'), RESULT.WRONG);
  assert.equal(modelAnswer(message), 'Guten Tag! Ich heiße Ana Chakiri. Ich bin am 3.5.1998 geboren.');
});

test('the orchestrator’s spot-check (2026-11-19): correct German that was refused is right, and what was wrong stays wrong', () => {
  const [origin, home, job, , , number, message] = sitting(l2);
  const own = sitting(l3)[4];
  const born = (date) => typedResult(message, `Ich heiße Omar. Ich bin am ${date} geboren.`);
  // A real calendar date in the forms learners write it; never without its year.
  for (const date of ['12.03.1990', '12.3.1990', '12.03.90', '12/03/1990', '12-03-1990', '12. März 1990', '1. Januar 1990', '29.02.1992']) assert.equal(born(date), RESULT.CORRECT, date);
  for (const date of ['12.03.', '31.04.1990', '29.02.1991', '12/13/1990']) assert.equal(born(date), RESULT.WRONG, date);
  assert.equal(typedResult(message, 'Ich heiße Omar. Ich bin 1990 geboren.'), RESULT.WRONG, 'a year is not a date of birth');
  // A place keeps the dative article after „aus" and „in", and the article the course teaches it with.
  assert.equal(typedResult(origin, 'Ich komme aus den USA.'), RESULT.CORRECT);
  assert.equal(typedResult(home, 'Ich wohne in der Schweiz.'), RESULT.CORRECT);
  assert.equal(typedResult(home, 'Ich wohne im Irak.'), RESULT.CORRECT);
  for (const wrong of ['Ich wohne in Schweiz.', 'Ich wohne im Bremen.', 'Ich komme aus die Deutschland.']) assert.equal(typedResult(wrong.includes('komme') ? origin : home, wrong), RESULT.WRONG, wrong);
  // The verb stays second: a taught adverb in the middle or in front, a fronted place.
  assert.equal(typedResult(home, 'In Bremen wohne ich.'), RESULT.CORRECT);
  for (const right of ['Ich wohne jetzt in Köln.', 'Jetzt wohne ich in Köln.', 'Ich wohne hier in Bremen.']) assert.equal(typedResult(home, right), RESULT.CORRECT, right); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  assert.equal(typedResult(origin, 'Aus Syrien komme ich.'), RESULT.CORRECT);
  assert.equal(typedResult(origin, 'Aus Syrien ich komme.'), RESULT.WRONG, 'the verb must be second');
  // A name as Lektion 1 takes it; a job is no name.
  assert.equal(typedResult(message, 'Ich bin Omar. Ich bin am 3.5.1990 geboren.'), RESULT.CORRECT);
  assert.equal(refused(message, 'Ich bin Lehrer. Ich bin am 3.5.1990 geboren.'), RESULT.WRONG);
  // A second clause after „und" that opens with a taught verb (DaF review); a country is still no language.
  assert.equal(typedResult(own, 'Ich spreche Arabisch und lerne Deutsch.'), RESULT.CORRECT);
  assert.equal(refused(own, 'Ich spreche Arabisch und Marokko.'), RESULT.WRONG);
  // What was working keeps working.
  assert.equal(typedResult(origin, 'Ich kommen aus Syrien.'), RESULT.WRONG);
  assert.equal(typedResult(job, 'Ich bin müde.'), RESULT.WRONG);
  assert.equal(typedResult(number, '0421 3618002'), RESULT.WRONG);
  assert.equal(typedResult(number, '٠٤٢١٣٦١٨٠٠١'), RESULT.CORRECT);
  assert.equal(refused(message, 'Ich bin am 3.5.1990 geboren.'), RESULT.WRONG, 'the name part is missing');
});

test('after the photo, the check talks about the person the learner chose, not the other one', () => {
  const [photo] = sitting(l3);
  assert.equal(chosenWord(photo, 'Das ist meine Schwester.'), 'Schwester');
  assert.equal(chosenWord(photo, 'Das ist mein Vater.'), null, 'a wrong answer chooses nobody');
  const after = checkTurns({ ...l3.guided.check, lexicon }, 0, { chosen: 'Schwester' });
  assert.equal(typedResult(after[2], 'Meine Schwester kommt aus Syrien.'), RESULT.CORRECT);
  assert.equal(refused(after[2], 'Meine Mutter kommt aus Syrien.'), RESULT.WRONG, 'that is someone else');
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
  // Without a transcript nothing is marked, own answer or fixed (DaF review 2026-11-19): the word measure
  // alone passed „Ich heiße" + any sound, and a fixed answer by 80 % of its words.
  const { transcript: _t, ...noTranscript } = said('Ich heiße Zaid', name);
  assert.equal(spokenShown(noTranscript, name), false, 'without a transcript an own answer is not marked');
  const { transcript: _g, ...greetOnly } = said('Guten Tag', greet);
  assert.equal(spokenShown(greetOnly, greet), false, 'nor a fixed one');
});

test('Lektionen 4–6 after the DaF review (2026-11-19): the Genus, one or more things, a surname, the whole answer valid', () => {
  const l4 = sitting(CURRICULUM_A11.lektionen[3]);
  const l5 = sitting(CURRICULUM_A11.lektionen[4]);
  const l6 = sitting(CURRICULUM_A11.lektionen[5]);
  // Lektion 4: the task names the noun alone, so the learner gives it its article; the total comes before buying.
  assert.doesNotMatch(l4[3].taskDe, /einen|eine/, 'the task does not hand over the article');
  assert.equal(typedResult(l4[3], 'Wie teuer ist der Stuhl?'), RESULT.CORRECT);
  assert.equal(typedResult(l4[3], 'Was kostet die Stuhl?'), RESULT.WRONG);
  assert.equal(typedResult(l4[1], 'Wie teuer ist die Uhr?'), RESULT.CORRECT);
  assert.ok(l4[4].listen && /Stuhl und die Uhr/.test(l4[4].listen), 'the total is of the two things asked about');
  assert.equal(l4[5].slot, 'thing');
  assert.equal(typedResult(l4[5], 'Ich kaufe den Stuhl und die Uhr.'), RESULT.CORRECT);
  assert.equal(typedResult(l4[5], 'Ich kaufe der Stuhl.'), RESULT.WRONG);
  // Lektion 5: „Das ist …" names one thing, „Das sind …" more; a mass noun needs no article.
  const [what, where, , , askColour] = l5;
  for (const right of ['Das ist ein Heft.', 'Das ist mein Wörterbuch.', 'Das sind zwei Stifte.', 'Das sind meine Bücher.', 'Das ist Papier.', 'Das sind ein Heft und ein Stift.']) assert.equal(typedResult(what, right), RESULT.CORRECT, right);
  for (const wrong of ['Das sind ein Stift.', 'Das ist meine Bücher.', 'Das ist ein Heft und ein Stift.', 'Das ist Heft.', 'Das ist ein Schere.', 'Das ist blau.']) assert.equal(refused(what, wrong), RESULT.WRONG, wrong);
  assert.equal(typedResult(where, 'Das ist hier.'), RESULT.CORRECT);
  assert.equal(typedResult(askColour, 'Ist die Tasche rot?'), RESULT.CORRECT);
  assert.equal(refused(askColour, 'Ist der Tasche rot?'), RESULT.WRONG);
  // Lektion 6: a „wo?" question asks where; a surname may be a taught word; the model answer is Lektion 1's.
  const [, office, , phoneName] = l6;
  for (const notWhere of ['Ist das mein Büro?', 'Und mein Büro?']) assert.equal(refused(office, notWhere), RESULT.WRONG, notWhere);
  for (const right of ['Hier ist Frau Braun.', 'Ich heiße Ana Braun.', 'Guten Tag, ich heiße Zaid.', 'Zaid Ahmad.']) assert.equal(typedResult(phoneName, right), RESULT.CORRECT, right);
  for (const wrong of ['Gut.', 'Danke.', 'Hier ist Lehrer.', 'Hier ist Frau.', 'Guten Morgen.', 'Hier ist Büro.']) assert.equal(refused(phoneName, wrong), RESULT.WRONG, wrong);
  assert.equal(modelAnswer(phoneName), 'Guten Tag, ich heiße Ana Chakiri.');
  // The first blind corpus (2026-11-20): a name before the greeting, an inflected colour, a noun typed
  // without its umlaut, the noun named first.
  for (const right of ['Samira Haddad, guten Tag.', 'youssef benali, guten tag.']) assert.notEqual(typedResult(phoneName, right), RESULT.WRONG, right);
  assert.equal(typedResult(phoneName, 'Guten Morgen, guten Tag.'), RESULT.WRONG);
  const colour = l5[3];
  assert.equal(typedResult(colour, 'Mein Heft ist rote.'), RESULT.WRONG, 'after „ist" the colour has no ending');
  assert.equal(typedResult(colour, 'Mein Heft ist rot.'), RESULT.CORRECT);
  assert.equal(typedResult(where, 'das worterbuch ist hier.'), RESULT.TYPO, 'a missing umlaut is a typo, not a wrong noun');
  assert.equal(typedResult(askColour, 'Und deine Tasche, welche Farbe hat sie?'), RESULT.CORRECT); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  assert.equal(typedResult(l4[0], 'Was ist denn das?'), RESULT.CORRECT);
  assert.equal(refused(sitting(l3)[4], 'Ich spreche Deutsche.'), RESULT.WRONG, 'a taught language with an ending is a form, not an own word');
  // The second blind corpus (2026-11-20): what comes around a right answer, and prices.
  const [whatIsIt, askPrice, price, , total] = l4;
  for (const right of ['Guten Tag! Was ist das da?', 'Frau Wolf, was ist das hier?', 'frau wolf was ist das', 'Und das hier, was ist das?']) assert.notEqual(typedResult(whatIsIt, right), RESULT.WRONG, right);
  for (const right of ['Und der Stuhl, was kostet der?', 'Die Lampe, wie teuer ist die?']) assert.equal(typedResult(sitting(CURRICULUM_A11.lektionen[3], right.includes('Lampe') ? 1 : 0)[3], right), RESULT.CORRECT, right); // 2026-11-25, round 3: read as a sentence (clause.js)
  assert.equal(refused(l4[3], 'Der Stuhl, was kostet die?'), RESULT.WRONG, 'the pronoun picks up the noun’s article');
  assert.equal(typedResult(office, 'Wo ist bitte mein Büro?'), RESULT.CORRECT); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  assert.equal(typedResult(office, 'Mein Büro, wo ist das?'), RESULT.CORRECT); // 2026-11-25, round 3: read as a sentence (clause.js)
  assert.equal(typedResult(colour, 'Rot ist mein Heft.'), RESULT.CORRECT);
  assert.equal(typedResult(what, 'Ein Lineal ist das.'), RESULT.CORRECT);
  assert.equal(typedResult(where, 'Hier, Lena.'), RESULT.CORRECT, '„Hier," is no name');
  assert.equal(typedResult(sitting(CURRICULUM_A11.lektionen[4], 1)[1], 'Die Schere? Da.'), BEYOND); // section D: German, no answer of the turn word for word: BEYOND
  assert.equal(typedResult(l6[0], 'Guten Morgen! Ich brauche ein Telefon.'), RESULT.CORRECT); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  assert.equal(typedResult(phoneName, 'Guten Tag, Herr Weber.'), RESULT.WRONG, 'the partner’s name is not the learner’s');
  // (2026-11-25: prices the reading's number list does not print, so the check measures the rule of the compounds.)
  for (const right of ['36,00 Euro', '36,- €', 'sechsunddreißig Euro']) assert.equal(typedResult(price, right), RESULT.CORRECT, right);
  assert.equal(typedResult(price, '36 Cent'), RESULT.WRONG, 'a price heard in euros');
  assert.equal(typedResult(price, '36,50 Euro'), RESULT.WRONG);
  assert.equal(typedResult(total, '25,00 €'), RESULT.CORRECT);
  assert.equal(typedResult(sitting(CURRICULUM_A11.lektionen[3], 1)[4], 'vierundfunfzig euro'), RESULT.CORRECT);
  assert.ok(askPrice.accepted.length);
  // The third blind corpus: the question word last, „Wie viel Euro …", a name „am Telefon".
  assert.equal(typedResult(l4[3], 'Der Stuhl kostet wie viel?'), RESULT.CORRECT);
  assert.equal(refused(l4[3], 'Der Stuhl kosten wie viel?'), RESULT.WRONG, 'the words are graded as always');
  assert.equal(typedResult(askColour, 'Deine Tasche hat welche Farbe?'), RESULT.CORRECT);
  assert.equal(typedResult(office, 'Mein Büro ist wo?'), RESULT.CORRECT);
  assert.equal(typedResult(askPrice, 'Wie viel Euro kostet die Uhr?'), RESULT.CORRECT);
  assert.equal(typedResult(phoneName, 'Youssef Mansour am Telefon.'), RESULT.CORRECT);
  // The second DaF review (2026-11-20): what was really missing or wrongly accepted.
  const l4b = sitting(CURRICULUM_A11.lektionen[3], 1);
  const l5b = sitting(CURRICULUM_A11.lektionen[4], 1);
  const l5c = sitting(CURRICULUM_A11.lektionen[4], 2);
  assert.equal(typedResult(askPrice, 'Wie viel?'), RESULT.CORRECT, 'right after Frau Wolf named the thing');
  assert.equal(typedResult(l4[3], 'Was kostet ein Stuhl?'), RESULT.CORRECT);
  assert.equal(typedResult(l4[3], 'Was kostet eine Stuhl?'), RESULT.WRONG);
  assert.notEqual(modelAnswer(l4[5]), modelAnswer(l4b[5]), 'the example follows the sitting’s things');
  assert.equal(refused(l5b[1], 'Das ist hier.'), RESULT.WRONG, '„das" does not pick up die Schere');
  assert.equal(typedResult(l5b[1], 'Die ist hier.'), RESULT.CORRECT);
  assert.equal(typedResult(l5c[1], 'Der ist da.'), RESULT.CORRECT);
  assert.equal(typedResult(colour, 'Das ist grün.'), RESULT.CORRECT, 'about das Heft');
  assert.equal(refused(colour, 'Der ist grün.'), RESULT.WRONG);
  assert.equal(typedResult(l5c[3], 'Der ist blau.'), RESULT.CORRECT, 'about der Stift');
  assert.equal(typedResult(l5b[4], 'Ist dein Stift blau oder schwarz?'), RESULT.CORRECT);
  // A second clause after „und" is part of the answer and must be valid too.
  const own = sitting(l3)[4];
  assert.equal(typedResult(own, 'Ich spreche Arabisch und lerne Deutsch.'), RESULT.CORRECT);
  assert.equal(refused(own, 'Ich spreche Arabisch und lerne Studentin.'), RESULT.WRONG);
});

test('a colour is one of the colour words, a thing is a noun, and German of the same meaning passes (courses session, 2026-11-20)', () => {
  const [, askPrice, , , , buy] = sitting(CURRICULUM_A11.lektionen[3]);
  const [what, , , colour, askColour] = sitting(CURRICULUM_A11.lektionen[4]);
  const [need, , pause, phoneName] = sitting(CURRICULUM_A11.lektionen[5]);
  // Colours are a closed class: a word the course does not teach is no colour.
  for (const notColour of ['Es ist groß.', 'Es ist teuer.']) assert.equal(typedResult(colour, notColour), RESULT.WRONG, notColour);
  // „klein“ and „neu“ are no course words, but the sentence is read in full and names no colour: another thing said (round 3).
  for (const untaught of ['Es ist klein.', 'Es ist neu.']) { assert.equal(typedResult(colour, untaught), RESULT.WRONG, untaught); assert.equal(wrongReason(colour, untaught), 'task', untaught); }
  assert.equal(typedResult(askColour, 'Ist deine Tasche klein?'), RESULT.WRONG);
  for (const right of ['Es ist dunkelblau.', 'Es ist hell grün.', 'Es ist lila.', 'Es ist grau.', 'Es ist grun.', 'Mein Heft hat die Farbe Blau.']) assert.notEqual(typedResult(colour, right), RESULT.WRONG, right);
  // A thing the course never teaches is a noun the learner writes as one.
  for (const notThing of ['Ich kaufe groß.', 'Ich kaufe neu.']) assert.equal(typedResult(buy, notThing), RESULT.WRONG, notThing);
  assert.equal(typedResult(need, 'Ich brauche klein.'), RESULT.WRONG);
  assert.equal(typedResult(buy, 'Ich kaufe Bananen.'), RESULT.CORRECT);
  assert.equal(typedResult(buy, 'Ich kaufe eine banane.'), RESULT.TYPO, 'after an article a small letter is a typo');
  // An adjective before the noun takes the ending its article asks for.
  for (const right of ['Ich kaufe die rote Lampe.', 'Ich kaufe den roten Stuhl.', 'Ich kaufe ein rotes Regal.', 'Ich kaufe zwei rote Stühle.']) assert.equal(typedResult(buy, right), RESULT.CORRECT, right);
  for (const wrong of ['Ich kaufe die roten Lampe.', 'Ich kaufe den rote Stuhl.', 'Ich kaufe die groß Lampe.', 'Ich kaufe große.']) assert.equal(typedResult(buy, wrong), RESULT.WRONG, wrong);
  // Any adjective written small takes the same endings (third DaF review): „die große Lampe“.
  for (const right of ['Ich kaufe die große Lampe.', 'Ich kaufe ein neues Regal.']) assert.equal(typedResult(buy, right), RESULT.CORRECT, right);
  assert.equal(typedResult(need, 'Ich brauche einen neue Computer.'), RESULT.WRONG);
  assert.equal(typedResult(what, 'Das ist ein roter Stift.'), RESULT.CORRECT);
  assert.equal(typedResult(what, 'Das ist ein rote Stift.'), RESULT.WRONG);
  // The same meaning in other taught words.
  assert.equal(typedResult(buy, 'Ich möchte die Uhr kaufen.'), RESULT.CORRECT);
  assert.equal(typedResult(buy, 'Ich möchte die Uhr.'), RESULT.CORRECT);
  assert.equal(typedResult(askPrice, 'Wieviel kostet die Uhr?'), RESULT.TYPO, 'the old spelling of „wie viel"');
  for (const right of ['Wann beginnt die Pause?', 'Wann fängt die Pause an?', 'Wann ist meine Pause?', 'Wann ist die Mittagspause?']) assert.equal(typedResult(pause, right), RESULT.CORRECT, right);
  for (const right of ['Guten Tag Herr Weber, hier ist Haddad.', 'Hallo Herr Weber, hier ist Omar.']) assert.equal(typedResult(phoneName, right), RESULT.CORRECT, right); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  for (const right of ['Guten Tag, Herr Weber. Hier ist Omar Haddad.', 'Hier spricht Omar Haddad.']) assert.equal(typedResult(phoneName, right), RESULT.CORRECT, right);
  assert.equal(typedResult(phoneName, 'Guten Tag Herr Weber.'), RESULT.WRONG, 'a greeting names nobody');
});

test('Lektionen 7–9: hobbies, what one likes, clock times, days and times, café orders (batch 3, 2026-11-20)', () => {
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  const [hobby, likes, , duForm, free] = at(7);
  assert.equal(typedResult(hobby, 'Meine Hobbys sind Sport und Kochen.'), RESULT.CORRECT);
  assert.equal(typedResult(hobby, 'Mein Hobby ist Yoga.'), RESULT.CORRECT, 'a hobby of the learner’s own');
  assert.equal(typedResult(hobby, 'Mein Hobby ist gut.'), RESULT.WRONG, 'a taught word that is no hobby');
  for (const right of ['Am Wochenende spiele ich gern Fußball.', 'Ich gehe gern ins Kino.', 'Ich lese und koche gern.', 'Ich höre gerne Musik.', 'Ich wandere gern.']) assert.equal(typedResult(likes, right), RESULT.CORRECT, right);
  for (const wrong of ['Ich spielen gern Fußball.', 'Ich gern spiele Fußball.', 'Am Wochenende ich spiele Fußball.', 'Ich bin gern.']) assert.equal(typedResult(likes, wrong), RESULT.WRONG, wrong);
  assert.equal(typedResult(duForm, 'Tanzt du gern?'), RESULT.CORRECT);
  assert.equal(typedResult(duForm, 'Tanzst du gern?'), RESULT.WRONG, 'after -z the du-form adds only -t');
  assert.equal(typedResult(free, 'Am Dienstag bin ich abends frei.'), RESULT.CORRECT, 'two gaps around „bin ich"');
  assert.equal(refused(free, 'Am Tisch bin ich frei.'), RESULT.WRONG, 'a place is no time');
  const [tell, , getUp, appointment, agree, , heard] = at(8);
  for (const right of ['Es ist halb neun.', 'Es ist acht Uhr dreißig.', 'Es ist 8.30 Uhr.', 'Halb neun.']) assert.equal(typedResult(tell, right), RESULT.CORRECT, right);
  for (const wrong of ['Es ist halb acht.', 'Es ist um halb neun.', 'Es ist neun Uhr dreißig.']) assert.equal(typedResult(tell, wrong), RESULT.WRONG, `${wrong} (halb neun is 8.30, and telling the time takes no „um")`);
  assert.equal(typedResult(getUp, 'Ich stehe um halb sieben auf.'), RESULT.CORRECT);
  assert.equal(refused(getUp, 'Ich stehe sechs Uhr auf.'), RESULT.WRONG, 'a time for when takes „um"');
  assert.equal(typedResult(appointment, 'Hast du am Freitag um 10 Uhr Zeit?'), RESULT.CORRECT);
  assert.equal(typedResult(appointment, 'Hast du am Freitag um elf Uhr Zeit?'), RESULT.WRONG, 'the day and time asked about');
  for (const right of ['Dienstag, 9.30 Uhr', 'am Dienstag um halb zehn', 'Di 9:30']) assert.equal(typedResult(heard, right), RESULT.CORRECT, right);
  for (const wrong of ['Dienstag 10.30', '9.30', 'Mittwoch 9.30']) assert.equal(typedResult(heard, wrong), RESULT.WRONG, wrong);
  assert.equal(modelAnswer(heard), 'Dienstag, 9.30 Uhr', 'after a miss, the day and time as one writes them');
  // The first DaF review of Lektionen 8–9: „am“ for a day, morning and evening, agreeing the time.
  assert.equal(typedResult(at(8)[5], 'Um Montag habe ich Zeit.'), RESULT.WRONG, 'a weekday takes „am“');
  assert.equal(typedResult(at(8)[5], 'Um zehn habe ich Zeit.'), RESULT.CORRECT);
  assert.equal(refused(tell, 'Es ist zwanzig Uhr dreißig.'), RESULT.WRONG, 'evening, for a morning time');
  assert.equal(typedResult(heard, 'Dienstag, 21.30 Uhr'), RESULT.WRONG);
  assert.equal(typedResult(agree, 'Gut, bis Freitag!'), RESULT.CORRECT);
  assert.equal(typedResult(agree, 'Bis Montag!'), RESULT.WRONG, 'the day agreed is Friday');
  const [hungry, drink, food, , accept, decline] = at(9);
  for (const right of ['Ich möchte einen Kaffee, bitte.', 'Ich möchte ein Glas Mineralwasser.', 'Ich möchte einen Kaffee mit Milch.']) assert.equal(typedResult(drink, right), RESULT.CORRECT, right);
  assert.equal(typedResult(drink, 'Einen Kaffee, bitte.'), RESULT.CORRECT); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  for (const wrong of ['Ich möchte ein Kaffee.', 'Ich möchte eine Glas Wasser.', 'Ich möchten einen Kaffee.']) assert.equal(typedResult(drink, wrong), RESULT.WRONG, wrong);
  assert.equal(typedResult(food, 'Ein Stück Kuchen, bitte.'), RESULT.CORRECT); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  assert.equal(typedResult(drink, 'Ich möchte Kuchen.'), RESULT.WRONG, 'a drink, not a food');
  assert.equal(typedResult(food, 'Ich möchte Wasser.'), RESULT.WRONG, 'a food, not a drink');
  assert.equal(refused(accept, 'Ja, einen Kaffee, bitte.'), RESULT.WRONG, 'water was offered');
  assert.equal(typedResult(accept, 'Ja, ein Glas, bitte.'), RESULT.CORRECT);
  assert.equal(refused(hungry, 'Ja.'), RESULT.WRONG, 'the task asks for a sentence with „ich habe“');
  assert.equal(typedResult(hungry, 'Ja, ich bin Hunger.'), RESULT.WRONG, '„Hunger haben", the rule of Lektion 9');
  assert.equal(typedResult(accept, 'Ja, gern.'), RESULT.CORRECT);
  assert.equal(refused(decline, 'Nein.'), RESULT.WRONG, 'a decline is polite');
  assert.deepEqual(nextAfter(CURRICULUM_A11, CURRICULUM_A11.lektionen[8]), { kind: 'checkpoint', nr: 3 });
  // The second and third blind corpora: a phone keyboard without umlauts, small words, tags.
  assert.equal(typedResult(at(8)[1], 'wie spat ist es'), RESULT.TYPO, 'typed without umlauts');
  assert.notEqual(typedResult(at(8)[2], 'ich stehe um funf uhr auf'), RESULT.WRONG);
  assert.equal(typedResult(at(8)[0], 'Es ist morgens halb neun.'), RESULT.CORRECT, 'a part of the day with the time');
  assert.equal(refused(at(8)[3], 'Hast du am Freitag zehn Zeit?'), RESULT.WRONG, 'a time in a sentence takes „um“');
  assert.equal(typedResult(at(8)[3], 'Hast du Zeit am Freitag um 10 Uhr?'), RESULT.CORRECT);
  assert.equal(typedResult(at(8)[2], 'Am Wochenende stehe ich um neun auf.'), RESULT.CORRECT);
  assert.equal(typedResult(duForm, 'Du tanzt gern, oder?'), BEYOND, 'a tag asks the same question'); // section D: German, no answer of the turn word for word: BEYOND
  assert.equal(typedResult(duForm, 'Tanzt du sehr gern?'), RESULT.CORRECT); // 2026-11-25, round 3: read as a sentence (clause.js)
  assert.equal(typedResult(likes, 'Ich gehe gern in Kino.'), RESULT.WRONG, '„ins Kino“');
  assert.equal(typedResult(at(9)[3], 'Haben Sie vielleicht Tee?'), RESULT.CORRECT); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  assert.equal(typedResult(at(9)[3], 'Und Tee? Haben Sie den auch?'), RESULT.CORRECT, 'a bare noun picked up by „den“'); // 2026-11-25, round 3: read as a sentence (clause.js)
  assert.equal(typedResult(decline, 'Keinen Kuchen, danke.'), RESULT.CORRECT);
  assert.equal(refused(accept, 'Tee? Ja, gerne.'), RESULT.WRONG, 'water was offered, not tea');
  assert.equal(typedResult(at(9, 1)[4], 'Tee? Ja, gerne.'), RESULT.CORRECT); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  // The fourth DaF review: a note of a heard afternoon time keeps the afternoon.
  assert.equal(typedResult(at(8, 1)[6], 'Freitag, 4.15 Uhr'), RESULT.WRONG, '4.15 in a note is morning');
  assert.equal(typedResult(at(8, 1)[6], 'Freitag, nachmittags um Viertel nach vier'), RESULT.CORRECT);
  assert.equal(typedResult(at(8, 1)[3], 'Hast du am Donnerstag um Viertel nach vier Zeit?'), RESULT.CORRECT, 'in conversation the afternoon is clear');
});

test('one honest-none rule for the whole course; a yes agrees; a time may follow „frei“ (courses session, 2026-11-20)', () => {
  const NONE = { job: ['Ich arbeite nicht.', 'Ich habe keine Arbeit.', 'Ich bin arbeitslos.'], hobby: ['Ich habe kein Hobby.', 'Ich habe keine Hobbys.'] };
  const frame = (t) => String(t.accepted[0]?.frame ?? t.accepted[0]);
  let personal = 0;
  for (const l of withCheck) {
    for (let r = 0; r < retakes(l.guided.check); r += 1) {
      sitting(l, r).forEach((t, i) => {
        const where = `${l.id} sitting ${r + 1} turn ${i + 1}`;
        const own = !t.ownName && !writtenOnly(t) && frame(t).includes('…') && !frame(t).trim().endsWith('?');
        if (!own) return;
        // A fact of the learner's life a real person may not have (a job, a hobby): the none passes.
        if (NONE[t.none || t.slot]) { personal += 1; for (const none of NONE[t.none || t.slot]) assert.equal(typedResult(t, none), RESULT.CORRECT, `${where}: ${none}`); return; }
        // Everywhere else the turn asks for the can-do itself: „nichts“ in the learner's gap names nothing.
        assert.equal(typedResult(t, frame(t).replaceAll('…', 'nichts')), RESULT.WRONG, `${where}: ${frame(t).replaceAll('…', 'nichts')}`);
        // …and the hint says to read the task again: no word of it is wrong (Claude score of fd8f8dba, MINOR 9).
        assert.equal(faultHintKey(t, frame(t).replaceAll('…', 'nichts')), 'check.fault.task', `${where}: hint`);
        // A name is open: „Ich bin arbeitslos“ cannot be told from „Ich bin Carlos“ typed small, so name turns are left out.
        if (t.slot !== 'name') for (const none of [...NONE.job, ...NONE.hobby]) assert.equal(refused(t, none), RESULT.WRONG, `${where}: ${none}`);
      });
    }
  }
  assert.ok(personal >= 2, 'the job of Lektion 2 and the hobby of Lektion 7');
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  for (const [nr, ti, wrong] of [[4, 5, 'Ich kaufe keine Uhr.'], [6, 0, 'Ich brauche keinen Computer.'], [9, 1, 'Nichts, danke.'], [3, 3, 'Sie spricht nichts.'], [7, 4, 'Ich habe keine Zeit.'], [8, 5, 'Ich habe keine Zeit.'], [5, 0, 'Das ist kein Buch.']]) {
    assert.equal(refused(at(nr)[ti], wrong), RESULT.WRONG, `L${nr}: ${wrong}`);
  }
  assert.equal(typedResult(at(9)[5], 'Nein, danke. Ich möchte keinen Kuchen.'), RESULT.CORRECT, 'a decline names what it does not want');
  assert.equal(refused(at(2)[3], 'Ich arbeite nicht.'), RESULT.WRONG, 'a question turn takes no none');
  // Agreeing: words of yes, then what may follow them.
  const agree = at(8)[4];
  for (const right of ['Prima, dann bis Freitag.', 'Super, bis Freitag!', 'Gern.', 'Ja.', 'Ja, gut, bis dann!', 'Gut, am Freitag.', 'Freitag ist gut.', 'Okay, bis Freitag um zehn!']) assert.equal(typedResult(agree, right), RESULT.CORRECT, right);
  for (const wrong of ['Nein.', 'Gut, am Montag.', 'Ja, Freitag um elf.', 'Gern, aber ich habe keine Zeit.', 'Prima, dann bis Montag.']) assert.equal(refused(agree, wrong), RESULT.WRONG, wrong);
  assert.equal(typedResult(agree, 'ja gern'), RESULT.TYPO, 'a small first letter stays a case slip');
  assert.equal(typedResult(at(8, 1)[4], 'Ja, Donnerstag um Viertel nach vier ist gut.'), RESULT.CORRECT);
  // A time after the predicate.
  for (const right of ['Ich bin frei am Samstag.', 'Ich habe Zeit am Wochenende.']) assert.equal(typedResult(at(7)[4], right), RESULT.CORRECT, right);
  assert.equal(typedResult(at(8)[5], 'Ich habe Zeit am Dienstag abends.'), RESULT.CORRECT);
  assert.equal(refused(at(7)[4], 'Ich bin frei am Tisch.'), RESULT.WRONG, 'a place is no time');
});

test('Lektionen 10–12: a yes/no question, announcements, verbs of two parts, a month, an invitation, possessives, goodbye (batch 4, 2026-11-20)', () => {
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  const [where, yesNo, when, price, heardPrice, delay, platform] = at(10);
  assert.equal(typedResult(where, 'Ich fahre nach Damaskus.'), RESULT.CORRECT, 'a place of the learner’s own');
  assert.equal(refused(where, 'Ich fahre in Berlin.'), RESULT.WRONG);
  assert.equal(typedResult(yesNo, 'Fährt der Zug nach Berlin?'), RESULT.CORRECT);
  assert.equal(typedResult(yesNo, 'Der Zug fährt nach Berlin?'), RESULT.WRONG, 'valid confirmation question, but this task explicitly asks for verb-first form');
  assert.equal(typedResult(heardPrice, 'fünfzehn Uhr'), RESULT.WRONG, 'a price is no clock time');
  assert.equal(typedResult(platform, 'um sieben Uhr'), RESULT.WRONG);
  assert.equal(typedResult(when, 'Wann fährt der Zug ab?'), RESULT.CORRECT);
  assert.equal(typedResult(price, 'Kostet die Fahrkarte zwanzig Euro?'), RESULT.CORRECT);
  assert.equal(typedResult(heardPrice, '15 Euro'), RESULT.CORRECT);
  assert.equal(typedResult(delay, 'halb zehn'), RESULT.CORRECT);
  assert.equal(typedResult(delay, '21.30'), RESULT.WRONG, 'the evening, for a morning train');
  assert.equal(typedResult(platform, 'Gleis 7'), RESULT.CORRECT);
  const [yesterday, , morning, , work, shop, along] = at(11);
  assert.equal(typedResult(yesterday, 'Ich habe nicht gearbeitet.'), RESULT.CORRECT);
  assert.equal(refused(yesterday, 'Ich habe arbeiten.'), RESULT.WRONG);
  assert.equal(typedResult(morning, 'Ich dusche und frühstücke.'), RESULT.CORRECT, '„frühstücke“ is a verb here, not the plural „Frühstücke“');
  assert.equal(typedResult(morning, 'Ich stehe um sechs auf und dusche.'), RESULT.CORRECT);
  assert.equal(refused(morning, 'Ich dusche abends.'), RESULT.WRONG, 'the morning was asked about (`partOfDay`)');
  assert.equal(typedResult(yesterday, 'Ich habe gestern Sport gemacht.'), RESULT.CORRECT, 'the second fixed expression');
  assert.equal(typedResult(work, 'Ich arbeite von acht bis vier.'), RESULT.CORRECT, 'a span of time');
  assert.equal(typedResult(work, 'Ich arbeite nicht.'), RESULT.CORRECT, 'the honest none of a job (`none`)');
  assert.equal(typedResult(shop, 'Kaufst du am Samstag ein?'), RESULT.CORRECT);
  assert.equal(typedResult(shop, 'Kaufst du am Samstag?'), RESULT.WRONG, 'the prefix closes the sentence');
  assert.equal(typedResult(along, 'Ja, gern, ich komme mit.'), RESULT.CORRECT);
  assert.equal(refused(along, 'Ja, gern.'), RESULT.WRONG, '`leadWords` open an answer but are none alone');
  const [invite, month, askMonth, guests, present, wish, bye] = at(12);
  assert.equal(typedResult(invite, 'Ich lade dich zu meiner Party ein.'), RESULT.CORRECT);
  assert.equal(typedResult(invite, 'Ich lade dich zum Party ein.'), RESULT.WRONG, '„zur Party“');
  assert.equal(typedResult(invite, 'Ich lade dich am Sonntag ein.'), RESULT.WRONG, 'the party is on Saturday');
  assert.equal(typedResult(invite, 'Am Samstag ist meine Party. Kommst du?'), RESULT.CORRECT); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  for (const right of ['Mein Geburtstag ist im Mai.', 'Mein Geburtstag ist am 3. Mai.', 'Ich habe im März Geburtstag.']) assert.equal(typedResult(month, right), RESULT.CORRECT, right);
  assert.equal(refused(month, 'Mein Geburtstag ist am Mai.'), RESULT.WRONG, 'a month takes „im“');
  assert.equal(typedResult(askMonth, 'Wann ist deine Geburtstag?'), RESULT.WRONG);
  assert.equal(typedResult(guests, 'Mein Bruder und seine Frau kommen.'), RESULT.CORRECT);
  assert.equal(typedResult(guests, 'Lena und Tim kommen.'), RESULT.CORRECT, 'people of the story are guests too');
  assert.equal(typedResult(guests, 'Meine Eltern kommt.'), RESULT.WRONG, '„die Eltern“ is a plural only');
  assert.equal(typedResult(guests, 'Mein Mama kommt.'), RESULT.WRONG);
  assert.equal(typedResult(guests, 'Meine Freunde kommen zur Party.'), RESULT.CORRECT, 'where it is for, at the end'); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  assert.equal(typedResult(present, 'Ich möchte ein Buch.'), RESULT.CORRECT);
  assert.equal(typedResult(bye, 'Tschüss, mach’s gut!'), RESULT.CORRECT);
  assert.equal(typedResult(bye, 'Tschüss!'), RESULT.CORRECT, 'any goodbye; a day only the party’s (courses session)');
  assert.equal(typedResult(bye, 'Bis Samstag!'), RESULT.CORRECT);
  assert.equal(typedResult(bye, 'Bis Montag!'), RESULT.WRONG);
  assert.equal(typedResult(morning, 'Ich aufstehe.'), RESULT.WRONG, 'a verb of two parts keeps its prefix at the end');
  assert.equal(typedResult(morning, 'Ich sehe fern.'), RESULT.CORRECT);
  // The task names its form, „Ich habe …“: what is said with it and read in full is right; another past sentence is BEYOND (2026-11-25).
  for (const right of ['Ich habe gearbeitet.', 'Ich habe Sport gemacht.', 'Ich habe nichts gemacht.', 'Ich habe gestern gearbeitet.']) assert.equal(typedResult(yesterday, right), RESULT.CORRECT, right);
  for (const past of ['Ich habe Fußball gespielt.', 'Ich habe eingekauft.', 'Ich habe einen Film gesehen.']) assert.equal(typedResult(yesterday, past), RESULT.CORRECT, past);
  for (const past of ['Ich bin ins Kino gegangen.', 'Ich war zu Hause.']) assert.equal(typedResult(yesterday, past), BEYOND, past);
  assert.equal(typedResult(yesterday, 'Ich habe ein Kaffee getrunken.'), RESULT.WRONG, 'a taught thing keeps its article');
  for (const wrong of ['Ich habe arbeiten.', 'Ich bin gearbeitet.', 'Ich habe gearbeiten.', 'Ich habe aufgestanden.']) assert.equal(refused(yesterday, wrong), RESULT.WRONG, wrong);
  assert.equal(typedResult(invite, 'Ich mache ein Fest. Kommst du auch?'), RESULT.CORRECT, 'an invitation in two sentences'); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  assert.equal(refused(invite, 'Ich feiere am Sonntag. Kommst du?'), RESULT.WRONG, 'the party is on Saturday');
  assert.equal(refused(guests, 'Ein Stuhl kommt.'), RESULT.WRONG, 'a guest is a person');
  // Every activity gap of the course refuses a verb of two parts with its prefix still on (courses session).
  let activityGaps = 0;
  for (const l of withCheck) {
    for (let r = 0; r < retakes(l.guided.check); r += 1) {
      for (const t of sitting(l, r)) {
        for (const a of t.accepted) {
          const frame = String(a.frame ?? a);
          if ((a.slot ?? t.slot) !== 'activity' || !frame.includes('…')) continue;
          activityGaps += 1;
          for (const verb of ['einkaufe', 'aufstehe', 'fernsehe']) assert.equal(refused({ ...t, accepted: [a] }, frame.replace('…', verb)), RESULT.WRONG, `${l.id}: ${frame.replace('…', verb)}`);
          // A prefix at its place is never refused; one in front of what follows it is the order to check (round 4).
          const prefixLast = frame.replace('…', 'kaufe').replace(/([.!?]?)$/, ' ein$1');
          assert.notEqual(typedResult({ ...t, accepted: [a] }, prefixLast), RESULT.WRONG, `${l.id}: ${prefixLast}`);
          const inFront = frame.replace('…', 'kaufe ein');
          if (typedResult({ ...t, accepted: [a] }, inFront) === RESULT.WRONG) assert.equal(wrongReason({ ...t, accepted: [a] }, inFront), 'order', `${l.id}: ${inFront}`);
        }
      }
    }
  }
  assert.ok(activityGaps >= 3, 'Lektion 7 and Lektion 11');
  assert.equal(typedResult(bye, 'Tschüss, bis bald!'), RESULT.CORRECT);
  assert.equal(refused(at(11)[1], 'Was hast du morgen gemacht?'), RESULT.WRONG, 'the question is about yesterday');
  assert.equal(typedResult(shop, 'Kaufst du am Samstag Brot ein?'), RESULT.CORRECT);
  assert.equal(typedResult(askMonth, 'Und du, Lena, wann hast du Geburtstag?'), RESULT.CORRECT); // 2026-11-25, round 3: read as a sentence (clause.js)
  assert.equal(refused(bye, 'Guten Tag!'), RESULT.WRONG);
  assert.equal(typedResult(wish, 'Schönen Tag noch!'), RESULT.CORRECT);
  assert.deepEqual(nextAfter(CURRICULUM_A11, CURRICULUM_A11.lektionen[11]), { kind: 'checkpoint', nr: 4 }, 'Lektion 12 leads to the fourth checkpoint, never a Lektion 13');
  // The second DaF review and corpus: one journey per sitting, heard numbers that are no price, the fixed expressions.
  assert.equal(refused(at(10, 1)[2], 'Wann fährt der Zug nach Berlin?'), RESULT.WRONG, 'sitting 2 travels to Österreich');
  assert.equal(typedResult(at(10, 1)[2], 'Wann fährt der Zug nach Österreich?'), RESULT.CORRECT);
  assert.equal(typedResult(heardPrice, '15 Fahrkarten'), RESULT.WRONG, 'a price counts euros');
  assert.equal(typedResult(at(10, 1)[4], 'Sie kostet 18 Euro.'), RESULT.CORRECT);
  assert.equal(typedResult(delay, 'Der Zug fährt um neun Uhr dreißig.'), RESULT.CORRECT, 'the heard time in the heard words');
  assert.equal(refused(yesterday, 'Ich habe Lesen gemacht.'), RESULT.WRONG, '„gemacht“ only where it is German');
  assert.equal(typedResult(yesterday, 'Gestern habe ich im Büro gearbeitet.'), RESULT.CORRECT);
  assert.equal(typedResult(month, 'Am dritten Mai.'), RESULT.CORRECT);
  assert.equal(typedResult(wish, 'Schönen Tag und bis später!'), RESULT.CORRECT);
  assert.equal(typedResult(bye, 'Mach’s gut und bis bald!'), RESULT.CORRECT);
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

test('three outcomes: verified is CORRECT, a named fault of course words is WRONG, an untaught word is BEYOND (2026-11-22)', () => {
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  // The refusals of the second independent score: German past what the Lektion teaches.
  for (const [turn, answer] of [[at(2)[2], 'Ich bin pensioniert.'], [at(7)[0], 'Ich spiele Fußball als Hobby.']]) assert.equal(typedResult(turn, answer), BEYOND, answer);
  for (const [turn, answer] of [[at(2)[0], 'Meine Heimat ist Tunesien.'], [at(8)[1], 'Hast du die Uhrzeit?']]) assert.equal(typedResult(turn, answer), RESULT.CORRECT, answer); // 2026-11-25, round 3: read as a sentence (clause.js)
  // Frames and answers two teachers approved (a11.answers.js) are verified, though no Lektion teaches their words.
  for (const [turn, answer] of [[at(2)[0], 'Ich komme ursprünglich aus Syrien.'], [at(2)[4], 'Meine Telefonnummer lautet 017612345678.'], [at(2)[4], 'Sie erreichen mich unter 017612345678.'], [at(12)[4], 'Ein Buch wäre schön.']]) assert.equal(typedResult(turn, answer), RESULT.CORRECT, answer);
  // Course words only: the check names the fault.
  for (const [turn, answer] of [[at(2)[0], 'Ich kommen aus Syrien.'], [at(2)[1], 'Ich wohne Syrien.'], [at(2)[2], 'Ich bin Limonade.'], [at(3)[3], 'Er sprechen Arabisch.'],
    [at(9)[4], 'Ja, eine Tee, bitte.'], [at(11)[0], 'Ich habe ein Kaffee gemacht.'], [at(11)[0], 'Ich bin gearbeitet.'], [at(5)[0], 'Das ist Lena.']]) assert.equal(refused(turn, answer), RESULT.WRONG, answer);
  // BEYOND is not shown: not by voice, not as a can-do.
  assert.equal(spokenShown({ pct: 100, transcript: 'Ich spiele Fußball als Hobby.' }, at(7)[0]), false);
  const turns = checkTurns(l1.guided.check, 0);
  assert.deepEqual(canDoShown(turns, [...turns.map(() => 'shown').slice(0, -1), 'unverified'], 4), [false, true, true, true]);
  // The blind corpora: a teacher's wrong answer reaches CORRECT or BEYOND no more often than measured (ratchets: only down).
  const dir = new URL('../docs/course-factory/a11-lektion-rollout/corpora/', import.meta.url);
  const count = { correct: 0, beyond: 0 };
  const unnamed = [];
  for (const batch of ['batch-1', 'batch-2', 'batch-3', 'batch-4']) {
    for (const name of ['corpus-1.json', 'corpus-2.json', 'corpus-2-avoid-obvious.json', 'corpus-3-most-common.json']) {
      let raw;
      try { raw = readFileSync(new URL(`${batch}/${name}`, dir), 'utf8'); } catch { continue; }
      for (const it of JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)).items) {
        const turn = sitting(CURRICULUM_A11.lektionen[it.lektion - 1], (it.sitting || 1) - 1)[it.turn - 1];
        if (!turn) continue;
        const r = typedResult(turn, it.answer);
        // Every WRONG names its fault, and only a WRONG does: a BEYOND is „no rule for this wording“ (Rule 2).
        if (!verifiedResult(r) && (r === RESULT.WRONG) !== Boolean(wrongReason(turn, it.answer))) unnamed.push(`L${it.lektion}: ${it.answer} (${r})`);
        if (it.verdict === 'wrong' && r in count) count[r] += 1;
      }
    }
  }
  // 7 CORRECT: tasks that ask for neither digits nor a sentence („Schreiben Sie die Nummer.“, „Nennen Sie Ihr Ziel.“)
  // and one older batch-4 task. 12 BEYOND (third score, Rule 2, and its review): German no rule of the check faults —
  // „Wann ist die Ankunft?“ for the departure, „Guten Appetit!“ for a good day, „Vielleicht am Donnerstag.“ for a yes,
  // „Machen Sie es gut, Lena!“ — each listed in the PR. Never more.
  assert.ok(count.correct <= 7, `${count.correct} wrong answers graded correct`);
  assert.ok(count.beyond <= 409, `${count.beyond} wrong answers graded beyond`);
  assert.deepEqual(unnamed, []);
});

test('one spelling fold: every blind-corpus answer with ä, ö, ü or ß grades the same typed with ae, oe, ue, ss (2026-11-20)', () => {
  const ascii = (s) => s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue').replace(/ß/g, 'ss');
  const dir = new URL('../docs/course-factory/a11-lektion-rollout/corpora/', import.meta.url);
  let n = 0;
  for (const batch of ['batch-1', 'batch-2', 'batch-3', 'batch-4']) {
    for (const name of ['corpus-1.json', 'corpus-2.json', 'corpus-2-avoid-obvious.json', 'corpus-3-most-common.json']) {
      let raw;
      try { raw = readFileSync(new URL(`${batch}/${name}`, dir), 'utf8'); } catch { continue; }
      for (const it of JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)).items) {
        if (!/[äöüß]/i.test(it.answer)) continue;
        const turn = sitting(CURRICULUM_A11.lektionen[it.lektion - 1], (it.sitting || 1) - 1)[it.turn - 1];
        if (!turn) continue;
        n += 1;
        const [a, b] = [typedResult(turn, it.answer), typedResult(turn, ascii(it.answer))];
        assert.equal([RESULT.WRONG, BEYOND].includes(b), [RESULT.WRONG, BEYOND].includes(a), `L${it.lektion}: ${it.answer} → ${a}, ${ascii(it.answer)} → ${b}`);
      }
    }
  }
  assert.ok(n > 300, `${n} answers`);
  // The paths the independent score found refused: a sign-off, a measure, a choice gap.
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  assert.equal(typedResult(at(2)[6], 'Guten Tag, ich heisse Zaid. Ich bin am 12.03.1995 geboren. Viele Gruesse, Zaid'), RESULT.CORRECT);
  assert.equal(typedResult(at(9)[2], 'Ich haette gern ein Stueck Kuchen.'), RESULT.CORRECT);
  assert.equal(typedResult(at(10)[0], 'Ich fahre in die Tuerkei.'), RESULT.CORRECT);
  assert.equal(typedResult(at(2)[2], 'Ich bin muede.'), RESULT.WRONG, '„müde“ is no job, however it is typed');
});

test('the own-word policy: closed lists for languages and countries, jobs by list or shape, an unknown word accepted and named (2026-11-20)', async () => {
  const { uncheckedWords } = await import('../src/lib/lesson/finalCheck.js');
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  const [, live, job] = at(2);
  const lang = at(3)[3];
  for (const wrong of ['Sie spricht Limonade.', 'Sie spricht Brötchen.', 'Sie spricht Syrien.']) assert.equal(typedResult(lang, wrong), RESULT.WRONG, wrong);
  for (const right of ['Sie spricht Tigrinya.', 'Sie spricht Tigrinisch.', 'Sie spricht Kurdisch und Arabisch.']) assert.notEqual(typedResult(lang, right), RESULT.WRONG, right);
  for (const wrong of ['Ich bin Limonade.', 'Ich bin muede.', 'Ich bin Brötchen.', 'Ich bin Bremen.']) assert.equal(typedResult(job, wrong), RESULT.WRONG, wrong);
  for (const right of ['Ich bin Tischler.', 'Ich bin Bauingenieur.', 'Ich bin arbeitslos.']) assert.equal(typedResult(job, right), RESULT.CORRECT, right);
  assert.equal(typedResult(at(2)[0], 'Ich komme aus Tuerkei.'), RESULT.WRONG, '„aus der Türkei“');
  assert.equal(typedResult(at(2)[0], 'Ich komme aus der Tuerkei.'), RESULT.CORRECT);
  // The learner is told when the word itself was not checked, and only then.
  assert.deepEqual(uncheckedWords(live, 'Ich wohne in Nordenham.'), ['Nordenham']);
  assert.deepEqual(uncheckedWords(live, 'Ich wohne in Hamburg.'), []);
  assert.deepEqual(uncheckedWords(job, 'Ich bin Bauingenieur.'), ['Bauingenieur']);
  assert.deepEqual(uncheckedWords(at(6)[3], 'Hier ist Zaid.'), [], 'a name is no unchecked word');
  assert.match(T.en['check.unchecked'], /\{word\}/);
  assert.match(T.de['check.unchecked'], /\{word\}/);
  assert.match(readFileSync('src/components/lesson/CheckStage.jsx', 'utf8'), /uncheckedWords\(turn, value\)/);
});

test('natural answers: a counter-question or a degree word after a complete answer, and „mein“ for the learner’s own thing (2026-11-20)', () => {
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  // Every fixed statement answer of every check still passes with a counter-question after it.
  for (const l of withCheck) {
    for (let r = 0; r < retakes(l.guided.check); r += 1) {
      sitting(l, r).forEach((t, i) => {
        if (t.ownName || t.spell || t.listen || t.parts) return;
        for (const a of t.accepted.filter((x) => typeof x === 'string' && !x.includes('…') && !/\?\s*$/.test(x))) {
          const b = `${a.replace(/[.!]?\s*$/, '.')} ${l.guided.check.partner === 'Lena' ? 'Und du?' : 'Und Sie?'}`;
          assert.notEqual(typedResult(t, b), RESULT.WRONG, `${l.id} sitting ${r + 1} turn ${i + 1}: ${b}`);
        }
      });
    }
  }
  assert.equal(typedResult(at(1)[3], 'Danke, gut.'), RESULT.CORRECT);
  for (const right of ['Danke, gut. Und Ihnen?', 'Gut, danke. Und Ihnen?']) assert.equal(typedResult(at(1)[3], right), RESULT.CORRECT, right); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  for (const right of ['Und Ihnen?', 'Und Sie?']) assert.equal(typedResult(at(1)[4], right), RESULT.CORRECT, right);
  assert.equal(typedResult(at(8)[4], 'Ja, das passt mir gut.'), RESULT.CORRECT); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  assert.equal(typedResult(at(8)[4], 'Das passt sehr gut.'), RESULT.CORRECT);
  for (const right of ['Wann fährt mein Zug ab?', 'Wann fährt mein Zug?']) assert.equal(typedResult(at(10)[2], right), RESULT.CORRECT, right); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  assert.equal(typedResult(at(5)[4], 'Welche Farbe hat meine Tasche?'), RESULT.WRONG, 'Lena’s bag is asked about, not mine');
  assert.equal(refused(at(4)[1], 'Was kostet meine Uhr?'), RESULT.WRONG, 'the watch is for sale, not mine');
});

test('Lektion 1 after the second score: a name after the opening, the ways one is, any goodbye (2026-11-22)', () => {
  const [, name, , how, , bye] = sitting(l1);
  for (const right of ['Ich heiße Omar.', 'ich heiße omar', 'Ich bin Ana.', 'Mein Name ist Omar Khalil.', 'Ich heiße Rosa.']) assert.equal(typedResult(name, right), RESULT.CORRECT, right);
  // An opening's word again, a taught noun or job, a state: no name.
  for (const wrong of ['Mein Name ist ist Omar.', 'Ich heiße heiße Omar.', 'Ich bin Student.', 'Ich bin Tischler.', 'Ich bin müde.', 'Ich bin Lehrerin.']) assert.equal(typedResult(name, wrong), RESULT.WRONG, wrong);
  for (const right of ['Mir geht es sehr gut.', 'Mir geht es nicht gut.', 'Es geht.', 'Nicht so gut, danke.']) assert.equal(typedResult(how, right), RESULT.CORRECT, right);
  assert.equal(typedResult(bye, 'Tschüss!'), RESULT.CORRECT);
});

test('a day of the month exists in its month, as the full date checks it (2026-11-22)', () => {
  const birthday = sitting(CURRICULUM_A11.lektionen[11])[1];
  for (const wrong of ['Mein Geburtstag ist am 31. Februar.', 'Mein Geburtstag ist am 31. April.', 'Mein Geburtstag ist am 31.11.']) assert.equal(typedResult(birthday, wrong), RESULT.WRONG, wrong);
  for (const right of ['Mein Geburtstag ist am 29. Februar.', 'Mein Geburtstag ist am 30. April.', 'Mein Geburtstag ist am 31.12.']) assert.equal(typedResult(birthday, right), RESULT.CORRECT, right);
});


test('can-do honesty: a check claims only what its turns show, and a receptive turn never claims a productive can-do (2026-11-22)', async () => {
  const { canDoList, shownLines } = await import('../src/lib/course/canDo.js');
  for (const l of withCheck) {
    const { shown = [], turns } = l.guided.check;
    assert.ok(shown.length <= l.canDo.length, `L${l.nr}: a shown line per can-do`);
    for (const line of shown.filter(Boolean)) assert.ok(line.de && line.en, `L${l.nr}: German and English`);
    l.canDo.forEach((_, i) => {
      const own = turns.filter((t) => t.canDo === i);
      // Heard and written down: the shown line says „verstehen“, never what the learner did not do.
      if (own.length && own.every((t) => t.spell || t.listen)) assert.match(shown[i]?.de || '', /verstehen/, `L${l.nr} can-do ${i + 1}`);
    });
  }
  assert.equal(shownLines(l1, 'de')[2], 'Ich kann einen Namen verstehen und aufschreiben, wenn jemand ihn buchstabiert.');
  assert.equal(shownLines(l1, 'en')[1], 'I can say what my name is.', 'a can-do the check shows in full keeps its line');
  // The course home: a finished Lektion claims what its check showed, an open one the can-do it works towards.
  const [open] = canDoList(CURRICULUM_A11).filter((c) => c.lektionId === l1.id && c.id.endsWith('#3'));
  const [done] = canDoList(CURRICULUM_A11, new Set([l1.id])).filter((c) => c.lektionId === l1.id && c.id.endsWith('#3'));
  assert.equal(open.de, 'Ich kann meinen Namen buchstabieren.');
  assert.equal(done.de, 'Ich kann einen Namen verstehen und aufschreiben, wenn jemand ihn buchstabiert.');
});

test('the fixed expressions verify every word between „habe“ and the participle; taught-word faults stay WRONG (2026-11-22)', () => {
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  const yesterday = at(11)[0];
  // The courses session's praised faults: a taught noun in the wrong form is WRONG, an untaught one BEYOND.
  for (const wrong of ['Ich habe mit meine Mutter gearbeitet.', 'Ich habe in Büro gearbeitet.', 'Ich habe ein Kuchen gemacht.', 'Ich habe den Frühstück gemacht.',
    'Ich habe Stuhl gemacht.', 'Ich habe mit mein Bruder gearbeitet.', 'Ich habe bei die Arbeit gearbeitet.']) assert.equal(refused(yesterday, wrong), RESULT.WRONG, wrong);
  for (const wrong of ['Ich habe der Hausaufgaben gemacht.', 'Ich habe ein Hausaufgaben gemacht.']) assert.equal(wrongReason(yesterday, wrong), 'article', wrong);
  assert.equal(typedResult(yesterday, 'Ich habe Hausaufgabe gemacht.'), RESULT.WRONG); // 2026-11-25, round 3: „Hausaufgaben“, or an article: one change makes it the answer
  for (const right of ['Ich habe einen Kuchen gemacht.', 'Ich habe im Büro gearbeitet.', 'Ich habe mit meiner Mutter gearbeitet.', 'Ich habe mit Lena gearbeitet.',
    'Ich habe Sport gemacht.', 'Ich habe nichts gemacht.', 'Ich habe von acht bis vier gearbeitet.', 'Ich habe am Montag viel gearbeitet.', 'Ich habe zu Hause gearbeitet.',
    'Ich habe Kaffee gemacht.', 'Ich habe das gemacht.']) assert.equal(typedResult(yesterday, right), RESULT.CORRECT, right);
  // Taught words and taught frames only: CORRECT or WRONG, never BEYOND.
  assert.equal(typedResult(at(9)[2], 'Ich hätte gern einen Stück Kuchen.'), RESULT.WRONG);
  assert.equal(typedResult(at(10)[2], 'Wohin fährt der Zug?'), RESULT.WRONG, 'the cue of Lektion 10, the wrong question for the task');
  // „schöne“ after „wäre“ is an ending the check names (third score); „Ein Buch wäre schön.“ goes beyond („wäre“).
  assert.equal(typedResult(at(12)[4], 'Ein Buch wäre schöne.'), RESULT.WRONG);
  assert.equal(typedResult(at(12)[4], 'Ein Buch wäre schön.'), RESULT.CORRECT);
  assert.ok(untaughtIn(at(12)[4], 'Ein Buch wäre schön.').includes('wäre'), '„wäre“ is not taught');
  // A hobby keeps the article of a taught noun.
  assert.equal(typedResult(at(7)[0], 'Mein Hobby ist das Musik.'), RESULT.WRONG);
  assert.equal(typedResult(at(7)[0], 'Mein Hobby ist die Musik.'), RESULT.CORRECT);
});

test('the whole answer (third score, Rule 1): what follows a verified beginning is graded on its own (2026-11-22)', () => {
  // Generated over every turn of every sitting, so a new turn cannot reopen the class: the turn's model answer with a tail
  // that is wrong whatever stands before it is never CORRECT or TYPO.
  const tails = [' und ich ist Student', ' und kommen aus Syrien', ' bin', ' ist', ' und du bist', ' und ich habe gearbeiten', ' und ich brauche ein Computer'];
  let tried = 0;
  for (const l of withCheck) {
    for (let r = 0; r < retakes(l.guided.check); r += 1) {
      sitting(l, r).forEach((turn, i) => {
        const base = turn.ownName ? `${turn.accepted[0]} Omar.` : modelAnswer(turn);
        if (!verifiedResult(typedResult(turn, base))) return;
        for (const tail of tails) {
          const answer = `${base.replace(/[.!?]+\s*$/, '')}${tail}${/\?\s*$/.test(base) ? '?' : '.'}`;
          tried += 1;
          assert.ok(!verifiedResult(typedResult(turn, answer)), `${l.id} sitting ${r + 1} turn ${i + 1}: ${answer}`);
        }
      });
    }
  }
  assert.ok(tried >= 525, `${tried} answers`);
  // A clause an answer of the course verifies stays verified; a faulty one is WRONG, an unverified one BEYOND.
  const [, name] = sitting(l1);
  assert.equal(typedResult(name, 'Ich heiße Omar Al-Haddad.'), RESULT.CORRECT);
  for (const right of ['Ich heiße Omar. Und Sie?', 'Ich heiße Omar, und Sie?', 'Ich heiße Omar und komme aus Syrien.']) assert.equal(typedResult(name, right), RESULT.CORRECT, right); // 2026-11-25: what stands around an answer comes off (answerShapes.js)
  for (const wrong of ['Ich heiße Omar und kommen aus Syrien.', 'Ich heiße Omar und ich ist Student.', 'Ich heiße Omar bin.', 'Ich bin Omar und du bist.', 'Ich heiße Omar Haddad ist.']) assert.equal(typedResult(name, wrong), RESULT.WRONG, wrong);
  assert.equal(typedResult(sitting(l2)[0], 'Ich komme aus Marokko und wohne in Bremen.'), RESULT.CORRECT, 'the scene’s own line');
  assert.equal(refused(sitting(l2)[0], 'Ich komme aus Marokko und ich ist Student.'), RESULT.WRONG);
  assert.equal(typedResult(sitting(l2)[5], '0421 3618001 bin.'), RESULT.WRONG, 'a heard number and nothing after it but a unit');
  assert.equal(typedResult(sitting(l2)[5], 'Telefonnummer: 0421 3618001'), RESULT.CORRECT);
});

test('nothing is wrong by default (third score, Rule 2): a WRONG names its fault, unverified on-task German is BEYOND (2026-11-22)', () => {
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  // The score's examples, German from taught words: never WRONG; the two that combine pieces of the turn CORRECT (Rule 3).
  assert.equal(typedResult(at(8)[1], 'Kannst du mir sagen, wie spät es ist?'), RESULT.CORRECT);
  assert.equal(typedResult(at(11)[4], 'Ich arbeite am 15. Mai.'), RESULT.CORRECT); // 2026-11-25, round 3: read as a sentence (clause.js)
  assert.equal(typedResult(at(8)[4], 'Ja, Freitag um zehn passt mir gut.'), RESULT.CORRECT); // the same
  assert.equal(typedResult(at(10)[2], 'Um wie viel Uhr fährt der Zug ab?'), RESULT.CORRECT);
  // The typical beginner faults stay WRONG, each with its fault named.
  for (const [turn, answer, reason] of [
    [at(11)[0], 'Ich bin Kaffee getrunken.', 'auxiliary'], [at(11)[0], 'Ich habe gearbeiten.', 'participle'],
    [at(11)[0], 'Ich hat gearbeitet.', 'agreement'], [at(11)[0], 'Ich arbeite gestern.', 'tense'], [at(11)[0], 'Ich habe gemacht Hausaufgaben.', 'order'],
    [at(11)[1], 'Was du hast gestern gemacht?', 'order'], [at(2)[0], 'Ich kommen aus Syrien.', 'agreement'], [at(2)[0], 'Ich komme von Syrien.', 'word'],
    [at(2)[0], 'Ich komme aus Arabisch.', 'kind'], [at(1)[3], 'Mir geht gut.', 'missing'], [at(10)[2], 'Wohin fährt der Zug?', 'word'],
    [at(10)[2], 'Wann fahren der Zug ab?', 'agreement'], [at(9)[2], 'Ich hätte gern einen Stück Kuchen.', 'article'], [at(6)[0], 'Ich brauche ein Computer.', 'article'],
    [at(12)[4], 'Ein Buch wäre schöne.', 'ending'], [at(7)[3], 'Tanzen Sie gern?', 'address'], [at(10)[0], 'Nach Berlin ich fahre.', 'order'],
    [at(10)[0], 'Ich fahre nach der Berlin.', 'article'], [at(11)[0], 'I worked yesterday.', 'english']]) {
    assert.equal(refused(turn, answer), RESULT.WRONG, answer);
    assert.equal(wrongReason(turn, answer), reason, answer);
  }
  // A verified or unverified answer has no reason.
  assert.equal(wrongReason(at(2)[0], 'Ich komme aus Syrien.'), null);
  assert.equal(wrongReason(at(8)[1], 'Kannst du mir sagen, wie spät es ist?'), null);
});

test('what a turn accepts in pieces it accepts together (third score, Rule 3): generated over every turn (2026-11-22)', () => {
  // Each optional piece of a turn (a run of words one of its answers has and another, otherwise the same, has not), put
  // into each of its fixed answers between the words it stands between there: never WRONG.
  const fold = (w) => w.toLocaleLowerCase('de').replace(/[.,!?;:„“"()]+/g, '').replace(/ß/g, 'ss');
  let n = 0;
  for (const l of withCheck) {
    for (let r = 0; r < retakes(l.guided.check); r += 1) {
      sitting(l, r).forEach((turn, i) => {
        if (turn.ownName || turn.spell || turn.listen || turn.parts) return;
        for (const a of turn.accepted.filter((x) => typeof x === 'string' && !x.includes('…'))) {
          const words = a.split(/\s+/);
          const plain = words.map(fold);
          for (const p of optionalPieces(turn)) {
            for (let k = 0; k <= words.length; k += 1) {
              if (!(p.left === '^' ? k === 0 : plain[k - 1] === p.left) || !(p.right === '$' ? k === words.length : plain[k] === p.right)) continue;
              const out = [...words];
              const stop = k === words.length ? (out[k - 1].match(/[.!?]+$/) || [''])[0] : '';
              if (stop) out[k - 1] = out[k - 1].slice(0, -stop.length);
              const piece = [...p.written];
              if (stop) piece[piece.length - 1] += stop;
              out.splice(k, 0, ...piece);
              const answer = out.join(' ');
              n += 1;
              assert.notEqual(typedResult(turn, answer), RESULT.WRONG, `${l.id} sitting ${r + 1} turn ${i + 1}: ${answer}`);
            }
          }
        }
      });
    }
  }
  assert.ok(n >= 20, `${n} combinations`);
});

test('an answer is a sequence (Rule 4, the review of 2492a424): a word doubled or two words swapped is never verified unless German says so (2026-11-23)', () => {
  // The mirror of the Rule 3 test, generated over every turn of every sitting: each verified answer of the turn (its
  // fixed answers, its frames with a name in the gap, its model answer) with one word typed twice, or one adjacent pair
  // swapped. A doubled word is verified only inside an own name („Ich heiße Omar Omar“); a swap only where a rule of
  // German word order the check knows makes it German, each rule below.
  const fold = (w) => w.toLocaleLowerCase('de').replace(/[.,!?;:„“"()]+/g, '').replace(/ß/g, 'ss');
  const known = (w) => { const f = fold(w); return lexicon.has(f) || lexicon.said.has(f) || /^\d/.test(f); };
  const PRONOUN = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr']);
  const TIME = new Set(['abends', 'morgens', 'nachmittags', 'vormittags', 'heute', 'morgen']);
  const germanSwap = (turn, words, k, answer) => {
    const [a, b] = [fold(words[k]), fold(words[k + 1])];
    const plain = (s) => s.split(/\s+/).map(fold).join(' ');
    // the same words as one of the turn's answers, only the case differs („gut, Danke.“ for „Gut, danke.“)
    if (turn.accepted.some((x) => typeof x === 'string' && plain(x) === plain(answer))) return 'accepted';
    // two words of the learner's own: a name, a number („Chakiri Ana“, „2345678 0176“, „Ich möchte bitte, Omar.“)
    if (!known(words[k]) || !known(words[k + 1]) || /^\d/.test(a) || /^\d/.test(b)) return 'own';
    // a first name and a surname either way round in a name slot („Chakiri Ana“): capitalised, no taught noun
    const nameWord = (w) => /^\p{Lu}/u.test(w) && !lexicon.genders.has(fold(w));
    if ((turn.ownName || turn.parts || turn.slot === 'name') && nameWord(words[k]) && nameWord(words[k + 1])) return 'own';
    // a question in statement order, first in its clause („Du tanzt gern?“, „Entschuldigung, Sie haben Tee?“)
    if ((k === 0 || /,$/.test(words[k - 1])) && PRONOUN.has(b) && /\?\s*$/.test(answer)) return 'statement order';
    // a particle after the pointing „das“ („Was ist das denn?“)
    if ([a, b].includes('das') && [a, b].some((x) => ['denn', 'doch', 'mal'].includes(x))) return 'particle last';
    // two answer words either way round („Gern, ja.“, „Danke, nein.“)
    const answerWords = new Set([...(turn.answerWords || []), ...(turn.leadWords || []), ...turn.accepted.filter((x) => typeof x === 'string' && x.split(/\s+/).length === 2).flatMap((x) => x.split(/\s+/))].map(fold));
    if (answerWords.has(a) && answerWords.has(b)) return 'answer words';
    // „gern“ after what one likes („Ich spiele Fußball gern“), a time after „Zeit“ or „frei“, a place word last („Gibt es Tee hier?“)
    if (['gern', 'gerne'].includes(a) && /^\p{Lu}/u.test(words[k + 1])) return 'gern last';
    if (['zeit', 'frei'].includes(b) && TIME.has(a)) return 'time after Zeit';
    if (a === 'hier' && k + 2 === words.length && /\?\s*$/.test(answer)) return 'place word last';
    // „nicht heute“ beside „heute nicht“
    if (a === 'heute' && b === 'nicht') return 'not today';
    return null;
  };
  const verified = (r) => r === RESULT.CORRECT || r === RESULT.TYPO;
  const kept = {};
  let [doubled, swapped] = [0, 0];
  for (const l of withCheck) {
    for (let r = 0; r < retakes(l.guided.check); r += 1) {
      sitting(l, r).forEach((turn, i) => {
        const bases = new Set(turn.accepted.map((x) => (typeof x === 'string' ? x : x.frame).replace(/…/g, 'Omar')));
        if (typeof modelAnswer(turn) === 'string') bases.add(modelAnswer(turn).replace(/…/g, 'Omar'));
        if (turn.ownName) bases.add('Ich heiße Omar.');
        const ownName = turn.ownName || turn.parts || turn.slot === 'name';
        for (const base of bases) {
          if (!verified(typedResult(turn, base))) continue;
          const words = base.split(/\s+/);
          words.forEach((w, k) => {
            const bare = w.replace(/[.,!?]+$/, '');
            if (!/\p{L}/u.test(bare)) return;
            const answer = [...words.slice(0, k), bare, w, ...words.slice(k + 1)].join(' ');
            doubled += 1;
            if (verified(typedResult(turn, answer))) assert.ok(ownName && !known(bare), `${l.id} sitting ${r + 1} turn ${i + 1}: ${answer}`);
          });
          for (let k = 0; k + 1 < words.length; k += 1) {
            const [a, b] = [words[k].replace(/[.,!?]+$/, ''), words[k + 1].replace(/[.,!?]+$/, '')];
            if (fold(a) === fold(b)) continue;
            const answer = [...words.slice(0, k), b + words[k].slice(a.length), a + words[k + 1].slice(b.length), ...words.slice(k + 2)].join(' ');
            swapped += 1;
            if (!verified(typedResult(turn, answer))) continue;
            const why = germanSwap(turn, words, k, answer);
            assert.ok(why, `${l.id} sitting ${r + 1} turn ${i + 1}: ${answer}`);
            kept[why] = (kept[why] || 0) + 1;
          }
        }
      });
    }
  }
  assert.ok(doubled >= 1000 && swapped >= 800, `${doubled} doubled, ${swapped} swapped`);
  // The probes of the review, each a fault the check names.
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  for (const [turn, answer, reason] of [
    [at(8)[4], 'Ja, Freitag zehn um passt mir.', 'order'], [at(8)[4], 'Ja, Freitag um zehn passt gut mir.', null], [at(8)[4], 'Ja, ja, Freitag um zehn passt mir gut gut.', 'extra'],
    [at(8)[1], 'Entschuldigung, wie spät ist es jetzt jetzt?', 'extra'], [at(1)[3], 'Sehr danke, gut.', null], [at(7)[2], 'Was machst gern du am Wochenende?', 'order'],
    [at(8)[2], 'Ich stehe sechs um Uhr auf.', 'order'], [at(8)[3], 'Hast du Freitag am um zehn Uhr Zeit?', 'order'], [at(3)[3], 'Sie spricht und Arabisch Deutsch.', 'order'],
    [at(4)[0], 'Was denn ist das?', 'order'], [at(7)[1], 'Wochenende Am spiele ich gern Fußball.', 'order'], [at(9)[1], 'Ich möchte einen bitte, Kaffee.', 'order'],
    [at(1)[3], 'Mir geht es gut gut.', 'extra'], [at(8)[1], 'Kannst du mir sagen, wie spät ist es?', 'order']]) {
    assert.ok(!verified(typedResult(turn, answer)), answer);
    if (reason) assert.ok([reason, null].includes(wrongReason(turn, answer)), answer);
  }
  // German orders stay verified.
  for (const [turn, answer] of [[at(7)[3], 'Du tanzt gern?'], [at(8)[1], 'Weißt du, wie spät es ist?'],
    [at(10)[2], 'Um wie viel Uhr fährt der Zug ab?'], [at(1)[1], 'Ich heiße Omar Omar.']]) assert.ok(verified(typedResult(turn, answer)), answer);
  // German, no answer of the turn word for word (section D): BEYOND, never WRONG.
  assert.equal(typedResult(at(4)[0], 'Was ist das denn?'), RESULT.CORRECT);
});

test('a word said again after a comma or a sentence end is German, no repetition fault (Rule 4 corrected, the review of 46c7ca80, 2026-11-23)', () => {
  // Generated over every turn of every sitting, from each verified answer: (i) the word before a comma or a sentence end
  // said again after it never trips the repetition check; (ii) a first word said twice („Ja, ja, gern.“) and a pronoun
  // picked up after „Und du?“ („Und du? Du tanzt gern?“) are never WRONG (section D: BEYOND where no answer of the turn has them).
  const fold = (w) => w.toLocaleLowerCase('de').replace(/[.,!?;:„“"()]+/g, '').replace(/ß/g, 'ss');
  const small = (w) => (/^(?:Sie|Ihnen|Ihr|Ihre|Ihren)$/.test(w) || lexicon.genders.has(fold(w)) || lexicon.names.has(fold(w)) || !(lexicon.has(fold(w)) || lexicon.said.has(fold(w))) ? w : w.toLocaleLowerCase('de'));
  const cap = (w) => w.charAt(0).toLocaleUpperCase('de') + w.slice(1);
  const verified = (r) => r === RESULT.CORRECT || r === RESULT.TYPO;
  let [again, first, echo] = [0, 0, 0];
  for (const l of withCheck) {
    for (let r = 0; r < retakes(l.guided.check); r += 1) {
      sitting(l, r).forEach((turn, i) => {
        if (turn.listen) return; // a note of a heard time is written, not said
        const where = `${l.id} sitting ${r + 1} turn ${i + 1}`;
        const bases = new Set(turn.accepted.map((x) => (typeof x === 'string' ? x : x.frame).replace(/…/g, 'Omar')));
        if (typeof modelAnswer(turn) === 'string') bases.add(modelAnswer(turn).replace(/…/g, 'Omar'));
        for (const base of bases) {
          if (!verified(typedResult(turn, base))) continue;
          const words = base.split(/\s+/);
          words.forEach((w, k) => {
            const bare = w.replace(/[.,!?;:]+$/, '');
            if (k + 1 >= words.length || !/\p{L}/u.test(bare) || !/[.,!?]$/.test(w)) return;
            const answer = /,$/.test(w) ? [...words.slice(0, k + 1), `${small(bare)},`, ...words.slice(k + 1)].join(' ')
              : [...words.slice(0, k + 1), `${cap(bare)},`, small(words[k + 1]), ...words.slice(k + 2)].join(' ');
            again += 1;
            assert.notEqual(sequenceFault(turn, answer), 'extra', `${where}: ${answer}`);
            if (k === 0 && /,$/.test(w)) { first += 1; assert.notEqual(typedResult(turn, answer), RESULT.WRONG, `${where}: ${answer}`); }
          });
          const q = base.match(/^(\p{Lu}\p{L}*)\s+(du|Sie)\s+(.*\?)$/u);
          if (q && !/^(?:wie|was|wo|woher|wohin|wann|wer|welche[nrs]?)$/i.test(q[1])) {
            const answer = `Und ${q[2]}? ${cap(q[2])} ${q[1].toLocaleLowerCase('de')} ${q[3]}`;
            echo += 1;
            if (requiresVerbFirst(turn)) assert.equal(typedResult(turn, answer), RESULT.WRONG, `${where}: requested verb-first form`);
            else assert.notEqual(typedResult(turn, answer), RESULT.WRONG, `${where}: ${answer}`);
          }
        }
      });
    }
  }
  assert.ok(again >= 200 && first >= 100 && echo >= 20, `${again} said again, ${first} first words, ${echo} echoes`);
  // The review's own: German, verified; with nothing between, the fault.
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  for (const [nr, t, answer] of [[1, 3, 'Sehr, sehr gut, danke.'], [1, 3, 'Danke, danke. Mir geht es gut.'], [1, 3, 'Gut, gut. Danke.'], [1, 3, 'Mir geht es gut. Gut, danke.'],
    [8, 4, 'Ja, ja, das passt.'], [8, 4, 'Ja, ja, gern.'], [7, 3, 'Und du? Du tanzt gern?'], [7, 3, 'Und du, du tanzt gern?'], [2, 3, 'Und Sie? Sie sind Lehrer?'],
    [7, 2, 'Was machst du am Wochenende gern?']]) assert.notEqual(typedResult(at(nr)[t], answer), RESULT.WRONG, answer);
  assert.notEqual(typedResult(at(9)[3], 'Haben Sie Tee? Tee, bitte.'), RESULT.WRONG);
  for (const [nr, t, answer] of [[8, 4, 'Ja ja, gern.'], [1, 3, 'Gut gut, danke.'], [2, 3, 'Und Und Sie?']]) assert.equal(wrongReason(at(nr)[t], answer), 'extra', answer);
});

test('a gap has a kind (Rule 5, the review of 46c7ca80): a taught word of another kind is never verified in it, one of its kind still is (2026-11-23)', () => {
  // Generated over every gap of every frame of every turn. The kinds are the course's own lists: a day, a number, a piece
  // of furniture, a family member, a function word; for a drink or food the other one too. A frame with two gaps fills
  // the one after „um“/„am“ and gives the other a part of the day. A word no course teaches stays the learner's own
  // (the own-word policy of 2026-11-20) and is not tried here.
  const OTHER = { day: 'Montag', number: 'sieben', furniture: 'einen Tisch', family: 'einen Bruder', function: 'und' };
  const OTHER_FOR = {
    clock: ['day', 'furniture', 'family', 'function'], when: ['furniture', 'family', 'function'], invite: ['furniture', 'family', 'function', 'number'],
    hobby: ['day', 'number', 'furniture', 'family', 'function'], activity: ['day', 'number', 'furniture', 'family', 'function'], adjunct: ['number', 'furniture', 'family', 'function'],
    name: ['number', 'function'], place: ['day', 'number', 'furniture', 'family', 'function'], job: ['day', 'number', 'furniture', 'family', 'function'],
    language: ['day', 'number', 'furniture', 'family', 'function'], color: ['day', 'number', 'furniture', 'family', 'function'], thing: ['day', 'number', 'function'],
    object: ['day', 'number', 'function'], number: ['day', 'furniture', 'family', 'function'], years: ['day', 'furniture', 'family', 'function'], phone: ['day', 'furniture', 'family', 'function'],
  };
  const OWN_FOR = { clock: 'sieben', when: 'am Montag', hobby: 'Sport', adjunct: 'gut', name: 'Omar', job: 'Lehrer', language: 'Deutsch', color: 'rot', thing: 'einen Tisch', object: 'ein Buch', number: 'sieben', years: 'sieben', activity: 'spiele Fußball', place: 'Syrien' };
  const verified = (r) => r === RESULT.CORRECT || r === RESULT.TYPO;
  const cap = (s) => s.replace(/^\p{Ll}/u, (c) => c.toLocaleUpperCase('de'));
  let [other, own] = [0, 0];
  for (const l of withCheck) {
    sitting(l).forEach((turn, i) => {
      for (const a of turn.accepted || []) {
        const frame = typeof a === 'string' ? a : a.frame;
        const gaps = (frame.match(/…/g) || []).length;
        if (!gaps) continue;
        const props = { ...turn, ...(typeof a === 'object' ? a : {}) };
        const slot = props.slot;
        const parts = frame.split('…');
        const glued = /\b(?:um|am)\s*$/i.test(parts[0]) ? 0 : 1;
        const fill = (w) => cap(gaps === 1 ? frame.replace('…', w) : parts.map((p, k) => (k === 0 ? p : `${k - 1 === glued ? w : (k === 1 && !parts[0].trim() ? 'Morgens' : 'morgens')}${p}`)).join(''));
        const kinds = props.thingKind ? [...OTHER_FOR.thing, 'furniture', 'family'] : OTHER_FOR[slot] || [];
        const fillers = kinds.map((k) => (props.negative && ['furniture', 'family'].includes(k) ? OTHER[k].replace('einen', 'keinen') : OTHER[k]));
        if (props.thingKind && !props.thingKind.includes('food')) fillers.push(props.negative ? 'keinen Kuchen' : 'einen Kuchen');
        if (props.thingKind && !props.thingKind.includes('drink')) fillers.push(props.negative ? 'keinen Kaffee' : 'einen Kaffee');
        for (const w of fillers) {
          other += 1;
          assert.ok(!verified(typedResult(turn, fill(w))), `${l.id} turn ${i + 1} [${slot}]: ${fill(w)}`);
        }
        const mine = gaps === 2 ? (glued === 0 || /\b(?:um|am)\s*$/i.test(parts[1]) ? 'sieben' : 'am Montag') : props.thingKind ? (props.thingKind.includes('drink') ? 'einen Kaffee' : 'einen Kuchen') : OWN_FOR[slot];
        if (!mine || props.when || props.time || props.only || props.negative || props.people || props.count === 'many' || props.slotIn || props.taught || props.partOfDay) continue;
        own += 1;
        assert.ok(verified(typedResult(turn, fill(mine))), `${l.id} turn ${i + 1} [${slot}]: ${fill(mine)}`);
      }
    });
  }
  assert.ok(other >= 600 && own >= 80, `${other} of another kind, ${own} of the gap's kind`);
  // The review's faults, each named; the fair ones stay verified.
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  for (const [nr, t, answer, reason] of [[8, 2, 'Um Montag stehe ich auf.', 'article'], [8, 2, 'Ich stehe morgens um und auf.', 'missing'], [11, 3, 'Morgens stehe ich um und auf.', 'missing'],
    [8, 5, 'Ich habe sieben Zeit.', 'missing'], [8, 5, 'Ich bin sieben frei.', 'missing'], [7, 0, 'Mein Hobby ist Montag.', 'kind'], [7, 0, 'Mein Hobby ist Tisch.', 'kind'],
    [7, 0, 'Ich spiele gern Tisch.', 'kind'], [11, 0, 'Ich habe einen Tisch gearbeitet.', 'kind'], [11, 0, 'Ich habe einen Bruder gearbeitet.', 'kind'], [12, 0, 'Kommst du sieben?', 'missing'],
    [12, 0, 'Komm sieben!', 'missing'], [12, 0, 'Ich lade dich sieben ein.', 'missing'], [9, 1, 'Ich möchte einen Tisch, bitte.', 'kind'], [9, 1, 'Ich trinke einen Tisch.', 'kind'],
    [9, 1, 'Ich möchte einen Bruder, bitte.', 'kind'], [9, 2, 'Ich möchte einen Tisch, bitte.', 'kind'], [9, 2, 'Ich möchte eine Lampe, bitte.', 'kind'], [6, 3, 'Ich heiße sieben.', 'kind']]) {
    assert.equal(refused(at(nr)[t], answer), RESULT.WRONG, answer);
    assert.ok([reason, null].includes(wrongReason(at(nr)[t], answer)), answer);
  }
  for (const [nr, t, answer] of [[11, 0, 'Ich habe sieben gearbeitet.'], [7, 0, 'Ich spiele gern Montag.'], [9, 4, 'Ja, Montag.']]) assert.ok(!verified(typedResult(at(nr)[t], answer)), answer);
  for (const [nr, t, answer] of [[8, 5, 'Ich habe Montag Zeit.'], [11, 0, 'Ich habe gut gearbeitet.'], [11, 0, 'Ich habe Montag gearbeitet.'], [11, 0, 'Ich habe den ganzen Tag gearbeitet.'],
    [12, 4, 'Ich möchte einen Bruder.'], [3, 1, 'Sie ist sieben.'], [10, 3, 'Kostet die Fahrkarte sieben Euro?'], [8, 2, 'Um sieben stehe ich auf.'], [8, 5, 'Am Dienstag habe ich um sieben Zeit.'],
    [9, 1, 'Ich möchte einen Kaffee, bitte.'], [9, 2, 'Ich möchte einen Kuchen, bitte.'], [12, 0, 'Kommst du am Samstag?']]) assert.ok(verified(typedResult(at(nr)[t], answer)), answer);
});

test('CORRECT is a word-for-word match (section D, the review of 46c7ca80): every verified answer, mutated, is verified only as an accepted answer or by a named rule (2026-11-23)', () => {
  // Generated over every turn of every sitting (a sitting whose turn has the same answers as an earlier one is read
  // once): each verified answer with one word deleted, a taught word inserted at each place (a function word, a noun,
  // an adjective, a pronoun, „nicht“), one word replaced by a taught word of another kind, one word doubled, two
  // neighbours swapped. A verified mutant is an accepted answer (a fixed answer, or a frame of the turn filled), came by a
  // path the checker names (`verifiedRule`: the partner, a declared option, answer words …), or is German by one of the
  // rules below, each counted. An order rule explains a change of order only.
  const FILL = { clock: 'sechs Uhr', when: 'am Montag', place: 'Bremen', thing: 'einen Kaffee', object: 'ein Buch', hobby: 'Fußball', job: 'Lehrer', language: 'Arabisch', number: 'sieben', years: 'dreißig', color: 'blau', name: 'Omar', month: 'Mai', activity: 'schwimme', adjunct: 'viel', invite: 'am Samstag', past: 'habe gearbeitet', phone: '0421 3618', date: '3.5.1998' };
  const INS = ['und', 'Tisch', 'gut', 'ich', 'nicht'];
  const REP = ['Tisch', 'und', 'arbeiten', 'gut', 'Montag', 'sieben', 'der'];
  const fold = (s) => String(s).toLocaleLowerCase('de').replace(/[.,!?;:„“"()]/g, '').replace(/ß/g, 'ss');
  const norm = (s) => String(s).toLocaleLowerCase('de').replace(/[.,!?;:„“"()]/g, ' ').replace(/\s+/g, ' ').trim();
  const DAYS = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
  const ARTICLE = /^(?:der|die|das|den|dem|ein|eine|einen|einem|einer)$/;
  const TIME = new Set(['wochenende', 'abend', 'morgen', 'nachmittag', 'vormittag', 'morgens', 'abends', 'nachmittags', 'vormittags', 'heute', 'gestern', 'dann']);
  const ADVERB = new Set(['gern', 'gerne', 'gut', 'oft', 'viel', 'immer']);
  const DETERMINER = /^(?:der|die|das|den|dem|ein|eine|einen|einem|einer|mein|meine|meinen|dein|deine|deinen|sein|seine|ihr|ihre)$/;
  const ORDER = new Set(['verb second', 'statement order', 'gern position', 'time after Zeit']);
  const classOf = (w) => {
    const f = fold(w);
    if (/^\d+$/.test(numberWordsToDigits(f)) && !ARTICLE.test(f)) return 'number';
    if (DAYS.includes(f.replace(/s$/, '')) || TIME.has(f)) return 'time';
    if (ADVERB.has(f)) return 'adverb';
    if (DETERMINER.test(f)) return 'article';
    return /^\p{Lu}/u.test(w) && lexicon.genders.has(f) ? 'noun' : null;
  };
  const nameWord = (x) => /^\p{Lu}/u.test(x || '') && (lexicon.names.has(fold(x)) || (!lexicon.genders.has(fold(x)) && !lexicon.has(fold(x))));
  const german = (turn, kind, base, i, oldWord, newWord) => {
    const w = base.split(/\s+/);
    const bare = (x) => String(x || '').replace(/[,.!?]+$/, '');
    const verbAt = (k) => Boolean(lexicon.verbs.has(fold(w[k] || '')) || /^(?:spricht|spreche|kann|habe|schwimme|bin|ist|geht)$/.test(fold(w[k] || '')));
    if (kind === 'replace') {
      if (classOf(oldWord) && classOf(oldWord) === classOf(newWord)) return `another ${classOf(oldWord)}`; // „sieben“ for „sechs“
      if (classOf(newWord) === 'time' && (['adverb', 'time', 'article'].includes(classOf(oldWord)) || fold(oldWord) === 'nicht')) return 'a day as the time'; // „Ich habe Montag gearbeitet“
      if (classOf(oldWord) === 'article' && classOf(newWord) === 'number') return 'a count'; // „sieben Computer“
    }
    if (kind === 'delete') {
      const gone = fold(w[i]);
      const next = bare(w[i + 1]);
      if (gone === 'uhr' && /^\d+$/.test(numberWordsToDigits(fold(w[i - 1] || '')))) return 'Uhr after the hour';
      if (ARTICLE.test(gone) && /^\p{Lu}/u.test(next)) return 'no article (a mass noun, a plural, a day)';
      if (gone === 'am' && DAYS.includes(fold(next))) return 'a day without am';
      if (['danke', 'bitte', 'ja', 'hallo'].includes(gone)) return 'a word of politeness left out';
      if (TIME.has(gone) || ADVERB.has(gone)) return 'a time or an adverb left out';
      if (nameWord(w[i]) && (nameWord(w[i - 1]) || nameWord(bare(w[i + 1])))) return 'an own name, shorter';
      if (/^\p{Lu}/u.test(w[i]) && i === w.length - 1 && w.some((x) => /^(?:spiel|koch|les|ess|trink|tanz|schwimm|arbeit|lern|sing)\p{L}*$/iu.test(bare(x)))) return 'the verb alone';
    }
    const firstVerb = w.findIndex((x, k) => verbAt(k));
    if (kind === 'insert' && newWord === 'nicht' && firstVerb >= 0 && i > firstVerb) return 'negation';
    if (kind === 'insert' && newWord === 'gut' && (i >= w.length - 1 || (i > 0 && verbAt(i - 1)))) return 'gut, how it is done';
    if (kind === 'double') return 'an own name twice';
    if (kind === 'swap' && nameWord(oldWord) && nameWord(newWord)) return 'an own name, other order';
    // A word the turn declares to open its answer, in front („Gut, Montag komme ich mit.“).
    if (i === 0 && [...(turn.answerWords || []), ...(turn.leadWords || [])].some((x) => fold(x) === fold(newWord || ''))) return 'an opening word of the turn';
    return null;
  };
  const tally = {};
  const unexplained = [];
  const read = new Set();
  let tried = 0;
  for (const l of withCheck) {
    for (let r = 0; r < retakes(l.guided.check); r += 1) {
      sitting(l, r).forEach((turn, t) => {
        if (turn.spell || turn.listen) return;
        const key = `${l.nr}/${t}/${JSON.stringify(turn.accepted)}/${turn.when}/${turn.time}/${turn.only}/${turn.thingKind}/${turn.slot}`;
        if (read.has(key)) return;
        read.add(key);
        const fixed = new Set((turn.accepted || []).filter((a) => typeof a === 'string' && !a.includes('…')).map(norm));
        const frames = (turn.accepted || []).map((a) => (typeof a === 'string' ? a : a.frame)).filter((f) => f.includes('…'));
        const filled = new Set(frames.flatMap((f) => Object.values(FILL).map((v) => norm(f.replace(/…/g, v)))));
        const bases = new Set((turn.accepted || []).map((a) => (typeof a === 'string' ? a : a.frame).replace(/…/g, FILL[(typeof a === 'object' && a.slot) || turn.slot || 'name'] || 'Omar')));
        if (typeof modelAnswer(turn) === 'string') bases.add(modelAnswer(turn).replace(/…/g, 'Omar'));
        const seen = new Set();
        for (const base of bases) {
          if (!verifiedRule(turn, base)) continue;
          const w = base.split(/\s+/);
          const split = (x) => { const b = x.replace(/[,.!?]+$/, ''); return [b, x.slice(b.length)]; };
          const mutants = [];
          w.forEach((x, i) => {
            const [b, p] = split(x);
            if (!/\p{L}/u.test(b)) return;
            if (w.length > 1) mutants.push(['delete', [...w.slice(0, i), ...w.slice(i + 1)].join(' '), i, b, null]);
            for (const y of REP) if (y.toLowerCase() !== b.toLowerCase()) mutants.push(['replace', [...w.slice(0, i), y + p, ...w.slice(i + 1)].join(' '), i, b, y]);
            mutants.push(['double', [...w.slice(0, i), b, x, ...w.slice(i + 1)].join(' '), i, b, b]);
            if (i + 1 < w.length) {
              const [c, q] = split(w[i + 1]);
              if (c.toLowerCase() !== b.toLowerCase()) mutants.push(['swap', [...w.slice(0, i), c + p, b + q, ...w.slice(i + 2)].join(' '), i, b, c]);
            }
          });
          for (let i = 1; i <= w.length; i += 1) {
            for (const y of INS) {
              if (i === w.length) { const [b, p] = split(w[i - 1]); mutants.push(['insert', [...w.slice(0, i - 1), b, y + p].join(' '), i, null, y]); } else mutants.push(['insert', [...w.slice(0, i), y, ...w.slice(i)].join(' '), i, null, y]);
            }
          }
          for (const [kind, m, i, oldWord, newWord] of mutants) {
            if (seen.has(m) || bases.has(m)) continue;
            seen.add(m);
            tried += 1;
            const rule = verifiedRule(turn, m);
            if (!rule) continue;
            let why = fixed.has(norm(m)) || filled.has(norm(m)) ? 'accepted' : rule;
            if (why === 'as typed' || why === 'spelling' || (ORDER.has(why) && kind !== 'swap')) why = german(turn, kind, base, i, oldWord, newWord) || 'unexplained';
            tally[why] = (tally[why] || 0) + 1;
            if (why === 'unexplained') unexplained.push(`${l.id} sitting ${r + 1} turn ${t + 1} (${kind}): ${m}   <= ${base}`);
          }
        }
      });
    }
  }
  assert.ok(tried >= 10000, `${tried} mutants`);
  assert.deepEqual(unexplained.slice(0, 25), [], `${unexplained.length} verified mutants no rule explains; per rule: ${JSON.stringify(tally)}`);
});

test('the spoken path (section D): every model and fixed answer of every spoken turn, written as a speech recogniser writes it, is verified (2026-11-23)', () => {
  // No punctuation, a small first letter, all small, digits for numbers („2 Kaffee“, „1 Buch“), „8:30“, „mach es gut“.
  const forms = (s) => {
    const plain = s.replace(/[’']s\b/g, ' es').replace(/[.,!?;:„“"()–]/g, ' ').replace(/\s+/g, ' ').trim();
    const small = plain.charAt(0).toLocaleLowerCase('de') + plain.slice(1);
    const digits = numberWordsToDigits(small).replace(/(?<!\p{L})(?:ein|eine|einen|einem)\s+(?=\p{Lu})/gu, '1 ');
    return [...new Set([small, small.toLocaleLowerCase('de'), digits, digits.replace(/\b(\d{1,2})\s+uhr\s+(\d{1,2})\b/gi, '$1:$2')])];
  };
  const missed = [];
  let tried = 0;
  for (const l of withCheck) {
    for (let r = 0; r < retakes(l.guided.check); r += 1) {
      sitting(l, r).forEach((turn, t) => {
        if (turn.write || turn.spell || turn.listen || turn.parts) return;
        const models = new Set([String(modelAnswer(turn)).replace(/…/g, 'Omar'), ...(turn.ownName ? [] : turn.accepted || []).filter((a) => typeof a === 'string' && !a.includes('…'))]);
        for (const model of models) {
          for (const said of forms(model)) {
            tried += 1;
            if (!verifiedResult(typedResult(turn, said))) missed.push(`${l.id} sitting ${r + 1} turn ${t + 1}: ${said} (${model})`);
          }
        }
      });
    }
  }
  assert.ok(tried >= 1000, `${tried} spoken forms`);
  assert.deepEqual(missed, []);
});

test('„ein Uhr“ after a time word is one o\'clock; a hint of „nichts/alles/beides“ never turns an unsure answer wrong (round 4)', () => {
  const at = (nr, r = 0) => sitting(CURRICULUM_A11.lektionen[nr - 1], r);
  assert.equal(typedResult(at(11)[3], 'Ich stehe um ein Uhr auf.'), RESULT.CORRECT);
  assert.equal(typedResult(at(8)[1], 'Wie spät ist es? Ist es ein Uhr?'), RESULT.CORRECT);
  // „ein Uhr“ as a thing is still the wrong article („eine Uhr“).
  assert.equal(typedResult(at(8)[1], 'Hast du ein Uhr? Wie spät ist es?'), RESULT.WRONG);
  // The off-task answer reads the task again; its article is not at fault.
  assert.equal(faultHintKey(at(11)[0], 'Ich stehe um ein Uhr auf.'), 'check.fault.task');
  // Natural answers with „alles“ or „beides“ stay unjudged rather than told to read the task.
  assert.equal(typedResult(at(9)[0], 'Ja, beides!'), BEYOND);
  assert.equal(typedResult(at(1)[4], 'Ist bei Ihnen alles gut?'), BEYOND);
});

test('what one eats is food and what one drinks a drink; one reads and hears neither (Codex score of f0847faa, BLOCKER)', () => {
  const weekend = sitting(CURRICULUM_A11.lektionen[6])[1];
  const verified = (r) => r === RESULT.CORRECT || r === RESULT.TYPO;
  const drinks = ['Kaffee', 'Tee', 'Wasser', 'Milch', 'Orangensaft'];
  const foods = ['Kuchen', 'Suppe', 'Salat', 'Brot'];
  const things = ['Musik', 'Fußball', 'Tisch', 'Lampe'];
  for (const d of drinks) assert.ok(verified(typedResult(weekend, `Ich trinke gern ${d}.`)), `trinken ${d}`);
  for (const f of foods) assert.ok(verified(typedResult(weekend, `Ich esse gern ${f}.`)), `essen ${f}`);
  for (const f of [...foods, ...drinks]) assert.ok(verified(typedResult(weekend, `Ich koche gern ${f}.`)) || typedResult(weekend, `Ich koche gern ${f}.`) === BEYOND, `kochen ${f}`);
  // A noun the course teaches outside its food and drink is neither; within that Lektion's words the check does not judge.
  for (const w of things) assert.ok(!verified(typedResult(weekend, `Ich esse gern ${w}.`)), `essen ${w}`);
  for (const w of things) assert.ok(!verified(typedResult(weekend, `Ich trinke gern ${w}.`)), `trinken ${w}`);
  for (const w of [...foods, ...drinks]) {
    assert.ok(!verified(typedResult(weekend, `Ich lese gern ${w}.`)), `lesen ${w}`);
    assert.ok(!verified(typedResult(weekend, `Ich höre gern ${w}.`)), `hören ${w}`);
  }
  assert.equal(typedResult(weekend, 'Ich esse gern Musik.'), RESULT.WRONG);
  assert.equal(faultHintKey(weekend, 'Ich esse gern Musik.'), 'check.fault.word');
  // The learner's own food is no fault, and the taught pairs stay right.
  for (const right of ['Ich esse gern Pizza.', 'Ich höre gern Musik.', 'Ich lese gern Bücher.']) assert.ok(verified(typedResult(weekend, right)), right);
  // A noun only an answer says is the learner's own („Alkohol“, „Schokolade“ are no Wortfeld words).
  const decline = sitting(CURRICULUM_A11.lektionen[8], 2)[5];
  assert.ok(verified(typedResult(decline, 'Nein, danke, ich trinke keinen Alkohol.')));
});

test('„Wann arbeitest du?“: one without paid work says so, and it is an answer (Codex score of f0847faa, MAJOR)', () => {
  const when = sitting(CURRICULUM_A11.lektionen[10])[4];
  const verified = (r) => r === RESULT.CORRECT || r === RESULT.TYPO;
  assert.match(when.taskEn, /when you work/i);
  for (const right of ['Ich bin Rentner.', 'Ich bin Rentnerin.', 'Ich bin pensioniert.', 'Ich bin in Rente.', 'Ich bin Student.', 'Ich bin Schülerin.',
    'Ich gehe noch zur Schule.', 'Ich studiere und arbeite nicht.', 'Ich bin arbeitslos.', 'Ich habe keine Arbeit.', 'Ich arbeite nicht.']) {
    assert.ok(verified(typedResult(when, right)), right);
  }
  // A job is no time, and the status of someone else is not the learner's.
  for (const wrong of ['Ich bin Lehrer.', 'Du bist Rentner.']) assert.ok(!verified(typedResult(when, wrong)), wrong);
});

test('the partner\'s name is not one\'s own (Claude score of f0847faa)', () => {
  const verified = (r) => r === RESULT.CORRECT || r === RESULT.TYPO;
  const name = sitting(CURRICULUM_A11.lektionen[0])[1];
  for (const wrong of ['Ich heiße Frau Kaya.', 'Ich bin Frau Kaya.']) assert.equal(faultHintKey(name, wrong), 'check.fault.task', wrong);
  for (const right of ['Ich heiße Ana.', 'Guten Tag, Frau Kaya! Ich heiße Ana.']) assert.ok(verified(typedResult(name, right)), right);
});

test('a message checks every sentence like a single turn, with unsupported additions unverified', () => {
  const message = sitting(l2)[6];
  const base = 'Ich heiße Omar. Ich bin am 3.5.1998 geboren.';
  assert.equal(typedResult(sitting(l2)[2], 'Ich bin ein Lehrer.'), RESULT.CORRECT);
  for (const tail of ['Ich komme von Syrien.', 'Ich habe 30 Jahre.', 'Ich wohne aus Berlin.', 'Ich bin ein Lehrerin.']) {
    assert.equal(verifiedResult(typedResult(message, base + ' ' + tail)), false, tail);
  }
  for (const tail of ['Ich komme aus Syrien.', 'Ich wohne in Berlin.', 'Ich bin ein Lehrer.', 'Meine Telefonnummer ist 030 12345678.']) assert.equal(typedResult(message, base + ' ' + tail), RESULT.CORRECT, tail);
  assert.equal(verifiedResult(typedResult(message, base + ' Ich blable heute.')), false);
  assert.equal(verifiedResult(typedResult(message, 'Ich komme von Syrien. ' + base)), false);
});

test('clock expressions use the same rules in every turn and retake', () => {
  const lesson = CURRICULUM_A11.lektionen[7];
  for (let s = 0; s < 3; s += 1) {
    const time = sitting(lesson, s)[0];
    const extras = ['Es ist dreißig nach acht.', 'Es ist halb sieben Uhr.', 'Es ist Viertel nach sieben Uhr.'];
    for (const answer of extras) assert.equal(verifiedResult(typedResult(time, answer)), false, answer);
  }
  const note = sitting(lesson, 1)[6];
  assert.equal(typedResult(note, 'Freitag, Viertel nach vier'), RESULT.CORRECT);
  assert.equal(typedResult(note, 'Freitag, nachmittags um Viertel nach vier'), RESULT.CORRECT);
  assert.equal(verifiedResult(typedResult(note, 'Freitag, morgens um Viertel nach vier')), false);
});

test('checking message sentences preserves passive birth clauses and standard letter greetings', () => {
  const turn = sitting(l2)[6];
  for (const answer of [
    'Ich heiße Huda Salem und wurde am 11.12.1992 geboren.',
    'Sehr geehrte Damen und Herren, mein Name ist Rosa Vega. Ich bin am 08.02.1983 geboren. Mit freundlichen Grüßen Rosa Vega',
    'Sehr geehrter Herr Weber, mein Name ist Tran Linh. Ich bin am 30. März 1996 in Hanoi geboren.',
    'Sehr geehrter Herr Weber, mein Name ist Tran. Ich bin am 30. März 1996 in Hanoi geboren.',
  ]) assert.equal(typedResult(turn, answer), RESULT.CORRECT, answer);
});

test('message feedback agrees with its result, incomplete dates stay whole, and signatures cannot hide clauses', () => {
  const message = sitting(l2)[6];
  const start = 'Ich heiße Omar. Ich bin am 3.5.1998 geboren. ';
  for (const closing of ['Viele Grüße, Omar', 'Viele Gruesse, Omar', 'Mit freundlichen Grüßen.']) assert.equal(typedResult(message, start + closing), RESULT.CORRECT, closing);
  for (const answer of ['Ich heiße Omar. Ich bin am 12.03. geboren.', 'Ich bin am 3.5.1998 geboren.']) {
    assert.equal(typedResult(message, answer), RESULT.WRONG, answer);
    assert.equal(wrongReason(message, answer), 'message', answer);
  }
  for (const ending of ['Viele Gruesse, Omar, ich komme von Syrien.', 'Viele Grüße, Omar und ich habe 30 Jahre.']) {
    const result = typedResult(message, start + ending);
    assert.ok(!verifiedResult(result), ending);
    assert.equal(Boolean(wrongReason(message, start + ending)), result === RESULT.WRONG, ending);
  }
});

test('fronted participles keep their correct case classification when a frame normalizes word order', () => {
  const message = sitting(l2)[6];
  const part = message.parts[1];
  const born = { ...message, parts: null, extras: null, ...part[0], accepted: part };
  assert.equal(typedResult(born, 'Geboren wurde ich am 23. März 1997.'), RESULT.CORRECT);
  assert.equal(typedResult(message, 'Ich bin Salma Amin. Geboren wurde ich am 23. März 1997.'), RESULT.CORRECT);
  assert.equal(typedResult(sitting(CURRICULUM_A11.lektionen[10])[0], 'Gearbeitet habe ich gestern.'), RESULT.CORRECT);
  assert.equal(typedResult(born, 'geboren wurde ich am 23. März 1997.'), RESULT.TYPO);
  assert.equal(typedResult(born, 'Geboren Wurde ich am 23. März 1997.'), RESULT.TYPO);
});

test('Phase 2b: individual evidence excludes a reveal, also after saving and resuming', async () => {
  const { packRun, unpackRun } = await import('../src/lib/lesson/runState.js');
  const turns = checkTurns({ ...CURRICULUM_A11.lektionen[0].guided.check, lexicon: courseLexicon(CURRICULUM_A11) }, 0);
  const outcomes = turns.map(() => ({ outcome: 'shown', revealed: false }));
  const spelling = turns.findIndex((turn) => turn.spell);
  assert.ok(spelling >= 0);
  assert.equal(typedResult(turns[spelling], turns[spelling].accepted[0]), RESULT.CORRECT);
  outcomes[spelling] = { outcome: 'practised', revealed: true, answer: 'never retain this' };
  const saved = packRun({ flow: 'guided', stageKey: 'check', check: { retake: 0, outcomes } }, 1000);
  const resumed = unpackRun(saved, 1001, 'guided');
  assert.deepEqual(resumed.check.outcomes[spelling], { outcome: 'practised', revealed: true });
  assert.equal(JSON.stringify(saved).includes('never retain this'), false);
  assert.equal(canDoShown(turns, resumed.check.outcomes, 4)[turns[spelling].canDo], false);
  outcomes[spelling] = { outcome: 'shown', revealed: false };
  assert.ok(canDoShown(turns, outcomes, 4).every(Boolean));
  assert.deepEqual(canDoShown([], [], 1), [false], 'no turn is no evidence');
});

test('Phase 2b: the task distinguishes naming a purchase from choosing whether to buy', () => {
  const lexicon = courseLexicon(CURRICULUM_A11);
  const turn = checkTurns({ ...CURRICULUM_A11.lektionen[3].guided.check, lexicon }, 0).find((t) => t.taskEn.startsWith('Say what you are buying'));
  const whether = { ...turn, taskEn: 'Say whether you are buying anything, in one sentence.', taskDe: 'Sagen Sie in einem Satz, ob Sie etwas kaufen.' };
  for (const answer of ['Ich kaufe nichts.', 'Heute kaufe ich nichts.']) {
    assert.equal(typedResult(turn, answer), RESULT.WRONG);
    assert.equal(faultHintKey(turn, answer), 'check.fault.task', 'German is fine; it names no purchase');
    assert.equal(typedResult(whether, answer), RESULT.CORRECT, 'a whether-task permits buying nothing');
  }
  assert.equal(typedResult(turn, 'Heute kaufe ich den Stuhl.'), RESULT.CORRECT);
  assert.equal(typedResult(whether, 'Heute ich kaufe nichts.'), RESULT.WRONG);
});

test('Phase 2b: a payment question can ask the current price without repeating the object', () => {
  const lexicon = courseLexicon(CURRICULUM_A11);
  for (const nr of [4, 10]) {
    const turn = checkTurns({ ...CURRICULUM_A11.lektionen[nr - 1].guided.check, lexicon }, 0).find((t) => t.taskEn === (nr === 4 ? 'Ask what it costs.' : 'Ask what the ticket costs.'));
    for (const answer of ['Was muss ich bezahlen?', 'Wie viel muss ich bezahlen?', 'Was muss ich zahlen?']) assert.equal(typedResult(turn, answer), RESULT.CORRECT, answer);
    for (const answer of ['Was ich muss bezahlen?', 'Was muss ich bezahle?']) assert.notEqual(typedResult(turn, answer), RESULT.CORRECT, answer);
  }
});

test('Phase 2b: correct determiners with subject-number errors receive the verb hint', () => {
  const lexicon = courseLexicon(CURRICULUM_A11);
  for (const [nr, task, bad, good] of [
    [5, 'Say what colour your exercise book is, in one sentence.', 'Mein Heft sind blau.', 'Mein Heft ist blau.'],
    [12, 'Say who is coming to your party, in one sentence.', 'Meine Eltern kommt.', 'Meine Eltern kommen.'],
  ]) {
    const turn = checkTurns({ ...CURRICULUM_A11.lektionen[nr - 1].guided.check, lexicon }, 0).find((t) => t.taskEn === task);
    assert.equal(typedResult(turn, bad), RESULT.WRONG);
    assert.equal(faultHintKey(turn, bad), 'check.fault.verb');
    assert.equal(typedResult(turn, good), RESULT.CORRECT);
  }
  const turn = checkTurns({ ...CURRICULUM_A11.lektionen[11].guided.check, lexicon }, 0).find((t) => t.people);
  assert.equal(faultHintKey(turn, 'Mein Eltern kommt.'), 'check.fault.article', 'a wrong determiner still gets its own hint');
});
