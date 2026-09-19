// A1.1 — the orientation layer for a lost first-time, English-speaking learner.
//
// `a11.js` is the course (German, the single source for every Lektion). This module is the
// English CHROME around it: what the course is, who the people in the dialogues are, what a
// Lektion asks of you, and how long it all takes. It never restates a fact the course does not
// already carry — every figure below is DERIVED from `CURRICULUM_A11` at module load (chapter
// grouping from the checkpoints, the cast from `dialog.lines[].speaker`, minutes from
// `lektion.minutes` and `curriculumPath()`), so a content edit in `a11.js` carries this file
// with it instead of leaving a stale number behind. The only hand-written parts are the
// English renderings, and `tests/course-meta.test.mjs` pins them to the German they render
// (same Lektion ids, same number of can-do lines, every cast name a real speaker).
//
// Language: the course home is an English document (docs language strategy) — the learner
// has not learned German yet, that is why they are here. Inside the quotes the German is the
// course's own wording; outside them the chrome is plain English. The course speaks Sie; the
// chrome speaks "you".
//
// Character facts come from the PERSONAS_A11 table in scripts/validate-curriculum.mjs (RULE 14
// grades dialogue lines against it): Ana is ledig, aus Marokko, Studentin, spricht Arabisch und
// Deutsch; Paul is Kellner; everybody else has no stated fact beyond their setting line. A role
// below may repeat a stated fact or the setting, never add one — "Lena is a nurse" would be a
// fact the course could later contradict.

import { CURRICULUM_A11 } from './a11.js';
import { curriculumPath } from './index.js';
import { SUSTAINABLE_PER_WEEK } from '../../lib/course/plan.js';

// ---------------------------------------------------------------------------
// Chapters — the checkpoints decide the grouping, this file only names it
// ---------------------------------------------------------------------------

/**
 * One entry per checkpoint, in order. The GROUPING (which Lektionen belong to which chapter) is
 * read off `curriculum.checkpoints[].afterLektion`; only the names and the one-line story are
 * authored here. If a fifth checkpoint ever appears, the fifth chapter gets a neutral fallback
 * title and the test suite says so.
 */
const CHAPTER_COPY = [
  {
    titleDe: 'Ankommen',
    titleEn: 'Arriving',
    storyEn: 'Ana arrives in Bremen, checks into a hostel, registers at the public office and shows Lena a photo of her family.',
  },
  {
    titleDe: 'Einkaufen und Dinge',
    titleEn: 'Shopping and things',
    storyEn: 'Tim buys furniture at the flea market, Lena and Tim sort out their course bags, and Ana starts her first day at the office.',
  },
  {
    titleDe: 'Alltag und Freizeit',
    titleEn: 'Everyday life and free time',
    storyEn: 'Lena and Tim compare hobbies, Ana and Lena make an appointment, and Ana orders in a café where Paul is the waiter.',
  },
  {
    titleDe: 'Unterwegs und Feiern',
    titleEn: 'Out and about, and celebrating',
    storyEn: 'Ana asks about her train at the station, Tim and Lena talk through a whole day, and Lena helps plan Ana’s birthday party.',
  },
];

/** [[1,2,3],[4,5,6],…] — every Lektion once, cut at each checkpoint. */
export function chapterGroups(curriculum) {
  const groups = [];
  let bucket = [];
  for (const node of curriculumPath(curriculum)) {
    if (node.kind === 'lektion') bucket.push(node.nr);
    if (node.kind === 'checkpoint' && bucket.length) {
      groups.push(bucket);
      bucket = [];
    }
  }
  if (bucket.length) groups.push(bucket);
  return groups;
}

const chapters = chapterGroups(CURRICULUM_A11).map((lektionen, i) => ({
  nr: i + 1,
  lektionen,
  titleDe: CHAPTER_COPY[i]?.titleDe ?? `Kapitel ${i + 1}`,
  titleEn: CHAPTER_COPY[i]?.titleEn ?? `Chapter ${i + 1}`,
  storyEn: CHAPTER_COPY[i]?.storyEn ?? `Lektion ${lektionen[0]} to ${lektionen[lektionen.length - 1]}.`,
}));

