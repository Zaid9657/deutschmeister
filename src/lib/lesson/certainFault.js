// When the final check may say WRONG (independent score and two blind corpora, 2026-11-25).
//
// Measured on 4,400 correct and 2,000 faulty answers that two models wrote without seeing the keys: the fault rules
// of finalCheck.js named a fault in 962 of the correct ones („Wo finde ich mein Büro?“ missing, „Ja, ich kann
// mitkommen.“ task, „Das hier ist meine Mutter.“ order). A fault is certain only where the answer lines up word for
// word with an answer the turn accepts and differs from it by one nameable mistake — or where the mistake is one no
// context makes right (du for Sie, an English word, a wrong ending). Everything else is BEYOND: not praised, not a
// miss, the Lektion's own wording shown.
//
// Nothing here verifies an answer; it only decides whether a named fault stands.

const toks = (s) => String(s || '').normalize('NFC').toLocaleLowerCase('de').replace(/ß/g, 'ss').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/’/g, "'")
  .replace(/[„“"()]/g, ' ').replace(/(?<!\d)[.:]|[.:](?!\d)|[,!?;–]/g, ' ').split(/\s+/).filter(Boolean);
const GAP = '§';
const MAX_GAP = 8;

// What may stand before or after an answer without being part of it.
const LEAD = new Set(['hallo', 'hi', 'guten', 'tag', 'morgen', 'abend', 'entschuldigung', 'ja', 'nein', 'danke', 'bitte', 'gern', 'gerne', 'gut',
  'okay', 'ok', 'sehr', 'super', 'prima', 'toll', 'schoen', 'vielen', 'dank', 'ach', 'oh', 'also', 'und', 'frau', 'herr']);
const TAIL = new Set(['bitte', 'danke', 'gern', 'gerne', 'frau', 'herr']);

const set = (s) => new Set(s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').split(' '));
const PRONOUN = set('ich du er sie es wir ihr man');
const ARTICLES = set('der die das den dem des ein eine einen einem einer');
const POSSESSIVE = /^(?:mein|dein|sein|ihr|unser|euer|eur|kein)(?:e|en|em|er|es)?$/;
const PREPOSITION = set('aus von nach zu in im ins an am um auf bei mit für bis vom zum zur beim');
const OBJECT_PRONOUN = set('mich mir dich dir ihn ihm uns euch ihnen');
const QUESTION = set('was wo wann wie woher wohin wer wen wem welche welcher welches welchen');
const SEIN = set('bin bist ist sind seid');
const HABEN = set('habe hast hat haben habt');
const SEP_PREFIX = set('auf ab an ein mit zu aus los');
const DAYS = set('montag dienstag mittwoch donnerstag freitag samstag sonntag');
const SIMPLE_PREPOSITION = set('aus von nach zu in an um auf bei mit für bis');
const DEFINITE = set('der die das den dem des');
// „dieser“, „welchem“, „jeden“: a determiner the fault rules read no case from.
const DEMONSTRATIVE = /^(?:dies|welch|jed|jen|manch|solch)(?:e|er|es|en|em)$/;
const TIME_ADVERB = /^(?:heute|morgen|gestern|bald|uebermorgen|jetzt|naechste[nrsm]?|diese[nrsm]?|jede[nrsm]?|immer|noch)$/;
const NUMBER = /^(?:\d[\d.:]*|uhr|halb|viertel|ein|eins|zwei|drei|vier|fuenf|sechs|sieben|acht|neun|zehn|elf|zwoelf|zwanzig|dreissig)$/;
// A word that no German sentence of these frames does without, or may hold twice.
const FUNCTION = (w) => PRONOUN.has(w) || ARTICLES.has(w) || POSSESSIVE.test(w) || PREPOSITION.has(w) || OBJECT_PRONOUN.has(w) || QUESTION.has(w) || SEIN.has(w) || HABEN.has(w);
// Verb forms of one verb: they share at least three letters and one is the other with another ending or vowel.
const stem = (w) => w.replace(/(?:est|et|st|en|e|t|n)$/, '');
const sameLemma = (a, b) => {
  if (a === b) return false;
  if ([SEIN, HABEN].some((s) => s.has(a) && s.has(b))) return true;
  const [x, y] = [stem(a), stem(b)];
  if (x.length >= 2 && x === y) return true;
  const u = (w) => w.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u').replace(/i/g, 'e');
  return x.length >= 3 && u(x) === u(y);
};
// Two words of one closed class: one in the other's place changes the sentence, and only one of them is right there.
const sameClass = (a, b) => (PRONOUN.has(a) && PRONOUN.has(b)) || (ARTICLES.has(a) && ARTICLES.has(b) && DEFINITE.has(a) === DEFINITE.has(b)) || (POSSESSIVE.test(a) && POSSESSIVE.test(b) && !(PRONOUN.has(a) && PRONOUN.has(b)))
  || (SIMPLE_PREPOSITION.has(a) && SIMPLE_PREPOSITION.has(b)) || ((OBJECT_PRONOUN.has(a) || PRONOUN.has(a)) && (OBJECT_PRONOUN.has(b) || PRONOUN.has(b)))
  || (QUESTION.has(a) && QUESTION.has(b)) || ((SEIN.has(a) || HABEN.has(a)) && (SEIN.has(b) || HABEN.has(b)));

const frameTokens = (turn) => {
  if (!turn) return [];
  const raw = [...[...(turn.accepted || []), ...(turn.more || [])].map((a) => (typeof a === 'string' ? a : a.frame)), ...(turn.answerWords || [])];
  return raw.map((f) => toks(String(f).replace(/…/g, ` ${GAP} `))).filter((f) => f.some((w) => w !== GAP));
};

/** The cheapest word-for-word alignment of an answer with a frame: a gap takes one to eight words at no cost. */
function align(a, f) {
  const n = a.length;
  const m = f.length;
  const D = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));
  D[0][0] = { c: 0, ops: [], gap: 0, inGap: [] };
  for (let i = 0; i <= n; i += 1) {
    for (let j = 0; j <= m; j += 1) {
      if (!i && !j) continue;
      let best = null;
      const put = (p, c, op, gap = 0) => {
        if (p && (!best || p.c + c < best.c)) best = { c: p.c + c, ops: op ? [...p.ops, op] : p.ops, gap: Math.max(p.gap, gap), inGap: gap ? [...p.inGap, ...a.slice(i - gap, i)] : p.inGap };
      };
      if (j && f[j - 1] === GAP) {
        for (let k = 1; k <= Math.min(MAX_GAP, i); k += 1) put(D[i - k][j - 1], 0, null, k);
      } else if (i && j) {
        put(D[i - 1][j - 1], a[i - 1] === f[j - 1] ? 0 : 1, a[i - 1] === f[j - 1] ? null : { op: 'sub', a: a[i - 1], f: f[j - 1] });
      }
      if (i) put(D[i - 1][j], 1, { op: 'ins', a: a[i - 1] });
      if (j && f[j - 1] !== GAP) put(D[i][j - 1], 1, { op: 'del', f: f[j - 1] });
      D[i][j] = best;
    }
  }
  return D[n][m];
}

/** An answer without what stands around it: a greeting, a thank-you, the partner's name. */
function stripped(a, names) {
  const lead = (w) => LEAD.has(w) || names.has(w);
  const tail = (w) => TAIL.has(w) || names.has(w);
  const out = [a];
  let x = a;
  while (x.length > 1 && lead(x[0])) { x = x.slice(1); out.push(x); }
  for (const y of [...out]) { let z = y; while (z.length > 1 && tail(z.at(-1))) { z = z.slice(0, -1); out.push(z); } }
  return out;
}

/** The nearest accepted answer: `cost` word edits, what they are, the longest gap, and whether the same words stand in another order. */
export function nearestFrame(turn, text) {
  const frames = frameTokens(turn);
  const whole = toks(text);
  if (!whole.length || !frames.length) return null;
  const names = new Set([...(turn.lexicon?.names || []), ...toks(turn.partner)]);
  let best = null;
  for (const a of stripped(whole, names)) {
    for (const f of frames) {
      const r = align(a, f);
      const fixed = f.filter((w) => w !== GAP).length;
      // A frame of one word and a long gap („Ich …“) is near to anything: it stands behind a frame that says more.
      const far = r ? r.c + (fixed <= 1 && r.gap >= 2 ? 1.5 : 0) : Infinity;
      if (r && (!best || far < best.far || (far === best.far && fixed > best.fixed))) best = { far, cost: r.c, ops: r.ops, gap: r.gap, inGap: r.inGap, fixed, frame: f, answer: a };
    }
  }
  const sorted = (x) => [...x].sort().join(' ');
  const perm = stripped(whole, names).some((a) => frames.some((f) => !f.includes(GAP) && f.length === a.length && f.length > 1 && sorted(f) === sorted(a) && f.join(' ') !== a.join(' ')));
  // Only the frame's own words, its gap left empty („Ich komme aus.“).
  const empty = stripped(whole, names).some((a) => frames.some((f) => f.includes(GAP) && f.filter((w) => w !== GAP).join(' ') === a.join(' ') && !frames.some((g) => g.join(' ') === a.join(' '))));
  return best && { ...best, perm, empty, whole };
}

/** A word twice with nothing between („Mein Name ist ist Omar“, „gern gern“); a digit said twice is a number. */
const doubled = (text) => /(?<!\p{L})(\p{L}{2,})\s+\1(?!\p{L})/iu.test(text) && !/(?<!\p{L})(ein|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|null|zehn)\s+\1(?!\p{L})/iu.test(text);
const NOTHING = (w) => FUNCTION(w) || ['und', 'oder', 'nichts', 'nicht', 'nein', 'ja', 'auch', 'noch', 'schon', 'hier', 'da'].includes(w);

const FRONT = set('am um im in nach aus mit bei zu heute morgen gestern morgens abends nachmittags dann jetzt hier oft manchmal');
const BEFORE_VERB = set('gern gerne auch oft immer morgens abends heute jetzt nicht dann');
/**
 * The verb second, the rule a beginner breaks most: „Am Wochenende ich spiele …“, „Nach Berlin ich fahre.“, „Ich gern
 * spiele …“, and a verb of two parts left whole („Ich fernsehe gern“).
 */
function verbPlace(text, isVerb) {
  return String(text || '').split(/[.!?,;]+/).some((clause) => {
    const w = toks(clause);
    if (w.length < 3 || w.some((x) => ['dass', 'ob', 'wenn', 'weil', 'wie', 'was', 'wo', 'wann'].includes(x))) return w.length === 2 && PRONOUN.has(w[0]) && unsplit(w[1], isVerb);
    const p = w.findIndex((x) => PRONOUN.has(x) && x !== 'ihr');
    if (p > 0 && FRONT.has(w[0]) && !w.slice(0, p).some((x) => isVerb(x)) && w[p + 1] && isVerb(w[p + 1])) return true;
    if (p === 0 && BEFORE_VERB.has(w[1]) && w[2] && isVerb(w[2])) return true;
    return p === 0 && unsplit(w[1], isVerb);
  });
}
const unsplit = (x, isVerb) => { const m = String(x || '').match(/^(?:fern|auf|ein|an|ab|mit|aus)(\p{L}{3,})$/u); return Boolean(m) && isVerb(m[1]) && !isVerb(x); };

// A preposition before a verb, before another preposition or at the end („Freitag zehn um passt mir“, „sechs um Uhr auf“).
const NEVER_LAST = set('am um im ins zum zur beim vom in bei für ohne gegen bis von seit');
function prepositionPlace(text, isVerb) {
  return String(text || '').split(/[.!?;]+/).some((clause) => {
    const w = toks(clause);
    return w.some((x, i) => NEVER_LAST.has(x) && (i === w.length - 1 || (NEVER_LAST.has(w[i + 1]) && !(x === 'bis' || w[i + 1] === 'bis' || (x === 'von' && w[i + 1] === 'bis'))) || (w[i + 1] === 'uhr' && x === 'um') || (isVerb(w[i + 1]) && !QUESTION.has(w[i + 1]) && !SEIN.has(w[i + 1]))));
  });
}

/** A date that does not exist („31.04.1990“, „12/13/1990“). */
const badDate = (text) => [...String(text || '').matchAll(/(\d{1,2})[./]\s?(\d{1,2})[./]\s?(\d{4})/g)].some(([, d, m, y]) => Number(m) < 1 || Number(m) > 12 || Number(d) < 1 || Number(d) > new Date(Number(y), Number(m), 0).getDate());

/** A message without one of its parts: no date, a date without its year, no name. */
const partMissing = (text) => badDate(text) || !/\d{1,2}\.?\s*(?:[./]\s*\d|januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember)|(?:er?sten|ten|zwanzigsten|dreißigsten)\s/iu.test(text) || !/\d|januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember/iu.test(text)
  || !/(?:^|\D)\d{4}(?:\D|$)|neunzehnhundert|zweitausend/iu.test(text) || !/\bhei(?:ß|ss)|\bname\b|\bich\s+bin\s+\p{Lu}/iu.test(text);

const ADJECTIVE_PLACE = /(?<!\p{L})(?:k?eine?n?|der|die|das|den|meine?n?)\s+(?:heiße|heißen|gute|guten|kalte|kalten)\s+\p{Lu}/u;

// A fault no context makes right.
// (Claude score, 2026-11-25: „asdf“, „x“ and „Keine Ahnung“ were sent to BEYOND with half the answer shown; a participle with
// the wrong auxiliary, an infinitive in its place, and a verb said twice, are wrong in every sentence.)
const ALWAYS = new Set(['address', 'ending', 'english', 'spelling', 'heard', 'name', 'nonsense', 'answer', 'infinitive', 'auxiliary', 'twice']);

/** „in Montag“, „im Freitag“, „um Montag“, „am 17 Uhr“, „am Mai“, „in Mai“: a preposition no day, clock time or month takes. */
const MONTHS = set('januar februar maerz april mai juni juli august september oktober november dezember');
const timePreposition = (whole) => whole.some((w, i) => (DAYS.has(w) && ['in', 'im', 'um', 'zu', 'bei', 'an'].includes(whole[i - 1]))
  || (MONTHS.has(w) && ['am', 'in', 'um', 'an'].includes(whole[i - 1]) && !/^\d/.test(whole[i - 2] || '') && whole[i - 2] !== 'anfang' && whole[i - 2] !== 'ende')
  || (w === 'uhr' && i >= 2 && whole[i - 2] === 'am' && /^\d|^(?:ein|zwei|drei|vier|fuenf|sechs|sieben|acht|neun|zehn|elf|zwoelf)/.test(whole[i - 1])));

/**
 * One object pronoun in the place of another, the rest the turn's answer word for word: „Mich geht es gut.“, „Ich lade dir ein.“.
 * Null, or the fault's name.
 */
export function pronounSwap(turn, text) {
  const n = nearestFrame(turn, text);
  if (!n || n.cost !== 1 || n.ops[0].op !== 'sub') return null;
  const { a, f } = n.ops[0];
  const pairs = [['mir', 'mich'], ['dir', 'dich'], ['ihm', 'ihn'], ['ihnen', 'sie']];
  return pairs.some(([x, y]) => (a === x && f === y) || (a === y && f === x)) ? 'word' : null;
}

/**
 * Whether a named fault stands. `knows(word)` says whether the course (or the grader's own lists) knows a small word:
 * a sentence with a small word it does not know („soll“, „würde“, „diesem“) is one it cannot judge by form.
 */
export function certainFault(turn, text, reason, knows, isVerb = () => false) {
  if (ALWAYS.has(reason)) return true;
  if (timePreposition(toks(text)) || verbPlace(text, isVerb) || (reason === 'order' && prepositionPlace(text, isVerb))) return true;
  // Telling the time takes no „um“ („Es ist um halb neun“).
  if (turn.slot === 'clock' && /\bist\s+(?:es\s+)?um\b/iu.test(text)) return true;
  if (reason === 'extra' && doubled(text)) return true;
  // Keys struck at random („asdf jkl“): no word of it is known and one has no vowel. Unknown German stays unjudged.
  if (reason === 'german') { const w = toks(text); return w.length > 0 && w.every((x) => !knows(x)) && w.some((x) => !/[aeiouy]/.test(x)); }
  if (reason === 'message') return partMissing(text);
  const n = nearestFrame(turn, text);
  if (!n) return false;
  if (n.empty || (n.cost === 0 && n.gap > 0 && n.fixed >= 1 && n.inGap.every(NOTHING))) return true;
  const [op] = n.ops;
  const one = n.cost === 1 && n.ops.length === 1;
  // An accepted answer with a greeting or a thank-you around it has no fault.
  if (n.cost === 0 && n.gap === 0) return false;
  const unknownSmall = String(text).match(/\p{L}+/gu)?.some((w, i) => (i > 0 && /^\p{Ll}/u.test(w) && !knows(w)) || DEMONSTRATIVE.test(w.toLocaleLowerCase('de'))) || false;
  // The subject and the verb right after it, in another person („Ich spielen gern Fußball.“).
  if (reason === 'agreement' && !unknownSmall && PRONOUN.has(n.whole[0]) && n.whole.length >= 2 && isVerb(n.whole[1])) return true;
  // The verb the frame wants early stands later in the answer („Ich in Bremen wohne“). A pronoun after its verb is German.
  const verbLike = (w) => SEIN.has(w) || HABEN.has(w) || !(FUNCTION(w) || SEP_PREFIX.has(w) || /^ge\p{L}+(?:t|en)$/u.test(w) || w === 'bis');
  const moved = () => one && op.op !== 'ins' && verbLike(op.f) && n.answer.includes(op.f) && (op.op === 'del' || n.frame.indexOf(op.f) <= 1);
  const noPronoun = !n.answer.some((w) => PRONOUN.has(w));
  switch (reason) {
    case 'article': return !unknownSmall && n.answer.length <= 10;
    // („Am 12. Mai ist mein Geburtstag“ is no date of five words.)
    case 'date': return n.cost === 0 && n.gap <= 3;
    case 'case': return !unknownSmall && n.cost <= 2 && n.gap <= 6;
    case 'agreement': case 'auxiliary': case 'participle': case 'verb': case 'tense':
      // An adjective that looks like a verb („eine heiße Schokolade“), a double subject the course does not teach („sowohl … als auch“).
      if (ADJECTIVE_PLACE.test(text) || n.whole.includes('sowohl')) return false;
      if (one && op.op === 'sub' && n.gap <= 6 && sameLemma(op.a, op.f)) return true;
      if (unknownSmall || n.gap > 6) return false;
      // („Ich spielen gern Fußball.“: the frame's own pronoun and the verb right after it.)
      if (n.cost === 0) return n.gap <= 3 && n.frame[0] !== GAP && (n.fixed >= 2 || PRONOUN.has(n.frame[0]));
      return one && !(op.op === 'sub' && !sameLemma(op.a, op.f) && !sameClass(op.a, op.f) && !FUNCTION(op.f));
    case 'person': return one && op.op === 'sub' && sameLemma(op.a, op.f);
    case 'order': return n.perm || moved();
    case 'missing':
      // („Ich studiere.“, „Ich stehe früh auf.“: another verb or a word of time in the place of the frame's.)
      if (n.answer.some((w) => isVerb(w) && !n.frame.includes(w)) || n.answer.some((w) => ['frueh', 'spaet', 'erst', 'schon'].includes(w))) return false;
      // („Ich studiere.“: a verb the course does not teach after „ich“; „Ich bin Syrer.“: a nationality, no place.)
      if (n.answer[0] === 'ich' && /e$/.test(n.answer[1] || '') && !knows(n.answer[1]) && !FUNCTION(n.answer[1])) return false;
      if (one && op.op === 'del' && PREPOSITION.has(op.f) && n.inGap.length && n.inGap.every((w) => /(?:er|erin)$/.test(w) && !DAYS.has(w))) return false;
      if (one && op.op === 'del') {
        // A preposition left out before „morgen“, „nächste Woche“ is none; „Wiedersehen!“ is German too.
        if (PREPOSITION.has(op.f) && (n.answer.some((w) => TIME_ADVERB.test(w)) || !n.frame.includes(GAP))) return false;
        // („Hier Yilmaz.“: on the phone the name stands without its verb.)
        if (op.f === 'ist' && n.whole.includes('hier')) return false;
        return FUNCTION(op.f) && !n.answer.includes(op.f) && n.gap <= 5;
      }
      if (one && op.op === 'sub') return (PRONOUN.has(op.f) && noPronoun && PREPOSITION.has(op.a)) || (SEP_PREFIX.has(op.f) && n.frame.at(-1) === op.f && !n.answer.includes(op.f));
      return false;
    case 'extra': return one && op.op === 'ins' && FUNCTION(op.a) && n.gap <= 5 && !PREPOSITION.has(op.a);
    case 'word':
      // („Ich wohne bei meinem Bruder.“: another preposition with what the learner names is another sentence, not a fault.)
      if (one && op.op === 'sub' && SIMPLE_PREPOSITION.has(op.a) && SIMPLE_PREPOSITION.has(op.f) && n.inGap.some((w) => ARTICLES.has(w) || POSSESSIVE.test(w))) return false;
      // („Was kostet eine Fahrkarte für mich?“: a pronoun is no place, so this is another sentence than „… nach …“.)
      if (one && op.op === 'sub' && PREPOSITION.has(op.f) && n.inGap.some((w) => OBJECT_PRONOUN.has(w))) return false;
      if (one && op.op === 'sub' && n.gap <= 3) return sameClass(op.a, op.f) || sameLemma(op.a, op.f) || (PRONOUN.has(op.f) && noPronoun && PREPOSITION.has(op.a));
      return false;
    // („Sie ist erst zwanzig.“: a word of degree before the number is no other kind of answer.)
    case 'kind': return !n.whole.some((w) => ['erst', 'schon', 'noch', 'fast', 'ungefaehr', 'etwa'].includes(w)) && n.cost === 0 && n.gap <= 2 && n.fixed >= 2 && !unknownSmall && !n.whole.includes('lieber');
    // A day, a time or an answer the task does not ask for, in the turn's own frame.
    case 'task': return n.cost === 0 && Boolean(turn.when || turn.time) && n.gap <= 5 && n.answer.some((w) => DAYS.has(w) || NUMBER.test(w));
    default: return false;
  }
}
