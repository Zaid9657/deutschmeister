import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLevelExercises } from '../../hooks/useListening';
import DataState from '../../components/DataState';
import EmptyState from '../../components/EmptyState';
import { getLevelSubtitle } from '../../utils/listeningHelpers';
import ExerciseCard from '../../components/listening/ExerciseCard';
import SEO from '../../components/SEO';
import Button from '../../components/ui/Button.jsx';
import SectionHeading from '../../components/ui/SectionHeading.jsx';
import Reveal from '../../components/ui/Reveal.jsx';
import Aurora from '../../components/ui/Aurora.jsx';

const LevelExercises = () => {
  const { level } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { exercises, loading, error, retry } = useLevelExercises(level);
  // Routes carry the level lowercase (/listening/a1.1) while the subtitle table
  // is keyed on the DB's uppercase form ("A1.1") — normalize here or every
  // level silently falls back to the raw slug.
  const levelKey = (level || '').toUpperCase();
  const subtitle = getLevelSubtitle(levelKey, i18n.language);
  const isGerman = i18n.language === 'de';

  if (loading || error) {
    return (
      <div className="min-h-screen bg-paper pt-24">
        <DataState loading={loading} error={error} onRetry={retry} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title={`German Listening Exercises ${levelKey}`}
        description={`Practice German listening comprehension at level ${levelKey} with native speaker audio exercises and comprehension questions.`}
        path={`/listening/${(level || '').toLowerCase()}`}
      />
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/listening')} className="mb-4 -ml-3">
          <ArrowLeft size={18} />
          {isGerman ? 'Alle Stufen' : 'All Levels'}
        </Button>

        {/* Header */}
        <div className="relative overflow-hidden rounded-clay mb-8 -mx-2 px-2 py-5 sm:-mx-4 sm:px-4">
          <Aurora variant="close" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-clay bg-siegel text-white shadow-raise-siegel flex items-center justify-center flex-shrink-0">
              <Headphones size={28} />
            </div>
            <div className="min-w-0">
              <SectionHeading level={1} title={levelKey} lead={subtitle} />
            </div>
          </div>
        </div>

        {/* Exercises list */}
        {exercises.length === 0 ? (
          <EmptyState title={isGerman ? 'Noch keine Übungen verfügbar.' : 'No exercises available yet.'} />
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <Reveal key={exercise.id} delay={80 * index}>
                <ExerciseCard exercise={exercise} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelExercises;
