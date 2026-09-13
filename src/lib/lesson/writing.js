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

/**
 * THE FUNCTION WORDS OF THE LANGUAGE, not a hand-kept list of forty.
 *
 * DaF review #14, MAJOR 1: the old `STOPWORDS` let `bis`, `sie`, `soll` and `lena` through as
 * content words, so „Was die Kollegin **bis** dahin machen soll“ was answered by „**Bis** dann!“.
 * The review's own prescription was to read `FUNCTION_WORDS` out of the A1.1 curriculum — but this
 * file must stay dependency-free (the screen and RULE 17 grade with the SAME code, and a check
 * that imports one level's Wortfeld is wrong for every other level; `tests/writing-course.test.mjs`
 * pins it). So the list below is not a course's vocabulary: it is the CLOSED CLASSES of German —
 * articles, pronouns (personal, possessive, reflexive, demonstrative), prepositions, conjunctions,
 * question words, the finite forms of sein/haben and the modals, and the handful of particles. A
 * closed class is finite and does not grow with the course, which is the same move round 14 made
 * in `frontableOrders` (a form question, not an item list).
 *
 * TASK_VERBS is the second half and it is deliberately separate: `schreiben`, `nennen`, `sagen`
 * are the words of the INSTRUCTION („Schreiben Sie …“), never of the answer. This is RULE 20's
 * licence with the sign reversed — the task's own wording may not be evidence that the task was
 * done. Dropping them is what keeps „Warum Sie schreiben“ the undecidable Leitpunkt it is.
 */
const FUNCTION_WORDS_DE = new Set([
  // Artikel und Determinative
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'kein', 'keine', 'keinen', 'keinem', 'keiner', 'alle', 'alles', 'viel', 'viele', 'etwas',
  // Personal-, Possessiv-, Reflexiv- und Demonstrativpronomen
  'ich', 'mir', 'mich', 'mein', 'meine', 'meinen', 'meinem', 'meiner', 'meins',
  'du', 'dir', 'dich', 'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deins',
  'er', 'ihn', 'ihm', 'sein', 'seine', 'seinen', 'seinem', 'seiner',
  'sie', 'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'ihres', 'es',
  'wir', 'uns', 'unser', 'unsere', 'unseren', 'unserem', 'unserer',
  'euch', 'euer', 'eure', 'euren', 'eurem', 'eurer', 'man', 'sich',
  'dies', 'diese', 'dieser', 'dieses', 'diesen', 'diesem',
  // Präpositionen
  'aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zum', 'zur', 'bis', 'für', 'gegen', 'ohne',
  'über', 'unter', 'neben', 'zwischen', 'vor', 'hinter', 'ins', 'beim', 'vom', 'auf', 'für',
  // Konjunktionen und Partikeln
  'und', 'oder', 'aber', 'denn', 'dass', 'weil', 'wenn', 'auch', 'noch', 'nur', 'schon',
  'nicht', 'sehr', 'dann', 'hier', 'ja', 'nein', 'bitte', 'danke', 'jetzt', 'mal',
  // Fragewörter
  'wann', 'wie', 'was', 'wer', 'wen', 'wem', 'wo', 'warum', 'woher', 'wohin',
  'welche', 'welcher', 'welches', 'welchen',
  // sein / haben / werden und die Modalverben, finit und infinit
  'bin', 'bist', 'ist', 'sind', 'seid', 'war', 'waren',
  'habe', 'hast', 'hat', 'haben', 'habt', 'wird', 'werden',
  'kann', 'kannst', 'können', 'könnt', 'muss', 'musst', 'müssen', 'müsst',
  'will', 'willst', 'wollen', 'wollt', 'darf', 'darfst', 'dürfen', 'dürft',
  'soll', 'sollst', 'sollen', 'sollt', 'mag', 'möchte', 'möchten',
]);

/** The verbs of the INSTRUCTION — see the header above. */
const TASK_VERBS = new Set(['schreiben', 'schreib', 'schreibt', 'nennen', 'nenne', 'nennt', 'sagen', 'sage', 'sagt']);

const isFunctionWord = (w) => {
  const t = String(w || '').toLowerCase();
  return FUNCTION_WORDS_DE.has(t) || TASK_VERBS.has(t);
};

