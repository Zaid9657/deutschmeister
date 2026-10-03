import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Flag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CourseTheme from '../../components/course-v2/CourseTheme.jsx';
import GameButton from '../../components/course-v2/GameButton.jsx';
import GameTopBar from '../../components/course-v2/GameTopBar.jsx';
import { useV2Strings } from '../../components/course-v2/strings.js';
import { normalizeLevel, bandOf, v2Paths } from '../../lib/course-v2/ids.js';
import { closingIdFor } from '../../lib/course-v2/assessment.js';
import { fetchLearnerGoal } from '../../lib/course-v2/progress.js';
import { loadClosing, loadManifest } from '../../lib/course-v2/loaders.js';
import ActionBar from './ActionBar.jsx';
import AssessmentPlayer from './AssessmentPlayer.jsx';

// The v2 closing block: /course/:level/abschluss (BLUEPRINT §5.3, §7.3 S10).
//
// For a .1 course it is the Halbtest (the SCHEMA kind; the learner reads „Abschlusstest", as on the
// path — strings.js as.halbtest) of the learner's lane (completion.js closingFormFor:
// the learner_goals lane, else the primary lane), every Teil in the Lernmodus of A1.1, ending
// in the Teil-Karte — per Teil what was practised and where it comes next in the .2 course
// (the compiler's `comesNext`, from the .2 level's units or specs.json). Never a total, never a
// pass line. Submitting it (every Teil finished) is the third requirement of course completion.
// A .2 course's closing block (Modelltest A) has no v2 runner yet: the page says it comes soon.

function Soon({ level }) {
  const [, t] = useV2Strings();
  return (
    <CourseTheme>
      <div className="mx-auto max-w-2xl px-4 pb-32">
        <GameTopBar homeTo={v2Paths.home(level)} homeLabel={t('player.home')} progress={0} progressLabel={t('as.progress')} />
        <header>
          <p className="text-[0.8125rem] font-extrabold uppercase tracking-[0.08em] text-game-muted">{t('as.closingChip')}</p>
          <h1 className="mt-1 flex items-center gap-2 text-[1.625rem] font-extrabold leading-tight text-game-text">
            <Flag className="h-6 w-6 shrink-0 text-game-muted" aria-hidden="true" /> {t('as.soonClosing')}
          </h1>
          <p className="mt-2 text-[1rem] font-semibold text-game-muted">{t('as.soonBody')}</p>
        </header>
      </div>
      <ActionBar>
        <GameButton to={v2Paths.home(level)}>{t('player.home')}</GameButton>
      </ActionBar>
    </CourseTheme>
  );
}

export default function ClosingPage() {
  const { level: levelParam } = useParams();
  const level = normalizeLevel(levelParam);
  const { user, loading: authLoading } = useAuth();
  const [, t] = useV2Strings();
  const [info, setInfo] = useState({ loading: true, doc: null, manifest: null });

  useEffect(() => {
    if (!level || authLoading) return undefined;
    let cancelled = false;
    setInfo({ loading: true, doc: null, manifest: null });
    Promise.all([loadManifest(level), user ? fetchLearnerGoal(user.id, bandOf(level)) : Promise.resolve(null)])
      .then(([manifest, goal]) => {
        const id = closingIdFor(manifest, goal && goal.lane);
        return Promise.all([manifest, id ? loadClosing(level, id) : null]);
      })
      .then(([manifest, doc]) => { if (!cancelled) setInfo({ loading: false, doc, manifest }); })
      .catch((err) => {
        console.error('[course-v2] closing load failed:', err && err.message);
        if (!cancelled) setInfo({ loading: false, doc: null, manifest: null });
      });
    return () => { cancelled = true; };
  }, [level, user, authLoading]);

  if (!level) return <Navigate to="/courses/" replace />;
  if (info.loading || authLoading) {
    return (
      <CourseTheme>
        <p className="mx-auto max-w-2xl px-4 py-16 text-center text-[1rem] font-semibold text-game-muted">{t('as.loading')}</p>
      </CourseTheme>
    );
  }
  if (!info.doc || !Array.isArray(info.doc.parts)) return <Soon level={level} />;
  return <AssessmentPlayer key={info.doc.id} level={level} doc={info.doc} manifest={info.manifest} user={user} />;
}
