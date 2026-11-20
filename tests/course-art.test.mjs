// Guard suite for the A1.1 course art (Wave 2, 2026-09-19):
// src/components/illustrations/{CharacterAvatar,SituationScene}.jsx and the
// manifest they read, src/data/curricula/a11.art.js.
//
// Five things this pins:
//   1. every A1.1 Lektion id resolves in the manifest AND in SituationScene's
//      own scene map — a Lektion added to a11.js without a matching scene
//      would otherwise render nothing and nobody would notice;
//   2. every A11_META character name resolves the same way in CharacterAvatar;
//   3. no hex literal ever lands in the illustrations directory — every fill
//      must come from design-tokens.js (the design-tokens.js header: colour
//      tokens are the only place a hex value is written);
//   4. no `kasus` import in the illustrations directory — the four case
//      colours are reserved for naming a grammatical case, never decoration
//      (design-tokens.js rule 1);
//   5. every manifest entry has a non-empty `alt`, and the five insertion
//      points (IntroStage, CourseWelcome, DialogStage, WortfeldStage,
//      CurriculumHomePage) actually import the components — a source pin
//      against the wiring going missing silently in a later edit.
//
// The components are `.jsx` and this suite runs under plain `node --test`
// (no JSX transform), so they are read as text here rather than imported —
// the same pattern tests/brand.test.mjs and tests/a2-1-reading.test.mjs use
// for other `.jsx` files.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { A11_ART } from '../src/data/curricula/a11.art.js';
import { A11_META } from '../src/data/curricula/a11.meta.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const ILLUSTRATIONS_DIR = join(ROOT, 'src/components/illustrations');
const illustrationFiles = readdirSync(ILLUSTRATIONS_DIR).filter((f) => f.endsWith('.jsx'));

const AVATAR_SRC = read('src/components/illustrations/CharacterAvatar.jsx');
const SCENE_SRC = read('src/components/illustrations/SituationScene.jsx');

const LEKTION_IDS = CURRICULUM_A11.lektionen.map((l) => l.id);
const CHARACTER_NAMES = A11_META.characters.map((c) => c.name);

/** Quoted or bare object keys at the top level of a `NAME = { ... }` block in `src`. */
function keysOfBlock(src, blockName) {
  const start = src.indexOf(`${blockName} = {`);
  assert.ok(start >= 0, `expected a "${blockName} = {" block in the source`);
  const open = src.indexOf('{', start);
  let depth = 0;
  let end = open;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    if (src[i] === '}') { depth -= 1; if (depth === 0) { end = i; break; } }
  }
  const body = src.slice(open + 1, end);
  const keys = [];
  const re = /^\s*(?:'([^']+)'|([A-Za-z0-9_.-]+))\s*:/gm;
  let m;
  while ((m = re.exec(body))) keys.push(m[1] || m[2]);
  return keys;
}

// ---------------------------------------------------------------------------
// 1 & 2. Manifest resolution
// ---------------------------------------------------------------------------

test('every A1.1 Lektion id resolves in the A11_ART situations manifest', () => {
  const missing = LEKTION_IDS.filter((id) => !A11_ART.situations[id]);
  assert.deepEqual(missing, [], `Lektion ids missing from A11_ART.situations: ${missing.join(', ')}`);
});

test('every A11_ART situation key is a real Lektion id (no stale entries)', () => {
  const stale = Object.keys(A11_ART.situations).filter((id) => !LEKTION_IDS.includes(id));
  assert.deepEqual(stale, [], `A11_ART.situations has ids no Lektion has: ${stale.join(', ')}`);
});

test('every A1.1 Lektion id resolves to a drawn scene in SituationScene.jsx', () => {
  const sceneKeys = keysOfBlock(SCENE_SRC, 'const SCENES');
  const missing = LEKTION_IDS.filter((id) => !sceneKeys.includes(id));
  assert.deepEqual(missing, [], `Lektion ids with no SCENES entry: ${missing.join(', ')}`);
});

test('every A11_META character resolves in the A11_ART characters manifest', () => {
  const missing = CHARACTER_NAMES.filter((name) => !A11_ART.characters[name]);
  assert.deepEqual(missing, [], `characters missing from A11_ART.characters: ${missing.join(', ')}`);
});

