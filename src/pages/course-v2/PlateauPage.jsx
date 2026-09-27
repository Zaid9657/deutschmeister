import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Flag } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import { normalizeLevel, levelCode, plateauIdFor, v2Paths } from '../../lib/course-v2/ids.js';
import { loadPlateau, loadManifest } from '../../lib/course-v2/loaders.js';
import ActionBar from './ActionBar.jsx';

// The v2 Plateau: /course/:level/p/:nr (BLUEPRINT §5.2, §7.3 S8).
//
// The Plateau runner (review set · exam Teile in the Prüfungsmodus runner ·
// productive task · reward block) is not built yet (E1-3 owns the runner). Until
// then this page says what the Plateau is and that it comes soon — also when a
// compiled Plateau file already exists, because it cannot be played honestly
// without that runner. It never marks a Plateau as submitted.

export default function PlateauPage() {
  const { level: levelParam, nr: nrParam } = useParams();
  const level = normalizeLevel(levelParam);
  const nr = Number(nrParam);
  const id = plateauIdFor(level, nr);
  const [info, setInfo] = useState({ loading: true, plateau: null, units: [] });

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    Promise.all([loadPlateau(level, nr), loadManifest(level)]).then(([plateau, manifest]) => {
      if (cancelled) return;
      const etappe = ((manifest && manifest.etappen) || []).find((e) => e.closedBy === id);
      const rows = ((manifest && manifest.units) || []).filter((r) => r && etappe && (etappe.units || []).includes(r.unit));
      setInfo({ loading: false, plateau, units: rows });
    });
    return () => { cancelled = true; };
  }, [id, level, nr]);

  if (!id) return <Navigate to="/courses/" replace />;

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <div className="mx-auto max-w-2xl px-4 pb-32 pt-4 sm:pt-8">
        <Link to={v2Paths.home(level)} className="inline-flex min-h-11 items-center gap-1 font-data text-sm font-bold text-siegel hover:text-siegel-deep">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {levelCode(level)}
        </Link>
        <header className="mt-2">
          <Chip tone="label">Plateau {nr}</Chip>
          <h1 className="mt-3 flex items-center gap-2 font-display text-2xl text-ink">
            <Flag className="h-6 w-6 text-graphite" aria-hidden="true" /> Plateau {nr} kommt bald
          </h1>
          <p className="mt-2 text-sm text-graphite">
            Das Plateau schließt eine Etappe ab: eine Wiederholung aus den Lektionen der Etappe, Prüfungsteile im
            Prüfungsformat und eine Aufgabe zum Sprechen oder Schreiben. Es ist noch in Arbeit.
          </p>
        </header>
        {!info.loading && info.units.length > 0 && (
          <Card className="mt-6 p-4">
            <h2 className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">Diese Etappe</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {info.units.map((r) => (
                <li key={r.unit}>
                  {r.chunk
                    ? <Link to={v2Paths.unit(level, r.nr)} className="font-bold text-siegel hover:text-siegel-deep">Lektion {r.nr}: {r.title}</Link>
                    : <span className="text-graphite">Lektion {r.nr}{r.title ? `: ${r.title}` : ''}</span>}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
      <ActionBar>
        <Button size="lg" className="w-full" to={v2Paths.home(level)}>Zur Kursübersicht</Button>
      </ActionBar>
    </div>
  );
}
