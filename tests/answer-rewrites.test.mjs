// The longer ways to say a right answer (src/lib/lesson/answerRewrites.js), and the last look at a verified one
// (finalCheck.js foreignWord, otherWordTyped, pronounFits, ownKind, nameFault). Both come from the two blind corpora of
// loop round 2 (2026-11-25): on answers no list holds, 49 % and 55 % of the right ones were confirmed, 1.5 % and 2 % called
// wrong, and 2 % of the wrong ones praised. Every class has its right and its wrong side here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { RESULT } from '../src/lib/lesson/check.js';
import { BEYOND, checkTurns, courseLexicon, typedResult, wrongReason } from '../src/lib/lesson/finalCheck.js';
import { asHaveQuestion, asTimeQuestion, asWell, nounForPronoun, withoutAttribute, withoutDegree, withoutOccasion, withoutParty } from '../src/lib/lesson/answerRewrites.js';

const lexicon = courseLexicon(CURRICULUM_A11);
/** Lektion and turn, both counted from one. */
const at = (nr, turn, r = 0) => checkTurns({ ...CURRICULUM_A11.lektionen[nr - 1].guided.check, lexicon }, r)[turn - 1];
const readings = (n) => ({ Stift: ['der'], Heft: ['das'], Telefonnummer: ['die'], Bruder: ['der'], Fahrkarte: ['die'], Tisch: ['der'], Eltern: ['pl'] })[n] || null;

test('an adjective with the ending its determiner and noun ask for comes off; one with another ending stays', () => {
  for (const [said, left] of [['Wo ist mein blauer Stift?', 'Wo ist mein Stift?'], ['Meine neue Telefonnummer ist 040.', 'Meine Telefonnummer ist 040.'], ['Ich habe ein rotes Heft.', 'Ich habe ein Heft.'],
    ['Ich habe einen blauen Stift.', 'Ich habe einen Stift.'], ['Das sind meine lieben Eltern.', 'Das sind meine Eltern.'], ['Der kleine Tisch ist hier.', 'Der Tisch ist hier.']]) assert.equal(withoutAttribute(said, readings), left, said);
  for (const wrong of ['Wo ist mein blaue Stift?', 'Ich habe ein roter Heft.', 'Ich habe einen blauer Stift.', 'Meine neuen Telefonnummer ist 040.', 'Wo ist mein Stift?', 'Das ist mein kommen Bruder.']) assert.equal(withoutAttribute(wrong, readings), null, wrong);
});

test('degree words, an occasion, „zu meinem Fest“ come off; what the answer says stays', () => {
  for (const [f, said, left] of [[withoutDegree, 'Ich habe heute ein bisschen Durst.', 'Ich habe Durst.'], [withoutDegree, 'Ja, ich habe sehr großen Hunger und viel Durst.', 'Ja, ich habe Hunger und Durst.'],
    [withoutDegree, 'Sie ist schon recht alt.', 'Sie ist schon alt.'], [withoutOccasion, 'Nach der Arbeit habe ich immer Durst.', 'Ich habe immer Durst.'], [withoutOccasion, 'Ich habe nach dem Sport Durst.', 'Ich habe Durst.'],
    [withoutParty, 'Meine Eltern kommen zu meinem Fest.', 'Meine Eltern kommen.'], [asTimeQuestion, 'Können wir uns am Freitag um zehn treffen?', 'Hast du am Freitag um zehn Zeit?']]) assert.equal(f(said), left, said);
  for (const [f, said] of [[withoutDegree, 'Ich habe Hunger.'], [withoutOccasion, 'Nach der Arbeit ich habe Durst.'], [withoutParty, 'Meine Eltern kommen zu Hause.'], [asTimeQuestion, 'Können wir am Freitag?']]) assert.equal(f(said), null, said);
});

