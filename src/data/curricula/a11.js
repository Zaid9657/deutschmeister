// A1.1 — 12 situational Lektionen (docs/course-factory/a11-rebuild/CONTRACT.md,
// docs/course-standard-2026-09-12.md §2). The unit is the situation; the grammar is one step
// inside it. This module is the single source: the lesson player, the checkpoint builder and the
// public syllabus page all derive from it — never retype a word list or a can-do line elsewhere.
//
// PROVENANCE. Kann-Beschreibungen follow the Goethe-Zertifikat A1 (Start Deutsch 1)
// Prüfungsziele/Testbeschreibung; the Handlungsfelder follow the BAMF Rahmencurriculum; the
// Wortfeld is drawn from the live `words` table (`wordId` = words.id, so the player can fetch
// audio — `fetchWordsByIds` looks a word up by id and never filters by level). A1.1 rows where the
// table has them; where it only carries the same word one level up (kaufen, kosten, Zug, Musik,
// Bahnhof, die Monate …) the id of that row is used, because a learner with audio beats a learner
// without. Entries with `wordId: null` are the words the table does not carry at all (at most 5 per
// Lektion) — seed them into `words` and fill the id in; `heißen`, `das Frühstück`, `mitkommen`,
// `das Fest` and `der Gast` are the ones that matter most.
//
// ORDER OF THE 12 GRAMMAR TOPICS (`primarySlug`, one per Lektion, and why this order):
//   1 alphabet-pronunciation  — you must be able to say and spell a name before anything else.
//   2 verb-sein               — the first verb every course teaches; identity, origin, profession.
//   3 personal-pronouns       — needed to talk ABOUT the people introduced in 1–2.
//   4 nouns-gender            — the first noun lesson: a noun without its gender is unusable later.
//   5 definite-articles       — der/die/das applied to the objects around the learner.
//   6 indefinite-articles     — ein/eine only makes sense once der/die/das is known (and kein).
//   7 present-tense-regular   — the first full conjugation, once pronouns (3) are secure.
//   8 time-and-dates          — um/am needs the present tense (7) to build a day around.
//   9 verb-haben              — the second irregular verb, contrasted with sein (2).
//  10 yes-no-questions        — inversion needs a verb inventory (2, 7, 9) to invert.
//  11 separable-verbs-intro   — the Satzklammer presupposes the plain verb-second sentence (7).
//  12 possessive-articles     — mein/dein reuses the article endings from 5–6 and closes the level.
// First half: alphabet, sein, pronouns, the three article lessons. Second half: present tense,
// time, haben, yes/no questions, separable verbs, possessives — exactly what the standard asks for.
//
// TWO THINGS THIS ORDER CANNOT CARRY, AND WHERE THEY ARE TAUGHT INSTEAD (DaF review 2026-09-12):
//   *haben* is needed long before its own Lektion (9): „Hast du Zeit?“ in 8, „Hat der Zug
//   Verspätung?“ in 10. Pulling verb-haben forward would break the one-primary-slug-per-Lektion
//   order that scripts/validate-curriculum.mjs pins (PRIMARY_ORDER), so L8's notice teaches
//   „Ich habe … / Hast du …?“ as a fixed chunk and points forward to L9.
//   The *Vokalwechsel* (sprechen → spricht, fahren → fährt) has no slug of its own, but the
//   dialogues use it from L3 on: L3's notice flags it for sprechen, L7's notice states the rule.
//
// HOURS. Engine time = 12 Lektionen × 15 min + 4 checkpoints × 12 min + 12 × 10 min spaced review
// = 180 + 48 + 120 = 348 min ≈ 5.8 h. Linked work (the listening dialogue, the reading text, the
// speaking mission, the Wortfeld with audio and the writing task around each Lektion) is budgeted
// at 4 h per Lektion = 48 h. 5.8 + 48 ≈ 54 h → `hoursTotal: 54` (the validator derives this number
// from the minutes, so it is not free to set); inside the standard's 50–60 h.
// READ THE 54 HONESTLY (DaF review 2026-09-12 §4): only the 5.8 h are guided lesson time that
// exists as content. The 48 h are a budget for surrounding practice, and that material is not
// complete — five Lektionen have no linked listening exercise (the level only carries six), three
// no reading text, four no speaking mission, L2 neither. So a buyer-facing page must show
// „5,8 h geführte Lektionszeit + Übungsmaterial“ separately and must NOT advertise „54 Stunden
// Kurs“ as content (`src/data/marketing.js`: measure before you claim).
//
// REGISTER. du between learners (Ana, Tim, Lena), Sie with staff and neighbours (Frau Kaya,
// Herr Weber, Herr Schmidt, Paul). No outcome promises and no exam fees anywhere in this file.

/**
 * The closed list of words a dialogue line may use WITHOUT the word being in this or an earlier
 * Lektion's Wortfeld: articles and determiners, pronouns, the forms of sein/haben, ja/nein/
 * bitte/danke, question words, the numbers 0–100, prepositions and their contractions, the
 * small conjunctions and particles, and the two bare greetings. Everything else a learner hears
 * in a dialogue has been taught first — `scripts/validate-curriculum.mjs` checks it by tokenising.
 */
export const FUNCTION_WORDS = [
  // Artikel und Determinative
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'kein', 'keine', 'keinen', 'keinem', 'keiner', 'mein', 'meine', 'meinen', 'meinem', 'meiner',
  'dein', 'deine', 'deinen', 'deinem', 'deiner', 'sein', 'seine', 'seinen', 'seinem', 'seiner',
  'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'unser', 'unsere', 'unseren', 'euer', 'eure',
  // Pronomen
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'man', 'mich', 'dich', 'ihn', 'uns', 'euch',
  'mir', 'dir', 'ihm', 'ihnen', 'wen', 'wem',
  // sein und haben
  'bin', 'bist', 'ist', 'sind', 'seid', 'habe', 'hast', 'hat', 'haben', 'habt',
  // Ja, nein und die kleinen Wörter
  'ja', 'nein', 'bitte', 'danke', 'doch', 'und', 'oder', 'aber', 'auch', 'nicht', 'noch',
  'schon', 'sehr', 'nur', 'dann', 'hier', 'da', 'so', 'gern',
  // Fragewörter
  'wer', 'was', 'wo', 'wann', 'warum', 'wie', 'wohin', 'woher', 'welche', 'welcher', 'welches',
  // Zahlen 0–100
  'null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
  'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn',
  'neunzehn', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig',
  'neunzig', 'hundert',
  // Präpositionen und Verschmelzungen
  'in', 'an', 'auf', 'aus', 'bei', 'mit', 'nach', 'von', 'zu', 'für', 'um', 'über', 'unter',
  'vor', 'seit', 'ohne', 'bis', 'gegen', 'neben', 'zwischen', 'im', 'am', 'zum', 'zur', 'beim',
  'ins', 'ans', 'vom',
  // Begrüßung
  'hallo', 'tschüss',
];

/** Proper nouns and titles that may appear in a dialogue line (people, places, forms of address). */
export const DIALOG_NAMES = [
  'Ana', 'Tim', 'Lena', 'Paul', 'Herr', 'Frau', 'Weber', 'Kaya', 'Wolf', 'Schmidt', 'Berg',
  'Chakiri', 'Brandt', 'Berger', 'Bremen', 'Thomas',
];

