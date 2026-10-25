// The SPA and the static site resume the same course for a learner who bought
// more than one (src/lib/courseEntry.js courseHomeFor, its two callers).
//
// The regression this closes (cross-check review of B10, 2026-10-25): the
// shared resolver resumes the NEWEST bought course, sorting purchases by
// created_at. The SPA's getPurchases selects created_at; the Astro layout's
// query did not (and did not order), so the resolver kept whatever order the
// database returned. Placed at A1.1 with an older A1.2 and a newer A2.1 course,
// the SPA's "Continue learning" opened /course/a2.1 and the static pages' could
// open /course/a1.2.
//
// Both real code paths run here against one fake database that answers with
// only the columns a query selects, in the order it is asked for (insertion
// order unless the query orders) — the way PostgREST does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { courseHomeFor } from '../src/lib/courseEntry.js';
import { subscriptionStatus } from '../src/lib/subscriptionStatus.js';
import { isLevelFree } from '../src/config/freeTier.js';
import { levelsForProduct, productKeyForLevel } from '../src/data/pricing.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

/** A PostgREST-shaped fake: select projects, eq filters, order sorts, maybeSingle unwraps. */
function database(tables, userId) {
  return {
    auth: { getUser: async () => ({ data: { user: { id: userId } } }) },
    from(table) {
      let rows = [...(tables[table] || [])];
      let columns = null;
      let sort = null;
      let single = false;
      const query = {
        select(list) { columns = list.split(',').map((c) => c.trim()); return query; },
        eq(column, value) { rows = rows.filter((row) => row[column] === value); return query; },
        order(column, { ascending = true } = {}) { sort = { column, ascending }; return query; },
        limit() { return query; },
        maybeSingle() { single = true; return query; },
        then(resolve, reject) {
          try {
            if (sort) {
              const dir = sort.ascending ? 1 : -1;
              rows.sort((a, b) => dir * String(a[sort.column] ?? '').localeCompare(String(b[sort.column] ?? '')));
            }
            const projected = rows.map((row) => Object.fromEntries(columns.filter((c) => c in row).map((c) => [c, row[c]])));
            resolve({ data: single ? projected[0] ?? null : projected, error: null });
          } catch (error) {
            reject(error);
          }
        },
      };
      return query;
    },
  };
}

// The SPA: SubscriptionContext loads purchases through getPurchases, and the
// navbar/Kurs tab resolve with its hasLevelAccess (free level, live trial or
// Pro, or an owned course — no trial or Pro in these fixtures).
async function spaCourse(db, userId, profile) {
  const source = read('src/services/subscriptionService.js')
    .replace(/^import[\s\S]*?;\n/gm, '')
    .replace(/^export const /gm, 'const ');
  const { getPurchases } = vm.runInNewContext(`${source}\n({ getPurchases });`, { supabase: db, console, Date, subscriptionStatus });
  const purchases = [...await getPurchases(userId)].map((p) => ({ ...p }));
  const hasLevelAccess = (level) => isLevelFree(level) || purchases.some((p) => levelsForProduct(p.product_key).includes(String(level).toLowerCase()));
  return courseHomeFor({ level: profile.current_level, hasLevelAccess, purchases });
}

// The static site: Layout.astro's updateContinueLinks with its helpers, as built.
async function astroCourse(db) {
  const layout = read('astro-site/src/layouts/Layout.astro');
  const helpers = ['accountAccess', 'continueCourseHref', 'showsUpgrade'].map((name) => {
    const fn = layout.match(new RegExp(` {6}function ${name}\\([\\s\\S]*?\\n {6}\\}`));
    assert.ok(fn, `Layout.astro defines ${name}`);
    return fn[0];
  });
  const updater = layout.match(/ {6}async function updateContinueLinks\(\) \{[\s\S]*?\n {6}\}/)[0]
    .replace("import('../lib/supabase.js')", 'loadSupabase()');
  const links = [{ href: '/course/a1.1' }];
  const context = vm.createContext({
    courseHomeFor, subscriptionStatus, isLevelFree, levelsForProduct,
    document: { querySelectorAll: (selector) => (selector === '[data-continue-course]' ? links : []) },
    localStorage: { length: 1, key: () => 'sb-project-auth-token' },
    loadSupabase: async () => ({ supabase: db }),
  });
  vm.runInContext(`${helpers.join('\n')}\n${updater}`, context);
  await context.updateContinueLinks();
  return links[0].href;
}

const DAY = 24 * 60 * 60 * 1000;
const past = new Date(Date.now() - 30 * DAY).toISOString(); // the included Pro window has ended

function fixture(purchases) {
  const profile = { id: 'learner', current_level: 'A1.1', is_subscribed: false, trial_started_at: '2026-01-01T00:00:00Z', trial_ends_at: '2026-01-08T00:00:00Z' };
  return {
    profile,
    tables: {
      profiles: [profile],
      subscriptions: [],
      // Rows in the order the database happens to return them.
      purchases: purchases.map(([level, createdAt]) => ({
        user_id: 'learner', product_key: productKeyForLevel(level), status: 'active', access_until: past, created_at: createdAt,
      })),
    },
  };
}

const CASES = [
  { name: 'an older A1.2 returned before a newer A2.1', rows: [['a1.2', '2026-09-01T10:00:00Z'], ['a2.1', '2026-10-01T10:00:00Z']], expected: '/course/a2.1' },
  { name: 'a newer A2.1 returned before an older A1.2', rows: [['a2.1', '2026-10-01T10:00:00Z'], ['a1.2', '2026-09-01T10:00:00Z']], expected: '/course/a2.1' },
  { name: 'a newer A1.2 (gone back to fill a gap) returned after an older A2.1', rows: [['a2.1', '2026-09-01T10:00:00Z'], ['a1.2', '2026-10-01T10:00:00Z']], expected: '/course/a1.2' },
];

for (const { name, rows, expected } of CASES) {
  test(`both front ends resume the newest course: ${name}`, async () => {
    const { profile, tables } = fixture(rows);
    const spa = await spaCourse(database(tables, 'learner'), 'learner', profile);
    const astro = await astroCourse(database(tables, 'learner'));
    assert.equal(spa, expected, 'the SPA navbar and Kurs tab');
    assert.equal(astro, spa, 'the static pages must open the same course as the app');
  });
}
