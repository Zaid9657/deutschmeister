// Abschlusstest A2.1 — the end-of-course test of the A2.1 course.
//
// HONESTY CONTRACT (same as every module under src/data/mockExams/ and the
// two sibling course tests): this is our OWN course-completion test, written
// in the STYLE of Goethe-Zertifikat A2 (Erwachsene) — never official exam
// material, never affiliated with the Goethe-Institut. Whatever surface
// renders this module must also render MOCK_DISCLAIMER_DE (see
// src/data/examTracks.js) and label every score a Richtwert, not an official
// result. "Kurzversion" stays in the title because this is a half-length
// pass at the A2 format: 55 minutes and 10 objective Lesen items + 10 Hören
// items, against the real exam's ~90 written minutes and 30 items.
//
// Every German string quoted in this header is verbatim — either a line of
// S/wave4/source/listening-a2.1.json or a string of this module itself.
// validate-a21.test.mjs extracts EVERY double-quoted run in this comment
// block and fails if it is neither. That check exists because round 1
// shipped a header quote that did not appear in the source at all (a #6
// transcript line stitched together from two different announcements); the
// old harness only spot-checked four quotes, so it passed.
//
// Lesen item format — coordinator ruling, 2026-09-06: BOTH Lesen parts are
// three-option multiple choice (a/b/c). Richtig/Falsch is the A1 /
// Start-Deutsch-1 shape that abschlusstestA11/A12 use; the real Goethe A2
// Lesen Teil 1 asks a question with three answers. `lesen-1` was authored as
// 5 Richtig/Falsch items in round 1 and converted — same text, same five
// facts, same five item ids, now a/b/c. There is no Richtig/Falsch item
// anywhere in this module. The two answer keys are spread across all three
// letters and share no adjacent letter: lesen-1 = b c b a c, lesen-3 = a b c
// a b.
// Distractor policy differs by Teil, on purpose. In `lesen-1` every
// distractor is a detail the text itself names but which does not answer
// that question (Mittwoch/Freitag, 15 and 16 Uhr, Abendessen/Computerkurs,
// Gartenstraße/Erdgeschoss, Sprachcafé/Abendessen), so elimination needs the
// text rather than plausibility, and validate-a21.test.mjs pins each anchor.
// In `lesen-3` the distractors are deliberately NOT in the text (zu teuer,
// zu laut, Fünf Euro, eine neue Adresse) — the Goethe A2 Teil-3 norm, where
// the reader checks a claim against an e-mail that simply never makes it;
// the harness asserts their ABSENCE instead.
//
// Shape: identical to src/data/courseTests/abschlusstestA12.js, which is in
// turn identical to src/data/mockExams/goetheA1.js — examKey, courseLevel,
// formatOf, title, intro, passPercent, sections[{key,title,minutes,
// instructions,parts[]}] with part types listening / mc-group / writing.
// src/services/examScoring.js scores the mc-group parts; listening items are
// counted at runtime from the DB; writing is never auto-scored.
// tests/exams.test.mjs (~226-330) holds every guard a course test must pass.
//
// Field-name note: the brief for this file names the identity fields
// "examKey / formatOf / level / title". `courseLevel` is what the shipped
// template calls that field on the MODULE, and `level` is the field name on
// the COURSE_TESTS registry ROW (src/data/courseTests/index.js) — the two
// are the same value read from two places. Nothing in the repo reads either
// field off the module; the resolver and the guard read `level` off the
// registry row. This file follows the template rather than inventing a
// second level field.
//
// Registry note: this module lives OUTSIDE src/data/mockExams/index.js's
// MOCK_EXAMS map, like both siblings. It is registered in
// src/data/courseTests/index.js's COURSE_TESTS array as:
//   { key: 'a2_1_abschluss', slug: 'abschlusstest-a2-1',
//     nameDe: 'Abschlusstest A2.1', level: 'a2.1', formatOf: 'goethe_a2',
//     mock: abschlusstestA21 }
// Gate: resolveModelltest() (src/data/modelltest.js) returns gateLevel =
// the course test's own level, so ExamSubscriptionGuard gates this on
// 'a2.1'. a2.1 is NOT in FREE_LEVELS (src/config/freeTier.js, which lists
// only 'a1.1'), and LEVEL_COURSES.course_a2 (src/data/pricing.js) is the
// band course whose levels are ['a2.1','a2.2'] — so access needs Pro/trial
// OR the A2 course purchase, exactly like the A2.1 level pages themselves.
//
// THREE INTEGRATION DEPENDENCIES, none of them satisfiable from this file:
//   1. formatOf 'goethe_a2' must exist as an EXAM_TRACKS key — it lands in
//      Wave 4 PR D1. Until then tests/exams.test.mjs's "formatOf resolves to
//      a real EXAM_TRACKS key" assertion would FAIL for this course test, so
//      this module must be registered only after D1 is merged.
//   2. exam_attempts_exam_key_check must admit 'a2_1_abschluss'; the newest
//      migrations/*abschlusstest*.sql file has to re-create the CHECK with
//      the FULL key list (a1_1_abschluss, a1_2_abschluss, a2_1_abschluss +
//      every EXAM_TRACKS key incl. the new goethe_a2), or the guard suite's
//      newest-migration scan fails and attempts cannot insert.
//   3. playsAllowed — one runner line, landed in the same PR (D2). The
//      listening part carries `playsAllowed: 1`; MockListeningPart in
//      src/pages/Modelltest/ModelltestRun.jsx resolves
//        const playsAllowed = part.playsAllowed ?? PLAYS_ALLOWED;
//      and both the `canPlay` guard and the "Noch ...x abspielbar" label
//      read it, so every other mock keeps its default of two plays. Without
//      that line the field would be a silent no-op — the runner would offer
//      two plays the 15-minute section timer cannot honour (timing note
//      below) — which is why tests/a2-1-abschlusstest.test.mjs and
//      tests/exams.test.mjs both pin the runner line next to the
//      selectListeningQuestions pin: a field the runner ignores is exactly
//      how the 23-vs-8 question defect happened.
//
// Content scope: A2.1 only, per S/wave4/level-a2.1.md. All A1 grammar plus
// A2.1 topics 1-12 are in play; this wave's four NEW topics are used on
// purpose in the Lesen texts and are listed by example in the grammar
// paragraph at the end of this header. Nothing on that file's banned list
// appears in any string of this module — including the intro and the section
// instructions, which round 1 treated as exempt administrative copy. That
// carve-out is withdrawn (coordinator ruling, 2026-09-06): the level file
// grants no exemption, so the intro was rewritten Genitiv-free
// ("von deinem A2.1-Kurs", "Er trainiert drei Teile vom Goethe-Zertifikat A2:
// Hören, Lesen und Schreiben.", "ab 60 von 100 Punkten") and the harness now
// bans Genitiv determiners and the partitive `Prozent der` across every
// string, not just `des`/`eines` before a capital.
// The round-3 replacement for the first of those — the withdrawn phrase
// `die gleichen Prüfungsteile wie das Goethe-Zertifikat A2`, backticked
// here because it is no longer a string of this module and the header's
// quote check only admits strings that are — was Genitiv-free but FALSE:
// the real exam has four Prüfungsteile and this test trains three — so it was
// replaced again in round 4 with a sentence that counts what it actually
// covers and leaves Sprechen to the next sentence but one. The pass line
// takes the repo's own house phrasing from src/data/writingTasks.js
// ("60 von 100 Punkten"); PR D1's verified fact table stays the source of
// truth for the real exam's rule, and the harness asserts the intro names
// exactly the three sections this module ships.
//
// ── Hören: which exercise, and why ────────────────────────────────────────
// A2.1 listening exercise #4 "Termine und Verabredungen"
// (live id fbd6e61e-b9a8-4a6d-bdff-ad3366b95a50, 10 dialogues, 10 questions,
// 518 s audio, plays_allowed 2 in the DB). No mock or course test uses ANY
// A2.1 listening exercise today — the only A2 listening part in the repo is
// src/data/mockExams/dtz.js's hoeren-1, which takes A2.2 #1 — so nothing is
// pre-answered by reusing this one.
//
// Why #4 and not the other five (judged from the exercise dump in
// S/wave4/source/listening-a2.1.json):
//   * #4 is the only one whose TOPIC is this wave's own new grammar. Its
//     dialogues are built out of temporal prepositions and clock time:
//     "Samstag um zehn Uhr hätten wir noch einen Termin frei.",
//     "Dann könnte unser Techniker morgen zwischen zehn und zwölf Uhr
//     kommen.", "Nach der Arbeit. Um achtzehn Uhr?" — um/am/zwischen/nach
//     + Dativ is topic 12 (temporal-prepositions), rehearsed in listening
//     and then produced in this file's own Lesen texts and Schreiben tasks.
//   * Its ten items stay inside the level. They are wann-/wo-/warum-/wie
//     lange-questions plus one Richtig/Falsch — no Genitiv, no Präteritum of
//     a full verb, no Passiv: "Wann ist der Friseurtermin?", "Wann kommt der
//     Techniker?", "Die Frau ist schon Patientin in der Praxis."
//   * Register fits the level file exactly: adults, everyday German, formal
//     Sie with the Praxis/Werkstatt/Firma ("Praxis Dr. Weiß, guten Tag.",
//     "Um welches Fahrzeug handelt es sich?") and du with friends and
//     family ("Hast du am Wochenende Zeit? Wir könnten uns treffen.").
//   * The four rejected alternatives, each on a checkable defect in the
//     ITEMS a learner is scored on, not on taste:
//       #1 Beim Arzt — three of its ten items are Genitiv, which A2.1 bans
//          outright: "Wie hoch war das Fieber des Patienten?", "Wann bekommt
//          der Patient das Ergebnis des Allergietests?", "Wie hoch ist der
//          Blutdruck des Patienten?".
//       #2 Im Restaurant — item 10 "Der Gast fand die Bedienung langsam."
//          is Präteritum of a full verb (banned), item 2 "Wie ist der Lachs
//          zubereitet?" is Passiv, item 4 "Wogegen ist die Kundin
//          allergisch?" is a wo(r)+Präposition compound (B1).
//       #3 Reisen und Verkehrsmittel and #5 Einkaufen im Alltag — both are
//          number-catching drills. In #5, five of the ten items ask for a
//          price ("Was kostet das Taschenbuch?", "Was kosten die
//          Laufschuhe?") and two more for a bare number ("Welchen
//          Lichtschutzfaktor empfiehlt die Verkäuferin?", "Wie viele Rosen
//          bekommt der Kunde für 30 Euro?") — seven of ten measuring digit
//          recognition rather than A2.1 grammar.
//       #6 Nachrichten und Durchsagen — the shortest audio, but its
//          transcripts are B1+: "Taschen und Rucksäcke müssen an der
//          Garderobe abgegeben werden." (Passiv), "Die Tore für Bayern
//          schossen Müller und Sané." (Präteritum), "Wir weisen darauf hin,
//          dass während des Films Handys ausgeschaltet sein müssen."
//          (dass-Satz + Genitiv).
// Two blemishes in #4 that this file does NOT hide: item 4 "Wo treffen sich
// die Freunde?" is the reciprocal sich-treffen and item 10 "Worum geht es
// beim Elternabend?" is a pronominal adverb — both recognition-only, both in
// DB content this file reuses rather than authors, and neither is exercised
// anywhere in the strings below. As with abschlusstestA12.js, the grammar
// claim in this header covers the AUTHORED strings and says nothing about
// the reused audio, which is A2.1 course content produced elsewhere.
//
// Timing, measured not assumed: the audio is 518 s = 8 min 38 s, and
// ModelltestRun.jsx's section timer is a hard cutoff (remaining === 0 calls
// nextSection()). One play plus answering ten items fits the 15 minutes;
// two full plays (17 min 16 s) do not. That is why this part carries
// playsAllowed: 1 and why the Hören instructions say the learner hears the
// recording once: we play it once to keep the section inside 15 minutes.
// That argument rests on the 8:38-vs-15:00 arithmetic alone. Whether the
// real Goethe A2 Hören also plays its long parts once is NOT asserted here —
// goethe.de is unreachable from this sandbox, the fact is not on
// S/wave4/exam-brief.md's list for PR D1 either, and an unsourced claim
// about someone else's exam is exactly what this repo's fact discipline
// forbids. Exercise #4 and
// minutes: 15 are unchanged (coordinator ruling, 2026-09-06); the whole
// conflict is settled by the runner's per-part cap (dependency 3 above).
//
// questionMax: 10. useExerciseDetails() (src/hooks/useListening.js) loads
// ALL listening_questions rows for an exercise, ordered by question_number,
// with no .range()/.limit(); MockListeningPart passes them through
// selectListeningQuestions() (src/data/courseTests/listeningQuestions.js)
// for BOTH rendering and score registration. This exercise carried exactly
// 10 questions when this module was written; PR C (#85) then grew every
// A2.1 exercise to 23 (13 new items incl. dictation), so the cap BITES: it
// is what keeps this test at its designed 10 Hören : 10 Lesen weighting
// instead of silently becoming 23 : 10 — the same 23-Hören-vs-8-Lesen defect
// Wave 2/3's A1 expansion produced before questionMax existed. tests/exams.test.mjs pins that every course-test listening part
// carries a numeric questionMax and that the runner goes through the helper.
// exerciseId below is provenance only: the runner resolves the audio and the
// questions by level + exerciseNumber (getAudioUrl(level, exerciseNumber) →
// audio/listening/A2.1/exercise4.mp3), never by id — the id is recorded so a
// reviewer can check the pick against the live row without guessing.
//
// Runtime and weighting: 15 (Hören) + 20 (Lesen) + 20 (Schreiben) = 55 min,
// about half the real Goethe A2 written exam. Score weighting is 10 Hören :
// 10 Lesen — the two objective sections weigh the same, a deliberate change
// from the A1 siblings' 10 : 8, because A2.1's step up is a reading step
// (two continuous texts of 100-130 words instead of A1.2's notice-length
// snippets). Schreiben is not auto-scored in either.
//
// Schreiben scenarios: exactly ONE cancellation in the whole test.
// `schreiben-1` is the SMS that cancels (Geburtstagsparty, informell);
// `schreiben-2` is a Paket message to a neighbour — not a cancellation,
// because a Termin-absagen e-mail would have been the THIRD copy of one
// scenario in this repo (src/data/writingTasks.js ships
// mitteilung-termin-absagen, and abschlusstestA12.js's only writing task is
// an Arzttermin cancellation), and PR D1's own bank takes "Termin beim Amt"
// per S/wave4/exam-brief.md §4. Two earlier candidates were dropped for the
// same reason once they were actually checked against the live bank: a
// Sportverein course enquiry (round 3) reproduces
// mitteilung-info-sprachkurs's Leitpunkte almost point for point — which
// course, when, what does it cost — with only the institution and the
// person-form changed, and a Heizung or Blumen message would land on
// mitteilung-vermieter-heizung-kaputt or
// mitteilung-nachbarn-um-hilfe-bitten. The harness therefore no longer
// compares task text verbatim: it stems both sides and compares Leitpunkt
// keyword SETS against every live task, and it re-runs the round-3
// Sportverein wording through the same check to prove the check fires on it.
// Register: Sie to a neighbour is the everyday German halbformell case.
//
// Grammar actually used in THIS file's German strings — intro and section
// instructions INCLUDED, the round-1 carve-out having been withdrawn — with
// this wave's four new topics used on purpose at least once each:
//   * adjective-endings-intro (topic 9): after der/die/das — "Der neue
//     Nachbarschaftstreff", "Der große Raum", "Der alte Raum", "die halbe
//     Länge", "die richtige Antwort", "im ersten Stock", "Im letzten Jahr";
//     after ein/kein/mein — "ein kleines
//     Abendessen", "eine kurze Antwort", "eine neue Adresse", "einen neuen
//     Raum", "kein offizielles Prüfungsmaterial", "keine offizielle
//     Bewertung". Predicative stays endingless ("ist zu klein", "Der Kaffee
//     ist kostenlos").
//   * pronouns-accusative-dative (topic 10): "Frau Kern hilft Ihnen gern.",
//     "Rufen Sie sie bitte gegen 16 Uhr an.", "Bitte geben Sie mir das
//     Geld bis Freitag.", "Schreiben Sie mir bitte bis Freitag eine kurze
//     Antwort.", "Was wünschst du Lena?", "Wo soll die Nachbarin es lassen?".
//   * modal-verbs-past (topic 11): "Vor einem Jahr konnte der Verein nur
//     einen Raum in der Schule nutzen.", "Die Gruppen mussten dort oft
//     warten.", "Die Nachbarn wollten schon lange einen Treffpunkt haben.",
//     "Im letzten Jahr wollten viele Teilnehmer mitkommen." — each with the
//     Satzklammer the topic teaches, plus war/hatte ("Der Bus war damals
//     sehr schnell voll.").
//   * temporal-prepositions (topic 12): "Seit dem 1. September", "von Montag
//     bis Freitag", "von 15 bis 20 Uhr", "Am Mittwoch", "um 18 Uhr", "Vor
//     einem Jahr", "Ab Oktober", "gegen 16 Uhr", "Ab dem 5. Oktober",
//     "bis Freitag", "Am Samstag, dem 18. Oktober".
// Already-live A2.1 topics in the same strings: Dativ as indirect object
// (mir/Ihnen/Lena), the dative verb gehören ("Der Treff gehört einem
// Verein."), dative prepositions (seit/von/bis/nach/mit/bei/zu), two-way
// prepositions with Dativ ("in der Gartenstraße", "im Erdgeschoss", "neben
// dem Büro"), separable verbs, Imperativ in all three forms, modal verbs
// present, Akkusativ, kein/nicht.
// NONE of the following appear in ANY string of this module: a Nebensatz of
// any kind (weil/dass/wenn/ob/als/obwohl or an embedded question),
// Präteritum of a full verb, Futur, Passiv, Genitiv, a relative clause, an
// infinitive clause with zu or um ... zu, a reflexive verb, Komparativ or
// Superlativ (incl. "am besten" — deliberately avoided), an adjective
// ending after a null article outside the frozen chunks ("Guten Tag",
// "Viele Grüße"), or a sentence over 14 words. The claim covers the reused
// Hören audio no more than the sibling's did.

