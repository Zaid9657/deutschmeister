// node docs/course-factory/a11-lektion-rollout/tools/score-corpus.mjs <repo> <corpus.json> → every blind answer, graded by the course, against the teacher's verdict.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [repo, file] = process.argv.slice(2);
const { CURRICULUM_A11: c } = await import(pathToFileURL(`${repo}/src/data/curricula/a11.js`));
const fc = await import(pathToFileURL(`${repo}/src/lib/lesson/finalCheck.js`));
const raw = readFileSync(file, 'utf8');
const items = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)).items;
const lex = fc.courseLexicon ? fc.courseLexicon(c) : undefined;
let agree = 0; const mismatches = [];
for (const it of items) {
  const l = c.lektionen[it.lektion - 1];
  const check = lex ? { ...l.guided.check, lexicon: lex } : l.guided.check;
  const turn = fc.checkTurns(check, (it.sitting || 1) - 1)[it.turn - 1];
  const r = fc.typedResult(turn, it.answer);
  // A typo counts on the second try, so TYPO is "right" for a teacher who forgives a mere slip.
  const course = r === 'wrong' ? 'wrong' : 'right';
  if (course === it.verdict) agree += 1; else mismatches.push(`L${it.lektion} s${it.sitting} t${it.turn} teacher=${it.verdict} course=${r}: ${it.answer}  (${it.why})`);
}
console.log(`${agree}/${items.length} agree`);
for (const m of mismatches) console.log(m);
