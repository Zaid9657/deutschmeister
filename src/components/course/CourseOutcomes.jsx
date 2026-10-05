import { CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card.jsx';
import SupportText from '../lesson/SupportText.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { supportKeys } from '../../lib/lesson/support.js';

// "By the end of A1.1 you can …" — the outcomes panel, on its own so the
// course home, the welcome screen and (later) the level-complete page render
// one panel. The lines come from `A11_META.outcomesEn`, which quotes the
// course's own can-dos; nothing here is copy of its own, so nothing here can
// promise more than the course teaches (outcome promises are banned across
// the course — a11.js header).
//
// Reference material: flat card, hairline rule, no shadow (tokens rule 3).

export default function CourseOutcomes({ code = 'A1.1', level = null, outcomes = [], className = '' }) {
  const [lang] = useLessonLang();
  if (!outcomes.length) return null;
  return (
    <Card as="section" aria-labelledby="dm-course-outcomes" className={`p-5 ${className}`.trim()}>
      <p className="font-data text-[0.625rem] font-bold uppercase tracking-[0.13em] text-graphite">{t('outcomes.eyebrow', lang)}</p>
      <h2 id="dm-course-outcomes" className="mt-1 font-display text-xl font-semibold leading-tight text-ink">
        {t('outcomes.title', lang, { code })}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {outcomes.map((line, i) => (
          <li key={line} className="flex items-start gap-2.5 text-[0.9375rem] leading-relaxed text-ink">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-siegel" aria-hidden="true" />
            <SupportText level={level} k={supportKeys.outcome(i)} en={line} />
          </li>
        ))}
      </ul>
      <p className="mt-4 font-data text-[0.6875rem] text-graphite">
        {t('outcomes.note', lang)}
      </p>
    </Card>
  );
}
