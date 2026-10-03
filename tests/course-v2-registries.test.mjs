// Course v2 registries (SCHEMA §3.1, §4, §8): the registry owner's guards.
//
// The A1.1 unit reviews (r1–r3, u01–u12) deferred a set of registry and schema items to the registry owner
// (2026-09-28). Each test below pins one of them, so a later edit that undoes it fails here, not in a review:
// the new ErrorTags and optional schema fields, the names a1.1 texts use, the cast's contact data and voices, the
// detector whitelists for the A1.1 chunks, the spine ↔ detector mirror and the can-do learner lines.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { check, parse } from '../scripts/course-v2/lib/schema.mjs';
import '../scripts/course-v2/lib/schemas/index.mjs';
import { ERROR_TAG } from '../scripts/course-v2/lib/schemas/common.mjs';
import { rubricSchema } from '../scripts/course-v2/lib/schemas/rubric.mjs';
import { candoSchema } from '../scripts/course-v2/lib/schemas/cando.mjs';
import { namesSchema } from '../scripts/course-v2/lib/schemas/names.mjs';
import { castsSchema } from '../scripts/course-v2/lib/schemas/casts.mjs';
import { lexiconSchema } from '../scripts/course-v2/lib/schemas/lexicon.mjs';
import { laneSchema } from '../scripts/course-v2/lib/schemas/lane.mjs';
import { voicesSchema } from '../scripts/course-v2/lib/schemas/registries.mjs';
import { spineSchema } from '../scripts/course-v2/lib/schemas/spine.mjs';
import { detectorsSchema } from '../scripts/course-v2/lib/schemas/detectors.mjs';
import { checkDocument } from '../scripts/course-v2/lib/checker.mjs';
import { schemaExamples } from '../scripts/course-v2/lib/fixture.mjs';
import { detectInText, buildLexEnv } from '../scripts/course-v2/lib-validate/detectors.mjs';
import { validate } from '../scripts/course-v2/lib-validate/runner.mjs';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CONTENT = path.join(REPO, 'content', 'course-v2');
const REG = path.join(CONTENT, 'registries');
const read = (...p) => JSON.parse(fs.readFileSync(path.join(...p), 'utf8'));
const LEVELS = ['a1.1', 'a1.2', 'a2.1', 'a2.2', 'b1.1', 'b1.2', 'b2.1', 'b2.2'];
const errs = (schema, value) => check(schema, value).map((e) => `${e.path}: ${e.message}`);

const SPINE = read(REG, 'grammar-spine.json');
const DETECTORS = read(REG, 'detectors.json');
const NAMES = read(REG, 'names.json');
const VOICES = read(REG, 'voices.json');
const CANDO_A1 = read(REG, 'cando', 'a1.json');
const CASTS = Object.fromEntries(['series', 'a1', 'a2', 'b1', 'b2'].map((c) => [c, read(CONTENT, 'casts', `${c}.json`)]));
const det = (id) => DETECTORS.detectors.find((d) => d.id === id);
const LEXICON = LEVELS.flatMap((l) => {
  const f = path.join(CONTENT, l, 'lexicon.json');
  return fs.existsSync(f) ? read(f).entries : [];
});
const ENV = buildLexEnv(LEXICON);
const hits = (id, s) => detectInText(det(id), s, ENV).length;

/** Every unit file of every level (the draft units of the other levels included). */
function unitFiles() {
  const out = [];
  for (const l of LEVELS) {
    const d = path.join(CONTENT, l, 'units');
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) if (/^u\d{2}\.json$/.test(f)) out.push(path.join(d, f));
  }
  return out;
}

// ── schema additions (SCHEMA amendments 2026-09-28) ─────────────────────────────────────────────

