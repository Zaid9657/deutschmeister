// Abschlusstest A2.2 — the end-of-course test of the A2.2 course (the second
// half of the paid A2 band course). Course Factory Wave 5, PR D2a.
//
// HONESTY CONTRACT (same as every sibling under src/data/mockExams/ and
// src/data/courseTests/): this is our OWN course-completion test, written in
// the STYLE of Goethe-Zertifikat A2 (Erwachsene) — never official exam
// material, never affiliated with the Goethe-Institut. Whatever surface
// renders this module must also render MOCK_DISCLAIMER_DE (src/data/
// examTracks.js) and label every score a Richtwert, not an official result.
// "Kurzversion" stays in the title because this is a half-length pass at the
// A2 written format: 55 minutes and 10 objective Lesen items + 10 Hören
// items, against the real exam's ~90 written minutes (Lesen 30 + Hören ca.
// 30 + Schreiben 30 — astro-site/src/data/guides/goethe-a2.js: "dauert
// insgesamt etwa 90 Minuten ohne Pause") and 40 objective items (20 Lesen +
// 20 Hören, same source) — so this module's 20 objective items are exactly
// half. [Round 2 fix: the round-1 header asserted `~80 minutes` and `20
// objective items` against the real exam, an arithmetic error the guide
// contradicts directly; abschlusstestA21.js's own header already had this
// right.]
//
// Every German string quoted in this header is verbatim — either a line of
// S/test/source/listening-a2.2-exercise2-full.json or a string of this
// module itself.
//
// ── Lesen shape — coordinator ruling carried from abschlusstestA21.js ────
// Both Lesen parts are the a/b/c-or-matching Goethe A2 shapes, never
// Richtig/Falsch (that is the A1 / Start-Deutsch-1 shape). This wave adds
// the SECOND Lesen shape the A2.1 sibling did not need: `lesen-4` is a
// `matching` part (six Anzeigen a–f + the mandatory {key:'x', label:'Keine
// Anzeige passt.'} distractor, five situations, one answer per situation),
// copying the SHAPE of src/data/mockExams/telcB1.js's `lesen-1` matching
// part and S/exam/goetheA2.js's own `lesen-4` (options/texts/answers keyed
// the same way) — content is original; the de-duplication check against
// both sibling PRs is in the comment directly above the `lesen-4` part
// object below, not asserted here.
// `lesen-2` is an `mc-group` in Teil-2 style: an Informationstafel (a
// Fitnessstudio's weekly Kursplan), 70–100 words of short board lines, plus
// five a/b/c items each phrased `Du möchtest … Wann/Was …?` — the Goethe A2
// Teil-2 register, distinct from `lesen-1`'s Teil-1 continuous-text register
// used by both goetheA1.js and abschlusstestA21.js.
//
// Shape: identical to src/data/courseTests/abschlusstestA21.js — examKey,
// courseLevel, formatOf, title, intro, passPercent, sections[{key, title,
// minutes, instructions, parts[]}] with part types listening / mc-group /
// writing, PLUS `matching` (new to a course test in this PR; matching's own
// shape — options/texts/answers — copies src/data/mockExams/telcB1.js).
// src/services/examScoring.js's scoreObjectiveSections() and
// src/data/mockExams/index.js's countScorableItems() already handle
// `matching` generically (texts.length scored/counted, answers[`${part.key}:
// ${t.id}`] compared to part.answers[t.id]) — nothing there needed to change
// for a course test to carry one.
//
// Field-name note (same as abschlusstestA21.js): the brief's "level" is this
// module's `courseLevel`; `level` is the field name on the COURSE_TESTS
// registry ROW, not on this module. Nothing in the repo reads either field
// off the module — the resolver and the guard read `level` off the registry
// row — so this file follows the shipped template rather than inventing a
// second level field.
//
// Registry note: this module is NOT YET wired into
// src/data/courseTests/index.js (this PR owns only the S/test/ scratch
// files; wiring is a separate, later commit against the live repo). When it
// is, the entry is:
//   { key: 'a2_2_abschluss', slug: 'abschlusstest-a2-2',
//     nameDe: 'Abschlusstest A2.2', level: 'a2.2', formatOf: 'goethe_a2',
//     mock: abschlusstestA22 }
// Gate: resolveModelltest() (src/data/modelltest.js) returns gateLevel = the
// course test's own level, so ExamSubscriptionGuard gates this on 'a2.2'.
// Verified live against the repo (2026-09-06): 'a2.2' is NOT in FREE_LEVELS
// (src/config/freeTier.js lists only 'a1.1'), and bandCourseForLevel('a2.2')
// resolves to LEVEL_COURSES.course_a2 (levels ['a2.1','a2.2']) — so access
// needs Pro/trial OR the A2 course purchase, the SAME gate as
// abschlusstestA21 and the A2.2 level pages themselves.
//
// FIVE INTEGRATION DEPENDENCIES, none satisfiable from this file:
//   1. formatOf 'goethe_a2' as an EXAM_TRACKS key — ALREADY LIVE. Verified
//      2026-09-06 by reading src/data/examTracks.js directly: the track
//      exists (key 'goethe_a2', hasMock: false — "No MOCK_EXAMS.goethe_a2
//      yet"). tests/exams.test.mjs's "formatOf resolves to a real
//      EXAM_TRACKS key" assertion already passes for this course test — that
//      SPECIFIC guard has no ordering dependency left (unlike the A2.1
//      sibling, which still had to wait on Wave 4 PR D1 when it was
//      written). A narrower one remains: see dependency 5.
//   2. exam_attempts_exam_key_check must admit 'a2_2_abschluss'. The newest
//      migration on disk (migrations/2026-09-06-a2-1-abschlusstest.sql) adds
//      'goethe_a2' and 'a2_1_abschluss' to ('telc_b1', 'goethe_b1', 'dtz',
//      'telc_b2', 'goethe_a1', 'a1_1_abschluss', 'a1_2_abschluss') — nine
//      keys, no 'a2_2_abschluss'. Registering this module needs ONE MORE
//      migration re-creating the CHECK with all ten keys, dated after
//      2026-09-06, or tests/exams.test.mjs's newest-migration scan fails and
//      exam_attempts inserts for this key are rejected at the DB.
//   3. playsAllowed — the runner line already exists (landed with the A2.1
//      PR): MockListeningPart in src/pages/Modelltest/ModelltestRun.jsx
//      resolves `const playsAllowed = part.playsAllowed ?? PLAYS_ALLOWED;`
//      and both the `canPlay` guard and the "Noch ...x abspielbar" label
//      read it. Nothing new to land for THIS module — it only needs to set
//      the field, which it does below.
//   4. tests/exams.test.mjs's OWN course-test loop (the "every course test
//      is well-formed..." test, ~section 7) does NOT yet handle a `matching`
//      part: its per-part-type branch is `mc-group` / `listening` /
//      `writing`, else `assert.fail`. Registering abschlusstestA22 in
//      COURSE_TESTS without ALSO teaching that loop to build a `matching`
//      part's perfect-answer entries (the way the top-of-file "every mock
//      exam is internally consistent" test already does for MOCK_EXAMS)
//      will make that guard fail on this module the moment it is wired in.
//      This is a real repo-test edit a future commit must make in the SAME
//      PR as the registry wiring — it cannot be made from S/test/, and it is
//      not needed for `S/test/validate-a22.test.mjs` (below), which imports
//      this module directly rather than through COURSE_TESTS.
//   5. The intro's last sentence promises a Goethe-Zertifikat-A2-Übungstest
//      to move on to. That promise depends on a SECOND artefact beyond the
//      EXAM_TRACKS row dependency 1 discharges: PR D1's mock module
//      (S/exam/goetheA2.js) must be merged into src/data/mockExams/ AND
//      registered in src/data/mockExams/index.js's MOCK_EXAMS AND
//      EXAM_TRACKS.goethe_a2.hasMock flipped to true — none of which has
//      happened yet (verified live 2026-09-06: MOCK_EXAMS has no goethe_a2
//      key, and the track's own comment still reads "No MOCK_EXAMS.goethe_a2
//      yet"). The intro's wording below is deliberately non-committal about
//      WHEN ("Danach kommt …", not `kannst du … machen` — backticked because
//      that phrase is no longer a string of this module, per the header's
//      own verbatim-quote convention) so it stays true
//      before and after that merge; it should not be read as evidence the
//      dependency is already satisfied.
//
// ── Hören: which exercise, and why ────────────────────────────────────────
// A2.2 listening exercise #2 "Gesundheit und Fitness" (live id
// 7cde74a6-30e4-403c-a34f-38cab5e5993f, 10 dialogues, 10 questions, 486 s
// audio, plays_allowed 2 in the DB). Reserved for this PR by
// S/exam/notes.md §2 ("Left for PR D2 (Abschlusstest A2.2): #2 'Gesundheit
// und Fitness.'"): the other five A2.2 exercises are already spent —
// dtz.js's hoeren-1 and S/exam/goetheA2.js's hoeren-1 both take #1, and
// S/exam/goetheA2.js's hoeren-2 takes #6; #3, #4 and #5 were surveyed and
// rejected by that PR for defects quoted in its notes.md (an unanswerable
// arithmetic item in #3, a live transcript grammar error and heavy Genitiv
// in #4, an all-digit-recognition item set in #5). Verified independently
// here by re-reading src/data/mockExams/{dtz,goetheB1,telcB1,telcB2}.js and
// src/data/courseTests/{abschlusstestA11,abschlusstestA12,abschlusstestA21}.js:
// none references an A2.2 exercise at all, so #2 is free on every axis.
//
// Why #2 fits a COURSE test (not just "the one left over"):
//   * Core A2 Thema untouched by any other mock or course test, and its ten
//     dialogues rehearse this course's own grammar throughout: "Ich möchte
//     anfangen, regelmäßig zu trainieren." (infinitive-with-zu-intro),
//     "Versuchen Sie, zwei Liter Wasser am Tag zu trinken." (same topic),
//     "Ich habe mich beim Joggen verletzt." (reflexive-verbs), "Die
//     günstigste kostet neunundzwanzig Euro im Monat." (superlative),
//     "Gibt es Pakete, die günstiger sind?" (Komparativ, inside a B1
//     Relativsatz — see the blemish note below), "Gehen Sie zum Arzt, wenn
//     die Schwellung nicht besser wird." (wenn-Satz).
//   * Register fits the level file: formal Sie throughout (Fitnessstudio-
//     Anmeldung, Personal Trainer, Physio-artige Beratung), no du anywhere
//     it would not belong.
//   * questionMax: 10 (ALL ten questions, unlike S/exam/goetheA2.js's
//     questionMax: 5 for its two exercises). A course test takes the whole
//     exercise — and honestly, that exercise is number/time retrieval
//     start to finish: items 1–6 and 8–10 are each a price, quantity, count
//     or clock time stated verbatim (49 €, 100 € gespart, 2 Liter, "Heute um
//     18 Uhr", 1 Woche, 15 €, 20 Zigaretten, 5-6 Stunden, 500 €), and item 7
//     ("Der Mann läuft momentan 20 Kilometer pro Woche." → Falsch against
//     "Etwa zehn Kilometer pro Woche.") is also a digit check, not a whole-
//     clause inference. [Round 2 fix: round 1 claimed items 8–10 "each need
//     a whole clause" — checked against the transcript and re-pulled from
//     listening_questions, that is false; all ten are number/time lookups.]
//     This is a known weakness of the exercise, accepted anyway because it
//     is the only unspent A2.2 listening set (see above) and because the
//     Lesen half is where this module's grammar coverage actually lives —
//     the Hören section was never meant to carry that load.
// Blemishes across the ten dialogues, disclosed and not exercised by any
// item below: "Gibt es Pakete, die günstiger sind?" (dialogue 2, Relativsatz
// — inside the first five; recognition-only, not tested by item 2, which
// asks only for the saved amount), "Lassen Sie mich mal sehen." (dialogue 5,
// lassen + Infinitiv), "Sie sollten kühlen und den Fuß hochlegen."
// (dialogue 5, sollte) and "Sie sollten langsam steigern..." (dialogue 7,
// sollte) — four B1 forms across ten dialogues, i.e. within the level file's
// two-per-text cap only if the cap is read per five-dialogue half; over it
// if read across the whole exercise. Reused DB audio, not authored content,
// exactly the disclosure abschlusstestA21.js makes for its own exercise —
// flagged as a doubt for the reviewer, not worked around. [Round 2 fix:
// round 1 headed this paragraph "Blemishes in dialogues 6–10" while every
// cited form sits in dialogue 2, 5 or 7 — the heading contradicted its own
// list.]
//
// Timing, measured not assumed: the audio is 486 s = 8 min 6 s, marginally
// past the "~8 minutes" line in this PR's own brief. One play plus answering
// ten items fits inside 15 minutes; two full plays (16 min 12 s) alone would
// exceed the whole section. playsAllowed: 1, same reasoning and the same
// runner mechanism abschlusstestA21.js already exercises (dependency 3
// above) — nothing here is close enough to the 8-minute line to leave at the
// default of two.
//
// questionMax: 10. Selected via selectListeningQuestions() the same way as
// every other course test; this exercise carried exactly 10 questions at
// authoring time and the cap is set anyway (this PR's brief requires it
// explicitly, and every A1 exercise's 10→23 growth in PR C is the standing
// argument for never omitting it even when nothing has grown yet).
// exerciseId below is provenance only — the runner resolves audio and
// questions by level + exerciseNumber (getAudioUrl('a2.2', 2) →
// audio/listening/A2.2/exercise2.mp3), never by id.
//
// Runtime and weighting: 15 (Hören) + 20 (Lesen) + 20 (Schreiben) = 55 min.
// Lesen weighting is 5 (lesen-2, mc-group) + 5 (lesen-4, matching) = 10,
// matching the A2.1 sibling's 10 Hören : 10 Lesen split.
//
// Schreiben scenarios — de-duplicated by domain against every writing
// source this repo ships, not just this course's own siblings:
//   src/data/writingTasks.js (goethe_a2's own four tasks: SMS-Einladung-
//     absagen, SMS-Treffen-verschieben, E-Mail-Kursanmeldung-VHS, E-Mail-
//     Termin-beim-Amt-ändern; goethe_a1's six Mitteilungen: Termin-Friseur-
//     absagen, Freund-zur-Party-einladen, Verspätung-entschuldigen, Info-
//     Sprachkurs-VHS, Nachbarin-Blumen-gießen-bitten, Vermieter-Heizung-
//     kaputt; plus six Formulare and the three telc tasks),
//   src/data/courseTests/abschlusstestA21.js (SMS-Geburtstagsparty-absagen,
//     E-Mail-Nachbarin-Paket-abholen),
//   S/exam/goetheA2.js (SMS-neue-Wohnung-plus-Bitte-um-Hilfe-beim-Umzug,
//     E-Mail-Bibliothek-verlorenes-Buch),
//   src/data/mockExams/dtz.js (Nachricht an die Hausverwaltung).
// Every one of those is either a cancellation/reschedule, a course/Amt
// enquiry, a moving-in/lost-item report, or a landlord complaint. This
// module writes NEITHER: `schreiben-1` proposes a joint activity (joggen)
// — not an invitation to a party and not a cancellation of anything —
// and `schreiben-2` requests a first appointment at a Physiotherapiepraxis
// for a new problem, never a change to an existing Termin. Both keep the
// course's own health/fitness theme (matching the Hören exercise) without
// reusing its situations. `S/test/validate-a22.test.mjs` runs the same
// keyword-overlap check abschlusstestA21.js's harness introduced (stem +
// stopword-strip both sides, flag a Leitpunkt that shares ≥2 content words
// or one rare one with a live task) against the live src/data/
// writingTasks.js, so this claim is machine-checked, not asserted on
// inspection alone. [Round 2 fix: `schreiben-2`'s second Leitpunkt originally
// read "Wann haben Sie einen freien Termin?" — under the task's own "Sie" =
// the learner/patient framing, that told the PATIENT to name the PRACTICE's
// free slot, which the patient cannot know and the self-check criterion
// could not verify. It was changed to "Wann können Sie in die Praxis
// kommen?", a question the patient can actually answer, without moving
// closer to any live task by the same keyword-overlap check (re-run below).]
//
// Grammar actually used in THIS file's authored German strings — intro and
// section instructions INCLUDED, no carve-out, per the withdrawn-exemption
// ruling abschlusstestA21.js's header already documents. [Round 2: three of
// the instance locations below moved when ads a/b/c/d/e/f were rewritten for
// finding 3 (de-duplication) and findings 1/11 (matching logic); the GRAMMAR
// itself is unchanged, only which Anzeige carries it.]
//   All eight ALREADY-LIVE A2.2 topics, each at least once:
//   * reflexive-verbs: "melden Sie sich bitte an der Rezeption an" (lesen-2
//     board).
//   * simple-past-sein-haben: "Früher gab es nur Gruppenkurse, jetzt bieten
//     wir auch Einzelunterricht an." (lesen-4, Anzeige b — the "es gab"/
//     "gab es" chunk the level file names explicitly).
//   * coordinating-conjunctions: "Alle Kurse sind für Mitglieder kostenlos,
//     aber Gäste zahlen 5 Euro." (lesen-2 board, "aber" at position 0).
//   * subordinating-conjunctions + subordinate-word-order: "Wenn Sie zum
//     ersten Mal kommen, melden Sie sich bitte an der Rezeption an." (lesen-2
//     board, wenn-Satz verb-final, Hauptsatz V2); a second instance in the
//     same style is in `l2-5`'s own prompt ("Was zahlst du, wenn du kein
//     Mitglied bist?").
//   * comparative: "Mein Preis ist günstiger als bei großen Firmen." (lesen-4,
//     Anzeige a, predicative with als).
//   * superlative: "Am liebsten singen wir alte Volkslieder zusammen."
//     (lesen-4, Anzeige f).
//   * future-tense: "Das wird nicht lange dauern." (lesen-4, Anzeige e,
//     werden + Infinitiv). [Round 3 fix: round 2's wording, "Die Arbeit wird
//     wenige Stunden dauern.", had the helper predict a SPECIFIC duration
//     for the client's own job, which he cannot know before starting;
//     "nicht lange dauern" is the everyday reassurance a helper can
//     honestly offer instead, and keeps the same werden+Infinitiv.]
//   And the FOUR NEW A2.2 topics, each used ONCE (within the ≤2 cap):
//   * konjunktiv-ii-polite (9): "Wir könnten uns einmal pro Woche im Café
//     treffen." (lesen-4, Anzeige c).
//   * verbs-with-prepositions-intro (10): "Ich komme aus Spanien und
//     interessiere mich für Sprachen." (lesen-4, Anzeige c, sich
//     interessieren für + Akk).
//   * indirect-questions-intro (11): "Fragen Sie dort auch, ob am Wochenende
//     noch Plätze frei sind." (lesen-2 board, ob-Satz verb-final).
//   * infinitive-with-zu-intro (12): "Ich habe Zeit, am Samstagvormittag
//     vorbeizukommen." (lesen-4, Anzeige a — Zeit haben + zu-Infinitiv, an
//     anchor verb the level file lists explicitly; comma before the
//     zu-group; separable verb `vorbeikommen` correctly infixed).
// NONE of the following appear in ANY string of this module: Präteritum of
// a full verb, a relative clause, Passiv in any tense, Genitiv beyond
// von+Dativ, Konjunktiv II beyond würde/könnte/hätte/wäre/möchte,
// Konjunktiv I/indirekte Rede, um…zu/ohne…zu/statt…zu, a B1 subordinator
// (als/obwohl/damit/bevor/nachdem/während/falls/sodass), Plusquamperfekt,
// Futur II, n-Deklination beyond Herrn, a SINGULAR adjective ending after a
// null article outside the frozen chunks (the level file's 2026-09-06 ruling
// exempts plurals like "alte Volkslieder"/"großen Firmen" but bans the
// singular "kalter Kaffee" pattern everywhere), lassen + Infinitiv, a
// Partizip used as an adjective, or a sentence over 16 words. This claim
// covers the reused Hören audio no more than the abschlusstestA21.js
// sibling's did (see the blemish note above). [Round 3 fix: round 2's own
// rewrite of Anzeige f, "Offener Singabend jeden Mittwoch im Gemeindehaus.",
// was itself exactly this banned singular pattern — this NONE-of-the-above
// claim was false the round it was written to correct a different singular
// noun. Fixed to "Jeden Mittwoch ist der offene Singabend im Gemeindehaus."
// (the adjective now sits after "der", a weak inflection); the harness gained
// a dedicated null-article rule with an injection proof so this class is
// machine-checked rather than asserted on inspection alone (see
// `S/test/validate-a22.test.mjs`).]
//
// Wortliste: not machine-checkable in this sandbox (no local copy). Kept
// deliberately basic; the words a reviewer should look at first are
// Physiotherapiepraxis, Rückenschmerzen, Kursplan, Rezeption and
// Einzelunterricht. [Round 2: the reviewer ruled Kursplan/Rezeption/
// Rückenschmerzen fine (transparent A2 compounds) and Physiotherapiepraxis
// acceptable; Tandempartner and Second-Hand-Kindersachen-Basar, both flagged
// as not transparent, no longer appear anywhere in this module — see the
// de-duplication note above `lesen-4` for what replaced them.] [Round 3: the
// round-2 replacement ads brought their own above-A2 words — "Unkraut
// jäten", "Hecke schneiden" (Anzeige a), "Der Stundenlohn beträgt" (Anzeige
// d, B1-register "betragen"), "Babysitting" (an English loanword with no
// everyday German equivalent in the ad, unlike "Second-Hand", which the
// level's own frozen-chunk-adjacent register allows), and "zusätzlich" in
// `l2-3`'s prompt. All five are gone: Anzeige a now says only "beim
// Rasenmähen"; Anzeige d says "auf Kinder aufpassen" and "Ich nehme 10 Euro
// pro Stunde" (the same everyday phrasing Anzeige e already used); `l2-3`
// asks "... extra?".]

