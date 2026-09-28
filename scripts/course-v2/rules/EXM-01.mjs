// EXM-01 — every exam block matches its Teil template: lane, item count (full length = the
// template's count; reduced/mini within the template's `scaffold`), item type, options, the
// block-level choice set (count, kind, reuse, no-match key), every answer a choice key or the
// no-match key, every gap marker ⟦NN⟧ filled exactly once, and the play count its instruction
// states (BLUEPRINT §9.1, SCHEMA §3.1/§3.6/§15.7). Text bands are TXT-02; word bands EXM-03;
// preparation minutes EXM-04.
//
// The exam's worked example (review a2.2-u04 r1 F10, r2 F13, r3 F10 — three rounds): where a Teil
// template's source says the example uses up an option („die Anzeige aus dem Beispiel ist verbraucht",
// Goethe A2 Lesen Teil 4), a full block leaves options − items − 1 (+ 1 with a no-match item) choices
// unused, as the exam does. ADVISORY until SCHEMA's ExamBlock can carry the example (SCH-01 rejects an
// unknown `example` key today) — the SCHEMA owner adds `ExamBlock.example`, then this blocks.

import { walkBlocks } from '../lib-validate/walk.mjs';
import { arr, isObj, blocker, advisory } from '../lib-validate/helpers.mjs';
import { tokens, FUNCTION_WORDS } from '../lib-validate/text.mjs';

export const id = 'EXM-01';
export const title = 'Exam blocks match their Teil template (items, type, options, no-match, plays)';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'T';

const CHOICE_TASKS = new Set(['zuordnen', 'insert']);
const GAP_TASKS = new Set(['insert', 'cloze']);
const suffixOf = (itemId) => (String(itemId || '').match(/-(\d{2})$/) || [])[1] || null;

const TYPES_FOR_TASK = {
  abc: ['abc', 'multiple_choice'],
  richtig_falsch: ['richtig_falsch'],
  ja_nein: ['ja_nein'],
  zuordnen: ['zuordnen'],
  cloze: ['cloze'],
  notes: ['notes'],
  form_fill: ['form_fill'],
  insert: ['insert'],
};

