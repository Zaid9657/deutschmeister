import {
  GRAMMAR_TOPIC_COUNT,
  LISTENING_DIALOGUE_COUNT,
  LEVEL_COUNT,
  PODCAST_EPISODE_COUNT,
} from '../data/marketing.js';
import Stat from './ui/Stat.jsx';
import Reveal from './ui/Reveal.jsx';

// What the product CONTAINS, not how many people use it.
//
// This bar previously claimed "1.400+ Lernende", "170+ Neue Lernende pro Monat"
// and "2.488 KI-Sprechübungen". The first two trace to EVALUATION.md's
// 2026-08-16 database audit, but "pro Monat" is stale the moment the month
// turns; the third appears in no audit and has no source at all. Per the counts
// rule in src/data/marketing.js, every figure here is now a constant counted
// against a live table, so none of it can rot on its own.
//
// The count-up itself is the shared <Stat> (src/lib/motion.js useCountUp), so
// this bar ticks the same way the homepage does. Every count here is below
// 1.000, so the en-US grouping <Stat> applies renders the same digits the
// German formatter used to.
const STATS = [
  { value: GRAMMAR_TOPIC_COUNT, label: 'Grammatikthemen' },
  { value: LISTENING_DIALOGUE_COUNT, label: 'Dialoge mit Muttersprachlern' },
  { value: LEVEL_COUNT, label: 'Stufen, A1.1 bis B2.2' },
  { value: PODCAST_EPISODE_COUNT, label: 'Podcast-Folgen' },
];

const StatsBar = () => (
  <section className="py-14 bg-white border-b border-rule">
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <Reveal as="p" className="text-center font-data text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-siegel mb-8">
        Was drin ist
      </Reveal>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={90 * i}>
            <Stat value={stat.value} label={stat.label} size="lg" className="text-center" />
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export default StatsBar;
