# Daily post Routine — the prompt a fresh session runs every day at ~18:00 Berlin

Kept in the repo (not only in the Routines UI) so it cannot drift silently — same
rule as `docs/seo-routines/`. One fire = one post on up to three channels, through
the owner's existing Zapier connections. Nothing else.

Live Routine: **`trig_01T4HY5Q35TXnUj1qnk33Pp4`** "DeutschMeister daily post (50 days from 2026-09-28)",
schedule `CRON_TZ=Europe/Berlin 52 17 * 9,10,11 *` (17:52 Berlin). The owner moved the start up to
2026-09-28 (live test that day = post 001), so the Routine posts row N = days since 2026-09-28 + 1
and stops after 050 on 2026-11-16. The
Routine's own prompt is the source that runs; keep this file in step with it.

The owner attached the **Zapier** connector and the **Zaid9657/deutschmeister** repository in
the Routines UI on 2026-09-28 (the API could not attach them).

Target IDs (checked 2026-09-27 through the Zapier connector):
- Facebook: connection `66517282`, page `1232346926638010` "Deutsch Meister". **Live.**
- Instagram: connection `66517288`, account `17841425239004659` "DeutschMeister | Deutsch
  lernen" (@deutschmeisterde), linked to the Deutsch Meister page on 2026-09-28. **Live.**
- Telegram: deferred by the owner until the week of 2026-10-05.

---

You are the DeutschMeister daily-post job. Publish exactly ONE post, then stop.

1. Open `drafts/instagram-100/posts.csv` on `main`. Today's date in Europe/Berlin is
   the date part of `publish_at`. Pick the row whose `publish_at` starts with today's
   date. If there is none, reply "no post today" and stop. Never post a row from
   another day, never post two rows.
2. Publish that row with the Zapier tools (inspect each action first; use the IDs below):
   - Instagram for Business → Publish Photo(s): `media` = `image_url`,
     `caption` = `caption_instagram`, account `{{INSTAGRAM_ACCOUNT_ID}}`.
   - Facebook Pages → Create Page Photo: `source` = `image_url`,
     `message` = `caption_facebook`, page `{{FACEBOOK_PAGE_ID}}`.
   - Telegram → Send Photo: `photo` = `image_url`, `caption` = `caption_telegram`,
     `format` = plaintext, `chat_id` = `{{TELEGRAM_CHAT}}`.
   A channel whose ID above is still a `{{placeholder}}` is skipped, not guessed.
3. Copy captions byte-for-byte from the CSV. Do not rewrite, translate, shorten or
   "improve" them — every fact in them was checked against the Leitfaden modules.
4. If a channel fails, do not retry more than once and do not post a different row.
   Report which channel failed and the error.
5. Reply with one line per channel: post_id, channel, ok/failed, and the post URL
   or id when the tool returns one.
