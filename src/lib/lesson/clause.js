// Reads a beginner's German sentence (loop round 3, 2026-11-25). The final check confirmed an answer only when it lined up with
// an answer the turn lists, so about a fifth of right answers stood unconfirmed and a third of wrong ones unnamed. This reader
// knows no answer: it takes a sentence apart — verb in its place, subject and verb together, every noun phrase in a case its verb
// or preposition asks for, participle, infinitive and prefix at the end — and hands back what it says, or null when it cannot
// read every word. `taskMeaning.js` compares that with what the turn asks.
import { clockMinutes, relativeClock } from './clockTime.js';
import { ACCUSATIVE_PREP, ADVERBS, CONTRACTED, COORDINATORS, DATIVE_PREP, DAYS, DAY_PARTS, DEGREE, MONTHS, NUMBER_WORDS, PRONOUNS, SEASONS, SUBORDINATORS, TWO_WAY_PREP, W_WORDS,
  WEAK_NOUNS, adjectiveEnding, adjectiveForm, determinerOf, fold, separableOf, verbReadings } from './germanForms.js';

const set = (s) => new Set(s.trim().split(/\s+/).map(fold));
// Nouns that stand without an article: stuff, sports, instruments, set phrases („Zeit haben“, „Fahrrad fahren“).
const BARE = set(`fußball tennis basketball volleyball handball tischtennis badminton hockey eishockey golf cricket schach karten klavier gitarre geige flöte trompete schlagzeug musik sport zeit
hunger durst lust angst spaß pause mittagspause urlaub geburtstag besuch feierabend frühstück mittag deutsch englisch fahrrad auto bus zug taxi rad ski hilfe glück arbeit unterricht training yoga
pilates fieber kopfschmerzen ruhe ordnung uhr euro prozent hause beruf kaffee tee wasser milch saft bier wein brot käse fleisch fisch obst gemüse salat reis zucker salz butter suppe kuchen eis
schokolade radio fernsehen internet wlan papier geld gold silber platz schluss bescheid radfahren mathe physik hausaufgaben wäsche essen abendessen mittagessen volleyball judo karate boxen
ballett salsa hiphop poker lego tschüss kino theater kontakt pech glück stress hitze schnee regen nachtisch freude schule jura medizin informatik kunst geschichte freizeit schicht dienst`);
const MASSES = set('kleidung gepäck schmuck werkzeug spielzeug kleingeld parfüm creme seife shampoo klebeband besteck geschirr wäsche strom gas benzin holz wolle stoff leder müsli pasta couscous hummus knoblauch petersilie ketchup senf öl essig sahne quark joghurt limo schorle sekt schnaps whisky espresso cappuccino eistee pommes ruhe liebe gesundheit glück frieden unterstützung ahnung erfahrung nachhilfe besuch post ruhe wasser milch kaffee tee saft bier wein brot käse fleisch fisch obst gemüse salat reis zucker salz butter suppe kuchen eis schokolade schinken wurst honig marmelade orangensaft mineralwasser apfelsaft cola limonade geld papier musik zeit hilfe platz internet wlan');
// People: a name may follow („mein Bruder Ali“).
const PEOPLE = /^(?:mutter|vater|mama|papa|eltern|bruder|schwester|sohn|tochter|kind|mann|frau|oma|opa|großmutter|grossmutter|großvater|grossvater|onkel|tante|cousin|cousine|neffe|nichte|enkel|enkelin|baby|freund|freundin|nachbar|nachbarin|kollege|kollegin|chef|chefin|lehrer|lehrerin|partner|partnerin|schwager|schwägerin|familie|hund|katze|herr|kommilitone|kommilitonin|mitbewohner|mitbewohnerin|verlobter|verlobte)$/u;
// What one plays: an instrument, a sport („Gitarre gespült“ is a slip of „gespielt“).
const BARE_AFTER = new Set(['nach feierabend', 'vor feierabend', 'nach mittag', 'zu mittag', 'zu besuch', 'auf deutsch', 'auf englisch', 'in urlaub', 'nach schulschluss', 'in arbeit', 'auf arbeit', 'zu hause', 'nach hause', 'bei regen', 'bei schnee', 'zu abendessen', 'vor freude', 'vor schmerzen', 'vor glück']);
export const NEEDS_ARTICLE = set('zug uhr pause mittagspause geburtstag arbeit kino theater schule bus taxi rad auto fahrrad radio kontakt besuch schicht dienst');
const PLAYED = set('fußball tennis basketball volleyball handball tischtennis badminton hockey golf schach gitarre klavier geige flöte trompete schlagzeug');
const PLAYING = new Set(['spielen', 'üben', 'lernen', 'hören', 'sehen', 'machen', 'mögen', 'lieben', 'kaufen', 'trainieren', 'schauen', 'unterrichten', 'haben', 'brauchen', 'möchten', 'sein', 'können', 'anschauen', 'fernsehen', 'mitspielen', 'wünschen', 'bekommen']);
// „ein Jahr“, „eine Stunde“, „einen Monat“: one of a measure, as long as it lasts.
const ONE_OF = { stunde: 'eine', minute: 'eine', woche: 'eine', tag: 'einen', monat: 'einen', jahr: 'ein' };
// One makes „Essen“; every other infinitive is done, not made („Ich habe Lesen gemacht“ is no German).
const MADE = set('essen');
// Behind these question words a second clause may share the subject („Wann stehst du auf und frühstückst?“).
const SHARED_WH = new Set(['wann', 'wo', 'warum', 'wie', 'wie oft', 'wie lange', 'um wie viel uhr', 'ab wann', 'bis wann']);
// One goes „ins Kino“, never „im Kino“.
const WHERE_TO = set('kino theater museum schule café restaurant supermarkt schwimmbad fitnessstudio bett stadion club disko konzert bibliothek büro zoo moschee kirche krankenhaus');
const VEHICLES = set('bus zug bahn auto taxi fahrrad rad straßenbahn s-bahn u-bahn flugzeug schiff fähre roller motorrad');
const TAKES_ACC = new Set(['auf|warten', 'auf|freuen', 'über|freuen', 'an|denken', 'über|sprechen', 'über|reden', 'auf|antworten', 'über|lachen', 'in|verlieben', 'auf|passen', 'auf|aufpassen', 'an|schreiben', 'über|ärgern', 'über|diskutieren', 'an|schicken', 'auf|fallen', 'in|einladen', 'in|treten', 'auf|zeigen', 'in|umsteigen', 'in|einsteigen', 'auf|schauen', 'auf|sehen', 'in|schauen', 'in|sehen', 'auf|gucken', 'in|passen', 'auf|stellen', 'in|wollen', 'in|möchten', 'in|müssen', 'in|können']);
const PRONOUN_SUBJECT = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'man']);
const REFLEXIVE = { ich: ['mich', 'mir'], du: ['dich', 'dir'], er: ['sich'], sie: ['sich'], wir: ['uns'], ihr: ['euch'] };
const ORDINAL = /^(?:ersten|zweiten|dritten|vierten|fünften|sechsten|siebten|siebenten|achten|neunten|zehnten|elften|zwölften|\p{L}+(?:zehnten|zigsten|ssigsten|ßigsten))$/u;
const ADV_PHRASES = [['zu', 'hause'], ['nach', 'hause'], ['zu', 'fuss'], ['am', 'liebsten'], ['am', 'besten'], ['am', 'meisten'], ['ein', 'bisschen'], ['ein', 'wenig'], ['in', 'ordnung'], ['auf', 'jeden', 'fall'], ['vor', 'allem'], ['zum', 'beispiel'], ['im', 'moment'], ['zur', 'zeit'],
  ['zum', 'glück'], ['noch', 'nicht'], ['nicht', 'mehr'], ['noch', 'mal'], ['gar', 'nicht'], ['so', 'gern'], ['so', 'gerne'], ['wie', 'immer'], ['ab', 'und', 'zu'], ['hin', 'und', 'wieder'], ['zum', 'ersten', 'mal'], ['im', 'internet'], ['am', 'telefon'], ['unter', 'der', 'woche'], ['denn', 'nun'], ['und', 'zwar'], ['am', 'apparat'], ['von', 'beruf'], ['mit', 'nachnamen'], ['mit', 'vornamen'], ['bei', 'mir'], ['bei', 'uns'], ['bei', 'dir'], ['bei', 'ihnen'], ['zu', 'besuch'], ['zu', 'mittag'], ['zu', 'abend'], ['da', 'drüben'], ['dort', 'drüben'], ['hier', 'drüben'], ['da', 'vorn'], ['da', 'oben'], ['da', 'unten'], ['da', 'hinten']];

// What stands around an answer and is none: greetings, thanks, yes and no. Phrases first, the longest one wins.
const INTERJECTIONS = `guten tag|guten morgen|guten abend|gute nacht|grüss gott|grüezi|grüß dich|schönen guten tag|einen schönen guten tag|hallo|hi|hey|moin|servus|vielen dank|herzlichen dank|besten dank|tausend dank|danke schön|danke sehr|danke der nachfrage|danke dir|danke ihnen|danke|dankeschön
auf wiedersehen|auf wiederhören|tschüss|tschüs|ciao|bis bald|bis dann|bis später|bis gleich|bis morgen|alles klar|alles gute|kein problem|keine sorge|freut mich|freut mich sehr|sehr erfreut|na klar|na gut|na ja|aber ja|oh ja|oh nein|oh|ach|ah|hm|ach so|ja klar|ja gern|ja gerne|ja|nein|nee|doch
okay|ok|klar|genau|stimmt|super|prima|toll|schön|perfekt|wunderbar|klasse|sehr gern|sehr gerne|sehr gut|gern|gerne|aber gern|aber gerne|gut|natürlich|sicher|auf jeden fall|einverstanden|abgemacht|bitte sehr|bitte schön|bitte|also|moment|moment mal|moment bitte|einen moment|einen moment bitte|warte mal
sag mal|schau mal|guck mal|hör mal|entschuldigung|entschuldigen sie|entschuldigen sie bitte|entschuldige|entschuldige bitte|verzeihung|sorry|mach es gut|machen sie es gut|pass auf dich auf|liebe grüsse|viele grüsse|mit freundlichen grüssen|freundliche grüsse|schönen tag|schönen tag noch|einen schönen tag|schön sie kennenzulernen|schön dich kennenzulernen
einen schönen tag noch|viel spass|viel glück|eine frage|ich glaube|ich denke|glaube ich|denke ich|finde ich|das ist nett|das ist lieb|sehr nett|wie schön|wie nett|herzlich willkommen|leider nein|leider nicht|tut mir leid|es tut mir leid|das tut mir leid|wow|mal sehen|bis zum nächsten mal|halt|sagen sie mal|nett sie kennenzulernen|viel spass noch|vielleicht später|vielleicht ein anderes mal|ein anderes mal|ein andermal|schönen abend|schönen abend noch|einen schönen abend noch|komm gut nach hause|kommen sie gut nach hause`.split(/[|\n]/).map((p) => p.trim().split(' ')).sort((a, b) => b.length - a.length);

