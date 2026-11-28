import { useEffect, useState } from 'react';
import { coursePriceLine, LAUNCH_ENDS_AT } from '../data/pricing.js';

export function usePriceNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    // Align the change to midnight, including tabs left open for weeks.
    const refresh = () => setNow(Date.now());
    let timer;
    const schedule = () => {
      const remaining = Date.parse(LAUNCH_ENDS_AT) + 1000 - Date.now();
      if (remaining > 0) timer = setTimeout(() => { refresh(); schedule(); }, Math.min(remaining, 2147483647));
    };
    schedule();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);
  return now;
}

export default function CoursePrice({ level, language = 'en' }) {
  const now = usePriceNow();
  return <span data-launch-ends-at={LAUNCH_ENDS_AT}>{coursePriceLine(level, now, language)}</span>;
}
