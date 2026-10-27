import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURRICULUM_A21 as course } from '../src/data/curricula/a21.js';
import { personaConsistency, PERSONAS_A11, PERSONAS_A12, PERSONAS_A21 } from '../scripts/validate-curriculum.mjs';

const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a21.json', import.meta.url))).items;
const informalInstruction = s => /\b[Dd]u\s+(?:konjugierst|schreibst|brauchst|musst|kannst|sollst|wählst|ergänzt)\b/.test(s);
const addedMeaning = ({ de, en }) => (/\bonly\b/.test(en) && !/\b(?:nur|erst|einzig)\b/.test(de))
  || (/\bbeforehand\b/.test(en) && !/\b(?:vorher|zuvor)\b/.test(de));
const brokenCollocation = s => /\bMach(?:t|en Sie)? (?:bitte )?die Tür!|Wie ist der Preis\?|Hoffnung auf Urlaub|fotografiert und Fotos gemacht/.test(s);

test('learner instructions use Sie; pronoun names and friends dialogue remain legitimate', () => {
  const fields = pool.flatMap(i => [i.explanationDe, i.hint || '']);
  for (const l of course.lektionen) fields.push(l.notice.bodyDe, l.sprechen.open.promptDe, l.schreiben.taskDe);
  for (const text of fields) assert.equal(informalInstruction(text), false, text);
  assert.equal(informalInstruction('Du konjugierst nur räumen.'), true);
  assert.equal(informalInstruction('Aus du wird dich.'), false);
  for (const l of course.lektionen) {
    if (!/Freund/.test(l.dialog.setting)) continue;
    const texts = [...l.dialog.lines.map(d => d.de), ...(l.hoeren?.units || []).map(u => u.audioText)];
    for (const text of texts.filter(t => /(?:Ana|Lena|Tim):/.test(t))) {
      assert.doesNotMatch(text, /\b(?:Ihre|Ihnen)\b/, text);
    }
  }
});

test('English dialogue qualifiers and scene participants are supported by the German', () => {
  for (const l of course.lektionen) {
    for (const line of l.dialog.lines) assert.equal(addedMeaning(line), false, line.en);
    const summary = course.meta.lektionIntro[l.id].situationEn;
    for (const name of Object.keys(PERSONAS_A21)) {
      if (summary.includes(name)) assert.ok((l.situation + l.dialog.setting).includes(name), summary);
    }
    if (/Grillabend/.test(l.situation)) assert.match(summary, /barbecue/);
    if (/Training im Verein/.test(l.situation)) assert.match(summary, /train.*club/);
  }
  assert.equal(addedMeaning({ de: 'Ich durfte um neun gehen.', en: 'I was only allowed to leave at nine.' }), true);
  assert.equal(addedMeaning({ de: 'Wir könnten zusammen essen.', en: 'We could eat together beforehand.' }), true);
});

test('models use complete everyday collocations and keep friends families distinct', () => {
  for (const l of course.lektionen) {
    for (const text of [...l.dialog.lines.map(d => d.de), l.schreiben.sample]) assert.equal(brokenCollocation(text), false, text);
    if (/Hallo Lena,/.test(l.schreiben.sample) && /Grüße, Ana$/.test(l.schreiben.sample)) assert.doesNotMatch(l.schreiben.sample, /bei unserer Oma/);
  }
  for (const old of ['Mach bitte die Tür!', 'Wie ist der Preis?', 'Hast du Hoffnung auf Urlaub?', 'Ich habe fotografiert und Fotos gemacht.']) assert.equal(brokenCollocation(old), true);
});

test('RULE 14 inherits both A1 casts and catches contradictions on A2 exam input surfaces', () => {
  for (const [name, facts] of Object.entries(PERSONAS_A11)) for (const [fact, value] of Object.entries(facts)) {
    if (value !== null) assert.deepEqual(PERSONAS_A21[name][fact], value, `${name}: ${fact}`);
  }
  for (const [name, facts] of Object.entries(PERSONAS_A12)) assert.deepEqual(PERSONAS_A21[name], facts);
  assert.deepEqual(personaConsistency(course), []);
  const recipient = structuredClone(course);
  recipient.lektionen[0].hoeren.units[0].audioText = 'Lena zeigt Ana Fotos ihrer Familie.';
  assert.deepEqual(personaConsistency(recipient), [], 'a recipient followed by an object is not a full name');
  for (const text of ['Lena zeigt Ana Fotos.', 'Tim schenkt Lena Blumen.', 'Lena zeigt Ana Fotos und erzählt von ihrer Familie.']) {
    recipient.lektionen[0].hoeren.units[0].audioText = text;
    assert.deepEqual(personaConsistency(recipient), [], text);
  }
  const contradictions = ['Ana: Ich bin verheiratet.', 'Ana: Ich komme aus Italien.', 'Lena: Ich bin 40 Jahre alt.', 'Lena: Ich wohne in Hamburg.', 'Lena Berg wohnt in Köln.'];
  for (const text of contradictions) {
    for (const surface of ['lesson', 'checkpoint']) {
      const c = structuredClone(course);
      if (surface === 'lesson') c.lektionen[0].hoeren.units[0].audioText = text;
      else c.checkpoints[0].lesen.papers[0][0].text = text;
      assert.ok(personaConsistency(c).length, `${surface}: ${text}`);
    }
  }
});
