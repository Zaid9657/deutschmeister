// The static pages' course return bar renders both context shapes the SPA bar
// does (astro-site/src/layouts/Layout.astro ⟷ src/components/CourseReturnBar.jsx).
//
// The defect this closes (cross-check 2026-10-25, SHL-19, X-055): the rebuilt
// lesson engine's speaking hand-off (src/components/lesson/SpeakingStage.jsx)
// stores { itemId: <Lektion id>, returnTo: '/course/a1.1/l/1' } and no position.
// The SPA bar learned that shape; the Astro copy did not. After an A1.1 learner
// opened the speaking coach and then a grammar page, every static page showed
// "undefined/undefined", and "Done → next" opened /course/a1.1/a1.1-l01?done=1 —
// a legacy lesson URL that redirects to the course overview, away from the
// unfinished Lektion. The inline script runs here for real, against a fake DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const barScript = () => {
  const layout = read('astro-site/src/layouts/Layout.astro');
  const scripts = [...layout.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const script = scripts.find((s) => s.includes("sessionStorage.getItem('dm_course_ctx')"));
  assert.ok(script, 'Layout.astro renders the course return bar');
  return script;
};

/** The bar's markup for a stored context, or null when no bar renders. */
function renderBar(ctx) {
  const appended = [];
  const body = { style: {}, appendChild: (el) => appended.push(el) };
  vm.runInNewContext(barScript(), {
    sessionStorage: { getItem: (key) => (key === 'dm_course_ctx' && ctx !== undefined ? JSON.stringify(ctx) : null) },
    document: { body, createElement: () => ({ style: {}, setAttribute() {}, innerHTML: '' }) },
    encodeURIComponent,
    JSON,
  });
  assert.ok(appended.length <= 1);
  return appended[0]?.innerHTML ?? null;
}

const hrefs = (html) => [...html.matchAll(/<a href="([^"]*)"/g)].map((m) => m[1]);

test('a rebuilt Lektion hand-off leads back to the Lektion, with no counters', () => {
  const html = renderBar({
    level: 'a1.1', code: 'A1.1', itemId: 'a1.1-l01', title: 'Hallo!', returnTo: '/course/a1.1/l/1',
    openPrompt: 'Stellen Sie sich vor.', hintWords: [], anrede: 'Sie',
  });
  assert.doesNotMatch(html, /undefined/);
  assert.deepEqual(hrefs(html), ['/course/a1.1', '/course/a1.1/l/1']);
  assert.match(html, /Zurück zur Lektion/);
  assert.doesNotMatch(html, /\?done=1/, 'the stage records its own completion');
  assert.match(html, />Hallo!</);
});

test('the legacy per-item course keeps its counters and its Done → next hop', () => {
  const html = renderBar({ level: 'a1.2', code: 'A1.2', itemId: 'sd1 d3', title: 'Tag 3', position: 3, total: 30 });
  assert.match(html, /3\/30 &middot; Tag 3/);
  assert.deepEqual(hrefs(html), ['/course/a1.2', '/course/a1.2/sd1%20d3?done=1']);
  assert.match(html, /Done &#8594; next/);
});

test('a context that names its home and its label is honoured', () => {
  const html = renderBar({ level: 'b1.2', code: 'telc B1', itemId: 'w2-d3', title: 'Sprechen Teil 2', homeHref: '/telc-b1-kurs', returnTo: '/telc-b1-kurs', returnLabel: 'Zurück zum Plan' });
  assert.deepEqual(hrefs(html), ['/telc-b1-kurs', '/telc-b1-kurs']);
  assert.match(html, /Zurück zum Plan &#8594;/);
});

test('no bar without an itemId, and none without a context', () => {
  assert.equal(renderBar({ level: 'b1.2', code: 'telc B1', homeHref: '/telc-b1-kurs', returnTo: '/telc-b1-kurs' }), null);
  assert.equal(renderBar(undefined), null);
  assert.equal(renderBar({ itemId: 'x' }), null);
});

test('only same-site paths become links, and every field is escaped', () => {
  const html = renderBar({ level: 'a1.1', itemId: 'a1.1-l01', title: '<img src=x onerror=alert(1)>', homeHref: '//evil.example', returnTo: 'javascript:alert(1)' });
  assert.deepEqual(hrefs(html), ['/course/a1.1', '/course/a1.1/a1.1-l01?done=1'], 'a foreign path falls back to the course routes');
  assert.doesNotMatch(html, /<img/);
});

test('both bars follow the same rules', () => {
  const spa = read('src/components/CourseReturnBar.jsx');
  assert.match(spa, /const home = ctx\.homeHref \|\| courseHome\(ctx\.level\);/);
  assert.match(spa, /\{ctx\.position \? </);
  assert.match(spa, /\{ctx\.returnTo \? \(/);
  assert.match(spa, /\{ctx\.returnLabel \|\| 'Zurück zur Lektion'\}/);
  assert.match(spa, /\$\{courseLesson\(ctx\.level, ctx\.itemId\)\}\?done=1/);
  const astro = barScript();
  assert.match(astro, /var home = sitePath\(ctx\.homeHref\) \|\| '\/course\/' \+ ctx\.level;/);
  assert.match(astro, /\(ctx\.position \? /);
  assert.match(astro, /var action = returnTo\s*\n?\s*\?/);
  assert.match(astro, /esc\(ctx\.returnLabel \|\| 'Zurück zur Lektion'\)/);
});
