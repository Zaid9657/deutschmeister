// Verifier for goetheA2Kurs.js — Wave 6 PR B. Run with:
//   node /tmp/.../wave6/plan/verify.mjs
// Exits non-zero (and prints every failure) on any violation; exits 0 with
// counts printed on success.

import {
  PROGRAM_KEY,
  PROGRAM_TITLE,
  PROGRAM_MINUTES,
  PROGRAM_HOURS,
  PROGRAM,
  allItemIds,
} from './goetheA2Kurs.js';
import { getTopicsForLevel } from '/home/user/deutschmeister/src/data/grammarTopics.js';
import { bannedIn } from '/home/user/deutschmeister/tests/helpers/a2Bans.mjs';
import { goetheA2Mock } from '/home/user/deutschmeister/src/data/mockExams/goetheA2.js';

const fails = [];
const fail = (msg) => fails.push(msg);

// ---------------------------------------------------------------------
// Structure: 5 weeks, 30 days
// ---------------------------------------------------------------------
if (PROGRAM.weeks.length !== 5) fail(`expected 5 weeks, got ${PROGRAM.weeks.length}`);
const allDays = PROGRAM.weeks.flatMap((w) => w.days);
if (allDays.length !== 30) fail(`expected 30 days, got ${allDays.length}`);

// ---------------------------------------------------------------------
// Unique ids
// ---------------------------------------------------------------------
const ids = allItemIds();
const idSet = new Set(ids);
if (idSet.size !== ids.length) {
  const seen = new Set();
  const dupes = ids.filter((id) => (seen.has(id) ? true : (seen.add(id), false)));
  fail(`duplicate item ids: ${dupes.join(', ')}`);
}
if (PROGRAM_KEY !== 'goethe_a2_30_tage') fail(`PROGRAM_KEY should be 'goethe_a2_30_tage', got '${PROGRAM_KEY}'`);
if (PROGRAM_TITLE !== 'Goethe-Zertifikat A2: 30 Tage bis zur Prüfung') {
  fail(`unexpected PROGRAM_TITLE: '${PROGRAM_TITLE}'`);
}

// ---------------------------------------------------------------------
// Href allow-list + external:true exactly on Astro pages / PDFs
// ---------------------------------------------------------------------
const a21Slugs = new Set(getTopicsForLevel('a2.1').map((t) => t.slug));
const a22Slugs = new Set(getTopicsForLevel('a2.2').map((t) => t.slug));

const GOETHE_PDF_URLS = new Set([
  'https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Modellsatz_Erwachsene.pdf',
  'https://www.goethe.de/pro/relaunch/prf/materialien/A2/A2_Uebungssatz_Erwachsene.pdf',
]);

/** Returns { ok, requiresExternal } or { ok:false }. */
function classifyHref(href) {
  let m;
  if ((m = href.match(/^\/grammar\/(a2\.1|a2\.2)\/([a-z0-9-]+)\/$/))) {
    const [, level, slug] = m;
    const slugs = level === 'a2.1' ? a21Slugs : a22Slugs;
    if (!slugs.has(slug)) return { ok: false, reason: `unknown grammar slug ${level}/${slug}` };
    return { ok: true, requiresExternal: true };
  }
  if (href === '/grammar/a2.1/' || href === '/grammar/a2.2/') return { ok: true, requiresExternal: true };
  if (/^\/reading\/a2\.[12]$/.test(href)) return { ok: true, requiresExternal: false };
  if (/^\/listening\/a2\.2\/[1-6]$/.test(href)) return { ok: true, requiresExternal: false };
  if (href === '/schreiben/goethe-a2') return { ok: true, requiresExternal: false };
  if (href === '/speaking/') return { ok: true, requiresExternal: false };
  if (href === '/analyze/') return { ok: true, requiresExternal: false };
  if (/^\/modelltest\/(goethe-a2|abschlusstest-a2-[12])$/.test(href)) return { ok: true, requiresExternal: false };
  if (href === '/leitfaden/goethe-a2/') return { ok: true, requiresExternal: true };
  if (href === '/vocabulary') return { ok: true, requiresExternal: false };
  if (GOETHE_PDF_URLS.has(href)) return { ok: true, requiresExternal: true };
  return { ok: false, reason: 'href matches no allowed class' };
}

