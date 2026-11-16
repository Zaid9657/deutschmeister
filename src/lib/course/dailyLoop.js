import { A11_META, lektionPartEstimate } from '../../data/curricula/a11.meta.js';
import { canDoLines, canDoList } from './canDo.js';
import { planFor } from './plan.js';

export const dailySupported = (curriculum, lesson = null) => curriculum?.level === A11_META.level
  && (!lesson || (lesson.flow === 'guided' && curriculum.lektionen.some((l) => l.id === lesson.id)));

// Local calendar arithmetic also works over a daylight-saving boundary.
export const dailyDay = (stamp) => {
  if (stamp == null) return null;
  const d = new Date(stamp);
  return Number.isNaN(d.getTime()) ? null : Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;
};
export const dailyText = {
  en: {
    date: 'Plan an exam date', today: 'Today', teacher: 'AI teacher', hello: 'Hello{name}.', first: 'We will start with your first sentence.',
    nextDay: 'Welcome back. Your next step is ready.', break: 'Welcome. Your place is kept for you.',
    saved: 'Your place in Lektion {nr} is saved. We will continue there.',
    finished: 'Yesterday you finished Lektion {nr}. Today we build on it.',
    reteach: 'Yesterday this goal needed another try: {goal} Today we start with it.',
    plan: 'Lektion {nr}, part {part} · about {lo}–{hi} min (estimate) · {due} review cards due.',
    planNoDue: 'Lektion {nr}, part {part} · about {lo}–{hi} min (estimate).',
    node: '{title} · about {minutes} min · {due} review cards due.',
    nodeNoDue: '{title} · about {minutes} min.',
    complete: 'Your course is complete. Your German is ready to practise again.',
    road: 'Day {day} · Lektion {nr} of {total}.',
    reachable: 'At the planned pace, this course fits before your exam: {n} steps a week.',
    closer: 'Finishing this course before your exam needs {n} steps a week. We can adjust the date together.',
    past: 'You can choose a new exam date. We will plan from here.',
    start: 'Start today', resume: 'Continue here', result: 'See your result',
    quick: 'You still can', quickLead: 'Start with something you have already shown.',
    shown: 'Today I can', practised: 'Today I practised',
    count: 'You can now do {n} things in German', list: 'See everything I can do',
    tomorrow: 'Tomorrow’s goal: “{goal}”', nextPart: 'Next time: part {part} of Lektion {nr}.',
    streak: '{n} learning days in a row. One rest day in every seven is welcome.',
    streakOne: 'Your first learning day. One rest day in every seven is welcome.',
    close: 'We will build on what you showed today. — {teacher}',
    pauseClose: 'Your place is saved. We will continue from here. — {teacher}',
  },
  de: {
    date: 'Prüfungstermin planen', today: 'Heute', teacher: 'KI-Lehrerin', hello: 'Guten Tag{name}.', first: 'Wir beginnen mit Ihrem ersten Satz.',
    nextDay: 'Willkommen zurück. Ihr nächster Schritt ist bereit.', break: 'Willkommen. Ihr Platz ist für Sie freigehalten.',
    saved: 'Ihr Platz in Lektion {nr} ist gespeichert. Dort machen wir weiter.',
    finished: 'Gestern haben Sie Lektion {nr} abgeschlossen. Heute bauen wir darauf auf.',
    reteach: 'Gestern brauchte dieses Ziel einen weiteren Versuch: {goal} Heute beginnen wir damit.',
    plan: 'Lektion {nr}, Teil {part} · etwa {lo}–{hi} Min. (Schätzung) · {due} Karten zur Wiederholung.',
    planNoDue: 'Lektion {nr}, Teil {part} · etwa {lo}–{hi} Min. (Schätzung).',
    node: '{title} · etwa {minutes} Min. · {due} Karten zur Wiederholung.',
    nodeNoDue: '{title} · etwa {minutes} Min.',
    complete: 'Ihr Kurs ist abgeschlossen. Ihr Deutsch können Sie weiter üben.',
    road: 'Tag {day} · Lektion {nr} von {total}.',
    reachable: 'Im geplanten Tempo passt dieser Kurs vor Ihre Prüfung: {n} Schritte pro Woche.',
    closer: 'Für diesen Kurs vor Ihrer Prüfung sind {n} Schritte pro Woche nötig. Wir können den Termin gemeinsam anpassen.',
    past: 'Sie können einen neuen Prüfungstermin wählen. Wir planen von hier aus weiter.',
    start: 'Heute starten', resume: 'Hier weitermachen', result: 'Zum Ergebnis',
    quick: 'Das können Sie noch', quickLead: 'Beginnen Sie mit etwas, das Sie schon gezeigt haben.',
    shown: 'Heute kann ich', practised: 'Heute habe ich geübt',
    count: 'Sie können jetzt {n} Dinge auf Deutsch', list: 'Alles ansehen, was ich kann',
    tomorrow: 'Ziel für morgen: „{goal}“', nextPart: 'Beim nächsten Mal: Teil {part} von Lektion {nr}.',
    streak: '{n} Lerntage in Folge. Ein Ruhetag in je sieben Tagen gehört dazu.',
    streakOne: 'Ihr erster Lerntag. Ein Ruhetag in je sieben Tagen gehört dazu.',
    close: 'Wir bauen darauf auf, was Sie heute gezeigt haben. — {teacher}',
    pauseClose: 'Ihr Platz ist gespeichert. Hier machen wir weiter. — {teacher}',
  },
};
export function dailyT(key, lang = 'en', vars = {}) {
  return (dailyText[lang === 'de' ? 'de' : 'en'][key] || '').replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
export const plainCanDo = (line) => line.replace(/^(?:Ich kann|I can)\s+/u, '').replace(/[.]$/, '');


/** Most recent evidence for each goal wins over an older run's help flag. */
export function yesterdayReteach(attempts, today = new Date()) {
  const latest = new Map();
  for (const a of [...attempts].filter((a) => a.stage === 'proof').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))) {
    const key = `${a.lektion_id}:${a.item_id}`;
    if (!latest.has(key)) latest.set(key, a);
  }
  return [...latest.values()].find((a) => a.correct === false && dailyDay(a.created_at) === dailyDay(today) - 1) || null;
}

