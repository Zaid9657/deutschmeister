import { optionOrder } from './optionOrder.js';

const upper = (s) => /^\p{Lu}+$/u.test(s);
const letters = (s) => /^\p{L}+$/u.test(s);
const capFirst = (s) => s.charAt(0).toLocaleUpperCase('de') + s.slice(1);

/**
 * A stress mark capitalises letters, which hides a word's real spelling. The course's own capitalised
 * words give it back: the nouns of the Wortfeld (entries with an article, singular and plural), its
 * one-word entries written with a capital („Hallo“), and the people who speak. So a marked word is
 * never shown as „zug“ or „ana“, and a verb or an adjective never as „Möchte“ or „Teuer“.
 */
export function nounsOf(lektionen) {
  const nouns = new Set();
  const add = (source) => {
    for (const token of String(source || '').split(/[^\p{L}]+/u)) if (/^\p{Lu}\p{Ll}/u.test(token)) nouns.add(token);
  };
  for (const lektion of lektionen || []) {
    for (const entry of lektion.wortfeld || []) {
      if (entry.article) { add(entry.word); add(entry.plural); } else if (!/\s/.test(String(entry.word || '').trim())) add(entry.word);
    }
    for (const line of lektion.dialog?.lines || []) add(line.speaker);
  }
  return nouns;
}
const spell = (word, nouns) => {
  const noun = capFirst(word.toLocaleLowerCase('de'));
  return nouns.has(noun) ? noun : word.toLocaleLowerCase('de');
};
/** Only the marked word (all capitals, or split into syllables) lost its spelling; every other word keeps the author's. */
const unmark = (words, nouns) => words.map((w) => (upper(w) || w.includes('-') ? spell(w.replace(/-/g, ''), nouns) : w));

/** The shared sound grammar: an unknown or ambiguous marking fails closed. */
export function classifySound(marked) {
  if (typeof marked !== 'string' || !marked.trim()) return null;
  const pair = marked.split(' – ');
  if (pair.length === 2 && pair.every(letters) && pair[0] !== pair[1]) return { kind: 'pair', words: pair };
  const question = marked.match(/^([\p{L} ]+)\?(↗|↘)?$/u);
  if (question) {
    const words = question[1].split(' ');
    const stresses = words.filter(upper);
    if (words.length < 2 || !words.every(letters) || stresses.length !== 1) return null;
    return { kind: question[2] ? 'melody' : 'sentence-stress', words, stress: stresses[0], direction: question[2] };
  }
  const words = marked.split(' ');
  const target = words.at(-1);
  const prefix = words.slice(0, -1);
  if (!prefix.every(letters)) return null;
  if (target.includes('-')) {
    const syllables = target.split('-');
    if (!syllables.every(letters) || syllables.filter(upper).length !== 1 || prefix.some(upper)) return null;
    return { kind: prefix.length ? 'prefixed-stress' : 'word-stress', prefix, syllables, stress: syllables.findIndex(upper) };
  }
  if (!words.every(letters)) return null;
  if (upper(target) && !prefix.some(upper)) return { kind: 'sound-word', words };
  if (words.length > 1 && !words.some(upper)) return { kind: 'phrase', words };
  return null;
}

const plain = (marked, nouns) => unmark(marked.replace(/[↗↘]/g, '').split(' '), nouns).join(' ');
const startsBig = (s) => /^\p{Lu}/u.test(s);
/** A marked line closes its own sentence when it ends in ? or !; no second end mark after it (2026-11-23 screen walk: „Wie SPÄT ist es?.“). */
const closed = (marked) => (/[.!?][↗↘]?$/u.test(marked) ? marked : `${marked}.`);

/**
 * No lesson-specific keys. SPELLING NEVER GIVES THE ANSWER AWAY (browser walk 2026-11-25): a listening
 * option is a correctly spelled German word or line, and a stress option is the whole line in its real
 * spelling with one syllable (or one word) in capitals. Listening distractors are the Lektion's own
 * sound strings; when the answer would be the only one written small (or with a capital), a Wortfeld
 * word written the same way joins them.
 */
