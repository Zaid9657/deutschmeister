// Writing task bank — exam-style letter/email prompts, keyed by task_key.
//
// SYNCED COPY: this file exists twice with identical content —
//   src/data/writingTasks.js                     (the SPA renders tasks)
//   netlify/functions/_shared/writingTasks.mjs   (the grader validates keys
//                                                 and derives the rubric)
// scripts/check-duplicates.mjs compares the pair byte-for-byte, like the
// pricing/marketing twins. The function must never grade a client-supplied
// prompt — it looks the task up HERE by validated exam_key + task_key.
//
// Fact discipline: tasks are original material in the STYLE of each exam's
// documented letter formats (halbformell/formell, Leitpunkte) — never claimed
// to be official tasks. maxPoints mirrors nothing official; it is our rubric's
// scale and every result screen labels scores as Richtwert.

export const WRITING_TASKS = [
  {
    examKey: 'telc_b1',
    taskKey: 'beschwerde-lieferung',
    title: 'Beschwerde: Bestellung nicht angekommen',
    register: 'halbformell',
    minWords: 80,
    maxWords: 140,
    task:
      'Du hast in einem Online-Shop einen Rucksack bestellt und schon bezahlt. Nach zwei Wochen ist er immer noch nicht angekommen. ' +
      'Schreib an den Kundenservice.',
    leitpunkte: [
      'Beschreib das Problem (was, wann bestellt)',
      'Sag, was du schon versucht hast',
      'Fordere eine Lösung mit einer Frist',
    ],
  },
  {
    examKey: 'telc_b1',
    taskKey: 'einladung-absage',
    title: 'Einladung absagen und Alternative vorschlagen',
    register: 'informell',
    minWords: 80,
    maxWords: 140,
    task:
      'Eine Freundin hat dich zu ihrer Geburtstagsfeier am Samstag eingeladen, aber du kannst nicht kommen. ' +
      'Schreib ihr eine E-Mail.',
    leitpunkte: [
      'Bedank dich für die Einladung',
      'Erklär, warum du nicht kommen kannst',
      'Schlag ein alternatives Treffen vor',
    ],
  },
  {
    examKey: 'telc_b1',
    taskKey: 'anfrage-sprachkurs',
    title: 'Anfrage an eine Sprachschule',
    register: 'formell',
    minWords: 80,
    maxWords: 140,
    task:
      'Du möchtest einen Deutschkurs besuchen und hast eine Anzeige einer Sprachschule gesehen. ' +
      'Schreib an die Schule und stell Fragen.',
    leitpunkte: [
      'Stell dich kurz vor und nenn dein Niveau',
      'Frag nach Terminen und Preisen',
      'Frag, wie man sich anmelden kann',
    ],
  },
  {
    examKey: 'telc_b2',
    taskKey: 'beschwerde-kurs',
    title: 'Beschwerde über einen gebuchten Kurs',
    register: 'formell',
    minWords: 120,
    maxWords: 200,
    task:
      'Du hast einen teuren Wochenendkurs (Fotografie) gebucht. Der Kurs war schlecht organisiert: der Raum zu klein, ' +
      'die Hälfte der Zeit fiel aus, versprochenes Material fehlte. Schreib an den Veranstalter.',
    leitpunkte: [
      'Beschreib konkret, was nicht in Ordnung war',
      'Erklär, welche Erwartungen die Anzeige geweckt hatte',
      'Fordere eine angemessene Entschädigung und begründe sie',
    ],
  },
];

export const MAX_WRITING_POINTS = 20;

export const writingTasksForExam = (examKey) =>
  WRITING_TASKS.filter((t) => t.examKey === examKey);

export const writingTaskByKey = (examKey, taskKey) =>
  WRITING_TASKS.find((t) => t.examKey === examKey && t.taskKey === taskKey) || null;
