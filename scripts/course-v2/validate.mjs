#!/usr/bin/env node
// Course v2 deterministic validator (BLUEPRINT §9.1, §9.3; SCHEMA §12 "Validator").
//
//   node scripts/course-v2/validate.mjs <level|unit-file|--all> [--json] [--unit N] [--verbose]
//                                                               [--rule ID[,ID]] [--today YYYY-MM-DD]
//
//   <level>      a2.1 (or a2-1): every document of that level + the level-scope rules (coverage)
//   <unit-file>  one unit (with its lane packs) or any other content file; a file under
//                content/course-v2/fixtures/ is validated inside the fixtures tree
//   --all        every level present under content/course-v2 (fixtures excluded)
//
// Exit 1 when any rule reports a BLOCKER finding (a hard rule failed); ratchet and advisory
// findings are printed and never fail the run. Rules whose inputs do not exist yet print
// `skipped: <reason>` — content arrives piece by piece and a partial level is a normal state.
// The schema itself (SCH-01) is scripts/course-v2/check.mjs; run both.
import { validate, formatReport } from './lib-validate/runner.mjs';

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : null;
};
const VALUE_FLAGS = new Set(['--unit', '--rule', '--today']);
const positional = argv.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.has(argv[i - 1]));
const target = flag('--all') ? '--all' : positional[0];

if (!target || flag('--help')) {
  console.error('usage: node scripts/course-v2/validate.mjs <level|unit-file|--all> [--json] [--unit N] [--verbose] [--rule ID[,ID]] [--today YYYY-MM-DD]');
  process.exit(target ? 0 : 2);
}

const today = value('--today');
if (today && !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
  console.error('--today must be YYYY-MM-DD');
  process.exit(2);
}

const report = await validate(target, {
  unit: value('--unit'),
  only: value('--rule') ? value('--rule').split(',').map((s) => s.trim().toUpperCase()) : null,
  today,
});

if (flag('--json')) console.log(JSON.stringify(report, null, 2));
else console.log(formatReport(report, { verbose: flag('--verbose') }));
process.exit(report.exitCode);
