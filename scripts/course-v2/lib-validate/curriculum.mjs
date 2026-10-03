// The level plans (`docs/course-v2/curriculum/<a1-1>.json`, the curriculum agents' Stoffplan) as the
// validator reads them: one entry per unit, by level and nr. Only CON-06 reads them (the plan's
// `landeskunde` point, review a1.1-u04 r4 F05); everything else a rule needs from the plan is in the unit
// spec. A context may carry the plans itself (`ctx.registries.curriculum`: Map level → units[]), which is
// how tests supply them; otherwise they are read from the repository the content tree belongs to. The
// SCHEMA §15 fixture tree (`content/course-v2/fixtures`) is its own world and has no plans.

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const arr = (x) => (Array.isArray(x) ? x : []);
const cache = new WeakMap();

/** The repository root a context's content tree lives in, or null (in-memory and fixture contexts). */
function repoOf(ctx) {
  if (!ctx?.root || basename(ctx.root) === 'fixtures') return null;
  return ctx.repoRoot || resolve(ctx.root, '..', '..');
}

/** The plan's units of a level (Map level → units[]), [] when there is no plan. */
export function curriculumUnits(ctx, level) {
  if (!ctx || typeof ctx !== 'object') return [];
  const given = ctx.registries?.curriculum;
  if (given instanceof Map) return arr(given.get(level));
  if (!cache.has(ctx)) cache.set(ctx, new Map());
  const byLevel = cache.get(ctx);
  if (byLevel.has(level)) return byLevel.get(level);
  let units = [];
  const repo = repoOf(ctx);
  const file = repo ? join(repo, 'docs', 'course-v2', 'curriculum', `${String(level).replace('.', '-')}.json`) : null;
  if (file && existsSync(file)) {
    try {
      units = arr(JSON.parse(readFileSync(file, 'utf8'))?.units);
    } catch {
      units = []; // an unreadable plan is its owner's problem, not a validator crash
    }
  }
  byLevel.set(level, units);
  return units;
}

/** The plan's entry for one unit ({ nr, landeskunde, … }), or null. */
export function curriculumEntry(ctx, level, nr) {
  return curriculumUnits(ctx, level).find((u) => u && (u.nr === nr || u.id === `${level}-u${String(nr).padStart(2, '0')}`)) || null;
}
