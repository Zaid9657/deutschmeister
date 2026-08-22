import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  GRAMMAR_TOPIC_COUNT,
  LISTENING_DIALOGUE_COUNT,
  LEVEL_COUNT,
  PODCAST_EPISODE_COUNT,
} from '../data/marketing.js';

// What the product CONTAINS, not how many people use it.
//
// This bar previously claimed "1.400+ Lernende", "170+ Neue Lernende pro Monat"
// and "2.488 KI-Sprechübungen". The first two trace to EVALUATION.md's
// 2026-08-16 database audit, but "pro Monat" is stale the moment the month
// turns; the third appears in no audit and has no source at all. Per the counts
// rule in src/data/marketing.js, every figure here is now a constant counted
// against a live table, so none of it can rot on its own.
const STATS = [
  { value: formatGermanNumber(GRAMMAR_TOPIC_COUNT), label: 'Grammatikthemen' },
  { value: formatGermanNumber(LISTENING_DIALOGUE_COUNT), label: 'Dialoge mit Muttersprachlern' },
  { value: formatGermanNumber(LEVEL_COUNT), label: 'Stufen, A1.1 bis B2.2' },
  { value: formatGermanNumber(PODCAST_EPISODE_COUNT), label: 'Podcast-Folgen' },
];

function parseGermanNumber(str) {
  return parseInt(str.replace(/\./g, ''), 10);
}

function formatGermanNumber(n) {
  return n.toLocaleString('de-DE');
}

function AnimatedNumber({ value, inView }) {
  const target = parseGermanNumber(value);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return <>{formatGermanNumber(display)}</>;
}

const StatsBar = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section ref={ref} className="py-14 bg-white border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">
          Was drin ist
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="text-center"
            >
              <p className="text-4xl sm:text-5xl font-bold text-slate-800 mb-1">
                <AnimatedNumber value={stat.value} inView={inView} />
              </p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default StatsBar;
