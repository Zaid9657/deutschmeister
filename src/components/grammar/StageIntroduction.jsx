import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle } from 'lucide-react';

const StageIntroduction = ({ content, isGerman, theme }) => {
  if (!content) {
    return (
      <div className="text-center py-8 text-slate-500">
        {isGerman ? 'Inhalt wird geladen...' : 'Loading content...'}
      </div>
    );
  }

  const { title, introduction, keyPoints } = content;

  return (
    <div className="space-y-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-2xl font-display font-bold text-slate-800 mb-2">
          {isGerman ? title.de : title.en}
        </h3>
      </motion.div>

      {/* Introduction Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-blue-50 rounded-xl p-5 border border-blue-100"
      >
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-2">
              {isGerman ? 'Überblick' : 'Overview'}
            </h4>
            <p className="text-blue-900 leading-relaxed">
              {isGerman ? introduction.de : introduction.en}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Points */}
      {keyPoints && keyPoints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            {isGerman ? 'Wichtige Punkte' : 'Key Points'}
          </h4>
          <div className="space-y-2">
            {keyPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                <p className="text-slate-700">
                  {isGerman ? point.de : point.en}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Encouragement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-4"
      >
        <p className="text-sm text-slate-500">
          {isGerman
            ? 'Lies dir diese Konzepte durch, dann klicke "Weiter" für Beispiele.'
            : 'Read through these concepts, then click "Continue" to see examples.'}
        </p>
      </motion.div>
    </div>
  );
};

export default StageIntroduction;
