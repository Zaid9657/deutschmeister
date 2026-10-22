// Requested person, not a verb-ending guess: „Seid“ is ihr; „Wartet“ can also be a statement.
export function imperativePerson(item) {
  const q = String(item.questionDe || item.promptDe || '');
  const cue = q.match(/\((?:[^()]*,\s*)?(du|ihr|Sie)\)/)?.[1]
    || q.match(/\b(du|ihr|Sie)-Imperativ\b/)?.[1]
    || q.match(/Imperativ\s+für\s+(du|ihr|Sie)\b/)?.[1]
    || q.match(/\[[^\]]*\b(du|ihr|Sie)\b[^\]]*\]/)?.[1]
    || q.match(/[„"'](Du|Ihr|Sie)\s/)?.[1];
  return cue === 'Du' ? 'du' : cue === 'Ihr' ? 'ihr' : cue || null;
}

/** Open imperative sentence/gap answers, with and without an emphatic listener pronoun. */
export function imperativePronounVariants(item) {
  const person = imperativePerson(item);
  if (person !== 'du' && person !== 'ihr') return [];
  const q = String(item.questionDe || item.promptDe || '');
  if (/ohne (?:das )?(?:Pronomen|du\b|ihr\b)|nur (?:das )?Verb|ein Wort/i.test(q)) return [];
  const gap = item.type === 'fill_blank';
  if (gap) {
    // Do not put a second pronoun into the gap when it is already printed after it.
    if (/___\s+(?:du|ihr|Sie|wir)\b/.test(q)) return [];
    if (!/(?:^|[.!?]\s+|,\s+)___\s+[^!?.]*!/.test(q) && !(/Imperativ/i.test(q) && /___/.test(q))) return [];
  } else if (!['sentence_building', 'error_correction'].includes(item.type)
      || !(/Imperativ|\bBitte\b|\bbitten\b/i.test(q)
        || (item.topic === 'imperative' && /!$/.test(String(item.answer).trim()) && !/\bFrage\b/i.test(q)))) return [];
  const forms = [item.answer, ...(item.accepted || [])].map((a) => String(a).trim());
  const verbOf = (text) => text.replace(/^[Bb]itte\s+/, '').match(/^[A-Za-zÄÖÜäöüß]+/)?.[0]?.toLowerCase();
  const keyVerb = verbOf(String(item.answer).trim());
  const out = new Set();
  for (const form of forms) {
    const m = form.match(/^((?:[Bb]itte\s+)?)([A-Za-zÄÖÜäöüß]+)(.*)$/);
    if (!m || (gap && !new RegExp(`^(?: ${person})?$`).test(m[3]))) continue;
    const verb = m[2].toLowerCase();
    if (person === 'du' ? verb.replace(/e$/, '') !== keyVerb?.replace(/e$/, '') : verb !== keyVerb) continue;
    const present = m[3].match(/^\s+(du|ihr|Sie|wir)\b/);
    if (present && present[1] !== person) continue;
    const rest = present ? m[3].slice(present[0].length) : m[3];
    for (const text of [`${m[1]}${m[2]}${rest}`, `${m[1]}${m[2]} ${person}${rest}`]) {
      out.add(text);
      if (!gap) out.add(text.replace(/[.!]$/, ''));
    }
  }
  return [...out].filter((form) => !forms.includes(form));
}
