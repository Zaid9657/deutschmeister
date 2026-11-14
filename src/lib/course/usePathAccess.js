import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { curriculumPath } from '../../data/curricula/index.js';
import { getProgramProgress } from '../../services/programProgress.js';
import { hasLocalProgress, localDoneIds, mergeLocalProgress } from './localProgress.js';
import { flushOutbox, pendingRuns } from './syncOutbox.js';
import { currentPathNode, pathNodeAccess, placedAbove, placementSuffix } from './lock.js';

/** Owner- and level-scoped, so a route/account change cannot show a stale permission for a frame. */
export function usePathAccess(curriculum, nodeId) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useSubscription() || {};
  const { search } = useLocation();
  const path = useMemo(() => curriculum ? curriculumPath(curriculum) : [], [curriculum]);
  const level = curriculum?.level;
  const scope = `${user?.id || 'guest'}:${level}`;
  const [progress, setProgress] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!user || !curriculum || authLoading) return undefined;
    let cancelled = false;
    const load = async () => {
      try {
        if (hasLocalProgress(level)) await mergeLocalProgress(user.id);
        await flushOutbox(user.id);
        const done = await getProgramProgress(user.id, `${level.replace('.', '')}_course`);
        // A finished run is locally durable before its server writes; offline completion opens the path too.
        for (const run of pendingRuns(user.id)) if (run.level === level) done.add(run.lektionId);
        if (!cancelled) setProgress({ scope, done });
      } catch {
        if (!cancelled) setProgress({ scope, error: true });
      }
    };
    load();
    window.addEventListener('online', load);
    return () => { cancelled = true; window.removeEventListener('online', load); };
  }, [user, curriculum, level, scope, authLoading, retry]);
  const done = user ? progress?.scope === scope ? progress.done || new Set() : new Set() : localDoneIds(level);
  const loaded = !user || (progress?.scope === scope && !!progress.done);
  const endowed = placedAbove(profile?.current_level, level) || !!placementSuffix(search);
  const index = path.findIndex((node) => node.id === nodeId);
  const state = progress?.scope === scope && progress.error ? 'error' : index < 0 ? 'open'
    : pathNodeAccess({ user, authLoading, profileLoading, loaded, endowed, index, path, done });
  return { state, current: currentPathNode(path, done), suffix: placementSuffix(search), retry: () => { setProgress(null); setRetry((n) => n + 1); } };
}
