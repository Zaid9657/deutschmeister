// Admin panel — content lifecycle, pure.
export const LIFECYCLE = Object.freeze({ draft: 'Entwurf', in_review: 'In Prüfung', published: 'Veröffentlicht', hidden: 'Verborgen', archived: 'Archiviert' });

/** archived → published is deliberately absent: archived material comes back through review. */
export const LIFECYCLE_TRANSITIONS = Object.freeze({
  draft: ['in_review', 'archived'],
  in_review: ['draft', 'published', 'archived'],
  published: ['hidden', 'in_review', 'archived'],
  hidden: ['published', 'in_review', 'archived'],
  archived: ['draft'],
});

export function allowedTransitions(status) {
  return LIFECYCLE_TRANSITIONS[status] || [];
}

export function canTransition(from, to) {
  return allowedTransitions(from).includes(to);
}

/**
 * The content tables the CMS governs, with the per-table column names. The
 * boolean `publishedColumn` (where one exists) is mirrored by set_lifecycle
 * so the learner-facing readers that filter on it keep working; tables
 * without one are listed with `publishedColumn: null` and the screen says so.
 */
export const CONTENT_TABLES = Object.freeze({
  grammar_topics:      { label: 'Grammatik-Themen', levelColumn: 'sub_level', titleColumn: 'title_de', altTitleColumn: 'title_en', orderColumn: 'topic_order', publishedColumn: 'is_published', slugColumn: 'slug', updatedColumn: 'updated_at', route: (r) => `/grammar/${String(r.sub_level).toLowerCase()}/${r.slug}/` },
  reading_lessons:     { label: 'Lesetexte', levelColumn: 'level', titleColumn: 'title_de', altTitleColumn: 'title_en', orderColumn: 'order_index', publishedColumn: null, slugColumn: null, updatedColumn: null, route: (r) => `/reading/${String(r.level).toLowerCase()}` },
  listening_exercises: { label: 'Hörübungen', levelColumn: 'level', titleColumn: 'title', altTitleColumn: null, orderColumn: 'exercise_number', publishedColumn: null, slugColumn: null, updatedColumn: null, route: (r) => `/listening/${String(r.level).toLowerCase()}` },
  podcasts:            { label: 'Podcasts', levelColumn: 'sub_level', titleColumn: 'title_de', altTitleColumn: 'title_en', orderColumn: 'podcast_order', publishedColumn: 'is_published', slugColumn: null, updatedColumn: null, route: () => '/podcasts/' },
  speaking_missions:   { label: 'Sprech-Missionen', levelColumn: 'level', titleColumn: 'title_de', altTitleColumn: 'title_en', orderColumn: 'mission_order', publishedColumn: 'is_published', slugColumn: null, updatedColumn: null, route: () => '/speaking/' },
  video_library:       { label: 'Videos', levelColumn: 'level', titleColumn: 'title', altTitleColumn: null, orderColumn: 'created_at', publishedColumn: 'published', slugColumn: null, updatedColumn: null, route: (r) => `/video-library/${r.id}` },
});

export const CONTENT_TABLE_KEYS = Object.freeze(Object.keys(CONTENT_TABLES));

/** Unparseable → null. Never "Invalid Date", never silently "today". */
export function safeDate(v) {
  if (!v) return null;
  const t = new Date(v);
  return Number.isFinite(t.getTime()) ? t.toISOString() : null;
}

/** 'never' | 'scheduled_unknown' | 'due' | 'ok' — `never` is reported separately from `due`. */
export function reviewState(row, now = new Date()) {
  if (!row.last_reviewed_at) return 'never';
  if (!row.next_review_at) return 'scheduled_unknown';
  const next = safeDate(row.next_review_at);
  if (!next) return 'scheduled_unknown';
  return new Date(next) <= now ? 'due' : 'ok';
}

/**
 * Hierarchy validation for the grammar prerequisite graph: rows carry
 * `slug` and `prerequisite_slugs`. Returns the four defect classes, each with
 * the rows that prove it. Depth-bounded at 64 — the bound is what makes a
 * cycle terminate at all.
 */
export function validateHierarchy(rows) {
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const orphans = [];
  const cycles = [];
  const duplicateSiblings = [];
  const roots = [];
  for (const r of rows) {
    const prereqs = Array.isArray(r.prerequisite_slugs) ? r.prerequisite_slugs : [];
    if (prereqs.length === 0) roots.push(r.slug);
    for (const p of prereqs) if (!bySlug.has(p)) orphans.push({ slug: r.slug, missing: p });
    // walk ancestry, bounded
    const seen = new Set([r.slug]);
    const stack = [...prereqs];
    let depth = 0;
    while (stack.length && depth < 64) {
      const s = stack.pop();
      depth += 1;
      if (s === r.slug) { cycles.push({ slug: r.slug, via: [...seen] }); break; }
      if (seen.has(s)) continue;
      seen.add(s);
      const parent = bySlug.get(s);
      if (parent) stack.push(...(Array.isArray(parent.prerequisite_slugs) ? parent.prerequisite_slugs : []));
    }
  }
  const byLevelTitle = new Map();
  for (const r of rows) {
    const key = `${String(r.sub_level || r.level || '').toLowerCase()}::${String(r.title_de || r.title || '').trim().toLowerCase()}`;
    (byLevelTitle.get(key) || byLevelTitle.set(key, []).get(key)).push(r.slug || r.id);
  }
  for (const [key, slugs] of byLevelTitle) if (slugs.length > 1) duplicateSiblings.push({ key, slugs });
  return { orphans, cycles, duplicateSiblings, roots: roots.length, healthy: orphans.length === 0 && cycles.length === 0 && duplicateSiblings.length === 0 };
}

/** Would adding `parentSlug` as a prerequisite of `slug` create a cycle? Checked BEFORE a write. */
export function wouldCreateCycle(rows, slug, parentSlug) {
  if (slug === parentSlug) return true;
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const stack = [parentSlug];
  const seen = new Set();
  let depth = 0;
  while (stack.length && depth < 64) {
    const s = stack.pop();
    depth += 1;
    if (s === slug) return true;
    if (seen.has(s)) continue;
    seen.add(s);
    const row = bySlug.get(s);
    if (row) stack.push(...(Array.isArray(row.prerequisite_slugs) ? row.prerequisite_slugs : []));
  }
  return false;
}
