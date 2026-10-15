// Measures DaF review #3 (A1.2) BLOCKER 1 for a level: does the answer key reject correct German the
// GERMAN prompt allows? For every item the draw serves (both attempts) and every checkpoint item, it
// builds the alternatives a teacher accepts for the item's family and runs each through the real
// checker, exactly as PracticeItem.jsx calls it. One line per rejected alternative; exit 1 when any.
//
//   node scripts/a12-determinacy.mjs [level]
//
// The families (each a class the review measured, never an id):
//   - a du-imperative of a regular verb, with and without -e („Mach / Mache den Fernseher aus!");
//   - a contraction whose cue spells out its two words („(an + dem)") without asking for the short form;
//   - „Sie ___ … (nehmen, sie)" with a singular key — sie is also they, Sie also the formal you;
//   - a multiple choice among different modal verbs with no meaning named in the German prompt;
//   - a sentence whose key opens with a place phrase („Am Platz ist die Haltestelle.") or ends with a
//     für-phrase („Ich kaufe die Jacke für meine Oma."): the other order is the same sentence.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { planPractice, poolItems } from '../src/lib/lesson/buildLesson.js';
import { buildCheckpoint } from '../src/lib/checkpoint/buildCheckpoint.js';
import { anyCurriculumFor } from '../src/data/curricula/index.js';

