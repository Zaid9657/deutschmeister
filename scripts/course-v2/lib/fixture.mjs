// The SCHEMA §15 fixture, extracted verbatim from docs/course-v2/SCHEMA.md.
//
//   node scripts/course-v2/lib/fixture.mjs --write   (re)write content/course-v2/fixtures/**
//   node scripts/course-v2/lib/fixture.mjs --check   exit 1 when the files differ from SCHEMA.md
//
// Files that SCHEMA prints whole (the unit, course.json, the can-do file, the ga2 lane, the cast
// excerpt) are written as the exact text of their code block. Excerpts SCHEMA prints as bare
// entries (one spine point, three rubrics in one array, the A2.1 level profile, one rule card,
// 28 lexicon entries) are wrapped in their file envelope with the entries unchanged. The
// telc A2 lane pack (§15.4) and the ta2 excerpt are not written: secondary lanes are deferred
// (lean execution 2026-09-27); ta2 ids the unit references are listed in stubs.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT, FIXTURES_ROOT } from './tree.mjs';

export const SCHEMA_MD = path.join(REPO_ROOT, 'docs/course-v2/SCHEMA.md');

/** The text of the first ```<lang> block after `marker` (searched from `from`). */
export function blockAfter(md, marker, { lang = 'json', from = 0 } = {}) {
  const at = md.indexOf(marker, from);
  if (at < 0) throw new Error(`SCHEMA.md: marker not found: ${marker}`);
  const open = md.indexOf('```' + lang + '\n', at);
  if (open < 0) throw new Error(`SCHEMA.md: no \`\`\`${lang} block after ${marker}`);
  const start = open + 3 + lang.length + 1;
  const end = md.indexOf('\n```', start);
  if (end < 0) throw new Error(`SCHEMA.md: unclosed block after ${marker}`);
  return md.slice(start, end);
}

/** Every example SCHEMA §15 prints (and the §2 bank-key block), as text and parsed JSON. */
export function schemaExamples(md = fs.readFileSync(SCHEMA_MD, 'utf8')) {
  const s15 = md.indexOf('## 15. Worked example');
  if (s15 < 0) throw new Error('SCHEMA.md: §15 not found');
  const j = (marker) => {
    const text = blockAfter(md, marker, { from: s15 });
    return { text, json: JSON.parse(text) };
  };
  return {
    bankKeyJs: blockAfter(md, '**Bank keys**', { lang: 'js' }),
    cando: j('`registries/cando/a2.json`'),
    spinePoint: j('`registries/grammar-spine.json` (one point'),
    ga2Lane: j('`registries/lanes/ga2.json` (excerpt'),
    ta2Teile: j('`registries/lanes/ta2.json` (excerpt)'),
    rubrics: j('`registries/rubrics/writing/ga2-s2.json`'),
    levelProfile: j('`registries/level-profiles.json` (the A2.1 entry)'),
    casts: j('`casts/series.json` and `casts/a2.json`'),
    ruleCard: j('`a2.1/rule-cards.json` (the card'),
    lexiconEntries: j('`a2.1/lexicon.json` (the unit'),
    course: j('### 15.2'),
    unit: j('### 15.3'),
    lanePack: j('### 15.4'),
    poolItem: j('**Pool item**'),
    writingBankJs: blockAfter(md, '**Writing bank entries**', { lang: 'js', from: s15 }),
    syllabusRow: j('**Syllabus row**'),
    audioLines: j('**Audio lines**'),
  };
}

