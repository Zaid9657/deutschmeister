// The one reader of "who said stop", for every mailer that picks its own
// audience instead of reading the lifecycle_customer_state view.
//
// Opt-out lives in profiles.email_daily_sentence = false: unsubscribe.mjs
// writes it, and the lifecycle views expose it as `email_opted_out`.
//
// What this replaces (measured 2026-09-28, Supabase edge logs + Resend API log):
// daily-sentence.mjs and send-campaign.mjs asked profiles for the flag of EVERY
// confirmed account at once, `.in('id', <all ids>)`. That puts every id into the
// request URL: at 1,149 accounts (~45 KB) the API answers 400. Both mailers
// read that error as "nobody opted out" and mailed everyone. The daily read
// answered 400 on every run checked from 2026-08-30 to 09-28, and the 09-28
// batch went to all 1,149 confirmed accounts (11 x 100 + 49), including the 61
// who had unsubscribed. No error surfaced, because the fallback was the
// designed path for "the column may not exist yet" (it has existed for months).
//
// The shape that cannot grow with the list: read the opted-out rows themselves
// (61 on 09-28), a page at a time, and THROW on any error, so the caller sends
// nothing rather than mailing someone who said stop. tests/email-opt-out.test.mjs
// holds every mailer to this reader.

export const OPT_OUT_PAGE_SIZE = 1000;

/**
 * Ids of every account that opted out of email. Throws on any read error:
 * a mailer that cannot tell who said stop must not send.
 */
export async function fetchOptedOutIds(client, { pageSize = OPT_OUT_PAGE_SIZE } = {}) {
  if (!client) throw new Error('opt-out read: no database client');
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new Error(`opt-out read: bad page size ${pageSize}`);
  const ids = new Set();
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from('profiles')
      .select('id')
      .eq('email_daily_sentence', false)
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`opt-out read failed: ${error.message || error}`);
    if (!Array.isArray(data)) throw new Error('opt-out read returned no rows');
    for (const row of data) ids.add(row.id);
    if (data.length < pageSize) return ids;
  }
}

/** `people` minus every entry whose `id` is in `optedOut`. Returns a new array. */
export function withoutOptedOut(people, optedOut) {
  return people.filter((p) => !optedOut.has(p.id));
}
