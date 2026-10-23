// Do two cache dumps differ in their A2 rows? (A2 scout, 2026-10-17). READ-ONLY.
// Usage: node cache-drift.mjs <old-cache.json> <new-cache.json>
// Compares A2.1/A2.2 topics, rules, examples and exercises by id, field by field.
import { readFileSync } from 'node:fs';

const [a, b] = process.argv.slice(2).map((p) => JSON.parse(readFileSync(p, 'utf8')));
const a2Ids = (cache) => new Set(cache.topics.filter((t) => /^A2/.test(t.sub_level)).map((t) => t.id));
const ta = a2Ids(a);
const tb = a2Ids(b);
const strip = ({ updated_at: _updatedAt, created_at: _createdAt, ...rest }) => rest; // timestamps are not content
for (const table of ['topics', 'rules', 'examples', 'exercises']) {
  const pick = (cache, ids) => new Map(cache[table]
    .filter((r) => (table === 'topics' ? ids.has(r.id) : ids.has(r.topic_id)))
    .map((r) => [r.id, JSON.stringify(strip(r))]));
  const ma = pick(a, ta);
  const mb = pick(b, tb);
  const onlyA = [...ma.keys()].filter((k) => !mb.has(k)).length;
  const onlyB = [...mb.keys()].filter((k) => !ma.has(k)).length;
  const changedIds = [...ma.keys()].filter((k) => mb.has(k) && ma.get(k) !== mb.get(k));
  const fields = {};
  for (const id of changedIds) {
    const ra = JSON.parse(ma.get(id));
    const rb = JSON.parse(mb.get(id));
    for (const f of new Set([...Object.keys(ra), ...Object.keys(rb)])) {
      if (JSON.stringify(ra[f]) !== JSON.stringify(rb[f])) fields[f] = (fields[f] || 0) + 1;
    }
  }
  console.log(`${table.padEnd(9)} old ${ma.size} · new ${mb.size} · only-old ${onlyA} · only-new ${onlyB} · changed ${changedIds.length} ${JSON.stringify(fields)}`);
}