test('ErrorTag: verb-ending and negation are one enum for items and rubric error policies', () => {
  for (const tag of ['verb-ending', 'negation']) {
    assert.match(ERROR_TAG, new RegExp(`\\b${tag}\\b`));
    assert.deepEqual(errs(parse('ErrorTag'), tag), []);
  }
  assert.notDeepEqual(errs(parse('ErrorTag'), 'negation-position'), [], 'folded into negation (SCHEMA §3.1)');
  const md = fs.readFileSync(path.join(REPO, 'docs', 'course-v2', 'SCHEMA.md'), 'utf8');
  const enumInDoc = md.match(/`ErrorTag = enum\(([^)]*)\)`/s)[1].replace(/\s+/g, '');
  assert.equal(`enum(${enumInDoc})`, ERROR_TAG, 'SCHEMA §3.1 and lib/schemas/common.mjs list the same tags');
  const rubric = read(REG, 'rubrics', 'writing', fs.readdirSync(path.join(REG, 'rubrics', 'writing')).find((f) => f.endsWith('.json')));
  rubric.errorPolicy = { a1: { 'verb-ending': 'flag', negation: 'flag' } };
  assert.deepEqual(errs(rubricSchema, rubric).filter((e) => /errorPolicy/.test(e)), []);
  // every spine errorTag is a SCHEMA ErrorTag (SCHEMA §4.2 errorTags: [str]* — spine notes §2 restrict it)
  const bad = SPINE.points.flatMap((p) => p.errorTags.filter((t) => errs(parse('ErrorTag'), t).length).map((t) => `${p.id}: ${t}`));
  assert.deepEqual(bad, []);
});

test('optional unit fields: story twin and glosses, Fokus glosses, micro-output model, a micro-output proof', () => {
  const u = structuredClone(schemaExamples().unit.json);
  assert.deepEqual(checkDocument(u, { kind: 'unit' }).filter((e) => !/REF-01/.test(e.message)), []);
  u.story.cliffhangerEn = 'At 5 pm the phone flashes once more.';
  u.story.glosses = [{ token: 'Neuigkeiten', gloss: { en: 'news' } }];
  for (const f of u.fokus) f.glosses = [{ token: 'Kita', gloss: { en: 'day nursery' } }];
  u.check.proofs[0] = { canDo: u.check.proofs[0].canDo, microOutput: 'a2.1-u07-ls1-mo' };
  const mo = u.steps.find((s) => s.microOutput)?.microOutput;
  mo.modelDe = 'Ich melde mich morgen bei Ihnen.';
  assert.deepEqual(checkDocument(u, { kind: 'unit' }).filter((e) => !/REF-01/.test(e.message)), []);
  u.story.glosses = [{ token: 'a', gloss: { en: 'a' } }, { token: 'b', gloss: { en: 'b' } }, { token: 'c', gloss: { en: 'c' } }, { token: 'd', gloss: { en: 'd' } }];
  assert.ok(checkDocument(u, { kind: 'unit' }).some((e) => /story\.glosses/.test(e.path)), 'at most three glosses, as on the Folge');
});

test('SpeakingPart: situationEn and the move nachfragen; WritingTask form fields: acceptedWhy', () => {
  const part = {
    template: 'sd1.sp1', mode: 'monologue', profile: 'sd1-sp1', prepMinutes: 0,
    instructionsDe: 'Stellen Sie sich vor.', situationDe: 'Sie sind im Kurs.', situationEn: 'You are in class.',
    moves: ['nachfragen'],
  };
  const task = { ...part, bankKey: 'a11-u02-s', lane: 'sd1', aiRole: { name: 'Nora', personaDe: 'Kursleiterin', register: 'Sie', support: 'examiner' }, openingLine: 'Guten Tag!', hintWords: [], modelTurns: [{ speaker: 'learner', de: 'Ich heiße Emre.' }] };
  assert.deepEqual(errs(parse('SpeakingTask'), task), []);
  assert.notDeepEqual(errs(parse('SpeakingTask'), { ...task, moves: ['fragen'] }), []);
  const writing = {
    bankKey: 'a11-u02-w', lane: 'sd1', template: 'sd1.s1', examKey: 'goethe_a1', profile: 'sd1-s1', register: 'formell', address: 'Sie',
    title: 'Anmeldung', situationDe: 'Emre meldet sich an.', taskDe: 'Füllen Sie das Formular aus.', leitpunkte: [],
    form: { fields: [{ id: 'f1', labelDe: 'Wohnort', answer: 'Prishtina', accepted: ['Prishtina', 'Pristina'], acceptedWhy: { Pristina: 'deutsche Schreibweise der Stadt' } }], documents: [] },
    checklist: ['Alle fünf Felder sind ausgefüllt.'], modelText: '…',
  };
  assert.deepEqual(errs(parse('WritingTask'), writing), []);
});

