import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Clock, Play, RotateCcw, History } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { examTrackBySlug, MOCK_DISCLAIMER_DE } from '../../data/examTracks';
import { mockForExamKey } from '../../data/mockExams';
import { createAttempt, findResumableAttempt, listAttempts } from '../../services/examService';
import SEO from '../../components/SEO';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import Reveal from '../../components/ui/Reveal.jsx';

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
        <Link to="/modelltest" className="font-bold text-siegel transition-colors hover:text-siegel-deep">Zur Übersicht</Link>
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
    <div className="min-h-screen bg-paper text-ink pt-24 pb-12 px-4">
      <SEO title={mock.title} description="Übungstest mit Zeitlimit und Auswertung." path={`/modelltest/${examSlug}`} noindex />
      <div className="max-w-2xl mx-auto">
        <SectionHeading size="page" level={1} eyebrow={track.nameDe} title={mock.title} lead={mock.intro} />

        {/* Reference material — what is in the test — stays flat. */}
        <Reveal delay={180} className="mt-6">
          <Card className="overflow-hidden">
            {mock.sections.map((s) => (
              <div key={s.key} className="flex items-center justify-between px-5 py-3.5 border-b border-rule last:border-b-0">
                <span className="font-bold text-ink text-sm">{s.title}</span>
                <span className="flex items-center gap-1.5 font-data text-[0.8125rem] text-graphite">
                  <Clock className="w-3.5 h-3.5" /> {s.minutes} Min.
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3.5 bg-paper-sunk">
              <span className="font-bold text-ink text-sm">Gesamt</span>
              <span className="font-data text-[0.8125rem] font-bold text-ink">~{totalMinutes} Min.</span>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={260} className="mt-6 flex flex-col sm:flex-row gap-3">
          {resumable ? (
            <Button
              size="lg"
              shimmer
              className="flex-1"
              onClick={() => navigate(`/modelltest/${examSlug}/run`, { state: { attemptId: resumable.id } })}
            >
              <RotateCcw className="w-4 h-4" /> Angefangenen Test fortsetzen
            </Button>
          ) : (
            <Button size="lg" shimmer className="flex-1" onClick={handleStart} disabled={starting}>
              <Play className="w-4 h-4" /> {starting ? 'Wird gestartet…' : 'Test starten'}
            </Button>
          )}
        </Reveal>

        {history.length > 0 && (
          <Reveal className="mt-8">
            <p className="flex items-center gap-2 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              <History className="w-3.5 h-3.5" /> Deine Versuche
            </p>
            <ul className="mt-3 space-y-2">
              {history.map((a) => (
                <li key={a.id}>
                  <Card
                    interactive
                    as={Link}
                    to={`/modelltest/${examSlug}/result/${a.id}`}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span className="text-graphite">
                      {new Date(a.completed_at || a.started_at).toLocaleDateString('de-DE')}
                    </span>
                    <Chip tone="label">
                      {a.max_score ? `${Math.round((a.score / a.max_score) * 100)} %` : '—'}
                    </Chip>
                  </Card>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        <p className="mt-8 font-data text-[0.75rem] leading-relaxed text-graphite">
          {MOCK_DISCLAIMER_DE}
        </p>
      </div>
    </div>
  );
};

export default ModelltestOverview;
