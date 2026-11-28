// German inside Arabic (the "Explain in Arabic" notice, NoticeStage.jsx). Each German run is shown
// left to right in its own isolate, so its brackets, „?" and word order stay where they belong.
//
// A run starts on a Latin letter, a digit or an opening bracket and ends on a letter, a digit, an
// IPA length mark, a closing bracket or „?". Inside it may hold spaces and the punctuation German
// examples carry: „3.5.1998", „er/sie/es", „Staatsangehörigkeit: marokkanisch", „der Bruder → er".
// Lektion 1's notice has none of these; Lektion 2's and 3's would have shown „er/sie/es" as
// „es/sie/er" and „Ich bin am 3.5.1998 geboren" with its three pieces in reverse order (2026-11-19).
// A run never ends on „." or „,": a full stop after German closes the Arabic sentence and stays
// in the Arabic flow. A bracket opens a run only when German follows it: „(وُلدتُ في…)" is Arabic
// in brackets, and a lone „(" isolated left to right would face the wrong way.
// „…" may stand inside a run as a gap („Wo ist …?", Lektion 5), „|" inside a separable verb
// („ein|kaufen", Lektion 11), and a hyphen right before a letter opens one: „-t" (Lektion 7), „-e:
// meine Mama" (Lektion 12). Outside a run those marks took the Arabic direction: „kaufen|ein", „t-".
const LATIN_RUN = /(?:-?[A-Za-zÄÖÜäöüß0-9]|[[(](?=[A-Za-zÄÖÜäöüß0-9ː]))(?:[A-Za-zÄÖÜäöüß0-9ː[\]()\s?.,:/→–…|-]*[A-Za-zÄÖÜäöüß0-9ː\])?])?/g;

/** The places of the brackets in a run that have no partner inside it. */
function loneBrackets(run) {
  const open = [];
  const lone = [];
  [...run].forEach((ch, i) => {
    if ('[('.includes(ch)) open.push(i);
    else if ('])'.includes(ch)) { if (open.length) open.pop(); else lone.push(i); }
  });
  return [...lone, ...open];
}

/**
 * The German runs of an Arabic text with their places, in order. A bracket whose partner stands outside
 * the run belongs to the Arabic around it („unser Fest (حفلتنا، wir)": the closing bracket is Arabic),
 * so the run is cut there; inside the run it would face the wrong way.
 */
export function latinMatches(text) {
  const out = [];
  for (const m of String(text || '').matchAll(LATIN_RUN)) {
    const cuts = [-1, ...loneBrackets(m[0]).sort((a, b) => a - b), m[0].length];
    for (let k = 0; k + 1 < cuts.length; k += 1) {
      const piece = m[0].slice(cuts[k] + 1, cuts[k + 1]);
      if (piece.trim()) out.push({ index: m.index + cuts[k] + 1 + piece.search(/\S/), run: piece.trim() });
    }
  }
  return out;
}

/** The German runs of an Arabic text, in order. */
export const latinRuns = (text) => latinMatches(text).map((m) => m.run);