// ---------------------------------------------------------------------------
// Characters — who actually speaks, computed from the dialogues
// ---------------------------------------------------------------------------

/**
 * One line per person, consistent with PERSONAS_A11 (see the header). The list of WHO exists,
 * the first Lektion and the Lektionen each person appears in are not typed here: they are read
 * off `dialog.lines[].speaker` below, so a name with no dialogue line cannot end up on the
 * course home, and a new speaker in a11.js shows up with a neutral role until someone writes one.
 */
const CHARACTER_ROLES = {
  Ana: 'A student from Morocco, newly arrived in Bremen — the course follows her first weeks.',
  'Frau Kaya': 'Works at the reception of the hostel where Ana checks in.',
  'Herr Weber': 'From the public office (Bürgerbüro), where Ana registers and later starts work.',
  Lena: 'A learner in the same German course as Ana; her hobby is sport.',
  Tim: 'A learner in the same course, furnishing his room.',
  'Frau Wolf': 'Sells furniture at the flea market.',
  Paul: 'The waiter in the café.',
  'Herr Schmidt': 'Gives train information at the station.',
};

/** `{ name, roleEn, firstLektion, appearsIn }` for every distinct dialogue speaker, in order of first appearance. */
export function charactersOf(curriculum, roles = CHARACTER_ROLES) {
  const byName = new Map();
  for (const l of curriculum.lektionen) {
    for (const line of l.dialog?.lines ?? []) {
      const name = String(line.speaker || '').trim();
      if (!name) continue;
      const entry = byName.get(name) ?? { name, roleEn: roles[name] ?? `Appears in Lektion ${l.nr}.`, firstLektion: l.nr, appearsIn: [] };
      if (!entry.appearsIn.includes(l.nr)) entry.appearsIn.push(l.nr);
      byName.set(name, entry);
    }
  }
  return [...byName.values()].sort((a, b) => a.firstLektion - b.firstLektion || a.name.localeCompare(b.name));
}

const characters = charactersOf(CURRICULUM_A11);

// ---------------------------------------------------------------------------
// Per-Lektion intro — English situation line + a parallel rendering of the can-dos
// ---------------------------------------------------------------------------

/**
 * Keyed by Lektion id. `canDoEn[i]` renders `lektion.canDo[i]` — same length, same order, so a
 * component can show the two side by side. The German chunks inside „…“ are kept as the course
 * writes them: they are what the learner will actually say.
 */
