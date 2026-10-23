// A2 topic pages and rule texts in the cache (A2 scout, 2026-10-17). READ-ONLY.
// Usage: node rules.mjs <grammar-content-cache.json>
// One line per A2 topic: rule count by rule_type, the German rule titles, example count, and how
// many rules carry common_mistakes / key_insight_de (the fields the Astro rule pages render).
import { readFileSync } from 'node:fs';

const cache = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const topics = cache.topics.filter((t) => /^A2/.test(t.sub_level))
  .sort((a, b) => a.sub_level.localeCompare(b.sub_level) || a.topic_order - b.topic_order);
let total = 0;
for (const t of topics) {
  const rules = cache.rules.filter((r) => r.topic_id === t.id).sort((a, b) => a.order_index - b.order_index);
  total += rules.length;
  const types = {};
  for (const r of rules) types[r.rule_type] = (types[r.rule_type] || 0) + 1;
  const withMistakes = rules.filter((r) => r.common_mistakes && r.common_mistakes !== '[]').length;
  const withInsight = rules.filter((r) => r.key_insight_de).length;
  const examples = cache.examples.filter((x) => x.topic_id === t.id).length;
  console.log(`${t.sub_level} ${String(t.topic_order).padStart(2)} ${t.slug} — „${t.title_de}" | rules ${rules.length} ${JSON.stringify(types)} | mistakes ${withMistakes} · insight ${withInsight} | examples ${examples}`);
  console.log(`   ${rules.map((r) => r.title_de).join(' · ')}`);
}
console.log(`total A2 rules: ${total}`);
