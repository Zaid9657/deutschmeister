import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const DifficultyDots = ({ difficulty }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((dot) => (
        <div
          key={dot}
          className={`w-1.5 h-1.5 rounded-full ${
            dot <= difficulty ? 'bg-amber-400' : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
};

const ReadingLessonCard = ({ lesson, level, index, isCompleted }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { getThemeForLevel } = useTheme();

  const theme = getThemeForLevel(level);
  const isGerman = i18n.language === 'de';

  const handleClick = () => {
    navigate(`/reading/${level}/${lesson.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className={`relative bg-white rounded-xl border shadow-sm overflow-hidden cursor-pointer hover:shadow-md ${
        isCompleted ? 'border-emerald-200' : 'border-slate-200'
      }`}
    >
      {isCompleted && (
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.gradient}`} />
      )}

      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Order number */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
              isCompleted
                ? `bg-gradient-to-br ${theme.gradient} text-white`
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span className="font-bold">{index + 1}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate text-slate-800">
                {isGerman ? lesson.titleDe : lesson.titleEn}
              </h3>
            </div>

            {/* Topic badge */}
            {lesson.topic && (
              <span className="inline-block px-2 py-0.5 rounded-full text-xs mb-2 bg-slate-100 text-slate-600">
                {lesson.topic}
              </span>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{lesson.wordCount} {isGerman ? 'Wörter' : 'words'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{lesson.estimatedReadingTime} min</span>
              </div>
              <DifficultyDots difficulty={lesson.difficulty} />
              {isCompleted && (
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isGerman ? 'Abgeschlossen' : 'Completed'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action indicator */}
          {!isCompleted && (
            <motion.div whileHover={{ x: 4 }} className="flex-shrink-0 self-center">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ReadingLessonCard;
