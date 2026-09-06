#!/usr/bin/env node
// verify.mjs — mirrors, by hand, the checks that tests/guides.test.mjs and
// tests/exams.test.mjs will run against these artefacts once they are merged,
// plus the A2.1 level constraint on the learner-facing writing tasks.
//
// Why a standalone script: goethe-a2.js imports `../marketing.js`, which
// resolves correctly ONLY from astro-site/src/data/guides/. From this scratch
// folder it does not resolve, so the script materialises a throwaway module
// tree in os.tmpdir() — guides/goethe-a2.js beside a marketing.js that
// re-exports the repo's real one (read-only) — and imports from there. The
// repo itself is never written to.
//
//   node verify.mjs            # exits 0 when clean, 1 with a numbered list
//
// The regexes and numeric bands below are COPIED from the repo tests, not
// re-invented: TITLE_SOFT_MAX 60, DESC 50–160, answer 45–120 words, the OUTCOME
// and FEE regexes, section-id uniqueness/anchor-safety, and the three
// trailing-slash cases. The one addition is `/level/` in NO_SLASH_ROUTES —
// see notes.md: the repo test does not know that prefix yet and must learn it
// in the same PR, so this script asserts the shape the guide actually needs.

import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = '/home/user/deutschmeister';
const REPO_MARKETING = resolve(REPO, 'astro-site/src/data/marketing.js');

const failures = [];
const fail = (msg) => failures.push(msg);
const ok = (cond, msg) => { if (!cond) fail(msg); };

// ── load goethe-a2.js through a temp tree so ../marketing.js resolves ────────
const tmp = mkdtempSync(join(tmpdir(), 'wave4-exam-'));
mkdirSync(join(tmp, 'guides'));
copyFileSync(join(HERE, 'goethe-a2.js'), join(tmp, 'guides', 'goethe-a2.js'));
writeFileSync(
  join(tmp, 'marketing.js'),
  `export * from ${JSON.stringify(pathToFileURL(REPO_MARKETING).href)};\n`,
  'utf8'
);

let guide;
let goetheA2WritingTasks;
let goetheA2Track;
let goetheA2HubCopy;
try {
  ({ goetheA2: guide } = await import(pathToFileURL(join(tmp, 'guides', 'goethe-a2.js')).href));
  ({ goetheA2WritingTasks } = await import(pathToFileURL(join(HERE, 'writingTasks.goethe-a2.js')).href));
  ({ goetheA2Track } = await import(pathToFileURL(join(HERE, 'examTracks.entry.js')).href));
  ({ goetheA2HubCopy } = await import(pathToFileURL(join(HERE, 'hub-copy.js')).href));
} finally {
  // keep the tmp tree until after the import resolves, then drop it
  process.on('exit', () => rmSync(tmp, { recursive: true, force: true }));
}

// ── 1. guide: title / description / uniqueness against the live registry ────
const TITLE_SOFT_MAX = 60;
const DESC_MIN = 50;
const DESC_MAX = 160;

ok(guide.slug === 'goethe-a2', `slug is "${guide.slug}", expected goethe-a2`);
ok(/^[a-z0-9-]+$/.test(guide.slug), `slug "${guide.slug}" is not URL-safe lowercase`);
ok(
  guide.title.length <= TITLE_SOFT_MAX,
  `title is ${guide.title.length} chars (max ${TITLE_SOFT_MAX})`
);
ok(
  guide.description.length >= DESC_MIN && guide.description.length <= DESC_MAX,
  `description is ${guide.description.length} chars (want ${DESC_MIN}-${DESC_MAX})`
);

// No two guides may share a title or description (check-built-html fails the
// build on duplicates in dist/). Compare against every guide already shipped.
const guidesDir = resolve(REPO, 'astro-site/src/data/guides');
const registrySrc = readFileSync(join(guidesDir, 'index.js'), 'utf8');
const existingSlugs = [...registrySrc.matchAll(/from '\.\/([a-z0-9-]+)\.js'/g)].map((m) => m[1]);
ok(existingSlugs.length >= 5, `only ${existingSlugs.length} guides discovered in index.js — matcher broke?`);
ok(!existingSlugs.includes(guide.slug), `slug ${guide.slug} already exists in the registry`);
for (const slug of existingSlugs) {
  const src = readFileSync(join(guidesDir, `${slug}.js`), 'utf8');
  if (src.includes(guide.title)) fail(`title collides with the existing guide ${slug}`);
  if (src.includes(guide.description)) fail(`description collides with the existing guide ${slug}`);
}

