// CON-01 — cast and story consistency (BLUEPRINT §9.1, §2.7; SCHEMA §4.7 casts, §3.3 extras).
//
// Built by the a1.1 unit reviews (rule-smith 2026-09-28, RAILS §3.1c): u02 r1 F16 / r2 F09 / r3 F08. The unit
// is compared with the cast bible (casts/*.json) — nothing here is graded, so nothing blocks:
//   1. persona data the unit states about a cast member — a phone number, a street address, an age — equal
//      the bible's (`contact.phone`, the `contact.addresses` entry valid at the unit, `age` + the band offset
//      „A1 (A2 +1, B1 +2, B2 +3 Jahre)"). A text is attributed to a member when it names exactly one member (first
//      name or surname) or the member speaks the line. RATCHET: two units that disagree about Priya's number
//      teach the learner nothing but confusion (the fixture a1.1-u12 steps[4].task.modelTurns[7] before its fix);
//   2. an extra's surname is not a series cast surname (x.herr-hoffmann beside cast.frau-hoffmann) — ADVISORY;
//   3. a named extra's voice is not the voice of another speaker of the same step, and an ensemble or extra
//      voice is not the voice of a cast member who speaks in the same unit (two people, one voice) — ADVISORY
//      (the audio run chooses voices; x.herr-schaefer and cast.ensemble-a1-3 shared de-DE-KlausNeural at u02).

import { walkLines, walkTasks, walkItems, walkExamTexts } from '../lib-validate/walk.mjs';
import { arr, isObj, advisory, ratchet } from '../lib-validate/helpers.mjs';
import { unitPosition, bandOfLevel } from '../lib-validate/ids.mjs';

export const id = 'CON-01';
export const title = 'Cast consistency: persona data as the cast bible, no surname or voice shared by two people';
export const type = 'mixed';
export const scope = 'unit';
export const stage = 'S';

const BAND_OFFSET = { a1: 0, a2: 1, b1: 2, b2: 3 };
const fold = (s) => String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const digits = (s) => String(s || '').replace(/\D+/g, '');
/** Phone-like numbers in a text: a leading 0, ≥ 7 digits in groups („0176 38 29 41 06", „0341/225890"). */
export const phones = (text) => (String(text || '').match(/(?<![\d.,])0\d{2,5}(?:[\s/-]?\d{2,}){1,5}(?![\d.,])/g) || []).filter((p) => digits(p).length >= 7);
/** Street addresses: „Kölner Straße 18", „Berliner Str. 21", „Am Markt 3". */
export const streets = (text) => [...String(text || '').matchAll(/\b(\p{Lu}[\p{L}-]+(?:er)?\s+(?:Straße|Str\.|Weg|Platz|Allee|Gasse|Ring|Damm)|\p{Lu}[\p{L}-]*(?:straße|weg|platz|allee|gasse|ring|damm))\s+(\d{1,4}[a-z]?)\b/gu)].map((m) => ({ street: m[1], nr: m[2], text: m[0] }));
const streetKey = (s) => fold(s).replace(/str\.$/, 'strasse').replace(/\s+/g, '');

/** The address of a member valid at a course position (contact.addresses from/until), or null. */
function addressAt(member, pos) {
  for (const a of arr(member?.contact?.addresses)) {
    const from = unitPosition(a?.from);
    const until = unitPosition(a?.until);
    if (from !== null && pos !== null && pos >= from && (until === null || pos < until)) return a;
  }
  return null;
}

