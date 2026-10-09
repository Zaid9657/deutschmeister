// Our social channels, for the footer of the learner mails.
//
// THIS IS A SYNCED COPY of SOCIAL_LINKS in src/data/navigation.js, for the same
// reason brand.mjs is one: functions are bundled on their own, and a relative
// import reaching back into src/ is fragile. tests/email-social.test.mjs
// compares the two and fails on drift.
//
// The links are NOT UTM-tagged: utm_* tags describe a click INTO our site, and
// these open Instagram, YouTube and Facebook. The mail link tests therefore
// exempt exactly these hrefs (isSocialHref) and nothing else.

export const SOCIAL_CHANNELS = [
  { key: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@deutschmeister_de' },
  { key: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/deutschmeisterde/' },
  { key: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/1232346926638010' },
];

const SOCIAL_HREFS = new Set(SOCIAL_CHANNELS.map((c) => c.href));
export const isSocialHref = (href) => SOCIAL_HREFS.has(href);

/**
 * One footer line, opening with <br> so it slots under the site link: "Follow
 * us: YouTube · Instagram · Facebook". `lang` follows the mail's own language
 * (the course mails speak Sie-German, the rest English); `color` is the
 * footer's existing link colour. Inline styles only (see brand.mjs).
 */
export function socialFooterLine(color, lang = 'en') {
  const lead = lang === 'de' ? 'Folgen Sie uns' : 'Follow us';
  const links = SOCIAL_CHANNELS.map(
    (c) => `<a href="${c.href}" style="color:${color};">${c.label}</a>`,
  ).join(' · ');
  return `<br>${lead}: ${links}`;
}