// ── 2. substance: sections, faq, reading time, lead, cta ────────────────────
ok(guide.sections.length >= 4, `only ${guide.sections.length} sections (min 4)`);
ok(guide.faq.length >= 6, `only ${guide.faq.length} FAQ entries (brief requires >= 6)`);
ok(Boolean(guide.lead), 'missing lead');
ok(Boolean(guide.cta?.heading) && Boolean(guide.cta?.body), 'missing cta heading/body');

// guideReadingMinutes, reimplemented from guides/index.js (>= 5 required)
function blockText(b) {
  switch (b.type) {
    case 'p': case 'h3': case 'callout': return [b.text];
    case 'list': return b.items;
    case 'table': return [...b.head, ...b.rows.flat()];
    case 'steps': return b.items.flatMap((i) => [i.title, ...i.tasks, i.tip || '']);
    case 'warnings': return b.items.flatMap((i) => [i.title, i.body]);
    case 'cards': return b.items.flatMap((i) => [i.title, i.body]);
    default: return [];
  }
}
const KNOWN_BLOCKS = new Set(['p', 'h3', 'list', 'callout', 'table', 'steps', 'warnings', 'cards']);
for (const s of guide.sections) {
  for (const b of s.blocks) {
    if (!KNOWN_BLOCKS.has(b.type)) fail(`section ${s.id}: unknown block type "${b.type}"`);
  }
}
const readingText = [
  guide.lead,
  ...guide.sections.flatMap((s) => [s.heading, ...s.blocks.flatMap(blockText)]),
  ...guide.faq.flatMap((f) => [f.q, f.a]),
].join(' ');
const readingMinutes = Math.max(3, Math.round(readingText.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 200));
ok(readingMinutes >= 5, `reads in ${readingMinutes} minutes (min 5)`);

// ── 3. the definition-first answer ──────────────────────────────────────────
const answerWords = guide.answer.trim().split(/\s+/).length;
ok(answerWords >= 45 && answerWords <= 120, `answer is ${answerWords} words (want 45-120)`);
ok(!/<[a-z]/i.test(guide.answer), 'answer contains markup; it is rendered as text');
// The answer must restate only figures that also appear in sections.
const sectionBlob = JSON.stringify(guide.sections) + JSON.stringify(guide.faq);
for (const fig of guide.answer.match(/\d+(?:[.,]\d+)?/g) || []) {
  if (!sectionBlob.includes(fig)) fail(`answer introduces the figure "${fig}", which appears in no section`);
}

// ── 4. section ids: unique, anchor-safe, and the ids the brief names ────────
const ids = guide.sections.map((s) => s.id);
ok(new Set(ids).size === ids.length, 'duplicate section id');
for (const id of ids) ok(/^[a-z0-9-]+$/.test(id), `section id "${id}" is not anchor-safe`);
for (const required of ['ueberblick', 'aufbau', 'punkte', 'anmeldung', 'lernplan', 'fehler', 'vorbereitung-mit-deutschmeister']) {
  ok(ids.includes(required), `missing the section id "${required}" required by the brief`);
}
// The aufbau table must carry the four documented columns.
const aufbau = guide.sections.find((s) => s.id === 'aufbau');
const table = aufbau?.blocks.find((b) => b.type === 'table');
ok(Boolean(table), 'the aufbau section has no table block');
if (table) {
  ok(
    JSON.stringify(table.head) === JSON.stringify(['Teil', 'Dauer', 'Aufgaben', 'Punkte']),
    `aufbau table head is ${JSON.stringify(table.head)}, expected Teil | Dauer | Aufgaben | Punkte`
  );
  ok(table.rows.length === 4, `aufbau table has ${table.rows.length} rows, expected 4`);
}

