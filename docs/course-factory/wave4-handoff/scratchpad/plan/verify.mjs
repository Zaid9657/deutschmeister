// Scratchpad-only verification script for a21Phase.js — mirrors the Wave 3
// harness (wave3/plan/verify.mjs) and makes NO writes into the repo tree at
// all. Round 2: the four a2.1 grammar topics LANDED on main (commit accecf9),
// so grammarTopics is read from the REAL repo file — no stub, real
// estimatedTime values (25/25/22/25 for the four). Only writingTasks is still
// stubbed (a copy of the repo file plus the four goethe_a2 tasks taken
// verbatim from S/wave4/exam/writingTasks.goethe-a2.js, PR D1's deliverable).
// The two deliberately-broken variants that prove the module's import-time
// guards fire are pinned to sources that cannot rot: the missing-slugs one to
// a FROZEN pre-wave copy (`git show accecf9^:src/data/grammarTopics.js`), the
// missing-writing one to the real repo file, which carries no goethe_a2 task
// until PR D1 lands (after that, freeze it the same way). Reading real repo
// files is fine — only writing into the repo is avoided.
//
// Harness build commands are documented in notes.md; _harness/ is deleted
// after a clean run and is never committed.
import { PROGRAM, PROGRAM_MINUTES, PROGRAM_HOURS, PROGRAM_KEY, PROGRAM_TITLE, allItemIds } from './_harness/a21Phase.harness.js';
import * as ModuleExports from './_harness/a21Phase.harness.js';
import { getTopicsForLevel } from '/home/user/deutschmeister/src/data/grammarTopics.js';
import { writingTasksForExam } from './_harness/writingTasks.stub.js';

const failures = [];
const check = (label, cond) => {
  console.log((cond ? 'PASS' : 'FAIL') + ' — ' + label);
  if (!cond) failures.push(label);
};

console.log('PROGRAM_KEY', PROGRAM_KEY);
console.log('PROGRAM_TITLE', PROGRAM_TITLE);
console.log('PROGRAM_MINUTES', PROGRAM_MINUTES, '=', (PROGRAM_MINUTES / 60).toFixed(3), 'h');
console.log('PROGRAM_HOURS', PROGRAM_HOURS);
console.log('subtitle', PROGRAM.subtitle);

check('PROGRAM_KEY is a21_phase', PROGRAM_KEY === 'a21_phase');
check('PROGRAM_TITLE is the brief\'s title', PROGRAM_TITLE === 'A2.1-Phase: 28 Tage bis zum Abschlusstest');

// --- exactly the six required exports ------------------------------------
const REQUIRED_EXPORTS = new Set(['PROGRAM_KEY', 'PROGRAM_TITLE', 'PROGRAM_MINUTES', 'PROGRAM_HOURS', 'PROGRAM', 'allItemIds']);
const actualExports = new Set(Object.keys(ModuleExports));
check(
  'module exports exactly the six required names',
  actualExports.size === REQUIRED_EXPORTS.size && [...REQUIRED_EXPORTS].every((n) => actualExports.has(n))
);
console.log('exports', [...actualExports].sort());

// --- import-time guards actually throw -----------------------------------
let missingSlugThrew = false;
try {
  await import('./_harness/a21Phase.missing-slugs.js');
} catch (e) {
  missingSlugThrew = /missing: /.test(e.message) && /pronouns-accusative-dative/.test(e.message);
}
check('import throws, naming the missing a2.1 slugs, when they are absent', missingSlugThrew);
let missingWritingThrew = false;
try {
  await import('./_harness/a21Phase.missing-writing.js');
} catch (e) {
  missingWritingThrew = /goethe_a2 writing tasks/.test(e.message);
}
check('import throws when the 4 goethe_a2 writing tasks are absent', missingWritingThrew);

