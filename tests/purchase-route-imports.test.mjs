// Guard suite: no module a purchase route can reach shows the onboarding intro
// (revenue agent, 2026-10-06, rebuilt on main 2026-10-07; backlog b4, a review
// note on b1).
//
// tests/purchase-route-gates.test.mjs pins that every route a buyer arrives at
// on the way to or back from a checkout (every /subscription route: the
// postAuthPath() resume, the in-app offer links and the Lemon Squeezy success
// landing all resolve there) renders its page under the sign-in and
// verification gates only. Its detector reads each component NAMED in the
// route's element and checks that one file: it catches <OnboardingGate> put
// back on the route, but not a page, or a wrapper, that renders another local
// component which shows the intro. That is the same defect one level down: a
// new account (onboarding_completed_at null) resumed at /subscription?buy=<key>
// would see IntroSlides in place of the plans, and the checkout would not open.
//
// The rule here: from every component on every /subscription route, follow the
// relative imports (static, re-export and lazy import(); .js/.jsx/.mjs files)
// to the end. No module in that closure may render IntroSlides, redirect to
// /onboarding, or be the intro module itself. It is conservative on purpose: a
// module imported but not rendered on the route still counts, so a hit names
// the import chain and the fix is to move the intro out of that chain. Measured
// on main d7a70b04 (2026-10-07): closures of 40 (SubscriptionPage), 33
// (SubscriptionSuccessPage), 11 (ProtectedRoute) and 11 (EmailVerificationGate)
// modules, 0 hits. The last tests show the walk is not vacuous: it reaches the
// intro through /dashboard's route, and it catches a two-level wrapper that the
// one-level detector misses.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, posix } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Comments out, so a doc comment that quotes the intro cannot satisfy or trip the rule. */
const code = (src) => src
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/^\s*\/\/.*$/gm, ' ');

/** The repo on disk, as the walker sees it. Paths are repo-relative, POSIX. */
const DISK = {
  read: (p) => readFileSync(join(ROOT, p), 'utf8'),
  isFile: (p) => existsSync(join(ROOT, p)) && statSync(join(ROOT, p)).isFile(),
};

/** A relative specifier from `fromFile` to the file it loads, or null (a package, or not found). */
const resolveLocal = (io, fromFile, spec) => {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return null;
  const base = posix.normalize(posix.join(posix.dirname(fromFile), spec));
  return [base, `${base}.jsx`, `${base}.js`, `${base}.mjs`, `${base}/index.jsx`, `${base}/index.js`]
    .find((p) => /\.(jsx|js|mjs)$/.test(p) && io.isFile(p)) || null;
};

