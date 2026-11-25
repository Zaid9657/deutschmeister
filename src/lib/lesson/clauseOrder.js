// The order of a read sentence (loop round 3, 2026-11-25). `clause.js` finds a reading for every word; this says whether the words stand
// where German puts them: „Wann ist die Pause?“, never „Wann ist Pause die?“; „Mir geht es sehr gut.“, never „… gut sehr“. A sentence out
// of order is not read, so it is never praised; what it is called is left to the older checks. The generated probes of
// tests/final-check.test.mjs (two words swapped, one left out, one of another kind in the gap) are what this answers.
import { COLOURS, DAYS, fold } from './germanForms.js';
import { NEEDS_ARTICLE } from './clause.js';

const set = (s) => new Set(s.trim().split(/\s+/).map(fold));
const PERSONAL = set('ich du er sie es wir ihr man');
const OBJECT_PRONOUN = set('mir dir ihm ihnen uns euch mich dich ihn sich');
const POINTING = set('der die das den dem');
const OWNING = set('mein meine meinen meinem meins dein deine deinen deinem deins ihre ihren ihrem ein eine einen einem kein keine keinen');
/** Small words that may stand between the verb and its subject. */
const PARTICLE = set('denn eigentlich bitte ja mal wohl');
/** What never stands behind the adjective it belongs to. */
const BEFORE_ADJECTIVE = new Set(['nicht', 'noch', 'sehr', 'schon', 'so', 'auch', 'ganz', 'viel', 'zu', 'gern', 'gerne', 'nie', 'immer', 'noch nicht', 'gar nicht', 'ein bisschen', 'ziemlich', 'wirklich', 'besonders', 'etwas']);
const COUNT_WORDS = set('viel wenig');
const HOW_MUCH = set('richtig wirklich ziemlich sehr besonders echt');
const SAID_ALONE = set('sagen danken bitten entschuldigen warten schauen gucken sehen hören erzählen');
const SAYS_NOTHING = set('erst sehr noch nicht schon auch nur mehr so ziemlich');
const REFLEXIVE_ONLY = set('befinden freuen beeilen verspäten');
const MEASURES = /^(?:glas|stück|kilo|liter|gramm|tasse|flasche|portion|packung|dose|teller|schüssel|becher|paar|karton|kanne|kännchen|scheibe)/u;
const hasCase = (e, c) => (e.combos || []).some((x) => x.c === c);
const COPULA = set('sein werden bleiben finden aussehen heissen schmecken klingen fühlen gehen');
/** Adjectives that also say how one does something. */
const HOW = set('gut besser schlecht schnell langsam früh spät lange lang viel wenig hart fleissig allein zusammen gemeinsam laut leise richtig pünktlich frei gesund direkt genau kurz täglich regelmässig normal neu frisch warm kalt fertig bequem einfach möglich gleich leicht schwer oft selten privat selbstständig selbständig online deutsch ruhig weit nah fest sicher herzlich natürlich wirklich richtig echt total toll super wunderbar schön perfekt prima nett');
/** People and things that are called by a name. */
const NAMED = /^(?:mutter|vater|mama|papa|mutti|vati|oma|opa|bruder|schwester|sohn|tochter|mann|frau|kind|kinder|freund|freundin|freunde|partner|partnerin|kollege|kollegin|kollegen|nachbar|nachbarin|nachbarn|tante|onkel|cousin|cousine|neffe|nichte|chef|chefin|lehrer|lehrerin|eltern|familie|geschwister|brüder|schwestern|herr|herrn|name|vorname|nachname|familienname|hund|katze|gast|gäste|mitbewohner|mitbewohnerin|zwillingsbruder|zwillingsschwester|grossmutter|grossvater|schwager|schwägerin|baby|stadt|ort|dorf|insel|firma|hotel|café|restaurant|strasse)$/u;
const GREETS = set('tag morgen abend nacht idee');
const LANGUAGE = /^(?:deutsch|englisch|\p{L}+isch|hindi|urdu|farsi|dari|paschtu|paschto|tigrinya|somali|suaheli)$/u;
const KIN_NAME = set('mama papa oma opa mutti vati');
const KIN = set('eltern vater mutter bruder schwester sohn tochter');
const ASKS = set('wissen sagen fragen erklären zeigen verstehen hören sehen erzählen schreiben');
const isPron = (e) => e.kind === 'pron';
const isNp = (e) => ['np', 'name', 'own', 'place', 'language', 'list'].includes(e.kind);

