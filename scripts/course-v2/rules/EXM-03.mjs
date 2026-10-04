// EXM-03 — writing tasks: Leitpunkt count = template; `choose` for 3-of-4 lanes; Anrede/Gruß never
// a Leitpunkt; register, word band, rubric profile and exam key per template and lane
// (BLUEPRINT §9.1). A form_fill Teil (sd1.s1, ta2.s1) is a WritingTask with a `form` whose field
// count is the template's `items` (sd1.s1: exactly 5) and needs no word band (SCHEMA §8 WritingTask).
//
// Rail extensions (rule-smith 2026-09-27):
//   - one number on the screen: the word counts taskDe and the checklist state are the band the player
//     shows (wordBandLearning when present, else wordBand; WritingTaskView reads it so), except where
//     the sentence names the exam („Prüfung: mindestens 150"), which is wordBand; the model text lies in
//     the shown band (advisory when it lies in the exam band instead) (review a1.1-u04 r2 F05);
//   - Leitpunkt cues are what the pre-check searches for as substrings: each has ≥ 4 letters or digits
//     („am" is inside „Reklamation"), and none is a connector the checklist already requires (obwohl,
//     trotzdem …), which would tick the Leitpunkt for any text (review b1.1-u04 r2 F08). ADVISORY: the
//     finding was minor, the SCHEMA §15 exemplar carries „am"/„um" cues, and the defect sits in the
//     pre-check's substring match (WritingTaskView cueFound and its server twin) — whole-word matching
//     there is the fix for every unit at once.
//
// Third round (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c: a1.1-u05 r3 F01): a form field whose
// answer mixes words and a digit run — an address („Berliner Straße 21"), a time („19.30 Uhr") — takes
// exact: "number" (digits exact, a slip in the words a TYPO), not "name" (which turns a slip in „Straße" into
// WRONG); "name" is for an answer that is wholly a name, and for a level or room code (ITM-07 IDENTIFIER_RE).
// ADVISORY: both settings grade the digits exactly; the finding is about the words around them.

import { walkTasks } from '../lib-validate/walk.mjs';
import { LANE_EXAM_KEY } from '../lib-validate/ids.mjs';
import { arr, isObj, blocker, advisory } from '../lib-validate/helpers.mjs';
import { norm, wordCount, FUNCTION_WORDS } from '../lib-validate/text.mjs';
import { IDENTIFIER_RE } from './ITM-07.mjs';

export const id = 'EXM-03';
export const title = 'Writing tasks match their template (Leitpunkte, choose, register, words, rubric, exam key)';
export const type = 'mixed';
export const scope = 'unit';
export const stage = 'T';

const GREETING_RE = /\b(?:Anrede|Gruß|Grüße|Grußformel|Schlussformel|begrüßen Sie|grüßen Sie|verabschieden Sie sich)\b/i;
const CONNECTORS = new Set(['obwohl', 'trotzdem', 'weil', 'denn', 'deshalb', 'deswegen', 'darum', 'dass', 'wenn', 'falls', 'damit', 'sodass', 'außerdem', 'aber', 'und', 'oder']);

/** Word-count statements in a text: [{ lo, hi, kind, exam }] — „20 bis 30 Wörter", „mind. 150 Wörter", „etwa 120 Wörter". */
function wordStatements(text) {
  const out = [];
  for (const seg of String(text || '').split(/[()\n;]|\.\s/)) {
    const exam = /Prüfung|telc|Goethe/i.test(seg);
    for (const m of seg.matchAll(/(\d+)\s*(?:bis|–|-)\s*(\d+)\s*Wört/g)) out.push({ lo: Number(m[1]), hi: Number(m[2]), kind: 'range', exam, text: m[0] });
    for (const m of seg.matchAll(/(?:mindestens|mind\.|min\.)\s*(\d+)\s*Wört/gi)) out.push({ lo: Number(m[1]), hi: null, kind: 'min', exam, text: m[0] });
    for (const m of seg.matchAll(/(?:höchstens|max\.)\s*(\d+)\s*Wört/gi)) out.push({ lo: null, hi: Number(m[1]), kind: 'max', exam, text: m[0] });
    for (const m of seg.matchAll(/(?:etwa|ca\.|ungefähr|rund)\s*(\d+)\s*Wört/gi)) out.push({ lo: Number(m[1]), hi: Number(m[1]), kind: 'about', exam, text: m[0] });
  }
  return out;
}

