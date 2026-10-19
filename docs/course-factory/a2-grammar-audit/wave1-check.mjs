// Checks migrations/2026-10-19-a2-grammar-rule-fixes.sql against grammar-content-cache.json and the WAVE1 table.
//
//   node docs/course-factory/a2-grammar-audit/wave1-check.mjs [--cache <path>] [--emit-verify]
//
// For every UPDATE: (a) the row id exists in the cache table it names; (b) the guarded field's cache value equals the
// guard exactly (strings byte for byte, JSON structurally); plus: the new value differs from the guard (so a second
// run is a no-op), no two statements touch the same field or a field and its parent, and every JSON literal parses.
// (c) The statements and WAVE1-2026-10-19.md agree: every table row names an existing statement with the same row id
// and field, every statement is in the table, and the counts are printed.
// --emit-verify rewrites migrations/2026-10-19-a2-grammar-rule-fixes.verify.sql from the parsed statements.
// --applied checks a dump taken AFTER the migration instead: every field holds its statement's new value (a deleted
// key is absent), so (b) and the no-op checks are replaced by that one.
// Exit code 1 on any failure.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SQL = join(ROOT, 'migrations', '2026-10-19-a2-grammar-rule-fixes.sql');
const VERIFY = join(ROOT, 'migrations', '2026-10-19-a2-grammar-rule-fixes.verify.sql');
const DOC = join(dirname(fileURLToPath(import.meta.url)), 'WAVE1-2026-10-19.md');
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const CACHE = arg('--cache') ?? join(ROOT, 'grammar-content-cache.json');
const APPLIED = process.argv.includes('--applied');

const cache = JSON.parse(readFileSync(CACHE, 'utf8'));
const TABLES = { grammar_rules: cache.rules, grammar_examples: cache.examples, grammar_topics: cache.topics };
const fails = [];
const fail = (s, msg) => fails.push(`${s}: ${msg}`);
// The guards were taken from the 2026-10-15 dump; an older cache (origin/main carried 2026-08-24 on 2026-10-19)
// predates the A2.2 re-cut and would fail rows for the wrong reason.
if (!(cache.dumpedAt >= '2026-10-15')) fails.push(`cache ${CACHE} is dumped ${cache.dumpedAt}; pass --cache <a dump from 2026-10-15 or later>`);

