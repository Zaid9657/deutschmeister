import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, RotateCcw } from 'lucide-react';
import { examTrackBySlug, MOCK_DISCLAIMER_DE } from '../../data/examTracks';
import { mockForExamKey } from '../../data/mockExams';
import { verdictFor } from '../../services/examScoring';
import { loadAttempt } from '../../services/examService';
import CompletionMoment from '../../components/CompletionMoment';
import SEO from '../../components/SEO';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import Stat from '../../components/ui/Stat.jsx';

// /modelltest/:examSlug/result/:attemptId — the Richtwert readout.
//
// The verdict language is deliberately careful: the pass threshold mirrors
// the publicly documented rule (via the guide), but nothing here is an
// official evaluation and no surface may promise a pass — the disclaimer
// renders on this screen like on every mock surface.
//
// Pass = celebrate, fail = calm (docs/design/playbook.md): over the
// documented line the CompletionMoment fires its one confetti burst and the
// single `celebrate` button; under it the same strip renders on siegel with
// no confetti — a Standortbestimmung, not a party and not a verdict.
// A mock module may override this wording via `verdictCopyDe` (same keys) —
// the DTZ needs it: that exam is scaled (levels per section, no pass mark),
// so "dokumentierte 60%-Grenze" would claim a rule that does not exist there.
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
        <Link to={`/modelltest/${examSlug}`} className="font-bold text-siegel transition-colors hover:text-siegel-deep">Zur Testübersicht</Link>
      </div>
    );
  }

  const percent = Math.round((attempt.score / attempt.max_score) * 100);
  const verdict = verdictFor(percent, mock.passPercent);
  const passed = verdict !== 'nicht-bereit';
  const copy = mock.verdictCopyDe?.[verdict] || VERDICT_COPY[verdict];
  const sections = attempt.section_scores || {};
  const weakest = Object.entries(sections)
    .map(([key, s]) => ({ key, pct: s.max ? s.score / s.max : 1 }))
    .sort((a, b) => a.pct - b.pct)[0];

  return (
    <div className="min-h-screen bg-paper text-ink pt-24 pb-12 px-4">
      <SEO title="Testergebnis" description="Auswertung deines Übungstests." path={`/modelltest/${examSlug}/result`} noindex />
      <div className="max-w-2xl mx-auto">
        <SectionHeading size="page" level={1} eyebrow={mock.title} title="Dein Ergebnis" />

        {/* Score — the one featured card; limette edge for a pass, siegel for a calm readout */}
        <Reveal delay={120} className="mt-6">
          <Card raised edge={passed ? 'limette' : 'siegel'} className="p-6 text-center">
            <div className="flex items-end justify-center gap-1">
              <Stat value={percent} size="lg" />
              <span className="pb-1 font-display text-2xl text-graphite">%</span>
            </div>
            <p className="mt-2 font-data text-[0.8125rem] text-graphite">
              {attempt.score} von {attempt.max_score} Punkten · automatisch ausgewertete Teile
            </p>
            <Chip tone={passed ? 'limette' : 'quiet'} className="mt-4">{copy.title}</Chip>
            <p className="mt-3 text-sm text-graphite leading-relaxed">{copy.body}</p>
            <p className="mt-3 font-data text-[0.75rem] text-graphite">
              Richtwert — keine offizielle Bewertung. Schreiben und Sprechen sind hier nicht enthalten.
            </p>
          </Card>
        </Reveal>

        {/* Per section — reference rows, flat, progress on siegel */}
        <Reveal delay={200} className="mt-6">
          <Card className="overflow-hidden">
            {Object.entries(sections).map(([key, s]) => {
              const hint = SECTION_HINTS[key];
              const pct = s.max ? Math.round((s.score / s.max) * 100) : 0;
              return (
                <div key={key} className="px-5 py-4 border-b border-rule last:border-b-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-ink">{hint?.label || key}</span>
                    <span className="font-data text-[0.8125rem] text-graphite">{s.score}/{s.max} · {pct} %</span>
                  </div>
                  <div className="h-2 rounded-pill bg-paper-sunk overflow-hidden">
                    <div className="h-full rounded-pill bg-siegel" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </Card>
        </Reveal>

        {/* Next action: attack the weakest section */}
        {weakest && SECTION_HINTS[weakest.key] && (
          <Reveal delay={280} className="mt-6">
            <CompletionMoment
              headline="Übungstest abgeschlossen!"
              detail={`Die meisten Punkte hast du in „${SECTION_HINTS[weakest.key].label}" liegen lassen — genau da lohnt sich die nächste Einheit.`}
              nextLabel={SECTION_HINTS[weakest.key].linkLabel}
              nextHref={SECTION_HINTS[weakest.key].href}
              fullLoad={SECTION_HINTS[weakest.key].fullLoad}
              celebrate={passed}
            />
          </Reveal>
        )}

        <Reveal delay={340} className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" className="flex-1" to={`/modelltest/${examSlug}`}>
            <RotateCcw className="w-4 h-4" /> Noch einmal versuchen
          </Button>
          <Button variant="secondary" className="flex-1" to="/dashboard">
            Zum Dashboard
          </Button>
        </Reveal>

        <p className="mt-8 font-data text-[0.75rem] leading-relaxed text-graphite">
          {MOCK_DISCLAIMER_DE}
        </p>
      </div>
    </div>
  );
};

export default ModelltestResult;
