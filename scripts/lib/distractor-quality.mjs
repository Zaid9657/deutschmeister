const wordCount = (text) => String(text).match(/[\p{L}\p{N}]+/gu)?.length || 0;

/** RULE 38 (authoring advisory): length is a cue, not proof of an invalid question.
 * Flag a uniquely longest key >= 3 words and >= 50% longer than the next option,
 * or >= 3 meaningful clauses against single-clause alternatives with >= 3 extra words.
 * Equal-length alternatives and ties for longest are not length-only keys.
 */
export function distractorCue(item) {
  if (!item?.options?.includes(item.answer)) return null;
  const correct = wordCount(item.answer);
  const others = item.options.filter((o) => o !== item.answer);
  const next = Math.max(...others.map(wordCount));
  if (!others.length || correct <= next) return null;
  if (correct - next >= 3 && correct >= next * 1.5) return 'longest-by-margin';
  const clauses = (text) => String(text).split(/[,;:]|\b(?:and|but|then|while)\b/iu).filter((s) => wordCount(s) >= 2).length;
  if (correct - next >= 3 && clauses(item.answer) >= 3 && others.every((o) => clauses(o) <= 1)) return 'unequal-detail';
  return null;
}

export function distractorFindings(curriculum) {
  return (curriculum.lektionen || []).filter((l) => l.flow === 'guided').flatMap((l) => [
    ...(l.guided.chunks || []).map((c, i) => ({ ...c.meaning, where: `scene ${i + 1}` })),
    ...(l.guided.read?.questions || []).map((q, i) => ({ ...q, where: `read ${i + 1}` })),
  ].flatMap((q) => {
    const reason = distractorCue(q);
    return reason ? [{ nr: l.nr, where: q.where, reason, lengths: q.options.map(wordCount) }] : [];
  }));
}