/**
 * THE LEITPUNKT FAMILY — why this is not one keyword any more, and since DaF review #14 not one
 * alternative either.
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
 * Round 14 fixed that and overshot: „eines von allen genügt“ turned every
 * coordinated Leitpunkt into two alternatives and every shape into a hint, and
 * DaF review #14 measured ELEVEN texts that answer nothing getting a green tick
 * („Wir sind zwei Kollegen.“ satisfied „Ihre Telefonnummer“ because the old
 * `PHONE_RE` saw the numeral `zwei`). THE INVARIANT, and it is the reason this
 * file exists: **the Formcheck may never be green on a text that omits a
 * Leitpunkt.** It is the only feedback a signed-out, offline or over-quota
 * learner gets, and a green list over a half-written Mitteilung is a false
 * statement about his work — in the exam it costs exactly the points the list
 * just promised him.
 *
 * So a Leitpunkt is read in three steps, all derived from the Leitpunkt itself
 * and never from a typed list of texts:
 *
 *  1. IT IS SPLIT INTO CONJUNCTS at „ und “ and at „, “. In *Start Deutsch 1* a
 *     Leitpunkt is one unit: „Ihr Land **und** Ihre Staatsangehörigkeit“ is not
 *     answered by naming the country. EVERY decidable conjunct must have
 *     evidence. „oder“ does NOT split — „ledig **oder** verheiratet“ is one
 *     conjunct with two alternatives, and the Leitpunkt supplies its own
 *     answers there.
 *  2. EACH CONJUNCT DERIVES ITS ANSWER SHAPE, and WHERE A SHAPE EXISTS THE
 *     SHAPE IS REQUIRED — a date for „Geburtsdatum“, a nationality adjective for
 *     „Staatsangehörigkeit“, four digits or four number words for
 *     „Telefonnummer“, a clock time for „Uhrzeit“, a weekday for „Tag“, a price
 *     for „kostet“, a question mark for „Frage“, a time for any „Wann …“
 *     (ANSWER_SHAPES / QUESTION_SHAPES below). Naming the head noun again is not
 *     answering it: „Wir treffen Ana auf dem Flohmarkt.“ does not say WANN.
 *  3. WHERE NO SHAPE EXISTS the conjunct's own content words decide, folded
 *     rather than matched as substrings — „Was Sie brauchen“ is answered by „Ich
 *     brauche …“. In an INDIRECT QUESTION („Was die Gäste mitbringen sollen“)
 *     only the lower-case words count: the capitalised nouns are the TOPIC the
 *     task hands the learner, not the answer, which is why „Ich lade meine Gäste
 *     ein.“ does not satisfy it and „Die Gäste bringen Kuchen mit.“ does.
 *
 * ONE function, no lexicon argument, ON PURPOSE: `GradedWriting.jsx` and RULE 17
 * in `scripts/validate-curriculum.mjs` call this same code, and a check that
 * needed a Wortfeld handed to it could be green on the screen and red in the
 * validator. Everything it needs is in the Leitpunkt. (Whether the course has
 * TAUGHT the words an answer needs is the opposite question and it has its own
 * rule — RULE 21, `writingTasksAreAnswerable`.)
 *
 * A conjunct from which NEITHER a content word NOR a shape can be derived is
 * UNDECIDABLE, not failed: „Warum Sie schreiben“ is every A1.1 Mitteilung's
 * first point and every token of it is a function word or a task verb. Those
 * rows are marked `ai: true` and say „prüft die KI“ — they are never silently
 * dropped (the learner saw three Leitpunkte and a list of two) and never green.
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
 * ALL content words of a Leitpunkt, in original case — not the first one, and not the nouns of an
 * indirect question (that narrowing lives in `leitpunktEvidence`, which is what scoring reads).
 * Function words are the closed classes of the language, see FUNCTION_WORDS_DE.
 */
