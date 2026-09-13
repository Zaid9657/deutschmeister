#!/usr/bin/env node
// Validator for the situational curricula (docs/course-factory/a11-rebuild/CONTRACT.md).
//
// The curriculum module is the single source for the lesson player, the checkpoint builder and
// the public syllabus page, so a mistake in it is a mistake on a page a buyer reads before paying.
// This script is the gate: it re-derives every structural rule of the contract from the data and
// exits non-zero on the first failure. `tests/curricula.test.mjs` pins the same rules.
//
//   node scripts/validate-curriculum.mjs [level]      # level defaults to a1.1
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
// their own Lektion), RULE 11 runs RULE 5's own machinery over the practice items the learner is
// actually served — since DaF review #5 that is the BUILT pool (src/data/lessonPools/<level>.json),
// not only the hand-written half. Both are ratchets, not hard gates, because the debt is older than
// this round; they may only ever be lowered.
//
// RULE 11b is DaF review #6 (2026-09-12), MAJOR 5. RULE 11 assigns a generated item to the EARLIEST
// Lektion whose `practiceRule` names its topic, which is neither where the item is drawn nor
// anything a repair round can move — „was er an der falschen Stelle liest, kann nicht repariert
// werden“. RULE 11b runs the same token machinery over the REAL draw: `planPractice()` attempts 1
// and 2 plus the pool items `buildCheckpoint()` pulls into a checkpoint, each item judged at the
// earliest Lektion that serves it. RULE 11 stays as the informational number over the whole pool;
// RULE 11b is the list a repair round works from, and it prints (Lektion, id, token).
//
// RULE 6b, RULE 15 and RULE 16 are DaF review #1 for A1.2 (2026-09-13), BLOCKER 2-4. RULE 6b asks
// the Notice card to teach only what its own Lektion shows („die Karte darf nur lehren, was die
// Lektion zeigt“): every whole word the card bolds must occur in the Lektion's input. RULE 15 reads
// the two steps in which the learner PRODUCES the line — the dictation and the read-aloud — and
// reports every grammatical form in them that the course only teaches in a LATER Lektion. RULE 16
// holds the public 12x6 grid's sixth column to its own promise: an „Hören Teil n“ claim needs a
// linked listening exercise, „Lesen Teil n“ a linked reading lesson, „Sprechen Teil 1“ a
// self-introduction, and the two Schreiben Teile the Textsorte they name. All three are ratchets
// per level, measured — A1.1 was measured before they were switched on and carries its own numbers
// rather than being broken by a rule written for A1.2.
//
// RULE 14 (DaF review #5, MAJOR 12) is not a ratchet: it compares the facts of the recurring
// characters — Familienstand, Herkunft, Beruf, Sprachen — between the dialogue and the Schreiben
// task of the same Lektion against the small PERSONAS table of the level, and fails hard. The
// finding it closes: L3 got „Mein Mann und ich kommen aus Marokko“ pushed into a dialogue line to
// satisfy the RULE 10 ratchet, while the Formular of the same Lektion lists Ana as **ledig**.

import { readFileSync } from 'node:fs';

