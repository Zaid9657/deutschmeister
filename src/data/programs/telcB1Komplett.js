// The telc B1 pilot route — 20 Trainingseinheiten, one per study day, EXAM TASKS
// FIRST (docs/business-review-2026-10-11.md §4, docs/telc-pilot/README.md).
//
// The 2026-08-31 version of this file was a grammar-first library checklist with
// no writing task and no telc mock in the schedule — the review's weakest lever
// ("Likelihood: an exam name over a grammar-first checklist"). This route is the
// exam instead:
//   - the short telc test on day 1 and day 20 (a rehearsal, never "proof"):
//     day 20 is a second form with unseen items in the same shape;
//   - the three telc letters, each written, AI-corrected, revised and corrected
//     again — six corrections (/schreiben/telc-b1?task=…, then &revise=1);
//   - ten guided five-minute speaking rehearsals of the three telc Teile, handed
//     to /speaking with the exact task (courseFlow.js telcCourseContext);
//   - three gap days that open the learner's weakest measured area
//     (src/lib/telcPilot.js gapPriorities);
//   - one Satz-Röntgen day on the corrected sentences.
//
// FACTS come from astro-site/src/data/guides/telc-b1.js (factsCheckedOn there):
// the oral exam is a Paarprüfung in three parts — Kontaktaufnahme, Gespräch über
// ein Thema, gemeinsam planen; the letter types are Beschwerde, Antwort auf eine
// Einladung, Anfrage. Nothing here claims more.
//
// DERIVED, never retyped: the title (pricing.js), the letter tasks (the synced
// writing bank), the test minutes (the mock's own sections), the exam slug
// (examTracks.js). tests/telc-pilot.test.mjs pins the route's shape — and the
// counts that marketing copy will quote are recounted from THIS file there.
//
// The .js extensions matter: tests import this module under plain Node ESM.
import { COURSES } from '../pricing.js';
import { writingTasksForExam } from '../writingTasks.js';
import { telcB1Mock } from '../mockExams/telcB1.js';
import { examTrackByKey } from '../examTracks.js';

export const PROGRAM_KEY = 'telc_b1_komplett';
export const EXAM_KEY = 'telc_b1';
const SLUG = examTrackByKey(EXAM_KEY).slug; // 'telc-b1'

/** The speaking level the rehearsals run at (speaking-session ALLOWED_LEVELS). */
export const SPEAKING_LEVEL = 'b1.2';

// The short test in ONE sitting: Lesen + Sprachbausteine + Hören. Each section's
// deadline is kept on the server, so a test left half-way expires its next
// section — it cannot be split across days. Schreiben is skipped ("Test
// abschließen"): it is only a self-check there, and the letter is day 2, with an
// AI correction.
const TEST_SECTIONS = telcB1Mock.sections.filter((s) => s.key !== 'schreiben');
export const SHORT_TEST_MINUTES = TEST_SECTIONS.reduce((sum, s) => sum + s.minutes, 0);
const testHref = `/modelltest/${SLUG}`;

// Day 1 runs form 1 (the mock itself); day 20 runs form 2 — new items in the
// same shape (src/data/mockExams/telcB1Form2.js), so the before/after compare
// measures on unseen items instead of a replay. The form is fixed when the
// attempt starts (src/data/mockExams/forms.js).
const shortTest = (id, title, form = 1) => ({
  id,
  type: 'exam',
  title,
  form,
  minutes: SHORT_TEST_MINUTES,
  href: form === 1 ? testHref : `${testHref}?form=${form}`,
  note: `${TEST_SECTIONS.map((s) => s.title).join(', ')} am Stück. Den Schreibteil überspringen Sie mit „Test abschließen“ – den Brief schreiben Sie mit KI-Korrektur.`,
  minimum: `Wenig Zeit? Starten Sie den Test erst, wenn Sie ${SHORT_TEST_MINUTES} Minuten am Stück haben – die Uhr läuft pro Teil. Bis dahin können Sie den nächsten Tag vorziehen.`,
});

// The three telc letters, from the synced writing bank (the grader looks the
// task up by the same key, so the route can never point at a task it rejects).
const TASKS = writingTasksForExam(EXAM_KEY);
const taskByKey = (key) => {
  const task = TASKS.find((t) => t.taskKey === key);
  if (!task) throw new Error(`telcB1Komplett: no ${EXAM_KEY} writing task "${key}"`);
  return task;
};
export const writeHref = (taskKey, { revise = false } = {}) =>
  `/schreiben/${SLUG}?task=${encodeURIComponent(taskKey)}${revise ? '&revise=1' : ''}`;

