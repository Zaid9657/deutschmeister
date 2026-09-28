// ITM-12 — error tags and repair pools (BLUEPRINT §6.2; SCHEMA §3.1 `errorTag`/`errorTags`): a repair card
// draws from the compiled reserve index BY ERROR TAG, so a point a unit teaches productively needs tagged
// items the card can draw, and an item's tag must name the error it trains.
//
// Built by the a1.1 unit reviews (rule-smith 2026-09-28, RAILS §3.1c): u01 r1 F15 / r2 F11, u03 r3 F04,
// u06 r2 F05. The unit-local half runs now; the course-level half (every tag of every level has a pool) waits
// for complete levels (RAILS §3.2):
//   1. every spine point the unit introduces productively (spec.grammar.new whose intro.productive is this
//      unit) has ≥ 1 reserve item on that point carrying one of the point's spine `errorTags` (the repair
//      pool) — RATCHET (the repair card has nothing to draw; nobody is graded wrong);
//   2. every reserve item — the repair bank — carries ≥ 1 error tag (`errorTags`, or `errorTag` on an error
//      correction) — RATCHET;
//   3. an error_correction without `errorTag` — RATCHET (the grader's error report and the repair card have no
//      class; ITM-01 also asks its prompt to name the category);
//   4. ADVISORIES: a `register` tag on a fill_blank whose frame already prints the pronoun (the learner does not
//      choose du or Sie there: „Kommst ___ aus Indien? (du)"); an item that asks „nicht oder kein" (its prompt, or
//      options mixing „nicht" with a kein-form) without the `negation` tag.

import { walkItems, walkSteps } from '../lib-validate/walk.mjs';
import { arr, isObj, advisory, ratchet } from '../lib-validate/helpers.mjs';
import { unitPosition } from '../lib-validate/ids.mjs';
import { tokens } from '../lib-validate/text.mjs';

export const id = 'ITM-12';
export const title = 'Error tags and repair pools: each productive point has tagged reserve items; items carry the tag they train';
export const type = 'mixed';
export const scope = 'unit';
export const stage = 'I';

const tagsOf = (item) => [...arr(item?.errorTags), ...(item?.errorTag ? [item.errorTag] : [])].filter(Boolean);
const PRONOUNS = new Set(['du', 'sie', 'ihr', 'ich', 'er', 'es', 'wir']);
const KEIN_RE = /^kein(?:e|en|em|er|es)?$/i;

/** Does a fill_blank's frame print the addressee's pronoun next to the gap („Kommst ___ …" is not, „Kommst du ___" is)? */
export function framePrintsPronoun(promptDe) {
  const frame = String(promptDe || '').replace(/\([^)]*\)/g, ' ');
  const at = frame.search(/_{2,}/);
  if (at < 0) return false;
  const around = tokens(`${frame.slice(Math.max(0, at - 30), at)} ${frame.slice(at).replace(/^_+/, '').slice(0, 30)}`).map((t) => t.lower);
  return around.some((w) => PRONOUNS.has(w));
}

/** Does an item ask the nicht-or-kein question? */
export function asksNegation(item) {
  if (/nicht\s+oder\s+kein|kein\s+oder\s+nicht/i.test(String(item?.promptDe || ''))) return true;
  const opts = arr(item?.options).map((o) => tokens(o).map((t) => t.lower));
  return opts.some((o) => o.includes('nicht')) && opts.some((o) => o.some((w) => KEIN_RE.test(w)));
}

export function run({ ctx, docs }) {
  const findings = [];
  let n = 0;
  const spine = ctx.registries.spine?.byId;
  for (const doc of docs) {
    if (doc.kind !== 'unit' || !doc.data?.steps) continue;
    const d = doc.data;
    const here = unitPosition(d.id);
    // 1. the repair pool of each point introduced productively here
    const reserve = [];
    for (const { step } of walkSteps(doc)) for (const it of arr(step?.reserve)) if (isObj(it)) reserve.push(it);
    if (spine) {
      arr(d.spec?.grammar?.new).forEach((pid, i) => {
        const point = spine.get(pid)?.point;
        if (!point || unitPosition(point.intro?.productive) !== here) return;
        const want = arr(point.errorTags);
        if (!want.length) return;
        n += 1;
        const pool = reserve.filter((it) => it.topic === pid && tagsOf(it).some((t) => want.includes(t)));
        if (!pool.length) findings.push(ratchet(doc, `spec.grammar.new[${i}]`, `${pid} is introduced productively here, but no reserve item on it carries one of its error tags (${want.join(', ')}) — the repair card for this point has nothing to draw; tag the reserve items that train it`, pid));
      });
    }
    for (const { item, path, where } of walkItems(doc)) {
      if (!isObj(item)) continue;
      n += 1;
      // 2. the repair bank is tagged
      if (where === 'reserve' && !tagsOf(item).length) findings.push(ratchet(doc, `${path}.errorTags`, `reserve item without an error tag — a repair card draws the reserve by tag; add errorTags (${spine?.get(item.topic)?.point?.errorTags?.join(', ') || 'the error class it trains'})`, item.id));
      // 3. an error correction names the error it plants
      if (item.type === 'error_correction' && !item.errorTag && !arr(item.errorTags).length) findings.push(ratchet(doc, `${path}.errorTag`, 'error correction without errorTag — name the error the source sentence plants (the grader and the repair card need its class)', item.id));
      // 4a. a register tag where the frame prints the pronoun
      if (item.type === 'fill_blank' && tagsOf(item).includes('register') && framePrintsPronoun(item.promptDe) && !PRONOUNS.has(String(item.answer || '').trim().toLowerCase())) {
        findings.push(advisory(doc, `${path}.errorTags`, `„register" on a gap whose frame already prints the pronoun („${String(item.promptDe).slice(0, 50)}") — the learner does not choose du or Sie here; tag the error the gap trains (verb-ending …)`, item.id));
      }
      // 4b. nicht or kein without the negation tag
      if (asksNegation(item) && !tagsOf(item).includes('negation')) findings.push(advisory(doc, `${path}.errorTags`, 'the item asks „nicht oder kein" but carries no negation tag — tag it, so its miss feeds the negation repair card', item.id));
    }
  }
  return n ? { findings } : { findings, skipped: 'no item or productive spine point in the target yet' };
}
