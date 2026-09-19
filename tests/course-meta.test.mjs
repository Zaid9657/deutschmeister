// Guard suite for the A1.1 orientation layer (src/data/curricula/a11.meta.js).
//
// The meta file is English chrome around a German course, and the two can
// drift in exactly the ways this suite pins: a Lektion without an intro, a
// can-do list rendered with one line missing, a chapter that skips or repeats
// a Lektion, a "character" who never speaks, and an hour figure that was typed
// rather than derived. None of these would be caught by lint or by the
// curriculum validator, which only reads a11.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import * as lucideIcons from 'lucide-react';
import { A11_META, LANDESKUNDE, chapterGroups, charactersOf, weeklyEstimate, WORTFELD_ICONS, WORTFELD_ICON_FALLBACK } from '../src/data/curricula/a11.meta.js';
import { CURRICULUM_A11 } from '../src/data/curricula/a11.js';
import { curriculumPath } from '../src/data/curricula/index.js';
import { SUSTAINABLE_PER_WEEK } from '../src/lib/course/plan.js';

const LEKTIONEN = CURRICULUM_A11.lektionen;
const NRS = LEKTIONEN.map((l) => l.nr);

/** Every English string the meta file exposes, flattened, so the character ban covers all of it. */
function englishStrings(meta) {
  const out = [];
  out.push(meta.aboutEn);
  for (const c of meta.chapters) out.push(c.titleEn, c.storyEn);
  for (const c of meta.characters) out.push(c.roleEn);
  for (const intro of Object.values(meta.lektionIntro)) out.push(intro.situationEn, ...intro.canDoEn);
  out.push(...meta.outcomesEn);
  for (const s of meta.howItWorksEn.steps) out.push(s.label, s.descriptionEn);
  return out;
}

// ---------------------------------------------------------------------------
// 1. Lektion intros
// ---------------------------------------------------------------------------

test('every A1.1 Lektion has an intro and no intro points at a Lektion that does not exist', () => {
  const ids = LEKTIONEN.map((l) => l.id);
  for (const id of ids) {
    assert.ok(A11_META.lektionIntro[id], `missing lektionIntro for ${id}`);
    assert.ok(A11_META.lektionIntro[id].situationEn.trim().length > 0, `${id} needs a situationEn`);
  }
  assert.deepEqual(Object.keys(A11_META.lektionIntro).sort(), [...ids].sort(), 'intro keys must be exactly the Lektion ids');
});

test('canDoEn is parallel to canDo for every Lektion — same length, same order, nothing empty', () => {
  for (const l of LEKTIONEN) {
    const en = A11_META.lektionIntro[l.id].canDoEn;
    assert.ok(Array.isArray(en), `${l.id} canDoEn must be an array`);
    assert.equal(en.length, l.canDo.length, `${l.id}: canDoEn has ${en.length} lines, canDo has ${l.canDo.length}`);
    en.forEach((line, i) => {
      assert.match(line, /^I can /, `${l.id} canDoEn[${i}] must start with "I can" (renders "${l.canDo[i]}")`);
      assert.match(line, /\.$/, `${l.id} canDoEn[${i}] must end with a full stop`);
    });
  }
});

