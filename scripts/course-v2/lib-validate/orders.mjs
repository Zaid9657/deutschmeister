// Word orders of a sentence-building item (ITM-09; rule-smith 2026-09-27). The class „a grammatical
// order the tiles build is marked wrong" came back on six levels (reviews a1.1-u04 r1 F04/F12,
// a1.2-u04 r1 F12, a2.1-u04 r3 F01, a2.2-u04 r2 F03, b1.2-u04 r1 F10, b2.1-u04 r1 F04, b2.2-u04 r1
// F15), so BLUEPRINT §9.4 makes it a rail. quality.js `missingFrontedOrder` (the live A1.1 rule) reads
// only Angaben after the verb; this module works on the TILES of any level:
//
//   Vorfeld  — in a V2 declarative every frontable tile may open the sentence, the finite verb stays
//              second, the subject follows it, everything else keeps its order (b1.2 F10: „finite verb
//              second, non-finite form or particle last"). Frontable: a prepositional phrase, a
//              time/place or sentence adverb, a time phrase, an object noun phrase, and the
//              predicative after a copula; NOT a lone pronoun (mich, es, einen …), a particle
//              (nicht, auch, ja …), or the clause-final non-finite form or separable particle.
//              An inverted answer („Heute ist das Wasser billig.") also owes its subject-first order.
//   Mittelfeld — an object pronoun (welche, einen, es …) next to a local/temporal adverbial may stand
//              on either side of it (a2.1 r3 F01: „Wir haben welche zu Hause." / „… zu Hause welche."),
//              and so may a sentence adverb next to a full noun-phrase subject (b2.1 F04).
//
// Out of scope, said so: sentences with a comma, a coordinator (und, aber …) or a subordinator tile
// (their clause orders need a parser), questions (ITM-09 checks the prompt names the question instead),
// and items whose subject cannot be read off the tiles. The prompt may fix the first tile („Beginnen
// Sie mit …") and then owes no Vorfeld orders.

import { AUX_MODAL_FORMS } from './text.mjs';

const lc = (s) => String(s ?? '').toLowerCase();
const words = (s) => String(s ?? '').trim().split(/\s+/).filter(Boolean);
const bare = (w) => lc(w).replace(/[.,!?;:„“”"»«]/g, '');

const PREPOSITIONS = new Set('an am ans auf aufs aus bei beim bis durch für gegen gegenüber hinter in im ins mit nach neben ohne seit über um unter von vom vor zu zum zur zwischen trotz wegen während statt außer laut dank innerhalb außerhalb'.split(' '));
const PLACE_TIME_ADVERBS = new Set('heute morgen gestern vorgestern übermorgen jetzt dann danach hier dort da bald später früher abends morgens mittags nachmittags vormittags nachts montags dienstags mittwochs donnerstags freitags samstags sonntags zuerst zuletzt oben unten draußen drinnen links rechts geradeaus zurzeit sofort gleich'.split(' '));
export const SENTENCE_ADVERBS = new Set('leider vielleicht natürlich trotzdem deshalb deswegen darum wahrscheinlich bestimmt sicher hoffentlich eigentlich außerdem allerdings jedoch sonst also dennoch folglich glücklicherweise offensichtlich rechtzeitig'.split(' '));
const TIME_DETERMINERS = new Set('jeden jede jedes nächsten nächste nächstes letzten letzte letztes diesen diese dieses'.split(' '));
const DETERMINERS = new Set('der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner mein meine meinen meinem meiner dein deine deinen deinem sein seine seinen seinem ihr ihre ihren ihrem unser unsere unseren unserem euer eure euren eurem dieser diese dieses diesen diesem viele viel wenige einige alle zwei drei vier fünf sechs sieben acht neun zehn'.split(' '));
const NOMINATIVE_PRONOUNS = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'man']);
export const OBJECT_PRONOUNS = new Set(['welche', 'einen', 'eins', 'eine', 'keinen', 'keine', 'es', 'ihn', 'sie']);
const LONE_PRONOUNS = new Set('mich dich sich uns euch mir dir ihm ihn ihnen es einen eins eine einer keinen keine keins welche welcher'.split(' '));
const PARTICLES = new Set('nicht nie ja doch mal denn halt eben wohl auch noch schon nur sehr gern gerne zu so ganz etwa erst'.split(' '));
const CLAUSE_WORDS = new Set('und oder aber sondern denn weil dass wenn obwohl ob als damit bevor nachdem während sofern falls wo wer was wie warum wann seit seitdem bis sodass indem'.split(' '));
const COPULAS = new Set('bin bist ist sind seid war warst waren wart wird wirst werden werdet wurde wurden bleibt bleiben bleibe blieb heißt heiße heißen'.split(' '));
const SEPARABLE_PARTICLES = new Set('ab an auf aus bei ein fest fort her hin los mit nach vor vorbei weg weiter zu zurück zusammen teil statt kennen'.split(' '));
const NOT_VERB = new Set([...PLACE_TIME_ADVERBS, ...SENTENCE_ADVERBS, ...PARTICLES, 'gut', 'oft', 'immer', 'manchmal', 'selten', 'viel', 'wenig', 'mehr', 'sehr', 'schnell', 'langsam', 'lange', 'gerne', 'teuer', 'billig', 'kalt', 'warm']);
const FINITE_SHAPE = /^[a-zäöüß]{2,}(?:e|st|t|en|et|n)$/;
const CONSONANT_FINITE = new Set('kam ging gab fand sah nahm las schrieb sprach stand lag saß fuhr fiel hielt ließ lief rief trug trank aß traf bekam verstand begann blieb stieg zog flog weiß mag tat'.split(' '));

