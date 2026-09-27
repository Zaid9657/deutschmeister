// Builds the Zapier sheet (one row = one post, three channels) from a posts
// JSON. Instagram captions carry no URL (not clickable there) — "Link in Bio";
// Facebook and Telegram carry the UTM-tagged link (docs/tracking-links.md) so
// the weekly truth mail can tell which post brought each signup.
// Usage: node captions.mjs samples.json samples.csv
import { readFileSync, writeFileSync } from 'node:fs';

const [, , input = 'samples.json', out = 'samples.csv'] = process.argv;
const posts = JSON.parse(readFileSync(new URL(input, import.meta.url)));
const IMG_BASE = 'https://deutsch-meister.de/social/ig/';
const link = (p, source) =>
  `https://deutsch-meister.de${p.link_path}?utm_source=${source}&utm_medium=post&utm_campaign=ig100-2026-10&utm_content=p${p.id}`;

const cols = ['post_id', 'publish_at', 'series', 'image_url', 'alt_text', 'caption_instagram', 'caption_facebook', 'caption_telegram'];
const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
const rows = posts.map((p) => [
  p.id,
  p.publish_at,
  p.series,
  IMG_BASE + p.id + '.png',
  p.alt,
  `${p.caption}\n\n${p.cta_ig}\n\n${p.hashtags}`,
  `${p.caption}\n\n${p.cta_web} ${link(p, 'facebook')}`,
  `${p.caption_short ?? p.caption}\n\n${p.cta_web} ${link(p, 'telegram')}`,
].map(q).join(','));
writeFileSync(new URL(out, import.meta.url), [cols.join(','), ...rows].join('\n') + '\n');
console.log(rows.length, 'rows →', out);
