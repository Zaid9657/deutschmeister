import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Clock, CheckCircle, BookOpen } from 'lucide-react';
import Card from './ui/Card.jsx';
import Chip from './ui/Chip.jsx';

// Difficulty is energy, not semantics — the aprikose accent (design-tokens.js
// rule 2), never a level hue.
const DifficultyDots = ({ difficulty }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((dot) => (
        <div
          key={dot}
          className={`w-1.5 h-1.5 rounded-pill ${
            dot <= difficulty ? 'bg-accent-aprikose' : 'bg-rule'
          }`}
        />
      ))}
    </div>
  );
};

// One lesson in the level list: an interactive clay card that depresses when
// pressed. The gradient it used to take from the level theme is gone.
const ReadingLessonCard = ({ lesson, level, index, isCompleted }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const isGerman = i18n.language === 'de';

  const handleClick = () => {
    navigate(`/reading/${level}/${lesson.id}`);
  };

  return (
    <Card
      interactive
      as="button"
      type="button"
      edge={isCompleted ? 'limette' : 'paper'}
      onClick={handleClick}
      className="block w-full p-4 text-left"
    >
      <div className="flex items-start gap-4">
        {/* Order number */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-clay flex items-center justify-center font-data font-bold ${
            isCompleted
              ? 'bg-accent-limette-wash text-accent-limette-ink'
              : 'bg-siegel-wash text-siegel-deep'
          }`}
        >
          <span>{index + 1}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold truncate text-ink">
              {isGerman ? lesson.titleDe : lesson.titleEn}
            </h3>
          </div>

          {/* Topic badge */}
          {lesson.topic && (
            <Chip tone="quiet" className="mb-2">{lesson.topic}</Chip>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 mt-1 font-data text-[0.6875rem] text-graphite">
            <div className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{lesson.wordCount} {isGerman ? 'Wörter' : 'words'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{lesson.estimatedReadingTime} min</span>
            </div>
            <DifficultyDots difficulty={lesson.difficulty} />
            {isCompleted && (
              <div className="flex items-center gap-1 text-accent-limette-ink">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{isGerman ? 'Abgeschlossen' : 'Completed'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action indicator */}
        {!isCompleted && (
          <div className="flex-shrink-0 self-center">
            <ChevronRight className="w-5 h-5 text-graphite" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReadingLessonCard;
