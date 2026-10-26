// Pure helpers for the telc B1 pilot's course page (src/pages/TelcB1KursPage.jsx).
// No React, no Supabase: the page loads the rows, these decide what they mean,
// and tests/telc-pilot.test.mjs pins every branch.
//
// Two questions, two rules:
//   gapPriorities — "where do I lose points?" Only MEASURED areas count. A test
//     section nobody answered (time ran out, the learner left) is unmeasured,
//     never "weakest": sending someone to practise Hören because they never
//     reached it would be a wrong diagnosis dressed up as a result.
//   pilotEvidence — "how far am I?" Counted from what the SERVER recorded where
//     it can be (writing_submissions, speaking_sessions); only the units come
//     from the learner's own checkboxes (program_progress).
import { telcB1Mock } from '../data/mockExams/telcB1.js';
import { attemptMock } from '../data/mockExams/forms.js';
import { GAP_TARGETS, EXAM_KEY, allDays, writeHref } from '../data/programs/telcB1Komplett.js';

const SECTION_KEYS = ['lesen', 'sprachbausteine', 'hoeren'];
const CRITERIA = ['task', 'structure', 'accuracy', 'vocabulary'];
/** Each writing criterion is scored 0–5 by evaluate-writing (MAX_WRITING_POINTS / 4). */
const CRITERION_MAX = 5;
const ORDER = [...SECTION_KEYS, ...CRITERIA];

const given = (v) => v !== undefined && v !== null && v !== '';

/** Did the learner answer at least one item of this mock section? */
export function sectionAnswered(section, answers = {}) {
  for (const part of section.parts || []) {
    if (part.type === 'matching' && part.texts.some((t) => given(answers[`${part.key}:${t.id}`]))) return true;
    if (part.type === 'mc-group' && part.items.some((it) => given(answers[it.id]))) return true;
    if (part.type === 'cloze' && part.gaps.some((g) => given(answers[g.id]))) return true;
    if (part.type === 'listening') {
      const prefix = `listening:${part.key}:`;
      if (Object.keys(answers).some((k) => k.startsWith(prefix) && given(answers[k]))) return true;
    }
  }
  return false;
}

/**
 * The learner's weakest measured areas, weakest first.
 * @param {object} input
 * @param {object|null} input.attempt  latest completed telc_b1 exam_attempts row
 *   ({ section_scores: { lesen: {score,max}, … }, answers })
 * @param {object|null} input.writing  latest telc_b1 writing_submissions row
 *   ({ task_key, feedback: { scores: { task, structure, accuracy, vocabulary } } })
 * @returns {Array<{key, source:'test'|'writing', ratio, label, href, external}>}
 */
export function gapPriorities({ attempt = null, writing = null, limit = 3 } = {}) {
  const gaps = [];

  const sectionScores = attempt?.section_scores || {};
  const answers = attempt?.answers || {};
  // The attempt's OWN form (day 1 = form 1, day 20 = form 2): "answered" is
  // judged against the items the learner actually saw.
  const mock = attemptMock(telcB1Mock, attempt);
  for (const key of SECTION_KEYS) {
    const s = sectionScores[key];
    const section = mock.sections.find((x) => x.key === key);
    if (!s || !section || !Number.isFinite(s.score) || !Number.isFinite(s.max) || s.max <= 0) continue;
    if (!sectionAnswered(section, answers)) continue; // unmeasured, never "weakest"
    const target = GAP_TARGETS[key];
    gaps.push({ key, source: 'test', ratio: s.score / s.max, label: target.label, href: target.href, external: Boolean(target.external) });
  }

  const scores = writing?.feedback?.scores || {};
  const ownLetter = writing?.task_key ? writeHref(writing.task_key, { revise: true }) : null;
  for (const key of CRITERIA) {
    const v = scores[key];
    if (!Number.isFinite(v)) continue;
    const target = GAP_TARGETS[key];
    const href = target.href || ownLetter;
    if (!href) continue;
    gaps.push({ key, source: 'writing', ratio: Math.max(0, Math.min(1, v / CRITERION_MAX)), label: target.label, href, external: Boolean(target.external) });
  }

  return gaps
    .filter((g) => g.ratio < 1) // a full score is not a gap
    .sort((a, b) => a.ratio - b.ratio || ORDER.indexOf(a.key) - ORDER.indexOf(b.key))
    .slice(0, limit);
}

