// The second reader of the final check (loop round 3, 2026-11-25): `clause.js` takes a typed sentence apart, `taskMeaning.js` says
// whether it answers the turn, `oneRepair.js` names the one change that would make it the answer. Measured on answers two models
// wrote blind (docs/course-factory/a11-lektion-rollout/blind-corpus-2026-11-25-round3): right answers confirmed 95 % and 96 % on
// the first run, against 70 % and 75 % for the frames alone one round before. Every pin here is a rule, never an answer list.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { RESULT } from '../src/lib/lesson/check.js';
import { planPractice, practiceReport } from '../src/lib/lesson/buildLesson.js';
import { BEYOND, checkTurns, courseLexicon, readOnce, readingsIn, typedResult, uncheckedWords, wrongReason } from '../src/lib/lesson/finalCheck.js';
import { reader, tokenize } from '../src/lib/lesson/clause.js';
import { asked } from '../src/lib/lesson/taskMeaning.js';
import { repairs } from '../src/lib/lesson/oneRepair.js';
import { adjectiveForm, participleFor, verbReadings } from '../src/lib/lesson/germanForms.js';

const lexicon = courseLexicon(CURRICULUM_A11);
const sitting = (nr, r = 0) => checkTurns({ ...CURRICULUM_A11.lektionen[nr - 1].guided.check, lexicon }, r);
/** Lektion and turn, both counted from one. */
const at = (nr, turn, r = 0) => sitting(nr, r)[turn - 1];
const PLACES = new Set(['berlin', 'bremen', 'marokko', 'wien']);
const ctx = { readings: (n) => readingsIn(lexicon, n), isName: (w) => lexicon.names.has(w.toLowerCase()), isPlace: (w) => PLACES.has(w.toLowerCase()), placeArticle: () => null, isLanguage: (w) => ['deutsch', 'arabisch'].includes(w.toLowerCase()), isJob: (w) => /^(?:koch|lehrer|lehrerin)$/i.test(w), isMass: (w) => ['wasser', 'kaffee', 'tee', 'milch'].includes(w.toLowerCase()), isFood: () => false };
const reads = (s) => reader(s, ctx).read();

test('a sentence is read when every word stands where German puts it', () => {
  for (const s of ['Ich kaufe den Stuhl und die Lampe.', 'Am Samstag feiere ich ein Fest.', 'Wo ist mein Stift?', 'Weißt du, wo mein Stift ist?', 'Ich habe gestern Fußball gespielt.', 'Ich stehe mit meinen Kindern um halb sieben auf.',
    'Das ist meine Schwester, sie arbeitet in Berlin.', 'Ich möchte ein Glas kaltes Wasser.', 'Kannst du am Freitag um zehn kommen?', 'Meine Freunde aus dem Deutschkurs kommen auch.', 'Ich dusche und frühstücke.', 'Ich habe eingekauft und danach einen Film gesehen.',
    'Es gibt heute Suppe.', 'Mir geht es heute nicht so gut.', 'Ich komme mit, weil ich Zeit habe.', 'Hast du vor, am Samstag einzukaufen?', 'Geboren bin ich in Berlin.', 'Die Farbe meines Hefts ist blau.', 'Es ist Viertel vor zehn.', 'Ich stehe um kurz nach sechs auf.']) assert.ok(reads(s), s);
  for (const s of ['Am Samstag ich feiere ein Fest.', 'Das meine Brille ist.', 'Ich kaufe den Stuhl und der Tisch.', 'Weißt du, wo ist mein Stift?', 'Ich habe gekocht Suppe.', 'Ich spielt Fußball.', 'Ich stehe auf um sieben Uhr auf.', 'Ich lade dir ein.',
    'Ich möchte ein Glas von Milch.', 'Ich habe nicht Hunger.', 'Hier liegt mein Heft auf den Tisch.', 'Ich fahre morgens bei dem Bus.', 'Das ist zwei Bücher.', 'Ich komme mit, weil ich habe Zeit.', 'Ich habe gestern Gitarre gespült.', 'Ich bin gearbeitet.',
    'Ich wohne im Berlin.', 'Ich gehe in Kino.', 'Fährt Zug nach Berlin?', 'Ich stehe sieben Uhr auf.']) {
    const r = reads(s);
    assert.ok(!r || r.every((x) => x.clauses.every((c) => c.frag || c.around)) || r.some((x) => x.clauses.some((c) => c.frag && c.elems.length > 1)), s);
  }
});

