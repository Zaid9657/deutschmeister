// The mock exams and Abschlusstests stay out of the SPA entry chunk
// (src/data/modelltestGate.js, src/components/ExamSubscriptionGuard.jsx).
//
// The finding this closes (cross-check 2026-10-25, SHL-15, C-081): App.jsx
// imports ExamSubscriptionGuard eagerly, and the guard imported
// resolveModelltest, whose module imports every mock exam and course test body.
// The built entry carried 'telc B1 Übungstest (Kurzversion)' and
// 'Abschlusstest A2.2 (Kurzversion)': ~68 KB minified, ~19 KB gzipped of a
// ~100 KB gzipped entry, downloaded on every first visit. The guard only needs
// the gate level, now a tiny lookup pinned here to the full resolver.
//
// The rule, not a file list: no chain of STATIC imports from src/main.jsx may
// reach a mock registry. Dynamic import() (React.lazy pages) is where they live.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveModelltest } from '../src/data/modelltest.js';
import { resolveModelltestGate } from '../src/data/modelltestGate.js';
import { EXAM_TRACKS } from '../src/data/examTracks.js';
import { COURSE_TESTS } from '../src/data/courseTests/index.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(ROOT, path), 'utf8');

test('the light gate agrees with resolveModelltest for every slug, known or not', () => {
  const slugs = [
    ...EXAM_TRACKS.map((t) => t.slug),
    ...COURSE_TESTS.map((t) => t.slug),
    'no-such-slug', 'abschlusstest-b1-1', '', undefined, null, '__proto__', 'constructor', 'toString',
  ];
  assert.ok(slugs.length >= 12, 'premise: the registries list their slugs');
  for (const slug of slugs) {
    const full = resolveModelltest(slug);
    const light = resolveModelltestGate(slug);
    assert.equal(light === null, full === null, `${slug}: resolves in one registry but not the other`);
    assert.equal(light?.gateLevel ?? null, full?.gateLevel ?? null, `${slug}: gate level drifted`);
  }
});

test('every course test has a gate, and a track without a mock has none', () => {
  for (const t of COURSE_TESTS) assert.equal(resolveModelltestGate(t.slug)?.gateLevel, t.level, t.slug);
  for (const t of EXAM_TRACKS) {
    const gate = resolveModelltestGate(t.slug);
    if (t.hasMock) assert.equal(gate.gateLevel, t.sublevels[t.sublevels.length - 1], `${t.slug}: the band's TOP sublevel`);
    else assert.equal(gate, null, t.slug);
  }
});

test('the guard and the gate import no mock content', () => {
  const guard = read('src/components/ExamSubscriptionGuard.jsx');
  assert.match(guard, /import \{ resolveModelltestGate \} from '\.\.\/data\/modelltestGate';/);
  assert.doesNotMatch(guard, /from '\.\.\/data\/modelltest'/);
  const gate = read('src/data/modelltestGate.js');
  const imports = [...gate.matchAll(/^import[\s\S]*?from '([^']+)';/gm)].map((m) => m[1]);
  assert.deepEqual(imports, ['./examTracks.js']);
});

// ── the rule ────────────────────────────────────────────────────────────────

const strip = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const STATIC_IMPORT = /^\s*(?:import|export)\s+(?:[^'"();]*?\s+from\s+)?['"]([^'"]+)['"]/gm;

const resolveFile = (base) => {
  for (const candidate of [base, `${base}.js`, `${base}.jsx`, `${base}.mjs`, join(base, 'index.js'), join(base, 'index.jsx')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
};

/** Every source file reachable from `entry` through static imports, with the parent that reached it. */
function eagerGraph(entry) {
  const parents = new Map();
  const queue = [[join(ROOT, entry), null]];
  while (queue.length) {
    const [file, parent] = queue.shift();
    if (parents.has(file)) continue;
    parents.set(file, parent);
    if (!/\.(m?jsx?)$/.test(file)) continue;
    for (const [, spec] of strip(readFileSync(file, 'utf8')).matchAll(STATIC_IMPORT)) {
      if (!spec.startsWith('.')) continue;
      const target = resolveFile(resolve(dirname(file), spec));
      if (target) queue.push([target, file]);
    }
  }
  return parents;
}

test('no static import chain from the SPA entry reaches a mock exam or course test', () => {
  const graph = eagerGraph('src/main.jsx');
  assert.ok(graph.size > 40, `the walk reached only ${graph.size} modules`);
  assert.ok(graph.has(join(ROOT, 'src/components/ExamSubscriptionGuard.jsx')), 'premise: the guard is eager');
  const leaks = [...graph.keys()]
    .map((file) => relative(ROOT, file))
    .filter((file) => file === 'src/data/modelltest.js' || /^src\/data\/(mockExams|courseTests)\//.test(file));
  const chain = (file) => {
    const out = [];
    for (let f = join(ROOT, file); f; f = graph.get(f)) out.unshift(relative(ROOT, f));
    return out.join(' → ');
  };
  assert.deepEqual(leaks, [], `mock content in the entry chunk:\n  ${leaks.map(chain).join('\n  ')}`);
});