// --- 28 days, 4 weeks ----------------------------------------------------
check('4 weeks', PROGRAM.weeks.length === 4);
const totalDays = PROGRAM.weeks.reduce((s, w) => s + w.days.length, 0);
check('28 days total', totalDays === 28);
const labels = PROGRAM.weeks.flatMap((w) => w.days.map((d) => d.label));
check('labels Tag 1..Tag 28 in order', labels.every((l, i) => l.startsWith(`Tag ${i + 1}`)));
const dayIndexByLabel = new Map(labels.map((l, i) => [l, i + 1]));

// --- minutes + item count per day ----------------------------------------
const outOfRange = [];
const badItemCount = [];
for (const w of PROGRAM.weeks) {
  for (const d of w.days) {
    const min = d.items.reduce((s, i) => s + i.minutes, 0);
    const isBuffer = d.label.includes('Puffertag');
    const lo = isBuffer ? 0 : 55;
    const hi = isBuffer ? 40 : 75;
    if (min < lo || min > hi) outOfRange.push([d.label, min]);
    if (d.items.length < 2 || d.items.length > 4) badItemCount.push([d.label, d.items.length]);
    console.log(d.label, 'min=' + min, 'n=' + d.items.length, d.items.map((i) => i.type + ':' + i.id).join(', '));
  }
}
check('every day within its minute band (55-75, Puffertage <=40)', outOfRange.length === 0);
console.log('out-of-range days', outOfRange);
check('every day carries 2-4 items', badItemCount.length === 0);
console.log('bad item counts', badItemCount);
check('exactly 2 Puffertage (Tag 14, Tag 27)', labels.filter((l) => l.includes('Puffertag')).length === 2);
check('PROGRAM_MINUTES in 1700-1900', PROGRAM_MINUTES >= 1700 && PROGRAM_MINUTES <= 1900);
check('PROGRAM_HOURS is the rounded hour equivalent', PROGRAM_HOURS === Math.round(PROGRAM_MINUTES / 60));

// --- ids unique / allItemIds matches item count --------------------------
const ids = allItemIds();
const allItems = PROGRAM.weeks.flatMap((w) => w.days.flatMap((d) => d.items));
check('ids unique', new Set(ids).size === ids.length);
check('allItemIds length === item count', ids.length === allItems.length);
console.log('item count', allItems.length);
check('every item has id, type, title, minutes, href', allItems.every((i) => i.id && i.type && i.title && typeof i.minutes === 'number' && i.href));

// --- href trailing-slash classes + external ------------------------------
const hrefViolations = [];
for (const it of allItems) {
  const h = it.href;
  const shouldSlashExternal =
    /^\/grammar\/a2\.1\/[a-z0-9-]+\/$/.test(h) || h === '/grammar/a2.1/' || h === '/leitfaden/goethe-a2/';
  const shouldSlashHub = h === '/speaking/' || h === '/analyze/';
  const shouldNoSlash =
    h === '/vocabulary' ||
    h === '/reading/a2.1' ||
    /^\/listening\/a2\.1\/[1-6]$/.test(h) ||
    h === '/schreiben/goethe-a2' ||
    h === '/modelltest/abschlusstest-a2-1' ||
    h === '/level/a2.2';
  if (shouldSlashExternal) {
    if (!h.endsWith('/')) hrefViolations.push(`${it.id}: ${h} should end in / (Astro)`);
    if (it.external !== true) hrefViolations.push(`${it.id}: ${h} should carry external:true`);
  } else if (shouldSlashHub) {
    if (!h.endsWith('/')) hrefViolations.push(`${it.id}: ${h} should end in / (prerendered hub)`);
    if (it.external) hrefViolations.push(`${it.id}: ${h} should NOT carry external (SPA hub)`);
  } else if (shouldNoSlash) {
    if (h.endsWith('/')) hrefViolations.push(`${it.id}: ${h} should NOT end in / (SPA route)`);
    if (it.external) hrefViolations.push(`${it.id}: ${h} should NOT carry external (SPA route)`);
  } else {
    hrefViolations.push(`${it.id}: ${h} unrecognised href — not in any known class`);
  }
}
check('every href matches its trailing-slash class + external flag', hrefViolations.length === 0);
console.log('href violations', hrefViolations);

