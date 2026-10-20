// Sentence X-Ray — the unattended link render (measured 2026-10-09).
//
// The 2026-09-27 crawler gate (xraySource.mjs) refuses a self-declared crawler,
// and the SPA does not auto-run for one (src/lib/xray.js). On 2026-10-09 from
// 01:00 UTC a renderer that declares neither walked the grammar-example links
// to /analyze/?s=… again: 17 of the 18 anonymous analyses that night were
// verbatim grammar_examples, each with a fresh anonymous id, a fresh IP hash,
// a browser user agent, no referrer and no attribution on the browser. Each
// render was a paid model call, and the per-IP ceiling does not bind an
// address that changes every call.
//
// A person who follows one of those links arrives FROM our grammar page, so
// the SPA reports the referrer as 'site:/grammar' (5 of 5 such analyses in the
// 11 days before). And 0 of the 21 anonymous no-referrer link analyses in those
// 11 days were one of our own grammar examples (they were the daily e-mail
// sentence or a shared sentence). So the rule is narrow: an anonymous request
// that came from a link, with no referrer and no attribution on the browser,
// for a sentence we published on a grammar page, is asked for a press of
// Analyze instead of being run. The press sends entry 'typed', which this rule
// never matches, so a person still gets their analysis with one click.

/**
 * The SPA-reported source (already run through cleanSource) of a link render
 * that shows no sign of a person: entry 'link', referrer 'none', and no first
 * or last attribution touch on the browser. A missing source (an old bundle)
 * or a missing referrer label is never matched.
 */
export function isUnattendedLinkSource(source) {
  return Boolean(source)
    && source.entry === 'link'
    && source.ref === 'none'
    && !source.first
    && !source.last;
}

/**
 * True when `sentence` is one of our own grammar examples, the sentences the
 * /analyze/?s=… links on the grammar pages carry. Fails open: without a client,
 * or when the lookup errors, it answers false, so a database problem never
 * costs a person their analysis.
 */
export async function isPublishedGrammarExample(client, sentence) {
  if (!client || typeof sentence !== 'string' || !sentence.trim()) return false;
  try {
    const { count, error } = await client
      .from('grammar_examples')
      .select('id', { count: 'exact', head: true })
      .eq('sentence_de', sentence.trim());
    if (error) {
      console.error('grammar_examples lookup failed:', error.message);
      return false;
    }
    return (count ?? 0) > 0;
  } catch (e) {
    console.error('grammar_examples lookup failed:', e.message);
    return false;
  }
}

/** What the function answers instead of running an unattended render. */
export const UNATTENDED_RESPONSE = Object.freeze({
  statusCode: 403,
  body: Object.freeze({ error: 'Press Analyze to X-Ray this sentence.', code: 'unattended' }),
});
