/** Resolve every completed level, nearest first. Bad registry links must not silently lose words. */
export function priorLevelSpecs(spec, resolve) {
  const out = [];
  const seen = new Set([String(spec?.level || '').toLowerCase()]);
  let level = spec?.seedFrom;
  while (level) {
    const key = String(level).toLowerCase();
    if (seen.has(key)) throw new Error(`Vocabulary inheritance cycle at ${key}`);
    seen.add(key);
    const prior = resolve(key);
    if (!prior) throw new Error(`Missing vocabulary ancestor ${key}`);
    out.push(prior);
    level = prior.seedFrom;
  }
  return out;
}