const hrefClassCounts = {};
const bump = (k) => (hrefClassCounts[k] = (hrefClassCounts[k] || 0) + 1);

let dayMinutesMax = 0;
const pufferDays = [];
const ordinaryDays = [];
let mockCount = 0;
const mockDays = [];
const allTitles = []; // { path, s }
const mockItemMinutes = []; // { path, minutes }

// ---------------------------------------------------------------------
// B3: mock minutes are DERIVED from the real mock module, never retyped.
// goetheA2Mock.sections is [{ minutes, ... }, ...] — sum them and require
// every /modelltest/goethe-a2 item's `minutes` to equal that sum exactly.
// ---------------------------------------------------------------------
if (!Array.isArray(goetheA2Mock?.sections) || goetheA2Mock.sections.length === 0) {
  fail('goetheA2Mock.sections is missing or empty — cannot derive mock minutes');
}
const expectedMockMinutes = (goetheA2Mock.sections || []).reduce((sum, s) => sum + (s.minutes || 0), 0);

PROGRAM.weeks.forEach((week, wi) => {
  // Week intro: exactly 2 sentences, each ≤16 words.
  const sentences = week.intro.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length !== 2) {
    fail(`week "${week.title}" intro should be exactly 2 sentences, got ${sentences.length}`);
  }
  for (const s of sentences) {
    const words = s.trim().split(/\s+/).filter(Boolean).length;
    if (words > 16) fail(`week "${week.title}" intro sentence over 16 words (${words}): "${s}"`);
  }
  allTitles.push({ path: `week[${wi}].intro`, s: week.intro });
  allTitles.push({ path: `week[${wi}].title`, s: week.title });

  week.days.forEach((day, _di) => {
    let dayMinutes = 0;
    for (const item of day.items) {
      dayMinutes += item.minutes;
      allTitles.push({ path: `${day.label} ${item.id}`, s: item.title });

      const cls = classifyHref(item.href);
      if (!cls.ok) {
        fail(`${day.label} item ${item.id}: ${cls.reason} (href="${item.href}")`);
        continue;
      }
      bump(cls.requiresExternal ? 'astro/pdf (external)' : 'spa (no external)');
      const isExternal = item.external === true;
      if (cls.requiresExternal && !isExternal) {
        fail(`${day.label} item ${item.id}: href "${item.href}" requires external:true`);
      }
      if (!cls.requiresExternal && isExternal) {
        fail(`${day.label} item ${item.id}: href "${item.href}" must NOT carry external:true`);
      }

      if (item.href === '/modelltest/goethe-a2') {
        mockCount += 1;
        mockDays.push(day.label);
        mockItemMinutes.push({ path: `${day.label} ${item.id}`, minutes: item.minutes });
      }

      // B4: item titles are "short, ≤ 10 words" per plan-brief.md's item shape.
      const titleWords = item.title.trim().split(/\s+/).filter(Boolean).length;
      if (titleWords > 10) fail(`${day.label} item ${item.id}: title over 10 words (${titleWords}): "${item.title}"`);
    }
    // B1: no day (other than the two designated "— Puffertag" days) may sit
    // below the plan's own 45-minute floor — otherwise a day can quietly be
    // lighter than the days meant to BE the light ones.
    if (day.label.includes('— Puffertag')) pufferDays.push({ label: day.label, minutes: dayMinutes });
    else {
      ordinaryDays.push({ label: day.label, minutes: dayMinutes });
      if (dayMinutes < 45) fail(`${day.label} is below the 45-minute floor (${dayMinutes}) and is not a designated Puffertag`);
    }
    if (dayMinutes > 75) fail(`${day.label} exceeds 75 minutes (${dayMinutes})`);
    dayMinutesMax = Math.max(dayMinutesMax, dayMinutes);
  });
});

