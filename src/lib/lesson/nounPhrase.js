// A determiner and its noun, checked wherever they stand in a typed answer (two independent scores, 2026-11-25): „Ich
// spiele gern mit mein Freund.“, „Ich lese morgens den Zeitung.“, „Ich fahre gern mit das Fahrrad.“, „Meine Onkel kommt.“
// were praised because an open gap took any noun phrase. Only certain faults: a noun whose gender is known, a form that
// no case it can stand in here has.

const DEFINITE = { der: ['der', 'den', 'dem', 'des'], die: ['die', 'der'], das: ['das', 'dem', 'des'], pl: ['die', 'den', 'der'] };
const ENDINGS = { der: ['', 'en', 'em', 'es'], die: ['e', 'er'], das: ['', 'em', 'es'], pl: ['e', 'en', 'er'] };
const NOM = { der: ['der', ''], die: ['die', 'e'], das: ['das', ''], pl: ['die', 'e'] };
const ACC = { der: ['den', 'en'], die: ['die', 'e'], das: ['das', ''], pl: ['die', 'e'] };
const DAT = { der: ['dem', 'em'], die: ['der', 'er'], das: ['dem', 'em'], pl: ['den', 'en'] };
const DATIVE_ONLY = new Set(['mit', 'bei', 'von', 'zu', 'aus', 'nach', 'seit', 'gegenüber']);
const ACCUSATIVE_ONLY = new Set(['für', 'ohne', 'gegen', 'durch', 'um']);
const TWO_WAY = new Set(['in', 'an', 'auf', 'unter', 'über', 'vor', 'hinter', 'neben', 'zwischen']);
const CONTRACTED = { zum: ['der', 'das'], zur: ['die'], im: ['der', 'das'], am: ['der', 'das'], ins: ['das'], ans: ['das'], beim: ['der', 'das'], vom: ['der', 'das'] };
const DET = /^(der|die|das|den|dem|des|(k?ein|mein|dein|sein|ihr|unser)(e|en|em|er|es)?)$/;
const COPULA = /^(?:bin|bist|ist|sind|seid|war|waren|heiße|heisse|heißt|heißen|wird|werde|werden|bleibe|bleibt)$/;
const SUBJECT = /^(?:ich|du|er|sie|es|wir|man)$/;
const DATIVE_VERB = /^(?:helf|hilf|gefall|gefäll|gehör|dank|schmeck|antwort|folg|gratulier|geb|gib|schenk|zeig|bring|kauf|wünsch|schreib|sag|erzähl)/;
const plain = (w) => String(w || '').toLocaleLowerCase('de').replace(/[^\p{L}\p{N}]+/gu, '');

/** What a determiner is: its own word, or its ending. */
const formOf = (d) => {
  const m = d.match(/^(k?ein|mein|dein|sein|ihr|unser)(e|en|em|er|es)?$/);
  return m ? { stem: m[1], ending: m[2] || '' } : { word: d };
};
const fits = (d, g, table) => {
  const f = formOf(d);
  if (f.stem === 'ein' && g === 'pl') return false;
  return f.word ? table[g][0] === f.word : table[g][1] === f.ending;
};
const fitsAny = (d, g) => {
  const f = formOf(d);
  if (f.stem === 'ein' && g === 'pl') return false;
  return f.word ? DEFINITE[g].includes(f.word) : ENDINGS[g].includes(f.ending);
};

/**
 * True when a determiner does not fit its noun. `readings(noun)` gives the noun's genders (der, die, das, pl) or null;
 * `taught(noun)` says whether the course teaches it as a countable noun (a bare one after a preposition is then a fault).
 */
