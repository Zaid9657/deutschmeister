// A built sentence keeps its words and grammatical roles, not one stored order.
// Question tasks also allow optional particles and equivalent ways of asking
// about the fact in the answer line. Dictation and transformations stay exact.
import { reader } from './clause.js';
import { inOrder } from './clauseOrder.js';
import { CITIES, COUNTRIES, JOBS, LANGUAGES, NOUN_GENDERS, OWN_MASS_NOUNS } from './ownWords.js';
import { fold } from './germanForms.js';

const nouns = new Map();
for (const [g, words] of Object.entries(NOUN_GENDERS)) for (const w of words.split(/\s+/)) {
  const k = fold(w);
  nouns.set(k, [...new Set([...(nouns.get(k) || []), g])]);
}
const places = new Set([...CITIES, ...COUNTRIES].map(fold));
const jobs = new Set(JOBS.map(fold));
const languages = new Set(LANGUAGES.map(fold));
const mass = new Set(OWN_MASS_NOUNS.map(fold));
const plain = s => fold(s).replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/[.,!?;:„“"']/g, '').replace(/\s+/g, ' ').trim();
const particles = s => s.replace(/(?<!\p{L})(?:denn|mal|auch)(?!\p{L})\s*/giu, '');
const equivalent = s => s.replace(/(?<!\p{L})(?:Ist|ist)(\s+(?:der|die|das)\s+\p{Lu}\p{L}+)\s+(?:zu sp(?:ä|ae)t|verspätet)(?!\p{L})/gu, 'Hat$1 Verspätung');
const bag = s => plain(s).split(' ').sort().join(' ');
export const keepsOpening = (value, opening) => !opening || `${plain(value)} `.startsWith(`${plain(opening)} `);

/** Task information is derived from the authored prompt, never an item id. */
export function sentenceTask(item) {
  if (item?.type !== 'sentence_building') return null;
  const prompt = item.questionDe || item.promptDe || '';
  const instruction = prompt.replace(/„[^“]*“|\[[^\]]*\]/gu, ' ');
  if (/\b(?:Bitte|Imperativ|Aufforderung)\b/u.test(instruction)) return null;
  // A task that fixes an internal order is graded against its authored keys.
  if (/Reihenfolge|TeKaMoLo|steht vor(?!n)|steht am Satzende|;[^)]*\)/iu.test(prompt)) return null;
  const question = /Frage/u.test(prompt) && /\?$/.test(item.answer || '');
  if (!question && !/\[[^\]]+\/[^\]]+\]/u.test(prompt)) return null;
  return {
    opening: prompt.match(/Beginnen Sie mit „([^“]+)“/u)?.[1] || null,
    question,
    paraphrase: /Die Antwort ist:/u.test(prompt),
  };
}

export function sameSentenceTask(value, key, task) {
  const original = String(value).trim();
  if (original.length > 180 || !keepsOpening(original, task.opening)) return false;
  const optional = s => {
    const left = new Map(['denn', 'mal', 'auch'].map(w => [w, (plain(key).match(new RegExp('(?:^| )' + w + '(?= |$)', 'g')) || []).length]));
    return s.replace(/(?<!\p{L})(denn|mal|auch)(?!\p{L})\s*/giu, (word, particle) => {
      const p = particle.toLowerCase();
      if (!left.get(p)) return '';
      left.set(p, left.get(p) - 1); return word;
    });
  };
  const transform = s => task.paraphrase ? equivalent(s) : s;
  const given = transform(task.question ? optional(original) : original);
  const expected = transform(key);
  if (bag(given) !== bag(expected)) return false;
  // Only the key supplies any missing noun readings. Reordering cannot add
  // unknown vocabulary, change a case ending, or change the person of a verb.
  const local = new Map(nouns);
  const keyWords = expected.replace(/[.!?]+$/u, '').split(/\s+/);
  const bare = new Set(keyWords.filter((w, i) => i > 0 && /^\p{Lu}/u.test(w)
    && !/^(?:der|die|das|den|dem|des|ein|eine|einen|mein|meine|Frau|Herr)$/u.test(keyWords[i - 1])).map(fold));
  for (const w of bare) if (!local.has(w)) local.set(w, ['das']);
  for (const m of expected.matchAll(/(?<!\p{L})(der|die|das|den|dem|ein|eine|einen)\s+(\p{Lu}\p{L}+)/gu)) {
    if (!local.has(fold(m[2]))) local.set(fold(m[2]), m[1] === 'die' || m[1] === 'eine' ? ['die', 'pl'] : m[1] === 'das' ? ['das'] : ['der', 'das']);
  }
  const names = new Set([...expected.matchAll(/(?:Frau|Herr)\s+(\p{Lu}\p{L}+)/gu)].map(m => fold(m[1])));
  const ctx = {
    readings: w => local.get(fold(w)) || null,
    isName: w => names.has(fold(w)), isPlace: w => places.has(fold(w)),
    isLanguage: w => languages.has(fold(w)), isJob: w => jobs.has(fold(w)),
    isMass: w => mass.has(fold(w)) || bare.has(fold(w)), isFood: () => false, placeArticle: () => null,
  };
  const read = s => reader(s, ctx).read();
  const a = read(expected);
  const b = read(given);
  const full = s => s && s.length === 1 && s[0].clauses.length === 1 && !s[0].clauses[0].frag && inOrder(s, () => false);
  if (!full(a) || !full(b)) return false;
  const ac = a[0].clauses[0]; const bc = b[0].clauses[0];
  if (task.question && (!bc.question || Boolean(bc.wh) !== Boolean(ac.wh) || bc.before)) return false;
  if (!task.question && Boolean(ac.question) !== Boolean(bc.question)) return false;
  const roles = c => JSON.stringify([c.lemma, Boolean(c.imperative), c.subj?.head, c.acc?.head, c.dat?.head, c.pred?.head, c.wh?.word]);
  if (roles(ac) !== roles(bc)) return false;
  // Rewriting a meaning must never repair ungrammatical German on the way.
  // In particular, haben + zu spät and sein + Verspätung are not alternatives.
  if (!full(read(original))) return false;
  // A particle belongs inside the question, not in front of its finite verb
  // or behind the phrase it modifies. Validate that original placement too.
  if (task.question && original !== particles(original)) {
    const p = read(original);
    if (!full(p) || !p[0].clauses[0].question || p[0].clauses[0].before) return false;
  }
  const keyCaps = new Set(String(key).split(/\s+/).filter((w, i) => i > 0 && /^\p{Lu}/u.test(w)).map(plain));
  return {
    smallStart: /^\p{Ll}/u.test(original),
    smallWord: original.split(/\s+/).some(w => /^\p{Ll}/u.test(w) && keyCaps.has(plain(w))),
  };
}
