import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, RotateCcw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_DISCLAIMER_DE } from '../../data/examTracks';
import { resolveModelltest } from '../../data/modelltest';
import { describeCourseTest } from '../../data/courseTests/description.js';
import { verdictFor } from '../../services/examScoring';
import { loadAttempt, listAttempts } from '../../services/examService';
import { readinessFromAttempts } from '../../services/readiness';
import { completeLevelTest } from '../../services/lessonService.js';
import { curriculumForTestSlug, levelTestNodeId } from '../../data/curricula/index.js';
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
// External mocks refer to the documented exam threshold (via the guide);
// course assessments instead describe their own course rule. Nothing here is an
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
    body: 'In den automatisch ausgewerteten Teilen liegen Sie deutlich über der dokumentierten 60%-Grenze. Halten Sie das Niveau und üben Sie weiter Schreiben und Sprechen — die zählen in der echten Prüfung mit.',
  },
  knapp: {
    title: 'Über der Grenze — aber ohne Puffer',
    body: 'Sie liegen über der dokumentierten 60%-Grenze, aber knapp. Ziel für die echte Prüfung: 70–75%, damit ein schwacher Tag Sie nicht unter die Grenze drückt.',
  },
  'nicht-bereit': {
    title: 'Noch unter der Grenze',
    body: 'In den automatisch ausgewerteten Teilen liegen Sie unter der dokumentierten 60%-Grenze. Das ist eine Standortbestimmung, kein Urteil — sehen Sie sich unten an, welcher Teil die meisten Punkte gekostet hat.',
  },
};

// Practice for the weakest section, at the TEST's own level (resolved.gateLevel: the course's level,
// or an exam track's last sub-level). These links were a fixed B1.1, so an A1.1 or A1.2 learner
// was sent to B1 material — and, past their purchase, to a locked level (Codex review, 2026-10-14).
const sectionHints = (level = 'b1.1') => ({
  lesen: { label: 'Leseverstehen', href: `/reading/${level}`, linkLabel: 'Lesetraining öffnen' },
  sprachbausteine: { label: 'Sprachbausteine', href: `/grammar/${level}/`, linkLabel: `${level.toUpperCase()}-Grammatik öffnen`, fullLoad: true },
  hoeren: { label: 'Hörverstehen', href: `/listening/${level}`, linkLabel: 'Hörtraining öffnen' },
});

// "Sie sind bereit" — a trend, not a verdict: readiness reads the last two
// COMPLETED attempts for this key (see src/services/readiness.js), never
// this one attempt alone. Body copy differs by resolveModelltest() kind —
// a course test's next step is the next course level, an exam track's is
// the real exam — but both say "Richtwert" exactly once, matching the
// runner's own disclaimer discipline; this is a trend line, never a promise.
//
// What comes after a course test is keyed by its level (resolved.gateLevel):
// after A1.1 the A1.2-Phase plan; after A1.2 the full Start-Deutsch-1-format
// mock and the 30-day plan in front of the real exam; after A2.1 the A2.2
// level hub (there is no A2.2 plan yet). A course level without an entry
// falls back to its level hub, never to a dead button.
const COURSE_NEXT = {
  'a1.1': {
    body: 'Nächster Schritt: A1.2 — die zweite Hälfte bis Start Deutsch 1.',
    primary: { to: '/a1-2-phase', label: 'Weiter mit A1.2' },
    secondary: { to: '/level/a1.2', label: 'Zur Stufe A1.2' },
  },
  'a1.2': {
    body: 'Nächster Schritt: die vollständige Übungsprüfung im Start-Deutsch-1-Format und die 30-Tage-Prüfungsphase.',
    primary: { to: '/modelltest/start-deutsch-1', label: 'Zur Übungsprüfung Start Deutsch 1' },
    secondary: { to: '/start-deutsch-1-kurs', label: 'Zum 30-Tage-Plan' },
  },
  'a2.1': {
    body: 'Nächster Schritt: A2.2 — die zweite Hälfte von A2, als 28-Tage-Plan.',
    primary: { to: '/a2-2-phase', label: 'Weiter mit A2.2' },
    secondary: { to: '/level/a2.2', label: 'Zur Stufe A2.2' },
  },
  'a2.2': {
    body: 'Nächster Schritt: der 30-Tage-Prüfungsplan zum Goethe-Zertifikat A2 — mit dem Übungstest (Kurzversion) darin.',
    primary: { to: '/goethe-a2-kurs', label: 'Zum 30-Tage-Prüfungsplan' },
    secondary: { to: '/modelltest/goethe-a2', label: 'Zum Übungstest Goethe A2' },
  },
};
const courseNext = (resolved) =>
  COURSE_NEXT[resolved.gateLevel] || {
    body: 'Nächster Schritt: die nächste Stufe.',
    primary: { to: `/level/${resolved.gateLevel}`, label: 'Zur Stufe' },
    secondary: null,
  };

