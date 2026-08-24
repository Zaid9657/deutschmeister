import { motion } from 'framer-motion';
import { Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useListeningLevels } from '../../hooks/useListening';
import DataState from '../../components/DataState';
import ListeningLevelCard from '../../components/listening/ListeningLevelCard';
import SEO from '../../components/SEO';
import { seoProps } from '../../data/seoRoutes.js';

const ListeningHome = () => {
  const { t, i18n } = useTranslation();
  const { levels, loading, error, retry } = useListeningLevels();
  const isGerman = i18n.language === 'de';

  if (loading || error) {
    return (
      <div className="min-h-screen pt-24">
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
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
            <Headphones size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-800 mb-2">
            {isGerman ? 'Hörverständnis' : 'Listening Comprehension'}
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            {isGerman
              ? 'Verbessere dein Hörverständnis mit authentischen Dialogen und Übungen.'
              : 'Improve your listening skills with authentic dialogues and exercises.'}
          </p>
        </motion.div>

        {/* Level grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {levels.map((level, index) => (
            <ListeningLevelCard
              key={level.level}
              level={level.level}
              totalExercises={level.totalExercises}
              completedExercises={level.completedExercises}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default ListeningHome;
