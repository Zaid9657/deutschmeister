import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

const QuestionCard = ({ question, selectedAnswer, onAnswer, showResult = false, index }) => {
  const isMultipleChoice = question.question_type === 'multiple_choice';
  const isRichtigFalsch = question.question_type === 'richtig_falsch';

  const options = isRichtigFalsch
    ? ['Richtig', 'Falsch']
    : [question.option_a, question.option_b, question.option_c, question.option_d].filter(Boolean);

  const optionLabels = isRichtigFalsch
    ? ['Richtig', 'Falsch']
    : ['A', 'B', 'C', 'D'];

  const isCorrect = selectedAnswer === question.correct_answer;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-slate-200 p-5"
    >
      {/* Question header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
          {question.question_number}
        </span>
        <p className="text-slate-800 font-medium leading-relaxed">{question.question_text}</p>
      </div>

      {/* Options */}
      <div className="space-y-2 ml-10">
        {options.map((option, i) => {
          const optionValue = isRichtigFalsch ? option : optionLabels[i];
          const isSelected = selectedAnswer === optionValue;
          const isCorrectOption = question.correct_answer === optionValue;

          let borderColor = 'border-slate-200';
          let bgColor = 'bg-white hover:bg-slate-50';
          let textColor = 'text-slate-700';

          if (showResult) {
            if (isCorrectOption) {
              borderColor = 'border-emerald-300';
              bgColor = 'bg-emerald-50';
              textColor = 'text-emerald-700';
            } else if (isSelected && !isCorrectOption) {
              borderColor = 'border-rose-300';
              bgColor = 'bg-rose-50';
              textColor = 'text-rose-700';
            }
          } else if (isSelected) {
            borderColor = 'border-indigo-300';
            bgColor = 'bg-indigo-50';
            textColor = 'text-indigo-700';
          }

          return (
            <button
              key={i}
              onClick={() => !showResult && onAnswer(question.question_number, optionValue)}
              disabled={showResult}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${borderColor} ${bgColor} ${textColor} ${
                showResult ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-medium">
                {isRichtigFalsch ? (option === 'Richtig' ? 'R' : 'F') : optionLabels[i]}
              </span>
              <span className="flex-1">{option}</span>
              {showResult && isCorrectOption && <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />}
              {showResult && isSelected && !isCorrectOption && <XCircle size={18} className="text-rose-500 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Explanation (shown after submit) */}
      {showResult && question.explanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 ml-10 p-3 rounded-lg bg-slate-50 border border-slate-200"
        >
          <p className="text-sm text-slate-600">{question.explanation}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default QuestionCard;
