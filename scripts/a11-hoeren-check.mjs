#!/usr/bin/env node
// The gate of the A1.1 checkpoints' listening and read-aloud bank (src/data/curricula/a11.hoeren.js),
// written after the reading gate (a11-lesen-check.mjs): new sentences, taught words and forms, no line
// the course has practised, and questions no shortcut answers without listening.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { HOEREN_A11 } from '../src/data/curricula/a11.hoeren.js';
import { LESEN_A11 } from '../src/data/curricula/a11.lesen.js';
import { deferredConstructionHits } from '../src/data/curricula/constructions.js';
import { levelSpec, taughtUpTo, untaughtTokens, constructionHorizonIndex, loadPoolItems } from './validate-curriculum.mjs';
import { chapterLektionen, dictationCeiling } from '../src/lib/checkpoint/buildCheckpoint.js';
import { shownGerman } from './a11-lesen-check.mjs';
import { tokens } from '../tests/helpers/lesenGate.mjs';
import { castNames } from './lib/castNames.mjs';

const norm = (s) => tokens(s).join(' ');
const sentences = (s) => String(s).split(/(?<=[.!?])\s+/).filter(Boolean);
/** Letters said one by one, and the digits of a printed number or time, are not words to teach. */
const speakable = (s) => String(s).replace(/(?:\b[A-ZÄÖÜ]\b,?\s*){3,}/g, ' ').replace(/\d+(?::\d+)?/g, ' ');

/** The chance of three answers is 16 of 48; a shortcut may reach half. */
export const SHORTCUT_LIMIT = 24;

/** What a learner could do without understanding: a place, or the answer a hearer catches first, last or most. */
export function listeningShortcuts(units) {
  const at = (u, o) => {
    const text = tokens(u.text);
    const own = tokens(o).filter((w) => !u.options.every((x) => tokens(x).includes(w)));
    const hits = text.map((w, i) => (own.includes(w) ? i : -1)).filter((i) => i >= 0);
    return { first: hits.length ? hits[0] : Infinity, last: hits.length ? hits[hits.length - 1] : -1, n: hits.length };
  };
  const best = (u, score) => u.options.reduce((b, o) => (score(o) > score(b) ? o : b), u.options[0]);
  const rules = {
    'first answer': (u) => u.options[0], 'second answer': (u) => u.options[1], 'third answer': (u) => u.options[2],
    'heard first': (u) => best(u, (o) => -at(u, o).first),
    'heard last': (u) => best(u, (o) => at(u, o).last),
    'heard most often': (u) => best(u, (o) => at(u, o).n),
    'longest answer': (u) => best(u, (o) => o.length),
    'shortest answer': (u) => best(u, (o) => -o.length),
  };
  return Object.fromEntries(Object.entries(rules).map(([name, fn]) => [name, units.filter((u) => fn(u) === u.answer).length]));
}

