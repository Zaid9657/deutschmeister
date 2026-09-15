# DeutschStart A1.1 Course Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing A1.1 guided course into a truthful €39 lifetime product with three complete preview lessons and premium-release evidence.

**Architecture:** Keep public A1.1 grammar, vocabulary, reading and listening resources free. Introduce a separate guided-course entitlement keyed by `course_a1_1`; the course home remains visible, lessons 1–3 remain the signed-in preview, and later lessons/checkpoints/completion require the product or an active subscription. Existing curriculum and audio generators remain authoritative.

**Tech Stack:** React Router, React context, Astro, shared pricing modules, Lemon Squeezy, Supabase, Node test runner, Azure course-audio generator.

**Spec:** `docs/superpowers/specs/2026-09-15-deutschmeister-speaking-a11-commercial-rebuild-design.md`

## Global Constraints

- Keep `src/config/freeTier.js` unchanged: A1.1 public library content stays free.
- Register `course_a1_1` at €39 in both byte-synchronized pricing files.
- Preview lessons are exactly A1.1 lessons 1, 2 and 3.
- Do not advertise 54 hours as finished guided content; retain the existing 5.8-hour honesty distinction.
- Do not mark the course sellable until the audio, linked-practice and named-review gates pass.

---

### Task 1: Register the A1.1 product without closing the free library

**Files:**
- Create: `tests/a11-commercial.test.mjs`
- Modify: `src/data/pricing.js`
- Modify: `astro-site/src/data/pricing.js`
- Modify: `src/config/lemonsqueezy.js`
- Modify: `netlify/functions/_shared/pricing.mjs`
- Modify: `netlify/functions/lemonsqueezy-webhook.mjs`
- Modify: `tests/claims.test.mjs`
- Modify: `tests/purchases.test.mjs`

**Interfaces:**
- Produces: `LEVEL_COURSES.course_a1_1` with `{ key, code, name, nameDe, price, levels, previewLessons }`.
- Produces: environment names `VITE_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID`, `PUBLIC_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID`, and `LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID`.
- Preserves: `isLevelFree('a1.1') === true` for non-course resources.

- [ ] **Step 1: Write the failing commercial-contract test**

```js
// tests/a11-commercial.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LEVEL_COURSES } from '../src/data/pricing.js';
import { FREE_LEVELS } from '../src/config/freeTier.js';

test('A1.1 is a €39 guided-course product while its public library stays free', () => {
  assert.deepEqual(LEVEL_COURSES.course_a1_1, {
    key: 'course_a1_1',
    code: 'A1.1',
    name: 'DeutschStart A1.1',
    nameDe: 'DeutschStart A1.1',
    price: 39,
    proDays: 90,
    proMonths: 3,
    levels: ['a1.1'],
    previewLessons: 3,
    comingSoon: false,
  });
  assert.ok(FREE_LEVELS.includes('a1.1'));
});

test('client and webhook expose the A1.1 Lemon Squeezy variant names', () => {
  const client = readFileSync(new URL('../src/config/lemonsqueezy.js', import.meta.url), 'utf8');
  const webhook = readFileSync(new URL('../netlify/functions/lemonsqueezy-webhook.mjs', import.meta.url), 'utf8');
  assert.match(client, /VITE_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID/);
  assert.match(webhook, /LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID/);
});
```

- [ ] **Step 2: Run the focused test and confirm the missing product fails**

Run:

```powershell
node --test tests/a11-commercial.test.mjs
```

Expected: FAIL because `LEVEL_COURSES.course_a1_1` is undefined.

- [ ] **Step 3: Add the product to the shared pricing source**

In both `src/data/pricing.js` and `astro-site/src/data/pricing.js`, include A1.1 and make its public name explicit:

```js
export const SUBLEVEL_PRICES_EUR = {
  'a1.1': 39,
  'a1.2': 40,
  'a2.1': 50,
  'a2.2': 50,
  'b1.1': 60,
  'b1.2': 60,
  'b2.1': 65,
  'b2.2': 65,
};

const sublevel = (level) => {
  const code = level.toUpperCase();
  const a11 = level === 'a1.1';
  return {
    key: productKeyForLevel(level),
    code,
    name: a11 ? 'DeutschStart A1.1' : `German ${code} Course`,
    nameDe: a11 ? 'DeutschStart A1.1' : `Deutsch ${code} Kurs`,
    price: SUBLEVEL_PRICES_EUR[level],
    proDays: COURSE_PRO_DAYS,
    proMonths: COURSE_PRO_MONTHS,
    levels: [level],
    previewLessons: a11 ? 3 : 0,
    comingSoon: COMING_SOON_LEVELS.includes(level),
  };
};
```

