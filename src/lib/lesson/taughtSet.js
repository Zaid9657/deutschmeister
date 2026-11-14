/** Five brief hear/see/say turns, then checked retrieval. No scores or user text are stored here. */
export const SET_GROUP_SIZE = 5;
export function spellWithSet(word, alphabet) {
  return [...String(word).normalize('NFC')].filter((c) => /\p{L}/u.test(c)).map((c) => alphabet.members.find((m) => m.written.toLocaleLowerCase('de') === c.toLocaleLowerCase('de'))?.said || c).join('. ');
}
export function setGroups(set) {
  const groups = [];
  const size = Math.ceil((set.members || []).length / Math.ceil((set.members || []).length / SET_GROUP_SIZE)) || SET_GROUP_SIZE;
  for (let i = 0; i < (set.members || []).length; i += size) {
    groups.push({ members: set.members.slice(i, i + size), spelling: set.spellings?.[groups.length] });
  }
  for (const pair of set.contrasts || []) groups.push({ members: pair.map((written) => set.members.find((m) => m.written === written)), contrast: true });
  if (set.rule?.examples?.length) groups.push({ members: set.rule.examples, rule: set.rule, transfer: set.rule.transfer });
  if (set.rule && !set.rule.examples) groups[0].rule = set.rule;
  return groups;
}
export function buildSetStage(set) {
  const steps = [];
  for (const [groupIndex, group] of setGroups(set).entries()) {
    for (const member of group.members) steps.push({ kind: 'member', member, group: groupIndex, rule: group.rule });
    const target = group.transfer || [group.members[0], group.members.at(-1)];
    for (const [i, member] of target.entries()) {
      const choice = i === 0;
      const spelling = !choice && group.spelling;
      const answer = spelling || member.written;
      steps.push({ kind: 'check', group: groupIndex, item: {
        id: `set-${set.id}-${groupIndex}-${i}`, type: choice ? 'multiple_choice' : 'fill_blank',
        promptDe: set.kind === 'letters' ? (spelling ? 'Schreiben Sie das buchstabierte Wort oder den Namen.' : 'Welchen Buchstaben hören Sie? Wählen Sie.') : set.kind === 'clock' ? (choice ? 'Welche Uhrzeit hören Sie? Wählen Sie.' : 'Welche Uhrzeit hören Sie? Schreiben Sie die Uhrzeit (z. B. 08:00).') : (choice ? 'Welche Zahl hören Sie? Wählen Sie.' : 'Schreiben Sie die Zahl, die Sie hören, in Ziffern.'),
        promptEn: set.kind === 'letters' ? (spelling ? 'Write the spelled word or name.' : 'Which letter do you hear? Choose.') : set.kind === 'clock' ? (choice ? 'What time do you hear? Choose.' : 'What time do you hear? Write the time (e.g. 08:00).') : (choice ? 'Which number do you hear? Choose.' : 'Write the number you hear in digits.'),
        answer, accepted: [answer], audioText: spelling ? spellWithSet(spelling, set) : member.said,
        ...(choice ? { options: [...new Set((group.transfer ? group.transfer : group.members).map((m) => m.written))].reverse() } : {}),
      } });
    }
  }
  return { nr: 1, key: `set:${set.id}`, kind: 'taught-set', part: 1, set, steps };
}