const lektionIntro = {
  'a1.1-l01': {
    situationEn: 'Greeting people, introducing yourself and the alphabet',
    canDoEn: [
      'I can greet someone with „Guten Tag“ and say goodbye with „Auf Wiedersehen“.',
      'I can say what my name is.',
      'I can spell my name.',
      'I can ask how someone is and answer with „Mir geht es gut, danke“.',
    ],
  },
  'a1.1-l02': {
    situationEn: 'Personal details, your job and numbers',
    canDoEn: [
      'I can say where I come from and what my job is.',
      'I can ask what someone’s job is.',
      'I can understand and say the numbers from zero to ten.',
      'I can give my phone number and my address.',
      'I can give personal details in a short message.',
    ],
  },
  'a1.1-l03': {
    situationEn: 'Family and languages',
    canDoEn: [
      'I can talk about my family.',
      'I can say which languages I speak.',
      'I can ask someone about their family.',
      'I can say where my family comes from.',
    ],
  },
  'a1.1-l04': {
    situationEn: 'Shopping, furniture and prices',
    canDoEn: [
      'I can ask what something is and what it costs.',
      'I can ask for the price.',
      'I can understand prices up to one hundred euros.',
      'I can say what I am buying.',
    ],
  },
  'a1.1-l05': {
    situationEn: 'Objects and colours',
    canDoEn: [
      'I can name the objects in the classroom.',
      'I can ask where something is and answer with „hier“ or „da“.',
      'I can name colours.',
      'I can ask simple questions in class.',
    ],
  },
  'a1.1-l06': {
    situationEn: 'The office, technology and the telephone',
    canDoEn: [
      'I can say what I need.',
      'I can give my name on the phone.',
      'I can understand a telephone number and a mobile number.',
      'I can ask about the break and about the office.',
    ],
  },
  'a1.1-l07': {
    situationEn: 'Free time and hobbies',
    canDoEn: [
      'I can talk about my hobbies.',
      'I can say what I like doing.',
      'I can ask someone about their hobbies.',
      'I can say when I am free.',
    ],
  },
  'a1.1-l08': {
    situationEn: 'Appointments, the time of day and your daily routine',
    canDoEn: [
      'I can ask for the time and say what time it is.',
      'I can make an appointment.',
      'I can talk about my day.',
      'I can say when I have time.',
    ],
  },
  'a1.1-l09': {
    situationEn: 'Food and drink: ordering something (the invitation comes in Lektion 12)',
    canDoEn: [
      'I can order something in a café.',
      'I can say that I am hungry or thirsty.',
      'I can ask politely whether something is available.',
      'I can accept an offer or decline it politely.',
    ],
  },
  'a1.1-l10': {
    situationEn: 'Transport and travel',
    canDoEn: [
      'I can ask when the train leaves.',
      'I can ask what a ticket costs.',
      'I can understand announcements about departures and delays.',
      'I can say where I am travelling to.',
    ],
  },
  'a1.1-l11': {
    situationEn: 'Yesterday and today: your daily routine with aufstehen, einkaufen, anrufen',
    canDoEn: [
      'I can talk about my daily routine.',
      'I can say what I did yesterday, using two fixed expressions.',
      'I can arrange to go shopping with someone.',
      'I can say when I get up and when I work.',
    ],
  },
  'a1.1-l12': {
    situationEn: 'Celebrations and the past (as fixed chunks), plus revision',
    canDoEn: [
      'I can invite someone to a celebration.',
      'I can say in which month my birthday is.',
      'I can talk about my party and my guests.',
      'I can say goodbye with „Mach’s gut“ and „Bis bald“ and wish someone well.',
    ],
  },
};

// ---------------------------------------------------------------------------
// Outcomes — six lines, each quoting a can-do, not a promise
// ---------------------------------------------------------------------------

/**
 * Six "by the end of A1.1 you can …" lines. Each is one of the `canDoEn` lines above, chosen to
 * span the course (L1, L2, L4, L8, L9, L10) — so it is the course's own claim, in the course's own
 * words, and the test pins that every line is a can-do the course really teaches. Nothing here
 * about exams, jobs or how fast — outcome promises are banned across the course (a11.js header).
 */
const OUTCOME_SOURCES = [
  ['a1.1-l01', 0],
  ['a1.1-l02', 0],
  ['a1.1-l04', 0],
  ['a1.1-l08', 1],
  ['a1.1-l09', 0],
  ['a1.1-l10', 2],
];

const outcomesEn = OUTCOME_SOURCES.map(([id, i]) => {
  const line = lektionIntro[id].canDoEn[i];
  // "I can order something in a café." → "order something in a café"
  return line.replace(/^I can /, '').replace(/\.$/, '');
});

// ---------------------------------------------------------------------------
// Time — derived from the path, never typed
// ---------------------------------------------------------------------------

/**
 * How long the course takes at the pace `plan.js` calls sustainable.
 *
 * Every node of `curriculumPath()` (Lektion, checkpoint, final test) is one unit of work, exactly
 * as `planFor()` counts them, and carries its own minutes; SUSTAINABLE_PER_WEEK units a week gives
 * the number of weeks, and the total minutes spread over those weeks gives hours per week. No
 * hour figure is written anywhere in this file — `tests/claims.test.mjs` bans retyped figures for
 * a reason, and `tests/course-meta.test.mjs` proves this one moves when the minutes move.
 *
 * Note this is guided lesson time only: the spaced-review sessions and the linked listening,
 * reading and writing practice around each Lektion are extra, and the a11.js header says why they
 * must never be advertised as course content.
 *
 * @param {object} [curriculum]   defaults to CURRICULUM_A11
 * @param {number} [perWeek]      units per week; defaults to SUSTAINABLE_PER_WEEK
 */
