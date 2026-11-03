// Explicit German meaning selectors only. Tense, contrast, adverbs and a present/past reference
// point NEVER choose the requested meaning. The lexical validator separately checks selectors at
// the item's teaching horizon. Spatial von/nach/etc. are outside the temporal contrast.
export function undecidedTimePrepositionGaps(items) {
  const cues = {
    ab: /\b(?:Beginn|Anfang|der erste Tag|erste Uhrzeit)\b/iu,
    von: /\b(?:Beginn|Anfang|erste Uhrzeit)\b/iu,
    bis: /\b(?:Ende|Schluss|der letzte Tag|letzte Uhrzeit)\b/iu,
    seit: /\bDauer bis (?:heute|jetzt|damals)\b/iu,
    vor: /\bZeitpunkt\b(?!\s+in der Zukunft)|\bZeit: [^;()!?]*früher, keine Dauer\b/iu,
    um: /\b(?:genaue Uhrzeit|genauer Zeitpunkt)\b/iu,
    gegen: /\b(?:ungefähre Uhrzeit|ungefährer Zeitpunkt)\b/iu,
    nach: /\b(?:nach diesem Zeitpunkt|späterer Zeitpunkt)\b/iu,
    in: /\b(?:Zeitpunkt in der Zukunft|Zeit ab heute)\b/iu,
  };
  return items.filter((it) => it.minLektion != null && (it.type === 'fill_blank' || /_{2,}/u.test(it.questionDe || ''))).flatMap((it) => {
    const accepted = new Set((it.accepted?.length ? it.accepted : [it.answer]).map((a) => String(a).trim().toLowerCase()));
    const q = it.questionDe || it.promptDe || '';
    const tail = q.slice(q.indexOf('___') + 3);
    // Only parenthetical labels attached to this gap's sentence are selectors.
    // A different sentence, a negation, or a cue about another event is not one.
    const attached = (tail.match(/^[^.!?()]*(?:[.!?]\s*)?((?:\([^)]*\)\s*)+)/u)?.[1] || '');
    const labels = [...attached.matchAll(/\(([^)]*)\)/gu)].map((m) => m[1].split(';')[0].trim());
    const allowed = /^(?:Beginn|Anfang|der erste Tag|erste Uhrzeit|erste Uhrzeit zum Einsteigen|Ende|Schluss|der letzte Tag|letzte Uhrzeit|Dauer bis (?:heute|jetzt|damals)|Zeitpunkt|Zeit: [^;()!?]*früher, keine Dauer|genaue Uhrzeit|genauer Zeitpunkt|ungefähre Uhrzeit|ungefährer Zeitpunkt|nach diesem Zeitpunkt|späterer Zeitpunkt|Zeitpunkt in der Zukunft|Zeit ab heute)$/iu;
    const selector = labels.filter((label) => allowed.test(label)
      && !/\b(?:nicht|kein(?:e[rmns]?)?|ohne)\b/iu.test(label.replace(/, keine Dauer$/u, ''))
      && (!/zum Einsteigen/iu.test(label) || /\beinsteigen\b/iu.test(tail.split(/[.!?()]/u)[0]))).join(' ; ');
    const temporal = /\b(?:Uhr|Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag|Tag|Tagen|Woche|Wochen|Monat|Monaten|Jahr|Jahren|heute|morgen|gestern)\b/iu.test(q);
    const pairs = [['ab', 'bis'], ['seit', 'vor'], ['um', 'gegen'], ['von', 'bis'], ['vor', 'nach'], ['vor', 'in']];
    const offeredPairs = pairs.filter((pair) => pair.every((p) => new RegExp(`\\b${p}\\b`, 'iu').test(q)));
    const defaults = { ab: ['ab', 'bis'], bis: ['ab', 'bis'], vor: ['seit', 'vor'], seit: ['seit', 'vor'],
      um: ['um', 'gegen'], gegen: ['um', 'gegen'], von: ['von', 'bis'], nach: ['vor', 'nach'], in: ['vor', 'in'] };
    const relevant = offeredPairs.length ? offeredPairs : [...new Set([...accepted].map((p) => defaults[p]).filter(Boolean))];
    return relevant.flatMap((pair) => {
      // ab/bis and vor/seit are the course's standard temporal contrasts; other families require
      // time language or both alternatives explicitly printed, so spatial „von der Arbeit" is safe.
      const offered = pair.every((p) => new RegExp(`\\b${p}\\b`, 'iu').test(q));
      if (!temporal && !offered && !['ab', 'seit'].includes(pair[0])) return [];
      const only = pair.filter((p) => accepted.has(p));
      if (only.length !== 1) return [];
      const chosen = only[0];
      const other = pair.find((p) => p !== chosen);
      return cues[chosen].test(selector) && !cues[other].test(selector)
        ? [] : [`${it.id}: only „${chosen}“ accepted without a deciding German cue`];
    });
  });
}

