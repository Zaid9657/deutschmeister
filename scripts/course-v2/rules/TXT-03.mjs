// TXT-03 — input sizes (BLUEPRINT §9.1, §3.3): A-level Situation inputs 8–14 lines (A1.1 6–10),
// 60–120 s; B-level texts 150–450 words or 2–4 min of audio; scenes (Folge) ≤ 90 s at A1, ≤ 2 min
// above. Line and word counts are hard. Durations are hard when the compiler has written
// `seconds`; before that they are ESTIMATED from the words (advisory).

import { walkTexts } from '../lib-validate/walk.mjs';
import { wordCount } from '../lib-validate/text.mjs';
import { levelNumbers, arr, blocker, advisory } from '../lib-validate/helpers.mjs';

export const id = 'TXT-03';
export const title = 'Input sizes: lines, words and seconds per level';
export const type = 'hard';
export const scope = 'unit';

const WORDS_PER_SECOND = 2.3; // TTS at -5 … -10 % rate (design; replace with measured seconds)
const PAUSE_PER_LINE = 0.4;

function duration(lines) {
  const measured = lines.every((l) => typeof l?.seconds === 'number');
  if (measured && lines.length) return { seconds: lines.reduce((a, l) => a + l.seconds, 0), measured: true };
  const words = lines.reduce((a, l) => a + wordCount(l?.de), 0);
  return { seconds: Math.round(words / WORDS_PER_SECOND + PAUSE_PER_LINE * lines.length), measured: false };
}

export function run({ ctx, docs }) {
  const findings = [];
  let n = 0;
  for (const doc of docs) {
    if (doc.kind !== 'unit') continue;
    const L = levelNumbers(ctx, doc.level);
    const aLevel = L.skeleton === 'A';
    const sceneMax = doc.level.startsWith('a1') ? 90 : 120;
    for (const t of walkTexts(doc)) {
      if (t.kind === 'folge') {
        n += 1;
        const d = duration(t.lines);
        if (d.seconds > sceneMax) {
          const f = d.measured ? blocker : advisory;
          findings.push(f(doc, t.path, `scene ${d.measured ? '' : '≈ '}${d.seconds} s (max ${sceneMax} s)${d.measured ? '' : ' — estimated from words'}`, doc.data.id));
        }
        continue;
      }
      if (t.kind !== 'input') continue;
      n += 1;
      const lines = arr(t.lines);
      if (aLevel && lines.length && L.dialogLines) {
        const [lo, hi] = L.dialogLines;
        if (lines.length < lo || lines.length > hi) findings.push(blocker(doc, `${t.path}.lines`, `${lines.length} lines (need ${lo}–${hi} at ${doc.level})`, t.step?.id));
        const d = duration(lines);
        if (d.seconds < 60 || d.seconds > 120) {
          const f = d.measured ? blocker : advisory;
          findings.push(f(doc, `${t.path}.lines`, `input ${d.measured ? '' : '≈ '}${d.seconds} s (need 60–120 s)${d.measured ? '' : ' — estimated from words'}`, t.step?.id));
        }
      }
      if (!aLevel) {
        if (t.writtenText && !lines.length) {
          const w = wordCount(t.writtenText);
          if (w < 150 || w > 450) findings.push(blocker(doc, `${t.path}.text`, `${w} words (need 150–450 at B levels)`, t.step?.id));
        } else if (lines.length) {
          const d = duration(lines);
          if (d.seconds < 120 || d.seconds > 240) {
            const f = d.measured ? blocker : advisory;
            findings.push(f(doc, `${t.path}.lines`, `audio ${d.measured ? '' : '≈ '}${d.seconds} s (need 2–4 min at B levels)${d.measured ? '' : ' — estimated from words'}`, t.step?.id));
          }
        }
      }
    }
  }
  return n ? { findings } : { findings, skipped: 'no Folge or Lernschritt input in the target yet' };
}
