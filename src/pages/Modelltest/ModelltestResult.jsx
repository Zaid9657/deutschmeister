import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, RotateCcw } from 'lucide-react';
import { examTrackBySlug, MOCK_DISCLAIMER_DE } from '../../data/examTracks';
import { mockForExamKey } from '../../data/mockExams';
import { verdictFor } from '../../services/examScoring';
import { loadAttempt } from '../../services/examService';
import CompletionMoment from '../../components/CompletionMoment';
import SEO from '../../components/SEO';

// /modelltest/:examSlug/result/:attemptId — the Richtwert readout.
//
// The verdict language is deliberately careful: the pass threshold mirrors
// the publicly documented rule (via the guide), but nothing here is an
// official evaluation and no surface may promise a pass — the disclaimer
// renders on this screen like on every mock surface.
const VERDICT_COPY = {
  solide: {
    title: 'Über der Bestehensgrenze — mit Puffer',
    body: 'In den automatisch ausgewerteten Teilen liegst du deutlich über der dokumentierten 60%-Grenze. Halte das Niveau und übe weiter Schreiben und Sprechen — die zählen in der echten Prüfung mit.',
  },
  knapp: {
    title: 'Über der Grenze — aber ohne Puffer',
    body: 'Du liegst über der dokumentierten 60%-Grenze, aber knapp. Ziel für die echte Prüfung: 70–75%, damit ein schwacher Tag dich nicht unter die Grenze drückt.',
  },
  'nicht-bereit': {
    title: 'Noch unter der Grenze',
    body: 'In den automatisch ausgewerteten Teilen liegst du unter der dokumentierten 60%-Grenze. Das ist eine Standortbestimmung, kein Urteil — sieh dir unten an, welcher Teil die meisten Punkte gekostet hat.',
  },
};

const SECTION_HINTS = {
  lesen: { label: 'Leseverstehen', href: '/reading/b1.1', linkLabel: 'Lesetraining öffnen' },
  sprachbausteine: { label: 'Sprachbausteine', href: '/grammar/b1.1/', linkLabel: 'B1-Grammatik öffnen', fullLoad: true },
  hoeren: { label: 'Hörverstehen', href: '/listening/b1.1', linkLabel: 'Hörtraining öffnen' },
};

const ModelltestResult = () => {
  const { examSlug, attemptId } = useParams();
  const track = examTrackBySlug(examSlug);
  const mock = track ? mockForExamKey(track.key) : null;

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadAttempt(attemptId).then((a) => {
      if (alive) { setAttempt(a); setLoading(false); }
    });
    return () => { alive = false; };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper pt-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-graphite" />
      </div>
    );
  }
  if (!attempt || !mock || attempt.status !== 'completed' || !attempt.max_score) {
    return (
      <div className="min-h-screen bg-paper pt-24 px-4 text-center">
        <p className="text-graphite mb-3">Dieses Ergebnis konnte nicht geladen werden.</p>
        <Link to={`/modelltest/${examSlug}`} className="text-siegel font-semibold">Zur Testübersicht</Link>
      </div>
    );
  }

  const percent = Math.round((attempt.score / attempt.max_score) * 100);
  const verdict = verdictFor(percent, mock.passPercent);
  const copy = VERDICT_COPY[verdict];
  const sections = attempt.section_scores || {};
  const weakest = Object.entries(sections)
    .map(([key, s]) => ({ key, pct: s.max ? s.score / s.max : 1 }))
    .sort((a, b) => a.pct - b.pct)[0];

  return (
    <div className="min-h-screen bg-paper pt-24 pb-12 px-4">
      <SEO title="Testergebnis" description="Auswertung deines Übungstests." path={`/modelltest/${examSlug}/result`} noindex />
      <div className="max-w-2xl mx-auto">
        <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel">{mock.title}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Dein Ergebnis</h1>

        {/* Score */}
        <div className="mt-6 rounded-2xl border border-rule bg-white p-6 text-center">
          <p className="font-display text-5xl font-semibold text-ink">{percent}<span className="text-2xl text-graphite"> %</span></p>
          <p className="mt-1 font-data text-[0.8125rem] text-graphite">
            {attempt.score} von {attempt.max_score} Punkten · automatisch ausgewertete Teile
          </p>
          <p className="mt-4 font-display text-lg font-semibold text-ink">{copy.title}</p>
          <p className="mt-2 text-sm text-graphite leading-relaxed">{copy.body}</p>
          <p className="mt-3 font-data text-[0.75rem] text-graphite">
            Richtwert — keine offizielle Bewertung. Schreiben und Sprechen sind hier nicht enthalten.
          </p>
        </div>

        {/* Per section */}
        <div className="mt-6 rounded-2xl border border-rule bg-white overflow-hidden">
          {Object.entries(sections).map(([key, s]) => {
            const hint = SECTION_HINTS[key];
            const pct = s.max ? Math.round((s.score / s.max) * 100) : 0;
            return (
              <div key={key} className="px-5 py-4 border-b border-rule last:border-b-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-ink">{hint?.label || key}</span>
                  <span className="font-data text-[0.8125rem] text-graphite">{s.score}/{s.max} · {pct} %</span>
                </div>
                <div className="h-2 rounded-full bg-paper-sunk overflow-hidden">
                  <div className="h-full rounded-full bg-siegel" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Next action: attack the weakest section */}
        {weakest && SECTION_HINTS[weakest.key] && (
          <div className="mt-6">
            <CompletionMoment
              headline="Übungstest abgeschlossen!"
              detail={`Die meisten Punkte hast du in „${SECTION_HINTS[weakest.key].label}" liegen lassen — genau da lohnt sich die nächste Einheit.`}
              nextLabel={SECTION_HINTS[weakest.key].linkLabel}
              nextHref={SECTION_HINTS[weakest.key].href}
              fullLoad={SECTION_HINTS[weakest.key].fullLoad}
            />
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            to={`/modelltest/${examSlug}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-rule text-ink font-semibold hover:border-siegel transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Noch einmal versuchen
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl border border-rule text-ink font-semibold hover:border-siegel transition-colors"
          >
            Zum Dashboard
          </Link>
        </div>

        <p className="mt-8 font-data text-[0.75rem] leading-relaxed text-graphite">
          {MOCK_DISCLAIMER_DE}
        </p>
      </div>
    </div>
  );
};

export default ModelltestResult;
