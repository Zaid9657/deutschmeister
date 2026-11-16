#!/usr/bin/env node
// Check guided drafts with the same curriculum rules (32, 34 and optional ordered-part proof 35).
// node scripts/check-guided-draft.mjs 1 2 3
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { guidedFindings } from './lib/guided-content.mjs';
import { guidedReadVocabulary, proofFindings, taughtOrderFindings, setTimeFindings, loadPoolItems } from './validate-curriculum.mjs';

/** Use the draft's optional proof, never accidentally inherit the live lesson's proof. */
export function guidedDraftFindings(nr, draft) {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return [`L${nr}: draft must be an object`];
  const curriculum = structuredClone(CURRICULUM_A11);
  const lesson = curriculum.lektionen.find((l) => l.nr === nr);
  if (!lesson) return [`L${nr}: no such Lektion`];
  lesson.flow = 'guided';
  lesson.guided = draft.guided;
  if (draft.proof !== undefined) lesson.proof = draft.proof;
  else delete lesson.proof;
  if (draft.nextHook !== undefined) lesson.nextHook = draft.nextHook;
  const findings = [...guidedFindings(curriculum), ...guidedReadVocabulary(curriculum), ...proofFindings(curriculum), ...taughtOrderFindings(curriculum, loadPoolItems()), ...setTimeFindings(curriculum, loadPoolItems())].filter((s) => s.startsWith(`L${nr}:`));
  if (nr < 12 && !draft.nextHook) findings.push(`L${nr}: nextHook is missing (German and English)`);
  return findings;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
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
    const findings = guidedDraftFindings(nr, draft);
    for (const s of findings) console.error(`✗ ${s}`);
    if (findings.length) failed = true; else console.log(`✓ L${nr}: draft passes RULE 32, RULE 34, RULE 35, RULE 36 and RULE 37`);
  }
  process.exit(failed ? 1 : 0);
}
