// The marking of natural answers (2026-11-25): two independent scores and two blind corpora (4,400 right and 2,000 wrong
// answers written without the keys) showed the final check confirming 40 % of correct German, calling 22 % of it wrong and
// praising open-gap faults. The rules that answer it: certainFault.js (when WRONG may be said), answerShapes.js (what
// stands around an answer), nounPhrase.js (a determiner and its noun anywhere), the English of the course, own nouns'
// articles, and a11.answers.js (answers two teachers approved).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { A11_MORE_ANSWERS } from '../src/data/curricula/a11.answers.js';
import { RESULT } from '../src/lib/lesson/check.js';
import { STRINGS } from '../src/lib/lesson/strings.js';
import { BEYOND, answerStart, articleFaultIn, checkTurns, courseLexicon, englishIn, faultHintKey, modelAnswer, ownReadings, typedResult, uncheckedWords, wrongReason } from '../src/lib/lesson/finalCheck.js';
import { addressFault, registerOf } from '../src/lib/lesson/answerShapes.js';

const lexicon = courseLexicon(CURRICULUM_A11);
const sitting = (nr, r = 0) => checkTurns({ ...CURRICULUM_A11.lektionen[nr - 1].guided.check, lexicon }, r);
/** Lektion and turn, both counted from one, as the scores count them. */
const at = (nr, turn, r = 0) => sitting(nr, r)[turn - 1];
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const verified = (r) => r === RESULT.CORRECT || r === RESULT.TYPO;

test('every scene line passes as the answer to its own question, courtesy and second sentence included', () => {
  for (const [nr, t, answer, r] of [[1, 2, 'Guten Tag. Ich heiße Ana Chakiri.'], [1, 4, 'Mir geht es gut, danke. Und wie geht es Ihnen?'], [2, 1, 'Ich komme aus Marokko und wohne in Bremen.'],
    [6, 1, 'Danke. Ich brauche einen Computer und ein Telefon.'], [6, 3, 'Danke! Wann ist die Pause?'], [7, 2, 'Ich lese auch gern. Und ich koche gern.'], [7, 5, 'Am Wochenende arbeite ich nicht. Ich bin frei.'],
    [9, 2, 'Ich habe Durst. Ich möchte einen Kaffee, bitte.'], [9, 3, 'Ja, ich habe Hunger. Ich möchte Kuchen, bitte.'], [10, 2, 'Entschuldigung, fährt der Zug nach Österreich?', 1], [11, 3, 'Ich dusche und frühstücke bis acht.'],
    [11, 4, 'Ich stehe um sechs auf. Ich bin müde.'], [11, 7, 'Ja, ich komme mit. Ich bringe eine Tasche mit.'], [12, 4, 'Ja, meine Mama und mein Papa kommen.'], [12, 5, 'Vielleicht ein Buch. Mein Bruder kauft das Geschenk.']]) {
    assert.equal(typedResult(at(nr, t, r || 0), answer), RESULT.CORRECT, `${nr}.${t} ${answer}`);
  }
});