test('registry fields: learnerDe, names kind language, cast contact, pluralVariants, template speakers', () => {
  assert.deepEqual(errs(candoSchema, CANDO_A1), []);
  assert.deepEqual(errs(namesSchema, NAMES), []);
  for (const [name, c] of Object.entries(CASTS)) assert.deepEqual(errs(castsSchema, c).filter((e) => !/does not resolve/.test(e)), [], name);
  assert.deepEqual(errs(lexiconSchema, { $schema: 'course-v2/lexicon@1', level: 'a1.1', entries: [{ id: 'lx.balkon', lemma: 'Balkon', pos: 'NOUN', article: 'der', plural: 'Balkone', pluralVariants: ['Balkons'], plural_kind: 'regular', role: 'productive', unit: 'a1.1-u05', block: 1, list_ref: 'A1', gloss: { en: 'balcony' }, example: 'Die Wohnung hat einen Balkon.', wordId: null }], promotions: [] }), []);
  const sd1 = read(REG, 'lanes', 'sd1.json');
  assert.deepEqual(errs(laneSchema, sd1), []);
  assert.equal(sd1.teile.h1.speakers, 2, 'SD1 Hören Teil 1: short conversations between two people (a1.1-u01 r3 F07)');
  assert.deepEqual(errs(voicesSchema, VOICES), []);
  assert.deepEqual(errs(spineSchema, SPINE), []);
  assert.deepEqual(errs(detectorsSchema, DETECTORS), []);
});

// ── names (SCHEMA §4.9) ─────────────────────────────────────────────────────────────────────

test('names: the Prishtina spellings, Lindenau, the u03 family names and every A1 cast language are known in A1.1', () => {
  const known = new Map(NAMES.names.map((n) => [n.form.toLowerCase(), n]));
  for (const form of ['Pristina', 'Priština', 'Lindenau', 'Rahul', 'Anu', 'Iryna', 'Zeynep', 'Drita']) {
    assert.equal(known.get(form.toLowerCase())?.level, 'a1.1', form);
  }
  // every language of a cast member in the a1 band is a lexicon lemma or a listed name (a1.1 u01 r1 F13, u05 r1 F06)
  const lemmas = new Set(LEXICON.map((e) => String(e.lemma).toLowerCase()));
  const missing = [];
  for (const c of Object.values(CASTS)) {
    for (const [id, m] of Object.entries(c.members)) {
      if (!m.bands.includes('a1')) continue;
      for (const lang of m.languages) {
        const k = lang.toLowerCase();
        if (!lemmas.has(k) && known.get(k)?.level !== 'a1.1') missing.push(`${id}: ${lang}`);
      }
    }
  }
  assert.deepEqual(missing, []);
  assert.ok(NAMES.names.filter((n) => n.kind === 'language').every((n) => /cast\./.test(n.note || '')), 'a language name is listed for the cast, never as a way around LEX-01');
});

// ── casts and voices (SCHEMA §4.7) ──────────────────────────────────────────────────────────

