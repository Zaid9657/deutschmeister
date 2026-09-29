import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Flag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CourseTheme from '../../components/course-v2/CourseTheme.jsx';
import GameButton from '../../components/course-v2/GameButton.jsx';
import GameTopBar from '../../components/course-v2/GameTopBar.jsx';
import { useV2Strings } from '../../components/course-v2/strings.js';
import { normalizeLevel, plateauIdFor, v2Paths } from '../../lib/course-v2/ids.js';
import { loadPlateau, loadManifest } from '../../lib/course-v2/loaders.js';
import ActionBar from './ActionBar.jsx';
import AssessmentPlayer from './AssessmentPlayer.jsx';

// The v2 Plateau: /course/:level/p/:nr (BLUEPRINT §5.2, §7.3 S8).
//
// A compiled Plateau (src/data/course-v2/<level>/plateaus/pN.json) is played by
// AssessmentPlayer: the review set the compiler drew from the unit reserves, one exam Teil
// per module, the productive task, the reward block, then the results card. The Plateau is
// submitted — lesson_progress 'complete' under its id, which completion.js counts toward the
// course — once every required part is finished. Without a compiled file the page says what
// the Plateau is and that it comes soon, and lists the Etappe's units.

function Soon({ level, nr, units }) {
  const [, t] = useV2Strings();
  return (
    <CourseTheme>
      <div className="mx-auto max-w-2xl px-4 pb-32">
        <GameTopBar homeTo={v2Paths.home(level)} homeLabel={t('player.home')} progress={0} progressLabel={t('as.progress')} />
        <header>
          <p className="text-[0.8125rem] font-extrabold uppercase tracking-[0.08em] text-game-muted">{t('as.plateau', { n: nr })}</p>
          <h1 className="mt-1 flex items-center gap-2 text-[1.625rem] font-extrabold leading-tight text-game-text">
            <Flag className="h-6 w-6 shrink-0 text-game-muted" aria-hidden="true" /> {t('as.soonPlateau', { n: nr })}
          </h1>
          <p className="mt-2 text-[1rem] font-semibold text-game-muted">{t('as.plateauLead')}</p>
          <p className="mt-2 text-[1rem] font-semibold text-game-muted">{t('as.soonBody')}</p>
        </header>
        {units.length > 0 && (
          <div className="mt-6 rounded-[1.25rem] border-2 border-b-4 border-game-line bg-white p-4">
            <h2 className="text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-game-muted">{t('as.etappe')}</h2>
            <ul className="mt-2 space-y-1 text-[1rem]">
              {units.map((r) => (
                <li key={r.unit}>
                  {r.chunk
                    ? <Link to={v2Paths.unit(level, r.nr)} className="inline-flex min-h-11 items-center font-extrabold text-course-ink hover:underline">{t('player.unit', { n: r.nr })}: {r.title}</Link>
                    : <span className="inline-flex min-h-11 items-center font-semibold text-game-muted">{t('player.unit', { n: r.nr })}{r.title ? `: ${r.title}` : ''}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <ActionBar>
        <GameButton to={v2Paths.home(level)}>{t('player.home')}</GameButton>
      </ActionBar>
    </CourseTheme>
  );
}

export default function PlateauPage() {
  const { level: levelParam, nr: nrParam } = useParams();
  const level = normalizeLevel(levelParam);
  const nr = Number(nrParam);
  const id = plateauIdFor(level, nr);
  const { user, loading: authLoading } = useAuth();
  const [, t] = useV2Strings();
  const [info, setInfo] = useState({ loading: true, plateau: null, manifest: null, units: [] });

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    setInfo({ loading: true, plateau: null, manifest: null, units: [] });
    Promise.all([loadPlateau(level, nr), loadManifest(level)]).then(([plateau, manifest]) => {
      if (cancelled) return;
      const etappe = ((manifest && manifest.etappen) || []).find((e) => e.closedBy === id);
      const rows = ((manifest && manifest.units) || []).filter((r) => r && etappe && (etappe.units || []).includes(r.unit));
      setInfo({ loading: false, plateau, manifest, units: rows });
    });
    return () => { cancelled = true; };
  }, [id, level, nr]);

  if (!id) return <Navigate to="/courses/" replace />;
  if (info.loading || authLoading) {
    return (
      <CourseTheme>
        <p className="mx-auto max-w-2xl px-4 py-16 text-center text-[1rem] font-semibold text-game-muted">{t('as.loading')}</p>
      </CourseTheme>
    );
  }
  if (!info.plateau || !Array.isArray(info.plateau.examTeile)) return <Soon level={level} nr={nr} units={info.units} />;
  return <AssessmentPlayer key={info.plateau.id} level={level} doc={info.plateau} manifest={info.manifest} user={user} />;
}
