// EXM-04 — speaking tasks: mode = the template's interaction; preparation minutes = the template's
// (else the lane's); cards / moves present where the mode needs them; the rubric profile of the
// template; a planning round in every B1 unit (BLUEPRINT §9.1, §2.8).

import { walkTasks } from '../lib-validate/walk.mjs';
import { arr, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'EXM-04';
export const title = 'Speaking tasks match their template (mode, preparation, cards/moves, rubric)';
export const type = 'hard';
export const scope = 'unit';

export function run({ ctx, docs }) {
  const findings = [];
  let tasks = 0;
  for (const doc of docs) {
    for (const { task, kind, path, source } of walkTasks(doc)) {
      if (kind !== 'speaking') continue;
      tasks += 1;
      const ref = task.bankKey;
      const entry = ctx.registries.templates.get(task.template);
      if (['cards-ask', 'cards-request'].includes(task.mode)) {
        if (!isObj(task.cards) || !arr(task.cards.learner).length || !arr(task.cards.partner).length) findings.push(blocker(doc, `${path}.cards`, `mode ${task.mode} needs cards for the learner and the partner`, ref));
      }
      if (task.mode === 'plan-together' && !arr(task.moves).length) findings.push(blocker(doc, `${path}.moves`, 'plan-together needs its moves (vorschlagen, reagieren, …)', ref));
      if (String(doc.level).startsWith('b1') && doc.kind === 'unit' && source === 'ls5') {
        if (!isObj(task.planningRound) || !(task.planningRound.minutes >= 3)) findings.push(blocker(doc, `${path}.planningRound`, 'every B1 unit carries a planning round of ≥ 3 min', ref));
      }
      if (!entry) continue;
      const t = entry.template;
      if (task.lane && task.lane !== entry.lane) findings.push(blocker(doc, `${path}.lane`, `task lane ${task.lane}, template ${task.template} belongs to ${entry.lane}`, ref));
      if (t.task !== 'speaking') {
        findings.push(blocker(doc, `${path}.template`, `${task.template} is a ${t.task} Teil, not a speaking Teil`, ref));
        continue;
      }
      if (t.interaction && task.mode !== t.interaction) findings.push(blocker(doc, `${path}.mode`, `mode ${task.mode}; ${task.template} is ${t.interaction}`, ref));
      const lanePrep = ctx.registries.lanes.get(entry.lane)?.data?.modules?.sprechen?.prepMinutes;
      const want = typeof t.prepMinutes === 'number' ? t.prepMinutes : lanePrep;
      if (typeof want === 'number' && task.prepMinutes !== want) findings.push(blocker(doc, `${path}.prepMinutes`, `${task.prepMinutes} min preparation; ${task.template} has ${want}`, ref));
      if (t.rubric && task.profile !== t.rubric) findings.push(blocker(doc, `${path}.profile`, `rubric profile ${task.profile}; ${task.template} is graded with ${t.rubric}`, ref));
    }
  }
  return tasks ? { findings } : { findings, skipped: 'no speaking task in the target yet' };
}
