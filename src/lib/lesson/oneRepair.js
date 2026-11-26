// One change that makes a faulty sentence the answer (loop round 3, 2026-11-25). An answer that cannot be read as German, and
// that can be read — and answers the turn — after exactly one nameable change, has that fault for certain: the verb moved to its
// place, the verb in the right person, the missing subject put in, the determiner or pronoun in its other case, the preposition of
// a time, the participle's form. The change itself is never shown to the learner; its name picks the hint.
// Round 4 adds what textbooks call the first mistakes: a verb too many („Ich bin komme aus Syrien“), a subject said twice („Meine
// Mutter sie kommt“), sein before an infinitive („Ich bin um sechs aufstehen“), no verb („Ich aus Syrien“), two prepositions.
import { ACCUSATIVE_PREP, ADVERBS, CONTRACTED, COORDINATORS, DATIVE_PREP, DAYS, MONTHS, NUMBER_WORDS, PRONOUNS, SUBORDINATORS, TWO_WAY_PREP, W_WORDS, adjectiveForm, determinerOf, fold, formsOf, isBaseVerb, participleFor, separableOf, verbReadings } from './germanForms.js';
import { tokenize } from './clause.js';

const DEFINITE = ['der', 'die', 'das', 'den', 'dem'];
const ENDINGS = ['', 'e', 'en', 'em', 'er', 'es'];
const PREPOSITIONS = ['am', 'um', 'im', 'in', 'an', 'auf', 'nach', 'zu', 'aus', 'bei', 'mit', 'von', 'vor', 'für', 'seit', 'unter'];
const CASES = [['ich', 'mich', 'mir'], ['du', 'dich', 'dir'], ['er', 'ihn', 'ihm'], ['sie', 'ihr'], ['wir', 'uns'], ['Sie', 'Ihnen'], ['ihr', 'euch']];
const AUXILIARY = { habe: 'bin', bin: 'habe', hast: 'bist', bist: 'hast', hat: 'ist', ist: 'hat', haben: 'sind', sind: 'haben', hab: 'bin' };
const WORDS = { wenn: 'wann', den: 'denn', dass: 'das', das: 'dass', seit: 'seid', seid: 'seit', wen: 'wann', man: 'mein', ihn: 'in', im: 'ihm', wie: 'was', wo: 'wie' };
const SEIN_PERSON = { bin: 'ich', bist: 'du', ist: 'er', sind: 'sie', seid: 'ihr' };
const BE_OR_HAVE = new Set(['bin', 'bist', 'ist', 'sind', 'habe', 'hast', 'hat', 'haben']);
// What a sentence without a verb most often lacks, after its subject.
const LACKING = ['bin', 'ist', 'sind', 'habe', 'komme', 'kommt', 'spreche', 'spricht', 'heiße', 'spiele', 'wohne', 'brauche', 'möchte', 'arbeite'];
const PREP = (f) => DATIVE_PREP.has(f) || ACCUSATIVE_PREP.has(f) || TWO_WAY_PREP.has(f) || Boolean(CONTRACTED[f]);
const cap = (s) => s.charAt(0).toLocaleUpperCase('de') + s.slice(1);
const low = (s) => s.charAt(0).toLocaleLowerCase('de') + s.slice(1);

/** The text of tokens again, first letters of its sentences capital. */
function say(tokens) {
  let out = '';
  let start = true;
  for (const t of tokens) {
    if (t.kind === 'p') { out += t.raw; if (/[.!?:]/.test(t.raw)) start = true; continue; }
    out += `${out ? ' ' : ''}${start ? cap(t.raw) : t.raw}`;
    start = false;
  }
  return out;
}

/** Is every small word one a list knows? Else what cannot be read may be German the reader does not know. */
export function smallWordsKnown(text, known) {
  return tokenize(text).every((t, i) => {
    if (t.kind !== 'w' || (t.cap && i > 0)) return true;
    const w = t.f;
    return Boolean(PRONOUNS[w]) || ADVERBS.has(w) || Boolean(CONTRACTED[w]) || Boolean(determinerOf(w)) || verbReadings(w).length > 0 || adjectiveForm(w).length > 0 || SUBORDINATORS.has(w) || COORDINATORS.has(w)
      || W_WORDS.has(w) || DATIVE_PREP.has(w) || ACCUSATIVE_PREP.has(w) || TWO_WAY_PREP.has(w) || NUMBER_WORDS.includes(w) || /^(?:ja|nein|halb|viertel|uhr|mal|eins|gestern)$/u.test(w)
      || t.cap || known(w) || /^\p{Ll}{3,}(?:te|ste)n?$/u.test(w) || /^\p{Ll}*ge\p{Ll}+(?:t|en)$/u.test(w);
  });
}

