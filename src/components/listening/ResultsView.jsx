import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, RotateCcw, ArrowLeft, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { getPerformanceMessage, getLevelTheme, getAnswerKey } from '../../utils/listeningHelpers';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import QuestionCard from './QuestionCard';
import DialogueTranscript from './DialogueTranscript';
import CompletionMoment from '../CompletionMoment';

const ResultsView = ({ exercise, questions, answers, score, dialogues, playsUsed, onRetry, nextExerciseHref }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isGerman = i18n.language === 'de';
  const { user } = useAuth();
  const { isInFreeTrial, hasActiveSubscription } = useSubscription();
  const showUpgradeCta = user && isInFreeTrial() && !hasActiveSubscription();
  const theme = getLevelTheme(exercise.level);
  const message = getPerformanceMessage(score);
  const correctCount = questions.filter((q) => getAnswerKey(answers[q.id || q.question_number]) === q.correct_answer).length;

  // Animated circle progress
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-slate-200 p-8 text-center"
      >
        {/* Animated score circle */}
        <div className="relative w-36 h-36 mx-auto mb-5">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" strokeWidth="8" />
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={theme.primary}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-bold text-slate-800"
            >
              {score}%
            </motion.span>
          </div>
        </div>

        {/* Performance message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy size={20} style={{ color: theme.primary }} />
            <h3 className="text-xl font-display font-semibold text-slate-800">
              {isGerman ? message.de : message.en}
            </h3>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle size={14} className="text-emerald-500" />
              {correctCount} {isGerman ? 'richtig' : 'correct'}
            </span>
            <span className="flex items-center gap-1">
              <XCircle size={14} className="text-rose-400" />
              {questions.length - correctCount} {isGerman ? 'falsch' : 'wrong'}
            </span>
          </div>
          {playsUsed != null && (
            <p className="text-xs text-slate-400 mt-2">
              {isGerman ? `${playsUsed}x abgespielt` : `Played ${playsUsed} time${playsUsed !== 1 ? 's' : ''}`}
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* Forward motion first — the loop used to end at "Back / Try Again" */}
      <CompletionMoment
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
        <h4 className="font-display font-semibold text-slate-700">
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
        <button
          onClick={() => navigate(`/listening/${String(exercise.level ?? '').toLowerCase()}`)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={18} />
          {isGerman ? 'Zurück' : 'Back'}
        </button>
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white transition-colors"
          style={{ backgroundColor: theme.primary }}
        >
          <RotateCcw size={18} />
          {isGerman ? 'Nochmal' : 'Try Again'}
        </button>
      </div>

      {/* Upgrade CTA for trial users */}
      {showUpgradeCta && score >= 50 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="bg-siegel-wash rounded-2xl border border-siegel/25 p-5 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles size={16} className="text-siegel" />
            <span className="font-semibold text-siegel-deep text-sm">
              {isGerman ? 'DeutschMeister gefällt dir?' : 'Enjoying DeutschMeister?'}
            </span>
          </div>
          <p className="text-xs text-siegel-deep/80 mb-3">
            {isGerman
              ? 'Abonniere, um nach deinem Test weiter zu lernen.'
              : 'Subscribe to keep learning after your trial ends.'}
          </p>
          <a
            href="/pricing/"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-siegel text-white text-sm font-semibold hover:bg-siegel-lift active:bg-siegel-deep transition-colors"
          >
            {isGerman ? 'Jetzt upgraden' : 'Upgrade to Pro'}
          </a>
        </motion.div>
      )}
    </div>
  );
};

export default ResultsView;
