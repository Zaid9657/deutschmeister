// Content contracts for short-answer reading and reserved checkpoint papers.
// These inspect the learner-visible task and its independent evidence, not IDs on an allow-list.
import { checkAnswer, checkOptionsFor, RESULT, numberWordsToDigits } from '../../src/lib/lesson/check.js';

const words = (s) => String(s || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
const norm = (s) => words(s).join(' ');
export const READING_FRAME = 'Ergänzen Sie mit einem Wort oder einer Zahl aus dem Text: ';
const TYPES = new Set(['exchange', 'message', 'note', 'ad', 'notice', 'form']);

export function shortReadingFindings(curriculum, { unknown = () => [], horizon = () => 0, practice = [] } = {}) {
  const findings = [], ids = new Set(), allTexts = new Set();
  const practised = new Set(practice.map(norm));
  for (const cp of curriculum.checkpoints || []) {
    const papers = cp.lesen?.papers;
    if (!Array.isArray(papers) || papers.length !== 4) { findings.push(`${cp.id}: four reading papers required`); continue; }
    for (const [pi, paper] of papers.entries()) {
      const at = `${cp.id}/${pi}`;
      if (paper.length !== 4) findings.push(`${at}: four independent reading texts required`);
      const keys = new Set();
      for (const u of paper) {
        const flag = (s) => findings.push(`${u.id || at}: ${s}`);
        if (!u.id || ids.has(u.id)) flag('missing or duplicate unit id');
        ids.add(u.id);
        if (u.kind !== 'reading_gap' || u.options != null || u.pair != null) flag('short answers must have no visible choices or mirrored pair');
        if (!u.question?.startsWith(READING_FRAME) || u.question.split('___').length !== 2) flag('one explicitly framed gap required');
        const frame = String(u.question || '').replace(READING_FRAME, '');
        if (words(u.answer).length !== 1 || !words(u.text).includes(norm(u.answer))) flag('key must be one word or number in the text');
        if (words(frame).includes(norm(u.answer))) flag('key already printed in the response frame');
        const key = norm(numberWordsToDigits(u.answer));
        if (keys.has(key)) flag('independent tasks must not share a constant answer within the paper');
        keys.add(key);
        if (!u.evidence || !u.text?.includes(u.evidence)) flag('evidence must be a literal span of the text');
        if (!u.explanationDe?.includes(u.evidence) || !u.explanationEn || !u.questionEn || !u.rival) flag('both languages need an explanation and the evidence');
        if (!u.rejected?.length || u.rejected.some((answer) => checkAnswer(answer, [u.answer], { readingAnswer: true }).result !== RESULT.WRONG)) flag('competing details must be rejected, not typo-credit answers');
        const tokens = words(u.text);
        if (!TYPES.has(u.type) || tokens.length < 12 || tokens.length > 70) flag('introduced text type and 12–70-word text required');
        if (allTexts.has(norm(u.text))) flag('reading text repeats within the bank');
        allTexts.add(norm(u.text));
        for (const [field, value] of [['text', u.text], ['frame', frame], ['explanationDe', u.explanationDe]]) {
          const missing = unknown(value, cp.afterLektion);
          if (missing.length) flag(`${field}: untaught ${missing.join(', ')}`);
          for (const sentence of String(value || '').split(/(?<=[.!?])\s+|\n+/)) {
            const h = horizon(sentence.replace('___', u.answer));
            if (h === null || h > cp.afterLektion) flag(`${field}: untaught construction in ${sentence}`);
          }
        }
        for (const sentence of String(u.text || '').split(/(?<=[.!?])\s+|\n+/)) {
          const bare = norm(sentence.replace(/^[A-ZÄÖÜ][a-zäöüß]+:\s/, ''));
          if (bare.split(' ').length >= 4 && practised.has(bare)) flag('reading sentence already practised');
        }
      }
    }
  }
  return findings;
}

export function reservedAssessmentFindings(curriculum, pool) {
  const findings = [], ids = new Set(), prompts = new Set();
  const normPrompt = (it) => norm(it.questionDe).replace(/^schreiben sie den ganzen satz /, '');
  const practice = new Set(pool.filter((it) => !it.assessment).map(normPrompt));
  for (const cp of curriculum.checkpoints || []) {
    if (cp.assessmentPapers !== 4 || cp.assessmentPapers !== cp.lesen?.papers?.length) findings.push(`${cp.id}: four reserved papers must match the reading cycle`);
    for (let round = 0; round < 4; round++) {
      const rows = pool.filter((it) => it.assessment?.checkpoint === cp.id && it.assessment.paper === round);
      for (const [section, count] of [['bausteine', 6], ['schreiben', 2]]) {
        if (rows.filter((it) => it.assessment.section === section).length !== count) findings.push(`${cp.id}/${round}: needs ${count} ${section} items`);
      }
      if (rows.filter((it) => it.assessment.source === 'earlier').length !== (cp.nr === 1 ? 0 : 2)) findings.push(`${cp.id}/${round}: earlier-chapter interleave missing`);
      for (const it of rows) {
        if (ids.has(it.id) || prompts.has(normPrompt(it)) || practice.has(normPrompt(it))) findings.push(`${it.id}: repeated assessment/practice task`);
        ids.add(it.id); prompts.add(normPrompt(it));
        if (!Number.isInteger(it.minLektion) || it.minLektion > cp.afterLektion) findings.push(`${it.id}: not taught by checkpoint`);
        if (!it.questionEn || !it.explanationDe || !it.explanationEn) findings.push(`${it.id}: missing bilingual task or feedback`);
        if (it.type === 'fill_blank' && /\(\d+[;)]/.test(it.questionDe) && !it.questionDe.includes('Schreiben Sie die Zahl in Worten')) findings.push(`${it.id}: number-word production needs an explicit German instruction`);
        if (it.type === 'fill_blank' && !/\([^)]*, Sie\)/.test(it.questionDe) && !it.questionDe.includes('Ergänzen Sie mit einem Wort')) findings.push(`${it.id}: bounded gap production needs its one-word instruction`);
        if (it.options?.length || !['fill_blank', 'sentence_building', 'error_correction'].includes(it.type)) findings.push(`${it.id}: typed transfer required`);
        if (checkAnswer(it.answer, it.accepted, checkOptionsFor(it)).result !== RESULT.CORRECT) findings.push(`${it.id}: its own key is rejected`);
      }
    }
  }
  for (const it of pool.filter((row) => row.assessment)) if (!ids.has(it.id)) findings.push(`${it.id}: orphaned assessment task`);
  return findings;
}