test('natural answers the scores saw refused or sent beyond are verified', () => {
  for (const [nr, t, answer] of [[2, 1, 'Guten Tag! Ich komme aus Jordanien.'], [6, 1, 'Guten Morgen! Ich brauche ein Telefon und einen Computer.'], [9, 1, 'Guten Tag! Ja, ich habe Hunger.'], [4, 2, 'Was kostet die Uhr, bitte?'],
    [9, 2, 'Einen Tee, bitte.'], [12, 4, 'Mein Bruder kommt auch.'], [11, 3, 'Ich frühstücke um acht Uhr.'], [2, 5, 'Meine Telefonnummer ist null vier zwei, drei drei acht eins.'], [2, 5, 'Meine Handynummer ist 0176 2345678.'],
    [2, 7, 'Sehr geehrter Herr Weber, ich heiße Ana Chakiri. Ich bin am 3.5.1998 geboren.'], [2, 7, 'Ich heiße Ana Chakiri. Ich bin am 3.5.1998 geboren. Mit freundlichen Grüßen, Ana Chakiri'], [1, 2, 'Ich heiße Mohammed, freut mich!'],
    [1, 6, 'Auf Wiedersehen und danke!'], [1, 6, 'Tschüss und auf Wiedersehen!'], [3, 2, 'Sie ist jung, sie ist zwanzig.'], [6, 3, 'Wann habe ich Pause?'], [7, 3, 'Hast du Hobbys?'], [8, 4, 'Geht es am Freitag um zehn?'],
    [9, 6, 'Danke, aber ich habe keinen Hunger.'], [10, 1, 'Ich fahre mit dem Zug nach Berlin.'], [10, 2, 'Gibt es einen Zug nach Berlin?'], [11, 3, 'Ich stehe auf, dusche und frühstücke.'], [12, 1, 'Wir feiern am Samstag. Kommst du?'],
    [12, 1, 'Ich feiere am Samstag eine Party. Möchtest du kommen?'], [12, 4, 'Es kommen viele Gäste.'], [4, 4, 'Wie viel kostet dieser Stuhl?'], [5, 1, 'In meiner Tasche ist ein Stift.'], [6, 2, 'Wo finde ich mein Büro?'],
    [8, 4, 'Kannst du am Freitag um zehn?'], [8, 6, 'Am Sonntag habe ich den ganzen Tag Zeit.'], [9, 4, 'Gibt es bei Ihnen Tee?'], [11, 2, 'Was hast du gestern so gemacht?'], [1, 4, 'Gut, danke. Und Ihnen?'], [8, 5, 'Das passt mir sehr gut.'],
    [9, 5, 'Sehr gern, danke.'], [11, 3, 'Morgens dusche ich und frühstücke.'], [3, 1, 'Das ist meine kleine Schwester.'], [4, 1, 'Können Sie mir sagen, was das ist?'], [9, 2, 'Ich hätte gern einen Kaffee, bitte.'],
    [9, 3, 'Für mich bitte ein Käsebrot.'], [11, 1, 'Gestern habe ich Hausaufgaben gemacht.'], [5, 3, 'Weißt du, wo mein Stift ist?'], [10, 3, 'Können Sie mir sagen, wann der Zug fährt?']]) {
    assert.equal(typedResult(at(nr, t), answer), RESULT.CORRECT, `${nr}.${t} ${answer}`);
  }
  // Two words run together are a slip of the right answer.
  assert.equal(typedResult(at(1, 4), 'Mirgeht es gut, danke.'), RESULT.TYPO);
  assert.equal(typedResult(at(4, 2), 'Waskostet die Uhr?'), RESULT.TYPO);
  // A noun written small is the slip it is everywhere, in a gap too.
  for (const [nr, t, answer] of [[2, 1, 'Ich komme aus syrien.'], [3, 1, 'Das ist meine mutter.'], [10, 1, 'Ich fahre nach berlin.'], [11, 5, 'Ich arbeite am montag.']]) assert.equal(typedResult(at(nr, t), answer), RESULT.TYPO, answer);
});

test('a thing is no first name, a word said twice is no name, and a made-up activity is not praised', () => {
  for (const [nr, t, answer] of [[1, 2, 'Ich heiße Banane.'], [1, 2, 'Mein Name ist Mango.'], [6, 4, 'Banane Banane.'], [6, 4, 'Omar Omar'], [7, 1, 'Mein Hobby ist Fußballen.'], [7, 2, 'Ich gehe gern Fußballen.']]) {
    // („Fußballen“ is a form of „Fußball“ the course can name since round 4: never praised, and named where it is sure.)
    const r = typedResult(at(nr, t), answer);
    if (/Fußballen/.test(answer)) assert.ok(r === BEYOND || (r === RESULT.WRONG && wrongReason(at(nr, t), answer) === 'ending'), `${nr}.${t} ${answer}: ${r}`);
    else assert.equal(r, BEYOND, `${nr}.${t} ${answer}`);
  }
  // A surname may be a thing („Anna Vogel"), and so may the name after Frau or Herr.
  for (const [nr, t, answer] of [[1, 2, 'Ich heiße Omar.'], [1, 2, 'Ich heiße Anna Vogel.'], [1, 2, 'Ich bin Omar Haddad.'], [6, 4, 'Haddad'], [6, 4, 'Hier ist Omar Haddad.'], [7, 1, 'Mein Hobby ist Wandern.'], [7, 1, 'Mein Hobby ist Fußball.']]) {
    assert.equal(typedResult(at(nr, t), answer), RESULT.CORRECT, `${nr}.${t} ${answer}`);
  }
});