/** Every local module a file loads: import … from, export … from, bare import, import(). */
const localImports = (io, file) => {
  const src = code(io.read(file));
  const specs = [
    ...src.matchAll(/\b(?:import|export)\b[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g),
    ...src.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm),
    ...src.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map((m) => m[1]);
  return [...new Set(specs.map((s) => resolveLocal(io, file, s)).filter(Boolean))];
};

/** The module shows the onboarding intro instead of its children. */
const showsIntro = (io, file) => {
  if (/(^|\/)IntroSlides\.jsx?$/.test(file)) return true;
  const src = code(io.read(file));
  return /<IntroSlides[\s/>]/.test(src)
    || /\bto=(?:"\/onboarding"|'\/onboarding'|\{\s*['"`]\/onboarding['"`]\s*\})/.test(src)
    || /navigate\(\s*['"`]\/onboarding['"`]/.test(src);
};

/** Breadth-first over local imports from `start`; each hit with the chain that reaches it. */
const introChains = (io, start) => {
  const via = new Map([[start, null]]);
  const queue = [start];
  while (queue.length) {
    const file = queue.shift();
    for (const next of localImports(io, file)) {
      if (!via.has(next)) { via.set(next, file); queue.push(next); }
    }
  }
  const chain = (f) => { const out = []; for (let x = f; x; x = via.get(x)) out.unshift(x); return out.join(' -> '); };
  return { size: via.size, hits: [...via.keys()].filter((f) => showsIntro(io, f)).map(chain) };
};

// ── the route table ─────────────────────────────────────────────────────

const APP_FILE = 'src/App.jsx';
const APP = code(DISK.read(APP_FILE));

/** From the '{' at i, the source up to its matching '}' (exclusive). */
const braced = (src, i) => {
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}' && --depth === 0) return src.slice(i + 1, j);
  }
  throw new Error(`unbalanced braces from ${i}`);
};

/** Every <Route> in App.jsx as { path, element }; path in any JSX string spelling. */
const ROUTES = [...APP.matchAll(/<Route\b/g)].map((m) => {
  let depth = 0;
  let end = m.index;
  for (let j = m.index; j < APP.length; j++) {
    if (APP[j] === '{') depth++;
    else if (APP[j] === '}') depth--;
    else if (APP[j] === '>' && depth === 0) { end = j; break; }
  }
  const tag = APP.slice(m.index, end + 1);
  const p = tag.match(/\bpath=(?:"([^"]+)"|'([^']+)'|\{\s*(["'`])([^"'`]+)\3\s*\})/);
  const el = tag.indexOf('element={');
  return p && el >= 0 ? { path: p[1] ?? p[2] ?? p[4], element: braced(tag, el + 'element='.length) } : null;
}).filter(Boolean);

/**
 * Where App.jsx loads a component from: { spec, file }. spec is the import
 * specifier (default, named or lazy(() => import())); file is the resolved local
 * module, or null for a package (react, react-router-dom), which renders no
 * module of ours.
 */
const sourceOf = (name) => {
  const m = APP.match(new RegExp(`import\\s+${name}\\s+from\\s+['"]([^'"]+)['"]`))
    || APP.match(new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s+['"]([^'"]+)['"]`))
    || APP.match(new RegExp(`const\\s+${name}\\s*=\\s*lazy\\(\\s*\\(\\)\\s*=>\\s*import\\(\\s*['"]([^'"]+)['"]\\s*\\)`));
  if (!m) return { spec: null, file: null };
  return { spec: m[1], file: resolveLocal(DISK, APP_FILE, m[1]) };
};

const componentFiles = (route) => [...new Set([...route.element.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1]))]
  .map((name) => ({ name, ...sourceOf(name) }));

const PURCHASE_ROUTES = ROUTES.filter((r) => r.path === '/subscription' || r.path.startsWith('/subscription/'));

// ── the rule ─────────────────────────────────────────────────────────────

test('the purchase routes and their components are found', () => {
  assert.ok(ROUTES.length > 20, `parsed only ${ROUTES.length} routes out of ${APP_FILE}`);
  const paths = PURCHASE_ROUTES.map((r) => r.path);
  for (const p of ['/subscription', '/subscription/success']) assert.ok(paths.includes(p), `${p} not in the route table`);
  for (const r of PURCHASE_ROUTES) {
    const components = componentFiles(r);
    assert.ok(components.some((c) => c.file), `${r.path}: no local component found on the route`);
    for (const { name, spec, file } of components) {
      assert.ok(spec, `${r.path}: ${APP_FILE} renders <${name}> but its import was not found, so it cannot be walked`);
      if (spec.startsWith('.')) assert.ok(file, `${r.path}: <${name}> is imported from ${spec}, which does not resolve to a file`);
    }
  }
});

test('no module a purchase route reaches through local imports shows the onboarding intro', () => {
  for (const r of PURCHASE_ROUTES) {
    for (const { name, file } of componentFiles(r).filter((c) => c.file)) {
      const { size, hits } = introChains(DISK, file);
      assert.ok(size >= 1);
      assert.deepEqual(hits, [], `${r.path}: <${name}> reaches the onboarding intro through ${hits.join(' | ')}; a new buyer resumed at ${r.path}?buy=<key> would see the intro instead of the checkout`);
    }
  }
});

// ── the walk is not vacuous ──────────────────────────────────────────────

test('the walk reaches the intro where it does run: /dashboard', () => {
  const dash = ROUTES.find((r) => r.path === '/dashboard');
  assert.ok(dash, '/dashboard not in the route table');
  const hits = componentFiles(dash).filter((c) => c.file).flatMap((c) => introChains(DISK, c.file).hits);
  assert.ok(hits.length > 0, 'the walk finds no intro on /dashboard, so it would not find one on a purchase route either');
});

test('it catches a page that renders a local component which renders a component that shows the intro', () => {
  // In memory: the case one level of detection misses, plus a lazy and a re-export hop.
  const files = {
    'src/pages/Plans.jsx': "import Shell from '../components/Shell';\nexport default () => <Shell />;",
    'src/components/Shell.jsx': "import { Welcome } from './welcome';\nexport default () => <Welcome />;",
    'src/components/welcome/index.js': "export { Welcome } from './Welcome.jsx';",
    'src/components/Welcome.jsx': '',
    'src/components/welcome/Welcome.jsx': "const Intro = lazy(() => import('../onboarding/IntroSlides'));\nexport const Welcome = () => <Intro />;",
    'src/components/onboarding/IntroSlides.jsx': 'export default () => null;',
    'src/pages/Clean.jsx': "import x from 'react';\n// <IntroSlides /> quoted in a comment is not a render\nexport default () => null;",
    'src/pages/Redirects.jsx': "import Gate from '../components/Gate.jsx';\nexport default () => <Gate />;",
    'src/components/Gate.jsx': "export default () => <Navigate to={'/onboarding'} />;",
  };
  const io = { read: (p) => files[p], isFile: (p) => p in files };
  const plans = introChains(io, 'src/pages/Plans.jsx');
  assert.deepEqual(plans.hits, [
    'src/pages/Plans.jsx -> src/components/Shell.jsx -> src/components/welcome/index.js -> src/components/welcome/Welcome.jsx -> src/components/onboarding/IntroSlides.jsx',
  ]);
  assert.equal(introChains(io, 'src/pages/Redirects.jsx').hits.length, 1, 'a redirect to /onboarding two levels down');
  assert.deepEqual(introChains(io, 'src/pages/Clean.jsx').hits, [], 'packages and comments are not followed or counted');
});
