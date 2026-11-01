import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PROGRAM, allDays } from '../src/data/programs/telcB1Komplett.js';
import { GUIDES, GUIDE_OFFERS } from '../astro-site/src/data/guides/index.js';
import { RECORDED_CORRECTION as recording } from '../astro-site/src/data/recordedCorrection.js';
import { checkAnswer, checkOptionsFor } from '../src/lib/lesson/check.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const telc = read('astro-site/src/pages/telc-b1-komplettvorbereitung.astro');

test('telc offers an honest off-sale next step, with trial limits from the shared source', () => {
  assert.match(telc, /!variantId && <p[^>]*data-telc-availability>Der Kurs ist derzeit nicht buchbar/);
  assert.match(telc, /\) : \(\s*<a href=\{signupHref\}[^>]*>\{TRIAL_DAYS\} Tage Pro kostenlos testen/);
  for (const name of ['TRIAL_WRITING_EVALUATIONS', 'TRIAL_SPEAKING_SESSIONS', 'PRO_INCLUDED_SESSION_MINUTES']) {
    assert.match(telc, new RegExp(`\\{${name}\\}`));
  }
  assert.match(telc, /Kursplan ist nicht im (?:Pro-)?Test enthalten/);
  assert.doesNotMatch(telc, /startet in Kürze|Die meisten fallen|Muttersprachler-Dialogen|mehrere hundert Euro/);
  assert.doesNotMatch(telc.split('---')[2], /\b(du|dein\w*|dir|dich)\b/i);
  const faq = telc.slice(telc.indexOf('const FAQS'), telc.indexOf('const productSchema'));
  assert.doesNotMatch(faq, /\b(du|dein\w*|dir|dich)\b/i);
});

test('the public syllabus renders the real programme and derives its counts', () => {
  assert.match(telc, /import \{ PROGRAM, allDays, SHORT_TEST_MINUTES \} from .*programs\/telcB1Komplett.js/);
  assert.match(telc, /PROGRAM.weeks.map/);
  assert.match(telc, /week.days.map/);
  assert.match(telc, /day.items.map/);
  assert.match(telc, /\{item.title\}/);
  assert.equal(PROGRAM.weeks.length, 4);
  assert.equal(allDays().length, 20);
  const items = allDays().flatMap((day) => day.items);
  assert.equal(items.filter((item) => item.type === 'writing').length, 3);
  assert.equal(items.filter((item) => item.type === 'revise').length, 3);
  assert.equal(items.filter((item) => item.type === 'speaking').length, 10);
  assert.equal(items.filter((item) => item.type === 'exam').length, 2);
  assert.equal((telc.match(/<TelcWritingExample\s*\/>/g) || []).length, 1);
  const demo = read('astro-site/src/components/TelcWritingExample.astro');
  for (const field of ['label', 'provenance', 'task.leitpunkte', 'draft', 'feedback.corrections', 'revision']) {
    assert.ok(demo.includes(`example.${field}`), `render ${field}`);
  }
});

test('only telc B1 guides offer the telc plan, after useful content and FAQ', () => {
  for (const guide of GUIDES) {
    const isTelcB1 = /^telc-b1(?:-|$)/.test(guide.slug);
    assert.equal(guide.offer === 'telc', isTelcB1, guide.slug);
    if (/^(dtz|goethe)/.test(guide.slug)) assert.notEqual(GUIDE_OFFERS[guide.offer]?.door, 'telcOffer');
  }
  assert.equal(GUIDE_OFFERS.telc.label, 'telc-B1-Übungsplan ansehen');
  const page = read('astro-site/src/pages/leitfaden/[slug].astro');
  assert.ok(page.indexOf('href={primary.href}') > page.indexOf('guide.faq.map'));
  assert.ok(page.indexOf('guide.faq.map') > page.indexOf('guide.sections.map'));
  assert.match(page, /offerSpec\?\.door === 'telcOffer'/, 'build fails on an inappropriate telc offer');
});

test('the recorded homepage correction reproduces actual feedback and a corrected answer', () => {
  const check = (text) => checkAnswer(text, recording.item.accepted, checkOptionsFor(recording.item)).result;
  assert.equal(check(recording.draft), recording.beforeResult);
  assert.equal(check(recording.revision), recording.afterResult);
  assert.equal(recording.beforeResult, 'wrong');
  assert.equal(recording.afterResult, 'correct');
  assert.ok(recording.explanation.includes('Guten Tag'));
  const component = read('astro-site/src/components/linie/RecordedCorrection.astro');
  assert.match(component, /Recorded example/);
  assert.match(component, /not a customer text or an AI writing assessment/);
  assert.match(component, /check\(example.draft\) !== example.beforeResult/);
  assert.match(component, /check\(example.revision\) !== example.afterResult/);
  assert.match(read('astro-site/src/pages/index.astro'), /<RecordedCorrection \/>/);
});

test('pricing shows both paid choices before the free card in reading and keyboard order', () => {
  const page = read('astro-site/src/pages/pricing.astro');
  const fork = page.slice(page.indexOf('<ol class="mt-10 grid'), page.indexOf('</ol>'));
  assert.ok(fork.indexOf('pricing_own') >= 0);
  assert.ok(fork.indexOf('pricing_own') < fork.indexOf('pricing_rent'));
  assert.ok(fork.indexOf('pricing_rent') < fork.indexOf('The first stop'));
  assert.doesNotMatch(fork, /\b(?:order-|flex-col-reverse)/, 'visual order agrees with DOM order');
});

test('placement start is directly under its heading, before facts and test structure', () => {
  const page = read('src/components/LevelTest/LevelTestLanding.jsx');
  assert.match(page, /title="Discover Your German Level"\s*\/>\s*<div[^>]*data-level-test-start/);
  assert.ok(page.indexOf('Start the Test') < page.indexOf('{FACTS.map'));
  assert.ok(page.indexOf('Continue your test') < page.indexOf('{FACTS.map'));
  assert.equal((page.match(/Start the Test/g) || []).length, 1);
});

test('mobile signup leads with a short promise and form, with allowances below', () => {
  const page = read('src/pages/SignupPage.jsx');
  const form = page.indexOf('<form onSubmit={handleSubmit}');
  const endForm = page.indexOf('</form>', form);
  const allowances = page.indexOf('aria-label="Trial allowances"');
  assert.ok(page.indexOf('Start your {TRIAL_DAYS}-day Pro trial') < form);
  assert.ok(form > 0 && endForm > form && allowances > endForm);
  assert.match(page, /<div className="hidden sm:block"><Logo/, 'the logo link also leaves the mobile tab order');
  assert.match(page, /<Card raised className="p-5 sm:p-8">/);
  assert.match(page, /type="password"|type=\{showPassword \? 'text' : 'password'\}/);
  assert.match(page, /minLength=\{6\}/, 'auth constraints unchanged');
  assert.match(page, /Check your inbox/, 'confirmation remains on-page');
});
