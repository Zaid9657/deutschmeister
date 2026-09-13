#!/usr/bin/env node
// Validator for the situational curricula (docs/course-factory/a11-rebuild/CONTRACT.md).
//
// The curriculum module is the single source for the lesson player, the checkpoint builder and
// the public syllabus page, so a mistake in it is a mistake on a page a buyer reads before paying.
// This script is the gate: it re-derives every structural rule of the contract from the data and
// exits non-zero on the first failure. `tests/curricula.test.mjs` pins the same rules.
//
//   node scripts/validate-curriculum.mjs
//
// The one rule worth explaining: RULE 5 (dialogue vocabulary). Every content word a learner hears
// in a dialogue must already have been taught — in this Lektion's Wortfeld or an earlier one — or
// be a function word from the closed FUNCTION_WORDS list in the curriculum module. The check
// tokenises each line and expands every Wortfeld entry into its forms (conjugations, separable
// Satzklammer, participles for the Perfekt chunks, plurals, adjective endings), so "Ich kaufe am
// Freitag ein." passes on the strength of the entry "einkaufen" and nothing else.
//
// RULE 10 and RULE 11 are the systemic ask of DaF review #3 (2026-09-12), whose closing paragraph
// reads: „Der Validator läuft über Dialoge, nicht über Items“ — every repair round wrote new
// Vorgriffe because only the dialogues were ever checked. RULE 10 turns RULE 5 around (a taught
// word must also be USED, not only listed: ≈50 of 262 Wortfeld entries occurred in no input of
// their own Lektion), RULE 11 runs RULE 5's own machinery over the hand-written practice items in
// src/data/lessonPools/a11.extra.json. Both are ratchets, not hard gates, because the debt is
// older than this round; they may only ever be lowered.

import { readFileSync } from 'node:fs';

import { CURRICULUM_A11, FUNCTION_WORDS, DIALOG_NAMES } from '../src/data/curricula/a11.js';
import { writingTaskByKey } from '../src/data/writingTasks.js';

export const GRAMMAR_SLUGS = [
  'nouns-gender', 'definite-articles', 'personal-pronouns', 'verb-sein', 'alphabet-pronunciation',
  'verb-haben', 'indefinite-articles', 'present-tense-regular', 'possessive-articles',
  'separable-verbs-intro', 'yes-no-questions', 'time-and-dates',
];

export const EXAM_TEILE = [
  'Hören Teil 1', 'Hören Teil 2', 'Hören Teil 3',
  'Lesen Teil 1', 'Lesen Teil 2', 'Lesen Teil 3',
  'Schreiben Teil 1', 'Schreiben Teil 2',
  'Sprechen Teil 1', 'Sprechen Teil 2', 'Sprechen Teil 3',
];

// The 12 situations of the standard (§2.2), in order. Each entry is the set of keywords the
// Lektion's `situation` must contain, so the order cannot silently drift.
export const SITUATION_KEYWORDS = [
  ['Begrüßung', 'Alphabet'],
  ['Person', 'Beruf', 'Zahlen'],
  ['Familie', 'Sprachen'],
  ['Einkaufen', 'Möbel', 'Preise'],
  ['Gegenstände', 'Farben'],
  ['Büro', 'Technik', 'Telefon'],
  ['Freizeit', 'Hobbys'],
  ['Verabredungen', 'Uhrzeit', 'Tagesablauf'],
  ['Essen', 'Trinken', 'Einladung'],
  ['Verkehrsmittel', 'Reisen'],
  ['Gestern', 'Tagesablauf'],
  ['Feste', 'Wiederholung'],
];

// Order of `primarySlug` across the 12 Lektionen; the reasoning is in the module header.
export const PRIMARY_ORDER = [
  'alphabet-pronunciation', 'verb-sein', 'personal-pronouns', 'nouns-gender', 'definite-articles',
  'indefinite-articles', 'present-tense-regular', 'time-and-dates', 'verb-haben',
  'yes-no-questions', 'separable-verbs-intro', 'possessive-articles',
];

// How "the primary structure occurs ≥ 3 times" is counted, per topic.
const PRIMARY_PATTERNS = {
  'alphabet-pronunciation': /\bbuchstabier\w*|\b(?:[A-ZÄÖÜ]-){2,}[A-ZÄÖÜ]\b/g,
  'verb-sein': /\b(?:bin|bist|ist|sind|seid)\b/gi,
  'personal-pronouns': /\b(?:er|sie|es|wir|ihr)\b/gi,
  'nouns-gender': /\b(?:der|die|das)\s+[A-ZÄÖÜ]\w+/g,
  'definite-articles': /\b(?:der|die|das|den|dem)\s+[A-ZÄÖÜ]\w+/g,
  'indefinite-articles': /\b(?:ein|eine|einen|einem|einer|kein|keine|keinen)\b/gi,
  'verb-haben': /\b(?:habe|hast|hat|haben|habt)\b/gi,
  'present-tense-regular': /\b\w+(?:e|st|t|en)\b(?=[^A-Za-zÄÖÜäöüß]*(?:gern|Musik|Sport|zusammen|jede|auch|du|ich|wir))/g,
  'time-and-dates': /\b(?:um|am)\s+\w+|\bUhr\b/g,
  'yes-no-questions': /^(?:[A-ZÄÖÜ]\w+)\b[^?]*\?/gm,
  'separable-verbs-intro': /\b(?:auf|an|ein|mit|zu)\s*[.?!]/g,
  'possessive-articles': /\b(?:mein|meine|meinen|meinem|meiner|dein|deine|deinen|sein|seine|ihr|ihre)\b/gi,
};