Mirror the exported constants required by `netlify/functions/_shared/pricing.mjs` and update the existing duplicate guard rather than adding retyped prices to page components.

- [ ] **Step 4: Wire client checkout and webhook routing**

Add the course variant to `src/config/lemonsqueezy.js` using the same shape as other level courses:

```js
course_a1_1: {
  variantId: import.meta.env.VITE_LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID || '',
  productKey: 'course_a1_1',
},
```

Add the server route to `COURSE_VARIANT_ENV` in `lemonsqueezy-webhook.mjs`:

```js
course_a1_1: process.env.LEMONSQUEEZY_COURSE_A1_1_VARIANT_ID,
```

Do not commit generated Lemon Squeezy IDs. Set the three named environment variables only after the real product and variant exist.

- [ ] **Step 5: Update old “A1.1 has no product” assertions and run pricing tests**

Replace the old assertion in `tests/claims.test.mjs` with:

```js
assert.equal(bandCourseForLevel('a1.1')?.key, 'course_a1_1');
assert.ok(FREE_LEVELS.includes('a1.1'), 'public A1.1 resources remain free');
```

Run:

```powershell
node --test tests/a11-commercial.test.mjs tests/claims.test.mjs tests/purchases.test.mjs
npm run check:duplicates
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add tests/a11-commercial.test.mjs tests/claims.test.mjs tests/purchases.test.mjs src/data/pricing.js astro-site/src/data/pricing.js src/config/lemonsqueezy.js netlify/functions/_shared/pricing.mjs netlify/functions/lemonsqueezy-webhook.mjs
git commit -m "feat: register DeutschStart A1.1 product"
```

### Task 2: Gate the guided course after the third preview lesson

**Files:**
- Create: `src/lib/guidedCourseAccess.js`
- Create: `src/components/GuidedCourseGuard.jsx`
- Create: `tests/guided-course-access.test.mjs`
- Modify: `src/App.jsx`
- Modify: `src/pages/CourseHomePage.jsx`
- Modify: `tests/purchases.test.mjs`

**Interfaces:**
- Produces: `canOpenGuidedCourseItem({ level, kind, nr, ownsCourse, hasSubscription }) -> boolean`.
- Produces: `<GuidedCourseGuard kind="home|lesson|checkpoint|review|complete|certificate">`.
- Consumes: `hasProduct('course_a1_1')` and `hasActiveSubscription()` from `SubscriptionContext`.

- [ ] **Step 1: Write the pure access-policy test**

```js
// tests/guided-course-access.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canOpenGuidedCourseItem } from '../src/lib/guidedCourseAccess.js';

const access = (kind, nr, extra = {}) => canOpenGuidedCourseItem({
  level: 'a1.1', kind, nr, ownsCourse: false, hasSubscription: false, ...extra,
});

test('A1.1 course home and lessons 1-3 form the preview', () => {
  assert.equal(access('home'), true);
  assert.equal(access('lesson', 1), true);
  assert.equal(access('lesson', 3), true);
  assert.equal(access('lesson', 4), false);
  assert.equal(access('checkpoint', 1), false);
  assert.equal(access('certificate'), false);
});

test('purchase or active subscription opens the complete guided course', () => {
  assert.equal(access('lesson', 12, { ownsCourse: true }), true);
  assert.equal(access('complete', null, { hasSubscription: true }), true);
});
```

- [ ] **Step 2: Run the test and confirm the module is missing**

```powershell
node --test tests/guided-course-access.test.mjs
```

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement the pure policy**

```js
// src/lib/guidedCourseAccess.js
export const A11_PRODUCT_KEY = 'course_a1_1';
export const A11_PREVIEW_LESSONS = 3;

export function canOpenGuidedCourseItem({ level, kind, nr, ownsCourse, hasSubscription }) {
  const normalized = String(level || '').toLowerCase();
  if (normalized !== 'a1.1') return true;
  if (ownsCourse || hasSubscription) return true;
  if (kind === 'home') return true;
  return kind === 'lesson' && Number.isInteger(Number(nr)) && Number(nr) >= 1 && Number(nr) <= A11_PREVIEW_LESSONS;
}
```

- [ ] **Step 4: Implement the route guard and locked course-map state**

`GuidedCourseGuard.jsx` reads the route level/lesson number, waits for auth/subscription state, applies `canOpenGuidedCourseItem`, and renders a course-specific paywall instead of redirecting to the generic subscription page. The paywall must link to `/courses/a1.1/` and say “Unlock DeutschStart A1.1 for €39 once.”

