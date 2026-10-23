// What the A1.2 engine would do with the A2 bank (A2 scout, 2026-10-17). READ-ONLY.
//
// Usage (from a `git archive 662ffa2` snapshot after `node scripts/build-lesson-pool.mjs a2.1|a2.2`
// was run INSIDE the snapshot, so <snapshot>/src/data/lessonPools/a21.json and a22.json exist):
//   node horizon-lexis.mjs <snapshot-root>
//
// 1. LEXIS. The known set of an A2.1 learner on day one = levelLexicon('a1.2'), the validator's own
//    end-of-A1.2 lexicon (A1.2 seeds from A1.1). Every built A2 item is scanned with the validator's
//    own untaughtTokens(). 0 tokens = servable on A2 day one by words; the rest need A2 Wortfeld.
// 2. GRAMMAR. The construction horizon as it stands, applied with A1.2's switches (the only level
//    with constructionHorizon: true): constructionHorizonIndex('a1.2')(item) === null means "never
//    servable" under the current machinery. Split by cause: constructions.js `never` hits
//    (adjective-declension), NEVER_FORMS_A12-like hits, attributive adjectives without article.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const [root, outPath] = process.argv.slice(2);
if (!root) { console.error('usage: node horizon-lexis.mjs <snapshot-root> [out.json]'); process.exit(2); }
const out = {};
const v = await import(pathToFileURL(join(root, 'scripts/validate-curriculum.mjs')).href);
const c = await import(pathToFileURL(join(root, 'src/data/curricula/constructions.js')).href);

const spec12 = v.levelSpec('a1.2');
const known = v.levelLexicon('a1.2');
const horizon12 = v.constructionHorizonIndex('a1.2');
const adjectives12 = v.adjectiveLexicon('a1.2');
console.log(`day-one lexicon (levelLexicon('a1.2')): ${known.size} forms`);

for (const lvl of ['a21', 'a22']) {
  const pool = JSON.parse(readFileSync(join(root, `src/data/lessonPools/${lvl}.json`), 'utf8'));
  const items = pool.items || pool;
  const byTopic = {};
  const tokenItems = new Map();
  const soleBlocker = new Map();
  const buckets = { 0: 0, 1: 0, 2: 0, '3+': 0 };
  const grammar = { horizonNull: 0, neverHit: 0, neverFormsA12: 0, attributive: 0 };
  for (const it of items) {
    const toks = [...new Set(v.untaughtTokens(it, known, spec12).map((t) => t.toLowerCase()))];
    const b = toks.length >= 3 ? '3+' : toks.length;
    buckets[b] += 1;
    byTopic[it.topic] ??= { n: 0, day1: 0, one: 0, horizonNull: 0, day1AndGrammarOk: 0 };
    const row = byTopic[it.topic];
    row.n += 1;
    if (!toks.length) row.day1 += 1;
    if (toks.length === 1) row.one += 1;
    for (const t of toks) tokenItems.set(t, (tokenItems.get(t) || 0) + 1);
    if (toks.length === 1) soleBlocker.set(toks[0], (soleBlocker.get(toks[0]) || 0) + 1);
    const text = `${String(it.questionDe || '').replace(/___/g, it.answer || '')} ${it.answer || ''}`;
    const h = horizon12(it);
    if (h === null) { grammar.horizonNull += 1; row.horizonNull += 1; }
    else if (!toks.length) row.day1AndGrammarOk += 1;
    if (c.constructionHits(text).some((x) => x.never)) grammar.neverHit += 1;
    if ((spec12.neverForms || []).some((re) => new RegExp(re.source, re.flags).test(text))) grammar.neverFormsA12 += 1;
    if (v.attributiveAdjectives(text, adjectives12).length) grammar.attributive += 1;
  }
  console.log(`\n== ${lvl}: ${items.length} built items`);
  console.log(`  untaught tokens vs end-of-A1.2 lexicon: ${JSON.stringify(buckets)}`);
  console.log(`  current horizon (A1.2 switches): null=${grammar.horizonNull}; constructions.js never-hit=${grammar.neverHit}; NEVER_FORMS_A12 hit=${grammar.neverFormsA12}; attributive adj w/o article=${grammar.attributive}`);
  console.log('  per topic: n | day-one by words | exactly 1 new word | horizon null | day-one words AND horizon ok');
  for (const [t, r] of Object.entries(byTopic).sort()) console.log(`    ${t.padEnd(32)} ${String(r.n).padStart(3)} | ${String(r.day1).padStart(3)} | ${String(r.one).padStart(3)} | ${String(r.horizonNull).padStart(3)} | ${String(r.day1AndGrammarOk).padStart(3)}`);
  const top = [...tokenItems.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 30);
  console.log(`  top 30 unknown tokens (items containing): ${top.map(([t, n]) => `${t} ${n}`).join(', ')}`);
  const sole = [...soleBlocker.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20);
  console.log(`  top 20 sole blockers (items unlocked by teaching that one word): ${sole.map(([t, n]) => `${t} ${n}`).join(', ')}`);
  console.log(`  distinct unknown tokens: ${tokenItems.size}`);
  out[lvl] = { built: items.length, buckets, grammar, byTopic, distinctUnknown: tokenItems.size };
}
if (outPath) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(outPath, JSON.stringify(out, null, 1));
  console.log(`\n→ ${outPath}`);
}