export function buildSoundItems(lektion, nouns = nounsOf([lektion])) {
  const originals = lektion.phonetik.items;
  return originals.map((marked, index) => {
    const shape = classifySound(marked);
    if (!shape) throw new Error(`Unsupported guided sound item: ${marked}`);
    const item = { id: `sound-${lektion.id}-${index + 1}`, type: 'multiple_choice', soundKind: shape.kind, feedbackKey: 'sound', marked };
    if (['word-stress', 'prefixed-stress'].includes(shape.kind)) {
      const { prefix, syllables, stress } = shape;
      item.caseSensitive = true;
      const word = spell(syllables.join(''), nouns);
      const spelled = syllables.map((s, i) => word.slice(syllables.slice(0, i).join('').length).slice(0, s.length));
      item.text = [...prefix, word].join(' ');
      item.options = syllables.map((_, position) => [...prefix, spelled.map((s, i) => (i === position ? s.toLocaleUpperCase('de') : s)).join('-')].join(' '));
      item.answer = item.options[stress];
      item.promptDe = 'Welche Silbe ist in der Vorlage großgeschrieben? Wählen Sie die passende Betonung.';
      item.promptEn = 'Which syllable is capitalized in the model? Choose the matching stress.';
      item.modelDe = `Die Großbuchstaben zeigen die betonte Silbe: ${closed(marked)}`;
      item.modelEn = `The capitals show the stressed syllable: ${closed(marked)}`;
    } else if (shape.kind === 'sentence-stress') {
      item.caseSensitive = true;
      const spelled = unmark(shape.words, nouns).map((w, i) => (i === 0 ? capFirst(w) : w));
      item.text = `${spelled.join(' ')}?`;
      item.options = spelled.map((_, position) => `${spelled.map((w, i) => (i === position ? w.toLocaleUpperCase('de') : w)).join(' ')}?`);
      item.answer = item.options[shape.words.indexOf(shape.stress)];
      item.promptDe = 'Welches Wort ist in der Vorlage betont? Beachten Sie die Großbuchstaben.';
      item.promptEn = 'Which word is stressed in the model? Look at the capitals.';
      item.modelDe = `Die Großbuchstaben zeigen das betonte Wort: ${closed(marked)} Die Computerstimme kann anders betonen.`;
      item.modelEn = `The capitals show the stressed word: ${closed(marked)} The computer voice may stress it differently.`;
    } else if (shape.kind === 'melody') {
      item.text = `${capFirst(unmark(shape.words, nouns).join(' '))}?`;
      item.options = ['↗', '↘'];
      item.answer = shape.direction;
      item.promptDe = 'Wie verläuft die Stimme am Ende laut Vorlage? Wählen Sie den Pfeil.';
      item.promptEn = 'According to the model, what does the voice do at the end? Choose the arrow.';
      const rising = shape.direction === '↗';
      item.modelDe = `Der Pfeil ${shape.direction} zeigt: Die Stimme geht am Ende ${rising ? 'nach oben' : 'nach unten'}. Vorlage: ${closed(marked)} Die Computerstimme folgt dem Pfeil nicht immer.`;
      item.modelEn = `The arrow ${shape.direction} shows that the voice ${rising ? 'rises' : 'falls'} at the end. Model: ${closed(marked)} The computer voice may not follow the arrow.`;
    } else {
      const candidates = [...new Set(originals.flatMap((s) => classifySound(s)?.kind === 'pair' ? classifySound(s).words : [plain(s, nouns)]))];
      item.text = shape.kind === 'pair' ? shape.words[index % shape.words.length] : plain(marked, nouns);
      item.answer = item.text;
      const sameStyle = (s) => startsBig(s) === startsBig(item.answer);
      const extra = candidates.filter(sameStyle).length > 1 ? []
        : (lektion.wortfeld || []).map((w) => w.word || '').filter((w) => letters(w) && sameStyle(w) && !candidates.includes(w)).slice(0, 1);
      item.options = optionOrder([...candidates, ...extra], item.id);
      item.promptDe = 'Was hören Sie? Wählen Sie die gehörte Zeile. Ohne Ton: Lesen Sie die Vorlage.';
      item.promptEn = 'What do you hear? Choose the line you heard. Without audio, read the model.';
      // Every sound item shows its model, the marked line, like the stress and melody kinds above (2026-11-23
      // screen walk: L7, L9 and L12 offered „read the model“ with no model on screen).
      item.modelDe = `Vorlage: ${closed(marked)} Hören Sie die Zeile. Wenn kein Ton möglich ist, öffnen Sie stattdessen den Text.`;
      item.modelEn = `Model: ${closed(marked)} Listen to the line. If audio is unavailable, open the text instead.`;
      // The reason after an answer names the sound that is practised; it never repeats the instruction.
      const { focus, focusEn } = lektion.phonetik;
      if (focus) item.explanationDe = `Hier üben Sie: ${closed(focus)}`;
      if (focusEn) item.explanationEn = `You are practising: ${closed(focusEn)}`;
    }
    return { ...item, accepted: [item.answer], explanationDe: item.explanationDe || item.modelDe, explanationEn: item.explanationEn || item.modelEn };
  });
}