test('the forms the reader knows are German', () => {
  const has = (w, lemma, mood) => verbReadings(w).some((v) => v.lemma === lemma && v.mood === mood);
  for (const [w, lemma, mood] of [['fährst', 'fahren', 'fin'], ['liest', 'lesen', 'fin'], ['hältst', 'halten', 'fin'], ['nimm', 'nehmen', 'imp'], ['eingekauft', 'einkaufen', 'part'], ['aufgestanden', 'aufstehen', 'part'], ['studiert', 'studieren', 'part'], ['besucht', 'besuchen', 'part'],
    ['möchtest', 'möchten', 'fin'], ['hätte', 'haben', 'fin'], ['gewesen', 'sein', 'part'], ['arbeitest', 'arbeiten', 'fin'], ['tanzt', 'tanzen', 'fin'], ['einzukaufen', 'einkaufen', 'zu']]) assert.ok(has(w, lemma, mood), `${w}: ${lemma} ${mood}`);
  for (const w of ['fahrst', 'gebackt', 'gegesst', 'esst ihr']) assert.ok(!verbReadings(w).length, w);
  assert.equal(participleFor('backen'), 'gebacken');
  assert.deepEqual(adjectiveForm('müden').map((a) => a.ending), ['en']);
  assert.deepEqual(tokenize('Am 14. Oktober um 8.30 Uhr, 0176 2345678.').map((t) => t.kind), ['w', 'ord', 'w', 'w', 'clock', 'w', 'p', 'phone', 'p']);
});

test('what a turn asks is read off its own answers; only a heard or spelled turn has none', () => {
  const none = [];
  for (const l of CURRICULUM_A11.lektionen) for (const r of [0, 1, 2]) for (const [i, t] of sitting(l.nr, r).entries()) if (!t.listen && !t.spell && !asked(t)) none.push(`${l.nr}.${i + 1}`);
  assert.deepEqual([...new Set(none)], []);
  for (const [nr, t, kind] of [[1, 4, 'mood'], [2, 1, 'origin'], [4, 4, 'askPrice'], [5, 3, 'askPlace'], [6, 1, 'need'], [7, 4, 'askLike'], [8, 4, 'askFree'], [9, 2, 'order'], [9, 6, 'decline'], [10, 2, 'askTrain'], [11, 1, 'did'], [12, 1, 'invite'], [12, 4, 'guests']]) assert.equal(asked(at(nr, t)).kind, kind, `${nr}.${t}`);
});

test('a sentence read in full that says what the turn asks is confirmed, whatever its words', () => {
  for (const [nr, t, answer] of [[11, 1, 'Ich habe gestern mit meinen Kindern gespielt.'], [11, 1, 'Ich habe lange geschlafen und dann ein Buch gelesen.'], [11, 1, 'Gestern habe ich meine Tante besucht.'], [12, 4, 'Meine Kollegen aus dem Krankenhaus kommen auch.'],
    [12, 4, 'Mein Bruder kommt mit seiner Frau.'], [3, 1, 'Das ist meine Mutter, sie spielt gern Karten.'], [8, 5, 'Prima, Freitag um zehn passt mir gut.'], [9, 6, 'Nein, danke, ich bin satt.'], [9, 6, 'Für mich bitte keinen Kuchen, danke.'], [4, 4, 'Was verlangen Sie für den Stuhl?'],
    [10, 1, 'Ich fahre zu meinen Eltern nach Bonn.'], [10, 2, 'Kann ich mit diesem Zug nach Berlin fahren?'], [12, 1, 'Wir feiern am Samstag bei mir, bist du dabei?'], [7, 4, 'Und tanzen? Machst du das gern?'], [7, 4, 'Ich tanze gern. Du auch?'], [2, 1, 'Meine Heimat ist der Libanon.'],
    [9, 1, 'Ich habe Hunger, ja.'], [5, 4, 'Ich habe ein rotes Heft.'], [12, 2, 'Mein Geburtstag ist der 24. Dezember.'], [1, 4, 'Ich bin heute etwas müde.'], [8, 3, 'Ich stehe sehr früh auf, um vier Uhr.'], [12, 6, 'Ich wünsche dir einen schönen Tag beim Einkaufen.']]) assert.equal(typedResult(at(nr, t), answer), RESULT.CORRECT, `${nr}.${t} ${answer}`);
  // The same typed without umlauts.
  assert.equal(typedResult(at(11, 1), 'Ich habe gestern fuer meine Kinder gekocht.'), RESULT.CORRECT);
  // A noun no list knows is welcome where the answer names something of the learner's own, and the note says it was not checked.
  assert.equal(typedResult(at(12, 5), 'Ich hätte gern ein Teleskop für meinen Balkon.'), RESULT.CORRECT);
  assert.deepEqual(uncheckedWords(at(12, 5), 'Ich hätte gern ein Teleskop für meinen Balkon.'), ['Teleskop']);
});

