// ─────────────────────────────────────────────────────────────────────────────
// writingTasks.goethe-a2.js — the four goethe_a2 task objects to append to
// WRITING_TASKS.
//
// SYNCED COPY WARNING (from the head of src/data/writingTasks.js): that file
// exists twice with identical content —
//   src/data/writingTasks.js                     (the SPA renders tasks)
//   netlify/functions/_shared/writingTasks.mjs   (the grader validates keys
//                                                 and derives the rubric)
// scripts/check-duplicates.mjs compares the pair byte-for-byte. Paste the block
// into BOTH, at the end of the array, after the goethe_a1 tasks — or the
// duplicate check fails and the grader rejects every goethe_a2 submission with
// an unknown task key.
//
// This unlocks `hasWriting: true` on the goethe_a2 exam track;
// tests/exams.test.mjs pins the flag against WRITING_TASKS, so the track entry
// and this block must land in the same commit.
//
// EXAM SHAPE (guides/goethe-a2.js carries the sourcing). Schreiben has two
// parts in 30 minutes and counts 25 of the exam's 100 points:
//   Teil 1 — kurze persönliche Nachricht (SMS), ca. 20–30 Wörter, 3 Leitpunkte
//   Teil 2 — halbformelle E-Mail,             ca. 30–40 Wörter, 3 Leitpunkte
// The word bands below are deliberately WIDER than the exam's (20–40 and
// 30–60): minWords/maxWords gate what the grader accepts, and a learner who
// writes 34 words for a 20–30-word task should get feedback, not a rejection.
// The task text itself states the exam's own band, which is what to aim for.
//
// pointsNote states the part's points and the pass rule exactly as verified in
// the guide (factsCheckedOn 2026-09-05) — never a fee, never an outcome promise.
//
// ROUND 2 (2026-09-06), after the adversarial review:
//   - "Teil 1 und Teil 2 zählen gleich viel" was DELETED from all four
//     pointsNotes. No source gives the Teil 1 : Teil 2 split for the Erwachsene
//     set, and the only split that surfaced anywhere (Fit in Deutsch 2) is
//     unequal. A figure that could not be found must be omitted, not softened.
//     What remains — 25 von 100, 45 von 75, 15 von 25 — is verified.
//   - Leitpunkte are now NOUN PHRASES, the register real Goethe A2 Leitpunkte
//     use ("Dank für die Einladung"), instead of imperatives addressed to the
//     learner. The reflexive-avoidance that forced the old wording still holds:
//     nominalising is what makes it read like the exam AND stay inside A2.1.
//   - `sms-treffen-verschieben` Leitpunkt 1 used to read "Sag Jonas: Der
//     Dienstag passt dir nicht". After the colon the sentence is addressed TO
//     Jonas, so "dir" means Jonas — following the instruction literally
//     produces the opposite of the intent.
//
// ROUND 3 (2026-09-06): that Leitpunkt is now "Absage für den Dienstag". The
// round-2 replacement quoted direct speech, which satisfied the no-pronoun rule
// but left one imperative among eleven noun phrases — reading as an oversight
// rather than a choice. The nominal form satisfies both rules at once. The
// colon/pronoun pin in verify.mjs still scans all four tasks, so it keeps
// guarding the class of defect even though no Leitpunkt now uses a colon.
//
// REGISTER DIVERGENCE, flagged for the PR D2 author: `email-termin-beim-amt`
// is `halbformell` because the brief mandates halbformell for Teil 2 and that
// is the exam's own label for it — but the shipped goethe_a1 bank labels a
// letter to an authority `formell` (see mitteilung-info-sprachkurs, addressed
// to a Volkshochschule). The SPA prints the register to the learner, so the two
// banks now describe a similar situation with two different words. Deliberate,
// not an oversight: the exam's label wins on an exam task. Revisit if D2
// unifies the register vocabulary across banks.
//
// LEVEL CONSTRAINT (S/wave4/level-a2.1.md is binding for this learner-facing
// German). Everything below is producible with A1 + A2.1 topics 1–12 only, and
// every sentence is ≤14 words. Deliberately avoided, because they are banned at
// A2.1: reflexive verbs (so "Melde dich an" and "Stell dich vor" are out — hence the
// nominal Leitpunkte below, e.g. "Frage nach den Terminen und der Anmeldung"
// and "Name und Niveau"), infinitive
// clauses with zu ("Bitte sie, die Blumen zu gießen"), dass-/weil-Nebensätze
// (the goethe_a1 tasks use them; these do not), Komparativ, Futur and Genitiv.
// Names are German-keyboard typeable.
// ─────────────────────────────────────────────────────────────────────────────

