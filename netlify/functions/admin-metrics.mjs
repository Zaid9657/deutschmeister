// Admin panel — the cockpit.
//
// One clock (`to` captured once), explicit inclusive-start/exclusive-end
// windows plus the previous window of equal length, five metric groups in
// Promise.all each wrapped in safe() (a broken group is { error }, never 0),
// and the payload says which groups the level filter reached. The groups
// live in _shared/adminCockpit.mjs so admin-reports composes the same ones.
import { adminEndpoint, safe, deployDiagnostics } from './_shared/adminHttp.mjs';
import { windowFor } from './_shared/adminFunnelLib.mjs';
import { normalizeLevel, LEVEL_UNKNOWN } from './_shared/adminLevels.mjs';
import { METRICS } from './_shared/adminMetricNames.mjs';
import { revenueGroup, subsGroup, activitySets, usersGroup, productGroup, opsGroup } from './_shared/adminCockpit.mjs';

export const handler = adminEndpoint({ capability: 'reports.read' }, async ({ body, supabase, requestId }) => {
  const now = new Date(); // ONE clock
  const range = ['7d', '30d', '90d'].includes(body.range) ? body.range : '30d';
  const w = windowFor(range, now);
  const rawLevel = body.level;
  const level = rawLevel === LEVEL_UNKNOWN ? LEVEL_UNKNOWN : normalizeLevel(rawLevel); // null = all

  const sets = await activitySets(supabase, level === LEVEL_UNKNOWN ? null : level);
  const [revenue, subs, users, product, ops] = await Promise.all([
    safe('revenue', () => revenueGroup(supabase, w)),
    safe('subs', () => subsGroup(supabase, now)),
    safe('users', () => usersGroup(supabase, w, now, level, sets)),
    safe('product', () => productGroup(supabase, w, level === LEVEL_UNKNOWN ? null : level, sets)),
    safe('ops', () => opsGroup(supabase, w)),
  ]);
  const errors = [revenue, subs, users, product, ops].filter((g) => g.error).map((g) => g.error);
  return {
    range,
    level: level || 'all',
    ...w,
    timezone: 'UTC',
    levelFilterApplies: ['product.speaking', 'product.grammar', 'product.lessons', 'users.funnel', 'users.activated', 'users.grammarCohort'],
    levelFilterExcluded: ['revenue', 'subs', 'ops', 'users.total', 'users.newInWindow', 'users.loginActive7', 'users.loginActive28', 'users.paying', 'users.cohorts'],
    metrics: METRICS,
    revenue, subs, users, product, ops,
    generatedAt: now.toISOString(),
    diagnostics: { requestId, ...deployDiagnostics(), appliedFilters: { range, level: level || 'all' }, errors },
  };
});
