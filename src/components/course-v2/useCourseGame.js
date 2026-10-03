import { useEffect, useState } from 'react';
import { readGame, gameSummary } from '../../lib/course-v2/gamify.js';

// The game ledger as React state: re-reads whenever recordGame fires its
// `dm-course-game` event (this tab) or another tab writes the key (storage).
export default function useCourseGame() {
  const [summary, setSummary] = useState(() => gameSummary(readGame()));
  useEffect(() => {
    const refresh = () => setSummary(gameSummary(readGame()));
    window.addEventListener('dm-course-game', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('dm-course-game', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return summary;
}
