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
export const LATIN_RUN = /(?:[A-Za-zÄÖÜäöüß0-9]|[[(](?=[A-Za-zÄÖÜäöüß0-9ː]))(?:[A-Za-zÄÖÜäöüß0-9ː[\]()\s?.,:/→–-]*[A-Za-zÄÖÜäöüß0-9ː\])?])?/g;

/** The German runs of an Arabic text, in order. */
export const latinRuns = (text) => [...String(text || '').matchAll(LATIN_RUN)].map((m) => m[0]);