// --- grammar hrefs resolve; every a2.1 slug used exactly once as a lesson -
const slugs = new Set(getTopicsForLevel('a2.1').map((t) => t.slug));
check('the real grammarTopics.js carries all 12 a2.1 topics', slugs.size === 12);
const grammarHrefRe = /^\/grammar\/a2\.1\/([a-z0-9-]+)\/$/;
const badHrefs = [];
const lessonSlugCounts = new Map();
const lessonsWithoutGrammarHref = [];
for (const it of allItems) {
  const m = it.href.match(grammarHrefRe);
  if (m && !slugs.has(m[1])) badHrefs.push(it.href);
  if (it.type === 'lesson') {
    if (!m) lessonsWithoutGrammarHref.push(it.id);
    else lessonSlugCounts.set(m[1], (lessonSlugCounts.get(m[1]) || 0) + 1);
  }
}
check('no bad grammar hrefs', badHrefs.length === 0);
check('every lesson item has a grammar href', lessonsWithoutGrammarHref.length === 0);
const REQUIRED_SLUGS = [
  'dative-case', 'prepositions-dative', 'two-way-prepositions', 'possessive-pronouns',
  'pronouns-accusative-dative', 'separable-verbs', 'perfect-tense-haben', 'perfect-tense-sein',
  'modal-verbs-past', 'imperative-mood', 'temporal-prepositions', 'adjective-endings-intro',
];
check('exactly 12 distinct lesson slugs used', lessonSlugCounts.size === 12);
check('every required slug used exactly once as a lesson', REQUIRED_SLUGS.every((s) => lessonSlugCounts.get(s) === 1));
check('lesson titles are the topics\' own titleDe', allItems.filter((i) => i.type === 'lesson').every((i) => {
  const slug = i.href.match(grammarHrefRe)[1];
  return i.title === getTopicsForLevel('a2.1').find((t) => t.slug === slug).titleDe;
}));
check('lesson minutes come from estimatedTime', allItems.filter((i) => i.type === 'lesson').every((i) => {
  const slug = i.href.match(grammarHrefRe)[1];
  return i.minutes === getTopicsForLevel('a2.1').find((t) => t.slug === slug).estimatedTime;
}));

// --- day maps -------------------------------------------------------------
const lessonDay = new Map();
const reviewDay = new Map();
const uebungDay = new Map();
const speakingDaysByOrder = new Map();
for (const w of PROGRAM.weeks) {
  for (const d of w.days) {
    const tag = dayIndexByLabel.get(d.label);
    for (const it of d.items) {
      if (it.type === 'lesson') lessonDay.set(it.id.slice('a2.1-'.length), tag);
      if (it.id.startsWith('review-')) reviewDay.set(it.id.slice('review-'.length), tag);
      if (it.id.startsWith('uebung-')) uebungDay.set(it.id.slice('uebung-'.length), tag);
    }
  }
}

// --- finding 1 (round 1 blocking): no day repeats an href ---------------
const sameDayDuplicateHrefs = [];
for (const w of PROGRAM.weeks) {
  for (const d of w.days) {
    const seen = new Map();
    for (const it of d.items) {
      if (seen.has(it.href)) sameDayDuplicateHrefs.push(`${d.label}: ${seen.get(it.href)} + ${it.id} both link ${it.href}`);
      seen.set(it.href, it.id);
    }
  }
}
console.log('same-day duplicate hrefs', sameDayDuplicateHrefs);
check('no two items on one day share an href', sameDayDuplicateHrefs.length === 0);

