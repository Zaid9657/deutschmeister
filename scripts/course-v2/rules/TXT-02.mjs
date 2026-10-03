// TXT-02 — exam texts within the Teil template's length band: ±15 % of the official sample size
// (`textWords`) for `length: full`; `reduced` and `mini` blocks within the template's
// `scaffold.textWords` (BLUEPRINT §9.1).
//
// At stage S the blocks do not exist yet; the LS4 texts are then checked against the unit's single
// `ls4` Prüfungsfokus template when there is exactly one.
//
// The tolerance is applied once (reviews a1.1-u04 r1 F10, a1.2-u04 r1 F26): where the template's
// `source` says its textWords already are the samples ±15 % („textWords = ±15 % of the 6 sample
// dialogues", „Band ±15 %" — 23 official-sample templates of sd1/ga2/tb1/tb2 say so), the band is
// textWords itself; only a band written without it gets the ±15 % here.
//
// Per ad (the a1.1 unit reviews, rule-smith 2026-09-28, RAILS §3.1c: a1.1-u05 r1 F09, u06 r1 F09): where the
// template's source says the band is per ad („textWords per ad", sd1.l2), a text holding „a) …" and „b) …" is
// split at its labels and each ad is measured on its own, labels excluded — the pair was measured against
// one ad's band, which capped every ad at half its length.

import { walkBlocks, walkExamTexts } from '../lib-validate/walk.mjs';
import { wordCount } from '../lib-validate/text.mjs';
import { arr, isObj, blocker } from '../lib-validate/helpers.mjs';

export const id = 'TXT-02';
export const title = 'Exam texts within their Teil template\'s length band';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'S';

const TOLERANCE = 0.15;
/** Does the template say its band already carries the tolerance? */
export const includesTolerance = (tpl) => tpl?.textWordsIncludesTolerance === true || /±\s*15\s*%/.test(String(tpl?.source || ''));
const textDe = (t) => [arr(t?.lines).map((l) => l?.de || '').join(' '), t?.text || ''].join(' ');
/** Does the template measure each ad of a text on its own? */
export const perAd = (tpl) => /\bper (?:ad|text|advert)\b|je Anzeige/i.test(String(tpl?.source || ''));
/** The ads of a text: the parts after „a)", „b)" … at a line start, labels removed; the whole text if it has none. */
export function adsOf(text) {
  const parts = String(text || '').split(/(?:^|\n)\s*[a-h]\)\s*/).map((x) => x.trim()).filter(Boolean);
  return parts.length >= 2 ? parts : [String(text || '')];
}

function band(tpl, length) {
  if (length === 'reduced' || length === 'mini') {
    const s = tpl?.scaffold?.textWords;
    return Array.isArray(s) && s.length === 2 ? { lo: s[0], hi: s[1], label: `scaffold ${s[0]}–${s[1]}` } : null;
  }
  const b = tpl?.textWords;
  if (!Array.isArray(b) || b.length !== 2) return null;
  if (includesTolerance(tpl)) return { lo: b[0], hi: b[1], label: `${b[0]}–${b[1]} (the ±15 % is already in the band)` };
  return { lo: Math.floor(b[0] * (1 - TOLERANCE)), hi: Math.ceil(b[1] * (1 + TOLERANCE)), label: `${b[0]}–${b[1]} (±15 %: ${Math.floor(b[0] * (1 - TOLERANCE))}–${Math.ceil(b[1] * (1 + TOLERANCE))})` };
}

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let texts = 0;
  let noTemplate = 0;
  const check = (doc, t, path, tpl, length, ref) => {
    const b = band(tpl, length);
    if (!b) return;
    texts += 1;
    if (perAd(tpl)) {
      adsOf(textDe(t)).forEach((ad, k, all) => {
        const n = wordCount(ad);
        if (n < b.lo || n > b.hi) findings.push(blocker(doc, path, `${all.length > 1 ? `ad ${String.fromCharCode(97 + k)}) has ` : ''}${n} words; ${tpl.id} ${length === 'full' || !length ? 'band' : length} per ad ${b.label}`, ref));
      });
      return;
    }
    const n = wordCount(textDe(t));
    if (n < b.lo || n > b.hi) findings.push(blocker(doc, path, `${n} words; ${tpl.id} ${length === 'full' || !length ? 'band' : length} ${b.label}`, ref));
  };
  for (const doc of docs) {
    let blocks = 0;
    for (const { block, texts: resolved } of walkBlocks(doc)) {
      if (!isObj(block)) continue;
      blocks += 1;
      const tpl = ctx.registries.templates.get(block.template)?.template;
      if (!tpl) { noTemplate += 1; continue; }
      for (const { text, path } of arr(resolved)) check(doc, text, path, { ...tpl, id: block.template }, block.length || 'full', block.id);
    }
    // stage S: texts written before the blocks
    if (!blocks && doc.kind === 'unit') {
      const ls4 = arr(doc.data.spec?.lanes?.pruefungsfokus).filter((p) => p?.slot === 'ls4');
      if (ls4.length !== 1) continue;
      const tpl = ctx.registries.templates.get(ls4[0].template)?.template;
      if (!tpl) continue;
      for (const { text, path, step } of walkExamTexts(doc)) {
        if (step?.kind === 'pruefung') check(doc, text, path, { ...tpl, id: ls4[0].template }, ls4[0].length || 'full', text.id);
      }
    }
  }
  if (noTemplate) notes.push(`${noTemplate} block(s) whose Teil template is not in a loaded lane registry`);
  return texts ? { findings, notes } : { findings, notes, skipped: 'no exam text with a template length band in the target yet' };
}