export function leitpunktKeywords(leitpunkt) {
  const out = [];
  for (const raw of words(leitpunkt)) {
    const w = raw.replace(/[.,!?;:()"„“]/g, '');
    if (w.length > 2 && !isFunctionWord(w)) out.push(w);
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

/**
 * A NATIONALITY, which „Ihre Staatsangehörigkeit“ asks for and a country name does not supply.
 * Round 14 keyed it to COUNTRY_RE, so „Ich bin aus Marokko.“ answered both halves of „Ihr Land und
 * Ihre Staatsangehörigkeit“ (DaF review #14, MAJOR 1, probe 2). Two closed classes and nothing
 * open-ended: the nationality ADJECTIVE (`-isch` with its inflections, plus the irregular
 * `deutsch`) and the nationality NOUN suffixes that are not also profession suffixes
 * (`-aner(in)`, `-ese/-esin`, `-ier(in)`, `-länder(in)`, `Deutsche(r)`) — „Ich bin
 * **Marokkanerin**.“ answers it, „Ich bin **Studentin** in Bremen.“ must not, and that is why
 * a bare `-in` is NOT in the class. The direction of the remaining error is deliberate: a learner
 * who writes „Ich bin Türkin.“ gets a red row he did not earn, which the AI grader then corrects,
 * and that is the survivable half — a GREEN row over a missing Leitpunkt is not (see the invariant
 * in the header).
 */
const NATIONALITY_RE = /\b(?:deutsch|[A-Za-zÄÖÜäöüß]{5,}isch)(?:e[rnms]?)?\b|\b[A-ZÄÖÜ][a-zäöüß]{2,}(?:aner|anerin|ese|esin|ier|ierin|länder|länderin)\b|\bDeutsche[rn]?\b/;

/**
 * A PHONE NUMBER, and the shape is bound to the question rather than to the text. Round 14's
 * `PHONE_RE` accepted ONE numeral, so „Wir sind zwei Kollegen.“ and „Ich bin um neun Uhr im Büro.“
 * both satisfied „Ihre Telefonnummer“ (DaF review #14, MAJOR 1, probes 3 and 4). A number is four
 * digits or four number words IN SEQUENCE — the shortest number the course itself writes is
 * „null eins sieben sechs“ (A1.1 L2 dialogue).
 */
const NUMBER_WORD = '(?:null|eins|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn)';
const PHONE_RE = new RegExp(`(?:\\d[\\s/-]*){4,}|(?:${NUMBER_WORD}[\\s/-]+){3,}${NUMBER_WORD}`, 'i');

/**
 * The answer shapes, keyed by the FOLDED head word of the Leitpunkt. Each row
 * reads „when the Leitpunkt asks for X, ONLY a text that carries this shape has
 * answered it“ — the obvious realisation, not a synonym list of one course.
 * Where a conjunct derives a shape the shape is REQUIRED (see the header, step 2).
 */
const ANSWER_SHAPES = [
  { on: ['nam', 'vornam', 'nachnam', 'familiennam'], re: /\b(?:hei(?:ß|ss)\w*|nenn\w*)\b|\bich\s+bin\s+[A-ZÄÖÜ]/ },
  { on: ['geburtsdatum', 'geburtstag', 'datum', 'alter'], re: DATE_RE },
  { on: ['land', 'geburtsland', 'herkunft'], re: COUNTRY_RE },
  { on: ['staatsangehörigkei', 'staatsangehoerigkei', 'nationalitä', 'nationalitae'], re: NATIONALITY_RE },
  { on: ['familienstand'], re: /\b(?:ledig|verheiratet|geschieden)\b/i },
  { on: ['uhrzei', 'zeit', 'termin'], re: CLOCK_RE },
  { on: ['tag', 'wochentag'], re: new RegExp(`${DAY_RE.source}|${DATE_RE.source}`, 'i') },
  { on: ['preis', 'kost', 'geld'], re: /\b\d+\s*(?:Euro|€)|\bEuro\b|€/i },
  { on: ['telefonnumm', 'numm', 'handynumm'], re: PHONE_RE },
  { on: ['frag'], re: /\?/ },
];

/**
 * The shapes a QUESTION WORD in the Leitpunkt asks for, read off the whole
 * conjunct rather than off a content word — „Wann Sie kommen“ is answered by
 * „Ich bin erst um zehn Uhr da.“, which shares no token with it at all, and
 * `wann` is (rightly) a function word for the word half. „Warum“ deliberately
 * has no row: a reason is not a form, and that is what makes „Warum Sie
 * schreiben“ the undecidable Leitpunkt the KI has to grade.
 */
const QUESTION_SHAPES = [
  { on: /\bwann\b/i, re: new RegExp(`${CLOCK_RE.source}|${DAY_RE.source}`, 'i') },
];

/**
 * THE FIELD NAMED AND FILLED — „Mein **Name ist** Ana Ruiz.“, „Die **Telefonnummer ist** null eins
 * sieben sechs.“ A learner may answer a Leitpunkt by naming its field and giving it a value, and
 * that is a real answer even where the shape misses it (a Spanish name is not matched by
 * `heiße`). It is NOT the bare noun: the noun must be followed by `ist`/`sind`/`:` AND by at least
 * one word that is not a function word, so „Die Telefonnummer ist hier.“ still fails.
 */
const namedFieldShape = (word) => {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*\\s*(?:ist|sind|:)\\s+([^.,!?;]+)`, 'i');
  return {
    test: (body) => {
      const m = re.exec(String(body || ''));
      return !!m && words(m[1]).some((w) => w.length > 1 && !isFunctionWord(w.replace(/[.,!?;:()"„“]/g, '')));
    },
  };
};

/** An indirect question („Was die Gäste mitbringen sollen“) — see the header, step 3. */
const INDIRECT_QUESTION_RE = /^(?:was|wer|wen|wem|wann|wo|wie|warum|woher|wohin|welche[rnms]?)\b/i;

/**
 * A Leitpunkt split into its CONJUNCTS — „ und “ and „, “, never „oder“. In *Start Deutsch 1* a
 * Leitpunkt is one unit and half an answer is no answer (DaF review #14, MAJOR 1, „Erstens“).
 */
export function leitpunktConjuncts(leitpunkt) {
  return String(leitpunkt || '')
    .split(/\s+und\s+|,\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const conjunctEvidence = (conjunct) => {
  const all = leitpunktKeywords(conjunct);
  // In an indirect question the capitalised nouns are the topic the task hands over, not the
  // answer; only the predicate decides. Elsewhere („Ihre Telefonnummer“) the noun IS the answer.
  const keywords = INDIRECT_QUESTION_RE.test(conjunct)
    ? all.filter((w) => /^[a-zäöüß]/.test(w))
    : all;
  const folded = keywords.flatMap((w) => [foldWord(w), ...splitVerbStem(w)]).filter(Boolean);
  const shapes = [];
  for (const w of keywords) {
    const f = [foldWord(w), ...splitVerbStem(w)];
    for (const shape of ANSWER_SHAPES) {
      if (!f.some((x) => shape.on.includes(x))) continue;
      shapes.push(shape.re, namedFieldShape(w));
    }
  }
  shapes.push(...QUESTION_SHAPES.filter((s) => s.on.test(conjunct)).map((s) => s.re));
  return { text: conjunct, words: keywords, folded, shapes };
};

/**
 * The evidence a Leitpunkt accepts: `{ conjuncts, words, shapes }`. A conjunct empty on both
 * counts is undecidable by form; a Leitpunkt all of whose conjuncts are undecidable is the
 * „prüft die KI“ row — see the header. The flat `words`/`folded`/`shapes` are the union over the
 * conjuncts and are kept because callers and tests read them.
 */
export function leitpunktEvidence(leitpunkt) {
  const conjuncts = leitpunktConjuncts(leitpunkt).map(conjunctEvidence);
  return {
    conjuncts,
    words: conjuncts.flatMap((c) => c.words),
    folded: conjuncts.flatMap((c) => c.folded),
    shapes: conjuncts.flatMap((c) => c.shapes),
  };
}

/**
 * Did `text` answer `leitpunkt`? `null` when the Leitpunkt is undecidable by
 * form — the caller renders that row as „prüft die KI“, never as green or red.
 * EVERY decidable conjunct must have evidence, and where a conjunct derives a
 * shape the shape is what decides it.
 */
export function leitpunktSatisfied(leitpunkt, text) {
  const { conjuncts } = leitpunktEvidence(leitpunkt);
  const decidable = conjuncts.filter((c) => c.folded.length || c.shapes.length);
  if (!decidable.length) return null;
  const body = String(text || '');
  const inText = new Set(words(body).map(foldWord).filter(Boolean));
  const met = (c) => (c.shapes.length
    ? c.shapes.some((re) => re.test(body))
    : c.folded.some((f) => inText.has(f)));
  return decidable.every(met);
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