export function checkHoerenA11(bank = HOEREN_A11) {
  const spec = levelSpec('a1.1');
  const c = spec.curriculum;
  const known = taughtUpTo(c, spec);
  const horizon = constructionHorizonIndex('a1.1');
  const findings = [];
  const flag = (id, why) => findings.push(`${id}: ${why}`);
  const practised = new Set([
    ...c.lektionen.flatMap((l) => l.dialog.lines.flatMap((line) => sentences(line.de))),
    ...c.lektionen.flatMap((l) => shownGerman([l.notice, l.guided]).flatMap((s) => s.split(/(?<=[.!?])\s+|\n+/))),
    ...loadPoolItems('a1.1').filter((it) => !it.assessment).flatMap((it) => [it.questionDe, it.answer]),
  ].filter(Boolean).map(norm).filter((p) => p.split(' ').length >= 3));
  const readTexts = new Set(Object.values(LESEN_A11).flatMap((b) => b.papers.flat()).flatMap((u) => sentences(u.text).map(norm)));
  // The cast's names, their surnames too („Lena Brandt“).
  const cast = castNames();
  const seen = new Set();
  const all = [];

  for (const cp of c.checkpoints) {
    const ceiling = dictationCeiling(chapterLektionen(c, cp));
    const papers = bank[cp.id]?.papers;
    if (!Array.isArray(papers) || papers.length !== 4) { flag(cp.id, 'exactly four papers required'); continue; }
    for (const paper of papers) {
      if (paper.say?.length !== 2 || paper.hear?.length !== 3 || paper.read?.length !== 2) { flag(cp.id, 'a paper is two dictations, three heard texts and two lines to read aloud'); continue; }
      const places = paper.hear.map((u) => u.options.indexOf(u.answer));
      if (Math.max(...[0, 1, 2].map((p) => places.filter((x) => x === p).length)) > 2) flag(cp.id, 'one place throughout takes every heard text');
      const rows = [
        ...paper.say.map((u) => ({ u, de: [u.de], kind: 'say' })),
        ...paper.hear.map((u) => ({ u, de: [u.text, u.question, ...u.options], kind: 'hear' })),
        ...paper.read.map((u) => ({ u, de: [u.de], kind: 'read' })),
      ];
      for (const { u, de, kind } of rows) {
        const main = kind === 'hear' ? u.text : u.de;
        const words = tokens(main).length;
        if (kind === 'say' && (words < 5 || words > ceiling)) flag(u.id, `a dictation has 5 to ${ceiling} words, this has ${words}`);
        if (kind === 'read' && (words < 4 || words > 10)) flag(u.id, `a line to read aloud has 4 to 10 words, this has ${words}`);
        if (kind === 'hear' && (words < 12 || words > 35)) flag(u.id, `a heard text has 12 to 35 words, this has ${words}`);
        if (kind !== 'hear' && !u.en) flag(u.id, 'no English');
        for (const text of de) {
          // A name the text spells has to look like another name: no word to teach.
          if (kind === 'hear' && u.options.includes(text) && /^S, E/.test(u.evidence)) continue;
          const unknown = untaughtTokens({ questionDe: speakable(text), answer: '' }, known.get(cp.afterLektion), spec);
          if (unknown.length) flag(u.id, `untaught: ${unknown.join(', ')}`);
          for (const s of sentences(text)) {
            const h = horizon({ questionDe: s, answer: '' });
            if (h == null || h > cp.afterLektion) flag(u.id, `construction beyond L${cp.afterLektion}: ${s}`);
            for (const hit of deferredConstructionHits(c, cp.afterLektion, s)) flag(u.id, `deferred ${hit.slug}: ${hit.hit}`);
          }
        }
        for (const field of [main, u.question, u.why, ...(u.options || [])]) for (const name of cast) {
          if (new RegExp(`(?<![\\p{L}])${name}s?(?![\\p{L}])`, 'u').test(String(field || ''))) flag(u.id, `uses the cast name ${name} for someone else`);
        }
        for (const s of sentences(main)) {
          const key = norm(s);
          const inside = ` ${key} `;
          const hit = [...practised].find((p) => inside === ` ${p} ` || (p.split(' ').length >= 4 && inside.includes(` ${p} `)));
          if (hit) flag(u.id, `practised: ${s}`);
          if (key.split(' ').length >= 4 && readTexts.has(key)) flag(u.id, `printed in the reading bank: ${s}`);
        }
        if (seen.has(norm(main))) flag(u.id, 'the same text twice in the bank');
        seen.add(norm(main));
        if (kind !== 'hear') continue;
        all.push(u);
        if (!['f', 'm'].includes(u.voice)) flag(u.id, 'a voice is f or m');
        if (u.options.length !== 3 || new Set(u.options).size !== 3 || !u.options.includes(u.answer)) flag(u.id, 'three answers and a key');
        if (!/\?$/.test(u.question) || !u.questionEn || !u.why) flag(u.id, 'question, English and reason required');
        if (!u.evidence || !u.text.includes(u.evidence)) flag(u.id, 'evidence must be said in the text');
        // A wrong answer competes: the text says it of something else, or it sounds like a number that is said.
        const heard = new Set(tokens(u.text));
        const named = u.options.filter((o) => tokens(o).some((w) => (heard.has(w) || (w.length > 4 && [...heard].some((h) => h.includes(w.slice(0, 4))))) && !['in', 'um', 'am', 'aus', 'die', 'der', 'das', 'ein', 'eine', 'einen', 'er', 'sie', 'euro', 'uhr', 'mit', 'dem', 'bei', 'frau', 'im'].includes(w)));
        const numbers = u.options.every((o) => /\d/.test(o));
        const spelled = /^S, E/.test(u.evidence);
        if (!numbers && !spelled && named.length < 3) flag(u.id, `answers the text never names: ${u.options.filter((o) => !named.includes(o)).join(' ')}`);
      }
    }
  }
  const shortcuts = listeningShortcuts(all);
  for (const [name, score] of Object.entries(shortcuts)) if (score > SHORTCUT_LIMIT * (all.length / 48)) findings.push(`bank: ${name}: ${score}/${all.length}`);
  return { findings, shortcuts, units: all.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { findings, shortcuts, units } = checkHoerenA11();
  for (const f of findings) console.log(f);
  console.log(Object.entries(shortcuts).map(([n, s]) => `${n} ${s}/${units}`).join('; '));
  console.log(findings.length ? `FAIL: ${findings.length} A1.1 Hören finding(s)` : `PASS: A1.1 Hören — ${units} heard texts, 32 dictations, 32 lines to read aloud`);
  process.exitCode = findings.length ? 1 : 0;
}