/** Is every sentence in order? */
export function inOrder(sentences, isFare) {
  return sentences.every((s, n) => {
    const said = s.clauses.filter((c) => !c.around);
    return said.every((c, i) => (c.frag ? caseFits(said, i, s, sentences[n + 1]) : !verbFirstLater(said, i, s)) && (c.frag ? fragmentInOrder(c, isFare) : clauseInOrder(c) && !(s.stop === '?' && !c.wh && !c.question && !c.sub && (c.before || 0) > 0 && c.elems[0] !== c.subj && c.elems[0].kind === 'adv' && said.length === 1)) && (!c.dependent || !c.sub || asksBefore(said[i - 1])) && joins(said[i - 1], c, s))
      && s.clauses.every((c, i) => courtesyInOrder(s.clauses, c, i));
  });
}

/** „Sie ist meine Schwester, wohnt sie in Kairo.“: behind a statement, a verb first is a question, and has its mark. */
const verbFirstLater = (said, i, s) => i > 0 && s.stop !== '?' && said[i].question && !said[i].wh && !said[i].imperative && !said[i].sharedSubj && !said[i - 1].frag && !said[i - 1].question && !said[i - 1].imperative;

/** The case of words without a verb: a thing asked about is the subject („Und dein Stift?“); what is added has the case of what it is added to. */
function caseFits(said, i, s, next) {
  const c = said[i];
  const things = c.elems.filter((e) => e.kind === 'np' && e.combos);
  if (!things.length || things.some((e) => headsHave(e, ['ich', 'wir']))) return true;
  if (things.some((e) => !hasCase(e, 'n') && !hasCase(e, 'a'))) return false;
  const prev = said[i - 1];
  const after = said[i + 1];
  const asked = s.stop === '?' ? !after : Boolean(after?.question);
  if ((asked || (s.stop === '?' && after)) && !prev && (after ? after.question : next?.clauses.some((x) => x.question)) && things.some((e) => !hasCase(e, 'n'))) return false;
  if (!prev || prev.frag) return true;
  const stood = prev.elems.findLast((e) => e.kind === 'np' && e.combos);
  if (!stood) return true;
  const role = stood === prev.acc ? 'a' : stood === prev.subj || stood === prev.pred ? 'n' : null;
  if (role && !hasCase(things[0], role) && !(s.stop === '?' && hasCase(things[0], 'n'))) return false;
  // „Woher kommt deine Mutter und dein Vater?“: two people take the plural.
  return !(c.joined === 'und' && s.stop !== '?' ? false : c.joined === 'und' && stood === prev.subj && c.elems[0] === things[0] && things[0].det !== 'dein' && things[0].det !== 'ihr');
}
const headsHave = (e, list) => (e.heads || [e.head]).some((h) => list.includes(h));

