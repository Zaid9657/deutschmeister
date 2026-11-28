// node docs/course-factory/a11-lektion-rollout/tools/probes/own-words.mjs <repo>: the own-word policy (2026-11-20) —
// places, jobs, languages and own things, right and wrong, through the real grader. 1 = right, 0 = wrong.
import { pathToFileURL } from 'node:url';
const repo = process.argv[2];
const { CURRICULUM_A11: c } = await import(pathToFileURL(`${repo}/src/data/curricula/a11.js`));
const f = await import(pathToFileURL(`${repo}/src/lib/lesson/finalCheck.js`));
const lex = f.courseLexicon(c);
const s = (nr, r = 0) => f.checkTurns({ ...c.lektionen[nr - 1].guided.check, lexicon: lex }, r);
const cases = [
  // where from, where one lives (Lektion 2), where one goes (Lektion 10)
  [s(2)[0], 'Ich komme aus Syrien.', 1], [s(2)[0], 'Ich komme aus Eritrea.', 1], [s(2)[0], 'Ich komme aus der Türkei.', 1], [s(2)[0], 'Ich komme aus Damaskus.', 1],
  [s(2)[0], 'Ich komme aus Afghanistan.', 1], [s(2)[0], 'Ich komme aus Tuerkei.', 0], [s(2)[0], 'Ich komme aus müde.', 0], [s(2)[0], 'Ich komme aus Lehrer.', 0],
  [s(2)[1], 'Ich wohne in Hamburg.', 1], [s(2)[1], 'Ich wohne in Nordenham.', 1], [s(2)[1], 'Ich wohne in Muenchen.', 1], [s(2)[1], 'Ich wohne in Arbeit.', 0],
  [s(2)[1], 'Ich wohne in Lehrer.', 0], [s(2)[1], 'Ich wohne in Deutsch.', 0], [s(10)[0], 'Ich fahre nach Hamburg.', 1], [s(10)[0], 'Ich fahre nach Kuchen.', 0],
  // a job (Lektion 2)
  [s(2)[2], 'Ich bin Tischler.', 1], [s(2)[2], 'Ich bin Krankenpfleger.', 1], [s(2)[2], 'Ich bin Bauingenieur.', 1], [s(2)[2], 'Ich bin Pflegekraft.', 1],
  [s(2)[2], 'Ich bin Köchin.', 1], [s(2)[2], 'Ich bin arbeitslos.', 1], [s(2)[2], 'Ich bin Limonade.', 0], [s(2)[2], 'Ich bin muede.', 0], [s(2)[2], 'Ich bin müde.', 0],
  [s(2)[2], 'Ich bin Brötchen.', 0], [s(2)[2], 'Ich bin Bremen.', 0], [s(2)[2], 'Ich bin Deutsch.', 0], [s(2)[2], 'Ich bin Kaffee.', 0],
  // a language (Lektion 3)
  [s(3)[3], 'Sie spricht Kurdisch und Arabisch.', 1], [s(3)[3], 'Sie spricht Tigrinya.', 1], [s(3)[3], 'Sie spricht Tigrinisch.', 1], [s(3)[3], 'Sie spricht Farsi.', 1],
  [s(3)[3], 'Sie spricht Brötchen.', 0], [s(3)[3], 'Sie spricht Limonade.', 0], [s(3)[3], 'Sie spricht Syrien.', 0], [s(3)[3], 'Sie spricht Kaffee.', 0], [s(3)[3], 'Sie spricht Lehrer.', 0],
  [s(3)[4], 'Ich spreche Persisch und ein bisschen Deutsch.', 1], [s(3)[4], 'Ich spreche Marokko.', 0],
  // own things (Lektionen 4, 6, 9)
  [s(4)[5], 'Ich kaufe Bananen.', 1], [s(6)[0], 'Ich brauche einen Drucker.', 1], [s(9)[1], 'Ich möchte einen Ayran.', 1],
];
let bad = 0;
for (const [turn, answer, right] of cases) {
  const got = f.typedResult(turn, answer);
  if ((got === 'beyond' ? 'b' : got === 'wrong' ? 0 : 1) !== (right === 'b' ? 'b' : right ? 1 : 0)) { bad += 1; console.log(`FAIL want ${right === 'b' ? 'beyond' : right ? 'right' : 'wrong'} got ${got}: ${answer}`); }
}
console.log(bad ? `${bad} of ${cases.length} FAIL` : `all ${cases.length} as intended`);