test('one change makes it the answer: the fault is named', () => {
  for (const [nr, t, answer, fault] of [[12, 1, 'Am Samstag ich feiere eine Party. Kommst du?', 'order'], [5, 1, 'Das meine Brille ist.', 'order'], [11, 1, 'Habe gestern Musik gehört.', 'missing'], [8, 4, 'Hast du am Freitag an zehn Uhr Zeit?', 'word'],
    [11, 7, 'Ja, ich komme mit, weil ich habe Zeit.', 'order'], [5, 3, 'Weißt du, wo ist mein Stift?', 'order'], [12, 1, 'Ich lade du am Samstag zu meinem Fest ein.', 'case'], [5, 4, 'Mein Heft grün.', 'missing'], [12, 2, 'Ich habe am vierte Mai Geburtstag.', 'ending']]) {
    assert.equal(typedResult(at(nr, t), answer), RESULT.WRONG, `${nr}.${t} ${answer}`);
    assert.equal(wrongReason(at(nr, t), answer), fault, `${nr}.${t} ${answer}`);
  }
  for (const r of repairs('Ich die Uhr kaufe.')) assert.notEqual(r.text, 'Ich die Uhr kaufe.');
});

test('read in full and not the answer: another question, another thing, the other person, the other form of address', () => {
  for (const [nr, t, answer, fault] of [[4, 4, 'Wo steht der Stuhl?', 'task'], [4, 4, 'Was kostet der Fisch?', 'word'], [5, 5, 'Welche Farbe hat dein Bauch?', 'word'], [10, 2, 'Fährt der Zug nach Hamburg?', 'word'], [10, 2, 'Wann fährt der Zug nach Berlin?', 'task'], [7, 4, 'Liest du gern?', 'word'],
    [7, 4, 'Tanzt er gern?', 'word'], [2, 1, 'Ich wohne in Dortmund.', 'task'], [1, 4, 'Ich bin gut, danke.', 'sentence'], [9, 5, 'Nein, danke.', 'task'], [9, 6, 'Ja, gern.', 'task'], [3, 1, 'Das ist meine Mutter, er heißt Halima.', 'word'], [5, 3, 'Wissen Sie, wo mein Stift ist, Lena?', 'address'],
    [9, 2, 'Bring mir bitte einen Tee.', 'address'], [12, 1, 'Ich feiere am Sonntag, kommst du auch?', 'task'], [8, 4, 'Du hast am Freitag um zehn Zeit.', 'task'], [11, 3, 'Abends sehe ich fern.', 'task'], [12, 3, 'Mein Geburtstag ist im Juni.', 'task']]) {
    assert.equal(typedResult(at(nr, t), answer), RESULT.WRONG, `${nr}.${t} ${answer}`);
    assert.equal(wrongReason(at(nr, t), answer), fault, `${nr}.${t} ${answer}`);
  }
  for (const [nr, t, answer] of [[4, 2, 'Wie viele kostet die Uhr?'], [5, 4, 'Mein Heft ist eine gelb.'], [7, 3, 'Was ist sein Hobby?'], [9, 6, 'Nein.'], [12, 3, 'Wann hat sie Geburtstag?'], [8, 3, 'Um sechs Uhr.'], [12, 4, 'Meine Mama.'], [7, 2, 'Ich gehe gern im Kino.']]) assert.ok(![RESULT.CORRECT, RESULT.TYPO].includes(typedResult(at(nr, t), answer)), `${nr}.${t} ${answer}`);
  // A question that names its thing in another way is never called another question.
  for (const [nr, t, answer] of [[6, 2, 'Ich suche mein Büro. Wo muss ich hin?'], [2, 4, 'Darf ich Sie nach Ihrem Beruf fragen?'], [8, 2, 'Was zeigt deine Uhr an?']]) assert.notEqual(typedResult(at(nr, t), answer), RESULT.WRONG, `${nr}.${t} ${answer}`);
});