const letter = (n, taskKey) => {
  const task = taskByKey(taskKey);
  return {
    draft: {
      id: `brief-${n}-entwurf`,
      type: 'writing',
      taskKey,
      title: `Brief ${n}: ${task.title} – schreiben und bewerten lassen`,
      minutes: 30,
      href: writeHref(taskKey),
      minimum: 'Wenig Zeit? Schreiben Sie den Brief in 20 Minuten ohne Wörterbuch und lassen Sie ihn bewerten – fertig ist besser als perfekt.',
    },
    revise: {
      id: `brief-${n}-ueberarbeitung`,
      type: 'revise',
      taskKey,
      title: `Brief ${n} überarbeiten: Korrekturen einarbeiten und neu bewerten lassen`,
      minutes: 20,
      href: writeHref(taskKey, { revise: true }),
      minimum: 'Wenig Zeit? Übernehmen Sie nur die Korrekturen und lassen Sie den Brief neu bewerten.',
    },
  };
};

const BRIEF_1 = letter(1, 'beschwerde-lieferung');
const BRIEF_2 = letter(2, 'einladung-absage');
const BRIEF_3 = letter(3, 'anfrage-sprachkurs');

// Ten rehearsals over the three Teile: Teil 1 ×3, Teil 2 ×4, Teil 3 ×3. The
// `teil` label travels to the speaking page and is stored on the session row
// (speaking_sessions.topic), so it names the exact rehearsal — that is how the
// course page counts them (src/lib/telcPilot.js). Prompt ≤ 300 characters, at
// most 8 hint words of ≤ 30 characters (COURSE_TASK_LIMITS, speakingAI.mjs);
// tests/telc-pilot.test.mjs round-trips every one through parseCourseTask.
const TEIL_COUNTS = { 1: 3, 2: 4, 3: 3 };
const seenPerTeil = { 1: 0, 2: 0, 3: 0 };
const rehearsal = (n, teil, theme, prompt, hintWords) => {
  seenPerTeil[teil] += 1;
  return {
    id: `sprechen-${n}`,
    type: 'speaking',
    title: `Sprechprobe ${n} · Teil ${teil}: ${theme}`,
    minutes: 5,
    level: SPEAKING_LEVEL,
    href: `/speaking/?level=${SPEAKING_LEVEL.toUpperCase()}`,
    task: {
      teil: `telc B1 · Teil ${teil} · Übung ${seenPerTeil[teil]}/${TEIL_COUNTS[teil]}`,
      prompt,
      hintWords,
    },
    minimum: 'Wenig Zeit? Fünf Minuten reichen – genau so lang ist eine Probe.',
  };
};

const R1 = rehearsal(1, 1, 'Kontaktaufnahme',
  'Teil 1, Kontaktaufnahme: Sie lernen Ihr Gegenüber kennen. Stellen Sie sich vor – Name, Herkunft, Wohnort, Arbeit, Familie, Sprachen, Freizeit – und stellen Sie ebenso viele Fragen. Reagieren Sie auf die Antworten.',
  ['Woher kommen Sie?', 'Was machen Sie beruflich?', 'Seit wann lernen Sie Deutsch?', 'In meiner Freizeit …', 'Das klingt interessant.']);
const R2 = rehearsal(2, 2, 'Reisen',
  'Teil 2, Gespräch über ein Thema: Reisen. Erzählen Sie, wie Sie am liebsten reisen. Berichten Sie von einer Reise, die Ihnen gefallen hat. Was finden Sie besser: Urlaub zu Hause oder im Ausland? Begründen Sie Ihre Meinung und fragen Sie Ihr Gegenüber nach seiner Meinung.',
  ['Ich reise am liebsten …', 'Meiner Meinung nach …', 'Einerseits …, andererseits …', 'Wie sehen Sie das?', 'Da stimme ich Ihnen zu.']);
const R3 = rehearsal(3, 3, 'eine Abschiedsfeier planen',
  'Teil 3, gemeinsam etwas planen: Eine Kollegin verlässt die Firma. Planen Sie eine kleine Abschiedsfeier: Wann und wo? Essen und Getränke? Ein Geschenk? Wer macht was? Machen Sie Vorschläge, reagieren Sie auf Ihr Gegenüber und einigen Sie sich.',
  ['Wie wäre es mit …?', 'Ich schlage vor, dass …', 'Gute Idee, aber …', 'Wer kümmert sich um …?', 'Dann machen wir es so.']);
const R4 = rehearsal(4, 1, 'Arbeit und Deutschlernen',
  'Teil 1, Kontaktaufnahme: Sie treffen Ihr Gegenüber zum ersten Mal. Sprechen Sie über Ihre Arbeit oder Ausbildung. Erzählen Sie, warum Sie Deutsch lernen und was Sie nach der Prüfung vorhaben. Stellen Sie Ihrem Gegenüber dazu Fragen.',
  ['Ich arbeite als …', 'Ich lerne Deutsch, weil …', 'Nach der Prüfung möchte ich …', 'Und wie ist das bei Ihnen?']);
