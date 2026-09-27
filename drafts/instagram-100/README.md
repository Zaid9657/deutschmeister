# 100 Instagram/Facebook/Telegram posts — Zapier-ready

**Status: 3 samples for owner approval; the other 97 follow after sign-off.**
Class B — nothing here self-publishes until the owner switches the Zap on.

## Format
- Image: **1080×1350 PNG (4:5)** — the tallest ratio the Instagram publishing API
  accepts (Zapier goes through it; 3:4 would be rejected). The new 3:4 profile grid
  only trims the sides, so every card keeps a 96px side margin.
- Brand: `src/data/design-tokens.js` (paper, siegel teal, Fraunces + Nunito Sans,
  hairline rules). Case colours appear only where a case is named (token rule 1).
- Voice: same as `drafts/social-content-atoms-2026-09.md` — du-Form, no outcome
  promises, every exam fact from a checked Leitfaden module.

## Zapier sheet (`samples.csv` → later `posts.csv`)
One row = one post, three channels: `post_id, publish_at, series, image_url,
alt_text, caption_instagram, caption_facebook, caption_telegram`.
Instagram captions say "Link in Bio"; Facebook/Telegram carry a UTM link
(`utm_campaign=ig100-2026-10`, `utm_content=p<id>`) so the weekly truth mail shows
which post brought each signup.

`image_url` points at `https://deutsch-meister.de/social/ig/<id>.png` — the PNGs
move to `public/social/ig/` with the full batch, so a normal deploy hosts them.

## Rebuild
```bash
node render.mjs samples.json samples     # PNGs (fonts are inlined from fonts/)
node captions.mjs samples.json samples.csv
```
