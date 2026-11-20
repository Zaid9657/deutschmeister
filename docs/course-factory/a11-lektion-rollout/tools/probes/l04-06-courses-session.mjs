// node docs/course-factory/a11-lektion-rollout/tools/probes/l04-06-courses-session.mjs <repo>: the courses session's findings of 2026-11-20 (A2), through the real grader.
import { pathToFileURL } from 'node:url';
const repo = process.argv[2];
const { CURRICULUM_A11: c } = await import(pathToFileURL(`${repo}/src/data/curricula/a11.js`));
const f = await import(pathToFileURL(`${repo}/src/lib/lesson/finalCheck.js`));
const lex = f.courseLexicon(c);
const s = (nr, r = 0) => f.checkTurns({ ...c.lektionen[nr - 1].guided.check, lexicon: lex }, r);
const cases = [
  // colours are a closed class
  [s(5)[3], 'Es ist groß.', 0], [s(5)[3], 'Es ist klein.', 0], [s(5)[3], 'Es ist neu.', 0], [s(5)[3], 'Es ist teuer.', 0], [s(5)[3], 'Es ist schön.', 0], [s(5)[3], 'Es ist alt.', 0],
  [s(5)[4], 'Ist deine Tasche klein?', 0], [s(5)[4], 'Ist deine Tasche groß?', 0],
  [s(5)[3], 'Es ist grün.', 1], [s(5)[3], 'Es ist grun.', 1], [s(5)[3], 'Es ist dunkelblau.', 1], [s(5)[3], 'Es ist hellgrün.', 1], [s(5)[3], 'Es ist hell grün.', 1], [s(5)[3], 'Es ist lila.', 1], [s(5)[3], 'Es ist grau.', 1], [s(5)[3], 'Es ist rot und weiß.', 1], [s(5)[3], 'Es ist orange.', 1],
  [s(5)[4], 'Ist deine Tasche rot?', 1], [s(5, 1)[4], 'Ist dein Stift blau oder schwarz?', 1],
  [s(5)[3], 'Mein Heft hat die Farbe Blau.', 1], [s(5)[3], 'Mein Heft hat die Farbe groß.', 0],
  // a thing is a noun
  [s(4)[5], 'Ich kaufe groß.', 0], [s(4)[5], 'Ich kaufe neu.', 0], [s(4)[5], 'Ich kaufe Bananen.', 1], [s(4)[5], 'Ich kaufe eine Banane.', 1], [s(4)[5], 'Ich kaufe zwei Bücher.', 1], [s(4)[5], 'Ich kaufe den Stuhl.', 1], [s(4)[5], 'Ich kaufe der Stuhl.', 0],
  [s(6)[0], 'Ich brauche einen Computer.', 1], [s(6)[0], 'Ich brauche klein.', 0], [s(6)[0], 'Ich brauche Wasser.', 1],
  // a colour before the noun, with its ending
  [s(4)[5], 'Ich kaufe die rote Lampe.', 1], [s(4)[5], 'Ich kaufe den roten Stuhl.', 1], [s(4)[5], 'Ich kaufe ein rotes Regal.', 1], [s(4)[5], 'Ich kaufe zwei rote Stühle.', 1],
  [s(4)[5], 'Ich kaufe die roten Lampe.', 0], [s(4)[5], 'Ich kaufe den rote Stuhl.', 0], [s(4)[5], 'Ich kaufe ein rote Regal.', 0], [s(4)[5], 'Ich kaufe die große Lampe.', 1], [s(4)[5], 'Ich kaufe die groß Lampe.', 0],
  [s(5)[0], 'Das ist ein roter Stift.', 1], [s(5)[0], 'Das ist eine blaue Tasche.', 1], [s(5)[0], 'Das ist ein rotes Heft.', 1], [s(5)[0], 'Das ist ein rote Stift.', 0], [s(5)[0], 'Das ist mein blaues Heft.', 1], [s(5)[0], 'Das ist ein lila Heft.', 1],
  // „möchte"
  [s(4)[5], 'Ich möchte die Uhr.', 1], [s(4)[5], 'Ich möchte die Uhr kaufen.', 1], [s(4)[5], 'Ich möchte der Uhr kaufen.', 0], [s(4)[5], 'Ich möchten die Uhr.', 0],
  // the old spelling
  [s(4)[1], 'Wieviel kostet die Uhr?', 1], [s(4)[1], 'Wieviel kostet der Uhr?', 0],
  // the phone name
  [s(6)[3], 'Guten Tag, Herr Weber. Hier ist Omar Haddad.', 1], [s(6)[3], 'Guten Tag, Herr Weber, hier ist Omar Haddad.', 1], [s(6)[3], 'Guten Tag Herr Weber, hier ist Haddad.', 1], [s(6)[3], 'Hallo Herr Weber, hier ist Omar.', 1], [s(6)[3], 'Hier spricht Omar Haddad.', 1],
  [s(6)[3], 'Guten Tag, Herr Weber.', 0], [s(6)[3], 'Guten Tag Herr Weber.', 0], [s(6)[3], 'Hallo Herr Weber, hier ist.', 0],
  // the break
  [s(6)[2], 'Wann beginnt die Pause?', 1], [s(6)[2], 'Wann fängt die Pause an?', 1], [s(6)[2], 'Wann ist meine Pause?', 1], [s(6)[2], 'Wann ist die Mittagspause?', 1], [s(6)[2], 'Wann machen wir Pause?', 1], [s(6)[2], 'Wann beginnen die Pause?', 0],
];
let bad = 0;
for (const [turn, answer, right] of cases) {
  const got = f.typedResult(turn, answer);
  if ((got !== 'wrong') !== Boolean(right)) { bad += 1; console.log(`FAIL want ${right ? 'right' : 'wrong'} got ${got}: ${answer}`); }
}
console.log(bad ? `${bad} of ${cases.length} FAIL` : `all ${cases.length} as intended`);
