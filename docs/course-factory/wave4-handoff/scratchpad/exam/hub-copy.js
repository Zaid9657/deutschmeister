// ─────────────────────────────────────────────────────────────────────────────
// hub-copy.js — the HUB_COPY.goethe_a2 block for
// astro-site/src/data/exams/index.js.
//
// Paste the object below into the HUB_COPY map in that file, keyed `goethe_a2`,
// directly after the `goethe_a1` entry so the map reads in the same order as
// EXAM_TRACKS. tests/exams.test.mjs greps the file source for `goethe_a2:` and
// fails the build if a track has no hub copy.
//
// WHAT BELONGS HERE AND WHAT DOES NOT. The exams module derives everything it
// can: identity from ../examTracks.js, the definition answer + factsCheckedOn +
// sources from the guide (guides/goethe-a2.js), product counts from
// ../marketing.js. HUB_COPY is the ONLY authored copy — four fields, positioning
// only. No minutes, no points, no pass mark: repeating an exam fact here would
// create a second place it can go stale, and the guide is the first.
//
// TRUTH BANS that apply to this file's text (tests/exams.test.mjs reads
// astro-site/src/data/exams/index.js and runs two regexes over it):
//   - no outcome promise — no wording that guarantees a pass;
//   - no official-material or affiliation claim — never present our practice
//     material as the exam provider's own, and never imply certification by
//     them. We prepare FOR the exam; we are not it.
// Note the scanner does not parse comments, so this note deliberately avoids
// quoting the banned phrases: a doc comment quoting one is a match.
// The copy below therefore names the exam and describes our own material only.
//
// The title is ≤60 characters so check-built-html.mjs does not flag it and the
// SERP does not truncate it.
//
// ROUND 2 (2026-09-06): `intro` and `focus` used to restate the pass mechanism
// ("wer eine der beiden verfehlt, hat die ganze Prüfung nicht bestanden") and
// the Paarprüfung format in words. That is the same staleness risk this
// header warns about, just spelled out instead of numbered — the guide is the
// one place those belong. Both now carry positioning only. `description` also
// adopts the house closing line every shipped hub uses ("Einstufungstest
// kostenlos."), which had drifted to "gratis".
// ─────────────────────────────────────────────────────────────────────────────

export const goetheA2HubCopy = {
  title: 'Goethe A2 Vorbereitung online | DeutschMeister',
  description:
    'Goethe-Zertifikat A2 online vorbereiten: A2.1- und A2.2-Grammatik, Hör- und Lesetraining, SMS und E-Mail üben, KI-Sprechtraining — Einstufungstest kostenlos.',
  intro:
    'Auf A2 reicht es nicht mehr, schriftlich gut zu sein: Zwei getrennte Hürden statt einer, und die zweite ist das Sprechen. Hier ist der Weg durch DeutschMeister, der zu dieser Prüfung führt.',
  focus:
    'Auf A2 entscheidet der Sprung von einzelnen Sätzen zu zusammenhängendem Alltagsdeutsch: Dativ, Wechselpräpositionen, Perfekt und Objektpronomen müssen sitzen, nicht nur wiedererkannt werden. Den Rest entscheidet freies Sprechen — der Teil, den man nicht anlesen kann.',
};

// ── The literal to paste, in the map's own formatting ────────────────────────
//
//   goethe_a2: {
//     title: 'Goethe A2 Vorbereitung online | DeutschMeister',
//     description:
//       'Goethe-Zertifikat A2 online vorbereiten: A2.1- und A2.2-Grammatik, Hör- und Lesetraining, SMS und E-Mail üben, KI-Sprechtraining — Einstufungstest kostenlos.',
//     intro:
//       'Auf A2 reicht es nicht mehr, schriftlich gut zu sein: Zwei getrennte Hürden statt einer, und die zweite ist das Sprechen. Hier ist der Weg durch DeutschMeister, der zu dieser Prüfung führt.',
//     focus:
//       'Auf A2 entscheidet der Sprung von einzelnen Sätzen zu zusammenhängendem Alltagsdeutsch: Dativ, Wechselpräpositionen, Perfekt und Objektpronomen müssen sitzen, nicht nur wiedererkannt werden. Den Rest entscheidet freies Sprechen — der Teil, den man nicht anlesen kann.',
//   },
//
// NOTE on the derived path (buildPath in exams/index.js): with hasWriting: true
// and hasMock: false, the goethe_a2 hub renders Einstufung → Grammatik →
// Hören & Lesen → Sprechen → Schreiben → Leitfaden, and NO Übungstest step.
// That is correct: there is no MOCK_EXAMS.goethe_a2 yet. buildPath also emits
// `/listening/${sublevels[0]}` without a trailing slash — a pre-existing shape
// in that file, untouched by this entry.
