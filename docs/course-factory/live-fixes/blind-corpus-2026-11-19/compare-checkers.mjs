// node compare-checkers.mjs <repo> <blindDir> <oldCheck.js> — grades every corpus line (typed items and
// tiles, as grade-corpus.mjs does) with <repo>'s check.js and with an older check.js (a copy whose
// relative imports point back into <repo>), same pool, same items, and lists every line whose
// acceptance changed. The checker is the only difference, so this isolates a checker rule's effect.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [repo, dir, oldCheck] = process.argv.slice(2);
const imp = (p) => import(pathToFileURL(p).href);
const now = await imp(`${repo}/src/lib/lesson/check.js`);
const before = await imp(oldCheck);
const { derivedItems, ATTEMPT_CYCLE } = await imp(`${repo}/src/lib/lesson/buildLesson.js`);
const { CURRICULA } = await imp(`${repo}/src/data/curricula/index.js`);
const tileAnswers = JSON.parse(readFileSync(`${dir}/tile-answers.json`, 'utf8'));
const items = new Map(['a11', 'a12'].flatMap((lv) => JSON.parse(readFileSync(`${repo}/src/data/lessonPools/${lv}.json`, 'utf8')).items).map((i) => [i.id, i]));
const tiles = new Map();
for (const c of Object.values(CURRICULA)) for (const l of c.lektionen) for (let a = 1; a <= ATTEMPT_CYCLE; a += 1) for (const it of derivedItems(l, a).filter((x) => x.type === 'word_order')) tiles.set(it.answer, it);
const tasks = new Map(); const corpus = [];
for (const b of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && d.name !== 'slips-1')) {
  for (const l of readFileSync(`${dir}/${b.name}/items.jsonl`, 'utf8').split(/\r?\n/).filter(Boolean)) { const t = JSON.parse(l); tasks.set(t.id, t); }
  const f = `${dir}/${b.name}/answer.md`;
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.trim(); if (!m.startsWith('{')) continue;
    try { const r = JSON.parse(m); if (r.id && r.answer != null && /^(correct|wrong)$/.test(r.verdict)) corpus.push(r); } catch { /* skip */ }
  }
}
const target = (r) => {
  const t = tasks.get(r.id);
  if (t?.kind === 'tiles') return tiles.get(tileAnswers[r.id]) || null;
  const it = items.get(r.id);
  return it && it.minLektion != null && (!t || it.questionDe === t.promptDe) ? it : null;
};
const accepts = (checker, it, answer) => checker.checkAnswer(answer, it.accepted?.length ? it.accepted : [it.answer], checker.checkOptionsFor(it)).result !== checker.RESULT.WRONG;
const tally = { graded: 0, correctLines: 0, wrongLines: 0, newlyAcceptedCorrect: 0, newlyAcceptedWrong: 0, newlyRejectedCorrect: 0, newlyRejectedWrong: 0 };
for (const r of corpus) {
  const it = target(r); if (!it) continue;
  tally.graded += 1; tally[r.verdict === 'correct' ? 'correctLines' : 'wrongLines'] += 1;
  const a = accepts(before, it, r.answer); const b = accepts(now, it, r.answer);
  if (a === b) continue;
  const key = `newly${b ? 'Accepted' : 'Rejected'}${r.verdict === 'correct' ? 'Correct' : 'Wrong'}`;
  tally[key] += 1;
  console.log(`${key} ${r.id} «${r.answer}» — ${r.why}`);
}
console.log(`corpus lines: ${corpus.length}`);
console.log(JSON.stringify(tally));