/** [{ text, fault }]: the text after each single change, the surest kinds first. */
const SET_NOUNS = new Set(['beruf', 'apparat', 'telefon', 'wochenende', 'geburtstag', 'hause', 'uhr', 'nacht', 'morgen', 'abend', 'mittag', 'vormittag', 'nachmittag', 'moment', 'viertel', 'halb', 'party', 'fest']);
const SETTLED = (t, isPlace) => Boolean(t) && (t.kind !== 'w' || DAYS.some((d) => t.f.startsWith(d)) || MONTHS.includes(t.f) || NUMBER_WORDS.includes(t.f) || SET_NOUNS.has(t.f) || (t.cap && isPlace(t.raw)));
export function repairs(text, { fragments = false, isPlace = () => false, isThing = () => false } = {}) {
  const T = tokenize(text);
  if (T.length > 18 || T.length < 2) return [];
  const out = [];
  const starts = T.map((t, i) => i === 0 || (T[i - 1].kind === 'p' && /[.!?:]/.test(T[i - 1].raw)));
  // A word that stood first and moves inside is written small unless it is a noun or a name.
  const inside = (t, i) => (starts[i] && t.kind === 'w' && (verbReadings(t.f).length || PRONOUNS[t.f] || determinerOf(t.f) || CONTRACTED[t.f] || adjectiveForm(t.f).length || /^(?:wo|was|wann|wie|wer|welche|welcher|welches|woher|wohin|dann|heute|morgen|gestern|jetzt|hier|da|am|um|im|in|nach|natürlich|gestern|gern|meistens|immer)$/u.test(t.f)) ? { ...t, raw: low(t.raw) } : t);
  // `sure`: what is left out or put in is wrong even where the sentence can be read („eine Zeit“, „um die sechs Uhr“).
  const put = (list, fault, sure = false) => { const s = say(list); if (s !== text) out.push({ text: s, fault, sure }); };
  const replace = (i, raw, fault) => put(T.map((t, k) => (k === i ? { ...t, raw: starts[i] ? cap(raw) : raw } : t)), fault);
  const bounds = (i) => { let a = i; let b = i; while (a > 0 && T[a - 1].kind !== 'p') a -= 1; while (b < T.length - 1 && T[b + 1].kind !== 'p') b += 1; return [a, b]; };
  const verbs = T.map((t, i) => ({ t, i })).filter(({ t, i }) => t.kind === 'w' && (!t.cap || starts[i]) && verbReadings(t.f).length);

  // The dative feeling formula has the fixed verb group geht es, including
  // negation, degree words and a fronted time. The reader must verify the
  // complete healed answer before this can name a fault.
  for (const { t, i } of verbs) {
    const [a, b] = bounds(i);
    const clause = T.slice(a, b + 1);
    if (verbReadings(t.f).some((r) => r.lemma === 'gehen')
      && clause.some((x) => /^(?:mir|dir|ihm|ihr|ihnen|uns|euch)$/u.test(x.f))
      && !clause.some((x) => x.f === 'es')) {
      put([...T.slice(0, i), { raw: 'geht', f: 'geht', kind: 'w' }, { raw: 'es', f: 'es', kind: 'w' }, ...T.slice(i + 1)], t.f === 'geht' ? 'missing' : 'verb', true);
    }
  }

  // No verb at all: „Mein Heft grün.“, „Ich am Dienstag frei.“, „Meine Telefonnummer 030 …“.
  if (fragments && (/^(?:ich|es|mein|meine|der|die|das)$/u.test(T[0].f) || /^(?:ja|danke|nein)$/u.test(T[0].f))) {
    for (let i = 1; i <= Math.min(4, T.length - 1); i += 1) for (const v of ['ist', 'bin', 'habe', 'sind']) put([...T.slice(0, i), { raw: v, f: v, kind: 'w' }, ...T.slice(i)], 'missing');
  }
  // A clause with no verb at all: „Ich aus Syrien.“, „Sie hier.“, „Ich heiße Omar. Ich am 3.5.1990 geboren.“
  for (let a = 0; a < T.length; a += 1) {
    if (!starts[a] || T[a].kind !== 'w') continue;
    const [, b] = bounds(a);
    const own = T.slice(a, b + 1);
    if (!/^(?:ich|es|er|sie|wir|mein|meine|der|die|das)$/u.test(T[a].f) || own.some((x) => x.kind === 'w' && (!x.cap || x === T[a]) && verbReadings(x.f).some((r) => ['fin', 'imp', 'past'].includes(r.mood)))) continue;
    for (const k of /^(?:mein|meine|der|die|das)$/u.test(T[a].f) ? [a + 1, a + 2] : [a + 1]) if (k <= b + 1) for (const v of LACKING) put([...T.slice(0, k), { raw: v, f: fold(v), kind: 'w' }, ...T.slice(k)], 'missing');
  }
  for (const { t, i } of verbs) {
    const [a, b] = bounds(i);
    const others = verbs.filter((v) => v.i !== i && v.i >= a && v.i <= b);
    const readings = verbReadings(t.f);
    const drop = (k, fault = 'extra') => put(T.filter((_, n) => n !== k).map((x, n) => (n === 0 ? { ...x, raw: cap(x.raw) } : x)), fault);
    for (const o of others) {
      const or = verbReadings(o.t.f);
      const fin = or.some((r) => ['fin', 'inf'].includes(r.mood)) && !or.some((r) => r.mood === 'part');
      // „Ich bin komme aus Syrien.“, „Wie viel ist kostet die Fahrkarte?“: two verbs where one stands.
      if (BE_OR_HAVE.has(t.f) && fin && !readings.some((r) => r.modal)) {
        drop(i, 'verb');
        if (or.some((r) => r.mood === 'fin')) drop(o.i, 'verb');
        // „Ich bin in Bremen wohne.“
        if (o.i > i + 1) for (const r of or.filter((x) => x.mood === 'fin' && x.persons.includes(SEIN_PERSON[t.f]))) if (r.lemma !== 'sein') put(T.map((x, k) => (k === i ? { ...x, raw: starts[i] ? cap(o.t.raw) : o.t.raw, f: o.t.f } : x)).filter((_, k) => k !== o.i), 'verb');
        // „Ich bin kommen aus Syrien.“, „Ich bin um sechs Uhr aufstehen.“
        const person = SEIN_PERSON[t.f];
        for (const r of person ? or.filter((x) => x.mood === 'inf') : []) {
          const lemma = r.sep ? r.lemma.slice(r.sep.length) : r.lemma;
          const form = formsOf(lemma).find(([, persons]) => persons.includes(person))?.[0];
          if (!form) continue;
          const list = T.map((x, k) => (k === i ? { ...x, raw: starts[i] ? cap(form) : form, f: fold(form) } : x)).filter((_, k) => k !== o.i);
          const end = b - (o.i <= b ? 1 : 0);
          put(r.sep ? [...list.slice(0, end + 1), { raw: r.sep, f: r.sep, kind: 'w' }, ...list.slice(end + 1)] : list, 'verb');
        }
      }
      // „Ich lese gern lesen.“, „Ich spreche Arabisch sprechen.“
      if (o.i > i && readings.some((r) => r.mood === 'fin') && or.some((r) => r.mood === 'inf' && readings.some((x) => x.lemma === r.lemma))) drop(o.i);
      // „Ich möchte isst Suppe.“, „Ja, ich möchte mitkomme.“: behind a modal the infinitive, at the end.
      if (readings.some((r) => r.modal || r.lemma === 'möchten') && o.i > i) for (const r of or.filter((x) => ['fin', 'last'].includes(x.mood))) {
        const list = T.filter((_, k) => k !== o.i);
        put([...list.slice(0, b), { raw: r.lemma, f: fold(r.lemma), kind: 'w' }, ...list.slice(b)], 'infinitive');
      }
    }
    // „Ich kaufe ein gern.“: the prefix right behind its verb goes to the end of the clause.
    if (readings.some((r) => r.mood === 'fin') && T[i + 1]?.kind === 'w' && i + 1 < b && !PREP(T[i + 2]?.f || '') && separableOf((readings.find((r) => r.mood === 'fin') || {}).lemma).some((s) => s.prefix === T[i + 1].f)) {
      const list = T.filter((_, k) => k !== i + 1);
      put([...list.slice(0, b), T[i + 1], ...list.slice(b)], 'order', true);
    }
    // „Meine Mutter sie kommt aus Syrien.“, „Das sie ist meine Mutter.“
    if (i > a + 1 && /^(?:er|sie|es|das|die|der)$/u.test(T[i - 1].f) && !T[i - 1].cap && T[i - 2].kind === 'w' && (T[i - 2].cap || T[i - 2].f === 'das') && readings.some((r) => r.mood === 'fin')) drop(i - 1);
    // „Ich lade zum Fest ein.“, „Ich wünsche ein Buch.“
    if (readings.some((r) => r.mood === 'fin') && !T.slice(a, b + 1).some((x) => /^(?:mich|dich|ihn|uns|euch|mir|dir|ihm|ihnen|sich)$/u.test(x.f))) for (const k of [i + 1, i + 2]) if (k <= b && (k === i + 1 || /^(?:ich|du|er|sie|wir)$/u.test(T[i + 1].f))) for (const w of ['dich', 'mir']) put([...T.slice(0, k), { raw: w, f: w, kind: 'w' }, ...T.slice(k)], 'missing');
  }
  for (const { t, i } of verbs) {
    const readings = verbReadings(t.f);
    const [a, b] = bounds(i);
    // The verb (a finite form, a participle, an infinitive) in another place of its clause.
    const others = T.map((x, k) => (k >= a && k <= b ? inside(x, k) : x)).filter((_, k) => k !== i);
    for (let p = a; p <= b; p += 1) {
      if (p === i) continue;
      put([...others.slice(0, p), inside(t, i), ...others.slice(p)], 'order');
    }
    // Another person of it.
    for (const r of readings.filter((x) => ['fin', 'inf', 'imp'].includes(x.mood) && !x.sep)) for (const [form] of formsOf(r.lemma)) if (fold(form) !== t.f) replace(i, form, 'agreement');
    // haben for sein, a participle for an infinitive.
    if (AUXILIARY[t.f]) replace(i, AUXILIARY[t.f], 'auxiliary');
    for (const r of readings) {
      if (r.mood === 'inf' && r.part) replace(i, r.part, 'infinitive');
      if (r.mood === 'part') replace(i, r.lemma, 'participle');
      if (r.mood === 'fin' && r.part && i > a + 1) replace(i, r.part, 'participle');
      // „Einkaufst du …?“: the prefix at the end.
      if (r.mood === 'last' && r.sep) { const base = t.raw.slice(r.sep.length); const list = T.map((x, k) => (k === i ? { ...x, raw: starts[i] ? cap(base) : base } : x)); put([...list.slice(0, b + 1), { raw: r.sep, f: r.sep, kind: 'w' }, ...list.slice(b + 1)], 'order'); }
      // „Ich stehe um sieben Uhr.“: the prefix is missing, or another one stands there.
      if (r.mood === 'fin') for (const s of separableOf(r.lemma)) {
        put([...T.slice(0, b + 1), { raw: s.prefix, f: s.prefix, kind: 'w' }, ...T.slice(b + 1)], 'missing');
        if (T[b].kind === 'w' && T[b].f !== s.prefix && T[b].f.length <= 4) put(T.map((x, k) => (k === b ? { ...x, raw: s.prefix } : x)), 'word');
      }
    }
    // The subject left out: before the verb, or after it.
    const subject = T.some((x, k) => k >= a && k <= b && x.kind === 'w' && /^(?:ich|du|er|wir|man)$/u.test(x.f));
    if (!subject && (i === a || T[i - 1]?.kind === 'p')) for (const s of ['ich', 'es', 'das', 'wir', 'sie']) put([...T.slice(0, i), { raw: s, f: s, kind: 'w' }, inside(t, i), ...T.slice(i + 1)], 'missing');
    if (!subject) for (const s of ['ich', 'du', 'es', 'Sie', 'wir', 'das']) put([...T.slice(0, i + 1), { raw: s, f: fold(s), kind: 'w' }, ...T.slice(i + 1)], 'missing');
  }
  T.forEach((t, i) => {
    // „Ich stehe sieben Uhr auf.“, „Fährt der Zug Österreich?“: the preposition is missing.
    if (i > 0 && T[i - 1].kind === 'w' && (t.kind === 'n' || t.kind === 'clock' || (t.kind === 'w' && (NUMBER_WORDS.includes(t.f) || ['halb', 'viertel'].includes(t.f))))) put([...T.slice(0, i), { raw: 'um', f: 'um', kind: 'w' }, ...T.slice(i)], 'missing');
    // (Before a thing — furniture, food, drink — no preposition is the missing word: „Ich spiele gern Tisch.“ is no „im Tisch“.)
    if (i > 0 && t.kind === 'w' && t.cap && !isThing(t.raw) && T[i - 1].kind === 'w' && T[i - 1].f.length > 2 && !PREP(T[i - 1].f)) for (const p of ['nach', 'am', 'in', 'von', 'als', 'aus', 'zum', 'mit', 'im']) put([...T.slice(0, i), { raw: p, f: p, kind: 'w' }, ...T.slice(i)], 'missing');
    if (i > 0 && (t.kind === 'date' || t.kind === 'ord') && T[i - 1].kind === 'w' && !PREP(T[i - 1].f)) put([...T.slice(0, i), { raw: 'am', f: 'am', kind: 'w' }, ...T.slice(i)], 'missing');
    const without = (k, fault, sure = false) => put(T.filter((_, n) => n !== k).map((x, n) => (n === 0 ? { ...x, raw: cap(x.raw) } : x)), fault, sure);
    if (t.kind === 'w' && T[i + 1]?.kind === 'w') {
      // „Ich komme aus in Syrien.“, „Ich fahre nach in Berlin.“
      if (PREP(t.f) && PREP(T[i + 1].f) && t.f !== 'bis') { without(i, 'extra'); without(i + 1, 'extra'); }
      // „am der Samstag“, „zum meinem Fest“, „um die sechs Uhr“, „die halb neun“, „eine Zeit“, „ein Arabisch“
      if (determinerOf(t.f) && ['def', 'ein'].includes(determinerOf(t.f).kind) && i > 0 && (CONTRACTED[T[i - 1].f] || ['halb', 'viertel'].includes(T[i + 1].f) || NUMBER_WORDS.includes(T[i + 1].f) || T[i + 1].cap)) without(i, CONTRACTED[T[i - 1].f] ? 'extra' : 'article', ['halb', 'viertel', 'zeit', 'hunger', 'durst'].includes(T[i + 1].f) || (T[i - 1].f === 'um' && NUMBER_WORDS.includes(T[i + 1].f)) || /isch$|^deutsch$/u.test(T[i + 1].f));
      // „am jeden Tag“
      if (CONTRACTED[t.f] && /^jede[nrs]$/u.test(T[i + 1].f)) without(i, 'extra', true);
      // „Wie Uhr ist es?“, „Was Uhr …“, „Um wie viel ist die Pause?“
      if (starts[i] && ['wie', 'was', 'welche'].includes(t.f) && T[i + 1].f === 'uhr') put([{ raw: 'Wie', f: 'wie', kind: 'w' }, { raw: 'viel', f: 'viel', kind: 'w' }, ...T.slice(i + 1)], 'word');
      if (t.f === 'wie' && T[i + 1].f === 'viel' && T[i - 1]?.f === 'um' && T[i + 2]?.f !== 'uhr') put([...T.slice(0, i + 2), { raw: 'Uhr', f: 'uhr', kind: 'w' }, ...T.slice(i + 2)], 'missing');
      // „Mein Geburtstag ist der Mai.“
      if (DEFINITE.includes(t.f) && (MONTHS.includes(T[i + 1].f) || DAYS.includes(T[i + 1].f))) for (const p of ['im', 'am']) put(T.map((x, k) => (k === i ? { ...x, raw: p, f: p } : x)), 'word', true);
    }
    // „Viertel nach sieben Uhr“, „halb sechs Uhr“
    if (t.kind === 'w' && t.f === 'uhr' && i > 1 && T.some((x) => ['halb', 'viertel'].includes(x.f))) without(i, 'extra', true);
    // „eine schön Tag“, „ein klein Salat“: the article and the adjective together.
    if (t.kind === 'w' && determinerOf(t.f) && T[i + 1]?.kind === 'w' && !T[i + 1].cap && adjectiveForm(T[i + 1].f).length && T[i + 2]?.cap) {
      const det = determinerOf(t.f);
      const stem = det.kind === 'def' ? null : det.stem;
      const base = adjectiveForm(T[i + 1].f)[0].stem;
      for (const d of stem ? ENDINGS.map((e) => stem + e).filter((w) => determinerOf(w)) : DEFINITE) for (const e of ENDINGS.slice(1)) put(T.map((x, k) => (k === i ? { ...x, raw: starts[i] ? cap(d) : d } : k === i + 1 ? { ...x, raw: base + e } : x)), 'ending');
    }
    if ((t.kind === 'w' || t.kind === 'n') && T[i + 1]?.kind === 'w' && MONTHS.includes(T[i + 1].f) && NUMBER_WORDS.includes(t.f)) { const o = { ein: 'ersten', drei: 'dritten', sieben: 'siebten', acht: 'achten' }[t.f] || `${t.f}ten`; replace(i, o, 'ending'); }
    if (t.kind !== 'w') return;
    const det = determinerOf(t.f);
    if (DEFINITE.includes(t.f)) { for (const d of DEFINITE) if (d !== t.f) replace(i, d, 'article'); } else if (det) {
      const stem = det.kind === 'ein' ? 'ein' : ['dies', 'many'].includes(det.kind) ? det.stem : det.stem;
      for (const e of ENDINGS) { const w = `${stem}${e}`; if (w !== t.f && determinerOf(w)) replace(i, t.cap && !starts[i] ? cap(w) : w, 'article'); }
      const owner = { mein: ['dein'], dein: ['mein', 'ihr'], ihr: ['mein', 'dein'] }[det.stem];
      for (const o of owner || []) if (det.kind === 'poss') replace(i, t.cap && !starts[i] ? cap(o + t.f.slice(det.stem.length)) : o + t.f.slice(det.stem.length), 'word');
    }
    for (const set of CASES) if (set.some((x) => x === t.raw || (starts[i] && fold(x) === t.f))) for (const other of set) if (fold(other) !== t.f) replace(i, other, 'case');
    for (const [x, y] of [['er', 'sie'], ['er', 'es'], ['sie', 'er'], ['sie', 'es'], ['es', 'er'], ['es', 'sie']]) if (t.f === x && !t.cap) replace(i, y, 'word');
    if (/^(?:\p{Ll}+(?:te|ste))$/u.test(t.f) && NUMBER_WORDS.some((n) => n.length > 2 && t.f.startsWith(n.slice(0, 3)))) replace(i, `${t.f}n`, 'ending');
    // A preposition is certainly the wrong one only before a time, a place name or a set noun („von Beruf“, „am Apparat“).
    if ((PREPOSITIONS.includes(t.f) || t.f === 'hinter' || CONTRACTED[t.f]) && SETTLED(T[i + 1], isPlace)) for (const p of PREPOSITIONS) if (p !== t.f) replace(i, p, 'word');
    if (WORDS[t.f]) replace(i, WORDS[t.f], 'word');
    const adj = !t.cap || starts[i] ? adjectiveForm(t.f).filter((x) => x.ending) : [];
    if (adj.length) for (const e of ENDINGS) { const w = adj[0].stem + e; if (w !== t.f) replace(i, w, 'ending'); } else if ((!t.cap || (starts[i] && T[i + 1]?.cap)) && adjectiveForm(t.f).length) for (const e of ['e', 'en', 'er', 'es']) replace(i, t.f + e, 'ending');
    // „gebackt“, „gegesst“, „eingeladet“: the participle of a strong verb.
    if (!verbReadings(t.f).length && /^(?:\p{Ll}*)ge\p{Ll}+(?:t|en)$/u.test(t.f)) {
      const m = t.f.match(/^(\p{Ll}*?)ge(\p{Ll}+?)(?:et|t|en)$/u);
      for (const stem of m ? [m[2], m[2].replace(/ss$/u, 's'), m[2].replace(/^g(?=ess)/u, '')] : []) for (const inf of [`${stem}en`, `${stem}n`]) {
        const lemma = m[1] ? `${m[1]}${inf}` : inf;
        const part = isBaseVerb(lemma) ? participleFor(lemma) : m[1] && isBaseVerb(inf) ? `${m[1]}${participleFor(inf)}` : null;
        if (part && fold(part) !== t.f) replace(i, part, 'participle');
      }
    }
    if (t.cap && starts[i] && !determinerOf(t.f) && !verbReadings(t.f).length && !PRONOUNS[t.f]) for (const d of ['mein', 'meine', 'der', 'die', 'das']) put([...T.slice(0, i), { raw: d, f: d, kind: 'w' }, ...T.slice(i)], 'article');
    // An article before a bare noun.
    if (t.cap && !starts[i] && i > 0 && T[i - 1].kind === 'w' && !determinerOf(T[i - 1].f) && !adjectiveForm(T[i - 1].f).some((x) => x.ending)) for (const d of ['ein', 'eine', 'einen', 'mein', 'meine', 'der', 'die', 'das', 'den']) put([...T.slice(0, i), { raw: d, f: d, kind: 'w' }, ...T.slice(i)], 'article');
  });
  const seen = new Set();
  return out.filter((x) => (seen.has(x.text) ? false : seen.add(x.text)));
}