import { CURRICULUM_A11, FUNCTION_WORDS, DIALOG_NAMES } from '../src/data/curricula/a11.js';
import {
  CURRICULUM_A12,
  FUNCTION_WORDS as FUNCTION_WORDS_A12,
  DIALOG_NAMES as DIALOG_NAMES_A12,
} from '../src/data/curricula/a12.js';
import { deferredConstructionHits } from '../src/data/curricula/constructions.js';
import { writingTaskByKey } from '../src/data/writingTasks.js';
// RULE 17 grades the Beispieltexte with the SAME function the learner's screen grades him with —
// `scoreWriting` is what `GradedWriting.jsx` calls, and the word window it measures against comes
// from the server's own task bank above, never from a number retyped here.
import { scoreWriting, countWords, leitpunktSatisfied, leitpunktEvidence, foldWord } from '../src/lib/lesson/writing.js';
// RULE 11b reads the two engines the learner actually meets. Both are plain ES modules with no DOM
// import (buildLesson pulls in the pool quality rules, buildCheckpoint the answer checker and the
// writing tasks), so the validator can run the real draw under `node` instead of re-implementing it.
import { planPractice } from '../src/lib/lesson/buildLesson.js';
import { buildCheckpoint } from '../src/lib/checkpoint/buildCheckpoint.js';

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
const PRIMARY_PATTERNS_A11 = {
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

// A1.2 — how "the primary structure occurs >= 3 times" is counted, per topic. Same contract as
// PRIMARY_PATTERNS_A11: one regex per slug, run over the Lektion's dialogue.
const PRIMARY_PATTERNS_A12 = {
  // Verb an Position 2, sichtbar an der Inversion nach einer vorangestellten Angabe.
  'basic-sentence-structure': /\b(?:Dann|Danach|Zuerst|Jetzt|Heute|Morgen|Hier|Dort|Da)\s+(?:geh|fahr|komm|ist|sind|steh|nehm|bin|hab|wart|bezahl|kauf|schlaf)\w*/gi,
  // Zahlen ab 20, Ziffern und Ordnungszahlen.
  'numbers-counting': /\b\d+\b|\b(?:zwanzig|drei(?:ß|ss)ig|vierzig|f(?:ü|ue)nfzig|sechzig|siebzig|achtzig|neunzig|hundert|tausend)\w*|\b(?:erste|zweite|dritte|vierte|f(?:ü|ue)nfte|sechste|siebte|achte|neunte|zehnte)\w*/gi,
  // Akkusativmarker: maskuline Formen und die Personalpronomen im Akkusativ.
  'accusative-intro': /\b(?:einen|den|keinen|meinen|deinen|seinen|ihren|ihn|mich|dich|uns|euch)\b/gi,
  'negation': /\b(?:nicht|kein|keine|keinen|keinem|keiner|nichts|nie)\b/gi,
  'question-words': /\b(?:wer|was|wo|wann|warum|wie|wohin|woher|welche|welcher|welches|wen|wem)\b/gi,
  // Nur die Formen MIT Vokalwechsel zählen — die Sie-Form zeigt ihn nicht.
  'stem-changing-verbs': /\b(?:nimmt|nimmst|nimm|hilft|hilfst|hilf|isst|iss|schl(?:ä|ae)ft|schl(?:ä|ae)fst|spricht|sprichst|sprich|f(?:ä|ae)hrt|f(?:ä|ae)hrst|sieht|siehst|liest|gibt|gibst|tr(?:ä|ae)gt|l(?:ä|ae)uft)\b/gi,
  // Frage nach dem Subjekt und die Gleichsetzung mit sein.
  'nominative-case': /\bwer\b|\bdas\s+ist\b|\bdas\s+sind\b/gi,
  // Imperativformen, die der Kurs benutzt (Sie-Form und du-Form).
  'imperative': /\b(?:Komm|Warte|Hilf|Mach|Hol|Geh|Nimm|Sei|Gib|Kauf|Frag|Schreib|Lies|Steh|Zieh)\b/g,
  'modal-verbs-intro': /\b(?:kann|kannst|k(?:ö|oe)nnen|k(?:ö|oe)nnt|muss|musst|m(?:ü|ue)ssen|m(?:ü|ue)sst|darf|darfst|d(?:ü|ue)rfen|d(?:ü|ue)rft|will|willst|wollen|wollt|soll|sollst|sollen|sollt|m(?:ö|oe)chte|m(?:ö|oe)chtest|m(?:ö|oe)chten)\b/gi,
  'prepositions-accusative': /\b(?:f(?:ü|ue)r|ohne|gegen|um|durch)\s+(?:den|einen|die|eine|das|ein|meinen|meine|mein|deinen|deine|dein|ihren|ihre|seinen|seine|mich|dich|uns)\b/gi,
  'dative-prepositions-intro': /\b(?:im|am|beim|zum|zur|vom)\b|\b(?:mit|nach|bei|seit|von|zu|aus)\s+(?:dem|der|den|einem|einer|mir|dir|ihm|ihr|uns|Ihnen|meinem|meiner)\b/gi,
  'perfekt-intro': /\bge[a-zäöüß]+(?:t|en)\b/gi,
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

/**
 * Stem changes and fixed forms the A1.2 dialogues need on top of IRREGULAR_FORMS. Kept per level
 * rather than merged into the base table, because widening the base table would ALSO widen what
 * A1.1's RULE 5 and RULE 10 accept — and A1.1's four ratchet numbers are measurements, not
 * preferences. `formsOf()` takes the table as an argument, so A1.1 keeps the base table exactly.
 */
const IRREGULAR_FORMS_A12 = {
  nehmen: ['nehme', 'nimmst', 'nimmt', 'nehmen', 'nehmt', 'nimm', 'genommen'],
  helfen: ['helfe', 'hilfst', 'hilft', 'helfen', 'helft', 'hilf', 'geholfen'],
  sehen: ['sehe', 'siehst', 'sieht', 'sehen', 'seht', 'sieh', 'gesehen'],
  fernsehen: ['sehe', 'siehst', 'sieht', 'sehen', 'seht', 'fern', 'ferngesehen'],
  tragen: ['trage', 'trägst', 'trägt', 'tragen', 'tragt', 'trag', 'getragen'],
  laufen: ['laufe', 'läufst', 'läuft', 'laufen', 'lauft', 'lauf', 'gelaufen'],
  fliegen: ['fliege', 'fliegst', 'fliegt', 'fliegen', 'flieg', 'geflogen'],
  trinken: ['trinke', 'trinkst', 'trinkt', 'trinken', 'trink', 'getrunken'],
  abfahren: ['fahre', 'fährst', 'fährt', 'fahren', 'fahrt', 'ab', 'abgefahren'],
  anziehen: ['ziehe', 'ziehst', 'zieht', 'ziehen', 'zieh', 'an', 'angezogen'],
  wehtun: ['tue', 'tut', 'tun', 'weh', 'wehgetan'],
  // Ordnungszahlen dekliniert (formsOf() hängt Endungen an den ganzen Eintrag, nicht an den Stamm).
  erste: ['erste', 'ersten', 'erster', 'erstes', 'erstem'],
  dritte: ['dritte', 'dritten', 'dritter', 'drittes', 'drittem'],
  // Einschub-e: regnen → es regnet (verbForms() bildet nur regne/regnst/regnt).
  regnen: ['regne', 'regnest', 'regnet', 'regnen', 'geregnet'],
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
export function formsOf(entry, irregulars = IRREGULAR_FORMS) {
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
  for (const [inf, list] of Object.entries(irregulars)) {
    if (inf === head || inf === entry.de) for (const f of list) forms.add(f.toLowerCase());
  }
  return forms;
}

/**
 * RULE 10 ratchet — how many Wortfeld entries may still occur in NO input of their own Lektion,
 * counted across all twelve. DaF review #3 measured ≈50 of 262 before this round; the L2 Schreiben
 * rewrite, the L8 Samstag/Sonntag line and the four new L9 café lines closed the densest clusters.
 * This number may be lowered, never raised (the contract's ceiling is 30). Round 5 measured it
 * against the BUILT pool (see loadPoolItems) and exempted the two meta entries, then closed the L3
 * Familie and L6 Beruf clusters DaF review #4 named: 35 → 19, and 18 when re-measured 2026-09-13.
 * DaF review #8, MAJOR 4: the ratchet had drifted above the printed measurement (14, after L12's
 * `readAloud`/item repairs took two more Wortfeld entries into use). Re-measured 2026-09-13: **14**,
 * and the ratchet moves with it — `node scripts/validate-curriculum.mjs a1.1` is the source of truth
 * from here on, not this comment.
 */
export const MAX_UNCOVERED_WORTFELD = 14;          // a1.1; per level in LEVELS below — measured 2026-09-13

/**
 * RULE 12 — every can-do line is rehearsed somewhere in its own Lektion. Was a ratchet through DaF
 * reviews #4–#7 (35 → 19 → 4 → 2, tightening as L1 begrüßen/verabschieden and the L4 Gegenstand
 * question — the last two offenders — got read-aloud/hören lines that produce them). DaF review #8
 * measured **0** and named the reappearance risk directly: with a ratchet still standing at 2, two
 * can-do lines could go unrehearsed again with CI silent about it — which is exactly what happened
 * to L12's farewell can-do between rounds 7 and 8 before its `readAloud` line closed it. So, like
 * RULE 14 and RULE 16, this is now a HARD RULE with no ratchet: any can-do line no exercise slot of
 * its own Lektion rehearses is a failure, full stop. There is no `MAX_UNREHEARSED_CANDOS` constant
 * and no `ratchets.unrehearsedCanDos` entry to raise back up.
 */

/**
 * RULE 13 ratchet — how many Lektionen may show a `sprechen.open` task whose prompt the speaking
 * page never receives. `SpeakingStage.jsx` appends `&mission=` only when `missionOrder` is set, so
 * a null mission sends the learner to the generic /speaking page with some other mission of the
 * level. Four Lektionen (7, 10, 11, 12) are in that state; the UI agent is making the prompt itself
 * travel with `saveCourseContext`, and when it does this ratchet goes to 0 (DaF review #4, MAJOR 4).
 */
export const MAX_MISSIONLESS_LEKTIONEN = 4;        // a1.1; per level in LEVELS below

/**
 * RULE 11 ratchet — how many (item, token) pairs in the pool the learner is served may still use a
 * word the course has not taught by that item's Lektion.
 *
 * It stood at 9 while the rule read `a11.extra.json` only, i.e. 124 of 351 items; DaF review #5
 * (MAJOR 5) measured 21 untaught tokens in the *drawn* generated items alone and asked for the rule
 * to read the built pool. It now does, and over the whole pool the number is **187** — the legacy
 * generated bank, word for word: `Honig` (L4), `Freiheit`, `Instrument`, `Kaffee` in L4 (Wortfeld of
 * L9), `Deutschkurs` (L8), `interessant` (L5), `arbeitet` in L7 (Wortfeld of L11), plus a long tail
 * of `nett`/`müde`/`kaputt`/`Auto`/`Mädchen` that no Lektion of A1.1 teaches. That is the honest
 * number and it is meant to look bad: nine described an eighth of the course. Lower it as the bank
 * is rewritten, never raise it.
 *
 * 2026-09-13: **187 → 61**, because the class underneath it was closed at BUILD time rather than
 * item by item. `levelLexicon()` + `untaughtTokens()` are now the gate in
 * `scripts/build-lesson-pool.mjs`: a legacy bank item carrying a word the course teaches NOWHERE —
 * `Honig`, `König`, `Instrument`, `Freiheit`, `Zeitung`, `Tom`, `Anna` — is dropped before the
 * merge (78 items at A1.1, 91 at A1.2). What is LEFT here is the repairable half by construction:
 * every remaining token is taught, only LATER than the Lektion the item is filed under, i.e. a
 * Vorgriff a repair round can move.
 *
 * 2026-09-13, round 10: **61 → 55**. `ITEM_FORMULA_RE` gained „Welche Schreibweise ist richtig“,
 * the whole task line of the generated spelling-choice items — `Schreibweise` and `richtig` were
 * being counted as item lexis in every one of them, which is the formula talking and not the item.
 * (It is the same class as the four A1.2 formulas added a day earlier; without the entry those
 * items could never be served at any Lektion under the new `minLektion` stamp.)
 *
 * 2026-09-13, round 10 (worker R10-F): **55 → 49**. The six hand-written items the build could
 * never serve (`minLektion: null`, because the course teaches none of `liegt`, `offen`, `klein`,
 * `Januar`, `richtig`) were reworded onto their own Lektion's Wortfeld rather than deleted, and
 * each untaught token they carried left RULE 11's count with them.
 *
 * 2026-09-13, round 11 (worker R11-B): **49 → 63, and the yardstick moved, not the material**.
 * DaF review #10, MAJOR 3: the lexicon used to seed all 159 FUNCTION_WORDS at Lektion 1, so every
 * case-inflected determiner and every preposition counted as taught before the course had said a
 * word. `taughtUpTo` now binds a function word to the Lektion that first SAYS it (see
 * `functionWordsUsedIn`), and the 14 pairs that appear are exactly the function words that licence
 * used to hide, none of them new text:
 *   `mit` ×4 (0eb1a415, 32eb463d, 74f91cf4, 92ac55de, cbee2a2c — L1/L2 items, `mit` is first said
 *   in L3), `die` ×2 (74f91cf4, 92ac55de at L1, first said in L2), `habe` ×3 (404c4a60, bb5c0422,
 *   extra-a11-l06-06 at L6, first said in L8), `am` (extra-a11-l01-09), `zu` (extra-a11-l01-10),
 *   `hat` (extra-a11-l02-12) and `dich` (extra-a11-l06-06).
 * RULE 11 assigns a generated item to the EARLIEST Lektion whose `practiceRule` names its topic,
 * which is not where the item is served — that is RULE 11b, and it is **0 by construction**,
 * because `minLektion` is stamped from this same narrowed lexicon and the draw obeys it. So this
 * number went up because the measurement got honest; the number the learner feels did not move.
 *
 * Round 11 (2026-09-13): re-measured after both slices landed — 62. Round 12: 59 after the
 * unconditioned-rule exclusion removed eleven cache items. Function words are
 * bound to first use now, so the count is what the licence used to hide.
 */
export const MAX_UNTAUGHT_ITEM_TOKENS = 59;        // a1.1; per level in LEVELS below — measured 2026-09-13

/**
 * RULE 11b ratchet — how many (item, token) pairs the learner MEETS may still use a word the course
 * has not taught by the Lektion that serves them.
 *
 * DaF review #6, MAJOR 5: RULE 11 reads the whole pool and assigns each generated item to the
 * earliest Lektion whose `practiceRule` names its topic, so its 187 is „eine Zahl, die niemand
 * reparieren kann“ — 147 of those tokens sit in items no draw ever reaches, and two of the rest are
 * pure measurement artefacts (`Formular` charged to L1 although the item is only drawn in L2, where
 * `das Formular` is in the Wortfeld). This rule measures the same tokens at the Lektion where the
 * item is DRAWN — `planPractice()` attempts 1 and 2, plus the pool items `buildCheckpoint()` pulls
 * into a checkpoint, which the learner meets at `checkpoint.afterLektion`. Every offender on this
 * list is a screen a learner reads, so the list is printed with (Lektion, id, token) and the ratchet
 * is the repair target. It may be lowered, never raised.
 *
 * Measured on A1.1 after the round-6 item repairs: 16 of RULE 11's 187, in 12 items across L1, L3,
 * L4, L5, L6 and L7 — all generated, none hand-written.
 *
 * 2026-09-13, after the build-time untaught-lexis gate (see MAX_UNTAUGHT_ITEM_TOKENS): **16 → 5**,
 * in three generated items — `Deutsch` in two L1 spelling items (taught L3), `Kaffee`/`kocht` in an
 * L4 item (Wortfeld of L9) and `arbeitet` in an L6 item (Wortfeld of L11). All five are Vorgriffe,
 * which is the only class this number can still contain now that never-taught words cannot ship.
 * DaF review #8, MAJOR 4: the ratchet had drifted above the printed measurement (4, one `Deutsch`
 * spelling item having been repaired since). Re-measured 2026-09-13: **4**, and the ratchet moves
 * with it — read it off `node scripts/validate-curriculum.mjs a1.1`, not off this comment.
 *
 * 2026-09-13, round 10: **4 → 0, and RULE 11b is now a HARD RULE at A1.1 with no ratchet at all.**
 * Commit 217c958 made the draw fresh per attempt and the list grew straight back to 13 pairs — nine
 * cache items drawn one to five Lektionen too early. That is the proof the number could never be
 * repaired item by item: the items are sound, the LEKTION was wrong, and any change to the draw
 * re-rolls the list. So the question is answered at BUILD time instead: every pool item carries
 * `minLektion` (see `minLektionIndex` below), the first Lektion by which the course has taught all
 * of its words, and `pickPracticeItems` will not consider an item above the Lektion it draws for.
 * The rule is 0 BY CONSTRUCTION, which is why it has no ratchet here — a non-zero reading now means
 * the stamp and the filter have come apart, not that a repair round is owed.
 *
 * A1.2 keeps a ratchet (its row in LEVELS): the level is PAUSED and its pool carries no stamp yet,
 * so the filter is a no-op there by design — an unstamped item is never filtered.
 */
export const MAX_UNTAUGHT_DRAWN_TOKENS = 0;        // a1.1 — hard rule since round 10, see above

/**
 * A1.2 — the twelve grammar slugs of the level in `topic_order` (grammar-content-cache.json,
 * sub_level A1.2, 287 exercises).
 */
export const GRAMMAR_SLUGS_A12 = [
  'basic-sentence-structure', 'nominative-case', 'accusative-intro', 'numbers-counting',
  'question-words', 'negation', 'modal-verbs-intro', 'prepositions-accusative',
  'stem-changing-verbs', 'imperative', 'perfekt-intro', 'dative-prepositions-intro',
];

/** A1.2 — the 12 situations of the standard (§2.2, A1.2 row), in order. */
export const SITUATION_KEYWORDS_A12 = [
  ['Wegbeschreibung'],
  ['Wohnen', 'Wohnungsanzeigen'],
  ['Stadt'],
  ['Hotel', 'Termine', 'Reklamation'],
  ['Pläne', 'Wünsche'],
  ['Gesundheit', 'Körper', 'Arzt'],
  ['Aussehen', 'Charakter'],
  ['Haushalt'],
  ['Regeln', 'Verkehr', 'Umwelt'],
  ['Kleidung', 'Vergleiche'],
  ['Wetter'],
  ['Feste', 'Feiern'],
];

/** A1.2 — order of `primarySlug` across the 12 Lektionen; the reasoning is in a12.js's header. */
export const PRIMARY_ORDER_A12 = [
  'basic-sentence-structure', 'numbers-counting', 'accusative-intro', 'negation',
  'question-words', 'stem-changing-verbs', 'nominative-case', 'imperative',
  'modal-verbs-intro', 'prepositions-accusative', 'dative-prepositions-intro', 'perfekt-intro',
];

/**
 * RULE 6b ratchet — how many whole words a level's Notice cards may still bold without showing
 * them anywhere in the input of their own Lektion. DaF review #1 for A1.2 (BLOCKER 2): RULE 6 only
 * checks that the two `examples` are verbatim dialogue lines, never that the FORM the card teaches
 * occurs at all — so L3 could be titled „Der Akkusativ: den, einen, keinen“ while `den` appears in
 * none of its ten lines. Measured on A1.1 the day the rule was written: 26.
 */
// 26 → **23** on 2026-09-13 (round 13): the six rewritten Beispieltexte are Lektion input too,
// and three forms their Notice cards bold now have a Beleg in their own Lektion.
export const MAX_UNEXEMPLIFIED_NOTICE_FORMS = 23;  // a1.1; per level in LEVELS below — measured 2026-09-13

/**
 * RULE 15 ratchet — how many grammatical forms a level's PRODUCTION lines may still use before the
 * Lektion that teaches them. DaF review #1 for A1.2 (BLOCKER 3): the dictation and the read-aloud
 * are the two steps in which the learner types or speaks the line himself, and that is exactly
 * where the Vorgriffe sat („mit dem Koffer“ two Lektionen before the Dativ). Measured on A1.1: 12.
 *
 * 12 → **3** on 2026-09-13 (round 12), and not by a softer number: RULE 15b below took the same
 * three windows that carried nine of the twelve (A1.1 L3 dictation and read-aloud, L7 dictation,
 * L8 read-aloud) to dialogue lines that carry no deferred construction, and the form-level
 * Vorgriffe those lines carried went with them. What is left is three and it is argued: „um eins“
 * in L6 (`time-and-dates`, L8) and `Hast`/`habe` in L8 (`verb-haben`, L9) — both in windows whose
 * dialogue has no alternative line free of them, i.e. a content repair, not a window move.
 */
export const MAX_UNTAUGHT_IN_PRODUCTION = 3;       // a1.1; per level in LEVELS below — measured 2026-09-13

/**
 * RULE 15b ratchet — how many DEFERRED CONSTRUCTIONS a level still puts in the learner's own mouth.
 *
 * DaF review #11, MAJOR 3. RULE 15 above measures FORMS: a word the learner has not met. A course
 * also defers CONSTRUCTIONS — patterns every word of which is ordinary — and round 11 built a guard
 * for exactly three of them (`src/data/curricula/constructions.js`) and bound it to the RULE CARDS
 * only. The result was measurable: the same round deleted „Meine Schwester ist noch jung.“ from the
 * A1.1 L3 card because the possessive article is Lektion 12, and left the identical sentence
 * standing as L3's DICTATION line, where `checkAnswer` grades it letter by letter. A sentence
 * cannot be too hard to READ and easy enough to TYPE.
 *
 * So the card guard and this rule read ONE module, and the introducing Lektion is read from the
 * curriculum's own `primarySlug`, never typed. Measured before the fix: **12** hits — the eight
 * dictation/read-aloud places the review lists (L3 dictation line 3, L3 read-aloud lines 1 and 6,
 * L7 dictation line 2, L8 read-aloud line 1; line 1 of L3 carries four of them), plus L3's pretest
 * model and the Schreiben model texts of L2, L4 and L6. All twelve closed 2026-09-13 (round 12) by moving the windows to dialogue lines without
 * the construction and by rewriting the four model texts; the dialogues themselves are untouched —
 * they may SAY the forms (CONTRACT §2), and they are the audio script the owner records.
 *
 * Hard 0 on the LEKTION surfaces, therefore, and it may only ever be closed the same way.
 *
 * 0 → **1** on 2026-09-13 (round 14, DaF review #13 MAJOR 3), and the number is not a regression:
 * the rule now also reads what it never read, the CHECKPOINTS. Two things changed under it.
 * `separable-verbs-intro` stopped being a fourteen-stem list and became a structural test (a
 * sentence-final prefix from the closed prefix class, preceded by a finite-verb-shaped token that
 * is not a form of `sein`), and `adjective-declension` was added as a pattern A1.1 teaches in NO
 * Lektion. On the Lektion surfaces that measured two new hits and both are repaired (L2's
 * read-aloud window moved 2 → 4; the L8 Beispieltext lost „Ein neuer Termin … der neue Tag“).
 *
 * WHAT THE 1 IS, measured item by item over all four built checkpoints: `a1.1-cp1-hoeren-3`
 * dictates „Bitte füllen Sie das Formular aus.“ — the Satzklammer of Lektion 11, typed after
 * Lektion 3. The review assumed the checkpoint draws its dictations from the Lektion's own
 * `hoeren`/`readAloud` windows; MEASURED, it does not — `buildHoeren` draws from ALL dialogue lines
 * of the chapter, so moving L2's window does not move the checkpoint. The two read-aloud hits the
 * same extension found (`a1.1-cp1-sprechen-2`: „ein Baby“, „meiner Schwester“) ARE closed, by the
 * line preference `clampFreeFirst` now gives every section that puts a line in the learner's mouth.
 *
 * WHY THE DICTATION IS NOT CLOSED THE SAME WAY, and this is the work order: with the same
 * preference in `buildHoeren`, cp1 takes „Ja, er spricht Englisch und Deutsch.“ instead — and that
 * line is the only one left that the paper's LESEN section can build its fourth window on, so the
 * checkpoint then dictates and prints the same sentence (the guard „no dialogue line is used twice
 * across the sections of one checkpoint“, DaF review #8 MAJOR 2). Chapter 1 (L1–L3) is too poor in
 * construction-free lines to feed three dictations, two read-alouds and four Lesen windows at once:
 * it is the SAME line shortage that holds RULE 18 at 1 and that MAX_SHARED_PRODUCTION_LINES puts in
 * front of the owner. The smallest change that closes both, for the owner to decide, is the one
 * already written there: L3 line 3 „Er ist zwanzig. **Meine** Schwester ist noch jung.“ → „… **Sie**
 * ist noch jung.“ Do NOT close it by narrowing the pattern — that is how it read 0 for three rounds.
 */
export const MAX_DEFERRED_CONSTRUCTIONS = 0;       // a1.1 — closed 2026-09-13 (round 14: L3 line 3 changed, dictation prefers construction-free, unreportable lines)

/**
 * RULE 16 ratchet — how many `examTeile` claims a level may still make that nothing in the module
 * backs. DaF review #1 for A1.2 (BLOCKER 4): `examTeile` is the sixth column of the public 12x6
 * grid (standard §2.4, „Goethe-Teil trained“), i.e. a sales claim, and RULE 7 checked exactly one
 * sentence of it. The first measurement on A1.1 was 3 (L2 „Lesen Teil 1“ and L5/L11 „Hören“, all
 * three without a linked exercise) — but DaF review #7, MAJOR 3 showed two of them to be
 * measurement artefacts: the rule asked for `links.listeningExercise`, the link to an EXTERNAL
 * exercise, while L5 and L11 each carry their own listening surface, the dictation over two
 * dialogue lines. The rule now asks whether the Lektion has a SURFACE for the Teil's family
 * (EXAM_TEIL_COVERS). Re-measured 2026-09-13: **1** — L2 „Lesen Teil 1“, and that one is real:
 * `readingOrder` is null and no step of the Lektion gives the learner a text to READ, while
 * *Start Deutsch 1* tests two short everyday texts there. It was a claim without a surface; L2
 * dropped the Teil on 2026-09-13 (round 8) and the ratchet closed at 0.
 */
export const MAX_UNBACKED_EXAM_TEILE = 0;          // a1.1; per level in LEVELS below — measured 2026-09-13

/**
 * RULE 17 ratchet — how many form checks a level's Beispieltexte may still fail.
 *
 * DaF review #12, MAJOR 1. `GradedWriting.jsx` prints the checklist („25–45 Wörter“, Anrede, Gruß,
 * one row per Leitpunkt) and, one paragraph below it, the Beispieltext — and for twelve rounds
 * nobody ran the one against the other. Measured 2026-09-13: **all six** A1.1 Mitteilungen failed
 * their own length row (24, 15, 17, 17, 14, 15 words against a floor of 25), and round 12 had
 * pulled down the only one that passed. The six were rewritten in round 13 to 35–41 words, three
 * full sentences for three Leitpunkte, so A1.1 is a HARD 0.
 *
 * A1.2 keeps a ratchet (its row in LEVELS): the level is PAUSED by owner decision (2026-09-13) and
 * its twelve samples are a draft nobody may touch, so the number is a measurement of the draft.
 */
export const MAX_MODEL_CHECKLIST_BREAKS = 0;       // a1.1; per level in LEVELS below — measured 2026-09-13

/**
 * RULE 18 ratchet — how many Lektionen may dictate and read aloud the SAME sentence.
 *
 * DaF review #12, MAJOR 3. Nine of twelve A1.1 Lektionen keep the two windows apart without being
 * asked, so separation is the material's own norm; the three that did not were made by the RULE-15b
 * window moves of round 12, which measured the Vorgriffe in the new windows and not the windows.
 * L6 and L8 were separated in round 13 (`readAloud` [2,6] → [4,6] and [3,6] → [6,8]).
 *
 * **L3 cannot be separated without the owner, and that is what the 1 is.** RULE 15b leaves exactly
 * THREE construction-free lines in that dialogue (2, 5, 7 — every other line carries a possessive
 * or an indefinite article, both deferred), and two disjoint windows need four. CONTRACT §2 forbids
 * rewriting a dialogue line, because the lines are the audio script. The smallest change that would
 * close it, for the owner to decide: line 3 „Er ist zwanzig. **Meine** Schwester ist noch jung.“ →
 * „Er ist zwanzig. **Sie** ist noch jung.“ — one word, no possessive, and it rehearses the er/sie
 * contrast that IS this Lektion's grammar. Then L3 has four free lines and this ratchet goes to 0.
 */
export const MAX_SHARED_PRODUCTION_LINES = 0;      // a1.1; per level in LEVELS below — closed 2026-09-13 (round 14: L3 line 3 „Sie ist noch jung.“)

/**
 * RULE 20 ratchet — how many words a level's MODEL TEXTS use that the course has not taught yet.
 *
 * DaF review #13, MAJOR 2. `minLektion` asks „is every word of this item taught by Lektion n?“ of
 * all 374 pool items, `lexisScan` asks it of the hand source, RULE 15 asks it of the dictation and
 * the read-aloud — and NOBODY asked it of the two texts the course holds up as models. The round
 * that rewrote all six A1.1 Mitteilungen measured them on length, Anrede, Gruß and Leitpunkte
 * (RULE 17) and on nothing else, and five of the six came back carrying words the course never
 * teaches: `marokkanisch` (L2), `uns` (L4), `neuer`/`neue` (L8), `erst` (L10), `meinen` (L12) —
 * the last one a form the BUILD throws pool items out for („Vorschau Akkusativ“).
 *
 * A model text is a PRODUCTION surface and is measured like one. What licenses a word here, and
 * all three are derived rather than typed:
 *   • the cumulative lexis of its own Lektion (`taughtUpTo`, the same snapshots RULE 11 uses);
 *   • THE TASK'S OWN WORDS — the `task`/`leitpunkte` of the bank entry and the Lektion's
 *     `taskDe`/`leitpunkte`. A model answer may reuse the words of its own question, and the
 *     Formular samples are field labels before they are anything else („Familienname: Chakiri“);
 *   • the PERSONA facts of the level (`PERSONA_TABLES`), because RULE 14 and RULE 19 *require*
 *     the model to state them — Ana comes `aus Marokko` in Lektion 2 and the country is a Wortfeld
 *     entry of Lektion 3.
 * Plus LICENSED_LETTER_CHUNKS below, as CHUNKS: an A1 Mitteilung needs „Sehr geehrte Damen und
 * Herren“ and „Viele Grüße“, and no Wortfeld carries them. As chunks, not as words, so that
 * `marokkanisch` cannot ride in on a formula.
 *
 * Hard 0 at A1.1, like RULE 17: a model text is something a round just wrote.
 */
export const MAX_UNTAUGHT_IN_MODEL_TEXTS = 0;      // a1.1; per level in LEVELS below — measured 2026-09-13

/**
 * RULE 21 ratchet — how many Leitpunkte a level ASKS FOR and does not TEACH the words for.
 *
 * THE COUNTER-DIRECTION TO RULE 20, and the round that needed it is the round RULE 20 shipped in.
 * RULE 20 forbids a model text a word its Lektion has not taught. Round 14 obeyed it and struck
 * `marokkanisch` from the L2 Beispieltext — and the text then answered two of its three Leitpunkte,
 * because the graded task asks for „Ihr Land und Ihre **Staatsangehörigkeit**“ and A1.1 taught no
 * nationality form in any of its twelve Lektionen. Every version of that text broke either RULE 20
 * or the Leitpunkt; that is not a text problem, it is a Wortfeld problem, and no rule asked the
 * question (DaF review #14, BLOCKER 1). `evaluate-writing.mjs` grades „Sind alle Leitpunkte
 * behandelt?“ and returns a boolean per Leitpunkt, so this is a GRADED surface: **the course may
 * not test in writing what it has not taught.**
 *
 * MEASURED, not asserted, and with RULE 20's licence switched OFF: the Lektion's own Beispieltext
 * is reduced to the words its cumulative lexis actually contains (`taughtUpTo`, the same snapshots
 * RULE 11 uses, plus the persona facts and the letter formulas — but NOT „the words of the task“,
 * which is precisely the licence that hid this), and every Leitpunkt must still be answered by what
 * is left, judged by `leitpunktSatisfied`, the same function the learner's screen uses. A Formular
 * field must still carry a value. An undecidable Leitpunkt („Warum Sie schreiben“) is skipped —
 * the KI grades it and no lexis decides it.
 *
 * Hard 0 at A1.1, like RULE 17 and RULE 19: a task that asks for untaught lexis is a content
 * decision somebody made, not debt a later round pays down.
 */
export const MAX_UNANSWERABLE_LEITPUNKTE = 0;      // a1.1; per level in LEVELS below — measured 2026-09-13

/**
 * The letter formulas a Mitteilung needs and no Wortfeld lists. CLOSED and tiny on purpose — the
 * test pins the list, and every entry is a salutation or a closing, never content
 * (`tests/curricula.test.mjs`, „RULE 20's licensed chunks are letter formulas“).
 */
export const LICENSED_LETTER_CHUNKS = [
  'Sehr geehrte Damen und Herren',
  'Sehr geehrte Frau',
  'Sehr geehrter Herr',
  'Mit freundlichen Grüßen',
  'Viele Grüße',
  'Liebe Grüße',
  'Vielen Dank',
  'Bis bald',
  'Liebe',
  'Lieber',
];

/**
 * RULE 15 — THE OFF-LIMITS FORMS, PER LEVEL.
 *
 * The rule needs two things and the registry supplies both: the Lektion that TEACHES a structure
 * (that is `primaryOrder` — position i in it is Lektion i+1), and the surface forms of that
 * structure. This table is the second half. It is deliberately NOT `primaryPatterns`: those
 * patterns exist to prove a structure is PRESENT ≥ 3×, so several of them are broad on purpose
 * (`present-tense-regular`, `question-words`, `nominative-case`), and a broad pattern used as a
 * ban reports the whole course. Every entry here names a form a learner can be shown to have not
 * met yet; a slug with no entry is simply not policed.
 */
const OFF_LIMITS_FORMS_A11 = {
  // Taught L6. The indefinite article and its negation.
  'indefinite-articles': /\b(?:ein|eine|einen|einem|einer|kein|keine|keinen)\b/gi,
  // Taught L8. Clock and calendar chunks („um eins“, „am Wochenende“, „… Uhr“).
  'time-and-dates': /\b(?:um|am)\s+\w+|\bUhr\b/g,
  // Taught L9. The finite forms of haben.
  'verb-haben': /\b(?:habe|hast|hat|haben|habt)\b/gi,
  // Taught L11. The Satzklammer: a stranded prefix at the end of the sentence.
  'separable-verbs-intro': /\b(?:auf|an|ein|mit|zu)\s*[.?!]/g,
  // Taught L12. The possessive articles.
  'possessive-articles': /\b(?:mein|meine|meinen|meinem|meiner|dein|deine|deinen|deinem|sein|seine|seinen|ihre?)\b/gi,
};

const OFF_LIMITS_FORMS_A12 = {
  // Taught L3. The masculine accusative markers — the forms the level's own Notice card bolds.
  'accusative-intro': /\b(?:den|einen|keinen)\b/gi,
  // Taught L8. The Sie-Imperativ, i.e. a sentence that OPENS with „<Verb> Sie“. „Dann gehen Sie
  // links“ is inversion, not an imperative, so the match is anchored to the start of a sentence.
  'imperative': /(?:^|[.!?]\s+)(?:Helfen|Kommen|Warten|Machen|Holen|Gehen|Nehmen|Geben|Kaufen|Fragen|Schreiben|Lesen|Ziehen|Sprechen|Hören|Bitten|Zeigen|Wechseln|Bezahlen|Sagen|Wiederholen)\s+Sie\b/g,
  // Taught L9. The finite modal forms. They are in A1.2's FUNCTION_WORDS so RULE 5 lets a learner
  // MEET them early (CONTRACT §2) — but meeting a form and typing it into a dictation are two
  // different things, which is the whole point of this rule.
  'modal-verbs-intro': /\b(?:kann|kannst|können|könnt|muss|musst|müssen|müsst|darf|darfst|dürfen|dürft|will|willst|wollen|wollt|soll|sollst|sollen|sollt|möchte|möchtest|möchten)\b/gi,
  // Taught L11. The seven dative prepositions with a dative determiner, plus the contractions the
  // card itself teaches. `im`/`am` are NOT here: A1.1 L8 teaches them as fixed time expressions
  // („am Freitag“, „im Januar“), so an A1.2 learner has met them for a year.
  'dative-prepositions-intro': /\b(?:zum|zur|beim|vom)\b|\b(?:mit|nach|bei|seit|von|zu|aus)\s+(?:dem|der|den|einem|einer|mir|dir|ihm|ihr|uns|Ihnen|meinem|meiner|meinen)\b/gi,
  // Taught L12. Partizip II with ge-. `{2,}` keeps `gehen`, `gegen`, `geben` out: their stem is one
  // letter, a participle's is at least two (ge-feier-t, ge-gess-en).
  'perfekt-intro': /\bge[a-zäöüß]{2,}(?:t|en)\b/g,
};

/**
 * RULE 15 — the chunks a level's own Notice cards licence BEFORE the rule arrives, verbatim. They
 * are cut out of the line before the patterns run, so „Wie komme ich zum Rathaus?“ in L1 is not a
 * Dativ-Vorgriff while „mit dem Koffer“ in L9 still is. A1.2's three are the ones A1.2 L1's notice
 * names by hand („Feste Wendungen für den Weg: zum Rathaus, zur Kirche, an der Ecke — die Regel
 * kommt in Lektion 11“) and CONTRACT.md §2 repeats; „Füllen Sie … aus“ is A1.1's Sie-Imperativ
 * chunk, taught there as a fixed form.
 */
const LICENSED_CHUNKS_A11 = ['Füllen Sie'];
const LICENSED_CHUNKS_A12 = ['zum Rathaus', 'zur Kirche', 'an der Ecke', 'Füllen Sie'];

const lowerSet = (list) => new Set(list.map((w) => String(w).toLowerCase()));

/**
 * THE FUNCTION WORDS A LEARNER MAY MEET AT ANY TIME — and they are the only ones (DaF review #10,
 * MAJOR 3).
 *
 * `FUNCTION_WORDS` is a RULE 5 licence: a dialogue line may USE these without the word standing in
 * a Wortfeld. It was also, until round 11, seeded into the lexicon at Lektion 1, which made every
 * case-inflected determiner of the level "taught" before the course had opened its mouth — so
 * `minLektion` stamped „Der Mann von **meiner** Schwester …“ as servable in Lektion 3 and the card
 * guards exempted `ein`, `eine`, `einen`, `dem`, `meiner` from every check. A list of 159 words is
 * not one word class: `und` carries no grammar and `einem` carries two (Kasus and Genus).
 *
 * THE RULE NOW: a function word is taught from the first Lektion whose dialogue or Notice card
 * USES it — the same cumulative-lexicon logic a content word gets from its Wortfeld (see
 * `taughtUpTo`). This list is the measured exception: words no Lektion can be expected to introduce
 * because the course has no surface on which to introduce them.
 *
 * EVERY ENTRY IS JUSTIFIED, and the justification is one of exactly three:
 *
 *  1. THE NUMBERS. A1.1 teaches them as META Wortfeld entries („die Zahlen 0–20“, L2/L4/L6), and a
 *     meta entry names a SET — `coverageForms()` yields nothing for it and `formsOf()` yields the
 *     words of the label, never `dreizehn`. Measured against the built pool: `zehn` (3 items),
 *     `vierzehn` (2), `dreizehn` (1) occur in no dialogue and in no Notice, so binding them to
 *     first use would drop items that drill exactly what L2 says it teaches.
 *  2. THE PARTICLES, CONJUNCTIONS AND QUESTION WORDS. They inflect for nothing, so there is no
 *     later form of them to defer to; `und`, `nicht`, `auch`, `wie`, `welcher` are as true in
 *     Lektion 1 as in Lektion 12. Measured: `nur` (4 items) and `welcher` (1) occur in no dialogue.
 *  3. THE NOMINATIVE SUBJECT PRONOUNS AND THE TWO BARE GREETINGS. `ich`/`du`/`er`/`sie`/`es`/`wir`/
 *     `ihr`/`man` are the only pronoun forms A1.1 ever produces (the obliques `mich`, `dir`, `ihm`
 *     … are NOT here: they are case, they are bound to first use, and no pool item uses one);
 *     `hallo`/`tschüss` are L1 Wortfeld entries that the L1 dialogue happens to spell only in its
 *     greeting line, and 5 pool items drill them.
 *
 * NOT HERE, deliberately, and this is the whole finding: every article and determiner (`der`,
 * `die`, `das`, `den`, `dem`, `ein`, `eine`, `einen`, `kein…`, `mein…`, `dein…`, `ihr…` as a
 * possessive), every oblique pronoun, every form of `sein`/`haben`, and every preposition and
 * contraction. Those carry Kasus, Genus, Person or Rektion — the three things this course defers —
 * and the course introduces each of them in a Lektion that can be named.
 */
export const FUNCTION_WORDS_FREE = [
  // 3 — Subjektpronomen und die zwei blanken Grußformeln
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'man', 'hallo', 'tschüss',
  // 2 — Partikeln, Konjunktionen, Fragewörter
  'ja', 'nein', 'bitte', 'danke', 'doch', 'und', 'oder', 'aber', 'auch', 'nicht', 'noch',
  'schon', 'sehr', 'nur', 'dann', 'hier', 'da', 'so', 'gern',
  'wer', 'was', 'wo', 'wann', 'warum', 'wie', 'wohin', 'woher', 'welche', 'welcher', 'welches',
  // 1 — die Zahlen 0–100
  'null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
  'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn',
  'neunzehn', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig',
  'neunzig', 'hundert',
];

const FUNCTION_FREE_SET = lowerSet(FUNCTION_WORDS_FREE);

/**
 * THE PER-LEVEL REGISTRY. Every rule below reads its tables from here instead of from a constant,
 * so a second level is data rather than a second validator. A1.1's entry holds exactly the values
 * the hardcoded tables used to hold, which is why `node scripts/validate-curriculum.mjs` (no
 * argument) still measures A1.1 to the same four numbers.
 *
 * `seedFrom` is the cumulative-vocabulary rule the standard implies: A1.2 learners have finished
 * A1.1, so RULE 5 and RULE 11 seed their known set from the WHOLE A1.1 Wortfeld union (plus the
 * A1.1 notice cards), not only from A1.2's own Lektionen.
 */
export const LEVELS = {
  'a1.1': {
    level: 'a1.1',
    code: 'A1.1',
    curriculum: CURRICULUM_A11,
    functionWords: FUNCTION_WORDS,
    dialogNames: DIALOG_NAMES,
    functionSet: lowerSet(FUNCTION_WORDS),
    nameSet: lowerSet(DIALOG_NAMES),
    grammarSlugs: GRAMMAR_SLUGS,
    // PRACTICE-ONLY TOPICS. A pool topic a Lektion may DRAW from without it being one of the twelve
    // grammar slugs: it has no rule card, is never a `primarySlug`, and appears in no `grammarSlugs`
    // list. `numbers` is the first — the L2 Zahlwort items (DaF review #5/#6) drill a form the
    // Lektion teaches in its Wortfeld rather than a structure the level has a rule card for, and
    // filing them under `verb-sein` to get them drawn is exactly the mislabelling review #6 named.
    // RULE 3 keeps holding: every grammar slug is still primary exactly once, and a topic that is
    // in neither list still fails.
    practiceOnlyTopics: ['numbers'],
    primaryOrder: PRIMARY_ORDER,
    situationKeywords: SITUATION_KEYWORDS,
    primaryPatterns: PRIMARY_PATTERNS_A11,
    irregularForms: IRREGULAR_FORMS,
    extraPath: '../src/data/lessonPools/a11.extra.json',
    poolPath: '../src/data/lessonPools/a11.json',
    taskKeyPrefix: 'a11',
    missionCount: 8,
    listeningCount: 6,
    readingCount: 10,
    minUnionWords: 200,
    seedFrom: null,
    // RULE 14. Defined below (PERSONAS_A11) and attached lazily, because the table is written after
    // the registry; `personaSource` keeps the row declarative.
    personaSource: 'a1.1',
    offLimitsForms: OFF_LIMITS_FORMS_A11,
    licensedChunks: LICENSED_CHUNKS_A11,
    // RULE 16. `speaking_missions` at level A1.1 carries eight published missions and none of them
    // is a Teil-1 self-introduction (read 2026-09-13), so an A1.1 „Sprechen Teil 1“ claim can only
    // be backed by the prompt itself.
    teil1MissionOrders: [],
    ratchets: {
      uncoveredWortfeld: MAX_UNCOVERED_WORTFELD,
      untaughtItemTokens: MAX_UNTAUGHT_ITEM_TOKENS,
      untaughtDrawnTokens: MAX_UNTAUGHT_DRAWN_TOKENS,
      // RULE 12 is a hard rule (0, no ratchet) — see its comment above. No entry here.
      missionlessLektionen: MAX_MISSIONLESS_LEKTIONEN,
      unexemplifiedNoticeForms: MAX_UNEXEMPLIFIED_NOTICE_FORMS,
      untaughtInProduction: MAX_UNTAUGHT_IN_PRODUCTION,
      deferredConstructions: MAX_DEFERRED_CONSTRUCTIONS,
      unbackedExamTeile: MAX_UNBACKED_EXAM_TEILE,
      modelChecklistBreaks: MAX_MODEL_CHECKLIST_BREAKS,
      sharedProductionLines: MAX_SHARED_PRODUCTION_LINES,
      untaughtInModelTexts: MAX_UNTAUGHT_IN_MODEL_TEXTS,
      unanswerableLeitpunkte: MAX_UNANSWERABLE_LEITPUNKTE,
      // RULE 19 is a hard rule (0, no ratchet), like RULE 14: a model text that contradicts its own
      // dialogue is never older debt. No entry here.
    },
  },
  'a1.2': {
    level: 'a1.2',
    code: 'A1.2',
    curriculum: CURRICULUM_A12,
    functionWords: FUNCTION_WORDS_A12,
    dialogNames: DIALOG_NAMES_A12,
    functionSet: lowerSet(FUNCTION_WORDS_A12),
    nameSet: lowerSet(DIALOG_NAMES_A12),
    grammarSlugs: GRAMMAR_SLUGS_A12,
    // No practice-only topic at A1.2 yet; the row is explicit so a level cannot inherit one by
    // accident (see the A1.1 row for what it licenses).
    practiceOnlyTopics: [],
    primaryOrder: PRIMARY_ORDER_A12,
    situationKeywords: SITUATION_KEYWORDS_A12,
    primaryPatterns: PRIMARY_PATTERNS_A12,
    irregularForms: { ...IRREGULAR_FORMS, ...IRREGULAR_FORMS_A12 },
    extraPath: '../src/data/lessonPools/a12.extra.json',
    poolPath: '../src/data/lessonPools/a12.json',
    taskKeyPrefix: 'a12',
    // speaking_missions at level a1.2: 12 published missions (mission_order 1–12), read 2026-09-13.
    missionCount: 12,
    // listening_exercises: exercise_number 1–6; reading_lessons: order_index 1–10 (same query).
    listeningCount: 6,
    readingCount: 10,
    minUnionWords: 195,
    seedFrom: 'a1.1',
    // RULE 14. A1.2 inherits A1.1's cast (`DIALOG_NAMES = [...DIALOG_NAMES_A11, 'Fischer']`), so it
    // inherits A1.1's facts too — PERSONAS_A12 spreads PERSONAS_A11 and adds the characters A1.2
    // introduces. Switched on by DaF review #1 for A1.2, BLOCKER 1: while this row said `null`,
    // A1.2 L6 gave Ana a husband in a DICTATION line, against the A1.1 Formular that files her as
    // ledig. No level may ship without a persona table; `tests/curricula.test.mjs` pins that.
    personaSource: 'a1.2',
    offLimitsForms: OFF_LIMITS_FORMS_A12,
    licensedChunks: LICENSED_CHUNKS_A12,
    // RULE 16. `speaking_missions` at level A1.2, read 2026-09-13: mission_order 9 is
    // „Sprechen Teil 1: Sich komplett vorstellen“, the only Teil-1 mission of the level.
    teil1MissionOrders: [9],
    // MEASURED on this module, not chosen. See docs/course-factory/a12-rebuild/CONTRACT.md §Ratchets.
    ratchets: {
      uncoveredWortfeld: 0,
      // RULE 11 counts the BUILT pool (src/data/lessonPools/a12.json). 156 → **18** on 2026-09-13:
      // `ITEM_FORMULA_RE` gained the four A1.2 task formulas it was missing („Schreiben Sie die
      // Zahl / den Preis / die Telefonnummer in Worten“, „Schreiben Sie die Bitte“), which were the
      // formula talking rather than the item, and the build now drops the 91 legacy bank items
      // built on words A1.2 teaches nowhere (`Zeitung`, `Kuli`, `Pizza`, `Präteritum`, `Hamburg`).
      // The 18 that remain are Vorgriffe — `fliegen` L1 (taught L7), `tragen`/`laufen` L6, …
      // 18 → **36**, paused; re-measured 2026-09-13 (round 11, DaF review #10 MAJOR 3). The blanket
      // FUNCTION_WORDS seed at Lektion 1 is gone from the item lexicon (see `seedVocabulary`'s
      // `freeOnly` and `functionWordsUsedIn`), so A1.2's own function words — its MODAL paradigm
      // above all (`kann`, `Kannst`, `wollt`), plus `gibt`, `nichts`, `Danach`, `Neben` — are now
      // bound to the Lektion that first says them instead of being free from the first line. The
      // material did not change and may not: A1.2 is PAUSED by owner decision and its pool is a
      // DRAFT nobody may rebuild. The number is a work order for whoever resumes the level.
      untaughtItemTokens: 36,
      // RULE 11b measures the same tokens where the learner MEETS them (see drawnLexis): 18 → 3
      // („fliegen“/„fliege“ in L2, taught in L7; „Onkel“ in L3) — re-measured after the round-8
      // A1.1 engine changes. A1.2 is PAUSED by owner decision (2026-09-13); the number is a
      // work order for whoever resumes it, not a target.
      //
      // 3 → 4, paused; re-measured 2026-09-13. The engine change of commit 217c958 (fresh draw per
      // attempt) re-rolled which items A1.2 serves and „fern“ (L6, taught L9) came into the draw.
      // At A1.1 the same movement is now impossible — the `minLektion` stamp makes RULE 11b 0 by
      // construction — but the mechanism needs the pool to carry the stamp, and A1.2's pool is a
      // DRAFT nobody may rebuild while the level is paused. Rebuilding a1.2.json (`node
      // scripts/build-lesson-pool.mjs a1.2`) is the first step of whoever resumes the level, and it
      // takes this ratchet to 0 and hard, exactly as at A1.1.
      //
      // 4 → **14**, paused; re-measured 2026-09-13 (round 11, same cause as RULE 11 above). Ten of
      // the fourteen are A1.2 function words met before their Lektion: `Kannst`/`kann`/`wollt` in
      // L9, `Gibt`/`gibt` in L4/L6, `nichts` in L6, `Danach`/`Neben` in L1. At A1.1 this class is 0
      // by construction because the pool carries the `minLektion` stamp; A1.2's draft pool does not
      // and cannot be rebuilt while the level is paused, exactly as the note above says.
      untaughtDrawnTokens: 14,
      // RULE 12 is a hard rule (0, no ratchet) — see its comment above. No entry here.
      missionlessLektionen: 1,
      unexemplifiedNoticeForms: 0,
      untaughtInProduction: 0,
      // RULE 15b, measured on the paused A1.2 draft 2026-09-13 (round 12): **0**. The level's
      // production lines and model texts carry none of the three deferred constructions of
      // `src/data/curricula/constructions.js` — which are A1.1's, read from A1.1's own
      // `primarySlug`s; A1.2 introduces all three before its own Lektion 1. Paused; re-measured,
      // and no A1.2 content was touched to get there.
      // 0 → **3**, paused; re-measured 2026-09-13 (round 14). Not a content change and not a
      // regression: `adjective-declension` was added to `constructions.js` (DaF review #13,
      // MAJOR 2) as a pattern A1.1 teaches in NO Lektion — and the pattern's `never` flag makes it
      // deferred at every level that does not introduce it under this slug, A1.2 included — while
      // RULE 15b at the same time began reading the CHECKPOINTS. The three, measured on the paused
      // draft: „Das dritte Stockwerk“ (L2 dictation line 7), „ein neuer Termin“ (L6 Beispieltext)
      // and „dem kurzen Haar“ (`a1.2-cp3-hoeren-1`, which quotes the L7 dialogue line). The number
      // is a work order for whoever resumes the level; no A1.2 content was touched to get it.
      deferredConstructions: 3,
      unbackedExamTeile: 0,
      // RULE 17, measured on the paused A1.2 draft 2026-09-13 (round 13): **17** failed form checks
      // across seven of the twelve Beispieltexte — three below the 25-word floor (L4 24, L8 21,
      // L10 23), one without a Gruß (L8) and thirteen unmodelled Leitpunkte. Paused; re-measured,
      // and no A1.2 content was touched to get there: the number is the draft's, and whoever
      // resumes the level rewrites those samples the way round 13 rewrote A1.1's six.
      //
      // 17 → **8**, paused; re-measured 2026-09-13 (round 14). No A1.2 content was touched: the
      // Leitpunkt half of `scoreWriting` stopped keying on ONE token per Leitpunkt (DaF review #13,
      // MAJOR 1), so nine of the thirteen „unmodelled Leitpunkte“ turn out to have been modelled
      // all along. What is left is the three samples below the 25-word floor, the missing Gruß in
      // L8 and four Leitpunkte the drafts really do not answer.
      //
      // 8 → **10**, paused; re-measured 2026-09-13 (round 15). No A1.2 content was touched: the
      // Leitpunkt half of `scoreWriting` stopped treating a COORDINATED Leitpunkt as two
      // alternatives (DaF review #14, MAJOR 1), and the L12 draft answers neither half of „Was Sie
      // gegessen und getrunken haben“ (it says `gegessen`, not `getrunken`) nor „Wen Sie eingeladen
      // haben“. Both are real gaps in the draft that the lenient rule was hiding.
      modelChecklistBreaks: 10,
      // RULE 18, measured on the paused A1.2 draft 2026-09-13 (round 13): **0** — no A1.2 Lektion
      // dictates and reads aloud the same line. Hard from the start at this level.
      sharedProductionLines: 0,
      // RULE 20, measured on the paused A1.2 draft 2026-09-13 (round 14): **3** words its own
      // Lektion does not teach yet — `hoch` (L2 sample), `neuer` (L6 sample) and `leer` (L8
      // sample). Paused; re-measured, and no A1.2 content was touched to get there: whoever
      // resumes the level rewrites those three samples the way round 14 rewrote A1.1's five.
      untaughtInModelTexts: 3,
      // RULE 21, measured on the paused A1.2 draft 2026-09-13 (round 15): **9** Leitpunkte the
      // draft asks for and does not teach the words for — L2 „… sehen möchten“ (`sehen` in no
      // Wortfeld up to L2), L4 „Ihre Zimmernummer und der Tag“, L6 „Was Ihnen wehtut“, L7
      // „Geburtsdatum“ (`März`) and „Straße“ (`Kölner`), L8 „Was in der Küche zu tun ist“, L9
      // „Datum“ (`Juli`), L12 „Was Sie gegessen und getrunken haben“ and „Wen Sie eingeladen
      // haben“. Paused; re-measured, and no A1.2 content was touched to get there — the level is
      // frozen by owner decision (2026-09-13) and whoever resumes it pays this down the way
      // round 15 paid A1.1's two (a Wortfeld line, or a Leitpunkt in taught words).
      unanswerableLeitpunkte: 9,
    },
  },
};

/** The registry row for a level (any case), or null when the level is not rebuilt yet. */
export const levelSpec = (level) => LEVELS[String(level || '').toLowerCase()] || null;

/**
 * The function words a single Lektion PUTS IN FRONT OF THE LEARNER — its dialogue (lines, title,
 * setting) and its Notice card. This is what binds `ein`, `dem`, `mit`, `meiner` to a Lektion
 * instead of to Lektion 1: a determiner is taught from the Lektion that first says it, exactly as a
 * noun is taught from the Wortfeld that first lists it (DaF review #10, MAJOR 3).
 *
 * Only tokens that ARE function words of the level are returned. A dialogue does not teach its
 * content words — those come from the Wortfeld and RULE 5 is what checks it.
 */
function functionWordsUsedIn(l, spec) {
  const out = new Set();
  const sources = [
    l.dialog?.title, l.dialog?.setting,
    ...(l.dialog?.lines || []).map((x) => x.de),
    l.notice?.title, l.notice?.bodyDe, ...(l.notice?.examples || []),
  ];
  for (const text of sources) {
    for (const t of tokenise(text || '')) {
      const low = t.toLowerCase();
      if (spec.functionSet.has(low)) out.add(low);
    }
  }
  return out;
}

/**
 * The cumulative known vocabulary a level inherits from the level before it (RULE 5 / RULE 15).
 *
 * `freeOnly` is the item-side seed (DaF review #10, MAJOR 3). RULE 5 and RULE 15 read the DIALOGUE,
 * and CONTRACT §2 licences every FUNCTION_WORD there by name: a learner may MEET `dem` in a line
 * before the course explains it, and RULE 15's structural half (`offLimitsForms`, per grammar slug)
 * is the instrument that reports it when the line is one the learner has to PRODUCE — which is why
 * „ein Bruder, eine Schwester“ is already on RULE 15's list as `indefinite-articles`, not as
 * unknown lexis. The ITEM side is a different question — „may this item be SERVED here?“ — and
 * there the blanket licence is what MAJOR 3 measured as blind: it is `taughtUpTo` that passes
 * `freeOnly`, so `minLektion`, RULE 11 and RULE 11b bind every determiner to the Lektion that
 * first says it.
 */
function seedVocabulary(spec, freeOnly = false) {
  const base = freeOnly ? FUNCTION_FREE_SET : spec.functionSet;
  const known = new Set([...base, ...spec.nameSet]);
  const prior = spec.seedFrom ? levelSpec(spec.seedFrom) : null;
  if (!prior) return known;
  // The CURRENT level's irregular table, not the previous level's: an A1.2 learner knows A1.1's
  // `trinken` and now meets its Partizip II, so the inherited entry has to yield `getrunken`.
  for (const l of prior.curriculum.lektionen || []) {
    for (const w of l.wortfeld || []) for (const f of formsOf(w, spec.irregularForms)) known.add(f);
    for (const t of tokenise(l.notice?.bodyDe || '')) known.add(t.toLowerCase());
    // …and, on the item side, every function word the finished level actually SAID. An A1.2 learner
    // has met `dem` and `einen` in A1.1's dialogues; they are taught for that reason and not because
    // they are on a list. Measured against the PRIOR level's own function-word list, which is the
    // one that licensed those lines.
    if (freeOnly) for (const w of functionWordsUsedIn(l, prior)) known.add(w);
  }
  return known;
}

/** The hand-written practice items, read from disk so the validator sees what the pool build sees. */
export function loadExtraItems(level = 'a1.1') {
  const spec = levelSpec(level);
  if (!spec) return [];
  const url = new URL(spec.extraPath, import.meta.url);
  try {
    return JSON.parse(readFileSync(url, 'utf8')).items || [];
  } catch {
    return [];
  }
}

/**
 * The BUILT pool — what the learner is actually served. RULE 10 used to count only the dialogues
 * and the hand-written items, so words that the generated items drill („das Fenster“, „braun“)
 * were reported as never used: „eine Ratchet-Zahl, die man nicht nachrechnen kann, ist keine
 * Messung“ (DaF review #4). Items carry a `topic`, and a Lektion draws the topics of its
 * `practiceRule`, so that is how an item is assigned to a Lektion here.
 *
 * A level whose pool has not been built yet has no `<level>.json` on disk — A1.2 is in that state
 * while its extras are being written — and then this returns an empty list and RULE 10 / RULE 11
 * measure the hand-written items alone. That is the correct reading (there is nothing else to
 * serve), not a silent skip: the numbers move when the pool is built, which is when they should.
 */
export function loadPoolItems(level = 'a1.1') {
  const spec = levelSpec(level);
  if (!spec) return [];
  const url = new URL(spec.poolPath, import.meta.url);
  try {
    return JSON.parse(readFileSync(url, 'utf8')).items || [];
  } catch {
    return [];
  }
}

/** Lektion number an item belongs to, from its `extra-<level>-lNN-…` id (extra-a11-…, extra-a12-…). */
const lektionOfItem = (id) => {
  const m = /^extra-[a-z]\d\d-l(\d{2})-/.exec(String(id || ''));
  return m ? Number(m[1]) : null;
};

// A1.1's own tables, kept as the defaults of coverageForms() so the A1.1 call sites are unchanged.
const FUNCTION_SET = LEVELS['a1.1'].functionSet;

/**
 * The forms that count as "this Wortfeld entry was used". formsOf() also yields the article and the
 * function words of multi-word entries ("von Beruf", "Viertel nach"), which would make almost
 * anything look covered, so they are dropped: an entry is carried by its content word or not at all.
 */
export function coverageForms(w, functionSet = FUNCTION_SET, irregulars = IRREGULAR_FORMS) {
  // Meta entries („die Zahlen 0–10“) name a SET of words, not a word: no input can ever contain
  // them verbatim, so counting them as debt makes a ratchet that can never be paid off.
  if (w.meta) return new Set();
  const head = tokenise(w.word || w.de).map((t) => t.toLowerCase())
    .filter((t) => t !== String(w.article || '').toLowerCase());
  // Entries whose only content IS a function word (gern, schon, bitte, danke, hallo) can never be
  // "missing" — RULE 5 lets any line use them — so they are outside this rule.
  if (!head.length || head.every((t) => functionSet.has(t))) return new Set();
  const forms = formsOf(w, irregulars);
  if (w.article) forms.delete(String(w.article).toLowerCase());
  for (const f of [...forms]) if (functionSet.has(f)) forms.delete(f);
  return forms;
}

/** RULE 10: every Wortfeld entry must occur somewhere in the input of its own Lektion. */
export function wortfeldCoverage(c, extraItems, poolItems) {
  const spec = levelSpec(c?.level) || LEVELS['a1.1'];
  extraItems = extraItems ?? loadExtraItems(spec.level);
  poolItems = poolItems ?? loadPoolItems(spec.level);
  const byLektion = new Map();
  const add = (nr, it) => { if (nr) byLektion.set(nr, [...(byLektion.get(nr) || []), it]); };
  for (const it of extraItems) add(lektionOfItem(it.id), it);
  // Generated items have no Lektion in their id; they reach a Lektion through its practiceRule.
  const byTopic = new Map();
  for (const l of c.lektionen || []) {
    for (const t of (l.practiceRule?.topics) || []) byTopic.set(t, [...(byTopic.get(t) || []), l.nr]);
  }
  for (const it of poolItems) {
    const fromId = lektionOfItem(it.id);
    if (fromId) { add(fromId, it); continue; }
    for (const nr of byTopic.get(it.topic) || []) add(nr, it);
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
      const forms = coverageForms(w, spec.functionSet, spec.irregularForms);
      if (!forms.size) continue;                       // greetings whose only token is a function word
      if (![...forms].some((f) => seen.has(f))) uncovered.push({ nr: l.nr, de: w.de });
    }
  }
  return uncovered;
}

// What is NOT lexis in a hand-written prompt: the cue in brackets, the Sie-Aufgabenformel and the
// article+noun that names what the learner has to produce.
const ITEM_CUE_RE = /\([^)]*\)|\[[^\]]*\]/g;
// Only COMPLETE formulas are stripped. The bare words („richtig“, „die Frage“, „den Satz“,
// „das Wort“, „die Zahl“) used to be stripped from every prompt, which hid content words from the
// check: „___ Gleis vier richtig?“ passed although `richtig` is in no Wortfeld of the course.
const ITEM_FORMULA_RE = new RegExp([
  // Longest first: the alternation is tried in order at each position.
  'Finden Sie den Fehler und schreiben Sie den Satz richtig',
  'Schreiben Sie die Frage in der normalen Wortfolge', 'Schreiben Sie die Frage richtig',
  // „Schreiben Sie den Satz“ and „Buchstabieren Sie den Gruß“ are the same closed Sie-Aufgabenformel
  // as „Bilden Sie den Satz“ next door and were simply missing from the list; without them the
  // generated half of the pool reports Satz/Schreiben/Fehler as untaught lexis in ~20 items, which
  // is the formula talking, not the item (added when RULE 11 started reading the built pool).
  'Schreiben Sie den Satz', 'Buchstabieren Sie den Gruß',
  // „Schreiben Sie die Zahl in Worten“ is the A1.2 pool's spelling of the same formula. It was
  // missing, so `Schreiben`/`Zahl`/`Worten` counted as item lexis in four A1.2 items — three of
  // RULE 11b's 18 were the formula talking (DaF review #6 note in the A1.2 registry row).
  'Schreiben Sie die Telefonnummer in Worten', 'Schreiben Sie den Preis in Worten',
  'Schreiben Sie die Zahl in Worten', 'Schreiben Sie die Bitte',
  'Schreiben Sie die Zahl als Wort', 'Schreiben Sie das Wort', 'Schreiben Sie die Frage',
  // „Schreiben Sie die höfliche Frage“ is the register-normalised spelling of the same closed
  // formula as its „Bilden Sie“ twin next door (the bank duzt: „Schreib die höfliche Frage:“).
  // It was missing, so `Schreiben` counted as item lexis and the untaught-lexis gate in
  // build-lesson-pool.mjs dropped two sound yes-no-questions items over the task line.
  'Schreiben Sie die höfliche Frage',
  'Bilden Sie den Satz', 'Bilden Sie die höfliche Frage', 'Bilden Sie die Frage',
  // „Welche Schreibweise ist richtig?“ is the whole task line of the generated spelling-choice
  // items this file's sibling build script writes from the Wortfeld — the learner picks between two
  // spellings of a word that IS taught. It was missing, so `Schreibweise` and `richtig` counted as
  // item lexis in every one of them and they could never be served at any Lektion (minLektion null).
  'Welche Schreibweise ist richtig',
  'Buchstabieren Sie das Wort', 'Lesen Sie die Buchstaben',
  'Korrigieren Sie', 'Ergänzen Sie', 'Wählen Sie',
].join('|'), 'g');

