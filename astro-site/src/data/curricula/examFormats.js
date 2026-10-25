// Exam contracts shared by validators, builders and writing feedback.
const parts = (family, formats) => formats.map((format, i) => ({ teil: `${family} Teil ${i + 1}`, format }));
const a1Parts = [
  ...parts('Hören', ['mc3', 'true-false', 'mc3']),
  ...parts('Lesen', ['true-false', 'mc2', 'true-false']),
  ...parts('Schreiben', ['formular', 'mitteilung']),
  ...parts('Sprechen', ['self-introduction', 'questions', 'requests']),
];
const a2Parts = [
  ...parts('Hören', ['mc3', 'match', 'mc3-picture', 'yes-no']),
  ...parts('Lesen', ['mc3', 'mc3', 'mc3', 'match']),
  ...parts('Schreiben', ['sms', 'email']),
  ...parts('Sprechen', ['question-cards', 'talk-about-life', 'plan-together']),
];

export const EXAM_FORMATS = {
  goethe_a1: {
    parts: a1Parts,
    teile: a1Parts.map((p) => p.teil),
    writing: [
      { kind: 'formular', label: 'Formular', range: [5, 40] },
      { kind: 'mitteilung', label: 'Mitteilung', range: [25, 45] },
    ],
    checkpointReading: 'dialogue-true-false',
    writingSequence: 'alternating',
  },
  goethe_a2: {
    parts: a2Parts,
    teile: a2Parts.map((p) => p.teil),
    writing: [
      { kind: 'mitteilung', textsorte: 'sms', label: 'SMS', range: [20, 30] },
      { kind: 'mitteilung', textsorte: 'email', label: 'E-Mail', range: [30, 40] },
    ],
    checkpointReading: 'authored-exam-parts',
    writingSequence: 'declared',
    checkpointParts: [
      { lesen: 'Lesen Teil 3', hoeren: 'Hören Teil 4', hoerenKinds: ['dictation', 'dictation', 'trueFalse', 'trueFalse', 'trueFalse'] },
      { lesen: 'Lesen Teil 2', hoeren: 'Hören Teil 1' },
      { lesen: 'Lesen Teil 4', hoeren: 'Hören Teil 3' },
      { lesen: 'Lesen Teil 1', hoeren: 'Hören Teil 2' },
    ],
    speaking: {
      'Sprechen Teil 1': { format: 'question-cards', cards: 4 },
      'Sprechen Teil 2': { format: 'talk-about-life', prompts: 4 },
      'Sprechen Teil 3': { format: 'plan-together', calendars: 2 },
    },
  },
};

export function examFormat(examKey = 'goethe_a1') {
  const spec = EXAM_FORMATS[examKey];
  if (!spec) throw new Error(`Unknown course examKey "${examKey}"`);
  return spec;
}

export function writingFormat(examKey, teil) {
  return examFormat(examKey).writing[Number(String(teil).match(/Teil (\d+)$/)?.[1]) - 1] || null;
}

export function a2WritingFormat(task) {
  if (task.examKey !== 'goethe_a2') return null;
  const textsorte = task.textsorte || (/^sms-/.test(task.taskKey) ? 'sms' : /^email-/.test(task.taskKey) ? 'email' : null);
  const form = examFormat(task.examKey).writing.find((w) => w.textsorte === textsorte);
  if (!form) throw new Error('goethe_a2 writing task needs textsorte sms or email');
  return form;
}

export function lessonWritingFormat(examKey, lektion) {
  const exam = examFormat(examKey);
  return exam.writingSequence === 'alternating'
    ? exam.writing[(lektion.nr - 1) % exam.writing.length]
    : exam.writing.find((w) => w.kind === lektion.schreiben?.kind && w.textsorte === lektion.schreiben?.textsorte) || null;
}

export function writingSequenceErrors(curriculum) {
  const exam = examFormat(curriculum.examKey);
  const errors = [];
  for (const l of curriculum.lektionen || []) {
    const expected = lessonWritingFormat(curriculum.examKey, l);
    if (!expected) errors.push(`Lektion ${l.nr}: schreiben.textsorte must be one of ${exam.writing.map((w) => w.textsorte).join(', ')}`);
    else if (l.schreiben?.kind !== expected.kind) errors.push(`Lektion ${l.nr}: schreiben.kind must alternate (expected ${expected.kind})`);
  }
  if (exam.writingSequence === 'declared') {
    for (const form of exam.writing) {
      if (!(curriculum.lektionen || []).some((l) => l.schreiben?.kind === form.kind && l.schreiben?.textsorte === form.textsorte)) {
        errors.push(`schreiben.textsorte ${form.textsorte} is never rehearsed`);
      }
    }
  }
  return errors;
}
