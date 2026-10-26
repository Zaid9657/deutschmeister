import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COURSE_TESTS, courseTestDescription } from '../src/data/courseTests/index.js';
import { describeCourseTest } from '../src/data/courseTests/description.js';
import { COURSE_CONTENTS } from '../src/data/courseContents.js';
import { CURRICULA } from '../src/data/curricula/index.js';
import { COURSES } from '../src/data/courses/index.js';
import { t } from '../src/lib/lesson/strings.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const surfaces = [
  'astro-site/src/pages/courses/[level].astro', 'astro-site/src/pages/courses/index.astro',
  'astro-site/src/components/linie/Proof.astro', 'astro-site/src/components/linie/Progression.astro',
  'astro-site/src/pages/index.astro', 'src/data/offers.js', 'src/data/marketing.js', 'src/data/pricing.js',
  'src/pages/CourseCertificatePage.jsx', 'src/pages/CourseCompletePage.jsx', 'src/pages/CourseHomePage.jsx',
  'src/pages/CurriculumHomePage.jsx', 'src/pages/Modelltest/ModelltestHub.jsx',
  'src/pages/Modelltest/ModelltestOverview.jsx', 'src/lib/lesson/strings.js', 'src/data/curricula/a11.meta.js',
];
const oldClaims = /(?:final test|practice test|Übungstest|Abschlusstest).{0,90}(?:in the .{0,45}format|in \$\{.{0,40}\} format|im Format|· \{testFormat\} format)|Kurzversion im Start-Deutsch-1-Format|im Format Ihrer Prüfung|in the format of your exam|scored against (?:the exam's pass line|the real pass threshold)|final tests use those exams’ formats|half exam length|ends with the \{course\.testFormat\} final test/i;

test('buyer and learner surfaces ban examination-format and official-score course claims', () => {
  for (const file of surfaces) assert.doesNotMatch(read(file), oldClaims, file);
  // A planted old claim must fail the same guard.
  for (const claim of ['Final test in the Start Deutsch 1 format', 'im Format Ihrer Prüfung', 'scored against the real pass threshold']) {
    assert.match(claim, oldClaims);
  }
});

test('every served final-test description derives sections, omissions, time and combined course pass rule', () => {
  const slugs = new Set([
    ...Object.values(COURSE_CONTENTS).flatMap((c) => c.finalTest ? [c.finalTest.slug] : []),
    ...Object.values(CURRICULA).map((c) => c.testSlug), ...Object.values(COURSES).map((c) => c.testSlug),
  ]);
  assert.equal(slugs.size, 4, 'includes the two legacy tests served by the same pages');
  for (const slug of slugs) {
    const { mock } = COURSE_TESTS.find((ct) => ct.slug === slug);
    const de = courseTestDescription(slug, 'de');
    const en = courseTestDescription(slug, 'en');
    const minutes = mock.sections.reduce((sum, s) => sum + s.minutes, 0);
    assert.ok(de.includes(`insgesamt ${minutes} Minuten`));
    assert.ok(en.includes(`${minutes} minutes total`));
    for (const s of mock.sections) assert.ok(de.includes(`${s.title} (${s.minutes} Min.)`));
    for (const p of mock.sections.flatMap((s) => s.parts).filter((p) => p.type === 'writing')) {
      assert.ok(de.includes(p.label.replace(/^Teil \d+ · /, '')));
    }
    assert.match(de, /Selbstcheck.*zählt nicht zur Punktzahl/);
    assert.match(de, /Nicht enthalten: .*Sprechen/);
    assert.ok(de.includes(`${mock.passPercent} % der gemeinsamen automatisch bewerteten Punkte in Hören und Lesen`));
    assert.ok(en.includes(`${mock.passPercent}% of the combined automatically scored Listening and Reading points`));
    assert.match(en, /not an official exam.*does not use official exam scoring/);
    assert.doesNotMatch(de + en, oldClaims);
  }
  assert.match(courseTestDescription('abschlusstest-a1-1'), /Nicht enthalten: eine freie Mitteilung, Sprechen/);
  assert.match(courseTestDescription('abschlusstest-a1-2'), /Nicht enthalten: ein Formular, Sprechen/);
  const mutated = structuredClone(COURSE_TESTS[0].mock);
  mutated.sections[0].minutes = 17;
  mutated.passPercent = 65;
  assert.match(describeCourseTest(mutated), /Hören \(17 Min\.\).*42 Minuten.*65 %/);
});

test('detailed surfaces use the shared description, including generic A1.2 and legacy paths', () => {
  for (const file of ['astro-site/src/pages/courses/[level].astro', 'src/pages/CurriculumHomePage.jsx',
    'src/pages/CourseCertificatePage.jsx', 'src/pages/CourseCompletePage.jsx', 'src/pages/CourseHomePage.jsx', 'src/pages/Modelltest/ModelltestHub.jsx',
    'src/data/curricula/a11.meta.js']) assert.match(read(file), /courseTestDescription\(/, file);
  assert.match(read('src/pages/Modelltest/ModelltestOverview.jsx'), /mock\.courseLevel \? describeCourseTest\(mock, 'de'\)/);
  assert.match(read('src/pages/Modelltest/ModelltestResult.jsx'), /resolved\.kind === 'course'\s*\? \{[^}]*body: describeCourseTest\(mock, 'de'\)/);
  assert.match(t('checkpoint.intro', 'de'), /adaptierter Kurstest, keine Prüfungssimulation/);
  assert.match(t('checkpoint.intro', 'en'), /adapted course assessment, not an exam simulation/);
  for (const lang of ['de', 'en']) assert.doesNotMatch(t('checkpoint.intro', lang), oldClaims);
  assert.match(t('writing.assessmentNote', 'de'), /Kurs-Übungsraster/);
  assert.match(t('writing.assessmentNote', 'en'), /course practice rubric/);
  for (const lang of ['de', 'en']) {
    assert.doesNotMatch(t('writing.assessmentNote', lang), /Prüfungskriterien|exam criteria/);
    assert.doesNotMatch(t('recap.skill.writing.assessed', lang), /Prüfungskriterien|exam criteria/);
  }
});

test('course standard distinguishes delivered assessments from the OPEN full-format requirement', () => {
  const text = read('docs/course-standard-2026-09-12.md');
  assert.match(text, /OPEN requirement: full-format level test/);
  assert.match(text, /60 % of the combined/);
  assert.doesNotMatch(text, /Goethe\/telc mirror|existing `abschlusstest-a1-1` \(SD1 format|full level test in the official exam format/);
});
