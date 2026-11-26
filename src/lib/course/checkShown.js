// What a Lektion's final check showed, per can-do, kept on this device (Claude score of fd8f8dba, 2026-11-25, MAJOR 5): the course
// home ticked every can-do of a finished Lektion, also the ones the check had just put under „Still to practise“. The run that is
// saved to the account carries no check result (lesson_progress has no column for it: that waits for the owner-applied migration
// batch), so the home reads what this browser saw; a Lektion finished elsewhere keeps the older reading.
const KEY = 'dm_check_shown';

const storage = () => {
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
};

/** { [lektionId]: [true | false per can-do] } as saved on this device. */
export function checksShown() {
  try {
    const raw = storage()?.getItem(KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all && typeof all === 'object' ? all : {};
  } catch {
    return {};
  }
}

/** Keeps the latest check of a Lektion: a retake that shows more replaces the one before. */
export function rememberCheck(lektionId, shown) {
  if (!lektionId || !Array.isArray(shown)) return;
  try {
    const all = checksShown();
    all[lektionId] = shown.map((x) => x === true);
    storage()?.setItem(KEY, JSON.stringify(all));
  } catch {
    // A browser that keeps nothing shows the older reading.
  }
}