test('casts: Priya and Arjun carry the contact data the units state (a1.1 u02 r1-F16 … u12 r1-F06)', () => {
  const { 'cast.priya': priya, 'cast.arjun': arjun } = CASTS.series.members;
  assert.equal(priya.contact.phone, '0176 38 29 41 06');
  assert.equal(arjun.contact.phone, '0176 52 83 91 40');
  for (const m of [priya, arjun]) {
    assert.deepEqual(m.contact.addresses.map((a) => [a.de, a.from, a.until ?? null]), [
      ['Berliner Straße 21, 04105 Leipzig', 'a1.1-u01', 'a1.1-u05'],
      ['Kölner Straße 18, 04177 Leipzig', 'a1.1-u05', null],
    ]);
  }
});

test('voices: every cast voice and every extra voice is a registered Azure voice', () => {
  const voices = new Set(Object.keys(VOICES.voices));
  const bad = [];
  for (const [name, c] of Object.entries(CASTS)) for (const [id, m] of Object.entries(c.members)) if (!voices.has(m.voice.azure)) bad.push(`casts/${name}.json ${id}: ${m.voice.azure}`);
  for (const f of unitFiles()) {
    const u = read(f);
    for (const [id, x] of Object.entries(u.extras || {})) if (!voices.has(x.voice)) bad.push(`${path.relative(CONTENT, f)} ${id}: ${x.voice}`);
  }
  assert.deepEqual(bad, []);
  // a variety voice goes with the extra's variety (registries-notes/voices.md)
  const variety = { 'de-AT': 'A', 'de-CH': 'CH' };
  const wrong = [];
  for (const f of unitFiles()) {
    for (const [id, x] of Object.entries(read(f).extras || {})) {
      const want = variety[VOICES.voices[x.voice]?.locale];
      if (want && x.variety !== want) wrong.push(`${path.relative(CONTENT, f)} ${id}: ${x.voice} needs variety ${want}`);
    }
  }
  assert.deepEqual(wrong, []);
});

// ── detectors (SCHEMA §4.7) and the spine (§4.2) ─────────────────────────────────────────────

test('spine ↔ detectors: points[].detectors mirrors detectors.json spec.spinePoints (spine notes §3)', () => {
  const byPoint = new Map();
  for (const d of DETECTORS.detectors) for (const p of d.spec.spinePoints || []) byPoint.set(p, [...(byPoint.get(p) || []), d.id]);
  const drift = SPINE.points
    .filter((p) => [...p.detectors].sort().join() !== [...(byPoint.get(p.id) || [])].sort().join())
    .map((p) => `${p.id}: spine [${p.detectors}] vs detectors [${byPoint.get(p.id) || []}]`);
  for (const k of byPoint.keys()) if (!SPINE.points.some((p) => p.id === k)) drift.push(`unknown spine point ${k}`);
  assert.deepEqual(drift, []);
});

test('spine: the verb-form and negation points carry their tags; g.akkusativ names meinen/deinen', () => {
  const p = Object.fromEntries(SPINE.points.map((x) => [x.id, x]));
  for (const id of ['g.praesens', 'g.vokalwechsel']) assert.equal(p[id].errorTags[0], 'verb-ending', id);
  for (const id of ['g.moechte', 'g.koennen', 'g.moegen', 'g.wollen', 'g.muessen-duerfen-man']) assert.ok(p[id].errorTags.includes('verb-ending'), id);
  for (const id of ['g.negation-nicht', 'g.nicht-position-gern', 'g.kein']) assert.ok(p[id].errorTags.includes('negation'), id);
  assert.match(p['g.akkusativ'].label, /meinen, deinen/);
  // no chunkFrom was moved: every unit keeps at most one chunk preview from the spine (GRM-01)
  const perUnit = new Map();
  for (const x of SPINE.points) if (x.chunkFrom) perUnit.set(x.chunkFrom, [...(perUnit.get(x.chunkFrom) || []), x.id]);
  assert.deepEqual([...perUnit].filter(([, ids]) => ids.length > 1), []);
});

