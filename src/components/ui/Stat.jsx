import { useCountUp } from '../../lib/motion.js';

/**
 * A figure that counts up when it scrolls into view — for content counts
 * and a learner's own numbers (streak, words due, topics done). Only pass
 * numbers that are true by construction (the counts rule in marketing.js).
 */
export default function Stat({ value, label, suffix = '', size = 'md', className = '' }) {
  const [ref, shown] = useCountUp(Number(value) || 0);
  const num = size === 'lg' ? 'text-[3.25rem]' : size === 'sm' ? 'text-[1.375rem]' : 'text-[1.75rem]';
  return (
    <div ref={ref} className={className}>
      <p className={`font-display ${num} font-semibold leading-none tracking-[-0.02em] text-ink`}>
        {shown.toLocaleString('en-US')}
        {suffix}
      </p>
      {label && <p className="mt-1.5 text-[0.875rem] leading-snug text-graphite">{label}</p>}
    </div>
  );
}