/**
 * The Lektion an item is judged against: its id prefix when it is hand-written, otherwise the
 * EARLIEST Lektion whose `practiceRule` lists the item's topic. A generated item carries a UUID and
 * a topic, and every Lektion that names that topic can draw it — so the item may appear as early as
 * the first of them, and that is the Lektion whose vocabulary it must not reach past. (Judging it
 * against the last Lektion would be the lenient reading and would hide exactly the Vorgriffe this
 * rule exists to find.)
 *
 * The map is built from `practiceRule.topics` itself, so a practice-only topic (`numbers`, see
 * LEVELS) is assigned exactly like a grammar slug — the L2 Zahlwort items land in L2.
 */
function lektionAssignment(c) {
  const earliest = new Map();
  for (const l of c.lektionen || []) {
    for (const t of l.practiceRule?.topics || []) if (!earliest.has(t)) earliest.set(t, l.nr);
  }
  return (it) => lektionOfItem(it.id) ?? earliest.get(it.topic) ?? null;
}

/**
 * RULE 11b — the Lektion at which the learner actually SEES an item, from the two engines that
 * serve it: `planPractice()` for the seven controlled-practice items of every Lektion (both
 * attempts, because the second attempt redraws and a Vorgriff in attempt 2 is a Vorgriff), and
 * `buildCheckpoint()` for the pool items a checkpoint pulls in — those are met at the chapter
 * Lektion, i.e. `checkpoint.afterLektion`, which is when the learner sits the test.
 *
 * The earliest Lektion an item is served in wins, because that is the smallest vocabulary it has
 * to live inside. Items nothing draws are simply absent from the map — they are RULE 11's business,
 * not this rule's.
 *
 * DaF review #6, MAJOR 5: „was er an der falschen Stelle liest, kann nicht repariert werden“.
 * RULE 11 assigns a generated item to the EARLIEST Lektion whose `practiceRule` names its topic,
 * which is neither where it is drawn nor something a repair round can move — so the 187 the review
 * measured mixes 25 tokens in 16 items a learner meets with 147 in 100 items nobody will ever see,
 * and repairing all sixteen moves the number by 25 and looks like nothing. This assignment sees
 * only the items a learner meets.
 */