export function run({ ctx, docs }) {
  const findings = [];
  const notes = [];
  let blocks = 0;
  let unknown = 0;
  for (const doc of docs) {
    for (const { block, path, texts } of walkBlocks(doc)) {
      if (!isObj(block)) continue;
      const entry = ctx.registries.templates.get(block.template);
      if (!entry) { unknown += 1; continue; }
      blocks += 1;
      const t = entry.template;
      const id = block.id;
      if (block.lane && block.lane !== entry.lane) findings.push(blocker(doc, `${path}.lane`, `block lane ${block.lane}, template ${block.template} belongs to ${entry.lane}`, id));
      if (['writing', 'speaking'].includes(t.task)) {
        findings.push(blocker(doc, `${path}.template`, `${block.template} is a ${t.task} Teil; it is authored as a task (LS5/LS6), not as an item block`, id));
        continue;
      }
      const items = arr(block.items).filter(isObj);
      const scaffold = isObj(t.scaffold) ? t.scaffold : null;
      const short = block.length === 'reduced' || block.length === 'mini';
      if (short && Array.isArray(t.scaffoldAllowedIn) && doc.level && !t.scaffoldAllowedIn.includes(doc.level)) {
        findings.push(blocker(doc, `${path}.length`, `${block.length} ${block.template} in ${doc.level}; the template allows a scaffold only in ${t.scaffoldAllowedIn.join(', ') || 'no level'}`, id));
      }
      if (typeof t.items === 'number') {
        if (block.length === 'full' && items.length !== t.items) findings.push(blocker(doc, `${path}.items`, `${items.length} items; ${block.template} at full length has ${t.items}`, id));
        if (short) {
          const min = scaffold && typeof scaffold.minItems === 'number' ? scaffold.minItems : 1;
          const max = block.length === 'mini' ? Math.max(min, Math.ceil(t.items / 2)) : t.items - 1;
          if (items.length < min || items.length > max) findings.push(blocker(doc, `${path}.items`, `${block.length} block with ${items.length} items; ${block.template} allows ${min}–${max} (template ${t.items}${scaffold ? `, scaffold minItems ${min}` : ''})`, id));
        }
      }
      const allowed = TYPES_FOR_TASK[t.task];
      items.forEach((it, i) => {
        if (allowed && !allowed.includes(it.type)) findings.push(blocker(doc, `${path}.items[${i}].type`, `${it.type} in a ${t.task} Teil (${block.template})`, it.id));
        if (it.role && it.role !== 'exam') findings.push(blocker(doc, `${path}.items[${i}].role`, `role ${it.role} in an exam block (role exam)`, it.id));
        if (typeof t.options === 'number' && ['abc', 'richtig_falsch', 'ja_nein'].includes(t.task)) {
          const n = arr(it.options).length;
          const fixed = !short || !scaffold || scaffold.optionsFixed !== false;
          if (fixed ? n !== t.options : (n < 2 || n > t.options)) findings.push(blocker(doc, `${path}.items[${i}].options`, `${n} options; ${block.template} has ${t.options}`, it.id));
        }
        if (block.choices !== undefined && arr(it.options).length) {
          findings.push(blocker(doc, `${path}.items[${i}].options`, `per-item options in a block with a choice set; a ${t.task} item answers from the block's choices`, it.id));
        }
      });

      // block-level choice set (zuordnen, insert, word-bank cloze)
      const choices = arr(block.choices).filter(isObj);
      const keys = choices.map((c) => String(c.key ?? ''));
      const keySet = new Set(keys);
      const wantsChoices = typeof t.choices === 'number' || CHOICE_TASKS.has(t.task);
      if (typeof t.choices === 'number' && !choices.length) {
        findings.push(blocker(doc, `${path}.choices`, `${block.template} answers from a block-level choice set of ${t.choices}; the block has none`, id));
      }
      if (choices.length && !wantsChoices && t.task !== 'cloze') {
        findings.push(blocker(doc, `${path}.choices`, `${block.template} (${t.task}) has no block-level choice set; per-item options belong on the items`, id));
      }
      if (choices.length) {
        if (typeof t.choices === 'number') {
          const min = short && scaffold && typeof scaffold.choicesMin === 'number' ? scaffold.choicesMin : t.choices;
          const ok = short ? choices.length >= min && choices.length <= t.choices : choices.length === t.choices;
          if (!ok) findings.push(blocker(doc, `${path}.choices`, `${choices.length} choices; ${block.template} has ${short ? `${min}–${t.choices} in a ${block.length} block` : t.choices}`, id));
          if (short && items.length >= choices.length && t.choiceReuse !== true) {
            findings.push(blocker(doc, `${path}.choices`, `${choices.length} choices for ${items.length} items without reuse leaves no distractor`, id));
          }
        }
        const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
        if (dup.length) findings.push(blocker(doc, `${path}.choices`, `choice keys repeat: ${[...new Set(dup)].join(', ')}`, id));
        choices.forEach((c, i) => {
          if (!c.key) findings.push(blocker(doc, `${path}.choices[${i}].key`, 'choice without a key', id));
          if (!c.de && !c.textRef && !c.imageRef) findings.push(blocker(doc, `${path}.choices[${i}]`, `choice ${c.key} carries neither de, textRef nor imageRef`, id));
          if (t.choiceKind === 'picture' && !c.imageRef) findings.push(blocker(doc, `${path}.choices[${i}].imageRef`, `${block.template} choices are pictures; choice ${c.key} has no imageRef`, id));
          if (t.choiceKind && t.choiceKind !== 'picture' && c.imageRef && !c.de && !c.textRef) findings.push(blocker(doc, `${path}.choices[${i}]`, `${block.template} choices are of kind ${t.choiceKind}; choice ${c.key} is only a picture`, id));
        });
      }
      // no-match key
      const nm = block.noMatchKey;
      if (nm !== undefined && nm !== null) {
        if (!t.noMatch) findings.push(blocker(doc, `${path}.noMatchKey`, `${block.template} has no no-match option; the block declares "${nm}"`, id));
        else if (String(nm) !== String(t.noMatch)) findings.push(blocker(doc, `${path}.noMatchKey`, `no-match key "${nm}"; ${block.template} uses "${t.noMatch}"`, id));
        if (keySet.has(String(nm))) findings.push(blocker(doc, `${path}.noMatchKey`, `no-match key "${nm}" is also a choice key`, id));
      } else if (t.noMatch && choices.length) {
        findings.push(blocker(doc, `${path}.noMatchKey`, `${block.template} has a no-match option ("${t.noMatch}"); the block declares no noMatchKey`, id));
      }
      if (choices.length) {
        const used = new Map();
        items.forEach((it, i) => {
          const a = String(it.answer ?? '');
          const isNm = nm !== undefined && nm !== null && a === String(nm);
          if (!keySet.has(a) && !isNm) findings.push(blocker(doc, `${path}.items[${i}].answer`, `answer "${a}" is neither a choice key nor the no-match key`, it.id));
          if (Boolean(it.noMatch) !== isNm && (it.noMatch || isNm)) findings.push(blocker(doc, `${path}.items[${i}].noMatch`, `noMatch ${it.noMatch ? 'set' : 'missing'} but the answer is "${a}"`, it.id));
          if (!isNm && keySet.has(a)) used.set(a, [...(used.get(a) || []), it.id]);
        });
        if (t.choiceReuse !== true) {
          for (const [k, ids] of used) if (ids.length > 1) findings.push(blocker(doc, `${path}.items`, `choice ${k} answers ${ids.length} items (${ids.join(', ')}); ${block.template} does not reuse choices`, id));
        }
        if (block.length === 'full' && t.choiceReuse !== true && used.size >= choices.length && typeof t.choices === 'number' && t.choices > items.length) {
          findings.push(blocker(doc, `${path}.choices`, 'every choice is an answer; the template leaves distractors', id));
        }
      }
      // gap markers ⟦NN⟧: every gap item has exactly one marker and every marker one item
      if (GAP_TASKS.has(t.task)) {
        const markers = new Map();
        for (const { text } of arr(texts)) {
          const body = [text.text, ...arr(text.lines).map((l) => l?.de)].filter(Boolean).join('\n');
          for (const m of String(body).matchAll(/⟦(\d{2})⟧/g)) markers.set(m[1], (markers.get(m[1]) || 0) + 1);
        }
        if (markers.size || t.task === 'insert') {
          const suffixes = items.map((it) => suffixOf(it.id)).filter(Boolean);
          for (const sfx of suffixes) {
            const n = markers.get(sfx) || 0;
            if (n !== 1) findings.push(blocker(doc, `${path}.items`, `item …-${sfx} has ${n} gap markers ⟦${sfx}⟧ in the block's texts (exactly one)`, id));
          }
          for (const k of markers.keys()) if (!suffixes.includes(k)) findings.push(blocker(doc, `${path}.textRefs`, `gap marker ⟦${k}⟧ has no item`, id));
        }
      }
      if (choices.length && block.length === 'full' && /Beispiel[^.;)]*verbraucht|example[^.;)]*(?:uses up|consumes)/i.test(String(t.source || ''))) {
        const usedKeys = new Set(items.map((it) => String(it.answer ?? '')).filter((a) => keySet.has(a)));
        const withNoMatch = items.some((it) => nm !== undefined && nm !== null && String(it.answer ?? '') === String(nm));
        const total = typeof t.options === 'number' ? t.options : typeof t.choices === 'number' ? t.choices : choices.length;
        const want = total - items.length - 1 + (withNoMatch ? 1 : 0);
        const unused = choices.length - usedKeys.size;
        if (unused !== want) findings.push(advisory(doc, `${path}.choices`, `${unused} choice(s) left unused; in ${block.template} the example uses one up, so the exam leaves ${want} — carry the example (needs SCHEMA ExamBlock.example) or one more item`, id));
      }
      const noMatchItems = items.filter((it) => it.noMatch || (t.noMatch && String(it.answer).trim() === t.noMatch));
      if (t.noMatch && block.length === 'full' && !noMatchItems.length) findings.push(blocker(doc, `${path}.items`, `${block.template} has a no-match option (${t.noMatch}); no item uses it`, id));
      if (!t.noMatch && noMatchItems.some((it) => it.noMatch)) findings.push(blocker(doc, `${path}.items`, `${block.template} has no no-match option; an item is marked noMatch`, id));
      // distinct voices per text (TeilTemplate `speakers`, SCHEMA §4.3, 2026-09-28: sd1.h1 has 2): ADVISORY —
      // the exam's format, not a grading question
      if (typeof t.speakers === 'number') {
        for (const { text, path: tp } of arr(texts)) {
          const voices = new Set(arr(text?.lines).map((l) => l?.speaker).filter(Boolean));
          if (arr(text?.lines).length && voices.size !== t.speakers) findings.push(advisory(doc, tp, `${voices.size} speaker(s) in ${text.id}; a ${block.template} text has ${t.speakers}`, id));
        }
      }
      // a pictorial Teil in its text variant: every option names something the text says, or the pictures'
      // stand-ins are answered by word-matching (a1.1-u09 r2 F04: „Suppe" never heard in t6) — ADVISORY
      if (t.pictorial === true) {
        const byId = new Map(arr(texts).map(({ text }) => [text?.id, text]));
        for (const [k, it] of items.entries()) {
          const text = byId.get(it?.textRef);
          if (!text || arr(it?.options).length < 2) continue;
          const heard = new Set(tokens([...arr(text.lines).flatMap((l) => [l?.de, l?.say]), text.text].filter(Boolean).join(' ')).map((x) => x.lower));
          const absent = [];
          for (const o of arr(it.options)) {
            const words = tokens(String(o)).filter((x) => /^\p{Lu}/u.test(x.text) || (x.text.length >= 4 && !FUNCTION_WORDS.has(x.lower)));
            const miss = words.filter((w) => !heard.has(w.lower) && ![...heard].some((h) => h.length >= 4 && (h.startsWith(w.lower.slice(0, -1)) || w.lower.startsWith(h.slice(0, -1)))));
            if (words.length && miss.length === words.length) absent.push(`„${o}"`);
          }
          if (absent.length) findings.push(advisory(doc, `${path}.items[${k}].options`, `option(s) ${absent.join(', ')} never occur in ${it.textRef} — in a pictorial Teil's text variant every option is something the text mentions`, it.id || id));
        }
      }
      if (typeof t.plays === 'number' && (!short || !scaffold || scaffold.playsFixed !== false)) {
        const ins = String(block.instructionsDe || '').toLowerCase();
        const says = /\bzweimal\b|\b2-mal\b|\bzwei mal\b/.test(ins) ? 2 : /\beinmal\b|\bnur einmal\b|\b1-mal\b/.test(ins) ? 1 : null;
        if (says !== null && says !== t.plays) findings.push(blocker(doc, `${path}.instructionsDe`, `the instruction says ${says === 2 ? 'zweimal' : 'einmal'}; ${block.template} plays ${t.plays}×`, id));
        if (says === null) findings.push(advisory(doc, `${path}.instructionsDe`, `the instruction does not say how often the audio plays (${t.plays}×)`, id));
      }
    }
  }
  if (unknown) notes.push(`${unknown} block(s) whose template is not in a loaded lane registry (secondary lanes are deferred)`);
  return blocks ? { findings, notes } : { findings, notes, skipped: 'no exam block with a registered Teil template in the target yet' };
}
