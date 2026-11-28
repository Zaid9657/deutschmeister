// Classify the branch's disagreements with the blind corpus into named, reproducible classes.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const dir = process.argv[2];
const misses = JSON.parse(readFileSync(`${dir}/misses.json`, 'utf8'));
const tasks = new Map();
for (const b of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())) for (const l of readFileSync(`${dir}/${b.name}/items.jsonl`, 'utf8').split('\n').filter(Boolean)) { const t = JSON.parse(l); tasks.set(t.id, t); }
const tileKey = JSON.parse(readFileSync(`${dir}/tile-answers.json`, 'utf8'));
const CLASSES = [
  ['statement tiles rebuilt as a yes/no question or predicate-first (the task rebuilds the dialogue statement)', (t, a, v) => t?.kind === 'tiles' && v === 'R' && /[.!]$/.test(tileKey[t.id] || '')],
  ['only the corrected word typed for a correction task (the input now says „Ganzer Satz")', (t, a, v) => v === 'R' && /^Korrigieren/.test(t?.promptDe || '') && !/\s/.test(a.trim())],
  ['uncontracted am/im/ans/ins („an dem Freitag" = that Friday) — not adopted', (t, a, v) => v === 'R' && /(?<!\p{L})(?:an dem|in dem|in das|an das)(?!\p{L})/u.test(a)],
  ['phrase placed after the final verb part or the predicate (Nachfeld) — not neutral written German', (t, a, v) => v === 'R' && /\b(?:ein|auf|an|ab|fern|mit|gekocht|gearbeitet|spielen|fahren|fliegen|warten|nehmen|krank|traurig|glücklich|auf)\s+(?:heute|gestern|morgen|am |um |an |nach |in |im )/i.test(a)],
  ['a different preposition or word that changes the meaning („ab/vor/bis Freitag" for „am Freitag")', (t, a, v) => v === 'R' && /Korrigieren Sie das Wort um/.test(t?.promptDe || '')],
  ['digits for a number-word task (writing the number IS the task)', (t, a, v) => v === 'R' && /^\d+$/.test(a.trim())],
  ['an open gap filled with another word than the taught one where the prompt now names the word', (t, a, v) => v === 'R' && /\(schön\)/.test(t?.promptDe || '')],
  ['natural-gender er/sie for das Kind/das Baby in a generic sentence (es is the A1 answer)', (t, a, v) => v === 'R' && /Kind|Baby/.test(t?.promptDe || '') && /^(?:Er|Sie)$/.test(a.trim())],
  ['letter name / article added to a letter or spelling answer', (t, a, v) => v === 'R' && /buchstab|Buchstabe|Lesen Sie die Buchstaben|Wie heißt/i.test(t?.promptDe || '')],
  ['a fronted order accepted although the prompt names the opening (lenient: grammatical German kept)', (t, a, v) => v === 'A' && /Beginnen Sie mit/.test(t?.promptDe || '')],
];
const out = {}; const rest = [];
for (const line of misses.branch) {
  const m = /^(REJECTED-CORRECT|ACCEPTED-WRONG) (\S+) «(.*)» — (.*)$/.exec(line);
  if (!m) continue;
  const [, kind, id, answer, why] = m; const t = tasks.get(id); const v = kind === 'REJECTED-CORRECT' ? 'R' : 'A';
  const cls = CLASSES.find(([, test]) => test(t, answer, v));
  if (cls) (out[cls[0]] ||= []).push(`${id} «${answer}»`); else rest.push(`${kind} ${id} «${answer}» — ${why} | ${t?.promptDe || tileKey[id] || ''}`);
}
for (const [k, v] of Object.entries(out)) console.log(`${String(v.length).padStart(4)}  ${k}`);
console.log(`${String(rest.length).padStart(4)}  UNCLASSIFIED`);
writeFileSync(`${dir}/adjudication.json`, JSON.stringify({ classes: out, unclassified: rest }, null, 1));