test('„Gibt es …?“ asks what „Haben Sie …?“ asks, a pronoun stands for its noun, and one may be more than „gut“', () => {
  for (const said of ['Gibt es hier auch eine Suppe?', 'Gibt’s heute eine Suppe?', 'Hätten Sie vielleicht eine Suppe für mich?', 'Bekomme ich bei Ihnen eine Suppe?', 'Kann man hier eine Suppe bekommen?']) assert.equal(asHaveQuestion(said), 'Haben Sie eine Suppe?', said);
  assert.equal(asHaveQuestion('Haben Sie eine Suppe?'), null);
  assert.equal(nounForPronoun('Und die Fahrkarte? Was kostet sie?', readings), 'Was kostet die Fahrkarte?');
  assert.equal(nounForPronoun('Und die Fahrkarte? Was kostet er?', readings), null, 'the pronoun has the gender of the noun');
  assert.equal(asWell('Es geht mir prima, danke.'), 'Es geht mir gut, danke.');
  assert.equal(asWell('Ich bin prima.'), null);
});

test('right answers said longer are verified', () => {
  for (const [nr, t, answer] of [[1, 1, 'Guten Tag, mein Name ist Omar.'], [1, 2, 'Ich bin Frau Haddad.'], [1, 4, 'Danke, mir geht es prima.'], [2, 5, 'Meine neue Telefonnummer ist 040 78234561.'],
    [3, 1, 'Das ist meine Mutter, sie heißt Fatima.'], [5, 3, 'Wo ist mein blauer Stift?'], [9, 1, 'Ich habe ein bisschen Hunger.'], [9, 1, 'Ja, nach der Arbeit habe ich immer Hunger.'], [10, 4, 'Wie teuer ist das Ticket?'], [12, 4, 'Meine Eltern kommen zu meinem Fest.']]) {
    const r = typedResult(at(nr, t), answer);
    assert.ok(r === RESULT.CORRECT || r === RESULT.TYPO, `${nr}.${t} ${answer}: ${r}`);
  }
});

test('the same answers with a fault in what was added are not verified', () => {
  for (const [nr, t, answer] of [[5, 3, 'Wo ist mein blaue Stift?'], [5, 3, 'Wo ist meine blauer Stift?'], [2, 5, 'Meine neuen Telefonnummer ist 040 78234561.'], [3, 1, 'Das ist meine Mutter, er heißt Fatima.'],
    [9, 1, 'Ja, nach der Arbeit ich habe Hunger.'], [9, 1, 'Nach der Arbeit ich habe Hunger.'], [4, 4, 'Ich möchte der Stuhl. Wie viel kostet er?'], [5, 3, 'Ich suche mein Stift. Wo ist er?'], [12, 4, 'Meine Eltern kommt zu meinem Fest.'], [5, 3, 'Wo ist mein Stift? Sie ist rot.'], [12, 4, 'Es kommt meine Freunde.']]) {
    const r = typedResult(at(nr, t), answer);
    assert.ok(r !== RESULT.CORRECT && r !== RESULT.TYPO, `${nr}.${t} ${answer}: ${r}`);
  }
});

test('another way to say a name, a person spoken to, an „es“ that holds the place and a country with its article are not called wrong', () => {
  for (const [nr, t, answer, r] of [[1, 2, 'Mein Vorname ist Salma.'], [1, 2, 'Ich heiße Ali, mit Nachnamen Saleh.'], [1, 2, 'Sie können mich Mona nennen.'], [1, 2, 'Mein Name ist Rossi, Marco Rossi.'], [2, 1, 'Ich bin in Berlin geboren und komme aus Deutschland.'],
    [2, 1, 'Meine Heimat ist der Libanon.'], [2, 1, 'Ich komme aus den USA.'], [6, 4, 'Guten Tag! Hier Yilmaz.'], [10, 4, 'Was kostet eine Fahrkarte für mich?'], [12, 1, 'Ich habe am Samstag Geburtstag und mache ein Fest. Komm doch auch!'], [12, 4, 'Es kommen drei Freunde aus dem Deutschkurs.'], [7, 4, 'Hallo Lena, schwimmst du auch so gern?', 2]]) {
    assert.notEqual(typedResult(at(nr, t, r || 0), answer), RESULT.WRONG, `${nr}.${t} ${answer}: ${wrongReason(at(nr, t, r || 0), answer)}`);
  }
  for (const [nr, t, answer] of [[1, 2, 'Ich heiße.'], [1, 2, 'Ich bin müde.'], [1, 2, 'Ich heißen Omar.'], [1, 2, 'Ich Omar.'], [2, 1, 'Ich komme aus der Libanon.']]) {
    assert.equal(typedResult(at(nr, t), answer), RESULT.WRONG, `${nr}.${t} ${answer}`);
  }
});