/** No names or new learner facts are persisted. Attempts are the proof's FIRST-TRY evidence. */
export function dailyOpening({ curriculum, path, done = new Set(), rows = [], attempts = [], run = null, profile = null, signedIn = false, due = 0, today = new Date(), suffix = '' }) {
  if (!dailySupported(curriculum)) return null;
  const now = dailyDay(today);
  const valid = rows.filter((r) => dailyDay(r.completed_at) !== null);
  const stamps = [...valid.map((r) => r.completed_at), ...attempts.map((a) => a.created_at), run?.savedAt].filter((s) => dailyDay(s) !== null && dailyDay(s) <= now);
  const previous = stamps.filter((s) => dailyDay(s) < now).sort((a, b) => new Date(b) - new Date(a))[0];
  const yesterday = valid.find((r) => dailyDay(r.completed_at) === now - 1);
  const reteach = yesterdayReteach(attempts, today);
  const hardLesson = reteach && curriculum.lektionen.find((l) => l.id === reteach.lektion_id);
  const goalIndex = hardLesson?.proof?.tasks?.findIndex((_, i) => reteach.item_id === `proof-${hardLesson.id}-${i}`);
  const saved = run && !done.has(run.lektionId) ? curriculum.lektionen.find((l) => l.id === run.lektionId) : null;
  const node = saved ? { ...saved, kind: 'lektion' } : path.find((n) => !done.has(n.id));
  const lesson = node?.kind === 'lektion' ? curriculum.lektionen.find((l) => l.id === node.id) : null;
  const situation = hardLesson && goalIndex >= 0 ? 'reteach' : saved ? 'saved' : yesterday ? 'finished' : previous ? now - dailyDay(previous) === 1 ? 'nextDay' : 'break' : done.size ? 'nextDay' : 'first';
  const savedSet = saved?.guided?.sets?.find((set) => `set:${set.id}` === run?.stageKey);
  const part = !saved ? 1 : /^(speaking|writing|proof|requeue)/.test(run.stageKey) ? 3
    : /^(practice|derived|dictation|fluency)$/.test(run.stageKey) || (run.stageKey === 'notice' && !saved.guided?.noticeBeforeScene) || savedSet?.placement === 'part2' ? 2 : 1;
  const plan = planFor({ examDate: profile?.exam_date, today, path, doneIds: done });
  return { situation, name: signedIn ? String(profile?.full_name || profile?.name || '').trim() : '', nr: (saved || curriculum.lektionen.find((l) => l.id === yesterday?.lektion_id) || lesson)?.nr,
    goal: (lang) => hardLesson && goalIndex >= 0 ? canDoLines(hardLesson, lang)[hardLesson.proof.tasks[goalIndex].canDo] : '',
    plan, day: stamps.length ? now - Math.min(...stamps.map(dailyDay)) + 1 : 1,
    lessonNr: lesson?.nr || Math.min(curriculum.lektionen.length, curriculum.lektionen.filter((l) => done.has(l.id)).length + 1),
    // A count of zero is noise, above all on a learner's first day: say nothing about review then.
    planKey: lesson ? (due > 0 ? 'plan' : 'planNoDue') : node ? (due > 0 ? 'node' : 'nodeNoDue') : 'complete',
    planVars: lesson ? { nr: lesson.nr, part, ...lektionPartEstimate(lesson), due } : { title: node?.title, minutes: node?.minutes, due },
    href: !node ? `/course/${curriculum.level}/complete` : node.kind === 'lektion' ? `/course/${curriculum.level}/l/${node.nr}${suffix}` : node.kind === 'checkpoint' ? `/course/${curriculum.level}/checkpoint/${node.nr}${suffix}` : `/modelltest/${node.testSlug}${suffix}`,
    action: saved ? 'resume' : node ? 'start' : 'result',
  };
}
export const completedCanDos = (curriculum, done) => canDoList(curriculum, done).filter((c) => c.state !== 'open');

/** At a pause, scene checks support practice wording, never an unearned proof claim. */
export function pauseCanDos(lesson, attempts = [], proof = {}) {
  const indices = new Set();
  for (const [i, task] of (lesson.proof?.tasks || []).entries()) {
    if (proof.goals?.[i]?.passed) indices.add(task.canDo);
    const lines = task.reteach?.kind === 'dialog' ? task.reteach.indices || [] : [];
    for (const [n, chunk] of (lesson.guided?.chunks || []).entries()) {
      if (lines.some((line) => line >= chunk.from && line < chunk.to)
        && attempts.some((a) => a.stage === 'scene' && a.correct && a.itemId === `scene-${lesson.id}-${n + 1}`)) indices.add(task.canDo);
    }
  }
  return [...indices];
}