// --- review gap 1-2 days per lesson --------------------------------------
const gapViolations = [];
for (const slug of REQUIRED_SLUGS) {
  const l = lessonDay.get(slug);
  const r = reviewDay.get(slug);
  const gap = r != null && l != null ? r - l : null;
  console.log('gap', slug, 'lesson=' + l, 'review=' + r, 'gap=' + gap);
  if (gap == null || gap < 1 || gap > 2) gapViolations.push(slug);
}
check('every lesson reviewed within 1-2 days', gapViolations.length === 0);
check('exactly 12 Wiederholen items', [...reviewDay.keys()].length === 12);

// --- the four NEW topics: uebung + X-Ray on lesson day + 1 ----------------
const NEW_SLUGS = ['pronouns-accusative-dative', 'modal-verbs-past', 'temporal-prepositions', 'adjective-endings-intro'];
const OLD_SLUGS = REQUIRED_SLUGS.filter((s) => !NEW_SLUGS.includes(s));
check('exactly 4 Übungen items', uebungDay.size === 4);
check('Übungen items exist only for the 4 new topics', NEW_SLUGS.every((s) => uebungDay.has(s)) && OLD_SLUGS.every((s) => !uebungDay.has(s)));
const uebungViolations = NEW_SLUGS.filter((s) => uebungDay.get(s) !== lessonDay.get(s) + 1);
console.log('new-topic production days', NEW_SLUGS.map((s) => `${s}: lesson=${lessonDay.get(s)} uebung=${uebungDay.get(s)}`));
check('every new topic\'s Übungen item lands on its lesson day + 1', uebungViolations.length === 0);
const xrayDays = new Set();
for (const w of PROGRAM.weeks) for (const d of w.days) for (const it of d.items) if (it.type === 'xray') xrayDays.add(dayIndexByLabel.get(d.label));
check('every new topic\'s production day also carries an X-Ray item', NEW_SLUGS.every((s) => xrayDays.has(lessonDay.get(s) + 1)));

// --- speaking: 8 missions, each once, on its prereq lesson day + 1 --------
const A21_MISSIONS = [
  { order: 1, titleDe: 'Ein Paket verschicken', prereqSlug: 'dative-case' },
  { order: 2, titleDe: 'Der Weg zur Arbeit', prereqSlug: 'prepositions-dative' },
  { order: 3, titleDe: 'Der Umzugstag', prereqSlug: 'two-way-prepositions' },
  { order: 4, titleDe: 'Im Fundbüro', prereqSlug: 'possessive-pronouns' },
  { order: 5, titleDe: 'Mein Tagesablauf', prereqSlug: 'separable-verbs' },
  { order: 6, titleDe: 'Mein Wochenende', prereqSlug: 'perfect-tense-haben' },
  { order: 7, titleDe: 'Zurück von der Reise', prereqSlug: 'perfect-tense-sein' },
  { order: 8, titleDe: 'Den Weg zur Wohnung erklären', prereqSlug: 'imperative-mood' },
];
for (const w of PROGRAM.weeks) {
  for (const d of w.days) {
    const tag = dayIndexByLabel.get(d.label);
    for (const it of d.items) {
      if (it.type !== 'speaking') continue;
      const m = A21_MISSIONS.find((mm) => it.title.includes(mm.titleDe));
      if (m) speakingDaysByOrder.set(m.order, [...(speakingDaysByOrder.get(m.order) || []), tag]);
    }
  }
}
const speakingItems = allItems.filter((i) => i.type === 'speaking');
check('exactly 8 speaking items', speakingItems.length === 8);
check('all 8 missions matched by title, each exactly once', speakingDaysByOrder.size === 8 && [...speakingDaysByOrder.values()].every((v) => v.length === 1));
const prereqViolations = [];
for (const m of A21_MISSIONS) {
  const day = (speakingDaysByOrder.get(m.order) || [])[0];
  const lday = lessonDay.get(m.prereqSlug);
  console.log('mission', m.order, m.titleDe, 'day=' + day, 'lesson day=' + lday);
  if (day == null || lday == null || day !== lday + 1) prereqViolations.push(m.order);
}
check('every mission lands on its prereq lesson day + 1', prereqViolations.length === 0);
check('every speaking title uses the single Mission frame', speakingItems.every((i) => /^Sprechen: Mission „.+“$/.test(i.title)));
check('no doubled "Sprechen" in a speaking title', speakingItems.every((i) => (i.title.match(/Sprechen/g) || []).length === 1));
check('no mission title is used for a second, repeat item', new Set(speakingItems.map((i) => i.title)).size === 8);

