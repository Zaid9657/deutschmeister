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
  for (const right of ['Ich wohne jetzt in Köln.', 'Jetzt wohne ich in Köln.', 'Ich wohne hier in Bremen.', 'In Bremen wohne ich.']) assert.equal(typedResult(home, right), RESULT.CORRECT, right);
  assert.equal(typedResult(origin, 'Aus Syrien komme ich.'), RESULT.CORRECT);
  assert.equal(typedResult(origin, 'Aus Syrien ich komme.'), RESULT.WRONG, 'the verb must be second');
  // A name as Lektion 1 takes it; a job is no name.
  assert.equal(typedResult(message, 'Ich bin Omar. Ich bin am 3.5.1990 geboren.'), RESULT.CORRECT);
  assert.equal(typedResult(message, 'Ich bin Lehrer. Ich bin am 3.5.1990 geboren.'), RESULT.WRONG);
  // A second clause after „und" that opens with a taught verb (DaF review); a country is still no language.
  assert.equal(typedResult(own, 'Ich spreche Arabisch und lerne Deutsch.'), RESULT.CORRECT);
  assert.equal(typedResult(own, 'Ich spreche Arabisch und Marokko.'), RESULT.WRONG);
  // What was working keeps working.
  assert.equal(typedResult(origin, 'Ich kommen aus Syrien.'), RESULT.WRONG);
  assert.equal(typedResult(job, 'Ich bin müde.'), RESULT.WRONG);
  assert.equal(typedResult(number, '0421 3619'), RESULT.WRONG);
  assert.equal(typedResult(number, '٠٤٢١٣٦١٨'), RESULT.CORRECT);
  assert.equal(typedResult(message, 'Ich bin am 3.5.1990 geboren.'), RESULT.WRONG, 'the name part is missing');
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
  for (const wrong of ['Das sind ein Stift.', 'Das ist meine Bücher.', 'Das ist ein Heft und ein Stift.', 'Das ist Heft.', 'Das ist ein Schere.', 'Das ist blau.']) assert.equal(typedResult(what, wrong), RESULT.WRONG, wrong);
  assert.equal(typedResult(where, 'Das ist hier.'), RESULT.CORRECT);
  assert.equal(typedResult(askColour, 'Ist die Tasche rot?'), RESULT.CORRECT);
  assert.equal(typedResult(askColour, 'Ist der Tasche rot?'), RESULT.WRONG);
  // Lektion 6: a „wo?" question asks where; a surname may be a taught word; the model answer is Lektion 1's.
  const [, office, , phoneName] = l6;
  for (const notWhere of ['Ist das mein Büro?', 'Und mein Büro?']) assert.equal(typedResult(office, notWhere), RESULT.WRONG, notWhere);
  for (const right of ['Hier ist Frau Braun.', 'Ich heiße Ana Braun.', 'Guten Tag, ich heiße Zaid.', 'Zaid Ahmad.']) assert.equal(typedResult(phoneName, right), RESULT.CORRECT, right);
  for (const wrong of ['Gut.', 'Danke.', 'Hier ist Lehrer.', 'Hier ist Frau.', 'Guten Morgen.', 'Hier ist Büro.']) assert.equal(typedResult(phoneName, wrong), RESULT.WRONG, wrong);
  assert.equal(modelAnswer(phoneName), 'Guten Tag, ich heiße Ana Chakiri.');
  // The first blind corpus (2026-11-20): a name before the greeting, an inflected colour, a noun typed
  // without its umlaut, the noun named first.
  for (const right of ['Samira Haddad, guten Tag.', 'youssef benali, guten tag.']) assert.notEqual(typedResult(phoneName, right), RESULT.WRONG, right);
  assert.equal(typedResult(phoneName, 'Guten Morgen, guten Tag.'), RESULT.WRONG);
  const colour = l5[3];
  assert.equal(typedResult(colour, 'Mein Heft ist rote.'), RESULT.WRONG, 'after „ist" the colour has no ending');
  assert.equal(typedResult(colour, 'Mein Heft ist rot.'), RESULT.CORRECT);
  assert.equal(typedResult(where, 'das worterbuch ist hier.'), RESULT.TYPO, 'a missing umlaut is a typo, not a wrong noun');
  assert.equal(typedResult(askColour, 'Und deine Tasche, welche Farbe hat sie?'), RESULT.CORRECT);
  assert.equal(typedResult(l4[0], 'Was ist denn das?'), RESULT.CORRECT);
  assert.equal(typedResult(sitting(l3)[4], 'Ich spreche Deutsche.'), RESULT.WRONG, 'a taught language with an ending is a form, not an own word');
  // The second blind corpus (2026-11-20): what comes around a right answer, and prices.
  const [whatIsIt, askPrice, price, , total] = l4;
  for (const right of ['Guten Tag! Was ist das da?', 'Frau Wolf, was ist das hier?', 'frau wolf was ist das', 'Und das hier, was ist das?']) assert.notEqual(typedResult(whatIsIt, right), RESULT.WRONG, right);
  for (const right of ['Und der Stuhl, was kostet der?', 'Die Lampe, wie teuer ist die?']) assert.equal(typedResult(sitting(CURRICULUM_A11.lektionen[3], right.includes('Lampe') ? 1 : 0)[3], right), RESULT.CORRECT, right);
  assert.equal(typedResult(l4[3], 'Der Stuhl, was kostet die?'), RESULT.WRONG, 'the pronoun picks up the noun’s article');
  assert.equal(typedResult(office, 'Wo ist bitte mein Büro?'), RESULT.CORRECT);
  assert.equal(typedResult(office, 'Mein Büro, wo ist das?'), RESULT.CORRECT);
  assert.equal(typedResult(colour, 'Rot ist mein Heft.'), RESULT.CORRECT);
  assert.equal(typedResult(what, 'Ein Lineal ist das.'), RESULT.CORRECT);
  assert.equal(typedResult(where, 'Hier, Lena.'), RESULT.CORRECT, '„Hier," is no name');
  assert.equal(typedResult(sitting(CURRICULUM_A11.lektionen[4], 1)[1], 'Die Schere? Da.'), RESULT.CORRECT);
  assert.equal(typedResult(l6[0], 'Guten Morgen! Ich brauche ein Telefon.'), RESULT.CORRECT);
  assert.equal(typedResult(phoneName, 'Guten Tag, Herr Weber.'), RESULT.WRONG, 'the partner’s name is not the learner’s');
  for (const right of ['18,00 Euro', '18,- €', 'achtzehn Euro']) assert.equal(typedResult(price, right), RESULT.CORRECT, right);
  assert.equal(typedResult(price, '18 Cent'), RESULT.WRONG, 'a price heard in euros');
  assert.equal(typedResult(price, '18,50 Euro'), RESULT.WRONG);
  assert.equal(typedResult(total, '30,00 €'), RESULT.CORRECT);
  assert.equal(typedResult(sitting(CURRICULUM_A11.lektionen[3], 1)[2], 'funfundvierzig euro'), RESULT.CORRECT);
  assert.ok(askPrice.accepted.length);
  // The third blind corpus: the question word last, „Wie viel Euro …", a name „am Telefon".
  assert.equal(typedResult(l4[3], 'Der Stuhl kostet wie viel?'), RESULT.CORRECT);
  assert.equal(typedResult(l4[3], 'Der Stuhl kosten wie viel?'), RESULT.WRONG, 'the words are graded as always');
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
  assert.equal(typedResult(l5b[1], 'Das ist hier.'), RESULT.WRONG, '„das" does not pick up die Schere');
  assert.equal(typedResult(l5b[1], 'Die ist hier.'), RESULT.CORRECT);
  assert.equal(typedResult(l5c[1], 'Der ist da.'), RESULT.CORRECT);
  assert.equal(typedResult(colour, 'Das ist grün.'), RESULT.CORRECT, 'about das Heft');
  assert.equal(typedResult(colour, 'Der ist grün.'), RESULT.WRONG);
  assert.equal(typedResult(l5c[3], 'Der ist blau.'), RESULT.CORRECT, 'about der Stift');
  assert.equal(typedResult(l5b[4], 'Ist dein Stift blau oder schwarz?'), RESULT.CORRECT);
  // A second clause after „und" is part of the answer and must be valid too.
  const own = sitting(l3)[4];
  assert.equal(typedResult(own, 'Ich spreche Arabisch und lerne Deutsch.'), RESULT.CORRECT);
  assert.equal(typedResult(own, 'Ich spreche Arabisch und lerne Studentin.'), RESULT.WRONG);
});