// ── 5. dates + sources ─────────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
for (const field of ['datePublished', 'factsCheckedOn']) {
  const value = guide[field];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) fail(`${field} "${value}" is not YYYY-MM-DD`);
  else if (field === 'factsCheckedOn' && value > today) fail(`${field} "${value}" is in the future`);
}
// datePublished is fixed at '2026-09-06' by the brief. tests/guides.test.mjs
// bans dates in the FUTURE, so if the PR is opened before that day the repo
// suite will fail on it. That is a merge-timing condition, not a defect in this
// artefact, so it is reported as a WARNING here and recorded in notes.md.
const warnings = [];
if (guide.datePublished > today) {
  warnings.push(
    `datePublished ${guide.datePublished} is later than today (${today}). tests/guides.test.mjs ` +
    `rejects future dates — land the PR on or after ${guide.datePublished}, or move the date to the merge day.`
  );
}
ok(Array.isArray(guide.sources) && guide.sources.length > 0, 'no sources listed');
for (const s of guide.sources) {
  ok(Boolean(s.label), 'a source has no label');
  ok(/^https:\/\//.test(s.url), `source url "${s.url}" is not https`);
}

// ── 6. truth bans (regexes copied verbatim from the repo tests) ─────────────
const OUTCOME = /\b(garantiert bestehst|bestehst du garantiert|Bestehensgarantie|100\s?% Erfolg|sicher bestehen)\b/i;
const FEE = /\b\d{2,3}\s?(?:–|-|bis)\s?\d{2,3}\s?(?:Euro|€)\b/i;
const OFFICIAL = /(offiziell(e|es)? (telc|goethe|dtz|prüfungs))(?!.*kein)|original[- ]?(telc|goethe)[- ]?(aufgaben|material|prüfung)|von (telc|goethe) zertifiziert/i;

const guideBlob = JSON.stringify(guide);
ok(!OUTCOME.test(guideBlob), 'guide contains an outcome promise');
ok(!FEE.test(guideBlob), 'guide states an exam fee range');
ok(!/\bdu bestehst\b/i.test(guideBlob), 'guide says "du bestehst" (banned by the brief)');

// exams.test.mjs runs OUTCOME + OFFICIAL over examTracks.js and exams/index.js,
// so the two blocks destined for those files must survive both.
for (const [name, blob] of [
  ['examTracks.entry.js', readFileSync(join(HERE, 'examTracks.entry.js'), 'utf8')],
  ['hub-copy.js', readFileSync(join(HERE, 'hub-copy.js'), 'utf8')],
]) {
  ok(!OUTCOME.test(blob), `${name} contains an outcome promise`);
  ok(!OFFICIAL.test(blob), `${name} claims official material or affiliation`);
}

// ── 6b. round-2 regressions: every blocking finding gets a pin ─────────────
// Each check below exists because round 1 shipped the mistake it names.
const guideText = [
  guide.lead, guide.answer,
  ...guide.sections.flatMap((sec) => [sec.heading, ...sec.blocks.flatMap(blockText)]),
  ...guide.faq.flatMap((f) => [f.q, f.a]),
  guide.cta.heading, guide.cta.body,
].join(' \n ');

// B1 — the schriftliche Umrechnung is 20 Messpunkte, not 20 answers, and
// Schreiben/Sprechen are criterion-rated.
ok(/20\s*(?:<\/?strong>\s*)?Messpunkte/.test(guideText), 'the punkte section must say "20 Messpunkte", not "20 Antworten"');
ok(!/20 gezählte Antworten/.test(guideText), 'the "20 gezählte Antworten" wording is back');
ok(/nach Kriterien bewertet/.test(guideText), 'the guide must say Schreiben and Sprechen are criterion-rated');

// B2 — 16 is a RECOMMENDATION; the exams have no minimum age. Both statements
// must appear in the answer (which answer engines lift) and in the FAQ.
ok(/empfohlen|empfiehlt|empfohlen wird/i.test(guide.answer), 'the answer must present 16 as a recommendation');
ok(/kein Mindestalter|Mindestalter gibt es nicht/i.test(guide.answer), 'the answer must say there is no minimum age');
const ageFaq = guide.faq.find((f) => /Alter/i.test(f.q));
ok(Boolean(ageFaq), 'no FAQ entry about age');
if (ageFaq) {
  ok(!/^Ab welchem Alter/i.test(ageFaq.q), 'the age FAQ must not ask "Ab welchem Alter", which presupposes a bar');
  ok(/empfohlen/i.test(ageFaq.a), 'the age FAQ answer must present 16 as a recommendation');
  ok(/unabhängig vom Erreichen eines Mindestalters|Mindestalter gibt es (aber )?nicht/i.test(ageFaq.a), 'the age FAQ answer must state that there is no minimum age');
}
// No sentence may present the age as a bar.
for (const bar of [/für Teilnehmende ab 16 Jahren vorgesehen/i, /Erwachsene ab 16 Jahren\./i, /richtet sich an Teilnehmende <strong>ab 16/i]) {
  if (bar.test(guideText)) fail(`the age is stated as an eligibility bar: "${guideText.match(bar)[0]}"`);
}

// B3 — case after prepositions. `gegenüber` + dative was the actual defect;
// the sweep covers the dative-only and accusative-only prepositions the level
// file lists, in interrogative and article form.
const DATIVE_ONLY = ['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu', 'gegenüber'];
const ACC_ONLY = ['für', 'ohne', 'gegen', 'um', 'durch'];
for (const prep of DATIVE_ONLY) {
  const re = new RegExp(`\\b${prep}\\s+(wen|den|einen|ihn|dich|mich|jeden)\\b`, 'i');
  if (re.test(guideText)) fail(`accusative after the dative preposition "${prep}": "${guideText.match(re)[0]}"`);
}
for (const prep of ACC_ONLY) {
  const re = new RegExp(`\\b${prep}\\s+(wem|dem|einem|ihm|mir|dir)\\b`, 'i');
  if (re.test(guideText)) fail(`dative after the accusative preposition "${prep}": "${guideText.match(re)[0]}"`);
}

// B4 — no unsourced level claim about Ausbildung/Studium. If Studium is named
// at all, it must carry the DSH/TestDaF evidence, never a bare "B1 oder B2".
if (/Studium/i.test(guideText)) {
  ok(/DSH|TestDaF/.test(guideText), 'the Studium sentence must name the actual requirement (DSH-2 / TestDaF), not a guessed level');
  ok(!/Ausbildung oder ein Studium reicht A2 in aller Regel nicht/.test(guideText), 'the old unsourced Ausbildung/Studium sentence is back');
}

// Round-2 minors that are cheap to regress.
ok(!/gegenüber wen/i.test(guideText), '"gegenüber wen" is back in learner-facing text');
ok(!/an zwei Stellen/.test(guideText), '"an zwei Stellen" undercounts the places A2 is named in the AufenthG');
ok(/Englischkenntnisse auf Niveau B2|Englisch auf B2/.test(guideText), '§ 20a also accepts English B2 — the guide must say so');
ok(!/mehr als drei kleine Fehler/.test(guideText), 'the invented Bewertung arithmetic is back');
ok(!/deckt die Prüfung ab/.test(guideText), 'the Wortliste overclaim is back');
ok(/200 bis 350 Unterrichtseinheiten/.test(guideText), "Goethe's own 200–350 UE figure must anchor the Lernplan estimate");
ok(!/häufig Volkshochschulen/.test(guideText), 'the unsourced Volkshochschule claim is back');
ok(!/im Teil 4/.test(guideText), '"im Teil 4" — standard German is "in Teil 4"');
ok(!/den es nur einmal gibt/.test(guideText), 'Hören Teil 2 is PLAYED once; "den es nur einmal gibt" says it exists once');

// ── 6c. round-3 pins ──────────────────────────────────────────────────────
// Teilwiederholung scope: the DFB allows the oral OR the whole written exam,
// never one sub-test. Saying "einzelne Prüfungsteile" invites "Lesen allein".
if (/Wiederhol/i.test(guideText)) {
  ok(!/Wiederholung einzelner Prüfungsteile/.test(guideText), 'the guide must not say single Prüfungsteile can be repeated');
  ok(/gesamte schriftliche/.test(guideText), 'the Teilwiederholung sentence must name the oral OR the whole written exam');
}
// Sprechen has no Leitpunkte and no text: it needs its own criteria sentence.
ok(/Sprechen wird nach Kriterien bewertet/.test(guideText), 'Sprechen needs its own criteria sentence');
ok(!/Schreiben und Sprechen werden dagegen nach Kriterien bewertet/.test(guideText), 'the merged Schreiben+Sprechen criteria sentence is back — Sprechen has no Leitpunkte and no text');
// The Durchführungsbestimmungen citation must be the German-language path.
const dfb = guide.sources.find((src) => /Durchfuehrungsbestimmungen_A2/.test(src.url));
ok(Boolean(dfb), 'the Durchführungsbestimmungen source is missing');
if (dfb) ok(/\/prf\/de\//.test(dfb.url), `the DFB source must cite the /de/ path, not ${dfb.url}`);
// Leitpunkte are noun phrases, not instructions to the learner.
for (const t of goetheA2WritingTasks) {
  for (const lp of t.leitpunkte) {
    if (/^(Sag|Schreib|Frag|Nenn|Schlag|Bitte|Erklär|Bedank)\b/.test(lp)) {
      fail(`${t.taskKey}: Leitpunkt "${lp}" is an imperative — Goethe Leitpunkte are noun phrases`);
    }
  }
}

// ── 7. internal links: the three trailing-slash cases ──────────────────────
const SLASHED_PREFIXES = [
  '/grammar/', '/vergleich/', '/leitfaden/', '/pricing/', '/privacy/', '/impressum/',
  '/analyze/', '/pruefung/', '/level-test/', '/speaking/', '/podcasts/', '/listening/', '/reading/',
];
// '/level/…' is the SPA course area: a netlify.toml rewrite to /app.html, so NO
// trailing slash. tests/guides.test.mjs has no entry for it yet — see notes.md.
const NO_SLASH_ROUTES = ['/faq', '/ueber-uns', '/signup', '/login', '/dashboard', '/schreiben', '/modelltest'];
const NO_SLASH_PREFIXES = ['/level/'];

let linksSeen = 0;
for (const [, href] of guideBlob.matchAll(/href=\\"([^"\\]+)\\"/g)) {
  linksSeen += 1;
  if (href.startsWith('http')) {
    if (href.includes('deutsch-meister.de')) fail(`absolute self-link ${href}`);
    continue;
  }
  if (!href.startsWith('/')) { fail(`link "${href}" is neither absolute nor root-relative`); continue; }
  const path = href.split('#')[0];
  if (NO_SLASH_ROUTES.includes(path.replace(/\/$/, '')) || NO_SLASH_PREFIXES.some((p) => path.startsWith(p))) {
    if (path.endsWith('/')) fail(`${href} must NOT end with a slash`);
    continue;
  }
  if (SLASHED_PREFIXES.some((p) => path.startsWith(p))) {
    if (!path.endsWith('/')) fail(`${href} must end with a slash`);
    continue;
  }
  fail(`${href} matches no known route shape`);
}
ok(linksSeen > 0, 'no internal links were checked — did the matcher break?');
ok(guideBlob.includes('/level/a2.1'), 'the guide must link the A2.1 course area at /level/a2.1');
ok(guideBlob.includes('/grammar/a2.1/'), 'the guide must link the A2.1 grammar library at /grammar/a2.1/');

// ── 8. product counts are imported, never typed ────────────────────────────
const guideSrc = readFileSync(join(HERE, 'goethe-a2.js'), 'utf8');
ok(/from '\.\.\/marketing\.js'/.test(guideSrc), 'goethe-a2.js does not import ../marketing.js');
const { GRAMMAR_TOPIC_COUNT, LISTENING_EXERCISE_COUNT, READING_LESSON_COUNT } =
  await import(pathToFileURL(REPO_MARKETING).href);
for (const [name, value] of [
  ['GRAMMAR_TOPIC_COUNT', GRAMMAR_TOPIC_COUNT],
  ['LISTENING_EXERCISE_COUNT', LISTENING_EXERCISE_COUNT],
  ['READING_LESSON_COUNT', READING_LESSON_COUNT],
]) {
  ok(guideBlob.includes(String(value)), `${name} (${value}) does not appear in the rendered guide`);
  // The literal must not be typed in the source outside the interpolation.
  const typed = new RegExp(`[^{$\\w]${value}\\b`, 'g');
  const hits = (guideSrc.match(typed) || []).filter((h) => !h.includes('$'));
  if (hits.length > 0 && !guideSrc.includes(`\${${name}}`)) fail(`${name} looks typed rather than interpolated`);
}

// ── 9. the exam-track entry ────────────────────────────────────────────────
ok(goetheA2Track.key === 'goethe_a2', `track key is ${goetheA2Track.key}`);
ok(/^[a-z0-9_]+$/.test(goetheA2Track.key), 'track key is not machine-safe');
ok(goetheA2Track.slug === guide.slug, 'track slug must equal the guide slug');
ok(goetheA2Track.guideSlug === guide.slug, 'track guideSlug must equal the guide slug');
ok(goetheA2Track.nameDe === 'Goethe-Zertifikat A2', `nameDe is "${goetheA2Track.nameDe}"`);
ok(goetheA2Track.level === 'A2', `level is "${goetheA2Track.level}"`);
ok(JSON.stringify(goetheA2Track.sublevels) === JSON.stringify(['a2.1', 'a2.2']), 'sublevels must be ["a2.1","a2.2"]');
ok(goetheA2Track.courseHref === null, 'courseHref must be null until PR D2');
ok(goetheA2Track.hasMock === false, 'hasMock must be false — there is no MOCK_EXAMS.goethe_a2');
ok(goetheA2Track.hasWriting === true, 'hasWriting must be true — the writing tasks ship in this PR');
// The sublevels must exist in the SPA's level list, as tests/exams.test.mjs asserts.
const contentSrc = readFileSync(resolve(REPO, 'src/data/content.js'), 'utf8');
for (const sub of goetheA2Track.sublevels) {
  ok(contentSrc.includes(`'${sub}'`), `sublevel ${sub} is not listed in src/data/content.js`);
}
// The key must not already exist in the registry.
const tracksSrc = readFileSync(resolve(REPO, 'src/data/examTracks.js'), 'utf8');
ok(!tracksSrc.includes("'goethe_a2'"), 'goethe_a2 already exists in src/data/examTracks.js');

// ── 10. hub copy ───────────────────────────────────────────────────────────
ok(goetheA2HubCopy.title.length <= TITLE_SOFT_MAX, `hub title is ${goetheA2HubCopy.title.length} chars (max ${TITLE_SOFT_MAX})`);
ok(goetheA2HubCopy.title.endsWith('| DeutschMeister'), 'hub title must end with "| DeutschMeister"');
ok(
  goetheA2HubCopy.description.length >= DESC_MIN && goetheA2HubCopy.description.length <= DESC_MAX,
  `hub description is ${goetheA2HubCopy.description.length} chars (want ${DESC_MIN}-${DESC_MAX})`
);
for (const field of ['intro', 'focus']) {
  ok(Boolean(goetheA2HubCopy[field]), `hub copy is missing "${field}"`);
}
// Round 2: the house closing line, and positioning only — no exam facts, in
// figures OR in words (the module's own header forbids a second home for them).
ok(
  goetheA2HubCopy.description.endsWith('Einstufungstest kostenlos.'),
  'hub description must end with the house line "Einstufungstest kostenlos."'
);
const hubCopyText = [goetheA2HubCopy.intro, goetheA2HubCopy.focus].join(' ');
for (const [re, what] of [
  [/\b\d{2,3}\s*(?:von|\/)\s*\d{2,3}\b/, 'a points figure'],
  [/\b\d+\s*Minuten\b/i, 'a duration'],
  [/Paarprüfung/i, 'the Sprechen format'],
  [/nicht bestanden|bestanden ist/i, 'the pass mechanism'],
]) {
  if (re.test(hubCopyText)) fail(`hub intro/focus restates ${what} — that belongs in the guide only`);
}
const hubsSrc = readFileSync(resolve(REPO, 'astro-site/src/data/exams/index.js'), 'utf8');
ok(!hubsSrc.includes('goethe_a2:'), 'HUB_COPY.goethe_a2 already exists in the repo');
for (const existing of [...hubsSrc.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1])) {
  if (existing === goetheA2HubCopy.title) fail(`hub title collides with an existing hub: ${existing}`);
}