/** Does a statement agree with a band [lo, hi]? */
function agrees(st, band) {
  if (st.kind === 'range') return st.lo === band[0] && st.hi === band[1];
  if (st.kind === 'min') return st.lo === band[0];
  if (st.kind === 'max') return st.hi === band[1];
  return st.lo >= band[0] && st.lo <= band[1];
}

const thirdCache = new WeakMap();
/** „komme" → „kommt" when the cumulative lexicon has a verb whose 3rd person is stem + t; else null. */
export function firstPersonThird(ctx, cue) {
  const c = String(cue || '').trim().toLowerCase();
  // a possessive or particle („meine", „bitte") is no verb form
  if (!/^\p{Ll}{3,}e$/u.test(c) || !ctx?.levels || FUNCTION_WORDS.has(c)) return null;
  if (!thirdCache.has(ctx)) {
    const m = new Map();
    const other = new Set();
    for (const slot of ctx.levels.values()) {
      for (const e of arr(slot?.lexicon?.entries)) {
        const lemma = String(e?.lemma || '').toLowerCase();
        if (e?.pos !== 'VERB') other.add(lemma);
        if (e?.pos !== 'VERB' || !/en$|ern$|eln$/.test(lemma) || /\s/.test(lemma)) continue;
        const stem = lemma.replace(/e?n$/, '');
        const third = String(e?.verb_forms?.['3sg'] || '').toLowerCase().split(/\s+/)[0];
        if (third && third !== `${stem}e`) m.set(`${stem}e`, third);
      }
    }
    for (const w of other) m.delete(w);
    thirdCache.set(ctx, m);
  }
  return thirdCache.get(ctx).get(c) || null;
}