test('a fault in an open gap is never praised: determiners, prepositions, places, nouns the course does not teach', () => {
  for (const [nr, t, answer] of [[7, 2, 'Ich gehe gern Kino.'], [7, 2, 'Ich gehe gern zu Kino.'], [7, 2, 'Ich gehe gern ins Park.'], [7, 2, 'Ich spiele gern mit mein Freund.'], [7, 2, 'Ich koche gern mit mein Frau.'], [7, 2, 'Ich lese gern Buch.'],
    [7, 2, 'Ich spiele gern Schwimmen.'], [7, 1, 'Ich spiele gern der Gitarre.'], [7, 1, 'Ich fahre gern mit das Fahrrad.'], [11, 3, 'Ich gehe Arbeit.'], [11, 3, 'Ich gehe Büro.'],
    [11, 3, 'Ich lese morgens den Zeitung.'], [11, 3, 'Ich frühstücke mit mein Familie.'], [11, 3, 'Ich lerne das Deutsch.'], [11, 5, 'Ich arbeite jede Tag.'], [11, 5, 'Ich arbeite an Montag.'], [11, 5, 'Ich arbeite um acht Uhr bis vier Uhr.'],
    [8, 6, 'Ich habe am Montags Zeit.'], [8, 6, 'Ich habe Zeit am nächste Woche.'], [7, 5, 'Ich bin im Wochenende frei.'], [12, 4, 'Meine Onkel kommt.'], [12, 4, 'Mein Tante kommt.'], [12, 4, 'Meine Nachbarn kommt.'], [4, 6, 'Ich kaufe eine Bett.'],
    [4, 6, 'Ich kaufe einen Sofa.'], [2, 1, 'Ich komme aus Syrisch.'], [2, 1, 'Ich komme aus der Libanon.'], [2, 1, 'Ich komme aus den Irak.'], [2, 2, 'Ich wohne im Bremen.'], [10, 1, 'Ich fahre nach Ägyptisch.'], [5, 1, 'Das ist mein Brille.'],
    [9, 2, 'Ich möchte einen Kaffee mit die Milch.'], [9, 3, 'Ich möchte einen Pizza.'], [9, 3, 'Ich möchte eine Brötchen.'], [2, 3, 'Ich bin ein Ärztin.'], [6, 1, 'Ich brauche ein Drucker.'], [12, 5, 'Ich hätte gern ein Gutschein.']]) {
    assert.equal(typedResult(at(nr, t), answer), RESULT.WRONG, `${nr}.${t} ${answer}`);
  }
  for (const [nr, t, answer] of [[2, 1, 'Ich komme aus Syrer.'], [2, 3, 'Ich bin ein Arztin.'], [6, 1, 'Ich brauche Computer.'], [6, 1, 'Ich brauche Tastatur.'], [2, 1, 'Ich komme aus Haus.'], [6, 4, 'Ich Omar Haddad.'], [7, 1, 'Ich wohne in Berlin.'], [7, 2, 'Ich heiße Tim.']]) {
    assert.ok(!verified(typedResult(at(nr, t), answer)), `${nr}.${t} ${answer}`);
  }
  // The right forms of the same nouns stay right.
  for (const [nr, t, answer] of [[2, 3, 'Ich bin eine Ärztin.'], [2, 3, 'Ich bin Ärztin.'], [6, 1, 'Ich brauche einen Drucker.'], [2, 1, 'Ich komme aus dem Irak.'], [2, 1, 'Ich komme aus Irak.'], [5, 1, 'Das sind meine Kopfhörer.'],
    [7, 2, 'Ich gehe gern ins Kino.'], [11, 3, 'Ich lese morgens die Zeitung.'], [12, 4, 'Meine Nachbarn kommen.'], [9, 3, 'Ich möchte Pizza.'], [9, 3, 'Ich möchte ein Brötchen.']]) {
    assert.equal(typedResult(at(nr, t), answer), RESULT.CORRECT, `${nr}.${t} ${answer}`);
  }
  assert.deepEqual([ownReadings('Schreibtisch'), ownReadings('Käsebrot'), ownReadings('Apfelsaft'), ownReadings('Ärztin'), ownReadings('Tischler')], [['der'], ['das'], ['der'], ['die'], ['der', 'pl']]);
});

