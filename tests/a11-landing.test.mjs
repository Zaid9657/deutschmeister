// The DeutschStart A1.1 sales page contract — plan:
// docs/superpowers/plans/2026-09-15-a11-organic-commercial-launch.md Task 1,
// Step 1 ("write the failing page contract"), plus the offer contract at the
// head of the same file.
//
// WHAT THIS SUITE CAN AND CANNOT SEE. `astro-site/src/components/courses/
// A11CourseLanding.astro` is an Astro component; node --test cannot render it
// without the Astro toolchain, so this file asserts the two halves that can be
// checked without a build:
//
//   1. THE DATA the page renders — the curriculum, the price, the allowances,
//      the measured pool — actually says what the offer contract promises. If
//      A1.1 ever stops having twelve Lektionen or three preview lessons, the
//      page's claims become false and this fails before anyone reads it.
//   2. THE WIRING of the source: every figure comes from an import rather than
//      a keyboard, exactly one primary action exists, checkout never appears
//      above the offer, and the banned words are absent.
//
// The rendered artifact is checked elsewhere — scripts/check-built-html.mjs
// reads dist/courses/a1-1/index.html (title, canonical, single h1, substance),
// which is the repo rule that <head> and headings are verified against dist/.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { LEVEL_COURSES, SPEAKING_TOPUP, num, deNum } from '../src/data/pricing.js';
import {
  A11_PRACTICE_ACTIVITY_COUNT,
  COURSE_MISSION_ATTEMPTS,
  COURSE_SPEAKING_MINUTES,
  COURSE_WRITING_FREE_TOTAL_A11,
} from '../src/data/marketing.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { guidedMinutes } from '../astro-site/src/lib/syllabus.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const PAGE = 'astro-site/src/components/courses/A11CourseLanding.astro';
const source = read(PAGE);

/**
 * Strip comments so the assertions see what ships. Same reason as
 * tests/claims.test.mjs: this file's own header explains which words are
 * banned, and a raw grep would find the explanation.
 */
const rendered = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|import\s)/.test(line))
    .join('\n');

const body = rendered(source);
const course = LEVEL_COURSES.course_a1_1;

// ---------------------------------------------------------------------------
// 1. The data behind the claims
// ---------------------------------------------------------------------------

test('the product the page sells is the one pricing.js defines', () => {
  assert.equal(course.name, 'DeutschStart A1.1');
  assert.equal(course.code, 'A1.1');
  assert.deepEqual(course.levels, ['a1.1']);
  assert.equal(course.comingSoon, false);
  assert.equal(course.previewLessons, 3, 'the offer contract promises three complete preview lessons');
  assert.ok(course.price > 0);
});

test('the route the page describes is the curriculum that exists', () => {
  // 12 situations, 4 checkpoints, a final assessment — the proof strip and the
  // "Your 12 stops" section render these, so they have to be true of the data.
  assert.equal(CURRICULUM_A11.lektionen.length, 12);
  assert.equal(CURRICULUM_A11.checkpoints.length, 4);
  assert.ok(CURRICULUM_A11.testSlug, 'no final assessment to point at');
  assert.ok(CURRICULUM_A11.examName, 'the final assessment has no named format');
  for (const l of CURRICULUM_A11.lektionen) {
    assert.ok(l.situation, `Lektion ${l.nr} has no situation — the page prints one per stop`);
    assert.ok((l.canDo || []).length >= 2, `Lektion ${l.nr} has fewer than two can-do lines`);
  }
});

test('the 30-day route is a pace the guided lesson time can actually hold', () => {
  // The page divides the curriculum's OWN minutes by 30 days. If that ever came
  // out at an unrealistic daily dose, the promise would be the thing to change,
  // not the arithmetic.
  const perDay = Math.round(guidedMinutes(CURRICULUM_A11) / 30);
  assert.ok(perDay >= 5 && perDay <= 40, `${perDay} minutes a day is not a believable beginner pace`);
});

test('the activity count is the measured pool, not a number someone liked', () => {
  // THE point of this assertion: the claim on the sales page is the `count` of
  // the built lesson pool the engine draws from. Rebuild the pool and the claim
  // must be re-measured — re-measuring means updating A11_PRACTICE_ACTIVITY_COUNT
  // in src/data/marketing.js AND its byte-identical Astro twin.
  const pool = JSON.parse(read('src/data/lessonPools/a11.json'));
  assert.equal(pool.items.length, pool.count, 'the pool file disagrees with its own count field');
  assert.equal(
    A11_PRACTICE_ACTIVITY_COUNT,
    pool.count,
    'the advertised activity count drifted from src/data/lessonPools/a11.json — re-measure, do not retype',
  );
});