test('detectors: the A1.1 chunks the reviews named are whitelisted, and the real constructions still hit', () => {
  // „Welche Sprachen sprichst du?" is the a1.1-u01 chunk (u01 r1 F03); welch- as a point stays a1.2-u06
  assert.equal(hits('det.welch-dies', 'Welche Sprachen sprichst du?'), 0);
  assert.equal(hits('det.welch-dies', 'Und welche Sprachen sprechen Sie?'), 0);
  assert.ok(hits('det.welch-dies', 'Welche Jacke nehmen Sie?'));
  // „Stellen Sie sich (bitte) vor" (lx.sich-vorstellen, a1.1-u01; u01 r2/r3 F05)
  for (const s of ['Stellen Sie sich bitte vor: Wie heißen Sie? Woher kommen Sie?', 'Sie können grüßen, sich vorstellen und Tschüss sagen.']) {
    assert.equal(hits('det.reflexiv-pronomen', s), 0, s);
    assert.equal(hits('det.trennbare-verben', s), 0, s);
  }
  assert.ok(hits('det.reflexiv-pronomen', 'Ich melde mich morgen.'));
  assert.ok(hits('det.trennbare-verben', 'Heute stelle ich Arta vor.'), 'a separable verb outside the chunk still hits (u01 r1 F09)');
  // „Meine Muttersprache ist …" beside „Mein Name ist …" (u01 r2 F09)
  assert.equal(hits('det.possessiv-mein-dein-ihr', 'Meine Muttersprache ist Malayalam.'), 0);
  assert.ok(hits('det.possessiv-mein-dein-ihr', 'Das ist meine Mutter.'));
  // a house number, a label number or an age that ends a sentence is no ordinal (u05 r1 F04)
  for (const s of ['Kölner Straße 18. Die Telefonnummer ist 0176 38 29 41 06.', 'Münchner Straße 30. Miete: 750 Euro.', 'Er ist 24. Er studiert in Kochi.']) {
    assert.equal(hits('det.ordinalzahl', s), 0, s);
  }
  assert.ok(hits('det.ordinalzahl', 'Der Kurs fängt am 1. Februar an.'));
  // the r4-F08 / r5-F05 false positives at a1.1-u04 stay fixtures
  assert.equal(hits('det.adjektiv-endung-nullartikel', 'Dann möchten wir zwei Kilo Kartoffeln.'), 0);
  assert.equal(hits('det.trennbare-verben', 'Was macht das zusammen?'), 0);
  assert.equal(hits('det.trennbare-verben', 'Das macht zusammen 7 Euro.'), 0);
});

// ── can-do learner lines (SCHEMA §4.1 learnerDe) ─────────────────────────────────────────────

test('can-dos: every id an a1.1 unit shows has a learner line without the „Ich kann" frame', () => {
  const items = new Map(CANDO_A1.items.map((x) => [x.id, x]));
  const missing = [];
  for (const f of unitFiles().filter((x) => x.includes(`${path.sep}a1.1${path.sep}`))) {
    const u = read(f);
    for (const id of u.start?.lernziele || []) {
      const line = items.get(id)?.learnerDe;
      if (!line) missing.push(`${u.id}: ${id}`);
      else if (/^\s*(ich kann|sie können)\b/i.test(line)) missing.push(`${u.id}: ${id} starts with the frame`);
    }
  }
  assert.deepEqual(missing, []);
});

test('can-dos: the learner lines use only what is known at the unit that shows them (LEX-01, GRM-04)', async () => {
  const report = await validate('a1.1', { only: ['LEX-01', 'GRM-04'] });
  const onLines = report.results.flatMap((r) => (r.findings || []).filter((f) => /learnerDe/.test(f.path || '')).map((f) => `${r.id} ${f.path}: ${f.message.slice(0, 160)}`));
  assert.deepEqual(onLines, []);
});

