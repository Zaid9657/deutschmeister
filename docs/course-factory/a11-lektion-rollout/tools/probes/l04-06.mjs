// node docs/course-factory/a11-lektion-rollout/tools/probes/l04-06.mjs <repo>: right and wrong answers for the Lektion 4–6 checks, through the real grader.
import { pathToFileURL } from 'node:url';
const repo = process.argv[2];
const { CURRICULUM_A11: c } = await import(pathToFileURL(`${repo}/src/data/curricula/a11.js`));
const f = await import(pathToFileURL(`${repo}/src/lib/lesson/finalCheck.js`));
const lexicon = f.courseLexicon(c);
const s = (nr, r = 0) => f.checkTurns({ ...c.lektionen[nr - 1].guided.check, lexicon }, r);
const [l4, l5, l6] = [s(4), s(5), s(6)];
const cases = [
  [l4[0], 'Was ist das?', 1], [l4[0], 'Entschuldigung, was ist das?', 1], [l4[0], 'Was das ist?', 0],
  [l4[1], 'Was kostet sie?', 1], [l4[1], 'Wie viel kostet die Uhr?', 1], [l4[1], 'Was kostet er?', 0], [l4[1], 'Was kostet der Uhr?', 0], [l4[1], 'Was kosten die Uhr?', 0],
  [l4[2], '18', 1], [l4[2], '18 Euro', 1], [l4[2], '18 €', 1], [l4[2], 'achtzehn Euro', 1], [l4[2], '80', 0], [l4[2], '81', 0],
  [l4[3], 'Was kostet der Stuhl?', 1], [l4[3], 'Und der Stuhl?', 1], [l4[3], 'Was kostet der Stuhl, bitte?', 1], [l4[3], 'Was kostet den Stuhl?', 0], [l4[3], 'Was kostet die Stuhl?', 0],
  [l4[5], 'Ich kaufe den Stuhl.', 1], [l4[5], 'Ich kaufe den Stuhl und die Lampe.', 1], [l4[5], 'Ich kaufe zwei Stühle.', 1], [l4[5], 'Ich kaufe eine Lampe.', 1], [l4[5], 'Ich kaufe das Regal.', 1],
  [l4[5], 'Ich kaufe der Stuhl.', 0], [l4[5], 'Ich kaufe die Stuhl.', 0], [l4[5], 'Ich kaufe Stuhl.', 0], [l4[5], 'Ich kaufe teuer.', 0], [l4[5], 'Ich kaufe einen Tisch.', 1],
  [l4[4], '30', 1], [l4[4], '30 Euro', 1], [l4[4], '13', 0],
  [l5[0], 'Das ist ein Heft.', 1], [l5[0], 'Das ist mein Wörterbuch.', 1], [l5[0], 'Das ist eine Schere.', 1], [l5[0], 'Das ist der Stift.', 1], [l5[0], 'Das ist ein Schere.', 0], [l5[0], 'Das ist eine Heft.', 0], [l5[0], 'Das ist meine Bleistift.', 0], [l5[0], 'Das sind meine Bücher.', 1], [l5[0], 'Das ist blau.', 0],
  [l5[1], 'Es ist hier.', 1], [l5[1], 'Mein Wörterbuch ist da.', 1], [l5[1], 'Hier.', 1], [l5[1], 'Hier ist es.', 1], [l5[1], 'Er ist hier.', 0], [l5[1], 'Es ist dort.', 0],
  [l5[2], 'Wo ist mein Stift?', 1], [l5[2], 'Lena, wo ist mein Stift?', 1], [l5[2], 'Wo ist meine Stift?', 0], [l5[2], 'Wo mein Stift ist?', 0],
  [l5[3], 'Es ist grün.', 1], [l5[3], 'Mein Heft ist rot und weiß.', 1], [l5[3], 'Es ist lila.', 1], [l5[3], 'Es ist hier.', 0], [l5[3], 'Sie ist grün.', 0], [l5[3], 'Es ist Tisch.', 0],
  [l5[4], 'Welche Farbe hat deine Tasche?', 1], [l5[4], 'Ist deine Tasche rot?', 1], [l5[4], 'Welche Farbe hat dein Tasche?', 0], [l5[4], 'Welche Farbe hat Ihre Tasche?', 0],
  [l6[0], 'Ich brauche einen Computer.', 1], [l6[0], 'Ich brauche einen Computer und ein Telefon.', 1], [l6[0], 'Ich brauche eine E-Mail-Adresse.', 1], [l6[0], 'Ich brauche ein Computer.', 0], [l6[0], 'Ich brauche einen Telefon.', 0], [l6[0], 'Ich brauche einen Kaffee.', 1],
  [l6[1], 'Wo ist mein Büro?', 1], [l6[1], 'Wo ist Ihr Büro?', 0], [l6[1], 'Ist das mein Büro?', 0], [l6[1], 'Und mein Büro?', 0], [l6[2], 'Wann ist die Pause?', 1], [l6[2], 'Wann ist Pause?', 1], [l6[2], 'Wo ist die Pause?', 0],
  [l6[3], 'Hier ist Zaid Ahmad.', 1], [l6[3], 'Guten Tag, hier ist Zaid.', 1], [l6[3], 'Zaid Ahmad.', 1], [l6[3], 'Ich heiße Omar.', 1], [l6[3], 'Guten Morgen.', 0], [l6[3], 'Hier ist Büro.', 0],
  [l6[4], '0421 5730', 1], [l6[4], '04215730', 1], [l6[4], '0421 5703', 0], [l6[5], '0171 234 5678', 1], [l6[5], '01712345678', 1], [l6[5], '0171 2345 678', 1], [l6[5], '0171 234 5679', 0],
  // DaF review round 1 (2026-11-19)
  [l4[1], 'Wie teuer ist die Uhr?', 1], [l4[1], 'Wie teuer ist sie?', 1], [l4[3], 'Wie teuer ist der Stuhl?', 1], [l4[3], 'Und was kostet der Stuhl?', 1], [l4[3], 'Wie teuer ist die Stuhl?', 0],
  [l4[4], 'Das macht zusammen 30 Euro.', 1], [l4[4], '30 Euro', 1], [l4[4], '13 Euro', 0],
  [l5[0], 'Das sind ein Stift.', 0], [l5[0], 'Das ist meine Bücher.', 0], [l5[0], 'Das sind zwei Stifte.', 1], [l5[0], 'Das ist Papier.', 1], [l5[0], 'Das sind ein Heft und ein Stift.', 1], [l5[0], 'Das ist ein Heft und ein Stift.', 0], [l5[0], 'Das ist Heft.', 0],
  [l5[1], 'Das ist hier.', 1], [l5[1], 'Das ist da.', 1],
  [l5[4], 'Ist die Tasche rot?', 1], [l5[4], 'Ist der Tasche rot?', 0],
  [l6[3], 'Hier ist Frau Braun.', 1], [l6[3], 'Ich heiße Ana Braun.', 1], [l6[3], 'Hier ist Ana Braun.', 1], [l6[3], 'Gut.', 0], [l6[3], 'Danke.', 0], [l6[3], 'Hier ist Lehrer.', 0], [l6[3], 'Guten Tag, ich heiße Zaid.', 1], [l6[3], 'Hier ist Frau.', 0],
];
let bad = 0;
for (const [turn, answer, right] of cases) {
  const got = f.typedResult(turn, answer);
  const ok = (got !== 'wrong') === Boolean(right);
  if (!ok) { bad += 1; console.log(`FAIL want ${right ? 'right' : 'wrong'} got ${got}: ${answer}`); }
}
console.log(bad ? `${bad} of ${cases.length} FAIL` : `all ${cases.length} as intended`);