/** What „und“ adds without a verb is one more of what stood last („Deutsch und Arabisch“, „am Samstag und am Sonntag“), or asks back („und du?“). */
function joins(prev, c, s) {
  if (!c.frag || !['und', 'oder', 'sowie'].includes(c.joined)) return !(c.frag && prev && strandedArticle(prev, c));
  const asks = s.stop === '?';
  if (asks && c.elems.every(isPron)) return true;
  if (asks && c.elems.length === 1 && isNp(c.elems[0]) && ['dein', 'ihr'].includes(c.elems[0].det)) return true;
  const last = s.clauses[s.clauses.indexOf(c) - 1];
  if (last?.around) return /^(?:ja|nein|hallo|tschüss|danke|bitte)$/u.test(last.around) && (c.elems.every((e) => e.kind === 'adv') || (/^tschüss$/u.test(last.around) && c.elems.every((e) => ['adv', 'pp', 'time'].includes(e.kind))));
  if (!prev) return true;
  if (c.elems.every((e) => e.kind === 'adv') && c.joined === 'oder') return true;
  const first = c.elems.find((e) => e.kind !== 'adv');
  const stood = prev.elems.findLast((e) => e.kind !== 'adv' && (e.kind !== 'pp' || first?.kind === 'pp'));
  if (!first) return Boolean(prev.elems.findLast((e) => e.kind === 'adv')) && prev.elems.at(-1).kind === 'adv';
  if (!stood || first.kind === 'pron') return false;
  const kind = (e) => (['own', 'name'].includes(e.kind) ? 'name' : e.kind === 'np' && LANGUAGE.test(e.head) ? 'language' : e.kind);
  if (kind(first) !== kind(stood) && !(['name', 'place'].includes(kind(first)) && ['name', 'place'].includes(kind(stood)) && first.kind === 'own')) return false;
  if (first.kind === 'time' && timeKind(first) !== timeKind(stood)) return false;
  // „gut und blau“: a colour and a state are no list.
  const colour = (e) => (e.words || [e.word]).some((w) => COLOURS.has(w));
  return first.kind !== 'adj' || colour(first) === colour(stood);
}
/** What „und“ joins is of one kind: „Hunger und Durst“, never „Hunger und Marokko“, „Tee und sieben“, „Ihnen und Montag“. */
function listOfOne(e) {
  const items = e.items || e.np?.items || [];
  const kinds = new Set(items.map((x) => (DAYS.includes(x.head) ? 'day' : ['own', 'name'].includes(x.kind) ? 'name' : x.kind)));
  if (kinds.size < 2) return true;
  if (['num', 'day', 'language', 'phone'].some((k) => kinds.has(k))) return false;
  return !kinds.has('place') || [...kinds].every((k) => k === 'place' || k === 'name');
}
/** One time and one more of it: „am Samstag und Sonntag“, never „um sechs und Montag“. */
const timeKind = (e) => (e.h !== undefined ? 'clock' : e.day ? 'day' : e.date ? 'date' : e.month ? 'month' : e.part ? 'part' : 'word');
/** „Ich möchte einen bitte, Kaffee.“: an article without its noun, and the noun behind a comma. */
const strandedArticle = (prev, c) => !prev.frag && prev.acc && isPron(prev.acc) && OWNING.has(prev.acc.head) && c.elems.some((e) => e.kind === 'np' && e.bare);
/** „Ja, gern“, never „gern, ja“; „danke schön“, never „nein schön“; nothing stands before a „ja“ or „nein“ but thanks and an address. */
function courtesyInOrder(list, c, i) {
  if (!c.around) return true;
  const prev = list[i - 1];
  if (/^(?:ja|nein)$/u.test(c.around) && prev) {
    if (prev.frag || (prev.around && /^(?:gern|gerne|bitte|sehr gern|sehr gerne)$/u.test(prev.around))) return false;
  }
  return !(c.around === 'schön' && prev && !(prev.around && /(?:danke|bitte)$/u.test(prev.around)));
}

/** „Weißt du, wo …“: the verb stands last only behind a clause that asks or tells; „Deine Eltern, woher sie kommen?“ is no question. */
function asksBefore(prev) {
  if (!prev || prev.frag) return false;
  return prev.imperative || !['was', 'woher', 'welch'].includes(prev.wh?.word) || ASKS.has(prev.lemma);
}

