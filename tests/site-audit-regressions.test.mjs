import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const introButton = read('src/components/FloatingIntroButton.jsx');
const signup = read('src/pages/SignupPage.jsx');
const levelTest = read('src/pages/LevelTest.jsx');
const sentenceXray = read('src/pages/SentenceXRay.jsx');
const astroLayout = read('astro-site/src/layouts/Layout.astro');
const pricing = read('astro-site/src/pages/pricing.astro');

test('the floating intro prompt stays off conversion and assessment routes', () => {
  for (const route of ['/signup', '/login', '/level-test', '/analyze']) {
    assert.ok(introButton.includes(`'${route}'`), `${route} must suppress the floating intro prompt`);
  }
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

test('the full Astro navigation is reserved for wide screens', () => {
  assert.match(astroLayout, /class="hidden 2xl:flex items-center gap-1"/);
  assert.match(astroLayout, /class="2xl:hidden flex items-center gap-2"/);
  assert.match(astroLayout, /class="whitespace-nowrap px-3 py-2 rounded-lg text-sm font-semibold/);
});

test('pricing distinguishes recurring access from one-time courses in its headline and CTA', () => {
  assert.match(pricing, /Choose recurring access or a one-time course\./);
  assert.match(pricing, /Start \{TRIAL_DAYS\}-day Pro trial/);
});