// ── 11. writing tasks ──────────────────────────────────────────────────────
const REGISTERS = new Set(['informell', 'halbformell', 'formell', 'formular']);
ok(goetheA2WritingTasks.length === 4, `expected 4 writing tasks, got ${goetheA2WritingTasks.length}`);
const taskKeys = new Set();
const existingTasksSrc = readFileSync(resolve(REPO, 'src/data/writingTasks.js'), 'utf8');
for (const t of goetheA2WritingTasks) {
  ok(t.examKey === 'goethe_a2', `${t.taskKey}: examKey is ${t.examKey}`);
  ok(/^[a-z0-9-]+$/.test(t.taskKey), `${t.taskKey}: taskKey is not slug-safe`);
  ok(!taskKeys.has(t.taskKey), `duplicate taskKey ${t.taskKey}`);
  taskKeys.add(t.taskKey);
  ok(!existingTasksSrc.includes(`taskKey: '${t.taskKey}'`), `${t.taskKey}: taskKey already used in the repo bank`);
  ok(REGISTERS.has(t.register), `${t.taskKey}: unknown register "${t.register}"`);
  ok(Number.isInteger(t.minWords) && Number.isInteger(t.maxWords) && t.minWords < t.maxWords, `${t.taskKey}: bad word band`);
  ok(t.leitpunkte.length === 3, `${t.taskKey}: ${t.leitpunkte.length} Leitpunkte, expected 3`);
  ok(Boolean(t.title) && Boolean(t.task), `${t.taskKey}: missing title or task`);
  ok(/45 von 75/.test(t.pointsNote) && /15 von 25/.test(t.pointsNote), `${t.taskKey}: pointsNote does not state the pass rule`);
  ok(/25 von 100 Punkten/.test(t.pointsNote), `${t.taskKey}: pointsNote does not state the Schreiben points`);
  // Round 2: the Teil 1 : Teil 2 split is not sourced anywhere — assert nothing.
  ok(!/gleich viel|jeweils 12,5|12,5 Punkte/.test(t.pointsNote), `${t.taskKey}: pointsNote asserts an unsourced Teil 1 : Teil 2 split`);
  // Round 2: a Leitpunkt that quotes direct speech must not contain a 2nd-person
  // pronoun — after the colon the addressee flips and the modelled sentence
  // means the opposite ("Sag Jonas: Der Dienstag passt DIR nicht").
  for (const lp of t.leitpunkte) {
    const quoted = lp.split(':')[1];
    if (quoted && /\b(dir|dich|du|dein\w*)\b/i.test(quoted)) {
      fail(`${t.taskKey}: Leitpunkt "${lp}" models direct speech containing a 2nd-person pronoun — it addresses the wrong person`);
    }
  }
  ok(!OUTCOME.test(JSON.stringify(t)) && !FEE.test(JSON.stringify(t)), `${t.taskKey}: outcome promise or fee`);
}
const teil1 = goetheA2WritingTasks.filter((t) => t.taskKey.startsWith('sms-'));
const teil2 = goetheA2WritingTasks.filter((t) => t.taskKey.startsWith('email-'));
ok(teil1.length === 2, `expected 2 Teil-1 (sms-…) tasks, got ${teil1.length}`);
ok(teil2.length === 2, `expected 2 Teil-2 (email-…) tasks, got ${teil2.length}`);
for (const t of teil1) {
  ok(t.register === 'informell', `${t.taskKey}: Teil 1 must be informell`);
  ok(t.minWords === 20 && t.maxWords === 40, `${t.taskKey}: Teil 1 band must be 20/40`);
  ok(/20 bis 30 Wörter/.test(t.task), `${t.taskKey}: task must state the exam's 20–30 word band`);
}
for (const t of teil2) {
  ok(t.register === 'halbformell', `${t.taskKey}: Teil 2 must be halbformell`);
  ok(t.minWords === 30 && t.maxWords === 60, `${t.taskKey}: Teil 2 band must be 30/60`);
  ok(/30 bis 40 Wörter/.test(t.task), `${t.taskKey}: task must state the exam's 30–40 word band`);
}

