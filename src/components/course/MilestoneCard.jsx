import { useState } from 'react';
import { Flame } from 'lucide-react';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import { safeGet, safeSet } from '../../utils/safeStorage.js';
import { t, useLessonLang } from '../../lib/lesson/strings.js';
import { MILESTONES, milestoneFor } from '../../lib/course/milestones.js';

export { MILESTONES, milestoneFor };

const seenKey = (n) => `dm_milestone_${n}`;

/** Read which milestones this browser has already dismissed/shown. */
function readSeen() {
  const seen = new Set();
  for (const n of MILESTONES) {
    if (safeGet(seenKey(n)) === '1') seen.add(n);
  }
  return seen;
}

function markSeen(n) {
  safeSet(seenKey(n), '1');
}

/**
 * Dismissible card for the course home. Renders nothing when no milestone is
 * due. `celebrate` Button variant only on day 30 (design-tokens.js rule 2:
 * celebrate is for the one moment a completed goal has earned it).
 */
export default function MilestoneCard({ streak }) {
  const [lang] = useLessonLang();
  const [dismissed, setDismissed] = useState(false);
  const due = dismissed ? null : milestoneFor(streak, readSeen());
  if (!due) return null;

  const key = due === 1 ? 'day1' : due === 7 ? 'day7' : 'day30';
  const dismiss = () => { markSeen(due); setDismissed(true); };

  return (
    <Card raised edge={due === 30 ? 'himbeer' : 'siegel'} className="mt-4 flex items-start gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-siegel-wash text-siegel">
        <Flame className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[1.0625rem] font-semibold text-ink">{t(`milestone.${key}.title`, lang)}</p>
        <p className="mt-0.5 text-[0.875rem] text-graphite">{t(`milestone.${key}.body`, lang)}</p>
      </div>
      <Button
        variant={due === 30 ? 'celebrate' : 'ghost'}
        size="sm"
        onClick={dismiss}
        aria-label={t('milestone.dismiss', lang)}
      >
        {t('milestone.dismiss', lang)}
      </Button>
    </Card>
  );
}
