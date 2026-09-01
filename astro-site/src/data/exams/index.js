// The exam-hub registry — the commercial/navigational layer of the exam-first
// IA (renovation Phase 3, docs/renovation-plan-2026-08-31.md).
//
// A hub (/pruefung/<slug>/) answers a different intent than its guide
// (/leitfaden/<slug>/): the guide explains the exam (informational); the hub
// maps a preparation path through DeutschMeister (navigational/commercial).
// Everything derivable is DERIVED, never retyped:
//   - identity from ../examTracks.js (the SPA-shared registry),
//   - exam facts (the definition answer, factsCheckedOn, sources) from the
//     sibling guide module — one source of truth for anything a Prüfungsamt
//     could disagree with,
//   - product counts from ../marketing.js.
// Only the per-exam positioning copy is authored here.
//
// Fact discipline is the guides' (see ../guides/index.js): no outcome
// promises, no fees, provenance rendered on the page.

import { EXAM_TRACKS } from '../examTracks.js';
import { telcB1 } from '../guides/telc-b1.js';
import { goetheB1 } from '../guides/goethe-b1.js';
import { dtz } from '../guides/dtz.js';
import { telcB2 } from '../guides/telc-b2.js';
import {
  GRAMMAR_TOPIC_COUNT,
  LISTENING_EXERCISE_COUNT,
  READING_LESSON_COUNT,
} from '../marketing.js';

const GUIDES_BY_SLUG = {
  'telc-b1': telcB1,
  'goethe-b1': goetheB1,
  dtz,
  'telc-b2': telcB2,
};

// Per-exam positioning copy — the only authored content in this module.
const HUB_COPY = {
  telc_b1: {
    title: 'telc B1 Vorbereitung online | DeutschMeister',
    description:
      'Online auf telc Deutsch B1 vorbereiten: Grammatik B1.1–B1.2, Hörtraining, Lesetexte, KI-Sprechtraining für die Paarprüfung — plus kostenloser Einstufungstest.',
    intro:
      'Die telc B1 Prüfung testet vier Fertigkeiten — und die meisten fallen nicht durch, weil ihnen Deutsch fehlt, sondern weil sie die falschen Dinge geübt haben. Hier ist der Weg durch DeutschMeister, der zu dieser Prüfung führt.',
    focus:
      'Das Format entscheidet: Die Sprachbausteine testen Grammatik im Kontext (genau das, was das Sentence X-Ray sichtbar macht), und die mündliche Prüfung ist eine Paarprüfung — freies Sprechen lässt sich nicht anlesen, nur üben.',
  },
  goethe_b1: {
    title: 'Goethe B1 Vorbereitung online | DeutschMeister',
    description:
      'Goethe-Zertifikat B1 online vorbereiten: modulweises Training für Lesen, Hören, Schreiben und Sprechen mit der DeutschMeister-Bibliothek — Einstufungstest kostenlos.',
    intro:
      'Das Goethe-Zertifikat B1 besteht aus vier einzeln ablegbaren Modulen — du kannst also gezielt das Modul trainieren, das dir fehlt. So deckst du jedes Modul mit DeutschMeister ab.',
    focus:
      'Die Modulstruktur ist deine Chance: Wer weiß, welches Modul wackelt, übt effizienter. Der Einstufungstest zeigt dir in 20 Minuten, wo du wirklich stehst.',
  },
  dtz: {
    title: 'DTZ Vorbereitung online | DeutschMeister',
    description:
      'DTZ (Deutsch-Test für Zuwanderer) online vorbereiten: Alltagsdeutsch A2–B1, Hörtraining mit Dialogen, Brieftraining und KI-Sprechen — Einstufungstest kostenlos.',
    intro:
      'Der DTZ prüft Alltagsdeutsch auf zwei Niveaus gleichzeitig (A2–B1) — dein Ergebnis hängt davon ab, wie stabil du auf B1 antwortest. Dieser Weg durch DeutschMeister zielt genau darauf.',
    focus:
      'Der DTZ belohnt Alltagsroutine: Ansagen verstehen, Briefe schreiben, über den eigenen Alltag sprechen. Genau diese Situationen enthalten die Hör-Dialoge und Sprechmissionen.',
  },
  telc_b2: {
    title: 'telc B2 Vorbereitung online | DeutschMeister',
    description:
      'telc Deutsch B2 online vorbereiten: B2-Grammatik, anspruchsvolle Hör- und Lesetexte und KI-Sprechtraining auf B2-Niveau — Einstufungstest kostenlos.',
    intro:
      'B2 ist der Sprung von „verständigen" zu „argumentieren". Die telc B2 Prüfung erwartet, dass du Positionen begründest und komplexe Texte verarbeitest — dieser Weg baut genau das auf.',
    focus:
      'Auf B2 entscheidet Präzision: Konnektoren, Nominalisierung, indirekte Rede. Die B2.1/B2.2-Grammatikthemen decken die Strukturen ab, auf die die Prüfer achten.',
  },
};

