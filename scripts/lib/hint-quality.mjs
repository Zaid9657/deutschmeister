import buildLesson from '../../src/lib/lesson/buildLesson.js';
import { meaningChoice } from '../../src/lib/lesson/derivedChoices.js';
import { hintFor, hintContainsAnswer } from '../../src/lib/lesson/guidedFeedback.js';
import { proofHint } from '../../src/lib/lesson/proof.js';

export const neutralHint = (hint) => /^(?:Once more\.|Try again\.|Reconsider your choice\.|Take another look\.|Noch einmal\.|Versuchen Sie es erneut\.|Prüfen Sie Ihre Auswahl\.|Überlegen Sie noch einmal\.)$/.test(hint);

/** Every renderer that calls guidedFeedback/hintFor, including each derived match pair.
 * read/sound are reported as potential hints: today they reveal after the first miss.
 * Sets, pretest, requeue and legacy tasks do not call the guided first-miss policy.
 */
export function guidedHintInventory(curriculum, pool, attempt = 1) {
  const rows = [];
  const add = (stage, item, reachable = true, hint = null) => rows.push({ stage, type: item.type || item.kind, item, reachable, ...(hint ? { hint } : {}) });
  for (const lesson of curriculum.lektionen || []) {
    if (lesson.flow !== 'guided') continue;
    for (const stage of buildLesson({ curriculum, lektion: lesson, pool, attempt }).stages) {
      if (stage.kind === 'scene') for (const chunk of stage.chunks) add('scene', chunk.meaning);
      if (stage.kind === 'wortfeld') for (const step of stage.steps.filter((s) => s.kind === 'check')) add('word-retrieval', step.item);
      if (['practice', 'derived', 'read', 'sound'].includes(stage.kind)) for (const item of stage.items) {
        if (item.type === 'match') item.pairs.forEach((pair, i) => add('derived-match', meaningChoice(pair, item.pairs, `${item.id}:${i}`)));
        else add(stage.kind, item, !['read', 'sound'].includes(stage.kind));
      }
      if (stage.kind === 'dictation') for (const line of stage.lines) add('dictation', { type: 'dictation', accepted: [line.de], answer: line.de });
      if (stage.kind === 'proof') for (const task of stage.tasks) {
        const item = { ...task, accepted: task.parts?.flatMap((p) => p.forms) || task.accepted || task.listening?.accepted };
        add('proof', item, true, proofHint(task));
      }
    }
  }
  return rows;
}

/** RULE 40: no neutral fallback or accepted-answer leak anywhere in the delivered hint flow. */
export function hintFindings(curriculum, pool) {
  const findings = [];
  for (const attempt of [1, 2, 3]) for (const row of guidedHintInventory(curriculum, pool, attempt)) {
    try {
      const hint = row.hint || hintFor(row.item);
      for (const lang of ['de', 'en']) if (!hint[lang] || neutralHint(hint[lang]) || hintContainsAnswer(hint[lang], row.item)) findings.push(`draw ${attempt}: ${row.stage}/${row.type} ${row.item.id || ''}: unsafe or neutral ${lang} hint`);
    } catch { findings.push(`draw ${attempt}: ${row.stage}/${row.type} ${row.item.id || ''}: no safe hint`); }
  }
  return findings;
}
