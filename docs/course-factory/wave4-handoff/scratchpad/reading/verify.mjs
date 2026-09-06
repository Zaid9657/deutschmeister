// Verifier for the Wave 4 A2.1 reading deliverable.
//
//   node verify.mjs [rewrites-a2.1.json] [exam-format-a2.1.json] [../source/reading-a2.1.json]
//
// Exits 1 on the first non-empty failure list. Everything it checks is a rule
// from S/wave4/level-a2.1.md or S/wave4/reading-brief.md; the informational
// blocks at the end are the judgement calls a human reviewer must confirm.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const [, , rwPath = resolve(HERE, 'rewrites-a2.1.json'),
  exPath = resolve(HERE, 'exam-format-a2.1.json'),
  srcPath = resolve(HERE, '../source/reading-a2.1.json')] = process.argv;

const rewrites = JSON.parse(readFileSync(rwPath, 'utf8'));
const exam = JSON.parse(readFileSync(exPath, 'utf8'));
const source = JSON.parse(readFileSync(srcPath, 'utf8'));

const errors = [];
const info = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const words = (s) => s.split(/\s+/).filter(Boolean);

// Sentence split on . ! ? : and blank lines. Ordinals ("6. Oktober") and
// decimals ("38,5") must not split, so digits+dot are masked first.
const sentences = (s) =>
  s.replace(/(\d)\.(\s)/g, '$1$2')
    .split(/[.!?:\n]+/)
    .map((t) => t.replace(//g, '.').trim())
    .filter(Boolean);

const countMatches = (s, re) => (s.match(re) || []).length;

// Frozen greeting/letter formulas: allowed with their endings anywhere
// (level-a2.1.md "Frozen chunks", and the Wave 3 reviewer's ruling).
const FROZEN = [
  /Sehr geehrte Damen und Herren/g, /Sehr geehrter? [A-ZÄÖÜ]\w+/g,
  /Mit freundlichen Grüßen/g, /Liebe Grüße/g, /Viele Grüße/g,
  /Herzlichen Glückwunsch/g, /Vielen Dank/g, /Guten (Morgen|Tag|Abend|Appetit)/g,
  /Schönes Wochenende/g, /Alles Gute/g, /Gute Besserung/g,
];
const stripFrozen = (s) => FROZEN.reduce((acc, re) => acc.replace(re, ' '), s);

// ---------------------------------------------------------------------------
// banned grammar (level-a2.1.md "BANNED at A2.1")
// ---------------------------------------------------------------------------
const PRAETERITUM_FULL_VERBS = new RegExp(
  '\\b(' + [
    'wurde', 'wurden', 'ging', 'gingen', 'kam', 'kamen', 'sagte', 'sagten',
    'gab', 'gaben', 'fuhr', 'fuhren', 'nahm', 'nahmen', 'sah', 'sahen',
    'stand', 'standen', 'blieb', 'blieben', 'fand', 'fanden', 'dachte',
    'hieß', 'wusste', 'trank', 'tranken', 'schrieb', 'las', 'lief', 'half',
    'sprach', 'trug', 'lag', 'saß', 'aß', 'aßen', 'bekam', 'bekamen',
    'machte', 'machten', 'kaufte', 'kauften', 'spielte', 'spielten',
    'lernte', 'lernten', 'wohnte', 'wohnten', 'fragte', 'fragten',
    'antwortete', 'kostete', 'kosteten', 'dauerte', 'dauerten', 'brauchte',
    'suchte', 'suchten', 'zeigte', 'holte', 'legte', 'stellte', 'lebte',
    'meinte', 'erzählte', 'arbeitete', 'arbeiteten', 'öffnete', 'wartete',
  ].join('|') + ')\\b', 'g');

const BANNED = [
  ['Relativsatz-Heuristik (Komma + d-Wort)', /,\s*(der|die|das|dem|den|denen|deren|welche[rsn]?)\b/gi],
  ['Präteritum eines Vollverbs', PRAETERITUM_FULL_VERBS],
  ['Konjunktiv II / Futur / Passiv (würde|wird|werden|geworden)', /\b(würde[nst]?|wird|wirst|werde[nt]?|geworden)\b/g],
  ['Reflexivpronomen "sich"', /\bsich\b/g],
  ['Genitiv (des/eines)', /\b(des|eines)\b/g],
  // "am ersten/sechsten …" are ordinals, "am liebsten" is explicitly allowed;
  // every other "am …sten" is a banned superlative.
  ['Superlativ "am …sten"', /\bam\s+(?!liebsten\b|ersten\b|sechsten\b)\w+sten\b/g],
  ['Nebensatz "ob/obwohl/damit/während/bevor/nachdem"', /\b(obwohl|damit|während|bevor|nachdem|falls)\b/g],
  ['Infinitiv mit zu / um … zu', /\bum\s+[^.!?]*\bzu\s+\w+en\b/g],
];

const NEBENSATZ = /\b(weil|dass|wenn)\b/g;
const ALS = /\bals\b/gi;

const TIME_NOUN = '\\d|Jahr|Jahren|Jahre|Monat|Monaten|Monate|Woche|Wochen|Tag|Tage|Tagen|'
  + 'Stunde|Stunden|Minute|Minuten|Uhr|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|'
  + 'Sonntag|Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|'
  + 'Morgen|Abend|Mittag|Sommer|Winter|Wochenende';
const TEMPORAL = new RegExp(`\\b(seit|vor|ab|bis|zwischen|gegen)\\b(?=[^.!?]{0,24}?\\b(?:${TIME_NOUN}))`, 'gi');
const MODAL_PAST = /\b(konnte|musste|wollte|durfte|sollte|mochte)n?\b/gi;
const exposureForms = (text) => new Set([
  ...(text.match(TEMPORAL) || []), ...(text.match(MODAL_PAST) || []),
].map((w) => w.toLowerCase()));

// ---------------------------------------------------------------------------
// adjective endings: attributive adjectives need a der-/ein-word in front
// (level-a2.1.md topic 9: no null-article declension outside frozen chunks)
// ---------------------------------------------------------------------------
const ADJ_STEMS = [
  'gut', 'schön', 'klein', 'groß', 'neu', 'alt', 'jung', 'teuer', 'teur',
  'billig', 'günstig', 'schnell', 'langsam', 'lang', 'kurz', 'hell', 'dunkel',
  'warm', 'kalt', 'frisch', 'lecker', 'nett', 'freundlich', 'wichtig',
  'schwer', 'leicht', 'schwierig', 'einfach', 'interessant', 'ruhig', 'laut',
  'sauber', 'voll', 'leer', 'stark', 'hoch', 'hoh', 'modern', 'gemütlich',
  'italienisch', 'griechisch', 'spanisch', 'deutsch', 'richtig', 'falsch',
  'erst', 'zweit', 'dritt', 'viert', 'fünft', 'nächst', 'ganz', 'weiter',
  'bekannt', 'berühmt', 'kostenlos', 'gesund', 'krank', 'glücklich',
  'zufrieden', 'geehrt', 'lieb', 'pünktlich', 'praktisch',
];
const DETERMINERS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen', 'einem', 'einer',
  'kein', 'keine', 'keinen', 'keinem', 'keiner', 'mein', 'meine', 'meinen',
  'meinem', 'meiner', 'dein', 'deine', 'deinen', 'deinem', 'deiner',
  'sein', 'seine', 'seinen', 'seinem', 'seiner', 'ihr', 'ihre', 'ihren',
  'ihrem', 'ihrer', 'unser', 'unsere', 'unseren', 'unserem', 'unserer',
  'euer', 'eure', 'euren', 'eurem', 'ihren', 'dieser', 'diese', 'dieses',
  'diesen', 'diesem', 'jeder', 'jede', 'jedes', 'jeden', 'jedem',
  'im', 'am', 'zum', 'zur', 'vom', 'beim', 'ins', 'ans', 'aufs',
  'alle', 'allen', 'beide', 'beiden', 'viele', 'vielen', 'andere', 'anderen',
]);
// "letzt-" is a fixed A1 time adverbial (letzte Woche / letzten Monat) and
// is not treated as an attributive adjective here — see notes.md.
const ADJ_RE = new RegExp(`\\b(${ADJ_STEMS.join('|')})(e|en|er|es|em)\\b`, 'gi');