// The generated probes of tests/final-check.test.mjs (two words swapped, a word of another kind in the gap, a tail) found that the
// reader took words for an answer wherever they stood: „Wann ist Pause die?“, „Ich möchte sieben“. Each rule of clauseOrder.js
// stands here with the German next to it. Never praised: WRONG or BEYOND.
test('words out of order are not praised, and the same words in order are', () => {
  const rows = [
    // an article or a possessive behind its noun, or without one
    [6, 3, ['Wann ist Pause die?', 'Wann beginnt Pause die?', 'Wann ist die denn Pause?'], ['Wann ist die Pause?', 'Wann beginnt die Pause?']],
    [10, 2, ['Fährt Zug der nach Berlin?', 'Fährt der auch Zug nach Berlin?', 'Ist die der Zug nach Berlin?'], ['Fährt der Zug nach Berlin?', 'Ist das der Zug nach Berlin?']],
    [4, 6, ['Ich kaufe den Stuhl und Uhr die.', 'Ich kaufe den Stuhl und Uhr.', 'Für meine kaufe ich vier Stühle.'], ['Ich kaufe den Stuhl und die Uhr.', 'Für meine Küche kaufe ich vier Stühle.']],
    [3, 6, ['Und Eltern deine, woher kommen sie?', 'Und deine Eltern, woher sie kommen?', 'Woher sind deine und Mutter dein Vater?'], ['Und deine Eltern, woher kommen sie?']],
    [9, 2, ['Ich möchte einen bitte, Kaffee.'], ['Ich möchte einen Kaffee, bitte.']],
    // adjectives, degrees, „nicht“, „auch“
    [1, 4, ['Mir geht es gut sehr.', 'Mir geht es so nicht gut.', 'Es geht gut mir.', 'Mir geht es.', 'Mir geht es sehr.', 'Mir geht es gut und blau.'], ['Mir geht es sehr gut.', 'Mir geht es nicht so gut.', 'Es geht mir gut.']],
    [3, 2, ['Sie ist alt nicht.', 'Sie ist nicht noch alt.', 'Sie ist alt ziemlich.', 'Sie ist Jahre alt.', 'Sie ist 1 Jahre alt.', 'Sie ist Montag Jahre alt.'], ['Sie ist nicht alt.', 'Sie ist noch nicht alt.', 'Sie ist ziemlich alt.', 'Sie ist fünfzig Jahre alt.', 'Sie ist 1 Jahr alt.']],
    [9, 4, ['Haben Sie Tee auch?', 'Haben Sie Tee und sieben?', 'Gibt es Ihnen Tee?'], ['Haben Sie auch Tee?', 'Haben Sie Tee und Kaffee?', 'Gibt es auch Tee?']],
    [9, 1, ['Ich habe Hunger viel.', 'Ja, ich habe bisschen Hunger.', 'Ich bin hungrig durstig.', 'Ja, ich habe Hunger, der Karte bitte.'], ['Ich habe viel Hunger.', 'Ja, ich habe ein bisschen Hunger.', 'Ja, ich habe Hunger, die Karte bitte.']],
    // pronouns behind the verb
    [1, 5, ['Wie geht Ihnen es?'], ['Wie geht es Ihnen?']],
    [8, 5, ['Ja, Freitag um zehn passt gut mir.'], ['Ja, Freitag um zehn passt mir gut.']],
    [4, 1, ['Was ist da das?', 'Entschuldigung, was das ist?'], ['Was ist das da?', 'Entschuldigung, was ist das?', 'Was ist denn das?']],
    [8, 2, ['Kannst du bitte mir die Uhrzeit sagen?'], ['Kannst du mir bitte die Uhrzeit sagen?']],
    [7, 4, ['Kannst du mir sagen, ob gern du tanzt?', 'Tanzt du gern auch?', 'Sagen mal, tanzt du gern?'], ['Kannst du mir sagen, ob du gern tanzt?', 'Tanzt du auch gern?', 'Sag mal, tanzt du gern?']],
    // what stands behind the answer
    [3, 5, ['Ich spreche Deutsch und Marokko.', 'Ich spreche Deutsch und Montag.'], ['Ich spreche Deutsch und Arabisch.', 'Ich spreche Arabisch und ein bisschen Deutsch.']],
    [3, 1, ['Das ist meine Mutter und kommen aus Syrien.', 'Das ist meine Mutter, heißt sie Fatima.', 'Das ist meine Schwester, nicht meiner Mutter.'], ['Das ist meine Mutter und sie kommt aus Syrien.', 'Das ist meine Mutter, sie heißt Fatima.', 'Das ist meine Schwester, nicht meine Mutter.']],
    [5, 5, ['Und deiner Tasche? Welche Farbe hat sie?'], ['Und deine Tasche? Welche Farbe hat sie?']],
    [5, 4, ['Mein Heft ist gelb, und deinem Heft?'], ['Mein Heft ist gelb, und dein Heft?']],
    [5, 1, ['Das ist ein Heft und ein Stift.', 'Das ist kein Buch.'], ['Das sind ein Heft und ein Stift.', 'Das ist ein Buch.']],
    [12, 4, ['Meine Oma kommt und auch meinen Cousin Ali.'], ['Meine Oma kommt und auch mein Cousin Ali.']],
    // a word of another kind in the gap
    [4, 6, ['Ich kaufe sieben.', 'Ich kaufe Lena.'], ['Ich kaufe die Lampe.']],
    [2, 3, ['Ich arbeite als Montag.', 'Ich arbeite als Tisch.'], ['Ich arbeite als Koch.']],
    [10, 1, ['Ich fahre nach Lena.', 'Ich fahre in den Tisch.'], ['Ich fahre nach Köln.']],
    [9, 6, ['Nein, danke, ich möchte Kuchen.', 'Nein, danke, keinen Tisch.', 'Nein, danke, ich möchte nur Montag.'], ['Nein, danke, ich möchte keinen Kuchen.', 'Nein, danke, keinen Kuchen.', 'Nein, danke, ich möchte nur Tee.']],
    [9, 5, ['Ja, ich möchte.'], ['Ja, ich möchte ein Wasser.']],
    // a word that has to be there
    [6, 2, ['Wo befindet mein Büro?'], ['Wo befindet sich mein Büro?']],
    [5, 3, ['Mein Stift weg. Wo ist er?'], ['Mein Stift ist weg. Wo ist er?']],
    [8, 4, ['Hast du am Freitag zehn Uhr Zeit?'], ['Hast du am Freitag um zehn Uhr Zeit?']],
    [2, 4, ['Weber, was sind Sie von Beruf?'], ['Herr Weber, was sind Sie von Beruf?']],
    [12, 2, ['Mein Geburtstag ist am 31.11.'], ['Mein Geburtstag ist am 30.11.']],
    [11, 1, ['Ich habe Lesen gemacht.', 'Ich habe müde gearbeitet.'], ['Ich habe Essen gemacht.', 'Ich habe viel gearbeitet.']],
    [6, 1, ['Für Arbeit brauche ich einen Drucker.', 'Ich brauche Hilfe mit dem.'], ['Für die Arbeit brauche ich einen Drucker.', 'Ich brauche Hilfe mit dem Computer.']],
  ];
  for (const [nr, t, wrong, right] of rows) {
    for (const a of wrong) assert.notEqual(typedResult(at(nr, t), a), RESULT.CORRECT, `${nr}.${t} ${a}`);
    for (const a of right) assert.equal(typedResult(at(nr, t), a), RESULT.CORRECT, `${nr}.${t} ${a}`);
  }
  // The thing of the task, its sitting and its form.
  assert.notEqual(typedResult(at(5, 2, 1), 'Das ist hier.'), RESULT.CORRECT, 'die Schere is „die“ or „sie“');
  assert.equal(typedResult(at(5, 2, 1), 'Die ist hier.'), RESULT.CORRECT);
  assert.notEqual(typedResult(at(10, 3, 1), 'Wann fährt der Zug nach Berlin?'), RESULT.CORRECT, 'this sitting travels to Österreich');
  assert.notEqual(typedResult(at(4, 2), 'Was kostet meine Uhr?'), RESULT.CORRECT, 'the watch is for sale');
  assert.equal(typedResult(at(10, 4), 'Was kostet meine Fahrkarte?'), RESULT.CORRECT, 'the ticket is mine');
  // „Antworten Sie mit „Ich habe …““: good German of another form is not judged, never called wrong.
  for (const a of ['Ich war zu Hause.', 'Ich bin ins Kino gegangen.']) assert.equal(typedResult(at(11, 1), a), BEYOND, a);
});