// Regular present-tense endings are generated; these are the few stem changes the dialogues use.
const IRREGULAR_FORMS = {
  sprechen: ['spreche', 'sprichst', 'spricht', 'sprechen', 'sprecht', 'sprich', 'gesprochen'],
  fahren: ['fahre', 'fährst', 'fährt', 'fahren', 'fahrt', 'fahr', 'gefahren'],
  essen: ['esse', 'isst', 'essen', 'esst', 'iss', 'gegessen'],
  einladen: ['lade', 'lädst', 'lädt', 'laden', 'ladet', 'eingeladen'],
  möchten: ['möchte', 'möchtest', 'möchtet', 'möchten'],
  heißen: ['heiße', 'heißt', 'heißen', 'geheißen'],
  mitkommen: ['komme', 'kommst', 'kommt', 'kommen', 'mitgekommen'],
  'kommen aus': ['komme', 'kommst', 'kommt', 'kommen', 'gekommen'],
  aufstehen: ['stehe', 'stehst', 'steht', 'stehen', 'aufgestanden'],
  aufwachen: ['wache', 'wachst', 'wacht', 'wachen', 'aufgewacht'],
};

const SEPARABLE_PREFIXES = ['auf', 'an', 'ein', 'mit', 'aus', 'vor', 'nach', 'ab', 'zu'];

const tokenise = (s) => String(s)
  .replace(/[^A-Za-zÄÖÜäöüß]+/g, ' ')
  .trim()
  .split(/\s+/)
  .filter((t) => t.length > 1);

const participle = (stem) => 'ge' + stem + (/[td]$/.test(stem) ? 'et' : 't');

function verbForms(inf) {
  const out = new Set([inf]);
  const stem = inf.endsWith('en') ? inf.slice(0, -2) : inf.slice(0, -1);
  if (!stem) return out;
  let endings = ['e', 'st', 't', 'en'];
  if (/[td]$/.test(stem)) endings = ['e', 'est', 'et', 'en'];       // arbeiten → du arbeitest
  else if (/[sßzx]$/.test(stem)) endings = ['e', 't', 'en'];        // heißen → du heißt
  for (const e of endings) out.add(stem + e);
  out.add(stem);                                                    // Imperativ: Komm!
  out.add(participle(stem));
  return out;
}

/** Every form of one Wortfeld entry a dialogue line may legitimately use. */
export function formsOf(entry) {
  const forms = new Set();
  for (const t of tokenise(entry.de)) forms.add(t.toLowerCase());
  for (const t of tokenise(entry.word || '')) forms.add(t.toLowerCase());
  if (entry.plural && entry.plural !== '—') for (const t of tokenise(entry.plural)) forms.add(t.toLowerCase());
  const head = String(entry.word || entry.de);
  const isNoun = Boolean(entry.article);
  const single = !head.includes(' ');
  if (!isNoun && single && head === head.toLowerCase()) {
    if (/(en|ern|eln|n)$/.test(head)) {
      let base = head;
      for (const p of SEPARABLE_PREFIXES) {
        if (head.startsWith(p) && head.length - p.length >= 4) {
          forms.add(p);
          base = head.slice(p.length);
          for (const f of verbForms(base)) forms.add(f);
          forms.add(p + participle(base.endsWith('en') ? base.slice(0, -2) : base.slice(0, -1)));
          break;
        }
      }
      for (const f of verbForms(base)) forms.add(f);
    }
    // adjective / adverb endings
    for (const e of ['', 'e', 'er', 'es', 'en', 'em']) forms.add(head + e);
  }
  for (const [inf, list] of Object.entries(IRREGULAR_FORMS)) {
    if (inf === head || inf === entry.de) for (const f of list) forms.add(f.toLowerCase());
  }
  return forms;
}

/**
 * RULE 10 ratchet — how many Wortfeld entries may still occur in NO input of their own Lektion,
 * counted across all twelve. DaF review #3 measured ≈50 of 262 before this round; the L2 Schreiben
 * rewrite, the L8 Samstag/Sonntag line and the four new L9 café lines closed the densest clusters.
 * This number may be lowered, never raised (the contract's ceiling is 30).
 */
export const MAX_UNCOVERED_WORTFELD = 35;