function clauseInOrder(c) {
  const all = c.elems || [];
  if (!all.every(listOfOne)) return false;
  const mid = c.sub || c.imperative ? all : all.slice(c.before || 0);
  const subj = c.subj;
  const at = subj ? mid.indexOf(subj) : -1;
  if (!c.sub && at > 0) {
    const ahead = mid.slice(0, at);
    // A pronoun subject stands right behind the verb; a pointing one lets a small word or another pronoun go first („Was ist denn das?“).
    if (isPron(subj) && PERSONAL.has(subj.head) && ahead.length) return false;
    if (isPron(subj) && !PERSONAL.has(subj.head) && !ahead.every((e) => (e.kind === 'adv' && PARTICLE.has(e.word)) || (isPron(e) && OBJECT_PRONOUN.has(e.head)))) return false;
    if (!isPron(subj) && ahead.some((e) => isNp(e) || e.kind === 'adj')) return false;
  }
  for (let k = 0; k < mid.length; k += 1) {
    const e = mid[k];
    // An object pronoun stands before everything but the subject: „passt mir gut“, never „passt gut mir“.
    if (!c.sub && isPron(e) && e !== subj && (OBJECT_PRONOUN.has(e.head) || (PERSONAL.has(e.head) && e.head !== 'ich' && e.head !== 'du'))
      && mid.slice(0, k).some((x) => x !== subj && !isPron(x))) return false;
    if (!pairInOrder(e, mid[k + 1], c)) return false;
  }
  for (let k = 0; k + 1 < all.length; k += 1) if (k < (c.before || 0) && !pairInOrder(all[k], all[k + 1], c, k + 1 === c.before)) return false;
  // „dein Vater und Mutter“: what „und“ adds keeps its own article.
  for (const e of all) if ((e.items || []).some((x) => isPron(x) && (POINTING.has(x.head) || OWNING.has(x.head))) && e.items.some((x) => x.kind === 'np')) return false;
  for (const e of all) if ((e.items || []).some((x) => x.kind === 'np' && x.bare && (!x.bareOk || NEEDS_ARTICLE.has(x.head)) && !KIN_NAME.has(x.head)) && e.items.some((x) => x.kind === 'np' && !x.bare)) return false;
  // Thanks and „bitte“ for an answer stand apart; a day or a clock is said once.
  if (all.some((e, k) => e.kind === 'adv' && e.word === 'danke' && k < all.length - 1)) return false;
  const days = all.filter((e) => e.kind === 'time' && e.day).map((e) => e.day);
  if (new Set(days).size !== days.length) return false;
  // „Bruder bin ich frei“, „müde bin ich frei“: one thing is said of somebody at a time; „sieben bin ich frei“ lacks its „um“.
  const state = all.filter((e) => e.kind === 'adj' || (e.kind === 'adv' && e.word === 'frei')).length;
  if (c.lemma === 'sein' && (state > 1 || (state && c.pred && c.pred !== subj && !c.wh && c.pred.det !== 'num' && ['np', 'name', 'own', 'num'].includes(c.pred.kind)))) return false;
  if (c.lemma === 'sein' && c.subj?.head !== 'es' && all.some((e) => e.bareClock)) return false;
  // „noch nicht alt“, „nicht so gut“: what makes an adjective less stands in this order.
  if (all.some((e) => e.kind === 'adj' && degreeOutOfOrder(e.degree || []))) return false;
  // „Es ist die halb neun“: a clock time has no article.
  if (c.lemma === 'sein' && subj?.head === 'es' && all.some((e) => e !== subj && isPron(e) && POINTING.has(e.head))) return false;
  // „Er ist meine Mutter“: the pronoun has the gender of the person it names.
  if (c.lemma === 'sein' && subj && isPron(subj) && ['er', 'sie'].includes(subj.head) && c.pred?.kind === 'np' && !c.pred.job && KINSHIP.test(c.pred.head) && !personFits(subj, c)) return false;
  // A question with its verb second opens with its subject („Du tanzt gern?“), never with a small word („Gern tanzt du?“).
  if (c.question && !c.wh && !c.imperative && (c.before || 0) > 0 && all[0] !== subj) return false;
  // „keinen Kuchen“, never „nicht Kuchen“, „Kuchen nicht“, „nicht einen Kuchen“.
  if (all.some((e, k) => e.kind === 'adv' && e.word === 'nicht' && ((all[k + 1]?.kind === 'np' && (all[k + 1].bare || all[k + 1].det === 'ein') && !all[k + 1].list) || (all[k - 1]?.kind === 'np' && all[k - 1].bare && all[k - 1] !== subj && all[k - 1].stuff)))) return false;
  // „Ich bin kein Hunger“, „ich bin nicht Wein“: one has it, or wants it.
  if (c.lemma === 'sein' && ['ich', 'wir', 'du'].includes(subj?.head) && c.pred?.kind === 'np' && !c.pred.job && (c.pred.stuff || ['hunger', 'durst'].includes(c.pred.head)) && !NAMED.test(c.pred.head)) return false;
  // „viel alt“, „zu viel alt“: „viel“ makes a comparison („viel älter“).
  if (all.some((e) => e.kind === 'adj' && (e.degree || []).includes('viel') && !(e.words || [e.word]).some((w) => /er$/u.test(w)))) return false;
  if (all.some((e, k) => e.kind === 'adv' && e.word === 'sehr' && ['hunger', 'durst'].includes(all[k + 1]?.head))) return false;
  // A pointing word that is no object stands at the verb: „Wo ist der?“, never „Er ist hier der“.
  if (mid.some((e, k) => k > 0 && isPron(e) && POINTING.has(e.head) && e !== c.acc && e !== subj && !c.sub) || (c.lemma === 'sein' && at < 0 && mid.some((e, k) => k > 0 && isPron(e) && POINTING.has(e.head)))) return false;
  // Two adjectives of one clause stand with „und“: „hungrig und durstig“.
  const states = all.filter((e) => e.kind === 'adj');
  if (states.length > 1 && COPULA.has(c.lemma)) return false;
  // An adjective tells how one does something only where it can: „Ich habe müde gearbeitet“ is not judged.
  if (!COPULA.has(c.lemma) && states.some((e) => !(e.words || [e.word]).every((w) => HOW.has(w)))) return false;
  // Behind „ob“, „wie“, „weil“ the subject comes first: „ob du gern schwimmst“.
  if (c.sub && subj && isPron(subj) && PERSONAL.has(subj.head) && all.filter((e, k) => !e.wh && !(k === 0 && c.sub === 'wie' && (e.kind === 'adv' || e.kind === 'adj'))).indexOf(subj) > 0) return false;
  if (c.sub && subj && !isPron(subj) && all.slice(0, all.indexOf(subj)).some((e) => !e.wh && isNp(e))) return false;
  // „meine“, „einen“ without the noun they belong to, and „für meine“, „mit dem“.
  if (all.some((e) => isPron(e) && strayOwner(e, c))) return false;
  if (!c.wh && all.some((e) => e.kind === 'pp' && e.np?.kind === 'pron' && (POINTING.has(e.np.head) || OWNING.has(e.np.head)))) return false;
  // „für Arbeit“: a word that keeps its article keeps it behind a preposition too.
  if (all.some((e) => e.kind === 'pp' && e.np?.kind === 'np' && e.np.bare && !e.np.list && NEEDS_ARTICLE.has(e.np.head) && ['für', 'mit', 'nach', 'von', 'bei', 'seit', 'in', 'an', 'auf'].includes(e.prep))) return false;
  // „Ich freue auf …“, „Wo befindet mein Büro?“
  if (REFLEXIVE_ONLY.has(c.lemma) && !c.refl && !(c.lemma === 'freuen' && c.acc && isPron(c.acc))) return false;
  // „Das ist sehr.“, „sie ist erst“: something has to be said of the subject.
  if (c.lemma === 'sein' && !c.pred && !states.length && !c.wh && !c.perfect && all.every((e) => e === subj || (e.kind === 'adv' && SAYS_NOTHING.has(e.word)))) return false;
  if (c.lemma === 'machen' && !c.acc && !c.wh && !c.passive && !all.some((e) => e !== subj && (['np', 'num', 'list', 'time'].includes(e.kind) || (e.kind === 'adv' && ['viel', 'wenig', 'nichts', 'alles', 'mehr', 'genug'].includes(e.word))))) return false;
  if (['können', 'müssen', 'dürfen', 'sollen'].includes(c.lemma) && c.acc && isPron(c.acc) && c.acc.head !== 'das' && c.acc.head !== 'es' && !c.acc.wh) return false;
  // Nobody „has“ or „gets“ something to somebody: „Gibt es Ihnen Suppe?“
  if (c.dat && ((c.lemma === 'geben' && c.subj?.head === 'es') || ['bekommen', 'kriegen', 'haben'].includes(c.lemma))) return false;
  if (c.lemma === 'sein' && c.dat && states.some((e) => (e.words || [e.word]).some((w) => ['erhältlich', 'verfügbar'].includes(w)))) return false;
  if (all.some((e) => e.kind === 'np' && e.bare && e.of)) return false;
  // „Ist die der Zug?“: what points and what it is called have one gender.
  if (c.lemma === 'sein' && subj && isPron(subj) && ['der', 'die'].includes(subj.head) && c.pred?.kind === 'np' && (c.pred.bare ? !c.pred.job && !c.pred.list : true) && !(c.pred.det && (c.pred.combos || []).some((x) => x.c === 'n' && (x.g === subj.head || (subj.head === 'die' && x.g === 'pl'))))) return false;
  // A pointing dative without its noun („Sie ist jung der“).
  if (all.some((e) => isPron(e) && POINTING.has(e.head) && e === c.dat)) return false;
  // „am Freitag zehn Uhr“: a clock time inside a sentence takes „um“.
  if (!['passen', 'gehen', 'sein', 'klappen'].includes(c.lemma) && all.some((e) => e.kind === 'time' && (e.parts || []).some((p) => p.clock && !p.prep && !p.range))) return false;
  if (c.lemma === 'haben' && all.at(-1)?.word === 'dann' && all.at(-2)?.kind === 'np') return false;
  // „auch“ stands before what it adds: „Haben Sie auch Tee?“
  const last = all.at(-1);
  const before = all.at(-2);
  if (last?.kind === 'adv' && last.word === 'erst' && before && ['num', 'time'].includes(before.kind)) return false;
  if (last?.kind === 'adv' && last.word === 'da' && c.lemma === 'haben' && before?.head === 'zeit') return false;
  if (last?.kind === 'adv' && ['noch', 'vielleicht'].includes(last.word) && before && before !== subj && before.kind === 'np') return false;
  if (last?.kind === 'adv' && last.word === 'auch' && before && before !== subj && (isNp(before) || (before.kind === 'adv' && ['gern', 'gerne', 'gut'].includes(before.word)))) return false;
  return true;
}

