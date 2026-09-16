// The DeutschStart A1.1 release gate — the strict mode of the readiness
// suites. `npm test` lets the two owner-blocked gates (recorded audio, named
// DaF review) SKIP with loud reasons so CI stays honest but green; THIS
// command turns those skips into hard failures. Release evidence must quote
// this command, never plain `npm test`.
//
// Cross-platform on purpose (the owner runs PowerShell): the env var is set
// here, not in the npm script line.
import { spawnSync } from 'node:child_process';

const suites = [
  'tests/a11-premium-readiness.test.mjs',
  'tests/a11-release-review.test.mjs',
  'tests/course-audio.test.mjs',
  'tests/a11-commercial.test.mjs',
  'tests/guided-course-access.test.mjs',
  'tests/exams.test.mjs',
];

const result = spawnSync(process.execPath, ['--test', ...suites], {
  stdio: 'inherit',
  env: { ...process.env, A11_RELEASE_GATE: '1' },
});

process.exit(result.status ?? 1);
