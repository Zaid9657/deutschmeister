// The SCHEMA §15 worked example (A2.1 U7 „Am Telefon im Job") as an in-memory validator context.
//
// Read straight from docs/course-v2/SCHEMA.md (binding), so the validator's tests pin the rules
// against the reference unit, not against a copy that could drift. What §15.1 does not excerpt but
// the example references is added here explicitly: the spine points g.wenn / g.perfekt-haben /
// g.akk-personalpronomen (positions as in the full spine), text types, families, the rubric
// course-micro-sp, and the four `earlier` items of U2–U6 (as stubs).

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyContext, ingest, addDoc, addDetectors } from '../../../scripts/course-v2/lib-validate/context.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SCHEMA_MD = join(REPO, 'docs', 'course-v2', 'SCHEMA.md');
const DETECTORS = join(REPO, 'content', 'course-v2', 'registries', 'detectors.json');

function blockAfter(md, marker, from = 0) {
  const at = md.indexOf(marker, from);
  if (at < 0) throw new Error(`SCHEMA.md: marker not found: ${marker}`);
  const open = md.indexOf('```json\n', at);
  const start = open + '```json\n'.length;
  const end = md.indexOf('\n```', start);
  return JSON.parse(md.slice(start, end));
}

/** The §15 documents, parsed. */
export function schemaExample() {
  const md = readFileSync(SCHEMA_MD, 'utf8');
  const s15 = md.indexOf('## 15. Worked example');
  const j = (marker) => blockAfter(md, marker, s15);
  return {
    cando: j('`registries/cando/a2.json`'),
    spinePoint: j('`registries/grammar-spine.json` (one point'),
    ga2Lane: j('`registries/lanes/ga2.json` (excerpt'),
    ta2Teile: j('`registries/lanes/ta2.json` (excerpt'),
    rubrics: j('`registries/rubrics/writing/ga2-s2.json`'),
    levelProfile: j('`registries/level-profiles.json` (the A2.1 entry)'),
    casts: j('`casts/series.json` and `casts/a2.json`'),
    ruleCard: j('`a2.1/rule-cards.json` (the card'),
    lexicon: j('`a2.1/lexicon.json` (the unit'),
    course: j('### 15.2'),
    unit: j('### 15.3'),
    lanePack: j('### 15.4'),
  };
}

const clone = (x) => JSON.parse(JSON.stringify(x));

/**
 * A fresh context holding the example, plus the target docs. `mutate(parts)` edits the parsed
 * parts before they are ingested (a failing fixture is the example with one change).
 */
