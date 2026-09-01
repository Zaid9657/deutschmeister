import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Play, RotateCcw, History } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { examTrackBySlug, MOCK_DISCLAIMER_DE } from '../../data/examTracks';
import { mockForExamKey } from '../../data/mockExams';
import { createAttempt, findResumableAttempt, listAttempts } from '../../services/examService';
import SEO from '../../components/SEO';

// /modelltest/:examSlug — what's in the test, start or resume, past attempts.
const ModelltestOverview = () => {
  const { examSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const track = examTrackBySlug(examSlug);
  const mock = track ? mockForExamKey(track.key) : null;

  const [resumable, setResumable] = useState(null);
  const [history, setHistory] = useState([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user || !track || !mock) return;
    let alive = true;
    Promise.all([
      findResumableAttempt(user.id, track.key),
      listAttempts(user.id, track.key),
    ]).then(([resume, attempts]) => {
      if (!alive) return;
      setResumable(resume);
      setHistory(attempts.filter((a) => a.status === 'completed'));
    });
    return () => { alive = false; };
  }, [user, track, mock]);

  if (!track || !mock) {
    return (
      <div className="min-h-screen bg-paper pt-24 px-4 text-center">
        <p className="text-graphite">Für diese Prüfung gibt es noch keinen Übungstest.</p>
        <Link to="/modelltest" className="text-siegel font-semibold">Zur Übersicht</Link>
      </div>
    );
  }

  const totalMinutes = mock.sections.reduce((sum, s) => sum + s.minutes, 0);

  const handleStart = async () => {
    if (!user || starting) return;
    setStarting(true);
    const attempt = await createAttempt(user.id, track.key, mock.sections[0].minutes);
    setStarting(false);
    if (attempt) navigate(`/modelltest/${examSlug}/run`, { state: { attemptId: attempt.id } });
  };

  return (
    <div className="min-h-screen bg-paper pt-24 pb-12 px-4">
      <SEO title={mock.title} description="Übungstest mit Zeitlimit und Auswertung." path={`/modelltest/${examSlug}`} noindex />
      <div className="max-w-2xl mx-auto">
        <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">{track.nameDe}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{mock.title}</h1>
        <p className="mt-3 text-graphite leading-relaxed">{mock.intro}</p>

        <div className="mt-6 rounded-2xl border border-rule bg-white overflow-hidden">
          {mock.sections.map((s) => (
            <div key={s.key} className="flex items-center justify-between px-5 py-3.5 border-b border-rule last:border-b-0">
              <span className="font-semibold text-ink text-sm">{s.title}</span>
              <span className="flex items-center gap-1.5 font-data text-[0.8125rem] text-graphite">
                <Clock className="w-3.5 h-3.5" /> {s.minutes} Min.
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-3.5 bg-paper-sunk">
            <span className="font-semibold text-ink text-sm">Gesamt</span>
            <span className="font-data text-[0.8125rem] font-semibold text-ink">~{totalMinutes} Min.</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {resumable ? (
            <button
              onClick={() => navigate(`/modelltest/${examSlug}/run`, { state: { attemptId: resumable.id } })}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-siegel text-white font-semibold hover:bg-siegel-lift transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Angefangenen Test fortsetzen
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={starting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-siegel text-white font-semibold hover:bg-siegel-lift transition-colors disabled:opacity-60"
            >
              <Play className="w-4 h-4" /> {starting ? 'Wird gestartet…' : 'Test starten'}
            </button>
          )}
        </div>

        {history.length > 0 && (
          <div className="mt-8">
            <p className="flex items-center gap-2 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              <History className="w-3.5 h-3.5" /> Deine Versuche
            </p>
            <ul className="mt-3 space-y-2">
              {history.map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/modelltest/${examSlug}/result/${a.id}`}
                    className="flex items-center justify-between rounded-xl border border-rule bg-white px-4 py-3 text-sm hover:border-siegel transition-colors"
                  >
                    <span className="text-graphite">
                      {new Date(a.completed_at || a.started_at).toLocaleDateString('de-DE')}
                    </span>
                    <span className="font-data font-semibold text-ink">
                      {a.max_score ? `${Math.round((a.score / a.max_score) * 100)} %` : '—'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-8 font-data text-[0.75rem] leading-relaxed text-graphite">
          {MOCK_DISCLAIMER_DE}
        </p>
      </div>
    </div>
  );
};

export default ModelltestOverview;
