import { useNavigate } from 'react-router-dom';
import { Headphones, CheckCircle, ChevronRight, Lock } from 'lucide-react';
import { getLevelSubtitle } from '../../utils/listeningHelpers';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { isLevelFree } from '../../config/freeTier';
import Card from '../ui/Card.jsx';
import Chip from '../ui/Chip.jsx';

// One level in the /listening picker: an interactive clay card.
//
// The per-level hue this card used to paint (getLevelTheme's eight-colour CEFR
// ramp) is gone: design-tokens.js rule 1 reserves colour for case, so the
// level is carried by a `<Chip tone="label">` code on a neutral surface, and
// progress rides the one interactive colour.
const ListeningLevelCard = ({ level, totalExercises, completedExercises }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { hasAccess } = useSubscription();
  const subtitle = getLevelSubtitle(level, i18n.language);
  // `level` is the DB value ("A1.1") but routes are lowercase — lowercase it so
  // there is exactly one URL per level page.
  const levelPath = `/listening/${String(level ?? '').toLowerCase()}`;
  const free = isLevelFree(level);
  const locked = !free && !(user && hasAccess);
  const progress = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
  const isComplete = totalExercises > 0 && completedExercises === totalExercises;

  return (
    <Card
      interactive
      as="button"
      type="button"
      edge={isComplete ? 'limette' : 'paper'}
      onClick={() => navigate(levelPath)}
      className="block w-full h-full p-5 text-left"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-clay bg-siegel-wash text-siegel flex items-center justify-center flex-shrink-0"
          data-atropos-offset="6"
        >
          <Headphones size={24} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-semibold text-[1.0625rem] text-ink">{level}</h3>
            {free && <Chip tone="limette">FREE</Chip>}
            {locked && <Lock size={14} className="text-graphite" />}
            {isComplete && <CheckCircle size={16} className="text-accent-limette-ink" />}
          </div>
          <p className="text-sm text-graphite mb-3">{subtitle}</p>

          {/* Progress bar */}
          <div className="w-full h-2 mb-1.5 overflow-hidden rounded-pill bg-paper-sunk">
            <div
              className={`h-full rounded-pill ${isComplete ? 'bg-accent-limette' : 'bg-siegel'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between font-data text-[0.6875rem] text-graphite">
            <span>{completedExercises}/{totalExercises} exercises</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight size={20} className="text-graphite flex-shrink-0 mt-1" />
      </div>
    </Card>
  );
};

export default ListeningLevelCard;