const readyBody = (resolved, lastTwo) => {
  const [recent, prior] = lastTwo; // lastTwo[0] is most recent
  const pctLine = `${prior.pct} % und ${recent.pct} %`;
  if (resolved.kind === 'course') {
    return `Ihre letzten zwei Abschlusstests liegen bei ${pctLine}. ${courseNext(resolved).body} (Richtwert, keine offizielle Bewertung.)`;
  }
  return `Ihre letzten zwei Übungstests liegen bei ${pctLine}. Melden Sie sich zur Prüfung an und üben Sie mit einem offiziellen Modellsatz. (Richtwert, keine offizielle Bewertung.)`;
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

  // A pass on a course's own final test completes that course's path (and so
  // opens its certificate). Upserted, so a revisit is harmless.
  // The attempt is loaded by id alone: a passing attempt of ANOTHER exam opened under this test's
  // URL must not complete this course (Codex review, 2026-10-07).
  const attemptIsThisTest = !!resolved && !!attempt && attempt.exam_key === resolved.key;
  useEffect(() => {
    if (!user || !attempt || attempt.status !== 'completed' || !attempt.max_score || !mock) return;
    if (!attemptIsThisTest) return;
    const curriculum = curriculumForTestSlug(examSlug);
    if (!curriculum) return;
    const percent = Math.round((attempt.score / attempt.max_score) * 100);
    if (verdictFor(percent, mock.passPercent) === 'nicht-bereit') return;
    completeLevelTest(user.id, curriculum.level, levelTestNodeId(curriculum));
  }, [user, attempt, mock, examSlug, attemptIsThisTest]);

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
  const copy = resolved.kind === 'course'
    ? { title: passed ? 'Kurs-Bestehensgrenze erreicht' : 'Kurs-Bestehensgrenze noch nicht erreicht', body: describeCourseTest(mock, 'de') }
    : mock.verdictCopyDe?.[verdict] || VERDICT_COPY[verdict];
  const sections = attempt.section_scores || {};
  const weakest = Object.entries(sections)
    .map(([key, s]) => ({ key, pct: s.max ? s.score / s.max : 1 }))
    .sort((a, b) => a.pct - b.pct)[0];
  const SECTION_HINTS = sectionHints(resolved.gateLevel || undefined);

  return (
    <div className="min-h-screen bg-paper text-ink pt-24 pb-12 px-4">
      <SEO title="Testergebnis" description="Auswertung Ihres Übungstests." path={`/modelltest/${examSlug}/result`} noindex />
      <div className="max-w-2xl mx-auto">
        <SectionHeading size="page" level={1} eyebrow={mock.title} title="Ihr Ergebnis" />

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
              detail={`Die meisten Punkte haben Sie in „${SECTION_HINTS[weakest.key].label}" liegen lassen — genau da lohnt sich die nächste Einheit.`}
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
                <h2 className="mt-3 font-display text-xl font-semibold text-ink">Sie sind bereit</h2>
                <p className="mt-2 text-sm text-graphite leading-relaxed">{readyBody(resolved, readiness.lastTwo)}</p>
                <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                  {resolved.kind === 'course' ? (
                    <>
                      <Button variant="celebrate" to={courseNext(resolved).primary.to}>{courseNext(resolved).primary.label}</Button>
                      {courseNext(resolved).secondary && (
                        <Button variant="secondary" to={courseNext(resolved).secondary.to}>{courseNext(resolved).secondary.label}</Button>
                      )}
                    </>
                  ) : (
                    <Button variant="celebrate" href={`/pruefung/${resolved.slug}/`}>Zur Prüfung anmelden</Button>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-5 text-center">
                <p className="text-sm text-graphite">
                  Noch nicht ganz: zwei Tests in Folge mit mindestens 70 % — dann sind Sie bereit.
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
