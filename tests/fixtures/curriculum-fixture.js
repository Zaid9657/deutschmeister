// A curriculum in the CONTRACT.md shape, for the checkpoint and review suites.
//
// It is deliberately NOT src/data/curricula/a11.js: that module is authored in
// parallel and will keep changing, and a test that moves with its content pins
// nothing. This fixture uses real A1.1 grammar slugs so the real pool
// (src/data/lessonPools/a11.json) can be drawn from.

const words = (prefix, n) =>
  Array.from({ length: n }, (_, i) => ({
    de: `${prefix}wort${i + 1}`,
    word: `${prefix}wort${i + 1}`,
    article: 'das',
    plural: `${prefix}wörter${i + 1}`,
    en: `${prefix} word ${i + 1}`,
    wordId: `${prefix}-w${i + 1}`,
  }));

const lektion = (nr, { slugs, primary, situation }) => ({
  nr,
  id: `fx-l${String(nr).padStart(2, '0')}`,
  slug: `lektion-${nr}`,
  title: `Lektion ${nr}: ${situation}`,
  situation,
  handlungsfeld: 'Kontakte / Sich vorstellen',
  canDo: [`Ich kann ${situation.toLowerCase()}.`],
  examTeile: ['Sprechen Teil 1'],
  grammarSlugs: slugs,
  primarySlug: primary,
  minutes: 15,
  wortfeld: words(`l${nr}`, 16),
  dialog: {
    title: `Dialog ${nr}`,
    setting: `Situation ${nr}.`,
    lines: [
      { speaker: 'Ana', de: `Hallo, hier ist Satz ${nr}.1.`, en: `Hello, this is line ${nr}.1.` },
      { speaker: 'Ben', de: `Guten Tag, das ist Satz ${nr}.2.`, en: `Good day, this is line ${nr}.2.` },
      { speaker: 'Ana', de: `Wie geht es dir, Satz ${nr}.3?`, en: `How are you, line ${nr}.3?` },
      { speaker: 'Ben', de: `Danke, gut, Satz ${nr}.4.`, en: `Thanks, fine, line ${nr}.4.` },
      { speaker: 'Ana', de: `Bis bald, Satz ${nr}.5.`, en: `See you, line ${nr}.5.` },
      { speaker: 'Ben', de: `Tschüss, Satz ${nr}.6.`, en: `Bye, line ${nr}.6.` },
    ],
  },
  pretest: { promptDe: 'Wie heißt du?', promptEn: 'What is your name?', model: 'Ich heiße Ana.', accepted: ['Ich heiße'] },
  notice: { title: `Regel ${nr}`, bodyDe: 'Eine Regel.', examples: [`Hallo, hier ist Satz ${nr}.1.`], ruleSlug: primary },
  phonetik: { focus: 'Wortakzent', items: ['HAL-lo'] },
  hoeren: { kind: 'dictation', lines: [0, 2] },
  sprechen: { readAloud: [1, 3], open: { teil: 'Sprechen Teil 1', promptDe: 'Stellen Sie sich vor.', hintWords: ['heißen'], missionOrder: nr } },
  schreiben: { kind: nr % 2 ? 'formular' : 'mitteilung', taskDe: 'Füll das Formular aus.', fields: ['Name'], leitpunkte: ['a', 'b', 'c'], minWords: 0, maxWords: 30, sample: 'Ich heiße Ana.' },
  links: { listeningExercise: null, readingOrder: null },
  practiceRule: { topics: slugs, typedMin: 3 },
});

const PLAN = [
  { slugs: ['nouns-gender', 'verb-sein'], primary: 'verb-sein', situation: 'Begrüßung und Vorstellen' },
  { slugs: ['definite-articles'], primary: 'definite-articles', situation: 'Angaben zur Person' },
  { slugs: ['personal-pronouns'], primary: 'personal-pronouns', situation: 'Familie und Sprachen' },
  { slugs: ['verb-haben'], primary: 'verb-haben', situation: 'Einkaufen und Preise' },
  { slugs: ['indefinite-articles'], primary: 'indefinite-articles', situation: 'Gegenstände und Farben' },
  { slugs: ['present-tense-regular'], primary: 'present-tense-regular', situation: 'Büro und Technik' },
];

/** `n` Lektionen (max 6) closed by a checkpoint every three. */
export function makeCurriculumFixture(n = 3) {
  const lektionen = PLAN.slice(0, n).map((p, i) => lektion(i + 1, p));
  const checkpoints = [];
  for (let after = 3; after <= lektionen.length; after += 3) {
    checkpoints.push({ nr: checkpoints.length + 1, id: `fx-cp${checkpoints.length + 1}`, afterLektion: after, title: `Checkpoint ${checkpoints.length + 1}` });
  }
  return {
    level: 'a1.1',
    code: 'A1.1',
    examKey: 'goethe_a1',
    examName: 'Start Deutsch 1',
    testSlug: 'abschlusstest-a1-1',
    provenance: { canDo: 'fixture', wortliste: 'fixture', themen: 'fixture' },
    hoursTotal: 12,
    lektionen,
    checkpoints,
  };
}

/** The default: 3 Lektionen, one checkpoint — no earlier chapter to draw from. */
export const CURRICULUM_FIXTURE = makeCurriculumFixture(3);

/** Six Lektionen, two checkpoints — checkpoint 2 has an earlier chapter. */
export const CURRICULUM_FIXTURE_6 = makeCurriculumFixture(6);
