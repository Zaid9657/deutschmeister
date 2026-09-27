// EXM-04 — speaking tasks, part by part (a task may be a multi-Teil round of 2–3 parts): mode =
// the template's interaction; preparation minutes = the template's (else the lane's) and
// prepAtHome as the template; cards / moves / keyPoints present where the mode needs them; the
// template's `speaking` design — stimulus, partnerData (the AI partner's side), topicChoice
// (from/pick and that many topics), seconds and turns within its band; the rubric profile of the
// template; a planning round in every B1 unit (BLUEPRINT §9.1, §2.8; SCHEMA §8 SpeakingPart).

import { walkTasks, speakingParts } from '../lib-validate/walk.mjs';
import { arr, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'EXM-04';
export const title = 'Speaking tasks match their template (mode, preparation, cards/moves, stimulus, length, rubric)';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'T';

const within = (inner, outer) => Array.isArray(inner) && inner.length === 2 && Array.isArray(outer) && outer.length === 2
  && inner[0] <= inner[1] && inner[0] >= outer[0] && inner[1] <= outer[1];

function checkPart(ctx, doc, part, path, ref, findings) {
  if (['cards-ask', 'cards-request'].includes(part.mode)) {
    if (!isObj(part.cards) || !arr(part.cards.learner).length || !arr(part.cards.partner).length) findings.push(blocker(doc, `${path}.cards`, `mode ${part.mode} needs cards for the learner and the partner`, ref));
  }
  if (part.mode === 'plan-together' && !arr(part.moves).length) findings.push(blocker(doc, `${path}.moves`, 'plan-together needs its moves (vorschlagen, reagieren, …)', ref));
  if (part.mode === 'mediate' && !arr(part.keyPoints).length) findings.push(blocker(doc, `${path}.keyPoints`, 'mode mediate is scored on coverage: keyPoints are required', ref));
  const entry = ctx.registries.templates.get(part.template);
  if (!entry) return;
  const t = entry.template;
  if (t.task !== 'speaking') {
    findings.push(blocker(doc, `${path}.template`, `${part.template} is a ${t.task} Teil, not a speaking Teil`, ref));
    return;
  }
  if (t.interaction && part.mode !== t.interaction) findings.push(blocker(doc, `${path}.mode`, `mode ${part.mode}; ${part.template} is ${t.interaction}`, ref));
  const lanePrep = ctx.registries.lanes.get(entry.lane)?.data?.modules?.sprechen?.prepMinutes;
  const want = typeof t.prepMinutes === 'number' ? t.prepMinutes : lanePrep;
  if (typeof want === 'number' && part.prepMinutes !== want) findings.push(blocker(doc, `${path}.prepMinutes`, `${part.prepMinutes} min preparation; ${part.template} has ${want}`, ref));
  if (Boolean(part.prepAtHome) !== Boolean(t.prepAtHome)) findings.push(blocker(doc, `${path}.prepAtHome`, `prepAtHome ${Boolean(part.prepAtHome)}; ${part.template} ${t.prepAtHome ? 'is prepared at home' : 'is prepared in the session'}`, ref));
  if (t.rubric && part.profile !== t.rubric) findings.push(blocker(doc, `${path}.profile`, `rubric profile ${part.profile}; ${part.template} is graded with ${t.rubric}`, ref));
  const sp = isObj(t.speaking) ? t.speaking : null;
  if (!sp) return;
  if (sp.stimulus && !['none', 'topicChoice'].includes(sp.stimulus)) {
    if (!isObj(part.stimulus)) findings.push(blocker(doc, `${path}.stimulus`, `${part.template} works from a ${sp.stimulus} stimulus; the part has none`, ref));
    else if (part.stimulus.kind !== sp.stimulus) findings.push(blocker(doc, `${path}.stimulus.kind`, `stimulus ${part.stimulus.kind}; ${part.template} uses ${sp.stimulus}`, ref));
  } else if (sp.stimulus === 'none' && isObj(part.stimulus)) {
    findings.push(blocker(doc, `${path}.stimulus`, `${part.template} has no stimulus`, ref));
  }
  if (sp.partnerData === true && !isObj(part.partnerData)) findings.push(blocker(doc, `${path}.partnerData`, `${part.template} is an information gap: the AI partner's data are required`, ref));
  if (sp.partnerData === false && isObj(part.partnerData)) findings.push(blocker(doc, `${path}.partnerData`, `${part.template} has no partner data`, ref));
  const tc = sp.topicChoice || (sp.stimulus === 'topicChoice' ? {} : null);
  if (tc) {
    const p = part.topicChoice;
    if (!isObj(p)) findings.push(blocker(doc, `${path}.topicChoice`, `${part.template} lets the candidate choose a topic; topicChoice is required`, ref));
    else {
      if (typeof tc.from === 'number' && p.from !== tc.from) findings.push(blocker(doc, `${path}.topicChoice.from`, `choice from ${p.from}; ${part.template} offers ${tc.from}`, ref));
      if (typeof tc.pick === 'number' && p.pick !== tc.pick) findings.push(blocker(doc, `${path}.topicChoice.pick`, `pick ${p.pick}; ${part.template} picks ${tc.pick}`, ref));
      if (arr(p.topics).length !== p.from) findings.push(blocker(doc, `${path}.topicChoice.topics`, `${arr(p.topics).length} topics for a choice from ${p.from}`, ref));
    }
  } else if (isObj(part.topicChoice)) {
    findings.push(blocker(doc, `${path}.topicChoice`, `${part.template} has no topic choice`, ref));
  }
  for (const k of ['seconds', 'turns']) {
    if (Array.isArray(sp[k]) && part[k] !== undefined && !within(part[k], sp[k])) findings.push(blocker(doc, `${path}.${k}`, `${k} [${arr(part[k]).join(', ')}] outside ${part.template}'s band [${sp[k].join(', ')}]`, ref));
  }
}

export function run({ ctx, docs }) {
  const findings = [];
  let tasks = 0;
  for (const doc of docs) {
    for (const { task, kind, path, source } of walkTasks(doc)) {
      if (kind !== 'speaking') continue;
      tasks += 1;
      const ref = task.bankKey;
      const parts = speakingParts(task);
      if (Array.isArray(task.parts) && (task.parts.length < 2 || task.parts.length > 3)) findings.push(blocker(doc, `${path}.parts`, `${task.parts.length} parts; a multi-Teil round has 2–3`, ref));
      for (const { part, path: pp } of parts) {
        if (!isObj(part)) continue;
        const entry = ctx.registries.templates.get(part.template);
        if (entry && task.lane && task.lane !== entry.lane) findings.push(blocker(doc, `${path}${pp}.template`, `task lane ${task.lane}, template ${part.template} belongs to ${entry.lane}`, ref));
        checkPart(ctx, doc, part, `${path}${pp}`, ref, findings);
      }
      if (String(doc.level).startsWith('b1') && doc.kind === 'unit' && source === 'ls5') {
        const hasRound = [task, ...parts.map((x) => x.part)].some((x) => isObj(x?.planningRound) && x.planningRound.minutes >= 3);
        if (!hasRound) findings.push(blocker(doc, `${path}.planningRound`, 'every B1 unit carries a planning round of ≥ 3 min', ref));
      }
    }
  }
  return tasks ? { findings } : { findings, skipped: 'no speaking task in the target yet' };
}