export function weeklyEstimate(curriculum = CURRICULUM_A11, perWeek = SUSTAINABLE_PER_WEEK) {
  const path = curriculumPath(curriculum);
  const sum = (kind) => path.filter((n) => n.kind === kind).reduce((acc, n) => acc + (Number(n.minutes) || 0), 0);
  const lektionMinutes = sum('lektion');
  const checkpointMinutes = sum('checkpoint');
  const finalTestMinutes = sum('leveltest');
  const totalMinutes = lektionMinutes + checkpointMinutes + finalTestMinutes;
  const units = path.length;
  const pace = Math.max(1, Number(perWeek) || SUSTAINABLE_PER_WEEK);
  const weeks = Math.max(1, Math.ceil(units / pace));
  const minutesPerWeek = Math.round(totalMinutes / weeks);
  const hoursPerWeek = Math.round((minutesPerWeek / 60) * 10) / 10;
  const lektionen = path.filter((n) => n.kind === 'lektion');
  const minutesPerLektion = lektionen.length ? Math.round(lektionMinutes / lektionen.length) : 0;
  return {
    units,
    unitsPerWeek: pace,
    weeks,
    minutesPerWeek,
    hoursPerWeek,
    totalMinutes,
    lektionMinutes,
    checkpointMinutes,
    finalTestMinutes,
    minutesPerLektion,
  };
}

// ---------------------------------------------------------------------------
// How a Lektion works — the stages the player runs, in the order it runs them
// ---------------------------------------------------------------------------

/**
 * The stage keys are `buildLesson.js`'s (warmup, pretest, dialog, wortfeld, notice, practice,
 * dictation, speaking, writing, recap); the labels are the English names for the course home. The
 * warm-up appears only once review cards are due, and a Lektion without a listening or speaking
 * part skips that stage — the row shows the full shape, the player shows what this Lektion has.
 * `minutesPerLektion` comes from `lektion.minutes`, not from a typed number.
 */
const HOW_STEPS = [
  { key: 'warmup', label: 'Warm-up', descriptionEn: 'A few review cards that are due today.' },
  { key: 'pretest', label: 'Try first', descriptionEn: 'Guess before you learn; wrong is fine here.' },
  { key: 'dialog', label: 'Dialogue', descriptionEn: 'Listen to the situation, with English under each line.' },
  { key: 'wortfeld', label: 'Words', descriptionEn: 'The words of the situation, with article and audio.' },
  { key: 'notice', label: 'Rule', descriptionEn: 'One grammar point, explained in a short card.' },
  { key: 'practice', label: 'Practice', descriptionEn: 'Short typed and tapped exercises, checked instantly.' },
  { key: 'dictation', label: 'Listen', descriptionEn: 'Hear a line from the dialogue and write it down.' },
  { key: 'speaking', label: 'Speak', descriptionEn: 'Read a line aloud; the app scores your pronunciation.' },
  { key: 'writing', label: 'Write', descriptionEn: 'A short real-life text, checked by AI.' },
  { key: 'recap', label: 'Recap', descriptionEn: 'What you can do now, and what comes next.' },
];

const howItWorksEn = {
  minutesPerLektion: weeklyEstimate(CURRICULUM_A11).minutesPerLektion,
  steps: HOW_STEPS,
};

// ---------------------------------------------------------------------------

/** One paragraph, for the top of the course home. Content counts only, never usage counts. */
const aboutEn =
  `${CURRICULUM_A11.code} is the first half of level A1: ${CURRICULUM_A11.lektionen.length} short lessons ` +
  `(Lektionen), each built around one everyday situation — arriving, registering, shopping, making an ` +
  `appointment, ordering in a café — with the grammar as one step inside it. Every ${chapters[0]?.lektionen.length ?? 3} ` +
  `Lektionen a checkpoint shows you what stuck, and the course ends with a ${CURRICULUM_A11.examName} style ` +
  `final test. No account is needed to start; you sign up only if you want to save your progress.`;

export const A11_META = {
  level: CURRICULUM_A11.level,
  code: CURRICULUM_A11.code,
  aboutEn,
  chapters,
  characters,
  lektionIntro,
  outcomesEn,
  weeklyEstimate,
  howItWorksEn,
};

export default A11_META;
