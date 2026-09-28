// Builds the Zapier sheet (one row = one post, three channels) from a posts
// JSON. Instagram captions carry no URL (not clickable there) — "Link in Bio";
// Facebook and Telegram carry the UTM-tagged link (docs/tracking-links.md) so
// the weekly truth mail can tell which post brought each signup.
// Usage: node captions.mjs [posts.json] [posts.csv]
import { readFileSync, writeFileSync } from 'node:fs';

const [, , input = 'posts.json', out = 'posts.csv'] = process.argv;
const posts = JSON.parse(readFileSync(new URL(input, import.meta.url)));
const IMG_BASE = 'https://deutsch-meister.de/social/ig/';
const link = (p, source) =>
  `https://deutsch-meister.de${p.link_path}?utm_source=${source}&utm_medium=post&utm_campaign=ig50-2026-10&utm_content=p${p.id}`;

// `status` starts as `queued`; the daily job posts the first queued row and flips it.
const cols = ['post_id', 'status', 'publish_at', 'series', 'image_url', 'alt_text', 'caption_instagram', 'caption_facebook', 'caption_telegram'];
// Alt text derived from the card itself, so it can never describe a different image.
const plain = (t) => String(t).replace(/\[\[(?:NOM|AKK|DAT|GEN):([^\]]+)\]\]/g, '$1');
function altText(p) {
  const parts = [`Lernkarte ${p.series}, ${p.level}: ${plain(p.headline)}`];
  if (p.rows) parts.push(...p.rows.map((r) => `${r.ok ? 'richtig' : 'falsch'}: ${plain(r.text)}`));
  if (p.stats) parts.push(...p.stats.map((s) => `${s.num} ${s.label}`));
  if (p.items) parts.push(...p.items);
  parts.push(plain(p.note));
  return parts.join('. ').replace(/\.\./g, '.').replace(/([?!:,…])\./g, '$1');
}
const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
const rows = posts.map((p) => [
  p.id,
  'queued',
  p.publish_at,
  p.series,
  IMG_BASE + p.id + '.jpg',
  p.alt ?? altText(p),
  `${p.caption}\n\n${p.cta_ig}\n\n${p.hashtags}`,
  `${p.caption}\n\n${p.cta_web} ${link(p, 'facebook')}`,
  `${p.caption_short ?? p.caption}\n\n${p.cta_web} ${link(p, 'telegram')}`,
].map(q).join(','));
writeFileSync(new URL(out, import.meta.url), [cols.join(','), ...rows].join('\n') + '\n');
console.log(rows.length, 'rows →', out);
