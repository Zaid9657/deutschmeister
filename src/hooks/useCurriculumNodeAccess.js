import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { curriculumNodeUnlocked, curriculumPath, curriculumProgramKey } from '../data/curricula/index.js';
import { localDoneIds } from '../lib/course/localProgressRead.js';
import { getProgramProgress } from '../services/programProgress.js';

/**
 * Enforce the same ordered path at the URL boundary that CurriculumHomePage
 * presents visually. Local guest progress is included for signed-in learners
 * until LessonPlayer has finished merging it into their account.
 */
export default function useCurriculumNodeAccess(curriculum, nodeId) {
  const { user } = useAuth();
  const [done, setDone] = useState(() => new Set());
  const [loaded, setLoaded] = useState(() => !curriculum || !nodeId);
  const path = useMemo(() => (curriculum ? curriculumPath(curriculum) : []), [curriculum]);

  useEffect(() => {
    if (!curriculum || !nodeId) {
      setDone(new Set());
      setLoaded(true);
      return undefined;
    }

    let cancelled = false;
    setLoaded(false);
    const local = localDoneIds(curriculum.level);
    if (!user) {
      setDone(local);
      setLoaded(true);
      return undefined;
    }

    getProgramProgress(user.id, curriculumProgramKey(curriculum.level))
      .then((remote) => {
        if (cancelled) return;
        setDone(new Set([...remote, ...local]));
        setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [user, curriculum, nodeId]);

  return {
    loaded,
    allowed: loaded && curriculumNodeUnlocked(path, nodeId, done),
  };
}