export function nounPhraseFault(text, { readings, bareFault = () => false }) {
  const words = String(text || '').split(/\s+/).filter(Boolean).map((raw) => ({ raw: raw.replace(/^[„“"(]+|[.,!?;:)“”"]+$/g, ''), f: plain(raw), end: /[.,!?;:]$/.test(raw) }));
  const sentenceOf = (i) => { let a = i; while (a > 0 && !words[a - 1].end) a -= 1; let b = i; while (b < words.length - 1 && !words[b].end) b += 1; return words.slice(a, b + 1); };
  for (let i = 0; i < words.length; i += 1) {
    const { f, end } = words[i];
    if (end) continue;
    // A contraction carries its article („ins Park“, „zur Kino“).
    if (CONTRACTED[f]) {
      let j = i + 1;
      if (words[j] && !words[j].end && /^\p{Ll}/u.test(words[j].raw) && words[j + 1] && /^\p{Lu}/u.test(words[j + 1].raw)) j += 1;
      const n = words[j];
      const r = n && /^\p{Lu}/u.test(n.raw) && !/^\d/.test(n.raw) ? readings(n.raw) : null;
      if (r && !r.some((g) => CONTRACTED[f].includes(g))) return true;
      continue;
    }
    const bare = (DATIVE_ONLY.has(f) || ACCUSATIVE_ONLY.has(f) || TWO_WAY.has(f)) && words[i + 1] && /^\p{Lu}/u.test(words[i + 1].raw);
    if (bare && bareFault(f, words[i + 1].raw)) return true;
    if (!DET.test(f)) continue;
    // „sein“ the verb and „ihr“ the pronoun after a verb are no determiners; „das“ alone points.
    let j = i + 1;
    if (!words[j]) continue;
    // („Ist das der Zug …?“: a second determiner is no adjective; „ein bisschen Hunger“ is no article of „Hunger“.)
    if (/^\p{Ll}/u.test(words[j].raw) && /(?:e|en|er|es|em)$/.test(words[j].f) && !DET.test(words[j].f) && !words[j].end && words[j + 1] && /^\p{Lu}/u.test(words[j + 1].raw)) {
      if (/^(?:bisschen|wenigen|paar)$/.test(words[j].f)) continue;
      j += 1;
    }
    const noun = words[j];
    if (!noun || !/^\p{Lu}/u.test(noun.raw)) continue;
    const r = readings(noun.raw);
    if (!r) continue;
    const prep = i > 0 && !words[i - 1].end ? words[i - 1].f : '';
    const d = f;
    if (DATIVE_ONLY.has(prep)) { if (!r.some((g) => fits(d, g, DAT))) return true; continue; }
    if (ACCUSATIVE_ONLY.has(prep)) { if (!r.some((g) => fits(d, g, ACC))) return true; continue; }
    if (TWO_WAY.has(prep)) { if (!r.some((g) => fits(d, g, DAT) || fits(d, g, ACC))) return true; continue; }
    if (!r.some((g) => fitsAny(d, g))) return true;
    // Beside a pronoun subject and a verb of doing, a noun phrase with no preposition is the object: the accusative.
    const s = sentenceOf(i);
    const at = s.indexOf(words[i]);
    const subject = s.findIndex((w) => SUBJECT.test(w.f));
    if (subject < 0 || s.some((w) => COPULA.test(w.f)) || s.some((w) => DATIVE_VERB.test(w.f)) || s.some((w) => w.f === 'und' || w.f === 'oder')) continue;
    if (s.some((w) => SUBJECT.test(w.f) && w !== s[subject]) || /[?]$/.test(String(text).trim())) continue;
    // Not inside a longer phrase („der Mann von …“), and after the verb.
    if (at > subject && !r.some((g) => fits(d, g, ACC) || fits(d, g, DAT))) return true;
    if (at > subject && formOf(d).word === 'der' && !r.some((g) => fits(d, g, ACC)) && !s.slice(0, at).some((w) => DATIVE_ONLY.has(w.f) || TWO_WAY.has(w.f))) return true;
  }
  return false;
}

const DAY = /^(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)$/;
const EVERY = { der: ['jeder', 'jeden', 'jedem'], die: ['jede', 'jeder'], das: ['jedes', 'jedem'], pl: [] };
/**
 * Faults of a word in its place that an open gap let through: „an Montag“, „am Montags“, „jede Tag“, „um acht bis vier
 * Uhr“, „Ich gehe Kino.“, „Ich spiele gern Schwimmen.“, „Ich lerne das Deutsch.“
 */
