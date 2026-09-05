// Guard suite for the exam-track layer (renovation Phase 3).
//
// What each pin defends:
//   1. REGISTRY INTEGRITY — every track's slug/level/sublevels/guideSlug must
//      resolve: the /pruefung/ hubs, the dashboard exam goal and the future
//      mock/writing keys all trust this registry blindly.
//   2. TRUTH BANS — the guides' outcome-promise ban applies here, plus an
//      official-material ban: practice content styled after an exam must never
//      claim to BE the exam (telc/Goethe are other people's trademarks).
//   3. DISCLAIMER — anywhere mock-style material is described, the disclaimer
//      module must be what renders (present, and carrying the key phrases).
//   4. THREE-PLACE RULE for the new segment — /pruefung must be copied into
//      dist/ by the netlify build command, whitelisted in the sitemap filter,
//      and required by check-built-html.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { EXAM_TRACKS, examTrackByKey, examTrackBySlug, MOCK_DISCLAIMER_DE } from '../src/data/examTracks.js';
import { levels as ALL_LEVELS } from '../src/data/content.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const netlifyToml = readFileSync(join(root, 'netlify.toml'), 'utf8');
const astroConfig = readFileSync(join(root, 'astro-site/astro.config.mjs'), 'utf8');
const checkBuiltHtml = readFileSync(join(root, 'scripts/check-built-html.mjs'), 'utf8');
const hubsSrc = readFileSync(join(root, 'astro-site/src/data/exams/index.js'), 'utf8');
const hubRenderer = readFileSync(join(root, 'astro-site/src/pages/pruefung/[slug].astro'), 'utf8');

// ── 1. registry integrity ────────────────────────────────────────────────

test('every exam track is well-formed and resolvable', () => {
  assert.ok(EXAM_TRACKS.length >= 4, 'the four launch tracks must exist');
  const keys = new Set();
  const slugs = new Set();
  for (const t of EXAM_TRACKS) {
    assert.match(t.key, /^[a-z0-9_]+$/, `key not machine-safe: ${t.key}`);
    assert.match(t.slug, /^[a-z0-9-]+$/, `slug not URL-safe: ${t.slug}`);
    assert.ok(!keys.has(t.key) && !slugs.has(t.slug), `duplicate track: ${t.key}`);
    keys.add(t.key);
    slugs.add(t.slug);
    assert.ok(t.nameDe && t.level, `name/level missing on ${t.key}`);
    for (const sub of t.sublevels) {
      assert.ok(ALL_LEVELS.includes(sub), `${t.key} references unknown sublevel ${sub}`);
    }
    assert.equal(examTrackByKey(t.key), t);
    assert.equal(examTrackBySlug(t.slug), t);
    // guideSlug must resolve to a real guide module
    assert.ok(
      readFileSync(join(root, `astro-site/src/data/guides/${t.guideSlug}.js`), 'utf8').length > 0,
      `${t.key} points at a guide that does not exist: ${t.guideSlug}`
    );
  }
});

test('hasMock/hasWriting flags match the actual content modules', async () => {
  const { MOCK_EXAMS } = await import('../src/data/mockExams/index.js');
  const { WRITING_TASKS } = await import('../src/data/writingTasks.js');
  for (const t of EXAM_TRACKS) {
    assert.equal(
      !!t.hasMock,
      !!MOCK_EXAMS[t.key],
      `${t.key}: hasMock=${t.hasMock} but mock content ${MOCK_EXAMS[t.key] ? 'exists' : 'does not exist'} — the hub would advertise a tool that ${t.hasMock ? "isn't there" : 'exists unlinked'}`
    );
    assert.equal(
      !!t.hasWriting,
      WRITING_TASKS.some((w) => w.examKey === t.key),
      `${t.key}: hasWriting flag drifted from the writing task bank`
    );
  }
});

test('every track has a hub copy entry in the exams data module', () => {
  for (const t of EXAM_TRACKS) {
    assert.ok(hubsSrc.includes(`${t.key}:`), `HUB_COPY missing for ${t.key}`);
  }
});

// ── 2. truth bans ────────────────────────────────────────────────────────