export const goetheA2WritingTasks = [
  // ---- Goethe-Zertifikat A2 ---------------------------------------------
  // ---- Teil 1: kurze persönliche Nachricht (SMS), 20–30 Wörter (2) -------
  {
    examKey: 'goethe_a2',
    taskKey: 'sms-einladung-absagen',
    title: 'SMS: Eine Einladung absagen',
    register: 'informell',
    minWords: 20,
    maxWords: 40,
    task:
      'Deine Freundin Nina hat dich zum Essen eingeladen. Du kannst am Samstag nicht kommen. ' +
      'Schreib Nina eine SMS. Schreib 20 bis 30 Wörter.',
    leitpunkte: [
      'Dank für die Einladung',
      'Grund für die Absage',
      'Vorschlag für einen neuen Termin',
    ],
    pointsNote:
      'Der Prüfungsteil Schreiben zählt 25 von 100 Punkten. ' +
      'Bestanden ist die Prüfung ab 60 von 100 Punkten. Dafür brauchst du mindestens 45 von 75 Punkten ' +
      'im schriftlichen Teil. Im Sprechen brauchst du mindestens 15 von 25 Punkten.',
  },
  {
    examKey: 'goethe_a2',
    taskKey: 'sms-treffen-verschieben',
    title: 'SMS: Einen neuen Tag vorschlagen',
    register: 'informell',
    minWords: 20,
    maxWords: 40,
    task:
      'Du hast am Dienstag einen Termin mit deinem Freund Jonas. Der Dienstag passt dir nicht mehr. ' +
      'Schreib Jonas eine SMS. Schreib 20 bis 30 Wörter.',
    leitpunkte: [
      'Absage für den Dienstag',
      'Vorschlag für einen neuen Tag',
      'Frage nach der Uhrzeit',
    ],
    pointsNote:
      'Der Prüfungsteil Schreiben zählt 25 von 100 Punkten. ' +
      'Bestanden ist die Prüfung ab 60 von 100 Punkten. Dafür brauchst du mindestens 45 von 75 Punkten ' +
      'im schriftlichen Teil. Im Sprechen brauchst du mindestens 15 von 25 Punkten.',
  },

  // ---- Teil 2: halbformelle E-Mail, 30–40 Wörter (2) ---------------------
  {
    examKey: 'goethe_a2',
    taskKey: 'email-kursanmeldung',
    title: 'E-Mail: Nach einem Deutschkurs fragen',
    register: 'halbformell',
    minWords: 30,
    maxWords: 60,
    task:
      'Du möchtest einen Deutschkurs an der Volkshochschule machen. Schreib eine E-Mail an die Volkshochschule. ' +
      'Schreib 30 bis 40 Wörter. Vergiss die Anrede und den Gruß nicht.',
    leitpunkte: [
      'Name und Niveau',
      'Frage nach einem Kurs für A2',
      'Frage nach den Terminen und der Anmeldung',
    ],
    pointsNote:
      'Der Prüfungsteil Schreiben zählt 25 von 100 Punkten. ' +
      'Bestanden ist die Prüfung ab 60 von 100 Punkten. Dafür brauchst du mindestens 45 von 75 Punkten ' +
      'im schriftlichen Teil. Im Sprechen brauchst du mindestens 15 von 25 Punkten.',
  },
  {
    examKey: 'goethe_a2',
    taskKey: 'email-termin-beim-amt',
    title: 'E-Mail: Einen Termin beim Amt ändern',
    register: 'halbformell',
    minWords: 30,
    maxWords: 60,
    task:
      'Du hast am Montag einen Termin beim Amt. Du kannst am Montag nicht kommen. ' +
      'Schreib eine E-Mail an das Amt. Schreib 30 bis 40 Wörter. Vergiss die Anrede und den Gruß nicht.',
    leitpunkte: [
      'Termin am Montag',
      'Absage und Grund',
      'Frage nach einem neuen Termin',
    ],
    pointsNote:
      'Der Prüfungsteil Schreiben zählt 25 von 100 Punkten. ' +
      'Bestanden ist die Prüfung ab 60 von 100 Punkten. Dafür brauchst du mindestens 45 von 75 Punkten ' +
      'im schriftlichen Teil. Im Sprechen brauchst du mindestens 15 von 25 Punkten.',
  },
];
