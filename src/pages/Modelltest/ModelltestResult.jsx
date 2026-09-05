import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_DISCLAIMER_DE } from '../../data/examTracks';
import { resolveModelltest } from '../../data/modelltest';
import { verdictFor } from '../../services/examScoring';
import { loadAttempt, listAttempts } from '../../services/examService';
import { readinessFromAttempts } from '../../services/readiness';
import confettiBurst from '../../lib/confetti.js';
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

// "Du bist bereit" — a trend, not a verdict: readiness reads the last two
// COMPLETED attempts for this key (see src/services/readiness.js), never
// this one attempt alone. Body copy differs by resolveModelltest() kind —
// a course test's next step is the next course level, an exam track's is
// the real exam — but both say "Richtwert" exactly once, matching the
// runner's own disclaimer discipline; this is a trend line, never a promise.
const readyBody = (resolved, lastTwo) => {
  const [recent, prior] = lastTwo; // lastTwo[0] is most recent
  const pctLine = `${prior.pct} % und ${recent.pct} %`;
  if (resolved.kind === 'course') {
    return `Deine letzten zwei Abschlusstests liegen bei ${pctLine}. Nächster Schritt: A1.2 — die zweite Hälfte bis Start Deutsch 1. (Richtwert, keine offizielle Bewertung.)`;
  }
  return `Deine letzten zwei Übungstests liegen bei ${pctLine}. Melde dich zur Prüfung an und übe mit einem offiziellen Modellsatz. (Richtwert, keine offizielle Bewertung.)`;
};

const ModelltestResult = () => {
  const { examSlug, attemptId } = useParams();
  const { user } = useAuth();
  const resolved = resolveModelltest(examSlug);
  const mock = resolved?.mock;

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readiness, setReadiness] = useState(null);
  const readinessConfettiFired = useRef(false);

  useEffect(() => {
    let alive = true;
    loadAttempt(attemptId).then((a) => {
      if (alive) { setAttempt(a); setLoading(false); }
    });
    return () => { alive = false; };
  }, [attemptId]);

  // Readiness reads the learner's whole attempt history for this key, not
  // just the attempt just completed — fired once the result itself is in,
  // so a fresh completion is already reflected in the history it reads.
  useEffect(() => {
    if (!user || !resolved || !attempt) return;
    let alive = true;
    listAttempts(user.id, resolved.key).then((attempts) => {
      if (!alive) return;
      setReadiness(readinessFromAttempts(attempts));
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, resolved?.key, attempt?.id]);

  // The one confetti burst for the readiness moment — separate from, and
  // never doubling, the pass-moment burst CompletionMoment fires below.
  useEffect(() => {
    if (readiness?.ready && !readinessConfettiFired.current) {
      readinessConfettiFired.current = true;
      confettiBurst();
    }
  }, [readiness?.ready]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper pt-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-graphite" />
      </div>
    );
  }
  if (!attempt || !resolved || attempt.status !== 'completed' || !attempt.max_score) {
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

        {/* Readiness — a trend over the last two completed attempts, never
            this one result alone (src/services/readiness.js). Ready = a
            candy button and one confetti burst (an earned moment, distinct
            from the pass-moment burst above); not ready = a calm line, no
            button, no confetti — never a pass promise. */}
        {readiness && readiness.lastTwo.length > 0 && (
          <Reveal delay={310} className="mt-6">
            {readiness.ready ? (
              <Card raised edge="limette" className="p-6 text-center">
                <Chip tone="limette">Bereit</Chip>
                <h2 className="mt-3 font-display text-xl font-semibold text-ink">Du bist bereit</h2>
                <p className="mt-2 text-sm text-graphite leading-relaxed">{readyBody(resolved, readiness.lastTwo)}</p>
                <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                  {resolved.kind === 'course' ? (
                    <>
                      <Button variant="celebrate" to="/level/a1.2">Weiter zu A1.2</Button>
                      <Button variant="secondary" to="/start-deutsch-1-kurs">Zum 30-Tage-Plan</Button>
                    </>
                  ) : (
                    <Button variant="celebrate" href={`/pruefung/${resolved.slug}/`}>Zur Prüfung anmelden</Button>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-5 text-center">
                <p className="text-sm text-graphite">
                  Noch nicht ganz: zwei Tests in Folge mit mindestens 70 % — dann bist du bereit.
                </p>
              </Card>
            )}
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
