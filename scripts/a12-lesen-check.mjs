#!/usr/bin/env node
// THE AUTHORING CHECK for the A1.2 checkpoint Lesen units (DaF review #11, MAJOR M8; design verdicts in
// docs/course-factory/a12-rebuild/DESIGN-m8-lesen-2026-10-19.md).
//
//   node scripts/a12-lesen-check.mjs                    # the committed units (src/data/curricula/a12.lesen.js)
//   node scripts/a12-lesen-check.mjs draft.json [-v]    # a draft: { "checkpoint": "a1.2-cpN", "papers": [[unit × 4] × 4] }
//
// A unit: { id, type, text, question, questionEn, options: [a, b], answer, evidence, rival, explanationDe,
// explanationEn, pair: 1 | 2 }. Checked, in this order, and every finding printed with the unit's id:
//   1. SHAPE — two different options, the answer one of them, a W-question, the evidence a span of the text,
//      both options in the text (competing information), a text type the course has shown, a reading load.
//   2. TAUGHT — every token of the text, question, options and German explanation taught by the checkpoint's
//      last Lektion (the validator's own per-Lektion lexicon), and no construction past it.
//   3. NOT PRACTISED — no sentence of the text is a dialogue line or a pool item of the course.
//   4. PAIRS — a paper is two pairs; a pair shares every text mark the switches read and has its keys at A
//      and at B.
//   5. THE GATE — tests/helpers/lesenGate.mjs on every paper: no strategy above 2 of 4, no switch above 2.
//   6. THE BANK — 16 distinct texts per checkpoint, no answer text more than twice in a paper;
//      across all checkpoints, balanced positions and question-type ranks, all order strategies ≤ half;
//      every surface feature × order rule and its inverse ≤ 36/64.
// Feature PAIRS × order are reported only (owner decision 2026-10-20); tests pin their measured maxima.
// Exit code 1 on any finding.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { levelSpec, taughtUpTo, untaughtTokens, constructionHorizonIndex, loadPoolItems } from './validate-curriculum.mjs';
import { auditBankFeatures, auditBankOrder, auditPapers, conditionsOf, tokens } from '../tests/helpers/lesenGate.mjs';

const arg = process.argv.slice(2).find((a) => !a.startsWith('-'));
const verbose = process.argv.includes('-v');
const spec = levelSpec('a1.2');
const curriculum = spec.curriculum;
const knownUpTo = taughtUpTo(curriculum, spec);
const horizon = constructionHorizonIndex('a1.2');
const TYPES = new Set(['exchange', 'message', 'note', 'ad', 'notice', 'form']);
const W_RE = /^(?:Wer|Wen|Wem|Was|Wann|Wo|Wohin|Woher|Wie|Welche[nmrs]?|Warum|Um wie viel Uhr)\b.*\?$/;

let byCheckpoint;
if (arg && arg.endsWith('.json')) {
  const draft = JSON.parse(readFileSync(resolve(arg), 'utf8'));
  byCheckpoint = { [draft.checkpoint]: draft.papers };
} else {
  const mod = await import(pathToFileURL(resolve(arg || 'src/data/curricula/a12.lesen.js')).href);
  byCheckpoint = Object.fromEntries(Object.entries(mod.LESEN_A12).map(([k, v]) => [k, v.papers]));
}

const norm = (s) => tokens(s).join(' ');
const practised = new Set();
for (const l of curriculum.lektionen) for (const line of l.dialog?.lines || []) for (const s of String(line.de).split(/(?<=[.!?])\s+/)) practised.add(norm(s));
for (const it of loadPoolItems('a1.2')) for (const s of [it.questionDe, it.answer]) if (s) practised.add(norm(s));

const findings = [];
const flag = (id, msg) => findings.push(`${id}: ${msg}`);

