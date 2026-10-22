// Open production must select a taught tense in German, or grade every fitting
// tense alternative. No IDs, topic labels, English or after-answer explanations
// decide whether an instruction is explicit. Correction tasks preserve the
// supplied tense; participle gaps with a printed auxiliary do not offer a
// present-tense alternative in that same gap.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { checkAnswer, checkOptionsFor, RESULT } from '../src/lib/lesson/check.js';
import { servedItems } from './a12-determinacy.mjs';

const SIMPLE = {
  sein: { present: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'], past: ['war', 'warst', 'war', 'waren', 'wart', 'waren'] },
  haben: { present: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'], past: ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten'] },
};

// L12 teaches these perfect forms (dialogue, notice and servable exercises).
// This is a linguistic inventory, independent of item IDs; the tests cross-check
// the perfect exercise inventory so a newly taught verb cannot escape the scan.
export const PERFECT_FORMS = {
  essen: 'gegessen', trinken: 'getrunken', sprechen: 'gesprochen',
  gehen: 'gegangen', fahren: 'gefahren', kommen: 'gekommen', bleiben: 'geblieben',
  verstehen: 'verstanden', kaufen: 'gekauft', feiern: 'gefeiert', kochen: 'gekocht',
  machen: 'gemacht', holen: 'geholt', bezahlen: 'bezahlt', telefonieren: 'telefoniert',
  passieren: 'passiert', arbeiten: 'gearbeitet', tanzen: 'getanzt',
  brauchen: 'gebraucht', wohnen: 'gewohnt', spielen: 'gespielt',
};
const words = (text) => String(text || '').toLowerCase().match(/[a-zäöüß]+/g) || [];
const prompt = (item) => String(item.questionDe || item.promptDe || '');
const replaceWord = (text, from, to) => text.replace(new RegExp(`\\b${from}\\b`, 'i'), (word) => /^[A-ZÄÖÜ]/.test(word) ? to[0].toUpperCase() + to.slice(1) : to);
const person = (text) => {
  const tokens = words(text);
  if (tokens.includes('ich')) return 0;
  if (tokens.includes('du')) return 1;
  if (tokens.includes('wir')) return 3;
  if (tokens.includes('ihr')) return 4;
  return 2;
};

function perfectContrast(key, lemma, participle) {
  const irregular = {
    essen: ['esse', 'isst', 'isst', 'essen', 'esst', 'essen'],
    sprechen: ['spreche', 'sprichst', 'spricht', 'sprechen', 'sprecht', 'sprechen'],
    fahren: ['fahre', 'fährst', 'fährt', 'fahren', 'fahrt', 'fahren'],
  };
  const stem = lemma.slice(0, -2);
  const endings = /[dt]$/.test(stem) ? ['e', 'est', 'et', 'en', 'et', 'en'] : ['e', /[szß]$/.test(stem) ? 't' : 'st', 't', 'en', 't', 'en'];
  const present = irregular[lemma] || endings.map((ending) => stem + ending);
  const auxiliary = SIMPLE[['gehen', 'fahren', 'kommen', 'bleiben', 'passieren'].includes(lemma) ? 'sein' : 'haben'].present;
  const forms = participle ? auxiliary : present;
  const token = words(key).find((word) => forms.includes(word));
  if (!token || /[,;]/.test(key)) return [];
  const candidates = forms.flatMap((form, index) => form === token ? [index] : []);
  const subject = person(key);
  const index = candidates.includes(subject) ? subject : candidates[0];
  if (participle) return [replaceWord(key, token, present[index]).replace(new RegExp(`\\s+${participle}([.!?])?$`), '$1')];
  return [replaceWord(key, token, auxiliary[index]).replace(/([.!?])?$/, ` ${PERFECT_FORMS[lemma]}$1`)];
}

