// CON-06 — every factual claim sits in a facts[] record with sources, factsCheckedOn ≤ 180 days
// old, currentAsOf, exceptions and verification "verified" (BLUEPRINT §9.1). A partial or pending
// verification blocks promotion: the SCHEMA §15 fixture (status "review") fails here on purpose.
//
// Authoring vs promotion (rule-smith 2026-09-27). Agents write units in a sandbox whose proxy blocks most
// primary sources, so a fact is often sourced but not re-read. While the unit is `status: "draft"`, a
// `partial`/`pending` fact that carries https source(s) AND says in `notes` what was not re-read and why is
// a WARNING (advisory, the reason quoted) — it is the reviewer's to-do, not an authoring error. From
// `status: "review"` on (the promotion path, SCHEMA §15.6) it is a blocker again. A fact without a source,
// with a non-https source or without a reason stays a blocker at every status.

import { arr, isObj, blocker, advisory } from '../lib-validate/helpers.mjs';

export const id = 'CON-06';
export const title = 'Facts carry sources, a fresh check date and verification "verified"';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'S';

const MAX_AGE_DAYS = 180;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const days = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
const FACTUAL_RE = /\d|§|%|\bEuro\b|€|\bGesetz|\bPflicht|\bRecht auf\b|\bmindestens\b|\bhöchstens\b/;

export function run({ ctx, docs }) {
  const findings = [];
  let facts = 0;
  const today = ctx.today;
  for (const doc of docs) {
    if (doc.kind !== 'unit') continue;
    const d = doc.data || {};
    arr(d.facts).forEach((f, i) => {
      facts += 1;
      const p = `facts[${i}]`;
      if (!isObj(f)) return;
      const sources = arr(f.sources);
      if (!sources.length) findings.push(blocker(doc, `${p}.sources`, 'fact without a source', f.id));
      sources.forEach((s, si) => { if (!/^https:\/\/\S+$/.test(String(s))) findings.push(blocker(doc, `${p}.sources[${si}]`, `source "${s}" is not an https URL`, f.id)); });
      if (!DATE_RE.test(String(f.factsCheckedOn || ''))) findings.push(blocker(doc, `${p}.factsCheckedOn`, 'factsCheckedOn missing or not YYYY-MM-DD', f.id));
      else {
        const age = days(f.factsCheckedOn, today);
        if (age < 0) findings.push(blocker(doc, `${p}.factsCheckedOn`, `factsCheckedOn ${f.factsCheckedOn} lies in the future (today ${today})`, f.id));
        else if (age > MAX_AGE_DAYS) findings.push(blocker(doc, `${p}.factsCheckedOn`, `checked ${age} days ago (limit ${MAX_AGE_DAYS}): re-check at a primary source`, f.id));
      }
      if (!DATE_RE.test(String(f.currentAsOf || ''))) findings.push(blocker(doc, `${p}.currentAsOf`, 'currentAsOf missing or not YYYY-MM-DD', f.id));
      if (!Array.isArray(f.exceptions)) findings.push(blocker(doc, `${p}.exceptions`, 'exceptions[] missing (write [] when there are none)', f.id));
      if (f.verification !== 'verified') {
        const why = String(f.notes || '').trim();
        const short = why ? ` (notes: ${why.slice(0, 140)}${why.length > 140 ? '…' : ''})` : '';
        const sourced = sources.length > 0 && sources.every((s) => /^https:\/\/\S+$/.test(String(s)));
        const draft = d.status === 'draft';
        if (draft && sourced && why && (f.verification === 'partial' || f.verification === 'pending')) {
          findings.push(advisory(doc, `${p}.verification`, `warning: verification is "${f.verification}" — the source was not re-read${short}; a reviewer confirms it at ${sources[0]} before the unit leaves draft (it blocks from status "review" on)`, f.id));
        } else {
          const tail = !why && sourced && draft ? ' — say in notes what was not re-read and why, or verify it' : ' — blocks promotion until a reviewer confirms every part at a primary source';
          findings.push(blocker(doc, `${p}.verification`, `verification is "${f.verification ?? 'missing'}", not "verified"${tail}${short}`, f.id));
        }
      }
    });
    // a Fokus-Karte stating figures or law without a fact record
    arr(d.fokus).forEach((k, i) => {
      if (isObj(k) && FACTUAL_RE.test(String(k.bodyDe || '')) && !arr(k.factRefs).length) {
        findings.push(advisory(doc, `fokus[${i}]`, 'Fokus-Karte states figures or rules but cites no facts[] record', k.id));
      }
    });
  }
  return facts || findings.length ? { findings } : { findings, skipped: 'no facts[] records in the target' };
}
