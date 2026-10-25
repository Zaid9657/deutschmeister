#!/usr/bin/env node
// Supervisor decision 2026-10-25: only declared learner strategies are gated.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { LESEN_A11 } from '../src/data/curricula/a11.lesen.js';
import { deferredConstructionHits } from '../src/data/curricula/constructions.js';
import { levelSpec, taughtUpTo, untaughtTokens, constructionHorizonIndex, loadPoolItems, adjectiveLexicon } from './validate-curriculum.mjs';
import { auditBankFeatures, tokens } from '../tests/helpers/lesenGate.mjs';

const NUMBER = /^(?:\d+|null|eins?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|neunzehn|zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig|hundert|(?:ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(?:zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig))$/u;
const NEGATION = /^(?:nicht|nie|kein|keine|keinen|keinem|keiner|keines|nichts|niemand)$/u;
const median = (values) => { const sorted = [...values].sort((a, b) => a - b); return (sorted[1] + sorted[2]) / 2; };

// These reading texts give German domestic contacts, in digits or taught digit words.
// Check plausible length/prefix, not allocation or ownership. Bare office "Nummer"
// labels may be internal numbers and are not presented as public phone contacts.
const DIGITS = new Map('null eins zwei drei vier fünf sechs sieben acht neun'.split(' ').map((word, i) => [word, String(i)]));
const PHONE_PART = '(?:\\d+|null|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun)';
export function auditContactNumbers(papers) {
  const findings = [];
  for (const u of papers.flat()) {
    const contacts = new RegExp(`\\b(?:Telefonnummer|Handynummer|Telefon|Handy|Tel)\\b\\.?\\s*:?\\s*(?:ist\\s+)?(${PHONE_PART}(?:[\\s/-]+${PHONE_PART})*)\\b`, 'giu');
    for (const [, printed] of u.text.matchAll(contacts)) {
      const number = tokens(printed).map((part) => DIGITS.get(part) ?? part).join('');
      const plausible = /^01(?:5\d{9}|[67]\d{8})$/u.test(number) || /^0[2-9]\d{5,11}$/u.test(number);
      if (!plausible) findings.push(`${u.id}: incomplete/implausible phone contact: ${printed}`);
    }
  }
  return { findings };
}

/** No feature combinations, answer order or fitted thresholds. Strict median comparisons:
 * equality is false; the explicitly listed inverse reverses that prediction too.
 * Tokens are case-folded; overlap counts statement tokens (including repetitions).
 * All predictions are frozen before any key is read.
 */
export function auditDeclaredStrategies(papers) {
  const predictions = papers.map((paper) => {
    const rows = paper.map((u) => {
      const statement = tokens(u.statement); const text = new Set(tokens(u.text));
      return { number: statement.some((t) => NUMBER.test(t)), negation: statement.some((t) => NEGATION.test(t)),
        all: statement.every((t) => text.has(t)), length: statement.length,
        overlap: statement.length ? statement.filter((t) => text.has(t)).length / statement.length : 0 };
    });
    const overlapMedian = median(rows.map((r) => r.overlap));
    const lengthMedian = median(rows.map((r) => r.length));
    const strategies = { 'constant Richtig': rows.map(() => true), 'constant Falsch': rows.map(() => false) };
    for (const [name, picks] of Object.entries({
      'number → Falsch': rows.map((r) => !r.number),
      'negation → Falsch': rows.map((r) => !r.negation),
      'all statement words in text → Richtig': rows.map((r) => r.all),
      'overlap above paper median → Richtig': rows.map((r) => r.overlap > overlapMedian),
      'overlap below paper median → Richtig': rows.map((r) => r.overlap < overlapMedian),
      'statement longer than paper median → Richtig': rows.map((r) => r.length > lengthMedian),
    })) { strategies[name] = picks; strategies[`${name} (inverse)`] = picks.map((p) => !p); }
    return strategies;
  });
  const totals = new Map(); const findings = [];
  const reports = predictions.map((strategies, pi) => {
    const paper = papers[pi];
    if (paper.length !== 4 || paper.filter((u) => u.answer === 'Richtig').length !== 2 || paper.filter((u) => u.answer === 'Falsch').length !== 2) findings.push(`paper ${pi + 1}: keys must balance 2/2`);
    const scores = Object.entries(strategies).map(([name, picks]) => {
      const score = picks.reduce((sum, pick, i) => sum + Number(pick === (paper[i].answer === 'Richtig')), 0);
      totals.set(name, (totals.get(name) || 0) + score);
      if (score > 2) findings.push(`paper ${pi + 1}: ${name}: ${score}/4 exceeds 2/4`);
      return { name, score };
    });
    return { scores, worst: [...scores].sort((a, b) => b.score - a.score)[0], passes: scores.every((s) => s.score <= 2) };
  });
  for (const [name, score] of totals) if (score > 36) findings.push(`bank: ${name}: ${score}/64 exceeds 36/64`);
  return { papers: reports, totals, findings, passes: findings.length === 0 };
}

// Deliberately coarse, deterministic function-word skeleton, not a learned POS tagger.
// Remove salutations/signatures/short headings; replace ALL remaining content tokens
// (including names, numbers, verbs and adjectives) by X. Preserve function words and
// sentence boundaries, normalising punctuation. No ids, keys or text types are inputs.
const STRUCTURE = new Set('ich du er sie es wir ihr man der die das den dem des ein eine einen einer einem und oder aber auch nicht kein keine nur ist sind bin bist seid hat habe haben hast habt in im am an auf aus bei mit von für nach zu zum zur bis um mein meine dein deine sein seine ihre unser unsere bitte'.split(' '));
export function textSkeleton(text) {
  const body = String(text)
    .replace(/^(?:hallo|guten (?:morgen|tag|abend))\b[^,.!?]*[,!]?\s*/iu, '')
    .replace(/(?:danke(?: und)?\s*)?(?:grüße|gruß),?\s+[^.!?]+[.!?]?$/iu, '')
    .replace(/^[^.!?:]{1,45}:\s*/u, '');
  return body.split(/[.!?]+/u).map((s) => tokens(s).map((t) => STRUCTURE.has(t) ? t : 'X').join(' ')).filter(Boolean).join(' / ');
}

export function auditTemplates(papers) {
  const findings = []; const counts = new Map();
  const adjectives = adjectiveLexicon('a1.1');
  for (const [pi, paper] of papers.entries()) {
    const seen = new Set();
    for (const u of paper) {
      const skeleton = textSkeleton(u.text);
      if (seen.has(skeleton)) findings.push(`${u.id}: template repeated within paper ${pi + 1}`);
      seen.add(skeleton);
      counts.set(skeleton, (counts.get(skeleton) || 0) + 1);
      for (const sentence of u.text.split(/(?<=[.!?])\s+|\n+/u)) {
        const [first, second] = tokens(sentence);
        if (first === 'nur' && (NUMBER.test(second) || adjectives.has(second))) findings.push(`${u.id}: sentence opens with nur + number/adjective`);
      }
    }
  }
  for (const [skeleton, count] of counts) if (count > 2) findings.push(`template occurs ${count} times: ${skeleton}`);
  return { findings, maxRepeat: Math.max(0, ...counts.values()), distinct: counts.size };
}

export function checkLesenA11(bank = LESEN_A11) {
  const spec = levelSpec('a1.1');
  const known = taughtUpTo(spec.curriculum, spec);
  const horizon = constructionHorizonIndex('a1.1');
  const norm = (s) => tokens(s).join(' ');
  const practised = new Set([
    ...spec.curriculum.lektionen.flatMap((l) => l.dialog.lines.flatMap((line) => line.de.split(/(?<=[.!?])\s+/))),
    ...loadPoolItems('a1.1').flatMap((it) => [it.questionDe, it.answer]),
  ].filter(Boolean).map(norm));
  const findings = [];
  const ids = new Set(); const texts = new Set();
  const flag = (id, why) => findings.push(`${id}: ${why}`);
  for (const cp of spec.curriculum.checkpoints) {
    const papers = bank[cp.id]?.papers;
    if (!Array.isArray(papers) || papers.length !== 4) { flag(cp.id, 'exactly four papers required'); continue; }
    for (const paper of papers) {
      if (!Array.isArray(paper) || paper.length !== 4) { flag(cp.id, 'exactly four units required'); continue; }
      if (!paper.some((u) => u.type === 'message') || !paper.some((u) => u.type === 'ad') || !paper.some((u) => ['notice', 'sign'].includes(u.type))) flag(cp.id, 'each paper must mix messages, ads and notices/signs');
      for (const u of paper) {
        if (!u.id || ids.has(u.id)) flag(u.id, 'duplicate/missing id');
        ids.add(u.id);
        if (texts.has(norm(u.text))) flag(u.id, 'reused text');
        texts.add(norm(u.text));
        if (u.pair != null) flag(u.id, 'independent units cannot declare mirrored pairs');
        if (!['message', 'notice', 'ad', 'sign'].includes(u.type)) flag(u.id, 'unsupported text type');
        if (JSON.stringify(u.options) !== JSON.stringify(['Richtig', 'Falsch']) || !u.options.includes(u.answer)) flag(u.id, 'Richtig/Falsch format/key required');
        if (!u.statement || u.question !== `Steht das im Text? „${u.statement}“`) flag(u.id, 'statement/question mismatch');
        if (!u.evidence || !u.text.includes(u.evidence)) flag(u.id, 'evidence must occur in text');
        if (!u.questionEn || !u.rival || !u.explanationDe || !u.explanationEn) flag(u.id, 'missing bilingual explanation/exclusion');
        if (tokens(u.text).length < 15 || tokens(u.text).length > 45) flag(u.id, 'text outside 15–45 words');
        for (const [field, value] of [['text', u.text], ['statement', u.statement], ['explanationDe', u.explanationDe]]) {
          const unknown = untaughtTokens({ questionDe: value.replace(/\n/g, ' '), answer: '' }, known.get(cp.afterLektion), spec);
          if (unknown.length) flag(u.id, `${field} untaught: ${unknown.join(', ')}`);
          for (const sentence of value.split(/(?<=[.!?])\s+|\n+/)) {
            const h = horizon({ questionDe: sentence, answer: '' });
            if (h == null || h > cp.afterLektion) flag(u.id, `${field} construction beyond L${cp.afterLektion}: ${sentence}`);
            for (const hit of deferredConstructionHits(spec.curriculum, cp.afterLektion, sentence)) flag(u.id, `${field} deferred ${hit.slug}: ${hit.hit}`);
          }
        }
        for (const sentence of u.text.split(/(?<=[.!?])\s+|\n+/)) if (practised.has(norm(sentence))) flag(u.id, `practised sentence: ${sentence}`);
      }
    }
  }
  const papers = Object.values(bank).flatMap((b) => b.papers);
  if (papers.some((p) => !Array.isArray(p) || p.length !== 4)) return { findings };
  const surface = auditDeclaredStrategies(papers);
  const templates = auditTemplates(papers);
  const contacts = auditContactNumbers(papers);
  findings.push(...surface.findings, ...templates.findings, ...contacts.findings);
  // Broad families remain observable, never acceptance gates. A1.2's shared helper
  // and its pre-batch ratchets are deliberately unchanged.
  const features = auditBankFeatures(papers);
  return { findings, surface, templates, features };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { findings, surface, templates, features } = checkLesenA11();
  for (const f of findings) console.log(f);
  if (surface) {
    console.log(`A1.1 Lesen declared strategies: max ${Math.max(...surface.papers.map((p) => p.worst.score))}/4; bank max ${Math.max(...surface.totals.values())}/64`);
    console.log(`Templates: ${templates.distinct} distinct; maximum repetition ${templates.maxRepeat}`);
    console.log(`REPORT ONLY: feature × order ${features.worst[0].score}/64; feature-pair × order ${features.pairs.worst[0].score}/64; whole papers ${features.pairs.worstPerfect[0].perfect}/16`);
    if (process.argv.includes('-v')) {
      for (const [name, score] of surface.totals) console.log(`${name}: ${score}/64`);
      console.log(`Worst pair family: ${features.pairs.worst[0].name}; ${features.pairs.worst[0].rule}`);
    }
  }
  console.log(findings.length ? `FAIL: ${findings.length} A1.1 Lesen finding(s)` : 'PASS: A1.1 Lesen — 64 independent units; all gates pass');
  process.exitCode = findings.length ? 1 : 0;
}