// ── parse ──
const Q = String.raw`\$q\$([\s\S]*?)\$q\$`;
const SET_FORMS = [
  [new RegExp(String.raw`^jsonb_set\((\w+), '\{([^}]*)\}', to_jsonb\(${Q}::text\)\)$`), (m) => ({ col: m[1], path: m[2], kind: 'text', value: m[3], self: m[1] })],
  [new RegExp(String.raw`^jsonb_set\((\w+), '\{([^}]*)\}', ${Q}::jsonb\)$`), (m) => ({ col: m[1], path: m[2], kind: 'json', value: m[3], self: m[1] })],
  [/^(\w+) #- '\{([^}]*)\}'$/, (m) => ({ col: m[1], path: m[2], kind: 'delete', self: m[1] })],
  [new RegExp(String.raw`^${Q}::jsonb$`), (m) => ({ path: null, kind: 'json', value: m[1] })],
  [new RegExp(String.raw`^${Q}$`), (m) => ({ path: null, kind: 'text', value: m[1] })],
];
const GUARD_FORMS = [
  [new RegExp(String.raw`^(\w+) #>> '\{([^}]*)\}' = ${Q}$`), (m) => ({ col: m[1], path: m[2], kind: 'text', value: m[3] })],
  [new RegExp(String.raw`^(\w+) #> '\{([^}]*)\}' = ${Q}::jsonb$`), (m) => ({ col: m[1], path: m[2], kind: 'json', value: m[3] })],
  [new RegExp(String.raw`^(\w+) = ${Q}::jsonb$`), (m) => ({ col: m[1], path: null, kind: 'json', value: m[2] })],
  [new RegExp(String.raw`^(\w+) = ${Q}$`), (m) => ({ col: m[1], path: null, kind: 'text', value: m[2] })],
];
const match = (forms, s) => { for (const [re, f] of forms) { const m = s.match(re); if (m) return f(m); } return null; };

const sql = readFileSync(SQL, 'utf8');
if (sql.includes('\r')) fails.push('SQL file contains CR characters (CRLF): multi-line guards would not match');
const body = sql.slice(sql.indexOf('\nBEGIN;\n'), sql.lastIndexOf('\nCOMMIT;'));
const heads = [...body.matchAll(/^-- (S\d{3}) · (.*)$/gm)];
const stmts = heads.map((h, i) => {
  const chunk = body.slice(h.index + h[0].length, i + 1 < heads.length ? heads[i + 1].index : body.length);
  const m = chunk.match(/\nUPDATE public\.(\w+) SET (\w+) = ([\s\S]*?)\nWHERE id = '([0-9a-f-]{36})' AND ([\s\S]*?(?:\$q\$|::jsonb));\n/);
  if (!m) { fail(h[1], 'statement does not parse'); return null; }
  const [, table, col, setExpr, id, guardExpr] = m;
  const set = match(SET_FORMS, setExpr); const guard = match(GUARD_FORMS, guardExpr);
  if (!set) fail(h[1], `SET form not recognised: ${setExpr.slice(0, 60)}`);
  if (!guard) fail(h[1], `guard form not recognised: ${guardExpr.slice(0, 60)}`);
  return { n: h[1], label: h[2], table, col, id, set, guard };
}).filter(Boolean);
const nums = stmts.map((s) => s.n);
nums.forEach((n, i) => { if (n !== `S${String(i + 1).padStart(3, '0')}`) fail(n, `out of sequence (expected S${String(i + 1).padStart(3, '0')})`); });

// ── (a) + (b) against the cache ──
const getPath = (v, path) => (path ? path.split(',') : []).reduce((o, k) => (o == null ? undefined : o[/^\d+$/.test(k) ? Number(k) : k]), v);
const fieldOf = (s) => (s.guard?.path ? `${s.col}{${s.guard.path}}` : s.col);
const seen = new Map();
for (const s of stmts) {
  const { n, table, col, id, set, guard } = s;
  if (!set || !guard) continue;
  const rows = TABLES[table];
  if (!rows) { fail(n, `unknown table ${table}`); continue; }
  const row = rows.find((r) => r.id === id);
  if (!row) { fail(n, `(a) id ${id} not in cache.${table}`); continue; }
  if (guard.col !== col || (set.self && set.self !== col)) fail(n, 'SET column, guard column and jsonb_set source differ');
  if ((set.path ?? null) !== (guard.path ?? null)) fail(n, `SET path {${set.path}} ≠ guard path {${guard.path}}`);
  const cur = getPath(row[col], guard.path);
  if (APPLIED) {
    let want = set.value;
    if (set.kind === 'json') { try { want = JSON.parse(set.value); } catch (e) { fail(n, `new JSON does not parse: ${e.message}`); continue; } }
    const ok = set.kind === 'delete' ? cur === undefined : isDeepStrictEqual(cur, want);
    if (!ok) fail(n, `(applied) cache at ${fieldOf(s)} does not hold the new value\n    cache: ${JSON.stringify(cur)?.slice(0, 160)}`);
  } else if (guard.kind === 'text') {
    if (typeof cur !== 'string') fail(n, `(b) cache value at ${fieldOf(s)} is ${JSON.stringify(cur)?.slice(0, 60)}, not a string`);
    else if (cur !== guard.value) fail(n, `(b) guard ≠ cache at ${fieldOf(s)}\n    cache: ${JSON.stringify(cur)}\n    guard: ${JSON.stringify(guard.value)}`);
  } else {
    let g; try { g = JSON.parse(guard.value); } catch (e) { fail(n, `guard JSON does not parse: ${e.message}`); continue; }
    if (!isDeepStrictEqual(cur, g)) fail(n, `(b) JSON guard ≠ cache at ${fieldOf(s)}\n    cache: ${JSON.stringify(cur)}`);
  }
  if (!APPLIED && set.kind === 'json') { try { const v = JSON.parse(set.value); if (isDeepStrictEqual(v, cur)) fail(n, 'new value equals the current one'); } catch (e) { fail(n, `new JSON does not parse: ${e.message}`); } }
  if (!APPLIED && set.kind === 'text' && set.value === cur) fail(n, 'new value equals the current one');
  if (set.kind === 'text' && /\*/.test(set.value)) fail(n, 'new text contains an asterisk (audit Markdown copied?)');
  const key = `${table}|${id}|${col}`;
  const path = guard.path ?? '';
  for (const p of seen.get(key) ?? []) {
    if (p.path === path || p.path.startsWith(`${path},`) || path.startsWith(`${p.path},`) || p.path === '' || path === '') fail(n, `touches ${fieldOf(s)} which ${p.n} also touches`);
  }
  seen.set(key, [...(seen.get(key) ?? []), { n, path }]);
}

// ── (c) against the WAVE1 table ──
const doc = readFileSync(DOC, 'utf8');
const docRows = [...doc.matchAll(/^\| (S\d{3}) \| ([^|]+) \| ([^|]+) \| `([0-9a-f-]{36})` \| `([^`]+)` \| ([^|]*) \|$/gm)]
  .map((m) => ({ n: m[1], item: m[2].trim(), where: m[3].trim(), id: m[4], field: m[5] }));
const byN = new Map(stmts.map((s) => [s.n, s]));
for (const r of docRows) {
  const s = byN.get(r.n);
  if (!s) { fail(r.n, 'in WAVE1 table but not in the SQL'); continue; }
  if (s.id !== r.id) fail(r.n, `WAVE1 row id ${r.id} ≠ SQL ${s.id}`);
  if (fieldOf(s) !== r.field) fail(r.n, `WAVE1 field ${r.field} ≠ SQL ${fieldOf(s)}`);
}
const referenced = new Set(docRows.map((r) => r.n));
for (const s of stmts) if (!referenced.has(s.n)) fail(s.n, 'in the SQL but not in the WAVE1 table');
const items = new Set(docRows.map((r) => r.item.replace(/ (BLOCKER|MAJOR|MINOR).*$/, '')));

// ── the audit itself, when it is at hand: every BLOCKER/MAJOR item has a row, and every row's severity is the audit's ──
const AUDIT = arg('--audit') ?? join(dirname(DOC), 'AUDIT-2026-10-17.md');
let auditLine = `audit not found at ${AUDIT} (pass --audit <path>): item coverage not checked`;
if (existsSync(AUDIT)) {
  const sev = new Map();
  let topic = null;
  for (const line of readFileSync(AUDIT, 'utf8').split('\n')) {
    const t = line.match(/^### (A2\.\d-\d\d) /); if (t) topic = t[1];
    const it = line.match(/^(\d+)\. \*\*(BLOCKER|MAJOR|MINOR) · /); if (it && topic) sev.set(`${topic} #${it[1]}`, it[2]);
  }
  const rowSev = new Map(docRows.map((r) => r.item.match(/^(A2\.\d-\d\d #\d+) (BLOCKER|MAJOR|MINOR)/)).filter(Boolean).map((m) => [m[1], m[2]]));
  for (const [k, v] of rowSev) if (sev.get(k) !== v) fail(k, `WAVE1 says ${v}, the audit says ${sev.get(k) ?? 'no such item'}`);
  const bm = [...sev].filter(([, v]) => v !== 'MINOR').map(([k]) => k);
  for (const k of bm) if (!rowSev.has(k)) fail(k, `${sev.get(k)} item of the audit has no WAVE1 row`);
  auditLine = `audit BLOCKER/MAJOR items with a row: ${bm.filter((k) => rowSev.has(k)).length}/${bm.length} (of ${sev.size} items); MINOR items with a row: ${[...rowSev].filter(([, v]) => v === 'MINOR').length}`;
}

// ── report ──
const byTable = stmts.reduce((a, s) => ({ ...a, [s.table]: (a[s.table] ?? 0) + 1 }), {});
console.log(`UPDATE statements: ${stmts.length} (${Object.entries(byTable).map(([t, k]) => `${t} ${k}`).join(', ')})`);
console.log(`${APPLIED ? 'new values present in' : 'guards checked against'} cache (${cache.dumpedAt}): ${stmts.length - new Set(fails.filter((f) => /\(a\)|\(b\)|\(applied\)/.test(f)).map((f) => f.slice(0, 4))).size}/${stmts.length}`);
console.log(`WAVE1 table: ${docRows.length} item×field rows, ${referenced.size} distinct statements, ${items.size} audit items`);
console.log(auditLine);

// ── verify.sql ──
if (process.argv.includes('--emit-verify')) {
  const lit = (v) => `$q$${v}$q$`;
  const where = (s) => `WHERE id = '${s.id}'`;
  const guardSql = (s) => {
    const g = s.guard;
    if (g.path && g.kind === 'text') return `${s.col} #>> '{${g.path}}' = ${lit(g.value)}`;
    if (g.path) return `${s.col} #> '{${g.path}}' = ${lit(g.value)}::jsonb`;
    return g.kind === 'json' ? `${s.col} = ${lit(g.value)}::jsonb` : `${s.col} = ${lit(g.value)}`;
  };
  const after = (s) => {
    const p = s.set.path;
    if (s.set.kind === 'delete') return [`NOT (${s.col} ? '${p}')`, `${s.col} #>> '{${p}}'`];
    if (p && s.set.kind === 'text') return [`${s.col} #>> '{${p}}' = ${lit(s.set.value)}`, `${s.col} #>> '{${p}}'`];
    if (p) return [`${s.col} #> '{${p}}' = ${lit(s.set.value)}::jsonb`, `(${s.col} #> '{${p}}')::text`];
    return s.set.kind === 'json' ? [`${s.col} = ${lit(s.set.value)}::jsonb`, `${s.col}::text`] : [`${s.col} = ${lit(s.set.value)}`, s.col];
  };
  const b1 = stmts.map((s) => `  SELECT '${s.n}' AS stmt, count(*) AS live_matches FROM public.${s.table} ${where(s)} AND ${guardSql(s)}`).join('\n  UNION ALL\n');
  const b2 = stmts.map((s) => { const [ok, val] = after(s); return `  SELECT '${s.n}' AS stmt, (${ok}) AS ok, ${val} AS value FROM public.${s.table} ${where(s)}`; }).join('\n  UNION ALL\n');
  writeFileSync(VERIFY, `-- Read-only checks for migrations/2026-10-19-a2-grammar-rule-fixes.sql (${stmts.length} UPDATEs).
-- Generated by docs/course-factory/a2-grammar-audit/wave1-check.mjs --emit-verify from the parsed statements; do not
-- edit by hand. Nothing here writes.

-- Block 1 — BEFORE applying. One row per UPDATE: how many live rows match its id AND its guard right now.
-- Expect live_matches = 1 on every row. Rows that are not 1 sort first: 0 means the row drifted since the
-- 2026-10-15 dump (that UPDATE would change nothing), so re-dump the cache and re-run wave1-check.mjs.
SELECT stmt, live_matches FROM (
${b1}
) c ORDER BY (live_matches = 1), stmt;

-- Block 2 — AFTER applying. One row per UPDATE with the field's value now; ok = the new value is in place
-- (for S-statements that delete a JSON key: the key is gone). Rows with ok = false sort first.
SELECT stmt, ok, value FROM (
${b2}
) a ORDER BY ok, stmt;
`);
  console.log(`wrote ${VERIFY}`);
}

if (fails.length) { console.log(`\nFAIL (${fails.length})\n${fails.join('\n')}`); process.exit(1); }
console.log('OK');
