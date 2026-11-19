// node grade-corpus.mjs <repo> <blindDir> [--main <mainRepo>] — grades the blind corpus with the real checker.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [repo, dir] = process.argv.slice(2);
const imp = (root, p) => import(pathToFileURL(`${root}/${p}`).href);
const tileAnswers = JSON.parse(readFileSync(`${dir}/tile-answers.json`, 'utf8'));
const corpus = []; const tasks = new Map();
for (const b of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const l of readFileSync(`${dir}/${b.name}/items.jsonl`, 'utf8').split('\n').filter(Boolean)) { const t = JSON.parse(l); tasks.set(t.id, { ...t, batch: b.name }); }
  const f = `${dir}/${b.name}/answer.md`;
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.trim().replace(/^```\w*$/, ''); if (!m.startsWith('{')) continue;
    try { const r = JSON.parse(m); if (r.id && r.answer != null && /^(correct|wrong)$/.test(r.verdict)) corpus.push({ ...r, batch: b.name }); } catch { /* skip */ }
  }
}
async function grader(root) {
  const { checkAnswer, checkOptionsFor, RESULT } = await imp(root, 'src/lib/lesson/check.js');
  const { derivedItems, ATTEMPT_CYCLE } = await imp(root, 'src/lib/lesson/buildLesson.js');
  const { CURRICULA } = await imp(root, 'src/data/curricula/index.js');
  const items = new Map(['a11', 'a12'].flatMap((lv) => JSON.parse(readFileSync(`${root}/src/data/lessonPools/${lv}.json`, 'utf8')).items).map((i) => [i.id, i]));
  const tiles = new Map();
  for (const c of Object.values(CURRICULA)) for (const l of c.lektionen) for (let a = 1; a <= ATTEMPT_CYCLE; a += 1) for (const it of derivedItems(l, a).filter((x) => x.type === 'word_order')) tiles.set(it.answer, it);
  return (r) => {
    const task = tasks.get(r.id);
    if (task?.kind === 'tiles') {
      const it = tiles.get(tileAnswers[r.id]);
      if (!it) return { served: false };
      return { served: true, accepted: checkAnswer(r.answer, it.accepted, checkOptionsFor(it)).result !== RESULT.WRONG };
    }
    const it = items.get(r.id);
    if (!it || it.minLektion == null) return { served: false };
    if (task && it.questionDe !== task.promptDe) return { served: false, promptChanged: true };
    return { served: true, accepted: checkAnswer(r.answer, it.accepted?.length ? it.accepted : [it.answer], checkOptionsFor(it)).result !== RESULT.WRONG };
  };
}
const roots = [['branch', repo]]; const mi = process.argv.indexOf('--main'); if (mi > 0) roots.push(['main', process.argv[mi + 1]]);
const report = {}; const misses = {}; const perLine = {};
for (const [name, root] of roots) {
  const g = await grader(root); const stats = {}; misses[name] = []; perLine[name] = corpus.map((r) => g(r));
  for (const r of corpus) {
    const res = g(r); const group = r.batch.replace(/-\d+$/, '');
    const s = stats[group] ||= { correct: 0, correctRejected: 0, wrong: 0, wrongAccepted: 0, notComparable: 0 };
    if (!res.served) { s.notComparable += 1; continue; }
    if (r.verdict === 'correct') { s.correct += 1; if (!res.accepted) { s.correctRejected += 1; misses[name].push(`REJECTED-CORRECT ${r.id} «${r.answer}» — ${r.why}`); } }
    else { s.wrong += 1; if (res.accepted) { s.wrongAccepted += 1; misses[name].push(`ACCEPTED-WRONG ${r.id} «${r.answer}» — ${r.why}`); } }
  }
  report[name] = stats;
}
console.log(`corpus lines: ${corpus.length}; tasks covered: ${new Set(corpus.map((r) => r.id)).size}/${tasks.size}`);
console.log(JSON.stringify(report, null, 1));
writeFileSync(`${dir}/misses.json`, JSON.stringify(misses, null, 1));
for (const [name, list] of Object.entries(misses)) console.log(`${name}: ${list.length} disagreements → ${dir}/misses.json`);
if (perLine.main) {
  const pair = { correctBoth: 0, rejMain: 0, rejBranch: 0, fixedByBranch: 0, newlyRejected: 0, wrongBoth: 0, accMain: 0, accBranch: 0 };
  corpus.forEach((r, i) => {
    const b = perLine.branch[i]; const m = perLine.main[i];
    if (!b.served || !m.served) return;
    if (r.verdict === 'correct') {
      pair.correctBoth += 1; if (!m.accepted) pair.rejMain += 1; if (!b.accepted) pair.rejBranch += 1;
      if (!m.accepted && b.accepted) pair.fixedByBranch += 1; if (m.accepted && !b.accepted) pair.newlyRejected += 1;
    } else { pair.wrongBoth += 1; if (m.accepted) pair.accMain += 1; if (b.accepted) pair.accBranch += 1; }
  });
  console.log('PAIRED (lines both can grade):', JSON.stringify(pair));
}
process.exit(0);