export function drawnAssignment(c, items) {
  const pool = { items: [...items] };
  const drawn = new Map();
  const keep = (id, nr) => {
    if (!id || !Number.isInteger(nr)) return;
    if (!drawn.has(id) || drawn.get(id) > nr) drawn.set(id, nr);
  };
  for (const attempt of [1, 2]) {
    for (const [nr, list] of planPractice(c, pool, attempt)) for (const it of list) keep(it.id, nr);
  }
  for (const cp of c.checkpoints || []) {
    for (const item of buildCheckpoint({ curriculum: c, checkpoint: cp, pool })) {
      keep(item.poolItemId, cp.afterLektion);
    }
  }
  return drawn;
}

/** The item universe both lexis rules read: the built pool wins over the hand-written source. */
function itemUniverse(spec, extraItems, poolItems) {
  const items = new Map();
  for (const it of extraItems || []) items.set(it.id, it);
  for (const it of poolItems || []) items.set(it.id, it);
  return items;
}

/** What a learner has been taught by the end of each Lektion — Map<nr, Set<form>>. */
export function taughtUpTo(c, spec) {
  // A level's known set starts from the level before it (see seedVocabulary): an A1.2 item may
  // build on every word A1.1 taught, and must not reach past that.
  const known = seedVocabulary(spec, true);
  const knownUpTo = new Map();
  for (const l of c.lektionen || []) {
    for (const w of l.wortfeld || []) for (const f of coverageForms(w, spec.functionSet, spec.irregularForms)) known.add(f);
    for (const w of l.wortfeld || []) for (const f of formsOf(w, spec.irregularForms)) known.add(f);
    // The Notice card is input the learner reads in this very Lektion, on the screen before the
    // practice items — so a word it teaches (the letter names Zett, Ypsilon, Jot, Vau, Eszett,
    // scharfes S in L1) counts as taught from here on (DaF review #4).
    for (const t of tokenise(l.notice?.bodyDe || '')) known.add(t.toLowerCase());
    // The function words this Lektion says out loud (DaF review #10, MAJOR 3). Outside
    // FUNCTION_WORDS_FREE a function word is taught where it is first met, not at Lektion 1 —
    // otherwise `minLektion` calls `von meiner Schwester` servable in Lektion 1 and the whole
    // deferral question is answered by a list instead of by the course.
    for (const w of functionWordsUsedIn(l, spec)) known.add(w);
    knownUpTo.set(l.nr, new Set(known));
  }
  return knownUpTo;
}

/**
 * THE LEVEL LEXICON: every form the course knows at the END of the level — the inherited
 * vocabulary of the level before it (`seedVocabulary`), every Lektion's Wortfeld in all the forms
 * RULE 5 licenses, every token of every Notice card, plus FUNCTION_WORDS and DIALOG_NAMES (both
 * already inside `seedVocabulary`).
 *
 * WHY IT IS EXPORTED. RULE 11/11b measure a Vorgriff — a word taught LATER than the Lektion the
 * item is met in — and a Vorgriff is repairable by moving the item. The class DaF reviews #5 and #6
 * kept finding underneath it is different and not repairable: legacy bank items built on words the
 * course NEVER teaches (Honig, König, Instrument, Freiheit, Zeitung, and the cast names Tom and
 * Anna, who appear in no A1.1 dialogue). `scripts/build-lesson-pool.mjs` drops those at build time,
 * and it has to ask the same question with the same tokeniser the validator asks it with, or the
 * build would close a class the validator still reports. Hence one exported predicate rather than a
 * second copy of the machinery.
 *
 * NON-CIRCULAR: this reads the CURRICULUM only (Wortfeld, Notice, function words, names). It never
 * reads the pool, so a pool item can never teach itself the word it uses.
 */
export function levelLexicon(level = 'a1.1') {
  const spec = levelSpec(level);
  if (!spec) return new Set();
  // The last snapshot of `taughtUpTo` IS the end-of-level set, so the two can never drift: RULE 11
  // judges an item against `knownUpTo.get(nr)`, this judges it against the union of all of them.
  const snapshots = [...taughtUpTo(spec.curriculum, spec).values()];
  return snapshots.length ? new Set(snapshots[snapshots.length - 1]) : seedVocabulary(spec, true);
}

/**
 * The tokens of an item that `knownSet` does not contain — the same fields, the same tokeniser and
 * the same formula/cue stripping `lexisScan` uses, one entry per distinct token in original case.
 * Pass `levelLexicon(level)` to ask „does the course ever teach this?“ and a `knownUpTo` snapshot
 * to ask „has it taught it YET?“ — RULE 11 and RULE 11b are the second question.
 */