// m7 (round-2 review): the floor exemption is label-driven, so pin that
// exactly two days carry it and that both are lighter than every other day —
// a third "— Puffertag" label cannot silence the floor.
if (pufferDays.length !== 2) fail(`expected exactly 2 "— Puffertag" days, found ${pufferDays.length}`);
const lightestOrdinary = Math.min(...ordinaryDays.map((d) => d.minutes));
for (const d of pufferDays) {
  if (d.minutes >= lightestOrdinary) fail(`${d.label} (${d.minutes} min) is not lighter than every ordinary day (${lightestOrdinary})`);
}

// ---------------------------------------------------------------------
// The mock appears exactly twice, on Tag 26 and Tag 30
// ---------------------------------------------------------------------
if (mockCount !== 2) fail(`expected the mock (/modelltest/goethe-a2) exactly twice, found ${mockCount}`);
const expectedMockDays = ['Tag 26', 'Tag 30'];
if (JSON.stringify(mockDays) !== JSON.stringify(expectedMockDays)) {
  fail(`expected mock on Tag 26 and Tag 30, found on: ${mockDays.join(', ')}`);
}
for (const { path, minutes } of mockItemMinutes) {
  if (minutes !== expectedMockMinutes) {
    fail(`${path}: mock minutes (${minutes}) do not match goetheA2Mock.sections sum (${expectedMockMinutes})`);
  }
}

// ---------------------------------------------------------------------
// PROGRAM_MINUTES equals the sum
// ---------------------------------------------------------------------
const recomputed = PROGRAM.weeks.reduce(
  (sum, w) => sum + w.days.reduce((daySum, d) => daySum + d.items.reduce((s, i) => s + i.minutes, 0), 0),
  0
);
if (recomputed !== PROGRAM_MINUTES) {
  fail(`PROGRAM_MINUTES (${PROGRAM_MINUTES}) does not equal the recomputed sum (${recomputed})`);
}

// ---------------------------------------------------------------------
// Ban battery + ≤16-word cap + no outcome promise, over every German string
// (subtitle, week titles/intros, item titles — not hrefs/ids/types)
// ---------------------------------------------------------------------
allTitles.push({ path: 'PROGRAM.subtitle', s: PROGRAM.subtitle });
allTitles.push({ path: 'PROGRAM.title', s: PROGRAM.title });

const OUTCOME_PROMISE_RE =
  /garantiert|100\s*%|sicher\s+bestehen|wirst\s+(die\s+Prüfung\s+)?bestehen|schaffst\s+die\s+Prüfung\s+sicher|bestehst\s+garantiert/i;

for (const { path, s } of allTitles) {
  for (const hit of bannedIn(s)) {
    fail(`${path}: banned [${hit.ban}] "${hit.match}" in "${s}"`);
  }
  if (OUTCOME_PROMISE_RE.test(s)) {
    fail(`${path}: outcome promise detected in "${s}"`);
  }
  for (const sentence of s.split(/(?<=[.!?])\s+/).filter(Boolean)) {
    const words = sentence.trim().split(/\s+/).filter(Boolean).length;
    if (words > 16) fail(`${path}: sentence over 16 words (${words}): "${sentence}"`);
  }
}

// ---------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------
if (fails.length > 0) {
  console.error(`FAILED (${fails.length} issue(s)):`);
  for (const f of fails) console.error(` - ${f}`);
  process.exit(1);
}

console.log('OK — goetheA2Kurs.js verified.');
console.log(`weeks: ${PROGRAM.weeks.length}, days: ${allDays.length}, items: ${ids.length}`);
console.log(`PROGRAM_MINUTES: ${PROGRAM_MINUTES}, PROGRAM_HOURS: ${PROGRAM_HOURS}`);
console.log(`max single-day minutes: ${dayMinutesMax}`);
console.log(`href classes: ${JSON.stringify(hrefClassCounts)}`);
console.log(`mock (/modelltest/goethe-a2) days: ${mockDays.join(', ')}, minutes: ${expectedMockMinutes} (derived from goetheA2Mock.sections)`);
process.exit(0);
