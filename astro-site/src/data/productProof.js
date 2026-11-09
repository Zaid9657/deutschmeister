// Static demonstrations of real course screens, recomputed at build time.
// No AI grades, microphone recordings, customer results or invented progress.
import { curriculumFor, curriculumPath } from './curricula/index.js';
import { scoreWriting } from '../../../src/lib/lesson/writing.js';
import { alignTranscript } from '../../../src/lib/lesson/readaloud.js';
import { WRITING_TASKS } from '../../../src/data/writingTasks.js';

export function courseProof(level = 'a1.2') {
  const curriculum = curriculumFor(level);
  if (!curriculum) return null;
  const lesson = curriculum.lektionen[0];
  const writingLesson = curriculum.lektionen.find((l) => l.schreiben.kind === 'mitteilung');
  const writing = writingLesson.schreiben;
  const task = WRITING_TASKS.find((t) => t.taskKey === writing.taskKey);
  if (!task) throw new Error(`Missing proof task: ${writing.taskKey}`);
  const revision = writing.sample;
  const draft = revision.replace(/\s*Viele Grüße[\s\S]*$/, '');
  const expected = lesson.dialog.lines[lesson.sprechen.readAloud[0]].de;
  const transcript = expected.split(' ').slice(0, -1).join(' ');
  return {
    curriculum, lesson, path: curriculumPath(curriculum).slice(0, 4),
    writing: { lesson: writingLesson, task, draft, revision, before: scoreWriting(task, draft), after: scoreWriting(task, revision) },
    speaking: { expected, transcript, alignment: alignTranscript(expected, transcript), prompt: lesson.sprechen.open },
  };
}

export const examTask = (examKey) => WRITING_TASKS.find((task) => task.examKey === examKey);