export function untaughtTokens(item, knownSet, spec = null) {
  const names = spec?.nameSet || new Set();
  const prompt = String(item?.questionDe || '').replace(ITEM_CUE_RE, ' ').replace(ITEM_FORMULA_RE, ' ');
  const texts = [prompt, item?.answer, ...(item?.accepted || [])].filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const s of texts) {
    for (const t of tokenise(s)) {
      const low = t.toLowerCase();
      if (knownSet.has(low) || names.has(low) || seen.has(low)) continue;
      seen.add(low);
      out.push(t);
    }
  }
  return out;
}

/**
 * THE EARLIEST LEKTION AN ITEM MAY BE SERVED IN — `minLektion`, the build-time stamp that makes
 * RULE 11b zero by construction (round 10).
 *
 * RULE 11b measured a Vorgriff the draw could produce and a repair round then had to chase item by
 * item; commit 217c958 (fresh draw per attempt) moved the draw and the list grew back to 13. A list
 * of ids is not a rule, so the question „is every word of this item taught by Lektion n?“ is
 * answered ONCE, at build time, for every item and every n: `minLektion` is the first n at which
 * `untaughtTokens(item, knownUpTo(n))` is empty, and `pickPracticeItems` will not consider an item
 * whose `minLektion` is greater than the Lektion it is drawing for. `null` means the course never
 * teaches all of the item's words — the build-time level gate already drops those.
 *
 * It is THE VALIDATOR'S OWN tokeniser and the validator's own per-Lektion snapshots, exported for
 * the build for exactly the reason `levelLexicon` is: the build may not stamp items on a yardstick
 * the validator does not measure them with, or the stamp and the rule could disagree.
 *
 * Returns a function rather than a table so the O(12) snapshots are built once per level.
 */
export function minLektionIndex(level = 'a1.1') {
  const spec = levelSpec(level);
  if (!spec) return () => null;
  const snapshots = [...taughtUpTo(spec.curriculum, spec).entries()].sort((a, b) => a[0] - b[0]);
  return (item) => {
    for (const [nr, known] of snapshots) if (!untaughtTokens(item, known, spec).length) return nr;
    return null;
  };
}

/**
 * The shared scan of RULE 11 and RULE 11b: for every item the `assign` function places in a
 * Lektion, every token of its prompt (minus the bracketed cue and the complete Sie-Aufgabenformel),
 * its answer and its accepted answers that the course has not taught by that Lektion. One offender
 * per (item, token) pair, sorted Lektion by Lektion so the list reads like the course.
 */
function lexisScan(c, spec, items, assign) {
  const knownUpTo = taughtUpTo(c, spec);
  const offenders = [];
  for (const it of items) {
    const nr = assign(it);
    if (!nr) continue;
    const vocab = knownUpTo.get(nr);
    if (!vocab) continue;
    for (const token of untaughtTokens(it, vocab, spec)) offenders.push({ nr, id: it.id, token });
  }
  offenders.sort((a, b) => a.nr - b.nr || a.id.localeCompare(b.id) || a.token.localeCompare(b.token));
  return offenders;
}

/**
 * RULE 11: the practice items obey the same taught-words rule as the dialogues.
 *
 * Until DaF review #5 this read `<level>.extra.json` only and derived the Lektion from the id
 * prefix, so all 227 generated items of A1.1 fell through `if (!nr) continue` and the ratchet
 * described 124 of 351 items („was der Validator nicht liest, existiert für die Reparaturrunde
 * nicht“). It now reads the BUILT pool as `wortfeldCoverage` does and assigns generated items via
 * `practiceRule.topics`; the built version of a hand-written item wins, because that is the text
 * the build's repair run produced and the learner sees. The scanned fields are unchanged — prompt
 * (minus the bracketed cue and the complete Sie-Aufgabenformel), answer, accepted — so the number
 * moves because the item universe grew, not because the yardstick did.
 *
 * Since DaF review #6 this is the INFORMATIONAL half of the pair: it covers the whole pool,
 * including the ~100 items no draw reaches, and its assignment is the earliest topic-Lektion rather
 * than the drawn one. RULE 11b below is the half that can be repaired.
 */
export function itemLexis(c, extraItems, poolItems) {
  const spec = levelSpec(c?.level) || LEVELS['a1.1'];
  extraItems = extraItems ?? loadExtraItems(spec.level);
  poolItems = poolItems ?? loadPoolItems(spec.level);
  const items = itemUniverse(spec, extraItems, poolItems);
  return lexisScan(c, spec, items.values(), lektionAssignment(c));
}

/**
 * RULE 11b: the items the learner is actually SERVED use only words taught by the Lektion that
 * serves them. Same token machinery as RULE 11, same item texts — only the assignment differs, and
 * that is the whole point: this number names items a repair round can find, open and rewrite, and
 * every token on the list is one a learner reads on a screen.
 */
export function drawnLexis(c, extraItems, poolItems) {
  const spec = levelSpec(c?.level) || LEVELS['a1.1'];
  extraItems = extraItems ?? loadExtraItems(spec.level);
  poolItems = poolItems ?? loadPoolItems(spec.level);
  const items = itemUniverse(spec, extraItems, poolItems);
  const drawn = drawnAssignment(c, [...items.values()]);
  return lexisScan(c, spec, items.values(), (it) => drawn.get(it.id) ?? null);
}

/**
 * Words a can-do line is made OF rather than ABOUT: the „Ich kann …“ frame and the handful of
 * verbs every Kann-Beschreibung uses („sagen“, „fragen“, „verstehen“). If they counted as content
 * keywords, every line would match the nearest „Sagen Sie …“ prompt and RULE 12 would measure
 * nothing. Everything else — Familie, Preis, buchstabieren, Formular — is content.
 */
const CANDO_STOPWORDS = new Set([
  'kann', 'ich', 'mich', 'mir', 'meinen', 'meine', 'mein', 'meiner', 'meinem', 'meines',
  'jemanden', 'jemandem', 'jemand', 'etwas', 'einfach', 'einfache', 'einfachen', 'einfaches',
  'kurze', 'kurzen', 'kurzer', 'person', 'personen', 'wenige', 'einige',
  'sagen', 'fragen', 'antworten', 'verstehen', 'machen', 'nennen', 'stellen', 'geben', 'nehmen',
]);

/**
 * The PRODUCTION surfaces of a Lektion — the places where the learner types, speaks or writes
 * something himself: the dictation lines (`hoeren.lines`), the read-aloud lines
 * (`sprechen.readAloud`), the open speaking task, the Schreiben task, the pretest, and the pool
 * items of the Lektion.
 *
 * Both line sets are INDICES into `dialog.lines`, so the dialogue is read only through them. A
 * line the learner reads silently once in the dialogue and never again is NOT a rehearsal — that
 * is the distinction DaF review #7, MAJOR 4 turns on: L12's farewell and good wish sit in dialogue
 * line 9, outside `readAloud` and outside `hoeren.lines`, so the whole dialogue counted as
 * rehearsal would have hidden the finding.
 *
 * The Notice card stays in the set: its `examples` are the model the Lektion asks the learner to
 * reproduce in the very next step, and it is the only surface that covers a purely RECEPTIVE
 * can-do („eine Wohnungsanzeige mit Zahlen verstehen“, A1.2 L2). Dropping it was measured and
 * costs that line; the dialogue-derived surfaces are the change this round makes.
 */
function dialogLinesAt(l, indices) {
  const lines = l.dialog?.lines || [];
  return (indices || [])
    .map((i) => lines[i])
    .filter(Boolean)
    .map((x) => (typeof x === 'string' ? x : x.de))
    .filter(Boolean);
}

function rehearsalText(l, itemsOfLektion) {
  return [
    ...dialogLinesAt(l, l.hoeren?.lines),
    ...dialogLinesAt(l, l.sprechen?.readAloud),
    l.pretest?.promptDe, l.pretest?.model, ...(l.pretest?.accepted || []),
    l.schreiben?.taskDe, l.schreiben?.sample,
    ...(l.schreiben?.fields || []), ...(l.schreiben?.leitpunkte || []),
    l.sprechen?.open?.promptDe, ...(l.sprechen?.open?.hintWords || []),
    l.notice?.title, l.notice?.bodyDe, ...(l.notice?.examples || []),
    ...itemsOfLektion.flatMap((it) => [it.questionDe, it.answer, it.explanationDe]),
  ].filter(Boolean).join(' ');
}

/**
 * RULE 12: every can-do line is rehearsed somewhere in its own Lektion. The 12×6 can-do grid is
 * rendered on the public syllabus page (`astro-site/src/pages/courses/[level].astro`), so a line
 * nothing rehearses is a promise made to a buyer before paying (DaF review #4, MAJOR 6). A line
 * counts as rehearsed when one of its content words — stemmed with the same formsOf() that RULE 5
 * uses — occurs in one of the Lektion's exercise slots.
 */
export function canDoRehearsal(c, extraItems) {
  const spec = levelSpec(c?.level) || LEVELS['a1.1'];
  extraItems = extraItems ?? loadExtraItems(spec.level);
  const byLektion = new Map();
  for (const it of extraItems) {
    const nr = lektionOfItem(it.id);
    if (nr) byLektion.set(nr, [...(byLektion.get(nr) || []), it]);
  }
  const offenders = [];
  for (const l of c.lektionen || []) {
    // Both sides are stemmed: a can-do says „wann ich arbeite“, the speaking prompt says
    // „arbeiten?“, and neither string contains the other. formsOf() is applied to the slot tokens
    // as well, so the two meet on the same set of forms.
    const slots = new Set();
    for (const t of tokenise(rehearsalText(l, byLektion.get(l.nr) || []))) {
      const low = t.toLowerCase();
      slots.add(low);
      for (const f of formsOf({ de: low }, spec.irregularForms)) slots.add(f);
    }
    for (const line of l.canDo || []) {
      const keywords = tokenise(line).map((t) => t.toLowerCase())
        .filter((t) => !spec.functionSet.has(t) && !CANDO_STOPWORDS.has(t));
      // A line whose every word is a function word („… mit hier oder da antworten“) carries no
      // content keyword to match on; it is outside this rule rather than an offender.
      if (!keywords.length) continue;
      const hit = keywords.some((k) => slots.has(k) || [...formsOf({ de: k }, spec.irregularForms)].some((f) => slots.has(f)));
      if (!hit) offenders.push({ nr: l.nr, line });
    }
  }
  return offenders;
}

/**
 * RULE 13: a `sprechen.open` task whose `missionOrder` is null. `SpeakingStage.jsx` appends
 * `&mission=` only when the order is set, so those four Lektionen show a prompt and then send the
 * learner to the generic /speaking page, which never receives it. Listed, ratcheted, and 0 once the
 * prompt itself travels in `saveCourseContext` (DaF review #4, MAJOR 4).
 */
export function missionlessLektionen(c) {
  return (c.lektionen || [])
    .filter((l) => l.sprechen?.open && (l.sprechen.open.missionOrder === null || l.sprechen.open.missionOrder === undefined))
    .map((l) => l.nr);
}


/**
 * RULE 6b: the Notice card may only teach what its own Lektion shows.
 *
 * Every **bold** in `notice.bodyDe` that is a whole word (or a phrase of whole words) must occur
 * in the input of the same Lektion: the dialogue, the pretest model, the Schreiben sample and
 * task, and the card's own two examples. Two things are deliberately NOT reported:
 *   • a bold that is not plain letters — `-te`, `-ste`, `ge- …-t`, `**Sie**:` — an ending or a
 *     schema, not a form;
 *   • a bold that sits INSIDE a word (`teu**rer**`, `billig**er als**`, `gr**öß**er`), which marks
 *     an ending as well: the adjacent character in bodyDe is a letter.
 * The finding it closes (DaF review #1 for A1.2, BLOCKER 2): the Zahlen-Lektion whose dialogue
 * contains no number word at all, and the Akkusativ card titled „den, einen, keinen“ in a Lektion
 * whose ten lines contain neither `den` nor `keinen`.
 */
export function noticeFormsInInput(l) {
  const input = new Set(tokenise([
    ...(l.dialog?.lines || []).map((x) => x.de),
    l.pretest?.model, l.schreiben?.sample, l.schreiben?.taskDe,
    ...(l.notice?.examples || []),
  ].filter(Boolean).join(' ')).map((t) => t.toLowerCase()));
  const body = String(l.notice?.bodyDe || '');
  const missing = [];
  for (const m of body.matchAll(/\*\*(.+?)\*\*/g)) {
    const before = body[m.index - 1] || ' ';
    const after = body[m.index + m[0].length] || ' ';
    if (/[A-Za-zÄÖÜäöüß]/.test(before) || /[A-Za-zÄÖÜäöüß]/.test(after)) continue;   // an ending
    const bold = m[1];
    if (!/^[A-Za-zÄÖÜäöüß ]+$/.test(bold)) continue;                                  // not a form
    const parts = tokenise(bold);
    if (parts.length && !parts.every((t) => input.has(t.toLowerCase()))) missing.push(bold);
  }
  return missing;
}

/** RULE 6b over a whole level. */
export function noticeFormCoverage(c) {
  return (c.lektionen || []).flatMap((l) => noticeFormsInInput(l).map((form) => ({ nr: l.nr, form })));
}

/** The lines a Lektion asks the learner to PRODUCE: the dictation and the read-aloud. */
function productionLines(l) {
  const idx = [...new Set([...(l.hoeren?.lines || []), ...(l.sprechen?.readAloud || [])])]
    .filter((i) => Number.isInteger(i)).sort((a, b) => a - b);
  return idx
    .map((i) => ({ i, de: (l.dialog?.lines || [])[i]?.de }))
    .filter((x) => x.de);
}

/**
 * RULE 15: what the learner PRODUCES must already be explained.
 *
 * `hoeren` is a dictation — the learner types the line — and `sprechen.readAloud` is spoken back,
 * so those two steps are the ones a prompt memorises. DaF review #1 for A1.2 (BLOCKER 3) measured
 * the Dativ pattern firing 23× before Lektion 11, twice of it in a dictation line, and „Ja, ein
 * Balkon“ (nominative) as the typed answer to „… **einen** Balkon?“.
 *
 * Two halves, both driven by the registry. The cumulative half asks that every token of a produced
 * line is taught by that Lektion — the same known set RULE 5 builds, seeded from the previous
 * level. The structural half is the table above: a form that belongs to a slug whose own Lektion
 * comes LATER is a Vorgriff, minus the chunks the level's notice cards licence by name. The
 * structural half is what makes the rule outlive this review: it reads the grammar order, not a
 * list of lines.
 */
export function producedBeforeTaught(c, extraKnown) {
  const spec = levelSpec(c?.level) || LEVELS['a1.1'];
  const known = extraKnown ?? seedVocabulary(spec);
  const taughtIn = new Map();
  (c.lektionen || []).forEach((l) => { if (!taughtIn.has(l.primarySlug)) taughtIn.set(l.primarySlug, l.nr); });
  const offenders = [];
  for (const l of c.lektionen || []) {
    // Grow the known set exactly as RULE 5 does, so „taught by this Lektion“ means the same thing.
    for (const w of l.wortfeld || []) for (const f of formsOf(w, spec.irregularForms)) known.add(f);
    for (const t of tokenise(l.notice?.bodyDe || '')) known.add(t.toLowerCase());
    for (const { i, de } of productionLines(l)) {
      for (const t of tokenise(de)) {
        const low = t.toLowerCase();
        if (known.has(low) || spec.nameSet.has(low)) continue;
        offenders.push({ nr: l.nr, line: i, kind: 'lexis', hit: t, de });
      }
      let text = de;
      for (const chunk of spec.licensedChunks || []) text = text.split(chunk).join(' ');
      for (const [slug, re] of Object.entries(spec.offLimitsForms || {})) {
        const taught = taughtIn.get(slug);
        if (!taught || taught <= l.nr) continue;
        for (const hit of text.match(new RegExp(re.source, re.flags)) || []) {
          offenders.push({ nr: l.nr, line: i, kind: slug, hit: String(hit).trim(), de });
        }
      }
    }
  }
  return offenders;
}

/**
 * The texts a Lektion puts in the learner's OWN MOUTH, verbatim: the dictation lines (typed), the
 * read-aloud lines (spoken and scored by `readaloud.mjs`), the pretest MODEL answer and the
 * Schreiben MODEL text — the two texts the course holds up as „so sagt/schreibt man das“.
 *
 * `pretest.accepted` is deliberately NOT here, and the distinction is the rule's whole point:
 * `accepted` is what the course TOLERATES from the learner („Mein Hobby ist“), and a learner may
 * hit a form before it is taught (CONTRACT §2). What he may not be given is a MODEL built on a
 * construction his course defers.
 */
function producedTexts(l) {
  const lines = l.dialog?.lines || [];
  const at = (i) => (typeof lines[i] === 'string' ? lines[i] : lines[i]?.de);
  const out = [];
  for (const i of l.hoeren?.lines || []) if (at(i)) out.push({ where: `Diktat Zeile ${i}`, text: at(i) });
  for (const i of l.sprechen?.readAloud || []) if (at(i)) out.push({ where: `Vorlesen Zeile ${i}`, text: at(i) });
  if (l.pretest?.model) out.push({ where: 'pretest.model', text: l.pretest.model });
  if (l.schreiben?.sample) out.push({ where: 'schreiben.sample', text: l.schreiben.sample });
  return out;
}

/**
 * RULE 15b: a construction the course DEFERS may not be put in the learner's mouth before it.
 *
 * Same three patterns as the rule-card guard, same module, same „the introducing Lektion comes from
 * `primarySlug`“ rule — see `src/data/curricula/constructions.js` and DaF review #11, MAJOR 3.
 */
export function constructionsBeforeTaught(c, pool = null) {
  const offenders = [];
  for (const l of c.lektionen || []) {
    for (const { where, text } of producedTexts(l)) {
      for (const h of deferredConstructionHits(c, l.nr, text)) {
        offenders.push({ nr: l.nr, where, kind: h.slug, taught: h.taught, hit: h.hit, de: text });
      }
    }
  }
  // THE CHECKPOINTS, where the rule did not run at all (DaF review #13, MAJOR 3). A checkpoint
  // dictation is typed and graded, a checkpoint read-aloud is spoken and scored, and both quote a
  // dialogue line of an EARLIER Lektion — so the window that matters is the checkpoint's own
  // `afterLektion`, not the Lektion the line comes from. `a1.1-cp1-hoeren-3` was „Bitte füllen Sie
  // das Formular aus.“, three Lektionen before the course mentions the Satzklammer.
  for (const cp of c.checkpoints || []) {
    for (const item of buildCheckpoint({ curriculum: c, checkpoint: cp, pool: pool || [] })) {
      if (item.type !== 'dictation' && item.type !== 'read_aloud') continue;
      const text = item.audioText || item.answer || item.text;
      for (const h of deferredConstructionHits(c, cp.afterLektion, text)) {
        offenders.push({ nr: cp.afterLektion, where: `${item.id} (${item.type})`, kind: h.slug, taught: h.taught, hit: h.hit, de: text });
      }
    }
  }
  return offenders;
}

