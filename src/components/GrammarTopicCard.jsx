import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, CheckCircle, Circle, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { isLevelFree } from '../config/freeTier';
import Card from './ui/Card.jsx';
import Chip from './ui/Chip.jsx';

const GrammarTopicCard = ({ topic, level, isCompleted, progress = 0 }) => {
  const { i18n } = useTranslation();

  const { user } = useAuth();
  const { hasLevelAccess } = useSubscription();
  const isGerman = i18n.language === 'de';
  const free = isLevelFree(level);
  const locked = !free && !(user && hasLevelAccess(level));

  const handleClick = () => {
    // The lesson is served by the Astro build (one lesson, one URL) — a
    // client-side navigate would hit a route the SPA no longer carries.
    window.location.assign(`/grammar/${level}/${topic.slug}/`);
  };

  // Status marks: limette for "done" (the success token), aprikose for
  // "in progress" (attention). Never a level colour — colour means case.
  const getStatusIcon = () => {
    if (isCompleted) {
      return <CheckCircle className="w-5 h-5 text-accent-limette" />;
    }
    if (progress > 0) {
      return <Circle className="w-5 h-5 text-accent-aprikose" style={{ strokeDasharray: '100', strokeDashoffset: 100 - progress }} />;
    }
    return <Circle className="w-5 h-5 text-rule" />;
  };

  const getStatusText = () => {
    if (isCompleted) return isGerman ? 'Abgeschlossen' : 'Completed';
    if (progress > 0) return isGerman ? 'In Bearbeitung' : 'In Progress';
    return isGerman ? 'Nicht gestartet' : 'Not Started';
  };

  return (
    <Card
      interactive
      edge={isCompleted ? 'limette' : 'paper'}
      onClick={handleClick}
      className="relative overflow-hidden cursor-pointer"
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Order number with status */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-clay flex items-center justify-center font-data ${
            isCompleted
              ? 'bg-accent-limette-wash text-accent-limette-ink'
              : 'bg-paper-sunk text-graphite'
          }`}>
            <span className="font-bold">{topic.order}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate text-ink">
                {isGerman ? topic.titleDe : topic.titleEn}
              </h3>
              {locked && <Lock className="w-3.5 h-3.5 text-graphite flex-shrink-0" />}
              {free && !isCompleted && (
                <Chip tone="limette" className="flex-shrink-0">FREE</Chip>
              )}
            </div>

            <p className="text-sm line-clamp-2 text-graphite">
              {isGerman ? topic.descriptionDe : topic.descriptionEn}
            </p>

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1 font-data text-[0.8125rem] text-graphite">
                <Clock className="w-3.5 h-3.5" />
                <span>{topic.estimatedTime} min</span>
              </div>
              <div className="flex items-center gap-1.5 text-[0.8125rem]">
                {getStatusIcon()}
                <span className={isCompleted ? 'text-accent-limette-ink' : 'text-graphite'}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>

          {/* Action indicator */}
          {!isCompleted && (
            <motion.div
              whileHover={{ x: 4 }}
              className="flex-shrink-0 self-center"
            >
              <ChevronRight className="w-5 h-5 text-siegel" />
            </motion.div>
          )}
        </div>

        {/* Progress bar for in-progress topics */}
        {progress > 0 && !isCompleted && (
          <div className="mt-3 pt-3 border-t border-rule">
            <div className="flex items-center justify-between font-data text-[0.8125rem] text-graphite mb-1">
              <span>{isGerman ? 'Fortschritt' : 'Progress'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-paper-sunk rounded-pill overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-siegel rounded-pill"
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default GrammarTopicCard;
