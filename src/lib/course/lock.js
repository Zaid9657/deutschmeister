import { LEVEL_ORDER } from '../../config/levels.js';

export const placedAbove = (placed, level) => {
  const a = LEVEL_ORDER.indexOf(String(placed || '').toUpperCase());
  const b = LEVEL_ORDER.indexOf(String(level || '').toUpperCase());
  return a >= 0 && b >= 0 && a > b;
};

/** The old course-home expression, unchanged; completed nodes are handled separately. */
export const pathNodeUnlocked = ({ user, loaded, endowed, index, path, done }) =>
  (!user || loaded) && (endowed || index === 0 || done.has(path[index - 1]?.id));

/** Loading is a neutral state, never a locked screen or permission to mount the lesson. */
export function pathNodeAccess(options) {
  if (options.authLoading || (options.user && (!options.loaded || options.profileLoading))) return 'loading';
  if (options.done.has(options.path[options.index]?.id)) return 'open';
  return pathNodeUnlocked(options) ? 'open' : 'locked';
}

export const currentPathNode = (path, done) => path.find((node) => !done.has(node.id)) || path[path.length - 1];
export const placementSuffix = (search) => new URLSearchParams(search).get('from') === 'placement' ? '?from=placement' : '';
