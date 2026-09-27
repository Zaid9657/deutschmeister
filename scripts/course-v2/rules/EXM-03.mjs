// EXM-03 — writing tasks: Leitpunkt count = template; `choose` for 3-of-4 lanes; Anrede/Gruß never
// a Leitpunkt; register, word band, rubric profile and exam key per template and lane
// (BLUEPRINT §9.1). The sd1 S1 form (5 fields) is an item block: EXM-01 checks its count.

import { walkTasks } from '../lib-validate/walk.mjs';
import { LANE_EXAM_KEY } from '../lib-validate/ids.mjs';
import { arr, blocker, advisory } from '../lib-validate/helpers.mjs';

export const id = 'EXM-03';
export const title = 'Writing tasks match their template (Leitpunkte, choose, register, words, rubric, exam key)';
export const type = 'hard';
export const scope = 'unit';

const GREETING_RE = /\b(?:Anrede|Gruß|Grüße|Grußformel|Schlussformel|begrüßen Sie|grüßen Sie|verabschieden Sie sich)\b/i;

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
      if (!entry) continue;
      const t = entry.template;
      if (task.lane && task.lane !== entry.lane) findings.push(blocker(doc, `${path}.lane`, `task lane ${task.lane}, template ${task.template} belongs to ${entry.lane}`, ref));
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
      if (band.length === 2) {
        if (typeof w.min === 'number' && typeof w.max === 'number' && (band[0] !== w.min || band[1] !== w.max)) findings.push(blocker(doc, `${path}.wordBand`, `word band ${band.join('–')}; ${task.template} is ${w.min}–${w.max}`, ref));
        else if (typeof w.min === 'number' && typeof w.max !== 'number' && band[0] < w.min) findings.push(blocker(doc, `${path}.wordBand`, `word band starts at ${band[0]}; ${task.template} needs ≥ ${w.min}`, ref));
        else if (typeof w.target === 'number' && typeof w.min !== 'number' && (band[0] > w.target || band[1] < w.target)) findings.push(blocker(doc, `${path}.wordBand`, `word band ${band.join('–')} excludes the target ≈ ${w.target} of ${task.template}`, ref));
        if (typeof task.minSubmitWords === 'number' && task.minSubmitWords !== Math.ceil(band[0] * 0.5)) findings.push(advisory(doc, `${path}.minSubmitWords`, `minSubmitWords ${task.minSubmitWords}; the completion rule is 50 % of the lower bound (${Math.ceil(band[0] * 0.5)})`, ref));
      }
    }
  }
  return tasks ? { findings } : { findings, skipped: 'no writing task in the target yet' };
}
