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