// ── second batch: the a1.1 u07–u12 reviews ────────────────────────────────────────────────────────

test('error_correction may carry tiles (the constituents, never rendered); WritingTask address ihr and textType', () => {
  const ec = {
    id: 'a1.1-u07-ls2-p09', type: 'error_correction', role: 'practice', topic: 'g.zeitangaben-inversion',
    promptDe: 'Korrigieren Sie die Wortstellung: „Am Montag ich arbeite.“', answer: 'Am Montag arbeite ich.', accepted: ['Am Montag arbeite ich.'],
    intentionalError: true, errorTag: 'v2-inv', tiles: ['am Montag', 'arbeite', 'ich'], explanation: { de: 'Das Verb steht auf Position 2.', en: 'The verb is second.' }, origin: 'agent',
  };
  assert.deepEqual(errs(parse('Item'), ec), []);
  const post = {
    bankKey: 'a11-u11-w', lane: 'sd1', template: 'sd1.s2', examKey: 'goethe_a1', profile: 'sd1-s2', register: 'informell', address: 'ihr', textType: 'tt.post',
    title: 'Ein Post', situationDe: 'Sie waren am Wochenende in Dresden.', taskDe: 'Schreiben Sie einen Post.', leitpunkte: [{ id: 'lp1', de: 'Wo waren Sie?', cues: ['Dresden'] }],
    wordBand: [20, 40], minSubmitWords: 10, checklist: ['Anrede und Gruß'], modelText: 'Hallo zusammen! …',
  };
  assert.deepEqual(errs(parse('WritingTask'), post), []);
  assert.notDeepEqual(errs(parse('WritingTask'), { ...post, address: 'euch' }), []);
});

test('casts: Dr. Sommer\'s Sprechzeiten are recorded once, the legal minimum marked unverified', () => {
  const sommer = CASTS.a1.members['cast.dr-sommer'];
  assert.match(sommer.contact.hoursDe, /Mo–Fr 8–12 Uhr; Mo, Di, Do 15–18 Uhr/);
  assert.match(sommer.contact.note, /UNVERIFIED/);
  assert.match(sommer.contact.note, /TODO/);
  assert.deepEqual(sommer.bands, ['a1', 'a2', 'b1'], 'one entry serves A1–B1: the a2/b1 casts only relate to it');
  for (const c of ['a2', 'b1']) assert.equal(CASTS[c].members['cast.dr-sommer'], undefined);
});

test('series: the Praktikum of the A1.1 → A1.2 beat starts in the week between the courses (a1.1-u12 r2 F09)', () => {
  const beat = CASTS.series.beats.find((b) => b.from === 'a1.1-u12');
  assert.match(beat.resolution, /Woche zwischen dem Kurs A1\.1 und dem Kurs A1\.2/);
  assert.match(CASTS.series.members['cast.priya'].role, /A1\.2 Mo–Do 9–12 Uhr/);
});

test('detectors (second batch): genitive with einer after a noun; the review false positives stay fixtures', () => {
  assert.ok(hits('det.genitiv-feminin-attribut', 'Auf der Webseite einer Sprachschule steht ein Kurs.'));
  assert.equal(hits('det.genitiv-feminin-attribut', 'Ich spreche mit einer Freundin.'), 0);
  assert.equal(hits('det.ordinalzahl', 'Die Nummer ist 0157 38 42 96 10. Priya bestellt einen Kaffee.'), 0);
  assert.equal(hits('det.possessiv-sein-ihr-unser-euer', 'Mögt ihr Kuchen auch?'), 0);
  assert.equal(hits('det.possessiv-sein-ihr-unser-euer', 'Mögt auch ihr Kuchen?'), 0);
  assert.ok(hits('det.possessiv-sein-ihr-unser-euer', 'Das ist sein Fahrrad.'));
  assert.equal(hits('det.zustandspassiv', 'Wir sind am Samstag verabredet.'), 0);
});
