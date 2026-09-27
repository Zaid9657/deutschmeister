#!/usr/bin/env node
// Course v2 compiler v0 (SCHEMA §13) — deterministic and idempotent.
//
//   node scripts/course-v2/compile.mjs <level> [...]   compile those levels (a1.1 … b2.2)
//   node scripts/course-v2/compile.mjs --all           every level with a course.json in content/course-v2
//   options:
//     --check            write nothing; exit 1 when an output would change (CI drift guard)
//     --content <dir>    content root (default content/course-v2, fixtures excluded)
//     --out <dir>        unit chunks, manifest, ids ledger (default src/data/course-v2)
//     --banks-out <dir>  writing + speaking banks (default netlify/functions/_shared/course-v2)
//     --fixture          compile the SCHEMA §15 fixture (content root content/course-v2/fixtures);
//                        requires --out and --banks-out, so fixture output never lands in src/ or netlify/
//     --no-refs          do not resolve references while checking (format only)
//
// Every input file of the level (and every shared registry) must pass the schema check first;
// on any error nothing is written and the exit code is 1.
import path from 'node:path';
import { compileLevel, writeOutputs, levelsIn, DEFAULT_OUT, DEFAULT_BANKS } from './lib/compiler.mjs';
import { CONTENT_ROOT, FIXTURES_ROOT, rel } from './lib/tree.mjs';
import { PATTERNS } from './lib/ids.mjs';

const argv = process.argv.slice(2);
const opts = { check: false, all: false, fixture: false, refs: true, content: null, out: null, banksOut: null, levels: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--check') opts.check = true;
  else if (a === '--all') opts.all = true;
  else if (a === '--fixture') opts.fixture = true;
  else if (a === '--no-refs') opts.refs = false;
  else if (a === '--content' || a === '--out' || a === '--banks-out') {
    const v = argv[++i];
    if (!v) usage(`${a} needs a directory`);
    opts[a === '--content' ? 'content' : a === '--out' ? 'out' : 'banksOut'] = path.resolve(v);
  } else if (a.startsWith('--')) usage(`unknown option ${a}`);
  else opts.levels.push(a);
}

function usage(msg) {
  if (msg) console.error(msg);
  console.error('usage: node scripts/course-v2/compile.mjs <level|--all> [--check] [--content <dir>] [--out <dir>] [--banks-out <dir>] [--fixture] [--no-refs]');
  process.exit(2);
}

if (opts.fixture && (!opts.out || !opts.banksOut)) usage('--fixture requires --out and --banks-out');
for (const l of opts.levels) if (!PATTERNS.LEVEL.test(l)) usage(`not a level: ${l} (a1.1 … b2.2)`);
if (!opts.all && opts.levels.length === 0) usage();

const contentRoot = opts.content || (opts.fixture ? FIXTURES_ROOT : CONTENT_ROOT);
const exclude = contentRoot === CONTENT_ROOT ? [FIXTURES_ROOT] : [];
const levels = opts.all ? levelsIn(contentRoot, { exclude }) : opts.levels;

if (levels.length === 0) {
  console.log(`course-v2 compile: no level with a course.json under ${rel(contentRoot)} — nothing to do`);
  process.exit(0);
}

let failed = false;
// Shared registries are checked with every level; an error in one is printed once, not per level.
const printed = new Set();
for (const level of levels) {
  const result = compileLevel(level, { contentRoot, exclude, outRoot: opts.out || DEFAULT_OUT, banksRoot: opts.banksOut || DEFAULT_BANKS, refs: opts.refs });
  for (const w of result.warnings) console.log(`warning: ${w}`);
  if (result.errors.length) {
    const fresh = result.errors.filter((e) => !printed.has(e));
    for (const e of fresh) {
      printed.add(e);
      console.log(e);
    }
    const repeated = result.errors.length - fresh.length;
    console.log(`course-v2 compile ${level}: ${result.errors.length} error(s)${repeated ? ` (${repeated} printed above for another level)` : ''} — nothing written`);
    failed = true;
    continue;
  }
  const changed = writeOutputs(result, { check: opts.check });
  if (opts.check) {
    for (const f of changed) console.log(`${rel(f)}: out of date — run node scripts/course-v2/compile.mjs ${level}`);
    if (changed.length) failed = true;
    console.log(`course-v2 compile --check ${level}: ${result.outputs.length} output(s), ${changed.length} out of date`);
  } else {
    console.log(`course-v2 compile ${level}: ${result.outputs.length} output(s), ${changed.length} changed`);
  }
}
process.exitCode = failed ? 1 : 0; // not exit(): it drops unflushed piped stdout
