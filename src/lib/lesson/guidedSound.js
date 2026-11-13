const upper = (s) => /^\p{Lu}+$/u.test(s);
const letters = (s) => /^\p{L}+$/u.test(s);
const sentence = (s) => s.charAt(0).toLocaleUpperCase('de') + s.slice(1).toLocaleLowerCase('de');

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

const unmarked = (marked) => marked.replace(/-/g, '').replace(/[↗↘]/g, '').toLocaleLowerCase('de');

/** No lesson-specific keys; only real item strings supply listening distractors. */
export function buildSoundItems(lektion) {
  const originals = lektion.phonetik.items;
  return originals.map((marked, index) => {
    const shape = classifySound(marked);
    if (!shape) throw new Error(`Unsupported guided sound item: ${marked}`);
    const item = { id: `sound-${lektion.id}-${index + 1}`, type: 'multiple_choice', soundKind: shape.kind, feedbackKey: 'sound', marked };
    if (['word-stress', 'prefixed-stress'].includes(shape.kind)) {
      const { prefix, syllables, stress } = shape;
      item.caseSensitive = true;
      item.text = [...prefix, prefix.length ? syllables.join('').toLocaleLowerCase('de') : sentence(syllables.join(''))].join(' ');
      item.options = syllables.map((_, position) => [...prefix, syllables.map((s, i) => i === position ? s.toLocaleUpperCase('de') : s.toLocaleLowerCase('de')).join('-')].join(' '));
      item.answer = item.options[stress];
      item.promptDe = 'Welche Silbe ist in der Vorlage großgeschrieben? Wählen Sie die passende Betonung.';
      item.promptEn = 'Which syllable is capitalized in the model? Choose the matching stress.';
      item.modelDe = `Die Großbuchstaben zeigen die betonte Silbe: ${marked}.`;
      item.modelEn = `The capitals show the stressed syllable: ${marked}.`;
    } else if (shape.kind === 'sentence-stress') {
      item.text = sentence(unmarked(marked));
      item.options = [...new Set(shape.words.map((w) => w.toLocaleLowerCase('de')))];
      item.answer = shape.stress.toLocaleLowerCase('de');
      item.promptDe = 'Welches Wort ist in der Vorlage betont? Beachten Sie die Großbuchstaben.';
      item.promptEn = 'Which word is stressed in the model? Look at the capitals.';
      item.modelDe = `Die Großbuchstaben zeigen das betonte Wort: ${marked}. Die Computerstimme kann anders betonen.`;
      item.modelEn = `The capitals show the stressed word: ${marked}. The computer voice may stress it differently.`;
    } else if (shape.kind === 'melody') {
      item.text = sentence(unmarked(marked));
      item.options = ['↗', '↘'];
      item.answer = shape.direction;
      item.promptDe = 'Wie verläuft die Stimme am Ende laut Vorlage? Wählen Sie den Pfeil.';
      item.promptEn = 'According to the model, what does the voice do at the end? Choose the arrow.';
      const rising = shape.direction === '↗';
      item.modelDe = `Der Pfeil ${shape.direction} zeigt: Die Stimme geht am Ende ${rising ? 'nach oben' : 'nach unten'}. Vorlage: ${marked}. Die Computerstimme folgt dem Pfeil nicht immer.`;
      item.modelEn = `The arrow ${shape.direction} shows that the voice ${rising ? 'rises' : 'falls'} at the end. Model: ${marked}. The computer voice may not follow the arrow.`;
    } else {
      const candidates = [...new Set(originals.flatMap((s) => classifySound(s)?.kind === 'pair' ? classifySound(s).words : [unmarked(s)]))];
      item.text = shape.kind === 'pair' ? shape.words[index % shape.words.length] : unmarked(marked);
      item.answer = item.text;
      item.options = candidates;
      item.promptDe = 'Was hören Sie? Wählen Sie die gehörte Zeile. Ohne Ton: Lesen Sie die Vorlage.';
      item.promptEn = 'What do you hear? Choose the line you heard. Without audio, read the model.';
      item.modelDe = 'Hören Sie die Zeile. Wenn kein Ton möglich ist, öffnen Sie stattdessen den Text.';
      item.modelEn = 'Listen to the line. If audio is unavailable, open the text instead.';
    }
    return { ...item, accepted: [item.answer], explanationDe: item.modelDe, explanationEn: item.modelEn };
  });
}
