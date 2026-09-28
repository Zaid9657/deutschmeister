import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Flag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import { useV2Strings } from '../../components/course-v2/strings.js';
import { normalizeLevel, levelCode, plateauIdFor, v2Paths } from '../../lib/course-v2/ids.js';
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
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-2xl px-4 pb-32 pt-4 sm:pt-8">
        <Link to={v2Paths.home(level)} className="inline-flex min-h-11 items-center gap-1 font-data text-sm font-bold text-siegel hover:text-siegel-deep">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {levelCode(level)}
        </Link>
        <header className="mt-2">
          <Chip tone="label">{t('as.plateau', { n: nr })}</Chip>
          <h1 className="mt-3 flex items-center gap-2 font-display text-2xl text-ink">
            <Flag className="h-6 w-6 text-graphite" aria-hidden="true" /> {t('as.soonPlateau', { n: nr })}
          </h1>
          <p className="mt-2 text-sm text-graphite">{t('as.plateauLead')}</p>
          <p className="mt-2 text-sm text-graphite">{t('as.soonBody')}</p>
        </header>
        {units.length > 0 && (
          <Card className="mt-6 p-4">
            <h2 className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">{t('as.etappe')}</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {units.map((r) => (
                <li key={r.unit}>
                  {r.chunk
                    ? <Link to={v2Paths.unit(level, r.nr)} className="font-bold text-siegel hover:text-siegel-deep">{t('player.unit', { n: r.nr })}: {r.title}</Link>
                    : <span className="text-graphite">{t('player.unit', { n: r.nr })}{r.title ? `: ${r.title}` : ''}</span>}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
      <ActionBar>
        <Button size="lg" className="w-full" to={v2Paths.home(level)}>{t('player.home')}</Button>
      </ActionBar>
    </div>
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
      <div className="min-h-screen bg-paper font-body text-graphite">
        <p className="mx-auto max-w-2xl px-4 py-16 text-sm italic">{t('as.loading')}</p>
      </div>
    );
  }
  if (!info.plateau || !Array.isArray(info.plateau.examTeile)) return <Soon level={level} nr={nr} units={info.units} />;
  return <AssessmentPlayer key={info.plateau.id} level={level} doc={info.plateau} manifest={info.manifest} user={user} />;
}