test('what stood as the learner’s own word is looked at: English, French letters, another word, a thing that is not asked for', () => {
  for (const [nr, t, answer] of [[12, 4, 'Meine Friends kommen auch.'], [12, 5, 'Ich möchte Flowers.'], [9, 3, 'Ich möchte Chicken mit Reis, bitte.'], [12, 2, 'Mein Geburtstag ist am 6. October.']]) assert.equal(wrongReason(at(nr, t), answer), 'english', `${nr}.${t} ${answer}`);
  for (const [nr, t, answer] of [[2, 1, 'Ich komme aus Égypte.'], [6, 1, 'Ich brauche einen stylo.'], [9, 6, 'Nein, danke, ich bin Stadt.'], [11, 1, 'Ich habe morgen gearbeitet.'], [11, 3, 'Ich fahre morgens bei dem Bus zur Arbeit.'], [9, 3, 'Ich nehme den Reis mit Fleiß.'],
    [9, 2, 'Ich möchte eine Pizza, bitte.'], [9, 2, 'Ich möchte die Rechnung, bitte.'], [6, 1, 'Ich brauche Hilfe mit den Computer.']]) {
    const r = typedResult(at(nr, t), answer);
    assert.ok(r === RESULT.WRONG || r === BEYOND, `${nr}.${t} ${answer}: ${r}`);
  }
  const suppe = checkTurns({ ...CURRICULUM_A11.lektionen[8].guided.check, lexicon }, 1)[3];
  assert.equal(typedResult(suppe, 'Haben Sie eine Puppe?'), RESULT.WRONG, 'a slip that is another word, and another thing (the second reader, loop round 3)');
  // The words stay open where they are right.
  for (const [nr, t, answer] of [[9, 2, 'Ich möchte eine Cola, bitte.'], [9, 2, 'Einen Apfelsaft, bitte.'], [9, 3, 'Ich möchte ein Käsebrot, bitte.'], [2, 1, 'Ich komme aus Ägypten.'], [6, 1, 'Ich brauche einen Drucker.'], [1, 2, 'Ich heiße José.']]) {
    const r = typedResult(at(nr, t), answer);
    assert.ok(r === RESULT.CORRECT || r === RESULT.TYPO, `${nr}.${t} ${answer}: ${r}`);
  }
  assert.equal(typedResult(at(1, 2), 'Mein name ist Nabil.'), RESULT.TYPO, 'a noun written small is a slip in an opening too');
});