/** Is a one-word tile a finite verb (the V2 slot)? */
function isFinite(tile) {
  const ws = words(tile);
  if (ws.length !== 1) return false;
  const w = bare(ws[0]);
  if (/^\p{Lu}/u.test(ws[0])) return false;
  if (AUX_MODAL_FORMS.has(w) || CONSONANT_FINITE.has(w)) return true;
  if (NOT_VERB.has(w) || PREPOSITIONS.has(w) || DETERMINERS.has(w)) return false;
  return FINITE_SHAPE.test(w);
}

/** The answer as a sequence of tiles (each tile used once), or null when the tiles do not spell it. */
export function tileSequence(tiles, sentence) {
  const target = words(sentence).map(bare).filter(Boolean);
  const pieces = tiles.map((t, i) => ({ i, ws: words(t).map(bare).filter(Boolean) }));
  const used = new Array(tiles.length).fill(false);
  const out = [];
  const go = (pos) => {
    if (pos === target.length) return out.length === tiles.length;
    for (const p of pieces) {
      if (used[p.i] || !p.ws.length) continue;
      if (!p.ws.every((w, k) => target[pos + k] === w)) continue;
      used[p.i] = true;
      out.push(p.i);
      if (go(pos + p.ws.length)) return true;
      used[p.i] = false;
      out.pop();
    }
    return false;
  };
  return go(0) ? out.map((i) => tiles[i]) : null;
}

/** The kind of a tile for ordering: pp · adverb · sentence-adverb · time · np · pronoun · particle · verbal · other. */
function tileKind(tile, { last, copula }) {
  const ws = words(tile).map(bare);
  const first = ws[0] || '';
  if (ws.length === 1 && LONE_PRONOUNS.has(first)) return 'pronoun';
  if (ws.length === 1 && PARTICLES.has(first)) return 'particle';
  if (PREPOSITIONS.has(first) && ws.length >= 2) return 'pp';
  if (ws.length === 1 && SENTENCE_ADVERBS.has(first)) return 'sentence-adverb';
  if (ws.length === 2 && first === 'zum' && ws[1] === 'glück') return 'sentence-adverb';
  if (ws.length === 1 && PLACE_TIME_ADVERBS.has(first)) return 'adverb';
  if (TIME_DETERMINERS.has(first) && ws.length >= 2) return 'time';
  if (last && !copula && ws.length <= 2 && /^[a-zäöüß]/.test(words(tile)[0] || '')) return 'verbal';
  if (last && ws.length === 1 && SEPARABLE_PARTICLES.has(first)) return 'verbal';
  if (first === 'zu' && ws.length === 2) return 'verbal';
  if (last && copula && ws.length === 1 && /^[a-zäöüß]/.test(words(tile)[0] || '')) return 'predicative';
  if (DETERMINERS.has(first) || /^\p{Lu}/u.test(words(tile)[0] || '') || /^\d/.test(first)) return 'np';
  return 'other';
}

