import { courseForLevel, PLANS, deEur } from '../data/pricing.js';
import { FREE_LEVEL_LABEL } from '../data/marketing.js';
import { FREE_COURSE_HREF } from '../data/offers.js';
import { curriculumFor, curriculumPath } from '../data/curricula/index.js';
import { hasRecurringBilling } from './checkoutAccess.js';
import { safeGet, safeSet } from '../utils/safeStorage.js';

export const RETURN_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
const dismissKey = (userId) => `dm_trial_return_dismissed:${userId}`;
export function returnDismissed(userId, now = Date.now()) {
  const at = Number(safeGet(dismissKey(userId)));
  return at > 0 && at <= now && now - at < RETURN_DISMISS_MS;
}
export const dismissReturn = (userId, now = Date.now()) => safeSet(dismissKey(userId), String(now));
export const hideReturnBanner = (path) => /^\/(subscription|pricing)(\/|$)/.test(path);

// Presentation only. An unread billing state is never evidence of no purchase.
export function showTrialReturn({ userId, profile, purchases, subscription, loading, billingVerified, subscribed }, now = Date.now()) {
  const end = Date.parse(profile?.trial_ends_at);
  return Boolean(userId && !loading && billingVerified === true && profile &&
    Number.isFinite(end) && end <= now && !subscribed && !profile.is_subscribed &&
    (!profile.subscription_tier || profile.subscription_tier === 'free') &&
    Array.isArray(purchases) && purchases.length === 0 && !hasRecurringBilling(subscription));
}

// Only recognized stored tasks become links. No learner text is fetched here.
export function savedWork({ lessons = [], grammar = [], writing = [] } = {}) {
  const tasks = [];
  for (const row of lessons) {
    const level = String(row.level || '').toLowerCase();
    const curriculum = curriculumFor(level);
    const node = curriculum && curriculumPath(curriculum).find((n) => n.id === row.lektion_id);
    if (node) tasks.push({ level, at: row.updated_at, label: `${level.toUpperCase()}: ${node.title}`,
      detail: row.status === 'started' ? 'Begonnen' : 'Bearbeitet',
      next: 'Öffnen Sie Ihren Kursplan für den nächsten Schritt.', href: `/course/${level}` });
  }
  for (const row of grammar) {
    const topic = row.grammar_topics;
    const level = String(topic?.sub_level || '').toLowerCase();
    if (/^[ab][12]\.[12]$/.test(level) && /^[a-z0-9-]+$/.test(topic?.slug || '')) {
      tasks.push({ level, at: row.last_accessed || row.completed_at,
        label: `Grammatik ${level.toUpperCase()}: ${topic.title_de || topic.slug}`,
        detail: row.is_completed ? 'Abgeschlossen' : 'Begonnen',
        next: 'Öffnen Sie Ihr Grammatikthema erneut.', external: true, href: `/grammar/${level}/${topic.slug}/` });
    }
  }
  for (const row of writing) {
    tasks.push({ at: row.created_at, label: 'Schreibaufgabe', detail: 'Gespeichert',
      next: 'Sehen Sie Ihre gespeicherten Schreibaufgaben an.', href: '/schreiben' });
  }
  return tasks.filter((t) => Number.isFinite(Date.parse(t.at)))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0] || null;
}

export async function loadSavedWork(client, userId) {
  const queries = [
    ['lessons', 'lesson_progress', 'level, lektion_id, status, updated_at', 'updated_at'],
    ['grammar', 'user_grammar_progress', 'is_completed, last_accessed, completed_at, grammar_topics(slug, sub_level, title_de)', 'last_accessed'],
    ['writing', 'writing_submissions', 'created_at', 'created_at'],
  ];
  const results = await Promise.all(queries.map(async ([key, table, columns, order]) => {
    const { data, error } = await client.from(table).select(columns).eq('user_id', userId)
      .order(order, { ascending: false }).limit(10);
    if (error) throw new Error('Saved work unavailable');
    return [key, data || []];
  }));
  return savedWork(Object.fromEntries(results));
}

export function returnOffer(level, levelCourses = {}) {
  const course = courseForLevel(level);
  if (course && !course.comingSoon && levelCourses[course.key]?.variantId) {
    return { label: `${course.nameDe} · ${deEur(course.price)} einmalig`, href: '/subscription#return-offers' };
  }
  return { label: `Pro · ${deEur(PLANS.monthly.price)} / ${PLANS.monthly.intervalDe}`, href: '/subscription#return-offers' };
}

export const freeReturnOption = { href: FREE_COURSE_HREF, label: `${FREE_LEVEL_LABEL} bleibt kostenlos` };
