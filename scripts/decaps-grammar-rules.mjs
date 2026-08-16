// De-CAPS the grammar_rules content at the data source.
//
// The DB prose uses mid-sentence ALL-CAPS for emphasis ("sound TRULY German").
// The static site suppresses it at render time (astro-site/src/components/
// RichText.astro); the SPA shows the shouting raw. This script applies the
// SAME rules as RichText to the data itself, so both renderers show calm text
// and RichText becomes a no-op safety net:
//   - lowercases runs of 2+ uppercase letters (umlauts included, internal
//     hyphen/apostrophe allowed),
//   - skips line-initial runs (labels/headings like "MEANING:"),
//   - skips roman numerals (Konjunktiv II, Futur II, ...),
//   - skips mixed-case tokens ("dER", "UEBERrascht"),
//   - maps SS-for-ß spellings to the correct form (BLOSS → bloß).
//
// Usage:
//   node scripts/decaps-grammar-rules.mjs .cache/grammar-content-cache.json out/
// Writes:
//   out/decaps-report.json   — every change: rule id, path, before, after
//   out/decaps-updates.sql   — one UPDATE per changed rule (full content JSONB)
//   out/cache-decapsed.json  — the input cache with the same transform applied
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [cachePath, outDir] = process.argv.slice(2);
if (!cachePath || !outDir) {
  console.error('usage: node scripts/decaps-grammar-rules.mjs <cache.json> <outdir>');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const TOKEN = /[A-ZÄÖÜ][A-ZÄÖÜ'’\-]*[A-ZÄÖÜ]/gu;
const ROMAN = new Set(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']);
const CAPS_OVERRIDE = new Map([
  ['BLOSS', 'bloß'],
  ['GROSS', 'groß'],
  ['HEISST', 'heißt'],
  ['HEISSEN', 'heißen'],
  ['SCHLIESSLICH', 'schließlich'],
  ['REGELMÄSSIG', 'regelmäßig'],
]);
const isLetterNum = (c) => !!c && /[\p{L}\p{N}]/u.test(c);
const isLower = (c) => !!c && /\p{Ll}/u.test(c);

// ---------------------------------------------------------------------------
// Casing decision. Unlike the display-time normalizer (which just lowercases
// and bolds), a DATA fix must restore correct German orthography: nouns are
// capitalized ("am ENDE" → "am Ende"), everything else is lowercased
// ("ÄNDERN sich" → "ändern sich"). Two signals decide:
//  1. Corpus frequency — every correctly-cased occurrence of the word across
//     the whole content cache votes for its casing.
//  2. Determiner heuristic — a German article/possessive right before the
//     token almost always marks a noun → Titlecase.
// ---------------------------------------------------------------------------
const DETERMINERS = new Set(
  ('der die das dem den des ein eine einem einen einer eines am im zum zur beim vom ans ins aufs ' +
   'mein meine meinem meinen meiner meines dein deine deinem deinen deiner deines ' +
   'sein seine seinem seinen seiner seines ihr ihre ihrem ihren ihrer ihres ' +
   'unser unsere unserem unseren unserer unseres euer eure eurem euren eurer eures ' +
   'kein keine keinem keinen keiner keines jede jeder jedes jedem jeden diese dieser dieses diesem diesen').split(' ')
);

let CASE_FREQ = new Map(); // wordform → count (only non-shouted forms)
function buildCorpus(cache) {
  const WORD = /[\p{L}][\p{L}'’\-]*[\p{L}]/gu;
  const count = (s) => {
    for (const m of String(s).matchAll(WORD)) {
      const w = m[0];
      if (/^[A-ZÄÖÜ'’\-]+$/u.test(w)) continue; // skip shouted forms themselves
      CASE_FREQ.set(w, (CASE_FREQ.get(w) ?? 0) + 1);
    }
  };
  const walkStrings = (v) => {
    if (typeof v === 'string') count(v);
    else if (Array.isArray(v)) v.forEach(walkStrings);
    else if (v && typeof v === 'object') Object.values(v).forEach(walkStrings);
  };
  walkStrings(cache);
}

function chooseCasing(tok, before) {
  const override = CAPS_OVERRIDE.get(tok);
  if (override) return override;
  const lower = tok.toLowerCase();
  const title = lower[0].toUpperCase() + lower.slice(1);
  const fLower = CASE_FREQ.get(lower) ?? 0;
  const fTitle = CASE_FREQ.get(title) ?? 0;
  if (fLower || fTitle) return fTitle > fLower ? title : lower;
  // Unseen word: a determiner immediately before marks a German noun.
  const prevWord = (before.match(/([\p{L}'’\-]+)[^\S\n]+$/u) || [])[1];
  if (prevWord && DETERMINERS.has(prevWord.toLowerCase())) return title;
  return lower;
}

function decapsString(raw) {
  let out = '';
  let last = 0;
  let changed = false;
  for (const m of raw.matchAll(TOKEN)) {
    const i = m.index;
    const tok = m[0];
    const end = i + tok.length;
    const override = CAPS_OVERRIDE.get(tok);
    if (isLetterNum(raw[i - 1]) || isLower(raw[end])) continue;
    // Ending markers like "-ER" in declension tables keep their caps.
    if (raw[i - 1] === '-') continue;
    const lineInitial = /(^|\n)[^\S\n]*$/.test(raw.slice(0, i));
    if (!override && (lineInitial || ROMAN.has(tok))) continue;
    out += raw.slice(last, i) + chooseCasing(tok, raw.slice(Math.max(0, i - 40), i));
    last = end;
    changed = true;
  }
  if (!changed) return null;
  return out + raw.slice(last);
}

// Walk any JSON value, transforming every string. Returns [newValue, changes[]].
function walk(value, path, changes) {
  if (typeof value === 'string') {
    const next = decapsString(value);
    if (next !== null) {
      changes.push({ path, before: value, after: next });
      return next;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((v, i) => walk(v, `${path}[${i}]`, changes));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = walk(v, `${path}.${k}`, changes);
    return out;
  }
  return value;
}

const cache = JSON.parse(readFileSync(cachePath, 'utf8'));
buildCorpus(cache);
const report = [];
const sqlStatements = [];
let changedRules = 0;

const newRules = cache.rules.map((rule) => {
  const changes = [];
  const content = walk(rule.content, 'content', changes);
  const common = rule.common_mistakes != null ? walk(rule.common_mistakes, 'common_mistakes', changes) : rule.common_mistakes;
  if (changes.length === 0) return rule;
  changedRules++;
  report.push({ id: rule.id, title: rule.title_en, changes });
  const parts = [`content = ${sqlLit(content)}::jsonb`];
  if (JSON.stringify(common) !== JSON.stringify(rule.common_mistakes)) {
    parts.push(`common_mistakes = ${sqlLit(common)}::jsonb`);
  }
  sqlStatements.push(`UPDATE grammar_rules SET ${parts.join(', ')} WHERE id = '${rule.id}';`);
  return { ...rule, content, common_mistakes: common };
});

function sqlLit(obj) {
  // Postgres string literal of the JSON, with quotes doubled.
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'`;
}

writeFileSync(join(outDir, 'decaps-report.json'), JSON.stringify(report, null, 1));
writeFileSync(join(outDir, 'decaps-updates.sql'), sqlStatements.join('\n') + '\n');
writeFileSync(join(outDir, 'cache-decapsed.json'), JSON.stringify({ ...cache, rules: newRules }));
console.log(`rules changed: ${changedRules} / ${cache.rules.length}`);
console.log(`total string edits: ${report.reduce((s, r) => s + r.changes.length, 0)}`);
console.log(`outputs in ${outDir}`);
