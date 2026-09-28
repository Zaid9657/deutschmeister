// Course v2 — small pure helpers the renderers share: labels, lookups inside a compiled
// unit (SCHEMA §8 + §13), the two generators whose whole input is inside the unit file,
// and the audio call. No React here.

import { playLine, speechAvailable, audioFor } from '../../lib/lesson/speech.js';
import { hasNumber } from '../../lib/lesson/check.js';

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const ANON_SPEAKERS = {
  ansage: 'Ansage',
  radio: 'Radio',
  durchsage: 'Durchsage',
  pruefer: 'Prüfungsansage',
};

/**
 * A display name for a speaker id. `cast.frau-otto` → „Frau Otto", `x.herr-winter` →
 * „Herr Winter", `ansage` → „Ansage". `names` (optional, { [id]: name }) wins — the
 * player can pass the cast registry's names; without it the id is humanised.
 */
export function speakerName(id, names = null) {
  if (!id) return '';
  if (names && names[id]) return names[id];
  if (ANON_SPEAKERS[id]) return ANON_SPEAKERS[id];
  const slug = String(id).replace(/^(cast|x)\./, '');
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const LANE_NAMES = {
  sd1: 'Goethe-Zertifikat A1',
  ga2: 'Goethe-Zertifikat A2',
  ta2: 'telc Deutsch A2',
  tb1: 'telc Deutsch B1',
  dtz: 'DTZ',
  gb1: 'Goethe-Zertifikat B1',
  tb2: 'telc Deutsch B2',
  gb2: 'Goethe-Zertifikat B2',
  oza1: 'ÖSD ZA1',
  dtb2: 'DTB B2',
};

export const laneLabel = (lane) => LANE_NAMES[lane] || String(lane || '').toUpperCase();

// Teil prefixes → module names. Goethe/ÖSD: h/l/s/sp; telc: hv/lv/sb/sa/m.
const TEIL_MODULE = [
  [/^hv(\d+)$/, 'Hörverstehen'],
  [/^lv(\d+)$/, 'Leseverstehen'],
  [/^sb(\d+)$/, 'Sprachbausteine'],
  [/^sa$/, 'Schriftlicher Ausdruck'],
  [/^m(\d+)$/, 'Mündlicher Ausdruck'],
  [/^sp(\d+)$/, 'Sprechen'],
  [/^h(\d+)$/, 'Hören'],
  [/^l(\d+)$/, 'Lesen'],
  [/^s(\d+)$/, 'Schreiben'],
];

/** `ga2.h1` → „Hören Teil 1", `tb1.lv3` → „Leseverstehen Teil 3", `tb1.sa` → „Schriftlicher Ausdruck". */
export function teilLabel(template) {
  const teil = String(template || '').split('.')[1] || '';
  for (const [re, name] of TEIL_MODULE) {
    const m = re.exec(teil);
    if (m) return m[1] ? `${name} Teil ${m[1]}` : name;
  }
  if (/schreiben/.test(teil)) return 'Schreiben';
  if (/sprechen/.test(teil)) return 'Sprechen';
  return String(template || '');
}

/**
 * How often a Hören Teil is played, per Teil template (the `plays` field of
 * content/course-v2/registries/lanes/<lane>.json, launch lanes sd1/ga2/tb1/tb2). The
 * compiled block does not carry `plays` yet; `block.plays` wins as soon as it does.
 * Keep in step with the registry — see the open issue in the E1-2 handoff.
 */
export const LANE_PLAYS = Object.freeze({
  'sd1.h1': 2, 'sd1.h2': 1, 'sd1.h3': 2,
  'ga2.h1': 2, 'ga2.h2': 1, 'ga2.h3': 1, 'ga2.h4': 2,
  'tb1.hv1': 1, 'tb1.hv2': 2, 'tb1.hv3': 2,
  'tb2.hv1': 1, 'tb2.hv2': 1, 'tb2.hv3': 1,
});

/** Plays allowed for a block (null = unlimited, e.g. a reading Teil or an unknown template). */
export function playsFor(block) {
  if (Number.isFinite(block?.plays)) return block.plays;
  return LANE_PLAYS[block?.template] ?? null;
}

/** The skeleton of a level: B from B1.1 on (BLUEPRINT §3.2). */
export const skeletonOf = (level) => (/^b/i.test(String(level || '')) ? 'B' : 'A');

// ---------------------------------------------------------------------------
// Lookups inside a compiled unit
// ---------------------------------------------------------------------------

/** Every Line of the unit by id: start Folge, inputs, exam texts, check lines. */
export function lineIndex(unit) {
  const map = new Map();
  const add = (lines) => { for (const l of lines || []) if (l && l.id) map.set(l.id, l); };
  const addTexts = (texts) => { for (const t of texts || []) add(t?.lines); };
  add(unit?.start?.folge?.lines);
  for (const step of unit?.steps || []) {
    add(step?.input?.lines);
    addTexts(step?.texts);
    for (const b of step?.blocks || []) addTexts(b?.texts);
    addTexts(step?.examBlock?.texts);
  }
  add(unit?.check?.lines);
  return map;
}

/**
 * Resolve an ExamText reference. The compiled block carries its own `texts` with
 * short ids (`t1`), the authored file full ids (`a2.1-u07-ls4-t1`); accept both, and
 * look in the block, then the step, then any extra pool the caller passes.
 */
export function resolveText(ref, ...pools) {
  if (!ref) return null;
  for (const pool of pools) {
    for (const t of pool || []) {
      if (!t || !t.id) continue;
      if (t.id === ref) return t;
    }
  }
  for (const pool of pools) {
    for (const t of pool || []) {
      if (!t || !t.id) continue;
      if (t.id.endsWith(`-${ref}`) || ref.endsWith(`-${t.id}`)) return t;
    }
  }
  return null;
}

/** The sentence an error_correction prompt quotes to correct (the checker's own rule, checkItem.js). */
export { quotedSentence as correctionQuoteOf } from '../../lib/course-v2/checkItem.js';

/** The first „…" / "…" quotation in a prompt, or null. */
export function quoteOf(text) {
  const m = /„([^“”"]{2,})[“”"]|"([^"]{2,})"|«([^»]{2,})»/.exec(String(text || ''));
  return m ? (m[1] || m[2] || m[3]).trim() : null;
}