export function exampleContext(mutate = null, { today = '2026-09-27', verified = true } = {}) {
  const parts = clone(schemaExample());
  if (verified) parts.unit.facts[0].verification = 'verified'; // the §15.6 CON-06 failure is tested on its own
  parts.extraSpine = [
    { id: 'g.wenn', label: 'Nebensatz mit wenn', intro: { receptive: 'a2.1-u06', productive: 'a2.1-u06' }, detectors: ['det.nebensatz-wenn'], errorTags: [], lehrwerk: ['S3 L4', 'M A2 L7'], consensus: 'strong', ruleCards: [], inventory: [] },
    { id: 'g.perfekt-haben', label: 'Perfekt mit haben', intro: { receptive: 'a1.1-u11', productive: 'a1.1-u11' }, detectors: ['det.perfekt-haben'], errorTags: [], lehrwerk: ['M A1 L10', 'S1 L7'], consensus: 'strong', ruleCards: [], inventory: [] },
    { id: 'g.akk-personalpronomen', label: 'Personalpronomen im Akkusativ', intro: { receptive: 'a1.2-u09', productive: 'a1.2-u09' }, detectors: ['det.akkusativ-pronomen-ihn'], errorTags: [], lehrwerk: ['M A1 L11', 'S2 L9'], consensus: 'strong', ruleCards: [], inventory: [] },
  ];
  if (mutate) mutate(parts);
  const ctx = emptyContext({ root: null, today });
  const f = (name) => `fixture:${name}`;
  ingest(ctx, parts.cando, f('cando/a2.json'));
  ingest(ctx, { $schema: 'course-v2/spine@1', points: [parts.spinePoint, ...parts.extraSpine] }, f('grammar-spine.json'));
  ingest(ctx, parts.ga2Lane, f('lanes/ga2.json'));
  ingest(ctx, { $schema: 'course-v2/lane@1', id: 'ta2', teile: parts.ta2Teile, modules: { sprechen: { prepMinutes: 0 } } }, f('lanes/ta2.json'));
  for (const r of parts.rubrics) ingest(ctx, r, f(`rubrics/${r.id}.json`));
  ingest(ctx, { ...parts.rubrics.find((r) => r.id === 'course-micro'), id: 'course-micro-sp', kind: 'speaking' }, f('rubrics/course-micro-sp.json'));
  ingest(ctx, { $schema: 'course-v2/levels@1', levels: [parts.levelProfile] }, f('level-profiles.json'));
  ingest(ctx, parts.casts, f('casts/a2.json'));
  ingest(ctx, { $schema: 'course-v2/rulecards@1', level: 'a2.1', cards: [parts.ruleCard] }, f('a2.1/rule-cards.json'));
  ingest(ctx, { $schema: 'course-v2/lexicon@1', level: 'a2.1', entries: parts.lexicon }, f('a2.1/lexicon.json'));
  ingest(ctx, parts.course, f('a2.1/course.json'));
  ingest(ctx, {
    $schema: 'course-v2/stubs@1',
    ids: {
      texttype: ['tt.mailbox', 'tt.dialog', 'tt.telefonnotiz', 'tt.kurzansage', 'tt.email-halbformell', 'tt.wortkarte', 'tt.telefonansage'],
      family: ['fam.h-detail', 'fam.w-nachricht', 'fam.s-fragekarten'],
      template: ['ta2.sp2'],
      item: ['a2.1-u02-ls1-p05', 'a2.1-u04-ls2-p02', 'a2.1-u05-ls1-p06', 'a2.1-u06-ls2-p03'],
      unit: ['a2.1-u01', 'a2.1-u02', 'a2.1-u03', 'a2.1-u04', 'a2.1-u05', 'a2.1-u06', 'a2.1-u08', 'a2.1-u09', 'a2.1-u10', 'a2.1-u11', 'a2.1-u12'],
    },
  }, f('stubs.json'));
  addDetectors(ctx, JSON.parse(readFileSync(DETECTORS, 'utf8')).detectors, 'content/course-v2/registries/detectors.json');
  const unit = addDoc(ctx, 'unit', parts.unit, f('a2.1/units/u07.json'), { target: true });
  const pack = addDoc(ctx, 'lanepack', parts.lanePack, f('a2.1/units/u07.lane-ta2.json'), { target: true });
  return { ctx, docs: [unit, pack], unit, pack, parts, levels: [ctx.levels.get('a2.1')] };
}

/**
 * The SCHEMA §15.7 shape fixtures (`tb1.lv3` in B1.2 U2 as a slot-'input' examBlock, `gb2.l2` in a
 * B2.2 U7 lane pack) with their two template rows. `mutate(parts)` edits them before ingestion.
 */
export function choiceContext(mutate = null) {
  const md = readFileSync(SCHEMA_MD, 'utf8');
  const s157 = md.indexOf('### 15.7');
  const j = (marker) => blockAfter(md, marker, s157);
  const parts = clone({
    templates: j('**Registry entries**'),
    lv3: j('**`tb1.lv3` in B1.2 U2'),
    l2: j('**`gb2.l2` in B2.2 U7**'),
  });
  if (mutate) mutate(parts);
  const ctx = emptyContext({ root: null, today: '2026-09-27' });
  const f = (name) => `fixture:${name}`;
  ingest(ctx, { $schema: 'course-v2/lane@1', id: 'tb1', teile: { lv3: parts.templates.lv3 } }, f('lanes/tb1.json'));
  ingest(ctx, { $schema: 'course-v2/lane@1', id: 'gb2', teile: { l2: parts.templates.l2 } }, f('lanes/gb2.json'));
  const unit = addDoc(ctx, 'unit', {
    $schema: 'course-v2/unit@1', id: 'b1.2-u02', level: 'b1.2', nr: 2, etappe: 1, stage: 'T',
    steps: [{ id: 'b1.2-u02-ls1', kind: 'situation', title: 'Kurse', ...parts.lv3 }],
  }, f('b1.2/units/u02.json'), { target: true });
  const pack = addDoc(ctx, 'lanepack', {
    $schema: 'course-v2/lanepack@1', unit: 'b2.2-u07', lane: 'gb2', version: 1, status: 'draft', reviewedIn: null,
    slots: { ls4: { mode: 'replace', texts: parts.l2.texts, blocks: parts.l2.blocks, strategyCards: [] } },
  }, f('b2.2/units/u07.lane-gb2.json'), { target: true });
  return { ctx, docs: [unit, pack], unit, pack, parts, levels: [] };
}