Use this exact decision input:

```js
const allowed = canOpenGuidedCourseItem({
  level,
  kind,
  nr,
  ownsCourse: hasProduct(A11_PRODUCT_KEY),
  hasSubscription: hasActiveSubscription(),
});
```

Wrap the seven `/course/:level` route variants in `src/App.jsx` with the correct `kind`. Keep `EmailVerificationGate` for saved preview progress. In `CourseHomePage.jsx`, mark A1.1 lessons 4–12, all checkpoints, review, completion and certificate as locked for non-entitled users and point their action to `/courses/a1.1/`.

- [ ] **Step 5: Run focused and regression tests**

```powershell
node --test tests/guided-course-access.test.mjs tests/purchases.test.mjs tests/course-player.test.mjs
```

Expected: PASS, including direct-URL attempts to lesson 4 and checkpoints.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/guidedCourseAccess.js src/components/GuidedCourseGuard.jsx src/App.jsx src/pages/CourseHomePage.jsx tests/guided-course-access.test.mjs tests/purchases.test.mjs
git commit -m "feat: add three-lesson A1.1 course preview"
```

### Task 3: Complete recorded audio and linked-practice coverage

**Files:**
- Modify: `src/data/curricula/a11.audio.js` through the generator only
- Modify: `src/data/curricula/a11.js`
- Modify: `astro-site/src/data/curricula/a11.js`
- Modify: A1.1 listening/reading migrations and cache entries selected from the missing-coverage audit
- Modify: `tests/course-audio.test.mjs`
- Create: `tests/a11-premium-readiness.test.mjs`
- Modify: `docs/course-factory/a11-rebuild/EVALUATION-codex-2026-09-14.md`
- Modify: `docs/course-factory/a11-rebuild/REVIEW-daf-23-2026-09-12.md`

**Interfaces:**
- Consumes: `planRenders(CURRICULUM_A11)` and `scripts/generate-course-audio.mjs`.
- Produces: populated manifest entries for every planned A1.1 course clip.
- Produces: one linked listening and one linked reading activity for each of 12 lessons.

- [ ] **Step 1: Add the premium-readiness test**

```js
// tests/a11-premium-readiness.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import manifest from '../src/data/curricula/a11.audio.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { planRenders, sha1 } from '../scripts/generate-course-audio.mjs';

test('every planned A1.1 course clip has a current recorded-audio entry', () => {
  const planned = planRenders(CURRICULUM_A11).filter((entry) => entry.lektionId);
  for (const entry of planned) {
    const actual = manifest.lektionen?.[entry.lektionId]?.[entry.key];
    assert.ok(actual?.url, `${entry.lektionId}/${entry.key} has no recorded audio`);
    assert.equal(actual.sha1, sha1(entry.text), `${entry.lektionId}/${entry.key} audio is stale`);
  }
});

