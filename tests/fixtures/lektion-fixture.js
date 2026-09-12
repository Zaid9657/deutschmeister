// A realistic Lektion in the CONTRACT.md shape, for tests/lesson-engine.test.mjs
// and the dev-only /course/preview screen. It is NOT the real curriculum
// (src/data/curricula/a11.js is authored separately) — it exists so the engine
// can be pinned and looked at before that module lands, and so a regression in
// the engine is never hidden behind missing content.

export const FIXTURE_LEKTION = {
  nr: 1,
  id: 'a1.1-l01',
  slug: 'hallo-ich-bin',
  title: 'Hallo, ich bin …',
  situation: 'Sich vorstellen und den Namen buchstabieren',
  handlungsfeld: 'Kontakte / Sich vorstellen',
  canDo: [
    'Ich kann mich mit Namen vorstellen.',
    'Ich kann sagen, woher ich komme.',
    'Ich kann meinen Namen buchstabieren.',
    'Ich kann jemanden begrüßen und verabschieden.',
  ],
  examTeile: ['Sprechen Teil 1', 'Schreiben Teil 1'],
  grammarSlugs: ['verb-sein', 'alphabet-pronunciation'],
  primarySlug: 'verb-sein',
  minutes: 15,
  wortfeld: [
    { de: 'der Name', word: 'Name', article: 'der', plural: 'Namen', en: 'name', wordId: null },
    { de: 'der Vorname', word: 'Vorname', article: 'der', plural: 'Vornamen', en: 'first name', wordId: null },
    { de: 'das Land', word: 'Land', article: 'das', plural: 'Länder', en: 'country', wordId: null },
    { de: 'die Sprache', word: 'Sprache', article: 'die', plural: 'Sprachen', en: 'language', wordId: null },
    { de: 'die Stadt', word: 'Stadt', article: 'die', plural: 'Städte', en: 'city', wordId: null },
    { de: 'der Kurs', word: 'Kurs', article: 'der', plural: 'Kurse', en: 'course', wordId: null },
    { de: 'die Lehrerin', word: 'Lehrerin', article: 'die', plural: 'Lehrerinnen', en: 'teacher (f.)', wordId: null },
    { de: 'der Lehrer', word: 'Lehrer', article: 'der', plural: 'Lehrer', en: 'teacher (m.)', wordId: null },
    { de: 'die Frau', word: 'Frau', article: 'die', plural: 'Frauen', en: 'woman, Mrs', wordId: null },
    { de: 'der Herr', word: 'Herr', article: 'der', plural: 'Herren', en: 'man, Mr', wordId: null },
    { de: 'heißen', word: 'heißen', article: '', plural: '', en: 'to be called', wordId: null },
    { de: 'sein', word: 'sein', article: '', plural: '', en: 'to be', wordId: null },
    { de: 'kommen', word: 'kommen', article: '', plural: '', en: 'to come', wordId: null },
    { de: 'sprechen', word: 'sprechen', article: '', plural: '', en: 'to speak', wordId: null },
    { de: 'buchstabieren', word: 'buchstabieren', article: '', plural: '', en: 'to spell', wordId: null },
    { de: 'Hallo', word: 'Hallo', article: '', plural: '', en: 'hello', wordId: null },
    { de: 'Guten Tag', word: 'Guten Tag', article: '', plural: '', en: 'good day', wordId: null },
    { de: 'Tschüss', word: 'Tschüss', article: '', plural: '', en: 'bye', wordId: null },
    { de: 'Wie geht’s?', word: 'Wie geht’s?', article: '', plural: '', en: "How's it going?", wordId: null },
    { de: 'Danke', word: 'Danke', article: '', plural: '', en: 'thanks', wordId: null },
  ],
  dialog: {
    title: 'Im Sprachkurs',
    setting: 'Erster Kurstag, zwei Teilnehmer und die Lehrerin.',
    lines: [
      { speaker: 'Ana', de: 'Hallo, ich bin Ana.', en: 'Hello, I am Ana.' },
      { speaker: 'Tarek', de: 'Guten Tag, Ana. Ich heiße Tarek.', en: 'Good day, Ana. My name is Tarek.' },
      { speaker: 'Ana', de: 'Woher kommst du, Tarek?', en: 'Where are you from, Tarek?' },
      { speaker: 'Tarek', de: 'Ich komme aus Tunesien. Und du?', en: 'I come from Tunisia. And you?' },
      { speaker: 'Ana', de: 'Ich bin aus Spanien. Ich spreche Spanisch.', en: 'I am from Spain. I speak Spanish.' },
      { speaker: 'Frau Kaya', de: 'Guten Tag! Sind Sie Frau Ana Ruiz?', en: 'Good day! Are you Mrs Ana Ruiz?' },
      { speaker: 'Ana', de: 'Ja, das bin ich. R-U-I-Z.', en: 'Yes, that is me. R-U-I-Z.' },
      { speaker: 'Frau Kaya', de: 'Danke. Der Kurs ist hier. Tschüss!', en: 'Thank you. The course is here. Bye!' },
    ],
  },
  pretest: {
    promptDe: 'Wie heißt du? Antworte mit einem Satz.',
    promptEn: 'Say your name in one sentence.',
    model: 'Ich heiße Ana.',
    accepted: ['Ich heiße', 'Ich bin', 'Mein Name ist'],
  },
  notice: {
    title: 'sein: ich bin, du bist, Sie sind',
    bodyDe:
      '**sein** ist das wichtigste Verb. Es ist unregelmäßig: **ich bin**, **du bist**, **Sie sind**. Mit *Sie* spricht man höflich, mit *du* privat. Der Satz beginnt mit der Person, das Verb steht auf Position 2.',
    examples: ['Ich bin Ana.', 'Sind Sie Frau Ana Ruiz?'],
    ruleSlug: 'verb-sein',
  },
  phonetik: { focus: 'Wortakzent auf der ersten Silbe', items: ['HAL-lo', 'DAN-ke', 'A-na'] },
  hoeren: { kind: 'dictation', lines: [0, 4] },
  sprechen: {
    readAloud: [1, 3],
    open: {
      teil: 'Sprechen Teil 1',
      promptDe: 'Stellen Sie sich vor: Name, Land, Sprache.',
      hintWords: ['heißen', 'kommen aus', 'sprechen'],
      missionOrder: 1,
    },
  },
  schreiben: {
    kind: 'mitteilung',
    taskDe: 'Schreiben Sie eine kurze Nachricht an die Lehrerin.',
    leitpunkte: ['Name sagen', 'Land nennen', 'Sprache nennen'],
    minWords: 15,
    maxWords: 30,
    sample:
      'Hallo Frau Kaya, mein Name ist Ana Ruiz. Mein Land ist Spanien. Meine Sprache ist Spanisch. Viele Grüße, Ana',
  },
  links: { listeningExercise: 1, readingOrder: 1 },
  practiceRule: { topics: ['verb-sein', 'alphabet-pronunciation'], typedMin: 3 },
};

/** A one-Lektion curriculum in the CURRICULUM_A11 shape, for the preview screen. */
export const FIXTURE_CURRICULUM = {
  level: 'a1.1',
  code: 'A1.1',
  examKey: 'goethe_a1',
  examName: 'Start Deutsch 1',
  testSlug: 'abschlusstest-a1-1',
  provenance: { canDo: 'fixture', wortliste: 'fixture', themen: 'fixture' },
  hoursTotal: 1,
  lektionen: [FIXTURE_LEKTION],
  checkpoints: [{ nr: 1, id: 'a1.1-cp1', afterLektion: 1, title: 'Checkpoint 1: Lektion 1' }],
};

export default FIXTURE_LEKTION;