/** Word count as the writing screens count it (whitespace-separated tokens). */
export const countWords = (text) => String(text || '').trim().split(/\s+/).filter(Boolean).length;

/** The number of a step inside its unit (`…-ls4` → 4). */
export const stepNr = (stepId) => {
  const m = /-ls(\d)$/.exec(String(stepId || ''));
  return m ? Number(m[1]) : null;
};

/**
 * Can-do texts for a unit. The unit file carries only ids; the compiled course
 * manifest (`manifest.json` units[].canDoIds + canDos) carries the wording. Falls back
 * to a humanised id so the box is never empty.
 */
export function canDoTexts(unit, course = null, overrides = null) {
  const ids = unit?.start?.lernziele?.length ? unit.start.lernziele : (unit?.spec?.canDos || []);
  const entry = (course?.units || []).find((u) => u && u.unit === unit?.id) || null;
  const out = {};
  ids.forEach((id) => {
    if (overrides && overrides[id]) { out[id] = overrides[id]; return; }
    const i = entry && Array.isArray(entry.canDoIds) ? entry.canDoIds.indexOf(id) : -1;
    if (i >= 0 && entry.canDos && entry.canDos[i]) { out[id] = entry.canDos[i]; return; }
    const slug = String(id).replace(/^cd\.[a-z0-9]+\./, '').replace(/-/g, ' ');
    out[id] = slug.charAt(0).toUpperCase() + slug.slice(1);
  });
  return out;
}

/** Planned minutes of a step from the compiled unit (`minutesPlanned.byStep`). */
export const minutesOf = (unit, stepId) => unit?.minutesPlanned?.byStep?.[stepId] ?? null;

// ---------------------------------------------------------------------------
// Generators whose whole input is in the unit (SCHEMA §3.2). The others
// (numbers.dictation, lex.*, perception.intonation) need the lexicon or a number
// generator and are left to the player core; pass them in as `generated`.
// ---------------------------------------------------------------------------

