// node docs/course-factory/a11-lektion-rollout/tools/graded-examples.mjs <repo> <probe files…> → every probe answer of Lektionen 4-12 with the grade the course gives it (for a reviewer).
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [repo, ...files] = process.argv.slice(2);
const { CURRICULUM_A11: c } = await import(pathToFileURL(`${repo}/src/data/curricula/a11.js`));
const f = await import(pathToFileURL(`${repo}/src/lib/lesson/finalCheck.js`));
const lex = f.courseLexicon(c);
const s = (nr, r = 0) => f.checkTurns({ ...c.lektionen[nr - 1].guided.check, lexicon: lex }, r);
const [l4, l5, l6] = [s(4), s(5), s(6)];
const label = new Map();
for (const nr of [4, 5, 6, 7, 8, 9, 10, 11, 12]) for (let r = 0; r < 3; r += 1) s(nr, r).forEach((t, i) => { const k = t.taskEn + (t.cue?.de || '') + (t.listen || ''); label.set(k, label.has(k) ? `L${nr} turn ${i + 1} (every sitting)` : `L${nr} sitting ${r + 1} turn ${i + 1}`); });
const rows = new Map();
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  const body = src.slice(src.indexOf('const cases = [') + 'const cases = '.length, src.indexOf('];\n', src.indexOf('const cases = [')) + 1);
  const cases = new Function('s', 'l4', 'l5', 'l6', `return ${body};`)(s, l4, l5, l6);
  for (const [turn, answer] of cases) {
    const key = label.get(turn.taskEn + (turn.cue?.de || '') + (turn.listen || '')) || 'L? turn ?';
    const line = `${answer} → ${f.typedResult(turn, answer)}`;
    if (!rows.has(key)) rows.set(key, new Set());
    rows.get(key).add(line);
  }
}
const order = [...rows.keys()].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
for (const k of order) console.log(`${k}: ${[...rows.get(k)].join(' | ')}`);
