// KEY-01 — writing, speaking and micro-output bank keys match BANK_KEY_RE (SCHEMA §2) and name
// their own slot: the level prefix, the unit / Plateau / closing / Modelltest slot, the kind
// (w · s · mo<LS>) and the lane suffix of a non-primary lane. Keys are unique per level. A unit's
// start.auftakt micro-output (A and B skeleton, 2026-09-28) takes the unnumbered `-mo` key.

import { walkTasks, walkMicroOutputs, walkSteps } from '../lib-validate/walk.mjs';
import { BANK_KEY_RE, LEGACY_COURSE_TASK_KEY_RE, prefixOfLevel } from '../lib-validate/ids.mjs';
import { primaryLane } from '../lib-validate/context.mjs';
import { blocker, advisory } from '../lib-validate/helpers.mjs';

export const id = 'KEY-01';
export const title = 'Bank keys match BANK_KEY_RE and their slot';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'T';

/** The slot segment a doc's keys must carry ('u07', 'p2', 'ht', 'dx', 'ma'). */
function slotOf(doc) {
  const d = doc.data || {};
  if (doc.kind === 'unit') return `u${String(d.nr ?? '').padStart(2, '0')}`;
  if (doc.kind === 'lanepack') return `u${String(d.unit || '').slice(-2)}`;
  if (doc.kind === 'plateau') return String(d.id || '').match(/-(p[1-3])$/)?.[1] || null;
  if (doc.kind === 'closing') return d.kind === 'diagnose' ? 'dx' : 'ht';
  if (doc.kind === 'mock') return d.form ? `m${d.form}` : null;
  return null;
}

export function run({ ctx, docs }) {
  const findings = [];
  const seen = new Map();
  let checked = 0;
  for (const doc of docs) {
    const prefix = prefixOfLevel(doc.level);
    const slot = slotOf(doc);
    const primary = primaryLane(ctx, doc.level);
    const check = (key, path, kind, { lane = null, lsNr = null } = {}) => {
      checked += 1;
      if (typeof key !== 'string' || !key) {
        findings.push(blocker(doc, path, 'bank key missing'));
        return;
      }
      const m = key.match(BANK_KEY_RE);
      if (!m) {
        if (LEGACY_COURSE_TASK_KEY_RE.test(key)) findings.push(blocker(doc, path, `"${key}" is a legacy live-course key; v2 content uses BANK_KEY_RE keys`, key));
        else findings.push(blocker(doc, path, `"${key}" does not match BANK_KEY_RE`, key));
        return;
      }
      const [, kPrefix, kSlot, kKind, kNr, kLane] = m;
      if (prefix && kPrefix !== prefix) findings.push(blocker(doc, path, `"${key}" carries prefix ${kPrefix}- but belongs to ${doc.level} (${prefix}-)`, key));
      if (slot && doc.kind !== 'mock' && kSlot !== slot) findings.push(blocker(doc, path, `"${key}" names slot ${kSlot} but sits in ${slot}`, key));
      if (slot && doc.kind === 'mock' && kSlot !== slot) findings.push(blocker(doc, path, `"${key}" names form ${kSlot} but the module is form ${slot}`, key));
      if (kKind !== kind) findings.push(blocker(doc, path, `"${key}" is a ${kKind} key on a ${kind === 'w' ? 'writing task' : kind === 's' ? 'speaking task' : 'micro-output'}`, key));
      if (kind === 'mo') {
        if (kLane) findings.push(blocker(doc, path, `micro-output key "${key}" carries a lane suffix`, key));
        if (lsNr === 0) {
          // start.auftakt (A and B skeleton, SCHEMA §2 / §8): the unit's -mo key, no Lernschritt number
          if (kNr) findings.push(blocker(doc, path, `the Auftakt micro-output key "${key}" carries no Lernschritt number (${kPrefix}-${kSlot}-mo); LS${kNr} holds -mo${kNr}`, key));
        } else {
          if (lsNr && Number(kNr) !== lsNr) findings.push(blocker(doc, path, `micro-output key "${key}" names LS${kNr ?? '?'} but sits in LS${lsNr}`, key));
          if (!kNr && doc.kind === 'unit') findings.push(blocker(doc, path, `micro-output key "${key}" lacks its Lernschritt number (mo1…mo8)`, key));
        }
      } else if (doc.kind === 'unit') {
        if (lane && lane !== primary && kLane !== lane) findings.push(blocker(doc, path, `"${key}" is a ${lane} task and needs the suffix -${lane}`, key));
        if (lane && lane === primary && kLane) findings.push(blocker(doc, path, `"${key}" is a primary-lane (${primary}) task and carries no lane suffix`, key));
      } else if (doc.kind === 'lanepack') {
        if (kLane !== doc.data.lane) findings.push(blocker(doc, path, `lane-pack key "${key}" needs the suffix -${doc.data.lane}`, key));
      } else if (kLane && lane && kLane !== lane) {
        findings.push(blocker(doc, path, `"${key}" carries -${kLane} but the task is lane ${lane}`, key));
      } else if (!kLane && lane && lane !== primary) {
        findings.push(advisory(doc, path, `"${key}" is a ${lane} task without the -${lane} suffix`, key));
      }
      if (seen.has(key)) findings.push(blocker(doc, path, `bank key "${key}" is used twice (first at ${seen.get(key)})`, key));
      else seen.set(key, `${doc.file} > ${path}`);
    };
    for (const { task, kind, path } of walkTasks(doc)) check(task.bankKey, `${path}.bankKey`, kind === 'writing' ? 'w' : 's', { lane: task.lane });
    const lsOf = new Map([...walkSteps(doc)].map(({ step, index }) => [step, index + 1]));
    // lsNr 0 = a unit's start.auftakt micro-output (unnumbered key); a Plateau's projekt keeps LS1
    const lsNrOf = (step, path) => (step ? lsOf.get(step) : doc.kind === 'unit' && path.startsWith('start.') ? 0 : 1);
    for (const { mo, path, step } of walkMicroOutputs(doc)) check(mo.bankKey, `${path}.bankKey`, 'mo', { lsNr: lsNrOf(step, path) });
  }
  return checked ? { findings } : { findings, skipped: 'no writing/speaking task or micro-output in the target yet' };
}
