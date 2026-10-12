// The telc B1 pilot route opens each day's exact task (2026-10-12). Every link
// in src/data/programs/telcB1Komplett.js lands on a page that understands it:
//
//   /schreiben/telc-b1?task=<key>     opens that task — a key of THIS exam's
//                                     bank only; anything else falls back to
//                                     the first task, never an empty page;
//   …&revise=1                        loads the learner's OWN latest letter for
//                                     that task into the editor, without ever
//                                     overwriting what they typed, and shows
//                                     its correction;
//   /speaking/?level=B1.2             receives the rehearsal through the course
//                                     context, and the return bar takes the
//                                     learner back to /telc-b1-kurs, labelled
//                                     „Zurück zum Plan";
//   /telc-b1-kurs                     clears stale contexts and fills the two
//                                     profile fields the onboarding gate reads,
//                                     without overwriting the learner's choices.
//
// Structural (the repo's style for React pages); the pure parts are tested
// behaviourally in tests/telc-pilot.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { allDays } from '../src/data/programs/telcB1Komplett.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

test('the writing page opens the named task, and only a task of this exam', () => {
  const page = read('src/pages/SchreibenPage.jsx');
  assert.match(page, /const wantedTask = searchParams\.get\('task'\);/);
  assert.match(page, /const wantsRevision = searchParams\.get\('revise'\) === '1';/);
  assert.match(page, /const tasks = writingTasksForExam\(examKey\);/);
  assert.match(page, /const activeTask = tasks\.find\(\(t\) => t\.taskKey === taskKey\) \|\| tasks\[0\] \|\| null;/,
    'an unknown ?task= must fall back to the first task of the bank, never to nothing');
  assert.match(page, /const revising = wantsRevision && !!activeTask && activeTask\.taskKey === wantedTask;/,
    'the revision view belongs to the task the link named, and only to it');
});

test('revise=1 loads the learner\'s own latest letter and never overwrites typed text', () => {
  const page = read('src/pages/SchreibenPage.jsx');
  const effect = page.slice(page.indexOf('// Revision day:'), page.indexOf('const submit = async'));
  assert.match(effect, /\.eq\('user_id', user\.id\)/, 'only the learner\'s own rows');
  assert.match(effect, /\.eq\('exam_key', examKey\)/);
  assert.match(effect, /\.eq\('task_key', activeTask\.taskKey\)/);
  assert.match(effect, /\.order\('created_at', \{ ascending: false \}\)\s*\.limit\(1\)/, 'the LATEST letter');
  assert.match(effect, /setText\(\(current\) => \(current\.trim\(\) \? current : data\.submission_text\)\)/,
    'the pre-fill must never replace text the learner already typed');
  assert.match(page, /Ihre letzte Korrektur/);
});

test('the return bar takes a telc rehearsal home to the plan, and hides on the plan itself', () => {
  const bar = read('src/components/CourseReturnBar.jsx');
  assert.match(bar, /const home = ctx\.homeHref \|\| courseHome\(ctx\.level\);/);
  assert.match(bar, /\{ctx\.returnLabel \|\| 'Zurück zur Lektion'\}/);
  assert.match(bar, /\(ctx\.homeHref && pathname === ctx\.homeHref\)/, 'no return bar on the page it returns to');
  const flow = read('src/lib/courseFlow.js');
  assert.match(flow, /export const TELC_COURSE_HOME = '\/telc-b1-kurs';/);
});

test('the course page hands every rehearsal over before it navigates', () => {
  const page = read('src/pages/TelcB1KursPage.jsx');
  const handOffs = page.match(/saveCourseContext\(telcCourseContext\(item\)\)/g) || [];
  assert.ok(handOffs.length >= 2, 'both the plan list and the „Heute" button must hand the task over');
  assert.match(page, /item\.type === 'speaking'/);
});

test('arrival clears stale contexts and fills only empty profile fields', () => {
  const page = read('src/pages/TelcB1KursPage.jsx');
  const arrival = page.slice(page.indexOf('// Arrival:'), page.indexOf('// The learner\'s records'));
  assert.match(arrival, /clearCourseContext\(\);/);
  assert.match(arrival, /update\(\{ onboarding_completed_at: now \}\)[\s\S]*?\.is\('onboarding_completed_at', null\)/,
    'onboarding is marked done only where it is still empty');
  assert.match(arrival, /update\(\{ exam_track: EXAM_KEY \}\)[\s\S]*?\.or\('exam_track\.is\.null,exam_track\.eq\.none'\)/,
    'a learner who chose another exam keeps it');
  assert.match(page, /MOCK_DISCLAIMER_DE/, 'the short test is labelled practice material');
});

test('every route the plan links to exists in the app and survives a direct page load', () => {
  const app = read('src/App.jsx');
  const toml = read('netlify.toml');
  const ROUTES = [
    [/^\/schreiben\/[a-z0-9-]+$/, 'path="/schreiben/:examSlug"', 'from = "/schreiben/*"'],
    [/^\/modelltest\/[a-z0-9-]+$/, 'path="/modelltest/:examSlug"', 'from = "/modelltest/*"'],
    [/^\/speaking\/$/, 'path="/speaking"', 'from = "/speaking"'],
    [/^\/analyze\/$/, 'path="/analyze"', 'from = "/analyze"'],
    [/^\/reading\/[ab][12]\.[12]$/, 'path="/reading/:level"', 'from = "/reading/*"'],
    [/^\/listening\/[ab][12]\.[12]$/, 'path="/listening/:level"', 'from = "/listening/*"'],
  ];
  const spaLinks = allDays().flatMap((d) => d.items).filter((i) => !i.external).map((i) => i.href.split('?')[0]);
  for (const href of spaLinks) {
    const route = ROUTES.find(([re]) => re.test(href));
    assert.ok(route, `${href}: not a route this test knows — add it with its App.jsx and netlify.toml entries`);
    assert.ok(app.includes(route[1]), `${href}: ${route[1]} missing from App.jsx`);
    assert.ok(toml.includes(route[2]), `${href}: ${route[2]} missing from netlify.toml — a direct load would 404`);
  }
});
