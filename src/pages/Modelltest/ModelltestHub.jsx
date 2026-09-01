import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { EXAM_TRACKS, MOCK_DISCLAIMER_DE } from '../../data/examTracks';
import { MOCK_EXAMS } from '../../data/mockExams';
import SEO from '../../components/SEO';
import Card from '../../components/ui/Card.jsx';
import Chip from '../../components/ui/Chip.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import Tilt from '../../components/ui/Tilt.jsx';

// /modelltest — which practice exams exist. Auth-gated (SubscriptionGuard in
// App.jsx); noindex like every app screen behind the shell.
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

        <p className="mt-8 font-data text-[0.75rem] leading-relaxed text-graphite">
          {MOCK_DISCLAIMER_DE}
        </p>
      </div>
    </div>
  );
};

export default ModelltestHub;
