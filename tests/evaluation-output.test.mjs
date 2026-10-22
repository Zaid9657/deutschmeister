import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluationOutput, flag } from '../scripts/lib/evaluation-output.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const now = new Date('2026-10-22T11:22:33.456Z');
const options = { argv: [], cwd: root, now };

test('fresh audit output defaults to distinct ignored cache run directories', () => {
  assert.ok(readFileSync(join(root, '.gitignore'), 'utf8').split(/\r?\n/).includes('.cache/'));
  const paths = ['walkthrough', 'lighthouse', 'course-screens'].map((name) => evaluationOutput(name, options).directory);
  for (const [index, path] of paths.entries()) {
    assert.ok(path.startsWith(join(root, '.cache', 'evaluation') + sep));
    assert.ok(path.endsWith('-2026-10-22T11-22-33-456Z'));
    assert.notEqual(path, evaluationOutput(['walkthrough', 'lighthouse', 'course-screens'][index], { ...options, now: new Date(now.getTime() + 1) }).directory);
  }
  assert.equal(new Set(paths).size, paths.length);
});

test('all capture tools accept --out directory overrides in either argument form', () => {
  for (const name of ['walkthrough', 'lighthouse', 'course-screens']) {
    for (const argv of [['--out=chosen reports/run=1'], ['--out', 'chosen reports/run=1']]) {
      const output = evaluationOutput(name, { ...options, argv, report: name === 'course-screens' ? undefined : `${name}.json` });
      assert.equal(output.directory, join(root, 'chosen reports', 'run=1'));
      if (output.report) assert.equal(output.report, join(output.directory, `${name}.json`));
    }
  }
});

test('Lighthouse retains its explicit JSON filename override and makes its parent the output directory', () => {
  const output = evaluationOutput('lighthouse', { ...options, argv: ['--out=nested/report.json'], report: 'lighthouse.json' });
  assert.equal(output.directory, join(root, 'nested'));
  assert.equal(output.report, join(root, 'nested', 'report.json'));
  const walkthrough = evaluationOutput('walkthrough', { ...options, argv: ['--out=nested/run.json'], report: 'walkthrough.json' });
  assert.equal(walkthrough.directory, join(root, 'nested', 'run.json'));
  assert.equal(walkthrough.report, join(walkthrough.directory, 'walkthrough.json'));
});

test('capture flags preserve existing options and reject missing values', () => {
  const argv = ['--base=http://localhost:4173?x=1', '--tag', 'after', '--runs=3', '--pages=/course/a1.1,/support'];
  assert.equal(flag(argv, 'base'), 'http://localhost:4173?x=1');
  assert.equal(flag(argv, 'tag'), 'after');
  assert.equal(flag(argv, 'runs'), '3');
  assert.equal(flag(argv, 'pages'), '/course/a1.1,/support');
  assert.equal(flag(argv, 'absent', 'default'), 'default');
  for (const args of [['--out'], ['--out='], ['--out', '--tag=after']]) {
    assert.throws(() => evaluationOutput('walkthrough', { ...options, argv: args }), /--out needs a value/);
  }
});

test('all three capture entrypoints use the shared output resolver', () => {
  for (const name of ['evaluate-site.mjs', 'lighthouse-batch.mjs', 'course-screens.mjs']) {
    const source = readFileSync(join(root, 'scripts', name), 'utf8');
    assert.match(source, /import .*evaluationOutput.*from '\.\/lib\/evaluation-output\.mjs'/, name);
    assert.match(source, /evaluationOutput\(/, name);
    assert.doesNotMatch(source, /(?:join\([^\n]*'docs', 'evaluation'|flag\([^\n]*'docs\/evaluation)/, name);
  }
});
