import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, Sun, TreePine, Waves, Moon } from 'lucide-react';
import { useProgress } from '../contexts/ProgressContext';
import { useTheme } from '../contexts/ThemeContext';
import { levelThemes as contentLevelThemes } from '../data/content';

const iconMap = {
  'a1.1': Sun,
  'a1.2': Sun,
  'a2.1': TreePine,
  'a2.2': TreePine,
  'b1.1': Waves,
  'b1.2': Waves,
  'b2.1': Moon,
  'b2.2': Moon,
};

const LevelCard = ({ level }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getLevelProgress } = useProgress();
  const { getThemeForLevel } = useTheme();

  const progress = getLevelProgress(level);
  const theme = getThemeForLevel(level);
  const Icon = iconMap[level] || Sun;
  const levelInfo = contentLevelThemes[level] || {};

  const handleClick = () => {
    navigate(`/level/${level}`);
  };

  // Format level for display (a1.1 -> A1.1)
  const displayLevel = level.toUpperCase();
  const part = levelInfo.part || (level.endsWith('.1') ? 1 : 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className="relative overflow-hidden rounded-2xl cursor-pointer"
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}
      />

      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            {/* Part indicator badge */}
            <div className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
              Part {part}
            </div>
          </div>
          <motion.div
            whileHover={{ x: 4 }}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        <h3 className="font-display text-xl font-semibold text-white mb-1">
          {t(`levels.${level}.name`, { defaultValue: displayLevel })}
        </h3>
        <p className="text-white/80 text-sm mb-1">
          {t(`levels.${level}.theme`, { defaultValue: levelInfo.name || '' })}
        </p>
        <p className="text-white/70 text-xs mb-4 line-clamp-2">
          {t(`levels.${level}.description`, { defaultValue: levelInfo.description || '' })}
        </p>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/90">
              {t('dashboard.progress')}
            </span>
            <span className="text-white font-medium">
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>

        {/* Action button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-3 w-full py-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium text-sm hover:bg-white/30 transition-colors"
        >
          {progress > 0 ? t('dashboard.continue') : t('dashboard.start')}
        </motion.button>
      </div>

      {/* Decorative elements */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full" />
      <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
    </motion.div>
  );
};

export default LevelCard;
