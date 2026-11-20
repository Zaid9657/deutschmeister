// node docs/course-factory/a11-lektion-rollout/tools/probes/l04-06-review-2.mjs <repo>: the second DaF review's claims (2026-11-20), through the real grader.
import { pathToFileURL } from 'node:url';
const repo = process.argv[2];
const { CURRICULUM_A11: c } = await import(pathToFileURL(`${repo}/src/data/curricula/a11.js`));
const f = await import(pathToFileURL(`${repo}/src/lib/lesson/finalCheck.js`));
const lex = f.courseLexicon(c);
const s = (nr, r = 0) => f.checkTurns({ ...c.lektionen[nr - 1].guided.check, lexicon: lex }, r);
const cases = [
  [s(4)[1], 'Wie viel?', 1], [s(4)[1], 'Die Uhr? Was kostet sie?', 1], [s(4, 1)[1], 'Der Rucksack? Was kostet er?', 1], [s(4, 2)[1], 'Das Regal? Was kostet es?', 1], [s(4)[1], 'Die Uhr? Was kostet er?', 0],
  [s(4)[3], 'Was kostet ein Stuhl?', 1], [s(4, 1)[3], 'Wie viel kostet eine Lampe?', 1], [s(4)[3], 'Was kostet eine Stuhl?', 0],
  [s(4)[2], '18 Euro', 1], [s(4)[2], '18 €', 1], [s(4)[2], 'achtzehn Euro', 1], [s(4)[2], '18-20 Euro', 0], [s(4)[2], '18 oder 19', 0],
  [s(5)[1], 'Das ist hier.', 1], [s(5, 1)[1], 'Das ist hier.', 0], [s(5, 1)[1], 'Die ist hier.', 1], [s(5, 2)[1], 'Der ist da.', 1], [s(5, 2)[1], 'Das ist da.', 0], [s(5, 1)[1], 'Hier.', 1],
  [s(5)[3], 'Das ist grün.', 1], [s(5, 1)[3], 'Die ist schwarz.', 1], [s(5, 2)[3], 'Der ist blau.', 1], [s(5)[3], 'Der ist grün.', 0], [s(5)[3], 'Es ist rot und blau.', 1], [s(5)[3], 'Es ist teuer.', 0],
  [s(5, 1)[4], 'Ist dein Stift blau oder schwarz?', 1], [s(5)[4], 'Ist deine Tasche rot oder blau?', 1],
  [s(6)[3], 'Guten Tag, ich bin Zaid.', 1], [s(6)[3], 'Hallo, ich heiße Zaid Ahmad.', 1], [s(6)[3], 'Guten Morgen, hier ist Ana Braun.', 1], [s(6)[3], 'Guten Tag.', 0], [s(6)[3], 'Ich heiße', 0],
  [s(6)[4], '04215730', 1], [s(6)[4], '0421 5730', 1], [s(6)[4], '0421-5730', 1], [s(6)[4], '4215730', 0], [s(6)[4], '0421 5703', 0],
  [s(4)[5], 'Ich kaufe den Stuhl.', 1], [s(4)[5], 'Ich kaufe der Stuhl.', 0], [s(4)[5], 'Ich kaufe den Tisch, das Regal und die Lampe.', 1],
  [s(6)[0], 'Ich brauche einen Computer.', 1], [s(6)[0], 'Ich brauche ein Computer.', 0], [s(5)[0], 'Das ist eine Schere.', 1], [s(5)[0], 'Das ist ein Schere.', 0],
];
let bad = 0;
for (const [turn, answer, right] of cases) {
  const got = f.typedResult(turn, answer);
  if ((got !== 'wrong') !== Boolean(right)) { bad += 1; console.log(`FAIL want ${right ? 'right' : 'wrong'} got ${got}: ${answer}`); }
}
console.log(bad ? `${bad} of ${cases.length} FAIL` : `all ${cases.length} as intended`);
