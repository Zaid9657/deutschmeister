#!/usr/bin/env node
// Course v2 schema checker (SCH-01, REF-01 resolution, KEY-01 on bank keys) — SCHEMA §1 notation.
//
//   node scripts/course-v2/check.mjs <file|dir> [...]   check those files / every *.json below a dir
//   node scripts/course-v2/check.mjs --all              check content/course-v2/** (fixtures included,
//                                                       each tree against its own reference index)
//   options: --no-refs     format-check references but do not resolve them
//            --stage=S     check every unit at that stage (spec|S|I|T) instead of its declared `stage`
//            --quiet       print errors only, no summary line
//
// Prints one line per error — `file:path: RULE message (near <id>)` — and exits 1 on any error.
// A file under content/course-v2/fixtures/ resolves its references inside the fixtures tree; any
// other file under content/course-v2/ against content/course-v2/** without the fixtures.
import fs from 'node:fs';
import path from 'node:path';
import { checkFiles, formatResults } from './lib/checker.mjs';
import { listJsonFiles, CONTENT_ROOT } from './lib/tree.mjs';

const STAGES = ['spec', 'S', 'I', 'T'];
const argv = process.argv.slice(2);
// `--stage S` and `--stage=S` are both accepted
const args = [];
let stage;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--stage') stage = argv[++i];
  else if (a.startsWith('--stage=')) stage = a.slice('--stage='.length);
  else args.push(a);
}
const flags = new Set(args.filter((a) => a.startsWith('--')));
const targets = args.filter((a) => !a.startsWith('--'));
const known = new Set(['--all', '--no-refs', '--quiet']);
const unknown = [...flags].filter((f) => !known.has(f));
const badStage = stage !== undefined && !STAGES.includes(stage);

if (unknown.length || badStage || (!flags.has('--all') && targets.length === 0)) {
  if (unknown.length) console.error(`unknown option(s): ${unknown.join(', ')}`);
  if (badStage) console.error(`--stage must be one of ${STAGES.join('|')}, got ${JSON.stringify(stage)}`);
  console.error('usage: node scripts/course-v2/check.mjs <file|dir|--all> [--no-refs] [--stage spec|S|I|T] [--quiet]');
  process.exit(2);
}

const files = [];
if (flags.has('--all')) files.push(...listJsonFiles(CONTENT_ROOT));
for (const t of targets) {
  if (!fs.existsSync(t)) {
    console.error(`${t}: no such file or directory`);
    process.exit(2);
  }
  files.push(...listJsonFiles(t));
}
const unique = [...new Set(files.map((f) => path.resolve(f)))].sort();

if (unique.length === 0) {
  if (!flags.has('--quiet')) console.log('course-v2 check: no JSON files found');
  process.exit(0);
}

const result = checkFiles(unique, { refs: !flags.has('--no-refs'), stage });
for (const line of formatResults(result)) console.log(line);
if (!flags.has('--quiet')) {
  const bad = result.files.filter((r) => r.errors.length).length;
  console.log(`course-v2 check: ${unique.length} file(s), ${result.errorCount} error(s) in ${bad} file(s)`);
}
process.exitCode = result.errorCount ? 1 : 0; // not exit(): it drops unflushed piped stdout