// Ids that exist in the full registries but that §15 does not excerpt. Hand-maintained on
// purpose: deriving them from the fixture's unresolved refs would make REF-01 vacuous.
export const FIXTURE_STUBS = {
  $schema: 'course-v2/stubs@1',
  note:
    'Fixture only. Ids the SCHEMA §15 example references that exist in the full registries but are not excerpted in §15.1 ' +
    '(§15.1: g.wenn and g.perfekt-haben exist in the full registry; §15.6: stub files for U1–U6). ta2 is a deferred ' +
    'secondary lane (lean execution 2026-09-27): its lane and templates are listed here instead of a lane file.',
  ids: {
    spine: ['g.akk-personalpronomen', 'g.perfekt-haben', 'g.wenn'],
    texttype: ['tt.dialog', 'tt.email-halbformell', 'tt.kurzansage', 'tt.mailbox', 'tt.telefonansage', 'tt.telefonnotiz', 'tt.wortkarte'],
    family: ['fam.h-detail', 'fam.s-fragekarten', 'fam.w-nachricht'],
    detector: ['det.reflexiv-pronomen'],
    lane: ['ta2'],
    template: ['ta2.h1', 'ta2.sp2'],
    unit: ['a2.1-u01', 'a2.1-u02', 'a2.1-u03', 'a2.1-u04', 'a2.1-u05', 'a2.1-u06', 'a2.1-u08', 'a2.1-u09', 'a2.1-u10', 'a2.1-u11', 'a2.1-u12'],
    item: ['a2.1-u02-ls1-p05', 'a2.1-u04-ls2-p02', 'a2.1-u05-ls1-p06', 'a2.1-u06-ls2-p03'],
  },
};

const json = (x) => `${JSON.stringify(x, null, 2)}\n`;

/** [{ path (relative to the fixtures root), text }] — deterministic. */
export function fixtureFiles(ex = schemaExamples()) {
  const [ga2s2, ga2sp1, courseMicro] = ex.rubrics.json;
  return [
    { path: 'a2.1-u07.json', text: `${ex.unit.text}\n` },
    { path: 'registries/cando/a2.json', text: `${ex.cando.text}\n` },
    { path: 'registries/grammar-spine.json', text: json({ $schema: 'course-v2/spine@1', points: [ex.spinePoint.json] }) },
    { path: 'registries/lanes/ga2.json', text: `${ex.ga2Lane.text}\n` },
    { path: 'registries/rubrics/writing/ga2-s2.json', text: json(ga2s2) },
    { path: 'registries/rubrics/speaking/ga2-sp1.json', text: json(ga2sp1) },
    { path: 'registries/rubrics/writing/course-micro.json', text: json(courseMicro) },
    { path: 'registries/level-profiles.json', text: json({ $schema: 'course-v2/levels@1', levels: [ex.levelProfile.json] }) },
    { path: 'registries/casts/a2.json', text: `${ex.casts.text}\n` },
    { path: 'registries/a2.1/course.json', text: `${ex.course.text}\n` },
    { path: 'registries/a2.1/lexicon.json', text: json({ $schema: 'course-v2/lexicon@1', level: 'a2.1', entries: ex.lexiconEntries.json }) },
    { path: 'registries/a2.1/rule-cards.json', text: json({ $schema: 'course-v2/rulecards@1', level: 'a2.1', cards: [ex.ruleCard.json] }) },
    { path: 'registries/stubs.json', text: json(FIXTURE_STUBS) },
  ];
}

/** Write (or with check: true, compare) the fixture files. Returns the paths that differ. */
export function syncFixtures({ check = false, root = FIXTURES_ROOT } = {}) {
  const differ = [];
  for (const f of fixtureFiles()) {
    const abs = path.join(root, f.path);
    const cur = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    if (cur === f.text) continue;
    differ.push(f.path);
    if (!check) {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, f.text);
    }
  }
  return differ;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  if (!check && !process.argv.includes('--write')) {
    console.error('usage: node scripts/course-v2/lib/fixture.mjs --write | --check');
    process.exit(2);
  }
  const differ = syncFixtures({ check });
  if (check && differ.length) {
    for (const p of differ) console.error(`content/course-v2/fixtures/${p}: differs from docs/course-v2/SCHEMA.md §15`);
    process.exit(1);
  }
  console.log(check ? 'fixtures match SCHEMA.md §15' : `wrote ${differ.length} fixture file(s)`);
}
