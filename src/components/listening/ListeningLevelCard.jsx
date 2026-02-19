import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Headphones, CheckCircle, ChevronRight } from 'lucide-react';
import { getLevelTheme, getLevelSubtitle } from '../../utils/listeningHelpers';
import { useTranslation } from 'react-i18next';

const ListeningLevelCard = ({ level, totalExercises, completedExercises, index }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const theme = getLevelTheme(level);
  const subtitle = getLevelSubtitle(level, i18n.language);
  const progress = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
  const isComplete = totalExercises > 0 && completedExercises === totalExercises;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={() => navigate(`/listening/${level}`)}
      className="relative cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: theme.primary }}
      />

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${theme.primary}15` }}
        >
          <Headphones size={24} style={{ color: theme.primary }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-lg text-slate-800">{level}</h3>
            {isComplete && <CheckCircle size={16} className="text-emerald-500" />}
          </div>
          <p className="text-sm text-slate-500 mb-3">{subtitle}</p>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mb-1.5">
            <motion.div
              className="h-2 rounded-full"
              style={{ backgroundColor: theme.primary }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{completedExercises}/{totalExercises} exercises</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight size={20} className="text-slate-300 flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
};

export default ListeningLevelCard;
