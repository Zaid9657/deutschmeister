import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import { STATIONS, TICKET_STATIONS, stationFor, stationStatusLine, planLine } from '../astro-site/src/data/offers.js';
import { curriculumFor } from '../astro-site/src/data/curricula/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'astro-site/src/pages/grammar/[level]/[slug].astro'), 'utf8');

// The course a paid-level topic belongs to (2026-10-25): the topic pages of
// the levels sold as a one-time ticket never linked their course. The page's
// own derivation is evaluated here, for real levels and slugs.
const offerBlock = source.match(/const station = stationFor\(level\);[\s\S]*?\n {2}: null;\n/);
function courseOfferFor(level, slug) {
  assert.ok(offerBlock, 'the courseOffer derivation is missing from grammar/[level]/[slug].astro');
  return vm.runInNewContext(`(() => { ${offerBlock[0]}; return { courseOffer, courseLektion }; })()`, {
    stationFor, stationStatusLine, planLine, curriculumFor, level, slug,
  });
}

test('every topic on a ticket level offers its level course, derived and never typed', () => {
  assert.ok(TICKET_STATIONS.length > 0);
  for (const station of STATIONS) {
    const { courseOffer } = courseOfferFor(station.level, 'no-such-topic');
    if (station.status !== 'ticket') {
      assert.equal(courseOffer, null, `${station.code} (${station.status}) must not offer a course`);
      continue;
    }
    assert.equal(courseOffer.href, station.coursePage, `${station.code}: the course page`);
    assert.equal(courseOffer.terms, stationStatusLine(station), `${station.code}: price and terms come from offers.js`);
    const curriculum = curriculumFor(station.level);
    assert.equal(
      courseOffer.contents,
      curriculum ? `${curriculum.lektionen.length} situational lessons with checkpoints and a final test.` : planLine(station),
      `${station.code}: the contents come from the live curriculum, else the guided plan`,
    );
  }
  // The template renders it, flat, with the derived fields only.
  assert.match(source, /\{courseOffer && \(/);
  assert.match(source, /href=\{courseOffer\.href\}/);
  assert.match(source, /\{courseOffer\.terms\}/);
});

test('a topic a Lektion practises names that Lektion', () => {
  const a12 = curriculumFor('a1.2');
  const lektion = a12.lektionen.find((l) => l.grammarSlugs?.length);
  const { courseOffer, courseLektion } = courseOfferFor('a1.2', lektion.grammarSlugs[0]);
  assert.ok(courseOffer, 'A1.2 is a ticket level');
  assert.equal(courseLektion?.nr, a12.lektionen.find((l) => l.grammarSlugs?.includes(lektion.grammarSlugs[0])).nr);
  assert.match(source, /Lektion \{courseLektion\.nr\}/);
  assert.equal(courseOfferFor('a1.2', 'no-such-topic').courseLektion, null);
});

test('every grammar topic starts with an honest, data-derived summary', () => {
  assert.match(source, /const quickSummary = topic\?\.description_en/);
  assert.match(source, /id="summary"/);
  assert.match(source, /Lesson at a glance/);
  assert.match(source, /rules\.length/);
  assert.match(source, /examples\.length/);
  assert.match(source, /exercises\.length/);
});

test('the topic template builds a conditional table of contents with real anchors', () => {
  for (const id of ['summary', 'introduction', 'rules', 'examples', 'practice', 'questions']) {
    assert.match(source, new RegExp(`href: '#${id}'`));
    assert.match(source, new RegExp(`id="${id}"`));
  }
  assert.match(source, /aria-labelledby="contents-h"/);
});

test('practice is available early and examples connect directly to Sentence X-Ray', () => {
  assert.match(source, /href="#practice"[^>]*>Jump to practice</);
  assert.match(source, /const xrayHref/);
  assert.match(source, /\/analyze\/\?s=\$\{encodeURIComponent\(ex\.sentence_de\)\}/);
  assert.match(source, /Examine this sentence in Sentence X-Ray/);
});