const FRONTABLE = new Set(['pp', 'adverb', 'sentence-adverb', 'time', 'np', 'predicative']);

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** A tile moved out of the first position loses a sentence-initial capital (not „Sie", names, nouns). */
function uncap(tile) {
  const ws = words(tile);
  const w0 = ws[0] || '';
  if (/^(?:Ich|Du|Er|Es|Wir|Ihr|Man|Der|Die|Das|Den|Dem|Ein|Eine|Einen|Einem|Kein|Keine|Mein|Meine|Unser|Unsere|Dieser|Diese|Dieses|Jeden|Jede|Heute|Morgen|Gestern|Dann|Jetzt|Hier|Dort|Leider|Vielleicht|Trotzdem|Deshalb|Am|Im|Um|In|Mit|Nach|Von|Vom|Zum|Zur|Auf|Bei|Beim|Für)$/.test(w0)) {
    ws[0] = w0.charAt(0).toLowerCase() + w0.slice(1);
  }
  return ws.join(' ');
}

/** Normalised form for comparing sentences: lower case, punctuation and quotes out. */
export const flatOrder = (s) => lc(s).replace(/[.,!?;:„“”"»«]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * The orders an item owes but does not accept: [{ order, why }]. `item` is the authored Item.
 * Returns [] for the shapes this module leaves alone (see the header).
 */
export function missingOrders(item) {
  const tiles = Array.isArray(item?.tiles) ? item.tiles.map(String) : [];
  const answer = String(item?.answer || '').trim();
  if (tiles.length < 3 || !answer || /\?\s*$/.test(answer) || answer.includes(',')) return [];
  if (tiles.some((t) => words(t).some((w) => CLAUSE_WORDS.has(bare(w))))) return [];
  const end = (answer.match(/[.!]+$/) || ['.'])[0];
  const accepted = [answer, ...(Array.isArray(item.accepted) ? item.accepted : [])].map(String);
  const have = new Set(accepted.map(flatOrder));
  const seq = tileSequence(tiles, answer);
  if (!seq || !isFinite(seq[1])) return [];
  const verb = seq[1];
  const copula = COPULAS.has(bare(verb));
  const kinds = seq.map((t, i) => tileKind(t, { last: i === seq.length - 1, copula }));
  // the subject: a nominative pronoun tile, else the first tile of a subject-first answer, else the
  // noun phrase right after the verb of an inverted one
  let subj = seq.findIndex((t, i) => i !== 1 && words(t).length === 1 && NOMINATIVE_PRONOUNS.has(bare(t)) && (i === 0 || i === 2 || !['sie', 'es'].includes(bare(t))));
  if (subj < 0 && kinds[0] === 'np') subj = 0;
  if (subj < 0 && kinds[2] === 'np') subj = 2;
  if (subj < 0) return [];
  const promptFixesFirst = /Beginnen Sie mit|Fangen Sie mit|am Satzanfang|mit „[^“]+“ am Anfang/i.test(String(item.promptDe || ''));
  const out = [];
  const want = (parts, why) => {
    const s = `${cap(parts.filter(Boolean).join(' '))}${end}`;
    if (!have.has(flatOrder(s)) && !out.some((o) => flatOrder(o.order) === flatOrder(s))) out.push({ order: s, why });
  };
  const rest = (skip) => seq.filter((_, i) => !skip.includes(i)).map(uncap);
  if (!promptFixesFirst) {
    // subject-first order of an inverted answer
    if (subj !== 0) want([seq[subj], verb, uncap(seq[0]), ...rest([0, 1, subj])], 'the subject-first order');
    // each frontable tile in the Vorfeld
    seq.forEach((t, i) => {
      if (i === 1 || i === subj || i === 0 || !FRONTABLE.has(kinds[i])) return;
      const others = seq.map((x, k) => [x, k]).filter(([, k]) => ![1, i, subj].includes(k)).map(([x]) => uncap(x));
      want([t, verb, uncap(seq[subj]), ...others], `„${t}" in the Vorfeld`);
    });
  }
  // Mittelfeld swaps on every accepted order the tiles spell
  for (const form of accepted) {
    const s2 = tileSequence(tiles, form);
    if (!s2 || !isFinite(s2[1])) continue;
    const e2 = (form.match(/[.!]+$/) || [end])[0];
    const k2 = s2.map((t, i) => tileKind(t, { last: i === s2.length - 1, copula }));
    for (let i = 2; i + 1 < s2.length; i += 1) {
      const a = s2[i];
      const b = s2[i + 1];
      const pa = OBJECT_PRONOUNS.has(bare(a)) && words(a).length === 1;
      const pb = OBJECT_PRONOUNS.has(bare(b)) && words(b).length === 1;
      const adv = (k) => k === 'pp' || k === 'adverb' || k === 'time';
      const sa = k2[i] === 'sentence-adverb';
      const sb = k2[i + 1] === 'sentence-adverb';
      const npSubj = (t) => bare(t) !== bare(s2[0]) && words(t).length >= 2 && (DETERMINERS.has(bare(words(t)[0])) || /^\p{Lu}/u.test(words(t)[0]));
      const swap = (pa && adv(k2[i + 1])) || (pb && adv(k2[i]))
        || (sa && npSubj(b) && k2[i + 1] === 'np') || (sb && npSubj(a) && k2[i] === 'np');
      if (!swap) continue;
      const parts = [...s2];
      [parts[i], parts[i + 1]] = [parts[i + 1], parts[i]];
      const s = `${cap(parts.map((x, k) => (k === 0 ? x : uncap(x))).join(' '))}${e2}`;
      if (!have.has(flatOrder(s)) && !out.some((o) => flatOrder(o.order) === flatOrder(s))) out.push({ order: s, why: `the Mittelfeld order of „${a}" and „${b}"` });
    }
  }
  return out;
}
