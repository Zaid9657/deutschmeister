import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLevelExercises } from '../../hooks/useListening';
import { getLevelTheme, getLevelSubtitle } from '../../utils/listeningHelpers';
import ExerciseCard from '../../components/listening/ExerciseCard';

const LevelExercises = () => {
  const { level } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { exercises, loading } = useLevelExercises(level);
  const theme = getLevelTheme(level);
  const subtitle = getLevelSubtitle(level, i18n.language);
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
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/listening')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          {isGerman ? 'Alle Stufen' : 'All Levels'}
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${theme.primary}15` }}
          >
            <Headphones size={28} style={{ color: theme.primary }} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-800">{level}</h1>
            <p className="text-slate-500">{subtitle}</p>
          </div>
        </motion.div>

        {/* Exercises list */}
        {exercises.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Headphones size={48} className="mx-auto mb-4 opacity-30" />
            <p>{isGerman ? 'Noch keine Übungen verfügbar.' : 'No exercises available yet.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <ExerciseCard key={exercise.id} exercise={exercise} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LevelExercises;
