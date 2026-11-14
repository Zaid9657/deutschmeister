import { ALPHABET, DIGITS, PRICE_FOUNDATIONS, PRICE_COMPOUNDS, FULL_HOUR, AGE_TWENTY, letterName } from './a11.sets.js';

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
// NATIONALITY HAS TWO SHAPES AND THE COURSE MUST NOT MIX THEM (round 17, DaF review #16,
// BLOCKER). In a form field a nationality is an ADJECTIVE („Staatsangehörigkeit: marokkanisch“);
// in a sentence about a person it is a NOUN („Ich bin Marokkanerin.“, „Er ist Marokkaner.“).
// Predicative „Ich bin marokkanisch.“ is not German — `deutsch` is the one exception, and it is
// an exception. A STAATSANGEHÖRIGKEIT IS AN ADJECTIVE ON THE FORM AND A NOUN IN THE SENTENCE:
// WHOEVER TURNS THE FORM VALUE INTO A SENTENCE TEACHES A MISTAKE THE LEARNER KEEPS FOR YEARS.
// RULE 24 in scripts/validate-curriculum.mjs enforces it as a form, over every production surface
// of the level, at a hard 0.
//
// REGISTER. du between learners (Ana, Tim, Lena), Sie with staff and neighbours (Frau Kaya,
// Herr Weber, Herr Schmidt, Paul). No outcome promises and no exam fees anywhere in this file.

/**
 * The learners' roles. A scored read-aloud line is always one of theirs: the learner speaks their own
 * part and hears and types the staff's (dictation). L1, L2, L4, L9 and L10 used to score the
 * receptionist's, clerk's, seller's, waiter's and station staff's lines (Codex review, 2026-10-09).
 * tests/course-value.test.mjs holds every Lektion to it.
 */
export const LEARNER_CAST = ['Ana', 'Tim', 'Lena'];

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

/**
 * Proper nouns and titles that may appear in a dialogue line (people, places, forms of address).
 *
 * THIS LIST IS COUPLED TO A1.2, AND THE PAUSE DOES NOT KNOW IT (DaF review #18, Minor 22). A1.2's
 * `DIALOG_NAMES` is `[...DIALOG_NAMES_A11, 'Fischer']` (`a12.js`) — by design for the CAST (Ana,
 * Tim, Lena … recur, and RULE 14 holds their facts across both levels through `PERSONAS_A12`
 * spreading `PERSONAS_A11`), but the coupling carries every name this level adds for its own
 * reasons into A1.2's name set too. Measured in round 18: `Marokko` and `Ali` entered here for L2,
 * and A1.2's RULE 11b ratchet moved 14 → 13 without an A1.2 file being touched, because a token
 * that is a name is not an untaught word. Decoupling means splitting this list into the shared cast
 * and a level-local remainder and having `a12.js` import only the cast — and `a12.js` is a PAUSED
 * draft by owner decision (2026-09-13) that no round may edit. So the coupling stays, written down
 * here and at the `LEVELS` registry of `scripts/validate-curriculum.mjs`: an addition to this list
 * is an addition to A1.2's name set, and whoever re-measures A1.2's ratchets after one must say so.
 * `tests/curricula.test.mjs` pins the direction of the coupling (A1.2 ⊇ A1.1), so the day it is
 * broken the note is removed with the test, not silently outlived.
 */
