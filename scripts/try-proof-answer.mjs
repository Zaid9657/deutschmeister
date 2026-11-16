#!/usr/bin/env node
// Judge learner answers against a proof task of a guided-lesson DRAFT, exactly as the app would.
//
//   node scripts/try-proof-answer.mjs 2 0 "Ich komme aus Marokko. Ich bin Studentin." "Ich bin aus Marokko"
//
// Arguments: Lektion number, zero-based goal (can-do) index, then any number of answers.
// Reads docs/course-factory/a11-guided/content/lNN.json, puts its `proof` (and `guided`) on a copy of
// the Lektion in memory, and prints the common checker's verdict and the hint a learner would get.
// A proof writer uses it to make sure every correct answer a real learner might give passes and
// every wrong one fails. Nothing is written.
import { readFileSync, existsSync } from 'node:fs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { proofTasks, judgeProof, proofHint, proofTaskFor } from '../src/lib/lesson/proof.js';

const [nrArg, goalArg, ...answers] = process.argv.slice(2);
const nr = Number(nrArg), goal = Number(goalArg);
if (!Number.isInteger(nr) || nr < 1 || nr > 12 || !Number.isInteger(goal) || goal < 0 || !answers.length) {
  console.error('usage: node scripts/try-proof-answer.mjs <Lektion 1-12> <goal index from 0> "<answer>" ["<answer>" …]');
  process.exit(2);
}
const file = new URL(`../docs/course-factory/a11-guided/content/l${String(nr).padStart(2, '0')}.json`, import.meta.url);
if (!existsSync(file)) { console.error(`no draft at ${file.pathname}`); process.exit(2); }
const draft = JSON.parse(readFileSync(file, 'utf8'));
if (!draft.proof) { console.error(`L${nr}: the draft has no proof block`); process.exit(2); }
const lesson = structuredClone(CURRICULUM_A11.lektionen.find((l) => l.nr === nr));
if (draft.guided) lesson.guided = draft.guided;
lesson.proof = draft.proof;
const baseTask = proofTasks(lesson)[goal];
const task = baseTask ? proofTaskFor(baseTask) : null;
if (!task) { console.error(`L${nr}: no proof task for goal ${goal}`); process.exit(2); }
console.log(`L${nr} goal ${goal}: ${lesson.canDo[goal]}`);
console.log(`  task: ${task.promptDe}`);
// A stand-in name, so own-name tasks can be tried; the app uses the learner's own.
const names = { full: 'Sam Miller', first: 'Sam', surname: 'Miller' };
for (const answer of answers) {
  const verdict = judgeProof(task, answer, names);
  const hint = verdict.result === 'wrong' ? `  hint: ${proofHint(task, verdict.part, verdict.registerMiss).en}` : '';
  console.log(`  ${verdict.result.toUpperCase().padEnd(7)} ${JSON.stringify(answer)}${hint}`);
}
