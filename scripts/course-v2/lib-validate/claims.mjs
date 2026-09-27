// Claims a rule card or an explanation makes about a FORM's ending, checked against the form itself
// (rule-smith 2026-09-27; reviews a2.2-u04 r1 F02, r2 F02, r3 F03 — three rounds on one card, so a rail
// fix under BLUEPRINT §9.4).
//
// „Achtung: du wirst und er wird – ohne d am Ende." pairs the form „wird" with the claim „ohne d";
// the card's own table prints „wird". The same in English: „du wirst, er wird (no -d)". A claim is
// „ohne X" / „kein -X" / „no X" / „without -X", X one letter or a hyphenated ending of up to three;
// the forms it speaks about are the words before it back to the previous sentence mark (. ; : ! ?
// or a line break; brackets and dashes are read through). A claim that names only pronouns
// („er/sie/es – ohne t") is checked against the card's table row of that pronoun.
//
// Deliberately narrow: only the negative claim is checked („mit -e" is too often about a word class,
// „Adjektive mit -e", to be read as a claim about the words before it).

import { tokens } from './text.mjs';

const arr = (x) => (Array.isArray(x) ? x : []);

/** Words the claim never speaks about: pronouns, articles, conjunctions, prepositions, labels. */
const NOT_A_FORM = new Set(`ich du er sie es wir ihr man mich dich ihn uns euch mir dir ihm ihnen sich
der die das den dem des ein eine einen einem einer und oder aber auch nur mit ohne kein keine am im an in
bei von zu für nach vor auf aus the a an and or with without no not at end ending form forms
achtung hinweis note beispiel merke tipp`.split(/\s+/).filter(Boolean));
const PRONOUNS = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr']);

// a single letter must be followed by the end, a bracket or mark, or „am (Ende)" / „at (the end)"
const END = String.raw`(?=\s*(?:$|[),.;:!?–—-]|am\b|at\b|ending\b|am\s+ende\b))`;
const CLAIM_RE = new RegExp(String.raw`(?<![\p{L}])(ohne|keine?n?|no|without)\s+(?:an?\s+)?(?:-\s?(\p{Ll}{1,3})(?![\p{L}])|(\p{Ll})${END})`, 'giu');

/** The span a claim at `index` speaks about: back to the previous sentence mark. */
function claimSpan(text, index) {
  const before = text.slice(0, index);
  const cut = Math.max(...['.', ';', ':', '!', '?', '\n'].map((c) => before.lastIndexOf(c)));
  return before.slice(cut + 1);
}

/**
 * Contradictions in `text`: [{ claim, letters, form }] where a form the claim speaks about ends in
 * the letters it says the form lacks. `table` (a rule card's rows) answers claims about a pronoun.
 */
export function endingContradictions(text, table = []) {
  const src = String(text ?? '');
  const out = [];
  for (const m of src.matchAll(CLAIM_RE)) {
    const letters = (m[2] || m[3] || '').toLowerCase();
    if (!letters) continue;
    const span = claimSpan(src, m.index);
    const words = tokens(span).map((t) => t.lower).filter((w) => w.length >= 2);
    const forms = words.filter((w) => !NOT_A_FORM.has(w) && !/^-/.test(w));
    let bad = forms.filter((f) => f.endsWith(letters));
    if (!forms.length) {
      // „er/sie/es – ohne t": the card's own row for that pronoun
      const named = new Set(words.filter((w) => PRONOUNS.has(w)));
      for (const row of arr(table)) {
        const cells = arr(row).map((c) => String(c ?? ''));
        const head = tokens(cells[0] || '').map((t) => t.lower);
        if (!head.some((w) => named.has(w))) continue;
        for (const cell of cells.slice(1)) {
          const last = tokens(cell).map((t) => t.lower).pop();
          if (last && last.endsWith(letters)) bad.push(last);
        }
      }
    }
    bad = [...new Set(bad)];
    for (const form of bad) out.push({ claim: m[0].trim(), letters, form });
  }
  return out;
}
