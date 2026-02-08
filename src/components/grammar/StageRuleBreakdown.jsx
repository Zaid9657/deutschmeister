import { motion } from 'framer-motion';
import { Table2, Lightbulb, AlertTriangle, Sparkles, X, Check, Info } from 'lucide-react';

const StageRuleBreakdown = ({ content, isGerman, theme }) => {
  if (!content) {
    return (
      <div className="text-center py-8 text-slate-500">
        {isGerman ? 'Inhalt wird geladen...' : 'Loading content...'}
      </div>
    );
  }

  const { title, tables, tips, warnings } = content;

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

      {/* Tables */}
      {tables && tables.map((table, tableIndex) => (
        <motion.div
          key={tableIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + tableIndex * 0.1 }}
          className="space-y-4"
        >
          {/* NEW: Key Insight (if present) */}
          {table.keyInsight && (table.keyInsight.en || table.keyInsight.de) && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h5 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    {isGerman ? '🔑 Schlüsselkonzept' : '🔑 Key Insight'}
                  </h5>
                  <p className="text-indigo-800 leading-relaxed font-medium">
                    {isGerman ? table.keyInsight.de : table.keyInsight.en}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className={`bg-gradient-to-r ${theme.gradient} px-4 py-3`}>
              <div className="flex items-center gap-2">
                <Table2 className="w-5 h-5 text-white" />
                <h4 className="font-semibold text-white">
                  {isGerman ? table.title.de : table.title.en}
                </h4>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {table.headers.map((header, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-sm font-semibold text-slate-700"
                      >
                        {typeof header === 'object' ? (isGerman ? header.de : header.en) : header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`border-b border-slate-100 ${
                        rowIndex % 2 === 1 ? 'bg-slate-50/50' : ''
                      }`}
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`px-4 py-3 text-sm ${
                            cellIndex === 0 ? 'font-medium text-slate-800' : 'text-slate-600'
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* NEW: Common Mistakes (if present) */}
          {table.commonMistakes && table.commonMistakes.length > 0 && (
            <div className="space-y-3">
              <h5 className="font-semibold text-slate-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                {isGerman ? 'Häufige Fehler' : 'Common Mistakes'}
              </h5>
              {table.commonMistakes.map((mistake, mIndex) => (
                <div key={mIndex} className="grid md:grid-cols-2 gap-3">
                  {/* Wrong */}
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                        <X className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-rose-900 mb-1">
                          {isGerman ? '❌ Falsch' : '❌ Wrong'}
                        </p>
                        <p className="text-rose-800 text-sm">
                          {isGerman ? mistake.wrong_de : mistake.wrong_en}
                        </p>
                        {mistake.why_wrong_en && (
                          <p className="text-rose-700 text-xs mt-2 italic">
                            {isGerman ? mistake.why_wrong_de : mistake.why_wrong_en}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-emerald-900 mb-1">
                          {isGerman ? '✅ Richtig' : '✅ Correct'}
                        </p>
                        <p className="text-emerald-800 text-sm">
                          {isGerman ? mistake.correct_de : mistake.correct_en}
                        </p>
                        {mistake.why_correct_en && (
                          <p className="text-emerald-700 text-xs mt-2 italic">
                            {isGerman ? mistake.why_correct_de : mistake.why_correct_en}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NEW: Memory Trick (if present) */}
          {table.memoryTrick && (table.memoryTrick.en || table.memoryTrick.de) && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h5 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                    {isGerman ? '💡 Merktrick' : '💡 Memory Trick'}
                  </h5>
                  <p className="text-amber-800 leading-relaxed">
                    {isGerman ? table.memoryTrick.de : table.memoryTrick.en}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* NEW: Formal Note (if present) */}
          {table.formalNote && (table.formalNote.en || table.formalNote.de) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-blue-800 mb-1 text-sm">
                    {isGerman ? 'ℹ️ Formaler Hinweis' : 'ℹ️ Formal Note'}
                  </h5>
                  <p className="text-blue-700 text-sm">
                    {isGerman ? table.formalNote.de : table.formalNote.en}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      ))}

      {/* Tips (with memory tricks if present) */}
      {tips && tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h4 className="font-semibold text-slate-700 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            {isGerman ? 'Tipps' : 'Tips'}
          </h4>
          {tips.map((tip, index) => (
            <div key={index} className="space-y-2">
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                <p className="text-amber-800">
                  {isGerman ? tip.de : tip.en}
                </p>
              </div>

              {/* Memory Trick for this tip (if present) */}
              {tip.memoryTrick && (tip.memoryTrick.en || tip.memoryTrick.de) && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-4 ml-4">
                  <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold text-amber-900 mb-1 text-sm">
                        {isGerman ? '💡 Merktrick' : '💡 Memory Trick'}
                      </h5>
                      <p className="text-amber-800 text-sm">
                        {isGerman ? tip.memoryTrick.de : tip.memoryTrick.en}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h4 className="font-semibold text-slate-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            {isGerman ? 'Achtung' : 'Watch Out'}
          </h4>
          {warnings.map((warning, index) => (
            <div
              key={index}
              className="bg-rose-50 border border-rose-100 rounded-lg p-4"
            >
              <p className="text-rose-800">
                {isGerman ? warning.de : warning.en}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center pt-4 border-t border-slate-100"
      >
        <p className="text-sm text-slate-500">
          {isGerman
            ? 'Du hast die Regeln gelernt! Klicke "Weiter" um zu üben.'
            : 'You\'ve learned the rules! Click "Continue" to practice.'}
        </p>
      </motion.div>
    </div>
  );
};

export default StageRuleBreakdown;