for (const [cpId, papers] of Object.entries(byCheckpoint)) {
  const cp = curriculum.checkpoints.find((c) => c.id === cpId);
  if (!cp) { flag(cpId, 'no such checkpoint'); continue; }
  const known = knownUpTo.get(cp.afterLektion);
  if (!Array.isArray(papers) || papers.length !== 4) flag(cpId, `${papers?.length ?? 0} papers, not 4 (one per round 0–3)`);
  const texts = new Map();
  for (const [pi, paper] of (papers || []).entries()) {
    const pid = `${cpId} paper ${pi + 1}`;
    if (!Array.isArray(paper) || paper.length !== 4) { flag(pid, `${paper?.length ?? 0} units, not 4`); continue; }
    for (const u of paper) {
      const id = u.id || `${pid} unit ?`;
      // 1. SHAPE
      if (!Array.isArray(u.options) || u.options.length !== 2 || u.options[0] === u.options[1]) flag(id, 'two different options');
      if (!u.options?.includes(u.answer)) flag(id, 'the answer is not an option');
      if (!W_RE.test(String(u.question || ''))) flag(id, `not a W-question: „${u.question}"`);
      if (!String(u.text || '').includes(String(u.evidence || '\u0000'))) flag(id, 'the evidence is not a span of the text');
      for (const o of u.options || []) if (!tokens(u.text).join(' ').includes(tokens(o).join(' '))) flag(id, `option „${o}" does not stand in the text — no competing information`);
      if (!TYPES.has(u.type)) flag(id, `text type „${u.type}" — one of ${[...TYPES].join(', ')}`);
      const n = tokens(u.text).length;
      if (n < 12 || n > 70) flag(id, `${n} words in the text (12–70)`);
      if (![1, 2].includes(u.pair)) flag(id, 'pair must be 1 or 2');
      if (!u.questionEn || !u.explanationDe || !u.explanationEn || !u.rival) flag(id, 'questionEn, explanationDe, explanationEn and rival are required');
      // 2. TAUGHT
      for (const [field, value] of [['text', u.text], ['question', u.question], ['options', (u.options || []).join(' . ')], ['explanationDe', u.explanationDe]]) {
        const untaught = untaughtTokens({ questionDe: String(value || '').replace(/\n/g, ' '), answer: '' }, known, spec);
        if (untaught.length) flag(id, `${field}: not taught by L${cp.afterLektion}: ${untaught.join(', ')}`);
        for (const sentence of String(value || '').split(/(?<=[.!?])\s+|\n+/).filter(Boolean)) {
          const h = horizon({ questionDe: sentence, answer: '' });
          if (h === null) flag(id, `${field}: a construction the course never teaches in „${sentence}"`);
          else if (h > cp.afterLektion) flag(id, `${field}: a construction taught only in L${h}: „${sentence}"`);
        }
      }
      // 3. NOT PRACTISED
      for (const s of String(u.text || '').split(/(?<=[.!?])\s+|\n+/)) {
        const bare = norm(s.replace(/^[A-ZÄÖÜ][a-zäöüß]+:\s/, ''));
        if (bare.split(' ').length >= 4 && practised.has(bare)) flag(id, `„${s.trim()}" is a sentence the learner practised`);
      }
      if (texts.has(norm(u.text))) flag(id, `the same text as ${texts.get(norm(u.text))}`);
      texts.set(norm(u.text), id);
    }
    // 4. PAIRS
    for (const pair of [1, 2]) {
      const two = paper.filter((u) => u.pair === pair);
      if (two.length !== 2) { flag(pid, `pair ${pair} has ${two.length} units`); continue; }
      const [a, b] = two.map(conditionsOf);
      for (const c of Object.keys(a)) if (a[c] !== b[c]) flag(pid, `pair ${pair}: „${c}" differs between ${two[0].id} and ${two[1].id}`);
      const places = two.map((u) => u.options.indexOf(u.answer));
      if (places[0] === places[1]) flag(pid, `pair ${pair}: both keys at ${places[0] ? 'B' : 'A'}`);
    }
    const counts = new Map();
    for (const u of paper) counts.set(u.answer, (counts.get(u.answer) || 0) + 1);
    for (const [a, k] of counts) if (k > 2) flag(pid, `„${a}" is the key ${k} times — the constant answer would pass`);
  }
  // 5. THE GATE
  const { papers: audited, worstTotal } = auditPapers(papers.filter((p) => Array.isArray(p) && p.length === 4));
  audited.forEach((r, i) => {
    const pid = `${cpId} paper ${i + 1}`;
    if (r.worstSwitch.score > 2) flag(pid, `switch ${r.worstSwitch.name} scores ${r.worstSwitch.score}`);
    for (const f of r.failing.slice(0, verbose ? 99 : 6)) flag(pid, `${f.name} scores ${f.score} (${f.outcomes})`);
    if (r.failing.length > 6 && !verbose) flag(pid, `… ${r.failing.length - 6} more strategies above 2 (-v lists them)`);
  });
  if (verbose) console.log(`${cpId}: worst strategy over the bank ${worstTotal.name} ${worstTotal.score}/${papers.length * 4}`);
}

// Order strategies have a bank-wide limit, separate from the unchanged per-paper surface gates.
const order = auditBankOrder(Object.values(byCheckpoint).flat());
for (const finding of order.findings) flag('bank order', finding);
const features = auditBankFeatures(Object.values(byCheckpoint).flat());
for (const finding of features.findings) flag('bank feature × order', finding);
if (verbose) {
  console.log(`Bank positions (A/B): ${order.positions.map((counts, i) => `${i + 1}=${counts.join('/')}`).join(', ')}`);
  console.log(`Bank type-rank (A/B): ${Object.entries(order.typeRanks).map(([cell, counts]) => `${cell}=${counts.join('/')}`).join(', ')}`);
  console.log(`Bank fixed sequences: ${[...order.fixed].map(([name, score]) => `${name}=${score}/${order.total}`).join(', ')}`);
  console.log(`Bank type-rank rules (Wer1,Wer2,W1,W2): ${[...order.typeRank].map(([name, score]) => `${name}=${score}/${order.total}`).join(', ')}`);
  console.log(`Bank worst fixed sequence: ${order.worstFixed.name} ${order.worstFixed.score}/${order.total}; worst type-rank rule: ${order.worstTypeRank.name} ${order.worstTypeRank.score}/${order.total}`);
  console.log(`Bank feature × order: ${features.rules.size} rules, limit ${features.limit}/${features.total}`);
  for (const rule of features.worst) console.log(`Bank worst feature rule: ${rule.name} ${rule.score}/${features.total}`);
  console.log(`Bank feature pairs × order: ${features.pairs.families.length} families, measured ratchet (not a gate)`);
  const pair = features.pairs.worst[0];
  if (pair) console.log(`Bank worst feature-pair rule: ${pair.name} ${pair.score}/${features.total}; ${pair.rule}`);
  const perfect = features.pairs.worstPerfect[0];
  if (perfect) console.log(`Bank most whole papers: ${perfect.name} ${perfect.perfect}/${order.total / 4}; ${perfect.perfectRule}`);
}

for (const f of findings) console.log(f);
console.log(findings.length ? `${findings.length} finding(s)` : 'OK: no findings');
process.exit(findings.length ? 1 : 0);