test('a colour is one of the colour words, a thing is a noun, and German of the same meaning passes (courses session, 2026-11-20)', () => {
  const [, askPrice, , , , buy] = sitting(CURRICULUM_A11.lektionen[3]);
  const [what, , , colour, askColour] = sitting(CURRICULUM_A11.lektionen[4]);
  const [need, , pause, phoneName] = sitting(CURRICULUM_A11.lektionen[5]);
  // Colours are a closed class: a word the course does not teach is no colour.
  for (const notColour of ['Es ist groß.', 'Es ist klein.', 'Es ist neu.', 'Es ist teuer.']) assert.equal(typedResult(colour, notColour), RESULT.WRONG, notColour);
  assert.equal(typedResult(askColour, 'Ist deine Tasche klein?'), RESULT.WRONG);
  for (const right of ['Es ist dunkelblau.', 'Es ist hell grün.', 'Es ist lila.', 'Es ist grau.', 'Es ist grun.', 'Mein Heft hat die Farbe Blau.']) assert.notEqual(typedResult(colour, right), RESULT.WRONG, right);
  // A thing the course never teaches is a noun the learner writes as one.
  for (const notThing of ['Ich kaufe groß.', 'Ich kaufe neu.']) assert.equal(typedResult(buy, notThing), RESULT.WRONG, notThing);
  assert.equal(typedResult(need, 'Ich brauche klein.'), RESULT.WRONG);
  assert.equal(typedResult(buy, 'Ich kaufe Bananen.'), RESULT.CORRECT);
  assert.equal(typedResult(buy, 'Ich kaufe eine banane.'), RESULT.TYPO, 'after an article a small letter is a typo');
  // A colour before the noun takes the ending its article asks for.
  for (const right of ['Ich kaufe die rote Lampe.', 'Ich kaufe den roten Stuhl.', 'Ich kaufe ein rotes Regal.', 'Ich kaufe zwei rote Stühle.']) assert.equal(typedResult(buy, right), RESULT.CORRECT, right);
  for (const wrong of ['Ich kaufe die roten Lampe.', 'Ich kaufe den rote Stuhl.', 'Ich kaufe die große Lampe.']) assert.equal(typedResult(buy, wrong), RESULT.WRONG, wrong);
  assert.equal(typedResult(what, 'Das ist ein roter Stift.'), RESULT.CORRECT);
  assert.equal(typedResult(what, 'Das ist ein rote Stift.'), RESULT.WRONG);
  // The same meaning in other taught words.
  assert.equal(typedResult(buy, 'Ich möchte die Uhr kaufen.'), RESULT.CORRECT);
  assert.equal(typedResult(buy, 'Ich möchte die Uhr.'), RESULT.CORRECT);
  assert.equal(typedResult(askPrice, 'Wieviel kostet die Uhr?'), RESULT.TYPO, 'the old spelling of „wie viel"');
  for (const right of ['Wann beginnt die Pause?', 'Wann fängt die Pause an?', 'Wann ist meine Pause?', 'Wann ist die Mittagspause?']) assert.equal(typedResult(pause, right), RESULT.CORRECT, right);
  for (const right of ['Guten Tag, Herr Weber. Hier ist Omar Haddad.', 'Guten Tag Herr Weber, hier ist Haddad.', 'Hallo Herr Weber, hier ist Omar.', 'Hier spricht Omar Haddad.']) assert.equal(typedResult(phoneName, right), RESULT.CORRECT, right);
  assert.equal(typedResult(phoneName, 'Guten Tag Herr Weber.'), RESULT.WRONG, 'a greeting names nobody');
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