// The Claude score of 2026-11-25 (64213018): „asdf“ and „Keine Ahnung“ got BEYOND with half the answer shown, and faults the
// Lektion teaches were sent there too. Turns counted from one, as above.
test('no answer is no answer, and a fault the Lektion teaches is named wherever it stands', async () => {
  const { wrongReason: why } = await import('../src/lib/lesson/finalCheck.js');
  for (const [nr, t, answer] of [[10, 2, 'asdf'], [11, 2, 'x'], [5, 5, '?'], [2, 4, 'Keine Ahnung'], [3, 1, 'Weiß nicht.']]) assert.equal(typedResult(at(nr, t), answer), RESULT.WRONG, `${nr}.${t} ${answer}`);
  for (const [nr, t, answer, reason] of [[1, 4, 'Mich geht es gut.', 'word'], [12, 2, 'Mein Geburtstag ist am Mai.', 'word'], [12, 2, 'Mein Geburtstag ist in Mai.', 'word'], [11, 1, 'Ich habe arbeiten.', 'infinitive'],
    [11, 1, 'Ich habe gegangen.', 'auxiliary'], [8, 3, 'Ich stehe um 7 Uhr aufstehen', 'twice'], [6, 1, 'Ich brauche einen Computer und ein Stuhl.', 'case'], [3, 4, 'Sie sprecht Arabisch.', 'agreement'],
    [10, 2, 'Fahrt der Zug nach Berlin?', 'agreement'], [10, 3, 'Wann fahrt der Zug?', 'agreement']]) {
    assert.equal(typedResult(at(nr, t), answer), RESULT.WRONG, `${nr}.${t} ${answer}`);
    assert.equal(why(at(nr, t), answer), reason, `${nr}.${t} ${answer}`);
  }
  // The same turns, right: nothing of the above may refuse them.
  for (const [nr, t, answer] of [[1, 4, 'Mir geht es gut, danke.'], [12, 2, 'Mein Geburtstag ist im Mai.'], [11, 1, 'Ich habe gestern gearbeitet.'], [8, 3, 'Ich stehe um 7 Uhr auf.'], [6, 1, 'Ich brauche einen Computer und einen Stuhl.'],
    [3, 4, 'Sie spricht Arabisch.'], [10, 3, 'Wann fährt der Zug?'], [12, 3, 'Und du? Wann ist dein Geburtstag?'], [12, 6, 'Tschüss, schönen Tag noch!'], [1, 1, 'Hallo! Ich bin Fatima.'], [11, 2, 'Und du, was hast du gestern gemacht?']]) {
    assert.equal(typedResult(at(nr, t), answer), RESULT.CORRECT, `${nr}.${t} ${answer}`);
  }
  // Right German the check cannot judge is not refused.
  for (const [nr, t, answer] of [[2, 3, 'Ich studiere.'], [3, 2, 'Sie ist erst zwanzig.'], [8, 3, 'Ich stehe früh auf.'], [2, 1, 'Ich bin Syrer.'], [2, 2, 'Ich wohne bei meinem Bruder.'],
    [11, 1, 'Ich habe gestern einen Kuchen gebacken.'], [12, 1, 'Am Samstag feiere ich bei mir zu Hause. Du bist herzlich eingeladen!']]) {
    assert.notEqual(typedResult(at(nr, t), answer), RESULT.WRONG, `${nr}.${t} ${answer}`);
  }
  // Faults a looser reading let through are not praised.
  for (const [nr, t, answer] of [[8, 6, 'Ich habe am Nacht Zeit.'], [10, 1, 'Ich fahre nach der Schweiz.'], [11, 3, 'Ich lerne der Deutsch.']]) {
    const r = typedResult(at(nr, t), answer);
    assert.ok(r === RESULT.WRONG || r === BEYOND, `${nr}.${t} ${answer}: ${r}`);
  }
});

test('after a BEYOND the screen never tells the learner to begin as they did, and never with a cast name', async () => {
  const { beyondStart } = await import('../src/lib/lesson/finalCheck.js');
  const past = at(11, 1);
  assert.equal(beyondStart(past, '').started, false);
  const said = beyondStart(past, 'Ich habe Deutsch gelernt.');
  assert.equal(said.started, true);
  assert.match(said.text, /…/, 'a frame with its gap, never a whole answer to copy');
  const message = checkTurns({ ...CURRICULUM_A11.lektionen[1].guided.check, lexicon }, 0).find((x) => x.parts);
  assert.doesNotMatch(beyondStart(message, '').text, /Ana|Chakiri|\d/);
  const { readFileSync } = await import('node:fs');
  const stage = readFileSync(new URL('../src/components/lesson/CheckStage.jsx', import.meta.url), 'utf8');
  assert.match(stage, /start\.started \? 'check\.beyond\.started' : 'check\.beyond'/);
});
