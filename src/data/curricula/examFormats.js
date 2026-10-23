// Exam contracts, not item renderers. The A2 surfaces themselves arrive in G9.
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
  },
  goethe_a2: {
    parts: a2Parts,
    teile: a2Parts.map((p) => p.teil),
    writing: [
      { kind: 'mitteilung', textsorte: 'sms', label: 'SMS', range: [20, 30] },
      { kind: 'mitteilung', textsorte: 'email', label: 'E-Mail', range: [30, 40] },
    ],
    checkpointReading: 'authored-exam-parts',
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
