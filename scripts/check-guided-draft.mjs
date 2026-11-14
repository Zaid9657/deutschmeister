#!/usr/bin/env node
// Check a guided-lesson DRAFT for A1.1 before it is merged into src/data/curricula/a11.js.
//
//   node scripts/check-guided-draft.mjs 2 3 4
//
// Reads docs/course-factory/a11-guided/content/l02.json (…), puts its `guided` block and `nextHook`
// on a copy of that Lektion in memory, and runs the same rules the curriculum validator runs
// (RULE 32 guidedFindings, RULE 34 guidedReadVocabulary). Nothing is written.
//
import { readFileSync, existsSync } from 'node:fs';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { guidedFindings } from './lib/guided-content.mjs';
import { guidedReadVocabulary } from './validate-curriculum.mjs';

const numbers = process.argv.slice(2).map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);
if (!numbers.length) {
  console.error('usage: node scripts/check-guided-draft.mjs <Lektion number> [more numbers]');
  process.exit(2);
}

let failed = false;
for (const nr of numbers) {
  const file = new URL(`../docs/course-factory/a11-guided/content/l${String(nr).padStart(2, '0')}.json`, import.meta.url);
  if (!existsSync(file)) { console.error(`L${nr}: no draft at ${file.pathname}`); failed = true; continue; }
  let draft;
  try { draft = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error(`L${nr}: draft is not valid JSON (${e.message})`); failed = true; continue; }
  const curriculum = structuredClone(CURRICULUM_A11);
  const lesson = curriculum.lektionen.find((l) => l.nr === nr);
  lesson.flow = 'guided';
  lesson.guided = draft.guided;
  if (draft.nextHook !== undefined) lesson.nextHook = draft.nextHook;
  const mine = (s) => s.startsWith(`L${nr}:`);
  const all = [...guidedFindings(curriculum), ...guidedReadVocabulary(curriculum)].filter(mine);
  const blocking = all;
  if (nr < 12 && !draft.nextHook) blocking.push(`L${nr}: nextHook is missing (German and English)`);
  for (const s of blocking) console.error(`✗ ${s}`);
  if (blocking.length) failed = true; else console.log(`✓ L${nr}: draft passes RULE 32 and RULE 34`);
}
process.exit(failed ? 1 : 0);
