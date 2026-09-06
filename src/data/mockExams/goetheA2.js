// Goethe-Zertifikat A2 (Erwachsene) — Übungstest (Kurzversion), Wave 5 PR D1.
//
// HONESTY CONTRACT (same as every module under src/data/mockExams/ and the
// three course tests): this is DeutschMeister's OWN practice material in the
// STYLE of the Goethe-Zertifikat A2 — never official exam material, never
// affiliated with the Goethe-Institut. Whatever surface renders this module
// must also render MOCK_DISCLAIMER_DE (src/data/examTracks.js) and label every
// score a Richtwert, not an official result. "Kurzversion" stays in the title
// because this is a SHORTENED pass at the format: 60 minutes and 20 auto-scored
// items (10 Lesen + 10 Hören) against the real exam's ~90 written minutes and
// 40 (20 Lesen + 20 Hören). Round 1 called that "half length"; on minutes it is
// not (60 against ~90), so the claim is gone from the module and from the intro
// — "gekürzt" is what is true on both counts.
//
// The mock has NO Sprechen, and the intro says so in plain German. That is not
// a gap to be papered over: the A2 pass rule has TWO thresholds, and the
// second one (mindestens 15 von 25 Punkten im Sprechen) simply cannot be
// simulated by a self-scored written set. A learner who scores 100 % here has
// been told nothing about the oral half.
//
// EXAM FACTS — every figure below comes from astro-site/src/data/guides/
// goethe-a2.js and nowhere else (no figure is retyped from memory):
//   * four Prüfungsteile, je 25 Punkte, zusammen 100 ......... guide, answer + table
//   * Lesen 30 Min., Hören ca. 30 Min., Schreiben 30 Min.,
//     Sprechen ca. 15 Min. zu zweit ......................... guide, sections table
//   * bestanden ab 60/100, dabei mind. 45/75 schriftlich
//     und mind. 15/25 im Sprechen ........................... guide, answer + faq
//   * Hören: Teile 1, 3 und 4 laufen zweimal, Teil 2 nur
//     einmal ................................................ guide, "Im Hören gibt es eine Falle"
//   * Schreiben Teil 1 = kurze persönliche Nachricht (SMS),
//     20-30 Wörter; Teil 2 = halbformelle E-Mail, 30-40
//     Wörter; je 3 Leitpunkte ............................... guide, table + faq
//   * Modellsatz und Übungssatz sind beim Goethe-Institut
//     kostenlos ............................................. guide, "Zum Üben stellt das Goethe-Institut"
// The Lesen part shapes (Teil 1 Medientext · Teil 2 Informationstafel/Programm ·
// Teil 3 Korrespondenz · Teil 4 Anzeigen zuordnen) come from the Modellsatz
// overview table in the PR brief, verified 2026-09-06. Nothing else about the
// real exam is claimed here, and no fee figure appears anywhere in this file.
//
// SHAPE: copied from src/data/mockExams/goetheA1.js (examKey, title, intro,
// passPercent, sections[{key,title,minutes,instructions,parts[]}]) with the
// 'matching' part shape taken from src/data/mockExams/telcB1.js. No content is
// copied from either. src/services/examScoring.js scores matching + mc-group at
// one point per item; listening items are counted at runtime from the DB;
// writing is never auto-scored. tests/exams.test.mjs (~140-200) holds the mock
// guards this shape has to satisfy.
//
// INTEGRATION DEPENDENCY, not satisfiable from this file: src/data/examTracks.js
// currently carries `hasMock: false` for goethe_a2 with the comment "No
// MOCK_EXAMS.goethe_a2 yet". tests/exams.test.mjs pins that flag against the
// MOCK_EXAMS map in BOTH directions, so registering this module in
// src/data/mockExams/index.js and flipping that flag must happen in the SAME
// commit or the suite fails either way round.
//
// ── Hören: which two exercises, and why ──────────────────────────────────
// Six A2.2 listening exercises exist (#1 Arbeit und Beruf, #2 Gesundheit und
// Fitness, #3 Kultur und Veranstaltungen, #4 Bank und Finanzen, #5 Behörden
// und Ämter, #6 Umwelt und Nachhaltigkeit), each 10 dialogues / 10 questions,
// 473-543 s of audio. The full dump is in exam/source/listening-a2.2-*.json.
// In every one of them question_number N belongs to dialogue_number N, so
// `questionMax: 5` keeps exactly the items answerable from the first five
// dialogues — the first half of each recording.
//
// hoeren-1 = #1 "Arbeit und Beruf" (id a13c26a4-ccdd-43ea-8dcd-410e771e2e56,
// 473 s). It is the cleanest of the six on BOTH counts a mock cares about.
// Its dialogues rehearse this course's own A2.2 grammar: "Vielen Dank, dass Sie
// gekommen sind." (dass-Satz mit Perfekt), "Ich habe mich über die üblichen
// Gehälter informiert." (reflexives Verb mit fester Präposition), "Wir könnten
// mit zweiundvierzigtausend Euro starten, mit einer Erhöhung nach der
// Probezeit." (Konjunktiv II höflich), "Bringen Sie bitte eine Krankmeldung
// mit, wenn Sie wieder da sind." (wenn-Satz + trennbares Verb), "Ich war dort
// für die Buchhaltung zuständig." (war statt Präteritum eines Vollverbs).
// Register is exam-normal: formal Sie in the Vorstellungsgespräch, everyday
// phrases the level file lists as frozen chunks ("Das tut mir leid.", "Gute
// Besserung!"). And its five scored items do not degenerate into digit
// recognition: item 2 needs a whole turn ("Manchmal bin ich zu
// perfektionistisch.") and item 5 is an inference ("Waren Sie schon beim
// Arzt?" — "Ich habe um zehn Uhr einen Termin." → the statement "Frau Weber
// war schon beim Arzt." is Falsch). The three numeric items are all stated
// verbatim in the audio; none of them needs arithmetic.
//   Known cost, disclosed rather than hidden: src/data/mockExams/dtz.js already
//   uses A2.2 #1 as its hoeren-1, with no questionMax, i.e. all ten questions.
//   A learner who has run the DTZ Kurzversion has met these five items before.
//   Worse than round 1 stated: dtz.js takes all ten questions, so such a
//   learner has seen these five items AND their answers — 5 of this set's 20
//   auto-scored points would be a memory check for them.
//   That was weighed against the alternatives and accepted: the two exercises
//   that are free of any other mock and could replace it (#2, #5) score zero
//   non-numeric items in the first five, and #3's item 1 is broken for a
//   listening test (see notes.md). The population it can affect is also
//   narrow, which round 1 missed: resolveModelltest() gates a mock on the
//   LAST entry of its track's sublevels, so dtz gates on 'b1.1'
//   (EXAM_TRACKS.dtz.sublevels = ['a2.2','b1.1']) while goethe_a2 gates on
//   'a2.2' — only a learner with B1.1 access who ran the DTZ set first meets
//   the repeat. PR D2 (Abschlusstest A2.2) must NOT take #1 either, or the
//   overlap widens to a third surface.
//
// hoeren-2 = #6 "Umwelt und Nachhaltigkeit" (id
// 17524bf4-468d-4d75-8617-50ac0ab80c11, 519 s), used by no other mock. It is
// the only exercise whose scored items are majority NON-numeric — colour
// ("Welche Farbe hat die Tonne für Plastik?"), a richtig/falsch ("Der Mann hat
// schon LED-Lampen."), a what-does-he-buy item ("Eier und Fleisch") — which is
// the opposite failure mode from the price-catching drills that fill #2 and
// #5. Topic and register are everyday A2: "Ich bin neu hier. Wie funktioniert
// die Mülltrennung?", "Das ist komplizierter als in meinem Heimatland."
// (Komparativ), "Wenn es nicht zu glatt ist, ja." (wenn-Satz), "Glas muss man
// zum Glascontainer bringen." (Modalverb mit man).
//   Blemishes in the reused audio, disclosed and NOT worked around: dialogue 2
//   and dialogue 4 carry three Passiv forms ("So werden mehr Flaschen
//   recycelt.", "Bei Bio werden keine chemischen Pestizide benutzt.", "Aber die
//   Tiere werden besser behandelt.") and one partitive Genitiv ("Deutschland
//   hat eine der höchsten Recyclingquoten in Europa."), and words such as
//   Pestizide, Recyclingquoten and Steckdosenleiste sit above the A2-Wortliste.
//   Both are recognition-only inside DB content this file reuses rather than
//   authors; no scored item depends on any of them (each of the five keys was
//   re-solved from the transcript). Say the number plainly: that is FOUR B1
//   forms in dialogues 1-5, and S/wave5/level-a2.2.md caps a receptive text at
//   TWO. The reading this file works to — and a future author may overrule it
//   — is that the cap binds text an author WRITES, while reusing an existing
//   DB recording is a selection decision the level file has no clause for; the
//   honest description is therefore "over the cap, selected anyway, disclosed",
//   not "within the cap". As in abschlusstestA21.js, the grammar claim at the
//   end of this header covers the AUTHORED strings and says nothing about the
//   reused audio.
// Left for PR D2 (Abschlusstest A2.2): #2 "Gesundheit und Fitness" — a core A2
// Thema, untouched by any mock, whose dialogues rehearse the A2.2 syllabus
// itself; its weakness (items 1-5 are all short-fact) matters less to a course
// test that takes all ten, where item 7 is an R/F inference. Reasons for
// rejecting #3, #4 and #5 are in notes.md, each on a checkable item defect.
//
// questionMax / playsAllowed. `questionMax: 5` on both parts: useExerciseDetails()
// loads EVERY listening_questions row for an exercise and MockListeningPart
// filters them through selectListeningQuestions() for both rendering AND score
// registration, so the cap is what keeps this set at its designed 10 Hören : 10
// Lesen weighting instead of silently becoming 20 : 10.
//
// TIMING — settled in round 2, and the reason both parts carry `playsAllowed: 1`.
// Round 1 shipped `minutes: 15` with hoeren-1 on the runner's default of two
// plays. That section could not be finished as it described itself: the audio
// assets are whole-exercise mp3s (getAudioUrl → exercise1.mp3), `questionMax`
// caps ITEMS and not audio, the runner's <audio> has no `controls` (no stop, no
// pause; "Abspielen" restarts from currentTime = 0), and the section clock is a
// wall-clock countdown off exam_attempts.section_deadline that never references
// audio state and calls nextSection() at zero — unanswered items are simply
// lost. 473 s + 519 s = 16:32 against 900 s, and with two plays on hoeren-1 the
// ceiling was 24:25. The fix, per the coordinator's ruling:
//   * `playsAllowed: 1` on BOTH parts (the runner resolves
//     `part.playsAllowed ?? PLAYS_ALLOWED`, so this is the only way to leave
//     the two-play default) — 992 s of audio, worst case;
//   * Hören `minutes: 20`, so the section total is 60 min, not 55;
//   * the intro and the Hören instructions say plainly that the real exam plays
//     Teile 1, 3 und 4 twice and Teil 2 once (guide), and that this Kurzversion
//     plays every Hörtext once because its time is shorter. No sentence in the
//     module now promises a second play.
// A stop control in ModelltestRun.jsx would be the better long-term fix, but it
// is a runner change, not a content change, and on its own it would not have
// removed the two-play ceiling. It stays a follow-up (notes.md).
//
// ── Content level: A2.2, per S/wave5/level-a2.2.md ───────────────────────
// A1 + all twelve A2.1 topics + all twelve A2.2 topics are in play, and the
// four newest A2.2 topics are used on purpose, receptively, in the authored
// texts:
//   * konjunktiv-ii-polite  — "Könnten Sie mir bitte schreiben, ob wir den
//     Reifen wechseln sollen?" (lesen-3).
//   * verbs-with-prepositions-intro — "Viele Kunden freuen sich über die
//     frischen Produkte aus der Region." (lesen-1), "Wir kümmern uns um deine
//     Katze, wenn du im Urlaub bist." (lesen-4, Anzeige b).
//   * indirect-questions-intro — the ob-Satz in lesen-3 above.
//   * infinitive-with-zu-intro — "Es ist nicht leicht, am Rathausplatz zu
//     parken." (lesen-1).
// Already-live A2.2 topics in the same strings: Komparativ ("viel größer als
// der alte Platz", "mehr Familien als früher"), dass-Satz ("Er meint auch, dass
// die Leute jetzt länger bleiben."), wenn-Satz ("Wenn es stark regnet, fällt
// der Markt aus."), Perfekt ("Wir haben die Bremsen repariert"), war/hatte
// ("Früher war der Markt am Bahnhof."), koordinierende Konjunktionen, trennbare
// Verben, Imperativ, Adjektivendungen nach Artikel ("der hintere Reifen", "ein
// kleines Café").
// NOTHING from the level file's banned list appears in ANY German string of
// this module — intro, section instructions, task texts and criteria included:
// no Präteritum of a full verb, no Passiv, no Genitiv beyond none at all, no
// relative clause, no Konjunktiv II outside würde/könnte/hätte/wäre/möchte, no
// B1 subordinator (als/obwohl/damit/bevor/während/bis as a Subjunktor), no
// "um ... zu"/"ohne ... zu", no Plusquamperfekt, no n-Deklination, no adjective
// ending after a null article outside the frozen chunks, and no sentence over
// 16 words. B1 forms authored on purpose: ZERO (the level file allows at most
// two in the whole mock; none was needed).
// The null-article clause is the one round 1 got wrong, and it is worth naming:
// seven instances shipped in round 1 — `mit kurzen Gesprächen` (Hören
// instructions), `ohne neuen Reifen` (a CHECK PROMPT), `Neuer Wochenmarkt`
// (headline), `Freundliche Grüße` (which is also not one of the level file's
// frozen closings), `sucht neue Leute`, `Neue Mitglieder zahlen …` and `mit
// anderen Leuten` — backticked, per abschlusstestA21.js's convention, because
// they are no longer strings of this module — while this header asserted their
// absence and the validator
// had no rule for the class at all. All seven are gone (round 2), the level
// file's ban is read as covering the singular pattern in EVERY string, not just
// production text, and validate-goetheA2.test.mjs now carries a dedicated
// null-article check with its own injection proof. Two further blind spots the
// review found by injection are closed in the same round: Passiv with a
// non-"ge" participle (organisiert / verkauft / bezahlt) and a wider Präteritum
// list. That list is an ENUMERATION, not a sweep — see the validator's header
// for why a pure -te/-ten shape rule is unusable in German — so a Präteritum
// verb outside it can still slip past the machine and needs a reader.

