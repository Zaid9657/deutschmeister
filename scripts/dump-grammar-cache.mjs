// Dump the grammar content tables to a JSON cache usable via
// GRAMMAR_CONTENT_CACHE (see astro-site/src/lib/grammar.js).
//
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/dump-grammar-cache.mjs [out.json]
//
// Shape: { topics: [...], rules: [...], examples: [...], exercises: [...] }
// (full rows, same columns as the tables). CI can run this once and build the
// Astro site offline; it also works as a Supabase-outage fallback.
import { writeFileSync } from 'node:fs';

const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const out = process.argv[2] || 'grammar-content-cache.json';

if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_ANON_KEY (or PUBLIC_ variants) are required');
  process.exit(1);
}

async function fetchAll(table) {
  const rows = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&order=id&offset=${from}&limit=${page}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < page) break;
  }
  console.log(`${table}: ${rows.length} rows`);
  return rows;
}

const [topics, rules, examples, exercises] = await Promise.all([
  fetchAll('grammar_topics'),
  fetchAll('grammar_rules'),
  fetchAll('grammar_examples'),
  fetchAll('grammar_exercises'),
]);

// dumpedAt lets CI warn when the committed cache goes stale; the loader in
// astro-site/src/lib/grammar.js ignores unknown keys.
writeFileSync(out, JSON.stringify({ dumpedAt: new Date().toISOString().slice(0, 10), topics, rules, examples, exercises }));
console.log(`Wrote ${out}`);
