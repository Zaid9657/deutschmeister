// Text helpers for the course-v2 validator: tokens, sentences, clauses, word counts.
//
// Deliberately small and deterministic. Nothing here parses German; it cuts text the way the
// rules need it cut and says so where a cut is a heuristic.

/** A German word token: letters incl. umlauts/ß, optionally hyphenated; or a number (8.30, 0341, 12.). */
export const TOKEN_RE = /[A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß]+)*|\d+(?:[.:,]\d+)*/g;

/** Every token of `text` as `{ text, lower, index }`. */
export function tokens(text) {
  const out = [];
  for (const m of String(text ?? '').matchAll(TOKEN_RE)) {
    out.push({ text: m[0], lower: m[0].toLowerCase(), index: m.index });
  }
  return out;
}

/** Lower-case word strings of `text` (numbers included). */
export const words = (text) => tokens(text).map((t) => t.lower);

/** Words as a reader counts them: whitespace-separated chunks carrying a letter or a digit. */
export function wordCount(text) {
  return String(text ?? '')
    .split(/\s+/)
    .filter((w) => /[A-Za-zÄÖÜäöüß0-9]/.test(w)).length;
}

/** Lower-case, quotes and punctuation stripped, whitespace collapsed — for comparing two strings. */
export function norm(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[„“”"‚‘’'«»]/g, '')
    .replace(/[.,;:!?…()[\]{}–—-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Abbreviations after which a period does not end a sentence. */
const ABBREVIATIONS = new Set([
  'dr', 'nr', 'str', 'tel', 'bzw', 'usw', 'ca', 'evtl', 'ggf', 'hr', 'fr', 'st', 'z', 'b', 'd', 'h',
  'vgl', 'inkl', 'zb', 'prof', 'mo', 'di', 'mi', 'do', 'sa', 'jan', 'feb', 'aug', 'sept', 'okt',
  'nov', 'dez', 'abs', 'bd', 'etc', 'u', 'a', 'm', 'o', 'j', 'max', 'min', 'std', 'mind',
]);

/**
 * Sentences of `text`. A period after a number („12. März", „8.30") or after a listed abbreviation
 * („Dr. Albers", „z. B.") does not end a sentence. Line breaks end one (notes, forms, letters).
 */
export function sentences(text) {
  const src = String(text ?? '');
  const out = [];
  let start = 0;
  const push = (end) => {
    const s = src.slice(start, end).trim();
    if (s) out.push(s);
    start = end;
  };
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '\n') {
      push(i + 1);
      continue;
    }
    if (ch !== '.' && ch !== '!' && ch !== '?' && ch !== '…') continue;
    // swallow closing quotes / repeated marks
    let j = i + 1;
    while (j < src.length && /[.!?…“”"»)']/.test(src[j])) j += 1;
    if (j < src.length && !/\s/.test(src[j])) continue; // 8.30, 0341.58, „…“-Mitte
    if (ch === '.') {
      const before = src.slice(start, i).match(/([A-Za-zÄÖÜäöüß]+|\d+)$/);
      if (before) {
        const w = before[1].toLowerCase();
        if (/^\d+$/.test(w) && j < src.length) {
          // „am 12. März" / „der 3. Stock": an ordinal; „um 12. Dann" is rare enough to accept.
          const next = src.slice(j).trimStart();
          if (/^[A-ZÄÖÜa-zäöü]/.test(next) && !/^(Dann|Danach|Aber|Und|Ich|Wir|Sie|Er|Es|Das|Der|Die)\b/.test(next)) continue;
        }
        if (ABBREVIATIONS.has(w) && j < src.length) continue;
      }
    }
    push(j);
    i = j - 1;
  }
  push(src.length);
  return out;
}

/**
 * Clauses of one sentence: cut at commas, semicolons, colons, dashes and brackets. A heuristic —
 * „Ich glaube, dass er kommt, weil …" becomes three clauses, which is what the clause detectors
 * and the verb-final check want; an apposition becomes a clause of its own, which they tolerate.
 */
export function clauses(sentence) {
  return String(sentence ?? '')
    .split(/[,;:()–—]|\s-\s/)
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Closed-class German words: articles, pronouns, prepositions, conjunctions, particles, auxiliaries. */
export const FUNCTION_WORDS = new Set(`
der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner keines
mein meine meinen meinem meiner meines dein deine deinen deinem deiner deines sein seine seinen seinem seiner seines
ihr ihre ihren ihrem ihrer ihres unser unsere unseren unserem unserer unseres euer eure euren eurem eurer eures
dieser diese dieses diesen diesem jeder jede jedes jeden jedem welcher welche welches welchen welchem
alle allen aller alles viele vielen vieler viel wenig wenige wenigen manche mancher manchen beide beiden
andere anderen anderer anderes
ich du er sie es wir ihr mich dich ihn uns euch mir dir ihm ihnen sich man jemand niemand etwas nichts
wer was wen wem wessen wo wohin woher wann wie warum weshalb wieso welche
und oder aber denn sondern doch sowie weil dass wenn ob obwohl als wie bis seit seitdem während nachdem bevor
falls damit sodass indem da so dann danach deshalb deswegen darum trotzdem also außerdem zuerst
in im ins an am ans auf aus bei beim mit nach von vom zu zum zur über unter vor hinter neben zwischen
durch für ohne gegen um bis ab seit entlang gegenüber wegen trotz statt innerhalb außerhalb laut pro je
nicht nie auch noch schon nur sehr ganz gar ja nein bitte danke mal eben halt wohl eigentlich gern gerne
hier dort da heute morgen gestern jetzt immer oft manchmal wieder sofort bald später früher gleich zusammen
mehr weniger am meisten lieber
bin bist ist sind seid sei war warst waren wart gewesen habe hast hat haben habt hatte hattest hatten hattet gehabt
werde wirst wird werden werdet wurde wurdest wurden wurdet geworden worden
kann kannst können könnt konnte konntest konnten muss musst müssen müsst musste mussten
darf darfst dürfen dürft durfte durften soll sollst sollen sollt sollte solltest sollten
will willst wollen wollt wollte wollten mag magst mögen mögt möchte möchtest möchten möchtet
null eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf zwanzig dreißig vierzig fünfzig
sechzig siebzig achtzig neunzig hundert tausend
herr frau
`.split(/\s+/).filter(Boolean));

/** Finite forms of haben/sein/werden and the modals — verbs a verb-final check must accept. */
export const AUX_MODAL_FORMS = new Set(`
bin bist ist sind seid war warst waren wart habe hast hat haben habt hatte hattest hatten hattet
werde wirst wird werden werdet wurde wurdest wurden wurdet
kann kannst können könnt konnte konnten könnte könnten muss musst müssen müsst musste mussten müsste
darf darfst dürfen dürft durfte durften dürfte soll sollst sollen sollt sollte sollten
will willst wollen wollt wollte wollten mag magst mögen möchte möchtest möchten wäre wären hätte hätten würde würden
`.split(/\s+/).filter(Boolean));

/** Words that end like a verb but are not one (a verb-final check must not accept them). */
const NOT_VERB_FINAL = new Set(`
heute morgen gerne bitte leider schon wieder oder aber immer dann denn wenn gestern vielleicht zusammen
unten oben hinten vorne draußen drinnen ungefähr etwas nichts selbst ebenfalls genau erst fast
gut sehr mehr hier dort jetzt oft noch nie nur auch ganz gleich später früher lange kurz spät
`.split(/\s+/).filter(Boolean));

/**
 * Does `clause` end in a token shaped like a verb? (lower-case, verb ending or aux/modal form or a
 * participle shape.) A heuristic for the ambiguous-subordinator and relative-clause detectors.
 */
export function endsVerbFinal(clause) {
  const toks = tokens(clause).filter((t) => !/^\d/.test(t.text));
  if (!toks.length) return false;
  const last = toks[toks.length - 1];
  if (/^[A-ZÄÖÜ]/.test(last.text) && toks.length > 1) return false; // a noun or a name
  const w = last.lower;
  if (AUX_MODAL_FORMS.has(w)) return true;
  if (NOT_VERB_FINAL.has(w)) return false;
  if (FUNCTION_WORDS.has(w)) return false;
  return /(?:en|ern|eln|t|e|st|n)$/.test(w) && w.length > 2;
}

/** Does the sentence end with a question mark? */
export const isQuestion = (sentence) => /\?\s*[“”"»]?\s*$/.test(String(sentence ?? '').trim());

/** Count characters the way a 360-px line does: code points. */
export const charLength = (text) => [...String(text ?? '')].length;