test('a noun the check knows, with an ending it has not, is a form and never a word of the learner’s own (score of c6918f2d)', () => {
  for (const [nr, t, answer] of [[6, 1, 'Ich brauche einen Computers.'], [6, 1, 'Ich brauche einen Telefons.'], [6, 1, 'Ich brauche einen Stifts.'], [6, 1, 'Ich brauche eine Lampes.'], [6, 1, 'Ich brauche einen Computern.'], [5, 1, 'Das ist mein Ladekabeln.'], [3, 4, 'Sie spricht gut Arabische.']]) {
    assert.equal(typedResult(at(nr, t), answer), RESULT.WRONG, answer);
    assert.equal(wrongReason(at(nr, t), answer), 'ending', answer);
  }
  // A loanword's plural, a weak noun, a dative plural and a noun that only looks like another one with an ending are German.
  for (const [nr, t, answer] of [[6, 1, 'Ich brauche zwei Laptops.'], [6, 1, 'Ich brauche einen Kollegen.'], [6, 1, 'Ich brauche einen Drucker.'], [12, 5, 'Ich wünsche mir eine Reise.'], [11, 1, 'Ich habe meinen Kollegen getroffen.'], [11, 1, 'Ich habe mit meinem Nachbarn gekocht.'],
    [3, 4, 'Sie spricht gut Arabisch.'], [6, 3, 'Um wie viel Uhr ist Pause?'], [2, 3, 'Ich mache eine Ausbildung.'], [11, 1, 'Ich habe gestern gegessen.']]) assert.equal(typedResult(at(nr, t), answer), RESULT.CORRECT, answer);
  for (const answer of ['Das ist mein Kollegen.', 'Das ist mein Neffen.']) assert.notEqual(typedResult(at(3, 1, 1), answer), RESULT.CORRECT, answer);
  assert.equal(wrongReason(at(11, 1), 'Ich habe gestern gegesst.'), 'participle');
});

