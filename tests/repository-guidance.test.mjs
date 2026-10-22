import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = (file) => readFileSync(join(ROOT, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const roles = {
  'acquisition-agent': 'distribution', 'content-agent': 'distribution', 'seo-agent': 'distribution',
  'conversion-agent': 'sales', 'revenue-agent': 'sales',
  'activation-agent': 'fulfilment', 'product-agent': 'fulfilment',
  'retention-email-agent': 'fulfilment', 'support-agent': 'fulfilment',
  'scorecard-steward': 'controller', 'security-agent': 'controller', 'supervisor': 'controller',
  'web-performance-agent': 'controller', 'website-agent': 'controller',
};

test('bootstrap is short, keeps implementation invariants and points to current v5 authority', () => {
  const source = read('CLAUDE.md');
  assert.ok(source.trimEnd().split('\n').length <= 150, 'move long explanations to the linked reference');
  assert.match(source, /TEAM\.md v5/);
  assert.match(source, /PROTOCOL v5 addendum/);
  assert.match(source, /scorecard goals\/playbook counters are retired/);
  for (const rule of [
    /Three-place route rule/, /Trailing slashes/, /reading_lessons\.level/,
    /hasLevelAccess\(level\)/, /dm_buy_intent/, /pricing\.js/, /marketing\.js/,
    /Secrets fail closed/, /export const handler/, /_shared\/auth\.mjs/,
    /data-rh="true"/, /design-tokens\.js/, /ratchets only go/, /\*\*Sie\*\*/,
    /DRAFT_CURRICULA/, /syncOutbox\.js/, /claim unique user\+kind BEFORE send/,
  ]) assert.match(source, rule);
  const reference = read('docs/agents/claude-reference.md');
  assert.match(reference, /complete[\s\S]*pre-consolidation bootstrap/);
  assert.match(reference, /v1\/v2 team and scorecard instructions are superseded by v5/);
  assert.match(reference, /MAX_RETIRED_STOP_FILES/);
  assert.match(reference, /saveAskDue/);
  assert.match(reference, /missingOpeningCue/);
  assert.doesNotMatch(reference, /TelcB1Page\.jsx` is dead code/);
});

test('every preserved agent entrypoint routes to the v5 role and frozen history stays labelled', () => {
  assert.deepEqual(readdirSync(join(ROOT, '.claude/agents')).filter((f) => f.endsWith('.md')).sort(),
    Object.keys(roles).map((name) => `${name}.md`).sort());
  for (const [name, role] of Object.entries(roles)) {
    const source = read(`.claude/agents/${name}.md`);
    const active = source.split('## Historical entrypoint context')[0];
    assert.match(active, new RegExp(`name: ${name}\\n`));
    assert.match(active, /## Current role \(v5, 2026-10-19\)/);
    assert.ok(active.includes(`agents/${role}`), `${name}: wrong role memory`);
    assert.match(active, /Scorecard goals, rubric scoring, playbook counters, Monday curation and activity quotas are retired/);
    assert.match(active, /Honor every v5 owner reservation/);
    assert.match(source, /## Historical entrypoint context \(superseded workflow\)/);
  }
});

test('README quality gates agree with zero-warning lint and full offline CI', () => {
  const source = read('README.md');
  const ci = read('.github/workflows/ci.yml');
  assert.match(pkg.scripts.lint, /--max-warnings=0/);
  assert.match(source, /errors and warnings fail \(zero warnings\)/);
  assert.doesNotMatch(source, /legacy warnings tolerated|Astro build runs\s+only on Netlify/);
  assert.match(source, /npm test/);
  assert.match(source, /offline Astro\s+build from committed `grammar-content-cache\.json`/);
  assert.match(ci, /run: npm test/);
  assert.match(ci, /GRAMMAR_CONTENT_CACHE=.*npm --prefix astro-site run build/);
  assert.match(ci, /node scripts\/check-built-html\.mjs dist\s*$/m);
});

function scriptFiles(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const rel = `${prefix}${entry.name}`;
    return entry.isDirectory() ? scriptFiles(join(directory, entry.name), `${rel}/`)
      : /\.(?:mjs|cjs|js)$/.test(entry.name) ? [rel] : [];
  });
}

test('script catalogue covers every script and module with effects, inputs and outputs', () => {
  const source = read('scripts/README.md');
  const rows = source.split('\n').filter((line) => /^\| \[[^\]]+\]\([^)]*\.(?:mjs|cjs|js)\)/.test(line));
  const documented = [];
  for (const row of rows) {
    const cells = row.split(/(?<!\\)\|/).slice(1, -1).map((cell) => cell.trim());
    const target = /\]\(([^)]+)\)/.exec(cells[0])[1];
    documented.push(target);
    assert.equal(cells.length, 4, `${target}: command/effect/inputs/outputs required`);
    assert.match(cells[1], /check|local generator|remote writer/, `${target}: classify effects`);
    assert.ok(cells[2].length > 5 && cells[3].length > 5, `${target}: document inputs and outputs`);
  }
  assert.deepEqual(documented.sort(), scriptFiles(join(ROOT, 'scripts')).sort());
  assert.match(source, /SQL generators[\s\S]*never apply migrations/);
  assert.match(source, /\.cache\/evaluation\/<tool>-<run>\//);
});

const suiteFiles = readdirSync(join(ROOT, 'tests')).filter((file) => file.endsWith('.test.mjs'));
function selectedSuites(command) {
  assert.ok(command.startsWith('node --test '), 'focused commands use the existing Node test runner');
  return command.slice('node --test '.length).split(' ').flatMap((pattern) => {
    assert.match(pattern, /^tests\/[^/]+\.test\.mjs$/, 'keep suites flat and shell globs unquoted');
    const regex = new RegExp(`^${pattern.slice(6).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*')}$`);
    const matches = suiteFiles.filter((file) => regex.test(file));
    assert.ok(matches.length, `test pattern matches no suites: ${pattern}`);
    return matches;
  });
}

test('focused course and site commands supplement the unchanged full test glob', () => {
  assert.equal(pkg.scripts.test, 'node --test tests/*.test.mjs');
  assert.ok(suiteFiles.length >= 159, 'the 159 original suites must remain discoverable');
  const course = selectedSuites(pkg.scripts['test:course'] || '');
  const site = selectedSuites(pkg.scripts['test:site'] || '');
  for (const name of ['a1-1-course', 'lesson-engine', 'checkpoint', 'assessment-integrity', 'sync-outbox']) {
    assert.ok(course.includes(`${name}.test.mjs`), `course focus omits ${name}`);
  }
  for (const name of ['astro-deps', 'claims', 'crawl-guard', 'head-tags', 'web-performance']) {
    assert.ok(site.includes(`${name}.test.mjs`), `site focus omits ${name}`);
  }
  const source = read('tests/README.md');
  assert.match(source, /mandatory full suite/);
  assert.match(source, /fixtures\/.*helpers\//);
  assert.match(source, /npm run test:course/);
  assert.match(source, /npm run test:site/);
});

function headingId(value) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, '').replaceAll(' ', '-');
}

test('current guidance links resolve after moving detailed rules and historical SQL/audits', () => {
  const documents = ['CLAUDE.md', 'README.md', 'docs/README.md', 'docs/agents/claude-reference.md',
    'scripts/README.md', 'tests/README.md', ...Object.keys(roles).map((name) => `.claude/agents/${name}.md`)];
  for (const document of documents) {
    const source = read(document).split('## Historical entrypoint context')[0];
    for (const [, href] of source.matchAll(/\[[^\]]+\]\(([^)\n]+)\)/g)) {
      if (/^(?:https?:|mailto:)/.test(href)) continue;
      const [relative, anchor] = href.split('#');
      const target = relative ? resolve(ROOT, dirname(document), relative) : join(ROOT, document);
      assert.ok(existsSync(target), `${document}: missing link ${href}`);
      if (anchor && target.endsWith('.md')) {
        const headings = [...readFileSync(target, 'utf8').matchAll(/^#{1,6} (.+)$/gm)].map((match) => headingId(match[1]));
        assert.ok(headings.includes(anchor), `${document}: missing heading ${href}`);
      }
    }
  }
});
