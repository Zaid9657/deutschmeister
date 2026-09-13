// Stage 6 scoring — the MECHANICAL half, client-side.
//
// AI grading on the Goethe criteria now runs server-side
// (netlify/functions/evaluate-writing.mjs, rendered by
// src/components/lesson/GradedWriting.jsx). This file is what remains true
// without it and is the honest FALLBACK whenever the grader is unavailable —
// signed out, over the free course allowance, offline: did you fill every
// field, are you inside the word range, did you touch each Leitpunkt, did you
// open and close a Mitteilung. It never claims the text is "correct" — see the
// wording in GradedWriting.jsx — because an unchecked promise of feedback is
// exactly what FernUSG forbids.

const words = (text) => String(text || '').trim().split(/\s+/).filter(Boolean);

export const countWords = (text) => words(text).length;

const STOPWORDS = new Set([
  'der', 'die', 'das', 'ein', 'eine', 'einen', 'einem', 'einer', 'und', 'oder', 'aber', 'ihr', 'ihre',
  'sie', 'du', 'ich', 'wir', 'es', 'zu', 'in', 'an', 'auf', 'für', 'mit', 'von', 'dein', 'deine',
  'wann', 'wie', 'was', 'wo', 'wer', 'warum', 'schreiben', 'schreib', 'nennen', 'nenne', 'sagen',
  // The reflexive pronouns. Without them „Wann Sie **sich** treffen“ (A1.1 L4) keys on `sich`,
  // and a learner who writes the ordinary „Wir treffen uns um vier Uhr.“ is told he missed the
  // Leitpunkt. Measured over the whole bank on 2026-09-13: one task, and the keyword it picks
  // instead is `treffen` (DaF review #12, MAJOR 1).
  'sich', 'uns', 'mich', 'dich', 'euch',
]);

/**
 * THE LEITPUNKT FAMILY — why this is not one keyword any more.
 *
 * DaF review #13, MAJOR 1 measured the old rule (`leitpunktKeyword`: the first
 * content word of the Leitpunkt, searched as a substring) against a correct,
 * 30-word, exam-grade A1 Mitteilung that answers all three Leitpunkte of A1.1
 * Lektion 2 — „Sehr geehrte Damen und Herren, ich heiße Ana Chakiri. Ich bin am
 * 3. Mai 1998 geboren. Ich komme aus Marokko und bin Marokkanerin. Ich bin
 * ledig. Viele Grüße, Ana Chakiri“ — and got `lp0`, `lp1` and `lp2` RED. The
 * reason is structural, not unlucky: a Leitpunkt is a REQUEST („Ihr Land und
 * Ihre Staatsangehörigkeit“) and the answer is a STATEMENT („Ich komme aus
 * Marokko“); the two almost never share a token. Round 13 answered that by
 * writing the Beispieltext around the keywords („Der Familienstand: Ich bin
 * ledig.“) — a form being read out, not a message being written, and in
 * *Start Deutsch 1* Schreiben Teil 2 that COSTS points under „Kommunikative
 * Gestaltung“.
 *
 * So the Leitpunkt is satisfied by a FAMILY of forms, derived from the
 * Leitpunkt itself, in two ways and never by a typed list of texts:
 *
 *  1. EVERY content word of the Leitpunkt, matched by FOLDED form rather than
 *     as a substring — „Was Sie brauchen“ is answered by „Ich brauche …“,
 *     „Wann Sie sich treffen“ by „Wann treffen wir uns?“, and „Ihr
 *     Familienstand: ledig oder verheiratet“ carries its own answers (the
 *     Leitpunkt text supplies its synonyms and nobody read them).
 *  2. THE ANSWER SHAPE its head noun asks for: a date for „Geburtsdatum“, a
 *     country phrase for „Land“, ledig/verheiratet for „Familienstand“, a clock
 *     time for „Uhrzeit“, a weekday for „Tag“, a price for „kostet“, digits for
 *     „Telefonnummer“, a question mark for „Frage“ (ANSWER_SHAPES below).
 *
 * ONE function, no lexicon argument, ON PURPOSE: `GradedWriting.jsx` and RULE 17
 * in `scripts/validate-curriculum.mjs` call this same code, and a check that
 * needed a Wortfeld handed to it could be green on the screen and red in the
 * validator. Everything it needs is in the Leitpunkt.
 *
 * A Leitpunkt from which NEITHER a content word NOR a shape can be derived is
 * UNDECIDABLE, not failed: „Warum Sie schreiben“ is every A1.1 Mitteilung's
 * first point and every token of it is a function word. Those rows are marked
 * `ai: true` and say „prüft die KI“ — they are never silently dropped (the
 * learner saw three Leitpunkte and a list of two) and never green.
 */

/** The inflection endings a German content word can carry, longest first. */
const ENDINGS = ['est', 'en', 'er', 'es', 'em', 'st', 'et', 'e', 'n', 's', 't'];

