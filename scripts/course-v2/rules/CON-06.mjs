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
//
// An exception is checked on its own (review a1.2-u04 r1 F02: the claim's source was true, its
// exception false): an exception that names no source of its own — a § / Art. citation, a law, a URL
// or „laut …" — is an advisory. SCHEMA's exceptions are LText without a source field; once the SCHEMA
// owner adds `exceptions[].source`, this becomes a blocker.
//
// A unit is not skipped because it has no facts (review a1.1-u04 r4 F05: the plan's „sonntags meist
// geschlossen, Flaschenpfand" stood in the texts, facts [] made CON-06 print „skipped"). A unit needs
// ≥ 1 facts[] record, or a spec.deviation.reason that says why its Landeskunde carries none (it names
// „Landeskunde"), when
//   - its German texts state a country-wide rule: „in Deutschland / Österreich / der Schweiz / D-A-CH"
//     (or „hierzulande", „die Deutschen") with a rule word (man, muss, darf, Pflicht, Gesetz, verboten,
//     erlaubt, gibt es, meist, normalerweise, immer, sonntags, geschlossen, offen, zu, kostet, zahlt …),
//     in a sentence that is not a person's own account (no ich/wir/du/ihr). A stated claim without a
//     record — BLOCKER at every status;
//   - its plan entry (docs/course-v2/curriculum/<level>.json) names a `landeskunde` point. Every plan unit
//     names one, and many are taught as a scene or a chunk („Zusammen oder getrennt?"), which a reader
//     judges: a WARNING while the unit is a draft, a blocker from status "review" on (the promotion path,
//     like a partial fact).

import { arr, isObj, blocker, advisory } from '../lib-validate/helpers.mjs';
import { walkTexts } from '../lib-validate/walk.mjs';
import { sentences } from '../lib-validate/text.mjs';
import { curriculumEntry } from '../lib-validate/curriculum.mjs';

export const id = 'CON-06';
export const title = 'Facts carry sources, a fresh check date and verification "verified"';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'S';

const MAX_AGE_DAYS = 180;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const days = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
const FACTUAL_RE = /\d|§|%|\bEuro\b|€|\bGesetz|\bPflicht|\bRecht auf\b|\bmindestens\b|\bhöchstens\b/;
const COUNTRY_RE = /(?:^|[^\p{L}])(?:in (?:Deutschland|Österreich|der Schweiz|D-A-CH|Liechtenstein|Luxemburg)|hierzulande|die (?:Deutschen|Österreicher|Schweizer))(?:[^\p{L}]|$)/u;
const RULE_RE = /(?:^|[^\p{L}])(?:man|muss|müssen|darf|dürfen|Pflicht|Gesetz|verboten|erlaubt|gibt es|es gibt|meist|meistens|normalerweise|immer|nie|oft|sonntags|samstags|geschlossen|offen|zu|kostet|kosten|zahlt|zahlen|bezahlt|gilt|gelten)(?:[^\p{L}]|$)/u;
const PERSONAL_RE = /(?:^|[^\p{L}])(?:ich|wir|du|ihr|mein|meine|unser|unsere)(?:[^\p{L}]|$)/iu;
const LANDESKUNDE_REASON_RE = /Landeskunde|Fakt|facts?\b|CON-06/iu;

/** Sentences of the unit's German texts that state a country-wide rule (r4 F05). */
export function countryRules(doc) {
  const d = doc.data || {};
  const out = [];
  const read = (text, path) => {
    for (const s of sentences(text)) if (COUNTRY_RE.test(s) && RULE_RE.test(s) && !PERSONAL_RE.test(s) && !/\?\s*[“”"»]?\s*$/.test(s)) out.push({ sentence: s, path });
  };
  for (const t of walkTexts(doc)) {
    if (t.lines.length) t.lines.forEach((l, i) => read(String(l?.de || ''), `${t.path}.lines[${i}]`));
    if (t.writtenText) read(t.writtenText, `${t.path}.text`);
  }
  arr(d.check?.lines).forEach((l, i) => read(String(l?.de || ''), `check.lines[${i}]`));
  arr(d.fokus).forEach((k, i) => read(String(k?.bodyDe || ''), `fokus[${i}].bodyDe`));
  if (d.check?.portrait?.de) read(String(d.check.portrait.de), 'check.portrait.de');
  return out;
}

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
      arr(f.exceptions).forEach((x, xi) => {
        const t = `${x?.de || ''} ${x?.source || ''}`;
        const cited = /§|\bArt\.|https?:\/\/|\blaut\b/i.test(t) || /\p{Lu}\p{L}*(?:gesetz|ordnung|verordnung|richtlinie)\b/u.test(t) || /\b(?:[A-Z][a-z]*){1,4}G\b|\b(?:BGB|HGB|VVG|BMG)\b/.test(t);
        if (!cited) findings.push(advisory(doc, `${p}.exceptions[${xi}]`, 'the exception names no source of its own (§ citation, law, URL or „laut …") — a reviewer checks it separately from the claim', f.id));
      });
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
    // a unit without facts is not skipped: a stated country-wide rule, or the plan's Landeskunde point (r4 F05)
    if (!arr(d.facts).length) {
      const reason = String(d.spec?.deviation?.reason || '');
      const excused = LANDESKUNDE_REASON_RE.test(reason);
      const rules = countryRules(doc);
      const plan = curriculumEntry(ctx, doc.level, doc.nr);
      const point = String(plan?.landeskunde || '').trim();
      if (rules.length) facts += 1;
      if (rules.length && !excused) {
        const r = rules[0];
        findings.push(blocker(doc, r.path, `the unit states a country-wide rule („${r.sentence.slice(0, 120)}")${rules.length > 1 ? ` and ${rules.length - 1} more` : ''} but has no facts[] record — add a sourced Fact (SCHEMA §3.4), reword it for the scene („hier"), or say in spec.deviation.reason why its Landeskunde carries none`, d.id));
      } else if (point && !excused) {
        facts += 1;
        const draft = d.status === 'draft';
        const msg = `the plan names the Landeskunde point „${point.slice(0, 120)}" but the unit has no facts[] record — add a sourced Fact for each claim it makes, or say in spec.deviation.reason (naming „Landeskunde") why it makes none`;
        findings.push(draft ? advisory(doc, 'facts', `warning: ${msg} (blocks from status "review" on)`, d.id) : blocker(doc, 'facts', msg, d.id));
      }
    }
    // a Fokus-Karte stating figures or law without a fact record
    arr(d.fokus).forEach((k, i) => {
      if (isObj(k) && FACTUAL_RE.test(String(k.bodyDe || '')) && !arr(k.factRefs).length) {
        findings.push(advisory(doc, `fokus[${i}]`, 'Fokus-Karte states figures or rules but cites no facts[] record', k.id));
      }
    });
  }
  return facts || findings.length ? { findings } : { findings, skipped: 'no facts[] records in the target' };
}
