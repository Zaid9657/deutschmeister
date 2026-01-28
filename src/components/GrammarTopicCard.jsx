import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Lock, ChevronRight, Clock, CheckCircle, Circle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const GrammarTopicCard = ({ topic, level, isUnlocked, isCompleted, progress = 0 }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { getThemeForLevel } = useTheme();

  const theme = getThemeForLevel(level);
  const isGerman = i18n.language === 'de';

  const handleClick = () => {
    if (isUnlocked) {
      // Phase 2: Navigate to lesson page
      // navigate(`/grammar/${level}/${topic.slug}`);
      console.log('Topic clicked:', topic.slug);
    }
  };

  // Determine status icon and colors
  const getStatusIcon = () => {
    if (isCompleted) {
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    }
    if (!isUnlocked) {
      return <Lock className="w-5 h-5 text-slate-400" />;
    }
    if (progress > 0) {
      return <Circle className="w-5 h-5 text-amber-500" style={{ strokeDasharray: '100', strokeDashoffset: 100 - progress }} />;
    }
    return <Circle className="w-5 h-5 text-slate-300" />;
  };

  const getStatusText = () => {
    if (isCompleted) return isGerman ? 'Abgeschlossen' : 'Completed';
    if (!isUnlocked) return isGerman ? 'Gesperrt' : 'Locked';
    if (progress > 0) return isGerman ? 'In Bearbeitung' : 'In Progress';
    return isGerman ? 'Nicht gestartet' : 'Not Started';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isUnlocked ? { scale: 1.01, y: -2 } : {}}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className={`relative bg-white rounded-xl border shadow-sm overflow-hidden ${
        isUnlocked ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed opacity-60'
      } ${isCompleted ? 'border-emerald-200' : 'border-slate-200'}`}
    >
      {/* Completed indicator bar */}
      {isCompleted && (
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`} />
      )}

      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Order number with status */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
            isCompleted
              ? `bg-gradient-to-br ${theme.gradient} text-white`
              : isUnlocked
                ? 'bg-slate-100 text-slate-600'
                : 'bg-slate-50 text-slate-400'
          }`}>
            <span className="font-bold">{topic.order}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold truncate ${
                isUnlocked ? 'text-slate-800' : 'text-slate-500'
              }`}>
                {isGerman ? topic.titleDe : topic.titleEn}
              </h3>
            </div>

            <p className={`text-sm line-clamp-2 ${
              isUnlocked ? 'text-slate-600' : 'text-slate-400'
            }`}>
              {isGerman ? topic.descriptionDe : topic.descriptionEn}
            </p>

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{topic.estimatedTime} min</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {getStatusIcon()}
                <span className={isCompleted ? 'text-emerald-600' : 'text-slate-500'}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>

          {/* Action indicator */}
          {isUnlocked && !isCompleted && (
            <motion.div
              whileHover={{ x: 4 }}
              className="flex-shrink-0 self-center"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </motion.div>
          )}

          {/* Lock icon for locked topics */}
          {!isUnlocked && (
            <div className="flex-shrink-0 self-center">
              <Lock className="w-5 h-5 text-slate-300" />
            </div>
          )}
        </div>

        {/* Progress bar for in-progress topics */}
        {isUnlocked && progress > 0 && !isCompleted && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{isGerman ? 'Fortschritt' : 'Progress'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`h-full bg-gradient-to-r ${theme.gradient} rounded-full`}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GrammarTopicCard;