/**
 * RULE 11 ratchet — how many (item, token) pairs in the hand-written pool may still use a word
 * that the course has not taught by that item's Lektion. The review's finding was that the
 * hand-written repairs „unterliegen keiner Prüfung“; this is that check. Lower it as items are
 * rewritten, never raise it.
 */
export const MAX_UNTAUGHT_ITEM_TOKENS = 15;

/** The hand-written practice items, read from disk so the validator sees what the pool build sees. */
export function loadExtraItems() {
  const url = new URL('../src/data/lessonPools/a11.extra.json', import.meta.url);
  try {
    return JSON.parse(readFileSync(url, 'utf8')).items || [];
  } catch {
    return [];
  }
}

/** Lektion number an item belongs to, from its `extra-a11-lNN-…` id. */
const lektionOfItem = (id) => {
  const m = /^extra-a11-l(\d{2})-/.exec(String(id || ''));
  return m ? Number(m[1]) : null;
};

const FUNCTION_SET = new Set(FUNCTION_WORDS.map((w) => w.toLowerCase()));
const NAME_SET = new Set(DIALOG_NAMES.map((w) => w.toLowerCase()));

/**
 * The forms that count as "this Wortfeld entry was used". formsOf() also yields the article and the
 * function words of multi-word entries ("von Beruf", "Viertel nach"), which would make almost
 * anything look covered, so they are dropped: an entry is carried by its content word or not at all.
 */
export function coverageForms(w) {
  const head = tokenise(w.word || w.de).map((t) => t.toLowerCase())
    .filter((t) => t !== String(w.article || '').toLowerCase());
  // Entries whose only content IS a function word (gern, schon, bitte, danke, hallo) can never be
  // "missing" — RULE 5 lets any line use them — so they are outside this rule.
  if (!head.length || head.every((t) => FUNCTION_SET.has(t))) return new Set();
  const forms = formsOf(w);
  if (w.article) forms.delete(String(w.article).toLowerCase());
  for (const f of [...forms]) if (FUNCTION_SET.has(f)) forms.delete(f);
  return forms;
}

/** RULE 10: every Wortfeld entry must occur somewhere in the input of its own Lektion. */
export function wortfeldCoverage(c, extraItems = loadExtraItems()) {
  const byLektion = new Map();
  for (const it of extraItems) {
    const nr = lektionOfItem(it.id);
    if (nr) byLektion.set(nr, [...(byLektion.get(nr) || []), it]);
  }
  const uncovered = [];
  for (const l of c.lektionen || []) {
    const sources = [
      l.dialog?.title, l.dialog?.setting,
      ...(l.dialog?.lines || []).map((x) => x.de),
      l.notice?.title, l.notice?.bodyDe, ...(l.notice?.examples || []),
      l.sprechen?.open?.promptDe, ...(l.sprechen?.open?.hintWords || []),
      l.phonetik?.focus, ...(l.phonetik?.items || []),
      l.pretest?.promptDe, l.pretest?.model, ...(l.pretest?.accepted || []),
      l.schreiben?.taskDe, l.schreiben?.sample,
      ...(l.schreiben?.leitpunkte || []), ...(l.schreiben?.fields || []),
      ...(byLektion.get(l.nr) || []).flatMap((it) => [
        it.questionDe, it.answer, it.explanationDe, ...(it.options || []), ...(it.accepted || []),
      ]),
    ].filter(Boolean);
    const seen = new Set();
    for (const s of sources) for (const t of tokenise(s)) seen.add(t.toLowerCase());
    for (const w of l.wortfeld || []) {
      const forms = coverageForms(w);
      if (!forms.size) continue;                       // greetings whose only token is a function word
      if (![...forms].some((f) => seen.has(f))) uncovered.push({ nr: l.nr, de: w.de });
    }
  }
  return uncovered;
}

// What is NOT lexis in a hand-written prompt: the cue in brackets, the Sie-Aufgabenformel and the
// article+noun that names what the learner has to produce.
const ITEM_CUE_RE = /\([^)]*\)|\[[^\]]*\]/g;
const ITEM_FORMULA_RE = new RegExp([
  'Bilden Sie den Satz', 'Bilden Sie die Frage', 'Bilden Sie',
  'Schreiben Sie', 'Korrigieren Sie', 'Ergänzen Sie', 'Wählen Sie', 'Setzen Sie', 'Finden Sie',
  'die Frage', 'den Satz', 'das Wort', 'die Zahl', 'als Wort', 'richtig', 'normalen Wortfolge',
].join('|'), 'g');