test('what the independent score of c6918f2d found praised is not, and its neighbours are (classes, not lists)', () => {
  const rows = [
    [3, 1, 0, ['Er ist meine Mutter.', 'Sie sind meine Mutter.'], ['Sie ist meine Mutter.', 'Das ist meine Mutter.', 'Nein, das ist meine Schwester.']],
    [3, 2, 0, ['Ist sie jung.', 'Sie ist viel alt.', 'Sie ist schon jung.', 'Sie ist noch nicht jung.', 'Sie ist 45 Jahr alt.'], ['Sie ist jung.', 'Sie ist viel älter.', 'Sie ist schon alt.', 'Sie ist noch nicht alt.', 'Sie ist 45 Jahre alt.']],
    [3, 3, 0, ['Kommt sie aus Marokko.'], ['Sie kommt aus Marokko.']],
    [3, 5, 0, ['Ich spreche ein Arabisch.'], ['Ich spreche Arabisch.']],
    [12, 2, 0, ['Sein Geburtstag ist im Juni.', 'Ihr Geburtstag ist im Juni.'], ['Mein Geburtstag ist im Juni.']],
    [12, 4, 0, ['Sein Bruder kommt.', 'Deine Schwester kommt.'], ['Mein Bruder kommt.', 'Tom und seine Freundin kommen.']],
    [6, 2, 0, ['Wo ist sein Büro?'], ['Wo ist mein Büro?']],
    [7, 5, 0, ['Am Wochenende frei bin ich.', 'Am Samstag Zeit habe ich.'], ['Am Wochenende bin ich frei.', 'Am Samstag habe ich Zeit.']],
    [8, 6, 0, ['Ich habe am Dienstag eine Zeit.', 'Am Dienstag Zeit habe ich.'], ['Ich habe am Dienstag Zeit.']],
    [8, 1, 0, ['Es ist die halb neun.'], ['Es ist halb neun.', 'Es ist schon halb neun.']],
    [11, 3, 0, ['Morgens Kaffee trinke ich.', 'Ich gehe nach Schule.', 'Ich fahre nach Arbeit.', 'Ich nehme ein Dusche.', 'Ich dusche, dann ich frühstücke.'], ['Morgens trinke ich Kaffee.', 'Ich gehe zur Schule.', 'Ich nehme eine Dusche.', 'Ich dusche, dann frühstücke ich.']],
    [11, 5, 0, ['Ich arbeite am jeden Tag.'], ['Ich arbeite jeden Tag.']],
    [9, 1, 0, ['Ich möchte Hunger.', 'Ich habe sehr Hunger.'], ['Ich habe Hunger.', 'Ich habe großen Hunger.']],
    [9, 5, 0, ['Ja, ich bin Wasser.', 'Ja, ich habe Wasser.'], ['Ja, ich möchte Wasser.']],
    [9, 6, 0, ['Nein danke, ich bin nicht Hunger.', 'Nein danke, nicht Kuchen.', 'Nein danke, ich möchte Kuchen nicht.', 'Nein danke, ich möchte nicht einen Kuchen.'], ['Nein danke, ich habe keinen Hunger.', 'Nein danke, keinen Kuchen.', 'Nein danke, nur Wasser bitte.']],
    [5, 4, 0, ['Es ist blaue.', 'Mein Heft ist blaue.'], ['Es ist blau.', 'Mein Heft ist blau.']],
    [4, 6, 0, ['Ich kaufe den Montag.', 'Ich kaufe den Bruder.', 'Ich kaufe die Farbe.'], ['Ich kaufe den Stuhl.']],
    [6, 1, 0, ['Ich brauche Hunger.', 'Brauche ich einen Computer?'], ['Ich brauche einen Computer.']],
    [7, 1, 0, ['Mein Hobby ist mein Bruder.', 'Mein Hobby ist Deutschland.'], ['Mein Hobby ist Musik.', 'Mein Hobby ist Musik hören.']],
    [7, 2, 0, ['Ich koche gern Fußball.', 'Ich höre gern Fußball.', 'Ich gehe gern nach Park.', 'Ich spiele gern Suppe.'], ['Ich koche gern Suppe.', 'Ich höre gern Musik.', 'Ich gehe gern in den Park.', 'Ich spiele gern Fußball.']],
    [7, 3, 0, ['Was ist ein Hobby?'], ['Was ist dein Hobby?']],
    [7, 4, 0, ['Gern tanzt du?'], ['Tanzt du gern?', 'Du tanzt gern?']],
    [9, 2, 0, ['Ich esse Wasser.', 'Ich möchte ein Glas Wassers.'], ['Ich trinke Wasser.', 'Ich möchte ein Glas Wasser.']],
    [2, 7, 0, ['Ich heiße Ali. Ich war am 15.10.1985 geboren.'], ['Ich heiße Ali. Ich bin am 15.10.1985 geboren.']],
    [2, 1, 0, [], ['Ich komme aus der Stadt Aleppo.']],
    [2, 3, 0, [], ['Ich arbeite im Krankenhaus.']],
  ];
  for (const [nr, t, r, wrong, right] of rows) {
    for (const a of wrong) assert.notEqual(typedResult(at(nr, t, r), a), RESULT.CORRECT, `${nr}.${t} ${a}`);
    for (const a of right) assert.equal(typedResult(at(nr, t, r), a), RESULT.CORRECT, `${nr}.${t} ${a}`);
  }
});