test('the speaking and writing allowances the page prints are the marketing constants', () => {
  // These are themselves pinned to the server grants by tests/claims.test.mjs,
  // so importing them here is what makes the sales page agree with the webhook.
  assert.equal(COURSE_MISSION_ATTEMPTS, CURRICULUM_A11.lektionen.length, 'one included speaking attempt per Lektion');
  assert.ok(COURSE_SPEAKING_MINUTES > 0);
  assert.ok(COURSE_WRITING_FREE_TOTAL_A11 > 0);
  assert.equal(SPEAKING_TOPUP.minutes, COURSE_SPEAKING_MINUTES, 'the FAQ offers the top-up as the same-size refill');
});

// ---------------------------------------------------------------------------
// 2. The page's wiring
// ---------------------------------------------------------------------------

test('every figure on the page comes from an import', () => {
  const required = [
    'LEVEL_COURSES', // via the `course` prop, asserted below
    'A11_PRACTICE_ACTIVITY_COUNT',
    'COURSE_MISSION_ATTEMPTS',
    'COURSE_SPEAKING_MINUTES',
    'COURSE_WRITING_FREE_TOTAL_A11',
    'COURSE_PRO_MONTHS',
    'SPEAKING_TOPUP',
    'curriculumFor',
    'guidedMinutes',
  ];
  for (const name of required) {
    assert.ok(source.includes(name), `${PAGE} does not reference ${name}`);
  }
  // The price is rendered through the formatter, never as digits.
  assert.match(body, /eur\(course\.price\)/, 'the price is not rendered from course.price');
  for (const literal of [num(course.price), deNum(course.price), String(course.price)]) {
    assert.ok(
      !new RegExp(`(?<![\\d.,])${literal.replace('.', '\\.')}(?![\\d])`).test(body),
      `${PAGE} retypes the price literal "${literal}"`,
    );
  }
});

test('the page states the offer contract in the plan\'s own words', () => {
  const mustSay = [
    'Start speaking German for real life—not just completing exercises.', // headline
    'No card required · Keep your progress', // supporting line
    'everyday situations', // the promise
    'A1.2', // what the foundation is for
    `Start ${'${previewCount}'} free lessons`, // the primary CTA, derived from previewLessons
  ];
  for (const phrase of mustSay) assert.ok(body.includes(phrase), `${PAGE} is missing: ${phrase}`);
  // The route length and the refund window are the same 30 days, named once.
  assert.match(body, /const ROUTE_DAYS = 30;/, 'the 30-day route is not defined as one constant');
  assert.match(body, /refund/i, 'the refund promise is missing');
  assert.match(body, /right of withdrawal/i, 'the refund is not framed beside the statutory right');
  assert.match(body, /voluntary/i, 'the refund is not described as voluntary');
});

test('exactly one primary action, and it is the free preview', () => {
  const primaryUses = [...body.matchAll(/class=\{BTN_PRIMARY\}/g)].length;
  const previewButtons = [...body.matchAll(/<a href=\{PREVIEW_HREF\} class=\{BTN_PRIMARY\}/g)].length;
  assert.ok(primaryUses > 0, 'the page has no primary button at all');
  assert.equal(
    previewButtons,
    primaryUses,
    'a primary button points somewhere other than the free preview — the page must have ONE visual primary action',
  );
  // One definition of the action, so its label and target cannot drift apart.
  assert.equal([...source.matchAll(/^const PRIMARY_CTA =/gm)].length, 1);
  assert.equal([...source.matchAll(/^const PREVIEW_HREF =/gm)].length, 1);
  assert.match(body, /source=a11-sales/, 'the preview link carries no campaign source for the funnel');
});

test('checkout appears only inside the offer card, never above it', () => {
  const offerAt = body.indexOf('id="offer"');
  assert.ok(offerAt > 0, 'the offer section has no id to anchor to');
  const checkouts = [...body.matchAll(/data-course-variant=/g)];
  assert.equal(checkouts.length, 1, 'there must be exactly one checkout trigger on the page');
  assert.ok(checkouts[0].index > offerAt, 'a checkout button appears before the learner has seen the offer');
  // And it is not dressed as the primary action.
  assert.match(body, /data-course-variant=\{course\.variantId\}[^>]*/, 'the checkout does not read the variant id');
  assert.ok(
    !/<button[^>]*class=\{BTN_PRIMARY\}/.test(body),
    'the checkout wears the primary treatment, which leaves the page with two primary actions',
  );
});