const OUTCOME = /\b(garantiert bestehst|bestehst du garantiert|Bestehensgarantie|100\s?% Erfolg|sicher bestehen)\b/i;
// Never claim official material or affiliation. "kein offizielles …" (the
// disclaimer's own phrasing) is explicitly allowed.
const OFFICIAL = /(offiziell(e|es)? (telc|goethe|dtz|prüfungs))(?!.*kein)|original[- ]?(telc|goethe)[- ]?(aufgaben|material|prüfung)|von (telc|goethe) zertifiziert/i;

test('exam surfaces carry no outcome promises and no official-material claims', () => {
  for (const [file, allowDisclaimer] of [
    ['src/data/examTracks.js', true],
    ['astro-site/src/data/exams/index.js', false],
    ['astro-site/src/pages/pruefung/[slug].astro', false],
    ['astro-site/src/pages/pruefung/index.astro', false],
  ]) {
    const body = readFileSync(join(root, file), 'utf8');
    assert.ok(!OUTCOME.test(body), `${file} contains an outcome promise`);
    const stripped = allowDisclaimer
      ? body.replace(/kein offizielles Prüfungsmaterial/g, '')
      : body;
    assert.ok(!OFFICIAL.test(stripped), `${file} claims official material or affiliation`);
  }
});

// ── 3. the disclaimer ────────────────────────────────────────────────────

test('the mock disclaimer says what it must', () => {
  assert.match(MOCK_DISCLAIMER_DE, /kein offizielles Prüfungsmaterial/);
  assert.match(MOCK_DISCLAIMER_DE, /keine offizielle Bewertung/);
  assert.match(MOCK_DISCLAIMER_DE, /keiner Verbindung/);
});

// ── 4. three-place rule for the new segment ──────────────────────────────

test('/pruefung is copied, sitemapped and required in the built-HTML check', () => {
  // BOTH merge sites: netlify.toml's build command (production) AND the CI
  // workflow's own copy of the same steps. Adding the step in only one place
  // is exactly how the /pruefung pages passed locally and failed in CI.
  assert.ok(
    netlifyToml.includes('cp -r astro-site/dist/pruefung dist/pruefung'),
    'netlify.toml build command must copy the pruefung directory into dist/'
  );
  const ciWorkflow = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.ok(
    ciWorkflow.includes('cp -r astro-site/dist/pruefung dist/pruefung'),
    'ci.yml must copy the pruefung directory into dist/ too'
  );
  assert.ok(
    astroConfig.includes("page.includes('/pruefung/')"),
    'astro.config.mjs sitemap filter must whitelist /pruefung/'
  );
  for (const t of EXAM_TRACKS) {
    assert.ok(
      checkBuiltHtml.includes(`pruefung/${t.slug}/index.html`),
      `check-built-html REQUIRED list missing pruefung/${t.slug}`
    );
  }
});

// ── 5. mock content integrity (Phase 5a) ─────────────────────────────────