test('English is not German: small words anywhere, the course’s own English and English place names in a gap', () => {
  for (const [nr, t, answer] of [[6, 4, 'I would like a coffee please.'], [6, 4, 'My name is Omar.'], [6, 4, 'thank you'], [2, 3, 'Ich bin teacher.'], [2, 1, 'Ich komme aus Syria.'], [2, 2, 'Ich wohne in Munich.'], [9, 2, 'Ich möchte Monday, bitte.'],
    [5, 1, 'Das ist ein Pen.'], [11, 3, 'Morgens trinke ich Coffee.'], [12, 4, 'Meine Family kommt.'], [3, 5, 'Ich spreche English.']]) {
    assert.equal(typedResult(at(nr, t), answer), RESULT.WRONG, `${nr}.${t} ${answer}`);
    assert.equal(wrongReason(at(nr, t), answer), 'english', answer);
    assert.equal(faultHintKey(at(nr, t), answer), 'check.fault.german');
  }
  // A surname may be an English word; a word German uses too is no English.
  assert.equal(typedResult(at(6, 4), 'Hier ist Adam Brown.'), RESULT.CORRECT);
  for (const w of ['job', 'party', 'hobby', 'computer', 'team', 'baby', 'sport', 'bus', 'name', 'hand', 'arm', 'form', 'will', 'man', 'gut', 'wind', 'shopping', 'single']) assert.ok(!lexicon.english.has(w), w);
  for (const w of ['coffee', 'teacher', 'monday', 'book', 'syria', 'munich']) assert.ok(lexicon.english.has(w), w);
});

test('the other form of address is a fault wherever it stands, and the waiter of Lektion 9 is addressed with Sie', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((nr) => registerOf(sitting(nr)[0])), ['Sie', 'Sie', 'du', 'Sie', 'du', 'Sie', 'du', 'du', 'Sie', 'Sie', 'du', 'du']);
  for (const [nr, t, answer] of [[5, 1, 'Das ist Ihr Geschenk, Lena.'], [9, 1, 'Ja, ich habe Hunger, und du, Paul?'], [1, 6, 'Ich wünsche dir einen schönen Tag. Auf Wiedersehen!']]) {
    assert.ok(addressFault(answer, at(nr, t)), answer);
    assert.equal(typedResult(at(nr, t), answer), RESULT.WRONG, answer);
  }
});

test('WRONG is said only where the fault is certain: correct paraphrases are never WRONG', () => {
  for (const [nr, t, answer] of [[1, 5, 'Darf ich fragen, wie es Ihnen geht?'], [4, 4, 'Was soll der Stuhl kosten?'], [4, 4, 'Wie viel möchten Sie für den Stuhl?'], [5, 3, 'Wo befindet sich mein Stift?'], [8, 1, 'Auf meiner Uhr ist es halb neun.'],
    [8, 3, 'Unter der Woche stehe ich um sieben auf.'], [9, 2, 'Bringen Sie mir bitte einen Kaffee.'], [9, 6, 'Danke, ich verzichte.'], [10, 2, 'Kommt man mit diesem Zug nach Berlin?'], [12, 3, 'An welchem Tag hast du Geburtstag?'],
    [12, 1, 'Ich mache am Samstag ein Fest, du bist herzlich eingeladen.'], [5, 4, 'Mein Heft ist nicht rot, es ist grün.'], [8, 2, 'Hast du die Uhrzeit?'], [7, 1, 'Ich spiele Fußball als Hobby.']]) {
    assert.notEqual(typedResult(at(nr, t), answer), RESULT.WRONG, `${nr}.${t} ${answer}`);
  }
  // The typical beginner faults stay WRONG, with a hint before the second try.
  for (const [nr, t, answer, hint] of [[2, 1, 'Ich komme Syrien.', 'missing'], [2, 1, 'Ich kommen aus Syrien.', 'verb'], [2, 2, 'Ich in Bremen wohne.', 'order'], [7, 2, 'Am Wochenende ich spiele Fußball.', 'order'], [10, 1, 'Nach Berlin ich fahre.', 'order'],
    [6, 1, 'Ich brauche ein Computer.', 'article'], [7, 4, 'Tanzen Sie gern?', 'address'], [10, 3, 'Wohin fährt der Zug?', 'word'], [2, 1, 'Ich komme aus', 'missing'], [1, 4, 'Mir geht gut.', 'missing'], [7, 2, 'Ich gern spiele Fußball.', 'order']]) {
    assert.equal(typedResult(at(nr, t), answer), RESULT.WRONG, `${nr}.${t} ${answer}`);
    assert.equal(faultHintKey(at(nr, t), answer), `check.fault.${hint}`, answer);
  }
});

