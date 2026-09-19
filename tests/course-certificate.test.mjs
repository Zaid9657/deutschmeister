// Guard suite for the two-ledger split (2026-09-19): a REBUILT level
// (curriculumFor(level) exists — A1.1 today) must read progress under
// programKeyFor(level) and count against curriculumPath(curriculum), never
// the legacy 28-day program.programKey/flattenCourse pair. Source pins only
// (no jsdom/React renderer in this repo's test setup — see
// tests/course-player.test.mjs for the same style).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const PAGES = ['src/pages/CourseCertificatePage.jsx', 'src/pages/CourseCompletePage.jsx'];

test('both pages import and use curriculumFor/curriculumPath and programKeyFor', () => {
  for (const f of PAGES) {
    const src = read(f);
    assert.match(src, /from '\.\.\/data\/curricula\/index\.js'/, `${f} must import from data/curricula/index.js`);
    assert.match(src, /curriculumFor\(/, `${f} must call curriculumFor`);
    assert.match(src, /curriculumPath\(/, `${f} must call curriculumPath`);
    assert.match(src, /from '\.\.\/services\/lessonService\.js'/, `${f} must import programKeyFor from lessonService.js`);
    assert.match(src, /programKeyFor\(/, `${f} must call programKeyFor`);
  }
});

test('the curriculum branch reads program_progress under programKeyFor(level), never a hard-coded program key', () => {
  for (const f of PAGES) {
    const src = read(f);
    assert.match(src, /const programKey = curriculum \? programKeyFor\(level\) : course(\?\.|\.)programKey;/, `${f} must switch its program_progress key on whether a curriculum exists`);
  }
});

test('the legacy branch (courseFor + flattenCourse + course.programKey) is retained unconditionally', () => {
  for (const f of PAGES) {
    const src = read(f);
    assert.match(src, /courseFor\(level\)/, `${f} must still call courseFor for legacy levels`);
    assert.match(src, /flattenCourse\(/, `${f} must still call flattenCourse for the legacy branch`);
  }
});

test('completion, for a curriculum, requires every node of curriculumPath done (mirrors CurriculumHomePage)', () => {
  const home = read('src/pages/CurriculumHomePage.jsx');
  assert.match(home, /firstOpenIndex === -1/, 'CurriculumHomePage completion is "no open node" — the reference definition');
  for (const f of PAGES) {
    const src = read(f);
    assert.match(
      src,
      /path\.length > 0 && path\.every\(\(n\) => done\.has\(n\.id\)\)/,
      `${f} must define curriculum completion as every path node done, including the leveltest node`,
    );
  }
});

test('the certificate carries the DaF disclaimer text (docs/course-standard-2026-09-12.md §4)', () => {
  const src = read('src/pages/CourseCertificatePage.jsx');
  assert.ok(src.includes('Teilnahmebescheinigung — DeutschMeister'), 'certificate must carry the Teilnahmebescheinigung heading for a rebuilt level');
  assert.ok(src.includes('kein Goethe-/telc-Ergebnis'), 'certificate must state plainly it is not a Goethe/telc result');
});

test('the certificate and complete page counts are derived from curriculum/path data, never typed literals', () => {
  const cert = read('src/pages/CourseCertificatePage.jsx');
  assert.match(cert, /path\.filter\(\(n\) => n\.kind === 'lektion' && done\.has\(n\.id\)\)\.length/, 'Lektionen-done count must be derived from path + done');
  assert.match(cert, /curriculum\.lektionen\.length/, 'Lektionen total must be derived from curriculum.lektionen');
  assert.match(cert, /path\.filter\(\(n\) => n\.kind === 'checkpoint' && done\.has\(n\.id\)\)\.length/, 'checkpoints-done count must be derived from path + done');
  assert.match(cert, /curriculum\.checkpoints\.length/, 'checkpoints total must be derived from curriculum.checkpoints');

  const complete = read('src/pages/CourseCompletePage.jsx');
  assert.match(complete, /curriculum\.lektionen\.reduce\(\(s, l\) => s \+ \(l\.wortfeld\?\.length \|\| 0\), 0\)/, 'words-met must be summed from every Lektion\'s wortfeld length');
});

test('the complete page never links a rebuilt level straight to the next (paused/draft) level; it offers "All courses" instead', () => {
  const src = read('src/pages/CourseCompletePage.jsx');
  assert.match(src, /curriculum \? \(/s, 'the "next" card must branch on whether a curriculum exists');
  assert.ok(src.includes('to="/courses/"'), 'the curriculum branch of the next-step card must link to /courses/');
  assert.ok(src.includes('All courses'), 'the curriculum branch must label the link "All courses"');
});

// No pass promise, no fee, no bare usage-count claim — same family of bans as
// tests/guides.test.mjs and tests/claims.test.mjs.
const OUTCOME = /\b(garantiert bestehst|bestehst du garantiert|Bestehensgarantie|100\s?% Erfolg|sicher bestehen|guaranteed pass|guarantee[sd]? to pass)\b/i;

test('neither page makes an outcome/pass promise', () => {
  for (const f of PAGES) {
    const src = read(f);
    assert.ok(!OUTCOME.test(src), `${f} must not contain an outcome/pass promise`);
  }
});

test('no price literal (Euro sign or bare price number) appears in either page', () => {
  for (const f of PAGES) {
    const src = read(f);
    assert.ok(!/€|EUR\s?\d/.test(src), `${f} must not carry a price literal`);
  }
});
