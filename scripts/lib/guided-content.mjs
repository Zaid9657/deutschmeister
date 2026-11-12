import { checkAnswer, checkOptionsFor, RESULT } from '../../src/lib/lesson/check.js';
import { readLexicon } from '../../src/lib/lesson/guidedRead.js';
import { glossTokens } from '../../src/lib/lesson/gloss.js';
import { lineFor } from '../../src/lib/lesson/wortfeldPacing.js';
import { LEARNER_CAST } from '../../src/data/curricula/a11.js';

/** Validate every guided field by class, so later guided lessons inherit the same contract. */
export function guidedFindings(curriculum) {
  const findings = [];
  for (const lesson of curriculum.lektionen || []) {
    if (lesson.nextHook !== undefined && (!lesson.nextHook || typeof lesson.nextHook !== 'object'
      || ['de', 'en'].some((key) => typeof lesson.nextHook[key] !== 'string' || !lesson.nextHook[key].trim()))) findings.push(`L${lesson.nr}: nextHook needs nonempty German and English twins`);
    if (lesson.flow === undefined && lesson.guided === undefined) continue;
    const fail = (message) => findings.push(`L${lesson.nr}: ${message}`);
    if (lesson.flow !== 'guided' || !lesson.guided || typeof lesson.guided !== 'object') {
      fail('flow must be guided and carry a guided block'); continue;
    }
    const chunks = lesson.guided.chunks;
    const lines = lesson.dialog?.lines || [];
    if (!Array.isArray(chunks) || !chunks.length) { fail('guided.chunks must not be empty'); continue; }
    const read = lesson.guided.read;
    for (const key of ['titleDe', 'titleEn', 'instructionDe', 'instructionEn', 'text']) {
      if (typeof read?.[key] !== 'string' || !read[key].trim()) fail(`guided.read.${key} is required`);
    }
    if (!/\bSie\b/.test(read?.instructionDe || '')) fail('guided.read instruction must address Sie');
    if (!Array.isArray(read?.questions) || read.questions.length !== 2) fail('guided.read needs two questions');
    for (const [i, q] of (Array.isArray(read?.questions) ? read.questions : []).entries()) {
      if (['promptDe', 'promptEn', 'explanationDe', 'explanationEn'].some((k) => typeof q?.[k] !== 'string' || !q[k].trim()) || !/\bSie\b/.test(q?.promptDe || '')) fail(`guided.read question ${i + 1} needs bilingual Sie prompts and reasons`);
      if (!Array.isArray(q?.options) || q.options.length < 2 || q.options.length > 4 || new Set(q.options).size !== q.options.length || q.options.some((v) => typeof v !== 'string' || !v.trim()) || q.options.filter((v) => checkAnswer(v, [q.answer], checkOptionsFor({ type: 'multiple_choice' })).result !== RESULT.WRONG).length !== 1 || !q.options.includes(q.answer)) fail(`guided.read question ${i + 1} needs distinct choices and exactly one checked answer`);
    }
    const dialogue = lines.map((l) => l.de);
    const readGlosses = new Set(glossTokens(read?.text || '', readLexicon(lesson.wortfeld || [])).filter((s) => s.type === 'gloss').map((s) => s.entry.de));
    for (const w of lesson.wortfeld || []) {
      if (!lineFor(w.de || w.word, dialogue) && !readGlosses.has(w.de)) fail(`guided.read must cover remaining Wortfeld entry ${w.de}`);
    }
    for (const marked of lesson.phonetik?.items || []) {
      if (typeof marked !== 'string' || marked.split('-').length < 2 || marked.split('-').some((s) => !/^\p{L}+$/u.test(s)) || marked.split('-').filter((s) => s === s.toLocaleUpperCase('de')).length !== 1) fail('guided sound items need syllables and exactly one capitalised stress');
    }
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
