// UTM tags for a link from one of our own mails into the site.
//
// The scheme is docs/tracking-links.md, "Our own email": utm_source is always
// "email", utm_medium the mailer family, utm_campaign the mail, utm_content the
// link inside it. Mail clients strip the referrer or send their own host, so an
// untagged click reaches dm_attribution as untracked or as a webmail "source".
//
//   * Labels are fixed strings: lowercase a-z, 0-9, "." and "-", 60 characters
//     at most. Hyphens are a house convention, not a parser limit (both label
//     readers keep "_"; tests/daily-sentence-links.test.mjs pins that).
//   * Never a user id, address, token or date: a tag is copied into whoever
//     clicks, and for a forwarded mail that is someone else.
//   * The unsubscribe link is never built here. It is a function URL that
//     carries a signed token, not a page.
//
// daily-sentence.mjs builds its two links with its own DAILY_UTM constant
// (#176); the bytes are the same scheme.

export const EMAIL_LABEL = /^[a-z0-9.-]{1,60}$/;

/**
 * `href` (a site URL) with the four email tags set. Built with URL so the tags
 * land before a #fragment, an existing utm_ key is replaced rather than
 * repeated, and a label is percent-encoded if it ever strays from EMAIL_LABEL.
 */
export function tagEmailLink(href, { medium, campaign, content }) {
  const url = new URL(href);
  const tags = { utm_source: 'email', utm_medium: medium, utm_campaign: campaign, utm_content: content };
  for (const [key, value] of Object.entries(tags)) url.searchParams.set(key, value);
  return url.href;
}
