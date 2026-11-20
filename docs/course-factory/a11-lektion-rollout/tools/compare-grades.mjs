// node docs/course-factory/a11-lektion-rollout/tools/compare-grades.mjs <before-repo> <after-repo> <corpus.json>...  (before: e.g. git archive <ref> src | tar -x -C <dir>) → every answer whose grade changed, and which way.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [before, after, ...files] = process.argv.slice(2);
const load = async (repo) => ({ c: (await import(pathToFileURL(`${repo}/src/data/curricula/a11.js`))).CURRICULUM_A11, f: await import(pathToFileURL(`${repo}/src/lib/lesson/finalCheck.js`)) });
const [B, A] = [await load(before), await load(after)];
const grade = ({ c, f }, it) => { const lex = f.courseLexicon(c); const turn = f.checkTurns({ ...c.lektionen[it.lektion - 1].guided.check, lexicon: lex }, (it.sitting || 1) - 1)[it.turn - 1]; return f.typedResult(turn, it.answer); };
let toward = 0; let away = 0; let other = 0; let n = 0;
for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  for (const it of JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)).items) {
    n += 1;
    const [b, a] = [grade(B, it), grade(A, it)];
    if (b === a) continue;
    const ok = (r) => (r === 'wrong' ? 'wrong' : 'right') === it.verdict;
    const kind = ok(a) && !ok(b) ? 'TOWARD' : !ok(a) && ok(b) ? 'AWAY' : 'same-side';
    if (kind === 'TOWARD') toward += 1; else if (kind === 'AWAY') away += 1; else other += 1;
    console.log(`${kind} L${it.lektion} s${it.sitting} t${it.turn} teacher=${it.verdict} ${b}→${a}: ${it.answer.replace(/\n/g, ' / ')}`);
  }
}
console.log(`${n} answers: ${toward} moved toward the teacher, ${away} away, ${other} changed within the same side (e.g. wrong→typo is not possible here; correct↔typo)`);
