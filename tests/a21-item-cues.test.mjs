import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A21 as course } from '../src/data/curricula/a21.js';
import { abschlusstestA21Course } from '../src/data/courseTests/abschlusstestA21Course.js';
import { alternatives } from '../scripts/a12-determinacy.mjs';

const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a21.json', import.meta.url))).items;
const units = course.checkpoints.flatMap(cp => ['lesen', 'hoeren'].flatMap(skill => cp[skill].papers.flat()));
const lessonUnits = course.lektionen.flatMap(l => [...(l.lesen?.units || []), ...(l.hoeren?.units || [])]);
const finalUnits = abschlusstestA21Course.sections.flatMap(s => s.parts.flatMap(p => (p.items || []).map(i => ({
  ...i, question: i.prompt, text: p.text, audioText: p.audioText,
  options: i.options.map(o => o.label), answer: i.options.find(o => o.key === i.answer)?.label,
}))));

// These are semantic cue classes, applied to the entire authored bank. The
// negative probes show why a plausible key alone cannot establish determinacy.
function missingCue(item) {
  const q = item.questionDe || item.question || '';
  const source = item.text || item.audioText || '';
  const answer = item.answer || '';
  if (/\((?:in\s*\/\s*für|für\s*\/\s*in)\)/.test(q)
      && !/Wann|Wie lange|beginnt|dauert|bleib|kommt|Dauer/.test(q)) return 'time or duration';
  if (/Kinderbücher/.test(source) && /Buch.*Tochter/.test(q)
      && !/Kinderbuch|Kinderbücher/.test(q)) return 'book category';
  if (/Sprechstunde für Kinder/.test(source) && /Tochter/.test(q) && /Husten|Untersuchung|Sprechstunde/.test(q)
      && !/\b(?:sechs|sieben|acht|neun|zehn) Jahre alt\b/.test(q)) return 'child age';
  if (/Büroerfahrung/.test(source) && answer === 'F'
      && !/im Büro|Büroerfahrung/.test(q)) return 'office experience';
  if (/Geschenke.*ein/.test(source) && /Papier/.test(q)) return 'wrapping service versus paper';
  if (/Kuchen.*alle Gäste/.test(source) && /Öl/.test(answer)
      && !/als Geschenk/.test(q)) return 'gift versus shared food';
  const options = item.options || [];
  for (const [short, full] of [['zum', 'zu dem'], ['zur', 'zu der'], ['im', 'in dem']]) {
    if (options.includes(short) && options.includes(full)) return 'equivalent printed choices';
  }
  if (options.includes('Mach') && options.includes('Macht')
      && !/du-Form|ihr-Form/.test(q)) return 'imperative addressee';
  if (options.includes('der') && options.includes('einer')
      && !/unbestimmte|bestimmte/.test(q)) return 'article definiteness';
  if (/Ich gehe (?:in )?___ (?:Park|Kino)/.test(q)
      && !/wohin/i.test(q)) return 'destination versus activity';
  if (/Korrigieren/.test(q) && /Seit einem Monat habe ich jeden Tag/.test(q)) return 'valid Perfekt';
  if (/Korrigieren/.test(q) && /schicke ihm es/.test(q)
      && !/unbetont/.test(q)) return 'pronoun emphasis';
  if (/Hotel ist ___ dem Bahnhof/.test(q)
      && options.filter(x => ['neben', 'gegenüber', 'hinter'].includes(x)).length > 1) return 'position';
  if (/\b(?:solltest|könnten)\b/.test(answer) && /___/.test(q)
      && !/Konjunktiv II/.test(q)) return 'advice mood';
  if (item.topic === 'modal-verbs-past' && /\[/.test(q)
      && /\b(?:können|wollen|müssen|dürfen)\b/.test(q) && !/Präteritum/.test(q)) return 'requested tense';
  if (/___ Mittwoch habe ich einen Termin/.test(q) && !/an \+ dem/.test(q)) return 'weekday relation';
  if (/Sie kommt ___ der Schweiz/.test(q) && options.includes('aus') && options.includes('von')) return 'origin relation';
  if (/___.*bitte die Tür!/.test(q) && options.some(o => /^Mach/.test(o))) return 'incomplete imperative';
  return null;
}

test('time choices and checkpoint keys have the context needed to exclude a second answer', () => {
  for (const item of [...pool, ...units, ...lessonUnits, ...finalUnits]) assert.equal(missingCue(item), null, `${item.id}: ${missingCue(item)}`);
});

test('declared openings use syntax understood by the determinacy probe', () => {
  const missedOpening = item => alternatives(item, { a2: true, wide: true }).some(a => a.why === 'another word order');
  for (const item of pool.filter(i => /Beginnen Sie mit/.test(i.questionDe))) {
    assert.equal(missedOpening(item), false, item.questionDe);
  }
  const example = { type: 'error_correction', answer: 'Seit einem Monat spiele ich jeden Tag Gitarre.',
    questionDe: 'Korrigieren Sie das Wort einen: „Seit einen Monat spiele ich jeden Tag Gitarre.“ (Beginnen Sie mit Seit)' };
  assert.equal(missedOpening(example), true, 'unquoted openings are not part of the parser contract');
  assert.equal(missedOpening({ ...example, questionDe: example.questionDe.replace('mit Seit)', 'mit „Seit“)') }), false);
});

test('cue guards reject unsupported time, age, category, occupation and gift assumptions', () => {
  const probes = [
    { question: 'Der Besuch ist ___ zwei Wochen. (in / für)' },
    { text: 'Kinderbücher in der Mitte.', question: 'Sie suchen ein Buch für Ihre Tochter.' },
    { text: 'Sprechstunde für Kinder.', question: 'Tims Tochter hat Husten.' },
    { text: 'F: Deutsch für Menschen mit Büroerfahrung.', question: 'Ana hat seit fünf Jahren eine Stelle.', answer: 'F' },
    { text: 'Geschenke packen wir ein.', question: 'Wo bekommen Sie Papier?' },
    { audioText: 'Ein Kuchen für alle Gäste. Eine Flasche Öl als Geschenk.', question: 'Was bekommt der Onkel?', answer: 'Öl' },
    { question: 'Ich gehe ___ Supermarkt.', options: ['zum', 'zu dem'] },
    { question: '___ bitte die Tür!', options: ['Mach', 'Macht'] },
    { question: 'Das Buch gehört ___ Studentin.', options: ['der', 'einer'] },
    { question: 'Ich gehe in ___ Park.' },
    { question: 'Korrigieren Sie: „Seit einem Monat habe ich jeden Tag Gitarre gespielt.“' },
    { question: 'Korrigieren Sie: Ich schicke ihm es.' },
    { question: 'Das Hotel ist ___ dem Bahnhof.', options: ['neben', 'gegenüber', 'hinter'] },
    { question: 'Du ___ schlafen. (sollen, Ratschlag)', answer: 'solltest' },
    { topic: 'modal-verbs-past', question: '[wir / am Sonntag / gehen / wollen]', answer: 'Wir wollten am Sonntag gehen.' },
    { question: '___ Mittwoch habe ich einen Termin.', answer: 'Am' },
    { question: 'Sie kommt ___ der Schweiz.', options: ['aus', 'von'] },
    { question: '___ bitte die Tür!', options: ['Machen Sie'] },
  ];
  for (const item of probes) assert.ok(missingCue(item), JSON.stringify(item));
});