const MODAL_LEMMA = {
  kann: 'können', kannst: 'können', können: 'können', könnt: 'können',
  muss: 'müssen', musst: 'müssen', müssen: 'müssen', müsst: 'müssen',
  darf: 'dürfen', darfst: 'dürfen', dürfen: 'dürfen', dürft: 'dürfen',
  soll: 'sollen', sollst: 'sollen', sollen: 'sollen', sollt: 'sollen',
  will: 'wollen', willst: 'wollen', wollen: 'wollen', wollt: 'wollen',
  möchte: 'mögen', möchtest: 'mögen', möchten: 'mögen', möchtet: 'mögen',
};
const PAIR_CUE_RE = /\(((?:an|in|zu|von|bei) \+ (?:dem|der|das))\)/;
const STEM_CHANGE_IMPERATIVE_RE = /^(?:iss|nimm|gib|lies|sieh|hilf|sprich|triff|vergiss|wirf|brich|tritt|miss|lass)$/i;
const E_REQUIRED_RE = /(?:t|d|chn|ffn|tm|gn|dm)e$/i;
const strip = (s) => String(s || '').replace(/[.!?]+$/, '').trim();
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const upperFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Alternatives a teacher accepts for this item, by family. Each is { text, why }. */
export function alternatives(item) {
  const out = [];
  // A checkpoint item carries its prompt as promptDe: read it, or its cue (Beginnen Sie mit …) is unseen.
  const q = String(item.questionDe || item.promptDe || '');
  const key = String(item.answer || '').trim();
  // du-imperative ±e
  const imp = item.topic === 'imperative' && key.match(/^([A-ZÄÖÜ][a-zäöüß]+)((?:\s+[^!]*)?)!$/);
  if (imp && !/^\s*(?:Sie|ihr|wir)\b/.test(imp[2]) && !STEM_CHANGE_IMPERATIVE_RE.test(imp[1]) && !/t$/.test(imp[1])) {
    const other = /e$/.test(imp[1]) ? (E_REQUIRED_RE.test(imp[1]) ? null : imp[1].slice(0, -1)) : `${imp[1]}e`;
    if (other) out.push({ text: `${other}${imp[2]}!`, why: 'du-imperative ±e' });
  }
  // a cue that spells out the contraction's two words, without asking for the short form
  const pair = q.match(PAIR_CUE_RE);
  if (pair && !/kurzform/i.test(q) && /^(?:am|im|zum|zur|vom|beim|ins|ans)$/i.test(key)) {
    out.push({ text: pair[1].replace(' + ', ' '), why: 'the cue says the two words' });
  }
  // sie = she or they
  const sie = q.match(/^Sie ___.*\(([a-zäöüß]+en), sie\)/);
  if (sie && /t$/.test(key)) out.push({ text: sie[1], why: 'sie = they / Sie formal' });
  // different modal verbs, no meaning named
  if (item.type === 'multiple_choice' && Array.isArray(item.options) && MODAL_LEMMA[key.toLowerCase()]) {
    const lemmas = new Set(item.options.map((o) => MODAL_LEMMA[strip(o).toLowerCase()]).filter(Boolean));
    const named = /\((?:können|müssen|dürfen|sollen|wollen|mögen|möchten)\)/.test(q);
    if (lemmas.size > 1 && !named) {
      for (const o of item.options) {
        const lemma = MODAL_LEMMA[strip(o).toLowerCase()];
        if (lemma && lemma !== MODAL_LEMMA[key.toLowerCase()]) out.push({ text: strip(o), why: 'another modal verb fits; the prompt names no meaning' });
      }
    }
  }
  // word order: a place phrase or a für-phrase can open the sentence or follow the verb
  if (item.type === 'sentence_building' && !/\(Beginnen Sie mit /.test(q) && !/\bfrage\b/i.test(q)) {
    const placeFirst = strip(key).match(/^((?:Am|Im|Auf dem|Auf der|In der|In dem|Neben der|Neben dem|An der|Vor dem|Vor der) \S+) (ist|sind|steht|stehen|liegt|liegen) (.+)$/);
    if (placeFirst) out.push({ text: `${upperFirst(placeFirst[3])} ${placeFirst[2]} ${lowerFirst(placeFirst[1])}.`, why: 'subject-first order' });
    const fuerLast = strip(key).match(/^(\S+) (\S+) (.+) (für (?:mein|dein|sein|ihr|unser|euer|den|die|das|einen|eine|ein)\S* \S+)$/);
    if (fuerLast) out.push({ text: `${upperFirst(fuerLast[4])} ${fuerLast[2]} ${lowerFirst(fuerLast[1])} ${fuerLast[3]}.`, why: 'für-phrase first' });
  }
  return out;
}

/** Every served item of a level: both practice attempts and the four checkpoints (seeds 1 and default). */
export function servedItems(level, poolFile = new URL(`../src/data/lessonPools/${level.replace('.', '')}.json`, import.meta.url)) {
  const curriculum = anyCurriculumFor(level);
  const pool = JSON.parse(readFileSync(poolFile, 'utf8'));
  const out = new Map();
  for (const attempt of [1, 2]) for (const [nr, items] of planPractice(curriculum, pool, attempt)) for (const it of items) out.set(it.id, { ...it, where: `L${nr}` });
  for (const checkpoint of curriculum.checkpoints || []) {
    for (const seed of [undefined, 1]) {
      for (const it of buildCheckpoint({ curriculum, checkpoint, pool, seed })) if (it.answer) out.set(it.id, { ...it, where: checkpoint.id });
    }
  }
  return { items: [...out.values()], poolSize: poolItems(pool).length };
}

/** The rejected alternatives of a level. */
export function rejectedAlternatives(level, poolFile) {
  const rejected = [];
  for (const item of servedItems(level, poolFile).items) {
    const accepted = item.accepted?.length ? item.accepted : [item.answer];
    for (const alt of alternatives(item)) {
      const r = checkAnswer(alt.text, accepted, checkOptionsFor(item));
      if (r.result !== RESULT.CORRECT && r.result !== RESULT.TYPO) rejected.push({ where: item.where, id: item.id, why: alt.why, q: item.questionDe || item.promptDe, key: item.answer, alt: alt.text, result: r.result });
    }
  }
  return rejected;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const level = process.argv[2] || 'a1.2';
  const rejected = rejectedAlternatives(level);
  for (const r of rejected) console.log(`${r.where} ${r.id} [${r.why}] ${JSON.stringify(String(r.q ?? '')).slice(0, 90)} key=${JSON.stringify(r.key)} alt=${JSON.stringify(r.alt)} → ${r.result}`);
  console.log(`${level}: ${servedItems(level).items.length} served items, ${rejected.length} correct alternatives rejected`);
  process.exit(rejected.length ? 1 : 0);
}