// RULE 16 — a „Sprechen Teil 1“ prompt is a self-introduction. SD1 Teil 1 is nothing else: Name,
// Alter, Land, Wohnort, Sprachen, Beruf, Hobby, plus spelling and the phone number.
// Bare "Name" would let a check-in task ("Melden Sie sich an: Name, Termin") pass as
// Sprechen Teil 1 — the very case A1.2 review #1 BLOCKER 4 is about.
const SELF_INTRO_RE = /vorstellen|Vorname|Wohnort|Beruf/i;

/**
 * The question RULE 16 answers: does the Lektion have a SURFACE for this Teil?
 *
 * DaF review #7, MAJOR 3: the first cut of the rule asked only for `links.listeningExercise` /
 * `links.readingOrder`, i.e. for the link to an EXTERNAL exercise, and therefore reported L5 and
 * L11 — two Lektionen that each carry their own listening surface, the dictation over two dialogue
 * lines, the very surface the Checkpoints build their Hören part from. Two measurement artefacts
 * and one real finding, reported equally loudly, make the ratchet look like a leftover. A Teil is
 * covered when the module has a surface for its family; the family is the first word of the Teil.
 */
const EXAM_TEIL_COVERS = {
  'Hören': (l) => Boolean(l.links?.listeningExercise) || Boolean(l.hoeren?.lines?.length),
  'Lesen': (l) => Boolean(l.links?.readingOrder),
  'Sprechen': (l) => Boolean(l.sprechen?.open || l.sprechen?.readAloud?.length),
  'Schreiben': (l) => Boolean(l.schreiben?.taskKey),
};

const EXAM_TEIL_SURFACE_WHY = {
  'Hören': 'no listening surface: links.listeningExercise is null and hoeren.lines is empty',
  'Lesen': 'no reading surface: links.readingOrder is null',
  'Sprechen': 'no speaking surface: neither sprechen.open nor sprechen.readAloud',
  'Schreiben': 'no writing surface: schreiben.taskKey is unset',
};

/**
 * RULE 16: an `examTeile` claim must be backed by the Lektion that makes it.
 *
 * `examTeile` is the sixth column of the public 12x6 grid (standard §2.4), so it is read before
 * anybody pays. RULE 7 checked one sentence of it — that `sprechen.open.teil` is in the list.
 * This adds the claims nobody checked, in two steps: the Lektion must have a SURFACE for the Teil's
 * family (EXAM_TEIL_COVERS above), and where the Teil names a Textsorte or a task type the surface
 * must be the right one — „Sprechen Teil 1“ either a prompt that asks for a self-introduction or
 * the level's Teil-1 speaking mission, „Schreiben Teil 1“ a Formular and „Schreiben Teil 2“ a
 * Mitteilung.
 */
export function examTeileBacked(c) {
  const spec = levelSpec(c?.level) || LEVELS['a1.1'];
  const teil1 = spec.teil1MissionOrders || [];
  const offenders = [];
  for (const l of c.lektionen || []) {
    const open = l.sprechen?.open || {};
    for (const teil of l.examTeile || []) {
      const family = String(teil).split(' ')[0];
      const covers = EXAM_TEIL_COVERS[family];
      let why = null;
      if (covers && !covers(l)) {
        why = EXAM_TEIL_SURFACE_WHY[family];
      } else if (teil === 'Sprechen Teil 1'
        && !SELF_INTRO_RE.test(open.promptDe || '')
        && !(open.missionOrder !== null && open.missionOrder !== undefined && teil1.includes(open.missionOrder))) {
        why = 'the sprechen.open prompt is no self-introduction and missionOrder is not the level’s Teil-1 mission';
      } else if (teil === 'Schreiben Teil 1' && l.schreiben?.kind !== 'formular') {
        why = `schreiben.kind is "${l.schreiben?.kind}", Teil 1 is a Formular`;
      } else if (teil === 'Schreiben Teil 2' && l.schreiben?.kind !== 'mitteilung') {
        why = `schreiben.kind is "${l.schreiben?.kind}", Teil 2 is a Mitteilung`;
      }
      if (why) offenders.push({ nr: l.nr, teil, why });
    }
  }
  return offenders;
}


// ───────────────────────────────────────────────────────────────────────────────────────────────
// RULE 17 / RULE 18 / RULE 19 — THE TEXTS THE COURSE HOLDS UP AS MODELS (DaF review #12)
//
// Three rules, one subject: `pretest.model` and `schreiben.sample` are the two texts the course
// shows the learner under the words „Modellantwort“ and „Beispieltext“, and a model is read as an
// instruction. Round 12 measured what nobody had measured in twelve rounds: all six Mitteilung
// samples FAILED the form checklist the same screen prints one paragraph above them (14–24 words
// against „25–45 Wörter“), and the RULE-15b repair of the same round had paid for a deferred
// construction with a model that contradicts its own dialogue („Das ist die Schwester. Sie ist
// zwanzig.“ — in the dialogue the BROTHER is twenty).
// ───────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A Formular sample („Vorname: Ana / Familienname: Chakiri / …“) as the `{ field: value }` map
 * `scoreWriting` grades — the same shape `formularText` writes and the player collects, read back.
 * Fields the sample does not fill stay absent, which is exactly what the check must see.
 */
export function formularSampleValues(sample, fields = []) {
  const out = {};
  for (const part of String(sample || '').split(/\s*[/\n]\s*/)) {
    const m = /^\s*([^:]+):\s*(.*)$/.exec(part);
    if (!m) continue;
    const field = (fields || []).find((f) => f.toLowerCase() === m[1].trim().toLowerCase()) || m[1].trim();
    out[field] = m[2].trim();
  }
  return out;
}

/**
 * RULE 17: every Beispieltext passes the form checklist its own screen shows beside it.
 *
 * DERIVED, NEVER RETYPED. The word window and the Leitpunkte come from the writing-task bank
 * (`netlify/functions/_shared/writingTasks.mjs` and its SPA twin) — the file the grader validates
 * against — and the scoring comes from `scoreWriting`, the function `GradedWriting.jsx` calls. The
 * Lektion supplies only the Textsorte. Both branches run: a Mitteilung is graded on length, Anrede,
 * Gruß and every Leitpunkt, a Formular on „is every field filled“.
 *
 * Hard rule, no ratchet: a model text that fails the course's own checklist is never older debt
 * that a later round can pay down — it is a text somebody wrote, and the round that writes it can
 * measure it.
 */
export function modelTextsPassOwnChecklist(c) {
  const offenders = [];
  for (const l of c.lektionen || []) {
    const w = l.schreiben;
    if (!w?.sample) continue;
    const bank = w.taskKey ? writingTaskByKey(c.examKey, w.taskKey) : null;
    if (!bank) continue; // the taskKey/bank checks in validateCurriculum already report this
    const isFormular = w.kind === 'formular';
    const task = {
      kind: w.kind,
      minWords: bank.minWords,
      maxWords: bank.maxWords,
      ...(isFormular ? { fields: bank.leitpunkte || [] } : { leitpunkte: bank.leitpunkte || [] }),
    };
    const value = isFormular ? formularSampleValues(w.sample, bank.leitpunkte || []) : w.sample;
    const res = scoreWriting(task, value);
    for (const check of res.checks) {
      if (check.ok) continue;
      offenders.push({ nr: l.nr, kind: w.kind, key: check.key, label: check.label, count: countWords(w.sample) });
    }
  }
  return offenders;
}

/**
 * The persona facts a model text is REQUIRED to state (RULE 14/RULE 19) — Herkunft, Beruf,
 * Sprachen, Familienstand, Stadt. Read off the level's own persona table, never typed.
 */
function personaWords(spec) {
  const out = new Set();
  const table = PERSONA_TABLES[spec?.personaSource] || {};
  for (const facts of Object.values(table)) {
    for (const v of Object.values(facts || {})) {
      for (const one of Array.isArray(v) ? v : [v]) {
        for (const t of tokenise(String(one || ''))) out.add(t.toLowerCase());
      }
    }
  }
  return out;
}

/**
 * RULE 20: a model text uses only words its own Lektion has taught.
 *
 * Same tokeniser and same per-Lektion snapshots as RULE 11 — see MAX_UNTAUGHT_IN_MODEL_TEXTS above
 * for what licenses a word beyond them (the task's own wording, the persona facts, the letter
 * formulas as chunks).
 */
export function modelTextLexis(c, spec = null) {
  const s = spec || levelSpec(c?.level) || LEVELS['a1.1'];
  const knownUpTo = taughtUpTo(c, s);
  const personas = personaWords(s);
  const offenders = [];
  for (const l of c.lektionen || []) {
    const bank = l.schreiben?.taskKey ? writingTaskByKey(c.examKey, l.schreiben.taskKey) : null;
    const known = new Set([...(knownUpTo.get(l.nr) || []), ...personas]);
    const taskWords = [
      bank?.task, ...(bank?.leitpunkte || []),
      l.schreiben?.taskDe, ...(l.schreiben?.leitpunkte || []),
      l.pretest?.promptDe,
    ].join(' ');
    for (const t of tokenise(taskWords)) known.add(t.toLowerCase());
    for (const [where, text] of [['schreiben.sample', l.schreiben?.sample], ['pretest.model', l.pretest?.model]]) {
      if (!text) continue;
      let stripped = String(text);
      for (const chunk of LICENSED_LETTER_CHUNKS) stripped = stripped.split(chunk).join(' ');
      for (const token of untaughtTokens({ questionDe: '', answer: stripped }, known, s)) {
        offenders.push({ nr: l.nr, where, token, de: text });
      }
    }
  }
  return offenders;
}

/**
 * RULE 21: every Leitpunkt of every writing task is answerable from the lexis of its own Lektion.
 *
 * See MAX_UNANSWERABLE_LEITPUNKTE above for why this rule exists and what it does NOT license.
 * Two offenders are reported and they are different failures:
 *   • `untaught-head` — the head word of a conjunct („**Staatsangehörigkeit**“, „sich **treffen**“)
 *     stands in no Wortfeld, dialogue, notice or item up to this Lektion. The task names something
 *     the learner has no word for, whatever the Beispieltext happens to say.
 *   • `unanswerable` — the Beispieltext answers the Leitpunkt only with words the Lektion has not
 *     taught. This is the one that bites after a RULE-20 repair strikes such a word out.
 */
export function writingTasksAreAnswerable(c, spec = null) {
  const s = spec || levelSpec(c?.level) || LEVELS['a1.1'];
  const knownUpTo = taughtUpTo(c, s);
  const personas = personaWords(s);
  const offenders = [];
  for (const l of c.lektionen || []) {
    const w = l.schreiben;
    if (!w?.sample) continue;
    const bank = w.taskKey ? writingTaskByKey(c.examKey, w.taskKey) : null;
    if (!bank) continue;
    const known = new Set([...(knownUpTo.get(l.nr) || []), ...personas]);
    const foldedKnown = new Set([...known].map(foldWord).filter(Boolean));

    // The Beispieltext as the course's own lexis leaves it: every whitespace word that carries an
    // untaught token is dropped. The letter formulas ride as chunks, exactly as in RULE 20.
    let stripped = String(w.sample);
    for (const chunk of LICENSED_LETTER_CHUNKS) stripped = stripped.split(chunk).join(' ');
    const untaught = new Set(
      untaughtTokens({ questionDe: '', answer: stripped }, known, s).map((t) => t.toLowerCase()),
    );
    const taughtOnly = String(w.sample)
      .split(/\s+/)
      .filter((word) => !tokenise(word).some((t) => untaught.has(t.toLowerCase())))
      .join(' ');

    // A Formular asks with the FIELD LABEL and is answered with the VALUE, so the label is the
    // task's own word and only the value is measured („Material: Wörterbuch, Heft“ — the learner
    // needs `Wörterbuch`, not the word `Material`).
    if (w.kind === 'formular') {
      const values = formularSampleValues(w.sample, bank.leitpunkte || []);
      for (const field of bank.leitpunkte || []) {
        const value = String(values[field] || '').trim();
        if (!value) continue;                                // RULE 17 reports an empty field
        const missing = untaughtTokens({ questionDe: '', answer: value }, known, s);
        if (missing.length) {
          offenders.push({ nr: l.nr, leitpunkt: field, why: 'unanswerable', token: missing[0], de: value });
        }
      }
      continue;
    }

    for (const lp of bank.leitpunkte || []) {
      for (const conj of leitpunktEvidence(lp).conjuncts) {
        // Only a LOWER-CASE head is measured: a German noun head („Ihr **Land**“, „Ihre
        // **Telefonnummer**“) is answered by its shape and the learner never needs the noun itself,
        // but a verb or adjective head („Wann Sie sich **treffen**“) IS the word he must have.
        const head = conj.words[conj.words.length - 1];
        if (!head || !/^[a-zäöüß]/.test(head)) continue;
        if (!foldedKnown.has(foldWord(head))) {
          offenders.push({ nr: l.nr, leitpunkt: lp, why: 'untaught-head', token: head });
        }
      }
      if (leitpunktSatisfied(lp, w.sample) === null) continue;       // „prüft die KI“
      if (leitpunktSatisfied(lp, taughtOnly) !== true) {
        offenders.push({ nr: l.nr, leitpunkt: lp, why: 'unanswerable', de: taughtOnly });
      }
    }
  }
  return offenders;
}

/**
 * RULE 18: the dictation window and the read-aloud window of a Lektion never share a line.
 *
 * Step „Hören und schreiben“ types the line letter by letter and grades it; step „Sprechen“ reads
 * the same line aloud and grades it. Where the two windows meet, one of the nine steps is spent on
 * a sentence the learner has just written out — two skills sold, one rehearsed. Nine of the twelve
 * A1.1 Lektionen keep them apart without being asked, so this is the material's own norm; the three
 * that did not are the ones the RULE-15b window moves of round 12 created without measuring where
 * they landed.
 *
 * Compared as TEXT, not as index: two different indices can carry the same sentence, and an index
 * comparison would not see it.
 */
export function sharedProductionLines(c) {
  const offenders = [];
  for (const l of c.lektionen || []) {
    const lines = l.dialog?.lines || [];
    const at = (i) => String((typeof lines[i] === 'string' ? lines[i] : lines[i]?.de) || '').trim();
    const dictated = new Map();
    for (const i of l.hoeren?.lines || []) if (at(i)) dictated.set(at(i), i);
    for (const i of l.sprechen?.readAloud || []) {
      const text = at(i);
      if (text && dictated.has(text)) {
        offenders.push({ nr: l.nr, dictation: dictated.get(text), readAloud: i, de: text });
      }
    }
  }
  return offenders;
}

// ── RULE 19 — a model text may not contradict its own dialogue ─────────────────────────────────
//
// RULE 14 holds the facts of the recurring CHARACTERS across the whole level. This is the same
// question one Lektion wide and for the things as well as the people: the dialogue of the Lektion
// is the world the learner has just read, and the model answer printed four screens later is read
// as being about that world. The facts are not typed here either — they are read off the dialogue.
const FACT_VERBS = new Set(['ist', 'sind', 'kostet', 'kosten']);
const NUMBER_WORDS = [
  'null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
  'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn',
  'neunzehn', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig',
  'neunzig', 'hundert',
];
const NUMBER_SET = new Set(NUMBER_WORDS);
const isNumber = (t) => /^\d{1,4}$/.test(t) || NUMBER_SET.has(t.toLowerCase());
// Words that may stand between the verb and the value without being the value. The level's own
// FUNCTION_WORDS list does the rest of this work (see `factPairs`), so „die Party ist **um** acht
// Uhr“ files the number and not the preposition.
const HEDGES = new Set(['noch', 'auch', 'sehr', 'nicht', 'schon', 'wieder', 'immer', 'heute', 'so', 'ganz']);

/**
 * The level's own adjectives: a Wortfeld entry with no article, written small, one word, not an
 * infinitive. This is what „Eigenschaft“ means for RULE 19 — jung, alt, teuer, rot, pünktlich —
 * and it is read off the Wortfeld rather than listed here, so a level that teaches another one
 * gets it for free. A value that is neither a number nor one of these is no fact the rule judges:
 * „die Party ist um acht **Uhr**“ states a time, „die Party ist bestimmt **schön**“ an opinion,
 * and neither contradicts the other.
 */
function levelAdjectives(c) {
  const out = new Set();
  for (const l of c.lektionen || []) {
    for (const w of l.wortfeld || []) {
      const de = String(w.de || '');
      if (w.article || /\s/.test(de) || !/^[a-zäöüß]/.test(de) || /en$/.test(de)) continue;
      out.add(de.toLowerCase());
    }
  }
  return out;
}

/** Every noun the level names, with its gender — the antecedent table for er/sie/es. */
function nounGenders(c) {
  const genders = new Map();
  const plurals = [];
  for (const l of c.lektionen || []) {
    for (const w of l.wortfeld || []) {
      if (!w.article || !w.word) continue;
      const g = w.article === 'der' ? 'm' : w.article === 'die' ? 'f' : 'n';
      genders.set(String(w.word).toLowerCase(), g);
      if (w.plural) plurals.push(String(w.plural).toLowerCase());
    }
  }
  // „sie“ is the plural pronoun too — but a plural that spells like its own singular must not
  // overwrite the singular's gender: `der Euro` has the plural `Euro`, and writing it back as
  // feminine made „Sie kostet acht **Euro**“ resolve to the currency instead of to the Lampe.
  for (const p of plurals) if (!genders.has(p)) genders.set(p, 'f');
  return genders;
}

// The value window is THREE tokens, not „to the end of the clause“: „Der Stuhl kostet zwölf Euro
// und die Lampe kostet acht Euro.“ is one sentence with two facts, and a greedy window would
// swallow the second one whole and never see it.
const SUBJ_RE = /\b(?:(?:der|die|das|den|dem|ein|eine|einen|mein|meine|dein|deine|ihr|ihre)\s+)?([A-ZÄÖÜ][a-zäöüß]+|[EeSs]r|[Ss]ie|[Ee]s)\s+(ist|sind|kostet|kosten)\s+((?:[^\s,.;!?]+\s*){0,3})/g;

/**
 * The (subject, value) pairs a text states, with the pronouns resolved.
 *
 * `er`/`sie`/`es` bind to the last noun of matching gender the text has already named — which is
 * how „Das ist eine Lampe. Sie kostet acht Euro.“ files a price under `Lampe`, and how the L3
 * dialogue files `zwanzig` under `Bruder` although the sentence says „Er“.
 */
function factPairs(text, genders, functionSet = new Set(), adjectives = new Set()) {
  const pairs = [];
  const mentions = [];
  for (const sentence of String(text || '').match(/[^.?!]+[.?!]*/g) || []) {
    for (const m of sentence.matchAll(/\b([A-ZÄÖÜ][a-zäöüß]+)\b/g)) {
      const key = m[1].toLowerCase();
      if (genders.has(key)) mentions.push({ noun: key, gender: genders.get(key) });
    }
    for (const m of sentence.matchAll(new RegExp(SUBJ_RE.source, SUBJ_RE.flags))) {
      const [, rawSubject, verb, rest] = m;
      if (!FACT_VERBS.has(verb)) continue;
      let subject = null;
      const low = rawSubject.toLowerCase();
      if (low === 'er' || low === 'sie' || low === 'es') {
        const want = low === 'er' ? 'm' : low === 'sie' ? 'f' : 'n';
        const hit = [...mentions].reverse().find((x) => x.gender === want);
        subject = hit ? hit.noun : null;
      } else if (genders.has(low)) {
        subject = low;
      }
      if (!subject) continue;
      const tokens = String(rest).trim().split(/\s+/)
        .map((t) => t.replace(/[^A-Za-zÄÖÜäöüß0-9]/g, ''))
        .filter((t) => t && !HEDGES.has(t.toLowerCase())
          && (isNumber(t) || !functionSet.has(t.toLowerCase())));
      // The first token that IS a fact: a number, or one of the level's own adjectives. Anything
      // else the sentence puts after „ist“ is a phrase this rule does not read as a fact.
      const value = tokens.find((t) => isNumber(t) || adjectives.has(t.toLowerCase()));
      if (!value) continue;
      pairs.push({ subject, value, family: isNumber(value) ? 'zahl' : 'eigenschaft', verb });
    }
  }
  return pairs;
}

