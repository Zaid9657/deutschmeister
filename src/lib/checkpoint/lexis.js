// The validator's lexis machinery, in a form the BROWSER BUNDLE can import.
//
// WHY A COPY. `scripts/validate-curriculum.mjs` owns these rules (RULE 5 /
// RULE 10 / RULE 11) and stays the place to change them — but it is a node
// script: it reads the pool files with `node:fs`, and it IMPORTS
// `buildCheckpoint.js` itself to run the real draw (RULE 11b). Importing it
// from the checkpoint builder would put `node:fs` into the SPA bundle and close
// an import cycle. So the minimal known-set builder is copied here, verbatim
// from the functions named below, and nothing else is:
//
//   tokenise · participle · verbForms · formsOf · coverageForms ·
//   seedVocabulary · the knownUpTo loop of itemLexis() · ITEM_CUE_RE ·
//   ITEM_FORMULA_RE · the per-level rows of LEVELS the known set needs
//   (function words, dialogue names, irregular forms, seedFrom)
//
// KEEP THEM IN STEP. The validator is the source of truth; a rule changed there
// must be changed here in the same commit. `tests/checkpoint.test.mjs` measures
// the result (0 untaught tokens over all 80 A1.1 checkpoint items), so a drift
// shows up as a failing count rather than as silence.
//
// WHAT IT IS FOR (DaF review #6, MAJOR 8). `dd86dc8a` shipped as
// `a1.1-cp2-schreiben-1` — „Schreiben Sie den Satz: [Honig / ist / gut]“ — in
// the GRADED checkpoint of a chapter (Flohmarkt, Klassenzimmer, Büro) that
// teaches neither `Honig` nor the `König` of its own explanation; eleven of the
// 80 checkpoint items carried lexis the course had not taught by the end of
// their chapter. `knownUpTo(curriculum, checkpoint.afterLektion)` is the set of
// forms a learner sitting that checkpoint has met, `untaughtTokens(item, known,
// nameSet)` is what an item asks past it, and `buildCheckpoint` uses the pair to
// draw clean items first.
import {
  CURRICULUM_A11,
  FUNCTION_WORDS as FUNCTION_WORDS_A11,
  DIALOG_NAMES as DIALOG_NAMES_A11,
} from '../../data/curricula/a11.js';
import {
  FUNCTION_WORDS as FUNCTION_WORDS_A12,
  DIALOG_NAMES as DIALOG_NAMES_A12,
} from '../../data/curricula/a12.js';


/** validate-curriculum.mjs: IRREGULAR_FORMS. */
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

/** validate-curriculum.mjs: IRREGULAR_FORMS_A12 — A1.2 ADDS to the base table, it does not widen it. */
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

/** Every form of one Wortfeld entry an input may legitimately use (validate-curriculum.mjs: formsOf). */
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

const lowerSet = (list) => new Set(list.map((w) => String(w).toLowerCase()));

/**
 * The rows of the validator's LEVELS registry the known set is built from. A
 * level that is NOT listed here has no measured tables, and `knownUpTo` returns
 * null for it: the checkpoint builder then has no lexis opinion and draws as it
 * always did, rather than filtering a new level against A1.1's word lists.
 */
export const LEXIS_LEVELS = {
  'a1.1': {
    curriculum: CURRICULUM_A11,
    functionSet: lowerSet(FUNCTION_WORDS_A11),
    nameSet: lowerSet(DIALOG_NAMES_A11),
    irregularForms: IRREGULAR_FORMS,
    seedFrom: null,
  },
  'a1.2': {
    // Only the level a seeded level SEEDS FROM has to be here; A1.2's own module
    // is never read by this file, so the bundle is not made to carry it twice.
    curriculum: null,
    functionSet: lowerSet(FUNCTION_WORDS_A12),
    nameSet: lowerSet(DIALOG_NAMES_A12),
    irregularForms: { ...IRREGULAR_FORMS, ...IRREGULAR_FORMS_A12 },
    // An A1.2 learner has finished A1.1, so the known set starts from the whole
    // A1.1 Wortfeld union plus its notice cards (validate-curriculum: seedFrom).
    seedFrom: 'a1.1',
  },
};

