import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, Clock } from 'lucide-react';
import { formatDuration } from '../../utils/listeningHelpers';
import { useTranslation } from 'react-i18next';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';

// One exercise row: an interactive clay card. The level hue it used to take
// from getLevelTheme is gone (design-tokens.js rule 1) — a completed exercise
// is marked by the limette success accent and a check, never by colour alone.
const ExerciseCard = ({ exercise }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isCompleted = exercise.progress?.completed;
  const score = exercise.progress?.score;
  const isGerman = i18n.language === 'de';

  return (
    <Card
      interactive
      as="button"
      type="button"
      edge={isCompleted ? 'limette' : 'paper'}
      onClick={() => navigate(`/listening/${String(exercise.level ?? '').toLowerCase()}/${exercise.exercise_number}`)}
      className="block w-full p-4 text-left"
    >
      <div className="flex items-center gap-4">
        {/* Exercise number */}
        <div
          className={`w-10 h-10 rounded-clay flex items-center justify-center flex-shrink-0 font-data text-sm font-bold ${
            isCompleted ? 'bg-accent-limette-wash text-accent-limette-ink' : 'bg-siegel-wash text-siegel-deep'
          }`}
        >
          {isCompleted ? <CheckCircle size={20} /> : exercise.exercise_number}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-ink">
            {exercise.title || `${isGerman ? 'Übung' : 'Exercise'} ${exercise.exercise_number}`}
          </h4>
          {exercise.description && (
            <p className="text-sm text-graphite truncate">{exercise.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {exercise.duration_seconds && (
              <span className="flex items-center gap-1 font-data text-[0.6875rem] text-graphite">
                <Clock size={12} />
                {formatDuration(exercise.duration_seconds)}
              </span>
            )}
            {exercise.difficulty && (
              <span className="font-data text-[0.6875rem] text-graphite capitalize">{exercise.difficulty}</span>
            )}
            {isCompleted && score != null && (
              <Chip tone={score >= 70 ? 'limette' : 'aprikose'}>{score}%</Chip>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight size={18} className="text-graphite flex-shrink-0" />
      </div>
    </Card>
  );
};

export default ExerciseCard;
