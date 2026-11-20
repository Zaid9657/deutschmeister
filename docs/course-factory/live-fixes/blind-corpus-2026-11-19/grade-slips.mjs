// node grade-slips.mjs <repo> <slipsDir> [--save <file>] [--compare <file>]
// Grades the blind slip corpus (slips-1: keyboard slips, look-alike mistakes, Arabic-Indic digits) with
// <repo>'s real checker. Verdicts: right/slip must be accepted (CORRECT or TYPO), wrong must be WRONG.
// A gap task is answered by its gap only: the gap word is read off the whole sentence Codex wrote by
// matching it against the printed sentence; a slip outside the gap is in text the learner never types,
// so that line is not comparable. --save writes per-line results; --compare lists the lines whose
// acceptance changed against an earlier --save.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [repo, dir] = process.argv.slice(2);
const opt = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const imp = (p) => import(pathToFileURL(`${repo}/${p}`).href);
const { checkAnswer, checkOptionsFor, RESULT } = await imp('src/lib/lesson/check.js');
const items = new Map(['a11', 'a12'].flatMap((lv) => JSON.parse(readFileSync(`${repo}/src/data/lessonPools/${lv}.json`, 'utf8')).items).map((i) => [i.id, i]));
const tasks = new Map(readFileSync(`${dir}/items.jsonl`, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)).map((t) => [t.id, t]));
const lines = readFileSync(`${dir}/answer.md`, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l.startsWith('{'))
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter((r) => r && tasks.has(r.id) && /^(right|slip|wrong)$/.test(r.verdict));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fold = (s) => String(s).normalize('NFC').replace(/[„“"”]/g, '"').replace(/\s+/g, ' ').trim();

function gapAnswer(promptDe, answer) {
  // The printed sentence: after a colon task line, before trailing bracketed cues, the dash variant's tail.
  let frame = promptDe.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  if (frame.includes(' — ')) frame = frame.split(' — ').find((p) => p.includes('___')) || frame;
  if (/^[^_]*:\s/.test(frame) && frame.indexOf(':') < frame.indexOf('___')) frame = frame.slice(frame.indexOf(':') + 1).trim();
  const [before, after] = frame.split('___').map((s) => fold(s).replace(/[.?!]+$/, ''));
  const m = new RegExp(`^${esc(before)}\\s*(.+?)\\s*${esc(after)}[.?!]*$`, 'u').exec(fold(answer).replace(/[.?!]+$/, ''));
  return m ? m[1] : (fold(answer).split(' ').length === 1 ? fold(answer) : null);
}

function grade(r) {
  const t = tasks.get(r.id);
  let item; let answer = r.answer;
  if (t.kind === 'dictation') {
    item = { id: r.id, topic: 'hoeren', kind: 'dictation', stage: 'dictation', type: 'dictation', answer: t.heardDe, accepted: [t.heardDe] };
  } else {
    item = items.get(r.id);
    if (!item || item.minLektion == null) return { comparable: false, why: 'not served' };
    if (item.questionDe !== t.promptDe) return { comparable: false, why: 'prompt changed since the corpus was written' };
    if (item.type === 'fill_blank' && item.questionDe.includes('___') && !/ganzen Satz/.test(item.questionDe)) {
      answer = gapAnswer(item.questionDe, r.answer);
      if (answer == null) return { comparable: false, why: 'slip outside the gap' };
    }
  }
  const accepted = item.accepted?.length ? item.accepted : [item.answer];
  const { result } = checkAnswer(answer, accepted, checkOptionsFor(item));
  return { comparable: true, typed: answer, result, accepted: result !== RESULT.WRONG };
}

const results = lines.map((r) => ({ id: r.id, answer: r.answer, verdict: r.verdict, why: r.why, ...grade(r) }));
const stats = { lines: results.length, comparable: 0, shouldAccept: 0, rejected: 0, shouldReject: 0, accepted: 0, typo: 0 };
for (const r of results.filter((x) => x.comparable)) {
  stats.comparable += 1;
  if (r.result === 'typo') stats.typo += 1;
  if (r.verdict === 'wrong') { stats.shouldReject += 1; if (r.accepted) stats.accepted += 1; } else { stats.shouldAccept += 1; if (!r.accepted) stats.rejected += 1; }
}
console.log(JSON.stringify(stats));
if (opt('--save')) writeFileSync(opt('--save'), JSON.stringify(results, null, 1));
if (opt('--compare')) {
  const before = JSON.parse(readFileSync(opt('--compare'), 'utf8'));
  const changed = results.map((r, i) => [before[i], r]).filter(([b, a]) => b && a.comparable && b.comparable && b.accepted !== a.accepted);
  const tally = { newlyAccepted: 0, newlyRejected: 0, newlyAcceptedWrong: 0, newlyRejectedRight: 0 };
  for (const [b, a] of changed) {
    if (a.accepted) { tally.newlyAccepted += 1; if (a.verdict === 'wrong') tally.newlyAcceptedWrong += 1; } else { tally.newlyRejected += 1; if (a.verdict !== 'wrong') tally.newlyRejectedRight += 1; }
    console.log(`${a.accepted ? 'NOW ACCEPTED' : 'NOW REJECTED'} [${a.verdict}] ${a.id} «${a.typed}» ${b.result}→${a.result} — ${a.why}`);
  }
  console.log('CHANGED:', JSON.stringify(tally));
}
for (const r of results.filter((x) => x.comparable && (x.verdict === 'wrong') === x.accepted)) {
  console.log(`${r.accepted ? 'ACCEPTED-WRONG' : 'REJECTED'} [${r.verdict}] ${r.id} «${r.typed}» ${r.result} — ${r.why}`);
}
