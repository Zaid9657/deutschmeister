// Free tier configuration — single source of truth
// Change this array to make more levels free
export const FREE_LEVELS = ['a1.1'];

export const isLevelFree = (level) => {
  if (!level) return false;
  return FREE_LEVELS.includes(level.toLowerCase());
};
