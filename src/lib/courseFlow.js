// The sequencing logic of the course player, kept pure so the pages stay thin
// and tests/course-player.test.mjs can pin it without React.
//
// A course is the flat, ordered list of its program's items (week → day →
// item). An item is UNLOCKED when every item before it is done (lesson 1 is
// always unlocked); DONE when program_progress holds its id; CURRENT = the
// first unlocked item that is not done. Course complete = every item done.

export const flattenCourse = (course) => {
  const out = [];
  course.program.weeks.forEach((week, wi) => {
    week.days.forEach((day, di) => {
      day.items.forEach((item, ii) => {
        out.push({
          ...item,
          weekIndex: wi,
          weekTitle: week.title,
          dayIndex: di,
          dayLabel: day.label,
          indexInDay: ii,
          dayCount: day.items.length,
          position: out.length, // 0-based index in the whole course
        });
      });
    });
  });
  return out;
};

export const isUnlocked = (items, position, doneSet) => {
  for (let i = 0; i < position; i += 1) if (!doneSet.has(items[i].id)) return false;
  return true;
};

export const currentItem = (items, doneSet) => items.find((it) => !doneSet.has(it.id)) || null;

export const nextItem = (items, position) => items[position + 1] || null;
export const prevItem = (items, position) => items[position - 1] || null;

export const isComplete = (items, doneSet) => items.length > 0 && items.every((it) => doneSet.has(it.id));

export const percentDone = (items, doneSet) =>
  items.length ? Math.round((items.filter((it) => doneSet.has(it.id)).length / items.length) * 100) : 0;

// The "what to do" line per item type — the lesson screen's instruction. The
// programs carry titles and hrefs but no instruction text; this is the one
// place the player adds words.
export const INSTRUCTION = {
  lesson: 'Read the rule, work through the examples, then complete every exercise at the foot of the lesson. Come back and mark it done.',
  review: 'Repeat the linked lesson or list once more — this time without reading the rule first. Mark it done when the exercises are clean.',
  listening: 'Listen once without pausing, answer the questions, then listen again and check. Mark it done when you have submitted your answers.',
  reading: 'Read the text once for the gist, then answer the checks. Look up at most three words. Mark it done after the checks.',
  speaking: 'Open the speaking mission for this level and complete one full conversation with the coach. Mark it done after the feedback.',
  xray: 'Type the sentence into Sentence X-Ray, read the case colours, then write two sentences of your own with the same structure.',
  exam: 'Do this under exam conditions: timer on, no dictionary. Mark it done when you have your result.',
};

// Course context handed to the lesson screens (the same-origin sessionStorage
// key the SPA return bar and the Astro Layout bar both read).
//
// SHAPE: { level, code, itemId, title, position?, total?, returnTo?,
//          openPrompt?, openTeil?, hintWords?, anrede? }
//
// The last four carry a SPEAKING TASK across the hand-off. Four A1.1 Lektionen
// have `sprechen.open` without a `missionOrder`, so /speaking gets no
// &mission=… and used to receive nothing at all: the learner read a task on the
// lesson screen and landed on a generic speaking page (DaF review #4, MAJOR
// "missionOrder null / SpeakingStage"). They travel here so the speaking page
// can show the task the learner was just promised. `anrede` ('Sie' | 'du')
// carries the register the task implies — most A1.1 tasks are Sie-situations
// (a waiter, an official), but L8/L9/L12 are peer tasks (DaF review #5, MAJOR
// "the coach receives the task text but not the role/Anrede it implies").
//
// BACKWARD COMPATIBILITY: a context written before this existed (or by the
// course path, which saves no speaking task) has no openPrompt. Readers must
// cope, so readCourseContext normalises: openPrompt/openTeil are null when
// absent, hintWords is always an array, and anrede defaults to 'Sie'.
export const CTX_KEY = 'dm_course_ctx';

export const normalizeAnrede = (value) => (value === 'du' ? 'du' : 'Sie');

export const normalizeCourseContext = (ctx) => {
  if (!ctx || typeof ctx !== 'object') return null;
  return {
    ...ctx,
    openPrompt: ctx.openPrompt || null,
    openTeil: ctx.openTeil || null,
    hintWords: Array.isArray(ctx.hintWords) ? ctx.hintWords : [],
    anrede: normalizeAnrede(ctx.anrede),
  };
};

export const saveCourseContext = (ctx) => {
  try { sessionStorage.setItem(CTX_KEY, JSON.stringify(ctx)); } catch { /* storage blocked */ }
};
export const readCourseContext = () => {
  try { return normalizeCourseContext(JSON.parse(sessionStorage.getItem(CTX_KEY) || 'null')); } catch { return null; }
};
export const clearCourseContext = () => {
  try { sessionStorage.removeItem(CTX_KEY); } catch { /* storage blocked */ }
};

/** Course route helpers — the only place the /course/ URL shape is spelled. */
export const courseHome = (level) => `/course/${level}`;
export const courseLesson = (level, itemId) => `/course/${level}/${encodeURIComponent(itemId)}`;
export const courseComplete = (level) => `/course/${level}/complete`;
export const courseCertificate = (level) => `/course/${level}/certificate`;
