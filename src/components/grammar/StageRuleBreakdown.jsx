import { motion } from 'framer-motion';
import { Table2, Lightbulb, AlertTriangle } from 'lucide-react';

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
          className="bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
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
        </motion.div>
      ))}

      {/* Tips */}
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
            <div
              key={index}
              className="bg-amber-50 border border-amber-100 rounded-lg p-4"
            >
              <p className="text-amber-800">
                {isGerman ? tip.de : tip.en}
              </p>
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