export const goetheA2Mock = {
  examKey: 'goethe_a2',
  title: 'Goethe-Zertifikat A2 Übungstest (Kurzversion)',
  intro:
    'Das ist ein Übungstest von DeutschMeister im Stil vom Goethe-Zertifikat A2. ' +
    'Er ist kein offizielles Prüfungsmaterial. ' +
    'Dein Ergebnis ist ein Richtwert und keine offizielle Bewertung. ' +
    'Die echte Prüfung hat vier Teile: Lesen, Hören, Schreiben und Sprechen. ' +
    'Jeder Teil zählt 25 Punkte, zusammen sind das 100 Punkte. ' +
    'Du bestehst ab 60 von 100 Punkten. ' +
    'Dabei brauchst du mindestens 45 von 75 Punkten in den drei schriftlichen Teilen. ' +
    'Im Sprechen brauchst du mindestens 15 von 25 Punkten. ' +
    'Dieser Übungstest hat kein Sprechen. ' +
    'Diese zweite Grenze im Sprechen kann er also nicht testen. ' +
    'Sprechen trainierst du im Speaking-Missions-Trainer, nicht hier. ' +
    'Der Test ist kürzer als die echte Prüfung. In Lesen und Hören hat er 20 Aufgaben. ' +
    'Die echte Prüfung hat dort 40 Aufgaben. ' +
    'Du hast 20 Minuten für Hören, 20 Minuten für Lesen und 20 Minuten für Schreiben. ' +
    'In der echten Prüfung hörst du die Teile 1, 3 und 4 zweimal. ' +
    'Teil 2 hörst du dort nur einmal. ' +
    'Hier hörst du jeden Hörtext nur einmal, weil die Zeit kürzer ist. ' +
    'Beim Goethe-Institut gibt es einen kostenlosen Modellsatz und einen Übungssatz. ' +
    'Übe vor der Prüfung auch mit dem Modellsatz.',
  passPercent: 60,

  sections: [
    {
      key: 'hoeren',
      title: 'Hören',
      minutes: 20,
      instructions:
        'Du hörst zwei Übungen mit Gesprächen aus dem Alltag. ' +
        'Zu jedem Hörtext gibt es fünf Aufgaben. ' +
        'Die Antworten kommen in den ersten fünf Gesprächen. ' +
        'In der echten Prüfung hörst du die Teile 1, 3 und 4 zweimal. ' +
        'Teil 2 hörst du dort nur einmal. ' +
        'Hier hörst du jeden Hörtext nur einmal, weil die Zeit kürzer ist. ' +
        'Lies die Aufgaben zuerst. Dann findest du die Antworten schneller. ' +
        'Für diesen Teil hast du 20 Minuten Zeit.',
      parts: [
        {
          key: 'hoeren-1',
          type: 'listening',
          // Five independent short exchanges, not one continuous scene: the
          // applicant is Herr Becker in dialogue 1 and a woman in dialogue 2,
          // so a scenario-style label would mislead (review finding 6).
          label: 'Hörtext 1 · Gespräche aus dem Berufsleben',
          level: 'A2.2',
          exerciseNumber: 1,
          // Provenance only — the runner resolves audio and questions by
          // level + exerciseNumber, never by id.
          exerciseId: 'a13c26a4-ccdd-43ea-8dcd-410e771e2e56',
          questionMax: 5,
          // One play, like hoeren-2 — see the timing note in the header.
          playsAllowed: 1,
        },
        {
          key: 'hoeren-2',
          type: 'listening',
          label: 'Hörtext 2 · Gespräche über die Umwelt',
          level: 'A2.2',
          exerciseNumber: 6,
          exerciseId: '17524bf4-468d-4d75-8617-50ac0ab80c11',
          questionMax: 5,
          playsAllowed: 1,
        },
      ],
    },
    {
      key: 'lesen',
      title: 'Lesen',
      minutes: 20,
      instructions:
        'Wie in der Prüfung hat Lesen vier Teile. ' +
        'Teil 1: ein Text aus dem Internet. Teil 2: ein Programm. ' +
        'Teil 3: eine E-Mail. Teil 4: Anzeigen. ' +
        'In Teil 1 bis Teil 3 wählst du a, b oder c. ' +
        'In Teil 4 ordnest du zu. ' +
        'Manchmal passt keine Anzeige. Dann wählst du x. ' +
        'Für diesen Teil hast du 20 Minuten Zeit.',
      parts: [
        {
          key: 'lesen-1',
          type: 'mc-group',
          label: 'Teil 1 · Text aus dem Internet',
          text:
            'Der neue Wochenmarkt am Rathausplatz\n' +
            'Seit dem 1. April gibt es einen neuen Wochenmarkt am Rathausplatz. ' +
            'Er ist jeden Samstag von 8 bis 13 Uhr geöffnet. ' +
            'Früher war der Markt am Bahnhof. ' +
            'Dort war der Platz aber zu klein. ' +
            'Der Rathausplatz ist viel größer als der alte Platz. ' +
            'Heute verkaufen 24 Händler Obst, Gemüse, Brot und Käse. ' +
            'Viele Kunden freuen sich über die frischen Produkte aus der Region. ' +
            'Ein Bauer aus Weinheim sagt: „Am Samstag kommen mehr Familien als früher.“ ' +
            'Er meint auch, dass die Leute jetzt länger bleiben. ' +
            'Neben der Bushaltestelle steht seit Mai ein kleines Café. ' +
            'Dort kann man sitzen und Kaffee trinken. ' +
            'Es ist nicht leicht, am Rathausplatz zu parken. ' +
            'Deshalb kommen viele Besucher mit dem Bus. ' +
            'Wenn es stark regnet, fällt der Markt aus.',
          items: [
            {
              id: 'a2-l1-1',
              prompt: 'Warum ist der Markt heute am Rathausplatz?',
              options: [
                { key: 'a', label: 'Am Bahnhof war der Platz zu klein.' },
                { key: 'b', label: 'Am Bahnhof gab es keinen Bus.' },
                { key: 'c', label: 'Am Bahnhof waren die Händler zu teuer.' },
              ],
              answer: 'a',
            },
            {
              id: 'a2-l1-2',
              prompt: 'Wann ist der Markt geöffnet?',
              options: [
                { key: 'a', label: 'Jeden Tag von 8 bis 13 Uhr.' },
                { key: 'b', label: 'Jeden Samstag von 8 bis 18 Uhr.' },
                { key: 'c', label: 'Jeden Samstag von 8 bis 13 Uhr.' },
              ],
              answer: 'c',
            },
            {
              id: 'a2-l1-3',
              prompt: 'Was gibt es seit Mai am Rathausplatz?',
              options: [
                { key: 'a', label: 'Eine Bushaltestelle.' },
                { key: 'b', label: 'Ein Café.' },
                { key: 'c', label: 'Einen Parkplatz.' },
              ],
              answer: 'b',
            },
          ],
        },
        {
          key: 'lesen-2',
          type: 'mc-group',
          label: 'Teil 2 · Programm im Bürgerzentrum',
          text:
            'Bürgerzentrum Nordstadt — Programm am Samstag\n' +
            '10.00 Uhr, Raum 1: Deutsch-Café. Sprechen und Kaffee trinken. Ohne Anmeldung.\n' +
            '11.30 Uhr, Hof: Fahrradwerkstatt. Bring dein Fahrrad mit. Wir reparieren zusammen.\n' +
            '13.00 Uhr, Raum 3: Hilfe bei Formularen. Bitte alle Papiere mitbringen.\n' +
            '15.00 Uhr, Garten: Programm für Kinder ab 4 Jahren. Spiele und Musik.\n' +
            '17.00 Uhr, Raum 1: Vortrag „Wie finde ich eine Wohnung?“\n' +
            'Der Eintritt ist frei. Das Café im Erdgeschoss ist von 10 bis 18 Uhr geöffnet.',
          items: [
            {
              id: 'a2-l2-1',
              prompt: 'Du möchtest dein Fahrrad reparieren. Wohin gehst du?',
              options: [
                { key: 'a', label: 'In den Garten.' },
                { key: 'b', label: 'In den Hof.' },
                { key: 'c', label: 'In Raum 3.' },
              ],
              answer: 'b',
            },
            {
              id: 'a2-l2-2',
              prompt: 'Du kommst um 15 Uhr mit deiner Tochter. Sie ist fünf Jahre alt. Wohin gehst du?',
              options: [
                { key: 'a', label: 'In Raum 1.' },
                { key: 'b', label: 'In Raum 3.' },
                { key: 'c', label: 'In den Garten.' },
              ],
              answer: 'c',
            },
          ],
        },
        {
          key: 'lesen-3',
          type: 'mc-group',
          label: 'Teil 3 · E-Mail von der Werkstatt',
          text:
            'Von: Werkstatt Radhaus\n' +
            'An: Frau Berger\n' +
            'Betreff: Ihr Fahrrad\n' +
            'Guten Tag, Frau Berger,\n' +
            'Ihr Fahrrad ist fast fertig. ' +
            'Wir haben die Bremsen repariert und die Lampe gewechselt. ' +
            'Leider ist auch der hintere Reifen kaputt. ' +
            'Ein neuer Reifen kostet 25 Euro. ' +
            'Könnten Sie mir bitte schreiben, ob wir den Reifen wechseln sollen? ' +
            'Mit einem neuen Reifen ist Ihr Fahrrad am Freitag fertig. ' +
            'Ohne den neuen Reifen können Sie es schon morgen abholen. ' +
            'Unsere Werkstatt ist von Montag bis Freitag von 9 bis 18 Uhr geöffnet. ' +
            'Am Samstag ist sie nur bis 13 Uhr geöffnet. ' +
            'Bitte bringen Sie den Zettel von der Anmeldung mit.\n' +
            'Mit freundlichen Grüßen\n' +
            'Tom Sommer',
          items: [
            {
              id: 'a2-l3-1',
              prompt: 'Warum schreibt Herr Sommer?',
              options: [
                { key: 'a', label: 'Er hat eine Frage zum Reifen.' },
                { key: 'b', label: 'Er möchte einen neuen Termin.' },
                { key: 'c', label: 'Das Fahrrad ist schon ganz fertig.' },
              ],
              answer: 'a',
            },
            {
              id: 'a2-l3-2',
              prompt: 'Wann kann Frau Berger das Fahrrad ohne einen neuen Reifen abholen?',
              options: [
                { key: 'a', label: 'Am Freitag.' },
                { key: 'b', label: 'Am Samstag.' },
                { key: 'c', label: 'Schon morgen.' },
              ],
              answer: 'c',
            },
          ],
        },
        {
          key: 'lesen-4',
          type: 'matching',
          label: 'Teil 4 · Anzeigen zuordnen',
          instructions:
            'Lies die drei Situationen und die Anzeigen a bis f. ' +
            'Welche Anzeige passt? Wenn keine Anzeige passt, wähle x.',
          options: [
            {
              key: 'a',
              label:
                'Gitarrenunterricht für Anfänger. Eine Stunde kostet 20 Euro. ' +
                'Wir üben bei mir zu Hause in der Nordstadt. Ruf am besten abends an.',
            },
            {
              key: 'b',
              label:
                'Wir kümmern uns um deine Katze, wenn du im Urlaub bist. ' +
                'Wir kommen jeden Tag und füttern sie. Fünf Euro pro Tag. Familie Braun.',
            },
            {
              key: 'c',
              label:
                'Studentin gibt Nachhilfe in Mathe. Für Schüler von Klasse 5 bis 10. ' +
                'Bei dir zu Hause oder online. 15 Euro pro Stunde.',
            },
            {
              key: 'd',
              label:
                'Wir ziehen um und verkaufen einen Schrank und einen großen Tisch. ' +
                'Beides ist noch gut. Zusammen 60 Euro. Abholung nur am Samstag.',
            },
            {
              key: 'e',
              label:
                'Wir sind eine Wandergruppe und suchen noch Mitglieder. ' +
                'Wir wandern jeden zweiten Sonntag im Wald. ' +
                'Die Touren sind nicht zu lang. Anfänger sind willkommen.',
            },
            {
              key: 'f',
              label:
                'Der Sportverein sucht Spieler für die Freizeitmannschaft. ' +
                'Wir trainieren dienstags um 19 Uhr. Im ersten Monat zahlst du noch nichts.',
            },
            { key: 'x', label: 'Keine Anzeige passt.' },
          ],
          texts: [
            {
              id: 's1',
              text:
                'Deine Nachbarin fährt zwei Wochen weg. ' +
                'Ihre Katze soll zu Hause bleiben. Du suchst Hilfe für die Katze.',
            },
            {
              id: 's2',
              text:
                'Du möchtest am Wochenende in einer Gruppe wandern. ' +
                'Du hast noch keine Erfahrung.',
            },
            {
              id: 's3',
              text:
                'Dein Sohn hat Probleme in Englisch. ' +
                'Er braucht nach der Schule Hilfe von einem Lehrer.',
            },
          ],
          answers: { s1: 'b', s2: 'e', s3: 'x' },
        },
      ],
    },
    {
      key: 'schreiben',
      title: 'Schreiben',
      minutes: 20,
      instructions:
        'Du schreibst zwei Texte. ' +
        'Teil 1 ist eine SMS mit 20 bis 30 Wörtern. ' +
        'Teil 2 ist eine halbformelle E-Mail mit 30 bis 40 Wörtern. ' +
        'Beide Aufgaben haben drei Leitpunkte. Schreib zu jedem Leitpunkt etwas. ' +
        'Der Computer bewertet diese Aufgaben nicht. Nutze den Selbstcheck. ' +
        'Für diesen Teil hast du 20 Minuten Zeit.',
      parts: [
        {
          key: 'schreiben-1',
          type: 'writing',
          label: 'Teil 1 · SMS an eine Freundin',
          task:
            'Du hast eine neue Wohnung gefunden. Schreib deiner Freundin Mira eine SMS. ' +
            'Schreib 20 bis 30 Wörter. Nenne diese drei Punkte: ' +
            'Wie ist die neue Wohnung? Warum freust du dich? ' +
            'Wann kann Mira dir beim Umzug helfen?',
          criteria: [
            'Du hast alle drei Leitpunkte geschrieben: Wohnung, Freude und Bitte um Hilfe.',
            'Du hast eine Anrede und einen Gruß geschrieben.',
            'Du benutzt die du-Form. Mira ist deine Freundin.',
            'Dein Text hat 20 bis 30 Wörter.',
            'Man versteht deinen Text ohne Probleme.',
          ],
        },
        {
          key: 'schreiben-2',
          type: 'writing',
          label: 'Teil 2 · E-Mail an die Bibliothek',
          task:
            'Du hast ein Buch aus der Stadtbibliothek verloren. ' +
            'Schreib eine E-Mail an die Bibliothek. Schreib 30 bis 40 Wörter. ' +
            'Nenne diese drei Punkte: Was ist passiert? Was kostet ein neues Buch? ' +
            'Wann kommst du in die Bibliothek? ' +
            'Vergiss die Anrede und den Gruß nicht.',
          criteria: [
            'Du hast alle drei Leitpunkte geschrieben: Grund, Frage nach den Kosten und Termin.',
            'Du hast eine Anrede und einen Gruß geschrieben.',
            'Du benutzt die Sie-Form. So schreibt man an eine Bibliothek.',
            'Dein Text hat 30 bis 40 Wörter.',
            'Man versteht deinen Text ohne Probleme.',
          ],
        },
      ],
    },
  ],
};