test('every A11_META character resolves to a drawn bust in CharacterAvatar.jsx', () => {
  const castKeys = keysOfBlock(AVATAR_SRC, 'const CAST');
  const missing = CHARACTER_NAMES.filter((name) => !castKeys.includes(name));
  assert.deepEqual(missing, [], `characters with no CAST entry: ${missing.join(', ')}`);
});

// ---------------------------------------------------------------------------
// 3 & 4. Palette discipline — design-tokens.js is the only place a hex or a
// case colour is written (design-tokens.js header, rule 1)
// ---------------------------------------------------------------------------

test('no hex literal in src/components/illustrations/*', () => {
  const offenders = [];
  for (const f of illustrationFiles) {
    const src = read(`src/components/illustrations/${f}`);
    if (/#[0-9a-fA-F]{3,8}\b/.test(src)) offenders.push(f);
  }
  assert.deepEqual(offenders, [], `hex literal found in: ${offenders.join(', ')} — import from design-tokens.js instead`);
});

test('no `kasus` (grammatical-case colour) import in src/components/illustrations/*', () => {
  const offenders = [];
  for (const f of illustrationFiles) {
    const src = read(`src/components/illustrations/${f}`);
    if (/\bkasus\b/.test(src)) offenders.push(f);
  }
  assert.deepEqual(offenders, [], `"kasus" referenced in: ${offenders.join(', ')} — the four case colours may only mark a grammatical case`);
});

// ---------------------------------------------------------------------------
// 5. Alt text and wiring
// ---------------------------------------------------------------------------

test('every manifest entry has a non-empty alt', () => {
  const bad = [];
  for (const [pose, entry] of Object.entries(A11_ART.guide.poses)) {
    if (!entry.alt || !entry.alt.trim()) bad.push(`guide.poses.${pose}`);
  }
  for (const [name, entry] of Object.entries(A11_ART.characters)) {
    if (!entry.alt || !entry.alt.trim()) bad.push(`characters.${name}`);
  }
  for (const [id, entry] of Object.entries(A11_ART.situations)) {
    if (!entry.alt || !entry.alt.trim()) bad.push(`situations.${id}`);
  }
  assert.deepEqual(bad, [], `empty alt text: ${bad.join(', ')}`);
});

test('the five insertion points import the illustration components', () => {
  const pins = [
    ['src/components/lesson/IntroStage.jsx', ['CharacterAvatar', 'SituationScene']],
    ['src/components/course/CourseWelcome.jsx', ['CharacterAvatar']],
    ['src/components/lesson/DialogStage.jsx', ['CharacterAvatar']],
    ['src/components/lesson/WortfeldStage.jsx', ['SituationScene', 'GuideOtter']],
    ['src/components/lesson/RecapStage.jsx', ['GuideOtter']],
    ['src/pages/CurriculumHomePage.jsx', ['SituationScene']],
  ];
  for (const [file, names] of pins) {
    const src = read(file);
    for (const name of names) {
      assert.ok(
        new RegExp(`import ${name} from`).test(src) || new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\}`).test(src),
        `${file} is expected to import ${name}`,
      );
      assert.ok(new RegExp(`<${name}\\b`).test(src), `${file} is expected to render <${name}`);
    }
  }
});

test('CharacterAvatar and SituationScene both branch on a manifest src before drawing the placeholder', () => {
  assert.match(AVATAR_SRC, /art\?\.src/, 'CharacterAvatar should check A11_ART.characters[name].src before falling back to SVG');
  assert.match(SCENE_SRC, /entry\?\.srcSmall \|\| entry\?\.src|entry\?\.src/, 'SituationScene should check the manifest src before falling back to SVG');
});

test('L1 ships the illustrated otter reception with honest mixed provenance and responsive sizes', async () => {
  // Kept as it was for Lektion 1; the rollout's scenes are pinned by the class test below.
  assert.equal(A11_ART.generatedWith.status, 'mixed-illustrated-svg');
  assert.match(A11_ART.generatedWith.tool, /Codex image tool.*inline SVG/);
  assert.equal(A11_ART.generatedWith.model, null, 'the supplied asset does not establish a model name');
  const scene = A11_ART.situations['a1.1-l01'];
  assert.equal(scene.alt, 'Ana, drawn as an otter with a suitcase, arrives at a hostel reception in Bremen; Frau Kaya, drawn as a bird, welcomes her');
  const { default: sharp } = await import('sharp');
  for (const [field, width] of [['srcSmall', 640], ['srcMedium', 800], ['src', 1168]]) {
    assert.equal(scene[field], `/art/a11/l01-rezeption-${width}.webp`);
    const actual = await sharp(join(ROOT, 'public', scene[field])).metadata();
    assert.equal(actual.width, width);
  }
  const actual = await sharp(join(ROOT, 'public', scene.src)).metadata();
  assert.equal(scene.width, actual.width);
  assert.equal(scene.height, actual.height);
  assert.match(SCENE_SRC, /srcSet=\{entry.srcMedium/);
  assert.match(read('src/components/lesson/SceneStage.jsx'), /<SituationScene lektionId=\{lektionId\}/);
});

// The rollout (2026-11-19, docs/course-factory/a11-lektion-rollout/): Lektionen get their scene one
// batch at a time. Every illustrated scene ships in the three sizes, and every cast portrait is a file.
const ILLUSTRATED = ['a1.1-l01', 'a1.1-l02', 'a1.1-l03', 'a1.1-l04', 'a1.1-l05', 'a1.1-l06', 'a1.1-l07'];

test('every illustrated scene ships 1168x880 plus 800 and 640 wide, and the rest are still drawn as SVG', async () => {
  const { default: sharp } = await import('sharp');
  for (const [id, scene] of Object.entries(A11_ART.situations)) {
    if (!ILLUSTRATED.includes(id)) { assert.equal(scene.src, null, id); continue; }
    assert.match(scene.alt, /drawn as an? /, `${id}: the alt says which animal each person is drawn as`);
    const slug = scene.src.match(/^\/art\/a11\/(l\d\d-[a-z]+)-1168\.webp$/)?.[1];
    assert.ok(slug && slug.startsWith(`l${id.slice(-2)}-`), id);
    for (const [field, width] of [['srcSmall', 640], ['srcMedium', 800], ['src', 1168]]) {
      assert.equal(scene[field], `/art/a11/${slug}-${width}.webp`, `${id} ${field}`);
      assert.equal((await sharp(join(ROOT, 'public', scene[field])).metadata()).width, width, `${id} ${field}`);
    }
    const big = await sharp(join(ROOT, 'public', scene.src)).metadata();
    assert.deepEqual([scene.width, scene.height], [big.width, big.height], id);
    assert.deepEqual([big.width, big.height], [1168, 880], id);
  }
});

test('every character with a portrait has a 160 px file, and each illustrated scene’s cast has one', async () => {
  const { default: sharp } = await import('sharp');
  for (const [name, art] of Object.entries(A11_ART.characters)) {
    if (!art.src) continue;
    assert.equal(art.srcSmall, art.src, name);
    assert.match(art.src, /^\/art\/a11\/[a-z-]+-160\.webp$/, name);
    assert.equal((await sharp(join(ROOT, 'public', art.src)).metadata()).width, 160, name);
  }
  for (const id of ILLUSTRATED) {
    const lektion = CURRICULUM_A11.lektionen.find((l) => l.id === id);
    for (const speaker of new Set(lektion.dialog.lines.map((l) => l.speaker))) assert.ok(A11_ART.characters[speaker]?.src, `${id}: ${speaker}`);
  }
});

test('both course guide poses have alt text and responsive files at the declared widths', async () => {
  assert.deepEqual(Object.keys(A11_ART.guide.poses), ['thinking', 'satisfied']);
  const { default: sharp } = await import('sharp');
  for (const [pose, art] of Object.entries(A11_ART.guide.poses)) {
    assert.ok(art.alt?.trim(), `${pose} needs alt text`);
    for (const [field, width] of [['src', 512], ['srcSmall', 160]]) {
      assert.equal(art[field], `/art/a11/otter-${pose}-${width}.webp`);
      const actual = await sharp(join(ROOT, 'public', art[field])).metadata();
      assert.equal(actual.width, width);
    }
  }
});

test('GuideOtter returns null when the Lektion scene has no image src', () => {
  assert.match(read('src/components/illustrations/GuideOtter.jsx'), /if \(!art \|\| !A11_ART\.situations\[lektionId\]\?\.src\) return null/);
});
