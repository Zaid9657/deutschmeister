import { checkAnswer, checkOptionsFor, RESULT, spellingApplies } from '../../src/lib/lesson/check.js';
import { hintFor, hintContainsAnswer } from '../../src/lib/lesson/guidedFeedback.js';
import { judgeProof, proofHint, proofModel, proofTasks } from '../../src/lib/lesson/proof.js';

const nonempty = (v) => typeof v === 'string' && !!v.trim();
const list = (v) => Array.isArray(v) ? v : [];

/** One contract by class; curriculum and draft checking share it. Vocabulary is added by RULE 35. */
export function proofShapeFindings(curriculum) {
  const findings = [];
  for (const lesson of curriculum.lektionen || []) {
    if (lesson.proof === undefined) continue;
    const fail = (message) => findings.push(`L${lesson.nr}: proof ${message}`);
    if (lesson.flow !== 'guided') fail('requires guided flow');
    const tasks = lesson.proof?.tasks;
    if (!lesson.proof || typeof lesson.proof !== 'object' || !Array.isArray(tasks) || !tasks.length) { fail('needs a nonempty tasks array'); continue; }
    if (tasks.length !== lesson.canDo?.length) fail('needs exactly one task per can-do');
    for (const [i, task] of tasks.entries()) {
      const bad = (message) => fail(`task ${i + 1}: ${message}`);
      if (!task || typeof task !== 'object' || Array.isArray(task)) { bad('must be an object'); continue; }
      if (task.canDo !== i) bad('canDo indices must be in can-do order, starting at zero');
      if (!['production', 'multiple_choice'].includes(task.type)) bad('type must be production or multiple_choice');
      if (!nonempty(task.promptDe) || !nonempty(task.promptEn)) bad('needs bilingual prompts');
      if (!/\bSie\b/.test(task.promptDe || '') || /\b(?:du|dich|dein|deine|euch)\b/i.test(task.promptDe || '')) bad('prompt must address Sie');
      if (!nonempty(task.answer)) bad('needs a model answer');
      if (task.register !== undefined && !['formal', 'neutral'].includes(task.register)) bad('register must be formal or neutral');
      const parts = list(task.parts);
      const validParts = parts.length > 0 && parts.every((p) => p && typeof p === 'object' && nonempty(p.label?.de) && nonempty(p.label?.en) && Array.isArray(p.forms) && p.forms.length && p.forms.every(nonempty));
      if (task.type === 'production') {
        if (!validParts) bad('needs ordered parts, each with bilingual label and nonempty forms');
        if (task.accepted !== undefined) bad('production uses part forms, not whole-answer accepted strings');
        if (validParts) {
          for (const part of parts) {
            if (!task.ownName && part.forms.some((f) => f.replace(/[.!?]+$/, '').split(/[.!?]+/).length !== 1)) bad('each part form must be one sentence');
            if (task.register === 'formal' && part.forms.some((f) => /\b(?:Hallo|Tschüss|du|dir|dich|dein|deine|euch)\b/i.test(f))) bad('formal register cannot accept informal forms');
          }
          if (!task.ownName && nonempty(task.answer) && judgeProof(proofTasks({ ...lesson, proof: { tasks: [task] } })[0], task.answer).result === RESULT.WRONG) bad('model answer must fulfil every part in order');
        }
      } else if (!Array.isArray(task.accepted) || !task.accepted.length || !task.accepted.every(nonempty) || !task.accepted.includes(task.answer)) bad('needs nonempty accepted forms including the answer');
      const pointer = task.reteach;
      if (!proofModel(lesson, pointer)) bad('re-teach pointer must resolve to bilingual taught input');
      if (pointer?.kind === 'dialog' && (new Set(list(pointer.indices)).size !== list(pointer.indices).length || list(pointer.indices).some((n) => !Number.isInteger(n) || n < 0))) bad('dialogue pointer needs distinct nonnegative line indices');
      if (task.type === 'multiple_choice') {
        const options = task.options;
        if (!Array.isArray(options) || options.length < 2 || options.length > 4 || !options.every(nonempty) || new Set(options).size !== options.length
          || options.filter((v) => checkAnswer(v, list(task.accepted), checkOptionsFor(task)).result !== RESULT.WRONG).length !== 1 || !options.includes(task.answer)) bad('choices need 2–4 distinct options and exactly one right option through the common checker');
        if (task.ownName !== undefined) bad('choices cannot replace own-name production');
      } else if (task.options !== undefined) bad('production must not offer answer choices');
      if (task.ownName !== undefined) {
        if (parts.length !== 1 || !list(parts[0]?.forms).includes(task.answer)) bad('ownName needs one part containing the adapted model answer');
        if (!['full', 'first', 'surname'].includes(task.ownName)) bad('invalid ownName adapter');
        else if (task.ownName === 'full') {
          if (!/^Ich heiße .+/u.test(task.answer || '') || (task.openings !== undefined && (!Array.isArray(task.openings) || !task.openings.length || task.openings.some((o) => o !== 'Ich heiße')))) bad('full name must use the existing introduction adapter');
        } else if (!spellingApplies([task.answer])) bad('first/surname adapter requires a spelled answer');
      } else if (task.openings !== undefined) bad('openings require full-name adaptation');
      if (nonempty(task.answer) && (task.type === 'multiple_choice' || validParts)) {
        try {
          const hints = task.type === 'production' ? [proofHint(task), ...parts.map((_, p) => proofHint(task, p))] : [hintFor(task)];
          const accepted = task.type === 'production' ? parts.flatMap((p) => p.forms) : task.accepted;
          for (const h of [...hints, ...(task.hint ? [task.hint] : []), ...parts.flatMap((p) => p?.hint ? [p.hint] : [])]) {
            if (!nonempty(h.de) || !nonempty(h.en) || hintContainsAnswer(h.de, { ...task, accepted }) || hintContainsAnswer(h.en, { ...task, accepted })) bad('hint must be bilingual and never contain an accepted answer from any part');
          }
        } catch { bad('needs an answer-free bilingual hint'); }
      }
    }
  }
  return findings;
}

/** German surfaces shown or accepted; English is checked for presence by the shape rule. */
export function proofGermanTexts(lesson) {
  return list(lesson.proof?.tasks).flatMap((task) => task && typeof task === 'object' ? [
    task.promptDe, task.answer, ...list(task.accepted), ...list(task.options), ...list(task.openings), proofModel(lesson, task.reteach)?.de,
    ...list(task.parts).flatMap((p) => list(p?.forms)),
  ].filter((text) => typeof text === 'string') : []);
}