export function tenseRequirement(item, lektion = item.minLektion) {
  if (!['fill_blank', 'sentence_building'].includes(item.type) || item.options?.length || item.mode === 'options') return null;
  const q = prompt(item);
  const key = String(item.answer || '');
  if (/!$/.test(key) || /Imperativ|Bitte|bitte|bitten/.test(q)) return null;
  const tokens = words(key);
  const participle = Object.values(PERFECT_FORMS).find((form) => tokens.includes(form));
  // Only the requested answer, not another finite verb in the printed context.
  if (lektion >= 7 && !participle) {
    for (const [lemma, forms] of Object.entries(SIMPLE)) {
      for (const [tense, other] of [['present', 'past'], ['past', 'present']]) {
        const token = tokens.find((word) => forms[tense].includes(word));
        if (!token) continue;
        // A printed participle fixes an auxiliary gap to Perfekt, not Präteritum.
        if (item.type === 'fill_blank' && Object.values(PERFECT_FORMS).some((form) => words(q).includes(form))) return null;
        const indexes = forms[tense].flatMap((form, index) => form === token ? [index] : []);
        const subject = person(item.type === 'fill_blank' ? q.replace(/\([^)]*\)/g, '') : key);
        const index = indexes.includes(subject) ? subject : indexes[0];
        const alternatives = [replaceWord(key, token, forms[other][index])];
        return { lemma, tense: tense === 'present' ? 'Präsens' : 'Präteritum', alternatives };
      }
    }
  }
  // Whole-sentence production can choose present or perfect after L12.
  // Gaps whose surrounding words already supply the auxiliary/participle cannot.
  if (lektion >= 12 && item.type === 'sentence_building') {
    const bricks = (q.match(/\[([^\]]+)\]/)?.[1] || '').split('/').map((brick) => brick.trim());
    const lemma = Object.keys(PERFECT_FORMS).find((verb) => bricks.includes(verb));
    if (lemma && !/\b(?:kann|kannst|können|muss|müssen|will|wollen|darf|dürfen|soll|sollen|möchte|möchten|würde)\b/.test(key)) {
      return { lemma, tense: participle ? 'Perfekt' : 'Präsens', alternatives: perfectContrast(key, lemma, participle) };
    }
  }
  return null;
}

export function hasTenseSelector(item, tense) {
  // Only a positive instruction outside the quoted sentence / word bricks.
  const instruction = prompt(item).replace(/„[^“]*“|\[[^\]]*\]/g, '');
  return new RegExp(`(?:\\([^)]*\\b${tense}\\b[^)]*\\)|im ${tense}\\b)`).test(instruction)
    && !new RegExp(`(?:nicht|kein(?:em|en)?)\\s+(?:im\\s+)?${tense}`).test(instruction);
}

export function missingTenseSelector(item, lektion) {
  const requirement = tenseRequirement(item, lektion);
  if (!requirement || hasTenseSelector(item, requirement.tense)) return null;
  const accepted = item.accepted?.length ? item.accepted : [item.answer];
  if (requirement.alternatives.length && requirement.alternatives.every((answer) =>
    checkAnswer(answer, accepted, checkOptionsFor(item)).result === RESULT.CORRECT)) return null;
  return { id: item.poolItemId || item.id, where: item.where || `servable through L${lektion}`, ...requirement, questionDe: prompt(item) };
}

export function auditTenses(pool, served = servedItems('a1.2').items) {
  // minLektion is a lower bound, not an expiry. Check the entire servable pool
  // through L12, including items a later checkpoint/remediation may select.
  const servable = pool.items.filter((item) => item.minLektion != null);
  const findings = servable.map((item) => missingTenseSelector(item, 12)).filter(Boolean);
  for (const item of served) {
    const lektion = /^L/.test(item.where) ? Number(item.where.slice(1)) : Number(item.where.match(/cp(\d)/)?.[1]) * 3;
    const finding = missingTenseSelector(item, lektion);
    if (finding) findings.push(finding);
  }
  return { servable: servable.length, served: served.length, findings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a12.json', import.meta.url), 'utf8'));
  const audit = auditTenses(pool);
  for (const finding of audit.findings) console.log(JSON.stringify(finding));
  console.log(`M15-2 audit: ${audit.servable} servable pool items; ${audit.served} served items; ${audit.findings.length} missing tense selectors`);
  process.exitCode = audit.findings.length ? 1 : 0;
}