test('every mock exam is internally consistent', async () => {
  const { MOCK_EXAMS, countScorableItems } = await import('../src/data/mockExams/index.js');
  const { scoreObjectiveSections } = await import('../src/services/examScoring.js');

  for (const [examKey, mock] of Object.entries(MOCK_EXAMS)) {
    assert.ok(examTrackByKey(examKey), `mock keyed to unknown exam ${examKey}`);
    assert.match(mock.title, /Kurzversion/, `${examKey}: shortened sets must say so in the title`);
    assert.ok(mock.passPercent >= 50 && mock.passPercent <= 100);

    // Build the perfect answer sheet and require a perfect score from the
    // scorer — this catches an answer key referencing a missing id/option.
    const perfect = {};
    for (const section of mock.sections) {
      for (const part of section.parts) {
        if (part.type === 'matching') {
          const optionKeys = new Set(part.options.map((o) => o.key));
          for (const t of part.texts) {
            const ans = part.answers[t.id];
            assert.ok(optionKeys.has(ans), `${part.key}: answer for ${t.id} is not an option`);
            perfect[`${part.key}:${t.id}`] = ans;
          }
          // Distractors must exist (otherwise matching is process of elimination)
          assert.ok(part.options.length > part.texts.length, `${part.key}: no distractor headings`);
        } else if (part.type === 'mc-group') {
          for (const item of part.items) {
            assert.ok(item.options.some((o) => o.key === item.answer), `${item.id}: answer not among options`);
            perfect[item.id] = item.answer;
          }
        } else if (part.type === 'cloze') {
          const gapIds = new Set(part.gaps.map((g) => g.id));
          for (const piece of part.gapsText) {
            if (piece.gap) assert.ok(gapIds.has(piece.gap), `${part.key}: text references unknown gap ${piece.gap}`);
          }
          for (const gap of part.gaps) {
            assert.ok(gap.options.some((o) => o.key === gap.answer), `${gap.id}: answer not among options`);
            perfect[gap.id] = gap.answer;
          }
        } else if (part.type === 'listening') {
          assert.ok(/^[AB][12]\.[12]$/.test(part.level), `${part.key}: listening level must be the DB uppercase form`);
          assert.ok(Number.isInteger(part.exerciseNumber) && part.exerciseNumber >= 1 && part.exerciseNumber <= 6);
        } else if (part.type === 'writing') {
          assert.ok(part.task && part.criteria?.length >= 3, `${part.key}: writing needs a task + criteria`);
        } else {
          assert.fail(`${part.key}: unknown part type ${part.type}`);
        }
      }
    }
    const result = scoreObjectiveSections(mock, perfect);
    assert.equal(result.score, result.maxScore, `${examKey}: perfect sheet does not score 100%`);
    assert.equal(result.maxScore, countScorableItems(mock), `${examKey}: scorer and counter disagree`);
    // And an empty sheet scores zero
    assert.equal(scoreObjectiveSections(mock, {}).score, 0);
  }
});

test('the mock surfaces render the disclaimer and the Richtwert label', () => {
  for (const file of [
    'src/pages/Modelltest/ModelltestHub.jsx',
    'src/pages/Modelltest/ModelltestOverview.jsx',
    'src/pages/Modelltest/ModelltestRun.jsx',
    'src/pages/Modelltest/ModelltestResult.jsx',
  ]) {
    const body = readFileSync(join(root, file), 'utf8');
    assert.ok(body.includes('MOCK_DISCLAIMER_DE'), `${file} does not render the disclaimer`);
  }
  const result = readFileSync(join(root, 'src/pages/Modelltest/ModelltestResult.jsx'), 'utf8');
  assert.match(result, /Richtwert — keine offizielle Bewertung/);
});

test('the /modelltest routes follow the three-place rule', () => {
  const appSrc = readFileSync(join(root, 'src/App.jsx'), 'utf8');
  assert.ok(appSrc.includes('path="/modelltest"'), 'hub route missing');
  assert.ok(appSrc.includes('path="/modelltest/:examSlug/result/:attemptId"'), 'result route missing');
  assert.ok(netlifyToml.includes('from = "/modelltest"'), 'netlify.toml allow-list missing /modelltest');
  assert.ok(netlifyToml.includes('from = "/modelltest/*"'), 'netlify.toml allow-list missing /modelltest/*');
});

// ── 6. hub provenance renders ────────────────────────────────────────────

test('the hub renderer shows factsCheckedOn, sources and the non-affiliation line', () => {
  assert.match(hubRenderer, /factsCheckedOn/);
  assert.match(hubRenderer, /sources\.map/);
  assert.match(hubRenderer, /kein Prüfungsanbieter/);
});

// ── 7. course tests (Course Factory Wave 2 PR D) ─────────────────────────
//
// A course test (src/data/courseTests) is our OWN end-of-course checkpoint,
// written in an exam's STYLE but never a new exam track of its own — these
// pins keep that boundary real: `key` must never collide with an EXAM_TRACKS
// key (a course test writing into the wrong identity space), and `formatOf`
// must always resolve to a real one (the style it borrows must exist).