// --- listening: 6 first pass + 6 dictation, >=3 per week ------------------
const listeningItems = allItems.filter((i) => i.type === 'listening');
check('exactly 12 listening items', listeningItems.length === 12);
const firstPass = listeningItems.filter((i) => !i.title.includes('noch einmal'));
const reusePass = listeningItems.filter((i) => i.title.includes('noch einmal'));
check('6 first-pass + 6 dictation listening items', firstPass.length === 6 && reusePass.length === 6);
const numOf = (i) => Number(i.href.split('/').pop());
check('first pass covers exercises 1-6 exactly once', JSON.stringify(firstPass.map(numOf).sort((a, b) => a - b)) === JSON.stringify([1, 2, 3, 4, 5, 6]));
check('dictation pass covers exercises 1-6 exactly once', JSON.stringify(reusePass.map(numOf).sort((a, b) => a - b)) === JSON.stringify([1, 2, 3, 4, 5, 6]));
check('all 12 listening titles distinct', new Set(listeningItems.map((i) => i.title)).size === 12);
const LIVE_LISTENING_TITLES = ['Beim Arzt (erweitert)', 'Im Restaurant bestellen', 'Reisen und Verkehrsmittel', 'Termine und Verabredungen', 'Einkaufen im Alltag', 'Nachrichten und Durchsagen'];
check('every listening title names its real exercise', listeningItems.every((i) => i.title.includes(LIVE_LISTENING_TITLES[numOf(i) - 1])));
const weekListeningCounts = PROGRAM.weeks.map((w) => w.days.reduce((s, d) => s + d.items.filter((i) => i.type === 'listening').length, 0));
console.log('listening per week', weekListeningCounts);
check('>=3 Hören per week, every week', weekListeningCounts.every((n) => n >= 3));

