// Re-checks the numbers SCOUT-2026-10-17.md prints against fresh measurements. Exit 1 on any mismatch.
// Usage: node verify-report.mjs <SCOUT-2026-10-17.md> <bank.json from bank.mjs> <horizon.json from horizon-lexis.mjs>
import { readFileSync } from 'node:fs';

const [reportPath, bankPath, horizonPath] = process.argv.slice(2);
const report = readFileSync(reportPath, 'utf8');
const bank = JSON.parse(readFileSync(bankPath, 'utf8'));
const hz = JSON.parse(readFileSync(horizonPath, 'utf8'));
const lines = report.split(/\r?\n/).map((l) => l.replace(/\*\*/g, ''));
const bad = [];
const key = (level) => (level === 'A2.1' ? 'a21' : 'a22');

// §1.3 per-topic rows
const rowRe = /^\| (A2\.[12]) \| (\d+) \| ([a-z-]+) \| (\d+)\/(\d+) \| (\d+) \((\d+), (\d+)\) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \|$/;
let rows = 0;
for (const line of lines) {
  const m = rowRe.exec(line);
  if (!m) continue;
  rows += 1;
  const [, level, order, slug, ...nums] = m;
  const b = bank.rows.find((r) => r.slug === slug && r.level === level);
  const t = hz[key(level)]?.byTopic?.[slug];
  if (!b || !t) { bad.push(`${slug}: not measured`); continue; }
  const want = [b.order, b.raw, b.typedRaw, b.usable, b.typedUsable, b.mcUsable, t.n, t.day1, t.one, t.horizonNull];
  const got = [Number(order), ...nums.map(Number)];
  const names = ['order', 'raw', 'typedRaw', 'gate', 'gateTyped', 'gateMC', 'built', 'day1', 'plus1', 'never'];
  names.forEach((n, i) => { if (want[i] !== got[i]) bad.push(`${slug}.${n}: report ${got[i]}, measured ${want[i]}`); });
}
if (rows !== 24) bad.push(`expected 24 topic rows in §1.3, parsed ${rows}`);

// §1.3 totals rows
const totRe = /^\| \| \| (A2\.[12]) total \| (\d+)\/(\d+) \| (\d+) \((\d+), (\d+)\) \| (\d+) \| (\d+) \| (\d+) \| (\d+) \|$/;
let totals = 0;
for (const line of lines) {
  const m = totRe.exec(line);
  if (!m) continue;
  totals += 1;
  const [, level, ...nums] = m;
  const lt = bank.levelTotals[level];
  const h = hz[key(level)];
  const want = [lt.raw, lt.typedRaw, lt.usable, lt.typedUsable, lt.mcUsable, h.built, h.buckets['0'], h.buckets['1'], h.grammar.horizonNull];
  nums.map(Number).forEach((g, i) => { if (want[i] !== g) bad.push(`${level} total col ${i}: report ${g}, measured ${want[i]}`); });
}
if (totals !== 2) bad.push(`expected 2 totals rows, parsed ${totals}`);

// Sentences and the §1.2 table that quote the same measurements
const must = [];
for (const level of ['A2.1', 'A2.2']) {
  const lt = bank.levelTotals[level];
  const h = hz[key(level)];
  must.push(`${lt.raw} (${lt.typedRaw} typed)`, `${lt.usable} (${lt.typedUsable} typed, ${lt.mcUsable} MC)`, `| ${h.built}`);
}
const b21 = hz.a21.buckets;
const b22 = hz.a22.buckets;
must.push(`0 tokens ${b21['0']}, 1 token ${b21['1']}, 2 tokens ${b21['2']}, 3+ ${b21['3+']} (${hz.a21.distinctUnknown} distinct`);
must.push(`${b22['0']} / ${b22['1']} / ${b22['2']} / ${b22['3+']} (${hz.a22.distinctUnknown} distinct)`);
must.push(`${hz.a21.grammar.horizonNull} A2.1 and ${hz.a22.grammar.horizonNull} A2.2 items are`);
const flat = lines.join(' ').replace(/\s+/g, ' '); // a quoted figure may wrap across lines
for (const s of must) if (!flat.includes(s)) bad.push(`missing or different in report: "${s}"`);

console.log(`checked ${rows} topic rows, ${totals} totals rows, ${must.length} quoted figures`);
if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
console.log('all report figures match the fresh measurement');
