// ALL-02 — 3–5 registry can-dos per unit, each with source tags and band; ≥ 1 productive can-do
// proven by an Aufgabe; „Das kann ich" (check.proofs) lists exactly the unit's can-dos, each
// linked to a proof item or an Aufgabe; the Lernziele box shows exactly the unit's can-dos.

import { walkSteps } from '../lib-validate/walk.mjs';
import { arr, blocker, list } from '../lib-validate/helpers.mjs';

export const id = 'ALL-02';
export const title = 'Can-dos: 3–5 per unit, tagged, proven; ≥ 1 productive proven by an Aufgabe';
export const type = 'hard';
export const scope = 'unit';

const PRODUCTIVE = /^(productive|interaction)-/;
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let units = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit' || !doc.data.spec) continue;
    units += 1;
    const d = doc.data;
    const canDos = arr(d.spec.canDos);
    if (canDos.length < 3 || canDos.length > 5) findings.push(blocker(doc, 'spec.canDos', `${canDos.length} can-dos (need 3–5)`, d.id));
    const dup = canDos.filter((c, i) => canDos.indexOf(c) !== i);
    if (dup.length) findings.push(blocker(doc, 'spec.canDos', `can-do listed twice: ${list(new Set(dup))}`, d.id));
    const reg = ctx.registries.cando;
    for (const [i, c] of canDos.entries()) {
      const e = reg?.get(c)?.item;
      if (!e) continue; // resolution is REF-01's
      if (!arr(e.source).length) findings.push(blocker(doc, `spec.canDos[${i}]`, `can-do ${c} has no source tags in the registry`, c));
      if (!e.band) findings.push(blocker(doc, `spec.canDos[${i}]`, `can-do ${c} has no band in the registry`, c));
      if (e.halfLevel && e.halfLevel !== doc.level) notes.push(`${c} is registered for ${e.halfLevel}, used in ${doc.level}`);
    }
    if (d.start && !sameSet(arr(d.start.lernziele), canDos)) {
      findings.push(blocker(doc, 'start.lernziele', 'the Lernziele box must list exactly spec.canDos', d.id));
    }
    if (!d.check) continue;
    const proofs = arr(d.check.proofs);
    const proven = proofs.map((p) => p?.canDo);
    if (!sameSet(proven, canDos)) {
      const missing = canDos.filter((c) => !proven.includes(c));
      const extra = proven.filter((c) => !canDos.includes(c));
      findings.push(blocker(doc, 'check.proofs', `„Das kann ich" must list exactly the unit's can-dos${missing.length ? `; unproven: ${list(missing)}` : ''}${extra.length ? `; not the unit's: ${list(extra)}` : ''}`, d.id));
    }
    const stepKinds = new Set([...walkSteps(doc)].map((s) => s.step?.kind));
    proofs.forEach((p, i) => {
      if (!p?.item && !p?.aufgabe) findings.push(blocker(doc, `check.proofs[${i}]`, `proof of ${p?.canDo} names neither an item nor an Aufgabe`, p?.canDo));
      if (p?.aufgabe && !stepKinds.has(p.aufgabe)) findings.push(blocker(doc, `check.proofs[${i}].aufgabe`, `proof by "${p.aufgabe}" but the unit has no ${p.aufgabe} step`, p?.canDo));
    });
    if (reg) {
      const productiveByAufgabe = proofs.some((p) => p?.aufgabe && PRODUCTIVE.test(String(reg.get(p.canDo)?.item?.mode || '')));
      const modesKnown = canDos.every((c) => reg.get(c)?.item?.mode);
      if (modesKnown && !productiveByAufgabe) findings.push(blocker(doc, 'check.proofs', 'no productive or interactive can-do is proven by an Aufgabe (sprechen/schreiben)', d.id));
    }
  }
  return units ? { findings, notes } : { findings, skipped: 'no unit spec in the target yet' };
}
