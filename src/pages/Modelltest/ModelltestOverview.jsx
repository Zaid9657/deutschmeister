import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Clock, Play, RotateCcw, History } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_DISCLAIMER_DE } from '../../data/examTracks';
import { resolveModelltest } from '../../data/modelltest';
import { describeCourseTest } from '../../data/courseTests/description.js';
import { FORM_KEY, formNumber, hasForm, mockForm } from '../../data/mockExams/forms.js';
import { createAttempt, findResumableAttempt, listAttempts } from '../../services/examService';
import SEO from '../../components/SEO';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import Reveal from '../../components/ui/Reveal.jsx';

// /modelltest/:examSlug — what's in the test, start or resume, past attempts.
// `?form=2` starts a parallel form of the mock (new items, same shape — the telc
// route's day-20 retest); the form is stored on the attempt (src/data/mockExams/forms.js).
const ModelltestOverview = () => {
  const { examSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const userId = user?.id;

  const resolved = resolveModelltest(examSlug);
  // An unknown form number falls back to form 1, never to an empty test.
  const form = hasForm(resolved?.mock, searchParams.get('form')) ? formNumber(searchParams.get('form')) : 1;
  const mock = mockForm(resolved?.mock, form);

  const [resumable, setResumable] = useState(null);
  // The resume lookup decides which door is safe: 'pending' | 'none' | 'found' | 'error'.
  // "Test starten" inserts a NEW attempt and only the newest unfinished one can be resumed, so
  // Start waits for the lookup, and a failed lookup offers a retry instead of Start.
  const [lookup, setLookup] = useState('pending');
  const [lookupRun, setLookupRun] = useState(0);
  const [history, setHistory] = useState([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!userId || !resolved) return;
    let alive = true;
    setLookup('pending');
    Promise.all([
      findResumableAttempt(userId, resolved.key),
      listAttempts(userId, resolved.key),
    ]).then(([resume, attempts]) => {
      if (!alive) return;
      setResumable(resume || null);
      setLookup(resume === undefined ? 'error' : resume ? 'found' : 'none');
      setHistory(attempts.filter((a) => a.status === 'completed'));
    }).catch(() => {
      if (alive) setLookup('error');
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, resolved?.key, lookupRun]);

  const canStart = lookup === 'none' && !starting;

  const handleStart = async () => {
    if (!user || !mock || !canStart) return;
    setStarting(true);
    const attempt = await createAttempt(user.id, resolved.key, mock.sections[0].minutes, form > 1 ? { [FORM_KEY]: form } : {});
    setStarting(false);
    if (attempt) navigate(`/modelltest/${examSlug}/run`, { state: { attemptId: attempt.id } });
  };

  if (!resolved) {
    return (
      <div className="min-h-screen bg-paper pt-24 px-4 text-center">
        <p className="text-graphite">Für diese Prüfung gibt es noch keinen Übungstest.</p>
        <Link to="/modelltest" className="font-bold text-siegel transition-colors hover:text-siegel-deep">Zur Übersicht</Link>
      </div>
    );
  }

  const totalMinutes = mock.sections.reduce((sum, s) => sum + s.minutes, 0);

  return (
    <div className="min-h-screen bg-paper text-ink pt-24 pb-12 px-4">
      <SEO title={mock.title} description="Übungstest mit Zeitlimit und Auswertung." path={`/modelltest/${examSlug}`} noindex />
      <div className="max-w-2xl mx-auto">
        <SectionHeading size="page" level={1} eyebrow={resolved.nameDe} title={mock.title} lead={mock.courseLevel ? describeCourseTest(mock, 'de') : mock.intro} />

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
          {lookup === 'found' && resumable ? (
            <Button
              size="lg"
              shimmer
              className="flex-1"
              onClick={() => navigate(`/modelltest/${examSlug}/run`, { state: { attemptId: resumable.id } })}
            >
              <RotateCcw className="w-4 h-4" /> Angefangenen Test fortsetzen
            </Button>
          ) : lookup === 'error' ? (
            <div className="flex-1 space-y-3">
              <p role="alert" className="text-sm text-graphite">
                Ob Sie einen angefangenen Test haben, konnte nicht geprüft werden. Bitte prüfen Sie die Verbindung.
              </p>
              <Button size="lg" variant="secondary" className="w-full" onClick={() => setLookupRun((n) => n + 1)}>
                <RotateCcw className="w-4 h-4" /> Erneut prüfen
              </Button>
            </div>
          ) : (
            <Button size="lg" shimmer className="flex-1" onClick={handleStart} disabled={!canStart}>
              <Play className="w-4 h-4" /> {lookup === 'pending' ? 'Wird geladen…' : starting ? 'Wird gestartet…' : 'Test starten'}
            </Button>
          )}
        </Reveal>

        {history.length > 0 && (
          <Reveal className="mt-8">
            <p className="flex items-center gap-2 font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite">
              <History className="w-3.5 h-3.5" /> Ihre Versuche
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
