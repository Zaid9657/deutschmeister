import { motion } from 'framer-motion';
import { Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useListeningLevels } from '../../hooks/useListening';
import ListeningLevelCard from '../../components/listening/ListeningLevelCard';

const ListeningHome = () => {
  const { t, i18n } = useTranslation();
  const { levels, loading } = useListeningLevels();
  const isGerman = i18n.language === 'de';

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
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
  );
};

export default ListeningHome;