/** RULE 11: the hand-written items obey the same taught-words rule as the dialogues. */
export function itemLexis(c, extraItems = loadExtraItems()) {
  const known = new Set([...FUNCTION_SET, ...NAME_SET]);
  const knownUpTo = new Map();
  for (const l of c.lektionen || []) {
    for (const w of l.wortfeld || []) for (const f of coverageForms(w)) known.add(f);
    for (const w of l.wortfeld || []) for (const f of formsOf(w)) known.add(f);
    knownUpTo.set(l.nr, new Set(known));
  }
  const offenders = [];
  for (const it of extraItems) {
    const nr = lektionOfItem(it.id);
    if (!nr) continue;
    const vocab = knownUpTo.get(nr);
    if (!vocab) continue;
    const prompt = String(it.questionDe || '').replace(ITEM_CUE_RE, ' ').replace(ITEM_FORMULA_RE, ' ');
    const texts = [prompt, it.answer, ...(it.accepted || [])].filter(Boolean);
    const seen = new Set();
    for (const s of texts) {
      for (const t of tokenise(s)) {
        const low = t.toLowerCase();
        if (vocab.has(low) || NAME_SET.has(low) || seen.has(low)) continue;
        seen.add(low);
        offenders.push({ id: it.id, token: t });
      }
    }
  }
  return offenders;
}

const words = (s) => String(s).trim().split(/\s+/).filter(Boolean);

