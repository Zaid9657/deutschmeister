import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('money pages expose choices before decoration and a single course catalogue', () => {
  const home = read('astro-site/src/pages/index.astro');
  assert.ok(home.indexOf('Choose your learning route') < home.indexOf('<LineBoard />'));
  const courses = read('astro-site/src/pages/courses/index.astro');
  assert.doesNotMatch(courses, /<LineSection/);
  assert.match(courses, /rungs.filter\(\(r\) => r.showSyllabus\)/);
  assert.match(courses, /rungs.filter\(\(r\) => !r.showSyllabus\)/);
  const level = read('astro-site/src/pages/courses/[level].astro');
  assert.match(level, /<summary[^>]*>View all lessons/);
  assert.ok(level.indexOf('<CourseProof level={level}') < level.indexOf('id="stamp-lehrplan"'));
});

test('a denied or unavailable analytics call cannot consume a once-event', async () => {
  const { track } = await import('../astro-site/src/lib/track.js');
  let consent = 'rejected';
  const calls = [];
  globalThis.window = {
    localStorage: { getItem: (key) => key === 'dm_cookie_consent' ? consent : null, length: 0 },
    location: { pathname: '/' }, gtag: (...args) => calls.push(args),
  };
  try {
    assert.equal(track('offer_viewed', { surface: 'design_regression' }), false);
    consent = 'accepted';
    assert.equal(track('offer_viewed', { surface: 'design_regression' }), true);
    assert.equal(track('offer_viewed', { surface: 'design_regression' }), false);
    assert.equal(calls.length, 1);
  } finally { delete globalThis.window; }
});

