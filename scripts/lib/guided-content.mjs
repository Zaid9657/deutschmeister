import { checkAnswer, checkOptionsFor, RESULT } from '../../src/lib/lesson/check.js';
import { LEARNER_CAST } from '../../src/data/curricula/a11.js';

/** Validate every guided field by class, so later guided lessons inherit the same contract. */
export function guidedFindings(curriculum) {
  const findings = [];
  for (const lesson of curriculum.lektionen || []) {
    if (lesson.flow === undefined && lesson.guided === undefined) continue;
    const fail = (message) => findings.push(`L${lesson.nr}: ${message}`);
    if (lesson.flow !== 'guided' || !lesson.guided || typeof lesson.guided !== 'object') {
      fail('flow must be guided and carry a guided block'); continue;
    }
    const chunks = lesson.guided.chunks;
    const lines = lesson.dialog?.lines || [];
    if (!Array.isArray(chunks) || !chunks.length) { fail('guided.chunks must not be empty'); continue; }
    let end = 0;
    for (const [i, chunk] of chunks.entries()) {
      if (!chunk || typeof chunk !== 'object') { fail(`chunk ${i + 1} must be an object`); continue; }
      if (!Number.isInteger(chunk.from) || !Number.isInteger(chunk.to) || chunk.from !== end
        || chunk.to > lines.length || chunk.to - chunk.from < 2 || chunk.to - chunk.from > 3) {
        fail(`chunk ${i + 1}: contiguous boundaries must cover 2–3 original lines`);
      }
      end = chunk.to;
      const meaning = chunk.meaning;
      for (const field of ['promptDe', 'promptEn', 'answer']) {
        if (typeof meaning?.[field] !== 'string' || !meaning[field].trim()) fail(`chunk ${i + 1}: meaning.${field} is required`);
      }
      if (typeof meaning?.promptDe === 'string' && !/\bSie\b/.test(meaning.promptDe)) fail(`chunk ${i + 1}: meaning task must address Sie`);
      const options = meaning?.options;
      if (!Array.isArray(options) || options.length < 2 || options.length > 4 || options.some((v) => typeof v !== 'string' || !v.trim()) || new Set(options).size !== options.length) {
        fail(`chunk ${i + 1}: meaning needs 2–4 distinct nonempty English options`);
      } else {
        const item = { type: 'multiple_choice' };
        const correct = options.filter((v) => checkAnswer(v, [meaning.answer], checkOptionsFor(item)).result !== RESULT.WRONG);
        if (correct.length !== 1 || correct[0] !== meaning.answer) fail(`chunk ${i + 1}: exactly one meaning option must match the answer through checkAnswer`);
      }
      const say = chunk.say;
      const line = lines[say?.line];
      if (!Number.isInteger(say?.line) || say.line < chunk.from || say.line >= chunk.to || !LEARNER_CAST.includes(line?.speaker)) {
        fail(`chunk ${i + 1}: say.line must belong to the chunk and the learner role`);
      }
      if (say?.ownName !== undefined && !['full', 'surname', 'first'].includes(say.ownName)) fail(`chunk ${i + 1}: invalid say.ownName`);
      const introduction = /Ich heiße .+/u.test(line?.de || '');
      const spelling = /^\p{L}(?:-\p{L})+[.]?$/u.test(line?.de || '');
      if (introduction && say?.ownName !== 'full') fail(`chunk ${i + 1}: an introduction must use the learner's full name`);
      if (spelling && !['first', 'surname'].includes(say?.ownName)) fail(`chunk ${i + 1}: a spelled name must use the learner's own name`);
      if (say?.ownName && !(introduction && say.ownName === 'full') && !(spelling && ['first', 'surname'].includes(say.ownName))) fail(`chunk ${i + 1}: name adaptation must fit the original line`);
    }
    if (end !== lines.length) fail('guided chunks must cover every original dialogue line exactly once');
  }
  return findings;
}