// --- reading: exactly 10, numbered 1..10, exam formats before Tag 26 -----
const readingItems = allItems.filter((i) => i.type === 'reading');
check('exactly 10 reading items', readingItems.length === 10);
check('reading titles number against 10', readingItems.every((i) => / von 10\b/.test(i.title)));
const readingNums = readingItems.map((i) => Number(i.title.match(/Text (\d+) von 10/)[1])).sort((a, b) => a - b);
check('reading texts 1-10 each used once', JSON.stringify(readingNums) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
const LIVE_READING_TITLES = ['Meine Reise nach Wien', 'Beim Arzt', 'Mein Beruf als Softwareentwickler', 'Unterwegs in der Stadt', 'Ein Abend im Restaurant', 'Ein Umzug nach Hamburg', 'Der Sportverein', 'Ein Besuch auf dem Wochenmarkt'];
check('texts 1-8 name the live reading lessons', readingItems.filter((i) => Number(i.title.match(/Text (\d+)/)[1]) <= 8).every((i) => i.title.includes(LIVE_READING_TITLES[Number(i.title.match(/Text (\d+)/)[1]) - 1])));
check('no "Lesen: … Lesen Teil" stutter in reading titles', readingItems.every((i) => (i.title.match(/Lesen/g) || []).length === 1));
const examReadingDays = [];
for (const w of PROGRAM.weeks) {
  for (const d of w.days) {
    for (const it of d.items) {
      if (it.type === 'reading' && /Teil [13]: /.test(it.title)) examReadingDays.push(dayIndexByLabel.get(d.label));
    }
  }
}
console.log('exam-format reading days', examReadingDays);
check('both exam-format readings present, before Tag 26', examReadingDays.length === 2 && examReadingDays.every((t) => t < 26));

// --- writing: 2 SMS (weeks 2-3) + 2 E-Mail (weeks 3-4) -------------------
const writingByWeek = [];
const writingItems = [];
PROGRAM.weeks.forEach((w, wi) => {
  for (const d of w.days) {
    for (const it of d.items) {
      if (it.href === '/schreiben/goethe-a2') {
        writingItems.push(it);
        writingByWeek.push([wi + 1, it.title]);
      }
    }
  }
});
console.log('writing items by week', writingByWeek);
check('exactly 4 writing items', writingItems.length === 4);
const smsItems = writingItems.filter((i) => i.title.startsWith('Schreiben: SMS (Teil 1)'));
const emailItems = writingItems.filter((i) => i.title.startsWith('Schreiben: E-Mail (Teil 2)'));
check('2 SMS + 2 E-Mail writing items', smsItems.length === 2 && emailItems.length === 2);
check('SMS practice sits in Woche 2 and Woche 3', JSON.stringify(writingByWeek.filter(([, t]) => t.includes('SMS')).map(([w]) => w).sort()) === JSON.stringify([2, 3]));
check('E-Mail practice sits in Woche 3 and Woche 4', JSON.stringify(writingByWeek.filter(([, t]) => t.includes('E-Mail')).map(([w]) => w).sort()) === JSON.stringify([3, 4]));
check('4 distinct writing titles', new Set(writingItems.map((i) => i.title)).size === 4);
const bankTitles = writingTasksForExam('goethe_a2').map((t) => t.title.replace(/^(SMS|E-Mail|Nachricht):\s*/, ''));
check('every writing title contains a real (short) task title', writingItems.every((i) => bankTitles.some((t) => i.title.includes(t))));
check('no "SMS:"/"E-Mail:" stutter in writing titles', writingItems.every((i) => (i.title.match(/SMS/g) || []).length <= 1 && (i.title.match(/E-Mail/g) || []).length <= 1));

// --- exam items, orientation, SRS, hand-off -------------------------------
const courseTestItems = allItems.filter((i) => i.href === '/modelltest/abschlusstest-a2-1');
check('exactly 2 course-test items (Probe + gewertet)', courseTestItems.length === 2);
const courseTestDays = [];
for (const w of PROGRAM.weeks) for (const d of w.days) for (const it of d.items) if (it.href === '/modelltest/abschlusstest-a2-1') courseTestDays.push(dayIndexByLabel.get(d.label));
check('Probe on Tag 26, gewerteter Test on Tag 28', JSON.stringify(courseTestDays.sort((a, b) => a - b)) === JSON.stringify([26, 28]));
check('exactly 1 Prüfungsüberblick, on Tag 1', allItems.filter((i) => i.href === '/leitfaden/goethe-a2/').length === 1 && PROGRAM.weeks[0].days[0].items.some((i) => i.href === '/leitfaden/goethe-a2/'));
const handoff = allItems.filter((i) => i.href === '/level/a2.2');
const day28 = PROGRAM.weeks[3].days[6];
check('exactly 1 hand-off item "Weiter: A2.2" on Tag 28', handoff.length === 1 && handoff[0].title === 'Weiter: A2.2' && day28.items.includes(handoff[0]));
check('no invented A2.2 course route anywhere', !JSON.stringify(PROGRAM).includes('a2-2-phase'));
const srsItems = allItems.filter((i) => i.href === '/vocabulary');
check('exactly 4 SRS items, one per week', srsItems.length === 4 && PROGRAM.weeks.every((w) => w.days.some((d) => d.items.some((i) => i.href === '/vocabulary'))));

// --- only styled types ----------------------------------------------------
const STYLED_TYPES = new Set(['lesson', 'listening', 'reading', 'speaking', 'xray', 'exam', 'review']);
check('every item uses a styled type', allItems.every((i) => STYLED_TYPES.has(i.type)));

// --- Tag 1 first win ------------------------------------------------------
const day1 = PROGRAM.weeks[0].days[0];
check('Tag 1 starts with a lesson, then a <=5-minute X-Ray', day1.items[0].type === 'lesson' && day1.items[1].type === 'xray' && day1.items[1].minutes <= 5);

// --- finding 2 (round 1 blocking): title-frame hygiene -------------------
const FRAME_WORDS = ['Sprechen', 'Lesen', 'Hören', 'Schreiben', 'Wiederhol', 'Übung', 'Üben', 'Mission', 'X-Ray', 'Diktat', 'SMS', 'E-Mail', 'Mitteilung', 'Abschlusstest'];
const frameRepeats = [];
const doubleColons = [];
for (const it of allItems) {
  for (const wrd of FRAME_WORDS) {
    const n = (it.title.match(new RegExp(wrd, 'g')) || []).length;
    if (n > 1) frameRepeats.push(`${it.id}: "${wrd}" ×${n} in "${it.title}"`);
  }
  if ((it.title.match(/:/g) || []).length > 1) doubleColons.push(`${it.id}: ${it.title}`);
}
console.log('frame-word repeats', frameRepeats);
console.log('titles with more than one colon', doubleColons);
check('no title repeats a frame word', frameRepeats.length === 0);
check('no title carries more than one colon', doubleColons.length === 0);
const xrayTitles = allItems.filter((i) => i.type === 'xray').map((i) => i.title);
check('all 17 X-Ray titles are distinct and specific', xrayTitles.length === 17 && new Set(xrayTitles).size === 17);
check('no generic "fünf Sätze aus dieser Woche" X-Ray title survives', !xrayTitles.some((t) => /aus dieser Woche/.test(t)));
// round-3: a derived title must not stack two coordinators ("Possessivpronomen
// und Pronomen im Akkusativ und Dativ") — the frame uses a comma instead.
const doubledUnd = allItems.filter((i) => (i.title.match(/\bund\b/g) || []).length > 1).map((i) => `${i.id}: ${i.title}`);
console.log('titles with two "und"', doubledUnd);
check('no title stacks two "und"', doubledUnd.length === 0);

// --- finding 7b: the intros' countable claims match the weeks ------------
const GERMAN_NUMERALS = { eine: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6 };
const claimMismatches = [];
PROGRAM.weeks.forEach((w, wi) => {
  const speakingInWeek = w.days.reduce((s, d) => s + d.items.filter((i) => i.type === 'speaking').length, 0);
  const m = w.intro.match(/(eine|zwei|drei|vier|fünf|sechs) Sprechmissionen?/i);
  if (m) {
    const claimed = GERMAN_NUMERALS[m[1].toLowerCase()];
    if (claimed !== speakingInWeek) claimMismatches.push(`Woche ${wi + 1}: intro claims ${claimed} Sprechmissionen, week has ${speakingInWeek}`);
  }
});
const weekOfFirst = (pred) => PROGRAM.weeks.findIndex((w) => w.days.some((d) => d.items.some(pred))) + 1;
const firstSmsWeek = weekOfFirst((i) => i.title.includes('SMS (Teil 1)'));
const firstEmailWeek = weekOfFirst((i) => i.title.includes('E-Mail (Teil 2)'));
PROGRAM.weeks.forEach((w, wi) => {
  if (/erste SMS/i.test(w.intro) && wi + 1 !== firstSmsWeek) claimMismatches.push(`Woche ${wi + 1} claims the first SMS task; it is in Woche ${firstSmsWeek}`);
  if (/erste E-Mail/i.test(w.intro) && wi + 1 !== firstEmailWeek) claimMismatches.push(`Woche ${wi + 1} claims the first E-Mail task; it is in Woche ${firstEmailWeek}`);
});
console.log('intro claim mismatches', claimMismatches);
check('every countable claim in a week intro matches that week', claimMismatches.length === 0);

// --- German register / claims --------------------------------------------
const introTexts = PROGRAM.weeks.map((w) => w.intro);
const titleTexts = [...allItems.map((i) => i.title), ...PROGRAM.weeks.map((w) => w.title)];
const learnerText = [...introTexts, PROGRAM.subtitle, ...titleTexts];
const words = (s) => s.split(/\s+/).map((t) => t.replace(/^[^\wÄÖÜäöüß]+|[^\wÄÖÜäöüß]+$/g, '')).filter(Boolean);
const sentences = (s) => s.trim().split(/\.(?:\s+|$)/).map((x) => x.trim()).filter(Boolean);
const sentenceCounts = introTexts.map((t) => sentences(t).length);
console.log('sentences per intro', sentenceCounts);
check('every week intro is exactly 2 sentences', sentenceCounts.every((n) => n === 2));
const longSentences = [];
for (const t of [...introTexts, PROGRAM.subtitle]) for (const s of sentences(t)) if (words(s).length > 14) longSentences.push([words(s).length, s]);
console.log('sentences over 14 words', longSentences);
check('every intro/subtitle sentence is <=14 words', longSentences.length === 0);
const longTitles = titleTexts.filter((t) => words(t).length > 14);
console.log('titles over 14 words', longTitles);
check('every title is <=14 words', longTitles.length === 0);
const allText = learnerText.join(' | ');
check('no English inside the German copy', !/\b(the|and|your|week|lesson|review)\b/i.test(allText));
check('no "Feedback" in rendered copy', !allText.includes('Feedback'));
check('no outcome promise', !/garantiert|sicher bestehen|100 ?%|du bestehst/i.test(allText));
check('no "<level> in X Wochen" claim shape', !/A2(\.\d)? in \d+ Wochen/.test(allText));
check('no Nebensatz conjunction in learner copy (A2.2 grammar)', !/\b(weil|dass|wenn|obwohl|damit)\b/i.test(allText));
check('no Futur "werde/wirst" in learner copy', !/\b(werde|wirst|werden)\b/i.test(allText));
check('no reflexive production in learner copy', !/\bsich\b|\bdich\b\s+(an|vor)/i.test(allText));
check('no Komparativ/Superlativ marker in learner copy', !/\b\w+er als\b|\bam (besten|meisten|schnellsten)\b/i.test(allText));
check('no Genitiv article in learner copy', !/\b(des|eines)\s+[A-ZÄÖÜ]/.test(allText));
check('no Superlativ in learner copy (banned at A2.1)', !/\b\w{3,}sten\b/i.test(allText));
check('no Genitiv "der Lektion" phrasing', !/Übungen der Lektion/.test(allText));
// regression pins for the register forms removed during the self-check:
// superlatives, null-article adjective endings (taught only from Tag 24) and
// the "halbe Länge" claim the course test's own title does not make.
check('none of the removed register forms reappear in AUTHORED copy', !/(schwächsten|bisherigen|letztes Aufwärmen|erster Satz|sofortige|halbe Länge|Die erste Phase|A2-Band|trennbaren Verben|Üben:)/.test(allText));
check('du-form, never ihr/Sie, in the intros', introTexts.every((t) => !/\bihr\b|\bSie\b/.test(t)));

console.log('\n=== SUMMARY ===');
console.log(failures.length === 0 ? 'ALL CHECKS PASSED — 0 failures' : `FAILURES (${failures.length}): ` + failures.join(' | '));
process.exit(failures.length === 0 ? 0 : 1);