/**
 * RULE 19: a model text states nothing its own dialogue states otherwise.
 *
 * Two directions, both measured over the pairs above:
 *   (a) the model gives a NUMBER to a subject the dialogue does not give it to, while the dialogue
 *       gives that number to somebody else — the L3 case, where „zwanzig“ belongs to the Bruder;
 *   (b) the model gives a subject a value of a kind the dialogue has already fixed differently —
 *       „die Lampe kostet vier Euro“ under a dialogue that says „Sie kostet acht Euro“.
 * Values the dialogue never mentions are silent: a model may add („Er ist Student.“), it may not
 * overturn. Hard rule — like RULE 14, a contradiction is always something a round just wrote.
 */
export function modelTextsMatchDialogue(c) {
  const spec = levelSpec(c?.level) || LEVELS['a1.1'];
  const functionSet = spec.functionSet || new Set();
  const genders = nounGenders(c);
  const adjectives = levelAdjectives(c);
  const offenders = [];
  for (const l of c.lektionen || []) {
    const dialogText = (l.dialog?.lines || [])
      .map((x) => (typeof x === 'string' ? x : x?.de)).filter(Boolean).join(' ');
    const dialogPairs = factPairs(dialogText, genders, functionSet, adjectives);
    if (!dialogPairs.length) continue;
    const bySubject = new Map();
    const byValue = new Map();
    for (const p of dialogPairs) {
      const key = `${p.subject}|${p.family}|${p.verb}`;
      if (!bySubject.has(key)) bySubject.set(key, new Set());
      bySubject.get(key).add(p.value.toLowerCase());
      if (!byValue.has(p.value.toLowerCase())) byValue.set(p.value.toLowerCase(), new Set());
      byValue.get(p.value.toLowerCase()).add(p.subject);
    }
    const models = [
      ...(l.pretest?.model ? [{ where: 'pretest.model', text: l.pretest.model }] : []),
      ...(l.schreiben?.sample ? [{ where: 'schreiben.sample', text: l.schreiben.sample }] : []),
    ];
    for (const { where, text } of models) {
      for (const p of factPairs(text, genders, functionSet, adjectives)) {
        const value = p.value.toLowerCase();
        const owners = byValue.get(value);
        if (p.family === 'zahl' && owners && !owners.has(p.subject)) {
          offenders.push({
            nr: l.nr, where, subject: p.subject, value: p.value,
            why: `im Dialog gehört „${p.value}“ zu ${[...owners].join('/')}`,
          });
          continue;
        }
        const stated = bySubject.get(`${p.subject}|${p.family}|${p.verb}`);
        if (stated && !stated.has(value)) {
          offenders.push({
            nr: l.nr, where, subject: p.subject, value: p.value,
            why: `im Dialog ${p.verb} ${p.subject} „${[...stated].join('/')}“`,
          });
        }
      }
    }
  }
  return offenders;
}

// ───────────────────────────────────────────────────────────────────────────────────────────────
// RULE 14 — PERSONA CONSISTENCY (DaF review #5, MAJOR 12)
//
// The course is carried by a handful of recurring characters, and a learner meets the same person
// twice in one sitting: Ana speaks the dialogue of Lektion 3 (she also reads two of its lines
// aloud) and then fills in the Formular of Lektion 3. Round 5 satisfied the RULE 10 coverage
// ratchet by pushing the missing word „der Mann“ into a dialogue line — „Ja, ein Baby. Mein Mann
// und ich kommen aus Marokko.“ — which makes Ana married, while the Formular of the same Lektion
// and the Mitteilung of Lektion 2 both say **ledig**. „Der Widerspruch ist sonst nur mit dem Auge
// zu finden“, so this is the table that finds it.
//
// The facts below are READ OFF a11.js (dialogues, settings, schreiben tasks, samples and fields),
// not invented; `null` means the course never states that fact about the person, and then there is
// nothing to contradict and the check stays silent. This is a hard gate, not a ratchet: a
// contradiction is never older debt, it is always something a repair round just wrote.
// ───────────────────────────────────────────────────────────────────────────────────────────────

const MARITAL = ['ledig', 'verheiratet', 'geschieden'];
const COUNTRIES = [
  'Marokko', 'Deutschland', 'Österreich', 'Schweiz', 'Italien', 'Spanien', 'Polen', 'Türkei',
  'Syrien', 'Frankreich', 'Portugal', 'Griechenland', 'Russland', 'Ukraine', 'Indien', 'China',
  'Japan', 'Ägypten', 'Tunesien', 'Algerien', 'England', 'Brasilien',
];
const LANGUAGES = [
  'Arabisch', 'Deutsch', 'Englisch', 'Französisch', 'Spanisch', 'Italienisch', 'Türkisch',
  'Russisch', 'Polnisch', 'Chinesisch', 'Portugiesisch',
];
// The Wohnorte the two courses name. A city is a fact a Formular files, so it is checked like the
// other four — „Stadt: Köln“ under a Steckbrief that says Bremen is the same error as „verheiratet“
// under a Formular that says ledig.
const CITIES = ['Bremen', 'Berlin', 'Köln', 'Hamburg', 'München', 'Wien', 'Zürich', 'Frankfurt', 'Leipzig', 'Dresden'];
const PROFESSIONS = [
  'Student', 'Studentin', 'Kellner', 'Kellnerin', 'Ingenieur', 'Ingenieurin', 'Lehrer', 'Lehrerin',
  'Arzt', 'Ärztin', 'Verkäufer', 'Verkäuferin', 'Sekretär', 'Sekretärin', 'Koch', 'Köchin',
  'Chef', 'Chefin',
];

/**
 * A1.1 — the recurring characters and the facts the course states about them.
 *   Ana Chakiri   L1, L2, L3, L6, L8, L9, L10, L12 — ledig (L3 Formular, L2 Mustertext), aus
 *                 Marokko (L1/L3 Aufgabentext, L2 Mustertext), Studentin (L2 Dialog), spricht
 *                 Arabisch und Deutsch (L1/L3 Aufgabentext). Sie arbeitet ab L6 im Bürgerbüro —
 *                 das ist ein Arbeitsplatz, kein zweiter Beruf, deshalb bleibt `beruf` Studentin.
 *   Lena Brandt   L3, L5, L7, L8, L11, L12 — Kursteilnehmerin (Kurs A1, Zimmer 12), Hobby Sport
 *                 und Schwimmen. Familienstand, Herkunft und Beruf sagt der Kurs nie: null.
 *   Tim Berger    L4, L5, L7, L11 — Kursteilnehmer (Kurs am Donnerstag). Ebenfalls nichts gesagt.
 *   Herr Weber    L2, L6 — „vom Amt“, Schalter im Bürgerbüro; kein Berufswort genannt.
 *   Frau Kaya     L1 — Rezeption im Hostel; kein Berufswort genannt.
 *   Paul          L9 — Kellner im Café (dialog.setting).
 *   Frau Wolf     L4 — verkauft auf dem Flohmarkt.  Herr Schmidt  L10 — Auskunft am Bahnhof.
 */
export const PERSONAS_A11 = {
  Ana: { familienstand: 'ledig', herkunft: 'Marokko', beruf: ['Studentin'], sprachen: ['Arabisch', 'Deutsch'] },
  Lena: { familienstand: null, herkunft: null, beruf: null, sprachen: null },
  Tim: { familienstand: null, herkunft: null, beruf: null, sprachen: null },
  Paul: { familienstand: null, herkunft: null, beruf: ['Kellner'], sprachen: null },
  'Herr Weber': { familienstand: null, herkunft: null, beruf: null, sprachen: null },
  'Frau Kaya': { familienstand: null, herkunft: null, beruf: null, sprachen: null },
  'Frau Wolf': { familienstand: null, herkunft: null, beruf: null, sprachen: null },
  'Herr Schmidt': { familienstand: null, herkunft: null, beruf: null, sprachen: null },
};

/**
 * A1.2 — the same cast one half-level on, plus the characters A1.2 introduces. Spread from
 * PERSONAS_A11 on purpose (DaF review #1 for A1.2, BLOCKER 1): A1.2's `DIALOG_NAMES` is A1.1's
 * list extended, so these are the same people, and an A1.2 line must not be able to overturn a
 * fact A1.1 already stated and grades against. Every fact below is READ OFF a12.js; `null` means
 * A1.2 never states it.
 *   Ana Chakiri   L1, L2, L3, L4, L6, L7, L9, L10, L12 — everything A1.1 says (ledig, aus Marokko,
 *                 Studentin, Arabisch und Deutsch), plus `stadt: 'Bremen'` from the Formular of L1
 *                 („Ana Chakiri wohnt in Bremen am Platz 4“) and L3. Her flight to Marokko in L9 is
 *                 a journey, not a second Herkunft, and the Reise-Formular names no Wohnort.
 *   Lena          L3, L5, L7, L8, L10, L11, L12 — `alter: 24` and `stadt: 'Köln'` from the
 *                 Steckbrief of L7 („Lena Berg ist 24 Jahre alt und kommt aus Köln“). Familienstand,
 *                 Herkunftsland, Beruf and Sprachen: A1.2 never says, so they stay A1.1's nulls.
 *   Tim           L5, L8, L11 — the Ausflug-Formular of L5 files him travelling TO Köln, which is a
 *                 destination and not a Wohnort, so `stadt` stays null and the line cannot collide.
 *   Frau Berger   L6 — Ärztin (`dialog.setting`: „Frau Berger ist Ärztin.“).
 *   Frau Fischer  L1 — „wohnt in der Stadt“; no city and no Berufswort is ever named.
 *   Herr Berg     L2 — the Vermieter of the Wohnungsanzeige; „Vermieter“ is not a Berufswort the
 *                 table knows, so nothing is claimed.
 *   Frau Kaya     L4 (Rezeption im Hotel) and Herr Schmidt L9 (Bahnhof) keep A1.1's empty rows.
 */
export const PERSONAS_A12 = {
  ...PERSONAS_A11,
  Ana: { ...PERSONAS_A11.Ana, stadt: 'Bremen', alter: null },
  Lena: { ...PERSONAS_A11.Lena, stadt: 'Köln', alter: 24 },
  Tim: { ...PERSONAS_A11.Tim, stadt: null, alter: null },
  'Frau Berger': { familienstand: null, herkunft: null, beruf: ['Ärztin'], sprachen: null, stadt: null, alter: null },
  'Frau Fischer': { familienstand: null, herkunft: null, beruf: null, sprachen: null, stadt: null, alter: null },
  'Herr Berg': { familienstand: null, herkunft: null, beruf: null, sprachen: null, stadt: null, alter: null },
};

/** The per-level persona tables, keyed by the registry row's `personaSource`. */
export const PERSONA_TABLES = { 'a1.1': PERSONAS_A11, 'a1.2': PERSONAS_A12 };

const alt = (list) => list.join('|');
// SELF — the person asserts something about themselves: a dialogue line they speak, or the
// Mitteilung they sign. Only first-person frames, so „Ihr Kollege ist Ingenieur“ (Herr Weber about
// a third person) and „er spricht Englisch“ (Ana about her brother) are not read as self-reports.
const SELF_PATTERNS = [
  ['familienstand', new RegExp(`\\bich\\s+bin\\s+(${alt(MARITAL)})\\b`, 'gi')],
  ['herkunft', new RegExp(`\\bich\\s+komme\\s+(?:auch\\s+)?aus\\s+(${alt(COUNTRIES)})\\b`, 'gi')],
  ['beruf', new RegExp(`\\bich\\s+bin\\s+(?:von\\s+Beruf\\s+)?(${alt(PROFESSIONS)})\\b`, 'gi')],
  ['beruf', new RegExp(`\\bich\\s+arbeite\\s+als\\s+(${alt(PROFESSIONS)})\\b`, 'gi')],
  ['sprachen', new RegExp(`\\bich\\s+spreche\\s+([^.?!]*)`, 'gi')],
  ['stadt', new RegExp(`\\bich\\s+wohne\\s+in\\s+(${alt(CITIES)})\\b`, 'gi')],
  ['alter', new RegExp(`\\bich\\s+bin\\s+(\\d{1,2})\\s+Jahre\\s+alt\\b`, 'gi')],
];
// ABOUT — a text that is about the person: a Formular task that names them, a dialogue line or
// setting that names them, the fields of such a task. Third-person and form-field frames.
const ABOUT_PATTERNS = [
  ['familienstand', new RegExp(`\\b(?:ist|bin|sind)\\s+(${alt(MARITAL)})\\b`, 'gi')],
  ['familienstand', new RegExp(`\\bFamilienstand\\s*:\\s*(${alt(MARITAL)})\\b`, 'gi')],
  ['herkunft', new RegExp(`\\b(?:kommt|komme|kommen)\\s+(?:auch\\s+)?aus\\s+(${alt(COUNTRIES)})\\b`, 'gi')],
  ['herkunft', new RegExp(`\\bLand\\s*:\\s*(${alt(COUNTRIES)})\\b`, 'gi')],
  ['beruf', new RegExp(`\\b(?:ist|bin|sind)\\s+(?:von\\s+Beruf\\s+)?(${alt(PROFESSIONS)})\\b`, 'gi')],
  ['sprachen', new RegExp(`\\b(?:spricht|spreche|sprechen)\\s+([^.?!]*)`, 'gi')],
  ['sprachen', new RegExp(`\\bSprachen?\\s*:\\s*([^/]*)`, 'gi')],
  ['stadt', new RegExp(`\\b(?:wohnt|wohne|wohnen|kommt|komme|kommen)\\s+(?:in|aus)\\s+(${alt(CITIES)})\\b`, 'gi')],
  ['stadt', new RegExp(`\\bStadt\\s*:\\s*(${alt(CITIES)})\\b`, 'gi')],
  ['alter', new RegExp(`\\b(?:ist|bin)\\s+(\\d{1,2})\\s+Jahre\\s+alt\\b`, 'gi')],
  ['alter', new RegExp(`\\bAlter\\s*:\\s*(\\d{1,2})\\b`, 'gi')],
];
// „Mein Mann“ / „meine Frau“ carry no captured value — they simply make the speaker married, which
// is what the round-5 line did to Ana.
const SPOUSE_RE = /\b(?:mein\s+Mann|meine\s+Frau)\b/i;

/** The persona a Mitteilung is signed by: the name after the closing Gruß. */
const signatureName = (sample) => {
  const m = /(?:Grüße|Gruß|Tschüss|Bis bald|Bis morgen|Bis später)[,!\s]*([A-ZÄÖÜ][\wÄÖÜäöüß]*)/.exec(String(sample || ''));
  return m ? m[1] : null;
};

/** Does this text name the persona? „Herr Weber“ by both words, „Ana“ not inside „Anas“. */
const namesPersona = (text, name) => new RegExp(`\\b${name.replace(' ', '\\s+')}\\b`).test(String(text || ''));

/**
 * The part of a text that is ABOUT one persona. When the text names exactly one of them, all of it
 * is — „Ana Chakiri ist ledig. **Sie** kommt aus Marokko.“ continues with a pronoun and must still
 * be read as Ana. When it names two („Ana sitzt im Café. Paul ist Kellner.“), only the sentences
 * that name the person are, or Ana becomes a Kellner.
 */
function aboutSpan(text, name, allNames) {
  const s = String(text || '');
  if (!namesPersona(s, name)) return '';
  const named = allNames.filter((n) => namesPersona(s, n));
  if (named.length <= 1) return s;
  return (s.match(/[^.?!]+[.?!]*/g) || []).filter((sentence) => namesPersona(sentence, name)).join(' ');
}

/**
 * RULE 14: no dialogue line and no Schreiben text may state a fact about a recurring character
 * that contradicts the PERSONAS table. Returns one entry per contradiction.
 */
export function personaConsistency(c) {
  const spec = levelSpec(c?.level) || LEVELS['a1.1'];
  const personas = PERSONA_TABLES[spec.personaSource] || {};
  const names = Object.keys(personas);
  if (!names.length) return [];
  const offenders = [];
  const report = (nr, where, name, fact, found, expected) => offenders.push({
    nr, where, name, fact, found, expected,
  });

  const check = (nr, where, name, text, patterns) => {
    const p = personas[name];
    if (!p || !text) return;
    const s = String(text);
    for (const [fact, re] of patterns) {
      const expected = p[fact];
      if (!expected) continue;
      for (const m of s.matchAll(new RegExp(re.source, re.flags))) {
        const value = m[1] || '';
        if (fact === 'sprachen') {
          // The span after „spricht“ / „Sprachen:“ may name several languages.
          for (const lang of LANGUAGES) {
            if (new RegExp(`\\b${lang}\\b`).test(value) && !expected.includes(lang)) {
              report(nr, where, name, fact, lang, expected.join(', '));
            }
          }
          continue;
        }
        const ok = Array.isArray(expected) ? expected.includes(value) : String(expected).toLowerCase() === value.toLowerCase();
        if (!ok) report(nr, where, name, fact, value, Array.isArray(expected) ? expected.join(', ') : expected);
      }
    }
    if (p.familienstand && p.familienstand !== 'verheiratet' && SPOUSE_RE.test(s)) {
      report(nr, where, name, 'familienstand', SPOUSE_RE.exec(s)[0], p.familienstand);
    }
  };

  for (const l of c.lektionen || []) {
    for (const [i, line] of (l.dialog?.lines || []).entries()) {
      check(l.nr, `dialog line ${i} (${line.speaker})`, line.speaker, line.de, SELF_PATTERNS);
      for (const name of names) {
        if (name === line.speaker) continue;
        check(l.nr, `dialog line ${i}`, name, aboutSpan(line.de, name, names), ABOUT_PATTERNS);
      }
    }
    for (const name of names) {
      check(l.nr, 'dialog.setting', name, aboutSpan(l.dialog?.setting, name, names), ABOUT_PATTERNS);
    }
    const w = l.schreiben || {};
    // A Formular task names the person it is about („Ana Chakiri ist ledig. Sie kommt aus …“), so
    // the whole task — text, sample and fields — is read as being about that person.
    const about = [w.taskDe, w.sample, ...(w.fields || []), ...(w.leitpunkte || [])].filter(Boolean);
    for (const name of names) {
      if (!namesPersona(w.taskDe, name)) continue;
      // The task named exactly this person, so the whole block — task, sample, fields — is about
      // them, except in a text that also names somebody else.
      for (const t of about) {
        const others = names.filter((n) => n !== name && namesPersona(t, n));
        check(l.nr, 'schreiben', name, others.length ? aboutSpan(t, name, names) : t, ABOUT_PATTERNS);
      }
    }
    // A Mitteilung is written in the first person by whoever signs it.
    const author = signatureName(w.sample);
    if (author && personas[author]) check(l.nr, 'schreiben.sample', author, w.sample, SELF_PATTERNS);
  }
  return offenders;
}

