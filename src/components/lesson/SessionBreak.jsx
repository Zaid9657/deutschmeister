import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card.jsx';
import StageShell from './StageShell.jsx';
import { t, useLessonLang } from '../../lib/lesson/strings.js';

/**
 * Between the three parts of a Lektion (src/lib/lesson/sessions.js): what was just done, what comes
 * next, and a real choice — continue now, or stop here with the place saved. The run is already saved
 * at the next part's first stage, so stopping costs nothing.
 */
export default function SessionBreak({ done, total, level, onContinue }) {
  const [lang] = useLessonLang();
  return (
    <StageShell
      eyebrow={t('session.eyebrow', lang, { done, total })}
      title={t('session.title', lang)}
      lead={t(`session.next.${done + 1}`, lang)}
      primaryLabel={t('session.continue', lang, { next: done + 1 })}
      onPrimary={onContinue}
      secondary={(
        <Link to={`/course/${level}`} className="inline-flex min-h-11 items-center text-sm font-bold text-siegel-deep underline underline-offset-2 hover:text-ink">
          {t('session.later', lang)}
        </Link>
      )}
    >
      <Card tone="wash" className="p-5">
        <p className="flex items-center gap-2 text-[0.9375rem] font-bold text-ink">
          <Check className="h-5 w-5 text-siegel-deep" aria-hidden="true" /> {t('session.saved', lang)}
        </p>
      </Card>
    </StageShell>
  );
}