const R5 = rehearsal(5, 2, 'Gesundheit',
  'Teil 2, Gespräch über ein Thema: Gesundheit. Was tun Sie für Ihre Gesundheit? Erzählen Sie von Ihren Erfahrungen mit Sport und Ernährung, sagen Sie Ihre Meinung und reagieren Sie auf die Meinung Ihres Gegenübers.',
  ['Für meine Gesundheit …', 'Ich achte darauf, dass …', 'Meiner Erfahrung nach …', 'Das sehe ich anders.']);
const R6 = rehearsal(6, 3, 'einen Kursausflug planen',
  'Teil 3, gemeinsam etwas planen: Ihr Deutschkurs macht am Samstag einen Ausflug. Planen Sie zusammen: Wohin? Wie kommen Sie hin? Was kostet es? Was tun Sie bei schlechtem Wetter? Machen Sie Vorschläge und einigen Sie sich.',
  ['Wir könnten …', 'Was halten Sie davon, wenn …?', 'Lieber … als …', 'Falls es regnet, …', 'Einverstanden.']);
const R7 = rehearsal(7, 2, 'Medien',
  'Teil 2, Gespräch über ein Thema: Medien. Wie nutzen Sie Handy, Internet und Fernsehen im Alltag? Erzählen Sie von Ihren Erfahrungen, sagen Sie Ihre Meinung – Sollten Kinder ein eigenes Handy haben? – und reagieren Sie auf Ihr Gegenüber.',
  ['Ich nutze vor allem …', 'Ein Vorteil ist, dass …', 'Ein Nachteil ist, dass …', 'Was meinen Sie dazu?']);
const R8 = rehearsal(8, 1, 'Generalprobe ohne Notizen',
  'Teil 1, Kontaktaufnahme: Üben Sie diesmal ohne Notizen. Stellen Sie sich vor, stellen Sie Ihrem Gegenüber Fragen und reagieren Sie auf die Antworten. Halten Sie das Gespräch gemeinsam in Gang.',
  ['Erzählen Sie mal: …', 'Ach, wirklich?', 'Das kenne ich auch.', 'Und was machen Sie gern?']);
const R9 = rehearsal(9, 2, 'Arbeit',
  'Teil 2, Gespräch über ein Thema: Arbeit. Erzählen Sie von Ihrer Arbeit oder Ihrem Wunschberuf. Sagen Sie Ihre Meinung – Homeoffice: Vorteil oder Nachteil? –, begründen Sie sie und gehen Sie auf Ihr Gegenüber ein.',
  ['In meinem Beruf …', 'Ich finde Homeoffice …', 'Deshalb …', 'Was meinen Sie dazu?']);
const R10 = rehearsal(10, 3, 'Generalprobe: eine Überraschung planen',
  'Teil 3, gemeinsam etwas planen – Generalprobe: Eine Freundin hat bald Geburtstag. Planen Sie eine Überraschung: Wann? Wo? Wer wird eingeladen? Was schenken Sie? Machen Sie Vorschläge, widersprechen Sie höflich und einigen Sie sich.',
  ['Wie fänden Sie es, wenn …?', 'Das passt leider nicht, weil …', 'Dann schlage ich vor, …', 'Gut, abgemacht.']);

// A gap day opens the learner's weakest MEASURED area (src/lib/telcPilot.js
// gapPriorities over the latest short test and the latest letter). Until there
// is a measurement, the fallback is the short test itself.
const gap = (n, title) => ({
  id: `luecke-${n}`,
  type: 'gap',
  title,
  minutes: 20,
  href: testHref,
  minimum: 'Wenig Zeit? Zehn Minuten an Ihrer größten Lücke reichen.',
});

// Where each measurable gap is practised. `external` = an Astro page (full page
// load, trailing slash); everything else is an SPA route. Letter criteria point
// back at the learner's own last letter (filled in by gapPriorities).
export const GAP_TARGETS = {
  lesen: { label: 'Leseverstehen: ein B1.2-Text mit Uhr', href: '/reading/b1.2' },
  sprachbausteine: { label: 'Sprachbausteine: die Grammatik von B1.2', href: '/grammar/b1.2/', external: true },
  hoeren: { label: 'Hörverstehen: B1.2-Dialoge', href: '/listening/b1.2' },
  task: { label: 'Schreiben: alle Leitpunkte abdecken' },
  structure: { label: 'Schreiben: Anrede, Gliederung und Schluss' },
  accuracy: { label: 'Korrektheit: Ihre korrigierten Sätze im Satz-Röntgen prüfen', href: '/analyze/' },
  vocabulary: { label: 'Wortschatz: Ausdrücke aus der Korrektur übernehmen' },
};

