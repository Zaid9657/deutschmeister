// node docs/course-factory/a11-lektion-rollout/tools/score-corpus.mjs <repo> <corpus.json> → every blind answer, graded by the course, against the teacher's verdict.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [repo, file] = process.argv.slice(2);
const { CURRICULUM_A11: c } = await import(pathToFileURL(`${repo}/src/data/curricula/a11.js`));
const fc = await import(pathToFileURL(`${repo}/src/lib/lesson/finalCheck.js`));
const raw = readFileSync(file, 'utf8');
const items = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)).items;
const lex = fc.courseLexicon ? fc.courseLexicon(c) : undefined;
let agree = 0; const mismatches = []; const beyond = [];
for (const it of items) {
  const l = c.lektionen[it.lektion - 1];
  const check = lex ? { ...l.guided.check, lexicon: lex } : l.guided.check;
  const turn = fc.checkTurns(check, (it.sitting || 1) - 1)[it.turn - 1];
  const r = fc.typedResult(turn, it.answer);
  // A typo counts on the second try, so TYPO is "right" for a teacher who forgives a mere slip. BEYOND (the third
  // outcome) is neither: the learner is shown the Lektion's way and answers once more.
  const course = r === 'wrong' ? 'wrong' : r === 'beyond' ? 'beyond' : 'right';
  if (course === it.verdict) agree += 1; else (course === 'beyond' ? beyond : mismatches).push(`L${it.lektion} s${it.sitting} t${it.turn} teacher=${it.verdict} course=${r}: ${it.answer}  (${it.why})`);
}
console.log(`${agree}/${items.length} agree, ${beyond.length} beyond (neither right nor wrong), ${mismatches.length} disagree`);
for (const m of mismatches) console.log(m);
for (const m of beyond) console.log(`BEYOND ${m}`);
