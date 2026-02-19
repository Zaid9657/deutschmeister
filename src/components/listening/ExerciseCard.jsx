import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Headphones, CheckCircle, ChevronRight, Clock } from 'lucide-react';
import { getLevelTheme, formatDuration } from '../../utils/listeningHelpers';
import { useTranslation } from 'react-i18next';

const ExerciseCard = ({ exercise, index }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const theme = getLevelTheme(exercise.level);
  const isCompleted = exercise.progress?.completed;
  const score = exercise.progress?.score;
  const isGerman = i18n.language === 'de';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={() => navigate(`/listening/${exercise.level}/${exercise.exercise_number}`)}
      className={`relative cursor-pointer rounded-xl border p-4 shadow-sm hover:shadow-md transition-all ${
        isCompleted ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Exercise number */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-semibold text-sm"
          style={{
            backgroundColor: isCompleted ? '#d1fae5' : `${theme.primary}15`,
            color: isCompleted ? '#059669' : theme.primary,
          }}
        >
          {isCompleted ? <CheckCircle size={20} /> : exercise.exercise_number}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-800">
            {exercise.title || `${isGerman ? 'Übung' : 'Exercise'} ${exercise.exercise_number}`}
          </h4>
          {exercise.description && (
            <p className="text-sm text-slate-500 truncate">{exercise.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {exercise.duration_seconds && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={12} />
                {formatDuration(exercise.duration_seconds)}
              </span>
            )}
            {exercise.difficulty && (
              <span className="text-xs text-slate-400 capitalize">{exercise.difficulty}</span>
            )}
            {isCompleted && score != null && (
              <span className={`text-xs font-medium ${score >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {score}%
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
      </div>
    </motion.div>
  );
};

export default ExerciseCard;