export function phraseFault(text, { readings, isVerbNoun = () => false, isLanguage = () => false, countable = () => false, isPlace = () => false }) {
  const words = String(text || '').split(/\s+/).filter(Boolean).map((raw) => ({ raw: raw.replace(/^[„“"(]+|[.,!?;:)“”"]+$/g, ''), f: plain(raw), end: /[.,!?;:]$/.test(raw) }));
  const f = words.map((w) => w.f);
  for (let i = 0; i < words.length; i += 1) {
    const next = words[i + 1];
    if (next && !words[i].end) {
      if (DAY.test(next.f) && ['an', 'in', 'im', 'um', 'bei', 'zu'].includes(f[i])) return true;
      // „im Wochenende“, „im Abend“: a part of the day or the weekend takes „am“ (the night „in der“).
      if (/^(?:Wochenende|Abend|Morgen|Nachmittag|Vormittag)$/.test(next.raw) && ['im', 'in', 'um'].includes(f[i])) return true;
      if (['am', 'an'].includes(f[i]) && /s$/.test(next.f) && DAY.test(next.f.slice(0, -1))) return true;
      if (/^jed(?:er|e|es|en|em)$/.test(f[i]) && /^\p{Lu}/u.test(next.raw)) {
        const r = readings(next.raw) || (DAY.test(next.f) || next.f === 'tag' || next.f === 'monat' || next.f === 'abend' || next.f === 'morgen' ? ['der'] : next.f === 'woche' ? ['die'] : next.f === 'jahr' || next.f === 'wochenende' ? ['das'] : null);
        if (r && !r.some((g) => EVERY[g].includes(f[i]))) return true;
      }
      // „im Bremen“, „in der Berlin“: a town takes no article.
      if (['im', 'zum', 'zur'].includes(f[i]) && isPlace(next.raw)) return true;
      if (['der', 'dem', 'den'].includes(f[i]) && i > 0 && ['in', 'aus', 'nach'].includes(f[i - 1]) && isPlace(next.raw)) return true;
      if (f[i] === 'das' && isLanguage(next.raw) && f.some((w) => /^(?:lern|sprech|sprich)/.test(w))) return true;
    }
    if (/^(?:gehe|gehst|geht|gehen)$/.test(f[i])) {
      let j = i + 1;
      while (words[j] && !words[j - 1].end && ['ich', 'du', 'er', 'sie', 'wir', 'gern', 'gerne', 'auch', 'oft', 'morgens', 'abends', 'immer', 'jetzt', 'dann'].includes(words[j].f)) j += 1;
      // „Ich gehe Kino.“: where one goes has its preposition, unless a verb follows („Fußball spielen“, „Kaffee trinken“).
      if (words[j] && j > i && /^\p{Lu}/u.test(words[j].raw) && !words[j - 1].end && !DAY.test(words[j].f) && !(words[j + 1] && /^\p{Ll}\p{L}*e?n$/u.test(words[j + 1].raw)) && readings(words[j].raw)) return true;
    }
    // „Ich lese gern Buch.“: a thing one reads, buys or takes has its article.
    if (/^(?:lese|liest|lesen|kaufe|kaufst|nehme|nimmst|brauche|brauchst)$/.test(f[i])) {
      let j = i + 1;
      while (words[j] && !words[j - 1].end && ['ich', 'du', 'gern', 'gerne', 'auch', 'oft', 'immer', 'morgens', 'abends'].includes(words[j].f)) j += 1;
      if (words[j] && !words[j - 1].end && /^\p{Lu}/u.test(words[j].raw) && !(words[j + 1] && /^\p{Lu}/u.test(words[j + 1].raw)) && countable(words[j].raw)) return true;
    }
    if (/^(?:spiele|spielst|spielt|spielen)$/.test(f[i])) {
      const obj = words.slice(i + 1, i + 4).find((w) => /^\p{Lu}/u.test(w.raw));
      if (obj && isVerbNoun(obj.raw)) return true;
    }
  }
  return /\bum\s+(?:\S+\s+){1,2}(?:uhr\s+)?bis\s+(?:\d|\p{L}+(?:\s+uhr)?)/iu.test(String(text)) && !f.includes('von');
}

/** „Meine Onkel kommt.“, „Mein Tante kommt.“, „Meine Nachbarn kommt.“: a noun subject before its verb, in number. */
export function subjectNumberFault(text, { readings }) {
  const m = String(text || '').trim().match(/^(\p{L}+)\s+(\p{Lu}\p{L}*)\s+(kommt|kommen|ist|sind|spricht|sprechen|wohnt|wohnen|hat|haben)\b/u);
  if (!m) return false;
  const d = plain(m[1]);
  if (!DET.test(d)) return false;
  const r = readings(m[2]);
  if (!r) return false;
  const plural = /^(?:kommen|sind|sprechen|wohnen|haben)$/.test(m[3]);
  return !r.some((g) => (g === 'pl') === plural && fits(d, g, NOM));
}