// The preparation path, derived from the track's library sublevels + counts.
// The two exam tools appear only where their content exists (hasMock /
// hasWriting on the shared registry, drift-pinned by tests/exams.test.mjs).
// Both are SPA routes behind a login — full-load links, no trailing slash.
function buildPath(track) {
  const levelLinks = track.sublevels
    .map((s) => `<a href="/grammar/${s}/">${s.toUpperCase()}</a>`)
    .join(' und ');
  return [
    {
      eyebrow: 'Schritt 1 · Einstufung',
      title: 'Wo stehst du wirklich?',
      body: 'Der kostenlose Einstufungstest (Schriftlich, Hören, Sprechen) zeigt dir dein Niveau in ~20 Minuten — bevor du auch nur eine Lektion lernst.',
      href: '/level-test/',
      linkLabel: 'Einstufungstest starten',
    },
    {
      eyebrow: 'Schritt 2 · Grammatik',
      title: `Die Strukturen auf ${track.level}`,
      body: `Die Grammatikthemen auf ${levelLinks} — jede Lektion mit Erklärung, Beispielen und Übungen (${GRAMMAR_TOPIC_COUNT} Themen insgesamt, A1.1–B2.2).`,
      href: `/grammar/${track.sublevels[0]}/`,
      linkLabel: 'Grammatik öffnen',
    },
    {
      eyebrow: 'Schritt 3 · Hören & Lesen',
      title: 'Das Ohr und das Auge trainieren',
      body: `${LISTENING_EXERCISE_COUNT} Hörübungen mit Muttersprachler-Dialogen und ${READING_LESSON_COUNT} Lesetexte, nach Niveau gestaffelt — täglich eine Einheit reicht.`,
      href: `/listening/${track.sublevels[0]}`,
      linkLabel: 'Hörtraining öffnen',
    },
    {
      eyebrow: 'Schritt 4 · Sprechen',
      title: 'Frei sprechen, bevor es zählt',
      body: 'Das KI-Sprechtraining simuliert Gesprächssituationen auf deinem Niveau und gibt sofort Feedback zu Grammatik und Ausdruck — der Teil, den die meisten zu spät üben.',
      href: '/speaking/',
      linkLabel: 'Sprechtraining öffnen',
    },
    ...(track.hasWriting
      ? [{
          eyebrow: 'Schritt 5 · Schreiben',
          title: 'Der Brief, den die Prüfung will',
          body: 'Schreib die Prüfungsaufgabe (Brief/E-Mail mit Leitpunkten) und die KI bewertet nach den vier Kriterien — Aufgabe, Aufbau, Korrektheit, Wortschatz — mit konkreten Korrekturen.',
          href: '/schreiben',
          linkLabel: 'Schreibtraining öffnen',
        }]
      : []),
    ...(track.hasMock
      ? [{
          eyebrow: 'Ernstfall-Check',
          title: 'Der Ernstfall vor dem Ernstfall',
          body: 'Ein Übungstest im Stil der Prüfung, mit Zeitlimit und automatischer Auswertung gegen die dokumentierte Bestehensgrenze — damit dein erster Testlauf nicht der Prüfungstag ist.',
          href: '/modelltest',
          linkLabel: 'Übungstest starten',
        }]
      : []),
    {
      eyebrow: 'Format verstehen',
      title: 'Die Prüfung selbst verstehen',
      body: 'Aufbau, Punkte, Bestehensgrenzen und die häufigsten Fehler — im kostenlosen Leitfaden, mit geprüften Fakten und Quellen.',
      href: `/leitfaden/${track.guideSlug}/`,
      linkLabel: 'Leitfaden lesen',
    },
  ];
}

export const EXAM_HUBS = EXAM_TRACKS.map((track) => {
  const guide = GUIDES_BY_SLUG[track.guideSlug];
  const copy = HUB_COPY[track.key];
  return {
    ...track,
    title: copy.title,
    description: copy.description,
    h1: `${track.nameDe}: Deine Vorbereitung mit DeutschMeister`,
    intro: copy.intro,
    focus: copy.focus,
    // Exam facts, from the guide — one source of truth.
    answer: guide.answer,
    factsCheckedOn: guide.factsCheckedOn,
    sources: guide.sources,
    path: buildPath(track),
  };
});

export const examHubUrl = (hub) => `https://deutsch-meister.de/pruefung/${hub.slug}/`;