export const abschlusstestA22 = {
  examKey: 'a2_2_abschluss',
  courseLevel: 'a2.2',
  formatOf: 'goethe_a2',
  title: 'Abschlusstest A2.2 (Kurzversion)',
  intro:
    'Das ist der Abschlusstest von deinem A2.2-Kurs. Er trainiert drei Teile vom Goethe-Zertifikat A2: ' +
    'Hören, Lesen und Schreiben. Aber er hat nur die halbe Länge. Der Test kommt von DeutschMeister ' +
    'und ist kein offizielles Prüfungsmaterial. Dein Ergebnis ist ein Richtwert und keine offizielle ' +
    'Bewertung. ' +
    'Wie in der Prüfung bestehst du ab 60 von 100 Punkten. Sprechen trainierst du im ' +
    'Speaking-Missions-Trainer, nicht hier. Danach kommt der Goethe-Zertifikat-A2-Übungstest.',
  passPercent: 60,

  sections: [
    {
      key: 'hoeren',
      title: 'Hören',
      minutes: 15,
      instructions:
        'Du hörst zehn Gespräche über Gesundheit und Fitness. Die Aufnahme dauert etwa acht Minuten. ' +
        'Du hörst sie einmal. Starte die Aufnahme sofort. Beantworte die Fragen schon beim Hören. ' +
        'Für diesen Teil hast du 15 Minuten Zeit.',
      parts: [
        {
          key: 'hoeren-1',
          type: 'listening',
          label: 'Hörtext · Gesundheit und Fitness',
          level: 'A2.2',
          exerciseNumber: 2,
          // Provenance only — the runner resolves by level + exerciseNumber.
          exerciseId: '7cde74a6-30e4-403c-a34f-38cab5e5993f',
          questionMax: 10,
          // 8:06 of audio against a hard 15-minute section timer: one play
          // fits, two (16:12) do not. MockListeningPart resolves
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
        'Teil 2: Lies die Informationstafel. Wähle bei jeder Frage die richtige Antwort: a, b oder c. ' +
        'Teil 4: Lies die fünf Situationen und die Anzeigen a bis f. Welche Anzeige passt? Wenn keine ' +
        'Anzeige passt, wähle x.',
      parts: [
        {
          key: 'lesen-2',
          type: 'mc-group',
          label: 'Teil 2 · Kursplan im Fitnessstudio',
          text:
            'Fitnessstudio AktivPlus – Kursplan diese Woche\n' +
            'Montag, 8 Uhr, Kursraum 1: Rückenfit\n' +
            'Montag, 18 Uhr, Kursraum 2: Bauch-Beine-Po\n' +
            'Dienstag, 7 Uhr, Kursraum 1: Frühsport\n' +
            'Mittwoch, 19 Uhr, Kursraum 2: Zumba\n' +
            'Donnerstag, 17 Uhr, Schwimmbad: Wassergymnastik\n' +
            'Freitag, 18 Uhr, Kursraum 1: Boxtraining\n' +
            'Samstag, 10 Uhr, Kursraum 2: Pilates\n' +
            'Alle Kurse sind für Mitglieder kostenlos, aber Gäste zahlen 5 Euro. ' +
            'Bringen Sie bitte ein Handtuch und Sportschuhe mit. ' +
            'Für Wassergymnastik brauchen Sie auch einen Badeanzug. ' +
            'Wenn Sie zum ersten Mal kommen, melden Sie sich bitte an der Rezeption an. ' +
            'Fragen Sie dort auch, ob am Wochenende noch Plätze frei sind.',
          items: [
            {
              id: 'l2-1',
              prompt: 'Du möchtest zur Wassergymnastik gehen. Wann ist der Kurs?',
              options: [
                { key: 'a', label: 'Donnerstag, 17 Uhr.' },
                { key: 'b', label: 'Montag, 8 Uhr.' },
                { key: 'c', label: 'Freitag, 18 Uhr.' },
              ],
              answer: 'a',
            },
            {
              id: 'l2-2',
              prompt: 'Du kommst zum ersten Mal ins Studio. Was musst du zuerst machen?',
              options: [
                { key: 'a', label: 'Ein Handtuch kaufen.' },
                { key: 'b', label: 'Sich an der Rezeption anmelden.' },
                { key: 'c', label: 'Einen Badeanzug mitbringen.' },
              ],
              answer: 'b',
            },
            {
              id: 'l2-3',
              prompt: 'Was brauchst du für die Wassergymnastik extra?',
              options: [
                { key: 'a', label: 'Nur Sportschuhe.' },
                { key: 'b', label: 'Ein Handtuch und Sportschuhe.' },
                { key: 'c', label: 'Einen Badeanzug.' },
              ],
              answer: 'c',
            },
            {
              id: 'l2-4',
              prompt: 'Du möchtest boxen. Wann ist das Boxtraining?',
              options: [
                { key: 'a', label: 'Montag, 18 Uhr.' },
                { key: 'b', label: 'Freitag, 18 Uhr.' },
                { key: 'c', label: 'Samstag, 10 Uhr.' },
              ],
              answer: 'b',
            },
            {
              id: 'l2-5',
              prompt: 'Was zahlst du, wenn du kein Mitglied bist?',
              options: [
                { key: 'a', label: 'Nichts, es ist kostenlos.' },
                { key: 'b', label: '18 Euro.' },
                { key: 'c', label: '5 Euro.' },
              ],
              answer: 'c',
            },
          ],
        },
        // ── De-duplication note (round 2) ──────────────────────────────
        // Diffed every Anzeige/board/situation below against S/exam/
        // goetheA2.js's own lesen-4 (Gitarrenunterricht / Katzensitting /
        // Nachhilfe-Mathe / Möbelverkauf / Wandergruppe / Sportverein) and
        // PR C's S/reading/exam-format-a2.2.json Teil-4 (Wohnung-vermieten /
        // Aushilfe-Café / Deutschkurs / Fahrrad-verkaufen / Nachhilfe-
        // Mathematik / Flohmarkt). Round 1 shipped three near-copies (ad b
        // was D1's guitar ad with the instrument and price swapped; ad d was
        // D1's furniture ad; ad a was PR C's flea-market ad with the same
        // "Eintritt ist kostenlos" close; ad f reused D1's "wir suchen neue
        // X" club-recruitment template) — all four are gone. Domains now in
        // play: Gartenhilfe (a), eine Musikschule mit Klavierunterricht für
        // Kinder (b), ein Sprachaustausch Spanisch/Deutsch (c), auf Kinder
        // aufpassen (d), Umzugshilfe als Angebot, nicht als Gesuch (e — see
        // the direction note below), ein offener Singabend (f, framed as an
        // event, not a "Gruppe sucht Mitglieder" ad). None of these six
        // domains, and none of the five situations (Klavierunterricht /
        // Umzugshilfe / Singen / Sprachaustausch / Wohnungssuche), appears in
        // either sibling.
        // Direction note (round 2, finding 1): a matching Anzeige must
        // OFFER what its situation NEEDS, not need the same thing itself.
        // Ad e is written from the helper's side ("Ich helfe Ihnen..."),
        // matching s2's "brauchst Hilfe" — re-solved cold after the rewrite,
        // together with every other situation (see the header's Round 2
        // notes and `S/test/validate-a22.test.mjs`'s explicit offer/need
        // direction guards).
        // Limitation, disclosed (round 3, minor 4): the de-duplication test
        // below is a hand-maintained blacklist of the sibling PRs' most
        // distinctive NOUNS. It catches a reused domain or a repeated term
        // ("Katze", "Flohmarkt", …); it cannot catch a PARAPHRASE of a
        // sibling's sentence built from ordinary words. Round 2's Anzeige b
        // closed with "Die Anmeldung ist online oder telefonisch möglich." —
        // no blacklisted noun, so the test passed, but the sentence stitches
        // together PR C's board close ("Die Anmeldung ist online oder an der
        // Information im Erdgeschoss möglich.") and PR C's own Anzeige c
        // close ("Anmeldung online oder telefonisch."). Found by hand
        // re-reading S/reading/exam-format-a2.2.json line by line, not by
        // the harness; fixed by dropping that sentence rather than
        // rewording it again into another paraphrase. Anzeige b also gained
        // "Auch Anfänger sind willkommen." (round 3, minor 3) so it actually
        // answers s1's "Sie hat noch nie Unterricht gehabt." — round 2's
        // "für Kinder ab sechs Jahren" gave the match a hook-less age bar
        // instead.
        {
          key: 'lesen-4',
          type: 'matching',
          label: 'Teil 4 · Anzeigen zuordnen',
          options: [
            {
              key: 'a',
              label:
                'Ich helfe gern im Garten, zum Beispiel beim Rasenmähen. Ich habe Zeit, am ' +
                'Samstagvormittag vorbeizukommen. Mein Preis ist günstiger als bei großen Firmen.',
            },
            {
              key: 'b',
              label:
                'Musikschule Sonnenklang bietet Klavierunterricht für Kinder ab sechs Jahren. Auch ' +
                'Anfänger sind willkommen. Früher gab es nur Gruppenkurse, jetzt bieten wir auch ' +
                'Einzelunterricht an.',
            },
            {
              key: 'c',
              label:
                'Ich komme aus Spanien und interessiere mich für Sprachen. Ich suche jemanden zum ' +
                'Deutsch-Üben. Wir könnten uns einmal pro Woche im Café treffen.',
            },
            {
              key: 'd',
              label:
                'Ich passe gern am Abend und am Wochenende auf Kinder auf. Ich habe viel Erfahrung mit ' +
                'Kindern von zwei bis zehn Jahren. Ich nehme 10 Euro pro Stunde.',
            },
            {
              key: 'e',
              label:
                'Ich helfe Ihnen gern beim Umzug: Kartons tragen und das Auto beladen. Ich habe am ' +
                'Freitagnachmittag Zeit. Das wird nicht lange dauern. Ich nehme 15 Euro pro Stunde.',
            },
            {
              key: 'f',
              label:
                'Jeden Mittwoch ist der offene Singabend im Gemeindehaus. Jeder darf einfach ' +
                'vorbeikommen und mitsingen, Erfahrung braucht man nicht. Am liebsten singen wir alte ' +
                'Volkslieder zusammen.',
            },
            { key: 'x', label: 'Keine Anzeige passt.' },
          ],
          texts: [
            {
              id: 's1',
              text: 'Deine Tochter möchte Klavier spielen lernen. Sie hat noch nie Unterricht gehabt.',
            },
            {
              id: 's2',
              text: 'Du ziehst nächste Woche um und brauchst Hilfe mit den Kartons.',
            },
            {
              id: 's3',
              text: 'Du singst gern und suchst eine Gruppe zum gemeinsamen Singen.',
            },
            {
              id: 's4',
              text:
                'Du möchtest dein Spanisch verbessern und dich einmal pro Woche mit einem ' +
                'Muttersprachler treffen.',
            },
            {
              id: 's5',
              text: 'Du suchst eine günstige Wohnung in der Nähe vom Bahnhof.',
            },
          ],
          answers: { s1: 'b', s2: 'e', s3: 'f', s4: 'c', s5: 'x' },
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
            'Deine Freundin Mia möchte auch mit dem Joggen anfangen. Schreib Mia eine SMS (20 bis 30 ' +
            'Wörter). Nenne diese drei Punkte: Wann joggst du normalerweise? Wo könnt ihr euch treffen? ' +
            'Was soll Mia mitbringen?',
          criteria: [
            'Du hast alle drei Punkte geschrieben: Zeit, Treffpunkt und Mitbringen.',
            'Du hast eine Anrede und einen Gruß geschrieben.',
            'Du benutzt die du-Form. Mia ist deine Freundin.',
            'Dein Text hat 20 bis 30 Wörter.',
            'Man versteht deinen Text ohne Probleme.',
          ],
        },
        {
          key: 'schreiben-2',
          type: 'writing',
          label: 'Teil 2 · E-Mail an die Physiotherapiepraxis',
          task:
            'Sie haben seit einer Woche Rückenschmerzen. Sie möchten einen Termin in der ' +
            'Physiotherapiepraxis. Schreiben Sie eine E-Mail (30 bis 40 Wörter). Nennen Sie diese drei ' +
            'Punkte: Seit wann haben Sie die Rückenschmerzen? Wann können Sie in die Praxis kommen? Was ' +
            'sollen Sie zum ersten Termin mitbringen?',
          criteria: [
            'Du hast alle drei Punkte geschrieben: Dauer, Termin und Mitbringen.',
            'Du hast eine Anrede und einen Gruß geschrieben.',
            'Du benutzt die Sie-Form. So schreibt man an eine Praxis.',
            'Dein Text hat 30 bis 40 Wörter.',
            'Man versteht deinen Text ohne Probleme.',
          ],
        },
      ],
    },
  ],
};
