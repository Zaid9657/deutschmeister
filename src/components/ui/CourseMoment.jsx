import { COURSE_MOMENT as lesson } from '../../data/courseMoment.js';

/** A static, labelled curriculum example; never a learner's progress. */
export default function CourseMoment() {
  return (
    <figure className="mt-6 overflow-hidden rounded-xl border border-rule bg-white text-ink" data-course-moment>
      <figcaption className="border-b border-rule px-5 py-3 font-data text-xs text-siegel-deep">A1.1 · Course preview · real content</figcaption>
      <div className="p-5">
        <p className="font-display text-2xl" lang="de">{lesson.title}</p>
        <p className="mt-3 text-sm leading-relaxed text-graphite">{lesson.promptEn}</p>
        <blockquote className="mt-4 rounded-lg border-l-2 border-siegel bg-siegel-wash p-4 text-xl" lang="de">{lesson.model}</blockquote>
        <p className="mt-3 text-xs text-graphite">Model answer · try your own in the free course.</p>
      </div>
    </figure>
  );
}