const NO_COMMA = new Set('guten tag|guten morgen|guten abend|hallo|hi|hey|moin|servus|danke|vielen dank|ja|nein|bitte|entschuldigung|okay|ok|oh|ach|also|moment|entschuldigen sie|entschuldigen sie bitte|entschuldige|sag mal|ja klar|danke schön|tschüss|tschüs|na|doch'.split('|'));
const GREETS = new Set(['hallo', 'hi', 'hey', 'moin', 'servus', 'tschüss', 'tschüs', 'ciao', 'danke', 'nein', 'ja', 'bitte', 'okay', 'entschuldigung', 'verzeihung', 'sorry']);
const NUMBER = /^(?:\d+|(?:(?:ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und)?(?:zwanzig|dreissig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)|(?:ein|zwei|drei|vier|fünf)?hundert(?:\p{L}+)?)$/u;
const isNumber = (f) => NUMBER_WORDS.includes(f) || NUMBER.test(f) || f === 'eins' || f === 'zwo' || f === 'dreissig';

/** The words of a text with their marks: { raw, f, cap, kind: 'w' | 'n' | 'clock' | 'date' | 'ord' | 'phone' | 'p' }. */
export function tokenize(text) {
  const s = String(text || '').normalize('NFC').replace(/[„“”"«»()]/g, ' ').replace(/[’‘`´]/g, "'")
    .replace(/(\p{L}{2,})'s(?!\p{L})/gu, '$1 es').replace(/\s[–-]\s/g, ' , ')
    // („Schön, Sie kennenzulernen!“ is one phrase.)
    .replace(/(?<!\p{L})(schön|nett),\s+(Sie|dich)\s+kennenzulernen/giu, '$1 $2 kennenzulernen');
  const re = /\d{1,2}\.\s?\d{1,2}\.(?:\s?\d{2,4})?|\d{1,2}[.:]\d{2}(?!\d)|\d{1,2}\.(?=\s+(?:\p{Lu}|[a-zäöü]))|\+?\d[\d/]*(?:[ /-]?\d+)+|\d+|[\p{L}][\p{L}'-]*\.?(?=[^\p{L}]|$)|[.,!?;:…&]/gu;
  const out = [];
  for (const m of s.matchAll(re)) {
    let raw = m[0];
    if (/^\d{1,2}\.\s?\d{1,2}\./.test(raw)) { out.push({ raw, f: raw, kind: 'date' }); continue; }
    if (/^\d{1,2}[.:]\d{2}$/.test(raw)) { out.push({ raw, f: raw, kind: 'clock' }); continue; }
    if (/^\+?\d/.test(raw) && raw.replace(/\D/g, '').length >= 5) { out.push({ raw, f: raw, kind: 'phone' }); continue; }
    if (/^\d+\.$/.test(raw)) { out.push({ raw, f: raw, kind: 'ord' }); continue; }
    if (/^\d+$/.test(raw)) { out.push({ raw, f: raw, kind: 'n' }); continue; }
    if (/^[.,!?;:…&]$/.test(raw)) { if (raw !== '…') out.push({ raw: raw === '&' ? 'und' : raw, f: raw === '&' ? 'und' : raw, kind: raw === '&' ? 'w' : 'p' }); continue; }
    let dot = false;
    if (raw.endsWith('.')) { dot = !/^(?:Dr|St|ca|bzw|z|Nr|Str)\.$/u.test(raw); raw = raw.slice(0, -1); }
    raw = raw.replace(/['-]+$/u, '');
    if (!raw) continue;
    out.push({ raw, f: fold(raw), cap: /^\p{Lu}/u.test(raw), kind: 'w' });
    if (dot) out.push({ raw: '.', f: '.', kind: 'p' });
  }
  // „null eins sieben sechs, drei vier neun“: a number said digit by digit.
  for (let i = 0; i < out.length; i += 1) {
    let k = i;
    let digits = 0;
    while (out[k] && ((out[k].kind === 'w' && isNumber(out[k].f)) || out[k].kind === 'n' || (out[k].kind === 'p' && out[k].f === ',' && digits && out[k + 1]?.kind === 'w' && isNumber(out[k + 1].f)))) { if (out[k].kind !== 'p') digits += 1; k += 1; }
    if (digits >= 5) out.splice(i, k - i, { raw: out.slice(i, k).map((x) => x.raw).join(' '), f: 'nummer', kind: 'phone' });
  }
  return out;
}

// „schoen“, „fuer“, „moechte“ typed without umlauts: the known word where only its umlaut spelling is one.
const isWord = (w, ctx) => Boolean(PRONOUNS[w] || ADVERBS.has(w) || verbReadings(w).length || adjectiveForm(w).length || determinerOf(w) || CONTRACTED[w] || DATIVE_PREP.has(w) || ACCUSATIVE_PREP.has(w) || TWO_WAY_PREP.has(w) || COORDINATORS.has(w) || SUBORDINATORS.has(w) || W_WORDS.has(w) || isNumber(w) || MONTHS.includes(w) || DAYS.includes(w) || ctx.isPlace(w) || ctx.isName(w));
function respelled(t, ctx) {
  if (t.kind !== 'w' || !/ae|oe|ue/iu.test(t.raw) || isWord(t.f, ctx) || (t.cap && ctx.readings(t.raw))) return t;
  const raw = t.raw.replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü').replace(/^Ae/, 'Ä').replace(/^Oe/, 'Ö').replace(/^Ue/, 'Ü');
  return isWord(fold(raw), ctx) || (t.cap && ctx.readings(raw)) ? { ...t, raw, f: fold(raw) } : t;
}
const STOP = new Set(['.', '!', '?', ';', ':']);
const isStop = (t) => !t || (t.kind === 'p' && STOP.has(t.f));
const uniq = (list, key) => { const seen = new Set(); return list.filter((x) => { const k = key(x); if (seen.has(k)) return false; seen.add(k); return true; }); };

/**
 * A reader over one text. `ctx`: readings(noun) → genders or null (unknown), isName(word), isPlace(word), isLanguage(word),
 * isJob(word), knows(word) (a word the course teaches).
 */
export function reader(text, ctx) {
  const T = tokenize(text).map((t) => respelled(t, ctx));
  const first = new Set(T.map((t, i) => i).filter((i) => i === 0 || isStop(T[i - 1])));
  const f = (i) => (T[i]?.kind === 'w' ? T[i].f : null);
  const steps = { n: 0 };
  const budget = () => { steps.n += 1; return steps.n < 6000; };

  // Each place is read once: the same phrase is asked for by many ways through the sentence.
  const memo = new Map();
  const once = (name, i, make) => { const k = `${name}${i}`; if (!memo.has(k)) memo.set(k, make()); return memo.get(k); };

  // A word that is a noun here: written with a capital, or a known noun written small (a slip, `small`).
  function nounAt(i) {
    const t = T[i];
    if (!t || t.kind !== 'w' || t.f.length < 2 || (t.cap && ['sie', 'ihnen', 'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'ihres'].includes(t.f)) || (GREETS.has(t.f) && (first.has(i) || T[i - 1]?.kind === 'p' || GREETS.has(f(i - 1))))) return null;
    const small = !t.cap;
    if (small) {
      if (PRONOUNS[t.f] || ADVERBS.has(t.f) || verbReadings(t.f).length || adjectiveForm(t.f).length || determinerOf(t.f) || CONTRACTED[t.f] || DATIVE_PREP.has(t.f) || ACCUSATIVE_PREP.has(t.f) || TWO_WAY_PREP.has(t.f) || COORDINATORS.has(t.f) || SUBORDINATORS.has(t.f) || W_WORDS.has(t.f)) return null;
      const r = ctx.readings(t.raw);
      return r ? { f: t.f, readings: r, small: true } : null;
    }
    const r = ctx.readings(t.raw);
    // „meinen Kollegen“: a weak noun's accusative and dative look like its plural.
    if (r) return WEAK_NOUNS[t.f] && !r.includes('der') ? { f: t.f, readings: [...r, 'der'], weak: true } : { f: t.f, readings: r };
    if (WEAK_NOUNS[t.f]) return { f: t.f, readings: ['der', 'pl'], weak: true };
    if (/(?:eln|ern)$/u.test(t.f)) { const b = ctx.readings(t.raw.slice(0, -1)); if (b && !b.includes('die')) return { f: t.f, readings: ['pl'], dativePlural: true }; }
    if (t.f.endsWith('n')) { const b = ctx.readings(t.raw.slice(0, -1)); if (b?.includes('pl')) return { f: t.f, readings: ['pl'], dativePlural: true }; }
    if (/(?:es|s)$/u.test(t.f)) { const b = ctx.readings(t.raw.replace(/e?s$/u, '')); if (b && b.some((g) => g !== 'die' && g !== 'pl')) return { f: t.f, readings: [...b.filter((g) => g !== 'pl'), 'pl'], genitive: true }; }
    for (const cut of [t.raw.replace(/n$/u, ''), t.raw.replace(/en$/u, '')]) if (cut !== t.raw && cut.length > 2 && ctx.readings(cut)?.includes('die')) return { f: t.f, readings: ['pl'] };
    if (/s$/u.test(t.f) && ctx.readings(t.raw.slice(0, -1))?.includes('die')) return { f: t.f, readings: ['pl'] };
    if (!first.has(i) && verbReadings(t.f).some((v) => v.mood === 'inf')) return { f: t.f, readings: ['das'], infinitive: true };
    if (first.has(i) && (PRONOUNS[t.f] || ADVERBS.has(t.f) || verbReadings(t.f).length || adjectiveForm(t.f).length || determinerOf(t.f) || CONTRACTED[t.f] || DATIVE_PREP.has(t.f) || ACCUSATIVE_PREP.has(t.f) || TWO_WAY_PREP.has(t.f) || W_WORDS.has(t.f) || COORDINATORS.has(t.f) || SUBORDINATORS.has(t.f))) {
      return verbReadings(t.f).some((v) => v.mood === 'inf') && !verbReadings(t.f).some((v) => v.mood === 'imp') && !PRONOUNS[f(i + 1)] ? { f: t.f, readings: ['das'], infinitive: true } : null;
    }
    if (BARE.has(t.f)) return { f: t.f, readings: ['das'] };
    return { f: t.f, readings: null, unknown: true };
  }

  // Nouns and their determiners. Returns [{ end, combos: [{ g, c }], agr, head, … }].
  function simpleNp(i) { return once('simpleNp', i, () => simpleNpAt(i)); }
  function simpleNpAt(i) {
    const out = [];
    const t = T[i];
    if (!t) return out;
    if (t.kind === 'phone') return [{ end: i + 1, combos: [{ g: 'die', c: 'n' }, { g: 'die', c: 'a' }], agr: 'er', head: t.f, kind: 'phone' }];
    // A pronoun.
    if (t.kind === 'w' && PRONOUNS[t.f] && !(determinerOf(t.f) && t.f !== 'ihr' && T[i + 1]?.kind === 'w' && T[i + 1].cap && nounAt(i + 1)) && !(t.cap && !first.has(i) && !['sie', 'ihnen', 'ihr'].includes(t.f))) {
      const [cases, agr] = PRONOUNS[t.f];
      const formal = t.cap && !first.has(i) && ['sie', 'ihnen'].includes(t.f);
      if (t.f === 'sie') {
        if (!t.cap || first.has(i)) out.push({ end: i + 1, combos: cases.map((c) => ({ c })), agr: 'er|sie', head: 'sie', kind: 'pron', formal: first.has(i) ? 'maybe' : false });
        if (t.cap) out.push({ end: i + 1, combos: cases.map((c) => ({ c })), agr: 'sie', head: 'sie', kind: 'pron', formal: true });
      } else if (!(t.f === 'ihr' && t.cap && !first.has(i))) { // („Ihr“ inside a sentence is a determiner.)
        out.push({ end: i + 1, combos: cases.map((c) => ({ c })), agr, head: t.f, kind: 'pron', formal });
      }
    }
    if (t.kind !== 'w' && t.kind !== 'n') return out;
    if (['der', 'den', 'dem'].includes(t.f)) for (const d of date(i + 1)) out.push({ end: d.end, combos: [{ g: 'der', c: { der: 'n', den: 'a', dem: 'd' }[t.f] }], agr: 'er', head: d.month || 'datum', kind: 'date', month: d.month, year: d.year, said: d.said });
    // Amounts: „etwas zu essen“, „ein paar Freunde“, „ein bisschen Obst“, „viel Obst“, „etwas Kaltes“.
    const pushBare = (k, extra = {}) => bareNoun(k, extra).forEach((n) => out.push(n));
    const someLanguage = (k) => { if (T[k]?.kind === 'w' && T[k].cap && ctx.isLanguage(T[k].raw)) out.push({ end: k + 1, combos: ['n', 'a'].map((c) => ({ c })), agr: 'er', head: T[k].f, kind: 'language', bare: true, bareOk: true, stuff: true }); };
    if (t.f === 'ein' && f(i + 1) === 'paar') {
      const n = nounAt(i + 2);
      if (n && (!n.readings || n.readings.includes('pl'))) out.push({ end: i + 3, combos: [{ g: 'pl', c: 'n' }, { g: 'pl', c: 'a' }, { g: 'pl', c: 'd' }], agr: 'sie', head: n.f, kind: 'np', det: 'paar', unknown: n.unknown ? [T[i + 2].raw] : [], small: n.small });
    }
    if (t.f === 'ein' && (f(i + 1) === 'bisschen' || f(i + 1) === 'wenig')) { pushBare(i + 2, { mass: true }); someLanguage(i + 2); }
    if (['etwas', 'wenig'].includes(t.f)) someLanguage(i + 1);
    // „alle meine Freunde“
    if (t.f === 'alle' && ['poss', 'def', 'dies'].includes(determinerOf(f(i + 1) || '')?.kind)) for (const n of simpleNp(i + 1)) if (n.det && n.combos.some((c) => c.g === 'pl')) out.push({ ...n, combos: n.combos.filter((c) => c.g === 'pl'), agr: 'sie' });
    if (['etwas', 'viel', 'wenig', 'mehr', 'genug'].includes(t.f)) {
      pushBare(i + 1, { mass: true, amount: true });
      const x = T[i + 1];
      if (['etwas', 'nichts', 'viel'].includes(t.f) && x?.cap && /es$/u.test(x.f) && adjectiveForm(x.f).some((a) => a.ending === 'es')) out.push({ end: i + 2, combos: [{ g: 'das', c: 'n' }, { g: 'das', c: 'a' }], agr: 'er', head: x.f, kind: 'np' });
    }
    if (t.f === 'nichts' && T[i + 1]?.cap && /es$/u.test(T[i + 1].f) && adjectiveForm(T[i + 1].f).some((a) => a.ending === 'es')) out.push({ end: i + 2, combos: [{ g: 'das', c: 'n' }, { g: 'das', c: 'a' }], agr: 'er', head: T[i + 1].f, kind: 'np', neg: true });
    // „Was für ein …“ and the like are w-phrases. A number and its noun.
    if (t.kind === 'n' || (isNumber(t.f) && t.f !== 'ein' && t.f !== 'eins')) {
      const k = i + 1;
      for (const [adjEnd, adjs] of adjectivesFrom(k)) {
        const n = nounAt(adjEnd);
        if (!n) continue;
        const one = t.f === '1';
        const money = ['euro', 'cent', 'prozent', 'uhr', 'kilo', 'gramm', 'liter', 'meter', 'stück', 'glas'].includes(n.f);
        if (n.readings && !n.readings.includes('pl') && !money && !one) continue;
        if (!adjs.every((a) => ['e', 'en', '*'].includes(a.ending))) continue;
        const measured = ['glas', 'stück', 'kilo', 'liter', 'gramm', 'tasse', 'tassen', 'flasche', 'flaschen', 'gläser', 'stücke', 'packung', 'packungen'].includes(n.f) ? bareNoun(adjEnd + 1, { mass: true }) : [];
        const base = { combos: [{ g: 'pl', c: 'n' }, { g: 'pl', c: 'a' }, { g: 'pl', c: 'd' }], agr: one ? 'er' : 'sie', head: n.f, kind: 'np', det: 'num', money, amount: t.f, unknown: n.unknown ? [T[adjEnd].raw] : [], small: n.small };
        out.push({ end: adjEnd + 1, ...base });
        for (const m of measured) out.push({ ...base, end: m.end, head: m.head, measure: n.f });
      }
      out.push({ end: i + 1, combos: [{ g: 'pl', c: 'n' }, { g: 'pl', c: 'a' }, { g: 'pl', c: 'd' }], agr: 'er|sie', head: t.f, kind: 'num' });
    }
    // A determiner, adjectives and the noun.
    const det = t.kind === 'w' ? determinerOf(t.f) : null;
    if (det) {
      for (const [adjEnd, adjs] of adjectivesFrom(i + 1)) {
        const n = nounAt(adjEnd);
        if (!n) continue;
        if (n.unknown && ctx.isPlace(T[adjEnd].raw) && !adjs.length && !ctx.placeArticle(T[adjEnd].raw)) continue;
        // („Ich lerne das Deutsch.“: a language has no article.)
        if (det.kind === 'def' && !adjs.length && ctx.isLanguage(T[adjEnd].raw)) continue;
        const ds = det.readings.filter((r) => !n.readings || n.readings.includes(r.g) || (n.weak && r.g === 'der'));
        const combos = ds.filter((r) => {
          if (n.genitive && r.c !== 'g' && !ctx.readings(T[adjEnd].raw)) return r.g === 'pl';
          if (n.dativePlural && r.c !== 'd') return false;
          if (r.g === 'pl' && r.c === 'd' && n.readings && !/[ns]$/u.test(n.f) && !ctx.isPlace(T[adjEnd].raw)) return false;
          if (n.weak && r.g === 'der' && r.c === 'n' && n.f !== 'namen') return false;
          return adjs.every((a) => a.ending === '*' || a.ending === adjectiveEnding(det, r.g, r.c));
        });
        if (!combos.length) continue;
        const g = new Set(combos.map((c) => c.g));
        const base = { combos, agr: g.size === 1 && g.has('pl') ? 'sie' : g.has('pl') ? 'er|sie' : 'er', head: n.f, kind: 'np', det: det.stem, formalDet: det.stem === 'ihr' && t.cap && !first.has(i), detKind: det.kind, adjs: adjs.map((a) => a.stem), unknown: n.unknown ? [T[adjEnd].raw] : [], small: n.small, neg: det.kind === 'kein' };
        out.push({ ...base, end: adjEnd + 1 });
        if (/(?:straße|strasse|weg|platz|allee|gasse)$/u.test(n.f) && T[adjEnd + 1]?.kind === 'n') out.push({ ...base, end: adjEnd + 2 });
        if (/nummer$/u.test(n.f) && T[adjEnd + 1]?.kind === 'phone') out.push({ ...base, end: adjEnd + 2, number: T[adjEnd + 1].f });
        if (n.f === 'farbe' && T[adjEnd + 1]?.kind === 'w' && adjectiveForm(T[adjEnd + 1].f).some((a) => a.ending === '')) out.push({ ...base, end: adjEnd + 2, colour: T[adjEnd + 1].f });
        // „eine Tasse Tee“, „ein Glas kaltes Wasser“.
        if (/^(?:tasse|glas|stück|flasche|portion|kilo|liter|packung|dose|teller|schüssel|becher|paar|karton|kännchen|kanne|scheibe)$/u.test(n.f)) for (const m of bareNoun(adjEnd + 1, { mass: true })) out.push({ ...base, end: m.end, head: m.head, measure: n.f, unknown: [...base.unknown, ...(m.unknown || [])] });
        // „mein Bruder Ali“, „Frau Kaya“ with a determiner is rare. A name after a person.
        if (PEOPLE.test(n.f)) {
          let k = adjEnd + 1;
          let names = 0;
          if (/^(?:frau|herr|herrn)$/u.test(f(k) || '') && T[k + 1]?.cap) out.push({ ...base, end: k + 2, named: true });
          while (T[k]?.kind === 'w' && T[k].cap && names < 2 && !ctx.readings(T[k].raw) && !first.has(k)) { k += 1; names += 1; out.push({ ...base, end: k, named: true }); }
        }
      }
    }
    if (!(det && t.f !== 'ihr')) pushBare(i);
    return out;
  }

  /** Adjectives from k on, every way to stop: [[end, adjectives]]. */
  function adjectivesFrom(k) {
    const out = [[k, []]];
    let adjs = [];
    for (let j = k; j < T.length && adjs.length < 3; j += 1) {
      const t = T[j];
      if (t.kind === 'p' && t.f === ',' && adjs.length && T[j + 1]?.kind === 'w' && adjectiveForm(T[j + 1].f).some((a) => a.ending)) continue;
      if (t.kind !== 'w') break;
      if (!adjs.length && j > 0 && isNumber(t.f) && t.f !== 'ein' && determinerOf(f(j - 1) || '')) { adjs = [{ stem: t.f, ending: '*' }]; out.push([j + 1, adjs]); continue; }
      if (!adjs.length && DEGREE.has(t.f) && adjectiveForm(T[j + 1]?.f || '').some((a) => a.ending)) continue;
      const forms = adjectiveForm(t.f).filter((a) => a.ending);
      const part = !forms.length && !t.cap ? verbReadings(t.f.replace(/(?:er|en|em|es|e)$/u, '')).some((v) => v.mood === 'part') : false;
      if (!forms.length && !part) break;
      const a = forms.length ? forms : [{ stem: t.f.replace(/(?:er|en|em|es|e)$/u, ''), ending: (t.f.match(/(?:er|en|em|es|e)$/u) || [''])[0] }];
      adjs = [...adjs, a[a.length - 1]];
      out.push([j + 1, adjs]);
    }
    return out;
  }

  /** A noun without a determiner: stuff, a plural, a name, a place, a set phrase; with its adjectives. */
  function bareNoun(i, { mass = false } = {}) {
    const out = [];
    for (const [k, adjs] of adjectivesFrom(i)) {
      const n = nounAt(k);
      if (!n) continue;
      const raw = T[k].raw;
      const name = ctx.isName(raw);
      const place = ctx.isPlace(raw);
      if (place && ctx.placeArticle(raw) === 'always') continue;
      if (!adjs.length && !mass && (name || place || ctx.isLanguage(raw))) {
        let end = k + 1;
        if (place && T[end]?.kind === 'w' && T[end].f === 'am' && T[end + 1]?.cap) end += 2; // Frankfurt am Main
        out.push({ end, combos: ['n', 'a', 'd'].map((c) => ({ c })), agr: 'er', head: n.f, kind: place ? 'place' : name ? 'name' : 'language', bare: true });
        if (name && T[end]?.cap && T[end].kind === 'w' && !ctx.readings(T[end].raw) && !first.has(end)) out.push({ end: end + 1, combos: ['n', 'a', 'd'].map((c) => ({ c })), agr: 'er', head: n.f, kind: 'name', bare: true });
        if (place || ctx.isLanguage(raw)) continue;
      }
      if (/^(?:herr|frau|herrn|familie)$/u.test(n.f) && !adjs.length && T[k + 1]?.cap && T[k + 1].kind === 'w') { out.push({ end: k + 2, combos: ['n', 'a', 'd'].map((c) => ({ c })), agr: 'er', head: n.f, kind: 'name', bare: true, title: true, calls: T[k + 1].f }); continue; }
      if (n.unknown) {
        if (!adjs.length) out.push({ end: k + 1, combos: ['n', 'a', 'd'].map((c) => ({ c })), agr: /(?:en|er|e|s)$/u.test(n.f) ? 'er|sie' : 'er', head: n.f, kind: 'own', bare: true, unknown: [raw] });
        else out.push({ end: k + 1, combos: adjSlots(adjs, null), agr: 'er|sie', head: n.f, kind: 'np', bare: true, bareOk: true, unknown: [raw], adjs: adjs.map((a) => a.stem) });
        if (!adjs.length && T[k + 1]?.cap && T[k + 1].kind === 'w' && !ctx.readings(T[k + 1].raw) && !first.has(k + 1)) out.push({ end: k + 2, combos: ['n', 'a', 'd'].map((c) => ({ c })), agr: 'er', head: n.f, kind: 'own', bare: true, unknown: [raw, T[k + 1].raw] });
        continue;
      }
      const plural = n.readings.includes('pl');
      const stuff = BARE.has(n.f) || MASSES.has(n.f) || ctx.isMass(raw) || n.infinitive;
      const job = ctx.isJob(raw);
      const combos = adjSlots(adjs, n.readings).filter((c) => c.c !== 'd' || c.g !== 'pl' || /[ns]$/u.test(n.f));
      if (!combos.length) continue;
      const g = new Set(combos.map((c) => c.g));
      out.push({ end: k + 1, combos, agr: g.size === 1 && g.has('pl') ? 'sie' : plural ? 'er|sie' : 'er', head: n.f, kind: 'np', bare: true, bareOk: (plural && (n.readings.every((x) => x === 'pl') || (g.size === 1 && g.has('pl')))) || stuff || (mass && !adjs.length), stuff, job, adjs: adjs.map((a) => a.stem), small: n.small, infinitive: n.infinitive });
    }
    return out;
  }
  function adjSlots(adjs, readings) {
    const gs = readings || ['der', 'die', 'das', 'pl'];
    const out = [];
    for (const g of gs) for (const c of ['n', 'a', 'd']) if (adjs.every((a) => a.ending === '*' || a.ending === adjectiveEnding(null, g, c))) out.push({ g, c });
    return out;
  }

  /** A noun phrase with „und“, commas and the prepositional phrases that belong to it. */
  function np(i, { group = false } = {}) { return once(group ? 'npg' : 'np', i, () => npAt(i, group)); }
  function npAt(i, group) {
    if (!budget()) return [];
    const out = [];
    if (f(i) === 'sowohl') {
      for (const a of simpleNp(i + 1)) if (f(a.end) === 'als' && f(a.end + 1) === 'auch') for (const b of simpleNp(a.end + 2)) {
        const cases = ['n', 'a', 'd'].filter((c) => [a, b].every((x) => x.combos.some((y) => y.c === c)));
        if (cases.length) out.push({ end: b.end, combos: cases.map((c) => ({ g: 'pl', c })), agr: 'sie', head: a.head, heads: [a.head, b.head], kind: a.kind === 'language' && b.kind === 'language' ? 'language' : 'np', items: [a, b], list: true, unknown: [...(a.unknown || []), ...(b.unknown || [])], bare: a.bare && b.bare, bareOk: true, stuff: true });
      }
      return out;
    }
    const heads = simpleNp(i);
    for (const a of heads) {
      out.push(a);
      const list = [a];
      let frontier = [{ items: list, end: a.end }];
      for (let round = 0; round < 3 && frontier.length; round += 1) {
        const next = [];
        for (const st of frontier) {
          const j = st.end;
          const comma = T[j]?.kind === 'p' && T[j].f === ',';
          const conj = f(j) === 'und' || f(j) === 'oder' || f(j) === 'sowie';
          if (!comma && !conj) continue;
          let k = j + 1;
          if (['auch', 'dann', 'natürlich', 'vielleicht', 'noch', 'ausserdem', 'sogar', 'dazu', 'danach'].includes(f(k)) && (conj || f(k) === 'noch')) k += 1;
          for (const b of simpleNp(k)) {
            if (b.kind === 'pron' && !['ich', 'du', 'er', 'sie', 'wir'].includes(b.head)) continue;
            const items = [...st.items, b];
            const cases = ['n', 'a', 'd', 'g'].filter((c) => items.every((x) => x.combos.some((y) => y.c === c)));
            if (!cases.length) continue;
            const heads2 = items.map((x) => x.head);
            const agr = f(j) === 'oder' ? b.agr : heads2.includes('ich') || heads2.includes('wir') ? 'wir' : 'sie';
            const joined = { or: f(j) === 'oder', end: b.end, combos: cases.map((c) => ({ g: 'pl', c })), agr, head: a.head, heads: heads2, kind: items.every((x) => x.kind === 'pron') ? 'pron' : items.every((x) => x.kind === 'language') ? 'language' : 'np', items, list: true, unknown: items.flatMap((x) => x.unknown || []), bare: items.every((x) => x.bare), bareOk: items.every((x) => !x.bare || x.bareOk || x.kind === 'name' || x.kind === 'place' || x.kind === 'own' || x.kind === 'language'), small: items.some((x) => x.small), neg: items.some((x) => x.neg), stuff: items.every((x) => x.stuff || !x.bare), job: items.every((x) => x.job) };
            next.push({ items, end: b.end, open: comma });
            if (conj) out.push(joined);
          }
        }
        frontier = next.slice(0, 12);
      }
    }
    // „die Farbe meines Hefts“: a noun phrase in the genitive belongs to the noun before it.
    for (const x of [...out]) if (x.kind === 'np' && !x.list && determinerOf(f(x.end) || '')) for (const y of simpleNp(x.end)) if (y.det && y.combos.some((c) => c.c === 'g')) out.push({ ...x, end: y.end, of: y.head });
    // „das hier“, „der da“.
    for (const x of [...out]) if ((f(x.end) === 'hier' || f(x.end) === 'da') && ((x.kind === 'pron' && ['das', 'der', 'die', 'den', 'dies'].includes(x.head)) || x.kind === 'np')) out.push({ ...x, end: x.end + 1, deictic: true });
    if (group) {
      for (const x of [...out]) if (x.kind !== 'pron' || ['alle', 'viele', 'beide', 'jemand', 'niemand'].includes(x.head)) for (const p of pp(x.end)) { out.push({ ...x, end: p.end, attr: [{ ...p, attr: true }] }); for (const q of pp(p.end)) out.push({ ...x, end: q.end, attr: [{ ...p, attr: true }, { ...q, attr: true }] }); }
    }
    return uniq(out, (x) => `${x.end}|${x.kind}|${x.agr}|${x.combos.map((c) => (c.g || '') + c.c).join()}|${x.formal || ''}`);
  }

  /** A prepositional phrase; its noun phrase is in a case the preposition asks for. */
  function pp(i) { return once('pp', i, () => ppAt(i)); }
  function ppAt(i) {
    const w = f(i);
    if (!w || !budget()) return [];
    const out = [];
    const con = CONTRACTED[w];
    if (con && !(w === 'am' && ['liebsten', 'besten', 'meisten'].includes(f(i + 1)))) {
      const [prep, c, genders] = con;
      for (const [k, adjs] of adjectivesFrom(i + 1)) {
        const n = nounAt(k);
        if (!n) continue;
        if (n.f === 'beruf' && ['vom', 'im', 'am'].includes(w) && !adjs.length) continue;
        if (dayName(n.f) && w === 'im') continue;
        if ((MONTHS.includes(n.f) || SEASONS.includes(n.f)) && w === 'am') continue;
        if (ctx.isPlace(T[k].raw) && !adjs.length && !ctx.placeArticle(T[k].raw)) continue;
        if (w === 'am' && n.f === 'nacht') continue;
        if (n.readings && !n.readings.some((g) => genders.includes(g))) continue;
        if (n.readings && !n.readings.some((g) => genders.includes(g) && g !== 'pl')) continue;
        if (!adjs.every((a) => a.ending === 'en' || (c === 'a' && a.ending === 'e') || a.ending === '*')) continue;
        out.push({ kind: 'pp', prep, word: w, c, end: k + 1, np: { head: n.f, kind: n.unknown ? 'own' : 'np', combos: [{ c }] }, unknown: n.unknown ? [T[k].raw] : [], small: n.small });
        if (n.readings && /^(?:haus|fuss)$/u.test(n.f)) continue;
        // „beim Doktor Kaya“, „zum Friseur Ali“ are rare; two words of a place („im Café Central“).
        if (T[k + 1]?.cap && T[k + 1].kind === 'w' && !ctx.readings(T[k + 1].raw) && !first.has(k + 1)) out.push({ kind: 'pp', prep, word: w, c, end: k + 2, np: { head: n.f, kind: 'np', combos: [{ c }] }, unknown: [] });
      }
    }
    const two = TWO_WAY_PREP.has(w);
    if (DATIVE_PREP.has(w) || ACCUSATIVE_PREP.has(w) || two) {
      const cases = two ? ['a', 'd'] : DATIVE_PREP.has(w) ? ['d'] : ['a'];
      const k = w === 'bis' && ['nach', 'zu', 'in', 'zum', 'zur'].includes(f(i + 1)) ? -1 : i + 1;
      if (k < 0) return pp(i + 1).map((p) => ({ ...p, until: true }));
      for (const n of np(k)) {
        const c = cases.filter((x) => n.combos.some((y) => y.c === x));
        if (!c.length) continue;
        if (n.kind === 'pron' && ['ich', 'du', 'er', 'sie'].includes(n.head) && !n.combos.some((x) => cases.includes(x.c))) continue;
        if (n.kind === 'pron' && n.head === 'man') continue;
        // A count noun without its article („zu Kino“); a place, a name, a plural, stuff and a set phrase may stand bare.
        if (n.bare && !(n.bareOk || ['name', 'place', 'own', 'language'].includes(n.kind) || ['ohne', 'von', 'mit', 'für', 'als'].includes(w) && (n.stuff || n.job || ((w === 'mit' || w === 'ohne') && ctx.isFood?.(n.head))))) continue;
        if (n.bare && n.kind === 'np' && BARE.has(n.head) && !MASSES.has(n.head) && !n.list && ['in', 'zu', 'an', 'auf', 'bei', 'vor', 'nach', 'um', 'durch', 'gegen'].includes(w) && !n.adjs?.length && !BARE_AFTER.has(`${w} ${n.head}`)) continue;
        if (n.kind === 'language' && w === 'aus') continue;
        if (n.kind === 'place' && !['in', 'aus', 'nach', 'bei', 'von', 'bis', 'über', 'durch', 'für', 'um', 'vor', 'hinter', 'ab', 'gegen'].includes(w)) continue;
        if (n.kind === 'phone' && w !== 'unter') continue;
        if ((n.head === 'uhr' && (n.bare || n.det === 'num')) || (n.kind === 'num' && !['mit', 'für', 'ab', 'über', 'unter', 'bis', 'seit'].includes(w)) || (n.head === 'beruf' && n.bare && w !== 'von')) continue;
        out.push({ kind: 'pp', prep: w, c: c.join(''), end: n.end, np: n, unknown: n.unknown || [], small: n.small });
      }
      if (['von', 'für', 'auf', 'seit', 'bis'].includes(w) && (dayName(f(i + 1)) || ['gestern', 'heute', 'morgen'].includes(f(i + 1)))) out.push({ kind: 'pp', prep: w, c: w === 'von' || w === 'seit' ? 'd' : 'a', end: i + 2, np: { head: f(i + 1), kind: 'date', combos: [] }, unknown: [], day: dayName(f(i + 1))?.day });
      if (w === 'nach' && f(i + 1) === 'hause') out.push({ kind: 'pp', prep: w, c: 'd', end: i + 2, np: { head: 'hause', kind: 'np', combos: [] }, unknown: [], home: true });
      if (w === 'zu' && f(i + 1) === 'hause') out.push({ kind: 'pp', prep: w, c: 'd', end: i + 2, np: { head: 'hause', kind: 'np', combos: [] }, unknown: [], home: true });
      for (const x of ['hier', 'dort', 'da']) if (['von', 'nach', 'in', 'bis'].includes(w) && f(i + 1) === x) out.push({ kind: 'pp', prep: w, c: '', end: i + 2, np: { head: x, kind: 'adv', combos: [] }, unknown: [] });
    }
    if (w === 'als' || (w === 'wie' && i > 0 && !first.has(i))) for (const n of np(i + 1)) if (n.combos.some((c) => c.c === 'n') && (w === 'als' || n.head !== 'es')) out.push({ kind: 'pp', prep: w, c: 'n', end: n.end, np: n, unknown: n.unknown || [] });
    return uniq(out, (p) => `${p.end}|${p.prep}|${p.c}|${p.np.kind}|${p.np.head}`);
  }

  // ——— Time ———
  /** A clock time from i: [{ end, minutes }]. */
  function clock(i, { bare = false } = {}) {
    const out = [];
    const t = T[i];
    if (!t) return out;
    const num = (k) => (T[k]?.kind === 'n' ? Number(T[k].f) : T[k]?.kind === 'w' && isNumber(T[k].f) ? numberValue(T[k].f) : null);
    if (t.kind === 'clock') { const [h, m] = t.f.split(/[.:]/).map(Number); if (clockMinutes(h, m) !== null) { out.push({ end: i + 1, h, m, exact: true }); if (f(i + 1) === 'uhr') out.push({ end: i + 2, h, m, exact: true }); } return out; }
    if (t.f === 'halb') { const h = num(i + 1); if (h && h <= 12) out.push({ end: i + 2, h: h - 1 || 12, m: 30, spoken: true }); return out; }
    if (t.f === 'mittag' || t.f === 'mitternacht') return [{ end: i + 1, h: t.f === 'mittag' ? 12 : 0, m: 0 }];
    const quarter = t.f === 'viertel' ? 15 : null;
    const n = num(i);
    // „Viertel acht“, „drei viertel zehn“: said so in the east and south.
    if (quarter !== null || t.f === 'dreiviertel' || (t.f === 'drei' && f(i + 1) === 'viertel')) {
      const k = t.f === 'drei' ? i + 2 : i + 1;
      const h = num(k);
      if (h && h <= 12 && f(k + 1) !== 'uhr') out.push({ end: k + 1, h: h - 1 || 12, m: quarter !== null ? 15 : 45, spoken: true });
    }
    if (quarter !== null || (n !== null && n < 60)) {
      let k = i + 1;
      if (quarter === null && ['minuten', 'min', 'minute'].includes(f(k))) k += 1;
      if (['vor', 'nach'].includes(f(k))) {
        const half = f(k + 1) === 'halb';
        const h = num(k + (half ? 2 : 1));
        const mins = quarter ?? n;
        const total = relativeClock(mins, f(k), h, half, quarter === null && k > i + 1);
        if (total !== null) out.push({ end: k + (half ? 3 : 2), h: Math.floor(total / 60), m: total % 60, spoken: true });
      }
    }
    if (n !== null && n <= 24) {
      if (f(i + 1) === 'uhr') { const m = num(i + 2); out.push({ end: i + 2, h: n, m: 0, exact: true }); if (m !== null && m < 60) out.push({ end: i + 3, h: n, m, exact: true }); } else if (bare) out.push({ end: i + 1, h: n, m: 0 });
    }
    return out;
  }
  function numberValue(w) {
    const i = NUMBER_WORDS.indexOf(w);
    if (i >= 0) return i;
    if (w === 'eins') return 1;
    if (w === 'zwo') return 2;
    const tens = { zwanzig: 20, dreissig: 30, vierzig: 40, fünfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };
    if (tens[w]) return tens[w];
    const m = w.match(/^(\p{L}+?)und(\p{L}+)$/u);
    if (m && tens[m[2]] && NUMBER_WORDS.indexOf(m[1]) > 0) return NUMBER_WORDS.indexOf(m[1]) + tens[m[2]];
    return /^\d+$/.test(w) ? Number(w) : null;
  }
  /** A date from i („3. März“, „dritten März“, „3.3.“, „12.4.1990“, „siebten September 2003“). */
  function date(i) { return dateFrom(i).map((d) => ({ ...d, said: T.slice(i, d.end).map((x, k) => (k === 0 && x.kind === 'w' ? `${ordinalValue(x.f)}.` : x.raw)).join(' ') })); }
  function ordinalValue(w) {
    const irregular = { ersten: 1, dritten: 3, siebten: 7, siebenten: 7, achten: 8 };
    if (irregular[w]) return irregular[w];
    return numberValue(w.replace(/(?:st|t)en$/u, '').replace(/ss$/u, 'ss')) ?? 0;
  }
  function dateFrom(i) {
    const t = T[i];
    if (!t) return [];
    if (t.kind === 'date') return [{ end: i + 1, date: true, numeric: true, year: /\d{4}$/u.test(t.f) }];
    const day = t.kind === 'ord' || (t.kind === 'w' && ORDINAL.test(t.f)) || (t.kind === 'n' && T[i + 1]?.f === '.' );
    if (!day) return [];
    let k = t.kind === 'n' ? i + 2 : i + 1;
    const out = [{ end: k, date: true, dayOnly: true }];
    if (T[k]?.kind === 'w' && MONTHS.includes(T[k].f)) {
      k += 1;
      out.push({ end: k, date: true, month: T[k - 1].f, monthSmall: !T[k - 1].cap });
      if (T[k]?.kind === 'n' && /^(?:19|20)\d\d$/.test(T[k].f)) out.push({ end: k + 1, date: true, month: T[k - 1].f, year: true });
      if (T[k]?.kind === 'phone') return out;
    }
    return out;
  }
  const dayName = (w) => { const m = String(w || '').match(/^(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonnabend|sonntag)(morgen|vormittag|mittag|nachmittag|abend|nacht)?$/u); return m ? { day: m[1] === 'sonnabend' ? 'samstag' : m[1], part: m[2] || null } : null; };
  /** One time phrase from i: [{ kind: 'time', end, day, part, h, m, month, date, bad }]. */
  function time(i) {
    const out = [];
    const w = f(i);
    const push = (x) => out.push({ kind: 'time', ...x });
    const small = (k) => Boolean(T[k]) && T[k].kind === 'w' && !T[k].cap;
    if (['um', 'gegen', 'ab', 'bis', 'seit', 'vor', 'nach', 'so', 'kurz'].includes(w)) {
      const k = w === 'so' && ['um', 'gegen'].includes(f(i + 1)) ? i + 2 : w === 'kurz' && ['vor', 'nach'].includes(f(i + 1)) ? i + 2 : i + 1;
      if (!(w === 'so' && k === i + 1) && !(w === 'kurz' && k === i + 1)) {
        for (const p of ['genau', 'etwa', 'ungefähr', 'circa', 'ca', 'punkt', 'spätestens', 'frühestens']) if (f(k) === p && T[k + 1]) for (const c of clock(k + 1, { bare: true })) push({ end: c.end, h: c.h, m: c.m, prep: w, clock: true });
        for (const c of clock(k, { bare: true })) push({ end: c.end, h: c.h, m: c.m, prep: w, clock: true });
        // „um kurz nach sechs“
        if (w === 'um' && f(k) === 'kurz' && ['vor', 'nach'].includes(f(k + 1))) for (const c of clock(k + 2, { bare: true })) push({ end: c.end, h: c.h, m: c.m, prep: w, clock: true });
        if (w === 'bis' && ['nächste', 'kommende'].includes(f(i + 1)) && f(i + 2) === 'woche') push({ end: i + 3, prep: w, part: 'woche' });
        if (w === 'bis' && ['nächsten', 'kommenden', 'zum'].includes(f(i + 1)) && dayName(f(i + 2))) push({ end: i + 3, prep: w, ...dayName(f(i + 2)) });
      }
      if ((w === 'ab' || w === 'bis' || w === 'seit')) { const d = dayName(f(i + 1)); if (d) push({ end: i + 2, ...d, prep: w, small: small(i + 1) }); if (MONTHS.includes(f(i + 1))) push({ end: i + 2, month: f(i + 1), prep: w }); if (['morgen', 'heute', 'bald', 'später', 'dann', 'gleich', 'abends', 'jetzt', 'gestern'].includes(f(i + 1))) push({ end: i + 2, prep: w }); if (T[i + 1]?.kind === 'n' && /^(?:19|20)\d\d$/.test(T[i + 1].f)) push({ end: i + 2, prep: w, year: true }); }
      if (w === 'bis' && f(i + 1) === 'um') for (const c of clock(i + 2, { bare: true })) push({ end: c.end, h: c.h, m: c.m, prep: w, clock: true });
    }
    if (w === 'von') for (const a of clock(i + 1, { bare: true })) if (f(a.end) === 'bis') for (const b of clock(a.end + 1, { bare: true })) push({ end: b.end, h: a.h, m: a.m, range: true, clock: true });
    if (w === 'von' && dayName(f(i + 1)) && f(i + 2) === 'bis' && dayName(f(i + 3))) push({ end: i + 4, day: dayName(f(i + 1)).day, range: true });
    if (w === 'zwischen') for (const a of clock(i + 1, { bare: true })) if (f(a.end) === 'und') for (const b of clock(a.end + 1, { bare: true })) push({ end: b.end, h: a.h, m: a.m, range: true, clock: true });
    if (w === 'am' || w === 'an' || w === 'diesen' || w === 'jeden' || w === 'nächsten' || w === 'letzten' || w === 'kommenden' || w === 'den' || w === 'vom') {
      const k = f(i + 1) === 'nächsten' || f(i + 1) === 'letzten' || f(i + 1) === 'kommenden' || f(i + 1) === 'frühen' || f(i + 1) === 'späten' || f(i + 1) === 'ganzen' || f(i + 1) === 'diesem' ? i + 2 : i + 1;
      if (w === 'an' && f(i + 1) !== 'diesem' && !DAYS.some((d) => f(i + 1) === `${d}en`) && !['wochentagen', 'arbeitstagen', 'feiertagen', 'sonntagen', 'wochenenden', 'jedem', 'manchen'].includes(f(i + 1))) { /* „an“ with a date is no time */ } else {
        const d = dayName(f(k));
        const adj = w === 'den' && k === i + 1;
        if (d && !adj) push({ end: k + 1, ...d, prep: w, small: small(k) });
        if (!adj && (DAY_PARTS.includes(f(k)) && f(k) !== 'nacht' || ['wochenende', 'tag', 'anfang', 'ende', 'geburtstag', 'feiertag', 'werktag'].includes(f(k)))) push({ end: k + 1, part: f(k), prep: w, small: small(k) });
        if (w === 'den' && f(i + 1) === 'ganzen' && ['tag', 'morgen', 'abend', 'vormittag', 'nachmittag'].includes(f(i + 2))) push({ end: i + 3, part: f(i + 2), span: true });
        if (w === 'am') for (const x of date(i + 1)) push({ end: x.end, ...x, kind: 'time', prep: 'am' });
        if (w === 'an' && T[k]) if (/^(?:wochentagen|arbeitstagen|feiertagen|sonntagen|wochenenden)$/u.test(f(i + 1) || '')) push({ end: i + 2, prep: 'an' });
        if (d && T[k + 1]?.f === ',' && f(k + 2) === 'den') for (const x of date(k + 3)) push({ end: x.end, ...d, ...x, kind: 'time', prep: w });
        if (['monat', 'sommer', 'winter', 'herbst', 'frühling'].includes(f(k)) && w !== 'am' && w !== 'an') push({ end: k + 1, prep: w });
      }
    }
    if (w === 'im' || w === 'in') {
      if (w === 'im' && (MONTHS.includes(f(i + 1)) || SEASONS.includes(f(i + 1)))) { push({ end: i + 2, month: f(i + 1), prep: 'im', small: small(i + 1) }); }
      if (w === 'im' && ['monat', 'moment', 'jahr', 'sommer', 'urlaub'].includes(f(i + 1))) { push({ end: i + 2, prep: 'im', month: MONTHS.includes(f(i + 2)) ? f(i + 2) : undefined }); if (f(i + 1) === 'monat' && MONTHS.includes(f(i + 2))) push({ end: i + 3, month: f(i + 2), prep: 'im' }); if (f(i + 1) === 'jahr' && T[i + 2]?.kind === 'n') push({ end: i + 3, year: true, prep: 'im' }); }
      if (w === 'in' && f(i + 1) === 'der' && ['nacht', 'früh', 'woche', 'pause', 'mittagspause', 'freizeit'].includes(f(i + 2))) push({ end: i + 3, part: f(i + 2), prep: 'in' });
      if (w === 'in' && ['dieser', 'der', 'nächster'].includes(f(i + 1)) && f(i + 2) === 'woche') push({ end: i + 3, prep: 'in' });
    }
    if (['heute', 'morgen', 'gestern', 'übermorgen', 'vorgestern'].includes(w) && T[i].f) {
      push({ end: i + 1, rel: w });
      if (DAY_PARTS.includes(f(i + 1)) || f(i + 1) === 'früh') push({ end: i + 2, rel: w, part: f(i + 1), small: small(i + 1) && f(i + 1) !== 'früh' });
    }
    if (/^(?:morgens|vormittags|mittags|nachmittags|abends|nachts)$/u.test(w || '')) push({ end: i + 1, part: w.replace(/s$/u, '') });
    const dayly = (k) => (/^(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)s$/u.test(f(k) || '') ? f(k).replace(/s$/u, '') : null);
    if (dayly(i)) {
      push({ end: i + 1, day: dayly(i) });
      // „montags bis freitags“, „montags und mittwochs“
      if (['bis', 'und', 'oder'].includes(f(i + 1)) && dayly(i + 2)) push({ end: i + 3, day: dayly(i), range: true });
    }
    if (w === 'von' && dayly(i + 1) && f(i + 2) === 'bis' && dayly(i + 3)) push({ end: i + 4, day: dayly(i + 1), range: true });
    const d0 = dayName(w);
    if (d0) push({ end: i + 1, ...d0, noPrep: true, small: small(i) });
    if (['jede', 'diese', 'nächste', 'letzte', 'kommende'].includes(w) && ['woche', 'nacht'].includes(f(i + 1))) push({ end: i + 2, part: f(i + 1), rel: w });
    if (['jedes', 'dieses', 'nächstes', 'letztes'].includes(w) && ['jahr', 'wochenende', 'mal'].includes(f(i + 1))) push({ end: i + 2, part: f(i + 1), rel: w });
    if (['ein', 'eine', 'einen', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht'].includes(w) || T[i]?.kind === 'n') {
      const unit = f(i + 1) === 'halbe' || f(i + 1) === 'ganze' ? i + 2 : i + 1;
      const one = w?.startsWith('ein') || T[i]?.f === '1';
      if (one ? ONE_OF[f(unit)] && (!w?.startsWith('ein') || ONE_OF[f(unit)] === w) : ['stunden', 'minuten', 'tage', 'wochen', 'monate', 'jahre'].includes(f(unit))) push({ end: f(unit + 1) === 'lang' ? unit + 2 : unit + 1, span: true });
    }
    if (/^(?:ein|zwei|drei|vier|fünf)mal$/u.test(w || '')) { for (const pat of [['pro', 'woche'], ['in', 'der', 'woche'], ['am', 'tag'], ['im', 'monat'], ['die', 'woche']]) if (pat.every((x, k) => f(i + 1 + k) === x)) push({ end: i + 1 + pat.length }); push({ end: i + 1 }); }
    if (w === 'alle' && f(i + 1) === 'zwei' && ['wochen', 'tage'].includes(f(i + 2))) push({ end: i + 3 });
    // Two time phrases stand together: „am Freitag um zehn Uhr“, „morgens um sieben“, „am Samstag, dem 3. Mai“.
    return out;
  }
  /** One or more time phrases side by side, as one. */
  function times(i) { return once('times', i, () => timesAt(i)); }
  function timesAt(i) {
    if (!budget()) return [];
    const out = [];
    for (const a of time(i)) {
      out.push({ ...a, parts: [a] });
      for (const b of [...time(a.end), ...clock(a.end).map((c) => ({ kind: 'time', end: c.end, h: c.h, m: c.m, clock: true }))]) {
        const { end, ...rest } = b;
        const merged = { ...a, ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined && v !== null)), kind: 'time', end, parts: [a, b], prep: a.prep, small: a.small || b.small };
        out.push(merged);
        for (const c of time(b.end)) out.push({ ...merged, ...Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined && v !== null)), kind: 'time', end: c.end, parts: [a, b, c], prep: a.prep });
      }
    }
    // „Freitag, 10 Uhr“
    for (const a of [...out]) if (T[a.end]?.f === ',' ) for (const c of clock(a.end + 1)) out.push({ ...a, h: c.h, m: c.m, clock: true, end: c.end });
    // „am Montag und am Dienstag“: two days, one time.
    for (const a of [...out]) if (a.day && !a.h && f(a.end) === 'und') for (const b of time(a.end + 1)) if (b.day && b.day !== a.day && !b.h) out.push({ ...a, end: b.end, days: [a.day, b.day], range: true });
    return uniq(out, (x) => `${x.end}|${x.day || ''}|${x.part || ''}|${x.h ?? ''}|${x.month || ''}|${x.rel || ''}`);
  }

  // ——— One element of a clause ———
  function adverb(i) { return once('adverb', i, () => adverbAt(i)); }
  function adverbAt(i) {
    const out = [];
    for (const p of ADV_PHRASES) if (p.every((x, k) => f(i + k) === x)) out.push({ kind: 'adv', end: i + p.length, word: p.join(' ') });
    const w = f(i);
    if (w && ADVERBS.has(w) && (!T[i].cap || first.has(i) || T[i - 1]?.kind === 'p')) {
      out.push({ kind: 'adv', end: i + 1, word: w });
      if (DEGREE.has(w) && f(i + 1) && ADVERBS.has(f(i + 1)) && !T[i + 1].cap) out.push({ kind: 'adv', end: i + 2, word: f(i + 1), degree: w });
    }
    return out;
  }
  function adjective(i) { return once('adjective', i, () => adjectiveAt(i)); }
  function adjectiveAt(i) {
    const out = [];
    let k = i;
    const degrees = [];
    while (degrees.length < 3 && ((f(k) && DEGREE.has(f(k))) || (f(k) === 'ein' && ['bisschen', 'wenig'].includes(f(k + 1))))) { degrees.push(f(k)); k += f(k) === 'ein' ? 2 : 1; }
    for (const start of degrees.length ? [k, i] : [i]) {
      const w = f(start);
      // („schon halb neun“ is a time, never an adjective.)
      if (!w || w === 'halb' || (T[start].cap && !first.has(start) && T[start - 1]?.kind !== 'p')) continue;
      const a = adjectiveForm(w).find((x) => x.ending === '');
      if (!a) continue;
      const base = { kind: 'adj', end: start + 1, word: a.stem, words: [a.stem], degree: start === k ? degrees : [], neg: start === k && degrees.includes('nicht') };
      out.push(base);
      // „grün und weiß“, „alt, aber sehr aktiv“, „jung oder alt“
      let e = base;
      for (let round = 0; round < 2; round += 1) {
        let j = e.end;
        if (T[j]?.f === ',' && f(j + 1) && ['aber', 'und', 'sondern'].includes(f(j + 1))) j += 1;
        if (!['und', 'aber', 'oder', 'sondern'].includes(f(j)) && T[e.end]?.f !== ',') break;
        const contrast = f(j) === 'sondern';
        j += 1;
        let deniedNext = false;
        while (f(j) && DEGREE.has(f(j))) { if (f(j) === 'nicht') deniedNext = true; j += 1; }
        const b = f(j) ? adjectiveForm(f(j)).find((x) => x.ending === '') : null;
        if (!b) break;
        e = { ...e, end: j + 1, words: [...e.words, b.stem], ...(contrast && !deniedNext ? { affirmed: true } : {}) };
        out.push(e);
      }
    }
    return out;
  }
  const verbsAt = (i, moods) => (T[i]?.kind === 'w' && (!T[i].cap || first.has(i) || T[i - 1]?.kind === 'p') ? verbReadings(T[i].f).filter((v) => moods.includes(v.mood)) : []);

  function elements(i) { return once('el', i, () => elementsAt(i)); }
  function elementsAt(i) {
    if (!budget() || i >= T.length || isStop(T[i])) return [];
    const list = [...times(i), ...clock(i).filter((c) => c.spoken || c.exact).map((c) => ({ kind: 'time', ...c, clock: true, bareClock: true })), ...np(i), ...pp(i), ...adverb(i), ...adjective(i)];
    return list.sort((a, b) => b.end - a.end);
  }

  // The words that may end a clause: participle, infinitive(s), prefix, or nothing.
  function bracket(i, reading) {
    const out = [{ end: i, kind: 'none' }];
    if (!T[i]) return out;
    const w = f(i);
    const inf = verbsAt(i, ['inf']);
    const part = verbsAt(i, ['part']);
    if (part.length) {
      for (const p of part) out.push({ end: i + 1, kind: 'part', verb: p });
      // „eingekauft und gekocht“ share their „habe“.
      if (f(i + 1) === 'und') for (const q of verbsAt(i + 2, ['part'])) out.push({ end: i + 3, kind: 'part', verb: part[0], also: q });
      if (verbsAt(i + 1, ['inf']).some((v) => ['werden', 'haben', 'sein'].includes(v.lemma))) out.push({ end: i + 2, kind: 'part', verb: part[0] });
    }
    for (const v of inf) {
      out.push({ end: i + 1, kind: 'inf', verb: v });
      // „einkaufen gehen“, „kennenlernen wollen“, „essen und trinken“
      for (const g of verbsAt(i + 1, ['inf']).filter((x) => /[+]/.test(x.takes) || x.modal)) out.push({ end: i + 2, kind: 'inf', verb: g, inner: v });
      if (f(i + 1) === 'und' || f(i + 1) === 'oder') for (const q of verbsAt(i + 2, ['inf'])) out.push({ end: i + 3, kind: 'inf', verb: v, also: q });
    }
    if (w === 'zu') for (const v of verbsAt(i + 1, ['inf'])) out.push({ end: i + 2, kind: 'zu', verb: v });
    for (const v of verbsAt(i, ['zu'])) out.push({ end: i + 1, kind: 'zu', verb: v });
    if (reading?.lemma && w) for (const s of separableOf(reading.lemma)) if (s.prefix === w) out.push({ end: i + 1, kind: 'prefix', sep: s });
    // „gehe … spazieren“, „lerne … kennen“ are prefixes that are verbs.
    return out;
  }

  const interjection = (i) => { for (const p of INTERJECTIONS) if (p.every((x, k) => f(i + k) === x)) return i + p.length; return 0; };
  /** The partner's name, with or without Frau, Herr: where it ends, or 0. */
  const address = (i) => {
    const names = String(ctx.partner || '').split(/\s+/).filter(Boolean).map(fold);
    if (!names.length) return 0;
    if (names.every((n, k) => f(i + k) === n)) return i + names.length;
    return f(i) === names.at(-1) && names.length === 1 ? i + 1 : 0;
  };
  // Only „bitte“, „danke“ and the partner's name may follow a clause without a comma.
  const tail = (i) => { let k = i; while (k < T.length && T[k].kind !== 'p') { const e = address(k) || (['bitte', 'danke', 'noch', 'oder'].includes(f(k)) ? k + 1 : 0); if (!e) return false; k = e; } return k > i; };
  const boundary = (i) => !T[i] || T[i].kind === 'p' || COORDINATORS.has(f(i)) || SUBORDINATORS.has(f(i)) || tail(i);

  /** Everything from i to the end of the clause: [{ end, elems, bracket }]. `stopAt` ends early where a verb closes the clause. */
  function middle(i, reading, elems, acc, depth) {
    if (acc.length > 60 || depth > 10 || !budget()) return;
    for (const b of bracket(i, reading)) if (boundary(b.end)) acc.push({ end: b.end, elems, bracket: b });
    for (const e of elements(i)) {
      if (e.end <= i) continue;
      middle(e.end, reading, [...elems, e], acc, depth + 1);
    }
  }

  // ——— Roles ———
  const agreesNumber = (np0, persons) => { const a = String(np0.agr || '').split('|'); return persons.includes('er') ? a.includes('er') || np0.money : persons.includes('sie') ? a.includes('sie') || a.includes('wir') : true; };
  const agrees = (np0, persons) => { const a = String(np0.agr || '').split('|'); return a.some((x) => persons.includes(x)); };
  function assign({ elems, persons, inverted, mainVerb, imperative, sharedSubject = null, before = 0, wh = null }) {
    const takes = mainVerb.takes || '';
    const lemma = mainVerb.lemma;
    const nps = elems.filter((e) => e.combos);
    const results = [];
    const only = nps.filter((n) => n.kind === 'pron' && ['ich', 'du', 'er', 'wir', 'man'].includes(n.head));
    const able = nps.filter((n) => n.combos.some((c) => c.c === 'n') && n.agr && agrees(n, persons) && !(n.kind === 'pron' && n.head === 'das' && !persons.includes('er') && !['sein', 'werden', 'bleiben'].includes(lemma)));
    const subjectChoices = imperative ? [null] : sharedSubject ? [sharedSubject]
      : [...able.filter((n) => !n.wh), ...able.filter((n) => n.wh)].filter((n) => !only.length || only.includes(n) || (lemma === 'sein' && n.head === 'das'));
    if (sharedSubject && (only.length || !agrees(sharedSubject, persons))) return [];
    // „Freitag um zehn passt mir.“: a day is what suits.
    if (!imperative && !sharedSubject && !subjectChoices.length && persons.includes('er') && ['passen', 'gehen', 'sein'].includes(lemma)) { const when = elems.find((e) => e.kind === 'time' && (e.noPrep || e.bareClock)); if (when) subjectChoices.push({ ...when, head: 'zeit', kind: 'when', agr: 'er', combos: [{ c: 'n' }] }); }
    for (const subj of subjectChoices) {
      // „Es kommen zwei Freunde.“: „es“ only opens the sentence.
      const opens = elems[0]?.head === 'es' && elems[0] !== subj && inverted !== true && ['kommen', 'mitkommen', 'sein', 'fehlen', 'stehen'].includes(lemma) ? elems[0] : null;
      const rest = nps.filter((n) => n !== subj && n !== opens);
      const firstIndex = elems.indexOf(subj);
      // A pronoun subject stands right after the verb when something else opens the clause.
      if (subj && inverted && subj.kind === 'pron' && PRONOUN_SUBJECT.has(subj.head) && firstIndex > before && elems.slice(before, firstIndex).some((e) => !(e.kind === 'pron'))) continue;
      const subjHead = subj?.head;
      const refl = REFLEXIVE[subj?.agr?.split('|')[0]] || [];
      const isRefl = (n) => n.kind === 'pron' && (n.head === 'sich' || (refl.includes(n.head) && n.head !== 'sich'));
      // The first pronoun after the verb (or after „ob“) that can be the subject is the subject.
      const lead = nps.find((n, k) => k >= 0 && !n.wh);
      if (!imperative && lead && lead !== subj && lead.kind === 'pron' && ['sie', 'es'].includes(lead.head) && lead.formal !== true && elems.indexOf(lead) >= before && before === 0 && subj && lemma !== 'sein') continue;
      if (!imperative && lead && lead !== subj && lead.kind === 'pron' && lead.head === 'sie' && lead.formal === true && before === 0 && subj && lemma !== 'sein') continue;
      if (bareFault(subj, 'subject', lemma)) continue;
      const trial = roles(rest, { takes, lemma, subj, isRefl, elems, wh, persons, passive: mainVerb.passive });
      if (!trial) continue;
      if (lemma === 'machen' && trial.acc?.kind === 'np' && !trial.acc.det && !MADE.has(trial.acc.head) && verbReadings(trial.acc.head).some((v) => v.mood === 'inf')) continue;
      results.push({ subj, subjHead, ...trial });
    }
    return results;
  }
  function bareFault(n, role, lemma) {
    if (!n || !n.bare) return false;
    if (n.list) return !n.bareOk;
    if (['name', 'place', 'language'].includes(n.kind)) return false;
    if (n.kind === 'own') return false; // judged by the caller (`unknown`)
    // „Wann ist Pause?“ is what one says; every other verb keeps the article („Wann beginnt die Pause?“).
    if (role === 'subject' && n.kind === 'np' && NEEDS_ARTICLE.has(n.head)) return !(lemma === 'sein' && ['pause', 'mittagspause'].includes(n.head));
    if (n.bareOk) return false;
    if (role === 'predicate' && (n.job || PEOPLE.test(n.head) || /(?:er|in|e)$/u.test(n.head))) return false;
    if (role === 'object' && lemma === 'haben' && BARE.has(n.head)) return false;
    return true;
  }
  function roles(rest, { takes, lemma, subj, isRefl, elems, wh, persons = [], passive = false }) {
    const sein = ['sein', 'werden', 'bleiben', 'heißen'].includes(lemma);
    let pred = null;
    let acc = null;
    let dat = null;
    let refl = null;
    const adj = elems.filter((e) => e.kind === 'adj');
    for (const n of rest) {
      const has = (c) => n.combos.some((x) => x.c === c);
      if ((n.head === 'uhr' || n.head === 'viertel') && (n.bare || n.det === 'num')) return null;
      if (n.kind === 'num' && !(takes.includes('m') || sein)) { if (rest.some((x) => x !== n && x.bare)) return null; if (!/^(?:nehmen|brauchen|haben|kaufen|möchten|wollen|mögen|bekommen|bestellen)$/u.test(lemma)) return null; }
      // „Es geht mir gut“, „Das passt mir“, „Das ist mir zu teuer“
      if (lemma === 'gehen' && subj?.head === 'es' && has('d') && !dat && n.kind !== 'num') { dat = n; continue; }
      if (['arbeiten', 'wissen'].includes(lemma) && !acc && ['was', 'viel', 'wenig', 'nichts', 'etwas'].includes(n.head)) { acc = n; continue; }
      if (takes.includes('m') && !acc && (n.kind === 'phone' || n.money || n.kind === 'num' || n.det === 'num' || ['viel', 'wenig', 'nichts', 'etwas', 'was'].includes(n.head))) { acc = n; continue; }
      if (lemma === 'nennen' && acc && !pred && ['own', 'name'].includes(n.kind)) { pred = n; continue; }
      if (sein && !pred && has('n')) {
        if (n.kind === 'pron' && ['ich', 'du', 'er', 'sie', 'wir', 'man', 'es'].includes(n.head) && !(subj?.head === 'das' || (n.head === 'es' && subj?.kind === 'pron'))) return null;
        const person = subj?.kind === 'pron' && ['ich', 'du', 'er', 'sie', 'wir', 'ihr', 'man'].includes(subj.head);
        if (n.bare && person && n.kind === 'np' && !n.job && !PEOPLE.test(n.head) && !(lemma === 'sein' && /(?:er|erin|in|ist|istin|ant|antin|ent|entin)$/u.test(n.head)) && lemma !== 'heißen') return null;
        if (bareFault(n, person ? 'predicate' : 'thing', lemma) && !(persons.includes('sie') && n.kind === 'np' && String(n.agr).includes('sie'))) return null;
        // „Mein Heft ist eine gelb.“
        if (n.kind === 'pron' && /^(?:eine|einen|eins|keine|keinen)$/u.test(n.head) && adj.length) return null;
        pred = n;
        continue;
      }
      if (sein && !dat && n.kind === 'pron' && has('d')) { dat = n; continue; }
      if (takes.includes('r') && isRefl(n) && !refl) { refl = n; continue; }
      if (takes.includes('D') && has('d') && !dat) { dat = n; continue; }
      if (takes.includes('a') && has('a') && !acc && !(n.kind === 'pron' && has('d') && !takes.includes('r') && takes.includes('d') && rest.some((x) => x !== n && x.combos.some((c) => c.c === 'a') && !x.combos.some((c) => c.c === 'd')))) { if (bareFault(n, 'object', lemma)) return null; acc = n; continue; }
      if ((takes.includes('d') || (takes.includes('a') && n.kind === 'pron')) && has('d') && !dat && !(n.bare && n.kind !== 'name')) { dat = n; continue; }
      return null;
    }
    if (lemma === 'werden' && !pred && !adj.length && !passive) return null;
    // A time of day without „um“ stands only beside „Es ist“, „Wir haben“, „Meine Uhr zeigt“.
    if (elems.some((e) => e.bareClock) && !['sein', 'haben', 'zeigen', 'passen', 'gehen'].includes(lemma)) return null;
    if (lemma === 'treffen' && !acc && !refl) return null;
    // „Ich lade dir ein.“: these take whom, not to whom.
    if (dat && !acc && ['einladen', 'besuchen', 'sehen', 'begleiten', 'anrufen', 'fragen', 'kennen', 'lieben', 'treffen', 'abholen', 'kennenlernen', 'mögen', 'stören', 'mitnehmen'].includes(lemma)) return null;
    if (dat && dat.kind !== 'pron' && !acc && takes.includes('a') && !wh) return null;
    if (subj?.kind === 'language' && !['sein', 'gefallen', 'machen', 'klingen'].includes(lemma)) return null;
    // „Kaffee von Milch“: what goes with it stands after „mit“.
    if (acc && (acc.stuff || acc.measure || ctx.isFood?.(acc.head) || /^(?:glas|tasse|stück|flasche|portion|teller|dose)$/u.test(acc.head)) && elems.some((e) => e.kind === 'pp' && e.prep === 'von' && e.np.stuff)) return null;
    if (lemma === 'heißen' && !pred && !wh) return null;
    if (lemma === 'geben' && !dat && !(subj?.head === 'es' && acc) && takes === 'ad') return null;
    // „Das ist meine Tasche“, „Das sind meine Schlüssel“: what it is and the verb are one number.
    if (pred && ['das', 'was', 'wer', 'dies'].includes(subj?.head) && subj.kind === 'pron' && pred.agr && !(pred.kind === 'pron' && pred.head === 'das') && !agreesNumber(pred, persons)) return null;
    if (acc?.kind === 'pron' && ['mich', 'dich', 'euch'].includes(acc.head) && takes.startsWith('ad') && !dat) return null;
    if (lemma === 'sprechen' && acc && !(acc.kind === 'language' || ['was', 'etwas', 'viel', 'nichts', 'das', 'sprachen', 'sprache'].includes(acc.head) || acc.det)) return null;
    if (lemma === 'haben' && !acc && !(wh && ['clock', 'amount'].includes(wh.as)) && !elems.some((e) => e.bareClock) && !elems.some((e) => e.kind === 'adv' && ['frei', 'gern', 'lieber'].includes(e.word)) && !adj.some((a) => ['frei', 'offen', 'geöffnet', 'recht'].includes(a.word))) return null;
    if (lemma === 'sein' && subj && !pred && !adj.length && !wh && elems.filter((e) => e !== subj).length === 0) return null;
    if (['brauchen', 'kaufen', 'nehmen', 'benötigen', 'bestellen', 'mögen', 'bekommen', 'besuchen', 'kennen', 'lieben', 'tragen'].includes(lemma) && !acc) return null;
    // A predicate adjective needs a verb that takes one; beside another verb it says how („gut schlafen“), never beside „haben“.
    if (lemma === 'haben' && adj.length && !adj.some((a) => ['frei', 'offen', 'geöffnet', 'ganz', 'gut', 'normal'].includes(a.word))) return null;
    if (takes.includes('a') && !takes.includes('p') && adj.some((a) => ['müde', 'krank', 'rot', 'hungrig', 'durstig', 'verheiratet', 'jung'].includes(a.word))) return null;
    if (acc?.infinitive && lemma === 'spielen') return null;
    if (acc && PLAYED.has(acc.head) && !PLAYING.has(lemma)) return null;
    if (!placesFit(elems, lemma, takes)) return null;
    // „nicht Hunger“: a noun without an article is negated with „kein“.
    if (acc?.bare && !acc.infinitive) { const i = elems.indexOf(acc); if (elems[i - 1]?.kind === 'adv' && elems[i - 1].word === 'nicht' && ['haben', 'brauchen', 'möchten', 'nehmen', 'kaufen', 'essen', 'trinken'].includes(lemma)) return null; }
    return { pred, acc, dat, refl, adj };
  }

  // in, an, auf … with the accusative say where to: only beside a verb of going or putting, or one that takes it („freue mich auf“).
  function placesFit(elems, lemma, takes) {
    for (const e of elems) {
      if (e.kind === 'pp' && e.prep === 'bei' && VEHICLES.has(e.np.head) && ['fahren', 'kommen', 'reisen', 'gehen', 'abfahren', 'hinfahren'].includes(lemma)) return false;
      // „auf Ihnen“, „in mir“: a person stands after these only where the verb asks for it.
      if (e.kind === 'pp' && ['auf', 'in', 'unter', 'über', 'hinter'].includes(e.prep) && e.np.kind === 'pron' && !TAKES_ACC.has(`${e.prep}|${lemma}`)) return false;
      if (e.kind !== 'pp' || !TWO_WAY_PREP.has(e.prep) || !e.c || e.np.kind === 'phone' || e.np.kind === 'date') continue;
      if (e.np.kind === 'place' && !['in', 'vor', 'hinter', 'über'].includes(e.prep)) return false;
      const acc = e.c === 'a';
      if (lemma === 'gehen' && e.c === 'd' && e.prep === 'in' && WHERE_TO.has(e.np.head)) return false;
      if (acc && !(takes.includes('w') || TAKES_ACC.has(`${e.prep}|${lemma}`))) return false;
      if (e.c === 'd' && ['auf|freuen', 'über|freuen', 'auf|warten', 'an|denken', 'über|sprechen'].includes(`${e.prep}|${lemma}`)) return false;
    }
    return true;
  }

  /** The reading of the whole verb: what the finite verb and the bracket say together. */
  function verbComplex(reading, b) {
    if (b.kind === 'zu') return ['sein', 'haben', 'versuchen', 'brauchen', 'beginnen', 'anfangen', 'mögen'].includes(reading.lemma) ? { main: reading, zu: b.verb } : null;
    if (b.kind === 'prefix') return reading.modal ? null : { main: { ...b.sep, part: null }, sep: true };
    if (b.kind === 'part') {
      const p = b.verb;
      if (reading.lemma === 'haben') { if (p.sein && !p.either) return null; return { main: p, perfect: true }; }
      if (reading.lemma === 'sein') {
        if (p.sein || p.either) return { main: p, perfect: true };
        // „ist geöffnet“, „bin verheiratet“, „bin eingeladen“: a state.
        return { main: { lemma: 'sein', takes: 'pl' }, state: p };
      }
      if (reading.lemma === 'werden') return { main: { lemma: 'werden', takes: 'pl', passive: true }, passive: p };
      return null;
    }
    if (b.kind === 'inf') {
      if (reading.modal) return { main: b.verb.lemma === 'gehen' && b.inner ? { ...b.inner, going: true, takes: `${b.inner.takes}w` } : b.verb, modal: reading.lemma, inner: b.inner, polite: reading.polite };
      if (reading.lemma === 'werden') return { main: b.verb.lemma === 'gehen' && b.inner ? { ...b.inner, going: true, takes: `${b.inner.takes}w` } : b.verb, modal: reading.polite ? 'würde' : 'werden', polite: reading.polite };
      if (/[+]/.test(reading.takes)) return { main: ['gehen', 'fahren'].includes(reading.lemma) ? { ...b.verb, going: true, takes: `${b.verb.takes}w` } : b.verb, with: reading.lemma };
      return null;
    }
    if (reading.modal && !['möchten', 'mögen', 'können', 'wollen', 'müssen', 'dürfen', 'sollen'].includes(reading.lemma)) return null;
    if (reading.modal) return { main: { lemma: reading.lemma, takes: 'aw' }, bareModal: true };
    if (reading.lemma === 'werden' && reading.polite) return null;
    return { main: reading };
  }

  // ——— Clauses ———
  const stopAhead = (i) => { for (let k = i; k < T.length; k += 1) if (T[k].kind === 'p' && STOP.has(T[k].f)) return T[k].f; return ''; };
  function finish(base, elems, reading, b, { inverted, question, wh, imperative, sharedSubject, before = 0 }) {
    const vc = verbComplex(reading, b);
    if (!vc) return [];
    const asks = question && !wh && stopAhead(b.end) !== '?';
    const list = assign({ elems, persons: reading.persons, inverted, mainVerb: vc.main, imperative, sharedSubject, before, wh });
    return list.filter((r) => !asks || (r.subj?.kind === 'pron' && (['du', 'wir', 'ihr'].includes(r.subj.head) || (r.subj.head === 'sie' && r.subj.formal !== false)))).map((r) => ({ ...base, ...r, elems, before, lemma: vc.main.lemma, going: Boolean(vc.main.going), reading, perfect: Boolean(vc.perfect), state: vc.state?.lemma || null, passive: vc.passive?.lemma || null, modal: vc.modal || (vc.bareModal ? vc.main.lemma : null), polite: Boolean(reading.polite), past: reading.mood === 'past', also: b.also?.lemma || null, question: Boolean(question), wh: wh || null, imperative: Boolean(imperative) }));
  }

  /** W-phrases: [{ end, word, np, prep }]. */
  function wPhrase(i) { return once('wPhrase', i, () => wPhraseAt(i)); }
  function wPhraseAt(i) {
    const out = [];
    const w = f(i);
    if (!w) return out;
    if (w === 'wie') {
      out.push({ end: i + 1, word: 'wie', as: 'adv' });
      if (f(i + 1) === 'viel' || f(i + 1) === 'viele') {
        out.push({ end: i + 2, word: f(i + 1) === 'viel' ? 'wie viel' : 'wie viele', as: 'amount' });
        if (f(i + 2) === 'uhr' && f(i + 1) === 'viel') out.push({ end: i + 3, word: 'wie viel uhr', as: 'clock' });
        for (const n of bareNoun(i + 2, { mass: true })) if (n.head !== 'uhr' && (f(i + 1) === 'viel' || String(n.agr).includes('sie'))) out.push({ end: n.end, word: 'wie viel', as: 'amount', np: n });
      }
      for (const a of adjectiveForm(f(i + 1) || '').filter((x) => x.ending === '')) out.push({ end: i + 2, word: `wie ${a.stem}`, as: 'adj' });
      if (['lange', 'oft', 'gern', 'weit'].includes(f(i + 1))) out.push({ end: i + 2, word: `wie ${f(i + 1)}`, as: 'adv' });
    }
    if (['um', 'ab', 'bis', 'gegen', 'seit', 'zu', 'an', 'in', 'aus', 'für', 'mit', 'von', 'bei', 'nach', 'auf', 'als'].includes(w)) {
      const k = i + 1;
      if (w === 'um' && f(k) === 'wie' && f(k + 1) === 'viel' && f(k + 2) === 'uhr') out.push({ end: k + 3, word: 'um wie viel uhr', as: 'time' });
      if (['ab', 'bis', 'seit'].includes(w) && f(k) === 'wann') out.push({ end: k + 1, word: `${w} wann`, as: 'time' });
      if (w === 'als' && f(k) === 'was') out.push({ end: k + 1, word: 'als was', as: 'adv' });
      if (['für', 'mit', 'von', 'bei', 'zu'].includes(w) && ['wen', 'wem'].includes(f(k))) out.push({ end: k + 1, word: `${w} ${f(k)}`, as: 'adv' });
      const det = determinerOf(f(k) || '');
      if (det?.stem === 'welch') {
        for (const n of simpleNp(k)) {
          const cases = DATIVE_PREP.has(w) ? ['d'] : ACCUSATIVE_PREP.has(w) ? ['a'] : w === 'in' || w === 'an' || w === 'auf' ? ['d', 'a'] : [];
          const c = n.combos.filter((x) => cases.includes(x.c));
          // When and where take the dative („an welchem Tag“, „in welchem Stock“).
          if (n.kind === 'np' && c.length && (!['in', 'an'].includes(w) || c.some((x) => x.c === 'd'))) out.push({ end: n.end, word: `${w} welch`, as: 'pp', np: n, prep: w });
        }
      }
    }
    const det = determinerOf(w);
    if (det?.stem === 'welch') for (const n of simpleNp(i)) if (n.kind === 'np') out.push({ end: n.end, word: 'welch', as: 'np', np: n });
    if (w === 'was') {
      out.push({ end: i + 1, word: 'was', as: 'np', np: { end: i + 1, combos: [{ c: 'n' }, { c: 'a' }], agr: 'er|sie', head: 'was', kind: 'pron' } });
      if (f(i + 1) === 'für') for (const n of simpleNp(i + 2)) if (n.kind !== 'pron') out.push({ end: n.end, word: 'was für', as: 'np', np: n });
      if (f(i + 1) === 'genau' || f(i + 1) === 'alles') out.push({ end: i + 2, word: 'was', as: 'np', np: { end: i + 2, combos: [{ c: 'n' }, { c: 'a' }], agr: 'er|sie', head: 'was', kind: 'pron' } });
    } else if (w === 'wer') out.push({ end: i + 1, word: 'wer', as: 'np', np: { combos: [{ c: 'n' }], agr: 'er|sie', head: 'wer', kind: 'pron' } });
    else if (w === 'wen' || w === 'wem') out.push({ end: i + 1, word: w, as: 'np', np: { combos: [{ c: w === 'wen' ? 'a' : 'd' }], agr: null, head: w, kind: 'pron' } });
    else if (W_WORDS.has(w) && !det && w !== 'wie') out.push({ end: i + 1, word: w, as: 'adv' }, ...(['genau', 'bitte', 'ungefähr'].includes(f(i + 1)) ? [{ end: i + 2, word: w, as: 'adv' }] : []));
    return out;
  }

  /** Prefield candidates: one constituent before the finite verb. */
  function prefield(i) { return once('prefield', i, () => prefieldAt(i)); }
  function prefieldAt(i) {
    if (!budget()) return [];
    const out = [];
    for (const c of clock(i)) if (c.exact) out.push({ end: c.end, elems: [{ kind: 'time', ...c, clock: true, bareClock: true }] });
    for (const t of times(i)) { out.push({ end: t.end, elems: [t] }); for (const p of pp(t.end)) out.push({ end: p.end, elems: [t, p] }); }
    for (const n of np(i, { group: true })) out.push({ end: n.end, elems: [n, ...(n.attr || [])] });
    for (const p of pp(i)) { out.push({ end: p.end, elems: [p] }); for (const q of pp(p.end)) out.push({ end: q.end, elems: [p, q] }); }
    if (['nur', 'auch', 'noch', 'erst', 'sogar', 'besonders', 'schon', 'genau', 'ungefähr', 'fast', 'etwa', 'immer', 'spätestens', 'kurz'].includes(f(i))) {
      for (const n of np(i + 1, { group: true })) if (n.kind !== 'pron') out.push({ end: n.end, elems: [n, ...(n.attr || [])] });
      for (const t of times(i + 1)) out.push({ end: t.end, elems: [t] });
      for (const p of pp(i + 1)) out.push({ end: p.end, elems: [p] });
    }
    for (const a of adverb(i)) { out.push({ end: a.end, elems: [a] }); for (const t of times(a.end)) out.push({ end: t.end, elems: [a, t] }); for (const p of pp(a.end)) out.push({ end: p.end, elems: [a, p] }); }
    for (const a of adjective(i)) out.push({ end: a.end, elems: [a] });
    return uniq(out, (x) => `${x.end}|${x.elems.map((e) => `${e.kind}${e.agr || ''}${(e.combos || []).map((c) => c.c).join('')}`).join('+')}`);
  }

  /** A main clause from i: [{ end, … }]. `shared`: the subject of the clause before („… und gehe …“). */
  function mainClause(i, { shared = null } = {}) {
    if (!budget()) return [];
    const out = [];
    const tryVerb = (k, elemsBefore, opts) => {
      for (const v of verbsAt(k, ['fin', 'past', ...(opts.imperative ? ['imp'] : [])])) {
        if (opts.imperative && v.mood !== 'imp') continue;
        const acc = [];
        middle(k + 1, v, elemsBefore, acc, 0);
        for (const m of acc) for (const c of finish({ end: m.end, start: i }, m.elems, v, m.bracket, opts)) out.push(c);
      }
    };
    // A question with a w-word.
    for (const w of wPhrase(i)) {
      const el = w.as === 'np' ? [{ ...w.np, wh: true, end: w.end }] : [];
      tryVerb(w.end, el, { inverted: true, question: true, wh: w, before: el.length });
    }
    // Verb first: a yes/no question, a request, or „und gehe …“ with the subject before.
    if (shared) tryVerb(i, [], { inverted: false, sharedSubject: shared });
    tryVerb(i, [], { inverted: true, question: true, yn: true });
    if (!shared && !['bitte', 'bitten', 'danke', 'hallo'].includes(f(i))) {
      tryVerb(i, [], { imperative: true });
      // „Bringen Sie mir bitte …“: a request with Sie is verb first with its subject; read as a question, marked by its stop.
    }
    // „Geboren bin ich in Kairo.“
    for (const p of verbsAt(i, ['part'])) for (const v of verbsAt(i + 1, ['fin', 'past']).filter((x) => ['sein', 'haben', 'werden'].includes(x.lemma))) {
      const acc = [];
      middle(i + 2, v, [], acc, 0);
      for (const m of acc) if (m.bracket.kind === 'none') for (const c of finish({ end: m.end, start: i }, m.elems, v, { end: m.end, kind: 'part', verb: p }, { inverted: true })) out.push(c);
    }
    // Verb second.
    for (const p of prefield(i)) {
      const inverted = !(p.elems[0].combos && p.elems[0].combos.some((c) => c.c === 'n'));
      tryVerb(p.end, p.elems, { inverted, before: p.elems.length });
    }
    return out;
  }

  /** A clause with its verb last, after „weil“, „ob“, „dass“, „wenn“ or a w-word. */
  function verbLast(i) {
    const out = [];
    const opens = [];
    if (f(i) && SUBORDINATORS.has(f(i))) opens.push({ end: i + 1, word: f(i) });
    for (const w of wPhrase(i)) opens.push({ end: w.end, word: w.word, wh: w });
    for (const o of opens) {
      const acc = [];
      collect(o.end, o.wh?.as === 'np' ? [{ ...o.wh.np, wh: true, end: o.end }] : [], acc, 0);
      for (const m of acc) {
        for (const x of lastVerb(m.end)) {
          const vc = x.vc;
          const list = assign({ elems: m.elems, persons: x.reading.persons, inverted: false, mainVerb: vc.main, wh: o.wh });
          for (const r of list) out.push({ end: x.end, ...r, elems: m.elems, lemma: vc.main.lemma, going: Boolean(vc.main.going), perfect: Boolean(vc.perfect), modal: vc.modal || null, reading: x.reading, sub: o.word, wh: o.wh || null });
        }
      }
    }
    return out;
  }
  function collect(i, elems, acc, depth) {
    if (acc.length > 60 || depth > 9 || !budget()) return;
    acc.push({ end: i, elems });
    for (const e of elements(i)) collect(e.end, [...elems, e], acc, depth + 1);
  }
  /** The verb words that close a subordinate clause. */
  function lastVerb(i) {
    const out = [];
    for (const v of verbsAt(i, ['fin', 'past', 'last'])) if (boundary(i + 1)) out.push({ end: i + 1, reading: v, vc: v.modal ? { main: { lemma: v.lemma, takes: 'aw' } } : { main: v } });
    for (const p of verbsAt(i, ['part'])) for (const v of verbsAt(i + 1, ['fin', 'past'])) if (boundary(i + 2)) { const vc = verbComplex(v, { kind: 'part', verb: p }); if (vc) out.push({ end: i + 2, reading: v, vc }); }
    for (const p of verbsAt(i, ['inf'])) for (const v of verbsAt(i + 1, ['fin', 'past'])) if (boundary(i + 2)) { const vc = verbComplex(v, { kind: 'inf', verb: p }); if (vc) out.push({ end: i + 2, reading: v, vc }); }
    for (const a of verbsAt(i, ['inf'])) for (const p of verbsAt(i + 1, ['inf'])) for (const v of verbsAt(i + 2, ['fin', 'past'])) if (boundary(i + 3) && v.modal) { const vc = verbComplex(v, { kind: 'inf', verb: p, inner: a }); if (vc) out.push({ end: i + 3, reading: v, vc }); }
    return out;
  }
  /** „…, zu tanzen“, „…, am Samstag einzukaufen“, „…, um Deutsch zu lernen“. */
  function zuClause(i) {
    const out = [];
    const k = f(i) === 'um' || f(i) === 'ohne' ? i + 1 : i;
    const acc = [];
    collect(k, [], acc, 0);
    for (const m of acc) {
      const j = m.end;
      const z = verbsAt(j, ['zu']);
      const inf = f(j) === 'zu' ? verbsAt(j + 1, ['inf']) : [];
      // „…, einkaufen zu gehen“
      const going = f(j + 1) === 'zu' && f(j + 2) === 'gehen' ? verbsAt(j, ['inf']).map((x) => [x, j + 3]) : [];
      for (const v of [...going, ...z.map((x) => [x, j + 1]), ...inf.map((x) => [x, j + 2])]) {
        if (!boundary(v[1])) continue;
        const r = roles(m.elems.filter((e) => e.combos), { takes: v[0].takes, lemma: v[0].lemma, subj: { head: 'ich' }, isRefl: (n) => n.kind === 'pron' && ['mich', 'dich', 'sich', 'mir', 'dir'].includes(n.head), elems: m.elems });
        if (r) out.push({ end: v[1], ...r, elems: m.elems, lemma: v[0].lemma, zu: true });
      }
    }
    return out;
  }

  /** A fragment without a verb: noun phrases, times, places, adjectives. */
  function fragment(i) {
    const acc = [];
    collect(i, [], acc, 0);
    for (const v of verbsAt(i, ['inf'])) acc.push({ end: i + 1, elems: [{ kind: 'inf', end: i + 1, verb: v.lemma }] });
    // („Wissen Sie“, „ich am Dienstag“ are no fragments: a person that could be the subject stands there with „auch“ at most.)
    const person = (e) => e.kind === 'pron' && ['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr'].includes(e.head);
    return acc.filter((m) => m.end > i && boundary(m.end) && m.elems.length && !(m.elems.some(person) && m.elems.some((e) => !person(e) && e.kind !== 'adv')) && !m.elems.some((e) => e.kind === 'pp' && e.c === 'a' && TWO_WAY_PREP.has(e.prep) && e.prep !== 'über' && e.np.kind !== 'date')).map((m) => ({ end: m.end, elems: m.elems, frag: true, adj: m.elems.filter((e) => e.kind === 'adj'), neg: m.elems.some((e) => e.neg || (e.kind === 'adv' && e.word === 'nicht')) }));
  }

  /** A whole sentence from i to its stop: lists of clauses, or null. */
  function sentence(i) {
    const seen = new Set();
    function go(k, clauses, shared) {
      if (!budget()) return null;
      const t = T[k];
      if (!t || (t.kind === 'p' && STOP.has(t.f))) return clauses.length ? { end: t ? k + 1 : k, stop: t?.f || '', clauses } : null;
      const key = `${k}|${shared?.head || ''}|${clauses.length > 0}`;
      if (seen.has(key)) return null;
      const options = [];
      let j = k;
      let joined = null;
      if (clauses.length) {
        if (t.kind === 'p' && t.f === ',') { joined = ','; j += 1; }
        if (f(j) && COORDINATORS.has(f(j))) { joined = f(j); j += 1; }
        if (!joined && !clauses.at(-1).around && !tail(k)) { seen.add(key); return null; }
      } else if (f(j) === 'und' || f(j) === 'aber') { joined = f(j); j += 1; }
      const around = address(j) || (f(j) === 'oder' && T[j + 1]?.f === '?' ? j + 1 : 0) || interjection(j);
      const said = around ? T.slice(j, around).map((x) => x.f).join(' ') : '';
      if (around && (address(j) || !T[around] || T[around].kind === 'p' || COORDINATORS.has(f(around)) || NO_COMMA.has(said) || tail(around))) options.push({ end: around, around: T.slice(j, around).map((x) => x.f).join(' '), elems: [], address: Boolean(address(j)) });
      const mains = mainClause(j, {});
      const asks = clauses.at(-1);
      // „Weißt du, wo ist mein Stift?“: after a verb that asks, the question has its verb last.
      const indirect = asks && joined === ',' && !asks.imperative && !asks.acc && ['wissen', 'sagen', 'erzählen', 'fragen', 'erklären'].includes(asks.lemma) && (asks.question || asks.modal);
      for (const c of mains) if (!(indirect && c.wh)) options.push(c);
      // „Tim und Paul kommt.“: a noun alone, „und“ and a whole clause are no sentence.
      if (clauses.at(-1)?.frag && joined && joined !== ',' && clauses.at(-1).elems.some((e) => e.combos)) for (let x = options.length - 1; x >= 0; x -= 1) if (options[x].lemma) options.splice(x, 1);
      // Two clauses share their subject in one number only („Sie ist jung und kommen …“), and not behind a question word that is a part of the first („Was ist das und kommt …“).
      if (clauses.length && joined !== ',') {
        const prev = clauses.findLast((x) => !x.around);
        const same = (c) => !prev.reading?.persons || c.reading?.persons?.some((x) => prev.reading.persons.includes(x));
        if (prev?.subj && (!prev.wh || SHARED_WH.has(prev.wh.word))) for (const c of mainClause(j, { shared: prev.subj })) if (c.subj === prev.subj && same(c)) options.push({ ...c, sharedSubj: true });
      }
      // „… und danach einen Film gesehen“: the participle shares „habe“.
      if (clauses.length && ['und', 'oder', ','].includes(joined)) {
        const prev = clauses.findLast((x) => !x.around);
        if (prev?.perfect || prev?.modal) {
          const acc = [];
          middle(j, prev.reading, [], acc, 0);
          for (const m of acc) if (m.bracket.kind === (prev.perfect ? 'part' : 'inf')) for (const c of finish({ end: m.end, start: j }, m.elems, prev.reading, m.bracket, { sharedSubject: prev.subj })) options.push({ ...c, sharedSubj: true });
        }
      }
      if (clauses.length && T[k]?.f === ',') { for (const c of verbLast(k + 1)) options.push({ ...c, dependent: true }); for (const c of zuClause(k + 1)) options.push({ ...c, dependent: true }); }
      if (!clauses.length && f(j) && SUBORDINATORS.has(f(j))) for (const c of verbLast(j)) if (T[c.end]?.f === ',') {
        // „Wenn ich Zeit habe, koche ich.“: the clause is the prefield of the next one.
        const v0 = c.end + 1;
        for (const v of verbsAt(v0, ['fin'])) { const acc = []; middle(v0 + 1, v, [], acc, 0); for (const m of acc) for (const d of finish({ end: m.end, start: j }, m.elems, v, m.bracket, { inverted: true })) options.push({ ...d, before: c }); }
      }
      // „Danke für das Angebot.“ is thanks, not an answer. What „und“ adds to an object is one too („den Stuhl und der Tisch“).
      const object = joined && joined !== ',' && clauses.findLast((x) => !x.around)?.acc;
      for (const c of fragment(j)) if (!(object && c.elems.some((e) => e.combos && !e.combos.some((x) => x.c === 'a')))) options.push(f(j) === 'danke' && c.elems.length > 1 && c.elems.slice(1).every((e) => e.kind === 'pp' && e.prep === 'für') ? { end: c.end, around: 'danke', elems: [] } : c);
      // The longest reading first; a clause before a fragment, a greeting before a fragment.
      options.sort((a, b) => b.end - a.end || (a.frag ? 1 : 0) - (b.frag ? 1 : 0) || (a.around ? -1 : 0) - (b.around ? -1 : 0) || (b.sharedSubj ? 1 : 0) - (a.sharedSubj ? 1 : 0) || (a.imperative ? 1 : 0) - (b.imperative ? 1 : 0));
      for (const c of options.slice(0, 40)) {
        if (c.end <= k) continue;
        const r = go(c.end, [...clauses, { ...c, joined }], c.subj);
        if (r) return r;
      }
      seen.add(key);
      return null;
    }
    return go(i, [], null);
  }

  /** The whole text as sentences of clauses, or null where a word or a place cannot be read. */
  function read() {
    const out = [];
    let i = 0;
    while (i < T.length) {
      if (T[i].kind === 'p') { i += 1; continue; }
      const s = sentence(i);
      if (!s) return null;
      out.push(s);
      i = s.end;
    }
    return out.length ? out : null;
  }
  return { tokens: T, read, steps };
}