test('the hint before the second try gives a direction in both languages and never the answer; an unjudged answer is told how to begin', () => {
  const keys = Object.keys(STRINGS.en).filter((k) => k.startsWith('check.fault.'));
  assert.ok(keys.length >= 12);
  for (const k of keys) assert.ok(STRINGS.de[k], k);
  for (const l of CURRICULUM_A11.lektionen) {
    for (const turn of sitting(l.nr)) {
      if (turn.spell || turn.listen) continue;
      const start = answerStart(turn);
      // A message shows its frame with the name and the date left open (Claude score, 2026-11-25), every other turn its beginning.
      if (turn.parts) { assert.match(start, /…/); assert.doesNotMatch(start, /Chakiri|\d/); continue; }
      assert.match(start, / …$/, `${l.id}: ${start}`);
      assert.ok(!/^\s*…/.test(start), start);
      const model = String(modelAnswer(turn)).replace(/[.!?]+$/, '');
      if (model.split(/\s+/).length > 1) assert.notEqual(start.replace(/ …$/, ''), model, `${l.id}: the whole answer is given`);
    }
  }
  const stage = read('src/components/lesson/CheckStage.jsx');
  assert.match(stage, /\{outcome \? modelAnswer\(turn\) : start\.text\}/);
  // A typo names no fault, only a slip of capitals (round 4 of the loop: „was ist das?“ typed on a phone).
  assert.match(stage, /setHint\(result === RESULT\.TYPO \? \(capitalsOnly\(turn, value\) \? 'feedback\.typo\.case' : null\) : faultHintKey\(turn, value\)\)/);
  assert.match(stage, /autoCapitalize="sentences" spellCheck=\{false\} maxLength=\{120\}/);
  // Without sound a heard turn can be passed over.
  assert.match(stage, /onFallback=\{outcome \? undefined : \(\) => onOutcome\('unverified', ''\)\}/);
  // The note under an own word claims no more than was checked.
  for (const lang of ['en', 'de']) assert.doesNotMatch(STRINGS[lang]['check.unchecked'], /Your sentence is right|Ihr Satz ist richtig/);
  assert.deepEqual(uncheckedWords(at(6, 1), 'Ich brauche einen Drucker.'), []);
  assert.deepEqual(uncheckedWords(at(6, 1), 'Ich brauche einen Quirl.'), ['Quirl']);
});

test('the further answers are verified by their own turn, carry no fault rule, and teach nothing', () => {
  let n = 0;
  for (const [key, answers] of Object.entries(A11_MORE_ANSWERS)) {
    const [nr, t, v] = key.split('.').map(Number);
    const turn = sitting(nr, v || 0)[t];
    assert.equal(new Set(answers).size, answers.length, `${key}: twice the same`);
    for (const a of answers) {
      if (a.includes('…')) continue;
      n += 1;
      assert.ok(verified(typedResult(turn, a)), `${key}: ${a} → ${typedResult(turn, a)} ${wrongReason(turn, a)}`);
      assert.ok(!englishIn(turn, a) && !articleFaultIn(lexicon, a), `${key}: ${a}`);
    }
  }
  assert.ok(n >= 600, `${n}`);
  for (const w of ['ursprünglich', 'mobilnummer', 'verzichte']) assert.ok(!lexicon.said.has(w), w);
});