export const DIALOG_NAMES = [
  'Ana', 'Tim', 'Lena', 'Paul', 'Herr', 'Frau', 'Weber', 'Kaya', 'Wolf', 'Schmidt', 'Berg',
  'Chakiri', 'Brandt', 'Berger', 'Bremen', 'Thomas',
  // `Ali` is the masculine counterpart of Ana in the L2 notice („Ali ist Marokkaner.“), on the
  // `verb-sein` card and in `extra-a11-l02-16` (round 18, DaF review #17, MAJOR 2): the nationality
  // noun has two forms, the course lists Student/Studentin as a pair, and until round 18 it taught
  // only the feminine one. A name is not lexis; he has no row in PERSONAS_A11, so no fact about him
  // can be contradicted — he exists to carry the masculine form and nothing else.
  'Ali',
  // Place names a dialogue line or a practice item may use. A city is a proper noun, not lexis the
  // course has to teach first — but it must be listed here, or RULE 11 reports it as an untaught
  // word (DaF review #4, „wortfeldCoverage()/itemLexis()“).
  'Berlin', 'Köln', 'Deutschland', 'Österreich', 'Italien', 'Polen', 'Spanien',
  // `Marokko` is Ana's country (PERSONAS_A11) and, since round 18, a line of the L2 dialogue
  // („Ich komme aus Marokko und wohne in Bremen.“). RULE 5 licenses a dialogue token from the
  // Wortfeld, the function words and THIS list only — the notice does not count there — and a
  // country name is a proper noun like Italien or Polen two entries up, not lexis to teach.
  'Marokko',
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
      flow: 'guided',
      guided: {
        sets: [ALPHABET],
        read: {
          titleDe: 'Willkommen!', titleEn: 'Welcome!',
          instructionDe: 'Lesen Sie die Karte. Tippen Sie auf ein Wort für seine Bedeutung.',
          instructionEn: 'Read the card. Tap a word for its meaning.',
          // A welcome card at reception: greetings for the day and useful phrases.
          text: 'Hallo und willkommen!\nGuten Morgen! Guten Tag! Guten Abend! Gute Nacht!\n„Guten Tag“ ist ein Gruß.\nIch heiße Ana. – Freut mich!\nEntschuldigung, wie heißen Sie?\nWie geht es dir? – Mir geht es gut, danke.\nBuchstabieren Sie bitte Ana: A-N-A. A ist ein Buchstabe.',
          questions: [
            {
              promptDe: 'Was ist „Guten Tag“? Wählen Sie die Bedeutung.',
              promptEn: 'What is “Guten Tag”? Choose the meaning.',
              options: ['A greeting.', 'A letter.', 'A name.'], answer: 'A greeting.',
              explanationDe: 'Auf der Karte steht: „Guten Tag“ ist ein Gruß.',
              explanationEn: 'The card says that “Guten Tag” is a greeting.',
            },
            {
              promptDe: 'Was ist A? Wählen Sie die Bedeutung.',
              promptEn: 'What is A? Choose the meaning.',
              options: ['A farewell.', 'A letter.', 'A greeting.'], answer: 'A letter.',
              explanationDe: 'Auf der Karte steht: A ist ein Buchstabe.',
              explanationEn: 'The card says that A is a letter.',
            },
          ],
        },
        // Half-open boundaries: every original line appears once, in order.
        chunks: [
          {
            from: 0, to: 2,
            meaning: {
              promptDe: 'Was sagt Ana? Wählen Sie die Bedeutung.',
              promptEn: 'What does Ana say? Choose the meaning.',
              options: ['She greets Frau Kaya and gives her name.', 'She asks for a room.', 'She says goodbye.'],
              answer: 'She greets Frau Kaya and gives her name.',
            },
            say: { line: 1, ownName: 'full' },
          },
          {
            from: 2, to: 5,
            meaning: {
              promptDe: 'Was möchte Frau Kaya? Wählen Sie die Bedeutung.',
              promptEn: 'What does Frau Kaya want? Choose the meaning.',
              options: ['She wants to know where Ana lives.', 'She asks Ana to spell her name.', 'She asks how Ana feels.'],
              answer: 'She asks Ana to spell her name.',
            },
            say: { line: 3, ownName: 'surname' },
          },
          {
            from: 5, to: 8,
            meaning: {
              promptDe: 'Wie geht es Ana? Wählen Sie die Bedeutung.',
              promptEn: 'How does Ana feel? Choose the meaning.',
              options: ['She is tired.', 'She is leaving tomorrow.', 'She is fine and says thank you.'],
              answer: 'She is fine and says thank you.',
            },
            say: { line: 7 },
          },
          {
            from: 8, to: 10,
            meaning: {
              promptDe: 'Was sagt Ana zum Abschied? Wählen Sie die Bedeutung.',
              promptEn: 'What does Ana say as she leaves? Choose the meaning.',
              options: ['Bye! See you tomorrow.', 'Good morning!', 'Nice to meet you.'],
              answer: 'Bye! See you tomorrow.',
            },
            say: { line: 9 },
          },
        ],
      },
      nextHook: {
        de: 'Morgen muss Ana sich im Bürgerbüro anmelden. Kann sie das Formular ausfüllen?',
        en: 'Tomorrow Ana has to register at the public office. Can she fill in the form?',
      },
      title: 'Hallo, ich bin …',
      situation: 'Begrüßung, Vorstellen und das Alphabet',
      handlungsfeld: 'Kontakte knüpfen: sich begrüßen und vorstellen',
      canDo: [
        // The line used to name its own topic in two words the Lektion never uses — `begrüßen` and
        // `verabschieden` occur in no dialogue line, no item and no prompt, so RULE 12 reported it
        // (DaF review #7). It now quotes the two chunks the Lektion actually teaches and that
        // `extra-a11-l01-09`/`-10` make the learner produce.
        'Ich kann jemanden mit „Guten Tag“ begrüßen und mich mit „Auf Wiedersehen“ verabschieden.',
        'Ich kann sagen, wie ich heiße.',
        'Ich kann meinen Namen buchstabieren.',
        // ROUND 17 (DaF review #16, MAJOR 3 / RULE 12, now split at „ und “): the second half said
        // „darauf antworten“, whose only content word is `darauf`. It now quotes the answer chunk the
        // Lektion drills, exactly as the first line of this list already does.
        // The chunk L1 actually drills (round 18, DaF review #17, Minor 16): dialogue line 8 says
        // „Mir geht es gut, danke.“ and the Wortfeld row is „Mir geht es gut“. Round 17 wrote
        // „Danke, gut“ here, which no surface of the Lektion contains — RULE 12 was green only
        // because `danke` and `gut` occur separately. A can-do quotes what the learner rehearsed.
        'Ich kann fragen, wie es jemandem geht, und mit „Mir geht es gut, danke“ antworten.',
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
        { de: 'Gute Nacht', exampleDe: 'Gute Nacht, Ana!', word: 'Gute Nacht', article: null, plural: null, en: 'Good night', wordId: '5f4171f4-0b78-4999-893c-dc4b11886b40' },
        { de: 'Tschüss', word: 'Tschüss', article: null, plural: null, en: 'Bye', wordId: '55ba3391-5b13-486d-ab68-3beb023c70df' },
        { de: 'Auf Wiedersehen', word: 'Auf Wiedersehen', article: null, plural: null, en: 'Goodbye', wordId: 'f1f59c8b-8842-49da-b10a-9e154f6de7e2' },
        { de: 'Bis morgen', word: 'Bis morgen', article: null, plural: null, en: 'See you tomorrow', wordId: '28a1c448-c9c1-4796-aab1-9f417c26df94' },
        { de: 'Danke', word: 'Danke', article: null, plural: null, en: 'Thank you', wordId: 'ec26881d-ea91-41dc-8da4-6efc3dc04222' },
        { de: 'Bitte', word: 'Bitte', article: null, plural: null, en: 'Please / You\'re welcome', wordId: '501d7595-03fc-4696-a141-677e345df16d' },
        { de: 'Entschuldigung', exampleDe: 'Entschuldigung, wie heißen Sie?', word: 'Entschuldigung', article: null, plural: null, en: 'Excuse me / Sorry', wordId: '8db3b3da-db54-4372-970e-bff5e8111b5f' },
        { de: 'Freut mich', exampleDe: 'Ich heiße Ana. – Freut mich!', word: 'Freut mich', article: null, plural: null, en: 'Nice to meet you', wordId: '9e09ab43-124d-42df-8b7d-38db7d8692d7' },
        { de: 'Willkommen', word: 'Willkommen', article: null, plural: null, en: 'Welcome', wordId: 'aae696c2-6d27-4aa7-8832-f618e2d160b1' },
        { de: 'Wie geht es dir?', word: 'Wie geht es dir?', article: null, plural: null, en: 'How are you? (informal)', wordId: '41dd2800-884a-440c-91b4-e771ebb03a35' },
        { de: 'Wie geht es Ihnen?', word: 'Wie geht es Ihnen?', article: null, plural: null, en: 'How are you? (formal)', wordId: '079b8258-5044-42cd-85d6-9b51e12b55c7' },
        { de: 'Mir geht es gut', word: 'Mir geht es gut', article: null, plural: null, en: 'I\'m fine', wordId: '2b299a38-0052-4469-aaeb-d19292f4679b' },
        { de: 'der Gruß', exampleDe: '„Guten Tag“ ist ein Gruß.', word: 'Gruß', article: 'der', plural: 'Grüße', en: 'greeting', wordId: 'e3b63654-5c07-412f-b209-1ea0ec0d140a' },
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
          { speaker: 'Frau Kaya', de: 'Auf Wiedersehen, Frau Chakiri.', en: 'Goodbye, Ms Chakiri.' },
          { speaker: 'Ana', de: 'Tschüss! Bis morgen.', en: 'Bye! See you tomorrow.' },
        ],
      },
      proof: {
        tasks: [
          {
            canDo: 0, type: 'production',
            promptDe: 'Frau Kaya: „Hallo!“ – Sie: … Frau Kaya: „Tschüss!“ – Sie: …',
            promptEn: 'Ms Kaya greets you, then says goodbye. Greet her and say goodbye formally, in that order.',
            answer: 'Guten Tag. Auf Wiedersehen.', register: 'formal',
            parts: [
              { label: { de: 'der Gruß', en: 'the greeting' }, forms: ['Guten Tag.', 'Guten Morgen.', 'Guten Abend.', 'Guten Tag und willkommen!'] },
              { label: { de: 'der Abschied', en: 'the goodbye' }, forms: ['Auf Wiedersehen.'] },
            ],
            reteach: { kind: 'dialog', indices: [0, 8] },
          },
          {
            canDo: 1, type: 'production', ownName: 'full', openings: ['Ich heiße'],
            promptDe: 'Frau Kaya: „Wie heißen Sie?“',
            promptEn: 'Ms Kaya asks your name. Introduce yourself with your own name.',
            answer: 'Ich heiße Ana Chakiri.',
            parts: [{ label: { de: 'der Name', en: 'the name' }, forms: ['Ich heiße Ana Chakiri.'] }],
            reteach: { kind: 'dialog', indices: [1] },
          },
          {
            canDo: 2, type: 'listen_spelling', listenSpelling: true, listenFrom: { kind: 'dialog', index: 3 }, ownName: 'surname',
            promptDe: 'Frau Kaya: „Wie buchstabiert man das?“ – Sie: …',
            promptEn: 'Listen to the name spelled letter by letter and write the name. With a scored microphone, you may instead spell your own surname aloud.',
            answer: 'C-H-A-K-I-R-I.',
            parts: [{ label: { de: 'die Buchstaben', en: 'the letters' }, forms: ['C-H-A-K-I-R-I.'] }],
            reteach: { kind: 'dialog', indices: [2, 3] },
          },
          {
            canDo: 3, type: 'production',
            promptDe: 'Frau Kaya: „Guten Tag!“ – Sie: …? Frau Kaya: „Gut, danke. Und Ihnen?“ – Sie: …',
            promptEn: 'Ask Ms Kaya how she is. She says she is well and asks about you. Tell her you are well, with thanks.',
            answer: 'Wie geht es Ihnen? Mir geht es gut, danke.', register: 'formal',
            parts: [
              { label: { de: 'die Frage', en: 'the question' }, forms: ['Wie geht es Ihnen?'] },
              { label: { de: 'die Antwort', en: 'the answer' }, forms: ['Mir geht es gut, danke.', 'Gut, danke.', 'Mir geht es gut.'] },
            ],
            reteach: { kind: 'dialog', indices: [6, 7] },
          },
        ],
      },
      pretest: {
        promptDe: 'Wie heißen Sie? Antworten Sie mit einem Satz.',
        promptEn: 'Say your name in one sentence.',
        model: 'Ich heiße Ana.',
        accepted: ['Ich heiße', 'Ich bin', 'Mein Name ist', 'Hallo', 'Guten Tag'],
        // The very first encounter: an A0 beginner has nothing to retrieve yet, so L1 shows and plays
        // the model first, the learner writes it with their own name, then once more unaided (Codex
        // learner-value review, 2026-10-09). Every later Lektion keeps the retrieval-first pretest.
        modelFirst: { openings: ['Ich heiße', 'Ich bin', 'Mein Name ist'] },
      },
      notice: {
        title: 'Das Alphabet: buchstabieren',
        bodyDe: `Beim Buchstabieren sagt man jeden Buchstaben einzeln. Vorsicht bei drei Paaren: **E** [eː] und **I** [iː], **G** [geː] und **J** (${letterName('J')}), **V** (${letterName('V')}) und **W** (${letterName('W')} [veː]). Der Name ist nicht der Laut: In *Wasser* hört man [v]. **Y** heißt ${letterName('Y')}, **Z** heißt ${letterName('Z')}, **ß** heißt ${letterName('ß')} oder scharfes S. Im Zweifel fragt man: **Wie buchstabiert man das?**`,
        bodyEn: `You spell a word letter by letter, saying each German letter name. Easy to mix up: **E** [eː] and **I** [iː]; **G** [geː] and **J** (**${letterName('J')}**); **V** (**${letterName('V')}**) and **W** (**${letterName('W')}** [veː]). A letter’s name is not its sound: W is called **${letterName('W')}**, but in *Wasser* it sounds [v]. **Y** is **${letterName('Y')}**, **Z** is **${letterName('Z')}**, **ß** is **${letterName('ß')}**. To ask how a word is written: **Wie buchstabiert man das?**`,
        examples: ['Buchstabieren Sie bitte Chakiri.', 'Danke. Und wie buchstabiert man Ana?'],
        ruleSlug: 'alphabet-pronunciation',
      },
      phonetik: { focus: 'Wortakzent auf der ersten Silbe', focusEn: 'Word stress on the first syllable', items: ['HAL-lo', 'DAN-ke', 'A-na'] },
      // Not line 1: from the audio alone nobody can tell Ana from Anna or Chakiri from
      // Tschakiri — a dictation tests the ear, not the spelling of a name (2026-10 review).
      hoeren: { kind: 'dictation', lines: [0, 6] },
      sprechen: {
        readAloud: [7, 9],
        open: {
          teil: 'Sprechen Teil 1',
          promptDe: 'Stellen Sie sich vor: Name und Vorname. Buchstabieren Sie Ihren Namen.',
          promptEn: 'Introduce yourself: first name and surname. Then spell your name.',
          hintWords: ['heißen', 'buchstabieren', 'Guten Tag'],
          // Sie — Sprechen Teil 1 vor Prüfenden und fremden Mitkandidaten.
          anrede: 'Sie',
          missionOrder: 1,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a11-l01',
        // SD1 Schreiben Teil 1 is a TRANSFER task: the learner reads a short text about a person and
        // copies that person's data into the form. The six course Formulare had no source text, so
        // evaluate-writing.mjs had no correctness criterion. The bank carries the text (review #2, L1).
        taskDe: 'Ana Chakiri kommt aus Marokko. Sie spricht Arabisch. Füllen Sie das Anmeldeformular im Hostel für Ana aus.',
        taskEn: 'Ana Chakiri comes from Morocco. She speaks Arabic. Fill in the hostel registration form for Ana (surname, first name, country, language, signature).',
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
      flow: 'guided',
      proof: {
        "tasks": [
          {
            "canDo": 0,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Ihr Formular: Ana Chakiri, Marokko, Studentin. Herr Weber: „Woher kommen Sie? Und was sind Sie von Beruf?“ – Sie: …",
            "promptEn": "You are Ana at the public office. Your form says: Ana Chakiri, Morocco, student. Mr Weber asks where you come from and what your job is. Answer both questions.",
            "answer": "Ich komme aus Marokko. Ich bin Studentin.",
            "parts": [
              {
                "label": {
                  "de": "die Herkunft (nicht nur das Wort aus dem Formular)",
                  "en": "where you come from (not just the word from the form)"
                },
                "forms": [
                  "Ich komme aus Marokko.",
                  "Ich bin aus Marokko.",
                  "Aus Marokko.",
                  "Ich komme aus Marokko und wohne in Bremen.",
                  "Ich komme aus Marokko und bin Marokkanerin.",
                  "Ich bin Marokkanerin."
                ]
              },
              {
                "label": {
                  "de": "der Beruf (ganzer Satz)",
                  "en": "your job (a full sentence)"
                },
                "forms": [
                  "Ich bin Studentin.",
                  "Ich bin von Beruf Studentin.",
                  "Ich bin Studentin von Beruf.",
                  "Von Beruf bin ich Studentin.",
                  "und bin Studentin.",
                  "und ich bin Studentin."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                5,
                7
              ]
            },
            "micOff": true,
            "order": "any",
            "context": [
              "Ich heiße Ana.",
              "Mein Nachname ist Chakiri."
            ]
          },
          {
            "canDo": 1,
            "type": "production",
            "promptDe": "Antworten Sie mit einem Satz. Im Amt. Eine Frau: „Ich komme auch aus Marokko und wohne in Bremen.“ – Sie: …? Die Frau: „Ich bin Lehrerin.“",
            "promptEn": "At the public office you talk to a woman you do not know. She tells you that she is from Morocco too and lives in Bremen. Ask her formally what her job is, so that her answer fits.",
            "answer": "Was sind Sie von Beruf?",
            "register": "formal",
            "parts": [
              {
                "label": {
                  "de": "die Frage nach dem Beruf",
                  "en": "the question about her job"
                },
                "forms": [
                  "Was sind Sie von Beruf?",
                  "Und was sind Sie von Beruf?",
                  "Entschuldigung, was sind Sie von Beruf?",
                  "Was ist Ihr Beruf?",
                  "Und was ist Ihr Beruf?",
                  "Entschuldigung, was ist Ihr Beruf?"
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                6
              ]
            },
            "micOff": true
          },
          {
            "canDo": 2,
            "type": "listening",
            "promptDe": "Ihr Formular: Telefonnummer 4 9 2 3 5 8. Herr Weber: …? Hören Sie. Antworten Sie. Schreiben Sie die Telefonnummer: Zahl für Zahl, ein Wort.",
            "promptEn": "Your form says 4 9 2 3 5 8. Listen to Mr Weber. Is his number right? Answer yes or no, then give the whole correct number, every digit as a German word.",
            "answer": "Nein. Vier neun zwei drei fünf acht.",
            "reteach": {
              "kind": "dialog",
              "indices": [
                9
              ]
            },
            "micOff": true,
            "mode": "parts",
            "instances": [
              {
                "audioText": "Ist Ihre Telefonnummer vier neun zwei drei acht fünf?",
                "answer": "Nein. Vier neun zwei drei fünf acht.",
                "parts": [
                  {
                    "label": {
                      "de": "die Antwort auf die Frage von Herrn Weber",
                      "en": "your answer to Mr Weber’s question"
                    },
                    "forms": [
                      "Nein."
                    ]
                  },
                  {
                    "label": {
                      "de": "die ganze Telefonnummer, jede Zahl als Wort",
                      "en": "the whole phone number, every number as a word"
                    },
                    "forms": [
                      "Vier neun zwei drei fünf acht.",
                      "Vier-neun-zwei-drei-fünf-acht.",
                      "Meine Telefonnummer ist vier neun zwei drei fünf acht.",
                      "Meine Telefonnummer ist vier-neun-zwei-drei-fünf-acht.",
                      "Die Telefonnummer ist vier neun zwei drei fünf acht.",
                      "Sie ist vier neun zwei drei fünf acht."
                    ]
                  }
                ]
              },
              {
                "audioText": "Ist Ihre Telefonnummer vier neun zwei drei fünf acht?",
                "answer": "Ja. Vier neun zwei drei fünf acht.",
                "parts": [
                  {
                    "label": {
                      "de": "die Antwort auf die Frage von Herrn Weber",
                      "en": "your answer to Mr Weber’s question"
                    },
                    "forms": [
                      "Ja."
                    ]
                  },
                  {
                    "label": {
                      "de": "die ganze Telefonnummer, jede Zahl als Wort",
                      "en": "the whole phone number, every number as a word"
                    },
                    "forms": [
                      "Vier neun zwei drei fünf acht.",
                      "Vier-neun-zwei-drei-fünf-acht.",
                      "Meine Telefonnummer ist vier neun zwei drei fünf acht.",
                      "Meine Telefonnummer ist vier-neun-zwei-drei-fünf-acht.",
                      "Die Telefonnummer ist vier neun zwei drei fünf acht.",
                      "Sie ist vier neun zwei drei fünf acht."
                    ]
                  }
                ]
              }
            ],
            "parts": [
              {
                "label": {
                  "de": "die Antwort auf die Frage von Herrn Weber",
                  "en": "your answer to Mr Weber’s question"
                },
                "forms": [
                  "Nein."
                ]
              },
              {
                "label": {
                  "de": "die ganze Telefonnummer, jede Zahl als Wort",
                  "en": "the whole phone number, every number as a word"
                },
                "forms": [
                  "Vier neun zwei drei fünf acht.",
                  "Vier-neun-zwei-drei-fünf-acht.",
                  "Meine Telefonnummer ist vier neun zwei drei fünf acht.",
                  "Meine Telefonnummer ist vier-neun-zwei-drei-fünf-acht.",
                  "Die Telefonnummer ist vier neun zwei drei fünf acht.",
                  "Sie ist vier neun zwei drei fünf acht."
                ]
              }
            ]
          },
          {
            "canDo": 3,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Ihr Formular: Telefonnummer 0 1 7 6, Wohnort Bremen. Herr Weber: „Wie ist Ihre Telefonnummer? Und wo wohnen Sie?“ – Sie: …",
            "promptEn": "Your form says: phone number 0 1 7 6, place of residence Bremen. Mr Weber asks for your phone number and where you live. Answer both questions.",
            "answer": "Meine Telefonnummer ist null eins sieben sechs. Ich wohne in Bremen.",
            "parts": [
              {
                "label": {
                  "de": "die Telefonnummer (ganzer Satz oder jede Zahl als Wort)",
                  "en": "your phone number (a full sentence, or every number as a word)"
                },
                "forms": [
                  "Meine Telefonnummer ist null eins sieben sechs.",
                  "Null eins sieben sechs.",
                  "Meine Telefonnummer ist 0176.",
                  "Meine Telefonnummer ist 0 1 7 6.",
                  "Die Telefonnummer ist null eins sieben sechs.",
                  "Die Telefonnummer ist 0176."
                ]
              },
              {
                "label": {
                  "de": "der Wohnort (nicht nur das Wort aus dem Formular)",
                  "en": "where you live (not just the word from the form)"
                },
                "forms": [
                  "Ich wohne in Bremen.",
                  "In Bremen.",
                  "Mein Wohnort ist Bremen.",
                  "und ich wohne in Bremen.",
                  "und mein Wohnort ist Bremen.",
                  "Ich komme aus Marokko und wohne in Bremen."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                9,
                5
              ]
            },
            "micOff": true,
            "order": "any"
          },
          {
            "canDo": 4,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. An das Amt: „Guten Tag, ich heiße Ana Chakiri. … Danke! Ana Chakiri“ – Sie (Marokko; ledig): …",
            "promptEn": "You are Ana and you write a short message to the public office. The greeting, your name and the closing are already there. Write only the two missing sentences about yourself: where you come from (Morocco) your marital status (single).",
            "answer": "Ich komme aus Marokko. Ich bin ledig.",
            "parts": [
              {
                "label": {
                  "de": "die Herkunft (ganzer Satz)",
                  "en": "where you come from (a full sentence)"
                },
                "forms": [
                  "Ich komme aus Marokko.",
                  "Ich bin aus Marokko.",
                  "Ich komme aus Marokko und bin Marokkanerin.",
                  "Ich bin Marokkanerin.",
                  "Ich komme aus Marokko und wohne in Bremen."
                ]
              },
              {
                "label": {
                  "de": "der Familienstand (ganzer Satz)",
                  "en": "your marital status (a full sentence)"
                },
                "forms": [
                  "Ich bin ledig.",
                  "Ich bin nicht verheiratet.",
                  "Mein Familienstand ist ledig.",
                  "und bin ledig.",
                  "und ich bin ledig."
                ],
                "ellipsisOpening": "Ich bin"
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                5,
                3
              ]
            },
            "micOff": true,
            "order": "any",
            "firstContact": true,
            "context": [
              "Ich heiße Ana Chakiri.",
              "Ana Chakiri."
            ]
          }
        ]
      },
      guided: {
        sets: [DIGITS],
        read: {
          titleDe: 'Das Formular vom Amt',
          titleEn: 'The form from the public office',
          instructionDe: 'Lesen Sie das Blatt vom Amt. Tippen Sie auf ein Wort für seine Bedeutung.',
          instructionEn: 'Read the sheet from the public office. Tap a word for its meaning.',
          text: 'Amt Bremen: Bitte das Formular ausfüllen!\nVorname und Nachname: Wie heißen Sie?\nGeburtsdatum: Wann sind Sie geboren?\nStaatsangehörigkeit: Sie kommen aus Marokko? Dann bitte „marokkanisch“, nicht „Marokkanerin“.\nFamilienstand: Sind Sie ledig oder verheiratet?\nBeruf: Was sind Sie von Beruf? Lehrer, Lehrerin, Student, Studentin …\nWohnort und Adresse: Wo wohnen Sie?\nTelefonnummer: Bitte nur Zahlen, keine Buchstaben.',
          questions: [
            {
              promptDe: 'Sie kommen aus Marokko. Was steht dann im Formular bei „Staatsangehörigkeit“? Wählen Sie.',
              promptEn: 'You come from Morocco. What goes on the form under “Staatsangehörigkeit”? Choose.',
              options: ['The noun “Marokkanerin”.', 'The country name “Marokko”.', 'The adjective “marokkanisch”.'],
              answer: 'The adjective “marokkanisch”.',
              explanationDe: 'Auf dem Blatt steht: Dann bitte „marokkanisch“, nicht „Marokkanerin“.',
              explanationEn: 'The sheet says: then “marokkanisch”, please, not “Marokkanerin”.',
            },
            {
              promptDe: 'Was fragt das Amt bei „Geburtsdatum“? Wählen Sie.',
              promptEn: 'What does the office ask under “Geburtsdatum”? Choose.',
              options: ['When you were born.', 'Where you live now.', 'What your job is.'],
              answer: 'When you were born.',
              explanationDe: 'Auf dem Blatt steht: Geburtsdatum: Wann sind Sie geboren?',
              explanationEn: 'The sheet says under “Geburtsdatum”: when were you born?',
            },
          ],
        },
        chunks: [
          {
            from: 0,
            to: 2,
            meaning: {
              promptDe: 'Wer ist Herr Weber? Wählen Sie die Bedeutung.',
              promptEn: 'Who is Herr Weber? Choose the meaning.',
              options: ['He is a teacher from Bremen.', 'He is from the public office.', 'He is from the post office.'],
              answer: 'He is from the public office.',
            },
            say: {
              line: 1,
            },
          },
          {
            from: 2,
            to: 4,
            meaning: {
              promptDe: 'Was möchte Herr Weber wissen? Wählen Sie die Bedeutung.',
              promptEn: 'What does Herr Weber want to know? Choose the meaning.',
              options: ['Whether Ana is single or married.', 'Whether Ana is a student or a teacher.', 'Whether Ana lives in Bremen or Berlin.'],
              answer: 'Whether Ana is single or married.',
            },
            say: {
              line: 3,
            },
          },
          {
            from: 4,
            to: 6,
            meaning: {
              promptDe: 'Was sagt Ana? Wählen Sie die Bedeutung.',
              promptEn: 'What does Ana say? Choose the meaning.',
              options: ['She comes from Bremen and lives in Morocco.', 'She comes from Spain and lives in Berlin.', 'She comes from Morocco and lives in Bremen.'],
              answer: 'She comes from Morocco and lives in Bremen.',
            },
            say: {
              line: 5,
            },
          },
          {
            from: 6,
            to: 8,
            meaning: {
              promptDe: 'Was fragt Herr Weber? Wählen Sie die Bedeutung.',
              promptEn: 'What does Herr Weber ask? Choose the meaning.',
              options: ['He asks what Ana’s job is.', 'He asks where Ana lives.', 'He asks how old Ana is.'],
              answer: 'He asks what Ana’s job is.',
            },
            say: {
              line: 7,
            },
          },
          {
            from: 8,
            to: 10,
            meaning: {
              promptDe: 'Wie ist Anas Telefonnummer? Wählen Sie die Zahlen.',
              promptEn: 'What is Ana’s phone number? Choose the numbers.',
              options: ['0167', '0176', '1076'],
              answer: '0176',
            },
            say: {
              line: 9,
            },
          },
        ],
      },
      nextHook: {
        de: 'Lena sieht ein Foto auf Anas Handy. Wer sind die Leute auf dem Foto?',
        en: 'Lena sees a photo on Ana’s phone. Who are the people in the photo?',
      },
      title: 'Ich bin Studentin',
      situation: 'Angaben zur Person, Beruf und Zahlen',
      handlungsfeld: 'Ämter und Behörden: Angaben zur Person machen',
      canDo: [
        'Ich kann sagen, woher ich komme und was ich von Beruf bin.',
        'Ich kann nach dem Beruf einer Person fragen.',
        'Ich kann Zahlen von null bis zehn verstehen und sagen.',
        'Ich kann meine Telefonnummer und meinen Wohnort nennen.',
        'Ich kann in einer kurzen Nachricht Angaben zu meiner Person machen.',
      ],
      // „Lesen Teil 1“ was a claim with no surface: `links.readingOrder` is null and no step of the
      // Lektion gives the learner a text to READ (RULE 16, the level's last offender). The live
      // `reading_lessons` table at a1.1 carries exactly ten rows (order_index 1–10, queried
      // 2026-09-13) and all ten are already linked by another Lektion; none of them is the
      // E-Mail/Brief format SD1 tests in Lesen Teil 1, so there was nothing honest to link. What
      // the Lektion really rehearses is listening: `hoeren` dictates two dialogue lines of the
      // Bürgerbüro exchange, which is Hören Teil 1 (short everyday dialogue). „Lesen Teil 1“ stays
      // covered across the course by L3 and L11, which both link a reading lesson.
      examTeile: ['Sprechen Teil 1', 'Hören Teil 1', 'Schreiben Teil 2'],
      grammarSlugs: ['verb-sein', 'alphabet-pronunciation'],
      primarySlug: 'verb-sein',
      minutes: 15,
      wortfeld: [
        { de: 'der Vorname', word: 'Vorname', article: 'der', plural: 'Vornamen', en: 'first name', field: true, wordId: '6f92a8dc-f22e-418a-b13b-dc9c173d3aea' },
        { de: 'der Nachname', word: 'Nachname', article: 'der', plural: 'Nachnamen', en: 'surname (= Familienname)', field: true, wordId: 'ad1996d7-42b5-4ad9-b765-022003806c29' },
        { de: 'der Beruf', word: 'Beruf', article: 'der', plural: 'Berufe', en: 'profession, job', field: true, wordId: '2f54e3ae-2a16-47a3-9558-08b605c69dfb' },
        // `von Beruf` is NOT a Wortfeld row of its own (round 17): `der Beruf` teaches the noun and
        // the chunk itself stands in dialogue line 6, in the pretest and in the speaking hint words.
        // Two of the 25 slots of this Lektion had to be freed for the nationality noun and the
        // origin verb the BLOCKER needs, and a duplicate entry is the first thing to go.
        { de: 'die Adresse', word: 'Adresse', article: 'die', plural: 'Adressen', en: 'address', field: true, wordId: 'bd5380d6-03a4-4fc8-bd88-cebf2346cc84' },
        { de: 'die Telefonnummer', word: 'Telefonnummer', article: 'die', plural: 'Telefonnummern', en: 'phone number', field: true, wordId: '84fd3205-50f1-4187-a4ba-db6ec628ce11' },
        { de: 'das Formular', word: 'Formular', article: 'das', plural: 'Formulare', en: 'form', wordId: '7dcdf9f6-5b5c-464e-87f5-a0a7f290b7bf' },
        { de: 'ausfüllen', word: 'ausfüllen', article: null, plural: null, en: 'to fill out', wordId: '0d5a6a88-9f0f-49dc-99c9-36432130acd6' },
        { de: 'der Wohnort', word: 'Wohnort', article: 'der', plural: 'Wohnorte', en: 'place of residence', field: true, wordId: '67d01c31-7fcd-4662-b115-750547b1c7bf' },
        { de: 'ledig', word: 'ledig', article: null, plural: null, en: 'single, unmarried', wordId: 'e8bd092c-07b9-4b09-a80b-d1f22e5ad9e5' },
        { de: 'verheiratet', word: 'verheiratet', article: null, plural: null, en: 'married', wordId: '2d10cc55-fb90-4081-8484-51fad5923591' },
        { de: 'der Student', exampleDe: 'Ali ist Student.', word: 'Student', article: 'der', plural: 'Studenten', en: 'student (m)', wordId: '7604734b-aab8-45da-ab00-da87605a9d20' },
        { de: 'die Studentin', word: 'Studentin', article: 'die', plural: 'Studentinnen', en: 'student (f)', wordId: '7d778f1a-5ddb-4b60-b46d-0ca2fdb03652' },
        { de: 'der Lehrer', word: 'Lehrer', article: 'der', plural: 'Lehrer', en: 'teacher (m)', wordId: '401b018a-1c7a-48c4-b06b-88cce32fcdcd' },
        { de: 'die Lehrerin', exampleDe: 'Die Frau ist Lehrerin.', word: 'Lehrerin', article: 'die', plural: 'Lehrerinnen', en: 'teacher (f)', wordId: '1e7ad6c2-37b5-4063-971c-4b2090cafa9e' },
        // The digits 0–10 are ONE Wortfeld entry, not ten (DaF review: ten of 25 slots were digits,
        // which inflated the word count and crowded out the Personalien lexis the Handlungsfeld needs).
        { de: 'die Zahlen 0–10', word: 'Zahlen 0–10', article: 'die', plural: '—', en: 'the numbers 0–10 (null, eins … zehn)', meta: true, set: 'numbers-0-10', wordId: '1087cf2f-d531-45d9-b04c-803440a7563a' },
        { de: 'wohnen', word: 'wohnen', article: null, plural: null, en: 'to live, to reside', wordId: 'fb025b05-6aa5-4a9e-91a2-52a903032000' },
        { de: 'das Geburtsdatum', word: 'Geburtsdatum', article: 'das', plural: 'Geburtsdaten', en: 'date of birth', field: true, wordId: '4b61db71-3720-4bf4-a936-d75495ebf91a' },
        { de: 'die Staatsangehörigkeit', word: 'Staatsangehörigkeit', article: 'die', plural: 'Staatsangehörigkeiten', en: 'nationality', field: true, wordId: '25aca43e-8b73-4f68-8d8f-aaf629150fb4' },
        // THE NATIONALITY, IN ITS TWO SHAPES, AND THEY ARE NOT INTERCHANGEABLE (round 17, DaF
        // review #16, BLOCKER). Round 15 taught only the ADJECTIVE, because the graded Schreiben
        // task of this very Lektion asks for „Ihr Land und Ihre Staatsangehörigkeit“ and A1.1
        // taught no nationality form at all (DaF review #14, BLOCKER 1: prüfen und nicht lehren).
        // Round 16 then had to build a sentence out of the only form it had, and wrote
        // „Ich bin marokkanisch.“ — which no German speaker says about a person. The NOUN is the
        // sentence form („Ich bin Marokkanerin.“, „Er ist Marokkaner.“); the ADJECTIVE is the
        // FORM-FIELD value („Staatsangehörigkeit: marokkanisch“). Both are taught, each with the
        // surface it belongs to, and RULE 24 fails the build if any production surface of the
        // level ever again puts a country `-isch` adjective after a finite `sein` with a person
        // subject (`deutsch` excepted — it is the one nationality German does use that way).
        // ONE ROW, BOTH GENDERS, AND THAT IS A SLOT DECISION, NOT A LANGUAGE ONE: a Lektion may hold
        // 15–25 Wortfeld entries (the validator fails outside that window, DaF review #2) and this
        // one is full. The masculine is taught where the feminine is, and MEASURED there (round 18,
        // DaF review #17, MAJOR 2 — round 17's version of this comment claimed the surfaces before
        // writing them): the notice body and the `verb-sein` rule card say „Ali ist Marokkaner.“,
        // the card's `commonMistakes` corrects the swapped gender, and `extra-a11-l02-16` makes the
        // learner PRODUCE the masculine as word formation (Marokkaner/Marokkanerin like Student/
        // Studentin). The notice is an INPUT surface under RULE 23 and licences the word for every
        // lexis rule; `tests/curricula.test.mjs` pins the CLASS, not the id: every Wortfeld entry
        // with an `(m: …)` gloss must have that masculine form on an input surface of its own
        // Lektion. Two slots were freed for this row and for `kommen aus`: `von Beruf` and
        // `der Schalter` (see below).
        { de: 'die Marokkanerin', word: 'Marokkanerin', article: 'die', plural: 'Marokkanerinnen', en: 'Moroccan woman (m: der Marokkaner, Pl. die Marokkaner)', wordId: '155e0b29-0bd2-44b9-a5db-f062de63bf9c' },
        { de: 'marokkanisch', word: 'marokkanisch', article: null, plural: null, en: 'Moroccan (form-field value: „Staatsangehörigkeit: marokkanisch“ — the sentence takes the noun)', wordId: 'f25db60a-b383-4427-9fb3-db2dc1b5cac3' },
        // MOVED HERE FROM LEKTION 3 (round 17, DaF review #16, MAJOR 3 / RULE 12): the can-do line
        // of this Lektion has promised „Ich kann sagen, woher ich komme“ since round 1 with nothing
        // behind it — `kommen` was Lektion 3, and no item asked for an origin. „Woher kommen Sie?“
        // is Sprechen Teil 1 and „Ihr Land“ is a Leitpunkt of the graded task, so the verb belongs
        // to the Lektion that asks for it. `Marokko` stays in Lektion 3: it is a PERSONA fact of
        // this course (Ana's country, `PERSONA_TABLES`), which is licence enough for the model text
        // — measured, RULE 20 does not ask for a Wortfeld row, and a Wortfeld slot spent on one
        // country name is a slot the Personalien lexis needs.
        { de: 'kommen aus', word: 'kommen aus', article: null, plural: null, en: 'to come from', wordId: 'fc80d20a-6546-4917-9784-ed90efb5625a' },
        // ROUND 16 (DaF review #15, MAJOR 1): `geboren`, as the chunk a learner actually needs. RULE
        // 21 called the Leitpunkt „Ihr Name und Ihr **Geburtsdatum**“ answerable while the level
        // taught neither `geboren` nor a month name — because the Formcheck accepted the FIELD line
        // („Das Geburtsdatum ist der 3.5.1998.“), which is the one sentence type *Start Deutsch 1*
        // deducts for. RULE 21 no longer accepts it (`allowNamedField: false`) and RULE 22 forbids
        // it in a Mitteilung, so the word the natural answer needs has to be taught: „Ich bin am
        // 3.5.1998 geboren.“ The date stays in digits — the months are Lektion 12.
        { de: 'geboren', word: 'geboren', article: null, plural: null, en: 'born (ich bin am … geboren)', wordId: '23645e51-0aae-40c0-8c20-2d890c16f56d' },
        { de: 'der Familienstand', word: 'Familienstand', article: 'der', plural: '—', en: 'marital status', field: true, wordId: '3302687e-42ad-45b5-a4c9-43b65b8f4a2d' },
        { de: 'das Amt', word: 'Amt', article: 'das', plural: 'Ämter', en: 'public office, authority', wordId: 'b5556cee-448c-47fc-82a7-2a5f9f956c1b' },
        // `der Schalter` is out for the same reason (round 17): it stood in the stage direction of
        // the dialogue and in no line, no item and no task — the Ämter lexis the learner produces is
        // `das Amt`, `die Post`, `das Formular`, `ausfüllen`.
        { de: 'die Post', word: 'Post', article: 'die', plural: '—', en: 'post office', wordId: '1897eb9b-5393-490d-aebf-c52080c2ec7d' },
      ],
      dialog: {
        title: 'Am Schalter im Bürgerbüro',
        setting: 'Ana meldet sich im Bürgerbüro an. Herr Weber arbeitet am Schalter.',
        lines: [
          // „das Amt“ and „die Post“ stood in the Wortfeld of the Ämter-Handlungsfeld and in no
          // line of its own Lektion (DaF review #3, Wortfeld ↔ Input): they are carried here and in
          // line 8 rather than by a Wortfeld entry nobody ever hears.
          { speaker: 'Herr Weber', de: 'Guten Tag! Ich bin Herr Weber vom Amt.', en: 'Good day! I am Mr Weber from the public office.' },
          { speaker: 'Ana', de: 'Freut mich! Ich bin Ana.', en: 'Nice to meet you! I am Ana.' },
          // THE FAMILIENSTAND IS ASKED AND ANSWERED, NOT DECLARED (round 19, DaF review #18, Minor
          // 12). Round 18 put „Familienstand: Ich bin ledig oder verheiratet.“ into the notice so
          // that RULE 23b would report 0 — a sentence nobody says, written for the rule. The two
          // words of the graded task's third Leitpunkt and the field name now stand where a
          // learner HEARS them: the clerk reads the field with its two values (index 2, eleven
          // words — counted 2026-09-14, round 20, DaF review #19 Minor 25: round 19 wrote „ten“ —
          // in no window) and Ana answers with the sentence the task wants (index 3, the dictation
          // line, nine words: it is the longest line of the L2 window [7,3] and therefore the
          // chapter-1 `dictationCeiling` of `buildCheckpoint.js` — the learner types „Ich bin
          // ledig.“ from hearing it). The notice example
          // „Ich bin Studentin.“ and „Was sind Sie von Beruf?“ (indices 6/7) stay verbatim lines,
          // which is why the pair does not ride on them. Sie throughout — strangers at a counter.
          { speaker: 'Herr Weber', de: 'Bitte füllen Sie das Formular aus. Ihr Familienstand: ledig oder verheiratet?', en: 'Please fill out the form. Your marital status: single or married?' },
          { speaker: 'Ana', de: 'Ich bin ledig. Ist das Formular für die Adresse?', en: 'I am single. Is that form for the address?' },
          // THE ORIGIN, ASKED AND ANSWERED (round 18, DaF review #17, MAJOR 3). The can-do line
          // „Ich kann sagen, woher ich komme“ had exactly two L2 surfaces — the notice and the graded
          // model text — and the learner PRACTISES neither; every line of this dialogue skipped the
          // question an Amt asks third (*Start Deutsch 1*, Sprechen Teil 1: Name, Alter, LAND,
          // Wohnort …). The dialogue is at its ten-line ceiling (RULE 5), so the pair rides on the
          // two lines below instead of as two lines of its own. Windows are 0-based: Herr Weber's
          // line (index 4) is a read-aloud line and now carries the question the learner reads out;
          // Ana's answer (index 5, 12 words — the RULE 5 maximum) sits in no window, and the
          // dictation window [7,3] does not move. Sie throughout — Ana and Herr Weber are strangers
          // at a counter.
          { speaker: 'Herr Weber', de: 'Ja. Vorname, Nachname und Wohnort, bitte. Und woher kommen Sie?', en: 'Yes. First name, surname and place of residence, please. And where do you come from?' },
          { speaker: 'Ana', de: 'Mein Nachname ist Chakiri. Ich komme aus Marokko und wohne in Bremen.', en: 'My surname is Chakiri. I come from Morocco and live in Bremen.' },
          { speaker: 'Herr Weber', de: 'Was sind Sie von Beruf?', en: 'What is your profession?' },
          { speaker: 'Ana', de: 'Ich bin Studentin.', en: 'I am a student.' },
          // The Zahlen can-do is carried by the input, not only by the Wortfeld entry: these two
          // lines are the only place a learner hears digits in L2 (DaF review #2, L2).
          { speaker: 'Herr Weber', de: 'Danke. Hier ist auch die Post. Wie ist Ihre Telefonnummer?', en: 'Thank you. The post office is here too. What is your phone number?' },
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
        formExamples: ['sein: Ich bin Studentin.', 'Du bist Student. Ihr seid Studenten.'],
        title: 'sein: ich bin, du bist, Sie sind',
        // THE LAST CLAUSE IS THE ROUND-17 REPAIR (DaF review #16, BLOCKER). It used to read „Auch
        // die Staatsangehörigkeit steht ohne Artikel: Ich bin marokkanisch.“ — a rule that is not a
        // rule (a predicative adjective never has an article, so „ohne Artikel“ says nothing about
        // it) resting on a sentence that is not German. The clause now names the two shapes and
        // keeps them apart: NOMEN im Satz, ADJEKTIV im Formularfeld. The body also carries the words
        // the GRADED task of this Lektion needs and that nothing else in it says out loud — the two
        // nationality nouns, `kommen aus` and `geboren`. The two `examples` stay verbatim dialogue
        // lines (the validator requires exactly that), so the notice BODY is the input surface here
        // — which is the whole point of RULE 23: the model answer is the answer, not the lesson.
        // ROUND 18 (DaF review #17, MAJOR 2 + Minor 15). Two clauses joined and the body was already
        // at RULE 6's 60-word ceiling, so two were shortened to pay for them: „Ali ist Marokkaner.“
        // — the MASCULINE noun, which no surface of the course said until now while the comment two
        // rows up claimed this body did — and „Der Familienstand: Ich bin ledig oder verheiratet.“,
        // the two words of the graded task's third Leitpunkt that stood in two hand items and the
        // model text and on NO input surface (RULE 23b). What paid for them: the four field labels
        // lost their articles („Staatsangehörigkeit im Satz …“, „Familienstand: …“,
        // „Geburtsdatum: …“) and „mit geboren“ went. What deliberately did NOT go: „Ich bin
        // Lehrer.“ and „Nicht: Ich bin ein Lehrer.“ stay as sentences of their own, because the
        // `verb-sein` card quotes both and a card example must be a line of its Lektion
        // (`tests/rule-card-overrides.test.mjs`) — and because a notice token is lexis the Lektion
        // has taught (`taughtUpTo`): the first trim of this round dropped `ein` and `Satz`, which
        // RULE 11 measured at once as `extra-a11-l02-08:ein` and `extra-a11-l02-15:Satz` (59 → 61).
        // ROUND 19 (DaF review #18, Minor 12): the Familienstand clause is GONE from here. „Ich bin
        // ledig oder verheiratet.“ is not a sentence anyone says — it was a field with its two
        // values dressed as a first-person sentence, written so that RULE 23b would read 0, which
        // is the movement „the surface is written for the rule“ that this ladder had already
        // banned for the model texts. The three words now stand in dialogue lines 2 and 3, where
        // the learner hears and dictates them; the notice keeps the grammar. The class is closed
        // as a rule: RULE 6c fails any notice body that carries a `Feld: Ich bin … oder …` clause.
        // 54 words, read aloud.
        bodyDe: '**sein** ist unregelmäßig: ich **bin**, du **bist**, er/sie/es **ist**, wir **sind**, ihr **seid**, sie/Sie **sind**. Nach ich bin steht der Beruf meist ohne Artikel: Ich bin Lehrer. Aber: Das ist ein Lehrer. Bei Personen im Satz als Nomen: Ich komme aus Marokko und bin Marokkanerin. Ali ist Marokkaner. Im Formular als Adjektiv: Staatsangehörigkeit: marokkanisch. Geburtsdatum: Ich bin am 3.5.1998 geboren.',
        bodyEn: '**sein** (to be) is irregular – learn the set: ich **bin**, du **bist**, er/sie/es **ist**, wir **sind**, ihr **seid**, sie/Sie **sind**. After **ich bin** a job usually has no article: **Ich bin Lehrer.** But: **Das ist ein Lehrer.** Said of a person, a nationality is a noun: **Ich komme aus Marokko und bin Marokkanerin.** **Ali ist Marokkaner.** On a form it is an adjective: **Staatsangehörigkeit: marokkanisch**. Your date of birth: **Ich bin am 3.5.1998 geboren** (I was born on …).',
        examples: ['Was sind Sie von Beruf?', 'Ich bin Studentin.'],
        ruleSlug: 'verb-sein',
      },
      // A real long/short contrast from this Lektion's own words: the i of Sie and wie is long [iː],
      // the i of bin and sind is short [ɪ]. „bin – bist – sind“ were three short vowels (2026-10 review).
      phonetik: { focus: 'Langes und kurzes i: Sie, wie [iː] – bin, sind [ɪ]', focusEn: 'Long and short i: Sie, wie [iː] – bin, sind [ɪ]', items: ['wie – Sie', 'bin – sind', 'Sie sind'] },
      // Not line 4: an enumeration with three commas is a punctuation test, not a listening test.
      hoeren: { kind: 'dictation', lines: [3, 6] },
      sprechen: {
        // Zeile 2 („Bitte füllen Sie das Formular aus.“) ist RAUS (DaF review #13, MAJOR 3): der
        // Satz trägt die Satzklammer aus Lektion 11 und einen Sie-Imperativ, den A1.1 nirgends
        // erklärt. Im DIALOG darf er stehen (CONTRACT §2 — eine Beamtin sagt diesen Satz), zum
        // Vorlesen und als Diktat in Checkpoint 1 nicht. Zeile 4 ist frei und trägt das eigene
        // Thema der Lektion; RULE 18 bleibt erfüllt (Diktat liegt auf 7 und 3).
        readAloud: [1, 7],
        open: {
          teil: 'Sprechen Teil 1',
          // ROUND 18 (DaF review #17, MAJOR 3): *Start Deutsch 1* Sprechen Teil 1 asks Name, Alter,
          // LAND, Wohnort, Sprache, Beruf, Hobby — and this prompt, the one surface of the course
          // that rehearses Teil 1, left the country out while the Lektion's can-do promised it.
          // Exactly three hint words (validator): the origin verb replaces `sein`, which every
          // sentence of the answer carries anyway.
          promptDe: 'Stellen Sie sich vor: Name, Land, Wohnort, Beruf.',
          promptEn: 'Introduce yourself: name, country, where you live, job.',
          hintWords: ['kommen aus', 'wohnen', 'von Beruf'],
          // Sie — dieselbe Vorstellrunde (Teil 1): das Gegenüber ist fremd.
          anrede: 'Sie',
          missionOrder: 6,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a11-l02',
        // The Textsorte stays a Mitteilung (the kind alternates by parity), but the CONTENT now
        // serves the Handlungsfeld „Ämter und Behörden: Angaben zur Person“: the old neighbour note
        // asked for none of the Personalien lexis this Lektion teaches, so ledig/verheiratet/
        // Geburtsdatum/Staatsangehörigkeit/Familienstand lived in the Wortfeld and nowhere else
        // (DaF review #3, Wortfeld ↔ Input, L2: 9 of 23).
        // A TRANSFER task (2026-10 review): the learner writes Ana's data. Asked for their OWN
        // nationality, a Turkish, Syrian or German learner had no taught noun (Türkin, Syrerin,
        // Deutsche) — the course teaches Marokkanerin/Marokkaner only.
        taskDe: 'Sie sind Ana Chakiri, am 3.5.1998 geboren, aus Marokko, ledig. Sie melden sich in der Sprachschule an. Schreiben Sie eine kurze Nachricht mit Ihren Daten. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        taskEn: 'You are Ana Chakiri, born on 3 May 1998, from Morocco, single. You are registering at the language school. Write a short message with your personal details. Open with a greeting and close with a sign-off. Cover three points: your name and your date of birth; your country and your nationality; your marital status – single or married.',
        leitpunkte: ['Ihr Name und Ihr Geburtsdatum', 'Ihr Land und Ihre Staatsangehörigkeit', 'Ihr Familienstand: ledig oder verheiratet'],
        minWords: 25,
        maxWords: 45,
        // 32 Wörter, drei Leitpunkte in vollständigen Sätzen. Der Mustertext muss die
        // Formcheck-Liste bestehen, die der Bildschirm einen Absatz darüber zeigt (RULE 17):
        // 24 Wörter gegen „25–45“ waren `FAIL: length` neben dem Wort „Beispieltext“
        // (DaF review #12, MAJOR 1). Ohne Possessivartikel — die sind Lektion 12.
        // ROUND 14 (DaF review #13, MAJOR 1 + 2): „Der Nachname ist Chakiri.“, „Das Land ist
        // Marokko“ und „Der Familienstand: Ich bin ledig.“ sind wieder draußen. Sie standen nur da,
        // weil der Formcheck ein einziges Schlüsselwort je Leitpunkt suchte — das tut er nicht mehr
        // (`leitpunktSatisfied`), und ein Mustertext darf kein Wort enthalten, das nur für den
        // Checker dasteht. `marokkanisch` und `komme` sind weg, weil der Kurs sie bis Lektion 2
        // nicht lehrt (RULE 20); das Datum steht in Ziffern, weil `Mai` Lektion 12 ist.
        // ROUND 15 (DaF review #14, BLOCKER 1): „Die Staatsangehörigkeit ist marokkanisch.“ is back,
        // and this time the word is TAUGHT (L2 Wortfeld) instead of being a Vorgriff on nothing.
        // Round 14 struck it for RULE 20 and the model then answered two of its three Leitpunkte —
        // a state no text could get out of, because it was a Wortfeld problem, not a text problem.
        // ROUND 16 (DaF review #15, MAJOR 1): the two Formularsätze are out — for the second time,
        // and this time the rule that put them back is gone too. RULE 21 measures with
        // `allowNamedField: false`, so „Das Geburtsdatum ist …“ no longer counts as an answer, and
        // RULE 22 forbids „<Artikel> <Leitpunkt-Nomen> ist <Wert>“ in any Mitteilung sample by form
        // (the noun list comes from the task bank, not from a string). What replaces them is the
        // sentence a person writes — „Ich bin am 3.5.1998 geboren.“ — which is why `geboren` is now
        // a Wortfeld entry of this Lektion. 33 Wörter, alle drei Leitpunkte in vollen Sätzen, ohne
        // Possessivartikel (die sind Lektion 12).
        // ROUND 17 (DaF review #16, BLOCKER): „Ich bin aus Marokko. Ich bin marokkanisch.“ becomes
        // „Ich komme aus Marokko und bin Marokkanerin.“ — the sentence `src/lib/lesson/writing.js`
        // has quoted in its own header as the exam-fit A1 answer all along. Same 33 words, same
        // three Leitpunkte, and the origin half of the Lektion's own can-do line finally has a
        // surface. `kommen aus` moved into this Lektion's Wortfeld for it (`Marokko` is a persona fact
        // and a DIALOG_NAME, not a Wortfeld row).
        // Optional, tappable sentence starters for the first free-text messages (Wave 1). Each is cut
        // from this Lektion's own model text, so RULE 20 already holds it to taught words (test).
        starters: ['Sehr geehrte Damen und Herren,', 'ich heiße …', 'Ich bin am … geboren.', 'Ich komme aus …', 'Ich bin ledig.', 'Viele Grüße,'],
        sample: 'Sehr geehrte Damen und Herren, ich heiße Ana Chakiri. Ich bin am 3.5.1998 geboren. Ich komme aus Marokko und bin Marokkanerin. Ich bin ledig. Ich bin Studentin in Bremen. Viele Grüße, Ana Chakiri',
      },
      // A1.1 carries six listening exercises and ten reading texts; every one is linked from another
      // Lektion, so this one honestly has none — the syllabus shows „—“ rather than a repeat.
      links: { listeningExercise: null, readingOrder: null },
      // `numbers` is a PRACTICE-ONLY topic, deliberately absent from grammarSlugs: Hören Teil 1
      // of SD1 is almost only numbers, times and telephone numbers, and a number written wrong
      // is a spelling error, not a conjugation one — which is what it was booked as while the
      // four items sat under `verb-sein` (DaF review #6).
      practiceRule: { topics: ['verb-sein', 'alphabet-pronunciation', 'numbers'], typedMin: 3 },
    },
    {
      nr: 3,
      id: 'a1.1-l03',
      slug: 'meine-familie',
      flow: 'guided',
      proof: {
        "tasks": [
          {
            "canDo": 0,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Sie sind Ana. Lena: „Wer ist das?“ – Sie (Bruder): … Lena: „Wie alt ist er?“ – Sie (20): …",
            "promptEn": "You are Ana and show Lena a photo of your brother. He is 20. Lena asks who that is, then how old he is. Answer both questions, in that order.",
            "answer": "Das ist mein Bruder. Er ist zwanzig.",
            "parts": [
              {
                "label": {
                  "de": "die Person (nicht nur das eine Wort)",
                  "en": "who it is (not just the one word)"
                },
                "forms": [
                  "Das ist mein Bruder.",
                  "Mein Bruder.",
                  "Er ist mein Bruder.",
                  "Das ist der Bruder."
                ]
              },
              {
                "label": {
                  "de": "das Alter (die Zahl als Wort oder ein ganzer Satz)",
                  "en": "his age (the number as a word, or a full sentence)"
                },
                "forms": [
                  "Er ist zwanzig.",
                  "Zwanzig.",
                  "Er ist 20.",
                  "Mein Bruder ist zwanzig.",
                  "Mein Bruder ist 20."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                1,
                3
              ]
            },
            "micOff": true
          },
          {
            "canDo": 1,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Ein Mann: „Welche Sprachen sprechen Sie?“ – Sie (Arabisch + Deutsch): …",
            "promptEn": "You speak Arabic and German. A man you have just met asks which languages you speak. Answer in one full sentence.",
            "answer": "Ich spreche Arabisch und Deutsch.",
            "parts": [
              {
                "label": {
                  "de": "die Sprachen (ein ganzer Satz)",
                  "en": "your languages (one full sentence)"
                },
                "forms": [
                  "Ich spreche Arabisch und Deutsch.",
                  "Ich spreche Deutsch und Arabisch.",
                  "Ich spreche Arabisch und auch Deutsch.",
                  "Ich spreche Deutsch und auch Arabisch.",
                  "Ich spreche Arabisch. Ich spreche Deutsch.",
                  "Ich spreche Deutsch. Ich spreche Arabisch."
                ],
                "maxSentences": 2
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                4,
                5
              ]
            },
            "micOff": true
          },
          {
            "canDo": 2,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Eine Frau: „Das ist mein Bruder.“ – Sie: …? Die Frau: „Er ist zwanzig. Und das sind meine Eltern.“ – Sie: …? Die Frau: „Sie sprechen Arabisch und Deutsch.“",
            "promptEn": "A woman shows you a photo of her family. Ask two questions so that her answers fit: first about her brother, then about her parents.",
            "answer": "Wie alt ist er? Welche Sprachen sprechen sie?",
            "parts": [
              {
                "label": {
                  "de": "die Frage nach dem Alter",
                  "en": "the question about his age"
                },
                "forms": [
                  "Wie alt ist er?",
                  "Und wie alt ist er?",
                  "Wie alt ist dein Bruder?",
                  "Und wie alt ist dein Bruder?",
                  "Wie alt ist Ihr Bruder?",
                  "Und wie alt ist Ihr Bruder?",
                  "Wie alt ist der Bruder?"
                ]
              },
              {
                "label": {
                  "de": "die Frage nach den Sprachen",
                  "en": "the question about their languages"
                },
                "forms": [
                  "Welche Sprachen sprechen sie?",
                  "Und welche Sprachen sprechen sie?",
                  "Welche Sprachen sprechen deine Eltern?",
                  "Und welche Sprachen sprechen deine Eltern?",
                  "Welche Sprachen sprechen Ihre Eltern?",
                  "Und welche Sprachen sprechen Ihre Eltern?",
                  "Welche Sprachen sprechen die Eltern?",
                  "Welche Sprache sprechen sie?",
                  "Welche Sprache sprechen deine Eltern?",
                  "Welche Sprache sprechen Ihre Eltern?",
                  "Was sprechen sie?",
                  "Was sprechen deine Eltern?",
                  "Was sprechen Ihre Eltern?"
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                2,
                4
              ]
            },
            "micOff": true,
            "register": "informal"
          },
          {
            "canDo": 3,
            "type": "production",
            "promptDe": "Antworten Sie mit einem Satz. Eine Frau: „Woher kommt Ihre Familie?“ – Sie (Marokko): …",
            "promptEn": "Your family is from Morocco. A woman you have just met asks where your family comes from. Answer her.",
            "answer": "Meine Familie kommt aus Marokko.",
            "parts": [
              {
                "label": {
                  "de": "die Herkunft der Familie (nicht nur das eine Wort)",
                  "en": "where your family comes from (not just the one word)"
                },
                "forms": [
                  "Meine Familie kommt aus Marokko.",
                  "Sie kommt aus Marokko.",
                  "Aus Marokko.",
                  "Wir kommen aus Marokko.",
                  "Meine Familie ist aus Marokko.",
                  "Wir sind aus Marokko.",
                  "Die Familie kommt aus Marokko.",
                  "Meine Eltern kommen aus Marokko.",
                  "Sie kommen aus Marokko."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                9
              ]
            },
            "micOff": true
          }
        ]
      },
      guided: {
        sets: [AGE_TWENTY],
        read: {
          titleDe: 'Eine Nachricht mit Foto',
          titleEn: 'A message with a photo',
          instructionDe: 'Lesen Sie die Nachricht von Ana. Tippen Sie auf ein Wort für seine Bedeutung.',
          instructionEn: 'Read the message from Ana. Tap a word for its meaning.',
          text: 'Hallo Tim!\nDas ist meine Familie.\nMein Vater und meine Mutter kommen aus Marokko.\nMein Bruder ist zwanzig, seine Frau ist auch jung.\nSie haben schon ein Kind: eine Tochter. Sie ist noch ein Baby.\nMeine Schwester ist schon verheiratet.\nWir sprechen zusammen Arabisch und Deutsch.\nUnd du? Hast du Geschwister oder bist du Einzelkind?\nBis morgen! Ana',
          questions: [
            {
              promptDe: 'Was schreibt Ana über ihren Bruder? Wählen Sie.',
              promptEn: 'What does Ana write about her brother? Choose.',
              options: ['He and his wife have a young son.', 'He and his wife have a baby daughter.', 'He is single and has no children.'],
              answer: 'He and his wife have a baby daughter.',
              explanationDe: 'In der Nachricht steht: Sie haben schon ein Kind: eine Tochter. Sie ist noch ein Baby.',
              explanationEn: 'The message says they already have a child: a daughter. She is still a baby.',
            },
            {
              promptDe: 'Was möchte Ana von Tim wissen? Wählen Sie.',
              promptEn: 'What does Ana want to know from Tim? Choose.',
              options: ['Whether he is married or still single.', 'Whether he speaks Arabic or English.', 'Whether he has siblings or is an only child.'],
              answer: 'Whether he has siblings or is an only child.',
              explanationDe: 'In der Nachricht steht: Hast du Geschwister oder bist du Einzelkind?',
              explanationEn: 'The message asks: do you have siblings or are you an only child?',
            },
          ],
        },
        chunks: [
          {
            from: 0,
            to: 2,
            meaning: {
              promptDe: 'Wer ist auf dem Foto? Wählen Sie die Bedeutung.',
              promptEn: 'Who is in the photo? Choose the meaning.',
              options: ['Her parents, a brother and a sister.', 'Her husband, a son and a daughter.', 'Her parents and her two brothers.'],
              answer: 'Her parents, a brother and a sister.',
            },
            say: {
              line: 1,
            },
          },
          {
            from: 2,
            to: 4,
            meaning: {
              promptDe: 'Was sagt Ana über ihre Schwester? Wählen Sie die Bedeutung.',
              promptEn: 'What does Ana say about her sister? Choose the meaning.',
              options: ['She is twenty.', 'She is still young.', 'She is a baby.'],
              answer: 'She is still young.',
            },
            say: {
              line: 2,
            },
          },
          {
            from: 4,
            to: 6,
            meaning: {
              promptDe: 'Welche Sprachen sprechen Anas Eltern? Wählen Sie die Bedeutung.',
              promptEn: 'Which languages do Ana’s parents speak? Choose the meaning.',
              options: ['English and German.', 'Arabic and English.', 'Arabic and German.'],
              answer: 'Arabic and German.',
            },
            say: {
              line: 5,
            },
          },
          {
            from: 6,
            to: 8,
            meaning: {
              promptDe: 'Was fragt Lena? Wählen Sie die Bedeutung.',
              promptEn: 'What does Lena ask? Choose the meaning.',
              options: ['Whether Ana’s brother also speaks English.', 'Whether Ana’s brother lives in Germany.', 'Whether Ana’s parents also speak English.'],
              answer: 'Whether Ana’s brother also speaks English.',
            },
            say: {
              line: 6,
            },
          },
          {
            from: 8,
            to: 10,
            meaning: {
              promptDe: 'Was hat Anas Bruder? Wählen Sie die Bedeutung.',
              promptEn: 'What does Ana’s brother have? Choose the meaning.',
              options: ['A son and a daughter.', 'A baby daughter.', 'A young son.'],
              answer: 'A baby daughter.',
            },
            say: {
              line: 9,
            },
          },
        ],
      },
      nextHook: {
        de: 'Tim sucht Möbel für sein Zimmer. Ist der Flohmarkt teuer?',
        en: 'Tim is looking for furniture for his room. Is the flea market expensive?',
      },
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
        { de: 'der Vater', exampleDe: 'Das ist der Vater. Er spricht Deutsch.', word: 'Vater', article: 'der', plural: 'Väter', en: 'father', wordId: 'cb74f1e9-0592-4b56-b9b0-27e360e49024' },
        { de: 'die Mutter', exampleDe: 'Das ist die Mutter. Sie spricht Deutsch.', word: 'Mutter', article: 'die', plural: 'Mütter', en: 'mother', wordId: '5965edfd-4846-4df4-9eb0-bc7f22953204' },
        { de: 'der Bruder', word: 'Bruder', article: 'der', plural: 'Brüder', en: 'brother', wordId: '297b72b1-88b7-48c7-9aba-f5ffd87ae46d' },
        { de: 'die Schwester', word: 'Schwester', article: 'die', plural: 'Schwestern', en: 'sister', wordId: 'd450b2e5-7d92-4b87-88a0-611ed280fc65' },
        { de: 'die Geschwister', word: 'Geschwister', article: 'die', plural: 'Geschwister', en: 'siblings', wordId: 'a7571ed6-9ce8-4bc8-b6e3-1c9b55517f5c' },
        { de: 'der Sohn', word: 'Sohn', article: 'der', plural: 'Söhne', en: 'son', wordId: 'e2600e1e-8a72-42e6-bf30-3ec84d0e8ac5' },
        { de: 'die Tochter', word: 'Tochter', article: 'die', plural: 'Töchter', en: 'daughter', wordId: '4b9c7830-8179-4dfe-900c-5d20300045c5' },
        { de: 'das Kind', word: 'Kind', article: 'das', plural: 'Kinder', en: 'child', wordId: '20a50d1e-4b71-4d3a-8bf1-1b0278d3d445' },
        { de: 'der Mann', word: 'Mann', article: 'der', plural: 'Männer', en: 'man; husband', wordId: '9551becf-a28b-4e81-bfb0-ad2e25f0d4b4' },
        { de: 'die Frau', exampleDe: 'Die Frau spricht Deutsch.', word: 'Frau', article: 'die', plural: 'Frauen', en: 'woman; wife; Mrs/Ms (Anrede)', wordId: '14664846-bff1-4940-b390-e7486006eed1' },
        { de: 'das Baby', word: 'Baby', article: 'das', plural: 'Babys', en: 'baby', wordId: 'a8ad826c-2216-4527-b344-1cd35778fae7' },
        { de: 'das Einzelkind', exampleDe: 'Ich bin Einzelkind.', word: 'Einzelkind', article: 'das', plural: 'Einzelkinder', en: 'only child', wordId: '4130e54e-fe3d-4e50-b059-d6e1c45777bb' },
        { de: 'jung', word: 'jung', article: null, plural: null, en: 'young', wordId: '84422f10-4718-4f70-a51b-c9e586a0a38b' },
        { de: 'alt', word: 'alt', article: null, plural: null, en: 'old', wordId: 'cf1c85f6-8089-46af-b6b8-59ff7b8d9fdd' },
        { de: 'zusammen', exampleDe: 'Wir sprechen zusammen Deutsch.', word: 'zusammen', article: null, plural: null, en: 'together', wordId: 'ab3ffe19-9288-42ed-9d01-09e3f561e748' },
        { de: 'die Sprache', word: 'Sprache', article: 'die', plural: 'Sprachen', en: 'language', wordId: '5c6e3969-d15a-4f5c-bc7f-e8629801c2da' },
        { de: 'Deutsch', word: 'Deutsch', article: null, plural: null, en: 'German (language)', wordId: '2fd09a1f-cf75-4094-8296-3dc81e4967ab' },
        { de: 'Englisch', word: 'Englisch', article: null, plural: null, en: 'English (language)', wordId: '1104bcc7-93f1-432f-ae84-64850c0c5d7c' },
        { de: 'Arabisch', word: 'Arabisch', article: null, plural: null, en: 'Arabic (language)', wordId: '77f2d528-3578-46b0-8b35-f31e2d152799' },
        // `kommen aus` MOVED TO LEKTION 2 (round 17, DaF review #16, BLOCKER + MAJOR 3): L2's can-do
        // says „Ich kann sagen, woher ich komme“ and its graded Mitteilung asks for „Ihr Land und
        // Ihre Staatsangehörigkeit“, so the level has to teach the origin sentence in the Lektion
        // that promises it. This Lektion keeps using the verb — a Lektion may use anything an
        // EARLIER Wortfeld taught (RULE 5/RULE 20 read `taughtUpTo`) — and dialogue line 9 and the
        // Formular still do. `Marokko` stays here, where its dialogue line is.
        { de: 'Marokko', word: 'Marokko', article: null, plural: null, en: 'Morocco', wordId: '5396e33c-85f5-41db-84b2-3c9a6819cb1d' },
        { de: 'sprechen', word: 'sprechen', article: null, plural: null, en: 'to speak', wordId: 'bedd255d-fe20-4a60-a510-5be8413e5fcb' },
      ],
      dialog: {
        title: 'Ein Foto von zu Hause',
        setting: 'Lena sieht ein Foto auf Anas Handy.',
        lines: [
          { speaker: 'Lena', de: 'Ana, ist das deine Familie?', en: 'Ana, is that your family?' },
          { speaker: 'Ana', de: 'Ja. Das sind meine Eltern und meine Geschwister: ein Bruder, eine Schwester.', en: 'Yes. Those are my parents and my siblings: a brother, a sister.' },
          { speaker: 'Lena', de: 'Wie alt ist er?', en: 'How old is he?' },
          { speaker: 'Ana', de: 'Er ist zwanzig. Sie ist noch jung.', en: 'He is twenty. She is still young.' },
          { speaker: 'Lena', de: 'Welche Sprachen sprechen deine Eltern?', en: 'Which languages do your parents speak?' },
          { speaker: 'Ana', de: 'Sie sprechen Arabisch und Deutsch.', en: 'They speak Arabic and German.' },
          { speaker: 'Lena', de: 'Spricht dein Bruder auch Englisch?', en: 'Does your brother speak English too?' },
          { speaker: 'Ana', de: 'Ja, er spricht Englisch und Deutsch.', en: 'Yes, he speaks English and German.' },
          { speaker: 'Lena', de: 'Hat dein Bruder einen Sohn oder eine Tochter?', en: 'Does your brother have a son or a daughter?' },
          // „Mein Mann und ich …“ made Ana married while the Formular of this very Lektion files her as
          // ledig (DaF review #5, MAJOR 12). der Mann stays covered through her sister's husband.
          { speaker: 'Ana', de: 'Eine Tochter, ein Baby. Der Mann von meiner Schwester kommt aus Marokko.', en: 'A daughter, a baby. My sister’s husband comes from Morocco.' },
        ],
      },
      pretest: {
        promptDe: 'Sprechen Sie über eine Person in Ihrer Familie.',
        promptEn: 'Say one sentence about a person in your family.',
        // Runde 12 hat „Mein Bruder ist zwanzig.“ (Possessivartikel → L12, RULE 15b) durch „Das ist
        // die Schwester. Sie ist zwanzig.“ ersetzt — und damit die ZAHL der falschen Person gegeben:
        // im Dialog dieser Lektion ist der BRUDER zwanzig, die Schwester ist „noch jung“
        // (DaF review #12, MAJOR 2; jetzt RULE 19). Der Bruder trägt die Zahl des Dialogs, „Er ist
        // Student.“ übt das Personalpronomen, das diese Lektion lehrt, und beides kommt ohne
        // Possessivartikel aus.
        model: 'Er ist zwanzig. Er spricht Arabisch und Deutsch.',
        accepted: ['Mein', 'Meine', 'Das ist', 'Er ist', 'Sie ist', 'Der Bruder', 'Die Schwester', 'Ich habe'],
      },
      notice: {
        formExamples: ['Das Kind ist jung. Es spricht Deutsch.', 'Wir sprechen Deutsch. Sprecht ihr auch Deutsch?'],
        title: 'er, sie, es – die Personalpronomen',
        bodyDe: 'Das Pronomen richtet sich nach dem Nomen: der Bruder → **er**, die Schwester → **sie**, das Kind → **es**. Für mehrere Personen: **wir**, **ihr**, **sie**. **Sie** mit großem S ist die höfliche Form. Bei **sprechen** wechselt der Vokal: er **spricht** — mehr dazu in Lektion 7.',
        bodyEn: 'A pronoun follows the article of the noun it stands for: **der** Bruder → **er**, **die** Schwester → **sie**, **das** Kind → **es**. For more than one person use **wir** (we), **ihr** (you, several people, informal) and **sie** (they). **Sie** with a capital S is the polite "you" – for one person or several. One verb to watch: **sprechen** changes its vowel – er **spricht**. Lektion 7 explains the pattern.',
        examples: ['Wie alt ist er?', 'Ja, er spricht Englisch und Deutsch.'],
        ruleSlug: 'personal-pronouns',
      },
      phonetik: { focus: 'u und ü: Bruder [uː] – Brüder [yː] (lang), Mütter [ʏ] (kurz)', focusEn: 'u and ü: Bruder [uː] – Brüder [yː] (long), Mütter [ʏ] (short)', items: ['der BRU-der', 'die BRÜ-der', 'die MÜT-ter'] },
      hoeren: { kind: 'dictation', lines: [5, 7] },
      sprechen: {
        readAloud: [2, 3],
        open: {
          teil: 'Sprechen Teil 2',
          // Not „Geschwister? Sohn? Tochter?“: answering those needs haben + Akkusativ (L9, A1.2).
          promptDe: 'Fragen und antworten Sie zum Thema Familie: Wie alt? Woher? Welche Sprachen?',
          promptEn: 'Ask and answer questions about family: how old? where from? which languages?',
          hintWords: ['alt', 'kommen aus', 'sprechen'],
          // Sie — Teil 2 mit der fremden Mitkandidatin; das du im Dialog ist Lena↔Ana, nicht die Rolle des Lernenden.
          anrede: 'Sie',
          missionOrder: 5,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a11-l03',
        taskDe: 'Ana Chakiri ist ledig. Sie kommt aus Marokko und spricht Arabisch und Deutsch. Sie lernt Deutsch in der Sprachschule. Füllen Sie das Formular für den Sprachkurs aus.',
        taskEn: 'Ana Chakiri is single. She comes from Morocco and speaks Arabic and German. She is learning German at the language school. Fill in the form for the language course (first name, surname, marital status, languages, country).',
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
      flow: 'guided',
      proof: {
        "tasks": [
          {
            "canDo": 0,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Auf dem Flohmarkt. Sie: …? Frau Wolf: „Das ist eine Lampe.“ – Sie: …? Frau Wolf: „Sie kostet acht Euro.“",
            "promptEn": "At the flea market you see a thing on Ms Wolf’s table. Ask two questions so that her answers fit: first what the thing is, then what it costs.",
            "answer": "Was ist das? Was kostet sie?",
            "parts": [
              {
                "label": {
                  "de": "die Frage nach der Sache",
                  "en": "the question about what the thing is"
                },
                "forms": [
                  "Was ist das?",
                  "Entschuldigung, was ist das?",
                  "Und was ist das?"
                ]
              },
              {
                "label": {
                  "de": "die Frage nach dem Preis",
                  "en": "the question about the price"
                },
                "forms": [
                  "Was kostet sie?",
                  "Und was kostet sie?",
                  "Was kostet die Lampe?",
                  "Und was kostet die Lampe?",
                  "Wie viel kostet sie?",
                  "Und wie viel kostet sie?",
                  "Wie viel kostet die Lampe?",
                  "Und wie viel kostet die Lampe?",
                  "Was kostet das?",
                  "Und was kostet das?",
                  "Wie viel kostet das?",
                  "Und wie viel kostet das?",
                  "Wie teuer ist sie?",
                  "Wie teuer ist die Lampe?",
                  "Wie teuer ist das?",
                  "Wie ist der Preis?",
                  "Was ist der Preis?"
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                0,
                2
              ]
            },
            "micOff": true
          },
          {
            "canDo": 1,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Frau Wolf: „Die Lampe kostet acht Euro.“ – Sie: Und der Rucksack? …? Frau Wolf: „Er kostet zwanzig Euro.“",
            "promptEn": "Now you point at the backpack: “Und der Rucksack?” Go on and ask Ms Wolf for its price, so that her answer fits. Write only your question.",
            "answer": "Was kostet er?",
            "parts": [
              {
                "label": {
                  "de": "nur die Frage nach dem Preis",
                  "en": "only the question about the price"
                },
                "forms": [
                  "Was kostet er?",
                  "Und was kostet er?",
                  "Was kostet der Rucksack?",
                  "Und was kostet der Rucksack?",
                  "Wie viel kostet er?",
                  "Und wie viel kostet er?",
                  "Wie viel kostet der Rucksack?",
                  "Und wie viel kostet der Rucksack?",
                  "Was kostet das?",
                  "Wie viel kostet das?",
                  "Wie teuer ist er?",
                  "Wie teuer ist der Rucksack?",
                  "Wie ist der Preis?",
                  "Was ist der Preis?",
                  "Und der Rucksack, was kostet er?",
                  "Und der Rucksack? Was kostet er?"
                ],
                "maxSentences": 2
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                2
              ]
            },
            "micOff": true
          },
          {
            "canDo": 2,
            "type": "listening",
            "promptDe": "Hören Sie die Preise. Was kostet der Tisch, was kostet das Regal? Wählen Sie.",
            "promptEn": "Listen to the two prices. Choose the note with both prices right.",
            "answer": "Tisch 40 Euro, Regal 16 Euro",
            "reteach": {
              "kind": "wortfeld",
              "index": 6
            },
            "micOff": true,
            "mode": "choice",
            "instances": [
              {
                "answer": "Tisch 40 Euro, Regal 16 Euro",
                "accepted": [
                  "Tisch 40 Euro, Regal 16 Euro"
                ],
                "options": [
                  "Tisch 14 Euro, Regal 16 Euro",
                  "Tisch 40 Euro, Regal 60 Euro",
                  "Tisch 40 Euro, Regal 16 Euro",
                  "Tisch 14 Euro, Regal 60 Euro"
                ],
                "audioText": "Der Tisch kostet vierzig Euro und das Regal sechzehn Euro."
              },
              {
                "audioText": "Der Tisch kostet fünfunddreißig Euro und das Regal dreiundzwanzig Euro.",
                "answer": "Tisch 35 Euro, Regal 23 Euro",
                "accepted": [
                  "Tisch 35 Euro, Regal 23 Euro"
                ],
                "options": [
                  "Tisch 53 Euro, Regal 23 Euro",
                  "Tisch 35 Euro, Regal 32 Euro",
                  "Tisch 35 Euro, Regal 23 Euro",
                  "Tisch 53 Euro, Regal 32 Euro"
                ]
              }
            ]
          },
          {
            "canDo": 3,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Frau Wolf: „Was kaufen Sie?“ – Sie (Stuhl + Tasche): …",
            "promptEn": "You want the chair and the bag. Ms Wolf asks what you are buying. Tell her, with the articles.",
            "answer": "Ich kaufe den Stuhl und die Tasche.",
            "parts": [
              {
                "label": {
                  "de": "was Sie kaufen (mit den Artikeln)",
                  "en": "what you are buying (with the articles)"
                },
                "forms": [
                  "Ich kaufe den Stuhl und die Tasche.",
                  "Ich kaufe die Tasche und den Stuhl.",
                  "Ich kaufe den Stuhl und auch die Tasche.",
                  "Ich kaufe einen Stuhl und eine Tasche.",
                  "Ich kaufe eine Tasche und einen Stuhl.",
                  "Den Stuhl und die Tasche.",
                  "Die Tasche und den Stuhl.",
                  "Einen Stuhl und eine Tasche.",
                  "Eine Tasche und einen Stuhl.",
                  "Ich kaufe den Stuhl. Ich kaufe die Tasche.",
                  "Ich kaufe die Tasche. Ich kaufe den Stuhl."
                ],
                "maxSentences": 2
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                6
              ]
            },
            "micOff": true
          }
        ]
      },
      guided: {
        sets: [PRICE_FOUNDATIONS, PRICE_COMPOUNDS],
        read: {
          titleDe: 'Preise auf dem Flohmarkt',
          titleEn: 'Prices at the flea market',
          instructionDe: 'Lesen Sie das Schild. Tippen Sie auf ein Wort für seine Bedeutung.',
          instructionEn: 'Read the sign. Tap a word for its meaning.',
          text: 'Flohmarkt\nFrau Wolf: Wir verkaufen Uhren, Taschen, Rucksäcke, Stühle …\nWie viel kostet das? Der Preis in Euro:\nUhr: 10\nTasche: 5\nRucksack: 20\nWie viele Stühle kaufen Sie? Vier Stühle kosten zusammen nur 40 Euro!',
          questions: [
            {
              promptDe: 'Was kostet bei Frau Wolf fünf Euro? Wählen Sie.',
              promptEn: 'What costs five euros at Frau Wolf’s table? Choose.',
              options: ['The clock.', 'The backpack.', 'The bag.'],
              answer: 'The bag.',
              explanationDe: 'Auf dem Schild steht: Tasche: 5. Der Preis ist in Euro.',
              explanationEn: 'The sign says: Tasche (bag): 5. The price is in euros.',
            },
            {
              promptDe: 'Was kosten vier Stühle zusammen? Wählen Sie.',
              promptEn: 'What do four chairs cost altogether? Choose.',
              options: ['Twelve euros.', 'Forty euros.', 'Twenty euros.'],
              answer: 'Forty euros.',
              explanationDe: 'Auf dem Schild steht: Vier Stühle kosten zusammen nur 40 Euro.',
              explanationEn: 'The sign says that four chairs together cost only 40 euros.',
            },
          ],
        },
        chunks: [
          {
            from: 0,
            to: 2,
            meaning: {
              promptDe: 'Was sagt Frau Wolf? Wählen Sie die Bedeutung.',
              promptEn: 'What does Frau Wolf say? Choose the meaning.',
              options: ['It is a clock and costs eight euros.', 'It is a lamp and costs eighteen euros.', 'It is a lamp and costs eight euros.'],
              answer: 'It is a lamp and costs eight euros.',
            },
            say: {
              line: 0,
            },
          },
          {
            from: 2,
            to: 4,
            meaning: {
              promptDe: 'Was kostet der Tisch? Wählen Sie die Bedeutung.',
              promptEn: 'What does the table cost? Choose the meaning.',
              options: ['Fifty euros.', 'Fifteen euros.', 'Five euros.'],
              answer: 'Fifteen euros.',
            },
            say: {
              line: 2,
            },
          },
          {
            from: 4,
            to: 6,
            meaning: {
              promptDe: 'Was sagt Tim über den Tisch? Wählen Sie die Bedeutung.',
              promptEn: 'What does Tim say about the table? Choose the meaning.',
              options: ['He thinks it is expensive.', 'He wants to buy it now.', 'He thinks it is too old.'],
              answer: 'He thinks it is expensive.',
            },
            say: {
              line: 4,
            },
          },
          {
            from: 6,
            to: 8,
            meaning: {
              promptDe: 'Was kauft Tim? Wählen Sie die Bedeutung.',
              promptEn: 'What does Tim buy? Choose the meaning.',
              options: ['The table and the chair.', 'The chair and the lamp.', 'The lamp and the shelf.'],
              answer: 'The chair and the lamp.',
            },
            say: {
              line: 6,
            },
          },
          {
            from: 8,
            to: 10,
            meaning: {
              promptDe: 'Was kostet das Regal? Wählen Sie die Bedeutung.',
              promptEn: 'What does the shelf cost? Choose the meaning.',
              options: ['Fifty euros.', 'Thirteen euros.', 'Thirty euros.'],
              answer: 'Thirty euros.',
            },
            say: {
              line: 8,
            },
          },
        ],
      },
      nextHook: {
        de: 'Vor dem Kurs packen Lena und Tim ihre Taschen aus. Aber wo ist das Wörterbuch?',
        en: 'Before class, Lena and Tim unpack their bags. But where is the dictionary?',
      },
      title: 'Auf dem Flohmarkt',
      situation: 'Einkaufen, Möbel und Preise',
      handlungsfeld: 'Einkaufen: nach Gegenständen und Preisen fragen',
      canDo: [
        // „was ein Gegenstand ist“ named the task in a word the Lektion never uses: the read-aloud
        // line 0 („Entschuldigung, was ist das?“) makes the learner ASK it, and the pool asks after
        // the price, but `Gegenstand` occurs in no input, so RULE 12 reported the line. The can-do
        // now quotes what is actually produced instead of the metalinguistic label.
        'Ich kann fragen, was etwas ist und was es kostet.',
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
        { de: 'die Uhr', exampleDe: 'Die Uhr kostet zehn Euro.', word: 'Uhr', article: 'die', plural: 'Uhren', en: 'clock', wordId: 'e7525cfc-bf0a-4d96-ad93-eef3e71c187f' },
        { de: 'die Tasche', exampleDe: 'Die Tasche kostet fünf Euro.', word: 'Tasche', article: 'die', plural: 'Taschen', en: 'bag', wordId: '9e111e31-1e2f-47b3-a670-f18d2fd0faff' },
        { de: 'der Rucksack', exampleDe: 'Der Rucksack kostet zwanzig Euro.', word: 'Rucksack', article: 'der', plural: 'Rucksäcke', en: 'backpack', wordId: 'ba072910-dfb9-444b-a0de-ba29f90edadf' },
        // Ten numerals plus zählen filled 11 of 25 slots and none of them appeared in the Lektion
        // (the dialogue says acht, zwölf, fünfzehn, zwanzig, dreißig — all FUNCTION_WORDS anyway).
        // They are ONE entry now, exactly like L2's Zahlen 0–10, and the freed slots carry the
        // Flohmarkt lexis the situation actually needs (DaF review #2, L4).
        { de: 'die Zahlen 11–100', word: 'Zahlen 11–100', article: 'die', plural: '—', en: 'the numbers 11–100 (elf, zwölf … hundert)', meta: true, set: 'numbers-11-100', wordId: '112eb634-135f-4372-a74a-c60da86d1423' },
        { de: 'wie viel', word: 'wie viel', article: null, plural: null, en: 'how much', wordId: '80e786f9-8a29-45bd-862b-a498bc184c69' },
        { de: 'wie viele', exampleDe: 'Wie viele Stühle sind das? – Drei.', word: 'wie viele', article: null, plural: null, en: 'how many', wordId: 'c4fad330-3515-46b0-ad99-aa883e0ea764' },
        { de: 'der Flohmarkt', exampleDe: 'Das ist ein Flohmarkt. Ein Tisch kostet zehn Euro.', word: 'Flohmarkt', article: 'der', plural: 'Flohmärkte', en: 'flea market', wordId: '245c8937-50c0-491e-a297-5008748e085d' },
        { de: 'verkaufen', word: 'verkaufen', article: null, plural: null, en: 'to sell', wordId: 'b37ad662-f4b9-46c0-a53a-bc269a9e30a8' },
        // L4 teaches Genus and had NO neuter noun of its own, so the card reached forward to L5's
        // „das Buch“; das Regal is A1-Wortliste Flohmarkt lexis and carries the neuter (review #2, L4).
        { de: 'das Regal', word: 'Regal', article: 'das', plural: 'Regale', en: 'shelf', wordId: 'eea6452e-f5b9-40aa-b321-01377f8a0a76' },
        { de: 'der Euro', word: 'Euro', article: 'der', plural: 'Euro', en: 'euro', wordId: '34ee3fee-c37c-4ea0-8bb4-0732575da17b' },
        { de: 'der Preis', exampleDe: 'Der Preis ist zehn Euro.', word: 'Preis', article: 'der', plural: 'Preise', en: 'price', wordId: '34254aab-98aa-438b-a0e5-210c77d82596' },
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
        bodyDe: 'Jedes Nomen hat ein Genus: **der** Tisch, **die** Lampe, **das** Regal. Das Genus ist Teil des Wortes — lernen Sie jedes Nomen mit dem Artikel: nicht Tisch, sondern der Tisch. Im Plural haben alle Nomen **die**. Nach **kaufen** wird **der** zu **den**: Ich kaufe **den** Stuhl. Das ist hier ein fester Ausdruck; die Regel (Akkusativ) kommt in A1.2.',
        bodyEn: 'Every German noun has a gender, and its article shows it: **der** Tisch (masculine), **die** Lampe (feminine), **das** Regal (neuter). The gender of a thing usually cannot be guessed from its meaning, so learn each noun together with its article: not "Tisch" but **der Tisch**. In the plural, every noun takes **die**. One thing to copy for now: after **kaufen** (to buy), **der** becomes **den** – **Ich kaufe den Stuhl.** The rule behind this (Akkusativ) comes in A1.2.',
        examples: ['Das ist eine Lampe. Sie kostet acht Euro.', 'Der Tisch kostet fünfzehn Euro.'],
        ruleSlug: 'nouns-gender',
      },
      phonetik: { focus: 'Der Diphthong eu in Euro und teuer', focusEn: 'The diphthong eu in Euro and teuer', items: ['EU-ro', 'TEU-er', 'NEUN'] },
      hoeren: { kind: 'dictation', lines: [3, 7] },
      sprechen: {
        readAloud: [0, 2],
        open: {
          teil: 'Sprechen Teil 3',
          promptDe: 'Fragen Sie am Stand nach einem Preis und reagieren Sie auf die Antwort.',
          promptEn: 'At a market stall, ask for the price of something and react to the answer.',
          hintWords: ['kosten', 'Euro', 'teuer'],
          // Sie — Teil 3 am Marktstand: Kundin zu Verkäufer.
          anrede: 'Sie',
          missionOrder: 2,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a11-l04',
        taskDe: 'Sie sind auf dem Flohmarkt. Schreiben Sie Lena eine Nachricht. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        taskEn: 'You are at the flea market. Write a message to Lena. Open with a greeting and close with a sign-off. Cover three points: what you are buying; what it costs; when you are coming.',
        leitpunkte: ['Was Sie kaufen', 'Was es kostet', 'Wann Sie kommen'],
        minWords: 25,
        maxWords: 45,
        // 34 Wörter, alle drei Leitpunkte (kaufen / kostet / treffen). Bestimmte Artikel statt
        // „einen Stuhl“: der unbestimmte Artikel ist Lektion 6 (RULE 15b). ROUND 14: `Heute`, `uns`
        // und `Um` sind raus — alle drei lehrt der Kurs erst später, und ein Mustertext wird mit
        // demselben Maßstab gemessen wie ein Poolitem (RULE 20).
        // ROUND 15 (DaF review #14, BLOCKER 1): der dritte Leitpunkt heißt „Wann Sie kommen“ und der
        // Mustertext BEANTWORTET ihn wieder — „Wir kommen morgen.“ Runde 14 hatte „Wann treffen wir
        // Ana?“ geschrieben: eine Frage ohne Zeitangabe, also keine Antwort. `morgen` lehrt L1 als
        // „Bis morgen“, `kommen` L3; `treffen`, `uns` und `um` lehrt A1.1 bis hierher nicht.
        starters: ['Hallo Lena!', 'Wir kaufen …', 'Der Stuhl kostet … Euro.', 'Das ist nicht teuer.', 'Tschüss,'],
        sample: 'Hallo Lena! Der Flohmarkt ist gut. Wir kaufen den Stuhl und die Lampe. Der Stuhl kostet zwölf Euro und die Lampe kostet acht Euro. Das ist nicht teuer. Wir kommen morgen. Tschüss, Tim',
      },
      links: { listeningExercise: 1, readingOrder: 4 },
      practiceRule: { topics: ['nouns-gender'], typedMin: 3 },
    },
    {
      nr: 5,
      id: 'a1.1-l05',
      slug: 'im-klassenzimmer',
      flow: 'guided',
      proof: {
        "tasks": [
          {
            "canDo": 0,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Lena: „Was ist hier?“ – Sie: Der … Die … Das …",
            "promptEn": "Lena asks what is here in the classroom. Name three things you know from the course: one with der one with die one with das.",
            "answer": "Der Stift. Die Schere. Das Wörterbuch.",
            "parts": [
              {
                "label": {
                  "de": "ein Gegenstand mit der",
                  "en": "a thing with der"
                },
                "forms": [],
                "frames": [
                  {
                    "pattern": "Der {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Der {value} ist hier.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Der {value} ist da.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Das ist der {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Hier ist der {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  }
                ]
              },
              {
                "label": {
                  "de": "ein Gegenstand mit die",
                  "en": "a thing with die"
                },
                "forms": [],
                "frames": [
                  {
                    "pattern": "Die {value}.",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "Und die {value}.",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "Die {value} sind hier.",
                    "slots": {
                      "value": "taughtValues3"
                    }
                  },
                  {
                    "pattern": "Die {value} sind da.",
                    "slots": {
                      "value": "taughtValues3"
                    }
                  },
                  {
                    "pattern": "Die {value} ist hier.",
                    "slots": {
                      "value": "taughtValues4"
                    }
                  },
                  {
                    "pattern": "Die {value} ist da.",
                    "slots": {
                      "value": "taughtValues4"
                    }
                  },
                  {
                    "pattern": "Das ist die {value}.",
                    "slots": {
                      "value": "taughtValues4"
                    }
                  },
                  {
                    "pattern": "Hier ist die {value}.",
                    "slots": {
                      "value": "taughtValues4"
                    }
                  },
                  {
                    "pattern": "Die {value} auch.",
                    "slots": {
                      "value": "taughtValues4"
                    }
                  }
                ]
              },
              {
                "label": {
                  "de": "ein Gegenstand mit das",
                  "en": "a thing with das"
                },
                "forms": [],
                "frames": [
                  {
                    "pattern": "Das {value}.",
                    "slots": {
                      "value": "taughtValues5"
                    }
                  },
                  {
                    "pattern": "Das {value} ist hier.",
                    "slots": {
                      "value": "taughtValues5"
                    }
                  },
                  {
                    "pattern": "Das {value} ist da.",
                    "slots": {
                      "value": "taughtValues5"
                    }
                  },
                  {
                    "pattern": "Das ist das {value}.",
                    "slots": {
                      "value": "taughtValues5"
                    }
                  },
                  {
                    "pattern": "Hier ist das {value}.",
                    "slots": {
                      "value": "taughtValues5"
                    }
                  },
                  {
                    "pattern": "Das {value} auch.",
                    "slots": {
                      "value": "taughtValues5"
                    }
                  },
                  {
                    "pattern": "Und das {value}.",
                    "slots": {
                      "value": "taughtValues5"
                    }
                  }
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                1,
                3
              ]
            },
            "micOff": true,
            "order": "any",
            "sets": {
              "taughtValues1": [
                "Stift",
                "Bleistift",
                "Kugelschreiber",
                "Schlüssel",
                "Tisch",
                "Stuhl",
                "Rucksack"
              ],
              "taughtValues2": [
                "Schere",
                "Tafel",
                "Tür",
                "Lampe",
                "Uhr",
                "Tasche",
                "Stifte",
                "Bleistifte",
                "Tische",
                "Stühle",
                "Rucksäcke",
                "Scheren",
                "Tafeln",
                "Türen",
                "Lampen",
                "Uhren",
                "Taschen",
                "Bücher",
                "Hefte",
                "Lineale",
                "Papiere",
                "Wörterbücher",
                "Bilder",
                "Regale",
                "Formulare"
              ],
              "taughtValues3": [
                "Stifte",
                "Bleistifte",
                "Kugelschreiber",
                "Schlüssel",
                "Tische",
                "Stühle",
                "Rucksäcke",
                "Scheren",
                "Tafeln",
                "Türen",
                "Lampen",
                "Uhren",
                "Taschen",
                "Bücher",
                "Hefte",
                "Lineale",
                "Papiere",
                "Fenster",
                "Wörterbücher",
                "Bilder",
                "Regale",
                "Formulare"
              ],
              "taughtValues4": [
                "Schere",
                "Tafel",
                "Tür",
                "Lampe",
                "Uhr",
                "Tasche"
              ],
              "taughtValues5": [
                "Buch",
                "Heft",
                "Lineal",
                "Papier",
                "Fenster",
                "Wörterbuch",
                "Bild",
                "Regal",
                "Formular"
              ]
            },
            "allowModelContext": true
          },
          {
            "canDo": 1,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Sie: … das Wörterbuch? – Die Lehrerin: „Ich habe es. Und Ihr Stift?“ – Sie: …",
            "promptEn": "You cannot find the dictionary: ask where it is. The teacher has it and asks about your pen: tell her it is here, or that it is there.",
            "answer": "Wo ist das Wörterbuch? Der Stift ist hier.",
            "parts": [
              {
                "label": {
                  "de": "die Frage nach dem Wörterbuch",
                  "en": "the question about the dictionary"
                },
                "forms": [
                  "Wo ist das Wörterbuch?",
                  "Und wo ist das Wörterbuch?",
                  "Entschuldigung, wo ist das Wörterbuch?",
                  "Wo ist das Wörterbuch, bitte?",
                  "Wo ist mein Wörterbuch?",
                  "Entschuldigung, wo ist mein Wörterbuch?"
                ]
              },
              {
                "label": {
                  "de": "wo Ihr Stift ist",
                  "en": "where your pen is"
                },
                "forms": [
                  "Hier.",
                  "Da."
                ],
                "frames": [
                  {
                    "pattern": "{value} ist hier.",
                    "slots": {
                      "value": "taughtPhrases1"
                    }
                  },
                  {
                    "pattern": "Hier ist {value}.",
                    "slots": {
                      "value": "taughtPhrases2"
                    }
                  },
                  {
                    "pattern": "{value} ist da.",
                    "slots": {
                      "value": "taughtPhrases1"
                    }
                  },
                  {
                    "pattern": "Da ist {value}.",
                    "slots": {
                      "value": "taughtPhrases2"
                    }
                  }
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                0,
                1
              ]
            },
            "micOff": true,
            "sets": {
              "taughtPhrases1": [
                "Der Stift",
                "Mein Stift",
                "Er"
              ],
              "taughtPhrases2": [
                "der Stift",
                "mein Stift",
                "er"
              ]
            },
            "allowModelContext": true
          },
          {
            "canDo": 2,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Die Lehrerin: „Ihr Stift und Ihr Bleistift: die Farben, bitte!“ – Sie: … …",
            "promptEn": "The teacher asks for the colours of your pen and of your pencil. Say the colour of the pen the colour of the pencil. Use colours from this Lektion.",
            "answer": "Der Stift ist blau. Der Bleistift ist gelb.",
            "parts": [
              {
                "label": {
                  "de": "die Farbe von Ihrem Stift",
                  "en": "the colour of your pen"
                },
                "forms": [],
                "frames": [
                  {
                    "pattern": "Der Stift ist {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Mein Stift ist {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Er ist {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "{value}.",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  }
                ]
              },
              {
                "label": {
                  "de": "die Farbe von Ihrem Bleistift",
                  "en": "the colour of your pencil"
                },
                "forms": [],
                "frames": [
                  {
                    "pattern": "Der Bleistift ist {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Mein Bleistift ist {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Er ist {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Und der Bleistift ist {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Und mein Bleistift ist {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "{value}.",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "Der Bleistift ist auch {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Mein Bleistift ist auch {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Er ist auch {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Auch {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  }
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                5
              ]
            },
            "micOff": true,
            "order": "any",
            "sets": {
              "taughtValues1": [
                "rot",
                "blau",
                "grün",
                "gelb",
                "schwarz",
                "weiß",
                "braun"
              ],
              "taughtValues2": [
                "Rot",
                "Blau",
                "Grün",
                "Gelb",
                "Schwarz",
                "Weiß",
                "Braun"
              ]
            }
          },
          {
            "canDo": 3,
            "type": "production",
            "promptDe": "Antworten Sie mit einem Satz. Die Lehrerin: „Ich habe hier einen Stift.“ – Sie: …? – Die Lehrerin: „Er ist blau.“",
            "promptEn": "The teacher has a pen that you cannot see. Ask her one question about its colour.",
            "answer": "Ist der Stift blau oder schwarz?",
            "parts": [
              {
                "label": {
                  "de": "Ihre Frage nach der Farbe",
                  "en": "your question about the colour"
                },
                "forms": [
                  "Welche Farbe hat der Stift?",
                  "Welche Farbe hat er?"
                ],
                "frames": [
                  {
                    "pattern": "Ist der Stift {value}?",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ist er {value}?",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ist der Stift {value} oder blau?",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "Ist der Stift {value} oder grün?",
                    "slots": {
                      "value": "taughtValues3"
                    }
                  },
                  {
                    "pattern": "Ist der Stift {value} oder gelb?",
                    "slots": {
                      "value": "taughtValues4"
                    }
                  },
                  {
                    "pattern": "Ist der Stift {value} oder schwarz?",
                    "slots": {
                      "value": "taughtValues5"
                    }
                  },
                  {
                    "pattern": "Ist der Stift {value} oder weiß?",
                    "slots": {
                      "value": "taughtValues6"
                    }
                  },
                  {
                    "pattern": "Ist der Stift {value} oder braun?",
                    "slots": {
                      "value": "taughtValues7"
                    }
                  },
                  {
                    "pattern": "Ist der Stift {value} oder rot?",
                    "slots": {
                      "value": "taughtValues8"
                    }
                  },
                  {
                    "pattern": "Ist er {value} oder blau?",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "Ist er {value} oder grün?",
                    "slots": {
                      "value": "taughtValues3"
                    }
                  },
                  {
                    "pattern": "Ist er {value} oder gelb?",
                    "slots": {
                      "value": "taughtValues4"
                    }
                  },
                  {
                    "pattern": "Ist er {value} oder schwarz?",
                    "slots": {
                      "value": "taughtValues5"
                    }
                  },
                  {
                    "pattern": "Ist er {value} oder weiß?",
                    "slots": {
                      "value": "taughtValues6"
                    }
                  },
                  {
                    "pattern": "Ist er {value} oder braun?",
                    "slots": {
                      "value": "taughtValues7"
                    }
                  },
                  {
                    "pattern": "Ist er {value} oder rot?",
                    "slots": {
                      "value": "taughtValues8"
                    }
                  }
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                4
              ]
            },
            "micOff": true,
            "sets": {
              "taughtValues1": [
                "rot",
                "blau",
                "grün",
                "gelb",
                "schwarz",
                "weiß",
                "braun"
              ],
              "taughtValues2": [
                "rot",
                "grün",
                "gelb",
                "schwarz",
                "weiß",
                "braun"
              ],
              "taughtValues3": [
                "rot",
                "blau",
                "gelb",
                "schwarz",
                "weiß",
                "braun"
              ],
              "taughtValues4": [
                "rot",
                "blau",
                "grün",
                "schwarz",
                "weiß",
                "braun"
              ],
              "taughtValues5": [
                "rot",
                "blau",
                "grün",
                "gelb",
                "weiß",
                "braun"
              ],
              "taughtValues6": [
                "rot",
                "blau",
                "grün",
                "gelb",
                "schwarz",
                "braun"
              ],
              "taughtValues7": [
                "rot",
                "blau",
                "grün",
                "gelb",
                "schwarz",
                "weiß"
              ],
              "taughtValues8": [
                "blau",
                "grün",
                "gelb",
                "schwarz",
                "weiß",
                "braun"
              ]
            }
          }
        ]
      },
      guided: {
        read: {
          titleDe: 'Tims Zimmer',
          titleEn: 'Tim’s room',
          instructionDe: 'Tim schickt Lena ein Foto und schreibt. Lesen Sie die Nachricht. Tippen Sie auf ein Wort für seine Bedeutung.',
          instructionEn: 'Tim sends Lena a photo and writes to her. Read the message. Tap a word for its meaning.',
          text: 'Hallo Lena!\nDas ist mein Zimmer. Die Wohnung ist alt, aber das Zimmer ist gut.\nDie Tür ist braun und das Fenster ist weiß.\nDer Stuhl ist auch braun. Das Bild ist da: Es ist blau.\nIch habe eine Tafel für Deutsch. Sie ist grün.\nPapier und ein Kugelschreiber sind auch da.\nKommst du morgen? Dann sprechen wir zusammen Deutsch.\nTschüss, Tim',
          questions: [
            {
              promptDe: 'Welche Farbe hat die Tür in Tims Zimmer? Wählen Sie die richtige Antwort.',
              promptEn: 'What colour is the door in Tim’s room? Choose the right answer.',
              options: ['It is white.', 'It is green.', 'It is brown.'],
              answer: 'It is brown.',
              explanationDe: 'Tim schreibt: Die Tür ist braun. Weiß ist das Fenster, grün ist die Tafel.',
              explanationEn: 'Tim writes that the door is brown. The window is white and the board is green.',
            },
            {
              promptDe: 'Was möchte Tim morgen mit Lena machen? Wählen Sie die richtige Antwort.',
              promptEn: 'What would Tim like to do with Lena tomorrow? Choose the right answer.',
              options: ['Speak German together.', 'Buy a picture together.', 'Sell his old chair.'],
              answer: 'Speak German together.',
              explanationDe: 'Tim schreibt: Kommst du morgen? Dann sprechen wir zusammen Deutsch.',
              explanationEn: 'Tim asks whether Lena is coming tomorrow, and says they will then speak German together.',
            },
          ],
        },
        chunks: [
          {
            from: 0,
            to: 2,
            meaning: {
              promptDe: 'Was möchte Lena wissen? Wählen Sie die Bedeutung.',
              promptEn: 'What does Lena want to know? Choose the meaning.',
              options: ['What the dictionary costs.', 'Where the dictionary is.', 'Whose dictionary it is.'],
              answer: 'Where the dictionary is.',
            },
            say: {
              line: 1,
            },
          },
          {
            from: 2,
            to: 4,
            meaning: {
              promptDe: 'Was sagt Tim über die Schere und das Lineal? Wählen Sie die Bedeutung.',
              promptEn: 'What does Tim say about the scissors and the ruler? Choose the meaning.',
              options: ['The scissors are here, and so is the ruler.', 'The scissors are here, but the ruler is not.', 'Lena has the scissors, and Tim has the ruler.'],
              answer: 'The scissors are here, and so is the ruler.',
            },
            say: {
              line: 2,
            },
          },
          {
            from: 4,
            to: 6,
            meaning: {
              promptDe: 'Welche Farben nennt Tim? Wählen Sie die Bedeutung.',
              promptEn: 'Which colours does Tim name? Choose the meaning.',
              options: ['The pen is black and the pencil is blue.', 'The pen is yellow and the pencil is black.', 'The pen is blue and the pencil is yellow.'],
              answer: 'The pen is blue and the pencil is yellow.',
            },
            say: {
              line: 4,
            },
          },
          {
            from: 6,
            to: 8,
            meaning: {
              promptDe: 'Was sagt Tim über das Heft? Wählen Sie die Bedeutung.',
              promptEn: 'What does Tim say about the notebook? Choose the meaning.',
              options: ['It is red, just as Lena thinks.', 'It is not red but green.', 'It is not his notebook at all.'],
              answer: 'It is not red but green.',
            },
            say: {
              line: 7,
            },
          },
          {
            from: 8,
            to: 10,
            meaning: {
              promptDe: 'Was sagt Tim über das Bild? Wählen Sie die Bedeutung.',
              promptEn: 'What does Tim say about the picture? Choose the meaning.',
              options: ['It is blue, and it is for his room.', 'It is green, and it is for Lena.', 'It is black, and it is for the course.'],
              answer: 'It is blue, and it is for his room.',
            },
            say: {
              line: 9,
            },
          },
        ],
      },
      nextHook: {
        de: 'Ana hat Arbeit! Morgen ist ihr erster Tag im Büro. Was braucht sie dort?',
        en: 'Ana has a job! Tomorrow is her first day at the office. What does she need there?',
      },
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
        { de: 'der Kugelschreiber', exampleDe: 'Der Kugelschreiber ist blau.', word: 'Kugelschreiber', article: 'der', plural: 'Kugelschreiber', en: 'ballpoint pen', wordId: 'd862aa1f-12c2-4ea1-9479-529b82466b82' },
        { de: 'das Lineal', word: 'Lineal', article: 'das', plural: 'Lineale', en: 'ruler', wordId: 'bf76aa3d-3725-45de-992a-3a4ec47ef22e' },
        { de: 'die Schere', word: 'Schere', article: 'die', plural: 'Scheren', en: 'scissors', wordId: 'ea766d6a-4335-437e-96fe-7be94fcbbc0b' },
        { de: 'das Papier', exampleDe: 'Das Papier ist weiß.', word: 'Papier', article: 'das', plural: 'Papiere', en: 'paper', wordId: '1824e1ce-6c7e-4835-b429-744e5190e427' },
        { de: 'die Tafel', exampleDe: 'Die Tafel ist grün.', word: 'Tafel', article: 'die', plural: 'Tafeln', en: 'blackboard', wordId: 'dac0b162-56bd-430c-aeba-61638d7f5b5c' },
        { de: 'die Tür', exampleDe: 'Die Tür ist braun.', word: 'Tür', article: 'die', plural: 'Türen', en: 'door', wordId: '3230fcc5-e7b4-4725-8ad0-82a8b07f513f' },
        { de: 'das Fenster', exampleDe: 'Das Fenster ist weiß.', word: 'Fenster', article: 'das', plural: 'Fenster', en: 'window', wordId: '4ab2f19d-9398-4738-ab8c-0521d9eb9b42' },
        { de: 'das Wörterbuch', word: 'Wörterbuch', article: 'das', plural: 'Wörterbücher', en: 'dictionary', wordId: 'abc566d0-3ab7-4aec-bbc5-8f6b77ad484b' },
        // Grundschulwortschatz (Mäppchen, Spitzer, Radiergummi, Kreide) replaced by the Wohnen lexis
        // the Goethe A1 Wortliste and SD1 Lesen Teil 2 actually use (DaF review, L5).
        { de: 'das Zimmer', word: 'Zimmer', article: 'das', plural: 'Zimmer', en: 'room', wordId: '7c015007-2252-43ae-9c30-9ac8a82c9831' },
        { de: 'die Wohnung', exampleDe: 'Die Wohnung ist hier.', word: 'Wohnung', article: 'die', plural: 'Wohnungen', en: 'flat, apartment', wordId: 'd46d546b-f0f1-4cab-818e-0e99a09b355d' },
        { de: 'der Schlüssel', word: 'Schlüssel', article: 'der', plural: 'Schlüssel', en: 'key', wordId: '1b3689de-3eee-4947-8ddd-c1b4fcada95b' },
        { de: 'das Bild', word: 'Bild', article: 'das', plural: 'Bilder', en: 'picture', wordId: '358ec9f0-c571-453a-a5c5-7e88ef81d1b8' },
        { de: 'die Farbe', word: 'Farbe', article: 'die', plural: 'Farben', en: 'color', field: true, wordId: '9a35fe92-fc2d-42af-a718-7c6cf48a9984' },
        { de: 'rot', word: 'rot', article: null, plural: null, en: 'red', wordId: 'fd89afcf-f470-4427-8ab4-d88fb9d35c06' },
        { de: 'blau', word: 'blau', article: null, plural: null, en: 'blue', wordId: 'f5d65f53-08bd-40ec-b859-16ebe6143ba8' },
        { de: 'grün', word: 'grün', article: null, plural: null, en: 'green', wordId: 'a86cb4d8-541f-4335-bff1-150dac102f32' },
        { de: 'gelb', word: 'gelb', article: null, plural: null, en: 'yellow', wordId: 'ff86b605-e582-4f04-b5c4-27d5e494bb4f' },
        { de: 'schwarz', word: 'schwarz', article: null, plural: null, en: 'black', wordId: 'fc5c8341-a794-4c0a-a81b-7bd4a0082470' },
        { de: 'weiß', exampleDe: 'Das Heft ist weiß.', word: 'weiß', article: null, plural: null, en: 'white', wordId: 'aaf238a5-d301-4ba3-953c-436fb603f6dc' },
        { de: 'braun', exampleDe: 'Der Tisch ist braun.', word: 'braun', article: null, plural: null, en: 'brown', wordId: '81f06668-01d2-4e8d-aff7-5d8fc0f6b9b1' },
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
          // `die Farbe` is a FIELD of the graded Formular of this Lektion („Farbe: grün“) and stood
          // on no input surface — the dialogue named seven colours and never the word (round 18,
          // DaF review #17, Minor 15 / RULE 23b, hard 0). Index 8 is in neither window ([1,5]
          // dictation, [4,7] read-aloud), so nothing else moves.
          // ROUND 19 (DaF review #18, Minor 20): round 18 wrote „Und die Farbe vom Bild?“ — spoken,
          // correct German, and a Dativ (`vom` = von dem) in the Lektion whose notice defers the
          // Dativ to A1.2, put there only so that `Farbe` had a surface. The question is now asked
          // the way this Lektion asks everything (Wo ist …? Ist … blau?), with no case the level
          // has not taught. ROUND 20 (DaF review #19, Minor 26): round 19 wrote „Ist die Farbe
          // blau?“ — grammatical, and a sentence nobody says (one asks „Ist es blau?“); it showed
          // that `Farbe` had to go in. The question is now the one in which the colour IS the
          // topic: „Welche Farbe hat das Bild?“ — Tim: „Es ist blau.“ `welche` and `hat` are
          // function words the level counts as taught from L1 (`FUNCTION_WORDS`, top of this
          // file); `hat` here is input, not production — index 8 is in neither window ([1,5]
          // dictation, [4,7] read-aloud), and the L8 notice teaches the chunk before L9 owns the
          // verb (file header).
          // Nine words each (counted 2026-09-14), two sentences each; Tim's answer keeps `das Bild`
          // as its second surface.
          // `der Schlüssel` keeps its line; `in der Tasche` is the one Dativ the line always had,
          // and the setting („packen ihre Taschen aus“) carries `die Tasche` as well.
          { speaker: 'Lena', de: 'Mein Schlüssel ist da. Welche Farbe hat das Bild?', en: 'My key is there. What colour is the picture?' },
          { speaker: 'Tim', de: 'Es ist blau. Das Bild ist für mein Zimmer.', en: 'It is blue. The picture is for my room.' },
        ],
      },
      pretest: { promptDe: 'Fragen Sie, wo das Buch ist.', promptEn: 'Ask where the book is.', model: 'Wo ist das Buch?', accepted: ['Wo ist', 'Wo sind'] },
      notice: {
        title: 'der, die, das – der bestimmte Artikel',
        bodyDe: 'Der bestimmte Artikel zeigt: Wir wissen, welche Sache gemeint ist. **der** (maskulin), **die** (feminin), **das** (neutral), im Plural für alle drei **die**: die Bücher. Zuerst antworten Sie mit **hier** oder **da**. Sätze wie *auf dem Tisch* (Dativ) folgen in A1.2.',
        bodyEn: 'The definite article ("the") means both speakers know which thing is meant: **der** with masculine, **die** with feminine, **das** with neuter nouns – and in the plural always **die**: **die Bücher**. For now, answer **Wo ist …?** with **hier** (here) or **da** (there): **Das Wörterbuch ist hier. Der Stift ist da.** Phrases like *auf dem Tisch* (on the table) change the article again; that pattern (Dativ) is A1.2.',
        examples: ['Das Wörterbuch ist hier. Der Stift ist da.', 'Die Schere ist hier. Das Lineal auch.'],
        ruleSlug: 'definite-articles',
      },
      phonetik: { focus: 'sch – s – z: Schere, sechs, zehn', focusEn: 'sch – s – z: Schere, sechs, zehn', items: ['SCHE-re', 'SECHS', 'ZEHN'] },
      hoeren: { kind: 'dictation', lines: [1, 5] },
      sprechen: {
        readAloud: [4, 7],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie zum Thema Kursraum: Buch? Tafel? Farbe?',
          promptEn: 'Ask and answer questions about the classroom: the book? the board? the colour?',
          hintWords: ['der Stift', 'die Tafel', 'blau'],
          // Sie — Teil 2 mit einer fremden Mitkandidatin im Prüfungsraum.
          anrede: 'Sie',
          missionOrder: 3,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a11-l05',
        taskDe: 'Lena Brandt ist im Kurs A1. Ihr Kurs ist in Zimmer 12. Auf dem Tisch sind ein Wörterbuch und ein Heft. Das Heft ist grün. Füllen Sie die Liste für das Kursmaterial aus.',
        taskEn: 'Lena Brandt is in course A1. Her course is in room 12. On the table there are a dictionary and an exercise book. The exercise book is green. Fill in the list of course materials (name, course, room, material, colour).',
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
      flow: 'guided',
      proof: {
        "tasks": [
          {
            "canDo": 0,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Herr Weber: „Das ist Ihr Büro.“ Kein Computer, kein Telefon! – Sie: … …",
            "promptEn": "Herr Weber shows you your office, but there is no computer and no telephone. Thank him, then say in one sentence that you need both.",
            "answer": "Ich brauche einen Computer und ein Telefon.",
            "parts": [
              {
                "label": {
                  "de": "was Sie brauchen",
                  "en": "what you need"
                },
                "forms": [
                  "Ich brauche einen Computer und ein Telefon.",
                  "Ich brauche ein Telefon und einen Computer.",
                  "Wir brauchen einen Computer und ein Telefon.",
                  "Wir brauchen ein Telefon und einen Computer.",
                  "Ich brauche noch einen Computer und ein Telefon.",
                  "Ich brauche noch ein Telefon und einen Computer.",
                  "Aber ich brauche einen Computer und ein Telefon.",
                  "Aber ich brauche ein Telefon und einen Computer.",
                  "Ich brauche einen Computer. Ich brauche ein Telefon.",
                  "Ich brauche ein Telefon. Ich brauche einen Computer."
                ],
                "maxSentences": 2
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                2
              ]
            },
            "micOff": true,
            "firstContact": true
          },
          {
            "canDo": 1,
            "type": "production",
            "ownName": "full",
            "openings": [
              "Ich heiße"
            ],
            "promptDe": "Antworten Sie mit einem Satz. Das Telefon im Büro. Ein Kollege: „Entschuldigung, wie heißen Sie?“ – Sie: …",
            "promptEn": "The office telephone rings. A colleague you do not know asks for your name. Answer in a full sentence with your own name, as you learned in Lektion 1.",
            "answer": "Ich heiße Ana Chakiri.",
            "parts": [
              {
                "label": {
                  "de": "Ihr Name im ganzen Satz (mit heißen)",
                  "en": "your name in a full sentence (with heißen)"
                },
                "forms": [
                  "Ich heiße Ana Chakiri."
                ]
              }
            ],
            "reteach": {
              "kind": "wortfeld",
              "index": 18
            },
            "micOff": true,
            "firstContact": true
          },
          {
            "canDo": 2,
            "type": "listening",
            "promptDe": "Hören Sie die Telefonnummer vom Büro und die Handynummer. Wählen Sie.",
            "promptEn": "Listen to both phone numbers. Choose the note with both right.",
            "answer": "Büro: 042 3381, Handy: 0176 234567",
            "reteach": {
              "kind": "dialog",
              "indices": [
                6,
                7
              ]
            },
            "micOff": true,
            "mode": "choice",
            "instances": [
              {
                "answer": "Büro: 042 3381, Handy: 0176 234567",
                "accepted": [
                  "Büro: 042 3381, Handy: 0176 234567"
                ],
                "options": [
                  "Büro: 042 3318, Handy: 0176 234567",
                  "Büro: 042 3381, Handy: 0167 234567",
                  "Büro: 042 3381, Handy: 0176 234567",
                  "Büro: 024 3381, Handy: 0176 234576"
                ],
                "audioText": "Die Telefonnummer vom Büro ist null vier zwei, drei drei acht eins. Meine Handynummer ist null eins sieben sechs, zwei drei vier fünf sechs sieben."
              },
              {
                "audioText": "Die Telefonnummer vom Büro ist null vier zwei, drei drei eins acht. Meine Handynummer ist null eins sechs sieben, zwei drei vier fünf sechs sieben.",
                "answer": "Büro: 042 3318, Handy: 0167 234567",
                "accepted": [
                  "Büro: 042 3318, Handy: 0167 234567"
                ],
                "options": [
                  "Büro: 042 3381, Handy: 0167 234567",
                  "Büro: 042 3318, Handy: 0176 234567",
                  "Büro: 042 3318, Handy: 0167 234567",
                  "Büro: 024 3318, Handy: 0167 234576"
                ]
              }
            ]
          },
          {
            "canDo": 3,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Sie: …? – Herr Weber: „Die Nummer vom Büro ist null vier zwei – drei drei acht eins.“ – Sie: …! …? – Herr Weber: „Die Pause ist um eins.“",
            "promptEn": "It is your day at the office. Ask Herr Weber for the office telephone number. He tells you: thank him ask when the break is.",
            "answer": "Wie ist die Telefonnummer? Danke! Wann ist die Pause?",
            "parts": [
              {
                "label": {
                  "de": "die Frage nach der Nummer vom Büro",
                  "en": "the question about the office number"
                },
                "forms": [
                  "Wie ist die Telefonnummer?",
                  "Und wie ist die Telefonnummer?",
                  "Wie ist die Telefonnummer vom Büro?",
                  "Und wie ist die Telefonnummer vom Büro?",
                  "Wie ist die Telefonnummer im Büro?",
                  "Wie ist die Nummer?",
                  "Wie ist die Nummer vom Büro?",
                  "Wie ist die Telefonnummer, bitte?",
                  "Entschuldigung, wie ist die Telefonnummer?",
                  "Entschuldigung, wie ist die Telefonnummer vom Büro?",
                  "Wie ist Ihre Telefonnummer?",
                  "Wie ist meine Telefonnummer?"
                ]
              },
              {
                "label": {
                  "de": "die Frage nach der Pause",
                  "en": "the question about the break"
                },
                "forms": [
                  "Wann ist die Pause?",
                  "Und wann ist die Pause?",
                  "Wann ist Pause?",
                  "Und wann ist Pause?",
                  "Wann ist die Pause, bitte?",
                  "Wann ist meine Pause?",
                  "Wann machen wir Pause?",
                  "Wann machen wir eine Pause?",
                  "Wann haben wir Pause?",
                  "Wann habe ich Pause?"
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                6,
                8
              ]
            },
            "micOff": true,
            "order": "any"
          }
        ]
      },
      guided: {
        sets: [FULL_HOUR],
        read: {
          titleDe: 'Eine Nachricht von der Chefin',
          titleEn: 'A note from the boss',
          instructionDe: 'Ana findet im Büro eine Nachricht. Lesen Sie die Nachricht. Tippen Sie auf ein Wort für seine Bedeutung.',
          instructionEn: 'Ana finds a note in the office. Read the note. Tap a word for its meaning.',
          text: 'Guten Morgen, Ana! Willkommen im Büro!\nIch bin Frau Berg, Ihre Chefin. Der Chef vom Amt kommt um zehn.\nIhr Kollege ist Ingenieur. Ihre Kollegin ist auch Ingenieurin.\nSie haben noch kein Handy. Die Firma Thomas verkauft Handys.\nUm elf kommt ein Verkäufer oder eine Verkäuferin von der Firma.\nDann brauche ich Ihre Handynummer und Ihre E-Mail-Adresse.\nUnd die Arbeit? Das machen wir zusammen.\nBis dann!',
          questions: [
            {
              promptDe: 'Wer kommt um elf ins Büro? Wählen Sie die richtige Antwort.',
              promptEn: 'Who comes to the office at eleven? Choose the right answer.',
              options: ['The head of the public office.', 'A salesperson from a company.', 'A colleague who is an engineer.'],
              answer: 'A salesperson from a company.',
              explanationDe: 'Frau Berg schreibt: Um elf kommt ein Verkäufer oder eine Verkäuferin von der Firma. Der Chef vom Amt kommt um zehn.',
              explanationEn: 'Frau Berg writes that a salesman or saleswoman from the company comes at eleven. The head of the office comes at ten.',
            },
            {
              promptDe: 'Was braucht Frau Berg von Ana? Wählen Sie die richtige Antwort.',
              promptEn: 'What does Frau Berg need from Ana? Choose the right answer.',
              options: ['Her mobile number and her email address.', 'Her home address and her date of birth.', 'Her computer and her office telephone.'],
              answer: 'Her mobile number and her email address.',
              explanationDe: 'Frau Berg schreibt: Dann brauche ich Ihre Handynummer und Ihre E-Mail-Adresse.',
              explanationEn: 'Frau Berg writes that she then needs Ana’s mobile number and her email address.',
            },
          ],
        },
        chunks: [
          {
            from: 0,
            to: 2,
            meaning: {
              promptDe: 'Was macht Herr Weber? Wählen Sie die Bedeutung.',
              promptEn: 'What does Herr Weber do? Choose the meaning.',
              options: ['He greets Ana and asks for her name.', 'He greets Ana and gives her a form.', 'He greets Ana and shows her the office.'],
              answer: 'He greets Ana and shows her the office.',
            },
            say: {
              line: 0,
            },
          },
          {
            from: 2,
            to: 4,
            meaning: {
              promptDe: 'Was braucht Ana im Büro? Wählen Sie die Bedeutung.',
              promptEn: 'What does Ana need in the office? Choose the meaning.',
              options: ['A computer and a telephone.', 'A table and a mobile phone.', 'A form and a key.'],
              answer: 'A computer and a telephone.',
            },
            say: {
              line: 2,
            },
          },
          {
            from: 4,
            to: 6,
            meaning: {
              promptDe: 'Was sagt Herr Weber über ein Handy? Wählen Sie die Bedeutung.',
              promptEn: 'What does Herr Weber say about a mobile phone? Choose the meaning.',
              options: ['Ana gets a mobile phone tomorrow.', 'The office has no mobile phone.', 'The mobile phone is too expensive.'],
              answer: 'The office has no mobile phone.',
            },
            say: {
              line: 4,
            },
          },
          {
            from: 6,
            to: 8,
            meaning: {
              promptDe: 'Was möchte Ana wissen? Wählen Sie die Bedeutung.',
              promptEn: 'What does Ana want to know? Choose the meaning.',
              options: ['The name of her colleague.', 'The address of the office.', 'The office telephone number.'],
              answer: 'The office telephone number.',
            },
            say: {
              line: 6,
            },
          },
          {
            from: 8,
            to: 10,
            meaning: {
              promptDe: 'Was sagt Herr Weber über die Pause? Wählen Sie die Bedeutung.',
              promptEn: 'What does Herr Weber say about the break? Choose the meaning.',
              options: ['The break is at one o’clock.', 'The break lasts one hour.', 'There is no break today.'],
              answer: 'The break is at one o’clock.',
            },
            say: {
              line: 8,
            },
          },
        ],
      },
      nextHook: {
        de: 'Nach der Arbeit kommt das Wochenende. Was machen Lena und Tim gern – und was machen Sie gern?',
        en: 'After work comes the weekend. What do Lena and Tim like doing – and what do you like doing?',
      },
      title: 'Der erste Tag im Büro',
      situation: 'Büro, Technik und Telefon',
      handlungsfeld: 'Arbeit und Beruf: am Arbeitsplatz zurechtkommen',
      canDo: [
        'Ich kann sagen, was ich brauche.',
        'Ich kann am Telefon meinen Namen nennen.',
        // ROUND 17 (RULE 12 split): `notieren` occurs in no line, no item and no prompt of this
        // Lektion — the Lektion hears numbers, it does not write them down. Both halves now name
        // something it rehearses.
        'Ich kann eine Telefonnummer und eine Handynummer verstehen.',
        // ROUND 17 (RULE 12 split): `Arbeitszeiten` is in no surface of the Lektion; „das Büro“ is
        // in its dialogue, its model text and its speaking prompt.
        'Ich kann nach der Pause und nach dem Büro fragen.',
      ],
      examTeile: ['Hören Teil 3', 'Schreiben Teil 2', 'Sprechen Teil 2'],
      grammarSlugs: ['indefinite-articles', 'definite-articles', 'nouns-gender'],
      primarySlug: 'indefinite-articles',
      minutes: 15,
      wortfeld: [
        { de: 'das Büro', word: 'Büro', article: 'das', plural: 'Büros', en: 'office', wordId: '8fbe2c10-b65b-4c50-b60a-14d92b931783' },
        { de: 'die Firma', exampleDe: 'Das ist eine Firma. Das Büro ist hier.', word: 'Firma', article: 'die', plural: 'Firmen', en: 'company', wordId: '241df305-fc58-4232-bb0a-df8ce4cc9d01' },
        { de: 'der Chef', exampleDe: 'Herr Weber ist der Chef.', word: 'Chef', article: 'der', plural: 'Chefs', en: 'boss (m)', wordId: '40ac179d-e47c-4c64-8eb3-9e1017da46a0' },
        { de: 'die Chefin', exampleDe: 'Frau Kaya ist die Chefin.', word: 'Chefin', article: 'die', plural: 'Chefinnen', en: 'boss (f)', wordId: 'a9179b77-b31b-43d0-9f53-4df8ba9c3a27' },
        { de: 'der Kollege', word: 'Kollege', article: 'der', plural: 'Kollegen', en: 'colleague (m)', wordId: '81abf8c3-ae9f-4e61-9fa9-b4a10e0b0ae8' },
        { de: 'die Kollegin', exampleDe: 'Die Kollegin heißt Lena.', word: 'Kollegin', article: 'die', plural: 'Kolleginnen', en: 'colleague (f)', wordId: 'dfb0bc97-919c-4f20-9efd-59b78a541197' },
        { de: 'die Arbeit', exampleDe: 'Die Arbeit ist im Büro.', word: 'Arbeit', article: 'die', plural: '—', en: 'work', wordId: '89ff21bb-79ad-470a-a29b-ff6bbeef344a' },
        { de: 'der Computer', word: 'Computer', article: 'der', plural: 'Computer', en: 'computer', wordId: 'b75584fd-ce50-433c-9deb-dc2c35906c15' },
        { de: 'die Handynummer', exampleDe: 'Die Handynummer ist 0176 234567.', word: 'Handynummer', article: 'die', plural: 'Handynummern', en: 'mobile number', field: true, wordId: '58fdee72-2812-4256-8f4b-7e6142c10b12' },
        { de: 'die E-Mail-Adresse', exampleDe: 'Wie ist die E-Mail-Adresse?', word: 'E-Mail-Adresse', article: 'die', plural: 'E-Mail-Adressen', en: 'email address', field: true, wordId: '7a4581a1-0411-425b-b230-95840777b557' },
        { de: 'der Ingenieur', word: 'Ingenieur', article: 'der', plural: 'Ingenieure', en: 'engineer (m)', wordId: 'a358f9d4-ef56-451c-8139-8a210b7a122f' },
        { de: 'die Ingenieurin', exampleDe: 'Die Kollegin ist Ingenieurin.', word: 'Ingenieurin', article: 'die', plural: 'Ingenieurinnen', en: 'engineer (f)', wordId: '19f79c25-b6b5-4ec9-b9b7-c56515c68da8' },
        { de: 'der Verkäufer', exampleDe: 'Der Mann ist Verkäufer.', word: 'Verkäufer', article: 'der', plural: 'Verkäufer', en: 'salesperson (m)', wordId: '497a6825-36c3-4af5-aaf5-5e70dafdbb4f' },
        { de: 'die Verkäuferin', exampleDe: 'Die Frau ist Verkäuferin.', word: 'Verkäuferin', article: 'die', plural: 'Verkäuferinnen', en: 'salesperson (f)', wordId: '1b7e9803-1125-4b4a-a392-79b59fa69dfa' },
        { de: 'die Pause', word: 'Pause', article: 'die', plural: 'Pausen', en: 'break', wordId: 'c1c71f2f-1cea-437b-b2ae-5cce152ee9a4' },
        { de: 'die Nummer', exampleDe: 'Die Nummer ist 123.', word: 'Nummer', article: 'die', plural: 'Nummern', en: 'number', field: true, wordId: '83a14b7b-33f9-4972-9001-72c42442f14d' },
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
          { speaker: 'Herr Weber', de: 'Hier sind ein Computer und ein Telefon. Ihr Kollege ist Ingenieur.', en: 'Here are a computer and a telephone. Your colleague is an engineer.' },
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
        formExamples: ['kaufen: Ich kaufe ein Handy.'],
        title: 'ein, eine – der unbestimmte Artikel',
        bodyDe: 'Neu oder unbekannt? Dann **ein** (der/das) oder **eine** (die): ein Computer, eine Lampe. Nach Verben wie **brauchen**, **haben**, **kaufen** wird maskulin **ein → einen**: Ich brauche **einen** Computer (Akkusativ — die Regel kommt in A1.2). Verneinung mit **kein**: Wir haben **kein** Handy. Die Uhrzeit **um eins** kennen Sie schon.',
        bodyEn: 'For something new or not yet known, use the indefinite article ("a"): **ein** with der- and das-nouns (**ein** Computer), **eine** with die-nouns (**eine** Lampe). After verbs like **brauchen** (need), **haben** (have) and **kaufen** (buy), the masculine **ein** becomes **einen**: **Ich brauche einen Computer.** The rule behind it (Akkusativ) is A1.2 – copy the form for now. "No / not a" is **kein**: **Wir haben kein Handy.** The time phrase **um eins** means at one.',
        examples: ['Danke. Ich brauche einen Computer und ein Telefon.', 'Wir haben kein Handy.'],
        ruleSlug: 'indefinite-articles',
      },
      phonetik: { focus: 'Lange Vokale: vier, Telefon, Büro', focusEn: 'Long vowels: vier, Telefon, Büro', items: ['VIER', 'Te-le-FON', 'Bü-RO'] },
      // Dictate the phone number: the shared checker folds digit grouping and spoken numbers.
      // The clock-time line waits until L8, where its form is taught.
      hoeren: { kind: 'dictation', lines: [2, 7] },
      sprechen: {
        // Zeile 2 war bis Runde 12 zugleich Diktatzeile — Diktat und Vorlesen arbeiteten am
        // selben Satz (RULE 18). Zeile 4 („Und ein Handy?“) ist frei: der unbestimmte Artikel
        // ist genau das Thema DIESER Lektion.
        readAloud: [4, 6],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie zum Thema Arbeit: Büro? Beruf? Pause?',
          promptEn: 'Ask and answer questions about work: the office? your job? the break?',
          hintWords: ['der Verkäufer', 'die Ingenieurin', 'die Pause'],
          // Sie — Teil 2 zum Thema Arbeit: das Gegenüber ist Kollegin/Mitkandidatin, keine Freundin.
          anrede: 'Sie',
          missionOrder: 4,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a11-l06',
        taskDe: 'Schreiben Sie Ihrer Chefin, Frau Berg, eine kurze Nachricht. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        taskEn: 'Write a short message to your boss, Frau Berg. Open with a greeting and close with a sign-off. Cover three points: what you need; your phone number; when you will be in the office.',
        leitpunkte: ['Was Sie brauchen', 'Ihre Telefonnummer', 'Wann Sie im Büro sind'],
        minWords: 25,
        maxWords: 45,
        // 39 Wörter. „Die Nummer“ war die RULE-15b-Reparatur der Runde 12 für „Meine Nummer“ und
        // hat den Leitpunkt „Ihre Telefonnummer“ mitgenommen (DaF review #12, MAJOR 2); das Wort
        // selbst ist L2-Wortfeld und braucht keinen Possessivartikel.
        // 37 Wörter. ROUND 16 (DaF review #15, MAJOR 1, RULE 22): „Die Telefonnummer ist …“ und
        // „Die Nummer ist für das Handy.“ waren zwei der fünf Formularsätze des Kurses — zwei
        // Feldzeilen für einen Leitpunkt. Sie werden EIN Satz, der die Nummer übergibt, statt sie
        // zu beschriften. Der Possessivartikel („Meine Nummer ist …“) wäre die natürlichste
        // Fassung, steht hier aber nicht: RULE 15b schiebt die Possessivartikel auf Lektion 12, und
        // ein Mustertext ist ein Produktionstext.
        sample: 'Guten Tag, Frau Berg! Wir brauchen einen Computer und ein Handy. Hier ist die Telefonnummer: null vier zwei drei drei acht eins. Ich bin um neun Uhr im Büro. Viele Grüße, Ana',
      },
      links: { listeningExercise: 5, readingOrder: null },
      practiceRule: { topics: ['indefinite-articles', 'definite-articles'], typedMin: 3 },
    },
    {
      nr: 7,
      id: 'a1.1-l07',
      slug: 'freizeit-und-hobbys',
      flow: 'guided',
      proof: {
        "tasks": [
          {
            "canDo": 0,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Eine Kollegin: „Was ist Ihr Hobby?“ – Sie: … Ich …",
            "promptEn": "A colleague asks about your hobby. Name your hobby add one sentence about what you do, for example when or how often. Use the hobbies and activities of this Lektion.",
            "answer": "Mein Hobby ist Sport. Ich spiele am Wochenende Fußball.",
            "parts": [
              {
                "label": {
                  "de": "Ihr Hobby",
                  "en": "your hobby"
                },
                "forms": [
                  "Mein Hobby ist Musik hören.",
                  "Mein Hobby ist Fußball spielen."
                ],
                "frames": [
                  {
                    "pattern": "Mein Hobby ist {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "{value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Meine Hobbys sind {value} und Musik.",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "Meine Hobbys sind {value} und Fußball.",
                    "slots": {
                      "value": "taughtValues3"
                    }
                  },
                  {
                    "pattern": "Meine Hobbys sind {value} und Kino.",
                    "slots": {
                      "value": "taughtValues4"
                    }
                  },
                  {
                    "pattern": "Meine Hobbys sind {value} und Lesen.",
                    "slots": {
                      "value": "taughtValues5"
                    }
                  },
                  {
                    "pattern": "Meine Hobbys sind {value} und Schwimmen.",
                    "slots": {
                      "value": "taughtValues6"
                    }
                  },
                  {
                    "pattern": "Meine Hobbys sind {value} und Kochen.",
                    "slots": {
                      "value": "taughtValues7"
                    }
                  },
                  {
                    "pattern": "Meine Hobbys sind {value} und Tanzen.",
                    "slots": {
                      "value": "taughtValues8"
                    }
                  },
                  {
                    "pattern": "Meine Hobbys sind {value} und Sport.",
                    "slots": {
                      "value": "taughtValues9"
                    }
                  }
                ]
              },
              {
                "label": {
                  "de": "was Sie machen (ein Satz mit Verb)",
                  "en": "what you do (one sentence with a verb)"
                },
                "forms": [],
                "frames": [
                  {
                    "pattern": "Ich {value} am Wochenende.",
                    "slots": {
                      "value": "taughtValues10"
                    }
                  },
                  {
                    "pattern": "Am Wochenende {value} ich.",
                    "slots": {
                      "value": "taughtValues10"
                    }
                  },
                  {
                    "pattern": "Ich {value} jede Woche.",
                    "slots": {
                      "value": "taughtValues10"
                    }
                  },
                  {
                    "pattern": "Ich {value}.",
                    "slots": {
                      "value": "taughtValues11"
                    }
                  },
                  {
                    "pattern": "Ich {value} gern.",
                    "slots": {
                      "value": "taughtValues11"
                    }
                  },
                  {
                    "pattern": "Ich {value} gerne.",
                    "slots": {
                      "value": "taughtValues11"
                    }
                  },
                  {
                    "pattern": "Ich {value} am Wochenende gern.",
                    "slots": {
                      "value": "taughtValues11"
                    }
                  },
                  {
                    "pattern": "Am Wochenende {value} ich gern.",
                    "slots": {
                      "value": "taughtValues11"
                    }
                  },
                  {
                    "pattern": "Jede Woche {value} ich.",
                    "slots": {
                      "value": "taughtValues11"
                    }
                  },
                  {
                    "pattern": "Ich {value} immer.",
                    "slots": {
                      "value": "taughtValues11"
                    }
                  },
                  {
                    "pattern": "Und ich {value}.",
                    "slots": {
                      "value": "taughtValues11"
                    }
                  },
                  {
                    "pattern": "Und ich {value} gern.",
                    "slots": {
                      "value": "taughtValues11"
                    }
                  },
                  {
                    "pattern": "Und ich {value} am Wochenende.",
                    "slots": {
                      "value": "taughtValues11"
                    }
                  },
                  {
                    "pattern": "Ich höre {value} Musik.",
                    "slots": {
                      "value": "taughtValues12"
                    }
                  },
                  {
                    "pattern": "Ich spiele {value} Fußball.",
                    "slots": {
                      "value": "taughtValues12"
                    }
                  },
                  {
                    "pattern": "Ich lese {value} Bücher.",
                    "slots": {
                      "value": "taughtValues12"
                    }
                  },
                  {
                    "pattern": "Ich gehe {value} ins Kino.",
                    "slots": {
                      "value": "taughtValues12"
                    }
                  },
                  {
                    "pattern": "Ich mache {value} Sport.",
                    "slots": {
                      "value": "taughtValues12"
                    }
                  },
                  {
                    "pattern": "Ich {value} am Wochenende.",
                    "slots": {
                      "value": "taughtPhrases13"
                    }
                  },
                  {
                    "pattern": "Und ich {value}.",
                    "slots": {
                      "value": "taughtPhrases14"
                    }
                  },
                  {
                    "pattern": "Am Wochenende {value}.",
                    "slots": {
                      "value": "taughtPhrases15"
                    }
                  },
                  {
                    "pattern": "Ich {value} jede Woche.",
                    "slots": {
                      "value": "taughtPhrases16"
                    }
                  },
                  {
                    "pattern": "Jede Woche {value}.",
                    "slots": {
                      "value": "taughtPhrases17"
                    }
                  },
                  {
                    "pattern": "Ich spiele {value}.",
                    "slots": {
                      "value": "taughtPhrases18"
                    }
                  },
                  {
                    "pattern": "Ich mache {value}.",
                    "slots": {
                      "value": "taughtPhrases19"
                    }
                  },
                  {
                    "pattern": "Ich gehe {value} Kino.",
                    "slots": {
                      "value": "taughtPhrases20"
                    }
                  },
                  {
                    "pattern": "Ich höre {value}.",
                    "slots": {
                      "value": "taughtPhrases21"
                    }
                  },
                  {
                    "pattern": "Ich lese {value}.",
                    "slots": {
                      "value": "taughtPhrases22"
                    }
                  }
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                2
              ]
            },
            "micOff": true,
            "order": "any",
            "sets": {
              "taughtValues1": [
                "Sport",
                "Musik",
                "Fußball",
                "Kino",
                "Lesen",
                "Schwimmen",
                "Kochen",
                "Tanzen"
              ],
              "taughtValues2": [
                "Sport",
                "Fußball",
                "Kino",
                "Lesen",
                "Schwimmen",
                "Kochen",
                "Tanzen"
              ],
              "taughtValues3": [
                "Sport",
                "Musik",
                "Kino",
                "Lesen",
                "Schwimmen",
                "Kochen",
                "Tanzen"
              ],
              "taughtValues4": [
                "Sport",
                "Musik",
                "Fußball",
                "Lesen",
                "Schwimmen",
                "Kochen",
                "Tanzen"
              ],
              "taughtValues5": [
                "Sport",
                "Musik",
                "Fußball",
                "Kino",
                "Schwimmen",
                "Kochen",
                "Tanzen"
              ],
              "taughtValues6": [
                "Sport",
                "Musik",
                "Fußball",
                "Kino",
                "Lesen",
                "Kochen",
                "Tanzen"
              ],
              "taughtValues7": [
                "Sport",
                "Musik",
                "Fußball",
                "Kino",
                "Lesen",
                "Schwimmen",
                "Tanzen"
              ],
              "taughtValues8": [
                "Sport",
                "Musik",
                "Fußball",
                "Kino",
                "Lesen",
                "Schwimmen",
                "Kochen"
              ],
              "taughtValues9": [
                "Musik",
                "Fußball",
                "Kino",
                "Lesen",
                "Schwimmen",
                "Kochen",
                "Tanzen"
              ],
              "taughtValues10": [
                "lese",
                "koche",
                "schwimme",
                "tanze",
                "spiele"
              ],
              "taughtValues11": [
                "lese",
                "koche",
                "schwimme",
                "tanze"
              ],
              "taughtValues12": [
                "gern",
                "gerne",
                "immer"
              ],
              "taughtPhrases13": [
                "höre Musik",
                "höre gern Musik",
                "spiele Fußball",
                "spiele gern Fußball",
                "lese Bücher",
                "lese gern Bücher",
                "gehe ins Kino",
                "gehe gern ins Kino",
                "mache Sport",
                "mache gern Sport"
              ],
              "taughtPhrases14": [
                "höre Musik",
                "höre gern Musik",
                "höre am Wochenende Musik",
                "spiele Fußball",
                "spiele gern Fußball",
                "spiele am Wochenende Fußball",
                "lese Bücher",
                "lese gern Bücher",
                "lese am Wochenende Bücher",
                "gehe ins Kino",
                "gehe gern ins Kino",
                "gehe am Wochenende ins Kino",
                "mache Sport",
                "mache gern Sport",
                "mache am Wochenende Sport"
              ],
              "taughtPhrases15": [
                "höre ich Musik",
                "höre ich gern Musik",
                "spiele ich Fußball",
                "spiele ich gern Fußball",
                "lese ich Bücher",
                "lese ich gern Bücher",
                "gehe ich ins Kino",
                "gehe ich gern ins Kino",
                "mache ich Sport",
                "mache ich gern Sport"
              ],
              "taughtPhrases16": [
                "höre Musik",
                "spiele Fußball",
                "lese Bücher",
                "gehe ins Kino",
                "mache Sport"
              ],
              "taughtPhrases17": [
                "höre ich Musik",
                "spiele ich Fußball",
                "lese ich Bücher",
                "gehe ich ins Kino",
                "mache ich Sport"
              ],
              "taughtPhrases18": [
                "Fußball",
                "am Wochenende Fußball",
                "am Wochenende gern Fußball",
                "jede Woche Fußball",
                "Fußball gern"
              ],
              "taughtPhrases19": [
                "Sport",
                "am Wochenende Sport",
                "am Wochenende gern Sport",
                "jede Woche Sport",
                "Sport gern"
              ],
              "taughtPhrases20": [
                "ins",
                "am Wochenende ins",
                "am Wochenende gern ins",
                "jede Woche ins"
              ],
              "taughtPhrases21": [
                "Musik",
                "am Wochenende Musik",
                "am Wochenende gern Musik",
                "jede Woche Musik",
                "Musik gern"
              ],
              "taughtPhrases22": [
                "Bücher",
                "am Wochenende Bücher",
                "am Wochenende gern Bücher",
                "jede Woche Bücher",
                "Bücher gern"
              ]
            }
          },
          {
            "canDo": 1,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Eine Kollegin: „Was machen Sie gern?“ – Sie: … …",
            "promptEn": "A colleague asks what you like doing. Tell her two things you like doing, each in a short sentence. Use the activities of this Lektion.",
            "answer": "Ich höre gern Musik. Ich lese gern.",
            "parts": [
              {
                "label": {
                  "de": "was Sie gern machen (1)",
                  "en": "what you like doing (1)"
                },
                "forms": [],
                "frames": [
                  {
                    "pattern": "Ich {value} gern.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ich {value} gerne.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ich {value} sehr gern.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ich {value} sehr gerne.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ich {value} auch gern.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ich {value} auch gerne.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ich spiele {value} Fußball.",
                    "slots": {
                      "value": "taughtPhrases2"
                    }
                  },
                  {
                    "pattern": "Ich gehe {value} ins Kino.",
                    "slots": {
                      "value": "taughtPhrases2"
                    }
                  },
                  {
                    "pattern": "Ich lese {value} Bücher.",
                    "slots": {
                      "value": "taughtPhrases2"
                    }
                  },
                  {
                    "pattern": "Ich mache {value} Sport.",
                    "slots": {
                      "value": "taughtPhrases2"
                    }
                  },
                  {
                    "pattern": "Ich höre {value} Musik.",
                    "slots": {
                      "value": "taughtPhrases2"
                    }
                  },
                  {
                    "pattern": "Ich {value} gern.",
                    "slots": {
                      "value": "taughtPhrases3"
                    }
                  }
                ]
              },
              {
                "label": {
                  "de": "was Sie gern machen (2)",
                  "en": "what you like doing (2)"
                },
                "forms": [
                  "Und höre gern Musik.",
                  "Und höre auch gern Musik.",
                  "Und spiele gern Fußball.",
                  "Und spiele auch gern Fußball.",
                  "Und lese gern Bücher.",
                  "Und lese auch gern Bücher.",
                  "Und gehe gern ins Kino.",
                  "Und gehe auch gern ins Kino.",
                  "Und mache gern Sport.",
                  "Und mache auch gern Sport."
                ],
                "frames": [
                  {
                    "pattern": "Ich {value} gern.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Und ich {value} gern.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ich {value} gerne.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Und ich {value} gerne.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ich {value} sehr gern.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Und ich {value} sehr gern.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ich {value} sehr gerne.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Und ich {value} sehr gerne.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ich {value} auch gern.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Und ich {value} auch gern.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ich {value} auch gerne.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Und ich {value} auch gerne.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Und {value} gern.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Und {value} auch gern.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Und ich {value}.",
                    "slots": {
                      "value": "taughtPhrases4"
                    }
                  },
                  {
                    "pattern": "Ich spiele {value} Fußball.",
                    "slots": {
                      "value": "taughtPhrases2"
                    }
                  },
                  {
                    "pattern": "Ich gehe {value} ins Kino.",
                    "slots": {
                      "value": "taughtPhrases2"
                    }
                  },
                  {
                    "pattern": "Ich lese {value} Bücher.",
                    "slots": {
                      "value": "taughtPhrases2"
                    }
                  },
                  {
                    "pattern": "Ich mache {value} Sport.",
                    "slots": {
                      "value": "taughtPhrases2"
                    }
                  },
                  {
                    "pattern": "Ich höre {value} Musik.",
                    "slots": {
                      "value": "taughtPhrases2"
                    }
                  },
                  {
                    "pattern": "Ich {value} gern.",
                    "slots": {
                      "value": "taughtPhrases3"
                    }
                  }
                ],
                "ellipsisOpening": "Ich"
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                5
              ]
            },
            "micOff": true,
            "order": "any",
            "sets": {
              "taughtValues1": [
                "lese",
                "koche",
                "schwimme",
                "tanze"
              ],
              "taughtPhrases2": [
                "gern",
                "gerne",
                "sehr gern",
                "sehr gerne",
                "auch gern",
                "auch gerne"
              ],
              "taughtPhrases3": [
                "höre Musik",
                "spiele Fußball",
                "lese Bücher",
                "mache Sport"
              ],
              "taughtPhrases4": [
                "höre gern Musik",
                "höre gerne Musik",
                "höre sehr gern Musik",
                "höre sehr gerne Musik",
                "höre auch gern Musik",
                "höre auch gerne Musik",
                "höre Musik gern",
                "spiele gern Fußball",
                "spiele gerne Fußball",
                "spiele sehr gern Fußball",
                "spiele sehr gerne Fußball",
                "spiele auch gern Fußball",
                "spiele auch gerne Fußball",
                "spiele Fußball gern",
                "lese gern Bücher",
                "lese gerne Bücher",
                "lese sehr gern Bücher",
                "lese sehr gerne Bücher",
                "lese auch gern Bücher",
                "lese auch gerne Bücher",
                "lese Bücher gern",
                "gehe gern ins Kino",
                "gehe gerne ins Kino",
                "gehe sehr gern ins Kino",
                "gehe sehr gerne ins Kino",
                "gehe auch gern ins Kino",
                "gehe auch gerne ins Kino",
                "mache gern Sport",
                "mache gerne Sport",
                "mache sehr gern Sport",
                "mache sehr gerne Sport",
                "mache auch gern Sport",
                "mache auch gerne Sport",
                "mache Sport gern"
              ]
            },
            "sharedTail": "gern",
            "distinctActions": true
          },
          {
            "canDo": 2,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Sie und Tim. Sie: …? – Tim: „Ich höre gern Musik.“ – Sie: …? – Tim: „Ja, sehr gern!“",
            "promptEn": "You talk to Tim, a learner in your course: say du to him. First ask him what his hobby is. Then ask him a yes/no question about one activity from this Lektion.",
            "answer": "Was ist dein Hobby? Gehst du gern ins Kino?",
            "parts": [
              {
                "label": {
                  "de": "die Frage nach dem Hobby (mit du)",
                  "en": "the question about his hobby (with du)"
                },
                "forms": [
                  "Was ist dein Hobby?",
                  "Und was ist dein Hobby?",
                  "Was sind deine Hobbys?",
                  "Hast du ein Hobby?",
                  "Hast du Hobbys?"
                ],
                "frames": [
                  {
                    "pattern": "Was machst du {value}?",
                    "slots": {
                      "value": "taughtPhrases4"
                    }
                  }
                ]
              },
              {
                "label": {
                  "de": "eine Ja/Nein-Frage (mit du)",
                  "en": "a yes/no question (with du)"
                },
                "forms": [],
                "frames": [
                  {
                    "pattern": "Hörst du {value} Musik?",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Spielst du {value} Fußball?",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "{value} du?",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "{value} du gern?",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "{value} du gerne?",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "{value} du auch?",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "{value} du auch gern?",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "{value} du jede Woche?",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "{value} du am Wochenende?",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "Und {value} du?",
                    "slots": {
                      "value": "taughtValues3"
                    }
                  },
                  {
                    "pattern": "Und {value} du gern?",
                    "slots": {
                      "value": "taughtValues3"
                    }
                  },
                  {
                    "pattern": "Und {value} du auch?",
                    "slots": {
                      "value": "taughtValues3"
                    }
                  },
                  {
                    "pattern": "Und {value} du auch gern?",
                    "slots": {
                      "value": "taughtValues3"
                    }
                  },
                  {
                    "pattern": "Gehst du {value} ins Kino?",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Machst du {value} Sport?",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "{value} ins Kino?",
                    "slots": {
                      "value": "taughtPhrases5"
                    }
                  },
                  {
                    "pattern": "Und spielst {value} Fußball?",
                    "slots": {
                      "value": "taughtPhrases6"
                    }
                  },
                  {
                    "pattern": "Und machst {value} Sport?",
                    "slots": {
                      "value": "taughtPhrases6"
                    }
                  },
                  {
                    "pattern": "Und hörst {value} Musik?",
                    "slots": {
                      "value": "taughtPhrases6"
                    }
                  },
                  {
                    "pattern": "Spielst {value} Fußball?",
                    "slots": {
                      "value": "taughtPhrases7"
                    }
                  },
                  {
                    "pattern": "Machst {value} Sport?",
                    "slots": {
                      "value": "taughtPhrases7"
                    }
                  },
                  {
                    "pattern": "Hörst {value} Musik?",
                    "slots": {
                      "value": "taughtPhrases7"
                    }
                  }
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                0,
                3
              ]
            },
            "micOff": true,
            "register": "informal",
            "sets": {
              "taughtValues1": [
                "gern",
                "gerne",
                "auch"
              ],
              "taughtValues2": [
                "Kochst",
                "Schwimmst",
                "Tanzt"
              ],
              "taughtValues3": [
                "kochst",
                "schwimmst",
                "tanzt"
              ],
              "taughtPhrases4": [
                "gern",
                "gerne",
                "am Wochenende",
                "am Wochenende gern",
                "gern am Wochenende"
              ],
              "taughtPhrases5": [
                "Gehst du",
                "Gehst du auch gern",
                "Gehst du jede Woche",
                "Gehst du am Wochenende",
                "Und gehst du",
                "Und gehst du gern",
                "Und gehst du auch",
                "Und gehst du auch gern"
              ],
              "taughtPhrases6": [
                "du",
                "du gern",
                "du auch",
                "du auch gern"
              ],
              "taughtPhrases7": [
                "du",
                "du auch gern",
                "du jede Woche",
                "du am Wochenende"
              ]
            }
          },
          {
            "canDo": 3,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Eine Kollegin: „Wann sind Sie frei?“ – Sie: …",
            "promptEn": "A colleague wants to meet you and asks when you are free. Tell her in one sentence, with a time you know from the course.",
            "answer": "Ich bin am Wochenende frei.",
            "parts": [
              {
                "label": {
                  "de": "wann Sie frei sind",
                  "en": "when you are free"
                },
                "forms": [
                  "Am Wochenende.",
                  "Ich bin frei am Wochenende.",
                  "Ich arbeite am Wochenende nicht.",
                  "Am Wochenende arbeite ich nicht, ich bin frei.",
                  "Am Wochenende arbeite ich nicht und ich bin frei.",
                  "Morgen habe ich frei.",
                  "Morgen bin ich frei.",
                  "Morgen.",
                  "Am Wochenende arbeite ich nicht. Ich bin frei."
                ],
                "maxSentences": 2,
                "frames": [
                  {
                    "pattern": "Ich bin um {value} frei.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Um {value} bin ich frei.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Um {value}.",
                    "slots": {
                      "value": "taughtValues1"
                    }
                  },
                  {
                    "pattern": "Ich bin um {value} Uhr frei.",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "Um {value} Uhr bin ich frei.",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "Um {value} Uhr.",
                    "slots": {
                      "value": "taughtValues2"
                    }
                  },
                  {
                    "pattern": "Ich {value} frei.",
                    "slots": {
                      "value": "taughtPhrases3"
                    }
                  },
                  {
                    "pattern": "Am Wochenende {value}.",
                    "slots": {
                      "value": "taughtPhrases4"
                    }
                  }
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                4
              ]
            },
            "micOff": true,
            "sets": {
              "taughtValues1": [
                "eins",
                "zwei",
                "drei",
                "vier",
                "fünf",
                "sechs",
                "sieben",
                "acht",
                "neun",
                "zehn",
                "elf",
                "zwölf"
              ],
              "taughtValues2": [
                "ein",
                "zwei",
                "drei",
                "vier",
                "fünf",
                "sechs",
                "sieben",
                "acht",
                "neun",
                "zehn",
                "elf",
                "zwölf"
              ],
              "taughtPhrases3": [
                "bin am Wochenende",
                "bin am Wochenende immer",
                "bin immer am Wochenende",
                "bin immer",
                "habe am Wochenende",
                "habe am Wochenende immer",
                "habe morgen",
                "bin morgen"
              ],
              "taughtPhrases4": [
                "bin ich frei",
                "bin ich immer frei",
                "arbeite ich nicht",
                "habe ich frei",
                "habe ich immer frei"
              ]
            },
            "allowModelContext": true
          }
        ]
      },
      guided: {
        read: {
          titleDe: 'Frei am Wochenende?',
          titleEn: 'Free at the weekend?',
          instructionDe: 'Lesen Sie den Aushang. Tippen Sie auf ein Wort für seine Bedeutung.',
          instructionEn: 'Read the notice. Tap a word for its meaning.',
          text: 'Sind Sie am Wochenende frei? Dann kommen Sie!\nWir sind Freunde und machen jede Woche zusammen Sport.\nWir spielen Fußball und wir schwimmen.\nWir kochen auch zusammen und hören Musik.\nLesen Sie gern? Wir lesen Bücher auf Deutsch.\nAm Wochenende gehen wir immer ins Kino.\nDas Kino kostet acht Euro.\nIhr Freund oder Ihre Freundin ist auch willkommen!',
          questions: [
            {
              promptDe: 'Was kostet acht Euro? Wählen Sie die richtige Antwort.',
              promptEn: 'What costs eight euros? Choose the right answer.',
              options: ['Playing football.', 'Cooking together.', 'Going to the cinema.'],
              answer: 'Going to the cinema.',
              explanationDe: 'Im Aushang steht: Das Kino kostet acht Euro.',
              explanationEn: 'The notice says that the cinema costs eight euros. It names no price for anything else.',
            },
            {
              promptDe: 'Wer ist auch willkommen? Wählen Sie die richtige Antwort.',
              promptEn: 'Who is welcome too? Choose the right answer.',
              options: ['A friend of yours.', 'A child of yours.', 'A colleague of yours.'],
              answer: 'A friend of yours.',
              explanationDe: 'Im Aushang steht: Ihr Freund oder Ihre Freundin ist auch willkommen.',
              explanationEn: 'The notice says that your friend, a man or a woman, is welcome too.',
            },
          ],
        },
        chunks: [
          {
            from: 0,
            to: 3,
            meaning: {
              promptDe: 'Was machen Tim und Lena gern? Wählen Sie die Bedeutung.',
              promptEn: 'What do Tim and Lena like doing? Choose the meaning.',
              options: ['Tim plays football; Lena likes listening to music.', 'Tim likes listening to music; Lena plays football.', 'Tim likes cooking; Lena likes going to the cinema.'],
              answer: 'Tim likes listening to music; Lena plays football.',
            },
            say: {
              line: 1,
            },
          },
          {
            from: 3,
            to: 5,
            meaning: {
              promptDe: 'Was sagt Lena über das Wochenende? Wählen Sie die Bedeutung.',
              promptEn: 'What does Lena say about the weekend? Choose the meaning.',
              options: ['She does not work then; she is free.', 'She works then and has no time.', 'She is free only every second week.'],
              answer: 'She does not work then; she is free.',
            },
            say: {
              line: 4,
            },
          },
          {
            from: 5,
            to: 7,
            meaning: {
              promptDe: 'Was möchte Lena von Tim wissen? Wählen Sie die Bedeutung.',
              promptEn: 'What does Lena want to know from Tim? Choose the meaning.',
              options: ['Whether he swims every week.', 'Whether he likes cooking for friends.', 'Whether he likes going to the cinema.'],
              answer: 'Whether he likes going to the cinema.',
            },
            say: {
              line: 6,
            },
          },
          {
            from: 7,
            to: 10,
            meaning: {
              promptDe: 'Was möchte Tim am Wochenende machen? Wählen Sie die Bedeutung.',
              promptEn: 'What would Tim like to do at the weekend? Choose the meaning.',
              options: ['Play football together with Lena.', 'Listen to music together with Lena.', 'Go dancing together with Lena.'],
              answer: 'Listen to music together with Lena.',
            },
            say: {
              line: 7,
            },
          },
        ],
      },
      nextHook: {
        de: 'Ana und Lena suchen einen Termin. Aber wann hat Lena Zeit – und um wie viel Uhr?',
        en: 'Ana and Lena are looking for a time to meet. But when is Lena free – and at what time?',
      },
      title: 'Freizeit und Hobbys',
      situation: 'Freizeit und Hobbys',
      handlungsfeld: 'Freizeit und soziale Kontakte: über Hobbys sprechen',
      canDo: [
        'Ich kann über meine Hobbys sprechen.',
        'Ich kann sagen, was ich gern mache.',
        'Ich kann eine Person nach ihren Hobbys fragen.',
        'Ich kann sagen, wann ich frei bin.',
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
        // Two items of the drawn L7 practice set („Ich ___ viel. (arbeiten)“, „Du ___ viel.“) drill
        // arbeiten and its -t stem e-Einschub; it used to be introduced in L11 (DaF review #5,
        // MAJOR 6). Freizeit is defined against Arbeit, so the Lektion can carry it: the dialogue
        // line below says it and the notice now explains the e.
        { de: 'arbeiten', word: 'arbeiten', article: null, plural: null, en: 'to work', wordId: '10d8bc30-4f2f-4997-9205-34c8e0ed5a0a' },
      ],
      dialog: {
        title: 'Was machst du am Wochenende?',
        setting: 'Lena und Tim nach dem Kurs.',
        lines: [
          { speaker: 'Lena', de: 'Tim, was ist dein Hobby?', en: 'Tim, what is your hobby?' },
          { speaker: 'Tim', de: 'Ich höre gern Musik. Und du?', en: 'I like listening to music. And you?' },
          { speaker: 'Lena', de: 'Mein Hobby ist Sport. Ich spiele am Wochenende Fußball.', en: 'My hobby is sport. I play football at the weekend.' },
          { speaker: 'Tim', de: 'Spielst du jede Woche Fußball?', en: 'Do you play football every week?' },
          { speaker: 'Lena', de: 'Ja, immer. Am Wochenende arbeite ich nicht. Ich bin frei.', en: 'Yes, always. At the weekend I do not work. I am free.' },
          // lesen, kochen, schwimmen, tanzen and das Kino were added to the Wortfeld in #115 and
          // appeared in no line of the Lektion; the Hobby can-do rested on Musik and Sport alone
          // (DaF review #2, L7 and §A). The weekdays moved to L8, so the dialogue says am Wochenende.
          { speaker: 'Tim', de: 'Ich lese auch gern. Und ich koche gern.', en: 'I also like reading. And I like cooking.' },
          { speaker: 'Lena', de: 'Ich schwimme jede Woche. Gehst du gern ins Kino?', en: 'I swim every week. Do you like going to the cinema?' },
          { speaker: 'Tim', de: 'Ja, sehr gern! Und tanzt du auch?', en: 'Yes, very much! And do you dance too?' },
          // der Freund and vielleicht were taught and never heard (DaF review #3, RULE 10).
          { speaker: 'Lena', de: 'Nein, ich tanze nicht gut. Mein Freund und meine Freundin tanzen gern.', en: 'No, I do not dance well. My friend (m) and my friend (f) like dancing.' },
          { speaker: 'Tim', de: 'Vielleicht hören wir am Wochenende zusammen Musik?', en: 'Maybe we will listen to music together at the weekend?' },
        ],
      },
      pretest: {
        promptDe: 'Sagen Sie, was Sie gern machen.',
        promptEn: 'Say what you like doing.',
        model: 'Ich höre gern Musik.',
        // Not the bare prefix 'Ich' — that accepts „Ich bin müde“ as an answer about free time.
        accepted: ['Ich höre gern', 'Ich spiele gern', 'Ich mache gern', 'Ich lese gern', 'Ich koche gern', 'Ich schwimme gern', 'Ich tanze gern', 'Ich gehe gern', 'Mein Hobby ist', 'Meine Hobbys sind'],
      },
      notice: {
        formExamples: ['Lena spricht Deutsch.'],
        title: 'Präsens: regelmäßige Verben',
        bodyDe: 'Regelmäßige Verben haben feste Endungen am Stamm: ich spiel**e**, du spiel**st**, er/sie/es spiel**t**, wir spiel**en**, ihr spiel**t**, sie/Sie spiel**en**. **gern** steht nach dem Verb: Ich höre **gern** Musik. Endet der Stamm auf **-t**, kommt ein **e** dazu: du arbeit**e**st, er arbeit**e**t. **Achtung:** einige Verben wechseln den Vokal: sprechen → er **spricht**.',
        bodyEn: 'A regular verb is a stem plus an ending: **spielen** → ich spiel**e**, du spiel**st**, er/sie/es spiel**t**, wir spiel**en**, ihr spiel**t**, sie/Sie spiel**en**. To say you like doing something, put **gern** after the verb: **Ich höre gern Musik.** If the stem ends in **-t**, add an **e**: du arbeit**e**st, er arbeit**e**t. If it ends in -s or -z, du adds only -t: du tanz**t**. Some verbs change their vowel: sprechen → er **spricht**.',
        examples: ['Ich höre gern Musik. Und du?', 'Spielst du jede Woche Fußball?'],
        ruleSlug: 'present-tense-regular',
      },
      phonetik: { focus: 'Endungen am Wortende: -e, -en, -st', focusEn: 'Word endings: -e, -en, -st', items: ['ich HÖ-re', 'wir HÖ-ren', 'du SPIELST'] },
      hoeren: { kind: 'dictation', lines: [3, 6] },
      sprechen: {
        readAloud: [1, 4],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie zum Thema Freizeit: Hobby? Musik? Wochenende?',
          promptEn: 'Ask and answer questions about free time: your hobby? music? the weekend?',
          hintWords: ['spielen', 'hören', 'gern'],
          // Sie — Teil 2; auch beim Hobbythema bleibt die Prüfungsanrede Sie.
          anrede: 'Sie',
          // Missions 1–8 are the only published A1.1 speaking missions and each is linked once; this
          // Lektion (and 10–12) falls back to the generic prompt until new missions are seeded.
          missionOrder: null,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a11-l07',
        // NOT „am Samstag“: der Samstag is taught in L8, one Lektion later, so the form demanded a
        // word the learner has not seen and then met it again in a Lektion that never used it
        // (DaF review #3, L8 Wortfeld ↔ L7 Schreiben). „das Wochenende“ is in THIS Wortfeld and in
        // three lines of this dialogue, so the learner can copy the answer out of the source text —
        // which is what SD1 Schreiben Teil 1 actually tests.
        taskDe: 'Lena Brandt ist neu im Sportkurs. Ihr Hobby ist Schwimmen. Der Kurs ist am Wochenende. Füllen Sie die Anmeldung für einen Sportkurs aus.',
        taskEn: 'Lena Brandt is new in the sports course. Her hobby is swimming. The course is at the weekend. Fill in the registration form for a sports course (first name, surname, course, hobby, course day).',
        fields: ['Vorname', 'Nachname', 'Kurs', 'Hobby', 'Kurs am'],
        minWords: 5,
        maxWords: 40,
        sample: 'Vorname: Lena / Nachname: Brandt / Kurs: Sport / Hobby: Schwimmen / Kurs am: Wochenende',
      },
      links: { listeningExercise: null, readingOrder: 9 },
      practiceRule: { topics: ['present-tense-regular', 'personal-pronouns'], typedMin: 3 },
    },
    {
      nr: 8,
      id: 'a1.1-l08',
      slug: 'termine-und-uhrzeit',
      flow: 'guided',
      proof: {
        "tasks": [
          {
            "canDo": 0,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. 1. Sie haben keine Uhr. Sie: …? 2. Eine Frau hat keine Uhr. Sie haben eine Uhr: 10:30. Sie: … (ohne Zahlen)",
            "promptEn": "1. You have no watch: ask what time it is. 2. Then a woman has no watch, and yours says 10:30: tell her the time in words, without digits.",
            "answer": "Wie spät ist es? Es ist halb elf.",
            "parts": [
              {
                "label": {
                  "de": "die Frage",
                  "en": "the question"
                },
                "forms": [
                  "Wie spät ist es?",
                  "Wie spät ist es, bitte?",
                  "Wie viel Uhr ist es?",
                  "Wie viel Uhr ist es, bitte?",
                  "Entschuldigung, wie spät ist es?",
                  "Entschuldigung, wie spät ist es, bitte?",
                  "Entschuldigung, wie viel Uhr ist es?",
                  "Entschuldigung, wie viel Uhr ist es, bitte?"
                ]
              },
              {
                "label": {
                  "de": "die Uhrzeit",
                  "en": "the time"
                },
                "forms": [
                  "Es ist halb elf.",
                  "Halb elf.",
                  "Es ist zehn Uhr dreißig.",
                  "Zehn Uhr dreißig.",
                  "Es ist zehn dreißig."
                ]
              }
            ],
            "reteach": {
              "kind": "wortfeld",
              "index": 6
            },
            "micOff": true
          },
          {
            "canDo": 1,
            "type": "production",
            "promptDe": "Antworten Sie mit einem Satz. Sie und Ihre Freundin machen einen Termin für Sport. Ihre Zeit: Freitag, 9 Uhr. Ihre Freundin: „Und wann ist der Termin?“ Sie: …",
            "promptEn": "You and a friend are fixing a time for sport. You can do Friday, 9 o’clock. She asks when the appointment is: tell her the day and the time.",
            "answer": "Der Termin ist am Freitag um neun Uhr.",
            "parts": [
              {
                "label": {
                  "de": "der Termin",
                  "en": "the appointment"
                },
                "forms": [
                  "Der Termin ist am Freitag um neun Uhr.",
                  "Der Termin ist am Freitag um neun.",
                  "Der Termin ist am Freitag um 9 Uhr.",
                  "Der Termin ist am Freitag um 9.",
                  "Unser Termin ist am Freitag um neun Uhr.",
                  "Unser Termin ist am Freitag um neun.",
                  "Unser Termin ist am Freitag um 9 Uhr.",
                  "Unser Termin ist am Freitag um 9.",
                  "Er ist am Freitag um neun Uhr.",
                  "Er ist am Freitag um neun.",
                  "Er ist am Freitag um 9 Uhr.",
                  "Er ist am Freitag um 9.",
                  "Am Freitag um neun Uhr.",
                  "Am Freitag um neun.",
                  "Am Freitag um 9 Uhr.",
                  "Am Freitag um 9.",
                  "Der Termin ist um neun Uhr am Freitag.",
                  "Der Termin ist um neun am Freitag.",
                  "Der Termin ist um 9 Uhr am Freitag.",
                  "Der Termin ist um 9 am Freitag.",
                  "Unser Termin ist um neun Uhr am Freitag.",
                  "Unser Termin ist um neun am Freitag.",
                  "Unser Termin ist um 9 Uhr am Freitag.",
                  "Unser Termin ist um 9 am Freitag.",
                  "Er ist um neun Uhr am Freitag.",
                  "Er ist um neun am Freitag.",
                  "Er ist um 9 Uhr am Freitag.",
                  "Er ist um 9 am Freitag.",
                  "Um neun Uhr am Freitag.",
                  "Um neun am Freitag.",
                  "Um 9 Uhr am Freitag.",
                  "Um 9 am Freitag.",
                  "Am Freitag ist der Termin um neun Uhr.",
                  "Um neun Uhr ist der Termin am Freitag.",
                  "Am Freitag um neun Uhr ist der Termin.",
                  "Am Freitag um neun Uhr habe ich Zeit.",
                  "Am Freitag um neun Uhr bin ich frei.",
                  "Am Freitag um neun habe ich Zeit.",
                  "Am Freitag um neun bin ich frei.",
                  "Am Freitag um 9 Uhr habe ich Zeit.",
                  "Am Freitag um 9 Uhr bin ich frei.",
                  "Am Freitag um 9 habe ich Zeit.",
                  "Am Freitag um 9 bin ich frei.",
                  "Ich habe am Freitag um neun Uhr Zeit.",
                  "Ich habe am Freitag um neun Zeit.",
                  "Ich habe am Freitag um 9 Uhr Zeit.",
                  "Ich habe am Freitag um 9 Zeit.",
                  "Ich bin am Freitag um neun Uhr frei.",
                  "Ich bin am Freitag um neun frei.",
                  "Ich bin am Freitag um 9 Uhr frei.",
                  "Ich bin am Freitag um 9 frei."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                3
              ]
            },
            "micOff": true
          },
          {
            "canDo": 2,
            "type": "production",
            "promptDe": "Antworten Sie mit einem Satz. Ihr Morgen: aufstehen – wann? Ihr Wecker: 7 Uhr. Sie: Ich …",
            "promptEn": "Talk about your day: your alarm clock goes at 7 and you get up. Say in one full sentence when you get up.",
            "answer": "Ich stehe um sieben Uhr auf.",
            "parts": [
              {
                "label": {
                  "de": "der Morgen",
                  "en": "your morning"
                },
                "forms": [
                  "Ich stehe um sieben Uhr auf.",
                  "Ich stehe um sieben auf.",
                  "Ich stehe um 7 Uhr auf.",
                  "Ich stehe um 7 auf.",
                  "Ich stehe morgens um sieben Uhr auf.",
                  "Ich stehe morgens um sieben auf.",
                  "Ich stehe morgens um 7 Uhr auf.",
                  "Ich stehe morgens um 7 auf.",
                  "Ich stehe immer um sieben Uhr auf.",
                  "Ich stehe immer um sieben auf.",
                  "Ich stehe immer um 7 Uhr auf.",
                  "Ich stehe immer um 7 auf.",
                  "Ich stehe morgens immer um sieben Uhr auf.",
                  "Ich stehe morgens immer um sieben auf.",
                  "Ich stehe morgens immer um 7 Uhr auf.",
                  "Ich stehe morgens immer um 7 auf.",
                  "Ich stehe um sieben Uhr morgens auf.",
                  "Ich stehe um sieben morgens auf.",
                  "Ich stehe um 7 Uhr morgens auf.",
                  "Ich stehe um 7 morgens auf.",
                  "Um sieben Uhr stehe ich auf.",
                  "Um sieben stehe ich auf.",
                  "Um 7 Uhr stehe ich auf.",
                  "Um 7 stehe ich auf.",
                  "Morgens stehe ich um sieben Uhr auf.",
                  "Morgens stehe ich um sieben auf.",
                  "Morgens stehe ich um 7 Uhr auf.",
                  "Morgens stehe ich um 7 auf."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                1
              ]
            },
            "micOff": true
          },
          {
            "canDo": 3,
            "type": "production",
            "promptDe": "Antworten Sie mit einem Satz. Wann haben Sie Zeit für Ihre Freundin? Ihre Woche: Montag bis Freitag Arbeit. Aber Donnerstag: abends frei! Sie: …",
            "promptEn": "Your friend wants to meet. Your week: work from Monday to Friday, but you are free on Thursday evening. Tell her when you have time.",
            "answer": "Am Donnerstag bin ich abends frei.",
            "parts": [
              {
                "label": {
                  "de": "der Tag",
                  "en": "the day"
                },
                "forms": [
                  "Am Donnerstag bin ich abends frei.",
                  "Am Donnerstag habe ich abends Zeit.",
                  "Am Donnerstag habe ich abends frei.",
                  "Ich bin am Donnerstag abends frei.",
                  "Ich habe am Donnerstag abends Zeit.",
                  "Ich habe am Donnerstag abends frei.",
                  "Am Donnerstag abends bin ich frei.",
                  "Am Donnerstag abends habe ich Zeit.",
                  "Am Donnerstag abends habe ich frei.",
                  "Am Donnerstag abends.",
                  "Am Donnerstag bin ich am Abend frei.",
                  "Am Donnerstag habe ich am Abend Zeit.",
                  "Am Donnerstag habe ich am Abend frei.",
                  "Ich bin am Donnerstag am Abend frei.",
                  "Ich habe am Donnerstag am Abend Zeit.",
                  "Ich habe am Donnerstag am Abend frei.",
                  "Am Donnerstag am Abend bin ich frei.",
                  "Am Donnerstag am Abend habe ich Zeit.",
                  "Am Donnerstag am Abend habe ich frei.",
                  "Am Donnerstag am Abend.",
                  "Am Donnerstag bin ich frei.",
                  "Am Donnerstag habe ich Zeit.",
                  "Am Donnerstag habe ich frei.",
                  "Ich bin am Donnerstag frei.",
                  "Ich habe am Donnerstag Zeit.",
                  "Ich habe am Donnerstag frei.",
                  "Am Donnerstag.",
                  "Ich habe Zeit am Donnerstag.",
                  "Ich bin frei am Donnerstag.",
                  "Ich habe frei am Donnerstag."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                7
              ]
            },
            "micOff": true
          }
        ]
      },
      guided: {
        noticeBeforeScene: true,
        read: {
          titleDe: 'Eine Nachricht von Lena',
          titleEn: 'A message from Lena',
          instructionDe: 'Lesen Sie die Nachricht. Tippen Sie auf ein Wort für seine Bedeutung.',
          instructionEn: 'Read the message. Tap a word for its meaning.',
          text: 'Hallo Ana!\nHeute ist Mittwoch und ich bin krank.\nUm sechs Uhr aufstehen? Heute nicht!\nMein Termin beim Arzt ist um halb zehn.\nHast du am Donnerstag Zeit?\nNachmittags um Viertel nach vier bin ich frei.\nIst die Uhrzeit gut für dich?\nIch komme nicht zu spät: Mein Wecker ist gut!\nViele Grüße, Lena',
          questions: [
            {
              promptDe: 'Wann ist Lenas Termin beim Arzt? Wählen Sie die Antwort.',
              promptEn: 'When is Lena’s appointment at the doctor’s? Choose the answer.',
              options: ['At half past ten.', 'At half past nine.', 'At a quarter past nine.'],
              answer: 'At half past nine.',
              explanationDe: 'In der Nachricht steht: Der Termin beim Arzt ist um halb zehn. Halb zehn ist 9.30 Uhr.',
              explanationEn: 'The message says the appointment is at “halb zehn”. That is 9.30: half an hour before ten.',
            },
            {
              promptDe: 'Wann hat Lena am Donnerstag Zeit? Wählen Sie die Antwort.',
              promptEn: 'When does Lena have time on Thursday? Choose the answer.',
              options: ['In the afternoon, at a quarter past four.', 'In the afternoon, at a quarter to four.', 'In the evening, at a quarter past eight.'],
              answer: 'In the afternoon, at a quarter past four.',
              explanationDe: 'In der Nachricht steht: Nachmittags um Viertel nach vier ist Lena frei. Das ist 16.15 Uhr.',
              explanationEn: 'The message says Lena is free in the afternoon at “Viertel nach vier”: a quarter past four.',
            },
          ],
        },
        chunks: [
          {
            from: 0,
            to: 2,
            meaning: {
              promptDe: 'Was macht Lena um sechs Uhr? Wählen Sie die Antwort.',
              promptEn: 'What does Lena do at six o’clock? Choose the answer.',
              options: ['She gets up.', 'She has breakfast.', 'She goes to work.'],
              answer: 'She gets up.',
            },
            say: {
              line: 1,
            },
          },
          {
            from: 2,
            to: 4,
            meaning: {
              promptDe: 'Wann ist der Termin von Lena? Wählen Sie die Antwort.',
              promptEn: 'When is Lena’s appointment? Choose the answer.',
              options: ['On Monday at a quarter past eight.', 'On Tuesday at a quarter to eight.', 'On Monday at a quarter to eight.'],
              answer: 'On Monday at a quarter to eight.',
            },
            say: {
              line: 2,
            },
          },
          {
            from: 4,
            to: 6,
            meaning: {
              promptDe: 'Kommt Lena heute pünktlich? Wählen Sie die Bedeutung.',
              promptEn: 'Will Lena be on time today? Choose the meaning.',
              options: ['No, she is running late today.', 'Yes, she is always on time.', 'No, her alarm clock is broken.'],
              answer: 'Yes, she is always on time.',
            },
            say: {
              line: 5,
            },
          },
          {
            from: 6,
            to: 8,
            meaning: {
              promptDe: 'Wann ist Lena am Dienstag frei? Wählen Sie die Antwort.',
              promptEn: 'When is Lena free on Tuesday? Choose the answer.',
              options: ['In the morning.', 'In the afternoon.', 'In the evening.'],
              answer: 'In the evening.',
            },
            say: {
              line: 6,
            },
          },
          {
            from: 8,
            to: 10,
            meaning: {
              promptDe: 'Was sagt Lena über den Mittwoch? Wählen Sie die Bedeutung.',
              promptEn: 'What does Lena say about Wednesday? Choose the meaning.',
              options: ['She is at the doctor’s.', 'She is free all day.', 'She is at work.'],
              answer: 'She is at the doctor’s.',
            },
            say: {
              line: 9,
            },
          },
        ],
      },
      nextHook: {
        de: 'Ana hat Durst und geht ins Café. Kann sie auf Deutsch bestellen?',
        en: 'Ana is thirsty and goes to a café. Can she order in German?',
      },
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
        { de: 'halb', word: 'halb', article: null, plural: null, en: 'half (to the next hour): halb neun = 8.30', wordId: 'cc37acc3-4937-4d79-a6b1-5960406aa578' },
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
        { de: 'der Abend', exampleDe: 'Der Abend ist frei. Der Termin ist am Morgen.', word: 'Abend', article: 'der', plural: 'Abende', en: 'evening', wordId: '2f8b57f8-3935-4b4b-8072-2ee700aeec18' },
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
        { de: 'krank', exampleDe: 'Ich bin krank. Der Termin beim Arzt ist am Montag.', word: 'krank', article: null, plural: null, en: 'sick, ill', wordId: '609580f6-24f7-47c7-b777-2aecc41027ca' },
        { de: 'der Arzt', word: 'Arzt', article: 'der', plural: 'Ärzte', en: 'doctor', wordId: '5785df40-c89c-472f-a65e-72c449a6c634' },
      ],
      dialog: {
        title: 'Wann hast du Zeit?',
        setting: 'Ana und Lena suchen einen Termin.',
        lines: [
          { speaker: 'Ana', de: 'Lena, wann stehst du morgens auf?', en: 'Lena, when do you get up in the morning?' },
          { speaker: 'Lena', de: 'Ich stehe um sechs Uhr auf.', en: 'I get up at six o’clock.' },
          { speaker: 'Ana', de: 'Und wann ist dein Termin?', en: 'And when is your appointment?' },
          { speaker: 'Lena', de: 'Der Termin ist am Montag um Viertel vor acht.', en: 'The appointment is on Monday at a quarter to eight.' },
          // heute and die Verspätung were taught and never heard (DaF review #3, RULE 10).
          { speaker: 'Ana', de: 'Kommst du heute pünktlich? Oder hast du Verspätung?', en: 'Will you be on time today? Or will you be late?' },
          // NOT „Ich habe einen guten Wecker“: that is Adjektivdeklination im Akkusativ, a fifth
          // Vorgriff the course never names, in the Lektion whose exam part is Hören Teil 1.
          { speaker: 'Lena', de: 'Ich bin immer pünktlich. Mein Wecker ist gut.', en: 'I am always on time. My alarm clock is good.' },
          { speaker: 'Ana', de: 'Und am Dienstag? Bist du nachmittags frei?', en: 'And on Tuesday? Are you free in the afternoon?' },
          { speaker: 'Lena', de: 'Am Dienstag bin ich abends frei.', en: 'On Tuesday I am free in the evening.' },
          // Mittwoch, Donnerstag and Freitag were in the Wortfeld and in no line (DaF review #2, §A).
          { speaker: 'Ana', de: 'Und am Mittwoch, am Donnerstag oder am Freitag?', en: 'And on Wednesday, Thursday or Friday?' },
          // Samstag and Sonntag came over from L7 with the rest of the week but appeared in no line,
          // no item and no task of L8 — the week was a set on paper only (DaF review #3).
          { speaker: 'Lena', de: 'Am Mittwoch beim Arzt. Am Samstag und am Sonntag habe ich frei!', en: 'On Wednesday at the doctor’s. On Saturday and Sunday I am free!' },
        ],
      },
      pretest: { promptDe: 'Fragen Sie nach der Uhrzeit.', promptEn: 'Ask what time it is.', model: 'Wie spät ist es?', accepted: ['Wie spät', 'Wie viel Uhr', 'Wann', 'Um wie viel Uhr', 'Entschuldigung, wie spät'] },
      notice: {
        formExamples: ['Der Termin ist um Viertel nach acht.', 'Es ist acht Uhr dreißig.'],
        title: 'um, am – die Uhrzeit sagen',
        bodyDe: 'Uhrzeit mit **um**: um acht Uhr. Aber: Es ist acht Uhr (ohne um). Wochentag mit **am**: am Montag. Umgangssprachlich: **Viertel nach** acht, **Viertel vor** neun, **halb** neun (= 8.30!). Offiziell (Bahn, Radio) lautet die Uhrzeit Stunde + Uhr + Minuten, bis 24: **acht Uhr dreißig**, vierzehn Uhr dreißig. **Hast du Zeit?** ist eine feste Wendung; haben kommt in Lektion 9.',
        bodyEn: 'For when, a clock time takes **um**: **um acht Uhr**. To say the time, no um: Es ist acht Uhr. A weekday takes **am**: **am Montag**. Everyday speech: **Viertel nach** acht (8.15), **Viertel vor** neun (8.45), **halb** neun (8.30, not 9.30!). Timetables and the radio count to 24, hour + Uhr + minutes: **acht Uhr dreißig**, vierzehn Uhr dreißig (14.30). To ask: Wie spät ist es? **Hast du Zeit?** is a set phrase for now; haben comes in Lektion 9.',
        examples: ['Ich stehe um sechs Uhr auf.', 'Der Termin ist am Montag um Viertel vor acht.'],
        ruleSlug: 'time-and-dates',
      },
      phonetik: { focus: 'Satzmelodie in der W-Frage: fallend', focusEn: 'Sentence melody in a W-question: it falls', items: ['Wie SPÄT ist es?', 'WANN kommst du?', 'Wie viel UHR ist es?'] },
      hoeren: { kind: 'dictation', lines: [3, 7] },
      sprechen: {
        // RULE 18: Zeile 3 ist Diktatzeile. Zeile 6 und Zeile 8 sind beide Wochentagszeilen und
        // damit das eigene Thema dieser Lektion.
        readAloud: [6, 8],
        open: {
          teil: 'Sprechen Teil 3',
          promptDe: 'Bitten Sie um einen Termin am Nachmittag und reagieren Sie auf die Antwort.',
          promptEn: 'Ask for an appointment in the afternoon and react to the answer.',
          hintWords: ['der Termin', 'um', 'Zeit haben'],
          // Sie — Teil 3: um einen Termin bitten heißt, mit einer Praxis oder einem Amt sprechen.
          anrede: 'Sie',
          missionOrder: 8,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a11-l08',
        taskDe: 'Ihr Termin mit Lena ist am Montag um acht Uhr, aber am Montag geht es nicht. Schreiben Sie Lena eine Nachricht und nennen Sie einen neuen Termin. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        taskEn: 'Your appointment with Lena is on Monday at eight, but Monday does not work. Write Lena a message and suggest a new appointment. Open with a greeting and close with a sign-off. Cover three points: why you are writing; the new day and the new time; a question for Lena.',
        leitpunkte: ['Warum Sie schreiben', 'Neuer Tag und neue Uhrzeit', 'Eine Frage an Lena'],
        minWords: 25,
        maxWords: 45,
        // 37 Wörter, mit dem neuen Tag, der neuen Uhrzeit und einer Frage an Lena.
        sample: 'Hallo Lena! Am Montag komme ich nicht. Ich bin krank. Geht es am Dienstag um halb neun? Noch eine Frage: Bist du dann pünktlich? Viele Grüße, Ana',
      },
      links: { listeningExercise: 4, readingOrder: 3 },
      // Only the primary topic: with two topics the builder drew 5 present-tense items against 2 time
      // items in a Lektion about the clock (DaF review, L8). Revisit once the pool weights topics[0].
      // mustCover (DaF review #9 MAJOR 1): the notice bolds „halb neun (= 8.30!)“ and the Lektion
      // promises the official time of Hören Teil 1/2, and over twelve Lektionen à seven items plus
      // four checkpoints the learner produced NEITHER — the pool held both forms and the seeded draw
      // never reached them. A ceiling on repetition cannot reserve a seat; these two keys do.
      practiceRule: {
        topics: ['time-and-dates'],
        typedMin: 4,
        mustCover: ['halb', 'vierzehn Uhr dreißig'],
      },
    },
    {
      nr: 9,
      id: 'a1.1-l09',
      slug: 'im-cafe',
      flow: 'guided',
      proof: {
        "tasks": [
          {
            "canDo": 0,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Im Café. Der Kellner: „Was möchten Sie trinken?“ Sie: … (Durst!) … (Tee)",
            "promptEn": "In the café, the waiter asks what you would like to drink. Say two sentences: first that you are thirsty, then order tea politely.",
            "answer": "Ich habe Durst. Ich möchte einen Tee, bitte.",
            "parts": [
              {
                "label": {
                  "de": "der Durst",
                  "en": "being thirsty"
                },
                "forms": [
                  "Ich habe Durst."
                ]
              },
              {
                "label": {
                  "de": "die Bestellung",
                  "en": "the order"
                },
                "forms": [
                  "Ich möchte einen Tee, bitte.",
                  "Ich möchte einen Tee.",
                  "Ich möchte Tee, bitte.",
                  "Ich möchte Tee.",
                  "Ich möchte eine Tasse Tee, bitte.",
                  "Ich möchte eine Tasse Tee.",
                  "Ich möchte ein Glas Tee, bitte.",
                  "Ich möchte ein Glas Tee.",
                  "Und ich möchte einen Tee, bitte.",
                  "Und ich möchte einen Tee.",
                  "Und ich möchte Tee, bitte.",
                  "Und ich möchte Tee.",
                  "Und ich möchte eine Tasse Tee, bitte.",
                  "Und ich möchte eine Tasse Tee.",
                  "Und ich möchte ein Glas Tee, bitte.",
                  "Und ich möchte ein Glas Tee.",
                  "Ich möchte bitte einen Tee.",
                  "Ich möchte bitte Tee.",
                  "Ich möchte bitte eine Tasse Tee.",
                  "Ich möchte bitte ein Glas Tee.",
                  "Einen Tee, bitte.",
                  "Tee, bitte.",
                  "Eine Tasse Tee, bitte.",
                  "Ein Glas Tee, bitte.",
                  "Bitte einen Tee.",
                  "Bitte Tee.",
                  "Bitte eine Tasse Tee.",
                  "Bitte ein Glas Tee.",
                  "Ich möchte einen Tee trinken.",
                  "Ich möchte einen Tee trinken, bitte.",
                  "Ich möchte Tee trinken.",
                  "Ich möchte Tee trinken, bitte.",
                  "Ich möchte eine Tasse Tee trinken.",
                  "Ich möchte eine Tasse Tee trinken, bitte.",
                  "Ich möchte ein Glas Tee trinken.",
                  "Ich möchte ein Glas Tee trinken, bitte.",
                  "Ich trinke einen Tee.",
                  "Ich trinke Tee.",
                  "Ich trinke eine Tasse Tee.",
                  "Ich trinke ein Glas Tee."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                1
              ]
            },
            "micOff": true,
            "firstContact": true
          },
          {
            "canDo": 1,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Der Kellner: „Wir haben auch Suppe, Salat und Kuchen.“ Sie: … (Hunger!) … (Suppe)",
            "promptEn": "The waiter tells you what there is to eat. Say two sentences: first that you are hungry, then order soup politely.",
            "answer": "Ich habe Hunger. Ich möchte Suppe, bitte.",
            "parts": [
              {
                "label": {
                  "de": "der Hunger",
                  "en": "being hungry"
                },
                "forms": [
                  "Ich habe Hunger.",
                  "Ja, ich habe Hunger.",
                  "Ich habe auch Hunger.",
                  "Ja, ich habe auch Hunger."
                ]
              },
              {
                "label": {
                  "de": "die Bestellung",
                  "en": "the order"
                },
                "forms": [
                  "Ich möchte Suppe, bitte.",
                  "Ich möchte Suppe.",
                  "Ich möchte eine Suppe, bitte.",
                  "Ich möchte eine Suppe.",
                  "Ich möchte die Suppe, bitte.",
                  "Ich möchte die Suppe.",
                  "Und ich möchte Suppe, bitte.",
                  "Und ich möchte Suppe.",
                  "Und ich möchte eine Suppe, bitte.",
                  "Und ich möchte eine Suppe.",
                  "Und ich möchte die Suppe, bitte.",
                  "Und ich möchte die Suppe.",
                  "Ich möchte bitte Suppe.",
                  "Ich möchte bitte eine Suppe.",
                  "Ich möchte bitte die Suppe.",
                  "Suppe, bitte.",
                  "Eine Suppe, bitte.",
                  "Die Suppe, bitte.",
                  "Bitte Suppe.",
                  "Bitte eine Suppe.",
                  "Bitte die Suppe.",
                  "Ich möchte Suppe essen.",
                  "Ich möchte Suppe essen, bitte.",
                  "Ich möchte eine Suppe essen.",
                  "Ich möchte eine Suppe essen, bitte.",
                  "Ich möchte die Suppe essen.",
                  "Ich möchte die Suppe essen, bitte.",
                  "Ich esse Suppe.",
                  "Ich esse eine Suppe.",
                  "Ich esse die Suppe."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                3
              ]
            },
            "micOff": true
          },
          {
            "canDo": 2,
            "type": "production",
            "promptDe": "Antworten Sie mit einem Satz. Sie möchten Salat. Der Kellner: „Wir haben Suppe und Kuchen.“ Sie: …?",
            "promptEn": "You would like salad, but the waiter only mentions soup and cake. Ask him politely whether they have salad too.",
            "answer": "Haben Sie auch Salat?",
            "register": "formal",
            "parts": [
              {
                "label": {
                  "de": "die Frage",
                  "en": "the question"
                },
                "forms": [
                  "Haben Sie auch Salat?",
                  "Haben Sie auch Salat, bitte?",
                  "Haben Sie auch einen Salat?",
                  "Haben Sie auch einen Salat, bitte?",
                  "Haben Sie Salat?",
                  "Haben Sie Salat, bitte?",
                  "Haben Sie einen Salat?",
                  "Haben Sie einen Salat, bitte?",
                  "Und haben Sie auch Salat?",
                  "Und haben Sie auch Salat, bitte?",
                  "Und haben Sie auch einen Salat?",
                  "Und haben Sie auch einen Salat, bitte?",
                  "Und haben Sie Salat?",
                  "Und haben Sie Salat, bitte?",
                  "Und haben Sie einen Salat?",
                  "Und haben Sie einen Salat, bitte?",
                  "Entschuldigung, haben Sie auch Salat?",
                  "Entschuldigung, haben Sie auch Salat, bitte?",
                  "Entschuldigung, haben Sie auch einen Salat?",
                  "Entschuldigung, haben Sie auch einen Salat, bitte?",
                  "Entschuldigung, haben Sie Salat?",
                  "Entschuldigung, haben Sie Salat, bitte?",
                  "Entschuldigung, haben Sie einen Salat?",
                  "Entschuldigung, haben Sie einen Salat, bitte?"
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                2
              ]
            },
            "micOff": true,
            "firstContact": true
          },
          {
            "canDo": 3,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Der Kellner: „Möchten Sie auch Wasser?“ Sie: … (ja!) Der Kellner: „Wir haben auch Wein.“ Sie: … (nein!)",
            "promptEn": "The waiter offers you water: accept politely. Then he offers wine: decline politely.",
            "answer": "Ja, bitte. Nein, danke.",
            "register": "formal",
            "parts": [
              {
                "label": {
                  "de": "annehmen",
                  "en": "accepting"
                },
                "forms": [
                  "Ja, bitte.",
                  "Ja, gern.",
                  "Ja, gerne.",
                  "Ja, sehr gern.",
                  "Ja, sehr gerne.",
                  "Gern.",
                  "Gerne.",
                  "Sehr gern.",
                  "Sehr gerne.",
                  "Ja, danke.",
                  "Ja, ein Glas Wasser, bitte.",
                  "Ja, ein Wasser, bitte.",
                  "Ja, Wasser, bitte.",
                  "Ja, ein Glas Mineralwasser, bitte.",
                  "Ja, ich möchte Wasser.",
                  "Ja, ich möchte Wasser, bitte.",
                  "Ja, ich möchte ein Glas Wasser.",
                  "Ja, ich möchte ein Glas Wasser, bitte.",
                  "Ja, ich möchte auch Wasser.",
                  "Ja, ich möchte auch Wasser, bitte.",
                  "Ja, ich möchte auch ein Glas Wasser.",
                  "Ja, ich möchte auch ein Glas Wasser, bitte."
                ]
              },
              {
                "label": {
                  "de": "höflich ablehnen",
                  "en": "declining politely"
                },
                "forms": [
                  "Nein, danke.",
                  "Danke, nein.",
                  "Nein, danke, ich möchte keinen Wein."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                4,
                5,
                6,
                7
              ]
            },
            "micOff": true,
            "allowModelContext": true
          }
        ]
      },
      guided: {
        read: {
          titleDe: 'Die Karte im Café',
          titleEn: 'The café menu',
          instructionDe: 'Lesen Sie die Karte. Tippen Sie auf ein Wort für seine Bedeutung.',
          instructionEn: 'Read the menu. Tap a word for its meaning.',
          text: 'Café Bremen\nBei uns essen und trinken Sie gut!\nFrühstück: Montag bis Samstag, 7 bis 11 Uhr\nFrühstück mit Brot und Kaffee: 6 Euro\nSuppe oder Salat: 5 Euro\nKuchen: 3 Euro\nTasse Kaffee oder Tee: 2 Euro\nGlas Orangensaft: 3 Euro',
          questions: [
            {
              promptDe: 'Sie möchten Suppe und eine Tasse Tee. Was kostet das zusammen? Wählen Sie die Antwort.',
              promptEn: 'You would like soup and a cup of tea. How much is that together? Choose the answer.',
              options: ['5 euros.', '7 euros.', '8 euros.'],
              answer: '7 euros.',
              explanationDe: 'Auf der Karte steht: Suppe kostet 5 Euro, eine Tasse Tee kostet 2 Euro. Zusammen sind das 7 Euro.',
              explanationEn: 'The menu says soup is 5 euros and a cup of tea is 2 euros. Together that is 7 euros.',
            },
            {
              promptDe: 'Wann gibt es im Café Frühstück? Wählen Sie die Antwort.',
              promptEn: 'When does the café serve breakfast? Choose the answer.',
              options: ['Monday to Saturday, from 7 to 11.', 'Monday to Friday, from 7 to 11.', 'Every day, from 7 to 11.'],
              answer: 'Monday to Saturday, from 7 to 11.',
              explanationDe: 'Auf der Karte steht: Frühstück von Montag bis Samstag, 7 bis 11 Uhr. Am Sonntag ist kein Frühstück.',
              explanationEn: 'The menu says breakfast is Monday to Saturday, 7 to 11. There is no breakfast on Sunday.',
            },
          ],
        },
        chunks: [
          {
            from: 0,
            to: 2,
            meaning: {
              promptDe: 'Was möchte Ana? Wählen Sie die Bedeutung.',
              promptEn: 'What would Ana like? Choose the meaning.',
              options: ['She is hungry and orders a soup.', 'She is thirsty and orders a coffee.', 'She is tired and orders a tea.'],
              answer: 'She is thirsty and orders a coffee.',
            },
            say: {
              line: 1,
            },
          },
          {
            from: 2,
            to: 4,
            meaning: {
              promptDe: 'Hat Ana auch Hunger? Wählen Sie die Bedeutung.',
              promptEn: 'Is Ana hungry too? Choose the meaning.',
              options: ['Yes, and she orders cake.', 'Yes, and she orders soup.', 'No, she only wants a drink.'],
              answer: 'Yes, and she orders cake.',
            },
            say: {
              line: 3,
            },
          },
          {
            from: 4,
            to: 6,
            meaning: {
              promptDe: 'Was bestellt Ana noch? Wählen Sie die Antwort.',
              promptEn: 'What else does Ana order? Choose the answer.',
              options: ['A cup of tea and a mineral water.', 'A glass of orange juice and a beer.', 'A glass of mineral water and an orange juice.'],
              answer: 'A glass of mineral water and an orange juice.',
            },
            say: {
              line: 5,
            },
          },
          {
            from: 6,
            to: 8,
            meaning: {
              promptDe: 'Paul hat auch Tee, Bier und Wein. Was sagt Ana? Wählen Sie die Bedeutung.',
              promptEn: 'Paul also has tea, beer and wine. What does Ana say? Choose the meaning.',
              options: ['Yes, please: she orders a glass of wine.', 'No, thank you: she will eat bread with salad.', 'No, thank you: she would like the bill.'],
              answer: 'No, thank you: she will eat bread with salad.',
            },
            say: {
              line: 7,
            },
          },
          {
            from: 8,
            to: 10,
            meaning: {
              promptDe: 'Was sagt Paul? Wählen Sie die Bedeutung.',
              promptEn: 'What does Paul say? Choose the meaning.',
              options: ['The waitress is coming right away with the bread.', 'The waitress is sorry: there is no bread today.', 'The bread will take another twenty minutes.'],
              answer: 'The waitress is coming right away with the bread.',
            },
            say: {
              line: 9,
            },
          },
        ],
      },
      nextHook: {
        de: 'Ana steht am Bahnhof und hat viele Fragen: Fährt der Zug nach Österreich? Und was kostet die Fahrkarte?',
        en: 'Ana is at the station with a lot of questions: does the train go to Austria? And what does the ticket cost?',
      },
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
          // Eight of the 23 Wortfeld entries of the Café-Lektion were ordered by nobody: Bier,
          // Mineralwasser, Orangensaft, Tasse, Kellnerin, essen, Brot, Frühstück (and Wein).
          // The closing four lines carry them instead of repeating Wasser and Tee (DaF review #3).
          { speaker: 'Ana', de: 'Ja, ein Glas Mineralwasser, bitte. Und einen Orangensaft.', en: 'Yes, a glass of mineral water, please. And an orange juice.' },
          { speaker: 'Paul', de: 'Gern. Wir haben auch Tee, Bier und Wein.', en: 'Gladly. We also have tea, beer and wine.' },
          { speaker: 'Ana', de: 'Nein, danke. Ich esse ein Brot mit Salat.', en: 'No, thank you. I’ll have a sandwich with salad.' },
          { speaker: 'Paul', de: 'Gut. Die Kellnerin kommt sofort mit dem Brot.', en: 'Good. The waitress is coming right away with the bread.' },
          { speaker: 'Ana', de: 'Danke! Zum Frühstück trinke ich immer eine Tasse Kaffee.', en: 'Thank you! For breakfast I always drink a cup of coffee.' },
        ],
      },
      pretest: {
        promptDe: 'Bestellen Sie im Café etwas zu trinken.',
        promptEn: 'Order something to drink in a café.',
        model: 'Ich möchte einen Kaffee, bitte.',
        accepted: ['Ich möchte', 'Ich nehme', 'Ein'],
      },
      notice: {
        formExamples: ['Du hast Hunger. Er hat Durst. Habt ihr Zeit?'],
        title: 'haben und der Chunk „Ich möchte …“',
        bodyDe: '**haben**: ich **habe**, du **hast**, er/sie/es **hat**, wir **haben**, ihr **habt**, sie/Sie **haben**. Mit haben sagt man Hunger, Durst oder Zeit. **Ich möchte …** steht hier als fester Chunk; die Form gehört zu den Modalverben in A1.2.',
        bodyEn: '**haben** (to have) is the second verb to learn as a set: ich **habe**, du **hast**, er/sie/es **hat**, wir **haben**, ihr **habt**, sie/Sie **haben**. Where English says "I am hungry", German uses haben: **Ich habe Hunger**, **Ich habe Durst** (I am thirsty) – and **Zeit** (time) works the same way. To order or ask for something politely, use **Ich möchte …** (I would like …) as a fixed phrase; its grammar belongs to the modal verbs in A1.2.',
        examples: ['Haben Sie auch Hunger? Wir haben Suppe, Salat und Kuchen.', 'Ja, ich habe Hunger. Ich möchte Kuchen, bitte.'],
        ruleSlug: 'verb-haben',
      },
      phonetik: { focus: 'Der Vokal ö in möchten und hören', focusEn: 'The vowel ö in möchten and hören', items: ['MÖCH-te', 'HÖ-ren', 'SCHÖN'] },
      hoeren: { kind: 'dictation', lines: [0, 4] },
      sprechen: {
        readAloud: [1, 3],
        open: {
          teil: 'Sprechen Teil 3',
          promptDe: 'Bitten Sie im Café um ein Glas Wasser und reagieren Sie auf die Antwort.',
          promptEn: 'In a café, ask for a glass of water and react to the answer.',
          hintWords: ['möchten', 'bitte', 'das Glas'],
          // Sie — Teil 3 im Café; der Dialog der Lektion siezt durchgehend („Was möchten Sie trinken?“).
          anrede: 'Sie',
          missionOrder: 7,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a11-l09',
        taskDe: 'Ana Chakiri ist im Café. Sie reserviert einen Tisch am Montag um 15 Uhr, für zwei Personen. Ihre Telefonnummer ist 0176 22 44 88. Füllen Sie die Reservierungskarte im Café aus.',
        taskEn: 'Ana Chakiri is in the café. She is reserving a table on Monday at 3 p.m. for two people. Her phone number is 0176 22 44 88. Fill in the reservation card in the café (name, day, time, number of people, phone number).',
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
      flow: 'guided',
      proof: {
        "tasks": [
          {
            "canDo": 0,
            "type": "production",
            "promptDe": "Antworten Sie mit einem Satz. Am Bahnhof. Sie fahren mit dem Zug nach Österreich. Auf Ihrer Fahrkarte ist keine Uhrzeit. Ein Mann arbeitet am Bahnhof. Sie: …?",
            "promptEn": "At the station: you are taking the train to Austria, but your ticket shows no time. Ask a man who works there when the train leaves.",
            "answer": "Wann fährt der Zug nach Österreich?",
            "parts": [
              {
                "label": {
                  "de": "die Frage",
                  "en": "the question"
                },
                "forms": [
                  "Wann fährt der Zug?",
                  "Entschuldigung, wann fährt der Zug?",
                  "Wann fährt der Zug, bitte?",
                  "Wann fährt der Zug nach Österreich?",
                  "Entschuldigung, wann fährt der Zug nach Österreich?",
                  "Wann fährt der Zug nach Österreich, bitte?",
                  "Wann geht der Zug?",
                  "Entschuldigung, wann geht der Zug?",
                  "Wann geht der Zug, bitte?",
                  "Wann geht der Zug nach Österreich?",
                  "Entschuldigung, wann geht der Zug nach Österreich?",
                  "Wann geht der Zug nach Österreich, bitte?",
                  "Wann kommt der Zug?",
                  "Entschuldigung, wann kommt der Zug?",
                  "Wann kommt der Zug, bitte?",
                  "Wann kommt der Zug nach Österreich?",
                  "Entschuldigung, wann kommt der Zug nach Österreich?",
                  "Wann kommt der Zug nach Österreich, bitte?",
                  "Wann ist die Abfahrt?",
                  "Entschuldigung, wann ist die Abfahrt?",
                  "Wann ist die Abfahrt, bitte?",
                  "Um wie viel Uhr fährt der Zug?",
                  "Entschuldigung, um wie viel Uhr fährt der Zug?",
                  "Um wie viel Uhr fährt der Zug, bitte?",
                  "Um wie viel Uhr fährt der Zug nach Österreich?",
                  "Entschuldigung, um wie viel Uhr fährt der Zug nach Österreich?",
                  "Um wie viel Uhr fährt der Zug nach Österreich, bitte?",
                  "Um wie viel Uhr geht der Zug?",
                  "Entschuldigung, um wie viel Uhr geht der Zug?",
                  "Um wie viel Uhr geht der Zug, bitte?",
                  "Um wie viel Uhr geht der Zug nach Österreich?",
                  "Entschuldigung, um wie viel Uhr geht der Zug nach Österreich?",
                  "Um wie viel Uhr geht der Zug nach Österreich, bitte?",
                  "Um wie viel Uhr kommt der Zug?",
                  "Entschuldigung, um wie viel Uhr kommt der Zug?",
                  "Um wie viel Uhr kommt der Zug, bitte?",
                  "Um wie viel Uhr kommt der Zug nach Österreich?",
                  "Entschuldigung, um wie viel Uhr kommt der Zug nach Österreich?",
                  "Um wie viel Uhr kommt der Zug nach Österreich, bitte?",
                  "Um wie viel Uhr ist die Abfahrt?",
                  "Entschuldigung, um wie viel Uhr ist die Abfahrt?",
                  "Um wie viel Uhr ist die Abfahrt, bitte?",
                  "Und wann fährt der Zug?",
                  "Und wann fährt der Zug nach Österreich?",
                  "Und wann ist die Abfahrt?"
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                0,
                8
              ]
            },
            "micOff": true
          },
          {
            "canDo": 1,
            "type": "production",
            "promptDe": "Antworten Sie mit einem Satz. Sie fahren nach Österreich und kaufen eine Fahrkarte. Sie haben zwanzig Euro. Sie: …?",
            "promptEn": "You are going to Austria and are buying your ticket. You have twenty euros on you. Ask about the price of the ticket.",
            "answer": "Was kostet die Fahrkarte?",
            "parts": [
              {
                "label": {
                  "de": "die Frage",
                  "en": "the question"
                },
                "forms": [
                  "Was kostet die Fahrkarte?",
                  "Entschuldigung, was kostet die Fahrkarte?",
                  "Was kostet die Fahrkarte, bitte?",
                  "Was kostet die Fahrkarte nach Österreich?",
                  "Entschuldigung, was kostet die Fahrkarte nach Österreich?",
                  "Was kostet die Fahrkarte nach Österreich, bitte?",
                  "Was kostet eine Fahrkarte?",
                  "Entschuldigung, was kostet eine Fahrkarte?",
                  "Was kostet eine Fahrkarte, bitte?",
                  "Was kostet eine Fahrkarte nach Österreich?",
                  "Entschuldigung, was kostet eine Fahrkarte nach Österreich?",
                  "Was kostet eine Fahrkarte nach Österreich, bitte?",
                  "Wie viel kostet die Fahrkarte?",
                  "Entschuldigung, wie viel kostet die Fahrkarte?",
                  "Wie viel kostet die Fahrkarte, bitte?",
                  "Wie viel kostet die Fahrkarte nach Österreich?",
                  "Entschuldigung, wie viel kostet die Fahrkarte nach Österreich?",
                  "Wie viel kostet die Fahrkarte nach Österreich, bitte?",
                  "Wie viel kostet eine Fahrkarte?",
                  "Entschuldigung, wie viel kostet eine Fahrkarte?",
                  "Wie viel kostet eine Fahrkarte, bitte?",
                  "Wie viel kostet eine Fahrkarte nach Österreich?",
                  "Entschuldigung, wie viel kostet eine Fahrkarte nach Österreich?",
                  "Wie viel kostet eine Fahrkarte nach Österreich, bitte?",
                  "Wie teuer ist die Fahrkarte?",
                  "Entschuldigung, wie teuer ist die Fahrkarte?",
                  "Wie teuer ist die Fahrkarte, bitte?",
                  "Wie teuer ist die Fahrkarte nach Österreich?",
                  "Entschuldigung, wie teuer ist die Fahrkarte nach Österreich?",
                  "Wie teuer ist die Fahrkarte nach Österreich, bitte?",
                  "Wie teuer ist eine Fahrkarte?",
                  "Entschuldigung, wie teuer ist eine Fahrkarte?",
                  "Wie teuer ist eine Fahrkarte, bitte?",
                  "Wie teuer ist eine Fahrkarte nach Österreich?",
                  "Entschuldigung, wie teuer ist eine Fahrkarte nach Österreich?",
                  "Wie teuer ist eine Fahrkarte nach Österreich, bitte?",
                  "Kostet die Fahrkarte zwanzig Euro?",
                  "Kostet die Fahrkarte 20 Euro?",
                  "Kostet die Fahrkarte 20 €?",
                  "Kostet die Fahrkarte nach Österreich zwanzig Euro?",
                  "Kostet die Fahrkarte nach Österreich 20 Euro?",
                  "Kostet die Fahrkarte nach Österreich 20 €?",
                  "Kostet eine Fahrkarte zwanzig Euro?",
                  "Kostet eine Fahrkarte 20 Euro?",
                  "Kostet eine Fahrkarte 20 €?",
                  "Kostet eine Fahrkarte nach Österreich zwanzig Euro?",
                  "Kostet eine Fahrkarte nach Österreich 20 Euro?",
                  "Kostet eine Fahrkarte nach Österreich 20 €?",
                  "Entschuldigung, kostet die Fahrkarte zwanzig Euro?",
                  "Entschuldigung, kostet die Fahrkarte 20 Euro?",
                  "Entschuldigung, kostet die Fahrkarte 20 €?",
                  "Entschuldigung, kostet die Fahrkarte nach Österreich zwanzig Euro?",
                  "Entschuldigung, kostet die Fahrkarte nach Österreich 20 Euro?",
                  "Entschuldigung, kostet die Fahrkarte nach Österreich 20 €?",
                  "Entschuldigung, kostet eine Fahrkarte zwanzig Euro?",
                  "Entschuldigung, kostet eine Fahrkarte 20 Euro?",
                  "Entschuldigung, kostet eine Fahrkarte 20 €?",
                  "Entschuldigung, kostet eine Fahrkarte nach Österreich zwanzig Euro?",
                  "Entschuldigung, kostet eine Fahrkarte nach Österreich 20 Euro?",
                  "Entschuldigung, kostet eine Fahrkarte nach Österreich 20 €?"
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                4
              ]
            },
            "micOff": true
          },
          {
            "canDo": 2,
            "type": "listening",
            "promptDe": "Am Bahnhof hören Sie die Durchsage. Was ist mit dem Zug? Wählen Sie.",
            "promptEn": "Listen to the announcement. Choose what it tells you about the train.",
            "answer": "Der Zug ist nicht pünktlich. Er fährt von Gleis fünf.",
            "reteach": {
              "kind": "dialog",
              "indices": [
                2,
                3,
                7,
                9
              ]
            },
            "micOff": true,
            "mode": "choice",
            "instances": [
              {
                "answer": "Der Zug ist nicht pünktlich. Er fährt von Gleis fünf.",
                "accepted": [
                  "Der Zug ist nicht pünktlich. Er fährt von Gleis fünf."
                ],
                "options": [
                  "Der Zug ist pünktlich. Er fährt von Gleis fünf.",
                  "Der Zug ist nicht pünktlich. Er fährt von Gleis fünf.",
                  "Der Zug ist nicht pünktlich. Er fährt von Gleis zehn.",
                  "Der Zug ist pünktlich. Er fährt von Gleis zehn."
                ],
                "audioText": "Der Zug nach Österreich hat heute Verspätung. Die Abfahrt ist um zehn Uhr an Gleis fünf."
              },
              {
                "audioText": "Der Zug nach Österreich ist heute pünktlich. Die Abfahrt ist um zehn Uhr an Gleis vier.",
                "answer": "Der Zug ist pünktlich. Er fährt von Gleis vier.",
                "accepted": [
                  "Der Zug ist pünktlich. Er fährt von Gleis vier."
                ],
                "options": [
                  "Der Zug ist nicht pünktlich. Er fährt von Gleis vier.",
                  "Der Zug ist pünktlich. Er fährt von Gleis fünf.",
                  "Der Zug ist pünktlich. Er fährt von Gleis vier.",
                  "Der Zug ist nicht pünktlich. Er fährt von Gleis fünf."
                ]
              }
            ]
          },
          {
            "canDo": 3,
            "type": "production",
            "promptDe": "Antworten Sie mit einem Satz. Am Bus. Ihre Fahrkarte: Bremen – Berlin. Der Fahrer: „Wohin fahren Sie?“ Sie: …",
            "promptEn": "At the bus: your ticket says Bremen – Berlin. The driver asks where you are going. Tell him.",
            "answer": "Ich fahre nach Berlin.",
            "parts": [
              {
                "label": {
                  "de": "das Ziel",
                  "en": "where you are going"
                },
                "forms": [
                  "Ich fahre nach Berlin.",
                  "Nach Berlin.",
                  "Ich fahre mit dem Bus nach Berlin.",
                  "Ich fahre nach Berlin mit dem Bus.",
                  "Ich fahre heute nach Berlin.",
                  "Ich fahre von Bremen nach Berlin.",
                  "Von Bremen nach Berlin."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                0
              ]
            },
            "micOff": true
          }
        ]
      },
      guided: {
        read: {
          titleDe: 'Der Bus am Bahnhof',
          titleEn: 'The bus at the station',
          instructionDe: 'Lesen Sie die Information am Bahnhof. Tippen Sie auf ein Wort für seine Bedeutung.',
          instructionEn: 'Read the notice at the station. Tap a word for its meaning.',
          text: 'Bus am Bahnhof Bremen\nSie haben kein Auto? Fahren Sie mit dem Bus!\nIn welches Land fahren Sie?\nDeutschland: Der Bus fährt heute und morgen nach Berlin.\nÖsterreich: Der Bus fährt nächste Woche am Montag.\nIn die Schweiz fährt der Bus leider nicht.\nAbfahrt: immer um 8 Uhr, hier am Bahnhof.\nDie Fahrkarte kaufen Sie beim Fahrer oder bei der Fahrerin.',
          questions: [
            {
              promptDe: 'Wann fährt der Bus nach Österreich? Wählen Sie die Antwort.',
              promptEn: 'When does the bus go to Austria? Choose the answer.',
              options: ['Today and tomorrow.', 'Next week, on Monday.', 'Next week, on Friday.'],
              answer: 'Next week, on Monday.',
              explanationDe: 'In der Information steht: Österreich – der Bus fährt nächste Woche am Montag. Heute und morgen fährt er nach Berlin.',
              explanationEn: 'The notice says the bus to Austria runs next week, on Monday. Today and tomorrow it goes to Berlin.',
            },
            {
              promptDe: 'Wo kaufen Sie die Fahrkarte für den Bus? Wählen Sie die Antwort.',
              promptEn: 'Where do you buy the ticket for the bus? Choose the answer.',
              options: ['At the counter in the station.', 'From a machine at the platform.', 'From the driver of the bus.'],
              answer: 'From the driver of the bus.',
              explanationDe: 'In der Information steht: Die Fahrkarte kaufen Sie beim Fahrer oder bei der Fahrerin.',
              explanationEn: 'The notice says you buy the ticket from the driver: a man (Fahrer) or a woman (Fahrerin).',
            },
          ],
        },
        chunks: [
          {
            from: 0,
            to: 2,
            meaning: {
              promptDe: 'Wann und wo fährt der Zug nach Österreich? Wählen Sie die Antwort.',
              promptEn: 'When and where does the train to Austria leave? Choose the answer.',
              options: ['At four o’clock from platform nine.', 'At nine o’clock from platform five.', 'At nine o’clock from platform four.'],
              answer: 'At nine o’clock from platform four.',
            },
            say: {
              line: 0,
            },
          },
          {
            from: 2,
            to: 4,
            meaning: {
              promptDe: 'Was sagt Herr Schmidt über den Zug? Wählen Sie die Bedeutung.',
              promptEn: 'What does Herr Schmidt say about the train? Choose the meaning.',
              options: ['The train is on time.', 'The train is delayed.', 'The train is full.'],
              answer: 'The train is on time.',
            },
            say: {
              line: 2,
            },
          },
          {
            from: 4,
            to: 6,
            meaning: {
              promptDe: 'Was kostet die Fahrkarte? Wählen Sie die Antwort.',
              promptEn: 'How much is the ticket? Choose the answer.',
              options: ['Twenty euros.', 'Fifteen euros.', 'Fifty euros.'],
              answer: 'Fifteen euros.',
            },
            say: {
              line: 4,
            },
          },
          {
            from: 6,
            to: 8,
            meaning: {
              promptDe: 'Ist das Gleis weit? Wählen Sie die Bedeutung.',
              promptEn: 'Is the platform far? Choose the meaning.',
              options: ['No, the train leaves right here, from platform four.', 'Yes, platform four is at the other end of the station.', 'No, but Ana has to take the bus to get there.'],
              answer: 'No, the train leaves right here, from platform four.',
            },
            say: {
              line: 6,
            },
          },
          {
            from: 8,
            to: 10,
            meaning: {
              promptDe: 'Was sagt die Durchsage? Wählen Sie die Bedeutung.',
              promptEn: 'What does the announcement say? Choose the meaning.',
              options: ['The train is on time; please board at platform four.', 'The train is cancelled; please take the bus.', 'The train is delayed; please change at platform five.'],
              answer: 'The train is delayed; please change at platform five.',
            },
            say: {
              line: 8,
            },
          },
        ],
      },
      nextHook: {
        de: 'Im Kurs fragt Lena Tim: Was hast du gestern gemacht? Und für Freitag haben die beiden einen Plan.',
        en: 'In class, Lena asks Tim what he did yesterday. And the two of them have a plan for Friday.',
      },
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
        { de: 'der Fahrer', exampleDe: 'Der Fahrer fährt den Bus.', word: 'Fahrer', article: 'der', plural: 'Fahrer', en: 'driver (m)', wordId: 'd5e2f5d9-28b2-4aa3-9669-cab0e96953ee' },
        { de: 'die Fahrerin', exampleDe: 'Die Fahrerin fährt das Auto.', word: 'Fahrerin', article: 'die', plural: 'Fahrerinnen', en: 'driver (f)', wordId: '85aa0d16-8e22-481e-9e9c-67ceae66751e' },
        { de: 'Deutschland', exampleDe: 'Der Zug fährt nach Deutschland.', word: 'Deutschland', article: null, plural: null, en: 'Germany', wordId: 'f59e9ed6-4c90-4792-a69d-921a73b8c103' },
        { de: 'Österreich', word: 'Österreich', article: null, plural: null, en: 'Austria', wordId: '21edee4f-dacc-4a7a-b1ea-2e8f312f7907' },
        { de: 'die Schweiz', word: 'Schweiz', article: 'die', plural: '—', en: 'Switzerland', wordId: 'c3646999-1ca7-4b5e-903a-22a68642ef26' },
        // Four more country names did not cover a Lektion called „Am Bahnhof“; the station lexis of the
        // title and of two can-dos does (DaF review, L10).
        { de: 'der Bahnhof', word: 'Bahnhof', article: 'der', plural: 'Bahnhöfe', en: 'station', wordId: '57180ebe-62ac-4b85-bc55-6f0b46319fda' },
        { de: 'die Abfahrt', word: 'Abfahrt', article: 'die', plural: 'Abfahrten', en: 'departure', wordId: 'cc687805-201f-4cda-b4b4-48a20fad82cd' },
        { de: 'die Ankunft', word: 'Ankunft', article: 'die', plural: 'Ankünfte', en: 'arrival', wordId: '7374721b-f929-4b81-943a-93dc6ba2b9a1' },
        { de: 'das Gleis', word: 'Gleis', article: 'das', plural: 'Gleise', en: 'platform, track', wordId: 'e9a722a3-d2c7-46ae-8421-d8a213451e57' },
        { de: 'das Land', exampleDe: 'Deutschland ist ein Land.', word: 'Land', article: 'das', plural: 'Länder', en: 'country', field: true, wordId: 'b8ff9106-be72-426f-8be3-c0687cf75641' },
        { de: 'morgen', exampleDe: 'Fährt der Zug morgen?', word: 'morgen', article: null, plural: null, en: 'tomorrow', wordId: '79c868e5-5478-4d52-a85a-653c7acf078f' },
        { de: 'umsteigen', word: 'umsteigen', article: null, plural: null, en: 'to change (trains)', wordId: '7cf99ee9-b106-4db9-954f-cb6f17eab4e9' },
        { de: 'nächste Woche', exampleDe: 'Fahren Sie nächste Woche nach Österreich?', word: 'nächste Woche', article: null, plural: null, en: 'next week', wordId: 'ebad6993-2d67-4891-8abe-5b0e74091495' },
        { de: 'leider', word: 'leider', article: null, plural: null, en: 'unfortunately', wordId: 'c76140c6-0461-47e2-98da-567540a79b9c' },
        { de: 'der Zug', word: 'Zug', article: 'der', plural: 'Züge', en: 'train', wordId: '5289f923-0edf-4d16-83ae-e010a14ecad8' },
        { de: 'der Bus', word: 'Bus', article: 'der', plural: 'Busse', en: 'bus', wordId: '879f1d1d-1a84-427b-8c5d-fb15eeb67436' },
        { de: 'das Auto', exampleDe: 'Das Auto ist blau.', word: 'Auto', article: 'das', plural: 'Autos', en: 'car', wordId: '564227da-5f73-4b01-8130-650983c5c578' },
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
          { speaker: 'Ana', de: 'Fährt der Bus auch in die Schweiz? Ist das Gleis weit?', en: 'Does the bus go to Switzerland too? Is the platform far?' },
          { speaker: 'Herr Schmidt', de: 'Nein, leider nicht. Die Abfahrt ist hier an Gleis vier.', en: 'No, unfortunately not. The departure is here on platform four.' },
          // Bahnhof, Abfahrt, Ankunft and umsteigen were Wortfeld-only, and the „Durchsagen“ can-do
          // had no announcement to understand. The announcement is read out by the man at the counter
          // rather than given its own speaker, because a dialogue has exactly two speakers
          // (scripts/validate-curriculum.mjs RULE 5). It is now the dictation line (review #2, L10, §A).
          { speaker: 'Ana', de: 'Danke! Und wann ist die Ankunft?', en: 'Thank you! And when is the arrival?' },
          { speaker: 'Herr Schmidt', de: 'Durchsage: Der Zug hat Verspätung. Bitte an Gleis fünf umsteigen!', en: 'Announcement: the train is delayed. Please change trains at platform five!' },
        ],
      },
      pretest: {
        promptDe: 'Fragen Sie, ob der Zug nach Österreich fährt.',
        promptEn: 'Ask whether the train goes to Austria.',
        model: 'Fährt der Zug nach Österreich?',
        accepted: ['Fährt', 'Geht', 'Kommt'],
      },
      notice: {
        formExamples: ['fahren: Wir fahren nach Österreich.', 'Fährst du morgen?'],
        title: 'Ja/Nein-Fragen: das Verb steht vorn',
        bodyDe: 'Bei der Ja/Nein-Frage steht das Verb auf Position 1: Der Zug fährt. → **Fährt** der Zug? Die Antwort ist **ja** oder **nein**. Die Satzmelodie steigt am Ende. **fahren** ist unregelmäßig: du **fährst**, er **fährt**.',
        bodyEn: 'A yes/no question needs no helper word like the English "do". Just move the verb to the front: **Der Zug fährt.** (The train is leaving.) → **Fährt der Zug?** (Is the train leaving?). The answer is **ja** or **nein**, and your voice goes up at the end of the question. The verb **fahren** (to go by train, bus or car) changes its vowel in two forms: du **fährst**, er **fährt**.',
        examples: ['Entschuldigung, fährt der Zug nach Österreich?', 'Kostet die Fahrkarte zwanzig Euro?'],
        ruleSlug: 'yes-no-questions',
      },
      phonetik: { focus: 'Steigende Satzmelodie in der Ja/Nein-Frage', focusEn: 'In a yes/no question the melody rises', items: ['Fährt der ZUG?↗', 'Hast du ZEIT?↗', 'Kommst du MIT?↗'] },
      hoeren: { kind: 'dictation', lines: [1, 9] },
      sprechen: {
        readAloud: [0, 2],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie zum Thema Reisen: Zug? Fahrkarte? Wohin?',
          promptEn: 'Ask and answer questions about travelling: the train? the ticket? where to?',
          hintWords: ['fahren', 'die Fahrkarte', 'der Zug'],
          // Sie — Teil 2 zum Thema Reisen: Schalter bzw. Mitkandidat, nicht Freundeskreis.
          anrede: 'Sie',
          missionOrder: null,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a11-l10',
        taskDe: 'Schreiben Sie Ihrer Kollegin Frau Kaya: Sie kommen später. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        taskEn: 'Write to your colleague Frau Kaya (formal, with Sie): you will be late. Open with a greeting and close with a sign-off. Cover three points: why you are writing; when you will arrive; what your colleague should do until then.',
        leitpunkte: ['Warum Sie schreiben', 'Wann Sie kommen', 'Was die Kollegin bis dahin machen soll'],
        minWords: 25,
        maxWords: 45,
        // 29 Wörter. Der dritte Leitpunkt („Was die Kollegin bis dahin machen soll“) war im alten
        // Mustertext gar nicht modelliert; die Kollegin wird gesiezt.
        // 2026-10-07 (Entscheidung des Inhabers): Register `formell` in der Aufgabenbank, die Kollegin
        // hat einen Namen (Frau Kaya, wie in L1 und L12) und der Mustertext grüßt wie L6.
        // ROUND 18 (DaF review #17, MAJOR 1 „Fünftens“): „Bitte machen Sie die Arbeit bis zehn Uhr
        // ohne mich.“ ist raus — ein Satz, den niemand schreibt, und er stand da, weil der Formcheck
        // den Auftrags-Leitpunkt am Echo von `machen` entschied (zehn von zwölf richtigen Aufträgen
        // rot). Der Auftrag ist jetzt ein Satz: „Bitte beginnen Sie ohne mich.“ Die andere Fassung
        // der Review, „Bitte rufen Sie Herrn Weber an.“, ist in Lektion 10 NICHT gelehrte Lexis —
        // `anrufen` ist die Satzklammer-Lektion 11 und `Herrn` steht in keiner Liste — und RULE 20
        // (hart 0) meldet beide; `beginnen` ist seit Lektion 5 gelehrt. Der Formcheck muss den
        // Auftrag an der Satzart (Imperativ mit Sie / bitte + Verb) erkennen, nicht am Aufgabenverb —
        // das ist die Regel in `src/lib/lesson/writing.js`, die MAJOR 1 „Zweitens“ bestellt.
        sample: 'Guten Tag, Frau Kaya! Der Zug hat leider Verspätung. Die Kollegen kommen um neun Uhr, ich komme um zehn Uhr. Bitte beginnen Sie ohne mich. Vielen Dank und viele Grüße, Ana',
      },
      links: { listeningExercise: 3, readingOrder: 6 },
      // Only the primary topic: the two-topic rule drew haben items twice over from L9 (DaF review, L10).
      practiceRule: { topics: ['yes-no-questions'], typedMin: 4 },
    },
    {
      nr: 11,
      id: 'a1.1-l11',
      slug: 'gestern-und-heute',
      flow: 'guided',
      proof: {
        "tasks": [
          {
            "canDo": 0,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Eine Kollegin: „Was machen Sie jeden Tag?“ – Sie (duschen): … Eine Kollegin: „Und am Sonntag?“ – Sie (schlafen, bis 9 Uhr): …",
            "promptEn": "A colleague asks what you do every day. Tell her that you shower. Then she asks about Sunday: tell her that you sleep until nine.",
            "answer": "Ich dusche jeden Tag. Ich schlafe am Sonntag bis neun.",
            "parts": [
              {
                "label": {
                  "de": "jeden Tag",
                  "en": "every day"
                },
                "forms": [
                  "Ich dusche jeden Tag.",
                  "Ich dusche.",
                  "Jeden Tag dusche ich.",
                  "Ich dusche und frühstücke jeden Tag.",
                  "Ich dusche und frühstücke.",
                  "Ich frühstücke und dusche jeden Tag.",
                  "Ich frühstücke und dusche."
                ]
              },
              {
                "label": {
                  "de": "der Sonntag",
                  "en": "Sunday"
                },
                "forms": [
                  "Ich schlafe am Sonntag bis neun.",
                  "Am Sonntag schlafe ich bis neun.",
                  "Ich schlafe bis neun.",
                  "Ich schlafe am Sonntag bis neun Uhr.",
                  "Am Sonntag schlafe ich bis neun Uhr.",
                  "Ich schlafe bis neun Uhr.",
                  "Ich schlafe am Sonntag bis 9.",
                  "Am Sonntag schlafe ich bis 9.",
                  "Ich schlafe bis 9.",
                  "Ich schlafe am Sonntag bis 9 Uhr.",
                  "Am Sonntag schlafe ich bis 9 Uhr.",
                  "Ich schlafe bis 9 Uhr."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                8,
                9
              ]
            },
            "micOff": true,
            "allowModelContext": true
          },
          {
            "canDo": 1,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Sie (gestern?): „Tim, …?“ – Tim: „Ich? Nicht viel!“ – Sie (gestern: Arbeit): …",
            "promptEn": "Ask your friend Tim what he did yesterday. He did not do much. Then say what you did yesterday: you worked.",
            "answer": "Was hast du gestern gemacht? Ich habe gearbeitet.",
            "parts": [
              {
                "label": {
                  "de": "die Frage",
                  "en": "the question"
                },
                "forms": [
                  "Was hast du gestern gemacht?"
                ]
              },
              {
                "label": {
                  "de": "die Antwort",
                  "en": "the answer"
                },
                "forms": [
                  "Ich habe gearbeitet.",
                  "Ich habe gestern gearbeitet.",
                  "Gestern habe ich gearbeitet."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                0,
                1
              ]
            },
            "micOff": true,
            "register": "informal",
            "allowModelContext": true
          },
          {
            "canDo": 2,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Eine Freundin: „Am Freitag habe ich frei.“ – Sie (einkaufen, Freitag): … Sie (mitkommen?): …?",
            "promptEn": "A friend tells you she is free on Friday. Tell her that you are going shopping on Friday. Then ask her whether she is coming along.",
            "answer": "Ich kaufe am Freitag ein. Kommst du mit?",
            "parts": [
              {
                "label": {
                  "de": "der Plan",
                  "en": "the plan"
                },
                "forms": [
                  "Ich kaufe am Freitag ein.",
                  "Am Freitag kaufe ich ein.",
                  "Ja, ich kaufe am Freitag ein.",
                  "Ich gehe am Freitag einkaufen.",
                  "Am Freitag gehe ich einkaufen."
                ]
              },
              {
                "label": {
                  "de": "die Frage",
                  "en": "the question"
                },
                "forms": [
                  "Kommst du mit?",
                  "Kommst du am Freitag mit?",
                  "Kommst du auch mit?",
                  "Möchtest du mitkommen?"
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                5
              ]
            },
            "micOff": true,
            "register": "informal"
          },
          {
            "canDo": 3,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Ein Kollege: „Und Ihr Tag?“ – Sie (aufstehen, 6 Uhr): … Sie (arbeiten, Montag): …",
            "promptEn": "A colleague asks about your day. Tell him when you get up: at six. Then tell him when you work: on Monday. Use one full sentence for each.",
            "answer": "Ich stehe um sechs auf. Ich arbeite am Montag.",
            "parts": [
              {
                "label": {
                  "de": "aufstehen (ein ganzer Satz)",
                  "en": "getting up (one full sentence)"
                },
                "forms": [
                  "Ich stehe um sechs auf.",
                  "Ich stehe morgens um sechs auf.",
                  "Ich stehe jeden Tag um sechs auf.",
                  "Um sechs stehe ich auf.",
                  "Morgens stehe ich um sechs auf.",
                  "Ich stehe um sechs Uhr auf.",
                  "Ich stehe morgens um sechs Uhr auf.",
                  "Ich stehe jeden Tag um sechs Uhr auf.",
                  "Um sechs Uhr stehe ich auf.",
                  "Morgens stehe ich um sechs Uhr auf.",
                  "Ich stehe um 6 auf.",
                  "Ich stehe morgens um 6 auf.",
                  "Ich stehe jeden Tag um 6 auf.",
                  "Um 6 stehe ich auf.",
                  "Morgens stehe ich um 6 auf.",
                  "Ich stehe um 6 Uhr auf.",
                  "Ich stehe morgens um 6 Uhr auf.",
                  "Ich stehe jeden Tag um 6 Uhr auf.",
                  "Um 6 Uhr stehe ich auf.",
                  "Morgens stehe ich um 6 Uhr auf."
                ]
              },
              {
                "label": {
                  "de": "arbeiten (ein ganzer Satz)",
                  "en": "working (one full sentence)"
                },
                "forms": [
                  "Ich arbeite am Montag.",
                  "Am Montag arbeite ich.",
                  "Und ich arbeite am Montag.",
                  "Und am Montag arbeite ich."
                ],
                "ellipsisOpening": "Ich"
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                3,
                9
              ]
            },
            "micOff": true,
            "order": "any",
            "allowModelContext": true
          }
        ]
      },
      guided: {
        read: {
          titleDe: 'Tims Zettel für Freitag',
          titleEn: 'Tim\'s note for Friday',
          instructionDe: 'Lesen Sie Tims Zettel. Tippen Sie auf ein Wort für seine Bedeutung.',
          instructionEn: 'Read Tim\'s note. Tap a word for its meaning.',
          text: 'Wochentag: Freitag\nUm sechs Uhr aufstehen, duschen, frühstücken\nLena anrufen – noch nicht gemacht!\nUm vier Uhr Lena abholen: Sie möchte mitkommen.\nDas Wörterbuch für Lena mitbringen!\nDann einkaufen: Brot, Kaffee und Wasser. Tee habe ich schon.\nUm sieben Uhr nach Hause. Abends bin ich müde.\nLetzte Woche: jeden Tag gearbeitet. Am Sonntag: bis neun schlafen!',
          questions: [
            {
              promptDe: 'Was macht Tim um vier Uhr? Wählen Sie die Antwort.',
              promptEn: 'What does Tim do at four o\'clock? Choose the answer.',
              options: ['He calls Lena, and then they have breakfast.', 'He picks Lena up, and then they go shopping.', 'He goes home, and then he sleeps until nine.'],
              answer: 'He picks Lena up, and then they go shopping.',
              explanationDe: 'Auf dem Zettel steht: Um vier Uhr Lena abholen. Dann einkaufen.',
              explanationEn: 'The note says: pick Lena up at four o\'clock, then go shopping.',
            },
            {
              promptDe: 'Was kauft Tim nicht? Wählen Sie die Antwort.',
              promptEn: 'What does Tim not buy? Choose the answer.',
              options: ['Tea, because he already has some.', 'Bread, because he already has some.', 'Coffee, because he does not drink it.'],
              answer: 'Tea, because he already has some.',
              explanationDe: 'Auf dem Zettel steht: Tee habe ich schon. Tim kauft Brot, Kaffee und Wasser.',
              explanationEn: 'The note says: I already have tea. Tim buys bread, coffee and water.',
            },
          ],
        },
        chunks: [
          {
            from: 0,
            to: 2,
            meaning: {
              promptDe: 'Was hat Tim gestern gemacht? Wählen Sie die Bedeutung.',
              promptEn: 'What did Tim do yesterday? Choose the meaning.',
              options: ['He studied German.', 'He was working.', 'He went shopping.'],
              answer: 'He was working.',
            },
            say: {
              line: 1,
            },
          },
          {
            from: 2,
            to: 4,
            meaning: {
              promptDe: 'Was sagt Tim über den Morgen? Wählen Sie die Bedeutung.',
              promptEn: 'What does Tim say about his mornings? Choose the meaning.',
              options: ['He gets up at six and is tired.', 'He gets up at seven and is tired.', 'He gets up at six and feels fine.'],
              answer: 'He gets up at six and is tired.',
            },
            say: {
              line: 3,
            },
          },
          {
            from: 4,
            to: 6,
            meaning: {
              promptDe: 'Was macht Tim am Freitag? Wählen Sie die Bedeutung.',
              promptEn: 'What is Tim doing on Friday? Choose the meaning.',
              options: ['He is working and cannot go shopping.', 'He is staying at home and sleeping in.', 'He is going shopping and asks Lena to come.'],
              answer: 'He is going shopping and asks Lena to come.',
            },
            say: {
              line: 5,
            },
          },
          {
            from: 6,
            to: 8,
            meaning: {
              promptDe: 'Was sagt Lena? Wählen Sie die Bedeutung.',
              promptEn: 'What does Lena say? Choose the meaning.',
              options: ['She is coming along and asks Tim to call her.', 'She cannot come and will call Tim next week.', 'She is coming along and will pick Tim up at six.'],
              answer: 'She is coming along and asks Tim to call her.',
            },
            say: {
              line: 7,
            },
          },
          {
            from: 8,
            to: 10,
            meaning: {
              promptDe: 'Was macht Tim am Sonntag? Wählen Sie die Bedeutung.',
              promptEn: 'What does Tim do on Sunday? Choose the meaning.',
              options: ['He gets up at six.', 'He sleeps until nine.', 'He works until nine.'],
              answer: 'He sleeps until nine.',
            },
            say: {
              line: 9,
            },
          },
        ],
      },
      nextHook: {
        de: 'Ana hat bald Geburtstag und plant eine Party. Wen lädt sie ein?',
        en: 'Ana\'s birthday is coming up and she is planning a party. Who will she invite?',
      },
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
        { de: 'letzte Woche', exampleDe: 'Letzte Woche habe ich gearbeitet.', word: 'letzte Woche', article: null, plural: null, en: 'last week', wordId: '1f732f26-b03d-44cc-848f-368727f687d9' },
        { de: 'der Tag', word: 'Tag', article: 'der', plural: 'Tage', en: 'day', wordId: '4442348b-1623-4a81-947e-04361d4a6c1e' },
        { de: 'der Wochentag', exampleDe: 'Montag ist ein Wochentag.', word: 'Wochentag', article: 'der', plural: 'Wochentage', en: 'weekday', wordId: '2df94b7e-3050-431d-af30-d7617a5868ee' },
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
        { de: 'nach Hause', exampleDe: 'Ich gehe nach Hause.', word: 'nach Hause', article: null, plural: null, en: 'home (direction)', wordId: '4998446b-cfe0-4b28-8a1c-816e83aac793' },
        { de: 'abholen', exampleDe: 'Ich hole Sie am Bahnhof ab.', word: 'abholen', article: null, plural: null, en: 'to pick up, to collect', wordId: 'b26d75f6-1c2e-4749-a6fb-d10515ed285c' },
        { de: 'mitbringen', word: 'mitbringen', article: null, plural: null, en: 'to bring along', wordId: '75574213-060f-4f93-80a9-e6764e9fdd5a' },
        { de: 'einkaufen', word: 'einkaufen', article: null, plural: null, en: 'to go shopping', wordId: '1e4c6cff-59b8-42eb-8de3-b8142d10a6d3' },
        // anrufen came over from L6, where it appeared in no line: this is the Lektion whose dialogue
        // says „Rufst du mich an?“ and whose notice takes an|rufen apart. der Kalender was unused and
        // krank moved to L8's Gesundheit Handlungsfeld (review #2, L6 and L11).
        { de: 'anrufen', word: 'anrufen', article: null, plural: null, en: 'to call (on the phone)', wordId: '29a7e95e-d41e-42b3-8fe2-84a90433082b' },
        { de: 'mitkommen', word: 'mitkommen', article: null, plural: null, en: 'to come along', wordId: '889e2bbc-c219-4f4a-8491-317ff014aa38' },
        { de: 'lernen', word: 'lernen', article: null, plural: null, en: 'to learn, to study', wordId: '962b62ac-d60f-4ecf-b501-dcbdcfd7f8e2' },
        // arbeiten moved to L7's Wortfeld: two drawn L7 items drill it (and the -t stem e-Einschub)
        // four Lektionen before it was introduced here (DaF review #5, MAJOR 6). It stays in this
        // Lektion's input (dialogue line 1, notice, Sprechauftrag) — it is simply taught earlier.
      ],
      dialog: {
        title: 'Was hast du gestern gemacht?',
        setting: 'Tim und Lena am Donnerstag im Kurs.',
        lines: [
          { speaker: 'Lena', de: 'Tim, was hast du gestern gemacht?', en: 'Tim, what did you do yesterday?' },
          { speaker: 'Tim', de: 'Ich habe gearbeitet. Heute lerne ich Deutsch.', en: 'I worked. Today I am studying German.' },
          { speaker: 'Lena', de: 'Und wann stehst du morgens auf?', en: 'And when do you get up in the morning?' },
          { speaker: 'Tim', de: 'Ich stehe um sechs auf. Ich bin müde.', en: 'I get up at six. I am tired.' },
          // The scene is Thursday: „heute“ was answered „am Freitag“ (2026-10 review). „morgen“ is taught in L10.
          { speaker: 'Lena', de: 'Kaufst du morgen ein?', en: 'Are you going shopping tomorrow?' },
          { speaker: 'Tim', de: 'Ja, ich kaufe am Freitag ein. Kommst du mit?', en: 'Yes, I am going shopping on Friday. Are you coming along?' },
          { speaker: 'Lena', de: 'Ja, ich komme mit. Rufst du mich an?', en: 'Yes, I am coming along. Will you call me?' },
          { speaker: 'Tim', de: 'Ja, ich rufe dich an.', en: 'Yes, I will call you.' },
          // frühstücken, duschen, schlafen and mitbringen were Wortfeld-only, so the Tagesablauf
          // can-do rested on three verbs; the last line shows the schlafen vowel change (review #2, §A).
          { speaker: 'Lena', de: 'Ich dusche und frühstücke jeden Tag. Ich bringe Kuchen mit.', en: 'I shower and have breakfast every day. I bring cake along.' },
          { speaker: 'Tim', de: 'Ich schlafe am Sonntag bis neun. Mein Bruder schläft auch.', en: 'On Sunday I sleep until nine. My brother sleeps in too.' },
        ],
      },
      pretest: { promptDe: 'Sagen Sie, was Sie gestern gemacht haben.', promptEn: 'Say what you did yesterday.', model: 'Ich habe gearbeitet.', accepted: ['Ich habe', 'Gestern habe ich'] },
      notice: {
        formExamples: ['schlafen: Wir schlafen bis neun.'],
        title: 'Trennbare Verben: die Satzklammer',
        bodyDe: 'Trennbare Verben teilen sich: ein|kaufen → Ich **kaufe** am Freitag **ein**. Das Verb steht auf Position 2 (in der Ja/Nein-Frage auf Position 1), die Vorsilbe am Ende. So auch auf|stehen, an|rufen, mit|bringen. **Ich rufe dich an** ist eine feste Wendung. **schlafen** wechselt den Vokal: er **schläft**. **Gemacht** und **gearbeitet** stehen hier als Ganzes — das Muster (Perfekt) kommt in A1.2.',
        bodyEn: 'Some verbs have two parts: **ein|kaufen** (to shop). In a sentence the verb stays in second position (first in a yes/no question) and the prefix goes to the end: **Ich kaufe am Freitag ein.** Same with **auf|stehen** (get up), **an|rufen** (call), **mit|bringen** (bring along). **Ich rufe dich an** is a set phrase. **schlafen** changes its vowel: er **schläft**. **Gemacht** and **gearbeitet** are learned whole; the pattern (Perfekt) comes in A1.2.',
        examples: ['Ich stehe um sechs auf. Ich bin müde.', 'Ja, ich kaufe am Freitag ein. Kommst du mit?'],
        ruleSlug: 'separable-verbs-intro',
      },
      phonetik: { focus: 'Betonung auf der trennbaren Vorsilbe', focusEn: 'Stress on the separable prefix', items: ['AUF-stehen', 'EIN-kaufen', 'AN-rufen'] },
      hoeren: { kind: 'dictation', lines: [3, 7] },
      sprechen: {
        readAloud: [5, 6],
        open: {
          teil: 'Sprechen Teil 2',
          promptDe: 'Fragen und antworten Sie zum Thema Tagesablauf: aufstehen? arbeiten? einkaufen?',
          promptEn: 'Ask and answer questions about your daily routine: getting up? working? shopping?',
          hintWords: ['aufstehen', 'einkaufen', 'gestern'],
          // Sie — Teil 2 zum Tagesablauf; Gegenüber bleibt die fremde Mitkandidatin.
          anrede: 'Sie',
          missionOrder: null,
        },
      },
      schreiben: {
        kind: 'formular',
        taskKey: 'a11-l11',
        taskDe: 'Tim Berger steht jeden Tag früh auf. Sein Kurs ist am Donnerstag von 9 Uhr bis 12 Uhr, in Zimmer 12. Füllen Sie den Wochenplan für den Kurs aus.',
        taskEn: 'Tim Berger gets up early every day. His course is on Thursday from 9 a.m. to 12 noon, in room 12. Fill in the weekly plan for the course (name, day, course from, course until, room).',
        fields: ['Name', 'Tag', 'Kurs von', 'Kurs bis', 'Zimmer'],
        minWords: 5,
        maxWords: 40,
        sample: 'Name: Tim Berger / Tag: Donnerstag / Kurs von: 9 Uhr / Kurs bis: 12 Uhr / Zimmer: 12',
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
      flow: 'guided',
      proof: {
        "tasks": [
          {
            "canDo": 0,
            "type": "production",
            "register": "formal",
            "promptDe": "Sagen Sie die Antwort. Eine Kollegin: „Sie feiern am Freitag Geburtstag. Und ich habe am Freitag frei!“ – Sie (einladen): …",
            "promptEn": "A colleague knows that you are celebrating your birthday on Friday, and she tells you she is free that day. Invite her in one sentence. Speak formally.",
            "answer": "Ich lade Sie ein.",
            "parts": [
              {
                "label": {
                  "de": "die Einladung",
                  "en": "the invitation"
                },
                "forms": [
                  "Ich lade Sie ein.",
                  "Ich lade Sie zum Fest ein.",
                  "Ich lade Sie zum Geburtstag ein.",
                  "Ich lade Sie zu meinem Fest ein.",
                  "Ich lade Sie zu meinem Geburtstag ein.",
                  "Ich lade Sie zur Party ein.",
                  "Ich lade Sie zu meiner Party ein.",
                  "Ich lade Sie auch ein.",
                  "Ich lade Sie auch zum Fest ein.",
                  "Ich lade Sie auch zum Geburtstag ein.",
                  "Ich lade auch Sie ein.",
                  "Ich lade Sie am Freitag ein.",
                  "Ich möchte Sie einladen.",
                  "Ich möchte Sie zum Fest einladen.",
                  "Ich möchte Sie zum Geburtstag einladen.",
                  "Ich möchte Sie zu meinem Fest einladen.",
                  "Ich möchte Sie zu meinem Geburtstag einladen.",
                  "Ich möchte Sie zur Party einladen.",
                  "Ich möchte Sie zu meiner Party einladen.",
                  "Ich möchte Sie auch einladen.",
                  "Kommen Sie?",
                  "Kommen Sie zum Fest?",
                  "Kommen Sie zum Geburtstag?",
                  "Kommen Sie zu meinem Fest?",
                  "Kommen Sie zu meinem Geburtstag?",
                  "Kommen Sie zur Party?",
                  "Kommen Sie zu meiner Party?",
                  "Kommen Sie auch?",
                  "Kommen Sie auch zum Fest?",
                  "Kommen Sie auch zum Geburtstag?",
                  "Kommen Sie am Freitag?",
                  "Kommen Sie am Freitag auch?",
                  "Kommen Sie auch am Freitag?",
                  "Möchten Sie kommen?",
                  "Möchten Sie auch kommen?",
                  "Möchten Sie zum Fest kommen?",
                  "Möchten Sie auch zum Fest kommen?",
                  "Möchten Sie zum Geburtstag kommen?",
                  "Möchten Sie auch zum Geburtstag kommen?"
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                5
              ]
            },
            "micOff": true,
            "context": [
              "Ja.",
              "Ich feiere am Freitag."
            ]
          },
          {
            "canDo": 1,
            "type": "production",
            "promptDe": "Antworten Sie mit einem Satz. Eine Kollegin: „Wann haben Sie Geburtstag?“ – Sie (Monat: 05): …",
            "promptEn": "A colleague asks when your birthday is. For this task it is in month 05 of the year. Tell her the month.",
            "answer": "Mein Geburtstag ist im Mai.",
            "parts": [
              {
                "label": {
                  "de": "der Monat",
                  "en": "the month"
                },
                "forms": [
                  "Mein Geburtstag ist im Mai.",
                  "Ich habe im Mai Geburtstag.",
                  "Im Mai.",
                  "Im Mai ist mein Geburtstag.",
                  "Im Mai habe ich Geburtstag.",
                  "Ich habe Geburtstag im Mai."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                1
              ]
            },
            "micOff": true,
            "allowModelContext": true
          },
          {
            "canDo": 2,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Eine Kollegin: „Wann feiern Sie? Und wer kommt?“ – Sie (Freitag): … Sie (Mama, Papa): …",
            "promptEn": "A colleague asks when you are celebrating and who is coming. Tell her that the party is on Friday. Then tell her that your mum and your dad are coming.",
            "answer": "Wir feiern am Freitag. Meine Mama und mein Papa kommen.",
            "parts": [
              {
                "label": {
                  "de": "das Fest",
                  "en": "the party"
                },
                "forms": [
                  "Wir feiern am Freitag.",
                  "Ich feiere am Freitag.",
                  "Am Freitag feiern wir.",
                  "Am Freitag feiere ich.",
                  "Am Freitag.",
                  "Mein Fest ist am Freitag.",
                  "Das Fest ist am Freitag.",
                  "Unser Fest ist am Freitag.",
                  "Meine Party ist am Freitag.",
                  "Die Party ist am Freitag."
                ]
              },
              {
                "label": {
                  "de": "die Gäste (mit mein/meine)",
                  "en": "the guests (with mein/meine)"
                },
                "forms": [
                  "Meine Mama und mein Papa kommen.",
                  "Meine Mama und mein Papa.",
                  "Meine Mama und mein Papa kommen zum Fest.",
                  "Meine Mama und mein Papa kommen auch.",
                  "Mein Papa und meine Mama kommen.",
                  "Mein Papa und meine Mama.",
                  "Mein Papa und meine Mama kommen zum Fest.",
                  "Mein Papa und meine Mama kommen auch.",
                  "Meine Mutter und mein Vater kommen.",
                  "Meine Mutter und mein Vater.",
                  "Meine Mutter und mein Vater kommen zum Fest.",
                  "Meine Mutter und mein Vater kommen auch.",
                  "Mein Vater und meine Mutter kommen.",
                  "Mein Vater und meine Mutter.",
                  "Mein Vater und meine Mutter kommen zum Fest.",
                  "Mein Vater und meine Mutter kommen auch.",
                  "Ja, meine Mama und mein Papa kommen.",
                  "Meine Mama kommt und mein Papa kommt.",
                  "Meine Eltern kommen.",
                  "Meine Eltern.",
                  "Meine Mama kommt. Mein Papa kommt.",
                  "Mein Papa kommt. Meine Mama kommt."
                ],
                "maxSentences": 2
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                1,
                3
              ]
            },
            "micOff": true,
            "order": "any"
          },
          {
            "canDo": 3,
            "type": "production",
            "promptDe": "Sagen Sie die Antwort. Lena geht nach Hause. Am Freitag kommt sie zum Fest. Sie: „…, Lena. …!“",
            "promptEn": "Your friend Lena is going home. You will see her again soon: on Friday she is coming to your party. Say goodbye in two short phrases: wish her well tell her that you will see her soon.",
            "answer": "Mach's gut. Bis bald.",
            "parts": [
              {
                "label": {
                  "de": "ein guter Wunsch",
                  "en": "a good wish"
                },
                "forms": [
                  "Mach's gut.",
                  "Mach es gut.",
                  "Schönen Tag noch.",
                  "Mach's gut und schönen Tag noch.",
                  "Mach's gut! Schönen Tag noch!"
                ],
                "maxSentences": 2
              },
              {
                "label": {
                  "de": "der Abschied (bis wann?)",
                  "en": "the goodbye (until when?)"
                },
                "forms": [
                  "Bis bald.",
                  "Bis Freitag.",
                  "Und bis bald."
                ]
              }
            ],
            "reteach": {
              "kind": "dialog",
              "indices": [
                9
              ]
            },
            "micOff": true,
            "order": "any",
            "allowModelContext": true,
            "context": [
              "Tschüss."
            ]
          }
        ]
      },
      guided: {
        read: {
          titleDe: 'Eine Nachricht von Mama und Papa',
          titleEn: 'A message from Mum and Dad',
          instructionDe: 'Lesen Sie die Nachricht von Anas Eltern. Tippen Sie auf ein Wort für seine Bedeutung.',
          instructionEn: 'Read the message from Ana\'s parents. Tap a word for its meaning.',
          text: 'Hallo Ana!\nDanke für die Karte. Wir kommen gern zum Fest.\nDas Datum ist gut: Am Freitag haben wir frei.\nMöchtest du viele Gäste einladen?\nDein Alter? Für uns bist du immer noch ein Kind!\nDein Zuhause in Bremen ist bestimmt schön.\nAm Samstag möchten wir dich einladen: Du bist unser Gast im Café.\nWir lieben dich. Dein Bruder und seine Frau grüßen dich.\nSchönen Tag noch und bis später am Telefon! Mama und Papa',
          questions: [
            {
              promptDe: 'Kommen Anas Eltern zum Fest? Wählen Sie die Antwort.',
              promptEn: 'Are Ana\'s parents coming to the party? Choose the answer.',
              options: ['No, they have to work on Friday.', 'They do not know yet; the date is bad.', 'Yes, they have Friday off and are glad to come.'],
              answer: 'Yes, they have Friday off and are glad to come.',
              explanationDe: 'In der Nachricht steht: Wir kommen gern zum Fest. Am Freitag haben wir frei.',
              explanationEn: 'The message says: we are glad to come to the party. We have Friday off.',
            },
            {
              promptDe: 'Was möchten Mama und Papa am Samstag machen? Wählen Sie die Antwort.',
              promptEn: 'What do Mum and Dad want to do on Saturday? Choose the answer.',
              options: ['Invite Ana to the café as their guest.', 'Buy a present for Ana\'s brother.', 'Celebrate again at Ana\'s home.'],
              answer: 'Invite Ana to the café as their guest.',
              explanationDe: 'In der Nachricht steht: Am Samstag möchten wir dich einladen. Du bist unser Gast im Café.',
              explanationEn: 'The message says: on Saturday we would like to invite you. You are our guest at the café.',
            },
          ],
        },
        chunks: [
          {
            from: 0,
            to: 2,
            meaning: {
              promptDe: 'Was sagt Ana über ihren Geburtstag? Wählen Sie die Bedeutung.',
              promptEn: 'What does Ana say about her birthday? Choose the meaning.',
              options: ['It is today, and the party is tonight.', 'It is in May, and the party is on Friday.', 'It was last week, and there was no party.'],
              answer: 'It is in May, and the party is on Friday.',
            },
            say: {
              line: 1,
            },
          },
          {
            from: 2,
            to: 4,
            meaning: {
              promptDe: 'Wer kommt zum Fest? Wählen Sie die Bedeutung.',
              promptEn: 'Who is coming to the party? Choose the meaning.',
              options: ['Only Ana\'s mum is coming.', 'Ana\'s parents cannot come.', 'Ana\'s mum and dad are coming.'],
              answer: 'Ana\'s mum and dad are coming.',
            },
            say: {
              line: 3,
            },
          },
          {
            from: 4,
            to: 6,
            meaning: {
              promptDe: 'Was sagt Ana über die Gäste? Wählen Sie die Bedeutung.',
              promptEn: 'What does Ana say about the guests? Choose the meaning.',
              options: ['Her colleague is invited too, and the guests bring cake.', 'Her brother is coming alone, and Ana buys the cake.', 'Her colleague cannot come, and nobody brings cake.'],
              answer: 'Her colleague is invited too, and the guests bring cake.',
            },
            say: {
              line: 5,
            },
          },
          {
            from: 6,
            to: 8,
            meaning: {
              promptDe: 'Was möchte Ana zum Geburtstag? Wählen Sie die Bedeutung.',
              promptEn: 'What would Ana like for her birthday? Choose the meaning.',
              options: ['Maybe a bag; Lena is buying the present.', 'Maybe a book; her brother is buying the present.', 'Nothing at all; she does not want a present.'],
              answer: 'Maybe a book; her brother is buying the present.',
            },
            say: {
              line: 7,
            },
          },
          {
            from: 8,
            to: 10,
            meaning: {
              promptDe: 'Was sagt Ana zum Abschied? Wählen Sie die Bedeutung.',
              promptEn: 'What does Ana say as they part? Choose the meaning.',
              options: ['Good night, Lena. See you tomorrow!', 'Thank you, Lena. See you on Friday!', 'Take care, Lena. See you soon!'],
              answer: 'Take care, Lena. See you soon!',
            },
            say: {
              line: 9,
            },
          },
        ],
      },
      nextHook: {
        de: 'In A1.2 geht es weiter: Ana sucht das Rathaus. Findet sie den Weg?',
        en: 'The story continues in A1.2: Ana is looking for the town hall. Will she find the way?',
      },
      title: 'Feste feiern',
      situation: 'Feste und Vergangenes (Chunks) und Wiederholung',
      handlungsfeld: 'Freizeit und soziale Kontakte: einladen und feiern',
      canDo: [
        'Ich kann jemanden zu einem Fest einladen.',
        'Ich kann sagen, in welchem Monat ich Geburtstag habe.',
        // ROUND 17 (RULE 12 split): the family belongs to Lektion 3; this Lektion rehearses the
        // Fest and the Gäste.
        'Ich kann über mein Fest und meine Gäste sprechen.',
        // ROUND 17 (RULE 12 split): `verabschieden` names the act and appears nowhere; the two
        // chunks the Lektion actually says goodbye with do.
        'Ich kann mich mit „Mach’s gut“ und „Bis bald“ verabschieden und gute Wünsche aussprechen.',
      ],
      examTeile: ['Lesen Teil 3', 'Sprechen Teil 3', 'Schreiben Teil 2'],
      grammarSlugs: ['possessive-articles', 'verb-sein', 'verb-haben'],
      primarySlug: 'possessive-articles',
      minutes: 15,
      wortfeld: [
        { de: 'der Geburtstag', word: 'Geburtstag', article: 'der', plural: 'Geburtstage', en: 'birthday', wordId: 'c34d4cef-643f-42e3-9d9a-8c3bfcc45f36' },
        { de: 'das Datum', exampleDe: 'Das Datum: 5. Mai.', word: 'Datum', article: 'das', plural: 'Daten', en: 'date', field: true, wordId: '3efd1d54-db2c-4bf9-beb9-eb4d8a6decd1' },
        { de: 'das Alter', exampleDe: 'Mein Alter: 25.', word: 'Alter', article: 'das', plural: '—', en: 'age', field: true, wordId: '6276c62c-9009-4716-880a-410bdb5c9102' },
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
        { de: 'die Karte', exampleDe: 'Die Karte ist für Ana.', word: 'Karte', article: 'die', plural: 'Karten', en: 'card', wordId: '824eaef7-c358-42e7-b369-1d4ed5697e31' },
        { de: 'schön', word: 'schön', article: null, plural: null, en: 'beautiful, nice', wordId: '312cc6ce-56a2-4d77-b23c-509dbabfcf02' },
        // bestimmt moved here from L7, where it appeared in no line; line 8 of this dialogue uses it.
        { de: 'bestimmt', word: 'bestimmt', article: null, plural: null, en: 'definitely, surely', wordId: 'b57550d1-a0f3-43a2-a257-2c4f3fa972d7' },
        { de: 'das Zuhause', exampleDe: 'Mein Zuhause ist in Bremen.', word: 'Zuhause', article: 'das', plural: '—', en: 'home', wordId: 'b09adebf-9767-4079-b1ee-b639aec4a733' },
        { de: 'lieben', exampleDe: 'Ich liebe meine Familie.', word: 'lieben', article: null, plural: null, en: 'to love', wordId: 'efd42d40-ceaa-4105-92cb-7b0896a39892' },
        { de: 'grüßen', exampleDe: 'Ich grüße Sie. Schönen Tag noch!', word: 'grüßen', article: null, plural: null, en: 'to greet', wordId: '2b0cba13-bfdd-4f08-82d7-f9b2ea8b6488' },
        { de: 'Bis bald', word: 'Bis bald', article: null, plural: null, en: 'See you soon', wordId: '3c54e79d-d20b-40c5-bdc4-9929ba9521c6' },
        { de: 'Bis später', exampleDe: 'Bis später, Lena!', word: 'Bis später', article: null, plural: null, en: 'See you later', wordId: 'ce5e11f5-b263-4d6f-b381-a190493db09a' },
        { de: 'Schönen Tag noch', exampleDe: 'Auf Wiedersehen! Schönen Tag noch!', word: 'Schönen Tag noch', article: null, plural: null, en: 'Have a nice day', wordId: 'efd72cd3-8751-42d1-abc4-be324bbbebd3' },
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
          // `der Gast` is the noun of the third Leitpunkt of this Lektion's graded task („Was die
          // Gäste mitbringen sollen“) and stood on no input surface (round 18, DaF review #17,
          // Minor 15 / RULE 23b, hard 0). The line now says the thing the task asks about — the
          // guests bring something — with the L11 Satzklammer the learner has met. Index 5 is in
          // neither window ([1,3] dictation, [0,9] read-aloud).
          { speaker: 'Ana', de: 'Ja. Ich lade auch meine Kollegin ein. Die Gäste bringen Kuchen mit.', en: 'Yes. I am inviting my colleague too. The guests are bringing cake.' },
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
        formExamples: ['Das ist sein Geschenk. Das ist ihr Buch.', 'Ist das Ihr Büro, Frau Kaya?', 'Unser Fest ist am Freitag. Wann ist euer Fest?', 'Unsere Gäste kommen. Kommen eure Gäste auch?'],
        title: 'mein, dein, sein, ihr – Possessivartikel',
        bodyDe: 'Der Possessivartikel zeigt, wem etwas gehört: **mein** Geschenk, **dein** Bruder, **sein** Handy (er), **ihr** Buch (sie: eine Frau oder mehrere), **Ihr** Büro (Sie, immer groß!). Vor femininen Nomen und im Plural kommt **-e** dazu: **meine** Mama. Für Gruppen: **unser** Fest (wir), **euer** Fest (ihr) — vor die-Wörtern **unsere**, **eure**.',
        bodyEn: 'A possessive article says who something belongs to: **mein** Geschenk (my present), **dein** Bruder (your brother, informal), **sein** Handy (his phone), **ihr** Buch (her book, or their book), **Ihr** Büro (your office, polite – always with a capital I). Before a feminine noun and in the plural, add **-e**: **meine** Mama. For groups: **unser** Fest (our party, wir), **euer** Fest (your party, several people, ihr) – and before die-words **unsere**, **eure**.',
        examples: ['Ana, wann ist dein Geburtstag?', 'Und dein Bruder? Kommt seine Frau auch?'],
        ruleSlug: 'possessive-articles',
      },
      phonetik: { focus: 'Der Diphthong ei in mein und dein', focusEn: 'The diphthong ei in mein and dein', items: ['MEIN', 'DEIN', 'ZWEI'] },
      hoeren: { kind: 'dictation', lines: [1, 3] },
      sprechen: {
        // Line 9, not 5: „Ja! Mach's gut, Lena. Bis bald!“ is the ONLY place in the Lektion where
        // the closing wish is said, and can-do 4 („mich verabschieden und gute Wünsche
        // aussprechen“) was rehearsed nowhere — the learner read line 9 once, silently, and never
        // produced it (DaF review #7, MAJOR 4). readAloud is the surface `score-readaloud` grades,
        // so putting the farewell on it is what makes the last can-do of the course an exercise.
        readAloud: [0, 9],
        open: {
          // Teil 1 is „sich vorstellen“ over Stichwortkarten; formulating an invitation is Teil 3.
          teil: 'Sprechen Teil 3',
          promptDe: 'Laden Sie eine Kollegin zu Ihrem Fest ein und reagieren Sie auf die Antwort.',
          promptEn: 'Invite a colleague to your party and react to her answer.',
          hintWords: ['einladen', 'der Geburtstag', 'feiern'],
          // Sie — Teil 3: die Einladung geht an eine Kollegin, und die Lektion prüft genau diese Form (extra-a11-l12-08/09/16, „Ihr Fest, Frau Kaya“).
          anrede: 'Sie',
          missionOrder: null,
        },
      },
      schreiben: {
        kind: 'mitteilung',
        taskKey: 'a11-l12',
        taskDe: 'Schreiben Sie eine Einladung zu Ihrem Geburtstag. Sie feiern im Café. Beginnen Sie mit einer Anrede und schließen Sie mit einem Gruß.',
        taskEn: 'Write an invitation to your birthday party. You are celebrating at the café — say where. Open with a greeting and close with a sign-off. Cover three points: why you are celebrating; the day and the time; what the guests should bring.',
        leitpunkte: ['Warum Sie feiern', 'Tag und Uhrzeit', 'Was die Gäste mitbringen sollen'],
        minWords: 25,
        maxWords: 45,
        // 30 Wörter. Der Possessivartikel ist hier erlaubt: Lektion 12 ist die Lektion, die ihn lehrt.
        // ROUND 16 (DaF review #15, MAJOR 1, RULE 22): „Der Tag ist der 15. Mai“ war der fünfte
        // Formularsatz des Kurses. Der Grund der Einladung steht jetzt als Grund da („Ich habe im
        // Mai Geburtstag.“, wie im Dialog) und Tag und Uhrzeit als Zeitangaben eines Satzes.
        sample: 'Hallo Lena! Ich habe im Mai Geburtstag. Wir feiern am Freitag um acht Uhr im Café. Die Gäste bringen Kuchen und Musik mit. Bringst du bitte den Salat mit? Bis bald, Ana',
      },
      links: { listeningExercise: null, readingOrder: 10 },
      // „Wiederholung“ has to be visible in the practice: the last Lektion before checkpoint 4 mixes
      // all three of its slugs. time-and-dates would belong here too, but grammarSlugs is capped at 3.
      // mustCover: the answer key every draw of this Lektion has to contain at least once
      // (DaF review #6). The polite `Ihr` is graded in Schreiben Teil 2 and Sprechen Teil 3,
      // L12 is the last place it is taught, and without this the seeded draw missed it in a
      // whole attempt — `MAX_SAME_ANSWER_KEY` caps repetition but cannot reserve a seat.
      practiceRule: { topics: ['possessive-articles', 'verb-sein', 'verb-haben'], typedMin: 4, mustCover: ['Ihr'] },
    },
  ],
  checkpoints: [
    { nr: 1, id: 'a1.1-cp1', afterLektion: 3, writingTaskKey: 'a11-cp1', title: 'Checkpoint 1: Lektion 1–3' },
    { nr: 2, id: 'a1.1-cp2', afterLektion: 6, writingTaskKey: 'a11-cp2', title: 'Checkpoint 2: Lektion 4–6' },
    { nr: 3, id: 'a1.1-cp3', afterLektion: 9, writingTaskKey: 'a11-cp3', title: 'Checkpoint 3: Lektion 7–9' },
    { nr: 4, id: 'a1.1-cp4', afterLektion: 12, writingTaskKey: 'a11-cp4', title: 'Checkpoint 4: Lektion 10–12' },
  ],
};