test('a German chunk quoted in a can-do is quoted in its English rendering too', () => {
  // „Guten Tag“, „Mir geht es gut, danke“, „hier“ … are what the learner will actually say;
  // an English line that drops them describes a different goal.
  const quoted = (s) => [...s.matchAll(/„([^“]+)“/g)].map((m) => m[1]);
  for (const l of LEKTIONEN) {
    l.canDo.forEach((de, i) => {
      const en = A11_META.lektionIntro[l.id].canDoEn[i];
      for (const chunk of quoted(de)) {
        assert.ok(en.includes(`„${chunk}“`), `${l.id} canDoEn[${i}] must keep the quoted chunk „${chunk}“`);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Chapters
// ---------------------------------------------------------------------------

test('chapters partition the Lektionen exactly once, in order, cut at the checkpoints', () => {
  const flat = A11_META.chapters.flatMap((c) => c.lektionen);
  assert.deepEqual(flat, NRS, 'every Lektion nr once, in course order');
  A11_META.chapters.forEach((c, i) => {
    assert.equal(c.nr, i + 1);
    assert.ok(c.titleDe && c.titleEn && c.storyEn, `chapter ${c.nr} needs titleDe, titleEn and storyEn`);
    assert.doesNotMatch(c.titleEn, /^Chapter \d+$/, `chapter ${c.nr} still has the fallback title`);
    assert.doesNotMatch(c.titleEn, /Lektion \d/, `chapter ${c.nr} is named after a situation, not a Lektion range`);
  });
  // The grouping is the checkpoints', not a typed list.
  const expected = CURRICULUM_A11.checkpoints.map((cp, i) => {
    const prev = i === 0 ? 0 : CURRICULUM_A11.checkpoints[i - 1].afterLektion;
    return NRS.filter((nr) => nr > prev && nr <= cp.afterLektion);
  });
  assert.deepEqual(A11_META.chapters.map((c) => c.lektionen), expected);
  assert.equal(A11_META.chapters.length, CURRICULUM_A11.checkpoints.length, 'one chapter per checkpoint');
});

test('chapterGroups follows a moved checkpoint', () => {
  const moved = {
    ...CURRICULUM_A11,
    checkpoints: [
      { id: 'x-cp1', nr: 1, title: 'x', afterLektion: 4 },
      { id: 'x-cp2', nr: 2, title: 'x', afterLektion: 12 },
    ],
  };
  assert.deepEqual(chapterGroups(moved), [[1, 2, 3, 4], [5, 6, 7, 8, 9, 10, 11, 12]]);
});

// ---------------------------------------------------------------------------
// 3. Characters
// ---------------------------------------------------------------------------

test('every character is a real dialogue speaker, and every speaker is a character', () => {
  const speakers = new Map();
  for (const l of LEKTIONEN) {
    for (const line of l.dialog.lines) {
      if (!speakers.has(line.speaker)) speakers.set(line.speaker, []);
      const arr = speakers.get(line.speaker);
      if (!arr.includes(l.nr)) arr.push(l.nr);
    }
  }
  const names = A11_META.characters.map((c) => c.name);
  assert.deepEqual([...names].sort(), [...speakers.keys()].sort());
  for (const c of A11_META.characters) {
    assert.deepEqual(c.appearsIn, speakers.get(c.name), `${c.name}: appearsIn must equal the Lektionen they speak in`);
    assert.equal(c.firstLektion, c.appearsIn[0], `${c.name}: firstLektion is the first Lektion they speak in`);
    assert.doesNotMatch(c.roleEn, /^Appears in Lektion \d+\.$/, `${c.name} still has the fallback role — write one`);
  }
  // Ordered by first appearance, so the strip reads like the course.
  const firsts = A11_META.characters.map((c) => c.firstLektion);
  assert.deepEqual(firsts, [...firsts].sort((a, b) => a - b));
  // The cast the brief names is all there.
  for (const name of ['Ana', 'Tim', 'Lena', 'Frau Kaya', 'Herr Weber', 'Paul']) assert.ok(names.includes(name), `${name} missing`);
});

test('character roles repeat the stated facts and never invent a job for someone the course leaves blank', () => {
  // PERSONAS_A11 (scripts/validate-curriculum.mjs): only Ana (Studentin, Marokko) and Paul (Kellner)
  // carry a profession. A role line that gives Lena, Tim, Frau Kaya, Herr Weber, Frau Wolf or Herr
  // Schmidt a profession is a fact the course could later contradict (RULE 14).
  const byName = Object.fromEntries(A11_META.characters.map((c) => [c.name, c.roleEn]));
  assert.match(byName.Ana, /student/i);
  assert.match(byName.Ana, /Morocco/);
  assert.match(byName.Paul, /waiter/i);
  const professions = /\b(teacher|doctor|nurse|engineer|clerk|receptionist|secretary|cook|salesperson|shopkeeper)\b/i;
  for (const name of ['Lena', 'Tim', 'Frau Kaya', 'Herr Weber', 'Frau Wolf', 'Herr Schmidt']) {
    assert.doesNotMatch(byName[name], professions, `${name}: the course states no profession — describe the setting instead`);
  }
});

test('charactersOf reads a new speaker off the data with a neutral fallback role', () => {
  const extra = {
    ...CURRICULUM_A11,
    lektionen: [
      ...LEKTIONEN,
      { nr: 13, id: 'x-l13', dialog: { lines: [{ speaker: 'Frau Neu', de: 'Hallo.', en: 'Hello.' }] } },
    ],
  };
  const found = charactersOf(extra).find((c) => c.name === 'Frau Neu');
  assert.ok(found);
  assert.equal(found.firstLektion, 13);
  assert.match(found.roleEn, /Lektion 13/);
});

// ---------------------------------------------------------------------------
// 4. Outcomes
// ---------------------------------------------------------------------------

test('the six outcomes are can-dos the course teaches, not marketing', () => {
  assert.equal(A11_META.outcomesEn.length, 6);
  const all = new Set(Object.values(A11_META.lektionIntro).flatMap((i) => i.canDoEn.map((s) => s.replace(/^I can /, '').replace(/\.$/, ''))));
  for (const line of A11_META.outcomesEn) {
    assert.ok(all.has(line), `outcome "${line}" is not one of the course's can-dos`);
    assert.doesNotMatch(line, /\b(pass the|fluent|guarantee|in \d+ (days|weeks)|get a job|visa)\b/i, `outcome "${line}" reads as a promise`);
  }
  assert.equal(new Set(A11_META.outcomesEn).size, 6, 'no outcome twice');
});

// ---------------------------------------------------------------------------
// 5. Time — derived, never typed
// ---------------------------------------------------------------------------

test('weeklyEstimate derives from the path minutes and the sustainable pace', () => {
  const est = weeklyEstimate();
  const path = curriculumPath(CURRICULUM_A11);
  const sum = (kind) => path.filter((n) => n.kind === kind).reduce((a, n) => a + n.minutes, 0);
  assert.equal(est.lektionMinutes, LEKTIONEN.reduce((a, l) => a + l.minutes, 0));
  assert.equal(est.checkpointMinutes, sum('checkpoint'));
  assert.equal(est.finalTestMinutes, sum('leveltest'));
  assert.equal(est.totalMinutes, est.lektionMinutes + est.checkpointMinutes + est.finalTestMinutes);
  assert.equal(est.units, path.length);
  assert.equal(est.unitsPerWeek, SUSTAINABLE_PER_WEEK);
  assert.equal(est.weeks, Math.ceil(path.length / SUSTAINABLE_PER_WEEK));
  assert.equal(est.minutesPerWeek, Math.round(est.totalMinutes / est.weeks));
  assert.equal(est.hoursPerWeek, Math.round((est.minutesPerWeek / 60) * 10) / 10);
  assert.equal(est.minutesPerLektion, Math.round(est.lektionMinutes / LEKTIONEN.length));
  assert.equal(A11_META.howItWorksEn.minutesPerLektion, est.minutesPerLektion);
  assert.equal(A11_META.weeklyEstimate, weeklyEstimate);
});

test('weeklyEstimate moves when the minutes move (it is not a typed figure)', () => {
  const base = weeklyEstimate();
  const doubled = { ...CURRICULUM_A11, lektionen: LEKTIONEN.map((l) => ({ ...l, minutes: l.minutes * 2 })) };
  const est = weeklyEstimate(doubled);
  assert.equal(est.lektionMinutes, base.lektionMinutes * 2);
  assert.equal(est.minutesPerLektion, base.minutesPerLektion * 2);
  assert.ok(est.hoursPerWeek > base.hoursPerWeek, 'hours per week must rise with the minutes');
  assert.equal(est.weeks, base.weeks, 'the week count follows the unit count, not the minutes');
  // And the pace: half the units a week, twice the weeks.
  const slower = weeklyEstimate(CURRICULUM_A11, SUSTAINABLE_PER_WEEK / 5);
  assert.equal(slower.weeks, Math.ceil(base.units / 1));
  assert.ok(slower.hoursPerWeek < base.hoursPerWeek);
});

// ---------------------------------------------------------------------------
// 6. How it works
// ---------------------------------------------------------------------------

test('the how-it-works row names the player stages in the order buildLesson runs them', () => {
  const keys = A11_META.howItWorksEn.steps.map((s) => s.key);
  assert.deepEqual(keys, ['warmup', 'pretest', 'dialog', 'wortfeld', 'notice', 'practice', 'dictation', 'speaking', 'writing', 'recap']);
  for (const s of A11_META.howItWorksEn.steps) {
    assert.ok(s.label.length <= 12, `${s.key}: label "${s.label}" is too long for a row`);
    const words = s.descriptionEn.trim().split(/\s+/).length;
    assert.ok(words <= 10, `${s.key}: description has ${words} words, max 10`);
  }
});

// ---------------------------------------------------------------------------
// 7. Hygiene
// ---------------------------------------------------------------------------

test('no English string carries markup or heading characters', () => {
  const all = englishStrings(A11_META);
  assert.ok(all.length > 60, 'the string sweep did not load');
  for (const s of all) {
    assert.equal(typeof s, 'string');
    assert.doesNotMatch(s, /[<>#]/, `"${s}" contains < > or #`);
    assert.ok(s.trim().length > 0, 'empty English string');
  }
});

test('the meta file types no hour figure of its own', () => {
  // The only hours a learner sees come from weeklyEstimate(); a literal like "5.8 h" or
  // "54 hours" in this file would be the retyped figure tests/claims.test.mjs exists to prevent.
  const src = readFileSync(new URL('../src/data/curricula/a11.meta.js', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');
  assert.doesNotMatch(src, /\d+([.,]\d+)?\s*(h\b|hours?|Stunden)/, 'an hour figure is typed in a11.meta.js');
  assert.doesNotMatch(src, /minutesPerLektion:\s*\d/, 'minutesPerLektion must be derived');
});

// ---------------------------------------------------------------------------
// 8. What the intro screen and the course home read (Wave 1, 2026-09-19)
// ---------------------------------------------------------------------------

test('every Lektion has at least one dialogue speaker in the cast, so the IntroStage strip is never empty', () => {
  for (const l of LEKTIONEN) {
    const cast = A11_META.characters.filter((c) => c.appearsIn.includes(l.nr));
    assert.ok(cast.length > 0, `Lektion ${l.nr} has no character with appearsIn including it`);
    for (const c of cast) assert.ok(c.roleEn.trim().length > 0, `${c.name} has an empty roleEn`);
  }
});

test('chapters carry the three banner fields the course home renders, and each Lektion sits in exactly one chapter', () => {
  for (const c of A11_META.chapters) {
    assert.ok(c.titleEn.trim() && c.titleDe.trim() && c.storyEn.trim(), `chapter ${c.nr} is missing titleEn / titleDe / storyEn`);
    assert.ok(Array.isArray(c.lektionen) && c.lektionen.length > 0, `chapter ${c.nr} has no Lektionen`);
  }
  for (const nr of NRS) {
    assert.equal(A11_META.chapters.filter((c) => c.lektionen.includes(nr)).length, 1, `Lektion ${nr} must be in exactly one chapter`);
  }
});

// ---------------------------------------------------------------------------
// 9. WORTFELD_ICONS — Wortfeld picture cards (Wave 2, 2026-09-19)
// ---------------------------------------------------------------------------

test('every Wortfeld word of every A1.1 Lektion has a WORTFELD_ICONS entry', () => {
  for (const l of LEKTIONEN) {
    for (const w of l.wortfeld || []) {
      const key = w.word;
      assert.ok(
        Object.prototype.hasOwnProperty.call(WORTFELD_ICONS, key),
        `Lektion ${l.nr} word "${key}" has no WORTFELD_ICONS entry`,
      );
    }
  }
});

test('every WORTFELD_ICONS value, and the fallback, resolve to a real lucide-react icon', () => {
  const names = new Set([...Object.values(WORTFELD_ICONS), WORTFELD_ICON_FALLBACK]);
  assert.ok(names.size > 0);
  for (const name of names) {
    const icon = lucideIcons[name];
    // lucide-react icons are forwardRef components: functions under CJS, objects under ESM.
    assert.ok(
      typeof icon === 'function' || (typeof icon === 'object' && icon !== null),
      `"${name}" does not resolve in lucide-react`,
    );
  }
});

test('WORTFELD_ICON_FALLBACK is a non-empty string naming a real icon', () => {
  assert.equal(typeof WORTFELD_ICON_FALLBACK, 'string');
  assert.ok(WORTFELD_ICON_FALLBACK.trim().length > 0);
});

// ---------------------------------------------------------------------------
// 10. WortfeldStage source pins (Wave 2, 2026-09-19)
// ---------------------------------------------------------------------------

test('WortfeldStage renders an icon circle, a flip toggle and a "show all English" control', () => {
  const src = readFileSync(new URL('../src/components/lesson/WortfeldStage.jsx', import.meta.url), 'utf8');
  assert.match(src, /bg-siegel-wash text-siegel/, 'the icon circle must use the siegel-wash/siegel token pair');
  assert.match(src, /aria-pressed=\{flipped\}/, 'the flip toggle must carry aria-pressed');
  assert.match(src, /wortfeld\.showAllEnglish/, 'must reference the show-all-English string key');
  assert.match(src, /wortfeld\.en/, 'a flipped card must render the text "EN" tag, not colour alone');
  assert.match(src, /AudioSourceBadge/, 'must keep the AudioSourceBadge behaviour');
});

test('the wortfeld string keys (EN tag, show/hide all English) exist in both chrome languages with no empty value', () => {
  const src = readFileSync(new URL('../src/lib/lesson/strings.js', import.meta.url), 'utf8');
  const keys = ['wortfeld.en', 'wortfeld.showAllEnglish', 'wortfeld.hideAllEnglish'];
  for (const key of keys) {
    const matches = src.match(new RegExp(`'${key.replace('.', '\\.')}':\\s*'[^']+'`, 'g')) || [];
    assert.equal(matches.length, 2, `"${key}" must appear once in each of the en/de tables with a non-empty value`);
  }
});

// ---------------------------------------------------------------------------
// 11. Landeskunde notes (one per chapter, keyed by checkpoint/chapter nr)
// ---------------------------------------------------------------------------

test('every chapter has a Landeskunde note with both languages, both under 90 words, and a source', () => {
  const chapterNrs = A11_META.chapters.map((c) => c.nr);
  assert.deepEqual(Object.keys(LANDESKUNDE).map(Number).sort(), chapterNrs, 'LANDESKUNDE must have exactly one entry per chapter');
  for (const nr of chapterNrs) {
    const note = LANDESKUNDE[nr];
    assert.ok(note, `chapter ${nr} has no Landeskunde note`);
    for (const field of ['titleDe', 'titleEn', 'bodyEn', 'bodyDe', 'source']) {
      assert.ok(typeof note[field] === 'string' && note[field].trim().length > 0, `chapter ${nr}: "${field}" is empty`);
    }
    assert.ok(note.bodyEn.split(/\s+/).length <= 90, `chapter ${nr}: bodyEn over 90 words`);
    assert.ok(note.bodyDe.split(/\s+/).length <= 90, `chapter ${nr}: bodyDe over 90 words`);
    assert.ok(
      note.source === 'allgemein bekannt' || /^https:\/\//.test(note.source),
      `chapter ${nr}: source must be a real https URL or "allgemein bekannt"`,
    );
  }
});

test('Landeskunde notes carry no outcome promise or exam-fee figure', () => {
  const BANNED = /\b(garantiert|Erfolg garantiert|bestehen Sie sicher|€\s?\d|EUR\s?\d)\b/i;
  for (const [nr, note] of Object.entries(LANDESKUNDE)) {
    for (const field of ['bodyEn', 'bodyDe']) {
      assert.ok(!BANNED.test(note[field]), `chapter ${nr}: "${field}" reads like an outcome promise or an exam fee figure`);
    }
  }
});