const routeItems = () => allDays().flatMap((d) => d.items);

/** Is every item of this day ticked? A day is one Trainingseinheit. */
export const dayDone = (day, doneIds) => day.items.every((i) => doneIds.has(i.id));

/**
 * Progress against the route's own counts.
 * @param {object} input
 * @param {Set<string>} input.doneIds        program_progress item ids
 * @param {Array} input.writingRows          { exam_key, task_key } rows
 * @param {Array} input.speakingRows         { topic, status } rows
 */
export function pilotEvidence({ doneIds = new Set(), writingRows = [], speakingRows = [] } = {}) {
  const days = allDays();
  const items = routeItems();

  // A letter counts at most twice — the draft and the revision — so extra
  // attempts at one letter can never stand in for another letter.
  const letters = [...new Set(items.filter((i) => i.type === 'writing').map((i) => i.taskKey))];
  const perLetter = new Map();
  for (const row of writingRows) {
    if (row?.exam_key !== EXAM_KEY || !letters.includes(row.task_key)) continue;
    perLetter.set(row.task_key, (perLetter.get(row.task_key) || 0) + 1);
  }
  const corrections = letters.reduce((sum, key) => sum + Math.min(2, perLetter.get(key) || 0), 0);

  // A rehearsal counts once, by its own label (speaking_sessions.topic), and
  // only when the session got a learner turn ('completed'; 'cancelled' = none).
  const labels = new Set(items.filter((i) => i.type === 'speaking').map((i) => i.task.teil));
  const rehearsed = new Set(
    speakingRows.filter((r) => r?.status === 'completed' && labels.has(r.topic)).map((r) => r.topic),
  );

  return {
    units: { done: days.filter((d) => dayDone(d, doneIds)).length, total: days.length },
    corrections: { done: corrections, total: letters.length * 2 },
    rehearsals: { done: rehearsed.size, total: labels.size },
  };
}

/** The speaking-session topics of the route, for the course page's query. */
export const rehearsalTopics = () => routeItems().filter((i) => i.type === 'speaking').map((i) => i.task.teil);

/** How long the course page waits for its arrival writes before it opens the plan anyway. */
export const ARRIVAL_TIMEOUT_MS = 5000;

/**
 * Arrival on the course page: fill the two profile fields the gates read where
 * they are still empty, and settle within `timeoutMs` whatever the network does
 * — a stalled write must never keep the plan's links shut (Codex review 2 of
 * PR B). After a timeout or an error the worst case is the onboarding intro on
 * the next task page: a detour that still leads on, never a dead end.
 *
 * The writes stay in the page, with their column names literal, so
 * tests/db-columns.test.mjs can check them against the schema; each is one
 * update of the learner's own row filtered to that column being NULL.
 *
 * @param {object} input
 * @param {object|null} input.profile  the profile the app already loaded, or null.
 *   A field it shows as set is not written again; exam_track 'none' is the
 *   learner's "no exam" choice and counts as set.
 * @param {() => PromiseLike<{data, error}>} input.markOnboarded
 * @param {() => PromiseLike<{data, error}>} input.setExamTrack
 * @returns {Promise<{changed: boolean, timedOut: boolean, errors: string[]}>}
 */
export async function arrive({ profile = null, markOnboarded, setExamTrack, timeoutMs = ARRIVAL_TIMEOUT_MS } = {}) {
  const run = (write) => Promise.resolve().then(write).catch((error) => ({ data: null, error }));
  const writes = [];
  if (!profile?.onboarding_completed_at) writes.push(run(markOnboarded));
  if (profile?.exam_track == null) writes.push(run(setExamTrack));
  if (!writes.length) return { changed: false, timedOut: false, errors: [] };

  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(null), timeoutMs); });
  const results = await Promise.race([Promise.all(writes), timeout]).finally(() => clearTimeout(timer));
  if (!results) return { changed: false, timedOut: true, errors: [] };
  return {
    changed: results.some((r) => r?.data?.length > 0),
    timedOut: false,
    errors: results.filter((r) => r?.error).map((r) => r.error.message || String(r.error)),
  };
}