export function validateCurriculum(c, extraItems = loadExtraItems()) {
  const errors = [];
  const fail = (msg) => errors.push(msg);
  const L = c.lektionen || [];

  // ---- RULE 8 (shape + hours) -------------------------------------------------------------
  if (c.level !== 'a1.1' || c.code !== 'A1.1') fail('level/code must be a1.1 / A1.1');
  for (const k of ['examKey', 'examName', 'testSlug']) if (!c[k]) fail(`missing ${k}`);
  for (const k of ['canDo', 'wortliste', 'themen']) if (!c.provenance?.[k]) fail(`missing provenance.${k}`);
  if ((c.checkpoints || []).length !== 4) fail('expected 4 checkpoints');
  (c.checkpoints || []).forEach((cp, i) => {
    if (cp.nr !== i + 1) fail(`checkpoint ${i + 1}: wrong nr`);
    if (cp.afterLektion !== (i + 1) * 3) fail(`checkpoint ${cp.nr}: afterLektion must be ${(i + 1) * 3}`);
    if (!cp.id || !cp.title) fail(`checkpoint ${cp.nr}: missing id/title`);
  });
  const engineMinutes = L.length * 15 + (c.checkpoints || []).length * 12 + L.length * 10;
  const expectedHours = Math.round(engineMinutes / 60 + L.length * 4);
  if (c.hoursTotal !== expectedHours) fail(`hoursTotal ${c.hoursTotal} ≠ ${expectedHours} (12×15 + 4×12 + 12×10 min engine + 4 h linked work per Lektion)`);
  if (c.hoursTotal < 50 || c.hoursTotal > 60) fail(`hoursTotal ${c.hoursTotal} outside the standard's 50–60 h`);

  // ---- RULE 1 (12 Lektionen, ids, slugs) --------------------------------------------------
  if (L.length !== 12) fail(`expected 12 Lektionen, found ${L.length}`);
  const slugs = new Set();
  L.forEach((l, i) => {
    if (l.nr !== i + 1) fail(`Lektion at index ${i}: nr ${l.nr} out of order`);
    const id = `a1.1-l${String(i + 1).padStart(2, '0')}`;
    if (l.id !== id) fail(`Lektion ${l.nr}: id must be ${id}`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(l.slug || '')) fail(`Lektion ${l.nr}: slug "${l.slug}" is not kebab-case`);
    if (slugs.has(l.slug)) fail(`Lektion ${l.nr}: duplicate slug ${l.slug}`);
    slugs.add(l.slug);
    if (!l.title) fail(`Lektion ${l.nr}: missing title`);
    if (l.minutes !== 15) fail(`Lektion ${l.nr}: minutes must be 15`);
  });

  // ---- RULE 2 (situations, can-dos, Handlungsfeld, exam Teile) -----------------------------
  const teileSeen = new Set();
  L.forEach((l, i) => {
    for (const kw of SITUATION_KEYWORDS[i] || []) {
      if (!String(l.situation || '').includes(kw)) fail(`Lektion ${l.nr}: situation must mention "${kw}" (standard §2.2 order)`);
    }
    if (!l.handlungsfeld) fail(`Lektion ${l.nr}: missing handlungsfeld`);
    const cd = l.canDo || [];
    if (cd.length < 3 || cd.length > 5) fail(`Lektion ${l.nr}: ${cd.length} can-do lines, expected 3–5`);
    for (const line of cd) {
      if (!/^Ich kann /.test(line)) fail(`Lektion ${l.nr}: can-do must start with "Ich kann …": ${line}`);
      if (!line.endsWith('.')) fail(`Lektion ${l.nr}: can-do must end with a full stop: ${line}`);
    }
    const teile = l.examTeile || [];
    if (teile.length < 1 || teile.length > 3) fail(`Lektion ${l.nr}: ${teile.length} examTeile, expected 1–3`);
    for (const t of teile) {
      if (!EXAM_TEILE.includes(t)) fail(`Lektion ${l.nr}: unknown exam Teil "${t}"`);
      teileSeen.add(t);
    }
  });
  for (const t of EXAM_TEILE) if (!teileSeen.has(t)) fail(`exam Teil "${t}" is never rehearsed`);

  // ---- RULE 3 (grammar slugs) ---------------------------------------------------------------
  const primaryCount = new Map();
  L.forEach((l) => {
    const gs = l.grammarSlugs || [];
    if (gs.length < 1 || gs.length > 3) fail(`Lektion ${l.nr}: ${gs.length} grammarSlugs, expected 1–3`);
    for (const s of gs) if (!GRAMMAR_SLUGS.includes(s)) fail(`Lektion ${l.nr}: unknown grammar slug "${s}"`);
    if (!gs.includes(l.primarySlug)) fail(`Lektion ${l.nr}: primarySlug "${l.primarySlug}" not in grammarSlugs`);
    primaryCount.set(l.primarySlug, (primaryCount.get(l.primarySlug) || 0) + 1);
  });
  for (const s of GRAMMAR_SLUGS) {
    const n = primaryCount.get(s) || 0;
    if (n !== 1) fail(`grammar slug "${s}" is primary in ${n} Lektionen, expected exactly 1`);
  }
  L.forEach((l, i) => {
    if (l.primarySlug !== PRIMARY_ORDER[i]) fail(`Lektion ${l.nr}: primarySlug "${l.primarySlug}" breaks the taught order (expected "${PRIMARY_ORDER[i]}")`);
  });

  // ---- RULE 4 (Wortfeld) ---------------------------------------------------------------------
  const seenWords = new Map();
  let total = 0;
  let withId = 0;
  L.forEach((l) => {
    const wf = l.wortfeld || [];
    if (wf.length < 15 || wf.length > 25) fail(`Lektion ${l.nr}: ${wf.length} Wortfeld entries, expected 15–25`);
    let added = 0;
    for (const w of wf) {
      total += 1;
      if (!w.de || !w.word || !w.en) fail(`Lektion ${l.nr}: Wortfeld entry missing de/word/en: ${JSON.stringify(w)}`);
      if (w.wordId) withId += 1; else added += 1;
      const startsWithArticle = /^(der|die|das) /.test(w.de || '');
      if (startsWithArticle && !w.article) fail(`Lektion ${l.nr}: "${w.de}" looks like a noun but has no article`);
      if (w.article) {
        if (!['der', 'die', 'das'].includes(w.article)) fail(`Lektion ${l.nr}: "${w.de}" has article "${w.article}"`);
        if (!w.plural) fail(`Lektion ${l.nr}: noun "${w.de}" has no plural (use '—' when there is none)`);
        if (w.de !== `${w.article} ${w.word}`) fail(`Lektion ${l.nr}: "${w.de}" does not read "<Artikel> <Wort>"`);
      }
      if (seenWords.has(w.de)) fail(`"${w.de}" appears in Lektion ${seenWords.get(w.de)} and ${l.nr}`);
      else seenWords.set(w.de, l.nr);
    }
    if (added > 5) fail(`Lektion ${l.nr}: ${added} Wortfeld entries without wordId, at most 5 allowed`);
    if (wf.length && (wf.length - added) / wf.length < 0.7) fail(`Lektion ${l.nr}: only ${wf.length - added}/${wf.length} entries carry a wordId (min 70 %)`);
  });
  if (seenWords.size < 200) fail(`union of all Wortfelder is ${seenWords.size} words, expected ≥ 200`);
  if (total && withId / total < 0.7) fail(`only ${withId}/${total} Wortfeld entries carry a wordId (min 70 %)`);

  // ---- RULE 5 (dialogue) ---------------------------------------------------------------------
  const allowed = new Set([...FUNCTION_WORDS, ...DIALOG_NAMES].map((w) => w.toLowerCase()));
  const known = new Set(allowed);
  L.forEach((l) => {
    for (const w of l.wortfeld || []) for (const f of formsOf(w)) known.add(f);
    const d = l.dialog || {};
    const lines = d.lines || [];
    if (!d.title || !d.setting) fail(`Lektion ${l.nr}: dialog needs title and setting`);
    if (lines.length < 6 || lines.length > 10) fail(`Lektion ${l.nr}: ${lines.length} dialogue lines, expected 6–10`);
    const speakers = new Set(lines.map((x) => x.speaker));
    if (speakers.size !== 2) fail(`Lektion ${l.nr}: dialogue has ${speakers.size} speakers, expected exactly 2`);
    for (const sp of speakers) if (!sp || !/^[A-ZÄÖÜ]/.test(sp)) fail(`Lektion ${l.nr}: speaker "${sp}" is not a name`);
    lines.forEach((line, i) => {
      if (!line.de || !line.en) fail(`Lektion ${l.nr} line ${i}: missing de/en`);
      if (words(line.de).length > 12) fail(`Lektion ${l.nr} line ${i}: ${words(line.de).length} words, max 12`);
      for (const t of tokenise(line.de)) {
        if (!known.has(t.toLowerCase())) fail(`Lektion ${l.nr} line ${i}: "${t}" is neither in a Wortfeld up to here nor a function word`);
      }
    });
    const text = lines.map((x) => x.de).join('\n');
    const re = PRIMARY_PATTERNS[l.primarySlug];
    const hits = re ? (text.match(new RegExp(re.source, re.flags)) || []).length : 0;
    if (hits < 3) fail(`Lektion ${l.nr}: the primary structure (${l.primarySlug}) occurs ${hits}× in the dialogue, expected ≥ 3`);
  });

  // ---- RULE 6 (notice) -------------------------------------------------------------------------
  L.forEach((l) => {
    const n = l.notice || {};
    if (!n.title) fail(`Lektion ${l.nr}: notice needs a title`);
    if (n.ruleSlug !== l.primarySlug) fail(`Lektion ${l.nr}: notice.ruleSlug must be the primarySlug`);
    const len = words(n.bodyDe || '').length;
    if (!len || len > 60) fail(`Lektion ${l.nr}: notice.bodyDe is ${len} words, expected 1–60`);
    if (/[<>#]|\]\(/.test(n.bodyDe || '')) fail(`Lektion ${l.nr}: notice.bodyDe must be plain text with optional **bold**`);
    const dl = (l.dialog?.lines || []).map((x) => x.de);
    if ((n.examples || []).length !== 2) fail(`Lektion ${l.nr}: notice needs exactly 2 examples`);
    for (const ex of n.examples || []) if (!dl.includes(ex)) fail(`Lektion ${l.nr}: notice example "${ex}" is not a verbatim dialogue line`);
  });

  // ---- RULE 7 (the other steps) ----------------------------------------------------------------
  const missions = new Map();
  const listenings = new Map();
  const readings = new Map();
  L.forEach((l) => {
    const p = l.pretest || {};
    if (!p.promptDe || !p.promptEn || !p.model) fail(`Lektion ${l.nr}: pretest needs promptDe, promptEn and model`);
    if (!(p.accepted || []).length) fail(`Lektion ${l.nr}: pretest needs accepted prefixes`);

    const ph = l.phonetik || {};
    if (!ph.focus) fail(`Lektion ${l.nr}: phonetik needs a focus`);
    if ((ph.items || []).length !== 3) fail(`Lektion ${l.nr}: phonetik needs exactly 3 items`);

    const lineCount = (l.dialog?.lines || []).length;
    const h = l.hoeren || {};
    if (h.kind !== 'dictation') fail(`Lektion ${l.nr}: hoeren.kind must be 'dictation'`);
    if ((h.lines || []).length !== 2) fail(`Lektion ${l.nr}: hoeren needs exactly 2 dictation lines`);
    if (new Set(h.lines || []).size !== (h.lines || []).length) fail(`Lektion ${l.nr}: hoeren lines must differ`);
    for (const i of h.lines || []) if (!Number.isInteger(i) || i < 0 || i >= lineCount) fail(`Lektion ${l.nr}: hoeren line index ${i} out of range`);

    const s = l.sprechen || {};
    if ((s.readAloud || []).length !== 2) fail(`Lektion ${l.nr}: sprechen needs exactly 2 readAloud lines`);
    if (new Set(s.readAloud || []).size !== (s.readAloud || []).length) fail(`Lektion ${l.nr}: readAloud lines must differ`);
    for (const i of s.readAloud || []) if (!Number.isInteger(i) || i < 0 || i >= lineCount) fail(`Lektion ${l.nr}: readAloud index ${i} out of range`);
    const open = s.open || {};
    if (!EXAM_TEILE.includes(open.teil) || !open.teil.startsWith('Sprechen')) fail(`Lektion ${l.nr}: sprechen.open.teil must be a Sprechen Teil`);
    if (!(l.examTeile || []).includes(open.teil)) fail(`Lektion ${l.nr}: sprechen.open.teil "${open.teil}" is not in examTeile`);
    if (!open.promptDe) fail(`Lektion ${l.nr}: sprechen.open needs a promptDe`);
    if ((open.hintWords || []).length !== 3) fail(`Lektion ${l.nr}: sprechen.open needs exactly 3 hintWords`);
    if (open.missionOrder !== null) {
      if (!Number.isInteger(open.missionOrder) || open.missionOrder < 1 || open.missionOrder > 8) fail(`Lektion ${l.nr}: missionOrder ${open.missionOrder} is not a published A1.1 mission (1–8) or null`);
      if (missions.has(open.missionOrder)) fail(`speaking mission ${open.missionOrder} is linked from Lektion ${missions.get(open.missionOrder)} and ${l.nr}`);
      missions.set(open.missionOrder, l.nr);
    }

    const w = l.schreiben || {};
    const expectedKind = l.nr % 2 === 1 ? 'formular' : 'mitteilung';
    if (w.kind !== expectedKind) fail(`Lektion ${l.nr}: schreiben.kind must alternate (expected ${expectedKind})`);
    if (!w.taskDe) fail(`Lektion ${l.nr}: schreiben needs a taskDe`);
    // One word range per Textsorte, not one constant: a filled five-field Formular is ~10 words and
    // a complete SD1 Teil 2 Mitteilung (Anrede + 3 Leitpunkte + Gruß) is 35–40, which the old
    // maxWords 30 cut off. netlify/functions/evaluate-writing.mjs derives its floor from the same
    // register, so the two halves move together (DaF review #2, §B).
    const range = w.kind === 'formular' ? [5, 40] : [25, 45];
    if (w.minWords !== range[0] || w.maxWords !== range[1]) fail(`Lektion ${l.nr}: schreiben word range ${w.minWords}–${w.maxWords}, expected ${range[0]}–${range[1]} for a ${w.kind}`);
    if (words(w.sample || '').length > 30) fail(`Lektion ${l.nr}: schreiben.sample is longer than 30 words`);
    // The Schreiben task is graded by netlify/functions/evaluate-writing.mjs, which
    // looks the prompt up in the task bank by exam_key + task_key and never trusts
    // client text. So a taskKey that does not resolve — or resolves to a task whose
    // register/Leitpunkte disagree with this Lektion — means the learner would be
    // graded against a different exercise than the screen shows them.
    if (!w.taskKey) fail(`Lektion ${l.nr}: schreiben needs a taskKey into the writing task bank`);
    const bank = w.taskKey ? writingTaskByKey('goethe_a1', w.taskKey) : null;
    if (w.taskKey && !bank) fail(`Lektion ${l.nr}: schreiben.taskKey "${w.taskKey}" resolves to no goethe_a1 task`);
    if (bank) {
      if (bank.course !== 'a1.1') fail(`Lektion ${l.nr}: bank task ${w.taskKey} is not marked course:'a1.1'`);
      if (bank.task !== w.taskDe) fail(`Lektion ${l.nr}: bank task ${w.taskKey} states a different task than taskDe`);
      if (bank.maxWords !== w.maxWords || bank.minWords !== w.minWords) fail(`Lektion ${l.nr}: bank task ${w.taskKey} has a different word range`);
      const expectedRegister = w.kind === 'formular' ? 'formular' : ['informell', 'formell'];
      const okRegister = Array.isArray(expectedRegister) ? expectedRegister.includes(bank.register) : bank.register === expectedRegister;
      if (!okRegister) fail(`Lektion ${l.nr}: bank task ${w.taskKey} has register "${bank.register}", which does not fit a ${w.kind}`);
      const points = w.kind === 'formular' ? (w.fields || []) : (w.leitpunkte || []);
      if ((bank.leitpunkte || []).join('|') !== points.join('|')) fail(`Lektion ${l.nr}: bank task ${w.taskKey} lists different Leitpunkte than the Lektion`);
    }
    if (w.kind === 'formular') {
      const f = w.fields || [];
      if (f.length < 3 || f.length > 5) fail(`Lektion ${l.nr}: formular has ${f.length} fields, expected 3–5`);
      if (w.leitpunkte) fail(`Lektion ${l.nr}: a formular has no leitpunkte`);
    } else {
      if ((w.leitpunkte || []).length !== 3) fail(`Lektion ${l.nr}: mitteilung needs exactly 3 leitpunkte`);
      if (w.fields) fail(`Lektion ${l.nr}: a mitteilung has no fields`);
      if (!/^(Hallo|Guten|Liebe|Lieber|Sehr)/.test(w.sample || '')) fail(`Lektion ${l.nr}: mitteilung sample needs an Anrede`);
      if (!/(Grüße|Gruß|Tschüss|Bis bald|Bis morgen|Bis später)[^.]*$/.test(w.sample || '')) fail(`Lektion ${l.nr}: mitteilung sample needs a Gruß`);
    }

    const li = l.links || {};
    if (!('listeningExercise' in li) || !('readingOrder' in li)) fail(`Lektion ${l.nr}: links needs listeningExercise and readingOrder`);
    if (li.listeningExercise !== null) {
      if (!Number.isInteger(li.listeningExercise) || li.listeningExercise < 1 || li.listeningExercise > 6) fail(`Lektion ${l.nr}: listeningExercise ${li.listeningExercise} is not an existing A1.1 exercise (1–6)`);
      if (listenings.has(li.listeningExercise)) fail(`listening exercise ${li.listeningExercise} is linked from Lektion ${listenings.get(li.listeningExercise)} and ${l.nr}`);
      listenings.set(li.listeningExercise, l.nr);
    }
    if (li.readingOrder !== null) {
      if (!Number.isInteger(li.readingOrder) || li.readingOrder < 1 || li.readingOrder > 10) fail(`Lektion ${l.nr}: readingOrder ${li.readingOrder} is not an existing A1.1 reading lesson (1–10)`);
      if (readings.has(li.readingOrder)) fail(`reading lesson ${li.readingOrder} is linked from Lektion ${readings.get(li.readingOrder)} and ${l.nr}`);
      readings.set(li.readingOrder, l.nr);
    }

    const pr = l.practiceRule || {};
    if (!(pr.topics || []).length) fail(`Lektion ${l.nr}: practiceRule needs topics`);
    for (const t of pr.topics || []) if (!(l.grammarSlugs || []).includes(t)) fail(`Lektion ${l.nr}: practiceRule topic "${t}" is not in grammarSlugs`);
    if (!(pr.typedMin >= 3)) fail(`Lektion ${l.nr}: practiceRule.typedMin must be ≥ 3`);
  });

  // ---- RULE 9 (German only, no promises, no fees) ------------------------------------------------
  const ENGLISH = /\b(the|you|your|and|with|please|this|that|what|when|from|about|hello|thank)\b/i;
  const PROMISE = /\b(garantie\w*|garantiert|bestehst du|Sie bestehen|Erfolgsgarantie|100\s?%)/i;
  const FEE = /\b(Prüfungsgebühr|Gebühr|Anmeldegebühr)\b/i;
  const germanFields = (l) => [
    l.title, l.situation, l.handlungsfeld, ...(l.canDo || []),
    l.notice?.title, l.notice?.bodyDe, ...(l.notice?.examples || []),
    l.dialog?.title, l.dialog?.setting, ...(l.dialog?.lines || []).map((x) => x.de),
    l.pretest?.promptDe, l.pretest?.model, l.phonetik?.focus,
    l.sprechen?.open?.promptDe, ...(l.sprechen?.open?.hintWords || []),
    l.schreiben?.taskDe, l.schreiben?.sample, ...(l.schreiben?.fields || []), ...(l.schreiben?.leitpunkte || []),
  ].filter(Boolean);
  L.forEach((l) => {
    for (const s of germanFields(l)) {
      if (ENGLISH.test(s)) fail(`Lektion ${l.nr}: English in a German field: "${s}"`);
      if (PROMISE.test(s)) fail(`Lektion ${l.nr}: outcome promise: "${s}"`);
      if (FEE.test(s)) fail(`Lektion ${l.nr}: exam fee reference: "${s}"`);
    }
  });

  // ---- RULE 10 (Wortfeld coverage) and RULE 11 (hand-written item lexis) ------------------------
  const uncovered = wortfeldCoverage(c, extraItems);
  if (uncovered.length > MAX_UNCOVERED_WORTFELD) {
    fail(`RULE 10: ${uncovered.length} Wortfeld entries occur in no input of their Lektion, ratchet is ${MAX_UNCOVERED_WORTFELD} — ${uncovered.map((u) => `L${u.nr} ${u.de}`).join(', ')}`);
  }
  const untaught = itemLexis(c, extraItems);
  if (untaught.length > MAX_UNTAUGHT_ITEM_TOKENS) {
    fail(`RULE 11: ${untaught.length} untaught tokens in hand-written items, ratchet is ${MAX_UNTAUGHT_ITEM_TOKENS} — ${untaught.map((o) => `${o.id}:${o.token}`).join(', ')}`);
  }

  return errors;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  const errors = validateCurriculum(CURRICULUM_A11);
  const wf = CURRICULUM_A11.lektionen.flatMap((l) => l.wortfeld);
  const withId = wf.filter((w) => w.wordId).length;
  // The two ratchets print on every run, pass or fail: a number nobody sees is a number that
  // silently climbs back (DaF review #3, „der Validator läuft über Dialoge, nicht über Items“).
  const mark = errors.length ? '·' : '✓';
  console.log(`${mark} ${CURRICULUM_A11.code}: 12 Lektionen, ${wf.length} Wortfeld-Einträge (${withId} mit wordId, ${Math.round((100 * withId) / wf.length)} %), ${CURRICULUM_A11.hoursTotal} h`);
  const uncovered = wortfeldCoverage(CURRICULUM_A11);
  console.log(`  RULE 10 Wortfeld-Deckung: ${uncovered.length} ungenutzt von ${wf.length} (Ratchet ${MAX_UNCOVERED_WORTFELD})`);
  for (const u of uncovered) console.log(`    L${u.nr} ${u.de}`);
  const untaught = itemLexis(CURRICULUM_A11);
  console.log(`  RULE 11 Item-Lexik: ${untaught.length} ungelehrte Tokens (Ratchet ${MAX_UNTAUGHT_ITEM_TOKENS})`);
  for (const o of untaught) console.log(`    ${o.id}: ${o.token}`);
  if (errors.length) {
    console.error(`✗ ${CURRICULUM_A11.code}: ${errors.length} problem(s)`);
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
}