test('what the corpora still showed after the first pass: the last praised and refused answers (2026-11-25)', () => {
  // Praised before: a filling the turn does not take beside a „Ja“, the partner named as the learner, a separable verb without its
  // part, a dative plural after an accusative determiner.
  for (const [nr, t, answer] of [[9, 5, 'Ja, ich möchte Tee.'], [9, 5, 'Ja, ich möchte auch Tee.'], [9, 5, 'Ja, ich nehme Kaffee.'], [6, 4, 'Guten Tag, Frau Weber!'], [6, 4, 'Guten Tag, Frau Weber! Hier ist Ana.'], [6, 4, 'Frau Weber.'],
    [11, 3, 'Ich stehe morgens um sieben Uhr.'], [8, 3, 'Ich stehe um sieben Uhr.'], [7, 2, 'Ich treffe gern meine Freunden.']]) assert.ok(!verified(typedResult(at(nr, t), answer)), answer);
  // Refused before, and right.
  for (const [nr, t, answer] of [[12, 2, 'Am 12. Mai ist mein Geburtstag.'], [12, 2, 'Am 18. Oktober ist mein Geburtstag.'], [11, 7, 'Gerne, ich komme mit dir mit.']]) assert.equal(typedResult(at(nr, t), answer), RESULT.CORRECT, answer);
  for (const [nr, t, answer] of [[9, 2, 'Ich möchte eine heiße Schokolade.'], [9, 6, 'Nein, danke, ich möchte lieber Kuchen.'], [12, 4, 'Sowohl Anna als auch Paul kommen.']]) assert.notEqual(typedResult(at(nr, t), answer), RESULT.WRONG, answer);
  assert.equal(typedResult(at(12, 2), 'Am 31. Februar ist mein Geburtstag.'), RESULT.WRONG);
  // A name, „jeden morgen“ and the polite „ihnen“ written small are the slip a small noun is everywhere.
  for (const [nr, t, answer] of [[1, 2, 'Ich heiße ana.'], [6, 4, 'Hier ist ana.'], [8, 3, 'Ich stehe jeden morgen um sieben auf.'], [1, 5, 'Wie geht es ihnen, Frau Kaya?']]) assert.equal(typedResult(at(nr, t), answer), RESULT.TYPO, answer);
  // The course's own right answers keep their names.
  assert.equal(typedResult(at(6, 4), 'Guten Tag, hier ist Ana Chakiri.'), RESULT.CORRECT);
  assert.equal(typedResult(at(9, 5), 'Ja, gern. Ich möchte Wasser.'), RESULT.CORRECT);
});

test('the blind corpora of 2026-11-25, every twentieth answer: correct German is not called wrong, wrong German is not praised', () => {
  const tally = { right: {}, wrong: {} };
  const worst = [];
  let i = 0;
  for (const who of ['codex', 'claude']) {
    const { answers } = JSON.parse(read(`docs/course-factory/a11-lektion-rollout/blind-corpus-2026-11-25/${who}.json`));
    for (const [id, { right, wrong }] of Object.entries(answers)) {
      const [, nr, t, r] = id.match(/^L(\d+)T(\d+)S(\d+)$/).map(Number);
      for (const [side, list] of [['right', right], ['wrong', wrong.map((w) => w.a)]]) {
        for (const a of list) {
          if ((i += 1) % 20) continue;
          const res = String(typedResult(sitting(nr, r)[t], a));
          tally[side][res] = (tally[side][res] || 0) + 1;
          if ((side === 'right' && res === 'wrong') || (side === 'wrong' && res === 'correct')) worst.push(`${id} ${side} ${res}: ${a}`);
        }
      }
    }
  }
  const total = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  // Measured over the whole corpora: right 85 % verified, none wrong; wrong 0.3 % correct. Ratchets on the sample.
  assert.ok((tally.right.correct || 0) / total(tally.right) >= 0.8, JSON.stringify(tally));
  assert.ok((tally.right.wrong || 0) <= 2, worst.join('\n'));
  assert.ok((tally.wrong.correct || 0) <= 3, worst.join('\n'));
  assert.ok(BEYOND);
});
