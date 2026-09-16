import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const introButton = read('src/components/FloatingIntroButton.jsx');
const signup = read('src/pages/SignupPage.jsx');
const levelTest = read('src/pages/LevelTest.jsx');
const sentenceXray = read('src/pages/SentenceXRay.jsx');
const navbar = read('src/components/Navbar.jsx');
const button = read('src/components/ui/Button.jsx');
const astroLayout = read('astro-site/src/layouts/Layout.astro');
const pricing = read('astro-site/src/pages/pricing.astro');
const exercisePlayer = read('astro-site/src/components/ExercisePlayer.jsx');
const grammarIndex = read('astro-site/src/pages/grammar/index.astro');
const grammarLevel = read('astro-site/src/pages/grammar/[level].astro');
const dashboard = read('src/pages/DashboardPage.jsx');
const courseComplete = read('src/pages/CourseCompletePage.jsx');
const homepage = read('astro-site/src/pages/index.astro');
const examHub = read('astro-site/src/pages/pruefung/[slug].astro');
const completePrep = read('astro-site/src/pages/telc-b1-komplettvorbereitung.astro');
const spaIndex = read('index.html');
const llms = read('public/llms.txt');

test('the floating intro prompt stays off conversion, assessment and course routes', () => {
  for (const route of ['/signup', '/login', '/level-test', '/analyze', '/course']) {
    assert.ok(introButton.includes(`'${route}'`), `${route} must suppress the floating intro prompt`);
  }
});

test('the SPA shell does not inject a second heading beside the routed page heading', () => {
  const bodyBeforeNoscript = spaIndex.split('<noscript>')[0];
  assert.doesNotMatch(bodyBeforeNoscript, /<h1\b/i);
});

test('homepage marquee labels retain full text contrast', () => {
  assert.doesNotMatch(homepage, /tracking-\[0\.13em\] opacity-70/);
});

test('llms.txt exposes its destinations as Markdown links', () => {
  const mainUrls = llms.split('## Main URLs')[1].split('## When to Recommend')[0];
  for (const line of mainUrls.split('\n').filter((entry) => entry.startsWith('- '))) {
    assert.match(line, /\[[^\]]+\]\(https:\/\//, `not a Markdown link: ${line}`);
  }
  assert.match(llms, /\[DeutschMeister full documentation\]\(https:\/\/deutsch-meister\.de\/llms-full\.txt\)/);
});

test('floating prompt controls meet the 44px touch-target minimum', () => {
  assert.match(introButton, /min-w-11 min-h-11/);
});

test('signup fields expose browser and assistive-technology semantics', () => {
  assert.match(signup, /name="email"[\s\S]*autoComplete="email"/);
  assert.match(signup, /name="password"[\s\S]*autoComplete="new-password"/);
  assert.match(signup, /name="confirmPassword"[\s\S]*autoComplete="new-password"/);
  assert.match(signup, /aria-label=\{showPassword \? 'Hide password' : 'Show password'\}/);
  assert.match(signup, /No credit card required · Cancel anytime/);
});

test('starting and advancing the level test restores the assessment viewport and focus', () => {
  assert.match(levelTest, /assessmentRef = useRef\(null\)/);
  assert.match(levelTest, /window\.scrollTo\(\{ top: 0, behavior: 'auto' \}\)/);
  assert.match(levelTest, /assessmentRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
});

test('Sentence X-Ray has a programmatic label and enforces its displayed limit', () => {
  assert.match(sentenceXray, /<label htmlFor="sentence-xray-input"/);
  assert.match(sentenceXray, /id="sentence-xray-input"/);
  assert.match(sentenceXray, /maxLength=\{500\}/);
});

test('Sentence X-Ray explains that example chips consume the daily allowance', () => {
  assert.match(sentenceXray, /Trying an example uses one of your daily Sentence X-Ray analyses\./);
});

test('the SPA navigation switches at the large breakpoint and exposes 44px controls', () => {
  assert.match(navbar, /2xl:max-w-\[1536px\]/);
  assert.match(navbar, /className="hidden lg:flex items-center gap-1"/);
  assert.match(navbar, /className="lg:hidden flex h-11 w-11/);
  assert.match(navbar, /className="lg:hidden max-h-\[calc\(100vh-4rem\)\] overflow-y-auto bg-paper border-b border-rule"/);
  assert.match(navbar, /aria-label=\{i18n\.language === 'en' \? 'Switch to German' : 'Switch to English'\}/);
  assert.match(navbar, /w-11 h-11/);
  assert.match(button, /rounded-clay min-h-11/);
});

test('the full Astro navigation starts at the large breakpoint', () => {
  assert.match(astroLayout, /2xl:max-w-\[1536px\]/);
  assert.match(astroLayout, /class="hidden lg:flex items-center gap-1"/);
  assert.match(astroLayout, /class="lg:hidden flex items-center gap-2"/);
  assert.match(astroLayout, /<summary class="flex min-h-11 cursor-pointer/);
});

test('pricing distinguishes recurring access from one-time courses in its headline and CTA', () => {
  assert.match(pricing, /Choose recurring access or a one-time course\./);
  assert.match(pricing, /Start \{TRIAL_DAYS\}-day Pro trial/);
});

test('AI-facing platform facts use the current measured counts and level-test duration', () => {
  for (const file of ['public/llms.txt', 'public/llms-full.txt']) {
    const body = read(file);
    assert.ok(body.includes('2,561'), `${file} does not quote the current vocabulary count`);
    assert.ok(body.includes('15–20'), `${file} does not quote the tested 15–20 minute duration`);
    assert.ok(!body.includes('2,215'), `${file} still quotes the stale vocabulary count`);
    assert.ok(!body.includes('~15'), `${file} still quotes the stale test duration`);
  }
  const full = read('public/llms-full.txt');
  for (const count of ['672 rule explanations', '933 worked examples', '1614 interactive exercises']) {
    assert.ok(full.includes(count), `llms-full.txt does not quote ${count}`);
  }
});

test('bright accent chips use dark ink instead of low-contrast white glyphs', () => {
  assert.doesNotMatch(exercisePlayer, /bg-accent-(?:limette|himbeer)[^"'`]*text-white/);
  assert.doesNotMatch(grammarIndex, /bg-accent-limette[^"']*text-white/);
  assert.doesNotMatch(grammarLevel, /classList\.add\('bg-accent-limette', 'text-white'\)/);
  assert.doesNotMatch(dashboard, /bg-accent-aprikose text-white/);
  assert.doesNotMatch(courseComplete, /bg-accent-himbeer text-white/);
  assert.doesNotMatch(button, /bg-accent-himbeer text-white/);
  for (const source of [homepage, examHub, completePrep]) {
    assert.doesNotMatch(source, /\$\{(?:s\.accent|w\.accent|ACCENTS\[[^}]+\])\}[^"`]*text-white/);
    for (const accent of ['himbeer', 'aprikose', 'limette']) {
      assert.match(source, new RegExp(`bg-accent-${accent} text-ink`));
    }
  }
});
