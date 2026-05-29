import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

export default function SessionTimeoutModal({ show, onStay }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 max-w-sm w-full text-center"
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="font-display text-lg font-bold text-slate-800 mb-2">
              Sitzung läuft ab
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Du wirst in 2 Minuten automatisch abgemeldet.
            </p>
            <button
              onClick={onStay}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-rose-600 transition-all shadow-lg shadow-rose-500/25"
            >
              Angemeldet bleiben
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
