import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Lock, ChevronRight, Sun, TreePine, Waves, Moon } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';

const iconMap = {
  a1: Sun,
  a2: TreePine,
  b1: Waves,
  b2: Moon,
};

const LevelCard = ({ level }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getLevelProgress, isLevelUnlocked, UNLOCK_THRESHOLD } = useProgress();
  const { getThemeForLevel } = useTheme();

  const progress = getLevelProgress(level);
  const unlocked = isLevelUnlocked(level);
  const theme = getThemeForLevel(level);
  const Icon = iconMap[level];

  const levelKey = level.toLowerCase();
  const previousLevel = level === 'a1' ? null : ['a1', 'a2', 'b1', 'b2'][['a1', 'a2', 'b1', 'b2'].indexOf(level) - 1];

  const handleClick = () => {
    if (unlocked) {
      navigate(`/level/${level}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={unlocked ? { scale: 1.02, y: -4 } : {}}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className={`relative overflow-hidden rounded-2xl ${
        unlocked ? 'cursor-pointer' : 'cursor-not-allowed'
      }`}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} ${
          !unlocked ? 'opacity-30 grayscale' : 'opacity-100'
        }`}
      />

      {/* Content */}
      <div className="relative p-6 sm:p-8">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ${
              !unlocked ? 'opacity-50' : ''
            }`}
          >
            {unlocked ? (
              <Icon className="w-7 h-7 text-white" />
            ) : (
              <Lock className="w-7 h-7 text-white" />
            )}
          </div>
          {unlocked && (
            <motion.div
              whileHover={{ x: 4 }}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </motion.div>
          )}
        </div>

        <h3
          className={`font-display text-2xl font-semibold text-white mb-1 ${
            !unlocked ? 'opacity-70' : ''
          }`}
        >
          {t(`levels.${levelKey}.name`)}
        </h3>
        <p
          className={`text-white/80 text-sm mb-1 ${
            !unlocked ? 'opacity-60' : ''
          }`}
        >
          {t(`levels.${levelKey}.theme`)}
        </p>
        <p
          className={`text-white/70 text-sm mb-6 ${
            !unlocked ? 'opacity-50' : ''
          }`}
        >
          {t(`levels.${levelKey}.description`)}
        </p>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={`text-white/90 ${!unlocked ? 'opacity-60' : ''}`}>
              {t('dashboard.progress')}
            </span>
            <span className={`text-white font-medium ${!unlocked ? 'opacity-60' : ''}`}>
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full bg-white rounded-full ${!unlocked ? 'opacity-50' : ''}`}
            />
          </div>
        </div>

        {/* Locked message */}
        {!unlocked && previousLevel && (
          <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg">
            <p className="text-white/80 text-sm text-center">
              {t('dashboard.unlockRequirement', {
                percent: UNLOCK_THRESHOLD,
                level: previousLevel.toUpperCase(),
              })}
            </p>
          </div>
        )}

        {/* Action button */}
        {unlocked && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-4 w-full py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium hover:bg-white/30 transition-colors"
          >
            {progress > 0 ? t('dashboard.continue') : t('dashboard.start')}
          </motion.button>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute -top-8 -left-8 w-24 h-24 bg-white/5 rounded-full" />
    </motion.div>
  );
};

export default LevelCard;