test('the structured data is Course + Offer, honest about availability', () => {
  assert.match(body, /'@type': 'Course'/);
  assert.match(body, /'@type': 'Offer'/);
  assert.match(body, /priceCurrency: CURRENCY/);
  assert.match(body, /price: num\(course\.price\)/);
  // InStock only behind the real variant id; otherwise the offer is a pre-order.
  assert.match(
    body,
    /availability: buyable \? 'https:\/\/schema\.org\/InStock' : 'https:\/\/schema\.org\/PreOrder'/,
    'availability is not conditional on the checkout id existing',
  );
  assert.match(body, /const buyable = Boolean\(course\.variantId\)/);
  assert.ok(!/aggregateRating/i.test(body), 'the page emits a rating it has no reviews for');
  assert.ok(!/ratingValue/i.test(body));
  assert.ok(!/['"]reviewCount['"]/i.test(body));
});

test('the A1.1 checkout id is wired on the Astro side at all', () => {
  // The component can only ever be buyable if courseVariants.js reads the env
  // var; it was missing for course_a1_1 while the SPA already read its twin.
  const variants = read('astro-site/src/lib/courseVariants.js');
  assert.match(variants, /course_a1_1: import\.meta\.env\.PUBLIC_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID/);
});

test('only A1.1 gets the sales page; every other level keeps the generic one', () => {
  const page = read('astro-site/src/pages/courses/[level].astro');
  assert.match(page, /const isA11 = level === A11_LEVEL;/);
  assert.match(page, /\{isA11 && <A11CourseLanding /);
  assert.match(page, /\{!isA11 && \(/);
});

// ---------------------------------------------------------------------------
// 3. What the page may not say
// ---------------------------------------------------------------------------

test('no fluency, guarantee or exam-pass promise', () => {
  const banned = [
    /\bfluent\b/i,
    /\bfluency\b/i,
    /\bflie(ß|ss)end\b/i,
    /\bguarantee(d|s)?\b/i,
    /\bgarantiert\b/i,
    /pass (the )?exam/i,
    /\bcertified\b/i,
  ];
  for (const re of banned) {
    assert.ok(!re.test(body), `${PAGE} contains banned claim wording matching ${re}`);
  }
});

test('no invented social proof and no manufactured urgency', () => {
  const banned = [
    // \b\d{2,} on purpose: "A1 learners" is a level, not a headcount.
    /\b\d{2,}[\d,.]*\+?\s*(happy\s+)?(learners|students|customers|reviews|testimonials)\b/i,
    /\btestimonial/i,
    /only \d+ (spots|places|seats)/i,
    /\boffer ends\b/i,
    /\blimited time\b/i,
    /\bhurry\b/i,
  ];
  for (const re of banned) {
    assert.ok(!re.test(body), `${PAGE} matches ${re} — the product has no measured learner counts and runs no countdowns`);
  }
});

test('the page tells the truth about audio and about the pending review', () => {
  // The generated manifest is still the empty stub, so no audio surface in the
  // product is a human recording. The page must say so — and it must say it
  // conditionally, so it corrects itself the day the manifest is populated.
  const manifest = read('src/data/curricula/a11.audio.js');
  const empty = /lektionen:\s*\{\s*\}/.test(manifest);
  assert.ok(empty, 'the audio manifest is populated now — re-check the wording this test guards');
  assert.match(body, /const hasRecordedAudio = /, 'the audio wording is not derived from the manifest');
  assert.match(body, /Computerstimme/, 'the page does not name the computer voice a learner will hear');
  assert.ok(
    !/professional audio|studio(-| )quality|native(-| )speaker recordings?/i.test(body),
    'the page claims recorded audio the course does not ship',
  );
  // The external DaF sign-off has not happened; the page says pending, not passed.
  assert.match(body, /pending/i, 'the page does not disclose that the independent review is pending');
});

test('the page says plainly that A1.1 is half of A1 and not an exam guarantee', () => {
  assert.match(body, /first half of A1/i);
  assert.match(body, /not the whole A1 level/i);
  assert.match(body, /no course can promise you a result/i);
  // The free public A1.1 library is named, so a reader can tell what they get
  // without paying at all — FREE_LEVEL_LABEL, not a retyped "A1.1".
  assert.match(body, /\$\{FREE_LEVEL_LABEL\}/, 'the free library is not named from the marketing constant');
});