const XRAY = {
  id: 'satz-roentgen',
  type: 'xray',
  title: 'Satz-Röntgen: drei korrigierte Sätze aus Ihren Briefen prüfen',
  minutes: 15,
  href: '/analyze/',
  minimum: 'Wenig Zeit? Ein Satz reicht.',
};

const day = (n, items) => ({ id: `tag-${n}`, label: `Tag ${n}`, items });

export const PROGRAM = {
  key: PROGRAM_KEY,
  title: COURSES.telc_b1_komplett.name,
  subtitle: 'Ihr Plan bis zur telc-B1-Prüfung: 20 Trainingseinheiten, zuerst die Prüfungsaufgaben.',
  weeks: [
    {
      title: 'Woche 1 – Wo stehen Sie?',
      intro: 'Erst messen, dann üben: Der Kurztest zeigt Ihre Lücken, der erste Brief und die ersten Sprechproben zeigen, wie sich die Prüfung anfühlt.',
      days: [
        day(1, [shortTest('kurztest-1', 'Kurztest telc B1 unter Prüfungsbedingungen')]),
        day(2, [BRIEF_1.draft]),
        day(3, [R1]),
        day(4, [BRIEF_1.revise]),
        day(5, [R2, gap(1, 'Ihre größte Lücke aus dem Kurztest schließen')]),
      ],
    },
    {
      title: 'Woche 2 – Schreiben und Sprechen im Wechsel',
      intro: 'Der zweite Brief, das erste gemeinsame Planen – und eine Lücke, die Sie gezielt schließen.',
      days: [
        day(6, [BRIEF_2.draft]),
        day(7, [R3]),
        day(8, [BRIEF_2.revise]),
        day(9, [R4]),
        day(10, [R5, gap(2, 'Die nächste Lücke schließen')]),
      ],
    },
    {
      title: 'Woche 3 – Der dritte Brief',
      intro: 'Die Anfrage – die dritte typische Textsorte –, zwei Sprechproben zu neuen Themen und Ihre korrigierten Sätze im Satz-Röntgen.',
      days: [
        day(11, [BRIEF_3.draft]),
        day(12, [R6]),
        day(13, [BRIEF_3.revise]),
        day(14, [R7]),
        day(15, [XRAY]),
      ],
    },
    {
      title: 'Woche 4 – Prüfungswoche',
      intro: 'Generalproben ohne Notizen, die letzte Lücke – und ein zweiter Kurztest mit neuen Aufgaben im selben Format.',
      days: [
        day(16, [R8]),
        day(17, [R9]),
        day(18, [R10]),
        day(19, [gap(3, 'Die letzte Lücke vor der Prüfung schließen')]),
        day(20, [shortTest('kurztest-2', 'Kurztest 2 mit neuen Aufgaben – als Probe, nicht als Beweis', 2)]),
      ],
    },
  ],
};

/** Every day, in order: the units the plan counts ("20 Trainingseinheiten"). */
export const allDays = () => PROGRAM.weeks.flatMap((w) => w.days);

/** Flat list of every item id, for progress accounting (program_progress.item_id). */
export const allItemIds = () => allDays().flatMap((d) => d.items.map((i) => i.id));

/** Extras outside the 20 units: no progress, no count in the plan. */
export const BONUSES = [
  {
    id: 'pruefungstag',
    title: 'Prüfungstag ohne Sucherei',
    lines: [
      'Was Sie mitbringen müssen, steht in der Einladung Ihres Prüfungszentrums – legen Sie es am Abend vorher bereit.',
      'Planen Sie den Weg mit Puffer und seien Sie früh da.',
      'Die mündliche Prüfung ist eine Paarprüfung: Sie sprechen mit einer anderen Person, die Prüfenden hören zu.',
      'Teile, Dauer und Bewertung stehen im kostenlosen telc-B1-Leitfaden.',
    ],
    link: { label: 'Zum telc-B1-Leitfaden', href: '/leitfaden/telc-b1/', external: true },
  },
  {
    id: 'paarpruefung',
    title: 'Paarprüfung üben – die zehn Aufgaben zum Mitnehmen',
    lead: 'Üben Sie dieselben Aufgaben auch mit einer echten Person: Lesen Sie die Aufgabe vor, sprechen Sie fünf Minuten, tauschen Sie die Rollen.',
    // Derived from the rehearsals above — one list, never a second copy.
    prompts: [R1, R2, R3, R4, R5, R6, R7, R8, R9, R10].map((r) => ({ teil: r.task.teil, prompt: r.task.prompt })),
  },
];