// ── 12. A2.1 level constraint on the learner-facing task German ────────────
// Blocking defects from S/wave4/level-a2.1.md, applied to task + leitpunkte
// (NOT to pointsNote, which is meta-text, nor to the guide, which is native
// marketing prose — see notes.md for that boundary).
const BANNED = [
  [/\b(sich|mich|dich|uns|euch)\s+(freu|anmeld|wasch|vorstell|bedank|interessier|treff)/i, 'reflexive verb in production'],
  [/\b(ging|kam|sagte|machte|fuhr|gab|nahm|sah|stand|blieb)\b/i, 'Präteritum of a full verb'],
  [/\b(werde|wirst|wird)\s+\w+en\b/i, 'Futur'],
  [/,\s*(weil|dass|wenn|ob|als|obwohl)\b/i, 'Nebensatz in production'],
  [/\b(größer|besser|schneller|billiger|länger|kleiner)\b/i, 'Komparativ in production'],
  [/,\s*(?:\w+\s+){0,6}zu\s+\w+en\b/i, 'infinitive clause with zu'],
  [/\bum\s+(?:\w+\s+){1,6}zu\s+\w+en\b/i, 'um … zu'],
  [/\bdes\s+\w+(?:es|s)\b/i, 'Genitiv'],
  [/[şıçğ]/i, 'name not typeable on a German keyboard'],
];
for (const t of goetheA2WritingTasks) {
  // Each field is its own unit of learner-facing German. Joining them first
  // would invent 20-word "sentences" that no learner ever reads as one.
  const units = [t.title, t.task, ...t.leitpunkte];
  for (const [re, label] of BANNED) {
    const hit = units.find((u) => re.test(u));
    if (hit) fail(`${t.taskKey}: ${label} — "${hit.match(re)[0]}" in "${hit}"`);
  }
  for (const unit of units) {
    // A title or Leitpunkt has no full stop; treat the whole unit as one
    // sentence, and split the task text on its own sentence boundaries.
    for (const sentence of unit.split(/(?<=[.!?])\s+/)) {
      const words = sentence.trim().split(/\s+/).filter(Boolean).length;
      if (words > 14) fail(`${t.taskKey}: sentence of ${words} words (max 14): "${sentence.trim()}"`);
    }
  }
}