function checkAdjectiveEndings(where, text) {
  const clean = stripFrozen(text);
  for (const sentence of clean.split(/\n+/)) {
    const toks = sentence.split(/\s+/).filter(Boolean);
    toks.forEach((tok, i) => {
      const bare = tok.replace(/[^A-Za-zÄÖÜäöüß-]/g, '');
      ADJ_RE.lastIndex = 0;
      if (!bare || !new RegExp(`^(${ADJ_STEMS.join('|')})(e|en|er|es|em)$`, 'i').test(bare)) return;
      const next = (toks[i + 1] || '').replace(/[^A-Za-zÄÖÜäöüß-]/g, '');
      if (!/^[A-ZÄÖÜ]/.test(next)) return; // not adjective + noun
      const prev = (toks[i - 1] || '').replace(/[^A-Za-zÄÖÜäöüß-]/g, '').toLowerCase();
      if (!DETERMINERS.has(prev)) {
        fail(where, `Adjektivendung ohne Artikel: "${tok} ${next}" (davor: "${toks[i - 1] || '∅'}")`);
      }
    });
  }
}

// ---------------------------------------------------------------------------
// per-string German checks
// ---------------------------------------------------------------------------
function checkGerman(where, text, { maxSentence = 14 } = {}) {
  for (const s of sentences(text)) {
    const n = words(s).length;
    if (n > maxSentence) fail(where, `Satz mit ${n} Wörtern (max ${maxSentence}): "${s}"`);
  }
  for (const [label, re] of BANNED) {
    re.lastIndex = 0;
    const hits = text.match(re) || [];
    if (hits.length) fail(where, `${label}: ${[...new Set(hits)].join(', ')}`);
  }
  if (/[A-Za-z]"[A-Za-z]/.test(text)) fail(where, 'ASCII-Anführungszeichen im deutschen Text');
  checkAdjectiveEndings(where, text);
}

// ---------------------------------------------------------------------------
// structural checks
// ---------------------------------------------------------------------------
const rfPatterns = new Map();
const allStatements = new Map();
const choiceKeys = [];

function checkLesson(row, { kind, label, vocabRange, questionCount, wordRange, rfCount, choiceCount }) {
  // --- required fields
  const required = kind === 'rewrite'
    ? ['id', 'title_de', 'title_en', 'content_de', 'content_en', 'key_vocabulary',
      'questions', 'checks', 'word_count', 'estimated_reading_time']
    : ['level', 'topic', 'difficulty', 'order_index', 'title_de', 'title_en',
      'content_de', 'content_en', 'key_vocabulary', 'questions', 'checks',
      'word_count', 'estimated_reading_time'];
  for (const k of required) {
    if (row[k] === undefined || row[k] === null) fail(label, `Feld fehlt: ${k}`);
  }
  const extra = Object.keys(row).filter((k) => !required.includes(k));
  if (extra.length) fail(label, `unerwartete Felder: ${extra.join(', ')}`);

  // --- word count + reading time
  const actual = words(row.content_de).length;
  if (actual !== row.word_count) fail(label, `word_count ${row.word_count} ≠ gezählt ${actual}`);
  if (actual < wordRange[0] || actual > wordRange[1]) {
    fail(label, `content_de hat ${actual} Wörter (erlaubt ${wordRange[0]}–${wordRange[1]})`);
  }
  if (![2, 3].includes(row.estimated_reading_time)) {
    fail(label, `estimated_reading_time ${row.estimated_reading_time} (erlaubt 2–3)`);
  }

  // --- German everywhere
  checkGerman(`${label} content_de`, row.content_de);
  checkGerman(`${label} title_de`, row.title_de);

  const nebensatz = countMatches(row.content_de, NEBENSATZ);
  if (nebensatz > 2) fail(label, `weil/dass/wenn ${nebensatz}× (max 2)`);
  const als = countMatches(row.content_de, ALS);
  if (als > 1) fail(label, `"als" ${als}× (max 1 — Komparativ nur einmal pro Text)`);

  // --- translation present and shaped like the German
  const pDe = row.content_de.split(/\n{2,}/).length;
  const pEn = row.content_en.split(/\n{2,}/).length;
  if (pDe !== pEn) fail(label, `Absätze: content_de ${pDe} ≠ content_en ${pEn}`);
  if (/[äöüßÄÖÜ]/.test(row.content_en.replace(/Ringstraße|Schönbrunn|Grüßen|Deutsch im Alltag|Wiener Schnitzel|Größ/g, ''))) {
    info.push(`${label}: content_en enthält Umlaute (Eigennamen?) — prüfen`);
  }

  // --- vocabulary
  const kv = row.key_vocabulary;
  if (!Array.isArray(kv) || kv.length < vocabRange[0] || kv.length > vocabRange[1]) {
    fail(label, `key_vocabulary ${kv?.length} Einträge (erlaubt ${vocabRange[0]}–${vocabRange[1]})`);
  }
  const kvSeen = new Set();
  for (const v of kv || []) {
    if (!v.de || !v.en) fail(label, `key_vocabulary-Eintrag ohne de/en: ${JSON.stringify(v)}`);
    if (kvSeen.has(v.de)) fail(label, `key_vocabulary doppelt: ${v.de}`);
    kvSeen.add(v.de);
  }

  // --- questions
  const qs = row.questions;
  if (!Array.isArray(qs) || qs.length !== questionCount) {
    fail(label, `questions ${qs?.length} (erwartet ${questionCount})`);
  }
  const qSeen = new Set();
  for (const q of qs || []) {
    for (const k of ['question_de', 'question_en', 'answer_de', 'answer_en']) {
      if (!q[k]) fail(label, `Frage ohne ${k}: ${JSON.stringify(q)}`);
    }
    if (qSeen.has(q.question_de)) fail(label, `Frage doppelt: ${q.question_de}`);
    qSeen.add(q.question_de);
    checkGerman(`${label} Frage`, q.question_de);
    checkGerman(`${label} Antwort`, q.answer_de);
    // Reading-exposure ruling: an open question's answer may not turn on a
    // topic-9–12 form either. The text itself is the quote here.
    for (const form of exposureForms(`${q.question_de} ${q.answer_de}`)) {
      if (!exposureForms(row.content_de).has(form)) {
        fail(label, `Antwort hängt an einer Themen-9–12-Form: "${form}" steht in der Frage/Antwort, `
          + `aber nicht im Text — ${q.question_de} / ${q.answer_de}`);
      }
    }
  }

  // --- checks
  const checks = row.checks;
  const rfs = (checks || []).filter((c) => c.type === 'rf');
  const chs = (checks || []).filter((c) => c.type === 'choice');
  if (rfs.length !== rfCount) fail(label, `rf-Items ${rfs.length} (erwartet ${rfCount})`);
  if (chs.length !== choiceCount) fail(label, `choice-Items ${chs.length} (erwartet ${choiceCount})`);
  if ((checks || []).length !== rfCount + choiceCount) {
    fail(label, `checks ${checks?.length} (erwartet ${rfCount + choiceCount})`);
  }

  for (const c of checks || []) {
    if (!['rf', 'choice'].includes(c.type)) fail(label, `unbekannter check-Typ ${c.type}`);
    for (const k of ['statement_de', 'statement_en', 'answer', 'explanation_de']) {
      if (!c[k]) fail(label, `check ohne ${k}: ${JSON.stringify(c).slice(0, 80)}`);
    }
    if (c.type === 'choice') {
      const [question, ...rest] = c.statement_de.split(/\s+(?=a\))/);
      checkGerman(`${label} choice-Frage`, question);
      for (const opt of (rest.join(' ').split(/\s+(?=[abc]\))/))) {
        const n = words(opt).length - 1; // minus the "a)" marker
        if (n > 6) fail(label, `choice-Option mit ${n} Wörtern (max 6): "${opt}"`);
        checkGerman(`${label} choice-Option`, opt);
      }
    } else {
      checkGerman(`${label} check statement`, c.statement_de);
    }
    checkGerman(`${label} check explanation`, c.explanation_de);
    if (NEBENSATZ.test(c.statement_de)) {
      NEBENSATZ.lastIndex = 0;
      fail(label, `weil/dass/wenn in einem check-statement: ${c.statement_de}`);
    }
    NEBENSATZ.lastIndex = 0;
    // A temporal preposition only counts when it governs a time expression:
    // "vor dem Rathaus" is the two-way preposition of topic 3, "vor einem Jahr"
    // is topic 12. Modal Präteritum always counts.
    const inStatement = exposureForms(c.statement_de);
    const inQuote = exposureForms(c.explanation_de);
    for (const form of inStatement) {
      if (!inQuote.has(form)) {
        fail(label, `Antwort hängt an einer Themen-9–12-Form: "${form}" steht im statement, `
          + `aber nicht im zitierten Text — ${c.statement_de}`);
      }
    }
    if (allStatements.has(c.statement_de)) {
      fail(label, `statement_de doppelt (auch in ${allStatements.get(c.statement_de)}): ${c.statement_de}`);
    }
    allStatements.set(c.statement_de, label);
    if (qSeen.has(c.statement_de)) fail(label, `check-statement = offene Frage: ${c.statement_de}`);
  }

  for (const c of rfs) {
    if (!['richtig', 'falsch'].includes(c.answer)) fail(label, `rf-answer "${c.answer}"`);
  }
  for (const c of chs) {
    if (JSON.stringify(c.options) !== JSON.stringify(['a', 'b', 'c'])) {
      fail(label, `choice options ${JSON.stringify(c.options)} (erwartet ["a","b","c"])`);
    }
    if (!c.options.includes(c.answer)) fail(label, `choice-answer "${c.answer}" nicht in options`);
    for (const opt of ['a)', 'b)', 'c)']) {
      if (!c.statement_de.includes(opt)) {
        fail(label, `choice-statement ohne "${opt}": ${c.statement_de}`);
      }
    }
    choiceKeys.push(`${label}:${c.answer}`);
  }
  if (chs.length > 1) {
    const keys = chs.map((c) => c.answer);
    if (new Set(keys).size === 1) fail(label, `alle choice-Antworten identisch (${keys[0]})`);
  }

  // --- rf answer pattern: 2–3 falsch, not alternating, unique across lessons
  if (rfs.length === 5) {
    const pattern = rfs.map((c) => (c.answer === 'richtig' ? 'r' : 'f')).join('');
    const falsch = [...pattern].filter((x) => x === 'f').length;
    if (falsch < 2 || falsch > 3) fail(label, `${falsch} falsch-Items (erlaubt 2–3): ${pattern}`);
    if (pattern === 'rfrfr' || pattern === 'frfrf') fail(label, `rf-Muster alterniert: ${pattern}`);
    if (rfPatterns.has(pattern)) {
      fail(label, `rf-Muster ${pattern} schon in ${rfPatterns.get(pattern)}`);
    }
    rfPatterns.set(pattern, label);
    info.push(`${label}: rf-Muster ${pattern} (${falsch} falsch)`);
  }

  // --- every item must be decidable: its explanation quotes the text literally.
  // (Round 3: this ran on falsch/choice only, so a richtig item's quote was never
  // checked — which is exactly the class review-2 N1 landed in.)
  for (const c of checks || []) {
    {
      const quote = c.explanation_de.replace(/^(Im Text steht|In der E-Mail steht):\s*/, '');
      const norm = (s) => s.replace(/[„“"]/g, '').replace(/\s+/g, ' ').trim();
      const fragments = norm(quote).split(/\s*\.\.\.\s*|\s+\.\.\.\s+/);
      const hay = norm(row.content_de);
      const ok = fragments.every((f) => {
        const t = f.replace(/^\.\.\.\s*/, '').replace(/[.!?]$/, '').trim();
        return t.length > 8 && hay.includes(t);
      });
      if (!ok) fail(label, `explanation_de zitiert den Text nicht wörtlich: ${c.explanation_de}`);
    }
  }
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------
if (rewrites.length !== 8) fail('rewrites', `${rewrites.length} Zeilen (erwartet 8)`);
if (exam.length !== 2) fail('exam-format', `${exam.length} Zeilen (erwartet 2)`);

const byId = new Map(source.map((r) => [r.id, r]));
const seenIds = new Set();
for (const row of rewrites) {
  const label = `rewrite "${row.title_de}"`;
  if (!byId.has(row.id)) fail(label, `id ${row.id} steht nicht in der Live-Quelle`);
  if (seenIds.has(row.id)) fail(label, `id doppelt: ${row.id}`);
  seenIds.add(row.id);
  const src = byId.get(row.id);
  // A rewrite keeps the live title unless the live title lies (none does here);
  // drift in either language is a failure, not an info line.
  if (src && src.title_de !== row.title_de) {
    fail(label, `title_de weicht von der Live-Zeile ab:\n    ist:  ${row.title_de}\n    live: ${src.title_de}`);
  }
  if (src && src.title_en !== row.title_en) {
    fail(label, `title_en weicht von der Live-Zeile ab:\n    ist:  ${row.title_en}\n    live: ${src.title_en}`);
  }
  checkLesson(row, {
    kind: 'rewrite', label, vocabRange: [10, 14], questionCount: 5,
    wordRange: [120, 150], rfCount: 5, choiceCount: 1,
  });
}
if (seenIds.size !== 8) fail('rewrites', `${seenIds.size} verschiedene ids (erwartet 8)`);

const EXAM_TITLES = [
  'Lesen Teil 1: Ein Zeitungstext (wie in der Prüfung)',
  'Lesen Teil 3: Eine E-Mail (wie in der Prüfung)',
];
const EXAM_INSTRUCTIONS = [
  'Lies den Text. Wähle die richtige Antwort: a, b oder c.',
  'Lies die E-Mail. Wähle die richtige Antwort: a, b oder c.',
];
const liveOrder = new Set(source.map((r) => r.order_index));
exam.forEach((row, i) => {
  const label = `exam-format ${row.order_index}`;
  if (row.title_de !== EXAM_TITLES[i]) {
    fail(label, `title_de weicht vom Plan ab:\n    ist:      ${row.title_de}\n    erwartet: ${EXAM_TITLES[i]}`);
  }
  if (!row.content_de.startsWith(EXAM_INSTRUCTIONS[i])) {
    fail(label, `content_de beginnt nicht mit der Anweisung "${EXAM_INSTRUCTIONS[i]}"`);
  }
  if (row.level !== 'a2.1') fail(label, `level ${row.level}`);
  if (row.topic !== 'Prüfungsformat') fail(label, `topic ${row.topic}`);
  if (row.difficulty !== 2) fail(label, `difficulty ${row.difficulty}`);
  if (row.order_index !== 9 + i) fail(label, `order_index ${row.order_index} (erwartet ${9 + i})`);
  if (liveOrder.has(row.order_index)) fail(label, `order_index ${row.order_index} kollidiert mit einer Live-Zeile`);
  checkLesson(row, {
    kind: 'exam', label, vocabRange: [8, 10], questionCount: 3,
    wordRange: i === 0 ? [120, 145] : [110, 132],
    rfCount: 0, choiceCount: 5,
  });
});

// choice keys must not be constant across the file
const keyLetters = choiceKeys.map((k) => k.split(':')[1]);
if (new Set(keyLetters).size === 1) fail('cross-file', `alle choice-Antworten sind "${keyLetters[0]}"`);
info.push(`choice-Antworten: ${choiceKeys.join(', ')}`);

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------
const counts = [...rewrites, ...exam].map((r) => `${r.title_de} = ${r.word_count}w`);
console.log('Wörter je Lektion:\n  ' + counts.join('\n  '));
console.log('\nHinweise (vom Menschen zu prüfen):\n  ' + info.join('\n  '));

if (errors.length) {
  console.error(`\n${errors.length} FEHLER:`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
console.log(`\nOK — ${rewrites.length} Rewrites + ${exam.length} Prüfungslektionen, 0 Fehler.`);