export function run({ ctx, docs }) {
  const findings = [];
  const members = ctx.registries.casts?.members;
  if (!members?.size) return { findings, skipped: 'no cast bible (casts/*.json) loaded' };
  const cast = [...members].map(([mid, { member }]) => {
    const parts = String(member?.name || '').split(/\s+/).filter(Boolean);
    return { id: mid, member, first: parts[0] || null, last: parts.length > 1 ? parts[parts.length - 1] : null, voice: member?.voice?.azure || null };
  });
  const surnames = new Map(cast.filter((c) => c.last && c.id !== 'cast.ensemble').map((c) => [fold(c.last), c.id]));
  let n = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit') continue;
    n += 1;
    const d = doc.data;
    const pos = unitPosition(d.id);
    const offset = BAND_OFFSET[bandOfLevel(doc.level)] ?? 0;
    const extras = isObj(d.extras) ? d.extras : {};
    // 2. an extra's surname
    for (const [slug, x] of Object.entries(extras)) {
      const last = fold(String(x?.name || slug.replace(/^x\./, '').replace(/^(?:herr|frau)-/, '')).split(/[\s-]+/).pop());
      const hit = surnames.get(last);
      if (hit && last.length > 3) findings.push(advisory(doc, `extras.${slug}`, `the extra ${slug} has the surname of ${hit} (${members.get(hit)?.member?.name}) — two families of one name confuse the story; rename the extra`, slug));
    }
    // 3. voices: per step (and the Folge) and across the unit
    const voiceOf = (speaker) => (String(speaker || '').startsWith('x.') ? extras[speaker]?.voice : members.get(speaker)?.member?.voice?.azure) || null;
    const byScope = new Map();
    const unitSpeakers = new Map(); // voice → Set(speaker)
    for (const { line, path } of walkLines(doc)) {
      const sp = line?.speaker;
      const v = voiceOf(sp);
      if (!sp || !v) continue;
      const scope = path.replace(/\.(?:input\.)?lines\[\d+\]$/, '').replace(/\.texts\[\d+\]$/, '');
      if (!byScope.has(scope)) byScope.set(scope, new Map());
      const m = byScope.get(scope);
      if (!m.has(v)) m.set(v, new Set());
      m.get(v).add(sp);
      if (!unitSpeakers.has(v)) unitSpeakers.set(v, new Set());
      unitSpeakers.get(v).add(sp);
    }
    const reported = new Set();
    for (const [scope, m] of byScope) {
      for (const [v, sps] of m) {
        if (sps.size < 2) continue;
        const key = [...sps].sort().join('+');
        reported.add(key);
        findings.push(advisory(doc, scope, `${[...sps].join(' and ')} speak in the same step with one voice (${v}) — give one of them another voice`, [...sps][0]));
      }
    }
    for (const [v, sps] of unitSpeakers) {
      const castSp = [...sps].filter((x) => x.startsWith('cast.') && !/ensemble/.test(x));
      const other = [...sps].filter((x) => x.startsWith('x.') || /ensemble/.test(x));
      if (!castSp.length || !other.length) continue;
      const key = [...sps].sort().join('+');
      if (reported.has(key)) continue;
      findings.push(advisory(doc, 'extras', `${other.join(', ')} and ${castSp.join(', ')} speak in this unit with the same voice (${v}) — a listener hears one person`, other[0]));
    }
    // 1. persona data: phone, address, age
    const blocks = [];
    for (const { line, path } of walkLines(doc)) if (line?.de) blocks.push({ text: String(line.de), path: `${path}.de`, speaker: line.speaker });
    for (const { text, path } of walkExamTexts(doc)) if (text?.text) blocks.push({ text: String(text.text), path: `${path}.text`, speaker: null });
    for (const { task, path } of walkTasks(doc)) {
      const turns = arr(task.modelTurns);
      const whole = [task.situationDe, task.aiRole?.personaDe, ...turns.map((t) => t?.de)].join(' ');
      turns.forEach((t, i) => { if (t?.de) blocks.push({ text: String(t.de), path: `${path}.modelTurns[${i}].de`, speaker: null, context: whole }); });
      if (task.situationDe) blocks.push({ text: String(task.situationDe), path: `${path}.situationDe`, speaker: null });
      if (task.modelText) blocks.push({ text: String(task.modelText), path: `${path}.modelText`, speaker: null });
      for (const [i, f] of arr(task.form?.fields).entries()) if (f?.answer) blocks.push({ text: String(f.answer), path: `${path}.form.fields[${i}].answer`, speaker: null, context: task.situationDe });
    }
    for (const { item, path } of walkItems(doc)) if (isObj(item) && item.promptDe) blocks.push({ text: String(item.promptDe), path: `${path}.promptDe`, speaker: null });
    const mentioned = (text) => cast.filter((c) => c.first && c.member?.contact || c.first && typeof c.member?.age === 'number')
      .filter((c) => new RegExp(`(?<![\\p{L}])(?:${c.first}${c.last ? `|${c.last}` : ''})(?![\\p{L}])`, 'u').test(text));
    for (const b of blocks) {
      const who = b.speaker && members.has(b.speaker) ? [cast.find((c) => c.id === b.speaker)] : mentioned(b.context || b.text);
      if (who.length !== 1 || !who[0]) continue;
      const c = who[0];
      const phone = c.member?.contact?.phone;
      if (phone) {
        for (const p of phones(b.text)) {
          if (digits(p) !== digits(phone)) findings.push(ratchet(doc, b.path, `„${p}" is given as ${c.first}'s number; the cast bible (${c.id} contact.phone) has „${phone}"`, c.id));
        }
      }
      const addr = addressAt(c.member, pos);
      if (addr) {
        const want = streets(addr.de)[0];
        for (const st of streets(b.text)) {
          if (want && (streetKey(st.street) !== streetKey(want.street) || st.nr !== want.nr) && /\b(?:wohn|Adresse|Straße|Str\.)/u.test(b.context || b.text)) {
            findings.push(ratchet(doc, b.path, `„${st.text}" is given as ${c.first}'s address; at ${d.id} the cast bible (${c.id} contact.addresses) has „${addr.de}"`, c.id));
          }
        }
      }
      if (typeof c.member?.age === 'number') {
        const want = c.member.age + offset;
        const ageRe = b.speaker === c.id ? /\bIch bin (\d{1,2})(?: Jahre alt)?\b/u : new RegExp(`\\b${c.first} ist (\\d{1,2})(?: Jahre alt)?\\b`, 'u');
        const m = b.text.match(ageRe);
        if (m && Number(m[1]) !== want) findings.push(ratchet(doc, b.path, `${c.first} is ${m[1]} here; the cast bible (${c.id}) makes ${c.first} ${want} at ${doc.level}`, c.id));
      }
    }
  }
  return n ? { findings } : { findings, skipped: 'no unit in the target yet' };
}