export const abschlusstestA21 = {
  examKey: 'a2_1_abschluss',
  courseLevel: 'a2.1',
  formatOf: 'goethe_a2',
  title: 'Abschlusstest A2.1 (Kurzversion)',
  intro:
    'Das ist der Abschlusstest von deinem A2.1-Kurs. Er trainiert drei Teile vom Goethe-Zertifikat A2: ' +
    'Hören, Lesen und Schreiben. Aber er hat nur die halbe Länge. Der Test kommt von DeutschMeister ' +
    'und ist kein offizielles Prüfungsmaterial. Dein Ergebnis ist ein Richtwert und keine offizielle ' +
    'Bewertung. ' +
    'Wie in der Prüfung bestehst du ab 60 von 100 Punkten. Sprechen trainierst du im ' +
    'Speaking-Missions-Trainer, nicht hier. Danach geht es weiter mit deinem Kurs A2.2.',
  passPercent: 60,

  sections: [
    {
      key: 'hoeren',
      title: 'Hören',
      minutes: 15,
      instructions:
        'Du hörst zehn Gespräche über Termine und Verabredungen. Die Aufnahme dauert etwa neun Minuten. ' +
        'Du hörst sie einmal. Beantworte die Fragen schon beim Hören. Für diesen Teil hast du 15 Minuten Zeit.',
      parts: [
        {
          key: 'hoeren-1',
          type: 'listening',
          label: 'Hörtext · Termine und Verabredungen',
          level: 'A2.1',
          exerciseNumber: 4,
          // Provenance only — the runner resolves by level + exerciseNumber.
          exerciseId: 'fbd6e61e-b9a8-4a6d-bdff-ad3366b95a50',
          questionMax: 10,
          // 8:38 of audio against a hard 15-minute section timer: one play
          // fits, two do not. MockListeningPart resolves
          // `part.playsAllowed ?? PLAYS_ALLOWED` (dependency 3 in the header).
          playsAllowed: 1,
        },
      ],
    },
    {
      key: 'lesen',
      title: 'Lesen',
      minutes: 20,
      instructions:
        'Teil 1 und Teil 3: Lies den Text und die E-Mail. Wähle bei jeder Frage die richtige Antwort: ' +
        'a, b oder c.',
      parts: [
        {
          key: 'lesen-1',
          type: 'mc-group',
          label: 'Teil 1 · Nachbarschaftstreff',
          text:
            'Der neue Nachbarschaftstreff in der Gartenstraße\n' +
            'Seit dem 1. September gibt es den Nachbarschaftstreff in der Gartenstraße. ' +
            'Der große Raum im Erdgeschoss ist für alle da. ' +
            'Der Treff gehört einem Verein. ' +
            'Die Nachbarn wollten schon lange einen Treffpunkt haben. ' +
            'Der Treff ist von Montag bis Freitag von 15 bis 20 Uhr geöffnet. ' +
            'Am Mittwoch beginnt um 18 Uhr das Sprachcafé. ' +
            'Dort sprechen die Gäste Deutsch und trinken Kaffee. ' +
            'Der Kaffee ist kostenlos. ' +
            'Am Freitag gibt es ein kleines Abendessen für Familien. ' +
            'Kinder zahlen nur einen Euro. ' +
            'Vor einem Jahr konnte der Verein nur einen Raum in der Schule nutzen. ' +
            'Die Gruppen mussten dort oft warten. ' +
            'Ab Oktober gibt es auch einen Computerkurs. ' +
            'Haben Sie Fragen? Frau Kern hilft Ihnen gern. ' +
            'Rufen Sie sie bitte gegen 16 Uhr an.',
          items: [
            {
              id: 'l1-1',
              prompt: 'Wann ist der Treff geöffnet?',
              options: [
                { key: 'a', label: 'Nur am Mittwoch.' },
                { key: 'b', label: 'Von Montag bis Freitag.' },
                { key: 'c', label: 'Nur am Freitag.' },
              ],
              answer: 'b',
            },
            {
              id: 'l1-2',
              prompt: 'Wann beginnt das Sprachcafé?',
              options: [
                { key: 'a', label: 'Um 15 Uhr.' },
                { key: 'b', label: 'Um 16 Uhr.' },
                { key: 'c', label: 'Um 18 Uhr.' },
              ],
              answer: 'c',
            },
            {
              id: 'l1-3',
              prompt: 'Was ist im Treff kostenlos?',
              options: [
                { key: 'a', label: 'Das Abendessen.' },
                { key: 'b', label: 'Der Kaffee.' },
                { key: 'c', label: 'Der Computerkurs.' },
              ],
              answer: 'b',
            },
            {
              id: 'l1-4',
              prompt: 'Wo war der Verein vor einem Jahr?',
              options: [
                { key: 'a', label: 'In der Schule.' },
                { key: 'b', label: 'In der Gartenstraße.' },
                { key: 'c', label: 'Im Erdgeschoss.' },
              ],
              answer: 'a',
            },
            {
              id: 'l1-5',
              prompt: 'Was gibt es ab Oktober?',
              options: [
                { key: 'a', label: 'Ein Sprachcafé.' },
                { key: 'b', label: 'Ein Abendessen.' },
                { key: 'c', label: 'Einen Computerkurs.' },
              ],
              answer: 'c',
            },
          ],
        },
        {
          key: 'lesen-3',
          type: 'mc-group',
          label: 'Teil 3 · E-Mail von der Sprachschule',
          text:
            'Von: Sabine Rot, Sprachschule Köln\n' +
            'An: Frau Peters\n' +
            'Betreff: Ihr Deutschkurs im Oktober\n' +
            'Guten Tag, Frau Peters,\n' +
            'ich habe zwei Informationen für Sie. ' +
            'Ab dem 5. Oktober ist unser Kurs in Raum 12. ' +
            'Der alte Raum im ersten Stock ist zu klein. ' +
            'Der neue Raum liegt im Erdgeschoss neben dem Büro. ' +
            'Die Zeit bleibt gleich: montags von 18 bis 20 Uhr. ' +
            'Am Samstag, dem 18. Oktober, machen wir einen Ausflug. ' +
            'Wir fahren mit dem Bus nach Bonn. ' +
            'Die Fahrt kostet acht Euro pro Person. ' +
            'Bitte geben Sie mir das Geld bis Freitag. ' +
            'Im letzten Jahr wollten viele Teilnehmer mitkommen. ' +
            'Der Bus war damals sehr schnell voll. ' +
            'Schreiben Sie mir bitte bis Freitag eine kurze Antwort.\n' +
            'Viele Grüße\n' +
            'Sabine Rot',
          items: [
            {
              id: 'l3-1',
              prompt: 'Warum gibt es einen neuen Raum?',
              options: [
                { key: 'a', label: 'Der alte Raum ist zu klein.' },
                { key: 'b', label: 'Der alte Raum ist zu teuer.' },
                { key: 'c', label: 'Der alte Raum ist zu laut.' },
              ],
              answer: 'a',
            },
            {
              id: 'l3-2',
              prompt: 'Wo ist der neue Raum?',
              options: [
                { key: 'a', label: 'Im ersten Stock.' },
                { key: 'b', label: 'Im Erdgeschoss.' },
                { key: 'c', label: 'Im Büro.' },
              ],
              answer: 'b',
            },
            {
              id: 'l3-3',
              prompt: 'Wann beginnt der Kurs am Montag?',
              options: [
                { key: 'a', label: 'Um 19 Uhr.' },
                { key: 'b', label: 'Um 20 Uhr.' },
                { key: 'c', label: 'Um 18 Uhr.' },
              ],
              answer: 'c',
            },
            {
              id: 'l3-4',
              prompt: 'Was kostet der Ausflug pro Person?',
              options: [
                { key: 'a', label: 'Acht Euro.' },
                { key: 'b', label: 'Achtzehn Euro.' },
                { key: 'c', label: 'Fünf Euro.' },
              ],
              answer: 'a',
            },
            {
              id: 'l3-5',
              prompt: 'Was möchte Frau Rot bis Freitag von Frau Peters?',
              options: [
                { key: 'a', label: 'Nur das Geld.' },
                { key: 'b', label: 'Das Geld und eine Antwort.' },
                { key: 'c', label: 'Nur eine neue Adresse.' },
              ],
              answer: 'b',
            },
          ],
        },
      ],
    },
    {
      key: 'schreiben',
      title: 'Schreiben',
      minutes: 20,
      instructions:
        'Du schreibst zwei Texte. Teil 1 ist eine SMS, Teil 2 eine E-Mail. Der Computer bewertet diese ' +
        'Aufgaben nicht. Nutze den Selbstcheck.',
      parts: [
        {
          key: 'schreiben-1',
          type: 'writing',
          label: 'Teil 1 · SMS an eine Freundin',
          task:
            'Deine Freundin Lena hat morgen Geburtstag. Du kannst nicht zur Party kommen. Schreib Lena eine ' +
            'SMS (20 bis 40 Wörter). Nenne diese drei Punkte: Warum kommst du nicht? Was wünschst du ' +
            'Lena? Wann möchtest du Lena treffen?',
          criteria: [
            'Du hast alle drei Punkte geschrieben: Grund, Wunsch und Termin.',
            'Du hast eine Anrede und einen Gruß geschrieben.',
            'Du benutzt die du-Form. Lena ist deine Freundin.',
            'Dein Text hat 20 bis 40 Wörter.',
            'Man versteht deinen Text ohne Probleme.',
          ],
        },
        {
          key: 'schreiben-2',
          type: 'writing',
          label: 'Teil 2 · E-Mail an die Nachbarin',
          task:
            'Am Freitag kommt ein Paket für Sie. Sie sind an dem Tag nicht zu Hause. Schreiben Sie eine ' +
            'E-Mail (30 bis 60 Wörter) an Ihre Nachbarin. Nennen Sie diese drei Punkte: Wann kommt das ' +
            'Paket? Wo soll die Nachbarin es lassen? Wann holen Sie das Paket ab?',
          criteria: [
            'Du hast alle drei Punkte geschrieben: Tag, Ort und Zeit.',
            'Du hast eine Anrede und einen Gruß geschrieben.',
            'Du benutzt die Sie-Form. So schreibt man an eine Nachbarin.',
            'Dein Text hat 30 bis 60 Wörter.',
            'Man versteht deinen Text ohne Probleme.',
          ],
        },
      ],
    },
  ],
};
