# Course Factory — Wave 4 (A2.1) worker briefs and orchestrator recipes

These are the process artefacts of Wave 4 (2026-09-05/06), preserved from the ephemeral orchestrator
scratchpad that PR #86 (`claude/wave4-handoff`, reference-only, deleted at wave close) carried. The
content deliverables themselves are integrated in main (#82–#88); the reviews and source dumps were
not kept. Every later wave adapts these briefs to its level instead of re-inventing them — the
orchestrator pastes the relevant SPEC lines into each worker prompt (`docs/course-factory-prompt.md`,
"Every production worker's prompt must contain").

Every `S/wave4/...` path inside the briefs meant that scratchpad. Reading them now: `S/wave4/<x>.md`
is this folder's `<x>.md`; the JSON deliverables a brief tells a worker to write live in the
orchestrator's own scratchpad of the running wave.

| File | What it is |
|---|---|
| `common-header.md` | The header every Wave 4 worker prompt started with (role separation, output discipline, no commits) |
| `level-a2.1.md` | The binding A2.1 level constraint, incl. the two rulings (reading exposure, Wortliste exception) — derive the next level's constraint from it |
| `grammar-brief.md` | PR A: four new grammar topics (JSON shape, rule/example/exercise minimums, typed-production rule) |
| `extend-brief.md` | PR A2: typed production + depth patch for the live topics |
| `vocab-brief.md` | PR B: the level's Wortliste share + the defect classes to fix on live rows |
| `reading-brief.md` | PR C: reading rewrites inside the level with `checks`, exam-format lessons |
| `listening-brief.md` | PR C: 13 questions per exercise incl. dictation, transcript fidelity |
| `exam-brief.md` | PR D1: exam identity (track entry, Leitfaden, hub copy, writing tasks) — fact discipline |
| `test-brief.md` | PR D2: the Abschlusstest (Kurzversion, `questionMax`, gate, honesty contract) |
| `plan-brief.md` | PR D2: the 28-day plan (item shape, hour budget, hand-offs) |
| `review-brief.md` | The adversarial Opus reviewer prompt used on every piece |
| `integration-checklist.md` | Per-PR integration checklist (files, counts, gates, live-apply verification) |

## Recipes

### `pgmd5.mjs` — the Node-side md5 that matches Postgres

Postgres renders `jsonb` text with keys sorted by length then bytes and `", "` separators, and
`ORDER BY … COLLATE "C"` is what makes umlauts sort the same on both sides. This produced the
md5-identical verifications recorded in the tracker.

```js
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
// Reproduce Postgres jsonb::text: object keys sorted by (length, bytes), ", " between members, ": " after keys, ", " between array items.
function pg(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return '[' + v.map(pg).join(', ') + ']';
  if (typeof v === 'object') {
    const keys = Object.keys(v).sort((a, b) => {
      const la = Buffer.byteLength(a), lb = Buffer.byteLength(b);
      if (la !== lb) return la - lb;
      return Buffer.compare(Buffer.from(a), Buffer.from(b));
    });
    return '{' + keys.map(k => JSON.stringify(k) + ': ' + pg(v[k])).join(', ') + '}';
  }
  return JSON.stringify(v);
}
const c = JSON.parse(readFileSync('grammar-content-cache.json', 'utf8'));
const idSet = new Set(JSON.parse(readFileSync(process.argv[2], 'utf8')));
const byId = xs => [...xs].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const md5 = s => createHash('md5').update(s).digest('hex');
const ex = byId(c.exercises.filter(x => idSet.has(x.id)));
const ru = byId(c.rules.filter(x => idSet.has(x.id)));
const em = byId(c.examples.filter(x => idSet.has(x.id)));
console.log('n', ex.length, ru.length, em.length);
console.log('exercises_md5', md5(ex.map(x => x.id + '|' + x.question_de + '|' + x.correct_answer + '|' + (x.acceptable_answers == null ? '' : pg(x.acceptable_answers)) + '|' + (x.options == null ? '' : pg(x.options))).join('')));
console.log('rules_md5', md5(ru.map(r => r.id + '|' + r.title_en + '|' + pg(r.content) + '|' + (r.common_mistakes == null ? '' : pg(r.common_mistakes))).join('')));
console.log('examples_md5', md5(em.map(e => e.id + '|' + e.sentence_de + '|' + pg(e.word_breakdown)).join('')));
```

### `chunk-c.mjs` — split a migration into ≤27 KB statement-safe chunks

The Supabase connector's `apply_migration` takes one SQL string; a large generated migration is
applied as `…_chunk_01`, `…_chunk_02`, … (never splitting a statement).

```js
// Split a generated reading/listening migration into ≤26 KB statement-aligned chunks.
// Statements start at line-start keywords; bodies may contain ';' inside prose, so cut at the next start.
import { readFileSync, writeFileSync } from 'node:fs';
const [,, file, outDir, prefix] = process.argv;
const sql = readFileSync(file, 'utf8');
let body = sql.slice(sql.indexOf('BEGIN;') + 6, sql.indexOf('\nCOMMIT;'));
body = body.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
const startRe = /^(?:ALTER TABLE|UPDATE public\.|INSERT INTO public\.)/gm;
const starts = [...body.matchAll(startRe)].map(m => m.index);
const stmts = starts.map((s, i) => body.slice(s, starts[i + 1] ?? body.length).trim());
const LIMIT = 26000; const chunks = []; let buf = '';
for (const s of stmts) { if (buf.length + s.length + 2 > LIMIT) { chunks.push(buf); buf = ''; } buf += s + '\n\n'; }
if (buf) chunks.push(buf);
chunks.forEach((c, i) => writeFileSync(`${outDir}/${prefix}-${String(i + 1).padStart(2, '0')}.sql`, c));
const kinds = {}; for (const s of stmts) { const k = s.split(' ').slice(0, 2).join(' '); kinds[k] = (kinds[k] || 0) + 1; }
console.log(prefix, 'statements', stmts.length, kinds, 'chunks', chunks.map(c => c.length));
```