export function finalTestContentFindings(mock, { unknown = () => [] } = {}) {
  const findings = [];
  const reading = mock.sections.find((s) => s.key === 'lesen');
  const writing = mock.sections.find((s) => s.key === 'schreiben');
  // Format words are instructions, not extra content vocabulary; this set contains no answer key.
  const format = new Set(['Schild', 'Anzeige', 'Schreiben', 'Mitteilung', 'diesen', 'Punkten', 'Anrede']);
  for (const p of reading.parts) {
    for (const text of [p.text, ...p.items.map((i) => i.prompt)].filter(Boolean)) {
      const missing = unknown(text).filter((w) => !format.has(w));
      if (missing.length) findings.push(`${p.key}: untaught ${missing.join(', ')}`);
    }
    for (const i of p.items) {
      if (!i.options.some((o) => o.key === i.answer) || !i.evidence || !(p.text || i.prompt).includes(i.evidence) || !i.explanationDe) findings.push(`${i.id}: answer needs textual evidence and explanation`);
    }
  }
  for (const p of writing.parts) {
    const missing = unknown(p.task).filter((w) => !format.has(w));
    if (missing.length) findings.push(`${p.key}: untaught ${missing.join(', ')}`);
  }
  const address = [mock.intro, ...mock.sections.map((s) => s.instructions),
    ...writing.parts.flatMap((p) => [p.task, ...p.criteria]), ...Object.values(mock.verdictCopyDe || {}).flatMap((v) => [v.title, v.body])];
  for (const text of address) if (/\b(?:[Dd]u|[Dd]ein\w*|Lies|Schreib|nutze)\b/.test(text)) findings.push('course instruction uses informal address');
  if (!mock.verdictCopyDe || !/nur Hören und Lesen/.test(mock.intro) || !/nicht.*Prozentwert/.test(writing.instructions)) findings.push('must disclose the two scored skills and unscored writing');
  if (/halbe Länge|Wie bei der echten Prüfung|vollständige[nr]? Übungsprüfung/.test(mock.intro)) findings.push('unsupported exam equivalence or onward promise');
  return findings;
}