const words = (s) => String(s).trim().split(/\s+/).filter(Boolean);

export function validateCurriculum(c, extraItems, poolItems) {
  const errors = [];
  const fail = (msg) => errors.push(msg);
  const L = c.lektionen || [];
  const spec = levelSpec(c?.level);
  if (!spec) return [`level "${c?.level}" is not registered in LEVELS — add its row before validating`];
  extraItems = extraItems ?? loadExtraItems(spec.level);
  poolItems = poolItems ?? loadPoolItems(spec.level);

  // ---- RULE 8 (shape + hours) -------------------------------------------------------------
  if (c.code !== spec.code) fail(`level/code must be ${spec.level} / ${spec.code}`);
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
    const id = `${spec.level}-l${String(i + 1).padStart(2, '0')}`;
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
    for (const kw of spec.situationKeywords[i] || []) {
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
    for (const g of gs) if (!spec.grammarSlugs.includes(g)) fail(`Lektion ${l.nr}: unknown grammar slug "${g}"`);
    if (!gs.includes(l.primarySlug)) fail(`Lektion ${l.nr}: primarySlug "${l.primarySlug}" not in grammarSlugs`);
    primaryCount.set(l.primarySlug, (primaryCount.get(l.primarySlug) || 0) + 1);
  });
  for (const g of spec.grammarSlugs) {
    const n = primaryCount.get(g) || 0;
    if (n !== 1) fail(`grammar slug "${g}" is primary in ${n} Lektionen, expected exactly 1`);
  }
  L.forEach((l, i) => {
    if (l.primarySlug !== spec.primaryOrder[i]) fail(`Lektion ${l.nr}: primarySlug "${l.primarySlug}" breaks the taught order (expected "${spec.primaryOrder[i]}")`);
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
  if (seenWords.size < spec.minUnionWords) fail(`union of all Wortfelder is ${seenWords.size} words, expected ≥ ${spec.minUnionWords}`);
  if (total && withId / total < 0.7) fail(`only ${withId}/${total} Wortfeld entries carry a wordId (min 70 %)`);

  // ---- RULE 5 (dialogue) ---------------------------------------------------------------------
  const known = seedVocabulary(spec);
  L.forEach((l) => {
    for (const w of l.wortfeld || []) for (const f of formsOf(w, spec.irregularForms)) known.add(f);
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
    const re = spec.primaryPatterns[l.primarySlug];
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
      if (!Number.isInteger(open.missionOrder) || open.missionOrder < 1 || open.missionOrder > spec.missionCount) fail(`Lektion ${l.nr}: missionOrder ${open.missionOrder} is not a published ${spec.code} mission (1–${spec.missionCount}) or null`);
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
    // The sample's length is RULE 17's business and RULE 17 reads the BANK. The constant that used
    // to stand here — „longer than 30 words“ — was a third number beside the two real ones, and it
    // contradicted them: the window is 25–45, so a compliant 35-word Mitteilung failed the
    // validator and only texts BELOW the learner's own minimum passed it (DaF review #12, MAJOR 1).
    // The Schreiben task is graded by netlify/functions/evaluate-writing.mjs, which
    // looks the prompt up in the task bank by exam_key + task_key and never trusts
    // client text. So a taskKey that does not resolve — or resolves to a task whose
    // register/Leitpunkte disagree with this Lektion — means the learner would be
    // graded against a different exercise than the screen shows them.
    if (!w.taskKey) fail(`Lektion ${l.nr}: schreiben needs a taskKey into the writing task bank`);
    const expectedKey = `${spec.taskKeyPrefix}-l${String(l.nr).padStart(2, '0')}`;
    if (w.taskKey && w.taskKey !== expectedKey) fail(`Lektion ${l.nr}: schreiben.taskKey must be "${expectedKey}"`);
    const bank = w.taskKey ? writingTaskByKey(c.examKey, w.taskKey) : null;
    if (w.taskKey && !bank) fail(`Lektion ${l.nr}: schreiben.taskKey "${w.taskKey}" resolves to no ${c.examKey} task`);
    if (bank) {
      if (bank.course !== spec.level) fail(`Lektion ${l.nr}: bank task ${w.taskKey} is not marked course:'${spec.level}'`);
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
      if (!Number.isInteger(li.listeningExercise) || li.listeningExercise < 1 || li.listeningExercise > spec.listeningCount) fail(`Lektion ${l.nr}: listeningExercise ${li.listeningExercise} is not an existing ${spec.code} exercise (1–${spec.listeningCount})`);
      if (listenings.has(li.listeningExercise)) fail(`listening exercise ${li.listeningExercise} is linked from Lektion ${listenings.get(li.listeningExercise)} and ${l.nr}`);
      listenings.set(li.listeningExercise, l.nr);
    }
    if (li.readingOrder !== null) {
      if (!Number.isInteger(li.readingOrder) || li.readingOrder < 1 || li.readingOrder > spec.readingCount) fail(`Lektion ${l.nr}: readingOrder ${li.readingOrder} is not an existing ${spec.code} reading lesson (1–${spec.readingCount})`);
      if (readings.has(li.readingOrder)) fail(`reading lesson ${li.readingOrder} is linked from Lektion ${readings.get(li.readingOrder)} and ${l.nr}`);
      readings.set(li.readingOrder, l.nr);
    }

    const pr = l.practiceRule || {};
    if (!(pr.topics || []).length) fail(`Lektion ${l.nr}: practiceRule needs topics`);
    const practiceOnly = spec.practiceOnlyTopics || [];
    for (const t of pr.topics || []) {
      if ((l.grammarSlugs || []).includes(t) || practiceOnly.includes(t)) continue;
      fail(`Lektion ${l.nr}: practiceRule topic "${t}" is in neither grammarSlugs nor practiceOnlyTopics`);
    }
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
  const r = spec.ratchets;
  const uncovered = wortfeldCoverage(c, extraItems);
  if (uncovered.length > r.uncoveredWortfeld) {
    fail(`RULE 10: ${uncovered.length} Wortfeld entries occur in no input of their Lektion, ratchet is ${r.uncoveredWortfeld} — ${uncovered.map((u) => `L${u.nr} ${u.de}`).join(', ')}`);
  }
  const untaught = itemLexis(c, extraItems, poolItems);
  if (untaught.length > r.untaughtItemTokens) {
    fail(`RULE 11: ${untaught.length} untaught tokens across the whole pool, ratchet is ${r.untaughtItemTokens} — ${untaught.map((o) => `${o.id}:${o.token}`).join(', ')}`);
  }
  const drawnUntaught = drawnLexis(c, extraItems, poolItems);
  if (drawnUntaught.length > r.untaughtDrawnTokens) {
    fail(`RULE 11b: ${drawnUntaught.length} untaught tokens in items the learner is served, ratchet is ${r.untaughtDrawnTokens} — ${drawnUntaught.map((o) => `L${o.nr} ${o.id}:${o.token}`).join(', ')}`);
  }

  // ---- RULE 12 (can-dos are rehearsed, hard rule — no ratchet) and RULE 13 (the speaking prompt
  // travels) -------------------------------------------------------------------------------------
  const unrehearsed = canDoRehearsal(c, extraItems);
  if (unrehearsed.length > 0) {
    fail(`RULE 12: ${unrehearsed.length} can-do lines no exercise slot of their Lektion rehearses (hard rule, no ratchet) — ${unrehearsed.map((u) => `L${u.nr} „${u.line}“`).join(', ')}`);
  }
  const missionless = missionlessLektionen(c);
  if (missionless.length > r.missionlessLektionen) {
    fail(`RULE 13: ${missionless.length} Lektionen have a sprechen.open without missionOrder, ratchet is ${r.missionlessLektionen} — ${missionless.map((nr) => `L${nr}`).join(', ')}`);
  }

  // ---- RULE 6b / 15 / 16 (DaF review #1 for A1.2, BLOCKER 2-4) ----------------------------------
  const unexemplified = noticeFormCoverage(c);
  if (unexemplified.length > r.unexemplifiedNoticeForms) {
    fail(`RULE 6b: ${unexemplified.length} bolded Notice forms occur in no input of their Lektion, ratchet is ${r.unexemplifiedNoticeForms} — ${unexemplified.map((u) => `L${u.nr} „${u.form}“`).join(', ')}`);
  }
  const produced = producedBeforeTaught(c);
  if (produced.length > r.untaughtInProduction) {
    fail(`RULE 15: ${produced.length} forms in dictation/read-aloud lines the course teaches later, ratchet is ${r.untaughtInProduction} — ${produced.map((o) => `L${o.nr}/${o.line} ${o.kind} „${o.hit}“`).join(', ')}`);
  }
  const constructions = constructionsBeforeTaught(c, poolItems);
  if (constructions.length > r.deferredConstructions) {
    fail(`RULE 15b: ${constructions.length} deferred constructions in lines the learner produces, ratchet is ${r.deferredConstructions} — ${constructions.map((o) => `L${o.nr} ${o.where} [${o.kind}→${o.taught ? `L${o.taught}` : 'nie gelehrt'}] „${o.hit}“`).join(', ')}`);
  }
  const unbacked = examTeileBacked(c);
  if (unbacked.length > r.unbackedExamTeile) {
    fail(`RULE 16: ${unbacked.length} examTeile claims nothing in their Lektion backs, ratchet is ${r.unbackedExamTeile} — ${unbacked.map((o) => `L${o.nr} „${o.teil}“ (${o.why})`).join(', ')}`);
  }

  // ---- RULE 17 / 18 / 19 (the model texts, DaF review #12) --------------------------------------
  // RULE 19 is hard (like RULE 14: a contradiction is always something a round just wrote). RULE 17
  // and RULE 18 are hard at A1.1 too — their A1.1 ratchets are 0 and 1, and the 1 is the L3
  // dialogue shortage documented at MAX_SHARED_PRODUCTION_LINES, not a tolerance.
  const modelChecks = modelTextsPassOwnChecklist(c);
  if (modelChecks.length > (r.modelChecklistBreaks ?? 0)) {
    fail(`RULE 17: ${modelChecks.length} Formprüfungen, die die Beispieltexte selbst nicht bestehen, Ratchet ist ${r.modelChecklistBreaks ?? 0} — ${modelChecks.map((o) => `L${o.nr} ${o.key} („${o.label}“, ${o.count} Wörter)`).join(', ')}`);
  }
  const shared = sharedProductionLines(c);
  if (shared.length > (r.sharedProductionLines ?? 0)) {
    fail(`RULE 18: ${shared.length} Lektionen diktieren und lesen dieselbe Zeile vor, Ratchet ist ${r.sharedProductionLines ?? 0} — ${shared.map((o) => `L${o.nr} Zeile ${o.dictation}/${o.readAloud} „${o.de}“`).join(', ')}`);
  }
  for (const o of modelTextsMatchDialogue(c)) {
    fail(`RULE 19: Lektion ${o.nr} ${o.where}: „${o.subject} … ${o.value}“ widerspricht dem eigenen Dialog — ${o.why}`);
  }

  // ---- RULE 20 (the model texts' LEXIS, DaF review #13, MAJOR 2) --------------------------------
  const modelWords = modelTextLexis(c, spec);
  if (modelWords.length > (r.untaughtInModelTexts ?? 0)) {
    fail(`RULE 20: ${modelWords.length} Wörter in Modelltexten, die ihre Lektion noch nicht lehrt, Ratchet ist ${r.untaughtInModelTexts ?? 0} — ${modelWords.map((o) => `L${o.nr} ${o.where} „${o.token}“`).join(', ')}`);
  }

  // ---- RULE 21 (the tasks are answerable from the taught lexis, DaF review #14, BLOCKER 1) ------
  const unanswerable = writingTasksAreAnswerable(c, spec);
  if (unanswerable.length > (r.unanswerableLeitpunkte ?? 0)) {
    fail(`RULE 21: ${unanswerable.length} Leitpunkte, die ihre Lektion prüft und nicht lehrt, Ratchet ist ${r.unanswerableLeitpunkte ?? 0} — ${unanswerable.map((o) => `L${o.nr} [${o.why}] „${o.leitpunkt}“${o.token ? ` (${o.token})` : ''}`).join(', ')}`);
  }

  // ---- RULE 14 (the recurring characters keep their facts) --------------------------------------
  // No ratchet: a learner meets Ana in the dialogue and again in the Formular of the same Lektion,
  // and a contradiction between the two is always something a repair round just wrote.
  for (const o of personaConsistency(c)) {
    fail(`RULE 14: Lektion ${o.nr} ${o.where}: ${o.name} — ${o.fact} „${o.found}“ contradicts „${o.expected}“`);
  }

  return errors;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) {
  // `node scripts/validate-curriculum.mjs [level]` — the level argument defaults to a1.1, so the
  // command in CLAUDE.md and in CI keeps measuring exactly what it measured before A1.2 existed.
  const arg = (process.argv[2] || 'a1.1').toLowerCase();
  const spec = levelSpec(arg);
  if (!spec) {
    console.error(`✗ unknown level "${arg}" — known levels: ${Object.keys(LEVELS).join(', ')}`);
    process.exit(2);
  }
  const c = spec.curriculum;
  const r = spec.ratchets;
  const errors = validateCurriculum(c);
  const wf = c.lektionen.flatMap((l) => l.wortfeld);
  const withId = wf.filter((w) => w.wordId).length;
  // The four ratchets print on every run, pass or fail: a number nobody sees is a number that
  // silently climbs back (DaF review #3, „der Validator läuft über Dialoge, nicht über Items“).
  const mark = errors.length ? '·' : '✓';
  console.log(`${mark} ${c.code}: ${c.lektionen.length} Lektionen, ${wf.length} Wortfeld-Einträge (${withId} mit wordId, ${Math.round((100 * withId) / wf.length)} %), ${c.hoursTotal} h`);
  const uncovered = wortfeldCoverage(c);
  console.log(`  RULE 10 Wortfeld-Deckung: ${uncovered.length} ungenutzt von ${wf.length} (Ratchet ${r.uncoveredWortfeld})`);
  for (const u of uncovered) console.log(`    L${u.nr} ${u.de}`);
  const untaught = itemLexis(c);
  console.log(`  RULE 11 Item-Lexik (ganzer Pool, informativ): ${untaught.length} ungelehrte Tokens (Ratchet ${r.untaughtItemTokens})`);
  for (const o of untaught) console.log(`    L${o.nr} ${o.id}: ${o.token}`);
  const drawnUntaught = drawnLexis(c);
  console.log(`  RULE 11b gezogene Item-Lexik: ${drawnUntaught.length} ungelehrte Tokens (Ratchet ${r.untaughtDrawnTokens})`);
  for (const o of drawnUntaught) console.log(`    L${o.nr} ${o.id}: ${o.token}`);
  const unrehearsed = canDoRehearsal(c);
  console.log(`  RULE 12 Kann-Beschreibungen ohne Übung: ${unrehearsed.length} (harte Regel, kein Ratchet)`);
  for (const u of unrehearsed) console.log(`    L${u.nr} ${u.line}`);
  const missionless = missionlessLektionen(c);
  console.log(`  RULE 13 Sprechaufträge ohne Mission: ${missionless.length} (Ratchet ${r.missionlessLektionen}) — ${missionless.map((nr) => `L${nr}`).join(', ') || '—'}`);
  const unexemplified = noticeFormCoverage(c);
  console.log(`  RULE 6b Notice-Formen ohne Beleg: ${unexemplified.length} (Ratchet ${r.unexemplifiedNoticeForms})`);
  for (const u of unexemplified) console.log(`    L${u.nr} „${u.form}“`);
  const produced = producedBeforeTaught(c);
  console.log(`  RULE 15 Vorgriffe in Diktat/Nachsprechen: ${produced.length} (Ratchet ${r.untaughtInProduction})`);
  for (const o of produced) console.log(`    L${o.nr} Zeile ${o.line} [${o.kind}] „${o.hit}“ — ${o.de}`);
  const constructions = constructionsBeforeTaught(c, loadPoolItems(spec.level));
  console.log(`  RULE 15b aufgeschobene Konstruktionen in Produktionstexten: ${constructions.length} (Ratchet ${r.deferredConstructions})`);
  for (const o of constructions) console.log(`    L${o.nr} ${o.where} [${o.kind} → ${o.taught ? `L${o.taught}` : 'nie gelehrt'}] „${o.hit}“ — ${o.de}`);
  const unbacked = examTeileBacked(c);
  console.log(`  RULE 16 ungedeckte Prüfungsteile: ${unbacked.length} (Ratchet ${r.unbackedExamTeile})`);
  for (const o of unbacked) console.log(`    L${o.nr} „${o.teil}“ — ${o.why}`);
  const modelChecks = modelTextsPassOwnChecklist(c);
  console.log(`  RULE 17 Mustertexte, die ihre eigene Checkliste reißen: ${modelChecks.length} (harte Regel, kein Ratchet)`);
  for (const o of modelChecks) console.log(`    L${o.nr} ${o.kind} (${o.count} Wörter) — ${o.key}: „${o.label}“`);
  const shared = sharedProductionLines(c);
  console.log(`  RULE 18 Lektionen, die Diktat und Vorlesen auf dieselbe Zeile legen: ${shared.length} (Ratchet ${r.sharedProductionLines ?? 0})`);
  for (const o of shared) console.log(`    L${o.nr} Zeile ${o.dictation}/${o.readAloud} „${o.de}“`);
  const modelFacts = modelTextsMatchDialogue(c);
  console.log(`  RULE 19 Mustertexte gegen den eigenen Dialog: ${modelFacts.length} (harte Regel, kein Ratchet)`);
  for (const o of modelFacts) console.log(`    L${o.nr} ${o.where}: ${o.subject} → „${o.value}“ — ${o.why}`);
  const modelWords = modelTextLexis(c, spec);
  console.log(`  RULE 20 ungelehrte Wörter in Mustertexten: ${modelWords.length} (Ratchet ${r.untaughtInModelTexts ?? 0})`);
  for (const o of modelWords) console.log(`    L${o.nr} ${o.where} „${o.token}“ — ${o.de}`);
  const unanswerable = writingTasksAreAnswerable(c, spec);
  console.log(`  RULE 21 Leitpunkte ohne gelehrte Lexis: ${unanswerable.length} (Ratchet ${r.unanswerableLeitpunkte ?? 0})`);
  for (const o of unanswerable) console.log(`    L${o.nr} [${o.why}] „${o.leitpunkt}“${o.token ? ` (${o.token})` : ''}`);
  const personaBreaks = personaConsistency(c);
  console.log(`  RULE 14 Figuren-Widersprüche: ${personaBreaks.length} (harte Regel, kein Ratchet)`);
  for (const o of personaBreaks) console.log(`    L${o.nr} ${o.where}: ${o.name} ${o.fact} „${o.found}“ statt „${o.expected}“`);
  if (errors.length) {
    console.error(`✗ ${c.code}: ${errors.length} problem(s)`);
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
}