test('every A1.1 lesson links listening and reading practice', () => {
  for (const lesson of CURRICULUM_A11.lektionen) {
    assert.ok(Number.isInteger(lesson.links?.listeningExercise), `${lesson.id} lacks linked listening`);
    assert.ok(Number.isInteger(lesson.links?.readingOrder), `${lesson.id} lacks linked reading`);
  }
});
```

- [ ] **Step 2: Run the test and record the exact missing list**

```powershell
node --test tests/a11-premium-readiness.test.mjs
node scripts/generate-course-audio.mjs a1.1 --dry
```

Expected: FAIL on the empty manifest and the six listening/two reading gaps documented in the evaluation.

- [ ] **Step 3: Close review #23’s 24 recorded edge cases**

Work through every numbered minor finding in `REVIEW-daf-23-2026-09-12.md`. For each item, change the authoritative A1.1 curriculum/pool/migration source, add or tighten a focused assertion, and change the finding state to `RESOLVED` with the commit hash. Run after each group:

```powershell
node scripts/validate-curriculum.mjs a1.1
node --test tests/curricula.test.mjs tests/lesson-pool-rules.test.mjs tests/lesson-extra-items.test.mjs
```

Expected: validation and tests PASS; all 24 entries have evidence-backed `RESOLVED` states.

- [ ] **Step 4: Add the missing linked practice and synchronize the Astro copy**

Author or link one A1.1-appropriate listening and reading activity per lesson, then set each curriculum lesson’s canonical links. Run the existing duplicate/synchronization guards:

```powershell
node --test tests/a1-1-listening.test.mjs tests/a1-1-reading.test.mjs tests/curricula.test.mjs
npm run check:duplicates
```

Expected: 12/12 lessons have both links and every referenced item resolves.

- [ ] **Step 5: Generate, publish and sample the course audio**

Run first in dry mode, then with the existing required secrets available in the local environment:

```powershell
node scripts/generate-course-audio.mjs a1.1 --dry
node scripts/generate-course-audio.mjs a1.1
node --test tests/course-audio.test.mjs tests/a11-premium-readiness.test.mjs
```

Expected: the real run reports zero failed clips; the manifest is populated; tests PASS. Manually listen to at least one dialogue line, one pretest, one phonetics clip and one checkpoint-used line from each lesson, recording clip URL and verdict in the evaluation document.

- [ ] **Step 6: Commit**

```powershell
git add src/data/curricula/a11.audio.js src/data/curricula/a11.js astro-site/src/data/curricula/a11.js tests/course-audio.test.mjs tests/a11-premium-readiness.test.mjs docs/course-factory/a11-rebuild/EVALUATION-codex-2026-09-14.md docs/course-factory/a11-rebuild/REVIEW-daf-23-2026-09-12.md migrations grammar-content-cache.json
git commit -m "feat: complete premium A1.1 course media"
```

### Task 4: Add the speaking-inclusive final assessment and human release evidence

**Files:**
- Modify: `src/data/courseTests/abschlusstestA11.js`
- Modify: `src/data/courseTests/index.js`
- Modify: `src/pages/Modelltest/ModelltestRun.jsx`
- Modify: `src/services/examScoring.js`
- Modify: `tests/exams.test.mjs`
- Create: `docs/course-factory/a11-rebuild/RELEASE-REVIEW-2026-09.md`
- Create: `tests/a11-release-review.test.mjs`

**Interfaces:**
- Produces: course-test section `{ key: 'sprechen', type: 'speaking-mission', missionOrder: 12, minutes: 5 }`.
- Consumes: guided mission result contract from Plan 3: `{ passed, task, language, pronunciation, sessionToken }`.
- Produces: a named human review artifact with final `APPROVED` or `REJECTED` verdict.

- [ ] **Step 1: Write the failing final-assessment test**

```js
test('A1.1 final assessment includes a five-minute speaking mission', () => {
  const speaking = abschlusstestA11.sections.find((section) => section.key === 'sprechen');
  assert.deepEqual(speaking, {
    key: 'sprechen',
    title: 'Sprechen',
    minutes: 5,
    instructions: 'Führe die Abschlussmission durch. Du stellst dich vor, reagierst auf Rückfragen und lädst eine Person ein.',
    parts: [{ key: 'sprechen-1', type: 'speaking-mission', level: 'A1.1', missionOrder: 12 }],
  });
});
```

- [ ] **Step 2: Run the test and confirm the section is absent**

```powershell
node --test tests/exams.test.mjs
```

Expected: FAIL on the missing speaking section.

- [ ] **Step 3: Add the section and runner handoff**

Add the exact section from Step 1 to `abschlusstestA11.sections`. Extend the course-test runner to render `speaking-mission` as a link to `/speaking?level=A1.1&mission=12&return=a1_1_abschluss`, then consume a passed mission result before marking the section complete. Do not add its score to acoustic or objective sections; require `passed === true` as a separate completion floor.

- [ ] **Step 4: Add the named review gate**

`tests/a11-release-review.test.mjs` reads `RELEASE-REVIEW-2026-09.md` and requires these exact fields:

```text
Reviewer name:
Qualification:
Review date:
Materials reviewed:
Verdict: APPROVED
Signature or verifiable approval reference:
```

The test must fail when any value is blank or when the verdict is not `APPROVED`. Do not fabricate the document. A qualified DaF reviewer completes it after reviewing all 12 lessons, four checkpoints, final test, audio samples and 12 mission scripts.

- [ ] **Step 5: Run the course release suite**

```powershell
node scripts/validate-curriculum.mjs a1.1
node --test tests/a1-1-course.test.mjs tests/a11-premium-readiness.test.mjs tests/a11-release-review.test.mjs tests/course-audio.test.mjs tests/exams.test.mjs
```

Expected: PASS only after real review evidence exists.

- [ ] **Step 6: Commit**

```powershell
git add src/data/courseTests/abschlusstestA11.js src/data/courseTests/index.js src/pages/Modelltest/ModelltestRun.jsx src/services/examScoring.js tests/exams.test.mjs tests/a11-release-review.test.mjs docs/course-factory/a11-rebuild/RELEASE-REVIEW-2026-09.md
git commit -m "feat: finish A1.1 assessment release gate"
```
