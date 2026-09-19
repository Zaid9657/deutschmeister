import { CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card.jsx';

// "By the end of A1.1 you can …" — the outcomes panel, on its own so the
// course home, the welcome screen and (later) the level-complete page render
// one panel. The lines come from `A11_META.outcomesEn`, which quotes the
// course's own can-dos; nothing here is copy of its own, so nothing here can
// promise more than the course teaches (outcome promises are banned across
// the course — a11.js header).
//
// Reference material: flat card, hairline rule, no shadow (tokens rule 3).

export default function CourseOutcomes({ code = 'A1.1', outcomes = [], className = '' }) {
  if (!outcomes.length) return null;
  return (
    <Card as="section" aria-labelledby="dm-course-outcomes" className={`p-5 ${className}`.trim()}>
      <p className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite">What you will be able to do</p>
      <h2 id="dm-course-outcomes" className="mt-1 font-display text-xl font-semibold leading-tight text-ink">
        By the end of {code} you can …
      </h2>
      <ul className="mt-4 space-y-2.5">
        {outcomes.map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-ink">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-siegel" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-data text-[0.6875rem] text-graphite">
        Each line is one of the course’s own „Ich kann …“ goals, following the Goethe A1 can-do descriptions.
      </p>
    </Card>
  );
}
