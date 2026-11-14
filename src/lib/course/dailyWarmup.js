import { buildWordCardStage, cardWordSets } from '../lesson/wordCards.js';
import { dailyDay, yesterdayReteach } from './dailyLoop.js';
import { proofModel } from '../lesson/proof.js';

const phraseWords = (text) => ` ${String(text || '').toLocaleLowerCase('de').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
const containsPhrase = (text, phrase) => phraseWords(text).includes(phraseWords(phrase));

/** Prefer checked word recall with actual successful evidence; never infer success from completion. */
export function dailyWarmupRows(rows, index, curriculum, attempts = [], lessonNr = Infinity, run = null, today = new Date()) {
  const eligible = rows.filter((r) => {
    const c = index.get(r.card_key);
    return c && c.lektionNr <= lessonNr && c.kind === 'word' && r.step % 3 === 2 && r.last_result === 'correct';
  });
  const result = [];
  const repeat = yesterdayReteach(attempts, today);
  const repeatLesson = repeat && curriculum.lektionen.find((l) => l.id === repeat.lektion_id && l.nr <= lessonNr);
  const repeatTask = repeatLesson?.proof?.tasks?.find((_, i) => repeat.item_id === `proof-${repeatLesson.id}-${i}`);
  // proof-help rows are emitted only after ALL proof goals were eventually passed.
  if (repeatTask && (repeat.error_tag || repeat.errorTag) === 'proof-help') {
    const model = proofModel(repeatLesson, repeatTask.reteach)?.de;
    const entry = [...index].find(([, c]) => c.kind === 'word' && c.lektionNr <= repeatLesson.nr && c.back && containsPhrase(model, c.front));
    if (entry) result.push({ card_key: entry[0], step: 2, practiceOnly: true });
  }
  for (const row of eligible) if (result.length < 2 && !result.some((r) => r.card_key === row.card_key)) result.push(row);
  const current = curriculum.lektionen.find((l) => l.nr === lessonNr);
  if (current && run) {
    const scenes = (current.guided?.chunks || []).filter((_, i) => (run.attempts || []).some((a) => a.correct && a.stage === 'scene' && a.itemId === `scene-${current.id}-${i + 1}`));
    const familiar = scenes.flatMap((c) => current.dialog.lines.slice(c.from, c.to).map((l) => l.de)).join(' ').toLocaleLowerCase('de');
    for (const [key, card] of index) {
      if (result.length >= 2) break;
      if (card.kind === 'word' && card.lektionNr <= current.nr && card.back && containsPhrase(familiar, card.front) && !result.some((r) => r.card_key === key)) result.push({ card_key: key, step: 2, practiceOnly: true });
    }
    const sets = cardWordSets(current);
    const items = [...buildWordCardStage(current, sets.scene, 'wortfeld', run.attempt).steps, ...buildWordCardStage(current, sets.read, 'wortfeld-read', run.attempt).steps].filter((s) => s.kind === 'check').map((s) => s.item);
    for (const a of run.attempts || []) {
      const item = a.correct && items.find((i) => i.id === a.itemId);
      const entry = item && [...index].find(([, c]) => c.front === item.cardTarget && c.kind === 'word');
      if (entry && result.length < 2 && !result.some((r) => r.card_key === entry[0])) result.push({ card_key: entry[0], step: 2, practiceOnly: true });
    }
  }
  for (const lesson of curriculum.lektionen.filter((l) => l.nr <= lessonNr)) {
    for (const [i, task] of (lesson.proof?.tasks || []).entries()) {
      if (!attempts.some((a) => a.lektion_id === lesson.id && a.item_id === `proof-${lesson.id}-${i}` && a.stage === 'proof' && a.correct === true)) continue;
      const model = proofModel(lesson, task.reteach)?.de || '';
      for (const [key, card] of index) {
        if (result.length >= 2) break;
        if (card.kind !== 'word' || card.lektionNr > lesson.nr || !card.back || result.some((r) => r.card_key === key)) continue;
        // Exact taught phrases only, never a guessed association with a topic.
        if (containsPhrase(model, card.front)) {
          result.push({ card_key: key, step: 2, practiceOnly: true });
        }
      }
    }
  }
  // When no measured prior success exists, preserve the existing due-card path.
  return result.length ? result : rows;
}
export const needsDailyWarmup = (run, today = new Date()) => !!run && dailyDay(run.savedAt) < dailyDay(today) && run.stageKey !== 'warmup';