test('a taught word with one letter wrong inside it is a slip of that word, whatever stands around it (score of c6918f2d)', () => {
  for (const [nr, t, a] of [[2, 3, 'Ich bin Lerer.'], [9, 3, 'Ich möchte eine Supe.'], [3, 5, 'Ich spreche Englich.'], [12, 4, 'Meine Schwster kommt.'], [5, 4, 'Es ist schwartz.'], [1, 5, 'Wie get es Ihnen?'], [1, 2, 'Ich heise Omar.'], [11, 6, 'Kaufst du am Samstg ein?'], [1, 6, 'Auf Wiedersehn!'], [2, 1, 'Ich komme aus Syrein.'], [3, 1, 'das ist meine schwester sara']]) {
    assert.equal(typedResult(at(nr, t), a), RESULT.TYPO, a);
    assert.equal(wrongReason(at(nr, t), a), null, a);
    assert.deepEqual(uncheckedWords(at(nr, t), a), [], a);
  }
  // An ending is a form, another first letter another word, an English word English, a name a name.
  assert.equal(typedResult(at(6, 1), 'Ich brauche einen Computers.'), RESULT.WRONG);
  for (const [nr, t, a] of [[3, 5, 'Ich spreche English.'], [12, 2, 'Mein Geburtstag ist am 6. October.'], [2, 1, 'Ich kommen aus Syrien.']]) assert.equal(typedResult(at(nr, t), a), RESULT.WRONG, a);
  assert.equal(typedResult(at(1, 2), 'Ich heiße Anna.'), RESULT.CORRECT);
});

