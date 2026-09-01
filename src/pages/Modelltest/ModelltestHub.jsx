import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { EXAM_TRACKS, MOCK_DISCLAIMER_DE } from '../../data/examTracks';
import { MOCK_EXAMS } from '../../data/mockExams';
import SEO from '../../components/SEO';

// /modelltest — which practice exams exist. Auth-gated (SubscriptionGuard in
// App.jsx); noindex like every app screen behind the shell.
const ModelltestHub = () => {
  const tracksWithMocks = EXAM_TRACKS.filter((t) => MOCK_EXAMS[t.key]);
  const tracksComing = EXAM_TRACKS.filter((t) => !MOCK_EXAMS[t.key]);

  return (
    <div className="min-h-screen bg-paper pt-24 pb-12 px-4">
      <SEO title="Übungstests" description="Prüfungsnahe Übungstests mit Zeitlimit und Auswertung." path="/modelltest" noindex />
      <div className="max-w-2xl mx-auto">
        <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">Übungstests</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Prüfen, ob du bereit bist
        </h1>
        <p className="mt-3 text-graphite leading-relaxed">
          Aufgaben im Stil der Prüfung, unter Zeitdruck, mit Auswertung nach den dokumentierten
          Bestehensgrenzen — damit dein erster Ernstfall nicht der Prüfungstag ist.
        </p>

        <ul className="mt-8 space-y-3">
          {tracksWithMocks.map((track) => (
            <li key={track.key}>
              <Link
                to={`/modelltest/${track.slug}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-rule bg-white p-5 transition-colors hover:border-siegel"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-siegel flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-ink">{MOCK_EXAMS[track.key].title}</p>
                    <p className="text-sm text-graphite">{track.nameDe} · {track.level}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-siegel" />
              </Link>
            </li>
          ))}
          {tracksComing.map((track) => (
            <li key={track.key} className="flex items-center justify-between gap-3 rounded-2xl border border-rule bg-paper-sunk p-5 opacity-70">
              <div>
                <p className="font-semibold text-ink">{track.nameDe}</p>
                <p className="text-sm text-graphite">Übungstest in Arbeit</p>
              </div>
              <span className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">Bald</span>
            </li>
          ))}
        </ul>

        <p className="mt-8 font-data text-[0.75rem] leading-relaxed text-graphite">
          {MOCK_DISCLAIMER_DE}
        </p>
      </div>
    </div>
  );
};

export default ModelltestHub;
