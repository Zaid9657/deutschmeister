# Owner prompts — paste-ready

Steps that only a browser logged in as the owner can do. Each is a prompt for the
**Claude in Chrome extension** (or a local Claude Code session with the Chrome MCP —
the cloud sessions do not have it). Keep them here so the next launch does not
re-derive them.

## Lemon Squeezy (store 309512 — DeutschMeister, NOT MedMeister)

**Create a product with variants** (used 2026-09-03 for product 1336941):
```
In Lemon Squeezy store 309512 create ONE one-time product "<name>" with variants
<name>=€<price>, … , EUR, tax category "SaaS – personal use". Description: <text>.
Publish. For each variant return the numeric variant id and the checkout share-link UUID.
Do not touch any other product.
```
Then paste the ids to the agent: it sets `LEMONSQUEEZY_<KEY>_VARIANT_ID` (numeric,
functions scope) and `VITE_/PUBLIC_LEMONSQUEEZY_<KEY>_VARIANT_ID` (UUID, builds scope)
via the Netlify connector and redeploys.

**Set the post-purchase redirect** (so buyers land on our success page, not LS's receipt):
```
In store 309512, set product <id>'s "Redirect after purchase" URL to
https://deutsch-meister.de/subscription/success and save.
```

**100 % test discount** (used 2026-09-03: DMTEST100, discount 1120253):
```
Create a discount: name "Internal test purchase", code <CODE>, 100 %, restricted to
product <id>, usage limit 3, expires <date> 23:00 UTC. Confirm it shows Active.
```
Deactivate it afterwards: `Deactivate discount <id> in store 309512.`

**Test purchase** (the agent verifies the `purchases` row in Supabase afterwards):
```
Open https://deutsch-meister.de/pricing/ logged in as <email>. Click "Buy <level>",
apply <CODE>, confirm €0.00, complete checkout. Then open /subscription and
/level/<first sub-level> and screenshot both. Report the LS order number.
```
Note: a €0 order cannot be refunded in LS, so the refund → re-lock path is not covered
by this test.

## Instagram — create and set up the official account

Paste into the **Claude in Chrome extension** (cloud sessions cannot reach
instagram.com). Sibling of the Facebook and YouTube setup prompts; the handle
mirrors the YouTube one (`@deutschmeister_de`) so the five links stay one brand.
Signup OTP, password and captcha are owner-only — the prompt tells the agent to
hand control back rather than guess.

```
You are operating my Chrome browser to create and fully set up the official
Instagram account for DeutschMeister (deutsch-meister.de). Go step by step and
show me the screen before anything irreversible.

BRAND FACTS — use verbatim, invent nothing:
- Display name: DeutschMeister
- Username: deutschmeister_de. If taken, try deutschmeister.de, then
  deutschmeister_lernen. Tell me which one you took — never silently accept
  Instagram's auto-suggested handle.
- Website: https://deutsch-meister.de/?utm_source=instagram&utm_medium=bio
- Category: Education (Bildungswebsite)
- Contact email: zaid@deutsch-meister.de
- Profile picture: download https://deutsch-meister.de/logo.png and upload it,
  centred, nothing cropped off.
- Bio (German, keep the line breaks exactly):
  Deutsch lernen A1–B2 🇩🇪
  Grammatik · Hören · Lesen · Sprechen mit KI
  Von Ärzten in Deutschland gebaut
  👇 Kostenlos starten

STEPS
1. Open instagram.com. If another account is already logged in, use
   "Add account → Create new account" — do not rename or touch that account.
2. Create the account with email zaid@deutsch-meister.de and the name/username
   above. STOP and hand control back to me at: the password field, the email
   confirmation code, any captcha, any phone or 2FA step. Never guess or reuse
   a password.
3. Edit profile → set Name, Username, Bio, Website exactly as above, upload the
   profile picture, save.
4. Settings → Account type and tools → Switch to professional account →
   **Business** (not Creator) → category "Education". Add the contact email so
   the Email button appears on the profile.
5. Accounts Center → link this Instagram account to the DeutschMeister Facebook
   Page, so both publish from Meta Business Suite.
6. Settings pass: account Public; message requests on; story replies on;
   "Show account suggestions on profiles" OFF.
7. Create three empty Story Highlights: Grammatik · Prüfung · Über uns.
8. Post nothing yet. Report back: final profile URL, the exact username taken,
   Business account yes/no, Facebook Page linked yes/no, plus a screenshot of
   the finished profile.

RULES
- One account only. If a step fails twice, stop and tell me what blocked you
  instead of trying alternatives.
- Never enter payment details and never accept a boost/ad flow.
```

**First content batch** (same extension, after the profile exists):
```
Logged in as @deutschmeister_de on instagram.com, upload the video files I attach
as Reels, one at a time. Per Reel: caption = the German hook I give you, ending
with the line "Kostenlos üben: deutsch-meister.de"; cover = the frame with the
on-screen text; no music beyond what the file already carries (copyright).
Pin the best-performing one to the profile grid. Report the Reel URLs.
```

**Repo follow-up once the handle is confirmed** (a code session, not the browser):
add the Instagram URL beside YouTube in `src/data/navigation.js` (`SOCIAL_LINKS`
plus a single exported constant, same regime as `YOUTUBE_CHANNEL_URL`) and to
`ORGANIZATION_FULL.sameAs` in `src/data/organization.js` — and mirror both into
their byte-identical `astro-site/src/data/` twins, or `npm run check:duplicates`
fails.
