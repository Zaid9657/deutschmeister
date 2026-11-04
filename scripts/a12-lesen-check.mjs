#!/usr/bin/env node
// Current surface: independent one-word/number extraction frames. The historical binary strategy
// audit and its planted failures stay in tests/helpers/lesenGate.mjs and a12-rebuild.test.mjs on
// the preserved pre-pass-2 bank; an A/B strategy cannot select an answer on a typed input.
import { readFileSync } from 'node:fs';
import { CURRICULUM_A12 } from '../src/data/curricula/a12.js';
import { a12ReadingFindings } from './validate-curriculum.mjs';
const arg = process.argv.slice(2).find((a) => !a.startsWith('-'));
const curriculum = structuredClone(CURRICULUM_A12);
if (arg) {
  const draft = JSON.parse(readFileSync(arg, 'utf8'));
  const cp = curriculum.checkpoints.find((c) => c.id === draft.checkpoint);
  if (!cp) throw new Error(`Unknown checkpoint ${draft.checkpoint}`);
  cp.lesen = { papers: draft.papers };
}
const findings = a12ReadingFindings(curriculum);
for (const finding of findings) console.log(finding);
console.log(findings.length ? `${findings.length} finding(s)` : 'OK: 64 independent reading gaps; no findings');
process.exitCode = findings.length ? 1 : 0;