export const CURRICULUM_A11 = {
  level: 'a1.1',
  code: 'A1.1',
  examKey: 'goethe_a1',
  examName: 'Start Deutsch 1',
  testSlug: 'abschlusstest-a1-1',
  provenance: {
    canDo: 'Goethe-Zertifikat A1 Start Deutsch 1 — Prüfungsziele, Testbeschreibung (Goethe-Institut/telc, 2016 ed.)',
    // The Kursraum lexis of L5 (Lineal, Schere, Tafel, Kugelschreiber) is outside the Wortliste
    // and stays, because SD1 Sprechen Teil 2 asks about the room the learner sits in (DaF review #2, L5).
    wortliste: 'Goethe-Zertifikat A1 Wortliste (≈650 units) plus Kursraum-Lexik',
    themen: 'BAMF Rahmencurriculum Integrationskurs (Handlungsfelder)',
  },
  hoursTotal: 54,
  lektionen: [
    {
      nr: 1,
      id: 'a1.1-l01',
      slug: 'hallo-ich-bin',
      title: 'Hallo, ich bin …',
      situation: 'Begrüßung, Vorstellen und das Alphabet',
      handlungsfeld: 'Kontakte knüpfen: sich begrüßen und vorstellen',
      canDo: [
        'Ich kann jemanden begrüßen und mich verabschieden.',
        'Ich kann sagen, wie ich heiße.',
        'Ich kann meinen Namen buchstabieren.',
        'Ich kann fragen, wie es jemandem geht, und darauf antworten.',
      ],
      examTeile: ['Sprechen Teil 1', 'Schreiben Teil 1', 'Hören Teil 1'],
      grammarSlugs: ['alphabet-pronunciation'],
      primarySlug: 'alphabet-pronunciation',
      minutes: 15,
      wortfeld: [
        { de: 'Hallo', word: 'Hallo', article: null, plural: null, en: 'Hello', wordId: '0b4a5044-cda2-460d-bc9e-4bb4ab18fce7' },
        { de: 'Guten Morgen', word: 'Guten Morgen', article: null, plural: null, en: 'Good morning', wordId: 'e85312e9-0f63-454d-98cf-b1ea207c1a6e' },
        { de: 'Guten Tag', word: 'Guten Tag', article: null, plural: null, en: 'Good day / Good afternoon', wordId: '92c9c069-cc21-451d-a893-b18316e72381' },
        { de: 'Guten Abend', word: 'Guten Abend', article: null, plural: null, en: 'Good evening', wordId: '3b01f942-7e88-4838-82b4-186eb42d9521' },
        { de: 'Gute Nacht', word: 'Gute Nacht', article: null, plural: null, en: 'Good night', wordId: '5f4171f4-0b78-4999-893c-dc4b11886b40' },
        { de: 'Tschüss', word: 'Tschüss', article: null, plural: null, en: 'Bye', wordId: '55ba3391-5b13-486d-ab68-3beb023c70df' },
        { de: 'Auf Wiedersehen', word: 'Auf Wiedersehen', article: null, plural: null, en: 'Goodbye', wordId: 'f1f59c8b-8842-49da-b10a-9e154f6de7e2' },
        { de: 'Bis morgen', word: 'Bis morgen', article: null, plural: null, en: 'See you tomorrow', wordId: '28a1c448-c9c1-4796-aab1-9f417c26df94' },
        { de: 'Danke', word: 'Danke', article: null, plural: null, en: 'Thank you', wordId: 'ec26881d-ea91-41dc-8da4-6efc3dc04222' },
        { de: 'Bitte', word: 'Bitte', article: null, plural: null, en: 'Please / You\'re welcome', wordId: '501d7595-03fc-4696-a141-677e345df16d' },
        { de: 'Entschuldigung', word: 'Entschuldigung', article: null, plural: null, en: 'Excuse me / Sorry', wordId: '8db3b3da-db54-4372-970e-bff5e8111b5f' },
        { de: 'Freut mich', word: 'Freut mich', article: null, plural: null, en: 'Nice to meet you', wordId: '9e09ab43-124d-42df-8b7d-38db7d8692d7' },
        { de: 'Willkommen', word: 'Willkommen', article: null, plural: null, en: 'Welcome', wordId: 'aae696c2-6d27-4aa7-8832-f618e2d160b1' },
        { de: 'Wie geht es dir?', word: 'Wie geht es dir?', article: null, plural: null, en: 'How are you? (informal)', wordId: '41dd2800-884a-440c-91b4-e771ebb03a35' },
        { de: 'Wie geht es Ihnen?', word: 'Wie geht es Ihnen?', article: null, plural: null, en: 'How are you? (formal)', wordId: '079b8258-5044-42cd-85d6-9b51e12b55c7' },
        { de: 'Mir geht es gut', word: 'Mir geht es gut', article: null, plural: null, en: 'I\'m fine', wordId: '2b299a38-0052-4469-aaeb-d19292f4679b' },
        { de: 'der Gruß', word: 'Gruß', article: 'der', plural: 'Grüße', en: 'greeting', wordId: 'e3b63654-5c07-412f-b209-1ea0ec0d140a' },
        { de: 'heißen', word: 'heißen', article: null, plural: null, en: 'to be called', wordId: '7422ba1e-b9a8-4559-892a-a1104fc980d0' },
        { de: 'buchstabieren', word: 'buchstabieren', article: null, plural: null, en: 'to spell', wordId: 'c32af826-0d23-45a0-8e21-5f5687937153' },
        { de: 'der Buchstabe', word: 'Buchstabe', article: 'der', plural: 'Buchstaben', en: 'letter', wordId: '9d002506-cae1-4a26-8e93-b2c9523c80c1' },
      ],
      dialog: {
        title: 'An der Rezeption',
        setting: 'Ana kommt im Hostel an. Frau Kaya arbeitet an der Rezeption.',
        lines: [
          { speaker: 'Frau Kaya', de: 'Guten Tag und willkommen!', en: 'Good day and welcome!' },
          { speaker: 'Ana', de: 'Guten Tag. Ich heiße Ana Chakiri.', en: 'Good day. My name is Ana Chakiri.' },
          { speaker: 'Frau Kaya', de: 'Buchstabieren Sie bitte Chakiri.', en: 'Please spell Chakiri.' },
          { speaker: 'Ana', de: 'C-H-A-K-I-R-I.', en: 'C-H-A-K-I-R-I.' },
          { speaker: 'Frau Kaya', de: 'Danke. Und wie buchstabiert man Ana?', en: 'Thank you. And how do you spell Ana?' },
          { speaker: 'Ana', de: 'A-N-A.', en: 'A-N-A.' },
          { speaker: 'Frau Kaya', de: 'Gut. Wie geht es Ihnen?', en: 'Good. How are you?' },
          { speaker: 'Ana', de: 'Mir geht es gut, danke.', en: 'I\'m fine, thank you.' },
          { speaker: 'Frau Kaya', de: 'Auf Wiedersehen, Ana.', en: 'Goodbye, Ana.' },
          { speaker: 'Ana', de: 'Tschüss! Bis morgen.', en: 'Bye! See you tomorrow.' },
        ],
      },
      pretest: {
        promptDe: 'Wie heißen Sie? Antworten Sie mit einem Satz.',
        promptEn: 'Say your name in one sentence.',
        model: 'Ich heiße Ana.',
        accepted: ['Ich heiße', 'Ich bin', 'Mein Name ist'],
      },
      notice: {
        title: 'Das Alphabet: buchstabieren',
        bodyDe: 'Beim Buchstabieren sagst du jeden Buchstaben einzeln. Vorsicht bei drei Paaren: **E** [eː] und **I** [iː], **G** [geː] und **J** [jɔt], **V** [faʊ] und **W** [veː]. **Y** heißt *Ypsilon*, **ß** heißt *Eszett* oder *scharfes S*. Frag im Zweifel: **Wie buchstabiert man das?**',
        examples: ['Buchstabieren Sie bitte Chakiri.', 'Danke. Und wie buchstabiert man Ana?'],
        ruleSlug: 'alphabet-pronunciation',
      },
      phonetik: { focus: 'Wortakzent auf der ersten Silbe', items: ['HAL-lo', 'DAN-ke', 'A-na'] },
      hoeren: { kind: 'dictation', lines: [1, 7] },
      sprechen: {
        readAloud: [0, 6],
        open: {
          teil: 'Sprechen Teil 1',
          promptDe: 'Stellen Sie sich vor: Name und Vorname. Buchstabieren Sie Ihren Namen.',
          hintWords: ['heißen', 'buchstabieren', 'Guten Tag'],
          missionOrder: 1,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a11-l01',
        // SD1 Schreiben Teil 1 is a TRANSFER task: the learner reads a short text about a person and
        // copies that person's data into the form. The six course Formulare had no source text, so
        // evaluate-writing.mjs had no correctness criterion. The bank carries the text (review #2, L1).
        taskDe: 'Ana Chakiri kommt aus Marokko. Sie spricht Arabisch. Heute Abend kommt sie im Hostel an. Füllen Sie das Anmeldeformular im Hostel für Ana aus.',
        fields: ['Familienname', 'Vorname', 'Land', 'Sprache', 'Unterschrift'],
        minWords: 5,
        maxWords: 40,
        sample: 'Familienname: Chakiri / Vorname: Ana / Land: Marokko / Sprache: Arabisch / Unterschrift: A. Chakiri',
      },
      links: { listeningExercise: 6, readingOrder: 1 },
      practiceRule: { topics: ['alphabet-pronunciation'], typedMin: 3 },
    },
    {
      nr: 2,
      id: 'a1.1-l02',
      slug: 'ich-bin-studentin',
      title: 'Ich bin Studentin',
      situation: 'Angaben zur Person, Beruf und Zahlen',
      handlungsfeld: 'Ämter und Behörden: Angaben zur Person machen',
      canDo: [
        'Ich kann sagen, woher ich komme und was ich von Beruf bin.',
        'Ich kann nach dem Beruf einer Person fragen.',
        'Ich kann Zahlen von null bis zehn verstehen und sagen.',
        'Ich kann meine Telefonnummer und meine Adresse nennen.',
        'Ich kann ein einfaches Formular mit meinen Daten ausfüllen.',
      ],
      examTeile: ['Sprechen Teil 1', 'Lesen Teil 1', 'Schreiben Teil 2'],
      grammarSlugs: ['verb-sein', 'alphabet-pronunciation'],
      primarySlug: 'verb-sein',
      minutes: 15,
      wortfeld: [
        { de: 'der Vorname', word: 'Vorname', article: 'der', plural: 'Vornamen', en: 'first name', wordId: '6f92a8dc-f22e-418a-b13b-dc9c173d3aea' },
        { de: 'der Nachname', word: 'Nachname', article: 'der', plural: 'Nachnamen', en: 'surname (= Familienname)', wordId: 'ad1996d7-42b5-4ad9-b765-022003806c29' },
        { de: 'der Beruf', word: 'Beruf', article: 'der', plural: 'Berufe', en: 'profession, job', wordId: '2f54e3ae-2a16-47a3-9558-08b605c69dfb' },
        { de: 'von Beruf', word: 'von Beruf', article: null, plural: null, en: 'by profession', wordId: 'dbb146f0-1c91-4c39-8339-4d0f67694901' },
        { de: 'die Adresse', word: 'Adresse', article: 'die', plural: 'Adressen', en: 'address', wordId: 'bd5380d6-03a4-4fc8-bd88-cebf2346cc84' },
        { de: 'die Telefonnummer', word: 'Telefonnummer', article: 'die', plural: 'Telefonnummern', en: 'phone number', wordId: '84fd3205-50f1-4187-a4ba-db6ec628ce11' },
        { de: 'das Formular', word: 'Formular', article: 'das', plural: 'Formulare', en: 'form', wordId: '7dcdf9f6-5b5c-464e-87f5-a0a7f290b7bf' },
        { de: 'ausfüllen', word: 'ausfüllen', article: null, plural: null, en: 'to fill out', wordId: '0d5a6a88-9f0f-49dc-99c9-36432130acd6' },
        { de: 'der Wohnort', word: 'Wohnort', article: 'der', plural: 'Wohnorte', en: 'place of residence', wordId: '67d01c31-7fcd-4662-b115-750547b1c7bf' },
        { de: 'ledig', word: 'ledig', article: null, plural: null, en: 'single, unmarried', wordId: 'e8bd092c-07b9-4b09-a80b-d1f22e5ad9e5' },
        { de: 'verheiratet', word: 'verheiratet', article: null, plural: null, en: 'married', wordId: '2d10cc55-fb90-4081-8484-51fad5923591' },
        { de: 'der Student', word: 'Student', article: 'der', plural: 'Studenten', en: 'student (m)', wordId: '7604734b-aab8-45da-ab00-da87605a9d20' },
        { de: 'die Studentin', word: 'Studentin', article: 'die', plural: 'Studentinnen', en: 'student (f)', wordId: '7d778f1a-5ddb-4b60-b46d-0ca2fdb03652' },
        { de: 'der Lehrer', word: 'Lehrer', article: 'der', plural: 'Lehrer', en: 'teacher (m)', wordId: '401b018a-1c7a-48c4-b06b-88cce32fcdcd' },
        { de: 'die Lehrerin', word: 'Lehrerin', article: 'die', plural: 'Lehrerinnen', en: 'teacher (f)', wordId: '1e7ad6c2-37b5-4063-971c-4b2090cafa9e' },
        // The digits 0–10 are ONE Wortfeld entry, not ten (DaF review: ten of 25 slots were digits,
        // which inflated the word count and crowded out the Personalien lexis the Handlungsfeld needs).
        { de: 'die Zahlen 0–10', word: 'Zahlen 0–10', article: 'die', plural: '—', en: 'the numbers 0–10 (null, eins … zehn)', wordId: '1087cf2f-d531-45d9-b04c-803440a7563a' },
        { de: 'wohnen', word: 'wohnen', article: null, plural: null, en: 'to live, to reside', wordId: 'fb025b05-6aa5-4a9e-91a2-52a903032000' },
        { de: 'das Geburtsdatum', word: 'Geburtsdatum', article: 'das', plural: 'Geburtsdaten', en: 'date of birth', wordId: '4b61db71-3720-4bf4-a936-d75495ebf91a' },
        { de: 'die Staatsangehörigkeit', word: 'Staatsangehörigkeit', article: 'die', plural: 'Staatsangehörigkeiten', en: 'nationality', wordId: '25aca43e-8b73-4f68-8d8f-aaf629150fb4' },
        { de: 'der Familienstand', word: 'Familienstand', article: 'der', plural: '—', en: 'marital status', wordId: '3302687e-42ad-45b5-a4c9-43b65b8f4a2d' },
        { de: 'das Amt', word: 'Amt', article: 'das', plural: 'Ämter', en: 'public office, authority', wordId: 'b5556cee-448c-47fc-82a7-2a5f9f956c1b' },
        { de: 'der Schalter', word: 'Schalter', article: 'der', plural: 'Schalter', en: 'counter, service desk', wordId: '04eb49be-3f26-4496-b65d-7fd3e55b2f67' },
        { de: 'die Post', word: 'Post', article: 'die', plural: '—', en: 'post office', wordId: '1897eb9b-5393-490d-aebf-c52080c2ec7d' },
      ],
      dialog: {
        title: 'Am Schalter im Bürgerbüro',
        setting: 'Ana meldet sich im Bürgerbüro an. Herr Weber arbeitet am Schalter.',
        lines: [
          { speaker: 'Herr Weber', de: 'Guten Tag! Ich bin Herr Weber.', en: 'Good day! I am Mr Weber.' },
          { speaker: 'Ana', de: 'Freut mich! Ich bin Ana.', en: 'Nice to meet you! I am Ana.' },
          { speaker: 'Herr Weber', de: 'Bitte füllen Sie das Formular aus.', en: 'Please fill out the form.' },
          { speaker: 'Ana', de: 'Ist das Formular für die Adresse?', en: 'Is that form for the address?' },
          { speaker: 'Herr Weber', de: 'Ja. Vorname, Nachname und Wohnort, bitte.', en: 'Yes. First name, surname and place of residence, please.' },
          { speaker: 'Ana', de: 'Mein Nachname ist Chakiri. Ich wohne in Bremen.', en: 'My surname is Chakiri. I live in Bremen.' },
          { speaker: 'Herr Weber', de: 'Was sind Sie von Beruf?', en: 'What is your profession?' },
          { speaker: 'Ana', de: 'Ich bin Studentin.', en: 'I am a student.' },
          // The Zahlen can-do is carried by the input, not only by the Wortfeld entry: these two
          // lines are the only place a learner hears digits in L2 (DaF review #2, L2).
          { speaker: 'Herr Weber', de: 'Danke. Und wie ist Ihre Telefonnummer?', en: 'Thank you. And what is your phone number?' },
          { speaker: 'Ana', de: 'Meine Telefonnummer ist null eins sieben sechs.', en: 'My phone number is zero one seven six.' },
        ],
      },
      pretest: {
        promptDe: 'Was sind Sie von Beruf? Antworten Sie mit einem Satz.',
        promptEn: 'Say what you do for a living, in one sentence.',
        model: 'Ich bin Studentin.',
        accepted: ['Ich bin', 'Ich arbeite als', 'Von Beruf bin ich'],
      },
      notice: {
        title: 'sein: ich bin, du bist, Sie sind',
        bodyDe: '**sein** ist das wichtigste Verb im Deutschen. Es ist unregelmäßig: ich **bin**, du **bist**, er/sie/es **ist**, wir **sind**, ihr **seid**, sie/Sie **sind**. Nach sein steht der Beruf ohne Artikel: Ich bin Lehrer. Nicht: Ich bin ein Lehrer.',
        examples: ['Was sind Sie von Beruf?', 'Ich bin Studentin.'],
        ruleSlug: 'verb-sein',
      },
      phonetik: { focus: 'Lange und kurze Vokale: bin – bist – sind', items: ['ich BIN', 'du BIST', 'Sie SIND'] },
      // Not line 4: an enumeration with three commas is a punctuation test, not a listening test.
      hoeren: { kind: 'dictation', lines: [7, 3] },
      sprechen: {
        readAloud: [2, 6],
        open: { teil: 'Sprechen Teil 1', promptDe: 'Stellen Sie sich vor: Name, Wohnort, Beruf.', hintWords: ['sein', 'von Beruf', 'Wohnort'], missionOrder: 6 },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a11-l02',
        taskDe: 'Schreiben Sie Ihrem neuen Nachbarn eine kurze Nachricht. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        leitpunkte: ['Wer Sie sind', 'Was Sie von Beruf sind', 'Wann Sie zu Hause sind'],
        minWords: 25,
        maxWords: 45,
        sample: 'Guten Tag, Herr Weber! Ich bin Ana. Ich bin Studentin. Viele Grüße, Ana',
      },
      // A1.1 carries six listening exercises and ten reading texts; every one is linked from another
      // Lektion, so this one honestly has none — the syllabus shows „—“ rather than a repeat.
      links: { listeningExercise: null, readingOrder: null },
      practiceRule: { topics: ['verb-sein', 'alphabet-pronunciation'], typedMin: 3 },
    },
    {
      nr: 3,
      id: 'a1.1-l03',
      slug: 'meine-familie',
      title: 'Meine Familie',
      situation: 'Familie und Sprachen',
      handlungsfeld: 'Familie und Erziehung: über die eigene Familie sprechen',
      canDo: [
        'Ich kann über meine Familie sprechen.',
        'Ich kann sagen, welche Sprachen ich spreche.',
        'Ich kann nach der Familie einer Person fragen.',
        'Ich kann sagen, woher meine Familie kommt.',
      ],
      examTeile: ['Sprechen Teil 2', 'Lesen Teil 1'],
      grammarSlugs: ['personal-pronouns', 'verb-sein'],
      primarySlug: 'personal-pronouns',
      minutes: 15,
      wortfeld: [
        { de: 'die Familie', word: 'Familie', article: 'die', plural: 'Familien', en: 'family', wordId: '30dfaef4-181f-45d7-b8c7-d16145d1bd5f' },
        { de: 'die Eltern', word: 'Eltern', article: 'die', plural: 'Eltern', en: 'parents', wordId: '5c95d494-eaca-49bc-b8d5-7007c5e068fa' },
        { de: 'der Vater', word: 'Vater', article: 'der', plural: 'Väter', en: 'father', wordId: 'cb74f1e9-0592-4b56-b9b0-27e360e49024' },
        { de: 'die Mutter', word: 'Mutter', article: 'die', plural: 'Mütter', en: 'mother', wordId: '5965edfd-4846-4df4-9eb0-bc7f22953204' },
        { de: 'der Bruder', word: 'Bruder', article: 'der', plural: 'Brüder', en: 'brother', wordId: '297b72b1-88b7-48c7-9aba-f5ffd87ae46d' },
        { de: 'die Schwester', word: 'Schwester', article: 'die', plural: 'Schwestern', en: 'sister', wordId: 'd450b2e5-7d92-4b87-88a0-611ed280fc65' },
        { de: 'die Geschwister', word: 'Geschwister', article: 'die', plural: 'Geschwister', en: 'siblings', wordId: 'a7571ed6-9ce8-4bc8-b6e3-1c9b55517f5c' },
        { de: 'der Sohn', word: 'Sohn', article: 'der', plural: 'Söhne', en: 'son', wordId: 'e2600e1e-8a72-42e6-bf30-3ec84d0e8ac5' },
        { de: 'die Tochter', word: 'Tochter', article: 'die', plural: 'Töchter', en: 'daughter', wordId: '4b9c7830-8179-4dfe-900c-5d20300045c5' },
        { de: 'das Kind', word: 'Kind', article: 'das', plural: 'Kinder', en: 'child', wordId: '20a50d1e-4b71-4d3a-8bf1-1b0278d3d445' },
        { de: 'der Mann', word: 'Mann', article: 'der', plural: 'Männer', en: 'man; husband', wordId: '9551becf-a28b-4e81-bfb0-ad2e25f0d4b4' },
        { de: 'die Frau', word: 'Frau', article: 'die', plural: 'Frauen', en: 'woman; wife; Mrs/Ms (Anrede)', wordId: '14664846-bff1-4940-b390-e7486006eed1' },
        { de: 'das Baby', word: 'Baby', article: 'das', plural: 'Babys', en: 'baby', wordId: 'a8ad826c-2216-4527-b344-1cd35778fae7' },
        { de: 'das Einzelkind', word: 'Einzelkind', article: 'das', plural: 'Einzelkinder', en: 'only child', wordId: '4130e54e-fe3d-4e50-b059-d6e1c45777bb' },
        { de: 'jung', word: 'jung', article: null, plural: null, en: 'young', wordId: '84422f10-4718-4f70-a51b-c9e586a0a38b' },
        { de: 'alt', word: 'alt', article: null, plural: null, en: 'old', wordId: 'cf1c85f6-8089-46af-b6b8-59ff7b8d9fdd' },
        { de: 'zusammen', word: 'zusammen', article: null, plural: null, en: 'together', wordId: 'ab3ffe19-9288-42ed-9d01-09e3f561e748' },
        { de: 'die Sprache', word: 'Sprache', article: 'die', plural: 'Sprachen', en: 'language', wordId: '5c6e3969-d15a-4f5c-bc7f-e8629801c2da' },
        { de: 'Deutsch', word: 'Deutsch', article: null, plural: null, en: 'German (language)', wordId: '2fd09a1f-cf75-4094-8296-3dc81e4967ab' },
        { de: 'Englisch', word: 'Englisch', article: null, plural: null, en: 'English (language)', wordId: '1104bcc7-93f1-432f-ae84-64850c0c5d7c' },
        { de: 'Arabisch', word: 'Arabisch', article: null, plural: null, en: 'Arabic (language)', wordId: '77f2d528-3578-46b0-8b35-f31e2d152799' },
        { de: 'kommen aus', word: 'kommen aus', article: null, plural: null, en: 'to come from', wordId: 'fc80d20a-6546-4917-9784-ed90efb5625a' },
        { de: 'Marokko', word: 'Marokko', article: null, plural: null, en: 'Morocco', wordId: '5396e33c-85f5-41db-84b2-3c9a6819cb1d' },
        { de: 'sprechen', word: 'sprechen', article: null, plural: null, en: 'to speak', wordId: 'bedd255d-fe20-4a60-a510-5be8413e5fcb' },
      ],
      dialog: {
        title: 'Ein Foto von zu Hause',
        setting: 'Lena sieht ein Foto auf Anas Handy.',
        lines: [
          { speaker: 'Lena', de: 'Ana, ist das deine Familie?', en: 'Ana, is that your family?' },
          { speaker: 'Ana', de: 'Ja. Das sind meine Eltern, mein Bruder und meine Schwester.', en: 'Yes. Those are my parents, my brother and my sister.' },
          { speaker: 'Lena', de: 'Wie alt ist er?', en: 'How old is he?' },
          { speaker: 'Ana', de: 'Er ist zwanzig. Meine Schwester ist noch jung.', en: 'He is twenty. My sister is still young.' },
          { speaker: 'Lena', de: 'Welche Sprachen sprechen deine Eltern?', en: 'Which languages do your parents speak?' },
          { speaker: 'Ana', de: 'Sie sprechen Arabisch und Deutsch.', en: 'They speak Arabic and German.' },
          { speaker: 'Lena', de: 'Spricht dein Bruder auch Englisch?', en: 'Does your brother speak English too?' },
          { speaker: 'Ana', de: 'Ja, er spricht Englisch und Deutsch.', en: 'Yes, he speaks English and German.' },
          { speaker: 'Lena', de: 'Woher kommt ihr?', en: 'Where are you (all) from?' },
          { speaker: 'Ana', de: 'Wir kommen aus Marokko.', en: 'We come from Morocco.' },
        ],
      },
      pretest: {
        promptDe: 'Sprechen Sie über eine Person in Ihrer Familie.',
        promptEn: 'Say one sentence about a person in your family.',
        model: 'Mein Bruder ist zwanzig.',
        accepted: ['Mein', 'Meine', 'Das ist', 'Er ist', 'Sie ist'],
      },
      notice: {
        title: 'er, sie, es – die Personalpronomen',
        bodyDe: 'Das Pronomen richtet sich nach dem Nomen: der Bruder → **er**, die Schwester → **sie**, das Kind → **es**. Für mehrere Personen: **wir**, **ihr**, **sie**. **Sie** mit großem S ist die höfliche Form. Bei **sprechen** wechselt der Vokal: er **spricht** — mehr dazu in Lektion 7.',
        examples: ['Wie alt ist er?', 'Ja, er spricht Englisch und Deutsch.'],
        ruleSlug: 'personal-pronouns',
      },
      phonetik: { focus: 'Der Umlaut ü in Bruder – Brüder', items: ['der BRU-der', 'die BRÜ-der', 'die MÜT-ter'] },
      hoeren: { kind: 'dictation', lines: [3, 5] },
      sprechen: {
        readAloud: [1, 6],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen Sie und antworten Sie zum Thema Familie: Bruder? Schwester? Kinder?',
          hintWords: ['Bruder', 'Schwester', 'sprechen'],
          missionOrder: 5,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a11-l03',
        taskDe: 'Ana Chakiri ist ledig. Sie kommt aus Marokko und spricht Arabisch und Deutsch. Sie lernt Deutsch in der Sprachschule. Füllen Sie das Formular für den Sprachkurs aus.',
        fields: ['Vorname', 'Familienname', 'Familienstand', 'Sprachen', 'Land'],
        minWords: 5,
        maxWords: 40,
        sample: 'Vorname: Ana / Familienname: Chakiri / Familienstand: ledig / Sprachen: Arabisch, Deutsch / Land: Marokko',
      },
      links: { listeningExercise: null, readingOrder: 2 },
      practiceRule: { topics: ['personal-pronouns', 'verb-sein'], typedMin: 3 },
    },
    {
      nr: 4,
      id: 'a1.1-l04',
      slug: 'auf-dem-flohmarkt',
      title: 'Auf dem Flohmarkt',
      situation: 'Einkaufen, Möbel und Preise',
      handlungsfeld: 'Einkaufen: nach Gegenständen und Preisen fragen',
      canDo: [
        'Ich kann fragen, was ein Gegenstand ist.',
        'Ich kann nach dem Preis fragen.',
        'Ich kann Preise bis hundert Euro verstehen.',
        'Ich kann sagen, was ich kaufe.',
      ],
      examTeile: ['Lesen Teil 2', 'Sprechen Teil 3', 'Hören Teil 2'],
      grammarSlugs: ['nouns-gender', 'personal-pronouns'],
      primarySlug: 'nouns-gender',
      minutes: 15,
      wortfeld: [
        { de: 'der Tisch', word: 'Tisch', article: 'der', plural: 'Tische', en: 'table', wordId: 'c03b1f60-d02b-47ef-85cd-3cd1cdab0b1f' },
        { de: 'der Stuhl', word: 'Stuhl', article: 'der', plural: 'Stühle', en: 'chair', wordId: 'cee7d733-2f10-4eec-947c-e79c0318ed23' },
        { de: 'die Lampe', word: 'Lampe', article: 'die', plural: 'Lampen', en: 'lamp', wordId: 'e120babd-b682-48ba-9ee4-47b5ad07bc71' },
        { de: 'die Uhr', word: 'Uhr', article: 'die', plural: 'Uhren', en: 'clock', wordId: 'e7525cfc-bf0a-4d96-ad93-eef3e71c187f' },
        { de: 'die Tasche', word: 'Tasche', article: 'die', plural: 'Taschen', en: 'bag', wordId: '9e111e31-1e2f-47b3-a670-f18d2fd0faff' },
        { de: 'der Rucksack', word: 'Rucksack', article: 'der', plural: 'Rucksäcke', en: 'backpack', wordId: 'ba072910-dfb9-444b-a0de-ba29f90edadf' },
        // Ten numerals plus zählen filled 11 of 25 slots and none of them appeared in the Lektion
        // (the dialogue says acht, zwölf, fünfzehn, zwanzig, dreißig — all FUNCTION_WORDS anyway).
        // They are ONE entry now, exactly like L2's Zahlen 0–10, and the freed slots carry the
        // Flohmarkt lexis the situation actually needs (DaF review #2, L4).
        { de: 'die Zahlen 11–100', word: 'Zahlen 11–100', article: 'die', plural: '—', en: 'the numbers 11–100 (elf, zwölf … hundert)', wordId: '112eb634-135f-4372-a74a-c60da86d1423' },
        { de: 'wie viel', word: 'wie viel', article: null, plural: null, en: 'how much', wordId: '80e786f9-8a29-45bd-862b-a498bc184c69' },
        { de: 'wie viele', word: 'wie viele', article: null, plural: null, en: 'how many', wordId: 'c4fad330-3515-46b0-ad99-aa883e0ea764' },
        { de: 'der Flohmarkt', word: 'Flohmarkt', article: 'der', plural: 'Flohmärkte', en: 'flea market', wordId: '245c8937-50c0-491e-a297-5008748e085d' },
        { de: 'verkaufen', word: 'verkaufen', article: null, plural: null, en: 'to sell', wordId: 'b37ad662-f4b9-46c0-a53a-bc269a9e30a8' },
        // L4 teaches Genus and had NO neuter noun of its own, so the card reached forward to L5's
        // „das Buch“; das Regal is A1-Wortliste Flohmarkt lexis and carries the neuter (review #2, L4).
        { de: 'das Regal', word: 'Regal', article: 'das', plural: 'Regale', en: 'shelf', wordId: 'eea6452e-f5b9-40aa-b321-01377f8a0a76' },
        { de: 'der Euro', word: 'Euro', article: 'der', plural: 'Euro', en: 'euro', wordId: '34ee3fee-c37c-4ea0-8bb4-0732575da17b' },
        { de: 'der Preis', word: 'Preis', article: 'der', plural: 'Preise', en: 'price', wordId: '34254aab-98aa-438b-a0e5-210c77d82596' },
        { de: 'kosten', word: 'kosten', article: null, plural: null, en: 'to cost', wordId: 'be28d780-b0e6-42c3-ae0f-ce0ff66d4501' },
        { de: 'kaufen', word: 'kaufen', article: null, plural: null, en: 'to buy', wordId: '40d30139-d09e-418e-bdab-6ddaa59b3e39' },
        { de: 'teuer', word: 'teuer', article: null, plural: null, en: 'expensive', wordId: 'b544de5a-1302-4af7-bee5-7eff09dadb02' },
        { de: 'machen', word: 'machen', article: null, plural: null, en: 'to do, to make', wordId: 'f0015482-c8fb-4a29-a181-39c041cdb310' },
      ],
      dialog: {
        title: 'Am Stand',
        setting: 'Tim sucht Möbel für sein Zimmer. Frau Wolf verkauft.',
        lines: [
          { speaker: 'Tim', de: 'Entschuldigung, was ist das?', en: 'Excuse me, what is that?' },
          { speaker: 'Frau Wolf', de: 'Das ist eine Lampe. Sie kostet acht Euro.', en: 'That is a lamp. It costs eight euros.' },
          { speaker: 'Tim', de: 'Und der Tisch? Was kostet er?', en: 'And the table? What does it cost?' },
          { speaker: 'Frau Wolf', de: 'Der Tisch kostet fünfzehn Euro.', en: 'The table costs fifteen euros.' },
          { speaker: 'Tim', de: 'Das ist teuer. Und der Stuhl?', en: 'That is expensive. And the chair?' },
          { speaker: 'Frau Wolf', de: 'Der Stuhl kostet zwölf Euro.', en: 'The chair costs twelve euros.' },
          { speaker: 'Tim', de: 'Ich kaufe den Stuhl und die Lampe.', en: 'I will buy the chair and the lamp.' },
          { speaker: 'Frau Wolf', de: 'Das macht zusammen zwanzig Euro.', en: 'That comes to twenty euros altogether.' },
          // „Preise bis hundert Euro“ needs a price above twenty somewhere in the input (DaF review #2, L4).
          { speaker: 'Tim', de: 'Und das Regal? Kostet es fünfzig Euro?', en: 'And the shelf? Does it cost fifty euros?' },
          { speaker: 'Frau Wolf', de: 'Nein, das Regal kostet dreißig Euro.', en: 'No, the shelf costs thirty euros.' },
        ],
      },
      pretest: {
        promptDe: 'Fragen Sie nach dem Preis von einem Stuhl.',
        promptEn: 'Ask what a chair costs.',
        model: 'Was kostet der Stuhl?',
        accepted: ['Was kostet', 'Wie viel kostet', 'Wie teuer ist'],
      },
      notice: {
        title: 'Jedes Nomen hat ein Genus',
        bodyDe: 'Jedes Nomen hat ein Genus: **der** Tisch, **die** Lampe, **das** Regal. Das Genus ist Teil des Wortes — lerne es immer mit: nicht Tisch, sondern der Tisch. Im Plural haben alle Nomen **die**. Nach **kaufen** wird **der** zu **den**: Ich kaufe **den** Stuhl. Das ist hier ein fester Ausdruck; die Regel (Akkusativ) kommt in A1.2.',
        examples: ['Das ist eine Lampe. Sie kostet acht Euro.', 'Der Tisch kostet fünfzehn Euro.'],
        ruleSlug: 'nouns-gender',
      },
      phonetik: { focus: 'Der Diphthong eu in Euro und teuer', items: ['EU-ro', 'TEU-er', 'NEUN'] },
      hoeren: { kind: 'dictation', lines: [3, 7] },
      sprechen: {
        readAloud: [0, 5],
        open: { teil: 'Sprechen Teil 3', promptDe: 'Bitten Sie am Stand um einen Preis und reagieren Sie darauf.', hintWords: ['kosten', 'Euro', 'teuer'], missionOrder: 2 },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a11-l04',
        taskDe: 'Schreiben Sie Ihrer Freundin eine Nachricht über den Flohmarkt. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        leitpunkte: ['Was Sie kaufen', 'Was es kostet', 'Wann Sie sich treffen'],
        minWords: 25,
        maxWords: 45,
        sample: 'Hallo Lena! Ich kaufe einen Stuhl. Er kostet zwölf Euro. Kommst du mit? Tschüss, Tim',
      },
      links: { listeningExercise: 1, readingOrder: 4 },
      practiceRule: { topics: ['nouns-gender', 'personal-pronouns'], typedMin: 3 },
    },
    {
      nr: 5,
      id: 'a1.1-l05',
      slug: 'im-klassenzimmer',
      title: 'Im Klassenzimmer',
      situation: 'Gegenstände und Farben',
      handlungsfeld: 'Lernen und Bildung: Gegenstände im Kurs benennen',
      canDo: [
        'Ich kann Gegenstände im Kursraum benennen.',
        'Ich kann fragen, wo etwas ist, und mit „hier“ oder „da“ antworten.',
        'Ich kann Farben nennen.',
        'Ich kann einfache Fragen im Kurs stellen.',
      ],
      examTeile: ['Sprechen Teil 2', 'Hören Teil 1'],
      grammarSlugs: ['definite-articles', 'nouns-gender'],
      primarySlug: 'definite-articles',
      minutes: 15,
      wortfeld: [
        { de: 'das Buch', word: 'Buch', article: 'das', plural: 'Bücher', en: 'book', wordId: '1b45946d-ed74-4e8a-b8e3-78f27639e657' },
        { de: 'das Heft', word: 'Heft', article: 'das', plural: 'Hefte', en: 'notebook', wordId: 'b1e6ebea-f728-41ae-82b5-74630aa2d463' },
        { de: 'der Stift', word: 'Stift', article: 'der', plural: 'Stifte', en: 'pen', wordId: 'de4bcb35-dabf-4017-84c9-c6910a82e774' },
        { de: 'der Bleistift', word: 'Bleistift', article: 'der', plural: 'Bleistifte', en: 'pencil', wordId: '857849c9-5da7-411c-bc9c-0b5766694014' },
        { de: 'der Kugelschreiber', word: 'Kugelschreiber', article: 'der', plural: 'Kugelschreiber', en: 'ballpoint pen', wordId: 'd862aa1f-12c2-4ea1-9479-529b82466b82' },
        { de: 'das Lineal', word: 'Lineal', article: 'das', plural: 'Lineale', en: 'ruler', wordId: 'bf76aa3d-3725-45de-992a-3a4ec47ef22e' },
        { de: 'die Schere', word: 'Schere', article: 'die', plural: 'Scheren', en: 'scissors', wordId: 'ea766d6a-4335-437e-96fe-7be94fcbbc0b' },
        { de: 'das Papier', word: 'Papier', article: 'das', plural: 'Papiere', en: 'paper', wordId: '1824e1ce-6c7e-4835-b429-744e5190e427' },
        { de: 'die Tafel', word: 'Tafel', article: 'die', plural: 'Tafeln', en: 'blackboard', wordId: 'dac0b162-56bd-430c-aeba-61638d7f5b5c' },
        { de: 'die Tür', word: 'Tür', article: 'die', plural: 'Türen', en: 'door', wordId: '3230fcc5-e7b4-4725-8ad0-82a8b07f513f' },
        { de: 'das Fenster', word: 'Fenster', article: 'das', plural: 'Fenster', en: 'window', wordId: '4ab2f19d-9398-4738-ab8c-0521d9eb9b42' },
        { de: 'das Wörterbuch', word: 'Wörterbuch', article: 'das', plural: 'Wörterbücher', en: 'dictionary', wordId: 'abc566d0-3ab7-4aec-bbc5-8f6b77ad484b' },
        // Grundschulwortschatz (Mäppchen, Spitzer, Radiergummi, Kreide) replaced by the Wohnen lexis
        // the Goethe A1 Wortliste and SD1 Lesen Teil 2 actually use (DaF review, L5).
        { de: 'das Zimmer', word: 'Zimmer', article: 'das', plural: 'Zimmer', en: 'room', wordId: '7c015007-2252-43ae-9c30-9ac8a82c9831' },
        { de: 'die Wohnung', word: 'Wohnung', article: 'die', plural: 'Wohnungen', en: 'flat, apartment', wordId: 'd46d546b-f0f1-4cab-818e-0e99a09b355d' },
        { de: 'der Schlüssel', word: 'Schlüssel', article: 'der', plural: 'Schlüssel', en: 'key', wordId: '1b3689de-3eee-4947-8ddd-c1b4fcada95b' },
        { de: 'das Bild', word: 'Bild', article: 'das', plural: 'Bilder', en: 'picture', wordId: '358ec9f0-c571-453a-a5c5-7e88ef81d1b8' },
        { de: 'die Farbe', word: 'Farbe', article: 'die', plural: 'Farben', en: 'color', wordId: '9a35fe92-fc2d-42af-a718-7c6cf48a9984' },
        { de: 'rot', word: 'rot', article: null, plural: null, en: 'red', wordId: 'fd89afcf-f470-4427-8ab4-d88fb9d35c06' },
        { de: 'blau', word: 'blau', article: null, plural: null, en: 'blue', wordId: 'f5d65f53-08bd-40ec-b859-16ebe6143ba8' },
        { de: 'grün', word: 'grün', article: null, plural: null, en: 'green', wordId: 'a86cb4d8-541f-4335-bff1-150dac102f32' },
        { de: 'gelb', word: 'gelb', article: null, plural: null, en: 'yellow', wordId: 'ff86b605-e582-4f04-b5c4-27d5e494bb4f' },
        { de: 'schwarz', word: 'schwarz', article: null, plural: null, en: 'black', wordId: 'fc5c8341-a794-4c0a-a81b-7bd4a0082470' },
        { de: 'weiß', word: 'weiß', article: null, plural: null, en: 'white', wordId: 'aaf238a5-d301-4ba3-953c-436fb603f6dc' },
        { de: 'braun', word: 'braun', article: null, plural: null, en: 'brown', wordId: '81f06668-01d2-4e8d-aff7-5d8fc0f6b9b1' },
      ],
      dialog: {
        title: 'Vor dem Kurs',
        setting: 'Lena und Tim packen ihre Taschen aus.',
        lines: [
          { speaker: 'Lena', de: 'Tim, wo ist das Wörterbuch?', en: 'Tim, where is the dictionary?' },
          { speaker: 'Tim', de: 'Das Wörterbuch ist hier. Der Stift ist da.', en: 'The dictionary is here. The pen is there.' },
          { speaker: 'Lena', de: 'Und die Schere? Wo ist sie?', en: 'And the scissors (die Schere, singular)? Where is it?' },
          { speaker: 'Tim', de: 'Die Schere ist hier. Das Lineal auch.', en: 'The scissors are here. The ruler too.' },
          { speaker: 'Lena', de: 'Ist der Stift blau oder schwarz?', en: 'Is the pen blue or black?' },
          { speaker: 'Tim', de: 'Der Stift ist blau, der Bleistift ist gelb.', en: 'The pen is blue, the pencil is yellow.' },
          { speaker: 'Lena', de: 'Und das Heft? Ist es rot?', en: 'And the notebook? Is it red?' },
          { speaker: 'Tim', de: 'Nein, das Heft ist grün.', en: 'No, the notebook is green.' },
          // Zimmer, Schlüssel and Bild were flashcards only; the last two lines bring them into the
          // input, which is what the Wohnen can-do needs (DaF review #2, L5 and §A).
          { speaker: 'Lena', de: 'Mein Schlüssel ist in der Tasche. Und das Bild?', en: 'My key is in the bag. And the picture?' },
          { speaker: 'Tim', de: 'Das Bild ist blau. Es ist für mein Zimmer.', en: 'The picture is blue. It is for my room.' },
        ],
      },
      pretest: { promptDe: 'Fragen Sie, wo das Buch ist.', promptEn: 'Ask where the book is.', model: 'Wo ist das Buch?', accepted: ['Wo ist', 'Wo sind'] },
      notice: {
        title: 'der, die, das – der bestimmte Artikel',
        bodyDe: 'Der bestimmte Artikel zeigt: Wir wissen, welche Sache gemeint ist. **der** (maskulin), **die** (feminin), **das** (neutral), im Plural immer **die**: die Bücher. Antworten kannst du zuerst mit **hier** und **da**. Sätze wie *auf dem Tisch* (Dativ) lernst du in A1.2.',
        examples: ['Das Wörterbuch ist hier. Der Stift ist da.', 'Die Schere ist hier. Das Lineal auch.'],
        ruleSlug: 'definite-articles',
      },
      phonetik: { focus: 'sch – s – z: Schere, sechs, zehn', items: ['SCHE-re', 'SECHS', 'ZEHN'] },
      hoeren: { kind: 'dictation', lines: [1, 5] },
      sprechen: {
        readAloud: [4, 7],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie zum Thema Kursraum: Buch? Tafel? Farbe?',
          hintWords: ['der Stift', 'die Tafel', 'blau'],
          missionOrder: 3,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a11-l05',
        taskDe: 'Lena Brandt ist im Kurs A1. Ihr Kurs ist in Zimmer 12. Auf dem Tisch sind ein Wörterbuch und ein Heft. Das Heft ist grün. Füllen Sie die Liste für das Kursmaterial aus.',
        fields: ['Name', 'Kurs', 'Zimmer', 'Material', 'Farbe'],
        minWords: 5,
        maxWords: 40,
        sample: 'Name: Lena Brandt / Kurs: A1 / Zimmer: 12 / Material: Wörterbuch, Heft / Farbe: grün',
      },
      links: { listeningExercise: null, readingOrder: 7 },
      practiceRule: { topics: ['definite-articles', 'nouns-gender'], typedMin: 3 },
    },
    {
      nr: 6,
      id: 'a1.1-l06',
      slug: 'der-erste-tag-im-buero',
      title: 'Der erste Tag im Büro',
      situation: 'Büro, Technik und Telefon',
      handlungsfeld: 'Arbeit und Beruf: am Arbeitsplatz zurechtkommen',
      canDo: [
        'Ich kann sagen, was ich brauche.',
        'Ich kann am Telefon meinen Namen nennen.',
        'Ich kann eine Telefonnummer verstehen und notieren.',
        'Ich kann nach der Pause und nach Arbeitszeiten fragen.',
      ],
      examTeile: ['Hören Teil 3', 'Schreiben Teil 2', 'Sprechen Teil 2'],
      grammarSlugs: ['indefinite-articles', 'definite-articles', 'nouns-gender'],
      primarySlug: 'indefinite-articles',
      minutes: 15,
      wortfeld: [
        { de: 'das Büro', word: 'Büro', article: 'das', plural: 'Büros', en: 'office', wordId: '8fbe2c10-b65b-4c50-b60a-14d92b931783' },
        { de: 'die Firma', word: 'Firma', article: 'die', plural: 'Firmen', en: 'company', wordId: '241df305-fc58-4232-bb0a-df8ce4cc9d01' },
        { de: 'der Chef', word: 'Chef', article: 'der', plural: 'Chefs', en: 'boss (m)', wordId: '40ac179d-e47c-4c64-8eb3-9e1017da46a0' },
        { de: 'die Chefin', word: 'Chefin', article: 'die', plural: 'Chefinnen', en: 'boss (f)', wordId: 'a9179b77-b31b-43d0-9f53-4df8ba9c3a27' },
        { de: 'der Kollege', word: 'Kollege', article: 'der', plural: 'Kollegen', en: 'colleague (m)', wordId: '81abf8c3-ae9f-4e61-9fa9-b4a10e0b0ae8' },
        { de: 'die Kollegin', word: 'Kollegin', article: 'die', plural: 'Kolleginnen', en: 'colleague (f)', wordId: 'dfb0bc97-919c-4f20-9efd-59b78a541197' },
        { de: 'die Arbeit', word: 'Arbeit', article: 'die', plural: '—', en: 'work', wordId: '89ff21bb-79ad-470a-a29b-ff6bbeef344a' },
        { de: 'der Computer', word: 'Computer', article: 'der', plural: 'Computer', en: 'computer', wordId: 'b75584fd-ce50-433c-9deb-dc2c35906c15' },
        { de: 'die Handynummer', word: 'Handynummer', article: 'die', plural: 'Handynummern', en: 'mobile number', wordId: '58fdee72-2812-4256-8f4b-7e6142c10b12' },
        { de: 'die E-Mail-Adresse', word: 'E-Mail-Adresse', article: 'die', plural: 'E-Mail-Adressen', en: 'email address', wordId: '7a4581a1-0411-425b-b230-95840777b557' },
        { de: 'der Ingenieur', word: 'Ingenieur', article: 'der', plural: 'Ingenieure', en: 'engineer (m)', wordId: 'a358f9d4-ef56-451c-8139-8a210b7a122f' },
        { de: 'die Ingenieurin', word: 'Ingenieurin', article: 'die', plural: 'Ingenieurinnen', en: 'engineer (f)', wordId: '19f79c25-b6b5-4ec9-b9b7-c56515c68da8' },
        { de: 'der Verkäufer', word: 'Verkäufer', article: 'der', plural: 'Verkäufer', en: 'salesperson (m)', wordId: '497a6825-36c3-4af5-aaf5-5e70dafdbb4f' },
        { de: 'die Verkäuferin', word: 'Verkäuferin', article: 'die', plural: 'Verkäuferinnen', en: 'salesperson (f)', wordId: '1b7e9803-1125-4b4a-a392-79b59fa69dfa' },
        { de: 'die Pause', word: 'Pause', article: 'die', plural: 'Pausen', en: 'break', wordId: 'c1c71f2f-1cea-437b-b2ae-5cce152ee9a4' },
        { de: 'die Nummer', word: 'Nummer', article: 'die', plural: 'Nummern', en: 'number', wordId: '83a14b7b-33f9-4972-9001-72c42442f14d' },
        { de: 'brauchen', word: 'brauchen', article: null, plural: null, en: 'to need', wordId: '0bca1725-1790-4ec6-a1cb-362cda69fefb' },
        { de: 'das Handy', word: 'Handy', article: 'das', plural: 'Handys', en: 'mobile phone', wordId: '5facc4fc-da80-494c-ae4a-4bf2a2384fb5' },
        { de: 'das Telefon', word: 'Telefon', article: 'das', plural: 'Telefone', en: 'telephone', wordId: '45918530-54aa-40f0-8f51-b0193953fdd8' },
      ],
      dialog: {
        title: 'Ein Platz im Büro',
        // Herr Weber has ONE employer: he sits at the Bürgerbüro counter in L2, and L6 is Ana's
        // first day in the same Amt. The cast is five people; two jobs for one of them broke the
        // only narrative bracket the level has (DaF review #2, L2).
        setting: 'Anas erster Arbeitstag im Bürgerbüro. Herr Weber zeigt ihr den Arbeitsplatz.',
        lines: [
          { speaker: 'Ana', de: 'Guten Morgen, Herr Weber!', en: 'Good morning, Mr Weber!' },
          { speaker: 'Herr Weber', de: 'Guten Morgen, Ana. Das ist Ihr Büro.', en: 'Good morning, Ana. This is your office.' },
          { speaker: 'Ana', de: 'Danke. Ich brauche einen Computer und ein Telefon.', en: 'Thank you. I need a computer and a telephone.' },
          { speaker: 'Herr Weber', de: 'Im Büro sind ein Computer und ein Telefon.', en: 'There is a computer and a telephone in the office.' },
          { speaker: 'Ana', de: 'Und ein Handy?', en: 'And a mobile phone?' },
          { speaker: 'Herr Weber', de: 'Wir haben kein Handy.', en: 'We do not have a mobile phone.' },
          { speaker: 'Ana', de: 'Und wie ist die Telefonnummer?', en: 'And what is the telephone number?' },
          { speaker: 'Herr Weber', de: 'Null vier zwei – drei drei acht eins.', en: 'Zero four two – three three eight one.' },
          { speaker: 'Ana', de: 'Danke! Wann ist die Pause?', en: 'Thank you! When is the break?' },
          { speaker: 'Herr Weber', de: 'Die Pause ist um eins.', en: 'The break is at one.' },
        ],
      },
      pretest: {
        promptDe: 'Sagen Sie, was Sie im Büro brauchen.',
        promptEn: 'Say what you need in the office.',
        model: 'Ich brauche einen Computer.',
        accepted: ['Ich brauche', 'Wir brauchen', 'Haben Sie'],
      },
      notice: {
        title: 'ein, eine – der unbestimmte Artikel',
        bodyDe: 'Neu oder unbekannt? Dann **ein** (der/das) oder **eine** (die): ein Computer, eine Lampe. Nach Verben wie **brauchen**, **haben**, **kaufen** wird maskulin **ein → einen**: Ich brauche **einen** Computer (Akkusativ — die Regel kommt in A1.2). Verneinung mit **kein**: Wir haben **kein** Handy. Die Uhrzeit **um eins** lernst du in Lektion 8.',
        examples: ['Danke. Ich brauche einen Computer und ein Telefon.', 'Wir haben kein Handy.'],
        ruleSlug: 'indefinite-articles',
      },
      phonetik: { focus: 'Das lange ie in vier und Telefon', items: ['VIER', 'Te-le-FON', 'BÜ-ro'] },
      // NOT line 7: the split telephone number carries an en dash, so „042 3381“ and „Null vier
      // zwei - drei …“ would both be marked wrong. Line 9 has no punctuation trap (DaF review #2, L6).
      hoeren: { kind: 'dictation', lines: [2, 9] },
      sprechen: {
        readAloud: [2, 6],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie zum Thema Arbeit: Büro? Kollegin? Pause?',
          hintWords: ['brauchen', 'die Pause', 'die Nummer'],
          missionOrder: 4,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a11-l06',
        taskDe: 'Schreiben Sie Ihrer Chefin eine kurze Nachricht. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        leitpunkte: ['Was Sie brauchen', 'Ihre Telefonnummer', 'Wann Sie im Büro sind'],
        minWords: 25,
        maxWords: 45,
        sample: 'Guten Tag, Frau Berg! Ich brauche einen Computer. Meine Nummer ist null vier zwei. Viele Grüße, Ana',
      },
      links: { listeningExercise: 5, readingOrder: null },
      practiceRule: { topics: ['indefinite-articles', 'definite-articles'], typedMin: 3 },
    },
    {
      nr: 7,
      id: 'a1.1-l07',
      slug: 'freizeit-und-hobbys',
      title: 'Freizeit und Hobbys',
      situation: 'Freizeit und Hobbys',
      handlungsfeld: 'Freizeit und soziale Kontakte: über Hobbys sprechen',
      canDo: [
        'Ich kann über meine Hobbys sprechen.',
        'Ich kann sagen, was ich gern mache.',
        'Ich kann eine Person nach ihren Hobbys fragen.',
        'Ich kann sagen, wann ich frei habe.',
      ],
      examTeile: ['Lesen Teil 2', 'Sprechen Teil 2'],
      grammarSlugs: ['present-tense-regular', 'personal-pronouns'],
      primarySlug: 'present-tense-regular',
      minutes: 15,
      wortfeld: [
        { de: 'gern', word: 'gern', article: null, plural: null, en: 'gladly', wordId: '4c8d60b7-0546-4533-bdc4-1d2cc5711ae9' },
        { de: 'immer', word: 'immer', article: null, plural: null, en: 'always', wordId: '0039d89a-18d8-45ad-a982-76926f5840c4' },
        { de: 'vielleicht', word: 'vielleicht', article: null, plural: null, en: 'maybe', wordId: '24287c01-68eb-4edf-a598-fb80799b4f67' },
        // A Hobby-Lektion needs hobbies, not particles: natürlich, wirklich and glücklich gave way to
        // the six A1-Wortliste leisure words below (DaF review, L7).
        { de: 'lesen', word: 'lesen', article: null, plural: null, en: 'to read', wordId: 'f2920503-570f-42ac-9ab6-2cf44801f3cf' },
        { de: 'schwimmen', word: 'schwimmen', article: null, plural: null, en: 'to swim', wordId: '08cd57ff-4ad6-4507-98de-be89cb5b9c33' },
        { de: 'kochen', word: 'kochen', article: null, plural: null, en: 'to cook', wordId: 'ec94fc24-9c2a-40dd-9365-b2d897e46abd' },
        { de: 'tanzen', word: 'tanzen', article: null, plural: null, en: 'to dance', wordId: '072de979-1dd1-49cd-a833-989402066a23' },
        { de: 'der Fußball', word: 'Fußball', article: 'der', plural: 'Fußbälle', en: 'football, soccer', wordId: 'b4faaaee-78ba-4eda-8002-854ccac60bd4' },
        { de: 'das Kino', word: 'Kino', article: 'das', plural: 'Kinos', en: 'cinema', wordId: 'c06bedd6-08d6-47f3-a3bc-f6441efd85b1' },
        { de: 'gehen', word: 'gehen', article: null, plural: null, en: 'to go', wordId: 'd1a08b25-03ef-4055-872b-b35d32b06690' },
        { de: 'gut', word: 'gut', article: null, plural: null, en: 'good', wordId: '87798924-0cc3-4619-b45d-8e6cfa2eee57' },
        { de: 'das Wochenende', word: 'Wochenende', article: 'das', plural: 'Wochenenden', en: 'weekend', wordId: 'b5a36d15-71c0-4e81-9113-eeffcde1d9b7' },
        // The seven weekdays are learnt as ONE set in L8; Samstag and Sonntag moved there, and the two
        // freed slots carry der Freund / die Freundin, which L4's writing task already addresses.
        // nie appeared nowhere in the course and bestimmt only in L12, where it now lives (review #2, L7).
        { de: 'der Freund', word: 'Freund', article: 'der', plural: 'Freunde', en: 'friend (m)', wordId: '89677687-642b-440a-8cfd-d1ef229733d7' },
        { de: 'die Freundin', word: 'Freundin', article: 'die', plural: 'Freundinnen', en: 'friend (f)', wordId: '910c14d5-47c7-427e-812a-39abb7eac571' },
        { de: 'frei', word: 'frei', article: null, plural: null, en: 'free, off', wordId: 'd55d73a1-a4d1-4bad-a6eb-f058373e9ee8' },
        { de: 'jede Woche', word: 'jede Woche', article: null, plural: null, en: 'every week', wordId: 'fa0c17a8-27a0-4d39-b4ca-2218001b5095' },
        { de: 'die Woche', word: 'Woche', article: 'die', plural: 'Wochen', en: 'week', wordId: '19bd209f-6a41-4f0f-9f58-9735dbb8809c' },
        { de: 'das Hobby', word: 'Hobby', article: 'das', plural: 'Hobbys', en: 'hobby', wordId: '0892f4c7-70d2-4d54-aa72-11f6aed86e66' },
        { de: 'die Musik', word: 'Musik', article: 'die', plural: '—', en: 'music', wordId: '372fae57-128a-4149-b1aa-45f51bffbe82' },
        { de: 'der Sport', word: 'Sport', article: 'der', plural: '—', en: 'sport', wordId: '79a7911d-6f46-4058-8bbb-3384c6715a14' },
        { de: 'spielen', word: 'spielen', article: null, plural: null, en: 'to play', wordId: '3f11825a-d3e4-444c-9d97-2a53203e8f15' },
        { de: 'hören', word: 'hören', article: null, plural: null, en: 'to listen, to hear', wordId: '3c868b51-6e36-4d5a-a499-8e5b8fe60fee' },
      ],
      dialog: {
        title: 'Was machst du am Wochenende?',
        setting: 'Lena und Tim nach dem Kurs.',
        lines: [
          { speaker: 'Lena', de: 'Tim, was ist dein Hobby?', en: 'Tim, what is your hobby?' },
          { speaker: 'Tim', de: 'Ich höre gern Musik. Und du?', en: 'I like listening to music. And you?' },
          { speaker: 'Lena', de: 'Mein Hobby ist Sport. Ich spiele am Wochenende Fußball.', en: 'My hobby is sport. I play football at the weekend.' },
          { speaker: 'Tim', de: 'Spielst du jede Woche Fußball?', en: 'Do you play football every week?' },
          { speaker: 'Lena', de: 'Ja, immer. Am Wochenende bin ich frei.', en: 'Yes, always. At the weekend I am free.' },
          // lesen, kochen, schwimmen, tanzen and das Kino were added to the Wortfeld in #115 and
          // appeared in no line of the Lektion; the Hobby can-do rested on Musik and Sport alone
          // (DaF review #2, L7 and §A). The weekdays moved to L8, so the dialogue says am Wochenende.
          { speaker: 'Tim', de: 'Ich lese auch gern. Und ich koche gern.', en: 'I also like reading. And I like cooking.' },
          { speaker: 'Lena', de: 'Ich schwimme jede Woche. Gehst du ins Kino?', en: 'I swim every week. Do you go to the cinema?' },
          { speaker: 'Tim', de: 'Ja, sehr gern! Und tanzt du auch?', en: 'Yes, very gladly! And do you dance too?' },
          { speaker: 'Lena', de: 'Nein, ich tanze nicht gut. Meine Freundin tanzt gern.', en: 'No, I do not dance well. My friend likes dancing.' },
          { speaker: 'Tim', de: 'Hören wir am Wochenende zusammen Musik?', en: 'Shall we listen to music together at the weekend?' },
        ],
      },
      pretest: {
        promptDe: 'Sagen Sie, was Sie gern machen.',
        promptEn: 'Say what you like doing.',
        model: 'Ich höre gern Musik.',
        // Not the bare prefix 'Ich' — that accepts „Ich bin müde“ as an answer about free time.
        accepted: ['Ich höre gern', 'Ich spiele gern', 'Ich mache gern', 'Ich lese gern', 'Mein Hobby ist', 'Meine Hobbys sind'],
      },
      notice: {
        title: 'Präsens: regelmäßige Verben',
        bodyDe: 'Regelmäßige Verben haben feste Endungen am Stamm: ich spiel**e**, du spiel**st**, er/sie/es spiel**t**, wir spiel**en**, ihr spiel**t**, sie/Sie spiel**en**. **gern** steht nach dem Verb: Ich höre **gern** Musik. **Achtung:** einige Verben wechseln den Vokal: sprechen → du **sprichst**, er **spricht**; fahren → du **fährst**, er **fährt**.',
        examples: ['Ich höre gern Musik. Und du?', 'Spielst du jede Woche Fußball?'],
        ruleSlug: 'present-tense-regular',
      },
      phonetik: { focus: 'Endung -e und -en am Wortende', items: ['ich HÖ-re', 'wir HÖ-ren', 'du SPIELST'] },
      hoeren: { kind: 'dictation', lines: [2, 6] },
      sprechen: {
        readAloud: [1, 4],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie zum Thema Freizeit: Hobby? Musik? Wochenende?',
          hintWords: ['spielen', 'hören', 'gern'],
          // Missions 1–8 are the only published A1.1 speaking missions and each is linked once; this
          // Lektion (and 10–12) falls back to the generic prompt until new missions are seeded.
          missionOrder: null,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a11-l07',
        taskDe: 'Lena Brandt ist neu im Sportkurs. Ihr Hobby ist Schwimmen. Der Kurs ist am Samstag. Füllen Sie die Anmeldung für einen Sportkurs aus.',
        fields: ['Vorname', 'Nachname', 'Kurs', 'Hobby', 'Tag'],
        minWords: 5,
        maxWords: 40,
        sample: 'Vorname: Lena / Nachname: Brandt / Kurs: Sport / Hobby: Schwimmen / Tag: Samstag',
      },
      links: { listeningExercise: null, readingOrder: 9 },
      practiceRule: { topics: ['present-tense-regular', 'personal-pronouns'], typedMin: 3 },
    },
    {
      nr: 8,
      id: 'a1.1-l08',
      slug: 'termine-und-uhrzeit',
      title: 'Termine und Uhrzeit',
      situation: 'Verabredungen, Uhrzeit und Tagesablauf',
      handlungsfeld: 'Gesundheit und Ämter: Termine vereinbaren',
      canDo: [
        'Ich kann nach der Uhrzeit fragen und die Uhrzeit sagen.',
        'Ich kann einen Termin vereinbaren.',
        'Ich kann über meinen Tag sprechen.',
        'Ich kann sagen, wann ich Zeit habe.',
      ],
      examTeile: ['Hören Teil 1', 'Schreiben Teil 2', 'Sprechen Teil 3'],
      grammarSlugs: ['time-and-dates', 'present-tense-regular', 'separable-verbs-intro'],
      primarySlug: 'time-and-dates',
      minutes: 15,
      wortfeld: [
        { de: 'die Uhrzeit', word: 'Uhrzeit', article: 'die', plural: 'Uhrzeiten', en: 'time (clock time)', wordId: '16f6813d-5f8b-4fd3-b575-2f64db21e6e7' },
        { de: 'die Zeit', word: 'Zeit', article: 'die', plural: 'Zeiten', en: 'time', wordId: 'e4d1fa01-6381-4593-b9d1-e0fb72f5ab49' },
        { de: 'der Termin', word: 'Termin', article: 'der', plural: 'Termine', en: 'appointment', wordId: 'f185c3e3-f500-41e6-b1c9-c0470f9343c1' },
        { de: 'pünktlich', word: 'pünktlich', article: null, plural: null, en: 'punctual, on time', wordId: '56f22ec2-7fe2-4ff7-b64b-91be9a0abcf1' },
        { de: 'zu spät', word: 'zu spät', article: null, plural: null, en: 'too late', wordId: 'c86cfd40-5bc1-421d-a6a1-cef236812adb' },
        { de: 'die Verspätung', word: 'Verspätung', article: 'die', plural: 'Verspätungen', en: 'delay', wordId: '00f57653-edbf-480c-8a0a-1b39518744e1' },
        // verspätet/rechtzeitig (neither in the A1 Wortliste) gave way to the clock-time words the
        // notice actually uses, and the week is now learnt as a set (DaF review, L8).
        { de: 'halb', word: 'halb', article: null, plural: null, en: 'half (past)', wordId: 'cc37acc3-4937-4d79-a6b1-5960406aa578' },
        { de: 'Viertel nach', word: 'Viertel nach', article: null, plural: null, en: 'quarter past', wordId: 'ed21a1d7-ab09-4aeb-8123-1b057552c7c4' },
        { de: 'Viertel vor', word: 'Viertel vor', article: null, plural: null, en: 'quarter to', wordId: '6d9cc58e-6ce6-4e04-abd1-acc67576d29e' },
        { de: 'der Wecker', word: 'Wecker', article: 'der', plural: 'Wecker', en: 'alarm clock', wordId: '02801836-9974-4da2-9f1c-27c4bb1c5966' },
        { de: 'aufstehen', word: 'aufstehen', article: null, plural: null, en: 'to get up', wordId: 'b9753cfc-8f74-4540-9315-7f4d4ef332ea' },
        { de: 'morgens', word: 'morgens', article: null, plural: null, en: 'in the morning(s)', wordId: 'a10207a1-65eb-4b21-b256-4869123cae0f' },
        { de: 'nachmittags', word: 'nachmittags', article: null, plural: null, en: 'in the afternoon(s)', wordId: 'e977640a-5805-4c5d-91b1-dc62c0235a4e' },
        { de: 'abends', word: 'abends', article: null, plural: null, en: 'in the evening(s)', wordId: '9b059418-c75c-477b-93ae-f412a3dca3bf' },
        // der Abend was the one missing part of the day (abends, morgens, nachmittags were there) and
        // the pool asks for „die Ankunft am Abend“ in L10; der Vormittag and der Nachmittag appeared
        // nowhere in the Lektion and gave up their slots. die Verabredung doubled der Termin without
        // the Lektion ever naming the difference, and aufwachen doubled aufstehen (review #2, L8).
        { de: 'der Abend', word: 'Abend', article: 'der', plural: 'Abende', en: 'evening', wordId: '2f8b57f8-3935-4b4b-8072-2ee700aeec18' },
        { de: 'der Montag', word: 'Montag', article: 'der', plural: 'Montage', en: 'Monday', wordId: '74232a41-8578-4826-af22-5c1235360cd9' },
        { de: 'der Dienstag', word: 'Dienstag', article: 'der', plural: 'Dienstage', en: 'Tuesday', wordId: '34b1bf45-b514-4590-ba20-4a83f93f47f9' },
        { de: 'der Mittwoch', word: 'Mittwoch', article: 'der', plural: 'Mittwoche', en: 'Wednesday', wordId: '683072dd-e46c-4a9e-bae7-e2bbc67678ad' },
        { de: 'der Donnerstag', word: 'Donnerstag', article: 'der', plural: 'Donnerstage', en: 'Thursday', wordId: '4bd005d5-2b4e-4de7-b6c9-061f11e41675' },
        { de: 'der Freitag', word: 'Freitag', article: 'der', plural: 'Freitage', en: 'Friday', wordId: '34c2e1e6-005c-4d2f-93d9-c4c285529878' },
        // The week is one set now: Samstag and Sonntag came over from L7 (DaF review #2, L8).
        { de: 'der Samstag', word: 'Samstag', article: 'der', plural: 'Samstage', en: 'Saturday', wordId: 'f975c09d-d4f8-4d3c-b00f-44d1c5c1cef5' },
        { de: 'der Sonntag', word: 'Sonntag', article: 'der', plural: 'Sonntage', en: 'Sunday', wordId: '4b76a3f6-59ae-4e0d-bbe7-b3c9728b814f' },
        { de: 'heute', word: 'heute', article: null, plural: null, en: 'today', wordId: '30eb2fd7-5167-4a2b-9482-b7c57f3d7efe' },
        // The Handlungsfeld is „Gesundheit und Ämter“ and carried no health word at all; krank came
        // over from L11, where it was unused (DaF review #2, L8 and L11).
        { de: 'krank', word: 'krank', article: null, plural: null, en: 'sick, ill', wordId: '609580f6-24f7-47c7-b777-2aecc41027ca' },
        { de: 'der Arzt', word: 'Arzt', article: 'der', plural: 'Ärzte', en: 'doctor', wordId: '5785df40-c89c-472f-a65e-72c449a6c634' },
      ],
      dialog: {
        title: 'Wann hast du Zeit?',
        setting: 'Ana und Lena machen einen Termin aus.',
        lines: [
          { speaker: 'Ana', de: 'Lena, wann stehst du morgens auf?', en: 'Lena, when do you get up in the morning?' },
          { speaker: 'Lena', de: 'Ich stehe um sechs Uhr auf.', en: 'I get up at six o’clock.' },
          { speaker: 'Ana', de: 'Und wann ist dein Termin?', en: 'And when is your appointment?' },
          { speaker: 'Lena', de: 'Der Termin ist am Montag um Viertel vor acht.', en: 'The appointment is on Monday at a quarter to eight.' },
          { speaker: 'Ana', de: 'Kommst du pünktlich?', en: 'Will you be on time?' },
          // NOT „Ich habe einen guten Wecker“: that is Adjektivdeklination im Akkusativ, a fifth
          // Vorgriff the course never names, in the Lektion whose exam part is Hören Teil 1.
          { speaker: 'Lena', de: 'Ja, immer. Mein Wecker ist gut.', en: 'Yes, always. My alarm clock is good.' },
          { speaker: 'Ana', de: 'Und am Dienstag? Hast du nachmittags Zeit?', en: 'And on Tuesday? Do you have time in the afternoon?' },
          { speaker: 'Lena', de: 'Am Dienstag habe ich abends Zeit.', en: 'On Tuesday I have time in the evening.' },
          // Mittwoch, Donnerstag and Freitag were in the Wortfeld and in no line (DaF review #2, §A).
          { speaker: 'Ana', de: 'Und am Mittwoch, am Donnerstag oder am Freitag?', en: 'And on Wednesday, Thursday or Friday?' },
          { speaker: 'Lena', de: 'Am Mittwoch bin ich beim Arzt. Am Freitag um acht!', en: 'On Wednesday I am at the doctor’s. On Friday at eight!' },
        ],
      },
      pretest: { promptDe: 'Fragen Sie nach der Uhrzeit.', promptEn: 'Ask what time it is.', model: 'Wie spät ist es?', accepted: ['Wie spät', 'Wie viel Uhr', 'Wann'] },
      notice: {
        title: 'um, am – die Uhrzeit sagen',
        bodyDe: 'Uhrzeit mit **um**: um acht Uhr. Wochentag mit **am**: am Montag. Umgangssprachlich: **Viertel nach** acht, **Viertel vor** neun, **halb** neun (= 8.30!). Offiziell (Bahn, Radio): **acht Uhr dreißig**. Die Frage lautet: **Wie spät ist es?** **Hast du Zeit?** ist eine feste Wendung; haben kommt in Lektion 9.',
        examples: ['Ich stehe um sechs Uhr auf.', 'Der Termin ist am Montag um Viertel vor acht.'],
        ruleSlug: 'time-and-dates',
      },
      phonetik: { focus: 'Satzmelodie in der W-Frage: fallend', items: ['Wie SPÄT ist es?', 'WANN kommst du?', 'um ACHT Uhr'] },
      hoeren: { kind: 'dictation', lines: [3, 7] },
      sprechen: {
        readAloud: [1, 6],
        open: {
          teil: 'Sprechen Teil 3',
          promptDe: 'Bitten Sie um einen Termin am Nachmittag und reagieren Sie auf die Antwort.',
          hintWords: ['der Termin', 'um', 'Zeit haben'],
          missionOrder: 8,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a11-l08',
        taskDe: 'Schreiben Sie eine Nachricht und verschieben Sie einen Termin. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        leitpunkte: ['Warum Sie schreiben', 'Neuer Tag und neue Uhrzeit', 'Eine Frage an Lena'],
        minWords: 25,
        maxWords: 45,
        sample: 'Hallo Lena! Ich komme am Montag zu spät. Der Termin am Dienstag um acht? Viele Grüße, Ana',
      },
      links: { listeningExercise: 4, readingOrder: 3 },
      // Only the primary topic: with two topics the builder drew 5 present-tense items against 2 time
      // items in a Lektion about the clock (DaF review, L8). Revisit once the pool weights topics[0].
      practiceRule: { topics: ['time-and-dates'], typedMin: 4 },
    },
    {
      nr: 9,
      id: 'a1.1-l09',
      slug: 'im-cafe',
      title: 'Im Café',
      // The Lektion teaches declining an OFFER, not an invitation — inviting is L12 (review #2, L9).
      // The standard's §2.2 keyword „Einladung“ stays in the string, with the forward pointer.
      situation: 'Essen und Trinken: etwas bestellen (die Einladung kommt in Lektion 12)',
      handlungsfeld: 'Essen und Trinken: etwas bestellen',
      canDo: [
        'Ich kann im Café etwas bestellen.',
        'Ich kann sagen, dass ich Hunger oder Durst habe.',
        'Ich kann höflich fragen, ob es etwas gibt.',
        'Ich kann ein Angebot annehmen oder höflich ablehnen.',
      ],
      examTeile: ['Sprechen Teil 3', 'Hören Teil 2', 'Schreiben Teil 1'],
      grammarSlugs: ['verb-haben', 'indefinite-articles'],
      primarySlug: 'verb-haben',
      minutes: 15,
      wortfeld: [
        { de: 'das Café', word: 'Café', article: 'das', plural: 'Cafés', en: 'café', wordId: '28e484dd-af1e-4c43-a788-e0dde46c3f0d' },
        { de: 'das Bier', word: 'Bier', article: 'das', plural: 'Biere', en: 'beer', wordId: 'b39fa2aa-f2cc-4457-abc5-d39c65eb221a' },
        // Eleven drinks and two foods made the Hunger can-do unteachable; Cola and Flasche gave way to
        // the food words SD1 Lesen Teil 2 works with (DaF review, L9).
        { de: 'der Kuchen', word: 'Kuchen', article: 'der', plural: 'Kuchen', en: 'cake', wordId: 'ba939378-112b-44c2-aee2-795e7dff9beb' },
        { de: 'die Suppe', word: 'Suppe', article: 'die', plural: 'Suppen', en: 'soup', wordId: '3593a46a-464f-494a-a09d-ab05c3538e1f' },
        { de: 'der Salat', word: 'Salat', article: 'der', plural: 'Salate', en: 'salad', wordId: '3cc8d993-6ff3-4ea8-8a4c-3e1b0f330f4e' },
        { de: 'das Glas', word: 'Glas', article: 'das', plural: 'Gläser', en: 'glass', wordId: '0e2528d9-929f-4616-96c8-ed2de35098db' },
        { de: 'der Kaffee', word: 'Kaffee', article: 'der', plural: 'Kaffees', en: 'coffee', wordId: '990b6024-f44e-4b48-837c-c00c7f5298e6' },
        { de: 'das Mineralwasser', word: 'Mineralwasser', article: 'das', plural: '—', en: 'mineral water', wordId: 'e53ecdcf-8b61-448e-92df-87161af7bf16' },
        { de: 'der Orangensaft', word: 'Orangensaft', article: 'der', plural: 'Orangensäfte', en: 'orange juice', wordId: 'a1a1db31-6a26-4c9f-9dac-a3631e3642e2' },
        { de: 'die Tasse', word: 'Tasse', article: 'die', plural: 'Tassen', en: 'cup', wordId: 'f670c5e7-2f91-45fe-b08c-18712fa46c7a' },
        { de: 'der Tee', word: 'Tee', article: 'der', plural: 'Tees', en: 'tea', wordId: '61b2fea6-08ab-4629-8354-e1237cde274e' },
        { de: 'das Wasser', word: 'Wasser', article: 'das', plural: '—', en: 'water', wordId: '1ad9dea6-5ffa-4411-9dfd-35c1e1a2084a' },
        { de: 'der Wein', word: 'Wein', article: 'der', plural: 'Weine', en: 'wine', wordId: '5adf5583-3ae3-4355-861a-aff862f32332' },
        { de: 'der Hunger', word: 'Hunger', article: 'der', plural: '—', en: 'hunger', wordId: 'c24eeb7f-d9d0-433c-9144-8ea52ba10732' },
        { de: 'der Durst', word: 'Durst', article: 'der', plural: '—', en: 'thirst', wordId: '2676efa7-e91b-4171-b65b-7c92216fc982' },
        { de: 'der Kellner', word: 'Kellner', article: 'der', plural: 'Kellner', en: 'waiter', wordId: '91650054-9faf-42ab-8835-b0bcca5d760c' },
        { de: 'die Kellnerin', word: 'Kellnerin', article: 'die', plural: 'Kellnerinnen', en: 'waitress', wordId: 'dbf47a75-7192-4ac8-831f-991a7038e190' },
        { de: 'essen', word: 'essen', article: null, plural: null, en: 'to eat', wordId: '276d4ec4-3197-462b-b13b-029eb8da4471' },
        { de: 'trinken', word: 'trinken', article: null, plural: null, en: 'to drink', wordId: 'dd482964-5d26-4f43-b6ca-f6fe201263be' },
        { de: 'das Brot', word: 'Brot', article: 'das', plural: 'Brote', en: 'bread', wordId: '591f344e-c254-431f-9f13-ba89042d23ea' },
        { de: 'das Frühstück', word: 'Frühstück', article: 'das', plural: 'Frühstücke', en: 'breakfast', wordId: '098a88d0-ca99-4787-8dfc-55197af3b08b' },
        { de: 'möchten', word: 'möchten', article: null, plural: null, en: 'would like', wordId: 'ff2864f0-3fbb-47f7-bff8-f95802a66f49' },
        { de: 'sofort', word: 'sofort', article: null, plural: null, en: 'right away', wordId: '3c546555-f5a2-4827-a4ce-4d31d59a3d53' },
      ],
      dialog: {
        title: 'Bestellen im Café',
        setting: 'Ana sitzt im Café. Paul ist Kellner.',
        lines: [
          { speaker: 'Paul', de: 'Guten Tag! Was möchten Sie trinken?', en: 'Good day! What would you like to drink?' },
          { speaker: 'Ana', de: 'Ich habe Durst. Ich möchte einen Kaffee, bitte.', en: 'I am thirsty. I would like a coffee, please.' },
          // die Suppe and der Salat were added to the Wortfeld in #115 and ordered by nobody (§A).
          { speaker: 'Paul', de: 'Haben Sie auch Hunger? Wir haben Suppe, Salat und Kuchen.', en: 'Are you hungry too? We have soup, salad and cake.' },
          { speaker: 'Ana', de: 'Ja, ich habe Hunger. Ich möchte Kuchen, bitte.', en: 'Yes, I am hungry. I would like cake, please.' },
          { speaker: 'Paul', de: 'Möchten Sie auch Wasser?', en: 'Would you like water as well?' },
          { speaker: 'Ana', de: 'Ja, ein Glas Wasser, bitte.', en: 'Yes, a glass of water, please.' },
          { speaker: 'Paul', de: 'Möchten Sie auch einen Tee?', en: 'Would you like a tea too?' },
          { speaker: 'Ana', de: 'Nein, danke.', en: 'No, thank you.' },
          { speaker: 'Paul', de: 'Gut. Kommt sofort!', en: 'Good. Coming right up!' },
        ],
      },
      pretest: {
        promptDe: 'Bestellen Sie im Café etwas zu trinken.',
        promptEn: 'Order something to drink in a café.',
        model: 'Ich möchte einen Kaffee, bitte.',
        accepted: ['Ich möchte', 'Ich nehme', 'Einen', 'Eine'],
      },
      notice: {
        title: 'haben und der Chunk „Ich möchte …“',
        bodyDe: '**haben**: ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben. Mit haben sagst du Hunger, Durst oder Zeit. **Ich möchte …** lernst du hier als festen Chunk; die Form gehört zu den Modalverben in A1.2.',
        examples: ['Haben Sie auch Hunger? Wir haben Suppe, Salat und Kuchen.', 'Ja, ich habe Hunger. Ich möchte Kuchen, bitte.'],
        ruleSlug: 'verb-haben',
      },
      phonetik: { focus: 'Der Vokal ö in möchten und hören', items: ['MÖCH-te', 'HÖ-ren', 'SCHÖN'] },
      hoeren: { kind: 'dictation', lines: [4, 3] },
      sprechen: {
        readAloud: [0, 1],
        open: {
          teil: 'Sprechen Teil 3',
          promptDe: 'Bitten Sie im Café um ein Glas Wasser und reagieren Sie auf die Antwort.',
          hintWords: ['möchten', 'bitte', 'das Glas'],
          missionOrder: 7,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a11-l09',
        taskDe: 'Ana Chakiri ist im Café. Sie reserviert einen Tisch am Montag um 15 Uhr, für zwei Personen. Ihre Telefonnummer ist 0176 22 44 88. Füllen Sie die Reservierungskarte im Café aus.',
        fields: ['Name', 'Tag', 'Uhrzeit', 'Personen', 'Telefonnummer'],
        minWords: 5,
        maxWords: 40,
        sample: 'Name: Chakiri / Tag: Montag / Uhrzeit: 15 Uhr / Personen: 2 / Telefonnummer: 0176 22 44 88',
      },
      links: { listeningExercise: 2, readingOrder: 8 },
      practiceRule: { topics: ['verb-haben', 'indefinite-articles'], typedMin: 3 },
    },
    {
      nr: 10,
      id: 'a1.1-l10',
      slug: 'am-bahnhof',
      title: 'Am Bahnhof',
      situation: 'Verkehrsmittel und Reisen',
      handlungsfeld: 'Mobilität und Verkehrsmittel: eine Fahrt planen',
      canDo: [
        'Ich kann fragen, wann der Zug fährt.',
        'Ich kann nach dem Preis einer Fahrkarte fragen.',
        'Ich kann Durchsagen zu Abfahrt und Verspätung verstehen.',
        'Ich kann sagen, wohin ich fahre.',
      ],
      examTeile: ['Hören Teil 2', 'Lesen Teil 3', 'Sprechen Teil 2'],
      grammarSlugs: ['yes-no-questions', 'verb-haben', 'present-tense-regular'],
      primarySlug: 'yes-no-questions',
      minutes: 15,
      wortfeld: [
        { de: 'der Fahrer', word: 'Fahrer', article: 'der', plural: 'Fahrer', en: 'driver (m)', wordId: 'd5e2f5d9-28b2-4aa3-9669-cab0e96953ee' },
        { de: 'die Fahrerin', word: 'Fahrerin', article: 'die', plural: 'Fahrerinnen', en: 'driver (f)', wordId: '85aa0d16-8e22-481e-9e9c-67ceae66751e' },
        { de: 'Deutschland', word: 'Deutschland', article: null, plural: null, en: 'Germany', wordId: 'f59e9ed6-4c90-4792-a69d-921a73b8c103' },
        { de: 'Österreich', word: 'Österreich', article: null, plural: null, en: 'Austria', wordId: '21edee4f-dacc-4a7a-b1ea-2e8f312f7907' },
        { de: 'die Schweiz', word: 'Schweiz', article: 'die', plural: '—', en: 'Switzerland', wordId: 'c3646999-1ca7-4b5e-903a-22a68642ef26' },
        // Four more country names did not cover a Lektion called „Am Bahnhof“; the station lexis of the
        // title and of two can-dos does (DaF review, L10).
        { de: 'der Bahnhof', word: 'Bahnhof', article: 'der', plural: 'Bahnhöfe', en: 'station', wordId: '57180ebe-62ac-4b85-bc55-6f0b46319fda' },
        { de: 'die Abfahrt', word: 'Abfahrt', article: 'die', plural: 'Abfahrten', en: 'departure', wordId: 'cc687805-201f-4cda-b4b4-48a20fad82cd' },
        { de: 'die Ankunft', word: 'Ankunft', article: 'die', plural: 'Ankünfte', en: 'arrival', wordId: '7374721b-f929-4b81-943a-93dc6ba2b9a1' },
        { de: 'das Gleis', word: 'Gleis', article: 'das', plural: 'Gleise', en: 'platform, track', wordId: 'e9a722a3-d2c7-46ae-8421-d8a213451e57' },
        { de: 'das Land', word: 'Land', article: 'das', plural: 'Länder', en: 'country', wordId: 'b8ff9106-be72-426f-8be3-c0687cf75641' },
        { de: 'morgen', word: 'morgen', article: null, plural: null, en: 'tomorrow', wordId: '79c868e5-5478-4d52-a85a-653c7acf078f' },
        { de: 'umsteigen', word: 'umsteigen', article: null, plural: null, en: 'to change (trains)', wordId: '7cf99ee9-b106-4db9-954f-cb6f17eab4e9' },
        { de: 'nächste Woche', word: 'nächste Woche', article: null, plural: null, en: 'next week', wordId: 'ebad6993-2d67-4891-8abe-5b0e74091495' },
        { de: 'leider', word: 'leider', article: null, plural: null, en: 'unfortunately', wordId: 'c76140c6-0461-47e2-98da-567540a79b9c' },
        { de: 'der Zug', word: 'Zug', article: 'der', plural: 'Züge', en: 'train', wordId: '5289f923-0edf-4d16-83ae-e010a14ecad8' },
        { de: 'der Bus', word: 'Bus', article: 'der', plural: 'Busse', en: 'bus', wordId: '879f1d1d-1a84-427b-8c5d-fb15eeb67436' },
        { de: 'das Auto', word: 'Auto', article: 'das', plural: 'Autos', en: 'car', wordId: '564227da-5f73-4b01-8130-650983c5c578' },
        { de: 'die Fahrkarte', word: 'Fahrkarte', article: 'die', plural: 'Fahrkarten', en: 'ticket', wordId: 'f5fbb306-2e4a-416f-88df-30317db028f1' },
        { de: 'fahren', word: 'fahren', article: null, plural: null, en: 'to go (by vehicle), to drive', wordId: 'ed0d6e08-7781-474d-93ab-c7113738a3af' },
        // weit stood in no Wortfeld although the pool asks „___ der Bahnhof weit?“, and the
        // Durchsage can-do had no Durchsage anywhere in the course (DaF review #2, L10).
        { de: 'weit', word: 'weit', article: null, plural: null, en: 'far', wordId: 'f020024d-86c0-422d-a7a9-a23a40bf706b' },
        { de: 'die Durchsage', word: 'Durchsage', article: 'die', plural: 'Durchsagen', en: 'announcement', wordId: '92f0546c-7d08-4e28-9eed-7ced0f9112b0' },
      ],
      dialog: {
        title: 'Am Schalter',
        setting: 'Ana fragt am Bahnhof nach dem Zug.',
        lines: [
          { speaker: 'Ana', de: 'Entschuldigung, fährt der Zug nach Österreich?', en: 'Excuse me, does the train go to Austria?' },
          { speaker: 'Herr Schmidt', de: 'Ja, der Zug fährt um neun Uhr von Gleis vier.', en: 'Yes, the train leaves at nine o’clock from platform four.' },
          { speaker: 'Ana', de: 'Hat der Zug Verspätung?', en: 'Is the train delayed?' },
          { speaker: 'Herr Schmidt', de: 'Nein, er ist pünktlich.', en: 'No, it is on time.' },
          { speaker: 'Ana', de: 'Kostet die Fahrkarte zwanzig Euro?', en: 'Does the ticket cost twenty euros?' },
          { speaker: 'Herr Schmidt', de: 'Nein, sie kostet fünfzehn Euro.', en: 'No, it costs fifteen euros.' },
          { speaker: 'Ana', de: 'Fährt der Bus auch in die Schweiz? Ist der Bahnhof weit?', en: 'Does the bus go to Switzerland too? Is the station far?' },
          { speaker: 'Herr Schmidt', de: 'Nein, leider nicht. Die Abfahrt ist hier an Gleis vier.', en: 'No, unfortunately not. The departure is here on platform four.' },
          // Bahnhof, Abfahrt, Ankunft and umsteigen were Wortfeld-only, and the „Durchsagen“ can-do
          // had no announcement to understand. The announcement is read out by the man at the counter
          // rather than given its own speaker, because a dialogue has exactly two speakers
          // (scripts/validate-curriculum.mjs RULE 5). It is now the dictation line (review #2, L10, §A).
          { speaker: 'Ana', de: 'Danke! Und die Durchsage? Wann ist die Ankunft?', en: 'Thank you! And the announcement? When is the arrival?' },
          { speaker: 'Herr Schmidt', de: 'Der Zug nach Österreich hat Verspätung. Bitte umsteigen!', en: 'The train to Austria is delayed. Please change trains!' },
        ],
      },
      pretest: {
        promptDe: 'Fragen Sie, ob der Zug nach Österreich fährt.',
        promptEn: 'Ask whether the train goes to Austria.',
        model: 'Fährt der Zug nach Österreich?',
        accepted: ['Fährt', 'Geht', 'Kommt'],
      },
      notice: {
        title: 'Ja/Nein-Fragen: das Verb steht vorn',
        bodyDe: 'Bei der Ja/Nein-Frage steht das Verb auf Position 1: Der Zug fährt. → **Fährt** der Zug? Die Antwort ist **ja** oder **nein**. Die Satzmelodie steigt am Ende. **fahren** ist unregelmäßig: du fährst, er fährt.',
        examples: ['Entschuldigung, fährt der Zug nach Österreich?', 'Kostet die Fahrkarte zwanzig Euro?'],
        ruleSlug: 'yes-no-questions',
      },
      phonetik: { focus: 'Steigende Satzmelodie in der Ja/Nein-Frage', items: ['Fährt der ZUG?↗', 'Hast du ZEIT?↗', 'Kommst du MIT?↗'] },
      hoeren: { kind: 'dictation', lines: [1, 9] },
      sprechen: {
        readAloud: [0, 3],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie zum Thema Reisen: Zug? Fahrkarte? Wohin?',
          hintWords: ['fahren', 'die Fahrkarte', 'der Zug'],
          missionOrder: null,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a11-l10',
        taskDe: 'Schreiben Sie Ihrer Kollegin: Sie kommen später. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        leitpunkte: ['Warum Sie schreiben', 'Wann Sie kommen', 'Was die Kollegin bis dahin machen soll'],
        minWords: 25,
        maxWords: 45,
        sample: 'Hallo Lena! Der Zug hat Verspätung. Ich komme um zehn Uhr. Viele Grüße, Ana',
      },
      links: { listeningExercise: 3, readingOrder: 6 },
      // Only the primary topic: the two-topic rule drew haben items twice over from L9 (DaF review, L10).
      practiceRule: { topics: ['yes-no-questions'], typedMin: 4 },
    },
    {
      nr: 11,
      id: 'a1.1-l11',
      slug: 'gestern-und-heute',
      // NOT „Gestern und heute“: the title and can-do 2 promised the Perfekt, which this Lektion
      // defers to A1.2 and teaches as two fixed expressions. The Lektion is the day (review #2, L11).
      title: 'Mein Tag',
      situation: 'Gestern und heute: Tagesablauf mit aufstehen, einkaufen, anrufen',
      handlungsfeld: 'Alltag organisieren: über den Tagesablauf sprechen',
      canDo: [
        'Ich kann über meinen Tagesablauf sprechen.',
        'Ich kann mit zwei festen Ausdrücken sagen, was ich gestern gemacht habe.',
        'Ich kann eine Verabredung zum Einkaufen machen.',
        'Ich kann sagen, wann ich aufstehe und wann ich arbeite.',
      ],
      examTeile: ['Sprechen Teil 2', 'Lesen Teil 1', 'Hören Teil 3'],
      grammarSlugs: ['separable-verbs-intro', 'present-tense-regular', 'time-and-dates'],
      primarySlug: 'separable-verbs-intro',
      minutes: 15,
      wortfeld: [
        { de: 'gestern', word: 'gestern', article: null, plural: null, en: 'yesterday', wordId: '12fba7c9-bdd2-46e9-90d9-02c2ddd0bba5' },
        { de: 'letzte Woche', word: 'letzte Woche', article: null, plural: null, en: 'last week', wordId: '1f732f26-b03d-44cc-848f-368727f687d9' },
        { de: 'der Tag', word: 'Tag', article: 'der', plural: 'Tage', en: 'day', wordId: '4442348b-1623-4a81-947e-04361d4a6c1e' },
        { de: 'der Wochentag', word: 'Wochentag', article: 'der', plural: 'Wochentage', en: 'weekday', wordId: '2df94b7e-3050-431d-af30-d7617a5868ee' },
        { de: 'müde', word: 'müde', article: null, plural: null, en: 'tired', wordId: 'f1ba5ef3-a420-4d34-8598-5819dc7ffe2a' },
        { de: 'schon', word: 'schon', article: null, plural: null, en: 'already', wordId: '142081df-56c7-46ff-8e14-844d38e05201' },
        { de: 'noch nicht', word: 'noch nicht', article: null, plural: null, en: 'not yet', wordId: '177cfeb3-1b9b-4bb7-afb9-9a20c4892506' },
        // genau/klar/richtig/sicher were filler in a Lektion about the day; the four daily-routine verbs
        // below carry the can-do, and abholen/mitbringen cover the separable items the pool draws.
        // „jeden“ was a case form — a Wortfeld entry (and SRS card) must be a lemma or a chunk.
        { de: 'jeden Tag', word: 'jeden Tag', article: null, plural: null, en: 'every day', wordId: '610abd2d-3525-4505-873f-f4fb125cb388' },
        { de: 'frühstücken', word: 'frühstücken', article: null, plural: null, en: 'to have breakfast', wordId: 'f9e66eab-2823-48b2-b32f-a921fca16ad6' },
        { de: 'duschen', word: 'duschen', article: null, plural: null, en: 'to shower', wordId: '60ef548d-d7ab-4274-bd5b-ed6eea05c14e' },
        // schlafen is a Vokalwechsel verb and was taken in without the marking the course gives
        // sprechen (L3) and fahren (L7, L10); the card front carries the change (review #2, L11).
        { de: 'schlafen (er schläft)', word: 'schlafen', article: null, plural: null, en: 'to sleep (er schläft)', wordId: '70c4d24c-b501-46d9-91ab-79c4d018b786' },
        { de: 'nach Hause', word: 'nach Hause', article: null, plural: null, en: 'home (direction)', wordId: '4998446b-cfe0-4b28-8a1c-816e83aac793' },
        { de: 'abholen', word: 'abholen', article: null, plural: null, en: 'to pick up, to collect', wordId: 'b26d75f6-1c2e-4749-a6fb-d10515ed285c' },
        { de: 'mitbringen', word: 'mitbringen', article: null, plural: null, en: 'to bring along', wordId: '75574213-060f-4f93-80a9-e6764e9fdd5a' },
        { de: 'einkaufen', word: 'einkaufen', article: null, plural: null, en: 'to go shopping', wordId: '1e4c6cff-59b8-42eb-8de3-b8142d10a6d3' },
        // anrufen came over from L6, where it appeared in no line: this is the Lektion whose dialogue
        // says „Rufst du mich an?“ and whose notice takes an|rufen apart. der Kalender was unused and
        // krank moved to L8's Gesundheit Handlungsfeld (review #2, L6 and L11).
        { de: 'anrufen', word: 'anrufen', article: null, plural: null, en: 'to call (on the phone)', wordId: '29a7e95e-d41e-42b3-8fe2-84a90433082b' },
        { de: 'mitkommen', word: 'mitkommen', article: null, plural: null, en: 'to come along', wordId: '889e2bbc-c219-4f4a-8491-317ff014aa38' },
        { de: 'lernen', word: 'lernen', article: null, plural: null, en: 'to learn, to study', wordId: '962b62ac-d60f-4ecf-b501-dcbdcfd7f8e2' },
        { de: 'arbeiten', word: 'arbeiten', article: null, plural: null, en: 'to work', wordId: '10d8bc30-4f2f-4997-9205-34c8e0ed5a0a' },
      ],
      dialog: {
        title: 'Was hast du gestern gemacht?',
        setting: 'Tim und Lena am Donnerstag im Kurs.',
        lines: [
          { speaker: 'Lena', de: 'Tim, was hast du gestern gemacht?', en: 'Tim, what did you do yesterday?' },
          { speaker: 'Tim', de: 'Ich habe gearbeitet. Heute lerne ich Deutsch.', en: 'I worked. Today I am studying German.' },
          { speaker: 'Lena', de: 'Und wann stehst du morgens auf?', en: 'And when do you get up in the morning?' },
          { speaker: 'Tim', de: 'Ich stehe um sechs auf. Ich bin müde.', en: 'I get up at six. I am tired.' },
          { speaker: 'Lena', de: 'Kaufst du heute ein?', en: 'Are you going shopping today?' },
          { speaker: 'Tim', de: 'Ja, ich kaufe am Freitag ein. Kommst du mit?', en: 'Yes, I am going shopping on Friday. Are you coming along?' },
          { speaker: 'Lena', de: 'Ja, ich komme mit. Rufst du mich an?', en: 'Yes, I am coming along. Will you call me?' },
          { speaker: 'Tim', de: 'Ja, ich rufe dich an.', en: 'Yes, I will call you.' },
          // frühstücken, duschen, schlafen and mitbringen were Wortfeld-only, so the Tagesablauf
          // can-do rested on three verbs; the last line shows the schlafen vowel change (review #2, §A).
          { speaker: 'Lena', de: 'Ich dusche und frühstücke jeden Tag. Ich bringe Kuchen mit.', en: 'I shower and have breakfast every day. I bring cake along.' },
          { speaker: 'Tim', de: 'Ich schlafe am Sonntag bis neun. Mein Bruder schläft auch.', en: 'On Sunday I sleep until nine. My brother sleeps in too.' },
        ],
      },
      pretest: { promptDe: 'Sagen Sie, wann Sie aufstehen.', promptEn: 'Say when you get up.', model: 'Ich stehe um sechs Uhr auf.', accepted: ['Ich stehe um', 'Ich wache um'] },
      notice: {
        title: 'Trennbare Verben: die Satzklammer',
        bodyDe: 'Trennbare Verben teilen sich: ein|kaufen → Ich **kaufe** am Freitag **ein**. Das Verb steht auf Position 2, die Vorsilbe am Ende. So auch auf|stehen, an|rufen, mit|bringen. **Ich rufe dich an**: mich/dich lernst du als Wendung. **schlafen** wechselt den Vokal: er **schläft**. **Gemacht** und **gearbeitet** lernst du als Ganzes — das Muster dahinter (Perfekt) kommt in A1.2.',
        examples: ['Ich stehe um sechs auf. Ich bin müde.', 'Ja, ich kaufe am Freitag ein. Kommst du mit?'],
        ruleSlug: 'separable-verbs-intro',
      },
      phonetik: { focus: 'Betonung auf der trennbaren Vorsilbe', items: ['AUF-stehen', 'EIN-kaufen', 'AN-rufen'] },
      hoeren: { kind: 'dictation', lines: [3, 7] },
      sprechen: {
        readAloud: [5, 6],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie zum Thema Tagesablauf: aufstehen? arbeiten? einkaufen?',
          hintWords: ['aufstehen', 'einkaufen', 'gestern'],
          missionOrder: null,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a11-l11',
        taskDe: 'Tim Berger steht jeden Tag früh auf. Sein Kurs ist am Donnerstag von 9 Uhr bis 12 Uhr, in Zimmer 4. Füllen Sie den Wochenplan für den Kurs aus.',
        fields: ['Name', 'Tag', 'Kurs von', 'Kurs bis', 'Zimmer'],
        minWords: 5,
        maxWords: 40,
        sample: 'Name: Tim Berger / Tag: Donnerstag / Kurs von: 9 Uhr / Kurs bis: 12 Uhr / Zimmer: 4',
      },
      // A1.1 has six listening exercises and all six are linked elsewhere; reading 5 was the last
      // unlinked text and belongs here (DaF review, L11).
      links: { listeningExercise: null, readingOrder: 5 },
      practiceRule: { topics: ['separable-verbs-intro', 'present-tense-regular'], typedMin: 3 },
    },
    {
      nr: 12,
      id: 'a1.1-l12',
      slug: 'feste-feiern',
      title: 'Feste feiern',
      situation: 'Feste und Vergangenes (Chunks) und Wiederholung',
      handlungsfeld: 'Freizeit und soziale Kontakte: einladen und feiern',
      canDo: [
        'Ich kann jemanden zu einem Fest einladen.',
        'Ich kann sagen, in welchem Monat ich Geburtstag habe.',
        'Ich kann über meine Familie und meine Gäste sprechen.',
        'Ich kann mich verabschieden und gute Wünsche aussprechen.',
      ],
      examTeile: ['Lesen Teil 3', 'Sprechen Teil 3', 'Schreiben Teil 2'],
      grammarSlugs: ['possessive-articles', 'verb-sein', 'verb-haben'],
      primarySlug: 'possessive-articles',
      minutes: 15,
      wortfeld: [
        { de: 'der Geburtstag', word: 'Geburtstag', article: 'der', plural: 'Geburtstage', en: 'birthday', wordId: 'c34d4cef-643f-42e3-9d9a-8c3bfcc45f36' },
        { de: 'das Datum', word: 'Datum', article: 'das', plural: 'Daten', en: 'date', wordId: '3efd1d54-db2c-4bf9-beb9-eb4d8a6decd1' },
        { de: 'das Alter', word: 'Alter', article: 'das', plural: '—', en: 'age', wordId: '6276c62c-9009-4716-880a-410bdb5c9102' },
        { de: 'die Mama', word: 'Mama', article: 'die', plural: 'Mamas', en: 'mom', wordId: '1b7ca804-8c61-43cd-b9cf-7f54ff536ff1' },
        { de: 'der Papa', word: 'Papa', article: 'der', plural: 'Papas', en: 'dad', wordId: 'd4facfd1-4d57-4414-a526-a67b2b4a3c43' },
        // Ehefrau/Ehemann doubled Mann/Frau from L3 and Zwilling is not in the A1 Wortliste. The months
        // are the level's one real gap: no month name appeared anywhere in the 12 Lektionen, while the
        // Geburtstag can-do and SD1 Sprechen Teil 1 need them. They are taught as ONE set (DaF review, L12).
        { de: 'der Monat', word: 'Monat', article: 'der', plural: 'Monate', en: 'month', wordId: 'fe8915e4-c42f-4fb9-bd35-639a491eef18' },
        // „die Monate: Januar bis Dezember“ was a set pretending to be a lemma: as an SRS card it had
        // no front and no back, and its article and plural fitted neither. The Lektion needs ONE month
        // in the input (the birthday line) and the word Monat itself; both are real entries now.
        // „die Gäste“ was a plural posing as a lemma, like the „jeden“ the first review removed.
        { de: 'im Mai', word: 'im Mai', article: null, plural: null, en: 'in May', wordId: 'd5eb5241-106d-46ac-b183-4d95379e5598' },
        { de: 'der Gast', word: 'Gast', article: 'der', plural: 'Gäste', en: 'guest', wordId: '4a663325-9b26-4f8b-9ea6-a8514af6f281' },
        // The plural lives in a CHUNK, which is what the can-do and the Leitpunkt actually say —
        // „die Gäste“ alone was a form, not a word (review #2, L12).
        { de: 'Gäste einladen', word: 'Gäste einladen', article: null, plural: null, en: 'to invite the guests', wordId: '42bcadbd-1fd1-499a-9e29-a4e6678ec7b6' },
        { de: 'die Karte', word: 'Karte', article: 'die', plural: 'Karten', en: 'card', wordId: '824eaef7-c358-42e7-b369-1d4ed5697e31' },
        { de: 'schön', word: 'schön', article: null, plural: null, en: 'beautiful, nice', wordId: '312cc6ce-56a2-4d77-b23c-509dbabfcf02' },
        // bestimmt moved here from L7, where it appeared in no line; line 8 of this dialogue uses it.
        { de: 'bestimmt', word: 'bestimmt', article: null, plural: null, en: 'definitely, surely', wordId: 'b57550d1-a0f3-43a2-a257-2c4f3fa972d7' },
        { de: 'das Zuhause', word: 'Zuhause', article: 'das', plural: '—', en: 'home', wordId: 'b09adebf-9767-4079-b1ee-b639aec4a733' },
        { de: 'lieben', word: 'lieben', article: null, plural: null, en: 'to love', wordId: 'efd42d40-ceaa-4105-92cb-7b0896a39892' },
        { de: 'grüßen', word: 'grüßen', article: null, plural: null, en: 'to greet', wordId: '2b0cba13-bfdd-4f08-82d7-f9b2ea8b6488' },
        { de: 'Bis bald', word: 'Bis bald', article: null, plural: null, en: 'See you soon', wordId: '3c54e79d-d20b-40c5-bdc4-9929ba9521c6' },
        { de: 'Bis später', word: 'Bis später', article: null, plural: null, en: 'See you later', wordId: 'ce5e11f5-b263-4d6f-b381-a190493db09a' },
        { de: 'Schönen Tag noch', word: 'Schönen Tag noch', article: null, plural: null, en: 'Have a nice day', wordId: 'efd72cd3-8751-42d1-abc4-be324bbbebd3' },
        { de: 'Mach\'s gut', word: 'Mach\'s gut', article: null, plural: null, en: 'Take care', wordId: '8751ef96-cac1-43ae-9e11-1dfba1e32d41' },
        { de: 'das Fest', word: 'Fest', article: 'das', plural: 'Feste', en: 'celebration, festival', wordId: 'cd714bdb-4432-4c0c-b417-08824885c3c8' },
        { de: 'die Party', word: 'Party', article: 'die', plural: 'Partys', en: 'party', wordId: '4d67daf5-8c9f-4931-bdbd-857d09e925f4' },
        { de: 'feiern', word: 'feiern', article: null, plural: null, en: 'to celebrate', wordId: '1641c0f4-e043-43fc-b93d-69592716ccc4' },
        { de: 'das Geschenk', word: 'Geschenk', article: 'das', plural: 'Geschenke', en: 'present, gift', wordId: '8206f9ba-5d31-4ac0-92ac-01c85ac75d73' },
        { de: 'einladen', word: 'einladen', article: null, plural: null, en: 'to invite', wordId: 'f04aa1b7-09db-49b6-b23b-deb6d9d8c791' },
      ],
      dialog: {
        title: 'Eine Einladung',
        setting: 'Lena und Ana planen Anas Geburtstag.',
        lines: [
          { speaker: 'Lena', de: 'Ana, wann ist dein Geburtstag?', en: 'Ana, when is your birthday?' },
          // A birthday is a DATE, not a weekday: „Mein Geburtstag ist am Freitag“ says the party is on
          // Friday, and can-do 2 („in welchem Monat“) was covered by no sentence at all. The month is
          // in the dialogue, the dictation line, the pretest model and the pool now (review #2, L12).
          { speaker: 'Ana', de: 'Mein Geburtstag ist im Mai. Wir feiern am Freitag.', en: 'My birthday is in May. We celebrate on Friday.' },
          { speaker: 'Lena', de: 'Mai ist ein schöner Monat! Kommt deine Mama auch?', en: 'May is a lovely month! Is your mum coming too?' },
          { speaker: 'Ana', de: 'Ja, meine Mama und mein Papa kommen.', en: 'Yes, my mum and my dad are coming.' },
          { speaker: 'Lena', de: 'Und dein Bruder? Kommt seine Frau auch?', en: 'And your brother? Is his wife coming too?' },
          { speaker: 'Ana', de: 'Ja. Ich lade auch meine Kollegin ein.', en: 'Yes. I am inviting my colleague too.' },
          { speaker: 'Lena', de: 'Was möchtest du zum Geburtstag?', en: 'What would you like for your birthday?' },
          { speaker: 'Ana', de: 'Vielleicht ein Buch. Mein Bruder kauft das Geschenk.', en: 'Maybe a book. My brother is buying the present.' },
          { speaker: 'Lena', de: 'Deine Party ist bestimmt schön!', en: 'Your party is sure to be lovely!' },
          { speaker: 'Ana', de: 'Ja! Mach\'s gut, Lena. Bis bald!', en: 'Yes! Take care, Lena. See you soon!' },
        ],
      },
      pretest: {
        promptDe: 'Sagen Sie, in welchem Monat Sie Geburtstag haben.',
        promptEn: 'Say in which month your birthday is.',
        model: 'Mein Geburtstag ist im Mai.',
        accepted: ['Mein Geburtstag ist im', 'Ich habe im', 'Im'],
      },
      notice: {
        title: 'mein, dein, sein, ihr – Possessivartikel',
        bodyDe: 'Der Possessivartikel zeigt, wem etwas gehört: **mein** Geschenk, **dein** Bruder, **sein** Handy (er), **ihr** Buch (sie), **Ihr** Büro (Sie, höflich — immer groß!). Vor femininen Nomen und im Plural kommt **-e** dazu: **meine** Mama. Für Gruppen: **unser** Fest (wir), **euer** Fest (ihr) — vor die-Wörtern **unsere**, **eure**.',
        examples: ['Ana, wann ist dein Geburtstag?', 'Und dein Bruder? Kommt seine Frau auch?'],
        ruleSlug: 'possessive-articles',
      },
      phonetik: { focus: 'Der Diphthong ei in mein und dein', items: ['MEIN', 'DEIN', 'ZWEI'] },
      hoeren: { kind: 'dictation', lines: [1, 3] },
      sprechen: {
        readAloud: [0, 5],
        open: {
          // Teil 1 is „sich vorstellen“ over Stichwortkarten; formulating an invitation is Teil 3.
          teil: 'Sprechen Teil 3',
          promptDe: 'Laden Sie eine Kollegin zu Ihrem Fest ein und reagieren Sie auf die Antwort.',
          hintWords: ['einladen', 'der Geburtstag', 'feiern'],
          missionOrder: null,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a11-l12',
        taskDe: 'Schreiben Sie eine Einladung zu Ihrem Geburtstag. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        leitpunkte: ['Warum Sie feiern', 'Tag und Uhrzeit', 'Was die Gäste mitbringen sollen'],
        minWords: 25,
        maxWords: 45,
        sample: 'Hallo Lena! Ich feiere am Freitag meinen Geburtstag. Komm um acht Uhr! Bis bald, Ana',
      },
      links: { listeningExercise: null, readingOrder: 10 },
      // „Wiederholung“ has to be visible in the practice: the last Lektion before checkpoint 4 mixes
      // all three of its slugs. time-and-dates would belong here too, but grammarSlugs is capped at 3.
      practiceRule: { topics: ['possessive-articles', 'verb-sein', 'verb-haben'], typedMin: 4 },
    },
  ],
  checkpoints: [
    { nr: 1, id: 'a1.1-cp1', afterLektion: 3, title: 'Checkpoint 1: Lektion 1–3' },
    { nr: 2, id: 'a1.1-cp2', afterLektion: 6, title: 'Checkpoint 2: Lektion 4–6' },
    { nr: 3, id: 'a1.1-cp3', afterLektion: 9, title: 'Checkpoint 3: Lektion 7–9' },
    { nr: 4, id: 'a1.1-cp4', afterLektion: 12, title: 'Checkpoint 4: Lektion 10–12' },
  ],
};