/**
 * A word reduced to the form two inflections of it share: `kaufen`/`kaufe`
 * → `kauf`, `heiße`/`heißt` → `heiß`, `Gäste`/`Gast`… no, umlauts are NOT
 * resolved here — this is a suffix fold, and it is applied to BOTH sides, so it
 * can only ever be too strict, never too generous about a stem it cannot see.
 * An ending is only stripped when at least three letters are left, which is what
 * keeps `neun` (→ `neun`) apart from `neue` (→ `neu`).
 */
export function foldWord(word) {
  const w = String(word || '').replace(/[^A-Za-zÄÖÜäöüßẞ]/g, '').toLowerCase();
  for (const end of ENDINGS) {
    if (w.length - end.length >= 3 && w.endsWith(end)) return w.slice(0, -end.length);
  }
  return w;
}

/**
 * ALL content words of a Leitpunkt, in original case — not the first one.
 * Function words (STOPWORDS above) are dropped, because „Ihr“, „Sie“, „was“ and
 * „wann“ are in every Leitpunkt and in every text.
 */
export function leitpunktKeywords(leitpunkt) {
  const out = [];
  for (const raw of words(leitpunkt)) {
    const w = raw.replace(/[.,!?;:()"„“]/g, '');
    if (w.length > 2 && !STOPWORDS.has(w.toLowerCase())) out.push(w);
  }
  return out;
}

/**
 * BACK-COMPATIBLE: the single keyword the old rule derived. Kept because it is
 * the honest one-word summary of a Leitpunkt and the tests pin it; scoring no
 * longer uses it.
 */
export function leitpunktKeyword(leitpunkt) {
  return leitpunktKeywords(leitpunkt)[0] || '';
}

/**
 * The separable prefixes — the closed class `src/data/curricula/constructions.js`
 * also keeps. A Leitpunkt names such a verb whole („Was die Gäste **mitbringen**
 * sollen“) and the answer splits it („Bringt ihr Kuchen **mit**?“), so the stem
 * counts as the same word. Only on a lower-case keyword: German nouns are
 * capitalised, and `Vorname` must not be read as `vor` + `Name`.
 */
const SEPARABLE_PREFIXES = ['zurück', 'nach', 'auf', 'aus', 'ein', 'mit', 'vor', 'weg', 'los', 'her', 'hin', 'an', 'ab', 'zu'];
const splitVerbStem = (word) => {
  const w = String(word || '');
  if (!/^[a-zäöüß]/.test(w)) return [];
  for (const p of SEPARABLE_PREFIXES) {
    if (w.toLowerCase().startsWith(p) && w.length - p.length >= 4) return [foldWord(w.slice(p.length))];
  }
  return [];
};

const DATE_RE = /\b\d{1,2}\.\s*(?:\d{1,2}\.|Januar|Februar|März|Maerz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)|\b\d{1,2}\.\d{1,2}\.\d{2,4}\b|\bgeboren\b|\bGeburtstag\b/i;
const CLOCK_RE = /\b\d{1,2}(?:[.:]\d{2})?\s*Uhr\b|\bUhr\b|\bhalb\s+\w+|\bViertel\s+(?:nach|vor)\b|\bum\s+(?:\d{1,2}|ein[sm]?|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwoelf|halb)\b/i;
const DAY_RE = /\b(?:Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonnabend|Sonntag|heute|morgen|übermorgen|Wochenende)\b/i;
const COUNTRY_RE = /\b(?:komm\w*|bin|sind|ist)\s+aus\s+[A-ZÄÖÜ]\w+|\baus\s+[A-ZÄÖÜ]\w+/;
const PHONE_RE = /\d[\s/-]*\d|\b(?:null|eins|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun)\b/i;

/**
 * The answer shapes, keyed by the FOLDED head word of the Leitpunkt. Each row
 * reads „when the Leitpunkt asks for X, a text that carries this shape has
 * answered it“ — the obvious realisation, not a synonym list of one course.
 */
const ANSWER_SHAPES = [
  { on: ['nam', 'vornam', 'nachnam', 'familiennam'], re: /\b(?:hei(?:ß|ss)\w*|nenn\w*)\b|\bich\s+bin\s+[A-ZÄÖÜ]/ },
  { on: ['geburtsdatum', 'geburtstag', 'datum', 'alter'], re: DATE_RE },
  { on: ['land', 'staatsangehörigkei', 'staatsangehoerigkei', 'geburtsland', 'herkunft'], re: COUNTRY_RE },
  { on: ['familienstand'], re: /\b(?:ledig|verheiratet|geschieden)\b/i },
  { on: ['uhrzei', 'zeit', 'termin'], re: CLOCK_RE },
  { on: ['tag', 'wochentag'], re: new RegExp(`${DAY_RE.source}|${DATE_RE.source}`, 'i') },
  { on: ['preis', 'kost', 'geld'], re: /\b\d+\s*(?:Euro|€)|\bEuro\b|€/i },
  { on: ['telefonnumm', 'numm', 'handynumm'], re: PHONE_RE },
  { on: ['frag'], re: /\?/ },
];

/**
 * The shapes a QUESTION WORD in the Leitpunkt asks for, read off the whole
 * Leitpunkt rather than off a content word — „Wann Sie kommen“ is answered by
 * „Ich bin erst um zehn Uhr da.“, which shares no token with it at all, and
 * `wann` is (rightly) a stopword for the word half. „Warum“ deliberately has no
 * row: a reason is not a form, and that is what makes „Warum Sie schreiben“ the
 * undecidable Leitpunkt the KI has to grade.
 */
const QUESTION_SHAPES = [
  { on: /\bwann\b/i, re: new RegExp(`${CLOCK_RE.source}|${DAY_RE.source}`, 'i') },
];

/**
 * The evidence a Leitpunkt accepts: `{ words, shapes }`. Empty on both counts
 * means the Leitpunkt is undecidable by form — see the header.
 */
export function leitpunktEvidence(leitpunkt) {
  const keywords = leitpunktKeywords(leitpunkt);
  const folded = keywords.flatMap((w) => [foldWord(w), ...splitVerbStem(w)]).filter(Boolean);
  const shapes = [
    ...ANSWER_SHAPES.filter((s) => folded.some((f) => s.on.includes(f))).map((s) => s.re),
    ...QUESTION_SHAPES.filter((s) => s.on.test(String(leitpunkt || ''))).map((s) => s.re),
  ];
  return { words: keywords, folded, shapes };
}

/**
 * Did `text` answer `leitpunkt`? `null` when the Leitpunkt is undecidable by
 * form — the caller renders that row as „prüft die KI“, never as green or red.
 */
export function leitpunktSatisfied(leitpunkt, text) {
  const { folded, shapes } = leitpunktEvidence(leitpunkt);
  if (!folded.length && !shapes.length) return null;
  const body = String(text || '');
  const inText = new Set(words(body).map(foldWord).filter(Boolean));
  if (folded.some((f) => inText.has(f))) return true;
  return shapes.some((re) => re.test(body));
}

/**
 * A filled-in Formular as the one text the grader receives: one "Feld: Wert"
 * line per field, which is exactly the shape the Formular tasks in the bank ask
 * for ("Schreib zu jedem Feld eine Zeile"). Empty fields are kept, so a missing
 * answer is visible to the grader rather than silently dropped.
 */
export function formularText(fields = [], values = {}) {
  return (fields || [])
    .map((field) => `${field}: ${String(values?.[field] ?? '').trim()}`)
    .join('\n');
}

const ANREDE = /\b(hallo|liebe|lieber|guten\s+(tag|morgen|abend)|sehr\s+geehrte)/i;
const GRUSS = /\b(tschüss|tschuess|viele\s+grüße|viele\s+gruesse|liebe\s+grüße|liebe\s+gruesse|bis\s+bald|mit\s+freundlichen\s+grüßen|grüße|gruesse)/i;

/**
 * scoreWriting(schreiben, value) → { ok, checks: [{ key, label, ok }], count }
 * `value` is a string for a Mitteilung, or a { field: text } map for a Formular.
 */
export function scoreWriting(schreiben, value) {
  if (!schreiben) return { ok: false, checks: [], count: 0 };

  if (schreiben.kind === 'formular') {
    const map = value && typeof value === 'object' ? value : {};
    const checks = (schreiben.fields || []).map((field) => ({
      key: field,
      label: field,
      ok: String(map[field] || '').trim().length > 0,
    }));
    return { ok: checks.length > 0 && checks.every((c) => c.ok), checks, count: checks.length };
  }

  const text = String(value || '');
  const count = countWords(text);
  const min = Number(schreiben.minWords) || 0;
  const max = Number(schreiben.maxWords) || Infinity;

  const checks = [
    { key: 'length', label: `${min}–${Number.isFinite(max) ? max : '∞'} Wörter`, ok: count >= min && count <= max },
    { key: 'anrede', label: 'Anrede', ok: ANREDE.test(text) },
    { key: 'gruss', label: 'Gruß', ok: GRUSS.test(text) },
    // A Leitpunkt is satisfied by a FAMILY of forms (see the header), and one from which no form
    // can be derived at all — „Warum Sie schreiben“, every token a function word — is UNDECIDABLE.
    // Round 13 dropped those rows from the list; the task then showed three Leitpunkte and the
    // checklist two, and nobody told the learner why (DaF review #13, MAJOR 1). They are shown,
    // marked `ai`, and left out of `ok`: the KI grades them, this checklist cannot.
    ...(schreiben.leitpunkte || []).map((lp, i) => {
      const hit = leitpunktSatisfied(lp, text);
      return hit === null
        ? { key: `lp${i}`, label: lp, ok: true, ai: true }
        : { key: `lp${i}`, label: lp, ok: hit };
    }),
  ];

  return { ok: checks.every((c) => c.ok), checks, count };
}
