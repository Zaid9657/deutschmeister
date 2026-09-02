import { useNavigate } from 'react-router-dom';
import { Trophy, RotateCcw, ArrowLeft, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { getPerformanceMessage, getAnswerKey } from '../../utils/listeningHelpers';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import QuestionCard from './QuestionCard';
import DialogueTranscript from './DialogueTranscript';
import CompletionMoment from '../CompletionMoment';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';
import Stat from '../ui/Stat.jsx';
import Reveal from '../ui/Reveal.jsx';

// The pass line this screen already used everywhere else: 70% is the score at
// which getPerformanceMessage stops saying "keep practicing" and ExerciseCard
// stops flagging the result. Playful Depth (docs/design/playbook.md) says pass
// = celebrate, fail = calm — so it is also what gates the confetti.
const PASS_SCORE = 70;

const ResultsView = ({ exercise, questions, answers, score, dialogues, playsUsed, onRetry, nextExerciseHref }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';
  const { user } = useAuth();
  const { isInFreeTrial, hasActiveSubscription } = useSubscription();
  const showUpgradeCta = user && isInFreeTrial() && !hasActiveSubscription();
  const message = getPerformanceMessage(score);
  const correctCount = questions.filter((q) => getAnswerKey(answers[q.id || q.question_number]) === q.correct_answer).length;
  const passed = score >= PASS_SCORE;

  return (
    <div className="space-y-6">
      {/* Score card */}
      <Reveal>
        <Card raised edge={passed ? 'limette' : 'paper'} className="p-8 text-center">
          <Stat value={score} suffix="%" size="lg" className="mb-4" />

          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy size={20} className={passed ? 'text-accent-limette-ink' : 'text-siegel'} />
            <h3 className="font-display text-xl font-semibold text-ink">
              {isGerman ? message.de : message.en}
            </h3>
          </div>

          <div className="flex items-center justify-center gap-4 font-data text-[0.8125rem] text-graphite">
            <span className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-accent-limette-ink" />
              {correctCount} {isGerman ? 'richtig' : 'correct'}
            </span>
            <span className="flex items-center gap-1.5">
              <XCircle size={14} className="text-accent-himbeer-ink" />
              {questions.length - correctCount} {isGerman ? 'falsch' : 'wrong'}
            </span>
          </div>
          {playsUsed != null && (
            <p className="font-data text-[0.6875rem] text-graphite mt-2">
              {isGerman ? `${playsUsed}x abgespielt` : `Played ${playsUsed} time${playsUsed !== 1 ? 's' : ''}`}
            </p>
          )}
        </Card>
      </Reveal>

      {/* Forward motion first — the loop used to end at "Back / Try Again" */}
      <CompletionMoment
        celebrate={passed}
        headline={isGerman ? 'Übung abgeschlossen!' : 'Exercise complete!'}
        detail={
          isGerman
            ? 'Das zählt für deinen Streak und dein Tagesziel.'
            : 'That counts toward your streak and daily goal.'
        }
        nextLabel={
          nextExerciseHref
            ? (isGerman ? 'Nächste Übung' : 'Next exercise')
            : (isGerman ? 'Alle Übungen' : 'All exercises')
        }
        nextHref={nextExerciseHref || `/listening/${String(exercise.level ?? '').toLowerCase()}`}
      />

      {/* Transcript */}
      {dialogues && dialogues.length > 0 && (
        <DialogueTranscript dialogues={dialogues} />
      )}

      {/* Question review */}
      <div className="space-y-4">
        <h4 className="font-display text-[1.0625rem] font-semibold text-ink">
          {isGerman ? 'Fragen-Überprüfung' : 'Question Review'}
        </h4>
        {questions.map((q, i) => (
          <QuestionCard
            key={q.id || q.question_number}
            question={q}
            selectedAnswer={answers[q.id || q.question_number]}
            showResult
            index={i}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={() => navigate(`/listening/${String(exercise.level ?? '').toLowerCase()}`)}
        >
          <ArrowLeft size={18} />
          {isGerman ? 'Zurück' : 'Back'}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onRetry}>
          <RotateCcw size={18} />
          {isGerman ? 'Nochmal' : 'Try Again'}
        </Button>
      </div>

      {/* Upgrade CTA for trial users */}
      {showUpgradeCta && score >= 50 && (
        <Reveal>
          <Card tone="wash" className="p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles size={16} className="text-siegel" />
              <span className="font-bold text-siegel-deep text-sm">
                {isGerman ? 'DeutschMeister gefällt dir?' : 'Enjoying DeutschMeister?'}
              </span>
            </div>
            <p className="text-xs text-graphite mb-3">
              {isGerman
                ? 'Abonniere, um nach deinem Test weiter zu lernen.'
                : 'Subscribe to keep learning after your trial ends.'}
            </p>
            <Button href="/pricing/" size="sm">
              {isGerman ? 'Jetzt upgraden' : 'Upgrade to Pro'}
            </Button>
          </Card>
        </Reveal>
      )}
    </div>
  );
};

export default ResultsView;
