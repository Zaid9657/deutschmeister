/** The same German → English pairing used by derived matching and card retrieval. */
export function meaningChoice(pair, pairs, id) {
  return {
    id, type: 'multiple_choice',
    promptDe: `Was bedeutet „${pair.de}“? Wählen Sie die Bedeutung.`,
    promptEn: `What does “${pair.de}” mean? Choose the meaning.`,
    options: [...new Set(pairs.map((p) => p.en))], answer: pair.en, accepted: [pair.en],
    explanationDe: `Das Wortpaar ist: ${pair.de} – ${pair.en}.`,
    explanationEn: `The word pair is: ${pair.de} – ${pair.en}.`,
  };
}

/** A heard German model among German alternatives; callers own the seeded draw. */
export function listeningChoice(correct, options, id) {
  return { id, type: 'listen_select', lineIndex: correct.index,
    options: options.map((o) => o.de), answer: correct.de, accepted: [correct.de] };
}