// ── report ─────────────────────────────────────────────────────────────────
if (failures.length === 0) {
  console.log('verify.mjs: PASS');
  for (const w of warnings) console.log(`  WARNING         ${w}`);
  console.log(`  guide           ${guide.slug} — title ${guide.title.length} chars, description ${guide.description.length} chars`);
  console.log(`  answer          ${answerWords} words (want 45-120)`);
  console.log(`  sections        ${guide.sections.length} (${ids.join(', ')})`);
  console.log(`  faq / reading   ${guide.faq.length} entries, ~${readingMinutes} min`);
  console.log(`  sources         ${guide.sources.length}`);
  console.log(`  internal links  ${linksSeen} checked, all trailing-slash cases correct`);
  console.log(`  hub copy        title ${goetheA2HubCopy.title.length} chars, description ${goetheA2HubCopy.description.length} chars`);
  console.log(`  track           ${goetheA2Track.key} → /pruefung/${goetheA2Track.slug}/ (hasMock ${goetheA2Track.hasMock}, hasWriting ${goetheA2Track.hasWriting})`);
  console.log(`  round-2 pins    Messpunkte, age-recommendation, preposition case, Studium/DSH, pointsNote, Leitpunkt pronoun — all clean`);
  console.log(`  round-3 pins    Teilwiederholung scope, Sprechen criteria, /de/ DFB path, nominal Leitpunkte — all clean`);
  console.log(`  writing tasks   ${goetheA2WritingTasks.length} (${teil1.length} × Teil 1, ${teil2.length} × Teil 2), A2.1 constraint clean`);
  process.exit(0);
}
for (const w of warnings) console.error(`verify.mjs: WARNING — ${w}`);
console.error(`verify.mjs: FAIL — ${failures.length} problem(s)`);
failures.forEach((f, i) => console.error(`  ${i + 1}. ${f}`));
process.exit(1);
