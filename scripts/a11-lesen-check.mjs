#!/usr/bin/env node
// Supervisor decision 2026-10-25: only declared learner strategies are gated.
import { castNames } from './lib/castNames.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { LESEN_A11 } from '../src/data/curricula/a11.lesen.js';
import { deferredConstructionHits } from '../src/data/curricula/constructions.js';
import { levelSpec, taughtUpTo, untaughtTokens, constructionHorizonIndex, loadPoolItems, adjectiveLexicon } from './validate-curriculum.mjs';
import { tokens } from '../tests/helpers/lesenGate.mjs';

const NUMBER = /^(?:\d+|null|eins?|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|neunzehn|zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig|hundert|(?:ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(?:zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig))$/u;
const NEGATION = /^(?:nicht|nie|kein|keine|keinen|keinem|keiner|keines|nichts|niemand)$/u;

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

/** What the checkpoint's own pass rule counts as guessing (buildCheckpoint.js guessCeiling), on one paper. */
export function paperCeiling(paper) {
  const most = (keys) => Math.max(...[...new Set(keys)].map((k) => keys.filter((x) => x === k).length));
  return Math.max(most(paper.map((u) => u.answer)), most(paper.map((u) => u.options.indexOf(u.answer))));
}

/** Where a text first (or last) names an option: by the words that tell it from the other two. */
const spots = (unit) => {
  const text = tokens(unit.text);
  const words = unit.options.map((o) => tokens(o));
  return words.map((own, k) => {
    const telling = own.filter((w) => !words.every((other) => other.includes(w)) && !STRUCTURE.has(w));
    const keys = telling.length ? telling : own;
    const at = text.map((w, i) => (keys.includes(w) ? i : -1)).filter((i) => i >= 0);
    return { first: at.length ? at[0] : Infinity, last: at.length ? at[at.length - 1] : -1, count: at.length, length: own.join(' ').length, k };
  });
};
const bestBy = (list, score) => list.reduce((best, x) => (score(x) > score(best) ? x : best), list[0]).k;

/**
 * The shortcuts a learner can use without understanding the text, each declared with its inverse where it
 * has one, and frozen before any key is read. A statement and a question have their own.
 *   statement: at most 18 of the bank's 32 (chance 16);
 *   question:  at most 16 of 32 (chance 11);
 *   one of each together: at most 5 of the 16 papers passed (3 of 4, the pass rule's own mark);
 *   and no paper gives more than 2 of 4 to one answer or one place throughout (guessCeiling).
 */
export const TF_LIMIT = 18;
export const CHOICE_LIMIT = 16;
export const PAPERS_LIMIT = 5;
export function auditDeclaredStrategies(papers) {
  const statements = (paper) => paper.filter((u) => u.format === 'trueFalse');
  const share = (words, u) => { const st = tokens(u.statement); return st.filter((t) => words.has(t)).length / st.length; };
  const tf = {
    'constant Richtig': () => true,
    'number → Falsch': (u) => !tokens(u.statement).some((t) => NUMBER.test(t)),
    'negation → Falsch': (u) => !tokens(u.statement).some((t) => NEGATION.test(t)),
    'negation in text → Falsch': (u) => !tokens(u.text).some((t) => NEGATION.test(t)),
    'negation in both or in neither → Richtig': (u) => tokens(u.statement).some((t) => NEGATION.test(t)) === tokens(u.text).some((t) => NEGATION.test(t)),
    'all statement words in text → Richtig': (u) => share(new Set(tokens(u.text)), u) === 1,
    'three in four statement words in text → Richtig': (u) => share(new Set(tokens(u.text)), u) >= 0.75,
    'three in four statement words in one sentence → Richtig': (u) => u.text.split(/(?<=[.!?])\s+/).some((x) => share(new Set(tokens(x)), u) >= 0.75),
    'longer statement of the paper → Richtig': (u, paper) => statements(paper).every((o) => o === u || tokens(o.statement).length < tokens(u.statement).length),
  };
  for (const name of Object.keys(tf)) tf[`${name} (inverse)`] = ((fn) => (u, paper) => !fn(u, paper))(tf[name]);
  const pick = {
    'first answer': () => 0, 'second answer': () => 1, 'third answer': () => 2,
    'named first in the text': (u) => bestBy(spots(u), (x) => -x.first),
    'named last in the text': (u) => bestBy(spots(u), (x) => x.last),
    'named most often': (u) => bestBy(spots(u), (x) => x.count),
    'longest answer': (u) => bestBy(spots(u), (x) => x.length),
    'shortest answer': (u) => bestBy(spots(u), (x) => -x.length),
    'in the sentence most like the question': (u) => {
      const q = new Set(tokens(u.question).filter((t) => !STRUCTURE.has(t) || t === 'nicht'));
      const sentences = u.text.split(/(?<=[.!?])\s+/).map((x) => tokens(x));
      const like = sentences.map((x) => x.filter((t) => q.has(t)).length);
      const at = like.indexOf(Math.max(...like));
      const inIt = spots(u).filter((x) => sentences[at].some((w) => tokens(u.options[x.k]).includes(w) && !STRUCTURE.has(w)));
      return inIt.length ? bestBy(inIt, (x) => -x.first) : 0;
    },
  };
  const findings = [];
  const totals = new Map();
  const count = (name, hit) => totals.set(name, (totals.get(name) || 0) + Number(hit));
  const right = (u, paper, fa, fb) => (u.format === 'trueFalse' ? fa(u, paper) === (u.answer === 'Richtig') : u.options[fb(u)] === u.answer);
  for (const paper of papers) {
    for (const u of paper) {
      if (u.format === 'trueFalse') for (const [name, fn] of Object.entries(tf)) count(name, right(u, paper, fn));
      else for (const [name, fn] of Object.entries(pick)) count(name, right(u, paper, null, fn));
    }
  }
  const scale = papers.length / 16;
  for (const [name, score] of totals) {
    const limit = Math.round((name in tf ? TF_LIMIT : CHOICE_LIMIT) * scale);
    if (score > limit) findings.push(`bank: ${name}: ${score} exceeds ${limit}`);
  }
  const pairs = [];
  for (const [a, fa] of Object.entries(tf)) for (const [b, fb] of Object.entries(pick)) {
    const passed = papers.filter((paper) => paper.filter((u) => right(u, paper, fa, fb)).length >= 3).length;
    pairs.push({ name: `${a} + ${b}`, passed });
    if (passed > Math.max(1, Math.round(PAPERS_LIMIT * scale))) findings.push(`papers: ${a} + ${b}: passes ${passed}`);
  }
  for (const [pi, paper] of papers.entries()) if (paperCeiling(paper) > 2) findings.push(`paper ${pi + 1}: one answer or place throughout takes ${paperCeiling(paper)} of 4`);
  // How many of the two statements are Richtig is no rule of its own: all four patterns occur.
  const patterns = new Set(papers.map((paper) => statements(paper).map((u) => u.answer).join('-')));
  return { totals, pairs: pairs.sort((x, y) => y.passed - x.passed), patterns, findings, passes: findings.length === 0 };
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

/** Every German string inside a Lektion's notice or guided data: English, Arabic, titles, slugs, tasks, explanations
 *  and the further answers a check accepts (`more`, never shown) are not text the learner reads as German content. */
const NOT_SHOWN_GERMAN = /(En|Ar)$|^(title|ruleSlug|slug|id|kind|type|src|alt|more|explanation\w*|question\w*|cue\w*|hint\w*)$/;
export function shownGerman(value, key = '') {
  if (typeof value === 'string') return NOT_SHOWN_GERMAN.test(key) ? [] : [value];
  if (Array.isArray(value)) return value.flatMap((v) => shownGerman(v, key));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => (NOT_SHOWN_GERMAN.test(k) ? [] : shownGerman(v, k)));
  return [];
}

export function checkLesenA11(bank = LESEN_A11) {
  const spec = levelSpec('a1.1');
  const known = taughtUpTo(spec.curriculum, spec);
  const horizon = constructionHorizonIndex('a1.1');
  const norm = (s) => tokens(s).join(' ');
  const practised = new Set([
    ...spec.curriculum.lektionen.flatMap((l) => l.dialog.lines.flatMap((line) => line.de.split(/(?<=[.!?])\s+/))),
    // Everything else a Lektion shows in German counts as practised too: the notice (its examples
    // and the worked ad or notice, 2026-11-19 browser play: „Herr Weber ist hier.“ sat in Lektion
    // 2's worked notice and in a Checkpoint 1 statement) and the guided flow's own texts.
    ...spec.curriculum.lektionen.flatMap((l) => shownGerman([l.notice, l.guided]).flatMap((s) => s.split(/(?<=[.!?])\s+|\n+/))),
    ...loadPoolItems('a1.1').filter((it) => !it.assessment).flatMap((it) => [it.questionDe, it.answer]),
  ].filter(Boolean).map(norm));
  const findings = [];
  const ids = new Set(); const texts = new Set();
  // A cast name names only the cast (the independent score, 2026-11-20: „Lena ist schon zehn.“ made Lena a child):
  // the bank's people are others, so no unit may use a name a dialogue of either course gives its cast.
  // (Their surnames too: „Lena Brandt“, Claude score of fd8f8dba.)
  const cast = castNames();
  const flag = (id, why) => findings.push(`${id}: ${why}`);
  for (const cp of spec.curriculum.checkpoints) {
    const papers = bank[cp.id]?.papers;
    if (!Array.isArray(papers) || papers.length !== 4) { flag(cp.id, 'exactly four papers required'); continue; }
    for (const paper of papers) {
      if (!Array.isArray(paper) || paper.length !== 4) { flag(cp.id, 'exactly four units required'); continue; }
      if (paper.filter((u) => u.format === 'trueFalse').length !== 2) flag(cp.id, 'two statements and two questions per paper');
      if (!paper.some((u) => u.type === 'message') || !paper.some((u) => u.type === 'ad') || !paper.some((u) => ['notice', 'sign'].includes(u.type))) flag(cp.id, 'each paper must mix messages, ads and notices/signs');
      for (const u of paper) {
        if (!u.id || ids.has(u.id)) flag(u.id, 'duplicate/missing id');
        ids.add(u.id);
        if (texts.has(norm(u.text))) flag(u.id, 'reused text');
        for (const field of ['text', 'statement', 'question', 'evidence', 'rival', 'explanationDe', 'explanationEn']) {
          for (const name of cast) if (new RegExp(`(?<![\\p{L}])${name}s?(?![\\p{L}])`, 'u').test(String(u[field] || ''))) flag(u.id, `${field} uses the cast name ${name} for someone else`);
        }
        texts.add(norm(u.text));
        if (u.pair != null) flag(u.id, 'independent units cannot declare mirrored pairs');
        if (!['message', 'notice', 'ad', 'sign'].includes(u.type)) flag(u.id, 'unsupported text type');
        if (u.format === 'trueFalse') {
          if (JSON.stringify(u.options) !== JSON.stringify(['Richtig', 'Falsch']) || !u.options.includes(u.answer)) flag(u.id, 'Richtig/Falsch format/key required');
          if (!u.statement || u.question !== `Richtig oder falsch? „${u.statement}“`) flag(u.id, 'statement/question mismatch');
        } else {
          if (u.format !== 'choice' || u.options?.length !== 3 || new Set(u.options).size !== 3 || !u.options.includes(u.answer)) flag(u.id, 'a question needs three answers and its key');
          if (!/\?$/.test(u.question)) flag(u.id, 'a question ends in a question mark');
          // Every answer is named in the text, or it is no competitor. A sum („Was macht das zusammen?“) is worked out.
          const have = new Set(tokens(u.text));
          const named = (o) => tokens(o).some((w) => !STRUCTURE.has(w) && have.has(w));
          if (!/zusammen\?$/.test(u.question)) for (const o of u.options || []) if (!named(o)) flag(u.id, `answer not named in the text: ${o}`);
        }
        if (!u.evidence || !u.text.includes(u.evidence)) flag(u.id, 'evidence must occur in text');
        // „Steht das im Text?“ read literally: a FALSE statement whose words stand in the text in
        // that order („Die Familie von Tim wohnt in Bremen.“ for „Tim wohnt in Bremen.“) is in the
        // text, so the key contradicts the question (2026-11-19 browser play).
        // Nor may a true one stand there (2026-11-25): a sentence printed word for word is found by looking, not read.
        if (u.statement && ` ${norm(u.text)} `.includes(` ${norm(u.statement)} `)) flag(u.id, 'statement stands word for word in the text');
        if (!u.questionEn || !u.rival || !u.explanationDe || !u.explanationEn) flag(u.id, 'missing bilingual explanation/exclusion');
        if (tokens(u.text).length < 15 || tokens(u.text).length > 45) flag(u.id, 'text outside 15–45 words');
        for (const [field, value] of [['text', u.text], u.statement ? ['statement', u.statement] : ['question', u.question], ...(u.statement ? [] : u.options.map((o) => ['answer', o])), ['explanationDe', u.explanationDe]]) {
          const unknown = untaughtTokens({ questionDe: value.replace(/\n/g, ' '), answer: '' }, known.get(cp.afterLektion), spec);
          if (unknown.length) flag(u.id, `${field} untaught: ${unknown.join(', ')}`);
          for (const sentence of value.split(/(?<=[.!?])\s+|\n+/)) {
            const h = horizon({ questionDe: sentence, answer: '' });
            if (h == null || h > cp.afterLektion) flag(u.id, `${field} construction beyond L${cp.afterLektion}: ${sentence}`);
            for (const hit of deferredConstructionHits(spec.curriculum, cp.afterLektion, sentence)) flag(u.id, `${field} deferred ${hit.slug}: ${hit.hit}`);
          }
        }
        // A practised sentence of three words or more, alone or inside a longer one („Amt: Herr
        // Weber ist hier.“ holds the worked notice's „Herr Weber ist hier.“); a two-word greeting
        // („Hallo Ana!“) is a formula, not content the statement can be answered from.
        for (const sentence of u.text.split(/(?<=[.!?])\s+|\n+/)) {
          const s = ` ${norm(sentence)} `;
          const hit = [...practised].find((p) => p.split(' ').length >= 3 && (s === ` ${p} ` || (p.split(' ').length >= 4 && s.includes(` ${p} `))));
          if (hit) flag(u.id, `practised sentence: ${sentence}`);
        }
      }
    }
  }
  const papers = Object.values(bank).flatMap((b) => b.papers);
  if (papers.some((p) => !Array.isArray(p) || p.length !== 4)) return { findings };
  const surface = auditDeclaredStrategies(papers);
  const templates = auditTemplates(papers);
  const contacts = auditContactNumbers(papers);
  findings.push(...surface.findings, ...templates.findings, ...contacts.findings);
  return { findings, surface, templates };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { findings, surface, templates } = checkLesenA11();
  for (const f of findings) console.log(f);
  if (surface) {
    console.log(`A1.1 Lesen: the two statements run ${[...surface.patterns].join(', ')}; the best pair of shortcuts passes ${surface.pairs[0].passed}/16 papers (${surface.pairs[0].name})`);
    console.log(`Templates: ${templates.distinct} distinct; maximum repetition ${templates.maxRepeat}`);
    if (process.argv.includes('-v')) for (const [name, score] of surface.totals) console.log(`${name}: ${score}/32`);
  }
  console.log(findings.length ? `FAIL: ${findings.length} A1.1 Lesen finding(s)` : 'PASS: A1.1 Lesen — 64 independent units; all gates pass');
  process.exitCode = findings.length ? 1 : 0;
}
