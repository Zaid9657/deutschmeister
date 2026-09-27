// ITM-13 — audio keys: what the learner HEARS decides the key (rule-smith 2026-09-27; BLUEPRINT §9.4:
// the class survived review rounds on four levels, so it became a rail).
//
// Dictations — authored `type: 'dictation'` items and every line a `dictation.fromInput` generator
// names (built here by the player's own generator, src/components/course-v2/content.js
// dictationItems, and graded by the player's own checkItem):
//   1. the key holds only letters, digits, blanks and the punctuation the checker folds
//      (check.js unfoldedDictationChars): „(", „)", „/" between words, „%", „€" … can never be typed
//      from the audio (review a2.2-u04 r3 F02; „…" is folded since the same round);
//   2. a faithful transcription of the audio — the line's `say` (the TTS text) when it has one, else
//      its `de` — is graded CORRECT against the key: „… eins neunzehn." never matches the key
//      „… 1,19 Euro." (review a1.1-u04 r2 F01); number words and digits already fold;
//   3. length: at A levels ≤ 12 words and ≤ 2 sentences (review a2.1-u04 r3 F08), at B1 ≤ 15 words and
//      one sentence (review b1.1-u04 r2 F11); B2 has no cap (no review asked for one). One slip
//      anywhere costs the whole item, so a paragraph measures stamina, not the target.
// Perception (`listen_select` with the options „Frage"/„Aussage" or „keine Frage"): the played text
// (`speak`, the `audioLineRef` line or the prompt's quotation) ends in „?" exactly when the key is
// „Frage" (review a1.2-u04 r1 F01).

import { walkSteps, walkItems } from '../lib-validate/walk.mjs';
import { sentences, wordCount } from '../lib-validate/text.mjs';
import { bandOfLevel } from '../lib-validate/ids.mjs';
import { arr, isObj, blocker, list } from '../lib-validate/helpers.mjs';

export const id = 'ITM-13';
export const title = 'Audio keys: dictations typeable and graded as heard; Frage/Aussage follows the played text';
export const type = 'hard';
export const scope = 'unit';
export const stage = 'I';

let content = null;
let checker = null;
let loadError = null;
try {
  content = await import('../../../src/components/course-v2/content.js');
  checker = await import('../../../src/lib/course-v2/checkItem.js');
} catch (e) {
  loadError = e.message;
}
const lesson = await import('../../../src/lib/lesson/check.js');

/** Dictation length caps per band (words, sentences); null = no cap. */
export const DICTATION_CAPS = Object.freeze({ a1: [12, 2], a2: [12, 2], b1: [15, 1], b2: null });

const QUESTION = /^frage$/i;
const STATEMENT = /^(?:aussage|keine\s+frage)$/i;
const endsInQuestion = (s) => /\?\s*[“”"»]?\s*$/.test(String(s || '').trim());

/** The findings on one dictation item (authored or generated) against its audio line. */
function dictationFindings(doc, item, line, path, where) {
  const out = [];
  const forms = [item.answer, ...arr(item.accepted)].filter((x) => typeof x === 'string');
  const bad = [...new Set(forms.flatMap((f) => lesson.unfoldedDictationChars(f)))];
  if (bad.length) {
    out.push(blocker(doc, path, `${where} key contains ${bad.map((c) => `„${c}"`).join(' ')} — the checker folds no such character, so no transcription of the audio can match it; write it as it is spoken`, item.id));
  }
  if (line && checker) {
    const heard = String(line.say || line.de || '');
    const r = checker.checkItem(item, heard).result;
    if (heard && r !== checker.RESULT.CORRECT) {
      out.push(blocker(doc, path, `${where}: the audio says „${heard}"${line.say ? ' (say)' : ''}, and that transcription is graded ${r.toUpperCase()} against the key „${item.answer}"`, item.id));
    }
  }
  const cap = DICTATION_CAPS[bandOfLevel(doc.level)];
  const key = String(item.answer || '');
  if (cap && key) {
    const w = wordCount(key);
    const s = sentences(key).length;
    if (w > cap[0] || s > cap[1]) {
      out.push(blocker(doc, path, `${where}: ${w} words in ${s} sentence(s) — a ${doc.level} dictation holds ≤ ${cap[0]} words in ≤ ${cap[1]} sentence(s)`, item.id));
    }
  }
  return out;
}

export function run({ docs }) {
  const findings = [];
  const notes = [];
  if (loadError) notes.push(`player modules not importable (${loadError}); the audio-agreement check did not run`);
  let n = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit') continue;
    const lines = content ? content.lineIndex(doc.data) : new Map();
    // authored dictations and perception items
    for (const { item, path } of walkItems(doc)) {
      if (!isObj(item)) continue;
      if (item.type === 'dictation') {
        n += 1;
        findings.push(...dictationFindings(doc, item, lines.get(item.audioLineRef), path, 'dictation'));
        continue;
      }
      if (item.type !== 'listen_select') continue;
      const opts = arr(item.options).map(String);
      const key = String(item.answer || '').trim();
      if (!opts.some((o) => QUESTION.test(o.trim())) || !(QUESTION.test(key) || STATEMENT.test(key))) continue;
      n += 1;
      const line = lines.get(item.audioLineRef);
      const played = item.speak || line?.say || line?.de || (content ? content.quoteOf(item.promptDe) : null);
      if (!played) {
        findings.push(blocker(doc, path, `a Frage/Aussage item without a played text (speak, audioLineRef or a quotation in promptDe)`, item.id));
        continue;
      }
      if (QUESTION.test(key) !== endsInQuestion(played)) {
        findings.push(blocker(doc, `${path}.answer`, `key „${key}", but the played text „${played}" ${endsInQuestion(played) ? 'is' : 'is not'} a question`, item.id));
      }
    }
    // generated dictations: the player's own generator over every source line
    for (const { step, path } of walkSteps(doc)) {
      arr(step?.pool?.generators).forEach((g, gi) => {
        if (!isObj(g) || g.generator !== 'dictation.fromInput') return;
        const sources = arr(g.source);
        const spec = { ...g, count: sources.length, ids: sources.map((_, k) => `${step.id}-gen${gi}-${k}`) };
        const items = content ? content.dictationItems(spec, lines) : [];
        items.forEach((item) => {
          n += 1;
          const k = spec.ids.indexOf(item.id);
          findings.push(...dictationFindings(doc, item, lines.get(item.audioLineRef), `${path}.pool.generators[${gi}].source[${k}]`, `dictation source ${sources[k]}`));
        });
      });
    }
  }
  if (!n) return { findings, skipped: 'no dictation or Frage/Aussage item in the target yet', notes };
  const capped = Object.entries(DICTATION_CAPS).map(([b, c]) => `${b} ${c ? `≤ ${c[0]} words/${c[1]} sentence(s)` : 'no cap'}`);
  notes.push(`dictation caps: ${list(capped)}`);
  return { findings, notes };
}