test('the blind corpora of round 3 (ratchets: right only up, praised and called wrong only down)', () => {
  const turnOf = (id) => { const [, l, i, s] = id.match(/^L(\d+)T(\d+)S(\d+)$/).map(Number); return sitting(l, s)[i]; };
  const n = { right: 0, confirmed: 0, calledWrong: 0, wrong: 0, praised: 0, beyond: 0 };
  for (const f of ['codex', 'claude']) {
    const data = JSON.parse(readFileSync(new URL(`../docs/course-factory/a11-lektion-rollout/blind-corpus-2026-11-25-round3/${f}.json`, import.meta.url), 'utf8'));
    for (const [id, { right, wrong }] of Object.entries(data)) {
      const turn = turnOf(id);
      for (const a of right) {
        assert.doesNotThrow(() => readOnce(turn, a), a);
        const r = typedResult(turn, a);
        n.right += 1;
        if (r === RESULT.CORRECT || r === RESULT.TYPO) n.confirmed += 1;
        if (r === RESULT.WRONG) n.calledWrong += 1;
      }
      for (const { a } of wrong) {
        assert.doesNotThrow(() => readOnce(turn, a), a);
        const r = typedResult(turn, a);
        n.wrong += 1;
        if (r === RESULT.CORRECT) n.praised += 1;
        if (r === BEYOND) n.beyond += 1;
      }
    }
  }
  assert.equal(n.right, 1824);
  assert.equal(n.wrong, 1216);
  assert.ok(n.confirmed >= 1785, `${n.confirmed} of ${n.right} right answers confirmed`);
  assert.ok(n.calledWrong <= 2, `${n.calledWrong} right answers called wrong`);
  assert.ok(n.praised <= 7, `${n.praised} wrong answers praised`);
  assert.ok(n.beyond <= 88, `${n.beyond} wrong answers beyond`);
});

test('practice: an item stands in one Lektion, and Lektionen 4 to 6 practise their own can-dos', () => {
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a11.json', import.meta.url), 'utf8'));
  const seats = new Map();
  for (const attempt of [1, 2, 3]) {
    const plan = planPractice(CURRICULUM_A11, pool, attempt);
    for (const [nr, report] of practiceReport(plan)) assert.equal(report.relaxUsed, 0, `Lektion ${nr}, attempt ${attempt}`);
    for (const [nr, items] of plan) {
      for (const it of items) seats.set(it.id, new Set([...(seats.get(it.id) || []), nr]));
      const own = { 4: ['numbers'], 5: ['personal-pronouns', 'verb-sein'], 6: ['verb-sein'] }[nr];
      if (own) assert.ok(items.filter((it) => own.includes(it.topic)).length >= 2, `Lektion ${nr}, attempt ${attempt}`);
    }
  }
  assert.deepEqual([...seats].filter(([, l]) => l.size > 1).map(([id]) => id), []);
});