/** The lexis row for a level (any case), or null when the level has no tables. */
export const lexisSpec = (level) => LEXIS_LEVELS[String(level || '').toLowerCase()] || null;

/**
 * The forms that count as "this Wortfeld entry was used" (validate-curriculum.mjs:
 * coverageForms) — formsOf() minus the article and the function words, so an
 * entry is carried by its content word or not at all.
 */
export function coverageForms(w, functionSet, irregulars = IRREGULAR_FORMS) {
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

// What is NOT lexis in a hand-written prompt: the cue in brackets and the closed
// Sie-Aufgabenformel (validate-curriculum.mjs, above itemLexis()).
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
  'Schreiben Sie die Zahl als Wort', 'Schreiben Sie das Wort', 'Schreiben Sie die Frage',
  'Bilden Sie den Satz', 'Bilden Sie die höfliche Frage', 'Bilden Sie die Frage',
  'Buchstabieren Sie das Wort', 'Lesen Sie die Buchstaben',
  'Korrigieren Sie', 'Ergänzen Sie', 'Wählen Sie',
].join('|'), 'g');

/**
 * The cumulative vocabulary a level inherits from the level before it
 * (validate-curriculum.mjs: seedVocabulary). The previous level's curriculum is
 * passed in rather than imported, so this module never pulls a second
 * curriculum into a bundle that does not already have it.
 */
function seedVocabulary(spec, priorCurriculum) {
  const known = new Set([...spec.functionSet, ...spec.nameSet]);
  if (!priorCurriculum) return known;
  for (const l of priorCurriculum.lektionen || []) {
    for (const w of l.wortfeld || []) for (const f of formsOf(w, spec.irregularForms)) known.add(f);
    for (const t of tokenise(l.notice?.bodyDe || '')) known.add(t.toLowerCase());
  }
  return known;
}

/**
 * Every word form a learner has met by the END of Lektion `lastNr` — the
 * knownUpTo loop of itemLexis(), stopped at one Lektion instead of kept per
 * Lektion. Returns null when the level has no lexis tables (see LEXIS_LEVELS).
 *
 * The seed level's module is resolved from LEXIS_LEVELS; `priorCurriculum`
 * overrides it (the test fixtures pass their own).
 */
export function knownUpTo(curriculum, lastNr, priorCurriculum = null) {
  const spec = lexisSpec(curriculum?.level);
  if (!spec) return null;
  const prior = spec.seedFrom ? (priorCurriculum || lexisSpec(spec.seedFrom)?.curriculum || null) : null;
  const known = seedVocabulary(spec, prior);
  for (const l of curriculum?.lektionen || []) {
    if (!(l.nr <= lastNr)) continue;
    for (const w of l.wortfeld || []) for (const f of coverageForms(w, spec.functionSet, spec.irregularForms)) known.add(f);
    for (const w of l.wortfeld || []) for (const f of formsOf(w, spec.irregularForms)) known.add(f);
    // The Notice card is input the learner reads in this very Lektion, on the
    // screen before the practice items, so what it teaches counts as taught.
    for (const t of tokenise(l.notice?.bodyDe || '')) known.add(t.toLowerCase());
  }
  return known;
}

/**
 * The tokens of a pool item that `known` does not contain — the same fields
 * RULE 11 reads (prompt minus the bracketed cue and the complete
 * Sie-Aufgabenformel, answer, accepted) and the same name exemption.
 */
export function untaughtTokens(item, known, nameSet = new Set()) {
  if (!known || !item) return [];
  const prompt = String(item.questionDe || '').replace(ITEM_CUE_RE, ' ').replace(ITEM_FORMULA_RE, ' ');
  const texts = [prompt, item.answer, ...(item.accepted || [])].filter(Boolean);
  const out = [];
  const seen = new Set();
  for (const s of texts) {
    for (const t of tokenise(s)) {
      const low = t.toLowerCase();
      if (known.has(low) || nameSet.has(low) || seen.has(low)) continue;
      seen.add(low);
      out.push(t);
    }
  }
  return out;
}

/** The dialogue-name exemption of a level, for the `nameSet` argument above. */
export const namesOf = (level) => lexisSpec(level)?.nameSet || new Set();