const KINSHIP = /^(?:mutter|vater|mama|papa|mutti|vati|oma|opa|bruder|schwester|sohn|tochter|mann|frau|tante|onkel|cousin|cousine|neffe|nichte|eltern|geschwister|brüder|schwestern|großmutter|großvater|grossmutter|grossvater)$/u;
function personFits(subj, c) {
  const one = c.reading?.persons?.includes('er');
  const genders = new Set((c.pred.combos || []).filter((x) => x.c === 'n').map((x) => x.g));
  if (!genders.size) return true;
  if (subj.head === 'er') return genders.has('der');
  return one ? genders.has('die') : genders.has('pl') || Boolean(c.pred.list || c.pred.heads?.length > 1);
}
const degreeOutOfOrder = (d) => d.some((w, k) => (w === 'nicht' && ['so', 'sehr', 'ganz', 'zu', 'ziemlich', 'mehr'].includes(d[k - 1])) || (w === 'noch' && ['nicht', 'sehr', 'so', 'ganz'].includes(d[k - 1])));
/** A possessive or „einen“ that stands for nothing said: „Ich habe meine besucht“; „Das ist meine“, „Ich nehme einen“, „ich möchte keinen“ are German. */
function strayOwner(e, c) {
  if (!OWNING.has(e.head) || e.wh) return false;
  if (/^(?:ein|mein|dein|kein)$/u.test(e.head)) return true;
  if (e.head.startsWith('kein')) return e === c.subj;
  if (e === c.pred) return false;
  if (e.head.startsWith('ein')) return !(e === c.acc && ['nehmen', 'möchten', 'brauchen', 'kaufen', 'trinken', 'haben', 'essen', 'bestellen'].includes(c.lemma) && !c.perfect);
  return !(c.lemma === 'sein' && !c.elems.some((x) => x !== e && x.kind === 'np') && e === c.subj) && !c.wh;
}
/** Two neighbours: no article behind its noun, no measure behind it, nothing behind an adjective that belongs before it. */
function pairInOrder(e, next, c, acrossVerb = false) {
  if (!next || acrossVerb) return true;
  if (e.kind === 'np' && isPron(next) && OWNING.has(next.head)) return false;
  if (e.kind === 'np' && e.bare && !e.list && isPron(next) && POINTING.has(next.head)) return false;
  if (isNp(e) && e.kind !== 'name' && next.kind === 'adv' && COUNT_WORDS.has(next.word)) return false;
  // „die Abfahrt Omar“: a name stands behind a person only.
  if (e.kind === 'np' && (next.kind === 'own' || (next.kind === 'name' && !next.title)) && !NAMED.test(e.head)) return false;
  if (e.kind === 'np' && ['hunger', 'durst', 'lust', 'zeit'].includes(e.head) && next.kind === 'adv' && HOW_MUCH.has(next.word)) return false;
  if (e.kind === 'adv' && ['gern', 'gerne'].includes(e.word) && next.kind === 'adv' && next.word === 'nicht') return false;
  if (e.kind === 'adv' && e.word === 'mehr' && ((next.kind === 'adv' && next.word === 'nicht') || next.head === 'nichts')) return false;
  // „aus Sharma Indien“
  if (e.kind === 'pp' && ['place', 'own'].includes(e.np?.kind) && next.kind === 'place') return false;
  const state = e.kind === 'adj' || (e.kind === 'adv' && ['gut', 'schlecht', 'besser', 'prima', 'super', 'schön', 'toll'].includes(e.word) && (['gehen', 'sein'].includes(c?.lemma) || c?.frag));
  if (state && next.kind === 'adv' && BEFORE_ADJECTIVE.has(next.word)) return false;
  if (state && isPron(next)) return false;
  return true;
}

