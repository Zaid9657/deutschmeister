import { expandProofPart } from '../../src/lib/lesson/proofFrames.js';
import { checkAnswer, checkOptionsFor, RESULT, spellingApplies } from '../../src/lib/lesson/check.js';
import { hintFor, hintContainsAnswer } from '../../src/lib/lesson/guidedFeedback.js';
import { judgeProof, proofHint, proofModel, proofTasks, proofSpelling } from '../../src/lib/lesson/proof.js';

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
      if (!['production', 'multiple_choice', 'listen_spelling', 'listening'].includes(task.type)) bad('type must be production, multiple_choice or listen_spelling');
      if (!nonempty(task.promptDe) || !nonempty(task.promptEn)) bad('needs bilingual prompts');
      if (!/\bSie\b/.test(task.promptDe || '') || /\b(?:du|dich|dein|deine|euch)\b/i.test(task.promptDe || '')) bad('prompt must address Sie');
      if (!nonempty(task.answer)) bad('needs a model answer');
      if (task.register !== undefined && !['formal', 'neutral', 'informal'].includes(task.register)) bad('register must be formal, informal or neutral');
      const parts = list(task.parts).map((p) => p && expandProofPart(p, task.sets));
      if (task.order !== undefined && !['ordered', 'any'].includes(task.order)) bad('order must be ordered or any');
      for (const p of list(task.parts)) {
        if (p?.maxSentences !== undefined && (!Number.isInteger(p.maxSentences) || p.maxSentences < 1 || p.maxSentences > 4)) bad('maxSentences must be 1–4');
        for (const frame of list(p?.frames)) {
          const names = typeof frame?.pattern === 'string' ? [...frame.pattern.matchAll(/\{(\w+)\}/g)].map((m) => m[1]) : [];
          if (!names.length || names.some((n) => !Array.isArray(task.sets?.[frame.slots?.[n]]) || !task.sets[frame.slots[n]].length || !task.sets[frame.slots[n]].every(nonempty))) bad('frame needs a pattern and nonempty named slot sets');
        }
      }
      const validParts = parts.length > 0 && parts.every((p) => p && typeof p === 'object' && nonempty(p.label?.de) && nonempty(p.label?.en) && Array.isArray(p.forms) && p.forms.length && p.forms.every(nonempty));
      if (task.type === 'listen_spelling') {
        if (task.listenSpelling !== true || !proofSpelling(lesson, task.listenFrom)) bad('listen_spelling needs a valid taught spelled-name pointer and alphabet');
        if (!validParts || task.ownName !== 'surname' || parts.length !== 1 || !list(parts[0]?.forms).includes(task.answer)) bad('listen_spelling needs its own-surname microphone adapter and one spelled model part');
        if (proofSpelling(lesson, task.listenFrom) && lesson.dialog.lines[task.listenFrom.index].de !== task.answer) bad('listen_spelling model must match its dialogue pointer');
        if (task.accepted !== undefined) bad('listen_spelling derives its typed answer from the dialogue');
      } else if (task.listenSpelling !== undefined || task.listenFrom !== undefined) bad('spelling listening requires type listen_spelling');
      if (task.type === 'production') {
        if (!validParts) bad('needs ordered parts, each with bilingual label and nonempty forms');
        if (task.accepted !== undefined) bad('production uses part forms, not whole-answer accepted strings');
        if (validParts) {
          for (const part of parts) {
            if (!task.ownName && part.forms.some((f) => f.replace(/[.!?]+$/, '').split(/[.!?]+/).length > (part.maxSentences || 1))) bad('each part form must be one sentence');
            if (task.register === 'formal' && part.forms.some((f) => /\b(?:Hallo|Tschüss|du|dir|dich|dein|deine|euch)\b/i.test(f))) bad('formal register cannot accept informal forms');
          }
          if (!task.ownName && nonempty(task.answer) && judgeProof(proofTasks({ ...lesson, proof: { tasks: [task] } })[0], task.answer).result === RESULT.WRONG) bad('model answer must fulfil every part in order');
        }
      } else if (!['listen_spelling', 'listening'].includes(task.type) && (!Array.isArray(task.accepted) || !task.accepted.length || !task.accepted.every(nonempty) || !task.accepted.includes(task.answer))) bad('needs nonempty accepted forms including the answer');
      const pointer = task.reteach;
      if (!proofModel(lesson, pointer)) bad('re-teach pointer must resolve to bilingual taught input');
      if (pointer?.kind === 'dialog' && (new Set(list(pointer.indices)).size !== list(pointer.indices).length || list(pointer.indices).some((n) => !Number.isInteger(n) || n < 0))) bad('dialogue pointer needs distinct nonnegative line indices');
      if (task.type === 'listening') {
        if (!['choice', 'write', 'parts'].includes(task.mode) || !Array.isArray(task.instances) || !task.instances.length) bad('listening needs mode and instances');
        for (const instance of list(task.instances)) {
          if (task.mode === 'parts' && (!list(instance.parts).length || list(instance.parts).some((p) => !p?.label?.de || !p?.label?.en || !list(p.forms).length || !p.forms.every(nonempty)) || judgeProof({ ...task, ...instance }, instance.answer).result === RESULT.WRONG)) bad('listening parts need complete checked bilingual parts and a passing model');
          if (!nonempty(instance.audioText) || !nonempty(instance.answer) || (task.mode !== 'parts' && !list(instance.accepted).includes(instance.answer))) bad('listening instance needs audio and checked answer');
          if (task.mode === 'choice' && (!Array.isArray(instance.options) || instance.options.length < 2 || instance.options.length > 4 || new Set(instance.options).size !== instance.options.length || instance.options.filter((v) => checkAnswer(v, instance.accepted, checkOptionsFor({ ...instance, mode: 'options' })).result !== RESULT.WRONG).length !== 1)) bad('listening choices need 2–4 distinct options and exactly one right answer');
          if (task.mode === 'write' && instance.options !== undefined) bad('written listening cannot offer options');
        }
      }
      if (task.type === 'multiple_choice') {
        const options = task.options;
        if (!Array.isArray(options) || options.length < 2 || options.length > 4 || !options.every(nonempty) || new Set(options).size !== options.length
          || options.filter((v) => checkAnswer(v, list(task.accepted), checkOptionsFor(task)).result !== RESULT.WRONG).length !== 1 || !options.includes(task.answer)) bad('choices need 2–4 distinct options and exactly one right option through the common checker');
        if (task.ownName !== undefined) bad('choices cannot replace own-name production');
      } else if (task.type !== 'listening' && task.options !== undefined) bad('production must not offer answer choices');
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
    task.answer, ...list(task.context), ...list(task.accepted), ...list(task.options), ...list(task.openings), ...list(task.instances).flatMap((i) => [i.audioText, i.answer, ...list(i.accepted), ...list(i.options), ...list(i.parts).flatMap((p) => list(p.forms))]), proofModel(lesson, task.reteach)?.de,
    ...list(task.parts).flatMap((p) => expandProofPart(p, task.sets).forms),
  ].filter((text) => typeof text === 'string') : []);
}
