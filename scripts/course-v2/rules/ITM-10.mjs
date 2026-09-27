// ITM-10 — accepted forms are accounted for: every acceptedWhy names an accepted form; every form
// confirmed after solver triage (reviewerConfirmed) is accepted AND explained (BLUEPRINT §9.1,
// SCHEMA §3.1). The answer itself is always accepted.
//
// Consistency within a unit (rule-smith 2026-09-27, review a2.2-u04 r1 F03 / F05):
//   - once a unit accepts an uncontracted form in a gap („zu der", „von dem"), every error correction
//     whose answer holds the contraction („zur", „vom") accepts the uncontracted sentence too — the unit
//     taught the learner that both are right;
//   - a gap right after „gegenüber" keyed with „vom …" / „von der …" accepts the bare dative too
//     („gegenüber dem Rathaus" is the standard form).

import { walkItems } from '../lib-validate/walk.mjs';
import { norm } from '../lib-validate/text.mjs';
import { arr, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'ITM-10';
export const title = 'Accepted forms: answer accepted, acceptedWhy and reviewerConfirmed consistent';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

const CONTRACTIONS = { zur: 'zu der', zum: 'zu dem', vom: 'von dem', am: 'an dem', im: 'in dem', beim: 'bei dem', ins: 'in das', ans: 'an das', aufs: 'auf das' };
const expand = (s, c) => String(s).replace(new RegExp(`(^|[^\\p{L}])(${c})(?=$|[^\\p{L}])`, 'giu'), (m, pre, w) => `${pre}${/^\p{Lu}/u.test(w) ? CONTRACTIONS[c].charAt(0).toUpperCase() + CONTRACTIONS[c].slice(1) : CONTRACTIONS[c]}`);
const hasToken = (s, w) => new RegExp(`(^|[^\\p{L}])${w}(?=$|[^\\p{L}])`, 'iu').test(String(s));

/** The contractions a unit shows to be optional: some gap accepts their uncontracted form. */
function uncontractedTaught(doc) {
  const out = new Set();
  for (const { item } of walkItems(doc)) {
    if (!isObj(item) || item.type !== 'fill_blank') continue;
    for (const a of arr(item.accepted)) for (const [c, full] of Object.entries(CONTRACTIONS)) if (norm(a).includes(full)) out.add(c);
  }
  return out;
}

export function run({ docs }) {
  const findings = [];
  let n = 0;
  for (const doc of docs) {
    const optional = uncontractedTaught(doc);
    for (const { item, path } of walkItems(doc)) {
      if (!isObj(item)) continue;
      n += 1;
      const accepted = arr(item.accepted);
      const acceptedN = accepted.map(norm);
      if (!accepted.length) findings.push(blocker(doc, `${path}.accepted`, 'accepted[] is empty', item.id));
      else if (!acceptedN.includes(norm(item.answer))) findings.push(blocker(doc, `${path}.accepted`, `the answer „${item.answer}" is not among the accepted forms`, item.id));
      const dups = accepted.filter((a, i) => accepted.indexOf(a) !== i);
      if (dups.length) findings.push(blocker(doc, `${path}.accepted`, `accepted repeats: ${[...new Set(dups)].join(' | ')}`, item.id));
      const why = item.acceptedWhy && typeof item.acceptedWhy === 'object' ? item.acceptedWhy : {};
      for (const form of Object.keys(why)) {
        if (!accepted.includes(form)) findings.push(blocker(doc, `${path}.acceptedWhy`, `acceptedWhy explains „${form}", which is not an accepted form`, item.id));
        if (!String(why[form] || '').trim()) findings.push(blocker(doc, `${path}.acceptedWhy`, `acceptedWhy for „${form}" is empty`, item.id));
      }
      if (item.type === 'error_correction' && item.answer) {
        for (const c of optional) {
          if (!hasToken(item.answer, c)) continue;
          const full = expand(item.answer, c);
          if (!acceptedN.includes(norm(full))) findings.push(blocker(doc, `${path}.accepted`, `the unit accepts „${CONTRACTIONS[c]}" for „${c}" elsewhere; this correction must accept „${full}" too`, item.id));
        }
      }
      if (item.type === 'fill_blank' && /gegenüber\s+_{2,}/i.test(String(item.promptDe || ''))) {
        const bareForm = String(item.answer || '').replace(/^vom\b/i, 'dem').replace(/^von\s+(?=der|dem|den)/i, '');
        if (bareForm !== String(item.answer || '') && !acceptedN.includes(norm(bareForm))) findings.push(blocker(doc, `${path}.accepted`, `after „gegenüber" the bare dative „${bareForm}" is the standard form — accept it besides „${item.answer}"`, item.id));
      }
      for (const form of arr(item.reviewerConfirmed)) {
        if (!accepted.includes(form)) findings.push(blocker(doc, `${path}.reviewerConfirmed`, `reviewer-confirmed „${form}" is not in accepted`, item.id));
        if (!why[form]) findings.push(blocker(doc, `${path}.acceptedWhy`, `reviewer-confirmed „${form}" carries no acceptedWhy`, item.id));
      }
    }
  }
  return n ? { findings } : { findings, skipped: 'no authored items in the target yet' };
}
