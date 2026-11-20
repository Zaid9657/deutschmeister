// node docs/course-factory/a11-lektion-rollout/tools/probes/l02-03-spot-check.mjs <repo>: the orchestrator's spot-check classes and the ones it saw working, through the real grader.
import { pathToFileURL } from 'node:url';
const repo = process.argv[2];
const { CURRICULUM_A11: c } = await import(pathToFileURL(`${repo}/src/data/curricula/a11.js`));
const f = await import(pathToFileURL(`${repo}/src/lib/lesson/finalCheck.js`));
const lexicon = f.courseLexicon(c);
const t2 = f.checkTurns({ ...c.lektionen[1].guided.check, lexicon }, 0);
const t3 = f.checkTurns({ ...c.lektionen[2].guided.check, lexicon }, 0);
const cases = [
  ['date', t2[6], 'Ich heiße Omar. Ich bin am 12.03.1990 geboren.', 'right'],
  ['date', t2[6], 'Ich heiße Omar. Ich bin am 12.3.1990 geboren.', 'right'],
  ['date', t2[6], 'Ich heiße Omar. Ich bin am 12.03.90 geboren.', 'right'],
  ['date', t2[6], 'Ich heiße Omar. Ich bin am 12/03/1990 geboren.', 'right'],
  ['date', t2[6], 'Ich heiße Omar. Ich bin am 12-03-1990 geboren.', 'right'],
  ['date', t2[6], 'Ich heiße Omar. Ich bin am 12. März 1990 geboren.', 'right'],
  ['date', t2[6], 'Ich heiße Omar. Ich bin am 1. Januar 1990 geboren.', 'right'],
  ['date', t2[6], 'Ich heiße Omar. Ich bin am 12.03. geboren.', 'wrong'],
  ['date', t2[6], 'Ich heiße Omar. Ich bin 1990 geboren.', 'wrong'],
  ['date', t2[6], 'Ich heiße Omar. Ich bin am 31.04.1990 geboren.', 'wrong'],
  ['date', t2[6], 'Ich heiße Omar. Ich bin am 29.02.1991 geboren.', 'wrong'],
  ['date', t2[6], 'Ich heiße Omar. Ich bin am 29.02.1992 geboren.', 'right'],
  ['place', t2[0], 'Ich komme aus den USA.', 'right'],
  ['place', t2[1], 'Ich wohne in der Schweiz.', 'right'],
  ['place', t2[1], 'Ich wohne im Irak.', 'right'],
  ['place', t2[1], 'Ich wohne in den USA.', 'right'],
  ['place', t2[0], 'Ich komme aus die Deutschland.', 'wrong'],
  ['place', t2[1], 'Ich wohne in der Bremen.', 'wrong'],
  ['place', t2[1], 'Ich wohne im Bremen.', 'wrong'],
  ['adverb', t2[1], 'Ich wohne jetzt in Köln.', 'right'],
  ['adverb', t2[1], 'Jetzt wohne ich in Köln.', 'right'],
  ['adverb', t2[1], 'Ich wohne hier in Bremen.', 'right'],
  ['front', t2[0], 'Aus Syrien komme ich.', 'right'],
  ['front', t2[1], 'In Bremen wohne ich.', 'right'],
  ['front', t2[0], 'Aus Syrien ich komme.', 'wrong'],
  ['name', t2[6], 'Ich bin Omar. Ich bin am 3.5.1990 geboren.', 'right'],
  ['name', t2[6], 'Ich bin Lehrer. Ich bin am 3.5.1990 geboren.', 'wrong'],
  ['clause', t3[4], 'Ich spreche Arabisch und lerne Deutsch.', 'right'],
  ['clause', t3[4], 'Ich spreche Arabisch und ein bisschen Deutsch.', 'right'],
  ['clause', t3[4], 'Ich spreche Arabisch und Marokko.', 'wrong'],
  ['keep', t2[0], 'Ich kommen aus Syrien.', 'wrong'],
  ['keep', t2[2], 'Ich bin müde.', 'wrong'],
  ['keep', t2[5], '0421 3619', 'wrong'],
  ['keep', t2[5], '٠٤٢١٣٦١٨', 'right'],
  ['keep', t2[6], 'Ich bin am 3.5.1990 geboren.', 'wrong'],
  ['keep', t3[3], 'Sie spricht Kurdisch.', 'right'],
  ['keep', t2[2], 'Ich bin Krankenpfleger.', 'right'],
];
let bad = 0;
for (const [kind, turn, answer, want] of cases) {
  const got = f.typedResult(turn, answer);
  const ok = (got === 'wrong') === (want === 'wrong');
  if (!ok) bad += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${kind.padEnd(7)} ${got.padEnd(7)} ${answer}`);
}
console.log(bad ? `${bad} FAIL` : 'all as intended');
