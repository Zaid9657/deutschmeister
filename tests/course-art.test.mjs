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
    ['src/components/lesson/WortfeldStage.jsx', ['SituationScene']],
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
