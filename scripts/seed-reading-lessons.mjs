// Seed reading lessons from content/reading/*.json into Supabase.
//
// The JSON files in content/reading/ are the reviewable source of truth for
// lessons authored in-repo. Idempotent: a lesson is skipped when a row with
// the same (level, title_de) already exists.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-reading-lessons.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes('--dry-run');
if (!supabaseUrl || !serviceKey) {
  console.error('Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, serviceKey);

const dir = join(process.cwd(), 'content', 'reading');
const lessons = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
console.log(`${lessons.length} lessons in content/reading/`);

const REQUIRED = ['level', 'title_de', 'title_en', 'topic', 'content_de', 'content_en', 'key_vocabulary', 'questions', 'word_count', 'difficulty', 'estimated_reading_time', 'order_index'];
for (const l of lessons) {
  for (const k of REQUIRED) if (l[k] == null) throw new Error(`${l.title_de ?? '?'}: missing ${k}`);
}

let inserted = 0;
let skipped = 0;
for (const raw of lessons) {
  // reading_lessons stores LOWERCASE levels (check constraint) — unlike
  // listening/grammar, which store uppercase. Normalize at the boundary.
  const l = { ...raw, level: raw.level.toLowerCase() };
  const { data: existing } = await supabase
    .from('reading_lessons')
    .select('id')
    .ilike('level', l.level)
    .eq('title_de', l.title_de)
    .maybeSingle();
  if (existing) { skipped++; continue; }
  if (dryRun) { inserted++; continue; }
  const { error } = await supabase.from('reading_lessons').insert(l);
  if (error) throw new Error(`${l.title_de}: ${error.message}`);
  inserted++;
}
console.log(`${dryRun ? '[dry-run] would insert' : 'inserted'}: ${inserted}, skipped (already present): ${skipped}`);