test('every course test is well-formed, distinct from EXAM_TRACKS, and shape-valid', async () => {
  const { COURSE_TESTS } = await import('../src/data/courseTests/index.js');
  const { countScorableItems } = await import('../src/data/mockExams/index.js');
  const { scoreObjectiveSections } = await import('../src/services/examScoring.js');
  const migrationText = readFileSync(join(root, 'migrations/2026-09-05-a1-1-abschlusstest.sql'), 'utf8');

  assert.ok(COURSE_TESTS.length >= 1, 'at least the A1.1 Abschlusstest must exist');
  const examKeys = new Set(EXAM_TRACKS.map((t) => t.key));
  const seenKeys = new Set();
  const seenSlugs = new Set();

  for (const ct of COURSE_TESTS) {
    assert.ok(!examKeys.has(ct.key), `course test key ${ct.key} collides with an EXAM_TRACKS key`);
    assert.ok(examKeys.has(ct.formatOf), `${ct.key}: formatOf (${ct.formatOf}) is not a real EXAM_TRACKS key`);
    assert.match(ct.level, /^[ab][12]\.[12]$/, `${ct.key}: level must be a lowercase sublevel`);
    assert.ok(!seenKeys.has(ct.key) && !seenSlugs.has(ct.slug), `duplicate course test: ${ct.key}`);
    seenKeys.add(ct.key);
    seenSlugs.add(ct.slug);
    assert.ok(
      migrationText.includes(ct.key),
      `migrations/2026-09-05-a1-1-abschlusstest.sql must widen exam_attempts_exam_key_check to include ${ct.key}`
    );

    const mock = ct.mock;
    assert.equal(mock.examKey, ct.key);
    assert.match(mock.title, /Kurzversion/, `${ct.key}: shortened sets must say so in the title`);
    assert.ok(mock.passPercent >= 50 && mock.passPercent <= 100);

    const perfect = {};
    for (const section of mock.sections) {
      for (const part of section.parts) {
        if (part.type === 'mc-group') {
          for (const item of part.items) {
            assert.ok(item.options.some((o) => o.key === item.answer), `${item.id}: answer not among options`);
            perfect[item.id] = item.answer;
          }
        } else if (part.type === 'listening') {
          assert.match(part.level, /^[AB][12]\.[12]$/, `${part.key}: listening level must be the DB uppercase form`);
          assert.ok(Number.isInteger(part.exerciseNumber) && part.exerciseNumber >= 1 && part.exerciseNumber <= 6);
        } else if (part.type === 'writing') {
          assert.ok(part.task && part.criteria?.length >= 3, `${part.key}: writing needs a task + criteria`);
        } else {
          assert.fail(`${part.key}: unexpected part type ${part.type} for a course test`);
        }
      }
    }
    const result = scoreObjectiveSections(mock, perfect);
    assert.equal(result.score, result.maxScore, `${ct.key}: perfect sheet does not score 100%`);
    assert.equal(result.maxScore, countScorableItems(mock), `${ct.key}: scorer and counter disagree`);
    assert.equal(scoreObjectiveSections(mock, {}).score, 0);
  }
});

test('the resolver serves both registries and the guard reads its gateLevel', async () => {
  const { resolveModelltest } = await import('../src/data/modelltest.js');
  const { courseTestBySlug } = await import('../src/data/courseTests/index.js');

  const ct = courseTestBySlug('abschlusstest-a1-1');
  const resolvedCourse = resolveModelltest('abschlusstest-a1-1');
  assert.equal(resolvedCourse.kind, 'course');
  assert.equal(resolvedCourse.key, ct.key);
  assert.equal(resolvedCourse.gateLevel, 'a1.1', 'a course test gates on its own level, never the exam-track top sublevel');

  const resolvedExam = resolveModelltest('start-deutsch-1');
  assert.equal(resolvedExam.kind, 'exam');
  assert.equal(resolvedExam.gateLevel, 'a1.2', 'an exam track still gates on its band-top sublevel');

  assert.equal(resolveModelltest('no-such-slug'), null);

  const guardSrc = readFileSync(join(root, 'src/components/ExamSubscriptionGuard.jsx'), 'utf8');
  assert.match(guardSrc, /resolveModelltest/, 'ExamSubscriptionGuard must resolve through the shared registry');
});