/**
 * dictation.fromInput: the source line as a typed dictation. The key is the line's `de`; what the
 * learner hears is its `say` when it has one (ITM-13 requires both to grade alike). A line with a
 * digit or a number word carries `exact: 'number'` (ITM-07), which checkItem grades as a whole
 * sentence with exact digits and „zehn" = „10" (review a2.2-u04 r3 F04) — never digits alone.
 * Exported for the validator (ITM-13 builds the generated items with this very function).
 */
export function dictationItems(spec, lines) {
  const ids = spec.ids || [];
  const out = [];
  (spec.source || []).slice(0, spec.count || ids.length).forEach((ref, i) => {
    const line = lines.get(ref);
    if (!line || !ids[i]) return;
    out.push({
      id: ids[i],
      type: 'dictation',
      role: 'practice',
      topic: 'hoeren',
      origin: 'generator',
      promptDe: 'Hören Sie und schreiben Sie den Satz.',
      promptEn: 'Listen and write the sentence.',
      audioLineRef: line.id,
      answer: line.de,
      accepted: [line.de],
      ...(hasNumber(line.de) ? { exact: 'number' } : {}),
      explanation: { de: line.de, en: line.en || '' },
    });
  });
  return out;
}

function perceptionItems(spec) {
  const ids = spec.ids || [];
  const pairs = (spec.source || []).map((s) => String(s).split('|').map((x) => x.trim())).filter((p) => p.length === 2);
  const out = [];
  for (let i = 0; i < ids.length && pairs.length; i += 1) {
    const [a, b] = pairs[i % pairs.length];
    const target = i % 2 === 0 ? a : b; // deterministic: alternate the member that is played
    out.push({
      id: ids[i],
      type: 'listen_select',
      role: 'perception',
      topic: 'aussprache',
      origin: 'generator',
      promptDe: 'Welches Wort hören Sie?',
      promptEn: 'Which word do you hear?',
      options: [a, b],
      answer: target,
      accepted: [target],
      speak: target,
      explanation: { de: `Sie hören: ${target}.`, en: `You hear: ${target}.` },
    });
  }
  return out;
}

/**
 * Materialise the generators of one pool (or one Aussprache perception spec).
 * `generated` (optional { [itemId]: Item }) — items the player core built — wins.
 */
export function materialize(specs, unit, generated = null) {
  const list = Array.isArray(specs) ? specs : specs ? [specs] : [];
  const lines = lineIndex(unit);
  const out = [];
  for (const spec of list) {
    if (!spec || !spec.generator) continue;
    const provided = (spec.ids || []).map((id) => generated && generated[id]).filter(Boolean);
    if (provided.length) { out.push(...provided); continue; }
    if (spec.generator === 'dictation.fromInput') out.push(...dictationItems(spec, lines));
    else if (spec.generator === 'perception.pairs') out.push(...perceptionItems(spec));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

/** True when a recording exists for the line; otherwise the browser voice speaks. */
export const recordedLine = (unitId, lineId) => !!audioFor(unitId, lineId);

/** Can this browser play the line at all (recording or speech synthesis)? */
export const canPlay = (unitId, lineId) => recordedLine(unitId, lineId) || speechAvailable();

/**
 * Play one Line: the recording from the level's audio manifest when there is one
 * (keyed by the line id), else speech synthesis of `say` (the TTS text, AUD-02) or `de`.
 */
export function playV2Line(unitId, line, opts) {
  if (!line) return false;
  return playLine(unitId, line.id, line.say || line.de, opts);
}

/** Play a sequence of lines one after the other (speech synthesis queues them). */
export function playV2Lines(unitId, lines, opts) {
  if (!Array.isArray(lines) || !lines.length) return false;
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || lines.some((l) => recordedLine(unitId, l.id))) {
    return playV2Line(unitId, lines[0], opts);
  }
  try {
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices() || [];
    const voice = voices.find((v) => /^de[-_]DE/i.test(v.lang)) || voices.find((v) => /^de/i.test(v.lang));
    for (const l of lines) {
      const u = new SpeechSynthesisUtterance(String(l.say || l.de || ''));
      u.lang = 'de-DE';
      u.rate = opts?.rate || 0.92;
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    }
    return 'tts';
  } catch {
    return false;
  }
}