test('shared presentation uses flat surfaces, token timings and no animation visibility gate', async () => {
  const { shadow, motion, tailwindLinieShadow } = await import('../src/data/design-tokens.js');
  for (const [name, value] of Object.entries(shadow)) if (name.startsWith('raise')) assert.equal(value, 'none', name);
  for (const value of Object.values(tailwindLinieShadow)) assert.equal(value, 'none');
  assert.deepEqual(Object.values(motion.duration), ['140ms', '220ms', '420ms']);
  for (const name of ['Button', 'Card', 'Chip']) assert.doesNotMatch(read(`src/components/ui/${name}.jsx`), /transition-all|shadow-raise/);
  for (const config of ['tailwind.config.js', 'astro-site/tailwind.config.mjs']) {
    assert.doesNotMatch(read(config), /#[\da-f]{3,8}\b/i);
    assert.match(read(config), /borderRadius: \{ pill: radius.pill \}/);
    assert.match(read(config), /fontSize: \{ ...tailwindTypeSizes \}/);
  }
  for (const css of ['src/index.css', 'astro-site/src/styles/showtime.css']) {
    assert.match(read(css), /\.reveal \{\s*opacity: 1;\s*transform: none;/);
    assert.doesNotMatch(read(css), /content-visibility: auto/);
  }
  const floating = read('src/components/FloatingIntroButton.jsx');
  assert.match(floating, /SUPPRESSED_ROUTES = \[\s*'\/faq',\s*'\/ueber-uns'/);
});


test('product proof uses actual tasks and outputs with undecidable checks left undecided', async () => {
  const { courseProof, examTask } = await import('../astro-site/src/data/productProof.js');
  for (const level of ['a1.1', 'a1.2']) {
    const proof = courseProof(level);
    assert.equal(proof.writing.before.checks.find((c) => c.key === 'gruss').ok, false);
    assert.equal(proof.writing.after.checks.find((c) => c.key === 'gruss').ok, true);
    assert.ok(proof.speaking.alignment.words.some((w) => !w.hit));
    assert.ok(proof.speaking.alignment.words.some((w) => w.hit));
    assert.equal(proof.path[0].title, proof.lesson.title);
    assert.equal(proof.writing.task.taskKey, proof.writing.lesson.schreiben.taskKey);
  }
  assert.equal(courseProof('b2.2'), null);
  assert.equal(examTask('telc_b1').examKey, 'telc_b1');
  const component = read('astro-site/src/components/proof/CourseProof.astro');
  assert.match(component, /c.ai \? t.ai/);
  assert.match(component, /not AI writing feedback/);
  assert.match(component, /simulated transcript/);
});

test('grammar search handles real terms, level selection and a useful empty result', async () => {
  const { matchesGrammarTopic } = await import('../astro-site/src/lib/grammarSearch.js');
  assert.ok(matchesGrammarTopic('Definite Articles · bestimmte Artikel', 'a1.1', 'ARTICLES', 'a1.1'));
  assert.ok(matchesGrammarTopic('Präteritum: past tense', 'b1.1', 'prateritum'));
  assert.equal(matchesGrammarTopic('Definite Articles', 'a1.1', 'articles', 'b1.1'), false);
  assert.equal(matchesGrammarTopic('Definite Articles', 'a1.1', 'zzzz'), false);
  assert.equal(matchesGrammarTopic('Definite Articles', 'a1.1', '[.*'), false);
  assert.match(read('astro-site/src/lib/grammar.js'), /'a1.2': \{ label: 'A1.2', name: 'Everyday exchanges'/);
  const page = read('astro-site/src/pages/grammar/index.astro');
  assert.match(page, /No matching topics/);
  assert.doesNotMatch(page, /Level picker: the grid/);
});

test('trust pages use sanctioned founder wording and retain accessible category navigation', () => {
  const about = read('src/pages/UeberUnsPage.jsx');
  const faq = read('src/data/faqContent.js');
  const prerender = read('scripts/prerender-spa-routes.mjs');
  for (const source of [about, faq, prerender]) assert.doesNotMatch(source, /team of doctors|I am Zaid|Developed by doctors/);
  assert.match(about, /\{FOUNDER_LINE_EN\}/);
  assert.match(faq, /a: FOUNDER_LINE_EN/);
  assert.match(prerender, /\$\{FOUNDER_LINE_EN\}/);
  assert.match(read('src/pages/FAQPage.jsx'), /Card as="details"/);
  assert.match(read('src/pages/FAQPage.jsx'), /aria-label="Question categories"/);
  const guide = read('astro-site/src/pages/leitfaden/[slug].astro');
  assert.match(guide, /lg:sticky lg:top-24/);
  assert.match(guide, /<details[^>]*lg:hidden/);
});

test('placement preview is a labelled real-bank example and entry controls stay ahead of details', async () => {
  const { PLACEMENT_PREVIEW } = await import('../src/data/placementPreview.js');
  const bank = JSON.parse(read('src/data/levelTestQuestions.json'));
  const source = bank.questions.find((q) => q.question === PLACEMENT_PREVIEW.question);
  assert.ok(source);
  assert.equal(PLACEMENT_PREVIEW.answer, source.options[source.correctIndex]);
  const landing = read('src/components/LevelTest/LevelTestLanding.jsx');
  assert.ok(landing.indexOf('data-level-test-start') < landing.indexOf('<PlacementPreview />'));
  assert.doesNotMatch(landing, /Precise placement/);
  const results = read('src/components/LevelTest/LevelTestResults.jsx');
  assert.ok(results.indexOf('Choose your next step') < results.indexOf('>Test Summary<'));
  for (const page of ['SignupPage', 'LoginPage']) {
    const account = read(`src/pages/${page}.jsx`);
    assert.match(account, /initial=\{false\}/);
    assert.match(account, /<AccountPreview \/>/);
  }
  const staticPage = read('scripts/prerender-spa-routes.mjs').split("path: '/level-test'")[1].split("path: '/analyze'")[0];
  assert.ok(staticPage.indexOf('Start the Test') < staticPage.indexOf('Sample question'));
  assert.doesNotMatch(read('src/components/ui/Button.jsx'), /bg-accent-himbeer/);
});

test('pricing never treats a missing billing record as the signed-out visitor\'s', () => {
  // undefined === undefined made `billing?.userId === currentUser()?.id` true when signed out
  // and billing was null, throwing on billing.subscription before the Pro CTA rendered.
  const pricing = read('astro-site/src/pages/pricing.astro');
  assert.doesNotMatch(pricing, /billing\?\.userId === currentUser\(\)\?\.id/);
  assert.match(pricing, /billing && currentUser\(\) && billing\.userId === currentUser\(\)\.id/);
});