function fragmentInOrder(c, isFare) {
  const all = c.elems || [];
  // „nicht Suppe“: „keine Suppe“.
  if (all.some((e, k) => e.kind === 'adv' && e.word === 'nicht' && all[k + 1]?.kind === 'np' && (all[k + 1].bare || all[k + 1].det === 'ein'))) return false;
  if (!all.every(listOfOne)) return false;
  if (all.some((e) => e.kind === 'adj' && degreeOutOfOrder(e.degree || []))) return false;
  if (all.some((e) => (e.items || []).some((x) => isPron(x) && (POINTING.has(x.head) || OWNING.has(x.head))) && e.items.some((x) => x.kind === 'np'))) return false;
  for (let k = 0; k + 1 < all.length; k += 1) if (!pairInOrder(all[k], all[k + 1], c)) return false;
  // „Sagen mal“, „danken“: a request and thanks have their own form.
  if (all.some((e) => (e.infinitive && SAID_ALONE.has(e.head)) || (e.kind === 'inf' && SAID_ALONE.has(e.verb)))) return false;
  // „Mein Stift weg“, „Die Lampe schön“, „das meine Schwester“, „Ein Brot Käse“, „Sie bitte“, „ich gern“: a verb or a preposition is missing.
  if (all.some((e, k) => k > 0 && all[k - 1].kind === 'np' && !all[k - 1].bare && (e.kind === 'adj' || (e.kind === 'adv' && ['weg', 'gut', 'schön', 'toll', 'super', 'prima'].includes(e.word))))) return false;
  if (all.length > 1 && isPron(all[0]) && POINTING.has(all[0].head) && all.slice(1).some((e) => e.kind === 'np')) return false;
  if (all.some((e, k) => k > 0 && e.kind === 'np' && e.bare && !e.list && all[k - 1].kind === 'np' && !MEASURES.test(all[k - 1].head))) return false;
  if (all.length > 1 && isPron(all[0]) && PERSONAL.has(all[0].head) && all.slice(1).some((e) => e.kind === 'adv' && !['auch', 'nicht', 'leider', 'leider nicht', 'noch nicht', 'selbst', 'denn', 'so', 'lieber'].includes(e.word))) return false;
  // „sehr, Danke gut.“: thanks stand apart.
  if (all.length > 1 && all.some((e, k) => e.kind === 'adv' && e.word === 'danke' && k < all.length - 1)) return false;
  // „Gut der.“: a pointing word opens its words or stands alone.
  if (all.some((e, k) => k > 0 && isPron(e) && (POINTING.has(e.head) || OWNING.has(e.head)))) return false;
  if (all.filter((e) => e.kind === 'adj').length > 1) return false;
  // „Und Stuhl? Was kostet er?“: a thing that can be counted keeps its article.
  return !all.some((e) => e.kind === 'np' && e.bare && !e.list && !e.unknown?.length && !e.job && !GREETS.has(e.head) && !isFare(e.head) && (!e.bareOk || NEEDS_ARTICLE.has(e.head) || KIN.has(e.head)));
}
