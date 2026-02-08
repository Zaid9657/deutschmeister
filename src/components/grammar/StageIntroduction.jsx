import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle, Globe, MessageCircle, Sparkles, Target } from 'lucide-react';

const StageIntroduction = ({ content, isGerman, theme }) => {
  if (!content) {
    return (
      <div className="text-center py-8 text-slate-500">
        {isGerman ? 'Inhalt wird geladen...' : 'Loading content...'}
      </div>
    );
  }

  // Check if this is the NEW RICH FORMAT (has hook, englishComparison, etc.)
  const isRichFormat = content.hook && content.englishComparison;

  if (isRichFormat) {
    // NEW RICH FORMAT
    return (
      <div className="space-y-6">
        {/* Hook - Engaging Opening */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200"
        >
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <p className="text-blue-900 leading-relaxed text-lg">
                {isGerman ? content.hook.de : content.hook.en}
              </p>
            </div>
          </div>
        </motion.div>

        {/* English Comparison vs German Difference */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-4"
        >
          {/* How English Works */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-slate-600" />
              <h4 className="font-semibold text-slate-800">
                {isGerman ? 'Wie Englisch es macht' : 'How English Works'}
              </h4>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed">
              {isGerman ? content.englishComparison.de : content.englishComparison.en}
            </p>
          </div>

          {/* How German Does It */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-amber-700" />
              <h4 className="font-semibold text-amber-900">
                {isGerman ? 'Wie Deutsch es macht' : 'How German Does It'}
              </h4>
            </div>
            <p className="text-amber-900 text-sm leading-relaxed font-medium">
              {isGerman ? content.germanDifference.de : content.germanDifference.en}
            </p>
          </div>
        </motion.div>

        {/* Preview Example */}
        {content.previewExample && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 border-2 border-emerald-200 shadow-sm"
          >
            <h4 className="font-semibold text-emerald-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {isGerman ? 'Vorschau-Beispiel' : 'Preview Example'}
            </h4>
            <div className="space-y-2">
              <p className="text-lg text-slate-800 font-medium">
                {content.previewExample.german.split(content.previewExample.highlight).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="bg-emerald-200 text-emerald-900 px-1 rounded font-bold">
                        {content.previewExample.highlight}
                      </span>
                    )}
                  </span>
                ))}
              </p>
              <p className="text-slate-600 italic">
                {content.previewExample.english}
              </p>
            </div>
          </motion.div>
        )}

        {/* When You'll Use This */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-purple-50 rounded-xl p-5 border border-purple-200"
        >
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-purple-800 mb-2">
                {isGerman ? 'Wann du das brauchst' : 'When You\'ll Use This'}
              </h4>
              <p className="text-purple-900 leading-relaxed">
                {isGerman ? content.scenario.de : content.scenario.en}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Why It Matters - Motivational Closing */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-200"
        >
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-rose-800 mb-2">
                {isGerman ? 'Warum das wichtig ist' : 'Why This Matters'}
              </h4>
              <p className="text-rose-900 leading-relaxed">
                {isGerman ? content.whyItMatters.de : content.whyItMatters.en}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Encouragement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center pt-4"
        >
          <p className="text-sm text-slate-500">
            {isGerman
              ? 'Bereit? Klicke "Weiter" um Beispiele zu sehen.'
              : 'Ready? Click "Continue" to see examples.'}
          </p>
        </motion.div>
      </div>
    );
  }

  // OLD FORMAT (fallback for non-upgraded topics)
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
