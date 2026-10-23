// Read-only probe of grammar-content-cache.json's shape (A2 scout, 2026-10-17).
// Usage: node probe-cache.mjs <path-to-cache.json>
import { readFileSync } from 'node:fs';

const path = process.argv[2];
const cache = JSON.parse(readFileSync(path, 'utf8'));
console.log('top-level keys:', Object.keys(cache));
for (const [k, v] of Object.entries(cache)) {
  if (Array.isArray(v)) {
    console.log(`\n[${k}] array of ${v.length}`);
    if (v.length) {
      const keys = new Set();
      for (const row of v) if (row && typeof row === 'object') Object.keys(row).forEach((x) => keys.add(x));
      console.log('  row keys:', [...keys].join(', '));
      const sample = { ...v[0] };
      for (const sk of Object.keys(sample)) {
        const s = JSON.stringify(sample[sk]);
        if (s && s.length > 120) sample[sk] = s.slice(0, 120) + '…';
      }
      console.log('  sample:', JSON.stringify(sample).slice(0, 900));
    }
  } else if (v && typeof v === 'object') {
    const ks = Object.keys(v);
    console.log(`\n[${k}] object with ${ks.length} keys: ${ks.slice(0, 15).join(', ')}${ks.length > 15 ? ' …' : ''}`);
    const first = v[ks[0]];
    if (Array.isArray(first)) console.log(`  first value: array of ${first.length}`, JSON.stringify(first[0]).slice(0, 600));
    else console.log('  first value:', JSON.stringify(first).slice(0, 600));
  } else {
    console.log(`\n[${k}] =`, JSON.stringify(v).slice(0, 200));
  }
}
