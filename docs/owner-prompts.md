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

**Add the per-sub-level variants** (decision 2026-09-08; product 1336941 already exists):
```
In Lemon Squeezy store 309512, on the existing one-time product 1336941, add three variants:
"German A1.2 Course" = €40, "German A2.1 Course" = €50, "German A2.2 Course" = €50, EUR,
tax category "SaaS – personal use". Publish them. For each new variant return the numeric
variant id and the checkout share-link UUID. Do not touch any other product or variant.
```
Then paste the three id pairs to the agent: it sets `LEMONSQUEEZY_COURSE_A1_2_VARIANT_ID`,
`_A2_1_`, `_A2_2_` (numeric, functions scope) and the `VITE_`/`PUBLIC_` twins (UUID, builds
scope) via the Netlify connector, merges the catalogue PR and redeploys. Afterwards archive the
five 2026-09-03 variants (2088862, 2088867, 2088868, 2088869, 2088871).

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

---

## Run the A1.1 course audio

**Why it needs you.** The recordings are rendered with Azure Neural TTS and written to
Supabase Storage with the service-role key. Neither secret exists in a cloud agent session
(and neither `*.supabase.co` nor Azure is reachable through the agent proxy), so the run
happens on your machine. It takes a couple of minutes and costs single-digit cents.

**Before the first run**, apply the word migration once in the Supabase SQL editor:
`migrations/2026-09-13-a1-1-course-words.sql` — it seeds the 18 Wortfeld words that have no
`words` row yet. The audio script looks each one up by `(german, level)` and writes its
`audio_url`; without the migration those 18 clips fail with
`no words row for "…" at a1.1`.

**Environment** (four variables, nothing else):

```bash
export AZURE_SPEECH_KEY=...            # Azure AI Speech resource key
export AZURE_SPEECH_REGION=westeurope  # the resource's region
export SUPABASE_URL=https://<project>.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=...   # service role — never the anon key
```

**Dry run first** (needs none of the four; calls nothing, writes nothing):

```bash
node scripts/generate-course-audio.mjs a1.1 --dry
```

It prints the plan and the cost before you spend anything:

```
a1.1: 181 clips — 115 dialogue lines, 12 pretest models, 36 Phonetik items, 18 Wortfeld words
a1.1: 4298 characters ≈ 6.88 US cents at $16/1M
…
Summary (dry): rendered 0 / skipped 0 / failed 0 / ≈ 6.88 cents if all 181 are rendered.
```

**The real run:**

```bash
node scripts/generate-course-audio.mjs a1.1
node scripts/generate-example-audio.mjs --table words   # the 31 course words seeded 2026-09-12 have rows but no audio yet
```

Expected last line (first run — the numbers are what you paste back):

```
Summary: rendered 181 / skipped 0 / failed 0 / ≈ 6.88 cents (4298 characters this run).
```

It is idempotent: every manifest entry stores the sha1 of the text it rendered, so a second
run prints `rendered 0 / skipped 181 / failed 0` and re-renders only lines whose German
changed. If it stops early (`Too many failures`), just run it again — it resumes.

**Afterwards, commit the manifest** and sync the Astro twin, or `npm run check:duplicates`
(and CI) fails:

```bash
node scripts/sync-curricula.mjs
git add src/data/curricula/a11.audio.js astro-site/src/data/curricula/a11.audio.js
git commit -m "chore(audio): A1.1 course audio manifest from the Azure run"
```

Then paste the summary line back to the agent. Until the manifest lands, every screen falls
back to the browser voice and honestly labels itself "Computerstimme" instead of "Aufnahme" —
nothing is broken, it is just not yet the promised product.

---

## Course reminder — copy approval + two env flags (P4, 2026-09-13)

`netlify/functions/course-reminder.mjs` mails learners who are mid-course and paused:
latest course activity **20–44 h ago**, inside the last 30 days, **at most 3 reminders per
rolling 7 days**, one claim per learner per day in `lifecycle_emails`. It **ships off** and
cannot send until you do three things — 1 and 2 are yours, 3 is the migration.

**1. Read the copy and say yes or change it.** Controlled **A1 German** (every recipient is an
A1.1 learner — the first version of this mail was B1 and the DaF review of 2026-09-12 §F
rejected it), no pressure, no figures, and no claim about what the learner did or did not do.
Subject and body for a learner whose next step is Lektion 4:

> **Weiter mit Lektion 4: Auf dem Flohmarkt**
>
> Hallo! Du lernst Deutsch — sehr gut.
>
> Lektion 4 heißt **Auf dem Flohmarkt**. Sie ist kurz: ein Schritt pro Bildschirm.
>
> Du kannst jederzeit aufhören. Bis bald.
>
> [ Lektion 4 öffnen → ]  (links to `/course/a1.1`)
>
> — Zaid
>
> _Footer: DeutschMeister · deutsch-meister.de · Diese E-Mails abbestellen_

The greeting is „Hallo!“ while the selection function carries no first name; with one it is
„Hallo Ana, du lernst Deutsch — sehr gut.“ (never „Hallo, du …“, which reads as a vocative).
The Lektion number and title come from the learner's own progress; the fallback for a level
whose titles are not in the mailer yet is „Weiter im Kurs A1.1“, with „Dein Kurs A1.1 geht
weiter. Die Lektionen sind kurz: ein Schritt pro Bildschirm.“ instead of the middle line and no
Lektion named. Nothing in the copy asserts a gap in the learner's practice — the 20-hour floor
makes such a claim impossible to justify, and „du warst vor Kurzem im Kurs“ was exactly that
claim. `tests/course-reminder.test.mjs` fails if a price, a streak threat, the word „gestern“,
an exclamation mark beyond the greeting's, a sentence over 12 words, or any of the three
retired B1 constructions ever enters this copy.

**2. The two environment variables** (Netlify → Site configuration → Environment variables,
**Functions** scope), set in this order:

```
LIFECYCLE_TEST_RECIPIENTS = zaid@deutsch-meister.de      # canary FIRST — only this address is mailed
COURSE_REMINDER_ENABLED   = true                         # the master switch, exactly "true"
```

Already present and reused: `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CAMPAIGN_SECRET`,
`UNSUB_SECRET`. With the canary set, everyone who is not on the list is skipped **and left
unclaimed**, so emptying the list later resumes them from scratch. Watch one or two real
reminders arrive at your own address, then delete `LIFECYCLE_TEST_RECIPIENTS` to go live.

**3. Apply `migrations/2026-09-13-course-reminder.sql`** in the Supabase SQL editor (it widens
the ledger's `kind` CHECK and creates `course_reminder_candidates()`). Until it is applied the
job cannot send even with the flag on — the selection function does not exist and the claim
insert is rejected.

**Dry run any time, sends nothing, claims nothing** (replace `<CAMPAIGN_SECRET>`):

```bash
curl -s "https://deutsch-meister.de/.netlify/functions/course-reminder?dry=1&secret=<CAMPAIGN_SECRET>"
# → {"enabled":true,"dry":true,"kind":"course_reminder_2026-09-14","wouldSend":7}
```

`"enabled":false` means the master switch is not `true`. A dry run is the honest way to see
the queue size before any mail exists.
