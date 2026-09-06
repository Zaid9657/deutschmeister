// Split the Wortliste migration into ≤26 KB statement-aligned chunks (strip BEGIN/COMMIT and the trailing verification SELECTs).
import { readFileSync, writeFileSync } from 'node:fs';
const sql = readFileSync('migrations/2026-09-06-a2-1-wortliste.sql', 'utf8');
const body = sql.slice(sql.indexOf('BEGIN;') + 6, sql.indexOf('COMMIT;'));
// statements end with ";\n" at line end; INSERT blocks end with "\n);"
const stmts = [];
let cur = '';
for (const line of body.split('\n')) {
  if (/^\s*--/.test(line) || line.trim() === '') { continue; }
  cur += line + '\n';
  if (/;\s*$/.test(line)) { stmts.push(cur.trim()); cur = ''; }
}
if (cur.trim()) throw new Error('dangling statement');
const LIMIT = 26000;
const chunks = [];
let buf = '';
for (const s of stmts) {
  if (buf.length + s.length + 2 > LIMIT) { chunks.push(buf); buf = ''; }
  buf += s + '\n\n';
}
if (buf) chunks.push(buf);
chunks.forEach((c, i) => writeFileSync(`${process.argv[2]}/chunk-${String(i + 1).padStart(2, '0')}.sql`, c));
console.log('statements', stmts.length, 'inserts', stmts.filter(s => s.startsWith('INSERT')).length, 'updates', stmts.filter(s => s.startsWith('UPDATE')).length, 'chunks', chunks.length, chunks.map(c => c.length));
