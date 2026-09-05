import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, ClipboardCheck } from 'lucide-react';
import { EXAM_TRACKS, MOCK_DISCLAIMER_DE } from '../../data/examTracks';
import { MOCK_EXAMS } from '../../data/mockExams';
import { COURSE_TESTS } from '../../data/courseTests';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import Tilt from '../../components/ui/Tilt.jsx';

// /modelltest — which practice exams exist. Auth-gated (SubscriptionGuard in
// App.jsx); noindex like every app screen behind the shell.
// Each course test's 28-day plan route, by course level (Wave 2/3 PR D).
const PHASE_PLAN_BY_LEVEL = { 'a1.1': '/a1-1-phase', 'a1.2': '/a1-2-phase' };

const ModelltestHub = () => {
  const tracksWithMocks = EXAM_TRACKS.filter((t) => MOCK_EXAMS[t.key]);
  const tracksComing = EXAM_TRACKS.filter((t) => !MOCK_EXAMS[t.key]);

  return (
    <div className="min-h-screen bg-paper text-ink pt-24 pb-12 px-4">
      <SEO title="Übungstests" description="Prüfungsnahe Übungstests mit Zeitlimit und Auswertung." path="/modelltest" noindex />
      <div className="max-w-2xl mx-auto">
        <SectionHeading
          size="page"
          level={1}
          eyebrow="Übungstests"
          title="Prüfen, ob du bereit bist"
          lead="Aufgaben im Stil der Prüfung, unter Zeitdruck, mit Auswertung nach den dokumentierten Bestehensgrenzen — damit dein erster Ernstfall nicht der Prüfungstag ist."
        />

        {/* The grid a learner CHOOSES from — tilt on the pickable cards only. */}
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {tracksWithMocks.map((track, i) => (
            <Reveal as="li" key={track.key} delay={90 * i} className="h-full">
              <Tilt className="h-full">
                <Card
                  interactive
                  as={Link}
                  to={`/modelltest/${track.slug}`}
                  className="flex h-full flex-col p-6"
                >
                  <div className="flex items-center justify-between gap-3" data-atropos-offset="6">
                    <div className="w-11 h-11 rounded-clay bg-siegel text-white flex items-center justify-center shadow-raise-siegel">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <Chip tone="label">{track.level}</Chip>
                  </div>
                  <p className="mt-4 font-display text-[1.1875rem] font-semibold leading-snug text-ink" data-atropos-offset="4">
                    {MOCK_EXAMS[track.key].title}
                  </p>
                  <p className="mt-1 flex-1 text-sm text-graphite" data-atropos-offset="2">{track.nameDe} · {track.level}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-siegel" data-atropos-offset="6">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Card>
              </Tilt>
            </Reveal>
          ))}
          {tracksComing.map((track, i) => (
            <Reveal as="li" key={track.key} delay={90 * (tracksWithMocks.length + i)} className="h-full">
              <Card tone="sunk" className="flex h-full items-center justify-between gap-3 p-6 opacity-70">
                <div>
                  <p className="font-bold text-ink">{track.nameDe}</p>
                  <p className="text-sm text-graphite">Übungstest in Arbeit</p>
                </div>
                <Chip tone="quiet">Bald</Chip>
              </Card>
            </Reveal>
          ))}
        </ul>

        {/* Kurstests — our own end-of-course checkpoints (src/data/courseTests),
            not another exam track. The A1.1 Abschlusstest is open to every
            logged-in user (a1.1 is a free level; see ExamSubscriptionGuard's
            header); the A1.2 one gates on A1.2 access like its level — the
            same disclaimer applies here as above. */}
        {COURSE_TESTS.length > 0 && (
          <div className="mt-10">
            <p className="font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-graphite mb-3">
              Kurstests
            </p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {COURSE_TESTS.map((ct, i) => {
                const minutes = ct.mock.sections.reduce((sum, s) => sum + s.minutes, 0);
                return (
                  <Reveal as="li" key={ct.key} delay={90 * (tracksWithMocks.length + tracksComing.length + i)} className="h-full">
                    <Tilt className="h-full">
                      <Card interactive as={Link} to={`/modelltest/${ct.slug}`} className="flex h-full flex-col p-6">
                        <div className="flex items-center justify-between gap-3" data-atropos-offset="6">
                          <div className="w-11 h-11 rounded-clay bg-siegel text-white flex items-center justify-center shadow-raise-siegel">
                            <ClipboardCheck className="w-5 h-5" />
                          </div>
                          <Chip tone="label">{ct.level}</Chip>
                        </div>
                        <p className="mt-4 font-display text-[1.1875rem] font-semibold leading-snug text-ink" data-atropos-offset="4">
                          {ct.mock.title}
                        </p>
                        <p className="mt-1 flex-1 text-sm text-graphite" data-atropos-offset="2">
                          {ct.nameDe} — Kurzversion im Start-Deutsch-1-Format · {ct.level} · {minutes} Min.
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-siegel" data-atropos-offset="6">
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </Card>
                    </Tilt>
                    {PHASE_PLAN_BY_LEVEL[ct.level] && (
                      <Link
                        to={PHASE_PLAN_BY_LEVEL[ct.level]}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-siegel transition-colors hover:text-siegel-deep"
                      >
                        Zum 28-Tage-Plan <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </Reveal>
                );
              })}
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

export default ModelltestHub;