export function run({ ctx, docs }) {
  const findings = [];
  let tasks = 0;
  for (const doc of docs) {
    for (const { task, kind, path } of walkTasks(doc)) {
      if (kind !== 'writing') continue;
      tasks += 1;
      const ref = task.bankKey;
      const entry = ctx.registries.templates.get(task.template);
      const lp = arr(task.leitpunkte);
      lp.forEach((l, i) => { if (GREETING_RE.test(String(l?.de || ''))) findings.push(blocker(doc, `${path}.leitpunkte[${i}]`, `„${l.de}" — Anrede and Gruß are never a Leitpunkt`, ref)); });
      const lpIds = lp.map((l) => l?.id);
      if (new Set(lpIds).size !== lpIds.length) findings.push(blocker(doc, `${path}.leitpunkte`, 'Leitpunkt ids repeat', ref));
      if (task.lane && LANE_EXAM_KEY[task.lane] && task.examKey !== LANE_EXAM_KEY[task.lane]) findings.push(blocker(doc, `${path}.examKey`, `examKey ${task.examKey}; lane ${task.lane} is ${LANE_EXAM_KEY[task.lane]}`, ref));
      if (!entry) {
        if (!isObj(task.form) && arr(task.wordBand).length !== 2) findings.push(blocker(doc, `${path}.wordBand`, 'a writing task without a form needs its wordBand', ref));
        continue;
      }
      const t = entry.template;
      if (task.lane && task.lane !== entry.lane) findings.push(blocker(doc, `${path}.lane`, `task lane ${task.lane}, template ${task.template} belongs to ${entry.lane}`, ref));
      if (t.task === 'form_fill') {
        if (!isObj(task.form)) {
          findings.push(blocker(doc, `${path}.form`, `${task.template} is a form: the task needs form.fields`, ref));
          continue;
        }
        const fields = arr(task.form.fields);
        if (typeof t.items === 'number' && fields.length !== t.items) findings.push(blocker(doc, `${path}.form.fields`, `${fields.length} form fields; ${task.template} has exactly ${t.items}`, ref));
        const ids = fields.map((f) => f?.id);
        if (new Set(ids).size !== ids.length) findings.push(blocker(doc, `${path}.form.fields`, 'form field ids repeat', ref));
        fields.forEach((f, i) => {
          if (!isObj(f) || !f.id || !f.labelDe || typeof f.answer !== 'string' || !f.answer.trim()) {
            findings.push(blocker(doc, `${path}.form.fields[${i}]`, 'a form field needs id, labelDe and answer', ref));
            return;
          }
          if (!arr(f.accepted).some((a) => norm(a) === norm(f.answer))) findings.push(blocker(doc, `${path}.form.fields[${i}].accepted`, `accepted does not contain the answer „${f.answer}"`, ref));
          if (/\d/.test(f.answer) && !f.exact) findings.push(blocker(doc, `${path}.form.fields[${i}].exact`, `answer „${f.answer}" carries a digit: set exact (ITM-07)`, ref));
          if (f.exact === 'name' && /\p{L}{2,}/u.test(f.answer) && /\d/.test(f.answer) && !IDENTIFIER_RE.test(f.answer)) findings.push(advisory(doc, `${path}.form.fields[${i}].exact`, `answer „${f.answer}" mixes words and a number: exact: "number" (digits exact, a slip in the words a TYPO), not "name"`, ref));
        });
        if (task.profile && t.rubric && task.profile !== t.rubric) findings.push(blocker(doc, `${path}.profile`, `rubric profile ${task.profile}; ${task.template} is graded with ${t.rubric}`, ref));
        continue;
      }
      if (isObj(task.form)) findings.push(blocker(doc, `${path}.form`, `${task.template} is a ${t.task} Teil, not a form`, ref));
      if (t.task !== 'writing') {
        findings.push(blocker(doc, `${path}.template`, `${task.template} is a ${t.task} Teil, not a writing Teil`, ref));
        continue;
      }
      if (t.choose) {
        if (!task.choose || task.choose.from !== t.choose.from || task.choose.pick !== t.choose.pick) findings.push(blocker(doc, `${path}.choose`, `${task.template} is ${t.choose.pick} of ${t.choose.from}: set choose {from: ${t.choose.from}, pick: ${t.choose.pick}}`, ref));
        if (lp.length !== t.choose.from) findings.push(blocker(doc, `${path}.leitpunkte`, `${lp.length} Leitpunkte; ${task.template} offers ${t.choose.from} to choose from`, ref));
      } else {
        if (task.choose) findings.push(blocker(doc, `${path}.choose`, `${task.template} has no choice of Leitpunkte`, ref));
        if (typeof t.leitpunkte === 'number' && lp.length !== t.leitpunkte) findings.push(blocker(doc, `${path}.leitpunkte`, `${lp.length} Leitpunkte; ${task.template} has ${t.leitpunkte}`, ref));
      }
      if (t.register && task.register !== t.register) findings.push(blocker(doc, `${path}.register`, `register ${task.register}; ${task.template} is ${t.register}`, ref));
      if (t.rubric && task.profile !== t.rubric) findings.push(blocker(doc, `${path}.profile`, `rubric profile ${task.profile}; ${task.template} is graded with ${t.rubric}`, ref));
      const band = arr(task.wordBand);
      const w = t.words || {};
      if (band.length !== 2) findings.push(blocker(doc, `${path}.wordBand`, `${task.template} is a free-text Teil: the task needs its wordBand`, ref));
      else {
        if (typeof w.min === 'number' && typeof w.max === 'number' && (band[0] !== w.min || band[1] !== w.max)) findings.push(blocker(doc, `${path}.wordBand`, `word band ${band.join('–')}; ${task.template} is ${w.min}–${w.max}`, ref));
        else if (typeof w.min === 'number' && typeof w.max !== 'number' && band[0] < w.min) findings.push(blocker(doc, `${path}.wordBand`, `word band starts at ${band[0]}; ${task.template} needs ≥ ${w.min}`, ref));
        else if (typeof w.target === 'number' && typeof w.min !== 'number' && (band[0] > w.target || band[1] < w.target)) findings.push(blocker(doc, `${path}.wordBand`, `word band ${band.join('–')} excludes the target ≈ ${w.target} of ${task.template}`, ref));
        if (typeof task.minSubmitWords === 'number' && task.minSubmitWords !== Math.ceil(band[0] * 0.5)) findings.push(advisory(doc, `${path}.minSubmitWords`, `minSubmitWords ${task.minSubmitWords}; the completion rule is 50 % of the lower bound (${Math.ceil(band[0] * 0.5)})`, ref));
        const shown = arr(task.wordBandLearning).length === 2 ? task.wordBandLearning : band;
        const said = [['taskDe', task.taskDe], ...arr(task.checklist).map((c, i) => [`checklist[${i}]`, c])];
        for (const [where, text] of said) {
          for (const st of wordStatements(text)) {
            const against = st.exam ? band : shown;
            if (!agrees(st, against)) findings.push(blocker(doc, `${path}.${where}`, `„${st.text}" — the ${st.exam ? 'exam band (wordBand)' : 'band the player shows'} is ${against.join('–')}`, ref));
          }
        }
        if (task.modelText) {
          const n = wordCount(task.modelText);
          if (n < shown[0] || n > shown[1]) {
            const inExam = n >= band[0] && n <= band[1];
            findings.push((inExam ? advisory : blocker)(doc, `${path}.modelText`, `model text of ${n} words outside the band the player shows (${shown.join('–')})${inExam ? `; it fits the exam band ${band.join('–')}` : ''}`, ref));
          }
        }
      }
      // the frame every compliant draft carries: the checklist's Anrede and Gruß, the model text's first and
      // last lines — a cue found there ticks its Leitpunkt for any text (a1.1-u11 r2 F05: lp2 „zusammen")
      const mtLines = String(task.modelText || '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
      const frame = [...arr(task.checklist).map((x) => String(x || '')).filter((x) => /^\s*(?:Anrede|Gruß|Grußformel)\b/i.test(x)).map((x) => x.replace(/^[^:]*:?/, '')), mtLines.length > 2 ? mtLines[0] : '', ...(mtLines.length > 2 ? mtLines.slice(-2) : [])].join(' | ').toLowerCase();
      lp.forEach((l, i) => {
        const cueSet = new Set(arr(l?.cues).map((c) => String(c || '').trim().toLowerCase()));
        arr(l?.cues).forEach((c, k) => {
          const cue = String(c || '').trim();
          if (cue.length >= 3 && frame.includes(cue.toLowerCase())) findings.push(advisory(doc, `${path}.leitpunkte[${i}].cues[${k}]`, `cue „${cue}" stands in the Anrede or Gruß every draft carries — the pre-check finds it in any text; drop it or use a content word of the Leitpunkt`, ref));
          // a 1st-person verb cue („komme") misses the learner who writes about someone else („Mein Bruder kommt")
          // (a1.1-u10 r1 F17)
          const third = firstPersonThird(ctx, cue);
          if (third && !cueSet.has(third)) findings.push(advisory(doc, `${path}.leitpunkte[${i}].cues[${k}]`, `cue „${cue}" is a 1st-person verb form — list the 3rd person „${third}" too, or the pre-check misses a draft that tells about someone else`, ref));
          const letters = cue.replace(/[^\p{L}\p{N}]/gu, '').length;
          if (letters < 4) findings.push(advisory(doc, `${path}.leitpunkte[${i}].cues[${k}]`, `cue „${cue}" has ${letters} letters — as a substring it is found in unrelated words; use ≥ 4 letters`, ref));
          else if (CONNECTORS.has(cue.toLowerCase()) && arr(task.checklist).some((x) => new RegExp(`(^|[^\\p{L}])${cue}(?=$|[^\\p{L}])`, 'iu').test(String(x)))) findings.push(advisory(doc, `${path}.leitpunkte[${i}].cues[${k}]`, `cue „${cue}" is a connector the checklist already requires — it ticks the Leitpunkt for any text`, ref));
        });
      });
    }
  }
  return tasks ? { findings } : { findings, skipped: 'no writing task in the target yet' };
}
