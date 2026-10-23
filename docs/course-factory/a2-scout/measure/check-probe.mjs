// How does the real answer checker score A2 contrasts? (A2 scout, 2026-10-17). READ-ONLY.
// Usage: node check-probe.mjs <path-to-src/lib/lesson/check.js>
// Each probe: what the learner typed, the key, the topic (STRICT_TOPIC reads it), and what a DaF
// teacher would call it. checkAnswer is called the way PracticeItem does for a typed item.
import { pathToFileURL } from 'node:url';

const { checkAnswer, STRICT_TOPIC, strictApplies } = await import(pathToFileURL(process.argv[2]).href);

const probes = [
  // Konjunktiv II vs Präteritum: the umlaut IS the grammar (konjunktiv-ii-polite, A2.2)
  ['hatte', 'hätte', 'konjunktiv-ii-polite', 'grammar'],
  ['konnte', 'könnte', 'konjunktiv-ii-polite', 'grammar'],
  ['wurde', 'würde', 'konjunktiv-ii-polite', 'grammar'],
  ['Ich hatte gern einen Kaffee.', 'Ich hätte gern einen Kaffee.', 'konjunktiv-ii-polite', 'grammar'],
  ['Konnten Sie mir helfen?', 'Könnten Sie mir helfen?', 'konjunktiv-ii-polite', 'grammar'],
  // comparative umlaut (comparative, A2.2)
  ['alter', 'älter', 'comparative', 'grammar'],
  ['Mein Bruder ist alter als ich.', 'Mein Bruder ist älter als ich.', 'comparative', 'grammar'],
  // adjective ending (adjective-endings-intro, A2.1)
  ['den neuem Tisch', 'den neuen Tisch', 'adjective-endings-intro', 'grammar'],
  ['Ich kaufe einen neue Tisch.', 'Ich kaufe einen neuen Tisch.', 'adjective-endings-intro', 'grammar'],
  // dative article in a sentence (two-way-prepositions, A2.1)
  ['Das Buch liegt auf den Tisch.', 'Das Buch liegt auf dem Tisch.', 'two-way-prepositions', 'grammar'],
  // separable Perfekt (separable-verbs, A2.1)
  ['Ich habe eingekaufen.', 'Ich habe eingekauft.', 'separable-verbs', 'grammar'],
  // verb-final in a subordinate clause, order only (subordinate-word-order, A2.2)
  ['Ich bleibe zu Hause, weil ich bin krank.', 'Ich bleibe zu Hause, weil ich krank bin.', 'subordinate-word-order', 'grammar'],
  // reflexive pronoun (reflexive-verbs, A2.2)
  ['Ich freue dich auf das Wochenende.', 'Ich freue mich auf das Wochenende.', 'reflexive-verbs', 'grammar'],
  // a real slip, for contrast
  ['Ich hätte gern einen Kafee.', 'Ich hätte gern einen Kaffee.', 'konjunktiv-ii-polite', 'slip'],
];

for (const [given, key, topic, teacher] of probes) {
  const strict = STRICT_TOPIC.test(topic) && strictApplies(key);
  const { result } = checkAnswer(given, [key], { strict });
  const flag = teacher === 'grammar' && result !== 'wrong' ? '  <-- forgiven' : '';
  console.log(`${result.padEnd(7)} ${teacher.padEnd(7)} [${topic}] "${given}" for "${key}"${flag}`);
}

// Dictation: digits for a number the learner HEARD are the same answer (check.js folds 0–100).
const dictation = [
  ['Die Wohnung kostet 20 Euro.', 'Die Wohnung kostet zwanzig Euro.'],
  ['Die Wohnung kostet 850 Euro.', 'Die Wohnung kostet achthundertfünfzig Euro.'],
  ['Ich bin 1990 geboren.', 'Ich bin neunzehnhundertneunzig geboren.'],
  ['Wir ziehen am 3. Mai um.', 'Wir ziehen am dritten Mai um.'],
];
for (const [given, key] of dictation) {
  const { result } = checkAnswer(given, [key], { dictation: true });
  console.log(`${result.padEnd(7)} dictation "${given}" for "${key}"${result === 'wrong' ? '  <-- digits refused' : ''}`);
}
