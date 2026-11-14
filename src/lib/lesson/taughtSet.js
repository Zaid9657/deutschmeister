/** One hear/see/say board per small group, then checked retrieval. */
export const SET_GROUP_SIZE = 5;
export function spellWithSet(word, alphabet) {
  return spellingMembers(word, alphabet).map((m) => m.audio).join('. ');
}
export function setGroups(set) {
  const groups = [];
  const size = Math.ceil((set.members || []).length / Math.ceil((set.members || []).length / SET_GROUP_SIZE)) || SET_GROUP_SIZE;
  for (let i = 0; !set.ruleOnly && i < (set.members || []).length; i += size) {
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
    steps.push({ kind: 'board', members: group.members, group: groupIndex, rule: group.rule });
    const target = group.transfer || [group.members[0], group.members.at(-1)];
    for (const [i, member] of target.entries()) {
      const choice = i === 0;
      const spelling = !choice && group.spelling;
      const answer = spelling || member.written;
      steps.push({ kind: 'check', group: groupIndex, item: {
        id: `set-${set.id}-${groupIndex}-${i}`, type: choice ? 'multiple_choice' : 'fill_blank',
        promptDe: set.kind === 'letters' ? (spelling ? 'Schreiben Sie das buchstabierte Wort oder den Namen.' : 'Welchen Buchstaben hören Sie? Wählen Sie.') : set.kind === 'clock' ? (choice ? 'Welche Uhrzeit hören Sie? Wählen Sie.' : 'Welche Uhrzeit hören Sie? Schreiben Sie die Uhrzeit (z. B. 08:00).') : (choice ? 'Welche Zahl hören Sie? Wählen Sie.' : 'Schreiben Sie die Zahl, die Sie hören, in Ziffern.'),
        promptEn: set.kind === 'letters' ? (spelling ? 'Write the spelled word or name.' : 'Which letter do you hear? Choose.') : set.kind === 'clock' ? (choice ? 'What time do you hear? Choose.' : 'What time do you hear? Write the time (e.g. 08:00).') : (choice ? 'Which number do you hear? Choose.' : 'Write the number you hear in digits.'),
        answer, accepted: [answer], audioDisplayText: spelling ? spellingMembers(spelling, set).map((m) => m.said).join('. ') : member.said, audioText: spelling ? spellWithSet(spelling, set) : member.audio || member.said,
        ...(choice ? { options: [...new Set((group.transfer ? group.transfer : group.members).map((m) => m.written))].reverse() } : {}),
      } });
    }
  }
  if (set.ownName) steps.push({ kind: 'own-name', group: setGroups(set).length });
  return { nr: 1, key: `set:${set.id}`, kind: 'taught-set', part: set.placement === 'part2' ? 2 : 1, set, steps };
}

/** Display names and voice aids are separate: the board and notice use only said. */
export function spellingMembers(word, alphabet) {
  return [...String(word || '').normalize('NFC')].filter((c) => /\p{L}/u.test(c)).map((c) => {
    const member = alphabet.members.find((m) => m.written.toLocaleLowerCase('de') === c.toLocaleLowerCase('de'));
    return { written: c, said: member?.said || c, audio: member?.audio || member?.said || c, supported: !!member };
  });
}

// Seconds for short board retrieval (one letter/digit/time, or a short spelled word).
// A board has one playback and one group utterance: per-member speech + shared controls.
// These are modeled first-pass durations, not a measured promise or a timer.
export const SET_SECONDS = { board: [4, 6], member: [1, 2], check: [6, 10], ownName: [20, 40] };
export const SET_STAGE_MAX_SECONDS = 6 * 60;
export function setStageEstimate(stage) {
  const counts = { boards: 0, members: 0, checks: 0, ownNames: 0 };
  for (const step of stage.steps) {
    if (step.kind === 'board') { counts.boards++; counts.members += step.members.length; }
    if (step.kind === 'check') counts.checks++;
    if (step.kind === 'own-name') counts.ownNames++;
  }
  const seconds = (side) => counts.boards * SET_SECONDS.board[side] + counts.members * SET_SECONDS.member[side] + counts.checks * SET_SECONDS.check[side] + counts.ownNames * SET_SECONDS.ownName[side];
  return { ...counts, lo: seconds(0), hi: seconds(1) };
}

/** Inspect task content, not lesson ids: letter/number help follows the question everywhere. */
export function referenceKinds(item, sets) {
  const text = [item?.de, item?.text, item?.questionDe, item?.promptDe, item?.promptEn, item?.topic, item?.answer, item?.audioText, ...(item?.accepted || []), ...(item?.options || []), ...(item?.pairs || []).map((p) => p.de), ...(item?.words || [])].filter((s) => typeof s === 'string').join(' ');
  const kinds = [];
  if (item?.listenSpelling || ['surname', 'first'].includes(item?.ownName) || /buchstab|spell|alphabet|\p{L}(?:-\p{L}){2,}/iu.test(text)) kinds.push('letters');
  const words = text.toLocaleLowerCase('de').match(/\p{L}+/gu) || [];
  if (/\d|zahl|number|preis|price|telefon|phone|uhr|clock/iu.test(text) || words.some((w) => sets.filter((s) => s.kind === 'numbers').some((s) => s.members.some((m) => m.said === w))) || words.some((w) => /und(?:zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)$/u.test(w))) kinds.push('numbers');
  if (/uhr|\d{1,2}:\d{2}/iu.test(text)) kinds.push('clock');
  return kinds;
}
