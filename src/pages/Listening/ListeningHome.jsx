import { Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useListeningLevels } from '../../hooks/useListening';
import DataState from '../../components/DataState';
import ListeningLevelCard from '../../components/listening/ListeningLevelCard';
import SEO from '../../components/SEO';
import { seoProps } from '../../data/seoRoutes.js';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import Aurora from '../../components/ui/Aurora.jsx';
import Tilt from '../../components/ui/Tilt.jsx';

// /listening — the level picker. Playful Depth (docs/design/playbook.md): one
// aurora hero, and the grid a visitor CHOOSES from gets the tilt.
const ListeningHome = () => {
  const { i18n } = useTranslation();
  const { levels, loading, error, retry } = useListeningLevels();
  const isGerman = i18n.language === 'de';

  if (loading || error) {
    return (
      <div className="min-h-screen bg-paper pt-24">
        <DataState loading={loading} error={error} onRetry={retry} />
      </div>
    );
  }

  return (
    <>
      <SEO
        {...seoProps('/listening')}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://deutsch-meister.de"},
            {"@type": "ListItem", "position": 2, "name": "Listening", "item": "https://deutsch-meister.de/listening/"}
          ]
        }}
      />
      <div className="min-h-screen bg-paper font-body text-ink pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="relative overflow-hidden rounded-clay mb-10 -mx-2 px-2 py-6 sm:-mx-4 sm:px-4">
          <Aurora />
          <div className="relative text-center">
            <div
              className="hero-line mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-clay bg-siegel text-white shadow-raise-siegel"
              style={{ '--d': '60ms' }}
            >
              <Headphones size={32} />
            </div>
            <SectionHeading
              level={1}
              size="page"
              align="center"
              title={isGerman ? 'Hörverständnis' : 'Listening Comprehension'}
              lead={isGerman
                ? 'Verbessere dein Hörverständnis mit authentischen Dialogen und Übungen.'
                : 'Improve your listening skills with authentic dialogues and exercises.'}
            />
          </div>
        </div>

        {/* Level grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {levels.map((level, index) => (
            <Reveal key={level.level} delay={90 * index} className="h-full">
              <Tilt className="h-full">
                <ListeningLevelCard
                  level={level.level}
                  totalExercises={level.totalExercises}
                  completedExercises={level.completedExercises}
                />
              </Tilt>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default ListeningHome;
